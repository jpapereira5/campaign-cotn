// Migração para a estrutura nova (docs/arquitetura.md, fase A): node scripts/migrar.ts
// Lê data/ e docs/ (ficam intactos), junta as camadas como a app e escreve um ficheiro Markdown por coisa em
// mundo/, plano/, registo/, mesa/, mais grelha/ e livro/. Corre quantas vezes for preciso: apaga e reescreve as pastas novas.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { lerAntigo, chaveRel } from './lib/antigo.ts'
import {
  ambicaoParaDoc, arcoParaDoc, beatParaDoc, campanhaParaDoc, facaoParaDoc, frenteParaDoc, localParaDoc, pastaDeId,
  personagemParaDoc, relacaoParaNova, segredoParaDoc, partirTitulo, type RelacaoNova,
} from '../src/lib/arquivo/esquema.ts'
import { parseMd, secoes, secoesNivel, stringifyMd, type Doc, type Secao } from '../src/lib/arquivo/md.ts'
import { cabecalhosDaSemente, gerarAcontecimentos, gerarIdeias, type Ajustes, type Mapa, type Semente } from './migracao/semente.ts'

const raiz = resolve(import.meta.dirname, '..')
const ler = (rel: string) => readFileSync(join(raiz, rel), 'utf8')
const lerJson = <T>(rel: string): T => JSON.parse(ler(rel)) as T

const antigo = lerAntigo(raiz)
const semente = lerJson<Semente>('docs/grelha-semente.json')
const mapa = lerJson<Mapa>('scripts/migracao/linhas.json')
delete (mapa as Record<string, unknown>)._nota
const ajustes = lerJson<Ajustes>('scripts/migracao/celulas.json')
delete (ajustes as Record<string, unknown>)._nota

const saida = new Map<string, string>()
const doc = (caminho: string, d: Doc) => saida.set(caminho, stringifyMd(d.meta, d.body))
const texto = (caminho: string, t: string) => saida.set(caminho, t.replace(/\s+$/, '') + '\n')
const json = (caminho: string, v: unknown) => saida.set(caminho, JSON.stringify(v, null, 2) + '\n')
const secao = (titulo: string, t: string): Secao => ({ titulo, texto: t.replace(/\s+$/, '') })
const corpo = (secs: Secao[]): string => secs.map((s) => `## ${s.titulo}\n\n${s.texto}`).join('\n\n') + (secs.length ? '\n' : '')
const origemDe = (col: string, id: string): string[] => antigo.origens.get(`${col}/${id}`) ?? ['livro']

// ---- extras da semente (o que o mockup sabia de cada linha) -------------------------------------
const extras = new Map<string, Record<string, unknown>>()
const corpoExtra = new Map<string, Secao[]>()
const acrescenta = (id: string, s: Secao) => corpoExtra.set(id, [...(corpoExtra.get(id) ?? []), s])
for (const linha of semente.linhas) {
  const m = mapa[linha.nome]
  if (!m?.id || m.novo) continue
  const e: Record<string, unknown> = {}
  if (linha.sub) e.legenda = linha.sub
  if (linha.atitude) e.atitudeAtual = linha.atitude
  if (linha.flags) e.marcas = linha.flags
  if (linha.badges) e.etiquetas = linha.badges
  if (linha.sabe) e.sabe = linha.sabe
  if (linha.tipo === 'revelacao') e.nome = linha.nome
  if (Object.keys(e).length) extras.set(m.id, e)
}

// ---- docs antigos: secções que mudam de sítio ---------------------------------------------------
const pcsMd = secoes(ler('docs/pcs.md'))
const regrasMd = secoes(ler('docs/regras.md'))
const loreMd = secoes(ler('docs/lore.md'))
const handoutsMd = secoes(ler('docs/handouts.md'))
const canoneMd = secoes(ler('docs/canone.md'))

