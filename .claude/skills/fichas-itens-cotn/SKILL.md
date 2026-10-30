---
name: fichas-itens-cotn
description: Fazer a folha de fichas de itens mágicos para imprimir, recortar e entregar à mesa (A4, 3 colunas), com o inventário de tudo o que é mágico e pode aparecer numa sessão, sem repetir o que já foi impresso numa folha anterior. Usar na preparação de cada sessão (passo da preparar-cotn), quando o DM pede «fichas de itens», «handouts de itens», «a folha dos itens mágicos», ou quando um item novo entra em jogo e precisa de ficha.
---

# fichas-itens-cotn: as fichas de itens mágicos para a mesa

Os itens mágicos entregam-se à mesa em fichas impressas, recortadas e dadas ao jogador quando a personagem recebe (ou identifica) o item. Convenção e formato em `docs/fichas-itens.md`; o gerador é `scripts/fichas-itens.py`; um YAML por sessão em `mesa/fichas-itens/sNN.yaml`. Decisões 2026-10-30 #5 a #12. Modelo: a folha de itens do *Rise of the Redscales*.

**Uma ficha imprime-se uma vez.** Um item que já saiu numa folha de uma sessão anterior não volta a sair: o jogador já tem a ficha na mão. O script trata disso sozinho (decisão 2026-10-30 #12).

## 1. Âmbito

- A sessão é a próxima (o registo de maior `n` em `registo/sessoes/` mais um), a não ser que o DM diga outra.
- Lê o que vai entrar na sessão: a preparação (se já existe), a coluna `sNN` da Grelha (`node scripts/grelha.ts`, `python3 scripts/notas.py`), o `ondeParou` da última sessão e as fichas dos locais e NPCs que entram.

## 2. Inventário: tudo o que é mágico e pode aparecer

Três fontes, e todas:

1. **O que se encontra nos locais da sessão:** o tesouro do livro (skill `livro`; pesquisa do Projeto, sobretudo o *Explorer's Guide to Wildemount* e o *Call of the Netherdeep*), reconciliado com o cânone (`mundo/locais/`, Ficha de mesa, decisões). O que a mesa já mudou ganha ao livro.
2. **O que os NPCs que entram trazem e podem passar ao grupo** (fichas em `mundo/personagens/`; tesouro do livro de cada um).
3. **O que o grupo já leva e pode usar:** os efeitos `posse` dos registos (quem tem o quê) e as fichas dos PCs e dos itens em `mundo/itens/`.

Fica de fora, com o porquê numa linha no cabeçalho do YAML: o que tem efeito ainda por revelar, o que vai na ficha do jogador (por exemplo, o vaso do génio do Bob Lin), o que ainda não foi dado, e o que não é mágico à vista.

## 3. Já impressos

- Cada item leva um `id`: a id do item em `mundo/itens/` (`i-lupa-do-comandante`) ou, se não tiver ficha, uma id curta e estável (`cimitarra-frith`). **A mesma coisa leva sempre a mesma id** em todas as folhas: é por ela que o script reconhece o que já foi impresso.
- O script compara com as folhas das sessões anteriores (`sMM.yaml`, MM menor) e deixa de fora o que já lá está, a dizer quais na saída.
- `reimprimir: true` só quando o item mudou (identificaram mais propriedades, o DM mudou a ficha) ou a ficha se perdeu; diz ao DM porquê.
- Escreve no YAML todos os itens do inventário, mesmo os já impressos: o YAML é o inventário da sessão, a folha só leva os novos. Se nenhum for novo, não há folha; diz-se isso ao DM.

## 4. Escrever as fichas

- **Tudo em pt-PT, com o inglês entre parênteses** (decisão #6), para quem não lê inglês: feitiços, perícias, condições, tipos de dano e termos de regras — *detetar magia* (*detect magic*), Perceção (Perception), descanso longo (long rest), sintonização (attunement).
- **Nome:** item de um livro leva o nome oficial traduzido (decisão #8), dito como se diz hoje em Portugal e não à letra (decisão #9): *Wand of Magic Detection* → Varinha de Deteção de Magia, *Prosthetic Limb* → Prótese de Mão, *Periapt of Proof against Poison* → Amuleto à Prova de Veneno (#10). O nome inglês vai no campo `original`. Nomes próprios só para os itens da casa (Lupa das Entrelinhas). As maiúsculas põe-nas o script (#7).
- **Aspeto** (itálico): o que se vê, e o cheiro quando conta (o Isco tem faro apurado); é aqui que fica o que o exemplar tem de próprio (de osso, de lâmina negra). O que já foi dito à mesa manda: copia a descrição usada (registo, ficha do item).
- **Propriedades:** pelas regras de 2014 (nunca as de 2024), do livro ou da ficha da casa que o DM aprovou.
- **Rodapé** (itálico): só a origem — o local, o NPC ou o contexto de onde veio —, **nunca quem o tem** (#11).
- **Só o que a personagem sabe** ao receber o item: nada de segredos (só DM), nada de origens por revelar.

## 5. Mostrar ao DM antes de gerar

Lista curta: os itens novos (nome, de onde vêm), os que ficam de fora por já estarem impressos, os que ficam de fora por outro motivo, e **à vista, entre parênteses retos, o que inventaste** (aspetos, cheiros, nomes) e qualquer coisa que contrarie o que foi dito à mesa ou o livro. Decisões dele como perguntas interativas (skill `decidir`). Só depois de ele confirmar se gera.

## 6. Gerar, conferir e entregar

1. `python3 scripts/fichas-itens.py mesa/fichas-itens/sNN.yaml <scratchpad>/sessao_NN_fichas_itens.pdf` (`--todos` para incluir os já impressos, só se o DM pedir uma folha completa).
2. Confere a folha a olhar para ela (`pdftoppm -r 80 -png`): nada cortado, nomes e acentos certos.
3. Drive, pasta `cotn_2026/session_prep`: `sessao_NN_fichas_itens.pdf` (PDF em base64, `disableConversionToGoogleType`); versões novas como `_v2`, `_v3`… e a anterior que criaste vai para o lixo.
4. Envia o PDF na conversa (SendUserFile).
5. O que o DM aprovou e é novo (o aspeto, uma ficha da casa) volta para a ficha do item em `mundo/itens/` (nada se perde); decisões em `registo/decisoes.md`.
6. `npm run gravar -- "<mensagem>"`.

## 7. Na resposta

Uma linha com o que entrou, uma com o que ficou de fora (já impresso, ou porquê), e entre parênteses retos o que falta o DM aprovar.
