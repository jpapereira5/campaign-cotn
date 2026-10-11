// A camada do DM (docs/grelha.md, secções 9 e 10): o que o DM escreve na app, em grelha/dm.json, por cima da
// camada automática. Puro: tipos, fusão em conflito e a aplicação à Grelha construída.
import type { Grelha, Item, Linha, Estatuto } from './modelo.ts'
import { GRUPOS, grupoDe, URGENCIA, type TipoGrelha } from './modelo.ts'
import { donaDe, type TipoLinha } from './dona.ts'

export type DmKind = 'correcao' | 'verdade' | 'plano' | 'decisao' | 'arquivo' | 'linha' | 'acompanhar' | 'jogado' | 'nota' | 'resposta' | 'ideia-rejeitada'
export const DM_KINDS: DmKind[] = ['correcao', 'verdade', 'plano', 'decisao', 'arquivo', 'linha', 'acompanhar', 'jogado', 'nota', 'resposta', 'ideia-rejeitada']

export interface DmEntry {
  id: string
  at: string
  kind: DmKind
  fact?: string
  row?: string
  col?: string
  factKind?: string
  patch?: Record<string, unknown>
  text?: string
  involves?: string[]
  origin?: string[]
  tags?: string[]
  prepared?: boolean
  note?: string
  accepted?: boolean
  idea?: string
  fromIdea?: string
  beat?: string
  deleted?: boolean
}

export interface Revisao {
  reviewed: Record<string, string>
  absorbed: Record<string, string>
  notes: ReviewNote[]
  lastReview?: string
}

export interface ReviewNote {
  id: string
  at: string
  kind: 'pergunta' | 'discrepancia' | 'efeito' | 'ideia' | 'aviso'
  target: { dm?: string; fact?: string; row?: string; col?: string }
  text: string
  suggestion?: string
  because?: string[]
  factKind?: string
  tags?: string[]
  status: 'aberta' | 'fechada'
}

export function revisaoVazia(): Revisao {
  return { reviewed: {}, absorbed: {}, notes: [] }
}

export function normalizarRevisao(v: unknown): Revisao {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Revisao>
  return {
    reviewed: o.reviewed && typeof o.reviewed === 'object' ? (o.reviewed as Record<string, string>) : {},
    absorbed: o.absorbed && typeof o.absorbed === 'object' ? (o.absorbed as Record<string, string>) : {},
    notes: Array.isArray(o.notes) ? (o.notes as ReviewNote[]) : [],
    ...(o.lastReview ? { lastReview: o.lastReview } : {}),
  }
}

export function normalizarDm(v: unknown): DmEntry[] {
  return Array.isArray(v) ? (v.filter((e) => e && typeof e === 'object' && typeof (e as DmEntry).id === 'string') as DmEntry[]) : []
}

