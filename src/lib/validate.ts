// Normalização + validação dos dados. Puro (sem DOM): usado pela app e pelo script.
import type {
  Ambition, Arc, Beat, Campaign, Canon, Character, Faction, Location, Problem, Relation, Revelation,
} from './types.ts'
import { ARC_KINDS, ATTITUDES, CHARACTER_KINDS, RELATION_TYPES } from './types.ts'

const ID_RE = /^[a-z0-9][a-z0-9-]*$/

type Raw = Record<string, unknown>

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const uniq = (v: string[]): string[] => [...new Set(v)]
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const obj = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {})
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? v.map(obj) : [])
const src = (v: unknown): 'book' | 'dm' => (v === 'dm' ? 'dm' : 'book')
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : d

export function normalizeCampaign(raw: unknown): Campaign {
  const r = obj(raw)
  return {
    title: str(r.title, 'Campanha'),
    chapters: arr(r.chapters).map((c) => ({
      id: str(c.id),
      name: str(c.name),
      levels: str(c.levels),
      hub: str(c.hub),
      summary: str(c.summary),
    })),
    convergence: str(r.convergence),
  }
}

export function normalizeArc(raw: unknown): Arc {
  const r = obj(raw)
  return {
    id: str(r.id),
    name: str(r.name),
    kind: oneOf(r.kind, ARC_KINDS, 'main'),
    color: str(r.color, '#888888'),
    ownerPc: str(r.ownerPc) || undefined,
    order: num(r.order),
    summary: str(r.summary),
  }
}

export function normalizeCharacter(raw: unknown): Character {
  const r = obj(raw)
  return {
    id: str(r.id),
    name: str(r.name),
    kind: oneOf(r.kind, CHARACTER_KINDS, 'npc'),
    factions: strs(r.factions),
    home: str(r.home) || undefined,
    chapters: strs(r.chapters),
    summary: str(r.summary),
    goal: str(r.goal),
    secret: str(r.secret),
    wants: str(r.wants),
    fears: str(r.fears),
    states: arr(r.states).map((s) => ({ fromBeat: str(s.fromBeat), state: str(s.state) })),
    attitude: typeof r.attitude === 'string' ? oneOf(r.attitude, ATTITUDES, 'indiferente') : undefined,
    tags: strs(r.tags),
    source: src(r.source),
  }
}

export function normalizeFaction(raw: unknown): Faction {
  const r = obj(raw)
  return {
    id: str(r.id),
    name: str(r.name),
    motto: str(r.motto),
    agenda: str(r.agenda),
    publicFace: str(r.publicFace),
    leaders: strs(r.leaders),
    allies: strs(r.allies),
    enemies: strs(r.enemies),
    portents: arr(r.portents).map((p) => ({ chapter: str(p.chapter), text: str(p.text) })),
    source: src(r.source),
  }
}

export function normalizeLocation(raw: unknown): Location {
  const r = obj(raw)
  return {
    id: str(r.id),
    name: str(r.name),
    parent: str(r.parent) || undefined,
    chapter: str(r.chapter),
    summary: str(r.summary),
  }
}

export function normalizeRelation(raw: unknown): Relation {
  const r = obj(raw)
  return {
    from: str(r.from),
    to: str(r.to),
    type: oneOf(r.type, RELATION_TYPES, 'knows'),
    label: str(r.label),
    fromBeat: str(r.fromBeat) || undefined,
    untilBeat: str(r.untilBeat) || undefined,
    condition: str(r.condition) || undefined,
    source: src(r.source),
  }
}

export function normalizeBeat(raw: unknown): Beat {
  const r = obj(raw)
  return {
    id: str(r.id),
    title: str(r.title),
    arcs: uniq(strs(r.arcs)),
    chapter: str(r.chapter),
    order: num(r.order),
    location: str(r.location) || undefined,
    participants: uniq(strs(r.participants)),
    summary: str(r.summary),
    reveals: uniq(strs(r.reveals)),
    requires: uniq(strs(r.requires)),
    choices: arr(r.choices).map((c) => ({ label: str(c.label), outcome: str(c.outcome), leadsTo: strs(c.leadsTo) })),
    timer: str(r.timer) || undefined,
    portent: r.portent ? { faction: str(obj(r.portent).faction), text: str(obj(r.portent).text) } : undefined,
    notes: str(r.notes),
    source: src(r.source),
  }
}

