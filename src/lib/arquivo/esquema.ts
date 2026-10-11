// Esquema da estrutura nova (docs/arquitetura.md): um ficheiro Markdown por coisa.
// Converte entre o modelo antigo (src/lib/types.ts) e os documentos novos, nos dois sentidos.
// Puro: usado por migrar.ts, montar.ts e verificar-migracao.ts.
import type { Ambition, Arc, Beat, Campaign, Character, Faction, Location, Relation, Revelation } from '../types.ts'
import { juntarSecoes, secao, secaoSe, secoes, type Doc, type Secao } from './md.ts'

export const LIVRO = 'livro'

export const PASTAS = {
  personagens: 'mundo/personagens',
  facoes: 'mundo/facoes',
  locais: 'mundo/locais',
  itens: 'mundo/itens',
  segredos: 'mundo/segredos',
  beats: 'plano/beats',
  fios: 'plano/fios',
  mesaFios: 'mesa/fios',
  jogadores: 'mesa/jogadores',
  sessoes: 'registo/sessoes',
} as const

export const TIPOS_FIO_MESA = ['teoria', 'mesa']

/** Pasta de uma id pelo prefixo; os fios de mesa (teoria, mesa) vão para mesa/fios. */
export function pastaDeId(id: string, tipo?: string): string {
  if (id.startsWith('c-')) return PASTAS.personagens
  if (id.startsWith('f-')) return PASTAS.facoes
  if (id.startsWith('l-')) return PASTAS.locais
  if (id.startsWith('i-')) return PASTAS.itens
  if (id.startsWith('r-')) return PASTAS.segredos
  if (id.startsWith('b-')) return PASTAS.beats
  if (id.startsWith('p-')) return PASTAS.jogadores
  if (id.startsWith('a-') || id.startsWith('amb-') || id.startsWith('t-')) return tipo && TIPOS_FIO_MESA.includes(tipo) ? PASTAS.mesaFios : PASTAS.fios
  throw new Error(`id sem pasta: ${id}`)
}

export const ORIGEM_LIVRO = [LIVRO]
export const eDoLivroApenas = (origem: unknown): boolean => Array.isArray(origem) && origem.length === 1 && origem[0] === LIVRO
export const temOrigemCampanha = (origem: unknown): boolean => Array.isArray(origem) && origem.some((o) => o !== LIVRO)

// ---- relações ---------------------------------------------------------------

export interface RelacaoNova {
  com: string
  tipo: string
  nota?: string
  desde?: string
  ate?: string
  se?: string
  origem: string
}

export function relacaoParaNova(r: Relation, origem: string): RelacaoNova {
  return {
    com: r.to,
    tipo: r.type,
    ...(r.label ? { nota: r.label } : {}),
    ...(r.fromBeat ? { desde: r.fromBeat } : {}),
    ...(r.untilBeat ? { ate: r.untilBeat } : {}),
    ...(r.condition ? { se: r.condition } : {}),
    origem,
  }
}

export function relacaoParaAntiga(from: string, r: Record<string, unknown>): Record<string, unknown> {
  return {
    from,
    to: String(r.com ?? ''),
    type: String(r.tipo ?? 'knows'),
    label: String(r.nota ?? ''),
    ...(r.desde ? { fromBeat: String(r.desde) } : {}),
    ...(r.ate ? { untilBeat: String(r.ate) } : {}),
    ...(r.se ? { condition: String(r.se) } : {}),
  }
}

const relsDe = (meta: Record<string, unknown>): Record<string, unknown>[] =>
  Array.isArray(meta.relacoes) ? (meta.relacoes as Record<string, unknown>[]) : []

// ---- personagens ------------------------------------------------------------

