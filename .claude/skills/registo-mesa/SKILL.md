---
name: registo-mesa
description: Manter o registo da mesa do DM, os Google Docs «Índice de sessões» e «Jogadores» na pasta tabletop da Drive, sempre atualizados. Usar no fim de cada fecho de sessão de uma campanha, sempre que o DM diz que mestrou uma sessão (one-shot, minicampanha, outro grupo), e quando muda quem joga (alguém entra, sai, é convidado ou falta).
model: sonnet
---

# registo-mesa: o índice de sessões e os jogadores

O DM quer um registo de **todas** as sessões que mestrou (com a numeração global) e de **todos** os jogadores, sempre atualizado. Vive em dois Google Docs na pasta `tabletop` da Drive (`1hoQLO1o3vX1zaTqdWqJmHqrGKAu8zLqE`):

- **«Índice de sessões»**: os totais por origem, uma linha por sessão (número global, data, sessão, mesa, nota com o que aconteceu) e as notas por aventura.
- **«Jogadores»**: os totais, a mesa da campanha em curso (jogador, PC, desde), quem já jogou (por origem, com as sessões), os jogadores online, a pool de convites e as notas.

Decidido pelo DM a 2026-10-20. Os dois documentos são Google Docs, sem cabeçalho YAML, em português de Portugal.

## Quando

1. **No fim de cada fecho** de uma sessão de campanha (depois do registo da sessão estar gravado).
2. **Quando o DM diz que mestrou uma sessão fora da campanha** («ontem fiz um one-shot com…», «acabámos o Farol»). Também quando ele o diz de passagem, numa conversa sobre outra coisa: pergunta se é para registar.
3. **Quando muda a mesa:** um jogador novo, um convite, alguém que sai ou passa a jogar online.

## O que perguntar

- **Sessão de uma campanha com registo** a que tens acesso (por exemplo a CotN no `jpapereira5/campaign-cotn`): tira do registo a data, o título, quem jogou (o cabeçalho `mesa` e `ausentes`) e o número global. Não perguntes o que lá está.
- **Qualquer outra sessão: pergunta sempre**, de uma vez e por perguntas interativas quando puderes:
  - a data;
  - a aventura e a parte (pt. 1, 2…), ou se é uma sessão solta;
  - quem jogou (nomes como o DM os usa; pergunta o apelido quando houver dois com o mesmo nome);
  - o que aconteceu: duas ou três frases (o essencial, como acabou, se a aventura terminou);
  - se foi gravada (pasta em `session_records/`) e se foi presencial ou online.
- **O número global** é o seguinte ao último do índice; confirma-o com o DM quando houver dúvida (uma sessão que ele mestrou e não te disse).
- Nunca inventes: o que o DM não souber fica «por confirmar».

## Como atualizar

1. Na Drive, procura os dois documentos na pasta `tabletop` (`search_files`, `parentId = '1hoQLO1o3vX1zaTqdWqJmHqrGKAu8zLqE'`) e descarrega-os em Markdown (`download_file_content` com `exportMimeType: text/markdown`; o conteúdo vem em base64). A exportação escapa alguns caracteres (`\#`, `\.`, `\)`, `\~`): tira as barras antes de editar.
2. **«Índice de sessões»:** acrescenta a linha da sessão na tabela da secção certa (com a mesa e uma nota curta do que aconteceu), atualiza os totais da primeira tabela e o «Total», as notas da aventura (as sessões de cada aventura, «terminou») e a data de «Atualizado a».
3. **«Jogadores»:** em «Quem já jogou», acrescenta a sessão a cada jogador que esteve na mesa e cria a linha de quem joga pela primeira vez; atualiza a mesa da campanha (quem entra, quem sai, desde quando), os totais, a pool de convites (quem passou de «a convidar» para «jogou») e «Atualizado a». Os «por confirmar» que o DM resolver saem.
4. **Mudanças pequenas** (uma sessão, umas linhas): edita os documentos no sítio, para o link não mudar (`update_doc` do conector Google Docs: `replaceAllText` com um texto que só exista uma vez, `insertText` e `insertTableRow`/`deleteTableRow` com os índices tirados de `read_doc`, e `requiredRevisionId` da leitura). **Mudanças grandes** (secções novas, muitas linhas): grava um Google Doc novo com o mesmo título, na mesma pasta (`create_file`, `contentMimeType: text/markdown`, sem `disableConversionToGoogleType`, para converter), confirma que as tabelas passaram (`read_doc`: o mesmo número de tabelas de antes, ou mais) e só depois manda o antigo para o lixo. Nos dois casos, confere no fim com uma exportação em texto.
5. Na conversa: uma linha por documento com o que mudou, e o que ficou por confirmar.

## Cuidados

- Os dois documentos são do DM: não apagues linhas antigas nem reescrevas o que lá está, só acrescenta e corrige o que ele confirmar.
- Só nomes e o que se passou à mesa: nada de contactos, moradas ou dados pessoais dos jogadores.
- Uma sessão mestrada por outra pessoa (o DM a jogar) não entra no índice: fica só como nota, se ele quiser.
- Se a pasta `tabletop` ou os documentos não aparecerem, não os recries do zero: diz ao DM o que falta.
