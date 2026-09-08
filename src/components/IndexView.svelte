<script lang="ts">
  import { world, characterState, layerOf, ui, chapterName, chapterShort, isPlayed } from '../lib/state.svelte'
  import { KIND_LABELS } from '../lib/colors'
  import EntityChip from './EntityChip.svelte'

  type Tab = 'characters' | 'factions' | 'locations' | 'beats' | 'revelations'
  const c = $derived(world.canon)
  let q = $state('')
  let tab = $state<Tab>('characters')
  let onlyChapter = $state(false)
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const match = (s: string) => norm(s).includes(norm(q.trim()))
  const only = (kind: 'character' | 'faction' | 'location' | 'beat' | 'revelation', id: string) => !ui.onlyChanges || layerOf(kind, id) !== 'book'
  const inChapter = (chs: string[]) => !onlyChapter || chs.includes(ui.chapter)

  const chars = $derived(c.characters.filter((x) => (match(x.name) || match(x.summary)) && only('character', x.id) && inChapter(x.chapters)).sort((a, b) => a.name.localeCompare(b.name)))
  const factions = $derived(c.factions.filter((x) => (match(x.name) || match(x.agenda)) && only('faction', x.id)).sort((a, b) => a.name.localeCompare(b.name)))
  const locations = $derived(c.locations.filter((x) => (match(x.name) || match(x.summary)) && only('location', x.id) && inChapter([x.chapter])).sort((a, b) => (world.chapterIndex.get(a.chapter) ?? 0) - (world.chapterIndex.get(b.chapter) ?? 0) || a.name.localeCompare(b.name)))
  const beats = $derived(world.beatsSorted.filter((x) => (match(x.title) || match(x.summary)) && only('beat', x.id) && inChapter([x.chapter])))
  const revelations = $derived(c.revelations.filter((x) => match(x.text) && only('revelation', x.id)))
  const counts = $derived({ characters: chars.length, factions: factions.length, locations: locations.length, beats: beats.length, revelations: revelations.length })
  const tabs: { id: Tab; label: string }[] = [
    { id: 'characters', label: 'Personagens' },
    { id: 'factions', label: 'Facções' },
    { id: 'locations', label: 'Locais' },
    { id: 'beats', label: 'Beats' },
    { id: 'revelations', label: 'Revelações' },
  ]
  const arcName = (id: string) => c.arcs.find((a) => a.id === id)?.name ?? id
</script>

<div class="toolbar">
  <div class="seg">
    {#each tabs as t (t.id)}<button class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label} <span class="muted">{counts[t.id]}</span></button>{/each}
  </div>
  <input type="search" placeholder="filtrar…" bind:value={q} />
  <label class="toggle" class:on={ui.onlyChanges} title="Só o que acrescentámos (✚) ou alterámos (▲) face ao livro"><input type="checkbox" bind:checked={ui.onlyChanges} />só alterações ao livro</label>
  {#if tab !== 'factions' && tab !== 'revelations'}
    <label class="toggle" class:on={onlyChapter} title="Só o que entra no capítulo escolhido em cima"><input type="checkbox" bind:checked={onlyChapter} />só {chapterName(ui.chapter)}</label>
  {/if}
</div>

<div class="page wide">
  {#if tab === 'characters'}
    <table class="list">
      <thead><tr><th>Nome</th><th>Tipo</th><th>Facções</th><th>Capítulos</th><th>Estado agora</th></tr></thead>
      <tbody>
        {#each chars as ch (ch.id)}
          <tr>
            <td><EntityChip kind="character" id={ch.id} /></td>
            <td class="muted">{KIND_LABELS[ch.kind]}</td>
            <td>{#each ch.factions.slice(0, 2) as f, i_ (i_)}<EntityChip kind="faction" id={f} /> {/each}{#if ch.factions.length > 2}<span class="muted tiny">+{ch.factions.length - 2}</span>{/if}</td>
            <td class="muted chs">{ch.chapters.map(chapterShort).join(' · ')}</td>
            <td class="muted small st"><span class="clamp-2">{characterState(ch)}</span></td>
          </tr>
        {:else}
          <tr><td colspan="5" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'factions'}
    <div class="grid">
      {#each factions as f (f.id)}
        <div class="card">
          <div class="row"><EntityChip kind="faction" id={f.id} /><span class="muted tiny">{c.characters.filter((x) => x.factions.includes(f.id)).length} membros · {f.portents.length} portentos</span></div>
          <p class="muted small clamp-3">{f.agenda}</p>
        </div>
      {/each}
    </div>
  {:else if tab === 'locations'}
    <table class="list">
      <thead><tr><th>Local</th><th>Dentro de</th><th>Capítulo</th><th>Resumo</th></tr></thead>
      <tbody>
        {#each locations as l (l.id)}
          <tr>
            <td><EntityChip kind="location" id={l.id} /></td>
            <td>{#if l.parent}<EntityChip kind="location" id={l.parent} />{/if}</td>
            <td class="muted">{chapterShort(l.chapter)}</td>
            <td class="muted small clamp-2">{l.summary}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'beats'}
    <table class="list">
      <thead><tr><th>Cap.</th><th>Beat</th><th>Pistas</th><th>Resumo</th></tr></thead>
      <tbody>
        {#each beats as b (b.id)}
          <tr class:played={isPlayed(b.id)}>
            <td class="muted">{chapterShort(b.chapter)} <span class="tiny">· {b.order}</span></td>
            <td><EntityChip kind="beat" id={b.id} /></td>
            <td class="muted tiny">{b.arcs.map(arcName).join(', ')}</td>
            <td class="muted small clamp-2">{b.summary}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <table class="list">
      <thead><tr><th>Lista</th><th>Revelação</th><th>Pistas</th></tr></thead>
      <tbody>
        {#each revelations as r (r.id)}
          <tr>
            <td class="muted small">{r.list}</td>
            <td><EntityChip kind="revelation" id={r.id} label={r.text} /></td>
            <td class="muted">{r.clues.filter(isPlayed).length}/{r.clues.length}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .page.wide {
    max-width: none;
  }
  .toolbar input[type='search'] {
    width: 200px;
  }
  .chs {
    white-space: nowrap;
  }
  .st {
    max-width: 380px;
  }
  tr.played td {
    background: var(--ok-soft);
  }
</style>
