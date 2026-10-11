---
id: c-alyxian
nome: Alyxian, the Apotheon
tipo: npc
facoes: []
capitulos:
  - ch1
  - ch2
  - ch3
  - ch4
  - ch5
  - ch6
  - ch7
quer: Que os portadores da Jóia o encontrem; que lhe devolvam a luz; memória e reconhecimento.
teme: Ter sido esquecido por completo; que o seu sacrifício não tenha valido nada.
tags:
  - apotheon
  - semideus
  - prisioneiro
  - visões
estados:
  - desde: b-1-adventure-start
    estado: Prisioneiro adormecido no Netherdeep; consciência a despertar desde que o Consortium recolheu rubídio
  - desde: b-1-jewel-vision
    estado: Desperto; chama pelos portadores da Jóia (Dormant); aponta Bazzoxan
  - desde: b-2-ushru-dawn
    estado: "Alcança outras mentes: o sonho de Ushru; os rivais na estrada se tiverem a Jóia"
  - desde: b-3-prayer-site-avandra
    estado: Fala em R16 (Awakened); responde a três perguntas; a fúria assoma quando fala da colheita de rubídio
  - desde: b-5-temple-arch-heart
    estado: Jóia Exalted em M9; a sua prisão pode ser aberta
  - desde: b-6-theo-and-hunter
    estado: "Dividido em si mesmo: Theo Nathope (inocência) e Alyxian the Hunter (raiva)"
  - desde: b-7-alyxian-speaks
    estado: "Confronto no Heart of Despair: matar, libertar ou redimir; três formas"
  - desde: b-7-ending-worst
    estado: "PROPOSTA: desencadeado; nuvem negra sobre Exandria durante um ano e um dia"
relacoes:
  - com: c-sehanine
    tipo: serves
    nota: "pacto: a primeira prece, nas margens de Wildemount"
    origem: livro
  - com: c-avandra
    tipo: serves
    nota: "pacto: a segunda prece, no Betrayers' Rise"
    origem: livro
  - com: c-corellon
    tipo: serves
    nota: "pacto: a terceira prece, no templo de Cael Morrow"
    origem: livro
  - com: c-sehanine
    tipo: wantsFrom
    nota: que guie os salvadores ao sítio da primeira prece
    origem: livro
  - com: c-avandra
    tipo: wantsFrom
    nota: sorte e liberdade; que a Jóia desperte
    origem: livro
  - com: c-corellon
    tipo: wantsFrom
    nota: a chave da sua prisão (Jóia Exalted)
    origem: livro
  - com: c-elder-ushru
    tipo: knows
    nota: "aparece-lhe em sonho: 'os da gruta' têm de o encontrar"
    desde: b-2-ushru-dawn
    origem: livro
  - com: c-ayo-jabe
    tipo: wantsFrom
    nota: se ela tocar na Jóia, é a ela que chama
    desde: b-1-disputing-destiny
    se: só se Ayo tocou na Jóia
    origem: livro
  - com: f-rivals
    tipo: wantsFrom
    nota: peões alternativos se os PCs falharem; Galsariad é a sua cunha no cap. 6
    desde: b-2-rivals-road-vision
    se: se os rivais tiverem a Jóia ou chegarem ao Netherdeep
    origem: livro
  - com: f-rivals
    tipo: wantsFrom
    nota: quer que também eles o libertem; joga uns contra os outros
    desde: b-6-rivals-n26
    origem: livro
  - com: f-rivals
    tipo: knows
    nota: "PROPOSTA (Remix). visão universal: os rivais também estão ligados ao Apotheon"
    desde: b-1-jewel-vision
    origem: remix
origem:
  - livro
  - act4
---

## Resumo

Herói humano da Calamity, nascido sob Ruidus cheio e tido por amaldiçoado; três vezes pediu poder aos Prime Deities (Sehanine, Avandra, Corellon) e três vezes foi ouvido. Interceptou a lança de Gruumsh sobre Cael Morrow e foi escarnecido por Torog no momento da salvação. Hoje é um semideus preso no Netherdeep, feito de memória, tristeza e ódio; fala através das visões nos sítios de prece. A versão que mostra é a idealizada; por baixo vê os PCs como peões dos deuses.

## Objetivo

Ser libertado e, acima de tudo, ser lembrado e idolatrado por um mundo que o esqueceu.

## Segredo

O Netherdeep amplificou os seus impulsos egoístas; a fúria ferve sob a tristeza. A recolha de ruidium pelos mortais é para ele tortura — e foi ela que o acordou.
