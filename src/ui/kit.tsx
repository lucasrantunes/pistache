import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, F } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>{children}</View>
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

// ---------- Medalha do jogador (decisão 47: avatar de bichinho) ----------

/** Mistura a cor do jogador com branco para o rosto da medalha. */
function pastel(hex: string, amount = 0.62): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

/** Orelhas redondas ou compridas, conforme o nome (sempre o mesmo para o mesmo jogador). */
const tallEars = (name: string): boolean => (name.charCodeAt(0) + name.length) % 2 === 0;

/**
 * Medalha: disco escuro, anel na cor do jogador e carinha de bichinho.
 * Tudo medido em "em" (size / 3), como no sketch. `sad` = carinha triste (casa de azar); `leader` = coroa.
 */
export function Medal({
  name, color, size = 44, leader = false, sad = false,
}: { name: string; color: string; size?: number; leader?: boolean; sad?: boolean }) {
  const e = size / 3;
  const face = pastel(color);
  const earH = (tallEars(name) ? 0.95 : 0.75) * e;
  const b = 0.16 * e; // largura do anel; as medidas do sketch partem de dentro dele
  const dot = (left: number) => (
    <View style={{ position: 'absolute', left: left * e + b, top: 1.34 * e + b, width: 0.22 * e, height: 0.28 * e, borderRadius: e, backgroundColor: C.dark }} />
  );
  return (
    <View style={{ width: size, height: size }} accessibilityLabel={name}>
      {leader ? (
        <Text style={{ position: 'absolute', top: -0.95 * e, left: 0, right: 0, textAlign: 'center', fontSize: 1.1 * e, lineHeight: 1.3 * e, color: C.yellow, zIndex: 2 }}>♛</Text>
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.track, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0.42 * e + b, top: 0.3 * e + b, width: 0.7 * e, height: earH, borderRadius: e, backgroundColor: face }} />
        <View style={{ position: 'absolute', right: 0.42 * e + b, top: 0.3 * e + b, width: 0.7 * e, height: earH, borderRadius: e, backgroundColor: face }} />
        <View style={{ position: 'absolute', left: 0.46 * e + b, top: 0.74 * e + b, width: 1.76 * e, height: 1.76 * e, borderRadius: e, backgroundColor: face }} />
        {dot(0.84)}
        {dot(1.62)}
        {sad ? (
          <View style={{ position: 'absolute', left: 1.15 * e + b, top: 1.78 * e + b, width: 0.4 * e, height: 0.22 * e, borderTopLeftRadius: e, borderTopRightRadius: e, backgroundColor: C.red }} />
        ) : (
          <View style={{ position: 'absolute', left: 1.15 * e + b, top: 1.7 * e + b, width: 0.4 * e, height: 0.26 * e, borderRadius: e, backgroundColor: C.red }} />
        )}
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: size / 2, borderWidth: b, borderColor: color }} />
      </View>
    </View>
  );
}
