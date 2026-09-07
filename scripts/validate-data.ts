// Valida data/ : node scripts/validate-data.ts [--warn] [--book]
// Junta a camada `campaign` por cima de `book` (ou só `book` com --book) e verifica integridade.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeCanon, type RawCanon } from '../src/lib/validate.ts'
import { COLLECTIONS } from '../src/lib/types.ts'
import { emptyRaw, mergeLayers } from '../src/lib/layers.ts'

const root = join(import.meta.dirname, '..', 'data')

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    console.error(`✖ ${path}: JSON inválido — ${(e as Error).message}`)
    process.exitCode = 1
    return null
  }
}

function readCollection(dir: string): unknown[] {
  const out: unknown[] = []
  if (!existsSync(dir)) return out
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const p = join(dir, f)
    if (!statSync(p).isFile()) continue
    const data = readJson(p)
    if (Array.isArray(data)) out.push(...data)
    else if (data) console.error(`✖ ${p}: esperava um array`), (process.exitCode = 1)
  }
  return out
}

function readLayer(layer: 'book' | 'campaign'): RawCanon {
  const base = join(root, layer)
  const raw = emptyRaw()
  const camp = join(base, 'campaign.json')
  raw.campaign = existsSync(camp) ? readJson(camp) : null
  for (const c of COLLECTIONS) {
    const single = join(base, `${c}.json`)
    const d = existsSync(single) ? readJson(single) : null
    raw[c] = [...(Array.isArray(d) ? d : []), ...readCollection(join(base, c))]
  }
  return raw
}

const onlyBook = process.argv.includes('--book')
const book = readLayer('book')
const campaign = readLayer('campaign')
const { raw, layers } = onlyBook ? { raw: book, layers: null } : mergeLayers(book, campaign)
const { canon, problems } = normalizeCanon(raw)
const errors = problems.filter((p) => p.level === 'error')
const warns = problems.filter((p) => p.level === 'warn')
for (const p of errors) console.error(`✖ ${p.where}: ${p.message}`)
if (process.argv.includes('--warn') || process.argv.includes('-w')) for (const p of warns) console.warn(`⚠ ${p.where}: ${p.message}`)

const changed = layers ? [...layers.entities.values()].filter((l) => l === 'modified').length : 0
const added = layers ? [...layers.entities.values()].filter((l) => l === 'campaign').length + layers.relations.size : 0
console.log(
  `${onlyBook ? 'livro' : 'livro + campanha'}: capítulos ${canon.campaign.chapters.length} · arcos ${canon.arcs.length} · personagens ${canon.characters.length} · facções ${canon.factions.length} · locais ${canon.locations.length} · relações ${canon.relations.length} · beats ${canon.beats.length} · revelações ${canon.revelations.length} · ambições ${canon.ambitions.length}`,
)
if (layers) console.log(`camada campanha: ${changed} alterada(s), ${added} acrescentada(s)/removida(s)`)
console.log(`${errors.length} erro(s), ${warns.length} aviso(s)${warns.length && !process.argv.includes('--warn') ? ' (usa --warn para os ver)' : ''}`)
if (errors.length) process.exitCode = 1
