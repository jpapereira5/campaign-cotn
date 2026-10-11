// Validação da estrutura nova (docs/arquitetura.md): ids e referências entre ficheiros (personagens, fações, locais,
// relações, beats, segredos, fios), sessões e acontecimentos (tipos, dona, origem, efeitos) e grelha/.
// Os erros param o deploy; os avisos são sugestões (regra das três pistas, personagens sem beats…).
import { donaDe, TIPOS_ACONTECIMENTO, tipoLinhaDe } from '../../src/lib/grelha/dona.ts'
import { porPasta, type Arvore, type DocArvore } from './arvore.ts'
import { PASTAS } from '../../src/lib/arquivo/esquema.ts'

export interface Problem {
  level: 'error' | 'warn'
  where: string
  message: string
}

const ID_RE = /^[a-z0-9][a-z0-9-]*$/
const TIPOS_FIO = ['arco', 'ambicao', 'frente', 'relogio', 'missao', 'promessa', 'decisao', 'gatilho', 'semente', 'desfecho', 'laco', 'agenda', 'teoria', 'mesa']
const ESTADOS_BEAT = ['jogado', 'em-curso', 'saltado']
const EFEITOS = ['estado', 'atitude', 'posse', 'sabe', 'pista', 'relogio', 'fio', 'relacao', 'contador']

const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

