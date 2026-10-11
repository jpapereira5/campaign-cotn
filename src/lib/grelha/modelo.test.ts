import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularEstado } from '../estado.ts'
import { colunasDe, construirGrelha, contagens, linhaVisivel } from './modelo.ts'
import type { Arvore } from '../arquivo/arvore.ts'

const doc = (caminho: string, meta: Record<string, unknown>, body = '') => ({ caminho, meta, body, prosa: false })
const sessao = (n: number, data: string | null, acontecimentos: unknown[], beats: Record<string, string> = {}) =>
  doc(`registo/sessoes/s0${n}-x.md`, { id: `s-00${n}`, n, data, titulo: `T${n}`, capitulo: 'ch0', mesa: { 'c-pc-lucan': 'p-renata' }, beats, acontecimentos, nivel: 3, mundo: `dia ${n}`, resumo: `r${n}`, ondeParou: `o${n}` })

const arvore: Arvore = {
  livro: {},
  grelha: {
    linhas: [{ id: 'c-pc-lucan', pcs: ['c-pc-lucan'] }, { id: 'c-npc', pcs: ['c-pc-lucan'] }, { id: 't-laco', pcs: ['c-pc-lucan'] }, { id: 'r-x' }, { id: 't-prom' }],
    dm: [],
    revisao: { notes: [{ id: 'n-1', kind: 'ideia', status: 'aberta', target: { row: 'c-npc', col: 's3' }, text: 'ideia X' }, { id: 'n-2', kind: 'pergunta', status: 'aberta', target: { row: 'c-npc' }, text: '?' }] },
  },
  docs: [
    doc('plano/campanha.md', { titulo: 'C', capituloAtual: 'ch0', capitulos: [{ id: 'ch0', nome: 'Prólogo', niveis: '1→3', hub: 'Urzin', resumo: 'p' }, { id: 'ch1', nome: 'Um', niveis: '3→4', hub: 'Jigau', resumo: 'u' }] }),
    doc('mundo/personagens/c-pc-lucan.md', { id: 'c-pc-lucan', nome: 'Lucan', tipo: 'pc', facoes: [], capitulos: ['ch0'] }),
    doc('mundo/personagens/c-npc.md', { id: 'c-npc', nome: 'NPC', tipo: 'npc', facoes: [], capitulos: ['ch0'], atitudeAtual: 'hostil', legenda: 'um npc' }),
    doc('plano/fios/t-laco.md', { id: 't-laco', tipo: 'laco', nome: 'Lucan ↔ NPC', par: ['c-pc-lucan', 'c-npc'], envolve: ['c-pc-lucan', 'c-npc'] }),
    doc('plano/fios/t-prom.md', { id: 't-prom', tipo: 'promessa', nome: 'Promessa', envolve: ['c-npc'] }),
    doc('mundo/segredos/r-x.md', { id: 'r-x', nome: 'Segredo X', lista: 'L', pistas: ['b-1'] }, '## Verdade\n\nv'),
    doc('plano/beats/b-1.md', { id: 'b-1', titulo: 'Beat 1', arcos: ['a-main'], capitulo: 'ch1', ordem: 1, participantes: ['c-npc'], revela: ['r-x'], requer: [], escolhas: [] }),
    doc('plano/fios/a-main.md', { id: 'a-main', tipo: 'arco', nome: 'Principal', subtipo: 'main', cor: '#fff', ordem: 1 }),
    sessao(1, '2026-09-02', [
      { id: 'e-s1-01', tipo: 'relacao', texto: 'conhecem-se', envolve: ['t-laco', 'c-pc-lucan', 'c-npc'] },
      { id: 'e-s1-02', tipo: 'promessa', texto: 'promete', envolve: ['t-prom', 'c-npc'] },
      { id: 'e-s1-03', tipo: 'pista', texto: 'pista', envolve: ['r-x'], efeitos: [{ pista: 'r-x' }] },
    ]),
    sessao(2, '2026-09-09', [{ id: 'e-s2-01', tipo: 'cena', texto: 'cena', envolve: ['c-pc-lucan'] }]),
    sessao(3, '2026-09-16', [{ id: 'e-s3-01', tipo: 'consequencia', texto: 'paga', envolve: ['c-npc', 'c-pc-lucan'], origem: ['e-s1-02'] }]),
    sessao(4, '2026-09-23', [{ id: 'e-s4-01', tipo: 'consequencia', texto: 'aberto recente', envolve: ['c-npc'] }]),
  ],
}

