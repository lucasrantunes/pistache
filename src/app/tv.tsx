// Página da TV (só visualização). Abra no navegador da TV; ela mostra um código de 4 letras.
// Quadro de 1280 x 720 do sketch "piso de pedra", escalado para a tela. Pode abrir a qualquer momento,
// inclusive com a partida em andamento: o celular reenvia o estado quando a TV pede.
import { createElement, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';

import { CLUE_MS, MAX_CLUES, SPECIAL_SQUARES, clueTimer, squareOf } from '@/game';
import type { ClueLevel } from '@/game';
import type { SpecialKind } from '@/game';
import { newRoomCode } from '@/realtime/code';
import { joinRoom } from '@/realtime/room';
import type { RoomStatus } from '@/realtime/room';
import type { TvPlayer, TvView } from '@/realtime/view';
import { FLOOR_TOP, TORCHES, floorStones } from '@/scene/floor';
import { enableSound, play, soundState, subscribeSound, toggleMute } from '@/scene/sound';
import { TV_HEIGHT, TV_WIDTH, trackCurve, trackSpots } from '@/scene/track';
import { WALK_STEP_MS, walkPath, walkStepMs } from '@/scene/walk';
import { Medal } from '@/ui/kit';
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

/**
 * Casa onde cada peão deve estar agora. Na tela "Acertou!" o vencedor só chega até a casa em que parou
 * (antes do efeito) e os outros ainda estão onde estavam no começo da carta; o efeito (azar, turbo...) mexe nos peões depois.
 */
function targetSquares(view: TvView): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of view.players) {
    out[p.id] = view.screen === 'answer' && view.result
      ? (p.id === view.result.winnerId ? view.result.toSquare : squareOf(p.prevPoints, view.goal))
      : p.square;
  }
  return out;
}

type Walk = { square: number; walking: boolean; stepMs: number };

/** Faz cada peão andar casa por casa (para frente ou para trás) até a casa certa. Entrar com a partida rolando não anda: já aparece no lugar. */
function useWalkers(view: TvView): Record<string, Walk> {
  const target = targetSquares(view);
  const key = JSON.stringify(target);
  const newGame = view.players.every((p) => p.points === 0);
  const pos = useRef<Record<string, number>>({ ...target });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [shown, setShown] = useState<Record<string, Walk>>(() =>
    Object.fromEntries(Object.entries(target).map(([id, sq]) => [id, { square: sq, walking: false, stepMs: WALK_STEP_MS }])));

  useEffect(() => {
    for (const [id, to] of Object.entries(target)) {
      clearTimeout(timers.current[id]);
      const from = pos.current[id];
      const path = from === undefined || newGame ? [] : walkPath(from, to);
      if (path.length === 0) {
        pos.current[id] = to;
        setShown((s) => ({ ...s, [id]: { square: to, walking: false, stepMs: WALK_STEP_MS } }));
        continue;
      }
      const ms = walkStepMs(path.length);
      let i = 0;
      const step = () => {
        const sq = path[i];
        i += 1;
        const last = i >= path.length;
        pos.current[id] = sq;
        setShown((s) => ({ ...s, [id]: { square: sq, walking: !last, stepMs: ms } }));
        if (!last) timers.current[id] = setTimeout(step, ms);
      };
      step();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);
  return shown;
}

function Track({ view }: { view: TvView }) {
  const walk = useWalkers(view);
  const reaction = view.screen === 'effect' ? (view.result?.effectCard?.tone ?? null) : null;
  const squareOfPlayer = (p: TvPlayer) => walk[p.id]?.square ?? p.square;
  const bySquare = new Map<number, TvPlayer[]>();
  view.players.forEach((p) => bySquare.set(squareOfPlayer(p), [...(bySquare.get(squareOfPlayer(p)) ?? []), p]));
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
        const w = walk[p.id] ?? { square: p.square, walking: false, stepMs: WALK_STEP_MS };
        const s = SPOTS[w.square];
        const mates = bySquare.get(w.square) ?? [p];
        const shift = (mates.indexOf(p) - (mates.length - 1) / 2) * 46;
        return (
          <View
            key={p.id}
            style={[abs, web({
              left: s.x - 50 + shift, top: s.y - 88, width: 100, alignItems: 'center', gap: 2, zIndex: w.walking ? 5 : 1,
              transitionProperty: 'left, top', transitionDuration: `${w.stepMs}ms`, transitionTimingFunction: 'linear',
              ...(w.walking ? { animationName: 'pistache-hop', animationDuration: `${w.stepMs}ms`, animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }
                : reaction && p.id === view.result?.winnerId ? { animationName: reaction === 'bad' ? 'pistache-shake' : 'pistache-hop', animationDuration: reaction === 'bad' ? '500ms' : '420ms', animationIterationCount: reaction === 'bad' ? 4 : 5 } : {}),
            })]}>
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
          <Text style={[brand(60, C.yellow), { lineHeight: 64 }]}>{(view.result?.gained ?? 0) > 0 ? `+${view.result?.gained}` : '—'}</Text>
          <Text style={{ fontFamily: F.heavy, fontSize: 18, color: C.muted }}>pontos</Text>
        </View>
      ) : (
        <>
          <View style={[abs, web({ left: 165 - ring / 2, top: 500 - ring / 2, width: ring, height: ring, borderRadius: ring / 2, borderWidth: 9, borderColor: C.yellow, boxShadow: '0 0 24px rgba(255,202,75,0.55), inset 0 0 18px rgba(255,202,75,0.25)' })]} />
          <View style={[abs, { left: 40, top: 450, width: 250, alignItems: 'center' }]}>
            <View key={`pts-${view.cardIndex}-${view.points}`} style={web({ animationName: 'pistache-drop', animationDuration: '420ms', animationFillMode: 'both' })}>
              <Text style={[brand(84, C.yellow), { lineHeight: 84 }]}>{view.points}</Text>
            </View>
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

const TIMER_COLOR: Record<ClueLevel, string> = { ok: C.green, warn: C.orange, danger: C.red };

/** O tempo da dica na TV: conta sozinho a partir do valor que o celular mandou (sem mensagem a cada segundo). */
function useClueClock(view: TvView, receivedAt: number) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!view.timerRunning) return;
    const id = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(id);
  }, [view.timerRunning, receivedAt]);
  const left = view.timerRunning ? Math.max(0, view.timerMs - (Date.now() - receivedAt)) : view.timerMs;
  return clueTimer(CLUE_MS - left);
}

