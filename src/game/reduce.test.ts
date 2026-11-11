import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitialState, reduce, settle } from './reduce.ts';
import type { Card, GameState } from './types.ts';

const makeCards = (n: number): Card[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c${i}`, categoria: 'coisa', resposta: `Resposta ${i}`, aliases: [],
    dicas: Array.from({ length: 20 }, (_, k) => `dica ${k + 1}`), dificuldade: 1,
  }));

const start = (names = ['Ana', 'Bia'], cards = makeCards(5), seed = 1): GameState =>
  reduce(createInitialState(), { type: 'START', names, cards, seed, goal: 50 });

/** Ajusta pontos e dica para montar um cenário. */
const scenario = (points: number[], clue: number, seed = 1): GameState => {
  const s = start(points.map((_, i) => `J${i + 1}`), makeCards(5), seed);
  return { ...s, clue, players: s.players.map((p, i) => ({ ...p, points: points[i] })) };
};

test('START valida jogadores e cartas', () => {
  const s0 = createInitialState();
  assert.equal(reduce(s0, { type: 'START', names: ['Ana'], cards: makeCards(1), seed: 1 }), s0);
  assert.equal(reduce(s0, { type: 'START', names: ['Ana', 'Bia'], cards: [], seed: 1 }), s0);
  const s = start();
  assert.equal(s.phase, 'clue');
  assert.equal(s.clue, 1);
  assert.equal(s.players.length, 2);
});

test('pontos: 1ª dica vale 20 e a 20ª vale 1', () => {
  const a = reduce(start(), { type: 'CORRECT', playerId: 'p1' });
  assert.equal(a.players[0].points, 20);
  assert.equal(a.phase, 'roundEnd');
  const b = reduce({ ...start(), clue: 20 }, { type: 'CORRECT', playerId: 'p1' });
  assert.equal(b.players[0].points, 1);
});

test('NEXT_CLUE avança e, após a 20ª, ninguém acertou', () => {
  let s = start();
  s = reduce(s, { type: 'NEXT_CLUE' });
  assert.equal(s.clue, 2);
  for (let i = 0; i < 18; i++) s = reduce(s, { type: 'NEXT_CLUE' });
  assert.equal(s.clue, 20);
  s = reduce(s, { type: 'NEXT_CLUE' });
  assert.equal(s.phase, 'noWinner');
  const c = reduce(s, { type: 'CLOSEST', playerId: 'p2' });
  assert.equal(c.players[1].points, 5);
  const none = reduce(s, { type: 'CLOSEST', playerId: null });
  assert.equal(none.players[1].points, 0);
  assert.equal(none.phase, 'roundEnd');
});

test('eventos fora de hora são ignorados', () => {
  const s = start();
  assert.equal(reduce(s, { type: 'NEXT_ROUND' }), s);
  assert.equal(reduce(s, { type: 'CLOSEST', playerId: 'p1' }), s);
  assert.equal(reduce(s, { type: 'CORRECT', playerId: 'zzz' }), s);
});

test('parar em Dobro: a próxima carta vale em dobro e o bônus se gasta', () => {
  let s = reduce(scenario([10, 0], 19), { type: 'CORRECT', playerId: 'p1' }); // 12 pts = casa 6
  assert.equal(s.lastResult?.effect?.kind, 'dobro');
  assert.equal(s.players[0].doubleNext, true);
  s = reduce(s, { type: 'NEXT_ROUND' });
  s = reduce({ ...s, clue: 20 }, { type: 'CORRECT', playerId: 'p1' });
  assert.equal(s.players[0].points, 14);
  assert.equal(s.players[0].doubleNext, false);
});

test('passar por cima de casas especiais não ativa nada', () => {
  const s = reduce(scenario([10, 0], 9), { type: 'CORRECT', playerId: 'p1' }); // 10 -> 22: passa 6 e 9
  assert.equal(s.players[0].points, 22);
  assert.equal(s.lastResult?.effect, null);
});

test('Turbo: +4 pontos na hora', () => {
  const s = reduce(scenario([38, 0], 19), { type: 'CORRECT', playerId: 'p1' }); // 40 = casa 20
  assert.equal(s.lastResult?.effect?.kind, 'turbo');
  assert.equal(s.players[0].points, 44);
});

test('Ladrão: rouba 3 de quem está à frente; sendo o líder, ganha do banco', () => {
  const a = reduce(scenario([24, 30], 19), { type: 'CORRECT', playerId: 'p1' }); // 26 = casa 13
  assert.equal(a.players[0].points, 29);
  assert.equal(a.players[1].points, 27);
  const b = reduce(scenario([24, 10], 19), { type: 'CORRECT', playerId: 'p1' });
  assert.equal(b.players[0].points, 29);
  assert.equal(b.players[1].points, 10);
});

test('azar: efeitos válidos, sem pontos negativos', () => {
  const kinds = new Set<string>();
  for (let seed = 1; seed <= 60; seed++) {
    const s = reduce(scenario([4, 0], 19, seed), { type: 'CORRECT', playerId: 'p1' }); // 6 = casa 3
    const k = s.lastResult?.effect?.kind;
    assert.ok(k === 'lose3' || k === 'mute' || k === 'swapLast');
    kinds.add(k!);
    assert.ok(s.players.every((p) => p.points >= 0));
  }
  assert.equal(kinds.size, 3);
});

test('azar: quem já é o último nunca troca com o último', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const s = reduce(scenario([4, 10], 19, seed), { type: 'CORRECT', playerId: 'p1' });
    assert.notEqual(s.lastResult?.effect?.kind, 'swapLast');
  }
});

test('mudo vale na 1ª dica da próxima carta e some na seguinte', () => {
  let found: GameState | null = null;
  for (let seed = 1; seed <= 60 && !found; seed++) {
    const s = reduce(scenario([4, 0], 19, seed), { type: 'CORRECT', playerId: 'p1' });
    if (s.lastResult?.effect?.kind === 'mute') found = s;
  }
  assert.ok(found);
  let s = reduce(found!, { type: 'NEXT_ROUND' });
  assert.deepEqual(s.muted, ['p1']);
  s = reduce(s, { type: 'NEXT_CLUE' });
  assert.deepEqual(s.muted, []);
});

test('chegar à meta encerra com vencedor', () => {
  const s = reduce(scenario([40, 30], 10), { type: 'CORRECT', playerId: 'p1' }); // 51
  assert.equal(s.phase, 'finished');
  assert.deepEqual(s.winnerIds, ['p1']);
});

test('empate na meta vai para a carta de desempate', () => {
  const tied = settle({ ...scenario([50, 50, 10], 1) });
  assert.equal(tied.phase, 'roundEnd');
  assert.deepEqual(tied.tiebreakIds, ['p1', 'p2']);
  let s = reduce(tied, { type: 'NEXT_ROUND' });
  assert.equal(reduce(s, { type: 'CORRECT', playerId: 'p3' }), s); // fora do desempate
  s = reduce(s, { type: 'CORRECT', playerId: 'p2' });
  assert.equal(s.phase, 'finished');
  assert.deepEqual(s.winnerIds, ['p2']);
});

test('acabaram as cartas: termina com quem tem mais pontos', () => {
  let s = start(['Ana', 'Bia'], makeCards(1));
  s = reduce(s, { type: 'CORRECT', playerId: 'p2' });
  s = reduce(s, { type: 'NEXT_ROUND' });
  assert.equal(s.phase, 'finished');
  assert.deepEqual(s.winnerIds, ['p2']);
});

test('mesma semente, mesmo resultado', () => {
  const run = () => reduce(scenario([4, 0], 19, 7), { type: 'CORRECT', playerId: 'p1' });
  assert.deepEqual(run(), run());
});

test('FIX_WINNER passa os pontos de quem foi marcado por engano para quem acertou', () => {
  let s = start(['Ana', 'Bia']);
  s = reduce(s, { type: 'CORRECT', playerId: 'p1' });
  const gained = s.lastResult!.gained;
  assert.equal(s.players[0].points >= gained, true);
  s = reduce(s, { type: 'FIX_WINNER', playerId: 'p2' });
  assert.equal(s.players[0].points, 0);
  assert.equal(s.players[1].points >= gained, true);
  assert.equal(s.lastResult!.winnerId, 'p2');
  assert.equal(s.phase === 'roundEnd' || s.phase === 'finished', true);
});

test('FIX_WINNER vale também depois de NEXT_ROUND e sem rodada anterior não faz nada', () => {
  let s = start(['Ana', 'Bia']);
  assert.equal(reduce(s, { type: 'FIX_WINNER', playerId: 'p2' }), s);
  s = reduce(s, { type: 'CORRECT', playerId: 'p1' });
  if (s.phase === 'roundEnd') s = reduce(s, { type: 'NEXT_ROUND' });
  const fixed = reduce(s, { type: 'FIX_WINNER', playerId: 'p2' });
  assert.equal(fixed.players[0].points, 0);
  assert.equal(fixed.lastResult!.winnerId, 'p2');
  assert.equal(fixed.cardIndex, 0);
});

test('FIX_WINNER desfaz o efeito da casa especial de quem foi marcado errado', () => {
  let s = start(['Ana', 'Bia']);
  s = { ...s, players: s.players.map((p) => (p.id === 'p1' ? { ...p, points: 100 } : p)), goal: 500 };
  const before = s.players[0].points;
  s = reduce(s, { type: 'CORRECT', playerId: 'p1' });
  s = reduce(s, { type: 'FIX_WINNER', playerId: 'p2' });
  assert.equal(s.players[0].points, before);
  assert.equal(s.players[0].doubleNext, false);
});

test('DISCARD na carta em jogo pula para a próxima sem pontos para ninguém', () => {
  let s = start(['Ana', 'Bia']);
  s = { ...s, clue: 7 };
  s = reduce(s, { type: 'DISCARD' });
  assert.equal(s.phase, 'clue');
  assert.equal(s.cardIndex, 1);
  assert.equal(s.clue, 1);
  assert.deepEqual(s.players.map((p) => p.points), [0, 0]);
  assert.equal(s.lastResult, null);
});

test('DISCARD depois de pontuar desfaz os pontos e o efeito e vem a próxima carta', () => {
  let s = start(['Ana', 'Bia']);
  s = { ...s, players: s.players.map((p) => (p.id === 'p1' ? { ...p, points: 100 } : p)), goal: 500 };
  s = reduce(s, { type: 'CORRECT', playerId: 'p1' });
  assert.equal(s.phase, 'roundEnd');
  s = reduce(s, { type: 'DISCARD' });
  assert.equal(s.phase, 'clue');
  assert.equal(s.cardIndex, 1);
  assert.equal(s.players[0].points, 100);
  assert.equal(s.players[0].doubleNext, false);
  assert.equal(s.undo, null);
});

test('DISCARD na última carta termina a partida; depois da meta, desfaz e a partida segue', () => {
  const last = { ...start(['Ana', 'Bia'], makeCards(1)), clue: 3 };
  const fim = reduce(last, { type: 'DISCARD' });
  assert.equal(fim.phase, 'finished');
  assert.equal(fim.lastResult, null);

  let s = start(['Ana', 'Bia']);
  s = { ...s, players: s.players.map((p) => (p.id === 'p1' ? { ...p, points: 49 } : p)), clue: 1 };
  s = reduce(s, { type: 'CORRECT', playerId: 'p1' });
  assert.equal(s.phase, 'finished');
  s = reduce(s, { type: 'DISCARD' });
  assert.equal(s.phase, 'clue');
  assert.equal(s.players[0].points, 49);
  assert.deepEqual(s.winnerIds, []);
});

test('DISCARD sem carta em jogo nem pontuação para desfazer não faz nada', () => {
  const s = start(['Ana', 'Bia']);
  const r = reduce(s, { type: 'CORRECT', playerId: 'p1' });
  const semUndo = { ...r, undo: null };
  assert.equal(reduce(semUndo, { type: 'DISCARD' }), semUndo);
});
