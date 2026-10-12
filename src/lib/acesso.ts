// Acesso sem colar o token em cada browser: o token fica cifrado no repositório (grelha/acesso.json) com uma
// palavra-passe da mesa (PBKDF2-SHA256, 600 000 iterações, AES-GCM 256, WebCrypto). Num browser novo basta a
// palavra-passe, que o gestor de palavras-passe do browser guarda e sincroniza. O repositório é público: a segurança
// está toda na palavra-passe, por isso tem de ser longa (quatro ou mais palavras) e o token só dá acesso a este repo.
import { fetchFile, putFile, getToken, setToken } from './github.ts'

export interface Acesso {
  v: 1
  iter: number
  salt: string
  iv: string
  dados: string
}

export const ACESSO_PATH = 'grelha/acesso.json'
const ITER = 600_000

const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)))
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function chave(pass: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function cifrar(token: string, pass: string): Promise<Acesso> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const k = await chave(pass, salt, ITER)
  const dados = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, k, new TextEncoder().encode(token))
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), dados: b64(dados) }
}

/** Decifra; uma palavra-passe errada lança erro (o AES-GCM verifica a integridade). */
export async function decifrar(a: Acesso, pass: string): Promise<string> {
  const k = await chave(pass, deB64(a.salt), a.iter)
  const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(a.iv) as BufferSource }, k, deB64(a.dados) as BufferSource)
  return new TextDecoder().decode(claro)
}

export function eAcesso(v: unknown): v is Acesso {
  const o = v as Acesso
  return !!o && o.v === 1 && typeof o.salt === 'string' && typeof o.iv === 'string' && typeof o.dados === 'string' && typeof o.iter === 'number'
}

/** O acesso cifrado: lido do repositório (o repo é público, não precisa de token), com o do build como recurso. */
export async function lerAcesso(doBuild: unknown): Promise<Acesso | null> {
  try {
    const f = await fetchFile(ACESSO_PATH)
    if (f.text) {
      const v = JSON.parse(f.text)
      if (eAcesso(v)) return v
    }
  } catch {
    /* sem rede ou limite da API: fica o do build */
  }
  return eAcesso(doBuild) ? doBuild : null
}

/** Com o token já ligado: cifra-o com a palavra-passe e grava grelha/acesso.json. */
export async function guardarAcesso(pass: string): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Liga primeiro o token neste browser.')
  const a = await cifrar(token, pass)
  const atual = await fetchFile(ACESSO_PATH)
  await putFile(ACESSO_PATH, JSON.stringify(a, null, 2) + '\n', atual.sha || undefined, 'grelha: acesso cifrado (palavra-passe da mesa)')
}

/** Num browser novo: decifra o acesso com a palavra-passe e liga o token. */
export async function desbloquear(a: Acesso, pass: string): Promise<void> {
  let token: string
  try {
    token = await decifrar(a, pass)
  } catch {
    throw new Error('Palavra-passe errada.')
  }
  setToken(token)
}

/** Link de ligação: o token no fragmento (#ligar=…), que nunca vai para o servidor. Abre-se uma vez noutro dispositivo. */
export function linkDeLigacao(): string {
  return `${location.origin}${location.pathname}#ligar=${encodeURIComponent(getToken())}`
}

/** Se a página abriu com #ligar=…, guarda o token e limpa o endereço. Devolve true se ligou. */
export function lerLinkDeLigacao(): boolean {
  const m = location.hash.match(/^#ligar=(.+)$/)
  if (!m) return false
  setToken(decodeURIComponent(m[1]))
  history.replaceState(null, '', `${location.pathname}#/grelha`)
  return true
}
