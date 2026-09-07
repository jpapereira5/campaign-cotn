<script lang="ts">
  import { onMount } from 'svelte'
  import { ui, loadRemote } from './lib/state.svelte'
  import Header from './components/Header.svelte'
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
  })

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') ui.selection = null
  }
</script>

<svelte:window onkeydown={onKeydown} />

<Header />
<div class="layout" class:with-panel={ui.selection}>
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
  {#if ui.selection}
    <aside><DetailPanel selection={ui.selection} /></aside>
  {/if}
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 1fr;
    height: calc(100vh - var(--header-h));
  }
  .layout.with-panel {
    grid-template-columns: 1fr 380px;
  }
  main {
    min-width: 0;
    overflow: auto;
  }
  aside {
    border-left: 1px solid var(--line);
    background: var(--bg-2);
    overflow: auto;
  }
  @media (max-width: 900px) {
    .layout.with-panel {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 45vh;
    }
    aside {
      border-left: 0;
      border-top: 1px solid var(--line);
    }
  }
</style>
