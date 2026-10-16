---
name: local
description: Criar ou aprofundar um local da CotN (cidade, bairro, masmorra, ermo, edifício, taberna ou loja) no estilo cinematográfico de Matt Mercer e Brennan Lee Mulligan, com texto para ler, vida própria, segredos e, se vender coisas, o comércio. Usar quando o DM pede um local, uma loja ou o que há para comprar num sítio.
---

# local: um sítio vivo, e as lojas

Um local não é um cenário parado: é um sítio onde está a acontecer alguma coisa quando o grupo chega. Fonte do método: `task_location.md` na Drive (pasta de tarefas).

## 1. Antes de escrever

- `git pull`. Procura se já existe (`mundo/locais/l-*.md`, `grep -rli "<nome>" mundo/ plano/ registo/`) e o que a mesa já viu. Nunca contradigas o jogado.
- **O mundo à volta:** clima, geografia, ecologia, cultura, economia, política e religião da região (PDFs do projeto: CotN, Explorer's Guide to Wildemount, Tal'Dorei Reborn; `livro/`). Isso decide os materiais, a arquitetura, a roupa, a comida, a língua e o que se vende.
- **O papel na história:** que beats passam por aqui (`plano/beats/`, campo `local`), que NPCs vivem cá (`casa`), que segredos se podem descobrir (`mundo/segredos/`), e que objetivo de PC pode avançar aqui (skill `arcos`).
- Nomes pelo glossário pt-PT (`glossario_pt_v8.md`).

## 2. Princípios

1. **Câmara:** do plano aberto ao pormenor (o que se vê ao chegar → o que se vê lá dentro → o detalhe que prende o olhar).
2. **Três sentidos no mínimo:** vista (luz, cor, escala), som (ambiente e pontual), cheiro.
3. **O que não encaixa:** cada local tem uma coisa fora do padrão, que sugere história.
4. **Vida:** o que está a acontecer agora, não só o que existe.
5. **Objetivo:** descreve o que se observa, nunca o significado.
6. **Os NPCs** ficam aqui num resumo de cena; a ficha completa faz-se com a skill `npc`.

## 3. Secções (salta as que não se aplicam)

- **O conceito:** uma frase, o que é este sítio e o papel que tem.
- **Atmosfera:** um parágrafo para ler em voz alta à chegada, e a quebra sensorial (Vista · Som · Cheiro · O que não encaixa).
- **Layout:** tabela de áreas (área · descrição · o que se pode fazer) e acessos.
- **Vida do lugar:** movimento, conversas, conflitos a decorrer.
- **NPCs presentes:** tabela (nome · papel · o que está a fazer · ficha) e uma ou duas frases de primeira impressão por NPC.
- **Comércio** (só se vende coisas): nível da loja (1–4), regateio (CD e regra), stock normal, stock especial (raridade, efeito), serviços, e **o que não está à venda** (objetos à vista que não se vendem: ganchos de quest, apego do NPC). Preços do Player's Handbook e do DMG; itens de Wildemount e de CotN (rubídio incluído) pelas regras do livro e de `mesa/regras.md`. Itens próprios da loja vão para `mundo/itens/i-*.md` se forem importantes.
- **Perigo** (só se houver): tabela de riscos (efeito, CD, onde) e notas táticas (cobertura, elevação, luz, terreno). Se for palco de combate, a skill `batalha` aproveita isto.
- **Segredos:** tabela em três camadas (superfície, fundo, escondido), com o modo de descobrir, a CD e o impacto.
- **Mudança com o tempo:** dia e noite, depois de um acontecimento, se os jogadores fizerem algo.
- **Ligações:** locais próximos, NPCs ligados, fios do plano, origem no livro e o que mudou.

## 4. Gravar

- **No repositório:** `mundo/locais/l-<nome>.md` com o cabeçalho dos outros locais (`id`, `nome`, `pai` se estiver dentro de outro, `capitulo`, `origem`) e as secções acima por baixo de `## Resumo`. Se deve aparecer na Grelha, a id vai para `grelha/linhas.json`.
- O local é proposta até o DM o aprovar: as escolhas vão como perguntas interativas (skill `decidir`).
- **Na Drive (opcional):** Google Doc para a mesa na Session Prep, sem YAML; versões novas como ficheiros novos.
- `python3 scripts/normalizar-texto.py`, `npm run validate` (0 erros), commit com as linhas de atribuição da sessão, push.

## 5. Responder

O texto para ler, o que não encaixa, o que está a acontecer, e (numa loja) o que não está à venda. O que falta decidir vai como pergunta interativa.
