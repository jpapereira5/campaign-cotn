<script lang="ts">
  import { world, togglePortent, characterState, select, chapterName, chapterShort } from '../lib/state.svelte'
  import EntityChip from './EntityChip.svelte'

  const c = $derived(world.canon)
  let onlyWithPortents = $state(true)
  let expanded = $state<Set<string>>(new Set())
  const factions = $derived([...c.factions].filter((f) => !onlyWithPortents || f.portents.length).sort((a, b) => b.portents.length - a.portents.length || a.name.localeCompare(b.name)))
  const chapterIdx = (id: string) => world.chapterIndex.get(id) ?? 0
  const cursorChapter = $derived(Math.floor(world.cursor / 1000))
  const totals = $derived.by(() => {
    let n = 0
    let k = 0
    for (const f of c.factions) for (const p of f.portents) {
      n++
      if (done(f.id, p.chapter)) k++
    }
    return { n, k }
  })

  function done(fid: string, ch: string) {
    return world.play.portentsDone.includes(`${fid}:${ch}`)
  }
  function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
    const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    const [x0, y0] = p(a0)
    const [x1, y1] = p(a1)
    return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`
  }
  function toggleExpand(id: string) {
    const s = new Set(expanded)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    expanded = s
  }
</script>

<div class="toolbar">
  <label class="toggle" class:on={onlyWithPortents}><input type="checkbox" bind:checked={onlyWithPortents} />só facções com portentos</label>
  <span class="spacer"></span>
  <span class="muted small">{totals.k}/{totals.n} portentos já aconteceram</span>
</div>
<div class="page">
  <div class="grid fronts">
    {#each factions as f (f.id)}
      {@const n = f.portents.length}
      {@const k = f.portents.filter((p) => done(f.id, p.chapter)).length}
      {@const portentBeats = world.beatsSorted.filter((b) => b.portent?.faction === f.id)}
      {@const open = expanded.has(f.id)}
      <div class="card front">
        <div class="head">
          <svg width="46" height="46" viewBox="0 0 44 44" class="clock">
            <circle cx="22" cy="22" r="17" fill="none" stroke="#3b3128" stroke-width="6" />
            {#if n && k}
              <path d={arcPath(22, 22, 17, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * k) / n - 0.001)} fill="none" stroke={k === n ? '#c2453a' : '#d9a441'} stroke-width="6" />
            {/if}
            <text x="22" y="26" text-anchor="middle" font-size="11" fill="#ece3d4">{k}/{n}</text>
          </svg>
          <div class="ttl">
            <button class="linkish name" onclick={() => select('faction', f.id)}>{f.name}</button>
            <div class="muted small agenda" class:clamp-2={!open}>{f.agenda}</div>
            {#if f.agenda.length > 160}<button class="linkish tiny more" onclick={() => toggleExpand(f.id)}>{open ? 'menos' : 'ler tudo'}</button>{/if}
          </div>
        </div>
        {#if f.leaders.length}
          <div class="leaders">
            {#each f.leaders as l, i_ (i_)}
              {@const ch = c.characters.find((x) => x.id === l)}
              <div class="leader"><EntityChip kind="character" id={l} />{#if ch}{@const st = characterState(ch)}{#if st}<span class="muted tiny"> · {st}</span>{/if}{/if}</div>
            {/each}
          </div>
        {/if}
        <ol class="portents">
          {#each f.portents as p, i (i)}
            {@const future = chapterIdx(p.chapter) > cursorChapter}
            {@const isDone = done(f.id, p.chapter)}
            <li class:future class:done={isDone}>
              <label>
                <input type="checkbox" checked={isDone} onchange={() => togglePortent(f.id, p.chapter)} />
                <span class="chp" title={chapterName(p.chapter)}>{chapterShort(p.chapter)}</span>
                <span class="txt">{p.text}</span>
              </label>
            </li>
          {:else}
            <li class="muted">Sem portentos definidos.</li>
          {/each}
        </ol>
        {#if portentBeats.length}
          <div class="small pb"><span class="muted">Beats com portento:</span> {#each portentBeats as b (b.id)}<EntityChip kind="beat" id={b.id} /> {/each}</div>
        {/if}
      </div>
    {:else}
      <div class="empty">Nenhuma facção com portentos.</div>
    {/each}
  </div>
</div>

<style>
  .fronts {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }
  .head {
    display: flex;
    gap: 0.7rem;
    align-items: flex-start;
  }
  .clock {
    flex: none;
  }
  .ttl {
    min-width: 0;
    flex: 1;
  }
  .name {
    font-weight: 700;
    font-size: 1.02rem;
  }
  .agenda {
    margin-top: 0.15rem;
  }
  .more {
    color: var(--accent);
  }
  .leaders {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.8rem;
    margin: 0.55rem 0 0.2rem;
  }
  .portents {
    list-style: none;
    padding: 0;
    margin: 0.6rem 0 0;
  }
  .portents li {
    border-top: 1px dashed var(--line);
  }
  .portents label {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 0.5rem;
    align-items: start;
    padding: 0.4rem 0;
    cursor: pointer;
  }
  .portents input {
    margin-top: 0.2rem;
  }
  .chp {
    font-size: 0.75em;
    color: var(--muted);
    background: var(--bg-3);
    border-radius: 4px;
    padding: 0.05em 0.4em;
    margin-top: 0.15em;
    font-variant-numeric: tabular-nums;
    min-width: 2.2em;
    text-align: center;
  }
  .portents li.future {
    opacity: 0.55;
  }
  .portents li.done .txt {
    text-decoration: line-through;
    color: var(--muted);
  }
  .pb {
    margin-top: 0.5rem;
    border-top: 1px dashed var(--line);
    padding-top: 0.4rem;
  }
</style>
