// A campanha vista da árvore (docs/arquitetura.md, secções 4 e 8): capítulos, o capítulo em que a mesa está, os PCs,
// as cores dos arcos. Puro: usado pela app e pelos scripts.
import type { Arvore, DocArvore } from './arquivo/arvore.ts'
import { porPasta } from './arquivo/arvore.ts'

export interface Capitulo {
  id: string
  nome: string
  niveis: string
  hub: string
  resumo: string
}

export const COR_PC_SEM_ARCO = '#8A96A0'

export class Campanha {
  readonly titulo: string
  readonly capitulos: Capitulo[]
  readonly capituloAtual: string
  readonly convergencia: string
  readonly pcs: DocArvore[]
  readonly arcos: DocArvore[]
  readonly beats: DocArvore[]
  private readonly indiceCap: Map<string, number>
  private readonly corPorPc: Map<string, string>
  private readonly corPorArco: Map<string, string>

  constructor(arvore: Arvore) {
    const p = porPasta(arvore)
    const m = p.campanha?.meta ?? {}
    this.titulo = String(m.titulo ?? 'Campanha')
    this.convergencia = String(m.convergencia ?? '')
    this.capitulos = (Array.isArray(m.capitulos) ? (m.capitulos as Record<string, unknown>[]) : []).map((c) => ({
      id: String(c.id ?? ''),
      nome: String(c.nome ?? ''),
      niveis: String(c.niveis ?? ''),
      hub: String(c.hub ?? ''),
      resumo: String(c.resumo ?? ''),
    }))
    this.indiceCap = new Map(this.capitulos.map((c, i) => [c.id, i]))
    const atual = typeof m.capituloAtual === 'string' ? m.capituloAtual : ''
    this.capituloAtual = this.indiceCap.has(atual) ? atual : (this.capitulos[0]?.id ?? '')
    this.pcs = p.personagens.filter((d) => d.meta.tipo === 'pc')
    this.arcos = p.fios.filter((d) => d.meta.tipo === 'arco').sort((x, y) => Number(x.meta.ordem ?? 0) - Number(y.meta.ordem ?? 0))
    this.beats = [...p.beats].sort((x, y) => this.posicaoBeat(x) - this.posicaoBeat(y) || String(x.meta.id).localeCompare(String(y.meta.id)))
    this.corPorArco = new Map(this.arcos.map((a) => [String(a.meta.id), String(a.meta.cor ?? COR_PC_SEM_ARCO)]))
    this.corPorPc = new Map(this.arcos.filter((a) => typeof a.meta.pc === 'string').map((a) => [String(a.meta.pc), String(a.meta.cor ?? COR_PC_SEM_ARCO)]))
  }

  capitulo(id: string): Capitulo | undefined {
    return this.capitulos[this.indiceCap.get(id) ?? -1]
  }

  indiceDe(id: string): number {
    return this.indiceCap.get(id) ?? -1
  }

  /** Nome curto de um capítulo para pílulas: «Prólogo», «1», «2»… */
  curto(id: string): string {
    const i = this.indiceCap.get(id)
    const ch = this.capitulo(id)
    if (!ch) return id
    if (/^pr[óo]logo/i.test(ch.nome)) return 'Prólogo'
    const m = ch.nome.match(/^Acto\s+(\d+)/i)
    if (m) return `A${m[1]}`
    return String(i ?? '')
  }

  nomeCapitulo(id: string): string {
    return this.capitulo(id)?.nome ?? id
  }

  corPc(pc: string): string {
    return this.corPorPc.get(pc) ?? COR_PC_SEM_ARCO
  }

  corArco(arco: string): string {
    return this.corPorArco.get(arco) ?? COR_PC_SEM_ARCO
  }

  /** Cor de um beat: a do primeiro arco. */
  corBeat(b: DocArvore): string {
    const arcos = Array.isArray(b.meta.arcos) ? (b.meta.arcos as string[]) : []
    return arcos[0] ? this.corArco(arcos[0]) : COR_PC_SEM_ARCO
  }

  /** Posição de um beat no tempo do plano: capítulo × 1000 + ordem; -1 se não for um beat conhecido. */
  posicaoBeat(b: DocArvore | undefined): number {
    if (!b) return -1
    const i = this.indiceCap.get(String(b.meta.capitulo ?? ''))
    return (i === undefined ? 99 : i) * 1000 + Number(b.meta.ordem ?? 0)
  }

  /** O fim do capítulo: tudo o que está nesse capítulo ou antes. */
  fimDoCapitulo(id: string): number {
    const i = this.indiceCap.get(id)
    return i === undefined ? Number.MAX_SAFE_INTEGER : i * 1000 + 999
  }
}
