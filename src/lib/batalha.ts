// A página «Batalha» (decisão 28 de 2026-10-13): os dados de cada combate vivem em mesa/batalhas/<id>.yaml (escreve o
// Claude, pela skill batalha); o estado do combate (iniciativa, PV, condições, ronda) é do DM e grava-se em
// grelha/dm.json como uma entrada `kind: 'batalha'` por combate. Puro: tipos, normalização, estado e sorteio.

export type Lado = 'pc' | 'aliado' | 'inimigo' | 'neutro'
export type Variante = 'falha' | 'magoa' | 'fere' | 'critico' | 'final' | 'efeito'
export const VARIANTES: Variante[] = ['falha', 'magoa', 'fere', 'critico', 'final', 'efeito']
export const ROTULO_VARIANTE: Record<Variante, string> = { falha: 'Falha', magoa: 'Magoa', fere: 'Fere', critico: 'Crítico', final: 'Golpe final', efeito: 'Efeito' }

export interface Acao {
  nome: string
  /** linha de mecânica: bónus, dano, salvaguarda */
  mecanica?: string
  /** componentes de um feitiço: V/S/M e o latim da tabela */
  componentes?: string
  falha?: string[]
  magoa?: string[]
  fere?: string[]
  critico?: string[]
  final?: string[]
  /** feitiços e habilidades: as descrições do efeito */
  efeito?: string[]
  /** pergunta antes das sugestões do golpe final (por defeito «Como queres fazer isto?») */
  pergunta?: string
}

export interface Combatente {
  id: string
  nome: string
  lado: Lado
  /** id de uma ficha do repositório (c-…), para abrir */
  ref?: string
  /** modelo partilhado (ex.: lacedon) de onde vêm números, ações e zonas */
  modelo?: string
  ca?: number | string
  pv?: number
  /** modificador de iniciativa */
  ini?: number
  /** combatentes com o mesmo grupo partilham a iniciativa */
  grupo?: string
  aspeto?: string
  resumo?: string
  equipamento?: string
  notas?: string[]
  acoes?: Acao[]
  /** chave da tabela de zonas */
  zonas?: string
  /** não age (o Alex, o Alberto) */
  passivo?: boolean
}

export interface Zona {
  d: number
  zona: string
  texto: string
}

