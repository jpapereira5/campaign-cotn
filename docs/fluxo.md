# Fluxo: Drive, Claude e repositório

Decidido pelo DM a 2026-10-01.

## O caminho habitual

1. **Brainstorm com o Claude** → o que o DM decide entra logo no repositório.
2. **Saídas** → a partir do repositório, o Claude faz handouts, fichas e documentos: exporta-os para a Drive ou dá o texto no chat para o DM colar.
3. **Fecho** → só apanha o que entrou na Drive por outro caminho: transcrições das sessões, preparação escrita à mão e factos novos que o DM acrescente ao editar uma saída.

Uma saída nunca traz cânone novo que não esteja já no repositório. Se ao escrever um handout surgir um pormenor novo (um nome, um local), o Claude regista-o no repositório na mesma altura.

## Os três papéis

| Sítio | Papel | Quem escreve |
| --- | --- | --- |
| **Claude** | brainstorm: ideias, propostas, conflitos com o cânone | conversa |
| **Drive** | trabalho: preparação de sessões, handouts, documentos para jogadores, ideias, transcrições | o DM (e o Claude, a pedido) |
| **Repositório** | verdade: dados do dashboard (`data/campaign`), cânone, lore, glossário, registo das sessões | só através do fecho |

O dashboard alojado é a consulta à mesa. Não há compêndio na Drive.

## A regra

Cada informação só se edita num sítio. Na Drive escreve-se o que se prepara. No repositório fica o que já foi decidido ou jogado. Os documentos da Drive que repetem o cânone (*O Mundo de Exandria*, *Panteão*, glossário) são **saídas**: quando o cânone muda, muda-se primeiro aqui e depois gera-se uma versão nova na Drive.

## O que se decide no brainstorm

O chat não guarda nada: no fim de cada conversa, tudo o que vale a pena tem de ir para algum lado. Cada ideia está num de três estados:

| Estado | Onde fica | Como chega lá |
| --- | --- | --- |
| **Ideia** | só no chat | não se guarda |
| **Proposta** (vale a pena guardar, por decidir) | Drive, `cotn_2026/ideias`, ficheiro «brainstorm AAAA-MM-DD — tema» | o Claude escreve-a no fim da conversa; entra num fecho futuro quando for decidida |
| **Canónico** (o DM decidiu) | repositório, `docs/canone.md` («Decidido pelo DM (data)») e dados | direto, na mesma conversa, sem passar pela Drive |

- Uma decisão do DM no chat é canónica quando ele mostra que decidiu, dito de qualquer maneira: «regista», «guarda», «fixa», «torna canónico», escolher uma das opções, ou simplesmente afirmar como a coisa é. Não há palavra-chave: o Claude percebe pelo sentido e, na dúvida entre «decidiu» e «está a pensar alto», pergunta antes de escrever. Vai direto para o repositório, sem passar pela Drive.
- No fim de um brainstorm, o Claude fecha com uma lista «o que fica»: as decisões (que vão para o repositório) e as propostas (que vão para a Drive). O DM confirma ou corrige.
- Se a conversa não tiver acesso ao repositório (voz, telemóvel), as decisões vão para a Drive num ficheiro «decisões AAAA-MM-DD», marcado como decidido, e o fecho seguinte passa-as para o repositório sem as discutir de novo.
- Se uma decisão contradiz um documento da Drive, ganha a decisão: o Claude atualiza o documento (versão nova) ou assinala-o.

## O fecho

Faz-se depois de cada sessão ou bloco de preparação. Com o pedido «fecho», o Claude:

1. Lista o que mudou na Drive desde o último fecho (data abaixo), nas pastas da campanha. Os ficheiros «decisões» entram sem discussão; os «brainstorm» só no que o DM decidir.
2. Lê cada ficheiro novo ou alterado e propõe o que entra no repositório: entidades e campos (`data/campaign`, patches `zz-` quando corrige o livro), cânone, sessões, handouts.
3. Assinala os conflitos com o cânone e espera pela decisão do DM.
4. Aplica as decisões, corre `scripts/normalizar-texto.py` e `npm run validate`, e faz commit e push para `main`.
5. Atualiza na Drive as saídas que o cânone novo tornou desatualizadas (versão nova, a antiga vai para o lixo).
6. Atualiza a data do último fecho.

## Pastas da Drive que o fecho lê

| Pasta | id |
| --- | --- |
| Session Prep (CotN 2026) | `1WGi5hzOj2oPHEfFmvlwDmJN33X7Ed6h1` |
| `cotn_2026/ideias` | `1MIP9LYli1gLw7DMgz5UYruOzhkbnrP6j` |
| Camila (Lia) | `1BjFqdDVnXiBCrDh82SwipwHegeHzGgxl` |
| Documentos para jogadores (Mundo, Panteão) | `163OGm6WCbT53Ci2aLraE5xygn5R1Z51B` |
| `exandria` (glossário) | `1ziSnT3gXuEu_NcHzV0C5iAIFoP4tOLDc` |
| `session_records` (transcrições) | sem id registado |

## Último fecho

2026-10-01T16:50Z (glossário, grafia AO90, ritmo de viagem, Decrépola, Lia, patrulha).
