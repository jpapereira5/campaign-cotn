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
`f-kryn` Kryn Dynasty · `f-aurora-watch` Aurora Watch · `f-jigow-elders` Conselho de Anciãos de Jigow · `f-luxon` Fé do Luxon · `f-allegiance` Allegiance of Allsight · `f-consortium` Consortium of the Vermilion Dream · `f-cobalt-soul` Library of the Cobalt Soul · `f-sentinels` Sentinels of Memory · `f-hands-of-ord` Hands of Ord · `f-scarbearers` Scarbearers · `f-veil` The Veil · `f-rivals` A companhia dos rivais · `f-dwendalian-empire` Império Dwendaliano · `f-road-raiders` Road Raiders · `f-prime-deities` Prime Deities · `f-betrayer-gods` Betrayer Gods · campanha: `f-cerulean-palace` (J'mon Sa Ord, Gemeshega) `f-apotheon-cult` (adoradores do Apotheon) `f-cerberus-assembly` (Volstruckers; recebe ruidium pelo Myriad; beacon) `f-myriad` (The Myriad: canal de contrabando Bazzoxan → Jigow → Urzin → Império)

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
Campanha: `c-finalist-team` (a outra equipa finalista) `c-volstrucker-agent` (agente Volstrucker: ruidium, beacon, Jóia) · Myriad (sem nome): `c-nevoa-vendor` (Névoa do Brejo, Urzin) `c-myriad-traveller` (Urzin) `c-myriad-jigow-fence` (Jigow) `c-myriad-couriers` (estrada, grupo) `c-myriad-bazzoxan-contact` (Ready Room)
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
