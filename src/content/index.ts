// ARQUIVO GERADO por tools/gerar-indice.ts. Não edite à mão: rode `npm run cartas:indice`.
import type { Card } from '@/game';

import categorias from './categorias.json';
import type { Categoria } from './catalog';
import p0 from './packs/animais.json';
import p1 from './packs/coisas.json';
import p2 from './packs/comidas.json';
import p3 from './packs/esportes.json';
import p4 from './packs/lugares.json';
import p5 from './packs/pessoas.json';
import p6 from './packs/teste.json';

export const CATEGORIAS = categorias as Categoria[];
export const PACOTES: { id: string; versao: number; cartas: unknown[] }[] = [p0, p1, p2, p3, p4, p5, p6];
export const CARTAS = PACOTES.flatMap((p) => p.cartas) as Card[];
