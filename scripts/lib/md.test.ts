import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMd, secoes, stringifyMd, juntarSecoes } from './md.ts'

test('cabeçalho YAML volta igual: aspas, dois pontos, acentos, listas, objetos, números, null', () => {
  const meta = {
    id: 'c-teste',
    nome: 'Iliana "Questão": a balada',
    quer: "Sess'inek — «dádivas» para o seu senhor; 2/3 do caminho",
    lista: ['a', 'b-c', 'ch0'],
    estados: [{ desde: 'b-0-x', estado: 'Vivo: a fugir' }],
    ordem: 12,
    data: '2026-10-07',
    vazio: null,
    mapa: { 'c-pc-lucan': 'p-renata' },
  }
  const body = '## Resumo\n\nTexto com # cardinal no meio e `código`.\n\n## Notas\n\n- um\n- dois\n'
  const { meta: m2, body: b2 } = parseMd(stringifyMd(meta, body))
  assert.deepEqual(m2, meta)
  assert.equal(b2.trim(), body.trim())
})

test('secções de nível 2, com blocos de código protegidos', () => {
  const body = 'intro\n\n## A\n\nlinha a\n\n```\n## não é secção\n```\n\n## B\n\nlinha b\n'
  const c = secoes(body)
  assert.equal(c.intro, 'intro')
  assert.deepEqual(c.secoes.map((s) => s.titulo), ['A', 'B'])
  assert.ok(c.secoes[0].texto.includes('## não é secção'))
  const outra = secoes(juntarSecoes(c))
  assert.deepEqual(outra, c)
})

test('ficheiro sem cabeçalho é só corpo', () => {
  const d = parseMd('# Título\n\ntexto')
  assert.deepEqual(d.meta, {})
  assert.equal(d.body, '# Título\n\ntexto')
})
