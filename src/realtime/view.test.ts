import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reduce, createInitialState } from '../game/reduce.ts';
import type { Card } from '../game/types.ts';
import { isValidCode, newRoomCode, normalizeCode } from './code.ts';
import { toView } from './view.ts';

const cards: Card[] = [{
  id: 'c', categoria: 'coisa', resposta: 'Segredo', aliases: [], dificuldade: 1,
  dicas: Array.from({ length: 20 }, (_, i) => `dica ${i + 1}`),
}];
const extras = { paused: false, heard: false, guesses: ['a', 'b', 'c', 'd', 'e', 'f'], colors: ['#111', '#222'] };
const start = () => reduce(createInitialState(), { type: 'START', names: ['Ana', 'Bia'], cards, seed: 1 });

test('a resposta NÃO vai para a TV durante as dicas', () => {
  const v = toView(start(), extras);
  assert.equal(v.answer, null);
  assert.equal(v.clueText, 'dica 1');
  assert.ok(!JSON.stringify(v).includes('Segredo'));
});

test('a resposta aparece só depois do acerto', () => {
  const v = toView(reduce(start(), { type: 'CORRECT', playerId: 'p1' }), extras);
  assert.equal(v.answer, 'Segredo');
  assert.equal(v.clueText, null);
  assert.equal(v.result?.winnerName, 'Ana');
  assert.equal(v.result?.gained, 20);
  assert.equal(v.leaderId, 'p1');
});

test('palpites limitados a 5 e cores dos jogadores', () => {
  const v = toView(start(), extras);
  assert.deepEqual(v.guesses, ['b', 'c', 'd', 'e', 'f']);
  assert.equal(v.players[1].color, '#222');
  assert.equal(v.leaderId, null);
});

test('código de sala', () => {
  assert.equal(newRoomCode(() => 0), 'BBBB');
  assert.ok(isValidCode(newRoomCode()));
  assert.equal(normalizeCode(' ab-c d9e '), 'ABCD');
  assert.ok(!isValidCode('AB1D'));
});

test('a TV mostra o nome da categoria quando ele é enviado', () => {
  assert.equal(toView(start(), { ...extras, categoryLabel: 'Esporte/Música' }).category, 'Esporte/Música');
  assert.equal(toView(start(), extras).category, 'coisa');
});
