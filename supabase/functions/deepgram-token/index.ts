// Edge Function do Supabase: entrega um token temporário da Deepgram ao app.
// A chave verdadeira (DEEPGRAM_API_KEY) fica só aqui, nos Secrets do Supabase.
const TTL_SECONDS = 120;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return Response.json({ error: 'Método inválido.' }, { status: 405, headers: cors });

  const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
  if (!apiKey) return Response.json({ error: 'Voz não configurada no servidor.' }, { status: 503, headers: cors });

  const res = await fetch('https://api.deepgram.com/v1/auth/grant', {
    method: 'POST',
    headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: TTL_SECONDS }),
  });
  if (!res.ok) {
    console.error('Deepgram grant falhou', res.status, await res.text());
    return Response.json({ error: 'Não foi possível preparar a voz.' }, { status: 502, headers: cors });
  }
  const data = await res.json();
  if (typeof data?.access_token !== 'string') {
    return Response.json({ error: 'Resposta inválida da Deepgram.' }, { status: 502, headers: cors });
  }
  return Response.json(
    { accessToken: data.access_token, expiresIn: data.expires_in ?? TTL_SECONDS },
    { headers: { ...cors, 'Cache-Control': 'no-store' } },
  );
});
