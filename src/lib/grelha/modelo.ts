// O modelo da Grelha (docs/grelha.md, secções 4, 7, 8 e 11, sobre a base de docs/arquitetura.md, secção 7).
// Puro: constrói as colunas, as linhas e as células a partir da árvore, do estado calculado e de grelha/*.json.
// A camada do DM (planos, correções) entra na fase D; aqui só o registo, o plano do cânone e as ideias da revisão.
import type { Arvore, DocArvore } from '../arquivo/arvore.ts'
import { porPasta } from '../arquivo/arvore.ts'
import type { Acontecimento, Estado, SessaoLida } from '../estado.ts'
import { pastaDe } from '../ficha.ts'
import { donaDe, tipoLinhaDe, type TipoLinha } from './dona.ts'
import type { DmEntry } from './dm.ts'

export type TipoGrelha =
  | 'sessao'
  | 'grupo' | 'pc' | 'npc' | 'rival' | 'facao'
  | 'ambicao' | 'agenda' | 'laco'
  | 'local' | 'item'
  | 'missao' | 'decisao' | 'promessa' | 'relogio' | 'gatilho' | 'revelacao' | 'semente' | 'desfecho'
  | 'jogador' | 'teoria' | 'mesa'

export const GRUPOS: { id: string; label: string; tipos: TipoGrelha[] }[] = [
  { id: 'sessao', label: 'Sessão', tipos: ['sessao'] },
  { id: 'quem', label: 'Quem', tipos: ['grupo', 'pc', 'npc', 'rival', 'facao'] },
  { id: 'arcos', label: 'Arcos pessoais', tipos: ['ambicao', 'agenda', 'laco'] },
  { id: 'onde', label: 'Onde e com quê', tipos: ['local', 'item'] },
  { id: 'enredo', label: 'Enredo', tipos: ['missao', 'decisao', 'promessa', 'relogio', 'gatilho', 'revelacao', 'semente', 'desfecho'] },
  { id: 'fora', label: 'Fora do jogo', tipos: ['jogador', 'teoria', 'mesa'] },
]
export const ROTULO_TIPO: Record<TipoGrelha, string> = {
  sessao: 'Sessão', grupo: 'Grupo', pc: 'PC', npc: 'NPC', rival: 'Rival', facao: 'Fação', ambicao: 'Ambição', agenda: 'Agenda', laco: 'Laço',
  local: 'Local', item: 'Item', missao: 'Missão', decisao: 'Decisão', promessa: 'Promessa', relogio: 'Relógio', gatilho: 'Gatilho',
  revelacao: 'Revelação', semente: 'Semente', desfecho: 'Desfecho', jogador: 'Jogador', teoria: 'Teoria', mesa: 'Mesa',
}
/** Tipos cujos abertos nunca ficam «esquecidos». */
export const ISENTOS: TipoGrelha[] = ['revelacao', 'semente', 'teoria', 'ambicao', 'agenda', 'gatilho']
/** Tipos de acontecimento que abrem um fio. */
const ABREM_FIO = new Set(['relacao', 'promessa', 'escolha', 'consequencia'])

export type Estatuto = 'aberto' | 'esquecido' | 'planeado' | 'falta' | 'pago' | 'pista' | 'fechado' | 'registo'
export const URGENCIA: Estatuto[] = ['esquecido', 'aberto', 'falta', 'planeado', 'pista', 'pago', 'fechado', 'registo']
export const ROTULO_ESTATUTO: Record<Estatuto, string> = {
  aberto: 'Aberto', esquecido: 'Aberto há 3 ou mais sessões, sem plano', planeado: 'Planeado', falta: 'Falta preparar', pago: 'Pago', pista: 'Pista', fechado: 'Fechado', registo: 'Registo',
}

export interface Coluna {
  chave: string
  label: string
  sub: string
  tipo: 'jogada' | 'atual' | 'proxima' | 'resto' | 'capitulo'
  /** sessão (colunas jogadas) ou capítulo (resto e capítulos) */
  sessao?: SessaoLida
  capitulo?: string
}

