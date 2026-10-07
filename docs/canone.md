# Cânone da mesa: o que foi jogado vs. o que estava preparado

**O que a mesa jogou manda.** Quando a sessão contradiz a preparação, a preparação é **reescrita** nos ficheiros (`data/campaign/`, `docs/lore.md`, `docs/regras.md`) para passar a dizer o que aconteceu; este documento fica com o registo do que lá estava antes, para não se perder a intenção original. Quando o conflito é entre coisas ditas em sessões diferentes — ou dentro da mesma sessão — nada se decide sozinho: fica assinalado no fim, até o DM decidir, e depois passa a **Decidido**.

Regista, por sessão, **o que a preparação acertou**, **o que mudou em jogo** (e onde já foi corrigido) e **o que continua por revelar**. Os resumos estão em [`docs/sessoes/`](sessoes/); as fichas afetadas ficam com a nota «a mesa (sessão N, #NN)» em `data/campaign/`.

Começa na sessão 3 (#84), a primeira em que uma cena preparada com runsheet (`b-0-boneyard-altar`) foi jogada.

## Sessão 3 (#84, 2026-09-16) — O Santuário do Véu-Quebrado

Beat preparado: `b-0-boneyard-altar` (PROPOSTA · "O Santuário do Véu-Quebrado"), com o loot do Cemitério Afundado à volta. Jogado no fim da tarde do dia 1 e na noite seguinte.

### Confirmado como estava preparado

- **O templo é dentro do maior crânio de tartaruga**: entra-se por onde a mandíbula assentou, o interior é seco e mais frio, e ao fundo há um **trono talhado no osso** com **seis espadas** à volta, na abóbada.
- **A hierarquia está escrita no chão**: garra de cinco dedos desenhada por fora do crânio maior, e — acrescento da mesa — cicatrizes tatuadas de mãos de **dois** e **três** dedos nos guerreiros, **cinco** no peito de Skr'a. O Isco tirou a conclusão certa (Investigation 15): é um sistema de postos.
- **O altar de criança**: crânio de lizardfolk com dois chifres mal encaixados, escama e dente embutidos, a **adaga cravada até ao cabo**, o nome **"Ssarik-Ro"** riscado e **"Baeshra"** por baixo, em dracónico, lido pelo Alberto.
- **O Wisdom save passou**, e com ele a versão lúcida da visão: conta **três** anciãos, vê o **dodecaedro** por fora, e o **cruzar de olhares com o drow** acontece.
- **A fome que não é dele** chega ao Lucan e não passa com comida.
- A adaga não se deixa explicar: History 3 dá "não foi feita por lizardfolk" e mais nada. O `detect magic` não prova autoria nenhuma, como previsto.

### Mudou em jogo (o cânone é o da mesa — já reescrito nos ficheiros)

Corrigidos: `data/campaign/locations/{pcs,zz-mesa-patches}.json` (`l-sunken-boneyard`, `l-brokenveil-marsh`), `data/campaign/beats/pcs.json` (`b-0-boneyard-altar`, `b-1-mirimm-reconhece`), `docs/lore.md` e `docs/regras.md`.

1. **A visão não aconteceu no altar.** No altar houve só a fome e a voz; a visão inteira veio no **sonho do long rest**, nessa noite. Consequência: a mesa **não** viu o Lucan parado, a chorar, sem responder — a janela para os outros agirem não chegou a existir, e a cena pública do Lucan sem controlo fica por jogar.
2. **A voz disse outra coisa.** Não foi "Alimenta-te. Devora. Tal como eles devoraram." — foi **"Perto. Não aqui."**, e o olhar do Lucan virou-se para o Quasi (que tinha a adaga e a garra). Frase muito mais fechada; é o que existe.
3. **O Lucan lembra-se de ter pegado na adaga.** Arrancou-a do altar deliberadamente, de joelhos com a fome. Cai o remate "não te lembras de teres pegado em nada, mas está na tua mão".
4. **O altar não está a três metros do trono.** Está noutro crânio — o **mais pequeno**, de uma tartaruga jovem, sem nada desenhado por fora, com entrada de gatas. Encaixa melhor: é o crânio onde o rapaz deitou o pai, "onde a chuva não entra".
5. **A garra deixou de ser cenário.** Estava **ao peito do xamã**, não pendurada no templo; tem **seis** dedos (nem réptil, nem lizardfolk); cheira a enxofre como os demónios do Farol Apagado (Isco); e é **mágica**: o Quasi tirou-lhe *Command* 1×/dia numa hora de contemplação, e ficou com a sensação de que há mais. Deixa de valer o "nada está ativo e nada é perigoso" no que toca à garra — e ela é agora do **Quasi**, não do Lucan.
6. **Sess'inek não foi nomeado.** A Religion 19 foi gasta nos sete amuletos (Semuanya, Melora, Luxon reconhecidos; disco de ferro com lua e mão de madeira de polegar partido por identificar). A mesa saiu do ossário sem saber de quem é a corte — e já na sessão 2 tinha procurado Sess'inek nas listas de divindades sem o encontrar. `r-pc-lucan-sessinek` continua a zero: a mão de garras é o único aviso, como planeado.
7. **Os do clã não são os últimos.** Sobraram lizardfolk vivos, parados à distância à espera que o grupo saísse (Isco, passiva 20). Cai a premissa de que "ninguém pode confirmar nem desmentir o que o santuário é" — há testemunhas no pântano, e alguém voltará ao trono.
8. **A adaga saiu do pântano com o Quasi**, não com o Lucan: foi ele que a identificou (dagger +1) e recusou-se a entregá-la de manhã (200 po, depois 400; o Lucan respondeu "não me testes"). A escolha "Levar a adaga" do beat está meio jogada: `b-1-mirimm-reconhece` tem de ser escrito sem assumir que é o Lucan que a traz ao cinto.
9. **Skr'a S'orsk morreu na sessão 2 (#83)**, não na sessão 1 — corrigido em `docs/lore.md` e nas fichas. Foi saqueado na sessão 3.

### Por revelar (a mesa ainda não sabe)

- Que o rapaz da visão é **Baeshra**, e que o clã é o **clã Ro** — falta `b-0-hesskar-ro` (o pai do Morgid, em Urzin) para fechar `r-pc-baeshra-cla-ro`.
- Que o drow velho do conselho é **Duarte Mirim**, hoje Intendente de Jigau, e que foi ele que cravou aquela adaga no peito do pai — `r-pc-lucan-adaga` fica nos degraus de reconhecimento, para Jigau.
- Que a corte é de **Sess'inek** e que Skr'a era um lizard king — `r-pc-lucan-sessinek`.
- Que o Morgid rezava no chão do clã do pai: rezou de costas para o grupo e ninguém lhe perguntou nada.

### Fios novos que a mesa criou (não estavam na preparação)

- **O crânio pequeno com dente de ouro** na saia de Skr'a (halfling ou gnomo) incomodou o Alberto, que não disse porquê. Por definir.
- **A garra e o sonho do Quasi**: na mesma noite em que contempla a garra, sonha que é líder inquestionado de uma caravana. Decidir se é a garra a empurrar (*monkey's paw*) ou só ele — o jogador já disse que o Quasi quer ser questionado, não obedecido, e que o sonho o perturbou por isso.
- **O sangue de Skr'a**: vermelho quase preto, espesso, com brilho de óleo na água, e cheiro que o Isco liga às entidades de sombra do **Farol Apagado**. Um xamã de pântano com sangue demoníaco pede explicação.
- **Os dois amuletos por identificar** (disco de ferro com uma lua; mão de madeira com o polegar partido).
- **Os seis dedos**: se cinco é o posto do rei, de quem é a mão de seis? (Sess'inek tem seis braços e seis espadas: guardar para a Ascensão dos Traidores.)
- **Lucan contra Quasi**: ameaça de morte explícita no ossário e a adaga por resolver entre os dois.
- **Encontro garantido** (d20 = 18) no segundo terço do dia 2, a caminho do obelisco, com a torre B4 das aranhas deixada para trás por explorar.

## Decidido pelo DM (2026-09-21)

Os quatro conflitos que estavam assinalados aqui foram resolvidos e o cânone já está corrigido nos ficheiros:

1. **O clã Ro caiu em 809 PD, há 27 anos.** Os «~50 anos» saíram das fichas do `c-hesskar-ro` e do `c-morgid` e da relação `c-durth-mirimm → clã Ro`. Bate certo com a idade do Baeshra: 7 anos na queda, 33 no *wish*, deus há um ano.
2. **Sobreviveram quatro lizardfolk** — o que mergulhou no início do combate mais os três da retirada. São os que ficaram a vigiar o grupo no ossário na sessão 3. Corrigido no resumo da sessão 2 e na ficha `c-lizardfolk-do-ossario`.
3. **A greatsword está com o Isco.** Não se disse mais nada à mesa, mas recuperou-a antes de sair do ossário; deixou de constar como largada na lama.
4. **Os crânios do ossário são tartarugas-do-horizonte em geral.** «As irmãs mortas do Guardião do Musgo» é a maneira de falar delas, não uma ninhada contada: umas são maiores, outras mais pequenas, e a diferença não quer dizer nada — o crânio do altar ser de uma tartaruga jovem não precisa de explicação.

### Resolvido pela própria sessão (não é conflito)

- **Dado de encontros**: a sessão 1 usou um d12; na sessão 3 o DM corrigiu-se («enganei-me, é um d20 — 16 ou mais acontece alguma coisa»). Vale o d20; a nota da sessão 1 no patch do pântano ficou marcada como substituída.
- **Hexágonos do dia 2**: o DM deu por um erro de um hexágono no seu mapa e corrigiu-o em jogo antes de contar a viagem.

## Decidido pelo DM (2026-10-01)

Fechado em conversa de preparação (sem sessão jogada). O cânone já está corrigido nos ficheiros.

1. **A campanha passa-se em 835 P.D.**, não em 836: antes de os Mighty Nein mudarem a guerra, mas já com ela em curso. Consequências corrigidas em `docs/lore.md`, `docs/pcs.md` e nos dados: o **Baeshra é deus há poucos meses** (o *wish* foi em 835, aos 33), e o **clã Ro caiu em 809 P.D., há 26 anos** (substitui o «há 27 anos» da decisão de 2026-09-21; a idade do Baeshra continua a bater: 7 na queda, 33 no *wish*). As datas do Caderno Volstrucker (versão anterior) ficam como estão.
2. **A rota do rubídio.** O **canal da Assembleia** é o do norte (Bazzoxan → Jigau → Urzin → Império). Há um **ramal para sul, por Asarius, até Decrépola** (Rotthold), para o mercado negro e para a célula secreta da Assembleia em Decrépola. O **primeiro lote**, antes do canal, chegou a Decrépola **por mar, de Marquet**. Corrigido em `f-myriad`, `r-myriad-route`, `docs/lore.md` e `docs/pcs.md`.
3. **Decrépola e os contactos dos irmãos Bruma**: o recetador **Ossório Lume** (Miríade, Mercado Vermelho) e o **Remendo** (tripulação da Marisa, no Cais; é o fio para a Marisa). Handout em `docs/handouts.md`. Os dois nomes foram inventados na conversa e podem mudar.
4. **O Vigost é do culto de Ceratos, mas não enviou o Fritz: estuda as motivações dele.** Os jogadores não sabem. Ficha `c-vigost`; patches em `c-alonne-frith` e `f-culto-ceratos`.
5. **Glossário pt-PT** fechado e copiado para [`docs/glossario.md`](glossario.md). Aplicado em `docs/lore.md` e `docs/handouts.md`; o resto dos dados ainda usa alguns nomes antigos (ver o fim do glossário).
6. **Ritmo da travessia: 10 hexágonos por dia a ritmo normal** (EGtW), cerca de um terço por terço do dia. Cai a leitura de «10 por terço» de `docs/regras.md`; o dia 2 da sessão 3 corrigido para quatro hexágonos de manhã, como no resumo.
7. **Fações para os jogadores:** não há documento de fações. O DM sugere as ligações a cada jogador, por alto e sem nomes.

## Sessão 4 (#86, 2026-09-23) — A Patrulha do Forte Ventura

Beat preparado: `b-0-patrulha-imperio` (`sessao-04-preparacao_v2.md`, Drive). É o encontro garantido do cliffhanger da sessão 3 (d20 = 18 no terço da tarde do dia 2). Jogado da tarde ao pôr-do-sol do dia 2; a noite fica por jogar. Resumo em [`docs/sessoes/sessao-04-2026-09-23.md`](sessoes/sessao-04-2026-09-23.md).

### Confirmado como estava preparado

- **A patrulha está perdida** e cansada (Insight passivo do Isco), com comida para um dia, a andar no sentido contrário ao forte. O Isco cheira-a (febre, lã molhada, metal) antes de a ver.
- **A prisioneira drow na jangada é a Lia**, amordaçada e amarrada; deixou-se apanhar. Os PCs não sabem quem é; a mesa soube fora de jogo, no fim.
- **O Corvelo leva a mão ao apito antes de decidir**, quer chegar a casa e diz o que for preciso para isto andar (Insight 17 do Lucan: "resignada aceitação").
- **A Lampreia (Sousela) está escondida na lama** e só aparece quando o sargento a chama. O grande do escudo (Casqueiro), o recruta do capacete grande (Elmiro) a puxar a jangada e o escrivão a pedir os nomes "para o registo" (Damião) aparecem como preparados, ainda sem nome à mesa.
- **O Alberto joga os dois lados com uma mensagem sussurrada** (*message*) logo a seguir a falar, e só a passiva 20 do Isco a apanha. Lançar magia é confissão: o Isco ouviu-a, sem saber o que era.
- **Escolha jogada: «Contrato de guias / escolta em conjunto»** — seguem com a patrulha e a jangada para o forte.

### Mudou em jogo (o cânone é o da mesa — já reescrito nos ficheiros)

Corrigidos: `data/campaign/beats/patrulha.json` (`b-0-patrulha-imperio`), `data/campaign/characters/patrulha.json` (fichas da patrulha e `c-soldado-doente`), `data/campaign/characters/mesa.json` (`c-alberto-gnomis`), `data/campaign/characters/zz-mesa-patches.json` (`c-morgid`, `c-pc-quasi`, `c-pc-lucan`, `c-pc-isco`), `data/campaign/characters/lia.json`, `data/campaign/locations/zz-mesa-patches.json` (`l-brokenveil-marsh`), `docs/regras.md` e `docs/pcs.md`.

1. **A mensagem do Alberto foi para o Corvelo**, não para a Nália: foi a cara do sargento que mudou (carregada, espanto, olhos semicerrados, sorriso contido). O conteúdo preparado («o gnomo é da Assembleia») fica como segredo do DM. Ao grupo, o Alberto diz que só avisou que eles eram fortes de mais.
2. **O preço são 800 po à chegada ao forte, sem garantia** — não os 30 po por Persuasão da preparação. O Corvelo não as tem.
3. **A Sousela tem besta**, não arco longo, e levantou-se da lama do lado oposto ao que o Lucan contornou. Fica com o primeiro turno de vigia, com o Lucan.
4. **O doente é um sétimo imperial**, deitado na jangada com um pano na testa (`c-soldado-doente`, sem nome). O Elmiro não está deitado: anda a pé, pálido, e puxa a jangada. A patrulha são seis soldados de pé, mais o doente e a prisioneira; com o grupo, treze, e doze depois de o Morgid sair.
5. **O Morgid não ficou a ver passar.** Recusou-se a viajar com imperiais, mostrou a cicatriz do pescoço, resistiu a duas Persuasões do Lucan (10 contra 18 e 20), perdeu o mapa para ele (Sleight of Hand 21 contra 20, e percebeu) e desapareceu na lama. Cai a escolha «Deixar passar» (e a lousa «6 soldados. 1 prisioneira. Forte.») e a regra da jangada «com o Morgid». O mapa ficou com o Isco, que agora navega.
6. **As aves já vinham em voo, de sudoeste para nordeste** — não levantaram ali nem fugiam de leste. Vêm da direção do forte (decisão abaixo).
7. **O Alberto deu o nome completo e verdadeiro**: Alberto Pé-Leve. Está no livro do escrivão, ao lado de "Quá-quá", Anzol e Isco. Um nome num relatório imperial pode chegar à Assembleia.
8. **O escrivão não mandou o Quasi tirar a máscara**: registou-o como "Quá-quá", por cortesia do Isco.
9. **Encontro do último terço do dia 2**: d20 = 16, d12 = 4 → quatro homens-sapo (os bullywugs do B5), um deles com um capacete imperial posto ao contrário e um trapo vermelho na lança — despojos dos dois homens que o Corvelo perdeu no B5. Passaram com peixe e *Suggestion*.
10. **Nada do menu de informação do forte saiu**, e nada sobre a Bolbara: `r-bolbara-possessed` e `r-how-to-save-bolbara` continuam a zero. O Corvelo só disse que há mais patrulhas no pântano.

### Por revelar (a mesa ainda não sabe)

- Quem é a prisioneira e o que quer (o Isco quer libertá-la de noite).
- O que o Alberto sussurrou, e que é mago da Assembleia de Cerebrus.
- Que as 800 po não existem.
- O menu do forte: guarnição de trinta e poucos, metade doente; o Felmont manda menos do que devia; a goblin velha acorrentada na capela; o Padre veio de fora; o prisioneiro «que não pisca» (o Fritz); a palavra-passe «Cinza-Doze»; o carregamento pelo norte; o livro de registos.
- O Bento Ruivo e os dois mortos no B5.

### Fios novos que a mesa criou (não estavam na preparação)

- **O Morgid foi-se embora roubado e ofendido**, com contas por ajustar com o Império. Foi o Bufal que o deu ao grupo: volta a Urzin? Com que história?
- **O mapa de marcas visuais**, sem quem o leia.
- **O Lucan andou na vertical numa árvore à vista dos soldados**, que se acotovelaram a apontar. O Damião, pela preparação, muda de alvo quando vê coisas destas.
- **Intenções para a noite do dia 2**: Isco pescar junto à jangada e libertar a prisioneira; Quasi perguntar ao soldado do turno qual era a missão; Lucan só vigia. Cada turno tem um soldado: Lucan com a Sousela, Quasi com o escrivão (Damião), Isco com o Elmiro (decisão do DM, 2026-10-07).
- **Os irmãos combinaram em Thieves' Cant à frente de toda a gente**; o Quasi não percebeu.

### Corrigido face ao resumo da Drive

- O resumo dizia que era a primeira vez que a mesa ouvia falar do forte. Não é: na sessão 1 o Bufal disse que a Bolbara foi levada para o Forte Ventura, e o Alberto queria ir para lá desde Urzin. A mesma frase saiu do beat.
- O encontro dos homens-sapo não foi «da tarde»: o da tarde foi a patrulha (o 18 da sessão 3); este foi o d20 do último terço.

## Decidido pelo DM (2026-10-07)

Fechado na revisão da sessão 4. O cânone já está corrigido nos ficheiros.

1. **A Lia tem pele azul-acinzentada** (como se disse à mesa). Substitui «pele obsidiana» da ficha.
2. **As aves vieram da direção do forte.**
3. **A cicatriz do pescoço do Morgid foi o Império.** Não foi esta patrulha: o Corvelo nunca o viu.
4. **Os PCs sabem ler a lousa do Morgid: ele escreve em comum.** Cai o «que os PCs não sabem ler» da sessão 1.
5. **As marcas do mapa do Morgid são visuais, não escritas.**
6. **O Quasi não fala Thieves' Cant: fala Paterna.** Não percebeu o que os irmãos combinaram. Cai o «tem thieves' cant» do registo da sessão 1. Os irmãos têm Thieves' Cant (já estava nas fichas).
7. **As 800 po são uma promessa sem garantia**: o Corvelo prometeu o que não tem.
8. **O apelido do Alberto é Pé-Leve**, e o nome é verdadeiro, dito com sinceridade.
9. **Mesa:** o Andrew deixou de ser jogador futuro. Entra o **Tiago Rosa** daqui a duas semanas (personagem por definir). O **Nils Manusso** (a personagem do Andrew) sai da campanha por completo, incluindo do segredo do Alberto.
10. **O tempo no dia 3** (preparação da sessão 5): no início do dia ouve-se trovoada ao longe, vinda da direção do forte; ao longo do dia, quanto mais se aproximam do forte, mais pesadas ficam as nuvens. É **pista, não só ambiente**: a tempestade não se mexe com o vento, fica parada em cima do forte, e escala por terço do dia (trovões ao longe de manhã; nuvens sobre as falésias à tarde; relâmpagos sobre o forte ao fim da tarde). É o Truche a acordar; não se explica.
11. **O Morgid segue o grupo à distância.** Não aparece por agora; reaparece daqui a umas sessões (na luta com a Bolbara possuída ou no regresso a Urzin).
12. **Só o Padre Perestrelo tem relação com Vesh.** Ninguém da patrulha tem: o Damião Prestes não é acólito, é o escriba aprendiz e assistente do Perestrelo, mandado com a patrulha para catalogar itens mágicos e seres diferentes (sem magia de clérigo); o Casqueiro canta canções de marcha, não hinos.
13. **O Elmiro acompanha o Isco** no turno do meio da noite do dia 2.
14. **Cada obelisco negro tem uma entidade planar aprisionada, que é a sua fonte de energia.** O Truche é o inquilino que alimenta a Ritual Stone. Corrigido em `docs/lore.md` e `docs/pcs.md`.
15. **A Ritual Stone funciona a meio gás**: com o Truche metido na Bolbara, o efeito no tempo falha (para, retoma, volta a parar).
16. **Na pedra está escrito em dracónico: «Baeshra esteve aqui.»**
17. **Morta ou exorcizada, a Bolbara devolve o Truche ao obelisco.** Em qualquer dos casos ele volta para a pedra (não para o Shadowfell, como no livro).
18. **Quem toca na pedra tem uma única visão**, do ponto de vista da Bolbara e no presente: correntes num altar e cheiro a cera; um homem de mãos levantadas («Outra vez.») e a luz dourada que a puxa de volta, pela segunda vez; o Truche em Abissal («Já falta pouco, velha. A terceira é minha.») por baixo da Bolbara a balbuciar rezas a Melora em Goblin; uma mão esquelética fechada que se estende, se abre e tem um olho na palma (Vecna, sem nome; não é o olho de Gruumsh); um grande grito e um trovão ao longe, do lado do forte. Tocar outra vez mostra o presente outra vez. Ao Lucan, a pedra mostra antes a voz da noite em que morreu; quando o olho aparece, a fome sobe, e no fim Baeshra diz: «Ele agora também te vê.»
19. **Os fragmentos de cristal da pedra lançam *augury*, como no livro**: previsão a condizer com o controlo do tempo dos obeliscos.
20. **A Lia sabe que o destino do pai seria Bazzoxan** (foi o que a Sia Kresh lhe disse), e entra no forte para **ter a certeza de que ele passou por lá** — o livro de registos, no gabinete do comandante.
