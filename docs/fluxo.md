# Fluxo: Drive, Claude e repositório

Decidido pelo DM a 2026-10-01.

## Os três papéis

| Sítio | Papel | Quem escreve |
| --- | --- | --- |
| **Claude** | brainstorm: ideias, propostas, conflitos com o cânone | conversa |
| **Drive** | trabalho: preparação de sessões, handouts, documentos para jogadores, ideias, transcrições | o DM (e o Claude, a pedido) |
| **Repositório** | verdade: dados do dashboard (`data/campaign`), cânone, lore, glossário, registo das sessões | só através do fecho |

O dashboard alojado é a consulta à mesa. Não há compêndio na Drive.

## A regra

Cada informação só se edita num sítio. Na Drive escreve-se o que se prepara. No repositório fica o que já foi decidido ou jogado. Os documentos da Drive que repetem o cânone (*O Mundo de Exandria*, *Panteão*, glossário) são **saídas**: quando o cânone muda, muda-se primeiro aqui e depois gera-se uma versão nova na Drive.

## O fecho

Faz-se depois de cada sessão ou bloco de preparação. Com o pedido «fecho», o Claude:

1. Lista o que mudou na Drive desde o último fecho (data abaixo), nas pastas da campanha.
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
