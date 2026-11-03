import { Platform } from 'react-native';

// Paleta do layout aprovado (decisão 43): noite roxa, painéis sólidos, chips com borda colorida.
export const C = {
  bg: '#130d2f',
  bgTop: '#1a1242',
  panel: '#211747',
  track: '#2b1f5c',
  ink: '#ffffff',
  muted: '#b9aee0',
  lavender: '#b18aff',
  lavenderDark: '#7a55d6',
  glass: '#211747',
  glassStrong: '#2b1f5c',
  line: '#3a2d70',
  yellow: '#ffca4b',
  green: '#32e397',
  greenFill: 'rgba(50,227,151,0.14)',
  orange: '#ff8f3d',
  lime: '#b7f04a',
  red: '#ff777b',
  dark: '#130d2f',
} as const;

export const PLAYER_COLORS = [
  '#b18aff', '#ffca4b', '#32e397', '#ff8f3d', '#b7f04a',
  '#ff777b', '#5cc8ff', '#ff9fc4', '#d9ccff', '#7ee0d2',
];

export const F = {
  brand: 'LilitaOne_400Regular',
  ui: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
};

/** Cor da faixa de pontos: vale muito (lima) até vale pouco (vermelho). */
export const pointsColor = (v: number): string => (v >= 15 ? C.lime : v >= 8 ? C.yellow : v >= 4 ? C.orange : C.red);
