// Leitura da estrutura nova a partir do disco (os scripts); o modelo em si está em src/lib/arquivo/arvore.ts.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import YAML from 'yaml'
import { parseMd } from '../../src/lib/arquivo/md.ts'
import type { Arvore, DocArvore } from '../../src/lib/arquivo/arvore.ts'

export type { Arvore, DocArvore } from '../../src/lib/arquivo/arvore.ts'
export { comId, naPasta, porPasta } from '../../src/lib/arquivo/arvore.ts'

export function listar(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) out.push(...listar(p, ext))
    else if (f.endsWith(ext)) out.push(p)
  }
  return out
}

export function lerArvore(raiz: string): Arvore {
  const docs: DocArvore[] = []
  for (const pasta of ['mundo', 'plano', 'registo', 'mesa']) {
    for (const p of listar(join(raiz, pasta), '.md')) {
      const rel = relative(raiz, p)
      if (/README\.md$/.test(rel)) continue
      const d = parseMd(readFileSync(p, 'utf8'))
      docs.push({ ...d, caminho: rel, prosa: Object.keys(d.meta).length === 0 })
    }
  }
  const livro: Record<string, unknown> = {}
  for (const p of listar(join(raiz, 'livro'), '.json')) livro[relative(join(raiz, 'livro'), p)] = JSON.parse(readFileSync(p, 'utf8'))
  const lerJson = (nome: string, vazio: unknown) => {
    const p = join(raiz, 'grelha', nome)
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : vazio
  }
  const batalhas: Record<string, unknown> = {}
  for (const p of listar(join(raiz, 'mesa', 'batalhas'), '.yaml')) batalhas[relative(join(raiz, 'mesa', 'batalhas'), p).replace(/\.yaml$/, '')] = YAML.parse(readFileSync(p, 'utf8'))
  return {
    docs,
    livro,
    batalhas,
    grelha: { linhas: lerJson('linhas.json', []), dm: lerJson('dm.json', []), revisao: lerJson('revisao.json', { reviewed: {}, absorbed: {}, notes: [] }), acesso: lerJson('acesso.json', null) },
  }
}
