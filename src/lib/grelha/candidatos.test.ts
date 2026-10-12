import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularEstado } from '../estado.ts'
import { construirGrelha } from './modelo.ts'
import { candidatos } from './candidatos.ts'
import type { Arvore } from '../arquivo/arvore.ts'

const doc = (caminho: string, meta: Record<string, unknown>, body = '') => ({ caminho, meta, body, prosa: false })
const sessao = (n: number, data: string, acontecimentos: unknown[], beats: Record<string, string> = {}) =>
  doc(`registo/sessoes/s0${n}-x.md`, { id: `s-00${n}`, n, data, titulo: `T${n}`, capitulo: 'ch0', mesa: { 'c-pc-lucan': 'p-r' }, beats, acontecimentos, nivel: 3 })
const arvore: Arvore = {
  livro: {},
  grelha: { linhas: [{ id: 'c-pc-lucan' }, { id: 'c-velho' }, { id: 'c-curso' }, { id: 'c-nada' }], dm: [], revisao: { notes: [] } },
  docs: [
    doc('plano/campanha.md', { titulo: 'C', capituloAtual: 'ch0', capitulos: [{ id: 'ch0', nome: 'Prólogo', niveis: '1→3', hub: 'U', resumo: 'p' }] }),
    doc('mundo/personagens/c-pc-lucan.md', { id: 'c-pc-lucan', nome: 'Lucan', tipo: 'pc', facoes: [], capitulos: ['ch0'] }),
    doc('mundo/personagens/c-velho.md', { id: 'c-velho', nome: 'Velho', tipo: 'npc', facoes: [], capitulos: ['ch0'] }),
    doc('mundo/personagens/c-curso.md', { id: 'c-curso', nome: 'Curso', tipo: 'npc', facoes: [], capitulos: ['ch0'] }),
    doc('mundo/personagens/c-nada.md', { id: 'c-nada', nome: 'Nada', tipo: 'npc', facoes: [], capitulos: ['ch0'] }),
    doc('plano/fios/a-p.md', { id: 'a-p', tipo: 'arco', nome: 'P', subtipo: 'main', cor: '#fff', ordem: 1 }),
    doc('plano/beats/b-x.md', { id: 'b-x', titulo: 'Travessia', arcos: ['a-p'], capitulo: 'ch0', ordem: 1, participantes: ['c-curso'] }),
    sessao(1, '2026-09-02', [{ id: 'e-s1-01', tipo: 'consequencia', texto: 'velho aberto', envolve: ['c-velho'] }, { id: 'e-s1-02', tipo: 'cena', texto: 'c', envolve: ['c-pc-lucan'] }]),
    sessao(2, '2026-09-09', [{ id: 'e-s2-01', tipo: 'registo', texto: 'r', envolve: ['c-nada'] }]),
    sessao(3, '2026-09-16', [{ id: 'e-s3-01', tipo: 'registo', texto: 'r', envolve: ['c-nada'] }]),
    sessao(4, '2026-09-23', [{ id: 'e-s4-01', tipo: 'registo', texto: 'r', envolve: ['c-pc-lucan'] }], { 'b-x': 'em-curso' }),
  ],
}

test('candidatos: esquecidos, quem esteve na última sessão, o beat em curso, PC sem cena; quem não tem nada fica de fora', () => {
  const estado = calcularEstado(arvore, '2026-10-11')
  const g = construirGrelha({
    arvore, estado, nome: (id: string) => id, linhas: arvore.grelha.linhas as { id: string }[], notas: [],
    capitulos: [{ id: 'ch0', nome: 'Prólogo', hub: 'U', niveis: '1→3', resumo: 'p' }], capituloAtual: 'ch0', curto: () => 'Prólogo', corPc: () => '#000', alias: {},
  } as never)
  const c = candidatos({ grelha: g, arvore, estado, limiar: 3 })
  assert.ok(c.get('c-velho')?.razoes.some((r) => r.includes('esquecido')))
  assert.ok(c.get('c-curso')?.razoes.some((r) => r.includes('beat em curso: Travessia')))
  assert.ok(c.get('c-pc-lucan')?.razoes.includes('sem cena pessoal planeada'))
  assert.ok(c.get('c-pc-lucan')?.razoes.some((r) => r.startsWith('esteve na S4')))
  assert.equal(c.has('c-nada'), false)
})