/** A palavra da resposta, gigante e numa linha só (o tamanho cai conforme o tamanho da palavra). */
function BigWord({ word, color, max = 88 }: { word: string; color: string; max?: number }) {
  const size = Math.round(word.length <= 10 ? max : word.length <= 14 ? max * 0.84 : word.length <= 20 ? max * 0.66 : max * 0.52);
  return <Text numberOfLines={1} style={{ fontFamily: F.brand, fontSize: size, lineHeight: Math.round(size * 1.06), color, textAlign: 'center' }}>{word}</Text>;
}

function MicBanner() {
  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: 72, zIndex: 50, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' })]}>
      <Text style={brand(40, C.dark)}>🎤 MICROFONE FORA · reconectando… o tempo está parado</Text>
    </View>
  );
}

/** O que o jogo está entendendo da fala: as 2 últimas palavras, num quadro fixo (só troca o texto, sem animação). */
function Words({ text }: { text: string }) {
  return (
    <View style={[abs, web({ left: 25, top: 652, width: 280, height: 58, borderRadius: 16, backgroundColor: C.panel, borderWidth: 2, borderColor: 'rgba(177,138,255,0.4)', justifyContent: 'center', paddingHorizontal: 14 })]}>
      <Text style={{ fontFamily: F.heavy, fontSize: 12, letterSpacing: 2, color: C.muted }}>🎤 OUVINDO</Text>
      <Text numberOfLines={1} style={brand(26)}>{text || '…'}</Text>
    </View>
  );
}

