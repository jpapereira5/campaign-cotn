---
name: "batalha"
description: "Folha de batalha da CotN para a mesa e para a página Batalha do dashboard: combatentes, terreno, táticas, descrições narrativas pt-PT de ataques, feitiços e habilidades. Usar quando o DM prepara um combate ou pede descrições de combate."
---

# batalha: um combate pronto para a mesa

O DM quer, num só sítio, tudo o que é relevante para um combate: quem luta, com quê, como, e descrições narrativas curtas para dizer à mesa. Cada batalha sai em dois formatos com o mesmo conteúdo: um **Google Doc** na Session Prep (para ler) e um **ficheiro YAML** no repositório (para a página «Batalha» do dashboard, usada no portátil à mesa). Português de Portugal; termos de regras podem ficar em inglês quando a mesa os usa assim.

## 1. Recolher (antes de escrever)

- `git pull` no repositório `campaign-cotn`. Lê a preparação da sessão (`registo/decisoes.md`, a coluna da sessão na Grelha com `node scripts/grelha.ts`, o doc «Sessão NN — Preparação» na Session Prep) para saber onde, quando, porquê e quem.
- **Monstros:** o livro (PDFs do projeto) e o Manual dos Monstros; variantes do livro (ex.: lacedon = ghoul com natação 30 ft).
- **NPCs:** `mundo/personagens/c-*.md` (CA, PV, ataques, equipamento, objetivo, segredo). Onde faltar dano, usa o perfil do MM mais próximo e marca com `*`.
- **PCs:** os docs «<Nome> — PC vN» na pasta PCs_Claude da Drive (`1ZPbWDbs66jTRJxAZl7VOu332f_mKCCH-`) e `mundo/personagens/c-pc-*.md`: CA, PV, deslocamento, ataques, magias preparadas, espaços, habilidades, equipamento, mecânicas especiais da mesa (ex.: a Fera a 0 PV do Lucan, as transformações do Isco).
- **Regras da mesa:** `mesa/regras.md`, incluindo a secção «Componentes verbais em latim (DM)». Cada feitiço usa exatamente o latim dessa tabela. Se faltar ("???" ou ausente), procura na fonte da tabela ("All Latin spell chants", BG3); se não existir lá, propõe duas ou três opções ao DM com perguntas interativas e grava a escolha em `mesa/regras.md` e nas decisões.
- **Confirma imunidades e interações** que mudam o combate: imunidades a condições (enfeitiçado, sono, paralisia de elfos), línguas que os monstros percebem (Comando), luz solar, terreno, surpresa pelas passivas. Põe-nas logo no topo.
- O que estiver por decidir e mudar o combate vai ao DM como pergunta interativa (skill `decidir`) antes de escrever.

## 2. Estrutura do conteúdo

0. **Lembretes que decidem o combate** — imunidades, desvantagens, interações de regras, mecânicas especiais.
1. **Terreno** — água, cobertura, objetos interativos, luz e som; uma regra simples por elemento.
2. **Iniciativa e quem está onde.**
3. **Os monstros** — bloco resumido; «quem é quem» (aspeto para os distinguir e alvo preferido); **táticas**; **moral** (quando fogem, para onde, e o que isso diz à mesa); **tabela de zonas do corpo** (d6 ou d8: zona e o que se vê); descrições dos ataques deles.
4. **Os PCs** — por PC: números essenciais, equipamento, e descrições de cada ataque, feitiço e habilidade relevante.
5. **Aliados (NPCs)** — CA/PV, ataques, equipamento, o que fazem; descrições dos ataques.
6. **Ronda a ronda** — eventos por ronda (o que entra, o que muda no terreno, o que um NPC faz).
7. **Rescaldo** — o que se encontra, quem reage a quê, que pistas ficam.
8. **Checklist** — uma linha por coisa que não pode esquecer.

## 3. As descrições

- **Ataques com arma ou naturais:** 3 linhas curtas para cada variante: **falha**, **magoa** (o alvo fica acima de metade dos PV), **fere** (metade ou menos), **crítico**. Armas secundárias (besta, dardos) podem levar uma linha por variante.
- **Golpe final:** primeiro a pergunta ao jogador, **«Como queres fazer isto?»** (para um PC a cair: «Como queres cair?»), e só depois 3 sugestões para quando ele devolver a escolha.
- **Feitiços:** uma linha de componentes (V/S/M, com o material em palavras e o latim da tabela entre «»), a mecânica numa frase, e 3 descrições do efeito.
- **Habilidades especiais** (Fúria, transformações, Canalizar Divindade, reações): 3 descrições cada.
- Sensorial, concreto, sem psicologia; os nomes só quando a mesa já os sabe; adaptadas ao sítio (água, sol, lama) e ao equipamento de quem ataca.

