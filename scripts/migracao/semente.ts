// Converte as células do mockup (docs/grelha-semente.json) em acontecimentos das sessões 1 a 5
// e em ideias (células de colunas futuras). Regras em docs/arquitetura.md, secção 10, e docs/grelha.md, fase 1.
// Tudo o que sai daqui é uma primeira versão, para o DM rever.

export interface CelulaSemente {
  estado: string
  texto: string
  tags?: string[]
  pistas?: number
}
export interface LinhaSemente {
  tipo: string
  nome: string
  sub?: string
  atitude?: string
  flags?: string[]
  quer?: string
  teme?: string
  sabe?: string
  badges?: string[]
  pcs?: string[]
  celulas: Record<string, CelulaSemente>
}
export interface Semente {
  linhas: LinhaSemente[]
}
export interface Mapa {
  [nome: string]: { id?: string; tipo?: string; calculada?: string; novo?: Record<string, unknown> }
}
export interface Ajuste {
  tipo?: string
  efeitos?: Record<string, unknown>[]
  origem?: string[]
  fechado?: boolean
  pagoPor?: string[]
  excluir?: string[]
}
export type Ajustes = Record<string, Ajuste>

export interface Acontecimento {
  id: string
  tipo: string
  texto: string
  envolve: string[]
  origem?: string[]
  efeitos?: Record<string, unknown>[]
  tags?: string[]
  fechado?: boolean
  fonte: string
}

export interface Ideia {
  linha: string
  col: string
  texto: string
  tags?: string[]
  tipo: string
}