export function personagemParaDoc(c: Character, origem: string[], relacoes: RelacaoNova[], extras: Record<string, unknown> = {}, corpoExtra: Secao[] = []): Doc {
  const meta: Record<string, unknown> = {
    id: c.id,
    nome: c.name,
    tipo: c.kind,
    facoes: c.factions,
    ...(c.home ? { casa: c.home } : {}),
    capitulos: c.chapters,
    ...(c.wants ? { quer: c.wants } : {}),
    ...(c.fears ? { teme: c.fears } : {}),
    ...(c.attitude ? { atitude: c.attitude } : {}),
    ...(c.tags.length ? { tags: c.tags } : {}),
    ...(c.states.length ? { estados: c.states.map((s) => ({ desde: s.fromBeat, estado: s.state })) } : {}),
    ...(relacoes.length ? { relacoes } : {}),
    ...extras,
    origem,
  }
  const body = juntarSecoes({ intro: '', secoes: [...secaoSe('Resumo', c.summary), ...secaoSe('Objetivo', c.goal), ...secaoSe('Segredo', c.secret), ...corpoExtra] })
  return { meta, body }
}

export function docParaPersonagem(doc: Doc): { entidade: Record<string, unknown>; relacoes: Record<string, unknown>[] } {
  const m = doc.meta
  const c = secoes(doc.body)
  const id = String(m.id)
  const entidade: Record<string, unknown> = {
    id,
    name: String(m.nome ?? ''),
    kind: String(m.tipo ?? 'npc'),
    factions: m.facoes ?? [],
    ...(m.casa ? { home: m.casa } : {}),
    chapters: m.capitulos ?? [],
    summary: secao(c, 'Resumo') ?? '',
    goal: secao(c, 'Objetivo') ?? '',
    secret: secao(c, 'Segredo') ?? '',
    wants: String(m.quer ?? ''),
    fears: String(m.teme ?? ''),
    states: Array.isArray(m.estados) ? (m.estados as Record<string, unknown>[]).map((s) => ({ fromBeat: String(s.desde ?? ''), state: String(s.estado ?? '') })) : [],
    ...(m.atitude ? { attitude: m.atitude } : {}),
    tags: m.tags ?? [],
  }
  return { entidade, relacoes: relsDe(m).map((r) => relacaoParaAntiga(id, r)) }
}

// ---- fações -----------------------------------------------------------------

export function facaoParaDoc(f: Faction, origem: string[], relacoes: RelacaoNova[], extras: Record<string, unknown> = {}, corpoExtra: Secao[] = []): Doc {
  const meta: Record<string, unknown> = {
    id: f.id,
    nome: f.name,
    ...(f.motto ? { lema: f.motto } : {}),
    lideres: f.leaders,
    aliados: f.allies,
    inimigos: f.enemies,
    ...(relacoes.length ? { relacoes } : {}),
    ...extras,
    origem,
  }
  const body = juntarSecoes({ intro: '', secoes: [...secaoSe('Agenda', f.agenda), ...secaoSe('Face pública', f.publicFace), ...corpoExtra] })
  return { meta, body }
}

export function docParaFacao(doc: Doc, passos: { chapter: string; text: string }[]): { entidade: Record<string, unknown>; relacoes: Record<string, unknown>[] } {
  const m = doc.meta
  const c = secoes(doc.body)
  const id = String(m.id)
  const entidade: Record<string, unknown> = {
    id,
    name: String(m.nome ?? ''),
    motto: String(m.lema ?? ''),
    agenda: secao(c, 'Agenda') ?? '',
    publicFace: secao(c, 'Face pública') ?? '',
    leaders: m.lideres ?? [],
    allies: m.aliados ?? [],
    enemies: m.inimigos ?? [],
    portents: passos,
  }
  return { entidade, relacoes: relsDe(m).map((r) => relacaoParaAntiga(id, r)) }
}

/** Os portentos de uma fação passam a um fio «frente». */
export function frenteParaDoc(f: Faction, origem: string[]): Doc | null {
  if (!f.portents.length) return null
  const meta = {
    id: `t-frente-${f.id.replace(/^f-/, '')}`,
    tipo: 'frente',
    nome: `Frente: ${f.name}`,
    facao: f.id,
    envolve: [f.id],
    passos: f.portents.map((p) => ({ capitulo: p.chapter, texto: p.text })),
    origem,
  }
  return { meta, body: '' }
}

// ---- locais -----------------------------------------------------------------

