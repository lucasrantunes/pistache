// Sessão de voz: microfone -> filtro de silêncio -> Deepgram, com reconexão automática.
import { useCallback, useEffect, useRef, useState } from 'react';

import { openDeepgram } from './deepgram';
import type { DeepgramAuth, DeepgramConnection } from './deepgram';
import { startMic } from './mic';
import type { Mic } from './mic';
import { fetchVoiceToken, hasVoiceServer } from './token';
import { VoiceActivityGate, splitFrames } from './voice-activity';

export type VoiceStatus = 'off' | 'connecting' | 'on' | 'error';

const DEV_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_KEY ?? '';
const RETRY_MS = 2000;
const RETRY_MAX_MS = 10000;

export function useVoiceSession(onText: (text: string, isFinal: boolean) => void) {
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

  useEffect(() => {
    onTextRef.current = onText;
  });

  const teardown = useCallback(async () => {
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
