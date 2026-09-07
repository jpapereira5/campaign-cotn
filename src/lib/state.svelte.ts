// Estado da app: ficheiros de dados (fonte de verdade), estado de jogo, UI.
// Os ficheiros embebidos no build são o fallback; com token, lê-se o repo e escreve-se de volta.
import type { Ambition, Attitude, Beat, Canon, Character, Collection, PlayState, Problem, Relation, Session } from './types.ts'
import { COLLECTIONS, relationKey, uid } from './types.ts'
import { assemble, embeddedFiles, emptyPlay, fileForNew, normalizePlay, stableJson, type DataFile } from './data.ts'
import { makeBeatPos } from './validate.ts'
import { ConflictError, fetchRemoteFiles, getToken, putFile } from './github.ts'
import { defaultFilters, type GraphFilters } from './graph.ts'

const STORAGE_KEY = 'campaign-cotn-v1'
const STATE_PATH = 'data/state.json'

export type View = 'tempo' | 'grafo' | 'pcs' | 'frentes' | 'revelacoes' | 'sessao' | 'indice' | 'definicoes'
export type SelKind = 'character' | 'faction' | 'location' | 'beat' | 'arc' | 'revelation' | 'ambition'
export interface Selection {
  kind: SelKind
  id: string
}

interface Persisted {
  version: 1
  files: Record<string, DataFile>
  shas: Record<string, string>
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>
      return { version: 1, files: p.files ?? {}, shas: p.shas ?? {} }
    }
  } catch {
    /* defaults */
  }
  return { version: 1, files: {}, shas: {} }
}

function initialFiles(): Record<string, DataFile> {
  const files = embeddedFiles()
  if (!files[STATE_PATH]) files[STATE_PATH] = { path: STATE_PATH, kind: 'state', content: emptyPlay(), dirty: false }
  const p = loadPersisted()
  for (const [path, f] of Object.entries(p.files)) if (f.dirty) files[path] = f
  for (const [path, sha] of Object.entries(p.shas)) if (files[path] && !files[path].sha) files[path].sha = sha
  return files
}

// ---- estado reactivo -------------------------------------------------------

export const store = $state({
  files: initialFiles(),
  sync: { status: 'idle' as 'idle' | 'loading' | 'saving' | 'ok' | 'error', message: '', remoteLoaded: false, lastSync: '' },
})

export const ui = $state({
  view: 'tempo' as View,
  chapter: '' as string,
  cursorMode: 'chapter' as 'chapter' | 'played',
  selection: null as Selection | null,
  filters: defaultFilters() as GraphFilters,
  pcId: null as string | null,
  showDeps: false,
  onlyUnplayed: false,
})

const assembled = $derived(assemble(store.files))
const canonD = $derived(assembled.canon)
const problemsD = $derived(assembled.problems)
const beatPosD = $derived(makeBeatPos(canonD))
const playD = $derived(normalizePlay(store.files[STATE_PATH]?.content))
const chapterIndexD = $derived(new Map(canonD.campaign.chapters.map((c, i) => [c.id, i])))
const beatsSortedD = $derived([...canonD.beats].sort((a, b) => beatPosD(a.id) - beatPosD(b.id) || a.id.localeCompare(b.id)))
const cursorD = $derived.by(() => {
  if (ui.cursorMode === 'played') {
    const played = playD.playedBeats.map(beatPosD).filter((p) => p >= 0)
    return played.length ? Math.max(...played) : -1
  }
  const idx = chapterIndexD.get(ui.chapter)
  if (idx === undefined) return Number.MAX_SAFE_INTEGER
  return idx * 1000 + 999
})

/** Acesso ao estado derivado (Svelte não permite exportar $derived directamente). */
export const world = {
  get canon(): Canon {
    return canonD
  },
  get problems(): Problem[] {
    return problemsD
  },
  get play(): PlayState {
    return playD
  },
  get beatPos(): (id: string) => number {
    return beatPosD
  },
  get cursor(): number {
    return cursorD
  },
  get chapterIndex(): Map<string, number> {
    return chapterIndexD
  },
  get beatsSorted(): Beat[] {
    return beatsSortedD
  },
  get dirtyFiles(): DataFile[] {
    return Object.values(store.files).filter((f) => f.dirty)
  },
}

export function characterById(id: string): Character | undefined {
  return canonD.characters.find((c) => c.id === id)
}
export function beatById(id: string): Beat | undefined {
  return canonD.beats.find((b) => b.id === id)
}
export function nameOf(id: string): string {
  return (
    canonD.characters.find((c) => c.id === id)?.name ??
    canonD.factions.find((f) => f.id === id)?.name ??
    canonD.locations.find((l) => l.id === id)?.name ??
    canonD.beats.find((b) => b.id === id)?.title ??
    canonD.arcs.find((a) => a.id === id)?.name ??
    canonD.revelations.find((r) => r.id === id)?.text ??
    id
  )
}
export function characterState(c: Character, cursor = cursorD): string {
  let state = ''
  for (const s of c.states) if (beatPosD(s.fromBeat) <= cursor && beatPosD(s.fromBeat) >= 0) state = s.state
  return state
}
export function attitudeOf(c: Character): Attitude | undefined {
  return playD.attitudes[c.id] ?? c.attitude
}
export function isPlayed(beatId: string): boolean {
  return playD.playedBeats.includes(beatId)
}