export function localParaDoc(l: Location, origem: string[], corpoExtra: Secao[] = []): Doc {
  const meta: Record<string, unknown> = {
    id: l.id,
    nome: l.name,
    ...(l.parent ? { pai: l.parent } : {}),
    capitulo: l.chapter,
    origem,
  }
  return { meta, body: juntarSecoes({ intro: '', secoes: [...secaoSe('Resumo', l.summary), ...corpoExtra] }) }
}

export function docParaLocal(doc: Doc): Record<string, unknown> {
  const m = doc.meta
  const c = secoes(doc.body)
  return {
    id: String(m.id),
    name: String(m.nome ?? ''),
    ...(m.pai ? { parent: m.pai } : {}),
    chapter: String(m.capitulo ?? ''),
    summary: secao(c, 'Resumo') ?? '',
  }
}

// ---- segredos (revelações) --------------------------------------------------

export function segredoParaDoc(r: Revelation, origem: string[], extras: Record<string, unknown> = {}): Doc {
  const meta: Record<string, unknown> = { id: r.id, lista: r.list, pistas: r.clues, ...extras, origem }
  return { meta, body: juntarSecoes({ intro: '', secoes: secaoSe('Verdade', r.text) }) }
}

export function docParaSegredo(doc: Doc): Record<string, unknown> {
  const m = doc.meta
  const c = secoes(doc.body)
  return { id: String(m.id), list: String(m.lista ?? 'Geral'), text: secao(c, 'Verdade') ?? '', clues: m.pistas ?? [] }
}

// ---- beats ------------------------------------------------------------------

export function beatParaDoc(b: Beat, origem: string[]): Doc {
  const meta: Record<string, unknown> = {
    id: b.id,
    titulo: b.title,
    arcos: b.arcs,
    capitulo: b.chapter,
    ordem: b.order,
    ...(b.location ? { local: b.location } : {}),
    participantes: b.participants,
    revela: b.reveals,
    requer: b.requires,
    escolhas: b.choices.map((ch) => ({ opcao: ch.label, resultado: ch.outcome, levaA: ch.leadsTo })),
    ...(b.timer ? { relogio: b.timer } : {}),
    ...(b.portent ? { portento: { facao: b.portent.faction, texto: b.portent.text } } : {}),
    origem,
  }
  return { meta, body: juntarSecoes({ intro: '', secoes: [...secaoSe('Resumo', b.summary), ...secaoSe('Notas', b.notes)] }) }
}

export function docParaBeat(doc: Doc): Record<string, unknown> {
  const m = doc.meta
  const c = secoes(doc.body)
  const escolhas = Array.isArray(m.escolhas) ? (m.escolhas as Record<string, unknown>[]) : []
  const portento = m.portento && typeof m.portento === 'object' ? (m.portento as Record<string, unknown>) : null
  return {
    id: String(m.id),
    title: String(m.titulo ?? ''),
    arcs: m.arcos ?? [],
    chapter: String(m.capitulo ?? ''),
    order: typeof m.ordem === 'number' ? m.ordem : 0,
    ...(m.local ? { location: m.local } : {}),
    participants: m.participantes ?? [],
    summary: secao(c, 'Resumo') ?? '',
    reveals: m.revela ?? [],
    requires: m.requer ?? [],
    choices: escolhas.map((e) => ({ label: String(e.opcao ?? ''), outcome: String(e.resultado ?? ''), leadsTo: e.levaA ?? [] })),
    ...(m.relogio ? { timer: m.relogio } : {}),
    ...(portento ? { portent: { faction: String(portento.facao ?? ''), text: String(portento.texto ?? '') } } : {}),
    notes: secao(c, 'Notas') ?? '',
  }
}

// ---- arcos e ambições (fios) ------------------------------------------------

export function arcoParaDoc(a: Arc, origem: string[]): Doc {
  const meta: Record<string, unknown> = {
    id: a.id,
    tipo: 'arco',
    nome: a.name,
    subtipo: a.kind,
    cor: a.color,
    ...(a.ownerPc ? { pc: a.ownerPc } : {}),
    ordem: a.order,
    origem,
  }
  return { meta, body: juntarSecoes({ intro: '', secoes: secaoSe('Resumo', a.summary) }) }
}

