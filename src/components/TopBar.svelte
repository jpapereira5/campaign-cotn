<script lang="ts">
  import { ui, world, chapterShort, setChapter } from '../lib/state.svelte'

  const TITLES: Record<string, { title: string; help: string }> = {
    tempo: {
      title: 'Linha temporal',
      help: 'Uma pista por arco (prólogo, Jóia, lore, ruidium, rivais, facções, ambições dos PCs); cada cartão é um beat. Uma linha vertical liga o mesmo beat nas várias pistas em que entra. Clique abre o detalhe; duplo clique marca como jogado.',
    },
    grafo: {
      title: 'Relações',
      help: 'Quem se liga a quem, no momento escolhido. Por omissão mostra só quem entra no capítulo actual; muda o âmbito para "até agora" ou "tudo". Clica num nó para ver o detalhe; "só vizinhos" isola a rede dessa personagem. Arrastar move (Shift fixa), roda faz zoom.',
    },
    frentes: {
      title: 'Frentes',
      help: 'Cada facção tem portentos: o que faz se ninguém a travar, capítulo a capítulo. Marca os que já aconteceram; o relógio mostra quanto a frente avançou.',
    },
    revelacoes: {
      title: 'Revelações',
      help: 'Regra das três pistas: cada conclusão necessária deve ter pelo menos 3 pistas em cenas diferentes. A barra mostra quantas pistas os jogadores já jogaram. Marca a revelação quando a mesa a tiver percebido.',
    },
    sessao: {
      title: 'Sessão',
      help: 'Painel para preparar e registar sessões: o próximo beat pronto em cada pista, as sessões jogadas e as flags (factos que a mesa estabeleceu).',
    },
    pcs: {
      title: 'PCs e ambições',
      help: 'Cada ambição deve tocar pelo menos um NPC com poder de a satisfazer ou negar, um arco e, idealmente, um beat por capítulo. A tabela mostra os capítulos sem cena pessoal.',
    },
    indice: { title: 'Índice', help: 'Listas completas por tipo. ✚ marca o que acrescentámos ao livro, ▲ o que alterámos.' },
    definicoes: { title: 'Definições', help: 'Sincronização com o GitHub, exportar/importar e problemas nos dados.' },
  }
  const meta = $derived(TITLES[ui.view] ?? { title: ui.view, help: '' })
  const chapters = $derived(world.canon.campaign.chapters)
  const current = $derived(chapters.find((c) => c.id === ui.chapter))
  const tableChapter = $derived(world.play.currentChapter)
  const showCursor = $derived(ui.view !== 'definicoes' && ui.view !== 'pcs')
  const readOnly = $derived(world.readOnly)
</script>

<header class="topbar">
  <div class="left">
    <h1>{meta.title}</h1>
    {#if readOnly}<span class="tag book" title="Estás a ver o livro sem as nossas alterações; nada é editável">📖 só o livro</span>{/if}
    {#if meta.help}
      <button class="icon ghost help-btn" class:active={ui.helpOpen} onclick={() => (ui.helpOpen = !ui.helpOpen)} title="Ajuda desta vista">?</button>
    {/if}
  </div>
  {#if showCursor}
    <div class="cursor" title="Momento da campanha em que estás a olhar: condiciona a linha temporal, as relações activas e os estados das personagens">
      <span class="muted small lbl">Capítulo</span>
      <div class="chapters">
        {#each chapters as ch (ch.id)}
          <button
            class="chp"
            class:active={ui.cursorMode === 'chapter' && ui.chapter === ch.id}
            class:table={tableChapter === ch.id}
            onclick={() => setChapter(ch.id)}
            title="{ch.name} · níveis {ch.levels}{tableChapter === ch.id ? ' · a mesa está aqui' : ''}"
          >
            {chapterShort(ch.id)}
          </button>
        {/each}
        <button class="chp played" class:active={ui.cursorMode === 'played'} onclick={() => (ui.cursorMode = 'played')} title="Só o que já foi jogado (beats marcados na Sessão)">
          ✓ jogado
        </button>
      </div>
      <span class="current small">
        {#if ui.cursorMode === 'played'}até ao último beat jogado <span class="muted">({world.play.playedBeats.length})</span>{:else if current}{current.name} <span class="muted">· níveis {current.levels}</span>{/if}
      </span>
    </div>
  {/if}
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
  .cursor {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-left: auto;
  }
  .chapters {
    display: inline-flex;
    gap: 2px;
    background: var(--bg-1);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px;
  }
  .chp {
    border: 0;
    background: transparent;
    color: var(--muted);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    min-width: 2.1em;
    position: relative;
    font-variant-numeric: tabular-nums;
  }
  .chp:hover {
    background: var(--bg-3);
    color: var(--text);
  }
  .chp.active {
    background: var(--accent);
    color: #1a1206;
    font-weight: 600;
  }
  .chp.table::after {
    content: '';
    position: absolute;
    bottom: 1px;
    left: 50%;
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--ok);
  }
  .chp.played {
    border-left: 1px solid var(--line);
    border-radius: 0 999px 999px 0;
    margin-left: 2px;
    padding-left: 0.7rem;
  }
  .chp.played.active {
    background: var(--ok);
  }
  .current {
    white-space: nowrap;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
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
  @media (max-width: 900px) {
    .current {
      display: none;
    }
    .lbl {
      display: none;
    }
  }
</style>
