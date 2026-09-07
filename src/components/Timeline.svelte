<script lang="ts">
  import { ui, world, select, togglePlayed, isPlayed } from '../lib/state.svelte'
  import { layoutTimeline, CARD_W, CARD_H, AXIS_H, type Card } from '../lib/timeline'

  let hover = $state<string | null>(null)

  const beats = $derived(ui.onlyUnplayed ? world.canon.beats.filter((b) => !isPlayed(b.id) || b.id === world.canon.campaign.convergence) : world.canon.beats)
  const layout = $derived(layoutTimeline(beats, world.canon.arcs, world.canon.campaign))
  const selectedId = $derived(ui.selection?.kind === 'beat' ? ui.selection.id : null)
  const focus = $derived(hover ?? selectedId)

  /** x do "agora": fim da coluna do capítulo ou último beat jogado. */
  const nowX = $derived.by(() => {
    if (ui.cursorMode === 'played') {
      let best: Card | null = null
      for (const c of layout.cards) if (isPlayed(c.beat.id) && (!best || c.x > best.x)) best = c
      return best ? best.x + CARD_W + 4 : 0
    }
    const col = layout.columns.find((c) => c.id === ui.chapter)
    return col ? col.x + col.width : 0
  })

  function isFocusLink(id: string) {
    return focus === id
  }
  const focusRequires = $derived(new Set(focus ? (world.canon.beats.find((b) => b.id === focus)?.requires ?? []) : []))

  function onCardClick(c: Card, e: MouseEvent) {
    e.stopPropagation()
    select('beat', c.beat.id)
  }
</script>