export function docParaArco(doc: Doc): Record<string, unknown> {
  const m = doc.meta
  const c = secoes(doc.body)
  return {
    id: String(m.id),
    name: String(m.nome ?? ''),
    kind: String(m.subtipo ?? 'main'),
    color: String(m.cor ?? '#888888'),
    ...(m.pc ? { ownerPc: m.pc } : {}),
    order: typeof m.ordem === 'number' ? m.ordem : 0,
    summary: secao(c, 'Resumo') ?? '',
  }
}

export function ambicaoParaDoc(a: Ambition, origem: string[], nome?: string): Doc {
  const meta: Record<string, unknown> = {
    id: a.id,
    tipo: 'ambicao',
    nome: nome ?? a.text,
    texto: a.text,
    pc: a.pc,
    npcs: a.npcs,
    arcos: a.arcs,
    satisfeitaPor: a.satisfiedBy,
    ameacadaPor: a.threatenedBy,
    origem,
  }
  return { meta, body: '' }
}

export function docParaAmbicao(doc: Doc): Record<string, unknown> {
  const m = doc.meta
  return {
    id: String(m.id),
    pc: String(m.pc ?? ''),
    text: String(m.texto ?? m.nome ?? ''),
    npcs: m.npcs ?? [],
    arcs: m.arcos ?? [],
    satisfiedBy: m.satisfeitaPor ?? [],
    threatenedBy: m.ameacadaPor ?? [],
  }
}

// ---- campanha ---------------------------------------------------------------

export function campanhaParaDoc(c: Campaign, capituloAtual: string | null): Doc {
  const meta = {
    titulo: c.title,
    convergencia: c.convergence,
    capituloAtual,
    capitulos: c.chapters.map((ch) => ({ id: ch.id, nome: ch.name, niveis: ch.levels, hub: ch.hub, resumo: ch.summary })),
  }
  return { meta, body: '' }
}

export function docParaCampanha(doc: Doc): { campaign: Record<string, unknown>; capituloAtual: string | null } {
  const m = doc.meta
  const caps = Array.isArray(m.capitulos) ? (m.capitulos as Record<string, unknown>[]) : []
  return {
    campaign: {
      title: String(m.titulo ?? 'Campanha'),
      chapters: caps.map((c) => ({ id: String(c.id ?? ''), name: String(c.nome ?? ''), levels: String(c.niveis ?? ''), hub: String(c.hub ?? ''), summary: String(c.resumo ?? '') })),
      convergence: String(m.convergencia ?? ''),
    },
    capituloAtual: typeof m.capituloAtual === 'string' ? m.capituloAtual : null,
  }
}

// ---- sessões ----------------------------------------------------------------

export interface SessaoAntiga {
  id: string
  date: string
  title: string
  beats: string[]
  notes: string
}

/** Título antigo «Sessão N (#G) — Título»; devolve as partes ou null. */
export function partirTitulo(title: string): { n: number; global: number; titulo: string } | null {
  const m = title.match(/^Sessão (\d+) \(#(\d+)\) — (.+)$/)
  return m ? { n: Number(m[1]), global: Number(m[2]), titulo: m[3] } : null
}

export function tituloAntigo(meta: Record<string, unknown>): string {
  if (typeof meta.tituloAntigo === 'string') return meta.tituloAntigo
  return `Sessão ${meta.n} (#${meta.global}) — ${meta.titulo}`
}

export function docParaSessaoAntiga(doc: Doc): SessaoAntiga {
  const m = doc.meta
  const beats = m.beats && typeof m.beats === 'object' ? Object.keys(m.beats as Record<string, unknown>) : []
  return { id: String(m.id), date: String(m.data ?? ''), title: tituloAntigo(m), beats, notes: String(m.notas ?? '') }
}

export function beatsJogados(docs: Doc[]): string[] {
  const out: string[] = []
  for (const d of docs) {
    const b = (d.meta.beats ?? {}) as Record<string, string>
    for (const [id, estado] of Object.entries(b)) if (estado === 'jogado' && !out.includes(id)) out.push(id)
  }
  return out
}
