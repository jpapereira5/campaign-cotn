// Estado da app (docs/arquitetura.md, secção 8): a árvore do build, o que se calcula dela (o estado, o índice das
// fichas, a campanha) e a Grelha com a camada do DM por cima. A UI: a vista, a ficha aberta, a gaveta de edição.
// A app não edita o cânone: só a camada do DM, em grelha/dm.json (src/lib/grelha/store.svelte.ts).
import { arvore } from './data.ts'
import { calcularEstado, type Estado } from './estado.ts'
import { Indice } from './ficha.ts'
import { Campanha } from './campanha.ts'
import { tiposDeLinha } from './grelha/modelo.ts'
import { tipoLinhaDe } from './grelha/dona.ts'
import { camada } from './grelha/store.svelte.ts'
import { grelhaViva, type GrelhaViva } from './grelha/viva.ts'
import { filtrosPorDefeito, type FiltrosGrafo } from './grafo.ts'

export type View = 'grelha' | 'grafo' | 'sessao' | 'batalha' | 'indice' | 'definicoes' | 'ficha'
export const VIEWS: View[] = ['grelha', 'grafo', 'sessao', 'batalha', 'indice', 'definicoes', 'ficha']

export type Edicao =
  | { modo: 'celula'; linha: string; col: string }
  | { modo: 'cabecalho'; linha: string }
  | { modo: 'nota'; linha?: string; col?: string }
  | { modo: 'nova-linha' }
  | { modo: 'acompanhar' }

export type { GrelhaViva } from './grelha/viva.ts'

// O que se calcula da árvore, uma vez: a árvore só muda com o deploy.
const estadoD: Estado = calcularEstado(arvore)
const indiceD: Indice = new Indice(arvore)
const campanhaD: Campanha = new Campanha(arvore)
const tipoLinhaD = tipoLinhaDe(tiposDeLinha(arvore))

export const ui = $state({
  view: 'grelha' as View,
  searchOpen: false,
  sidebarCollapsed: false,
  helpOpen: false,
  /** Ficha aberta (vista «ficha»): a id do documento. */
  fichaId: null as string | null,
  /** Gaveta de edição da Grelha (camada do DM). */
  edicao: null as Edicao | null,
  /** Grafo de relações: filtros, capítulo escolhido e nó em foco. */
  filtros: filtrosPorDefeito() as FiltrosGrafo,
  capituloGrafo: campanhaD.capituloAtual,
  focoGrafo: null as string | null,
})

// A Grelha: a camada automática (registo + cânone) com a camada do DM por cima; refaz-se quando dm/revisao/linhas mudam.
const grelhaD = $derived.by((): GrelhaViva => grelhaViva(arvore, estadoD, indiceD, campanhaD, { dm: camada.dm, revisao: camada.revisao, linhas: camada.linhas }, tipoLinhaD))

/** Acesso ao estado derivado (Svelte não permite exportar $derived diretamente). */
export const world = {
  get estado(): Estado {
    return estadoD
  },
  get indice(): Indice {
    return indiceD
  },
  get campanha(): Campanha {
    return campanhaD
  },
  get grelha(): GrelhaViva {
    return grelhaD
  },
  get arvore() {
    return arvore
  },
  get tipoLinha() {
    return tipoLinhaD
  },
}

/** Nome curto de um capítulo para pílulas: «Prólogo», «1», «2»… */
export function chapterShort(id: string): string {
  return campanhaD.curto(id)
}
export function chapterName(id: string): string {
  return campanhaD.nomeCapitulo(id)
}

// ---- navegação -------------------------------------------------------------

export function abrirEdicao(e: Edicao): void {
  ui.edicao = e
}
export function fecharEdicao(): void {
  ui.edicao = null
}
/** Esc: fecha o que estiver aberto por cima da vista. */
export function fecharPaineis(): void {
  ui.edicao = null
  ui.searchOpen = false
}
export function setView(v: View): void {
  ui.view = v
  const alvo = v === 'ficha' && ui.fichaId ? `#/ficha/${ui.fichaId}` : `#/${v}`
  if (location.hash !== alvo) history.pushState(null, '', alvo)
}
/** Abre a ficha de uma coisa (qualquer documento com id, sessões incluídas). */
export function abrirFicha(id: string): void {
  ui.fichaId = id
  ui.edicao = null
  ui.searchOpen = false
  setView('ficha')
}
function readHash(): void {
  const h = location.hash.replace(/^#\/?/, '')
  const f = h.match(/^ficha\/([a-z0-9-]+)$/)
  if (f) {
    ui.fichaId = f[1]
    ui.view = 'ficha'
    return
  }
  const v = h as View
  if (VIEWS.includes(v) && v !== 'ficha') ui.view = v
}
if (typeof window !== 'undefined') {
  readHash()
  window.addEventListener('hashchange', readHash)
}
