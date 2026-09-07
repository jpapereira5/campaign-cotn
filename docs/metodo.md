# Método: organizar enredos concorrentes como a Larian, na mesa

Este documento explica o modelo por trás da app e como o usar para preparar *Call of the Netherdeep* (CotN) com um prólogo *Unwelcome Spirits*. Nomes próprios ficam em inglês, como no livro.

## 1. O que a Larian fez em Baldur's Gate 3 (e o que se pode copiar)

1. **Teia de aranha, não árvore.** Adam Smith (writing director) descreveu a narrativa como uma teia: o fim do jogo é o centro, o início é a borda; todas as linhas convergem no mesmo ponto e o que muda é o *estado* com que se lá chega. Ramificar sem nunca voltar ao tronco é o erro a evitar.
2. **Reactividade em vez de mundos paralelos.** Não é "o mundo muda com cada escolha"; é "as personagens reagem a cada escolha". O que se rastreia são **flags** (o que os PCs fizeram e souberam) e cada NPC tem reacções condicionadas.
3. **Um vilão por acto, todos a servir o mesmo fim.** Minthara/culto (Acto 1), Ketheric (Acto 2), Gortash + Orin (Acto 3) são os Escolhidos dos Três Mortos; as três Netherstones obrigam a resolver os três para chegar ao Netherbrain. Cada acto tem um hub e um clímax obrigatório.
4. **Cada arco pessoal está preso a um vilão ou a uma peça do enredo principal.** Karlach → Gortash; Wyll → Mizora/Gortash; Shadowheart → Shar/Ketheric; Lae'zel → Vlaakith/Orpheus; Gale → Mystra/Coroa de Karsus; Astarion → Cazador. Nenhum arco pessoal é "side quest": resolvê-lo muda o estado do clímax.
5. **Um escritor por companheiro** e folhas de cálculo exaustivas de ramificações; a pergunta de trabalho de cada beat é "*what if this event plays out differently?*" (Vladimir Gaidenko). O mapa de ramificações, visto de longe, "parecia um cérebro".
6. **Ritmo pelo descanso.** As cenas de acampamento disparam por flags + tempo, separando "o que aconteceu" de "quando o NPC reage".
7. **Aprovação como medidor.** Cada companheiro tem uma escala que as acções movem; CotN usa o mesmo mecanismo com os rivais (hostil / indiferente / amigável).

**Tradução para a mesa:** flags + reacções condicionadas = *lista de revelações* + *estado dos NPCs*. A app modela exactamente isto: NPCs com estado e atitude, beats ordenados no tempo, revelações que os beats disparam, um ponto de convergência, e por cada PC os beats que tocam as suas ambições.

## 2. Técnicas de mesa que mapeiam para o mesmo problema

- **Revelation lists e regra das três pistas** (Justin Alexander, *The Alexandrian*): cada conclusão necessária tem ≥3 pistas em cenas diferentes. É a versão de mesa das flags. O *Remixing Call of the Netherdeep* dá duas listas prontas: *Campaign Agendas* e *Lore of Alyxian* — estão em `data/revelations/`.
- **Node-based design**: cenas são nós ligados por pistas, não uma sequência; é isso que deixa os enredos cruzarem-se.
- **Fronts e grim portents** (Dungeon World): cada facção/vilão tem uma sequência de portentos que avança se os PCs não intervierem. É a dimensão temporal de cada enredo concorrente. Vista "Frentes".
- **Relationship map** (DramaSystem/Hillfolk): quem quer o quê de quem. Vista "Grafo".
- **Secrets & clues** (Lazy DM): 10 segredos soltos por sessão, reveláveis em qualquer nó.
- **Ambições como motores**: cada PC declara 1-3 ambições; cada ambição liga-se a ≥1 NPC que a pode satisfazer ou negar, ≥1 facção/arco e ≥1 beat por capítulo. Vista "PCs" mostra os buracos.

## 3. As pistas concorrentes de CotN e o centro da teia

