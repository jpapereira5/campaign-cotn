// Registo da campanha (data/registo): sessões, decisões, fios, itens e relógios.
// Puro (sem Vite nem DOM): partilhado pela app, pelo validador (scripts/validate-data.ts) e pelo gerador
// de docs/estado.md. O estado atual (beats jogados, flags, quem tem o quê, fios abertos, relógios, capítulo)
// nunca se escreve à mão: deriva-se aqui, em derivar(). O fecho é o único caminho de escrita do registo.
import type { Attitude, Canon, Problem } from './types.ts'
import { ATTITUDES } from './types.ts'
import { makeBeatPos } from './validate.ts'

export type Terco = 'manhã' | 'tarde' | 'noite'
export const TERCOS: Terco[] = ['manhã', 'tarde', 'noite']
export type EstadoSessao = 'jogada' | 'planeada'
export type OrigemDecisao = 'mesa' | 'chat' | 'voz'
export const ORIGENS: OrigemDecisao[] = ['mesa', 'chat', 'voz']
export type TipoDecisao = 'plano' | 'mesa' | 'rejeitada'
export const TIPOS_DECISAO: TipoDecisao[] = ['plano', 'mesa', 'rejeitada']
export type TipoFio = 'fio' | 'pergunta'
export type TipoItem = 'item' | 'handout' | 'ouro'
export type TipoMovimento = 'avanca' | 'fecha' | 'descarta'
export const TIPOS_MOVIMENTO: TipoMovimento[] = ['avanca', 'fecha', 'descarta']
/** Destinos de loot que não são personagens. */
export const DESTINOS_ESPECIAIS = ['grupo', 'perdido', 'gasto'] as const

export interface Momento {
  dia: number
  terco?: Terco
}
export interface SessaoBeat {
  id: string
  /** Label da choice jogada (ou texto novo, se a mesa inventou). */
  escolha?: string
  /** O beat continua noutra sessão: ainda não conta como jogado. */
  continua?: boolean
  dia?: number
  terco?: Terco
}
export interface SessaoNpc {
  id: string
  /** Texto curto no presente: «morto», «segue o grupo à distância». */
  estado?: string
  atitude?: Attitude
  dia?: number
  terco?: Terco
}
export interface Loot {
  item: string
  de?: string
  /** c-id, ou grupo | perdido | gasto. */
  para: string
  /** Só conta para itens de tipo ouro. */
  quantidade?: number
  nota?: string
  dia?: number
  terco?: Terco
}
/** No JSON escreve-se `{ "id": "fio-x", "fecha": "texto" }` (ou avanca / descarta); o tipo é a chave usada. */
export interface FioMovimento {
  id: string
  tipo: TipoMovimento
  texto: string
}
export interface RelogioPosicao {
  id: string
  /** Inteiro entre 0 e `passos` do relógio. */
  posicao: number
  nota?: string
}
export interface Sessao {
  /** s-NN, número da campanha; coincide com o nome do ficheiro. */
  id: string
  /** Número global (contador de todas as mesas do DM). */
  global?: number
  data: string
  titulo: string
  estado: EstadoSessao
  capitulo: string
  /** Caminho do resumo em prosa (docs/sessoes/…). */
  resumo?: string
  gravacao?: string
  /** Nome do runsheet na Drive. */
  preparacao?: string
  mesa: { presentes: string[]; ausentes: string[]; notas?: string }
  tempo?: { de: Momento; a: Momento; estimado?: boolean }
  beats: SessaoBeat[]
  npcs: SessaoNpc[]
  flags: Record<string, boolean>
  revelacoes: string[]
  /** `${factionId}:${chapterId}` */
  portentos: string[]
  loot: Loot[]
  fios: FioMovimento[]
  relogios: RelogioPosicao[]
  /** Decisões (planos) que esta sessão cumpriu. */
  cumpre: string[]
  notas?: string
}

export interface Decisao {
  /** d-AAAA-MM-DD-NN; a data do id é a do campo `data`. */
  id: string
  data: string
  origem: OrigemDecisao
  sessao?: string
  /** Obrigatória se origem = voz (linha da caixa ou ficheiro da Drive). */
  fonte?: string
  tipo?: TipoDecisao
  texto: string
  /** Ids de entidades, do registo, ou docs/<ficheiro>.md#<ancora>. */
  afeta: string[]
  substitui?: string
  /** Planos: beats onde pagam. */
  gatilho: string[]
  /** Planos: s-NN ou data ISO. */
  prazo?: string
  /** Rótulo humano («daqui a umas sessões»). */
  quando?: string
  /** Perguntas (fios tipo pergunta) que esta decisão responde. */
  fecha: string[]
}

export interface Fio {
  id: string
  tipo: TipoFio
  titulo: string
  sobre: string[]
  /** s-NN ou d-… onde nasceu. */
  aberto: string
  prazo?: string
  notas?: string
}

export interface Item {
  id: string
  nome: string
  tipo: TipoItem
  /** docs/regras.md#ancora */
  regras?: string
  /** docs/handouts.md#ancora */
  texto?: string
  drive?: string
  /** Handouts: destinatários previstos. */
  para: string[]
  notas?: string
}

export interface Relogio {
  id: string
  nome: string
  sobre: string[]
  passos: number
  unidade?: string
  prazo?: string
  nota?: string
}

export interface Registo {
  sessoes: Sessao[]
  decisoes: Decisao[]
  fios: Fio[]
  itens: Item[]
  relogios: Relogio[]
}

export type RegistoKind = 'sessao' | 'decisoes' | 'fios' | 'itens' | 'relogios'
export interface RegistoFile {
  path: string
  kind: RegistoKind
  content: unknown
}

export function emptyRegisto(): Registo {
  return { sessoes: [], decisoes: [], fios: [], itens: [], relogios: [] }
}

// ---- normalização (estrita: chaves desconhecidas e tipos errados são erro, para apanhar gralhas) ------

