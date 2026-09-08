<script lang="ts">
  import { onMount } from 'svelte'
  import { ui, loadRemote, closeSelection } from './lib/state.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import TopBar from './components/TopBar.svelte'
  import SearchPalette from './components/SearchPalette.svelte'
  import Timeline from './components/Timeline.svelte'
  import RelationGraph from './components/RelationGraph.svelte'
  import PcView from './components/PcView.svelte'
  import FrontsView from './components/FrontsView.svelte'
  import RevelationsView from './components/RevelationsView.svelte'
  import SessionPanel from './components/SessionPanel.svelte'
  import IndexView from './components/IndexView.svelte'
  import Settings from './components/Settings.svelte'
  import DetailPanel from './components/DetailPanel.svelte'

  onMount(() => {
    void loadRemote()
    try {
      ui.sidebarCollapsed = localStorage.getItem('cc-sidebar') === '1'
    } catch {
      /* ignore */
    }
  })

  function onKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      ui.searchOpen = !ui.searchOpen
      return
    }
    if (e.key === 'Escape') {
      if (ui.searchOpen) ui.searchOpen = false
      else closeSelection()
      return
    }
    if (!typing && e.key === '/') {
      e.preventDefault()
      ui.searchOpen = true
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app" class:rail={ui.sidebarCollapsed} class:with-panel={ui.selection}>
  <Sidebar />
  <div class="main">
    <TopBar />
    <main>
      {#if ui.view === 'tempo'}<Timeline />
      {:else if ui.view === 'grafo'}<RelationGraph />
      {:else if ui.view === 'pcs'}<PcView />
      {:else if ui.view === 'frentes'}<FrontsView />
      {:else if ui.view === 'revelacoes'}<RevelationsView />
      {:else if ui.view === 'sessao'}<SessionPanel />
      {:else if ui.view === 'indice'}<IndexView />
      {:else}<Settings />{/if}
    </main>
  </div>
  {#if ui.selection}
    <aside class="drawer"><DetailPanel selection={ui.selection} /></aside>
  {/if}
</div>
{#if ui.searchOpen}<SearchPalette />{/if}

<style>
  .app {
    display: grid;
    grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
    height: 100vh;
    width: 100vw;
  }
  .app.rail {
    grid-template-columns: var(--sidebar-rail) minmax(0, 1fr);
  }
  .app.with-panel {
    grid-template-columns: var(--sidebar-w) minmax(0, 1fr) var(--drawer-w);
  }
  .app.rail.with-panel {
    grid-template-columns: var(--sidebar-rail) minmax(0, 1fr) var(--drawer-w);
  }
  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100vh;
  }
  main {
    flex: 1;
    min-height: 0;
    overflow: auto;
    position: relative;
  }
  .drawer {
    border-left: 1px solid var(--line);
    background: var(--bg-2);
    overflow: auto;
    height: 100vh;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.25);
  }
  @media (max-width: 1000px) {
    .app,
    .app.rail,
    .app.with-panel,
    .app.rail.with-panel {
      grid-template-columns: var(--sidebar-rail) minmax(0, 1fr);
      grid-template-rows: 1fr;
    }
    .drawer {
      position: fixed;
      right: 0;
      top: 0;
      width: min(100vw, var(--drawer-w));
      z-index: 20;
    }
  }
</style>
