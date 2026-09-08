<script lang="ts">
  import { ui, world, addPc, addAmbition, editEntity, removeEntity, select, chapterShort } from '../lib/state.svelte'
  import EntityChip from './EntityChip.svelte'
  import PcCoverage from './PcCoverage.svelte'

  const c = $derived(world.canon)
  const pcs = $derived(c.characters.filter((x) => x.kind === 'pc'))
  const pc = $derived(pcs.find((p) => p.id === ui.pcId) ?? pcs[0])
  const ambitions = $derived(pc ? c.ambitions.filter((a) => a.pc === pc.id) : [])
  const linkedNpcs = $derived.by(() => {
    if (!pc) return []
    const ids = new Set<string>()
    for (const a of ambitions) a.npcs.forEach((n) => ids.add(n))
    for (const r of c.relations) {
      if (r.from === pc.id) ids.add(r.to)
      if (r.to === pc.id) ids.add(r.from)
    }
    return [...ids]
  })
  const byChapter = $derived.by(() => {
    if (!pc) return []
    const ownArcs = new Set(c.arcs.filter((a) => a.ownerPc === pc.id).map((a) => a.id))
    const ambBeats = new Set(ambitions.flatMap((a) => [...a.satisfiedBy, ...a.threatenedBy]))
    return c.campaign.chapters.map((ch) => ({
      chapter: ch,
      beats: world.beatsSorted.filter((b) => b.chapter === ch.id && (b.participants.includes(pc.id) || b.arcs.some((a) => ownArcs.has(a)) || ambBeats.has(b.id))),
    }))
  })

  let newPc = $state('')
  let newAmb = $state('')
  const npcOptions = $derived(c.characters.filter((x) => x.kind !== 'pc').sort((a, b) => a.name.localeCompare(b.name)))
  const beatOptions = $derived(world.beatsSorted)
  const arcOptions = $derived(c.arcs.filter((a) => a.kind !== 'pcAmbition'))
  const ro = $derived(world.readOnly)

  function addTo(ambId: string, field: 'npcs' | 'arcs' | 'satisfiedBy' | 'threatenedBy', value: string) {
    if (!value) return
    const a = c.ambitions.find((x) => x.id === ambId)
    if (!a || a[field].includes(value)) return
    editEntity('ambitions', ambId, { [field]: [...a[field], value] })
  }
  function removeFrom(ambId: string, field: 'npcs' | 'arcs' | 'satisfiedBy' | 'threatenedBy', value: string) {
    const a = c.ambitions.find((x) => x.id === ambId)
    if (!a) return
    editEntity('ambitions', ambId, { [field]: a[field].filter((x) => x !== value) })
  }
  function createPc() {
    if (!newPc.trim()) return
    ui.pcId = addPc(newPc.trim())
    newPc = ''
  }
  function createAmb() {
    if (!pc || !newAmb.trim()) return
    addAmbition(pc.id, newAmb.trim())
    newAmb = ''
  }
</script>

