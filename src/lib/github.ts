// Leitura e escrita no repositório pela API REST do GitHub: só grelha/*.json (docs/arquitetura.md, secção 8).
// O token (fine-grained, só este repo, Contents: read/write) fica em localStorage.

export const REPO = { owner: 'jpapereira5', repo: 'campaign-cotn', branch: 'main' }
const API = 'https://api.github.com'
const TOKEN_KEY = 'campaign-cotn-token'

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setToken(t: string): void {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

function headers(accept = 'application/vnd.github+json'): HeadersInit {
  const h: Record<string, string> = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' }
  const t = getToken()
  if (t) h.Authorization = `Bearer ${t}`
  return h
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export class ConflictError extends Error {}

/** Escreve um ficheiro (cria ou substitui). Devolve o novo sha. */
export async function putFile(path: string, text: string, sha: string | undefined, message: string): Promise<string> {
  const res = await fetch(`${API}/repos/${REPO.owner}/${REPO.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: toBase64(text), branch: REPO.branch, ...(sha ? { sha } : {}) }),
  })
  if (res.status === 409 || res.status === 422) throw new ConflictError(`Conflito ao gravar ${path} (${res.status}): alguém alterou o ficheiro. Recarrega e repete.`)
  if (!res.ok) throw new Error(`GitHub ${res.status} ao gravar ${path}: ${(await res.text()).slice(0, 200)}`)
  const body = (await res.json()) as { content: { sha: string } }
  return body.content.sha
}

export async function checkToken(): Promise<{ ok: boolean; login?: string; canPush?: boolean; message?: string }> {
  try {
    const res = await fetch(`${API}/repos/${REPO.owner}/${REPO.repo}`, { headers: headers() })
    if (!res.ok) return { ok: false, message: `GitHub ${res.status}` }
    const body = (await res.json()) as { permissions?: { push?: boolean } }
    const me = await fetch(`${API}/user`, { headers: headers() })
    const login = me.ok ? ((await me.json()) as { login: string }).login : undefined
    return { ok: true, login, canPush: body.permissions?.push ?? false }
  } catch (e) {
    return { ok: false, message: (e as Error).message }
  }
}

// ---- leituras ao vivo (Grelha): sempre sem cache, porque a API responde com max-age=60 ----

/** Lê um ficheiro do ramo: conteúdo e sha, sem cache. */
export async function fetchFile(path: string): Promise<{ text: string; sha: string }> {
  const res = await fetch(`${API}/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`, { headers: headers(), cache: 'no-store' })
  if (res.status === 404) return { text: '', sha: '' }
  if (!res.ok) throw new Error(`GitHub ${res.status} ao ler ${path}`)
  const body = (await res.json()) as { sha: string; content: string; encoding: string }
  const bin = atob(body.content.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return { text: new TextDecoder().decode(bytes), sha: body.sha }
}

/** O sha do último commit do ramo, sem cache: para saber se há coisas novas. */
export async function headSha(): Promise<string> {
  const res = await fetch(`${API}/repos/${REPO.owner}/${REPO.repo}/commits/${REPO.branch}`, { headers: headers('application/vnd.github.sha'), cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub ${res.status} ao ler o ramo`)
  return (await res.text()).trim()
}