const PC_POR_TITULO: [RegExp, string][] = [[/Quasi/, 'c-pc-quasi'], [/Lucan/, 'c-pc-lucan'], [/Isco/, 'c-pc-isco'], [/Lia/, 'c-pc-lia']]
const oQueSabe: Secao[] = []
const sessaoZeroExtra: Secao[] = []
for (const s of pcsMd.secoes) {
  const pc = PC_POR_TITULO.find(([re]) => re.test(s.titulo))?.[1]
  if (!pc) {
    sessaoZeroExtra.push(secao(s.titulo, s.texto))
    continue
  }
  const sub = secoesNivel(s.texto, 3)
  const ficha: string[] = []
  if (sub.intro) ficha.push(sub.intro)
  for (const h of sub.secoes) {
    if (/^O que .* sabe$/.test(h.titulo)) oQueSabe.push(secao(h.titulo, h.texto))
    else acrescenta(pc, secao(h.titulo, h.texto))
  }
  if (ficha.length) acrescenta(pc, secao(`Ficha (de docs/pcs.md: ${s.titulo})`, ficha.join('\n\n')))
}

const REGRAS_MOVIDAS: Record<string, string> = {
  'A Adaga de Duarte Mirim (DM)': 'i-adaga-drow',
  'A Fera do Lucan (DM; base na ficha da Renata)': 'c-pc-lucan',
  'As transformações do Isco (DM; base na ficha do Pedro Ropio)': 'c-pc-isco',
  'A máscara do Quasi (DM; base na ficha do Pedro)': 'c-pc-quasi',
  'Itens da mesa (sessão 3, #84)': 'i-saque-do-ossario',
}
const ITENS_MEDALHAS: Record<string, string> = {
  'Medalhas do Festival do Mérito (livro, traduzidas na mesa)': 'i-medalhas-do-festival',
  'Amuleto de Honra de Urzin (DM)': 'i-amuleto-de-honra',
  'Dádiva da Possibilidade — Mote of Possibility (Belana Zolaed, DM)': 'i-mote-of-possibility',
  'Essência do Solo Vivo (consumível, DM)': 'i-essencia-do-solo-vivo',
  'Colar dos Caminhantes-dos-Desterros (símbolo de aliança, DM)': 'i-colar-dos-caminhantes',
  'Refúgio do Caminhante (DM, sessão 6)': 'i-colar-dos-caminhantes',
}
const NOMES_ITENS: Record<string, [string, string]> = {
  'i-saque-do-ossario': ['Saque do ossário (itens da mesa, sessão 3)', 'equipamento'],
  'i-medalhas-do-festival': ['Medalhas do Festival do Mérito', 'maravilhoso'],
  'i-amuleto-de-honra': ['Amuleto de Honra de Urzin', 'maravilhoso'],
  'i-mote-of-possibility': ['Dádiva da Possibilidade (Mote of Possibility)', 'maravilhoso'],
  'i-essencia-do-solo-vivo': ['Essência do Solo Vivo', 'consumível'],
  'i-colar-dos-caminhantes': ['Colar dos Caminhantes-dos-Desterros (Refúgio do Caminhante)', 'maravilhoso'],
}
const regrasNovas: Secao[] = []
for (const s of regrasMd.secoes) {
  const destino = REGRAS_MOVIDAS[s.titulo]
  if (destino) {
    acrescenta(destino, secao(`${s.titulo} (de docs/regras.md)`, s.texto))
    regrasNovas.push(secao(s.titulo, `→ [[${destino}]]`))
    continue
  }
  if (s.titulo.startsWith('Medalhas do Festival, Amuleto de Honra')) {
    const sub = secoesNivel(s.texto, 3)
    const links = new Set<string>()
    for (const h of sub.secoes) {
      const item = ITENS_MEDALHAS[h.titulo]
      if (!item) throw new Error(`subsecção sem item: ${h.titulo}`)
      acrescenta(item, secao(`${h.titulo} (de docs/regras.md)`, h.texto))
      links.add(item)
    }
    regrasNovas.push(secao(s.titulo, [sub.intro, ...[...links].map((l) => `→ [[${l}]]`)].filter(Boolean).join('\n\n')))
    continue
  }
  regrasNovas.push(s)
}

const LORE_MOVIDO: Record<string, string> = {
  'Baeshra e o clã Ro (DM; fonte: a lenda original da Renata)': 'c-baeshra',
  "Sess'inek, o Emperor Lizard (canon + DM)": 'c-sessinek',
  'Decrépola (Rotthold) e o rubídio que desce do norte (DM, 2026-10-01)': 'l-decrepola',
}
const loreNovo: Secao[] = []
for (const s of loreMd.secoes) {
  const destino = LORE_MOVIDO[s.titulo]
  if (destino) {
    acrescenta(destino, secao(`${s.titulo} (de docs/lore.md)`, s.texto))
    loreNovo.push(secao(s.titulo, `→ [[${destino}]]`))
  } else loreNovo.push(s)
}

