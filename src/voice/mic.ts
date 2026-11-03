// Captura do microfone (react-native-audio-api) entregando blocos de áudio PCM 16 bits.
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

const WANTED_RATE = 16000;

export type MicHandlers = {
  /** pcm: áudio Int16 mono; sampleRate: taxa real entregue pelo aparelho. */
  onAudio: (pcm: ArrayBuffer, sampleRate: number) => void;
};

export type Mic = { stop: () => Promise<void> };

function toInt16(input: Float32Array): ArrayBuffer {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer as ArrayBuffer;
}

export async function startMic(handlers: MicHandlers): Promise<Mic> {
  const permission = await AudioManager.requestRecordingPermissions();
  if (permission !== 'Granted') throw new Error('Sem permissão de microfone.');

  AudioManager.setAudioSessionOptions({ iosCategory: 'record', iosMode: 'default', iosOptions: [] });
  await AudioManager.setAudioSessionActivity(true);

  const recorder = new AudioRecorder();
  recorder.onAudioReady(
    { sampleRate: WANTED_RATE, bufferLength: WANTED_RATE * 0.1, channelCount: 1 },
    ({ buffer }) => {
      handlers.onAudio(toInt16(buffer.getChannelData(0)), buffer.sampleRate);
    },
  );
  const result = await recorder.start();
  if (result.status === 'error') throw new Error(result.message);

  return {
    async stop() {
      await recorder.stop();
      recorder.clearOnAudioReady();
      await AudioManager.setAudioSessionActivity(false);
    },
  };
}
