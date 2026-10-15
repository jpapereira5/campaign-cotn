# Campanha · Call of the Netherdeep

O assistente de DM da campanha *Call of the Netherdeep* (com o prólogo *Unwelcome Spirits*) da mesa Contos & Escudos: a base de dados da campanha em ficheiros Markdown, a Grelha que mostra semana a semana o que aconteceu e o que falta preparar, e o Claude a rever, a preparar e a fechar cada sessão. A arquitetura está em [`docs/arquitetura.md`](docs/arquitetura.md); o modelo da Grelha em [`docs/grelha.md`](docs/grelha.md); o método em [`docs/metodo.md`](docs/metodo.md); o fluxo de trabalho (Drive, Claude, repositório) em [`docs/fluxo.md`](docs/fluxo.md); os nomes em português em [`docs/glossario.md`](docs/glossario.md).

## A base de dados

Um ficheiro Markdown com cabeçalho YAML por coisa; o nome do ficheiro é a id.

```
mundo/        o que existe: personagens/ (c-*), facoes/ (f-*), locais/ (l-*), itens/ (i-*), segredos/ (r-*), lore.md
plano/        o que pode acontecer: campanha.md (capítulos, capítulo atual), beats/ (b-*), fios/ (a-* arcos, amb-* ambições, t-* frentes, relógios, missões, promessas, decisões, gatilhos, sementes, desfechos, laços, agendas)
registo/      o que aconteceu: sessoes/sNN-AAAA-MM-DD.md (cabeçalho, resumo e acontecimentos com efeitos), decisoes.md
mesa/         quem joga: jogadores/ (p-*), fios/ (teorias e piadas da mesa), regras.md, batalhas/ (*.yaml, a página Batalha)
livro/        o livro tal como escrito, em JSON, só para consulta
grelha/       linhas.json (o que a Grelha acompanha) · dm.json (a camada do DM, só a app escreve) · revisao.json (as notas do Claude)
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

Seis skills em `.claude/skills/`, para usar numa conversa com acesso ao repositório. Não é preciso chamá-las: o Claude carrega cada uma quando o pedido encaixa na descrição dela (o `/nome` é só atalho).

- **`/vigia`** — fica à escuta (`scripts/escuta.sh`) e revê cada gravação do DM em tempo real: perguntas curtas com resposta sugerida, escritas em `grelha/revisao.json` para aparecerem na célula.
- **`/preparar`** — lê a Grelha para a próxima sessão (`node scripts/grelha.ts`), assinala os esquecidos, os PCs sem cena e o cânone à frente, e deixa ideias e avisos nas células.
- **`/fecho`** — depois da sessão: escreve o registo com acontecimentos e efeitos, atualiza as entidades e as decisões, absorve a camada do DM, valida e grava (`docs/fluxo.md`).
- **`decidir`** — sempre que o DM decide ou há algo a confirmar: perguntas interativas, e cada decisão vai para o ficheiro da coisa, para `registo/decisoes.md` e para uma ideia na célula certa da Grelha.
- **`arcos`** — os arcos dos PCs: três descobertas por personagem e por capítulo, cânone separado de proposta, propostas como perguntas.
- **`runsheet`** — o documento de preparação de uma sessão, como Google Doc na pasta Session Prep.

## Desenvolvimento

```
npm install
npm run dev        # monta src/generated/dados.json e abre http://localhost:5173
npm run validate   # lê e valida a estrutura (0 erros é obrigatório; --warn mostra os avisos)
npm test           # testes das bibliotecas puras (estado, Grelha, camada do DM, grafo, pesquisa, Markdown)
npm run check      # svelte-check
npm run build      # dist/
npm run grelha     # a Grelha em texto (--linha <id>, --json)
python3 scripts/normalizar-texto.py   # glossário pt-PT e grafia do AO90 no corpo dos ficheiros
```

Deploy automático para GitHub Pages em cada push para `main` (`.github/workflows/deploy.yml`): valida, testa, verifica e constrói.

## Direitos

Os ficheiros são resumos e estrutura (nomes, relações, cenas, condições) escritos para uso pessoal do DM; não contêm o texto do livro. As extrações de trabalho ficam fora do repositório (`research/`, ignorado pelo git).
