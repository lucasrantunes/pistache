# Documento do Projeto (vivo)

## Regras permanentes do projeto
- Jogo **individual**: cada pessoa joga por si (NÃO é por equipes). Todo termo "equipe" deve ser lido como "jogador". Placar, personagens na TV e cartas de azar são por jogador.
- Idioma: português do Brasil. Nível técnico do dono: intermediário. Feito 100% com IA.
- Respostas curtas; não reabrir decisões fechadas; perguntar uma coisa por vez; testes visuais/de toque ficam com o dono (instruções curtas), testes automáticos só para lógica pura.

## Etapa atual
Etapas 1 a 11 planejadas. **Fase 1 concluída** (núcleo com 15 testes + tela de texto testada no Expo Go, decisão 67). Fase 0 pendente: aprovar o sketch (v20) e criar conta Expo (token). **Próximo: Fase 2, protótipo de voz** (decisão 68).
Modo de trabalho: o dono quer agrupar decisões pequenas com padrão sugerido e só parar nas decisões importantes.

## Decisões tomadas

### Etapa 1: visão
1. Público: família mista (crianças ~10+, adultos, avós). Conteúdo limpo, mais fácil nas lojas.
2. Tom: programa de auditório (apresentador animado, vinhetas, plateia, TV como palco).
3. Diversão central: corrida de palpites. Todos gritam chutes enquanto os pontos caem a cada dica.
4. Jogo individual, cada um por si.
5. Nome provisório: **Pistache** (o dono pode mudar mais para frente). Falta checar Play Store BR, App Store e INPI antes de virar definitivo.

### Etapa 2: regras e pontuação
6. TV = palco de todos. Um **operador** com o celular inicia a partida, digita os nomes e toca em quem acertou. Operador NÃO vê a resposta e joga normalmente. Não existe mestre.
7. Chutes livres por voz, sem ordem e sem buzzer. Ninguém vê a resposta.
8. Validação por voz com **Deepgram** (streaming, Nova-3, português) já no MVP: o microfone do celular do operador escuta a sala, compara com a resposta e as variações aceitas, pausa a dica ao detectar o acerto e o operador toca em quem foi.
9. Cada carta tem **20 dicas**, da mais difícil para a mais fácil.
10. *(Substituída pela decisão 69.)* Avanço da dica, sem cronômetro fixo:
    - Por voz: a palavra mágica é o nome do jogo ("Pistache"). Só ela avança; "próxima" dito em conversa não faz nada.
    - Por timer de segurança: parado por 20 s, aparece uma contagem regressiva de 10 s; aos 30 s a dica avança sozinha.
    - Pausa e retomada também por voz (palavra de comando a definir).
11. Pontos: primeira dica vale 20 pontos, cai 1 por dica (a 20ª vale 1). Os pontos em jogo ficam visíveis na TV.
12. Chute errado não custa nada.
13. Se ninguém acertar as 20 dicas: a resposta é revelada e o operador escolhe quem chegou mais perto, que ganha **5 pontos**.
14. *(Substituída pela decisão 69.)* Partida termina quando alguém chega à meta, **50 pontos por padrão** (alvo: 10 a 15 minutos). A meta pode ser mudada antes de começar.
15. Empate na meta: vence quem tiver mais pontos; se continuar empatado, uma carta de desempate.
16. **Cartas de azar já no MVP**:
    - ~~Chance de 20% por carta e alvo sorteado~~: substituído pela decisão 26 (casas especiais do tabuleiro).
    - Efeitos (sorteados): perder 3 pontos; ficar mudo por uma dica; trocar de pontos com o último colocado.
    - "Mudo" é regra de honra: a TV mostra o nome e o ícone de mudo, o app não identifica quem fala.
    - Reação exagerada, engraçada e nunca humilhante do personagem do jogador afetado (etapas 5 e 6).