const entrada = () => ({
  arvore,
  estado: calcularEstado(arvore, '2026-10-11'),
  nome: (id: string) => id,
  linhas: arvore.grelha.linhas as { id: string; pcs?: string[] }[],
  notas: (arvore.grelha.revisao as { notes: Record<string, unknown>[] }).notes,
  capitulos: [{ id: 'ch0', nome: 'Prólogo', hub: 'Urzin', niveis: '1→3', resumo: 'p' }, { id: 'ch1', nome: 'Um', hub: 'Jigau', niveis: '3→4', resumo: 'u' }],
  capituloAtual: 'ch0',
  curto: (c: string) => (c === 'ch0' ? 'Prólogo' : '1'),
  corPc: () => '#000',
})

test('colunas: sessões jogadas, próxima, resto do capítulo, capítulos seguintes', () => {
  const { colunas, proximaN } = colunasDe(calcularEstado(arvore, '2026-10-11').mesa.sessoes, entrada().capitulos, 'ch0', entrada().curto)
  assert.deepEqual(colunas.map((c) => c.chave), ['s1', 's2', 's3', 's4', 's5', 'ch0', 'ch1'])
  assert.equal(proximaN, 5)
  assert.equal(colunas[3].tipo, 'atual')
})

test('células: dona, ecos, estados, esquecidos, plano do cânone, ideias, sem cena', () => {
  const g = construirGrelha(entrada())
  const l = Object.fromEntries(g.linhas.map((x) => [x.id, x]))
  assert.equal(l['t-laco'].celulas.s1.itens[0].estatuto, 'esquecido') // aberto desde S1, próxima é S5
  assert.equal(l['c-npc'].celulas.s1.ecos.length, 2) // eco do laço e da promessa
  assert.equal(l['t-prom'].celulas.s1.itens[0].estatuto, 'pago') // pago em S3
  assert.equal(l['c-npc'].celulas.s3.itens[0].origemLabel, '← S1')
  assert.equal(l['c-npc'].celulas.s4.itens[0].estatuto, 'aberto') // há 1 sessão: não está esquecido
  assert.equal(l['r-x'].celulas.s1.itens[0].estatuto, 'pista')
  assert.equal(l['r-x'].pistas, 1)
  assert.equal(l['c-pc-lucan'].celulas.s2.itens[0].estatuto, 'registo')
  assert.equal(l['c-pc-lucan'].celulas.s5.itens[0].tipo, 'falta')
  assert.equal(l['c-npc'].celulas.ch1.itens[0].tipo, 'plano-canone')
  assert.equal(l['r-x'].celulas.ch1.itens.some((i) => i.texto.includes('pista')), true)
  assert.equal(l['c-npc'].celulas.s3.itens.some((i) => i.tipo === 'ideia'), true)
  assert.equal(l['c-npc'].notas, 1)
  assert.equal(l['c-npc'].atitude, 'hostil')
  assert.equal(l['sessao:mundo'].celulas.s4.itens[0].texto, 'dia 4')
  assert.equal(l['sessao:resumo'].celulas.ch1.itens[0].texto, 'Um')
  const vis = g.linhas.filter((x) => linhaVisivel(x, { grupo: 'todos', pc: 'c-pc-lucan', soPendentes: false })).map((x) => x.id)
  assert.ok(vis.includes('t-laco') && vis.includes('c-npc') && vis.includes('sessao:mundo') && !vis.includes('r-x'))
  const c = contagens(g.linhas, 's5', 1)
  assert.equal(c.esquecidos, 1)
  assert.equal(c.abertos, 3) // o laço (esquecido), a consequência de S3 e a de S4
  assert.equal(c.faltas, 1)
  assert.equal(g.plano.arcos[0].porCapitulo.ch1[0].id, 'b-1')
})
