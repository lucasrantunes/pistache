# Pistache (CLAUDE.md)

Jogo de festa de adivinhação por dicas, para celular (iOS/Android) e TV. Idioma: português do Brasil. Dono: Lucas (nível técnico intermediário). Leia também `AGENTS.md` (regras do Expo) e `docs/Documento-do-Projeto.md` (decisões 1 a 66, escopo do MVP, riscos). Em conflito, vale o Documento do Projeto.

## Como é o jogo
- Cada carta tem uma resposta secreta e 20 dicas (da mais difícil à mais fácil). Dica 1 vale 20 pontos, cai 1 por dica. Chute errado não custa nada.
- Jogadores individuais (2 a 10). Meta padrão 50 pontos (ajustável). Tabuleiro de 25 casas (casa 25 = meta). Casas especiais: azar 3, 9, 17, 23; Dobro 6; Ladrão 13; Turbo 20. O efeito vale só se o jogador **parar** na casa.
- O celular do operador escuta por voz (Deepgram), a palavra mágica "Pistache" avança a dica. A TV é só um site de visualização (rota `tv`). Sem contas, sem anúncios e sem compras no MVP.

## Estrutura
- `src/game`: lógica pura (sem React), `reduce(estado, evento)`. Único lugar com testes automáticos.
- `src/content`: categorias (`categorias.json`), pacotes de cartas (`packs/*.json`), validador e índice gerado. Para adicionar cartas ou categorias, siga `docs/Como-adicionar-cartas.md`.
- `src/voice`, `src/realtime`, `src/scene`, `src/ui`: voz, sala em tempo real, cena da TV e telas.
- `src/app`: telas do Expo Router. `tools/`: validador de cartas e scripts. `assets/`: sons e texturas.

## Convenções
- TypeScript estrito, nomes claros, sem dependências desnecessárias. Instalar pacotes sempre com `npx expo install <pacote>`.
- Imports dentro de `src/game` usam extensão `.ts` (necessário para os testes rodarem sem instalar nada). Em `src/game`, `import type` para tipos.
- Lógica do jogo fica fora das telas. Telas só leem o estado e mandam eventos.
- Textos do jogo em português do Brasil.

## Comandos (Windows)
- `npm test`: testes da lógica (`node:test`, Node 22.18+ roda TypeScript direto).
- `npm run cartas:validar`: confere as cartas. `npm run cartas:indice`: refaz o índice depois de criar ou remover um pacote.
- `npx tsc --noEmit`: tipos. `npx expo lint`: lint. `npx expo start`: rodar no Expo Go.
- O `tsc` mostra 1 erro antigo em `src/components/app-tabs.web.tsx` (código do template, não nosso).

## Como trabalhar com o Lucas
- Respostas curtas, sem jargão, sem recapitular decisões fechadas.
- Testes automáticos só para a lógica pura. Para o resto, passos de teste curtos para ele rodar no celular: passos numerados e resultado esperado em uma linha.
- Avise antes de qualquer teste que exija mais de 2 minutos dele. Pare e guie passo a passo quando precisar de ação dele (contas, chaves, instalações).
- Não construa telas finais antes de ele aprovar o design (sketch "Palco neon" no Claude).

## Roteiro (decisão 66)
0. Design e contas (sketch, Deepgram, Supabase, Expo) — em andamento.
1. Núcleo do jogo: lógica + testes (feito) e tela simples de texto jogável com poucas cartas (próximo).
2. Protótipo de voz (maior risco). 3. Partida completa em um celular. 4. TV (sala de 4 letras, tempo real). 5. Cena final. 6. Conteúdo (100 cartas). 7. Robustez. 8. Publicação.
