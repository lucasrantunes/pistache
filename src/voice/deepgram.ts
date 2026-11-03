// Conexão em tempo real com a Deepgram (Nova-3, português do Brasil).

export type DeepgramHandlers = {
  onOpen: () => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onClose: (reason: string) => void;
  onError: (message: string) => void;
};

export type DeepgramConnection = {
  sendAudio: (pcm: ArrayBuffer) => void;
  close: () => void;
};

const KEEP_ALIVE_MS = 4000;

export function openDeepgram(apiKey: string, sampleRate: number, handlers: DeepgramHandlers): DeepgramConnection {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'pt-BR',
    encoding: 'linear16',
    sample_rate: String(sampleRate),
    channels: '1',
    interim_results: 'true',
    endpointing: '10',
    smart_format: 'false',
  });
  const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params.toString()}`, ['token', apiKey]);
  socket.binaryType = 'arraybuffer';
  let lastSent = Date.now();
  let keepAlive: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  socket.onopen = () => {
    keepAlive = setInterval(() => {
      if (Date.now() - lastSent >= KEEP_ALIVE_MS && socket.readyState === 1) {
        socket.send(JSON.stringify({ type: 'KeepAlive' }));
        lastSent = Date.now();
      }
    }, 1000);
    handlers.onOpen();
  };
  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(String(event.data));
      const text = msg?.channel?.alternatives?.[0]?.transcript;
      if (typeof text === 'string' && text.trim()) handlers.onTranscript(text.trim(), msg.is_final === true);
    } catch {
      // mensagem que não é de transcrição
    }
  };
  socket.onerror = () => handlers.onError('Falha na conexão com a Deepgram.');
  socket.onclose = (event) => {
    if (keepAlive) clearInterval(keepAlive);
    if (!closed) handlers.onClose(`encerrada (${event.code}) ${event.reason ?? ''}`.trim());
  };

  return {
    sendAudio(pcm) {
      if (socket.readyState === 1) {
        socket.send(pcm);
        lastSent = Date.now();
      }
    },
    close() {
      closed = true;
      if (keepAlive) clearInterval(keepAlive);
      try {
        if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'CloseStream' }));
        socket.close();
      } catch {
        // já fechado
      }
    },
  };
}
