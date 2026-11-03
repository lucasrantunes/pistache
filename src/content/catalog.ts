// Categorias como dados (src/content/categorias.json). Lógica pura, sem React.
import type { Card } from '../game/types.ts';

export interface Categoria {
  id: string;
  /** Nome no plural, para a lista de escolha ("Animais"). */
  nome: string;
  /** Nome curto no singular, para o chip da rodada ("Animal"). */
  rotulo: string;
  cor: string;
}

export type CategoriaComTotal = Categoria & { total: number };

/** Só categorias que já têm carta, na ordem do arquivo (categoria vazia não aparece na escolha). */
export function categoriasDisponiveis(categorias: Categoria[], cartas: Pick<Card, 'categoria'>[]): CategoriaComTotal[] {
  return categorias
    .map((c) => ({ ...c, total: cartas.filter((k) => k.categoria === c.id).length }))
    .filter((c) => c.total > 0);
}

export const rotuloDaCategoria = (categorias: Categoria[], id: string): string =>
  categorias.find((c) => c.id === id)?.rotulo ?? id;
