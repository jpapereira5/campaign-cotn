<script lang="ts">
  import { world, toggleRevealed, isPlayed, select } from '../lib/state.svelte'
  import EntityChip from './EntityChip.svelte'

  const c = $derived(world.canon)
  const lists = $derived.by(() => {
    const m = new Map<string, typeof c.revelations>()
    for (const r of c.revelations) m.set(r.list, [...(m.get(r.list) ?? []), r])
    return [...m.entries()]
  })
  const revealedBy = $derived.by(() => {
    const m = new Map<string, string[]>()
    for (const b of c.beats) for (const r of b.reveals) m.set(r, [...(m.get(r) ?? []), b.id])
    return m
  })
</script>

<div class="page">
  <h2>Revelações</h2>
  <p class="muted">Regra das três pistas: cada conclusão necessária deve ter ≥3 pistas em cenas diferentes. Os beats jogados aparecem a verde, para veres quantas pistas os jogadores já encontraram. Marca a revelação quando a mesa a tiver percebido.</p>
  {#each lists as [name, items] (name)}
    {@const done = items.filter((r) => world.play.revealed.includes(r.id)).length}
    <h3>{name} <span class="muted">· {done}/{items.length} reveladas</span></h3>
    <table class="list">
      <thead><tr><th></th><th>Conclusão</th><th>Pistas (beats)</th><th>Revelada em</th></tr></thead>
      <tbody>
        {#each items as r (r.id)}
          {@const met = r.clues.filter(isPlayed).length}
          <tr>
            <td><input type="checkbox" checked={world.play.revealed.includes(r.id)} onchange={() => toggleRevealed(r.id)} /></td>
            <td><button class="linkish" onclick={() => select('revelation', r.id)}>{r.text}</button></td>
            <td>
              <span class:warn={r.clues.length < 3} class="muted">{met}/{r.clues.length}{#if r.clues.length < 3} ⚠ poucas{/if}</span><br />
              {#each r.clues as b (b)}<EntityChip kind="beat" id={b} /> {/each}
            </td>
            <td>{#each revealedBy.get(r.id) ?? [] as b (b)}<EntityChip kind="beat" id={b} /> {:else}<span class="warn">nenhum beat</span>{/each}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="warn">Sem revelações nos dados.</p>
  {/each}
</div>

<style>
  .linkish {
    background: none;
    border: 0;
    padding: 0;
    text-align: left;
  }
</style>
