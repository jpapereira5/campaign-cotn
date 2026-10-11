// A Ficha: uma página por coisa (docs/arquitetura.md, secção 8). Helpers puros sobre a árvore e o estado calculado.
import { marked } from 'marked'
import type { Arvore, DocArvore } from './arquivo/arvore.ts'
import { porPasta } from './arquivo/arvore.ts'
import { PASTAS } from './arquivo/esquema.ts'
import { secoes, type Corpo } from './arquivo/md.ts'
import type { Estado } from './estado.ts'

export const TIPO_FIO: Record<string, string> = {
  arco: 'Arco', ambicao: 'Ambição', frente: 'Frente', relogio: 'Relógio', missao: 'Missão', promessa: 'Promessa', decisao: 'Decisão',
  gatilho: 'Gatilho', semente: 'Semente', desfecho: 'Desfecho', laco: 'Laço', agenda: 'Agenda', teoria: 'Teoria', mesa: 'Mesa',
}
const TIPO_PERSONAGEM: Record<string, string> = { pc: 'PC', npc: 'NPC', rival: 'Rival', deity: 'Divindade' }

export type Pasta = 'personagens' | 'facoes' | 'locais' | 'itens' | 'segredos' | 'beats' | 'fios' | 'jogadores' | 'sessoes' | 'outro'

export function pastaDe(d: DocArvore): Pasta {
  for (const [k, p] of Object.entries(PASTAS)) {
    if (d.caminho.startsWith(p + '/')) return (k === 'mesaFios' ? 'fios' : k) as Pasta
  }
  return 'outro'
}

/** Rótulo do tipo: «NPC», «Promessa», «Documento», «Sessão»… */
export function tipoDe(d: DocArvore): string {
  const p = pastaDe(d)
  if (p === 'personagens') return TIPO_PERSONAGEM[String(d.meta.tipo)] ?? 'Personagem'
  if (p === 'facoes') return 'Fação'
  if (p === 'locais') return 'Local'
  if (p === 'itens') return d.meta.tipoItem === 'documento' ? 'Documento' : 'Item'
  if (p === 'segredos') return 'Segredo'
  if (p === 'beats') return 'Beat'
  if (p === 'fios') return TIPO_FIO[String(d.meta.tipo)] ?? 'Fio'
  if (p === 'jogadores') return 'Jogador'
  if (p === 'sessoes') return 'Sessão'
  return 'Documento'
}

export class Indice {
  porId = new Map<string, DocArvore>()
  nomes = new Map<string, string>()
  corpos = new Map<string, Corpo>()
  /** id → documentos que o mencionam (cabeçalho ou corpo), sem as sessões */
  mencoes = new Map<string, DocArvore[]>()
  /** id → relações que chegam (de quem parte, e a relação) */
  chegam = new Map<string, { de: string; rel: Record<string, unknown> }[]>()
  readonly ids: Set<string>
  private reIds: RegExp

  constructor(readonly arvore: Arvore) {
    for (const d of arvore.docs) if (typeof d.meta.id === 'string') this.porId.set(d.meta.id, d)
    this.ids = new Set(this.porId.keys())
    for (const d of arvore.docs) if (typeof d.meta.id === 'string') this.nomes.set(d.meta.id, this.calcNome(d))
    const alternativas = [...this.ids].sort((a, b) => b.length - a.length).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    this.reIds = new RegExp(`(?<![\\w-])(${alternativas.join('|')})(?![\\w-])`, 'g')
    for (const d of arvore.docs) {
      const proprio = typeof d.meta.id === 'string' ? d.meta.id : ''
      if (pastaDe(d) === 'sessoes') continue
      const achados = new Set<string>()
      const texto = JSON.stringify(d.meta) + '\n' + d.body
      for (const m of texto.matchAll(this.reIds)) achados.add(m[1])
      achados.delete(proprio)
      for (const id of achados) this.mencoes.set(id, [...(this.mencoes.get(id) ?? []), d])
      for (const rel of Array.isArray(d.meta.relacoes) ? (d.meta.relacoes as Record<string, unknown>[]) : []) {
        const com = String(rel.com ?? '')
        this.chegam.set(com, [...(this.chegam.get(com) ?? []), { de: proprio, rel }])
      }
    }
  }

  corpo(d: DocArvore): Corpo {
    const id = String(d.meta.id ?? d.caminho)
    let c = this.corpos.get(id)
    if (!c) this.corpos.set(id, (c = secoes(d.body)))
    return c
  }

