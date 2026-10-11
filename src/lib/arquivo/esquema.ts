// O esquema da estrutura nova (docs/arquitetura.md, secção 4): as pastas, o prefixo de cada id e a origem.
// Puro: usado pela app e pelos scripts. Os campos de cada tipo de ficheiro estão descritos na arquitetura; a
// validação está em scripts/lib/validar-arvore.ts.

export const LIVRO = 'livro'

export const PASTAS = {
  personagens: 'mundo/personagens',
  facoes: 'mundo/facoes',
  locais: 'mundo/locais',
  itens: 'mundo/itens',
  segredos: 'mundo/segredos',
  beats: 'plano/beats',
  fios: 'plano/fios',
  mesaFios: 'mesa/fios',
  jogadores: 'mesa/jogadores',
  sessoes: 'registo/sessoes',
} as const

export const TIPOS_FIO_MESA = ['teoria', 'mesa']

/** Pasta de uma id pelo prefixo; os fios de mesa (teoria, mesa) vão para mesa/fios. */
export function pastaDeId(id: string, tipo?: string): string {
  if (id.startsWith('c-')) return PASTAS.personagens
  if (id.startsWith('f-')) return PASTAS.facoes
  if (id.startsWith('l-')) return PASTAS.locais
  if (id.startsWith('i-')) return PASTAS.itens
  if (id.startsWith('r-')) return PASTAS.segredos
  if (id.startsWith('b-')) return PASTAS.beats
  if (id.startsWith('p-')) return PASTAS.jogadores
  if (id.startsWith('a-') || id.startsWith('amb-') || id.startsWith('t-')) return tipo && TIPOS_FIO_MESA.includes(tipo) ? PASTAS.mesaFios : PASTAS.fios
  throw new Error(`id sem pasta: ${id}`)
}

export const ORIGEM_LIVRO = [LIVRO]
export const eDoLivroApenas = (origem: unknown): boolean => Array.isArray(origem) && origem.length === 1 && origem[0] === LIVRO
export const temOrigemCampanha = (origem: unknown): boolean => Array.isArray(origem) && origem.some((o) => o !== LIVRO)

/** Uma relação no cabeçalho de uma personagem ou fação. */
export interface Relacao {
  com: string
  tipo: string
  nota?: string
  /** beat em que começa */
  desde?: string
  /** beat em que acaba */
  ate?: string
  /** condição, em texto */
  se?: string
  origem: string
}

/** Os beats marcados como jogados no cabeçalho das sessões, por ordem, sem repetições. */
export function beatsJogados(docs: { meta: Record<string, unknown> }[]): string[] {
  const out: string[] = []
  for (const d of docs) {
    const b = (d.meta.beats ?? {}) as Record<string, string>
    for (const [id, estado] of Object.entries(b)) if (estado === 'jogado' && !out.includes(id)) out.push(id)
  }
  return out
}
