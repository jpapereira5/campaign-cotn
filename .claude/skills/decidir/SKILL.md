---
name: decidir
description: Decisões do DM numa campanha ou one-shot de D&D. Usar sempre que o DM decide, confirma ou rejeita alguma coisa (lore, plano, NPCs, arcos, preparação), sempre que há uma escolha que é dele, e no fim de um brainstorm. Apresenta as escolhas como perguntas interativas e grava cada decisão no cânone do projeto.
---

# decidir: do brainstorm ao cânone

O DM decide; tu perguntas bem e gravas tudo no sítio certo.

## 0. O projeto

Lê a secção `## Para as skills` do `AGENTS.md` do projeto: onde vive o cânone, onde se registam as decisões, onde ficam as notas para o DM, como validar e gravar. Sem projeto (conversa solta): as decisões ficam numa lista no fim da resposta e, se o DM quiser, num documento na Drive.

## 1. Antes de perguntar

- **Confirma o que já existe.** Procura no cânone do projeto, nos livros (skill `livro`) e na Drive antes de propor. Se a resposta já está escrita, diz onde está e pede só confirmação.
- **Procura incoerências** que a decisão criaria: tempo (dias, idades), distâncias (viagem por dia), regras da casa, decisões anteriores. Diz-as primeiro, em poucas linhas.
- **O que já se jogou confere-se na fonte primária**, a transcrição da sessão quando o projeto a tem (`AGENTS.md`), não num resumo. Uma decisão sobre algo que os jogadores já viram ou ouviram (o aspeto de um objeto, quem fez o quê, um nome dito à mesa) tem de bater com o que se disse; se não bate, mostra a citação e a discrepância antes de perguntar.
- **Se a ideia é tua, diz de onde veio.** Nunca apresentes uma invenção como se estivesse nos ficheiros.

## 2. Perguntar

- Usa sempre perguntas interativas (escolha múltipla), até 4 por vez, 2 a 4 opções cada, escolha múltipla quando as opções não se excluem.
- A recomendação vai em primeiro lugar, marcada como recomendada, e a razão cabe na descrição da opção. O DM espera opinião de par, decidida, não um menu neutro.
- Se o DM pedir a tua opinião, põe-a no texto da pergunta, em duas ou três frases.
- Lê a resposta com atenção: muitas vezes é texto livre que muda a pergunta, pede investigação ou rejeita. Segue o que ele diz, não a opção mais próxima.
- Decisões em cascata: depois de uma resposta, pergunta logo o que dela depende.

## 3. Gravar (na mesma conversa, sem esperar)

Uma decisão do DM é canónica quando ele mostra que decidiu, dita de qualquer maneira.

0. **Todas as ocorrências.** Antes de dar a decisão por gravada, procura (`grep`) no cânone todas as menções do que ela substitui e corrige-as; uma correção feita num só sítio volta a aparecer.
1. **O ficheiro da coisa** (a ficha do NPC, do local, do beat…): acrescenta ou corrige, com «(Decidido pelo DM (AAAA-MM-DD))». Se substitui texto antigo, substitui-o; não deixes duas versões.
2. **O registo de decisões** do projeto: uma secção por dia, itens numerados, uma frase a negrito com a decisão e o resto em prosa curta. Se corrige uma anterior, diz qual. As rejeitadas também ficam: «Ficam de fora: …».
3. **As notas para o DM** (se o projeto as tiver): uma nota por decisão de preparação, no sítio onde ele a vai ver quando preparar, com a referência à decisão. Fecha as notas que a decisão contradiz.
4. **Coisas novas:** NPC, local, relógio ou fio novos ganham ficha própria no formato do projeto.
5. **Acontecimentos já jogados** que só agora se ficam a saber vão para o registo da sessão certa, com a fonte («dito pelo DM, AAAA-MM-DD»).
6. **Documentos da Drive** que a decisão desatualiza: versão nova como ficheiro novo; a anterior que tu criaste vai para o lixo. Os originais do DM não se apagam.
7. **Valida e grava** com os comandos do projeto.

## 3b. Decisão rápida

Quando o DM decide uma coisa pequena e clara sobre uma personagem, um item ou um local (uma frase que ele diz, um nome, um valor, «fica assim»), não abras ronda de perguntas: confirma numa linha se houver ambiguidade e grava de uma vez os três sítios do passo 3 (a ficha, o registo de decisões, a nota para o DM na linha e na coluna certas), com o `grep` do passo 0 pelo que a decisão substitui. Responde com a decisão numa linha e os três sítios onde ficou. Se a decisão puxar outras (passo 2, cascata), pergunta-as a seguir, já com a primeira gravada.

## 4. Responder

Curto: o que ficou decidido (uma linha por decisão, com o efeito na mesa), onde ficou, e o que falta decidir, já como pergunta interativa.
