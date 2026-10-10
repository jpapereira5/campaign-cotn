// Leitura de data/ para os scripts (node): livro, campanha e registo. A app faz o mesmo com import.meta.glob.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { COLLECTIONS } from '../src/lib/types.ts'
import type { Canon, Problem } from '../src/lib/types.ts'
import { emptyRaw, mergeLayers, type LayerInfo } from '../src/lib/layers.ts'
import { normalizeCanon, type RawCanon } from '../src/lib/validate.ts'
import { emptyRegisto, normalizeRegisto, type Registo, type RegistoFile, type RegistoKind } from '../src/lib/registo.ts'

export const root = join(import.meta.dirname, '..', 'data')
export const docs = join(import.meta.dirname, '..', 'docs')

const jsonProblems: Problem[] = []
const rel = (p: string) => p.replace(/\\/g, '/').replace(/^.*\/(data|docs)\//, '$1/')

export function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    jsonProblems.push({ level: 'error', where: rel(path), message: `JSON inválido — ${(e as Error).message}` })
    return null
  }
}

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(dir, f))
    .filter((p) => statSync(p).isFile())
}

function readCollection(dir: string): unknown[] {
  const out: unknown[] = []
  for (const p of jsonFiles(dir)) {
    const data = readJson(p)
    if (Array.isArray(data)) out.push(...data)
    else if (data) jsonProblems.push({ level: 'error', where: rel(p), message: 'esperava um array' })
  }
  return out
}

export function readLayer(layer: 'book' | 'campaign'): RawCanon {
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

export function readRegisto(): RegistoFile[] {
  const base = join(root, 'registo')
  const files: RegistoFile[] = []
  for (const p of jsonFiles(join(base, 'sessoes'))) files.push({ path: rel(p), kind: 'sessao', content: readJson(p) })
  for (const p of jsonFiles(join(base, 'decisoes'))) files.push({ path: rel(p), kind: 'decisoes', content: readJson(p) })
  for (const k of ['fios', 'itens', 'relogios'] as RegistoKind[]) {
    const p = join(base, `${k}.json`)
    if (existsSync(p)) files.push({ path: rel(p), kind: k, content: readJson(p) })
  }
  // o que estiver fora do esquema de pastas seria ignorado em silêncio: dizer
  const esperado = new Set(files.map((f) => f.path))
  const percorrer = (dir: string): void => {
    if (!existsSync(dir)) return
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome)
      if (statSync(p).isDirectory()) percorrer(p)
      else if (nome !== '.gitkeep' && !esperado.has(rel(p))) jsonProblems.push({ level: 'error', where: rel(p), message: 'ficheiro fora do esquema do registo (sessoes/s-NN.json, decisoes/AAAA-MM.json, fios|itens|relogios.json)' })
    }
  }
  percorrer(base)
  return files.filter((f) => f.content !== null)
}

export interface Carregado {
  canon: Canon
  registo: Registo
  campaign: RawCanon
  problems: Problem[]
  layers: LayerInfo | null
}

/** Livro + campanha + registo (ou só o livro, com `onlyBook`). */
export function carregar(onlyBook = false): Carregado {
  jsonProblems.length = 0
  const book = readLayer('book')
  const campaign = readLayer('campaign')
  const merged = onlyBook ? { raw: book, layers: null } : mergeLayers(book, campaign)
  const { canon, problems } = normalizeCanon(merged.raw)
  const reg = onlyBook ? { registo: emptyRegisto(), problems: [] as Problem[] } : normalizeRegisto(readRegisto())
  return { canon, registo: reg.registo, campaign, problems: [...jsonProblems, ...problems, ...reg.problems], layers: merged.layers }
}
