# Convenções de ids e elenco partilhado

Ids em kebab-case ASCII (sem acentos/apóstrofos). Prefixos: `c-` personagem, `f-` fação, `l-` local, `b-<cap>-` beat, `r-` revelação, `a-` arco, `amb-` ambição. Capítulos: `ch0` (prólogo) … `ch7`.

## Duas camadas

- `data/book/` — **o livro, tal como escrito**: referência. Não se edita (nem na app nem à mão), a não ser para corrigir erros de extração.
- `data/campaign/` — **a nossa campanha**: o que muda face ao livro. Aplica-se por cima de `book`:
  - entrada com uma `id` que existe no livro → **patch**: só os campos presentes substituem os do livro (arrays substituem por inteiro);
  - `{ "id": "…", "_remove": true }` → a entrada do livro **desaparece** da campanha;
  - `id` nova → **acrescento**;
  - relações: `{ "from", "to", "type", "_remove": true }` esconde a relação do livro; sem `_remove` acrescenta.
- Ficheiros: cada coleção é uma pasta com vários JSON (arrays) que se juntam: `data/book/characters/ch1-2.json`, `data/campaign/beats/ch3.json`, etc. O que se cria na app vai para `data/campaign/<coleção>/dm.json`. `data/book/campaign.json` e `data/book/arcs.json` têm equivalentes opcionais em `data/campaign/`.
- Validar: `npm run validate` (livro + campanha) ou `npm run validate -- --book` (só o livro).

As notas de DM com conselhos do Remix estão em `data/campaign/beats/remix-notes.json` (no livro esses beats têm `notes: ""`); as alterações estruturais adotadas do Remix e as do DM estão em `data/campaign/*/remix.json`. Regras próprias: `docs/regras.md`.

Na app: "Ver só o livro" na barra lateral alterna para o livro sem alterações (só leitura); ✚ = acrescentado na campanha, ▲ = alterado face ao livro; o painel de detalhe mostra o original do livro e permite repor.

## O registo — `data/registo/` (Decidido pelo DM, 2026-10-09)

O cânone diz como as coisas **são**; o registo diz o que **aconteceu** e o que foi **decidido**. O estado de jogo (beats jogados, flags, quem tem o quê, fios abertos, relógios, capítulo atual) nunca se escreve à mão: deriva-se do registo (`derivar()` em `src/lib/registo.ts`), e a app só o lê — **o fecho é o único caminho de escrita**. Ficheiros curtos, JSON a 2 espaços; chaves desconhecidas são erro (apanham gralhas); os campos do registo são em português, os das coleções herdadas ficam em inglês.

