// A página «Batalha» ao vivo: as batalhas vêm do pacote do build (mesa/batalhas/*.yaml); o estado de cada combate é
// uma entrada `kind: 'batalha'` em grelha/dm.json (row vazio, patch = EstadoBatalha). As mudanças aplicam-se logo no
// ecrã e gravam-se em grupo, alguns segundos depois da última, para não fazer um commit por cada ponto de vida.
import { arvore } from './data.ts'
import { camada, registar, alterar } from './grelha/store.svelte.ts'
import { normalizarBatalha, normalizarEstado, estadoInicial, type Batalha, type EstadoBatalha } from './batalha.ts'

const ATRASO = 4000

export const batalhas: Batalha[] = Object.entries((arvore as { batalhas?: Record<string, unknown> }).batalhas ?? {})
  .map(([id, raw]) => normalizarBatalha(raw, id))
  .sort((a, b) => b.id.localeCompare(a.id))

export const vivo = $state({
  /** batalha aberta */
  id: batalhas[0]?.id ?? '',
  /** estado local (o que está no ecrã), por batalha */
  local: {} as Record<string, EstadoBatalha>,
  porGravar: false,
})

let temporizador: ReturnType<typeof setTimeout> | null = null

export function entradaDe(id: string) {
  return camada.dm.find((e) => e.kind === 'batalha' && !e.deleted && (e.patch as { batalha?: string } | undefined)?.batalha === id)
}

/** O estado no ecrã: o local, se houver mudanças por gravar; senão o de dm.json; senão o inicial. */
export function estadoDe(b: Batalha): EstadoBatalha {
  if (vivo.local[b.id]) return vivo.local[b.id]
  const e = entradaDe(b.id)
  return e ? normalizarEstado(e.patch, b) : estadoInicial(b)
}

export function mudar(b: Batalha, novo: EstadoBatalha): void {
  vivo.local[b.id] = novo
  vivo.porGravar = true
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(() => void gravarJa(b), ATRASO)
}

export async function gravarJa(b: Batalha): Promise<void> {
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  const s = vivo.local[b.id]
  if (!s) return
  const patch = JSON.parse(JSON.stringify(s)) as Record<string, unknown>
  const e = entradaDe(b.id)
  const msg = `batalha: ${b.nome}, ronda ${s.ronda}`
  if (e) await alterar(e.id, { patch }, msg)
  else await registar({ kind: 'batalha', patch, text: b.nome }, msg)
  // só larga o estado local se nada mudou entretanto
  if (vivo.local[b.id] === s) {
    delete vivo.local[b.id]
    vivo.porGravar = false
  }
}

export async function recomecar(b: Batalha): Promise<void> {
  mudar(b, estadoInicial(b))
  await gravarJa(b)
}
