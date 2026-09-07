// Duas camadas de dados: `book` (o livro, referência) e `campaign` (a nossa campanha).
// A camada campaign aplica-se por cima do livro: mesma id → patch de campos; `_remove: true` →
// esconde a entrada do livro; id nova → acrescenta. Puro (usado pela app e pelo script).
import type { RawCanon } from './validate.ts'
import type { Collection } from './types.ts'
import { COLLECTIONS } from './types.ts'

export type Layer = 'book' | 'campaign' | 'modified'

type Raw = Record<string, unknown>

export interface LayerInfo {
  /** `${collection}/${id}` → camada */
  entities: Map<string, Layer>
  /** chave from|to|type → camada */
  relations: Map<string, Layer>
  campaign: Layer
}

export function emptyRaw(): RawCanon {
  return { campaign: null, arcs: [], characters: [], factions: [], locations: [], relations: [], beats: [], revelations: [], ambitions: [] }
}

const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v)
const relKey = (r: Raw) => `${String(r.from ?? '')}|${String(r.to ?? '')}|${String(r.type ?? '')}`

/** Junta as duas camadas num RawCanon único e devolve de onde veio cada entrada. */
export function mergeLayers(book: RawCanon, campaign: RawCanon): { raw: RawCanon; layers: LayerInfo } {
  const raw = emptyRaw()
  const layers: LayerInfo = { entities: new Map(), relations: new Map(), campaign: 'book' }

  // campaign.json: campos da campanha substituem os do livro
  if (isObj(campaign.campaign) && Object.keys(campaign.campaign).length) {
    const base = isObj(book.campaign) ? book.campaign : {}
    const merged: Raw = { ...base, ...campaign.campaign }
    // capítulos: juntar por id (patch dos existentes, acrescentar os novos), não substituir a lista
    if (Array.isArray(campaign.campaign.chapters)) {
      const chapters = new Map<string, Raw>()
      for (const c of Array.isArray(base.chapters) ? base.chapters : []) if (isObj(c) && typeof c.id === 'string') chapters.set(c.id, c)
      for (const c of campaign.campaign.chapters) {
        if (!isObj(c) || typeof c.id !== 'string') continue
        if (c._remove === true) chapters.delete(c.id)
        else chapters.set(c.id, { ...(chapters.get(c.id) ?? {}), ...c })
      }
      merged.chapters = [...chapters.values()]
    }
    raw.campaign = merged
    layers.campaign = 'modified'
  } else raw.campaign = book.campaign

  for (const c of COLLECTIONS) {
    if (c === 'relations') continue
    const merged = new Map<string, Raw>()
    for (const item of book[c]) if (isObj(item) && typeof item.id === 'string') merged.set(item.id, { ...item, source: 'book' })
    for (const item of campaign[c]) {
      if (!isObj(item) || typeof item.id !== 'string') continue
      const id = item.id
      if (item._remove === true) {
        merged.delete(id)
        layers.entities.set(`${c}/${id}`, 'campaign')
        continue
      }
      const base = merged.get(id)
      const { _remove: _r, ...patch } = item
      void _r
      if (base) {
        merged.set(id, { ...base, ...patch, source: 'dm' })
        layers.entities.set(`${c}/${id}`, 'modified')
      } else {
        merged.set(id, { ...patch, source: 'dm' })
        layers.entities.set(`${c}/${id}`, 'campaign')
      }
    }
    raw[c] = [...merged.values()]
  }

  const rels: Raw[] = book.relations.filter(isObj).map((r) => ({ ...r, source: 'book' }))
  for (const r of campaign.relations) {
    if (!isObj(r)) continue
    const key = relKey(r)
    if (r._remove === true) {
      for (let i = rels.length - 1; i >= 0; i--) if (relKey(rels[i]) === key) rels.splice(i, 1)
      layers.relations.set(key, 'campaign')
      continue
    }
    const { _remove: _r, ...rest } = r
    void _r
    rels.push({ ...rest, source: 'dm' })
    layers.relations.set(key, 'campaign')
  }
  raw.relations = rels
  return { raw, layers }
}

/** Campos de uma entidade que diferem do original do livro (para mostrar o "antes"). */
export function diffFields(book: Raw | undefined, merged: Raw): string[] {
  if (!book) return []
  return Object.keys(merged).filter((k) => k !== 'source' && JSON.stringify(book[k]) !== JSON.stringify(merged[k]))
}

export function collectionOfKind(kind: string): Collection | null {
  return (COLLECTIONS as string[]).includes(kind) ? (kind as Collection) : null
}
