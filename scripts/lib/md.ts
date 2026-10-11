// Ficheiros Markdown com cabeçalho YAML: ler, escrever e partir o corpo em secções «## ».
// Puro: usado pelos scripts (migrar, montar, verificar) e pelos testes.
import YAML from 'yaml'

export interface Doc {
  meta: Record<string, unknown>
  body: string
}

export interface Secao {
  titulo: string
  texto: string
}

export interface Corpo {
  intro: string
  secoes: Secao[]
}

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export function parseMd(texto: string): Doc {
  const m = texto.match(FM)
  if (!m) return { meta: {}, body: texto }
  const meta = (YAML.parse(m[1]) ?? {}) as Record<string, unknown>
  return { meta, body: texto.slice(m[0].length) }
}

/** Escreve o cabeçalho sem dobrar linhas (lineWidth 0) para o texto voltar igual. */
export function stringifyMd(meta: Record<string, unknown>, body: string): string {
  const limpo: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) if (v !== undefined) limpo[k] = v
  const yaml = YAML.stringify(limpo, { lineWidth: 0, defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' })
  const corpo = body.replace(/\s+$/, '')
  return `---\n${yaml}---\n${corpo ? '\n' + corpo + '\n' : ''}`
}

/** Parte o corpo em intro e secções de nível `nivel` (2 = «## »). Cabeçalhos dentro de blocos de código não contam. */
export function secoesNivel(body: string, nivel: number): Corpo {
  const marca = '#'.repeat(nivel) + ' '
  const linhas = body.replace(/\r\n/g, '\n').split('\n')
  const out: Corpo = { intro: '', secoes: [] }
  let atual: string[] = []
  let titulo: string | null = null
  let emCodigo = false
  const fecha = () => {
    const texto = atual.join('\n').replace(/^\n+|\n+$/g, '')
    if (titulo === null) out.intro = texto
    else out.secoes.push({ titulo, texto })
  }
  for (const l of linhas) {
    if (/^```/.test(l)) emCodigo = !emCodigo
    if (!emCodigo && l.startsWith(marca)) {
      fecha()
      titulo = l.slice(marca.length).trim()
      atual = []
    } else atual.push(l)
  }
  fecha()
  return out
}

export function secoes(body: string): Corpo {
  return secoesNivel(body, 2)
}

export function juntarSecoes(corpo: Corpo): string {
  const partes: string[] = []
  if (corpo.intro) partes.push(corpo.intro)
  for (const s of corpo.secoes) partes.push(`## ${s.titulo}\n\n${s.texto}`.replace(/\n+$/, ''))
  return partes.join('\n\n') + (partes.length ? '\n' : '')
}

export function secao(corpo: Corpo, titulo: string): string | undefined {
  return corpo.secoes.find((s) => s.titulo === titulo)?.texto
}

/** Texto que vai para uma secção: vazio dá secção omitida. */
export function secaoSe(titulo: string, texto: string | undefined | null): Secao[] {
  return texto && texto.trim() ? [{ titulo, texto: texto.replace(/\s+$/, '') }] : []
}
