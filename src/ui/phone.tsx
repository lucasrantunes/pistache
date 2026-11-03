// Telas do celular do operador (layout aprovado). Só desenham: quem decide é o jogo.tsx.
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { MAX_CLUES, SPECIAL_SQUARES, SQUARES } from '@/game';
import type { RankRow, SpecialKind } from '@/game';

import { isValidCode, normalizeCode } from '@/realtime/code';

import { Btn, Medal, Pill, RoomChip, Screen, T } from './kit';
import { KIND_COLOR, RankingList, SpecialLegend } from './ranking';
import { C, F } from './theme';

export interface UiPlayer {
  id: string;
  name: string;
  points: number;
  color: string;
}

const Label = ({ children }: { children: string }) => (
  <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>{children}</T>
);

/** Duas colunas de nomes para tocar (quem acertou / quem chegou mais perto). */
function NameGrid({ players, onPick }: { players: UiPlayer[]; onPick: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {players.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          onPress={() => onPick(p.id)}
          style={({ pressed }) => ({
            width: '48%', minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
            borderRadius: 22, borderWidth: 2, borderColor: p.color, backgroundColor: pressed ? p.color + '55' : p.color + '22',
          })}>
          <Medal name={p.name} color={p.color} size={42} />
          <View style={{ flexShrink: 1 }}>
            <T font="brand" size={22} numberOfLines={1}>{p.name}</T>
            <T font="mono" size={12} color={C.muted}>{p.points} pts</T>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ---------- Rodada ----------

export interface RoundProps {
  category: string;
  roomCode: string;
  tvReady: boolean;
  clue: number;
  points: number;
  hint: string;
  mutedNames: string[];
  voiceLine: string;
  voiceColor: string;
  idleLine: string;
  idleWarn: boolean;
  players: UiPlayer[];
  leaderId: string | null;
  goal: number;
  paused: boolean;
  onPause: () => void;
  onSkip: () => void;
  onSomeoneGotIt: () => void;
  onExit: () => void;
  onRoomPress: () => void;
}

export function RoundScreen(p: RoundProps) {
  const perRow = p.players.length > 6 ? 5 : p.players.length;
  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <Pill label={p.category} />
          <RoomChip code={p.roomCode} connected={p.tvReady} onPress={p.onRoomPress} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair da partida" onPress={p.onExit} style={{ padding: 10 }}>
          <T size={14} color={C.muted}>Sair</T>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T font="brand" size={24}>Dica {p.clue}<T font="brand" size={18} color={C.muted}> / {MAX_CLUES}</T></T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: C.yellow }}>
            <T font="brand" size={24} color={C.dark}>{p.points}</T>
            <T font="heavy" size={13} color={C.dark}>pontos em jogo</T>
          </View>
        </View>
        <View style={{ height: 12, borderRadius: 999, backgroundColor: C.track, overflow: 'hidden' }}>
          <View style={{ width: `${(p.points / MAX_CLUES) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: C.yellow }} />
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 28, backgroundColor: C.panel, borderWidth: 2, borderColor: 'rgba(177,138,255,0.4)', gap: 10 }}>
        <T font="heavy" size={29} style={{ lineHeight: 36, textAlign: 'center' }}>{p.hint}</T>
        {p.mutedNames.length > 0 ? (
          <T font="heavy" size={15} color={C.orange} style={{ textAlign: 'center' }}>Mudo nesta dica: {p.mutedNames.join(', ')}</T>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 40, borderRadius: 999, backgroundColor: C.panel, borderWidth: 2, borderColor: p.voiceColor, flexShrink: 1 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.voiceColor }} />
          <T font="heavy" size={14} color={p.voiceColor} numberOfLines={1} style={{ flexShrink: 1 }}>{p.voiceLine}</T>
        </View>
        <T size={13} color={p.idleWarn ? C.orange : C.muted} style={{ textAlign: 'right' }}>
          {p.paused ? 'Diga “Pistache”\npara retomar' : `Diga “Pistache” para\na próxima dica · ${p.idleLine}`}
        </T>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 10, paddingTop: 14, paddingBottom: 6, borderRadius: 20, backgroundColor: C.bgTop }}>
        {p.players.map((pl) => (
          <View key={pl.id} style={{ width: `${100 / Math.max(1, perRow)}%`, alignItems: 'center', gap: 3 }}>
            <View style={{ marginTop: 10 }}>
              <Medal name={pl.name} color={pl.color} size={42} leader={pl.id === p.leaderId} />
            </View>
            <T font="brand" size={19}>{pl.points}</T>
            <View style={{ width: 34, height: 6, borderRadius: 999, backgroundColor: C.line, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (pl.points / p.goal) * 100)}%`, height: '100%', backgroundColor: pl.color }} />
            </View>
            <T size={12} color={C.muted} numberOfLines={1}>{pl.name}</T>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn style={{ flex: 1 }} kind="ghost" label={p.paused ? '▶  Retomar' : '❚❚  Pausar'} onPress={p.onPause} />
        <Btn style={{ flex: 1 }} kind="ghost" label="Pular dica  →" onPress={p.onSkip} />
      </View>
      <Btn label="✓  Alguém acertou!" onPress={p.onSomeoneGotIt} />
    </Screen>
  );
}

