// Motor nativo para a tela de teste: reconhecimento de fala do próprio aparelho
// (iOS: SFSpeechRecognizer da Apple; Android: SpeechRecognizer do Google) via expo-speech-recognition.
// O módulo é carregado só quando precisa (não existe no Expo Go).
import { Platform } from 'react-native';

import type { EngineHandlers, EngineStats, InfoRow, VoiceEngine } from './engine';

/** O iOS corta cada escuta em ~1 minuto: religamos antes, para não perder palavra no corte. */
const IOS_RESTART_MS = 50_000;
/** Proteção contra laço: 6 encerramentos em 5 s paramos e mostramos erro. */
const LOOP_WINDOW_MS = 5000;
const LOOP_MAX = 6;
const FATAL_ERRORS = ['not-allowed', 'service-not-allowed', 'language-not-supported'];
const QUIET_ERRORS = ['no-speech', 'speech-timeout'];

export type NativeOptions = {
  /** true = só no aparelho (sem internet); false = o sistema escolhe (pode usar a nuvem). */
  onDevice: boolean;
  /** Palavras que o sistema deve favorecer (ex.: "Pistache"). Vazio = sem dicas. */
  hints: string[];
};

type Lib = typeof import('expo-speech-recognition');
type Subscription = { remove: () => void };

