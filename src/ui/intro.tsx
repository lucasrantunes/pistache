// Passo a passo da primeira vez: capa + 5 telas curtas que já configuram a partida.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { CARTAS, CATEGORIAS } from '@/content';
import { categoriasDisponiveis } from '@/content/catalog';
import { GOAL_OPTIONS, MAX_PLAYERS, MIN_PLAYERS, estimatedMinutes } from '@/game';
import { isValidCode, normalizeCode } from '@/realtime/code';
import { Btn, Glass, Medal, Screen, T } from './kit';
import { CatIcon, PlayersEditor, PlayersGrid, colorOfIndex } from './lobby-parts';
import { C, F } from './theme';

const DISPONIVEIS = categoriasDisponiveis(CATEGORIAS, CARTAS);
const META_ROTULO: Record<number, string> = { 70: 'RÁPIDA', 100: 'MÉDIA', 150: 'LONGA', 200: 'MARATONA' };
const TILT = [-2, 1.5, -1, 2, -1.5, 1];

interface Props {
  names: string[]; setNames: (n: string[]) => void;
  cats: string[]; setCats: (c: string[]) => void;
  goal: number; setGoal: (g: number) => void;
  room: string; setRoom: (r: string) => void;
  repeated: boolean; cardsInGame: number; ready: boolean;
  onSkip: () => void; onStart: () => void;
}

function Header({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <T font="brand" size={28} color={C.muted}>‹</T>
      </Pressable>
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => <View key={n} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: n <= step ? C.lavender : C.track }} />)}
      </View>
      <T font="heavy" size={13} color={C.muted} style={{ width: 44, textAlign: 'right' }}>{step} de 5</T>
    </View>
  );
}

const Title = ({ title, sub }: { title: string; sub: string }) => (
  <View>
    <T font="brand" size={34} style={{ lineHeight: 40 }}>{title}</T>
    <T size={15} color={C.muted} style={{ marginTop: 4, lineHeight: 21 }}>{sub}</T>
  </View>
);

function Rule({ n, title, text, children }: { n: number; title: string; text: ReactNode; children?: ReactNode }) {
  return (
    <Glass style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' }}>
          <T font="brand" size={19} color={C.dark}>{n}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T font="heavy" size={18}>{title}</T>
          <T size={14} color="#c9bfee" style={{ marginTop: 4, lineHeight: 20 }}>{text}</T>
        </View>
      </View>
      {children}
    </Glass>
  );
}