## 4. O ficheiro da página «Batalha»: `mesa/batalhas/<id>.yaml`

Id: `sNN-<nome-curto>` (ex.: `s06-lacedons-obelisco`); o nome do ficheiro é a id. Começa com duas linhas de comentário: de onde vem (o doc da Drive) e que o estado do combate não vive ali. Exemplo de referência: `mesa/batalhas/s06-lacedons-obelisco.yaml`. Gerar a partir de um dicionário em Python com `yaml.safe_dump(..., allow_unicode=True, sort_keys=False, width=200)` evita erros de aspas.

```yaml
id: s06-lacedons-obelisco
nome: Lacedons no obelisco
sessao: s6
onde: Bacia do menir · meio-dia do dia 4
doc: <url do Google Doc>
resumo: uma ou duas frases
lembretes: [linha, ...]
terreno: [{nome: A jangada, texto: ...}, ...]
modelos:                       # números e ações partilhados (ex.: todos os lacedons)
  lacedon: {lado: inimigo, ca: 12, pv: 22, ini: 2, resumo: ..., notas: [...], acoes: [...]}
combatentes:
  - {id: lacedon-1, nome: Lacedon 1, modelo: lacedon, grupo: lacedons-jangada, aspeto: ..., notas: [...]}
  - {id: lia, nome: Lia, lado: pc, ref: c-pc-lia, ca: '12 (14 com escudo)', pv: 24, ini: 2, resumo: ..., equipamento: ..., notas: [...], acoes: [...]}
  - {id: damiao, nome: Damião, lado: aliado, ref: c-damiao-prestes, passivo: true, resumo: Não luta. Escreve.}
zonas:
  lacedon: [{d: 1, zona: Cabeça, texto: ...}, ...]
rondas: [{ronda: Antes, texto: ...}, {ronda: '1', texto: ...}, ...]
rescaldo: [linha, ...]
checklist: [linha, ...]
```

- **`lado`:** `pc`, `aliado`, `inimigo` ou `neutro`. **`grupo`:** quem partilha a iniciativa. **`passivo: true`:** não age (fica na lista, a vez salta-o). **`ref`:** a id da ficha no repositório (tem de existir). **`ini`:** o modificador de iniciativa. **`pv`:** só quando se sabe; os PCs sem PV conhecidos ficam sem `pv` e o DM mete o máximo na página.
- **Uma ação** (`acoes`): `nome`, `mecanica`, `componentes` (feitiços), as listas `falha`, `magoa`, `fere`, `critico`, `final` (ataques) ou `efeito` (feitiços e habilidades), e `pergunta` quando não é «Como queres fazer isto?». Cada lista leva as 3 descrições.
- **A zona do corpo** liga-se ao combatente pelo `modelo` (ou por `zonas: <chave>`).
- **O estado do combate** (iniciativa, PV, condições, ronda, checklist) é da app e vive em `grelha/dm.json` como uma entrada `kind: batalha`: **nunca o escrevas**, nem no YAML nem no dm.json.
- Valida com `python3 scripts/normalizar-texto.py` e `npm run validate` (0 erros: as fichas e os modelos referidos têm de existir); commit e push com as linhas de atribuição da sessão. O deploy do GitHub Pages põe a batalha na página.

## 5. Publicar

- **Google Doc** (markdown convertido, sem cabeçalho YAML nem tags) na pasta Session Prep (`1WGi5hzOj2oPHEfFmvlwDmJN33X7Ed6h1`), título «Batalha — <nome>». Versões novas como documento novo (`v2`); a anterior que tu criaste vai para o lixo. O URL do doc vai para o campo `doc` do YAML.
- **YAML** em `mesa/batalhas/`, como na secção 4. Se o doc mudar, o YAML muda no mesmo passo.
- Grava nas decisões o que se decidiu pelo caminho (skill `decidir`).
- Na resposta: o doc, a página («Jogar → Batalha» no dashboard), as três coisas que mais decidem o combate, e o que ficou por decidir como pergunta interativa.