  private calcNome(d: DocArvore): string {
    const m = d.meta
    if (pastaDe(d) === 'sessoes') return `S${m.n} · ${m.titulo ?? ''}`
    if (typeof m.nome === 'string' && m.nome) return m.nome
    if (typeof m.titulo === 'string' && m.titulo) return m.titulo
    if (typeof m.legenda === 'string' && m.legenda) return m.legenda
    if (pastaDe(d) === 'segredos') {
      const v = secoes(d.body).secoes.find((s) => s.titulo === 'Verdade')?.texto ?? ''
      return v.length > 90 ? v.slice(0, 87).replace(/\s+\S*$/, '') + '…' : v || String(m.id)
    }
    return String(m.id)
  }

  nome(id: string): string {
    if (id === 'mesa') return 'a mesa'
    return this.nomes.get(id) ?? id
  }

  doc(id: string): DocArvore | undefined {
    return this.porId.get(id)
  }

  /** Markdown → HTML, com [[id]] e ids soltos a apontar para a ficha. */
  html(md: string): string {
    const comLinks = md
      .replace(/\[\[([a-z0-9-]+)\]\]/g, (_, id: string) => (this.ids.has(id) ? `[${this.nome(id)}](#/ficha/${id})` : `[[${id}]]`))
      .replace(this.reIds, (id: string) => `[${id}](#/ficha/${id})`)
    return marked.parse(comLinks, { async: false }) as string
  }

  /** Beats do plano que envolvem a id, por capítulo, com o estado de cada um. */
  plano(id: string, estado: Estado): { capitulo: string; beats: { doc: DocArvore; estado: string }[] }[] {
    const p = porPasta(this.arvore)
    const toca = (b: DocArvore): boolean => {
      const m = b.meta
      const listas = [m.participantes, m.arcos, m.revela, m.requer].flatMap((x) => (Array.isArray(x) ? (x as string[]) : []))
      const portento = m.portento && typeof m.portento === 'object' ? (m.portento as { facao?: string }) : null
      return listas.includes(id) || m.local === id || portento?.facao === id
    }
    const porCap = new Map<string, { doc: DocArvore; estado: string }[]>()
    for (const b of p.beats.filter(toca).sort((x, y) => Number(x.meta.ordem ?? 0) - Number(y.meta.ordem ?? 0))) {
      const cap = String(b.meta.capitulo ?? '')
      porCap.set(cap, [...(porCap.get(cap) ?? []), { doc: b, estado: estado.beats.get(String(b.meta.id))?.estado ?? 'por-jogar' }])
    }
    const ordem = (p.campanha?.meta.capitulos as { id: string }[] | undefined)?.map((c) => c.id) ?? []
    return [...porCap.entries()].sort((a, b) => ordem.indexOf(a[0]) - ordem.indexOf(b[0])).map(([capitulo, beats]) => ({ capitulo, beats }))
  }
}

export const ESTADO_BEAT: Record<string, string> = { jogado: 'jogado', 'em-curso': 'em curso', saltado: 'saltado', 'por-jogar': 'por jogar' }

/** Resumo legível de um efeito, para a história. */
export function efeitoLegivel(e: Record<string, unknown>, nome: (id: string) => string): string {
  if ('estado' in e) return `${nome(String(e.estado))}: ${e.valor}${e.onde ? ` (${e.onde})` : ''}`
  if ('atitude' in e) return `${nome(String(e.atitude))} fica ${e.valor}`
  if ('posse' in e) return `${nome(String(e.posse))} ${e.com ? `com ${nome(String(e.com))}` : String(e.onde ?? '')}`
  if ('sabe' in e) return `${(e.quem as string[]).map(nome).join(', ')} sabe${e.nivel ? ` (${e.nivel})` : ''}: ${nome(String(e.sabe))}`
  if ('pista' in e) return `pista para «${nome(String(e.pista))}»`
  if ('relogio' in e) return `relógio «${nome(String(e.relogio))}» = ${e.valor}`
  if ('fio' in e) return `«${nome(String(e.fio))}» ${e.valor}`
  if ('relacao' in e) return `${nome(String(e.relacao))} ${e.valor === 'nao' ? 'deixa de ser' : 'passa a ser'} ${e.tipo} de ${nome(String(e.com))}`
  if ('contador' in e) return `${nome(String(e.de))}: ${e.contador} ${typeof e.mais === 'number' ? (e.mais >= 0 ? '+' : '') + e.mais : '= ' + e.valor}`
  return JSON.stringify(e)
}
