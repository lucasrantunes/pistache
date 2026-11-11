import fs from 'node:fs';
const [,, pk, a='0', b='99'] = process.argv;
const p = JSON.parse(fs.readFileSync(`src/content/packs/${pk}.json`, 'utf8'));
for (const c of p.cartas.slice(+a, +b)) { console.log(`## ${c.id} [${c.resposta}] aliases=${c.aliases.join('|')}`); c.dicas.forEach((d, i) => console.log(`${i + 1}. ${d}`)); }
