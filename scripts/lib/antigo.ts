// Leitura da estrutura antiga (data/book, data/campaign, data/state.json), com registo de onde veio cada coisa.
// Junta as camadas exatamente como a app (mergeLayers + normalizeCanon).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { normalizeCanon, type RawCanon } from '../../src/lib/validate.ts'
import { COLLECTIONS, type Canon, type PlayState } from '../../src/lib/types.ts'
import { emptyRaw, mergeLayers, type LayerInfo } from '../../src/lib/layers.ts'
import { LIVRO } from '../../src/lib/arquivo/esquema.ts'

export interface Antigo {
  raiz: string
  book: RawCanon
  campaign: RawCanon
  canon: Canon
  layers: LayerInfo
  state: PlayState
  /** `${coleção}/${id}` → tokens de origem, por ordem (livro primeiro) */
  origens: Map<string, string[]>
  /** chave da relação (como no dedupe da app) → token de origem da primeira ocorrência */
  relOrigem: Map<string, string>
  /** caminho relativo → conteúdo, para todos os data/**.json */
  ficheiros: Record<string, unknown>
}

export const chaveRel = (r: Record<string, unknown>): string =>
  `${r.from ?? ''}|${r.to ?? ''}|${r.type ?? ''}|${r.fromBeat ?? ''}|${r.untilBeat ?? ''}|${r.condition ?? ''}`

export function tokenDeOrigem(caminho: string): string {
  if (caminho.startsWith('data/book/')) return LIVRO
  const base = caminho.split('/').pop() ?? caminho
  return base.replace(/\.json$/, '')
}

function rj(p: string): unknown {
  return JSON.parse(readFileSync(p, 'utf8'))
}

function listar(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) out.push(...listar(p))
    else if (f.endsWith('.json')) out.push(p)
  }
  return out
}

/** Monta uma camada (book ou campaign) a partir de um mapa caminho → conteúdo, como a app faz em rawOfLayer. */
export function camadaDeFicheiros(ficheiros: Record<string, unknown>, layer: 'book' | 'campaign'): RawCanon {
  const raw = emptyRaw()
  const base = `data/${layer}/`
  for (const caminho of Object.keys(ficheiros).sort()) {
    if (!caminho.startsWith(base)) continue
    const resto = caminho.slice(base.length)
    const conteudo = ficheiros[caminho]
    if (resto === 'campaign.json') {
      raw.campaign = conteudo
      continue
    }
    const col = resto === 'arcs.json' ? 'arcs' : resto.split('/')[0]
    if (!(COLLECTIONS as string[]).includes(col) || !Array.isArray(conteudo)) continue
    raw[col as (typeof COLLECTIONS)[number]].push(...conteudo)
  }
  return raw
}

/** Cânone normalizado a partir de um mapa de ficheiros antigos (as duas camadas). */
export function canonDeFicheiros(ficheiros: Record<string, unknown>): { canon: Canon; layers: LayerInfo; problems: ReturnType<typeof normalizeCanon>['problems'] } {
  const { raw, layers } = mergeLayers(camadaDeFicheiros(ficheiros, 'book'), camadaDeFicheiros(ficheiros, 'campaign'))
  const { canon, problems } = normalizeCanon(raw)
  return { canon, layers, problems }
}

export function lerAntigo(raiz: string): Antigo {
  const dataDir = join(raiz, 'data')
  const ficheiros: Record<string, unknown> = {}
  for (const p of listar(dataDir)) ficheiros[relative(raiz, p)] = rj(p)

  const origens = new Map<string, string[]>()
  const relOrigem = new Map<string, string>()
  const camada = (layer: 'book' | 'campaign'): RawCanon => {
    const raw = emptyRaw()
    const base = `data/${layer}/`
    for (const caminho of Object.keys(ficheiros).sort()) {
      if (!caminho.startsWith(base)) continue
      const resto = caminho.slice(base.length)
      const conteudo = ficheiros[caminho]
      const token = tokenDeOrigem(caminho)
      if (resto === 'campaign.json') {
        raw.campaign = conteudo
        continue
      }
      const col = resto === 'arcs.json' ? 'arcs' : resto.split('/')[0]
      if (!(COLLECTIONS as string[]).includes(col) || !Array.isArray(conteudo)) continue
      raw[col as (typeof COLLECTIONS)[number]].push(...conteudo)
      for (const item of conteudo as Record<string, unknown>[]) {
        if (col === 'relations') {
          const k = chaveRel(item)
          if (!relOrigem.has(k)) relOrigem.set(k, token)
        } else if (typeof item.id === 'string') {
          const k = `${col}/${item.id}`
          const lista = origens.get(k) ?? []
          if (!lista.includes(token)) lista.push(token)
          origens.set(k, lista)
        }
      }
    }
    return raw
  }
  const book = camada('book')
  const campaign = camada('campaign')
  const { raw, layers } = mergeLayers(book, campaign)
  const { canon } = normalizeCanon(raw)
  const state = ficheiros['data/state.json'] as PlayState
  return { raiz, book, campaign, canon, layers, state, origens, relOrigem, ficheiros }
}
