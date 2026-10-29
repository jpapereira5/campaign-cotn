# Grelha: especificação

> **Nota (2026-10-11, revista a 2026-10-20):** a base de dados desta especificação foi substituída por [`docs/arquitetura.md`](arquitetura.md): as linhas passam a ser as próprias entidades e os factos passam a ser os acontecimentos de cada sessão, em `registo/`. **As secções 7 a 12** (linha dona, ecos, estados e contagens, camada do DM, revisão, vista, o Claude) **continuam válidas e estão atualizadas** para os ficheiros de hoje. As secções 1 a 6, 13 e 14 e os anexos ficam como registo do desenho original: os nomes que lá aparecem correspondem a estes de hoje.
>
> | Na especificação original | Hoje |
> | --- | --- |
> | `data/grid/rows.json` (linhas `g-…`) | as entidades (`mundo/`, `plano/fios/`) e a lista de linhas `grelha/linhas.json` |
> | `data/grid/facts.json` (factos `e-…`) | os acontecimentos dos registos das sessões (`registo/sessoes/`) |
> | `data/grid/dm.json` | `grelha/dm.json` (só a app escreve) |
> | `data/grid/review.json` | `grelha/revisao.json` |
> | `src/lib/grid/` | `src/lib/grelha/` |
> | `data/state.json`, `data/campaign/campaign.json` | os cabeçalhos dos registos e `plano/campanha.md` |
> | `scripts/validate-data.ts` | `scripts/montar.ts` e `scripts/lib/validar-arvore.ts` |
> | `docs/sessoes/`, `docs/canone.md`, `docs/ids.md` | `registo/sessoes/`, `registo/decisoes.md`, os próprios ficheiros |
>
> **Não implementar as fases desta especificação; seguir `arquitetura.md`.**

Decidido pelo DM a 2026-10-11. Implementar no Claude Code, uma fase de cada vez (secção 14), mostrando o resultado ao DM no fim de cada fase. O conteúdo do mockup feito no claude.ai está em `docs/arquivo/grelha-semente.json` e é a semente da fase 1.

## 1. Para que serve

A Grelha mapeia tudo o que vale a pena acompanhar na campanha. Assim, semana a semana, o DM vê o que aconteceu e prepara a sessão seguinte: as consequências das escolhas, ações e interações dos jogadores, e os ecos dessas consequências. Não serve para prever ramificações.

- **Linhas:** uma por cada coisa concreta que vale a pena acompanhar (um PC, um NPC, um item, um local, uma decisão, uma promessa…). São curadas: o DM decide que linhas entram. Não há uma linha por cada entidade do cânone.
- **Colunas:** as sessões jogadas, a próxima sessão, o resto do capítulo atual e os capítulos seguintes.
- **Duas camadas:**
  - a automática, com o que se jogou e o cânone, escrita pelo Claude no fecho;
  - a do DM, com correções e preparação, escrita pelo DM na app. Fica por cima da automática, como um acetato, e nunca a apaga.
- **Revisão:** quando o DM guarda uma edição, o Claude revê-a numa conversa, em tempo real (secção 12), e deixa as perguntas na própria célula.

Menos é mais: a Grelha é uma vista nova e as outras vistas ficam como estão.

## 2. Vocabulário

| Na conversa | No código |
| --- | --- |
| Grelha | vista `grelha`, módulos em `src/lib/grid/` |
| linha | `GridRow`, em `data/grid/rows.json` |
| facto (camada automática) | `GridFact`, em `data/grid/facts.json` |
| camada do DM (acetato) | `DmEntry`, em `data/grid/dm.json` |
| nota de revisão, ideia | `ReviewNote`, em `data/grid/review.json` |
| linha dona | `ownerOf()` |
| eco | `echoesOf()` |
| estado | `statusOf()` |

## 3. Ficheiros e quem escreve cada um

| Ficheiro | O quê | Quem escreve |
| --- | --- | --- |
| `data/grid/rows.json` | as linhas (array) | o Claude, no fecho e na revisão |
| `data/grid/facts.json` | os factos das sessões jogadas (array) | o Claude, no fecho e na revisão |
| `data/grid/dm.json` | a camada do DM (array) | só a app |
| `data/grid/review.json` | notas, ideias e entradas do DM já revistas ou absorvidas (objeto) | o Claude, na revisão, no Preparar e no fecho |

Cada ficheiro tem um só escritor, e é isso que evita conflitos:
- A app nunca escreve `rows.json`, `facts.json` nem `review.json`.
- O Claude nunca escreve `dm.json`, nem através do `normalizar-texto.py` (secção 14).
- Quando uma entrada do DM passa para a camada automática, o Claude escreve-a em `rows.json` ou `facts.json` e regista-a em `review.json` (`absorbed`).

Os ficheiros são JSON simples, editáveis à mão, como o resto de `data/`. Um ficheiro que não exista conta como vazio. As ids seguem `docs/ids.md` (kebab-case ASCII), com prefixos novos: `g-` linha, `e-` facto, `d-` entrada do DM, `n-` nota de revisão.

## 4. Colunas

As colunas calculam-se e nunca se guardam: `columnsOf(sessions, chapters, currentChapter, today)`. `today` é um parâmetro, para os testes não dependerem do relógio.

| Chave | Coluna | De onde vem |
| --- | --- | --- |
| `s1` … `sN` | sessões jogadas | `data/state.json` → `sessions` com data até `today`, ordenadas por data e depois por id. `sK` é a K-ésima sessão da campanha (`s5` = `s-088`). Uma sessão sem data não conta e dá um aviso. |
| `s{N+1}` | próxima sessão | — |
| id do capítulo atual (`ch0`…) | «resto do capítulo» | `state.currentChapter` |
| `ch1` … `ch8` seguintes | uma coluna estreita por capítulo | `campaign.chapters`, por ordem |

