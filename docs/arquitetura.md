# Arquitetura do repositório

Decidido pelo DM a 2026-10-11, a partir da proposta e da revisão do mesmo dia. Substitui a base de dados de `docs/grelha.md` (as secções dessa especificação sobre a linha dona, os ecos, os estados, a camada do DM, a revisão, `/vigia` e `/preparar` continuam válidas) e substitui `docs/ids.md` quando a migração (fase A) terminar.

## 1. Porquê mudar

- **O plano está rico e o que aconteceu está em prosa.**
  - O livro tem por cima 175 personagens, 147 beats e 215 relações novas ou alteradas pelo DM.
  - No `state.json`, os campos de revelações, atitudes, portentos, flags e notas estão vazios, e só há 3 beats marcados como jogados.
  - O que aconteceu vive em cerca de 250 KB de texto (`pcs.md`, `canone.md`, resumos das sessões).
- **A mesma coisa vive em vários sítios.** Para saber quem é o Morgid hoje, é preciso juntar o livro, dois ou três ficheiros de patches, as relações noutro ficheiro e a prosa do `pcs.md`, do `canone.md` e dos resumos. A camada da campanha está organizada pela origem das mudanças (`mesa`, `remix`, `smuggling`, `zz-mesa-patches`…), e não pelas coisas.
- **Há dois relógios.** O cânone mede o tempo em beats; a mesa e a Grelha medem-no em sessões. A travessia do pântano está a meio há cinco sessões, e o modelo não tem «em curso».
- **Por isso, as coisas desencontram-se.** O Skr'a morre na sessão 2 no cânone e na sessão 1 no `pcs.md`. O Alex não tem nome na ficha. A sessão 4 tem dois títulos. O `fluxo.md` diz que o último fecho foi o da sessão 4.
- **A Grelha, como estava especificada,** seria uma terceira fonte de verdade, com ids próprias e cópias das personagens.
- **O repositório é público** e os segredos dos PCs estão à vista. O DM decidiu (2026-10-11) manter o `campaign-cotn` público por agora e resolver a privacidade noutra altura. A cifra de setembro (`campaign-cotn-data`) fica abandonada.

## 2. Princípios

1. **Uma coisa, um ficheiro.** Cada personagem, local, item, segredo, fio, beat e sessão vive num ficheiro Markdown. Os campos estruturados ficam no cabeçalho (YAML) e o texto por baixo. Os dados e a prosa sobre a mesma coisa ficam juntos. O repositório abre-se como um vault do Obsidian.
2. **Uma só lista de ids.** O nome do ficheiro é a id, e as ids atuais mantêm-se todas. A Grelha, as relações, as ligações no texto (`[[c-morgid]]`) e a app usam as mesmas.
3. **Separar pela natureza, não pela origem.** Há quatro pastas: `mundo` (o que existe), `plano` (o que pode acontecer), `registo` (o que aconteceu) e `mesa` (fora do jogo). A origem (livro, Remix, mesa, DM) passa a ser um campo.
4. **O estado calcula-se.** Atitudes, vivos e mortos, quem tem o quê, quem sabe o quê, pistas dadas, cenas jogadas e relógios saem do registo. Nada disto se escreve à mão.
5. **O livro é uma referência, não uma camada.** `livro/` guarda a extração do PDF, só de leitura. Deixa de haver patches, `_remove` e junção de camadas.
6. **Um escritor por ficheiro.**
   - O Claude escreve o cânone e o registo, no fecho e nas decisões do brainstorm.
   - A app escreve só a camada do DM.
   - O DM pode editar qualquer ficheiro à mão.
7. **Os dados entram no build.** São cerca de 870 ficheiros: a app nunca os lê soltos do repositório. Um script monta-os num só pacote no build. Só os ficheiros de `grelha/` se lêem e escrevem ao vivo pela API, porque são três e mudam a toda a hora.
8. **A app atual nunca deixa de funcionar.** Durante a migração, um adaptador monta os ficheiros novos na forma que a app já conhece. As vistas migram depois, uma a uma.

## 3. Estrutura

```
mundo/                          o que existe
  personagens/  c-*.md          PCs, NPCs, rivais, divindades
  facoes/       f-*.md          inclui f-grupo, o próprio grupo
  locais/       l-*.md
  itens/        i-*.md          objetos e documentos (os handouts)            novo
  segredos/     r-*.md          as verdades e o plano das suas pistas
  lore.md                       história, divindades, geografia
plano/                          o que pode acontecer
  campanha.md                   título, capítulo atual, convergência, capítulos
  beats/        b-*.md          os beats do livro e do DM
  fios/         a-*, amb-*, t-*.md   arcos, ambições, frentes, relógios, missões, promessas,
                                decisões, gatilhos, sementes, desfechos, laços, agendas
registo/                        o que aconteceu
  sessoes/      s00-sessao-zero.md, s01-2026-09-02.md, …
  decisoes.md                   decisões do DM entre sessões, por data
mesa/                           fora do jogo
  jogadores/    p-*.md          com quem joga, preferências, acordos
  fios/         t-*.md          teorias dos jogadores, piadas internas, confessionário
  regras.md                     regras da casa
grelha/
  linhas.json                   as ids que a Grelha acompanha, por ordem      Claude
  dm.json                       a camada do DM                                só a app
  revisao.json                  notas, ideias, entradas revistas              Claude
livro/                          o livro tal como foi extraído (só leitura)
docs/                           arquitetura, fluxo, método, glossário
```