export interface Batalha {
  id: string
  nome: string
  sessao?: string
  onde?: string
  doc?: string
  resumo?: string
  lembretes: string[]
  terreno: { nome: string; texto: string }[]
  modelos: Record<string, Partial<Combatente>>
  combatentes: Combatente[]
  zonas: Record<string, Zona[]>
  rondas: { ronda: string; texto: string }[]
  rescaldo: string[]
  checklist: string[]
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const txt = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

/** Lê o YAML já interpretado e aplica os modelos aos combatentes. */
export function normalizarBatalha(raw: unknown, idFicheiro = ''): Batalha {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const modelos = (o.modelos && typeof o.modelos === 'object' ? o.modelos : {}) as Record<string, Partial<Combatente>>
  const combatentes = arr<Partial<Combatente>>(o.combatentes).map((c, i) => {
    const m = c.modelo ? (modelos[c.modelo] ?? {}) : {}
    const junto = { ...m, ...c, notas: [...arr<string>(m.notas), ...arr<string>(c.notas)], acoes: c.acoes?.length ? c.acoes : m.acoes ?? [] } as Combatente
    junto.id = txt(c.id) || `c${i + 1}`
    junto.nome = txt(c.nome) || junto.id
    junto.lado = (['pc', 'aliado', 'inimigo', 'neutro'].includes(String(junto.lado)) ? junto.lado : 'inimigo') as Lado
    if (!junto.zonas && c.modelo && (o.zonas as Record<string, unknown> | undefined)?.[c.modelo]) junto.zonas = c.modelo
    return junto
  })
  return {
    id: txt(o.id) || idFicheiro,
    nome: txt(o.nome) || idFicheiro,
    sessao: o.sessao ? txt(o.sessao) : undefined,
    onde: o.onde ? txt(o.onde) : undefined,
    doc: o.doc ? txt(o.doc) : undefined,
    resumo: o.resumo ? txt(o.resumo) : undefined,
    lembretes: arr<string>(o.lembretes).map(txt),
    terreno: arr<{ nome: string; texto: string }>(o.terreno),
    modelos,
    combatentes,
    zonas: (o.zonas && typeof o.zonas === 'object' ? o.zonas : {}) as Record<string, Zona[]>,
    rondas: arr<{ ronda: unknown; texto: string }>(o.rondas).map((r) => ({ ronda: txt(r.ronda), texto: txt(r.texto) })),
    rescaldo: arr<string>(o.rescaldo).map(txt),
    checklist: arr<string>(o.checklist).map(txt),
  }
}

export function variantesDe(a: Acao): Variante[] {
  return VARIANTES.filter((v) => (a[v]?.length ?? 0) > 0)
}

// ---- estado (o que se grava em dm.json, no patch da entrada kind 'batalha') ----

export interface EstadoCombatente {
  pv?: number
  max?: number
  temp?: number
  ini?: number
  cond: string[]
  fora?: boolean
}

export interface EstadoBatalha {
  batalha: string
  ronda: number
  /** id do combatente com a vez */
  vez?: string
  c: Record<string, EstadoCombatente>
  checks?: number[]
}

export const CONDICOES = ['paralisado', 'caído', 'agarrado', 'amedrontado', 'enfeitiçado', 'atordoado', 'cego', 'envenenado', 'inconsciente', 'concentração', 'fúria', 'transformado', 'expulso', 'santuário', 'abençoado', 'escondido', 'debaixo de água']

export function estadoInicial(b: Batalha): EstadoBatalha {
  const c: Record<string, EstadoCombatente> = {}
  for (const x of b.combatentes) c[x.id] = { ...(x.pv != null ? { pv: x.pv, max: x.pv } : {}), cond: [] }
  return { batalha: b.id, ronda: 0, c }
}

export function normalizarEstado(v: unknown, b: Batalha): EstadoBatalha {
  const base = estadoInicial(b)
  const o = (v && typeof v === 'object' ? v : {}) as Partial<EstadoBatalha>
  const c = { ...base.c }
  for (const [id, e] of Object.entries(o.c ?? {})) c[id] = { ...(c[id] ?? { cond: [] }), ...e, cond: Array.isArray(e?.cond) ? e.cond : [] }
  return { batalha: b.id, ronda: Number(o.ronda ?? 0) || 0, vez: o.vez, c, checks: Array.isArray(o.checks) ? o.checks : [] }
}

export type Ferimento = 'ileso' | 'magoado' | 'ferido' | 'caido' | 'desconhecido'
export const ROTULO_FERIMENTO: Record<Ferimento, string> = { ileso: 'ileso', magoado: 'magoado', ferido: 'ferido', caido: 'caído', desconhecido: 'PV ?' }

/** Magoado: acima de metade dos PV; ferido: metade ou menos; caído: 0. */
export function ferimento(e: EstadoCombatente | undefined): Ferimento {
  if (!e || e.pv == null || !e.max) return 'desconhecido'
  if (e.pv <= 0) return 'caido'
  if (e.pv >= e.max) return 'ileso'
  return e.pv > e.max / 2 ? 'magoado' : 'ferido'
}

/** Dano e cura: o dano gasta primeiro os PV temporários; a cura não passa do máximo. */
export function aplicarPv(e: EstadoCombatente, delta: number): EstadoCombatente {
  if (e.pv == null) return e
  if (delta < 0) {
    let dano = -delta
    let temp = e.temp ?? 0
    const gasto = Math.min(temp, dano)
    temp -= gasto
    dano -= gasto
    return { ...e, temp: temp || undefined, pv: Math.max(0, e.pv - dano) }
  }
  return { ...e, pv: Math.min(e.max ?? e.pv + delta, e.pv + delta) }
}

/** Ordem de iniciativa: maior primeiro; empates pelo modificador; sem iniciativa ficam no fim, pela ordem do ficheiro. */
export function ordemIniciativa(b: Batalha, s: EstadoBatalha): Combatente[] {
  const pos = new Map(b.combatentes.map((c, i) => [c.id, i]))
  return [...b.combatentes].sort((x, y) => {
    const ix = s.c[x.id]?.ini
    const iy = s.c[y.id]?.ini
    if (ix == null && iy == null) return pos.get(x.id)! - pos.get(y.id)!
    if (ix == null) return 1
    if (iy == null) return -1
    if (iy !== ix) return iy - ix
    if ((y.ini ?? 0) !== (x.ini ?? 0)) return (y.ini ?? 0) - (x.ini ?? 0)
    return pos.get(x.id)! - pos.get(y.id)!
  })
}

/** Rola a iniciativa de quem não é PC (os grupos partilham um rolamento). Os PCs metem-se à mão. */
export function rolarIniciativa(b: Batalha, s: EstadoBatalha, d20 = () => 1 + Math.floor(Math.random() * 20)): EstadoBatalha {
  const porGrupo = new Map<string, number>()
  const c = { ...s.c }
  for (const x of b.combatentes) {
    if (x.lado === 'pc' || x.passivo) continue
    const chave = x.grupo ?? x.id
    if (!porGrupo.has(chave)) porGrupo.set(chave, d20() + (x.ini ?? 0))
    c[x.id] = { ...(c[x.id] ?? { cond: [] }), ini: porGrupo.get(chave) }
  }
  return { ...s, c }
}

/** Passa a vez ao próximo que age (salta passivos e quem está fora); ao dar a volta, a ronda sobe. */
export function proximaVez(b: Batalha, s: EstadoBatalha): EstadoBatalha {
  const ordem = ordemIniciativa(b, s).filter((x) => !x.passivo && !s.c[x.id]?.fora)
  if (!ordem.length) return s
  const i = s.vez ? ordem.findIndex((x) => x.id === s.vez) : -1
  if (i < 0 || s.ronda === 0) return { ...s, ronda: Math.max(1, s.ronda), vez: ordem[0].id }
  const j = (i + 1) % ordem.length
  return { ...s, vez: ordem[j].id, ronda: j === 0 ? s.ronda + 1 : s.ronda }
}

/** Escolhe uma descrição ao acaso, sem repetir a última mostrada. */
export function sortear(lista: string[], ultima: number | undefined, aleatorio = Math.random): number {
  if (!lista.length) return -1
  if (lista.length === 1) return 0
  if (ultima == null || ultima < 0 || ultima >= lista.length) return Math.floor(aleatorio() * lista.length)
  let i = Math.floor(aleatorio() * (lista.length - 1))
  if (i >= ultima) i++
  return i
}
