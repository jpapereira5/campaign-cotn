// Adaptador: da estrutura nova para os ficheiros que a app atual conhece (data/book, data/campaign, data/state.json).
// O livro vem de livro/ tal como está; a camada campaign são as entidades com origem fora do livro, inteiras.
// Juntas pela app (mergeLayers) dão exatamente o cânone de hoje — é o que verificar-migracao.ts confirma.
import type { PlayState } from '../../src/lib/types.ts'
import {
  docParaAmbicao, docParaArco, docParaBeat, docParaCampanha, docParaFacao, docParaLocal, docParaPersonagem, docParaSegredo,
  docParaSessaoAntiga, beatsJogados, temOrigemCampanha, LIVRO,
} from './esquema.ts'
import { porPasta, type Arvore, type DocArvore } from './arvore.ts'

export interface Adaptado {
  ficheiros: Record<string, unknown>
  state: PlayState
}

const origemDe = (d: DocArvore): string[] => (Array.isArray(d.meta.origem) ? (d.meta.origem as string[]) : [])

export function adaptarParaAntigo(a: Arvore): Adaptado {
  const p = porPasta(a)
  const ficheiros: Record<string, unknown> = {}
  for (const [rel, conteudo] of Object.entries(a.livro)) ficheiros[`data/book/${rel}`] = conteudo

  const relacoes: Record<string, unknown>[] = []
  const guardaRelacoes = (d: DocArvore, rels: Record<string, unknown>[]) => {
    const metaRels = Array.isArray(d.meta.relacoes) ? (d.meta.relacoes as Record<string, unknown>[]) : []
    rels.forEach((r, i) => {
      if (metaRels[i]?.origem !== LIVRO) relacoes.push(r)
    })
  }

  const personagens: unknown[] = []
  for (const d of p.personagens) {
    const { entidade, relacoes: rels } = docParaPersonagem(d)
    guardaRelacoes(d, rels)
    if (temOrigemCampanha(origemDe(d))) personagens.push(entidade)
  }

  const frentes = new Map<string, { chapter: string; text: string }[]>()
  for (const d of p.fios) {
    if (d.meta.tipo !== 'frente') continue
    const passos = Array.isArray(d.meta.passos) ? (d.meta.passos as Record<string, unknown>[]) : []
    frentes.set(String(d.meta.facao), passos.map((x) => ({ chapter: String(x.capitulo ?? ''), text: String(x.texto ?? '') })))
  }
  const facoes: unknown[] = []
  for (const d of p.facoes) {
    const { entidade, relacoes: rels } = docParaFacao(d, frentes.get(String(d.meta.id)) ?? [])
    guardaRelacoes(d, rels)
    if (temOrigemCampanha(origemDe(d))) facoes.push(entidade)
  }

  const locais = p.locais.filter((d) => temOrigemCampanha(origemDe(d))).map(docParaLocal)
  const segredos = p.segredos.filter((d) => temOrigemCampanha(origemDe(d))).map(docParaSegredo)
  const beats = p.beats.filter((d) => temOrigemCampanha(origemDe(d))).map(docParaBeat)
  const arcos = p.fios.filter((d) => d.meta.tipo === 'arco' && temOrigemCampanha(origemDe(d))).map(docParaArco)
  const ambicoes = p.fios.filter((d) => d.meta.tipo === 'ambicao' && temOrigemCampanha(origemDe(d))).map(docParaAmbicao)

  if (!p.campanha) throw new Error('falta plano/campanha.md')
  const { campaign, capituloAtual } = docParaCampanha(p.campanha)

  ficheiros['data/campaign/campaign.json'] = campaign
  if (arcos.length) ficheiros['data/campaign/arcs.json'] = arcos
  if (personagens.length) ficheiros['data/campaign/characters/migrado.json'] = personagens
  if (facoes.length) ficheiros['data/campaign/factions/migrado.json'] = facoes
  if (locais.length) ficheiros['data/campaign/locations/migrado.json'] = locais
  if (segredos.length) ficheiros['data/campaign/revelations/migrado.json'] = segredos
  if (beats.length) ficheiros['data/campaign/beats/migrado.json'] = beats
  if (ambicoes.length) ficheiros['data/campaign/ambitions/migrado.json'] = ambicoes
  if (relacoes.length) ficheiros['data/campaign/relations/migrado.json'] = relacoes

  const jogadas = p.sessoes.filter((d) => Number(d.meta.n ?? 0) >= 1)
  const state: PlayState = {
    version: 1,
    playedBeats: beatsJogados(jogadas),
    revealed: [],
    portentsDone: [],
    attitudes: {},
    flags: {},
    notes: {},
    sessions: jogadas.map(docParaSessaoAntiga),
    currentChapter: capituloAtual,
  }
  ficheiros['data/state.json'] = state
  return { ficheiros, state }
}
