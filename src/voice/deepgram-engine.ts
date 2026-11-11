// Motor Deepgram para a tela de teste: microfone -> filtro de silêncio -> Deepgram (Nova-3, pt-BR).
import { openDeepgram } from './deepgram';
import type { DeepgramAuth, DeepgramConnection } from './deepgram';
import type { EngineHandlers, EngineStats, InfoRow, VoiceEngine } from './engine';
import { startMic } from './mic';
import type { Mic } from './mic';
import { fetchVoiceToken, hasVoiceServer } from './token';
import { VoiceActivityGate, splitFrames } from './voice-activity';

const KEY = process.env.EXPO_PUBLIC_DEEPGRAM_KEY ?? '';

export function createDeepgramEngine(h: EngineHandlers): VoiceEngine {
  let mic: Mic | null = null;
  let dg: DeepgramConnection | null = null;
  let gate = new VoiceActivityGate();
  let gateOn = true;
  let running = false;
  let rate = 0;
  let sentSamples = 0;
  let capturedSamples = 0;

  async function stop() {
    running = false;
    dg?.close();
    dg = null;
    const m = mic;
    mic = null;
    try {
      await m?.stop();
    } catch {
      // já parado
    }
    h.onStatus('off');
  }

  async function fail(message: string) {
    h.onError(message);
    await stop();
    h.onStatus('error');
  }

  async function start() {
    if (running) return;
    running = true;
    sentSamples = 0;
    capturedSamples = 0;
    gate = new VoiceActivityGate();
    h.onStatus('connecting');
    if (!KEY && !hasVoiceServer()) {
      await fail('Falta configurar o .env.local (Supabase ou chave da Deepgram).');
      return;
    }
    let auth: DeepgramAuth;
    try {
      auth = hasVoiceServer() ? { kind: 'bearer', value: await fetchVoiceToken() } : { kind: 'key', value: KEY };
    } catch (e) {
      await fail(e instanceof Error ? e.message : String(e));
      return;
    }
    h.onSession();
    let connection: DeepgramConnection | null = null;
    try {
      mic = await startMic({
        onAudio: (pcm, sampleRate) => {
          if (!running) return;
          if (!connection) {
            rate = sampleRate;
            connection = openDeepgram(auth, sampleRate, {
              onOpen: () => h.onStatus('on'),
              onTranscript: (text, isFinal) => h.onText(text, isFinal),
              onClose: (reason) => void fail(`Conexão ${reason}`),
              onError: (message) => h.onError(message),
            });
            dg = connection;
          }
          capturedSamples += pcm.byteLength / 2;
          for (const { frame, rms } of splitFrames(pcm, sampleRate)) {
            if (!gateOn) {
              sentSamples += frame.byteLength / 2;
              connection.sendAudio(frame);
              continue;
            }
            const r = gate.push(frame, rms);
            for (const f of r.send) {
              sentSamples += f.byteLength / 2;
              connection.sendAudio(f);
            }
            if (r.finalize) connection.finalize();
          }
        },
      });
      if (!running) await stop();
    } catch (e) {
      await fail(e instanceof Error ? e.message : String(e));
    }
  }

  async function describe(): Promise<InfoRow[]> {
    return [
      { label: 'Tecnologia', value: 'Deepgram Nova-3 (nuvem, WebSocket)' },
      { label: 'Idioma', value: 'pt-BR' },
      { label: 'Captura do microfone', value: 'react-native-audio-api, PCM 16 bits mono' },
      { label: 'Credencial', value: hasVoiceServer() ? 'token temporário (Supabase)' : KEY ? 'chave local (.env.local)' : 'não configurada' },
      { label: 'Filtro de silêncio', value: gateOn ? 'ligado (só fala é enviada)' : 'desligado (tudo é enviado)' },
      { label: 'Taxa do microfone', value: rate ? `${rate} Hz` : 'ainda não medida' },
      { label: 'Texto parcial', value: 'sim (interim_results)' },
    ];
  }

  function stats(): EngineStats {
    return {
      restarts: 0,
      gapAvgMs: null,
      gapMaxMs: null,
      capturedSec: rate ? Math.round(capturedSamples / rate) : 0,
      sentSec: rate ? Math.round(sentSamples / rate) : 0,
    };
  }

  return {
    id: 'deepgram',
    start,
    stop,
    describe,
    stats,
    setSilenceFilter: (on) => {
      gateOn = on;
    },
  };
}