type Raw = Record<string, unknown>
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v)
const obj = (v: unknown): Raw => (isObj(v) ? v : {})
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)
const int = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) ? v : undefined)
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const uniq = (v: string[]): string[] => [...new Set(v)]
const terco = (v: unknown): Terco | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return t === 'manha' ? 'manhã' : t === 'tarde' ? 'tarde' : t === 'noite' ? 'noite' : undefined
}

export const ID_SESSAO = /^s-\d{2,3}$/
export const ID_DECISAO = /^d-(\d{4}-\d{2}-\d{2})-\d{2}$/
export const ID_FIO = /^fio-[a-z0-9][a-z0-9-]*$/
export const ID_ITEM = /^i-[a-z0-9][a-z0-9-]*$/
export const ID_RELOGIO = /^rel-[a-z0-9][a-z0-9-]*$/
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/
/** docs/<pasta>/<ficheiro>.md#<ancora>, com a âncora tal como o GitHub a gera a partir do título (acentos mantidos). */
export const ANCORA_DOC = /^docs\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.md#[\p{L}\p{M}\p{N}_-]+$/u

const K = {
  sessao: ['id', 'global', 'data', 'titulo', 'estado', 'capitulo', 'resumo', 'gravacao', 'preparacao', 'mesa', 'tempo', 'beats', 'npcs', 'flags', 'revelacoes', 'portentos', 'loot', 'fios', 'relogios', 'cumpre', 'notas'],
  mesa: ['presentes', 'ausentes', 'notas'],
  tempo: ['de', 'a', 'estimado'],
  momento: ['dia', 'terco'],
  beat: ['id', 'escolha', 'continua', 'dia', 'terco'],
  npc: ['id', 'estado', 'atitude', 'dia', 'terco'],
  loot: ['item', 'de', 'para', 'quantidade', 'nota', 'dia', 'terco'],
  fioMov: ['id', 'avanca', 'fecha', 'descarta'],
  relogioPos: ['id', 'posicao', 'nota'],
  decisao: ['id', 'data', 'origem', 'sessao', 'fonte', 'tipo', 'texto', 'afeta', 'substitui', 'gatilho', 'prazo', 'quando', 'fecha'],
  fio: ['id', 'tipo', 'titulo', 'sobre', 'aberto', 'prazo', 'notas'],
  item: ['id', 'nome', 'tipo', 'regras', 'texto', 'drive', 'para', 'notas'],
  relogio: ['id', 'nome', 'sobre', 'passos', 'unidade', 'prazo', 'nota'],
}