Duas palavras ficam com um só sentido: **beat** é uma cena do plano (`plano/beats/`); **cena** é a cena pessoal de um PC num acontecimento.

## 4. Os ficheiros

### Uma entidade

```markdown
---
id: c-elmiro-trigueiro
nome: Recruta Elmiro Trigueiro
tipo: npc
facoes: [f-dwendalian-empire]
casa: l-fort-venture
capitulos: [ch0]
quer: ir para casa, a norte do rio
teme: a drow
origem: [mesa, patrulha]
relacoes:
  - { com: c-corvelo, tipo: serves, nota: o sargento dele }
---
## Resumo
O recruta do capacete grande de mais, a puxar a jangada…

## Segredo
…
```

- As relações ficam no ficheiro de quem parte (`from`), com o tipo, a nota e, se houver, `desde`, `ate` e `se` (os antigos `fromBeat`, `untilBeat` e `condition`).
- **As relações têm duas fontes, com uma regra.** O cabeçalho é o ponto de partida e o plano do livro. Os efeitos `relacao` do registo (secção 5) são o que aconteceu à mesa, e mandam.
- Os textos longos (resumo, segredo, agenda, notas) passam para secções do corpo.
- O cabeçalho guarda só o que é curto e estruturado.
- `origem` regista de onde veio cada coisa: os nomes dos antigos ficheiros de patches (`mesa`, `remix`, `smuggling`, `act4`, `decrepola`, `lia`, `patrulha`, `pcs`).

### Um fio

Os fios juntam tudo o que é enredo e não é uma coisa do mundo. Os arcos (`a-`) e as ambições (`amb-`) mantêm as suas ids; os fios novos usam `t-`. Os tipos `teoria` e `mesa` são fora do jogo e vivem em `mesa/fios/`.

```markdown
---
id: t-promessa-800po
tipo: promessa        # arco | ambicao | frente | relogio | missao | promessa | decisao | gatilho | semente | desfecho | laco | agenda | teoria | mesa
nome: 800 po à chegada ao forte
envolve: [c-corvelo, f-grupo]
pc: null              # arcos e ambições de um PC
passos: null          # frentes e relógios: o máximo, ou um passo por capítulo
---
Prometidas sem garantia; o Lucan vê que ele diz o que for preciso.
```

As frentes das fações (hoje em `portents.json`) passam a fios `frente`, um por fação, com um passo por capítulo. Os relógios da mesa (os revivify da Bolbara, a tempestade) são fios `relogio`.

### Uma sessão

Os resumos de `docs/sessoes/` já têm cabeçalho YAML (`session_global`, `session_campaign`, `date`). O corpo fica tal como está; o cabeçalho ganha o que a Grelha precisa.

```markdown
---
id: s-088
n: 5
data: 2026-10-07
titulo: As Noites da Terceira Lança
capitulo: ch0
mesa: { c-pc-lucan: p-renata, c-pc-isco: p-pedro-ropio, c-pc-quasi: p-pedro-silva, c-pc-lia: p-camila }
ausentes: []
mundo: { de: "dia 2, noite", ate: "dia 4, manhã" }
nivel: 3
beats: { b-0-patrulha-imperio: em-curso, b-0-marsh-crossing: em-curso }
acontecimentos:
  - id: e-s5-04
    tipo: escolha
    texto: A Lia cura o Alex à vista do Elmiro.
    envolve: [t-decisao-curar-alex, c-pc-lia, c-soldado-doente, c-elmiro-trigueiro]
    efeitos:
      - { atitude: c-soldado-doente, valor: amigavel }
  - id: e-s5-05
    tipo: consequencia
    texto: O Elmiro conta ao sargento. Já sabe o que o grupo vale.
    envolve: [c-elmiro-trigueiro, c-corvelo]
    origem: [e-s5-04]
---
## Resumo
…

## Cronologia
…
```

(Os acontecimentos acima são um exemplo.)

`s00-sessao-zero.md` guarda o ponto de partida:
- o que cada PC sabe ao começar, que hoje está em «O que X sabe» no `pcs.md`;
- quem joga com quem;
- os acordos de mesa.

### As decisões

`registo/decisoes.md` é o diário das decisões do DM, por data, como hoje as secções «Decidido pelo DM» do `canone.md`. É um registo: a verdade atual fica no ficheiro da entidade a que a decisão diz respeito, e a decisão aponta para ele (`[[c-morgid]]`).

## 5. Acontecimentos e efeitos

