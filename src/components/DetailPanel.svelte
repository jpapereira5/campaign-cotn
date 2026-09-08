<script lang="ts">
  import { ui, world, characterState, attitudeOf, isPlayed, togglePlayed, toggleRevealed, setNote, setAttitude, editEntity, removeRelation, addRelation, nameOf, layerOf, bookOriginal, revertToBook, relationLayer, back, closeSelection, goToBeat, chapterName, type Selection } from '../lib/state.svelte'
  import { diffFields } from '../lib/layers'
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
  const missing = $derived(!character && !faction && !location && !beat && !arc && !revelation && !ambition)

  const KIND_TITLE: Record<Selection['kind'], string> = { character: 'Personagem', faction: 'Facção', location: 'Local', beat: 'Beat', arc: 'Pista', revelation: 'Revelação', ambition: 'Ambição' }
  const note = $derived(world.play.notes[selection.id] ?? '')
  const layer = $derived(layerOf(selection.kind, selection.id))
  const original = $derived(layer === 'modified' ? bookOriginal(selection.kind, selection.id) : undefined)
  const merged = $derived((character ?? faction ?? location ?? beat ?? arc ?? revelation ?? ambition ?? {}) as unknown as Record<string, unknown>)
  const changed = $derived(original ? diffFields(original, merged) : [])
  const COLL = { character: 'characters', faction: 'factions', location: 'locations', beat: 'beats', arc: 'arcs', revelation: 'revelations', ambition: 'ambitions' } as const
  const ro = $derived(world.readOnly)
  const relations = $derived(c.relations.filter((r) => r.from === selection.id || r.to === selection.id))
  const beatsWith = $derived(world.beatsSorted.filter((b) => b.participants.includes(selection.id) || (selection.kind === 'location' && b.location === selection.id) || (selection.kind === 'arc' && b.arcs.includes(selection.id)) || (selection.kind === 'revelation' && b.reveals.includes(selection.id))))
  const beatsByChapter = $derived.by(() => {
    const m = new Map<string, typeof beatsWith>()
    for (const b of beatsWith) m.set(b.chapter, [...(m.get(b.chapter) ?? []), b])
    return [...m.entries()]
  })
  const title = $derived(character?.name ?? faction?.name ?? location?.name ?? beat?.title ?? arc?.name ?? (revelation ? 'Revelação' : ambition ? 'Ambição' : selection.id))

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
  $effect(() => {
    void selection.id
    editing = false
  })

  let newRel = $state({ type: 'knows' as RelationType, to: '', label: '' })
  const others = $derived([...c.characters.map((x) => ({ id: x.id, name: x.name })), ...c.factions.map((x) => ({ id: x.id, name: x.name }))].filter((x) => x.id !== selection.id).sort((a, b) => a.name.localeCompare(b.name)))
  function submitRel() {
    if (!newRel.to) return
    addRelation({ from: selection.id, to: newRel.to, type: newRel.type, label: newRel.label, source: 'dm' })
    newRel = { type: 'knows', to: '', label: '' }
  }
  const isFaction = (id: string) => c.factions.some((f) => f.id === id)
</script>

