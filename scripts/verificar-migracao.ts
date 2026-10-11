// Verifica a migração (docs/arquitetura.md, secção 10): node scripts/verificar-migracao.ts
// 1. O cânone remontado a partir da estrutura nova (pelo adaptador) é igual ao cânone antigo (data/), entidade a entidade,
//    campo a campo, relação a relação; o estado de jogo também.
// 2. Cada secção dos docs antigos (regras, lore, handouts, pcs, canone, sessões) existe, palavra por palavra, na árvore nova.
// Só faz sentido enquanto data/ e docs/ antigos existirem (fase A → E).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { lerAntigo, canonDeFicheiros } from './lib/antigo.ts'
import { lerArvore } from './lib/arvore.ts'
import { adaptarParaAntigo } from '../src/lib/arquivo/adaptador.ts'
import { secoesNivel } from '../src/lib/arquivo/md.ts'
import { COLLECTIONS } from '../src/lib/types.ts'

const raiz = resolve(import.meta.dirname, '..')
const antigo = lerAntigo(raiz)
const arvore = lerArvore(raiz)
const adaptado = adaptarParaAntigo(arvore)
const novo = canonDeFicheiros(adaptado.ficheiros)

const erros: string[] = []
const avisos: string[] = []
const ok: string[] = []

const ORIGENS_NOVAS = new Set(['grelha', 'regras', 'handouts'])
const origemDe = (id: string): string[] => {
  const d = arvore.docs.find((x) => x.meta.id === id)
  return Array.isArray(d?.meta.origem) ? (d!.meta.origem as string[]) : []
}

const ordenar = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(ordenar)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, ordenar(o[k])]))
  }
  return v
}
const igual = (a: unknown, b: unknown) => JSON.stringify(ordenar(a)) === JSON.stringify(ordenar(b))
const camposDiferentes = (a: Record<string, unknown>, b: Record<string, unknown>): string[] =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !igual(a[k], b[k]))

const noLivro = new Set<string>()
for (const col of COLLECTIONS) if (col !== 'relations') for (const x of antigo.book[col] as { id?: string }[]) if (x.id) noLivro.add(`${col}/${x.id}`)
const marcadores: string[] = []

// ---- 1. cânone -----------------------------------------------------------------------------
if (igual(antigo.canon.campaign, novo.canon.campaign)) ok.push('campanha igual')
else erros.push(`campanha difere: ${camposDiferentes(antigo.canon.campaign as unknown as Record<string, unknown>, novo.canon.campaign as unknown as Record<string, unknown>).join(', ')}`)

for (const col of COLLECTIONS) {
  if (col === 'relations') continue
  const velhos = new Map((antigo.canon[col] as { id: string }[]).map((x) => [x.id, x as unknown as Record<string, unknown>]))
  const novos = new Map((novo.canon[col] as { id: string }[]).map((x) => [x.id, x as unknown as Record<string, unknown>]))
  let iguais = 0
  const acrescentos: string[] = []
  for (const [id, v] of velhos) {
    const n = novos.get(id)
    if (!n) {
      erros.push(`${col}/${id}: falta na estrutura nova`)
      continue
    }
    const dif = camposDiferentes(v, n)
    if (dif.length) erros.push(`${col}/${id}: difere em ${dif.join(', ')}`)
    else iguais++
    const lv = antigo.layers.entities.get(`${col}/${id}`) ?? 'book'
    const ln = novo.layers.entities.get(`${col}/${id}`) ?? 'book'
    if (lv !== ln) {
      // Uma entidade criada pela campanha e corrigida por um segundo ficheiro de patches levava ▲ («alterado face ao livro»)
      // sem estar no livro; na estrutura nova leva ✚, que é o certo.
      if (lv === 'modified' && ln === 'campaign' && !noLivro.has(`${col}/${id}`)) marcadores.push(`${col}/${id}`)
      else erros.push(`${col}/${id}: camada ${lv} → ${ln}`)
    }
  }
  for (const id of novos.keys()) {
    if (velhos.has(id)) continue
    const o = origemDe(id)
    if (o.length && o.every((t) => ORIGENS_NOVAS.has(t))) acrescentos.push(id)
    else erros.push(`${col}/${id}: entidade nova sem origem esperada (${o.join(', ') || 'sem origem'})`)
  }
  ok.push(`${col}: ${iguais}/${velhos.size} iguais${acrescentos.length ? ` · acrescentos do mockup: ${acrescentos.join(', ')}` : ''}`)
}

