---
id: c-bolbara
nome: Bol'bara
tipo: npc
facoes: []
casa: l-urzin
capitulos:
  - ch0
quer: Que os ritos sejam retomados; que a sua aldeia a proteja.
teme: Perder a mente para Trush; ser o instrumento da destruição de Urzin.
tags:
  - vítima
  - seer
  - warlock
  - goblin
  - mesa
estados:
  - desde: b-0-mission-urzin
    estado: Raptada; acorrentada ao altar da capela V6; possessão em curso
  - desde: b-0-chapel
    estado: Torturada e revivificada por Pellinost; à terceira, a mente quebra
  - desde: b-0-exorcism
    estado: Possuída por Trush (combate); a 0 HP e curada em 3 rondas volta a si
  - desde: b-0-bolbara-unleashed
    estado: Possuída e à solta; ameaça regional a caminho de Urzin
  - desde: b-0-return-to-urzin
    estado: Salva e grata (ou morta/perdida se os PCs falharam); seer que pode reaparecer
relacoes:
  - com: c-trush
    tipo: serves
    nota: patrono warlock; a possuí-la sem os ritos
    ate: b-0-return-to-urzin
    origem: livro
  - com: c-elder-colbu-kaz
    tipo: loves
    nota: caso de juventude; Coblu-Kaz é ex-amante de Bolbara
    origem: mesa
  - com: c-mossback-steward
    tipo: knows
    nota: '"uma vez encontrei-o, ou melhor, foi ele que me encontrou a mim"; foi ele que lhe contou a lenda dos goblins'
    origem: mesa
  - com: c-melora
    tipo: serves
    nota: invoca Melora no Templo das Cinzas ("guardiã das raízes, escutai a vossa filha") para ouvir o que o cristal é
    desde: b-0-bolbara-legend
    origem: mesa
legenda: xamã goblin de Urzin
atitudeAtual: por-conhecer
origem:
  - livro
  - mesa
  - zz-mesa-patches
---

## Resumo

Goblin anciã, seer e warlock de Urzin (CG; CE quando possuída). Raptada por soldados imperiais durante os ritos junto da Ritual Stone; com os ritos interrompidos, o seu patrono Trush começa a possuí-la. CR 3; possuída ganha ações lendárias (Incorporeal Dash, Zone of Calamity). Warlock de "Trushche" (grafia da mesa) e líder espiritual de Urzin; CG, potencialmente instável sob a influência do patrono. Goblin velha de pele verde-acinzentada tatuada com símbolos goblinóides e espirais negras; trapos, colares de dentes, penas e vidro colorido no cabelo entrançado; olhos com um brilho inquieto e inteligente, "de quem já falou com coisas que não devia"; bengala de osso retorcido com um favo de mel ressequido na ponta. Em transe fala com vozes que não são dela; dizem que Trushche lhe sussurra diretamente. A mesa (sessão 1, #81, 2026-09-02): Bufal e Jevan chamam-lhe apenas «a xamã» ou «a nossa xamã». Litcha guarda no Templo das Cinzas o colar de grandes conchas brancas que ela usa em rituais e cerimónias — conchas antigas, «com vidas de história», que ao Isco (Perception 15) cheiram a suor goblinóide, a velho e a um leve travo de maresia; agora está com o Isco para lhe seguir o cheiro. Segundo Litcha foi buscar ingredientes «que só existem no pântano», e Morgid apontou no mapa o obelisco (Ritual Stone). Pronunciada Bolbara/«Bulbara» à mesa. A mesa (sessão 5, #88, 2026-10-07): Aparece no livro de registos do escriba imperial, sem nome: uma goblin velha capturada há pouco, levada ao PADRE PERESTRELO e sob estudo. O resto disse-o o Damião ao Quasi, na conversa (não está no livro): está na capela do Forte Ventura, «ele não a deixa morrer» e «parece que ela ainda não disse a palavra certa; não sei o que é que ela está à procura». É a primeira confirmação, para o grupo, de que a xamã que o Bufal os mandou resgatar está viva e no forte.

A mesa (sessão 7, #90, 2026-10-21): VISTA DUAS VEZES, sem nome nenhum dito. (1) Na visão do Quasi, quando encosta a máscara à mão de pedra do menir: uma criatura pequenina, meio esverdeada, de vestes feitas de remendos de várias roupas diferentes, COMPLETAMENTE ENSANGUENTADA DO PESCOÇO PARA BAIXO, com cabelos grisalhos colados à cabeça, a caminhar impávida na direção dele debaixo de relâmpagos sem nuvem (um racha uma árvore ao meio a dez metros; outro põe um arbusto a arder). Um riso que não vem dela — vem de todo o lado ao mesmo tempo — e palavras muito guturais numa língua que ele não identifica. Da cara saem duas colunas de fumo: nos olhos não há branco, há espaço negro. De perto é cheia de rugas, com mais anos do que a longevidade de um goblin, e abre um sorriso; os olhos abrem-se de todo, aparecem duas pupilas, e ela sussurra uma palavra — na transcrição ouve-se «Mãe» (a preparação tinha «Melora…»: por confirmar). Depois os olhos fecham-se e o riso passa a vir dela. (2) No sonho da Lia, CRIANÇA: uma goblin de seis ou sete anos, de nariz a escorrer, que mostra ao «Tio Rutz» uma rã verde morta apanhada no pântano, é levantada ao céu por ele e recebe a promessa de que um dia conseguirá uma concha branca como a dele; sai a correr a gritar «vou apanhar mais quatro! Ou cinco? Qual é o número que vem depois do cinco?». É ali que o nome dela é dito: «Bolbara».

Na visão do Quasi tinha **uma concha branca ao peito** (retcon, Decidido pelo DM (2026-10-22)); o DM di-lo na abertura da S8.

## Objetivo

Sobreviver e voltar a Urzin; manter Trush à distância.

## Segredo

O seu patrono é um demónio-sombra do Shadowfell que só os ritos comunais mantinham controlado.

**O tio Rutz.** Em criança, num Urzin antigo, tinha um tio hobgoblin, o Rutz (`c-rutz`), que lhe pegava ao colo. No sonho da Lia ela grita-lhe o nome em voz alta, «Tio Rutz!», e a mesa pode usá-lo ao falar com ela no presente. (Decidido pelo DM (2026-10-21))