### Etapa 4: experiência na TV
23. A TV é uma **página web** aberta no navegador da TV (ou transmitida do celular por Chromecast/AirPlay), mostrando um código de sala. O celular do operador digita o código e liga. Sem app nativo de TV. A TV recebe o estado da partida em tempo real (sala em tempo real definida na etapa 7).
24. **Só duas telas em jogo: operador (celular) e TV.** Convidados não entram por navegador nem usam o próprio celular. O operador digita os nomes. Isso retira o item "celular dos convidados" das etapas 5 e 7 e simplifica a sala em tempo real (um celular + uma TV).
25. Cena da TV: **tabuleiro animado**, um personagem por jogador avançando num caminho conforme os pontos. A dica atual continua sendo o elemento principal e nunca é coberta pelo tabuleiro. Risco: 10 personagens no mesmo caminho e arte do tabuleiro; manter simples (definir na etapa 5 e 6).
26. **As casas do tabuleiro têm efeito e substituem o sorteio de 20% por carta.** O azar (e bônus) só acontece quando o personagem para numa casa especial ao pontuar. Quem está parado não sofre azar. Casas mistas, ruins e boas. Os efeitos de azar continuam: perder 3 pontos, ficar mudo por uma dica (regra de honra), trocar de pontos com o último colocado.
27. Tabuleiro com **25 casas** (cada casa = 2 pontos; meta de 50 pontos = casa 25). O personagem pode andar várias casas de uma vez e só vale a casa em que para.
28. **7 casas especiais das 25**: 4 de azar e 3 de bônus (confirmado). As posições ficam fixas no tabuleiro do MVP.
29. **Efeitos de bônus** (uma casa de cada):
    - **Turbo**: avança 2 casas na hora (+4 pontos). Não dispara efeito de outra casa.
    - **Ladrão**: rouba 3 pontos de um jogador sorteado que esteja à frente; se for o líder, ganha 3 pontos do banco.
    - **Dobro**: os pontos da próxima carta que ele acertar valem em dobro.
30. **Posições das casas especiais** (25 casas, bem espalhadas, bônus forte no centro):
    - Casa 3: azar · Casa 6: bônus Dobro · Casa 9: azar · **Casa 13 (centro): bônus Ladrão** · Casa 17: azar · Casa 20: bônus Turbo · Casa 23: azar.
    - Os efeitos de azar são sorteados entre os três quando o jogador para na casa.
31. O efeito de uma casa especial vale **na hora**, só se o personagem **parar** nela. Passar por cima sem parar não ativa nada.
32. *(Padrões assumidos para ir rápido, refinar depois.)* Azar atinge o líder como qualquer outro, sem proteção. "Trocar com o último" sorteado para quem já é o último: sorteia outro efeito. Pausa por voz: "Pistache, pausa"; para retomar, dizer "Pistache". Sala da TV com código de 4 letras. Sons essenciais (acerto, azar, bônus, vitória, contagem) e música simples, com botão de silenciar no celular. Reações dos personagens no MVP: base contínua, acerto, azar, bônus, vitória.

### Etapa 5: telas e layout
33. **TV em duas faixas**: dica em cima (~55%, texto enorme, "Dica X/20", pontos em jogo e barra caindo) e **pista em serpentina embaixo** (~40%) com as 25 casas (saída embaixo, chegada em cima). A pista nunca cobre a dica.
34. Nome e pontos ficam em cima de cada personagem na pista (sem placar separado). Líder com coroa e escala maior. Casas especiais viram ícones grandes (azar, Dobro, Ladrão, Turbo).
35. **Celular do operador**: dica atual, pontos em jogo, estado do microfone ("ouvindo"), contagem do timer, botões Pausar e Pular dica (reserva se o microfone falhar; sugestão minha) e botões grandes com os nomes para "Quem acertou?" na zona do polegar.

