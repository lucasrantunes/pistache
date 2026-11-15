// Teste de leitura: compara o texto lido em voz alta com o que o motor de voz entendeu.
// Lógica pura (testada). Usa a mesma tolerância de erro que o jogo usa nas respostas.
import { countMagicWords, normalize, similarWord } from './text.ts';

export type ReadingProblem = {
  /** Palavra do texto. Vazio = o motor inventou uma palavra a mais. */
  expected: string;
  /** Palavra entendida. Vazio = o motor perdeu a palavra. */
  heard: string;
};

export type ReadingResult = {
  refWords: number;
  correct: number;
  substituted: number;
  missing: number;
  extra: number;
  /** Acerto estrito, de 0 a 1 (palavra tem de ser idêntica). */
  accuracy: number;
  /** Acerto aceitando pequenos erros de grafia, como o jogo aceita nas respostas. */
  lenientAccuracy: number;
  magicExpected: number;
  magicHeard: number;
  problems: ReadingProblem[];
};

const toWords = (text: string) => normalize(text).split(' ').filter(Boolean);

export function compareReading(reference: string, heard: string): ReadingResult {
  const a = toWords(reference);
  const b = toWords(heard);
  const n = a.length;
  const m = b.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  let correct = 0;
  let substituted = 0;
  let lenientSubs = 0;
  let missing = 0;
  let extra = 0;
  const problems: ReadingProblem[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] === b[j - 1]) {
        correct += 1;
      } else {
        substituted += 1;
        if (similarWord(b[j - 1], a[i - 1])) lenientSubs += 1;
        problems.unshift({ expected: a[i - 1], heard: b[j - 1] });
      }
      i -= 1;
      j -= 1;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      missing += 1;
      problems.unshift({ expected: a[i - 1], heard: '' });
      i -= 1;
    } else {
      extra += 1;
      problems.unshift({ expected: '', heard: b[j - 1] });
      j -= 1;
    }
  }
  const errors = substituted + missing + extra;
  const lenientErrors = substituted - lenientSubs + missing + extra;
  return {
    refWords: n,
    correct,
    substituted,
    missing,
    extra,
    accuracy: n > 0 ? Math.max(0, 1 - errors / n) : 0,
    lenientAccuracy: n > 0 ? Math.max(0, 1 - lenientErrors / n) : 0,
    magicExpected: countMagicWords(reference),
    magicHeard: countMagicWords(heard),
    problems,
  };
}

/**
 * Junta o que o motor entendeu durante a leitura. Parcial = frase ainda em andamento;
 * final = frase fechada. Uma escuta nova fecha o que estava em andamento.
 */
export class ReadingCollector {
  private done: string[] = [];
  private current = '';
  sessions = 1;

  reset() {
    this.done = [];
    this.current = '';
    this.sessions = 1;
  }

  newSession() {
    if (this.current) this.done.push(this.current);
    this.current = '';
    this.sessions += 1;
  }

  push(text: string, isFinal: boolean) {
    if (isFinal) {
      this.done.push(text);
      this.current = '';
    } else {
      this.current = text;
    }
  }

  text(): string {
    return [...this.done, this.current].filter(Boolean).join(' ');
  }
}
