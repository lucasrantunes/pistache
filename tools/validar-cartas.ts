// Confere todas as cartas: `npm run cartas:validar`. Sai com erro (código 1) se houver problema grave.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Categoria } from '../src/content/catalog.ts';
import { validarPacotes } from '../src/content/validate.ts';

const dir = join(import.meta.dirname, '..', 'src', 'content');
const categorias = JSON.parse(readFileSync(join(dir, 'categorias.json'), 'utf8')) as Categoria[];
const arquivos = readdirSync(join(dir, 'packs')).filter((f) => f.endsWith('.json')).sort();
const pacotes = arquivos.map((f) => JSON.parse(readFileSync(join(dir, 'packs', f), 'utf8')));

const problemas = validarPacotes(pacotes, categorias);
for (const p of problemas) console.log(`${p.nivel === 'erro' ? 'ERRO ' : 'aviso'}  ${p.onde}: ${p.texto}`);

const cartas = pacotes.flatMap((p) => (Array.isArray(p.cartas) ? p.cartas : []));
console.log(`\n${pacotes.length} pacotes, ${cartas.length} cartas.`);
for (const c of categorias) console.log(`  ${c.nome}: ${cartas.filter((k: { categoria?: string }) => k.categoria === c.id).length}`);

const erros = problemas.filter((p) => p.nivel === 'erro').length;
console.log(erros ? `\n${erros} erro(s) para corrigir.` : '\nTudo certo: nenhum erro.');
process.exit(erros ? 1 : 0);