/** Junta os ficheiros de data/registo num Registo. Nunca lança; os problemas vêm na lista. */
export function normalizeRegisto(files: RegistoFile[]): { registo: Registo; problems: Problem[] } {
  const problems: Problem[] = []
  const err = (where: string, message: string) => problems.push({ level: 'error', where, message })
  const warn = (where: string, message: string) => problems.push({ level: 'warn', where, message })
  const keys = (where: string, r: Raw, allowed: string[]) => {
    for (const k of Object.keys(r)) if (!allowed.includes(k)) err(where, `chave desconhecida: ${k}`)
  }
  const need = (where: string, r: Raw, required: string[]): boolean => {
    let ok = true
    for (const k of required) {
      if (r[k] === undefined || r[k] === null || r[k] === '') {
        err(where, `falta ${k}`)
        ok = false
      }
    }
    return ok
  }
  // tipos: um valor presente com o tipo errado é erro, mas devolve-se o valor por omissão para a leitura continuar
  const texto = (where: string, k: string, v: unknown): string | undefined => {
    if (v === undefined) return undefined
    if (typeof v !== 'string') {
      err(where, `${k} tem de ser texto`)
      return undefined
    }
    return v.trim() ? v : undefined
  }
  const inteiro = (where: string, k: string, v: unknown): number | undefined => {
    if (v === undefined) return undefined
    const n = int(v)
    if (n === undefined) err(where, `${k} tem de ser um inteiro`)
    return n
  }
  const numero = (where: string, k: string, v: unknown): number | undefined => {
    if (v === undefined) return undefined
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      err(where, `${k} tem de ser um número`)
      return undefined
    }
    return v
  }
  const bool = (where: string, k: string, v: unknown): true | undefined => {
    if (v === undefined) return undefined
    if (v !== true && v !== false) err(where, `${k} tem de ser true ou false`)
    return v === true ? true : undefined
  }
  const lista = (where: string, k: string, v: unknown): string[] => {
    if (v === undefined) return []
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) err(where, `${k} tem de ser uma lista de ids`)
    return uniq(strs(v))
  }
  const rec = (where: string, k: string, v: unknown): Raw => {
    if (v !== undefined && !isObj(v)) err(where, `${k} tem de ser um objeto`)
    return obj(v)
  }
  const arr = (where: string, k: string, v: unknown): Raw[] => {
    if (v === undefined) return []
    if (!Array.isArray(v)) {
      err(where, `${k} tem de ser uma lista`)
      return []
    }
    return v.map((x, i) => rec(where, `${k}[${i}]`, x))
  }
  const momento = (where: string, v: unknown): Momento | undefined => {
    if (v === undefined) return undefined
    const r = rec(where, 'momento', v)
    keys(where, r, K.momento)
    const dia = int(r.dia)
    if (dia === undefined) {
      err(where, 'dia tem de ser um inteiro')
      return undefined
    }
    if (r.terco !== undefined && !terco(r.terco)) err(where, `terço desconhecido: ${String(r.terco)} (manhã | tarde | noite)`)
    return { dia, terco: terco(r.terco) }
  }
  const diaTerco = (where: string, r: Raw): { dia?: number; terco?: Terco } => {
    if (r.terco !== undefined && !terco(r.terco)) err(where, `terço desconhecido: ${String(r.terco)}`)
    return { dia: inteiro(where, 'dia', r.dia), terco: terco(r.terco) }
  }

  const registo = emptyRegisto()
  const seen = new Map<string, string>()
  const unique = (where: string, id: string): boolean => {
    const prev = seen.get(id)
    if (prev) {
      err(where, `id duplicado (${id}, também em ${prev})`)
      return false
    }
    seen.set(id, where)
    return true
  }

  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const base = f.path.replace(/^.*\//, '').replace(/\.json$/, '')
    if (f.kind === 'sessao') {
      const w = `registo/${base}`
      if (!isObj(f.content)) {
        err(w, 'esperava um objeto (uma sessão por ficheiro)')
        continue
      }
      const r = f.content
      keys(w, r, K.sessao)
      const estado: EstadoSessao = r.estado === 'planeada' ? 'planeada' : 'jogada'
      if (r.estado !== undefined && r.estado !== 'jogada' && r.estado !== 'planeada') err(w, `estado desconhecido: ${String(r.estado)}`)
      // a planeada pode ainda não ter data nem título
      if (!need(w, r, estado === 'planeada' ? ['id', 'capitulo'] : ['id', 'data', 'titulo', 'capitulo'])) continue
      const id = str(r.id)
      if (!ID_SESSAO.test(id)) err(w, `id inválido: ${id} (s-NN)`)
      if (id !== base) err(w, `o nome do ficheiro (${base}) não coincide com o id (${id})`)
      if (!unique(w, id)) continue
      const mesaR = rec(w, 'mesa', r.mesa)
      keys(`${w}.mesa`, mesaR, K.mesa)
      let tempo: Sessao['tempo']
      if (r.tempo !== undefined) {
        const tempoR = rec(w, 'tempo', r.tempo)
        keys(`${w}.tempo`, tempoR, K.tempo)
        const de = momento(`${w}.tempo.de`, tempoR.de)
        const a = momento(`${w}.tempo.a`, tempoR.a)
        if (!de || !a) err(`${w}.tempo`, 'tempo exige de e a, cada um {dia, terco}')
        else tempo = { de, a, estimado: bool(`${w}.tempo`, 'estimado', tempoR.estimado) }
      }
      const beats: SessaoBeat[] = []
      for (const [i, br] of arr(w, 'beats', r.beats).entries()) {
        const wb = `${w}.beats[${i}]`
        keys(wb, br, K.beat)
        if (!need(wb, br, ['id'])) continue
        beats.push({ id: str(br.id), escolha: texto(wb, 'escolha', br.escolha), continua: bool(wb, 'continua', br.continua), ...diaTerco(wb, br) })
      }
      const npcs: SessaoNpc[] = []
      for (const [i, nr] of arr(w, 'npcs', r.npcs).entries()) {
        const wn = `${w}.npcs[${i}]`
        keys(wn, nr, K.npc)
        if (!need(wn, nr, ['id'])) continue
        const att = (ATTITUDES as string[]).includes(String(nr.atitude)) ? (nr.atitude as Attitude) : undefined
        if (nr.atitude !== undefined && !att) err(wn, `atitude desconhecida: ${String(nr.atitude)}`)
        const estadoNpc = texto(wn, 'estado', nr.estado)
        if (!estadoNpc && !att) warn(wn, 'npc sem estado nem atitude')
        npcs.push({ id: str(nr.id), estado: estadoNpc, atitude: att, ...diaTerco(wn, nr) })
      }
      const flags: Record<string, boolean> = {}
      for (const [k, v] of Object.entries(rec(w, 'flags', r.flags))) {
        if (typeof v !== 'boolean') err(`${w}.flags.${k}`, 'uma flag é true ou false')
        else flags[k] = v
      }
      const loot: Loot[] = []
      for (const [i, lr] of arr(w, 'loot', r.loot).entries()) {
        const wl = `${w}.loot[${i}]`
        keys(wl, lr, K.loot)
        if (!need(wl, lr, ['item', 'para'])) continue
        const quantidade = numero(wl, 'quantidade', lr.quantidade)
        if (quantidade !== undefined && quantidade <= 0) err(wl, 'quantidade tem de ser positiva')
        loot.push({ item: str(lr.item), de: texto(wl, 'de', lr.de), para: str(lr.para), quantidade, nota: texto(wl, 'nota', lr.nota), ...diaTerco(wl, lr) })
      }
      const fios: FioMovimento[] = []
      for (const [i, mr] of arr(w, 'fios', r.fios).entries()) {
        const wm = `${w}.fios[${i}]`
        keys(wm, mr, K.fioMov)
        if (!need(wm, mr, ['id'])) continue
        const movs = TIPOS_MOVIMENTO.filter((k) => mr[k] !== undefined)
        if (movs.length !== 1) {
          err(wm, 'um movimento de fio tem exatamente um de: avanca, fecha, descarta')
          continue
        }
        const tipo = movs[0]
        if (typeof mr[tipo] !== 'string') {
          err(wm, `${tipo} tem de ser texto`)
          continue
        }
        fios.push({ id: str(mr.id), tipo, texto: str(mr[tipo]) })
      }
      const relogios: RelogioPosicao[] = []
      for (const [i, pr] of arr(w, 'relogios', r.relogios).entries()) {
        const wp = `${w}.relogios[${i}]`
        keys(wp, pr, K.relogioPos)
        if (!need(wp, pr, ['id'])) continue
        const pos = int(pr.posicao)
        if (pos === undefined) {
          err(wp, 'posicao tem de ser um inteiro')
          continue
        }
        relogios.push({ id: str(pr.id), posicao: pos, nota: texto(wp, 'nota', pr.nota) })
      }
      registo.sessoes.push({
        id,
        global: inteiro(w, 'global', r.global),
        data: str(r.data),
        titulo: str(r.titulo),
        estado,
        capitulo: str(r.capitulo),
        resumo: texto(w, 'resumo', r.resumo),
        gravacao: texto(w, 'gravacao', r.gravacao),
        preparacao: texto(w, 'preparacao', r.preparacao),
        mesa: { presentes: lista(w, 'mesa.presentes', mesaR.presentes), ausentes: lista(w, 'mesa.ausentes', mesaR.ausentes), notas: texto(w, 'mesa.notas', mesaR.notas) },
        tempo,
        beats,
        npcs,
        flags,
        revelacoes: lista(w, 'revelacoes', r.revelacoes),
        portentos: lista(w, 'portentos', r.portentos),
        loot,
        fios,
        relogios,
        cumpre: lista(w, 'cumpre', r.cumpre),
        notas: texto(w, 'notas', r.notas),
      })
      continue
    }

    if (!Array.isArray(f.content)) {
      err(`registo/${base}`, 'esperava um array')
      continue
    }
    for (const [i, raw] of f.content.entries()) {
      if (!isObj(raw)) {
        err(`registo/${base}[${i}]`, 'esperava um objeto')
        continue
      }
      const r = raw
      if (f.kind === 'decisoes') {
        const w = `registo/decisoes/${base}[${i}]`
        keys(w, r, K.decisao)
        if (!need(w, r, ['id', 'data', 'origem', 'texto'])) continue
        const id = str(r.id)
        const m = ID_DECISAO.exec(id)
        if (!m) err(w, `id inválido: ${id} (d-AAAA-MM-DD-NN)`)
        else if (m[1] !== str(r.data)) err(w, `a data do id (${m[1]}) não é a do campo data (${str(r.data)})`)
        if (!str(r.data).startsWith(base)) err(w, `decisão de ${str(r.data)} no ficheiro de ${base}`)
        if (!unique(`${w} (${id})`, id)) continue
        const origem = (ORIGENS as string[]).includes(str(r.origem)) ? (r.origem as OrigemDecisao) : undefined
        if (!origem) err(w, `origem desconhecida: ${str(r.origem)} (mesa | chat | voz)`)
        const tipo = (TIPOS_DECISAO as string[]).includes(str(r.tipo)) ? (r.tipo as TipoDecisao) : undefined
        if (r.tipo !== undefined && !tipo) err(w, `tipo desconhecido: ${String(r.tipo)} (plano | mesa | rejeitada)`)
        registo.decisoes.push({
          id,
          data: str(r.data),
          origem: origem ?? 'chat',
          sessao: texto(w, 'sessao', r.sessao),
          fonte: texto(w, 'fonte', r.fonte),
          tipo,
          texto: str(r.texto),
          afeta: lista(w, 'afeta', r.afeta),
          substitui: texto(w, 'substitui', r.substitui),
          gatilho: lista(w, 'gatilho', r.gatilho),
          prazo: texto(w, 'prazo', r.prazo),
          quando: texto(w, 'quando', r.quando),
          fecha: lista(w, 'fecha', r.fecha),
        })
      } else if (f.kind === 'fios') {
        const w = `registo/fios[${i}]`
        keys(w, r, K.fio)
        if (!need(w, r, ['id', 'tipo', 'titulo', 'aberto'])) continue
        const id = str(r.id)
        if (!ID_FIO.test(id)) err(w, `id inválido: ${id} (fio-…)`)
        if (!unique(`${w} (${id})`, id)) continue
        if (r.tipo !== 'fio' && r.tipo !== 'pergunta') err(w, `tipo desconhecido: ${String(r.tipo)} (fio | pergunta)`)
        registo.fios.push({ id, tipo: r.tipo === 'pergunta' ? 'pergunta' : 'fio', titulo: str(r.titulo), sobre: lista(w, 'sobre', r.sobre), aberto: str(r.aberto), prazo: texto(w, 'prazo', r.prazo), notas: texto(w, 'notas', r.notas) })
      } else if (f.kind === 'itens') {
        const w = `registo/itens[${i}]`
        keys(w, r, K.item)
        if (!need(w, r, ['id', 'nome', 'tipo'])) continue
        const id = str(r.id)
        if (!ID_ITEM.test(id)) err(w, `id inválido: ${id} (i-…)`)
        if (!unique(`${w} (${id})`, id)) continue
        if (r.tipo !== 'item' && r.tipo !== 'handout' && r.tipo !== 'ouro') err(w, `tipo desconhecido: ${String(r.tipo)} (item | handout | ouro)`)
        registo.itens.push({
          id,
          nome: str(r.nome),
          tipo: r.tipo === 'handout' ? 'handout' : r.tipo === 'ouro' ? 'ouro' : 'item',
          regras: texto(w, 'regras', r.regras),
          texto: texto(w, 'texto', r.texto),
          drive: texto(w, 'drive', r.drive),
          para: typeof r.para === 'string' ? [r.para] : lista(w, 'para', r.para),
          notas: texto(w, 'notas', r.notas),
        })
      } else if (f.kind === 'relogios') {
        const w = `registo/relogios[${i}]`
        keys(w, r, K.relogio)
        if (!need(w, r, ['id', 'nome', 'passos'])) continue
        const id = str(r.id)
        if (!ID_RELOGIO.test(id)) err(w, `id inválido: ${id} (rel-…)`)
        if (!unique(`${w} (${id})`, id)) continue
        const passos = int(r.passos)
        if (passos === undefined || passos <= 0) {
          err(w, 'passos tem de ser um inteiro positivo')
          continue
        }
        registo.relogios.push({ id, nome: str(r.nome), sobre: lista(w, 'sobre', r.sobre), passos, unidade: texto(w, 'unidade', r.unidade), prazo: texto(w, 'prazo', r.prazo), nota: texto(w, 'nota', r.nota) })
      }
    }
  }

  // por data; uma planeada ainda sem data vai para o fim
  const dataOrd = (s: Sessao) => s.data || '9999-12-31'
  registo.sessoes.sort((a, b) => dataOrd(a).localeCompare(dataOrd(b)) || a.id.localeCompare(b.id, undefined, { numeric: true }))
  registo.decisoes.sort((a, b) => a.id.localeCompare(b.id))
  return { registo, problems }
}

