# Fluxo: Drive, Claude e repositório

Decidido pelo DM a 2026-10-01; o fecho reescrito para a estrutura nova (`docs/arquitetura.md`) a 2026-10-12.

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
| **Repositório** | verdade: o mundo (`mundo/`), o plano (`plano/`), o registo das sessões e as decisões (`registo/`), a mesa (`mesa/`), o glossário | o fecho e o brainstorm (o Claude); a app só grava `grelha/dm.json` |

O dashboard alojado é a consulta à mesa. Não há compêndio na Drive.

## A regra

Cada informação só se edita num sítio. Na Drive escreve-se o que se prepara. No repositório fica o que já foi decidido ou jogado. Os documentos da Drive que repetem o cânone (*O Mundo de Exandria*, *Panteão*, glossário) são **saídas**: quando o cânone muda, muda-se primeiro aqui e depois gera-se uma versão nova na Drive.

## O que se decide no brainstorm

O chat não guarda nada: no fim de cada conversa, tudo o que vale a pena tem de ir para algum lado. Cada ideia está num de três estados:

| Estado | Onde fica | Como chega lá |
| --- | --- | --- |
| **Ideia** | só no chat | não se guarda |
| **Proposta** (vale a pena guardar, por decidir) | Drive, `cotn_2026/ideias`, ficheiro «brainstorm AAAA-MM-DD — tema» | o Claude escreve-a no fim da conversa; entra num fecho futuro quando for decidida |
| **Canónico** (o DM decidiu) | repositório: o ficheiro da coisa (`mundo/…`, `plano/…`) e `registo/decisoes.md` («Decidido pelo DM (data)») | direto, na mesma conversa, sem passar pela Drive |

- Uma decisão do DM no chat é canónica quando ele mostra que decidiu, dito de qualquer maneira: «regista», «guarda», «fixa», «torna canónico», escolher uma das opções, ou simplesmente afirmar como a coisa é. Não há palavra-chave: o Claude percebe pelo sentido e, na dúvida entre «decidiu» e «está a pensar alto», pergunta antes de escrever. Vai direto para o repositório, sem passar pela Drive.
- No fim de um brainstorm, o Claude fecha com uma lista «o que fica»: as decisões (que vão para o repositório) e as propostas (que vão para a Drive). O DM confirma ou corrige.
- Se a conversa não tiver acesso ao repositório (voz, telemóvel), as decisões vão para a Drive num ficheiro «decisões AAAA-MM-DD», marcado como decidido, e o fecho seguinte passa-as para o repositório sem as discutir de novo.
- Se uma decisão contradiz um documento da Drive, ganha a decisão: o Claude atualiza o documento (versão nova) ou assinala-o.
- **Uma decisão de preparação também vai para a Grelha.** O que o DM decide para uma sessão que ainda não se jogou (quem está onde, o que um NPC sabe, o estado de um sítio quando o grupo lá chegar, a forma de uma visão) não é acontecimento e não aparece numa célula só por estar em `registo/decisoes.md` ou na ficha da coisa. Por isso o Claude grava-a em dois sítios, na mesma conversa:
  1. **o cânone**: o ficheiro da coisa e `registo/decisoes.md` (a verdade);
  2. **o lembrete**: uma nota `ideia` em `grelha/revisao.json`, na linha da coisa e na coluna da sessão em que deve entrar (normalmente a próxima), com `because` a apontar para a decisão (`registo/decisoes.md AAAA-MM-DD #N`). Se a coisa ainda não tem linha, entra em `grelha/linhas.json`; um relógio novo entra como fio `t-relogio-*` e como linha.
- A ideia aparece na célula como «?». Quando o DM a aceita na app, passa a plano dele (◆); depois de jogada, o fecho torna-a acontecimento. Uma decisão que substitui outra fecha as notas antigas que a contradizem (`status: fechada`, com a referência à decisão nova).

## O fecho

Faz-se depois de cada sessão ou bloco de preparação. Com o pedido «fecho» (skill `/fecho`), o Claude:

