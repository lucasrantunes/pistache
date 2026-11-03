// Protótipo de voz (Fase 2): escuta o microfone, mostra o que a Deepgram entendeu e detecta
// a palavra mágica e a resposta. Tela provisória, só para testar.
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import pack from '@/content/packs/teste.json';
import { openDeepgram } from '@/voice/deepgram';
import type { DeepgramConnection } from '@/voice/deepgram';
import { startMic } from '@/voice/mic';
import type { Mic } from '@/voice/mic';
import { detectCommand, matchesAnswer } from '@/voice/text';
import { VoiceActivityGate, splitFrames } from '@/voice/voice-activity';

type Status = 'parado' | 'conectando' | 'ouvindo';
type Line = { id: number; text: string; note: string };

const KEY = process.env.EXPO_PUBLIC_DEEPGRAM_KEY ?? '';
const cards = pack.cartas;

export default function Voz() {
  const [status, setStatus] = useState<Status>('parado');
  const [error, setError] = useState('');
  const [interim, setInterim] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [paused, setPaused] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [rate, setRate] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const mic = useRef<Mic | null>(null);
  const dg = useRef<DeepgramConnection | null>(null);
  const pausedRef = useRef(false);
  const cardRef = useRef(0);
  const nextId = useRef(1);
  const sentSamples = useRef(0);
  const capturedSamples = useRef(0);
  const gate = useRef(new VoiceActivityGate());
  const gateOn = useRef(true);
  const [useGate, setUseGate] = useState(true);
  const [captured, setCaptured] = useState(0);
  cardRef.current = cardIndex;

  const addLine = (text: string, note: string) =>
    setLines((l) => [{ id: nextId.current++, text, note }, ...l].slice(0, 30));

  const onTranscript = (text: string, isFinal: boolean) => {
    const card = cards[cardRef.current];
    const command = detectCommand(text, pausedRef.current);
    const hit = matchesAnswer(text, card.resposta, card.aliases);
    if (!isFinal) {
      setInterim(text + (command ? `  [${command}?]` : '') + (hit ? '  [ACERTO?]' : ''));
      return;
    }
    setInterim('');
    let note = '';
    if (command === 'pause') { pausedRef.current = true; setPaused(true); note = 'PAUSA'; }
    else if (command === 'resume') { pausedRef.current = false; setPaused(false); note = 'RETOMA'; }
    else if (command === 'advance') note = 'AVANÇA DICA';
    if (hit) note += (note ? ' + ' : '') + 'ACERTOU';
    addLine(text, note);
  };

  const start = async () => {
    setError('');
    if (!KEY) { setError('Falta a chave: EXPO_PUBLIC_DEEPGRAM_KEY no arquivo .env.local'); return; }
    setStatus('conectando');
    sentSamples.current = 0;
    capturedSamples.current = 0;
    gate.current = new VoiceActivityGate();
    setSeconds(0);
    setCaptured(0);
    let connection: DeepgramConnection | null = null;
    try {
      mic.current = await startMic({
        onAudio: (pcm, sampleRate) => {
          if (!connection) {
            setRate(sampleRate);
            connection = openDeepgram(KEY, sampleRate, {
              onOpen: () => setStatus('ouvindo'),
              onTranscript,
              onClose: (r) => { setError(`Conexão ${r}`); void stop(); },
              onError: (m) => setError(m),
            });
            dg.current = connection;
          }
          capturedSamples.current += pcm.byteLength / 2;
          setCaptured(Math.round(capturedSamples.current / sampleRate));
          for (const { frame, rms } of splitFrames(pcm, sampleRate)) {
            if (!gateOn.current) {
              sentSamples.current += frame.byteLength / 2;
              connection.sendAudio(frame);
              continue;
            }
            const r = gate.current.push(frame, rms);
            for (const f of r.send) {
              sentSamples.current += f.byteLength / 2;
              connection.sendAudio(f);
            }
            if (r.finalize) connection.finalize();
          }
          setSeconds(Math.round(sentSamples.current / sampleRate));
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('parado');
    }
  };

  const stop = async () => {
    dg.current?.close();
    dg.current = null;
    const m = mic.current;
    mic.current = null;
    try { await m?.stop(); } catch { /* já parado */ }
    setStatus('parado');
  };

  const card = cards[cardIndex];
  const Btn = ({ label, onPress, color }: { label: string; onPress: () => void; color: string }) => (
    <Pressable onPress={onPress} style={{ backgroundColor: color, padding: 16, borderRadius: 14, marginVertical: 5 }}>
      <Text style={{ color: '#130d2f', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
  const T = ({ children, c = '#f4efff', s = 16, b = false }: { children: React.ReactNode; c?: string; s?: number; b?: boolean }) => (
    <Text style={{ color: c, fontSize: s, fontWeight: b ? '800' : '500', marginVertical: 3 }}>{children}</Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#130d2f' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Link href="/" style={{ color: '#b79cff', fontSize: 16 }}>← voltar</Link>
        <T s={26} c="#ffca4b" b>Teste de voz</T>
        <T c="#b8abdc">Resposta da carta (diga em voz alta): {card.resposta}</T>
        <T c="#b8abdc">Diga "Pistache" (avança), "Pistache, pausa" e depois "Pistache" (retoma).</T>
        <Btn label={`Carta: ${card.resposta} (tocar para trocar)`} color="#372762" onPress={() => setCardIndex((cardIndex + 1) % cards.length)} />
        {status === 'parado'
          ? <Btn label="Começar a ouvir" color="#39e58c" onPress={start} />
          : <Btn label="Parar" color="#ff777b" onPress={stop} />}
        <T b c={status === 'ouvindo' ? '#39e58c' : '#b8abdc'}>Estado: {status}{paused ? ' · PAUSADO' : ''}</T>
        <T c="#b8abdc">Taxa do microfone: {rate || '—'} Hz · captado: {captured}s · enviado: {seconds}s{captured > 0 ? ` (${Math.round((seconds / captured) * 100)}%)` : ''}</T>
        <Btn label={useGate ? 'Filtro de silêncio: LIGADO (tocar para desligar)' : 'Filtro de silêncio: DESLIGADO (tocar para ligar)'} color="#372762" onPress={() => { gateOn.current = !useGate; setUseGate(!useGate); }} />
        {error ? <T c="#ff777b" b>{error}</T> : null}
        <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: '#211747' }}>
          <T c="#b8abdc" s={13}>OUVINDO AGORA</T>
          <T s={20}>{interim || '…'}</T>
        </View>
        <T b>Frases entendidas</T>
        {lines.map((l) => (
          <View key={l.id} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#493a78' }}>
            <T>{l.text}</T>
            {l.note ? <T c="#ffca4b" b s={14}>{l.note}</T> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
