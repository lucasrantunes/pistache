import assert from 'node:assert/strict';
import { test } from 'node:test';
import { floorStones } from './floor.ts';

test('piso: 96 pedras, sempre iguais, todas com forma válida', () => {
  const a = floorStones();
  assert.equal(a.length, 96);
  assert.deepEqual(a[10], floorStones()[10]);
  assert.ok(a.every((s) => s.w > 10 && s.h > 10 && s.clip.startsWith('polygon(')));
});
