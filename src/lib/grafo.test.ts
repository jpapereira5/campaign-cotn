import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularEstado } from './estado.ts'
import { Campanha } from './campanha.ts'
import { construirGrafo, filtrosPorDefeito, relacoesDe } from './grafo.ts'
import { pesquisar } from './pesquisa.ts'
import { Indice } from './ficha.ts'
import type { Arvore } from './arquivo/arvore.ts'

const doc = (caminho: string, meta: Record<string, unknown>, body = '') => ({ caminho, meta, body, prosa: false })
const arvore: Arvore = {
  livro: {},
  grelha: { linhas: [], dm: [], revisao: { notes: [] } },
  docs: [
    doc('plano/campanha.md', { titulo: 'C', capituloAtual: 'ch0', convergencia: 'b-1', capitulos: [{ id: 'ch0', nome: 'Prólogo', niveis: '1→3', hub: 'Urzin', resumo: 'p' }, { id: 'ch1', nome: 'Um', niveis: '3→4', hub: 'Jigau', resumo: 'u' }] }),
    doc('mundo/personagens/c-pc-lucan.md', { id: 'c-pc-lucan', nome: 'Lucan', tipo: 'pc', facoes: [], capitulos: ['ch0', 'ch1'] }),
    doc('mundo/personagens/c-npc.md', { id: 'c-npc', nome: 'Morgid', tipo: 'npc', facoes: ['f-x'], capitulos: ['ch0'], relacoes: [{ com: 'c-pc-lucan', tipo: 'ally', nota: 'guia', origem: 'livro' }, { com: 'c-tarde', tipo: 'enemy', desde: 'b-1', origem: 'livro' }] }, '## Resumo\n\nUm lizardfolk do pântano.'),
    doc('mundo/personagens/c-tarde.md', { id: 'c-tarde', nome: 'Aloysia', tipo: 'npc', facoes: [], capitulos: ['ch1'] }),
    doc('mundo/facoes/f-x.md', { id: 'f-x', nome: 'Kryn', lideres: [], aliados: [], inimigos: [] }),
    doc('plano/fios/a-main.md', { id: 'a-main', tipo: 'arco', nome: 'Principal', subtipo: 'main', cor: '#fff', ordem: 1 }),
    doc('plano/fios/a-pc-lucan.md', { id: 'a-pc-lucan', tipo: 'arco', nome: 'Lucan', subtipo: 'pcAmbition', cor: '#5fb0a0', pc: 'c-pc-lucan', ordem: 101 }),
    doc('plano/beats/b-1.md', { id: 'b-1', titulo: 'Beat um', arcos: ['a-main'], capitulo: 'ch1', ordem: 10, participantes: ['c-tarde'] }),
    doc('registo/sessoes/s01-x.md', { id: 's-001', n: 1, data: '2026-09-02', titulo: 'T1', capitulo: 'ch0', mesa: { 'c-pc-lucan': 'p-r' }, beats: {}, acontecimentos: [{ id: 'e-s1-01', tipo: 'relacao', texto: 'o Morgid passa a inimigo', envolve: ['c-npc', 'c-pc-lucan'], efeitos: [{ relacao: 'c-npc', com: 'c-pc-lucan', tipo: 'enemy', valor: 'sim' }, { relacao: 'c-npc', com: 'c-pc-lucan', tipo: 'ally', valor: 'nao' }] }] }),
  ],
}
const estado = calcularEstado(arvore, '2026-10-11')
const campanha = new Campanha(arvore)
const corTipo = { pc: '#1', npc: '#2', rival: '#3', deity: '#4' }

test('campanha: capítulos, atual, cores dos PCs, posição dos beats', () => {
  assert.equal(campanha.capituloAtual, 'ch0')
  assert.equal(campanha.curto('ch0'), 'Prólogo')
  assert.equal(campanha.curto('ch1'), '1')
  assert.equal(campanha.corPc('c-pc-lucan'), '#5fb0a0')
  assert.equal(campanha.posicaoBeat(campanha.beats[0]), 1010)
  assert.equal(campanha.fimDoCapitulo('ch0'), 999)
})

test('relações: o registo substitui o cabeçalho; desde/ate pelo capítulo', () => {
  const rels = relacoesDe(arvore, estado)
  assert.deepEqual(rels.filter((r) => r.de === 'c-npc' && r.com === 'c-pc-lucan').map((r) => [r.tipo, r.fonte]), [['enemy', 'registo']]) // o ally caiu, o enemy é do registo
  const base = { arvore, campanha, estado, filtros: filtrosPorDefeito(), corTipo, corFacao: () => '#f' }
  const ch0 = construirGrafo({ ...base, capitulo: 'ch0' })
  assert.deepEqual(ch0.nos.map((n) => n.id).sort(), ['c-npc', 'c-pc-lucan', 'f-x']) // a Aloysia só entra no ch1
  assert.equal(ch0.arestas.length, 1) // a relação com a Aloysia começa em b-1 (ch1) e ela nem está
  const ch1 = construirGrafo({ ...base, capitulo: 'ch1' })
  assert.deepEqual(ch1.nos.map((n) => n.id).sort(), ['c-pc-lucan', 'c-tarde']) // o Morgid só entra no ch0
  const ateAgora = construirGrafo({ ...base, filtros: { ...filtrosPorDefeito(), ambito: 'ate-agora' }, capitulo: 'ch1' })
  assert.deepEqual(ateAgora.nos.map((n) => n.id).sort(), ['c-npc', 'c-pc-lucan', 'c-tarde', 'f-x'])
  assert.equal(ateAgora.arestas.length, 2) // a do registo e a que começa em b-1
  const registo = construirGrafo({ ...base, filtros: { ...filtrosPorDefeito(), ambito: 'registo' }, capitulo: 'ch1' })
  assert.deepEqual(registo.nos.map((n) => n.id).sort(), ['c-npc', 'c-pc-lucan', 'f-x']) // só quem já entrou no registo, mais as fações deles
  const ego = construirGrafo({ ...base, filtros: { ...filtrosPorDefeito(), ambito: 'tudo', ego: true }, capitulo: 'ch1', foco: 'c-tarde' })
  assert.deepEqual(ego.nos.map((n) => n.id).sort(), ['c-npc', 'c-tarde'])
})

test('pesquisa: título primeiro, corpo depois, sem acentos', () => {
  const indice = new Indice(arvore)
  const r = pesquisar(indice, 'morg', (c) => c)
  assert.equal(r[0]?.id, 'c-npc')
  assert.equal(r[0]?.sub, 'NPC · ch0')
  assert.equal(pesquisar(indice, 'pantano', (c) => c)[0]?.id, 'c-npc') // pelo corpo, sem o til
  assert.equal(pesquisar(indice, 'T1', (c) => c)[0]?.id, 's-001') // sessões também
  assert.equal(pesquisar(indice, 'x', (c) => c).length, 0) // menos de 2 letras
})
