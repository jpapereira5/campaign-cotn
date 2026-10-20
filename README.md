# Campanha · Call of the Netherdeep

O assistente de DM da campanha *Call of the Netherdeep* (com o prólogo *Unwelcome Spirits*) da mesa Contos & Escudos: a base de dados da campanha em ficheiros Markdown, a Grelha que mostra semana a semana o que aconteceu e o que falta preparar, e o Claude a rever, a preparar e a fechar cada sessão. A arquitetura está em [`docs/arquitetura.md`](docs/arquitetura.md); o modelo da Grelha em [`docs/grelha.md`](docs/grelha.md); o método em [`docs/metodo.md`](docs/metodo.md); o fluxo de trabalho (Drive, Claude, repositório) em [`docs/fluxo.md`](docs/fluxo.md); os nomes em português em [`docs/glossario.md`](docs/glossario.md); a cópia automática do repositório na Drive em [`docs/copia-drive.md`](docs/copia-drive.md); o formato das batalhas em [`docs/batalhas.md`](docs/batalhas.md). Os documentos só de registo (a migração, a semente da Grelha, a história das fases) estão em `docs/migracao-fase-a.md`, `docs/grelha-semente.json` e [`docs/arquivo/`](docs/arquivo/).

## A base de dados

Um ficheiro Markdown com cabeçalho YAML por coisa; o nome do ficheiro é a id.

```
mundo/        o que existe: personagens/ (c-*), facoes/ (f-*), locais/ (l-*), itens/ (i-*), segredos/ (r-*), lore.md
plano/        o que pode acontecer: campanha.md (capítulos, capítulo atual), beats/ (b-*), fios/ (a-* arcos, amb-* ambições, t-* frentes, relógios, missões, promessas, decisões, gatilhos, sementes, desfechos, laços, agendas)
registo/      o que aconteceu: sessoes/sNN-AAAA-MM-DD.md (cabeçalho, resumo e acontecimentos com efeitos), decisoes.md
mesa/         quem joga: jogadores/ (p-*), fios/ (teorias e piadas da mesa), regras.md, batalhas/ (*.yaml, a página Batalha)
livro/        o livro tal como escrito, em JSON, só para consulta
grelha/       linhas.json (o que a Grelha acompanha) · dm.json (a camada do DM, só a app escreve) · revisao.json (as notas do Claude) · acesso.json (o token cifrado com a palavra-passe da mesa)
```

O estado do mundo (quem está onde, quem sabe o quê, quem tem o quê, as atitudes, os relógios) não se escreve: calcula-se dos acontecimentos das sessões, por ordem (`src/lib/estado.ts`). Nada se edita à mão na app: o cânone entra pelo fecho, com o Claude; a app só grava a camada do DM.

## A app

Svelte 5 + Vite, em GitHub Pages. Cinco vistas e a Ficha:

- **Grelha** — uma linha por coisa que vale a pena acompanhar, as sessões jogadas e as colunas futuras; os acontecimentos na linha dona e ecos nas outras; estados (aberto, esquecido, planeado, pago, pista, fechado, falta preparar); a camada do DM por cima (planos, correções, verdades, decisões, notas, ideias aceites) e a revisão do Claude na célula. O modo **Plano** mostra os arcos por capítulo.
- **Relações** — o grafo de quem se liga a quem, com as relações do cabeçalho e as que o registo criou, no fim do capítulo escolhido; âmbitos «neste capítulo», «até agora», «já conhecidos» e «tudo».
- **Sessão** — a ferramenta para a mesa: o plano da próxima sessão tirado da Grelha, os beats do capítulo por jogar com a marca «jogado à mesa», notas rápidas e as sessões do registo.
- **Batalha** — para o portátil, à mesa: ordem de iniciativa com PV e estados (magoado/ferido), a ficha de quem está escolhido com botões que sorteiam uma descrição por resultado (falha, magoa, fere, crítico, golpe final) sem repetir a última, as rondas, as zonas do corpo, lembretes e rescaldo. Os dados vêm de `mesa/batalhas/*.yaml` (o Claude escreve-os pela skill `batalha`); o estado grava-se em `grelha/dm.json` como uma entrada `kind: batalha`, alguns segundos depois de cada mudança.
- **Índice** — listas por pasta, com filtro.
- **Ficha** — uma página por coisa: estado atual, texto, história (os acontecimentos em que entra), plano (os beats à frente), relações e menções.

