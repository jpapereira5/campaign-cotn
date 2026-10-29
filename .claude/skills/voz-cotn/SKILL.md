---
name: voz-cotn
description: Falas e reações de personagens da CotN para o DM dizer à mesa (NPCs, rivais, o familiar do Bob Lin), no tom do cartão de mesa e sem revelar segredos; e aprender com as falas que o DM disse à mesa para as personagens ficarem coerentes. Usar quando o DM pede «voz: <personagem>, <situação>», «o que diria X», «como reage a nixie a…», falas de NPCs ou reações a algo que aconteceu, durante a sessão ou na preparação, e no fecho.
model: sonnet
---

# voz-cotn: falas de personagem para a mesa

Existe para o DM ter, numa linha, o que uma personagem diz ou faz, sempre igual a si mesma de sessão para sessão (decisão 2026-10-28 #16). O que a torna coerente é o **cartão de mesa** de cada personagem e as **falas que o DM já disse à mesa**, que esta skill vai juntando.

## 1. Encontrar a personagem

- A ficha: `mundo/personagens/c-<id>.md`. Procura pelo nome e pelos nomes à mesa (`grep -rn -i` em `mundo/personagens/`, campo `aliases` e `legenda`).
- **O familiar do Bob Lin** (a nixie e as outras formas: mefite de lodo, ondina, pseudodragão de bronze) vive em `c-pc-boblin.md`: `### Cartão de mesa da nixie`, a lista «Personalidade» e as fichas das formas. Noutra forma, a voz e o feitio são os mesmos; muda o corpo.
- Lê, por esta ordem:
  1. o `### Cartão de mesa`: Voz, Gesto, Âncoras, Mais falas, Falas ditas à mesa, Quer, Teme, Esconde, Saída;
  2. `atitudeAtual` e `relacoes` (sobretudo com o PC envolvido na situação);
  3. «O que a mesa já sabe» e o último registo de sessão (`registo/sessoes/`, o de maior `n`, e `ondeParou`), para a personagem só saber o que viu ou lhe contaram;
  4. `python3 scripts/decisoes.py <id> <nome> <alcunhas>`, para apanhar decisões recentes que substituem outras.
- **A meio da sessão** lê só o repositório (`git pull` primeiro): a resposta tem de ser rápida.
- **Sem cartão de mesa:** diz-o numa linha, escreve as falas a partir do Resumo, do `quer` e do `teme`, e oferece-te para criar o cartão (skill `npc`).
- **PCs:** não escrevas falas de PCs, que são dos jogadores, a não ser que o DM o peça.

## 2. Escrever as falas

- **Duas ou três opções**, cada uma com uma intenção diferente (por exemplo, ameaça, desdém, ceder, mentir, desviar), com um rótulo de uma palavra e o gesto entre parênteses, em itálico.
- **No tom das Âncoras e das Falas ditas à mesa:** o mesmo vocabulário, o mesmo comprimento de frase, os mesmos tiques e as mesmas formas de tratamento (a nixie trata o Bob Lin por «mestre» e os outros por «secos»).
- **Curtas:** cada fala diz-se em menos de 10 segundos.
- **Português de Portugal**, AO90, sem brasileirismos; termos de regras em inglês quando a mesa os usa assim; glossário em `docs/glossario.md`.
- **Coerentes** com o que a personagem sabe, com a atitude atual e com a relação ao PC.
- **Sentidos:** quando ajudar, uma linha do que a mesa vê, ouve ou cheira. O Isco cheira primeiro (Perceção passiva 20 para ouvido e olfato).

## 3. Segredos

- Nenhuma fala revela o «Esconde» da personagem, um segredo `r-*` nem o que tem a tag `so-dm`. A nixie, por exemplo, nunca fala do génio, do Marid, da água viva nem da plateia.
- Se a situação obriga a revelar (um *zone of truth*, um *charm*, o Heart Sight de outra criatura, uma pergunta direta que só se esquiva mentindo), avisa o DM antes das falas («Isto pode revelar X») e dá uma fala que revela e outra que foge.
- Se o pedido contraria algo dito à mesa ou uma decisão, diz-o numa linha no fim («Atenção: …»).

## 4. Formato

Para o telemóvel, sem preâmbulo e sem fontes:

**<Personagem>**: <a situação, em poucas palavras>
1. *Rótulo:* (*gesto*) «fala»
2. *Rótulo:* (*gesto*) «fala»
3. *Rótulo:* (*gesto*) «fala»

Uma linha de sentidos, se ajudar. Uma linha «Atenção», se houver.

## 5. Guardar o que fica

- **Falas propostas:** só se guardam quando o DM diz que gostou de uma ou que a usou. Vai para «Mais falas» no cartão, com a data.
- **Valida e grava:** `npm run gravar -- "<mensagem>"`, com as linhas de atribuição da sessão.

## 6. Aprender com a mesa

O DM quer que as personagens fiquem cada vez mais iguais a si mesmas (decisão 2026-10-28 #16). Por isso, **as falas que o DM disse à mesa como NPC entram na ficha do NPC**, e a voz afina-se com elas.

- **Quando:** no fecho de cada sessão (skill `fecho-cotn`, passo «As vozes dos NPCs»), e sempre que o DM conta o que disse ou pede para rever uma sessão.
- **De onde:** da transcrição da sessão (`session_records/<global>_cotn_<nn>/transcript_whisperx.txt`), nunca do resumo. Só as falas que o DM disse **em personagem**: o NPC a falar, não a narração nem as regras.
- **Para onde:** no cartão de mesa do NPC, a lista `- **Falas ditas à mesa:**`, com a sessão e a marca de tempo («…» (S8, 01:23:45)). Escolhe as falas que mostram a voz (as frases que só aquela personagem diria), não todas. Se a ficha ainda não tem cartão, cria a lista na `## Ficha de mesa` e avisa o DM.
- **Afinar a voz:** quando as falas ditas mostram um padrão que o cartão não tem (um tique, uma palavra repetida, um tratamento, um tom), acrescenta-o à «Voz» com a marca «(observado à mesa, Sn)». Quando contrariam o cartão, o que se disse à mesa ganha: muda a «Voz» e mostra ao DM a mudança, com o antes e o depois. Uma fala de que o DM se desdiz não conta.
- **Sem perder nada:** as âncoras antigas não se apagam; o que deixa de servir vai para «Reserva».
- **Na resposta seguinte:** usa as Falas ditas à mesa como o modelo mais forte da voz, acima das âncoras escritas antes de a personagem entrar em jogo.
