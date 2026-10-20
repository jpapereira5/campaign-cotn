# Call of the Netherdeep (Contos & Escudos)

Este repositório é a fonte de verdade da campanha Call of the Netherdeep do DM João Pereira (Contos & Escudos), em português de Portugal. Alimenta o DM dashboard (GitHub Pages), usado à mesa. Lê primeiro `README.md` (estrutura e app), `docs/arquitetura.md` e `docs/fluxo.md`.

## Skills

Os procedimentos de trabalho estão em `.claude/skills/<nome>/SKILL.md` (Markdown simples com cabeçalho `name`/`description`; qualquer ferramenta os pode seguir).

- **Genéricas** (cópia-mãe no repositório `jpapereira5/dnd-skills`; aqui ficam cópias): `decidir`, `arcos`, `capitulo`, `npc`, `local`, `batalha`, `livro`. Uma mudança a uma delas faz-se primeiro no `dnd-skills` e copia-se para cá.
- **Uma mudança a uma skill atualiza-a em todo o lado, na mesma conversa:** (1) `jpapereira5/dnd-skills` se for genérica, (2) `.claude/skills/` deste repositório, (3) as skills da conta do claude.ai (proposta de atualização com o SKILL.md completo) e (4) a cópia de leitura na Drive, pasta `DND/skills/` (`1gM_AotFxw0zPAjFV14XwDVRAZcRe7A6H`): um `<nome>.md` por skill (`text/markdown`, sem conversão; as só da CotN como «<nome> (só CotN).md»), versão nova como ficheiro novo e a anterior para o lixo; (5) os documentos do Projeto «Dungeons & Dragons» do claude.ai, `skills/<nome>.md` (as só da CotN como «skills/<nome> (só CotN).md»), reescritos no mesmo caminho. O repositório tem uma cópia de leitura na Drive, `cotn_2026/github_repo` (`1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R`): um documento por peça do cânone e um manifesto, atualizados pelo Claude numa tarefa agendada diária, só com as peças que mudaram (`docs/copia-drive.md`). Ninguém a escreve à mão nem a usa como fonte.
- **Só deste projeto** (dependem da Grelha): `preparar` (a leitura da Grelha e o documento de preparação da sessão; a antiga skill genérica `runsheet` foi fundida nela a 2026-10-19), `fecho`, `vigia`.

## Para as skills

O que é próprio da CotN. As skills genéricas leem esta secção.

- **Língua e glossário:** português de Portugal, Acordo Ortográfico de 1990; termos de regras em inglês quando a mesa os usa assim. Glossário canónico: `glossario_pt_v8.md` na Drive (e `docs/glossario.md`). Exemplos: Forte Ventura, Pântano do Véu-Quebrado, Ascensão dos Traidores, Jigau, Jorhas.
- **Cânone** (um ficheiro por coisa, Markdown com cabeçalho YAML; `docs/arquitetura.md`, secções 3 e 4):
  - `mundo/personagens/c-*.md` (PCs, NPCs), `mundo/facoes/f-*.md`, `mundo/locais/l-*.md`, `mundo/itens/i-*.md`, `mundo/segredos/r-*.md` (verdades e `pistas`);
  - `plano/campanha.md` (capítulos, capítulo atual), `plano/beats/b-<cap>-*.md` (`estado: proposta` até o DM aprovar), `plano/fios/` (`a-*` arcos, `amb-*` ambições, `t-relogio-*` relógios com `passos`, `t-agenda-*`, `t-frente-*`…);
  - o campo `origem` diz de onde vem (`livro` sozinho = como no livro);
  - ids em minúsculas, sem acentos, com hífen; o nome do ficheiro é a id; as do livro em inglês, as criadas pela mesa em português; a ficha de um PC usa o nome da personagem (`c-pc-boblin`, não o do jogador).
