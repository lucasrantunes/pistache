import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState, Pressable, ScrollView, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, F } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32, width: '100%', maxWidth: 560, alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Glass({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: C.panel, borderColor: C.line, borderWidth: 2, borderRadius: 24, padding: 16 }, style]}>
      {children}
    </View>
  );
}

export function T({
  children, size = 16, color = C.ink, font = 'ui', style, numberOfLines,
}: { children: ReactNode; size?: number; color?: string; font?: keyof typeof F; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={[{ fontSize: size, color, fontFamily: F[font] }, style]}>{children}</Text>;
}

/** Chip arredondado com borda colorida (categoria, sala, etc.). */
export function Pill({ label, color = C.lavender, bg = 'transparent', big = false }: { label: string; color?: string; bg?: string; big?: boolean }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: big ? 18 : 14, paddingVertical: big ? 6 : 8, borderRadius: 999, borderWidth: 2, borderColor: color, backgroundColor: bg }}>
      <Text style={{ color, fontFamily: F.heavy, fontSize: big ? 20 : 14 }}>{label}</Text>
    </View>
  );
}

/** Chip da sala: "Sala KQTZ". Sem TV ligada, mostra "Sem TV". */
export function RoomChip({ code, connected = true, onPress }: { code: string; connected?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Conectar a TV" disabled={!onPress} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: C.panel }}>
      {code ? (
        <>
          <Text style={{ fontFamily: F.heavy, fontSize: 13, color: C.muted }}>Sala</Text>
          <Text style={{ fontFamily: F.brand, fontSize: 20, letterSpacing: 2, color: connected ? C.yellow : C.muted }}>{code}</Text>
        </>
      ) : (
        <Text style={{ fontFamily: F.heavy, fontSize: 13, color: C.muted }}>Sem TV · conectar</Text>
      )}
    </Pressable>
  );
}

type BtnKind = 'primary' | 'ghost' | 'green' | 'danger';
const BTN: Record<BtnKind, { bg: string; fg: string; edge: string; border?: string }> = {
  primary: { bg: C.lavender, fg: C.dark, edge: C.lavenderDark },
  green: { bg: C.green, fg: '#05301f', edge: '#1d9d68' },
  danger: { bg: C.red, fg: '#3a0d12', edge: '#b04449' },
  ghost: { bg: C.panel, fg: C.ink, edge: 'transparent', border: C.line },
};

export function Btn({
  label, onPress, kind = 'primary', disabled = false, style,
}: { label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const k = BTN[kind];
  const ghost = kind === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: ghost ? 52 : 64, borderRadius: ghost ? 18 : 22, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center',
          backgroundColor: k.bg, borderBottomWidth: ghost ? 2 : pressed ? 2 : 5, borderBottomColor: ghost ? C.line : k.edge,
          borderWidth: k.border ? 2 : 0, borderColor: k.border, opacity: disabled ? 0.4 : 1,
          transform: [{ translateY: pressed && !ghost ? 3 : 0 }],
        },
        style,
      ]}>
      <Text style={{ color: k.fg, fontFamily: ghost ? F.heavy : F.brand, fontSize: ghost ? 16 : 24 }}>{label}</Text>
    </Pressable>
  );
}

// ---------- Medalha do jogador: letra inicial dentro de um círculo na cor do jogador ----------

/** `sad` = apagada (jogador mudo por azar); `leader` = coroa. */
export function Medal({
  name, color, size = 44, leader = false, sad = false,
}: { name: string; color: string; size?: number; leader?: boolean; sad?: boolean }) {
  const ring = Math.max(2, size * 0.07);
  const letter = (name.trim()[0] ?? '?').toLocaleUpperCase('pt-BR');
  return (
    <View style={{ width: size, height: size, opacity: sad ? 0.55 : 1 }} accessibilityLabel={name}>
      {leader ? (
        <Text style={{ position: 'absolute', top: -size * 0.32, left: 0, right: 0, textAlign: 'center', fontSize: size * 0.37, lineHeight: size * 0.43, color: C.yellow, zIndex: 2 }}>♛</Text>
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring, borderColor: color, backgroundColor: color + '33', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.brand, fontSize: size * 0.46, lineHeight: size * 0.6, color: C.ink }}>{letter}</Text>
      </View>
    </View>
  );
}

// ---------- Botão com contagem (avanço automático) ----------

/**
 * Botão que se enche e dispara `onPress` sozinho quando o tempo acaba (como o "próximo episódio").
 * Voltar de outro app reinicia a contagem. `cancelable` mostra um "Cancelar" que para só a contagem.
 */
export function CountdownBtn({
  label, seconds, onPress, cancelable = false, kind = 'primary',
}: { label: string; seconds: number; onPress: () => void; cancelable?: boolean; kind?: 'primary' | 'ghost' }) {
  const [left, setLeft] = useState(seconds);
  const [stopped, setStopped] = useState(false);
  const [away, setAway] = useState(false);
  const [w, setW] = useState(0);
  const fire = useRef(onPress);
  fire.current = onPress;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      const gone = s !== 'active';
      setAway(gone);
      if (gone) setLeft(seconds);
    });
    return () => sub.remove();
  }, [seconds]);

  const running = !stopped && !away;
  useEffect(() => {
    if (!running) return;
    const end = Date.now() + left * 1000;
    const id = setInterval(() => {
      const s = Math.ceil((end - Date.now()) / 1000);
      if (s > 0) { setLeft(s); return; }
      clearInterval(id);
      setStopped(true);
      fire.current();
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const primary = kind === 'primary';
  const frac = stopped ? 0 : 1 - left / seconds;
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => { setStopped(true); onPress(); }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: 64, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', backgroundColor: primary ? C.lavenderDark : 'transparent', borderWidth: primary ? 0 : 2, borderColor: C.line }}>
        {!stopped ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w * frac, backgroundColor: primary ? C.lavender : C.line }} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: primary ? C.dark : C.ink, fontFamily: F.brand, fontSize: 24 }}>{label}</Text>
          {!stopped ? <Text style={{ color: primary ? C.dark : C.muted, fontFamily: F.heavy, fontSize: 18 }}>{left}s</Text> : null}
        </View>
      </Pressable>
      {cancelable && !stopped ? (
        <Pressable accessibilityRole="button" onPress={() => setStopped(true)} style={{ alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 14 }}>
          <Text style={{ color: C.muted, fontFamily: F.heavy, fontSize: 14 }}>Cancelar contagem</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
