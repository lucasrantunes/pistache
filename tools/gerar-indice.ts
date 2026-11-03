// Gera src/content/index.ts a partir dos arquivos de src/content/packs: `npm run cartas:indice`.
// Rode sempre que adicionar ou remover um pacote.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'src', 'content');
const arquivos = readdirSync(join(dir, 'packs')).filter((f) => f.endsWith('.json')).sort();

const imports = arquivos.map((f, i) => `import p${i} from './packs/${f}';`).join('\n');
const lista = arquivos.map((_, i) => `p${i}`).join(', ');

writeFileSync(join(dir, 'index.ts'), `// ARQUIVO GERADO por tools/gerar-indice.ts. Não edite à mão: rode \`npm run cartas:indice\`.
import type { Card } from '@/game';

import categorias from './categorias.json';
import type { Categoria } from './catalog';
${imports}

export const CATEGORIAS = categorias as Categoria[];
export const PACOTES: { id: string; versao: number; cartas: unknown[] }[] = [${lista}];
export const CARTAS = PACOTES.flatMap((p) => p.cartas) as Card[];
`);
console.log(`Índice gerado com ${arquivos.length} pacotes.`);
