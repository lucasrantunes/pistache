import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shuffle } from './deck.ts';
import { CLUE_MS, clueTimer } from './timing.ts';
import { GOAL_OPTIONS, estimatedCards, estimatedMinutes, losePoints, stealPoints } from './board.ts';
import type { Card } from './types.ts';

test('relógio da dica: 25 s, cores e fim', () => {
  const t0 = clueTimer(0);
  assert.equal(t0.secondsLeft, 25);
  assert.equal(t0.level, 'ok');
  assert.equal(t0.fraction, 1);
  assert.equal(clueTimer(14_000).level, 'ok'); // 11 s restantes
  assert.equal(clueTimer(15_000).level, 'warn'); // 10 s
  assert.equal(clueTimer(20_000).level, 'danger'); // 5 s
  assert.equal(clueTimer(CLUE_MS - 1).secondsLeft, 1);
  assert.equal(clueTimer(CLUE_MS - 1).expired, false);
  assert.equal(clueTimer(CLUE_MS).expired, true);
  assert.equal(clueTimer(CLUE_MS + 9_000).secondsLeft, 0);
  assert.equal(clueTimer(-5).secondsLeft, 25);
});

test('metas: de 70 a 200 e efeitos proporcionais', () => {
  assert.deepEqual([...GOAL_OPTIONS], [70, 100, 150, 200]);
  assert.equal(losePoints(50), 3);
  assert.equal(stealPoints(70), 4);
  assert.equal(stealPoints(100), 6);
  assert.equal(losePoints(200), 12);
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

test('estimativa de cartas e tempo cresce com a meta e com os jogadores', () => {
  assert.ok(estimatedCards(70, 4) < estimatedCards(200, 4));
  assert.ok(estimatedCards(100, 2) < estimatedCards(100, 8));
  assert.ok(estimatedCards(200, 10) <= 160);
  assert.equal(estimatedMinutes(70, 4) % 5, 0);
  assert.equal(estimatedMinutes(70, 4), 10);
  assert.ok(estimatedMinutes(200, 4) >= 25 && estimatedMinutes(200, 4) <= 35);
});

test('effectCard: tom, título e frases com o nome', async () => {
  const { effectCard } = await import('./describe.ts');
  const players = [
    { id: 'p1', name: 'Ana', points: 0, doubleNext: false, muteNext: false },
    { id: 'p2', name: 'Bia', points: 0, doubleNext: false, muteNext: false },
  ];
  assert.equal(effectCard(null, players, 'p1'), null);
  const bad = effectCard({ kind: 'lose3', amount: 4 }, players, 'p1', 0)!;
  assert.equal(bad.tone, 'bad');
  assert.equal(bad.title, 'AZAR!');
  assert.equal(bad.value, '−4');
  assert.ok(bad.text.includes('Ana') && bad.text.includes('4'));
  const good = effectCard({ kind: 'ladrao', amount: 3, targetId: 'p2' }, players, 'p1', 1)!;
  assert.equal(good.tone, 'good');
  assert.ok(good.text.includes('Ana') && good.text.includes('Bia'));
  const bank = effectCard({ kind: 'ladrao', amount: 3 }, players, 'p1')!;
  assert.ok(bank.text.includes('banco'));
  assert.equal(effectCard({ kind: 'dobro' }, players, 'p1')!.value, 'x2');
});
