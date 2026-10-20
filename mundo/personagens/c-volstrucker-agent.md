---
id: c-volstrucker-agent
nome: Zyn'thar Veylin
tipo: npc
facoes:
  - f-cerberus-assembly
capitulos:
  - ch2
  - ch3
  - ch4
quer: Rubídio; o farol; a Jóia; discrição.
teme: Ser reconhecida em território Kryn; que a Miríade venda ao Consortium ou à Kryn.
tags:
  - dm
  - volstrucker
  - assassino
estados:
  - desde: b-2-ruins-outside-bazzoxan
    estado: entre os veteranos da patrulha, disfarçada de soldado drow
  - desde: b-3-volstrucker-investigation
    estado: "DM: em Bazzoxan a investigar o rubídio e o rumor do farol"
  - desde: b-3-volstrucker-assault
    estado: "DM: se for perseguida e morta, o selo arcano mata-a e apaga-lhe a memória; a Assembleia fica sem agente em Bazzoxan e ninguém vem buscar o caderno"
  - desde: b-3-beacon-in-barracks
    estado: "DM (se sobreviveu): sabe que o farol está no quartel; prepara o golpe"
  - desde: b-3-jewel-confrontation
    estado: (se sobreviveu) tenta roubar a Jóia em R16; foge ou é capturada
  - desde: b-3-beacon-heist
    estado: "DM (se sobreviveu): golpe ao farol: capturada, ou foge para oeste com a Miríade"
relacoes:
  - com: c-aloysia-telfan
    tipo: knows
    nota: ambos na patrulha das Ruínas da Saudade; ela recolhe rubídio à vista dele
    desde: b-2-ruins-outside-bazzoxan
    origem: mesa
  - com: c-darguun-velk
    tipo: knows
    nota: colegas de patrulha; memórias modificadas
    desde: b-2-ruins-outside-bazzoxan
    origem: mesa
  - com: c-grumak
    tipo: knows
    nota: colegas de patrulha; memórias modificadas
    desde: b-2-ruins-outside-bazzoxan
    origem: mesa
  - com: c-verin-thelyss
    tipo: enemy
    nota: 'Caderno (Rede Rubra): "considerar eliminação de Verin Thelyss caso surja oportunidade clara"'
    se: só se surgir oportunidade clara para desestabilizar a organização local
    origem: mesa
  - com: f-cerberus-assembly
    tipo: memberOf
    nota: agente Volstrucker
    origem: remix
  - com: c-aloysia-telfan
    tipo: ally
    nota: "DM: conluio para roubar a Jóia"
    desde: b-3-aloysia-offer
    origem: remix
  - com: f-myriad
    tipo: knows
    nota: "DM: paga a ponta de Bazzoxan do canal"
    origem: smuggling
  - com: f-aurora-watch
    tipo: wantsFrom
    nota: "DM: o farol guardado no quartel"
    desde: b-3-beacon-in-barracks
    origem: smuggling
  - com: c-verin-thelyss
    tipo: spiesOn
    nota: "DM: vigia o quartel e a escolta do farol"
    desde: b-3-volstrucker-investigation
    origem: smuggling
origem:
  - remix
  - zz-mesa-patches
---

## Resumo

DM: Agente Volstrucker da Assembleia de Cerebrus (Império Dwendaliano), já instalado em Bazzoxan quando os PCs chegam. Investiga o rubídio de perto (compra amostras pelo contacto da Miríade, sonda Bautha sobre a corrupção, vigia a entrada da Ascensão) e o rumor do farol do Luxon recuperado na Ascensão. Em conluio com Aloysia Telfan, é quem tenta roubar a Jóia. infiltrada como soldado drow da Vigia da Aurora: substituiu o soldado Zynthar e modificou as memórias dos aliados próximos (Operação "Rede Rubra"); se morrer, um selo arcano de morte apaga-lhe a memória. Presente na patrulha das Ruínas da Saudade, a coordenar os enfermeiros no ataque à estalagem e na emboscada para roubar um item aos PCs. infiltrado como soldado drow da Vigia da Aurora: substituiu o soldado Zynthar e modificou as memórias dos aliados próximos (Operação "Rede Rubra"); se morrer, um selo arcano de morte apaga-lhe a memória. Disfarce: drow de pele cinzento-escura quase azulada, cabelo branco comprido em rabo-de-cavalo, olhos violeta brilhante, armadura de escamas negras com insígnias prateadas da Vigia; frio e calculista, sem paciência para "turistas"; adaga curva drow ornamentada e medalhão de obsidiana em forma de lua; "contexto inicial: Ruínas da Saudade, pós-batalha na estalagem". Verdadeira identidade (ficha): Adélia Krauss, ruiva, pele pálida, olhos verde-acinzentados, cabelo preso; Wizard Assassin (Volstrucker), LE, CR 8, CA 15 (studded leather), PV 72, DES 18 INT 16; Furtividade +12, Arcana +7; Assassinate, Evasion, Shadow Step 1/resto (9 m em escuridão), Arcane Conditioning (resistência psíquica), Cunning Action; magia INT CD 14: minor illusion, mage hand, message; shield, disguise self, silent image, command; hold person, mirror image, misty step; counterspell, fear; modify memory ("para jogar as cartas"). Arcane Dagger +8 (1d4+5 + 2d6 psíquico; CON CD 15 ou envenenado), Shadow Bolt +6 (3d8 psíquico), Sneak Attack 7d6, Shadow Needle (bónus, recarga 5–6: SAB CD 14, 3d6 psíquico e incapacitado), Pain Rebound (reação). Equipamento: máscara Volstrucker, tinta arcana (1 página), venenos, kit de disfarce, Sending Stone. "Blackthorn Protocol" (Protocolo Espinho Negro): dente falso com cápsula arcana que, mordido, liberta uma descarga psíquica que mata o portador e apaga parte da memória recente (na mesa: descarga elétrica a partir do pescoço). A página "Agente Volstrucker" guarda ainda o statblock canónico do Volstrucker Agent (EGtW p. 294, CR 7, PV 120, Shadow Network, Painful Memories, Shadow Jaunt, Painful Reprisal, modify memory) como referência.

## Objetivo

Levar rubídio e o farol para a Assembleia (esforço de guerra); a Jóia, se estiver ao alcance.

## Segredo

É a agente da Assembleia na ponta de Bazzoxan do canal da Miríade: paga o que sai da Ascensão. O conluio com Aloysia é oportunismo: o Consortium e a Assembleia querem a Jóia por razões diferentes. não é drow: é Adélia Krauss, humana ruiva, Wizard Assassin (CR 8) disfarçada; o soldado Zynthar verdadeiro foi substituído; o seu Caderno Volstrucker (b-3-caderno-volstrucker) documenta as operações desde a iniciação com Ikithon. não é drow: humano disfarçado; o soldado Zynthar verdadeiro foi substituído; o seu Caderno Volstrucker (b-3-caderno-volstrucker) documenta as operações desde a iniciação com Ikithon. DM: o nome verdadeiro é Adélia Krauss (humana, ruiva).
