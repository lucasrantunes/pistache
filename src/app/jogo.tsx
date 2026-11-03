// Partida no celular do operador: dicas, voz, pontos e as telas do layout aprovado.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { CARTAS, CATEGORIAS } from '@/content';
import { rotuloDaCategoria } from '@/content/catalog';
import {
  buildDeck, cluePoints, createInitialState, currentCard, effectText as describeEffect, idleState, rankRows, reduce,
} from '@/game';
import type { SpecialKind } from '@/game';
import { joinRoom } from '@/realtime/room';
import type { Room, RoomStatus } from '@/realtime/room';
import { toView } from '@/realtime/view';
import type { TvScreen, TvView } from '@/realtime/view';
import { useVoiceSession } from '@/voice/session';
import { detectCommand, matchesAnswer } from '@/voice/text';
import { Btn, Screen, T } from '@/ui/kit';
import { ConnectScreen, EffectScreen, FinalScreen, RankingScreen, RevealScreen, RoundScreen, WhoScreen } from '@/ui/phone';
import type { UiPlayer } from '@/ui/phone';
import { colorOf } from '@/ui/ranking';
import { C, PLAYER_COLORS } from '@/ui/theme';

/** Depois de uma carta: efeito da casa -> placar -> (fim de jogo). Só da tela; as regras ficam no reducer. */
type Step = 'result' | 'ranking' | 'final';

/** Categorias escolhidas na tela inicial (lista vazia = todas). */
function parseCats(raw?: string): string[] {
  try { return (JSON.parse(raw ?? '[]') as unknown[]).filter((c): c is string => typeof c === 'string'); } catch { return []; }
}

const kindOf = (k: string): SpecialKind => (k === 'dobro' || k === 'ladrao' || k === 'turbo' ? k : 'bad');