<div class="toolbar">
  {#if pcs.length}
    <div class="seg">
      {#each pcs as p (p.id)}<button class:active={pc?.id === p.id} onclick={() => (ui.pcId = p.id)}>{p.name}</button>{/each}
    </div>
  {/if}
  {#if !ro}
    <input type="text" placeholder="nome do novo PC" bind:value={newPc} onkeydown={(e) => e.key === 'Enter' && createPc()} />
    <button onclick={createPc}>+ PC</button>
  {/if}
</div>

<div class="page">
  {#if pcs.length}
    <h3 class="section-title" style:margin-top="0">Cobertura temporal <span class="muted">· beats que tocam cada PC, por capítulo; clica numa célula para abrir o capítulo</span></h3>
    <PcCoverage />
  {/if}
  {#if pc}
    <div class="row pchead">
      <h2><EntityChip kind="character" id={pc.id} /></h2>
      <button class="small" onclick={() => select('character', pc.id)}>Abrir ficha</button>
    </div>

    <h3 class="section-title">Ambições ({ambitions.length})</h3>
    <div class="grid">
      {#each ambitions as a (a.id)}
        <div class="card amb">
          <div class="row nowrap"><b class="txt">{a.text}</b><span class="spacer"></span>{#if !ro}<button class="icon ghost danger" title="remover" onclick={() => confirm('Remover ambição?') && removeEntity('ambitions', a.id)}>✕</button>{/if}</div>
          {#if !a.npcs.length || !a.satisfiedBy.length}
            <div class="row" style:margin="0.3rem 0">
              {#if !a.npcs.length}<span class="tag warnb">sem NPC ligado</span>{/if}
              {#if !a.satisfiedBy.length}<span class="tag warnb">sem beat que a satisfaça</span>{/if}
            </div>
          {/if}
          {#each [
            { f: 'npcs', label: 'NPCs que a satisfazem ou negam', kind: 'character', opts: npcOptions.map((n) => ({ id: n.id, name: n.name })) },
            { f: 'arcs', label: 'Pistas', kind: 'arc', opts: arcOptions.map((x) => ({ id: x.id, name: x.name })) },
            { f: 'satisfiedBy', label: 'Satisfeita por (beats)', kind: 'beat', opts: beatOptions.map((b) => ({ id: b.id, name: `${chapterShort(b.chapter)} · ${b.title}` })) },
            { f: 'threatenedBy', label: 'Ameaçada por (beats)', kind: 'beat', opts: beatOptions.map((b) => ({ id: b.id, name: `${chapterShort(b.chapter)} · ${b.title}` })) },
          ] as const as fld (fld.f)}
            <div class="field">
              <span>{fld.label}</span>
              <div class="row">
                {#each a[fld.f] as v, i_ (i_)}<span class="pair"><EntityChip kind={fld.kind} id={v} />{#if !ro}<button class="icon linkish" onclick={() => removeFrom(a.id, fld.f, v)}>✕</button>{/if}</span>{/each}
                {#if !ro}
                  <select class="add" onchange={(e) => { addTo(a.id, fld.f, (e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = '' }}>
                    <option value="">+ adicionar…</option>
                    {#each fld.opts as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
                  </select>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/each}
      {#if !ro}
        <div class="card new">
          <label class="field"><span>Nova ambição de {pc.name}</span><input type="text" bind:value={newAmb} placeholder="ex.: provar-se melhor que Ayo Jabe" onkeydown={(e) => e.key === 'Enter' && createAmb()} /></label>
          <button class="primary" onclick={createAmb}>+ Ambição</button>
        </div>
      {/if}
    </div>

    {#if linkedNpcs.length}<h3 class="section-title">NPCs ligados</h3><div class="row">{#each linkedNpcs as n, i_ (i_)}<EntityChip kind="character" id={n} />{/each}</div>{/if}

    <h3 class="section-title">Onde {pc.name} é tocado, capítulo a capítulo</h3>
    <table class="list">
      <thead><tr><th>Capítulo</th><th>Beats</th></tr></thead>
      <tbody>
        {#each byChapter as row (row.chapter.id)}
          <tr>
            <td class="chap">{row.chapter.name}<br /><span class="muted tiny">níveis {row.chapter.levels}</span></td>
            <td>
              {#each row.beats as b (b.id)}<EntityChip kind="beat" id={b.id} /> {:else}<span class="tag warnb">sem cena pessoal neste capítulo</span>{/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="empty">
      <p>Ainda não há PCs. Cria um em cima; a app cria também a pista de ambições na linha temporal.</p>
    </div>
    <h3 class="section-title">Ganchos prontos em Call of the Netherdeep</h3>
    <ul class="hooks">
      <li>Rivalidade pessoal com um rival específico (Ayo, Galsariad, Maggie…).</li>
      <li>Dívida, parentesco ou fama em Jigow; ligação à Kryn Dynasty ou à Aurora Watch (Bazzoxan).</li>
      <li>Ambição académica (Allegiance of Allsight), oculta (Consortium) ou de justiça (Cobalt Soul).</li>
      <li>Tentação do ruidium: poder a troco de corrupção.</li>
      <li>Ligação a Sehanine, Avandra ou Corellon via os três santuários.</li>
      <li>Um "Perigee" pessoal: alguém do passado do PC preso ou corrompido.</li>
    </ul>
  {/if}
</div>

<style>
  .pchead h2 {
    margin: 0;
  }
  .amb .txt {
    line-height: 1.35;
  }
  .amb .field {
    margin-top: 0.5rem;
  }
  .pair {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
  }
  .add {
    font-size: 0.85em;
    padding: 0.2rem 0.4rem;
    max-width: 200px;
  }
  .card.new {
    border-style: dashed;
  }
  .chap {
    white-space: nowrap;
  }
  .hooks {
    color: var(--muted);
  }
  button.small {
    font-size: 0.86em;
    padding: 0.25rem 0.6rem;
  }
</style>
