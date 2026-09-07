<script lang="ts">
  import { ui, world, addPc, addAmbition, editEntity, removeEntity, select } from '../lib/state.svelte'
  import EntityChip from './EntityChip.svelte'

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
</script>

<div class="page">
  <h2>PCs e ambições</h2>
  <p class="muted">Cada ambição deve tocar ≥1 NPC com poder de a satisfazer ou negar, ≥1 arco e, idealmente, ≥1 beat por capítulo. A tabela em baixo mostra onde no tempo cada PC é tocado e avisa dos capítulos vazios.</p>

  <div class="row">
    {#each pcs as p (p.id)}<button class:active={pc?.id === p.id} onclick={() => (ui.pcId = p.id)}>{p.name}</button>{/each}
    <input type="text" placeholder="nome do novo PC" bind:value={newPc} onkeydown={(e) => e.key === 'Enter' && newPc.trim() && ((ui.pcId = addPc(newPc.trim())), (newPc = ''))} />
    <button onclick={() => { if (newPc.trim()) { ui.pcId = addPc(newPc.trim()); newPc = '' } }}>+ PC</button>
  </div>

  {#if pc}
    <h3><EntityChip kind="character" id={pc.id} /> <button class="icon" onclick={() => select('character', pc.id)}>✎ ficha</button></h3>
    <div class="grid">
      {#each ambitions as a (a.id)}
        <div class="card">
          <div class="row"><b>{a.text}</b><span class="spacer"></span><button class="icon danger" title="remover" onclick={() => removeEntity('ambitions', a.id)}>✕</button></div>
          <label class="field"><span>NPCs que a satisfazem/negam</span>
            <div class="row">{#each a.npcs as n, i_ (i_)}<span><EntityChip kind="character" id={n} /><button class="icon" onclick={() => removeFrom(a.id, 'npcs', n)}>✕</button></span>{/each}</div>
            <select onchange={(e) => { addTo(a.id, 'npcs', (e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = '' }}><option value="">+ NPC…</option>{#each npcOptions as n (n.id)}<option value={n.id}>{n.name}</option>{/each}</select>
          </label>
          <label class="field"><span>Arcos</span>
            <div class="row">{#each a.arcs as x, i_ (i_)}<span><EntityChip kind="arc" id={x} /><button class="icon" onclick={() => removeFrom(a.id, 'arcs', x)}>✕</button></span>{/each}</div>
            <select onchange={(e) => { addTo(a.id, 'arcs', (e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = '' }}><option value="">+ arco…</option>{#each arcOptions as x (x.id)}<option value={x.id}>{x.name}</option>{/each}</select>
          </label>
          <label class="field"><span>Satisfeita por (beats)</span>
            <div class="row">{#each a.satisfiedBy as b, i_ (i_)}<span><EntityChip kind="beat" id={b} /><button class="icon" onclick={() => removeFrom(a.id, 'satisfiedBy', b)}>✕</button></span>{/each}</div>
            <select onchange={(e) => { addTo(a.id, 'satisfiedBy', (e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = '' }}><option value="">+ beat…</option>{#each beatOptions as b (b.id)}<option value={b.id}>{b.chapter} · {b.title}</option>{/each}</select>
          </label>
          <label class="field"><span>Ameaçada por (beats)</span>
            <div class="row">{#each a.threatenedBy as b, i_ (i_)}<span><EntityChip kind="beat" id={b} /><button class="icon" onclick={() => removeFrom(a.id, 'threatenedBy', b)}>✕</button></span>{/each}</div>
            <select onchange={(e) => { addTo(a.id, 'threatenedBy', (e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = '' }}><option value="">+ beat…</option>{#each beatOptions as b (b.id)}<option value={b.id}>{b.chapter} · {b.title}</option>{/each}</select>
          </label>
          {#if !a.npcs.length}<p class="warn">Sem NPC ligado.</p>{/if}
          {#if !a.satisfiedBy.length}<p class="warn">Sem beat que a satisfaça.</p>{/if}
        </div>
      {/each}
      <div class="card">
        <label class="field"><span>Nova ambição de {pc.name}</span><input type="text" bind:value={newAmb} placeholder="ex.: provar-se melhor que Ayo Jabe" onkeydown={(e) => e.key === 'Enter' && newAmb.trim() && (addAmbition(pc.id, newAmb.trim()), (newAmb = ''))} /></label>
        <button class="primary" onclick={() => { if (newAmb.trim()) { addAmbition(pc.id, newAmb.trim()); newAmb = '' } }}>+ ambição</button>
      </div>
    </div>

    {#if linkedNpcs.length}<h3>NPCs ligados</h3><div class="row">{#each linkedNpcs as n, i_ (i_)}<EntityChip kind="character" id={n} />{/each}</div>{/if}

    <h3>Onde {pc.name} é tocado, capítulo a capítulo</h3>
    <table class="list">
      <thead><tr><th>Capítulo</th><th>Beats</th></tr></thead>
      <tbody>
        {#each byChapter as row (row.chapter.id)}
          <tr>
            <td>{row.chapter.name}<br /><span class="muted">níveis {row.chapter.levels}</span></td>
            <td>
              {#each row.beats as b (b.id)}<EntityChip kind="beat" id={b.id} /> {:else}<span class="warn">⚠ sem cena pessoal para {pc.name} neste capítulo</span>{/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="warn">Ainda não há PCs. Adiciona um acima; a app cria também a pista de ambições na linha temporal.</p>
    <h3>Ganchos prontos em Call of the Netherdeep</h3>
    <ul>
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
  button.active {
    border-color: var(--accent);
    color: var(--accent);
  }
  .spacer {
    flex: 1;
  }
  .card .field select {
    margin-top: 0.25rem;
  }
</style>
