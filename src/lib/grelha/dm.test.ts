import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularEstado } from '../estado.ts'
import { construirGrelha } from './modelo.ts'
import { aplicarDm, fundirDm, porRever, revisaoVazia, type DmEntry } from './dm.ts'
import { tipoLinhaDe } from './dona.ts'
import type { Arvore } from '../arquivo/arvore.ts'

const doc = (caminho: string, meta: Record<string, unknown>, body = '') => ({ caminho, meta, body, prosa: false })
const sessao = (n: number, data: string, acontecimentos: unknown[]) =>
  doc(`registo/sessoes/s0${n}-x.md`, { id: `s-00${n}`, n, data, titulo: `T${n}`, capitulo: 'ch0', mesa: { 'c-pc-lucan': 'p-renata' }, beats: {}, acontecimentos, nivel: 3 })

const arvore: Arvore = {
  livro: {},
  grelha: { linhas: [{ id: 'c-pc-lucan', pcs: ['c-pc-lucan'] }, { id: 'c-npc' }, { id: 't-prom' }], dm: [], revisao: { notes: [{ id: 'n-1', kind: 'ideia', status: 'aberta', target: { row: 'c-npc', col: 's3' }, text: 'ideia' }, { id: 'n-2', kind: 'pergunta', status: 'aberta', target: { row: 'c-npc' }, text: '?' }] } },
  docs: [
    doc('plano/campanha.md', { titulo: 'C', capituloAtual: 'ch0', capitulos: [{ id: 'ch0', nome: 'Prólogo', niveis: '1→3', hub: 'Urzin', resumo: 'p' }] }),
    doc('mundo/personagens/c-pc-lucan.md', { id: 'c-pc-lucan', nome: 'Lucan', tipo: 'pc', facoes: [], capitulos: ['ch0'] }),
    doc('mundo/personagens/c-npc.md', { id: 'c-npc', nome: 'NPC', tipo: 'npc', facoes: [], capitulos: ['ch0'] }),
    doc('plano/fios/t-prom.md', { id: 't-prom', tipo: 'promessa', nome: 'Promessa', envolve: ['c-npc'] }),
    doc('plano/fios/t-laco.md', { id: 't-laco', tipo: 'laco', nome: 'Laço', par: ['c-pc-lucan', 'c-npc'], envolve: ['c-pc-lucan', 'c-npc'] }),
    sessao(1, '2026-09-02', [{ id: 'e-s1-01', tipo: 'promessa', texto: 'promete', envolve: ['t-prom', 'c-npc'] }, { id: 'e-s1-02', tipo: 'cena', texto: 'cena', envolve: ['c-pc-lucan'] }]),
    sessao(2, '2026-09-09', [{ id: 'e-s2-01', tipo: 'consequencia', texto: 'aberto', envolve: ['c-npc'] }]),
  ],
}

const base = () => {
  const estado = calcularEstado(arvore, '2026-10-11')
  const tipos = new Map<string, string>([['c-pc-lucan', 'pc'], ['c-npc', 'npc'], ['t-prom', 'promessa'], ['t-laco', 'laco']])
  const g = construirGrelha({
    arvore, estado, nome: (id) => id, linhas: arvore.grelha.linhas as { id: string }[], notas: (arvore.grelha.revisao as { notes: Record<string, unknown>[] }).notes,
    capitulos: [{ id: 'ch0', nome: 'Prólogo', hub: 'Urzin', niveis: '1→3', resumo: 'p' }], capituloAtual: 'ch0', curto: () => 'Prólogo', corPc: () => '#000',
  })
  const ctx = { tipoLinha: tipoLinhaDe(tipos), nome: (id: string) => id, jogadas: new Set(['s1', 's2']), proximaChave: 's3', rotuloColuna: (c: string) => `→ ${c.toUpperCase()}` }
  return { g, ctx }
}

