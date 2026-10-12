// A camada do DM ao vivo: grelha/dm.json (só a app escreve), grelha/revisao.json e grelha/linhas.json (o Claude escreve).
// Com token, lê-os do repositório sem cache e verifica de 30 em 30 segundos se o ramo mudou; sem token, fica com o pacote do build.
// Cada «Guardar» grava logo um commit só de dm.json; em conflito, relê, funde por id (fica o `at` mais recente) e repete uma vez.
import { arvore } from '../data.ts'
import { ConflictError, fetchFile, getToken, headSha, putFile } from '../github.ts'
import { lerAcesso, type Acesso } from '../acesso.ts'
import { fundirDm, normalizarDm, normalizarRevisao, novaIdDm, type DmEntry, type Revisao } from './dm.ts'

export interface LinhaDef {
  id: string
  tipo?: string
  pcs?: string[]
}

const DM_PATH = 'grelha/dm.json'
const REVISAO_PATH = 'grelha/revisao.json'
const LINHAS_PATH = 'grelha/linhas.json'
const INTERVALO = 30_000

export const camada = $state({
  dm: normalizarDm(arvore.grelha.dm),
  revisao: normalizarRevisao(arvore.grelha.revisao) as Revisao,
  linhas: (Array.isArray(arvore.grelha.linhas) ? arvore.grelha.linhas : []) as LinhaDef[],
  shaDm: '' as string,
  shaRamo: '' as string,
  fonte: 'build' as 'build' | 'repositorio',
  estado: 'parado' as 'parado' | 'a-ler' | 'a-gravar' | 'ok' | 'erro',
  mensagem: '',
  ultimaLeitura: '',
  porGravar: false,
  /** o token cifrado no repositório, para desbloquear um browser novo com a palavra-passe */
  acesso: null as Acesso | null,
  /** este browser tem token (reativo; o token em si fica no localStorage) */
  ligado: !!getToken(),
})

let sonda: ReturnType<typeof setInterval> | null = null

const agora = () => new Date().toISOString()
const hora = () => new Date().toLocaleTimeString('pt-PT')

/** Lê os três ficheiros do repositório. Não substitui o dm.json local enquanto houver entradas por gravar. */
export async function lerGrelhaRemota(): Promise<void> {
  if (!getToken()) return
  camada.estado = 'a-ler'
  try {
    const [dm, revisao, linhas, ramo] = await Promise.all([fetchFile(DM_PATH), fetchFile(REVISAO_PATH), fetchFile(LINHAS_PATH), headSha()])
    if (!camada.porGravar) {
      camada.dm = dm.text ? normalizarDm(JSON.parse(dm.text)) : []
      camada.shaDm = dm.sha
    }
    if (revisao.text) camada.revisao = normalizarRevisao(JSON.parse(revisao.text))
    if (linhas.text) camada.linhas = JSON.parse(linhas.text) as LinhaDef[]
    camada.shaRamo = ramo
    camada.fonte = 'repositorio'
    camada.estado = 'ok'
    camada.ultimaLeitura = hora()
    camada.mensagem = `Grelha lida do repositório às ${camada.ultimaLeitura}.`
  } catch (e) {
    camada.estado = 'erro'
    camada.mensagem = (e as Error).message
  }
}

export function marcarLigado(): void {
  camada.ligado = !!getToken()
}

export async function carregarAcesso(): Promise<void> {
  camada.acesso = await lerAcesso(arvore.grelha.acesso)
}

/** De 30 em 30 segundos: se o ramo mudou, relê. */
export function iniciarSonda(): void {
  if (sonda || !getToken()) return
  void lerGrelhaRemota()
  sonda = setInterval(async () => {
    if (!getToken() || camada.estado === 'a-gravar') return
    try {
      const sha = await headSha()
      if (sha !== camada.shaRamo) await lerGrelhaRemota()
    } catch {
      /* a próxima volta tenta de novo */
    }
  }, INTERVALO)
}

export function pararSonda(): void {
  if (sonda) clearInterval(sonda)
  sonda = null
}

function serializar(dm: DmEntry[]): string {
  return JSON.stringify(dm, null, 2) + '\n'
}

async function gravar(mensagem: string): Promise<void> {
  if (!getToken()) {
    camada.estado = 'erro'
    camada.mensagem = 'Sem acesso neste browser: desbloqueia com a palavra-passe da mesa (ou o token, nas Definições).'
    camada.porGravar = true
    return
  }
  camada.estado = 'a-gravar'
  camada.porGravar = true
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      camada.shaDm = await putFile(DM_PATH, serializar(camada.dm), camada.shaDm || undefined, mensagem)
      camada.porGravar = false
      camada.estado = 'ok'
      camada.mensagem = `Gravado às ${hora()}: ${mensagem}`
      return
    } catch (e) {
      if (e instanceof ConflictError && tentativa === 0) {
        // o ficheiro mudou noutro sítio: juntar por id e repetir
        try {
          const remoto = await fetchFile(DM_PATH)
          camada.dm = fundirDm(remoto.text ? normalizarDm(JSON.parse(remoto.text)) : [], camada.dm)
          camada.shaDm = remoto.sha
          continue
        } catch (e2) {
          camada.estado = 'erro'
          camada.mensagem = (e2 as Error).message
          return
        }
      }
      camada.estado = 'erro'
      camada.mensagem = `${(e as Error).message} A entrada fica por gravar; tenta de novo na próxima gravação.`
      return
    }
  }
}

/** Cria uma entrada nova (com id e data) e grava. */
export async function registar(entrada: Omit<DmEntry, 'id' | 'at'>, mensagem: string): Promise<DmEntry> {
  const e: DmEntry = { id: novaIdDm(), at: agora(), ...entrada }
  camada.dm = [...camada.dm, e]
  await gravar(mensagem)
  return e
}

/** Altera uma entrada existente (muda o `at`) e grava. */
export async function alterar(id: string, patch: Partial<DmEntry>, mensagem: string): Promise<void> {
  camada.dm = camada.dm.map((e) => (e.id === id ? { ...e, ...patch, at: agora() } : e))
  await gravar(mensagem)
}

export async function apagar(id: string, mensagem: string): Promise<void> {
  await alterar(id, { deleted: true }, mensagem)
}

/** Repete a gravação do que ficou por gravar. */
export async function gravarPendentes(): Promise<void> {
  if (camada.porGravar) await gravar('grelha: gravação pendente')
}
