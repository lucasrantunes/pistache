// Peão andando casa por casa (lógica pura; a TV só desenha). Funciona para frente e para trás.

/** Casas por onde o peão passa de `from` até `to`, sem contar a de saída. Vazio se ficar parado. */
export function walkPath(from: number, to: number): number[] {
  const out: number[] = [];
  const step = to >= from ? 1 : -1;
  for (let sq = from + step; step > 0 ? sq <= to : sq >= to; sq += step) out.push(sq);
  return out;
}

export const WALK_STEP_MS = 280;
export const WALK_MAX_MS = 3000;
const WALK_MIN_STEP_MS = 90;

/** Tempo de cada passo: 280 ms, mais rápido quando são muitas casas para caber em 3 s. */
export function walkStepMs(steps: number): number {
  if (steps <= 0) return WALK_STEP_MS;
  return Math.max(WALK_MIN_STEP_MS, Math.min(WALK_STEP_MS, Math.floor(WALK_MAX_MS / steps)));
}