- **`sessoes/s-NN.json`** — uma sessão por ficheiro, `s-NN` = número da campanha (o nome do ficheiro é o id). Campos: `id`, `global` (contador de todas as mesas: #86), `data`, `titulo`, `estado` (`jogada` | `planeada`; no máximo uma planeada, a última, só com `beats` previstos), `capitulo`, `resumo` (caminho do .md), `gravacao`, `preparacao` (nome do runsheet na Drive), `mesa {presentes, ausentes, notas}` (ids de PCs), `tempo {de {dia, terco}, a {dia, terco}, estimado}` (terço = manhã | tarde | noite), `beats [{id, escolha, continua, dia, terco}]` (`escolha` = label da choice; `continua` = ainda não conta como jogado), `npcs [{id, estado, atitude, dia, terco}]`, `flags {chave: true|false}`, `revelacoes [r-…]`, `portentos ["f-x:chN"]`, `loot [{item, de, para, quantidade, nota, dia, terco}]` (`para` = c-id | grupo | perdido | gasto), `fios [{id, avanca | fecha | descarta: texto}]`, `relogios [{id, posicao, nota}]`, `cumpre [d-…]`, `notas`.
- **`decisoes/AAAA-MM.json`** — decisões do DM do mês, append-only (corrige-se com outra que `substitui`). `id` `d-AAAA-MM-DD-NN` (a data do id é a do campo `data`), `data`, `origem` (`mesa` | `chat` | `voz`; voz exige `fonte`), `sessao`, `tipo` (`plano` | `mesa` | `rejeitada`, ou ausente), `texto`, `afeta` (ids ou `docs/<ficheiro>.md#<ancora>`), `substitui`, `gatilho` (beats onde um plano paga), `prazo` (`s-NN` ou data), `quando` (rótulo), `fecha` (perguntas respondidas). Um plano fica «por cumprir» até uma sessão o listar em `cumpre`.
- **`fios.json`** — catálogo de fios da mesa e perguntas ao DM: `id` `fio-…`, `tipo` (`fio` | `pergunta`), `titulo`, `sobre` (ids), `aberto` (`s-NN` ou `d-…`), `prazo`, `notas`. O estado (aberto · fechado · descartado) deriva dos movimentos nas sessões e do `fecha` das decisões; um fio só se move depois de existir aqui.
- **`itens.json`** — itens com peso narrativo, ouro e handouts: `id` `i-…`, `nome`, `tipo` (`item` | `handout` | `ouro`), `regras` / `texto` (`docs/x.md#ancora`), `drive`, `para` (destinatários previstos de um handout), `notas`. O dono é o último `para` em `loot`; o ouro soma-se por dono com `quantidade`.
- **`relogios.json`** — `id` `rel-…`, `nome`, `sobre`, `passos` (inteiro), `unidade`, `prazo`, `nota`. A posição é a última em `relogios[]` das sessões (0..passos).

Notas: `quantidade` só conta para itens de tipo `ouro` (cada exemplar de um item é um `i-…`); só PCs e `grupo` detêm ouro (um NPC que paga não fica com saldo negativo). As âncoras `docs/x.md#ancora` são as que o GitHub gera a partir do título (minúsculas, acentos mantidos, espaços → hífenes) e aceitam subpastas (`docs/sessoes/…`). Uma sessão `planeada` pode ainda não ter `data` nem `titulo`.

`npm run validate` lê o registo (erro = referência inexistente, chave desconhecida, tipo ou forma errados, ficheiro referido que não existe; aviso = higiene: escolha que não casa com um label, fio parado há 4+ sessões, relógio a recuar, item sem dono, beat jogado com `order` posterior a beats jogados depois, `docs/estado.md` desatualizado, marcadores de estado em texto na camada campaign). Enquanto a limpeza dos prefixos de texto decorre, `validate` corre em modo `--legado` (marcadores e vestígios do modelo antigo são avisos); `npm run validate:estrito` é o modo final. `npm run estado` gera `docs/estado.md`, a página de consulta (não escreve se houver erros). `docs/caixa.md` é a caixa de entrada do DM (texto livre, uma linha por decisão ou ideia): o fecho converte e esvazia.

## Capítulos
`ch0` Unwelcome Spirits · `ch1` A Fateful Competition · `ch2` The Leave-Taking · `ch3` Bazzoxan · `ch4` The Jewel of Hope · `ch5` The Drowned City · `ch6` The Netherdeep · `ch7` The Heart of Despair · **`ch8` Ato 4: O Ano de Ruidus** (camada campanha, só no pior final)

`data/campaign/campaign.json` pode listar só os capítulos novos ou alterados: os capítulos juntam-se por id (patch dos existentes, acrescento dos novos, `_remove` para tirar).

## PCs (campanha 2026) e backstory — `data/campaign/*/pcs.json`
Fonte: fichas dos jogadores, sessão zero e notas DM (ver `docs/pcs.md`); nada inventado. Os PCs têm `chapters` = todos os capítulos, para contarem sempre no tempo; as cenas pessoais são semeadas depois (a app avisa dos capítulos sem cena por PC).
PCs: `c-pc-quasi` (Quasimodo d'Clopin, Pedro Silva) · `c-pc-lucan` (Lucan "Anzol" Bruma, Renata) · `c-pc-isco` (Ruín "Isco" Bruma, Pedro Ropio) · `c-pc-lia` (Lia, Camila; entra na sessão 4) · pistas `a-pc-quasi` `a-pc-lucan` `a-pc-isco` · ambições `amb-quasi-*` `amb-lucan-*` `amb-isco-*`
Backstory: `c-baeshra` (semideus, patrono do Lucan) `c-vaelen-bruma` `c-yussa-errenis` `c-aboleto-anciao` `c-tripulante-tomado` `c-filho-ctonico` `c-campeao-lua-vermelha` (Vesq'ar, reilora) `c-raunie-dorina` `c-irmao-tobar` `c-mensageiro-brishen` `c-violinista-cega` · fações `f-caravana-naiat` `f-antepassados` `f-scylla` `f-imperio-aboleto` `f-revelry` · locais `l-zigurate-smouldercrown` `l-cemiterio-ederlezi` · revelações "Segredos dos PCs" `r-pc-*` (ainda sem pistas: a semear) · patch a `c-aloysia-telfan` (reconhece o Quasi) · Lucan: `c-seguidor-tatuagem` `f-fieis-baeshra` `l-obelisco-rise` `c-hesskar-ro` (pai do Morgid, clã Ro) · patches a `c-morgid` (lizardfolk, filho de Hesskar-Ro), `l-obelisco-negro`, `l-ritual-stone` (é o obelisco do pântano; Trush preso), `c-trush`, `l-sunken-boneyard` (o altar de criança de Baeshra), `c-skra-sorsk` (morto na sessão 1), `c-durth-mirimm` (liderou o ataque ao clã Ro) · Isco: `c-tia-zulmira` `c-cacador-afogado` `c-marisa-sete-ventos` `c-claret-segundo` `f-claret-orders` · beats do Lucan no prólogo (PROPOSTA, `data/campaign/beats/pcs.json`): `b-0-boneyard-altar` `b-0-ritual-stone-lucan` `b-0-hesskar-ro` `b-1-mirimm-reconhece` · revelação `r-pc-lucan-adaga` · `c-sessinek` (Emperor Lizard: a corte do ossário e a oferta na Ascensão) + `r-pc-lucan-sessinek`, com `l-sunken-boneyard` e `c-skra-sorsk` repatchados (o templo dentro do maior crânio, trono, as seis espadas, a mão de garras; Skr'a era lizard king) · `c-tripulante-tomado` é Belmiro · patch a `c-aboleth-do-mar` (fala com o Isco)

## Arcos
`a-prologue` `a-main` `a-lore` `a-ruidium` `a-rivals` `a-kryn` `a-allegiance` `a-consortium` `a-cobalt` `a-sentinels` · campanha: `a-ruidus-year` (Ato 4) `a-jmon` (J'mon Sa Ord) `a-myriad` (contrabando de rubídio) `a-cerberus` (Assembleia de Cerebrus)

## Fações
`f-kryn` Dinastia Kryn · `f-aurora-watch` Vigia da Aurora · `f-jigow-elders` Conselho de Anciãos de Jigau · `f-luxon` Fé do Luxon · `f-allegiance` Allegiance of Allsight · `f-consortium` Consortium of the Vermilion Dream · `f-cobalt-soul` Biblioteca da Alma de Cobalto · `f-sentinels` Sentinels of Memory · `f-hands-of-ord` Hands of Ord · `f-scarbearers` Scarbearers · `f-veil` The Veil · `f-rivals` A companhia dos rivais (na campanha: "Os Bons Demais", nome da mesa) · `f-dwendalian-empire` Império Dwendaliano · `f-road-raiders` Road Raiders · `f-prime-deities` Divindades Primárias · `f-betrayer-gods` Deuses Traidores · campanha: `f-cerulean-palace` (J'mon Sa Ord, Gemeshega) `f-apotheon-cult` (adoradores do Apotheon) `f-cerberus-assembly` (Volstruckers; recebe rubídio pela Miríade; farol) `f-myriad` (Miríade: canal de contrabando Bazzoxan → Jigau → Urzin → Império, com ramal sul por Asarius até Decrépola) · `f-culto-ceratos` (culto de Ceratos: o Fritz e o Vigost)

Os **portentos** (fronts) de todas as fações vivem em `data/campaign/factions/portents.json` (síntese aprovada pelo DM, não texto do livro); no livro as fações têm `portents: []`.

## Personagens recorrentes (usar exatamente estes ids)
Rivais: `c-ayo-jabe` `c-dermot-wurder` `c-galsariad-ardyth` `c-irvan-wastewalker` `c-maggie-keeneyes`
Alyxian: `c-alyxian` (o Apotheon; as formas do cap. 7 são estados) · `c-theo-nathope` · `c-alyxian-hunter` · `c-alyxian-aboleth` · `c-perigee`
Jigau: `c-elder-ushru` `c-elder-colbu-kaz` `c-durth-mirimm` `c-maryl-bronzefang`
Estrada: `c-justice` `c-six-knives` `c-tyvak` `c-moghra` `c-kierchaly-wastewalker` `c-gaeya-iliera`
Bazzoxan: `c-verin-thelyss` `c-prolix-yusaf` `c-aloysia-telfan` `c-question` `c-bautha-dyrr` `c-foghome` `c-naevyn-tasithar` `c-kalym-telaarin` `c-reynard-allerton` `c-sebastian-allerton`
Ank'Harel: `c-jmon-sa-ord` `c-james-cryon` `c-gryz-alakritos` `c-lymmle-wist` `c-galeokaerda` `c-insight-acuere` `c-scribble` `c-xot` `c-carliale-kroogan` `c-jor-raashid` `c-khime` `c-kareema` `c-hakzorne` `c-aradrine` `c-vrill` `c-khelkur` `c-dendarron` `c-larthul` `c-satzrak` `c-shira` `c-ashann` `c-jamil-aalithiya` `c-iwo-zalarre` `c-watcher-trast` `c-watcher-byron` `c-ironhand-sem` `c-adima-shemsilver` `c-nedosi-anay` `c-koris` `c-old-man-kruuk` `c-laurin-ophidas` `c-amkezne` `c-rerosha`
Cael Morrow: `c-olara` `c-hadarai` `c-beltreath` `c-library-ghosts`
Visões: `c-alyxian-parents` `c-saqiri` `c-kalagothe` `c-zenthas-family` `c-talmyth`
Divindades (`kind: deity`): `c-sehanine` `c-avandra` `c-corellon` `c-gruumsh` `c-torog` `c-lolth` `c-tharizdun` `c-melora` `c-the-luxon` `c-ioun` `c-vesh`
Campanha: `c-finalist-team` (a outra equipa finalista: "Punhos de Ferro e Fogo") `c-volstrucker-agent` (agente Volstrucker: rubídio, farol, Jóia) · Miríade (sem nome): `c-nevoa-vendor` (Névoa do Brejo, Urzin) `c-myriad-traveller` (Urzin) `c-myriad-jigow-fence` (Jigau) `c-myriad-couriers` (estrada, grupo) `c-myriad-bazzoxan-contact` (Ready Room)
Prólogo: `c-buhfal` `c-bolbara` `c-trush` `c-morgid` `c-pellinost` `c-felmont` `c-alonne-frith` `c-skra-sorsk` `c-mossback-steward`
Patrulha do Forte Ventura (sessão 4, jogada): `c-corvelo` `c-casqueiro` `c-nalia-vasques` `c-elmiro-trigueiro` `c-lampreia` `c-damiao-prestes` `c-soldado-doente` `c-bento-ruivo` · beat `b-0-patrulha-imperio`
Lia (Camila) e a Alma de Cobalto: `c-pc-lia` · arco `a-pc-lia` · ambição `amb-lia-pai` · `c-pai-da-lia` `c-mae-da-lia` `c-sia-kresh` `c-yudala-fon`
Alberto e a Assembleia: `c-alberto-gnomis` · `c-doolan-tversky`
Decrépola (backstory dos Bruma): `c-ossorio-lume` (Miríade) `c-remendo` (Folia, tripulação da Marisa) `c-vigost` (culto de Ceratos) · locais `l-decrepola` `l-asarius`

## Locais principais
`l-urzin` `l-brokenveil-marsh` `l-fort-venture` · `l-jigow` `l-emerald-grotto` `l-prayer-site-sehanine` · `l-xhorhas-road` `l-caravan-stop` · `l-bazzoxan` `l-betrayers-rise` `l-prayer-site-avandra` · `l-ank-harel` `l-crystal-chateau` `l-first-eclipse` `l-temple-of-the-mentor` `l-suncut-bazaar` `l-life-dome` `l-maw-of-cael-morrow` · `l-cael-morrow` `l-temple-of-the-arch-heart` `l-rift` · `l-netherdeep` `l-grottoes-of-regret` `l-vents-of-fury` `l-chasm-of-yearning` `l-heart-of-despair` · campanha: `l-ruins-of-sorrow` (fan-made, Reddit; filho de `l-barbed-fields`) `l-nevoa-do-brejo` (loja de ervas em Urzin, da mesa)

## Beats-âncora (referenciados por vários ficheiros)
`b-0-return-to-urzin` · `b-1-jewel-vision` (E12, Jóia Dormant) · `b-2-ushru-dawn` · `b-2-jewel-theft` · `b-3-mouthers` · `b-3-prayer-site-avandra` (R16, Awakened) · `b-3-jewel-confrontation` · `b-4-choose-faction` · `b-5-temple-arch-heart` (M9, Exalted) · `b-5-open-rift` · `b-6-theo-and-hunter` · `b-6-rivals-n26` · `b-7-alyxian-speaks` (convergência) · `b-7-ending-worst` `b-7-ending-neutral` `b-7-ending-best` · campanha (Remix / DM): `b-1-festival-seeds` `b-1-scarlet-fever` `b-1-grotto-ruidium` `b-1-jigow-research` `b-2-ruins-outside-bazzoxan` (Ruins of Sorrow) `b-2-vision-perigee-death` `b-3-researchers-in-town` `b-3-bazzoxan-research` `b-3-rise-entrances` `b-4-faction-competition` `b-4-entering-cael-morrow` `b-5-pointcrawl` · campanha (Miríade / Assembleia): `b-0-nevoa-do-brejo` `b-1-myriad-jigow` `b-2-myriad-on-the-road` `b-3-beacon-rumour` `b-3-volstrucker-investigation` `b-3-myriad-bazzoxan` `b-3-beacon-in-barracks` `b-3-beacon-heist` · campanha (Ato 4): `b-4-gemeshega-audience` `b-5-palace-reacts` `b-7-ruidus-night` `b-7-chamber-of-judgment` `b-8-year-of-ruidus` `b-8-path-pilgrimage` `b-8-path-army` `b-8-path-betrayers` `b-8-cult-of-the-apotheon` `b-8-final-confrontation` `b-8-aftermath`

## Revelações (ids definitivos — só estes; quem escreve beats referencia-os em `reveals`)
- **Campaign Agendas**: `r-jewel-properties` `r-jewel-three-prayers` `r-shrines` `r-jewel-reactivate` `r-ruidium-properties` `r-ruidium-apotheon-sites` `r-faction-agendas`
- **Lore of Alyxian**: `r-alyxian-ruidus-birth` `r-alyxian-bad-luck` `r-alyxian-three-prayers` `r-alyxian-gruumsh` `r-netherdeep-prison` `r-netherdeep-leaking` `r-perigee` `r-alyxian-wants-remembered` `r-alyxian-split-self`
- **Navegação**: `r-go-to-bazzoxan` `r-cyst-of-avandra` `r-go-to-ank-harel` `r-cael-morrow-entrance` `r-rift-location` `r-rift-key`
- **Fações**: `r-lymmle-traitor` `r-galeokaerda-spy` `r-aboleth-not-alyxian` `r-cryon-vs-alakritos` `r-consortium-funds-sentinels` `r-sixth-missions-doomed`
- **Prólogo**: `r-bolbara-possessed` `r-how-to-save-bolbara` `r-kryn-vs-empire`
- **Campanha (Ato 4)**: `r-jmon-authorized-dig` `r-jmon-will-rise`
- **Campanha (Remix / DM)**: `r-scarlet-fever` `r-ruidium-history` (lista "Rubídio")
- **Campanha (Contrabando)**: `r-myriad-route` `r-assembly-buys-ruidium` `r-beacon-in-barracks`

## Camada da mesa (material próprio do DM)
Material próprio do DM (NPCs, locais, beats, regras e nomes da mesa). Ficheiros: `data/campaign/*/mesa.json` (acrescentos e patches ao livro), `data/campaign/*/zz-mesa-patches.json` (patches a entidades já alteradas na campanha; carregam no fim), `data/campaign/*/mesa-nomes.json` (nomes em português da mesa; o original fica no livro). Texto marcado "a mesa:" / "a mesa:" com a sessão. Handouts em `docs/handouts.md`; regras em `docs/regras.md`; lore geral em `docs/lore.md`. Fora, por decisão do DM: culto do dragão, Jack Sparrou e tudo o que estava preso aos PCs antigos.

**Decisões do DM sobre variantes:** Zyn'thar Veylin é **Adélia Krauss** (Wizard Assassin, humana ruiva; sem segundo agente para o caderno) · filha de Fritz = **Elisabete** · Prolix = **tiefling** · à chegada a Bazzoxan **Grash Korr'thak é devorado** pelos mouthers e **Urza Vokh combate ao lado dos PCs** · dragão do iceberg = **Gelidon, ancient** · regras: marcas na alma no long rest, exposição prolongada, Grito com Wisdom save por exaustão, Ecos = 1 + exaustão, Jóia + suude · rival = **Ivo Cinza-Viva** (a mesa: "Ivo dos Desterros") · Nara Sol já investiga o rubídio; Trinca-Rabos leva 6 passageiros · Olomão Quebra-Sol, Maggie Olho-Atento, Dhurak Pé-Reto, Vazia é uma pessoa.
- **Personagens novos** (80): `c-olomao-quebra-sol` `c-rinkat-ticao-baixo` `c-nisla-asa-curta` `c-valir-torran` `c-litcha-das-cinzas` `c-kalmuk-parte-po` `c-karuk-pedra-dura` `c-mekik` `c-mugra-maos-quentes` `c-skirr` `c-rikka-tres-dentes` `c-durg-mao-mole` `c-rogna-erva-rara` `c-krivga-pele-seca` `c-druida-cego-do-pantano` `c-dhurak-pe-reto` `c-tripulacao-passo-lento` `c-nessa-brilho-leve` `c-korrem-olha-ruina` `c-isha-sem-vela` `c-relk-po-dagua` `c-zhayra-racha-pedra` `c-filha-de-korrem` `c-velnari-zeth` `c-kren-vorith` `c-yezek-miruun` `c-sarna-kul` `c-nibuk` `c-os-orelhudos` `c-nippi-dente-largo` `c-bruno-massapao` `c-rafael-e-samara-rosbife` `c-regimia-rosbife` `c-verema-brisa-mansa` `c-zinka` `c-tia-mukka-zetek` `c-kolgar-gurt` `c-nossil-sete-rumos` `c-yalla-gancho-torto` `c-belk-bate-ripa` `c-tapa-meia-vela` `c-trinte-tres-talheres` `c-rabbak-quebra-tabua` `c-grakka-maos-de-corda` `c-rombek-terra-firme` `c-durahk-braco-de-ferro` `c-shonna-olho-de-cinza` `c-grok-e-verran` `c-ze-e-felix` `c-keyeki` `c-chekka-falha-remos` `c-nok-nok-racha-dentes` `c-bukka-sem-medo` `c-grelka-dente-largo` `c-kiri-kiri-da-vela-alta` `c-susana-deep-scion` `c-aboleth-do-mar` `c-dragao-branco-adulto` `c-gigante-da-tempestade` `c-culto-esquecido` `c-darguun-velk` `c-grumak` `c-kael-rhun` `c-lirien-solva` `c-rolo-wellington` `c-vazia` `c-gruusk` `c-karesh-asa-rubra` `c-nara-sol` `c-talan-velyar` `c-vorzen` `c-vorrim` `c-levir` `c-murmuradores` `c-ornessa-tia-vurk` `c-urza-vokh` `c-grash-korrthak` `c-duasad-keef` `c-sulo` `c-nela`
- **Personagens da mesa, sessões 1–2 (#81, #83)** (10): `c-jevan` `c-klag` `c-azrok` `c-ugluk` `c-hobgoblin-velho-do-banquinho` `c-alberto-gnomis` `c-velran-thumaz` `c-ossyra-mirimm` `c-forroco` `c-lizardfolk-do-ossario` · patches «a mesa» a `c-buhfal` `c-morgid` `c-skra-sorsk` `c-bolbara` `c-yussa-errenis` `c-pc-quasi` `c-pc-lucan` `c-pc-isco` `c-litcha-das-cinzas` `c-rikka-tres-dentes` e a `l-urzin` `l-carapaca-estalada` `l-templo-das-cinzas` `l-sunken-boneyard` `l-brokenveil-marsh` `l-nevoa-do-brejo` (fonte: transcrições das gravações, guardadas na Drive em `session_records/`, fora do repo).
- **Personagens da mesa, sessão 3 (#84)** (1): `c-velho-do-cla-ro` (o pai de Baeshra, visto na visão) · patches «a mesa» a `c-skra-sorsk` `c-morgid` `c-alberto-gnomis` `c-lizardfolk-do-ossario` `c-pc-lucan` `c-pc-quasi` `c-pc-isco` `c-baeshra` `c-sessinek` `c-durth-mirimm` `c-elder-ushru` `c-elder-colbu-kaz` e a `l-sunken-boneyard` `l-brokenveil-marsh` `l-crumbling-tower`; `b-0-boneyard-altar` jogado (ver `docs/canone.md`).
- **Locais novos** (41): `l-trapo-e-ticao` `l-pombal-ninho-de-lama` `l-templo-luxon-urzin` `l-templo-das-cinzas` `l-ferreiro-pedra-dura` `l-bugigangas-de-mekik` `l-casco-fumegante` `l-carapaca-estalada` `l-raiz-da-sorte` `l-mantimentos-ate-ao-osso` `l-passo-lento` `l-kalai-ruins` `l-clan-cinza-viva-camp` `l-jigau-molho` `l-jigau-aguas-da-carne` `l-jigau-passadicos` `l-salao-de-pedra` `l-quarto-do-arcanista` `l-laboratorio-velnari` `l-quartel-da-vigia-jigau` `l-armazem-do-festival` `l-padaria-massapao` `l-orfanato-casca-quente` `l-pedra-de-partida` `l-sapo-afogado` `l-peixaria-gancho-torto` `l-estaleiro-madeira-verde` `l-banhos-do-tibarro` `l-taberna-cordas-soltas` `l-joalharia-brilho-do-pantano` `l-cais-comunitario` `l-casa-dos-rosbife` `l-templo-de-melora-espinha-viva` `l-trinca-rabos` `l-obelisco-negro` `l-iceberg-coragem-da-costa` `l-gruta-altar-aberrante` `l-margem-palida` `l-mares-gelados` `l-golfo-esmeralda` `l-bazzoxan-abandoned-house`
- **Beats novos** (43): `b-0-urzin-council` `b-0-salomao-rubidio` `b-0-urzin-day` `b-0-urzin-feast` `b-0-dranassar-vision` `b-0-bolbara-legend` `b-0-ritual-libertacao` `b-0-departure` `b-1-journey-day1-nessa` `b-1-journey-night1-dream` `b-1-journey-day2-wastewalkers` `b-1-journey-night2-kalai` `b-1-journey-day3-gloomstalker` `b-1-arrival-jigau` `b-1-fritz-velnari` `b-3-fritz-returns` `b-3-fritz-end` `b-1-jigau-arrival-intendente` `b-1-treasure-hunt` `b-1-luxon-coverup` `b-1-joalharia-myriad` `b-1-sapo-afogado` `b-1-melora-temple` `b-1-ushru-vs-velnari` `b-1-velnari-lab` `b-1-velnari-confrontation` `b-2-sea-departure` `b-2-sea-obelisco` `b-2-sea-aboleth` `b-2-sea-iceberg` `b-2-sea-landing-cave` `b-3-vazia-gruusk` `b-3-murmuradores` `b-3-estalagem-soldado-caido` `b-3-karesh` `b-3-rolo-wellington` `b-3-fugon-vision` `b-3-vorzen-attack` `b-3-vorrim` `b-3-caderno-volstrucker` `b-3-tingus` `b-3-verin-deal` `b-3-volstrucker-assault`
- **Revelações novos** (4): `r-alyxian-last-dranassar` `r-fritz-elisabete` `r-velnari-corrupted` `r-luxon-coverup`
- **Fações novos** (2): `f-culto-ceratos` `f-sorriso-dourado`

## Nome no livro → nome na mesa

O DM traduziu nomes do livro para a mesa. Os ids e os campos `name` da camada livro ficam em inglês; estes aliases entram em `aliases`/notas de campanha para o DM os ler à mesa.

### Personagens

| Livro | Mesa |
| --- | --- |
| Durth Mirimm | Duarte Mirim |
| Question | Iliana "Questão" |
| Foghome | Fugon |
| Parson Pellinost | Padre Perestrelo |
| Colbu Kaz | Coblu-Kaz (também "Colbu Kaz" nas partes traduzidas do livro) |
| Agathe Silverspoon | Ágata Colher-de-Prata |
| Buhfal II | Bufal II |
| Trush | Truche |
| Alonne Frith | Alone Fritz |
| Maryl Bronzefang | Maryl Presa-Dente |
| Sharpwatch | Pena-Brava |
| Beetle e Zag | Zesca e Fitas |
| Mossback Steward | Guardião do Musgo |
| Dermot Wurder | Dermot Mãos-Calmas |
| Maggie Keeneyes | Maggie Olhos-Apertados (2×) / Maggie Olho-Atento (1×) — escolher uma |
| Irvan Wastewalker (também "Ivo dos Desterros") | Ivo Cinza-Viva |
| Olomon Sunbreaker | Olomão Quebra-Sol (a mesa também usou "Salomão") |
| Ayo Jabe | Ayo Jabe (sem tradução) |
| Galsariad Ardyth | Galsariad Ardyth (sem tradução) |
| Elder Ushru | Ancião Ushru |
| Korrem Dustgaze (DM) | Korrem Olha-Ruína |
| Isha Dimflame (DM) | Isha Sem-Vela |
| Relk Watersilt (DM) | Relk Pó-d'Água |
| Zhayra Stonesplit (DM) | Zhayra Racha-Pedra |
| Alyxian, o Apotheon | Alyxian, o Apoteão |
| Tecelã da Lua (Sehanine) | Tecelã da Lua |
| Rei Rastejante (Torog) | Rei Rastejante |
| Deuses Traidores | Deuses Traidores |
| Rainha Brilhante | Rainha Brilhante |

### Locais

| Livro | Mesa |
| --- | --- |
| Jigau | Jigau |
| Ascensão dos Traidores | Ascensão dos Traidores |
| Ready Room (Bazzoxan) | Estalagem do Soldado Caído |
| Gatehold Barracks | Quartel do Portão |
| Emerald Grotto | Gruta Esmeralda |
| Emerald Gulch | Golfo Esmeralda |
| Emerald Eye | Olho Esmeralda |
| Pântano do Véu-Quebrado | Pântano do Véu-Quebrado |
| Forte Ventura | Forte Ventura |
| Jorhas | Jorhas (sem acento no material; "Jorhas" no enunciado) |
| Wastes of Jorhas | Desterros de Jorhas |
| Meatwaters | Águas-da-Carne |
| Wetwalks | Passadiços |
| Jumble | O Molho |
| Unbroken Tusk | Presa Inquebrável |
| Dinastia Outpost | Posto Avançado da Dinastia / "Tropa Torta"; sala principal "Salão de Pedra" |
| Stone Hall / Riddles and Rhymes | Salão de Pedra / Enigmas e Rimas |
| Wetwalks Paddywhack | Corrida no Arrozal |
| Hall of Holes (R2) | Corredor dos Buracos |
| Prayer Site of Sehanine | Altar de Sehanine |
| Netherdeep | Abismo Profundo (também "Netherdeep") |
| Cael Morrow / Ank'Harel | sem tradução |
| Mother's Sigh Reef | Recife do Lamento da Mãe |
| Oceano Lucídico | Oceano Lucidiano |
| Black Islands | Ilhas Negras |
| Rotthold | Decerepula |
| Marble Tomes Conservatory | Conservatório da Cúpula de Mármore |
| Shadycreek Run | Regato Sombrio |
| The Steaming Shell / The Cracked Shell (Urzin) | O Casco Fumegante / A Carapaça Estalada |
| Whisper of the Final Light (ruínas de Kalai, DM) | Sussurro da Última Luz |
| Ruínas da Saudade (DM, Bazzoxan) | sem nome no livro |
| Gruta: Grotto Entrance / Cavern Fork / Ghostgrass Patch / Kelp Tangle / Quipper Den / Riptide Tunnel / Moonshark Lair / Octopus's Garden | Entrada da Gruta / Bifurcação da Caverna / Campo de Erva-Fantasma / Emaranhado de Algas / Covil dos Quippers / Túnel da Correnteza / Covil do Tubarão-Lua / Jardim do Polvo |

### Fações e organizações

| Livro | Mesa |
| --- | --- |
| Vigia da Aurora | Vigia da Aurora |
| Dinastia Kryn | Dinastia Kryn |
| Assembleia de Cerebrus | Assembleia de Cerebrus |
| Miríade | Miríade (grafia do material; "Miríade" no enunciado) |
| Alma de Cobalto | Alma de Cobalto |
| Allegiance of Allsight / Scholars of Allsight | Aliança do Saber |
| Consortium of the Vermilion Dream | Consórcio do Sonho Vermelho / "Sonho Rubro" (C) / "Consórcio Escarlate" (S) |
| Wastewalkers | Caminhantes-dos-Desterros (clã "Cinza-Viva") |
| Império Dwendaliano | Império Dwendaliano |
| Golden Grin | Sorriso Dourado |
| Cult of the Dragon / Company of Scales (DM) | Culto do Dragão / Companhia das Escamas / "Culto das Escamas" |
| Temple of the Mentor (Ank'Harel) | Templo da Mentora |

### Objetos e conceitos

| Livro | Mesa |
| --- | --- |
| Rubídio | Rubídio; refinado: "Suude Vermelho" / "pó vermelho" |
| Jewel of Three Prayers | Jóia das Três Preces (DM) / Joia das Três Orações (tradução do livro) |
| Vestige of Divergence | Vestígio da Divergência |
| Festival do Mérito / Champions of Merit | Festival do Mérito / Campeões do Mérito |
| Horizonback Tortoise | Tartaruga-do-Horizonte |
| Moonshark | Tubarão-Lua |
| Battle of the Barbed Fields / King's Cage | Batalha dos Campos Farpados / Jaula do Rei |
| Far Realm | Reino Distante |
| Medals (Horizonback, Maze, Meat Pie, Wetlands, Wit, Muscle, Conch) | Medalhas da Tartaruga-do-Horizonte, do Labirinto, da Empada, dos Pântanos, da Astúcia, da Força, do Búzio |