/** Compara dois momentos; sem terço num deles, o mesmo dia conta como indeterminado, não como conflito. */
const cmpMomento = (x: Momento, y: Momento): number => x.dia - y.dia || (x.terco && y.terco ? TERCOS.indexOf(x.terco) - TERCOS.indexOf(y.terco) : 0)

// ---- estado derivado -----------------------------------------------------------------------------

export interface BeatJogado {
  /** Sessões onde apareceu, por ordem. */
  sessoes: string[]
  escolha?: string
  /** Só apareceu com `continua`: em curso, ainda não jogado. */
  emCurso: boolean
}
export interface NpcDerivado {
  estado?: string
  atitude?: Attitude
  /** Última sessão em que apareceu. */
  sessao: string
  /** Sessão em que o estado atual foi escrito. */
  sessaoEstado?: string
  historico: { sessao: string; estado?: string; atitude?: Attitude }[]
}
export interface FioDerivado {
  estado: 'aberto' | 'fechado' | 'descartado'
  /** Por ordem cronológica: a abertura, depois os movimentos das sessões e os fechos por decisão, por data. */
  movimentos: { onde: string; tipo: 'abre' | TipoMovimento; texto: string }[]
  /** Última sessão com movimento (ou a de abertura). */
  ultimaSessao?: string
  /** Data da abertura (da sessão ou da decisão). */
  abertoData?: string
  /** Data do último movimento (ou da abertura). */
  ultimaData?: string
}
export interface Estado {
  /** Sessões jogadas, por ordem. */
  sessoes: Sessao[]
  planeada?: Sessao
  jogados: Map<string, BeatJogado>
  /** Ids dos beats jogados (listados sem `continua` em alguma sessão jogada). */
  playedBeats: string[]
  /** revelação → sessão em que foi dada. */
  revelados: Map<string, string>
  portentos: Set<string>
  atitudes: Record<string, Attitude>
  npcs: Record<string, NpcDerivado>
  /** Flags ativas. */
  flags: Record<string, boolean>
  /** item → dono atual (c-id, grupo, perdido, gasto). */
  donos: Record<string, string>
  /** dono → itens e ouro. Só PCs e o grupo detêm ouro; perdido/gasto aparecem como destinos de itens. */
  inventario: Record<string, { itens: string[]; ouro: number }>
  fios: Record<string, FioDerivado>
  relogios: Record<string, { posicao: number; sessao?: string }>
  decisoes: { vigentes: Decisao[]; substituidas: Set<string>; cumpridas: Map<string, string>; planos: Decisao[] }
  capituloAtual: string | null
  momentoAtual?: Momento
}

