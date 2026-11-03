// Partida no celular do operador: dicas, voz, pontos e "quem acertou?".
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import pack from '@/content/packs/teste.json';
import {
  MAX_CLUES, cluePoints, createInitialState, currentCard, idleState, reduce, shuffle, squareOf,
} from '@/game';
import type { Card, GameState } from '@/game';
import { effectText as describeEffect } from '@/game';
import { joinRoom } from '@/realtime/room';
import type { Room, RoomStatus } from '@/realtime/room';
import { toView } from '@/realtime/view';
import type { TvView } from '@/realtime/view';
import { useVoiceSession } from '@/voice/session';
import { detectCommand, matchesAnswer } from '@/voice/text';
import { Btn, Glass, Medal, Pill, Screen, T } from '@/ui/kit';
import { C, PLAYER_COLORS, pointsColor } from '@/ui/theme';

const CARDS = pack.cartas as unknown as Card[];

function PlayerGrid({ state, onPick }: { state: GameState; onPick: (id: string) => void }) {
  const eligible = state.players.filter((p) => !state.tiebreakIds || state.tiebreakIds.includes(p.id));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {eligible.map((p) => {
        const color = PLAYER_COLORS[state.players.indexOf(p) % PLAYER_COLORS.length];
        return (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => onPick(p.id)}
            style={({ pressed }) => ({
              width: '48%', minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
              borderRadius: 24, borderWidth: 2, borderColor: color, backgroundColor: pressed ? color + '55' : color + '24',
            })}>
            <Medal name={p.name} color={color} size={42} />
            <View style={{ flexShrink: 1 }}>
              <T font="brand" size={22} numberOfLines={1}>{p.name}</T>
              <T font="mono" size={12} color={C.muted}>{p.points} pts</T>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Board({ state }: { state: GameState }) {
  const sorted = [...state.players].sort((a, b) => b.points - a.points);
  return (
    <Glass style={{ gap: 10 }}>
      <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>PLACAR · META {state.goal}</T>
      {sorted.map((p, i) => {
        const color = PLAYER_COLORS[state.players.indexOf(p) % PLAYER_COLORS.length];
        return (
          <View key={p.id} style={{ gap: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T font="mono" size={14} color={i === 0 ? C.yellow : C.muted} style={{ width: 16 }}>{i + 1}</T>
              <Medal name={p.name} color={color} size={32} />
              <T font="brand" size={20} style={{ flex: 1 }} numberOfLines={1}>{p.name}{p.doubleNext ? '  x2' : ''}{p.muteNext ? '  mudo' : ''}</T>
              <T font="mono" size={15} color={color}>{p.points}</T>
              <T font="mono" size={12} color={C.muted}>casa {squareOf(p.points, state.goal)}</T>
            </View>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(196,176,255,0.16)' }}>
              <View style={{ height: 5, borderRadius: 3, width: `${Math.min(100, (p.points / state.goal) * 100)}%`, backgroundColor: color }} />
            </View>
          </View>
        );
      })}
    </Glass>
  );
}

function PointsStrip({ points }: { points: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={`Vale ${points} pontos`}>
      {Array.from({ length: MAX_CLUES }, (_, i) => i + 1).map((v) => (
        <View key={v} style={{ flex: 1, height: 9, borderRadius: 5, backgroundColor: v <= points ? pointsColor(v) : 'rgba(196,176,255,0.14)' }} />
      ))}
    </View>
  );
}

export default function Jogo() {
  const params = useLocalSearchParams<{ names?: string; goal?: string; room?: string }>();
  const [state, dispatch] = useReducer(reduce, params, (p) => {
    let names: string[] = [];
    try { names = JSON.parse(p.names ?? '[]'); } catch { /* sem nomes */ }
    const seed = Date.now() % 2147483647;
    return reduce(createInitialState(), { type: 'START', names, goal: Number(p.goal) || 50, cards: shuffle(CARDS, seed), seed });
  });

  const [paused, setPaused] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [idleMs, setIdleMs] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [tvStatus, setTvStatus] = useState<RoomStatus>('connecting');
  const roomCode = params.room ?? '';
  const room = useRef<Room | null>(null);
  const viewRef = useRef<TvView | null>(null);
  const lastActivity = useRef(Date.now());
  const stateRef = useRef(state);
  const pausedRef = useRef(paused);
  const heardRef = useRef(heard);
  useEffect(() => { stateRef.current = state; pausedRef.current = paused; heardRef.current = heard; });

  const voice = useVoiceSession((text, isFinal) => {
    const s = stateRef.current;
    if (s.phase !== 'clue' || heardRef.current) return;
    lastActivity.current = Date.now();
    const card = s.cards[s.cardIndex];
    if (!pausedRef.current && matchesAnswer(text, card.resposta, card.aliases)) {
      setHeard(text);
      setPaused(true);
      return;
    }
    if (!isFinal) return;
    const cmd = detectCommand(text, pausedRef.current);
    if (!cmd && text.trim().split(/\s+/).length <= 4) setGuesses((g) => [...g, text.trim().toLowerCase()].slice(-5));
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
    if (state.phase !== 'clue' || paused) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      setIdleMs(elapsed);
      if (idleState(elapsed).kind === 'advance') dispatch({ type: 'NEXT_CLUE' });
    }, 500);
    return () => clearInterval(id);
  }, [state.phase, paused, state.clue]);

  // Novo palpite zera a cada carta.
  useEffect(() => { setGuesses([]); }, [state.cardIndex]);

  // Sala da TV: entra no canal, reenvia o estado quando a TV pede.
  useEffect(() => {
    if (!roomCode) return;
    const r = joinRoom(roomCode, {
      onHello: () => { if (viewRef.current) r.sendState(viewRef.current); },
      onStatus: (st) => { setTvStatus(st); if (st === 'ready' && viewRef.current) r.sendState(viewRef.current); },
    });
    room.current = r;
    return () => { r.leave(); room.current = null; };
  }, [roomCode]);

  const view = toView(state, { paused, heard: heard !== null, guesses, colors: PLAYER_COLORS });
  const viewJson = JSON.stringify(view);
  useEffect(() => {
    viewRef.current = view;
    room.current?.sendState(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewJson]);

  const card = state.cards.length ? currentCard(state) : null;
  const points = cluePoints(state.clue);
  const idle = idleState(idleMs);

  const pickCorrect = (id: string) => { setHeard(null); setPaused(false); dispatch({ type: 'CORRECT', playerId: id }); };
  const dismissHeard = () => { setHeard(null); setPaused(false); lastActivity.current = Date.now(); };
  const nextRound = () => { setPaused(false); setHeard(null); dispatch({ type: 'NEXT_ROUND' }); };

  if (!card) {
    return (
      <Screen>
        <T size={18}>Faltam jogadores ou cartas.</T>
        <Btn label="Voltar" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const voiceLine =
    voice.status === 'on' ? (paused ? 'Pausado: diga “Pistache” para retomar' : 'Ouvindo a sala')
      : voice.status === 'connecting' ? 'Conectando o microfone…'
      : voice.status === 'error' ? `Sem voz (${voice.error}). Use os botões.`
      : 'Microfone desligado';
  const voiceColor = voice.status === 'on' ? C.green : voice.status === 'error' ? C.red : C.muted;
  const idleLine = paused ? 'parado'
    : idle.kind === 'countdown' ? `avança em ${idle.secondsLeft}s`
    : idle.kind === 'quiet' ? `avança em ${idle.secondsToWarn + 10}s` : '…';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T font="brand" size={28} color={C.yellow}>Pistache</T>
        <Pill label={roomCode ? `TV ${roomCode}${tvStatus === 'ready' ? '' : ' …'}` : `CARTA ${state.cardIndex + 1}/${state.cards.length}`} />
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={{ padding: 8 }}>
          <T size={14} color={C.muted}>Sair</T>
        </Pressable>
      </View>

      {state.phase === 'clue' && (
        <>
          <Glass style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pill label={`DICA ${state.clue}/${MAX_CLUES}`} />
              <Pill label={`VALE ${points}`} color="#392700" bg={C.yellow} />
            </View>
            <T font="heavy" size={28} style={{ lineHeight: 34 }}>{card.dicas[state.clue - 1]}</T>
            <PointsStrip points={points} />
            {state.muted.length > 0 ? (
              <T font="heavy" size={15} color={C.orange}>
                Mudo nesta dica: {state.players.filter((p) => state.muted.includes(p.id)).map((p) => p.name).join(', ')}
              </T>
            ) : null}
          </Glass>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, height: 52, borderRadius: 26, backgroundColor: C.glass, borderWidth: 1, borderColor: C.line }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: voiceColor }} />
            <T font="heavy" size={15} style={{ flex: 1 }} numberOfLines={1}>{voiceLine}</T>
            <T font="mono" size={14} color={idle.kind === 'countdown' ? C.orange : C.yellow}>{idleLine}</T>
          </View>

          <Glass style={{ paddingVertical: 12 }}>
            <T font="mono" size={12} color={C.muted} style={{ letterSpacing: 2 }}>SÓ O OPERADOR VÊ</T>
            <T font="heavy" size={20} color={C.green}>{card.resposta}</T>
          </Glass>

          {heard ? (
            <Glass style={{ gap: 12, borderColor: C.green, backgroundColor: C.greenFill }}>
              <T font="heavy" size={18} color={C.green}>Ouvi a resposta: “{heard}”</T>
              <T size={15}>Quem acertou?</T>
              <PlayerGrid state={state} onPick={pickCorrect} />
              <Btn kind="ghost" label="Não foi isso" onPress={dismissHeard} />
            </Glass>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Btn style={{ flex: 1.2 }} label={paused ? 'Retomar' : 'Pausar'} onPress={() => { setPaused(!paused); lastActivity.current = Date.now(); }} />
                <Btn style={{ flex: 1 }} kind="ghost" label="Pular dica" onPress={() => dispatch({ type: 'NEXT_CLUE' })} />
              </View>
              <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>QUEM ACERTOU?</T>
              <PlayerGrid state={state} onPick={pickCorrect} />
            </>
          )}
        </>
      )}

      {state.phase === 'noWinner' && (
        <>
          <Glass style={{ gap: 8 }}>
            <T font="heavy" size={20}>Ninguém acertou</T>
            <T font="heavy" size={24} color={C.green}>Era: {card.resposta}</T>
            <T size={15} color={C.muted}>Quem chegou mais perto ganha 5 pontos.</T>
          </Glass>
          <PlayerGrid state={state} onPick={(id) => dispatch({ type: 'CLOSEST', playerId: id })} />
          <Btn kind="ghost" label="Ninguém" onPress={() => dispatch({ type: 'CLOSEST', playerId: null })} />
        </>
      )}

      {state.phase === 'roundEnd' && state.lastResult && (
        <>
          <Glass style={{ gap: 8, borderColor: C.green, backgroundColor: C.greenFill }}>
            <T font="heavy" size={26} color={C.green}>{card.resposta}</T>
            {state.lastResult.winnerId ? (
              <T font="heavy" size={20}>
                {state.players.find((p) => p.id === state.lastResult!.winnerId)?.name} ganhou +{state.lastResult.gained} pontos
              </T>
            ) : <T size={16}>Ninguém pontuou.</T>}
            {state.lastResult.effect ? <T font="heavy" size={17} color={C.yellow}>{describeEffect(state.lastResult.effect, state.players)}</T> : null}
            {state.tiebreakIds ? <T font="heavy" size={16} color={C.orange}>Empate na meta! Vem uma carta de desempate.</T> : null}
          </Glass>
          <Board state={state} />
          <Btn label="Próxima carta" onPress={nextRound} />
        </>
      )}

      {state.phase === 'finished' && (
        <>
          <Glass style={{ gap: 6, alignItems: 'center' }}>
            <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>FIM DE JOGO</T>
            <T font="brand" size={40} color={C.yellow}>
              {state.players.filter((p) => state.winnerIds.includes(p.id)).map((p) => p.name).join(' e ') || 'Empate'}
            </T>
            <T size={16}>venceu!</T>
          </Glass>
          <Board state={state} />
          <Btn label="Jogar de novo" onPress={() => router.replace('/')} />
        </>
      )}

      {state.phase !== 'finished' && state.phase !== 'roundEnd' && <Board state={state} />}
    </Screen>
  );
}
