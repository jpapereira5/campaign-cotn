# Cânone da mesa: o que foi jogado vs. o que estava preparado

**O que a mesa jogou manda.** Quando a sessão contradiz a preparação, a preparação é **reescrita** nos ficheiros (`data/campaign/`, `docs/lore.md`, `docs/regras.md`) para passar a dizer o que aconteceu; este documento fica com o registo do que lá estava antes, para não se perder a intenção original. Quando o conflito é entre coisas ditas em sessões diferentes — ou dentro da mesma sessão — nada se decide aqui: vai para **Por decidir**.

Regista, por sessão, **o que a preparação acertou**, **o que mudou em jogo** (e onde já foi corrigido) e **o que continua por revelar**. Os resumos estão em [`docs/sessoes/`](sessoes/); as fichas afectadas ficam com a nota «a mesa (sessão N, #NN)» em `data/campaign/`.

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
5. **A garra deixou de ser cenário.** Estava **ao peito do xamã**, não pendurada no templo; tem **seis** dedos (nem réptil, nem lizardfolk); cheira a enxofre como os demónios do Farol Apagado (Isco); e é **mágica**: o Quasi tirou-lhe *Command* 1×/dia numa hora de contemplação, e ficou com a sensação de que há mais. Deixa de valer o "nada está activo e nada é perigoso" no que toca à garra — e ela é agora do **Quasi**, não do Lucan.
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
- **Os seis dedos**: se cinco é o posto do rei, de quem é a mão de seis? (Sess'inek tem seis braços e seis espadas: guardar para o Betrayers' Rise.)
- **Lucan contra Quasi**: ameaça de morte explícita no ossário e a adaga por resolver entre os dois.
- **Encontro garantido** (d20 = 18) no segundo terço do dia 2, a caminho do obelisco, com a torre B4 das aranhas deixada para trás por explorar.

## Por decidir (contradições que a mesa não resolve)

Nada disto foi decidido: são conflitos entre o que ficou escrito em sítios diferentes, ou entre sessões, e a sessão 3 não dá resposta.

1. **Há quantos anos caiu o clã Ro?** `docs/lore.md`, `docs/regras.md` e `l-sunken-boneyard` dizem **809 PD** e «a adaga está no altar há **27 anos**» — o que bate certo com a idade do Baeshra (7 anos na queda, 33 no *wish*, deus há um ano). Mas a ficha do `c-hesskar-ro`, o patch do `c-morgid` e a relação `c-durth-mirimm → clã Ro` dizem «arrasado há **~50 anos**». O DM não deu datas na sessão 3 (chegou a dizer que não se estima há quanto tempo a adaga ali estava). Decidir qual fica — e, se ficar 809 PD/27 anos, corrigir os três «~50 anos».
2. **Quantos lizardfolk sobreviveram?** O resumo da sessão 2 diz que **três** fugiram pela água; a ficha `c-lizardfolk-do-ossario` diz **quatro dispersos** (os três mais o que mergulhou no início do combate). Na sessão 3 o Isco ouve-os à espera, mas o DM não disse quantos. Interessa: são as testemunhas de quem matou o rei e saqueou a corte.
3. **A greatsword do Isco.** Ficou espetada na lama no fim da sessão 2 e a sessão 3 nunca a menciona — nem no inventário da manhã. Confirmar se foi recuperada ou se ficou lá.
4. **O crânio mais pequeno é de uma tartaruga jovem.** O cânone diz que os crânios do ossário são «as irmãs mortas do Guardião do Musgo»; o DM descreveu o crânio do altar como sendo de uma tartaruga-do-horizonte muito jovem e disse não se saber o que a matou. Decidir se a jovem também é irmã, se o ossário recebe outras tartarugas, ou se fica por explicar de propósito.

### Resolvido pela própria sessão (não é conflito)

- **Dado de encontros**: a sessão 1 usou um d12; na sessão 3 o DM corrigiu-se («enganei-me, é um d20 — 16 ou mais acontece alguma coisa»). Vale o d20; a nota da sessão 1 no patch do pântano ficou marcada como substituída.
- **Hexágonos do dia 2**: o DM deu por um erro de um hexágono no seu mapa e corrigiu-o em jogo antes de contar a viagem.
