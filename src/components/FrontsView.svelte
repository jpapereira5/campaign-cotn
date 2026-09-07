<script lang="ts">
  import { world, togglePortent, characterState, select } from '../lib/state.svelte'
  import EntityChip from './EntityChip.svelte'

  const c = $derived(world.canon)
  const factions = $derived([...c.factions].sort((a, b) => b.portents.length - a.portents.length || a.name.localeCompare(b.name)))
  const chapterName = (id: string) => c.campaign.chapters.find((x) => x.id === id)?.name ?? id
  const chapterIdx = (id: string) => world.chapterIndex.get(id) ?? 0
  const cursorChapter = $derived(Math.floor(world.cursor / 1000))

  function done(fid: string, ch: string) {
    return world.play.portentsDone.includes(`${fid}:${ch}`)
  }
  function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
    const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    const [x0, y0] = p(a0)
    const [x1, y1] = p(a1)
    return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`
  }
</script>

<div class="page">
  <h2>Frentes e relógios</h2>
  <p class="muted">Cada facção (e os rivais) tem portentos: o que faz se ninguém a travar. Marca os que já aconteceram; o anel mostra quanto a frente avançou. Os beats com "portento" aparecem por facção.</p>
  <div class="grid">
    {#each factions as f (f.id)}
      {@const n = f.portents.length}
      {@const k = f.portents.filter((p) => done(f.id, p.chapter)).length}
      {@const portentBeats = world.beatsSorted.filter((b) => b.portent?.faction === f.id)}
      <div class="card">
        <div class="row head">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="17" fill="none" stroke="#3b3128" stroke-width="6" />
            {#if n && k}
              <path d={arcPath(22, 22, 17, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * k) / n - 0.001)} fill="none" stroke="#c2453a" stroke-width="6" />
            {/if}
            <text x="22" y="26" text-anchor="middle" font-size="11" fill="#ece3d4">{k}/{n}</text>
          </svg>
          <div>
            <button class="linkish" onclick={() => select('faction', f.id)}><b>{f.name}</b></button>
            <div class="muted small">{f.agenda}</div>
          </div>
        </div>
        {#if f.leaders.length}
          <div class="row small">{#each f.leaders as l (l)}{@const ch = c.characters.find((x) => x.id === l)}<span><EntityChip kind="character" id={l} />{#if ch}{@const st = characterState(ch)}{#if st}<span class="muted"> · {st}</span>{/if}{/if}</span>{/each}</div>
        {/if}
        <ol class="portents">
          {#each f.portents as p, i (i)}
            {@const future = chapterIdx(p.chapter) > cursorChapter}
            <li class:future class:done={done(f.id, p.chapter)}>
              <label><input type="checkbox" checked={done(f.id, p.chapter)} onchange={() => togglePortent(f.id, p.chapter)} /> <span class="muted">{chapterName(p.chapter)}:</span> {p.text}</label>
            </li>
          {:else}
            <li class="muted">Sem portentos definidos.</li>
          {/each}
        </ol>
        {#if portentBeats.length}
          <div class="small"><span class="muted">Beats com portento:</span> {#each portentBeats as b (b.id)}<EntityChip kind="beat" id={b.id} /> {/each}</div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .head {
    align-items: flex-start;
    flex-wrap: nowrap;
  }
  .linkish {
    background: none;
    border: 0;
    padding: 0;
    text-align: left;
  }
  .small {
    font-size: 0.85em;
  }
  .portents {
    padding-left: 1.1rem;
    margin: 0.5rem 0;
  }
  .portents li {
    margin: 0.2rem 0;
  }
  .portents li.future {
    opacity: 0.6;
  }
  .portents li.done {
    text-decoration: line-through;
    opacity: 0.7;
  }
</style>
