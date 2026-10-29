# Cópia do repositório na Drive

O repositório tem uma cópia de leitura na Drive, na pasta `DND/cotn_2026/github_repo` (`1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R`): um documento Markdown por peça do cânone (PCs, NPCs por letra, locais, beats por capítulo, uma sessão por documento, decisões, mesa, documentação), o `00 LEIA-ME.md` com o commit e o índice, e o `manifesto.json` (sha256 de cada peça). Cada ficha aparece sob um título com o nome e o caminho, com o cabeçalho YAML num bloco de código.

Quem a mantém é o **GitHub Actions** (`.github/workflows/copia-drive.yml`; decisão 2026-10-29 #1, substitui a tarefa agendada diária do Claude de 2026-10-20 e a decisão 2026-10-23 #29): corre a cada push para `main` (menos os de `grelha/dm.json`), todos os dias às 05h47 UTC (para apanhar mudanças no `dnd-skills`) e à mão em Actions → «Cópia na Drive» → *Run workflow*. Não gasta tokens do Claude. O mesmo workflow faz também a cópia das skills para `DND/skills` (`1gM_AotFxw0zPAjFV14XwDVRAZcRe7A6H`) com `scripts/sincronizar.py gerar` do `jpapereira5/dnd-skills` (só a subpasta `drive/` e o `manifesto.json`).

A cópia é só de leitura. O que se escrever lá perde-se na próxima cópia; a fonte de verdade é o repositório. O script `scripts/copia-drive.py` nunca escreve no repositório.

## Como funciona

1. O workflow clona este repositório e o `dnd-skills` e corre `scripts/copia-drive.py gerar` e `scripts/sincronizar.py gerar`.
2. O **rclone** envia as duas pastas com `rclone sync --checksum --drive-use-trash`: compara o md5 de cada ficheiro, atualiza no próprio sítio os que mudaram (as ids e os links da Drive mantêm-se), cria os novos e manda para o lixo da Drive os que deixaram de existir. As pastas ficam iguais à cópia gerada: um ficheiro posto lá à mão vai para o lixo na cópia seguinte.
3. No fim, `rclone check` confere as duas pastas; uma diferença faz o workflow falhar (o GitHub avisa por email).
4. A ligação à Drive é o segredo `RCLONE_CONF` do repositório (Settings → Secrets and variables → Actions): o conteúdo do `rclone.conf` do DM, com um remote do tipo `drive` e um client OAuth próprio (projeto `rclone` na Google Cloud, app publicada para o token não expirar). O segredo nunca entra no repositório.
5. Se o envio falhar com um erro de autorização (token revogado ou expirado), refaz-se o `rclone config reconnect drive:` no PC e atualiza-se o segredo com o novo `rclone.conf`.

## Cópia à mão pelo conector da Drive (só se o GitHub Actions não estiver disponível)

Os passos antigos continuam a funcionar: `python3 scripts/copia-drive.py gerar SAIDA` e `python3 scripts/copia-drive.py diferencas SAIDA manifesto-antigo.json` (com o `manifesto.json` da pasta descarregado para `manifesto-antigo.json`); cada peça em `enviar` cria-se com o mesmo nome (`text/markdown`, `disableConversionToGoogleType: true`) e o antigo vai para o lixo; os nomes em `apagar` vão para o lixo; no fim, o `00 LEIA-ME.md` e o `manifesto.json`, e a conferência dos tamanhos.

## Limites (só para a cópia à mão)

- O envio copia o conteúdo em base64 para dentro da chamada à Drive, e essa cópia falha nas peças grandes: a 2026-10-24 falharam as cinco peças de 69 a 82 KB, e algumas de 45 a 67 KB só passaram à segunda. Por isso o `gerar` parte sozinho qualquer peça acima de 35 KB (`LIMITE` no script) em «<peça> · parte 1», «· parte 2»…, entre fichas e, numa ficha grande (uma sessão, as decisões), entre as secções dela. Não é preciso mexer em `pecas()` quando uma peça cresce.
- Quando uma peça cresce, os cortes podem mudar e as partes seguintes dessa peça reenviam-se; os nomes que deixam de existir vão para o lixo pelo `apagar`.
- Só um bloco de código maior do que o limite (um `.yaml` de batalha, por exemplo) fica numa parte maior; o `gerar` avisa acima de 50 KB.
- Uma peça nova (um PC novo, uma sessão nova, um capítulo novo) entra sozinha: o script gera-a e a cópia cria-a.
- Mudar o nome de uma peça no script faz a cópia criar a nova e apagar a antiga.

## A cópia do dnd-soundboard

O repositório `jpapereira5/dnd-soundboard` (a app de som da mesa) tem também uma cópia na Drive, em `DND/dm_tools/dnd_soundboard` (`1lG6V6yb6Nu9kcQcqPCFOqkKMBa1T9N1r`), feita a 2026-10-20 (commit `2fa738e`). **Não é diária nem entra no fecho** (decidido pelo DM a 2026-10-20): refaz-se só quando o DM a pede, com os passos abaixo. Como é código, a cópia é um **espelho**: cada ficheiro do git com o mesmo caminho (subpastas `src`, `src/components`, `src/lib`, `.github/workflows`) e o mesmo conteúdo, mais o `00 LEIA-ME.md` e o `manifesto.json` (os nomes no manifesto são os caminhos).

1. `git clone https://github.com/jpapereira5/dnd-soundboard` (ou `git pull`).
2. Descarrega o `manifesto.json` da pasta, como acima.
3. `python3 scripts/copia-drive.py espelho <clone do soundboard> SAIDA` e `python3 scripts/copia-drive.py diferencas SAIDA manifesto-antigo.json`.
4. Para cada caminho a enviar: a subpasta certa (procura-a pelo nome dentro da pasta-mãe; cria-a se não existir), o ficheiro `SAIDA/ficheiros/<caminho>` com o nome do ficheiro e o tipo que o manifesto novo dá em `ficheiros.<caminho>.tipo` (`disableConversionToGoogleType: true`); depois, o antigo para o lixo. Os caminhos em `apagar` vão para o lixo.
5. No fim, o `00 LEIA-ME.md` e o `manifesto.json`, e a conferência dos tamanhos.
