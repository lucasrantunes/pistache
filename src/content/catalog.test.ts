import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoriasDisponiveis, rotuloDaCategoria } from './catalog.ts';
import type { Categoria } from './catalog.ts';

const cats: Categoria[] = [
  { id: 'a', nome: 'As', rotulo: 'A', cor: '#111' },
  { id: 'b', nome: 'Bs', rotulo: 'B', cor: '#222' },
];

test('só categorias com carta aparecem, com o total', () => {
  const r = categoriasDisponiveis(cats, [{ categoria: 'b' }, { categoria: 'b' }]);
  assert.deepEqual(r.map((c) => [c.id, c.total]), [['b', 2]]);
});

test('rótulo cai para o id se a categoria não existir', () => {
  assert.equal(rotuloDaCategoria(cats, 'a'), 'A');
  assert.equal(rotuloDaCategoria(cats, 'zzz'), 'zzz');
});
