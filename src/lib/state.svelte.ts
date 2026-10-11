// Estado da app: ficheiros de dados (fonte de verdade), estado de jogo, UI.
// Os ficheiros embebidos no build são o fallback; com token, lê-se o repo e escreve-se de volta.
// Duas camadas: `book` (o livro, nunca editado pela app) e `campaign` (a nossa campanha).
import type { Ambition, Attitude, Beat, Canon, Character, Collection, PlayState, Problem, Relation, Session } from './types.ts'
import { COLLECTIONS, relationKey, uid } from './types.ts'
import { arvore, assemble, embeddedFiles, emptyPlay, fileForEdits, normalizePlay, parsePath, rawOfLayer, stableJson, type DataFile } from './data.ts'
import { calcularEstado, type Estado } from './estado.ts'
import { Indice } from './ficha.ts'
import { construirGrelha, tiposDeLinha, type Grelha, type Linha } from './grelha/modelo.ts'
import { aplicarDm, type DmEntry } from './grelha/dm.ts'
import { tipoLinhaDe } from './grelha/dona.ts'
import { camada } from './grelha/store.svelte.ts'

export type Edicao =
  | { modo: 'celula'; linha: string; col: string }
  | { modo: 'cabecalho'; linha: string }
  | { modo: 'nota'; linha?: string; col?: string }
  | { modo: 'nova-linha' }
  | { modo: 'acompanhar' }

export interface GrelhaViva extends Grelha {
  notasSoltas: DmEntry[]
  planosPassados: { entrada: DmEntry; linha: Linha }[]
}
import { makeBeatPos } from './validate.ts'
import { ConflictError, fetchRemoteFiles, getToken, putFile } from './github.ts'
import { defaultFilters, type GraphFilters } from './graph.ts'
import type { Layer, LayerInfo } from './layers.ts'

const STORAGE_KEY = 'campaign-cotn-v1'
const STATE_PATH = 'data/state.json'

export type View = 'grelha' | 'tempo' | 'grafo' | 'pcs' | 'frentes' | 'revelacoes' | 'sessao' | 'indice' | 'definicoes' | 'ficha'
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

/**
 * Fase A da migração (docs/arquitetura.md): a edição do cânone e do estado de jogo na app está desligada.
 * As correções e as marcas da mesa entram pelo fecho, com o Claude; a app volta a escrever na fase D, só em grelha/dm.json.
 */
export const EDICAO_DESLIGADA = 'As vistas antigas já não editam: edita na Grelha (a tua camada) ou na Ficha; o resto entra pelo fecho, com o Claude.'

function initialFiles(): Record<string, DataFile> {
  const files = embeddedFiles()
  if (!files[STATE_PATH]) files[STATE_PATH] = { path: STATE_PATH, kind: 'state', layer: 'state', content: emptyPlay(), dirty: false }
  // Edições locais guardadas antes da migração já não têm onde entrar: ignoram-se.
  void loadPersisted
  return files
}

// ---- estado reactivo -------------------------------------------------------

export const store = $state({
  files: initialFiles(),
  sync: { status: 'idle' as 'idle' | 'loading' | 'saving' | 'ok' | 'error', message: '', remoteLoaded: false, lastSync: '' },
})

export const ui = $state({
  view: 'tempo' as View,
  /** 'campaign' = livro + as nossas alterações; 'book' = só o livro, como referência. */
  layerView: 'campaign' as 'campaign' | 'book',
  chapter: '' as string,
  cursorMode: 'chapter' as 'chapter' | 'played',
  selection: null as Selection | null,
  /** Selecções anteriores, para "voltar" no painel de detalhe. */
  history: [] as Selection[],
  filters: defaultFilters() as GraphFilters,
  pcId: null as string | null,
  showDeps: false,
  onlyUnplayed: false,
  onlyChanges: false,
  /** Linha temporal: só o capítulo escolhido ou todos. */
  timelineMode: 'chapter' as 'chapter' | 'all',
  searchOpen: false,
  sidebarCollapsed: false,
  helpOpen: false,
  /** Ficha aberta (vista «ficha»): a id do documento. */
  fichaId: null as string | null,
  /** Gaveta de edição da Grelha (camada do DM). */
  edicao: null as Edicao | null,
})

