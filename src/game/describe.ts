import type { Effect, Player } from './types.ts';

/** Texto curto do efeito de uma casa especial (para celular e TV). */
export function effectText(e: Effect | null, players: Player[]): string {
  if (!e) return '';
  const name = (id?: string) => players.find((p) => p.id === id)?.name ?? '';
  switch (e.kind) {
    case 'lose3': return `AZAR: perdeu ${e.amount} pontos`;
    case 'mute': return 'AZAR: fica mudo na 1ª dica da próxima carta';
    case 'swapLast': return `AZAR: trocou de pontos com ${name(e.targetId)}`;
    case 'dobro': return 'BÔNUS Dobro: a próxima carta vale em dobro';
    case 'turbo': return `BÔNUS Turbo: +${e.amount} pontos`;
    case 'ladrao': return e.targetId ? `BÔNUS Ladrão: roubou ${e.amount} de ${name(e.targetId)}` : `BÔNUS Ladrão: ganhou ${e.amount} do banco`;
  }
}
