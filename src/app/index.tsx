// Tela provisória de texto para jogar o núcleo (Fase 1). Sem visual final.
import { useReducer, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import pack from '@/content/packs/teste.json';
import { cluePoints, createInitialState, currentCard, reduce, squareOf } from '@/game';
import type { Card, Effect, GameState } from '@/game';

const cards = pack.cartas as unknown as Card[];

function Btn({ label, onPress, color = '#b18aff' }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: color, padding: 16, borderRadius: 14, marginVertical: 5 }}>
      <Text style={{ color: '#130d2f', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

const T = ({ children, size = 16, color = '#f6f1ff', bold = false }: { children: React.ReactNode; size?: number; color?: string; bold?: boolean }) => (
  <Text style={{ color, fontSize: size, fontWeight: bold ? '800' : '500', marginVertical: 3 }}>{children}</Text>
);

function effectText(e: Effect | null, s: GameState): string {
  if (!e) return '';
  const name = (id?: string) => s.players.find((p) => p.id === id)?.name ?? '';
  switch (e.kind) {
    case 'lose3': return `AZAR: perdeu ${e.amount} pontos`;
    case 'mute': return 'AZAR: fica mudo na próxima dica';
    case 'swapLast': return `AZAR: trocou de pontos com ${name(e.targetId)}`;
    case 'dobro': return 'BÔNUS Dobro: a próxima carta vale em dobro';
    case 'turbo': return `BÔNUS Turbo: +${e.amount} pontos`;
    case 'ladrao': return e.targetId ? `BÔNUS Ladrão: roubou ${e.amount} de ${name(e.targetId)}` : `BÔNUS Ladrão: ganhou ${e.amount} do banco`;
  }
}

export default function Jogo() {
  const [state, dispatch] = useReducer(reduce, undefined, createInitialState);
  const [names, setNames] = useState('Ana, Bia, Caio');
  const card = state.cards.length ? currentCard(state) : null;
  const winner = state.players.find((p) => state.winnerIds.includes(p.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#130d2f' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <T size={28} color="#ffca4b" bold>Pistache</T>

        {state.phase === 'setup' && (
          <View>
            <T>Nomes dos jogadores (2 a 10), separados por vírgula:</T>
            <TextInput value={names} onChangeText={setNames}
              style={{ backgroundColor: '#211747', color: '#f6f1ff', padding: 12, borderRadius: 10, fontSize: 18 }} />
            <Btn label="Começar" onPress={() => dispatch({ type: 'START', names: names.split(','), cards, seed: Date.now() })} />
          </View>
        )}

        {state.phase !== 'setup' && card && (
          <View>
            <T color="#b18aff">Carta {state.cardIndex + 1}/{state.cards.length} · {card.categoria} · meta {state.goal}</T>

            {state.phase === 'clue' && (
              <View>
                <T color="#ffca4b" bold>Dica {state.clue}/20 · vale {cluePoints(state.clue)} pontos</T>
                <T size={26} bold>{card.dicas[state.clue - 1]}</T>
                {state.muted.length > 0 && (
                  <T color="#ff8f3d" bold>Mudo nesta dica: {state.players.filter((p) => state.muted.includes(p.id)).map((p) => p.name).join(', ')}</T>
                )}
                <T color="#8f86b8">Resposta (só o operador vê): {card.resposta}</T>
                <Btn label="Próxima dica" onPress={() => dispatch({ type: 'NEXT_CLUE' })} color="#ffca4b" />
                <T bold>Quem acertou?</T>
                {state.players
                  .filter((p) => !state.tiebreakIds || state.tiebreakIds.includes(p.id))
                  .map((p) => <Btn key={p.id} label={p.name} color="#32e397" onPress={() => dispatch({ type: 'CORRECT', playerId: p.id })} />)}
              </View>
            )}

            {state.phase === 'noWinner' && (
              <View>
                <T size={22} bold>Ninguém acertou. A resposta era: {card.resposta}</T>
                <T>Quem chegou mais perto ganha 5 pontos:</T>
                {state.players
                  .filter((p) => !state.tiebreakIds || state.tiebreakIds.includes(p.id))
                  .map((p) => <Btn key={p.id} label={p.name} color="#32e397" onPress={() => dispatch({ type: 'CLOSEST', playerId: p.id })} />)}
                <Btn label="Ninguém" color="#ff777b" onPress={() => dispatch({ type: 'CLOSEST', playerId: null })} />
              </View>
            )}

            {state.phase === 'roundEnd' && state.lastResult && (
              <View>
                <T size={22} color="#32e397" bold>Resposta: {card.resposta}</T>
                {state.lastResult.winnerId && (
                  <T size={20} bold>
                    {state.players.find((p) => p.id === state.lastResult!.winnerId)?.name} ganhou +{state.lastResult.gained} pontos
                    (casa {state.lastResult.fromSquare} → {state.lastResult.toSquare})
                  </T>
                )}
                <T size={18} color="#ffca4b" bold>{effectText(state.lastResult.effect, state)}</T>
                {state.tiebreakIds && <T color="#ff8f3d" bold>Empate na meta! Vem uma carta de desempate.</T>}
                <Btn label="Próxima carta" onPress={() => dispatch({ type: 'NEXT_ROUND' })} />
              </View>
            )}

            {state.phase === 'finished' && (
              <View>
                <T size={26} color="#ffca4b" bold>Fim! Vencedor: {winner?.name ?? 'empate'}</T>
                <Btn label="Jogar de novo" onPress={() => dispatch({ type: 'START', names: names.split(','), cards, seed: Date.now() })} />
              </View>
            )}

            <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: '#493a78', paddingTop: 10 }}>
              <T bold>Placar</T>
              {[...state.players].sort((a, b) => b.points - a.points).map((p) => (
                <T key={p.id}>
                  {p.name}: {p.points} pts · casa {squareOf(p.points, state.goal)}/25{p.doubleNext ? ' · Dobro' : ''}{p.muteNext ? ' · mudo na próxima' : ''}
                </T>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