const HANDOUTS: Record<string, { id: string; nome: string; para?: string[]; estado?: string }> = {
  'Caderno Volstrucker': { id: 'i-doc-caderno-volstrucker', nome: 'Caderno Volstrucker' },
  'Notas do Arcanista': { id: 'i-doc-notas-do-arcanista', nome: 'Notas do Arcanista' },
  'Livro em tinta invisível': { id: 'i-doc-livro-tinta-invisivel', nome: 'Livro em tinta invisível' },
  'Inscrições': { id: 'i-doc-inscricoes', nome: 'Inscrições' },
  'Diário de Comando do Intendente Verin Thelyss': { id: 'i-doc-diario-verin-thelyss', nome: 'Diário de Comando do Intendente Verin Thelyss' },
  'Mensagem do Sorriso Dourado': { id: 'i-doc-mensagem-sorriso-dourado', nome: 'Mensagem do Sorriso Dourado' },
  'Chegada a Bazzoxan': { id: 'i-doc-chegada-a-bazzoxan', nome: 'Chegada a Bazzoxan' },
  'Caderno Volstrucker — versão anterior (diferenças)': { id: 'i-doc-caderno-volstrucker', nome: 'Caderno Volstrucker' },
  'Balada do "deus a meio caminho" (página de Iliana "Questão")': { id: 'i-doc-balada-deus-a-meio-caminho', nome: 'Balada do «deus a meio caminho» (página de Iliana «Questão»)' },
  'Decrépola — o que vocês se lembram (só Lucan e Isco)': { id: 'i-doc-decrepola-memorias', nome: 'Decrépola: o que vocês se lembram', para: ['c-pc-lucan', 'c-pc-isco'] },
  'Patrulha do Forte Ventura (sessão 4) — por escrever': { id: 'i-doc-patrulha-forte-ventura', nome: 'Patrulha do Forte Ventura (sessão 4)', estado: 'rascunho' },
}
const handoutDocs = new Map<string, { meta: Record<string, unknown>; secs: Secao[] }>()
for (const s of handoutsMd.secoes) {
  const h = HANDOUTS[s.titulo]
  if (!h) throw new Error(`handout sem mapa: ${s.titulo}`)
  const atual = handoutDocs.get(h.id) ?? { meta: { id: h.id, nome: h.nome, tipoItem: 'documento', ...(h.para ? { para: h.para } : {}), ...(h.estado ? { estado: h.estado } : {}), origem: ['handouts'] }, secs: [] }
  atual.secs.push(secao(`${s.titulo} (de docs/handouts.md)`, s.texto))
  handoutDocs.set(h.id, atual)
}

const canonePorSessao = new Map<number, Secao>()
const decisoes: Secao[] = []
for (const s of canoneMd.secoes) {
  const m = s.titulo.match(/^Sessão (\d+) /)
  if (m) canonePorSessao.set(Number(m[1]), secao(`Cânone (de docs/canone.md: ${s.titulo})`, s.texto))
  else decisoes.push(s)
}

// ---- mundo e plano: as entidades do cânone -----------------------------------------------------
const relPorFrom = new Map<string, RelacaoNova[]>()
for (const r of antigo.canon.relations) {
  const origem = antigo.relOrigem.get(chaveRel(r as unknown as Record<string, unknown>)) ?? 'livro'
  relPorFrom.set(r.from, [...(relPorFrom.get(r.from) ?? []), relacaoParaNova(r, origem)])
}
const caminhoDe = (id: string, tipo?: string) => `${pastaDeId(id, tipo)}/${id}.md`

