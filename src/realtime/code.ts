// Código de sala de 4 letras (sem vogais, para não formar palavras).
const LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';

export function newRoomCode(random: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < 4; i++) out += LETTERS[Math.min(LETTERS.length - 1, Math.floor(random() * LETTERS.length))];
  return out;
}

/** Limpa o que o jogador digitou: maiúsculas, só letras, no máximo 4. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export const isValidCode = (code: string): boolean => /^[A-Z]{4}$/.test(code);
