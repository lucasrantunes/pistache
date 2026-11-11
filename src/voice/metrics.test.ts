import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchProbe } from './metrics.ts';

test('cada tentativa casa com a detecção mais próxima depois dela', () => {
  const r = matchProbe([10_000, 20_000], [10_400, 20_900]);
  assert.equal(r.hits, 2);
  assert.equal(r.misses, 0);
  assert.equal(r.falsePositives, 0);
  assert.deepEqual(r.latenciesMs, [400, 900]);
  assert.equal(r.avgMs, 650);
  assert.equal(r.maxMs, 900);
});

test('detecção antes da marcação conta com atraso 0', () => {
  const r = matchProbe([10_000], [9_200]);
  assert.equal(r.hits, 1);
  assert.deepEqual(r.latenciesMs, [0]);
});

test('tentativa sem detecção é falha; detecção sem tentativa é falso avanço', () => {
  const r = matchProbe([10_000, 30_000], [10_300, 50_000]);
  assert.equal(r.hits, 1);
  assert.equal(r.misses, 1);
  assert.equal(r.falsePositives, 1);
});

test('uma detecção não vale para duas tentativas', () => {
  const r = matchProbe([10_000, 11_000], [10_500]);
  assert.equal(r.hits, 1);
  assert.equal(r.misses, 1);
});

test('sem dados', () => {
  const r = matchProbe([], []);
  assert.equal(r.avgMs, null);
  assert.equal(r.maxMs, null);
});
