// Trilha em S da TV (coordenadas do sketch, quadro de 1280 x 720). Dados, não arte:
// a cena final troca só o desenho. A curva é suave (Catmull-Rom) e as 26 casas ficam a distâncias iguais.
export const TV_WIDTH = 1280;
export const TV_HEIGHT = 720;

const CONTROL: [number, number][] = [
  [490, 645], [780, 645], [1060, 645], [1150, 628], [1176, 572], [1146, 520], [1080, 500],
  [800, 500], [560, 500], [490, 478], [468, 428], [490, 380], [560, 355],
  [820, 355], [1080, 355], [1170, 336],
];

export type Point = { x: number; y: number };

export function trackCurve(): Point[] {
  const pts = [CONTROL[0], ...CONTROL, CONTROL[CONTROL.length - 1]];
  const dense: Point[] = [];
  for (let i = 0; i < CONTROL.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    for (let s = 0; s < 40; s++) {
      const t = s / 40;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (k: 0 | 1) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      dense.push({ x: at(0), y: at(1) });
    }
  }
  const last = CONTROL[CONTROL.length - 1];
  dense.push({ x: last[0], y: last[1] });
  return dense;
}

/** As 26 casas (0 = saída, 25 = chegada), a distâncias iguais ao longo da curva. */
export function trackSpots(): Point[] {
  const dense = trackCurve();
  const cum = [0];
  for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1] + Math.hypot(dense[k].x - dense[k - 1].x, dense[k].y - dense[k - 1].y));
  const total = cum[cum.length - 1];
  const spots: Point[] = [];
  for (let i = 0; i <= 25; i++) {
    const target = (i * total) / 25;
    let k = 0;
    while (k < dense.length - 1 && cum[k] < target) k++;
    spots.push(dense[k]);
  }
  return spots;
}
