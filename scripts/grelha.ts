// A Grelha em texto, para o Claude preparar a sessão (skill /preparar) e rever (skill /vigia):
//   node scripts/grelha.ts            o que a próxima sessão tem: contagens, planos, falta preparar, esquecidos, abertos, ideias, notas
//   node scripts/grelha.ts --linha ID uma linha, célula a célula
//   node scripts/grelha.ts --json     o mesmo em JSON (o que a app mostra, sem o HTML)
// Lê os ficheiros do disco (não precisa do build) e constrói a Grelha exatamente como a app (src/lib/grelha/viva.ts).
import { resolve } from 'node:path'
import { lerArvore } from './lib/arvore.ts'
import { calcularEstado, rotuloMarca } from '../src/lib/estado.ts'
import { Indice } from '../src/lib/ficha.ts'
import { Campanha } from '../src/lib/campanha.ts'
import { tiposDeLinha, type Item, type Linha } from '../src/lib/grelha/modelo.ts'
import { tipoLinhaDe } from '../src/lib/grelha/dona.ts'
import { camadaDaArvore, grelhaViva, notasPorResponder } from '../src/lib/grelha/viva.ts'

const raiz = resolve(import.meta.dirname, '..')
const arvore = lerArvore(raiz)
const estado = calcularEstado(arvore)
const indice = new Indice(arvore)
const campanha = new Campanha(arvore)
const camada = camadaDaArvore(arvore)
const g = grelhaViva(arvore, estado, indice, campanha, camada, tipoLinhaDe(tiposDeLinha(arvore)))

const args = process.argv.slice(2)
const proxima = g.colunas.find((c) => c.tipo === 'proxima')
const proximaChave = proxima?.chave ?? ''
const porResponder = notasPorResponder(g, camada)
const linhas = g.linhas.filter((l) => !l.calculada)

const MARCA: Record<string, string> = { aberto: '●', esquecido: '!', planeado: '◆', falta: '◇', pago: '✓', pista: '◗', fechado: '—', registo: '·' }
const idItem = (i: Item) => i.ac?.id ?? i.dm?.id ?? i.nota ?? ''
const linhaTxt = (i: Item) => `${MARCA[i.estatuto ?? ''] ?? (i.tipo === 'ideia' ? '?' : '·')} ${i.fio ? `[${i.fio.nome}] ` : ''}${i.texto}${idItem(i) ? ` [${idItem(i)}]` : ''}${i.origem?.length ? ` (nasce de ${i.origem.join(', ')})` : ''}${i.planeadoEm ? ` ${i.planeadoEm}` : ''}${i.porRever ? ' ✎ por rever' : ''}${i.tags?.length ? ` {${i.tags.join(', ')}}` : ''}`
const cabeca = (l: Linha) => `${l.nome} [${l.id}] · ${l.tipo}${l.atitude ? ` · ${l.atitude}` : ''}${l.legenda ? ` · ${l.legenda}` : ''}${l.fios?.length ? ` · fios: ${l.fios.map((f) => `${f.nome} [${f.id}]`).join(', ')}` : ''}`

if (args.includes('--json')) {
  const saida = {
    proxima: { chave: proximaChave, n: g.proximaN, label: proxima?.label },
    capituloAtual: campanha.capituloAtual,
    contagens: { abertos: linhas.reduce((n, l) => n + l.abertos, 0), esquecidos: linhas.reduce((n, l) => n + l.esquecidos, 0), faltas: linhas.reduce((n, l) => n + l.faltas, 0), porResponder: porResponder.length },
    alias: g.alias,
    linhas: linhas.map((l) => ({
      id: l.id, nome: l.nome, tipo: l.tipo, grupo: l.grupo, atitude: l.atitude, legenda: l.legenda, abertos: l.abertos, esquecidos: l.esquecidos, faltas: l.faltas, porRever: l.porRever, fios: l.fios,
      celulas: Object.fromEntries(Object.entries(l.celulas).filter(([, c]) => c.itens.length || c.ecos.length).map(([k, c]) => [k, { itens: c.itens.map((i) => ({ tipo: i.tipo, estatuto: i.estatuto, texto: i.texto, id: idItem(i) || undefined, origem: i.origem, tags: i.tags, planeadoEm: i.planeadoEm, porRever: i.porRever, refs: i.refs })), ecos: c.ecos.map((e) => ({ dona: e.dona, texto: e.texto })) }])),
    })),
    porResponder,
    notasSoltas: g.notasSoltas,
    planosPassados: g.planosPassados.map((p) => ({ linha: p.linha.id, entrada: p.entrada })),
  }
  console.log(JSON.stringify(saida, null, 2))
  process.exit(0)
}

