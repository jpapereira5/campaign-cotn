// Ficheiros de dados: os JSON em data/ são embebidos no build (fallback) e, com token,
// substituídos pela versão actual do repositório. Cada ficheiro é a unidade de sincronização.
//
// Estrutura:
//   data/book/{campaign,arcs}.json, data/book/<colecção>/*.json   — o livro (referência, só leitura na app)
//   data/campaign/{campaign,arcs}.json, data/campaign/<colecção>/*.json — a nossa campanha (patches, acrescentos, remoções)
//   data/state.json — estado de jogo
import type { Canon, Collection, Problem } from './types.ts'
import { COLLECTIONS } from './types.ts'
import { normalizeCanon, type RawCanon } from './validate.ts'
import { emptyRaw, mergeLayers, type LayerInfo } from './layers.ts'

export type FileKind = Collection | 'campaign' | 'state'
export type FileLayer = 'book' | 'campaign' | 'state'

export interface DataFile {
  /** Caminho relativo à raiz do repo, ex.: data/book/characters/ch1-2.json */
  path: string
  kind: FileKind
  layer: FileLayer
  content: unknown
  /** sha do blob no GitHub (para escrever por cima). */
  sha?: string
  dirty: boolean
}

const modules = import.meta.glob('/data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

export function parsePath(path: string): { kind: FileKind; layer: FileLayer } | null {
  if (path === 'data/state.json') return { kind: 'state', layer: 'state' }
  const m = path.match(/^data\/(book|campaign)\/(?:([a-z]+)\/[^/]+\.json|([a-z]+)\.json)$/)
  if (!m) return null
  const layer = m[1] as FileLayer
  const folder = m[2]
  const single = m[3]
  if (single === 'campaign' || single === 'arcs') return { kind: single === 'arcs' ? 'arcs' : 'campaign', layer }
  if (folder && (COLLECTIONS as string[]).includes(folder)) return { kind: folder as Collection, layer }
  return null
}

export function kindOfPath(path: string): FileKind | null {
  return parsePath(path)?.kind ?? null
}

export function embeddedFiles(): Record<string, DataFile> {
  const out: Record<string, DataFile> = {}
  for (const [key, content] of Object.entries(modules)) {
    const path = key.replace(/^\//, '')
    const p = parsePath(path)
    if (!p) continue
    out[path] = { path, kind: p.kind, layer: p.layer, content: structuredClone(content), dirty: false }
  }
  return out
}

/** Ficheiro onde vão as edições feitas na app (sempre na camada campaign). */
export function fileForEdits(kind: Collection): string {
  return `data/campaign/${kind}/dm.json`
}

export function rawOfLayer(files: Record<string, DataFile>, layer: 'book' | 'campaign'): RawCanon {
  const raw = emptyRaw()
  for (const p of Object.keys(files).sort()) {
    const f = files[p]
    if (f.layer !== layer) continue
    if (f.kind === 'campaign') raw.campaign = f.content
    else if (f.kind === 'state') continue
    else if (Array.isArray(f.content)) raw[f.kind].push(...f.content)
  }
  return raw
}

export function assemble(files: Record<string, DataFile>, view: 'book' | 'campaign' = 'campaign'): { canon: Canon; problems: Problem[]; layers: LayerInfo } {
  const book = rawOfLayer(files, 'book')
  if (view === 'book') {
    const { canon, problems } = normalizeCanon(book)
    return { canon, problems, layers: { entities: new Map(), relations: new Map(), campaign: 'book' } }
  }
  const { raw, layers } = mergeLayers(book, rawOfLayer(files, 'campaign'))
  const { canon, problems } = normalizeCanon(raw)
  return { canon, problems, layers }
}

export { emptyPlay, normalizePlay } from './play.ts'

export function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n'
}
