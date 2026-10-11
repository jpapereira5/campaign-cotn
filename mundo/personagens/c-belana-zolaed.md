---
id: c-belana-zolaed
nome: Belana Zolaed
tipo: npc
facoes:
  - f-luxon
  - f-kryn
casa: l-temple-of-the-luxon-jigow
capitulos:
  - ch1
quer: Que ninguém alarme o povo; almas que decifrem o seu percurso.
teme: Perder o controlo do templo para a Vigia ou para o arcanista; que a febre saia do templo.
tags:
  - luxon
  - jigow
  - mesa
  - encobrimento
estados:
  - desde: b-1-treasure-hunt
    estado: dá a última pista da Caça ao Tesouro ("os meios justificam o fim"); desce do 2.º andar preocupada (pescador corrompido)
  - desde: b-1-luxon-coverup
    estado: esconde Verran e o pescador; templo fechado com vigias à porta
  - desde: b-1-velnari-confrontation
    estado: recebe Velnari por teleport e trata-o
relacoes:
  - com: f-luxon
    tipo: memberOf
    nota: guardiã do Temple of the Luxon em Jigow
    origem: livro
  - com: c-velnari-zeth
    tipo: knows
    nota: trata-o no templo depois do confronto; "Agora é que as coisas ficaram interessantes"
    desde: b-1-velnari-confrontation
    origem: mesa
  - com: c-grok-e-verran
    tipo: protects
    nota: esconde Verran (e o pescador corrompido) no 1.º andar do templo
    desde: b-1-ifolon-plunge
    origem: mesa
  - com: f-aurora-watch
    tipo: ally
    nota: a Vigia guarda a porta do templo e escolta os doentes para lá
    desde: b-1-luxon-coverup
    origem: mesa
origem:
  - livro
  - mesa
---

## Resumo

Drow sacerdotisa NG, guardiã do Temple of the Luxon em Jigau (J8). Dermot estuda aqui as preces do Luxon. alta, pele escura com tons violeta, olhos prateados, vestes de seda azul-escura com padrões dodecaédricos; reservada, lógica, fala pouco e escuta tudo, evita contrações. "Cada luz reflecte uma parte tua." PV 22, CA 14, toque mental +5 (2d6 psíquico). Na mesa: ofereceu uma mote of possibility a Rakent no 3.º andar; explicou que a dunamancia manipula tempo e espaço; "Qual o valor de uma alma? Os meios justificam os fins?"; mostrou a Rakent que o livro de contos dele contém find familiar.

## Objetivo

Guiar os fiéis nas Caminhadas da Alma e manter estável a presença do Luxon em Jigau, sem interferência de outras fações; observa os rivais, sobretudo Dermot.

## Segredo

Encobre os doentes de rubídio: o pescador corrompido e Verran estão escondidos no 1.º andar do templo, crianças dos Orelhudos ao seu cuidado; Nessa ajuda; a Vigia guarda a porta. Tratou Velnari depois do confronto (ouviu-lhe "Agora é que as coisas ficaram interessantes"). Sob o altar esconde um medalhão partido, ligado a um ritual mal sucedido. Concede a Dádiva da Possibilidade (mote of possibility) só a quem esteja numa bifurcação moral.
