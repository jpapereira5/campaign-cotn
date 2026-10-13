---
name: arcos
description: Arcos narrativos dos PCs da CotN. Usar quando se fala do percurso, dos segredos, das descobertas ou do futuro de um PC (ou de todos), ou quando o DM traz ideias novas para uma personagem. Cerca de três descobertas por personagem e por capítulo; cânone separado de proposta; propostas apresentadas como perguntas interativas.
---

# arcos: o percurso de cada PC ao longo da campanha

## Princípio

Cerca de **três descobertas por personagem e por capítulo** (segredos, pistas, cenas pessoais). Uma descoberta é algo que a personagem fica a saber ou a sentir, não um acontecimento qualquer.

## 1. Ler

- PCs: `mundo/personagens/c-pc-*.md` (quer, teme, resumo, segredo).
- Segredos: `mundo/segredos/r-pc-*.md` (verdade e `pistas`).
- Ambições e agendas: `plano/fios/amb-*.md`, `plano/fios/t-agenda-*.md`.
- Capítulos: `plano/campanha.md`; beats por capítulo: `plano/beats/b-<cap>-*.md`.
- Decisões: `registo/decisoes.md`. Notas na Grelha: `node scripts/grelha.ts --linha c-pc-<nome>`.
- Na Drive: os documentos de cada jogador (ex.: pasta `Camila` para a Lia) e os arcos anteriores em `cotn_2026/ideias`.

## 2. Fazer o balanço

Por PC: o que já está no cânone, o que tem zero pistas, o que só aparece tarde (capítulos sem nada), o que cruza com outros PCs. Diz sem rodeios quem está mais fraco e porquê. Assinala incoerências de calendário e de lore.

## 3. Propor

- Documento na Drive, pasta `cotn_2026/ideias` (`1MIP9LYli1gLw7DMgz5UYruOzhkbnrP6j`), `arcos dos PCs AAAA-MM-DD vN.md` (`text/markdown`, sem conversão), versões novas e a anterior para o lixo.
- Por PC: uma frase-tema («Quem és tu sem Baeshra?»), os fios, e por capítulo três descobertas numeradas, cada uma marcada **[cânone]** (com a decisão ou o ficheiro) ou **[proposta]**. Detalhe do capítulo atual até dois ou três capítulos à frente; o resto em esboço.
- Uma secção «Cruzamentos» e uma secção «Por decidir».
- Nunca inventes como cânone: cada proposta nasce de algo nos ficheiros e diz de onde nasce.

## 4. Decidir

- As propostas vão ao DM como **perguntas interativas**: uma pergunta `multiSelect` por PC (ou por capítulo, se forem muitas), até 4 opções, cada opção com a proposta numa linha.
- As respostas em texto livre muitas vezes reformulam a proposta; segue o que ele disser.
- O aprovado grava-se pela skill `decidir` (decisões, ficheiros, Grelha nas colunas `ch1`, `ch2`…). O rejeitado fica em «Ficam de fora» nas decisões e na secção «Rejeitado» do documento.
- No fim, documento novo «(decidido)» só com o cânone e a lista do rejeitado.
