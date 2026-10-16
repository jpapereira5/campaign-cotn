---
name: livro
description: Consultar os livros da CotN (Call of the Netherdeep, Explorer's Guide to Wildemount, Tal'Dorei Reborn) e dizer o que o livro diz, com a referência, separado do que a campanha mudou. Usar quando o DM pergunta o que o livro diz, quer um stat block, uma regra, uma área, um NPC ou lore canónica, ou antes de propor algo que o livro já resolve.
---

# livro: o que o livro diz, e o que mudámos

O livro é referência, não cânone da mesa: a campanha mudou muita coisa por cima. Esta skill responde sempre em duas partes, **o livro** e **a nossa campanha**, para o DM nunca confundir uma com a outra.

## 1. Onde procurar

- **Os PDFs do projeto** (Projeto «Dungeons & Dragons» no claude.ai): `Call of the Netherdeep`, `Explorer's Guide to Wildemount`, `Tal'Dorei Reborn`. Usa a pesquisa do projeto (`project_search`) e lê as páginas certas (`project_read`). Não procures estes ficheiros no disco.
- **A extração do livro no repositório:** `livro/` (JSON só de leitura: `campaign.json`, `arcs.json`, `beats/`, `characters/`, `locations/`, `factions/`, `relations/`, `revelations/`). Serve para encontrar depressa a id e a área (ex.: B9, V3, R15).
- **O Manual dos Monstros, o PHB e o DMG** não estão no projeto: diz de onde vem o stat block e, se não o tiveres, diz isso em vez de o inventar.
- **A nossa campanha por cima:** a ficha da coisa (`mundo/…`, `plano/…`, campo `origem`: `livro` sozinho = como no livro; outras origens = mudado pela campanha), `registo/decisoes.md`, `mesa/regras.md` (regras da casa e latim dos feitiços) e o glossário pt-PT (`glossario_pt_v8.md` na Drive).

## 2. Como responder

1. **O livro:** o que diz, em português de Portugal, com os nomes do glossário (Forte Ventura, Pântano do Véu-Quebrado, Ascensão dos Traidores…). Cita a origem: livro, capítulo e área (ex.: «EGtW, Unwelcome Spirits, B9 Fort Venture; secção Bol'bara's Possession»). Números de regras (CD, dano, distâncias, hexágonos por dia) tal como estão. Citações curtas; o resto em resumo.
2. **A nossa campanha:** o que mudou e onde ficou decidido (ficheiro e decisão com data). Se não mudou nada, diz «como no livro».
3. **Incoerências:** se o livro e o cânone da mesa chocam, ou se o livro contradiz algo jogado, diz-o numa linha e pergunta (skill `decidir`) em vez de escolher sozinho.
4. **Se o livro não diz:** diz que não diz. Uma proposta tua é marcada como proposta e diz de onde nasce.

## 3. Usos frequentes

- **Stat blocks** para a skill `batalha` e para a `npc`: os números do livro ou do MM, sem os alterar.
- **Áreas e mapas:** o que está em cada área, os perigos, as CDs, o tesouro.
- **Cronologia e distâncias:** dias de viagem, hexágonos por dia, relógios do livro (ex.: a possessão da Bolbara).
- **Lore:** fações, divindades, a Calamidade, a Dinastia Kryn, o Império, o rubídio.
- **Antes de propor:** confirma se o livro já tem resposta; o DM prefere partir do livro e mudar a partir daí.

## 4. Gravar

Uma consulta não grava nada. Se a resposta levar o DM a decidir, a decisão grava-se pela skill `decidir`. Se faltar no repositório um facto do livro que vai ser preciso (um NPC, um local, um beat), cria a ficha com `origem: [livro]` e a referência no texto.