### Etapa 6: visual e plataforma (parcial)
36. **Direção visual: Palco neon.** Roxo escuro com degradê suave (sem contrastes bruscos), dourado para pontos em jogo, ciano para bônus, rosa suave para azar. Sketch da TV e do celular no canvas "Pistache: sketch Palco neon".
37. **Fontes:** Lilita One (marca, nomes, números) e Fredoka (dicas e interface), ambas festivas e arredondadas (Google Fonts).
38. ~~Personagens "pistachinhos"~~: descartado (dono não gostou do visual). Substituído pela decisão 46.
39. **Pitaco (pasta C:\pitaco) é só referência de visual e ideias; não condiciona o stack.** Pode ser portado, adaptando: lógica pura em TypeScript (`lib/speech/voice-activity.ts` filtro de silêncio, `transcript.ts`, `lib/sound/cues.ts`), os 7 WAVs de `public/sounds` e `scripts/render-sounds.mts` (roda em Node), a lógica de apelido/animal e os rostos de animais em SVG (convertidos para react-native-svg). NÃO portável (usa recursos de navegador): captura de microfone (AudioWorklet), motor de som (Web Audio), confete em canvas e a rota de token em Next.js (reescrever como função serverless simples). Não copiar regras, ranking, vocabulário, salas com polling nem admin.
40. **Sem painel admin** no MVP.
41. **Plataforma: app nativo para iOS e Android** (volta à hipótese inicial: Expo/React Native + TypeScript + Expo Router; a ideia de Capacitor/web foi cancelada). O site existe só para **visualizar a partida** (tela da TV), sem controles, e **já entra no MVP** (decisão 48). O Pitaco não condiciona o stack. A voz precisa de captura de microfone em PCM por módulo nativo (build de desenvolvimento, não Expo Go); validar em protótipo logo no início da construção.
42. **Custo da voz (estimativas, medir no piloto).** Preço Deepgram Nova-3 streaming: US$ 0,0077/min (português único) e US$ 0,0092/min (multilíngue); keyterm +US$ 0,0013/min; plano Growth US$ 0,0065/min só com volume; US$ 200 de crédito.
    - Partida de 12 min, microfone aberto o tempo todo, multilíngue: ~US$ 0,11.
    - Trocar para Nova-3 em português único (confirmar que o pt-BR existe nele): ~US$ 0,09.
    - Abrir o microfone só durante as dicas (~80% do tempo): ~US$ 0,07.
    - Filtro de silêncio do Pitaco (envia só fala, talvez 50 a 60%): ~US$ 0,04. Cerca de 60% menos que o ponto de partida; o crédito de US$ 200 paga ~5.000 partidas.
    - Sem keyterm: aceitar variações de nome na própria carta e comparar no aparelho (não pagar o extra).
    - Um único fluxo de voz por partida (só o celular do operador).
    - Pausa: manter o filtro de silêncio ligado para ouvir só "Pistache".
    - Token de voz curto (duração da rodada) e limite diário de minutos por aparelho no servidor.
    - Microfone desliga após 1 a 2 min sem fala ("ainda está aí?").
    - Cartas empacotadas no app, token em função serverless gratuita e sala em tempo real em plano gratuito (poucas mensagens pequenas).
    - Reconhecimento de voz nativo do aparelho (grátis) fica como experimento depois do MVP.