// ---- persistência local ----------------------------------------------------

function persist(): void {
  try {
    const files: Record<string, DataFile> = {}
    const shas: Record<string, string> = {}
    for (const f of Object.values(store.files)) {
      if (f.dirty) files[f.path] = $state.snapshot(f) as DataFile
      if (f.sha) shas[f.path] = f.sha
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, files, shas } satisfies Persisted))
  } catch {
    /* quota / privado */
  }
}

$effect.root(() => {
  $effect(() => {
    persist()
  })
})

if (canonD.campaign.chapters.length) ui.chapter = canonD.campaign.chapters[canonD.campaign.chapters.length - 1].id

// ---- edição ----------------------------------------------------------------

function fileOf(kind: Collection, id: string): DataFile | undefined {
  for (const f of Object.values(store.files)) {
    if (f.kind !== kind || !Array.isArray(f.content)) continue
    if ((f.content as { id?: string }[]).some((x) => x.id === id)) return f
  }
  return undefined
}

function ensureFile(kind: Collection): DataFile {
  const path = fileForNew(kind)
  if (!store.files[path]) store.files[path] = { path, kind, content: [], dirty: true }
  return store.files[path]
}

/** Actualiza campos de uma entidade (no ficheiro onde ela vive). */
export function editEntity(kind: Collection, id: string, patch: Record<string, unknown>): void {
  const f = fileOf(kind, id)
  if (!f) return
  const list = f.content as Record<string, unknown>[]
  const i = list.findIndex((x) => x.id === id)
  if (i < 0) return
  list[i] = { ...list[i], ...patch }
  f.dirty = true
}

export function addEntity(kind: Collection, entity: Record<string, unknown>): void {
  const f = ensureFile(kind)
  ;(f.content as unknown[]).push({ source: 'dm', ...entity })
  f.dirty = true
}

export function removeEntity(kind: Collection, id: string): void {
  const f = fileOf(kind, id)
  if (!f) return
  f.content = (f.content as { id?: string }[]).filter((x) => x.id !== id)
  f.dirty = true
}

export function addRelation(r: Relation): void {
  const f = ensureFile('relations')
  const key = relationKey(r)
  const list = f.content as Relation[]
  if (list.some((x) => relationKey(x) === key)) return
  list.push({ ...r, source: 'dm' })
  f.dirty = true
}

export function removeRelation(r: Relation): void {
  const key = relationKey(r)
  for (const f of Object.values(store.files)) {
    if (f.kind !== 'relations' || !Array.isArray(f.content)) continue
    const list = f.content as Relation[]
    const kept = list.filter((x) => relationKey(x) !== key)
    if (kept.length !== list.length) {
      f.content = kept
      f.dirty = true
    }
  }
}

export function addPc(name: string): string {
  const id = 'c-pc-' + name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'c-pc-' + uid()
  if (canonD.characters.some((c) => c.id === id)) return id
  addEntity('characters', {
    id, name, kind: 'pc', factions: [], chapters: [], summary: '', goal: '', secret: '', wants: '', fears: '', states: [], tags: [],
  })
  addEntity('arcs', { id: 'a-pc-' + id.slice(5), name: `Ambições: ${name}`, kind: 'pcAmbition', color: '#e0b04a', ownerPc: id, order: 100, summary: '' })
  return id
}

export function addAmbition(pc: string, text: string): void {
  addEntity('ambitions', { id: 'amb-' + uid(), pc, text, npcs: [], arcs: [], satisfiedBy: [], threatenedBy: [], source: 'dm' } satisfies Ambition)
}

// ---- estado de jogo --------------------------------------------------------

