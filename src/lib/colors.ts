import type { CharacterKind, RelationType } from './types.ts'

export const KIND_COLORS: Record<CharacterKind, string> = {
  pc: '#d9a441',
  npc: '#8fa3c7',
  rival: '#6fbf73',
  deity: '#c7b7e0',
}
export const FACTION_NODE_COLOR = '#b08968'

export const KIND_LABELS: Record<CharacterKind, string> = {
  pc: 'PC',
  npc: 'NPC',
  rival: 'Rival',
  deity: 'Divindade',
}

export interface EdgeStyle {
  color: string
  dash?: string
  arrow: boolean
  width: number
}

export const RELATION_STYLES: Record<RelationType, EdgeStyle> = {
  ally: { color: '#6fbf73', arrow: false, width: 1.6 },
  enemy: { color: '#c2453a', arrow: false, width: 1.8 },
  serves: { color: '#a3968a', arrow: true, width: 1.2 },
  loves: { color: '#e08bb0', arrow: true, width: 1.4 },
  betrays: { color: '#c2453a', dash: '6 4', arrow: true, width: 1.6 },
  rival: { color: '#d9a441', dash: '2 3', arrow: false, width: 1.4 },
  memberOf: { color: '#5c5248', arrow: true, width: 1 },
  wantsFrom: { color: '#e0b04a', arrow: true, width: 1.2 },
  knows: { color: '#4a4138', arrow: false, width: 0.8 },
  spiesOn: { color: '#c2453a', dash: '1 4', arrow: true, width: 1.2 },
  protects: { color: '#6fbf73', dash: '8 3', arrow: true, width: 1.4 },
  family: { color: '#b08968', arrow: false, width: 1.4 },
}

export const RELATION_LABELS: Record<RelationType, string> = {
  ally: 'aliado de',
  enemy: 'inimigo de',
  serves: 'serve',
  loves: 'ama',
  betrays: 'trai',
  rival: 'rival de',
  memberOf: 'membro de',
  wantsFrom: 'quer algo de',
  knows: 'conhece',
  spiesOn: 'espia',
  protects: 'protege',
  family: 'família de',
}
