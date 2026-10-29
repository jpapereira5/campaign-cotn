---
name: copia-drive
description: Cópia de leitura do repositório campaign-cotn e das skills na Drive (pastas cotn_2026/github_repo e DND/skills), feita pelo GitHub Actions a cada push e todos os dias, e a cópia do dnd-soundboard quando o DM a pede. Usar quando o DM diz «atualiza a cópia na Drive», «faz backup do repo» ou quando a cópia falhar. A fonte de verdade é sempre o repositório.
---

# copia-drive: a cópia de leitura na Drive

A cópia é **só de leitura** e a fonte de verdade é o repositório; o que se escreve na Drive perde-se na cópia seguinte. O procedimento completo está em `docs/copia-drive.md`; esta skill é a ordem de trabalho.

## O repositório campaign-cotn e as skills (GitHub Actions)

Desde a decisão 2026-10-29 #1, a cópia faz-se sozinha no workflow `.github/workflows/copia-drive.yml` (rclone), a cada push para `main` e todos os dias às 05h47 UTC; o Claude já não a envia pelo conector. O que o Claude faz:

1. **O DM pede a cópia agora:** `gh workflow run copia-drive.yml --ref main` e segue o resultado (`gh run list --workflow copia-drive.yml`). Se não der para disparar daqui, diz ao DM: Actions → «Cópia na Drive» → *Run workflow*.
2. **A cópia falhou:** vê em que passo (`gh api repos/jpapereira5/campaign-cotn/actions/runs/<id>/jobs`). Se o registo não abrir daqui, pede ao DM a mensagem de erro do passo. Erro de autorização: o DM refaz `rclone config reconnect drive:` no PC e atualiza o segredo `RCLONE_CONF` com o novo `rclone.conf`. Nunca peças nem escrevas o conteúdo do segredo.
3. **Sem GitHub Actions** (último recurso): a cópia à mão pelo conector da Drive, como em `docs/copia-drive.md` («Cópia à mão»).

## O dnd-soundboard (só a pedido)

A cópia em `DND/dm_tools/dnd_soundboard` (`1lG6V6yb6Nu9kcQcqPCFOqkKMBa1T9N1r`) é um espelho do código, com os caminhos do git como nomes: `npm run copia-drive -- espelho <clone do soundboard> SAIDA`, depois `diferencas` e o envio pelo mesmo método, com as subpastas (`src`, `src/components`, `src/lib`, `.github/workflows`) criadas quando faltarem. Não é diária nem entra no fecho (decidido pelo DM a 2026-10-20).

## Cuidados

- Nunca escrevas no repositório a partir da cópia nem edites a cópia à mão.
- Os nomes das peças são os do script; não os mudes na Drive (a regra de nomes da Drive não se aplica dentro de `github_repo`).
- Na cópia à mão, se o conector da Drive falhar a meio, não troques o manifesto: a próxima cópia retoma do que ficou.