Os acontecimentos são os factos da especificação da Grelha:
- campos `id`, `tipo`, `texto`, `envolve`, `origem` e `tags`;
- os tipos `relacao`, `promessa`, `escolha`, `consequencia`, `pista`, `cena`, `estado` e `registo`;
- a mesma regra da linha dona.

A novidade são os **efeitos**: uma lista curta e fechada do que o acontecimento muda no estado.

| Efeito | Exemplo | O que muda |
| --- | --- | --- |
| `estado` | `{ estado: c-bento-ruivo, valor: morto }`, com `onde` opcional | vivo, morto, desaparecido, preso; onde está |
| `atitude` | `{ atitude: c-elmiro-trigueiro, valor: desconfiado }` | atitude para com o grupo |
| `posse` | `{ posse: i-adaga-drow, com: c-pc-lucan }` | quem tem o item; também regista um handout entregue |
| `sabe` | `{ sabe: r-pc-quasi-metade, quem: [c-pc-isco], nivel: parcial }` | quem sabe o quê. `quem: [mesa]` quer dizer que os jogadores sabem fora de jogo |
| `pista` | `{ pista: r-bolbara-possessed }` | pistas dadas (a regra das três pistas passa a contar as dadas) |
| `relogio` | `{ relogio: t-terceira-vez, valor: 2 }` | relógios e frentes |
| `fio` | `{ fio: t-missao-bolbara, valor: cumprido }` | missões, promessas, ambições: aberto, cumprido, quebrado, fechado |
| `relacao` | `{ relacao: c-morgid, com: c-pc-lucan, tipo: enemy, valor: sim }` | uma relação que aparece ou acaba |
| `contador` | `{ contador: insanidade, de: c-pc-quasi, mais: 2 }` | pontos de insanidade, corrupção, outros contadores da casa |

Os beats tocados na sessão ficam no cabeçalho (`beats`), com um de três estados: `jogado`, `em-curso` ou `saltado`.

## 6. O estado calculado

`src/lib/estado.ts` percorre as sessões por ordem e aplica os efeitos. O resultado substitui o `state.json`.

| Para… | Calcula |
| --- | --- |
| cada personagem | estado, onde está, atitude, relações atuais, contadores (PCs), cenas pessoais por sessão |
| cada item | quem o tem e desde quando |
| cada segredo | quem sabe, com que nível, se a mesa sabe fora de jogo, pistas dadas contra pistas planeadas |
| cada beat | por jogar, em curso, jogado ou saltado |
| cada fio | aberto, pago, cumprido, quebrado, fechado; o valor dos relógios e das frentes |
| a mesa | presenças, nível, dia no mundo |

## 7. A Grelha sobre esta base

O modelo da Grelha (`docs/grelha.md`) mantém-se: linha dona, ecos, estados, camada do DM, revisão, `/vigia` e `/preparar`. Muda a base:

- **Linhas:** são as ids listadas em `grelha/linhas.json`, de qualquer pasta. Não são cópias.
  - O tipo da linha vem da entidade. `personagens` dá PC, NPC ou Rival; `facoes`, Fação; `locais`, Local; `itens`, Item; `segredos`, Revelação. Os `fios` dão o seu tipo (Ambição, Agenda, Laço, Missão, Decisão, Promessa, Relógio, Gatilho, Semente, Desfecho, Teoria, Mesa) e `jogadores` dá Jogador.
  - As linhas de Sessão (dia no mundo, nível, resumo, onde parou, presenças) calculam-se a partir dos cabeçalhos.
- **Regra da dona**, com as mesmas regras de antes: `relacao` vai para o fio `laco`, `promessa` para o fio `promessa`, `escolha` para o fio `decisao`, `pista` para o segredo, `cena` para o primeiro PC, e o resto para `envolve[0]`.
- **Colunas jogadas:** os acontecimentos das sessões.
- **Colunas futuras:** os planos da camada do DM e o plano do cânone.
  - Os beats do capítulo que envolvem a linha (participantes, local, fios, segredos) aparecem resumidos: «3 beats».
  - As linhas Relógio mostram os passos das frentes.
  - As linhas Revelação mostram as pistas planeadas.
- **Camada do DM:** como na especificação, mais três tipos de entrada:
  - `acompanhar`, para pôr uma id na Grelha;
  - `nova`, para criar uma entidade, por exemplo um NPC improvisado;
  - `jogado`, para marcar um beat à mesa.

  A revisão passa estas entradas para os ficheiros.
- **Uma só linha temporal**, com dois modos:
  - o normal;
  - «Plano», em que as linhas são os arcos e as células os beats por capítulo. É a atual Linha temporal, dentro da Grelha.

## 8. A app

- **Leitura.**
  - `scripts/montar.ts` corre no build (e no `npm run dev`): lê todos os ficheiros Markdown, valida-os e escreve um só pacote JSON em `src/generated/` (ignorado pelo git), que a app importa. É o mesmo mecanismo do `import.meta.glob` de hoje, com um passo de montagem antes.
  - Enquanto as vistas atuais existirem, o mesmo script escreve também o `Canon` e o `PlayState` na forma de hoje (secção 11, fase A). É o adaptador.
  - `grelha/*.json` lêem-se ao vivo pela API, com o token, com o pacote do build como recurso. A app verifica de 30 em 30 segundos se mudaram.
  - Uma alteração ao cânone (um fecho, uma decisão) chega à app com o deploy seguinte, em um ou dois minutos.
