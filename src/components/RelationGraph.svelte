<script lang="ts">
  import { onMount } from 'svelte'
  import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter, forceX, forceY, type Simulation, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force'
  import { ui, world, select } from '../lib/state.svelte'
  import { buildGraph, type GNode, type GLink } from '../lib/graph'
  import { KIND_COLORS, FACTION_NODE_COLOR, RELATION_STYLES, RELATION_LABELS, KIND_LABELS } from '../lib/colors'
  import { CHARACTER_KINDS } from '../lib/types'

  interface SimNode extends SimulationNodeDatum, GNode {}
  interface SimLink extends SimulationLinkDatum<SimNode> {
    key: string
    link: GLink
  }

  let width = $state(800)
  let height = $state(600)
  let frame = $state(0)
  let hover = $state<string | null>(null)
  let view = $state({ x: 0, y: 0, k: 1 })
  let container: HTMLDivElement

  const nodeMap = new Map<string, SimNode>()
  let nodes: SimNode[] = []
  // svelte-ignore non_reactive_update
  let links: SimLink[] = []
  let sim: Simulation<SimNode, SimLink> | null = null

  const factionColors = $derived(new Map(world.canon.factions.map((f, i) => [f.id, world.canon.arcs.find((a) => a.id === 'a-' + f.id.slice(2))?.color ?? ['#5d8fd1', '#b8443c', '#3f79b8', '#8a7f6b', '#8fa3c7', '#b08968', '#6fbf73', '#e08bb0'][i % 8]])))
  const graph = $derived(buildGraph(world.canon, world.cursor, ui.filters, world.beatPos, KIND_COLORS, FACTION_NODE_COLOR, factionColors))
  const selectedId = $derived(ui.selection && (ui.selection.kind === 'character' || ui.selection.kind === 'faction') ? ui.selection.id : null)
  const focus = $derived(hover ?? selectedId)

  // Ponte d3 → Svelte: cada tick incrementa `frame`; o template lê `drawn`.
  const drawn = $derived.by(() => {
    void frame
    return {
      nodes: nodes.map((n) => ({ n, x: n.x ?? 0, y: n.y ?? 0 })),
      links: links.map((l) => {
        const s = l.source as SimNode
        const t = l.target as SimNode
        return { l, x1: s.x ?? 0, y1: s.y ?? 0, x2: t.x ?? 0, y2: t.y ?? 0 }
      }),
    }
  })

  function anchorFor(n: GNode, i: number, count: number): { x: number; y: number } {
    const f = n.kind === 'faction' ? n.id : n.character?.factions[0]
    const fs = world.canon.factions.map((x) => x.id)
    const idx = f ? fs.indexOf(f) : -1
    if (idx < 0) return { x: width / 2, y: height / 2 }
    const a = (idx / Math.max(fs.length, 1)) * Math.PI * 2
    const r = Math.min(width, height) * 0.32
    void i
    void count
    return { x: width / 2 + Math.cos(a) * r, y: height / 2 + Math.sin(a) * r }
  }

  $effect(() => {
    const g = graph
    const w = width
    const h = height
    const next: SimNode[] = g.nodes.map((n, i) => {
      const existing = nodeMap.get(n.id)
      const a = anchorFor(n, i, g.nodes.length)
      const sn: SimNode = existing ? Object.assign(existing, n) : { ...n, x: a.x + (Math.random() - 0.5) * 80, y: a.y + (Math.random() - 0.5) * 80 }
      nodeMap.set(n.id, sn)
      return sn
    })
    const ids = new Set(next.map((n) => n.id))
    const nextLinks: SimLink[] = g.links.filter((l) => ids.has(l.source) && ids.has(l.target)).map((l) => ({ key: l.key, link: l, source: l.source, target: l.target }))
    nodes = next
    links = nextLinks
    if (!sim) {
      sim = forceSimulation<SimNode, SimLink>()
        .force('charge', forceManyBody().strength(-260))
        .force('collide', forceCollide<SimNode>().radius((d) => d.radius + 8))
        .force('center', forceCenter(w / 2, h / 2))
        .on('tick', () => frame++)
    }
    sim.force('link', forceLink<SimNode, SimLink>(nextLinks).id((d) => d.id).distance(80).strength((l) => (l.link.relation.type === 'memberOf' ? 0.8 : l.link.relation.type === 'knows' ? 0.15 : 0.4)))
    sim.force('x', forceX<SimNode>((d, i) => anchorFor(d, i, next.length).x).strength(0.05))
    sim.force('y', forceY<SimNode>((d, i) => anchorFor(d, i, next.length).y).strength(0.05))
    sim.force('center', forceCenter(w / 2, h / 2))
    sim.nodes(next)
    sim.alpha(0.6).restart()
  })

  onMount(() => {
    const ro = new ResizeObserver(() => {
      width = container.clientWidth
      height = container.clientHeight
    })
    ro.observe(container)
    width = container.clientWidth
    height = container.clientHeight
    return () => {
      ro.disconnect()
      sim?.stop()
    }
  })

  // ---- interacção: pan/zoom/drag ------------------------------------------
  let drag: { node: SimNode | null; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null

  function toWorld(e: PointerEvent): { x: number; y: number } {
    const r = container.getBoundingClientRect()
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k }
  }
  function onNodeDown(n: SimNode, e: PointerEvent) {
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    const p = toWorld(e)
    drag = { node: n, sx: p.x, sy: p.y, ox: n.x ?? 0, oy: n.y ?? 0, moved: false }
    n.fx = n.x
    n.fy = n.y
    sim?.alphaTarget(0.3).restart()
  }
  function onBgDown(e: PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    drag = { node: null, sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false }
  }
  function onMove(e: PointerEvent) {
    if (!drag) return
    if (drag.node) {
      const p = toWorld(e)
      drag.node.fx = drag.ox + (p.x - drag.sx)
      drag.node.fy = drag.oy + (p.y - drag.sy)
      if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 3) drag.moved = true
    } else {
      view.x = drag.ox + (e.clientX - drag.sx)
      view.y = drag.oy + (e.clientY - drag.sy)
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) drag.moved = true
    }
  }
  function onUp(e: PointerEvent) {
    if (!drag) return
    if (drag.node) {
      if (!drag.moved) select(drag.node.kind === 'faction' ? 'faction' : 'character', drag.node.id)
      if (!e.shiftKey) {
        drag.node.fx = null
        drag.node.fy = null
      }
      sim?.alphaTarget(0)
    } else if (!drag.moved) {
      ui.selection = null
    }
    drag = null
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const r = container.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top
    const k = Math.min(3, Math.max(0.3, view.k * (e.deltaY < 0 ? 1.1 : 0.9)))
    view.x = mx - ((mx - view.x) * k) / view.k
    view.y = my - ((my - view.y) * k) / view.k
    view.k = k
  }

  function edgePath(x1: number, y1: number, x2: number, y2: number, curve: number): string {
    if (!curve) return `M${x1},${y1} L${x2},${y2}`
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    const off = 18 * curve
    return `M${x1},${y1} Q${mx - (dy / len) * off},${my + (dx / len) * off} ${x2},${y2}`
  }
  function isFocused(l: GLink) {
    return focus === l.source || focus === l.target
  }

  const factions = $derived(world.canon.factions)
  const arcs = $derived(world.canon.arcs.filter((a) => a.kind !== 'pcAmbition'))
  const pcs = $derived(world.canon.characters.filter((c) => c.kind === 'pc'))
  function toggleIn(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }
