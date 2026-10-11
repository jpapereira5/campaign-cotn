---
id: c-galeokaerda
nome: Galeokaerda
tipo: npc
facoes:
  - f-consortium
  - f-allegiance
casa: l-cm-m7-royal-library
capitulos:
  - ch4
  - ch5
quer: A Key e o perdão da amiga.
teme: A Allegiance descobrir; os rivais; o aboleth.
tags:
  - espia
  - consortium
  - ruidium
estados:
  - desde: b-5-base-camp
    estado: espia na escavação, dada como desaparecida
  - desde: b-5-a4-double-agent
    estado: capturada ou morta pelos PCs da Allegiance; se passarem 7 dias, desapareceu
  - desde: b-5-b4-key
    estado: aliada dos PCs do Consortium; se passarem 3 dias, morta pelos rivais
relacoes:
  - com: f-allegiance
    tipo: memberOf
    nota: professora adjunta (disfarce)
    origem: livro
  - com: f-consortium
    tipo: memberOf
    nota: occult extollant; espia em Cael Morrow
    origem: livro
  - com: f-allegiance
    tipo: spiesOn
    nota: faz-se passar por professora adjunta na escavação
    origem: livro
  - com: c-insight-acuere
    tipo: betrays
    nota: usou a amizade para entrar em Cael Morrow
    origem: livro
  - com: c-insight-acuere
    tipo: ally
    nota: amizade verdadeira; arrepende-se e quer trazê-la para o Consortium
    ate: b-5-a4-double-agent
    se: até ser desmascarada
    origem: livro
  - com: c-aradrine
    tipo: serves
    nota: espia às ordens de Aradrine
    origem: livro
origem:
  - livro
---

## Resumo

Alta elfa neutral evil, occult extollant do Consortium que se fez passar por professora adjunta de literatura antiga da Allegiance e se tornou amiga de Insight Acuere. Desapareceu na escavação há dias; esconde-se em M7a com o shield guardian Crescent.

## Objetivo

Encontrar a Key to the Netherdeep para o Consortium.

## Segredo

Arrepende-se de trair Insight e sonha convencê-la a mudar de lado quando o Consortium tomar Cael Morrow. Marcas de ruidium nos braços (DC 15 Perception).
