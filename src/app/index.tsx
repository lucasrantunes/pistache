// Início: nomes dos jogadores e meta de pontos.
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { MAX_PLAYERS, MIN_PLAYERS } from '@/game';
import { isValidCode, normalizeCode } from '@/realtime/code';
import { Btn, Glass, Medal, Screen, T } from '@/ui/kit';
import { C, F, PLAYER_COLORS } from '@/ui/theme';

const GOALS = [30, 50, 70];

export default function Inicio() {
  const [names, setNames] = useState(['', '', '']);
  const [goal, setGoal] = useState(50);
  const [room, setRoom] = useState('');
  const filled = names.map((n) => n.trim()).filter(Boolean);
  const ready = filled.length >= MIN_PLAYERS;

  const setName = (i: number, v: string) => setNames(names.map((n, k) => (k === i ? v : n)));

  const play = () =>
    router.push({ pathname: '/jogo', params: { names: JSON.stringify(filled), goal: String(goal), room: isValidCode(room) ? room : '' } } as never);

  return (
    <Screen>
      <T font="brand" size={44} color={C.yellow} style={{ textAlign: 'center', marginTop: 8 }}>Pistache</T>
      <T color={C.muted} style={{ textAlign: 'center' }}>Ouça as dicas e acerte o quanto antes.</T>

      <Glass style={{ gap: 10 }}>
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>JOGADORES ({MIN_PLAYERS} A {MAX_PLAYERS})</T>
        {names.map((n, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Medal name={n || String(i + 1)} color={PLAYER_COLORS[i % PLAYER_COLORS.length]} size={40} />
            <TextInput
              value={n}
              onChangeText={(v) => setName(i, v)}
              placeholder={`Jogador ${i + 1}`}
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
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>META DE PONTOS</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {GOALS.map((g) => (
            <Pressable
              key={g}
              onPress={() => setGoal(g)}
              style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: goal === g ? C.lavender : C.line, backgroundColor: goal === g ? 'rgba(183,156,255,0.22)' : 'transparent' }}>
              <T font="heavy" size={20} color={goal === g ? C.ink : C.muted}>{g}</T>
            </Pressable>
          ))}
        </View>
        <T size={13} color={C.muted}>Mais pontos, partida mais longa (50 leva cerca de 12 minutos).</T>
      </Glass>

      <Glass style={{ gap: 10 }}>
        <T font="mono" size={13} color={C.muted} style={{ letterSpacing: 2 }}>LIGAR NA TV (OPCIONAL)</T>
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
        <T size={13} color={C.muted}>Abra a página da TV no navegador dela e digite o código que aparece lá.</T>
      </Glass>

      <Btn label="Começar" onPress={play} disabled={!ready} />
      {!ready ? <T size={13} color={C.muted} style={{ textAlign: 'center' }}>Escreva pelo menos {MIN_PLAYERS} nomes.</T> : null}
      <Link href="/voz" style={{ color: C.lavender, fontFamily: F.ui, textAlign: 'center', marginTop: 6 }}>Teste de voz</Link>
    </Screen>
  );
}
