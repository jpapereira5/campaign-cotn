---
id: c-insight-acuere
nome: Professor Insight Acuere
tipo: npc
facoes:
  - f-allegiance
casa: l-cm-m3-base-camp
capitulos:
  - ch4
  - ch5
quer: A tabuinha de M10 e a segurança da sua equipa.
teme: Perder a escavação; a voz que atormenta Scribble.
tags:
  - allegiance
  - cael-morrow
  - contacto
estados:
  - desde: b-5-a4-double-agent
    estado: informada da traição de Galeokaerda (se os PCs lho disserem)
  - desde: b-5-c4-insight
    estado: aliada dos PCs da Cobalt Soul; revela a localização do rift
relacoes:
  - com: f-allegiance
    tipo: memberOf
    nota: chefe do acampamento-base
    origem: livro
  - com: c-scribble
    tipo: ally
    nota: equipa do acampamento-base
    origem: livro
  - com: c-xot
    tipo: ally
    nota: equipa do acampamento-base
    origem: livro
  - com: f-cobalt-soul
    tipo: ally
    nota: revela o rift e a chave aos PCs da Cobalt Soul
    desde: b-5-c4-insight
    se: se os PCs seguirem a Cobalt Soul
    origem: livro
  - com: f-consortium
    tipo: enemy
    nota: só coopera com o Consortium se enganada ou magicamente forçada
    origem: livro
origem:
  - livro
---

## Resumo

Tiefling lawful good, professora adjunta de arqueologia e chefe do acampamento-base da Allegiance em Cael Morrow. Devota ao projecto ao ponto de arriscar a vida por ele; a sua maior preocupação é o paradeiro da amiga Galeokaerda.

## Objetivo

Descobrir os escritos do herói que tentou salvar Cael Morrow durante a Calamity.

## Segredo

Não sabe que Galeokaerda é a espia do Consortium. Pode chamar 10 agentes e 5 escavadores por sending stone.
