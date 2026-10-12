<script lang="ts">
  import { ui, world, setView, type View } from '../lib/state.svelte'
  import { camada } from '../lib/grelha/store.svelte'
  import Icone from './Icone.svelte'

  interface Item {
    id: View
    label: string
    icon: 'grelha' | 'grafo' | 'sessao' | 'indice'
    hint: string
  }
  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Planear',
      items: [
        { id: 'grelha', label: 'Grelha', icon: 'grelha', hint: 'Tudo o que está em aberto, sessão a sessão; o modo Plano mostra os arcos por capítulo' },
        { id: 'grafo', label: 'Relações', icon: 'grafo', hint: 'Quem se liga a quem' },
      ],
    },
    {
      title: 'Jogar',
      items: [{ id: 'sessao', label: 'Sessão', icon: 'sessao', hint: 'O plano da próxima sessão, os beats por jogar, notas rápidas e as sessões jogadas' }],
    },
    {
      title: 'Consultar',
      items: [{ id: 'indice', label: 'Índice', icon: 'indice', hint: 'Personagens, fações, locais, itens, segredos, beats, fios, jogadores e sessões' }],
    },
  ]

  let innerWidth = $state(1400)
  const collapsed = $derived(ui.sidebarCollapsed || innerWidth < 1000)
  const estadoCamada = $derived(camada.estado === 'erro' ? '✖' : camada.porGravar ? 'por gravar' : camada.estado === 'a-gravar' ? 'a gravar…' : camada.estado === 'a-ler' ? 'a ler…' : camada.fonte === 'repositorio' ? '✓' : camada.ligado ? '…' : 'local')

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
    <span class="logo" aria-hidden="true">G</span>
    {#if !collapsed}
      <div class="brand-text">
        <div class="title">{world.campanha.titulo}</div>
        <div class="muted tiny">a nossa campanha</div>
      </div>
    {/if}
    <button class="icon ghost collapse" onclick={toggleCollapsed} title={collapsed ? 'Expandir' : 'Encolher'}>{collapsed ? '»' : '«'}</button>
  </div>

  <button class="search-btn" onclick={() => (ui.searchOpen = true)} title="Pesquisar (Ctrl+K ou /)">
    <span class="ic"><Icone nome="pesquisa" /></span>{#if !collapsed}<span class="muted">Pesquisar…</span><kbd>/</kbd>{/if}
  </button>

  {#each groups as g (g.title)}
    <div class="group">
      {#if !collapsed}<div class="group-title">{g.title}</div>{/if}
      {#each g.items as it (it.id)}
        <button class="nav" class:active={ui.view === it.id} onclick={() => setView(it.id)} title={collapsed ? `${it.label} — ${it.hint}` : it.hint}>
          <span class="ic"><Icone nome={it.icon} /></span>{#if !collapsed}<span class="lbl">{it.label}</span>{/if}
        </button>
      {/each}
    </div>
  {/each}

  <div class="spacer"></div>

  <div class="group bottom">
    <button class="nav" class:active={ui.view === 'definicoes'} onclick={() => setView('definicoes')} title={camada.mensagem || 'Definições'}>
      <span class="ic"><Icone nome="definicoes" /></span>
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
    padding: 0.7rem 0.6rem;
    gap: 0.25rem;
    overflow: hidden auto;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.2rem 0.3rem 0.7rem;
    min-height: 44px;
  }
  .logo {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--accent-strong);
    color: var(--accent-ink);
    font-family: var(--font-cond);
    font-weight: 700;
    font-size: 17px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .brand-text {
    min-width: 0;
    flex: 1;
  }
  .title {
    font-family: var(--font-cond);
    font-weight: 700;
    font-size: 15px;
    line-height: 1.15;
    color: var(--text-strong);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .brand-text .tiny {
    font-family: var(--font-cond);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
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
    min-height: 40px;
    background: var(--bg-2);
    border-color: var(--line-2);
    border-radius: 999px;
    text-align: left;
    padding: 0.3rem 0.8rem;
    margin-bottom: 0.5rem;
  }
  .search-btn .muted {
    flex: 1;
  }
  .collapsed .search-btn {
    justify-content: center;
    padding: 0.3rem 0.2rem;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 0.6rem;
  }
  .group-title {
    font-family: var(--font-cond);
    font-weight: 700;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    padding: 0.4rem 0.6rem 0.25rem;
  }
  .nav {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    min-height: 40px;
    text-align: left;
    background: transparent;
    border-color: transparent;
    padding: 0.4rem 0.7rem;
    color: var(--text);
    border-radius: 999px;
    font-weight: 700;
    font-size: 13.5px;
    cursor: pointer;
  }
  .nav:hover {
    background: var(--bg-3);
    border-color: transparent;
  }
  .nav.active {
    background: var(--accent-strong);
    color: #ffffff;
    border-color: var(--accent-strong);
  }
  .collapsed .nav {
    justify-content: center;
    padding: 0.5rem 0;
  }
  .ic {
    width: 1.4em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: var(--muted);
  }
  .nav.active .ic,
  .nav:hover .ic {
    color: inherit;
  }
  .lbl {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .status {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
  }
  .nav.active .status {
    color: #bfd9df;
  }
  .status.erro {
    color: var(--danger);
  }
  .nav.active .status.erro {
    color: #ffb3a0;
  }
  .bottom {
    margin-bottom: 0;
  }
</style>
