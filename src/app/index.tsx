// Lobby único: tudo preenchido, é só apertar "Começar partida". Na primeira vez, o passo a passo explica antes.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { CARTAS, CATEGORIAS } from '@/content';
import { categoriasDisponiveis } from '@/content/catalog';
import { DEFAULT_GOAL, GOAL_OPTIONS, MAX_PLAYERS, MIN_PLAYERS, estimatedCards, estimatedMinutes } from '@/game';
import { isValidCode, normalizeCode } from '@/realtime/code';
import { loadLobby, saveLobby } from '@/storage/lobby';
import { normalize } from '@/voice/text';
import { Intro } from '@/ui/intro';
import { Btn, Glass, Screen, T } from '@/ui/kit';
import { CatIcon, PlayersEditor, PlayersGrid } from '@/ui/lobby-parts';
import { C, F } from '@/ui/theme';

const DISPONIVEIS = categoriasDisponiveis(CATEGORIAS, CARTAS);

const parse = (raw: string | undefined): string[] | null => {
  try { const v = JSON.parse(raw ?? ''); return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null; } catch { return null; }
};

export default function Lobby() {
  const params = useLocalSearchParams<{ names?: string; goal?: string; cats?: string; room?: string }>();
  const [saved] = useState(loadLobby);
  const [names, setNames] = useState<string[]>(() => parse(params.names) ?? saved.names);
  const [cats, setCats] = useState<string[]>(() => {
    const ids = DISPONIVEIS.map((c) => c.id);
    return (parse(params.cats) ?? saved.cats ?? ids).filter((id) => ids.includes(id));
  });
  const [goal, setGoal] = useState<number>(() => {
    const g = Number(params.goal) || saved.goal;
    return GOAL_OPTIONS.includes(g as never) ? (g as number) : DEFAULT_GOAL;
  });
  const [room, setRoom] = useState(() => normalizeCode(params.room ?? saved.room));
  const [editing, setEditing] = useState<number | null>(null);
  const [intro, setIntro] = useState(!saved.seenIntro);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const repeated = new Set(filled.map(normalize)).size < filled.length;
  const cardsInGame = DISPONIVEIS.filter((c) => cats.includes(c.id)).reduce((n, c) => n + c.total, 0);
  const players = Math.max(MIN_PLAYERS, filled.length);
  const ready = filled.length >= MIN_PLAYERS && cats.length > 0 && !repeated;
  const toggleCat = (id: string) => setCats(cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id]);
  const stepGoal = (d: number) => setGoal(GOAL_OPTIONS[Math.min(GOAL_OPTIONS.length - 1, Math.max(0, GOAL_OPTIONS.indexOf(goal as never) + d))]);
  const closeEditor = () => { setNames(names.filter((n) => n.trim())); setEditing(null); };

  const play = () => {
    const clean = names.map((n) => n.trim()).filter(Boolean);
    const code = isValidCode(room) ? room : '';
    saveLobby({ names: clean, cats, goal, room: code, seenIntro: true });
    router.push({ pathname: '/jogo', params: { names: JSON.stringify(clean), goal: String(goal), cats: JSON.stringify(cats), room: code } } as never);
  };

  if (intro) {
    return (
      <Intro
        names={names} setNames={setNames} cats={cats} setCats={setCats} goal={goal} setGoal={setGoal} room={room} setRoom={setRoom}
        repeated={repeated} cardsInGame={cardsInGame} ready={ready}
        onSkip={() => { saveLobby({ seenIntro: true }); setIntro(false); }}
        onStart={play}
      />
    );
  }

  if (editing !== null) {
    return (
      <Screen>
        <PlayersEditor names={names} setNames={setNames} editing={editing} setEditing={setEditing} onClose={closeEditor} repeated={repeated} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
        <T font="brand" size={56} color={C.yellow} style={{ lineHeight: 60 }}>Pistache</T>
        <T size={15} color={C.muted} style={{ marginTop: 4, textAlign: 'center' }}><T font="heavy" size={15} color="#d9ccff">Pista</T> a pista, as palavras secretas aparecem.</T>
      </View>

      <Glass style={{ gap: 14 }}>
        <T font="mono" size={12} color={C.muted} style={{ letterSpacing: 2 }}>QUEM VAI JOGAR? {filled.length} DE {MAX_PLAYERS}</T>
        <PlayersGrid names={names} editing={null} onEdit={setEditing} onAdd={() => { setNames([...names, '']); setEditing(names.length); }} />
        {filled.length < MIN_PLAYERS ? <T size={13} color={C.muted}>Toque no + e escreva pelo menos {MIN_PLAYERS} nomes.</T> : null}
        {repeated ? <T font="heavy" size={13} color={C.orange}>Dois jogadores com o mesmo nome. Toque num deles e mude.</T> : null}
      </Glass>

      <Glass style={{ gap: 14 }}>
        <T font="mono" size={12} color={C.muted} style={{ letterSpacing: 2 }}>O QUE VAI CAIR</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
          {DISPONIVEIS.map((c) => {
            const on = cats.includes(c.id);
            return (
              <Pressable key={c.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={c.nome} onPress={() => toggleCat(c.id)} style={{ width: `${100 / DISPONIVEIS.length}%`, minWidth: 56, alignItems: 'center', gap: 4 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.cor : 'transparent', borderWidth: 2, borderColor: on ? c.cor : C.line }}>
                  <CatIcon id={c.id} color={on ? C.dark : C.muted} />
                </View>
                <T font="heavy" size={11} numberOfLines={1} color={on ? C.ink : C.muted}>{c.nome.split(' ')[0]}</T>
              </Pressable>
            );
          })}
        </View>
        <View style={{ alignItems: 'center' }}>
          <T font="brand" size={22} color={cats.length ? C.yellow : C.orange}>{cats.length} {cats.length === 1 ? 'categoria' : 'categorias'} · {cardsInGame} cartas</T>
          <T size={13} color={C.muted} style={{ marginTop: 3 }}>{cats.length === 0 ? 'Escolha pelo menos uma categoria.' : 'As cartas se misturam durante a partida.'}</T>
        </View>
      </Glass>

      <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Meta menor" onPress={() => stepGoal(-1)} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: goal === GOAL_OPTIONS[0] ? 0.35 : 1 }}>
          <T font="brand" size={24} color={C.lavender}>‹</T>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T font="mono" size={12} color={C.muted} style={{ letterSpacing: 2 }}>META DE PONTOS</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <T font="brand" size={38} color={C.yellow}>{goal}</T><T font="heavy" size={15}>pontos</T>
          </View>
          <T size={12} color={C.muted}>vence quem chegar primeiro · ~{estimatedMinutes(goal, players)} min</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Meta maior" onPress={() => stepGoal(1)} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: goal === GOAL_OPTIONS[GOAL_OPTIONS.length - 1] ? 0.35 : 1 }}>
          <T font="brand" size={24} color={C.lavender}>›</T>
        </Pressable>
      </Glass>
      {cardsInGame < estimatedCards(goal, players) ? (
        <T font="heavy" size={13} color={C.orange}>Poucas cartas para essa meta ({cardsInGame} de ~{estimatedCards(goal, players)}): a partida pode acabar antes. Marque mais categorias ou escolha uma meta menor.</T>
      ) : null}

      <Glass style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12 }}>
        <View style={{ flex: 1 }}>
          <T font="heavy" size={15}>Conectar TV</T>
          <T size={12} color={C.muted}>opcional · ligue depois</T>
        </View>
        <TextInput
          value={room}
          onChangeText={(v) => setRoom(normalizeCode(v))}
          placeholder="CÓDIGO"
          placeholderTextColor="#a79bd6"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={4}
          style={{ width: 124, height: 48, borderRadius: 14, color: C.ink, fontFamily: F.brand, fontSize: 22, letterSpacing: 4, textAlign: 'center', backgroundColor: '#2d2262', borderWidth: 1, borderColor: room.length === 4 ? C.green : C.line, padding: 0 }}
        />
      </Glass>

      <Btn label="Começar partida" onPress={play} disabled={!ready} />
      <T size={12} color={C.muted} style={{ textAlign: 'center' }}>O microfone fica ligado na partida. Nada é gravado.</T>
    </Screen>
  );
}
