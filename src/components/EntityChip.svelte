<script lang="ts">
  import { nameOf, select, isPlayed, world, layerOf, type SelKind } from '../lib/state.svelte'
  import { KIND_COLORS, FACTION_NODE_COLOR } from '../lib/colors'

  let { kind, id, label }: { kind: SelKind; id: string; label?: string } = $props()

  const color = $derived.by(() => {
    if (kind === 'character') return KIND_COLORS[world.canon.characters.find((c) => c.id === id)?.kind ?? 'npc']
    if (kind === 'faction') return FACTION_NODE_COLOR
    if (kind === 'arc') return world.canon.arcs.find((a) => a.id === id)?.color ?? '#888'
    if (kind === 'beat') return world.canon.arcs.find((a) => a.id === world.canon.beats.find((b) => b.id === id)?.arcs[0])?.color ?? '#888'
    return '#888'
  })
  const played = $derived(kind === 'beat' && isPlayed(id))
  const text = $derived(label ?? nameOf(id))
  const layer = $derived(layerOf(kind, id))
</script>

<button class="chip" class:played onclick={(e) => { e.stopPropagation(); select(kind, id) }} title={text}>
  <span class="dot" style:background={color}></span><span class="t">{text}</span>{#if layer === 'campaign'}<span class="badge new" title="acrescentado na nossa campanha">✚</span>{:else if layer === 'modified'}<span class="badge mod" title="alterado face ao livro">▲</span>{/if}
</button>

<style>
  .badge {
    font-size: 0.8em;
    line-height: 1;
  }
  .badge.new {
    color: var(--ok);
  }
  .badge.mod {
    color: #e0b04a;
  }
  .t {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
