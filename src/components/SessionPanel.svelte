<script lang="ts">
  import { ui, world, upsertSession, removeSession, setCurrentChapter, togglePlayed, isPlayed, setFlag, chapterName } from '../lib/state.svelte'
  import { uid, type Session } from '../lib/types'
  import { orderArcs } from '../lib/timeline'
  import EntityChip from './EntityChip.svelte'
  import PcCoverage from './PcCoverage.svelte'

  const c = $derived(world.canon)
  const play = $derived(world.play)
  const sessions = $derived([...play.sessions].sort((a, b) => b.date.localeCompare(a.date)))
  const played = $derived(new Set(play.playedBeats))
  const tableChapter = $derived(play.currentChapter ?? ui.chapter)

  /** Próximo beat por arco: primeiro não jogado cujos requires estão jogados. */
  const next = $derived.by(() =>
    orderArcs(c.arcs).map((arc) => {
      const beats = world.beatsSorted.filter((b) => b.arcs.includes(arc.id))
      const ready = beats.find((b) => !played.has(b.id) && b.requires.every((r) => played.has(r)))
      const blocked = beats.find((b) => !played.has(b.id) && !b.requires.every((r) => played.has(r)))
      return { arc, ready, blocked, done: beats.filter((b) => played.has(b.id)).length, total: beats.length }
    }),
  )
  /** Beats do capítulo da mesa ainda por jogar, por ordem. */
  const chapterPending = $derived(world.beatsSorted.filter((b) => b.chapter === tableChapter && !played.has(b.id)))

  let editing = $state<Session | null>(null)
  function newSession() {
    editing = { id: uid(), date: new Date().toISOString().slice(0, 10), title: `Sessão ${sessions.length + 1}`, beats: [], notes: '' }
  }
  function save() {
    if (!editing) return
    upsertSession($state.snapshot(editing))
    editing = null
  }
  function toggleBeatInSession(id: string) {
    if (!editing) return
    editing.beats = editing.beats.includes(id) ? editing.beats.filter((x) => x !== id) : [...editing.beats, id]
  }
  const chapterBeats = $derived(world.beatsSorted.filter((b) => b.chapter === tableChapter))
  let newFlag = $state('')
  let tab = $state<'proximo' | 'sessoes' | 'flags'>('proximo')
</script>

