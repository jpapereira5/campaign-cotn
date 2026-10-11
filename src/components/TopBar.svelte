<script lang="ts">
  // A barra superior segue o cabeçalho do mockup: a linha de contexto (kicker), o título da vista e a linha de ajuda.
  import { ui, world } from '../lib/state.svelte'

  const TITLES: Record<string, { title: string; help: string }> = {
    grelha: { title: 'Grelha de acompanhamento', help: 'Tudo o que está em aberto, sessão a sessão: uma linha por coisa que vale a pena acompanhar, as sessões jogadas e o que vem a seguir nas colunas. Clica numa célula para editar (a tua camada), numa linha para abrir a ficha. O modo Plano mostra os arcos por capítulo.' },
    grafo: { title: 'Relações', help: 'Quem se liga a quem, no fim do capítulo escolhido: as relações do cabeçalho de cada ficha e as que o registo das sessões criou (traço mais grosso). Um clique escolhe o nó, o segundo abre a ficha; «só vizinhos» isola a rede dessa personagem. Arrastar move (Shift fixa), roda faz zoom.' },
    sessao: { title: 'Sessão', help: 'A ferramenta para a mesa: o plano da próxima sessão tirado da Grelha, os beats do capítulo por jogar (✓ marca «jogado à mesa», que fica na tua camada até ao fecho), notas rápidas e as sessões do registo.' },
    indice: { title: 'Índice', help: 'Listas por pasta, com filtro por texto e «só este capítulo». Clica em qualquer coisa para abrir a ficha.' },
    definicoes: { title: 'Definições', help: 'O token do GitHub, o estado da tua camada e os atalhos.' },
    ficha: { title: 'Ficha', help: 'Uma página por coisa: o estado atual, a história (os acontecimentos em que entra), o plano (os beats à frente), as relações e as menções. Os ids no texto são ligações.' },
  }
  const meta = $derived(TITLES[ui.view] ?? { title: ui.view, help: '' })
  const mesa = $derived(world.estado.mesa)
  const campanha = $derived(world.campanha)
  const contexto = $derived(
    [mesa.ultima ? `sessão atual: S${mesa.ultima.n}, ${mesa.ultima.data}` : 'ainda sem sessões', `a preparar: S${mesa.proximaN}`, campanha.nomeCapitulo(campanha.capituloAtual)].join(' · '),
  )
</script>

<header class="topbar">
  <div class="left">
    <div class="kicker">{campanha.titulo} · Contos &amp; Escudos</div>
    <div class="row nowrap">
      <h1 class="title">{meta.title}</h1>
      {#if meta.help}
        <button class="icon ghost help-btn" class:active={ui.helpOpen} onclick={() => (ui.helpOpen = !ui.helpOpen)} title="Ajuda desta vista" aria-label="Ajuda desta vista">?</button>
      {/if}
    </div>
  </div>
  <p class="meta ctx">{contexto}</p>
</header>
{#if ui.helpOpen && meta.help}
  <div class="helpbar">
    <span>{meta.help}</span>
    <button class="icon ghost" onclick={() => (ui.helpOpen = false)} title="Fechar" aria-label="Fechar a ajuda">✕</button>
  </div>
{/if}

<style>
  .topbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem 2rem;
    min-height: var(--topbar-h);
    padding: 0.7rem 1.4rem 0.4rem;
    background: var(--bg);
    flex-wrap: wrap;
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .help-btn {
    width: 1.5em;
    height: 1.5em;
    border-radius: 50%;
    border: 1px solid var(--line-2);
    color: var(--muted);
    padding: 0;
    font-weight: 700;
    font-size: 0.85rem;
    line-height: 1;
  }
  .help-btn.active {
    background: var(--accent-strong);
    color: #fff;
    border-color: var(--accent-strong);
  }
  .ctx {
    text-align: right;
  }
  .helpbar {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin: 0 1.4rem 0.4rem;
    padding: 0.6rem 0.9rem;
    background: var(--bg-2);
    border: 1px solid var(--line-2);
    border-radius: var(--radius-s);
    color: var(--text);
    font-size: 0.92em;
  }
  .helpbar span {
    flex: 1;
  }
  @media (max-width: 900px) {
    .ctx {
      display: none;
    }
    .title {
      font-size: 20px;
    }
  }
</style>
