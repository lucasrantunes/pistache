// Teste de voz (Fase 2): compara a Deepgram com o reconhecimento nativo do aparelho.
// Mostra o texto entendido, a tecnologia em uso e um placar (acertos, falsos avanços, atraso).
// Tela provisória, só para testar.
import * as Device from 'expo-device';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import pack from '@/content/packs/teste.json';
import { createDeepgramEngine } from '@/voice/deepgram-engine';
import type { EngineHandlers, EngineId, EngineStats, EngineStatus, InfoRow, VoiceEngine } from '@/voice/engine';
import { matchProbe } from '@/voice/metrics';
import type { ProbeResult } from '@/voice/metrics';
import { createNativeEngine } from '@/voice/native-engine';
import { countMagicWords, detectCommand, matchesAnswer } from '@/voice/text';

type Tone = 'normal' | 'ok' | 'warn' | 'bad';
type LogLine = { id: number; t: number; text: string; tone: Tone };

const cards = pack.cartas;
const TONE_COLOR: Record<Tone, string> = { normal: '#f4efff', ok: '#39e58c', warn: '#ffca4b', bad: '#ff777b' };
const STATUS_LABEL: Record<EngineStatus, string> = {
  off: 'parado',
  connecting: 'conectando',
  on: 'ouvindo',
  restarting: 'reiniciando a escuta',
  error: 'erro',
};

