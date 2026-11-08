// O que a TV recebe: um retrato pequeno do estado. A resposta só aparece quando a rodada termina.
import { cluePoints } from '../game/board.ts';
import { effectCard } from '../game/describe.ts';
import type { EffectCard } from '../game/describe.ts';
import { CLUE_MS } from '../game/timing.ts';
import { squareOf } from '../game/board.ts';
import type { GameState } from '../game/types.ts';

export interface TvPlayer {
  id: string;
  name: string;
  points: number;
  color: string;
  square: number;
  doubleNext: boolean;
  muteNext: boolean;
  muted: boolean;
  /** Pontos no início da carta (para o "+N" do placar). */
  prevPoints: number;
}

/** Qual tela o celular está mostrando agora; a TV acompanha. */
export type TvScreen = 'round' | 'answer' | 'effect' | 'final';

export interface TvResult {
  winnerId: string | null;
  winnerName: string;
  gained: number;
  effectText: string;
  /** Pop-up de azar ou sorte; ausente quando não há efeito. */
  effectCard?: EffectCard | null;
  fromSquare: number;
  toSquare: number;
}

export interface TvView {
  v: 1;
  phase: GameState['phase'];
  goal: number;
  cardIndex: number;
  total: number;
  category: string;
  clue: number;
  points: number;
  clueText: string | null;
  answer: string | null;
  /** A voz ouviu a resposta e falta dizer quem acertou: a TV já mostra a palavra (decisão: falso alarme não importa). */
  heardAnswer: string | null;
  /** Microfone do celular fora do ar: a TV mostra uma faixa grande e o tempo da dica fica parado. */
  micOut: boolean;
  /** Tempo que faltava na dica quando o estado foi enviado; a TV conta sozinha a partir daí. */
  timerMs: number;
  timerRunning: boolean;
  paused: boolean;
  heard: boolean;
  players: TvPlayer[];
  leaderId: string | null;
  guesses: string[];
  result: TvResult | null;
  tiebreak: boolean;
  winnerIds: string[];
  /** Acrescentado no layout novo; TVs antigas ignoram. */
  screen?: TvScreen;
  /** A última rodada foi corrigida pelo operador (a TV mostra "Corrigido"). */
  corrected?: boolean;
}

export type ViewExtras = {
  paused: boolean;
  heard: boolean;
  micOut?: boolean;
  /** Milissegundos que faltam na dica (sem isso, a dica está cheia). */
  timerLeftMs?: number;
  guesses: string[];
  colors: string[];
  startPoints?: Record<string, number>;
  /** Nome da categoria para mostrar (sem isso, vai o id). */
  categoryLabel?: string;
  screen?: TvScreen;
  corrected?: boolean;
};

export function toView(state: GameState, extras: ViewExtras): TvView {
  const card = state.cards[state.cardIndex];
  const revealed = state.phase === 'roundEnd' || state.phase === 'noWinner' || state.phase === 'finished';
  const players: TvPlayer[] = state.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    points: p.points,
    color: extras.colors[i % extras.colors.length],
    square: squareOf(p.points, state.goal),
    doubleNext: p.doubleNext,
    muteNext: p.muteNext,
    muted: state.muted.includes(p.id),
    prevPoints: extras.startPoints?.[p.id] ?? p.points,
  }));
  const top = Math.max(0, ...players.map((p) => p.points));
  const leaders = players.filter((p) => p.points === top);
  const r = state.lastResult;
  const fx = r ? effectCard(r.effect, state.players, r.winnerId, state.seed + state.cardIndex) : null;
  return {
    v: 1,
    phase: state.phase,
    goal: state.goal,
    cardIndex: state.cardIndex,
    total: state.cards.length,
    category: extras.categoryLabel || (card?.categoria ?? ''),
    clue: state.clue,
    points: cluePoints(state.clue),
    clueText: state.phase === 'clue' && card ? card.dicas[state.clue - 1] : null,
    answer: revealed && card ? card.resposta : null,
    heardAnswer: !revealed && extras.heard && card ? card.resposta : null,
    micOut: extras.micOut === true,
    timerMs: extras.timerLeftMs ?? CLUE_MS,
    timerRunning: state.phase === 'clue' && !extras.paused && !extras.heard && extras.micOut !== true,
    paused: extras.paused,
    heard: extras.heard,
    players,
    leaderId: top > 0 && leaders.length === 1 ? leaders[0].id : null,
    guesses: extras.guesses.slice(-5),
    result: r
      ? {
          winnerId: r.winnerId,
          winnerName: state.players.find((p) => p.id === r.winnerId)?.name ?? '',
          gained: r.gained,
          effectText: fx?.text ?? '',
          effectCard: fx,
          fromSquare: r.fromSquare,
          toSquare: r.toSquare,
        }
      : null,
    tiebreak: state.tiebreakIds !== null,
    winnerIds: state.winnerIds,
    screen: extras.screen ?? 'round',
    corrected: extras.corrected === true,
  };
}