- **Escrita:** só `grelha/dm.json`. A edição de fichas na app acaba: uma correção numa ficha entra pela camada do DM e pela revisão, como tudo o resto.
- **Vistas que ficam:**
  - **Grelha**, a vista principal;
  - **Ficha**, uma página por coisa, com o texto, os campos, o estado atual, a história (os acontecimentos em que entra), o plano (os beats à frente), as relações e as menções noutros ficheiros. Substitui o painel de detalhe;
  - **Relações**, o grafo, já com as atitudes atuais;
  - **Sessão**, a ferramenta para a mesa: o plano da sessão, marcas e notas rápidas;
  - **Índice** e **Definições**.
- **Vistas e funções que saem, porque a Grelha e a Ficha as absorvem:**
  - a Linha temporal passa a ser o modo Plano;
  - as Frentes passam a linhas Relógio;
  - as Revelações passam a linhas Revelação, com pistas planeadas, pistas dadas e quem sabe;
  - os PCs passam ao filtro por PC e às fichas;
  - «Ver só o livro» e «repor do livro» desaparecem: o livro consulta-se em `livro/`, e a Ficha mostra `origem`.

## 9. O fluxo

- **No fecho,** o Claude:
  - escreve o ficheiro da sessão, com o cabeçalho, os acontecimentos com efeitos e o resumo;
  - atualiza as entidades (NPCs novos, nomes, fios novos) e regista as decisões em `registo/decisoes.md`;
  - revê e absorve a camada do DM.
- **No brainstorm,** as decisões vão direto para os ficheiros das entidades e para `registo/decisoes.md`.
- **À mesa,** a app regista marcas e notas rápidas em `grelha/dm.json`, e o fecho seguinte trata delas.

## 10. Migração sem perder nada

A migração tem duas metades, com garantias diferentes.

- **A metade mecânica** (entidades, campos, relações, beats, arcos, ambições, frentes, sessões) faz-se por script e verifica-se por script. `scripts/migrar.ts` junta as camadas exatamente como a app faz hoje e escreve um ficheiro por coisa, com as ids intactas. `scripts/verificar-migracao.ts` remonta tudo a partir dos ficheiros novos e compara com o cânone antigo: cada entidade, cada campo, cada relação, cada secção dos docs.
- **A metade interpretativa** (transformar o `canone.md`, o «O que X sabe» do `pcs.md` e as cinco sessões em acontecimentos com efeitos) é trabalho do Claude e revisão do DM, sessão a sessão. Os textos originais ficam intactos no corpo dos ficheiros, por isso nada se perde, mesmo que a extração falhe algo. A semente da Grelha (`docs/grelha-semente.json`) já é a primeira versão dos acontecimentos das sessões 1 a 5.

Os ficheiros antigos só saem quando a verificação passar e o DM aprovar. O histórico do git guarda-os de qualquer forma.