export function createNativeEngine(h: EngineHandlers, options: NativeOptions): VoiceEngine {
  let lib: Lib | null = null;
  let wanted = false;
  let subs: Subscription[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let nextReason = 'o sistema encerrou';
  let gapStart: number | null = null;
  const gaps: number[] = [];
  let restarts = 0;
  let recentEnds: number[] = [];

  function clearTimers() {
    clearTimeout(timer);
    timer = undefined;
  }

  async function stop() {
    wanted = false;
    clearTimers();
    for (const s of subs) s.remove();
    subs = [];
    try {
      lib?.ExpoSpeechRecognitionModule.abort();
    } catch {
      // já parado
    }
    h.onStatus('off');
  }

  async function fatal(message: string) {
    h.onError(message);
    await stop();
    h.onStatus('error');
  }

  function begin() {
    if (!wanted || !lib) return;
    h.onSession();
    try {
      lib.ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        addsPunctuation: false,
        requiresOnDeviceRecognition: options.onDevice,
        contextualStrings: options.hints.length > 0 ? options.hints : undefined,
      });
    } catch (e) {
      void fatal(e instanceof Error ? e.message : String(e));
    }
  }

  async function start() {
    if (wanted) return;
    h.onStatus('connecting');
    try {
      lib = await import('expo-speech-recognition');
    } catch {
      await fatal('Reconhecimento nativo indisponível neste app (precisa do build de desenvolvimento novo).');
      return;
    }
    const M = lib.ExpoSpeechRecognitionModule;
    const permission = await M.requestPermissionsAsync();
    if (!permission.granted) {
      await fatal('Sem permissão de microfone ou de reconhecimento de fala.');
      return;
    }
    wanted = true;
    restarts = 0;
    gaps.length = 0;
    gapStart = null;
    recentEnds = [];
    nextReason = 'o sistema encerrou';

    subs = [
      M.addListener('start', () => {
        if (gapStart !== null) {
          gaps.push(Date.now() - gapStart);
          gapStart = null;
        }
        h.onStatus('on');
        clearTimers();
        if (Platform.OS === 'ios') {
          timer = setTimeout(() => {
            nextReason = 'preventivo (limite de 1 min do iOS)';
            try {
              M.stop();
            } catch {
              // já parado
            }
          }, IOS_RESTART_MS);
        }
      }),
      M.addListener('result', (event) => {
        const text = event.results[0]?.transcript?.trim();
        if (text) h.onText(text, event.isFinal === true);
      }),
      M.addListener('error', (event) => {
        const code = String(event.error);
        if (code === 'aborted') return;
        if (QUIET_ERRORS.includes(code)) {
          nextReason = 'silêncio';
          return;
        }
        nextReason = `erro ${code}`;
        if (FATAL_ERRORS.includes(code)) {
          void fatal(`${code}: ${event.message}`);
          return;
        }
        h.onError(`${code}: ${event.message}`);
      }),
      M.addListener('end', () => {
        if (!wanted) return;
        clearTimers();
        const now = Date.now();
        recentEnds = [...recentEnds.filter((t) => now - t < LOOP_WINDOW_MS), now];
        if (recentEnds.length >= LOOP_MAX) {
          void fatal('A escuta encerra logo ao ligar (reiniciou 6 vezes em 5 s). Parei.');
          return;
        }
        restarts += 1;
        gapStart = now;
        h.onNote(`Reinício #${restarts}: ${nextReason}`);
        nextReason = 'o sistema encerrou';
        h.onStatus('restarting');
        setTimeout(begin, 30);
      }),
    ];
    begin();
  }

  async function describe(): Promise<InfoRow[]> {
    const rows: InfoRow[] = [
      {
        label: 'Tecnologia',
        value: Platform.OS === 'ios' ? 'Apple SFSpeechRecognizer (expo-speech-recognition)' : 'Google SpeechRecognizer (expo-speech-recognition)',
      },
      { label: 'Idioma', value: 'pt-BR' },
      { label: 'Pedido ao sistema', value: options.onDevice ? 'só no aparelho (sem internet)' : 'padrão do sistema (pode usar a nuvem)' },
      { label: 'Dicas de vocabulário', value: options.hints.length > 0 ? options.hints.join(', ') : 'desligadas' },
      { label: 'Reinício automático', value: Platform.OS === 'ios' ? `sim, a cada ${IOS_RESTART_MS / 1000} s e quando o sistema encerra` : 'sim, quando o sistema encerra' },
    ];
    let module: Lib['ExpoSpeechRecognitionModule'];
    try {
      module = (lib ?? (await import('expo-speech-recognition'))).ExpoSpeechRecognitionModule;
    } catch {
      rows.push({ label: 'Módulo nativo', value: 'NÃO instalado neste app (gere o build novo)' });
      return rows;
    }
    const safe = <T,>(fn: () => T): string => {
      try {
        return String(fn());
      } catch {
        return 'indisponível';
      }
    };
    rows.push({ label: 'Reconhecimento disponível', value: safe(() => module.isRecognitionAvailable()) });
    rows.push({ label: 'Suporta no aparelho', value: safe(() => module.supportsOnDeviceRecognition()) });
    if (Platform.OS === 'android') {
      rows.push({ label: 'Serviço de voz (Android)', value: safe(() => module.getDefaultRecognitionService().packageName) });
      try {
        const info = await module.getSupportedLocales({});
        rows.push({ label: 'Modelo pt-BR no aparelho', value: info.installedLocales.some((l) => l.toLowerCase().startsWith('pt-br')) ? 'instalado' : 'não instalado' });
      } catch {
        rows.push({ label: 'Modelo pt-BR no aparelho', value: 'não foi possível checar' });
      }
    }
    return rows;
  }

  async function downloadModel(): Promise<string> {
    if (Platform.OS !== 'android') return 'Só existe no Android.';
    try {
      const l = lib ?? (await import('expo-speech-recognition'));
      const result = await l.ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: 'pt-BR' });
      return `Download pt-BR: ${result.status}`;
    } catch (e) {
      return `Falhou: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  function stats(): EngineStats {
    return {
      restarts,
      gapAvgMs: gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
      gapMaxMs: gaps.length > 0 ? Math.max(...gaps) : null,
      capturedSec: null,
      sentSec: null,
    };
  }

  return { id: 'native', start, stop, describe, stats, downloadModel: Platform.OS === 'android' ? downloadModel : undefined };
}
