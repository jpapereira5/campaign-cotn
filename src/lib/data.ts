// Ficheiros de dados: os JSON em data/ são embebidos no build (fallback) e, com token,
// substituídos pela versão actual do repositório. Cada ficheiro é a unidade de sincronização.
import type { Canon, Collection, PlayState, Problem } from './types.ts'
import { COLLECTIONS } from './types.ts'
import { normalizeCanon, type RawCanon } from './validate.ts'

export type FileKind = Collection | 'campaign' | 'state'

export interface DataFile {
  /** Caminho relativo à raiz do repo, ex.: data/characters/ch1-2.json */
  path: string
  kind: FileKind
  content: unknown
  /** sha do blob no GitHub (para escrever por cima). */
  sha?: string
  dirty: boolean
}

const modules = import.meta.glob('/data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

export function kindOfPath(path: string): FileKind | null {
  const m = path.match(/^data\/(?:([a-z]+)\/[^/]+\.json|([a-z]+)\.json)$/)
  if (!m) return null
  const folder = m[1]
  const single = m[2]
  if (single === 'campaign' || single === 'state') return single
  if (folder && (COLLECTIONS as string[]).includes(folder)) return folder as Collection
  if (single && (COLLECTIONS as string[]).includes(single)) return single as Collection
  return null
}

export function embeddedFiles(): Record<string, DataFile> {
  const out: Record<string, DataFile> = {}
  for (const [key, content] of Object.entries(modules)) {
    const path = key.replace(/^\//, '')
    const kind = kindOfPath(path)
    if (!kind) continue
    out[path] = { path, kind, content: structuredClone(content), dirty: false }
  }
  return out
}

export function fileForNew(kind: Collection): string {
  return `data/${kind}/dm.json`
}

export function assemble(files: Record<string, DataFile>): { canon: Canon; problems: Problem[] } {
  const raw: RawCanon = {
    campaign: null,
    arcs: [],
    characters: [],
    factions: [],
    locations: [],
    relations: [],
    beats: [],
    revelations: [],
    ambitions: [],
  }
  const paths = Object.keys(files).sort()
  for (const p of paths) {
    const f = files[p]
    if (f.kind === 'campaign') raw.campaign = f.content
    else if (f.kind === 'state') continue
    else if (Array.isArray(f.content)) raw[f.kind].push(...f.content)
  }
  return normalizeCanon(raw)
}

export function emptyPlay(): PlayState {
  return {
    version: 1,
    playedBeats: [],
    revealed: [],
    portentsDone: [],
    attitudes: {},
    flags: {},
    notes: {},
    sessions: [],
    currentChapter: null,
  }
}

export function normalizePlay(raw: unknown): PlayState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<PlayState>
  const strs = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [])
  const rec = <T>(v: unknown): Record<string, T> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {})
  return {
    version: 1,
    playedBeats: strs(r.playedBeats),
    revealed: strs(r.revealed),
    portentsDone: strs(r.portentsDone),
    attitudes: rec(r.attitudes),
    flags: rec(r.flags),
    notes: rec(r.notes),
    sessions: (Array.isArray(r.sessions) ? r.sessions : []).map((s) => ({
      id: String((s as { id?: string }).id ?? Math.random().toString(36).slice(2, 10)),
      date: String((s as { date?: string }).date ?? ''),
      title: String((s as { title?: string }).title ?? ''),
      beats: strs((s as { beats?: unknown }).beats),
      notes: String((s as { notes?: string }).notes ?? ''),
    })),
    currentChapter: typeof r.currentChapter === 'string' ? r.currentChapter : null,
  }
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n'
}
