---
name: preparar
description: Preparar a próxima sessão, em duas partes. A leitura da Grelha (o que está aberto, esquecido, planeado e por preparar; ideias e avisos em grelha/revisao.json, nas células certas) e, quando o DM a pede, o documento de preparação para a mesa (Google Doc «Sessão NN — Preparação», na pasta `cotn_2026/session_prep`). Usar quando o DM diz «preparar», «prepara a sessão», «o que falta para quarta», ou pede a preparação, o runsheet ou o documento da próxima sessão.
---

# /preparar: a Grelha e o documento da sessão

Duas partes. A **parte 1** (a leitura da Grelha) faz-se sempre que o DM diz «preparar». A **parte 2** (o documento para a mesa) faz-se quando ele pede a preparação, o runsheet ou o documento da sessão, e parte sempre da parte 1: o que a leitura deixou na Grelha é o que o documento usa.

## Parte 1 · A leitura da Grelha

O DM prepara a sessão na Grelha (planos nas células da próxima coluna). Esta skill faz a leitura que ele faria se tivesse
tempo: o que está aberto e esquecido, quem fica sem cena, que planos pagam o quê, que relógios e frentes avançam, e
deixa **ideias** (`kind: ideia`) e **avisos** (`kind: aviso`) nas células, para aparecerem na app a tracejado. As ideias
são sugestões: só viram plano quando o DM as aceita na app. Regras completas em `docs/grelha.md` (secções 8 e 12) e
`docs/arquitetura.md` (secções 6 e 7).

### Passos

1. `git pull` em `main`. Corre `node scripts/grelha.ts` (a Grelha em texto, com ids) e, para as linhas que interessam, `node scripts/grelha.ts --linha <id>`. O `--json` dá tudo numa só peça.
2. Lê o registo da última sessão (`registo/sessoes/`, o ficheiro de maior `n`): o `ondeParou`, o resumo e os acontecimentos abertos. Lê `plano/campanha.md` (capítulo atual) e os beats desse capítulo por jogar (`plano/beats/`, `estado` no cabeçalho das sessões).
3. Antes de tudo, as **decisões de preparação** (`docs/fluxo.md`): lê as decisões do DM desde a última sessão em `registo/decisoes.md` e, para cada uma que diga respeito à próxima sessão e ainda não tenha nota na coluna dela, escreve uma `ideia` na linha certa com `because: ['registo/decisoes.md AAAA-MM-DD #N']`. Fecha as notas antigas que uma decisão nova contradiga. Uma decisão de preparação que não está na Grelha esquece-se à mesa.
   Depois, os **candidatos** (`node scripts/grelha.ts`, secção «Candidatos à S…», também no botão «Candidatos à S…» da Grelha): as linhas que, vindas de trás, pontuam por fios abertos e esquecidos, por terem estado na última sessão, pelo beat em curso, por PCs sem cena, relógios e última oportunidade. Para cada candidato sem plano, a pergunta é «o que acontece a isto na próxima sessão?». Depois faz a leitura, por esta ordem:
   - **Os esquecidos**: abertos há três ou mais sessões sem plano. Para cada um, ou propõe um eco barato (uma linha de diálogo, uma notícia, um NPC que reaparece) como `ideia` na célula da próxima sessão, ou pergunta se deve fechar (`aviso`).
   - **Os PCs sem cena pessoal** na próxima sessão: uma `ideia` por PC, ligada à ambição dele (`plano/fios/amb-*.md`) e ao que aconteceu na última sessão.
   - **Os planos do DM** já na coluna: para cada um, vê que acontecimentos abertos pode pagar e que ainda não estão em `origin` (`aviso` com a sugestão), quem mais estaria lá (participantes do beat, a mesa) e se contradiz algo do registo.
   - **O cânone à frente**: os beats do capítulo que os planos do DM não tocam; os passos das frentes (`t-frente-*`) que avançariam se ninguém os travar; as pistas planeadas dos segredos que ainda não foram dadas (`r-*`, `pistas`). Uma `ideia` por coisa que valha a pena, nunca mais do que cinco no total.
   - **Os relógios** (`t-relogio-*`): se o próximo passo cai nesta sessão, `aviso`.
4. Escreve as notas em `grelha/revisao.json` → `notes` (ids `n-…` novas, `at` de agora, `status: aberta`, `target: {row, col}` com a coluna da próxima sessão, por exemplo `s6`; nas ideias, `factKind` e `suggestion` com o texto que viraria plano). Não repitas ideias que já lá estejam, abertas ou fechadas, nem ideias rejeitadas (`dm.json`, `ideia-rejeitada`).
5. Grava: `npm run gravar -- "preparar S<N>: <n> ideias, <m> avisos"` (normaliza, valida, testa, commit, pull --rebase e push; as linhas de atribuição da sessão vão na mensagem).
6. Na conversa, dá ao DM o resumo em três blocos curtos: **o que está em risco de se perder**, **o que sugeri** (uma linha por ideia, com a linha da Grelha) e **o que precisa de decisão dele**. Nada de listas longas: o resto está na app.

### Limites

- Nunca escrevas em `grelha/dm.json` nem em `registo/`: as ideias não são cânone e os planos são do DM.
- Nunca inventes factos do mundo: cada ideia nasce de algo que está nos ficheiros (um acontecimento, uma ambição, um beat, uma frente, um segredo) e diz de onde nasce (`because`).
- Escreve em português de Portugal, curto, no tom dos resumos das sessões.

