import assert from 'node:assert/strict';
import { test } from 'node:test';
import { containsPhrase, detectCommand, levenshtein, matchPlayerName, matchesAnswer, nextHeard, normalize } from './text.ts';

test('normalize tira acento, pontuação e caixa', () => {
  assert.equal(normalize('  Pão-de-Queijo!! É bom, né? '), 'pao de queijo e bom ne');
});

test('levenshtein', () => {
  assert.equal(levenshtein('casa', 'casa'), 0);
  assert.equal(levenshtein('casa', 'caso'), 1);
  assert.equal(levenshtein('', 'abc'), 3);
});

test('palavra mágica avança, pausa e retoma', () => {
  assert.equal(detectCommand('Pistache', false), 'advance');
  assert.equal(detectCommand('ei pistache!', false), 'advance');
  assert.equal(detectCommand('Pistache, pausa', false), 'pause');
  assert.equal(detectCommand('pistache', true), 'resume');
  assert.equal(detectCommand('pistache pausa', true), null);
});

test('palavra mágica tolera pequenos erros e ignora conversa comum', () => {
  assert.equal(detectCommand('pistachi', false), 'advance');
  assert.equal(detectCommand('pistache', false), 'advance');
  assert.equal(detectCommand('vida de cachorro', false), null);
  assert.equal(detectCommand('dicas demais', false), null);
  assert.equal(detectCommand('pistão', false), null);
  assert.equal(detectCommand('pizza de queijo', false), null);
});

test('resposta: palavras inteiras, aliases e tolerância', () => {
  assert.ok(matchesAnswer('acho que é pão de queijo', 'Pão de queijo'));
  assert.ok(matchesAnswer('pao de queijos', 'Pão de queijo'));
  assert.ok(matchesAnswer('é o alberto santos dumont', 'Santos Dumont', ['alberto santos dumont']));
  assert.ok(!matchesAnswer('queijo', 'Pão de queijo'));
  assert.ok(!matchesAnswer('pão de batata', 'Pão de queijo'));
});

test('palavras curtas não aceitam erro (evita falso acerto)', () => {
  assert.ok(!containsPhrase('o rei da bola', 'rio'));
  assert.ok(containsPhrase('é o rio', 'rio'));
});

test('"dica" avança a dica, mas só com o jogo rodando e só a palavra exata', () => {
  assert.equal(detectCommand('próxima dica', false), 'advance');
  assert.equal(detectCommand('DICA!', false), 'advance');
  assert.equal(detectCommand('dica', true), null);
  assert.equal(detectCommand('dita', false), null);
  assert.equal(detectCommand('pistache dica pausa', false), 'advance');
});

const jogadores = [
  { id: 'p1', name: 'Lucas' },
  { id: 'p2', name: 'Ana Clara' },
  { id: 'p3', name: 'Beatriz' },
];

test('nome falado: nome inteiro, só o primeiro nome e tolerância', () => {
  assert.equal(matchPlayerName('fui eu, Lucas', jogadores), 'p1');
  assert.equal(matchPlayerName('ana clara', jogadores), 'p2');
  assert.equal(matchPlayerName('foi a Ana', jogadores), 'p2');
  assert.equal(matchPlayerName('beatris!', jogadores), 'p3');
  assert.equal(matchPlayerName('ninguém sabe', jogadores), null);
  assert.equal(matchPlayerName('', jogadores), null);
});

test('nome falado: empate entre dois jogadores vira null, e a resposta da carta não conta como nome', () => {
  const dois = [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Ana Clara' }];
  assert.equal(matchPlayerName('Ana', dois), null);
  assert.equal(matchPlayerName('Ana Clara', dois), 'b');
  const santos = [{ id: 'x', name: 'Santos' }, { id: 'y', name: 'Bia' }];
  assert.equal(matchPlayerName('é o santos dumont, bia', santos, ['Santos Dumont']), 'y');
  assert.equal(matchPlayerName('é o santos dumont', santos, ['Santos Dumont']), null);
});

test('últimas 2 palavras ditas: parcial só aparece, final fica guardado', () => {
  let h = { done: [] as string[], shown: '' };
  h = nextHeard(h, 'acho', false);
  assert.equal(h.shown, 'acho');
  h = nextHeard(h, 'acho que é', false);
  assert.equal(h.shown, 'que é');
  h = nextHeard(h, 'acho que é um gato', true);
  assert.equal(h.shown, 'um gato');
  assert.deepEqual(h.done, ['um', 'gato']);
  h = nextHeard(h, 'não', false);
  assert.equal(h.shown, 'gato não');
});
