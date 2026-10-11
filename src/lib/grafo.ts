// O grafo de relações (docs/arquitetura.md, secção 8), sobre a árvore: personagens e fações como nós, as relações do
// cabeçalho (`relacoes`) e as do registo (efeitos `relacao`) como arestas. Puro, com testes.
import type { Arvore, DocArvore } from './arquivo/arvore.ts'
import { porPasta } from './arquivo/arvore.ts'
import type { Campanha } from './campanha.ts'
import type { Estado } from './estado.ts'

/** Quem aparece: quem entra no capítulo escolhido, toda a gente até esse capítulo, quem a mesa já conheceu, ou todos. */
export type AmbitoGrafo = 'capitulo' | 'ate-agora' | 'registo' | 'tudo'

export const TIPOS_PERSONAGEM = ['pc', 'npc', 'rival', 'deity'] as const
export type TipoPersonagem = (typeof TIPOS_PERSONAGEM)[number]

export interface FiltrosGrafo {
  facoes: string[]
  arcos: string[]
  pc: string | null
  tipos: TipoPersonagem[]
  mostrarFacoes: boolean
  pesquisa: string
  ambito: AmbitoGrafo
  /** Só o nó escolhido e os seus vizinhos diretos. */
  ego: boolean
}

export function filtrosPorDefeito(): FiltrosGrafo {
  return { facoes: [], arcos: [], pc: null, tipos: [...TIPOS_PERSONAGEM], mostrarFacoes: true, pesquisa: '', ambito: 'capitulo', ego: false }
}

export interface No {
  id: string
  nome: string
  tipo: TipoPersonagem | 'facao'
  cor: string
  anel?: string
  raio: number
  doc: DocArvore
}

export interface Relacao {
  de: string
  com: string
  tipo: string
  nota: string
  /** de onde vem: o cabeçalho do ficheiro (livro ou campanha) ou o registo (sessão) */
  fonte: 'cabecalho' | 'registo'
  desde?: string
  ate?: string
  se?: string
  sessao?: string
}

export interface Aresta {
  chave: string
  de: string
  com: string
  relacao: Relacao
  curva: number
}

export interface EntradaGrafo {
  arvore: Arvore
  campanha: Campanha
  estado: Estado
  filtros: FiltrosGrafo
  /** o capítulo escolhido (para os âmbitos «capítulo» e «até agora» e para as relações com `desde`/`ate`) */
  capitulo: string
  /** o nó escolhido (para o modo ego) */
  foco?: string | null
  corTipo: Record<TipoPersonagem, string>
  corFacao: (id: string) => string
}

const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

/** Todas as relações, do cabeçalho e do registo; as do registo substituem as do cabeçalho com o mesmo par e tipo. */
export function relacoesDe(arvore: Arvore, estado: Estado): Relacao[] {
  const p = porPasta(arvore)
  const out: Relacao[] = []
  for (const d of [...p.personagens, ...p.facoes]) {
    const de = String(d.meta.id ?? '')
    for (const r of Array.isArray(d.meta.relacoes) ? (d.meta.relacoes as Record<string, unknown>[]) : []) {
      out.push({
        de, com: String(r.com ?? ''), tipo: String(r.tipo ?? 'knows'), nota: String(r.nota ?? ''), fonte: 'cabecalho',
        ...(typeof r.desde === 'string' ? { desde: r.desde } : {}), ...(typeof r.ate === 'string' ? { ate: r.ate } : {}), ...(typeof r.se === 'string' ? { se: r.se } : {}),
      })
    }
  }
  for (const [de, e] of estado.personagens) {
    for (const r of e.relacoes) {
      const i = out.findIndex((x) => x.de === de && x.com === r.com && x.tipo === r.tipo)
      if (i >= 0) out.splice(i, 1)
      if (r.ativa) out.push({ de, com: r.com, tipo: r.tipo, nota: `S${r.marca.n}`, fonte: 'registo', sessao: r.marca.sessao })
    }
  }
  return out.filter((r) => r.de && r.com && r.de !== r.com)
}

/** A relação está ativa no fim do capítulo escolhido: já começou (`desde`) e ainda não acabou (`ate`). */
export function relacaoAtiva(r: Relacao, cursor: number, posicao: (beat: string) => number): boolean {
  if (r.fonte === 'registo') return true
  if (r.desde && posicao(r.desde) > cursor) return false
  if (r.ate && posicao(r.ate) >= 0 && posicao(r.ate) <= cursor) return false
  return true
}

