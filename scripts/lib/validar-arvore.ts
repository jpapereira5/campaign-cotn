// Validação da estrutura nova, além do que o cânone antigo já verifica: ids e referências entre ficheiros,
// sessões e acontecimentos (tipos, dona, origem, efeitos), grelha/.
import type { Problem } from '../../src/lib/types.ts'
import { donaDe, TIPOS_ACONTECIMENTO, tipoLinhaDe } from '../../src/lib/grelha/dona.ts'
import { porPasta, type Arvore, type DocArvore } from './arvore.ts'
import { PASTAS } from '../../src/lib/arquivo/esquema.ts'

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

  for (const d of p.fios) {
    const tipo = String(d.meta.tipo ?? '')
    if (!TIPOS_FIO.includes(tipo)) err(d.caminho, `tipo de fio desconhecido: ${tipo}`)
    if (['teoria', 'mesa'].includes(tipo) !== d.caminho.startsWith(PASTAS.mesaFios)) err(d.caminho, `fio do tipo ${tipo} na pasta errada`)
    refs(d.caminho, d.meta.envolve, 'id em envolve')
    ref(d.caminho, d.meta.pc, 'PC')
    ref(d.caminho, d.meta.facao, 'fação')
    if (tipo === 'laco') {
      const par = lista(d.meta.par)
      if (par.length !== 2) err(d.caminho, 'laço sem par de duas linhas')
      refs(d.caminho, par, 'id em par')
    }
  }
  for (const d of p.itens) {
    ref(d.caminho, d.meta.segredo, 'segredo')
    refs(d.caminho, d.meta.para, 'PC em para')
  }
  for (const d of p.segredos) refs(d.caminho, d.meta.pistas, 'beat em pistas')
  for (const d of p.jogadores) ref(d.caminho, d.meta.pc, 'PC')
  for (const d of [...p.personagens, ...p.facoes]) {
    for (const r of Array.isArray(d.meta.relacoes) ? (d.meta.relacoes as Record<string, unknown>[]) : []) ref(d.caminho, r.com, 'id em relacoes')
  }

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
