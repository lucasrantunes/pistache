// Tempos do jogo (em segundos, salvo quando o nome diz ms).

/** Cada dica dura no máximo isto, falem ou não. A fala não zera o relógio. */
export const CLUE_SECONDS = 25;
export const CLUE_MS = CLUE_SECONDS * 1000;
/** Abaixo disto o relógio fica laranja; abaixo do segundo, vermelho. */
export const CLUE_WARN_SECONDS = 10;
export const CLUE_DANGER_SECONDS = 5;

/** Tempo que a TV e o celular esperam alguém dizer o nome de quem acertou (ou de quem chegou mais perto). */
export const NAME_WINDOW_SECONDS = 10;

// Quanto tempo cada tela fica sozinha antes de avançar. O botão de cada tela avança na hora.
export const AUTO_SECONDS = {
  /** "Acertou!": palavra em destaque e peão andando. */
  answer: 5,
  /** Casa especial (azar, dobro, ladrão, turbo): tempo de rir e ler. */
  effect: 6,
  /** Fim de jogo: começa outra partida com os mesmos jogadores. */
  playAgain: 30,
} as const;

export type ClueLevel = 'ok' | 'warn' | 'danger';

export interface ClueTimer {
  leftMs: number;
  /** Segundos que faltam, arredondados para cima (25, 24, ... 1, 0). */
  secondsLeft: number;
  /** Quanto resta do tempo (1 = cheio, 0 = acabou). */
  fraction: number;
  level: ClueLevel;
  expired: boolean;
}

/** Estado do relógio da dica, dado o tempo corrido (sem contar pausas). */
export function clueTimer(elapsedMs: number): ClueTimer {
  const leftMs = Math.min(CLUE_MS, Math.max(0, CLUE_MS - elapsedMs));
  const secondsLeft = Math.ceil(leftMs / 1000);
  const level: ClueLevel = secondsLeft <= CLUE_DANGER_SECONDS ? 'danger' : secondsLeft <= CLUE_WARN_SECONDS ? 'warn' : 'ok';
  return { leftMs, secondsLeft, fraction: leftMs / CLUE_MS, level, expired: leftMs === 0 };
}
