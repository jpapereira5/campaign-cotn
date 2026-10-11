// A linha dona de um acontecimento (docs/grelha.md, secção 7). Pura: usada pela app e pelos scripts.
// Nunca se guarda: calcula-se a partir do tipo e de «envolve».

export type TipoAcontecimento = 'relacao' | 'promessa' | 'escolha' | 'consequencia' | 'pista' | 'cena' | 'estado' | 'registo'
export const TIPOS_ACONTECIMENTO: TipoAcontecimento[] = ['relacao', 'promessa', 'escolha', 'consequencia', 'pista', 'cena', 'estado', 'registo']

/** Tipo de cada linha (entidade ou fio), pelo id. */
export type TipoLinha = (id: string) => string | undefined

const UNICA: Partial<Record<TipoAcontecimento, string>> = {
  relacao: 'laco',
  promessa: 'promessa',
  escolha: 'decisao',
  pista: 'segredo',
}

/**
 * relacao → o único laço; promessa → a única promessa; escolha → a única decisão; pista → o único segredo;
 * cena → o primeiro PC; consequencia, estado, registo → envolve[0]. Devolve null quando a regra não decide.
 */
export function donaDe(tipo: string, envolve: string[], tipoLinha: TipoLinha): string | null {
  if (!envolve.length) return null
  const alvo = UNICA[tipo as TipoAcontecimento]
  if (alvo) {
    const candidatos = envolve.filter((id) => tipoLinha(id) === alvo)
    return candidatos.length === 1 ? candidatos[0] : null
  }
  if (tipo === 'cena') return envolve.find((id) => tipoLinha(id) === 'pc') ?? null
  return envolve[0]
}

/** Tipo de linha de um id pelo prefixo, com os fios e as personagens a dizerem o seu tipo. */
export function tipoLinhaDe(tipos: Map<string, string>): TipoLinha {
  return (id) => {
    const t = tipos.get(id)
    if (t) return t
    if (id.startsWith('r-')) return 'segredo'
    if (id.startsWith('f-')) return 'facao'
    if (id.startsWith('l-')) return 'local'
    if (id.startsWith('i-')) return 'item'
    if (id.startsWith('b-')) return 'beat'
    if (id.startsWith('p-')) return 'jogador'
    return undefined
  }
}
