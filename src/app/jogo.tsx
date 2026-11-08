// Partida no celular do operador: dicas, voz, pontos e as telas do layout aprovado.
// Mãos livres: o microfone fica aberto a partida inteira, a dica troca sozinha em 25 s e as telas
// "Acertou!" e de casa especial avançam sozinhas. Os botões continuam como reserva.
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Vibration } from 'react-native';

import { CARTAS, CATEGORIAS } from '@/content';
import { rotuloDaCategoria } from '@/content/catalog';
import {
  CLUE_MS, DEFAULT_GOAL, MAX_GOAL, MIN_GOAL, buildDeck, cluePoints, clueTimer, createInitialState, currentCard,
  effectCard, rankRows, reduce,
} from '@/game';
import type { SpecialKind } from '@/game';
import { joinRoom } from '@/realtime/room';
import type { Room, RoomStatus } from '@/realtime/room';
import { toView } from '@/realtime/view';
import type { TvScreen, TvView } from '@/realtime/view';
import { markPlayed, playedIdsOf } from '@/storage/played';
import { useVoiceSession } from '@/voice/session';
import { detectCommand, matchPlayerName, matchesAnswer, nextHeard } from '@/voice/text';
import type { HeardWords } from '@/voice/text';
import { Btn, Screen, T } from '@/ui/kit';
import { AnswerScreen, ConnectScreen, EffectScreen, FinalScreen, FixScreen, RevealScreen, RoundScreen, WhoScreen } from '@/ui/phone';
import type { UiPlayer } from '@/ui/phone';
import { colorOf } from '@/ui/ranking';
import { C, PLAYER_COLORS } from '@/ui/theme';

/** Depois de uma carta: "Acertou!" -> efeito da casa (se houver) -> próxima carta. Só da tela; as regras ficam no reducer. */
type Step = 'answer' | 'effect' | 'final';

/** Depois de ouvir a resposta (ou o fim das dicas), quanto tempo se ignora a mesma palavra se foi engano. */
const COOLDOWN_MS = 4000;
/** A TV recebe as últimas palavras no máximo a cada tanto (para não piscar). */
const WORDS_EVERY_MS = 350;

/** Categorias escolhidas na tela inicial (lista vazia = todas). */
function parseCats(raw?: string): string[] {
  try { return (JSON.parse(raw ?? '[]') as unknown[]).filter((c): c is string => typeof c === 'string'); } catch { return []; }
}

const kindOf = (k: string): SpecialKind => (k === 'dobro' || k === 'ladrao' || k === 'turbo' ? k : 'bad');

