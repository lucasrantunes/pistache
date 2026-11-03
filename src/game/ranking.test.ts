import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankRows, specialTicks } from './ranking.ts';

const players = [
  { id: 'a', name: 'Ana', points: 20 },
  { id: 'b', name: 'Bia', points: 24 },
  { id: 'c', name: 'Caio', points: 25 },
];

test('placar: ordena, mostra ganho e quem subiu ou desceu', () => {
  const rows = rankRows(players, { a: 20, b: 24, c: 11 }, 50);
  assert.deepEqual(rows.map((r) => r.id), ['c', 'b', 'a']);
  assert.equal(rows[0].gained, 14);
  assert.equal(rows[0].move, 2); // era 3º, virou 1º
  assert.equal(rows[1].move, -1); // era 1º, virou 2º
  assert.equal(rows[2].move, -1); // era 2º, virou 3º
  assert.equal(rows[0].remaining, 25);
  assert.equal(rows[0].leader, true);
  assert.equal(rows[1].leader, false);
});

test('placar: empate divide a posição e ninguém ganha coroa', () => {
  const rows = rankRows([{ id: 'a', name: 'Ana', points: 5 }, { id: 'b', name: 'Bia', points: 5 }], {}, 50);
  assert.deepEqual(rows.map((r) => r.rank), [1, 1]);
  assert.ok(rows.every((r) => !r.leader && r.gained === 0 && r.move === 0));
});

test('placar: ninguém pontuou ainda = sem coroa', () => {
  const rows = rankRows([{ id: 'a', name: 'Ana', points: 0 }, { id: 'b', name: 'Bia', points: 0 }], {}, 50);
  assert.ok(rows.every((r) => !r.leader));
});

test('marcas das casas especiais batem com as casas do tabuleiro', () => {
  const t = specialTicks();
  assert.equal(t.length, 7);
  assert.equal(Math.round(t.find((x) => x.kind === 'dobro')!.frac * 50), 12); // casa 6 com meta 50
  assert.equal(t.filter((x) => x.kind === 'bad').length, 4);
});
