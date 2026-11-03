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

/**
 * Monta o baralho da partida: só as categorias escolhidas (vazio = todas), embaralhado pela semente.
 * Cartas já jogadas (`playedIds`, guardadas no aparelho) vão para o fim, para o baralho nunca acabar antes da hora.
 */
export function buildDeck(cards: Card[], categoryIds: string[], seed: number, playedIds: string[] = []): Card[] {
  const pool = categoryIds.length ? cards.filter((c) => categoryIds.includes(c.categoria)) : cards;
  const played = new Set(playedIds);
  const fresh = pool.filter((c) => !played.has(c.id));
  const old = pool.filter((c) => played.has(c.id));
  return [...shuffle(fresh, seed), ...shuffle(old, seed + 1)];
}
