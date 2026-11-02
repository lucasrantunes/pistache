export const SQUARES = 25;
export const MAX_CLUES = 20;
export const DEFAULT_GOAL = 50;
export const NO_WINNER_POINTS = 5;
export const STEAL_POINTS = 3;
export const LOSE_POINTS = 3;
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
