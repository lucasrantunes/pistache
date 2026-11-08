import assert from 'node:assert/strict';
import { test } from 'node:test';
import { walkPath, walkStepMs } from './walk.ts';

test('caminho: para frente, para trás e parado', () => {
  assert.deepEqual(walkPath(2, 5), [3, 4, 5]);
  assert.deepEqual(walkPath(5, 3), [4, 3]);
  assert.deepEqual(walkPath(4, 4), []);
  assert.deepEqual(walkPath(0, 1), [1]);
});

test('passo: 280 ms, e acelera para caber em 3 s', () => {
  assert.equal(walkStepMs(3), 280);
  assert.equal(walkStepMs(20), 150);
  assert.equal(walkStepMs(25) * 25 <= 3000, true);
  assert.equal(walkStepMs(200), 90);
});