- **Onde ficam os factos e os planos.** Os factos só existem em colunas jogadas. Os planos só existem na próxima sessão e em capítulos a partir do atual. Um plano para «um dia, neste capítulo» vai para a coluna do capítulo atual.
- **Quando se joga a sessão seguinte.** Quando a S6 é jogada, `s6` passa a coluna jogada e a próxima passa a ser `s7`. Os planos que estavam em `s6` ficam numa coluna passada até serem resolvidos (secção 9).
- **Capítulo que acaba.** Mantém a sua coluna «resto do capítulo» enquanto tiver planos por resolver.
- **Cabeçalho de arco:** as sessões agrupam-se pelo capítulo a que pertencem, que é o da maioria dos beats da sessão (sem beats, o da sessão anterior). O grupo do capítulo atual junta as suas sessões, a próxima e o «resto do capítulo». Depois vem «Capítulos seguintes».
- **Rótulos**, como no mockup: «S5» com «7 out. · atual» por baixo, «S6» com «próxima», «Resto do prólogo», «Cap. 1» com o hub («Jigau»). Os hubs do livro estão em inglês e o normalizador não passa por `data/book/`, por isso corrigem-se em `data/campaign/campaign.json` (fase 1).

## 5. Linhas (`rows.json`)

```ts
type RowType =
  | 'sessao'                                          // Sessão
  | 'grupo' | 'pc' | 'npc' | 'rival' | 'facao'        // Quem
  | 'ambicao' | 'agenda' | 'laco'                     // Arcos pessoais
  | 'local' | 'item'                                  // Onde e com quê
  | 'missao' | 'decisao' | 'promessa' | 'relogio' | 'gatilho'
  | 'revelacao' | 'semente' | 'desfecho'              // Enredo
  | 'jogador' | 'teoria' | 'mesa'                     // Fora do jogo

interface GridRow {
  id: string                // g-…
  type: RowType
  name: string
  short?: string            // nome curto para chips e ecos ("Lucan")
  sub?: string              // uma linha curta debaixo do nome
  ref?: string              // entidade do cânone (c-, f-, l-, r-, amb-, a-, b-): dá nome, quer/teme e cor quando faltam aqui
  pcs?: string[]            // PCs a que a linha diz respeito por natureza (ids de linhas pc); ['*'] = contexto, aparece sempre
  attitude?: 'amigavel' | 'neutro' | 'desconfiado' | 'hostil' | 'por-conhecer' | 'morto'   // npc, rival, facao
  flags?: ('deve-nos' | 'devemos-lhe' | 'rancor' | 'patrono')[]
  badges?: string[]         // etiquetas curtas, ex.: "insanidade: por registar"
  wants?: string            // «Quer»; com ref de personagem e sem valor aqui, vem de Character.wants
  fears?: string            // «Teme»; idem, Character.fears
  knows?: string            // revelacao: quem já sabe, em texto ("só o Quasi")
  pair?: [string, string]   // laco: as duas linhas ligadas
  byChapter?: Record<string, string>  // texto fixo nas colunas de capítulos (ex.: «Nível do grupo» e «Resumo»)
  order?: number            // ordem dentro do tipo (por defeito, a do ficheiro)
  archived?: boolean        // arrumada: escondida por defeito
}
```

Os grupos e os tipos aparecem por esta ordem:

| Grupo | Tipos |
| --- | --- |
| Sessão | Sessão |
| Quem | Grupo, PC, NPC, Rival, Fação |
| Arcos pessoais | Ambição, Agenda, Laço |
| Onde e com quê | Local, Item |
| Enredo | Missão, Decisão, Promessa, Relógio, Gatilho, Revelação, Semente, Desfecho |
| Fora do jogo | Jogador, Teoria, Mesa |

O cabeçalho da linha mostra:
- o tipo, o nome e `sub`;
- pílulas de atitude e de cada flag;
- «Quer» e «Teme» numa linha curta;
- os `badges`;
- nas revelações, «N pistas · sabe: …», em que N é o número de factos `pista` da linha;
- pontos com a cor dos PCs a que a linha diz respeito. A cor vem do arco do cânone com `ownerPc` igual ao `ref` da linha do PC; sem `ref`, é cinzenta;
- ✎ quando o DM a alterou, e um ponto «por rever» enquanto não for revista.

A Grelha usa sempre o cânone com a camada da campanha, mesmo com «Ver só o livro» ligado. Os PCs e os seus arcos só existem nessa camada.

## 6. Factos (`facts.json`): a camada automática

```ts
type FactKind = 'relacao' | 'promessa' | 'escolha' | 'consequencia' | 'pista' | 'cena' | 'estado' | 'registo'
type Tag = 'so-dm' | 'ultima' | 'trunfo'

interface GridFact {
  id: string           // e-…; nunca muda
  col: string          // s1 … sN
  kind: FactKind
  text: string         // uma ou duas frases, no tom do mockup
  involves: string[]   // ids de linhas; a ordem conta (secção 7)
  origin?: string[]    // factos anteriores ou da mesma sessão de que este nasce (mostra «← S3»)
  closed?: boolean     // o fio acabou
  tags?: Tag[]
  source?: string      // de onde veio, ex.: "docs/sessoes/sessao-05-2026-10-07.md"
}
```

