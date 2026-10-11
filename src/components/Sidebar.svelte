<script lang="ts">
  import { ui, world, setView, type View } from '../lib/state.svelte'
  import { camada } from '../lib/grelha/store.svelte'
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
        { id: 'grelha', label: 'Grelha', icon: '▦', hint: 'Tudo o que está em aberto, sessão a sessão; o modo Plano mostra os arcos por capítulo' },
        { id: 'grafo', label: 'Relações', icon: '🕸️', hint: 'Quem se liga a quem' },
      ],
    },
    {
      title: 'Jogar',
      items: [{ id: 'sessao', label: 'Sessão', icon: '🎲', hint: 'O plano da próxima sessão, os beats por jogar, notas rápidas e as sessões jogadas' }],
    },
    {
      title: 'Consultar',
      items: [{ id: 'indice', label: 'Índice', icon: '📚', hint: 'Personagens, fações, locais, itens, segredos, beats, fios, jogadores e sessões' }],
    },
  ]

  let innerWidth = $state(1400)
  const collapsed = $derived(ui.sidebarCollapsed || innerWidth < 1000)
  const estadoCamada = $derived(camada.estado === 'erro' ? '✖' : camada.porGravar ? 'por gravar' : camada.estado === 'a-gravar' ? 'a gravar…' : camada.estado === 'a-ler' ? 'a ler…' : camada.fonte === 'repositorio' ? '✓' : getToken() ? '…' : 'local')

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
        <div class="title">{world.campanha.titulo}</div>
        <div class="muted tiny">a nossa campanha</div>
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
    <button class="nav" class:active={ui.view === 'definicoes'} onclick={() => setView('definicoes')} title={camada.mensagem || 'Definições'}>
      <span class="ic">⚙️</span>
      {#if !collapsed}
        <span class="lbl">Definições</span>
        <span class="status {camada.estado}">{estadoCamada}</span>
      {/if}
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
  .nav:hover,
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
  .collapsed .nav,
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
  .status {
    font-size: 0.75em;
    color: var(--muted);
  }
  .status.erro {
    color: var(--danger);
  }
  .status.ok {
    color: var(--ok);
  }
  .bottom {
    margin-bottom: 0;
  }
</style>
