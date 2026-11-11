// Peças do lobby que o passo a passo da primeira vez também usa.
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { MAX_PLAYERS } from '@/game';
import { Medal, T } from './kit';
import { C, F, PLAYER_COLORS } from './theme';

export const MAX_NAME = 12;

const ICONS: Record<string, string[]> = {
  pessoa: ['M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7'],
  lugar: ['M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z'],
  coisa: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12l8-4.5M12 12v9M12 12L4 7.5'],
  animal: ['M8 17c0-2.5 2-4.5 4-4.5s4 2 4 4.5c0 1.6-1.4 2.5-4 2.5s-4-.9-4-2.5z'],
  comida: ['M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2.5 1.5-3 5-3 8h3'],
  esporte: ['M12 3v18M3 12h18M5.5 5.5c3 3 3 10 0 13M18.5 5.5c-3 3-3 10 0 13'],
};

/** Ícone simples da categoria, em traço escuro. */
export function CatIcon({ id, size = 24, color = C.dark }: { id: string; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {id === 'pessoa' ? <Circle cx="12" cy="8" r="4" /> : null}
      {id === 'lugar' ? <Circle cx="12" cy="10" r="2.5" /> : null}
      {id === 'animal' ? <><Circle cx="7" cy="10" r="1.8" /><Circle cx="12" cy="7" r="1.8" /><Circle cx="17" cy="10" r="1.8" /></> : null}
      {id === 'esporte' ? <Circle cx="12" cy="12" r="9" /> : null}
      {(ICONS[id] ?? []).map((d) => <Path key={d} d={d} />)}
    </Svg>
  );
}

export const colorOfIndex = (i: number) => PLAYER_COLORS[i % PLAYER_COLORS.length];

/** Fileira de círculos com a letra de cada jogador e um único "+" para adicionar. */
export function PlayersGrid({ names, editing, onEdit, onAdd }: { names: string[]; editing: number | null; onEdit: (i: number) => void; onAdd: () => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
      {names.map((n, i) => (
        <Pressable key={i} accessibilityRole="button" accessibilityLabel={n || `Jogador ${i + 1}`} onPress={() => onEdit(i)} style={{ width: '20%', alignItems: 'center', gap: 4, paddingHorizontal: 2 }}>
          <View style={editing === i ? { borderRadius: 30, padding: 3, borderWidth: 2, borderColor: colorOfIndex(i) } : { padding: 5 }}>
            <Medal name={n || '?'} color={colorOfIndex(i)} size={editing === i ? 46 : 52} />
          </View>
          <T font="heavy" size={12} numberOfLines={1} color={editing === i ? colorOfIndex(i) : C.ink}>{n || 'Novo'}</T>
        </Pressable>
      ))}
      {names.length < MAX_PLAYERS ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Adicionar jogador" onPress={onAdd} style={{ width: '20%', alignItems: 'center', gap: 4, paddingHorizontal: 2 }}>
          <View style={{ width: 52, height: 52, margin: 5, borderRadius: 26, borderWidth: 2, borderStyle: 'dashed', borderColor: '#5a4a9a', alignItems: 'center', justifyContent: 'center' }}>
            <T size={26} color={C.muted}>+</T>
          </View>
          <T size={12}>{' '}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Campo de nome com contador (máx. 12) e dica de usar só o primeiro nome. */
export function NameField({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <View>
      <TextInput
        autoFocus
        value={value}
        onChangeText={(v) => onChange(v.slice(0, MAX_NAME))}
        onSubmitEditing={onSubmit}
        returnKeyType="next"
        maxLength={MAX_NAME}
        placeholder="Nome do jogador"
        placeholderTextColor="rgba(185,174,224,0.6)"
        style={{ height: 56, borderRadius: 16, paddingLeft: 16, paddingRight: 64, color: C.ink, fontFamily: F.heavy, fontSize: 20, backgroundColor: '#2d2262', borderWidth: 2, borderColor: C.lavender }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
        <T font="heavy" size={13} color={C.muted}>{value.length}/{MAX_NAME}</T>
      </View>
    </View>
  );
}

/** Tela de edição dos nomes: só o que importa com o teclado aberto. */
export function PlayersEditor({ names, setNames, editing, setEditing, onClose, repeated }: {
  names: string[]; setNames: (n: string[]) => void; editing: number; setEditing: (i: number | null) => void; onClose: () => void; repeated: boolean;
}) {
  const set = (v: string) => setNames(names.map((n, k) => (k === editing ? v : n)));
  const next = () => {
    if (editing + 1 < names.length) setEditing(editing + 1);
    else if (names[editing].trim() && names.length < MAX_PLAYERS) { setNames([...names, '']); setEditing(names.length); }
    else onClose();
  };
  const remove = () => {
    const rest = names.filter((_, k) => k !== editing);
    setNames(rest);
    if (rest.length === 0) onClose(); else setEditing(Math.min(editing, rest.length - 1));
  };
  const filled = names.filter((n) => n.trim()).length;
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <T font="brand" size={30}>Quem vai jogar?</T>
        <Pressable accessibilityRole="button" onPress={onClose} style={{ height: 44, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.lavender, borderBottomWidth: 4, borderBottomColor: C.lavenderDark, alignItems: 'center', justifyContent: 'center' }}>
          <T font="brand" size={20} color={C.dark}>Pronto</T>
        </Pressable>
      </View>
      <T size={14} color={C.muted}>{filled} de {MAX_PLAYERS} jogadores. Cada um diz o próprio nome ao acertar, então nada de nomes repetidos.</T>
      <View style={{ gap: 14, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1.5, borderRadius: 24, padding: 16 }}>
        <PlayersGrid names={names} editing={editing} onEdit={setEditing} onAdd={() => { if (names.length < MAX_PLAYERS) { setNames([...names, '']); setEditing(names.length); } }} />
        <NameField key={editing} value={names[editing] ?? ''} onChange={set} onSubmit={next} />
      </View>
      {repeated ? <T font="heavy" size={13} color={C.orange} style={{ textAlign: 'center' }}>Dois jogadores com o mesmo nome. Mude um deles para o jogo saber quem falou.</T> : (
        <T size={13} color={C.muted} style={{ textAlign: 'center' }}>Só o primeiro nome ajuda o jogo a te ouvir. Toque em Próximo para o jogador seguinte.</T>
      )}
      <Pressable accessibilityRole="button" onPress={remove} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 }}>
        <T font="heavy" size={14} color={C.red}>Remover este jogador</T>
      </Pressable>
    </>
  );
}
