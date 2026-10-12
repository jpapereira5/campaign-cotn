import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cifrar, decifrar, eAcesso } from './acesso.ts'

test('acesso: cifra e decifra o token; palavra-passe errada falha', async () => {
  const a = await cifrar('github_pat_exemplo', 'quatro palavras ao acaso mesmo')
  assert.ok(eAcesso(a))
  assert.ok(!JSON.stringify(a).includes('github_pat'))
  assert.equal(await decifrar(a, 'quatro palavras ao acaso mesmo'), 'github_pat_exemplo')
  await assert.rejects(() => decifrar(a, 'outra coisa'))
})
