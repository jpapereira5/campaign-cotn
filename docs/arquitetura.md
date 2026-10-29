# Arquitetura do repositório

Decidido pelo DM a 2026-10-11, a partir da proposta e da revisão do mesmo dia. Substitui a base de dados de `docs/grelha.md` (as secções dessa especificação sobre a linha dona, os ecos, os estados, a camada do DM, a revisão, `/vigia-cotn` e `/preparar-cotn` continuam válidas) e substitui `docs/ids.md` quando a migração (fase A) terminar.

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

1. **Uma coisa, um ficheiro.** Cada personagem, local, item, segredo, fio, beat e sessão vive num ficheiro Markdown. Os campos estruturados ficam no cabeçalho (YAML) e o texto por baixo. Os dados e a prosa sobre a mesma coisa ficam juntos.
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

O modelo da Grelha (`docs/grelha.md`) mantém-se: linha dona, ecos, estados, camada do DM, revisão, `/vigia-cotn` e `/preparar-cotn`. Muda a base:

- **Linhas:** são as ids listadas em `grelha/linhas.json`, de qualquer pasta. Não são cópias.
  - O tipo da linha vem da entidade. `personagens` dá PC, NPC ou Rival; `facoes`, Fação; `locais`, Local; `itens`, Item; `segredos`, Revelação. Os `fios` dão o seu tipo (Ambição, Agenda, Laço, Missão, Decisão, Promessa, Relógio, Gatilho, Semente, Desfecho, Teoria, Mesa) e `jogadores` dá Jogador.
  - As linhas de Sessão (dia no mundo, nível, resumo, onde parou, presenças) calculam-se a partir dos cabeçalhos.
  - As ambições de um PC (`amb-*`) e as agendas (`t-agenda-*`) não são linhas à parte: vivem na linha do PC (ambições) ou de quem tem a agenda (`envolve[0]`; se esse não estiver na Grelha, o PC a que a agenda diz respeito). Os acontecimentos de que o fio é dono aparecem na célula dessa linha com a etiqueta do fio, as contagens somam-se, e o cabeçalho da linha lista os fios. `grelha.alias` guarda a correspondência (fio → linha), para a camada do DM e as notas da revisão continuarem a resolver a id do fio.
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
- **A metade interpretativa** (transformar o `canone.md`, o «O que X sabe» do `pcs.md` e as cinco sessões em acontecimentos com efeitos) é trabalho do Claude e revisão do DM, sessão a sessão. Os textos originais ficam intactos no corpo dos ficheiros, por isso nada se perde, mesmo que a extração falhe algo. A semente da Grelha (`docs/arquivo/grelha-semente.json`) já é a primeira versão dos acontecimentos das sessões 1 a 5.

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
| `docs/grelha.md` | fica, com a nota de que a base de dados é esta; `docs/arquivo/grelha-semente.json` fica como semente dos acontecimentos |
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
| D. Escrever e rever | camada do DM, revisão, `/vigia-cotn` | edita uma célula e recebe perguntas |
| E. Preparar e arrumar | `/preparar-cotn`, fluxo do fecho novo; saem as vistas antigas, o adaptador e os ficheiros antigos | a app final |

## 12. Decisões

Decidido pelo DM a 2026-10-11:
- **Privacidade:** o `campaign-cotn` continua público, sem cifra; a privacidade resolve-se noutra altura. O `campaign-cotn-data` fica abandonado.

Por defeito, salvo veto do DM:
- **Formato:** um ficheiro Markdown com cabeçalho por coisa.
- **Livro:** fica como referência, só de leitura, em `livro/`.
- **Vistas:** Linha temporal, Frentes, Revelações e PCs saem, absorvidas pela Grelha e pela Ficha; «Ver só o livro» e «repor do livro» também.
- **Sessão zero:** `s00` guarda o ponto de partida dos PCs e da mesa.
- **Edição na app:** só a camada do DM; as fichas corrigem-se pela revisão.

## 13 a 17. Estado das fases A a E (arquivo)

Os relatórios de cada fase (2026-10-11 e 2026-10-12) passaram para [`docs/arquivo/historia-fases.md`](arquivo/historia-fases.md). Contam o que se fez em cada fase; o desenho que vale é o deste documento e o código.

## 18. O desenho (2026-10-12)

A app segue o desenho do mockup da Grelha feito no claude.ai («Grelha CotN · mockup S5»), em toda a parte:

