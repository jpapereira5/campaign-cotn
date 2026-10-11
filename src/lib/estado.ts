// O estado calculado (docs/arquitetura.md, secção 6): percorre as sessões por ordem e aplica os efeitos dos
// acontecimentos. Nada disto se escreve à mão. Puro: usado pela app e pelos scripts.
import type { Arvore, DocArvore } from './arquivo/arvore.ts'
import { porPasta } from './arquivo/arvore.ts'

export interface Acontecimento {
  id: string
  tipo: string
  texto: string
  envolve: string[]
  origem?: string[]
  efeitos?: Record<string, unknown>[]
  tags?: string[]
  fechado?: boolean
  fonte?: string
}

export interface SessaoLida {
  doc: DocArvore
  id: string
  n: number
  data: string | null
  titulo: string
  acontecimentos: Acontecimento[]
  beats: Record<string, string>
  mesa: Record<string, string>
  jogada: boolean
}

/** Uma marca no tempo: em que sessão e por que acontecimento. */
export interface Marca {
  sessao: string
  n: number
  acontecimento: string
}

export interface EstadoPersonagem {
  estado?: { valor: string; onde?: string; marca: Marca }
  atitude?: { valor: string; marca: Marca }
  relacoes: { com: string; tipo: string; ativa: boolean; marca: Marca }[]
  contadores: Record<string, { valor: number; marca: Marca }>
  cenas: Marca[]
}

export interface EstadoItem {
  posse?: { com?: string; onde?: string; marca: Marca }
}

export interface EstadoSegredo {
  sabe: { quem: string; nivel: string; marca: Marca }[]
  mesaSabe?: Marca
  pistasDadas: Marca[]
}

export interface EstadoFio {
  estado?: { valor: string; marca: Marca }
  relogio?: { valor: number; marca: Marca }
}

export interface EstadoMesa {
  sessoes: SessaoLida[]
  ultima?: SessaoLida
  proximaN: number
  nivel?: number
  mundo?: string
  presencas: Record<string, number>
}