export default function Jogo() {
  const params = useLocalSearchParams<{ names?: string; goal?: string; room?: string; cats?: string }>();
  const cats = useMemo(() => parseCats(params.cats), [params.cats]);
  const [state, dispatch] = useReducer(reduce, params, (p) => {
    let names: string[] = [];
    try { names = JSON.parse(p.names ?? '[]'); } catch { /* sem nomes */ }
    const seed = Date.now() % 2147483647;
    return reduce(createInitialState(), { type: 'START', names, goal: Number(p.goal) || 50, cards: buildDeck(CARTAS, parseCats(p.cats), seed), seed });
  });

  const [paused, setPaused] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [picking, setPicking] = useState(false); // "Alguém acertou!" tocado à mão
  const [step, setStep] = useState<Step>('result');
  const [startPoints, setStartPoints] = useState<Record<string, number>>({});
  const [idleMs, setIdleMs] = useState(0);
  const [tvStatus, setTvStatus] = useState<RoomStatus>('connecting');
  const [roomCode, setRoomCode] = useState(params.room ?? '');
  const [connecting, setConnecting] = useState(false); // tela "Conectar a TV"
  const room = useRef<Room | null>(null);
  const viewRef = useRef<TvView | null>(null);
  const lastActivity = useRef(Date.now());
  const stateRef = useRef(state);
  const pausedRef = useRef(paused);
  const lockedRef = useRef(false);
  const choosing = heard !== null || picking || connecting; // alguma tela de escolha aberta
  useEffect(() => { stateRef.current = state; pausedRef.current = paused; lockedRef.current = choosing; });

  const voice = useVoiceSession((text, isFinal) => {
    const s = stateRef.current;
    if (s.phase !== 'clue' || lockedRef.current) return;
    lastActivity.current = Date.now();
    const card = s.cards[s.cardIndex];
    if (!pausedRef.current && matchesAnswer(text, card.resposta, card.aliases)) {
      setHeard(text);
      setPaused(true);
      return;
    }
    if (!isFinal) return;
    const cmd = detectCommand(text, pausedRef.current);
    if (cmd === 'advance') dispatch({ type: 'NEXT_CLUE' });
    else if (cmd === 'pause') setPaused(true);
    else if (cmd === 'resume') { setPaused(false); lastActivity.current = Date.now(); }
  });
  const { start: startVoice, stop: stopVoice } = voice;

  // O microfone só fica aberto durante a rodada.
  useEffect(() => {
    if (state.phase !== 'clue') return;
    startVoice();
    return () => { void stopVoice(); };
  }, [state.phase, state.cardIndex, startVoice, stopVoice]);

  // Cada dica nova zera o relógio de inatividade.
  useEffect(() => {
    lastActivity.current = Date.now();
    setIdleMs(0);
  }, [state.clue, state.cardIndex, state.phase]);

  useEffect(() => {
    if (state.phase !== 'clue' || paused || choosing) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      setIdleMs(elapsed);
      if (idleState(elapsed).kind === 'advance') dispatch({ type: 'NEXT_CLUE' });
    }, 500);
    return () => clearInterval(id);
  }, [state.phase, paused, choosing, state.clue]);

  // Guarda os pontos do começo de cada carta: o placar mostra "+N" e quem subiu ou desceu.
  useEffect(() => {
    if (state.phase === 'clue' && state.clue === 1) {
      setStartPoints(Object.fromEntries(state.players.map((p) => [p.id, p.points])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.cardIndex]);

  // Sala da TV: entra no canal e reenvia o estado quando a TV pede (também para quem entra com a partida rolando).
  useEffect(() => {
    if (!roomCode) return;
    const r = joinRoom(roomCode, {
      onHello: () => { if (viewRef.current) r.sendState(viewRef.current); },
      onStatus: (st) => { setTvStatus(st); if (st === 'ready' && viewRef.current) r.sendState(viewRef.current); },
    });
    room.current = r;
    return () => { r.leave(); room.current = null; };
  }, [roomCode]);

  const effect = state.lastResult?.effect ?? null;
  // Sem efeito de casa, pula direto para o placar.
  const shown: Step = step === 'result' && !effect ? 'ranking' : step;
  const afterCard = state.phase === 'roundEnd' || state.phase === 'finished';
  const tvScreen: TvScreen = !afterCard ? 'round' : shown === 'result' ? 'effect' : shown;

  const order = state.players.map((p) => p.id);
  const view = toView(state, { categoryLabel: state.cards.length ? rotuloDaCategoria(CATEGORIAS, currentCard(state).categoria) : '', paused, heard: heard !== null, guesses: [], colors: PLAYER_COLORS, startPoints, screen: tvScreen });
  const viewJson = JSON.stringify(view);
  useEffect(() => {
    viewRef.current = view;
    room.current?.sendState(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewJson]);

  const card = state.cards.length ? currentCard(state) : null;
  const ui: UiPlayer[] = state.players.map((p) => ({ id: p.id, name: p.name, points: p.points, color: colorOf(order, p.id) }));
  const eligible = ui.filter((p) => !state.tiebreakIds || state.tiebreakIds.includes(p.id));

  const openWho = () => { setPicking(true); setPaused(true); };
  const openConnect = () => { setConnecting(true); setPaused(true); };
  const closeConnect = () => { setConnecting(false); setPaused(false); lastActivity.current = Date.now(); };
  const closeWho = () => { setHeard(null); setPicking(false); setPaused(false); lastActivity.current = Date.now(); };
  const pickCorrect = (id: string) => { setHeard(null); setPicking(false); setPaused(false); setStep('result'); dispatch({ type: 'CORRECT', playerId: id }); };
  const pickClosest = (id: string | null) => { setStep('result'); dispatch({ type: 'CLOSEST', playerId: id }); };
  const nextCard = () => {
    if (state.phase === 'finished') { setStep('final'); return; }
    const last = state.cardIndex + 1 >= state.cards.length;
    setStep(last ? 'final' : 'result');
    setPaused(false);
    setHeard(null);
    dispatch({ type: 'NEXT_ROUND' });
  };
  const playAgain = () => {
    const seed = Date.now() % 2147483647;
    setStep('result'); setPaused(false); setHeard(null); setPicking(false); setStartPoints({});
    dispatch({ type: 'START', names: state.players.map((p) => p.name), goal: state.goal, cards: buildDeck(CARTAS, cats, seed), seed });
  };

  if (!card) {
    return (
      <Screen>
        <T size={18}>Faltam jogadores ou cartas.</T>
        <Btn label="Voltar" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const idle = idleState(idleMs);
  const voiceLine =
    voice.status === 'on' ? (paused ? 'Pausado' : 'Ouvindo a sala')
      : voice.status === 'connecting' ? 'Conectando o microfone…'
      : voice.status === 'error' ? `Sem voz (${voice.error}). Use os botões.`
      : 'Microfone desligado';
  const voiceColor = voice.status === 'on' && !paused ? C.green : voice.status === 'error' ? C.red : C.muted;
  const idleLine = idle.kind === 'countdown' ? `avança em ${idle.secondsLeft}s` : idle.kind === 'quiet' ? `${idle.secondsToWarn + 10}s` : '…';

  // ---- Rodada ----
  if (state.phase === 'clue') {
    if (connecting) {
      return <ConnectScreen current={roomCode} onConnect={(c) => { setRoomCode(c); closeConnect(); }} onCancel={closeConnect} />;
    }
    if (choosing) {
      return <WhoScreen heard={heard} clue={state.clue} points={cluePoints(state.clue)} players={eligible} onPick={pickCorrect} onCancel={closeWho} />;
    }
    return (
      <RoundScreen
        category={rotuloDaCategoria(CATEGORIAS, card.categoria)}
        roomCode={roomCode}
        tvReady={tvStatus === 'ready'}
        clue={state.clue}
        points={cluePoints(state.clue)}
        hint={card.dicas[state.clue - 1]}
        mutedNames={state.players.filter((p) => state.muted.includes(p.id)).map((p) => p.name)}
        voiceLine={voiceLine}
        voiceColor={voiceColor}
        idleLine={idleLine}
        idleWarn={idle.kind === 'countdown'}
        players={ui}
        leaderId={view.leaderId}
        goal={state.goal}
        paused={paused}
        onPause={() => { setPaused(!paused); lastActivity.current = Date.now(); }}
        onSkip={() => dispatch({ type: 'NEXT_CLUE' })}
        onSomeoneGotIt={openWho}
        onExit={() => router.replace('/')}
        onRoomPress={openConnect}
      />
    );
  }

  // ---- Ninguém acertou ----
  if (state.phase === 'noWinner') {
    return (
      <RevealScreen
        cardNo={state.cardIndex + 1}
        answer={card.resposta}
        category={rotuloDaCategoria(CATEGORIAS, card.categoria)}
        players={eligible}
        onPick={(id) => pickClosest(id)}
        onNone={() => pickClosest(null)}
      />
    );
  }

  // ---- Depois da carta: efeito -> placar -> vencedor ----
  const result = state.lastResult;

  if (shown === 'final' && state.phase === 'finished') {
    return (
      <FinalScreen
        winners={ui.filter((p) => state.winnerIds.includes(p.id))}
        cards={state.cardIndex + 1}
        rows={rankRows(state.players, {}, state.goal)}
        order={order}
        goal={state.goal}
        onAgain={playAgain}
        onChange={() => router.replace('/')}
      />
    );
  }

  if (shown === 'result' && effect && result?.winnerId) {
    const w = ui.find((p) => p.id === result.winnerId)!;
    const text = describeEffect(effect, state.players).replace(/^[^:]+:\s*/, '');
    const detail = effect.kind === 'dobro' ? `${w.name}: ${text}` : effect.kind === 'turbo' ? `${w.name} ganhou ${text}` : `${w.name} ${text}`;
    return (
      <EffectScreen
        name={w.name}
        color={w.color}
        gained={result.gained}
        before={startPoints[w.id] ?? w.points}
        after={w.points}
        fromSquare={result.fromSquare}
        toSquare={result.toSquare}
        kind={kindOf(effect.kind)}
        detail={detail}
        onNext={() => setStep('ranking')}
      />
    );
  }

  return (
    <RankingScreen
      cardNo={state.cardIndex + 1}
      answer={card.resposta}
      goal={state.goal}
      rows={rankRows(state.players, startPoints, state.goal)}
      order={order}
      tiebreak={state.tiebreakIds !== null}
      final={state.phase === 'finished'}
      onNext={nextCard}
    />
  );
}
