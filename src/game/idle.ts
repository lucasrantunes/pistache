// Avanço automático por inatividade (decisão 10): 20 s parado mostra contagem de 10 s; aos 30 s avança.
export const IDLE_WARN_MS = 20_000;
export const IDLE_ADVANCE_MS = 30_000;

export type IdleState =
  | { kind: 'quiet'; secondsToWarn: number }
  | { kind: 'countdown'; secondsLeft: number }
  | { kind: 'advance' };

export function idleState(elapsedMs: number): IdleState {
  if (elapsedMs >= IDLE_ADVANCE_MS) return { kind: 'advance' };
  if (elapsedMs >= IDLE_WARN_MS) return { kind: 'countdown', secondsLeft: Math.ceil((IDLE_ADVANCE_MS - elapsedMs) / 1000) };
  return { kind: 'quiet', secondsToWarn: Math.ceil((IDLE_WARN_MS - elapsedMs) / 1000) };
}
