<script lang="ts">
  import { onMount } from 'svelte'
  import { ui, fecharPaineis } from './lib/state.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import TopBar from './components/TopBar.svelte'
  import SearchPalette from './components/SearchPalette.svelte'
  import RelationGraph from './components/RelationGraph.svelte'
  import Sessao from './components/Sessao.svelte'
  import Batalha from './components/Batalha.svelte'
  import Indice from './components/Indice.svelte'
  import Settings from './components/Settings.svelte'
  import Ficha from './components/Ficha.svelte'
  import Grelha from './components/Grelha.svelte'
  import GrelhaEditor from './components/GrelhaEditor.svelte'
  import { iniciarSonda, carregarAcesso, marcarLigado } from './lib/grelha/store.svelte'
  import { lerLinkDeLigacao } from './lib/acesso'

  onMount(() => {
    lerLinkDeLigacao()
    marcarLigado()
    void carregarAcesso()
    iniciarSonda()
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
      fecharPaineis()
      return
    }
    if (!typing && e.key === '/') {
      e.preventDefault()
      ui.searchOpen = true
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app" class:rail={ui.sidebarCollapsed} class:with-panel={ui.edicao}>
  <Sidebar />
  <div class="main">
    <TopBar />
    <main>
      {#if ui.view === 'grelha'}<Grelha />
      {:else if ui.view === 'grafo'}<RelationGraph />
      {:else if ui.view === 'sessao'}<Sessao />
      {:else if ui.view === 'batalha'}<Batalha />
      {:else if ui.view === 'indice'}<Indice />
      {:else if ui.view === 'ficha'}<Ficha />
      {:else}<Settings />{/if}
    </main>
  </div>
  {#if ui.edicao}
    <aside class="drawer"><GrelhaEditor edicao={ui.edicao} /></aside>
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
