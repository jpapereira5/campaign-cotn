---
name: vigia-cotn
description: Revisão em tempo real da Grelha. Liga a escuta ao repositório e, sempre que o DM guarda uma edição na app (grelha/dm.json), revê-a na conversa, pergunta o que falta e escreve as notas em grelha/revisao.json. Usar quando o DM diz «vigia», «fica à escuta» ou está a editar a Grelha.
---

# /vigia-cotn: revisão em tempo real da Grelha

O DM edita a Grelha na app; cada «Guardar» faz um commit só de `grelha/dm.json`. Esta skill fica à escuta e revê cada
edição na conversa, com perguntas curtas e respostas sugeridas, e deixa as mesmas perguntas em `grelha/revisao.json`
para aparecerem na célula. Nada do que o DM escreve é cânone antes da revisão; nada entra no cânone sem o sim dele.
Regras completas em `docs/grelha.md` (secções 9, 10 e 12) e `docs/arquitetura.md`.

## Ligar

1. Confirma que tens acesso de escrita ao repositório (`git push` tem de funcionar) e que estás em `main`, atualizado (`git pull`).
2. Liga a escuta num Monitor (30 minutos; volta a ligar enquanto o DM estiver a trabalhar):
   `bash scripts/escuta.sh`
   Cada aviso traz os commits novos e os ficheiros tocados. Só interessa quando `grelha/dm.json` mudou. Os commits «batalha: …» são o estado de um combate na página Batalha (entradas `kind: batalha`): não se revêem.
3. Diz ao DM que estás à escuta. «Para» desliga.

## A cada aviso

1. `git pull`. Lê `grelha/dm.json`, as chaves `reviewed`, `absorbed` e `lastReview` de `grelha/revisao.json` e as notas abertas (`python3 scripts/notas.py`; `--procura` para o histórico, com as fechadas); `node scripts/grelha.ts` mostra a Grelha com a camada do DM aplicada (a secção «Por rever») e `node scripts/grelha.ts --linha <id>` uma linha inteira.
2. As entradas por rever são as que não estão em `revisao.reviewed` (ou cujo `at` é mais recente do que a data lá guardada)
   nem em `revisao.absorbed`, e não estão `deleted`.
3. Para cada uma, aplica as regras abaixo e junta as perguntas. Responde na conversa com **três perguntas no máximo**,
   primeiro as que mexem na próxima sessão, cada uma com a resposta sugerida. As restantes ficam para a ronda seguinte.
4. Escreve as mesmas perguntas em `grelha/revisao.json` → `notes` (`kind`: pergunta | discrepancia | efeito | aviso;
   `target`: `{dm, row, col}`; `text`; `suggestion`; `status: aberta`), com ids `n-…` novas, e grava:
   `npm run gravar -- "revisão: <n> notas sobre <linhas>"` (o script faz `pull --rebase` antes do push: a app
   grava noutro ficheiro, não há conflito).
5. Nunca escrevas em `grelha/dm.json`. Nunca transformes uma ideia em cânone. Escreve em português de Portugal.

## Regras por tipo de entrada (`kind`)

- **`correcao`** (numa coluna jogada, com `fact`, ou sem `fact` = facto em falta). Pergunta primeiro se os jogadores viram aquilo.
  - Não viram → é uma verdade escondida: só tem de bater com o que eles viram.
  - Viram → confere a transcrição da sessão (`AGENTS.md`, «Sessões») na marca de tempo do acontecimento: ou o registo estava errado ou é um retcon, e os jogadores lembram-se do original. Mostra ao DM a citação.
  - Mostra os acontecimentos que nasceram deste (os que o têm em `origem`): podem deixar de fazer sentido.
  - Depois de confirmada: altera o acontecimento em `registo/sessoes/sNN-….md` (texto, `envolve`, `efeitos`), corrige o resumo da sessão e `registo/decisoes.md` se for o caso, regista a entrada em `revisao.absorbed` (`"d-…": "e-…"`).
- **`verdade`** (só DM). Tem de bater com tudo o que os jogadores viram. Sugere onde pode virar pista (um segredo em `mundo/segredos/`). Depois de confirmada: acontecimento novo com a tag `so-dm`, e `absorbed`.
- **`plano`** (coluna futura). Nunca é cânone antes de se jogar. Procura efeitos cruzados:
  - que linhas o plano toca e não estão em `involves`;
  - que acontecimentos abertos pode pagar (sugere-os como `origin`);
  - quem mais estaria lá (participantes dos beats do capítulo, a mesa);
  - se algum PC fica sem cena na próxima sessão.
  Um plano fica em `dm.json` até se jogar; no fecho vira acontecimento (com `origem`) ou cai. Regista só em `reviewed`.
- **`decisao`** (cabeçalho: legenda, quer, teme, atitudeAtual, marcas). Confirma que não contradiz nada do que já se disse à mesa (resumos, acontecimentos). Depois de confirmada: aplica ao ficheiro da entidade (`mundo/…`) e, se for verdade do mundo, a `registo/decisoes.md` como «Decidido pelo DM (data)», por revelar; `absorbed`.
- **`linha`** (coisa nova) e **`acompanhar`** (id existente). Vê se a coisa já existe com outro nome. Depois de confirmada: cria o ficheiro (`mundo/…`, `plano/fios/…`, com `origem: [grelha]`) ou só acrescenta a id a `grelha/linhas.json`; `absorbed` (`"d-…": "<id>"`).
- **`nota`** (nota rápida). Percebe onde vai: se for um facto, propõe-no e escreve-o no registo quando o DM disser que sim; se for um plano, cria uma `ideia` em `revisao.json` na célula certa, porque os planos são do DM. `absorbed`.
- **`arquivo`**. Só se regista (`reviewed`). Pergunta apenas se o fio devia deixar um eco (um acontecimento `registo` a fechá-lo).
- **`jogado`** (beat marcado à mesa). `reviewed`; o fecho passa-o para o cabeçalho da sessão (`beats: { id: jogado }`).
- **`resposta`** (a uma nota). Aplica a resposta à nota (`status: fechada`, e o que ela decide), e trata da entrada que a nota revia.
- **`ideia-rejeitada`**. Marca a nota `fechada`; não voltes a sugerir a mesma ideia.

Grava sempre com `npm run gravar -- "<mensagem>"`: normaliza, valida, testa, faz commit, `pull --rebase` e push, e para se algo falhar.
