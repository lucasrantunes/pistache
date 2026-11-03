import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VOICE_FRAME_MS, VoiceActivityGate, splitFrames } from './voice-activity.ts';

const QUIET = 0.002;
const SPEECH = 0.08;
const frame = (id: number) => new Int16Array([id]).buffer;
const idOf = (b: ArrayBuffer) => new Int16Array(b)[0];

function run(gate: VoiceActivityGate, levels: number[]) {
  const sent: number[] = [];
  let finalizes = 0;
  levels.forEach((rms, i) => {
    const r = gate.push(frame(i), rms);
    sent.push(...r.send.map(idOf));
    if (r.finalize) finalizes += 1;
  });
  return { sent, finalizes };
}
const many = (n: number, rms: number) => Array.from({ length: n }, () => rms);

test('silêncio não é enviado', () => {
  const { sent, finalizes } = run(new VoiceActivityGate(), many(500, QUIET));
  assert.deepEqual(sent, []);
  assert.equal(finalizes, 0);
});

test('fala abre o filtro com pré-roll e fecha após o silêncio, pedindo finalização', () => {
  const gate = new VoiceActivityGate({ preRollMs: 100, hangoverMs: 100 });
  const levels = [...many(20, QUIET), ...many(10, SPEECH), ...many(20, QUIET)];
  const { sent, finalizes } = run(gate, levels);
  assert.equal(finalizes, 1);
  assert.ok(sent.length >= 10);
  assert.ok(sent[0] <= 20 - 1); // inclui quadros antes da fala (pré-roll)
});

test('um clique isolado não abre o filtro', () => {
  const { sent } = run(new VoiceActivityGate(), [...many(10, QUIET), SPEECH, ...many(10, QUIET)]);
  assert.deepEqual(sent, []);
});

test('splitFrames divide em quadros de 20 ms', () => {
  const pcm = new Int16Array(1600).fill(1000).buffer; // 100 ms a 16 kHz
  const frames = splitFrames(pcm, 16000);
  assert.equal(frames.length, 100 / VOICE_FRAME_MS);
  assert.equal(new Int16Array(frames[0].frame).length, 320);
  assert.ok(frames[0].rms > 0.02 && frames[0].rms < 0.04);
});
