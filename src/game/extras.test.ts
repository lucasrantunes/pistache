import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shuffle } from './deck.ts';
import { IDLE_ADVANCE_MS, IDLE_WARN_MS, idleState } from './idle.ts';
import type { Card } from './types.ts';

test('inatividade: calmo, contagem e avanço', () => {
  assert.deepEqual(idleState(0), { kind: 'quiet', secondsToWarn: 20 });
  assert.deepEqual(idleState(IDLE_WARN_MS), { kind: 'countdown', secondsLeft: 10 });
  assert.deepEqual(idleState(IDLE_ADVANCE_MS - 1), { kind: 'countdown', secondsLeft: 1 });
  assert.deepEqual(idleState(IDLE_ADVANCE_MS), { kind: 'advance' });
});

const cards = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}` }) as unknown as Card);

test('embaralhar: mesma semente, mesma ordem; mantém todas as cartas', () => {
  const a = shuffle(cards, 42).map((c) => c.id);
  const b = shuffle(cards, 42).map((c) => c.id);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort(), cards.map((c) => c.id).sort());
  assert.notDeepEqual(shuffle(cards, 1).map((c) => c.id), shuffle(cards, 2).map((c) => c.id));
  assert.deepEqual(cards.map((c) => c.id), ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']);
});

import { buildDeck } from './deck.ts';

const mk = (id: string, categoria: string) => ({ id, categoria, resposta: id, aliases: [], dicas: [], dificuldade: 1 as const });
const pool = [mk('a1', 'a'), mk('a2', 'a'), mk('b1', 'b'), mk('c1', 'c')];

test('baralho: só as categorias escolhidas (vazio = todas)', () => {
  assert.deepEqual(buildDeck(pool, ['a'], 5).map((c) => c.id).sort(), ['a1', 'a2']);
  assert.equal(buildDeck(pool, [], 5).length, 4);
});

test('baralho: cartas já jogadas vão para o fim, sem sumir', () => {
  const deck = buildDeck(pool, [], 5, ['a1', 'b1']).map((c) => c.id);
  assert.equal(deck.length, 4);
  assert.deepEqual(deck.slice(0, 2).sort(), ['a2', 'c1']);
  assert.deepEqual(deck.slice(2).sort(), ['a1', 'b1']);
});
