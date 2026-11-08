import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** Cartas já jogadas por cada jogador (chave = nome normalizado), guardadas no aparelho. */
type Played = Record<string, string[]>;

const KEY = 'pistache-jogadas';
const MAX_PER_PLAYER = 600;

const keyOf = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function load(): Played {
  try {
    if (Platform.OS === 'web') return JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const file = new File(Paths.document, `${KEY}.json`);
    return file.exists ? JSON.parse(file.textSync()) : {};
  } catch {
    return {};
  }
}

function save(data: Played) {
  try {
    if (Platform.OS === 'web') { localStorage.setItem(KEY, JSON.stringify(data)); return; }
    const file = new File(Paths.document, `${KEY}.json`);
    if (!file.exists) file.create();
    file.write(JSON.stringify(data));
  } catch { /* sem armazenamento: o jogo segue, só pode repetir cartas */ }
}

/** Ids das cartas que algum dos jogadores já viu. */
export function playedIdsOf(names: string[]): string[] {
  const data = load();
  const all = new Set<string>();
  for (const n of names) for (const id of data[keyOf(n)] ?? []) all.add(id);
  return [...all];
}

/** Registra que estes jogadores viram esta carta. */
export function markPlayed(names: string[], cardId: string) {
  const data = load();
  for (const n of names) {
    const k = keyOf(n);
    const list = (data[k] ?? []).filter((id) => id !== cardId);
    list.push(cardId);
    data[k] = list.slice(-MAX_PER_PLAYER);
  }
  save(data);
}
