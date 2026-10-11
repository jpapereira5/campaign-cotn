// Monta os dados para a app a partir da estrutura nova: node scripts/montar.ts [--warn]
// Escreve src/generated/antigo.json (os ficheiros que a app de hoje conhece, pelo adaptador) e
// src/generated/dados.json (a estrutura nova, já lida). Valida como o validate-data.ts validava.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { lerArvore } from './lib/arvore.ts'
import { adaptarParaAntigo } from './lib/adaptador.ts'
import { canonDeFicheiros } from './lib/antigo.ts'
import { secoes } from './lib/md.ts'
import { validarArvore } from './lib/validar-arvore.ts'

const raiz = resolve(import.meta.dirname, '..')
const arvore = lerArvore(raiz)
const { ficheiros } = adaptarParaAntigo(arvore)
const { canon, layers, problems } = canonDeFicheiros(ficheiros)
const problemasArvore = validarArvore(arvore)

const todos = [...problems, ...problemasArvore]
const errors = todos.filter((p) => p.level === 'error')
const warns = todos.filter((p) => p.level === 'warn')
for (const p of errors) console.error(`✖ ${p.where}: ${p.message}`)
if (process.argv.includes('--warn') || process.argv.includes('-w')) for (const p of warns) console.warn(`⚠ ${p.where}: ${p.message}`)

const dados = {
  geradoEm: new Date().toISOString(),
  docs: arvore.docs.map((d) => ({ caminho: d.caminho, meta: d.meta, corpo: secoes(d.body) })),
  grelha: arvore.grelha,
}
const dir = join(raiz, 'src/generated')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'antigo.json'), JSON.stringify(ficheiros) + '\n')
writeFileSync(join(dir, 'dados.json'), JSON.stringify(dados) + '\n')

const changed = [...layers.entities.values()].filter((l) => l === 'modified').length
const added = [...layers.entities.values()].filter((l) => l === 'campaign').length + layers.relations.size
console.log(
  `estrutura nova: ${arvore.docs.length} ficheiros · capítulos ${canon.campaign.chapters.length} · arcos ${canon.arcs.length} · personagens ${canon.characters.length} · facções ${canon.factions.length} · locais ${canon.locations.length} · relações ${canon.relations.length} · beats ${canon.beats.length} · revelações ${canon.revelations.length} · ambições ${canon.ambitions.length}`,
)
console.log(`camada campanha (pelo adaptador): ${changed} alterada(s), ${added} acrescentada(s)`)
console.log(`${errors.length} erro(s), ${warns.length} aviso(s)${warns.length && !process.argv.includes('--warn') ? ' (usa --warn para os ver)' : ''}`)
if (errors.length) process.exitCode = 1
