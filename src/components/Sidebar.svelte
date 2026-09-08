<script lang="ts">
  import { ui, world, store, setView, saveRemote, type View } from '../lib/state.svelte'
  import { getToken } from '../lib/github'

  interface Item {
    id: View
    label: string
    icon: string
    hint: string
  }
  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Planear',
      items: [
        { id: 'tempo', label: 'Linha temporal', icon: '⏳', hint: 'Beats por capítulo e por pista' },
        { id: 'grafo', label: 'Relações', icon: '🕸️', hint: 'Quem se liga a quem' },
        { id: 'frentes', label: 'Frentes', icon: '⏰', hint: 'O que cada facção faz se ninguém a travar' },
        { id: 'revelacoes', label: 'Revelações', icon: '🔎', hint: 'Regra das três pistas' },
      ],
    },
    {
      title: 'Jogar',
      items: [
        { id: 'sessao', label: 'Sessão', icon: '🎲', hint: 'O que vem a seguir, registo de sessões' },
        { id: 'pcs', label: 'PCs', icon: '🧝', hint: 'Ambições dos jogadores' },
      ],
    },
    {
      title: 'Consultar',
      items: [{ id: 'indice', label: 'Índice', icon: '📚', hint: 'Personagens, facções, locais, beats' }],
    },
  ]

  const errors = $derived(world.problems.filter((p) => p.level === 'error').length)
  const dirty = $derived(world.dirtyFiles.length)
  let innerWidth = $state(1400)
  const collapsed = $derived(ui.sidebarCollapsed || innerWidth < 1000)

  function toggleCollapsed() {
    ui.sidebarCollapsed = !ui.sidebarCollapsed
    try {
      localStorage.setItem('cc-sidebar', ui.sidebarCollapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }
</script>

<svelte:window bind:innerWidth />

<nav class="sidebar" class:collapsed>
  <div class="brand">
    <span class="logo">🕸️</span>
    {#if !collapsed}
      <div class="brand-text">
        <div class="title">{world.canon.campaign.title}</div>
        <div class="muted tiny">{ui.layerView === 'book' ? 'só o livro (leitura)' : 'a nossa campanha'}</div>
      </div>
    {/if}
    <button class="icon ghost collapse" onclick={toggleCollapsed} title={collapsed ? 'Expandir' : 'Encolher'}>{collapsed ? '»' : '«'}</button>
  </div>

  <button class="search-btn" onclick={() => (ui.searchOpen = true)} title="Pesquisar (Ctrl+K ou /)">
    <span>🔍</span>{#if !collapsed}<span class="muted">Pesquisar…</span><kbd>/</kbd>{/if}
  </button>

  {#each groups as g (g.title)}
    <div class="group">
      {#if !collapsed}<div class="group-title">{g.title}</div>{/if}
      {#each g.items as it (it.id)}
        <button class="nav" class:active={ui.view === it.id} onclick={() => setView(it.id)} title={collapsed ? `${it.label} — ${it.hint}` : it.hint}>
          <span class="ic">{it.icon}</span>{#if !collapsed}<span class="lbl">{it.label}</span>{/if}
        </button>
      {/each}
    </div>
  {/each}

  <div class="spacer"></div>

  <div class="group bottom">
    <label class="layer" class:on={ui.layerView === 'book'} title="Ver o livro tal como escrito, sem as nossas alterações (só leitura)">
      <input type="checkbox" checked={ui.layerView === 'book'} onchange={(e) => (ui.layerView = (e.target as HTMLInputElement).checked ? 'book' : 'campaign')} />
      <span class="ic">📖</span>{#if !collapsed}<span class="lbl">Ver só o livro</span>{/if}
    </label>
    {#if dirty}
      <button class="nav primary" onclick={() => saveRemote()} disabled={store.sync.status === 'saving'} title={getToken() ? `Gravar ${dirty} ficheiro(s) no GitHub` : 'Sem token: ver Definições'}>
        <span class="ic">💾</span>{#if !collapsed}<span class="lbl">Guardar ({dirty})</span>{/if}
      </button>
    {/if}
    <button class="nav" class:active={ui.view === 'definicoes'} onclick={() => setView('definicoes')} title={store.sync.message || 'Definições'}>
      <span class="ic">⚙️</span>
      {#if !collapsed}
        <span class="lbl">Definições</span>
        <span class="status {store.sync.status}">
          {#if store.sync.status === 'loading'}a ler…{:else if store.sync.status === 'saving'}a gravar…{:else if store.sync.status === 'error'}✖{:else if store.sync.status === 'ok'}✓{:else}local{/if}
        </span>
      {/if}
      {#if errors}<span class="badge" title="{errors} erro(s) nos dados">{errors}</span>{/if}
    </button>
  </div>
</nav>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-1);
    border-right: 1px solid var(--line);
    padding: 0.6rem 0.55rem;
    gap: 0.25rem;
    overflow: hidden auto;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.3rem 0.6rem;
    min-height: 44px;
  }
  .logo {
    font-size: 1.3rem;
  }
  .brand-text {
    min-width: 0;
    flex: 1;
  }
  .title {
    font-weight: 700;
    font-size: 0.92rem;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .collapse {
    color: var(--muted);
  }
  .collapsed .brand {
    flex-direction: column;
    gap: 0.2rem;
  }
  .search-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    background: var(--bg);
    text-align: left;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.4rem;
  }
  .search-btn .muted {
    flex: 1;
  }
  .collapsed .search-btn {
    justify-content: center;
    padding: 0.4rem 0.2rem;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 0.5rem;
  }
  .group-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted-2);
    padding: 0.4rem 0.6rem 0.2rem;
    font-weight: 600;
  }
  .nav,
  .layer {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border-color: transparent;
    padding: 0.42rem 0.6rem;
    color: var(--text);
    border-radius: var(--radius-s);
    cursor: pointer;
    position: relative;
  }
  .nav:hover,
  .layer:hover {
    background: var(--bg-3);
    border-color: transparent;
  }
  .nav.active {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: transparent;
  }
  .nav.active::before {
    content: '';
    position: absolute;
    left: -0.55rem;
    top: 20%;
    height: 60%;
    width: 3px;
    border-radius: 2px;
    background: var(--accent);
  }
  .nav.primary {
    background: var(--accent);
    color: #1a1206;
  }
  .nav.primary:hover {
    background: #e6b556;
  }
  .collapsed .nav,
  .collapsed .layer {
    justify-content: center;
    padding: 0.5rem 0;
  }
  .ic {
    width: 1.4em;
    text-align: center;
    flex: none;
  }
  .lbl {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .layer {
    border: 1px solid transparent;
    user-select: none;
  }
  .layer input {
    display: none;
  }
  .layer.on {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .status {
    font-size: 0.75em;
    color: var(--muted);
  }
  .status.error {
    color: var(--danger);
  }
  .status.ok {
    color: var(--ok);
  }
  .badge {
    position: absolute;
    right: 0.5rem;
    top: 0.3rem;
    background: var(--danger);
    color: #fff;
    font-size: 0.7em;
    border-radius: 999px;
    padding: 0 0.4em;
    line-height: 1.5;
  }
  .collapsed .badge {
    right: 0.2rem;
    top: 0.1rem;
  }
  .bottom {
    margin-bottom: 0;
  }
</style>