**Centro = Heart of Despair.** Todas as pistas terminam na mesma pergunta: matar, libertar ou redimir Alyxian. O que muda é o estado com que se chega: quem tem a Jewel, atitude dos rivais, facção dos PCs, quem está corrompido por ruidium, quantos Fragments of Suffering e quantas "placações" no Netherdeep.

Pistas (lanes na linha temporal):
- **Prólogo — Unwelcome Spirits**: Urzin → Brokenveil Marsh → Fort Venture → exorcismo de Bol'bara (relógio de 3 dias). Fios para CotN: Kryn vs Império, Xhorhas, operativos Kryn reparam nos PCs.
- **A Jewel of Three Prayers**: Dormant (Emerald Grotto, E12) → Awakened (Betrayers' Rise, R16) → Exalted (Temple of the Arch Heart, M9) → abre o rift e N22a.
- **Lore de Alyxian**: puxar as 20 visões do Netherdeep para trás — murais no Grotto, Betrayers' Rise, Question's sketchbook, Olara, Hadarai, M10 — para que os jogadores tenham opiniões fortes e divergentes sobre Alyxian *antes* de Ank'Harel. Pré-estabelecer Perigee.
- **Ruidium**: aparece em todos os sítios do Apotheon; corrupção; tentação mecânica; três agendas (armar/vender, monopólio/estudo, destruir/selar).
- **Rivais**: cinco modos de acção (parceria / seguem os PCs / independentes / saem / roubam a Jewel) e o **Princípio da Oposição**: a atitude decide o *tom* do desacordo (negociação agressiva / debate / discussão), não a opinião. Se não há forma de os rivais discordarem numa secção, os PCs não têm informação suficiente para ter opinião.
- **Allegiance of Allsight / Consortium of the Vermilion Dream / Cobalt Soul**: cada uma com um investigador em Bazzoxan que é a "cara" da facção (Prolix / Aloysia / Question); missões como competição entre facções; controlo territorial de Cael Morrow; as sextas missões da Aliança e do Consórcio são impossíveis por desenho, só a da Cobalt Soul se ganha.
- **Sentinels of Memory**: Lymmle Wist infiltrada na Aliança (emboscada no Life Dome, Prolix incriminado, assassinos).
- **Ambições de cada PC**: uma lane por PC, criada na app.

## 4. Como preparar com a app

1. **Antes da campanha**: cria os PCs na vista "PCs"; escreve 1-3 ambições por PC e liga cada uma a NPCs, arcos e beats. Corrige os avisos de "capítulo sem cena pessoal". Ganchos prontos: rivalidade com um rival; parentesco/dívida em Jigow; Kryn/Aurora Watch; ambição académica (Aliança), oculta (Consórcio) ou de justiça (Cobalt Soul); tentação do ruidium; ligação a Sehanine/Avandra/Corellon; um "Perigee" pessoal.
2. **Por sessão**: na vista "Sessão" vê "o que vem a seguir por pista"; escolhe 2-4 beats de pistas diferentes (um do principal, um dos rivais, um de facção, um pessoal) e 3-5 pistas de revelações a semear. Depois da sessão marca beats jogados, revelações percebidas, atitudes dos rivais e portentos que avançaram.
3. **Entre capítulos**: na vista "Frentes" avança os portentos das facções que os PCs ignoraram; no "Grafo" com o cursor no capítulo actual vê que relações estão activas e onde há NPCs isolados; na "Linha temporal" em modo "jogado" vê a teia a fechar-se.
4. **Amigos e inimigos rastreados, não pré-escritos**: regista (flags, atitudes, notas) qual investigador os PCs ajudaram/traíram em Bazzoxan; esse torna-se o vilão emergente que tenta roubar a Jewel; a facção dos rivais é a oposta à dos PCs e torna-se o encontro proactivo em Ank'Harel.

## 5. Templates

**Ambição de PC**
- Texto: "quer …"
- NPC que pode satisfazer: … · NPC que pode negar: …
- Arco onde vive: …
- Beat por capítulo onde é tocada: ch1 … · ch3 … · ch4 … · ch7 …
- Custo se falhar: …

**Front (facção)**
- Agenda (o que quer) · cara pública (como parece) · líderes
- Portentos: ch3 … → ch4 … → ch5 … → ch6 … → ch7 …
- O que os PCs podem fazer para travar cada portento

**Revelação**
- Conclusão que os jogadores devem tirar
- Pista 1 (beat) · Pista 2 (beat) · Pista 3 (beat)
- Como saber que a perceberam (flag)

## 6. Fontes

- Adam Smith sobre a "spiderweb" (GamesRadar, Push Square, 2023); Vladimir Gaidenko, DevGAMM (Gamereactor); "a whole brain" (TheGamer); "weird Dungeon Masters" (PC Gamer); Swen Vincke, GDC 2024 (GamesBeat).
- Justin Alexander, *Remixing Call of the Netherdeep*, *Node-Based Scenario Design*, *Three Clue Rule*, *Revelation Lists* (thealexandrian.net).
- Dungeon World, *Fronts*; Robin D. Laws, *Hillfolk / DramaSystem* (relationship maps); Sly Flourish, *Return of the Lazy Dungeon Master*.
- *Critical Role: Call of the Netherdeep* (Darrington Press / Wizards, 2022); *Explorer's Guide to Wildemount* (2020), "Unwelcome Spirits".

<!-- RASCUNHO para docs/metodo.md — bloco D. AVISO: o método "Mass Effect" e o esquema A/B/C da "Campanha DND 2025" NÃO foram encontrados no campanha.md nem nos relatórios/sessões do scratchpad (grep "Mass Effect", "plot", "binári", "2025"); o texto abaixo segue o enunciado recebido e deve ser confirmado com o DM antes de entrar no repo. -->

## 2a. O método "Mass Effect" (DM, campanha anterior)

Na campanha anterior o DM organizou o enredo à maneira de *Mass Effect*: **três plots paralelos (A, B, C)** que avançam em simultâneo, e nos pontos de decisão **escolhas binárias sem opção ideal** — cada lado custa algo e os jogadores têm de escolher na mesma. As consequências não se anunciam: são **lembradas** mais tarde por cartas, notícias que chegam à taberna e NPCs que reaparecem com a memória do que os PCs fizeram. É a mesma lógica das *flags* + reacções condicionadas da secção 1: o que se rastreia é a escolha, e quem a devolve é o mundo.

## 2b. O esquema A/B/C da campanha 2025

- **Plot A — a origem do rubídio.** A pergunta de fundo: descobrir de onde vem e decidir se se **usa na guerra** (Dinastia/Império/facções que o querem armar) ou se se **acaba com ele para curar** (Ushru, quem sofre da corrupção). Sem opção limpa: usar corrompe, acabar desarma.
- **Plot B — salvar Alyxian.** Ao chegar ao Netherdeep: **libertar**, **redimir** ou **matar** — os três finais do livro, mas com o custo de cada um visível desde cedo pelas visões e pelos rivais (Princípio da Oposição).
- **Plot C — os locais.** A sequência de sítios (Urzin → Jigau → Bazzoxan → Ascensão → Ank'Harel → Cael Morrow → Netherdeep) é o relógio: cada local fecha uma janela de escolha de A ou B.

**Como encaixa na app.** A e B são as duas frentes principais (`a-ruidium`, `a-main`); os portentos de cada frente são as consequências que o mundo "lembra" (carta, notícia, NPC) quando os PCs escolhem um lado. C dá a ordem dos beats e o momento de convergência. A regra das três pistas aplica-se às **escolhas**, não só às conclusões: antes de cada binário de A ou B os PCs devem ter tido, em cenas diferentes, pelo menos três pistas sobre o que cada lado custa — senão a escolha não é uma escolha, é uma moeda ao ar.
