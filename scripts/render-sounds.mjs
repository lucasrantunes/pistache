// Gera os sons suaves da TV em public/sounds (WAV mono 16 kHz, menos de 30 KB cada).
// Uso: npm run sons
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 16000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');
mkdirSync(OUT, { recursive: true });

/** Nota suave: seno com um toque de 2º harmônico, ataque curto e queda exponencial. */
function note(buf, start, freq, dur, vol, { glideTo = null, bright = 0.25 } = {}) {
  const n = Math.floor(dur * RATE);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const f = glideTo ? freq + (glideTo - freq) * (i / n) : freq;
    phase += (2 * Math.PI * f) / RATE;
    const env = Math.min(1, t / 0.012) * Math.exp(-4.2 * (t / dur));
    const idx = Math.floor(start * RATE) + i;
    if (idx < buf.length) buf[idx] += (Math.sin(phase) + bright * Math.sin(2 * phase)) * env * vol;
  }
}

/** Sopro suave (ruído filtrado) que sobe ou desce, para transições. */
function swoosh(buf, start, dur, vol, from, to) {
  const n = Math.floor(dur * RATE);
  let lp = 0;
  let seed = 12345;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = (seed / 4294967296) * 2 - 1;
    const k = from + (to - from) * (i / n);
    lp += k * (noise - lp);
    const t = i / n;
    const env = Math.sin(Math.PI * t) ** 2;
    const idx = Math.floor(start * RATE) + i;
    if (idx < buf.length) buf[idx] += lp * env * vol;
  }
}

const hz = (semi) => 440 * 2 ** ((semi - 9) / 12); // semi 0 = Dó4
const SOUNDS = {
  // Acerto: arpejo alegre subindo.
  acerto(b) { [0, 4, 7, 12].forEach((s, i) => note(b, i * 0.085, hz(s + 12), 0.32, 0.3)); },
  // Azar: duas notas descendo, com "wah" triste.
  azar(b) { note(b, 0, hz(7 + 12), 0.34, 0.32, { glideTo: hz(5 + 12) }); note(b, 0.28, hz(3 + 12), 0.5, 0.32, { glideTo: hz(-1 + 12) }); },
  // Sorte: brilho subindo.
  sorte(b) { [4, 7, 11, 16].forEach((s, i) => note(b, i * 0.07, hz(s + 12), 0.34, 0.26, { bright: 0.5 })); },
  // Vitória: pequeno hino em acorde.
  vitoria(b) {
    [0, 4, 7, 12].forEach((s, i) => note(b, i * 0.12, hz(s + 12), 0.5, 0.26));
    [0, 4, 7, 12, 16].forEach((s) => note(b, 0.5, hz(s + 12), 0.4, 0.14));
  },
  // Dica nova: dois toques leves.
  dica(b) { note(b, 0, hz(7 + 12), 0.14, 0.2); note(b, 0.07, hz(12 + 12), 0.18, 0.18); },
  // Tique-taque do fim do tempo: bem baixinho.
  tique(b) { note(b, 0, 1400, 0.05, 0.12, { bright: 0 }); },
  // Passagem de carta: sopro curto.
  passa(b) { swoosh(b, 0, 0.32, 0.5, 0.05, 0.35); note(b, 0.16, hz(0 + 12), 0.18, 0.1); },
  // Entrada do pop-up: sopro e toque.
  pop(b) { swoosh(b, 0, 0.2, 0.4, 0.1, 0.4); note(b, 0.1, hz(2 + 12), 0.22, 0.2); },
};

// Volume-alvo (RMS em dB) por som: ações mais fortes, transições médias, tique-taque bem baixo. O pico nunca passa de 0,89.
const TARGET_DB = { acerto: -14, azar: -14, sorte: -14, vitoria: -14, dica: -18, passa: -18, pop: -18, tique: -28 };
const PEAK_MAX = 0.89;

for (const [name, make] of Object.entries(SOUNDS)) {
  const buf = new Float32Array(Math.floor(RATE * 0.9));
  make(buf);
  // Corta o silêncio final e aplica uma queda curta para não estalar.
  let end = buf.length;
  while (end > 0 && Math.abs(buf[end - 1]) < 0.002) end--;
  end = Math.min(buf.length, end + Math.floor(RATE * 0.02));
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < end; i++) { peak = Math.max(peak, Math.abs(buf[i])); sum += buf[i] * buf[i]; }
  const rms = Math.sqrt(sum / end) || 1e-6;
  const gain = Math.min(10 ** (TARGET_DB[name] / 20) / rms, PEAK_MAX / (peak || 1));
  for (let i = 0; i < end; i++) buf[i] *= gain;
  const pcm = Buffer.alloc(end * 2);
  for (let i = 0; i < end; i++) {
    const fade = Math.min(1, (end - i) / (RATE * 0.02));
    pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(buf[i] * fade * 32767))), i * 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + pcm.length, 4); head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
  head.writeUInt32LE(RATE, 24); head.writeUInt32LE(RATE * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
  head.write('data', 36); head.writeUInt32LE(pcm.length, 40);
  writeFileSync(join(OUT, `${name}.wav`), Buffer.concat([head, pcm]));
  console.log(name, Math.round((44 + pcm.length) / 1024), 'KB');
}
