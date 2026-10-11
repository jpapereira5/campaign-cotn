// Monta o pacote de dados para a app a partir da estrutura nova: node scripts/montar.ts [--warn]
// Lê mundo/, plano/, registo/, mesa/, livro/ e grelha/, valida (scripts/lib/validar-arvore.ts) e escreve
// src/generated/dados.json (ignorado pelo git), que a app importa. Com erros, sai com código 1: o deploy não passa.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { lerArvore, porPasta } from './lib/arvore.ts'
import { validarArvore } from './lib/validar-arvore.ts'
import { calcularEstado } from '../src/lib/estado.ts'

const raiz = resolve(import.meta.dirname, '..')
const arvore = lerArvore(raiz)
const problemas = validarArvore(arvore)

const errors = problemas.filter((p) => p.level === 'error')
const warns = problemas.filter((p) => p.level === 'warn')
for (const p of errors) console.error(`✖ ${p.where}: ${p.message}`)
if (process.argv.includes('--warn') || process.argv.includes('-w')) for (const p of warns) console.warn(`⚠ ${p.where}: ${p.message}`)

const dados = { geradoEm: new Date().toISOString(), docs: arvore.docs, livro: arvore.livro, grelha: arvore.grelha }
const dir = join(raiz, 'src/generated')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'dados.json'), JSON.stringify(dados) + '\n')

const p = porPasta(arvore)
const estado = calcularEstado(arvore)
const relacoes = [...p.personagens, ...p.facoes].reduce((n, d) => n + (Array.isArray(d.meta.relacoes) ? d.meta.relacoes.length : 0), 0)
const acontecimentos = estado.mesa.sessoes.reduce((n, s) => n + s.acontecimentos.length, 0)
const capitulos = Array.isArray(p.campanha?.meta.capitulos) ? p.campanha!.meta.capitulos.length : 0
console.log(
  `estrutura: ${arvore.docs.length} ficheiros · capítulos ${capitulos} · personagens ${p.personagens.length} · fações ${p.facoes.length} · locais ${p.locais.length} · itens ${p.itens.length} · segredos ${p.segredos.length} · beats ${p.beats.length} · fios ${p.fios.length} · relações ${relacoes}`,
)
console.log(`registo: ${estado.mesa.sessoes.filter((s) => s.jogada).length} sessões jogadas · ${acontecimentos} acontecimentos · próxima S${estado.mesa.proximaN} · camada do DM: ${Array.isArray(arvore.grelha.dm) ? arvore.grelha.dm.length : 0} entradas`)
console.log(`${errors.length} erro(s), ${warns.length} aviso(s)${warns.length && !process.argv.includes('--warn') ? ' (usa --warn para os ver)' : ''}`)
if (errors.length) process.exitCode = 1