function Header({ view, code, receivedAt }: { view: TvView; code: string; receivedAt: number }) {
  const revealed = view.answer !== null;
  const heard = view.heardAnswer;
  const winner = view.result?.winnerName;
  const timer = useClueClock(view, receivedAt);
  const inClue = view.phase === 'clue';
  const fx = view.result?.effectCard ?? null;
  const effect = revealed ? (view.result?.effectText ?? '') : '';
  const bad = fx?.tone === 'bad';

  // Tique-taque bem baixinho nos últimos 5 segundos.
  const danger = inClue && view.timerRunning && timer.level === 'danger';
  useEffect(() => { if (danger) play('tique'); }, [danger, timer.secondsLeft]);

  let body;
  if (view.screen === 'effect' && revealed) {
    body = (
      <>
        <BigWord word={view.answer!} color={C.green} max={56} />
        <Text numberOfLines={1} style={{ fontFamily: F.heavy, fontSize: 40, lineHeight: 46, color: bad ? C.red : C.yellow }}>{effect}</Text>
      </>
    );
  } else if (view.screen === 'answer' && revealed) {
    body = (
      <>
        <View key={`ans-${view.cardIndex}-${winner}`} style={web({ alignItems: 'center', animationName: 'pistache-pop', animationDuration: '450ms', animationFillMode: 'both' })}>
          <BigWord word={view.answer!} color={C.green} />
        </View>
        <Text numberOfLines={1} style={{ fontFamily: F.heavy, fontSize: 32, lineHeight: 38, color: C.ink }}>{view.corrected ? <Text style={{ color: C.orange }}>Corrigido: </Text> : null}{winner} acertou na dica {view.clue}!  <Text style={{ color: C.yellow }}>+{view.result?.gained ?? 0}</Text></Text>
      </>
    );
  } else if (view.phase === 'noWinner' && revealed) {
    body = (
      <>
        <BigWord word={view.answer!} color={C.green} />
        <Text numberOfLines={1} style={{ fontFamily: F.heavy, fontSize: 30, lineHeight: 36, color: C.ink }}>Ninguém acertou. Quem chegou mais perto? <Text style={{ color: C.yellow }}>Diga o nome (+5)</Text></Text>
      </>
    );
  } else if (heard) {
    body = (
      <>
        <BigWord word={heard} color={C.green} />
        <Text numberOfLines={1} style={{ fontFamily: F.heavy, fontSize: 32, lineHeight: 38, color: C.yellow }}>Quem acertou? Diga seu nome</Text>
      </>
    );
  } else {
    body = (
      <View key={`clue-${view.cardIndex}-${view.clue}`} style={web({ animationName: 'pistache-in', animationDuration: '380ms', animationFillMode: 'both' })}>
        <Text numberOfLines={2} style={{ fontFamily: F.heavy, fontSize: 44, lineHeight: 52, textAlign: 'center', color: C.ink }}>{view.clueText ?? ''}</Text>
      </View>
    );
  }

  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: FLOOR_TOP, paddingHorizontal: 32, paddingVertical: 20, gap: 12, backgroundImage: `linear-gradient(180deg, ${C.bg} 0%, ${C.bgTop} 100%)` })]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text style={brand(40)}>{revealed ? `Carta ${view.cardIndex + 1}` : `Dica ${view.clue}`}<Text style={brand(28, C.muted)}>{revealed ? '' : ` / ${MAX_CLUES}`}</Text></Text>
          <View style={{ paddingHorizontal: 18, paddingVertical: 6, borderRadius: 999, borderWidth: 3, borderColor: C.lavender }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.lavender }}>{view.category}</Text>
          </View>
          {view.paused && !heard ? <Text style={{ fontFamily: F.heavy, fontSize: 20, letterSpacing: 3, color: C.orange }}>PAUSADO</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {inClue ? (
            <View style={web({ minWidth: 92, height: 52, paddingHorizontal: 14, borderRadius: 999, borderWidth: 4, borderColor: TIMER_COLOR[timer.level], alignItems: 'center', justifyContent: 'center', ...(danger ? { animationName: 'pistache-pulse', animationDuration: '1s', animationIterationCount: 'infinite' } : {}) })}>
              <Text style={brand(34, TIMER_COLOR[timer.level])}>{timer.secondsLeft}s</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 22, paddingVertical: 6, borderRadius: 999, backgroundColor: revealed ? C.green : C.yellow }}>
            <Text style={brand(40, C.dark)}>{revealed ? `+${view.result?.gained ?? 0}` : view.points}</Text>
            <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.dark }}>{revealed ? 'pontos' : heard ? 'acertou?' : 'pontos em jogo'}</Text>
          </View>
          <RoomBadge code={code} />
        </View>
      </View>
      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, borderRadius: 28, backgroundColor: C.panel, borderWidth: 3, borderColor: 'rgba(177,138,255,0.4)', overflow: 'hidden' }}>
        {body}
        {inClue ? (
          <View style={{ position: 'absolute', left: 0, bottom: 0, width: `${timer.fraction * 100}%`, height: 10, backgroundColor: TIMER_COLOR[timer.level] }} />
        ) : null}
      </View>
    </View>
  );
}

// ---------- Pop-up de sorte e azar ----------

