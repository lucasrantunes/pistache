// Refaz a lista de 20 pistas de cartas específicas.
// Uso: preencha tools/pedidos/<pacote>.mjs (export default { 'id-da-carta': [20 itens] }) e rode:
//   node tools/reordenar-pistas.mjs coisas      (depois: npm run cartas:validar && npm run cartas:indice)
// Cada item é um NÚMERO (pista atual, 1 a 20, reaproveitada) ou um TEXTO (pista nova).
// Rode UMA vez por pedido: reaplicar embaralha de novo (o script avisa se a carta já foi refeita).
import fs from 'node:fs';
import path from 'node:path';

const nome = process.argv[2];
if (!nome) throw new Error('Diga o pedido: node tools/reordenar-pistas.mjs <pacote>');
const PEDIDOS = (await import(`./pedidos/${nome}.mjs`)).default;
const dir = path.join(import.meta.dirname, '..', 'src', 'content', 'packs');
const feitos = new Set();
for (const f of fs.readdirSync(dir)) {
  const arq = path.join(dir, f);
  const texto = fs.readFileSync(arq, 'utf8');
  const crlf = texto.includes('\r\n');
  const pacote = JSON.parse(texto);
  let mexeu = false;
  for (const c of pacote.cartas) {
    const ordem = PEDIDOS[c.id];
    if (!ordem) continue;
    if (ordem.length !== 20) throw new Error(`${c.id}: precisa de 20 itens, veio ${ordem.length}`);
    const nums = ordem.filter((x) => typeof x === 'number');
    if (new Set(nums).size !== nums.length || nums.some((n) => n < 1 || n > c.dicas.length)) throw new Error(`Ordem inválida em ${c.id}`);
    c.dicas = ordem.map((x) => (typeof x === 'number' ? c.dicas[x - 1] : x));
    const marca = '[pistas refeitas v2: começo mais difícil]';
    if (!(c.notas || '').includes(marca)) c.notas = `${c.notas ? c.notas + ' ' : ''}${marca}`.trim();
    feitos.add(c.id);
    mexeu = true;
  }
  if (!mexeu) continue;
  pacote.versao += 1;
  let saida = JSON.stringify(pacote, null, 2) + '\n';
  if (crlf) saida = saida.replace(/\n/g, '\r\n');
  fs.writeFileSync(arq, saida);
}
const faltou = Object.keys(PEDIDOS).filter((id) => !feitos.has(id));
console.log(`Refeitas: ${feitos.size}. Não achei: ${faltou.length ? faltou.join(', ') : 'nenhuma'}.`);