for (const c of antigo.canon.characters) {
  doc(caminhoDe(c.id), personagemParaDoc(c, origemDe('characters', c.id), relPorFrom.get(c.id) ?? [], extras.get(c.id), corpoExtra.get(c.id)))
}
for (const f of antigo.canon.factions) {
  doc(caminhoDe(f.id), facaoParaDoc(f, origemDe('factions', f.id), relPorFrom.get(f.id) ?? [], extras.get(f.id), corpoExtra.get(f.id)))
  const frente = frenteParaDoc(f, origemDe('factions', f.id))
  if (frente) doc(caminhoDe(String(frente.meta.id), 'frente'), frente)
}
for (const l of antigo.canon.locations) doc(caminhoDe(l.id), localParaDoc(l, origemDe('locations', l.id), corpoExtra.get(l.id)))
for (const r of antigo.canon.revelations) doc(caminhoDe(r.id), segredoParaDoc(r, origemDe('revelations', r.id), extras.get(r.id)))
for (const b of antigo.canon.beats) doc(caminhoDe(b.id), beatParaDoc(b, origemDe('beats', b.id)))
for (const a of antigo.canon.arcs) doc(caminhoDe(a.id), arcoParaDoc(a, origemDe('arcs', a.id)))
const nomeAmbicao = new Map<string, string>()
for (const [nome, m] of Object.entries(mapa)) if (m.id?.startsWith('amb-')) nomeAmbicao.set(m.id, nome)
for (const a of antigo.canon.ambitions) doc(caminhoDe(a.id), ambicaoParaDoc(a, origemDe('ambitions', a.id), nomeAmbicao.get(a.id)))
doc('plano/campanha.md', campanhaParaDoc(antigo.canon.campaign, antigo.state.currentChapter))

// ---- coisas novas vindas do mockup ---------------------------------------------------------------
const linhaPorNome = new Map(semente.linhas.map((l) => [l.nome, l]))
for (const [nome, m] of Object.entries(mapa)) {
  if (!m.novo || !m.id) continue
  const linha = linhaPorNome.get(nome)
  const n = m.novo as Record<string, unknown>
  const pasta = String(n.pasta)
  const base: Record<string, unknown> = { id: m.id }
  const corpoSecs: Secao[] = []
  const corpoNovo = (n.corpo ?? {}) as Record<string, string>
  for (const [t, tx] of Object.entries(corpoNovo)) corpoSecs.push(secao(t, tx))
  if (pasta === 'fios' || pasta === 'mesa-fios') {
    Object.assign(base, { tipo: n.tipo, nome, ...(linha?.sub ? { legenda: linha.sub } : {}), envolve: n.envolve ?? [], ...(n.pc ? { pc: n.pc } : {}), ...(n.par ? { par: n.par } : {}), ...(n.passos ? { passos: n.passos } : {}) })
  } else if (pasta === 'itens') {
    Object.assign(base, { nome: n.nome, tipoItem: n.tipoItem, ...(n.segredo ? { segredo: n.segredo } : {}), ...(linha?.sub ? { legenda: linha.sub } : {}) })
    if (n.regras) {
      const movido = corpoExtra.get(m.id) ?? []
      corpoSecs.push(...movido)
      corpoExtra.delete(m.id)
    }
  } else if (pasta === 'segredos') {
    Object.assign(base, { nome, lista: n.lista, pistas: [], ...(linha?.sub ? { legenda: linha.sub } : {}), ...(linha?.sabe ? { sabe: linha.sabe } : {}) })
    corpoSecs.push(secao('Verdade', String(n.verdade)))
  } else if (pasta === 'jogadores') {
    Object.assign(base, { nome: n.nome, pc: n.pc })
    if (linha?.sub) corpoSecs.push(secao('Notas', linha.sub))
  } else if (pasta === 'facoes') {
    Object.assign(base, { nome: n.nome, lema: n.lema ?? '', lideres: n.lideres ?? [], aliados: n.aliados ?? [], inimigos: n.inimigos ?? [] })
  } else if (pasta === 'personagens') {
    Object.assign(base, { nome: n.nome, tipo: n.tipo, facoes: n.facoes ?? [], capitulos: n.capitulos ?? [] })
    if (linha?.sub) base.legenda = linha.sub
    if (linha?.badges) base.etiquetas = linha.badges
  } else throw new Error(`pasta nova desconhecida: ${pasta}`)
  base.origem = ['grelha']
  doc(caminhoDe(m.id, String(n.tipo ?? '')), { meta: base, body: corpo(corpoSecs) })
}
for (const [id, [nome, tipoItem]] of Object.entries(NOMES_ITENS)) {
  doc(caminhoDe(id), { meta: { id, nome, tipoItem, origem: ['regras'] }, body: corpo(corpoExtra.get(id) ?? []) })
  corpoExtra.delete(id)
}
for (const [id, h] of handoutDocs) doc(caminhoDe(id), { meta: h.meta, body: corpo(h.secs) })
const porUsar = [...corpoExtra.keys()].filter((id) => !saida.has(caminhoDe(id)))
if (porUsar.length) throw new Error(`secções movidas para ids que não existem: ${porUsar.join(', ')}`)

