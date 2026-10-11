// Ida e volta: entidade antiga → documento novo → texto → documento → entidade antiga, para todo o cânone de hoje.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { lerAntigo, chaveRel } from './antigo.ts'
import { parseMd, stringifyMd } from '../../src/lib/arquivo/md.ts'
import {
  ambicaoParaDoc, arcoParaDoc, beatParaDoc, campanhaParaDoc, docParaAmbicao, docParaArco, docParaBeat, docParaCampanha, docParaFacao,
  docParaLocal, docParaPersonagem, docParaSegredo, facaoParaDoc, frenteParaDoc, localParaDoc, personagemParaDoc, relacaoParaNova, segredoParaDoc,
  partirTitulo, tituloAntigo,
} from '../../src/lib/arquivo/esquema.ts'
import {
  normalizeAmbition, normalizeArc, normalizeBeat, normalizeCampaign, normalizeCharacter, normalizeFaction, normalizeLocation, normalizeRelation, normalizeRevelation,
} from '../../src/lib/validate.ts'

const raiz = resolve(import.meta.dirname, '../..')
const semSource = <T extends { source?: unknown }>(x: T): Omit<T, 'source'> => {
  const { source: _s, ...resto } = x
  void _s
  return resto
}
const volta = (doc: { meta: Record<string, unknown>; body: string }) => parseMd(stringifyMd(doc.meta, doc.body))

test('títulos das sessões', () => {
  assert.deepEqual(partirTitulo('Sessão 5 (#88) — As Noites da Terceira Lança'), { n: 5, global: 88, titulo: 'As Noites da Terceira Lança' })
  assert.equal(partirTitulo('Sessão zero'), null)
  assert.equal(tituloAntigo({ n: 5, global: 88, titulo: 'X' }), 'Sessão 5 (#88) — X')
})

test('todo o cânone antigo sobrevive à ida e volta pelos documentos novos', { skip: !existsSync(resolve(raiz, 'data/book')) && 'sem data/ antigo' }, () => {
  const antigo = lerAntigo(raiz)
  const canon = antigo.canon
  const origem = ['livro', 'mesa']

  for (const c of canon.characters) {
    const rels = canon.relations.filter((r) => r.from === c.id).map((r) => relacaoParaNova(r, antigo.relOrigem.get(chaveRel(r as unknown as Record<string, unknown>)) ?? 'livro'))
    const { entidade, relacoes } = docParaPersonagem(volta(personagemParaDoc(c, origem, rels, { legenda: 'x' }, [{ titulo: 'Extra', texto: 'y' }])))
    assert.deepEqual(semSource(normalizeCharacter(entidade)), semSource(c), c.id)
    assert.deepEqual(relacoes.map((r) => semSource(normalizeRelation(r))), rels.map((_, i) => semSource(canon.relations.filter((r) => r.from === c.id)[i])), `relações de ${c.id}`)
  }
  for (const f of canon.factions) {
    const rels = canon.relations.filter((r) => r.from === f.id).map((r) => relacaoParaNova(r, 'livro'))
    const frente = frenteParaDoc(f, origem)
    const passos = frente ? (volta(frente).meta.passos as { capitulo: string; texto: string }[]).map((p) => ({ chapter: p.capitulo, text: p.texto })) : []
    const { entidade } = docParaFacao(volta(facaoParaDoc(f, origem, rels)), passos)
    assert.deepEqual(semSource(normalizeFaction(entidade)), semSource(f), f.id)
  }
  for (const l of canon.locations) assert.deepEqual(normalizeLocation(docParaLocal(volta(localParaDoc(l, origem)))), l, l.id)
  for (const r of canon.revelations) assert.deepEqual(semSource(normalizeRevelation(docParaSegredo(volta(segredoParaDoc(r, origem))))), semSource(r), r.id)
  for (const b of canon.beats) assert.deepEqual(semSource(normalizeBeat(docParaBeat(volta(beatParaDoc(b, origem))))), semSource(b), b.id)
  for (const a of canon.arcs) assert.deepEqual(normalizeArc(docParaArco(volta(arcoParaDoc(a, origem)))), a, a.id)
  for (const a of canon.ambitions) assert.deepEqual(semSource(normalizeAmbition(docParaAmbicao(volta(ambicaoParaDoc(a, origem, 'nome'))))), semSource(a), a.id)
  const camp = docParaCampanha(volta(campanhaParaDoc(canon.campaign, 'ch0')))
  assert.deepEqual(normalizeCampaign(camp.campaign), canon.campaign)
  assert.equal(camp.capituloAtual, 'ch0')
})