// ---------- Quem acertou? ----------

export function WhoScreen({ heard, clue, points, players, onPick, onCancel }: {
  heard: string | null; clue: number; points: number; players: UiPlayer[]; onPick: (id: string) => void; onCancel: () => void;
}) {
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label={`Dica pausada · ${clue}/${MAX_CLUES}`} color={C.orange} />
        <View style={{ alignItems: 'center' }}>
          <T font="brand" size={34} color={C.yellow} style={{ lineHeight: 36 }}>{points}</T>
          <T size={12} color={C.muted}>pontos</T>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
        {heard ? (
          <>
            <T font="brand" size={32} color={C.green} style={{ textAlign: 'center', lineHeight: 36 }}>Pistache ouviu{'\n'}a resposta!</T>
            <T size={14} color={C.muted}>“{heard}”</T>
          </>
        ) : (
          <T font="brand" size={32} color={C.green} style={{ textAlign: 'center' }}>Alguém acertou!</T>
        )}
        <T size={15} color={C.muted}>Toque em quem acertou primeiro.</T>
      </View>
      <Label>QUEM ACERTOU?</Label>
      <NameGrid players={players} onPick={onPick} />
      <T size={13} color={C.muted} style={{ textAlign: 'center' }}>Duas pessoas falaram quase juntas? Você decide quem foi primeiro.</T>
      <Btn kind="ghost" label="Foi engano, continuar a dica" onPress={onCancel} />
    </Screen>
  );
}

// ---------- Casa especial ----------

const EFFECT_TITLE: Record<SpecialKind, string> = { bad: 'Azar!', dobro: 'Dobro!', ladrao: 'Ladrão!', turbo: 'Turbo!' };

/** Faixa das 25 casas com as especiais coloridas e a casa onde o jogador parou. */
function SquareStrip({ at, from }: { at: number; from: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: SQUARES }, (_, i) => i + 1).map((sq) => {
        const kind = SPECIAL_SQUARES[sq];
        const color = kind ? KIND_COLOR[kind] : C.line;
        const here = sq === at;
        return (
          <View key={sq} style={{ flex: 1, height: here ? 18 : sq <= from ? 8 : 12, marginTop: here ? 0 : 5, borderRadius: 3, backgroundColor: color, borderWidth: here ? 2 : 0, borderColor: C.ink, opacity: sq > at && !kind ? 0.6 : 1 }} />
        );
      })}
    </View>
  );
}

export function EffectScreen({ name, color, gained, before, after, fromSquare, toSquare, kind, detail, onNext }: {
  name: string; color: string; gained: number; before: number; after: number; fromSquare: number; toSquare: number;
  kind: SpecialKind; detail: string; onNext: () => void;
}) {
  const accent = KIND_COLOR[kind];
  return (
    <Screen>
      <Pill label={`${name} acertou!`} color={C.green} />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <T font="brand" size={64} color={C.yellow} style={{ lineHeight: 68 }}>+{gained}</T>
        <T size={14} color={C.muted}>pontos</T>
        <T font="heavy" size={18}>{before} → {after} pontos</T>
        <T size={14} color={C.muted}>Casa {toSquare} de {SQUARES}</T>
      </View>
      <SquareStrip at={toSquare} from={fromSquare} />
      <SpecialLegend />
      <View style={{ alignItems: 'center', gap: 10, padding: 18, borderRadius: 26, backgroundColor: C.panel, borderWidth: 2, borderColor: accent }}>
        <Medal name={name} color={color} size={78} sad={kind === 'bad'} />
        <T font="brand" size={40} color={accent}>{EFFECT_TITLE[kind]}</T>
        <T font="heavy" size={18} style={{ textAlign: 'center' }}>{detail}</T>
        {kind === 'bad' ? <T size={13} color={C.muted} style={{ textAlign: 'center' }}>Regra de honra: o app não sabe quem fala, então ninguém mais entrega o jogador mudo.</T> : null}
      </View>
      <Btn label="Ver placar" onPress={onNext} />
    </Screen>
  );
}

// ---------- Ninguém acertou ----------