| kind | Quando | Abre um fio? |
| --- | --- | --- |
| `relacao` | algo muda entre duas personagens | sim |
| `promessa` | alguém promete ou fica a dever | sim |
| `escolha` | os jogadores decidem algo com consequências | sim |
| `consequencia` | algo acontece por causa de outro facto, ou fica à espera de resposta | sim |
| `pista` | aparece uma pista de uma revelação | conta como pista |
| `cena` | a cena pessoal de um PC | não |
| `estado` | muda o estado de uma linha: uma atitude, a posse de um item, um relógio que avança | não |
| `registo` | fica registado e não pede seguimento | não |

Um facto que abre um fio fica aberto até ser pago ou fechado (secção 8). Quando uma cena ou uma mudança de estado pede resposta, escreve-se como `consequencia`.

As tags são três:
- `so-dm`: os jogadores não sabem;
- `ultima`: última oportunidade;
- `trunfo`: guardado para o momento certo.

## 7. Linha dona e ecos

Cada facto pertence a uma só linha, a dona. O mesmo vale para os planos, as verdades escondidas e os factos em falta da camada do DM. A dona não se guarda: calcula-a `donaDe(tipo, envolve, tipoLinha)`, uma função pura em `src/lib/grelha/dona.ts`, usada pela app e pelos scripts.

| kind | Dona |
| --- | --- |
| `relacao` | a única linha `laco` em `involves` |
| `promessa` | a única linha `promessa` em `involves` |
| `escolha` | a única linha `decisao` em `involves` |
| `pista` | a única linha `revelacao` em `involves` |
| `cena` | o primeiro `pc` em `involves` |
| `consequencia`, `estado`, `registo` | `involves[0]` |

Se a linha esperada faltar ou aparecer mais de uma vez, `donaDe` devolve `null`.
- Num facto, o validate dá erro («dona ambígua»). No fecho, o Claude pergunta ao DM; se a resposta pedir uma regra nova, acrescenta-se a esta tabela.
- Numa entrada do DM, a app não deixa gravar (secção 9).

**Ecos.** Cada linha em `involves` que não é a dona mostra, na mesma coluna, um eco: «↳ <nome curto da dona>: <texto>».
- O eco aparece em cinzento, sem cor de estado, e não entra nas contagens.
- Clicar no eco leva à célula dona e destaca-a.
- Cada célula mostra no máximo dois ecos, mais «+N».
- O botão «Ecos» nos filtros esconde-os todos.

**Filtro por PC.** Uma linha aparece no filtro de um PC se se verificar uma destas condições:
- é a linha desse PC;
- tem esse PC em `pcs`;
- tem `pcs: ['*']`;
- algum item de que é dona envolve esse PC.

## 8. Estados e contagens

O estado de um facto (calculado em `src/lib/grelha/modelo.ts`, `construirGrelha`) decide-se, por esta ordem:

1. `pista`, se o kind é `pista`;
2. `registo`, se o kind é `cena`, `estado` ou `registo`;
3. `fechado`, se tem `closed` ou se o DM o arquivou (aparece como «arquivado»);
4. `pago`, se outro facto, da mesma sessão ou de uma posterior, o tem em `origin`;
5. `planeado`, se um plano do DM o tem em `origin` (mostra «→ S6»);
6. `aberto`, nos restantes casos.

**Esquecido** (alarme) é um facto que cumpre as três condições:
- está `aberto`;
- nasceu três ou mais sessões antes da próxima;
- a linha dona não é `revelacao`, `semente`, `teoria`, `ambicao`, `agenda` nem `gatilho`.

Um plano do DM está `planeado` se tem `prepared` e `falta` (falta preparar) se não tem.

Há também um item calculado: «sem cena pessoal planeada» (`falta`). Aparece na célula da próxima sessão de cada PC com `ref` que não é dono de nenhum plano `cena` nessa coluna. A linha provisória «PC do Tiago», sem `ref`, fica de fora. Uma cena pessoal por PC em cada sessão é um objetivo do DM.

Uma célula pode ter vários itens, cada um com o seu marcador. O fundo da célula segue o mais urgente: esquecido > aberto > falta > planeado > pista > pago > fechado > registo.

Os marcadores e as cores vêm do mockup, já validados para contraste. As formas devem manter-se, porque distinguem os estados mesmo sem cor.

| Estado | Marcador | Cor | Fundo da célula |
| --- | --- | --- | --- |
| aberto | círculo | #D98208 | #FFF3DB |
| esquecido | círculo com «!» | #C4320A | #FDE3DA |
| planeado | losango | #2B62D9 | #E8EEFF |
| falta preparar | quadrado tracejado | #6F7C86 | contorno tracejado, texto em itálico |
| pago | visto | #16834E | #E3F3E9 |
| pista | quadrado | #7B4DC2 | #F1EAFA |
| fechado | barra | #7A8790 | #F0F2F3 |
| registo | sem marcador | — | sem fundo |

**Contagens**, sempre sobre as linhas visíveis com os filtros:

| Contagem | O que conta |
| --- | --- |
| Abertos | factos abertos, incluindo os esquecidos |
| Esquecidos | os abertos em alarme |
| Planeado para a S{N+1} | planos nessa coluna, preparados ou não |
| Falta preparar | planos sem `prepared`, em qualquer coluna futura, mais os itens «sem cena pessoal planeada» |
| Por responder | notas de revisão abertas sem resposta do DM |

Por cima das contagens aparece «Contagens: <filtro atual>».

## 9. A camada do DM (`dm.json`)

O sítio onde o DM edita diz que tipo de edição é, por isso ele nunca tem de a classificar.

