<script lang="ts">
  // A ferramenta para a mesa (docs/arquitetura.md, secção 8): o plano da próxima sessão, tirado da Grelha; os beats do
  // capítulo por jogar, com a marca «jogado à mesa»; as notas rápidas; e as sessões do registo. As marcas e as notas
  // vão para grelha/dm.json; o fecho seguinte trata delas.
  import { ui, world, abrirEdicao, abrirFicha, setView } from '../lib/state.svelte'
  import { camada, registar, apagar } from '../lib/grelha/store.svelte'
  import { contagens, type Item, type Linha } from '../lib/grelha/modelo'
  import { notasPorResponder } from '../lib/grelha/viva'
  import { porPasta } from '../lib/arquivo/arvore'
  import Chip from './Chip.svelte'

  const estado = $derived(world.estado)
  const campanha = $derived(world.campanha)
  const g = $derived(world.grelha)
  const indice = $derived(world.indice)
  const mesa = $derived(estado.mesa)
  const proxima = $derived(g.colunas.find((c) => c.tipo === 'proxima'))
  const proximaChave = $derived(proxima?.chave ?? '')
  const lista = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : [])

  // o plano da próxima sessão: o que está na coluna «próxima», linha a linha
  const ROTULO: Record<string, string> = { plano: 'plano', ideia: 'ideia', falta: 'falta', nota: 'nota', 'plano-canone': 'cânone', texto: '', facto: 'facto', eco: 'eco' }
  const plano = $derived.by(() => {
    const out: { linha: Linha; itens: Item[] }[] = []
    for (const l of g.linhas) {
      if (l.calculada) continue
      const itens = (l.celulas[proximaChave]?.itens ?? []).filter((i) => i.tipo !== 'texto')
      if (itens.length) out.push({ linha: l, itens })
    }
    return out
  })
  const semCena = $derived(plano.filter((p) => p.itens.some((i) => i.tipo === 'falta')).map((p) => p.linha))
  const notasAbertas = $derived(notasPorResponder(g, camada).length)
  const totais = $derived(contagens(g.linhas, proximaChave, notasAbertas))
  const esquecidos = $derived(g.linhas.filter((l) => l.esquecidos > 0))

  // beats do capítulo em que a mesa está
  const jogadosDm = $derived(new Set(camada.dm.filter((e) => e.kind === 'jogado' && !e.deleted && e.beat).map((e) => String(e.beat))))
  const estadoBeat = (id: string) => (jogadosDm.has(id) ? 'jogado à mesa' : (estado.beats.get(id)?.estado ?? 'por-jogar'))
  const feito = (id: string) => estadoBeat(id) === 'jogado' || estadoBeat(id) === 'jogado à mesa' || estadoBeat(id) === 'saltado'
  const porJogar = $derived(campanha.beats.filter((b) => b.meta.capitulo === campanha.capituloAtual && !feito(String(b.meta.id))))
  /** Próximo beat por arco: o primeiro por jogar cujos `requer` já se jogaram. */
  const proximos = $derived(
    campanha.arcos
      .filter((a) => a.meta.subtipo !== 'pcAmbition')
      .map((arco) => {
        const id = String(arco.meta.id)
        const beats = campanha.beats.filter((b) => lista(b.meta.arcos).includes(id))
        const pronto = beats.find((b) => !feito(String(b.meta.id)) && lista(b.meta.requer).every(feito))
        const bloqueado = beats.find((b) => !feito(String(b.meta.id)) && !lista(b.meta.requer).every(feito))
        return { arco, id, nome: String(arco.meta.nome ?? id), cor: String(arco.meta.cor ?? '#888'), pronto, bloqueado, feitos: beats.filter((b) => feito(String(b.meta.id))).length, total: beats.length }
      })
      .filter((x) => x.total),
  )
  async function marcarJogado(id: string) {
    await registar({ kind: 'jogado', beat: id }, `grelha: jogado à mesa ${id}`)
  }

  // notas rápidas
  let nota = $state('')
  const notas = $derived(camada.dm.filter((e) => e.kind === 'nota' && !e.deleted).sort((a, b) => String(b.at).localeCompare(String(a.at))))
  async function registarNota() {
    const t = nota.trim()
    if (!t) return
    await registar({ kind: 'nota', text: t }, `grelha: nota rápida`)
    nota = ''
  }
  const hora = (iso: string) => {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? iso : d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // sessões do registo
  const sessoes = $derived([...mesa.sessoes].filter((s) => s.n >= 1).reverse())
  const jogadores = $derived(new Map(porPasta(world.arvore).jogadores.map((d) => [String(d.meta.id), String(d.meta.nome ?? d.meta.id)])))
  const presencas = $derived(Object.entries(mesa.presencas).sort((a, b) => b[1] - a[1]))

  let tab = $state<'proxima' | 'notas' | 'sessoes'>('proxima')
  const semToken = $derived(!camada.ligado)
</script>

<div class="toolbar">
  <span class="small">A mesa está em <b>{campanha.nomeCapitulo(campanha.capituloAtual)}</b></span>
  <span class="muted small">· capítulo em <code>plano/campanha.md</code></span>
  <span class="spacer"></span>
  <div class="stats muted small">
    {#if mesa.ultima}<span>última <b><a href="#/ficha/{mesa.ultima.id}">S{mesa.ultima.n}</a></b> · {mesa.ultima.data}</span>{/if}
    <span>próxima <b>S{mesa.proximaN}</b></span>
    {#if mesa.nivel}<span>nível <b>{mesa.nivel}</b></span>{/if}
    {#if mesa.mundo}<span title="dia no mundo, no fim da última sessão">{mesa.mundo}</span>{/if}
  </div>
</div>

<div class="page">
  <div class="seg tabs">
    <button class:active={tab === 'proxima'} onclick={() => (tab = 'proxima')}>A próxima sessão (S{mesa.proximaN})</button>
    <button class:active={tab === 'notas'} onclick={() => (tab = 'notas')}>Notas rápidas ({notas.length})</button>
    <button class:active={tab === 'sessoes'} onclick={() => (tab = 'sessoes')}>Sessões ({sessoes.length})</button>
  </div>

  {#if tab === 'proxima'}
    <div class="tiles">
      <button class="tile" onclick={() => setView('grelha')} title="Ver na Grelha"><b>{totais.abertos}</b><span><span class="mk mk-aberto"></span>Abertos</span></button>
      <button class="tile" class:alarme={totais.esquecidos > 0} onclick={() => setView('grelha')} title="Abertos há 3 ou mais sessões, sem plano"><b>{totais.esquecidos}</b><span><span class="mk mk-esquecido"></span>Esquecidos</span></button>
      <button class="tile" onclick={() => setView('grelha')} title="Planos preparados para a próxima sessão"><b>{totais.planeados}</b><span><span class="mk mk-planeado"></span>Planeado para a S{mesa.proximaN}</span></button>
      <button class="tile" onclick={() => setView('grelha')} title="Planos por preparar e PCs sem cena"><b>{totais.faltas}</b><span><span class="mk mk-falta"></span>Falta preparar</span></button>
      <button class="tile" onclick={() => setView('grelha')} title="Perguntas do Claude por responder"><b>{totais.porResponder}</b><span><span class="mk mk-ideia"></span>Por responder</span></button>
    </div>

    <h3 class="section-title">O plano da S{mesa.proximaN} <span class="muted">· o que está na coluna da próxima sessão, linha a linha</span></h3>
    {#if plano.length}
      <div class="grid planos">
        {#each plano as p (p.linha.id)}
          <div class="card linha">
            <div class="row nowrap top">
              <Chip id={p.linha.id} label={p.linha.nome} />
              <span class="spacer"></span>
              <button class="ghost small" onclick={() => { setView('grelha'); abrirEdicao({ modo: 'celula', linha: p.linha.id, col: proximaChave }) }} title="Editar esta célula na Grelha">✎ célula</button>
            </div>
            <ul class="plain itens">
              {#each p.itens as it, i_ (i_)}
                <li class="it {it.estatuto ?? ''} {it.tipo}">
                  <span class="mk mk-{it.estatuto ?? (it.tipo === 'ideia' ? 'ideia' : 'registo')}" title={it.estatuto ?? it.tipo}></span>
                  {#if ROTULO[it.tipo]}<span class="tag soft">{ROTULO[it.tipo]}</span>{/if}
                  <span>{it.texto}</span>
                  {#if it.refs?.length}<span class="refs">{#each it.refs as r (r)}<a href="#/ficha/{r}">{indice.nome(r)}</a>{/each}</span>{/if}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty">Ainda nada planeado para a S{mesa.proximaN}. Na Grelha, clica numa célula da coluna «S{mesa.proximaN}» para escrever um plano.</p>
    {/if}
    {#if semCena.length}
      <p class="small warnline">Sem cena pessoal planeada: {#each semCena as l, i_ (l.id)}{i_ ? ', ' : ''}<a href="#/ficha/{l.id}">{l.nome}</a>{/each}.</p>
    {/if}
    {#if esquecidos.length}
      <p class="small warnline esq">Esquecidos (abertos há 3 ou mais sessões, sem plano): {#each esquecidos.slice(0, 12) as l, i_ (l.id)}{i_ ? ', ' : ''}<a href="#/ficha/{l.id}">{l.nome}</a> ({l.esquecidos}){/each}{#if esquecidos.length > 12} e mais {esquecidos.length - 12}{/if}.</p>
    {/if}

    <h3 class="section-title">Por jogar em {campanha.nomeCapitulo(campanha.capituloAtual)} <span class="muted">· {porJogar.length}</span></h3>
    {#if porJogar.length}
      <div class="pending">
        {#each porJogar as b (b.meta.id)}
          {@const id = String(b.meta.id)}
          <div class="pend" class:curso={estadoBeat(id) === 'em-curso'}>
            <Chip {id} />
            {#if estadoBeat(id) === 'em-curso'}<span class="tag estado">em curso</span>{:else if b.meta.estado === 'proposta'}<span class="tag soft">proposta</span>{/if}
            <button class="icon ghost" title={semToken ? 'Marcar jogado à mesa (sem token fica só neste browser)' : 'Marcar jogado à mesa: fica na tua camada até ao fecho'} onclick={() => marcarJogado(id)}>✓</button>
          </div>
        {/each}
      </div>
    {:else}
      <p class="muted">Tudo jogado neste capítulo. O capítulo da mesa muda no fecho, em <code>plano/campanha.md</code>.</p>
    {/if}
    {#if jogadosDm.size}
      <p class="small muted">Marcados à mesa, por passar ao registo no fecho: {#each [...jogadosDm] as id, i_ (id)}{i_ ? ', ' : ''}<a href="#/ficha/{id}">{indice.nome(id)}</a>{/each}.</p>
    {/if}

    <h3 class="section-title">Próximo beat pronto, por arco</h3>
    <div class="grid lanes">
      {#each proximos as n (n.id)}
        <div class="card lane" style:border-left-color={n.cor}>
          <div class="row nowrap top">
            <Chip id={n.id} label={n.nome} />
            <span class="spacer"></span>
            <span class="muted tiny">{n.feitos}/{n.total}</span>
          </div>
          <div class="meter" class:ok={n.feitos === n.total && n.total > 0}><i style:width="{n.total ? (n.feitos / n.total) * 100 : 0}%"></i></div>
          <div class="nextb">
            {#if n.pronto}
              <span class="muted tiny">pronto</span>
              <div class="row nowrap"><Chip id={String(n.pronto.meta.id)} /><button class="icon ghost" title="marcar jogado à mesa" onclick={() => marcarJogado(String(n.pronto!.meta.id))}>✓</button></div>
            {:else if n.feitos === n.total}
              <span class="ok tiny">arco concluído</span>
            {:else}
              <span class="muted tiny">nada pronto</span>
            {/if}
            {#if n.bloqueado}
              <details>
                <summary class="tiny">bloqueado: {String(n.bloqueado.meta.titulo ?? '').slice(0, 40)}{String(n.bloqueado.meta.titulo ?? '').length > 40 ? '…' : ''}</summary>
                <div class="row" style:margin-top="0.3rem"><span class="muted tiny">requer</span>{#each lista(n.bloqueado.meta.requer).filter((r) => !feito(r)) as r (r)}<Chip id={r} />{/each}</div>
              </details>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if tab === 'notas'}
    <p class="help">Para registar já alguma coisa sem saber onde vai: um nome, uma promessa, um pormenor. Fica na tua camada (<code>grelha/dm.json</code>) e o fecho decide onde entra. {#if semToken}<b>Sem token, fica só neste browser.</b>{/if}</p>
    <div class="card">
      <label class="field"><span>Nota</span><textarea rows="3" bind:value={nota} placeholder="ex.: o Elmiro disse que a mãe era de Jigow" onkeydown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) registarNota() }}></textarea></label>
      <div class="row"><button class="primary" onclick={registarNota} disabled={!nota.trim()}>Registar</button><span class="muted tiny">Ctrl+Enter</span>{#if camada.porGravar}<span class="err small">Por gravar.</span>{/if}</div>
    </div>
    <div class="sessions">
      {#each notas as n (n.id)}
        <div class="card sess">
          <div class="row nowrap">
            <span class="muted small date">{hora(n.at)}</span>
            {#if n.row}<Chip id={n.row} />{/if}
            {#if n.col}<span class="tag soft">{n.col}</span>{/if}
            <span class="spacer"></span>
            {#if ui.view === 'sessao'}<button class="icon ghost danger" onclick={() => confirm('Apagar a nota?') && apagar(n.id, `grelha: apagar nota ${n.id}`)} title="apagar">✕</button>{/if}
          </div>
          <p class="notes">{n.text}</p>
        </div>
      {:else}
        <p class="empty">Sem notas rápidas.</p>
      {/each}
    </div>
  {:else}
    {#if presencas.length}
      <p class="small muted">Presenças: {#each presencas as [pc, n], i_ (pc)}{i_ ? ' · ' : ''}<a href="#/ficha/{pc}">{indice.nome(pc)}</a> {n}{/each}</p>
    {/if}
    <div class="sessions">
      {#each sessoes as s (s.id)}
        <div class="card sess">
          <div class="row nowrap">
            <span class="muted small date">{s.data}</span>
            <b class="ttl"><a href="#/ficha/{s.id}">S{s.n} · {s.titulo}</a></b>
            <span class="spacer"></span>
            {#if typeof s.doc.meta.nivel === 'number'}<span class="muted tiny">nível {s.doc.meta.nivel}</span>{/if}
            <button class="ghost small" onclick={() => abrirFicha(s.id)}>Ficha →</button>
          </div>
          {#if typeof s.doc.meta.resumo === 'string'}<p class="muted small notes">{s.doc.meta.resumo}</p>{/if}
          <div class="row small muted">
            <span>{s.acontecimentos.length} acontecimentos</span>
            {#if Object.keys(s.beats).length}<span>· beats: {#each Object.entries(s.beats) as [b, e], i_ (b)}{i_ ? ', ' : ''}<a href="#/ficha/{b}">{indice.nome(b)}</a> ({e}){/each}</span>{/if}
            {#if Object.keys(s.mesa).length}<span>· à mesa: {Object.entries(s.mesa).map(([pc, j]) => `${indice.nome(pc)} (${jogadores.get(j) ?? j})`).join(', ')}</span>{/if}
          </div>
        </div>
      {:else}
        <p class="empty">Ainda sem sessões no registo.</p>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .tabs {
    margin-bottom: 0.6rem;
  }
  .tiles {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  .planos {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  .linha {
    padding: 0.7rem 0.9rem;
  }
  .itens {
    margin: 0.4rem 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .it {
    display: flex;
    gap: 7px;
    align-items: baseline;
    font-size: 12.5px;
    line-height: 1.38;
  }
  .it .mk {
    position: relative;
    top: 1px;
  }
  .it.ideia {
    color: var(--muted);
  }
  .refs a {
    margin-left: 0.3rem;
    font-size: 0.85em;
  }
  .warnline {
    margin: 0.4rem 0 0;
    color: var(--warn-ink);
  }
  .warnline.esq {
    color: var(--danger);
  }
  .pending {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
  }
  .pend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .pend.curso {
    outline: 1.5px dashed var(--accent-strong);
    outline-offset: 2px;
    border-radius: 999px;
  }
  .lanes {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  .lane {
    border-left: 4px solid;
    padding: 0.7rem 0.9rem;
  }
  .lane .top,
  .linha .top {
    margin-bottom: 0.25rem;
  }
  .nextb {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .sessions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-top: 0.7rem;
  }
  .sess {
    padding: 0.7rem 0.9rem;
  }
  .date {
    min-width: 5.5rem;
    font-family: var(--font-mono);
    font-size: 11.5px;
  }
  .ttl {
    font-family: var(--font-cond);
    font-size: 15px;
  }
  .notes {
    margin: 0.3rem 0 0;
    white-space: pre-wrap;
  }
  textarea {
    width: 100%;
    resize: vertical;
  }
</style>
