// Quanto tempo cada tela fica sozinha antes de avançar (em segundos). O botão de cada tela avança na hora.
export const AUTO_SECONDS = {
  /** Placar depois de cada carta. */
  ranking: 5,
  /** Casa especial (azar, dobro, ladrão, turbo): um pouco mais, para dar tempo de rir e ler. */
  effect: 8,
  /** Fim de jogo: começa outra partida com os mesmos jogadores. */
  playAgain: 30,
} as const;