43. **Paleta e estilo do Pitaco** (substitui as cores da decisão 36): fundo `#130d2f`, painéis `#211747`, lilás `#b18aff`, amarelo `#ffca4b`, verde `#32e397`, laranja `#ff8f3d`, lima `#b7f04a`, vermelho `#ff777b`. Chips arredondados com borda colorida, botão principal lilás com sombra inferior, barras em pílula. Fontes: Lilita One (marca, nomes, números) e Manrope (dica e interface).
44. **Cena da TV: praça em anel** (refina 25 e 33). Dica em faixa no topo; embaixo, calçada isométrica de pedra lilás em anel com as 25 casas, graminha verde-escura em volta e dentro, e o orbe no centro. Casas especiais com objetos (azar: caveira vermelha; Dobro: moedas amarelas; Ladrão: saquinho laranja; Turbo: raio lima). Clima: noite roxa com grama para dar chão.
45. **Orbe central com órbitas**: mostra os pontos em jogo, com três anéis fracos fixos e um anel dourado que encolhe a cada dica (20 a 1). Na revelação o orbe abre e mostra a resposta em verde com check. Descartado: chips com o que foi ouvido (risco de mostrar conversa solta).
46. **Personagens = animais do Pitaco como peões** (substitui 38): rosto de animal em SVG (16 disponíveis no Pitaco) sobre base redonda na cor do jogador, etiqueta com nome legível, coroa no líder, reação triste no azar. Animal atribuído automaticamente na ordem dos nomes. Risco: ficar parecido com o Pitaco; mitigar com bases, acessórios de festa e cores próprias.
47. *(Padrões assumidos, refinar depois.)* Mais de um jogador na mesma casa: ficam lado a lado, menores. Etiquetas dos nomes sempre em pé (sem inclinar) e grandes. O celular do operador segue o mesmo estilo do Pitaco (chips, botão lilás, avatares de animais).
48. **TV no MVP = site de visualização** (confirma 23 e 24): o app nativo do operador controla o jogo; a TV abre uma página web só de leitura, com código de sala, que mostra a cena (dica, orbe, praça). Sem controles na web. Exige sala em tempo real já no MVP (serviço a escolher na etapa 7). O site e o app compartilham regras e visual, sem copiar código do Pitaco. Sem TV, o app funciona sozinho no celular (decisão 18).

### Etapa 3: modos e MVP
22. Contas, compras, anúncios e categorias extras ficam fora do MVP. **Personagens animados na TV entram no MVP**, com poucas animações. Risco de escopo: manter o conjunto mínimo.
21. Categorias no lançamento: **pessoas, lugares e coisas**. Filmes, fatos históricos e outras ficam como pacotes futuros.
20. **100 cartas no lançamento**, com expansão bem definida: conteúdo em pacotes (baralhos) de JSON versionados, separados do código, carregáveis sob demanda e atualizáveis sem nova versão do app. Formato de carta e de pacote a definir na etapa 8; o app não deve carregar todos os pacotes de uma vez (performance).
19. De **2 a 10 jogadores** por partida. O placar e a cena da TV precisam caber 10 personagens sem atrapalhar a leitura da dica.
18. **Um modo de jogo só**: celular completo (dica grande, pontos, placar) e **TV opcional como segunda tela**, já no MVP. Com TV ligada, o celular vira controle do operador. Mesma lógica de jogo nos dois casos; a TV só espelha o estado da partida.
17. **Sem modo offline.** O jogo sempre precisa de internet e usa Deepgram para toda a voz. Não existe juiz em rodízio nem voz no aparelho.

### Etapa 6 (revisão): cena e visual
49. **Pista com curvas, como jogo de tabuleiro clássico** (substitui o anel circular da decisão 44). Calçada de pedras isométricas em S: sai embaixo à esquerda, segue para a direita, curva para cima, volta pelo meio, curva de novo e termina no portão de chegada no alto. O orbe com anéis fica num palco gramado ao lado (à esquerda), fora do caminho. O desenho exato da curva é definido por pontos de uma curva suave (dados, não código fixo) e ajustado no sketch antes da construção.
50. **Peões sem base** (substitui a base da decisão 46): medalha redonda do animal com anel na cor do jogador e sombra no chão, mais a etiqueta de nome. Coroa no líder. Reações: base (balanço leve), acerto, azar, bônus e vitória.
51. **Grama realista no app final**: textura sem emendas (WebP, gerada por IA de imagem ou script) com faixas de corte, variação de tom e vinheta nas bordas, combinando com a noite roxa. O sketch HTML não tem essa grama; só o app.

