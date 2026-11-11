// Placar do teste de voz: cruza os momentos em que a pessoa marcou "disse" com os momentos
// em que o app detectou a palavra. Lógica pura (testada).

export type ProbeResult = {
  attempts: number;
  hits: number;
  misses: number;
  /** Detecções que não correspondem a nenhuma tentativa marcada. */
  falsePositives: number;
  /** Atraso entre a marcação e a detecção, em ms (0 se detectou antes da marcação). */
  latenciesMs: number[];
  avgMs: number | null;
  maxMs: number | null;
};

/**
 * `attempts`: instantes (ms) em que a pessoa tocou no botão logo depois de falar.
 * `detections`: instantes (ms) em que o app detectou a palavra.
 * Uma detecção vale para a tentativa se cair entre `beforeMs` antes e `afterMs` depois da marcação.
 */
export function matchProbe(attempts: number[], detections: number[], beforeMs = 2500, afterMs = 4000): ProbeResult {
  const sortedDetections = [...detections].sort((a, b) => a - b);
  const used = new Set<number>();
  const latenciesMs: number[] = [];
  for (const a of [...attempts].sort((x, y) => x - y)) {
    const index = sortedDetections.findIndex((d, i) => !used.has(i) && d >= a - beforeMs && d <= a + afterMs);
    if (index < 0) continue;
    used.add(index);
    latenciesMs.push(Math.max(0, sortedDetections[index] - a));
  }
  const hits = latenciesMs.length;
  return {
    attempts: attempts.length,
    hits,
    misses: attempts.length - hits,
    falsePositives: sortedDetections.length - used.size,
    latenciesMs,
    avgMs: hits > 0 ? Math.round(latenciesMs.reduce((a, b) => a + b, 0) / hits) : null,
    maxMs: hits > 0 ? Math.max(...latenciesMs) : null,
  };
}
