import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, F } from './theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Glass({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: C.glass, borderColor: C.line, borderWidth: 1, borderRadius: 24, padding: 16 }, style]}>
      {children}
    </View>
  );
}

export function T({
  children, size = 16, color = C.ink, font = 'ui', style, numberOfLines,
}: { children: ReactNode; size?: number; color?: string; font?: keyof typeof F; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={[{ fontSize: size, color, fontFamily: F[font] }, style]}>{children}</Text>;
}

export function Pill({ label, color = C.lavender, bg = 'rgba(183,156,255,0.18)' }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: bg }}>
      <Text style={{ color, fontFamily: F.mono, fontWeight: '700', fontSize: 14, letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

type BtnKind = 'primary' | 'ghost' | 'green' | 'danger';
const BTN: Record<BtnKind, { bg: string; fg: string; edge: string; border?: string }> = {
  primary: { bg: C.lavender, fg: C.dark, edge: '#6a43c9' },
  green: { bg: C.green, fg: '#05301f', edge: '#14894f' },
  danger: { bg: C.red, fg: '#3a0d12', edge: '#b04449' },
  ghost: { bg: C.glass, fg: C.ink, edge: 'transparent', border: C.line },
};

export function Btn({
  label, onPress, kind = 'primary', disabled = false, style,
}: { label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const k = BTN[kind];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: 56, borderRadius: 28, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center',
          backgroundColor: k.bg, borderBottomWidth: kind === 'ghost' ? 0 : pressed ? 2 : 5, borderBottomColor: k.edge,
          borderWidth: k.border ? 1 : 0, borderColor: k.border, opacity: disabled ? 0.4 : 1,
          transform: [{ translateY: pressed && kind !== 'ghost' ? 3 : 0 }],
        },
        style,
      ]}>
      <Text style={{ color: k.fg, fontFamily: F.heavy, fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
}

/** Círculo com a inicial e anel na cor do jogador (os animais entram na fase da cena final). */
export function Medal({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.brand, fontSize: size * 0.5, color: C.dark }}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}