### Etapa 7: arquitetura técnica (padrões assumidos)
52. **App**: Expo (React Native) + TypeScript + Expo Router, em build de desenvolvimento (EAS). Animações com Reanimated e desenho com react-native-svg; Skia só se faltar desempenho.
53. **Lógica do jogo em TypeScript puro**, sem tela: função `reduce(estado, evento)` com partida, rodada, dicas, pontos, tabuleiro, casas especiais e efeitos. Testes automáticos com ~~Vitest~~ `node:test` do próprio Node (decisão 67). É o único lugar com testes automáticos pesados.
54. **Voz**: captura do microfone por módulo nativo (candidatos: react-native-audio-api e @siteed/expo-audio-studio; escolher no protótipo da Fase 2), WebSocket direto com a Deepgram (Nova-3, pt-BR) usando token temporário. Filtro de silêncio portado do Pitaco. Palavra mágica ("Pistache", "Pistache, pausa") detectada nas transcrições parciais com comparação tolerante. Acerto: texto normalizado (sem acento ou pontuação), aliases da carta e distância pequena de erro (Levenshtein), só em palavras inteiras.
55. **Servidor mínimo**: Supabase (plano gratuito) com uma Edge Function que emite o token da Deepgram (limite por aparelho e por dia) e Realtime Broadcast para a sala. Sem banco de dados e sem contas no MVP.
56. **Sala em tempo real**: o operador cria uma sala com código de 4 letras e envia o estado completo (pequeno) a cada mudança; a TV entra pelo código e recebe. Se a TV entrar ou reconectar, o operador reenvia o estado. A resposta da carta só viaja para a TV na revelação.
57. **Site da TV**: mesma base de código, exportada para web pelo Expo (rota `tv`), só leitura, hospedada de graça (Vercel ou Cloudflare Pages). Não tem voz nem controles.
58. **Estrutura de pastas**: `src/game` (lógica pura e testes), `src/voice`, `src/realtime`, `src/scene` (pista, orbe, peões), `src/ui`, `src/content` (pacotes de cartas), `app/` (telas do Expo Router), `assets/` (sons, texturas), `tools/` (validador de cartas, gerador de sons), `docs/`. Arquivo de contexto `CLAUDE.md` na raiz.
59. **Estado no aparelho**: partida em andamento e histórico de cartas já jogadas guardados localmente, para não repetir carta no mesmo aparelho até acabar o baralho.
60. **Som e toque**: efeitos curtos (WAV/MP3 gerados por script, partindo dos sons do Pitaco) e música simples com botão de silenciar; vibração leve só ao acertar.

### Etapa 8: conteúdo
61. **Formato da carta (JSON)**: `id`, `categoria` (pessoa, lugar, coisa), `resposta`, `aliases` (variações aceitas), `dicas` (20, da mais difícil à mais fácil), `dificuldade` (1 a 3), `notas` (fontes e observações para revisão), `versao`. Pacote = arquivo com `id`, `versao` e lista de cartas.
62. **Lote inicial**: 100 cartas (34 pessoas, 33 lugares, 33 coisas), pacote base empacotado no app, com atualização por arquivo remoto versionado (guardado em cache) depois.
63. **Geração e revisão**: a IA gera em lotes; um validador automático confere 20 dicas, resposta vazando nas dicas, aliases, tamanho, palavras ofensivas e ordem de dificuldade; o dono revisa numa planilha simples (aprovar, ajustar, rejeitar); fatos conferidos em fontes. Pessoas: só figuras públicas conhecidas e sem polêmica; nada de pessoa privada. Dicas escritas do zero, sem copiar textos de terceiros. Conteúdo família.

### Etapa 9: monetização
64. **MVP sem anúncios e sem compras** (confirma decisão 22). Plano para depois: pacotes extras de cartas por compra única via RevenueCat; sem assinatura. Anúncio, se um dia houver, só entre partidas e nunca na TV nem durante a rodada; como o público inclui crianças, evitar anúncios (regras de família das lojas). O custo da voz no lançamento sai do crédito grátis da Deepgram e do limite diário por aparelho.

