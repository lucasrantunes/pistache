// Trilha em S da TV (sketch "Trilha com bonecos", quadro de 1280 x 720). Dados, não arte:
// 3 fileiras ligadas por curvas, 26 posições (0 = saída, 1 a 25 = casas, 25 = chegada).
export const TV_WIDTH = 1280;
export const TV_HEIGHT = 720;

export type Point = { x: number; y: number };

/** Caminho desenhado (SVG): fileira de baixo para a direita, de volta para a esquerda no meio e de novo para a direita em cima. */
export const TRACK_PATH = 'M450 645H1100C1235 645 1235 495 1100 495H440C345 495 345 345 440 345H1200';

/** Centro vertical da trilha (para alinhar a coluna da esquerda). */
export const TRACK_CENTER_Y = 495;

type Seg = { kind: 'line'; from: [number, number]; to: [number, number] } | { kind: 'curve'; p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number] };

// Os mesmos trechos de TRACK_PATH, para calcular as casas ao longo do caminho (mesma distância entre todas, também nas curvas).
const SEGMENTS: Seg[] = [
  { kind: 'line', from: [450, 645], to: [1100, 645] },
  { kind: 'curve', p0: [1100, 645], p1: [1235, 645], p2: [1235, 495], p3: [1100, 495] },
  { kind: 'line', from: [1100, 495], to: [440, 495] },
  { kind: 'curve', p0: [440, 495], p1: [345, 495], p2: [345, 345], p3: [440, 345] },
  { kind: 'line', from: [440, 345], to: [1200, 345] },
];

function sample(): Point[] {
  const pts: Point[] = [];
  for (const sg of SEGMENTS) {
    if (sg.kind === 'line') {
      pts.push({ x: sg.from[0], y: sg.from[1] }, { x: sg.to[0], y: sg.to[1] });
    } else {
      for (let k = 0; k <= 60; k++) {
        const t = k / 60;
        const u = 1 - t;
        const at = (i: 0 | 1) => u * u * u * sg.p0[i] + 3 * u * u * t * sg.p1[i] + 3 * u * t * t * sg.p2[i] + t * t * t * sg.p3[i];
        pts.push({ x: at(0), y: at(1) });
      }
    }
  }
  return pts;
}

/** As 26 posições: 0 = saída (à esquerda da fileira de baixo); 1 a 25 = casas, a distâncias iguais ao longo do caminho; 25 = chegada. */
export function trackSpots(): Point[] {
  const dense = sample();
  const cum = [0];
  for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1] + Math.hypot(dense[k].x - dense[k - 1].x, dense[k].y - dense[k - 1].y));
  const total = cum[cum.length - 1];
  const first = 55; // a casa 1 fica 55 depois do começo do caminho
  const last = total - 38; // a chegada fica um pouco antes do fim
  const at = (len: number): Point => {
    let k = 1;
    while (k < dense.length - 1 && cum[k] < len) k++;
    const f = (len - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
    return { x: dense[k - 1].x + (dense[k].x - dense[k - 1].x) * f, y: dense[k - 1].y + (dense[k].y - dense[k - 1].y) * f };
  };
  const spots: Point[] = [{ x: 355, y: 645 }];
  for (let i = 0; i < 25; i++) {
    // Irregular de propósito (sempre igual): parece paralelepípedo de rua, não régua. A primeira e a chegada ficam firmes.
    const j = i === 0 || i === 24 ? 0 : 1;
    const len = first + ((last - first) * i) / 24 + j * (rnd(i, 1) - 0.5) * 18;
    const a = at(len - 1);
    const b = at(len + 1);
    const nx = -(b.y - a.y);
    const ny = b.x - a.x;
    const n = Math.hypot(nx, ny) || 1;
    const side = j * (rnd(i, 2) - 0.5) * 8;
    const c = at(len);
    spots.push({ x: c.x + (nx / n) * side, y: c.y + (ny / n) * side });
  }
  return spots;
}

/** Número repetível entre 0 e 1 (sem sorteio de verdade, para a trilha não mudar a cada tela). */
function rnd(i: number, k: number): number {
  const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453;
  return x - Math.floor(x);
}

/** Cada casa um pouco diferente: largura (±4) e inclinação (±2,5°). A chegada fica reta. */
export function tileLook(square: number): { dw: number; rot: number } {
  if (square >= 25) return { dw: 0, rot: 0 };
  return { dw: Math.round((rnd(square, 3) - 0.5) * 8), rot: Math.round((rnd(square, 4) - 0.5) * 50) / 10 };
}