export function construirGrafo(e: EntradaGrafo): { nos: No[]; arestas: Aresta[] } {
  const { arvore, campanha, estado, filtros } = e
  const p = porPasta(arvore)
  const porId = new Map(p.beats.map((b) => [String(b.meta.id), b]))
  const posicao = (beat: string) => campanha.posicaoBeat(porId.get(beat))
  const cursor = campanha.fimDoCapitulo(e.capitulo)
  const iCap = campanha.indiceDe(e.capitulo)
  const tipoDe = (d: DocArvore): TipoPersonagem => (TIPOS_PERSONAGEM as readonly string[]).includes(String(d.meta.tipo)) ? (String(d.meta.tipo) as TipoPersonagem) : 'npc'
  const relacoes = relacoesDe(arvore, estado).filter((r) => relacaoAtiva(r, cursor, posicao))

  let chars = p.personagens.filter((d) => filtros.tipos.includes(tipoDe(d)))
  if (filtros.ambito === 'capitulo') {
    const noCapitulo = new Set(p.beats.filter((b) => b.meta.capitulo === e.capitulo).flatMap((b) => lista(b.meta.participantes)))
    chars = chars.filter((d) => tipoDe(d) === 'pc' || lista(d.meta.capitulos).includes(e.capitulo) || noCapitulo.has(String(d.meta.id)))
  } else if (filtros.ambito === 'ate-agora') {
    chars = chars.filter((d) => {
      const t = tipoDe(d)
      const caps = lista(d.meta.capitulos)
      return t === 'pc' || t === 'deity' || caps.length === 0 || caps.some((c) => campanha.indiceDe(c) <= iCap)
    })
  } else if (filtros.ambito === 'registo') {
    chars = chars.filter((d) => tipoDe(d) === 'pc' || (estado.historia.get(String(d.meta.id))?.length ?? 0) > 0)
  }
  if (filtros.facoes.length) chars = chars.filter((d) => lista(d.meta.facoes).some((f) => filtros.facoes.includes(f)))
  if (filtros.arcos.length) {
    const nosArcos = new Set(p.beats.filter((b) => lista(b.meta.arcos).some((a) => filtros.arcos.includes(a)) && campanha.posicaoBeat(b) <= cursor).flatMap((b) => lista(b.meta.participantes)))
    chars = chars.filter((d) => nosArcos.has(String(d.meta.id)))
  }
  if (filtros.pesquisa.trim()) {
    const q = filtros.pesquisa.trim().toLowerCase()
    const diretos = new Set(chars.filter((d) => String(d.meta.nome ?? '').toLowerCase().includes(q)).map((d) => String(d.meta.id)))
    const perto = new Set<string>(diretos)
    for (const r of relacoes) {
      if (diretos.has(r.de)) perto.add(r.com)
      if (diretos.has(r.com)) perto.add(r.de)
    }
    chars = chars.filter((d) => perto.has(String(d.meta.id)))
  }
  if (filtros.pc) {
    const fica = new Set<string>([filtros.pc])
    for (const a of p.fios.filter((f) => f.meta.tipo === 'ambicao' && f.meta.pc === filtros.pc)) lista(a.meta.npcs).forEach((n) => fica.add(n))
    for (const r of relacoes) {
      if (r.de === filtros.pc) fica.add(r.com)
      if (r.com === filtros.pc) fica.add(r.de)
    }
    for (const b of p.beats) {
      const part = lista(b.meta.participantes)
      if (part.includes(filtros.pc)) part.forEach((x) => fica.add(x))
    }
    chars = chars.filter((d) => fica.has(String(d.meta.id)))
  }
  if (filtros.ego && e.foco) {
    const f = e.foco
    const fica = new Set<string>([f])
    for (const r of relacoes) {
      if (r.de === f) fica.add(r.com)
      if (r.com === f) fica.add(r.de)
    }
    const focoDoc = p.personagens.find((d) => d.meta.id === f)
    if (focoDoc) lista(focoDoc.meta.facoes).forEach((x) => fica.add(x))
    for (const d of p.personagens) if (lista(d.meta.facoes).includes(f)) fica.add(String(d.meta.id))
    chars = p.personagens.filter((d) => fica.has(String(d.meta.id)) && filtros.tipos.includes(tipoDe(d)))
  }

  const grau = new Map<string, number>()
  for (const r of relacoes) {
    grau.set(r.de, (grau.get(r.de) ?? 0) + 1)
    grau.set(r.com, (grau.get(r.com) ?? 0) + 1)
  }
  const nos: No[] = chars.map((d) => {
    const id = String(d.meta.id)
    const tipo = tipoDe(d)
    const facao = lista(d.meta.facoes)[0]
    return { id, nome: String(d.meta.nome ?? id), tipo, cor: e.corTipo[tipo], ...(facao ? { anel: e.corFacao(facao) } : {}), raio: tipo === 'pc' ? 16 : 7 + 2 * Math.min(grau.get(id) ?? 0, 5), doc: d }
  })
  const ids = new Set(nos.map((n) => n.id))
  if (filtros.mostrarFacoes) {
    const queridas = new Set<string>()
    for (const d of chars) lista(d.meta.facoes).forEach((f) => queridas.add(f))
    for (const r of relacoes) if (ids.has(r.de) || ids.has(r.com)) [r.de, r.com].forEach((x) => queridas.add(x))
    for (const f of p.facoes) {
      const id = String(f.meta.id)
      if (!queridas.has(id)) continue
      if (filtros.facoes.length && !filtros.facoes.includes(id)) continue
      if (filtros.ego && e.foco) {
        const foco = e.foco
        const ligada = id === foco || relacoes.some((r) => (r.de === foco && r.com === id) || (r.com === foco && r.de === id)) || lista(p.personagens.find((d) => d.meta.id === foco)?.meta.facoes).includes(id)
        if (!ligada) continue
      }
      nos.push({ id, nome: String(f.meta.nome ?? id), tipo: 'facao', cor: e.corFacao(id), raio: 13, doc: f })
      ids.add(id)
    }
  }
  const arestas: Aresta[] = []
  const vistos = new Map<string, number>()
  relacoes.forEach((r, i) => {
    if (!ids.has(r.de) || !ids.has(r.com)) return
    const par = [r.de, r.com].sort().join('|')
    const n = vistos.get(par) ?? 0
    vistos.set(par, n + 1)
    arestas.push({ chave: `${r.de}→${r.com}:${r.tipo}#${i}`, de: r.de, com: r.com, relacao: r, curva: n === 0 ? 0 : (n % 2 ? 1 : -1) * Math.ceil(n / 2) })
  })
  return { nos, arestas }
}