### Etapa 10: publicação
65. **Checklist**: conta Apple Developer (US$ 99 por ano, aprovação pode levar dias, abrir cedo) e Google Play (US$ 25, taxa única; conferir a regra atual de teste fechado para contas novas); verificar o nome "Pistache" nas lojas e no INPI; política de privacidade em página pública (áudio enviado à Deepgram, sem gravar, sem conta); declarações de privacidade (Apple) e de segurança de dados (Google); texto de permissão do microfone; classificação etária (família, sem conteúdo gerado por usuário); TestFlight e teste fechado; EAS Build e Submit; capturas de tela da TV e do celular, ícone e descrição. Nas notas de revisão da Apple, explicar o uso do microfone e como testar.

### Etapa 11: roteiro de construção (cada fase termina com algo para você testar)
66. **Fases**:
    - **Fase 0 (design e contas)**: ajustar o sketch (pista com curvas, peões sem base) e você aprova o design; em paralelo você abre as contas (Deepgram, Supabase, Expo; Apple Developer cedo por causa da espera). Teste: ver o sketch.
    - **Fase 1 (núcleo do jogo)**: projeto, `CLAUDE.md`, lógica pura com testes (pontos, tabuleiro de 25 casas, efeitos, empate, meta) e uma tela simples de texto jogável com poucas cartas. Teste: jogar uma partida no celular via Expo Go.
    - **Fase 2 (protótipo de voz, o maior risco)**: build de desenvolvimento, microfone, Deepgram, filtro de silêncio, palavra mágica e função de token. Teste: falar "Pistache" e uma resposta e ver a detecção em iPhone e Android; medir custo por minuto.
    - **Fase 3 (partida completa em um celular)**: voz + dicas + timer + "Quem acertou?" + placar, sem arte final. Teste: partida de 10 minutos com a família.
    - **Fase 4 (TV)**: sala de 4 letras, tempo real e site da TV com layout simples. Teste: celular controlando e TV mostrando.
    - **Fase 5 (cena final)**: pista com curvas, orbe, animais, grama, animações, sons e vibração. Teste: partida na TV, lendo a dica a 4 m.
    - **Fase 6 (conteúdo)**: 100 cartas geradas, validadas e revisadas por você.
    - **Fase 7 (robustez)**: reconexão, permissões, tutorial rápido, configurações (meta, som), limites de custo, erros e acessibilidade.
    - **Fase 8 (publicação)**: privacidade, contas, TestFlight e teste fechado, material de loja, envio.
    - **Depois**: pacotes pagos (RevenueCat), mais categorias, mais animações e eventual evolução do site.

## Decisões em aberto
- Palavra de comando para pausar e retomar por voz.
- Revisar depois: se o azar no líder deixar a partida sem graça, criar proteção leve (decisão 32).

## Escopo do MVP
- Um modo só: celular completo + TV opcional como segunda tela.
- 2 a 10 jogadores, partida até 50 pontos (ajustável), 20 dicas por carta.
- Operador com o celular; chutes por voz validados pelo Deepgram; avanço por palavra mágica e timer; pausa por voz.
- Cartas de azar (3 efeitos).
- 100 cartas (pessoas, lugares e coisas) em pacotes JSON versionados.
- **Personagens animados na TV**, um por jogador, com conjunto pequeno de animações (base contínua, acerto, azar, vitória; definir exatamente nas etapas 4 e 6).
- Sempre online.

## Fica para depois
- Contas e login.
- Painel admin e métricas de uso (existem no Pitaco; ficam fora do MVP).
- Plano Growth da Deepgram e voz nativa do aparelho (otimização de custo).
- Site com controles ou jogo completo no navegador (o site do MVP só visualiza a partida).
- Compras no app e anúncios (monetização na etapa 9).
- Categorias extras (filmes, fatos históricos etc.) e pacotes pagos.
- Modo offline (retirado).
- Animações extras, ultrapassagem de líder, música que acelera (a decidir nas etapas 4 e 6).

