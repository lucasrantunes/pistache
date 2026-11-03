// Placar de corrida até a meta (celular e TV usam o mesmo desenho, só muda a escala).
import { useState } from 'react';
import { Text, View } from 'react-native';

import { specialTicks } from '@/game';
import type { RankRow } from '@/game';
import type { SpecialKind } from '@/game';

import { Medal } from './kit';
import { C, F, PLAYER_COLORS } from './theme';

export const KIND_COLOR: Record<SpecialKind, string> = { bad: C.red, dobro: C.yellow, ladrao: C.orange, turbo: C.lime };
export const KIND_LABEL: Record<SpecialKind, string> = { bad: 'Azar', dobro: 'Dobro', ladrao: 'Ladrão', turbo: 'Turbo' };

/** Cor fixa de cada jogador, pela ordem em que entrou. */
export const colorOf = (order: string[], id: string): string => PLAYER_COLORS[Math.max(0, order.indexOf(id)) % PLAYER_COLORS.length];

function Lane({ row, color, goal, k }: { row: RankRow; color: string; goal: number; k: number }) {
  const [w, setW] = useState(0);
  const medal = 27 * k;
  const frac = Math.min(1, row.points / goal);
  const left = Math.round(frac * Math.max(0, w - medal));
  const ticks = specialTicks().filter((t) => t.frac * goal > row.points);
  const move = row.move;
  return (
    <View style={{ gap: 4 * k }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * k, height: 26 * k }}>
        <Text style={{ width: 18 * k, fontFamily: F.brand, fontSize: 20 * k, color: C.muted }}>{row.rank}</Text>
        <Text numberOfLines={1} style={{ fontFamily: F.brand, fontSize: 22 * k, color: C.ink, flexShrink: 1 }}>{row.name}</Text>
        {move !== 0 ? (
          <View style={{ paddingHorizontal: 8 * k, paddingVertical: 1 * k, borderRadius: 999, backgroundColor: move > 0 ? C.green : C.red }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 12 * k, color: C.dark }}>{move > 0 ? '▲' : '▼'} {Math.abs(move)}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: F.brand, fontSize: 22 * k, color: C.ink }}>
          {row.points}<Text style={{ fontSize: 14 * k, color: C.muted }}> / {goal}</Text>
        </Text>
      </View>
      <View style={{ height: 28 * k }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 8 * k, height: 12 * k, borderRadius: 999, backgroundColor: C.line }} />
        <View style={{ position: 'absolute', left: 0, top: 8 * k, height: 12 * k, width: left + medal / 2, borderRadius: 999, backgroundColor: color }} />
        {ticks.map((t) => (
          <View key={t.frac} style={{ position: 'absolute', left: Math.round(t.frac * (w - 6 * k)), top: 11 * k, width: 6 * k, height: 6 * k, borderRadius: 999, backgroundColor: KIND_COLOR[t.kind], borderWidth: 2 * k, borderColor: C.panel }} />
        ))}
        <View style={{ position: 'absolute', right: -2 * k, top: 4 * k, width: 20 * k, height: 20 * k, borderRadius: 999, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11 * k, color: C.dark, fontFamily: F.heavy }}>⚑</Text>
        </View>
        <View style={{ position: 'absolute', left, top: 0 }}>
          <Medal name={row.name} color={color} size={medal} leader={row.leader} />
        </View>
        {row.gained > 0 ? (
          <View style={{ position: 'absolute', left: left + medal + 6 * k, top: -2 * k, paddingHorizontal: 10 * k, height: 22 * k, borderRadius: 999, backgroundColor: C.yellow, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.brand, fontSize: 16 * k, color: C.dark }}>+{row.gained}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontFamily: F.ui, fontSize: 12 * k, color: C.muted, textAlign: 'right' }}>
        {row.remaining > 0 ? `faltam ${row.remaining} pontos` : 'chegou na meta!'}
      </Text>
    </View>
  );
}

export function RankingList({ rows, order, goal, k = 1 }: { rows: RankRow[]; order: string[]; goal: number; k?: number }) {
  return (
    <View style={{ gap: 10 * k, padding: 12 * k, borderRadius: 24 * k, backgroundColor: C.panel }}>
      {rows.map((r) => <Lane key={r.id} row={r} color={colorOf(order, r.id)} goal={goal} k={k} />)}
    </View>
  );
}

export function SpecialLegend({ k = 1 }: { k?: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 * k }}>
      {(['bad', 'dobro', 'ladrao', 'turbo'] as SpecialKind[]).map((kind) => (
        <View key={kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * k }}>
          <View style={{ width: 8 * k, height: 8 * k, borderRadius: 999, backgroundColor: KIND_COLOR[kind] }} />
          <Text style={{ fontFamily: F.ui, fontSize: 12 * k, color: C.muted }}>{KIND_LABEL[kind]}</Text>
        </View>
      ))}
    </View>
  );
}
