<script lang="ts">
  // A Grelha (docs/grelha.md, secção 11): uma linha por coisa, as sessões jogadas e o que vem a seguir nas colunas.
  // Fase C: só leitura. A camada do DM e a revisão entram na fase D.
  import { world, abrirFicha, abrirEdicao, ui } from '../lib/state.svelte'
  import { camada, alterar, apagar, gravarPendentes } from '../lib/grelha/store.svelte'
  import { getToken } from '../lib/github'
  import { GRUPOS, ROTULO_ESTATUTO, ROTULO_TIPO, contagens, linhaVisivel, type Estatuto, type Item, type Linha } from '../lib/grelha/modelo'

  const g = $derived(world.grelha)
  let grupo = $state('todos')
  let pc = $state('todos')
  let soPendentes = $state(false)
  let mostrarEcos = $state(true)
  let modo = $state<'normal' | 'plano'>('normal')

  const filtro = $derived({ grupo, pc, soPendentes })
  const visiveis = $derived(g.linhas.filter((l) => linhaVisivel(l, filtro)))
  const proximaChave = $derived(g.colunas.find((c) => c.tipo === 'proxima')?.chave ?? '')
  const notasAbertas = $derived.by(() => {
    const ids = new Set(visiveis.map((l) => l.id))
    const respondidas = new Set(camada.dm.filter((e) => e.kind === 'resposta' && !e.deleted).map((e) => String(e.note)))
    return camada.revisao.notes.filter((n) => n.status !== 'fechada' && n.kind !== 'ideia' && !respondidas.has(n.id) && (!n.target?.row || ids.has(n.target.row))).length
  })
  const capituloAtualCol = $derived(g.colunas.find((c) => c.tipo === 'resto')?.chave ?? '')
  const editavel = $derived(ui.view === 'grelha')
  function editarCelula(l: Linha, chave: string) {
    if (l.calculada) return
    abrirEdicao({ modo: 'celula', linha: l.id, col: chave })
  }
  const totais = $derived(contagens(visiveis, proximaChave, notasAbertas))
  const contaGrupo = (id: string) => g.linhas.filter((l) => linhaVisivel(l, { grupo: id, pc, soPendentes })).length
  const contaPc = (id: string) => g.linhas.filter((l) => linhaVisivel(l, { grupo, pc: id, soPendentes })).length
  const viewLabel = $derived(
    [grupo === 'todos' ? 'todas as linhas' : GRUPOS.find((x) => x.id === grupo)?.label, pc === 'todos' ? null : g.pcs.find((x) => x.id === pc)?.curto, soPendentes ? 'só com pendentes' : null].filter(Boolean).join(' · '),
  )
  const porGrupo = $derived(GRUPOS.map((gr) => ({ ...gr, linhas: visiveis.filter((l) => l.grupo === gr.id) })).filter((gr) => gr.linhas.length))
  const ESTATUTOS: Estatuto[] = ['aberto', 'esquecido', 'planeado', 'falta', 'pago', 'pista', 'fechado', 'registo']
  const ATT: Record<string, string> = { amigavel: 'amigável', neutro: 'neutro', desconfiado: 'desconfiado', hostil: 'hostil', 'por-conhecer': 'por conhecer', morto: 'morto' }
  const TAG: Record<string, string> = { 'so-dm': 'só DM', ultima: 'última oportunidade', trunfo: 'trunfo' }
  const cols = $derived(`96px 252px ${g.colunas.map((c) => (c.tipo === 'capitulo' ? '148px' : c.tipo === 'proxima' ? '216px' : c.tipo === 'resto' ? '196px' : '208px')).join(' ')}`)
  const ecosVisiveis = (itens: Item[]) => (mostrarEcos ? itens.slice(0, 2) : [])
  const nome = (id: string) => world.indice.nome(id)
  function abrir(id: string) {
    if (id.startsWith('sessao:')) return
    abrirFicha(id)
  }
  const sessaoDaColuna = (chave: string) => g.colunas.find((c) => c.chave === chave)?.sessao?.id
  const linhaPcs = (l: Linha) => (l.pcs.includes('*') ? [] : [...new Set([...l.pcs, ...l.pcsTocados])])
  const corPc = (id: string) => g.pcs.find((p) => p.id === id)?.cor ?? '#8A96A0'
