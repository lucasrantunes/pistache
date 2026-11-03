// Pede ao servidor (Supabase) um token temporário da Deepgram.
function baseUrl(raw: string): string {
  try { return new URL(raw.trim()).origin; } catch { return raw.trim(); }
}
const URL_BASE = baseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasVoiceServer = (): boolean => Boolean(URL_BASE && ANON_KEY);

export async function fetchVoiceToken(): Promise<string> {
  const res = await fetch(`${URL_BASE}/functions/v1/deepgram-token`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok || !data || typeof data !== 'object' || !('accessToken' in data) || typeof data.accessToken !== 'string') {
    const msg = data && typeof data === 'object' && 'error' in data ? String(data.error) : `erro ${res.status}`;
    throw new Error(`Token de voz: ${msg}`);
  }
  return data.accessToken;
}