export function Intro(p: Props) {
  const [step, setStep] = useState(0); // 0 capa, 1 como, 2 jogadores, 3 categorias, 4 meta, 5 pronto
  const [editing, setEditing] = useState<number | null>(null);
  const filled = p.names.filter((n) => n.trim()).length;
  const players = Math.max(MIN_PLAYERS, filled);
  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const toggleCat = (id: string) => p.setCats(p.cats.includes(id) ? p.cats.filter((c) => c !== id) : [...p.cats, id]);
  const closeEditor = () => { p.setNames(p.names.filter((n) => n.trim())); setEditing(null); };
  const Foot = ({ label = 'Continuar', ok = true, onPress = next }: { label?: string; ok?: boolean; onPress?: () => void }) => <Btn label={label} onPress={onPress} disabled={!ok} />;

  if (step === 2 && editing !== null) {
    return <Screen><PlayersEditor names={p.names} setNames={p.setNames} editing={editing} setEditing={setEditing} onClose={closeEditor} repeated={p.repeated} /></Screen>;
  }

  if (step === 0) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <T font="brand" size={68} color={C.yellow} style={{ lineHeight: 74 }}>Pistache</T>
          <T size={17} color={C.muted} style={{ marginTop: 6, textAlign: 'center' }}><T font="heavy" size={17} color="#d9ccff">Pista</T> a pista, as palavras secretas aparecem.</T>
        </View>
        <View style={{ gap: 8, marginVertical: 28, transform: [{ rotate: '-2deg' }] }}>
          {[['PISTA 1', 'Vivo em manadas.', '20', C.lime, 0.45], ['PISTA 7', 'Minha líder é uma fêmea idosa.', '14', C.yellow, 0.7], ['PISTA 15', 'Tenho tromba e grandes presas.', '6', C.orange, 1]].map(([k, t, v, c, o]) => (
            <View key={k as string} style={{ opacity: o as number, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.panel, borderWidth: 1.5, borderColor: o === 1 ? C.lavender : C.line }}>
              <T font="mono" size={12} color={C.muted} style={{ width: 64 }}>{k as string}</T>
              <T font="heavy" size={15} style={{ flex: 1 }}>{t as string}</T>
              <T font="brand" size={18} color={c as string}>{v as string}</T>
            </View>
          ))}
        </View>
        <Btn label="Vamos jogar" onPress={next} />
        <T size={14} color={C.muted} style={{ textAlign: 'center', lineHeight: 20 }}>Primeira vez? Eu explico em poucos passos.{'\n'}Já conhece?</T>
        <Pressable accessibilityRole="button" onPress={p.onSkip} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 }}>
          <T font="heavy" size={14} color={C.lavender}>Pular direto para o jogo</T>
        </Pressable>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen>
        <Header step={1} onBack={back} />
        <Title title="Como funciona" sub="Leva 20 segundos para entender." />
        <Rule n={1} title="Uma carta, 20 pistas" text="Cada carta esconde uma resposta secreta. As pistas vêm da mais difícil para a mais fácil.">
          <View style={{ flexDirection: 'row', gap: 3 }}>{Array.from({ length: 20 }, (_, i) => <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < 7 ? C.lavender : C.track }} />)}</View>
        </Rule>
        <Rule n={2} title="Quanto antes, mais pontos" text="A pista 1 vale 20 pontos. A cada pista que passa, cai 1 ponto.">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            {[['20', C.lime], ['14', C.yellow], ['7', C.orange], ['1', C.red]].map(([v, c]) => <T key={v} font="brand" size={26} color={c}>{v}</T>)}
          </View>
        </Rule>
        <Rule n={3} title="Chute à vontade e diga PISTA" text={<>O celular escuta a sala. Diga <T font="heavy" size={14} color={C.yellow}>PISTA</T> para ouvir a próxima. Chute errado não custa nada.</>} />
        <Foot label="Entendi" />
      </Screen>
    );
  }

  if (step === 2) {
    return (
      <Screen>
        <Header step={2} onBack={back} />
        <Title title="Quem vai jogar?" sub={`De ${MIN_PLAYERS} a ${MAX_PLAYERS} jogadores, cada um com seu nome.`} />
        <Glass style={{ gap: 14 }}>
          <T font="mono" size={12} color={C.muted} style={{ letterSpacing: 2 }}>TOQUE EM + PARA ADICIONAR</T>
          <PlayersGrid names={p.names} editing={null} onEdit={setEditing} onAdd={() => { p.setNames([...p.names, '']); setEditing(p.names.length); }} />
        </Glass>
        <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 20, backgroundColor: C.bgTop, borderWidth: 1.5, borderColor: C.line }}>
          <T size={22}>🎤</T>
          <T size={14} color="#d9ccff" style={{ flex: 1, lineHeight: 20 }}>Quando alguém acertar, é só <T font="heavy" size={14}>dizer o próprio nome</T>. O celular entende quem foi. Por isso, use só o primeiro nome e sem repetir.</T>
        </View>
        {p.repeated ? <T font="heavy" size={13} color={C.orange}>Dois jogadores com o mesmo nome. Toque num deles e mude.</T> : null}
        <Foot ok={filled >= MIN_PLAYERS && !p.repeated} />
      </Screen>
    );
  }

  if (step === 3) {
    return (
      <Screen>
        <Header step={3} onBack={back} />
        <Title title="O que vai cair?" sub="Este é o baralho da partida. Toque numa carta para tirá-la." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, marginTop: 6 }}>
          {DISPONIVEIS.map((c, i) => {
            const on = p.cats.includes(c.id);
            return (
              <View key={c.id} style={{ width: '33.33%', paddingHorizontal: 5 }}>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={c.nome} onPress={() => toggleCat(c.id)}
                  style={{ height: 150, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, transform: [{ rotate: `${TILT[i % TILT.length]}deg` }], backgroundColor: on ? c.cor : 'transparent', borderWidth: on ? 0 : 2, borderStyle: 'dashed', borderColor: C.line, opacity: on ? 1 : 0.7 }}>
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: on ? '#ffffff59' : C.panel, alignItems: 'center', justifyContent: 'center' }}>
                    <CatIcon id={c.id} size={40} color={on ? C.dark : C.muted} />
                  </View>
                  <T font="brand" size={18} color={on ? C.dark : C.muted}>{c.nome.split(' ')[0]}</T>
                  <T font="heavy" size={12} color={on ? C.dark : C.muted}>{c.total} cartas</T>
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <T font="brand" size={22} color={C.yellow}>{p.cats.length} {p.cats.length === 1 ? 'categoria' : 'categorias'} · {p.cardsInGame} cartas</T>
          <T size={13} color={C.muted} style={{ marginTop: 2 }}>As cartas se misturam durante a partida.</T>
        </View>
        <Foot ok={p.cats.length > 0} />
      </Screen>
    );
  }

  if (step === 4) {
    return (
      <Screen>
        <Header step={4} onBack={back} />
        <Title title="Meta de pontos" sub="Quem chegar primeiro à meta vence. Quanto maior a meta, mais longa a partida." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {GOAL_OPTIONS.map((g) => {
            const on = p.goal === g;
            return (
              <Pressable key={g} accessibilityRole="button" accessibilityLabel={`Meta ${g} pontos`} onPress={() => p.setGoal(g)}
                style={{ width: '48%', height: 116, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? '#ffca4b22' : C.panel, borderWidth: on ? 2.5 : 1.5, borderColor: on ? C.yellow : C.line }}>
                <T font="mono" size={12} color={on ? C.yellow : C.muted} style={{ letterSpacing: 2 }}>{META_ROTULO[g]}</T>
                <T font="brand" size={46} color={on ? C.yellow : C.muted} style={{ lineHeight: 52 }}>{g}</T>
                <T size={13} color={on ? '#d9ccff' : C.muted}>pontos · ~{estimatedMinutes(g, players)} min</T>
              </Pressable>
            );
          })}
        </View>
        <T size={13} color={C.muted} style={{ textAlign: 'center' }}>Tempo estimado para {players} jogadores. Na dúvida, comece pela rápida.</T>
        <Foot />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header step={5} onBack={back} />
      <Title title="Tudo pronto!" sub="Confira, ligue a TV se quiser e deixe o celular na mesa." />
      <Glass style={{ paddingVertical: 8, gap: 2 }}>
        {[
          ['JOGADORES', <View key="j" style={{ flexDirection: 'row', gap: 4 }}>{p.names.filter((n) => n.trim()).slice(0, 6).map((n, i) => <Medal key={i} name={n} color={colorOfIndex(i)} size={30} />)}</View>, 2],
          ['CATEGORIAS', <View key="c" style={{ flexDirection: 'row', gap: 5 }}>{DISPONIVEIS.filter((c) => p.cats.includes(c.id)).map((c) => <View key={c.id} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.cor }} />)}</View>, 3],
          ['META', <T key="m" font="heavy" size={15}><T font="brand" size={22} color={C.yellow}>{p.goal}</T> pontos · ~{estimatedMinutes(p.goal, players)} min</T>, 4],
        ].map(([k, v, to]) => (
          <View key={k as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
            <T font="mono" size={11} color={C.muted} style={{ width: 84, letterSpacing: 1 }}>{k as string}</T>
            <View style={{ flex: 1 }}>{v as ReactNode}</View>
            <Pressable accessibilityRole="button" onPress={() => setStep(to as number)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
              <T font="heavy" size={14} color={C.lavender}>Mudar</T>
            </Pressable>
          </View>
        ))}
      </Glass>
      <Glass style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12 }}>
        <View style={{ flex: 1 }}>
          <T font="heavy" size={15}>Conectar TV</T>
          <T size={12} color={C.muted}>opcional · ligue depois</T>
        </View>
        <TextInput value={p.room} onChangeText={(v) => p.setRoom(normalizeCode(v))} placeholder="CÓDIGO" placeholderTextColor="#a79bd6" autoCapitalize="characters" autoCorrect={false} maxLength={4}
          style={{ width: 124, height: 48, borderRadius: 14, color: C.ink, fontFamily: F.brand, fontSize: 22, letterSpacing: 4, textAlign: 'center', backgroundColor: '#2d2262', borderWidth: 1, borderColor: isValidCode(p.room) ? C.green : C.line, padding: 0 }} />
      </Glass>
      <Btn label="Começar partida" onPress={p.onStart} disabled={!p.ready} />
      <T size={12} color={C.muted} style={{ textAlign: 'center' }}>O microfone fica ligado na partida. Nada é gravado.</T>
    </Screen>
  );
}
