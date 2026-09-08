<script lang="ts">
  import { ui, world, select, togglePlayed, isPlayed, layerOf, setChapter, chapterShort } from '../lib/state.svelte'
  import { layoutTimeline, AXIS_H, OVERVIEW, CHAPTER, type Card } from '../lib/timeline'

  let hover = $state<string | null>(null)
  let scroller: HTMLDivElement

  const chapters = $derived(world.canon.campaign.chapters)
  const chapterIdx = $derived(Math.max(0, chapters.findIndex((c) => c.id === ui.chapter)))
  const mode = $derived(ui.cursorMode === 'played' ? 'all' : ui.timelineMode)
  const beats = $derived(ui.onlyUnplayed ? world.canon.beats.filter((b) => !isPlayed(b.id) || b.id === world.canon.campaign.convergence) : world.canon.beats)
  const layout = $derived(mode === 'chapter' ? layoutTimeline(beats, world.canon.arcs, world.canon.campaign, CHAPTER, [ui.chapter]) : layoutTimeline(beats, world.canon.arcs, world.canon.campaign, OVERVIEW))
  const CARD_W = $derived(layout.opts.cardW)
  const CARD_H = $derived(layout.opts.cardH)
  const selectedId = $derived(ui.selection?.kind === 'beat' ? ui.selection.id : null)
  const focus = $derived(hover ?? selectedId)
  const playedInView = $derived(layout.cards.filter((c) => isPlayed(c.beat.id)).length)

  /** x do "agora": fim da coluna do capítulo ou último beat jogado. */
  const nowX = $derived.by(() => {
    if (ui.cursorMode === 'played') {
      let best: Card | null = null
      for (const c of layout.cards) if (isPlayed(c.beat.id) && (!best || c.x > best.x)) best = c
      return best ? best.x + CARD_W + 4 : 0
    }
    if (mode === 'chapter') return 0
    const col = layout.columns.find((c) => c.id === ui.chapter)
    return col ? col.x + col.width : 0
  })

  const focusRequires = $derived(new Set(focus ? (world.canon.beats.find((b) => b.id === focus)?.requires ?? []) : []))

  const pcName = (id?: string) => {
    const n = world.canon.characters.find((c) => c.id === id)?.name ?? 'PC'
    return n.match(/"([^"]+)"/)?.[1] ?? n.split(' ')[0]
  }
  function onCardClick(c: Card, e: MouseEvent) {
    e.stopPropagation()
    select('beat', c.beat.id)
  }
  function prevChapter() {
    if (chapterIdx > 0) setChapter(chapters[chapterIdx - 1].id)
  }
  function nextChapter() {
    if (chapterIdx < chapters.length - 1) setChapter(chapters[chapterIdx + 1].id)
  }
  function openChapter(id: string) {
    setChapter(id)
    ui.timelineMode = 'chapter'
  }
  // Ao mudar de capítulo em vista geral, centrar a coluna.
  $effect(() => {
    const col = layout.columns.find((c) => c.id === ui.chapter)
    if (mode === 'all' && col && scroller) scroller.scrollTo({ left: Math.max(0, col.x - 40), behavior: 'smooth' })
    if (mode === 'chapter' && scroller) scroller.scrollTo({ left: 0, top: 0 })
  })
</script>

