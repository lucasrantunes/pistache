// Sessão de voz: microfone -> filtro de silêncio -> Deepgram, com reconexão automática.
import { useCallback, useEffect, useRef, useState } from 'react';

import { Platform } from 'react-native';

import { openDeepgram } from './deepgram';
import type { DeepgramAuth, DeepgramConnection } from './deepgram';
import type { VoiceEngine } from './engine';
import { startMic } from './mic';
import { createNativeEngine } from './native-engine';
import { SegmentAdapter } from './segments';
import type { Segment } from './segments';
import type { Mic } from './mic';
import { fetchVoiceToken, hasVoiceServer } from './token';
import { VoiceActivityGate, splitFrames } from './voice-activity';

export type VoiceStatus = 'off' | 'connecting' | 'on' | 'error';

const DEV_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_KEY ?? '';
const RETRY_MS = 2000;
const RETRY_MAX_MS = 10000;

/** 'native' = reconhecimento do próprio aparelho (experimento, só em desenvolvimento). */
export function useVoiceSession(onText: (text: string, isFinal: boolean) => void, engineId: 'deepgram' | 'native' = 'deepgram') {
  const [status, setStatus] = useState<VoiceStatus>('off');
  const [error, setError] = useState('');
  const onTextRef = useRef(onText);
  const mic = useRef<Mic | null>(null);
  const dg = useRef<DeepgramConnection | null>(null);
  const wanted = useRef(false);
  const busy = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const attempts = useRef(0);
  const beginRef = useRef<() => Promise<void>>(async () => {});
  const engineRef = useRef(engineId);
  const native = useRef<VoiceEngine | null>(null);
  const flush = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    onTextRef.current = onText;
    engineRef.current = engineId;
  });

  const teardown = useCallback(async () => {
    clearInterval(flush.current);
    flush.current = undefined;
    const n = native.current;
    native.current = null;
    if (n) {
      try {
        await n.stop();
      } catch {
        // já parado
      }
    }
    dg.current?.close();
    dg.current = null;
    const m = mic.current;
    mic.current = null;
    try {
      await m?.stop();
    } catch {
      // já parado
    }
  }, []);

  const fail = useCallback(
    async (message: string) => {
      setError(message);
      setStatus('error');
      busy.current = false;
      await teardown();
      if (wanted.current) {
        clearTimeout(retry.current);
        attempts.current += 1;
        retry.current = setTimeout(() => {
          if (wanted.current) void beginRef.current();
        }, Math.min(RETRY_MAX_MS, RETRY_MS * attempts.current));
      }
    },
    [teardown],
  );

  const begin = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setStatus('connecting');
    setError('');
    if (engineRef.current === 'native') {
      // Reconhecimento do aparelho: o adaptador entrega frases separadas, como a Deepgram.
      const adapter = new SegmentAdapter(Platform.OS === 'ios');
      const emit = (segments: Segment[]) => {
        for (const s of segments) onTextRef.current(s.text, s.isFinal);
      };
      let lastError = 'Falha na voz do aparelho.';
      try {
        const engine = createNativeEngine(
          {
            onStatus: (s) => {
              if (s === 'connecting') setStatus('connecting');
              else if (s === 'on' || s === 'restarting') {
                busy.current = false;
                attempts.current = 0;
                setStatus('on');
              } else if (s === 'error') void fail(lastError);
            },
            onText: (text, isFinal) => emit(adapter.push(text, isFinal, Date.now())),
            onError: (message) => {
              lastError = message;
            },
            onNote: () => {},
            onSession: () => emit(adapter.newSession()),
          },
          { onDevice: false, hints: ['Pistache', 'pausa'] },
        );
        native.current = engine;
        flush.current = setInterval(() => emit(adapter.flush(Date.now())), 250);
        await engine.start();
        if (!wanted.current) {
          busy.current = false;
          await teardown();
          setStatus('off');
        }
      } catch (e) {
        await fail(e instanceof Error ? e.message : String(e));
      }
      return;
    }
    let auth: DeepgramAuth;
    try {
      if (hasVoiceServer()) auth = { kind: 'bearer', value: await fetchVoiceToken() };
      else if (DEV_KEY) auth = { kind: 'key', value: DEV_KEY };
      else throw new Error('Voz não configurada (.env.local).');
    } catch (e) {
      await fail(e instanceof Error ? e.message : String(e));
      return;
    }
    const gate = new VoiceActivityGate();
    let conn: DeepgramConnection | null = null;
    try {
      const started = await startMic({
        onAudio: (pcm, sampleRate) => {
          if (!conn) {
            conn = openDeepgram(auth, sampleRate, {
              onOpen: () => {
                busy.current = false;
                attempts.current = 0;
                setStatus('on');
              },
              onTranscript: (t, f) => onTextRef.current(t, f),
              onClose: (r) => void fail(`Conexão ${r}`),
              onError: (m) => void fail(m),
            });
            dg.current = conn;
          }
          for (const { frame, rms } of splitFrames(pcm, sampleRate)) {
            const r = gate.push(frame, rms);
            for (const f of r.send) conn.sendAudio(f);
            if (r.finalize) conn.finalize();
          }
        },
      });
      mic.current = started;
      if (!wanted.current) {
        busy.current = false;
        await teardown();
        setStatus('off');
      }
    } catch (e) {
      await fail(e instanceof Error ? e.message : String(e));
    }
  }, [fail, teardown]);

  useEffect(() => {
    beginRef.current = begin;
  }, [begin]);

  const start = useCallback(() => {
    wanted.current = true;
    attempts.current = 0;
    void begin();
  }, [begin]);

  const stop = useCallback(async () => {
    wanted.current = false;
    clearTimeout(retry.current);
    busy.current = false;
    await teardown();
    setStatus('off');
  }, [teardown]);

  useEffect(() => () => {
    wanted.current = false;
    clearTimeout(retry.current);
    void teardown();
  }, [teardown]);

  return { status, error, start, stop };
}
