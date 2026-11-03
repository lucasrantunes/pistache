// Validador de cartas (lógica pura). Rodado por `npm run cartas:validar` e pelos testes.
import { normalize } from '../voice/text.ts';
import type { Categoria } from './catalog.ts';
import { PROIBIDAS } from './proibidas.ts';

export const NUM_DICAS = 20;
export const DICA_MAX = 140;
export const DICA_MIN = 10;

export interface PacoteBruto {
  id?: unknown;
  versao?: unknown;
  cartas?: unknown;
}

export interface Problema {
  nivel: 'erro' | 'aviso';
  /** id da carta (ou do pacote, quando o problema é do pacote). */
  onde: string;
  texto: string;
}

const PARADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'o', 'a', 'os', 'as', 'um', 'uma', 'e', 'em']);
const palavras = (t: string): string[] => normalize(t).split(' ').filter(Boolean);
const contem = (texto: string, termo: string): boolean => termo !== '' && ` ${normalize(texto)} `.includes(` ${normalize(termo)} `);

export function validarPacotes(pacotes: PacoteBruto[], categorias: Categoria[]): Problema[] {
  const out: Problema[] = [];
  const erro = (onde: string, texto: string) => out.push({ nivel: 'erro', onde, texto });
  const aviso = (onde: string, texto: string) => out.push({ nivel: 'aviso', onde, texto });
  const idsCategoria = new Set(categorias.map((c) => c.id));
  const ids = new Map<string, string>(); // id da carta -> pacote
  const termos = new Map<string, string>(); // resposta/apelido normalizado -> id da carta

  for (const p of pacotes) {
    const pid = typeof p.id === 'string' && p.id ? p.id : '(pacote sem id)';
    if (typeof p.id !== 'string' || !/^[a-z0-9-]+$/.test(p.id)) erro(pid, 'id do pacote deve ter só letras minúsculas, números e hífen.');
    if (!Number.isInteger(p.versao) || (p.versao as number) < 1) erro(pid, '"versao" deve ser um número inteiro a partir de 1.');
    if (!Array.isArray(p.cartas)) { erro(pid, '"cartas" deve ser uma lista.'); continue; }

    for (const bruta of p.cartas as Record<string, unknown>[]) {
      const id = typeof bruta?.id === 'string' && bruta.id ? bruta.id : `${pid}#sem-id`;
      if (typeof bruta?.id !== 'string' || !/^[a-z0-9-]+$/.test(bruta.id)) erro(id, 'id da carta deve ter só letras minúsculas, números e hífen.');
      if (ids.has(id)) erro(id, `id repetido (também no pacote "${ids.get(id)}").`);
      ids.set(id, pid);

      if (typeof bruta.categoria !== 'string' || !idsCategoria.has(bruta.categoria)) {
        erro(id, `categoria "${String(bruta.categoria)}" não existe em categorias.json.`);
      }
      const resposta = typeof bruta.resposta === 'string' ? bruta.resposta.trim() : '';
      if (!resposta) { erro(id, 'resposta vazia.'); continue; }
      if (![1, 2, 3].includes(bruta.dificuldade as number)) erro(id, '"dificuldade" deve ser 1, 2 ou 3.');

      const aliases = Array.isArray(bruta.aliases) && bruta.aliases.every((a) => typeof a === 'string') ? (bruta.aliases as string[]) : null;
      if (!aliases) erro(id, '"aliases" deve ser uma lista de textos (pode ser vazia).');
      const aceitos = [resposta, ...(aliases ?? [])];

      // Resposta ou apelido igual ao de outra carta confunde a voz.
      for (const t of aceitos) {
        const n = normalize(t);
        const dono = termos.get(n);
        if (dono && dono !== id) erro(id, `"${t}" também é aceito pela carta "${dono}" (a voz não saberia qual é).`);
        else termos.set(n, id);
      }

      const dicas = Array.isArray(bruta.dicas) ? (bruta.dicas as unknown[]) : [];
      if (dicas.length !== NUM_DICAS) { erro(id, `precisa ter ${NUM_DICAS} dicas (tem ${dicas.length}).`); continue; }
      const vistas = new Set<string>();
      dicas.forEach((d, i) => {
        const n = i + 1;
        if (typeof d !== 'string' || !d.trim()) { erro(id, `dica ${n} vazia.`); return; }
        if (d.length > DICA_MAX) aviso(id, `dica ${n} muito longa (${d.length} letras; o ideal é até ${DICA_MAX}).`);
        if (d.trim().length < DICA_MIN) aviso(id, `dica ${n} muito curta.`);
        const nd = normalize(d);
        if (vistas.has(nd)) erro(id, `dica ${n} repetida.`);
        vistas.add(nd);
        // Vazamento: a resposta (ou um apelido) inteira não pode aparecer, a não ser nas 3 últimas dicas.
        const vaza = aceitos.find((t) => contem(d, t));
        if (vaza) (n <= NUM_DICAS - 3 ? erro : aviso)(id, `dica ${n} entrega a resposta ("${vaza}").`);
        // Palavra importante da resposta nas dicas iniciais: só um aviso.
        if (n <= 12) {
          const forte = palavras(resposta).find((w) => w.length >= 5 && !PARADAS.has(w) && palavras(d).includes(w));
          if (forte && !vaza) aviso(id, `dica ${n} usa a palavra "${forte}", que está na resposta.`);
        }
      });

      // Palavras proibidas em qualquer texto da carta.
      const tudo = [resposta, ...(aliases ?? []), ...dicas.filter((d): d is string => typeof d === 'string')];
      const ruim = tudo.flatMap(palavras).find((w) => PROIBIDAS.includes(w));
      if (ruim) erro(id, `contém palavra proibida ("${ruim}").`);
    }
  }
  return out;
}
