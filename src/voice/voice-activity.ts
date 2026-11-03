/** Duration of each PCM frame produced by the capture worklet. */
export const VOICE_FRAME_MS = 20;

export type VoiceGateOptions = {
  /** Audio kept from before speech starts, so the first syllable is not cut. */
  preRollMs: number;
  /** Quiet time after speech before the gate closes and asks for a final transcript. */
  hangoverMs: number;
  /** Lowest RMS treated as speech, even in a very quiet room. */
  minThreshold: number;
  /** Speech must be this many times louder than the measured background noise. */
  noiseMultiplier: number;
  /** Consecutive loud frames needed to open the gate (filters clicks). */
  startFrames: number;
};

export const DEFAULT_VOICE_GATE_OPTIONS: VoiceGateOptions = {
  preRollMs: 300,
  hangoverMs: 600,
  minThreshold: 0.01,
  noiseMultiplier: 2.5,
  startFrames: 2,
};

export type VoiceGateResult = {
  /** Frames to stream now, oldest first. */
  send: ArrayBuffer[];
  /** True when speech just ended and the transcript should be finalized. */
  finalize: boolean;
};

/**
 * Energy-based voice activity gate. It only lets speech (plus a short pre-roll
 * and hangover) through, so silence is never streamed to the paid transcriber.
 * When in doubt it stays open: noise is only learned slowly, so a loud room
 * streams more instead of dropping words.
 */
export class VoiceActivityGate {
  private readonly options: VoiceGateOptions;
  private readonly preRollFrames: number;
  private preRoll: ArrayBuffer[] = [];
  private speaking = false;
  private loudFrames = 0;
  private quietMs = 0;
  private noiseFloor = 0;

  constructor(options: Partial<VoiceGateOptions> = {}) {
    this.options = { ...DEFAULT_VOICE_GATE_OPTIONS, ...options };
    this.preRollFrames = Math.max(1, Math.round(this.options.preRollMs / VOICE_FRAME_MS));
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }

  push(frame: ArrayBuffer, rms: number): VoiceGateResult {
    const threshold = Math.max(this.options.minThreshold, this.noiseFloor * this.options.noiseMultiplier);
    const loud = rms >= threshold;

    // The floor drops fast to quiet levels and rises slowly, so steady noise (a fan, a TV)
    // is learned in ~10 s while short bursts of speech barely move it.
    this.noiseFloor += (rms - this.noiseFloor) * (rms < this.noiseFloor ? 0.1 : 0.003);

    if (!this.speaking) {
      this.preRoll.push(frame);
      if (this.preRoll.length > this.preRollFrames) this.preRoll.shift();
      this.loudFrames = loud ? this.loudFrames + 1 : 0;
      if (this.loudFrames < this.options.startFrames) return { send: [], finalize: false };

      this.speaking = true;
      this.quietMs = 0;
      const send = this.preRoll;
      this.preRoll = [];
      return { send, finalize: false };
    }

    this.quietMs = loud ? 0 : this.quietMs + VOICE_FRAME_MS;
    if (this.quietMs < this.options.hangoverMs) return { send: [frame], finalize: false };

    this.speaking = false;
    this.loudFrames = 0;
    return { send: [frame], finalize: true };
  }
}

/** Quebra áudio Int16 em quadros de 20 ms, cada um com seu RMS (0 a 1). */
export function splitFrames(pcm: ArrayBuffer, sampleRate: number): { frame: ArrayBuffer; rms: number }[] {
  const samples = new Int16Array(pcm);
  const size = Math.max(1, Math.round((sampleRate * VOICE_FRAME_MS) / 1000));
  const out: { frame: ArrayBuffer; rms: number }[] = [];
  for (let start = 0; start + size <= samples.length; start += size) {
    const part = samples.slice(start, start + size);
    let energy = 0;
    for (let i = 0; i < part.length; i++) {
      const v = part[i] / 32768;
      energy += v * v;
    }
    out.push({ frame: part.buffer as ArrayBuffer, rms: Math.sqrt(energy / part.length) });
  }
  return out;
}
