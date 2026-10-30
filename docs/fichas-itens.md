# Fichas de itens para a mesa

Os itens mágicos entregam-se à mesa em fichas impressas, recortadas e dadas ao jogador quando a personagem recebe o item (ou o identifica). Convenção decidida pelo DM a 2026-10-30 (#5); modelo: a folha de itens mágicos do one-shot *Rise of the Redscales* (`redscales_item_handouts_a4.pdf`).

## Formato

- A4 ao alto, margens de 10 mm, grelha de **3 colunas** (cerca de 61 mm cada); cada ficha tem a largura de uma coluna, moldura tracejada para cortar e 4 mm entre fichas.
- Cada ficha: **nome** (negrito) · tipo, raridade e sintonização (itálico, cinzento) · filete · **aspeto** (itálico: o que se vê, e o cheiro quando conta) · **propriedades** (título a negrito e itálico, texto pelas regras de 2014; termos de regras em inglês) · rodapé opcional, em itálico: **só a origem** (o local, o NPC ou o contexto de onde veio), **nunca quem o tem**, porque depois de impressa a ficha muda de mão (decisão 2026-10-30 #11).
- A altura acompanha o texto; uma ficha nunca se parte, e o que não cabe passa à coluna ou à página seguinte. Fonte-padrão (Times), sem fontes embutidas.
- **Tudo em pt-PT, com o inglês entre parênteses** (decisão 2026-10-30 #6): o nome do item em português, com maiúscula no início de cada palavra e preposições, artigos e conjunções em minúsculas («Cimitarra de Lâmina Negra», «Periapto contra Veneno»; o script fá-lo sozinho), e o nome inglês a seguir, em letra pequena (campo `original`); feitiços, perícias, condições, tipos de dano e termos de regras em português com o termo inglês entre parênteses: *detetar magia* (*detect magic*), Perceção (Perception), descanso longo (long rest), sintonização (attunement). Assim lê-se sem saber inglês e encontra-se no D&D Beyond.
- **Item que já existe num livro** (decisão 2026-10-30 #8): o nome é a tradução para pt-PT do nome oficial (*Wand of Magic Detection* → Varinha de Deteção de Magia, *+1 Dagger* → Adaga +1), nunca um nome inventado; a tradução é a que se diria hoje em Portugal, não a literal (*Prosthetic Limb* → Prótese de Mão, e não «Membro Protético»); o que este exemplar tem de próprio (de osso, de lâmina negra) vai no aspeto, em itálico. Nomes próprios só para os itens da casa (Lupa das Entrelinhas, Luneta da Alvorada).
- Só o que a personagem sabe quando recebe o item: nada de segredos (só DM), nada de origens por revelar.

## Como se faz

1. Os itens de uma sessão vão para `mesa/fichas-itens/sNN.yaml` (formato no cabeçalho de `scripts/fichas-itens.py`). O texto mecânico copia-se do livro (skill `livro`) ou da ficha do item em `mundo/itens/`, e as fichas da casa (como a Lupa das Entrelinhas) seguem o que o DM decidiu.
2. `python3 scripts/fichas-itens.py mesa/fichas-itens/sNN.yaml sessao_NN_fichas_itens.pdf` gera o PDF.
3. O PDF vai para `cotn_2026/session_prep` na Drive (`sessao_NN_fichas_itens.pdf`, versões `_v2`…).
4. `python3 scripts/fichas-itens.py --modelo <saida.pdf>` dá uma página de 9 fichas em branco, para preencher à mão (na Drive: `fichas_itens_modelo.pdf`).

## Na preparação da sessão

Faz parte de toda a preparação (skill `preparar-cotn`): o **inventário de todas as coisas mágicas que podem aparecer na sessão** — as que se podem encontrar nos locais da sessão (livro e cânone), as que os NPCs que entram trazem e podem passar ao grupo, e as que o grupo já leva e pode usar. Fica fora o que tem efeito por revelar (nota no cabeçalho do YAML, com o porquê).
