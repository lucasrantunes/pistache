// Bonecos da TV (sketch "Trilha com bonecos"): cabeça grande, olhos grandes com brilho, corpinho curto, sem contorno.
// Os bichos são os mesmos 16 do Pitaco (animais.tsx). A cor do jogador vai no cachecol e na base redonda.
// Desenhados em SVG em texto (expo-image desenha), então não precisa de módulo nativo novo.
import { Image } from 'expo-image';

import type { AnimalId } from './animais';

const D = '#2a1d14';

const olhos = (o: { lx?: number; rx?: number; y?: number; R?: number; pr?: number; dx?: number; dy?: number } = {}) => {
  const { lx = 23, rx = 41, y = 31, R = 7.4, pr = 3.7, dx = 1, dy = 1 } = o;
  const um = (x: number) =>
    `<circle cx="${x}" cy="${y}" r="${R}" fill="#fff"/><circle cx="${x + dx}" cy="${y + dy}" r="${pr}" fill="${D}"/><circle cx="${x + dx + 1.3}" cy="${y + dy - 1.3}" r="${pr * 0.36}" fill="#fff"/>`;
  return um(lx) + um(rx);
};
const boca = (x = 32, y = 44, w = 5) => `<path d="M${x - w} ${y}q${w} ${w * 0.7} ${w * 2} 0" fill="none" stroke="${D}" stroke-width="1.8" stroke-linecap="round"/>`;
const nariz = (x: number, y: number, rx = 3, ry = 2.2, c = D) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`;
const bigode = (c = D) => `<path d="M9 40l10 1.5M9 45l10-1M55 40l-10 1.5M55 45l-10-1" stroke="${c}" stroke-width="1.1" stroke-linecap="round" opacity=".5"/>`;

type Corpo = {
  bc: string; bl?: string; hc: string; fc: string;
  ears?: string; face?: string; body?: string; eyes: string; mouth?: string; back?: string; arms?: string; shellFront?: boolean;
};

const A: Record<AnimalId, Corpo> = {
  capivara: {
    bc: '#b57a45', bl: '#d9a56e', hc: '#b57a45', fc: '#8c5a30',
    ears: `<circle cx="14" cy="16" r="5" fill="#8c5a30"/><circle cx="50" cy="16" r="5" fill="#8c5a30"/>`,
    face: `<ellipse cx="32" cy="40" rx="15" ry="9.5" fill="#d9a56e"/>`,
    eyes: olhos({ y: 28, R: 6.6, pr: 3.3 }),
    mouth: nariz(27, 38.5, 2.2, 1.6, '#5a3216') + nariz(37, 38.5, 2.2, 1.6, '#5a3216') + boca(32, 44, 4),
  },
  onca: {
    bc: '#f2a93b', bl: '#fbe3b5', hc: '#f2a93b', fc: '#d98a1e',
    ears: `<circle cx="14" cy="15" r="6.5" fill="#f2a93b"/><circle cx="14" cy="15" r="3.2" fill="#7a4a1e"/><circle cx="50" cy="15" r="6.5" fill="#f2a93b"/><circle cx="50" cy="15" r="3.2" fill="#7a4a1e"/>`,
    face: `<ellipse cx="32" cy="41" rx="12" ry="8" fill="#fbe3b5"/><g fill="#7a4a1e"><circle cx="13" cy="28" r="2.4"/><circle cx="17" cy="19" r="2"/><circle cx="51" cy="28" r="2.4"/><circle cx="47" cy="19" r="2"/><circle cx="32" cy="14" r="2.1"/><circle cx="25" cy="16" r="1.5"/><circle cx="39" cy="16" r="1.5"/></g>`,
    body: `<g fill="#7a4a1e"><circle cx="22" cy="58" r="2.2"/><circle cx="44" cy="62" r="2.4"/><circle cx="26" cy="68" r="1.8"/></g>`,
    eyes: olhos({ y: 30 }),
    mouth: `<path d="M28.5 38h7l-3.5 4z" fill="${D}"/>` + boca(32, 45, 4) + bigode('#7a4a1e'),
    back: `<path d="M46 72q16-2 14-18" fill="none" stroke="#f2a93b" stroke-width="5" stroke-linecap="round"/><circle cx="59" cy="58" r="2" fill="#7a4a1e"/>`,
  },
  tucano: {
    bc: '#2d2b3a', bl: '#f6f0dc', hc: '#2d2b3a', fc: '#ff9d2e',
    face: `<ellipse cx="32" cy="33" rx="16" ry="13" fill="#f6f0dc"/>`,
    eyes: olhos({ y: 27, R: 7, pr: 3.4 }) + `<circle cx="23" cy="27" r="9" fill="none" stroke="#4fb3e8" stroke-width="2.2"/><circle cx="41" cy="27" r="9" fill="none" stroke="#4fb3e8" stroke-width="2.2"/>`,
    mouth: `<path d="M18 34q14-6 28 0q-1 16-14 22q-13-6-14-22z" fill="#ff9d2e"/><path d="M18 34q14-6 28 0q-1 6-14 7q-13-1-14-7z" fill="#ffd24a"/><path d="M26 47q6 3 12 0" stroke="#c26a10" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  },
  coruja: {
    bc: '#8a6a4a', bl: '#eadcc0', hc: '#8a6a4a', fc: '#f2a93b',
    ears: `<path d="M10 8l12 9-14 5z" fill="#6e5236"/><path d="M54 8l-12 9 14 5z" fill="#6e5236"/>`,
    face: `<ellipse cx="32" cy="33" rx="21" ry="15" fill="#eadcc0"/>`,
    body: `<path d="M24 58q4 4 8 0q4 4 8 0M24 66q4 4 8 0q4 4 8 0" fill="none" stroke="#8a6a4a" stroke-width="1.6" stroke-linecap="round"/>`,
    eyes: olhos({ y: 30, lx: 22, rx: 42, R: 9, pr: 4.2 }),
    mouth: `<path d="M28.5 38.5h7L32 45z" fill="#f2a93b"/>`,
  },
  raposa: {
    bc: '#ef7a2b', bl: '#fcebd8', hc: '#ef7a2b', fc: '#5a3216',
    ears: `<path d="M7 24 11 3l16 12z" fill="#ef7a2b"/><path d="M10 20l3-12 8 6z" fill="#3a2418"/><path d="M57 24 53 3 37 15z" fill="#ef7a2b"/><path d="M54 20l-3-12-8 6z" fill="#3a2418"/>`,
    face: `<path d="M5 36q27-8 54 0q-6 18-27 18q-21 0-27-18z" fill="#fcebd8"/>`,
    eyes: olhos({ y: 30 }),
    mouth: nariz(32, 42, 3.6, 2.6) + boca(32, 46.5, 4),
    back: `<path d="M44 74q22 2 16-22q-6 8-14 10z" fill="#ef7a2b"/><path d="M56 66q4-6 2-14q-5 4-6 11z" fill="#fff"/>`,
  },
  lontra: {
    bc: '#7a5438', bl: '#ecd5b3', hc: '#7a5438', fc: '#563b28',
    ears: `<circle cx="12" cy="20" r="4.5" fill="#563b28"/><circle cx="52" cy="20" r="4.5" fill="#563b28"/>`,
    face: `<ellipse cx="32" cy="41" rx="19" ry="12" fill="#ecd5b3"/>`,
    eyes: olhos({ y: 29, R: 6.8, pr: 3.4 }),
    mouth: nariz(32, 38, 4, 2.8) + boca(32, 44.5, 4) + bigode(),
    back: `<path d="M44 74q20 0 16-12" fill="none" stroke="#7a5438" stroke-width="6" stroke-linecap="round"/>`,
  },
  sapo: {
    bc: '#5aa83a', bl: '#d9f0a8', hc: '#5aa83a', fc: '#3f8a28',
    ears: `<circle cx="20" cy="14" r="10" fill="#6cc04a"/><circle cx="44" cy="14" r="10" fill="#6cc04a"/>`,
    face: `<circle cx="14" cy="42" r="3.6" fill="#f28b8b" opacity=".6"/><circle cx="50" cy="42" r="3.6" fill="#f28b8b" opacity=".6"/>`,
    eyes: olhos({ y: 15, lx: 20, rx: 44, R: 8.2, pr: 4 }),
    mouth: `<path d="M14 36q18 14 36 0" fill="none" stroke="${D}" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  pinguim: {
    bc: '#3a404c', bl: '#f7f7f7', hc: '#3a404c', fc: '#ff9d2e',
    face: `<path d="M10 34q22-12 44 0q-2 16-22 18q-20-2-22-18z" fill="#f7f7f7"/>`,
    eyes: olhos({ y: 30, lx: 23.5, rx: 40.5, R: 6.8, pr: 3.4 }),
    mouth: `<path d="M27 38h10l-5 7z" fill="#ff9d2e"/>`,
  },
  gato: {
    bc: '#9aa3ad', bl: '#f4f4f4', hc: '#9aa3ad', fc: '#828c97',
    ears: `<path d="M8 24 12 2l17 12z" fill="#9aa3ad"/><path d="M12 19l2-11 8 6z" fill="#f2a8bb"/><path d="M56 24 52 2 35 14z" fill="#9aa3ad"/><path d="M52 19l-2-11-8 6z" fill="#f2a8bb"/>`,
    face: `<ellipse cx="32" cy="42" rx="12" ry="8.5" fill="#f4f4f4"/><path d="M26 10l2 6M32 8v7M38 10l-2 6" stroke="#6f7883" stroke-width="2" stroke-linecap="round"/>`,
    eyes: olhos({ y: 30 }),
    mouth: `<path d="M29.5 38h5l-2.5 3z" fill="#f28ba0"/>` + boca(32, 44, 3.5) + bigode(),
    back: `<path d="M44 74q18 0 14-24" fill="none" stroke="#9aa3ad" stroke-width="6" stroke-linecap="round"/><path d="M57 60l4 1M56 54l4 1" stroke="#6f7883" stroke-width="2.4" stroke-linecap="round"/>`,
  },
  jacare: {
    bc: '#4f9a38', bl: '#d9f0a8', hc: '#5fae3f', fc: '#3f8a28',
    face: `<rect x="10" y="32" width="44" height="20" rx="10" fill="#6fbd4f"/><circle cx="24" cy="38" r="1.8" fill="#2f6a20"/><circle cx="40" cy="38" r="1.8" fill="#2f6a20"/>`,
    eyes: olhos({ y: 19, lx: 21, rx: 43, R: 7.4, pr: 3.6 }),
    mouth: `<path d="M15 46h34" stroke="${D}" stroke-width="1.8" stroke-linecap="round"/><path d="M19 46l2 4 2-4M27 46l2 4 2-4M35 46l2 4 2-4M43 46l1.5 4 1.5-4" fill="#fff"/>`,
    back: `<path d="M44 74q16 0 14-6l-8-2z" fill="#4f9a38"/><path d="M26 49l3-5 3 5 3-5 3 5" fill="#2f6a20"/>`,
  },
  cachorro: {
    bc: '#e2a65c', bl: '#fbe3b5', hc: '#e2a65c', fc: '#c0833a',
    ears: `<ellipse cx="8" cy="28" rx="8" ry="15" fill="#8a5a2a" transform="rotate(12 8 28)"/><ellipse cx="56" cy="28" rx="8" ry="15" fill="#8a5a2a" transform="rotate(-12 56 28)"/>`,
    face: `<ellipse cx="32" cy="42" rx="13" ry="9.5" fill="#fbe3b5"/>`,
    eyes: olhos({ y: 29, R: 6.8, pr: 3.4 }),
    mouth: nariz(32, 38, 4.2, 3) + `<path d="M28 46q4 7 8 0z" fill="#f2788f"/>`,
    back: `<path d="M46 72q14-2 12-16" fill="none" stroke="#e2a65c" stroke-width="5" stroke-linecap="round"/>`,
  },
  mico: {
    bc: '#8a5a2f', bl: '#e8c79a', hc: '#8a5a2f', fc: '#6b3d1d',
    ears: `<circle cx="8" cy="30" r="8" fill="#8a5a2f"/><circle cx="8" cy="30" r="4.6" fill="#e8c79a"/><circle cx="56" cy="30" r="8" fill="#8a5a2f"/><circle cx="56" cy="30" r="4.6" fill="#e8c79a"/>`,
    face: `<path d="M12 28q10-8 20 0q10-8 20 0q4 16-20 24q-24-8-20-24z" fill="#e8c79a"/>`,
    eyes: olhos({ y: 30, lx: 24, rx: 40, R: 6.4, pr: 3.2 }),
    mouth: nariz(30, 41, 1, 0.8) + nariz(34, 41, 1, 0.8) + boca(32, 46, 5),
    back: `<path d="M46 74q18 2 14-14q-1-6 3-8" fill="none" stroke="#8a5a2f" stroke-width="4.5" stroke-linecap="round"/>`,
  },
  porquinho: {
    bc: '#f7a8b8', bl: '#fbd0da', hc: '#f7a8b8', fc: '#e5849a',
    ears: `<path d="M9 22 14 5l14 8z" fill="#e5849a"/><path d="M55 22 50 5 36 13z" fill="#e5849a"/>`,
    face: `<ellipse cx="32" cy="41" rx="12" ry="9" fill="#ee8fa5"/><ellipse cx="27.5" cy="41" rx="2.2" ry="3.2" fill="#a8435a"/><ellipse cx="36.5" cy="41" rx="2.2" ry="3.2" fill="#a8435a"/>`,
    eyes: olhos({ y: 27 }),
    back: `<path d="M46 72q8 2 8-4q0-5-5-3q-3 2 0 4" fill="none" stroke="#e5849a" stroke-width="2.4" stroke-linecap="round"/>`,
  },
  vaca: {
    bc: '#f4f4f4', bl: '#f4a6a6', hc: '#f4f4f4', fc: '#2b2b2b',
    ears: `<ellipse cx="6" cy="22" rx="8" ry="5" fill="#2b2b2b" transform="rotate(-20 6 22)"/><ellipse cx="58" cy="22" rx="8" ry="5" fill="#f4f4f4" transform="rotate(20 58 22)"/><path d="M16 12q-4-8-2-10M48 12q4-8 2-10" stroke="#e8d9b0" stroke-width="4" stroke-linecap="round" fill="none"/>`,
    face: `<circle cx="46" cy="18" r="8" fill="#2b2b2b"/><ellipse cx="32" cy="42" rx="15" ry="9.5" fill="#f4a6a6"/><ellipse cx="25" cy="42" rx="2.6" ry="3.4" fill="#b0505a"/><ellipse cx="39" cy="42" rx="2.6" ry="3.4" fill="#b0505a"/>`,
    body: `<ellipse cx="22" cy="62" rx="7" ry="6" fill="#2b2b2b"/><circle cx="43" cy="66" r="4.5" fill="#2b2b2b"/>`,
    eyes: olhos({ y: 28 }),
  },
  preguica: {
    bc: '#b9a98f', bl: '#eadfca', hc: '#b9a98f', fc: '#7a6a55',
    face: `<ellipse cx="32" cy="34" rx="18" ry="13" fill="#eadfca"/><ellipse cx="23" cy="30" rx="8.5" ry="6.5" fill="#5a4a3a" transform="rotate(-18 23 30)"/><ellipse cx="41" cy="30" rx="8.5" ry="6.5" fill="#5a4a3a" transform="rotate(18 41 30)"/>`,
    eyes: olhos({ y: 30, lx: 23, rx: 41, R: 5.2, pr: 2.8 }),
    mouth: nariz(32, 39, 3.2, 2.2) + boca(32, 44.5, 4),
    arms: `<path d="M14 54q-6 14-2 24M50 54q6 14 2 24" fill="none" stroke="#b9a98f" stroke-width="5.5" stroke-linecap="round"/><path d="M10 78l-1 4M13 78v4M16 78l1 4M48 78l-1 4M51 78v4M54 78l1 4" stroke="#7a6a55" stroke-width="1.5" stroke-linecap="round"/>`,
  },
  jabuti: {
    bc: '#8fbf5a', bl: '#d9f0a8', hc: '#8fbf5a', fc: '#6e9a40',
    face: `<ellipse cx="32" cy="38" rx="11" ry="8" fill="#a6d070"/>`,
    eyes: olhos({ y: 29, R: 6.4, pr: 3.2 }),
    mouth: boca(32, 41.5, 4.5),
    shellFront: true,
  },
};

/** Caixa do desenho: 64 de largura; a coroa precisa de folga em cima, então o quadro começa em y = -14. */
export const BONECO_W = 64;
export const BONECO_H = 100;
/** Altura (no desenho) do chão onde o boneco pisa, contada do topo do quadro. */
export const BONECO_PE = 94;

const cache = new Map<string, string>();

function desenho(animal: AnimalId, cor: string, triste: boolean, lider: boolean): string {
  const a = A[animal];
  const corpo = `<ellipse cx="32" cy="61" rx="16" ry="14" fill="${a.bc}"/>` + (a.bl ? `<ellipse cx="32" cy="65" rx="10" ry="9" fill="${a.bl}" opacity=".95"/>` : '') + (a.body ?? '');
  const casco = a.shellFront
    ? `<path d="M10 80q0-28 22-28t22 28z" fill="#8a6436"/><path d="M22 80l3-15h14l3 15z" fill="#b38a52"/><path d="M32 52v13M17 66h30" stroke="#6b4a24" stroke-width="2" stroke-linecap="round"/><ellipse cx="14" cy="76" rx="5" ry="3.5" fill="${a.fc}"/><ellipse cx="50" cy="76" rx="5" ry="3.5" fill="${a.fc}"/>`
    : '';
  const pes = `<ellipse cx="23" cy="77" rx="7.5" ry="4" fill="${a.fc}"/><ellipse cx="41" cy="77" rx="7.5" ry="4" fill="${a.fc}"/>`;
  const bracos = a.arms ?? `<ellipse cx="14" cy="62" rx="4.5" ry="6.5" fill="${a.bc}" transform="rotate(${triste ? 35 : 18} 14 62)"/><ellipse cx="50" cy="62" rx="4.5" ry="6.5" fill="${a.bc}" transform="rotate(${triste ? -35 : -18} 50 62)"/>`;
  const cachecol = `<path d="M18 49q14 8 28 0l1 5q-15 8-30 0z" fill="${cor}"/><path d="M18 49q14 8 28 0" fill="none" stroke="#fff" stroke-width="1" opacity=".25"/>`;
  const cabeca = `<ellipse cx="32" cy="30" rx="25" ry="21" fill="${a.hc}"/><ellipse cx="22" cy="20" rx="9" ry="5" fill="#fff" opacity=".13"/>`;
  const olhosFinal = triste
    ? a.eyes.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="#2a1d14"\/>/g, (_m, x, y, r) => `<circle cx="${x}" cy="${+y + 2}" r="${r}" fill="#2a1d14"/>`)
    : a.eyes;
  const sobrancelhas = triste ? `<path d="M14 21 29 17M50 21 35 17" stroke="${D}" stroke-width="2.8" stroke-linecap="round"/>` : '';
  const lagrima = triste ? `<path d="M45 40q3.5 6 0 9q-3.5-3 0-9z" fill="#6fd3ff" stroke="#fff" stroke-width="1"/>` : '';
  const base = `<ellipse cx="32" cy="82" rx="27" ry="4.8" fill="#05030f" opacity=".42"/><ellipse cx="32" cy="81" rx="26" ry="4.6" fill="${cor}"/><ellipse cx="32" cy="80" rx="26" ry="4.6" fill="#fff" opacity=".18"/>`;
  const coroa = lider ? `<g transform="rotate(-8 32 2)"><path d="M18 11 16 -4l9 6 7-10 7 10 9-6-2 15z" fill="#ffca4b" stroke="#130d2f" stroke-width="2" stroke-linejoin="round"/></g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 ${BONECO_W} ${BONECO_H}">${base}${a.back ?? ''}${a.shellFront ? '' : corpo}${casco}${a.shellFront ? '' : pes}${bracos}${cachecol}${a.ears ?? ''}${cabeca}${a.face ?? ''}${olhosFinal}${a.mouth ?? ''}${sobrancelhas}${lagrima}${coroa}</svg>`;
}

function uriDe(animal: AnimalId, cor: string, triste: boolean, lider: boolean): string {
  const chave = `${animal}|${cor}|${triste}|${lider}`;
  let uri = cache.get(chave);
  if (!uri) {
    uri = `data:image/svg+xml;base64,${btoa(desenho(animal, cor, triste, lider))}`;
    cache.set(chave, uri);
  }
  return uri;
}

/** Boneco do jogador. `escala` 1 = 64 de largura. `triste` = azar (sobrancelhas, lágrima); `lider` = coroa. */
export function Boneco({ animal, cor, escala = 1, triste = false, lider = false }: { animal: AnimalId; cor: string; escala?: number; triste?: boolean; lider?: boolean }) {
  return (
    <Image
      source={{ uri: uriDe(animal, cor, triste, lider) }}
      style={{ width: BONECO_W * escala, height: BONECO_H * escala, opacity: triste ? 0.6 : 1 }}
      contentFit="contain"
    />
  );
}
