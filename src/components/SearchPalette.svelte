<script lang="ts">
  import { onMount } from 'svelte'
  import { ui, world, select, goToBeat } from '../lib/state.svelte'
  import { searchCanon, SEARCH_KIND_LABELS, type SearchHit, type SearchKind } from '../lib/search'
  import { KIND_COLORS, FACTION_NODE_COLOR } from '../lib/colors'

  let q = $state('')
  let active = $state(0)
  let input: HTMLInputElement

  const hits = $derived(searchCanon(world.canon, q))
  const groups = $derived.by(() => {
    const order: SearchKind[] = ['character', 'faction', 'location', 'beat', 'revelation']
    const m = new Map<SearchKind, SearchHit[]>()
    for (const h of hits) m.set(h.kind, [...(m.get(h.kind) ?? []), h])
    return order.filter((k) => m.has(k)).map((k) => ({ kind: k, label: SEARCH_KIND_LABELS[k], items: m.get(k)! }))
  })
  const flat = $derived(groups.flatMap((g) => g.items))

  function colorOf(h: SearchHit): string {
    if (h.kind === 'character') return KIND_COLORS[world.canon.characters.find((c) => c.id === h.id)?.kind ?? 'npc']
    if (h.kind === 'faction') return FACTION_NODE_COLOR
    if (h.kind === 'beat') return world.canon.arcs.find((a) => a.id === world.canon.beats.find((b) => b.id === h.id)?.arcs[0])?.color ?? '#888'
    if (h.kind === 'location') return '#7aa2a8'
    return '#c7b7e0'
  }
  function open(h: SearchHit, e?: MouseEvent) {
    if (h.kind === 'beat' && (e?.altKey || ui.view === 'tempo')) goToBeat(h.id)
    else select(h.kind, h.id)
    ui.searchOpen = false
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      active = Math.min(active + 1, flat.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      active = Math.max(active - 1, 0)
    } else if (e.key === 'Enter' && flat[active]) {
      open(flat[active])
    }
  }
  $effect(() => {
    void q
    active = 0
  })
  onMount(() => input?.focus())
</script>

<div class="backdrop" role="presentation" onclick={() => (ui.searchOpen = false)}>
  <div class="palette" role="dialog" tabindex="-1" aria-label="Pesquisar" onclick={(e) => e.stopPropagation()} onkeydown={onKey}>
    <div class="inp">
      <span>🔍</span>
      <input bind:this={input} type="text" placeholder="Personagem, facção, local, beat, revelação…" bind:value={q} />
      <kbd>Esc</kbd>
    </div>
    <div class="results">
      {#if q.trim().length < 2}
        <p class="muted hint">Escreve pelo menos 2 letras. <kbd>↑</kbd><kbd>↓</kbd> navega, <kbd>Enter</kbd> abre. Num beat, <kbd>Alt</kbd>+clique abre-o na linha temporal.</p>
      {:else if !flat.length}
        <p class="muted hint">Nada encontrado para “{q}”.</p>
      {/if}
      {#each groups as g (g.kind)}
        <div class="group-title">{g.label} <span class="muted">({g.items.length})</span></div>
        {#each g.items as h (h.kind + h.id)}
          {@const i = flat.indexOf(h)}
          <button class="hit" class:active={i === active} onclick={(e) => open(h, e)} onpointerenter={() => (active = i)}>
            <span class="dot" style:background={colorOf(h)}></span>
            <span class="t">{h.title}</span>
            <span class="muted s">{h.subtitle}</span>
          </button>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 50;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 10vh;
  }
  .palette {
    width: min(680px, 92vw);
    max-height: 70vh;
    background: var(--bg-2);
    border: 1px solid var(--line-2);
    border-radius: 12px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .inp {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid var(--line);
  }
  .inp input {
    flex: 1;
    background: transparent;
    border: 0;
    font-size: 1.05rem;
    padding: 0.2rem;
  }
  .results {
    overflow: auto;
    padding: 0.4rem;
  }
  .hint {
    padding: 0.5rem 0.6rem;
    margin: 0;
  }
  .group-title {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted-2);
    padding: 0.5rem 0.6rem 0.2rem;
    font-weight: 600;
  }
  .hit {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border-color: transparent;
    padding: 0.4rem 0.6rem;
  }
  .hit.active {
    background: var(--accent-soft);
    border-color: transparent;
  }
  .dot {
    width: 0.65em;
    height: 0.65em;
    border-radius: 50%;
    flex: none;
  }
  .t {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .s {
    font-size: 0.82em;
    white-space: nowrap;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
