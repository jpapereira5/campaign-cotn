---
id: c-aloysia-telfan
nome: Aloysia Telfan
tipo: npc
facoes:
  - f-consortium
casa: l-ready-room
capitulos:
  - ch2
  - ch3
  - ch4
quer: Escolta para o local de oração (50 a 100 gp por PC); se souber da visão ou da Jóia, fica obcecada em obtê-la para a facção, pois crê que é a chave do ruidium.
teme: Falhar perante os cinco mestres; ser apanhada por Prolix ou por Verin.
tags:
  - investigador
  - consortium
  - vilã-emergente
  - ruidium
estados:
  - desde: b-2-ruins-outside-bazzoxan
    estado: "DM: primeiro encontro: com a patrulha da Vigia da Aurora nas Ruins of Sorrow; observa quem recebe a visão; leva uma lasca de rubídio do centro; fica fixada na Jóia desde já se os PCs lhe contarem"
  - desde: b-3-aloysia-offer
    estado: charme desaparece se recusada; fixada na Jóia se souber da visão
  - desde: b-3-aloysia-offer
    estado: recruta os rivais como músculo (se os PCs a recusarem)
  - desde: b-3-jewel-confrontation
    estado: exige a Jóia à beira da cratera de R16 com os rivais
  - desde: b-3-aloysia-next-move
    estado: foge para Ank'Harel, com ou sem a Jóia; sobrevive ao capítulo de qualquer forma
  - desde: b-4-choose-faction
    estado: recrutadora do Consortium em Ank'Harel (missão Luck's Run)
relacoes:
  - com: f-consortium
    tipo: memberOf
    nota: iniciada oculta; recrutadora
    origem: livro
  - com: f-rivals
    tipo: wantsFrom
    nota: contrata-os como músculo para chegar ao local de oração
    desde: b-3-aloysia-offer
    se: se os PCs recusarem a oferta ou revelarem a Jóia
    origem: livro
  - com: f-rivals
    tipo: ally
    nota: os rivais entregam-lhe a Jóia em R16
    desde: b-3-jewel-confrontation
    se: se os rivais forem indiferentes ou hostis
    origem: livro
  - com: c-prolix-yusaf
    tipo: rival
    nota: agentes de facções rivais no mesmo corredor do Ready Room
    origem: livro
  - com: c-bautha-dyrr
    tipo: knows
    nota: tratada por Bautha depois de se ferir sozinha no Rise
    origem: livro
  - com: c-question
    tipo: spiesOn
    nota: escuta a conversa dos PCs com Question no Ready Room
    origem: livro
  - com: c-vrill
    tipo: serves
    nota: Vrill é o seu superior directo
    origem: livro
  - com: c-aradrine
    tipo: serves
    nota: mensageira de Aradrine
    origem: livro
  - com: c-pc-quasi
    tipo: knows
    nota: reconhece-o de vista; um mentor falou-lhe dele
    origem: pcs
  - com: f-aurora-watch
    tipo: knows
    nota: 'DM: veio com a patrulha de Verin às Ruins of Sorrow, "como perita em folclore"'
    desde: b-2-ruins-outside-bazzoxan
    origem: remix
  - com: c-perigee
    tipo: wantsFrom
    nota: "DM: quer saber o que acorda nas Ruins of Sorrow, o sítio onde a deva morreu; leva de lá uma lasca de rubídio"
    desde: b-2-ruins-outside-bazzoxan
    origem: remix
origem:
  - livro
  - pcs
  - remix
  - zz-mesa-patches
---

## Resumo

Elfa leal e má, iniciada oculta do Consortium of the Vermilion Dream: figura magra de vestes escarlate que escuta conversas no Ready Room. Descreve a fação apenas como um grupo de aficionados de folclore. Página traduzida do livro (Occult Initiate; "Consórcio Escarlate" na mesa) com acrescentos: grimório de anotações sobre Ruidus, rubídio e o Apotheon; frascos lacrados com fragmentos de rubídio de Cael Morrow para infusões em armas/armaduras; símbolo do Consórcio (lua vermelha em cristal) como selo e foco; dois tablets de teleporte sobressalentes que deixa cair se for interrompida na fuga; pode ordenar aos rivais que matem os PCs se recusarem entregar a Jóia; em Ank'Harel reporta a Vrill the Moth.

## Objetivo

Encontrar um antigo local de oração no fundo do Betrayers' Rise e obter ruidium, o mineral carmesim infundido com o poder de Ruidus, para o Consortium.

## Segredo

Já tentou entrar sozinha na Ascensão e saiu ferida (tratada por Bautha); agora contrata mercenários. Traz três tablets de teleporte para um círculo em Ank'Harel e um pergaminho de earthquake. DM (backstory do Quasi): um mentor falou-lhe de visões com um bardo mascarado que anda a ser monitorizado 'pelo líder da fação' (Vesq'ar, sem que ela saiba o que é). Reconhece o Quasi de vista e reporta; não sabe porquê.