| Onde edita | kind | O que guarda |
| --- | --- | --- |
| num facto de uma coluna jogada | `correcao` | `fact` e `patch` (campos novos do facto) |
| numa coluna jogada, item novo | `correcao` sem `fact` (facto em falta) ou, com «Só DM», `verdade` (o que estava mesmo a acontecer) | `col`, `factKind`, `text`, `involves`, `tags` |
| numa coluna futura | `plano` | `col`, `factKind`, `text`, `involves`, `origin`, `prepared`, `tags` |
| no cabeçalho da linha | `decisao` | `row` e `patch` (campos novos da linha) |
| botão «Arquivar» num facto aberto | `arquivo` | `fact`, `text` (motivo, opcional) |
| botão «Nova linha» | `linha` | `patch`: a linha nova completa, com a id `g-…` final, `type` e `name` |
| botão «Nota rápida» | `nota` | `text`, e `row` ou `col` se souber onde vai |
| ao responder a uma nota de revisão | `resposta` | `note`, `text`, `accepted` (aceitou a sugestão) |
| ao aceitar uma ideia | `plano` com `fromIdea` | como um plano, com os dados da ideia |
| ao rejeitar uma ideia | `ideia-rejeitada` | `idea` |
| botão «Acompanhar» (na Grelha ou na Ficha), para uma id que já existe no cânone | `acompanhar` | `row` (a id) e, se o DM forçar, `patch.type` |
| botão «Marcar jogado à mesa», na Ficha de um beat | `jogado` | `beat` |

Os dois últimos vieram da arquitetura nova (`docs/arquitetura.md`, secção 7): a Grelha deixou de ter cópias das entidades, por isso «acompanhar» é só pôr uma id em `grelha/linhas.json`, e a app deixou de escrever `beats` no estado, por isso os beats jogados à mesa ficam na camada do DM até ao fecho.

```ts
interface DmEntry {
  id: string           // d-<tempo em base36>-<aleatório>, gerado na app
  at: string           // ISO; muda quando o DM edita a entrada
  kind: 'correcao' | 'verdade' | 'plano' | 'decisao' | 'arquivo' | 'linha' | 'acompanhar' | 'jogado' | 'nota' | 'resposta' | 'ideia-rejeitada'
  fact?: string
  row?: string
  col?: string
  factKind?: FactKind  // correcao sem fact, verdade, plano: o kind que o item tem (ou terá) como facto
  patch?: Record<string, unknown>
  text?: string
  involves?: string[]  // a linha onde o DM clicou vem primeiro
  origin?: string[]
  tags?: Tag[]
  prepared?: boolean
  note?: string
  accepted?: boolean
  idea?: string
  fromIdea?: string
  beat?: string        // jogado: a id do beat marcado à mesa
  deleted?: boolean    // o DM apagou-a: fica no histórico e deixa de contar
}
```

Os itens do DM (planos, verdades, factos em falta) podem ser referidos por outros, em `origin` ou `involves`, pela sua id `d-`. Depois de absorvidos, a id `d-` continua a valer: resolve-se através de `revisao.absorbed` (secção 10).

**O editor** sugere o `factKind` pelo tipo da linha: `cena` num PC, `pista` numa revelação, `consequencia` nos restantes.
- Antes de gravar, mostra em que linha o item vai ficar (a dona, calculada pela regra da secção 7).
- Se a dona não existir, por exemplo o Laço entre dois PCs, oferece-se para a criar com uma entrada `linha`.
- Sem dona, não grava.

**Junção das camadas.** Para o DM, editar é só editar a célula. Por baixo, `aplicarDm()`, em `src/lib/grelha/dm.ts`, junta as camadas:
- ignora as entradas que estão em `revisao.absorbed` (já estão na camada automática) e as que têm `deleted`;
- `correcao` mostra o facto corrigido com ✎ e guarda o original, para «ver original»;
- `verdade` e `plano` aparecem como itens da célula, com ✎;
- `decisao` corrige o cabeçalho, com ✎;
- `arquivo` passa o facto a fechado («arquivado»);
- `linha` mostra a linha nova no seu grupo, com ✎;
- uma entrada leva o ponto «por rever» se não estiver em `revisao.reviewed` nem em `revisao.absorbed`, ou se o seu `at` for mais recente do que a data em `revisao.reviewed`.

**Planos em colunas passadas.** Depois de uma sessão, os planos que ficaram para trás sem serem absorvidos aparecem destacados, com três botões: «Passa para a S{N+1}», «Fica para o capítulo» e «Cai». Os dois primeiros mudam `col`; «Cai» marca `deleted`. Nada desaparece sem o DM decidir.

**Guardar.** Cada «Guardar» no editor grava logo um commit, só de `grelha/dm.json`.
- A mensagem diz o que mudou, por exemplo `grelha: plano g-elmiro-trigueiro s6`.
- Num `ConflictError` (o ficheiro mudou noutro dispositivo), a app relê o `dm.json` remoto e junta as entradas por `id`, ficando a que tem o `at` mais recente. Depois repete uma vez. Se voltar a falhar, a entrada fica «por gravar» e a app tenta de novo na gravação seguinte.
- As leituras de que a fusão e a atualização dependem usam `cache: 'no-store'`, porque a API do GitHub responde com `max-age=60`. Há uma função nova `fetchFile(path)` em `src/lib/github.ts`, que devolve o conteúdo e o sha.

## 10. Revisão (`grelha/revisao.json`)