const iLinha = args.indexOf('--linha')
if (iLinha >= 0) {
  const id = args[iLinha + 1]
  const l = g.linhas.find((x) => x.id === id) ?? g.linhas.find((x) => x.id === g.alias[id])
  if (!l) {
    console.error(`linha desconhecida: ${id} (está em grelha/linhas.json?)`)
    process.exit(1)
  }
  if (g.alias[id]) console.log(`(${id} vive na linha ${l.id})`)
  console.log(cabeca(l))
  for (const c of g.colunas) {
    const cel = l.celulas[c.chave]
    if (!cel || (!cel.itens.length && !cel.ecos.length)) continue
    console.log(`\n${c.label}${c.sub ? ` · ${c.sub}` : ''}`)
    for (const i of cel.itens) console.log(`  ${linhaTxt(i)}`)
    for (const e of cel.ecos) console.log(`  ↳ ${indice.nome(e.dona ?? '')}: ${e.texto}`)
  }
  process.exit(0)
}

const ultima = estado.mesa.ultima
console.log(`GRELHA · próxima ${proxima?.label ?? `S${g.proximaN}`} · a mesa está em ${campanha.nomeCapitulo(campanha.capituloAtual)}${ultima ? ` · última S${ultima.n} (${ultima.data}) «${ultima.titulo}»` : ''}`)
console.log(`${linhas.reduce((n, l) => n + l.abertos, 0)} abertos · ${linhas.reduce((n, l) => n + l.esquecidos, 0)} esquecidos · ${linhas.reduce((n, l) => n + (l.planeados ?? 0), 0)} planeados para a S${g.proximaN} · ${linhas.reduce((n, l) => n + l.faltas, 0)} falta preparar · ${porResponder.length} por responder · ${camada.dm.filter((e) => !e.deleted).length} entradas do DM`)

const secao = (titulo: string, corpo: string[]) => {
  if (!corpo.length) return
  console.log(`\n## ${titulo}`)
  for (const x of corpo) console.log(x)
}

secao(
  `Na coluna da S${g.proximaN} (planos, ideias, falta)`,
  linhas.flatMap((l) => {
    const itens = (l.celulas[proximaChave]?.itens ?? []).filter((i) => i.tipo !== 'texto')
    return itens.length ? [`- ${cabeca(l)}`, ...itens.map((i) => `    ${linhaTxt(i)}`)] : []
  }),
)
secao(
  'Esquecidos (abertos há 3 ou mais sessões, sem plano)',
  linhas.flatMap((l) => Object.entries(l.celulas).flatMap(([k, c]) => c.itens.filter((i) => i.estatuto === 'esquecido').map((i) => `- ${l.nome} [${l.id}] · ${g.colunas.find((x) => x.chave === k)?.label ?? k}: ${linhaTxt(i)}`))),
)
secao(
  'Abertos (os outros)',
  linhas.flatMap((l) => Object.entries(l.celulas).flatMap(([k, c]) => c.itens.filter((i) => i.estatuto === 'aberto').map((i) => `- ${l.nome} [${l.id}] · ${g.colunas.find((x) => x.chave === k)?.label ?? k}: ${linhaTxt(i)}`))),
)
secao(
  'Por rever (entradas do DM ainda sem revisão)',
  linhas.flatMap((l) => Object.entries(l.celulas).flatMap(([k, c]) => c.itens.filter((i) => i.porRever && i.dm).map((i) => `- ${l.nome} [${l.id}] · ${g.colunas.find((x) => x.chave === k)?.label ?? k}: ${i.dm?.kind} ${linhaTxt(i)}${i.original ? ` (era: «${i.original}»)` : ''}`))).concat(linhas.filter((l) => l.porRever && l.dm && l.dm.kind !== 'plano' && l.dm.kind !== 'correcao').map((l) => `- ${cabeca(l)}: ${l.dm?.kind} [${l.dm?.id}]`)),
)
secao(
  'Por responder (notas do Claude)',
  porResponder.map((n) => `- [${n.id}] ${n.kind}${n.target?.row ? ` · ${indice.nome(n.target.row)}` : ''}${n.target?.col ? ` · ${n.target.col}` : ''}: ${n.text}${n.suggestion ? ` → sugestão: ${n.suggestion}` : ''}`),
)
secao(
  'Caixa de entrada',
  [...g.planosPassados.map((p) => `- plano que ficou para trás · ${p.linha.nome} · ${p.entrada.col}: ${p.entrada.text} [${p.entrada.id}]`), ...g.notasSoltas.map((n) => `- nota rápida: ${n.text} [${n.id}]`)],
)
secao(
  'A mesa',
  [
    `- presenças: ${Object.entries(estado.mesa.presencas).map(([pc, n]) => `${indice.nome(pc)} ${n}`).join(' · ') || '—'}`,
    ...(estado.mesa.nivel ? [`- nível ${estado.mesa.nivel}`] : []),
    ...(estado.mesa.mundo ? [`- dia no mundo: ${estado.mesa.mundo}`] : []),
    `- beats marcados à mesa (por passar ao registo): ${camada.dm.filter((e) => e.kind === 'jogado' && !e.deleted).map((e) => `${indice.nome(String(e.beat))} [${e.beat}]`).join(', ') || '—'}`,
    `- última marca do registo: ${ultima ? `S${ultima.n}` : '—'}${estado.mesa.ultima ? ` (${rotuloMarca({ sessao: estado.mesa.ultima.id, n: estado.mesa.ultima.n, acontecimento: '' })})` : ''}`,
  ],
)
