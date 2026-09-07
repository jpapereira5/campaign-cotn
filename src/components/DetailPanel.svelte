<script lang="ts">
  import { ui, world, characterState, attitudeOf, isPlayed, togglePlayed, toggleRevealed, setNote, setAttitude, editEntity, removeRelation, addRelation, nameOf, type Selection } from '../lib/state.svelte'
  import { relationActive } from '../lib/graph'
  import { RELATION_LABELS, KIND_LABELS } from '../lib/colors'
  import { ATTITUDES, RELATION_TYPES, type Attitude, type RelationType } from '../lib/types'
  import EntityChip from './EntityChip.svelte'

  let { selection }: { selection: Selection } = $props()

  const c = $derived(world.canon)
  const character = $derived(selection.kind === 'character' ? c.characters.find((x) => x.id === selection.id) : undefined)
  const faction = $derived(selection.kind === 'faction' ? c.factions.find((x) => x.id === selection.id) : undefined)
  const location = $derived(selection.kind === 'location' ? c.locations.find((x) => x.id === selection.id) : undefined)
  const beat = $derived(selection.kind === 'beat' ? c.beats.find((x) => x.id === selection.id) : undefined)
  const arc = $derived(selection.kind === 'arc' ? c.arcs.find((x) => x.id === selection.id) : undefined)
  const revelation = $derived(selection.kind === 'revelation' ? c.revelations.find((x) => x.id === selection.id) : undefined)
  const ambition = $derived(selection.kind === 'ambition' ? c.ambitions.find((x) => x.id === selection.id) : undefined)

  const note = $derived(world.play.notes[selection.id] ?? '')
  const relations = $derived(c.relations.filter((r) => r.from === selection.id || r.to === selection.id))
  const beatsWith = $derived(world.beatsSorted.filter((b) => b.participants.includes(selection.id) || (selection.kind === 'location' && b.location === selection.id) || (selection.kind === 'arc' && b.arcs.includes(selection.id)) || (selection.kind === 'revelation' && b.reveals.includes(selection.id))))
  const chapterName = (id: string) => c.campaign.chapters.find((x) => x.id === id)?.name ?? id

  let editing = $state(false)
  let draft = $state<Record<string, string>>({})
  function startEdit(fields: Record<string, string>) {
    draft = { ...fields }
    editing = true
  }
  function saveEdit(kind: 'characters' | 'beats' | 'factions' | 'locations' | 'revelations' | 'ambitions') {
    editEntity(kind, selection.id, draft)
    editing = false
  }

  let newRel = $state({ type: 'knows' as RelationType, to: '', label: '' })
  const others = $derived([...c.characters.map((x) => ({ id: x.id, name: x.name })), ...c.factions.map((x) => ({ id: x.id, name: x.name }))].filter((x) => x.id !== selection.id).sort((a, b) => a.name.localeCompare(b.name)))
  function submitRel() {
    if (!newRel.to) return
    addRelation({ from: selection.id, to: newRel.to, type: newRel.type, label: newRel.label, source: 'dm' })
    newRel = { type: 'knows', to: '', label: '' }
  }
</script>