```ts
interface ReviewFile {
  reviewed: Record<string, string>   // id da entrada do DM → `at` da versão revista
  absorbed: Record<string, string>   // id da entrada do DM → id da linha ou do facto em que se tornou
  notes: ReviewNote[]
  lastReview?: string                // ISO
}

interface ReviewNote {
  id: string           // n-…
  at: string
  kind: 'pergunta' | 'discrepancia' | 'efeito' | 'ideia' | 'aviso'
  target: { dm?: string; fact?: string; row?: string; col?: string }
  text: string         // a pergunta, o aviso ou a ideia
  suggestion?: string  // resposta sugerida
  because?: string[]   // ideia: factos ou linhas que a justificam
  factKind?: FactKind  // ideia: o kind do plano que nasce se o DM a aceitar
  tags?: Tag[]         // ideia: passam para o plano
  status: 'aberta' | 'fechada'
}
```

Na app:
- **Notas.** Uma célula com notas abertas mostra «?». Clicar abre a nota, com:
  - o texto;
  - a resposta sugerida e o botão «Aceitar sugestão»;
  - um campo «A tua resposta».

  Tanto aceitar como responder gravam uma `resposta` em `dm.json`. A nota fica aberta até o Claude a fechar.
- **Ideias.** Uma `ideia` aparece tracejada na célula de destino (`target.row`, `target.col`), com dois botões:
  - «Aceitar» cria um `plano` com `fromIdea`, com a coluna, o texto, o `factKind`, as `tags` e, como `origin`, os factos em `because`;
  - «Rejeitar» cria `ideia-rejeitada`, e essa ideia não volta a ser sugerida.
- **Atualização.** Enquanto a Grelha está aberta e há token, a app verifica de 30 em 30 segundos se o ramo mudou, com `GET /repos/{owner}/{repo}/commits/main`, `Accept: application/vnd.github.sha` e `cache: 'no-store'`. Se mudou, relê só os ficheiros de `grelha/` que não estão por gravar. Assim, as notas do Claude aparecem sem recarregar a página. Há também um botão «Atualizar».

## 11. A vista

- **Onde:**
  - `View` `grelha`, com o hash `#/grelha`;
  - na barra lateral: «Grelha», ▦, com a dica «Tudo o que está em aberto, sessão a sessão»;
  - componentes `src/components/Grelha.svelte` e `src/components/GrelhaEditor.svelte`.
- **Disposição**, como no mockup:
  - tabela com scroll nos dois sentidos dentro da vista;
  - as colunas de tipo e de nome ficam fixas à esquerda e as duas linhas de cabeçalho (arco e sessão) fixas em cima;
  - uma faixa por grupo, a coluna da sessão atual destacada e os capítulos futuros estreitos;
  - no telemóvel (até 640 px), o tipo e o nome juntam-se numa coluna estreita, e só a grelha faz scroll na horizontal, nunca a página.
- **Célula:** mostra, por esta ordem:
  - os itens: factos, itens do DM e o item «sem cena». Cada item tem marcador, texto, as etiquetas «só DM», «última oportunidade» e «trunfo», a origem («← S3», que destaca a origem ao clicar) e «→ S6» quando está planeado;
  - os ecos;
  - as ideias, tracejadas;
  - nas colunas de capítulos, o texto de `byChapter`, quando existe.

  A célula tem ainda «?» quando há notas abertas, e os itens do DM levam ✎ e «por rever».
- **Barra de cima:**
  - as contagens;
  - filtros de grupo (Todos, Sessão, Quem, Arcos pessoais, Onde e com quê, Enredo, Fora do jogo) e de PC («Todos os PCs» e um chip por linha `pc`, com a cor do PC). Cada chip mostra quantas linhas ficam visíveis com os outros filtros;
  - «Só com pendentes» mostra as linhas com itens abertos, esquecidos, por preparar ou com notas abertas;
  - os botões «Ecos», «Arrumadas», «Nota rápida» e «Atualizar», e a legenda.
- **Sem token**, a Grelha é só de leitura e mostra um aviso.

## 12. O Claude: vigia, preparar e fecho

Há três skills no repositório só para a Grelha (`vigia-cotn`, `preparar-cotn` e `fecho-cotn`, em `.claude/skills/`). Carregam numa conversa do Claude com o repositório, que é a forma que o DM prefere. Os passos completos estão nas skills; esta secção dá as regras.

### `/vigia-cotn`: revisão em tempo real

Ficheiros: `.claude/skills/vigia-cotn/SKILL.md` e `scripts/escuta.sh` (anexo B).

1. **Acesso.** A skill precisa de acesso de escrita ao repositório. Numa conversa do Claude, esse acesso pede-se no início.
2. **Escuta.** O Claude liga um Monitor com `bash scripts/escuta.sh`.
   - O script verifica `origin/main` de 10 em 10 segundos, espera que o DM pare de guardar e avisa com os commits novos.
   - A escuta expira ao fim de 30 minutos e volta a ligar-se enquanto o DM estiver a trabalhar.
   - «Para» desliga-a.
3. **A cada aviso,** o Claude faz `git pull`. Se `grelha/dm.json` mudou, revê as entradas por rever (secção 9).
4. **Perguntas.** O Claude responde na conversa com três perguntas no máximo.
   - Primeiro vêm as que mexem na próxima sessão, cada uma com a resposta sugerida.
   - As mesmas perguntas vão para `grelha/revisao.json` (`notes`), com commit, para aparecerem na célula.
   - As restantes ficam para a ronda seguinte.
5. **Respostas.** Quando o DM responde, na conversa ou na app (numa `resposta`), o Claude aplica a resposta, fecha a nota e regista a entrada em `reviewed` (com o seu `at`) ou em `absorbed` (com a id em que se tornou).
   - Antes do commit, corre `python3 scripts/normalizar-texto.py` e `npm run validate`.
   - Se o push for recusado porque a app gravou entretanto, faz `git pull --rebase` e repete. São ficheiros diferentes, por isso não há conflito.

