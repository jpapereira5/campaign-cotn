# Ficheiros da página Batalha

A página «Batalha» do dashboard (decisão 28 de 2026-10-13) lê `mesa/batalhas/<id>.yaml`. Quem os escreve é a skill `batalha` (dnd-skills), ao mesmo tempo que a folha em Google Doc. Código: `src/lib/batalha.ts`, `src/components/Batalha.svelte`.

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

