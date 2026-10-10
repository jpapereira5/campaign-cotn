// Valida data/ : node scripts/validate-data.ts [--warn] [--book] [--legado]
// Livro + campanha + registo (ou só o livro com --book). Só erros bloqueiam o deploy; avisos são a lista
// do que o fecho ainda tem de reconciliar. --legado: os marcadores de estado em texto e os vestígios do
// modelo antigo (data/state.json, docs/canone.md) são avisos e não erros, enquanto a migração decorre.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { lintMarcadores } from '../src/lib/validate.ts'
import { derivar, validateRegisto } from '../src/lib/registo.ts'
import { carregar, docs, root } from './carregar.ts'
import { estadoDesatualizado, gerarEstado } from './estado.ts'

const args = process.argv.slice(2)
const onlyBook = args.includes('--book')
const legado = args.includes('--legado')
const showWarns = args.includes('--warn') || args.includes('-w')

const { canon, registo, campaign, problems: base, layers } = carregar(onlyBook)
const problems = [...base]
if (!onlyBook) {
  problems.push(...validateRegisto(canon, registo))
  problems.push(...lintMarcadores(campaign, legado ? 'warn' : 'error'))
  // referências a ficheiros (só aqui, com acesso ao disco): o resumo de cada sessão e os docs/x.md#ancora
  const raiz = join(root, '..')
  const refs: [string, string][] = []
  for (const s of registo.sessoes) if (s.resumo) refs.push([`registo/${s.id}`, s.resumo])
  for (const d of registo.decisoes) for (const a of d.afeta) if (a.startsWith('docs/')) refs.push([`registo/decisoes/${d.id}`, a])
  for (const i of registo.itens) for (const a of [i.regras, i.texto]) if (a) refs.push([`registo/itens/${i.id}`, a])
  for (const [where, ref] of refs) {
    const ficheiro = ref.replace(/#.*$/, '')
    if (!existsSync(join(raiz, ficheiro))) problems.push({ level: 'error', where, message: `ficheiro inexistente: ${ficheiro}` })
  }
  if (!problems.some((p) => p.level === 'error') && estadoDesatualizado(gerarEstado(canon, registo))) problems.push({ level: 'warn', where: 'docs/estado.md', message: 'desatualizado: corre npm run estado' })
  const vestigios: [string, string, string][] = [
    [join(root, 'state.json'), 'data/state.json', 'já não existe: o estado deriva de data/registo'],
    [join(docs, 'canone.md'), 'docs/canone.md', 'já não existe: as decisões vivem em data/registo/decisoes'],
  ]
  for (const [p, where, msg] of vestigios) if (existsSync(p)) problems.push({ level: legado ? 'warn' : 'error', where, message: msg })
}
const errors = problems.filter((p) => p.level === 'error')
const warns = problems.filter((p) => p.level === 'warn')
for (const p of errors) console.error(`✖ ${p.where}: ${p.message}`)
if (showWarns) for (const p of warns) console.warn(`⚠ ${p.where}: ${p.message}`)

const changed = layers ? [...layers.entities.values()].filter((l) => l === 'modified').length : 0
const added = layers ? [...layers.entities.values()].filter((l) => l === 'campaign').length + layers.relations.size : 0
console.log(
  `${onlyBook ? 'livro' : 'livro + campanha'}: capítulos ${canon.campaign.chapters.length} · arcos ${canon.arcs.length} · personagens ${canon.characters.length} · facções ${canon.factions.length} · locais ${canon.locations.length} · relações ${canon.relations.length} · beats ${canon.beats.length} · revelações ${canon.revelations.length} · ambições ${canon.ambitions.length}`,
)
if (layers) console.log(`camada campanha: ${changed} alterada(s), ${added} acrescentada(s)/removida(s)`)
if (!onlyBook) {
  const e = derivar(canon, registo)
  const porCap = new Map<string, number>()
  for (const b of canon.beats) if (b.proposta) porCap.set(b.chapter, (porCap.get(b.chapter) ?? 0) + 1)
  const outras = [...canon.characters, ...canon.factions, ...canon.locations, ...canon.revelations, ...canon.arcs, ...canon.ambitions].filter((x) => x.proposta).length
  const fiosAbertos = Object.values(e.fios).filter((f) => f.estado === 'aberto').length
  const perguntas = registo.fios.filter((f) => f.tipo === 'pergunta' && e.fios[f.id]?.estado === 'aberto').length
  const marcadores = problems.filter((p) => p.message.startsWith('«')).length
  console.log(
    `registo: ${e.sessoes.length} sessões jogadas${e.planeada ? ` + 1 planeada (${e.planeada.id})` : ''} · ${e.playedBeats.length} beats jogados · ${e.decisoes.vigentes.length} decisões vigentes (${e.decisoes.substituidas.size} substituídas, ${e.decisoes.planos.length} planos por cumprir) · ${fiosAbertos} fios abertos (${perguntas} perguntas) · ${registo.itens.length} itens · ${registo.relogios.length} relógios · ${Object.keys(e.flags).length} flags`,
  )
  const beatsProp = [...porCap.values()].reduce((a, b) => a + b, 0)
  const detalhe = [...porCap.entries()].sort().map(([c, n]) => `${c} ${n}`).join(', ')
  console.log(`propostas herdadas: ${beatsProp} beats${detalhe ? ` (${detalhe})` : ''} + ${outras} outras entidades · marcadores de estado em texto: ${marcadores}`)
}
console.log(`${errors.length} erro(s), ${warns.length} aviso(s)${warns.length && !showWarns ? ' (usa --warn para os ver)' : ''}`)
if (errors.length) process.exitCode = 1
