import type { Effect, Player } from './types.ts';

export interface EffectCard {
  tone: 'bad' | 'good';
  icon: string;
  title: string; // AZAR! ou SORTE!
  text: string; // frase curta, com o nome em destaque
  value: string; // número grande ("−4", "+6", "x2"); vazio quando não há
}

/** Pop-up de azar ou sorte (TV e celular). `pick` escolhe entre as variações da frase. */
export function effectCard(e: Effect | null, players: Player[], winnerId: string | null, pick = 0): EffectCard | null {
  if (!e) return null;
  const name = (id?: string | null) => players.find((p) => p.id === id)?.name ?? '';
  const me = name(winnerId);
  const v = Math.abs(pick) % 2;
  switch (e.kind) {
    case 'lose3':
      return { tone: 'bad', icon: '☠', title: 'AZAR!', value: `−${e.amount}`,
        text: v ? `${me} tropeçou e perde ${e.amount} pontos.` : `Ops! ${me} perde ${e.amount} pontos.` };
    case 'mute':
      return { tone: 'bad', icon: '🤐', title: 'AZAR!', value: '',
        text: v ? `Boca fechada! ${me} não chuta na primeira pista da próxima carta.` : `Silêncio! ${me} fica mudo na primeira pista da próxima carta.` };
    case 'swapLast':
      return { tone: 'bad', icon: '🔄', title: 'AZAR!', value: '',
        text: v ? `Virou a mesa! ${me} e ${name(e.targetId)} trocam de pontos.` : `Troca! ${me} e ${name(e.targetId)} trocam de pontos.` };
    case 'dobro':
      return { tone: 'good', icon: '✨', title: 'SORTE!', value: 'x2',
        text: v ? `${me} está com tudo! A próxima carta vale o dobro.` : `Valendo em dobro! A próxima carta de ${me} vale o dobro.` };
    case 'turbo':
      return { tone: 'good', icon: '⚡', title: 'SORTE!', value: `+${e.amount}`,
        text: v ? `${me} ganhou um empurrão de ${e.amount} pontos.` : `Turbo! ${me} dispara e ganha ${e.amount} pontos.` };
    case 'ladrao':
      return { tone: 'good', icon: '💰', title: 'SORTE!', value: `+${e.amount}`,
        text: e.targetId
          ? (v ? `${me} passa a mão em ${e.amount} pontos de ${name(e.targetId)}.` : `Ladrão! ${me} rouba ${e.amount} pontos de ${name(e.targetId)}.`)
          : `Ladrão! ${me} não tinha de quem roubar e pega ${e.amount} do banco.` };
  }
}

/** Frase curta do efeito (sem o título), para textos simples. */
export function effectText(e: Effect | null, players: Player[], winnerId: string | null = null, pick = 0): string {
  return effectCard(e, players, winnerId, pick)?.text ?? '';
}
