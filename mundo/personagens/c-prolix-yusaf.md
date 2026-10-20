---
id: c-prolix-yusaf
nome: Prolix Yusaf
tipo: npc
facoes:
  - f-allegiance
casa: l-ready-room
capitulos:
  - ch3
  - ch4
quer: A caixa-puzzle e o seu conteúdo; que os PCs descubram e travem o plano de Aloysia (oferece 200 gp mais a caixa); levar a Jóia e os PCs ao Crystal Chateau.
teme: Que Aloysia chegue primeiro ao que procura; ser descoberto por Verin, que já desconfia dele.
tags:
  - investigador
  - allegiance
  - espião
  - ank-harel
estados:
  - desde: b-3-estalagem-soldado-caido
    estado: junta-se à mesa a investigar Aloysia; paga 100 po adiantados
  - desde: b-3-crematorium-prolix
    estado: oferece 200 gp + a caixa para travarem Aloysia; esboça a Jóia. fica com a caixa-puzzle do vrock (com scroll de Bestow Curse)
  - desde: b-3-next-steps-ank-harel
    estado: teleporta-se para Ank'Harel com Question e, se quiserem, com os PCs
  - desde: b-4-choose-faction
    estado: recrutador da Allegiance em Ank'Harel (missão Life Dome); mais tarde incriminado
relacoes:
  - com: c-aloysia-telfan
    tipo: spiesOn
    nota: enviado pela Allegiance para vigiar a agente do Consortium
    origem: livro
  - com: f-allegiance
    tipo: memberOf
    nota: agente académico do Crystal Chateau
    origem: livro
  - com: c-question
    tipo: knows
    nota: debateram a história da Calamity; combinam voltar juntos a Ank'Harel
    origem: livro
  - com: c-bautha-dyrr
    tipo: knows
    nota: paciente da enfermaria
    origem: livro
  - com: f-rivals
    tipo: wantsFrom
    nota: pode contratá-los para travar Aloysia se os PCs recusarem
    se: se os PCs recusarem a oferta de Prolix
    origem: livro
  - com: c-khime
    tipo: ally
    nota: amigos; Khime ajuda a limpar-lhe o nome
    origem: livro
origem:
  - livro
  - mesa
---

## Resumo

Tiefling leal e neutro, arqueólogo do Crystal Chateau e agente académico da Allegiance of Allsight (emblema: um pergaminho com um olho vigilante). Aparece no crematório a reclamar a caixa-puzzle de ónix retirada do vrock. junta-se à mesa da estalagem a investigar Aloysia; pede ajuda a investigar corpos no crematório; do estômago do vrock saem a caixa-puzzle e um scroll de Bestow Curse, e Prolix fica com a caixa; paga 100 po adiantados para os PCs investigarem Aloysia; a pessoa que procura já saiu da Ascensão. Além do Scholarly Excavator do livro, ficha alternativa "Scholarly Agent" (LN): PV 45, CA 12, INT 16; Arcana, História, Investigação e Religião +5; Comum, Orc, Dracónico; cajado +3; detect magic, identify, mage hand, comprehend languages, dispel magic (2/dia cada). Nervoso, tagarela, genuinamente curioso; quer provar o seu valor académico mas detesta o perigo; medalhão da Allsight (olho sobre pergaminho). A ficha alternativa antiga descreve-o como "orc jovem de olhos claros, sempre coberto de tinta e pó" (DM: mantém-se tiefling, como no livro) (o livro diz tiefling). Nota do DM: "voz mais lenta, suspeito?". Sabe que o rubídio parece relacionado com ruínas da Calamidade; quer chegar à informação antes de Aloysia e regressar a Ank'Harel com o crédito; no futuro pode oferecer missões para limpar o nome da Aliança e expor infiltradores.

## Objetivo

Missão real: espiar Aloysia Telfan, agente rival do Consortium, e descobrir o que ela procura no Rise. História de cobertura: ajudar os arcanistas da Aurora Watch a selar o rift.

## Segredo

Foi enviado pela Allegiance para espiar o Consortium; a Allegiance descobriu ruidium em Cael Morrow primeiro e quis mantê-lo secreto.