1. **Lê o que a mesa deixou.** A transcrição inteira (a fonte do registo) e a preparação (só para separar o jogado do planeado) na Drive, desde o último fecho; o resumo da Drive não é fonte, escreve-se depois a partir do registo; e, no repositório, a camada do DM em `grelha/dm.json`: os beats marcados «jogado à mesa» (`jogado`), as notas rápidas (`nota`), os planos da sessão que se jogou (`plano`, na coluna dessa sessão) e as correções e decisões ainda por absorver (`revisao.absorbed`).
2. **Escreve a sessão** em `registo/sessoes/sNN-AAAA-MM-DD.md`: o cabeçalho (`n`, `global`, `data`, `titulo`, `capitulo`, `mesa`, `nivel`, `mundo`, `resumo`, `ondeParou`, `beats`), o resumo no corpo e os **acontecimentos com efeitos** (`docs/arquitetura.md`, secção 5), cada um com `fonte: transcrição S<n> (#<global>) <marca de tempo>`: cada plano jogado vira acontecimento com `origem`, cada plano que caiu fica apagado (`deleted`) em `dm.json`.
3. **Atualiza as entidades** (cada correção com `grep` por todas as ocorrências do facto antigo): NPCs novos ou corrigidos (`mundo/`), fios novos (`plano/fios/`, `mesa/fios/`), beats jogados no cabeçalho da sessão, o capítulo da mesa em `plano/campanha.md` quando muda, e as decisões do DM em `registo/decisoes.md`. As ids a acompanhar entram em `grelha/linhas.json`.
4. **Absorve a camada do DM**: cada entrada tratada passa a `revisao.absorbed` (`"d-…": "<id do acontecimento ou da entidade>"`) ou a `revisao.reviewed`; as notas de revisão respondidas ficam `fechada`. Nunca se apaga nada de `dm.json`: a app é a única que lá escreve.
5. **Assinala os conflitos** com o cânone e espera pela decisão do DM antes de os escrever; o que depende do DM fica em `grelha/revisao.json` como `pergunta` ou `discrepancia`.
6. **Valida e grava:** `npm run gravar -- "<mensagem>"` (normaliza, valida, testa, commit, `pull --rebase` e push para `main`; o deploy leva um ou dois minutos).
7. **Atualiza na Drive** o resumo da sessão (escrito a partir do registo, pasta `cotn_2026/resumo_de_sessoes`), a cópia do repositório em `cotn_2026/github_repo` (`docs/copia-drive.md`, logo a seguir ao push), o documento consolidado de cada PC (na pasta de cada PC, dentro de `cotn_2026/pcs`; ids no `AGENTS.md`; refeito a partir das fichas e dos registos em cada fecho) e as saídas que o cânone novo tornou desatualizadas (versão nova, a antiga vai para o lixo), e a data do último fecho, abaixo. Por fim, o registo da mesa: o «Índice de sessões» e os «Jogadores» na pasta `tabletop` (skill `registo-mesa`).

Antes da sessão seguinte, o `/preparar` lê a Grelha para a próxima sessão e deixa ideias e avisos nas células (`grelha/revisao.json`); durante a edição, o `/vigia` revê cada gravação do DM em tempo real. As regras estão em `.claude/skills/`.

## Pastas da Drive que o fecho lê

| Pasta | id |
| --- | --- |
| `cotn_2026/session_prep` | `1WGi5hzOj2oPHEfFmvlwDmJN33X7Ed6h1` |
| `cotn_2026/ideias` | `1MIP9LYli1gLw7DMgz5UYruOzhkbnrP6j` |
| `cotn_2026/pcs/camila_lia` | `1BjFqdDVnXiBCrDh82SwipwHegeHzGgxl` |
| Documentos para jogadores (Mundo, Panteão) | `163OGm6WCbT53Ci2aLraE5xygn5R1Z51B` |
| `exandria` (glossário) | `1ziSnT3gXuEu_NcHzV0C5iAIFoP4tOLDc` |
| `session_records` (transcrições: `<global>_cotn_<nn>/transcript_whisperx.txt`) | `1bmnSRbTupGWiWyjzsHIwIF4_2lQYf_OZ` |
| `cotn_2026/resumo_de_sessoes` (Google Docs, escritos a partir do registo) | `1qSNp-FrEsp0k0J2ijMLUJ0XLlAqy5mn-` |
| `cotn_2026/pcs` (uma pasta por PC, com o documento consolidado; ids no `AGENTS.md`) | `1DlPuhGA7npun4bEQ7ZD7vGm3Tka9ZJot` |
| `cotn_2026/github_repo` (cópia de leitura do repositório; `docs/copia-drive.md`) | `1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R` |
| `DND/skills` (cópia de leitura das skills) | `1gM_AotFxw0zPAjFV14XwDVRAZcRe7A6H` |

## Último fecho

2026-10-18 (sessão 6, #89: registo a partir da transcrição, mortes do Damião e do Alex, o pendente com o Quasi, o pano do culto; resumo v4 na Drive).

Revisão das sessões 1 a 6 contra as transcrições: 2026-10-18 (notas `n-tr…` em `grelha/revisao.json`), feita no mesmo dia, antes do fecho da sessão 6.
