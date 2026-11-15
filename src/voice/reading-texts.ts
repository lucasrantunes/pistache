// Textos do teste de leitura (originais, no estilo do jogo).
export type ReadingText = { id: string; title: string; text: string };

export const READING_TEXTS: ReadingText[] = [
  {
    id: 'festa',
    title: 'Conversa de festa, com a palavra mágica',
    text: 'Hoje a família inteira se reuniu na casa da vovó para jogar. Quando alguém diz Pistache, a próxima dica aparece na televisão. Quem acerta primeiro ganha mais pontos, e quem erra não perde nada. Pistache! Mais uma dica. Será que é um lugar famoso, um animal ou uma comida? Pistache, pausa. Preciso pegar um copo de suco.',
  },
  {
    id: 'nomes',
    title: 'Nomes difíceis de entender',
    text: 'As respostas de hoje podem ser Cristo Redentor, Santos Dumont, Machu Picchu, Pelé ou Fernanda Montenegro. Também pode aparecer Foz do Iguaçu, Jericoacoara e pão de queijo. Pistache. Repare que alguns nomes são difíceis para quem está escutando.',
  },
  {
    id: 'rodada',
    title: 'Simulação de uma rodada',
    text: 'Dica um: fica no hemisfério sul. Pistache. Dica dois: tem mais de duzentos milhões de habitantes. Pistache. Dica três: ganhou cinco copas do mundo. Pistache. Dica quatro: a capital é Brasília. É o Brasil!',
  },
];
