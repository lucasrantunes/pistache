import { Platform } from 'react-native';

// Cores do Pitaco (noite roxa, vidro translúcido).
export const C = {
  bg: '#160f3e',
  bgTop: '#1f1554',
  ink: '#f4efff',
  muted: '#b8abdc',
  lavender: '#b79cff',
  lavenderDark: '#8a63f0',
  glass: 'rgba(150,120,240,0.14)',
  glassStrong: 'rgba(150,120,240,0.24)',
  line: 'rgba(196,176,255,0.26)',
  yellow: '#ffca4b',
  green: '#39e58c',
  greenFill: 'rgba(20,110,72,0.5)',
  orange: '#ff8f3d',
  lime: '#b7f04a',
  red: '#ff777b',
  dark: '#1b1248',
} as const;

export const PLAYER_COLORS = [
  '#ff8f3d', '#b79cff', '#b7f04a', '#5cc8ff', '#ff9fc4',
  '#ffca4b', '#39e58c', '#ff777b', '#d9ccff', '#7ee0d2',
];

export const F = {
  brand: 'LilitaOne_400Regular',
  ui: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
};

/** Cor da faixa de pontos: vale muito (lima) até vale pouco (vermelho). */
export const pointsColor = (v: number): string => (v >= 15 ? C.lime : v >= 8 ? C.yellow : v >= 4 ? C.orange : C.red);
