import { SPECIAL_SQUARES, SQUARES } from './board.ts';
import type { SpecialKind } from './board.ts';

export interface RankInput {
  id: string;
  name: string;
  points: number;
}

export interface RankRow {
  id: string;
  name: string;
  points: number;
  /** Pontos no início da carta (para mostrar o "+N" e quem subiu ou desceu). */
  prevPoints: number;
  gained: number;
  /** Posição atual (1 = primeiro). Empatados dividem a posição. */
  rank: number;
  prevRank: number;
  /** Positivo = subiu posições; negativo = desceu. */
  move: number;
  remaining: number;
  leader: boolean;
}

const rankOf = (points: number, all: number[]): number => 1 + all.filter((v) => v > points).length;

/** Placar da carta: ordenado do primeiro ao último, com variação em relação ao início da carta. */
export function rankRows(players: RankInput[], startPoints: Record<string, number>, goal: number): RankRow[] {
  const now = players.map((p) => p.points);
  const before = players.map((p) => startPoints[p.id] ?? p.points);
  const top = Math.max(0, ...now);
  const leaders = players.filter((p) => p.points === top);
  const rows = players.map((p, i): RankRow => {
    const rank = rankOf(p.points, now);
    const prevRank = rankOf(before[i], before);
    return {
      id: p.id,
      name: p.name,
      points: p.points,
      prevPoints: before[i],
      gained: p.points - before[i],
      rank,
      prevRank,
      move: prevRank - rank,
      remaining: Math.max(0, goal - p.points),
      leader: top > 0 && leaders.length === 1 && leaders[0].id === p.id,
    };
  });
  return rows.sort((a, b) => a.rank - b.rank);
}

/** Marcas das casas especiais ao longo do caminho até a meta (0 a 1). */
export function specialTicks(): { frac: number; kind: SpecialKind }[] {
  return Object.entries(SPECIAL_SQUARES).map(([sq, kind]) => ({ frac: Number(sq) / SQUARES, kind }));
}
