// Selecção de nós/arestas para o grafo de relações (puro).
import type { Canon, Character, CharacterKind, Faction, Relation } from './types.ts'
import { relationKey } from './types.ts'

/** Âmbito temporal: só quem entra no capítulo escolhido, todos até ao cursor, ou toda a gente. */
export type GraphScope = 'chapter' | 'upto' | 'all'

export interface GraphFilters {
  factions: string[]
  arcs: string[]
  pc: string | null
  kinds: CharacterKind[]
  showFactions: boolean
  search: string
  scope: GraphScope
  /** Só o nó seleccionado e os seus vizinhos directos. */
  ego: boolean
}

export interface GNode {
  id: string
  label: string
  kind: CharacterKind | 'faction'
  color: string
  ring?: string
  radius: number
  character?: Character
  faction?: Faction
}

export interface GLink {
  key: string
  source: string
  target: string
  relation: Relation
  curve: number
}

export function defaultFilters(): GraphFilters {
  return { factions: [], arcs: [], pc: null, kinds: ['pc', 'npc', 'rival', 'deity'], showFactions: true, search: '', scope: 'chapter', ego: false }
}

export function relationActive(r: Relation, cursor: number, beatPos: (id: string) => number): boolean {
  if (r.fromBeat && beatPos(r.fromBeat) > cursor) return false
  if (r.untilBeat && beatPos(r.untilBeat) <= cursor) return false
  return true
}

export interface GraphOptions {
  /** Capítulo do cursor (para o âmbito 'chapter'). */
  chapterId?: string
  /** Nó seleccionado (para o modo ego). */
  focusId?: string | null
}

export function buildGraph(
  canon: Canon,
  cursor: number,
  filters: GraphFilters,
  beatPos: (id: string) => number,
  kindColors: Record<CharacterKind, string>,
  factionColor: string,
  factionColors: Map<string, string>,
  opts: GraphOptions = {},
): { nodes: GNode[]; links: GLink[] } {
  const chapterIdx = new Map(canon.campaign.chapters.map((c, i) => [c.id, i]))
  const cursorChapter = Math.floor(cursor / 1000)
  let chars = canon.characters.filter((c) => filters.kinds.includes(c.kind))
  // Âmbito temporal. PCs e divindades aparecem sempre.
  if (filters.scope === 'chapter' && opts.chapterId) {
    const ch = opts.chapterId
    const inChapter = new Set(canon.beats.filter((b) => b.chapter === ch).flatMap((b) => b.participants))
    chars = chars.filter((c) => c.kind === 'pc' || c.chapters.includes(ch) || inChapter.has(c.id))
  } else if (filters.scope === 'upto') {
    chars = chars.filter((c) => c.kind === 'pc' || c.kind === 'deity' || c.chapters.length === 0 || c.chapters.some((ch) => (chapterIdx.get(ch) ?? 0) <= cursorChapter))
  }
  if (filters.factions.length) chars = chars.filter((c) => c.factions.some((f) => filters.factions.includes(f)))
  if (filters.arcs.length) {
    const inArcs = new Set(canon.beats.filter((b) => b.arcs.some((a) => filters.arcs.includes(a)) && beatPos(b.id) <= cursor).flatMap((b) => b.participants))
    chars = chars.filter((c) => inArcs.has(c.id))
  }
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase()
    const direct = new Set(chars.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.id))
    const near = new Set<string>(direct)
    for (const r of canon.relations) {
      if (direct.has(r.from)) near.add(r.to)
      if (direct.has(r.to)) near.add(r.from)
    }
    chars = chars.filter((c) => near.has(c.id))
  }
  if (filters.pc) {
    const keep = new Set<string>([filters.pc])
    for (const a of canon.ambitions.filter((a) => a.pc === filters.pc)) a.npcs.forEach((n) => keep.add(n))
    for (const r of canon.relations) {
      if (r.from === filters.pc) keep.add(r.to)
      if (r.to === filters.pc) keep.add(r.from)
    }
    for (const b of canon.beats) if (b.participants.includes(filters.pc)) b.participants.forEach((p) => keep.add(p))
    chars = chars.filter((c) => keep.has(c.id))
  }
  // Modo ego: só o seleccionado e os vizinhos directos (personagens e facções); ignora o âmbito.
  if (filters.ego && opts.focusId) {
    const f = opts.focusId
    const keep = new Set<string>([f])
    for (const r of canon.relations) {
      if (r.from === f) keep.add(r.to)
      if (r.to === f) keep.add(r.from)
    }
    const focusChar = canon.characters.find((c) => c.id === f)
    if (focusChar) focusChar.factions.forEach((x) => keep.add(x))
    for (const c of canon.characters) if (c.factions.includes(f)) keep.add(c.id)
    chars = canon.characters.filter((c) => keep.has(c.id) && filters.kinds.includes(c.kind))
  }

  const degree = new Map<string, number>()
  for (const r of canon.relations) {
    degree.set(r.from, (degree.get(r.from) ?? 0) + 1)
    degree.set(r.to, (degree.get(r.to) ?? 0) + 1)
  }
  const nodes: GNode[] = chars.map((c) => ({
    id: c.id,
    label: c.name,
    kind: c.kind,
    color: kindColors[c.kind],
    ring: c.factions[0] ? factionColors.get(c.factions[0]) : undefined,
    radius: c.kind === 'pc' ? 16 : 7 + 2 * Math.min(degree.get(c.id) ?? 0, 5),
    character: c,
  }))
  const ids = new Set(nodes.map((n) => n.id))
  if (filters.showFactions) {
    const wanted = new Set<string>()
    for (const c of chars) c.factions.forEach((f) => wanted.add(f))
    for (const r of canon.relations) if (ids.has(r.from) || ids.has(r.to)) [r.from, r.to].forEach((x) => wanted.add(x))
    for (const f of canon.factions) {
      if (!wanted.has(f.id)) continue
      if (filters.factions.length && !filters.factions.includes(f.id)) continue
      if (filters.ego && opts.focusId) {
        const focus = opts.focusId
        const linked = f.id === focus || canon.relations.some((r) => (r.from === focus && r.to === f.id) || (r.to === focus && r.from === f.id)) || canon.characters.find((c) => c.id === focus)?.factions.includes(f.id)
        if (!linked) continue
      }
      nodes.push({ id: f.id, label: f.name, kind: 'faction', color: factionColors.get(f.id) ?? factionColor, radius: 13, faction: f })
      ids.add(f.id)
    }
  }
  const links: GLink[] = []
  const seenPair = new Map<string, number>()
  canon.relations.forEach((r, i) => {
    if (!ids.has(r.from) || !ids.has(r.to)) return
    if (!relationActive(r, cursor, beatPos)) return
    const pair = [r.from, r.to].sort().join('|')
    const n = seenPair.get(pair) ?? 0
    seenPair.set(pair, n + 1)
    links.push({ key: `${relationKey(r)}#${i}`, source: r.from, target: r.to, relation: r, curve: n === 0 ? 0 : (n % 2 ? 1 : -1) * Math.ceil(n / 2) })
  })
  return { nodes, links }
}
