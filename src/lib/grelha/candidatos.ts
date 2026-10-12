// Candidatos à próxima sessão: as linhas que, vindas de trás, valem a pena pensar para a sessão a preparar.
// Não inventa nada: só pesa o que já está na Grelha e no plano. Puro, com testes; usado pela app e por scripts/grelha.ts.
import type { Arvore, DocArvore } from '../arquivo/arvore.ts'
import { porPasta } from '../arquivo/arvore.ts'
import type { Estado } from '../estado.ts'
import type { Grelha, Linha } from './modelo.ts'

export interface Candidato {
  linha: string
  pontos: number
  razoes: string[]
  /** já há um plano preparado para a próxima sessão nesta linha */
  planeado: boolean
}

export interface EntradaCandidatos {
  grelha: Grelha
  arvore: Arvore
  estado: Estado
  /** beats marcados à mesa na camada do DM, por passar ao registo */
  jogadosDm?: Set<string>
  /** pontos mínimos para contar como candidato */
  limiar?: number
}

const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

export const LIMIAR = 4
/** a partir daqui, um candidato forte */
export const FORTE = 7

export function candidatos(e: EntradaCandidatos): Map<string, Candidato> {
  const g = e.grelha
  const limiar = e.limiar ?? LIMIAR
  const proxima = g.colunas.find((c) => c.tipo === 'proxima')
  const atual = g.colunas.find((c) => c.tipo === 'atual')
  const jogadas = g.colunas.filter((c) => c.sessao)
  const p = porPasta(e.arvore)
  const jogadosDm = e.jogadosDm ?? new Set<string>()
  const estadoBeat = (id: string) => (jogadosDm.has(id) ? 'jogado' : e.estado.beats.get(id)?.estado ?? 'por-jogar')
  const doCapitulo = p.beats.filter((b) => b.meta.capitulo === g.capituloAtual)
  const emCurso = doCapitulo.filter((b) => estadoBeat(String(b.meta.id)) === 'em-curso')
  const porJogar = doCapitulo.filter((b) => estadoBeat(String(b.meta.id)) === 'por-jogar' && b.meta.estado !== 'proposta')
  // as ids que uma linha representa: a dela e as dos fios que vivem nela (ambições, agendas)
  const idsDe = (l: Linha) => [l.id, ...Object.entries(g.alias ?? {}).filter(([, h]) => h === l.id).map(([k]) => k)]
  const toca = (b: DocArvore, ids: string[]) => {
    const m = b.meta
    const portento = m.portento && typeof m.portento === 'object' ? (m.portento as { facao?: string }).facao : undefined
    const todas = [...lista(m.participantes), ...lista(m.arcos), ...lista(m.revela), ...lista(m.requer), String(m.local ?? ''), String(portento ?? '')]
    return ids.some((id) => todas.includes(id))
  }
  const titulo = (b: DocArvore) => String(b.meta.titulo ?? b.meta.id)

  const out = new Map<string, Candidato>()
  for (const l of g.linhas) {
    if (l.calculada) continue
    const razoes: string[] = []
    let pontos = 0
    const ids = idsDe(l)

    // fios abertos que vêm de trás
    let abertos = 0, esquecidos = 0, ultima = 0
    for (const c of jogadas) {
      for (const it of l.celulas[c.chave]?.itens ?? []) {
        if (it.estatuto === 'esquecido') esquecidos++
        else if (it.estatuto === 'aberto') abertos++
        if ((it.estatuto === 'aberto' || it.estatuto === 'esquecido') && it.tags?.includes('ultima')) ultima++
      }
    }
    if (esquecidos) { pontos += 4 * esquecidos; razoes.push(`${esquecidos} esquecido${esquecidos > 1 ? 's' : ''} (aberto há 3+ sessões)`) }
    if (abertos) { pontos += 2 * abertos; razoes.push(`${abertos} aberto${abertos > 1 ? 's' : ''}`) }
    if (ultima) { pontos += 3; razoes.push('última oportunidade antes de mudar de capítulo') }

    // quem morreu não volta à mesa
    const ep = e.estado.personagens.get(l.id)
    if (ep?.estado && /mort/i.test(ep.estado.valor)) continue

    // esteve na última sessão: como dona pesa mais do que como eco
    if (atual) {
      const cel = l.celulas[atual.chave]
      if (cel?.itens.some((i) => i.tipo === 'facto')) { pontos += 2; razoes.push(`esteve na ${atual.label}`) }
      else if (cel?.ecos.length) { pontos += 1; razoes.push(`aparece na ${atual.label} (eco)`) }
      // o estado mudou na última sessão (morte, prisão, possessão…)
      if (ep?.estado && ep.estado.marca.n === atual.sessao?.n && !/^vivo$/i.test(ep.estado.valor)) { pontos += 2; razoes.push(`o estado mudou na ${atual.label}: ${ep.estado.valor}`) }
    }

    // o plano do capítulo: o beat em curso pesa mais do que os por jogar
    // o beat em curso na última sessão pesa mais do que um que ficou em curso há várias sessões
    const ultimaN = atual?.sessao?.n
    const bc = emCurso.filter((b) => toca(b, ids))
    const bcAgora = bc.filter((b) => e.estado.beats.get(String(b.meta.id))?.marca.n === ultimaN)
    if (bcAgora.length) { pontos += 3; razoes.push(`no beat em curso: ${bcAgora.map(titulo).join(', ')}`) }
    else if (bc.length) { pontos += 1; razoes.push(`num beat que ficou em curso: ${bc.map(titulo).join(', ')}`) }
    const bp = porJogar.filter((b) => toca(b, ids))
    if (bp.length) { pontos += 1; razoes.push(`${bp.length} beat${bp.length > 1 ? 's' : ''} do capítulo por jogar`) }

    // por tipo
    if (l.tipo === 'pc' && proxima && l.celulas[proxima.chave]?.itens.some((i) => i.tipo === 'falta')) { pontos += 2; razoes.push('sem cena pessoal planeada') }
    if (l.tipo === 'relogio') {
      const r = e.estado.fios.get(l.id)?.relogio?.valor
      const passos = Number(p.fios.find((d) => d.meta.id === l.id)?.meta.passos ?? 0)
      if (!passos || r === undefined || r < passos) { pontos += 2; razoes.push(r !== undefined && passos ? `relógio em ${r}/${passos}` : 'relógio a correr') }
    }
    if (l.tipo === 'revelacao' && bp.some((b) => lista(b.meta.revela).includes(l.id))) { pontos += 1; razoes.push('tem pista planeada no capítulo') }
    if (l.notas) { pontos += 1; razoes.push(`${l.notas} nota${l.notas > 1 ? 's' : ''} da revisão por responder`) }

    const planeado = !!proxima && (l.celulas[proxima.chave]?.itens.some((i) => i.estatuto === 'planeado') ?? false)
    if (pontos >= limiar) out.set(l.id, { linha: l.id, pontos, razoes, planeado })
  }
  return out
}