<div class="panel">
  <div class="row head">
    <span class="muted">{selection.kind === 'character' ? KIND_LABELS[character?.kind ?? 'npc'] : selection.kind}</span>
    <span class="spacer"></span>
    <button class="icon" onclick={() => (ui.selection = null)} title="Fechar (Esc)">✕</button>
  </div>

  {#if character}
    {@const st = characterState(character)}
    {@const att = attitudeOf(character)}
    <h2>{character.name}</h2>
    {#if character.factions.length}<div class="row">{#each character.factions as f (f)}<EntityChip kind="faction" id={f} />{/each}</div>{/if}
    {#if character.home}<div class="muted">📍 <EntityChip kind="location" id={character.home} /></div>{/if}
    {#if st}<p class="state">Estado agora: <b>{st}</b></p>{/if}
    {#if character.kind === 'rival' || att}
      <label class="field"><span>Atitude para com os PCs</span>
        <select value={att ?? ''} onchange={(e) => setAttitude(character.id, ((e.target as HTMLSelectElement).value || null) as Attitude | null)}>
          <option value="">(livro: {character.attitude ?? '—'})</option>
          {#each ATTITUDES as a (a)}<option value={a}>{a}</option>{/each}
        </select>
      </label>
    {/if}
    {#if editing}
      <label class="field"><span>Resumo</span><textarea rows="3" bind:value={draft.summary}></textarea></label>
      <label class="field"><span>Objectivo</span><textarea rows="2" bind:value={draft.goal}></textarea></label>
      <label class="field"><span>Segredo</span><textarea rows="2" bind:value={draft.secret}></textarea></label>
      <label class="field"><span>Quer</span><input type="text" bind:value={draft.wants} /></label>
      <label class="field"><span>Teme</span><input type="text" bind:value={draft.fears} /></label>
      <div class="row"><button class="primary" onclick={() => saveEdit('characters')}>Guardar</button><button onclick={() => (editing = false)}>Cancelar</button></div>
    {:else}
      <p>{character.summary}</p>
      {#if character.goal}<p><b>Objectivo:</b> {character.goal}</p>{/if}
      {#if character.secret}<p><b>Segredo:</b> {character.secret}</p>{/if}
      {#if character.wants}<p><b>Quer:</b> {character.wants}</p>{/if}
      {#if character.fears}<p><b>Teme:</b> {character.fears}</p>{/if}
      <button onclick={() => startEdit({ summary: character.summary, goal: character.goal, secret: character.secret, wants: character.wants, fears: character.fears })}>✎ editar</button>
    {/if}
    {#if character.states.length}
      <h3>Estados ao longo do tempo</h3>
      <ul class="plain">{#each character.states as s (s.fromBeat + s.state)}<li>{s.state} <span class="muted">— a partir de</span> <EntityChip kind="beat" id={s.fromBeat} /></li>{/each}</ul>
    {/if}
    {#if character.kind === 'pc'}
      <h3>Ambições</h3>
      {#each c.ambitions.filter((a) => a.pc === character.id) as a (a.id)}<div><EntityChip kind="ambition" id={a.id} label={a.text} /></div>{:else}<p class="muted">Sem ambições. Adiciona na vista PCs.</p>{/each}
    {/if}
  {/if}

  {#if faction}
    <h2>{faction.name}</h2>
    {#if faction.motto}<p class="muted"><i>{faction.motto}</i></p>{/if}
    <p>{faction.agenda}</p>
    {#if faction.publicFace}<p><b>Cara pública:</b> {faction.publicFace}</p>{/if}
    {#if faction.leaders.length}<h3>Líderes</h3><div class="row">{#each faction.leaders as l (l)}<EntityChip kind="character" id={l} />{/each}</div>{/if}
    <h3>Membros</h3>
    <div class="row">{#each c.characters.filter((x) => x.factions.includes(faction.id)) as m (m.id)}<EntityChip kind="character" id={m.id} />{/each}</div>
    {#if faction.allies.length}<p><b>Aliados:</b> {#each faction.allies as a (a)}<EntityChip kind="faction" id={a} /> {/each}</p>{/if}
    {#if faction.enemies.length}<p><b>Inimigos:</b> {#each faction.enemies as a (a)}<EntityChip kind="faction" id={a} /> {/each}</p>{/if}
    {#if faction.portents.length}
      <h3>Portentos (se ninguém intervier)</h3>
      <ol class="plain">{#each faction.portents as p (p.chapter + p.text)}<li><span class="muted">{chapterName(p.chapter)}:</span> {p.text}</li>{/each}</ol>
    {/if}
  {/if}

  {#if location}
    <h2>{location.name}</h2>
    {#if location.parent}<div class="muted">em <EntityChip kind="location" id={location.parent} /></div>{/if}
    <p>{location.summary}</p>
    {@const children = c.locations.filter((l) => l.parent === location.id)}
    {#if children.length}<h3>Dentro</h3><div class="row">{#each children as l (l.id)}<EntityChip kind="location" id={l.id} />{/each}</div>{/if}
  {/if}

  {#if beat}
    <h2>{beat.title}</h2>
    <div class="row">
      <span class="muted">{chapterName(beat.chapter)} · ordem {beat.order}</span>
      {#if beat.timer}<span class="chip">⏱ {beat.timer}</span>{/if}
      <button class:primary={!isPlayed(beat.id)} onclick={() => togglePlayed(beat.id)}>{isPlayed(beat.id) ? '✓ jogado (desmarcar)' : 'marcar jogado'}</button>
    </div>
    <div class="row">{#each beat.arcs as a (a)}<EntityChip kind="arc" id={a} />{/each}</div>
    {#if beat.location}<div class="muted">📍 <EntityChip kind="location" id={beat.location} /></div>{/if}
    {#if editing}
      <label class="field"><span>Resumo</span><textarea rows="4" bind:value={draft.summary}></textarea></label>
      <label class="field"><span>Notas de DM</span><textarea rows="5" bind:value={draft.notes}></textarea></label>
      <div class="row"><button class="primary" onclick={() => saveEdit('beats')}>Guardar</button><button onclick={() => (editing = false)}>Cancelar</button></div>
    {:else}
      <p>{beat.summary}</p>
      {#if beat.notes}<p class="notes">{beat.notes}</p>{/if}
      <button onclick={() => startEdit({ summary: beat.summary, notes: beat.notes })}>✎ editar</button>
    {/if}
    {#if beat.participants.length}<h3>Participantes</h3><div class="row">{#each beat.participants as p (p)}<EntityChip kind={c.factions.some((f) => f.id === p) ? 'faction' : 'character'} id={p} />{/each}</div>{/if}
    {#if beat.choices.length}
      <h3>Escolhas</h3>
      <ul class="plain">{#each beat.choices as ch (ch.label)}<li><b>{ch.label}</b> — {ch.outcome} {#each ch.leadsTo as l (l)}<EntityChip kind="beat" id={l} />{/each}</li>{/each}</ul>
    {/if}
    {#if beat.portent}<p class="warn">☠ Portento (<EntityChip kind="faction" id={beat.portent.faction} />): {beat.portent.text}</p>{/if}
    {#if beat.reveals.length}<h3>Revela</h3><ul class="plain">{#each beat.reveals as r (r)}<li><EntityChip kind="revelation" id={r} /></li>{/each}</ul>{/if}
    {#if beat.requires.length}<h3>Requer</h3><div class="row">{#each beat.requires as r (r)}<EntityChip kind="beat" id={r} />{/each}</div>{/if}
    {@const next = c.beats.filter((b) => b.requires.includes(beat.id) || b.choices.some((ch) => ch.leadsTo.includes(beat.id)))}
    {#if next.length}<h3>Leva a</h3><div class="row">{#each next as b (b.id)}<EntityChip kind="beat" id={b.id} />{/each}</div>{/if}
  {/if}

  {#if arc}
    <h2 style:color={arc.color}>{arc.name}</h2>
    <p>{arc.summary}</p>
    {#if arc.ownerPc}<p>PC: <EntityChip kind="character" id={arc.ownerPc} /></p>{/if}
  {/if}

  {#if revelation}
    <h2>Revelação</h2>
    <p class="muted">{revelation.list}</p>
    <p>{revelation.text}</p>
    <button class:primary={!world.play.revealed.includes(revelation.id)} onclick={() => toggleRevealed(revelation.id)}>{world.play.revealed.includes(revelation.id) ? '✓ revelada (desmarcar)' : 'marcar como revelada'}</button>
    <h3>Pistas ({revelation.clues.length}) {#if revelation.clues.length < 3}<span class="warn">— menos de 3!</span>{/if}</h3>
    <div class="row">{#each revelation.clues as b (b)}<EntityChip kind="beat" id={b} />{/each}</div>
  {/if}

  {#if ambition}
    <h2>Ambição</h2>
    <p><EntityChip kind="character" id={ambition.pc} /></p>
    <p>{ambition.text}</p>
    {#if ambition.npcs.length}<h3>NPCs</h3><div class="row">{#each ambition.npcs as n (n)}<EntityChip kind="character" id={n} />{/each}</div>{/if}
    {#if ambition.satisfiedBy.length}<h3>Satisfeita por</h3><div class="row">{#each ambition.satisfiedBy as b (b)}<EntityChip kind="beat" id={b} />{/each}</div>{/if}
    {#if ambition.threatenedBy.length}<h3>Ameaçada por</h3><div class="row">{#each ambition.threatenedBy as b (b)}<EntityChip kind="beat" id={b} />{/each}</div>{/if}
  {/if}

  {#if selection.kind === 'character' || selection.kind === 'faction'}
    <h3>Relações</h3>
    <ul class="plain rels">
      {#each relations as r (r.from + r.to + r.type)}
        {@const active = relationActive(r, world.cursor, world.beatPos)}
        {@const other = r.from === selection.id ? r.to : r.from}
        <li class:inactive={!active}>
          <span class="muted">{r.from === selection.id ? RELATION_LABELS[r.type] : '← ' + RELATION_LABELS[r.type]}</span>
          <EntityChip kind={c.factions.some((f) => f.id === other) ? 'faction' : 'character'} id={other} />
          {#if r.label}<span class="lbl">{r.label}</span>{/if}
          {#if r.condition}<span class="muted">({r.condition})</span>{/if}
          {#if r.fromBeat || r.untilBeat}<span class="muted">⏱ {r.fromBeat ? 'desde ' + nameOf(r.fromBeat) : ''}{r.untilBeat ? ' até ' + nameOf(r.untilBeat) : ''}</span>{/if}
          {#if r.source === 'dm'}<button class="icon" title="remover" onclick={() => removeRelation(r)}>✕</button>{/if}
        </li>
      {:else}
        <li class="muted">Sem relações registadas.</li>
      {/each}
    </ul>
    <details>
      <summary>+ nova relação</summary>
      <div class="row">
        <select bind:value={newRel.type}>{#each RELATION_TYPES as t (t)}<option value={t}>{RELATION_LABELS[t]}</option>{/each}</select>
        <select bind:value={newRel.to}><option value="">…</option>{#each others as o (o.id)}<option value={o.id}>{o.name}</option>{/each}</select>
      </div>
      <div class="row"><input type="text" placeholder="rótulo" bind:value={newRel.label} /><button onclick={submitRel}>adicionar</button></div>
    </details>
  {/if}

  {#if beatsWith.length && selection.kind !== 'beat'}
    <h3>Beats</h3>
    <ul class="plain">
      {#each beatsWith as b (b.id)}<li><span class="muted">{chapterName(b.chapter).slice(0, 18)}</span> <EntityChip kind="beat" id={b.id} /></li>{/each}
    </ul>
  {/if}

  <h3>Nota do DM</h3>
  <textarea rows="3" value={note} onchange={(e) => setNote(selection.id, (e.target as HTMLTextAreaElement).value)} placeholder="Notas privadas sobre esta entidade (ficam em state.json)"></textarea>
  <p class="muted tiny">id: <code>{selection.id}</code></p>
</div>

<style>
  .panel {
    padding: 0.75rem 1rem 2rem;
    font-size: 0.93em;
  }
  .head .spacer {
    flex: 1;
  }
  h2 {
    margin: 0.2rem 0 0.5rem;
    font-size: 1.15rem;
  }
  h3 {
    margin: 0.9rem 0 0.3rem;
    font-size: 0.85rem;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  p {
    margin: 0.35rem 0;
  }
  .state {
    color: var(--accent);
  }
  .notes {
    white-space: pre-wrap;
    color: var(--muted);
    border-left: 2px solid var(--line);
    padding-left: 0.5rem;
  }
  ul.plain,
  ol.plain {
    padding-left: 1.1rem;
    margin: 0.2rem 0;
  }
  ul.plain li,
  ol.plain li {
    margin: 0.2rem 0;
  }
  .rels li {
    list-style: none;
    margin-left: -1rem;
  }
  .rels li.inactive {
    opacity: 0.45;
  }
  .lbl {
    font-style: italic;
  }
  .tiny {
    font-size: 0.8em;
  }
</style>