Regras da revisão, por tipo de entrada:

- **`correcao`.** Primeiro pergunta se os jogadores viram aquilo.
  - Se não viram, é uma verdade escondida e só tem de bater com o que eles viram.
  - Se viram, há duas hipóteses: ou o registo estava errado (o Claude mostra o que diz a transcrição ou o resumo), ou é um retcon, e os jogadores lembram-se do original.
  - Mostra os factos que nasceram deste (a cadeia de `origin`), porque podem deixar de fazer sentido.
  - Depois de confirmada, a correção passa para o acontecimento no registo da sessão (`registo/sessoes/sNN-AAAA-MM-DD.md`) e para as fichas que ele toca; o resumo da Drive refaz-se a partir do registo.
- **`verdade`.** Tem de bater com tudo o que os jogadores viram. O Claude sugere onde pode virar pista.
- **`plano`.** Um plano nunca é cânone antes de se jogar. O Claude procura efeitos cruzados:
  - que linhas o plano toca e não estão em `involves`;
  - que factos abertos pode pagar (e sugere-os como `origin`);
  - quem mais estaria lá;
  - se algum PC fica sem cena.
- **`decisao`.** O Claude confirma que não contradiz nada do que já se disse à mesa. Depois de confirmada, passa para a ficha da coisa e para `registo/decisoes.md`, como «Decidido pelo DM (data)»; se for verdade do mundo, fica marcada por revelar.
- **`linha`.** O Claude vê se a linha já existe com outro nome. Depois de confirmada, a coisa ganha o seu ficheiro (`mundo/…` ou `plano/fios/…`, com a mesma id) e entra em `grelha/linhas.json`.
- **`nota`.** O Claude percebe onde a nota vai.
  - Se for um facto, propõe-o e escreve-o como acontecimento no registo da sessão quando o DM disser que sim.
  - Se for um plano, cria uma `ideia` nessa célula, porque os planos são do DM.
- **`arquivo`.** Só se regista. O Claude pergunta apenas se o fio devia deixar um eco.

Em todos os casos, o Claude nunca escreve em `dm.json` e nunca transforma uma ideia em cânone. Escreve em português de Portugal, com perguntas curtas.

### `/preparar-cotn`: na véspera da sessão

Ficheiro: `.claude/skills/preparar-cotn/SKILL.md`. Corre a pedido do DM ou numa tarefa agendada e percorre a Grelha inteira.

- Lista:
  - os esquecidos;
  - as últimas oportunidades;
  - os planos da próxima sessão que falta preparar;
  - os PCs sem cena na próxima sessão;
  - os ecos por dar.
- Propõe até cinco ideias ou ramificações, como `ideia` em `grelha/revisao.json`, cada uma com `because`.
- Primeiro vêm os ecos do que já aconteceu e só depois as coisas novas.
- Não repete ideias rejeitadas.

### Fecho

Ficheiro: `.claude/skills/fecho-cotn/SKILL.md` (os passos em `docs/fluxo.md`). Na parte da Grelha:

1. escreve os acontecimentos da sessão no registo (`registo/sessoes/`), com `tipo`, `envolve` e `origem`, e pergunta quando a dona é ambígua;
2. para cada plano da sessão jogada:
   - se aconteceu, vira facto (com `origin`) e o plano passa a `absorbed`;
   - se não aconteceu, fica para os três botões da app;
3. atualiza as fichas e `grelha/linhas.json` (linhas novas que valham a pena, atitudes, `sabe`), com o sim do DM.

## 13. Validação

`validateGrid()`, em `src/lib/grid/validate.ts`, é chamada pelo `scripts/validate-data.ts`, que passa a ler `data/grid/*.json` e `data/state.json`. Os resultados aparecem na app junto dos outros problemas dos dados.

Os módulos da Grelha só importam módulos puros. `src/lib/data.ts` usa `import.meta.glob` e rebenta no Node, por isso `normalizePlay` e `emptyPlay` passam para um módulo puro (`src/lib/play.ts`), que `data.ts` reexporta.

O `deploy.yml` corre o validate a cada push. Por isso, o que a app escreve nunca pode partir o deploy: os problemas de `dm.json` são sempre avisos. Os erros ficam para os ficheiros que o Claude escreve e valida antes do commit.

Erros (em `rows.json`, `facts.json` e `review.json`):
- ids repetidas, fora de kebab-case ou sem o prefixo certo;
- tipos ou kinds que não existem;
- `involves`, `origin`, `pair`, `ref`, `target` e as chaves de `reviewed` e `absorbed` que apontam para coisas que não existem (as ids `d-` resolvem-se pelo `dm.json` e por `absorbed`);
- factos numa coluna que não foi jogada;
- `origin` que aponta para uma sessão posterior ou que faz um ciclo;
- `ownerOf` igual a `null` («dona ambígua»);
- `laco` sem `pair` de duas linhas.

Avisos:
- tudo o que estiver mal em `dm.json`;
- sessões sem data;
- planos em colunas passadas ou em capítulos já acabados (por resolver);
- revelações com menos de três pistas, contando factos e planos (regra das três pistas).

## 14. Fases

Cada fase acaba com `npm run validate`, `npm test` e `npm run check` limpos, e com o DM a ver o resultado.

### Fase 1: ler

