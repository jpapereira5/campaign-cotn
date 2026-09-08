# Convenções de ids e elenco partilhado

Ids em kebab-case ASCII (sem acentos/apóstrofos). Prefixos: `c-` personagem, `f-` facção, `l-` local, `b-<cap>-` beat, `r-` revelação, `a-` arco, `amb-` ambição. Capítulos: `ch0` (prólogo) … `ch7`.

## Duas camadas

- `data/book/` — **o livro, tal como escrito**: referência. Não se edita (nem na app nem à mão), a não ser para corrigir erros de extracção.
- `data/campaign/` — **a nossa campanha**: o que muda face ao livro. Aplica-se por cima de `book`:
  - entrada com uma `id` que existe no livro → **patch**: só os campos presentes substituem os do livro (arrays substituem por inteiro);
  - `{ "id": "…", "_remove": true }` → a entrada do livro **desaparece** da campanha;
  - `id` nova → **acrescento**;
  - relações: `{ "from", "to", "type", "_remove": true }` esconde a relação do livro; sem `_remove` acrescenta.
- Ficheiros: cada colecção é uma pasta com vários JSON (arrays) que se juntam: `data/book/characters/ch1-2.json`, `data/campaign/beats/ch3.json`, etc. O que se cria na app vai para `data/campaign/<colecção>/dm.json`. `data/book/campaign.json` e `data/book/arcs.json` têm equivalentes opcionais em `data/campaign/`.
- Validar: `npm run validate` (livro + campanha) ou `npm run validate -- --book` (só o livro).

As notas de DM com conselhos do Remix estão em `data/campaign/beats/remix-notes.json` (no livro esses beats têm `notes: ""`); as alterações estruturais adoptadas do Remix e as do DM estão em `data/campaign/*/remix.json`. Regras próprias: `docs/regras.md`.

Na app: "Ver: a nossa campanha / só o livro"; ✚ = acrescentado na campanha, ▲ = alterado face ao livro; o painel de detalhe mostra o original do livro e permite repor.

## Capítulos
`ch0` Unwelcome Spirits · `ch1` A Fateful Competition · `ch2` The Leave-Taking · `ch3` Bazzoxan · `ch4` The Jewel of Hope · `ch5` The Drowned City · `ch6` The Netherdeep · `ch7` The Heart of Despair · **`ch8` Acto 4: O Ano de Ruidus** (camada campanha, só no pior final)

`data/campaign/campaign.json` pode listar só os capítulos novos ou alterados: os capítulos juntam-se por id (patch dos existentes, acrescento dos novos, `_remove` para tirar).

