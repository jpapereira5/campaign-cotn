---
name: ficha-pc
description: Refazer o documento consolidado de um PC na Drive («<PC> — PC vN», na pasta do próprio PC dentro de cotn_2026/pcs) a partir da ficha do repositório, dos registos das sessões e das decisões do DM. Usar no fecho (passo 11 da fecho, para os PCs afetados pela sessão e para todos quando a mesa muda de capítulo), sem pedir licença sempre que uma revisão, correção ou decisão muda a ficha ou os acontecimentos de um PC (só os PCs afetados), e quando o DM pede o documento de um PC, a ficha consolidada ou «o que o Lucan sabe».
---

# ficha-pc: o documento consolidado de um PC

Um Google Doc por PC, na pasta desse PC (ids no `AGENTS.md`, secção «Para as skills», «PCs»), refeito em cada fecho. É o que o DM lê antes da sessão para ter o PC inteiro à mão; a parte I pode ser exportada para o jogador, a parte II é só do DM.

## Fontes (nesta ordem; nunca inventes)

1. A ficha `mundo/personagens/c-pc-<nome>.md` (cabeçalho e secções).
2. Os registos das sessões (`registo/sessoes/`): os acontecimentos que o envolvem, os efeitos `posse`, `sabe`, `estado`, `relacao` e `contador`, e a secção «Na mesa» de cada sessão. `node scripts/grelha.ts --linha c-pc-<nome>` dá a linha inteira.
3. As decisões sobre o PC, com a data e o número: `python3 scripts/decisoes.py c-pc-<nome> <nome> <alcunhas>` e também pelo familiar, pelo patrono e pelos NPCs do arco dele.
4. Os itens (`mundo/itens/i-*.md` com `para` ou `posse` do PC) e os segredos `r-pc-*` dele.
5. A ambição (`plano/fios/amb-<nome>-*.md`), os fios `t-agenda-*`/`t-laco-*` em que entra e as notas abertas da Grelha na linha dele (`python3 scripts/notas.py --linha c-pc-<nome>`).
6. Os documentos do jogador na Drive (questionário, sessão zero, notas), só para o que o repositório ainda não tem.

## Estrutura do documento

- Título `# <Nome do PC>`; a linha «CotN 2026 · Jogador: … · Documento do DM, não partilhar. A Parte I pode ser exportada para o jogador.»
- **Estado:** «atualizado até ao fim da sessão N (#global, data), com as decisões do DM até AAAA-MM-DD #N»; as fontes (ids do repositório e documentos da Drive); o documento que substitui.
- **Resumo em cinco linhas.**
- **Parte I: O que o jogador sabe** — ficha (raça, classe, antecedente, atributos e o que a mesa usa), equipamento e posses atuais, traços de personagem, origem e família, percurso, motivações, ligações aos outros PCs.
- **Parte II: DM** — a verdade (os segredos com a decisão que os fixou), o arco previsto por capítulo (das decisões e da ambição), ligações a NPCs, «Na mesa até agora» (uma linha por sessão), «Em aberto» (o que falta decidir, numerado), «Ideias substituídas» (o que caiu, com a decisão que o substituiu).
- Segredos `so-dm` de **outros** PCs ficam de fora; os deste PC entram na Parte II.
- Português de Portugal, glossário de `docs/glossario.md`, sem cabeçalho YAML.

## Publicar

1. Google Doc criado a partir de Markdown (`contentMimeType: text/markdown`, sem `disableConversionToGoogleType`) na pasta do PC, título «<PC> — PC v<N+1>».
2. Confere com uma exportação em texto que os títulos todos passaram; depois manda a versão anterior (feita pelo Claude) para o lixo. Os documentos do jogador e do DM nunca se apagam.
   - **Correção pequena fora do fecho** (um nome, uma hora, uma linha; decisão 2026-10-24 #5): em vez de versão nova, edita o Google Doc no sítio (`replaceAllText` com a ferramenta do Google Docs) e acrescenta a mudança à linha «Novidades»/«Estado». A Drive guarda o histórico.
3. Se a ficha do repositório citar o documento antigo pelo nome, corrige a citação (`grep`).
4. Na conversa: uma linha por PC, com a versão e o que mudou desde a anterior.