function FxPopup({ fx, name }: { fx: NonNullable<TvView['result']>['effectCard'] & object; name: string }) {
  const bad = fx.tone === 'bad';
  const color = bad ? C.red : C.green;
  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, zIndex: 40, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', backgroundColor: bad ? 'rgba(60,8,20,0.55)' : 'rgba(10,40,30,0.5)', animationName: 'pistache-fade', animationDuration: '300ms', animationFillMode: 'both' })]}>
      <View style={web({ width: 860, alignItems: 'center', gap: 6, paddingVertical: 30, paddingHorizontal: 40, borderRadius: 40, backgroundColor: C.panel, borderWidth: 8, borderColor: color, boxShadow: `0 0 80px ${bad ? 'rgba(255,119,123,0.55)' : 'rgba(50,227,151,0.55)'}`, animationName: bad ? 'pistache-pop-shake' : 'pistache-pop', animationDuration: bad ? '700ms' : '520ms', animationFillMode: 'both' })}>
        <Text style={brand(120, color)}>{fx.icon}</Text>
        <Text style={[brand(96, color), { lineHeight: 100 }]}>{fx.title}</Text>
        {fx.value ? <Text style={[brand(120, C.yellow), { lineHeight: 124 }]}>{fx.value}</Text> : null}
        <Text numberOfLines={2} style={{ fontFamily: F.heavy, fontSize: 40, lineHeight: 48, color: C.ink, textAlign: 'center' }}>{fx.text}</Text>
        <Text style={{ fontFamily: F.heavy, fontSize: 22, letterSpacing: 4, color: C.muted }}>{name.toUpperCase()}</Text>
      </View>
    </View>
  );
}

// ---------- Confete (só CSS) ----------

const CONFETTI_COLORS = [C.yellow, C.green, C.lavender, C.orange, C.red, C.lime, '#5cc8ff', '#ff9fc4'];

function Confetti({ count, loop = false }: { count: number; loop?: boolean }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n: number) => { const x = Math.sin(i * 97.13 + n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    return { left: Math.round(r(1) * TV_WIDTH), delay: Math.round(r(2) * 900), dur: 1800 + Math.round(r(3) * 1400), size: 10 + Math.round(r(4) * 10), color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], round: r(5) > 0.6 };
  }), [count]);
  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, overflow: 'hidden', pointerEvents: 'none', zIndex: 30 })]}>
      {pieces.map((p, i) => (
        <View key={i} style={[abs, web({ left: p.left, top: -30, width: p.size, height: p.size * 1.5, borderRadius: p.round ? p.size : 2, backgroundColor: p.color, animationName: 'pistache-confetti', animationDuration: `${p.dur}ms`, animationDelay: `${p.delay}ms`, animationFillMode: 'both', animationIterationCount: loop ? 'infinite' : 1, animationTimingFunction: 'ease-in' })]} />
      ))}
    </View>
  );
}

// ---------- Botão de som ----------

