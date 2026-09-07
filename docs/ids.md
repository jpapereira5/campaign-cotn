# Convenções de ids e elenco partilhado

Ids em kebab-case ASCII (sem acentos/apóstrofos). Prefixos: `c-` personagem, `f-` facção, `l-` local, `b-<cap>-` beat, `r-` revelação, `a-` arco, `amb-` ambição. Capítulos: `ch0` (prólogo) … `ch7`.

Ficheiros: cada colecção é uma pasta com vários ficheiros JSON (arrays) que se juntam: `data/characters/ch1-3.json`, `data/beats/ch4.json`, etc. Entradas criadas na app vão para `data/<colecção>/dm.json`.

## Capítulos
`ch0` Unwelcome Spirits · `ch1` A Fateful Competition · `ch2` The Leave-Taking · `ch3` Bazzoxan · `ch4` The Jewel of Hope · `ch5` The Drowned City · `ch6` The Netherdeep · `ch7` The Heart of Despair

## Arcos
`a-prologue` `a-main` `a-lore` `a-ruidium` `a-rivals` `a-kryn` `a-allegiance` `a-consortium` `a-cobalt` `a-sentinels`

## Facções
`f-kryn` Kryn Dynasty · `f-aurora-watch` Aurora Watch · `f-jigow-elders` Conselho de Anciãos de Jigow · `f-luxon` Fé do Luxon · `f-allegiance` Allegiance of Allsight · `f-consortium` Consortium of the Vermilion Dream · `f-cobalt-soul` Library of the Cobalt Soul · `f-sentinels` Sentinels of Memory · `f-hands-of-ord` Hands of Ord · `f-scarbearers` Scarbearers · `f-veil` The Veil · `f-rivals` A companhia dos rivais · `f-dwendalian-empire` Império Dwendaliano · `f-road-raiders` Road Raiders · `f-prime-deities` Prime Deities · `f-betrayer-gods` Betrayer Gods

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
Prólogo: `c-buhfal` `c-bolbara` `c-trush` `c-morgid` `c-pellinost` `c-felmont` `c-alonne-frith` `c-skra-sorsk` `c-mossback-steward`

## Locais principais
`l-urzin` `l-brokenveil-marsh` `l-fort-venture` · `l-jigow` `l-emerald-grotto` `l-prayer-site-sehanine` · `l-xhorhas-road` `l-caravan-stop` · `l-bazzoxan` `l-betrayers-rise` `l-prayer-site-avandra` · `l-ank-harel` `l-crystal-chateau` `l-first-eclipse` `l-temple-of-the-mentor` `l-suncut-bazaar` `l-life-dome` `l-maw-of-cael-morrow` · `l-cael-morrow` `l-temple-of-the-arch-heart` `l-rift` · `l-netherdeep` `l-grottoes-of-regret` `l-vents-of-fury` `l-chasm-of-yearning` `l-heart-of-despair`

## Beats-âncora (referenciados por vários ficheiros)
`b-0-return-to-urzin` · `b-1-jewel-vision` (E12, Jóia Dormant) · `b-2-ushru-dawn` · `b-2-jewel-theft` · `b-3-mouthers` · `b-3-prayer-site-avandra` (R16, Awakened) · `b-3-jewel-confrontation` · `b-4-choose-faction` · `b-5-temple-arch-heart` (M9, Exalted) · `b-5-open-rift` · `b-6-theo-and-hunter` · `b-6-rivals-n26` · `b-7-alyxian-speaks` (convergência) · `b-7-ending-worst` `b-7-ending-neutral` `b-7-ending-best`

## Revelações (ids definitivos — só estes; quem escreve beats referencia-os em `reveals`)
- **Campaign Agendas**: `r-jewel-properties` `r-jewel-three-prayers` `r-shrines` `r-jewel-reactivate` `r-ruidium-properties` `r-ruidium-apotheon-sites` `r-faction-agendas`
- **Lore of Alyxian**: `r-alyxian-ruidus-birth` `r-alyxian-bad-luck` `r-alyxian-three-prayers` `r-alyxian-gruumsh` `r-netherdeep-prison` `r-netherdeep-leaking` `r-perigee` `r-alyxian-wants-remembered` `r-alyxian-split-self`
- **Navegação**: `r-go-to-bazzoxan` `r-cyst-of-avandra` `r-go-to-ank-harel` `r-cael-morrow-entrance` `r-rift-location` `r-rift-key`
- **Facções**: `r-lymmle-traitor` `r-galeokaerda-spy` `r-aboleth-not-alyxian` `r-cryon-vs-alakritos` `r-consortium-funds-sentinels` `r-sixth-missions-doomed`
- **Prólogo**: `r-bolbara-possessed` `r-how-to-save-bolbara` `r-kryn-vs-empire`
