// Rostos de bichinho da medalha (decisão 47), inspirados no Pitaco: formas simples desenhadas em SVG,
// sem imagens. Cada jogador recebe um bicho diferente, pela ordem em que entrou na partida.
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

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

const olhos = (y = 29, gap = 8, r = 2.8) => (
  <>
    <Circle cx={32 - gap} cy={y} r={r} fill={INK} />
    <Circle cx={32 + gap} cy={y} r={r} fill={INK} />
  </>
);

const sorriso = (y = 47, w = 6) => (
  <Path d={`M${32 - w} ${y}q${w} ${w * 0.7} ${w * 2} 0`} fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
);

const bigodes = (y = 44, cor = INK) => (
  <Path d={`M8 ${y - 3}l12 2M8 ${y + 3}l12-1M56 ${y - 3}l-12 2M56 ${y + 3}l-12-1`} stroke={cor} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
);

const ROSTOS: Record<AnimalId, { bg: string; rosto: ReactNode }> = {
  capivara: {
    bg: '#a8683a',
    rosto: (
      <>
        <Ellipse cx={17} cy={12} rx={5} ry={4} fill="#7e4a24" />
        <Ellipse cx={47} cy={12} rx={5} ry={4} fill="#7e4a24" />
        <Rect x={12} y={33} width={40} height={27} rx={13} fill="#c98a55" />
        {olhos(25)}
        <Ellipse cx={26} cy={40} rx={2.4} ry={1.6} fill="#5a3216" />
        <Ellipse cx={38} cy={40} rx={2.4} ry={1.6} fill="#5a3216" />
        {sorriso(49, 5)}
      </>
    ),
  },
  onca: {
    bg: '#f2a93b',
    rosto: (
      <>
        <Circle cx={14} cy={24} r={2.6} fill="#7a4a1e" />
        <Circle cx={19} cy={15} r={2.2} fill="#7a4a1e" />
        <Circle cx={50} cy={24} r={2.6} fill="#7a4a1e" />
        <Circle cx={45} cy={15} r={2.2} fill="#7a4a1e" />
        <Circle cx={32} cy={11} r={2.4} fill="#7a4a1e" />
        <Ellipse cx={32} cy={45} rx={14} ry={11} fill="#fbe3b5" />
        {olhos(29)}
        <Path d="M28.5 39h7l-3.5 4z" fill={INK} />
        {bigodes(45, '#7a4a1e')}
        {sorriso(47, 4)}
      </>
    ),
  },
  preguica: {
    bg: '#a89a85',
    rosto: (
      <>
        <Ellipse cx={32} cy={37} rx={22} ry={18} fill="#eadfca" />
        <Ellipse cx={23} cy={33} rx={7.5} ry={5} fill="#5a4a3a" transform="rotate(-18 23 33)" />
        <Ellipse cx={41} cy={33} rx={7.5} ry={5} fill="#5a4a3a" transform="rotate(18 41 33)" />
        <Circle cx={24} cy={32} r={2.4} fill="#fff" />
        <Circle cx={40} cy={32} r={2.4} fill="#fff" />
        <Ellipse cx={32} cy={41} rx={3.5} ry={2.5} fill={INK} />
        {sorriso(46, 4)}
      </>
    ),
  },
  tucano: {
    bg: '#2d2b3a',
    rosto: (
      <>
        <Circle cx={32} cy={60} r={18} fill="#f6f0dc" />
        <Circle cx={23} cy={26} r={5.5} fill="#4fb3e8" />
        <Circle cx={41} cy={26} r={5.5} fill="#4fb3e8" />
        {olhos(26, 9, 2.6)}
        <Path d="M22 35q10-4 20 0q-1 14-10 20q-9-6-10-20z" fill="#ff9d2e" />
        <Path d="M27 49q5 3 10 0q-2 4-5 6q-3-2-5-6z" fill={INK} />
      </>
    ),
  },
  coruja: {
    bg: '#8a6a4a',
    rosto: (
      <>
        <Path d="M13 9l10 10-12 3z" fill="#6e5236" />
        <Path d="M51 9l-10 10 12 3z" fill="#6e5236" />
        <Circle cx={23} cy={31} r={9.5} fill="#fbe3b5" />
        <Circle cx={41} cy={31} r={9.5} fill="#fbe3b5" />
        {olhos(31, 9, 4)}
        <Circle cx={24.5} cy={29.5} r={1.3} fill="#fff" />
        <Circle cx={42.5} cy={29.5} r={1.3} fill="#fff" />
        <Path d="M28.5 41h7l-3.5 6z" fill="#f2a93b" />
      </>
    ),
  },
  raposa: {
    bg: '#ef7a2b',
    rosto: (
      <>
        <Path d="M9 22l4-17 14 11z" fill="#c95a18" />
        <Path d="M55 22l-4-17-14 11z" fill="#c95a18" />
        <Path d="M6 34q26-6 52 0q-6 26-26 28q-20-2-26-28z" fill="#fcebd8" />
        {olhos(30)}
        <Ellipse cx={32} cy={42} rx={3.6} ry={2.6} fill={INK} />
        {sorriso(47, 4)}
      </>
    ),
  },
  lontra: {
    bg: '#6f4e37',
    rosto: (
      <>
        <Circle cx={12} cy={24} r={4.5} fill="#563b28" />
        <Circle cx={52} cy={24} r={4.5} fill="#563b28" />
        <Ellipse cx={32} cy={46} rx={22} ry={15} fill="#ecd5b3" />
        {olhos(30)}
        <Ellipse cx={32} cy={40} rx={4.2} ry={3} fill={INK} />
        {bigodes(45, INK)}
        {sorriso(47, 4)}
      </>
    ),
  },
  sapo: {
    bg: '#5aa83a',
    rosto: (
      <>
        <Circle cx={21} cy={21} r={9.5} fill="#7cc455" />
        <Circle cx={43} cy={21} r={9.5} fill="#7cc455" />
        <Circle cx={21} cy={21} r={5.5} fill="#fff" />
        <Circle cx={43} cy={21} r={5.5} fill="#fff" />
        {olhos(21, 11, 2.8)}
        <Circle cx={15} cy={42} r={3.5} fill="#f28b8b" opacity={0.7} />
        <Circle cx={49} cy={42} r={3.5} fill="#f28b8b" opacity={0.7} />
        <Path d="M17 39q15 14 30 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  jabuti: {
    bg: '#8fbf5a',
    rosto: (
      <>
        <Path d="M0 0h64v22q-32 10-64 0z" fill="#8a6436" />
        <Circle cx={20} cy={13} r={4.5} fill="#b38a52" />
        <Circle cx={32} cy={10} r={4.5} fill="#b38a52" />
        <Circle cx={44} cy={13} r={4.5} fill="#b38a52" />
        {olhos(36)}
        <Circle cx={30} cy={44} r={1} fill={INK} />
        <Circle cx={34} cy={44} r={1} fill={INK} />
        {sorriso(49, 5)}
      </>
    ),
  },
  pinguim: {
    bg: '#3a404c',
    rosto: (
      <>
        <Ellipse cx={24} cy={38} rx={12} ry={15} fill="#f4f4f4" />
        <Ellipse cx={40} cy={38} rx={12} ry={15} fill="#f4f4f4" />
        {olhos(34, 8)}
        <Path d="M28 41h8l-4 5z" fill="#f2a93b" />
      </>
    ),
  },
  mico: {
    bg: '#f0a030',
    rosto: (
      <>
        <Ellipse cx={32} cy={38} rx={15} ry={17} fill="#6b3d1d" />
        <Circle cx={26} cy={33} r={3.2} fill="#fbe3b5" />
        <Circle cx={38} cy={33} r={3.2} fill="#fbe3b5" />
        <Circle cx={26} cy={33} r={1.6} fill={INK} />
        <Circle cx={38} cy={33} r={1.6} fill={INK} />
        <Ellipse cx={32} cy={42} rx={2.6} ry={1.8} fill="#c9895a" />
        <Path d="M28 47q4 3 8 0" fill="none" stroke="#fbe3b5" strokeWidth={1.6} strokeLinecap="round" />
      </>
    ),
  },
  jacare: {
    bg: '#4f8a3a',
    rosto: (
      <>
        <Circle cx={21} cy={21} r={8} fill="#6fae52" />
        <Circle cx={43} cy={21} r={8} fill="#6fae52" />
        <Circle cx={21} cy={21} r={4.5} fill="#ffd54a" />
        <Circle cx={43} cy={21} r={4.5} fill="#ffd54a" />
        <Rect x={20} y={18} width={2} height={6} rx={1} fill={INK} />
        <Rect x={42} y={18} width={2} height={6} rx={1} fill={INK} />
        <Rect x={13} y={34} width={38} height={22} rx={11} fill="#6fae52" />
        <Circle cx={26} cy={40} r={1.8} fill={INK} />
        <Circle cx={38} cy={40} r={1.8} fill={INK} />
        <Path d="M18 50h28" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M22 50l2 3 2-3M30 50l2 3 2-3M38 50l2 3 2-3" fill="#fff" />
      </>
    ),
  },
  gato: {
    bg: '#9aa3ad',
    rosto: (
      <>
        <Path d="M10 22l5-16 13 10z" fill="#828c97" />
        <Path d="M54 22l-5-16-13 10z" fill="#828c97" />
        <Ellipse cx={32} cy={45} rx={12} ry={9} fill="#f4f4f4" />
        {olhos(31)}
        <Path d="M29.5 40h5l-2.5 3z" fill="#f28ba0" />
        {bigodes(44)}
        {sorriso(46, 3.5)}
      </>
    ),
  },
  cachorro: {
    bg: '#e2a65c',
    rosto: (
      <>
        <Ellipse cx={10} cy={32} rx={8} ry={16} fill="#8a5a2a" />
        <Ellipse cx={54} cy={32} rx={8} ry={16} fill="#8a5a2a" />
        <Ellipse cx={32} cy={45} rx={13} ry={10} fill="#fbe3b5" />
        {olhos(30)}
        <Ellipse cx={32} cy={41} rx={4.4} ry={3.2} fill={INK} />
        <Path d="M29 48q3 6 6 0z" fill="#f2788f" />
      </>
    ),
  },
  vaca: {
    bg: '#f2f2f2',
    rosto: (
      <>
        <Circle cx={13} cy={16} r={10} fill="#2b2b2b" />
        <Circle cx={52} cy={13} r={8} fill="#2b2b2b" />
        <Circle cx={48} cy={30} r={3.5} fill="#2b2b2b" />
        {olhos(29)}
        <Rect x={13} y={38} width={38} height={20} rx={10} fill="#f4a6a6" />
        <Ellipse cx={24} cy={47} rx={2.6} ry={3.2} fill="#b0505a" />
        <Ellipse cx={40} cy={47} rx={2.6} ry={3.2} fill="#b0505a" />
      </>
    ),
  },
  porquinho: {
    bg: '#f7a8b8',
    rosto: (
      <>
        <Path d="M12 16l12 2-6 10z" fill="#e5849a" />
        <Path d="M52 16l-12 2 6 10z" fill="#e5849a" />
        {olhos(28)}
        <Ellipse cx={32} cy={42} rx={11} ry={8} fill="#e5849a" />
        <Ellipse cx={28} cy={42} rx={2} ry={3} fill="#a8435a" />
        <Ellipse cx={36} cy={42} rx={2} ry={3} fill="#a8435a" />
        {sorriso(52, 4)}
      </>
    ),
  },
};

/** Rosto quadrado 64x64; quem chama coloca dentro de um círculo que corta as pontas. */
export function Rosto({ animal, triste = false, tamanho }: { animal: AnimalId; triste?: boolean; tamanho: number }) {
  const { bg, rosto } = ROSTOS[animal];
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64">
      <Rect width={64} height={64} fill={bg} />
      {rosto}
      {triste ? (
        <>
          {/* sobrancelhas caídas e uma lágrima: triste, nunca humilhante */}
          <Path d="M15 21l10 4M49 21l-10 4" stroke={INK} strokeWidth={2} strokeLinecap="round" />
          <Path d="M22 36q-4 7 0 9q4-2 0-9z" fill="#7ad1ff" />
        </>
      ) : null}
    </Svg>
  );
}
