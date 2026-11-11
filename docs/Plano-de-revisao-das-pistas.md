# Plano de revisão das pistas

Objetivo: a pista 1 não pode ser "fácil". Quem acerta cedo deve ter feito por merecer, e as pistas devem ir ficando mais fáceis de verdade, uma a uma.

## Régua (vale para as 20 pistas de cada carta)
- **1 a 5 (difíceis):** a pista 1 serviria para pelo menos 10 respostas diferentes. Nada icônico, nada que todo mundo associa na hora.
- **6 a 12 (médias):** fatos de verdade, que afunilam (origem, época, características).
- **13 a 17 (fáceis):** o que a maioria das pessoas sabe sobre o assunto.
- **18 a 20 (entrega):** número de sílabas, letra inicial, "começa com...".
- Cada pista dá um fato novo, em frase curta. Nenhuma repete a anterior.

## Já feito
- 7 cartas só reordenadas (nenhum fato mudou, `versao` do pacote subiu): Canguru, Coruja, Golfinho, Pipoca, Brigadeiro, Coxinha e Pudim. A pista fácil que abria a carta foi para o fim do meio. O script é `tools/reordenar-pistas.mjs` e dá para reutilizar.

## O que vi nas 184 cartas
- **Coisas (30):** as pistas 1 a 3 são genéricas demais ("É um objeto portátil", "É um eletrodoméstico"). Não são fáceis, são sem graça e servem para dezenas de objetos. Precisam de pistas novas.
- **Lugares (30):** as pistas 1 e 2 só dizem o continente ("Fica na Europa"). Precisam de um fato curioso no lugar do continente, que passa para a pista 5 ou 6.
- **Animais e comidas (60):** a maioria está boa; uns 10 a 15 têm uma pista fácil logo no começo (festa de aniversário, cinema, "vive perto de barcos"). Resolve reordenando.
- **Pessoas (30) e Esportes (31):** a curva está boa (data e lugar de nascimento no começo). Só conferir os famosos demais (Pelé, Neymar, Messi).

## Etapas (da mais rápida para a mais demorada)
1. **Reordenar o que já tem (rápido):** ler as pistas 1 a 4 de cada carta de animais e comidas, marcar as fáceis e reordenar com o script. Cerca de 1 sessão curta.
2. **Pessoas e Esportes (rápido):** só conferir os famosos e ajustar a ordem.
3. **Lugares (médio):** escrever uma pista nova de fato curioso para cada carta e passar o continente para a frente da carta do meio. Em lotes de 10 cartas; você revisa os fatos.
4. **Coisas (demorado):** reescrever as pistas 1 a 8 das 30 cartas. A IA propõe, você revisa os fatos (é o ponto mais fraco da IA).
5. **Medir de verdade:** guardar no celular em qual pista cada carta foi acertada. Depois de algumas partidas, as cartas que caem sempre nas pistas 1 a 3 são as que ainda estão fáceis. Isso é uma ideia para depois, só se você quiser.

## Como revisar cada lote
1. Eu leio as pistas e devolvo uma lista: carta, problema, nova ordem ou pista nova.
2. Você aprova ou corrige os fatos.
3. Aplico, rodo `npm run cartas:validar` e `npm run cartas:indice`, e o pacote ganha `versao` nova.

## Resultado da revisão (todas as categorias)
Só reordenação, nenhum fato mudou. Pistas genéricas continuam no início; as muito óbvias foram para o fim das primeiras 6.
- Animais: canguru, coruja, golfinho, panda, flamingo, arara-azul, beija-flor, morcego, gorila, tamanduá-bandeira, tartaruga.
- Comidas: pipoca, brigadeiro, coxinha, pudim, feijoada, pão de queijo, sushi, pão francês.
- Esportes: judô, boxe, triatlo, futevôlei.
- Lugares: Taj Mahal, Big Ben, Monte Everest.
- Pessoas: Pelé, Tiradentes.
- Coisas: sem mudanças (pistas já genéricas).

## Segunda revisão (v2): "ainda está muito fácil"
Problema: as pistas 3 a 6 já afunilavam a resposta (nome do estado, equipamento, "duas rodas", "Minas Gerais"...). 
Feito em TODAS as 182 cartas: as pistas que identificam (lugar, nome do objeto, personagem famoso, parentes óbvios) foram para depois da pista 11; o começo ficou com fatos vagos, curiosidades e contexto. Em Coisas (30 cartas) foram escritas 5 pistas novas por carta (história, curiosidades, hábitos de uso); em Animais, 6 cartas ganharam 1 a 2 pistas novas; em Comidas, Esportes, Lugares e Pessoas foi só reordenação.
Pedidos guardados em `tools/pedidos/*.mjs` (rodar de novo embaralha: não rodar).
Ainda a conferir por você: os fatos das pistas novas (notas das cartas marcam "pistas refeitas v2").
