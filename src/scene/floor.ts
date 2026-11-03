// Piso de pedras irregulares e tochas da TV (sketch "piso de pedra"). Dados puros: o desenho fica na tela.
import { TV_WIDTH } from './track.ts';

export const FLOOR_TOP = 250;
const FLOOR_HEIGHT = 470;
const COLS = 16;
const ROWS = 6;
const SHADES = ['#271e4d', '#2c2356', '#302760', '#251c49', '#34296a', '#2a2152'];

export interface Stone {
  left: number;
  top: number;
  w: number;
  h: number;
  fill: string;
  /** Valor do clip-path (só a TV, que roda no navegador). */
  clip: string;
}

/** Sempre o mesmo piso (semente fixa), para não "tremer" a cada atualização. */
export function floorStones(): Stone[] {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const cw = TV_WIDTH / COLS;
  const rh = FLOOR_HEIGHT / ROWS;
  const vx: [number, number][][] = [];
  for (let r = 0; r <= ROWS; r++) {
    const row: [number, number][] = [];
    for (let c = 0; c <= COLS; c++) {
      const jx = c === 0 || c === COLS ? 0 : (rnd() - 0.5) * 34;
      const jy = r === 0 || r === ROWS ? 0 : (rnd() - 0.5) * 30;
      row.push([c * cw + jx, FLOOR_TOP + r * rh + jy]);
    }
    vx.push(row);
  }
  const stones: Stone[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const pts = [vx[r][c], vx[r][c + 1], vx[r + 1][c + 1], vx[r + 1][c]];
      const cx = pts.reduce((s, q) => s + q[0], 0) / 4;
      const cy = pts.reduce((s, q) => s + q[1], 0) / 4;
      // Encolhe 3px para sobrar uma "junta" escura entre as pedras.
      const sh = pts.map((q) => {
        const dx = q[0] - cx;
        const dy = q[1] - cy;
        const d = Math.hypot(dx, dy) || 1;
        return [q[0] - (dx / d) * 3, q[1] - (dy / d) * 3];
      });
      const minx = Math.min(...sh.map((q) => q[0]));
      const maxx = Math.max(...sh.map((q) => q[0]));
      const miny = Math.min(...sh.map((q) => q[1]));
      const maxy = Math.max(...sh.map((q) => q[1]));
      const w = maxx - minx;
      const h = maxy - miny;
      const clip = `polygon(${sh.map((q) => `${(((q[0] - minx) / w) * 100).toFixed(1)}% ${(((q[1] - miny) / h) * 100).toFixed(1)}%`).join(',')})`;
      stones.push({ left: minx, top: miny, w, h, clip, fill: SHADES[Math.floor(rnd() * SHADES.length)] });
    }
  }
  return stones;
}

/** Tochas nos cantos (x, y = pé da tocha). */
export const TORCHES: { x: number; y: number }[] = [
  { x: 30, y: 310 }, { x: 30, y: 690 }, { x: 1252, y: 690 }, { x: 1252, y: 420 },
];
