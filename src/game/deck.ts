import { pickIndex } from './rng.ts';
import type { Card } from './types.ts';

/** Embaralha (Fisher-Yates) de forma determinística pela semente. Não altera a lista original. */
export function shuffle(cards: Card[], seed: number): Card[] {
  const out = cards.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    const [j, next] = pickIndex(s, i + 1);
    s = next;
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
