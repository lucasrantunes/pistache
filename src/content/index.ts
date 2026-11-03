// ARQUIVO GERADO por tools/gerar-indice.ts. Não edite à mão: rode `npm run cartas:indice`.
import type { Card } from '@/game';

import categorias from './categorias.json';
import type { Categoria } from './catalog';
import p0 from './packs/animais.json';
import p1 from './packs/comidas.json';
import p2 from './packs/esporte-musica.json';
import p3 from './packs/filmes-series.json';
import p4 from './packs/teste.json';

export const CATEGORIAS = categorias as Categoria[];
export const PACOTES = [p0, p1, p2, p3, p4];
export const CARTAS = PACOTES.flatMap((p) => p.cartas) as unknown as Card[];
