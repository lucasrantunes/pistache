export const SQUARES = 25;
export const MAX_CLUES = 20;
/** Metas oferecidas na tela inicial (a partir de 70; acima de 200 o baralho pode acabar e a partida passa de 1 hora). */
export const GOAL_OPTIONS = [70, 100, 150, 200] as const;
export const MIN_GOAL = GOAL_OPTIONS[0];
export const MAX_GOAL = GOAL_OPTIONS[GOAL_OPTIONS.length - 1];
export const DEFAULT_GOAL = MIN_GOAL;
export const NO_WINNER_POINTS = 5;
/** Azar "perde pontos" e Ladrão "rouba pontos": 3 na meta 50, proporcional nas outras (4 na 70, 12 na 200). */
export const stealPoints = (goal: number): number => Math.max(1, Math.round((3 * goal) / 50));
export const losePoints = (goal: number): number => stealPoints(goal);
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

export type SpecialKind = 'bad' | 'dobro' | 'ladrao' | 'turbo';

// Casas especiais fixas (decisão 30).
export const SPECIAL_SQUARES: Record<number, SpecialKind> = {
  3: 'bad',
  6: 'dobro',
  9: 'bad',
  13: 'ladrao',
  17: 'bad',
  20: 'turbo',
  23: 'bad',
};

/** Pontos de uma dica: a 1ª vale 20, a 20ª vale 1. */
export const cluePoints = (clue: number): number => MAX_CLUES + 1 - clue;

/** Casa (0 a 25) para uma quantidade de pontos. A meta equivale à casa 25. */
export const squareOf = (points: number, goal: number): number =>
  Math.min(SQUARES, Math.floor((points * SQUARES) / goal));

/**
 * Estimativa de quantas cartas uma partida usa (para avisar quando o baralho é pequeno e mostrar o tempo).
 * Média de 9 pontos por carta; o líder fica com uma fatia que cai com o número de jogadores
 * (cerca de 55% com 2 jogadores, 15% com 10). É só uma conta aproximada.
 */
export function estimatedCards(goal: number, players: number): number {
  const share = Math.min(0.55, Math.max(0.15, 1.5 / Math.max(1, players)));
  return Math.ceil(goal / (9 * share));
}

/** Minutos aproximados, de 5 em 5. */
export function estimatedMinutes(goal: number, _players: number): number {
  // Medido em partida: meta 70 leva cerca de 10 min; o tempo cresce com a meta (não com o nº de jogadores).
  return Math.max(5, Math.round(goal / 7 / 5) * 5);
}