<div class="toolbar">
  <label class="row nowrap">
    <span class="muted small">A mesa está em</span>
    <select value={play.currentChapter ?? ''} onchange={(e) => setCurrentChapter((e.target as HTMLSelectElement).value || null)} title="Capítulo actual da mesa (fica em state.json e define o cursor)">
      <option value="">— escolher capítulo —</option>
      {#each c.campaign.chapters as ch (ch.id)}<option value={ch.id}>{ch.name}</option>{/each}
    </select>
  </label>
  <span class="spacer"></span>
  <div class="stats muted small">
    <span><b>{play.playedBeats.length}</b> beats jogados</span>
    <span><b>{play.revealed.length}</b> revelações</span>
    <span><b>{sessions.length}</b> sessões</span>
  </div>
</div>

<div class="page">
  <div class="seg tabs">
    <button class:active={tab === 'proximo'} onclick={() => (tab = 'proximo')}>O que vem a seguir</button>
    <button class:active={tab === 'sessoes'} onclick={() => (tab = 'sessoes')}>Sessões ({sessions.length})</button>
    <button class:active={tab === 'flags'} onclick={() => (tab = 'flags')}>Flags ({Object.keys(play.flags).length})</button>
  </div>

  {#if tab === 'proximo'}
    <PcCoverage compact onlyChapter={tableChapter} />
    <h3 class="section-title">Por jogar em {chapterName(tableChapter)} <span class="muted">· {chapterPending.length}</span></h3>
    {#if chapterPending.length}
      <div class="pending">
        {#each chapterPending.slice(0, 24) as b (b.id)}
          <div class="pend"><EntityChip kind="beat" id={b.id} /><button class="icon ghost" title="marcar jogado" onclick={() => togglePlayed(b.id)}>✓</button></div>
        {/each}
        {#if chapterPending.length > 24}<span class="muted small">… e mais {chapterPending.length - 24}</span>{/if}
      </div>
    {:else}
      <p class="muted">Tudo jogado neste capítulo. Muda o capítulo da mesa em cima.</p>
    {/if}

    <h3 class="section-title">Próximo beat pronto, por pista</h3>
    <div class="grid lanes">
      {#each next as n (n.arc.id)}
        <div class="card lane" style:border-left-color={n.arc.color}>
          <div class="row nowrap top">
            <EntityChip kind="arc" id={n.arc.id} />
            <span class="spacer"></span>
            <span class="muted tiny">{n.done}/{n.total}</span>
          </div>
          <div class="meter" class:ok={n.done === n.total && n.total > 0}><i style:width="{n.total ? (n.done / n.total) * 100 : 0}%"></i></div>
          <div class="nextb">
            {#if n.ready}
              <span class="muted tiny">pronto</span>
              <div class="row nowrap"><EntityChip kind="beat" id={n.ready.id} /><button class="icon ghost" title="marcar jogado" onclick={() => togglePlayed(n.ready!.id)}>✓</button></div>
            {:else if n.done === n.total}
              <span class="ok tiny">pista concluída</span>
            {:else}
              <span class="muted tiny">nada pronto</span>
            {/if}
            {#if n.blocked}
              <details>
                <summary class="tiny">bloqueado: {n.blocked.title.slice(0, 40)}{n.blocked.title.length > 40 ? '…' : ''}</summary>
                <div class="row" style:margin-top="0.3rem"><span class="muted tiny">requer</span>{#each n.blocked.requires.filter((r) => !played.has(r)) as r, i_ (i_)}<EntityChip kind="beat" id={r} />{/each}</div>
              </details>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if tab === 'sessoes'}
    {#if editing}
      <div class="card editor">
        <div class="row">
          <label class="field"><span>Data</span><input type="date" bind:value={editing.date} /></label>
          <label class="field grow"><span>Título</span><input type="text" bind:value={editing.title} /></label>
        </div>
        <label class="field"><span>Notas</span><textarea rows="4" bind:value={editing.notes}></textarea></label>
        <div class="field">
          <span class="muted">Beats jogados nesta sessão ({chapterName(tableChapter)}). Marcar aqui marca-os também como jogados.</span>
          <div class="beatlist">
            {#each chapterBeats as b (b.id)}
              <label class:played={isPlayed(b.id)}><input type="checkbox" checked={editing.beats.includes(b.id)} onchange={() => { toggleBeatInSession(b.id); if (!isPlayed(b.id) && editing?.beats.includes(b.id)) togglePlayed(b.id) }} /> {b.title}</label>
            {/each}
          </div>
        </div>
        <div class="row"><button class="primary" onclick={save}>Guardar sessão</button><button onclick={() => (editing = null)}>Cancelar</button></div>
      </div>
    {:else}
      <button class="primary" onclick={newSession}>+ Nova sessão</button>
    {/if}
    <div class="sessions">
      {#each sessions as s (s.id)}
        <div class="card sess">
          <div class="row nowrap">
            <span class="muted small date">{s.date}</span>
            <b class="ttl">{s.title}</b>
            <span class="spacer"></span>
            <button class="icon ghost" onclick={() => (editing = { ...s, beats: [...s.beats] })} title="editar">✎</button>
            <button class="icon ghost danger" onclick={() => confirm('Remover sessão?') && removeSession(s.id)} title="remover">✕</button>
          </div>
          {#if s.notes}<p class="muted small notes">{s.notes}</p>{/if}
          {#if s.beats.length}<div class="row">{#each s.beats as b, i_ (i_)}<EntityChip kind="beat" id={b} />{/each}</div>{/if}
        </div>
      {:else}
        <p class="empty">Ainda sem sessões registadas.</p>
      {/each}
    </div>
  {:else}
    <p class="help">Factos que a mesa estabeleceu e que condicionam reacções ("aloysia-viu-a-joia", "prolix-inimigo"…). O que se rastreia são flags.</p>
    <div class="row">
      {#each Object.keys(play.flags) as f, i_ (i_)}<span class="chip static">{f} <button class="icon linkish" onclick={() => setFlag(f, false)} title="remover">✕</button></span>{/each}
    </div>
    <div class="row" style:margin-top="0.6rem">
      <input type="text" placeholder="nova flag" bind:value={newFlag} onkeydown={(e) => e.key === 'Enter' && newFlag.trim() && (setFlag(newFlag.trim(), true), (newFlag = ''))} />
      <button onclick={() => { if (newFlag.trim()) { setFlag(newFlag.trim(), true); newFlag = '' } }}>Adicionar</button>
    </div>
  {/if}
</div>

<style>
  .stats {
    display: flex;
    gap: 1rem;
  }
  .tabs {
    margin-bottom: 0.5rem;
  }
  .pending {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.5rem;
  }
  .pend {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
  }
  .lanes {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  .lane {
    border-left: 4px solid;
    padding: 0.65rem 0.85rem;
  }
  .lane .top {
    margin-bottom: 0.4rem;
  }
  .nextb {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .grow {
    flex: 1;
  }
  .beatlist {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.1rem 1rem;
    max-height: 260px;
    overflow: auto;
    border: 1px solid var(--line);
    padding: 0.4rem;
    border-radius: 8px;
    margin-top: 0.3rem;
  }
  .beatlist label.played {
    color: var(--ok);
  }
  .sessions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .date {
    font-variant-numeric: tabular-nums;
  }
  .ttl {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .notes {
    white-space: pre-wrap;
  }
</style>