- **Dados:**
  - `data/grid/` passa a ser reconhecido por `parsePath`, com `FileKind` e `FileLayer` novos (`grid`) e fora da montagem do cânone. É lido do build e do repositório como os outros ficheiros;
  - o `normalizar-texto.py` passa também por `data/grid/rows.json`, `facts.json` e `review.json`, nunca por `dm.json`. As chaves `at` e `lastReview` entram em `REF_KEYS`;
  - os hubs dos capítulos 0 a 3 corrigem-se em `data/campaign/campaign.json`: «Urzin / Pântano do Véu-Quebrado», «Jigau», «Estrada de Jorhas», «Bazzoxan / Ascensão dos Traidores».
- **Código:**
  - tipos em `src/lib/grid/types.ts`;
  - funções puras `columnsOf`, `ownerOf`, `echoesOf`, `statusOf` e `applyDm`, com testes em `node --test`;
  - um script `npm test`, `"engines": { "node": ">=22.18" }` no `package.json` e `npm test` no `deploy.yml`;
  - `normalizePlay` e `emptyPlay` em `src/lib/play.ts`, e `validateGrid`;
  - a vista Grelha, só de leitura.
- **Semente:** o Claude converte `docs/arquivo/grelha-semente.json` em `rows.json`, `facts.json` e `review.json`.
  - **Linhas.** Cada linha da semente dá uma `GridRow`, com id `g-`.
    - O `ref` aponta para a entidade do cânone quando existe (ver `docs/ids.md`).
    - Os nomes em `pcs` passam para as ids das linhas `pc` (a semente traz os `ref` desses PCs, `c-pc-*`).
    - O `pair` de cada Laço sai dos nomes de cada lado de «↔».
    - `sabe` passa a `knows`, `quer` a `wants`, `teme` a `fears`.
    - As células de «Nível do grupo» e «Resumo» de `ch1` a `ch7` vão para `byChapter`.
  - **Factos.** Cada célula de `s1` a `s5` dá um ou mais factos.
    - A dona de cada facto tem de ser a linha onde a célula estava: o `kind` escolhe-se para que `ownerOf` dê essa linha.
    - O texto mantém-se. Uma célula que conta coisas diferentes divide-se em vários factos, e uma célula `pista` com `pistas: N` dá N factos `pista`.
    - O estado da semente diz que kind usar:
      - `registo` dá `cena`, `estado` ou `registo`;
      - `aberto` dá `relacao`, `promessa`, `escolha` ou `consequencia`;
      - `fechado` dá `closed`.
    - «(← Sx)» no texto passa a `origin`, apontando para o facto da mesma linha nessa sessão, e sai do texto.
    - Uma célula `pago` com «(← Sx)» foi quem pagou: leva `origin` e `closed`. Uma célula `pago` sem seta foi paga por um facto posterior, ou da mesma sessão, que passa a tê-la em `origin`. Se esse facto não existir, a célula leva `closed`.
  - **Ideias.** As células de `s6` em diante dão notas `ideia` em `review.json`, com `tags`, `factKind` e, a partir de «(← Sx)», `because`. Nunca dão planos, porque não foram decididas pelo DM.
    - As células «Sem cena pessoal planeada» não entram, porque a Grelha as calcula.
    - As de «Nível do grupo» e «Resumo» nos capítulos vão para `byChapter`.
  - **Antes de entrar em `main`,** o DM vê a semente na Grelha.
- **Aceitação:** a Grelha mostra as cinco sessões com o conteúdo do mockup, os filtros, os ecos e as contagens funcionam, e o validate passa.

### Fase 2: escrever

- **O que se faz:**
  - o editor da célula e do cabeçalho;
  - os botões «Arquivar», «Nova linha» e «Nota rápida»;
  - `dm.json` e a junção das camadas, com ✎ e «por rever»;
  - gravar por célula, com a fusão em caso de conflito;
  - os planos em colunas passadas, com os três botões.
- **O editor** tem:
  - o texto;
  - «Toca em», para escolher linhas, com pesquisa;
  - «Nasce de», com os factos e planos de colunas anteriores, filtrados pelas linhas escolhidas;
  - as tags;
  - «Preparado» nos planos e «Só DM» nas colunas jogadas;
  - a dona calculada, visível antes de gravar.
- **Aceitação:**
  - corrigir um facto da S5 mostra ✎ e «por rever» e cria um commit com uma mensagem clara;
  - um plano na S6 muda as contagens;
  - duas abas a editar ao mesmo tempo não perdem entradas.

### Fase 3: rever

- **O que se faz:**
  - as notas na célula, com «Aceitar sugestão» e a resposta;
  - as ideias tracejadas, com «Aceitar» e «Rejeitar»;
  - a contagem «Por responder» e a atualização de 30 em 30 segundos;
  - a skill `/vigia-cotn` e `scripts/escuta.sh`.
- **Aceitação:**
  - numa conversa do Claude com «vigia», guardar uma célula faz aparecer, em cerca de um minuto, as perguntas na conversa e «?» na célula;
  - responder fecha a nota;
  - uma correção confirmada passa para `facts.json` e perde o ✎.

### Fase 4: preparar e fechar

- **O que se faz:** a skill `/preparar-cotn` e os passos novos do fecho em `docs/fluxo.md`.
- **Aceitação:** depois do fecho da S6, os planos jogados viram factos com `origin` e os que não se jogaram aparecem com os três botões.

## 15. Escolhas por defeito (o DM pode mudar)

- **Atitude:** a Grelha tem escala própria, guardada na linha: amigável, neutro, desconfiado, hostil, por conhecer, morto. Não usa `state.attitudes`, que tem a escala do livro e está vazio.
- **Ecos:** dois por célula, mais «+N».
- **Limites:** três perguntas por ronda e três ideias por Preparar.
- **PC do Tiago:** fica a linha «PC do Tiago» até haver personagem.
- **Telemóvel:** a Grelha lê-se toda e edita-se com o mesmo editor, em ecrã inteiro.