export function derivar(canon: Canon, registo: Registo): Estado {
  const jogadas = registo.sessoes.filter((s) => s.estado === 'jogada')
  const planeada = [...registo.sessoes].reverse().find((s) => s.estado === 'planeada')
  const ouroIds = new Set(registo.itens.filter((i) => i.tipo === 'ouro').map((i) => i.id))
  const pcs = new Set(canon.characters.filter((c) => c.kind === 'pc').map((c) => c.id))
  const detemOuro = (x: string) => x === 'grupo' || pcs.has(x)
  const sessaoById = new Map(registo.sessoes.map((s) => [s.id, s]))
  const decisaoById = new Map(registo.decisoes.map((d) => [d.id, d]))

  const jogados = new Map<string, BeatJogado>()
  const revelados = new Map<string, string>()
  const portentos = new Set<string>()
  const atitudes: Record<string, Attitude> = {}
  const npcs: Record<string, NpcDerivado> = {}
  const flags: Record<string, boolean> = {}
  const donos: Record<string, string> = {}
  const ouro: Record<string, number> = {}
  const fios: Record<string, FioDerivado> = {}
  const relogios: Record<string, { posicao: number; sessao?: string }> = {}
  const cumpridas = new Map<string, string>()

  for (const f of registo.fios) {
    const abertoData = sessaoById.get(f.aberto)?.data || decisaoById.get(f.aberto)?.data
    fios[f.id] = { estado: 'aberto', movimentos: [{ onde: f.aberto, tipo: 'abre', texto: f.titulo }], ultimaSessao: ID_SESSAO.test(f.aberto) ? f.aberto : undefined, abertoData, ultimaData: abertoData }
  }

  for (const s of jogadas) {
    for (const b of s.beats) {
      const j = jogados.get(b.id) ?? { sessoes: [], emCurso: true }
      j.sessoes.push(s.id)
      if (!b.continua) j.emCurso = false
      if (b.escolha) j.escolha = b.escolha
      jogados.set(b.id, j)
    }
    for (const n of s.npcs) {
      const d = npcs[n.id] ?? { sessao: s.id, historico: [] }
      if (n.estado) {
        d.estado = n.estado
        d.sessaoEstado = s.id
      }
      if (n.atitude) {
        d.atitude = n.atitude
        atitudes[n.id] = n.atitude
      }
      d.sessao = s.id
      d.historico.push({ sessao: s.id, estado: n.estado, atitude: n.atitude })
      npcs[n.id] = d
    }
    for (const [k, v] of Object.entries(s.flags)) {
      if (v) flags[k] = true
      else delete flags[k]
    }
    for (const r of s.revelacoes) if (!revelados.has(r)) revelados.set(r, s.id)
    for (const p of s.portentos) portentos.add(p)
    for (const l of s.loot) {
      if (ouroIds.has(l.item)) {
        const q = l.quantidade ?? 0
        if (l.de && detemOuro(l.de)) ouro[l.de] = (ouro[l.de] ?? 0) - q
        if (detemOuro(l.para)) ouro[l.para] = (ouro[l.para] ?? 0) + q
      } else donos[l.item] = l.para
    }
    for (const p of s.relogios) relogios[p.id] = { posicao: p.posicao, sessao: s.id }
    for (const d of s.cumpre) cumpridas.set(d, s.id)
  }

  // fios: os movimentos das sessões e os fechos por decisão numa só cronologia (no mesmo dia, a sessão vem antes)
  const substituidas = new Set(registo.decisoes.map((d) => d.substitui).filter((x): x is string => !!x))
  const eventos: { chave: string; fio: string; onde: string; tipo: TipoMovimento; texto: string; sessao?: string; data: string }[] = []
  jogadas.forEach((s, i) => {
    for (const m of s.fios) eventos.push({ chave: `${s.data}|0|${String(i).padStart(4, '0')}`, fio: m.id, onde: s.id, tipo: m.tipo, texto: m.texto, sessao: s.id, data: s.data })
  })
  for (const d of registo.decisoes) {
    if (substituidas.has(d.id)) continue
    for (const f of d.fecha) eventos.push({ chave: `${d.data}|1|${d.id}`, fio: f, onde: d.id, tipo: 'fecha', texto: d.texto, data: d.data })
  }
  eventos.sort((a, b) => a.chave.localeCompare(b.chave))
  for (const e of eventos) {
    const d = fios[e.fio] ?? (fios[e.fio] = { estado: 'aberto', movimentos: [] })
    d.movimentos.push({ onde: e.onde, tipo: e.tipo, texto: e.texto })
    if (e.tipo === 'fecha') d.estado = 'fechado'
    else if (e.tipo === 'descarta') d.estado = 'descartado'
    if (e.sessao) d.ultimaSessao = e.sessao
    d.ultimaData = e.data
  }
  const vigentes = registo.decisoes.filter((d) => !substituidas.has(d.id))
  const planos = vigentes.filter((d) => d.tipo === 'plano' && !cumpridas.has(d.id))

  const inventario: Record<string, { itens: string[]; ouro: number }> = {}
  for (const [item, dono] of Object.entries(donos)) (inventario[dono] ??= { itens: [], ouro: 0 }).itens.push(item)
  for (const [dono, q] of Object.entries(ouro)) (inventario[dono] ??= { itens: [], ouro: 0 }).ouro = q

  const ultima = jogadas[jogadas.length - 1]
  const playedBeats = [...jogados.entries()].filter(([, j]) => !j.emCurso).map(([id]) => id)
  const chapterIds = new Set(canon.campaign.chapters.map((c) => c.id))
  return {
    sessoes: jogadas,
    planeada,
    jogados,
    playedBeats,
    revelados,
    portentos,
    atitudes,
    npcs,
    flags,
    donos,
    inventario,
    fios,
    relogios,
    decisoes: { vigentes, substituidas, cumpridas, planos },
    capituloAtual: ultima && chapterIds.has(ultima.capitulo) ? ultima.capitulo : null,
    momentoAtual: ultima?.tempo?.a,
  }
}

