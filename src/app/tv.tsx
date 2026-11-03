// Página da TV (só visualização). Abra no navegador da TV; ela mostra um código de 4 letras.
// Quadro de 1280 x 720 do sketch "piso de pedra", escalado para a tela. Pode abrir a qualquer momento,
// inclusive com a partida em andamento: o celular reenvia o estado quando a TV pede.
import { createElement, useEffect, useState } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';

import { MAX_CLUES, SPECIAL_SQUARES, rankRows } from '@/game';
import type { SpecialKind } from '@/game';
import { newRoomCode } from '@/realtime/code';
import { joinRoom } from '@/realtime/room';
import type { RoomStatus } from '@/realtime/room';
import type { TvPlayer, TvView } from '@/realtime/view';
import { FLOOR_TOP, TORCHES, floorStones } from '@/scene/floor';
import { TV_HEIGHT, TV_WIDTH, trackCurve, trackSpots } from '@/scene/track';
import { Medal } from '@/ui/kit';
import { KIND_COLOR, RankingList, SpecialLegend } from '@/ui/ranking';
import { C, F } from '@/ui/theme';

const CODE_KEY = 'pistache:tv-code';
// Vídeo preto de 2 s, sem som, em repetição: faz TVs sem a função "manter tela ligada" acharem que alguém está assistindo.
const NOSLEEP_VIDEO = 'data:video/mp4;base64,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';
const SPOTS = trackSpots();
const CURVE = trackCurve();
const STONES = floorStones();
const PATH_D = 'M' + CURVE.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L');

function loadCode(): string {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(CODE_KEY) : null;
    if (saved && /^[A-Z]{4}$/.test(saved)) return saved;
  } catch { /* sem armazenamento */ }
  const code = newRoomCode();
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(CODE_KEY, code); } catch { /* ok */ }
  return code;
}

/** Mantém a TV acordada: pede ao navegador para não apagar a tela e refaz o pedido quando a aba volta. */
function useKeepAwake() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    let lock: { release: () => Promise<void> } | null = null;
    let active = true;
    const ask = async () => {
      try {
        const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl && active && document.visibilityState === 'visible') lock = await wl.request('screen');
      } catch { /* navegador da TV sem suporte: o vídeo de reserva cobre */ }
    };
    ask();
    const onVisible = () => { if (document.visibilityState === 'visible') ask(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; document.removeEventListener('visibilitychange', onVisible); lock?.release().catch(() => {}); };
  }, []);
}

// Estilos só da web (a TV roda no navegador).
const web = (o: object) => o as object;
const bg = web({ backgroundColor: C.bg });
const abs = { position: 'absolute' } as const;

const brand = (size: number, color: string = C.ink) => ({ fontFamily: F.brand, fontSize: size, color }) as const;

// ---------- Cena do jogo ----------

