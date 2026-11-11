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
 * "Pistache" avança a pista. "Pistache, pausa" pausa. Com o jogo pausado, "Pistache" retoma.
 * A palavra "pista" (exata, sem tolerância) também avança, mas só com o jogo rodando.
 */
export function detectCommand(transcript: string, paused: boolean): VoiceCommand | null {
  const words = normalize(transcript).split(' ').filter(Boolean);
  const at = words.findIndex((w) => similarWord(w, MAGIC));
  if (at < 0) return !paused && words.includes('pista') ? 'advance' : null;
  const next = words[at + 1];
  const saidPause = next !== undefined && similarWord(next, 'pausa');
  if (paused) return saidPause ? null : 'resume';
  return saidPause ? 'pause' : 'advance';
}

export interface NamedPlayer {
  id: string;
  name: string;
}

/**
 * Quem o texto nomeia? Aceita o nome inteiro ou só o primeiro nome (com a mesma tolerância das respostas).
 * `ignore` são frases que não contam (a resposta da carta e os apelidos dela, para "Santos" não virar o jogador Santos).
 * Se duas pessoas combinam igualmente bem, devolve null (o operador toca em quem foi).
 */
export function matchPlayerName(transcript: string, players: NamedPlayer[], ignore: string[] = []): string | null {
  let words = normalize(transcript).split(' ').filter(Boolean);
  const skip = new Set(ignore.flatMap((p) => normalize(p).split(' ')).filter(Boolean));
  words = words.filter((w) => !skip.has(w));
  if (words.length === 0) return null;
  const scored: { id: string; score: number }[] = [];
  for (const p of players) {
    const parts = normalize(p.name).split(' ').filter(Boolean);
    if (parts.length === 0) continue;
    let score = 0;
    if (parts.length > 1 && containsPhrase(words.join(' '), p.name)) score = parts.length;
    else if (words.some((w) => similarWord(w, parts[0]))) score = 1;
    if (score > 0) scored.push({ id: p.id, score });
  }
  if (scored.length === 0) return null;
  const best = Math.max(...scored.map((x) => x.score));
  const top = scored.filter((x) => x.score === best);
  return top.length === 1 ? top[0].id : null;
}

/**
 * As últimas palavras ditas, para o quadro fixo da TV. `done` guarda as palavras das falas já finalizadas;
 * o texto parcial (ainda sendo falado) só entra na exibição.
 */
export interface HeardWords {
  done: string[];
  shown: string;
}

export function nextHeard(prev: HeardWords, text: string, isFinal: boolean, count = 2): HeardWords {
  const words = text.split(/\s+/).filter(Boolean);
  const all = [...prev.done, ...words];
  const tail = all.slice(-count);
  return { done: isFinal ? all.slice(-count) : prev.done, shown: tail.join(' ') };
}

/** Quantas vezes a palavra mágica ("Pistache", ou "pista" exata) aparece no texto. */
export function countMagicWords(transcript: string): number {
  return normalize(transcript)
    .split(' ')
    .filter((w) => w !== '' && (similarWord(w, MAGIC) || w === 'pista')).length;
}
