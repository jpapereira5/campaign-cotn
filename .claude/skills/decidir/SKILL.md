---
name: decidir
description: Decisões do DM sobre a campanha CotN. Usar sempre que o DM decide, confirma ou rejeita alguma coisa (lore, plano, NPCs, arcos, preparação), sempre que há uma escolha que é dele, e no fim de um brainstorm. Apresenta as escolhas como perguntas interativas e grava cada decisão no cânone, nas decisões e na Grelha.
---

# decidir: do brainstorm ao cânone

O DM decide; o Claude pergunta bem e grava tudo no sítio certo. Regras de fundo em `docs/fluxo.md` (estados de uma ideia, decisões de preparação).

## 1. Antes de perguntar

- **Confirma o que já existe.** Procura no repositório (`grep -rn` em `mundo/ plano/ registo/ mesa/`), nos PDFs do projeto e na Drive antes de propor. Se a resposta já está escrita (ex.: a cadeia Perestrelo → Tversky → Alberto estava na ficha do Alberto), diz onde está e pede só confirmação.
- **Procura incoerências** que a decisão criaria: tempo (dias, idades, quem é velho demais), distâncias (hexágonos por dia), regras da mesa (`mesa/regras.md`), decisões anteriores. Diz-as primeiro, em poucas linhas.
- **Se a ideia é tua, diz de onde veio.** Nunca apresentes uma invenção como se estivesse nos ficheiros.

## 2. Perguntar

- Usa sempre a ferramenta de perguntas interativas (AskUserQuestion): até 4 perguntas por vez, 2 a 4 opções cada, `multiSelect` quando as opções não se excluem.
- A recomendação vai em primeiro lugar, com «(Recommended)», e a razão cabe na descrição da opção. O DM espera opinião de par, decidida, não um menu neutro.
- Se o DM pedir a tua opinião, põe-a no texto da pergunta, em duas ou três frases.
- Lê a resposta com atenção: muitas vezes é texto livre que muda a pergunta, pede investigação («confirma na backstory») ou rejeita. Segue o que ele diz, não a opção mais próxima.
- Decisões em cascata: depois de uma resposta, pergunta logo o que dela depende, na mesma conversa.

## 3. Gravar (na mesma conversa, sem esperar)

Uma decisão do DM é canónica quando ele mostra que decidiu, dita de qualquer maneira.

1. **O ficheiro da coisa** (`mundo/…`, `plano/…`): acrescenta ou corrige, com «(Decidido pelo DM (AAAA-MM-DD))». Se a decisão substitui texto antigo, substitui-o; não deixes duas versões.
2. **`registo/decisoes.md`**: secção `## Decidido pelo DM (AAAA-MM-DD)` (cria-a se não existir), itens numerados, uma frase a negrito com a decisão e o resto em prosa curta. Se a decisão corrige uma anterior, diz qual («substitui a decisão N de AAAA-MM-DD»). As rejeitadas também ficam: «Ficam de fora: …».
3. **A Grelha** (`grelha/revisao.json`, nunca `grelha/dm.json`): para cada decisão de preparação, uma nota `ideia` na linha da coisa e na coluna onde entra (`s<N>` da próxima sessão, ou `ch1`, `ch2`… para capítulos), com `because: ['registo/decisoes.md AAAA-MM-DD #N']`, `factKind`, `suggestion` e `tags: ['so-dm']` quando é segredo. Ids novas (`n-<prefixo>-NN`), `status: aberta`.
4. **Fecha as notas que a decisão contradiz** (`status: fechada`, com «[substituída: … decisão AAAA-MM-DD #N]» no fim do texto).
5. **Coisas novas:** NPC novo → `mundo/personagens/c-*.md`; relógio → `plano/fios/t-relogio-*.md` com `passos`; qualquer id que deva aparecer na Grelha → `grelha/linhas.json`. Se a linha não existe, põe a nota na linha mais próxima que exista.
6. **Acontecimentos já jogados** que só agora se ficam a saber (ex.: uma fala que o DM disse à mesa e não estava no registo) vão para o registo da sessão certa, com `fonte: dito pelo DM, AAAA-MM-DD`. Cuidado com a regra da dona (`src/lib/grelha/dona.ts`): uma `pista` precisa de um só segredo em `envolve`; se não, usa `cena` (primeiro PC).
7. **Documentos da Drive** que a decisão desatualiza: versão nova (`_v2`, `v3`…) e a anterior que tu criaste vai para o lixo. Os documentos originais do DM não se apagam.

## 4. Validar e publicar

```
python3 scripts/normalizar-texto.py
npm run validate        # 0 erros
git add -A && git commit -m "Decisões: <resumo>" (com as linhas de atribuição da sessão)
git pull --rebase origin main && git push origin main
```

Se o push for recusado, a app gravou `dm.json` entretanto: `git pull --rebase` e repete.

## 5. Responder

Curto, em português de Portugal: o que ficou decidido (uma linha por decisão, com o efeito na mesa), onde ficou (decisões, ficheiro, Grelha) e o que falta decidir, se faltar, já como pergunta interativa.