export function RevealScreen({ cardNo, answer, category, players, onPick, onNone }: {
  cardNo: number; answer: string; category: string; players: UiPlayer[]; onPick: (id: string) => void; onNone: () => void;
}) {
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label={`Dica ${MAX_CLUES} / ${MAX_CLUES}`} color={C.muted} />
        <T font="heavy" size={14} color={C.muted}>Carta {cardNo}</T>
      </View>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
        <T size={15} color={C.muted}>Ninguém acertou. A resposta era</T>
        <T font="brand" size={42} color={C.green} style={{ textAlign: 'center', lineHeight: 46 }}>{answer}</T>
        <Pill label={category} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label>QUEM CHEGOU MAIS PERTO?</Label>
        <View style={{ paddingHorizontal: 12, paddingVertical: 2, borderRadius: 999, backgroundColor: C.yellow }}>
          <T font="brand" size={18} color={C.dark}>+5</T>
        </View>
      </View>
      <NameGrid players={players} onPick={onPick} />
      <Btn kind="ghost" label="Ninguém chegou perto, ver placar" onPress={onNone} />
    </Screen>
  );
}

// ---------- Placar depois de cada carta ----------

export function RankingScreen({ cardNo, answer, goal, rows, order, tiebreak, final, onNext }: {
  cardNo: number; answer: string; goal: number; rows: RankRow[]; order: string[]; tiebreak: boolean; final: boolean; onNext: () => void;
}) {
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <Pill label={`Carta ${cardNo} concluída`} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: C.yellow }}>
          <T font="brand" size={20} color={C.dark}>⚑ Meta {goal}</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <T font="brand" size={40} style={{ lineHeight: 44 }}>Placar</T>
        <T font="heavy" size={14} color={C.green} style={{ paddingBottom: 4 }}>Era: {answer}</T>
      </View>
      <RankingList rows={rows} order={order} goal={goal} />
      <SpecialLegend />
      {tiebreak ? <T font="heavy" size={16} color={C.orange} style={{ textAlign: 'center' }}>Empate na meta! Vem uma carta de desempate.</T> : null}
      <Btn label={final ? 'Ver o vencedor' : tiebreak ? 'Carta de desempate' : 'Próxima carta'} onPress={onNext} />
    </Screen>
  );
}

// ---------- Fim de jogo ----------

export function FinalScreen({ winners, cards, rows, order, goal, onAgain, onChange }: {
  winners: UiPlayer[]; cards: number; rows: RankRow[]; order: string[]; goal: number; onAgain: () => void; onChange: () => void;
}) {
  const top = winners[0];
  return (
    <Screen>
      <Pill label={`Fim de jogo · ${cards} cartas`} />
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 6 }}>
        {winners.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 10, paddingTop: 14 }}>
            {winners.map((w) => <Medal key={w.id} name={w.name} color={w.color} size={96} leader />)}
          </View>
        ) : null}
        <Text style={{ fontFamily: F.brand, fontSize: 40, color: C.yellow, textAlign: 'center' }}>
          {winners.length ? `${winners.map((w) => w.name).join(' e ')} ${winners.length > 1 ? 'venceram' : 'venceu'}!` : 'Empate!'}
        </Text>
        {top ? <T size={16} color={C.muted}>{top.points} pontos</T> : null}
      </View>
      <RankingList rows={rows} order={order} goal={goal} />
      <Btn label="Jogar de novo" onPress={onAgain} />
      <Btn kind="ghost" label="Trocar jogadores" onPress={onChange} />
    </Screen>
  );
}

// ---------- Conectar a TV no meio da partida ----------

export function ConnectScreen({ current, onConnect, onCancel }: { current: string; onConnect: (code: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState(current);
  return (
    <Screen>
      <T font="brand" size={34}>Conectar a TV</T>
      <T size={15} color={C.muted}>Abra o Pistache na TV e digite aqui o código que aparece lá. Pode ser a qualquer momento: a TV só mostra o jogo.</T>
      <TextInput
        value={code}
        onChangeText={(v) => setCode(normalizeCode(v))}
        placeholder="CÓDIGO"
        placeholderTextColor="rgba(185,174,224,0.5)"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={4}
        style={{ height: 72, borderRadius: 18, color: C.ink, fontFamily: F.brand, fontSize: 36, letterSpacing: 10, textAlign: 'center', backgroundColor: C.panel, borderWidth: 2, borderColor: isValidCode(code) ? C.green : C.line }}
      />
      <Btn label="Conectar" onPress={() => onConnect(code)} disabled={!isValidCode(code)} />
      <Btn kind="ghost" label={current ? 'Voltar ao jogo' : 'Agora não'} onPress={onCancel} />
    </Screen>
  );
}