<div class="wrap">
  <div class="toolbar">
    <div class="seg" title="Ver só o capítulo escolhido ou a campanha inteira">
      <button class:active={mode === 'chapter'} onclick={() => ((ui.timelineMode = 'chapter'), ui.cursorMode === 'played' && (ui.cursorMode = 'chapter'))}>Capítulo</button>
      <button class:active={mode === 'all'} onclick={() => (ui.timelineMode = 'all')}>Todos os capítulos</button>
    </div>
    {#if mode === 'chapter'}
      <div class="row nowrap chapnav">
        <button class="icon" onclick={prevChapter} disabled={chapterIdx === 0} title="Capítulo anterior">‹</button>
        <b class="chapname">{chapters[chapterIdx]?.name}</b>
        <button class="icon" onclick={nextChapter} disabled={chapterIdx >= chapters.length - 1} title="Capítulo seguinte">›</button>
      </div>
    {/if}
    <span class="spacer"></span>
    <label class="toggle" class:on={ui.showDeps}><input type="checkbox" bind:checked={ui.showDeps} />⤳ dependências</label>
    <label class="toggle" class:on={ui.onlyUnplayed}><input type="checkbox" bind:checked={ui.onlyUnplayed} />só por jogar</label>
    <label class="toggle" class:on={ui.onlyChanges}><input type="checkbox" bind:checked={ui.onlyChanges} />▲ só alterações ao livro</label>
    <span class="muted small count">{layout.cards.length} beats · {playedInView} jogados</span>
  </div>
  <div class="scroll" bind:this={scroller}>
    <div class="lanes-col" style:height="{layout.height}px" style:padding-top="{AXIS_H}px">
      {#each layout.lanes as lane (lane.arc.id)}
        <button class="lane-label" style:height="{lane.height}px" style:border-left-color={lane.arc.color} onclick={() => select('arc', lane.arc.id)} title="{lane.arc.name} — {lane.arc.summary}">
          <span class="name">{lane.arc.name}</span>
          <span class="muted tiny cnt" class:warn={lane.arc.kind === 'pcAmbition' && lane.count === 0 && lane.ghosts === 0} title="{lane.count} beats desta pista{lane.ghosts ? ` · ${lane.ghosts} de outras pistas que também entram aqui` : ''}">{lane.count}{#if lane.ghosts}<span class="gh"> +{lane.ghosts}•</span>{/if}</span>
        </button>
      {/each}
    </div>
    <svg width={layout.width} height={layout.height} role="img" aria-label="Linha temporal">
      <!-- colunas / capítulos -->
      {#each layout.columns as col, i (col.id)}
        <rect x={col.x} y={0} width={col.width} height={layout.height} fill={i % 2 ? '#1a1611' : '#15120f'} />
        <line x1={col.x} y1={0} x2={col.x} y2={layout.height} stroke="#3b3128" />
        {#if mode === 'all'}
          <g class="colhead" role="button" tabindex="0" onclick={() => openChapter(col.id)} onkeydown={(e) => e.key === 'Enter' && openChapter(col.id)}>
            <rect x={col.x} y={0} width={col.width} height={AXIS_H - 6} fill={col.id === ui.chapter ? '#2a231c' : 'transparent'} />
            <text x={col.x + 10} y={21} fill={col.id === ui.chapter ? '#d9a441' : '#a3968a'} font-size="12" font-weight={col.id === ui.chapter ? 700 : 400}>{chapterShort(col.id)} · {col.name}</text>
          </g>
        {:else}
          <text x={col.x + 10} y={21} fill="#7d7268" font-size="11">← ordem dos beats no capítulo →</text>
        {/if}
      {/each}
      <!-- fundo das pistas -->
      {#each layout.lanes as lane (lane.arc.id)}
        <line x1={0} y1={lane.y} x2={layout.width} y2={lane.y} stroke="#2a231c" />
        <rect x={0} y={lane.y} width={4} height={lane.height} fill={lane.arc.color} opacity="0.6" />
        {#if lane.arc.kind === 'pcAmbition' && lane.count === 0 && lane.ghosts === 0}
          <text x={14} y={lane.y + lane.height / 2 + 4} fill="#e0b04a" font-size="11" opacity="0.8">⚠ sem cena pessoal de {pcName(lane.arc.ownerPc)} neste capítulo — a semear</text>
        {/if}
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
        <line x1={l.x} y1={l.y1} x2={l.x} y2={l.y2} stroke={l.color} stroke-width={focus === l.beat.id ? 3 : 1.5} opacity={focus && focus !== l.beat.id ? 0.2 : 0.7} />
      {/each}
      {#each layout.ghosts as g (g.beat.id + g.arc.id)}
        <circle cx={g.x + 9} cy={g.y} r={focus === g.beat.id ? 7 : 5} fill={g.arc.color} stroke="#15120f" stroke-width="1.5" opacity={focus && focus !== g.beat.id ? 0.35 : 1}>
          <title>{g.beat.title} · também em {g.arc.name}</title>
        </circle>
      {/each}
      <!-- cartões -->
      {#each layout.cards as c (c.beat.id)}
        {@const played = isPlayed(c.beat.id)}
        {@const layer = layerOf('beat', c.beat.id)}
        {@const dim = (focus && focus !== c.beat.id && !focusRequires.has(c.beat.id)) || (ui.onlyChanges && layer === 'book')}
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
          opacity={dim ? 0.4 : 1}
        >
          <rect width={CARD_W} height={CARD_H} rx="7" fill={played ? '#243024' : '#2a231c'} stroke={selectedId === c.beat.id ? '#d9a441' : focusRequires.has(c.beat.id) ? '#e0b04a' : played ? '#4c6b4e' : '#3b3128'} stroke-width={selectedId === c.beat.id ? 2 : 1} />
          <rect width={5} height={CARD_H} rx="2" fill={c.arc.color} />
          {#if layer !== 'book'}<path d="M{CARD_W - 16},0 L{CARD_W},0 L{CARD_W},16 z" fill={layer === 'campaign' ? '#6fbf73' : '#e0b04a'}><title>{layer === 'campaign' ? 'acrescentado na nossa campanha' : 'alterado face ao livro'}</title></path>{/if}
          <foreignObject x="9" y="4" width={CARD_W - 14} height={CARD_H - 8}>
            <div class="card-text" class:big={mode === 'chapter'} title={c.beat.summary}>
              <div class="title">{c.beat.title}</div>
              <div class="meta">
                {#if played}<span class="ok">✓ jogado</span>{/if}
                {#if c.beat.timer}<span title="relógio">⏱ {c.beat.timer}</span>{/if}
                {#if c.beat.choices.length}<span title="{c.beat.choices.length} escolha(s)">⑂ {c.beat.choices.length}</span>{/if}
                {#if c.beat.arcs.length > 1}<span title="em {c.beat.arcs.length} pistas">✦ {c.beat.arcs.length}</span>{/if}
                {#if c.beat.portent}<span title="portento" class="warn">☠</span>{/if}
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
          <foreignObject x={f.x + 10} y={f.y + 10} width={f.width - 20} height={f.height - 20}>
            <div class="finale-text">
              <div class="muted tiny">centro da teia</div>
              <div class="title">{f.beat.title}</div>
              <div class="muted">{f.beat.summary}</div>
            </div>
          </foreignObject>
        </g>
      {/if}
    </svg>
  </div>
  {#if !layout.cards.length}
    <div class="empty-overlay"><div class="empty">Sem beats {ui.onlyUnplayed ? 'por jogar' : ''} neste capítulo.</div></div>
  {/if}
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  .chapnav {
    gap: 0.3rem;
  }
  .chapname {
    white-space: nowrap;
  }
  .count {
    white-space: nowrap;
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
    width: 190px;
    flex: none;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
  .lane-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    text-align: left;
    border: 0;
    border-left: 4px solid;
    border-radius: 0;
    background: transparent;
    padding: 0 0.6rem;
    font-size: 0.85em;
    overflow: hidden;
  }
  .lane-label:hover {
    background: var(--bg-3);
  }
  .cnt {
    white-space: nowrap;
  }
  .gh {
    opacity: 0.7;
  }
  .lane-label .name {
    flex: 1;
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
  g.beat,
  .colhead {
    cursor: pointer;
  }
  .card-text {
    font-size: 11px;
    line-height: 1.25;
    color: var(--text);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-text.big {
    font-size: 12.5px;
  }
  .card-text .title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-text.big .title {
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
  .card-text .meta {
    color: var(--muted);
    font-size: 10px;
    display: flex;
    gap: 0.5em;
    white-space: nowrap;
    overflow: hidden;
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
  .empty-overlay {
    position: absolute;
    inset: 60px 0 0 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 3rem;
    pointer-events: none;
  }
</style>
