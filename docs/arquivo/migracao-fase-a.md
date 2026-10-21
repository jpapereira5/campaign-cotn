# Migração, fase A: relatório para o DM

Ramo `fase-a`, 2026-10-11. Nada entrou em `main`. Os ficheiros antigos (`data/`, `docs/`) estão intactos.

## 1. O que a verificação diz

```
VERIFICAÇÃO DA MIGRAÇÃO
✓ campanha igual
✓ arcs: 18/18 iguais
✓ characters: 259/259 iguais · acrescentos do mockup: c-pc-tiago
✓ factions: 29/29 iguais · acrescentos do mockup: f-grupo
✓ locations: 191/191 iguais
✓ beats: 222/222 iguais
✓ revelations: 56/56 iguais · acrescentos do mockup: r-alberto-assembleia, r-garra-seis-dedos, r-lia-vidas-passadas, r-padre-entrega-bolbara, r-prisioneira-lia, r-tempestade-truche, r-tranca-branca-lia
✓ ambitions: 8/8 iguais
✓ relações: 446 iguais
✓ beats jogados: 3 iguais
✓ sessões: 5 iguais
✓ docs: 159/159 secções encontradas palavra por palavra
⚠ 29 entidades criadas pela campanha passam de ▲ a ✚ (não estão no livro): characters/c-finalist-team, characters/c-aboleth-do-mar, characters/c-pc-quasi, characters/c-pc-lucan, characters/c-pc-isco, characters/c-yussa-errenis, characters/c-volstrucker-agent, characters/c-nevoa-vendor, characters/c-myriad-jigow-fence, characters/c-myriad-bazzoxan-contact, factions/f-cerberus-assembly, factions/f-myriad, locations/l-obelisco-negro, locations/l-ruins-of-sorrow, locations/l-nevoa-do-brejo, beats/b-0-patrulha-imperio, beats/b-1-festival-seeds, beats/b-1-scarlet-fever, beats/b-1-grotto-ruidium, beats/b-2-ruins-outside-bazzoxan, beats/b-2-vision-perigee-death, beats/b-3-rise-entrances, beats/b-3-beacon-in-barracks, beats/b-3-beacon-heist, revelations/r-scarlet-fever, revelations/r-ruidium-history, revelations/r-myriad-route, revelations/r-assembly-buys-ruidium, revelations/r-beacon-in-barracks
0 diferença(s)
```

## 2. O que foi criado

- `mundo/`: 260 personagens, 30 fações, 191 locais, 63 segredos, 22 itens (12 são handouts), mais `lore.md`.
- `plano/`: 222 beats, 83 fios (18 arco, 8 ambicao, 20 frente, e 37 vindos do mockup), mais `campanha.md`.
- `registo/`: 6 sessões (a zero e as cinco jogadas), com 163 acontecimentos, mais `decisoes.md`.
- `mesa/`: 5 jogadores, 5 fios de mesa (teorias, piadas, regras da casa, confessionário), mais `regras.md`.
- `grelha/`: 108 linhas, `dm.json` vazio, `revisao.json` com 79 notas (15 para decidires, 64 ideias vindas das colunas futuras do mockup).
- `livro/`: cópia tal e qual de `data/book/`.

## 3. O que a app faz nesta fase

- Lê a estrutura nova, montada no build. As vistas são as de hoje e mostram o mesmo.
- A edição está desligada (fichas, marcar jogado, atitudes, notas, sessões): qualquer tentativa mostra a mensagem. Volta na fase D, só pela camada do DM. Até lá, as marcas da mesa entram pelo fecho.
- O token fica guardado para a fase D.

## 4. Decisões tuas, em `grelha/revisao.json`