## Arcos
`a-prologue` `a-main` `a-lore` `a-ruidium` `a-rivals` `a-kryn` `a-allegiance` `a-consortium` `a-cobalt` `a-sentinels` · campanha: `a-ruidus-year` (Acto 4) `a-jmon` (J'mon Sa Ord) `a-myriad` (contrabando de ruidium) `a-cerberus` (Cerberus Assembly)

## Facções
`f-kryn` Kryn Dynasty · `f-aurora-watch` Aurora Watch · `f-jigow-elders` Conselho de Anciãos de Jigow · `f-luxon` Fé do Luxon · `f-allegiance` Allegiance of Allsight · `f-consortium` Consortium of the Vermilion Dream · `f-cobalt-soul` Library of the Cobalt Soul · `f-sentinels` Sentinels of Memory · `f-hands-of-ord` Hands of Ord · `f-scarbearers` Scarbearers · `f-veil` The Veil · `f-rivals` A companhia dos rivais (na campanha: "Os Bons Demais", nome da mesa Crocudos) · `f-dwendalian-empire` Império Dwendaliano · `f-road-raiders` Road Raiders · `f-prime-deities` Prime Deities · `f-betrayer-gods` Betrayer Gods · campanha: `f-cerulean-palace` (J'mon Sa Ord, Gemeshega) `f-apotheon-cult` (adoradores do Apotheon) `f-cerberus-assembly` (Volstruckers; recebe ruidium pelo Myriad; beacon) `f-myriad` (The Myriad: canal de contrabando Bazzoxan → Jigow → Urzin → Império)

Os **portentos** (fronts) de todas as facções vivem em `data/campaign/factions/portents.json` (síntese aprovada pelo DM, não texto do livro); no livro as facções têm `portents: []`.

## Personagens recorrentes (usar exactamente estes ids)
Rivais: `c-ayo-jabe` `c-dermot-wurder` `c-galsariad-ardyth` `c-irvan-wastewalker` `c-maggie-keeneyes`
Alyxian: `c-alyxian` (o Apotheon; as formas do cap. 7 são estados) · `c-theo-nathope` · `c-alyxian-hunter` · `c-alyxian-aboleth` · `c-perigee`
Jigow: `c-elder-ushru` `c-elder-colbu-kaz` `c-durth-mirimm` `c-maryl-bronzefang`
Estrada: `c-justice` `c-six-knives` `c-tyvak` `c-moghra` `c-kierchaly-wastewalker` `c-gaeya-iliera`
Bazzoxan: `c-verin-thelyss` `c-prolix-yusaf` `c-aloysia-telfan` `c-question` `c-bautha-dyrr` `c-foghome` `c-naevyn-tasithar` `c-kalym-telaarin` `c-reynard-allerton` `c-sebastian-allerton`
Ank'Harel: `c-jmon-sa-ord` `c-james-cryon` `c-gryz-alakritos` `c-lymmle-wist` `c-galeokaerda` `c-insight-acuere` `c-scribble` `c-xot` `c-carliale-kroogan` `c-jor-raashid` `c-khime` `c-kareema` `c-hakzorne` `c-aradrine` `c-vrill` `c-khelkur` `c-dendarron` `c-larthul` `c-satzrak` `c-shira` `c-ashann` `c-jamil-aalithiya` `c-iwo-zalarre` `c-watcher-trast` `c-watcher-byron` `c-ironhand-sem` `c-adima-shemsilver` `c-nedosi-anay` `c-koris` `c-old-man-kruuk` `c-laurin-ophidas` `c-amkezne` `c-rerosha`
Cael Morrow: `c-olara` `c-hadarai` `c-beltreath` `c-library-ghosts`
Visões: `c-alyxian-parents` `c-saqiri` `c-kalagothe` `c-zenthas-family` `c-talmyth`
Divindades (`kind: deity`): `c-sehanine` `c-avandra` `c-corellon` `c-gruumsh` `c-torog` `c-lolth` `c-tharizdun` `c-melora` `c-the-luxon` `c-ioun` `c-vesh`
Campanha: `c-finalist-team` (a outra equipa finalista: "Punhos de Ferro e Fogo", Crocudos) `c-volstrucker-agent` (agente Volstrucker: ruidium, beacon, Jóia) · Myriad (sem nome): `c-nevoa-vendor` (Névoa do Brejo, Urzin) `c-myriad-traveller` (Urzin) `c-myriad-jigow-fence` (Jigow) `c-myriad-couriers` (estrada, grupo) `c-myriad-bazzoxan-contact` (Ready Room)
Prólogo: `c-buhfal` `c-bolbara` `c-trush` `c-morgid` `c-pellinost` `c-felmont` `c-alonne-frith` `c-skra-sorsk` `c-mossback-steward`

## Locais principais
`l-urzin` `l-brokenveil-marsh` `l-fort-venture` · `l-jigow` `l-emerald-grotto` `l-prayer-site-sehanine` · `l-xhorhas-road` `l-caravan-stop` · `l-bazzoxan` `l-betrayers-rise` `l-prayer-site-avandra` · `l-ank-harel` `l-crystal-chateau` `l-first-eclipse` `l-temple-of-the-mentor` `l-suncut-bazaar` `l-life-dome` `l-maw-of-cael-morrow` · `l-cael-morrow` `l-temple-of-the-arch-heart` `l-rift` · `l-netherdeep` `l-grottoes-of-regret` `l-vents-of-fury` `l-chasm-of-yearning` `l-heart-of-despair` · campanha: `l-ruins-of-sorrow` (fan-made, Reddit; filho de `l-barbed-fields`) `l-nevoa-do-brejo` (loja de ervas em Urzin, da mesa)

## Beats-âncora (referenciados por vários ficheiros)
`b-0-return-to-urzin` · `b-1-jewel-vision` (E12, Jóia Dormant) · `b-2-ushru-dawn` · `b-2-jewel-theft` · `b-3-mouthers` · `b-3-prayer-site-avandra` (R16, Awakened) · `b-3-jewel-confrontation` · `b-4-choose-faction` · `b-5-temple-arch-heart` (M9, Exalted) · `b-5-open-rift` · `b-6-theo-and-hunter` · `b-6-rivals-n26` · `b-7-alyxian-speaks` (convergência) · `b-7-ending-worst` `b-7-ending-neutral` `b-7-ending-best` · campanha (Remix / DM): `b-1-festival-seeds` `b-1-scarlet-fever` `b-1-grotto-ruidium` `b-1-jigow-research` `b-2-ruins-outside-bazzoxan` (Ruins of Sorrow) `b-2-vision-perigee-death` `b-3-researchers-in-town` `b-3-bazzoxan-research` `b-3-rise-entrances` `b-4-faction-competition` `b-4-entering-cael-morrow` `b-5-pointcrawl` · campanha (Myriad / Assembly): `b-0-nevoa-do-brejo` `b-1-myriad-jigow` `b-2-myriad-on-the-road` `b-3-beacon-rumour` `b-3-volstrucker-investigation` `b-3-myriad-bazzoxan` `b-3-beacon-in-barracks` `b-3-beacon-heist` · campanha (Acto 4): `b-4-gemeshega-audience` `b-5-palace-reacts` `b-7-ruidus-night` `b-7-chamber-of-judgment` `b-8-year-of-ruidus` `b-8-path-pilgrimage` `b-8-path-army` `b-8-path-betrayers` `b-8-cult-of-the-apotheon` `b-8-final-confrontation` `b-8-aftermath`

## Revelações (ids definitivos — só estes; quem escreve beats referencia-os em `reveals`)
- **Campaign Agendas**: `r-jewel-properties` `r-jewel-three-prayers` `r-shrines` `r-jewel-reactivate` `r-ruidium-properties` `r-ruidium-apotheon-sites` `r-faction-agendas`
- **Lore of Alyxian**: `r-alyxian-ruidus-birth` `r-alyxian-bad-luck` `r-alyxian-three-prayers` `r-alyxian-gruumsh` `r-netherdeep-prison` `r-netherdeep-leaking` `r-perigee` `r-alyxian-wants-remembered` `r-alyxian-split-self`
- **Navegação**: `r-go-to-bazzoxan` `r-cyst-of-avandra` `r-go-to-ank-harel` `r-cael-morrow-entrance` `r-rift-location` `r-rift-key`
- **Facções**: `r-lymmle-traitor` `r-galeokaerda-spy` `r-aboleth-not-alyxian` `r-cryon-vs-alakritos` `r-consortium-funds-sentinels` `r-sixth-missions-doomed`
- **Prólogo**: `r-bolbara-possessed` `r-how-to-save-bolbara` `r-kryn-vs-empire`
- **Campanha (Acto 4)**: `r-jmon-authorized-dig` `r-jmon-will-rise`
- **Campanha (Remix / DM)**: `r-scarlet-fever` `r-ruidium-history` (lista "Ruidium")
- **Campanha (Contrabando)**: `r-myriad-route` `r-assembly-buys-ruidium` `r-beacon-in-barracks`

## Camada Crocudos (campanha anterior do DM)
Material jogado/preparado na campanha "Crocudos" (2025–2026, mesma aventura, outro grupo). Ficheiros: `data/campaign/*/crocudos.json` (acrescentos e patches ao livro), `data/campaign/*/zz-crocudos-patches.json` (patches a entidades já alteradas na campanha; carregam no fim), `data/campaign/*/crocudos-names.json` (nomes em português da mesa; o original fica no livro). Texto marcado "Crocudos:" / "Crocudos (S12):" com a sessão. Handouts em `docs/handouts.md`; regras em `docs/regras.md`; lore geral em `docs/lore.md`. Fora, por decisão do DM: culto do dragão, Jack Sparrou e tudo o que estava preso aos PCs antigos.

**Decisões do DM sobre os conflitos entre fontes** (doc Campanha vs Notion vs sessões): Zyn'thar Veylin é **Adélia Krauss** (Wizard Assassin, humana ruiva; sem segundo agente para o caderno) · filha de Fritz = **Elisabete** · Prolix = **tiefling** · à chegada a Bazzoxan **Grash Korr'thak é devorado** pelos mouthers e **Urza Vokh combate ao lado dos PCs** · dragão do iceberg = **Gelidon, ancient** · regras: marcas na alma no long rest, exposição prolongada, Grito com Wisdom save por exaustão, Ecos = 1 + exaustão, Jóia + suude · rival = **Ivo Cinza-Viva** (Notion: "Ivo dos Desterros") · Nara Sol já investiga o rubídio; Trinca-Rabos leva 6 passageiros · Olomão Quebra-Sol, Maggie Olho-Atento, Dhurak Pé-Reto, Vazia é uma pessoa.
- **Personagens novos** (80): `c-olomao-quebra-sol` `c-rinkat-ticao-baixo` `c-nisla-asa-curta` `c-valir-torran` `c-litcha-das-cinzas` `c-kalmuk-parte-po` `c-karuk-pedra-dura` `c-mekik` `c-mugra-maos-quentes` `c-skirr` `c-rikka-tres-dentes` `c-durg-mao-mole` `c-rogna-erva-rara` `c-krivga-pele-seca` `c-druida-cego-do-pantano` `c-dhurak-pe-reto` `c-tripulacao-passo-lento` `c-nessa-brilho-leve` `c-korrem-olha-ruina` `c-isha-sem-vela` `c-relk-po-dagua` `c-zhayra-racha-pedra` `c-filha-de-korrem` `c-velnari-zeth` `c-kren-vorith` `c-yezek-miruun` `c-sarna-kul` `c-nibuk` `c-os-orelhudos` `c-nippi-dente-largo` `c-bruno-massapao` `c-rafael-e-samara-rosbife` `c-regimia-rosbife` `c-verema-brisa-mansa` `c-zinka` `c-tia-mukka-zetek` `c-kolgar-gurt` `c-nossil-sete-rumos` `c-yalla-gancho-torto` `c-belk-bate-ripa` `c-tapa-meia-vela` `c-trinte-tres-talheres` `c-rabbak-quebra-tabua` `c-grakka-maos-de-corda` `c-rombek-terra-firme` `c-durahk-braco-de-ferro` `c-shonna-olho-de-cinza` `c-grok-e-verran` `c-ze-e-felix` `c-keyeki` `c-chekka-falha-remos` `c-nok-nok-racha-dentes` `c-bukka-sem-medo` `c-grelka-dente-largo` `c-kiri-kiri-da-vela-alta` `c-susana-deep-scion` `c-aboleth-do-mar` `c-dragao-branco-adulto` `c-gigante-da-tempestade` `c-culto-esquecido` `c-darguun-velk` `c-grumak` `c-kael-rhun` `c-lirien-solva` `c-rolo-wellington` `c-vazia` `c-gruusk` `c-karesh-asa-rubra` `c-nara-sol` `c-talan-velyar` `c-vorzen` `c-vorrim` `c-levir` `c-murmuradores` `c-ornessa-tia-vurk` `c-urza-vokh` `c-grash-korrthak` `c-duasad-keef` `c-sulo` `c-nela`
- **Locais novos** (41): `l-trapo-e-ticao` `l-pombal-ninho-de-lama` `l-templo-luxon-urzin` `l-templo-das-cinzas` `l-ferreiro-pedra-dura` `l-bugigangas-de-mekik` `l-casco-fumegante` `l-carapaca-estalada` `l-raiz-da-sorte` `l-mantimentos-ate-ao-osso` `l-passo-lento` `l-kalai-ruins` `l-clan-cinza-viva-camp` `l-jigau-molho` `l-jigau-aguas-da-carne` `l-jigau-passadicos` `l-salao-de-pedra` `l-quarto-do-arcanista` `l-laboratorio-velnari` `l-quartel-da-vigia-jigau` `l-armazem-do-festival` `l-padaria-massapao` `l-orfanato-casca-quente` `l-pedra-de-partida` `l-sapo-afogado` `l-peixaria-gancho-torto` `l-estaleiro-madeira-verde` `l-banhos-do-tibarro` `l-taberna-cordas-soltas` `l-joalharia-brilho-do-pantano` `l-cais-comunitario` `l-casa-dos-rosbife` `l-templo-de-melora-espinha-viva` `l-trinca-rabos` `l-obelisco-negro` `l-iceberg-coragem-da-costa` `l-gruta-altar-aberrante` `l-margem-palida` `l-mares-gelados` `l-golfo-esmeralda` `l-bazzoxan-abandoned-house`
- **Beats novos** (43): `b-0-urzin-council` `b-0-salomao-rubidio` `b-0-urzin-day` `b-0-urzin-feast` `b-0-dranassar-vision` `b-0-bolbara-legend` `b-0-ritual-libertacao` `b-0-departure` `b-1-journey-day1-nessa` `b-1-journey-night1-dream` `b-1-journey-day2-wastewalkers` `b-1-journey-night2-kalai` `b-1-journey-day3-gloomstalker` `b-1-arrival-jigau` `b-1-fritz-velnari` `b-3-fritz-returns` `b-3-fritz-end` `b-1-jigau-arrival-intendente` `b-1-treasure-hunt` `b-1-luxon-coverup` `b-1-joalharia-myriad` `b-1-sapo-afogado` `b-1-melora-temple` `b-1-ushru-vs-velnari` `b-1-velnari-lab` `b-1-velnari-confrontation` `b-2-sea-departure` `b-2-sea-obelisco` `b-2-sea-aboleth` `b-2-sea-iceberg` `b-2-sea-landing-cave` `b-3-vazia-gruusk` `b-3-murmuradores` `b-3-estalagem-soldado-caido` `b-3-karesh` `b-3-rolo-wellington` `b-3-fugon-vision` `b-3-vorzen-attack` `b-3-vorrim` `b-3-caderno-volstrucker` `b-3-tingus` `b-3-verin-deal` `b-3-volstrucker-assault`
- **Revelações novos** (4): `r-alyxian-last-dranassar` `r-fritz-elisabete` `r-velnari-corrupted` `r-luxon-coverup`
- **Facções novos** (2): `f-culto-ceratos` `f-sorriso-dourado`

<!-- RASCUNHO para docs/ids.md — bloco D. Coluna "Fonte": C = campanha.md (bíblia), S = crocudos.md (sessões), — = só no enunciado, não encontrado no material. Ids da app mantêm o nome do livro; a coluna "mesa" é o que o DM diz em voz alta. -->

## Nome no livro → nome na mesa (Crocudos)

A campanha anterior do DM traduziu nomes do livro para a mesa. Os ids e os campos `name` da camada livro ficam em inglês; estes aliases entram em `aliases`/notas de campanha para o DM os ler à mesa.

### Personagens

| Livro | Mesa (Crocudos) | Fonte |
|---|---|---|
| Durth Mirimm | Duarte Mirim | C, S |
| Question | Iliana "Questão" | C |
| Foghome | Fugon | C (S usa "Foghome") |
| Parson Pellinost | Padre Perestrelo | C |
| Colbu Kaz | Coblu-Kaz (também "Colbu Kaz" nas partes traduzidas do livro) | C, S |
| Agathe Silverspoon | Ágata Colher-de-Prata | C |
| Buhfal II | Bufal II | C |
| Trush | Truche | C |
| Alonne Frith | Alone Fritz | C, S |
| Maryl Bronzefang | Maryl Presa-Dente | C |
| Sharpwatch | Pena-Brava | C |
| Beetle e Zag | Zesca e Fitas | C, S |
| Mossback Steward | Guardião do Musgo | C, S |
| Dermot Wurder | Dermot Mãos-Calmas | C |
| Maggie Keeneyes | Maggie Olhos-Apertados (2×) / Maggie Olho-Atento (1×) — escolher uma | C |
| Irvan Wastewalker (Notion: "Ivo dos Desterros") | Ivo Cinza-Viva | C, S |
| Olomon Sunbreaker | Olomão Quebra-Sol (a mesa também usou "Salomão") | C, S |
| Ayo Jabe | Ayo Jabe (sem tradução) | C, S |
| Galsariad Ardyth | Galsariad Ardyth (sem tradução) | C, S |
| Elder Ushru | Ancião Ushru | C |
| Korrem Dustgaze (DM) | Korrem Olha-Ruína | C |
| Isha Dimflame (DM) | Isha Sem-Vela | C |
| Relk Watersilt (DM) | Relk Pó-d'Água | C |
| Zhayra Stonesplit (DM) | Zhayra Racha-Pedra | C |
| Alyxian, o Apotheon | Alyxian, o Apoteão | C |
| Moonweaver (Sehanine) | Tecelã da Lua | C |
| Crawling King (Torog) | Rei Rastejante | C |
| Betrayer Gods | Deuses Traidores | C |
| Bright Queen | Rainha Brilhante | S (C só "Bright Queen") |

### Locais

| Livro | Mesa (Crocudos) | Fonte |
|---|---|---|
| Jigow | Jigau | C, S |
| Betrayers' Rise | Ascensão dos Traidores | C |
| Ready Room (Bazzoxan) | Estalagem do Soldado Caído | — (só "Estalagem" em S) |
| Gatehold Barracks | Quartel do Portão | — (C/S usam "Quartel da Vigia" / "Quartel da Dinastia") |
| Emerald Grotto | Gruta Esmeralda | C, S |
| Emerald Gulch | Golfo Esmeralda | C |
| Emerald Eye | Olho Esmeralda | C |
| Brokenveil Marsh | Pântano do Véu-Quebrado | C |
| Fort Venture | Forte Ventura | C, S |
| Xhorhas | Jorhas (sem acento no material; "Jorhás" no enunciado) | C, S |
| Wastes of Xhorhas | Desterros de Jorhas | C, S |
| Meatwaters | Águas-da-Carne | C, S |
| Wetwalks | Passadiços | C |
| Jumble | O Molho | C, S |
| Unbroken Tusk | Presa Inquebrável | C, S |
| Dynasty Outpost | Posto Avançado da Dinastia / "Tropa Torta"; sala principal "Salão de Pedra" | C |
| Stone Hall / Riddles and Rhymes | Salão de Pedra / Enigmas e Rimas | C |
| Wetwalks Paddywhack | Corrida no Arrozal | C |
| Hall of Holes (R2) | Corredor dos Buracos | C |
| Prayer Site of Sehanine | Altar de Sehanine | C |
| Netherdeep | Abismo Profundo (também "Netherdeep") | C |
| Cael Morrow / Ank'Harel | sem tradução | C |
| Mother's Sigh Reef | Recife do Lamento da Mãe | C |
| Lucidian Ocean | Oceano Lucidiano | C |
| Black Islands | Ilhas Negras | C |
| Rotthold | Decerepula | C |
| Marble Tomes Conservatory | Conservatório da Cúpula de Mármore | C |
| Shadycreek Run | Regato Sombrio | C |
| The Steaming Shell / The Cracked Shell (Urzin) | O Casco Fumegante / A Carapaça Estalada | C |
| Whisper of the Final Light (ruínas de Kalai, DM) | Sussurro da Última Luz | C |
| Ruínas da Saudade (DM, Bazzoxan) | sem nome no livro | C, S |
| Gruta: Grotto Entrance / Cavern Fork / Ghostgrass Patch / Kelp Tangle / Quipper Den / Riptide Tunnel / Moonshark Lair / Octopus's Garden | Entrada da Gruta / Bifurcação da Caverna / Campo de Erva-Fantasma / Emaranhado de Algas / Covil dos Quippers / Túnel da Correnteza / Covil do Tubarão-Lua / Jardim do Polvo | C |

### Facções e organizações

| Livro | Mesa (Crocudos) | Fonte |
|---|---|---|
| Aurora Watch | Vigia da Aurora | C, S |
| Kryn Dynasty | Dinastia Kryn | C |
| Cerberus Assembly | Assembleia de Cerberus | C, S |
| The Myriad | Miríade (grafia do material; "Míriade" no enunciado) | C, S |
| Cobalt Soul | Alma Cobalto | C, S |
| Allegiance of Allsight / Scholars of Allsight | Aliança do Saber | C |
| Consortium of the Vermilion Dream | Consórcio do Sonho Vermelho / "Sonho Rubro" (C) / "Consórcio Escarlate" (S) | C, S |
| Wastewalkers | Caminhantes-dos-Desterros (clã "Cinza-Viva") | C, S |
| Dwendalian Empire | Império Dwendaliano | C |
| Golden Grin | Sorriso Dourado | C |
| Cult of the Dragon / Company of Scales (DM) | Culto do Dragão / Companhia das Escamas / "Culto das Escamas" | C |
| Temple of the Mentor (Ank'Harel) | Templo da Mentora | C |

### Objectos e conceitos

| Livro | Mesa (Crocudos) | Fonte |
|---|---|---|
| Ruidium | Rubídio; refinado: "Suude Vermelho" / "pó vermelho" | C, S |
| Jewel of Three Prayers | Jóia das Três Preces (DM) / Joia das Três Orações (tradução do livro) | C |
| Vestige of Divergence | Vestígio da Divergência | C |
| Festival of Merit / Champions of Merit | Festival do Mérito / Campeões do Mérito | C |
| Horizonback Tortoise | Tartaruga-do-Horizonte | C |
| Moonshark | Tubarão-Lua | C |
| Battle of the Barbed Fields / King's Cage | Batalha dos Campos Farpados / Jaula do Rei | C |
| Far Realm | Reino Distante | C |
| Medals (Horizonback, Maze, Meat Pie, Wetlands, Wit, Muscle, Conch) | Medalhas da Tartaruga-do-Horizonte, do Labirinto, da Empada, dos Pântanos, da Astúcia, da Força, do Búzio | C |
