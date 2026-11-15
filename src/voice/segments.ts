// Adaptador do motor nativo para o jogo: transforma o texto do reconhecimento do aparelho
// (que pode vir acumulado e só fecha a frase no fim da escuta) em frases separadas,
// no mesmo formato que a Deepgram entrega: parciais e depois um final.
// Lógica pura (testada): o relógio entra como parâmetro.

export type Segment = { text: string; isFinal: boolean };

const words = (text: string) => text.split(/\s+/).filter(Boolean);
const startsWith = (all: string[], prefix: string[]) => prefix.length <= all.length && prefix.every((w, i) => all[i] === w);

export class SegmentAdapter {
  private baseline: string[] = [];
  private lastWords: string[] = [];
  private pending = '';
  private lastAt = 0;

  /**
   * `cumulativeAfterFinal`: depois de um final, o motor continua mandando o texto desde o começo
   * (iPhone). Se for false, depois de um final o texto recomeça do zero (Android).
   */
  private readonly cumulativeAfterFinal: boolean;
  private readonly silenceMs: number;

  constructor(cumulativeAfterFinal: boolean, silenceMs = 800) {
    this.cumulativeAfterFinal = cumulativeAfterFinal;
    this.silenceMs = silenceMs;
  }

  push(text: string, isFinal: boolean, now: number): Segment[] {
    const all = words(text);
    let start = 0;
    if (this.baseline.length > 0 && startsWith(all, this.baseline)) start = this.baseline.length;
    else this.baseline = [];
    const delta = all.slice(start).join(' ');
    this.lastWords = all;
    if (isFinal) {
      this.baseline = this.cumulativeAfterFinal ? all : [];
      this.pending = '';
      return delta ? [{ text: delta, isFinal: true }] : [];
    }
    if (!delta) return [];
    this.pending = delta;
    this.lastAt = now;
    return [{ text: delta, isFinal: false }];
  }

  /** Chamada de tempos em tempos: fecha a frase se ninguém falou nada novo por `silenceMs`. */
  flush(now: number): Segment[] {
    if (!this.pending || now - this.lastAt < this.silenceMs) return [];
    const text = this.pending;
    this.pending = '';
    this.baseline = this.lastWords;
    return [{ text, isFinal: true }];
  }

  /** Começou uma escuta nova: fecha o que estava em andamento e zera. */
  newSession(): Segment[] {
    const out: Segment[] = this.pending ? [{ text: this.pending, isFinal: true }] : [];
    this.pending = '';
    this.baseline = [];
    this.lastWords = [];
    return out;
  }
}
