<script lang="ts">
  import { ui, world, store, setView, saveRemote, type View } from '../lib/state.svelte'
  import { getToken } from '../lib/github'

  const views: { id: View; label: string }[] = [
    { id: 'tempo', label: 'Linha temporal' },
    { id: 'grafo', label: 'Grafo' },
    { id: 'pcs', label: 'PCs' },
    { id: 'frentes', label: 'Frentes' },
    { id: 'revelacoes', label: 'Revelações' },
    { id: 'sessao', label: 'Sessão' },
    { id: 'indice', label: 'Índice' },
    { id: 'definicoes', label: 'Definições' },
  ]

  const chapters = $derived(world.canon.campaign.chapters)
  const chapterIdx = $derived(Math.max(0, chapters.findIndex((c) => c.id === ui.chapter)))
  const current = $derived(chapters[chapterIdx])
  const errors = $derived(world.problems.filter((p) => p.level === 'error').length)
  const dirty = $derived(world.dirtyFiles.length)

  function onRange(e: Event) {
    const i = Number((e.target as HTMLInputElement).value)
    ui.chapter = chapters[i]?.id ?? ui.chapter
    ui.cursorMode = 'chapter'
  }
</script>

<header>
  <div class="top row">
    <h1>🕸️ {world.canon.campaign.title}</h1>
    <nav class="tabs">
      {#each views as v (v.id)}
        <button class:active={ui.view === v.id} onclick={() => setView(v.id)}>{v.label}</button>
      {/each}
    </nav>
    <div class="spacer"></div>
    {#if errors}
      <button class="err" title="Ver problemas nas Definições" onclick={() => setView('definicoes')}>⚠ {errors} erro(s) nos dados</button>
    {/if}
    {#if dirty}
      <button class="primary" onclick={() => saveRemote()} disabled={store.sync.status === 'saving'} title={getToken() ? 'Gravar no GitHub' : 'Sem token: ver Definições'}>
        💾 Guardar ({dirty})
      </button>
    {/if}
    <span class="muted status {store.sync.status}" title={store.sync.message}>
      {#if store.sync.status === 'loading'}a ler…{:else if store.sync.status === 'saving'}a gravar…{:else if store.sync.status === 'error'}✖ sync{:else if store.sync.status === 'ok'}✓ {store.sync.lastSync}{:else}local{/if}
    </span>
  </div>
  <div class="cursor row">
    <span class="muted">Ver:</span>
    <button class:active={ui.layerView === 'campaign'} onclick={() => (ui.layerView = 'campaign')} title="Livro + as nossas alterações">a nossa campanha</button>
    <button class:active={ui.layerView === 'book'} onclick={() => (ui.layerView = 'book')} title="Só o livro, como referência (só leitura)">só o livro</button>
    <span class="sep"></span>
    <span class="muted">Tempo:</span>
    <button class:active={ui.cursorMode === 'chapter'} onclick={() => (ui.cursorMode = 'chapter')}>por capítulo</button>
    <button class:active={ui.cursorMode === 'played'} onclick={() => (ui.cursorMode = 'played')} title="Só o que já foi jogado (Sessão)">jogado</button>
    <input type="range" min="0" max={Math.max(chapters.length - 1, 0)} value={chapterIdx} oninput={onRange} disabled={ui.cursorMode === 'played'} />
    <span class="chapter-name">
      {#if ui.cursorMode === 'played'}até ao último beat jogado ({world.play.playedBeats.length}){:else if current}{current.name} <span class="muted">· níveis {current.levels}</span>{/if}
    </span>
  </div>
</header>

<style>
  header {
    height: var(--header-h);
    border-bottom: 1px solid var(--line);
    background: var(--bg-2);
    padding: 0.4rem 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  h1 {
    font-size: 1.05rem;
    margin: 0;
    white-space: nowrap;
  }
  .top {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
  .spacer {
    flex: 1;
  }
  .cursor input[type='range'] {
    width: 260px;
  }
  .chapter-name {
    white-space: nowrap;
  }
  button.active {
    border-color: var(--accent);
    color: var(--accent);
  }
  .sep {
    width: 1px;
    height: 1.4em;
    background: var(--line);
  }
  .status {
    font-size: 0.85em;
    white-space: nowrap;
  }
  .status.error {
    color: var(--danger);
  }
  .status.ok {
    color: var(--ok);
  }
</style>
