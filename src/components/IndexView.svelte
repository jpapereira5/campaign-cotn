<script lang="ts">
  import { world, characterState, layerOf, ui } from '../lib/state.svelte'
  import { KIND_LABELS } from '../lib/colors'
  import EntityChip from './EntityChip.svelte'

  const c = $derived(world.canon)
  let q = $state('')
  const match = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase())
  const only = (kind: 'character' | 'faction' | 'location' | 'beat', id: string) => !ui.onlyChanges || layerOf(kind, id) !== 'book'
  const chars = $derived(c.characters.filter((x) => (match(x.name) || match(x.summary)) && only('character', x.id)).sort((a, b) => a.name.localeCompare(b.name)))
  const factions = $derived(c.factions.filter((x) => match(x.name) && only('faction', x.id)))
  const locations = $derived(c.locations.filter((x) => match(x.name) && only('location', x.id)))
  const beats = $derived(world.beatsSorted.filter((x) => (match(x.title) || match(x.summary)) && only('beat', x.id)))
  const chapterName = (id: string) => c.campaign.chapters.find((x) => x.id === id)?.name ?? id
</script>

<div class="page">
  <h2>Índice</h2>
  <div class="row"><input type="search" placeholder="procurar…" bind:value={q} /> <label><input type="checkbox" bind:checked={ui.onlyChanges} /> só o que difere do livro (✚ novo · ▲ alterado)</label></div>
  <div class="cols">
    <div>
      <h3>Personagens ({chars.length})</h3>
      <table class="list">
        <tbody>
          {#each chars as ch (ch.id)}
            <tr><td><EntityChip kind="character" id={ch.id} /></td><td class="muted">{KIND_LABELS[ch.kind]}</td><td class="muted">{ch.chapters.join(', ')}</td><td class="muted">{characterState(ch)}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div>
      <h3>Facções ({factions.length})</h3>
      <div class="row">{#each factions as f (f.id)}<EntityChip kind="faction" id={f.id} />{/each}</div>
      <h3>Locais ({locations.length})</h3>
      <div class="row">{#each locations as l (l.id)}<EntityChip kind="location" id={l.id} />{/each}</div>
      <h3>Beats ({beats.length})</h3>
      <table class="list">
        <tbody>
          {#each beats as b (b.id)}
            <tr><td class="muted">{chapterName(b.chapter).slice(0, 22)}</td><td><EntityChip kind="beat" id={b.id} /></td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 900px) {
    .cols {
      grid-template-columns: 1fr;
    }
  }
</style>
