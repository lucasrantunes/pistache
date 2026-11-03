import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TV_HEIGHT, TV_WIDTH, trackSpots } from './track.ts';

test('trilha: 26 casas dentro da tela, saída embaixo e chegada no alto', () => {
  const s = trackSpots();
  assert.equal(s.length, 26);
  assert.ok(s.every((p) => p.x > 0 && p.x < TV_WIDTH && p.y > 0 && p.y < TV_HEIGHT));
  assert.ok(s[0].y > s[25].y);
});

test('trilha: casas bem espaçadas (sem sobreposição)', () => {
  const s = trackSpots();
  for (let i = 1; i < s.length; i++) {
    assert.ok(Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y) > 55, `casas ${i - 1} e ${i} coladas`);
  }
});