const chave = (r: Record<string, unknown>) => JSON.stringify(ordenar(r))
const relsVelhas = new Map(antigo.canon.relations.map((r) => [chave(r as unknown as Record<string, unknown>), r]))
const relsNovas = new Map(novo.canon.relations.map((r) => [chave(r as unknown as Record<string, unknown>), r]))
const faltam = [...relsVelhas.keys()].filter((k) => !relsNovas.has(k))
const sobram = [...relsNovas.keys()].filter((k) => !relsVelhas.has(k))
for (const k of faltam) erros.push(`relação em falta: ${k}`)
for (const k of sobram) erros.push(`relação a mais: ${k}`)
if (!faltam.length && !sobram.length) ok.push(`relações: ${relsVelhas.size} iguais`)
if (antigo.layers.relations.size !== novo.layers.relations.size) erros.push(`relações na camada campanha: ${antigo.layers.relations.size} → ${novo.layers.relations.size}`)

// ---- 2. estado de jogo ---------------------------------------------------------------------
const s0 = antigo.state
const s1 = adaptado.state
const conj = (a: string[]) => [...a].sort()
if (igual(conj(s0.playedBeats), conj(s1.playedBeats))) ok.push(`beats jogados: ${s1.playedBeats.length} iguais`)
else erros.push(`beats jogados: ${JSON.stringify(s0.playedBeats)} → ${JSON.stringify(s1.playedBeats)}`)
if (igual(s0.sessions, s1.sessions)) ok.push(`sessões: ${s1.sessions.length} iguais`)
else {
  for (const v of s0.sessions) {
    const n = s1.sessions.find((x) => x.id === v.id)
    if (!n) erros.push(`sessão ${v.id} em falta`)
    else {
      const dif = camposDiferentes(v as unknown as Record<string, unknown>, n as unknown as Record<string, unknown>)
      if (dif.length) erros.push(`sessão ${v.id} difere em ${dif.join(', ')}`)
    }
  }
}
if (s0.currentChapter !== s1.currentChapter) erros.push(`capítulo atual: ${s0.currentChapter} → ${s1.currentChapter}`)
for (const k of ['revealed', 'portentsDone', 'attitudes', 'flags', 'notes'] as const) if (!igual(s0[k], s1[k])) erros.push(`estado ${k} difere`)

// ---- 3. docs: nada se perde ------------------------------------------------------------------
function listar(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) out.push(...listar(p, ext))
    else if (f.endsWith(ext)) out.push(p)
  }
  return out
}
const normalizar = (t: string) => t.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim()
const palheiro = normalizar(['mundo', 'plano', 'registo', 'mesa'].flatMap((p) => listar(join(raiz, p), '.md')).map((p) => readFileSync(p, 'utf8')).join('\n\n'))

const DOCS = ['docs/regras.md', 'docs/lore.md', 'docs/handouts.md', 'docs/pcs.md', 'docs/canone.md', ...listar(join(raiz, 'docs/sessoes'), '.md').map((p) => relative(raiz, p)).filter((p) => !p.endsWith('README.md'))]
let secoesVistas = 0
let secoesEmFalta = 0
for (const rel of DOCS) {
  const texto = readFileSync(join(raiz, rel), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '')
  const partes: { onde: string; texto: string }[] = []
  const h2 = secoesNivel(texto, 2)
  if (h2.intro.trim()) partes.push({ onde: 'intro', texto: h2.intro })
  for (const s of h2.secoes) {
    const h3 = secoesNivel(s.texto, 3)
    if (h3.secoes.length) {
      if (h3.intro.trim()) partes.push({ onde: `${s.titulo} (intro)`, texto: h3.intro })
      for (const t of h3.secoes) partes.push({ onde: `${s.titulo} › ${t.titulo}`, texto: t.texto })
    } else partes.push({ onde: s.titulo, texto: s.texto })
  }
  for (const p of partes) {
    const n = normalizar(p.texto)
    if (!n) continue
    secoesVistas++
    if (!palheiro.includes(n)) {
      secoesEmFalta++
      erros.push(`${rel} › ${p.onde}: texto não encontrado na árvore nova (${n.length} chars)`)
    }
  }
}
ok.push(`docs: ${secoesVistas - secoesEmFalta}/${secoesVistas} secções encontradas palavra por palavra`)

if (marcadores.length) avisos.push(`${marcadores.length} entidades criadas pela campanha passam de ▲ a ✚ (não estão no livro): ${marcadores.join(', ')}`)

// ---- relatório --------------------------------------------------------------------------------
console.log('VERIFICAÇÃO DA MIGRAÇÃO')
for (const l of ok) console.log(`✓ ${l}`)
for (const l of avisos) console.log(`⚠ ${l}`)
for (const l of erros) console.log(`✖ ${l}`)
console.log(`${erros.length} diferença(s)`)
if (erros.length) process.exitCode = 1
