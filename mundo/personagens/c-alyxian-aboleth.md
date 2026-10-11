---
id: c-alyxian-aboleth
nome: O Alyxian Aboleth
tipo: npc
facoes: []
casa: l-cm-m11-kelp-forest
capitulos:
  - ch5
quer: Que o reconheçam como Alyxian (DC 25 Persuasion, DC 15 com a Jóia).
teme: Ser desmentido; retira-se para a toca a metade dos hp.
tags:
  - cael-morrow
  - monstro
  - ruidium
  - falso-alyxian
estados:
  - desde: b-5-poisoned-emotions
    estado: atormenta a escavação com Poisoned Emotions
  - desde: b-5-temple-arch-heart
    estado: perde as Poisoned Emotions (bênção de Corellon)
  - desde: b-5-b5-aboleth
    estado: morto (Track B)
  - desde: b-5-c5-enemy-of-enemies
    estado: aliado dos PCs, persegue os rivais (Track C, se convencido)
relacoes:
  - com: f-allegiance
    tipo: enemy
    nota: atormenta a escavação com Poisoned Emotions
    origem: livro
  - com: f-rivals
    tipo: enemy
    nota: persegue os rivais a pedido dos PCs
    desde: b-5-c5-enemy-of-enemies
    se: se os PCs o convencerem (C5)
    origem: livro
  - com: c-alyxian
    tipo: knows
    nota: julga ser o Apotheon
    origem: livro
  - com: c-olara
    tipo: enemy
    nota: a sua proximidade corrói-lhe a memória
    origem: livro
origem:
  - livro
---

## Resumo

Aboleth mutado pelo ruidium que acredita ser o Apotheon. Vive na Kelp Forest (M11), vagueia por M8 e M17, guarda o rift e atormenta telepaticamente toda a escavação com Poisoned Emotions.

## Objetivo

Defender o 'seu' domínio e afirmar a sua divindade.

## Segredo

Não é Alyxian: é a primeira pista de que o Apotheon que os PCs perseguem pode não ser um herói. Perde as Poisoned Emotions quando a consciência de Alyxian se manifesta em M9.