export default function Jogo() {
  useKeepAwake('pistache-partida'); // a tela do celular não apaga durante a partida
  const params = useLocalSearchParams<{ names?: string; goal?: string; room?: string; cats?: string }>();
  const cats = useMemo(() => parseCats(params.cats), [params.cats]);
  const [state, dispatch] = useReducer(reduce, params, (p) => {
    let names: string[] = [];
    try { names = JSON.parse(p.names ?? '[]'); } catch { /* sem nomes */ }
    const seed = Date.now() % 2147483647;
    const goal = Math.min(MAX_GOAL, Math.max(MIN_GOAL, Number(p.goal) || DEFAULT_GOAL));
    return reduce(createInitialState(), { type: 'START', names, goal, cards: buildDeck(CARTAS, parseCats(p.cats), seed, playedIdsOf(names)), seed });
  });

  const [paused, setPaused] = useState(false);
  const [heard, setHeard] = useState<string | null>(null); // a voz ouviu a resposta; falta dizer quem acertou
  const [picking, setPicking] = useState(false); // "Alguém acertou!" tocado à mão
  const [step, setStep] = useState<Step>('answer');
  const [startPoints, setStartPoints] = useState<Record<string, number>>({});
  const [leftMs, setLeftMs] = useState(CLUE_MS);
  const [noMic, setNoMic] = useState(false); // "Jogar sem microfone"
  const [tvStatus, setTvStatus] = useState<RoomStatus>('connecting');
  const [roomCode, setRoomCode] = useState(params.room ?? '');
  const [connecting, setConnecting] = useState(false); // tela "Conectar a TV"
  const [fixing, setFixing] = useState(false); // tela "Corrigir quem acertou"
  const [corrected, setCorrected] = useState(false); // a última rodada foi corrigida (a TV avisa)
  const room = useRef<Room | null>(null);
  const viewRef = useRef<TvView | null>(null);
  const stateRef = useRef(state);
  const pausedRef = useRef(paused);
  const heardRef = useRef(heard);
  const pickingRef = useRef(picking);
  const connectingRef = useRef(connecting);
  const runningRef = useRef(false);
  const elapsed = useRef(0); // ms de dica já corridos (sem contar pausas)
  const lastTick = useRef(Date.now());
  const ignoreAnswerUntil = useRef(0);
  const micWasOn = useRef(false);
  const wordsRef = useRef<HeardWords>({ done: [], shown: '' });
  const wordsSent = useRef<{ at: number; text: string; timer?: ReturnType<typeof setTimeout> }>({ at: 0, text: '' });
  const choosing = heard !== null || picking || connecting || fixing; // alguma tela de escolha aberta

  // ---- Voz: o microfone abre com a partida e só fecha quando ela termina ----
  const pushWords = (text: string, isFinal: boolean) => {
    wordsRef.current = nextHeard(wordsRef.current, text, isFinal);
    scheduleWords();
  };
  const scheduleWords = () => {
    const w = wordsSent.current;
    if (w.timer) return;
    w.timer = setTimeout(() => {
      w.timer = undefined;
      const text = wordsRef.current.shown;
      if (text === w.text) return;
      w.text = text;
      w.at = Date.now();
      room.current?.sendWords(text);
    }, Math.max(0, WORDS_EVERY_MS - (Date.now() - w.at)));
  };

  const voice = useVoiceSession((text, isFinal) => {
    pushWords(text, isFinal);
    const s = stateRef.current;
    const card = s.cards[s.cardIndex];
    if (!card || connectingRef.current) return;
    const who = s.players.filter((p) => !s.tiebreakIds || s.tiebreakIds.includes(p.id));
    const nameIn = () => matchPlayerName(text, who, [card.resposta, ...card.aliases]);

    if (s.phase === 'noWinner') { // quem chegou mais perto: o nome falado vale
      const id = nameIn();
      if (id) pickClosest(id);
      return;
    }
    if (s.phase !== 'clue') return;
    if (heardRef.current !== null || pickingRef.current) { // janela do nome de quem acertou
      const id = nameIn();
      if (id) pickCorrect(id);
      return;
    }
    if (!pausedRef.current && Date.now() >= ignoreAnswerUntil.current && matchesAnswer(text, card.resposta, card.aliases)) {
      const id = nameIn(); // "é a capivara, Lucas": já sabemos quem foi
      if (id) { pickCorrect(id); return; }
      setHeard(text);
      setPaused(true);
      return;
    }
    if (!isFinal) return;
    const cmd = detectCommand(text, pausedRef.current);
    if (cmd === 'advance') dispatch({ type: 'NEXT_CLUE' });
    else if (cmd === 'pause') setPaused(true);
    else if (cmd === 'resume') setPaused(false);
  });
  const { start: startVoice, stop: stopVoice } = voice;

  useEffect(() => {
    startVoice();
    return () => { void stopVoice(); };
  }, [startVoice, stopVoice]);

  if (voice.status === 'on') micWasOn.current = true;
  // Microfone fora: erro, ou reconectando depois de já ter funcionado. A dica fica parada até voltar.
  const micFailing = voice.status === 'error' || (voice.status === 'connecting' && micWasOn.current);
  const micOut = micFailing && !noMic;
  useEffect(() => { if (voice.status === 'on') setNoMic(false); }, [voice.status]);

  // ---- Relógio da dica: 25 s, a fala não zera ----
  const running = state.phase === 'clue' && !paused && !choosing && !micOut;
  useEffect(() => {
    stateRef.current = state; pausedRef.current = paused; heardRef.current = heard;
    pickingRef.current = picking; connectingRef.current = connecting || fixing; runningRef.current = running;
  });

  useEffect(() => {
    elapsed.current = 0;
    setLeftMs(CLUE_MS);
  }, [state.clue, state.cardIndex, state.phase]);

  useEffect(() => {
    lastTick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(now - lastTick.current, 1000);
      lastTick.current = now;
      if (!runningRef.current) return;
      elapsed.current += dt;
      const t = clueTimer(elapsed.current);
      setLeftMs(t.leftMs);
      if (t.expired) {
        elapsed.current = 0;
        dispatch({ type: 'NEXT_CLUE' });
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Guarda os pontos do começo de cada carta: o efeito mostra "antes -> depois" e a TV sabe onde cada peão estava.
  useEffect(() => {
    if (state.phase === 'clue' && state.clue === 1) {
      setStartPoints(Object.fromEntries(state.players.map((p) => [p.id, p.points])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.cardIndex]);

  // Carta nova: o quadro de palavras da TV começa limpo.
  useEffect(() => {
    wordsRef.current = { done: [], shown: '' };
    scheduleWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cardIndex]);

  // Ninguém pontuou na carta ("Ninguém chegou perto"): segue sozinho para a próxima.
  useEffect(() => {
    if (state.phase === 'roundEnd' && state.lastResult?.kind === 'none') nextCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.lastResult]);

  // Sala da TV: entra no canal e reenvia o estado quando a TV pede (também para quem entra com a partida rolando).
  const sendCurrent = (r: Room) => {
    const v = viewRef.current;
    if (!v) return;
    // A TV conta o tempo sozinha: ao reenviar, o valor tem de ser o de agora, não o de quando a dica começou.
    r.sendState({ ...v, timerMs: v.timerRunning ? Math.max(0, CLUE_MS - elapsed.current) : v.timerMs });
    r.sendWords(wordsRef.current.shown);
  };
  useEffect(() => {
    if (!roomCode) return;
    const r = joinRoom(roomCode, {
      onHello: () => sendCurrent(r),
      onStatus: (st) => { setTvStatus(st); if (st === 'ready') sendCurrent(r); },
    });
    room.current = r;
    return () => { r.leave(); room.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const effect = state.lastResult?.effect ?? null;
  const result = state.lastResult;
  const afterCard = state.phase === 'roundEnd' || state.phase === 'finished';
  const hasWinner = Boolean(result?.winnerId);
  // Fim da partida sem vencedor na última carta ("ninguém pontuou") vai direto para a tela final.
  const shown: Step = state.phase === 'finished' && !hasWinner ? 'final' : step;
  const tvScreen: TvScreen = !afterCard ? 'round' : !hasWinner && state.phase !== 'finished' ? 'round' : shown;

  // Vibração curta quando sai o pop-up de sorte ou azar.
  const effectTone = effect ? (effect.kind === 'lose3' || effect.kind === 'mute' || effect.kind === 'swapLast' ? 'bad' : 'good') : null;
  useEffect(() => {
    if (step !== 'effect' || !effectTone) return;
    try { Vibration.vibrate(effectTone === 'bad' ? [0, 220, 90, 220] : [0, 90, 60, 90]); } catch { /* sem vibração */ }
  }, [step, effectTone]);

  const order = state.players.map((p) => p.id);
  // O tempo que a TV recebe é uma foto de quando algo muda (dica nova, pausa, retomada); ela conta sozinha daí.
  const viewLeftMs = useMemo(() => Math.round(Math.max(0, CLUE_MS - elapsed.current) / 100) * 100,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.clue, state.cardIndex, state.phase, running]);
  const micOutForTv = micOut && (state.phase === 'clue' || state.phase === 'noWinner');
  const view = toView(state, {
    categoryLabel: state.cards.length ? rotuloDaCategoria(CATEGORIAS, currentCard(state).categoria) : '',
    paused, heard: heard !== null, micOut: micOutForTv, timerLeftMs: viewLeftMs, guesses: [], colors: PLAYER_COLORS, startPoints, screen: tvScreen, corrected,
  });
  const viewJson = JSON.stringify(view);
  useEffect(() => {
    viewRef.current = view;
    room.current?.sendState(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewJson]);

  const card = state.cards.length ? currentCard(state) : null;
  const cardId = card?.id;
  useEffect(() => {
    if (cardId) markPlayed(state.players.map((p) => p.name), cardId); // não repetir essa carta nas próximas partidas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);
  const ui: UiPlayer[] = state.players.map((p) => ({ id: p.id, name: p.name, points: p.points, color: colorOf(order, p.id) }));
  const eligible = ui.filter((p) => !state.tiebreakIds || state.tiebreakIds.includes(p.id));

  const openWho = () => { setPicking(true); setPaused(true); };
  const openConnect = () => { setConnecting(true); setPaused(true); };
  const closeConnect = () => { setConnecting(false); setPaused(false); };
  const closeWho = () => { setHeard(null); setPicking(false); setPaused(false); ignoreAnswerUntil.current = Date.now() + COOLDOWN_MS; };
  const pickCorrect = (id: string) => { setCorrected(false); setHeard(null); setPicking(false); setPaused(false); setStep('answer'); dispatch({ type: 'CORRECT', playerId: id }); };
  const pickClosest = (id: string | null) => { setCorrected(false); setStep('answer'); dispatch({ type: 'CLOSEST', playerId: id }); };
  const nextCard = () => {
    if (stateRef.current.phase === 'finished') { setStep('final'); return; }
    const last = stateRef.current.cardIndex + 1 >= stateRef.current.cards.length;
    setStep(last ? 'final' : 'answer');
    setPaused(false);
    setHeard(null);
    dispatch({ type: 'NEXT_ROUND' });
  };
  const playAgain = () => {
    const seed = Date.now() % 2147483647;
    setStep('answer'); setPaused(false); setHeard(null); setPicking(false); setStartPoints({});
    dispatch({ type: 'START', names: state.players.map((p) => p.name), goal: state.goal, cards: buildDeck(CARTAS, cats, seed, playedIdsOf(state.players.map((p) => p.name))), seed });
  };
  const openFix = () => setFixing(true);
  const pickFix = (id: string) => {
    const undo = stateRef.current.undo;
    if (!undo) { setFixing(false); return; }
    setStartPoints(Object.fromEntries(undo.snapshot.players.map((p) => [p.id, p.points])));
    setFixing(false); setPaused(false); setHeard(null); setPicking(false);
    setStep('answer'); setCorrected(true);
    dispatch({ type: 'FIX_WINNER', playerId: id });
  };
  const afterAnswer = () => { if (effect) setStep('effect'); else nextCard(); };

  if (!card) {
    return (
      <Screen>
        <T size={18}>Faltam jogadores ou cartas.</T>
        <Btn label="Voltar" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const timer = clueTimer(CLUE_MS - leftMs);
  const mic = { out: micOut, onPlayWithout: () => setNoMic(true) };
  const voiceLine =
    voice.status === 'on' ? (paused ? 'Pausado' : 'Ouvindo a sala')
      : voice.status === 'connecting' ? 'Conectando o microfone…'
      : voice.status === 'error' ? `Sem voz (${voice.error}). Use os botões.`
      : 'Microfone desligado';
  const voiceColor = voice.status === 'on' && !paused ? C.green : voice.status === 'error' ? C.red : C.muted;
  const nextLabel = state.phase === 'finished' ? 'Ver o vencedor' : state.tiebreakIds ? 'Carta de desempate' : 'Próxima carta';

  // ---- Corrigir quem acertou ----
  const undoInfo = state.undo;
  const fixOf = undoInfo?.winnerId ? state.players.find((p) => p.id === undoInfo.winnerId) : undefined;
  if (fixing && undoInfo) {
    const snapCard = state.cards[undoInfo.snapshot.cardIndex];
    return (
      <FixScreen
        answer={snapCard?.resposta ?? card.resposta}
        currentName={fixOf?.name ?? 'ninguém'}
        players={ui.filter((p) => p.id !== undoInfo.winnerId && (!undoInfo.snapshot.tiebreakIds || undoInfo.snapshot.tiebreakIds.includes(p.id)))}
        onPick={pickFix}
        onCancel={() => setFixing(false)}
      />
    );
  }
  const canFix = Boolean(undoInfo && undoInfo.winnerId);
  const lastLine = fixOf && undoInfo && state.phase === 'clue' && state.cardIndex > undoInfo.snapshot.cardIndex && state.clue <= 4
    ? `Última: ${fixOf.name} acertou na dica ${undoInfo.clue}, +${undoInfo.gained}` : undefined;

  // ---- Rodada ----
  if (state.phase === 'clue') {
    if (connecting) {
      return <ConnectScreen current={roomCode} onConnect={(c) => { setRoomCode(c); closeConnect(); }} onCancel={closeConnect} />;
    }
    if (choosing) {
      return <WhoScreen answer={heard !== null ? card.resposta : null} clue={state.clue} points={cluePoints(state.clue)} players={eligible} mic={mic} onPick={pickCorrect} onCancel={closeWho} />;
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
        timer={timer}
        mic={mic}
        lastLine={lastLine}
        onFix={lastLine ? openFix : undefined}
        players={ui}
        leaderId={view.leaderId}
        goal={state.goal}
        paused={paused}
        onPause={() => setPaused(!paused)}
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
        mic={mic}
        onPick={(id) => pickClosest(id)}
        onNone={() => pickClosest(null)}
      />
    );
  }

  // ---- Depois da carta: Acertou! -> efeito -> próxima carta; no fim, o vencedor ----
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
        onFix={canFix ? openFix : undefined}
      />
    );
  }

  const w = result?.winnerId ? ui.find((p) => p.id === result.winnerId) : undefined;
  if (shown === 'effect' && effect && result && w) {
    const fx = effectCard(effect, state.players, result.winnerId, state.seed + state.cardIndex);
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
        icon={fx?.icon ?? ''}
        title={fx?.title ?? ''}
        value={fx?.value ?? ''}
        detail={fx?.text ?? ''}
        nextLabel={nextLabel}
        onNext={nextCard}
        onFix={canFix ? openFix : undefined}
      />
    );
  }

  if (w && result) {
    return (
      <AnswerScreen
        answer={card.resposta}
        name={w.name}
        color={w.color}
        gained={result.gained}
        squares={Math.max(0, result.toSquare - result.fromSquare)}
        tiebreak={state.tiebreakIds !== null}
        goalReached={state.phase === 'finished'}
        nextLabel={effect ? 'Casa especial!' : nextLabel}
        onNext={afterAnswer}
        onFix={canFix ? openFix : undefined}
      />
    );
  }

  return null;
}