export interface Estado {
  personagens: Map<string, EstadoPersonagem>
  itens: Map<string, EstadoItem>
  segredos: Map<string, EstadoSegredo>
  fios: Map<string, EstadoFio>
  /** beat → jogado | em-curso | saltado, com a última sessão em que foi tocado */
  beats: Map<string, { estado: string; marca: Marca }>
  /** id → acontecimentos em que entra, por ordem */
  historia: Map<string, { sessao: SessaoLida; ac: Acontecimento }[]>
  mesa: EstadoMesa
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

export function lerSessoes(a: Arvore, hoje?: string): SessaoLida[] {
  const limite = hoje ?? new Date().toISOString().slice(0, 10)
  return porPasta(a)
    .sessoes.map((doc) => {
      const n = Number(doc.meta.n ?? 0)
      const data = typeof doc.meta.data === 'string' ? doc.meta.data : null
      return {
        doc,
        id: String(doc.meta.id ?? ''),
        n,
        data,
        titulo: String(doc.meta.titulo ?? ''),
        acontecimentos: (Array.isArray(doc.meta.acontecimentos) ? doc.meta.acontecimentos : []) as Acontecimento[],
        beats: obj(doc.meta.beats) as Record<string, string>,
        mesa: obj(doc.meta.mesa) as Record<string, string>,
        jogada: n >= 1 && !!data && data <= limite,
      }
    })
    .sort((x, y) => x.n - y.n)
}

export function calcularEstado(a: Arvore, hoje?: string): Estado {
  const sessoes = lerSessoes(a, hoje)
  const jogadas = sessoes.filter((s) => s.jogada || s.n === 0)
  const personagens = new Map<string, EstadoPersonagem>()
  const itens = new Map<string, EstadoItem>()
  const segredos = new Map<string, EstadoSegredo>()
  const fios = new Map<string, EstadoFio>()
  const beats = new Map<string, { estado: string; marca: Marca }>()
  const historia = new Map<string, { sessao: SessaoLida; ac: Acontecimento }[]>()
  const presencas: Record<string, number> = {}

  const pers = (id: string): EstadoPersonagem => {
    let e = personagens.get(id)
    if (!e) personagens.set(id, (e = { relacoes: [], contadores: {}, cenas: [] }))
    return e
  }
  const seg = (id: string): EstadoSegredo => {
    let e = segredos.get(id)
    if (!e) segredos.set(id, (e = { sabe: [], pistasDadas: [] }))
    return e
  }
  const fio = (id: string): EstadoFio => {
    let e = fios.get(id)
    if (!e) fios.set(id, (e = {}))
    return e
  }

  for (const s of jogadas) {
    for (const pc of Object.keys(s.mesa)) if (s.n >= 1) presencas[pc] = (presencas[pc] ?? 0) + 1
    for (const [b, estado] of Object.entries(s.beats)) beats.set(b, { estado, marca: { sessao: s.id, n: s.n, acontecimento: '' } })
    for (const ac of s.acontecimentos) {
      const marca: Marca = { sessao: s.id, n: s.n, acontecimento: ac.id }
      for (const id of ac.envolve) historia.set(id, [...(historia.get(id) ?? []), { sessao: s, ac }])
      if (ac.tipo === 'cena') {
        const pc = ac.envolve.find((id) => id.startsWith('c-pc-'))
        if (pc) pers(pc).cenas.push(marca)
      }
      for (const ef of ac.efeitos ?? []) {
        if ('estado' in ef) pers(String(ef.estado)).estado = { valor: String(ef.valor ?? ''), ...(ef.onde ? { onde: String(ef.onde) } : {}), marca }
        else if ('atitude' in ef) pers(String(ef.atitude)).atitude = { valor: String(ef.valor ?? ''), marca }
        else if ('posse' in ef) itens.set(String(ef.posse), { posse: { ...(ef.com ? { com: String(ef.com) } : {}), ...(ef.onde ? { onde: String(ef.onde) } : {}), marca } })
        else if ('sabe' in ef) {
          const e = seg(String(ef.sabe))
          for (const quem of lista(ef.quem)) {
            if (quem === 'mesa') e.mesaSabe = marca
            else {
              e.sabe = e.sabe.filter((x) => x.quem !== quem)
              e.sabe.push({ quem, nivel: String(ef.nivel ?? 'total'), marca })
            }
          }
        } else if ('pista' in ef) seg(String(ef.pista)).pistasDadas.push(marca)
        else if ('relogio' in ef) fio(String(ef.relogio)).relogio = { valor: Number(ef.valor ?? 0), marca }
        else if ('fio' in ef) fio(String(ef.fio)).estado = { valor: String(ef.valor ?? ''), marca }
        else if ('relacao' in ef) {
          const e = pers(String(ef.relacao))
          const com = String(ef.com ?? '')
          const tipo = String(ef.tipo ?? '')
          e.relacoes = e.relacoes.filter((r) => !(r.com === com && r.tipo === tipo))
          e.relacoes.push({ com, tipo, ativa: ef.valor !== 'nao' && ef.valor !== false, marca })
        } else if ('contador' in ef) {
          const e = pers(String(ef.de ?? ''))
          const nome = String(ef.contador)
          const atual = e.contadores[nome]?.valor ?? 0
          const valor = typeof ef.valor === 'number' ? ef.valor : atual + (typeof ef.mais === 'number' ? ef.mais : 0)
          e.contadores[nome] = { valor, marca }
        }
      }
    }
  }

  const reais = sessoes.filter((s) => s.jogada)
  const ultima = reais[reais.length - 1]
  const mesa: EstadoMesa = {
    sessoes,
    ultima,
    proximaN: (ultima?.n ?? 0) + 1,
    nivel: typeof ultima?.doc.meta.nivel === 'number' ? ultima.doc.meta.nivel : undefined,
    mundo: typeof ultima?.doc.meta.mundo === 'string' ? ultima.doc.meta.mundo : undefined,
    presencas,
  }
  return { personagens, itens, segredos, fios, beats, historia, mesa }
}

/** Rótulo curto de uma marca: «S3». */
export const rotuloMarca = (m: Marca): string => (m.n === 0 ? 'S0' : `S${m.n}`)