// ---- validação (cânone + registo) -------------------------------------------------------------------

/**
 * Regras que cruzam o registo com o cânone. Erro = referência que não existe ou regra de forma;
 * aviso = higiene (a lista do que o fecho ainda tem de reconciliar). Nunca lança.
 */
export function validateRegisto(canon: Canon, registo: Registo): Problem[] {
  const problems: Problem[] = []
  const err = (where: string, message: string) => problems.push({ level: 'error', where, message })
  const warn = (where: string, message: string) => problems.push({ level: 'warn', where, message })
  const beatById = new Map(canon.beats.map((b) => [b.id, b]))
  const chars = new Map(canon.characters.map((c) => [c.id, c]))
  const factions = new Set(canon.factions.map((f) => f.id))
  const chapters = new Map(canon.campaign.chapters.map((c, i) => [c.id, i]))
  const revelations = new Set(canon.revelations.map((r) => r.id))
  const pos = makeBeatPos(canon)
  const sessoes = new Map(registo.sessoes.map((s) => [s.id, s]))
  const decisoes = new Map(registo.decisoes.map((d) => [d.id, d]))
  const fios = new Map(registo.fios.map((f) => [f.id, f]))
  const itens = new Map(registo.itens.map((i) => [i.id, i]))
  const relogios = new Map(registo.relogios.map((r) => [r.id, r]))
  const allIds = new Set<string>([
    ...canon.characters.map((c) => c.id),
    ...canon.factions.map((f) => f.id),
    ...canon.locations.map((l) => l.id),
    ...canon.beats.map((b) => b.id),
    ...canon.arcs.map((a) => a.id),
    ...canon.revelations.map((r) => r.id),
    ...canon.ambitions.map((a) => a.id),
    ...sessoes.keys(),
    ...decisoes.keys(),
    ...fios.keys(),
    ...itens.keys(),
    ...relogios.keys(),
  ])
  const estado = derivar(canon, registo)
  const okDestino = (x: string) => chars.has(x) || (DESTINOS_ESPECIAIS as readonly string[]).includes(x)
  const detemOuro = (x: string) => x === 'grupo' || chars.get(x)?.kind === 'pc'

  // sessões
  let prev: Sessao | undefined
  const globais = new Set<number>()
  const planeadas = registo.sessoes.filter((s) => s.estado === 'planeada')
  if (planeadas.length > 1) err('registo/sessoes', `${planeadas.length} sessões planeadas (no máximo uma, a última)`)
  if (planeadas.length === 1 && registo.sessoes[registo.sessoes.length - 1] !== planeadas[0]) err(`registo/${planeadas[0].id}`, 'a sessão planeada tem de ser a última (a data é anterior à de uma jogada)')
  for (const s of registo.sessoes) {
    const w = `registo/${s.id}`
    if (s.data ? !DATA_ISO.test(s.data) : s.estado === 'jogada') err(w, `data inválida: ${s.data || '(vazia)'}`)
    if (!chapters.has(s.capitulo)) err(w, `capítulo desconhecido: ${s.capitulo}`)
    if (s.global !== undefined) {
      if (s.estado === 'jogada' && globais.has(s.global)) err(w, `número global repetido: ${s.global}`)
      globais.add(s.global)
    }
    if (prev && s.id.localeCompare(prev.id, undefined, { numeric: true }) <= 0) err(w, `id fora de ordem face a ${prev.id}`)
    for (const pc of [...s.mesa.presentes, ...s.mesa.ausentes]) {
      const c = chars.get(pc)
      if (!c) err(w, `PC desconhecido na mesa: ${pc}`)
      else if (c.kind !== 'pc') err(w, `${pc} não é um PC`)
    }
    if (s.tempo) {
      if (cmpMomento(s.tempo.de, s.tempo.a) > 0) err(w, 'tempo.de é posterior a tempo.a')
      if (prev?.tempo && cmpMomento(prev.tempo.a, s.tempo.de) > 0) warn(w, `começa antes do fim da sessão anterior (${prev.id})`)
      for (const x of [...s.beats, ...s.npcs, ...s.loot]) if (x.dia !== undefined && (x.dia < s.tempo.de.dia || x.dia > s.tempo.a.dia)) warn(w, `dia ${x.dia} fora do intervalo da sessão`)
    }
    if (s.estado === 'planeada') {
      if (s.npcs.length || s.loot.length || s.fios.length || s.relogios.length || s.cumpre.length || s.revelacoes.length || s.portentos.length || Object.keys(s.flags).length) err(w, 'uma sessão planeada só tem beats previstos')
      for (const b of s.beats) if (estado.playedBeats.includes(b.id)) warn(w, `beat previsto já jogado: ${b.id}`)
    } else {
      if (!s.resumo) warn(w, 'sem resumo (caminho do .md)')
      if (!s.beats.length) warn(w, 'sessão jogada sem beats')
      if (!s.mesa.presentes.length) warn(w, 'sem presenças')
    }
    for (const b of s.beats) {
      const beat = beatById.get(b.id)
      if (!beat) {
        err(w, `beat desconhecido: ${b.id}`)
        continue
      }
      if (b.escolha && beat.choices.length && !beat.choices.some((c) => c.label === b.escolha)) warn(w, `escolha «${b.escolha}» não coincide com nenhuma choice de ${b.id} (a mesa inventou, ou o label mudou)`)
      if (b.escolha && !beat.choices.length) warn(w, `${b.id} não tem choices; escolha «${b.escolha}» registada na mesma`)
      if (s.estado === 'jogada' && (chapters.get(beat.chapter) ?? 99) > (chapters.get(s.capitulo) ?? -1)) warn(w, `${b.id} é de um capítulo posterior ao da sessão (${s.capitulo})`)
    }
    for (const n of s.npcs) if (!chars.has(n.id)) err(w, `personagem desconhecida: ${n.id}`)
    for (const r of s.revelacoes) if (!revelations.has(r)) err(w, `revelação desconhecida: ${r}`)
    for (const p of s.portentos) {
      const [f, ch] = p.split(':')
      if (!factions.has(f) || !chapters.has(ch)) err(w, `portento desconhecido: ${p} (f-x:chN)`)
    }
    for (const l of s.loot) {
      const item = itens.get(l.item)
      if (!item) err(w, `item desconhecido: ${l.item} (catálogo em registo/itens.json)`)
      if (!okDestino(l.para)) err(w, `destino desconhecido no loot: ${l.para}`)
      if (l.de && !okDestino(l.de) && !canon.locations.some((x) => x.id === l.de)) err(w, `origem desconhecida no loot: ${l.de}`)
      if (item?.tipo === 'ouro' && l.quantidade === undefined) warn(w, `ouro sem quantidade (${l.item})`)
      if (item && item.tipo !== 'ouro' && l.quantidade !== undefined && l.quantidade !== 1) warn(w, `quantidade ${l.quantidade} ignorada em ${l.item}: só o ouro soma quantidades (um i-… por exemplar)`)
    }
    for (const m of s.fios) {
      const f = fios.get(m.id)
      if (!f) {
        err(w, `fio desconhecido: ${m.id} (abre-se primeiro em registo/fios.json)`)
        continue
      }
      const ab = estado.fios[m.id]?.abertoData
      if (ab && s.data && s.data < ab) err(w, `${m.id} move-se antes de ter sido aberto (${f.aberto}, ${ab})`)
    }
    for (const p of s.relogios) {
      const r = relogios.get(p.id)
      if (!r) {
        err(w, `relógio desconhecido: ${p.id}`)
        continue
      }
      if (p.posicao < 0 || p.posicao > r.passos) err(w, `${p.id}: posicao ${p.posicao} fora de 0..${r.passos}`)
    }
    for (const d of s.cumpre) {
      const dec = decisoes.get(d)
      if (!dec) err(w, `decisão desconhecida em cumpre: ${d}`)
      else if (dec.tipo !== 'plano') warn(w, `cumpre ${d}, que não é um plano`)
    }
    prev = s
  }

  // beat jogado numa sessão com ordem posterior a beats jogados em sessões seguintes: ordem errada no cânone (ex.: b-0-urzin-day)
  const jogadosPor = estado.sessoes.map((s) => s.beats.filter((b) => !b.continua && beatById.has(b.id)))
  for (let k = 0; k < jogadosPor.length; k++) {
    for (const b of jogadosPor[k]) {
      const cap = beatById.get(b.id)!.chapter
      const depois = jogadosPor.slice(k + 1).flat().find((c) => beatById.get(c.id)!.chapter === cap && pos(c.id) < pos(b.id))
      if (depois) warn(`beats/${b.id}`, `jogado em ${estado.sessoes[k].id} com order posterior a ${depois.id}, jogado depois: a ordem no cânone está errada?`)
    }
  }

  // fios: um fio fechado não se move mais; parado há muito
  for (const [id, d] of Object.entries(estado.fios)) {
    const i = d.movimentos.findIndex((m) => m.tipo === 'fecha' || m.tipo === 'descarta')
    if (i >= 0 && i < d.movimentos.length - 1) err(`registo/fios/${id}`, `movido depois de ${d.movimentos[i].tipo === 'fecha' ? 'fechado' : 'descartado'} (${d.movimentos[i].onde})`)
    if (d.estado === 'aberto' && d.ultimaData) {
      const n = estado.sessoes.filter((s) => s.data > d.ultimaData!).length
      if (n >= 4) warn(`registo/fios/${id}`, `aberto e parado há ${n} sessões`)
    }
  }
  for (const f of registo.fios) {
    const w = `registo/fios/${f.id}`
    if (!sessoes.has(f.aberto) && !decisoes.has(f.aberto)) err(w, `aberto desconhecido (sessão ou decisão): ${f.aberto}`)
    if (!f.sobre.length) warn(w, 'sem sobre (a que entidades diz respeito)')
    for (const id of f.sobre) if (!allIds.has(id)) err(w, `sobre desconhecido: ${id}`)
  }

  // decisões
  for (const d of registo.decisoes) {
    const w = `registo/decisoes/${d.id}`
    if (d.sessao && !sessoes.has(d.sessao)) err(w, `sessão desconhecida: ${d.sessao}`)
    if (d.origem === 'voz' && !d.fonte) err(w, 'origem voz exige fonte')
    if (d.substitui) {
      if (d.substitui >= d.id) err(w, `substitui uma decisão posterior ou a si própria (${d.substitui})`)
      else if (!decisoes.has(d.substitui)) err(w, `substitui uma decisão desconhecida: ${d.substitui}`)
      else if (registo.decisoes.some((x) => x !== d && x.substitui === d.substitui)) err(w, `${d.substitui} já foi substituída por outra decisão`)
    }
    if (d.tipo === 'plano' && !d.gatilho.length && !d.prazo) err(w, 'um plano exige gatilho (beats) ou prazo')
    if (d.tipo === 'rejeitada' && (d.gatilho.length || d.prazo)) err(w, 'uma rejeição não leva gatilho nem prazo')
    for (const g of d.gatilho) if (!beatById.has(g)) err(w, `gatilho desconhecido (beat): ${g}`)
    if (d.prazo && !ID_SESSAO.test(d.prazo) && !DATA_ISO.test(d.prazo)) err(w, `prazo inválido: ${d.prazo} (s-NN ou AAAA-MM-DD)`)
    if (d.prazo && ID_SESSAO.test(d.prazo) && !sessoes.has(d.prazo)) warn(w, `prazo numa sessão que ainda não existe: ${d.prazo}`)
    for (const a of d.afeta) if (!ANCORA_DOC.test(a) && !allIds.has(a)) err(w, `afeta desconhecido: ${a}`)
    for (const f of d.fecha) {
      const fio = fios.get(f)
      if (!fio) err(w, `fecha um fio desconhecido: ${f}`)
      else if (fio.tipo !== 'pergunta') warn(w, `fecha ${f}, que não é uma pergunta (um fio fecha-se numa sessão)`)
    }
    if (d.tipo === 'plano' && d.prazo && sessoes.get(d.prazo)?.estado === 'jogada' && !estado.decisoes.cumpridas.has(d.id) && !estado.decisoes.substituidas.has(d.id)) warn(w, `plano com prazo ${d.prazo}, já jogada, sem cumpre`)
  }

  // itens e relógios
  for (const i of registo.itens) {
    const w = `registo/itens/${i.id}`
    if (i.tipo !== 'ouro' && !(i.id in estado.donos)) warn(w, 'item sem dono (nunca referido em loot)')
    if (i.tipo === 'handout' && !i.texto && !i.drive) err(w, 'um handout exige texto (docs/handouts.md#ancora) ou drive')
    for (const p of i.para) if (!chars.has(p)) err(w, `destinatário desconhecido: ${p}`)
    if (i.regras && !ANCORA_DOC.test(i.regras)) err(w, `regras tem de ser docs/<ficheiro>.md#<ancora>: ${i.regras}`)
    if (i.texto && !ANCORA_DOC.test(i.texto)) err(w, `texto tem de ser docs/<ficheiro>.md#<ancora>: ${i.texto}`)
  }
  for (const r of registo.relogios) for (const id of r.sobre) if (!allIds.has(id)) err(`registo/relogios/${r.id}`, `sobre desconhecido: ${id}`)

  // ao longo das sessões: relógios a recuar, `de` diferente do dono derivado, ouro a ficar negativo, mortos a reaparecer, flags a false sem terem estado ativas
  const posAnterior: Record<string, number> = {}
  const donoAnterior: Record<string, string> = {}
  const saldo: Record<string, number> = {}
  const ativas = new Set<string>()
  for (const s of estado.sessoes) {
    const w = `registo/${s.id}`
    for (const p of s.relogios) {
      if (posAnterior[p.id] !== undefined && p.posicao < posAnterior[p.id]) warn(w, `${p.id} recua de ${posAnterior[p.id]} para ${p.posicao}`)
      posAnterior[p.id] = p.posicao
    }
    for (const l of s.loot) {
      if (itens.get(l.item)?.tipo === 'ouro') {
        const q = l.quantidade ?? 0
        if (l.de && detemOuro(l.de)) saldo[l.de] = (saldo[l.de] ?? 0) - q
        if (detemOuro(l.para)) saldo[l.para] = (saldo[l.para] ?? 0) + q
        continue
      }
      if (l.de && donoAnterior[l.item] && donoAnterior[l.item] !== l.de) warn(w, `${l.item}: de ${l.de}, mas o dono derivado era ${donoAnterior[l.item]}`)
      donoAnterior[l.item] = l.para
    }
    for (const [dono, q] of Object.entries(saldo)) if (q < 0) warn(w, `${dono} fica com ${q} po`)
    for (const n of s.npcs) {
      const h = estado.npcs[n.id]?.historico ?? []
      const i = h.findIndex((x) => x.sessao === s.id)
      const antes = h.slice(0, i).reverse().find((x) => x.estado)
      if (antes && /^mort[oa]\b/i.test(antes.estado ?? '') && !n.estado) warn(w, `${n.id} estava morto e reaparece sem estado novo`)
    }
    for (const [k, v] of Object.entries(s.flags)) {
      if (v) ativas.add(k)
      else if (!ativas.has(k)) warn(w, `flag ${k} posta a false sem nunca ter estado ativa`)
    }
  }
  for (const [id, j] of estado.jogados) if (j.emCurso && j.sessoes.length >= 3) warn(`beats/${id}`, `em curso há ${j.sessoes.length} sessões (nunca sem continua)`)
  for (const [r, sid] of estado.revelados) {
    const s = sessoes.get(sid)
    if (s && !s.beats.some((b) => beatById.get(b.id)?.reveals.includes(r))) warn(`registo/${sid}`, `revelação ${r} dada sem beat dessa sessão que a revele (reveals)`)
  }
  return problems
}