</script>

<div class="wrap">
  <div class="filters">
    <input type="search" placeholder="procurar nome…" bind:value={ui.filters.search} />
    <div class="group">
      {#each CHARACTER_KINDS as k (k)}
        <label><input type="checkbox" checked={ui.filters.kinds.includes(k)} onchange={() => (ui.filters.kinds = toggleIn(ui.filters.kinds, k) as typeof ui.filters.kinds)} /> <span style:color={KIND_COLORS[k]}>{KIND_LABELS[k]}</span></label>
      {/each}
      <label><input type="checkbox" bind:checked={ui.filters.showFactions} /> facções como nós</label>
    </div>
    <details>
      <summary>Facções {ui.filters.factions.length ? `(${ui.filters.factions.length})` : ''}</summary>
      {#each factions as f (f.id)}
        <label><input type="checkbox" checked={ui.filters.factions.includes(f.id)} onchange={() => (ui.filters.factions = toggleIn(ui.filters.factions, f.id))} /> {f.name}</label>
      {/each}
    </details>
    <details>
      <summary>Arcos {ui.filters.arcs.length ? `(${ui.filters.arcs.length})` : ''}</summary>
      {#each arcs as a (a.id)}
        <label><input type="checkbox" checked={ui.filters.arcs.includes(a.id)} onchange={() => (ui.filters.arcs = toggleIn(ui.filters.arcs, a.id))} /> <span style:color={a.color}>{a.name}</span></label>
      {/each}
    </details>
    {#if pcs.length}
      <select bind:value={ui.filters.pc}>
        <option value={null}>todos os PCs</option>
        {#each pcs as p (p.id)}<option value={p.id}>à volta de {p.name}</option>{/each}
      </select>
    {/if}
    <button onclick={() => { ui.filters.factions = []; ui.filters.arcs = []; ui.filters.pc = null; ui.filters.search = '' }}>limpar</button>
    <span class="muted">{drawn.nodes.length} nós · {drawn.links.length} ligações no tempo escolhido · arrastar: mover (Shift fixa) · roda: zoom</span>
  </div>
  <div class="canvas" bind:this={container}>
    <svg {width} {height} onpointerdown={onBgDown} onpointermove={onMove} onpointerup={onUp} onwheel={onWheel} role="img" aria-label="Grafo de relações">
      <defs>
        {#each Object.entries(RELATION_STYLES) as [t, s] (t)}
          <marker id="arrow-{t}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={s.color} />
          </marker>
        {/each}
      </defs>
      <g transform="translate({view.x},{view.y}) scale({view.k})">
        {#each drawn.links as d (d.l.key)}
          {@const st = RELATION_STYLES[d.l.link.relation.type]}
          {@const f = isFocused(d.l.link)}
          <path d={edgePath(d.x1, d.y1, d.x2, d.y2, d.l.link.curve)} fill="none" stroke={st.color} stroke-width={f ? st.width + 1.2 : st.width} stroke-dasharray={st.dash} opacity={focus && !f ? 0.12 : 0.85} marker-end={st.arrow ? `url(#arrow-${d.l.link.relation.type})` : undefined}>
            <title>{d.l.link.source} {RELATION_LABELS[d.l.link.relation.type]} {d.l.link.target}: {d.l.link.relation.label}</title>
          </path>
          {#if f}
            <text x={(d.x1 + d.x2) / 2} y={(d.y1 + d.y2) / 2 - 4} font-size="10" fill={st.color} text-anchor="middle" paint-order="stroke" stroke="#15120f" stroke-width="3">{d.l.link.relation.label || RELATION_LABELS[d.l.link.relation.type]}</text>
          {/if}
        {/each}
        {#each drawn.nodes as d (d.n.id)}
          {@const dim = focus && focus !== d.n.id && !links.some((l) => (l.link.source === focus && l.link.target === d.n.id) || (l.link.target === focus && l.link.source === d.n.id))}
          <g transform="translate({d.x},{d.y})" class="node" opacity={dim ? 0.3 : 1} onpointerdown={(e) => onNodeDown(d.n, e)} onpointerenter={() => (hover = d.n.id)} onpointerleave={() => (hover = null)} role="button" tabindex="-1">
            {#if d.n.kind === 'faction'}
              <rect x={-d.n.radius} y={-d.n.radius} width={d.n.radius * 2} height={d.n.radius * 2} rx="4" fill={d.n.color} stroke={selectedId === d.n.id ? '#fff' : '#15120f'} stroke-width="1.5" />
            {:else}
              <circle r={d.n.radius} fill={d.n.color} stroke={selectedId === d.n.id ? '#fff' : d.n.ring ?? '#15120f'} stroke-width={d.n.ring ? 2.5 : 1.5} />
            {/if}
            <text y={d.n.radius + 11} font-size={d.n.kind === 'pc' || d.n.kind === 'faction' ? 12 : 10} text-anchor="middle" fill="#ece3d4" paint-order="stroke" stroke="#15120f" stroke-width="3">{d.n.label}</text>
          </g>
        {/each}
      </g>
    </svg>
    <div class="legend">
      {#each Object.entries(RELATION_STYLES) as [t, s] (t)}
        <span><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke={s.color} stroke-width="2" stroke-dasharray={s.dash} /></svg>{RELATION_LABELS[t as keyof typeof RELATION_LABELS]}</span>
      {/each}
    </div>
  </div>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
    padding: 0.4rem 1rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.9em;
  }
  .filters .group {
    display: flex;
    gap: 0.6rem;
  }
  .filters details {
    position: relative;
  }
  .filters details[open] > :not(summary) {
    display: block;
  }
  .filters details > label {
    display: block;
    position: relative;
    background: var(--bg-3);
    padding: 0.1rem 0.5rem;
  }
  .canvas {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: var(--bg);
  }
  svg {
    display: block;
    touch-action: none;
    cursor: grab;
  }
  .node {
    cursor: pointer;
  }
  .legend {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.8rem;
    font-size: 0.75em;
    color: var(--muted);
    background: rgba(21, 18, 15, 0.8);
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    max-width: 60%;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
</style>
