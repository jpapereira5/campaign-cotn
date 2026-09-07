// Leitura/escrita de data/*.json no repositório via GitHub REST API.
// O token (fine-grained, só este repo, Contents: read/write) fica em localStorage.
import type { DataFile } from './data.ts'
import { parsePath } from './data.ts'

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

interface Entry {
  path: string
  type: 'file' | 'dir'
  sha: string
}

async function listDir(path: string): Promise<Entry[]> {
  const res = await fetch(`${API}/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`, { headers: headers() })
  if (!res.ok) throw new Error(`GitHub ${res.status} ao listar ${path}`)
  const list = (await res.json()) as Entry[]
  const out: Entry[] = []
  for (const e of list) {
    if (e.type === 'dir') out.push(...(await listDir(e.path)))
    else out.push(e)
  }
  return out
}

async function readRaw(path: string): Promise<string> {
  const res = await fetch(`${API}/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`, {
    headers: headers('application/vnd.github.raw+json'),
  })
  if (!res.ok) throw new Error(`GitHub ${res.status} ao ler ${path}`)
  return res.text()
}

/** Lê todos os ficheiros data/**.json do repositório (conteúdo + sha). */
export async function fetchRemoteFiles(): Promise<Record<string, DataFile>> {
  const entries = (await listDir('data')).filter((e) => e.path.endsWith('.json'))
  const out: Record<string, DataFile> = {}
  await Promise.all(
    entries.map(async (e) => {
      const p = parsePath(e.path)
      if (!p) return
      const text = await readRaw(e.path)
      out[e.path] = { path: e.path, kind: p.kind, layer: p.layer, content: JSON.parse(text), sha: e.sha, dirty: false }
    }),
  )
  return out
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