## Pesquisa de nome (nov/2026)
- NÃO usar "Perfil" (marca da Grow, desde 1988, com app oficial; já existem apps "Jogo Perfil" de terceiros que são risco de derrubada). Evitar também "Identidade Secreta" (jogo da Grow) e "Perfil" em palavras-chave/descrição das lojas.
- "Quem Sou Eu" está saturado (dezenas de apps de mímica). "Retrato" já existe na App Store (jogo de família). "Silhueta"/"Contorno" têm muitos apps.
- Dono tem outro jogo chamado "Pitaco" (baseado em contexto). "Pitaco"/"Palpite" têm cheiro de aposta (Rei do Pitaco, Palpiteiro): evitar.
- Evitar (já existem): Perfil, Identidade Secreta, Na Ponta da Língua, Fica a Dica (todos Grow); Cara a Cara (Estrela); Tava na Cara; Jogo das 3 Pistas / "Pista" (SBT); Adivinha / Adivinhados / Contexto / Password / Charada(s) / Quem Sou Eu; Retrato; Sabichão (Majora, tabuleiro e quiz); Hunch; Aha (AHA Games); Hint Master; Mimo.
- Sem conflito achado na busca web (falta checar Play Store BR e INPI): Pistache (só "Pistache Games", coleção pequena de cartas), Estalo, Mira, Pintou, Caiu a Ficha, Chuta Aí, Arrisca, Lupa, Sacada, Dossiê. Faro: só um jogo de cartas de aposta.
- Dono recusou todas as sugestões de nomes novos até aqui; segue com Pistache e pode reabrir depois.
- Antes de fechar o nome: buscar nas duas lojas e no INPI (registro de marcas).

## Riscos
- Sem modo offline: wifi ruim de festa derruba o jogo inteiro (voz, dicas e placar). Mitigar com tela de aviso de conexão, reconexão automática e dados móveis como reserva. A premissa inicial de modo offline foi retirada.
- Deepgram cobra por minuto de áudio em streaming: cerca de US$ 0,0077/min no preço oficial listado (fontes divergem de 0,0048 a 0,0092); keyterm prompting +US$ 0,0013/min; US$ 200 de crédito grátis ao criar conta. Um microfone aberto por 1 hora ≈ US$ 0,50. Precisa de limite de uso se o app for grátis.
- A chave do Deepgram não pode ficar no app: precisa de um pequeno servidor que gera tokens temporários.
- Áudio sai do celular para um terceiro: exige permissão de microfone, política de privacidade e declarações de dados nas duas lojas; microfone aberto só durante a rodada, indicador visível, sem gravar. Evitar categoria infantil das lojas.
- Ruído e falas paralelas podem gerar falso acerto ou deixar de pegar um acerto; cartas precisam de variações aceitas (apelidos, nomes completos).
- Palavra mágica "Pistache" dita por engano ou não reconhecida (sotaque, ruído) avança ou deixa de avançar a dica; o timer de segurança cobre o segundo caso.
- Se o nome mudar, a palavra mágica muda junto (vive no nome do jogo).
- Marca/nome: mecânica é livre, mas nome, cartas e visual precisam ficar longe da Grow (ver pesquisa de nome).
- Chutes falados em voz alta: se duas pessoas falam a resposta quase juntas, o operador decide quem foi primeiro.
- Voz em app nativo: capturar o microfone em PCM e enviar ao Deepgram exige módulo nativo e build de desenvolvimento; se o módulo escolhido falhar em iOS ou Android, trocar de módulo. Validar em protótipo antes de construir o resto.
- Tempo real já no MVP (celular para TV): wifi ruim derruba a TV, mas o app continua funcionando sozinho no celular; precisa de reconexão automática e aviso na tela.
- O microfone ficará aberto a partida inteira (o Pitaco só abre para palpites): o custo por partida é maior; o filtro de silêncio e o limite por aparelho são obrigatórios desde o MVP.
- Código do Pitaco foi feito para chutes digitados/falados curtos; a escuta contínua da palavra mágica ("Pistache", "pausa") ainda não existe e precisa de teste real em festa.

