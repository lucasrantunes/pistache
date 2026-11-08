// Sala em tempo real (Supabase Realtime, canal "broadcast"): o celular envia o estado, a TV recebe.
import { createClient } from '@supabase/supabase-js';

import type { TvView } from './view';

function baseUrl(raw: string): string {
  try { return new URL(raw.trim()).origin; } catch { return raw.trim(); }
}
const URL_BASE = baseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!client) {
    client = createClient(URL_BASE, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

export type RoomStatus = 'connecting' | 'ready' | 'error';

export type RoomHandlers = {
  onState?: (view: TvView) => void;
  /** Últimas palavras ditas (o que o jogo está entendendo). Mensagem leve, separada do estado. */
  onWords?: (text: string) => void;
  /** A TV entrou (ou recarregou) e quer o estado atual. */
  onHello?: () => void;
  onStatus?: (status: RoomStatus) => void;
};

export type Room = {
  sendState: (view: TvView) => void;
  sendWords: (text: string) => void;
  sendHello: () => void;
  leave: () => void;
};

export function joinRoom(code: string, handlers: RoomHandlers): Room {
  const supabase = getClient();
  const channel = supabase.channel(`pistache:${code}`, { config: { broadcast: { self: false } } });
  let ready = false;
  channel.on('broadcast', { event: 'state' }, ({ payload }) => handlers.onState?.(payload as TvView));
  channel.on('broadcast', { event: 'words' }, ({ payload }) => handlers.onWords?.(String((payload as { text?: unknown })?.text ?? '')));
  channel.on('broadcast', { event: 'hello' }, () => handlers.onHello?.());
  handlers.onStatus?.('connecting');
  channel.subscribe((status, err) => {
    if (status !== 'SUBSCRIBED') console.warn('[sala]', status, err?.message ?? '');
    if (status === 'SUBSCRIBED') {
      ready = true;
      handlers.onStatus?.('ready');
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      ready = false;
      handlers.onStatus?.('error');
    }
  });
  return {
    sendState: (view) => {
      if (ready) void channel.send({ type: 'broadcast', event: 'state', payload: view });
    },
    sendWords: (text) => {
      if (ready) void channel.send({ type: 'broadcast', event: 'words', payload: { text } });
    },
    sendHello: () => {
      if (ready) void channel.send({ type: 'broadcast', event: 'hello', payload: {} });
    },
    leave: () => {
      void supabase.removeChannel(channel);
    },
  };
}
