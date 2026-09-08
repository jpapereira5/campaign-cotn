<script lang="ts">
  // Matriz PCs × capítulos: quantos beats tocam cada PC em cada capítulo. Zero = buraco a semear.
  import { ui, world, setChapter, setView, select, chapterShort, chapterName } from '../lib/state.svelte'

  let { compact = false, onlyChapter = null as string | null }: { compact?: boolean; onlyChapter?: string | null } = $props()

  const c = $derived(world.canon)
  const pcs = $derived(c.characters.filter((x) => x.kind === 'pc'))
  const chapters = $derived(onlyChapter ? c.campaign.chapters.filter((ch) => ch.id === onlyChapter) : c.campaign.chapters)
  const rows = $derived.by(() =>
    pcs.map((pc) => {
      const ownArcs = new Set(c.arcs.filter((a) => a.ownerPc === pc.id).map((a) => a.id))
      const ambBeats = new Set(c.ambitions.filter((a) => a.pc === pc.id).flatMap((a) => [...a.satisfiedBy, ...a.threatenedBy]))
      const cells = chapters.map((ch) => {
        const beats = world.beatsSorted.filter((b) => b.chapter === ch.id && (b.participants.includes(pc.id) || b.arcs.some((a) => ownArcs.has(a)) || ambBeats.has(b.id)))
        return { chapter: ch, n: beats.length, titles: beats.map((b) => b.title).slice(0, 6) }
      })
      return { pc, cells, total: cells.reduce((s, x) => s + x.n, 0), holes: cells.filter((x) => x.n === 0).length }
    }),
  )
  function open(chId: string) {
    setChapter(chId)
    ui.timelineMode = 'chapter'
    setView('tempo')
  }
</script>

{#if pcs.length}
  <div class="cov" class:compact>
    <table>
      <thead>
        <tr>
          <th class="pcname">{compact ? 'PCs em ' + chapterName(chapters[0]?.id ?? '') : 'PC'}</th>
          {#if !compact}{#each chapters as ch (ch.id)}<th title={ch.name}>{chapterShort(ch.id)}</th>{/each}<th class="tot">total</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.pc.id)}
          <tr>
            <td class="pcname"><button class="linkish" onclick={() => select('character', r.pc.id)}>{r.pc.name}</button></td>
            {#each r.cells as cell (cell.chapter.id)}
              <td>
                <button class="cell" class:hole={cell.n === 0} class:cur={cell.chapter.id === ui.chapter} onclick={() => open(cell.chapter.id)} title="{cell.chapter.name}: {cell.n ? cell.titles.join(' · ') : 'sem cena pessoal — a semear'}">
                  {cell.n || '—'}
                </button>
              </td>
            {/each}
            {#if !compact}<td class="tot muted">{r.total}{#if r.holes} <span class="warn tiny">· {r.holes} buracos</span>{/if}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .cov {
    overflow-x: auto;
  }
  table {
    border-collapse: separate;
    border-spacing: 3px;
  }
  th {
    color: var(--muted);
    font-weight: 500;
    font-size: 0.8em;
    text-align: center;
    padding: 0 0.2rem;
  }
  th.pcname,
  td.pcname {
    text-align: left;
    white-space: nowrap;
    padding-right: 0.6rem;
  }
  .cell {
    min-width: 2.4em;
    padding: 0.2rem 0.4rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    background: var(--ok-soft);
    border-color: rgba(111, 191, 115, 0.35);
    color: var(--text);
  }
  .cell.hole {
    background: rgba(224, 176, 74, 0.12);
    border-color: rgba(224, 176, 74, 0.45);
    color: var(--warn);
  }
  .cell.cur {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .tot {
    white-space: nowrap;
    font-size: 0.85em;
  }
  .compact table {
    border-spacing: 2px;
  }
</style>
