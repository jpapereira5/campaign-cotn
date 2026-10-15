import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aplicarPv, estadoInicial, ferimento, normalizarBatalha, ordemIniciativa, proximaVez, rolarIniciativa, sortear } from './batalha.ts'

const raw = {
  id: 't',
  nome: 'Teste',
  modelos: { lac: { lado: 'inimigo', ca: 12, pv: 22, ini: 2, acoes: [{ nome: 'Garras', falha: ['a', 'b', 'c'] }] } },
  zonas: { lac: [{ d: 1, zona: 'Cabeça', texto: 'x' }] },
  combatentes: [
    { id: 'l1', nome: 'L1', modelo: 'lac', grupo: 'g' },
    { id: 'l2', nome: 'L2', modelo: 'lac', grupo: 'g' },
    { id: 'pc', nome: 'PC', lado: 'pc', pv: 24, ini: 2 },
    { id: 'alex', nome: 'Alex', lado: 'aliado', passivo: true },
  ],
}

test('os modelos aplicam-se aos combatentes', () => {
  const b = normalizarBatalha(raw)
  assert.equal(b.combatentes[0].pv, 22)
  assert.equal(b.combatentes[0].acoes?.[0].nome, 'Garras')
  assert.equal(b.combatentes[0].zonas, 'lac')
})

test('ferimento: magoado acima de metade, ferido a metade ou menos, caído a 0', () => {
  assert.equal(ferimento({ pv: 22, max: 22, cond: [] }), 'ileso')
  assert.equal(ferimento({ pv: 12, max: 22, cond: [] }), 'magoado')
  assert.equal(ferimento({ pv: 11, max: 22, cond: [] }), 'ferido')
  assert.equal(ferimento({ pv: 0, max: 22, cond: [] }), 'caido')
  assert.equal(ferimento({ cond: [] }), 'desconhecido')
})

test('o dano gasta primeiro os PV temporários; a cura não passa do máximo', () => {
  assert.deepEqual(aplicarPv({ pv: 20, max: 24, temp: 5, cond: [] }, -8), { pv: 17, max: 24, temp: undefined, cond: [] })
  assert.equal(aplicarPv({ pv: 20, max: 24, cond: [] }, 10).pv, 24)
  assert.equal(aplicarPv({ pv: 3, max: 24, cond: [] }, -10).pv, 0)
})

test('o grupo partilha a iniciativa; PCs e passivos não rolam', () => {
  const b = normalizarBatalha(raw)
  const s = rolarIniciativa(b, estadoInicial(b), () => 10)
  assert.equal(s.c.l1.ini, 12)
  assert.equal(s.c.l2.ini, 12)
  assert.equal(s.c.pc.ini, undefined)
  assert.equal(s.c.alex.ini, undefined)
})

test('a vez salta passivos e quem está fora; a ronda sobe ao dar a volta', () => {
  const b = normalizarBatalha(raw)
  let s = estadoInicial(b)
  s.c.pc.ini = 15
  s.c.l1.ini = 10
  s.c.l2.ini = 10
  s.c.l2.fora = true
  assert.deepEqual(ordemIniciativa(b, s).map((c) => c.id).slice(0, 3), ['pc', 'l1', 'l2'])
  s = proximaVez(b, s)
  assert.equal(s.vez, 'pc')
  assert.equal(s.ronda, 1)
  s = proximaVez(b, s)
  assert.equal(s.vez, 'l1')
  s = proximaVez(b, s)
  assert.equal(s.vez, 'pc')
  assert.equal(s.ronda, 2)
})

test('sortear nunca repete a última', () => {
  for (let k = 0; k < 50; k++) {
    const r = Math.random
    assert.notEqual(sortear(['a', 'b', 'c'], 1, r), 1)
  }
  assert.equal(sortear(['a'], 0), 0)
  assert.equal(sortear([], undefined), -1)
  const vistos = new Set<number>()
  for (let k = 0; k < 200; k++) vistos.add(sortear(['a', 'b', 'c'], undefined))
  assert.equal(vistos.size, 3)
})