</script>

<div class="grelha-page">
  <div class="topo">
    <div class="stats">
      <div class="view-label muted small">Contagens: {viewLabel}</div>
      <div class="tiles">
        <div class="tile"><b>{totais.abertos}</b><span>Abertos</span></div>
        <div class="tile alarme"><b>{totais.esquecidos}</b><span>Esquecidos</span></div>
        <div class="tile plan"><b>{totais.planeados}</b><span>Planeado para a S{g.proximaN}</span></div>
        <div class="tile"><b>{totais.faltas}</b><span>Falta preparar</span></div>
        <div class="tile"><b>{totais.porResponder}</b><span>Por responder</span></div>
      </div>
    </div>
    <div class="filtros">
      <div class="chips">
        <button class="chip" class:on={grupo === 'todos'} onclick={() => (grupo = 'todos')}>Todos <small>{contaGrupo('todos')}</small></button>
        {#each GRUPOS as gr (gr.id)}<button class="chip" class:on={grupo === gr.id} onclick={() => (grupo = gr.id)}>{gr.label} <small>{contaGrupo(gr.id)}</small></button>{/each}
        <span class="sep"></span>
        <button class="chip" class:on={soPendentes} onclick={() => (soPendentes = !soPendentes)}>Só com pendentes</button>
        <button class="chip" class:on={mostrarEcos} onclick={() => (mostrarEcos = !mostrarEcos)}>Ecos</button>
        <span class="sep"></span>
        <button class="chip" class:on={modo === 'plano'} onclick={() => (modo = modo === 'plano' ? 'normal' : 'plano')} title="Os arcos nas linhas e os beats por capítulo nas células">Plano</button>
        <span class="sep"></span>
        <button class="chip" onclick={() => abrirEdicao({ modo: 'nota' })} title="Registar já alguma coisa sem saber onde vai">+ Nota rápida</button>
        <button class="chip" onclick={() => abrirEdicao({ modo: 'nova-linha' })} title="Criar uma coisa nova para acompanhar">+ Nova linha</button>
        <button class="chip" onclick={() => abrirEdicao({ modo: 'acompanhar' })} title="Pôr na Grelha algo que já existe no cânone">+ Acompanhar</button>
      </div>
      <div class="chips">
        <button class="chip" class:on={pc === 'todos'} onclick={() => (pc = 'todos')}>Todos os PCs <small>{contaPc('todos')}</small></button>
        {#each g.pcs as p (p.id)}<button class="chip" class:on={pc === p.id} onclick={() => (pc = p.id)}><span class="dot" style:background={p.cor}></span>{p.curto} <small>{contaPc(p.id)}</small></button>{/each}
      </div>
      <div class="legenda small muted">
        {#each ESTATUTOS as e (e)}<span class="leg"><span class="mk mk-{e}"></span>{ROTULO_ESTATUTO[e]}</span>{/each}
        <span class="leg"><span class="eco-mk">↳</span>eco de outra linha</span>
        <span class="leg"><span class="ideia-mk"></span>ideia, por aceitar</span>
      </div>
    </div>
  </div>

  <div class="estado small">
    <span class="muted">{camada.fonte === 'repositorio' ? `Camada do DM lida do repositório${camada.ultimaLeitura ? ` às ${camada.ultimaLeitura}` : ''}; verifica de 30 em 30 s.` : getToken() ? 'A ler a camada do DM do repositório…' : 'Sem token: a camada do DM vem do build e o que editares fica só neste browser (Definições).'}</span>
    {#if camada.porGravar}<span class="err">Por gravar.</span> <button class="chip" onclick={() => gravarPendentes()}>Tentar de novo</button>{/if}
    {#if camada.estado === 'erro'}<span class="err">{camada.mensagem}</span>{/if}
  </div>
  {#if g.planosPassados.length || g.notasSoltas.length}
    <div class="entrada small">
      {#each g.planosPassados as p (p.entrada.id)}
        <div class="row nowrap">
          <span class="tag">plano que ficou para trás</span>
          <span><b>{p.linha.nome}</b> · {p.entrada.col}: {p.entrada.text}</span>
          <button class="chip" onclick={() => alterar(p.entrada.id, { col: `s${g.proximaN}` }, `grelha: plano ${p.entrada.id} passa para a S${g.proximaN}`)}>Passa para a S{g.proximaN}</button>
          {#if capituloAtualCol}<button class="chip" onclick={() => alterar(p.entrada.id, { col: capituloAtualCol }, `grelha: plano ${p.entrada.id} fica para o capítulo`)}>Fica para o capítulo</button>{/if}
          <button class="chip" onclick={() => apagar(p.entrada.id, `grelha: plano ${p.entrada.id} cai`)}>Cai</button>
        </div>
      {/each}
      {#each g.notasSoltas as n (n.id)}
        <div class="row nowrap"><span class="tag">nota rápida</span><span>{n.text}</span><span class="muted">(o fecho decide onde entra)</span><button class="chip" onclick={() => apagar(n.id, `grelha: apagar nota ${n.id}`)}>Apagar</button></div>
      {/each}
    </div>
  {/if}

  {#if modo === 'plano'}
    <div class="sheet" style:--cols={`96px 252px repeat(${g.plano.capitulos.length}, 180px)`}>
      <div class="hrow h2 so">
        <div class="h corner tipo">Arco</div>
        <div class="h corner nome">Nome</div>
        {#each g.plano.capitulos as c (c.id)}<div class="h ses" class:cur={c.id === g.capituloAtual}><b>{c.curto}</b><small>{c.nome}</small></div>{/each}
      </div>
      {#each g.plano.arcos as a (a.id)}
        <div class="row">
          <div class="tipo c" style:border-left-color={a.cor}><span class="tp">Arco</span></div>
          <div class="nome c"><button class="nm" onclick={() => abrir(a.id)}>{a.nome}</button></div>
          {#each g.plano.capitulos as c (c.id)}
            <div class="cell" class:col-cur={c.id === g.capituloAtual}>
              {#each a.porCapitulo[c.id] ?? [] as b (b.id)}
                <button class="beat {b.estado}" onclick={() => abrir(b.id)} title={b.estado}>{b.estado === 'jogado' ? '✓ ' : b.estado === 'em-curso' ? '… ' : b.estado === 'proposta' ? '? ' : ''}{b.titulo}</button>
              {/each}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else}
    <div class="sheet" style:--cols={cols}>
      <div class="hrow h1">
        <div class="h corner tipo"></div>
        <div class="h corner nome"></div>
        {#each g.arcos as a, i_ (i_)}<div class="h arc" class:arc-cur={a.atual} class:arc-fut={!a.atual} style:grid-column={`span ${a.span}`}>{a.label}</div>{/each}
      </div>
      <div class="hrow h2">
        <div class="h corner tipo">Tipo</div>
        <div class="h corner nome">Linha</div>
        {#each g.colunas as c (c.chave)}
          <div class="h ses {c.tipo}" class:cur={c.tipo === 'atual'}>
            {#if c.sessao}<button class="nm" onclick={() => abrir(c.sessao!.id)}><b>{c.label}</b></button>{:else}<b>{c.label}</b>{/if}
            <small>{c.sub}</small>
          </div>
        {/each}
      </div>
      {#each porGrupo as gr (gr.id)}
        <div class="band" style:grid-column={`1 / span ${g.colunas.length + 2}`}>{gr.label}</div>
        {#each gr.linhas as l (l.id)}
          <div class="row" class:calc={l.calculada}>
            <div class="tipo c"><span class="tp">{ROTULO_TIPO[l.tipo]}</span></div>
            <div class="nome c">
              <div class="row1">
                {#if l.calculada}<span class="nm static">{l.nome}</span>{:else}<button class="nm" onclick={() => abrir(l.id)} title="Abrir a ficha">{l.nome}</button>{/if}
                {#each linhaPcs(l) as p (p)}<span class="pdot" style:background={corPc(p)} title={nome(p)}></span>{/each}
                {#if !l.calculada && editavel}<button class="edit" onclick={() => abrirEdicao({ modo: 'cabecalho', linha: l.id })} title="Editar o cabeçalho (uma decisão tua sobre o mundo)">✎</button>{/if}
                {#if l.porRever}<span class="rever" title="há edições tuas por rever"></span>{/if}
              </div>
              {#if l.legenda}<div class="sub muted small">{l.legenda}</div>{/if}
              <div class="pills">
                {#if l.atitude}<span class="pill att-{l.atitude}">{ATT[l.atitude] ?? l.atitude}</span>{/if}
                {#each l.marcas as m (m)}<span class="pill">{m}</span>{/each}
                {#each l.etiquetas as m (m)}<span class="pill warnp">{m}</span>{/each}
                {#if l.notas}<span class="pill notap" title="notas de revisão por responder">? {l.notas}</span>{/if}
              </div>
              {#if l.tipo !== 'pc' && (l.quer || l.teme)}<div class="qm small muted">{#if l.quer}<span><b>Quer</b> {l.quer}</span>{/if}{#if l.teme}<span><b>Teme</b> {l.teme}</span>{/if}</div>{/if}
              {#if l.tipo === 'revelacao'}<div class="qm small muted"><span>{l.pistas ?? 0} pista{l.pistas === 1 ? '' : 's'}{l.sabe ? ` · sabe: ${l.sabe}` : ''}</span></div>{/if}
            </div>
            {#each g.colunas as c (c.chave)}
              {@const cel = l.celulas[c.chave]}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div role="button" tabindex="-1" class="cell {cel.fundo ? 'st-' + cel.fundo : ''}" class:col-cur={c.tipo === 'atual'} class:col-fut={c.tipo === 'capitulo'} class:clicavel={!l.calculada && editavel} onclick={() => editarCelula(l, c.chave)} title={l.calculada ? undefined : 'Editar esta célula'}>
                {#each cel.itens as it, i_ (i_)}
                  {#if it.tipo === 'ideia'}
                    <div class="it ideia" title="ideia da revisão: abre a célula para aceitar ou rejeitar"><span class="tx">{it.texto}</span>{#each it.tags ?? [] as t (t)}<span class="tag">{TAG[t] ?? t}</span>{/each}</div>
                  {:else if it.tipo === 'nota'}
                    <div class="it notadm"><span class="tx">{it.texto}</span><span class="tag">nota rápida</span>{#if it.porRever}<span class="rever" title="por rever"></span>{/if}</div>
                  {:else if it.tipo === 'plano-canone'}
                    <div class="it canone"><span class="tx">{#if it.refs?.length}{#each it.refs as r, j_ (j_)}<button class="lk" onclick={(e) => { e.stopPropagation(); abrir(r) }}>{nome(r)}</button>{j_ < it.refs.length - 1 ? ' · ' : ''}{/each}{:else}{it.texto}{/if}</span></div>
                  {:else}
                    <div class="it" class:falta={it.tipo === 'falta'} class:dmit={!!it.dm}>
                      {#if it.estatuto && it.estatuto !== 'registo'}<span class="mk mk-{it.estatuto}" title={ROTULO_ESTATUTO[it.estatuto] + (it.arquivado ? ' (arquivado)' : '')}></span>{/if}
                      <span class="tx" title={it.original ? `original: ${it.original}` : undefined}>{it.texto}</span>
                      {#if it.origemLabel}<span class="orig" title="nasce de">{it.origemLabel}</span>{/if}
                      {#if it.planeadoEm}<span class="orig plan" title="um plano teu responde a isto">{it.planeadoEm}</span>{/if}
                      {#each it.tags ?? [] as t (t)}<span class="tag tag-{t}">{TAG[t] ?? t}</span>{/each}
                      {#if it.arquivado}<span class="tag">arquivado</span>{/if}
                      {#if it.dm}<span class="dmmark" title="edição tua ({it.dm.kind})">✎</span>{/if}
                      {#if it.porRever}<span class="rever" title="por rever"></span>{/if}
                    </div>
                  {/if}
                {/each}
                {#each ecosVisiveis(cel.ecos) as eco, i_ (i_)}
                  <button class="eco" onclick={(e) => { e.stopPropagation(); if (eco.dona) { const d = g.linhas.find((x) => x.id === eco.dona); if (d && editavel) editarCelula(d, c.chave); else if (eco.dona) abrir(eco.dona) } }} title="eco: a célula dona está em {eco.dona ? nome(eco.dona) : '?'}">↳ <b>{eco.dona ? nome(eco.dona) : ''}</b>: {eco.texto}</button>
                {/each}
                {#if mostrarEcos && cel.ecos.length > 2}<span class="muted small">+{cel.ecos.length - 2}</span>{/if}
              </div>
            {/each}
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .grelha-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .topo {
    padding: 0.7rem 1rem 0.5rem;
    border-bottom: 1px solid var(--line);
    background: var(--bg-1);
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.4rem;
    align-items: flex-start;
  }
  .tiles {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .tile {
    background: var(--bg-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    padding: 0.3rem 0.6rem;
    min-width: 92px;
    display: flex;
    flex-direction: column;
  }
  .tile b {
    font-size: 1.25rem;
    line-height: 1.2;
  }
  .tile span {
    font-size: 0.72rem;
    color: var(--muted);
  }
  .tile.alarme b {
    color: #e0603a;
  }
  .tile.plan b {
    color: #7aa0ff;
  }
  .filtros {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    min-width: 280px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }
  .chips .chip {
    cursor: pointer;
    gap: 0.3rem;
  }
  .chips .chip.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--text);
  }
  .chips .chip small {
    color: var(--muted);
  }
  .chips .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .sep {
    width: 1px;
    height: 18px;
    background: var(--line-2);
    margin: 0 0.3rem;
  }
  .legenda {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.9rem;
  }
  .leg {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .sheet {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    grid-template-columns: var(--cols);
    grid-auto-rows: max-content;
    align-content: start;
    font-size: 0.82rem;
  }
  .hrow,
  .row {
    display: contents;
  }
  .h {
    position: sticky;
    top: 0;
    z-index: 3;
    background: var(--bg-2);
    border-bottom: 1px solid var(--line);
    border-right: 1px solid var(--line);
    padding: 0.3rem 0.5rem;
  }
  .h1 .h {
    top: 0;
    height: 28px;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    display: flex;
    align-items: center;
  }
  .h2.so .h {
    top: 0;
  }
  .h2 .h {
    top: 28px;
    height: 46px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .h.arc-cur {
    color: var(--accent);
    background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--bg-2);
  }
  .h.ses small {
    color: var(--muted);
    font-size: 0.7rem;
  }
  .h.ses.cur {
    background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--bg-2);
    box-shadow: inset 0 -2px 0 var(--accent);
  }
  .h.ses.proxima {
    background: linear-gradient(rgba(43, 98, 217, 0.12), rgba(43, 98, 217, 0.12)), var(--bg-2);
  }
  .h.corner {
    z-index: 5;
    left: 0;
  }
  .h.corner.nome {
    left: 96px;
  }
  .band {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-3);
    color: var(--muted);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.25rem 0.6rem;
    border-bottom: 1px solid var(--line);
  }
  .c,
  .cell {
    border-bottom: 1px solid var(--line);
    border-right: 1px solid var(--line);
    padding: 0.35rem 0.45rem;
    min-height: 44px;
  }
  .tipo {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-1);
    border-left: 3px solid transparent;
  }
  .nome {
    position: sticky;
    left: 96px;
    z-index: 2;
    background: var(--bg-1);
    box-shadow: 2px 0 0 var(--line);
  }
  .tp {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  .row1 {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .nm {
    background: none;
    border: 0;
    padding: 0;
    color: var(--text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
  }
  .nm:hover {
    color: var(--accent);
  }
  .nm.static {
    cursor: default;
  }
  .pdot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    margin-top: 0.15rem;
  }
  .pill {
    font-size: 0.66rem;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: var(--bg-3);
    border: 1px solid var(--line-2);
    color: var(--muted);
  }
  .pill.att-hostil {
    color: #ff8d7a;
    border-color: #7a3b31;
  }
  .pill.att-amigavel {
    color: #8fd99a;
    border-color: #3f6b44;
  }
  .pill.att-desconfiado {
    color: #e8c177;
    border-color: #6b5520;
  }
  .pill.att-morto {
    text-decoration: line-through;
  }
  .pill.warnp {
    color: var(--warn);
  }
  .pill.notap {
    color: #c9a5ff;
    border-color: #5a3f8a;
  }
  .qm {
    margin-top: 0.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }
  .qm b {
    color: var(--muted-2);
    font-weight: 600;
    margin-right: 0.25rem;
  }
  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .cell.col-cur {
    box-shadow: inset 2px 0 0 var(--accent-2), inset -2px 0 0 var(--accent-2);
  }
  .cell.col-fut {
    background: rgba(255, 255, 255, 0.015);
  }
  .st-aberto {
    background: rgba(217, 130, 8, 0.13);
  }
  .st-esquecido {
    background: rgba(196, 50, 10, 0.18);
    box-shadow: inset 0 0 0 1px rgba(196, 50, 10, 0.45);
  }
  .st-planeado {
    background: rgba(43, 98, 217, 0.14);
  }
  .st-pago {
    background: rgba(22, 131, 78, 0.13);
  }
  .st-pista {
    background: rgba(123, 77, 194, 0.14);
  }
  .st-fechado {
    background: rgba(122, 135, 144, 0.1);
    color: var(--muted);
  }
  .st-falta {
    outline: 1.5px dashed var(--muted-2);
    outline-offset: -5px;
  }
  .it {
    display: flex;
    gap: 0.35rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .it .tx {
    flex: 1 1 100px;
    min-width: 0;
  }
  .it.falta .tx {
    font-style: italic;
    color: var(--muted);
  }
  .it.canone .tx {
    color: var(--muted);
    font-size: 0.76rem;
  }
  .it.ideia {
    border: 1.5px dashed #7a8790;
    border-radius: 6px;
    padding: 0.2rem 0.35rem;
    color: var(--muted);
  }
  .lk {
    background: none;
    border: 0;
    padding: 0;
    color: var(--muted);
    font: inherit;
    cursor: pointer;
    text-decoration: underline dotted;
  }
  .lk:hover {
    color: var(--accent);
  }
  .orig {
    font-size: 0.7rem;
    color: var(--muted);
    white-space: nowrap;
  }
  .tag {
    font-size: 0.64rem;
    padding: 0 0.35rem;
    border-radius: 4px;
    background: var(--bg-4);
    color: var(--muted);
  }
  .tag-so-dm {
    color: #c9a5ff;
  }
  .tag-ultima {
    color: #ff8d7a;
  }
  .tag-trunfo {
    color: var(--warn);
  }
  .eco {
    background: none;
    border: 0;
    padding: 0;
    text-align: left;
    font: inherit;
    font-size: 0.76rem;
    color: var(--muted-2);
    cursor: pointer;
  }
  .eco b {
    font-weight: 600;
    color: var(--muted);
  }
  .eco:hover {
    color: var(--accent);
  }
  .eco-mk {
    color: var(--muted-2);
  }
  .ideia-mk {
    width: 12px;
    height: 10px;
    border: 1.5px dashed #7a8790;
    border-radius: 3px;
    display: inline-block;
  }
  /* marcadores: as formas distinguem os estados mesmo sem cor */
  .mk {
    display: inline-block;
    width: 11px;
    height: 11px;
    flex: none;
    margin-top: 3px;
  }
  .mk-aberto {
    border-radius: 50%;
    background: #D98208;
  }
  .mk-esquecido {
    position: relative;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #C4320A;
  }
  .mk-esquecido::after {
    content: '!';
    position: absolute;
    left: 0;
    top: 0;
    width: 13px;
    font: 700 10px/13px ui-monospace, monospace;
    color: #fff;
    text-align: center;
  }
  .mk-planeado {
    width: 9px;
    height: 9px;
    margin-left: 1px;
    background: #2B62D9;
    transform: rotate(45deg);
  }
  .mk-pago {
    width: 11px;
    height: 6px;
    border-left: 2.5px solid #16834E;
    border-bottom: 2.5px solid #16834E;
    transform: rotate(-45deg);
    margin-top: 4px;
  }
  .mk-pista {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    background: #7B4DC2;
  }
  .mk-fechado {
    width: 11px;
    height: 3px;
    border-radius: 2px;
    background: #7A8790;
    margin-top: 7px;
  }
  .mk-falta {
    border: 1.5px dashed #6F7C86;
    border-radius: 3px;
  }
  .mk-registo {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--muted-2);
    margin-top: 6px;
  }
  .beat {
    display: block;
    width: 100%;
    text-align: left;
    background: var(--bg-3);
    border: 1px solid var(--line-2);
    border-radius: 6px;
    padding: 0.15rem 0.4rem;
    margin-bottom: 0.2rem;
    color: var(--text);
    font: inherit;
    font-size: 0.74rem;
    cursor: pointer;
  }
  .beat.jogado {
    opacity: 0.6;
    text-decoration: line-through;
  }
  .beat.em-curso {
    border-color: var(--accent);
  }
  .beat.proposta {
    border-style: dashed;
    color: var(--muted);
  }
  .beat:hover {
    border-color: var(--accent);
  }
  .row.calc .c {
    background: var(--bg-2);
  }
  .estado {
    padding: 0.3rem 1rem;
    border-bottom: 1px solid var(--line);
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .entrada {
    padding: 0.4rem 1rem;
    border-bottom: 1px solid var(--line);
    background: rgba(43, 98, 217, 0.08);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .entrada .chip {
    cursor: pointer;
  }
  .err {
    color: var(--danger);
  }
  .cell.clicavel {
    cursor: pointer;
  }
  .cell.clicavel:hover {
    outline: 1px solid var(--accent-2);
    outline-offset: -1px;
  }
  .edit {
    background: none;
    border: 0;
    padding: 0 0.2rem;
    color: var(--muted-2);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .edit:hover {
    color: var(--accent);
  }
  .rever {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c9a5ff;
    display: inline-block;
    margin-left: 0.2rem;
  }
  .dmmark {
    color: var(--accent);
    font-size: 0.8rem;
  }
  .it.dmit .tx {
    color: var(--text);
  }
  .it.notadm {
    border-left: 2px solid #5a3f8a;
    padding-left: 0.3rem;
    color: var(--muted);
  }
  .orig.plan {
    color: #7aa0ff;
  }
  @media (max-width: 640px) {
    .sheet {
      font-size: 0.78rem;
    }
    .tipo {
      display: none;
    }
    .nome {
      left: 0;
      width: 150px;
    }
    .h.corner.nome {
      left: 0;
    }
  }
</style>