<div class="panel">
  <div class="head">
    {#if ui.history.length}<button class="icon ghost" onclick={back} title="Voltar à selecção anterior">←</button>{/if}
    <span class="kind muted">{selection.kind === 'character' ? KIND_LABELS[character?.kind ?? 'npc'] : KIND_TITLE[selection.kind]}</span>
    {#if ro}<span class="tag book">📖 só o livro</span>{:else if layer === 'campaign'}<span class="tag new" title="Só existe na nossa campanha">✚ nosso</span>{:else if layer === 'modified'}<span class="tag mod" title="Entrada do livro com alterações nossas">▲ alterado</span>{:else}<span class="tag book" title="Tal como no livro">📖 livro</span>{/if}
    <span class="spacer"></span>
    <button class="icon ghost" onclick={closeSelection} title="Fechar (Esc)">✕</button>
  </div>

  <div class="body">
    <h2 style:color={arc ? arc.color : undefined}>{title}</h2>

    {#if missing}
      <p class="muted">Esta entrada não existe na vista actual (pode ser só da campanha, ou só do livro).</p>
    {/if}

    {#if character}
      {@const st = characterState(character)}
      {@const att = attitudeOf(character)}
      <div class="row meta">
        {#each character.factions as f, i_ (i_)}<EntityChip kind="faction" id={f} />{/each}
        {#if character.home}<span class="muted small">📍 <EntityChip kind="location" id={character.home} /></span>{/if}
        {#if character.chapters.length}<span class="muted small">caps. {character.chapters.map((x) => x.replace(/^ch/, '')).join(', ')}</span>{/if}
      </div>
      {#if st}<div class="state"><span class="muted small">Estado agora</span><b>{st}</b></div>{/if}
      {#if character.kind === 'rival' || att}
        <label class="field"><span>Atitude para com os PCs</span>
          <select value={att ?? ''} onchange={(e) => setAttitude(character.id, ((e.target as HTMLSelectElement).value || null) as Attitude | null)}>
            <option value="">(livro: {character.attitude ?? '—'})</option>
            {#each ATTITUDES as a, i_ (i_)}<option value={a}>{a}</option>{/each}
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
        <dl>
          {#if character.goal}<dt>Objectivo</dt><dd>{character.goal}</dd>{/if}
          {#if character.secret}<dt>Segredo</dt><dd>{character.secret}</dd>{/if}
          {#if character.wants}<dt>Quer</dt><dd>{character.wants}</dd>{/if}
          {#if character.fears}<dt>Teme</dt><dd>{character.fears}</dd>{/if}
        </dl>
        {#if !ro}<button class="small" onclick={() => startEdit({ summary: character.summary, goal: character.goal, secret: character.secret, wants: character.wants, fears: character.fears })}>✎ Editar</button>{/if}
      {/if}
      {#if character.states.length}
        <h3>Estados ao longo do tempo</h3>
        <ol class="timeline">{#each character.states as s, i (i)}<li><span class="when"><EntityChip kind="beat" id={s.fromBeat} /></span><span>{s.state}</span></li>{/each}</ol>
      {/if}
      {#if character.kind === 'pc'}
        <h3>Ambições</h3>
        {#each c.ambitions.filter((a) => a.pc === character.id) as a (a.id)}<div><EntityChip kind="ambition" id={a.id} label={a.text} /></div>{:else}<p class="muted">Sem ambições. Adiciona na vista PCs.</p>{/each}
      {/if}
    {/if}

    {#if faction}
      {#if faction.motto}<p class="muted"><i>{faction.motto}</i></p>{/if}
      <p>{faction.agenda}</p>
      {#if faction.publicFace}<dl><dt>Cara pública</dt><dd>{faction.publicFace}</dd></dl>{/if}
      {#if faction.leaders.length}<h3>Líderes</h3><div class="row">{#each faction.leaders as l, i_ (i_)}<EntityChip kind="character" id={l} />{/each}</div>{/if}
      {@const members = c.characters.filter((x) => x.factions.includes(faction.id))}
      {#if members.length}<h3>Membros ({members.length})</h3><div class="row">{#each members as m (m.id)}<EntityChip kind="character" id={m.id} />{/each}</div>{/if}
      {#if faction.allies.length}<h3>Aliados</h3><div class="row">{#each faction.allies as a, i_ (i_)}<EntityChip kind="faction" id={a} />{/each}</div>{/if}
      {#if faction.enemies.length}<h3>Inimigos</h3><div class="row">{#each faction.enemies as a, i_ (i_)}<EntityChip kind="faction" id={a} />{/each}</div>{/if}
      {#if faction.portents.length}
        <h3>Portentos (se ninguém intervier)</h3>
        <ol class="timeline">{#each faction.portents as p, i (i)}<li><span class="when muted small">{chapterName(p.chapter)}</span><span>{p.text}</span></li>{/each}</ol>
      {/if}
    {/if}

    {#if location}
      {#if location.parent}<div class="muted small">em <EntityChip kind="location" id={location.parent} /></div>{/if}
      <p>{location.summary}</p>
      {@const children = c.locations.filter((l) => l.parent === location.id)}
      {#if children.length}<h3>Dentro</h3><div class="row">{#each children as l (l.id)}<EntityChip kind="location" id={l.id} />{/each}</div>{/if}
    {/if}

    {#if beat}
      <div class="row meta">
        <span class="muted small">{chapterName(beat.chapter)} · ordem {beat.order}</span>
        {#if beat.timer}<span class="tag warnb">⏱ {beat.timer}</span>{/if}
      </div>
      <div class="actions">
        <button class:primary={!isPlayed(beat.id)} onclick={() => togglePlayed(beat.id)}>{isPlayed(beat.id) ? '✓ Jogado · desmarcar' : 'Marcar como jogado'}</button>
        {#if ui.view !== 'tempo' || ui.timelineMode !== 'chapter' || ui.chapter !== beat.chapter}<button onclick={() => goToBeat(beat.id)} title="Abrir a linha temporal neste capítulo">⏳ Ver na linha temporal</button>{/if}
      </div>
      <div class="row">{#each beat.arcs as a, i_ (i_)}<EntityChip kind="arc" id={a} />{/each}{#if beat.location}<span class="muted small">📍 <EntityChip kind="location" id={beat.location} /></span>{/if}</div>
      {#if editing}
        <label class="field"><span>Resumo</span><textarea rows="4" bind:value={draft.summary}></textarea></label>
        <label class="field"><span>Notas de DM</span><textarea rows="6" bind:value={draft.notes}></textarea></label>
        <div class="row"><button class="primary" onclick={() => saveEdit('beats')}>Guardar</button><button onclick={() => (editing = false)}>Cancelar</button></div>
      {:else}
        <p>{beat.summary}</p>
        {#if beat.notes}<details class="notes" open><summary>Notas de DM</summary><p>{beat.notes}</p></details>{/if}
        {#if !ro}<button class="small" onclick={() => startEdit({ summary: beat.summary, notes: beat.notes })}>✎ Editar</button>{/if}
      {/if}
      {#if beat.participants.length}<h3>Participantes</h3><div class="row">{#each beat.participants as p, i_ (i_)}<EntityChip kind={isFaction(p) ? 'faction' : 'character'} id={p} />{/each}</div>{/if}
      {#if beat.choices.length}
        <h3>Escolhas</h3>
        <ul class="choices">{#each beat.choices as ch, i (i)}<li><b>{ch.label}</b> <span class="muted">— {ch.outcome}</span> {#each ch.leadsTo as l, i_ (i_)}<EntityChip kind="beat" id={l} />{/each}</li>{/each}</ul>
      {/if}
      {#if beat.portent}<p class="portent">☠ <b>Portento</b> (<EntityChip kind="faction" id={beat.portent.faction} />): {beat.portent.text}</p>{/if}
      {#if beat.reveals.length}<h3>Revela</h3><ul class="plain">{#each beat.reveals as r, i_ (i_)}<li><EntityChip kind="revelation" id={r} /></li>{/each}</ul>{/if}
      {#if beat.requires.length}<h3>Requer antes</h3><div class="row">{#each beat.requires as r, i_ (i_)}<EntityChip kind="beat" id={r} />{/each}</div>{/if}
      {@const next = c.beats.filter((b) => b.requires.includes(beat.id) || b.choices.some((ch) => ch.leadsTo.includes(beat.id)))}
      {#if next.length}<h3>Leva a</h3><div class="row">{#each next as b (b.id)}<EntityChip kind="beat" id={b.id} />{/each}</div>{/if}
    {/if}

    {#if arc}
      <p>{arc.summary}</p>
      {#if arc.ownerPc}<p>PC: <EntityChip kind="character" id={arc.ownerPc} /></p>{/if}
    {/if}

    {#if revelation}
      <p class="muted small">{revelation.list}</p>
      <p class="lead">{revelation.text}</p>
      <div class="actions">
        <button class:primary={!world.play.revealed.includes(revelation.id)} onclick={() => toggleRevealed(revelation.id)}>{world.play.revealed.includes(revelation.id) ? '✓ Revelada · desmarcar' : 'Marcar como revelada'}</button>
      </div>
      {@const met = revelation.clues.filter(isPlayed).length}
      <h3>Pistas · {met}/{revelation.clues.length} jogadas {#if revelation.clues.length < 3}<span class="tag warnb">menos de 3</span>{/if}</h3>
      <div class="meter" class:ok={met >= 3}><i style:width="{revelation.clues.length ? (met / revelation.clues.length) * 100 : 0}%"></i></div>
      <div class="row" style:margin-top="0.5rem">{#each revelation.clues as b, i_ (i_)}<EntityChip kind="beat" id={b} />{/each}</div>
    {/if}

    {#if ambition}
      <p><EntityChip kind="character" id={ambition.pc} /></p>
      <p class="lead">{ambition.text}</p>
      {#if ambition.npcs.length}<h3>NPCs</h3><div class="row">{#each ambition.npcs as n, i_ (i_)}<EntityChip kind="character" id={n} />{/each}</div>{/if}
      {#if ambition.satisfiedBy.length}<h3>Satisfeita por</h3><div class="row">{#each ambition.satisfiedBy as b, i_ (i_)}<EntityChip kind="beat" id={b} />{/each}</div>{/if}
      {#if ambition.threatenedBy.length}<h3>Ameaçada por</h3><div class="row">{#each ambition.threatenedBy as b, i_ (i_)}<EntityChip kind="beat" id={b} />{/each}</div>{/if}
    {/if}

    {#if selection.kind === 'character' || selection.kind === 'faction'}
      <h3>Relações ({relations.length})</h3>
      <ul class="rels">
        {#each relations as r, i (i)}
          {@const active = relationActive(r, world.cursor, world.beatPos)}
          {@const other = r.from === selection.id ? r.to : r.from}
          <li class:inactive={!active} title={active ? '' : 'Ainda não activa (ou já terminada) no momento escolhido'}>
            <span class="rtype muted">{r.from === selection.id ? RELATION_LABELS[r.type] : '← ' + RELATION_LABELS[r.type]}</span>
            <EntityChip kind={isFaction(other) ? 'faction' : 'character'} id={other} />
            {#if r.label}<span class="lbl">{r.label}</span>{/if}
            {#if r.condition}<span class="muted small">({r.condition})</span>{/if}
            {#if r.fromBeat || r.untilBeat}<span class="muted small">⏱ {r.fromBeat ? 'desde ' + nameOf(r.fromBeat) : ''}{r.untilBeat ? ' até ' + nameOf(r.untilBeat) : ''}</span>{/if}
            {#if relationLayer(r) === 'campaign'}<span class="tag new">✚</span>{/if}
            {#if !ro}<button class="icon ghost rm" title={relationLayer(r) === 'campaign' ? 'remover' : 'esconder esta relação do livro na nossa campanha'} onclick={() => removeRelation(r)}>✕</button>{/if}
          </li>
        {:else}
          <li class="muted">Sem relações registadas.</li>
        {/each}
      </ul>
      {#if !ro}
        <details>
          <summary>+ nova relação</summary>
          <div class="row" style:margin-top="0.4rem">
            <select bind:value={newRel.type}>{#each RELATION_TYPES as t, i_ (i_)}<option value={t}>{RELATION_LABELS[t]}</option>{/each}</select>
            <select bind:value={newRel.to}><option value="">…</option>{#each others as o (o.id)}<option value={o.id}>{o.name}</option>{/each}</select>
          </div>
          <div class="row" style:margin-top="0.4rem"><input type="text" placeholder="rótulo" bind:value={newRel.label} /><button onclick={submitRel}>Adicionar</button></div>
        </details>
      {/if}
    {/if}

    {#if beatsWith.length && selection.kind !== 'beat'}
      <h3>Beats ({beatsWith.length})</h3>
      {#each beatsByChapter as [ch, list] (ch)}
        <div class="bychap">
          <div class="muted tiny">{chapterName(ch)}</div>
          <div class="row">{#each list as b (b.id)}<EntityChip kind="beat" id={b.id} />{/each}</div>
        </div>
      {/each}
    {/if}

    {#if original && changed.length}
      <details class="orig">
        <summary>Original no livro ({changed.length} campo(s) diferente(s))</summary>
        {#each changed as k (k)}
          <p><b>{k}:</b> <span class="was">{typeof original[k] === 'string' ? original[k] : JSON.stringify(original[k])}</span></p>
        {/each}
        <button class="danger small" onclick={() => confirm('Repor a versão do livro? As alterações da campanha a esta entrada perdem-se.') && revertToBook(COLL[selection.kind], selection.id)}>Repor versão do livro</button>
      </details>
    {/if}

    <h3>Nota do DM</h3>
    <textarea rows="3" value={note} onchange={(e) => setNote(selection.id, (e.target as HTMLTextAreaElement).value)} placeholder="Notas privadas sobre esta entrada (ficam em state.json)"></textarea>
    <p class="muted tiny">id: <code>{selection.id}</code></p>
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    font-size: 0.93em;
  }
  .head {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.9rem;
    background: var(--bg-2);
    border-bottom: 1px solid var(--line);
  }
  .kind {
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .body {
    padding: 0.75rem 1rem 2rem;
  }
  h2 {
    margin: 0.2rem 0 0.6rem;
    font-size: 1.2rem;
    line-height: 1.25;
  }
  h3 {
    margin: 1.1rem 0 0.35rem;
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  p {
    margin: 0.35rem 0;
  }
  .lead {
    font-size: 1.02em;
  }
  .meta {
    margin-bottom: 0.4rem;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin: 0.5rem 0 0.7rem;
  }
  .state {
    display: flex;
    flex-direction: column;
    background: var(--accent-soft);
    border: 1px solid rgba(217, 164, 65, 0.3);
    border-radius: var(--radius-s);
    padding: 0.4rem 0.6rem;
    margin: 0.4rem 0;
  }
  dl {
    margin: 0.4rem 0;
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 0.7rem;
  }
  dt {
    color: var(--muted);
    font-size: 0.85em;
    padding-top: 0.1em;
  }
  dd {
    margin: 0;
  }
  .notes p {
    white-space: pre-wrap;
    color: var(--muted);
    border-left: 2px solid var(--line-2);
    padding-left: 0.6rem;
    margin-top: 0.3rem;
  }
  .choices {
    padding-left: 1.1rem;
    margin: 0.2rem 0;
  }
  .choices li {
    margin: 0.3rem 0;
  }
  .portent {
    background: var(--danger-soft);
    border-radius: var(--radius-s);
    padding: 0.4rem 0.6rem;
  }
  .timeline {
    list-style: none;
    padding: 0;
    margin: 0.2rem 0;
  }
  .timeline li {
    display: grid;
    grid-template-columns: minmax(90px, 40%) 1fr;
    gap: 0.5rem;
    padding: 0.3rem 0;
    border-bottom: 1px dashed var(--line);
  }
  .timeline .when {
    min-width: 0;
  }
  .rels {
    list-style: none;
    padding: 0;
    margin: 0.2rem 0;
  }
  .rels li {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.25rem 0;
    border-bottom: 1px dashed var(--line);
  }
  .rels li.inactive {
    opacity: 0.45;
  }
  .rtype {
    font-size: 0.85em;
    min-width: 5.5em;
  }
  .lbl {
    font-style: italic;
    color: var(--muted);
  }
  .rm {
    margin-left: auto;
    color: var(--muted);
  }
  .bychap {
    margin: 0.35rem 0;
  }
  .orig {
    margin-top: 0.8rem;
    border: 1px dashed var(--warn);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
  }
  .was {
    color: var(--muted);
    white-space: pre-wrap;
  }
  button.small {
    font-size: 0.86em;
    padding: 0.25rem 0.6rem;
  }
</style>