## Parte 2 · O documento de preparação

O documento transforma o que o DM decidiu (e o que está planeado na Grelha) num texto que se lê à mesa. O cânone do repositório manda: o que o documento contradisser, ganha o cânone.

### Antes de escrever

- Faz a parte 1 primeiro, se ainda não foi feita para esta sessão, e lê a coluna da próxima sessão na Grelha (planos do DM, ideias aceites, avisos).
- Lê onde a mesa parou (`ondeParou` da última sessão), as decisões desde então, os relógios e as fichas dos NPCs que entram (CA, PV, ataques); os monstros pela skill `livro` e as regras da casa (`mesa/regras.md`).
- **As fichas de tudo o que entra** (decisão 2026-10-21 #83): para cada local, NPC e objeto da sessão, lê a ficha em `mundo/` e faz `grep -rn` pela id e pelas palavras-chave em `mundo/ plano/ registo/ mesa/`; procura na Drive as preparações e documentos antigos que o mencionam (`fullText contains`, todas as sessões, não só a última) e as conversas passadas. O que lá estiver definido e não estiver na ficha entra na ficha antes de escreveres (o aprovado nas secções da `## Ficha de mesa`; o que não foi usado, em «Reserva»). Uma preparação nunca é a única casa de nada.
- Segue o formato de referência: «Sessão 06 — Preparação: O Olho na Palma v2», na pasta `cotn_2026/session_prep` (`AGENTS.md`, secção «Para as skills»).
- Pergunta (interativa) o **âmbito**: até onde vai a sessão. O que estiver por decidir pergunta-se antes de escrever (skill `decidir`).

### Estrutura

0. **Onde ficámos:** tabela «Facto da última sessão | O que obriga nesta».
1. **A verdade (só para o DM):** o que está mesmo a acontecer fora de cena.
2. **Abertura:** texto para ler, em citação, só sentidos, sem interpretar (ordem Mercer); falas à parte para um jogador, se houver.
3. … **Cenas,** uma secção cada: porquê (o que a cena faz pelos PCs), como corre, NPCs em tabela (CA/PV, o que fazem), regras especiais, ritmo, e «depois de…». Um combate grande ganha folha própria (skill `batalha`), com um ponteiro aqui.
- **Sentidos** (decisão 2026-10-24 #8): cada local, NPC e item que entra leva vista, som, **cheiro** e tato; o cheiro nunca falta (o Isco tem faro apurado, passiva 20).
- **Checks** (decisão 2026-10-21 #84), em cada cena e para cada local, NPC ou objeto relevante: tabela «Check | CD | O que dá | Fonte», reconciliada com o cânone atual. Os checks do livro revêem-se um a um (mantido, adaptado ao que o cânone já mudou, ou retirado); cada camada de segredo tem pelo menos um caminho para ser descoberta; o que for sugestão tua diz «sugestão». A tabela grava-se primeiro na ficha da entidade e copia-se para aqui.
- **Decisões dos jogadores:** tabela «Quem | Quer | Porquê», o que o grupo sabe para decidir, os caminhos e o custo de cada um.
- **Relógios:** tabela por momento da sessão.
- **Ganchos por PC:** uma linha cada (a cena pessoal de cada PC, da parte 1).
- **Checklist de mesa:** caixas `[ ]`, uma por coisa que não pode esquecer.

### Regras de escrita

- Português de Portugal; termos de regras em inglês quando a mesa os usa assim (CON save, *revivify*).
- Textos para ler: curtos, sensoriais, sem psicologia; os nomes só quando a mesa já os sabe. Só o que as personagens percebem de facto (o que veem, ouvem, cheiram e sentem, ou o silêncio); nada do que deviam perceber e não percebem, e nada que suponha o que aconteceu antes (decisão 2026-10-24 #1).
- Segredos marcados «(só DM)»; nada para os jogadores lerem no mesmo documento, salvo secção própria («Briefing para…»).
- Lembretes de regras que favorecem um PC entram onde se usam e na checklist.

### Antes de publicar: nada se perde

- Compara com a versão anterior do documento e com as preparações das sessões anteriores que tocam as mesmas coisas: lista tudo o que saiu. Cada coisa que saiu vai para a «Reserva» da ficha da entidade, ou é retirada com confirmação do DM (pergunta interativa). Nunca a deixes desaparecer em silêncio.
- Escreve de volta nas fichas (`## Ficha de mesa`) o que o DM aprovou no documento: textos para ler, sentidos, checks, falas, segredos.
- **Compêndio da sessão:** um segundo Google Doc, «Sessão NN — Compêndio», na mesma pasta, com a `## Ficha de mesa` completa (copiada tal como está no repositório) de cada local, NPC e objeto que pode aparecer na sessão. É o que se consulta primeiro à mesa: uma só leitura. Refaz-se a cada versão nova da preparação.

### Publicar

- Google Doc (Markdown convertido, **sem** cabeçalho YAML nem linha de tags) na pasta `cotn_2026/session_prep`, título «Sessão NN — Preparação: <título>». Versões novas como documento novo; a anterior que tu criaste vai para o lixo.
- Grava nas decisões o âmbito e o que se decidiu pelo caminho (skill `decidir`); o que for plano para a sessão vai também para a Grelha como `ideia` (parte 1, passo 3).
- Grava o repositório (`npm run gravar`); a cópia na Drive fica para a tarefa diária (decisão 2026-10-23 #29).
- Na resposta: o link e um resumo de cinco linhas do que a sessão tem.
