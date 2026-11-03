# Como adicionar cartas e categorias

Tudo é arquivo de dados. Não precisa mexer em código.

## Adicionar uma categoria nova
1. Abra `src/content/categorias.json` e acrescente uma entrada: `id` (minúsculo, sem espaço, com hífen), `nome` (plural, aparece na lista de escolha), `rotulo` (singular curto, aparece no chip da rodada) e `cor`.
2. Ela só aparece na tela inicial depois que tiver pelo menos uma carta.

## Adicionar cartas
1. Crie (ou abra) um arquivo em `src/content/packs/`, por exemplo `animais.json`. Formato:
   `{ "id": "animais", "versao": 1, "cartas": [ ... ] }`
2. Cada carta: `id` único (ex.: `animal-capivara`), `categoria` (id de `categorias.json`), `resposta`, `aliases` (outras formas de dizer, para a voz), `dificuldade` (1 a 3), `dicas` (exatamente 20, da mais difícil para a mais fácil) e, se quiser, `notas`.
3. Se criou um arquivo novo: `npm run cartas:indice`.
4. Sempre: `npm run cartas:validar`. Ele aponta carta repetida, dica faltando, resposta entregue nas dicas, palavra proibida e apelido igual ao de outra carta. Erros precisam ser corrigidos; avisos são para você avaliar.
5. Aumentou algo no pacote? Suba o número de `versao`.

## Pedir um lote para a IA
Cole o texto abaixo, trocando o que está entre colchetes:

> Crie [30] cartas da categoria "[Animais]" para um jogo de adivinhação em português do Brasil. Devolva só JSON, no formato: `{"id":"[animal]-nome-sem-acento","categoria":"[animal]","resposta":"...","aliases":["..."],"dificuldade":1,"notas":"fonte ou observação","dicas":["...20 dicas..."]}`.
> Regras: exatamente 20 dicas, da mais difícil (dica 1) à mais fácil (dica 20); cada dica é uma frase curta (até 140 letras) com um fato verdadeiro; nunca escrever a resposta nem os apelidos nas dicas 1 a 17; só as últimas dicas podem dar pistas diretas (letra inicial, número de sílabas); sem palavrões nem assunto sensível; dificuldade 1 = todo mundo conhece, 3 = só quem gosta do assunto; misture níveis; não repetir respostas já existentes: [cole a lista].

Depois: salvar no pacote, rodar `npm run cartas:validar`, revisar os fatos (as dicas são o ponto mais fraco da IA) e só então jogar.

## Regras que o validador confere
20 dicas · id único · categoria existente · dificuldade 1 a 3 · resposta e apelidos fora das dicas · sem dica repetida · sem apelido igual ao de outra carta · sem palavra de `src/content/proibidas.ts`.
O que ele **não** confere: se o fato está certo e se a ordem de dificuldade faz sentido. Isso é revisão sua.