export function validarArvore(a: Arvore): Problem[] {
  const out: Problem[] = []
  const err = (where: string, message: string) => out.push({ level: 'error', where, message })
  const warn = (where: string, message: string) => out.push({ level: 'warn', where, message })
  const p = porPasta(a)

  // ids: únicas, válidas, iguais ao nome do ficheiro
  const ids = new Map<string, DocArvore>()
  const tipos = new Map<string, string>()
  for (const d of a.docs) {
    if (d.caminho === 'plano/campanha.md' || d.prosa) continue
    const id = typeof d.meta.id === 'string' ? d.meta.id : ''
    if (!id) {
      err(d.caminho, 'sem id')
      continue
    }
    if (!ID_RE.test(id)) err(d.caminho, `id inválido: ${id}`)
    if (ids.has(id)) err(d.caminho, `id repetida: ${id} (também em ${ids.get(id)!.caminho})`)
    ids.set(id, d)
    const nome = d.caminho.split('/').pop()!.replace(/\.md$/, '')
    if (!d.caminho.startsWith(PASTAS.sessoes) && nome !== id) err(d.caminho, `o nome do ficheiro não é a id (${id})`)
    if (d.caminho.startsWith(PASTAS.personagens)) tipos.set(id, String(d.meta.tipo ?? 'npc'))
    else if (d.caminho.startsWith(PASTAS.fios) || d.caminho.startsWith(PASTAS.mesaFios)) tipos.set(id, String(d.meta.tipo ?? ''))
  }
  const tipoLinha = tipoLinhaDe(tipos)
  const existe = (id: string) => ids.has(id)
  const ref = (where: string, id: unknown, oQue: string) => {
    if (typeof id === 'string' && id && id !== 'mesa' && !existe(id)) err(where, `${oQue} desconhecido: ${id}`)
  }
  const refs = (where: string, l: unknown, oQue: string) => {
    for (const id of lista(l)) ref(where, id, oQue)
  }

  // a campanha e os capítulos
  const capitulos = Array.isArray(p.campanha?.meta.capitulos) ? (p.campanha!.meta.capitulos as Record<string, unknown>[]).map((c) => String(c.id ?? '')) : []
  const iCap = new Map(capitulos.map((c, i) => [c, i]))
  if (!p.campanha) err('plano/campanha.md', 'falta o ficheiro da campanha')
  else {
    if (!capitulos.length) err('plano/campanha.md', 'sem capítulos')
    if (typeof p.campanha.meta.capituloAtual === 'string' && !iCap.has(p.campanha.meta.capituloAtual)) err('plano/campanha.md', `capituloAtual desconhecido: ${String(p.campanha.meta.capituloAtual)}`)
    if (!p.campanha.meta.convergencia) warn('plano/campanha.md', 'sem beat de convergência')
    else ref('plano/campanha.md', p.campanha.meta.convergencia, 'beat de convergência')
  }
  const cap = (where: string, id: unknown, oQue = 'capítulo') => {
    if (typeof id === 'string' && id && !iCap.has(id)) err(where, `${oQue} desconhecido: ${id}`)
  }
  const caps = (where: string, l: unknown) => {
    for (const id of lista(l)) cap(where, id)
  }
  const pcs = new Set(p.personagens.filter((d) => d.meta.tipo === 'pc').map((d) => String(d.meta.id)))
  const facoes = new Set(p.facoes.map((d) => String(d.meta.id)))
  const beatPorId = new Map(p.beats.map((d) => [String(d.meta.id), d]))
  const posicaoBeat = (id: string): number => {
    const b = beatPorId.get(id)
    if (!b) return -1
    return (iCap.get(String(b.meta.capitulo ?? '')) ?? 99) * 1000 + Number(b.meta.ordem ?? 0)
  }

  // personagens
  const nosBeats = new Set(p.beats.flatMap((b) => lista(b.meta.participantes)))
  for (const d of p.personagens) {
    const tipo = String(d.meta.tipo ?? 'npc')
    if (!['pc', 'npc', 'rival', 'deity'].includes(tipo)) err(d.caminho, `tipo de personagem desconhecido: ${tipo}`)
    for (const f of lista(d.meta.facoes)) if (!facoes.has(f)) err(d.caminho, `fação desconhecida: ${f}`)
    ref(d.caminho, d.meta.casa, 'local (casa)')
    caps(d.caminho, d.meta.capitulos)
    for (const e of Array.isArray(d.meta.estados) ? (d.meta.estados as Record<string, unknown>[]) : []) ref(d.caminho, e.desde, 'beat em estados')
    if (!nosBeats.has(String(d.meta.id)) && tipo !== 'deity' && tipo !== 'pc') warn(d.caminho, 'não participa em nenhum beat')
  }

  // fações
  for (const d of p.facoes) {
    refs(d.caminho, d.meta.lideres, 'personagem em lideres')
    for (const f of [...lista(d.meta.aliados), ...lista(d.meta.inimigos)]) if (!facoes.has(f)) err(d.caminho, `fação desconhecida: ${f}`)
  }

  // locais: dentro de (pai), capítulo, ciclos
  const localPorId = new Map(p.locais.map((d) => [String(d.meta.id), d]))
  for (const d of p.locais) {
    ref(d.caminho, d.meta.pai, 'local (pai)')
    cap(d.caminho, d.meta.capitulo)
    const vistos = new Set<string>()
    let cur: DocArvore | undefined = d
    while (cur && typeof cur.meta.pai === 'string') {
      const id = String(cur.meta.id)
      if (vistos.has(id)) {
        err(d.caminho, 'ciclo em pai')
        break
      }
      vistos.add(id)
      cur = localPorId.get(cur.meta.pai)
    }
  }

  // relações no cabeçalho de personagens e fações
  const nosRel = new Set([...p.personagens, ...p.facoes].map((d) => String(d.meta.id)))
  for (const d of [...p.personagens, ...p.facoes]) {
    const de = String(d.meta.id)
    const vistasRel = new Set<string>()
    for (const r of Array.isArray(d.meta.relacoes) ? (d.meta.relacoes as Record<string, unknown>[]) : []) {
      const com = String(r.com ?? '')
      const where = `${d.caminho} › ${de}→${com}`
      if (!nosRel.has(com)) err(where, `destino desconhecido: ${com}`)
      if (com === de) err(where, 'relação consigo próprio')
      if (!r.tipo) err(where, 'relação sem tipo')
      if (r.tipo === 'memberOf' && !facoes.has(com)) err(where, 'memberOf tem de apontar para uma fação')
      ref(where, r.desde, 'beat (desde)')
      ref(where, r.ate, 'beat (ate)')
      if (typeof r.desde === 'string' && typeof r.ate === 'string' && beatPorId.has(r.desde) && beatPorId.has(r.ate) && posicaoBeat(r.ate) <= posicaoBeat(r.desde)) err(where, 'ate não é posterior a desde')
      const chave = `${com}|${String(r.tipo)}|${String(r.desde ?? '')}`
      if (vistasRel.has(chave)) warn(where, `relação repetida (${String(r.tipo)})`)
      vistasRel.add(chave)
    }
  }

  // beats
  const arcos = new Set(p.fios.filter((d) => d.meta.tipo === 'arco').map((d) => String(d.meta.id)))
  const segredos = new Set(p.segredos.map((d) => String(d.meta.id)))
  const posicoes = new Map<string, string>()
  for (const d of p.beats) {
    const id = String(d.meta.id)
    const arcs = lista(d.meta.arcos)
    if (!arcs.length) err(d.caminho, 'beat sem arco')
    for (const a of arcs) if (!arcos.has(a)) err(d.caminho, `arco desconhecido: ${a}`)
    if (!d.meta.capitulo) err(d.caminho, 'beat sem capítulo')
    cap(d.caminho, d.meta.capitulo)
    if (d.meta.estado !== undefined && d.meta.estado !== 'proposta') err(d.caminho, `estado desconhecido no beat: ${String(d.meta.estado)} (só «proposta»; jogado/em-curso/saltado vêm do registo)`)
    if (/^(JOGADO|PROPOSTA)\b/.test(String(d.meta.titulo ?? ''))) err(d.caminho, 'título com prefixo JOGADO/PROPOSTA: o estado vem do registo ou de `estado: proposta`')
    ref(d.caminho, d.meta.local, 'local')
    for (const x of lista(d.meta.participantes)) if (!nosRel.has(x)) err(d.caminho, `participante desconhecido: ${x}`)
    if (!lista(d.meta.participantes).length) warn(d.caminho, 'beat sem participantes')
    for (const r of lista(d.meta.revela)) if (!segredos.has(r)) err(d.caminho, `segredo desconhecido em revela: ${r}`)
    for (const r of lista(d.meta.requer)) {
      if (!beatPorId.has(r)) err(d.caminho, `beat desconhecido em requer: ${r}`)
      else if (posicaoBeat(r) > posicaoBeat(id)) warn(d.caminho, `requer aponta para beat posterior: ${r}`)
    }
    for (const e of Array.isArray(d.meta.escolhas) ? (d.meta.escolhas as Record<string, unknown>[]) : []) for (const b of lista(e.levaA)) if (!beatPorId.has(b)) err(d.caminho, `beat desconhecido em escolhas: ${b}`)
    const portento = obj(d.meta.portento)
    if (typeof portento.facao === 'string' && !facoes.has(portento.facao)) err(d.caminho, `fação desconhecida no portento: ${portento.facao}`)
    for (const a of arcs) {
      const chave = `${a}|${String(d.meta.capitulo)}|${String(d.meta.ordem)}`
      const antes = posicoes.get(chave)
      if (antes) warn(d.caminho, `mesma posição (${String(d.meta.capitulo)}, ${String(d.meta.ordem)}) que ${antes} no arco ${a}`)
      else posicoes.set(chave, id)
    }
  }
  // ciclos em requer
  const marca = new Map<string, number>()
  const visita = (id: string, caminho: string[]): void => {
    const s = marca.get(id) ?? 0
    if (s === 1) {
      err(`plano/beats/${id}.md`, `ciclo em requer: ${[...caminho, id].join(' → ')}`)
      return
    }
    if (s === 2) return
    marca.set(id, 1)
    for (const r of lista(beatPorId.get(id)?.meta.requer)) if (beatPorId.has(r)) visita(r, [...caminho, id])
    marca.set(id, 2)
  }
  for (const id of beatPorId.keys()) visita(id, [])
  const arcosUsados = new Set(p.beats.flatMap((b) => lista(b.meta.arcos)))

  // segredos: regra das três pistas e quem os revela
  const reveladoPor = new Map<string, number>()
  for (const b of p.beats) for (const r of lista(b.meta.revela)) reveladoPor.set(r, (reveladoPor.get(r) ?? 0) + 1)
  for (const d of p.segredos) {
    const id = String(d.meta.id)
    refs(d.caminho, d.meta.pistas, 'beat em pistas')
    if (lista(d.meta.pistas).length < 3) warn(d.caminho, `só ${lista(d.meta.pistas).length} pista(s) (regra das três pistas)`)
    if (!reveladoPor.get(id)) warn(d.caminho, 'nenhum beat o revela (revela)')
  }

  // fios
  for (const d of p.fios) {
    const tipo = String(d.meta.tipo ?? '')
    if (!TIPOS_FIO.includes(tipo)) err(d.caminho, `tipo de fio desconhecido: ${tipo}`)
    if (['teoria', 'mesa'].includes(tipo) !== d.caminho.startsWith(PASTAS.mesaFios)) err(d.caminho, `fio do tipo ${tipo} na pasta errada`)
    refs(d.caminho, d.meta.envolve, 'id em envolve')
    ref(d.caminho, d.meta.pc, 'PC')
    if (typeof d.meta.pc === 'string' && existe(d.meta.pc) && !pcs.has(d.meta.pc)) err(d.caminho, 'pc não é um PC')
    ref(d.caminho, d.meta.facao, 'fação')
    if (tipo === 'laco') {
      const par = lista(d.meta.par)
      if (par.length !== 2) err(d.caminho, 'laço sem par de duas linhas')
      refs(d.caminho, par, 'id em par')
    }
    if (tipo === 'arco' && !arcosUsados.has(String(d.meta.id)) && d.meta.subtipo !== 'pcAmbition') warn(d.caminho, 'arco sem beats')
    if (tipo === 'ambicao') {
      refs(d.caminho, d.meta.npcs, 'personagem em npcs')
      for (const a of lista(d.meta.arcos)) if (!arcos.has(a)) err(d.caminho, `arco desconhecido: ${a}`)
      refs(d.caminho, d.meta.satisfeitaPor, 'beat em satisfeitaPor')
      refs(d.caminho, d.meta.ameacadaPor, 'beat em ameacadaPor')
    }
    if (tipo === 'frente') for (const passo of Array.isArray(d.meta.passos) ? (d.meta.passos as Record<string, unknown>[]) : []) cap(d.caminho, passo.capitulo)
  }
  for (const d of p.itens) {
    ref(d.caminho, d.meta.segredo, 'segredo')
    refs(d.caminho, d.meta.para, 'PC em para')
  }
  for (const d of p.jogadores) ref(d.caminho, d.meta.pc, 'PC')

  // sessões e acontecimentos
  const eventos = new Map<string, number>()
  for (const d of p.sessoes) {
    const n = Number(d.meta.n ?? -1)
    for (const e of Array.isArray(d.meta.acontecimentos) ? (d.meta.acontecimentos as Record<string, unknown>[]) : []) {
      const id = String(e.id ?? '')
      if (eventos.has(id)) err(`${d.caminho} › ${id}`, 'id de acontecimento repetida')
      eventos.set(id, n)
    }
  }
  p.sessoes.forEach((d) => {
    const n = Number(d.meta.n ?? -1)
    if (!Number.isInteger(n) || n < 0) err(d.caminho, 'sem número de sessão (n)')
    if (n >= 1 && typeof d.meta.data !== 'string') warn(d.caminho, 'sessão sem data: não conta como jogada')
    for (const [pc, jogador] of Object.entries(obj(d.meta.mesa))) {
      ref(d.caminho, pc, 'PC na mesa')
      ref(d.caminho, jogador, 'jogador na mesa')
    }
    for (const [beat, estado] of Object.entries(obj(d.meta.beats))) {
      ref(d.caminho, beat, 'beat')
      if (!ESTADOS_BEAT.includes(String(estado))) err(d.caminho, `estado de beat desconhecido em ${beat}: ${String(estado)}`)
    }
    const acs = Array.isArray(d.meta.acontecimentos) ? (d.meta.acontecimentos as Record<string, unknown>[]) : []
    for (const e of acs) {
      const id = String(e.id ?? '')
      const where = `${d.caminho} › ${id || '(sem id)'}`
      if (!id || !ID_RE.test(id) || !id.startsWith('e-')) err(where, 'acontecimento sem id válida (e-…)')
      const tipo = String(e.tipo ?? '')
      if (!TIPOS_ACONTECIMENTO.includes(tipo as (typeof TIPOS_ACONTECIMENTO)[number])) err(where, `tipo desconhecido: ${tipo}`)
      if (!String(e.texto ?? '').trim()) err(where, 'sem texto')
      const envolve = lista(e.envolve)
      refs(where, envolve, 'id em envolve')
      if (envolve.every(existe) && donaDe(tipo, envolve, tipoLinha) === null) err(where, `dona ambígua (${tipo}: ${envolve.join(', ')})`)
      for (const o of lista(e.origem)) {
        const sess = eventos.get(o)
        if (sess === undefined) err(where, `origem desconhecida: ${o}`)
        else if (sess > n) err(where, `origem numa sessão posterior: ${o}`)
      }
      for (const ef of Array.isArray(e.efeitos) ? (e.efeitos as Record<string, unknown>[]) : []) {
        const chave = EFEITOS.find((k) => k in ef)
        if (!chave) {
          err(where, `efeito sem tipo conhecido: ${JSON.stringify(ef)}`)
          continue
        }
        ref(where, ef[chave], `alvo do efeito ${chave}`)
        if (chave === 'posse') ref(where, ef.com, 'portador em posse')
        if (chave === 'sabe') refs(where, ef.quem, 'quem sabe')
        if (chave === 'relacao') ref(where, ef.com, 'id em relacao')
        if (chave === 'contador') ref(where, ef.de, 'alvo do contador')
      }
    }
  })

  // grelha: linhas.json e revisao.json são do Claude (erros); dm.json é da app e nunca pode partir o deploy (avisos)
  for (const l of Array.isArray(a.grelha.linhas) ? (a.grelha.linhas as Record<string, unknown>[]) : []) ref('grelha/linhas.json', l.id, 'linha')
  const DM_KINDS = ['correcao', 'verdade', 'plano', 'decisao', 'arquivo', 'linha', 'acompanhar', 'jogado', 'nota', 'resposta', 'ideia-rejeitada']
  const dmIds = new Set<string>()
  for (const e of Array.isArray(a.grelha.dm) ? (a.grelha.dm as Record<string, unknown>[]) : []) {
    const id = String(e.id ?? '')
    const where = `grelha/dm.json › ${id || '(sem id)'}`
    if (!id.startsWith('d-')) warn(where, 'entrada sem id d-…')
    if (dmIds.has(id)) warn(where, 'id repetida')
    dmIds.add(id)
    if (!DM_KINDS.includes(String(e.kind))) warn(where, `kind desconhecido: ${String(e.kind)}`)
    if (typeof e.at !== 'string') warn(where, 'sem data (at)')
    for (const [campo, oQue] of [['row', 'linha'], ['beat', 'beat']] as const) if (typeof e[campo] === 'string' && e[campo] && !existe(String(e[campo])) && e.kind !== 'linha') warn(where, `${oQue} desconhecida: ${String(e[campo])}`)
    for (const id2 of lista(e.involves)) if (!existe(id2)) warn(where, `id em involves desconhecida: ${id2}`)
    if (typeof e.fact === 'string' && !eventos.has(e.fact) && !dmIds.has(e.fact)) warn(where, `facto desconhecido: ${e.fact}`)
  }
  const revisao0 = obj(a.grelha.revisao)
  for (const chave of ['reviewed', 'absorbed'] as const) for (const id of Object.keys(obj(revisao0[chave]))) if (!dmIds.has(id)) err('grelha/revisao.json', `${chave} aponta para uma entrada que não existe em dm.json: ${id}`)
  const revisao = obj(a.grelha.revisao)
  for (const n of Array.isArray(revisao.notes) ? (revisao.notes as Record<string, unknown>[]) : []) {
    const t = obj(n.target)
    if (typeof t.row === 'string' && !existe(t.row) && !/[/.]/.test(t.row) && !eventos.has(t.row) && t.row !== 'registo') warn('grelha/revisao.json', `nota ${String(n.id)} aponta para uma linha que não existe: ${t.row}`)
  }
  return out
}