| De | Para |
| --- | --- |
| `data/book/**` | `livro/` (referência, igual) e, juntado com a camada da campanha, os ficheiros de `mundo/` e `plano/` |
| `data/campaign/characters/*` (10 ficheiros) | `mundo/personagens/c-*.md`; o nome de cada ficheiro antigo vai para `origem` |
| `data/campaign/factions/*` | `mundo/facoes/f-*.md` |
| `data/campaign/factions/portents.json` | `plano/fios/t-frente-*.md` |
| `data/campaign/locations/*` | `mundo/locais/l-*.md` |
| `data/*/relations/*` | `relacoes` no ficheiro de quem parte |
| `data/*/revelations/*` | `mundo/segredos/r-*.md` |
| `data/*/beats/*` | `plano/beats/b-*.md`; `remix-notes.json` vai para a secção «Notas do Remix»; os prefixos «JOGADO» e «PROPOSTA» passam ao registo e a um campo `estado` |
| `data/*/arcs.json`, `data/campaign/ambitions/*` | `plano/fios/a-*.md`, `amb-*.md` |
| `data/*/campaign.json` | `plano/campanha.md` |
| `data/state.json` | sessões no registo; `playedBeats` passa a `beats` no cabeçalho de cada sessão; `currentChapter` passa a `plano/campanha.md`; os campos vazios passam a ser calculados |
| `docs/sessoes/*.md` | corpo de `registo/sessoes/sNN-*.md`, igual, mais os acontecimentos |
| `docs/canone.md`, secções de sessão | «Confirmado» e «Mudou em jogo» passam a acontecimentos dessa sessão; «Fios novos» a ficheiros de fios; «Por revelar» aos segredos e às notas de DM das entidades; «Conflitos por decidir» a `grelha/revisao.json` |
| `docs/canone.md`, «Decidido pelo DM» | `registo/decisoes.md`, igual, por data |
| `docs/pcs.md` | fichas dos PCs (backstory, «O que o DM já definiu», «Em aberto»); «O que X sabe» passa a efeitos `sabe` na sessão zero; «Ligações entre os três» passa a fios `laco` |
| `docs/regras.md` | `mesa/regras.md`, igual. As secções de itens (a Adaga, Itens da mesa, Medalhas, Amuleto, Mote, Essência, Colar, Refúgio) vão para `mundo/itens/`; a Fera, as transformações e a máscara vão para as fichas dos PCs. Fica uma ligação no sítio antigo |
| `docs/lore.md` | `mundo/lore.md`, igual. As secções de uma só coisa (Baeshra, Sess'inek, Obeliscos negros, Decrépola) passam para a ficha dela, com uma ligação |
| `docs/handouts.md` | `mundo/itens/i-doc-*.md`, com o texto no corpo; a entrega passa a efeitos `posse`; «por escrever» passa a `estado: rascunho` |
| teorias dos jogadores, piadas internas, confessionário (hoje só na semente da Grelha e nos resumos) | `mesa/fios/t-*.md` |
| `docs/grelha.md` | fica, com a nota de que a base de dados é esta; `docs/grelha-semente.json` fica como semente dos acontecimentos |
| `docs/ids.md` | esta arquitetura, no fim da fase A (as listas de ids deixam de ser precisas: as pastas são o índice) |
| `docs/glossario.md`, `docs/metodo.md`, `docs/fluxo.md` | ficam em `docs/`; o fluxo e a secção «Como preparar com a app» são atualizados |
| `scripts/validate-data.ts`, `scripts/normalizar-texto.py` | reescritos para as pastas novas; o normalizador nunca toca em `livro/` nem em `grelha/dm.json` |

As contradições conhecidas (o Skr'a, o Alex, o Morgid, o título da sessão 4, a adaga, o último fecho, a frequência do Pedro Silva) resolvem-se durante a migração. As que dependem do DM vão para `grelha/revisao.json`.

## 11. Fases

Cada fase deixa a app a funcionar e acaba com `npm run validate`, `npm test` e `npm run check` limpos, e com o DM a ver o resultado.

| Fase | O quê | O que o DM vê |
| --- | --- | --- |
| A. Migração | `migrar.ts`, `verificar-migracao.ts`, `montar.ts` com o adaptador; os acontecimentos das sessões 0 a 5, revistos pelo DM | a app de hoje, igual, a ler da estrutura nova |
| B. Estado e Ficha | `estado.ts` e a vista Ficha | fichas com história, estado atual e plano |
| C. Grelha (ler) | linhas por id, acontecimentos, plano do cânone nas colunas futuras, modo Plano | a Grelha com as cinco sessões |
| D. Escrever e rever | camada do DM, revisão, `/vigia` | edita uma célula e recebe perguntas |
| E. Preparar e arrumar | `/preparar`, fluxo do fecho novo; saem as vistas antigas, o adaptador e os ficheiros antigos | a app final |

## 12. Decisões

Decidido pelo DM a 2026-10-11:
- **Privacidade:** o `campaign-cotn` continua público, sem cifra; a privacidade resolve-se noutra altura. O `campaign-cotn-data` fica abandonado.

Por defeito, salvo veto do DM:
- **Formato:** um ficheiro Markdown com cabeçalho por coisa.
- **Livro:** fica como referência, só de leitura, em `livro/`.
- **Vistas:** Linha temporal, Frentes, Revelações e PCs saem, absorvidas pela Grelha e pela Ficha; «Ver só o livro» e «repor do livro» também.
- **Sessão zero:** `s00` guarda o ponto de partida dos PCs e da mesa.
- **Edição na app:** só a camada do DM; as fichas corrigem-se pela revisão.

## 13. Estado da fase A (2026-10-11)

Feito no ramo `fase-a`, por aprovar pelo DM. O que ficou decidido ao implementar:

- **Ficheiros de prosa sem cabeçalho** (`mundo/lore.md`, `mesa/regras.md`, `registo/decisoes.md`) convivem com os ficheiros de entidades. Só os ficheiros com cabeçalho têm id.
- **Sessões:** o nome do ficheiro é `sNN-AAAA-MM-DD.md`, legível, e a id fica no cabeçalho (`id: s-088`, a de sempre). É a única exceção à regra «o nome do ficheiro é a id». A sessão zero é `s00-sessao-zero.md`, sem data, e não conta como jogada.
- **Campos novos vindos do mockup**, guardados no cabeçalho e por confirmar pelo DM: `legenda` (a linha curta da Grelha), `atitudeAtual` (a pílula de atitude), `marcas` (deve-nos, devemos-lhe, rancor, patrono), `etiquetas` (ex.: «insanidade: por registar») e, nos segredos, `sabe` (quem já sabe, em texto). `atitudeAtual` é um ponto de partida: o registo manda, como nas relações.
- **`origem`** guarda os nomes dos antigos ficheiros de patches (`mesa`, `remix`, `pcs`, `zz-mesa-patches`…), `livro` para o que vem do livro e `grelha`, `regras` ou `handouts` para o que nasceu na migração.
- **`plano/campanha.md`** não tem id: é um só, e guarda também o capítulo atual (`capituloAtual`).
- **Os portentos** das fações passaram a fios `frente` (`t-frente-<fação>.md`), com um passo por capítulo (`passos`).
- **Marcadores ✚ e ▲:** 29 entidades criadas pela campanha e corrigidas por um segundo ficheiro de patches levavam ▲ («alterado face ao livro») sem estarem no livro; passam a ✚. É a única diferença que a verificação aceita.
- **O normalizador** (`scripts/normalizar-texto.py`) passa pelo corpo dos ficheiros novos e deixa o cabeçalho (ids, tags, campos curtos) como está; salta as entidades com `livro` em `origem`, `livro/` e `grelha/`.
- **A app** lê `src/generated/dados.json` (a árvore já lida, gerada por `scripts/montar.ts` no `dev`, `build` e `check`, ignorada pelo git), monta daí em runtime o cânone na forma antiga (adaptador) e deixou de ler e escrever `data/` ao vivo. A edição está desligada até à fase D; o token fica guardado nas Definições.
- **Scripts:** `npm run migrar` (refaz a estrutura nova a partir de `data/` e `docs/`), `npm run verificar` (compara com o antigo), `npm run validate` (monta e valida), `npm test`. Os antigos `data/` e `docs/` ficam intactos até à fase E.
- **Por fazer, de propósito e não por acidente:** os hubs dos capítulos continuam em inglês em `plano/campanha.md`, tal como no livro; a correção é uma decisão de cânone à parte.

## 14. Estado da fase B (2026-10-11)

Feito no ramo `fase-b`. O que ficou:

- **`src/lib/estado.ts`** calcula o estado a partir do registo, sessão a sessão, só com as sessões jogadas (data até hoje) e a sessão zero: estado e onde está, atitude, relações do registo, contadores e cenas pessoais de cada personagem; quem tem cada item; quem sabe cada segredo (e se a mesa sabe fora de jogo), pistas dadas; relógios e estados dos fios; o estado de cada beat; a mesa (última sessão, próxima, nível, dia no mundo, presenças). Cada valor traz a marca de onde veio (sessão e acontecimento).
- **A Ficha** (`#/ficha/<id>`, `src/components/Ficha.svelte`) é uma página por coisa, para qualquer documento com id, sessões incluídas: cabeçalho com o tipo e as pílulas do estado atual; «Agora», com os campos e o estado por tipo; o texto do ficheiro em Markdown, com `[[id]]` e ids soltos a apontar para fichas; «História», os acontecimentos em que entra, por sessão, com a dona e os efeitos; «Plano», os beats à frente que a envolvem, por capítulo; «Relações», as do cabeçalho e as que chegam; «Menções», os outros ficheiros que a referem. Abre-se pelo botão «Ficha →» do painel de detalhe e por qualquer ligação.
- **Nomes:** os segredos que vieram do mockup têm `nome` (a linha da Grelha); os do livro mostram a verdade encurtada.
- **Bibliotecas:** `md`, `esquema`, `adaptador` e o modelo da árvore passaram para `src/lib/arquivo/`, para a app e os scripts usarem o mesmo código. O pacote do build é só `dados.json`.
- **Por fazer:** a Ficha ainda não substitui o painel de detalhe (fase E) e não edita nada (fase D).

## 15. Estado da fase C (2026-10-11)

Feito no ramo `fase-c`. O que ficou:

- **O modelo da Grelha** (`src/lib/grelha/modelo.ts`, puro, com testes) constrói as colunas (sessões jogadas, a próxima, o resto do capítulo atual e os capítulos seguintes), as linhas (as ids de `grelha/linhas.json`, com o tipo deduzido da entidade ou forçado, mais as quatro linhas de Sessão calculadas dos cabeçalhos) e as células: os acontecimentos na linha dona (regra de `dona.ts`), os ecos nas outras linhas envolvidas, o estado de cada um (pista, registo, fechado, pago, aberto, esquecido), o plano do cânone nas colunas futuras (beats por capítulo que envolvem a linha, passos das frentes, pistas planeadas), as ideias de `grelha/revisao.json` na célula alvo e o item «sem cena pessoal planeada» na próxima sessão para os PCs que já jogaram. Os filtros (grupo, PC, só com pendentes) e as contagens seguem `docs/grelha.md`.
- **`grelha/linhas.json`** passou a guardar também os PCs a que cada linha diz respeito por natureza (`pcs`, com `*` para as linhas de contexto), vindos do mockup; o filtro por PC junta-lhes os PCs tocados pelos acontecimentos de que a linha é dona.
- **A vista** (`src/components/Grelha.svelte`, `#/grelha`, a primeira da barra lateral) segue o mockup: cabeçalhos e colunas de tipo e nome fixos, faixas por grupo, a coluna da sessão atual destacada, marcadores com as formas e as cores do mockup e fundos adaptados ao tema escuro, dois ecos por célula mais «+N», ideias tracejadas, legenda. Clicar numa linha, numa sessão, num beat ou num eco abre a Ficha. No telemóvel só a grelha faz scroll.
- **O modo Plano** é a antiga Linha temporal dentro da Grelha: os arcos nas linhas, os capítulos nas colunas, os beats nas células com o seu estado.
- **Estados ainda sem fonte:** `planeado` e `falta preparar` (fora do «sem cena») só aparecem com a camada do DM, na fase D. Os ecos saltam a dona quando ela não está na Grelha.
- **Por fazer:** a camada do DM, a revisão na célula e o `/vigia` (fase D); a saída das vistas antigas e do painel de detalhe (fase E).

## 16. Estado da fase D (2026-10-11)

Feito no ramo `fase-d`. O que ficou:

- **A camada do DM** (`src/lib/grelha/dm.ts`, puro, com testes) segue `docs/grelha.md`, secções 9 e 10, com dois tipos a mais, `acompanhar` (pôr uma id do cânone na Grelha) e `jogado` (um beat marcado à mesa, no campo `beat`); o tipo `nova` previsto na secção 7 é o `linha` da especificação. `aplicarDm()` junta a camada à Grelha construída: planos nas colunas futuras (`planeado` se preparado, senão `falta preparar`), correções com ✎ e o original guardado, verdades só DM, decisões no cabeçalho, arquivos, linhas novas no fim do seu grupo, respostas que fecham notas, ideias rejeitadas que saem e ideias aceites que viram planos. Um plano com `origin` passa esses acontecimentos a `planeado (→ S6)`; uma cena planeada para a próxima sessão tira o «sem cena pessoal planeada». O que não cabe numa célula sai como caixa de entrada: as notas rápidas soltas e os planos que ficaram em colunas já jogadas, com «Passa para a S{N+1}», «Fica para o capítulo» e «Cai».
- **A gravação** (`src/lib/grelha/store.svelte.ts`): só a app escreve `grelha/dm.json`, e cada «Guardar» é um commit só desse ficheiro, pela API do GitHub, com a mensagem a dizer o que mudou. Em conflito, relê, funde por id (fica o `at` mais recente) e repete uma vez; se falhar, a entrada fica «por gravar» e há um botão para tentar de novo. Com token, a app lê `dm.json`, `revisao.json` e `linhas.json` do repositório sem cache e verifica de 30 em 30 segundos se o ramo mudou. Sem token, fica com o pacote do build e o que se editar fica só no browser: dá para experimentar, não para guardar.
- **O editor** (`src/components/GrelhaEditor.svelte`, uma gaveta) nunca pede ao DM que classifique a edição: uma coluna jogada dá correção ou verdade (com «Só DM»), uma coluna futura dá plano, o cabeçalho dá decisão. Sugere o tipo de acontecimento pelo tipo da linha, mostra antes de gravar a linha dona onde o item vai ficar e, sem dona, não grava. Na célula mostra ainda as notas da revisão com resposta, as ideias com aceitar e rejeitar, «Arquivar» nos factos abertos e «nasce de» para ligar um plano aos acontecimentos que paga. Os botões «Nota rápida», «Nova linha» e «Acompanhar» ficam na barra da Grelha; a Ficha ganhou «Acompanhar na Grelha» e, nos beats, «Marcar jogado à mesa». Clicar num eco abre o editor na célula da dona.
- **A revisão em tempo real** é uma skill de conversa, `.claude/skills/vigia/SKILL.md`, com `scripts/escuta.sh` a avisar quando `origin/main` muda e a esperar que o DM pare de guardar. As regras por tipo de entrada estão na skill; o Claude escreve só `grelha/revisao.json` e, depois da confirmação do DM, os ficheiros de `mundo/`, `plano/`, `registo/` e `mesa/`.
- **Validação:** `grelha/dm.json` é da app e nunca pode partir o deploy, por isso os problemas nele são avisos (id sem `d-`, id repetida, `kind` desconhecido, sem `at`, linha, beat, `involves` ou `fact` que não existem); um `reviewed` ou `absorbed` em `revisao.json` que aponte para uma entrada inexistente é erro, porque esse ficheiro é do Claude.
- **Na vista:** os cabeçalhos fixos das sessões ficaram opacos (o conteúdo passava por baixo) e a linha de estado por cima da grelha diz de onde vem a camada do DM e se há algo por gravar.
- **Por fazer:** `/preparar`, o fluxo do fecho novo em `docs/fluxo.md` e a saída das vistas antigas, do painel de detalhe, do adaptador e dos ficheiros antigos (fase E). A fusão da camada do DM nos ficheiros, na absorção, continua a ser feita pelo Claude no fecho, por desenho.

## 17. Estado da fase E (2026-10-12)

Feito no ramo `fase-e`. O que ficou:

- **A app final** tem a Grelha (com o modo Plano), as Relações, a Sessão, o Índice, as Definições e a Ficha. Saíram a Linha temporal, as Frentes, as Revelações, os PCs, o painel de detalhe, «Ver só o livro», «repor do livro», o seletor de capítulo da barra superior, o «Guardar (N)» e o exportar/importar: tudo o que escrevia no cânone ou precisava das duas camadas antigas. A vista inicial é a Grelha; qualquer chip ou ligação abre a Ficha, e «voltar» é o do browser.
- **O modelo antigo saiu inteiro:** `src/lib/types.ts`, `validate.ts`, `layers.ts`, `timeline.ts`, `graph.ts`, `search.ts`, o adaptador e `scripts/migrar.ts`, `verificar-migracao.ts`, `validate-data.ts`, `scripts/lib/antigo.ts`, `scripts/migracao/`. `src/lib/arquivo/esquema.ts` ficou só com o esquema (pastas, prefixos, origem). `data/` e os docs migrados (`canone.md`, `pcs.md`, `regras.md`, `lore.md`, `handouts.md`, `ids.md`, `sessoes/`) saíram depois de se confirmar que cada parágrafo deles está na estrutura nova; o histórico do git guarda-os.
- **O que as vistas que ficam leem agora:** `src/lib/campanha.ts` (capítulos, capítulo atual, PCs, arcos e as suas cores, posição dos beats), `src/lib/grafo.ts` (o grafo sobre `relacoes` dos cabeçalhos e os efeitos `relacao` do registo, que substituem os do cabeçalho; âmbitos «neste capítulo», «até agora», «já conhecidos» — quem já entrou no registo — e «tudo»), `src/lib/pesquisa.ts` (sobre o índice das fichas, sessões incluídas) e `src/lib/grelha/viva.ts` (a Grelha com a camada do DM, a mesma para a app e para o script). Todos puros, com testes.
- **A Sessão** passou a ser a ferramenta para a mesa descrita na secção 8: o plano da próxima sessão lido da coluna da Grelha, linha a linha; os PCs sem cena e os esquecidos; os beats do capítulo por jogar, com ✓ a registar `jogado` na camada do DM; o próximo beat pronto por arco (pelos `requer`); as notas rápidas (`nota`); as sessões do registo com presenças. As flags, as revelações marcadas e os portentos feitos da vista antiga não têm equivalente: eram do estado escrito à mão, e agora são efeitos dos acontecimentos.
- **A validação** (`scripts/lib/validar-arvore.ts`) herdou as verificações do cânone antigo: fações, casa, capítulos e estados das personagens; líderes, aliados e inimigos das fações; `pai`, capítulo e ciclos dos locais; relações (destino, tipo, `memberOf` para fação, `desde`/`ate`); beats (arcos, capítulo, local, participantes, `revela`, `requer` e os seus ciclos, escolhas, portento, posições repetidas); segredos (pistas, regra das três pistas, quem os revela); ambições, frentes e arcos sem beats. Os mesmos 89 avisos de antes.
- **`scripts/grelha.ts`** (`npm run grelha`) imprime a Grelha em texto: contagens, a coluna da próxima sessão, esquecidos, abertos, por rever, por responder, caixa de entrada e a mesa; `--linha <id>` dá uma linha célula a célula e `--json` dá tudo. É o que o `/preparar` e o `/vigia` leem.
- **As skills:** `/preparar` (a leitura antes da sessão: esquecidos, PCs sem cena, planos que pagam o quê, cânone à frente, relógios; escreve `ideia` e `aviso` em `grelha/revisao.json`), `/fecho` (a ordem de trabalho do fecho novo, em `docs/fluxo.md`) e `/vigia` (fase D). O normalizador deixou de passar por `data/`.
- **Docs:** `README.md`, `docs/fluxo.md` (o fecho) e `docs/metodo.md` (secção 4) descrevem a app final. `docs/grelha.md` fica como especificação, com a nota do topo; `docs/migracao-fase-a.md` fica como relatório.
- **Os prefixos «JOGADO (sessão N) ·» e «PROPOSTA ·»** saíram dos títulos dos cinco beats que os tinham (secção 10): os jogados já estavam marcados no cabeçalho das sessões 3 e 5; os propostos (`b-0-hesskar-ro`, `b-0-ritual-stone-lucan`, `b-1-mirimm-reconhece`) ganharam `estado: proposta` no cabeçalho, que a Ficha, o Índice, a Sessão e o modo Plano mostram como «proposta» até se jogarem. A validação recusa títulos com os prefixos e qualquer outro valor de `estado` num beat: jogado, em curso e saltado vêm do registo.
- **O deploy** deixou de correr nos pushes que só tocam em `grelha/dm.json` (`paths-ignore` no workflow): a app lê esse ficheiro ao vivo com o token, e sem token o que se edita fica só no browser. Qualquer outro ficheiro continua a fazer deploy, e o build leva sempre o `dm.json` mais recente.
