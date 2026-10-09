// Estado de jogo (data/state.json). Puro (sem Vite nem DOM): usado pela app e pelo script de validação.
import type { PlayState } from './types.ts'

export function emptyPlay(): PlayState {
  return {
    version: 2,
    playedBeats: [],
    revealed: [],
    portentsDone: [],
    attitudes: {},
    flags: {},
    notes: {},
    sessions: [],
    currentChapter: null,
    choicesMade: {},
  }
}

export function normalizePlay(raw: unknown): PlayState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<PlayState>
  const strs = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [])
  const rec = <T>(v: unknown): Record<string, T> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {})
  const choicesMade: Record<string, string[]> = {}
  for (const [beat, v] of Object.entries(rec<unknown>(r.choicesMade))) {
    const labels = typeof v === 'string' ? [v] : strs(v)
    if (labels.length) choicesMade[beat] = labels
  }
  return {
    version: 2,
    playedBeats: strs(r.playedBeats),
    revealed: strs(r.revealed),
    portentsDone: strs(r.portentsDone),
    attitudes: rec(r.attitudes),
    flags: rec(r.flags),
    notes: rec(r.notes),
    sessions: (Array.isArray(r.sessions) ? r.sessions : []).map((raw) => {
      const s = rec<unknown>(raw)
      return {
        id: String(s.id ?? Math.random().toString(36).slice(2, 10)),
        date: String(s.date ?? ''),
        title: String(s.title ?? ''),
        beats: strs(s.beats),
        notes: String(s.notes ?? ''),
        chapter: typeof s.chapter === 'string' && s.chapter ? s.chapter : undefined,
        estado: s.estado === 'planeada' ? 'planeada' : 'jogada',
      }
    }),
    currentChapter: typeof r.currentChapter === 'string' ? r.currentChapter : null,
    choicesMade,
  }
}