function Btn({ label, onPress, color = '#372762', dark = false }: { label: string; onPress: () => void; color?: string; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: color, padding: 14, borderRadius: 14, marginVertical: 4 }}>
      <Text style={{ color: dark ? '#130d2f' : '#f4efff', fontSize: 17, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

function T({ children, c = '#f4efff', s = 16, b = false }: { children: React.ReactNode; c?: string; s?: number; b?: boolean }) {
  return <Text style={{ color: c, fontSize: s, fontWeight: b ? '800' : '500', marginVertical: 3 }}>{children}</Text>;
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#211747' }}>
      <T c="#b8abdc" s={13}>{title}</T>
      {children}
    </View>
  );
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

function probeText(r: ProbeResult): string {
  const lag = r.avgMs === null ? '—' : `${r.avgMs} ms (máx ${r.maxMs} ms)`;
  return `acertos ${r.hits}/${r.attempts} · falsos avanços ${r.falsePositives} · atraso médio ${lag}`;
}

export default function Voz() {
  const [engineId, setEngineId] = useState<EngineId>('native');
  const [onDevice, setOnDevice] = useState(false);
  const [hints, setHints] = useState(true);
  const [gateOn, setGateOn] = useState(true);
  const [status, setStatus] = useState<EngineStatus>('off');
  const [error, setError] = useState('');
  const [interim, setInterim] = useState('');
  const [log, setLog] = useState<LogLine[]>([]);
  const [paused, setPaused] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [rows, setRows] = useState<InfoRow[]>([]);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [, setTick] = useState(0);

  const engine = useRef<VoiceEngine | null>(null);
  const startedAt = useRef(0);
  const nextId = useRef(1);
  const cardRef = useRef(0);
  const pausedRef = useRef(false);
  const magicSeen = useRef(0);
  const answerSeen = useRef(false);
  const magicAttempts = useRef<number[]>([]);
  const magicDetections = useRef<number[]>([]);
  const answerAttempts = useRef<number[]>([]);
  const answerDetections = useRef<number[]>([]);
  cardRef.current = cardIndex;

  const refresh = () => setTick((n) => n + 1);

  const addLog = (text: string, tone: Tone = 'normal') =>
    setLog((l) => [{ id: nextId.current++, t: startedAt.current ? Date.now() - startedAt.current : 0, text, tone }, ...l].slice(0, 300));

  const handlers: EngineHandlers = {
    onStatus: (s) => setStatus(s),
    onError: (m) => {
      setError(m);
      addLog(m, 'bad');
    },
    onNote: (m) => addLog(m, 'warn'),
    onSession: () => {
      magicSeen.current = 0;
      answerSeen.current = false;
      setInterim('');
    },
    onText: (text, isFinal) => {
      const now = Date.now();
      const kind = isFinal ? 'final' : 'parcial';
      // Palavra mágica: conta cada aparição nova (o texto parcial repete o que já foi dito).
      const n = countMagicWords(text);
      if (n > magicSeen.current) {
        magicSeen.current = n;
        magicDetections.current.push(now);
        addLog(`PISTACHE detectado (${kind})`, 'ok');
        refresh();
      }
      const card = cards[cardRef.current];
      if (!answerSeen.current && matchesAnswer(text, card.resposta, card.aliases)) {
        answerSeen.current = true;
        answerDetections.current.push(now);
        addLog(`RESPOSTA detectada (${kind})`, 'ok');
        refresh();
      }
      if (!isFinal) {
        setInterim(text);
        return;
      }
      setInterim('');
      // Pausa e retoma só valem no texto final (como na Deepgram).
      const command = detectCommand(text, pausedRef.current);
      if (command === 'pause') {
        pausedRef.current = true;
        setPaused(true);
        addLog('comando PAUSA (final)', 'warn');
      } else if (command === 'resume') {
        pausedRef.current = false;
        setPaused(false);
        addLog('comando RETOMA (final)', 'warn');
      }
      addLog(`“${text}”`);
      magicSeen.current = 0;
      answerSeen.current = false;
    },
  };

  const hintWords = () => (hints ? ['Pistache', 'pausa', ...cards.map((c) => c.resposta)] : []);

  const makeEngine = (): VoiceEngine =>
    engineId === 'deepgram' ? createDeepgramEngine(handlers) : createNativeEngine(handlers, { onDevice, hints: hintWords() });

  // Tabela "Tecnologia em uso" já antes de começar (mostra, por exemplo, se o módulo nativo não está instalado).
  useEffect(() => {
    if (status !== 'off') return;
    let alive = true;
    const preview = engineId === 'deepgram' ? createDeepgramEngine(handlers) : createNativeEngine(handlers, { onDevice, hints: hintWords() });
    preview.setSilenceFilter?.(gateOn);
    void preview.describe().then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
    // handlers muda a cada render e não faz parte da escolha; só as opções importam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineId, onDevice, hints, gateOn, status]);

  useEffect(() => {
    if (status === 'off') return;
    const id = setInterval(() => {
      setStats(engine.current?.stats() ?? null);
      refresh();
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const start = async () => {
    setError('');
    pausedRef.current = false;
    setPaused(false);
    startedAt.current = Date.now();
    const e = makeEngine();
    e.setSilenceFilter?.(gateOn);
    engine.current = e;
    addLog(`Começou: ${engineId === 'deepgram' ? 'Deepgram' : `Nativo (${onDevice ? 'no aparelho' : 'padrão do sistema'}, dicas ${hints ? 'ligadas' : 'desligadas'})`}`, 'warn');
    try {
      await e.start();
      setRows(await e.describe());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      addLog(message, 'bad');
      setStatus('error');
    }
  };

  const stop = async () => {
    await engine.current?.stop();
    setStats(engine.current?.stats() ?? null);
    addLog('Parou', 'warn');
  };

  const mark = (list: React.RefObject<number[]>, label: string) => {
    list.current.push(Date.now());
    addLog(`Marcado: disse ${label}`, 'warn');
    refresh();
  };

  const resetScore = () => {
    magicAttempts.current = [];
    magicDetections.current = [];
    answerAttempts.current = [];
    answerDetections.current = [];
    setLog([]);
    refresh();
  };

  const active = status !== 'off' && status !== 'error';
  const magic = matchProbe(magicAttempts.current, magicDetections.current);
  const answer = matchProbe(answerAttempts.current, answerDetections.current);
  const elapsed = startedAt.current && active ? seconds(Date.now() - startedAt.current) : '—';
  const device = `${Device.modelName ?? 'aparelho'} · ${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''}`.trim();
  const card = cards[cardIndex];

  const share = () => {
    const lines = [
      `Teste de voz · ${device}`,
      `Motor: ${engineId}`,
      ...rows.map((r) => `${r.label}: ${r.value}`),
      `Palavra mágica: ${probeText(magic)}`,
      `Resposta (${card.resposta}): ${probeText(answer)}`,
      stats ? `Reinícios: ${stats.restarts} · vão médio ${stats.gapAvgMs ?? '—'} ms · vão máx ${stats.gapMaxMs ?? '—'} ms` : '',
      '--- registro ---',
      ...[...log].reverse().map((l) => `${seconds(l.t)}  ${l.text}`),
    ];
    void Share.share({ message: lines.filter(Boolean).join('\n') });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#130d2f' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Link href="/" style={{ color: '#b79cff', fontSize: 16 }}>← voltar</Link>
        <T s={26} c="#ffca4b" b>Teste de voz</T>
        <T c="#b8abdc" s={14}>{device}</T>

        <Box title="MOTOR (pare antes de trocar)">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Btn label={engineId === 'native' ? '● Nativo' : 'Nativo'} color={engineId === 'native' ? '#b18aff' : '#372762'} dark={engineId === 'native'} onPress={() => !active && setEngineId('native')} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn label={engineId === 'deepgram' ? '● Deepgram' : 'Deepgram'} color={engineId === 'deepgram' ? '#b18aff' : '#372762'} dark={engineId === 'deepgram'} onPress={() => !active && setEngineId('deepgram')} />
            </View>
          </View>
          {engineId === 'native' ? (
            <>
              <Btn label={onDevice ? 'Reconhecer: SÓ NO APARELHO (tocar para trocar)' : 'Reconhecer: padrão do sistema (tocar para trocar)'} onPress={() => !active && setOnDevice(!onDevice)} />
              <Btn label={hints ? 'Dicas de vocabulário: LIGADAS (tocar para trocar)' : 'Dicas de vocabulário: DESLIGADAS (tocar para trocar)'} onPress={() => !active && setHints(!hints)} />
              {Platform.OS === 'android' ? (
                <Btn label="Baixar modelo pt-BR (Android, para usar sem internet)" onPress={async () => addLog(await (makeEngine().downloadModel?.() ?? Promise.resolve('indisponível')), 'warn')} />
              ) : null}
            </>
          ) : (
            <Btn label={gateOn ? 'Filtro de silêncio: LIGADO (tocar para trocar)' : 'Filtro de silêncio: DESLIGADO (tocar para trocar)'} onPress={() => { const next = !gateOn; setGateOn(next); engine.current?.setSilenceFilter?.(next); }} />
          )}
        </Box>

        {active ? <Btn label="Parar" color="#ff777b" dark onPress={stop} /> : <Btn label="Começar a ouvir" color="#39e58c" dark onPress={start} />}
        <T b c={status === 'on' ? '#39e58c' : status === 'error' ? '#ff777b' : '#b8abdc'}>
          Estado: {STATUS_LABEL[status]}{paused ? ' · PAUSADO' : ''} · ligado há {elapsed}
        </T>
        {error ? <T c="#ff777b" b>{error}</T> : null}

        <Box title="TECNOLOGIA EM USO">
          {rows.map((r) => (
            <T key={r.label} s={14}><Text style={{ color: '#b8abdc' }}>{r.label}: </Text>{r.value}</T>
          ))}
          {stats ? (
            <>
              {engineId === 'native' ? (
                <T s={14}><Text style={{ color: '#b8abdc' }}>Reinícios da escuta: </Text>{stats.restarts} · vão médio {stats.gapAvgMs ?? '—'} ms · vão máx {stats.gapMaxMs ?? '—'} ms</T>
              ) : (
                <T s={14}><Text style={{ color: '#b8abdc' }}>Áudio: </Text>captado {stats.capturedSec}s · enviado {stats.sentSec}s</T>
              )}
            </>
          ) : null}
          <T s={12} c="#b8abdc">Pausa e retoma só são avaliadas no texto final.</T>
        </Box>

        <Box title="O QUE ESTÁ SENDO ENTENDIDO AGORA">
          <T s={20}>{interim || '…'}</T>
        </Box>

        <Box title="PLACAR DO TESTE (toque logo DEPOIS de falar)">
          <T b s={15}>Palavra mágica: {probeText(magic)}</T>
          <Btn label='Eu disse "PISTACHE" agora' color="#ffca4b" dark onPress={() => mark(magicAttempts, 'PISTACHE')} />
          <T b s={15}>Resposta ({card.resposta}): {probeText(answer)}</T>
          <Btn label={`Eu disse a RESPOSTA agora (${card.resposta})`} color="#b18aff" dark onPress={() => mark(answerAttempts, 'a resposta')} />
          <Btn label={`Trocar carta (${card.resposta})`} onPress={() => { setCardIndex((cardIndex + 1) % cards.length); answerSeen.current = false; }} />
          <Btn label="Zerar placar e registro" onPress={resetScore} />
        </Box>

        <Box title="REGISTRO">
          <Btn label="Compartilhar / copiar resultado" onPress={share} />
          {log.map((l) => (
            <T key={l.id} s={14} c={TONE_COLOR[l.tone]}>{seconds(l.t)}  {l.text}</T>
          ))}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
