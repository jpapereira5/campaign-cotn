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
    for (const [fio, host] of Object.entries(g.alias)) if (ids.has(host)) ids.add(fio)
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
  // Faixas por grupo e, dentro de cada grupo, cabeçalhos por tipo (PC, NPC, …); cada um abre e fecha com um clique.
  // O que está recolhido fica só neste browser.
  const CHAVE_RECOLHIDAS = 'cc-grelha-recolhidas'
  function lerRecolhidas(): Set<string> {
    try {
      const v = JSON.parse(localStorage.getItem(CHAVE_RECOLHIDAS) ?? '[]')
      return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
    } catch {
      return new Set()
    }
  }
  let recolhidas = $state<Set<string>>(lerRecolhidas())
  function alternar(chave: string) {
    const s = new Set(recolhidas)
    if (s.has(chave)) s.delete(chave)
    else s.add(chave)
    recolhidas = s
    try {
      localStorage.setItem(CHAVE_RECOLHIDAS, JSON.stringify([...s]))
    } catch {
      /* privado / cheio */
    }
  }
  function expandirTudo() {
    recolhidas = new Set()
    try {
      localStorage.removeItem(CHAVE_RECOLHIDAS)
    } catch {
      /* ignore */
    }
  }
  const porGrupo = $derived(
    GRUPOS.map((gr) => {
      const linhas = visiveis.filter((l) => l.grupo === gr.id)
      const tipos = gr.tipos.map((tipo) => ({ tipo, chave: `${gr.id}:${tipo}`, linhas: linhas.filter((l) => l.tipo === tipo) })).filter((t) => t.linhas.length)
      return { ...gr, linhas, tipos, resumo: tipos.map((t) => `${t.linhas.length} ${ROTULO_TIPO[t.tipo]}`).join(' · ') }
    }).filter((gr) => gr.linhas.length),
  )
  const algumaRecolhida = $derived(porGrupo.some((gr) => recolhidas.has(gr.id) || gr.tipos.some((t) => recolhidas.has(t.chave))))
  const ESTATUTOS: Estatuto[] = ['aberto', 'esquecido', 'planeado', 'falta', 'pago', 'pista', 'fechado', 'registo']
  const ATT: Record<string, string> = { amigavel: 'amigável', neutro: 'neutro', desconfiado: 'desconfiado', hostil: 'hostil', 'por-conhecer': 'por conhecer', morto: 'morto' }
  const TAG: Record<string, string> = { 'so-dm': 'só DM', ultima: 'última oportunidade', trunfo: 'trunfo' }
  const larguras = $derived(g.colunas.map((c) => (c.tipo === 'capitulo' ? '148px' : c.tipo === 'proxima' ? '216px' : c.tipo === 'resto' ? '196px' : '208px')).join(' '))
  const cols = $derived(`96px 252px ${larguras}`)
  // no telemóvel a coluna do tipo desaparece (0px), como no mockup
  const colsPhone = $derived(`0px 164px ${larguras}`)
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
      <div class="view-label">Contagens: {viewLabel}</div>
      <div class="tiles">
        <div class="tile"><b>{totais.abertos}</b><span><span class="mk mk-aberto"></span>Abertos</span></div>
        <div class="tile" class:alarme={totais.esquecidos > 0}><b>{totais.esquecidos}</b><span><span class="mk mk-esquecido"></span>Esquecidos</span></div>
        <div class="tile"><b>{totais.planeados}</b><span><span class="mk mk-planeado"></span>Planeado para a S{g.proximaN}</span></div>
        <div class="tile"><b>{totais.faltas}</b><span><span class="mk mk-falta"></span>Falta preparar</span></div>
        <div class="tile"><b>{totais.porResponder}</b><span><span class="mk mk-ideia"></span>Por responder</span></div>
      </div>
    </div>
    <div class="filtros">
      <div class="chips" role="group" aria-label="Filtrar por grupo">
        <button class="chip" class:on={grupo === 'todos'} aria-pressed={grupo === 'todos'} onclick={() => (grupo = 'todos')}>Todos <small>{contaGrupo('todos')}</small></button>
        {#each GRUPOS as gr (gr.id)}<button class="chip" class:on={grupo === gr.id} aria-pressed={grupo === gr.id} onclick={() => (grupo = gr.id)}>{gr.label} <small>{contaGrupo(gr.id)}</small></button>{/each}
        <button class="chip" class:on={soPendentes} aria-pressed={soPendentes} onclick={() => (soPendentes = !soPendentes)}>Só com pendentes</button>
      </div>
      <div class="chips" role="group" aria-label="Filtrar por PC">
        <span class="flabel">PC</span>
        <button class="chip" class:on={pc === 'todos'} aria-pressed={pc === 'todos'} onclick={() => (pc = 'todos')}>Todos os PCs <small>{contaPc('todos')}</small></button>
        {#each g.pcs as p (p.id)}<button class="chip" class:on={pc === p.id} aria-pressed={pc === p.id} onclick={() => (pc = p.id)}><span class="dot" style:background={p.cor}></span>{p.curto} <small>{contaPc(p.id)}</small></button>{/each}
        <span class="sep"></span>
        <button class="chip" class:on={mostrarEcos} aria-pressed={mostrarEcos} onclick={() => (mostrarEcos = !mostrarEcos)} title="Mostrar nas outras linhas os ecos dos acontecimentos">Ecos</button>
        <button class="chip" class:on={modo === 'plano'} aria-pressed={modo === 'plano'} onclick={() => (modo = modo === 'plano' ? 'normal' : 'plano')} title="Os arcos nas linhas e os beats por capítulo nas células">Plano</button>
        <span class="sep"></span>
        <button class="chip" onclick={() => abrirEdicao({ modo: 'nota' })} title="Registar já alguma coisa sem saber onde vai">+ Nota rápida</button>
        <button class="chip" onclick={() => abrirEdicao({ modo: 'nova-linha' })} title="Criar uma coisa nova para acompanhar">+ Nova linha</button>
        <button class="chip" onclick={() => abrirEdicao({ modo: 'acompanhar' })} title="Pôr na Grelha algo que já existe no cânone">+ Acompanhar</button>
      </div>
      <div class="legenda" aria-label="Legenda">
        {#each ESTATUTOS as e (e)}<span class="leg"><span class="mk mk-{e}"></span>{ROTULO_ESTATUTO[e]}</span>{/each}
        <span class="leg"><span class="eco-mk">↳</span>eco de outra linha</span>
        <span class="leg"><span class="ideia-mk"></span>ideia, por aceitar</span>
        <span class="leg"><span class="tag">só DM</span>a mesa não sabe</span>
        <span class="leg"><span class="tag tag-ultima">última oportunidade</span>fecha ao mudar de capítulo</span>
        <span class="leg"><span class="tag tag-trunfo">trunfo</span>pode voltar no fim</span>
      </div>
    </div>
  </div>

  <div class="estado small">
    <span class="muted">{camada.fonte === 'repositorio' ? `Camada do DM lida do repositório${camada.ultimaLeitura ? ` às ${camada.ultimaLeitura}` : ''}; verifica de 30 em 30 s.` : getToken() ? 'A ler a camada do DM do repositório…' : 'Sem token: a camada do DM vem do build e o que editares fica só neste browser (Definições).'}</span>
    {#if camada.porGravar}<span class="err">Por gravar.</span> <button class="chip small" onclick={() => gravarPendentes()}>Tentar de novo</button>{/if}
    {#if camada.estado === 'erro'}<span class="err">{camada.mensagem}</span>{/if}
    {#if algumaRecolhida}<button class="linkish exp" onclick={expandirTudo}>Mostrar todos os grupos</button>{/if}
  </div>
  {#if g.planosPassados.length || g.notasSoltas.length}
    <div class="entrada small">
      {#each g.planosPassados as p (p.entrada.id)}
        <div class="row nowrap">
          <span class="tag warnb">plano que ficou para trás</span>
          <span><b>{p.linha.nome}</b> · {p.entrada.col}: {p.entrada.text}</span>
          <button class="chip small" onclick={() => alterar(p.entrada.id, { col: `s${g.proximaN}` }, `grelha: plano ${p.entrada.id} passa para a S${g.proximaN}`)}>Passa para a S{g.proximaN}</button>
          {#if capituloAtualCol}<button class="chip small" onclick={() => alterar(p.entrada.id, { col: capituloAtualCol }, `grelha: plano ${p.entrada.id} fica para o capítulo`)}>Fica para o capítulo</button>{/if}
          <button class="chip small" onclick={() => apagar(p.entrada.id, `grelha: plano ${p.entrada.id} cai`)}>Cai</button>
        </div>
      {/each}
      {#each g.notasSoltas as n (n.id)}
        <div class="row nowrap"><span class="tag soft">nota rápida</span><span>{n.text}</span><span class="muted">(o fecho decide onde entra)</span><button class="chip small" onclick={() => apagar(n.id, `grelha: apagar nota ${n.id}`)}>Apagar</button></div>
      {/each}
    </div>
  {/if}

  {#if modo === 'plano'}
    <div class="sheet" style:--cols={`96px 252px repeat(${g.plano.capitulos.length}, 180px)`} style:--cols-phone={`0px 164px repeat(${g.plano.capitulos.length}, 180px)`}>
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
    <div class="sheet" style:--cols={cols} style:--cols-phone={colsPhone}>
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
        {@const fechado = recolhidas.has(gr.id)}
        <div class="band" style:grid-column={`1 / span ${g.colunas.length + 2}`}>
          <button class="band-l" aria-expanded={!fechado} onclick={() => alternar(gr.id)} title={fechado ? 'Mostrar o grupo' : 'Ocultar o grupo'}>
            <span class="chev" class:fechado></span>{gr.label}<span class="band-n">{gr.linhas.length}</span>
            {#if fechado && gr.tipos.length > 1}<span class="band-resumo">{gr.resumo}</span>{/if}
          </button>
        </div>
        {#if !fechado}
        {#each gr.tipos as t (t.chave)}
        {@const subFechada = gr.tipos.length > 1 && recolhidas.has(t.chave)}
        {#if gr.tipos.length > 1}
          <div class="band sub" style:grid-column={`1 / span ${g.colunas.length + 2}`}>
            <button class="band-l" aria-expanded={!subFechada} onclick={() => alternar(t.chave)} title={subFechada ? `Mostrar ${ROTULO_TIPO[t.tipo]}` : `Ocultar ${ROTULO_TIPO[t.tipo]}`}>
              <span class="chev" class:fechado={subFechada}></span>{ROTULO_TIPO[t.tipo]}<span class="band-n">{t.linhas.length}</span>
            </button>
          </div>
        {/if}
        {#if !subFechada}
        {#each t.linhas as l (l.id)}
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
              {#if l.fios?.length}
                <div class="fios">
                  {#each l.fios as f (f.id)}<a class="fio-l" href="#/ficha/{f.id}" title={f.tipo === 'ambicao' ? 'Ambição (abre a ficha)' : 'Agenda (abre a ficha)'}><span class="fio-mk" class:agenda={f.tipo === 'agenda'}></span>{f.nome}{#if f.abertos}<span class="fio-n">{f.abertos}</span>{/if}</a>{/each}
                </div>
              {/if}
              {#if l.tipo !== 'pc' && (l.quer || l.teme)}<div class="qm small muted">{#if l.quer}<span><b>Quer</b> {l.quer}</span>{/if}{#if l.teme}<span><b>Teme</b> {l.teme}</span>{/if}</div>{/if}
              {#if l.tipo === 'revelacao'}<div class="qm small muted"><span>{l.pistas ?? 0} pista{l.pistas === 1 ? '' : 's'}{l.sabe ? ` · sabe: ${l.sabe}` : ''}</span></div>{/if}
            </div>
            {#each g.colunas as c (c.chave)}
              {@const cel = l.celulas[c.chave]}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div role="button" tabindex="-1" class="cell {cel.fundo ? 'st-' + cel.fundo : ''}" class:col-cur={c.tipo === 'atual'} class:col-fut={c.tipo === 'capitulo'} class:clicavel={!l.calculada && editavel} onclick={() => editarCelula(l, c.chave)} title={l.calculada ? undefined : 'Editar esta célula'}>
                {#each cel.itens as it, i_ (i_)}
                  {#if it.tipo === 'ideia'}
                    <div class="it ideia" title="ideia da revisão: abre a célula para aceitar ou rejeitar"><span class="tx">{#if it.fio}<span class="fio-tag">{it.fio.nome}</span> {/if}{it.texto}</span>{#each it.tags ?? [] as t (t)}<span class="tag">{TAG[t] ?? t}</span>{/each}</div>
                  {:else if it.tipo === 'nota'}
                    <div class="it notadm"><span class="tx">{it.texto}</span><span class="tag soft">nota rápida</span>{#if it.porRever}<span class="rever" title="por rever"></span>{/if}</div>
                  {:else if it.tipo === 'plano-canone'}
                    <div class="it canone"><span class="tx">{#if it.refs?.length}{#each it.refs as r, j_ (j_)}<button class="lk" onclick={(e) => { e.stopPropagation(); abrir(r) }}>{nome(r)}</button>{j_ < it.refs.length - 1 ? ' · ' : ''}{/each}{:else}{it.texto}{/if}</span></div>
                  {:else}
                    <div class="it" class:falta={it.tipo === 'falta'} class:dmit={!!it.dm}>
                      {#if it.estatuto && it.estatuto !== 'registo'}<span class="mk mk-{it.estatuto}" title={ROTULO_ESTATUTO[it.estatuto] + (it.arquivado ? ' (arquivado)' : '')}></span>{/if}
                      <span class="tx" title={it.original ? `original: ${it.original}` : undefined}>{#if it.fio}<span class="fio-tag" title="do fio «{it.fio.nome}»">{it.fio.nome}</span> {/if}{it.texto}</span>
                      {#if it.origemLabel}<span class="orig" title="nasce de">{it.origemLabel}</span>{/if}
                      {#if it.planeadoEm}<span class="orig plan" title="um plano teu responde a isto">{it.planeadoEm}</span>{/if}
                      {#each it.tags ?? [] as t (t)}<span class="tag tag-{t}">{TAG[t] ?? t}</span>{/each}
                      {#if it.arquivado}<span class="tag soft">arquivado</span>{/if}
                      {#if it.dm}<span class="dmmark" title="edição tua ({it.dm.kind})">✎</span>{/if}
                      {#if it.porRever}<span class="rever" title="por rever"></span>{/if}
                    </div>
                  {/if}
                {/each}
                {#each ecosVisiveis(cel.ecos) as eco, i_ (i_)}
                  <button class="eco" onclick={(e) => { e.stopPropagation(); if (eco.dona) { const d = g.linhas.find((x) => x.id === eco.dona); if (d && editavel) editarCelula(d, c.chave); else if (eco.dona) abrir(eco.dona) } }} title="eco: a célula dona está em {eco.dona ? nome(eco.dona) : '?'}">↳ <b>{eco.dona ? nome(eco.dona) : ''}</b>{#if eco.fio} <span class="fio-tag">{eco.fio.nome}</span>{/if}: {eco.texto}</button>
                {/each}
                {#if mostrarEcos && cel.ecos.length > 2}<span class="muted small">+{cel.ecos.length - 2}</span>{/if}
              </div>
            {/each}
          </div>
        {/each}
        {/if}
        {/each}
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  /* O desenho é o do mockup (claude.ai, 2026-10-11): folha branca com cabeçalhos fixos, a coluna atual em
     verde-azulado escuro, a próxima em azul claro, os estados por fundo e por forma do marcador. */
  .grelha-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .topo {
    padding: 0.2rem 1.4rem 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .view-label {
    font-size: 11.5px;
    color: var(--muted);
  }
  .tiles {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .filtros {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sep {
    width: 1px;
    height: 24px;
    background: var(--line-2);
    margin: 0 4px;
  }
  .legenda {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 12px;
    color: #3d4d58;
  }
  .leg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .leg .mk {
    margin: 0;
  }
  .eco-mk {
    color: var(--muted-2);
    font-weight: 700;
  }
  .ideia-mk {
    width: 12px;
    height: 10px;
    border: 1.5px dashed #6f7c86;
    border-radius: 3px;
    display: inline-block;
  }
  .sheet {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    grid-template-columns: var(--cols);
    grid-auto-rows: max-content;
    align-content: start;
    margin: 0 1.4rem 1rem;
    border: 1px solid var(--line-2);
    border-radius: var(--radius);
    background: var(--bg-2);
    font-size: 12.5px;
    line-height: 1.38;
  }
  .hrow,
  .row {
    display: contents;
  }
  .h {
    position: sticky;
    top: 0;
    z-index: 3;
    padding: 7px 10px;
    background: var(--bg-1);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid #c5cfd5;
    font-family: var(--font-cond);
    font-size: 12.5px;
    color: #2a3a45;
  }
  .h1 .h {
    top: 0;
    height: 34px;
    display: flex;
    align-items: center;
    border-bottom: none;
  }
  .h.arc {
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: #ffffff;
    border-right: 2px solid #ffffff;
    padding-left: 12px;
  }
  .h.arc-cur {
    background: var(--accent-strong);
  }
  .h.arc-fut {
    background: #56636d;
  }
  .h2.so .h {
    top: 0;
  }
  .h2 .h {
    top: 34px;
    height: 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
  }
  .h2 .h b,
  .h2 .h .nm {
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: 13px;
    color: var(--text-strong);
  }
  .h2 .h .nm:hover {
    color: var(--accent);
  }
  .h.ses small {
    font-family: var(--font);
    font-size: 11.5px;
    color: #56656f;
  }
  .h.ses.cur {
    background: var(--accent-strong);
    border-right-color: var(--accent-strong);
  }
  .h.ses.cur b,
  .h.ses.cur .nm,
  .h.ses.cur small {
    color: #ffffff;
  }
  .h.ses.proxima {
    background: #e6edff;
  }
  .h.ses.proxima b {
    color: var(--plan-ink);
  }
  .h.ses.resto {
    background: #eef2fa;
  }
  .h.ses.capitulo {
    background: #eef1f3;
  }
  .h.corner {
    z-index: 5;
    left: 0;
    background: var(--accent-deep);
    color: var(--accent-ink);
    font-weight: 600;
    font-size: 11.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: none;
    border-right-color: var(--accent-deep);
    display: flex;
    align-items: center;
  }
  .h.corner.nome {
    left: 96px;
    box-shadow: inset -1px 0 0 #1f4f5c;
  }
  .h2 .h.corner {
    justify-content: center;
    align-items: flex-start;
  }
  .band-n {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 11.5px;
    letter-spacing: 0;
    text-transform: none;
    color: var(--muted);
  }
  .band {
    background: var(--bg-3);
    border-bottom: 1px solid #c5cfd5;
    min-width: 0;
  }
  .band-l {
    position: sticky;
    left: 0;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    padding: 7px 12px 7px 10px;
    border: 0;
    border-radius: 0;
    background: transparent;
    font-family: var(--font-cond);
    font-weight: 700;
    font-size: 12.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #2a3a45;
    cursor: pointer;
    text-align: left;
  }
  .band-l:hover {
    color: var(--accent);
  }
  .band-l:focus-visible {
    outline-offset: -3px;
  }
  .band.sub {
    background: var(--bg-1);
    border-bottom: 1px solid var(--line);
  }
  .band.sub .band-l {
    padding: 5px 12px 5px 22px;
    font-weight: 600;
    font-size: 11.5px;
    letter-spacing: 0.05em;
    color: var(--muted);
  }
  .chev {
    display: inline-block;
    flex: none;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid currentColor;
    transition: transform 0.12s;
  }
  .chev.fechado {
    transform: rotate(-90deg);
  }
  .band-resumo {
    font-family: var(--font);
    font-weight: 400;
    font-size: 11.5px;
    letter-spacing: 0;
    text-transform: none;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .exp {
    color: var(--accent);
    font-size: 12px;
  }
  .c,
  .cell {
    min-height: 38px;
    padding: 8px 10px;
    border-right: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line-soft);
    background: var(--bg-2);
    color: var(--text);
  }
  .tipo {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--bg-1);
    border-left: 3px solid transparent;
  }
  .tp {
    font-family: var(--font-cond);
    font-weight: 600;
    font-size: 11.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .nome {
    position: sticky;
    left: 96px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--bg-2);
    box-shadow: inset -1px 0 0 var(--line-3);
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
    color: var(--text-strong);
    font: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
  }
  .nm:hover {
    color: var(--accent);
  }
  .nm.static {
    cursor: default;
  }
  .nome .sub {
    font-size: 11.5px;
    color: #56656f;
  }
  .pdot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .fios {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }
  .fio-l {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    line-height: 1.3;
    color: var(--muted);
    text-decoration: none;
  }
  .fio-l:hover {
    color: var(--accent);
    text-decoration: underline;
  }
  .fio-mk {
    flex: none;
    width: 7px;
    height: 7px;
    border: 1.5px solid var(--pista);
    transform: rotate(45deg);
  }
  .fio-mk.agenda {
    border-radius: 50%;
    transform: none;
    border-color: var(--accent);
  }
  .fio-n {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--warn);
  }
  .fio-tag {
    display: inline-block;
    margin-right: 2px;
    padding: 0 5px;
    border-radius: 4px;
    background: var(--pista-soft);
    color: var(--pista-ink);
    font-family: var(--font-cond);
    font-weight: 600;
    font-size: 10.5px;
    line-height: 16px;
    letter-spacing: 0.02em;
    vertical-align: 1px;
    white-space: nowrap;
  }
  .qm {
    margin-top: 3px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 11px;
    line-height: 1.3;
    color: var(--muted);
  }
  .qm b {
    color: var(--muted-2);
    font-weight: 700;
    margin-right: 0.25rem;
  }
  .cell {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .cell.col-cur {
    box-shadow: inset 2px 0 0 var(--accent-strong), inset -2px 0 0 var(--accent-strong);
  }
  .cell.col-fut:empty {
    background: #fafbfb;
  }
  .st-aberto {
    background: var(--warn-soft);
  }
  .st-esquecido {
    background: var(--danger-soft);
    box-shadow: inset 0 0 0 1px var(--danger-line);
  }
  .st-planeado {
    background: var(--plan-soft);
  }
  .st-pago {
    background: var(--ok-soft);
  }
  .st-pista {
    background: var(--pista-soft);
  }
  .st-fechado {
    background: var(--fechado-soft);
    color: var(--muted);
  }
  .st-falta {
    outline: 1.5px dashed #8a96a0;
    outline-offset: -5px;
  }
  .cell.col-cur.st-aberto,
  .cell.col-cur.st-esquecido,
  .cell.col-cur.st-planeado,
  .cell.col-cur.st-pago,
  .cell.col-cur.st-pista {
    box-shadow: inset 2px 0 0 var(--accent-strong), inset -2px 0 0 var(--accent-strong);
  }
  .it {
    display: flex;
    gap: 7px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .it .mk {
    margin-top: 4px;
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
    font-size: 11.5px;
  }
  .it.ideia {
    border: 1.5px dashed #8a96a0;
    border-radius: 6px;
    padding: 4px 7px;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.6);
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
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--muted-2);
    white-space: nowrap;
    margin-top: 2px;
  }
  .orig.plan {
    color: var(--plan-ink);
  }
  .cell .tag {
    margin-top: 1px;
  }
  .eco {
    background: none;
    border: 0;
    padding: 0;
    text-align: left;
    font: inherit;
    font-size: 11.5px;
    line-height: 1.35;
    color: #56656f;
    cursor: pointer;
  }
  .eco b {
    font-weight: 700;
    color: var(--muted);
  }
  .eco:hover {
    color: var(--accent);
  }
  .beat {
    display: block;
    width: 100%;
    text-align: left;
    background: var(--bg-2);
    border: 1px solid var(--line-2);
    border-radius: 6px;
    padding: 3px 7px;
    margin-bottom: 4px;
    color: var(--text);
    font: inherit;
    font-size: 11.5px;
    line-height: 1.35;
    cursor: pointer;
  }
  .beat.jogado {
    opacity: 0.6;
    text-decoration: line-through;
  }
  .beat.em-curso {
    border-color: var(--accent-strong);
    box-shadow: inset 0 0 0 1px var(--accent-strong);
  }
  .beat.proposta {
    border-style: dashed;
    color: var(--muted);
  }
  .beat:hover {
    border-color: var(--accent);
  }
  .row.calc .c,
  .row.calc .cell {
    background: var(--bg-1);
  }
  .estado {
    padding: 0.2rem 1.4rem 0.5rem;
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
  }
  .entrada {
    margin: 0 1.4rem 0.6rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid #b9c8f0;
    border-radius: var(--radius-s);
    background: var(--plan-soft);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .cell.clicavel {
    cursor: pointer;
  }
  .cell.clicavel:hover {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .edit {
    background: none;
    border: 0;
    padding: 0 0.2rem;
    color: var(--muted-2);
    cursor: pointer;
    font-size: 0.85rem;
  }
  .edit:hover {
    color: var(--accent);
  }
  .rever {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--pista);
    display: inline-block;
    margin-left: 0.2rem;
  }
  .dmmark {
    color: var(--accent);
    font-size: 0.85rem;
  }
  .it.notadm {
    border-left: 2px solid var(--pista);
    padding-left: 0.4rem;
    color: var(--muted);
  }
  @media (max-width: 700px) {
    .topo,
    .estado {
      padding-left: 0.6rem;
      padding-right: 0.6rem;
    }
    .topo {
      gap: 6px;
    }
    .stats {
      align-items: stretch;
    }
    .view-label {
      display: none;
    }
    .tiles {
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 6px;
      justify-content: flex-start;
    }
    .tiles .tile {
      min-width: 0;
      flex: 0 0 auto;
      padding: 5px 9px 6px;
      gap: 1px;
    }
    .tiles .tile b {
      font-size: 18px;
    }
    .tiles .tile span {
      font-size: 11px;
    }
    .chips {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 2px;
      gap: 6px;
    }
    .chips .chip {
      min-height: 36px;
      padding: 0 11px;
      white-space: nowrap;
      flex: 0 0 auto;
    }
    .legenda {
      display: none;
    }
    .sheet,
    .entrada {
      margin-left: 0.6rem;
      margin-right: 0.6rem;
      grid-template-columns: var(--cols-phone);
    }
    .tipo,
    .h.corner.tipo {
      padding: 0;
      border: 0;
      overflow: hidden;
    }
    .nome,
    .h.corner.nome {
      left: 0;
    }
  }
</style>
