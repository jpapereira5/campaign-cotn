// A Grelha viva: a camada automática (registo + cânone) com a camada do DM por cima. Puro: a app e o script
// scripts/grelha.ts constroem-na da mesma maneira.
import type { Arvore } from '../arquivo/arvore.ts'
import type { Campanha } from '../campanha.ts'
import type { Estado } from '../estado.ts'
import type { Indice } from '../ficha.ts'
import { construirGrelha, type Grelha, type Linha } from './modelo.ts'
import { aplicarDm, normalizarDm, normalizarRevisao, type DmEntry, type Revisao } from './dm.ts'
import type { TipoLinha } from './dona.ts'

export interface GrelhaViva extends Grelha {
  notasSoltas: DmEntry[]
  planosPassados: { entrada: DmEntry; linha: Linha }[]
}

export interface CamadaGrelha {
  dm: DmEntry[]
  revisao: Revisao
  linhas: { id: string; tipo?: string; pcs?: string[] }[]
}

/** A camada tal como está nos ficheiros grelha/*.json da árvore. */
export function camadaDaArvore(arvore: Arvore): CamadaGrelha {
  return {
    dm: normalizarDm(arvore.grelha.dm),
    revisao: normalizarRevisao(arvore.grelha.revisao),
    linhas: (Array.isArray(arvore.grelha.linhas) ? arvore.grelha.linhas : []) as CamadaGrelha['linhas'],
  }
}

export function grelhaViva(arvore: Arvore, estado: Estado, indice: Indice, campanha: Campanha, camada: CamadaGrelha, tipoLinha: TipoLinha): GrelhaViva {
  const jogadosDm = new Set(camada.dm.filter((e) => e.kind === 'jogado' && !e.deleted && e.beat).map((e) => String(e.beat)))
  const g = construirGrelha({
    arvore,
    estado,
    nome: (id) => indice.nome(id),
    linhas: camada.linhas,
    notas: camada.revisao.notes as unknown as Record<string, unknown>[],
    capitulos: campanha.capitulos,
    capituloAtual: campanha.capituloAtual,
    curto: (c) => campanha.curto(c),
    corPc: (pc) => campanha.corPc(pc),
    jogadosDm,
  })
  const proxima = g.colunas.find((c) => c.tipo === 'proxima')
  const extra = aplicarDm(g, camada.dm, camada.revisao, {
    tipoLinha,
    nome: (id) => indice.nome(id),
    jogadas: new Set(g.colunas.filter((c) => c.sessao).map((c) => c.chave)),
    proximaChave: proxima?.chave ?? '',
    rotuloColuna: (chave) => `→ ${g.colunas.find((c) => c.chave === chave)?.label ?? chave}`,
  })
  return { ...g, ...extra }
}

/** As notas da revisão abertas que contam como «por responder»: sem linha, ou com uma linha que está na Grelha; sem resposta na camada do DM. */
export function notasPorResponder(g: Grelha, camada: CamadaGrelha) {
  const ids = new Set([...g.linhas.map((l) => l.id), ...Object.keys(g.alias ?? {})])
  const respondidas = new Set(camada.dm.filter((e) => e.kind === 'resposta' && !e.deleted).map((e) => String(e.note)))
  return camada.revisao.notes.filter((n) => n.status !== 'fechada' && n.kind !== 'ideia' && !respondidas.has(n.id) && (!n.target?.row || ids.has(n.target.row)))
}