export function normalizeRevelation(raw: unknown): Revelation {
  const r = obj(raw)
  return { id: str(r.id), list: str(r.list, 'Geral'), text: str(r.text), clues: uniq(strs(r.clues)), source: src(r.source) }
}

export function normalizeAmbition(raw: unknown): Ambition {
  const r = obj(raw)
  return {
    id: str(r.id),
    pc: str(r.pc),
    text: str(r.text),
    npcs: strs(r.npcs),
    arcs: strs(r.arcs),
    satisfiedBy: strs(r.satisfiedBy),
    threatenedBy: strs(r.threatenedBy),
    source: src(r.source),
  }
}

export interface RawCanon {
  campaign: unknown
  arcs: unknown[]
  characters: unknown[]
  factions: unknown[]
  locations: unknown[]
  relations: unknown[]
  beats: unknown[]
  revelations: unknown[]
  ambitions: unknown[]
}

function dedupeRelations(list: Relation[], warn: (where: string, message: string) => void): Relation[] {
  const seen = new Set<string>()
  const out: Relation[] = []
  for (const r of list) {
    const key = `${r.from}|${r.to}|${r.type}|${r.fromBeat ?? ''}|${r.untilBeat ?? ''}|${r.condition ?? ''}`
    if (seen.has(key)) {
      warn(`relations/${r.from}→${r.to}`, `relação duplicada (${r.type})`)
      continue
    }
    seen.add(key)
    out.push(r)
  }
  return out
}

