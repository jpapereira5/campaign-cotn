// Layout da linha temporal em pistas (puro, sem DOM).
import type { Arc, Beat, Campaign } from './types.ts'

export const SLOT_W = 150
export const CARD_W = 136
export const CARD_H = 46
export const GAP = 6
export const LANE_PAD = 10
export const COL_PAD = 24
export const AXIS_H = 34
export const FINALE_W = 170

const KIND_ORDER = ['prologue', 'main', 'lore', 'ruidium', 'rivals', 'faction', 'pcAmbition']

export interface Column {
  id: string
  name: string
  x: number
  width: number
}
export interface Lane {
  arc: Arc
  y: number
  height: number
}
export interface Card {
  beat: Beat
  arc: Arc
  x: number
  y: number
  cx: number
  cy: number
}
export interface Ghost {
  beat: Beat
  arc: Arc
  x: number
  y: number
}
export interface Link {
  beat: Beat
  color: string
  x: number
  y1: number
  y2: number
}
export interface Dependency {
  from: string
  to: string
  x1: number
  y1: number
  x2: number
  y2: number
}
export interface TimelineLayout {
  width: number
  height: number
  columns: Column[]
  lanes: Lane[]
  cards: Card[]
  ghosts: Ghost[]
  links: Link[]
  deps: Dependency[]
  finale?: { beat: Beat; x: number; y: number; width: number; height: number }
  cardById: Map<string, Card>
}

export function orderArcs(arcs: Arc[]): Arc[] {
  return [...arcs].sort((a, b) => {
    const ka = KIND_ORDER.indexOf(a.kind)
    const kb = KIND_ORDER.indexOf(b.kind)
    if (ka !== kb) return ka - kb
    return a.order - b.order || a.name.localeCompare(b.name)
  })
}

export function layoutTimeline(beats: Beat[], arcs: Arc[], campaign: Campaign): TimelineLayout {
  const arcById = new Map(arcs.map((a) => [a.id, a]))
  const lanesArcs = orderArcs(arcs)
  const finaleId = campaign.convergence
  const finaleBeat = beats.find((b) => b.id === finaleId)
  const body = beats.filter((b) => b.id !== finaleId && b.arcs.some((a) => arcById.has(a)))

  // Colunas: por capítulo; slots = valores distintos de `order` no capítulo.
  const columns: Column[] = []
  const slotX = new Map<string, number>() // `${chapter}|${order}` → x
  let x = 0
  let finaleX = 0
  for (const ch of campaign.chapters) {
    const orders = [...new Set(body.filter((b) => b.chapter === ch.id).map((b) => b.order))].sort((a, b) => a - b)
    let width = Math.max(orders.length, 1) * SLOT_W + COL_PAD
    orders.forEach((o, i) => slotX.set(`${ch.id}|${o}`, x + COL_PAD / 2 + i * SLOT_W))
    if (finaleBeat && finaleBeat.chapter === ch.id) {
      // o centro da teia fica no fim da coluna do seu capítulo; capítulos seguintes continuam à direita
      finaleX = x + COL_PAD / 2 + Math.max(orders.length, 1) * SLOT_W
      width += FINALE_W + COL_PAD
    }
    columns.push({ id: ch.id, name: ch.name, x, width })
    x += width
  }
  if (finaleBeat && !finaleX) {
    finaleX = x + COL_PAD / 2
    x += FINALE_W + COL_PAD
  }
  const width = x

  // Cartões por pista com empilhamento greedy; ghosts nas pistas secundárias.
  const lanes: Lane[] = []
  const cards: Card[] = []
  const ghosts: Ghost[] = []
  const links: Link[] = []
  const cardById = new Map<string, Card>()
  let y = AXIS_H
  const pending: { beat: Beat; primary: Arc; secondary: Arc[] }[] = []
  for (const b of body) {
    const arcsOf = b.arcs.map((a) => arcById.get(a)).filter((a): a is Arc => !!a)
    if (arcsOf.length === 0) continue
    const sorted = orderArcs(arcsOf)
    pending.push({ beat: b, primary: sorted[0], secondary: sorted.slice(1) })
  }
  const xOf = (b: Beat) => slotX.get(`${b.chapter}|${b.order}`) ?? 0

  for (const arc of lanesArcs) {
    const items: { beat: Beat; x: number; ghost: boolean }[] = []
    for (const p of pending) {
      if (p.primary.id === arc.id) items.push({ beat: p.beat, x: xOf(p.beat), ghost: false })
      else if (p.secondary.some((s) => s.id === arc.id)) items.push({ beat: p.beat, x: xOf(p.beat), ghost: true })
    }
    items.sort((a, b) => a.x - b.x || (a.ghost ? 1 : 0) - (b.ghost ? 1 : 0))
    const rowRight: number[] = []
    const placed: { item: (typeof items)[number]; row: number }[] = []
    for (const it of items) {
      const w = it.ghost ? 18 : CARD_W
      let row = rowRight.findIndex((r) => r + GAP <= it.x)
      if (row < 0) {
        row = rowRight.length
        rowRight.push(-Infinity)
      }
      rowRight[row] = it.x + w
      placed.push({ item: it, row })
    }
    const rows = Math.max(rowRight.length, 1)
    const height = rows * (CARD_H + GAP) + LANE_PAD
    lanes.push({ arc, y, height })
    for (const { item, row } of placed) {
      const cy = y + LANE_PAD / 2 + row * (CARD_H + GAP) + CARD_H / 2
      if (item.ghost) ghosts.push({ beat: item.beat, arc, x: item.x, y: cy })
      else {
        const card: Card = { beat: item.beat, arc, x: item.x, y: cy - CARD_H / 2, cx: item.x + CARD_W / 2, cy }
        cards.push(card)
        cardById.set(item.beat.id, card)
      }
    }
    y += height
  }
  const height = y + LANE_PAD

  for (const g of ghosts) {
    const c = cardById.get(g.beat.id)
    if (!c) continue
    links.push({ beat: g.beat, color: g.arc.color, x: c.x + 9, y1: c.cy, y2: g.y })
  }

  const deps: Dependency[] = []
  for (const c of cards) {
    for (const req of c.beat.requires) {
      const r = cardById.get(req)
      if (!r) continue
      deps.push({ from: req, to: c.beat.id, x1: r.x + CARD_W, y1: r.cy, x2: c.x, y2: c.cy })
    }
  }

  let finale: TimelineLayout['finale']
  if (finaleBeat) {
    finale = { beat: finaleBeat, x: finaleX, y: AXIS_H, width: FINALE_W, height: Math.max(height - AXIS_H - LANE_PAD, CARD_H) }
  }

  return { width, height, columns, lanes, cards, ghosts, links, deps, finale, cardById }
}