// ---- docs que ficam, com ligações no lugar das secções movidas ----------------------------------
texto('mesa/regras.md', [regrasMd.intro, ...regrasNovas.map((s) => `## ${s.titulo}\n\n${s.texto}`)].join('\n\n'))
texto('mundo/lore.md', [loreMd.intro, ...loreNovo.map((s) => `## ${s.titulo}\n\n${s.texto}`)].join('\n\n'))
texto('mundo/itens/README.md', `# Itens e documentos\n\nUm ficheiro por item (\`i-*.md\`); os handouts são itens do tipo \`documento\` (\`i-doc-*.md\`). Quem tem cada item e a quem foi entregue sai do registo (efeitos \`posse\`).\n\n${handoutsMd.intro}`)
texto('registo/decisoes.md', [`# Decisões do DM\n\nDiário das decisões tomadas entre sessões, por data. A verdade atual fica no ficheiro de cada coisa; a decisão aponta para ele.\n\n${canoneMd.intro}`, ...decisoes.map((s) => `## ${s.titulo}\n\n${s.texto}`)].join('\n\n'))

// ---- registo: sessões ----------------------------------------------------------------------------
const acontecimentos = gerarAcontecimentos(semente, mapa, ajustes)
const cabecalhos = cabecalhosDaSemente(semente, mapa)
const mesaDe = (n: number): Record<string, string> => ({
  'c-pc-lucan': 'p-renata',
  'c-pc-isco': 'p-pedro-ropio',
  'c-pc-quasi': 'p-pedro-silva',
  ...(n >= 4 ? { 'c-pc-lia': 'p-camila' } : {}),
})
const sessoesAntigas = [...antigo.state.sessions].sort((a, b) => a.date.localeCompare(b.date))
const ultimaSessaoDoBeat = new Map<string, string>()
for (const s of sessoesAntigas) for (const b of s.beats) ultimaSessaoDoBeat.set(b, s.id)
const jogados = new Set(antigo.state.playedBeats)
const indice: string[] = []
sessoesAntigas.forEach((s, i) => {
  const n = i + 1
  const partes = partirTitulo(s.title)
  if (!partes || partes.n !== n) throw new Error(`título fora do padrão: ${s.title}`)
  const ficheiroDoc = `docs/sessoes/sessao-${String(n).padStart(2, '0')}-${s.date}.md`
  const original = parseMd(ler(ficheiroDoc))
  const beats: Record<string, string> = {}
  for (const b of s.beats) beats[b] = jogados.has(b) && ultimaSessaoDoBeat.get(b) === s.id ? 'jogado' : 'em-curso'
  const h = cabecalhos.get(n) ?? {}
  const meta: Record<string, unknown> = {
    id: s.id,
    n,
    global: partes.global,
    data: s.date,
    titulo: partes.titulo,
    capitulo: 'ch0',
    mesa: mesaDe(n),
    ausentes: [],
    ...(h.mundo ? { mundo: h.mundo } : {}),
    ...(h.nivel ? { nivel: Number(h.nivel) } : {}),
    ...(h.resumo ? { resumo: h.resumo } : {}),
    ...(h.ondeParou ? { ondeParou: h.ondeParou } : {}),
    beats,
    ...(original.meta.tags ? { tags: original.meta.tags } : {}),
    notas: s.notes,
    acontecimentos: acontecimentos.get(n) ?? [],
  }
  const canone = canonePorSessao.get(n)
  const body = original.body.replace(/\s+$/, '') + (canone ? `\n\n## ${canone.titulo}\n\n${canone.texto}` : '')
  const nome = `s${String(n).padStart(2, '0')}-${s.date}.md`
  doc(`registo/sessoes/${nome}`, { meta, body })
  indice.push(`| ${n} | #${partes.global} | ${s.date} | ${partes.titulo} | [${nome}](${nome}) |`)
})
// sessão zero: o ponto de partida dos PCs e da mesa
doc('registo/sessoes/s00-sessao-zero.md', {
  meta: {
    id: 's-000',
    n: 0,
    titulo: 'Sessão zero: o ponto de partida',
    data: null,
    capitulo: 'ch0',
    mesa: mesaDe(3),
    acontecimentos: ['c-pc-quasi', 'c-pc-lucan', 'c-pc-isco', 'c-pc-lia'].map((pc, i) => ({
      id: `e-s0-${String(i + 1).padStart(2, '0')}`,
      tipo: 'registo',
      texto: `Ponto de partida de [[${pc}]]: o que sabe ao começar está em «O que cada PC sabe ao começar», abaixo. Os efeitos «sabe» ficam por preencher pelo DM.`,
      envolve: [pc],
      fonte: 'docs/pcs.md',
    })),
  },
  body: [pcsMd.intro, `## O que cada PC sabe ao começar\n\n${oQueSabe.map((s) => `### ${s.titulo}\n\n${s.texto}`).join('\n\n')}`, ...sessaoZeroExtra.map((s) => `## ${s.titulo}\n\n${s.texto}`)].join('\n\n'),
})
texto('registo/sessoes/README.md', `# Sessões — Call of the Netherdeep 2026\n\nUm ficheiro por sessão: cabeçalho com a mesa, o dia no mundo, os beats tocados e os acontecimentos com efeitos; o resumo por baixo. A sessão zero guarda o ponto de partida. As transcrições ficam só na Drive, em \`session_records/\`, fora do repositório.\n\n| Sessão | Global | Data | Título | Ficheiro |\n|---|---|---|---|---|\n${indice.reverse().join('\n')}`)

// ---- grelha ------------------------------------------------------------------------------------
// As linhas da Grelha: id, tipo forçado (quando não se deduz da entidade) e os PCs a que a linha diz respeito
// por natureza («*» = contexto, aparece com qualquer PC), vindos do mockup.
const PC_ID: Record<string, string> = { Lucan: 'c-pc-lucan', Isco: 'c-pc-isco', Quasi: 'c-pc-quasi', Lia: 'c-pc-lia', Tiago: 'c-pc-tiago' }
const linhas: { id: string; tipo?: string; pcs?: string[] }[] = []
for (const linha of semente.linhas) {
  const m = mapa[linha.nome]
  if (!m?.id) continue
  const pcs = linha.pcs?.map((p) => (p === '*' ? '*' : (PC_ID[p] ?? p)))
  linhas.push({ id: m.id, ...(m.tipo ? { tipo: m.tipo } : {}), ...(pcs?.length ? { pcs } : {}) })
}
json('grelha/linhas.json', linhas)
json('grelha/dm.json', [])
const agora = '2026-10-11T22:00:00Z'
const notas: Record<string, unknown>[] = []
let nNota = 0
const nota = (kind: string, target: Record<string, string>, text: string, suggestion?: string) =>
  notas.push({ id: `n-mig-${String(++nNota).padStart(2, '0')}`, at: agora, kind, target, text, ...(suggestion ? { suggestion } : {}), status: 'aberta' })
nota('discrepancia', { row: 'c-skra-sorsk' }, 'O Skr\'a S\'orsk morreu na sessão 2 (#83) no cânone, mas docs/pcs.md, docs/ids.md e um patch antigo dizem sessão 1.', 'Corrigir para sessão 2 nos três sítios.')
nota('discrepancia', { row: 'c-soldado-doente' }, 'A ficha chama-lhe «O soldado doente da jangada», mas à mesa já tem nome: Alex.', 'Passar o nome a «Alex, o soldado da jangada».')
nota('discrepancia', { row: 'c-morgid' }, 'Os estados da ficha dizem só «Guia dos PCs»; à mesa foi-se embora ofendido na sessão 4 e segue o grupo à distância.', 'Acrescentar os estados a partir de b-0-patrulha-imperio.')
nota('pergunta', { row: 's-086' }, 'A sessão 4 tem dois títulos: «A Traição de Alberto» no estado de jogo e «A Patrulha do Forte Ventura» no cânone e no índice.', 'Ficar com «A Traição de Alberto», o título da mesa, e pôr o outro como subtítulo.')
nota('discrepancia', { row: 'i-adaga-drow' }, 'docs/pcs.md e docs/regras.md ainda põem a adaga com o Quasi; desde a sessão 5 está ao cinto do Lucan.', 'Atualizar as duas referências.')
nota('discrepancia', { row: 'docs/fluxo.md' }, 'O último fecho registado é o da sessão 4, mas a sessão 5 já foi fechada.', 'Atualizar a data do último fecho.')
nota('pergunta', { row: 'p-pedro-silva' }, 'docs/pcs.md diz que o Pedro Silva joga 2 a 3 vezes por mês e também que joga todas as semanas.', 'Ficar com «todas as semanas» (cinco sessões seguidas).')
nota('discrepancia', { row: 'b-0-urzin-day', col: 's1' }, 'O dia em Urzin foi jogado na sessão 1 mas não está marcado como jogado.', 'Marcar jogado na sessão 1.')
nota('pergunta', { row: 'b-0-marsh-crossing' }, 'A travessia do pântano está em curso desde a sessão 1, em todas as sessões.', 'Confirmar que fica «em curso» até à chegada ao forte.')
nota('pergunta', { row: 'grelha/linhas.json' }, 'As atitudes atuais dos NPCs (campo atitudeAtual) vieram do mockup, não do registo.', 'Confirmar a lista; passam a efeitos no fecho seguinte.')
nota('pergunta', { row: 's-000' }, 'Os efeitos «sabe» da sessão zero (o que cada PC sabe ao começar) estão por preencher.', 'Preencher a partir de «O que cada PC sabe ao começar», segredo a segredo.')
nota('discrepancia', { row: 'r-pc-lucan-sessinek' }, 'O beat b-0-boneyard-altar está jogado e é pista de r-pc-lucan-sessinek, mas o cânone diz que a revelação «continua a zero».', 'Contar as pistas dadas pelo registo, não pelos beats.')
nota('discrepancia', { row: 'r-bolbara-possessed' }, 'A pista da sessão 5 sobre a Bolbara veio de b-0-patrulha-imperio, que não está nas pistas da revelação.', 'Acrescentar o beat às pistas.')
nota('pergunta', { row: 't-relogio-terceira-vez', col: 's5' }, 'O relógio dos revivify ficou em 2 de 3 por decisão do DM (2026-10-07, #18), sem acontecimento à mesa.', 'Confirmar o valor.')
nota('pergunta', { row: 'registo' }, 'Os acontecimentos das sessões 1 a 5 e os seus efeitos foram gerados a partir do mockup; «envolve» foi preenchido por deteção de nomes no texto.', 'Rever sessão a sessão na Grelha.')
for (const ideia of gerarIdeias(semente, mapa))
  notas.push({ id: `n-mig-${String(++nNota).padStart(2, '0')}`, at: agora, kind: 'ideia', target: { row: ideia.linha, col: ideia.col }, text: ideia.texto, ...(ideia.tags?.length ? { tags: ideia.tags } : {}), factKind: ideia.tipo === 'pc' ? 'cena' : ideia.tipo === 'revelacao' ? 'pista' : 'consequencia', because: ['docs/grelha-semente.json'], status: 'aberta' })
json('grelha/revisao.json', { reviewed: {}, absorbed: {}, notes: notas, lastReview: agora })

// ---- livro: cópia do data/book --------------------------------------------------------------------
// ---- escrever ----------------------------------------------------------------------------------
for (const pasta of ['mundo', 'plano', 'registo', 'mesa', 'grelha', 'livro']) rmSync(join(raiz, pasta), { recursive: true, force: true })
for (const [caminho, conteudo] of saida) {
  const p = join(raiz, caminho)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, conteudo)
}
cpSync(join(raiz, 'data/book'), join(raiz, 'livro'), { recursive: true })
if (!existsSync(join(raiz, 'livro/campaign.json'))) throw new Error('livro/ sem campaign.json')

const contagem: Record<string, number> = {}
for (const c of saida.keys()) {
  const k = c.split('/').slice(0, 2).join('/')
  contagem[k] = (contagem[k] ?? 0) + 1
}
console.log(`${saida.size} ficheiros escritos:`)
for (const [k, v] of Object.entries(contagem).sort()) console.log(`  ${k}: ${v}`)
console.log(`acontecimentos: ${[...acontecimentos.values()].reduce((a, b) => a + b.length, 0)} · notas de revisão: ${notas.length}`)