### Fase 1 e 2 (construção)
67. **Fase 1 feita**: `src/game` (reduce, tabuleiro, efeitos, meta, desempate, sorteio com semente) com 15 testes; tela de texto em `src/app/index.tsx`; 3 cartas de teste em `src/content/packs/teste.json`. Testes com `node:test` (sem instalar nada; substitui o Vitest da decisão 53). Ladrão e Turbo não encadeiam outra casa; na carta de desempate não há efeito de casa; "mudo" vale na 1ª dica da próxima carta.
68. **Fase 2 (protótipo de voz), padrão assumido**: captura com `react-native-audio-api` (`AudioRecorder.onAudioReady`, 16 kHz, mono, converter para Int16), build de desenvolvimento Android via EAS Free. Primeiro teste com a chave da Deepgram só no seu aparelho (arquivo `.env` local, fora do git); depois troca pelo token temporário da Edge Function do Supabase na mesma fase. Teste: falar "Pistache" e uma resposta e ver a detecção.

### Ajuste de jogo mãos livres (Fase 3)
69. **Novo ritmo (substitui 10 e 14).** (a) Timer fixo de **25 s por dica**, visível no celular e na TV; a fala não zera; pausa, janela "quem acertou" e microfone fora congelam; ao zerar, avança; na dica 20, "ninguém acertou". (b) "Pistache" **ou "dica"** avança (só a palavra exata; falso alarme aceito). (c) Metas **70, 100, 150, 200** (padrão 70; 300 descartada: partida de mais de 1h30 e baralho curto); azar e ladrão proporcionais à meta; aviso de tempo estimado e de "poucas cartas". (d) **Microfone aberto a partida toda**, tela sempre acesa, aviso vermelho "MICROFONE FORA" (timer parado) e opção "Jogar sem microfone". (e) A **palavra aparece grande** na TV e no celular assim que a voz ouve a resposta; o **nome falado** de quem acertou confirma em até 8 s (botões como reserva); em "ninguém acertou" o nome de quem chegou mais perto, senão ninguém. (f) "Acertou!" dura 5 s, peão **anda casa a casa** na TV, depois efeito (~6 s) e próxima carta automática. (g) **Tela de ranking removida** (o tabuleiro já mostra); fica a tela final. (h) TV mostra as **2 últimas palavras ouvidas** em caixa fixa. (i) Nomes de jogadores repetidos são bloqueados.
71. **Correção, pop-up e sons.** (a) "Corrigir quem acertou" é só por botão (voz não troca o vencedor): o jogo guarda uma cópia antes de cada pontuação e refaz a rodada com a pessoa escolhida, desfazendo também o efeito da casa; vale para a última rodada (efeito, primeiras dicas da carta seguinte e tela final). (b) Azar e sorte têm pop-up grande na TV (ícone, título, valor, frase com o nome, duas variações), peão reage e o celular vibra. (c) A TV tem internet: sons suaves (WAV, <30 KB cada, gerados por script) são baixados ao ativar o som; a TV tenta ligar o som sozinha ao abrir e, se o navegador exigir um toque, mostra uma faixa amarela "Clique na tela para ativar o som" (qualquer clique, toque ou tecla liga). (d) Timer pulsa nos últimos 5 s com tique-taque, pontos "caem" com animação, confete no acerto e na vitória, dica entra deslizando.
70. **Conteúdo**: categoria **Esportes** (música removida), 184 cartas (30 em cada categoria + Vôlei e 1 de teste). Cartas novas geradas por IA com revisão simples (campo `notas`); revisão completa pendente.
