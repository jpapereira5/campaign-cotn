// Leitura da estrutura nova: mundo/, plano/, registo/, mesa/, grelha/ e livro/.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseMd, type Doc } from './md.ts'
import { PASTAS } from './esquema.ts'

export interface DocArvore extends Doc {
  caminho: string
  /** documento de prosa (sem cabeçalho), como mundo/lore.md ou mesa/regras.md */
  prosa: boolean
}

export interface Arvore {
  raiz: string
  docs: DocArvore[]
  /** livro/<rel> → conteúdo JSON */
  livro: Record<string, unknown>
  grelha: { linhas: unknown; dm: unknown; revisao: unknown }
}

function listar(dir: string, ext: string): string[] {
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
  return {
    raiz,
    docs,
    livro,
    grelha: { linhas: lerJson('linhas.json', []), dm: lerJson('dm.json', []), revisao: lerJson('revisao.json', { reviewed: {}, absorbed: {}, notes: [] }) },
  }
}

export const naPasta = (a: Arvore, pasta: string): DocArvore[] => a.docs.filter((d) => d.caminho.startsWith(pasta + '/'))

export const comId = (a: Arvore, id: string): DocArvore | undefined => a.docs.find((d) => d.meta.id === id)

export function porPasta(a: Arvore) {
  const sessoes = naPasta(a, PASTAS.sessoes).sort((x, y) => Number(x.meta.n ?? 0) - Number(y.meta.n ?? 0))
  return {
    personagens: naPasta(a, PASTAS.personagens),
    facoes: naPasta(a, PASTAS.facoes),
    locais: naPasta(a, PASTAS.locais),
    itens: naPasta(a, PASTAS.itens),
    segredos: naPasta(a, PASTAS.segredos),
    beats: naPasta(a, PASTAS.beats),
    fios: [...naPasta(a, PASTAS.fios), ...naPasta(a, PASTAS.mesaFios)],
    jogadores: naPasta(a, PASTAS.jogadores),
    sessoes,
    campanha: a.docs.find((d) => d.caminho === 'plano/campanha.md'),
  }
}
