# Instruções para assistentes de IA

Este repositório é a fonte de verdade da campanha Call of the Netherdeep do DM João Pereira (Contos & Escudos), em português de Portugal. Lê primeiro `README.md` (estrutura e app), `docs/arquitetura.md` e `docs/fluxo.md`.

## Skills

Os procedimentos de trabalho estão em `.claude/skills/<nome>/SKILL.md`. São Markdown simples com um cabeçalho (`name`, `description`): a descrição diz quando usar, o corpo diz como. Qualquer ferramenta pode lê-los e segui-los.

| Skill | Quando |
| :-- | :-- |
| `decidir` | O DM decide, confirma ou rejeita alguma coisa |
| `arcos` | Percurso, segredos e futuro de um PC |
| `preparar` | Preparar a próxima sessão a partir da Grelha |
| `runsheet` | O documento de preparação de uma sessão |
| `batalha` | Preparar um combate (folha e página Batalha) |
| `fecho` | Fechar uma sessão no registo |
| `vigia` | Rever em tempo real as edições do DM na Grelha |

## Regras que valem sempre

- Nunca escrever `grelha/dm.json` (é só da app). As notas do assistente vão para `grelha/revisao.json`.
- O repositório é público: não guardar segredos de acesso (tokens) em texto.
- Antes de cada commit: `python3 scripts/normalizar-texto.py` e `npm run validate` (0 erros).
- Decisões do DM apresentam-se como perguntas, com uma recomendação, e gravam-se pela skill `decidir`.
- Uma skill nova ou alterada grava-se em `.claude/skills/`; o repositório é a cópia de referência.
