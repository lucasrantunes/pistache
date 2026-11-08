// Início: nomes dos jogadores e meta de pontos.
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { CARTAS, CATEGORIAS } from '@/content';
import { categoriasDisponiveis } from '@/content/catalog';
import { DEFAULT_GOAL, GOAL_OPTIONS, MAX_PLAYERS, MIN_PLAYERS, estimatedCards, estimatedMinutes } from '@/game';
import { normalize } from '@/voice/text';
import { isValidCode, normalizeCode } from '@/realtime/code';
import { Btn, Glass, Medal, Screen, T } from '@/ui/kit';
import { C, F, PLAYER_COLORS } from '@/ui/theme';

const DISPONIVEIS = categoriasDisponiveis(CATEGORIAS, CARTAS);

export default function Inicio() {
  const [names, setNames] = useState(['', '', '']);
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL);
  const [room, setRoom] = useState('');
  const [cats, setCats] = useState<string[]>(DISPONIVEIS.map((c) => c.id));
  const filled = names.map((n) => n.trim()).filter(Boolean);
  // Nomes repetidos atrapalham o "diga o seu nome": cada um precisa de um nome diferente.
  const repeated = new Set(filled.map(normalize)).size < filled.length;
  const ready = filled.length >= MIN_PLAYERS && cats.length > 0 && !repeated;
  const cardsInGame = DISPONIVEIS.filter((c) => cats.includes(c.id)).reduce((n, c) => n + c.total, 0);
  const players = Math.max(MIN_PLAYERS, filled.length);
  const toggleCat = (id: string) => setCats(cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id]);

  const setName = (i: number, v: string) => setNames(names.map((n, k) => (k === i ? v : n)));

  const play = () =>
    router.push({ pathname: '/jogo', params: { names: JSON.stringify(filled), goal: String(goal), cats: JSON.stringify(cats), room: isValidCode(room) ? room : '' } } as never);

  return (
    <Screen>
      <T font="brand" size={44} color={C.yellow} style={{ textAlign: 'center', marginTop: 8 }}>Pistache</T>
      <T color={C.muted} style={{ textAlign: 'center' }}>Um celular, todo mundo gritando chutes.</T>

      <Glass style={{ gap: 10 }}>
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>QUEM VAI JOGAR? {filled.length} DE {MAX_PLAYERS}</T>
        {names.map((n, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Medal name={n || String(i + 1)} color={PLAYER_COLORS[i % PLAYER_COLORS.length]} size={40} />
            <TextInput
              value={n}
              onChangeText={(v) => setName(i, v)}
              placeholder={`Nome do jogador ${i + 1}`}
              placeholderTextColor="rgba(184,171,220,0.6)"
              maxLength={12}
              style={{ flex: 1, height: 48, borderRadius: 14, paddingHorizontal: 14, color: C.ink, fontFamily: F.heavy, fontSize: 18, backgroundColor: 'rgba(150,120,240,0.12)', borderWidth: 1, borderColor: C.line }}
            />
            {names.length > MIN_PLAYERS ? (
              <Pressable accessibilityLabel="Remover jogador" onPress={() => setNames(names.filter((_, k) => k !== i))} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <T size={22} color={C.muted}>×</T>
              </Pressable>
            ) : null}
          </View>
        ))}
        {names.length < MAX_PLAYERS ? <Btn kind="ghost" label="+ Adicionar jogador" onPress={() => setNames([...names, ''])} /> : null}
      </Glass>

      <Glass style={{ gap: 10 }}>
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>CATEGORIAS</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DISPONIVEIS.map((c) => {
            const on = cats.includes(c.id);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => toggleCat(c.id)}
                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 2, borderColor: on ? c.cor : C.line, backgroundColor: on ? c.cor + '33' : 'transparent' }}>
                <T font="heavy" size={15} color={on ? C.ink : C.muted}>{c.nome} · {c.total}</T>
              </Pressable>
            );
          })}
        </View>
        <T size={13} color={C.muted}>{cats.length === 0 ? 'Escolha pelo menos uma categoria.' : 'As cartas das categorias marcadas se misturam na partida.'}</T>
      </Glass>

      <Glass style={{ gap: 10 }}>
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>VENCE QUEM CHEGAR A</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {GOAL_OPTIONS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGoal(g)}
              style={{ flex: 1, height: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: goal === g ? C.lavender : C.line, backgroundColor: goal === g ? 'rgba(183,156,255,0.22)' : 'transparent' }}>
              <T font="heavy" size={20} color={goal === g ? C.ink : C.muted}>{g}</T>
              <T size={11} color={C.muted}>~{estimatedMinutes(g, players)} min</T>
            </Pressable>
          ))}
        </View>
        <T size={13} color={C.muted}>Tempo estimado para {players} jogadores. Deixe o celular na mesa: o microfone fica ligado durante a partida toda e nada é gravado.</T>
        {cardsInGame < estimatedCards(goal, players) ? (
          <T font="heavy" size={13} color={C.orange}>Poucas cartas para essa meta ({cardsInGame} de ~{estimatedCards(goal, players)}): a partida pode acabar antes. Marque mais categorias ou escolha uma meta menor.</T>
        ) : null}
      </Glass>

      <Glass style={{ gap: 10 }}>
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>CONECTAR TV (OPCIONAL)</T>
        <TextInput
          value={room}
          onChangeText={(v) => setRoom(normalizeCode(v))}
          placeholder="Código da TV"
          placeholderTextColor="rgba(184,171,220,0.6)"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={4}
          style={{ height: 56, borderRadius: 14, paddingHorizontal: 14, color: C.ink, fontFamily: F.brand, fontSize: 28, letterSpacing: 8, textAlign: 'center', backgroundColor: 'rgba(150,120,240,0.12)', borderWidth: 1, borderColor: room.length === 4 ? C.green : C.line }}
        />
        <T size={13} color={C.muted}>Abra o Pistache na TV e digite o código que aparece lá. Dá para conectar depois também, com a partida rodando.</T>
      </Glass>

      <Btn label="Começar partida" onPress={play} disabled={!ready} />
      {filled.length < MIN_PLAYERS ? <T size={13} color={C.muted} style={{ textAlign: 'center' }}>Escreva pelo menos {MIN_PLAYERS} nomes.</T> : null}
      {repeated ? <T size={13} color={C.orange} style={{ textAlign: 'center' }}>Dois jogadores com o mesmo nome. Mude um deles para o jogo saber quem falou.</T> : null}
      <Link href="/voz" style={{ color: C.lavender, fontFamily: F.ui, textAlign: 'center', marginTop: 6 }}>Teste de voz</Link>
    </Screen>
  );
}
