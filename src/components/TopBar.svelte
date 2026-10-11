<script lang="ts">
  import { ui } from '../lib/state.svelte'

  const TITLES: Record<string, { title: string; help: string }> = {
    grelha: { title: 'Grelha', help: 'Tudo o que está em aberto, sessão a sessão: uma linha por coisa que vale a pena acompanhar, as sessões jogadas e o que vem a seguir nas colunas. Clica numa célula para editar (a tua camada), numa linha para abrir a ficha. O modo Plano mostra os arcos por capítulo.' },
    grafo: { title: 'Relações', help: 'Quem se liga a quem, no fim do capítulo escolhido: as relações do cabeçalho de cada ficha e as que o registo das sessões criou (traço mais grosso). Um clique escolhe o nó, o segundo abre a ficha; «só vizinhos» isola a rede dessa personagem. Arrastar move (Shift fixa), roda faz zoom.' },
    sessao: { title: 'Sessão', help: 'A ferramenta para a mesa: o plano da próxima sessão tirado da Grelha, os beats do capítulo por jogar (✓ marca «jogado à mesa», que fica na tua camada até ao fecho), notas rápidas e as sessões do registo.' },
    indice: { title: 'Índice', help: 'Listas por pasta, com filtro por texto e «só este capítulo». Clica em qualquer coisa para abrir a ficha.' },
    definicoes: { title: 'Definições', help: 'O token do GitHub, o estado da tua camada e os atalhos.' },
    ficha: { title: 'Ficha', help: 'Uma página por coisa: o estado atual, a história (os acontecimentos em que entra), o plano (os beats à frente), as relações e as menções. Os ids no texto são ligações.' },
  }
  const meta = $derived(TITLES[ui.view] ?? { title: ui.view, help: '' })
</script>

<header class="topbar">
  <div class="left">
    <h1>{meta.title}</h1>
    {#if meta.help}
      <button class="icon ghost help-btn" class:active={ui.helpOpen} onclick={() => (ui.helpOpen = !ui.helpOpen)} title="Ajuda desta vista">?</button>
    {/if}
  </div>
</header>
{#if ui.helpOpen && meta.help}
  <div class="helpbar">
    <span>{meta.help}</span>
    <button class="icon ghost" onclick={() => (ui.helpOpen = false)} title="Fechar">✕</button>
  </div>
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: var(--topbar-h);
    padding: 0.4rem 1.25rem;
    border-bottom: 1px solid var(--line);
    background: var(--bg-2);
    flex-wrap: wrap;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  h1 {
    font-size: 1.05rem;
    margin: 0;
    white-space: nowrap;
  }
  .help-btn {
    width: 1.6em;
    height: 1.6em;
    border-radius: 50%;
    border: 1px solid var(--line);
    color: var(--muted);
    padding: 0;
    font-weight: 700;
  }
  .helpbar {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.55rem 1.25rem;
    background: var(--accent-soft);
    border-bottom: 1px solid var(--line);
    color: var(--text);
    font-size: 0.92em;
  }
  .helpbar span {
    flex: 1;
  }
</style>
