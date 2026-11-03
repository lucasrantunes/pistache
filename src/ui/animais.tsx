// Rostos de bichinho da medalha (decisão 47), inspirados no Pitaco: formas simples desenhadas em SVG,
// sem imagens. Cada jogador recebe um bicho diferente, pela ordem em que entrou na partida.
import { Image } from 'expo-image';

export const ANIMAIS = [
  'capivara', 'onca', 'tucano', 'coruja', 'raposa', 'lontra', 'sapo', 'pinguim', 'gato', 'jacare',
  'cachorro', 'mico', 'porquinho', 'vaca', 'preguica', 'jabuti',
] as const;
export type AnimalId = (typeof ANIMAIS)[number];

/** O bicho do jogador: pela posição da cor dele; sem cor conhecida, pelo nome (sempre o mesmo para o mesmo nome). */
export function animalDe(indice: number, nome = ''): AnimalId {
  const i = indice >= 0 ? indice : [...nome].reduce((s, c) => s + c.charCodeAt(0), 0);
  return ANIMAIS[i % ANIMAIS.length];
}

const INK = '#2a1d14';

const olhos = (y = 29, gap = 8, r = 2.8) =>
  `<circle cx="${32 - gap}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${32 + gap}" cy="${y}" r="${r}" fill="${INK}"/>`;

