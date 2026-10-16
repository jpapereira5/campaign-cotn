---
name: npc
description: Criar ou aprofundar um NPC da CotN em dois níveis, figurante (estilo Brennan Lee Mulligan, um traço memorável) e elenco (estilo Matt Mercer, complexo, imersivo, com segredos e side quests). Usar quando o DM pede um NPC novo, improvisa um, ou quer promover um figurante a elenco.
---

# npc: figurante (Mulligan) ou elenco (Mercer)

Uma só skill com dois níveis: o nível escolhe-se pelo papel do NPC, não pela vontade de escrever muito. Fontes do método na Drive: `task_npc.md`, `npc_quick_template.md` (figurante) e `npc_template.md` (elenco), na pasta de templates; princípios no `dm_profile.md` (pasta `reference/`).

## 0. Escolher o nível

| Nível | Quando | Estilo à mesa |
| :-- | :-- | :-- |
| **figurante** | improvisado, uma cena, de passagem | Brennan Lee Mulligan: gancho, voz e ação; 2–3 detalhes, nunca um catálogo |
| **elenco** | recorrente, preparado, antagonista com arco, quem dá side quests | Matt Mercer: cerca de uma página, sensorial, camadas de segredo |

Por defeito, **figurante**, a não ser que o DM peça elenco ou o NPC vá voltar. **Promover:** quando a mesa nomeia o NPC, volta a procurá-lo ou lhe dá alcunha, reescreve-o como elenco.

## 1. Antes de escrever

- `git pull`. Procura se o NPC já existe (`grep -rli "<nome>" mundo/ registo/`) e lê a ficha, as relações e o que a mesa já viu (`## A mesa` nos resumos das sessões). Nunca contradigas o que foi jogado.
- O contexto: o local (`mundo/locais/`), a fação (`mundo/facoes/`), o capítulo (`plano/campanha.md`) e os beats onde entra (`plano/beats/`). O mundo molda tudo: clima, cultura, economia, religião da região (os PDFs do projeto, `livro/`).
- Os nomes seguem o glossário pt-PT (`glossario_pt_v8.md` na Drive). Nomes portugueses para o Império e a costa, como os que já existem (Corvelo, Casqueiro, Sousela).
- **Os PCs:** pensa que objetivo pessoal de um PC este NPC pode tocar (`mundo/personagens/c-pc-*.md`, `quer`/`teme`, e a skill `arcos`). Um NPC de elenco deve servir pelo menos um arco.

## 2. Princípios dos dois níveis

1. **O «bit»:** a essência numa frase (contraste, vício, desejo). Se só te lembrares de uma coisa à mesa, é esta.
2. **O que quer agora,** nesta cena.
3. **Apanhado a meio de uma ação,** nunca parado à espera do grupo.
4. **Descrição objetiva:** só sentidos, sem interpretar («uma cicatriz vai da orelha ao queixo», não «uma cicatriz ameaçadora»).
5. **2–3 ganchos memoráveis,** nunca a lista toda.
6. **Stat block:** usa sempre a referência que existir (livro, Manual dos Monstros) e copia os números; renomeia armas e armadura para o que esta pessoa usa (a CA vem da roupa descrita). Números próprios só se não houver referência.

## 3. Figurante (Mulligan)

- **Leitura à mesa,** 3 a 6 frases, nesta ordem: (1) gancho ou ação, com motivo próprio; (2) um visual forte; (3) o som (tom, ritmo, tique, ou o som à volta); (4) o que quer agora.
- **Cartão de 3 linhas:** quer agora · voz (velocidade, tom, um tique; contrasta com o último NPC) · *tell* (o gesto quando a emoção verdadeira escapa).
- **Uma frase pronta,** que pode ser a primeira coisa que a mesa ouve.
- **Sabe:** no máximo dois factos. **Em combate:** uma linha («foge a 1/4 dos PV», «não luta»).

## 4. Elenco (Mercer)

- **O conceito,** 2–3 frases: o bit, o que faz na história, o tema que espelha.
- **Aparência** num parágrafo para ler, na ordem Mercer: contexto/ação → silhueta → pele → roupa (a CA) → rosto/detalhe → movimento → som → cheiro. O diálogo vem depois. Opcional: tabela de detalhe fino (Perception/Insight com CD).
- **Personalidade** num parágrafo (temperamento, ferida, o que o move, o que o fecha, o *tell*), não em listas de traço/ideal/vínculo/defeito. **Quer / Teme** numa linha cada.
- **Voz** num parágrafo curto: velocidade, tom, textura, volume, tiques, e como muda sob pressão.
- **Frases:** 4 a 8 que se usam mesmo.
- **Sabe e segredos:** o que diz com confiança, o que não sabe, e os segredos em **três camadas** (superfície, profundidade com CD ou confiança, osso só para o DM ou o clímax).
- **Na mesa:** relações (3–6, uma linha cada), o que o acende e o que o apaga, a máscara que cai (opcional: o pico emocional), a mecânica própria (CDs, rendição, «se trouxerem…»).
- **Side quest** (estilo Mercer): o que pede ao grupo, porquê a ele, o custo moral, o que dá em troca, e que objetivo de PC avança. Uma por NPC de elenco, no máximo duas.
- **Inventário e stat block** como no princípio 6.

## 5. Gravar

- **No repositório:** `mundo/personagens/c-<nome>.md` com o cabeçalho das outras fichas (`id`, `nome`, `tipo: npc`, `facoes`, `casa`, `capitulos`, `quer`, `teme`, `tags`, `legenda`, `relacoes`, `origem`) e as secções `## Resumo`, `## Objetivo`, `## Segredo`. A ficha completa de elenco vai em secções a seguir (`## Aparência`, `## Voz`, `## Frases`, `## Na mesa`). Se deve aparecer na Grelha, acrescenta a id a `grelha/linhas.json`.
- **Decisões:** o NPC só é cânone quando o DM o aprova; até lá é proposta. Apresenta as escolhas como perguntas interativas (skill `decidir`) e grava a decisão.
- **Na Drive (opcional):** se o DM quiser a ficha para a mesa, um Google Doc na Session Prep, sem YAML, versões novas como ficheiros novos.
- `python3 scripts/normalizar-texto.py`, `npm run validate` (0 erros), commit com as linhas de atribuição da sessão, push.

## 6. Responder

A leitura à mesa e o cartão (figurante), ou o conceito, a aparência e a side quest (elenco), mais o que ficou por decidir como pergunta interativa. O resto está na ficha.
