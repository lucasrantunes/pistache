import {
  DEFAULT_GOAL, LOSE_POINTS, MAX_CLUES, MAX_PLAYERS, MIN_PLAYERS, NO_WINNER_POINTS, SPECIAL_SQUARES,
  SQUARES, STEAL_POINTS, cluePoints, squareOf,
} from './board.ts';
import { pickIndex } from './rng.ts';
import type { Effect, EffectKind, GameEvent, GameState, Player, RoundResult } from './types.ts';

export function createInitialState(): GameState {
  return {
    phase: 'setup', players: [], goal: DEFAULT_GOAL, cards: [], cardIndex: 0, clue: 1,
    muted: [], tiebreakIds: null, seed: 1, lastResult: null, winnerIds: [],
  };
}

function leadersOf(players: Player[]): Player[] {
  const top = Math.max(...players.map((p) => p.points));
  return players.filter((p) => p.points === top);
}

/** Confere meta e desempate depois de pontuar. */
export function settle(state: GameState): GameState {
  const top = Math.max(...state.players.map((p) => p.points));
  if (top >= state.goal) {
    const leaders = leadersOf(state.players);
    if (leaders.length === 1) return { ...state, phase: 'finished', winnerIds: [leaders[0].id] };
    return { ...state, phase: 'roundEnd', tiebreakIds: leaders.map((p) => p.id) };
  }
  return { ...state, phase: 'roundEnd' };
}

function applyEffect(
  players: Player[], meId: string, special: 'bad' | 'dobro' | 'ladrao' | 'turbo', goal: number, seed: number,
): { players: Player[]; seed: number; effect: Effect } {
  const me = players.find((p) => p.id === meId)!;
  const set = (id: string, fn: (p: Player) => Player) => players.map((p) => (p.id === id ? fn(p) : p));

  if (special === 'dobro') {
    return { players: set(meId, (p) => ({ ...p, doubleNext: true })), seed, effect: { kind: 'dobro' } };
  }
  if (special === 'turbo') {
    const amount = Math.round((2 * goal) / SQUARES);
    return { players: set(meId, (p) => ({ ...p, points: p.points + amount })), seed, effect: { kind: 'turbo', amount } };
  }
  if (special === 'ladrao') {
    const ahead = players.filter((p) => p.points > me.points);
    if (ahead.length === 0) {
      return { players: set(meId, (p) => ({ ...p, points: p.points + STEAL_POINTS })), seed, effect: { kind: 'ladrao', amount: STEAL_POINTS } };
    }
    const [i, s] = pickIndex(seed, ahead.length);
    const victim = ahead[i];
    const amount = Math.min(STEAL_POINTS, victim.points);
    const next = players.map((p) =>
      p.id === victim.id ? { ...p, points: p.points - amount } : p.id === meId ? { ...p, points: p.points + amount } : p);
    return { players: next, seed: s, effect: { kind: 'ladrao', targetId: victim.id, amount } };
  }
  // azar: perder 3, ficar mudo ou trocar com o último (re-sorteia se já é o último)
  const minPts = Math.min(...players.map((p) => p.points));
  const options: EffectKind[] = ['lose3', 'mute', 'swapLast'];
  if (me.points === minPts) options.splice(2, 1);
  const [oi, s1] = pickIndex(seed, options.length);
  const kind = options[oi];
  if (kind === 'lose3') {
    const amount = Math.min(LOSE_POINTS, me.points);
    return { players: set(meId, (p) => ({ ...p, points: p.points - amount })), seed: s1, effect: { kind, amount } };
  }
  if (kind === 'mute') {
    return { players: set(meId, (p) => ({ ...p, muteNext: true })), seed: s1, effect: { kind } };
  }
  const lasts = players.filter((p) => p.id !== meId && p.points === minPts);
  const [li, s2] = pickIndex(s1, lasts.length);
  const other = lasts[li];
  const next = players.map((p) => (p.id === meId ? { ...p, points: other.points } : p.id === other.id ? { ...p, points: me.points } : p));
  return { players: next, seed: s2, effect: { kind, targetId: other.id } };
}

function award(state: GameState, playerId: string, gained: number, kind: 'correct' | 'closest'): GameState {
  const goal = state.goal;
  const before = state.players.find((p) => p.id === playerId)!;
  const fromSquare = squareOf(before.points, goal);
  let players = state.players.map((p) =>
    p.id === playerId ? { ...p, points: p.points + gained, doubleNext: kind === 'correct' ? false : p.doubleNext } : p);
  const toSquare = squareOf(before.points + gained, goal);
  let seed = state.seed;
  let effect: Effect | null = null;
  const special = SPECIAL_SQUARES[toSquare];
  // Só vale a casa em que o jogador para, e não na carta de desempate.
  if (special && toSquare > fromSquare && !state.tiebreakIds) {
    const r = applyEffect(players, playerId, special, goal, seed);
    players = r.players;
    seed = r.seed;
    effect = r.effect;
  }
  const lastResult: RoundResult = { kind, winnerId: playerId, gained, fromSquare, toSquare, effect };
  return settle({ ...state, players, seed, lastResult });
}

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START': {
      const names = event.names.map((n) => n.trim()).filter(Boolean);
      if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS || event.cards.length === 0) return state;
      return {
        ...createInitialState(),
        phase: 'clue',
        players: names.map((name, i) => ({ id: `p${i + 1}`, name, points: 0, doubleNext: false, muteNext: false })),
        goal: event.goal ?? DEFAULT_GOAL,
        cards: event.cards,
        seed: event.seed,
      };
    }
    case 'NEXT_CLUE': {
      if (state.phase !== 'clue') return state;
      if (state.clue >= MAX_CLUES) return { ...state, phase: 'noWinner', muted: [] };
      return { ...state, clue: state.clue + 1, muted: [] };
    }
    case 'CORRECT': {
      if (state.phase !== 'clue') return state;
      const p = state.players.find((x) => x.id === event.playerId);
      if (!p || (state.tiebreakIds && !state.tiebreakIds.includes(p.id))) return state;
      return award(state, p.id, cluePoints(state.clue) * (p.doubleNext ? 2 : 1), 'correct');
    }
    case 'CLOSEST': {
      if (state.phase !== 'noWinner') return state;
      if (event.playerId === null) {
        return settle({ ...state, lastResult: { kind: 'none', winnerId: null, gained: 0, fromSquare: 0, toSquare: 0, effect: null } });
      }
      const p = state.players.find((x) => x.id === event.playerId);
      if (!p || (state.tiebreakIds && !state.tiebreakIds.includes(p.id))) return state;
      return award(state, p.id, NO_WINNER_POINTS, 'closest');
    }
    case 'NEXT_ROUND': {
      if (state.phase !== 'roundEnd') return state;
      const next = state.cardIndex + 1;
      if (next >= state.cards.length) {
        return { ...state, phase: 'finished', winnerIds: leadersOf(state.players).map((p) => p.id) };
      }
      return {
        ...state,
        phase: 'clue',
        cardIndex: next,
        clue: 1,
        muted: state.players.filter((p) => p.muteNext).map((p) => p.id),
        players: state.players.map((p) => ({ ...p, muteNext: false })),
        lastResult: null,
      };
    }
  }
}

export const currentCard = (state: GameState) => state.cards[state.cardIndex];
