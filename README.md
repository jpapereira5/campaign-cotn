# Campanha · Call of the Netherdeep

Ferramenta de planeamento de campanha de D&D: um mapa **visual** dos NPCs, das ligações entre eles e de como os enredos concorrentes (rivais, facções de Ank'Harel, ruidium, o lore de Alyxian, as ambições dos PCs) avançam **no tempo** e convergem no Heart of Despair, à maneira da "teia de aranha" que a Larian descreveu para Baldur's Gate 3. Dados de *Call of the Netherdeep* tal como escrito, com prólogo *Unwelcome Spirits*.

O método está em [`docs/metodo.md`](docs/metodo.md); as convenções de dados em [`docs/ids.md`](docs/ids.md); as regras próprias da campanha em [`docs/regras.md`](docs/regras.md); handouts em [`docs/handouts.md`](docs/handouts.md); lore geral em [`docs/lore.md`](docs/lore.md).

## Vistas

- **Linha temporal** — uma pista por arco (prólogo, Jewel, lore, ruidium, rivais, facções, ambições de cada PC); beats como cartões; um beat em várias pistas desenha uma linha vertical de **convergência**; o final recebe todas as pistas. Duplo clique marca um beat como jogado.
- **Grafo** — relações NPC↔NPC↔facção com força dirigida; o cursor de tempo (capítulo ou "jogado") mostra só as relações activas nesse momento; filtros por tipo, facção, arco e PC.
- **PCs** — ambições ligadas a NPCs, arcos e beats; avisa dos capítulos sem cena pessoal.
- **Frentes** — portentos por facção (o que acontece se ninguém intervier) com relógio.
- **Revelações** — listas com a regra das três pistas e o que a mesa já percebeu.
- **Sessão** — o que vem a seguir por pista, sessões, flags.
- **Índice** e **Definições** (token GitHub, sincronização, problemas nos dados).

## Dados

Tudo vive em `data/` como JSON editável à mão, em **duas camadas**:

```
data/book/                  o livro tal como escrito (referência; não se edita)
  campaign.json             capítulos e beat de convergência
  arcs.json                 pistas da linha temporal
  characters/*.json         PCs, NPCs, rivais, divindades (vários ficheiros por capítulo)
  factions/*.json           facções com portentos (fronts)
  locations/*.json
  relations/*.json          arestas temporais (fromBeat/untilBeat, condição)
  beats/*.json              cenas com arcos, participantes, escolhas, relógios, portentos
  revelations/*.json        revelações com pistas (beats)
data/campaign/              a nossa campanha: patches, acrescentos e remoções por cima do livro
  <mesma estrutura>         mesma id = patch de campos · `_remove: true` = esconder · id nova = acrescentar
  */crocudos*.json          material da campanha anterior do DM ("Crocudos"), incl. nomes em português da mesa
data/state.json             estado de jogo (beats jogados, revelações, atitudes, sessões, flags, notas)
```

Os ficheiros de uma pasta são concatenados. O que se cria na app vai para `data/campaign/<colecção>/dm.json`; a app nunca escreve em `data/book/`. Na app, "Ver: a nossa campanha / só o livro" alterna as camadas; ✚ marca o que foi acrescentado e ▲ o que foi alterado, e o painel de detalhe mostra o original do livro. Validar: `npm run validate` (ou `-- --warn` para ver avisos, `-- --book` para validar só o livro).

## Usar em vários PCs

A app lê e escreve `data/*.json` directamente no repositório pela API do GitHub. Em **Definições**, cola um *fine-grained personal access token* (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained) com acesso só a este repositório e permissão **Contents: Read and write**. O token fica no `localStorage` do browser; cada "Guardar" faz um commit em `main`. Sem token, a app funciona em modo local com exportar/importar.

## Desenvolvimento

```
npm install
npm run dev        # http://localhost:5173
npm run validate   # integridade dos dados
npm run check      # svelte-check
npm run build      # dist/
```

Deploy automático para GitHub Pages em cada push para `main` (`.github/workflows/deploy.yml`).

## Direitos

Os dados são resumos e estrutura (nomes, relações, cenas, condições) escritos para uso pessoal do DM; não contêm o texto do livro. As extracções de trabalho ficam fora do repositório (`research/`, ignorado pelo git).
