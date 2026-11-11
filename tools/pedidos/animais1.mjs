// 17 itens (novas + antigas) + as 3 últimas antigas (18 a 20).
const g = (...itens) => [...itens, 18, 19, 20];
export default {
  'animal-capivara': g(1, 'Uma das poucas espécies que ajuda a cuidar dos filhotes de outras fêmeas do bando.', 3, 7,
    'Os machos têm uma glândula no focinho que usam para marcar território.', 4, 9, 2, 6, 5, 8, 10, 16, 14, 12, 15, 13),
  'animal-elefante': g(1, 3, 2, 'Na natureza, caminha dezenas de quilômetros por dia atrás de comida e de água.', 4, 5,
    'O cérebro é o maior entre os animais que vivem em terra.', 7, 8, 9, 6, 10, 15, 11, 16, 13, 12),
  'animal-girafa': g(1, 2, 'Aparece em pinturas rupestres da África feitas há milhares de anos.', 3, 6, 9, 8, 7, 10, 11, 4, 5, 14, 16, 15, 12, 13),
  'animal-pinguim': g(1, 2, 3, 'Em algumas espécies, os casais se reencontram na mesma colônia ano após ano.', 6, 4, 5, 7, 8,
    'Fósseis mostram espécies antigas tão grandes quanto um adulto humano.', 10, 13, 12, 9, 14, 11, 15),
  'animal-golfinho': g(1, 2, 'Em certas regiões, usa esponjas do fundo do mar para proteger o focinho ao procurar comida.', 3, 5, 4,
    'Em Laguna, Santa Catarina, pescadores e esses animais trabalham juntos para pegar peixes.', 6, 7, 8, 9, 10, 11, 12, 13, 16, 14),
  'animal-tubarao': g(1, 3, 4, 2, 6, 5, 7, 8, 9, 10, 11, 13, 14, 12, 16, 15, 17),
  'animal-onca-pintada': g(1, 'Os filhotes ficam com a mãe por até dois anos antes de seguirem sozinhos.', 2, 4, 6, 8, 9, 5, 10, 11, 3, 7, 13, 14, 16, 12, 15),
  'animal-tartaruga': g(1, 2, 3, 7, 4, 8, 9, 10, 11, 12, 13, 5, 6, 15, 14, 16, 17),
  'animal-polvo': g(1, 11, 2, 5, 6, 8, 9, 4, 3, 7, 12, 13, 15, 10, 16, 14, 17),
  'animal-camaleao': g(3, 1, 2, 4, 5, 8, 9, 10, 11, 7, 6, 13, 14, 12, 16, 15, 17),
  'animal-canguru': g(1, 2, 3, 10, 4, 8, 11, 5, 6, 7, 15, 13, 9, 14,
    'Na barriga da mãe existe uma bolsa, chamada marsúpio, onde o filhote termina de crescer.', 16, 17),
  'animal-panda': g(1, 7, 8, 9, 10, 2, 12, 13, 3, 6, 4, 5, 11, 15, 14, 16, 17),
  'animal-flamingo': g(1, 2, 3, 7, 8, 9, 10, 11, 12, 4, 13, 5, 6, 16, 14, 15, 17),
  'animal-tucano': g(1, 2, 8, 3, 4, 5, 6, 7, 9, 10, 17, 12, 11, 13, 14, 15, 16),
};