A pesquisa global abre com `Ctrl+K` ou `/`. Com o token do GitHub (Definições), cada «Guardar» faz um commit só de `grelha/dm.json` e a app lê `grelha/*.json` ao vivo; sem token, o que se edita fica só no browser.

## O Claude

Dez skills em `.claude/skills/`, para usar numa conversa com acesso ao repositório. Não é preciso chamá-las: o Claude carrega cada uma quando o pedido encaixa na descrição dela (o `/nome` é só atalho). Sete são **genéricas** e servem a qualquer campanha ou one-shot: a cópia-mãe está no repositório `jpapereira5/dnd-skills` e o que é próprio da CotN (pastas, Drive, Grelha, validação) está em `AGENTS.md`, secção «Para as skills». As outras três (`preparar`, `fecho`, `vigia`) são só deste projeto, porque vivem da Grelha. Outras ferramentas de IA começam pelo `AGENTS.md`.

- **`/vigia`** — fica à escuta (`scripts/escuta.sh`) e revê cada gravação do DM em tempo real: perguntas curtas com resposta sugerida, escritas em `grelha/revisao.json` para aparecerem na célula.
- **`/preparar`** — lê a Grelha para a próxima sessão (`node scripts/grelha.ts`), assinala os esquecidos, os PCs sem cena e o cânone à frente, e deixa ideias e avisos nas células; a pedido, escreve o documento de preparação da sessão (Google Doc na pasta Session Prep).
- **`/fecho`** — depois da sessão: escreve o registo com acontecimentos e efeitos, atualiza as entidades e as decisões, absorve a camada do DM, valida e grava (`docs/fluxo.md`).
- **`decidir`** — sempre que o DM decide ou há algo a confirmar: perguntas interativas, e cada decisão vai para o ficheiro da coisa, para `registo/decisoes.md` e para uma ideia na célula certa da Grelha.
- **`arcos`** — os arcos dos PCs: três descobertas por personagem e por capítulo, cânone separado de proposta, propostas como perguntas.
- **`capitulo`** — desenhar um capítulo à Mass Effect (enredos A/B/C–E, escolhas binárias, consequências), ligado aos objetivos dos PCs, por rondas com pontos de controlo.
- **`npc`** — um NPC em dois níveis: figurante (Mulligan) ou elenco (Mercer, com segredos em camadas e side quest).
- **`local`** — um local ou loja vivo: texto para ler, o que não encaixa, vida, segredos, comércio.
- **`livro`** — o que dizem os livros (CotN, Monte Selvagem, Tal'Dorei Reborn), com a referência, separado do que a campanha mudou.
- **`batalha`** — a folha de um combate (Google Doc) e o ficheiro da página Batalha (`mesa/batalhas/<id>.yaml`): combatentes, terreno, táticas e descrições por resultado.

## Desenvolvimento

```
npm install
npm run dev        # monta src/generated/dados.json e abre http://localhost:5173
npm run validate   # lê e valida a estrutura (0 erros é obrigatório; --warn mostra os avisos)
npm test           # testes das bibliotecas puras (estado, Grelha, camada do DM, grafo, batalha, acesso, Markdown)
npm run check      # svelte-check
npm run build      # dist/
npm run grelha     # a Grelha em texto (--linha <id>, --json)
python3 scripts/normalizar-texto.py   # glossário pt-PT e grafia do AO90 no corpo dos ficheiros
bash scripts/escuta.sh                # escuta as gravações da app (skill vigia)
python3 scripts/copia-drive.py gerar SAIDA   # a cópia de leitura para a Drive (docs/copia-drive.md)
```

Deploy automático para GitHub Pages em cada push para `main` (`.github/workflows/deploy.yml`): valida, testa, verifica e constrói.

## Direitos

Os ficheiros são resumos e estrutura (nomes, relações, cenas, condições) escritos para uso pessoal do DM; não contêm o texto do livro. As extrações de trabalho ficam fora do repositório (`research/`, ignorado pelo git).
