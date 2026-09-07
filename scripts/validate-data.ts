// Valida data/ : node scripts/validate-data.ts  (Node ≥ 22, type stripping)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeCanon } from '../src/lib/validate.ts'
import { COLLECTIONS } from '../src/lib/types.ts'

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

function readCollection(name: string): unknown[] {
  const dir = join(root, name)
  const out: unknown[] = []
  let entries: string[] = []
  try {
    entries = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  } catch {
    return out
  }
  for (const f of entries) {
    const p = join(dir, f)
    if (!statSync(p).isFile()) continue
    const data = readJson(p)
    if (Array.isArray(data)) out.push(...data)
    else if (data) console.error(`✖ ${p}: esperava um array`), (process.exitCode = 1)
  }
  return out
}

const raw = {
  campaign: readJson(join(root, 'campaign.json')),
  arcs: [] as unknown[],
  characters: [] as unknown[],
  factions: [] as unknown[],
  locations: [] as unknown[],
  relations: [] as unknown[],
  beats: [] as unknown[],
  revelations: [] as unknown[],
  ambitions: [] as unknown[],
}
for (const c of COLLECTIONS) {
  const single = join(root, `${c}.json`)
  const d = existsSync(single) ? readJson(single) : null
  raw[c] = [...(Array.isArray(d) ? d : []), ...readCollection(c)]
}

const { canon, problems } = normalizeCanon(raw)
const errors = problems.filter((p) => p.level === 'error')
const warns = problems.filter((p) => p.level === 'warn')
for (const p of errors) console.error(`✖ ${p.where}: ${p.message}`)
if (process.argv.includes('--warn') || process.argv.includes('-w')) for (const p of warns) console.warn(`⚠ ${p.where}: ${p.message}`)

console.log(
  `capítulos ${canon.campaign.chapters.length} · arcos ${canon.arcs.length} · personagens ${canon.characters.length} · facções ${canon.factions.length} · locais ${canon.locations.length} · relações ${canon.relations.length} · beats ${canon.beats.length} · revelações ${canon.revelations.length} · ambições ${canon.ambitions.length}`,
)
console.log(`${errors.length} erro(s), ${warns.length} aviso(s)${warns.length && !process.argv.includes('--warn') ? ' (usa --warn para os ver)' : ''}`)
if (errors.length) process.exitCode = 1
