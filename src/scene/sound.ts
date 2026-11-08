// Sons da TV (só no navegador). Os arquivos ficam em /sounds e são baixados quando a TV liga o som.
// Navegadores só liberam áudio depois de um toque: por isso existe o botão "Ativar som".
export type SoundName = 'acerto' | 'azar' | 'sorte' | 'vitoria' | 'dica' | 'tique' | 'passa' | 'pop';

const NAMES: SoundName[] = ['acerto', 'azar', 'sorte', 'vitoria', 'dica', 'tique', 'passa', 'pop'];
const MUTE_KEY = 'pistache:tv-mudo';

type Listener = () => void;
let ctx: AudioContext | null = null;
let muted = false;
let started = false;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
const listeners = new Set<Listener>();

try { muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1'; } catch { /* sem armazenamento */ }

const notify = () => listeners.forEach((l) => l());
export const subscribeSound = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** 'off' = ainda não ativado, 'on' = tocando, 'muted' = silenciado. */
export function soundState(): 'off' | 'on' | 'muted' {
  if (muted) return 'muted';
  return started && ctx && ctx.state === 'running' ? 'on' : 'off';
}

async function load(name: SoundName) {
  if (!ctx || buffers[name]) return;
  try {
    const res = await fetch(`/sounds/${name}.wav`);
    buffers[name] = await ctx.decodeAudioData(await res.arrayBuffer());
  } catch { /* som que não baixou fica de fora; o jogo segue */ }
}

/** Liga o som. Tenta já ao abrir a página; se o navegador exigir um toque, qualquer clique, toque ou tecla na tela termina de ligar. */
export async function enableSound() {
  try {
    const AC = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
    if (!AC) return;
    if (!ctx) { ctx = new AC(); ctx.onstatechange = notify; }
    started = true;
    const loading = Promise.all(NAMES.map(load)); // baixa os sons mesmo antes do toque
    await ctx.resume().catch(() => undefined);
    notify();
    await loading;
  } catch { /* sem áudio */ }
}

let comp: DynamicsCompressorNode | null = null;
function limiter(): AudioNode {
  if (!comp && ctx) {
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    comp.connect(ctx.destination);
  }
  return comp ?? ctx!.destination;
}

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ok */ }
  notify();
}

export function play(name: SoundName) {
  if (muted || !ctx || ctx.state !== 'running') return;
  const buf = buffers[name];
  if (!buf) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(limiter()); // o limitador evita estalos se dois sons tocarem juntos
    src.start();
  } catch { /* ok */ }
}