// A estrutura nova, já lida pelo build, e o que se calcula dela: o estado (docs/arquitetura.md, secção 6) e o índice das fichas.
const estadoD: Estado = calcularEstado(arvore)
const indiceD: Indice = new Indice(arvore)

const assembled = $derived(assemble(store.files, ui.layerView))
const canonD = $derived(assembled.canon)
const problemsD = $derived(assembled.problems)
const layersD = $derived(assembled.layers)
const bookRawD = $derived(rawOfLayer(store.files, 'book'))
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

const tipoLinhaD = tipoLinhaDe(tiposDeLinha(arvore))
// A Grelha: a camada automática (registo + cânone) com a camada do DM por cima; refaz-se quando dm/revisao/linhas mudam.
const grelhaD = $derived.by((): GrelhaViva => {
  const jogadosDm = new Set(camada.dm.filter((e) => e.kind === 'jogado' && !e.deleted && e.beat).map((e) => String(e.beat)))
  const g = construirGrelha({
    arvore,
    estado: estadoD,
    nome: (id) => indiceD.nome(id),
    linhas: camada.linhas,
    notas: camada.revisao.notes as unknown as Record<string, unknown>[],
    capitulos: canonD.campaign.chapters,
    capituloAtual: playD.currentChapter ?? canonD.campaign.chapters[0]?.id ?? '',
    curto: (c) => chapterShort(c),
    corPc: (pc) => canonD.arcs.find((a) => a.ownerPc === pc)?.color ?? '#8A96A0',
    jogadosDm,
  })
  const proxima = g.colunas.find((c) => c.tipo === 'proxima')
  const extra = aplicarDm(g, camada.dm, camada.revisao, {
    tipoLinha: tipoLinhaD,
    nome: (id) => indiceD.nome(id),
    jogadas: new Set(g.colunas.filter((c) => c.sessao).map((c) => c.chave)),
    proximaChave: proxima?.chave ?? '',
    rotuloColuna: (chave) => `→ ${g.colunas.find((c) => c.chave === chave)?.label ?? chave}`,
  })
  return { ...g, ...extra }
})