test('planos, correções, arquivo, decisão, linha nova, resposta e ideia rejeitada', () => {
  const { g, ctx } = base()
  const dm: DmEntry[] = [
    { id: 'd-1', at: '2026-10-12T10:00:00Z', kind: 'plano', row: 'c-npc', col: 's3', factKind: 'consequencia', text: 'o npc volta', involves: ['c-npc', 'c-pc-lucan'], origin: ['e-s1-01'], prepared: true },
    { id: 'd-2', at: '2026-10-12T10:01:00Z', kind: 'plano', row: 'c-pc-lucan', col: 's3', factKind: 'cena', text: 'cena do Lucan', involves: ['c-pc-lucan'] },
    { id: 'd-3', at: '2026-10-12T10:02:00Z', kind: 'correcao', fact: 'e-s2-01', patch: { text: 'corrigido' } },
    { id: 'd-4', at: '2026-10-12T10:03:00Z', kind: 'arquivo', fact: 'e-s2-01' },
    { id: 'd-5', at: '2026-10-12T10:04:00Z', kind: 'decisao', row: 'c-npc', patch: { atitudeAtual: 'hostil', legenda: 'mudou' } },
    { id: 'd-6', at: '2026-10-12T10:05:00Z', kind: 'linha', patch: { id: 't-laco', type: 'laco', name: 'Lucan ↔ NPC' } },
    { id: 'd-7', at: '2026-10-12T10:06:00Z', kind: 'resposta', note: 'n-2', text: 'sim' },
    { id: 'd-8', at: '2026-10-12T10:07:00Z', kind: 'ideia-rejeitada', idea: 'n-1' },
    { id: 'd-9', at: '2026-10-12T10:08:00Z', kind: 'plano', row: 'c-npc', col: 's1', factKind: 'consequencia', text: 'ficou para trás', involves: ['c-npc'] },
    { id: 'd-10', at: '2026-10-12T10:09:00Z', kind: 'nota', text: 'solta' },
    { id: 'd-11', at: '2026-10-12T10:10:00Z', kind: 'plano', row: 'c-npc', col: 's3', text: 'apagado', involves: ['c-npc'], deleted: true },
  ]
  const r = { ...revisaoVazia(), notes: (arvore.grelha.revisao as { notes: never[] }).notes, reviewed: { 'd-5': '2026-10-12T10:04:00Z' } }
  const extra = aplicarDm(g, dm, r, ctx)
  const l = Object.fromEntries(g.linhas.map((x) => [x.id, x]))
  const s3 = l['c-npc'].celulas.s3.itens
  assert.equal(s3.filter((i) => i.tipo === 'plano').length, 1) // d-1; d-11 está apagado
  assert.equal(s3[0].estatuto, 'planeado')
  assert.equal(l['t-prom'].celulas.s1.itens[0].estatuto, 'planeado') // o plano aponta para a promessa
  assert.equal(l['t-prom'].celulas.s1.itens[0].planeadoEm, '→ S3')
  assert.equal(l['c-pc-lucan'].celulas.s3.ecos.length, 1) // eco do plano d-1
  assert.equal(l['c-pc-lucan'].celulas.s3.itens.some((i) => i.tipo === 'falta'), false) // a cena planeada tira o «sem cena»
  assert.equal(l['c-pc-lucan'].celulas.s3.itens.find((i) => i.tipo === 'plano')?.estatuto, 'falta') // sem prepared
  const corrigido = l['c-npc'].celulas.s2.itens[0]
  assert.equal(corrigido.texto, 'corrigido')
  assert.equal(corrigido.original, 'aberto')
  assert.equal(corrigido.estatuto, 'fechado') // arquivado
  assert.equal(corrigido.arquivado, true)
  assert.equal(l['c-npc'].atitude, 'hostil')
  assert.equal(l['c-npc'].legenda, 'mudou')
  assert.equal(l['c-npc'].porRever, true) // d-1 e d-3 por rever; d-5 revista
  assert.ok(l['t-laco'])
  assert.equal(l['t-laco'].tipo, 'laco')
  assert.equal(l['c-npc'].notas, 0) // n-2 respondida
  assert.equal(s3.some((i) => i.tipo === 'ideia'), false) // n-1 rejeitada
  assert.equal(extra.planosPassados.length, 1)
  assert.equal(extra.planosPassados[0].entrada.id, 'd-9')
  assert.equal(extra.notasSoltas.length, 1)
  assert.equal(porRever(dm[4], r), false)
  assert.equal(porRever({ ...dm[4], at: '2026-10-13T00:00:00Z' }, r), true)
})

test('fusão por id: fica a versão mais recente', () => {
  const a: DmEntry[] = [{ id: 'd-1', at: '1', kind: 'nota', text: 'velho' }, { id: 'd-2', at: '1', kind: 'nota', text: 'só a' }]
  const b: DmEntry[] = [{ id: 'd-1', at: '2', kind: 'nota', text: 'novo' }, { id: 'd-3', at: '3', kind: 'nota', text: 'só b' }]
  const f = fundirDm(a, b)
  assert.deepEqual(f.map((e) => [e.id, e.text]), [['d-2', 'só a'], ['d-1', 'novo'], ['d-3', 'só b']])
})
