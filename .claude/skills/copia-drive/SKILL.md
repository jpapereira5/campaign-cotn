---
name: copia-drive
description: Atualizar a cópia de leitura do repositório campaign-cotn na Drive (pasta cotn_2026/github_repo), só com as peças que mudaram, e a cópia do dnd-soundboard quando o DM a pede. Usar depois de cada push ao repositório (na mesma conversa, sem pedir licença e sem deixar para a tarefa diária), na tarefa agendada diária, no fim de cada fecho (passo 12 da fecho) e quando o DM diz «atualiza a cópia na Drive» ou «faz backup do repo».
---

# copia-drive: a cópia de leitura na Drive

A cópia é **só de leitura** e a fonte de verdade é o repositório; o que se escreve na Drive perde-se na cópia seguinte. O procedimento completo está em `docs/copia-drive.md`; esta skill é a ordem de trabalho.

## O repositório campaign-cotn (depois de cada push, diária e no fecho)

1. `git pull` em `main` (ou clona `https://github.com/jpapereira5/campaign-cotn`).
2. Lista a pasta `cotn_2026/github_repo` (`1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R`) com `parentId = '…'` e `excludeContentSnippets`. Descarrega o `manifesto.json` para `manifesto-antigo.json`; se não existir, é a primeira cópia.
3. `npm run copia-drive -- gerar SAIDA` e `npm run copia-drive -- diferencas SAIDA manifesto-antigo.json`. Se `nada_a_fazer` for `true`, acaba: diz «cópia já atualizada (commit X)» e mais nada.
4. Para cada peça em `enviar`: lê o ficheiro local inteiro e cria-o na pasta com o mesmo nome (`text/markdown`, `disableConversionToGoogleType: true`), com o conteúdo exatamente igual; só depois manda o antigo com esse nome para o lixo. Os nomes em `apagar` vão para o lixo. Lotes grandes podem ir por agentes em paralelo, cada um com a sua lista.
5. No fim, o `00 LEIA-ME.md` e, por último, o `manifesto.json` (só se troca depois de tudo o resto, para uma cópia interrompida se refazer da próxima vez).
6. Confere: lista a pasta; cada nome aparece uma só vez e o `fileSize` de cada peça enviada é igual ao `wc -c` do ficheiro local. Uma peça diferente reenvia-se uma vez; se falhar outra vez, fica no relatório.
7. Na conversa: uma linha com o commit copiado, quantas peças foram enviadas e apagadas, e o que falhou.

## O dnd-soundboard (só a pedido)

A cópia em `DND/dm_tools/dnd_soundboard` (`1lG6V6yb6Nu9kcQcqPCFOqkKMBa1T9N1r`) é um espelho do código, com os caminhos do git como nomes: `npm run copia-drive -- espelho <clone do soundboard> SAIDA`, depois `diferencas` e o envio pelo mesmo método, com as subpastas (`src`, `src/components`, `src/lib`, `.github/workflows`) criadas quando faltarem. Não é diária nem entra no fecho (decidido pelo DM a 2026-10-20).

## Cuidados

- Nunca escrevas no repositório a partir da cópia nem edites a cópia à mão.
- Os nomes das peças são os do script; não os mudes na Drive (a regra de nomes da Drive não se aplica dentro de `github_repo`).
- Se o conector da Drive falhar a meio, não troques o manifesto: a próxima cópia retoma do que ficou.
