import assert from 'node:assert/strict';
import { test } from 'node:test';
import { containsPhrase, detectCommand, levenshtein, matchesAnswer, normalize } from './text.ts';

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
  assert.equal(detectCommand('próxima dica', false), null);
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
