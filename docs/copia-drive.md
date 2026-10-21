# Cópia do repositório na Drive

O repositório tem uma cópia de leitura na Drive, na pasta `DND/cotn_2026/github_repo` (`1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R`): um documento Markdown por peça do cânone (PCs, NPCs por letra, locais, beats por capítulo, uma sessão por documento, decisões, mesa, documentação), o `00 LEIA-ME.md` com o commit e o índice, e o `manifesto.json` (sha256 de cada peça). Cada ficha aparece sob um título com o nome e o caminho, com o cabeçalho YAML num bloco de código.

Quem a mantém é o **Claude**: **depois de cada push ao repositório, na mesma conversa** (decidido pelo DM a 2026-10-21 #86: a cópia tem de estar sempre atualizada, porque também serve de consulta), numa tarefa agendada diária (decidido pelo DM a 2026-10-20) e no fim de cada fecho de sessão, logo a seguir ao push (decidido pelo DM a 2026-10-20). O Claude escreve na Drive reescrevendo o conteúdo de cada ficheiro, por isso a cópia vai em peças de até ~80 KB e só se reenviam as que mudaram. Não há zip: o repositório inteiro descarrega-se do GitHub (Code → Download ZIP).

A cópia é só de leitura. O que se escrever lá perde-se na próxima cópia; a fonte de verdade é o repositório. O script `scripts/copia-drive.py` nunca escreve no repositório.

## A cópia, passo a passo

1. Repositório atualizado: `git clone https://github.com/jpapereira5/campaign-cotn` (ou `git pull` em `main`).
2. Na Drive, lista a pasta (`parentId = '1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R'`). Se houver `manifesto.json`, descarrega-o para um ficheiro local (`manifesto-antigo.json`); se não houver, é a primeira cópia.
3. `python3 scripts/copia-drive.py gerar SAIDA` e `python3 scripts/copia-drive.py diferencas SAIDA manifesto-antigo.json`. O segundo diz, em JSON, que peças `enviar` e que nomes `apagar`.
4. Se `nada_a_fazer` for `true`, acaba aqui: não se envia nada.
5. Para cada peça a enviar: lê o ficheiro local inteiro e cria-o na pasta com o mesmo nome (`text/markdown`, `disableConversionToGoogleType: true`), com o conteúdo **exatamente** igual ao do ficheiro; só depois de criado, manda para o lixo o ficheiro antigo com esse nome. Os nomes em `apagar` vão para o lixo.
6. Depois das peças, o mesmo para o `00 LEIA-ME.md` e, por último, o `manifesto.json` (o manifesto só se troca no fim, para uma cópia interrompida se refazer no dia seguinte).
7. Confere: lista a pasta outra vez; cada nome aparece uma só vez e o `fileSize` de cada peça enviada é igual ao tamanho do ficheiro local (`wc -c`). Uma peça com tamanho diferente reenvia-se uma vez; se voltar a falhar, fica no relatório.

Várias peças podem ir em paralelo, por agentes, cada um com um lote.

## Limites

- Uma peça acima de ~80 KB dá um aviso no `gerar`: parte-se em `pecas()`, no script (por letra, por capítulo…).
- Uma peça nova (um PC novo, uma sessão nova, um capítulo novo) entra sozinha: o script gera-a e a cópia cria-a.
- Mudar o nome de uma peça no script faz a cópia criar a nova e apagar a antiga.

## A cópia do dnd-soundboard

O repositório `jpapereira5/dnd-soundboard` (a app de som da mesa) tem também uma cópia na Drive, em `DND/dm_tools/dnd_soundboard` (`1lG6V6yb6Nu9kcQcqPCFOqkKMBa1T9N1r`), feita a 2026-10-20 (commit `2fa738e`). **Não é diária nem entra no fecho** (decidido pelo DM a 2026-10-20): refaz-se só quando o DM a pede, com os passos abaixo. Como é código, a cópia é um **espelho**: cada ficheiro do git com o mesmo caminho (subpastas `src`, `src/components`, `src/lib`, `.github/workflows`) e o mesmo conteúdo, mais o `00 LEIA-ME.md` e o `manifesto.json` (os nomes no manifesto são os caminhos).

1. `git clone https://github.com/jpapereira5/dnd-soundboard` (ou `git pull`).
2. Descarrega o `manifesto.json` da pasta, como acima.
3. `python3 scripts/copia-drive.py espelho <clone do soundboard> SAIDA` e `python3 scripts/copia-drive.py diferencas SAIDA manifesto-antigo.json`.
4. Para cada caminho a enviar: a subpasta certa (procura-a pelo nome dentro da pasta-mãe; cria-a se não existir), o ficheiro `SAIDA/ficheiros/<caminho>` com o nome do ficheiro e o tipo que o manifesto novo dá em `ficheiros.<caminho>.tipo` (`disableConversionToGoogleType: true`); depois, o antigo para o lixo. Os caminhos em `apagar` vão para o lixo.
5. No fim, o `00 LEIA-ME.md` e o `manifesto.json`, e a conferência dos tamanhos.
