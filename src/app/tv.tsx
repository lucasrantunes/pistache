// Página da TV (só visualização). Abra no navegador da TV; ela mostra um código de 4 letras.
// Layout provisório no quadro 1280 x 720 do sketch, escalado para a tela; a arte final vem na Fase 5.
import { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { MAX_CLUES } from '@/game/board';
import { newRoomCode } from '@/realtime/code';
import { joinRoom } from '@/realtime/room';
import type { RoomStatus } from '@/realtime/room';
import type { TvPlayer, TvView } from '@/realtime/view';
import { TV_HEIGHT, TV_WIDTH, trackSpots } from '@/scene/track';
import { C, F, pointsColor } from '@/ui/theme';

const CODE_KEY = 'pistache:tv-code';
const SPOTS = trackSpots();
const BAD = [3, 9, 17, 23];

function loadCode(): string {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(CODE_KEY) : null;
    if (saved && /^[A-Z]{4}$/.test(saved)) return saved;
  } catch { /* sem armazenamento */ }
  const code = newRoomCode();
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(CODE_KEY, code); } catch { /* ok */ }
  return code;
}

const glass = { backgroundColor: 'rgba(150,120,240,0.15)', borderColor: C.line, borderWidth: 1 } as const;
const bg = { backgroundColor: '#160f3e', backgroundImage: 'linear-gradient(180deg,#1f1554 0%,#160f3e 55%,#0f0a2b 100%)' } as object;

function tileInfo(i: number) {
  if (i === 0) return { label: 'SAÍDA', color: C.green, size: 58, small: true };
  if (i === 25) return { label: 'FIM', color: C.yellow, size: 68, small: false };
  if (BAD.includes(i)) return { label: '!', color: C.red, size: 58, small: false };
  if (i === 6) return { label: 'x2', color: C.yellow, size: 58, small: false };
  if (i === 13) return { label: '$', color: C.orange, size: 58, small: false };
  if (i === 20) return { label: '»', color: C.lime, size: 58, small: false };
  return { label: '', color: C.lavender, size: 58, small: false };
}

