---
id: c-jmon-sa-ord
nome: J'mon Sa Ord
tipo: npc
facoes:
  - f-cerulean-palace
casa: l-cerulean-palace
capitulos:
  - ch4
  - ch5
  - ch7
  - ch8
quer: Ordem, prosperidade e conhecimento controlado.
teme: Que Cael Morrow traga de volta algo que valia a pena manter selado.
tags:
  - governante
  - dragão
  - fundo
estados:
  - desde: b-4-choose-faction
    estado: "PROPOSTA: recluso; autorizou a escavação de Cael Morrow e observa através de Gemeshega"
  - desde: b-5-open-rift
    estado: "PROPOSTA: o palácio reage ao rift; o dragão sobrevoa a cidade à noite"
  - desde: b-7-ending-worst
    estado: "PROPOSTA: ergue-se contra Alyxian na Noite de Ruidus; repelido e ferido"
  - desde: b-7-chamber-of-judgment
    estado: "PROPOSTA: julga os PCs; confessa a sua culpa; financia a reparação"
relacoes:
  - com: f-cerulean-palace
    tipo: memberOf
    nota: fundador e governante
    origem: act4
  - com: f-allegiance
    tipo: knows
    nota: "autorizou a escavação de Cael Morrow (PROPOSTA: e arrepende-se)"
    origem: act4
  - com: f-hands-of-ord
    tipo: protects
    nota: fundou as Hands of Ord; comanda-as na Noite de Ruidus
    origem: act4
  - com: c-alyxian
    tipo: enemy
    nota: "PROPOSTA: ergue-se contra o Apotheon desencadeado"
    desde: b-7-ending-worst
    origem: act4
origem:
  - livro
  - act4
---

## Resumo

Governante de Ank'Harel há mais de 400 anos: um antigo dragão de latão lawful neutral que raramente se mostra. Fundou as Hands of Ord e honrou os Scarbearers; depois de décadas de petições, autorizou finalmente a Allegiance a abrir Cael Morrow.

## Objetivo

Manter a cidade ordeira sob o Code of Ord e observar o que a escavação traz à superfície.

## Segredo

Os rumores dizem que é um archfey, um semideus disfarçado ou várias pessoas a fingir ser uma só. Ninguém sabe ao certo.
