// Modelo de dados da campanha. Tudo é JSON simples, editável à mão em data/.
// Ids: kebab-case ASCII. Prefixos: c- (personagem), f- (facção), l- (local),
// b-<cap>- (beat), r- (revelação), a- (arco), amb- (ambição), ch0..ch7 (capítulos).

export type CharacterKind = 'pc' | 'npc' | 'rival' | 'deity'
export const CHARACTER_KINDS: CharacterKind[] = ['pc', 'npc', 'rival', 'deity']

export type RelationType =
  | 'ally' // aliados / amigos
  | 'enemy' // inimigos declarados
  | 'serves' // A serve / obedece a B
  | 'loves' // A ama / tem um fraquinho por B
  | 'betrays' // A trai B
  | 'rival' // rivalidade
  | 'memberOf' // A é membro da facção B
  | 'wantsFrom' // A quer algo de B
  | 'knows' // A conhece B (neutro)
  | 'spiesOn' // A espia B
  | 'protects' // A protege B
  | 'family' // parentesco
export const RELATION_TYPES: RelationType[] = [
  'ally', 'enemy', 'serves', 'loves', 'betrays', 'rival', 'memberOf', 'wantsFrom', 'knows', 'spiesOn', 'protects', 'family',
]

export type ArcKind = 'prologue' | 'main' | 'lore' | 'ruidium' | 'rivals' | 'faction' | 'pcAmbition'
export const ARC_KINDS: ArcKind[] = ['prologue', 'main', 'lore', 'ruidium', 'rivals', 'faction', 'pcAmbition']

/** Escala do livro (DMG): hostil / indiferente / amigável. */
export type Attitude = 'hostil' | 'indiferente' | 'amigável'
export const ATTITUDES: Attitude[] = ['hostil', 'indiferente', 'amigável']

export type Source = 'book' | 'dm'

export interface Chapter {
  id: string
  name: string
  levels: string
  hub: string
  summary: string
}

export interface Campaign {
  title: string
  chapters: Chapter[]
  /** Beat onde todas as pistas convergem (o centro da teia). */
  convergence: string
}

export interface Character {
  id: string
  name: string
  kind: CharacterKind
  factions: string[]
  home?: string
  chapters: string[]
  summary: string
  goal: string
  secret: string
  wants: string
  fears: string
  /** Estado ao longo do tempo: "vivo", "corrompido por ruidium", "morto"... a partir de um beat. */
  states: { fromBeat: string; state: string }[]
  /** Só para rivais: atitude inicial para com os PCs. */
  attitude?: Attitude
  tags: string[]
  source: Source
}

export interface Portent {
  chapter: string
  text: string
}

export interface Faction {
  id: string
  name: string
  motto: string
  agenda: string
  publicFace: string
  leaders: string[]
  allies: string[]
  enemies: string[]
  /** Fronts / grim portents: o que acontece se os PCs não intervierem, por capítulo. */
  portents: Portent[]
  source: Source
}

export interface Location {
  id: string
  name: string
  parent?: string
  chapter: string
  summary: string
}

export interface Relation {
  from: string
  to: string
  type: RelationType
  label: string
  /** Aresta temporal: activa a partir deste beat (inclusive). */
  fromBeat?: string
  /** ...e até este beat (exclusive). */
  untilBeat?: string
  /** Condição narrativa, ex.: "só se os PCs seguirem a Cobalt Soul". */
  condition?: string
  source: Source
}

export interface Arc {
  id: string
  name: string
  kind: ArcKind
  color: string
  ownerPc?: string
  order: number
  summary: string
}

export interface Choice {
  label: string
  outcome: string
  /** Beats para onde esta escolha leva (opcional). */
  leadsTo: string[]
}

export interface Beat {
  id: string
  title: string
  arcs: string[]
  chapter: string
  order: number
  location?: string
  participants: string[]
  summary: string
  /** Revelações que este beat pode dar. */
  reveals: string[]
  /** Beats que têm de acontecer antes. */
  requires: string[]
  choices: Choice[]
  /** Relógio / prazo, ex.: "3 dias", "10 rondas". */
  timer?: string
  /** Portento: se ligado a uma facção, o que ela faz se ninguém a travar. */
  portent?: { faction: string; text: string }
  notes: string
  source: Source
}

export interface Revelation {
  id: string
  /** Lista a que pertence: "Campaign Agendas", "Lore of Alyxian", "Ank'Harel"... */
  list: string
  text: string
  /** Beats onde há uma pista para esta revelação (regra das três pistas). */
  clues: string[]
  source: Source
}

export interface Ambition {
  id: string
  pc: string
  text: string
  npcs: string[]
  arcs: string[]
  satisfiedBy: string[]
  threatenedBy: string[]
  source: Source
}

export interface Session {
  id: string
  date: string
  title: string
  beats: string[]
  notes: string
}

/** Estado de jogo (data/state.json): o que já aconteceu na mesa. */
export interface PlayState {
  version: 1
  playedBeats: string[]
  revealed: string[]
  /** `${factionId}:${chapterId}` */
  portentsDone: string[]
  attitudes: Record<string, Attitude>
  flags: Record<string, boolean>
  notes: Record<string, string>
  sessions: Session[]
  currentChapter: string | null
}

export interface Canon {
  campaign: Campaign
  arcs: Arc[]
  characters: Character[]
  factions: Faction[]
  locations: Location[]
  relations: Relation[]
  beats: Beat[]
  revelations: Revelation[]
  ambitions: Ambition[]
}

export type Collection = keyof Omit<Canon, 'campaign'>
export const COLLECTIONS: Collection[] = [
  'arcs', 'characters', 'factions', 'locations', 'relations', 'beats', 'revelations', 'ambitions',
]

export interface Problem {
  level: 'error' | 'warn'
  where: string
  message: string
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function relationKey(r: Pick<Relation, 'from' | 'to' | 'type'>): string {
  return `${r.from}|${r.to}|${r.type}`
}