/** Preenche defaults, descarta entradas sem id e verifica integridade referencial. Nunca lança. */
export function normalizeCanon(raw: RawCanon): { canon: Canon; problems: Problem[] } {
  const problems: Problem[] = []
  const err = (where: string, message: string) => problems.push({ level: 'error', where, message })
  const warn = (where: string, message: string) => problems.push({ level: 'warn', where, message })

  const withId = <T extends { id: string }>(list: unknown[], norm: (x: unknown) => T, name: string): T[] => {
    const seen = new Set<string>()
    const out: T[] = []
    for (const item of list ?? []) {
      const n = norm(item)
      if (!n.id) {
        err(name, `entrada sem id: ${JSON.stringify(item).slice(0, 80)}`)
        continue
      }
      if (!ID_RE.test(n.id)) err(`${name}/${n.id}`, 'id inválido (usar kebab-case ASCII)')
      if (seen.has(n.id)) {
        err(`${name}/${n.id}`, 'id duplicado')
        continue
      }
      seen.add(n.id)
      out.push(n)
    }
    return out
  }

  const canon: Canon = {
    campaign: normalizeCampaign(raw.campaign),
    arcs: withId(raw.arcs, normalizeArc, 'arcs'),
    characters: withId(raw.characters, normalizeCharacter, 'characters'),
    factions: withId(raw.factions, normalizeFaction, 'factions'),
    locations: withId(raw.locations, normalizeLocation, 'locations'),
    relations: dedupeRelations((raw.relations ?? []).map(normalizeRelation).filter((r) => r.from && r.to), warn),
    beats: withId(raw.beats, normalizeBeat, 'beats'),
    revelations: withId(raw.revelations, normalizeRevelation, 'revelations'),
    ambitions: withId(raw.ambitions, normalizeAmbition, 'ambitions'),
  }

  const ids = {
    chapters: new Set(canon.campaign.chapters.map((c) => c.id)),
    arcs: new Set(canon.arcs.map((a) => a.id)),
    characters: new Set(canon.characters.map((c) => c.id)),
    factions: new Set(canon.factions.map((f) => f.id)),
    locations: new Set(canon.locations.map((l) => l.id)),
    beats: new Set(canon.beats.map((b) => b.id)),
    revelations: new Set(canon.revelations.map((r) => r.id)),
  }
  const pcs = new Set(canon.characters.filter((c) => c.kind === 'pc').map((c) => c.id))
  const beatById = new Map(canon.beats.map((b) => [b.id, b]))
  const chapterIndex = new Map(canon.campaign.chapters.map((c, i) => [c.id, i]))
  const beatPos = (id: string): number => {
    const b = beatById.get(id)
    return b ? (chapterIndex.get(b.chapter) ?? 99) * 1000 + b.order : -1
  }

  const check = (where: string, refs: string[], set: Set<string>, what: string) => {
    for (const r of refs) if (!set.has(r)) err(where, `${what} desconhecido: ${r}`)
  }
  const checkOne = (where: string, ref: string | undefined, set: Set<string>, what: string) => {
    if (ref && !set.has(ref)) err(where, `${what} desconhecido: ${ref}`)
  }

  // campaign
  if (canon.campaign.chapters.length === 0) err('campaign', 'sem capítulos')
  checkOne('campaign.convergence', canon.campaign.convergence, ids.beats, 'beat')
  if (!canon.campaign.convergence) warn('campaign', 'sem beat de convergência')

  for (const a of canon.arcs) {
    if (a.ownerPc) {
      checkOne(`arcs/${a.id}`, a.ownerPc, ids.characters, 'PC')
      if (ids.characters.has(a.ownerPc) && !pcs.has(a.ownerPc)) err(`arcs/${a.id}`, 'ownerPc não é um PC')
    }
  }

  for (const c of canon.characters) {
    const w = `characters/${c.id}`
    check(w, c.factions, ids.factions, 'facção')
    checkOne(w, c.home, ids.locations, 'local')
    check(w, c.chapters, ids.chapters, 'capítulo')
    for (const s of c.states) checkOne(w, s.fromBeat, ids.beats, 'beat')
  }

  for (const f of canon.factions) {
    const w = `factions/${f.id}`
    check(w, f.leaders, ids.characters, 'personagem')
    check(w, f.allies, ids.factions, 'facção')
    check(w, f.enemies, ids.factions, 'facção')
    for (const p of f.portents) checkOne(w, p.chapter, ids.chapters, 'capítulo')
  }

  for (const l of canon.locations) {
    const w = `locations/${l.id}`
    checkOne(w, l.parent, ids.locations, 'local')
    checkOne(w, l.chapter, ids.chapters, 'capítulo')
    // ciclo de parents
    const seen = new Set<string>()
    let cur: Location | undefined = l
    while (cur?.parent) {
      if (seen.has(cur.id)) {
        err(w, 'ciclo em parent')
        break
      }
      seen.add(cur.id)
      cur = canon.locations.find((x) => x.id === cur!.parent)
    }
  }

  const nodes = new Set([...ids.characters, ...ids.factions])
  for (const r of canon.relations) {
    const w = `relations/${r.from}→${r.to}`
    if (!nodes.has(r.from)) err(w, `origem desconhecida: ${r.from}`)
    if (!nodes.has(r.to)) err(w, `destino desconhecido: ${r.to}`)
    if (r.from === r.to) err(w, 'relação consigo próprio')
    if (r.type === 'memberOf' && !ids.factions.has(r.to)) err(w, 'memberOf tem de apontar para uma facção')
    checkOne(w, r.fromBeat, ids.beats, 'beat')
    checkOne(w, r.untilBeat, ids.beats, 'beat')
    if (r.fromBeat && r.untilBeat && ids.beats.has(r.fromBeat) && ids.beats.has(r.untilBeat)) {
      if (beatPos(r.untilBeat) <= beatPos(r.fromBeat)) err(w, 'untilBeat não é posterior a fromBeat')
    }
  }

  const seenSlot = new Map<string, string>()
  for (const b of canon.beats) {
    const w = `beats/${b.id}`
    if (b.arcs.length === 0) err(w, 'beat sem arco')
    check(w, b.arcs, ids.arcs, 'arco')
    checkOne(w, b.chapter, ids.chapters, 'capítulo')
    if (!b.chapter) err(w, 'beat sem capítulo')
    checkOne(w, b.location, ids.locations, 'local')
    check(w, b.participants, nodes, 'personagem/facção')
    check(w, b.reveals, ids.revelations, 'revelação')
    check(w, b.requires, ids.beats, 'beat')
    for (const ch of b.choices) check(w, ch.leadsTo, ids.beats, 'beat')
    if (b.portent) checkOne(w, b.portent.faction, ids.factions, 'facção')
    for (const req of b.requires) {
      if (ids.beats.has(req) && beatPos(req) > beatPos(b.id)) warn(w, `requires aponta para beat posterior: ${req}`)
    }
    if (b.participants.length === 0) warn(w, 'beat sem participantes')
    for (const a of b.arcs) {
      const key = `${a}|${b.chapter}|${b.order}`
      const prev = seenSlot.get(key)
      if (prev) warn(w, `mesma posição (${b.chapter}, ${b.order}) que ${prev} no arco ${a}`)
      else seenSlot.set(key, b.id)
    }
  }

  // ciclos em requires
  const state = new Map<string, number>()
  const visit = (id: string, path: string[]): void => {
    const s = state.get(id) ?? 0
    if (s === 1) {
      err(`beats/${id}`, `ciclo em requires: ${[...path, id].join(' → ')}`)
      return
    }
    if (s === 2) return
    state.set(id, 1)
    for (const req of beatById.get(id)?.requires ?? []) if (beatById.has(req)) visit(req, [...path, id])
    state.set(id, 2)
  }
  for (const b of canon.beats) visit(b.id, [])

  const revealedBy = new Map<string, number>()
  for (const b of canon.beats) for (const r of b.reveals) revealedBy.set(r, (revealedBy.get(r) ?? 0) + 1)
  for (const r of canon.revelations) {
    const w = `revelations/${r.id}`
    check(w, r.clues, ids.beats, 'beat')
    if (r.clues.length < 3) warn(w, `só ${r.clues.length} pista(s) (regra das três pistas)`)
    if (!revealedBy.get(r.id)) warn(w, 'nenhum beat a revela (reveals)')
  }

  for (const a of canon.ambitions) {
    const w = `ambitions/${a.id}`
    checkOne(w, a.pc, ids.characters, 'PC')
    if (ids.characters.has(a.pc) && !pcs.has(a.pc)) err(w, 'pc não é um PC')
    check(w, a.npcs, ids.characters, 'personagem')
    check(w, a.arcs, ids.arcs, 'arco')
    check(w, a.satisfiedBy, ids.beats, 'beat')
    check(w, a.threatenedBy, ids.beats, 'beat')
  }

  const inBeats = new Set(canon.beats.flatMap((b) => b.participants))
  for (const c of canon.characters) if (!inBeats.has(c.id) && c.kind !== 'deity' && c.kind !== 'pc') warn(`characters/${c.id}`, 'não participa em nenhum beat')
  const arcsUsed = new Set(canon.beats.flatMap((b) => b.arcs))
  for (const a of canon.arcs) if (!arcsUsed.has(a.id) && a.kind !== 'pcAmbition') warn(`arcs/${a.id}`, 'arco sem beats')


  return { canon, problems }
}

/** Posição temporal global de um beat: (capítulo, ordem) → número comparável. */
export function makeBeatPos(canon: Canon): (beatId: string) => number {
  const chapterIndex = new Map(canon.campaign.chapters.map((c, i) => [c.id, i]))
  const beats = new Map(canon.beats.map((b) => [b.id, b]))
  return (id) => {
    const b = beats.get(id)
    return b ? (chapterIndex.get(b.chapter) ?? 99) * 1000 + b.order : -1
  }
}
