---
name: preparar
description: Preparar a próxima sessão a partir da Grelha. Lê o que está aberto, esquecido, planeado e por preparar, assinala o que o DM pode estar a deixar escapar e escreve ideias e avisos em grelha/revisao.json, nas células certas. Usar quando o DM diz «preparar», «prepara a sessão» ou «o que falta para quarta».
---

# /preparar: a leitura da Grelha antes da sessão

O DM prepara a sessão na Grelha (planos nas células da próxima coluna). Esta skill faz a leitura que ele faria se tivesse
tempo: o que está aberto e esquecido, quem fica sem cena, que planos pagam o quê, que relógios e frentes avançam, e
deixa **ideias** (`kind: ideia`) e **avisos** (`kind: aviso`) nas células, para aparecerem na app a tracejado. As ideias
são sugestões: só viram plano quando o DM as aceita na app. Regras completas em `docs/grelha.md` (secções 8 e 12) e
`docs/arquitetura.md` (secções 6 e 7).

## Passos

1. `git pull` em `main`. Corre `node scripts/grelha.ts` (a Grelha em texto, com ids) e, para as linhas que interessam, `node scripts/grelha.ts --linha <id>`. O `--json` dá tudo numa só peça.
2. Lê o registo da última sessão (`registo/sessoes/`, o ficheiro de maior `n`): o `ondeParou`, o resumo e os acontecimentos abertos. Lê `plano/campanha.md` (capítulo atual) e os beats desse capítulo por jogar (`plano/beats/`, `estado` no cabeçalho das sessões).
3. Começa pelos **candidatos** (`node scripts/grelha.ts`, secção «Candidatos à S…», também no botão «Candidatos à S…» da Grelha): as linhas que, vindas de trás, pontuam por fios abertos e esquecidos, por terem estado na última sessão, pelo beat em curso, por PCs sem cena, relógios e última oportunidade. Para cada candidato sem plano, a pergunta é «o que acontece a isto na próxima sessão?». Depois faz a leitura, por esta ordem:
   - **Os esquecidos**: abertos há três ou mais sessões sem plano. Para cada um, ou propõe um eco barato (uma linha de diálogo, uma notícia, um NPC que reaparece) como `ideia` na célula da próxima sessão, ou pergunta se deve fechar (`aviso`).
   - **Os PCs sem cena pessoal** na próxima sessão: uma `ideia` por PC, ligada à ambição dele (`plano/fios/amb-*.md`) e ao que aconteceu na última sessão.
   - **Os planos do DM** já na coluna: para cada um, vê que acontecimentos abertos pode pagar e que ainda não estão em `origin` (`aviso` com a sugestão), quem mais estaria lá (participantes do beat, a mesa) e se contradiz algo do registo.
   - **O cânone à frente**: os beats do capítulo que os planos do DM não tocam; os passos das frentes (`t-frente-*`) que avançariam se ninguém os travar; as pistas planeadas dos segredos que ainda não foram dadas (`r-*`, `pistas`). Uma `ideia` por coisa que valha a pena, nunca mais do que cinco no total.
   - **Os relógios** (`t-relogio-*`): se o próximo passo cai nesta sessão, `aviso`.
4. Escreve as notas em `grelha/revisao.json` → `notes` (ids `n-…` novas, `at` de agora, `status: aberta`, `target: {row, col}` com a coluna da próxima sessão, por exemplo `s6`; nas ideias, `factKind` e `suggestion` com o texto que viraria plano). Não repitas ideias que já lá estejam, abertas ou fechadas, nem ideias rejeitadas (`dm.json`, `ideia-rejeitada`).
5. `npm run validate` e commit: `git commit -am "preparar S<N>: <n> ideias, <m> avisos" && git push`. Se o push for recusado, `git pull --rebase` e repete.
6. Na conversa, dá ao DM o resumo em três blocos curtos: **o que está em risco de se perder**, **o que sugeri** (uma linha por ideia, com a linha da Grelha) e **o que precisa de decisão dele**. Nada de listas longas: o resto está na app.

## Limites

- Nunca escrevas em `grelha/dm.json` nem em `registo/`: as ideias não são cânone e os planos são do DM.
- Nunca inventes factos do mundo: cada ideia nasce de algo que está nos ficheiros (um acontecimento, uma ambição, um beat, uma frente, um segredo) e diz de onde nasce (`because`).
- Escreve em português de Portugal, curto, no tom dos resumos das sessões.
