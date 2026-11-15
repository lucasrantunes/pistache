import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SegmentAdapter } from './segments.ts';

test('texto acumulado (iPhone): cada fala vira só o trecho novo', () => {
  const a = new SegmentAdapter(true);
  assert.deepEqual(a.push('pistache', false, 0), [{ text: 'pistache', isFinal: false }]);
  assert.deepEqual(a.flush(500), []);
  assert.deepEqual(a.flush(900), [{ text: 'pistache', isFinal: true }]);
  assert.deepEqual(a.push('pistache a capivara', false, 2000), [{ text: 'a capivara', isFinal: false }]);
  assert.deepEqual(a.flush(3000), [{ text: 'a capivara', isFinal: true }]);
  // a palavra mágica dita de novo depois do trecho já fechado volta a aparecer
  assert.deepEqual(a.push('pistache a capivara pistache', false, 4000), [{ text: 'pistache', isFinal: false }]);
});

test('o final do motor depois do fechamento por silêncio não repete a frase', () => {
  const a = new SegmentAdapter(true);
  a.push('pistache', false, 0);
  a.flush(1000);
  assert.deepEqual(a.push('pistache', true, 1100), []);
});

test('segmentos separados (Android): a mesma palavra dita de novo conta', () => {
  const a = new SegmentAdapter(false);
  assert.deepEqual(a.push('pistache', false, 0), [{ text: 'pistache', isFinal: false }]);
  assert.deepEqual(a.push('pistache', true, 100), [{ text: 'pistache', isFinal: true }]);
  assert.deepEqual(a.push('pistache', false, 2000), [{ text: 'pistache', isFinal: false }]);
  assert.deepEqual(a.push('pistache', true, 2100), [{ text: 'pistache', isFinal: true }]);
});

test('parcial que cresce mostra só o trecho novo e a correção da última palavra não duplica', () => {
  const a = new SegmentAdapter(false);
  assert.deepEqual(a.push('pista', false, 0), [{ text: 'pista', isFinal: false }]);
  assert.deepEqual(a.push('pistache', false, 100), [{ text: 'pistache', isFinal: false }]);
  assert.deepEqual(a.push('pistache pausa', true, 200), [{ text: 'pistache pausa', isFinal: true }]);
});

test('escuta nova fecha a frase em andamento e zera', () => {
  const a = new SegmentAdapter(true);
  a.push('quem é', false, 0);
  assert.deepEqual(a.newSession(), [{ text: 'quem é', isFinal: true }]);
  assert.deepEqual(a.push('quem é', false, 100), [{ text: 'quem é', isFinal: false }]);
});
