<script lang="ts">
  // A pesquisa global (Ctrl+K ou /): qualquer coisa com id, sessões incluídas; Enter abre a Ficha.
  import { onMount } from 'svelte'
  import { ui, world, abrirFicha } from '../lib/state.svelte'
  import { pesquisar, ROTULO_PASTA, ORDEM_PASTAS, type Resultado } from '../lib/pesquisa'
  import { pastaDe } from '../lib/ficha'
  import { KIND_COLORS, FACTION_NODE_COLOR } from '../lib/colors'
  import type { TipoPersonagem } from '../lib/grafo'
  import type { Pasta } from '../lib/ficha'

  let q = $state('')
  let active = $state(0)
  let input: HTMLInputElement

  const hits = $derived(pesquisar(world.indice, q, (c) => world.campanha.curto(c)))
  const groups = $derived.by(() => {
    const m = new Map<Pasta, Resultado[]>()
    for (const h of hits) m.set(h.pasta, [...(m.get(h.pasta) ?? []), h])
    // os grupos pela melhor pontuação, para o primeiro resultado ser o melhor; empate pela ordem das pastas
    return ORDEM_PASTAS.filter((k) => m.has(k))
      .map((k) => ({ pasta: k, label: ROTULO_PASTA[k], items: m.get(k)!, melhor: Math.max(...m.get(k)!.map((h) => h.pontos)) }))
      .sort((a, b) => b.melhor - a.melhor || ORDEM_PASTAS.indexOf(a.pasta) - ORDEM_PASTAS.indexOf(b.pasta))
  })
  const flat = $derived(groups.flatMap((g) => g.items))

  function colorOf(h: Resultado): string {
    const d = world.indice.doc(h.id)
    if (!d) return '#888'
    const p = pastaDe(d)
    if (p === 'personagens') return KIND_COLORS[(d.meta.tipo as TipoPersonagem) ?? 'npc'] ?? '#888'
    if (p === 'facoes') return FACTION_NODE_COLOR
    if (p === 'beats') return world.campanha.corBeat(d)
    if (p === 'fios') return typeof d.meta.cor === 'string' ? d.meta.cor : '#c7b7e0'
    if (p === 'locais') return '#7aa2a8'
    if (p === 'itens') return '#d9a441'
    if (p === 'segredos') return '#7B4DC2'
    return '#888'
  }
  function open(h: Resultado) {
    abrirFicha(h.id)
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
      <input bind:this={input} type="text" placeholder="Personagem, fação, local, item, segredo, beat, fio, sessão…" bind:value={q} />
      <kbd>Esc</kbd>
    </div>
    <div class="results">
      {#if q.trim().length < 2}
        <p class="muted hint">Escreve pelo menos 2 letras. <kbd>↑</kbd><kbd>↓</kbd> navega, <kbd>Enter</kbd> abre a ficha.</p>
      {:else if !flat.length}
        <p class="muted hint">Nada encontrado para “{q}”.</p>
      {/if}
      {#each groups as g (g.pasta)}
        <div class="group-title">{g.label} <span class="muted">({g.items.length})</span></div>
        {#each g.items as h (h.id)}
          {@const i = flat.indexOf(h)}
          <button class="hit" class:active={i === active} onclick={() => open(h)} onpointerenter={() => (active = i)}>
            <span class="dot" style:background={colorOf(h)}></span>
            <span class="t">{h.titulo}</span>
            <span class="muted s">{h.sub}</span>
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