- **n-mig-01** (discrepancia, c-skra-sorsk): O Skr'a S'orsk morreu na sessão 2 (#83) no cânone, mas docs/pcs.md, docs/ids.md e um patch antigo dizem sessão 1. → _Corrigir para sessão 2 nos três sítios._
- **n-mig-02** (discrepancia, c-soldado-doente): A ficha chama-lhe «O soldado doente da jangada», mas à mesa já tem nome: Alex. → _Passar o nome a «Alex, o soldado da jangada»._
- **n-mig-03** (discrepancia, c-morgid): Os estados da ficha dizem só «Guia dos PCs»; à mesa foi-se embora ofendido na sessão 4 e segue o grupo à distância. → _Acrescentar os estados a partir de b-0-patrulha-imperio._
- **n-mig-04** (pergunta, s-086): A sessão 4 tem dois títulos: «A Traição de Alberto» no estado de jogo e «A Patrulha do Forte Ventura» no cânone e no índice. → _Ficar com «A Traição de Alberto», o título da mesa, e pôr o outro como subtítulo._
- **n-mig-05** (discrepancia, i-adaga-drow): docs/pcs.md e docs/regras.md ainda põem a adaga com o Quasi; desde a sessão 5 está ao cinto do Lucan. → _Atualizar as duas referências._
- **n-mig-06** (discrepancia, docs/fluxo.md): O último fecho registado é o da sessão 4, mas a sessão 5 já foi fechada. → _Atualizar a data do último fecho._
- **n-mig-07** (pergunta, p-pedro-silva): docs/pcs.md diz que o Pedro Silva joga 2 a 3 vezes por mês e também que joga todas as semanas. → _Ficar com «todas as semanas» (cinco sessões seguidas)._
- **n-mig-08** (discrepancia, b-0-urzin-day · s1): O dia em Urzin foi jogado na sessão 1 mas não está marcado como jogado. → _Marcar jogado na sessão 1._
- **n-mig-09** (pergunta, b-0-marsh-crossing): A travessia do pântano está em curso desde a sessão 1, em todas as sessões. → _Confirmar que fica «em curso» até à chegada ao forte._
- **n-mig-10** (pergunta, grelha/linhas.json): As atitudes atuais dos NPCs (campo atitudeAtual) vieram do mockup, não do registo. → _Confirmar a lista; passam a efeitos no fecho seguinte._
- **n-mig-11** (pergunta, s-000): Os efeitos «sabe» da sessão zero (o que cada PC sabe ao começar) estão por preencher. → _Preencher a partir de «O que cada PC sabe ao começar», segredo a segredo._
- **n-mig-12** (discrepancia, r-pc-lucan-sessinek): O beat b-0-boneyard-altar está jogado e é pista de r-pc-lucan-sessinek, mas o cânone diz que a revelação «continua a zero». → _Contar as pistas dadas pelo registo, não pelos beats._
- **n-mig-13** (discrepancia, r-bolbara-possessed): A pista da sessão 5 sobre a Bolbara veio de b-0-patrulha-imperio, que não está nas pistas da revelação. → _Acrescentar o beat às pistas._
- **n-mig-14** (pergunta, t-relogio-terceira-vez · s5): O relógio dos revivify ficou em 2 de 3 por decisão do DM (2026-10-07, #18), sem acontecimento à mesa. → _Confirmar o valor._
- **n-mig-15** (pergunta, registo): Os acontecimentos das sessões 1 a 5 e os seus efeitos foram gerados a partir do mockup; «envolve» foi preenchido por deteção de nomes no texto. → _Rever sessão a sessão na Grelha._

## 5. Os acontecimentos das sessões 1 a 5

Gerados do mockup. Em cada um: id · tipo · dona e quem mais entra · efeitos · de onde nasce. Revê sessão a sessão; o que estiver errado corrige-se no ficheiro da sessão.

### S1 · Chegada a Urzin (2026-09-02) · 29 acontecimentos

Mundo: Dia 1 · nível 3 · beats: b-0-mission-urzin (jogado), b-0-urzin-day (em-curso), b-0-marsh-crossing (em-curso)

- **e-s1-01** · registo · O grupo (+ Ogre Lorde Bufal II, Bol'bara): Contratados pelo Bufal II para resgatar a Bolbara; o nome do grupo fica por decidir.
- **e-s1-02** · cena · Ruín "Isco" Bruma (+ Azrok (capitão hobgoblin de uma tartaruga), Bol'bara): «Bait and vomit»: rouba o hobgoblin e o Azrok; fixa o cheiro da Bolbara no colar de conchas.
- **e-s1-03** · cena · Quasimodo d'Clopin "Quasi" (+ Miríade, Jevan (soldado drow da Dinastia)): Paga a dormida com música; diz «Miríade» ao Jevan.
- **e-s1-04** · registo · Ogre Lorde Bufal II (+ Bol'bara): Contrata o grupo pela Bolbara: «Voltem com ela, ou não voltem de todo.»
- **e-s1-05** · registo · Jevan (soldado drow da Dinastia) (+ Urzin (B1), Ogre Lorde Bufal II): Recebe o grupo à entrada de Urzin e leva-o ao Bufal.
- **e-s1-06** · consequencia · Azrok (capitão hobgoblin de uma tartaruga) (+ Ruín "Isco" Bruma): Humilhado no concurso de cerveja e roubado pelo Isco.
- **e-s1-07** · registo · Litcha das Cinzas (+ Ruín "Isco" Bruma, Bol'bara): Dá ao Isco o colar da Bolbara: «Ela foi buscar algo que só existe no pântano.»
  - efeitos: Ruín "Isco" Bruma, Lucan "Anzol" Bruma, Quasimodo d'Clopin "Quasi" sabe (parcial): «r-bolbara-possessed»
- **e-s1-08** · registo · Morgid (+ Ogre Lorde Bufal II): Dado pelo Bufal como guia; escreve numa lousa e assobia.
- **e-s1-09** · registo · Alberto Pé-Leve, «Gnomis» (o gnomo do tambor) (+ Império Dwendaliano): «Gnomis», alquimista perdido do Império; quer ir para casa.
- **e-s1-10** · registo · Bol'bara (+ Forte Ventura): Desaparecida há três noites; terá sido levada para o Forte Ventura.
  - efeitos: Bol'bara: desaparecido (levada para o Forte Ventura, segundo o Bufal)
- **e-s1-11** · consequencia · Yussa Errenis (+ Urzin (B1)): Mandou os irmãos a Urzin; à mesa, por confirmar (confirmado na S5).
- **e-s1-12** · registo · Skr'a S'orsk (+ Sess'inek, o Emperor Lizard): Quer «dádivas» para o seu senhor, Sess'inek; as flechas começam a voar.
- **e-s1-13** · registo · Império Dwendaliano (+ Ogre Lorde Bufal II): O Bufal: «O Império chegou a Jorhas e só trouxe desgraça.»
- **e-s1-14** · registo · Dinastia Kryn (+ Urzin (B1)): Urzin é vila militar Kryn: «cuidado com os Kryn».
- **e-s1-15** · registo · Miríade (+ Jevan (soldado drow da Dinastia), Urzin (B1)): O Jevan reconhece o nome; a Névoa do Brejo é a porta em Urzin.
- **e-s1-16** · relacao · Lucan ↔ Quasi: Conheceram-se numa rixa: os irmãos foram atirados para a lama e caíram-lhe em cima.
- **e-s1-17** · relacao · Quasi ↔ Alberto: Aceita-o como companhia.
- **e-s1-18** · registo · Urzin (B1): A Carapaça Estalada (duas noites grátis) e o Templo das Cinzas.
- **e-s1-19** · registo · B3 Sunken Boneyard (+ Skr'a S'orsk): Emboscada do Skr'a S'orsk.
- **e-s1-20** · registo · B6 Ritual Stone (+ Morgid, Mapa do Morgid): O Morgid aponta-o no mapa.
- **e-s1-21** · registo · Forte Ventura (+ Ogre Lorde Bufal II, Bol'bara): O Bufal acha que a Bolbara foi levada para lá.
- **e-s1-22** · registo · Resgatar a Bolbara (+ Urzin (B1)): Aceite em Urzin.
  - efeitos: «Resgatar a Bolbara» aberto
- **e-s1-23** · registo · Investigar o rubídio (+ Urzin (B1)): O que trouxe os irmãos a Urzin.
  - efeitos: «Investigar o rubídio» aberto
- **e-s1-24** · consequencia · Névoa do Brejo (+ Miríade, Urzin (B1)): «Clientes diferentes»: a porta da Miríade em Urzin. Ainda não foram.
  - efeitos: «Névoa do Brejo» aberto
- **e-s1-25** · escolha · Dizer «Miríade» ao Jevan (+ Jevan (soldado drow da Dinastia)): O Jevan reconhece o nome e fica a olhar: está acima do que ele pode resolver.
- **e-s1-26** · registo · A terceira vez (+ Bol'bara): A Bolbara desapareceu há três noites.
- **e-s1-27** · pista · r-pc-lucan-sessinek (+ Skr'a S'orsk, Sess'inek, o Emperor Lizard): O Skr'a fala do seu senhor, Sess'inek.
  - efeitos: pista para «r-pc-lucan-sessinek»
- **e-s1-28** · registo · Pedro Ropio · [fecha]: Avisa: Alemanha de 29/09 a 03/10 (não houve sessão a 30/09).
- **e-s1-29** · registo · Piadas internas (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): «Bait and vomit»; nomes para o grupo: Pescadores, Os Mordidos, Alberto e Companhia.

### S2 · A Conquista de Alberto (2026-09-09) · 12 acontecimentos

Mundo: Dia 1, ao entardecer · nível 3 · beats: b-0-marsh-crossing (em-curso)

- **e-s2-01** · cena · Ruín "Isco" Bruma (+ Skr'a S'orsk, Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk)): Mata o Skr'a S'orsk com a besta e dois lizardfolk à dentada.
- **e-s2-02** · cena · Quasimodo d'Clopin "Quasi" (+ Skr'a S'orsk): Quebra a concentração do Skr'a com Vicious Mockery; fica a 5 PV.
- **e-s2-03** · registo · Alberto Pé-Leve, «Gnomis» (o gnomo do tambor) (+ Adaga drow +1, Skr'a S'orsk): Uma adaga a 60 pés quebra a concentração do Skr'a: «A Conquista de Alberto».
- **e-s2-04** · estado · Skr'a S'orsk (+ Ruín "Isco" Bruma) · [fecha]: Morto pelo Isco, com uma seta na cabeça. Linha fechada.
  - efeitos: Skr'a S'orsk: morto
- **e-s2-05** · estado · Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk): Quatro fogem pela água.
  - efeitos: Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk): vivo (fugidos pela água)
- **e-s2-06** · relacao · Quasi ↔ Alberto: «Esta é a parte em que fugimos, não é?» — «Oh não, esta é a melhor parte.»
- **e-s2-07** · escolha · Matar o Skr'a S'orsk: A corte fica sem rei; a resposta veio na S3: os sobreviventes de vigia.
- **e-s2-08** · pista · r-pc-lucan-salvou-isco: Primeira Rage à mesa: a cauda e os olhos vermelhos.
  - efeitos: pista para «r-pc-lucan-salvou-isco»
- **e-s2-09** · registo · Renata: Canta «TPK, TPK» quando aparecem as oito cobras.
- **e-s2-10** · consequencia · Sess'inek: deus de quê?: Procuram-no nos PDFs dos deuses e não o encontram; o DM: «está na terceira caixa».
- **e-s2-11** · registo · Regras da casa: Ressurreição incompleta, insanity tracker, flanking; «ferido» só abaixo de metade.
- **e-s2-12** · registo · Piadas internas (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): «Alberto Bravo»; «Ser nerd salva vidas».

### S3 · O Descanso de Alberto Bravo (2026-09-16) · 27 acontecimentos

Mundo: Dia 1 → meio-dia do dia 2 · nível 3 · beats: b-0-marsh-crossing (em-curso), b-0-boneyard-altar (jogado)

- **e-s3-01** · cena · Lucan "Anzol" Bruma (+ Adaga drow +1): Arranca a adaga do altar: uma fome que não passa e «Perto. Não aqui.»
- **e-s3-02** · cena · Ruín "Isco" Bruma: Pesca a noite toda: peixe para dez.
- **e-s3-03** · cena · Quasimodo d'Clopin "Quasi" (+ Adaga drow +1, Garra de seis dedos): Uma hora com a adaga, outra com a garra; sonha que lidera uma caravana.
- **e-s3-04** · registo · Morgid · [so-dm]: Reza com as mãos na lama, no chão do clã do pai; ninguém lhe pergunta nada.
- **e-s3-05** · registo · Alberto Pé-Leve, «Gnomis» (o gnomo do tambor): Lê o dracónico do altar; o crânio com dente de ouro incomoda-o.
- **e-s3-06** · consequencia · Intendente Duarte Mirim (+ Lucan "Anzol" Bruma): No sonho do Lucan, o drow velho do conselho cruza-lhe o olhar.
- **e-s3-07** · consequencia · Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk): Vigiam o grupo à distância, à espera que saia; alguém voltará ao trono.
  - efeitos: Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk) fica hostil
  - nasce de: e-s2-07
- **e-s3-08** · registo · Dinastia Kryn (+ B3 Sunken Boneyard): Uma couraça Kryn partida ao meio, troféu ao lado do trono do ossário.
- **e-s3-09** · registo · Perceber a ligação a Baeshra: O altar de criança, a fome e o sonho da origem.
- **e-s3-10** · registo · Proteger o irmão (+ Quasimodo d'Clopin "Quasi"): Trava o Quasi: «Voltas a pôr o meu irmão em perigo e não sais deste pântano vivo.»
- **e-s3-11** · registo · Baeshra → Lucan: Primeiro contacto: a fome e «Perto. Não aqui.»; depois cala-se até ao momento escolhido.
- **e-s3-12** · relacao · Lucan ↔ Quasi (+ Adaga drow +1, Quasimodo d'Clopin "Quasi"): Exige a adaga; o Quasi pede 200, depois 400 po. «Não me testes.»
- **e-s3-13** · relacao · Lucan ↔ Isco (+ Ruín "Isco" Bruma): O Isco ouve-lhe a fome a roncar e deixa-lhe peixe ao lado.
- **e-s3-14** · relacao · Quasi ↔ Alberto (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor), Quasimodo d'Clopin "Quasi"): O Alberto dorme agarrado ao Quasi.
- **e-s3-15** · consequencia · B3 Sunken Boneyard (+ Dinastia Kryn, Sete amuletos do trono, Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk)): Saqueado; ficaram a couraça Kryn, os sete amuletos e quatro lizardfolk de vigia.
  - efeitos: Skr'a S'orsk: morto (saqueado no ossário)
- **e-s3-16** · consequencia · B4 Crumbling Tower · [ultima]: Passam ao lado; teias brancas em cada janela.
- **e-s3-17** · consequencia · Adaga drow +1 (+ Lucan "Anzol" Bruma, Quasimodo d'Clopin "Quasi"): Arrancada do altar pelo Lucan; o Quasi fica com ela e recusa vendê-la.
  - efeitos: Adaga drow +1 com Quasimodo d'Clopin "Quasi"
- **e-s3-18** · consequencia · Garra de seis dedos: Cheira a enxofre, como os demónios do Farol Apagado; parece haver mais.
  - efeitos: Garra de seis dedos com Quasimodo d'Clopin "Quasi"
- **e-s3-19** · consequencia · Sete amuletos do trono (+ Lucan "Anzol" Bruma) · [ultima]: O Lucan reconhece três (Semuanya, Melora, Luxon); dois por identificar: um disco de ferro com uma lua e uma mão de madeira de polegar partido.
  - efeitos: Sete amuletos do trono no trono do ossário
- **e-s3-20** · pista · r-pc-baeshra-cla-ro (+ Baeshra, o Grande Devorador): O altar: «Ssarik-Ro» riscado e «Baeshra» por baixo; o sonho da origem pelos olhos do rapaz.
  - efeitos: pista para «r-pc-baeshra-cla-ro»; pista para «r-pc-baeshra-cla-ro»
- **e-s3-21** · pista · r-pc-lucan-salvou-isco (+ Guerreiros lizardfolk do Cemitério Afundado (clã de Skr'a S'orsk)): Come um lizardfolk cru, e a fome não passa.
  - efeitos: pista para «r-pc-lucan-salvou-isco»
- **e-s3-22** · registo · r-garra-seis-dedos (+ Quasimodo d'Clopin "Quasi"): O Quasi descobre-o numa hora de contemplação e esconde-o do grupo.
  - efeitos: Quasimodo d'Clopin "Quasi" sabe (total): «r-garra-seis-dedos»
- **e-s3-23** · pista · r-pc-lucan-sessinek (+ Garra de seis dedos): Trono, seis espadas, postos em cicatrizes de 2, 3 e 5 dedos; a garra tem seis.
  - efeitos: pista para «r-pc-lucan-sessinek»
- **e-s3-24** · consequencia · O crânio com dente de ouro (+ Skr'a S'orsk, Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): Na saia de crânios do Skr'a; o Alberto não diz porquê. Por definir.
- **e-s3-25** · consequencia · O sonho do Quasi (+ Quasimodo d'Clopin "Quasi"): Líder inquestionado de uma caravana. O jogador: o Quasi quer ser questionado, não obedecido. Por decidir.
- **e-s3-26** · registo · Pedro Silva (+ Quasimodo d'Clopin "Quasi"): Quer um Quasi que seja questionado, não obedecido.
- **e-s3-27** · registo · Regras da casa: Vantagem num teste passivo soma +5; encontros com d20, de 16 para cima.

### S4 · A Traição de Alberto (2026-09-23) · 32 acontecimentos

Mundo: Tarde do dia 2 · nível 3 · beats: b-0-marsh-crossing (em-curso), b-0-patrulha-imperio (em-curso)

- **e-s4-01** · registo · O grupo (+ Ruín "Isco" Bruma, Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): No registo da patrulha: «Quá-quá», Anzol, Isco e «o vosso patrão», Alberto.
- **e-s4-02** · cena · Lucan "Anzol" Bruma: Contorna a patrulha sem ser visto; anda na vertical numa árvore, à vista dos soldados.
- **e-s4-03** · cena · Ruín "Isco" Bruma (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): Ouve o sussurro do Alberto (passiva 20); quer libertar a prisioneira.
- **e-s4-04** · cena · Quasimodo d'Clopin "Quasi": Passa os homens-sapo com Suggestion; fica no registo como «Quá-quá».
- **e-s4-05** · cena · Lia (+ Lucan "Anzol" Bruma): Estreia: prisioneira amordaçada na jangada; segue o Lucan com o olhar.
  - efeitos: Lia: preso (na jangada da patrulha, amordaçada); a mesa sabe (total): «r-prisioneira-lia»
- **e-s4-06** · consequencia · Morgid (+ Império Dwendaliano, Lucan "Anzol" Bruma, Mapa do Morgid): Recusa viajar com imperiais; o Lucan tira-lhe o mapa e ele desaparece na lama.
  - efeitos: Morgid: desaparecido (foi-se embora na lama, ofendido)
- **e-s4-07** · consequencia · Alberto Pé-Leve, «Gnomis» (o gnomo do tambor) (+ Sargento Vasco Corvelo): Dá o nome verdadeiro, diz que contratou o grupo e sussurra ao Corvelo.
- **e-s4-08** · registo · Sargento Vasco Corvelo (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): Aceita o grupo como guia; muda de cara depois do sussurro do Alberto.
  - efeitos: Sargento Vasco Corvelo fica neutro
- **e-s4-09** · registo · Batedora Rosinda Sousela, «Lampreia» (+ Lucan "Anzol" Bruma): Escondida na lama; aponta a besta ao Lucan junto à jangada: «Alto!»
  - efeitos: Batedora Rosinda Sousela, «Lampreia» fica desconfiado
- **e-s4-10** · registo · Recruta Elmiro Trigueiro: O recruta do capacete grande de mais, a puxar a jangada.
- **e-s4-11** · registo · Damião Prestes, escriba aprendiz do Padre Perestrelo: Regista os nomes do grupo «para o registo».
- **e-s4-12** · registo · Império Dwendaliano (+ Forte Ventura): Uma patrulha perdida do Forte Ventura; um soldado: «Ou são os piores espiões do mundo…»
- **e-s4-13** · consequencia · Assembleia de Cerebrus (Volstruckers) (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor), Império Dwendaliano) · [so-dm]: O nome verdadeiro do Alberto, mago da Assembleia, ficou num registo imperial.
  - nasce de: e-s4-07
- **e-s4-14** · registo · Encontrar o pai (+ Forte Ventura) · [so-dm]: Deixa-se apanhar pela patrulha para entrar no forte pela porta da frente.
- **e-s4-15** · relacao · Lucan ↔ Isco (+ Quasimodo d'Clopin "Quasi"): Combinam em Thieves' Cant à frente de todos; o Quasi não percebe.
- **e-s4-16** · relacao · Quasi ↔ Alberto (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): «O que é que tu sabes, Alberto?» A confissão fica a meio.
- **e-s4-17** · estado · Mapa do Morgid (+ Morgid, Lucan "Anzol" Bruma, Ruín "Isco" Bruma): Tirado ao Morgid pelo Lucan; passa para a mochila do Isco.
  - efeitos: Mapa do Morgid com Ruín "Isco" Bruma
- **e-s4-18** · registo · Guiar a patrulha ao forte: Aceite: o grupo vai à frente da coluna.
  - efeitos: «Guiar a patrulha ao forte» aberto
- **e-s4-19** · escolha · Tirar o mapa ao Morgid (+ Morgid, Império Dwendaliano): O Morgid percebe e vai-se embora ofendido, com contas por ajustar com o Império.
  - nasce de: e-s4-06
- **e-s4-20** · promessa · 800 po à chegada ao forte (+ Lucan "Anzol" Bruma): Prometidas sem garantia; o Lucan vê que ele diz o que for preciso.
  - efeitos: «800 po à chegada ao forte» aberto
- **e-s4-21** · promessa · Devolver o mapa ao Morgid: Promete devolvê-lo se os caminhos se cruzarem.
  - efeitos: «Devolver o mapa ao Morgid» aberto
- **e-s4-22** · consequencia · Frente: Dinastia Kryn (+ Império Dwendaliano) · [so-dm]: A frente diz «observam quem enfrentou o Império no Pântano do Véu-Quebrado»; o grupo, em vez disso, guiou uma patrulha imperial.
- **e-s4-23** · registo · Guerra Império–Dinastia (+ Império Dwendaliano): Patrulhas imperiais na fronteira: «Há mais patrulhas neste pântano.»
- **e-s4-24** · registo · O Damião vê algo estranho (+ Lucan "Anzol" Bruma): Quase: o Lucan anda na vertical numa árvore.
- **e-s4-25** · pista · r-alberto-assembleia (+ Ruín "Isco" Bruma, Quasimodo d'Clopin "Quasi", Sargento Vasco Corvelo): O Isco ouve o sussurro; o Quasi vê o sorriso do Corvelo.
  - efeitos: pista para «r-alberto-assembleia»
- **e-s4-26** · pista · r-prisioneira-lia (+ Lucan "Anzol" Bruma): Drow amordaçada na jangada; segue o Lucan com o olhar.
  - efeitos: pista para «r-prisioneira-lia»
- **e-s4-27** · consequencia · As aves de sudoeste: Passam de sudoeste para nordeste; ninguém lhes deu seguimento.
- **e-s4-28** · registo · Renata: Ajuda a Camila com as cartas de feitiços.
- **e-s4-29** · registo · Camila: Estreia; tem de sair às 23h.
- **e-s4-30** · consequencia · O Alberto joga dos dois lados (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor), Sargento Vasco Corvelo): «A Traição de Alberto»: o sussurro e o sorriso do Corvelo.
  - nasce de: e-s4-07
- **e-s4-31** · registo · Piadas internas (+ Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): «A Traição de Alberto», assumidamente clickbait; «Quá-quá».
- **e-s4-32** · consequencia · Confessionário: Falou-se em fazê-lo na semana sem sessão.

### S5 · As Noites da Terceira Lança (2026-10-07) · 59 acontecimentos

Mundo: Noite do dia 2 → meio-dia do dia 4 · nível 3 · beats: b-0-patrulha-imperio (jogado), b-0-marsh-crossing (em-curso)

- **e-s5-01** · consequencia · O grupo (+ Livro de registos do escriba, Damião Prestes, escriba aprendiz do Padre Perestrelo, Alberto Pé-Leve, «Gnomis» (o gnomo do tambor)): No livro do escriba: «liderados por um gnomo chamado Alberto», com 800 po prometidas.
  - nasce de: e-s5-35
- **e-s5-02** · cena · Lucan "Anzol" Bruma (+ Adaga drow +1): Medita com a adaga junto à fogueira; come uma cobra viva à vista da patrulha.
- **e-s5-03** · cena · Ruín "Isco" Bruma (+ Recruta Elmiro Trigueiro, Yussa Errenis): Pesca com o Elmiro e alimenta a coluna inteira; manda um sending ao Yussa.
- **e-s5-04** · cena · Quasimodo d'Clopin "Quasi" (+ Livro de registos do escriba, Damião Prestes, escriba aprendiz do Padre Perestrelo, Sargento Vasco Corvelo): Lê o livro do escriba; ao Corvelo: «a pior coisa que me podia acontecer já me aconteceu».
- **e-s5-05** · cena · Lia (+ O soldado doente da jangada, Recruta Elmiro Trigueiro): Cura o Alex com Lesser Restoration à frente do Elmiro e é amarrada a sério.
  - nasce de: e-s5-36
- **e-s5-06** · estado · Morgid · [so-dm]: Segue o grupo à distância.
  - efeitos: Morgid: vivo (a seguir o grupo à distância)
- **e-s5-07** · registo · Alberto Pé-Leve, «Gnomis» (o gnomo do tambor) (+ Livro de registos do escriba, Damião Prestes, escriba aprendiz do Padre Perestrelo): No livro do escriba, como líder do grupo.
- **e-s5-08** · registo · Sargento Vasco Corvelo (+ B7 Falésias do Véu-Quebrado, Lia): Único sobrevivente de um pelotão emboscado nas falésias; manda amarrar a Lia a sério.
  - nasce de: e-s5-36
- **e-s5-09** · consequencia · Batedora Rosinda Sousela, «Lampreia»: Desaparece a noite inteira do dia 3 e volta enlameada, sem explicação.
- **e-s5-10** · consequencia · Recruta Elmiro Trigueiro (+ Lia, O soldado doente da jangada, Sargento Vasco Corvelo): Vê a Lia curar o Alex e conta ao sargento. Já sabe o que o grupo vale.
  - efeitos: Recruta Elmiro Trigueiro fica desconfiado
  - nasce de: e-s5-36
- **e-s5-11** · consequencia · Damião Prestes, escriba aprendiz do Padre Perestrelo (+ Livro de registos do escriba): Entrega o livro sob feitiço: «Eles irão saber.»
  - nasce de: e-s5-35
- **e-s5-12** · estado · O soldado doente da jangada (+ Lia): Curado da febre do pântano pela Lia.
  - efeitos: O soldado doente da jangada fica amigavel; O soldado doente da jangada: vivo (curado da febre do pântano)
  - nasce de: e-s5-36
- **e-s5-13** · consequencia · Bol'bara (+ Livro de registos do escriba, Forte Ventura, Padre Perestrelo): No livro: na capela do forte, sob estudo do padre; «ainda não disse a palavra certa».
  - efeitos: Bol'bara: preso (na capela do Forte Ventura, sob estudo do padre); Quasimodo d'Clopin "Quasi" sabe (parcial): «r-padre-entrega-bolbara»
  - nasce de: e-s5-35
- **e-s5-14** · registo · Padre Perestrelo (+ Livro de registos do escriba, Damião Prestes, escriba aprendiz do Padre Perestrelo): No livro: «ele não a deixa morrer»; para o escriba, é «a pessoa mais competente».
  - nasce de: e-s5-35
- **e-s5-15** · consequencia · Alone Fritz (+ Livro de registos do escriba): No livro: um homem perdido no pântano, guardado «para mais investigação».
  - efeitos: Alone Fritz: preso (no Forte Ventura, «para mais investigação»)
  - nasce de: e-s5-35
- **e-s5-16** · consequencia · Yussa Errenis: Responde ao sending: «Há uma guerra agora. Há algum sinal daquilo que procurou?»
  - nasce de: e-s5-03, e-s1-11
- **e-s5-17** · registo · Dinastia Kryn (+ Recruta Elmiro Trigueiro): O Elmiro: «Vocês não são da dinastia, pois não?»
- **e-s5-18** · registo · Biblioteca da Alma de Cobalto (+ Lia, Saco da Lia): O selo de expositor do pai da Lia está no saco, na jangada.
  - nasce de: e-s5-32
- **e-s5-19** · consequencia · Tirar a maldição: poder ser visto (+ Damião Prestes, escriba aprendiz do Padre Perestrelo, Padre Perestrelo): O Damião remete as maldições para o Padre Perestrelo, «a pessoa mais competente».
- **e-s5-20** · relacao · Lucan ↔ Quasi (+ Quasimodo d'Clopin "Quasi") · [fecha]: Rouba-lha a dormir e devolve-a; de manhã o Quasi dá-lha: «Toma, fica com ela.»
  - nasce de: e-s3-12
- **e-s5-21** · relacao · Lucan ↔ Isco (+ Sargento Vasco Corvelo): Em halfling: os soldados do sargento são inúteis.
- **e-s5-22** · relacao · Isco ↔ Lia: Falam baixo na jangada; na noite seguinte ele folga-lhe as cordas, e ela sabe que foi ele.
- **e-s5-23** · relacao · Quasi ↔ Damião: Desenha-o enquanto conversam e estende a mão para lhe tirar a máscara.
- **e-s5-24** · relacao · Isco ↔ Elmiro (+ Recruta Elmiro Trigueiro, Sargento Vasco Corvelo): Pescam juntos; na noite seguinte o Elmiro escolhe o sargento e conta o que viu.
  - nasce de: e-s5-36
- **e-s5-25** · consequencia · B6 Ritual Stone: À vista, num espelho de água: as rãs coaxam mais grave e a lama demora a fechar.
- **e-s5-26** · registo · Forte Ventura: Os trovões vêm sempre do lado do forte, a oeste.
- **e-s5-27** · consequencia · B7 Falésias do Véu-Quebrado (+ Sargento Vasco Corvelo, Lia): Onde «mãos invisíveis» emboscaram o pelotão do Corvelo, e onde a Lia esperou que a apanhassem.
- **e-s5-28** · estado · Adaga drow +1 (+ Lucan "Anzol" Bruma) · [fecha]: Agora ao cinto do Lucan.
  - efeitos: Adaga drow +1 com Lucan "Anzol" Bruma
  - nasce de: e-s3-17
- **e-s5-29** · estado · Garra de seis dedos (+ Livro de registos do escriba, Damião Prestes, escriba aprendiz do Padre Perestrelo): Usada para tirar o livro ao escriba.
  - nasce de: e-s5-35
- **e-s5-30** · estado · Mapa do Morgid (+ Lucan "Anzol" Bruma): Com o mapa e o sextante, o Lucan perde-se dois dias seguidos.
- **e-s5-31** · consequencia · Livro de registos do escriba (+ Quasimodo d'Clopin "Quasi", Bol'bara): Lido pelo Quasi: a Bolbara, um homem preso, as 800 po. «As páginas são contadas.»
  - efeitos: Livro de registos do escriba com Damião Prestes, escriba aprendiz do Padre Perestrelo
  - nasce de: e-s5-35
- **e-s5-32** · consequencia · Saco da Lia: Armas, armadura, símbolo sagrado, o pendente, o selo de expositor e o dinheiro do pai.
  - efeitos: Saco da Lia na jangada da patrulha
- **e-s5-33** · registo · Resgatar a Bolbara (+ Forte Ventura): Destino confirmado: a capela do forte.
  - nasce de: e-s5-35
- **e-s5-34** · registo · Guiar a patrulha ao forte: Dois dias perdidos em círculos: a chegada escorrega pelo menos um dia.
  - nasce de: e-s5-30
- **e-s5-35** · escolha · Ler o livro do escriba (+ Garra de seis dedos, Damião Prestes, escriba aprendiz do Padre Perestrelo): À força de Suggestion e do Command da garra; o escriba avisa: «Eles irão saber.»
- **e-s5-36** · escolha · Curar o Alex à vista do Elmiro (+ Recruta Elmiro Trigueiro, Sargento Vasco Corvelo, Lia): O Elmiro conta ao sargento e a Lia é amarrada a sério.
- **e-s5-37** · promessa · 800 po à chegada ao forte (+ Livro de registos do escriba, Sargento Vasco Corvelo): No livro: «Não sabia que o sargento tinha tanto dinheiro para dar às pessoas.»
  - nasce de: e-s5-35
- **e-s5-38** · promessa · O segredo da máscara (+ Quasimodo d'Clopin "Quasi"): Fica entre os dois; se se lembrar de alguma coisa, fala primeiro com o Quasi. Guarda um esboço.
  - efeitos: «O segredo da máscara» aberto
  - nasce de: e-s5-23
- **e-s5-39** · promessa · O Alex deve a vida à Lia (+ Recruta Elmiro Trigueiro) · [trunfo]: Curado da febre do pântano à frente do Elmiro.
  - efeitos: «O Alex deve a vida à Lia» aberto
  - nasce de: e-s5-36
- **e-s5-40** · consequencia · A terceira vez (+ Livro de registos do escriba) · [so-dm]: Dois dias perdidos no pântano. No livro, o relógio acabava ao dia 3; o grupo vai no dia 4.
  - efeitos: relógio «A terceira vez» = 2
- **e-s5-41** · registo · Urzin sem seer (+ Ogre Lorde Bufal II, Bol'bara) · [so-dm]: Fora de cena: o Bufal não confia que voltem e pondera quem substitui a Bolbara.
- **e-s5-42** · registo · Guerra Império–Dinastia (+ Sargento Vasco Corvelo): O Corvelo: «Há quem diga que era inevitável. Há quem diga que foi provocada.»
- **e-s5-43** · registo · Tocar na pedra (+ B6 Ritual Stone): A pedra à vista.
- **e-s5-44** · consequencia · O Damião vê algo estranho (+ Lucan "Anzol" Bruma): Cumprido: o Lucan come uma cobra viva à vista do acampamento.
  - efeitos: «O Damião vê algo estranho» cumprido
  - nasce de: e-s5-02
- **e-s5-45** · consequencia · A máscara do Quasi cai (+ Damião Prestes, escriba aprendiz do Padre Perestrelo, Quasimodo d'Clopin "Quasi"): Quase: o Damião estende a mão para lha tirar e o Quasi impede-o.
  - nasce de: e-s5-23
- **e-s5-46** · pista · r-pc-lucan-salvou-isco: Come uma cobra viva.
  - efeitos: pista para «r-pc-lucan-salvou-isco»
- **e-s5-47** · pista · r-padre-entrega-bolbara (+ Livro de registos do escriba): No livro: «ele não a deixa morrer»; «ainda não disse a palavra certa».
  - efeitos: pista para «r-padre-entrega-bolbara»; pista para «r-padre-entrega-bolbara»
  - nasce de: e-s5-35
- **e-s5-48** · registo · r-garra-seis-dedos (+ Damião Prestes, escriba aprendiz do Padre Perestrelo): Usa-a no escriba, sem ninguém do grupo ver.
  - nasce de: e-s5-35
- **e-s5-49** · pista · r-tempestade-truche: Relâmpago sem som, trovões a oeste o dia inteiro, trovoada à noite; de manhã, céu limpo.
  - efeitos: pista para «r-tempestade-truche»; pista para «r-tempestade-truche»; pista para «r-tempestade-truche»
- **e-s5-50** · pista · r-prisioneira-lia (+ Recruta Elmiro Trigueiro): O Elmiro: «estava sentada à espera deles»; lança feitiços.
  - efeitos: pista para «r-prisioneira-lia»; pista para «r-prisioneira-lia»
- **e-s5-51** · pista · r-tranca-branca-lia (+ Damião Prestes, escriba aprendiz do Padre Perestrelo): Uma madeixa branca platinada, entrançada no pulso esquerdo do Damião.
  - efeitos: pista para «r-tranca-branca-lia»
- **e-s5-52** · consequencia · A adaga reage à Lia (+ Lucan "Anzol" Bruma, Lia): As duas vezes que o Lucan pega nela, a fome baixa e o olhar vai para a Lia. Por decidir.
- **e-s5-53** · consequencia · Os mortos-vivos sem dono (+ Sargento Vasco Corvelo): Arrastam-se todos para o mesmo lado, sem reagir ao grupo; o Corvelo não comenta.
- **e-s5-54** · registo · Renata (+ Lucan "Anzol" Bruma): Pede um sextante para o Lucan (background).
- **e-s5-55** · registo · Pedro Silva: Quinta sessão seguida: recorde pessoal.
- **e-s5-56** · consequencia · Camila (+ Ruín "Isco" Bruma): Duas sessões amarrada, a falar quase só com o Isco.
  - nasce de: e-s4-05
- **e-s5-57** · registo · Tiago Rosa: Entra daqui a duas semanas; personagem por definir.
- **e-s5-58** · registo · Regras da casa: PVP permitido; Suggestion e Command não avisam o alvo.
- **e-s5-59** · registo · Piadas internas: «Este episódio foi trazido pela Coca-Cola».

## 6. Como aprovar

Diz o que corrigir (ou corrige nos ficheiros do ramo). Quando disseres «entra», faço o merge de `fase-a` em `main` e o deploy segue.
