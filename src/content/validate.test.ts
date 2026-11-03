import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Categoria } from './catalog.ts';
import { validarPacotes } from './validate.ts';

const categorias: Categoria[] = [{ id: 'coisa', nome: 'Coisas', rotulo: 'Coisa', cor: '#fff' }];
const dicas = (n = 20) => Array.from({ length: n }, (_, i) => `Esta é a dica número ${i + 1} da carta`);
const carta = (extra: Record<string, unknown> = {}) => ({
  id: 'c-um', categoria: 'coisa', resposta: 'Guarda-chuva', aliases: ['sombrinha'], dificuldade: 1, dicas: dicas(), ...extra,
});
const pacote = (cartas: unknown[]) => [{ id: 'teste', versao: 1, cartas }];
const erros = (cartas: unknown[]) => validarPacotes(pacote(cartas), categorias).filter((p) => p.nivel === 'erro');

test('carta correta não tem erro', () => {
  assert.deepEqual(validarPacotes(pacote([carta()]), categorias), []);
});

test('exige 20 dicas, categoria existente e dificuldade válida', () => {
  assert.match(erros([carta({ dicas: dicas(19) })])[0].texto, /20 dicas/);
  assert.match(erros([carta({ categoria: 'xyz' })])[0].texto, /categoria/);
  assert.match(erros([carta({ dificuldade: 5 })])[0].texto, /dificuldade/);
});

test('acusa resposta entregue nas dicas (erro nas primeiras, aviso nas 3 últimas)', () => {
  const cedo = dicas();
  cedo[2] = 'Serve para quando cai um guarda chuva do céu';
  assert.match(erros([carta({ dicas: cedo })])[0].texto, /dica 3 entrega/);
  const tarde = dicas();
  tarde[19] = 'É o guarda-chuva';
  assert.equal(erros([carta({ dicas: tarde })]).length, 0);
  assert.ok(validarPacotes(pacote([carta({ dicas: tarde })]), categorias).some((p) => p.nivel === 'aviso'));
});

test('acusa id repetido, dica repetida e apelido igual ao de outra carta', () => {
  assert.ok(erros([carta(), carta()]).some((p) => /id repetido/.test(p.texto)));
  const igual = dicas();
  igual[5] = igual[4];
  assert.ok(erros([carta({ dicas: igual })]).some((p) => /repetida/.test(p.texto)));
  assert.ok(erros([carta(), carta({ id: 'c-dois', resposta: 'Sombrinha', aliases: [] })]).some((p) => /também é aceito/.test(p.texto)));
});

test('acusa palavra proibida', () => {
  const d = dicas();
  d[7] = 'Isso é uma merda de dica para a carta';
  assert.ok(erros([carta({ dicas: d })]).some((p) => /proibida/.test(p.texto)));
});