export interface Arco {
  label: string
  span: number
  atual: boolean
}

export interface Item {
  tipo: 'facto' | 'eco' | 'ideia' | 'falta' | 'plano-canone' | 'texto' | 'plano' | 'nota'
  estatuto: Estatuto | null
  texto: string
  ac?: Acontecimento
  /** o eco aponta para a dona */
  dona?: string
  origem?: string[]
  origemLabel?: string
  tags?: string[]
  fechado?: boolean
  /** ids de beats (plano do cânone) ou nota (ideia) */
  refs?: string[]
  nota?: string
  /** camada do DM: a entrada que criou ou alterou este item */
  dm?: DmEntry
  porRever?: boolean
  /** texto antes da correção do DM */
  original?: string
  arquivado?: boolean
  /** «→ S6»: um plano do DM aponta para este facto */
  planeadoEm?: string
  fromIdea?: string
}

export interface Celula {
  itens: Item[]
  ecos: Item[]
  fundo: Estatuto | null
}

export interface Linha {
  id: string
  tipo: TipoGrelha
  grupo: string
  nome: string
  legenda?: string
  atitude?: string
  marcas: string[]
  etiquetas: string[]
  quer?: string
  teme?: string
  /** revelações: pistas dadas e quem sabe */
  pistas?: number
  sabe?: string
  /** PCs a que a linha diz respeito; «*» = todos */
  pcs: string[]
  /** PCs tocados por itens de que é dona (para o filtro) */
  pcsTocados: Set<string>
  celulas: Record<string, Celula>
  calculada?: boolean
  pendentes: number
  abertos: number
  esquecidos: number
  faltas: number
  notas: number
  /** camada do DM */
  editada?: boolean
  porRever?: boolean
  dm?: DmEntry
  planeados?: number
}

export interface Contagens {
  abertos: number
  esquecidos: number
  planeados: number
  faltas: number
  porResponder: number
}

export interface Grelha {
  colunas: Coluna[]
  arcos: Arco[]
  linhas: Linha[]
  pcs: { id: string; nome: string; curto: string; cor: string }[]
  proximaN: number
  capituloAtual: string
  /** beats marcados como jogados à mesa (camada do DM), por absorver no fecho */
  beatsJogadosDm?: string[]
  /** modo Plano: arcos × capítulos */
  plano: { arcos: { id: string; nome: string; cor: string; porCapitulo: Record<string, { id: string; titulo: string; estado: string }[]> }[]; capitulos: { id: string; nome: string; curto: string }[] }
}

export interface Entrada {
  arvore: Arvore
  estado: Estado
  nome: (id: string) => string
  linhas: { id: string; tipo?: string; pcs?: string[] }[]
  notas: Record<string, unknown>[]
  capitulos: { id: string; nome: string; hub: string; niveis: string; resumo: string }[]
  capituloAtual: string
  curto: (capitulo: string) => string
  corPc: (pc: string) => string
  /** beats marcados como jogados à mesa (camada do DM) */
  jogadosDm?: Set<string>
}