/** Id nova: d-<tempo em base36>-<aleatório>. */
export function novaIdDm(agora = Date.now()): string {
  return `d-${agora.toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Junta duas versões de dm.json: por id, fica a entrada com `at` mais recente; as que só existem num lado ficam. */
export function fundirDm(a: DmEntry[], b: DmEntry[]): DmEntry[] {
  const porId = new Map<string, DmEntry>()
  for (const e of [...a, ...b]) {
    const atual = porId.get(e.id)
    if (!atual || String(e.at) > String(atual.at)) porId.set(e.id, e)
  }
  return [...porId.values()].sort((x, y) => String(x.at).localeCompare(String(y.at)))
}

/** A entrada está por rever: não foi revista nesta versão nem absorvida. */
export function porRever(e: DmEntry, r: Revisao): boolean {
  if (r.absorbed[e.id]) return false
  const revista = r.reviewed[e.id]
  return !revista || String(e.at) > String(revista)
}

/** Entradas vivas: nem apagadas nem absorvidas. */
export function vivas(dm: DmEntry[], r: Revisao): DmEntry[] {
  return dm.filter((e) => !e.deleted && !r.absorbed[e.id])
}

export interface ContextoDm {
  tipoLinha: TipoLinha
  nome: (id: string) => string
  /** colunas jogadas, por chave */
  jogadas: Set<string>
  proximaChave: string
  rotuloColuna: (chave: string) => string
}

const ABREM_FIO = new Set(['relacao', 'promessa', 'escolha', 'consequencia'])

function estatutoDeFacto(kind: string | undefined, fechado: boolean | undefined): Estatuto {
  if (kind === 'pista') return 'pista'
  if (!kind || !ABREM_FIO.has(kind)) return 'registo'
  if (fechado) return 'fechado'
  return 'aberto'
}

/**
 * Aplica a camada do DM à Grelha construída: planos, correções, verdades, decisões, arquivos, linhas novas,
 * beats jogados, respostas e ideias rejeitadas. Devolve o que não cabe numa célula: as notas rápidas soltas e
 * os planos que ficaram em colunas já jogadas.
 */
export function aplicarDm(g: Grelha, dm: DmEntry[], r: Revisao, ctx: ContextoDm): { notasSoltas: DmEntry[]; planosPassados: { entrada: DmEntry; linha: Linha }[] } {
  const porLinha = new Map(g.linhas.map((l) => [l.id, l]))
  const todosItens = (): { linha: Linha; chave: string; item: Item }[] => {
    const out: { linha: Linha; chave: string; item: Item }[] = []
    for (const l of g.linhas) for (const [chave, c] of Object.entries(l.celulas)) for (const item of c.itens) out.push({ linha: l, chave, item })
    return out
  }
  const itemDoFacto = (id: string) => todosItens().find((x) => x.item.ac?.id === id || x.item.dm?.id === id)
  const notasSoltas: DmEntry[] = []
  const planosPassados: { entrada: DmEntry; linha: Linha }[] = []
  const respondidas = new Set(dm.filter((e) => e.kind === 'resposta' && !e.deleted).map((e) => String(e.note)))
  const rejeitadas = new Set(dm.filter((e) => e.kind === 'ideia-rejeitada' && !e.deleted).map((e) => String(e.idea)))
  const aceites = new Set(dm.filter((e) => e.kind === 'plano' && e.fromIdea && !e.deleted).map((e) => String(e.fromIdea)))
  const entradas = vivas(dm, r)

  const novaCelula = (l: Linha) => {
    for (const c of g.colunas) if (!l.celulas[c.chave]) l.celulas[c.chave] = { itens: [], ecos: [], fundo: null }
  }

  // linhas novas e ids a acompanhar
  for (const e of entradas) {
    if (e.kind !== 'linha' && e.kind !== 'acompanhar') continue
    const id = String(e.kind === 'linha' ? e.patch?.id ?? '' : e.row ?? '')
    if (!id || porLinha.has(id)) continue
    const tipo = String((e.kind === 'linha' ? e.patch?.type : e.patch?.type) ?? ctx.tipoLinha(id) ?? 'missao') as TipoGrelha
    const l: Linha = {
      id, tipo, grupo: grupoDe(tipo), nome: String(e.patch?.name ?? ctx.nome(id)), marcas: [], etiquetas: [], pcs: [], pcsTocados: new Set(), celulas: {},
      pendentes: 0, abertos: 0, esquecidos: 0, faltas: 0, notas: 0, editada: true, porRever: porRever(e, r), dm: e,
    }
    novaCelula(l)
    g.linhas.push(l)
    porLinha.set(id, l)
  }

  for (const e of entradas) {
    const l = e.row ? porLinha.get(e.row) : undefined
    const rever = porRever(e, r)
    switch (e.kind) {
      case 'decisao': {
        if (!l) break
        const p = e.patch ?? {}
        if (typeof p.name === 'string') l.nome = p.name
        if (typeof p.legenda === 'string') l.legenda = p.legenda
        if (typeof p.quer === 'string') l.quer = p.quer
        if (typeof p.teme === 'string') l.teme = p.teme
        if (typeof p.atitudeAtual === 'string') l.atitude = p.atitudeAtual
        if (Array.isArray(p.marcas)) l.marcas = p.marcas as string[]
        l.editada = true
        if (rever) l.porRever = true
        l.dm = e
        break
      }
      case 'plano':
      case 'verdade':
      case 'correcao': {
        if (e.kind === 'correcao' && e.fact) {
          const alvo = itemDoFacto(e.fact)
          if (!alvo) break
          const p = e.patch ?? {}
          alvo.item.original = alvo.item.original ?? alvo.item.texto
          if (typeof p.text === 'string') alvo.item.texto = p.text
          if (Array.isArray(p.tags)) alvo.item.tags = p.tags as string[]
          if (p.fechado === true) { alvo.item.fechado = true; if (alvo.item.estatuto === 'aberto' || alvo.item.estatuto === 'esquecido') alvo.item.estatuto = 'fechado' }
          alvo.item.dm = e
          alvo.item.porRever = rever
          if (rever) alvo.linha.porRever = true
          break
        }
        if (e.kind === 'plano' && e.fromIdea && rejeitadas.has(e.fromIdea)) break
        const alvoLinha = l ?? (e.involves?.[0] ? porLinha.get(e.involves[0]) : undefined)
        const col = String(e.col ?? '')
        if (!alvoLinha || !col) {
          if (e.kind === 'plano') notasSoltas.push(e)
          break
        }
        const envolve = e.involves?.length ? e.involves : [alvoLinha.id]
        const dona = donaDe(String(e.factKind ?? 'consequencia'), envolve, ctx.tipoLinha) ?? alvoLinha.id
        const linhaDona = porLinha.get(dona) ?? alvoLinha
        if (!linhaDona.celulas[col]) {
          // coluna que já não existe (sessão jogada entretanto, capítulo acabado): o plano fica por resolver
          if (e.kind === 'plano') planosPassados.push({ entrada: e, linha: linhaDona })
          break
        }
        const jogada = ctx.jogadas.has(col)
        let estatuto: Estatuto
        if (e.kind === 'plano') estatuto = e.prepared ? 'planeado' : 'falta'
        else estatuto = estatutoDeFacto(e.factKind, e.patch?.fechado === true)
        const tags = [...(e.tags ?? [])]
        if (e.kind === 'verdade' && !tags.includes('so-dm')) tags.push('so-dm')
        const item: Item = { tipo: e.kind === 'plano' ? 'plano' : 'facto', estatuto, texto: String(e.text ?? ''), tags, dm: e, porRever: rever, origem: e.origin, origemLabel: undefined, fromIdea: e.fromIdea }
        linhaDona.celulas[col].itens.push(item)
        for (const id of envolve) if (id.startsWith('c-pc-')) linhaDona.pcsTocados.add(id)
        for (const id of envolve) {
          if (id === linhaDona.id) continue
          const outra = porLinha.get(id)
          if (outra?.celulas[col]) outra.celulas[col].ecos.push({ tipo: 'eco', estatuto: null, texto: item.texto, dona: linhaDona.id })
        }
        if (e.kind === 'plano' && jogada) planosPassados.push({ entrada: e, linha: linhaDona })
        if (e.kind === 'plano') {
          if (e.prepared) linhaDona.planeados = (linhaDona.planeados ?? 0) + (col === ctx.proximaChave ? 1 : 0)
          else linhaDona.faltas++
          // um plano para a próxima sessão numa linha de PC com cena resolve o «sem cena»
          if (e.factKind === 'cena' && col === ctx.proximaChave) {
            const i = linhaDona.celulas[col].itens.findIndex((x) => x.tipo === 'falta')
            if (i >= 0) { linhaDona.celulas[col].itens.splice(i, 1); linhaDona.faltas-- }
          }
        } else if (estatuto === 'aberto') linhaDona.abertos++
        if (rever) linhaDona.porRever = true
        break
      }
      case 'arquivo': {
        if (!e.fact) break
        const alvo = itemDoFacto(e.fact)
        if (!alvo) break
        if (alvo.item.estatuto === 'aberto' || alvo.item.estatuto === 'esquecido') {
          alvo.item.estatuto = 'fechado'
          alvo.item.arquivado = true
          alvo.linha.abertos = Math.max(0, alvo.linha.abertos - 1)
          if (alvo.item.estatuto === 'fechado' && alvo.linha.esquecidos > 0 && alvo.item.ac && alvo.item.ac.id === e.fact) alvo.linha.esquecidos = Math.max(0, alvo.linha.esquecidos - 1)
        }
        alvo.item.dm = e
        alvo.item.porRever = rever
        break
      }
      case 'jogado': {
        if (!e.beat) break
        g.beatsJogadosDm = [...(g.beatsJogadosDm ?? []), e.beat]
        break
      }
      case 'nota': {
        const col = e.col ?? ''
        if (l && col && l.celulas[col]) l.celulas[col].itens.push({ tipo: 'nota', estatuto: null, texto: String(e.text ?? ''), dm: e, porRever: rever })
        else notasSoltas.push(e)
        break
      }
      default:
        break
    }
  }

  // planos que apontam para factos: esses factos ficam «planeados» (→ S6)
  for (const { item } of todosItens()) {
    if (item.tipo !== 'plano' || !item.origem?.length || !item.dm?.col) continue
    for (const o of item.origem) {
      const alvo = itemDoFacto(o)
      if (!alvo) continue
      alvo.item.planeadoEm = ctx.rotuloColuna(item.dm.col)
      if (alvo.item.estatuto === 'aberto' || alvo.item.estatuto === 'esquecido') {
        if (alvo.item.estatuto === 'esquecido') alvo.linha.esquecidos = Math.max(0, alvo.linha.esquecidos - 1)
        alvo.item.estatuto = 'planeado'
        alvo.linha.abertos = Math.max(0, alvo.linha.abertos - 1)
      }
    }
  }

  // ideias: as rejeitadas saem; as aceites deixam de ser ideias
  for (const l of g.linhas) for (const c of Object.values(l.celulas)) c.itens = c.itens.filter((i) => i.tipo !== 'ideia' || !(rejeitadas.has(i.nota ?? '') || aceites.has(i.nota ?? '')))

  // notas da revisão: respondidas deixam de contar
  for (const l of g.linhas) {
    const minhas = r.notes.filter((n) => n.status !== 'fechada' && n.kind !== 'ideia' && n.target?.row === l.id)
    l.notas = minhas.filter((n) => !respondidas.has(n.id)).length
  }

  // fundos e pendentes outra vez
  for (const l of g.linhas) {
    for (const c of Object.values(l.celulas)) {
      const estatutos = c.itens.map((i) => i.estatuto).filter((x): x is Estatuto => !!x && x !== 'registo')
      c.fundo = URGENCIA.find((u) => estatutos.includes(u)) ?? null
    }
    l.pendentes = l.abertos + l.faltas + l.notas + (l.porRever ? 1 : 0)
  }
  // grupos: as linhas novas entram no fim do seu grupo
  g.linhas.sort((a, b) => GRUPOS.findIndex((x) => x.id === a.grupo) - GRUPOS.findIndex((x) => x.id === b.grupo) || 0)
  return { notasSoltas, planosPassados }
}
