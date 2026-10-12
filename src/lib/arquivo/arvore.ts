// A árvore da estrutura nova (docs/arquitetura.md), já lida: os documentos de mundo/, plano/, registo/ e mesa/,
// o livro (livro/**.json) e a grelha (grelha/*.json). Pura: a app recebe-a do pacote do build; os scripts lêem-na do disco.
import type { Doc } from './md.ts'
import { PASTAS } from './esquema.ts'

export interface DocArvore extends Doc {
  caminho: string
  /** documento de prosa (sem cabeçalho), como mundo/lore.md ou mesa/regras.md */
  prosa: boolean
}

export interface Grelha {
  linhas: unknown
  dm: unknown
  revisao: unknown
  /** o token cifrado com a palavra-passe da mesa (src/lib/acesso.ts) */
  acesso?: unknown
}

export interface Arvore {
  docs: DocArvore[]
  /** livro/<rel> → conteúdo JSON */
  livro: Record<string, unknown>
  grelha: Grelha
}

export const naPasta = (a: Arvore, pasta: string): DocArvore[] => a.docs.filter((d) => d.caminho.startsWith(pasta + '/'))

export const comId = (a: Arvore, id: string): DocArvore | undefined => a.docs.find((d) => d.meta.id === id)

export function porPasta(a: Arvore) {
  const sessoes = naPasta(a, PASTAS.sessoes).sort((x, y) => Number(x.meta.n ?? 0) - Number(y.meta.n ?? 0))
  return {
    personagens: naPasta(a, PASTAS.personagens),
    facoes: naPasta(a, PASTAS.facoes),
    locais: naPasta(a, PASTAS.locais),
    itens: naPasta(a, PASTAS.itens),
    segredos: naPasta(a, PASTAS.segredos),
    beats: naPasta(a, PASTAS.beats),
    fios: [...naPasta(a, PASTAS.fios), ...naPasta(a, PASTAS.mesaFios)],
    jogadores: naPasta(a, PASTAS.jogadores),
    sessoes,
    campanha: a.docs.find((d) => d.caminho === 'plano/campanha.md'),
  }
}
