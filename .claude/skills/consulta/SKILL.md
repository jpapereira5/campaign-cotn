---
name: consulta
description: Responder a meio de uma sessão de CotN (ou fora dela) sobre qualquer coisa já definida na campanha — um local, NPC, objeto, segredo, check, regra da casa ou o que a mesa já sabe — juntando todas as fontes e não só a preparação mais recente. Usar quando o DM pergunta por algo durante o jogo («obelisco», «ficha do Alberto», «arcana check», «o que se sente na pedra»), quando um chat «serve para correr a sessão», e sempre que a resposta depende de algo definido antes.
---

# consulta: responder à mesa com tudo o que já foi definido

Existe porque, na S7 (2026-10-21), a pergunta sobre o obelisco foi respondida só com a preparação mais recente e perdeu-se o que estava nas anteriores (decisões 2026-10-21 #83 a #85). A regra: **nunca responder a partir de uma só fonte.** A meio do jogo, a resposta tem de ser rápida, mas completa.

## 1. Perceber a pergunta

- Que coisa é (local, NPC, objeto, segredo, regra, sessão) e qual é a id no repositório (`l-`, `c-`, `i-`, `r-`, `b-`…). Os nomes à mesa podem vir encurtados ou em português («a pedra», «o obelisco», «o gnomo»): procura também pelos sinónimos.
- O que o DM quer: descrição para ler, checks, segredos, stat block, regra, «o que eles já sabem». Na dúvida, dá tudo, pela ordem da secção 3.

## 2. As fontes, todas, por esta ordem

1. **O Compêndio da sessão** («Sessão NN — Compêndio», Drive, `cotn_2026/session_prep`, `1WGi5hzOj2oPHEfFmvlwDmJN33X7Ed6h1`), se existir: uma só leitura com as fichas de mesa da sessão.
2. **O repositório `jpapereira5/campaign-cotn`** (fonte de verdade): clona ou faz `git pull`, depois:
   - a ficha da coisa (`mundo/…/<id>.md`), sobretudo a `## Ficha de mesa`;
   - `grep -rn -i` pela id e pelas palavras-chave em `mundo/ plano/ registo/ mesa/`: decisões (`registo/decisoes.md`, todas as datas, atenção às que substituem outras), beats, fios, segredos, registos das sessões (o que se jogou), `mesa/regras.md`.
   - Sem acesso ao repositório: a cópia `cotn_2026/github_repo` (`1z1HPx3iNHSlvnyDiJfEelVZcKxfQGr0R`), peça a peça.
3. **A Drive:** `fullText contains '<palavra>'` para encontrar todas as preparações, folhas de batalha, «locais narrados», ideias e handouts que o mencionam, **de todas as sessões, não só a última**. Lê as que tocam a coisa.
4. **As conversas passadas** do Projeto (`conversation_search` pelas palavras-chave): material desenhado que nunca chegou ao repositório.
5. **Regras:** perguntas de regras vão a `mesa/regras.md` (home rules, mandam) e ao livro (skill `livro`, D&D 5e de 2014); diz sempre o que é RAW e o que é da casa.

Se a pergunta é urgente, lê as fontes 1 e 2 primeiro e responde já, mas corre as 3 e 4 antes de dares a resposta por fechada; se trouxerem mais, manda um acréscimo curto («Encontrei mais: …»).

## 3. A resposta

Para o telemóvel, curta e completa, nesta ordem (salta o que não houver):

- **Ler** (texto para ler em voz alta, se houver).
- **Sentidos / o que se vê** (para quem perguntar).
- **Checks:** tabela «Check | CD | O que dá | Fonte».
- **Usar / regras** (efeitos mecânicos, custos, como o tempo do menir).
- **Por personagem** (reações de cada PC, se houver).
- **Segredos (só DM).**
- **O que a mesa já sabe** (do registo das sessões e da transcrição), e o que está por jogar.
- **Discrepâncias:** quando duas fontes não batem, mostra as duas com a data e diz qual é a mais recente; não resolvas sozinho.

Marca sempre a origem: [livro], [cânone] (decisão com data), [prep SN], [conversa], ou «sugestão» (tua, para improvisar). Uma sugestão nunca aparece como cânone.

## 4. Depois de responder

- Se encontraste algo definido (numa prep antiga, numa conversa) que **não está na ficha da coisa**, diz numa linha no fim: «Isto não está na ficha; meto-o lá depois da sessão?». Não interrompas o jogo para gravar.
- Depois da sessão (ou quando o DM disser), passa-o para a `## Ficha de mesa` da entidade (o aprovado nas secções; o resto em «Reserva»), grava (`npm run gravar`) e atualiza a cópia na Drive (skill `copia-drive`).

## Cuidados

- Nada de memória: confere sempre nas fontes, mesmo que te lembres.
- Não reveles a um jogador o que é «só DM»; a conversa é do DM.
- Português de Portugal; termos de regras em inglês quando a mesa os usa assim.
