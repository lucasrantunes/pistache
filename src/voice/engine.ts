// Formato comum dos motores de voz (Deepgram e reconhecimento nativo do aparelho).
// Hoje só a tela de teste (src/app/voz.tsx) usa isto; o jogo continua com session.ts.

export type EngineId = 'deepgram' | 'native';
export type EngineStatus = 'off' | 'connecting' | 'on' | 'restarting' | 'error';

/** Linha da tabela "Tecnologia em uso" na tela de teste. */
export type InfoRow = { label: string; value: string };

export type EngineStats = {
  /** Quantas vezes a escuta foi religada (só o motor nativo). */
  restarts: number;
  /** Vão entre o fim de uma escuta e o começo da próxima, em ms. */
  gapAvgMs: number | null;
  gapMaxMs: number | null;
  /** Áudio captado e enviado em segundos (só o Deepgram). */
  capturedSec: number | null;
  sentSec: number | null;
};

export type EngineHandlers = {
  onStatus: (status: EngineStatus) => void;
  /** Texto entendido. Parcial enquanto a pessoa ainda fala; final quando o motor fecha a frase. */
  onText: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  /** Aviso sem gravidade para o registro (reinício, silêncio...). */
  onNote: (message: string) => void;
  /** Começou uma escuta nova: o texto parcial recomeça do zero. */
  onSession: () => void;
};

export type VoiceEngine = {
  id: EngineId;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  /** Tecnologia, idioma, modo e capacidades. Pode ser chamado antes de começar. */
  describe: () => Promise<InfoRow[]>;
  stats: () => EngineStats;
  /** Só Deepgram: liga ou desliga o filtro de silêncio. */
  setSilenceFilter?: (on: boolean) => void;
  /** Só Android nativo: abre o download do modelo pt-BR para uso sem internet. */
  downloadModel?: () => Promise<string>;
};