const sorriso = (y = 47, w = 6) =>
  `<path d="M${32 - w} ${y}q${w} ${w * 0.7} ${w * 2} 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;

const bigodes = (y = 44, cor = INK) =>
  `<path d="M8 ${y - 3}l12 2M8 ${y + 3}l12-1M56 ${y - 3}l-12 2M56 ${y + 3}l-12-1" stroke="${cor}" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>`;

const ROSTOS: Record<AnimalId, { bg: string; rosto: string }> = {
  capivara: {
    bg: '#a8683a',
    rosto: `
        <ellipse cx="${17}" cy="${12}" rx="${5}" ry="${4}" fill="#7e4a24" />
        <ellipse cx="${47}" cy="${12}" rx="${5}" ry="${4}" fill="#7e4a24" />
        <rect x="${12}" y="${33}" width="${40}" height="${27}" rx="${13}" fill="#c98a55" />
        ${olhos(25)}
        <ellipse cx="${26}" cy="${40}" rx="${2.4}" ry="${1.6}" fill="#5a3216" />
        <ellipse cx="${38}" cy="${40}" rx="${2.4}" ry="${1.6}" fill="#5a3216" />
        ${sorriso(49, 5)}
      `,
  },
  onca: {
    bg: '#f2a93b',
    rosto: `
        <circle cx="${14}" cy="${24}" r="${2.6}" fill="#7a4a1e" />
        <circle cx="${19}" cy="${15}" r="${2.2}" fill="#7a4a1e" />
        <circle cx="${50}" cy="${24}" r="${2.6}" fill="#7a4a1e" />
        <circle cx="${45}" cy="${15}" r="${2.2}" fill="#7a4a1e" />
        <circle cx="${32}" cy="${11}" r="${2.4}" fill="#7a4a1e" />
        <ellipse cx="${32}" cy="${45}" rx="${14}" ry="${11}" fill="#fbe3b5" />
        ${olhos(29)}
        <path d="M28.5 39h7l-3.5 4z" fill="${INK}" />
        ${bigodes(45, '#7a4a1e')}
        ${sorriso(47, 4)}
      `,
  },
  preguica: {
    bg: '#a89a85',
    rosto: `
        <ellipse cx="${32}" cy="${37}" rx="${22}" ry="${18}" fill="#eadfca" />
        <ellipse cx="${23}" cy="${33}" rx="${7.5}" ry="${5}" fill="#5a4a3a" transform="rotate(-18 23 33)" />
        <ellipse cx="${41}" cy="${33}" rx="${7.5}" ry="${5}" fill="#5a4a3a" transform="rotate(18 41 33)" />
        <circle cx="${24}" cy="${32}" r="${2.4}" fill="#fff" />
        <circle cx="${40}" cy="${32}" r="${2.4}" fill="#fff" />
        <ellipse cx="${32}" cy="${41}" rx="${3.5}" ry="${2.5}" fill="${INK}" />
        ${sorriso(46, 4)}
      `,
  },
  tucano: {
    bg: '#2d2b3a',
    rosto: `
        <circle cx="${32}" cy="${60}" r="${18}" fill="#f6f0dc" />
        <circle cx="${23}" cy="${26}" r="${5.5}" fill="#4fb3e8" />
        <circle cx="${41}" cy="${26}" r="${5.5}" fill="#4fb3e8" />
        ${olhos(26, 9, 2.6)}
        <path d="M22 35q10-4 20 0q-1 14-10 20q-9-6-10-20z" fill="#ff9d2e" />
        <path d="M27 49q5 3 10 0q-2 4-5 6q-3-2-5-6z" fill="${INK}" />
      `,
  },
  coruja: {
    bg: '#8a6a4a',
    rosto: `
        <path d="M13 9l10 10-12 3z" fill="#6e5236" />
        <path d="M51 9l-10 10 12 3z" fill="#6e5236" />
        <circle cx="${23}" cy="${31}" r="${9.5}" fill="#fbe3b5" />
        <circle cx="${41}" cy="${31}" r="${9.5}" fill="#fbe3b5" />
        ${olhos(31, 9, 4)}
        <circle cx="${24.5}" cy="${29.5}" r="${1.3}" fill="#fff" />
        <circle cx="${42.5}" cy="${29.5}" r="${1.3}" fill="#fff" />
        <path d="M28.5 41h7l-3.5 6z" fill="#f2a93b" />
      `,
  },
  raposa: {
    bg: '#ef7a2b',
    rosto: `
        <path d="M9 22l4-17 14 11z" fill="#c95a18" />
        <path d="M55 22l-4-17-14 11z" fill="#c95a18" />
        <path d="M6 34q26-6 52 0q-6 26-26 28q-20-2-26-28z" fill="#fcebd8" />
        ${olhos(30)}
        <ellipse cx="${32}" cy="${42}" rx="${3.6}" ry="${2.6}" fill="${INK}" />
        ${sorriso(47, 4)}
      `,
  },
  lontra: {
    bg: '#6f4e37',
    rosto: `
        <circle cx="${12}" cy="${24}" r="${4.5}" fill="#563b28" />
        <circle cx="${52}" cy="${24}" r="${4.5}" fill="#563b28" />
        <ellipse cx="${32}" cy="${46}" rx="${22}" ry="${15}" fill="#ecd5b3" />
        ${olhos(30)}
        <ellipse cx="${32}" cy="${40}" rx="${4.2}" ry="${3}" fill="${INK}" />
        ${bigodes(45, INK)}
        ${sorriso(47, 4)}
      `,
  },
  sapo: {
    bg: '#5aa83a',
    rosto: `
        <circle cx="${21}" cy="${21}" r="${9.5}" fill="#7cc455" />
        <circle cx="${43}" cy="${21}" r="${9.5}" fill="#7cc455" />
        <circle cx="${21}" cy="${21}" r="${5.5}" fill="#fff" />
        <circle cx="${43}" cy="${21}" r="${5.5}" fill="#fff" />
        ${olhos(21, 11, 2.8)}
        <circle cx="${15}" cy="${42}" r="${3.5}" fill="#f28b8b" opacity="${0.7}" />
        <circle cx="${49}" cy="${42}" r="${3.5}" fill="#f28b8b" opacity="${0.7}" />
        <path d="M17 39q15 14 30 0" fill="none" stroke="${INK}" stroke-width="${2}" stroke-linecap="round" />
      `,
  },
  jabuti: {
    bg: '#8fbf5a',
    rosto: `
        <path d="M0 0h64v22q-32 10-64 0z" fill="#8a6436" />
        <circle cx="${20}" cy="${13}" r="${4.5}" fill="#b38a52" />
        <circle cx="${32}" cy="${10}" r="${4.5}" fill="#b38a52" />
        <circle cx="${44}" cy="${13}" r="${4.5}" fill="#b38a52" />
        ${olhos(36)}
        <circle cx="${30}" cy="${44}" r="${1}" fill="${INK}" />
        <circle cx="${34}" cy="${44}" r="${1}" fill="${INK}" />
        ${sorriso(49, 5)}
      `,
  },
  pinguim: {
    bg: '#3a404c',
    rosto: `
        <ellipse cx="${24}" cy="${38}" rx="${12}" ry="${15}" fill="#f4f4f4" />
        <ellipse cx="${40}" cy="${38}" rx="${12}" ry="${15}" fill="#f4f4f4" />
        ${olhos(34, 8)}
        <path d="M28 41h8l-4 5z" fill="#f2a93b" />
      `,
  },
  mico: {
    bg: '#f0a030',
    rosto: `
        <ellipse cx="${32}" cy="${38}" rx="${15}" ry="${17}" fill="#6b3d1d" />
        <circle cx="${26}" cy="${33}" r="${3.2}" fill="#fbe3b5" />
        <circle cx="${38}" cy="${33}" r="${3.2}" fill="#fbe3b5" />
        <circle cx="${26}" cy="${33}" r="${1.6}" fill="${INK}" />
        <circle cx="${38}" cy="${33}" r="${1.6}" fill="${INK}" />
        <ellipse cx="${32}" cy="${42}" rx="${2.6}" ry="${1.8}" fill="#c9895a" />
        <path d="M28 47q4 3 8 0" fill="none" stroke="#fbe3b5" stroke-width="${1.6}" stroke-linecap="round" />
      `,
  },
  jacare: {
    bg: '#4f8a3a',
    rosto: `
        <circle cx="${21}" cy="${21}" r="${8}" fill="#6fae52" />
        <circle cx="${43}" cy="${21}" r="${8}" fill="#6fae52" />
        <circle cx="${21}" cy="${21}" r="${4.5}" fill="#ffd54a" />
        <circle cx="${43}" cy="${21}" r="${4.5}" fill="#ffd54a" />
        <rect x="${20}" y="${18}" width="${2}" height="${6}" rx="${1}" fill="${INK}" />
        <rect x="${42}" y="${18}" width="${2}" height="${6}" rx="${1}" fill="${INK}" />
        <rect x="${13}" y="${34}" width="${38}" height="${22}" rx="${11}" fill="#6fae52" />
        <circle cx="${26}" cy="${40}" r="${1.8}" fill="${INK}" />
        <circle cx="${38}" cy="${40}" r="${1.8}" fill="${INK}" />
        <path d="M18 50h28" stroke="${INK}" stroke-width="${1.6}" stroke-linecap="round" />
        <path d="M22 50l2 3 2-3M30 50l2 3 2-3M38 50l2 3 2-3" fill="#fff" />
      `,
  },
  gato: {
    bg: '#9aa3ad',
    rosto: `
        <path d="M10 22l5-16 13 10z" fill="#828c97" />
        <path d="M54 22l-5-16-13 10z" fill="#828c97" />
        <ellipse cx="${32}" cy="${45}" rx="${12}" ry="${9}" fill="#f4f4f4" />
        ${olhos(31)}
        <path d="M29.5 40h5l-2.5 3z" fill="#f28ba0" />
        ${bigodes(44)}
        ${sorriso(46, 3.5)}
      `,
  },
  cachorro: {
    bg: '#e2a65c',
    rosto: `
        <ellipse cx="${10}" cy="${32}" rx="${8}" ry="${16}" fill="#8a5a2a" />
        <ellipse cx="${54}" cy="${32}" rx="${8}" ry="${16}" fill="#8a5a2a" />
        <ellipse cx="${32}" cy="${45}" rx="${13}" ry="${10}" fill="#fbe3b5" />
        ${olhos(30)}
        <ellipse cx="${32}" cy="${41}" rx="${4.4}" ry="${3.2}" fill="${INK}" />
        <path d="M29 48q3 6 6 0z" fill="#f2788f" />
      `,
  },
  vaca: {
    bg: '#f2f2f2',
    rosto: `
        <circle cx="${13}" cy="${16}" r="${10}" fill="#2b2b2b" />
        <circle cx="${52}" cy="${13}" r="${8}" fill="#2b2b2b" />
        <circle cx="${48}" cy="${30}" r="${3.5}" fill="#2b2b2b" />
        ${olhos(29)}
        <rect x="${13}" y="${38}" width="${38}" height="${20}" rx="${10}" fill="#f4a6a6" />
        <ellipse cx="${24}" cy="${47}" rx="${2.6}" ry="${3.2}" fill="#b0505a" />
        <ellipse cx="${40}" cy="${47}" rx="${2.6}" ry="${3.2}" fill="#b0505a" />
      `,
  },
  porquinho: {
    bg: '#f7a8b8',
    rosto: `
        <path d="M12 16l12 2-6 10z" fill="#e5849a" />
        <path d="M52 16l-12 2 6 10z" fill="#e5849a" />
        ${olhos(28)}
        <ellipse cx="${32}" cy="${42}" rx="${11}" ry="${8}" fill="#e5849a" />
        <ellipse cx="${28}" cy="${42}" rx="${2}" ry="${3}" fill="#a8435a" />
        <ellipse cx="${36}" cy="${42}" rx="${2}" ry="${3}" fill="#a8435a" />
        ${sorriso(52, 4)}
      `,
  },
};

const TRISTE = `<path d="M15 25l10-4M49 25l-10-4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M22 36q-4 7 0 9q4-2 0-9z" fill="#7ad1ff"/>`;

const cache = new Map<string, string>();

/** Endereço do desenho (SVG em texto, sem arquivo): o expo-image desenha, então não precisa de módulo nativo novo. */
function uriDe(animal: AnimalId, triste: boolean): string {
  const chave = `${animal}${triste ? '-triste' : ''}`;
  let uri = cache.get(chave);
  if (!uri) {
    const { bg, rosto } = ROSTOS[animal];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/>${rosto}${triste ? TRISTE : ''}</svg>`;
    uri = `data:image/svg+xml;base64,${btoa(svg)}`;
    cache.set(chave, uri);
  }
  return uri;
}

/** Rosto quadrado 64x64; quem chama coloca dentro de um círculo que corta as pontas. */
export function Rosto({ animal, triste = false, tamanho }: { animal: AnimalId; triste?: boolean; tamanho: number }) {
  return <Image source={{ uri: uriDe(animal, triste) }} style={{ width: tamanho, height: tamanho }} contentFit="cover" />;
}
