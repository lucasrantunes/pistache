// Texto da voz: normalização, palavra mágica e conferência de resposta (lógica pura, com testes).

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Erro tolerado por palavra, conforme o tamanho: curtas exatas, longas aceitam pequenos erros. */
function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

export function similarWord(heard: string, wanted: string): boolean {
  return levenshtein(heard, wanted) <= tolerance(wanted.length);
}

/** A frase aparece no texto, em palavras inteiras seguidas (com pequena tolerância por palavra). */
export function containsPhrase(transcript: string, phrase: string): boolean {
  const words = normalize(transcript).split(' ').filter(Boolean);
  const target = normalize(phrase).split(' ').filter(Boolean);
  if (target.length === 0 || words.length < target.length) return false;
  for (let i = 0; i <= words.length - target.length; i++) {
    if (target.every((t, k) => similarWord(words[i + k], t))) return true;
  }
  return false;
}

export function matchesAnswer(transcript: string, answer: string, aliases: string[] = []): boolean {
  return [answer, ...aliases].some((candidate) => containsPhrase(transcript, candidate));
}

export type VoiceCommand = 'advance' | 'pause' | 'resume';

const MAGIC = 'pistache';

/**
 * "Pistache" avança a dica. "Pistache, pausa" pausa. Com o jogo pausado, "Pistache" retoma.
 * Sem a palavra mágica, nada acontece.
 */
export function detectCommand(transcript: string, paused: boolean): VoiceCommand | null {
  const words = normalize(transcript).split(' ').filter(Boolean);
  const at = words.findIndex((w) => similarWord(w, MAGIC));
  if (at < 0) return null;
  const next = words[at + 1];
  const saidPause = next !== undefined && similarWord(next, 'pausa');
  if (paused) return saidPause ? null : 'resume';
  return saidPause ? 'pause' : 'advance';
}
