/** Id de uma categoria. As categorias existem como dados em `src/content/categorias.json`. */
export type Category = string;

export interface Card {
  id: string;
  categoria: Category;
  resposta: string;
  aliases: string[];
  dicas: string[]; // 20, da mais difícil à mais fácil
  dificuldade: 1 | 2 | 3;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  doubleNext: boolean; // bônus Dobro pendente
  muteNext: boolean; // azar "mudo" pendente (vale na 1ª dica da próxima carta)
}

export type Phase = 'setup' | 'clue' | 'noWinner' | 'roundEnd' | 'finished';

export type EffectKind = 'lose3' | 'mute' | 'swapLast' | 'dobro' | 'ladrao' | 'turbo';

export interface Effect {
  kind: EffectKind;
  targetId?: string; // vítima (ladrão) ou jogador trocado (swapLast)
  amount?: number; // pontos perdidos, roubados ou ganhos
}

export interface RoundResult {
  kind: 'correct' | 'closest' | 'none';
  winnerId: string | null;
  gained: number;
  fromSquare: number;
  toSquare: number;
  effect: Effect | null;
}

/** Cópia do jogo antes da última pontuação, para "Corrigir quem acertou". */
export interface Undo {
  snapshot: Omit<GameState, 'undo'>;
  kind: 'correct' | 'closest';
  winnerId: string | null; // quem foi marcado
  clue: number; // dica em que foi marcado
  gained: number;
}

export interface GameState {
  phase: Phase;
  players: Player[];
  goal: number;
  cards: Card[];
  cardIndex: number;
  clue: number; // 1 a 20
  muted: string[]; // jogadores mudos na dica atual (regra de honra)
  tiebreakIds: string[] | null; // carta de desempate: só estes podem pontuar
  seed: number;
  lastResult: RoundResult | null;
  winnerIds: string[];
  undo: Undo | null; // só a última rodada pode ser corrigida
}

export type GameEvent =
  | { type: 'START'; names: string[]; goal?: number; cards: Card[]; seed: number }
  | { type: 'NEXT_CLUE' }
  | { type: 'CORRECT'; playerId: string }
  | { type: 'CLOSEST'; playerId: string | null }
  | { type: 'NEXT_ROUND' }
  | { type: 'FIX_WINNER'; playerId: string } // corrige quem acertou na última rodada
  | { type: 'DISCARD' }; // descarta a palavra: ninguém do jogo pontua e vem a próxima carta
