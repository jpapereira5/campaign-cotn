import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularEstado } from './estado.ts'
import type { Arvore } from './arquivo/arvore.ts'

const sessao = (n: number, data: string | null, acontecimentos: unknown[], beats: Record<string, string> = {}) => ({
  caminho: `registo/sessoes/s0${n}-x.md`,
  prosa: false,
  body: '',
  meta: { id: `s-00${n}`, n, data, titulo: `S${n}`, mesa: { 'c-pc-lucan': 'p-renata' }, beats, acontecimentos, nivel: 3, mundo: `dia ${n}` },
})

const arvore: Arvore = {
  livro: {},
  grelha: { linhas: [], dm: [], revisao: {} },
  docs: [
    sessao(0, null, [{ id: 'e-s0-01', tipo: 'registo', texto: 'início', envolve: ['c-pc-lucan'], efeitos: [{ sabe: 'r-x', quem: ['c-pc-lucan'], nivel: 'parcial' }] }]),
    sessao(
      1,
      '2026-09-02',
      [
        { id: 'e-s1-01', tipo: 'estado', texto: 'morre', envolve: ['c-npc'], efeitos: [{ estado: 'c-npc', valor: 'morto', onde: 'ossário' }] },
        { id: 'e-s1-02', tipo: 'consequencia', texto: 'adaga', envolve: ['i-adaga', 'c-pc-quasi'], efeitos: [{ posse: 'i-adaga', com: 'c-pc-quasi' }] },
        { id: 'e-s1-03', tipo: 'cena', texto: 'cena', envolve: ['c-pc-lucan'], efeitos: [{ contador: 'insanidade', de: 'c-pc-lucan', mais: 2 }] },
        { id: 'e-s1-04', tipo: 'pista', texto: 'pista', envolve: ['r-x'], efeitos: [{ pista: 'r-x' }, { pista: 'r-x' }] },
      ],
      { 'b-1': 'em-curso' },
    ),
    sessao(
      2,
      '2026-09-09',
      [
        { id: 'e-s2-01', tipo: 'estado', texto: 'muda de mão', envolve: ['i-adaga', 'c-pc-lucan'], efeitos: [{ posse: 'i-adaga', com: 'c-pc-lucan' }], origem: ['e-s1-02'] },
        { id: 'e-s2-02', tipo: 'consequencia', texto: 'sabe', envolve: ['r-x'], efeitos: [{ sabe: 'r-x', quem: ['c-pc-lucan', 'mesa'], nivel: 'total' }, { relogio: 't-rel', valor: 2 }, { fio: 't-prom', valor: 'cumprido' }, { atitude: 'c-npc2', valor: 'hostil' }, { relacao: 'c-npc2', com: 'c-pc-lucan', tipo: 'enemy', valor: 'sim' }, { contador: 'insanidade', de: 'c-pc-lucan', mais: 1 }] },
      ],
      { 'b-1': 'jogado' },
    ),
    sessao(3, '2099-01-01', [{ id: 'e-s3-01', tipo: 'estado', texto: 'futuro', envolve: ['c-npc'], efeitos: [{ estado: 'c-npc', valor: 'vivo' }] }]),
  ],
}

test('o estado vem dos efeitos, por ordem, e a sessão futura não conta', () => {
  const e = calcularEstado(arvore, '2026-10-11')
  assert.equal(e.personagens.get('c-npc')?.estado?.valor, 'morto')
  assert.equal(e.personagens.get('c-npc')?.estado?.onde, 'ossário')
  assert.equal(e.itens.get('i-adaga')?.posse?.com, 'c-pc-lucan')
  assert.equal(e.itens.get('i-adaga')?.posse?.marca.n, 2)
  assert.equal(e.personagens.get('c-pc-lucan')?.contadores.insanidade.valor, 3)
  assert.equal(e.personagens.get('c-pc-lucan')?.cenas.length, 1)
  const seg = e.segredos.get('r-x')!
  assert.equal(seg.pistasDadas.length, 2)
  assert.deepEqual(seg.sabe.map((s) => [s.quem, s.nivel]), [['c-pc-lucan', 'total']])
  assert.equal(seg.mesaSabe?.n, 2)
  assert.equal(e.fios.get('t-rel')?.relogio?.valor, 2)
  assert.equal(e.fios.get('t-prom')?.estado?.valor, 'cumprido')
  assert.equal(e.personagens.get('c-npc2')?.atitude?.valor, 'hostil')
  assert.deepEqual(e.personagens.get('c-npc2')?.relacoes.map((r) => [r.com, r.tipo, r.ativa]), [['c-pc-lucan', 'enemy', true]])
  assert.equal(e.beats.get('b-1')?.estado, 'jogado')
  assert.equal(e.mesa.proximaN, 3)
  assert.equal(e.mesa.mundo, 'dia 2')
  assert.equal(e.mesa.presencas['c-pc-lucan'], 2)
  assert.equal(e.historia.get('i-adaga')?.length, 2)
})
