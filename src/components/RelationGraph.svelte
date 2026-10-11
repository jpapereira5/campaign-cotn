<script lang="ts">
  // O grafo de relações (docs/arquitetura.md, secção 8): quem se liga a quem, com as relações do cabeçalho e as do
  // registo, no fim do capítulo escolhido. Clicar num nó abre a Ficha; «só vizinhos» isola a rede de uma personagem.
  import { onMount } from 'svelte'
  import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter, forceX, forceY, type Simulation, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force'
  import { ui, world, abrirFicha } from '../lib/state.svelte'
  import { construirGrafo, TIPOS_PERSONAGEM, type No, type Aresta } from '../lib/grafo'
  import { KIND_COLORS, FACTION_NODE_COLOR, RELATION_STYLES, RELATION_LABELS, KIND_LABELS, type RelationType } from '../lib/colors'
  import { porPasta } from '../lib/arquivo/arvore'

  interface SimNode extends SimulationNodeDatum, No {}
  interface SimLink extends SimulationLinkDatum<SimNode> {
    chave: string
    aresta: Aresta
  }

  let width = $state(800)
  let height = $state(600)
  let frame = $state(0)
  let hover = $state<string | null>(null)
  let view = $state({ x: 0, y: 0, k: 1 })
  let container: HTMLDivElement
  let showFilters = $state(false)
  let showLegend = $state(false)

  const nodeMap = new Map<string, SimNode>()
  let nodes: SimNode[] = []
  // svelte-ignore non_reactive_update
  let links: SimLink[] = []
  let sim: Simulation<SimNode, SimLink> | null = null

  const campanha = $derived(world.campanha)
  const pastas = $derived(porPasta(world.arvore))
  const facoes = $derived(pastas.facoes.map((d) => ({ id: String(d.meta.id), nome: String(d.meta.nome ?? d.meta.id) })))
  const arcos = $derived(campanha.arcos.filter((a) => a.meta.subtipo !== 'pcAmbition').map((a) => ({ id: String(a.meta.id), nome: String(a.meta.nome ?? a.meta.id), cor: String(a.meta.cor ?? '#888') })))
  const pcs = $derived(campanha.pcs.map((d) => ({ id: String(d.meta.id), nome: String(d.meta.nome ?? d.meta.id) })))
  const PALETA = ['#5d8fd1', '#b8443c', '#3f79b8', '#8a7f6b', '#8fa3c7', '#b08968', '#6fbf73', '#e08bb0']
  const corFacao = $derived.by(() => {
    const m = new Map<string, string>()
    facoes.forEach((f, i) => {
      const arco = campanha.arcos.find((a) => a.meta.id === 'a-' + f.id.slice(2))
      m.set(f.id, arco && typeof arco.meta.cor === 'string' ? arco.meta.cor : PALETA[i % PALETA.length])
    })
    return (id: string) => m.get(id) ?? FACTION_NODE_COLOR
  })
  const selectedId = $derived(ui.focoGrafo)
  const grafo = $derived(construirGrafo({ arvore: world.arvore, campanha, estado: world.estado, filtros: ui.filtros, capitulo: ui.capituloGrafo, foco: selectedId, corTipo: KIND_COLORS, corFacao }))
  const focus = $derived(hover ?? selectedId)
  const activeFilters = $derived(ui.filtros.facoes.length + ui.filtros.arcos.length + (ui.filtros.pc ? 1 : 0) + (TIPOS_PERSONAGEM.length - ui.filtros.tipos.length) + (ui.filtros.mostrarFacoes ? 0 : 1))
  const estilo = (tipo: string) => RELATION_STYLES[tipo as RelationType] ?? RELATION_STYLES.knows
  const rotulo = (tipo: string) => RELATION_LABELS[tipo as RelationType] ?? tipo

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

  function anchorFor(n: No): { x: number; y: number } {
    const f = n.tipo === 'facao' ? n.id : (Array.isArray(n.doc.meta.facoes) ? (n.doc.meta.facoes as string[])[0] : undefined)
    const fs = facoes.map((x) => x.id)
    const idx = f ? fs.indexOf(f) : -1
    if (idx < 0) return { x: width / 2, y: height / 2 }
    const a = (idx / Math.max(fs.length, 1)) * Math.PI * 2
    const r = Math.min(width, height) * 0.32
    return { x: width / 2 + Math.cos(a) * r, y: height / 2 + Math.sin(a) * r }
  }

  $effect(() => {
    const g = grafo
    const w = width
    const h = height
    const next: SimNode[] = g.nos.map((n) => {
      const existing = nodeMap.get(n.id)
      const a = anchorFor(n)
      const sn: SimNode = existing ? Object.assign(existing, n) : { ...n, x: a.x + (Math.random() - 0.5) * 80, y: a.y + (Math.random() - 0.5) * 80 }
      nodeMap.set(n.id, sn)
      return sn
    })
    const ids = new Set(next.map((n) => n.id))
    const nextLinks: SimLink[] = g.arestas.filter((l) => ids.has(l.de) && ids.has(l.com)).map((l) => ({ chave: l.chave, aresta: l, source: l.de, target: l.com }))
    nodes = next
    links = nextLinks
    if (!sim) {
      sim = forceSimulation<SimNode, SimLink>()
        .force('charge', forceManyBody().strength(-380))
        .force('collide', forceCollide<SimNode>().radius((d) => d.raio + 8))
        .force('center', forceCenter(w / 2, h / 2))
        .on('tick', () => frame++)
    }
    sim.force('link', null)
    sim.nodes(next)
    sim.force('link', forceLink<SimNode, SimLink>(nextLinks).id((d) => d.id).distance(next.length < 40 ? 120 : 95).strength((l) => (l.aresta.relacao.tipo === 'memberOf' ? 0.8 : l.aresta.relacao.tipo === 'knows' ? 0.15 : 0.4)))
    sim.force('x', forceX<SimNode>((d) => anchorFor(d).x).strength(0.05))
    sim.force('y', forceY<SimNode>((d) => anchorFor(d).y).strength(0.05))
    sim.force('center', forceCenter(w / 2, h / 2))
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

  // ---- interação: pan/zoom/drag ------------------------------------------
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
      // um clique escolhe o nó (foco); um segundo clique no mesmo nó abre a Ficha
      if (!drag.moved) {
        if (ui.focoGrafo === drag.node.id) abrirFicha(drag.node.id)
        else ui.focoGrafo = drag.node.id
      }
      if (!e.shiftKey) {
        drag.node.fx = null
        drag.node.fy = null
      }
      sim?.alphaTarget(0)
    } else if (!drag.moved) {
      ui.focoGrafo = null
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
  function resetView() {
    view = { x: 0, y: 0, k: 1 }
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
  function isFocused(l: Aresta) {
    return focus === l.de || focus === l.com
  }
  function toggleIn(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }
  function clearFilters() {
    ui.filtros.facoes = []
    ui.filtros.arcos = []
    ui.filtros.pc = null
    ui.filtros.pesquisa = ''
    ui.filtros.tipos = [...TIPOS_PERSONAGEM]
    ui.filtros.mostrarFacoes = true
  }
  const nomeFoco = $derived(selectedId ? world.indice.nome(selectedId) : '')
</script>

<div class="wrap">
  <div class="toolbar">
    <div class="seg" title="Quem aparece: quem entra no capítulo escolhido, toda a gente até esse capítulo, quem a mesa já conheceu, ou toda a campanha">
      <button class:active={ui.filtros.ambito === 'capitulo'} onclick={() => (ui.filtros.ambito = 'capitulo')}>Neste capítulo</button>
      <button class:active={ui.filtros.ambito === 'ate-agora'} onclick={() => (ui.filtros.ambito = 'ate-agora')}>Até agora</button>
      <button class:active={ui.filtros.ambito === 'registo'} onclick={() => (ui.filtros.ambito = 'registo')} title="Só quem já entrou no registo das sessões">Já conhecidos</button>
      <button class:active={ui.filtros.ambito === 'tudo'} onclick={() => (ui.filtros.ambito = 'tudo')}>Tudo</button>
    </div>
    <select bind:value={ui.capituloGrafo} title="O capítulo: condiciona quem aparece e as relações com início ou fim">
      {#each campanha.capitulos as ch (ch.id)}<option value={ch.id}>{ch.nome}{ch.id === campanha.capituloAtual ? ' (a mesa está aqui)' : ''}</option>{/each}
    </select>
    <input type="search" placeholder="filtrar por nome…" bind:value={ui.filtros.pesquisa} />
    <div class="popwrap">
      <button class:active={showFilters || activeFilters > 0} onclick={() => (showFilters = !showFilters)}>Filtros{#if activeFilters} ({activeFilters}){/if} ▾</button>
      {#if showFilters}
        <div class="pop">
          <div class="pop-sec">
            <div class="pop-title">Tipos</div>
            {#each TIPOS_PERSONAGEM as k (k)}
              <label><input type="checkbox" checked={ui.filtros.tipos.includes(k)} onchange={() => (ui.filtros.tipos = toggleIn(ui.filtros.tipos, k) as typeof ui.filtros.tipos)} /> <span style:color={KIND_COLORS[k]}>●</span> {KIND_LABELS[k]}</label>
            {/each}
            <label><input type="checkbox" bind:checked={ui.filtros.mostrarFacoes} /> ■ Fações como nós</label>
          </div>
          <div class="pop-sec">
            <div class="pop-title">Só destas fações</div>
            <div class="pop-list">
              {#each facoes as f (f.id)}
                <label><input type="checkbox" checked={ui.filtros.facoes.includes(f.id)} onchange={() => (ui.filtros.facoes = toggleIn(ui.filtros.facoes, f.id))} /> {f.nome}</label>
              {/each}
            </div>
          </div>
          <div class="pop-sec">
            <div class="pop-title">Só quem entra nestes arcos</div>
            <div class="pop-list">
              {#each arcos as a (a.id)}
                <label><input type="checkbox" checked={ui.filtros.arcos.includes(a.id)} onchange={() => (ui.filtros.arcos = toggleIn(ui.filtros.arcos, a.id))} /> <span style:color={a.cor}>●</span> {a.nome}</label>
              {/each}
            </div>
          </div>
          {#if pcs.length}
            <div class="pop-sec">
              <div class="pop-title">À volta de um PC</div>
              <select bind:value={ui.filtros.pc}>
                <option value={null}>todos</option>
                {#each pcs as p (p.id)}<option value={p.id}>{p.nome}</option>{/each}
              </select>
            </div>
          {/if}
          <div class="row"><button class="small" onclick={clearFilters}>Limpar filtros</button><span class="spacer"></span><button class="small ghost" onclick={() => (showFilters = false)}>Fechar</button></div>
        </div>
      {/if}
    </div>
    <label class="toggle" class:on={ui.filtros.ego} title={selectedId ? 'Mostrar só a personagem escolhida e quem se liga a ela' : 'Escolhe primeiro uma personagem (um clique num nó)'}>
      <input type="checkbox" bind:checked={ui.filtros.ego} disabled={!selectedId} />◎ só vizinhos
    </label>
    {#if selectedId}<button class="chip small" onclick={() => abrirFicha(selectedId!)} title="Abrir a ficha">{nomeFoco} →</button>{/if}
    <span class="spacer"></span>
    <span class="muted small">{drawn.nodes.length} nós · {drawn.links.length} ligações</span>
    <button class="icon ghost" onclick={resetView} title="Repor zoom">⤢</button>
    <button class="ghost small" class:active={showLegend} onclick={() => (showLegend = !showLegend)}>Legenda</button>
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
        {#each drawn.links as d (d.l.chave)}
          {@const st = estilo(d.l.aresta.relacao.tipo)}
          {@const f = isFocused(d.l.aresta)}
          {@const registo = d.l.aresta.relacao.fonte === 'registo'}
          <path d={edgePath(d.x1, d.y1, d.x2, d.y2, d.l.aresta.curva)} fill="none" stroke={st.color} stroke-width={(f ? st.width + 1.2 : st.width) + (registo ? 0.8 : 0)} stroke-dasharray={st.dash} opacity={focus && !f ? 0.1 : registo ? 1 : 0.85} marker-end={st.arrow ? `url(#arrow-${d.l.aresta.relacao.tipo})` : undefined}>
            <title>{world.indice.nome(d.l.aresta.de)} {rotulo(d.l.aresta.relacao.tipo)} {world.indice.nome(d.l.aresta.com)}{d.l.aresta.relacao.nota ? `: ${d.l.aresta.relacao.nota}` : ''}{registo ? ' (do registo)' : ''}</title>
          </path>
          {#if f}
            <text x={(d.x1 + d.x2) / 2} y={(d.y1 + d.y2) / 2 - 4} font-size="10" font-family="IBM Plex Sans Condensed, sans-serif" font-weight="600" fill={st.color} text-anchor="middle" paint-order="stroke" stroke="#ffffff" stroke-width="3">{d.l.aresta.relacao.nota || rotulo(d.l.aresta.relacao.tipo)}</text>
          {/if}
        {/each}
        {#each drawn.nodes as d (d.n.id)}
          {@const dim = focus && focus !== d.n.id && !links.some((l) => (l.aresta.de === focus && l.aresta.com === d.n.id) || (l.aresta.com === focus && l.aresta.de === d.n.id))}
          <g transform="translate({d.x},{d.y})" class="node" opacity={dim ? 0.25 : 1} onpointerdown={(e) => onNodeDown(d.n, e)} onpointerenter={() => (hover = d.n.id)} onpointerleave={() => (hover = null)} role="button" tabindex="-1">
            {#if d.n.tipo === 'facao'}
              <rect x={-d.n.raio} y={-d.n.raio} width={d.n.raio * 2} height={d.n.raio * 2} rx="4" fill={d.n.cor} stroke={selectedId === d.n.id ? '#0b1f29' : '#ffffff'} stroke-width={selectedId === d.n.id ? 3 : 1.5} />
            {:else}
              <circle r={d.n.raio} fill={d.n.cor} stroke={selectedId === d.n.id ? '#0b1f29' : d.n.anel ?? '#ffffff'} stroke-width={selectedId === d.n.id ? 3 : d.n.anel ? 2.5 : 1.5} />
            {/if}
            <text y={d.n.raio + 11} font-size={d.n.tipo === 'pc' || d.n.tipo === 'facao' ? 12 : 10} font-family="Atkinson Hyperlegible, sans-serif" font-weight={d.n.tipo === 'pc' || d.n.tipo === 'facao' ? 700 : 400} text-anchor="middle" fill="#0b1f29" paint-order="stroke" stroke="#edf1f2" stroke-width="3">{d.n.nome}</text>
          </g>
        {/each}
      </g>
    </svg>
    {#if !drawn.nodes.length}
      <div class="empty-overlay"><div class="empty">Ninguém a mostrar com estes filtros{ui.filtros.ambito === 'capitulo' ? ` em ${campanha.nomeCapitulo(ui.capituloGrafo)}` : ''}. Experimenta o âmbito «Até agora» ou «Tudo».</div></div>
    {/if}
    <div class="hint muted tiny">clique: escolher · segundo clique: ficha · arrastar: mover (Shift fixa) · roda: zoom · clique no fundo: limpar</div>
    {#if showLegend}
      <div class="legend">
        <div class="legend-title">Nós</div>
        {#each TIPOS_PERSONAGEM as k (k)}<span><i class="sw" style:background={KIND_COLORS[k]}></i>{KIND_LABELS[k]}</span>{/each}
        <span><i class="sw sq" style:background={FACTION_NODE_COLOR}></i>Fação</span>
        <span class="muted">anel = 1.ª fação · tamanho = n.º de relações · traço mais grosso = relação vinda do registo</span>
        <div class="legend-title">Ligações</div>
        {#each Object.entries(RELATION_STYLES) as [t, s] (t)}
          <span><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke={s.color} stroke-width="2" stroke-dasharray={s.dash} /></svg>{RELATION_LABELS[t as RelationType]}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .toolbar input[type='search'] {
    width: 190px;
  }
  .toolbar select {
    max-width: 280px;
  }
  .popwrap {
    position: relative;
  }
  .pop {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 10;
    background: var(--bg-2);
    border: 1px solid var(--line-2);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow);
    padding: 0.7rem 0.9rem;
    width: min(360px, 90vw);
    max-height: 70vh;
    overflow: auto;
  }
  .pop-sec {
    margin-bottom: 0.7rem;
  }
  .pop-title {
    font-family: var(--font-cond);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  .pop label {
    display: block;
    padding: 0.12rem 0;
    cursor: pointer;
  }
  .pop-list {
    max-height: 160px;
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    padding: 0.2rem 0.5rem;
  }
  .canvas {
    flex: 1;
    position: relative;
    overflow: hidden;
    margin: 0 1.4rem 1rem;
    border: 1px solid var(--line-2);
    border-radius: var(--radius);
    background: var(--bg-2);
  }
  svg {
    display: block;
    touch-action: none;
    cursor: grab;
  }
  .node {
    cursor: pointer;
  }
  .hint {
    position: absolute;
    left: 0.75rem;
    bottom: 0.5rem;
    pointer-events: none;
  }
  .legend {
    position: absolute;
    right: 0.75rem;
    top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.78em;
    color: var(--text);
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid var(--line);
    padding: 0.5rem 0.7rem;
    border-radius: var(--radius-s);
    max-height: calc(100% - 1.5rem);
    overflow: auto;
  }
  .legend-title {
    font-family: var(--font-cond);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    font-weight: 700;
    margin-top: 0.3rem;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .sw {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
  .sw.sq {
    border-radius: 2px;
  }
  .empty-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    padding: 2rem;
  }
  .empty-overlay .empty {
    max-width: 420px;
    background: var(--bg-2);
    pointer-events: auto;
  }
  button.small {
    font-size: 0.86em;
    padding: 0.3rem 0.7rem;
  }
  .toolbar > button:not(.icon):not(.small) {
    min-height: 44px;
    border-radius: 999px;
    padding: 0 14px;
  }
</style>