- **Formato das fichas:** copia o cabeçalho de uma ficha do mesmo tipo. NPC: `id`, `nome`, `tipo: npc`, `facoes`, `casa`, `capitulos`, `quer`, `teme`, `tags`, `legenda`, `relacoes`, `origem`, e as secções `## Resumo`, `## Objetivo`, `## Segredo`. Local: `id`, `nome`, `pai`, `capitulo`, `origem`, `## Resumo`.
- **Decisões:** `registo/decisoes.md`, secção `## Decidido pelo DM (AAAA-MM-DD)`, itens numerados, frase a negrito com a decisão; «Ficam de fora: …» para as rejeitadas. No ficheiro da coisa, «(Decidido pelo DM (AAAA-MM-DD))».
- **Notas para o DM (a Grelha):** `grelha/revisao.json` → `notes`: `id` nova `n-<prefixo>-NN`, `at`, `kind` (`ideia`, `aviso`, `pergunta`), `target: {row, col}` (a linha é uma id que exista em `grelha/linhas.json`; a coluna é `s<N>` para a próxima sessão ou `ch1`, `ch2`… para capítulos), `factKind`, `text`, `suggestion`, `because: ['registo/decisoes.md AAAA-MM-DD #N']`, `tags: ['so-dm']` nos segredos, `status: aberta`. Fechar uma nota: `status: fechada` e «[substituída: … decisão AAAA-MM-DD #N]» no fim do texto. Uma id nova que deva aparecer na Grelha vai para `grelha/linhas.json`.
- **Acontecimentos jogados** descobertos depois: no registo da sessão (`registo/sessoes/`), com `fonte: dito pelo DM, AAAA-MM-DD`. Regra da dona (`src/lib/grelha/dona.ts`): uma `pista` precisa de um só segredo em `envolve`; senão usa `cena`.
- **PCs:** fichas em `mundo/personagens/c-pc-*.md`; um documento consolidado por PC («<PC> — PC vN») na Drive, na pasta do próprio PC, dentro de `PCs` (`1DlPuhGA7npun4bEQ7ZD7vGm3Tka9ZJot`): Lucan em «Renata - Lucan» (`1RDRUjrj_rvD_TF1_vuVj5Kd1CONzoYZH`), Isco em «Pedro Ropio - Isco» (`1qPaKJ7UmY-Jdb6_bolA3_-Ju-Qa1oYP_`), Quasi em «Pedro Silva - Quasimodo» (`1Ln06qMK1zkDpgC6BkeTGR04JFRZSxKjj`), Lia em «Camila - Lia» (`1BjFqdDVnXiBCrDh82SwipwHegeHzGgxl`), Tiago Rosa em «Tiago Rosas» (`1ECr46SahWbFmiszsdHCKnHCLaf6sZ0NA`). A pasta `PCs_Claude` foi para o lixo a 2026-10-20. Fichas completas no D&D Beyond dos jogadores.
- **Livros e regras:** os PDFs (Call of the Netherdeep, Explorer's Guide to Wildemount, Tal'Dorei Reborn) estão no Projeto «Dungeons & Dragons» do claude.ai (pesquisa do projeto); a extração do livro está em `livro/` (JSON, só leitura). Regras da casa em `mesa/regras.md`, incluindo a tabela «Componentes verbais em latim (DM)» (fonte: «All Latin spell chants», BG3).
- **Drive:** preparações de sessão e folhas de batalha na pasta `Session Prep` (`1WGi5hzOj2oPHEfFmvlwDmJN33X7Ed6h1`); ideias, arcos e capítulos em `cotn_2026/ideias` (`1MIP9LYli1gLw7DMgz5UYruOzhkbnrP6j`), como `.md` (`text/markdown`, sem conversão). Google Docs sem cabeçalho YAML. Versões novas como ficheiros novos (`v2`); a anterior criada pelo assistente vai para o lixo; os originais do DM nunca se apagam. Formato de referência das preparações: «Sessão 06 — Preparação: O Olho na Palma».
- **Sessões:** `registo/sessoes/sNN-AAAA-MM-DD.md` (o de maior `n` é a última; `ondeParou`, acontecimentos). **O que se jogou verifica-se na transcrição**, não no resumo: `session_records/<global>_cotn_<n>/transcript_whisperx.txt` (pasta `1bmnSRbTupGWiWyjzsHIwIF4_2lQYf_OZ`); os resumos da Drive (`1qSNp-FrEsp0k0J2ijMLUJ0XLlAqy5mn-`) escrevem-se a partir do registo e nunca servem de fonte. Qualquer skill que afirme ou decida algo sobre o que já se jogou confere a transcrição primeiro; `node scripts/grelha.ts [--linha <id>]` mostra a Grelha em texto.
- **Validar e gravar:**
  ```
  python3 scripts/normalizar-texto.py
  npm run validate          # 0 erros
  git add -A && git commit  # com as linhas de atribuição da sessão
  git pull --rebase origin main && git push origin main
  ```
  Se o push for recusado, a app gravou `dm.json` entretanto: `git pull --rebase` e repete.
- **Ferramenta de combate:** a página «Batalha» do dashboard lê `mesa/batalhas/<id>.yaml`; formato em `docs/batalhas.md`. O estado do combate vive em `grelha/dm.json` (entradas `kind: batalha`): não se escreve.

## Regras que valem sempre

- Nunca escrever `grelha/dm.json` (é só da app).
- O repositório é público: não guardar tokens nem segredos de acesso em texto.
- Decisões do DM apresentam-se como perguntas interativas, com uma recomendação, e gravam-se pela skill `decidir`.
- Nunca apresentar uma invenção como cânone: cada proposta diz de onde nasce.
- Uma correção só está feita quando todas as ocorrências do facto errado no repositório foram corrigidas (`grep`).
