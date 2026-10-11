// A fonte de verdade é a estrutura nova (docs/arquitetura.md): mundo/, plano/, registo/, mesa/ e livro/, em Markdown
// com cabeçalho. `scripts/montar.ts` corre no build e escreve src/generated/dados.json com a árvore já lida; a app
// importa-a daqui. Só grelha/*.json se lê ao vivo (src/lib/grelha/store.svelte.ts); o resto chega com o deploy.
import dados from '../generated/dados.json'
import type { Arvore } from './arquivo/arvore.ts'

/** A árvore da estrutura nova, tal como o build a deixou. */
export const arvore = dados as unknown as Arvore & { geradoEm: string }
