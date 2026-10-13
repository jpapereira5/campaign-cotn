---
name: runsheet
description: O documento de preparação de uma sessão da CotN, para usar à mesa. Usar quando o DM pede a preparação, o runsheet ou o documento da próxima sessão, ou quando a preparação na Grelha está fechada e falta o papel. Escreve um Google Doc na pasta Session Prep, no formato das preparações anteriores.
---

# runsheet: a preparação de uma sessão, pronta para a mesa

O `/preparar` deixa ideias na Grelha; o `runsheet` transforma o que o DM decidiu num documento que se lê à mesa. O repositório é o cânone: o que o documento disser e contradisser o repositório, ganha o repositório.

## 1. Antes de escrever

- `git pull`; lê o registo da última sessão (`registo/sessoes/`, maior `n`: `ondeParou`, `mundo`, acontecimentos), as decisões desde então (`registo/decisoes.md`), a coluna da sessão na Grelha (`node scripts/grelha.ts`) e os relógios (`plano/fios/t-relogio-*.md`).
- Fichas dos NPCs que entram (`mundo/personagens/`): CA, PV, ataques. Monstros: o livro (PDFs do projeto) e `mesa/regras.md`.
- Formato de referência: `sessao-04-preparacao_v2.md` e «Sessão 06 — Preparação» na pasta Session Prep.
- Pergunta (interativa) o **âmbito**: até onde vai a sessão. Tudo o que estiver por decidir pergunta-se antes de escrever, pela skill `decidir`.

## 2. Estrutura

0. **Onde ficámos** — tabela «Facto da última sessão | O que obriga nesta».
1. **A verdade (só para o DM)** — o que está mesmo a acontecer fora de cena.
2. **Abertura** — texto para ler, em citação (`>`), só sentidos, sem interpretar (ordem Mercer); falas à parte para um jogador, se houver.
3. … **Cenas**, uma secção cada: porquê (o que a cena faz pelos PCs), como corre, NPCs em tabela (CA/PV, o que fazem), regras especiais, ritmo, e «depois de…».
- **Decisões dos jogadores** — tabela «Quem | Quer | Porquê», o que o grupo sabe para decidir, os caminhos e o custo de cada um.
- **Relógios** — tabela por momento da sessão.
- **Ganchos por PC** — uma linha cada.
- **Checklist de mesa** — caixas `[ ]`, uma por coisa que não pode esquecer.

## 3. Regras de escrita

- Português de Portugal; termos de regras em inglês (CON save, *revivify*).
- Textos para ler: curtos, sensoriais, sem psicologia; os nomes só quando a mesa já os sabe.
- Segredos marcados «(só DM)»; nada para os jogadores lerem no mesmo documento, salvo secção própria («Briefing para…»).
- Lembretes de regras que favorecem um PC (ex.: elfos imunes à paralisia dos ghouls) entram no sítio onde se usam e na checklist.

## 4. Publicar

- Google Doc (markdown convertido, **sem** cabeçalho YAML nem linha de tags) na pasta Session Prep (`1WGi5hzOj2oPHEfFmvlwDmJN33X7Ed6h1`), título «Sessão NN — Preparação: <título>».
- Versões novas como documento novo (`v2`); a anterior que tu criaste vai para o lixo.
- Grava nas decisões o âmbito e o que se decidiu pelo caminho (skill `decidir`).
- Na resposta: o link e um resumo de cinco linhas do que a sessão tem.
