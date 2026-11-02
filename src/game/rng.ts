/** Sorteio determinístico (mulberry32): mesma semente, mesmo resultado. Devolve [valor 0..1, nova semente]. */
export function nextRandom(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** Índice sorteado de 0 a n-1. Devolve [índice, nova semente]. */
export function pickIndex(seed: number, n: number): [number, number] {
  const [v, s] = nextRandom(seed);
  return [Math.min(n - 1, Math.floor(v * n)), s];
}
