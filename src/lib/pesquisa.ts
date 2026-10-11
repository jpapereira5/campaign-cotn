// Pesquisa global sobre o índice das fichas (puro): qualquer documento com id, sessões incluídas.
import type { DocArvore } from './arquivo/arvore.ts'
import type { Indice, Pasta } from './ficha.ts'
import { pastaDe, tipoDe } from './ficha.ts'

export interface Resultado {
  id: string
  titulo: string
  sub: string
  pasta: Pasta
  pontos: number
}

export const ROTULO_PASTA: Record<Pasta, string> = {
  personagens: 'Personagens', facoes: 'Fações', locais: 'Locais', itens: 'Itens', segredos: 'Segredos', beats: 'Beats', fios: 'Fios', jogadores: 'Jogadores', sessoes: 'Sessões', outro: 'Outros',
}
export const ORDEM_PASTAS: Pasta[] = ['personagens', 'facoes', 'locais', 'itens', 'segredos', 'beats', 'fios', 'jogadores', 'sessoes', 'outro']

export function semAcentos(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function pontosDe(q: string, titulo: string, corpo: string): number {
  const t = semAcentos(titulo)
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.split(/\s+/).some((w) => w.startsWith(q))) return 70
  if (t.includes(q)) return 60
  if (semAcentos(corpo).includes(q)) return 20
  return 0
}

/** A linha por baixo do título: o tipo e, se houver, o capítulo ou a legenda. */
export function subtituloDe(d: DocArvore, curto: (c: string) => string): string {
  const m = d.meta
  const caps = Array.isArray(m.capitulos) ? (m.capitulos as string[]) : typeof m.capitulo === 'string' ? [m.capitulo] : []
  const partes = [tipoDe(d), typeof m.legenda === 'string' ? m.legenda : '', caps.map(curto).join(', ')]
  if (pastaDe(d) === 'sessoes' && typeof m.data === 'string') partes[1] = m.data
  return partes.filter(Boolean).join(' · ')
}

export function pesquisar(indice: Indice, query: string, curto: (c: string) => string, limite = 40): Resultado[] {
  const q = semAcentos(query.trim())
  if (q.length < 2) return []
  const out: Resultado[] = []
  for (const [id, d] of indice.porId) {
    const corpo = [d.body, typeof d.meta.legenda === 'string' ? d.meta.legenda : '', ...(Array.isArray(d.meta.tags) ? (d.meta.tags as string[]) : []), id].join(' ')
    const pontos = pontosDe(q, indice.nome(id), corpo)
    if (pontos) out.push({ id, titulo: indice.nome(id), sub: subtituloDe(d, curto), pasta: pastaDe(d), pontos })
  }
  out.sort((a, b) => b.pontos - a.pontos || a.titulo.localeCompare(b.titulo))
  return out.slice(0, limite)
}