/** Acesso ao estado derivado (Svelte não permite exportar $derived directamente). */
export const world = {
  get canon(): Canon {
    return canonD
  },
  get problems(): Problem[] {
    return problemsD
  },
  get layers(): LayerInfo {
    return layersD
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
  get readOnly(): boolean {
    return ui.layerView === 'book'
  },
  get estado(): Estado {
    return estadoD
  },
  get indice(): Indice {
    return indiceD
  },
  get grelha(): GrelhaViva {
    return grelhaD
  },
  get arvore() {
    return arvore
  },
  get tipoLinha() {
    return tipoLinhaD
  },
}

export function abrirEdicao(e: Edicao): void {
  ui.selection = null
  ui.edicao = e
}
export function fecharEdicao(): void {
  ui.edicao = null
}

const KIND_TO_COLLECTION: Record<SelKind, Collection | null> = {
  character: 'characters',
  faction: 'factions',
  location: 'locations',
  beat: 'beats',
  arc: 'arcs',
  revelation: 'revelations',
  ambition: 'ambitions',
}

/** Camada de uma entidade na vista actual: book (do livro), modified (livro alterado), campaign (nossa). */
export function layerOf(kind: SelKind, id: string): Layer {
  const c = KIND_TO_COLLECTION[kind]
  if (!c) return 'book'
  return layersD.entities.get(`${c}/${id}`) ?? 'book'
}
export function relationLayer(r: Relation): Layer {
  return layersD.relations.get(relationKey(r)) ?? 'book'
}
/** A entrada original do livro (para comparar com a versão alterada). */
export function bookOriginal(kind: SelKind, id: string): Record<string, unknown> | undefined {
  const c = KIND_TO_COLLECTION[kind]
  if (!c || c === 'relations') return undefined
  return (bookRawD[c] as Record<string, unknown>[]).find((x) => x && x.id === id)
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

// Cursor inicial: o capítulo em que a mesa está (state.json) ou o primeiro.
if (canonD.campaign.chapters.length) {
  const cur = playD.currentChapter
  ui.chapter = cur && canonD.campaign.chapters.some((c) => c.id === cur) ? cur : canonD.campaign.chapters[0].id
}

/** Nome curto de um capítulo para pílulas: "Prólogo", "1", "2"… */
export function chapterShort(id: string): string {
  const i = chapterIndexD.get(id)
  const ch = canonD.campaign.chapters.find((c) => c.id === id)
  if (!ch) return id
  if (/^pr[óo]logo/i.test(ch.name)) return 'Prólogo'
  const m = ch.name.match(/^Acto\s+(\d+)/i)
  if (m) return `A${m[1]}`
  return String(i ?? '')
}
export function chapterName(id: string): string {
  return canonD.campaign.chapters.find((c) => c.id === id)?.name ?? id
}
export function setChapter(id: string): void {
  ui.chapter = id
  ui.cursorMode = 'chapter'
}

// ---- edição (sempre na camada campaign; o livro nunca é alterado) ----------

function guard(): boolean {
  store.sync.status = 'error'
  store.sync.message = EDICAO_DESLIGADA
  return false
}

function campaignFileOf(kind: Collection, id: string): DataFile | undefined {
  for (const f of Object.values(store.files)) {
    if (f.layer !== 'campaign' || f.kind !== kind || !Array.isArray(f.content)) continue
    if ((f.content as { id?: string }[]).some((x) => x.id === id)) return f
  }
  return undefined
}

function inBook(kind: Collection, id: string): boolean {
  return (bookRawD[kind] as { id?: string }[]).some((x) => x && x.id === id)
}

function ensureEditsFile(kind: Collection): DataFile {
  const path = fileForEdits(kind)
  if (!store.files[path]) store.files[path] = { path, kind, layer: 'campaign', content: [], dirty: true }
  return store.files[path]
}

/** Actualiza campos de uma entidade: patch na camada campaign (o livro fica intacto). */
export function editEntity(kind: Collection, id: string, patch: Record<string, unknown>): void {
  if (!guard()) return
  const f = campaignFileOf(kind, id)
  if (f) {
    const list = f.content as Record<string, unknown>[]
    const i = list.findIndex((x) => x.id === id)
    list[i] = { ...list[i], ...patch }
    f.dirty = true
    return
  }
  if (!inBook(kind, id)) return
  const e = ensureEditsFile(kind)
  ;(e.content as Record<string, unknown>[]).push({ id, ...patch })
  e.dirty = true
}

export function addEntity(kind: Collection, entity: Record<string, unknown>): void {
  if (!guard()) return
  const f = ensureEditsFile(kind)
  ;(f.content as unknown[]).push({ ...entity })
  f.dirty = true
}

/** Remove: apaga da campanha se for nossa; se vier do livro, esconde-a com `_remove`. */
export function removeEntity(kind: Collection, id: string): void {
  if (!guard()) return
  const f = campaignFileOf(kind, id)
  if (f) {
    f.content = (f.content as { id?: string }[]).filter((x) => x.id !== id)
    f.dirty = true
  }
  if (inBook(kind, id)) {
    const e = ensureEditsFile(kind)
    ;(e.content as Record<string, unknown>[]).push({ id, _remove: true })
    e.dirty = true
  }
}

/** Repõe a versão do livro de uma entidade (apaga o patch / a remoção da campanha). */
export function revertToBook(kind: Collection, id: string): void {
  if (!guard()) return
  for (const f of Object.values(store.files)) {
    if (f.layer !== 'campaign' || f.kind !== kind || !Array.isArray(f.content)) continue
    const list = f.content as { id?: string }[]
    const kept = list.filter((x) => x.id !== id)
    if (kept.length !== list.length) {
      f.content = kept
      f.dirty = true
    }
  }
}

export function addRelation(r: Relation): void {
  if (!guard()) return
  const f = ensureEditsFile('relations')
  const key = relationKey(r)
  const list = f.content as Relation[]
  if (list.some((x) => relationKey(x) === key)) return
  list.push({ ...r })
  f.dirty = true
}

export function removeRelation(r: Relation): void {
  if (!guard()) return
  const key = relationKey(r)
  let removedOurs = false
  for (const f of Object.values(store.files)) {
    if (f.layer !== 'campaign' || f.kind !== 'relations' || !Array.isArray(f.content)) continue
    const list = f.content as Relation[]
    const kept = list.filter((x) => relationKey(x) !== key)
    if (kept.length !== list.length) {
      f.content = kept
      f.dirty = true
      removedOurs = true
    }
  }
  const fromBook = (bookRawD.relations as Relation[]).some((x) => x && relationKey(x) === key)
  if (fromBook && !removedOurs) {
    const e = ensureEditsFile('relations')
    ;(e.content as Record<string, unknown>[]).push({ from: r.from, to: r.to, type: r.type, _remove: true })
    e.dirty = true
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
  if (!guard()) return
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
  if (id) setChapter(id)
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
  if (ui.selection && (ui.selection.kind !== kind || ui.selection.id !== id)) ui.history = [...ui.history.slice(-29), ui.selection]
  ui.selection = { kind, id }
  ui.searchOpen = false
}
export function back(): void {
  const prev = ui.history.pop()
  ui.selection = prev ?? null
}
export function closeSelection(): void {
  ui.selection = null
  ui.history = []
  ui.edicao = null
}
/** Abre a linha temporal no capítulo do beat. */
export function goToBeat(id: string): void {
  const b = beatById(id)
  if (!b) return
  setChapter(b.chapter)
  ui.timelineMode = 'chapter'
  setView('tempo')
  select('beat', id)
}
export function setView(v: View): void {
  ui.view = v
  const alvo = v === 'ficha' && ui.fichaId ? `#/ficha/${ui.fichaId}` : `#/${v}`
  if (location.hash !== alvo) history.replaceState(null, '', alvo)
}
/** Abre a ficha de uma coisa (qualquer documento com id, sessões incluídas). */
export function abrirFicha(id: string): void {
  ui.fichaId = id
  ui.selection = null
  ui.edicao = null
  setView('ficha')
}
function readHash(): void {
  const h = location.hash.replace(/^#\/?/, '')
  const f = h.match(/^ficha\/([a-z0-9-]+)$/)
  if (f) {
    ui.fichaId = f[1]
    ui.view = 'ficha'
    return
  }
  const v = h as View
  const views: View[] = ['grelha', 'tempo', 'grafo', 'pcs', 'frentes', 'revelacoes', 'sessao', 'indice', 'definicoes']
  if (views.includes(v)) ui.view = v
}
if (typeof window !== 'undefined') {
  readHash()
  window.addEventListener('hashchange', readHash)
}

// ---- sincronização GitHub --------------------------------------------------

/** Fase A: o cânone vem do build (src/generated/antigo.json); não se lê data/ ao vivo. O token fica guardado para a fase D. */
export async function loadRemote(): Promise<void> {
  if (!getToken()) return
  store.sync.status = 'ok'
  store.sync.lastSync = new Date().toLocaleTimeString('pt-PT')
  store.sync.message = 'Os dados vêm do build da estrutura nova; as alterações ao cânone chegam com o deploy seguinte.'
  void fetchRemoteFiles
}

/** Fase A: nada se grava a partir da app. */
export async function saveRemote(): Promise<void> {
  store.sync.status = 'error'
  store.sync.message = EDICAO_DESLIGADA
  void putFile
  void stableJson
  void ConflictError
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
        store.files[STATE_PATH] = { path: STATE_PATH, kind: 'state', layer: 'state', content: normalizePlay(obj), dirty: true }
        return
      }
      for (const [path, content] of Object.entries(obj)) {
        const p = parsePath(path)
        if (!p) continue
        store.files[path] = { path, kind: p.kind, layer: p.layer, content, sha: store.files[path]?.sha, dirty: true }
      }
    } catch {
      alert('Ficheiro inválido.')
    }
  })
}

export { COLLECTIONS }
