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
2. **Lê a transcrição inteira** da sessão (`session_records/<global>_cotn_<n>/transcript_whisperx.txt` na Drive; pastas em `docs/fluxo.md`) e a preparação, desde o último fecho. A transcrição é a fonte do registo; a preparação só serve para distinguir o jogado do planeado; o resumo da Drive **não é fonte** (escreve-se a partir do registo, no passo 9). Se não houver transcrição, pede ao DM o resumo dele antes de escrever e marca os acontecimentos com `fonte: dito pelo DM, AAAA-MM-DD`. Ver «A transcrição», abaixo.
3. Escreve `registo/sessoes/sNN-AAAA-MM-DD.md`, começando pelo ficheiro da sessão anterior como modelo:
   - cabeçalho completo (`id: s-0GG` com o número global, `n`, `global`, `data`, `titulo`, `capitulo`, `mesa`, `ausentes`, `mundo`, `nivel`, `resumo`, `ondeParou`, `beats`, `tags`, `notas`);
   - o resumo no corpo, no tom dos anteriores;
   - os acontecimentos, um por coisa que muda o estado do mundo ou que vale a pena acompanhar, cada um com `fonte: transcrição S<n> (#<global>) <h:mm:ss>`: `tipo` (relacao | promessa | escolha | consequencia | pista | cena | estado | registo), `texto` curto, `envolve` (a dona primeiro, pela regra de `src/lib/grelha/dona.ts`), `origem` (os acontecimentos anteriores que este paga), `efeitos` (estado, atitude, posse, sabe, pista, relogio, fio, relacao, contador), `tags` (so-dm, ultima, trunfo), `fechado` quando fecha o fio.
   - cada plano do DM que se jogou vira acontecimento com `origem` e a entrada passa a `revisao.absorbed` (`"d-…": "e-…"`); cada plano que não se jogou fica: a app mostra-o como «plano que ficou para trás» e o DM decide (passa, fica para o capítulo, cai).
4. Atualiza o resto (cada facto corrigido ou novo passa pela «Propagação», abaixo): entidades novas ou corrigidas em `mundo/` (com `origem: [mesa]` ou o que for), fios novos em `plano/fios/` ou `mesa/fios/`, `grelha/linhas.json` para as ids que o DM quer acompanhar, `plano/campanha.md` (`capituloAtual`) se a mesa mudou de capítulo, `registo/decisoes.md` com o que o DM decidiu por fora do jogo. As notas rápidas viram acontecimentos, entidades ou ideias; as marcas `jogado` passam a `beats` no cabeçalho da sessão.
5. Absorve: cada entrada de `dm.json` tratada vai para `revisao.absorbed` ou `revisao.reviewed`; as notas de revisão resolvidas ficam `status: fechada`. Nunca apagues nem edites `dm.json`.
6. Os conflitos com o cânone (um nome diferente, uma data que não bate, um NPC que estava morto) ficam como `discrepancia` em `grelha/revisao.json` e vão para a conversa; não os resolvas sozinho.
7. **Confere antes de gravar:** relê cada acontecimento contra a marca de tempo que cita (quem fez, quem disse, números, ordem). O que a transcrição não sustenta sai ou passa a pergunta.
8. Grava por partes com `npm run gravar -- "<mensagem>"` (`registo: sessão N`, `mundo: …`, `grelha: absorver N entradas`); o script normaliza, valida, testa, faz commit, `pull --rebase` e push. Atualiza a data do último fecho em `docs/fluxo.md`.
9. **Resumo na Drive:** escreve-o a partir do registo já validado (nunca ao contrário), na pasta `cotn_2026/resumo_de_sessoes` (`1qSNp-FrEsp0k0J2ijMLUJ0XLlAqy5mn-`), como Google Doc criado a partir de Markdown.
10. **Documentos dos PCs na Drive:** em cada fecho, refaz o documento consolidado de cada PC pela skill `ficha-pc` (fontes, estrutura e publicação estão lá): um por PC, na pasta do PC, versão seguinte, a anterior para o lixo.
11. **Cópia do repositório na Drive:** depois do push, atualiza a cópia de leitura em `cotn_2026/github_repo` pela skill `copia-drive` (só as peças que mudaram, manifesto no fim). Não espera pela tarefa diária.
12. **Registo da mesa:** atualiza o «Índice de sessões» e os «Jogadores» (Google Docs na pasta `tabletop` da Drive) com a sessão fechada, pela skill `registo-mesa`: o número global, a data, o título, a mesa e uma nota do que aconteceu, tudo tirado do registo.
13. Na conversa: o resumo em cinco linhas, o que entrou (sessão, entidades, decisões), o que ficou por decidir, se o deploy já está no ar e quantas peças da cópia na Drive foram atualizadas, e o que mudou no registo da mesa.

## A transcrição

- **É a verdade do que se disse à mesa.** Lê-a toda, não por amostras. Se o ficheiro vier truncado, descarrega-o e lê-o do disco; diz no fim até onde leste.
- **As lapelas apanham todas as vozes**: a etiqueta do orador não diz quem falou. Atribui pelo que o DM narra a seguir («tu separas a adaga…»), pelo modificador do dado, pela personagem tratada pelo nome e pela continuidade. Se não fechar, é uma `pergunta` ao DM, não um palpite.
- **O ASR estropia nomes e números.** Nomes: usa o cânone quando é claramente o mesmo («Corvel» = Corvelo); quando o DM diz de facto outro nome, é discrepância. Números: se um valor não se ouve, escreve «~» ou «por confirmar».
- **Separa o jogado do preparado e do saber do DM.** O que está na preparação mas não se ouve na transcrição não aconteceu. O que o DM sabe mas não disse (a língua, a natureza de um demónio, um nome) entra marcado «(DM)» ou com `so-dm`, nunca como coisa que os PCs sabem.
- **Retcons ditos à mesa** («vou ter de fazer retcon…») corrigem o registo da sessão anterior com uma nota.

## Propagação

O mesmo facto vive em vários sítios (o registo, a ficha do NPC, a do PC, o item, o fio, o beat, as regras). Antes de dares uma correção por feita, faz `grep -rn` no repositório pelas palavras-chave do facto errado (nome, número, frase) e corrige todas as ocorrências; só depois fechas a nota. Os arquivos da migração (`docs/arquivo/grelha-semente.json`, `docs/arquivo/migracao-fase-a.md`) ficam como estão.

## Cuidados

- Nada entra no cânone sem ter sido jogado (com marca de tempo na transcrição) ou decidido pelo DM. Na dúvida entre «aconteceu» e «o DM preparou», pergunta.
- Uma id nova segue o esquema (`c-`, `f-`, `l-`, `i-`, `r-`, `b-<cap>-`, `t-`, `amb-`, `p-`), o nome do ficheiro é a id, e `origem` diz de onde veio.
- O repositório é público e a app é só do DM: a tag `so-dm` marca o que não pode ser dito à mesa, e o que é segredo de um jogador para os outros fica com `sabe` no efeito, não no resumo.
- Escreve em português de Portugal, com o glossário de `docs/glossario.md`; o normalizador corrige o resto.
