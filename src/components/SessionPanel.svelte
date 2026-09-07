<script lang="ts">
  import { ui, world, upsertSession, removeSession, setCurrentChapter, togglePlayed, isPlayed, setFlag } from '../lib/state.svelte'
  import { uid, type Session } from '../lib/types'
  import { orderArcs } from '../lib/timeline'
  import EntityChip from './EntityChip.svelte'

  const c = $derived(world.canon)
  const play = $derived(world.play)
  const sessions = $derived([...play.sessions].sort((a, b) => a.date.localeCompare(b.date)))
  const played = $derived(new Set(play.playedBeats))

  /** Próximo beat por arco: primeiro não jogado cujos requires estão jogados. */
  const next = $derived.by(() =>
    orderArcs(c.arcs).map((arc) => {
      const beats = world.beatsSorted.filter((b) => b.arcs.includes(arc.id))
      const ready = beats.find((b) => !played.has(b.id) && b.requires.every((r) => played.has(r)))
      const blocked = beats.find((b) => !played.has(b.id) && !b.requires.every((r) => played.has(r)))
      return { arc, ready, blocked, done: beats.filter((b) => played.has(b.id)).length, total: beats.length }
    }),
  )

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
  const chapterBeats = $derived(world.beatsSorted.filter((b) => b.chapter === (play.currentChapter ?? ui.chapter)))
  let newFlag = $state('')
</script>

<div class="page">
  <h2>Sessão</h2>
  <div class="row">
    <label class="field"><span>Capítulo actual</span>
      <select value={play.currentChapter ?? ''} onchange={(e) => setCurrentChapter((e.target as HTMLSelectElement).value || null)}>
        <option value="">—</option>
        {#each c.campaign.chapters as ch (ch.id)}<option value={ch.id}>{ch.name}</option>{/each}
      </select>
    </label>
    <span class="muted">{play.playedBeats.length} beats jogados · {play.revealed.length} revelações · {sessions.length} sessões</span>
  </div>

  <h3>O que vem a seguir, por pista</h3>
  <table class="list">
    <thead><tr><th>Pista</th><th>Feito</th><th>Próximo beat pronto</th><th>Bloqueado (requer)</th></tr></thead>
    <tbody>
      {#each next as n (n.arc.id)}
        <tr>
          <td><EntityChip kind="arc" id={n.arc.id} /></td>
          <td class="muted">{n.done}/{n.total}</td>
          <td>{#if n.ready}<EntityChip kind="beat" id={n.ready.id} /> <button class="icon" onclick={() => togglePlayed(n.ready!.id)}>✓</button>{:else}<span class="muted">—</span>{/if}</td>
          <td>{#if n.blocked}<EntityChip kind="beat" id={n.blocked.id} /> <span class="muted">← {#each n.blocked.requires.filter((r) => !played.has(r)) as r (r)}<EntityChip kind="beat" id={r} /> {/each}</span>{/if}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <h3>Sessões</h3>
  {#if editing}
    <div class="card">
      <div class="row">
        <label class="field"><span>Data</span><input type="date" bind:value={editing.date} /></label>
        <label class="field grow"><span>Título</span><input type="text" bind:value={editing.title} /></label>
      </div>
      <label class="field"><span>Notas</span><textarea rows="4" bind:value={editing.notes}></textarea></label>
      <div class="field"><span class="muted">Beats jogados nesta sessão (capítulo {play.currentChapter ?? ui.chapter}); marcar aqui marca-os também como jogados</span>
        <div class="beatlist">
          {#each chapterBeats as b (b.id)}
            <label><input type="checkbox" checked={editing.beats.includes(b.id)} onchange={() => { toggleBeatInSession(b.id); if (!isPlayed(b.id) && editing?.beats.includes(b.id)) togglePlayed(b.id) }} /> {b.title}</label>
          {/each}
        </div>
      </div>
      <div class="row"><button class="primary" onclick={save}>Guardar sessão</button><button onclick={() => (editing = null)}>Cancelar</button></div>
    </div>
  {:else}
    <button onclick={newSession}>+ nova sessão</button>
  {/if}
  <table class="list">
    <tbody>
      {#each sessions as s (s.id)}
        <tr>
          <td class="muted">{s.date}</td>
          <td><b>{s.title}</b><br /><span class="muted">{s.notes}</span></td>
          <td>{#each s.beats as b (b)}<EntityChip kind="beat" id={b} /> {/each}</td>
          <td><button class="icon" onclick={() => (editing = { ...s, beats: [...s.beats] })}>✎</button> <button class="icon danger" onclick={() => confirm('Remover sessão?') && removeSession(s.id)}>✕</button></td>
        </tr>
      {:else}
        <tr><td class="muted">Ainda sem sessões registadas.</td></tr>
      {/each}
    </tbody>
  </table>

  <h3>Flags livres</h3>
  <p class="muted">Factos que a mesa estabeleceu e que condicionam reacções ("aloysia-viu-a-joia", "prolix-inimigo"…). Estilo Larian: o que se rastreia são flags.</p>
  <div class="row">
    {#each Object.keys(play.flags) as f (f)}<span class="chip">{f} <button class="icon" onclick={() => setFlag(f, false)}>✕</button></span>{/each}
    <input type="text" placeholder="nova flag" bind:value={newFlag} onkeydown={(e) => e.key === 'Enter' && newFlag.trim() && (setFlag(newFlag.trim(), true), (newFlag = ''))} />
  </div>
</div>

<style>
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
  }
</style>