function SoundPill() {
  const st = useSyncExternalStore(subscribeSound, soundState, soundState);
  if (st === 'off') {
    return (
      <Text
        onPress={() => void enableSound()}
        accessibilityRole="button"
        style={[abs, web({ left: 0, right: 0, bottom: 0, zIndex: 60, paddingVertical: 14, textAlign: 'center', backgroundColor: C.yellow, color: C.dark, fontFamily: F.brand, fontSize: 30, cursor: 'pointer' })]}
      >
        🔈 Clique na tela (ou aperte OK no controle) para ativar o som
      </Text>
    );
  }
  const label = st === 'muted' ? '🔇 Som desligado' : '🔊 Som ligado';
  const onPress = () => toggleMute();
  return (
    <Text
      onPress={onPress}
      accessibilityRole="button"
      style={[abs, web({ right: 18, bottom: 14, zIndex: 60, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(33,23,71,0.85)', color: C.muted, fontFamily: F.heavy, fontSize: 18, cursor: 'pointer', opacity: st === 'on' ? 0.55 : 1 })]}
    >
      {label}
    </Text>
  );
}

function PlayScene({ view, code, receivedAt, words }: { view: TvView; code: string; receivedAt: number; words: string }) {
  return (
    <>
      <Floor />
      <Orb view={view} />
      <Track view={view} />
      <Words text={words} />
      <Header view={view} code={code} receivedAt={receivedAt} />
      {view.screen === 'effect' && view.result?.effectCard ? <FxPopup key={`fx-${view.cardIndex}`} fx={view.result.effectCard} name={view.result.winnerName} /> : null}
      {view.screen === 'answer' ? <Confetti key={`cf-${view.cardIndex}`} count={36} /> : null}
      {view.micOut ? <MicBanner /> : null}
    </>
  );
}

// ---------- Vencedor ----------

function FinalScene({ view, code }: { view: TvView; code: string }) {
  const winners = view.players.filter((p) => view.winnerIds.includes(p.id));
  const sorted = [...view.players].sort((a, b) => b.points - a.points);
  return (
    <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundImage: 'radial-gradient(circle at 50% 40%, #2b1f5c 0%, #130d2f 70%)' })]}>
      <View style={[abs, { right: 32, top: 20 }]}><RoomBadge code={code} /></View>
      <Confetti count={70} loop />
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
  const [receivedAt, setReceivedAt] = useState(0);
  const [words, setWords] = useState('');
  const [status, setStatus] = useState<RoomStatus>('connecting');
  useKeepAwake();

  useEffect(() => {
    const room = joinRoom(code, {
      onState: (v) => { setView(v); setReceivedAt(Date.now()); },
      onWords: setWords,
      onStatus: (s) => {
        setStatus(s);
        if (s === 'ready') room.sendHello();
      },
    });
    // Se ninguém responder, pede o estado de novo (celular que entrou depois).
    const id = setInterval(() => room.sendHello(), 5000);
    return () => { clearInterval(id); room.leave(); };
  }, [code]);

  // O som já tenta ligar ao abrir; se o navegador pedir um toque, qualquer clique, toque ou tecla liga.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    void enableSound();
    const unlock = () => { if (soundState() === 'off') void enableSound(); };
    const evs = ['pointerdown', 'keydown', 'touchstart', 'click'];
    evs.forEach((e) => window.addEventListener(e, unlock));
    return () => evs.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  // Sons de ação e de transição (só tocam se a TV tiver o som ativado).
  const prevView = useRef<TvView | null>(null);
  useEffect(() => {
    const p = prevView.current;
    prevView.current = view;
    if (!view || !p) return;
    const fx = view.result?.effectCard;
    if (view.screen === 'final' && p.screen !== 'final') play('vitoria');
    else if (view.screen === 'effect' && p.screen !== 'effect' && fx) {
      play('pop');
      setTimeout(() => play(fx.tone === 'bad' ? 'azar' : 'sorte'), 180);
    } else if (view.screen === 'answer' && p.screen !== 'answer') play('acerto');
    else if (view.phase === 'clue' && view.cardIndex !== p.cardIndex) play('passa');
    else if (view.phase === 'clue' && view.cardIndex === p.cardIndex && view.clue > p.clue) play('dica');
  }, [view]);

  const screen = view?.screen ?? 'round';
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, bg]}>
      <View style={web({ width: TV_WIDTH, height: TV_HEIGHT, transform: [{ scale }], overflow: 'hidden' })}>
        {!view ? <Waiting code={code} status={status} />
          : screen === 'final' ? <FinalScene view={view} code={code} />
          : <PlayScene view={view} code={code} receivedAt={receivedAt} words={words} />}
        {/* Bordas que se desfazem no fundo: em telas de outra proporção o quadro não termina em corte seco. */}
        <View style={[abs, web({ left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, pointerEvents: 'none', boxShadow: `inset 0 0 70px 28px ${C.bg}` })]} />
      </View>
      {Platform.OS === 'web' ? <SoundPill /> : null}
      {Platform.OS === 'web'
        ? createElement('style', null, '@keyframes pistache-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}'
          + '@keyframes pistache-shake{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-10px) rotate(-6deg)}75%{transform:translateX(10px) rotate(6deg)}}'
          + '@keyframes pistache-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}'
          + '@keyframes pistache-pop-shake{0%{transform:scale(.6) rotate(0);opacity:0}40%{transform:scale(1.1) rotate(-3deg);opacity:1}55%{transform:scale(1) rotate(3deg)}70%{transform:rotate(-2deg)}85%{transform:rotate(2deg)}100%{transform:scale(1) rotate(0)}}'
          + '@keyframes pistache-fade{from{opacity:0}to{opacity:1}}'
          + '@keyframes pistache-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}'
          + '@keyframes pistache-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}'
          + '@keyframes pistache-drop{0%{transform:scale(1.35)}100%{transform:scale(1)}}'
          + '@keyframes pistache-confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(780px) rotate(540deg);opacity:.9}}')
        : null}
      {Platform.OS === 'web'
        ? createElement('video', { src: NOSLEEP_VIDEO, autoPlay: true, loop: true, muted: true, playsInline: true, 'aria-hidden': true, style: { position: 'absolute', width: 2, height: 2, opacity: 0.01, pointerEvents: 'none' } })
        : null}
    </View>
  );
}
