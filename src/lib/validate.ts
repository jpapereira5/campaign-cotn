// Normalização + validação dos dados. Puro (sem DOM): usado pela app e pelo script.
import type {
  Ambition, Arc, Beat, Campaign, Canon, Character, Faction, Location, PlayState, Problem, Relation, Revelation,
} from './types.ts'
import { ARC_KINDS, ARC_LAYERS, ARC_STATES, ATTITUDES, BEAT_STATUSES, CHARACTER_KINDS, RELATION_TYPES, SEED_STATES } from './types.ts'

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
  const kind = oneOf(r.kind, ARC_KINDS, 'main')
  return {
    id: str(r.id),
    name: str(r.name),
    kind,
    color: str(r.color, '#888888'),
    ownerPc: str(r.ownerPc) || undefined,
    order: num(r.order),
    summary: str(r.summary),
    camada: oneOf(r.camada, ARC_LAYERS, kind === 'pcAmbition' ? 'pc' : 'campanha'),
    abre: str(r.abre) || undefined,
    paga: str(r.paga) || undefined,
    deixa: str(r.deixa) || undefined,
    sementes: arr(r.sementes).map((s) => ({
      alvo: str(s.alvo),
      beat: str(s.beat) || undefined,
      estado: oneOf(s.estado, SEED_STATES, 'planeada'),
      ultimaJanela: str(s.ultimaJanela) || undefined,
      nome: str(s.nome) || undefined,
    })),
    estado: oneOf(r.estado, ARC_STATES, 'ativa'),
    fundidaEm: str(r.fundidaEm) || undefined,
    sabe: str(r.sabe) || undefined,
    emJogo: str(r.emJogo) || undefined,
    notes: str(r.notes),
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
    status: oneOf(r.status, BEAT_STATUSES, 'pronto'),
    played: r.played ? { session: str(obj(r.played).session), asPlayed: str(obj(r.played).asPlayed) } : undefined,
    interface: str(r.interface) || undefined,
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
    const w = `arcs/${a.id}`
    if (a.ownerPc) {
      checkOne(w, a.ownerPc, ids.characters, 'PC')
      if (ids.characters.has(a.ownerPc) && !pcs.has(a.ownerPc)) err(w, 'ownerPc não é um PC')
    }
    if (a.camada === 'pc' && !a.ownerPc) warn(w, 'linha de camada pc sem ownerPc')
    if (a.paga && !ids.beats.has(a.paga) && !ids.chapters.has(a.paga)) err(w, `paga desconhecido (beat ou capítulo): ${a.paga}`)
    if (a.estado === 'fundida' && !a.fundidaEm) err(w, 'fundida sem fundidaEm')
    if (a.fundidaEm) {
      checkOne(w, a.fundidaEm, ids.arcs, 'linha')
      if (a.fundidaEm === a.id) err(w, 'fundida em si própria')
      if (a.estado !== 'fundida') warn(w, 'fundidaEm só faz sentido com estado fundida')
    }
    if (a.camada === 'fio' && a.estado === 'ativa' && !a.paga) warn(w, 'fio ativo sem beat de pagamento')
    for (const [i, s] of a.sementes.entries()) {
      const ws = `${w}/sementes[${i}]`
      if (!s.alvo) err(ws, 'semente sem alvo')
      checkOne(ws, s.beat, ids.beats, 'beat')
      checkOne(ws, s.ultimaJanela, ids.chapters, 'capítulo')
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
      if (beatById.get(req)?.status === 'descartado' && b.status !== 'descartado') warn(w, `requer um beat descartado: ${req}`)
    }
    if (b.interface && b.arcs.length < 2) warn(w, 'tem nome de interface mas está só numa linha')
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

/**
 * Regras que precisam do estado de jogo (state.json) além do cânone: sessões vs. beats jogados,
 * escolhas tomadas, estado dos beats por fechar, linhas e sementes, NPCs mortos em cenas futuras.
 * Nunca lança; os avisos são a lista do que o fecho ainda tem de reconciliar.
 */
export function validatePlay(canon: Canon, play: PlayState): Problem[] {
  const problems: Problem[] = []
  const err = (where: string, message: string) => problems.push({ level: 'error', where, message })
  const warn = (where: string, message: string) => problems.push({ level: 'warn', where, message })
  const beatById = new Map(canon.beats.map((b) => [b.id, b]))
  const chapterIndex = new Map(canon.campaign.chapters.map((c, i) => [c.id, i]))
  const sessionIds = new Set(play.sessions.map((s) => s.id))
  const played = new Set(play.playedBeats)
  const pcs = canon.characters.filter((c) => c.kind === 'pc')
  const arcOwner = new Map(canon.arcs.filter((a) => a.ownerPc).map((a) => [a.id, a.ownerPc as string]))
  const pos = makeBeatPos(canon)

  if (play.currentChapter && !chapterIndex.has(play.currentChapter)) err('state.currentChapter', `capítulo desconhecido: ${play.currentChapter}`)
  const nowIdx = play.currentChapter ? (chapterIndex.get(play.currentChapter) ?? -1) : -1

  for (const id of play.playedBeats) if (!beatById.has(id)) err('state.playedBeats', `beat desconhecido: ${id}`)
  const revIds = new Set(canon.revelations.map((r) => r.id))
  for (const id of play.revealed) if (!revIds.has(id)) err('state.revealed', `revelação desconhecida: ${id}`)
  const factionIds = new Set(canon.factions.map((f) => f.id))
  for (const key of play.portentsDone) {
    const [f, ch] = key.split(':')
    if (!factionIds.has(f) || !chapterIndex.has(ch)) err('state.portentsDone', `portento desconhecido: ${key}`)
  }
  const charIds = new Set(canon.characters.map((c) => c.id))
  for (const id of Object.keys(play.attitudes)) if (!charIds.has(id)) err('state.attitudes', `personagem desconhecida: ${id}`)

  // sessões: as jogadas têm de bater certo com playedBeats; a planeada tem de dar cena a cada PC
  const inSession = new Set<string>()
  for (const s of play.sessions) {
    const w = `state.sessions/${s.id}`
    if (s.chapter && !chapterIndex.has(s.chapter)) err(w, `capítulo desconhecido: ${s.chapter}`)
    for (const id of s.beats) {
      if (!beatById.has(id)) {
        err(w, `beat desconhecido: ${id}`)
        continue
      }
      if (s.estado === 'jogada') {
        inSession.add(id)
        if (!played.has(id)) warn(w, `beat da sessão não está marcado como jogado: ${id}`)
      } else if (played.has(id)) warn(w, `sessão planeada com beat já jogado: ${id}`)
    }
    if (s.estado === 'planeada') {
      for (const pc of pcs) {
        const has = s.beats.some((id) => {
          const b = beatById.get(id)
          return b && (b.participants.includes(pc.id) || b.arcs.some((a) => arcOwner.get(a) === pc.id))
        })
        if (!has) warn(w, `sessão planeada sem cena para ${pc.name}`)
      }
    }
  }
  for (const id of play.playedBeats) if (beatById.has(id) && !inSession.has(id)) warn(`beats/${id}`, 'jogado mas nenhuma sessão o lista')

  // escolhas tomadas
  for (const [beatId, labels] of Object.entries(play.choicesMade)) {
    const w = `state.choicesMade/${beatId}`
    const b = beatById.get(beatId)
    if (!b) {
      err(w, 'beat desconhecido')
      continue
    }
    if (!played.has(beatId)) warn(w, 'escolha tomada num beat não jogado')
    for (const label of labels) {
      const ch = b.choices.find((c) => c.label === label)
      if (!ch) {
        err(w, `escolha desconhecida: «${label}»`)
        continue
      }
      for (const next of ch.leadsTo) if (beatById.get(next)?.status === 'descartado') warn(w, `a escolha «${label}» leva a um beat descartado: ${next}`)
    }
  }

  // estado dos beats vs. mesa: o que está por fechar
  for (const b of canon.beats) {
    const w = `beats/${b.id}`
    if (b.status === 'jogado' && !played.has(b.id)) warn(w, 'status jogado mas não está em playedBeats')
    if (played.has(b.id) && b.status !== 'jogado') warn(w, `jogado na mesa mas status «${b.status}» (por fechar)`)
    if (b.played) {
      if (!sessionIds.has(b.played.session)) err(w, `played.session desconhecida: ${b.played.session}`)
      if (b.status !== 'jogado') warn(w, 'tem played (como correu) mas status não é jogado')
    }
    if (played.has(b.id) && b.choices.length && !play.choicesMade[b.id]) warn(w, 'jogado com escolhas mas sem escolha tomada registada')
  }

  // linhas e sementes
  for (const a of canon.arcs) {
    const w = `arcs/${a.id}`
    if (a.abre && !beatById.has(a.abre) && !sessionIds.has(a.abre)) err(w, `abre desconhecido (beat ou sessão): ${a.abre}`)
    if (a.paga && played.has(a.paga) && a.estado === 'ativa') warn(w, `o beat de pagamento já foi jogado (${a.paga}) e a linha continua ativa`)
    for (const [i, s] of a.sementes.entries()) {
      const ws = `${w}/sementes[${i}]`
      if (s.alvo && !chapterIndex.has(s.alvo) && !sessionIds.has(s.alvo)) err(ws, `alvo desconhecido (capítulo ou sessão): ${s.alvo}`)
      if (s.estado === 'jogada' && (!s.beat || !played.has(s.beat))) warn(ws, 'semente jogada sem beat jogado')
      if (s.estado !== 'jogada' && s.beat && played.has(s.beat)) warn(ws, `o beat da semente já foi jogado (${s.beat}): passar a jogada`)
      if (s.estado === 'posta' && !s.beat) warn(ws, 'semente posta sem beat')
      if (s.estado === 'planeada' && s.ultimaJanela && nowIdx >= 0) {
        const last = chapterIndex.get(s.ultimaJanela)
        if (last !== undefined && last < nowIdx) warn(ws, `fora da última janela (${s.ultimaJanela}) e ainda planeada`)
      }
    }
  }

  // NPC morto a participar em beat futuro. Só mortes certas: o estado começa por «morto/morta» e não é
  // condicional («morto ou preso», «se passarem 7 dias»); as mortes de um final possível ficam de fora.
  for (const c of canon.characters) {
    for (const st of c.states) {
      if (!/^mort[oa]\b/i.test(st.state) || /\b(ou|se)\b/i.test(st.state) || !beatById.has(st.fromBeat)) continue
      const deathPos = pos(st.fromBeat)
      for (const b of canon.beats) {
        if (b.id === st.fromBeat || b.status === 'descartado' || played.has(b.id) || !b.participants.includes(c.id)) continue
        if (pos(b.id) > deathPos) warn(`beats/${b.id}`, `${c.name} morre em ${st.fromBeat} mas participa aqui`)
      }
    }
  }
  return problems
}