/** Nomes com que as células referem as coisas: para preencher «envolve». Maiúscula = nome próprio (sensível a maiúsculas). */
const ALIAS: Record<string, string[]> = {
  'c-pc-lucan': ['Lucan'],
  'c-pc-isco': ['Isco'],
  'c-pc-quasi': ['Quasi'],
  'c-pc-lia': ['Lia'],
  'c-buhfal': ['Bufal'],
  'c-jevan': ['Jevan'],
  'c-azrok': ['Azrok'],
  'c-litcha-das-cinzas': ['Litcha'],
  'c-morgid': ['Morgid'],
  'c-alberto-gnomis': ['Alberto'],
  'c-corvelo': ['Corvelo', 'sargento'],
  'c-lampreia': ['Sousela'],
  'c-elmiro-trigueiro': ['Elmiro'],
  'c-damiao-prestes': ['Damião', 'escriba'],
  'c-soldado-doente': ['Alex'],
  'c-bolbara': ['Bolbara'],
  'c-pellinost': ['Perestrelo', 'padre'],
  'c-alonne-frith': ['Fritz'],
  'c-yussa-errenis': ['Yussa'],
  'c-durth-mirimm': ['Mirim'],
  'c-skra-sorsk': ["Skr'a"],
  'c-trush': ['Truche'],
  'c-baeshra': ['Baeshra'],
  'c-sessinek': ["Sess'inek"],
  'c-lizardfolk-do-ossario': ['lizardfolk'],
  'f-dwendalian-empire': ['Império', 'imperial', 'imperiais'],
  'f-kryn': ['Kryn', 'Dinastia'],
  'f-myriad': ['Miríade'],
  'f-cerberus-assembly': ['Assembleia'],
  'f-cobalt-soul': ['Alma de Cobalto'],
  'i-adaga-drow': ['adaga'],
  'i-garra-seis-dedos': ['garra'],
  'i-mapa-do-morgid': ['mapa'],
  'i-livro-de-registos': ['livro'],
  'i-saco-da-lia': ['saco'],
  'i-amuletos-do-trono': ['amuletos'],
  'l-urzin': ['Urzin'],
  'l-sunken-boneyard': ['ossário', 'Cemitério Afundado'],
  'l-ritual-stone': ['obelisco', 'pedra'],
  'l-fort-venture': ['forte', 'Forte Ventura'],
  'l-brokenveil-bluffs': ['falésias'],
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function mencoes(texto: string, excluir: Set<string>): string[] {
  const achados: { id: string; pos: number }[] = []
  for (const [id, nomes] of Object.entries(ALIAS)) {
    if (excluir.has(id)) continue
    let melhor = -1
    for (const n of nomes) {
      const re = new RegExp(`(^|[^\\p{L}])${escapar(n)}(?=$|[^\\p{L}])`, /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(n) ? 'u' : 'iu')
      const m = re.exec(texto)
      if (m && (melhor < 0 || m.index < melhor)) melhor = m.index
    }
    if (melhor >= 0) achados.push({ id, pos: melhor })
  }
  return achados.sort((a, b) => a.pos - b.pos).map((a) => a.id)
}

function tipoDe(linha: LinhaSemente, celula: CelulaSemente): string {
  if (celula.estado === 'pista') return 'pista'
  if (linha.tipo === 'pc') return 'cena'
  if (linha.tipo === 'laco') return 'relacao'
  if (linha.tipo === 'promessa') return 'promessa'
  if (linha.tipo === 'decisao') return 'escolha'
  if (celula.estado === 'registo') return linha.tipo === 'item' ? 'estado' : 'registo'
  if (celula.estado === 'fechado') return 'estado'
  return 'consequencia'
}

export function idDaLinha(mapa: Mapa, nome: string): string | null {
  const m = mapa[nome]
  if (!m) throw new Error(`linha sem mapa: ${nome}`)
  return m.id ?? null
}

/** Acontecimentos por sessão (1..5), com ids e-sN-NN. */
export function gerarAcontecimentos(semente: Semente, mapa: Mapa, ajustes: Ajustes): Map<number, Acontecimento[]> {
  const porSessao = new Map<number, Acontecimento[]>()
  const porChave = new Map<string, Acontecimento>()
  const pendentesOrigem: { ev: Acontecimento; refs: string[] }[] = []
  const pendentesPago: { chave: string; pagadores: string[] }[] = []

  for (let n = 1; n <= 5; n++) {
    const col = `s${n}`
    const lista: Acontecimento[] = []
    for (const linha of semente.linhas) {
      const celula = linha.celulas[col]
      if (!celula) continue
      const id = idDaLinha(mapa, linha.nome)
      if (!id) continue // linhas calculadas (dia, nível, resumo, onde parou) vão para o cabeçalho
      const chave = `${linha.nome}|${col}`
      const ajuste = ajustes[chave] ?? {}
      const excluir = new Set([id, ...(ajuste.excluir ?? [])])
      const setas = [...celula.texto.matchAll(/\s*\(← S(\d)\)/g)]
      const texto = celula.texto.replace(/\s*\(← S\d\)/g, '').trim()
      const ev: Acontecimento = {
        id: `e-s${n}-${String(lista.length + 1).padStart(2, '0')}`,
        tipo: ajuste.tipo ?? tipoDe(linha, celula),
        texto,
        envolve: [id, ...mencoes(texto, excluir)],
        fonte: 'docs/grelha-semente.json',
      }
      const tags = (celula.tags ?? []).filter((t) => ['so-dm', 'ultima', 'trunfo'].includes(t))
      if (tags.length) ev.tags = tags
      const efeitos: Record<string, unknown>[] = []
      if (celula.estado === 'pista') for (let i = 0; i < (celula.pistas ?? 1); i++) efeitos.push({ pista: id })
      if (ajuste.efeitos) efeitos.push(...ajuste.efeitos)
      if (efeitos.length) ev.efeitos = efeitos
      if (celula.estado === 'fechado' || ajuste.fechado) ev.fechado = true
      const refs = [...setas.map((m) => `${linha.nome}|s${m[1]}`), ...(ajuste.origem ?? [])]
      if (refs.length) pendentesOrigem.push({ ev, refs })
      if (ajuste.pagoPor) pendentesPago.push({ chave, pagadores: ajuste.pagoPor })
      // uma célula «pago» com seta foi quem pagou: fecha o fio
      if (celula.estado === 'pago' && setas.length) ev.fechado = true
      porChave.set(chave, ev)
      lista.push(ev)
    }
    porSessao.set(n, lista)
  }
  for (const { ev, refs } of pendentesOrigem) {
    const ids = refs.map((r) => porChave.get(r)?.id).filter((x): x is string => !!x)
    if (ids.length !== refs.length) throw new Error(`origem sem alvo em ${ev.id}: ${refs.join(', ')}`)
    ev.origem = [...new Set([...(ev.origem ?? []), ...ids])]
  }
  for (const { chave, pagadores } of pendentesPago) {
    const alvo = porChave.get(chave)
    if (!alvo) throw new Error(`pagoPor sem alvo: ${chave}`)
    for (const p of pagadores) {
      const pagador = porChave.get(p)
      if (!pagador) throw new Error(`pagador sem célula: ${p}`)
      pagador.origem = [...new Set([...(pagador.origem ?? []), alvo.id])]
    }
  }
  return porSessao
}

/** Células das colunas futuras (s6, ch0…ch7): ideias para grelha/revisao.json. */
export function gerarIdeias(semente: Semente, mapa: Mapa): Ideia[] {
  const out: Ideia[] = []
  for (const linha of semente.linhas) {
    const id = idDaLinha(mapa, linha.nome)
    if (!id) continue
    for (const [col, celula] of Object.entries(linha.celulas)) {
      if (/^s[1-5]$/.test(col)) continue
      if (celula.estado === 'registo') continue // «Nível do grupo» e «Resumo» dos capítulos vêm do cânone
      if (celula.estado === 'falta' && /sem cena pessoal/i.test(celula.texto)) continue // calculado pela Grelha
      out.push({ linha: id, col, texto: celula.texto, tags: celula.tags, tipo: linha.tipo })
    }
  }
  return out
}

/** Cabeçalho das sessões a partir das linhas calculadas do mockup. */
export function cabecalhosDaSemente(semente: Semente, mapa: Mapa): Map<number, Record<string, string>> {
  const out = new Map<number, Record<string, string>>()
  for (const linha of semente.linhas) {
    const campo = mapa[linha.nome]?.calculada
    if (!campo) continue
    for (const [col, celula] of Object.entries(linha.celulas)) {
      const m = col.match(/^s([1-5])$/)
      if (!m) continue
      const n = Number(m[1])
      const h = out.get(n) ?? {}
      h[campo] = celula.texto
      out.set(n, h)
    }
  }
  return out
}
