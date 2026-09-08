// Pesquisa global sobre o canon (puro).
import type { Canon } from './types.ts'

export type SearchKind = 'character' | 'faction' | 'location' | 'beat' | 'revelation'
export interface SearchHit {
  kind: SearchKind
  id: string
  title: string
  subtitle: string
  score: number
}

const KIND_LABEL: Record<SearchKind, string> = {
  character: 'Personagens',
  faction: 'Facções',
  location: 'Locais',
  beat: 'Beats',
  revelation: 'Revelações',
}
export const SEARCH_KIND_LABELS = KIND_LABEL

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function scoreOf(q: string, title: string, body: string): number {
  const t = norm(title)
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.split(/\s+/).some((w) => w.startsWith(q))) return 70
  if (t.includes(q)) return 60
  if (norm(body).includes(q)) return 20
  return 0
}

export function searchCanon(canon: Canon, query: string, limit = 40): SearchHit[] {
  const q = norm(query.trim())
  if (q.length < 2) return []
  const chapterName = (id: string) => canon.campaign.chapters.find((c) => c.id === id)?.name ?? id
  const hits: SearchHit[] = []
  const push = (kind: SearchKind, id: string, title: string, subtitle: string, body: string) => {
    const score = scoreOf(q, title, body)
    if (score) hits.push({ kind, id, title, subtitle, score })
  }
  for (const c of canon.characters) push('character', c.id, c.name, [c.kind.toUpperCase(), c.chapters.join(', ')].filter(Boolean).join(' · '), c.summary + ' ' + c.tags.join(' '))
  for (const f of canon.factions) push('faction', f.id, f.name, f.motto || 'facção', f.agenda)
  for (const l of canon.locations) push('location', l.id, l.name, chapterName(l.chapter), l.summary)
  for (const b of canon.beats) push('beat', b.id, b.title, chapterName(b.chapter), b.summary)
  for (const r of canon.revelations) push('revelation', r.id, r.text, r.list, '')
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  return hits.slice(0, limit)
}