- **Tokens** em `src/app.css`: fundo `#EDF1F2`, painéis brancos com borda `#B9C5CB`/`#CBD5DA`, texto `#13222D`/`#0B1F29`, apagado `#4B5B67`, verde-azulado escuro `#0E3B47` para o que está ativo (chips, item da barra lateral, coluna atual), `#0B2F39` nos cantos da folha, foco `#2B62D9`. Os estados da Grelha: aberto `#D98208`, esquecido `#C4320A`, planeado `#2B62D9`, pago `#16834E`, pista `#7B4DC2`, fechado `#7A8790`, com os fundos claros do mockup.
- **Tipografia:** Atkinson Hyperlegible no texto, IBM Plex Sans Condensed em títulos, rótulos e cabeçalhos (maiúsculas pequenas espaçadas), IBM Plex Mono em números, chaves e ids. As fontes estão embutidas em `src/fonts/` (woff2 dos pacotes `@fontsource`, subconjuntos latin e latin-ext, OFL 1.1, licenças ao lado); o Vite copia-as para `dist/` e nada se carrega de fora.
- **Componentes partilhados:** chips de 44 px (`.chip`, `.seg`, `.toggle`), a pílula pequena de uma coisa que abre a Ficha (`.ent`), tiles de contagem (`.tile`), etiquetas (`.tag`: escura só para «só DM» e marcas; `.tag-ultima`, `.tag-trunfo`, `.soft`, `.warnb`, `.estado`), pílulas de atitude (`.pill.att-*`), marcadores por forma (`.mk-*`), tabelas (`table.list`), ícones de traço (`Icone.svelte`, sem emoji).
- **A Grelha** é a folha do mockup tal e qual (cabeçalhos fixos, arco atual escuro, próxima sessão a azul, faixas por grupo com contagem, legenda com as etiquetas); no telemóvel a coluna do tipo passa a 0 px, as filas de filtros deslizam e os tiles encolhem.

## 19. Depois da fase E (2026-10-12)

- **Cabeçalhos por tipo na Grelha:** dentro de cada grupo há uma sub-faixa por tipo (PC, NPC, Rival, Fação; Laço; Local, Item; …), com contagem; faixas e sub-faixas abrem e fecham com um clique, um grupo fechado mostra o resumo dos tipos, e o que está recolhido fica no browser («Mostrar todos os grupos» reabre).
- **As ambições e as agendas vivem na linha do PC ou do NPC** (secção 7): deixaram de ser linhas do grupo «Arcos pessoais», que ficou só com os laços. A Grelha passou de 112 para 100 linhas sem perder nada: os itens estão nas células dos PCs com a etiqueta do fio.
- **Acesso sem colar o token em cada browser** (`src/lib/acesso.ts`): nas Definições, com o token ligado, define-se uma palavra-passe da mesa; a app cifra o token (PBKDF2-SHA256, 600 000 iterações, AES-GCM, WebCrypto) e grava `grelha/acesso.json`. Num browser novo, a Grelha e as Definições mostram «Palavra-passe da mesa → Desbloquear»; é um formulário de login a sério, por isso o gestor de palavras-passe do browser guarda-a e sincroniza-a entre dispositivos. O repositório é público, por isso a segurança está na palavra-passe (a app exige 20 caracteres e quatro palavras) e no token só dar acesso a este repositório. Alternativa sem palavra-passe: «Copiar link de ligação» (`…#ligar=<token>`, no fragmento, que não vai para o servidor; a app guarda-o e limpa o endereço).
- **Candidatos à próxima sessão** (`src/lib/grelha/candidatos.ts`): as linhas que, vindas de trás, valem a pena pensar para a sessão a preparar. Pesa só o que já existe: esquecidos (4 cada), abertos (2 cada), última oportunidade (3), ter estado na última sessão (2 como dona, 1 como eco), o estado ter mudado nela (2), o beat em curso na última sessão (3; um que ficou em curso há mais tempo, 1), beats do capítulo por jogar (1), PC sem cena (2), relógio a correr (2), pista planeada no capítulo (1), notas por responder (1). Quem morreu fica de fora. A partir de 4 pontos é candidato, a partir de 7 é forte. Na Grelha, o botão «Candidatos à S…» filtra-os, ordena-os por pontos e põe na célula da próxima sessão uma caixa «Pensar aqui» com as razões (ou «Já tem plano»). `npm run grelha` tem a mesma lista, que o `/preparar-cotn` lê primeiro.
- **Etapas entre capítulos** (`plano/campanha.md` → `etapas`, com `id`, `nome`, `sub` e `entre: [capítulo, capítulo]`): cada etapa ganha uma coluna futura própria na Grelha, logo a seguir à do primeiro capítulo. A primeira é `viagem-urzin-jigau` («Viagem · Urzin → Jigau», entre o prólogo e o capítulo 1). Um beat com `etapa: <id>` aparece nessa coluna em vez da do capítulo. A validação confere as ids e os capítulos.
