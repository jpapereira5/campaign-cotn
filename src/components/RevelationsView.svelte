<script lang="ts">
  import { world, toggleRevealed, isPlayed, select } from '../lib/state.svelte'
  import EntityChip from './EntityChip.svelte'

  const c = $derived(world.canon)
  let listFilter = $state<string | null>(null)
  let onlyPending = $state(false)
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
  const visible = $derived(lists.filter(([name]) => !listFilter || name === listFilter).map(([name, items]) => [name, items.filter((r) => !onlyPending || !world.play.revealed.includes(r.id))] as const))
</script>

<div class="toolbar">
  <div class="seg">
    <button class:active={listFilter === null} onclick={() => (listFilter = null)}>Todas</button>
    {#each lists as [name, items] (name)}
      <button class:active={listFilter === name} onclick={() => (listFilter = name)} title="{items.length} revelações">{name}</button>
    {/each}
  </div>
  <label class="toggle" class:on={onlyPending}><input type="checkbox" bind:checked={onlyPending} />só por revelar</label>
  <span class="spacer"></span>
  <span class="muted small">{world.play.revealed.length}/{c.revelations.length} reveladas</span>
</div>
<div class="page">
  {#each visible as [name, items] (name)}
    {@const all = lists.find(([n]) => n === name)?.[1] ?? []}
    {@const done = all.filter((r) => world.play.revealed.includes(r.id)).length}
    <h3 class="section-title">{name} <span class="muted">· {done}/{all.length} reveladas</span></h3>
    <div class="grid revs">
      {#each items as r (r.id)}
        {@const met = r.clues.filter(isPlayed).length}
        {@const revealed = world.play.revealed.includes(r.id)}
        {@const by = revealedBy.get(r.id) ?? []}
        <div class="card rev" class:revealed>
          <label class="top">
            <input type="checkbox" checked={revealed} onchange={() => toggleRevealed(r.id)} title="A mesa já percebeu isto" />
            <button class="linkish text" onclick={() => select('revelation', r.id)}>{r.text}</button>
          </label>
          <div class="meterrow">
            <div class="meter" class:ok={met >= 3} class:danger={r.clues.length < 3}><i style:width="{r.clues.length ? (met / r.clues.length) * 100 : 0}%"></i></div>
            <span class="muted tiny">{met}/{r.clues.length} pistas jogadas</span>
            {#if r.clues.length < 3}<span class="tag warnb" title="Regra das três pistas: precisa de pelo menos 3">⚠ poucas pistas</span>{/if}
            {#if !by.length}<span class="tag errb" title="Nenhum beat tem esta revelação em 'reveals'">sem beat que a revele</span>{/if}
          </div>
          <details>
            <summary>pistas ({r.clues.length}) · revelada em ({by.length})</summary>
            <div class="sec"><span class="muted tiny">Pistas</span><div class="row">{#each r.clues as b, i_ (i_)}<EntityChip kind="beat" id={b} />{:else}<span class="muted tiny">nenhuma</span>{/each}</div></div>
            <div class="sec"><span class="muted tiny">Revelada em</span><div class="row">{#each by as b, i_ (i_)}<EntityChip kind="beat" id={b} />{:else}<span class="muted tiny">nenhum beat</span>{/each}</div></div>
          </details>
        </div>
      {/each}
    </div>
  {:else}
    <p class="empty">Sem revelações nos dados.</p>
  {/each}
</div>

<style>
  .revs {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
  .rev.revealed {
    border-color: rgba(111, 191, 115, 0.4);
    background: linear-gradient(var(--ok-soft), var(--ok-soft)), var(--bg-2);
  }
  .top {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    cursor: pointer;
  }
  .top input {
    margin-top: 0.3rem;
  }
  .text {
    font-size: 0.98em;
    line-height: 1.4;
  }
  .meterrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.6rem 0 0.3rem;
    flex-wrap: wrap;
  }
  .meterrow .meter {
    width: 110px;
  }
  .sec {
    margin: 0.4rem 0;
  }
  details summary {
    font-size: 0.85em;
  }
</style>