function Floor() {
  return (
    <>
      {STONES.map((s, i) => (
        <View key={i} style={[abs, web({ left: s.left, top: s.top, width: s.w, height: s.h, backgroundColor: s.fill, clipPath: s.clip })]} />
      ))}
      {Platform.OS === 'web'
        ? createElement(
            'svg',
            { width: TV_WIDTH, height: TV_HEIGHT, viewBox: `0 0 ${TV_WIDTH} ${TV_HEIGHT}`, style: { position: 'absolute', left: 0, top: 0 }, 'aria-hidden': true },
            createElement('path', { d: PATH_D, fill: 'none', stroke: '#0b0720', strokeOpacity: 0.55, strokeWidth: 104, strokeLinecap: 'round', strokeLinejoin: 'round' }),
            createElement('path', { d: PATH_D, fill: 'none', stroke: '#2b1f5c', strokeWidth: 90, strokeLinecap: 'round', strokeLinejoin: 'round' }),
            createElement('path', { d: PATH_D, fill: 'none', stroke: '#4d3d90', strokeWidth: 80, strokeDasharray: '54 5', strokeLinejoin: 'round' }),
            createElement('path', { d: PATH_D, fill: 'none', stroke: '#5a49a6', strokeWidth: 42, strokeDasharray: '36 6', strokeDashoffset: 27, strokeLinejoin: 'round' }),
          )
        : null}
      {TORCHES.map((t, i) => (
        <View key={i}>
          <View style={[abs, web({ left: t.x - 150, top: t.y - 150, width: 300, height: 300, borderRadius: 150, backgroundImage: 'radial-gradient(circle, rgba(255,143,61,0.38) 0%, rgba(255,143,61,0.12) 40%, rgba(255,143,61,0) 70%)' })]} />
          <View style={[abs, { left: t.x - 15, top: t.y - 60, width: 30, height: 70 }]}>
            <View style={[abs, { left: 3, bottom: 0, width: 24, height: 30, borderRadius: 6, backgroundColor: '#3a2f66', borderBottomWidth: 5, borderBottomColor: '#271e4d' }]} />
            <View style={[abs, web({ left: 2, bottom: 26, width: 26, height: 40, borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%', backgroundImage: 'linear-gradient(180deg,#ffca4b 0%,#ff8f3d 60%,#ff5a3d 100%)' })]} />
            <View style={[abs, web({ left: 9, bottom: 28, width: 12, height: 22, borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%', backgroundColor: '#fff3b8' })]} />
          </View>
        </View>
      ))}
      <View style={[abs, web({ left: 0, top: FLOOR_TOP, width: TV_WIDTH, height: TV_HEIGHT - FLOOR_TOP, backgroundImage: 'radial-gradient(ellipse at 50% 55%, rgba(19,13,47,0) 45%, rgba(19,13,47,0.72) 100%)', pointerEvents: 'none' })]} />
      <View style={[abs, web({ left: 0, top: FLOOR_TOP, width: TV_WIDTH, height: 60, backgroundImage: 'linear-gradient(180deg, rgba(19,13,47,0.85), rgba(19,13,47,0))' })]} />
    </>
  );
}

const TILE: Record<SpecialKind, { bg: string; edge: string; text: string }> = {
  bad: { bg: '#ff777b', edge: '#c24a52', text: '☠︎' },
  dobro: { bg: '#ffca4b', edge: '#c79a22', text: 'x2' },
  ladrao: { bg: '#ff8f3d', edge: '#c2601a', text: '$' },
  turbo: { bg: '#b7f04a', edge: '#82b02a', text: '⚡︎' },
};

function Track({ view }: { view: TvView }) {
  const bySquare = new Map<number, TvPlayer[]>();
  view.players.forEach((p) => bySquare.set(p.square, [...(bySquare.get(p.square) ?? []), p]));
  return (
    <>
      {SPOTS.slice(1).map((s, idx) => {
        const sq = idx + 1;
        const special = SPECIAL_SQUARES[sq];
        const goal = sq === 25;
        const t = special ? TILE[special] : goal ? { bg: '#ffca4b', edge: '#c79a22', text: '⚑' } : { bg: '#8470d6', edge: '#5646a6', text: '' };
        return (
          <View key={sq} style={[abs, web({ left: s.x - 33, top: s.y - 25, width: 66, height: 50, borderRadius: 13, backgroundColor: t.bg, borderBottomWidth: 6, borderBottomColor: t.edge, alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.35)' })]}>
            {t.text ? <Text style={brand(special === 'dobro' ? 28 : 30, C.dark)}>{t.text}</Text> : null}
          </View>
        );
      })}
      <Text style={[abs, { left: SPOTS[0].x - 22, top: SPOTS[0].y + 30, fontFamily: F.heavy, fontSize: 14, color: C.muted }]}>SAÍDA</Text>
      <Text style={[abs, brand(20, C.yellow), { left: SPOTS[25].x - 70, top: SPOTS[25].y + 30, width: 140, textAlign: 'center' }]}>META: {view.goal}</Text>
      {view.players.map((p) => {
        const s = SPOTS[p.square];
        const mates = bySquare.get(p.square) ?? [p];
        const shift = (mates.indexOf(p) - (mates.length - 1) / 2) * 46;
        return (
          <View key={p.id} style={[abs, { left: s.x - 50 + shift, top: s.y - 88, width: 100, alignItems: 'center', gap: 2 }]}>
            <Medal name={p.name} color={p.color} size={51} leader={p.id === view.leaderId} sad={p.muted} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 999, backgroundColor: C.bg, borderWidth: 2, borderColor: p.color }}>
              <Text numberOfLines={1} style={brand(20)}>{p.name}</Text>
              <Text style={brand(20, C.yellow)}>{p.points}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

/** Orbe dos pontos em jogo: o anel dourado encolhe a cada dica; na revelação mostra a resposta (decisão 45). */
function Orb({ view }: { view: TvView }) {
  const revealed = view.answer !== null;
  const ring = 70 + 136 * (view.points / MAX_CLUES);
  return (
    <>
      <View style={[abs, web({ left: 25, top: 360, width: 280, height: 280, borderRadius: 140, borderWidth: 10, borderColor: '#4d3d90', backgroundImage: 'radial-gradient(circle, #2f2558 0%, #1f1745 75%)', boxShadow: '0 0 0 5px #2b1f5c, 0 0 40px rgba(255,143,61,0.25)' })]} />
      <View style={[abs, { left: 80, top: 415, width: 170, height: 170, borderRadius: 85, borderWidth: 3, borderColor: 'rgba(177,138,255,0.22)' }]} />
      <View style={[abs, { left: 110, top: 445, width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: 'rgba(177,138,255,0.22)' }]} />
      {revealed ? (
        <View style={[abs, web({ left: 165 - 103, top: 500 - 103, width: 206, height: 206, borderRadius: 103, borderWidth: 6, borderColor: C.green, backgroundColor: 'rgba(50,227,151,0.14)', alignItems: 'center', justifyContent: 'center', padding: 14, boxShadow: '0 0 24px rgba(50,227,151,0.5)' })]}>
          <Text style={brand(34, C.green)}>✓</Text>
          <Text numberOfLines={3} style={[brand(view.answer!.length > 14 ? 24 : 30), { textAlign: 'center', lineHeight: view.answer!.length > 14 ? 26 : 32 }]}>{view.answer}</Text>
        </View>
      ) : (
        <>
          <View style={[abs, web({ left: 165 - ring / 2, top: 500 - ring / 2, width: ring, height: ring, borderRadius: ring / 2, borderWidth: 9, borderColor: C.yellow, boxShadow: '0 0 24px rgba(255,202,75,0.55), inset 0 0 18px rgba(255,202,75,0.25)' })]} />
          <View style={[abs, { left: 40, top: 450, width: 250, alignItems: 'center' }]}>
            <Text style={[brand(84, C.yellow), { lineHeight: 84 }]}>{view.points}</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 18, color: C.muted }}>pontos em jogo</Text>
          </View>
        </>
      )}
    </>
  );
}

function RoomBadge({ code }: { code: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 14, backgroundColor: C.panel, borderWidth: 2, borderColor: 'rgba(255,202,75,0.6)' }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 18, color: C.muted }}>Sala</Text>
      <Text style={[brand(32, C.yellow), { letterSpacing: 3 }]}>{code}</Text>
    </View>
  );
}

function Header({ view, code }: { view: TvView; code: string }) {
  const revealed = view.answer !== null;
  const winner = view.result?.winnerName;
  const headline = view.phase === 'noWinner' ? 'Ninguém acertou!'
    : revealed ? (winner ? `${winner} acertou na dica ${view.clue}!` : 'Ninguém pontuou nesta carta')
    : view.clueText ?? '';
  const effect = revealed && view.result?.effectText ? `${winner}: ${view.result.effectText}` : '';
  const bad = view.result?.effectText.startsWith('AZAR');
  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: FLOOR_TOP, paddingHorizontal: 32, paddingVertical: 20, gap: 12, backgroundImage: `linear-gradient(180deg, ${C.bg} 0%, ${C.bgTop} 100%)` })]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text style={brand(40)}>{revealed ? `Carta ${view.cardIndex + 1}` : `Dica ${view.clue}`}<Text style={brand(28, C.muted)}>{revealed ? '' : ` / ${MAX_CLUES}`}</Text></Text>
          <View style={{ paddingHorizontal: 18, paddingVertical: 6, borderRadius: 999, borderWidth: 3, borderColor: C.lavender }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.lavender }}>{view.category}</Text>
          </View>
          {view.paused ? <Text style={{ fontFamily: F.heavy, fontSize: 20, letterSpacing: 3, color: C.orange }}>PAUSADO</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <View style={{ width: 240, height: 16, borderRadius: 999, backgroundColor: C.track, overflow: 'hidden' }}>
            <View style={{ width: `${revealed ? 0 : (view.points / MAX_CLUES) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: C.yellow }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 22, paddingVertical: 6, borderRadius: 999, backgroundColor: revealed ? C.green : C.yellow }}>
            <Text style={brand(40, C.dark)}>{revealed ? `+${view.result?.gained ?? 0}` : view.points}</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.dark }}>{revealed ? 'pontos' : view.heard ? 'acertou?' : 'pontos em jogo'}</Text>
          </View>
          <RoomBadge code={code} />
        </View>
      </View>
      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, borderRadius: 28, backgroundColor: C.panel, borderWidth: 3, borderColor: 'rgba(177,138,255,0.4)' }}>
        <Text numberOfLines={revealed && effect ? 1 : 2} style={{ fontFamily: F.heavy, fontSize: revealed ? 44 : 44, lineHeight: 52, textAlign: 'center', color: revealed ? C.green : C.ink }}>{headline}</Text>
        {effect ? <Text numberOfLines={1} style={{ fontFamily: F.heavy, fontSize: 26, color: bad ? C.red : C.yellow, marginTop: 2 }}>{effect}</Text> : null}
      </View>
    </View>
  );
}

function PlayScene({ view, code }: { view: TvView; code: string }) {
  return (
    <>
      <Floor />
      <Orb view={view} />
      <Track view={view} />
      <Header view={view} code={code} />
    </>
  );
}

// ---------- Placar depois de cada carta ----------

function RankingScene({ view, code }: { view: TvView; code: string }) {
  const rows = rankRows(
    view.players.map((p) => ({ id: p.id, name: p.name, points: p.points })),
    Object.fromEntries(view.players.map((p) => [p.id, p.prevPoints])),
    view.goal,
  );
  const order = view.players.map((p) => p.id);
  const two = rows.length > 5;
  const k = rows.length <= 4 ? 1.3 : two ? 1 : 1.1;
  const half = Math.ceil(rows.length / 2);
  return (
    <View style={[abs, { left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, paddingHorizontal: 48, paddingTop: 28, gap: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 24 }}>
          <Text style={brand(64)}>Placar</Text>
          <Text style={{ fontFamily: F.heavy, fontSize: 28, color: C.green }}>Era: {view.answer}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 3, borderColor: C.lavender }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.lavender }}>Carta {view.cardIndex + 1} concluída</Text>
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999, backgroundColor: C.yellow }}>
            <Text style={brand(26, C.dark)}>⚑ Meta: {view.goal} pontos</Text>
          </View>
          <RoomBadge code={code} />
        </View>
      </View>
      {two ? (
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View style={{ flex: 1 }}><RankingList rows={rows.slice(0, half)} order={order} goal={view.goal} k={k} /></View>
          <View style={{ flex: 1 }}><RankingList rows={rows.slice(half)} order={order} goal={view.goal} k={k} /></View>
        </View>
      ) : (
        <RankingList rows={rows} order={order} goal={view.goal} k={k} />
      )}
      <SpecialLegend k={1.4} />
      <Text style={{ fontFamily: F.ui, fontSize: 20, color: C.muted, textAlign: 'center' }}>
        {view.tiebreak ? 'Empate na meta! Vem uma carta de desempate.' : 'Aguardando a próxima carta…'}
      </Text>
    </View>
  );
}

// ---------- Vencedor ----------

function FinalScene({ view, code }: { view: TvView; code: string }) {
  const winners = view.players.filter((p) => view.winnerIds.includes(p.id));
  const sorted = [...view.players].sort((a, b) => b.points - a.points);
  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundImage: 'radial-gradient(circle at 50% 40%, #2b1f5c 0%, #130d2f 70%)' })]}>
      <View style={[abs, { right: 32, top: 20 }]}><RoomBadge code={code} /></View>
      <Text style={{ fontFamily: F.heavy, fontSize: 24, letterSpacing: 8, color: C.muted }}>FIM DE JOGO</Text>
      <View style={{ flexDirection: 'row', gap: 20, paddingTop: 36 }}>
        {winners.map((w) => <Medal key={w.id} name={w.name} color={w.color} size={190} leader />)}
      </View>
      <Text numberOfLines={1} style={brand(winners.length > 1 ? 84 : 120, C.yellow)}>
        {winners.length ? `${winners.map((w) => w.name).join(' e ')} ${winners.length > 1 ? 'venceram' : 'venceu'}!` : 'Empate!'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 26, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 60 }}>
        {sorted.map((p) => (
          <View key={p.id} style={{ alignItems: 'center', gap: 4 }}>
            <Medal name={p.name} color={p.color} size={60} />
            <Text style={brand(24)}>{p.name}</Text>
            <Text style={brand(26, C.yellow)}>{p.points}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- Sala de espera ----------

function Waiting({ code, status }: { code: string; status: RoomStatus }) {
  const steps = ['Abra o Pistache', 'Toque em “Conectar TV”', 'Digite o código ao lado'];
  return (
    <View style={[abs, { left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
      <Text style={brand(64, C.yellow)}>Pistache</Text>
      <Text style={{ fontFamily: F.heavy, fontSize: 26, color: C.muted }}>Conecte o seu aparelho para começar</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 70, marginTop: 28 }}>
        <View style={{ gap: 18 }}>
          {steps.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={brand(26, C.dark)}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: F.heavy, fontSize: 30, color: C.ink }}>{s}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: 6, color: C.muted }}>CÓDIGO DA SALA</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {code.split('').map((ch, i) => (
              <View key={i} style={{ width: 96, height: 120, borderRadius: 22, backgroundColor: C.panel, borderWidth: 3, borderColor: 'rgba(255,202,75,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={brand(86, C.yellow)}>{ch}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Text style={{ fontFamily: F.ui, fontSize: 22, color: status === 'error' ? C.red : C.lavender, marginTop: 30 }}>
        {status === 'error' ? 'Sem conexão. Tentando de novo…' : status === 'ready' ? 'Esperando conexão…' : 'Conectando…'}
      </Text>
      <Text style={{ fontFamily: F.ui, fontSize: 18, color: C.muted, textAlign: 'center', width: 760, marginTop: 8 }}>
        Esta tela só mostra o jogo, e dá para entrar a qualquer momento, até com a partida em andamento.
      </Text>
    </View>
  );
}

export default function Tv() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / TV_WIDTH, height / TV_HEIGHT);
  const [code] = useState(loadCode);
  const [view, setView] = useState<TvView | null>(null);
  const [status, setStatus] = useState<RoomStatus>('connecting');
  useKeepAwake();

  useEffect(() => {
    const room = joinRoom(code, {
      onState: setView,
      onStatus: (s) => {
        setStatus(s);
        if (s === 'ready') room.sendHello();
      },
    });
    // Se ninguém responder, pede o estado de novo (celular que entrou depois).
    const id = setInterval(() => room.sendHello(), 5000);
    return () => { clearInterval(id); room.leave(); };
  }, [code]);

  const screen = view?.screen ?? 'round';
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, bg]}>
      <View style={web({ width: TV_WIDTH, height: TV_HEIGHT, transform: [{ scale }], overflow: 'hidden' })}>
        {!view ? <Waiting code={code} status={status} />
          : screen === 'ranking' ? <RankingScene view={view} code={code} />
          : screen === 'final' ? <FinalScene view={view} code={code} />
          : <PlayScene view={view} code={code} />}
        {/* Bordas que se desfazem no fundo: em telas de outra proporção o quadro não termina em corte seco. */}
        <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, pointerEvents: 'none', boxShadow: `inset 0 0 70px 28px ${C.bg}` })]} />
      </View>
      {Platform.OS === 'web'
        ? createElement('video', { src: NOSLEEP_VIDEO, autoPlay: true, loop: true, muted: true, playsInline: true, 'aria-hidden': true, style: { position: 'absolute', width: 2, height: 2, opacity: 0.01, pointerEvents: 'none' } })
        : null}
    </View>
  );
}
