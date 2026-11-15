import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ReadingCollector, compareReading } from './reading.ts';

test('texto idêntico dá 100%', () => {
  const r = compareReading('Quem acerta primeiro ganha, Pistache!', 'quem acerta primeiro ganha pistache');
  assert.equal(r.accuracy, 1);
  assert.equal(r.correct, 5);
  assert.equal(r.problems.length, 0);
  assert.equal(r.magicExpected, 1);
  assert.equal(r.magicHeard, 1);
});

test('conta palavra perdida', () => {
  const r = compareReading('o gato subiu no telhado', 'o gato subiu telhado');
  assert.equal(r.refWords, 5);
  assert.equal(r.missing, 1);
  assert.equal(r.extra, 0);
  assert.equal(r.correct, 4);
  assert.deepEqual(r.problems, [{ expected: 'no', heard: '' }]);
});

test('conta palavra a mais e palavra trocada', () => {
  const extra = compareReading('o gato subiu', 'o gato subiu alto');
  assert.equal(extra.extra, 1);
  assert.deepEqual(extra.problems, [{ expected: '', heard: 'alto' }]);
  const troca = compareReading('o gato subiu', 'o rato subiu');
  assert.equal(troca.substituted, 1);
  assert.deepEqual(troca.problems, [{ expected: 'gato', heard: 'rato' }]);
});

test('a tolerância do jogo aceita pequenos erros de grafia', () => {
  const r = compareReading('machu picchu fica no peru', 'machu pichu fica no peru');
  assert.equal(r.substituted, 1);
  assert.ok(r.accuracy < r.lenientAccuracy);
  assert.equal(r.lenientAccuracy, 1);
});

test('nada entendido dá 0%', () => {
  const r = compareReading('uma duas três', '');
  assert.equal(r.accuracy, 0);
  assert.equal(r.missing, 3);
});

test('coletor junta parciais e finais, e uma escuta nova fecha a frase em andamento', () => {
  const c = new ReadingCollector();
  c.push('oi', false);
  c.push('oi pessoal', true);
  c.push('hoje é', false);
  c.newSession();
  c.push('festa', true);
  assert.equal(c.text(), 'oi pessoal hoje é festa');
  assert.equal(c.sessions, 2);
  c.reset();
  assert.equal(c.text(), '');
});