function updatePlay(fn: (p: PlayState) => void): void {
  const f = store.files[STATE_PATH]
  const p = normalizePlay(f.content)
  fn(p)
  f.content = p
  f.dirty = true
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

export function togglePlayed(beatId: string): void {
  updatePlay((p) => (p.playedBeats = toggle(p.playedBeats, beatId)))
}
export function toggleRevealed(id: string): void {
  updatePlay((p) => (p.revealed = toggle(p.revealed, id)))
}
export function togglePortent(factionId: string, chapter: string): void {
  updatePlay((p) => (p.portentsDone = toggle(p.portentsDone, `${factionId}:${chapter}`)))
}
export function setAttitude(characterId: string, a: Attitude | null): void {
  updatePlay((p) => {
    if (a) p.attitudes[characterId] = a
    else delete p.attitudes[characterId]
  })
}
export function setNote(id: string, text: string): void {
  updatePlay((p) => {
    if (text.trim()) p.notes[id] = text
    else delete p.notes[id]
  })
}
export function setFlag(key: string, value: boolean): void {
  updatePlay((p) => {
    if (value) p.flags[key] = true
    else delete p.flags[key]
  })
}
export function setCurrentChapter(id: string | null): void {
  updatePlay((p) => (p.currentChapter = id))
}
export function upsertSession(s: Session): void {
  updatePlay((p) => {
    const i = p.sessions.findIndex((x) => x.id === s.id)
    if (i >= 0) p.sessions[i] = s
    else p.sessions.push(s)
  })
}
export function removeSession(id: string): void {
  updatePlay((p) => (p.sessions = p.sessions.filter((x) => x.id !== id)))
}

// ---- selecção / navegação --------------------------------------------------

export function select(kind: SelKind, id: string): void {
  ui.selection = { kind, id }
}
export function setView(v: View): void {
  ui.view = v
  if (location.hash !== `#/${v}`) history.replaceState(null, '', `#/${v}`)
}
function readHash(): void {
  const v = location.hash.replace(/^#\/?/, '') as View
  const views: View[] = ['tempo', 'grafo', 'pcs', 'frentes', 'revelacoes', 'sessao', 'indice', 'definicoes']
  if (views.includes(v)) ui.view = v
}
if (typeof window !== 'undefined') {
  readHash()
  window.addEventListener('hashchange', readHash)
}

// ---- sincronização GitHub --------------------------------------------------

export async function loadRemote(): Promise<void> {
  if (!getToken()) return
  store.sync.status = 'loading'
  store.sync.message = 'A ler o repositório…'
  try {
    const remote = await fetchRemoteFiles()
    for (const [path, f] of Object.entries(remote)) {
      const local = store.files[path]
      if (local?.dirty) {
        local.sha = f.sha // manter edições locais; sha actual para gravar por cima
        continue
      }
      store.files[path] = f
    }
    store.sync.remoteLoaded = true
    store.sync.status = 'ok'
    store.sync.lastSync = new Date().toLocaleTimeString('pt-PT')
    store.sync.message = `Dados do repositório carregados (${Object.keys(remote).length} ficheiros).`
  } catch (e) {
    store.sync.status = 'error'
    store.sync.message = (e as Error).message
  }
}

export async function saveRemote(): Promise<void> {
  const dirty = world.dirtyFiles
  if (!dirty.length) return
  if (!getToken()) {
    store.sync.status = 'error'
    store.sync.message = 'Sem token GitHub: exporta os ficheiros e faz commit à mão (Definições).'
    return
  }
  store.sync.status = 'saving'
  try {
    if (!store.sync.remoteLoaded) {
      // obter shas actuais sem perder edições locais
      const remote = await fetchRemoteFiles()
      for (const [path, f] of Object.entries(remote)) if (store.files[path]) store.files[path].sha = f.sha
      store.sync.remoteLoaded = true
    }
    for (const f of dirty) {
      store.sync.message = `A gravar ${f.path}…`
      const sha = await putFile(f.path, stableJson(f.content), f.sha, `data: ${f.path.replace(/^data\//, '')}`)
      f.sha = sha
      f.dirty = false
    }
    store.sync.status = 'ok'
    store.sync.lastSync = new Date().toLocaleTimeString('pt-PT')
    store.sync.message = `Gravado (${dirty.length} ficheiro(s)).`
  } catch (e) {
    store.sync.status = 'error'
    store.sync.message = e instanceof ConflictError ? e.message : (e as Error).message
  }
}

export function discardLocalChanges(): void {
  const fresh = embeddedFiles()
  for (const f of Object.values(store.files)) {
    if (!f.dirty) continue
    if (fresh[f.path]) store.files[f.path] = { ...fresh[f.path], sha: f.sha }
    else delete store.files[f.path]
  }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  if (getToken()) void loadRemote()
}

// ---- export / import manual -----------------------------------------------

function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDirty(): void {
  for (const f of world.dirtyFiles) download(f.path.replace(/\//g, '__'), stableJson(f.content))
}

export function exportAll(): void {
  download('campaign-cotn-tudo.json', stableJson(Object.fromEntries(Object.values(store.files).map((f) => [f.path, f.content]))))
}

export function importAll(file: File): void {
  file.text().then((text) => {
    try {
      const obj = JSON.parse(text) as Record<string, unknown>
      if (obj && typeof obj === 'object' && 'playedBeats' in obj) {
        // ficheiro de estado isolado
        store.files[STATE_PATH] = { path: STATE_PATH, kind: 'state', content: normalizePlay(obj), dirty: true }
        return
      }
      for (const [path, content] of Object.entries(obj)) {
        const kind = store.files[path]?.kind ?? (path.startsWith('data/') ? undefined : undefined)
        if (!store.files[path] && !kind) continue
        store.files[path] = { path, kind: store.files[path].kind, content, sha: store.files[path]?.sha, dirty: true }
      }
    } catch {
      alert('Ficheiro inválido.')
    }
  })
}

export { COLLECTIONS }