<div class="wrap">
  <div class="toolbar row">
    <label><input type="checkbox" bind:checked={ui.showDeps} /> dependências (requires)</label>
    <label><input type="checkbox" bind:checked={ui.onlyUnplayed} /> só por jogar</label>
    <span class="muted">{layout.cards.length} beats · clique: detalhe · duplo clique: marcar jogado · linhas verticais = convergência entre pistas</span>
  </div>
  <div class="scroll">
    <div class="lanes-col" style:height="{layout.height}px" style:padding-top="{AXIS_H}px">
      {#each layout.lanes as lane (lane.arc.id)}
        <button class="lane-label" style:height="{lane.height}px" style:border-left-color={lane.arc.color} onclick={() => select('arc', lane.arc.id)} title={lane.arc.summary}>
          <span>{lane.arc.name}</span>
        </button>
      {/each}
    </div>
    <svg width={layout.width} height={layout.height} role="img" aria-label="Linha temporal">
      <!-- colunas / capítulos -->
      {#each layout.columns as col, i (col.id)}
        <rect x={col.x} y={0} width={col.width} height={layout.height} fill={i % 2 ? '#1a1611' : '#15120f'} />
        <line x1={col.x} y1={0} x2={col.x} y2={layout.height} stroke="#3b3128" />
        <text x={col.x + 8} y={20} fill="#a3968a" font-size="12">{col.name}</text>
      {/each}
      <!-- fundo das pistas -->
      {#each layout.lanes as lane (lane.arc.id)}
        <line x1={0} y1={lane.y} x2={layout.width} y2={lane.y} stroke="#2a231c" />
        <rect x={0} y={lane.y} width={4} height={lane.height} fill={lane.arc.color} opacity="0.6" />
      {/each}
      <!-- agora -->
      {#if nowX > 0}
        <line x1={nowX} y1={0} x2={nowX} y2={layout.height} stroke="#d9a441" stroke-dasharray="4 3" />
        <text x={nowX + 4} y={AXIS_H - 6} fill="#d9a441" font-size="11">agora</text>
      {/if}
      <!-- dependências -->
      {#if ui.showDeps}
        {#each layout.deps as d, i (i)}
          <path d="M{d.x1},{d.y1} C{d.x1 + 40},{d.y1} {d.x2 - 40},{d.y2} {d.x2},{d.y2}" fill="none" stroke={focus === d.to || focus === d.from ? '#d9a441' : '#4a4138'} stroke-dasharray="3 3" />
        {/each}
      {/if}
      <!-- ligações de convergência -->
      {#each layout.links as l, i (i)}
        <line x1={l.x} y1={l.y1} x2={l.x} y2={l.y2} stroke={l.color} stroke-width={isFocusLink(l.beat.id) ? 3 : 1.5} opacity={focus && !isFocusLink(l.beat.id) ? 0.25 : 0.8} />
      {/each}
      {#each layout.ghosts as g (g.beat.id + g.arc.id)}
        <circle cx={g.x + 9} cy={g.y} r={isFocusLink(g.beat.id) ? 7 : 5} fill={g.arc.color} stroke="#15120f" stroke-width="1.5" opacity={focus && !isFocusLink(g.beat.id) ? 0.35 : 1}>
          <title>{g.beat.title} · também em {g.arc.name}</title>
        </circle>
      {/each}
      <!-- cartões -->
      {#each layout.cards as c (c.beat.id)}
        {@const played = isPlayed(c.beat.id)}
        {@const dim = focus && focus !== c.beat.id && !focusRequires.has(c.beat.id)}
        <g
          class="beat"
          class:played
          class:selected={selectedId === c.beat.id}
          transform="translate({c.x},{c.y})"
          role="button"
          tabindex="0"
          onclick={(e) => onCardClick(c, e)}
          ondblclick={(e) => { e.stopPropagation(); togglePlayed(c.beat.id) }}
          onkeydown={(e) => e.key === 'Enter' && select('beat', c.beat.id)}
          onpointerenter={() => (hover = c.beat.id)}
          onpointerleave={() => (hover = null)}
          opacity={dim ? 0.45 : 1}
        >
          <rect width={CARD_W} height={CARD_H} rx="6" fill={played ? '#2f3a2b' : '#2a231c'} stroke={selectedId === c.beat.id ? '#d9a441' : focusRequires.has(c.beat.id) ? '#e0b04a' : c.arc.color} stroke-width={selectedId === c.beat.id ? 2 : 1} />
          <rect width={5} height={CARD_H} rx="2" fill={c.arc.color} />
          <foreignObject x="8" y="3" width={CARD_W - 12} height={CARD_H - 6}>
            <div class="card-text" title={c.beat.summary}>
              <div class="title">{c.beat.title}</div>
              <div class="meta">
                {#if c.beat.timer}⏱ {c.beat.timer}{/if}
                {#if c.beat.choices.length}⑂{c.beat.choices.length}{/if}
                {#if c.beat.arcs.length > 1}✦{c.beat.arcs.length}{/if}
                {#if played}✓{/if}
              </div>
            </div>
          </foreignObject>
        </g>
      {/each}
      <!-- final: o centro da teia -->
      {#if layout.finale}
        {@const f = layout.finale}
        <g class="finale" role="button" tabindex="0" onclick={() => select('beat', f.beat.id)} onkeydown={(e) => e.key === 'Enter' && select('beat', f.beat.id)}>
          {#each layout.lanes as lane (lane.arc.id)}
            <line x1={f.x - 12} y1={lane.y + lane.height / 2} x2={f.x} y2={lane.y + lane.height / 2} stroke={lane.arc.color} stroke-width="2" />
          {/each}
          <rect x={f.x} y={f.y} width={f.width} height={f.height} rx="10" fill="#2a1f1a" stroke={selectedId === f.beat.id ? '#d9a441' : '#8c5a2b'} stroke-width="2" />
          <foreignObject x={f.x + 8} y={f.y + 8} width={f.width - 16} height={f.height - 16}>
            <div class="finale-text">
              <div class="title">{f.beat.title}</div>
              <div class="muted">{f.beat.summary}</div>
            </div>
          </foreignObject>
        </g>
      {/if}
    </svg>
  </div>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .toolbar {
    padding: 0.4rem 1rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.9em;
  }
  .scroll {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: flex-start;
  }
  .lanes-col {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-2);
    border-right: 1px solid var(--line);
    width: 170px;
    flex: none;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
  .lane-label {
    display: flex;
    align-items: center;
    text-align: left;
    border: 0;
    border-left: 4px solid;
    border-radius: 0;
    background: transparent;
    padding: 0 0.5rem;
    font-size: 0.85em;
    overflow: hidden;
  }
  .lane-label span {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  svg {
    display: block;
    flex: none;
  }
  g.beat {
    cursor: pointer;
  }
  .card-text {
    font-size: 11px;
    line-height: 1.2;
    color: var(--text);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-text .title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-text .meta {
    color: var(--muted);
    font-size: 10px;
  }
  .finale {
    cursor: pointer;
  }
  .finale-text {
    color: var(--text);
    font-size: 12px;
  }
  .finale-text .title {
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 0.4rem;
  }
</style>