const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
export function dataCurta(iso: string | null): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[(m ?? 1) - 1] ?? ''}`
}

/** Tipo de linha de um documento para a Grelha. */
export function tipoGrelhaDe(d: DocArvore, forcado?: string): TipoGrelha {
  if (forcado) return forcado as TipoGrelha
  const p = pastaDe(d)
  if (p === 'personagens') {
    const t = String(d.meta.tipo ?? 'npc')
    return t === 'pc' ? 'pc' : t === 'rival' ? 'rival' : 'npc'
  }
  if (p === 'facoes') return 'facao'
  if (p === 'locais') return 'local'
  if (p === 'itens') return 'item'
  if (p === 'segredos') return 'revelacao'
  if (p === 'fios') {
    const t = String(d.meta.tipo ?? '')
    if (t === 'frente') return 'relogio'
    if (t === 'arco') return 'missao'
    return (t || 'missao') as TipoGrelha
  }
  if (p === 'jogadores') return 'jogador'
  return 'mesa'
}

/** Tipos das linhas (personagens e fios dizem o seu tipo) para a regra da dona. */
export function tiposDeLinha(a: Arvore): Map<string, string> {
  const tipos = new Map<string, string>()
  for (const d of a.docs) {
    const id = typeof d.meta.id === 'string' ? d.meta.id : ''
    if (!id) continue
    const pasta = pastaDe(d)
    if (pasta === 'personagens') tipos.set(id, String(d.meta.tipo ?? 'npc'))
    else if (pasta === 'fios') tipos.set(id, String(d.meta.tipo ?? ''))
  }
  return tipos
}

export function grupoDe(tipo: TipoGrelha): string {
  return GRUPOS.find((g) => g.tipos.includes(tipo))?.id ?? 'enredo'
}

export function colunasDe(sessoes: SessaoLida[], capitulos: Entrada['capitulos'], capituloAtual: string, curto: (c: string) => string): { colunas: Coluna[]; arcos: Arco[]; proximaN: number } {
  const jogadas = sessoes.filter((s) => s.jogada)
  const colunas: Coluna[] = jogadas.map((s, i) => ({
    chave: `s${s.n}`,
    label: `S${s.n}`,
    sub: `${dataCurta(s.data)}${i === jogadas.length - 1 ? ' · atual' : ''}`,
    tipo: i === jogadas.length - 1 ? 'atual' : 'jogada',
    sessao: s,
  }))
  const proximaN = (jogadas[jogadas.length - 1]?.n ?? 0) + 1
  colunas.push({ chave: `s${proximaN}`, label: `S${proximaN}`, sub: 'próxima', tipo: 'proxima' })
  const iAtual = Math.max(0, capitulos.findIndex((c) => c.id === capituloAtual))
  const atual = capitulos[iAtual]
  if (atual) colunas.push({ chave: atual.id, label: `Resto: ${curto(atual.id)}`, sub: atual.hub, tipo: 'resto', capitulo: atual.id })
  for (const c of capitulos.slice(iAtual + 1)) colunas.push({ chave: c.id, label: `Cap. ${curto(c.id)}`, sub: c.hub, tipo: 'capitulo', capitulo: c.id })
  const nAtual = colunas.filter((c) => c.tipo !== 'capitulo').length
  const arcos: Arco[] = [
    { label: atual ? `${atual.nome}` : 'Agora', span: nAtual, atual: true },
    ...(colunas.length > nAtual ? [{ label: 'Capítulos seguintes', span: colunas.length - nAtual, atual: false }] : []),
  ]
  return { colunas, arcos, proximaN }
}

export function construirGrelha(e: Entrada): Grelha {
  const p = porPasta(e.arvore)
  const porId = new Map<string, DocArvore>()
  for (const d of e.arvore.docs) if (typeof d.meta.id === 'string') porId.set(d.meta.id, d)
  const sessoes = e.estado.mesa.sessoes
  const jogadosDm = e.jogadosDm ?? new Set<string>()
  const estadoBeat = (id: string): string | undefined => (jogadosDm.has(id) ? 'jogado' : e.estado.beats.get(id)?.estado)
  const { colunas, arcos, proximaN } = colunasDe(sessoes, e.capitulos, e.capituloAtual, e.curto)
  const colunaDaSessao = new Map<string, string>()
  for (const c of colunas) if (c.sessao) colunaDaSessao.set(c.sessao.id, c.chave)
  const nDaSessao = new Map<string, number>()
  for (const s of sessoes) nDaSessao.set(s.id, s.n)

  const tipoLinha: TipoLinha = tipoLinhaDe(tiposDeLinha(e.arvore))

  // linhas
  const linhas: Linha[] = []
  const porLinha = new Map<string, Linha>()
  const novaLinha = (id: string, tipo: TipoGrelha, nome: string, extra: Partial<Linha> = {}): Linha => {
    const l: Linha = {
      id, tipo, grupo: grupoDe(tipo), nome, marcas: [], etiquetas: [], pcs: [], pcsTocados: new Set(), celulas: {},
      pendentes: 0, abertos: 0, esquecidos: 0, faltas: 0, notas: 0, ...extra,
    }
    for (const c of colunas) l.celulas[c.chave] = { itens: [], ecos: [], fundo: null }
    linhas.push(l)
    porLinha.set(id, l)
    return l
  }
  const CALCULADAS: [string, string, string][] = [['sessao:mundo', 'Dia no mundo', 'mundo'], ['sessao:nivel', 'Nível do grupo', 'nivel'], ['sessao:resumo', 'Resumo', 'resumo'], ['sessao:onde', 'Onde parou', 'ondeParou']]
  for (const [id, nome, campo] of CALCULADAS) {
    const l = novaLinha(id, 'sessao', nome, { pcs: ['*'], calculada: true })
    for (const c of colunas) {
      let texto = ''
      if (c.sessao) texto = String(c.sessao.doc.meta[campo] ?? '')
      else if (c.capitulo) {
        const cap = e.capitulos.find((x) => x.id === c.capitulo)
        if (campo === 'nivel') texto = cap?.niveis ?? ''
        if (campo === 'resumo') texto = cap?.nome ?? ''
      }
      if (texto) l.celulas[c.chave].itens.push({ tipo: 'texto', estatuto: 'registo', texto })
    }
  }
  for (const def of e.linhas) {
    const d = porId.get(def.id)
    if (!d) continue
    const tipo = tipoGrelhaDe(d, def.tipo)
    const ep = e.estado.personagens.get(def.id)
    const es = e.estado.segredos.get(def.id)
    const atitude = ep?.atitude?.valor ?? (typeof d.meta.atitudeAtual === 'string' ? d.meta.atitudeAtual : undefined)
    const sabe = es?.sabe.length ? es.sabe.map((s) => e.nome(s.quem)).join(', ') + (es.mesaSabe ? ' · a mesa' : '') : typeof d.meta.sabe === 'string' ? d.meta.sabe : undefined
    novaLinha(def.id, tipo, e.nome(def.id), {
      legenda: typeof d.meta.legenda === 'string' ? d.meta.legenda : typeof d.meta.lema === 'string' && d.meta.lema ? d.meta.lema : undefined,
      atitude,
      marcas: lista(d.meta.marcas),
      etiquetas: lista(d.meta.etiquetas),
      quer: typeof d.meta.quer === 'string' ? d.meta.quer : undefined,
      teme: typeof d.meta.teme === 'string' ? d.meta.teme : undefined,
      pistas: tipo === 'revelacao' ? (es?.pistasDadas.length ?? 0) : undefined,
      sabe,
      pcs: def.pcs ?? [],
    })
  }

  // factos: os acontecimentos das sessões jogadas, na dona; ecos nas outras linhas envolvidas
  const pagos = new Set<string>()
  const todosAc: { ac: Acontecimento; s: SessaoLida }[] = []
  for (const s of sessoes) if (s.jogada) for (const ac of s.acontecimentos) todosAc.push({ ac, s })
  for (const { ac } of todosAc) for (const o of ac.origem ?? []) pagos.add(o)
  const acPorId = new Map(todosAc.map((x) => [x.ac.id, x]))
  const origemLabel = (ac: Acontecimento): string | undefined => {
    const ns = (ac.origem ?? []).map((o) => acPorId.get(o)?.s.n).filter((n): n is number => n !== undefined)
    return ns.length ? `← ${[...new Set(ns)].map((n) => `S${n}`).join(', ')}` : undefined
  }
  for (const { ac, s } of todosAc) {
    const chave = colunaDaSessao.get(s.id)
    if (!chave) continue
    const dona = donaDe(ac.tipo, ac.envolve, tipoLinha) ?? ac.envolve[0]
    const linhaDona = porLinha.get(dona)
    let estatuto: Estatuto
    if (ac.tipo === 'pista') estatuto = 'pista'
    else if (!ABREM_FIO.has(ac.tipo)) estatuto = 'registo'
    else if (ac.fechado) estatuto = 'fechado'
    else if (pagos.has(ac.id)) estatuto = 'pago'
    else estatuto = 'aberto'
    if (estatuto === 'aberto' && linhaDona && proximaN - s.n >= 3 && !ISENTOS.includes(linhaDona.tipo)) estatuto = 'esquecido'
    const item: Item = { tipo: 'facto', estatuto, texto: ac.texto, ac, origem: ac.origem, origemLabel: origemLabel(ac), tags: ac.tags, fechado: ac.fechado }
    if (linhaDona) {
      linhaDona.celulas[chave].itens.push(item)
      for (const id of ac.envolve) if (id.startsWith('c-pc-')) linhaDona.pcsTocados.add(id)
      if (estatuto === 'aberto' || estatuto === 'esquecido') linhaDona.abertos++
      if (estatuto === 'esquecido') linhaDona.esquecidos++
    }
    for (const id of ac.envolve) {
      if (id === dona) continue
      const l = porLinha.get(id)
      if (!l) continue
      l.celulas[chave].ecos.push({ tipo: 'eco', estatuto: null, texto: ac.texto, ac, dona })
    }
  }

  // plano do cânone nas colunas futuras: beats por capítulo que envolvem a linha; passos das frentes; pistas planeadas
  const beatsPorCapitulo = new Map<string, DocArvore[]>()
  for (const b of p.beats) {
    const cap = String(b.meta.capitulo ?? '')
    beatsPorCapitulo.set(cap, [...(beatsPorCapitulo.get(cap) ?? []), b])
  }
  const beatToca = (b: DocArvore, id: string): boolean => {
    const m = b.meta
    const listas = [m.participantes, m.arcos, m.revela, m.requer].flatMap(lista)
    const portento = m.portento && typeof m.portento === 'object' ? (m.portento as { facao?: string }) : null
    return listas.includes(id) || m.local === id || portento?.facao === id
  }
  for (const l of linhas) {
    if (l.calculada) continue
    const d = porId.get(l.id)
    const passos = Array.isArray(d?.meta.passos) ? (d!.meta.passos as { capitulo: string; texto: string }[]) : []
    for (const c of colunas) {
      if (!c.capitulo) continue
      const beats = (beatsPorCapitulo.get(c.capitulo) ?? []).filter((b) => beatToca(b, l.id) && estadoBeat(String(b.meta.id)) !== 'jogado')
      if (beats.length) l.celulas[c.chave].itens.push({ tipo: 'plano-canone', estatuto: null, texto: `${beats.length} beat${beats.length > 1 ? 's' : ''}: ${beats.map((b) => `${String(b.meta.titulo ?? b.meta.id)}${b.meta.estado === 'proposta' ? ' (proposta)' : ''}`).join(' · ')}`, refs: beats.map((b) => String(b.meta.id)) })
      for (const passo of passos.filter((x) => x.capitulo === c.capitulo)) l.celulas[c.chave].itens.push({ tipo: 'plano-canone', estatuto: null, texto: passo.texto })
      if (l.tipo === 'revelacao') {
        const pistas = lista(d?.meta.pistas).filter((b) => porId.get(b)?.meta.capitulo === c.capitulo && estadoBeat(b) !== 'jogado')
        if (pistas.length) l.celulas[c.chave].itens.push({ tipo: 'plano-canone', estatuto: null, texto: `${pistas.length} pista${pistas.length > 1 ? 's' : ''} planeada${pistas.length > 1 ? 's' : ''}`, refs: pistas })
      }
    }
  }

  // «sem cena pessoal planeada» na próxima sessão, para os PCs que já jogaram
  const proxima = colunas.find((c) => c.tipo === 'proxima')
  if (proxima) {
    for (const l of linhas) {
      if (l.tipo !== 'pc' || !e.estado.mesa.presencas[l.id]) continue
      l.celulas[proxima.chave].itens.push({ tipo: 'falta', estatuto: 'falta', texto: 'Sem cena pessoal planeada.' })
      l.faltas++
    }
  }

  // ideias e notas da revisão
  for (const n of e.notas) {
    if (n.status === 'fechada') continue
    const alvo = (n.target ?? {}) as { row?: string; col?: string }
    const l = alvo.row ? porLinha.get(alvo.row) : undefined
    if (!l) continue
    if (n.kind === 'ideia') {
      const chave = alvo.col && l.celulas[alvo.col] ? alvo.col : undefined
      if (chave) l.celulas[chave].itens.push({ tipo: 'ideia', estatuto: null, texto: String(n.text ?? ''), nota: String(n.id ?? ''), tags: lista(n.tags) })
    } else l.notas++
  }

  // fundo das células e pendentes
  for (const l of linhas) {
    for (const c of Object.values(l.celulas)) {
      const estatutos = c.itens.map((i) => i.estatuto).filter((x): x is Estatuto => !!x && x !== 'registo')
      c.fundo = URGENCIA.find((u) => estatutos.includes(u)) ?? null
    }
    l.pendentes = l.abertos + l.faltas + l.notas
  }

  const pcs = linhas.filter((l) => l.tipo === 'pc').map((l) => ({ id: l.id, nome: l.nome, curto: l.nome.replace(/\s.*$/, '').replace(/"/g, ''), cor: e.corPc(l.id) }))

  // modo Plano: arcos × capítulos
  const arcosPlano = p.fios
    .filter((d) => d.meta.tipo === 'arco')
    .sort((a, b) => Number(a.meta.ordem ?? 0) - Number(b.meta.ordem ?? 0))
    .map((a) => {
      const id = String(a.meta.id)
      const porCapitulo: Record<string, { id: string; titulo: string; estado: string }[]> = {}
      for (const b of p.beats) {
        if (!lista(b.meta.arcos).includes(id)) continue
        const cap = String(b.meta.capitulo ?? '')
        // um beat ainda só proposto (estado: proposta no cabeçalho) mostra-se como tal até ser jogado
        porCapitulo[cap] = [...(porCapitulo[cap] ?? []), { id: String(b.meta.id), titulo: String(b.meta.titulo ?? ''), estado: estadoBeat(String(b.meta.id)) ?? (b.meta.estado === 'proposta' ? 'proposta' : 'por-jogar') }]
      }
      for (const capBeats of Object.values(porCapitulo)) capBeats.sort((x, y) => Number(porId.get(x.id)?.meta.ordem ?? 0) - Number(porId.get(y.id)?.meta.ordem ?? 0))
      return { id, nome: String(a.meta.nome ?? id), cor: String(a.meta.cor ?? '#888'), porCapitulo }
    })

  return {
    colunas,
    arcos,
    linhas,
    pcs,
    proximaN,
    capituloAtual: e.capituloAtual,
    plano: { arcos: arcosPlano, capitulos: e.capitulos.map((c) => ({ id: c.id, nome: c.nome, curto: e.curto(c.id) })) },
  }
}

export interface Filtro {
  grupo: string
  pc: string
  soPendentes: boolean
}

export function linhaVisivel(l: Linha, f: Filtro): boolean {
  if (f.grupo !== 'todos' && l.grupo !== f.grupo) return false
  if (f.pc !== 'todos' && !(l.id === f.pc || l.pcs.includes('*') || l.pcs.includes(f.pc) || l.pcsTocados.has(f.pc))) return false
  if (f.soPendentes && !l.pendentes) return false
  return true
}

export function contagens(linhas: Linha[], proximaChave: string, notasAbertas: number): Contagens {
  let abertos = 0, esquecidos = 0, planeados = 0, faltas = 0
  for (const l of linhas) {
    abertos += l.abertos
    esquecidos += l.esquecidos
    faltas += l.faltas
    planeados += l.celulas[proximaChave]?.itens.filter((i) => i.estatuto === 'planeado').length ?? 0
  }
  return { abertos, esquecidos, planeados, faltas, porResponder: notasAbertas }
}
