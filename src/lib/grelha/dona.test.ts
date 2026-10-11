import { test } from 'node:test'
import assert from 'node:assert/strict'
import { donaDe, tipoLinhaDe } from './dona.ts'

const tipos = new Map<string, string>([
  ['c-pc-lucan', 'pc'],
  ['c-pc-quasi', 'pc'],
  ['c-morgid', 'npc'],
  ['t-laco-lucan-quasi', 'laco'],
  ['t-promessa-800po', 'promessa'],
  ['t-decisao-mapa-morgid', 'decisao'],
])
const tipoLinha = tipoLinhaDe(tipos)

test('cada tipo tem uma dona única', () => {
  assert.equal(donaDe('relacao', ['t-laco-lucan-quasi', 'c-pc-lucan', 'c-pc-quasi'], tipoLinha), 't-laco-lucan-quasi')
  assert.equal(donaDe('promessa', ['c-corvelo', 't-promessa-800po'], tipoLinha), 't-promessa-800po')
  assert.equal(donaDe('escolha', ['t-decisao-mapa-morgid', 'c-pc-lucan', 'c-morgid'], tipoLinha), 't-decisao-mapa-morgid')
  assert.equal(donaDe('pista', ['r-pc-lucan-adaga', 'c-pc-lucan'], tipoLinha), 'r-pc-lucan-adaga')
  assert.equal(donaDe('cena', ['c-morgid', 'c-pc-lucan', 'c-pc-quasi'], tipoLinha), 'c-pc-lucan')
  assert.equal(donaDe('consequencia', ['c-morgid', 'c-pc-lucan'], tipoLinha), 'c-morgid')
  assert.equal(donaDe('estado', ['i-adaga-drow', 'c-pc-lucan'], tipoLinha), 'i-adaga-drow')
  assert.equal(donaDe('registo', ['p-renata'], tipoLinha), 'p-renata')
})

test('sem a linha certa, ou com duas, a dona é ambígua', () => {
  assert.equal(donaDe('relacao', ['c-pc-lucan', 'c-pc-quasi'], tipoLinha), null)
  assert.equal(donaDe('pista', ['r-a', 'r-b'], tipoLinha), null)
  assert.equal(donaDe('cena', ['c-morgid'], tipoLinha), null)
  assert.equal(donaDe('consequencia', [], tipoLinha), null)
})