## Anexo A: as linhas da semente (112)

**Sessão**

- Sessão (4): Dia no mundo · Nível do grupo · Resumo · Onde parou

**Quem**

- Grupo (1): O grupo
- PC (5): Lucan Anzol-Bruma · Isco Anzol-Bruma · Quasi · Lia · PC do Tiago
- NPC (18): Bufal II · Jevan · Azrok · Litcha das Cinzas · Morgid · Alberto Pé-Leve · Vasco Corvelo · Rosinda Sousela · Elmiro Trigueiro · Damião Prestes · Alex · Bolbara · Padre Perestrelo · Prisioneiro do padre · Yussa Errenis · Duarte Mirim · Skr'a S'orsk · Lizardfolk do ossário
- Rival (1): Os Bons Demais
- Fação (5): Império Dwendaliano · Dinastia Kryn · Miríade · Assembleia de Cerebrus · Biblioteca da Alma de Cobalto

**Arcos pessoais**

- Ambição (8): Tirar a maldição: poder ser visto · Vingar-se da caravana · Perceber a ligação a Baeshra · Proteger o irmão · Pescar aquele Monstro · Fazer do irmão campeão, ou livrá-lo · Uma tripulação; quem cortou a corda · Encontrar o pai
- Agenda (4): Baeshra → Lucan · Sess'inek → Lucan · Quem caça o Isco · Vesq'ar → Quasi
- Laço (6): Lucan ↔ Quasi · Lucan ↔ Isco · Isco ↔ Lia · Quasi ↔ Alberto · Quasi ↔ Damião · Isco ↔ Elmiro

**Onde e com quê**

- Local (6): Urzin · Cemitério Afundado · Torre das aranhas · Obelisco negro · Forte Ventura · Falésias do Véu-Quebrado
- Item (6): Adaga drow +1 · Garra de seis dedos · Mapa do Morgid · Livro de registos · Saco da Lia · Sete amuletos do trono

**Enredo**

- Missão (4): Resgatar a Bolbara · Guiar a patrulha ao forte · Investigar o rubídio · Névoa do Brejo
- Decisão (5): Dizer «Miríade» ao Jevan · Matar o Skr'a S'orsk · Tirar o mapa ao Morgid · Ler o livro do escriba · Curar o Alex à vista do Elmiro
- Promessa (4): 800 po à chegada ao forte · Devolver o mapa ao Morgid · O segredo da máscara · O Alex deve a vida à Lia
- Relógio (4): A terceira vez · A Dinastia observa o pântano · Urzin sem seer · Guerra Império–Dinastia
- Gatilho (5): Tocar na pedra · O Damião vê algo estranho · A máscara do Quasi cai · A Bolbara morre ou é exorcizada · Um flash de Ruidus
- Revelação (10): Baeshra e o clã Ro · A verdade do resgate · O padre entrega a Bolbara ao Truche · O que a garra faz · As vidas passadas da Lia · O Alberto é da Assembleia · A corte é de Sess'inek · A tempestade é o Truche · Quem é a prisioneira · A trança branca é da Lia
- Semente (5): O crânio com dente de ouro · O sonho do Quasi · A adaga reage à Lia · Os mortos-vivos sem dono · As aves de sudoeste
- Desfecho (1): Matar, soltar ou redimir Alyxian

**Fora do jogo**

- Jogador (5): Renata · Pedro Silva · Pedro Ropio · Camila · Tiago Rosa
- Teoria (2): O Alberto joga dos dois lados · Sess'inek: deus de quê?
- Mesa (3): Regras da casa · Piadas internas · Confessionário

## Anexo B: `scripts/escuta.sh`

```bash
#!/usr/bin/env bash
# Escuta da Grelha: avisa quando a app guarda (commits novos em origin/main).
# Espera que o DM pare de guardar (o ramo fica igual entre duas verificações) e junta tudo num aviso.
# Uso: Monitor com `bash scripts/escuta.sh` (skill /vigia-cotn).
cd "$(dirname "$0")/.." || exit 1

remote_sha() { timeout 20 git ls-remote origin refs/heads/main 2>/dev/null | cut -f1; }

last=$(remote_sha)
[ -z "$last" ] && last=$(git rev-parse HEAD)
echo "ESCUTA LIGADA · main em ${last:0:7}"

while true; do
  sleep 10
  cur=$(remote_sha)
  if [ -z "$cur" ] || [ "$cur" = "$last" ]; then continue; fi

  # Espera que o DM pare de guardar: só avança quando o ramo não muda entre duas verificações.
  while true; do
    sleep 10
    nxt=$(remote_sha)
    if [ -n "$nxt" ] && [ "$nxt" != "$cur" ]; then cur=$nxt; else break; fi
  done

  if timeout 60 git fetch -q origin main 2>/dev/null; then
    echo "COMMITS NOVOS ($(git rev-list --count "$last..$cur" 2>/dev/null || echo '?')) ${last:0:7}..${cur:0:7}"
    git log --reverse --format='  %h %ad %s' --date=format:'%H:%M' "$last..$cur" 2>/dev/null | head -20
    echo "  ficheiros: $(git diff --name-only "$last" "$cur" 2>/dev/null | tr '\n' ' ' | cut -c1-400)"
  else
    echo "COMMITS NOVOS em ${cur:0:7} (o fetch falhou; ver à mão)"
  fi
  last=$cur
done
```
