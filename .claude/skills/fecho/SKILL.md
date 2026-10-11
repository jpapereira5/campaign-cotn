---
name: fecho
description: O fecho de uma sessão ou de um bloco de preparação, segundo docs/fluxo.md. Lê a Drive e a camada do DM, escreve a sessão no registo com acontecimentos e efeitos, atualiza as entidades e as decisões, absorve a camada do DM, valida e grava. Usar quando o DM diz «fecho» ou «fecha a sessão».
---

# /fecho: passar o que se jogou para o registo

Os passos estão em `docs/fluxo.md` («O fecho»); o modelo dos acontecimentos e dos efeitos em `docs/arquitetura.md`
(secções 4, 5 e 6); as regras de absorção da camada do DM na skill `vigia`. O que esta skill acrescenta é a ordem de
trabalho e os cuidados.

## Ordem de trabalho

1. `git pull` em `main`. `node scripts/grelha.ts` para ver a camada do DM (beats «jogado à mesa», notas rápidas, planos na coluna da sessão que se jogou, entradas por rever) e `git log --oneline -20 -- grelha/dm.json` para ver o que ele gravou desde o último fecho.
2. Lê a transcrição e a preparação na Drive (as pastas em `docs/fluxo.md`) desde o último fecho. Se não houver transcrição, pede ao DM o resumo dele antes de escrever.
3. Escreve `registo/sessoes/sNN-AAAA-MM-DD.md`, começando pelo ficheiro da sessão anterior como modelo:
   - cabeçalho completo (`id: s-0GG` com o número global, `n`, `global`, `data`, `titulo`, `capitulo`, `mesa`, `ausentes`, `mundo`, `nivel`, `resumo`, `ondeParou`, `beats`, `tags`, `notas`);
   - o resumo no corpo, no tom dos anteriores;
   - os acontecimentos, um por coisa que muda o estado do mundo ou que vale a pena acompanhar: `tipo` (relacao | promessa | escolha | consequencia | pista | cena | estado | registo), `texto` curto, `envolve` (a dona primeiro, pela regra de `src/lib/grelha/dona.ts`), `origem` (os acontecimentos anteriores que este paga), `efeitos` (estado, atitude, posse, sabe, pista, relogio, fio, relacao, contador), `tags` (so-dm, ultima, trunfo), `fechado` quando fecha o fio.
   - cada plano do DM que se jogou vira acontecimento com `origem` e a entrada passa a `revisao.absorbed` (`"d-…": "e-…"`); cada plano que não se jogou fica: a app mostra-o como «plano que ficou para trás» e o DM decide (passa, fica para o capítulo, cai).
4. Atualiza o resto: entidades novas ou corrigidas em `mundo/` (com `origem: [mesa]` ou o que for), fios novos em `plano/fios/` ou `mesa/fios/`, `grelha/linhas.json` para as ids que o DM quer acompanhar, `plano/campanha.md` (`capituloAtual`) se a mesa mudou de capítulo, `registo/decisoes.md` com o que o DM decidiu por fora do jogo. As notas rápidas viram acontecimentos, entidades ou ideias; as marcas `jogado` passam a `beats` no cabeçalho da sessão.
5. Absorve: cada entrada de `dm.json` tratada vai para `revisao.absorbed` ou `revisao.reviewed`; as notas de revisão resolvidas ficam `status: fechada`. Nunca apagues nem edites `dm.json`.
6. Os conflitos com o cânone (um nome diferente, uma data que não bate, um NPC que estava morto) ficam como `discrepancia` em `grelha/revisao.json` e vão para a conversa; não os resolvas sozinho.
7. `python3 scripts/normalizar-texto.py`, `npm run validate`, `npm test`; commit por partes (`registo: sessão N`, `mundo: …`, `grelha: absorver N entradas`) e push. Atualiza a data do último fecho em `docs/fluxo.md`.
8. Na conversa: o resumo em cinco linhas, o que entrou (sessão, entidades, decisões), o que ficou por decidir, e se o deploy já está no ar.

## Cuidados

- Nada entra no cânone sem ter sido jogado ou decidido pelo DM. Na dúvida entre «aconteceu» e «o DM preparou», pergunta.
- Uma id nova segue o esquema (`c-`, `f-`, `l-`, `i-`, `r-`, `b-<cap>-`, `t-`, `amb-`, `p-`), o nome do ficheiro é a id, e `origem` diz de onde veio.
- O repositório é público e a app é só do DM: a tag `so-dm` marca o que não pode ser dito à mesa, e o que é segredo de um jogador para os outros fica com `sabe` no efeito, não no resumo.
- Escreve em português de Portugal, com o glossário de `docs/glossario.md`; o normalizador corrige o resto.