function Track({ view }: { view: TvView }) {
  const bySquare = new Map<number, TvPlayer[]>();
  view.players.forEach((p) => bySquare.set(p.square, [...(bySquare.get(p.square) ?? []), p]));
  return (
    <>
      {SPOTS.map((s, i) => {
        const t = tileInfo(i);
        const special = t.label !== '' && i !== 0;
        return (
          <View key={i} style={{ position: 'absolute', left: s.x - t.size / 2, top: s.y - t.size / 2, width: t.size, height: t.size, borderRadius: t.size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: special || i === 0 ? t.color : 'rgba(196,176,255,0.45)', backgroundColor: special || i === 0 ? t.color + '33' : 'rgba(150,120,240,0.18)' }}>
            {t.label ? <Text style={{ fontFamily: F.brand, fontSize: t.small ? 15 : 26, color: t.color }}>{t.label}</Text> : null}
          </View>
        );
      })}
      {view.players.map((p) => {
        const s = SPOTS[p.square];
        const mates = bySquare.get(p.square) ?? [p];
        const shift = (mates.indexOf(p) - (mates.length - 1) / 2) * 40;
        const lead = p.id === view.leaderId;
        return (
          <View key={p.id} style={{ position: 'absolute', left: s.x - 48 + shift, top: s.y + 14 - 104, width: 96, height: 104, alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
            {lead ? <Text style={{ fontSize: 24, color: C.yellow, marginBottom: -6 }}>♛</Text> : null}
            <View style={{ minWidth: 76, paddingHorizontal: 10, paddingTop: 3, paddingBottom: 4, borderRadius: 14, backgroundColor: p.color, alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ fontFamily: F.brand, fontSize: 21, color: C.dark }}>{p.name}</Text>
              <Text style={{ fontFamily: F.mono, fontWeight: '700', fontSize: 14, color: C.dark }}>{p.points} pts</Text>
            </View>
            <View style={{ width: lead ? 60 : 52, height: lead ? 60 : 52, borderRadius: 30, backgroundColor: p.color, borderWidth: 2.5, borderColor: lead ? C.yellow : '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.brand, fontSize: 26, color: C.dark }}>{p.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

function Arena({ view }: { view: TvView }) {
  const revealed = view.answer !== null;
  const chip = (text: string, pos: object, key: string) => (
    <View key={key} style={[{ position: 'absolute', paddingHorizontal: 13, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(183,156,255,0.5)', backgroundColor: 'rgba(183,156,255,0.14)', opacity: revealed ? 0.3 : 1 }, pos]}>
      <Text style={{ fontFamily: F.ui, fontSize: 18, color: C.lavender }}>{text}</Text>
    </View>
  );
  const positions = [
    { left: '2.35%', top: '18.24%' }, { right: '2.94%', top: '44.12%' }, { left: '11.76%', bottom: '24.71%' },
    { left: '60%', top: '32.94%' }, { left: '30%', top: '26.47%' },
  ];
  return (
    <View style={{ position: 'absolute', left: 55, top: 300, width: 340, height: 340 }}>
      {[0, 12.94, 25.88].map((inset, i) => (
        <View key={i} style={{ position: 'absolute', left: `${inset}%`, right: `${inset}%`, top: `${inset}%`, bottom: `${inset}%`, borderRadius: 999, borderWidth: 1, borderColor: `rgba(196,176,255,${0.12 + i * 0.05})` }} />
      ))}
      {revealed ? (
        <View style={{ position: 'absolute', left: 104, top: 104, width: 132, height: 132, borderRadius: 66, borderWidth: 1, borderColor: 'rgba(57,229,140,0.65)', backgroundColor: C.greenFill, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.green }}>✓</Text>
          <Text numberOfLines={3} style={{ fontFamily: F.heavy, fontSize: 19, color: C.ink, textAlign: 'center', lineHeight: 21 }}>{view.answer}</Text>
        </View>
      ) : (
        <View style={{ position: 'absolute', left: '35.88%', right: '35.88%', top: '35.88%', bottom: '35.88%', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(183,156,255,0.4)', backgroundColor: 'rgba(183,156,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.heavy, fontSize: 40, color: C.lavender }}>?</Text>
          <Text style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 3, color: C.muted }}>{view.category.toUpperCase()}</Text>
        </View>
      )}
      {view.guesses.slice(-5).map((g, i) => chip(g, positions[i], `${i}-${g}`))}
    </View>
  );
}

function CluePanel({ view }: { view: TvView }) {
  const revealed = view.answer !== null;
  const winner = view.result?.winnerName;
  const headline = view.phase === 'finished' ? 'Fim de jogo!'
    : view.phase === 'noWinner' ? `Ninguém acertou. Era: ${view.answer}`
    : revealed ? (winner ? `${winner} acertou na dica ${view.clue}!` : `Era: ${view.answer}`)
    : view.clueText ?? '';
  const stakeLabel = revealed ? 'GANHOU' : view.heard ? 'ACERTOU?' : 'VALE';
  const stakeColor = revealed ? C.green : C.yellow;
  const stakeValue = revealed ? `+${view.result?.gained ?? 0}` : String(view.points);
  return (
    <View style={[{ position: 'absolute', left: 36, top: 60, width: 1208, height: 150, borderRadius: 26, paddingHorizontal: 26, paddingVertical: 14, flexDirection: 'row', gap: 24 }, glass]}>
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Text style={{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(183,156,255,0.2)', color: '#d9ccff', fontFamily: F.mono, fontWeight: '700', fontSize: 16, letterSpacing: 1 }}>
            {revealed ? `CARTA ${view.cardIndex + 1}/${view.total}` : `DICA ${view.clue}/${MAX_CLUES}`}
          </Text>
        </View>
        <Text numberOfLines={2} style={{ fontFamily: F.heavy, fontSize: 40, lineHeight: 44, color: revealed ? C.green : C.ink }}>{headline}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: MAX_CLUES }, (_, i) => i + 1).map((v) => (
            <View key={v} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: !revealed && v <= view.points ? pointsColor(v) : 'rgba(196,176,255,0.14)' }} />
          ))}
        </View>
      </View>
      <View style={{ width: 210, paddingLeft: 24, borderLeftWidth: 1, borderLeftColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.mono, fontWeight: '700', fontSize: 15, letterSpacing: 4, color: revealed ? C.green : '#ffe08a' }}>{stakeLabel}</Text>
        <Text style={{ fontFamily: F.brand, fontSize: 92, lineHeight: 96, color: stakeColor }}>{stakeValue}</Text>
        <Text style={{ fontFamily: F.ui, fontSize: 15, color: C.muted }}>pontos</Text>
      </View>
    </View>
  );
}

function Scene({ view, code }: { view: TvView; code: string }) {
  const winners = view.players.filter((p) => view.winnerIds.includes(p.id)).map((p) => p.name).join(' e ');
  return (
    <>
      <View style={{ position: 'absolute', left: 36, top: 12, width: 1208, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: F.brand, fontSize: 32, color: C.yellow }}>Pistache</Text>
        {view.paused ? <Text style={{ fontFamily: F.mono, fontWeight: '700', fontSize: 18, letterSpacing: 3, color: C.orange }}>PAUSADO</Text> : null}
        <Text style={{ fontFamily: F.mono, fontWeight: '700', fontSize: 16, letterSpacing: 3, color: C.muted }}>SALA {code}</Text>
      </View>
      <CluePanel view={view} />
      <Arena view={view} />
      <Track view={view} />
      {view.result?.effectText ? (
        <View style={[{ position: 'absolute', left: 430, top: 222, paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 }, glass]}>
          <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.yellow }}>{view.result.effectText}</Text>
        </View>
      ) : null}
      {view.phase === 'finished' ? (
        <View style={{ position: 'absolute', left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, backgroundColor: 'rgba(15,10,43,0.82)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 6, color: C.muted }}>VENCEDOR</Text>
          <Text style={{ fontFamily: F.brand, fontSize: 140, color: C.yellow }}>{winners || 'Empate'}</Text>
        </View>
      ) : null}
    </>
  );
}

function Waiting({ code, status }: { code: string; status: RoomStatus }) {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: TV_WIDTH, height: TV_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Text style={{ fontFamily: F.brand, fontSize: 56, color: C.yellow }}>Pistache</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 6, color: C.muted, marginTop: 20 }}>CÓDIGO DA SALA</Text>
      <Text style={{ fontFamily: F.brand, fontSize: 190, letterSpacing: 24, color: C.ink }}>{code}</Text>
      <Text style={{ fontFamily: F.heavy, fontSize: 28, color: C.lavender, textAlign: 'center' }}>No celular: toque em “Ligar na TV” e digite este código.</Text>
      <Text style={{ fontFamily: F.ui, fontSize: 18, color: status === 'error' ? C.red : C.muted, marginTop: 14 }}>
        {status === 'ready' ? 'Aguardando o celular…' : status === 'error' ? 'Sem conexão. Tentando de novo…' : 'Conectando…'}
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

  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, bg]}>
      <View style={{ width: TV_WIDTH, height: TV_HEIGHT, transform: [{ scale }] }}>
        {view ? <Scene view={view} code={code} /> : <Waiting code={code} status={status} />}
      </View>
    </View>
  );
}
