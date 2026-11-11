import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** O que o lobby lembra entre partidas e entre execuções: jogadores, categorias, meta, sala e se já viu o passo a passo. */
export interface LobbySaved {
  names: string[];
  cats: string[] | null; // null = todas
  goal: number | null;
  room: string;
  seenIntro: boolean;
}

const KEY = 'pistache-lobby';
const EMPTY: LobbySaved = { names: [], cats: null, goal: null, room: '', seenIntro: false };

export function loadLobby(): LobbySaved {
  try {
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(KEY)
      : (() => { const f = new File(Paths.document, `${KEY}.json`); return f.exists ? f.textSync() : null; })();
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveLobby(patch: Partial<LobbySaved>) {
  const data = { ...loadLobby(), ...patch };
  try {
    if (Platform.OS === 'web') { localStorage.setItem(KEY, JSON.stringify(data)); return; }
    const f = new File(Paths.document, `${KEY}.json`);
    if (!f.exists) f.create();
    f.write(JSON.stringify(data));
  } catch { /* sem armazenamento: o jogo segue, só não lembra */ }
}
