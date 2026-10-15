<script lang="ts">
  // A página «Batalha» (decisão 28 de 2026-10-13): para o portátil, à mesa. À esquerda a ordem de iniciativa com PV
  // e estados; ao centro a ficha de quem está escolhido, com os botões de variante que sorteiam uma descrição sem
  // repetir a última; à direita a ronda, as zonas do corpo, os lembretes, o terreno e o rescaldo.
  // Os dados vêm de mesa/batalhas/*.yaml; o estado (iniciativa, PV, condições, ronda) grava-se em grelha/dm.json.
  import { abrirFicha } from '../lib/state.svelte'
  import { camada } from '../lib/grelha/store.svelte'
  import { batalhas, vivo, estadoDe, mudar, gravarJa, recomecar } from '../lib/batalha.svelte'
  import {
    CONDICOES, ROTULO_FERIMENTO, ROTULO_VARIANTE, aplicarPv, ferimento, ordemIniciativa, proximaVez, rolarIniciativa, sortear, variantesDe,
    type Acao, type Combatente, type EstadoBatalha, type EstadoCombatente, type Variante,
  } from '../lib/batalha'

  const b = $derived(batalhas.find((x) => x.id === vivo.id) ?? batalhas[0])
  const s = $derived(b ? estadoDe(b) : undefined)
  const ordem = $derived(b && s ? ordemIniciativa(b, s) : [])

  let escolhido = $state<string | null>(null)
  const atual = $derived(b?.combatentes.find((c) => c.id === (escolhido ?? s?.vez)) ?? ordem[0])

  // o que está mostrado em cada ação: a variante e o índice da descrição
  let mostrado = $state<Record<string, { v: Variante; i: number; revelar: boolean }>>({})
  let delta = $state<Record<string, string>>({})
  let zonaD = $state<number | null>(null)
  let confirmarRecomeco = $state(false)

  const caCurta = (c: Combatente) => (typeof c.ca === 'number' ? String(c.ca) : (String(c.ca ?? '').match(/^\d+/)?.[0] ?? ''))

  // a linha com a vez fica sempre à vista
  $effect(() => {
    const id = s?.vez
    if (id) queueMicrotask(() => document.querySelector(`[data-c="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  })

  const LADO: Record<string, string> = { pc: 'PC', aliado: 'aliado', inimigo: 'inimigo', neutro: 'neutro' }

  function set(fn: (s: EstadoBatalha) => EstadoBatalha) {
    if (b && s) mudar(b, fn(structuredClone($state.snapshot(s)) as EstadoBatalha))
  }
  function setC(id: string, fn: (e: EstadoCombatente) => EstadoCombatente) {
    set((x) => ({ ...x, c: { ...x.c, [id]: fn(x.c[id] ?? { cond: [] }) } }))
  }

  function pv(id: string, sinal: 1 | -1) {
    const n = Math.abs(parseInt(delta[id] ?? '', 10))
    if (!n) return
    setC(id, (e) => aplicarPv(e, sinal * n))
    delta[id] = ''
  }
  function definirMax(id: string, v: string) {
    const n = parseInt(v, 10)
    if (!n || n < 1) return
    setC(id, (e) => ({ ...e, max: n, pv: e.pv == null ? n : Math.min(e.pv, n) }))
  }
  function definirIni(id: string, v: string) {
    const n = parseInt(v, 10)
    setC(id, (e) => ({ ...e, ini: Number.isFinite(n) ? n : undefined }))
  }
  function alternarCond(id: string, cond: string) {
    setC(id, (e) => ({ ...e, cond: e.cond.includes(cond) ? e.cond.filter((c) => c !== cond) : [...e.cond, cond] }))
  }
  function temp(id: string, v: string) {
    const n = parseInt(v, 10)
    setC(id, (e) => ({ ...e, temp: n > 0 ? n : undefined }))
  }

  function chave(c: Combatente, a: Acao) {
    return `${c.id}::${a.nome}`
  }
  function mostrar(c: Combatente, a: Acao, v: Variante) {
    const k = chave(c, a)
    const lista = a[v] ?? []
    const antes = mostrado[k]
    const i = sortear(lista, antes && antes.v === v ? antes.i : undefined)
    mostrado[k] = { v, i, revelar: v !== 'final' }
  }
  function revelar(c: Combatente, a: Acao) {
    const k = chave(c, a)
    const m = mostrado[k]
    if (!m) return
    if (m.revelar) mostrar(c, a, 'final')
    mostrado[k] = { ...mostrado[k], revelar: true }
  }

  function rolarZona() {
    zonaD = 1 + Math.floor(Math.random() * 6)
  }
  const zonas = $derived(b ? (b.zonas[atual?.zonas ?? ''] ?? Object.values(b.zonas)[0] ?? []) : [])

  const rondaAtual = $derived(s ? (s.ronda === 0 ? 'Antes' : String(s.ronda)) : '')

  function alternarCheck(i: number) {
    set((x) => ({ ...x, checks: (x.checks ?? []).includes(i) ? (x.checks ?? []).filter((n) => n !== i) : [...(x.checks ?? []), i] }))
  }

  function onKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'n' && b) { e.preventDefault(); set((x) => proximaVez(b, x)); escolhido = null }
    if (e.key === 'z') { e.preventDefault(); rolarZona() }
  }

  const estadoGravacao = $derived(vivo.porGravar ? 'por gravar…' : camada.estado === 'a-gravar' ? 'a gravar…' : camada.estado === 'erro' ? 'erro ao gravar' : camada.ligado ? 'gravado' : 'só neste browser')
</script>

<svelte:window onkeydown={onKeydown} />

{#if !b || !s}
  <div class="page"><p class="empty">Ainda não há batalhas. O Claude escreve-as em <code>mesa/batalhas/</code> pela skill <code>batalha</code>.</p></div>
{:else}
  <div class="bat">
    <header class="barra">
      {#if batalhas.length > 1}
        <select bind:value={vivo.id} aria-label="Batalha">{#each batalhas as x (x.id)}<option value={x.id}>{x.nome}</option>{/each}</select>
      {:else}
        <h2>{b.nome}</h2>
      {/if}
      {#if b.onde}<span class="muted small">{b.onde}</span>{/if}
      <span class="spacer"></span>
      <span class="ronda" title="Ronda">Ronda <b class="mono">{s.ronda || '—'}</b></span>
      <button onclick={() => set((x) => rolarIniciativa(b, x))} title="Rola a iniciativa de quem não é PC (os grupos partilham o rolamento). Os PCs metem-se à mão.">Rolar iniciativa</button>
      <button class="primary" onclick={() => { set((x) => proximaVez(b, x)); escolhido = null }} title="Tecla N">{s.ronda === 0 ? 'Começar' : 'Próximo'} ▸</button>
      <span class="grav" class:err={camada.estado === 'erro'} title={camada.mensagem}>{estadoGravacao}</span>
      {#if vivo.porGravar}<button class="small" onclick={() => gravarJa(b)}>Gravar já</button>{/if}
      {#if b.doc}<a class="small" href={b.doc} target="_blank" rel="noopener">Folha ↗</a>{/if}
      {#if confirmarRecomeco}
        <button class="danger small" onclick={() => { void recomecar(b); confirmarRecomeco = false; escolhido = null; mostrado = {} }}>Apagar estado?</button>
        <button class="ghost small" onclick={() => (confirmarRecomeco = false)}>Não</button>
      {:else}
        <button class="ghost small" onclick={() => (confirmarRecomeco = true)} title="Volta ao início: PV cheios, sem iniciativa, ronda 0">Recomeçar</button>
      {/if}
    </header>

    <div class="cols">
      <!-- ordem de iniciativa -->
      <section class="ordem" aria-label="Ordem de iniciativa">
        {#each ordem as c (c.id)}
          {@const e = s.c[c.id] ?? { cond: [] }}
          {@const f = ferimento(e)}
          <div data-c={c.id} class="lin lado-{c.lado} f-{f}" class:vez={s.vez === c.id} class:sel={atual?.id === c.id} class:fora={e.fora} class:passivo={c.passivo}>
            <div class="topo">
              <input class="ini mono" type="number" value={e.ini ?? ''} placeholder="ini" title="Iniciativa" onchange={(ev) => definirIni(c.id, (ev.target as HTMLInputElement).value)} />
              <button class="linkish nome" onclick={() => (escolhido = c.id)} title={c.aspeto ?? c.resumo ?? ''}>{c.nome}</button>
              <span class="lado">{LADO[c.lado]}</span>
              {#if caCurta(c)}<span class="ca mono" title="CA {c.ca}">{caCurta(c)}</span>{/if}
              <button class="icon ghost x" title={e.fora ? 'Voltar ao combate' : 'Fora do combate (morto, fugiu)'} onclick={() => setC(c.id, (x) => ({ ...x, fora: !x.fora }))}>{e.fora ? '↺' : '✕'}</button>
            </div>
            {#if !c.passivo || e.max}
              <div class="pvl">
                {#if e.max}
                  <div class="barra-pv" title="{e.pv}/{e.max}{e.temp ? ` +${e.temp} temp.` : ''}"><i style:width="{Math.max(0, Math.min(100, ((e.pv ?? 0) / e.max) * 100))}%"></i></div>
                  <span class="mono pvn">{e.pv}/{e.max}{#if e.temp}<span class="tempn">+{e.temp}</span>{/if}</span>
                  <span class="fer">{ROTULO_FERIMENTO[f]}</span>
                {:else}
                  <input class="max mono" type="number" placeholder="PV máx." title="PV máximos (os PCs dizem-nos)" onchange={(ev) => definirMax(c.id, (ev.target as HTMLInputElement).value)} />
                {/if}
                {#if e.max}
                  <input class="dl mono" type="number" min="0" placeholder="±" bind:value={delta[c.id]} onkeydown={(ev) => { if (ev.key === 'Enter') pv(c.id, ev.shiftKey ? 1 : -1) }} title="Enter: dano · Shift+Enter: cura" />
                  <button class="icon dano" onclick={() => pv(c.id, -1)} title="Dano">−</button>
                  <button class="icon cura" onclick={() => pv(c.id, 1)} title="Cura">+</button>
                {/if}
              </div>
            {/if}
            {#if e.cond.length}
              <div class="conds">{#each e.cond as k (k)}<button class="cond" onclick={() => alternarCond(c.id, k)} title="Tirar">{k} ✕</button>{/each}</div>
            {/if}
          </div>
        {/each}
        <p class="tiny muted ajuda">N: próximo · Z: zona · no campo ±, Enter dá dano e Shift+Enter cura.</p>
      </section>

      <!-- ficha -->
      <section class="ficha" aria-label="Combatente">
        {#if atual}
          {@const e = s.c[atual.id] ?? { cond: [] }}
          <div class="cab">
            <h2>{atual.nome}</h2>
            {#if s.vez === atual.id}<span class="tag vez-tag">tem a vez</span>{/if}
            <span class="spacer"></span>
            {#if atual.ref}<button class="small ghost" onclick={() => abrirFicha(atual.ref!)}>Ficha ↗</button>{/if}
          </div>
          <div class="nums">
            {#if atual.ca != null}<span><b>CA</b> {atual.ca}</span>{/if}
            {#if e.max}<span><b>PV</b> {e.pv}/{e.max}</span>{/if}
            {#if atual.ini != null}<span><b>Ini</b> {atual.ini >= 0 ? '+' : ''}{atual.ini}</span>{/if}
            {#if e.max}<label class="tmp"><b>Temp.</b> <input class="mono" type="number" min="0" value={e.temp ?? ''} onchange={(ev) => temp(atual.id, (ev.target as HTMLInputElement).value)} /></label>{/if}
          </div>
          {#if atual.resumo}<p class="resumo">{atual.resumo}</p>{/if}
          {#if atual.aspeto}<p class="small"><span class="muted">Aspeto:</span> {atual.aspeto}</p>{/if}
          {#if atual.equipamento}<p class="small"><span class="muted">Equipamento:</span> {atual.equipamento}</p>{/if}
          {#if atual.notas?.length}<ul class="notas">{#each atual.notas as n, i (i)}<li>{n}</li>{/each}</ul>{/if}

          <div class="condsel">
            <span class="muted tiny">Condições</span>
            {#each CONDICOES as k (k)}<button class="cond-op" class:on={e.cond.includes(k)} onclick={() => alternarCond(atual.id, k)}>{k}</button>{/each}
          </div>

          {#each atual.acoes ?? [] as a (a.nome)}
            {@const k = chave(atual, a)}
            {@const m = mostrado[k]}
            <div class="acao">
              <div class="acab">
                <b>{a.nome}</b>
                {#if a.mecanica}<span class="muted small">{a.mecanica}</span>{/if}
              </div>
              {#if a.componentes}<div class="comp small">{a.componentes}</div>{/if}
              <div class="vars">
                {#each variantesDe(a) as v (v)}
                  <button class="var v-{v}" class:active={m?.v === v} onclick={() => mostrar(atual, a, v)} title={v === 'magoa' ? 'O alvo fica acima de metade dos PV' : v === 'fere' ? 'O alvo fica com metade ou menos' : ''}>{ROTULO_VARIANTE[v]}{#if (a[v]?.length ?? 0) > 1} <span class="n">{a[v]!.length}</span>{/if}</button>
                {/each}
              </div>
              {#if m}
                {#if m.v === 'final' && !m.revelar}
                  <div class="desc pergunta"><b>«{a.pergunta ?? 'Como queres fazer isto?'}»</b> <button class="small" onclick={() => revelar(atual, a)}>O jogador devolve: sugestão</button></div>
                {:else}
                  <div class="desc v-{m.v}">{(a[m.v] ?? [])[m.i]} <button class="icon ghost outra" title="Outra" onclick={() => (m.v === 'final' ? revelar(atual, a) : mostrar(atual, a, m.v))}>↻</button></div>
                {/if}
              {/if}
            </div>
          {/each}
        {/if}
      </section>

      <!-- mesa -->
      <section class="mesa" aria-label="Ronda e referência">
        {#if b.resumo}<p class="small resumo-b">{b.resumo}</p>{/if}
        <h3 class="section-title">Rondas</h3>
        <ol class="rondas">
          {#each b.rondas as r (r.ronda)}
            <li class:agora={r.ronda === rondaAtual} class:passada={r.ronda !== 'Antes' && Number(r.ronda) < s.ronda}><span class="rn mono">{r.ronda}</span> {r.texto}</li>
          {/each}
        </ol>

        {#if zonas.length}
          <h3 class="section-title">Onde acerta <button class="small" onclick={rolarZona} title="Tecla Z">d6{#if zonaD}: <b>{zonaD}</b>{/if}</button></h3>
          <table class="zonas">
            <tbody>{#each zonas as z (z.d)}<tr class:sorteada={zonaD === z.d}><td class="mono">{z.d}</td><td><b>{z.zona}</b> {z.texto}</td></tr>{/each}</tbody>
          </table>
        {/if}

        {#if b.lembretes.length}
          <h3 class="section-title">Lembretes</h3>
          <ul class="lemb">{#each b.lembretes as l, i (i)}<li>{l}</li>{/each}</ul>
        {/if}

        {#if b.terreno.length}
          <details><summary class="section-title">Terreno</summary>
            <dl class="terreno">{#each b.terreno as t (t.nome)}<dt>{t.nome}</dt><dd>{t.texto}</dd>{/each}</dl>
          </details>
        {/if}
        {#if b.checklist.length}
          <details open><summary class="section-title">Checklist</summary>
            <ul class="check">{#each b.checklist as c, i (i)}<li><label><input type="checkbox" checked={(s.checks ?? []).includes(i)} onchange={() => alternarCheck(i)} /> {c}</label></li>{/each}</ul>
          </details>
        {/if}
        {#if b.rescaldo.length}
          <details><summary class="section-title">Rescaldo</summary>
            <ul class="lemb">{#each b.rescaldo as r, i (i)}<li>{r}</li>{/each}</ul>
          </details>
        {/if}
      </section>
    </div>
  </div>
{/if}

<style>
  .bat {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .barra {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--line);
    background: var(--bg-2);
  }
  .barra h2 {
    margin: 0;
    font-size: 1.1rem;
  }
  .ronda {
    font-family: var(--font-cond);
    padding: 0 0.4rem;
  }
  .ronda b {
    font-size: 1.15rem;
  }
  .grav {
    font-size: 0.8rem;
    color: var(--muted-2);
    min-width: 6.5rem;
    text-align: right;
  }
  .grav.err {
    color: var(--danger);
  }
  .cols {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(300px, 340px) minmax(0, 1fr) minmax(280px, 340px);
  }
  .cols > section {
    overflow: auto;
    padding: 0.75rem;
    min-height: 0;
  }
  .ordem {
    border-right: 1px solid var(--line);
    background: var(--bg-1);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .mesa {
    border-left: 1px solid var(--line);
    background: var(--bg-1);
  }
  .lin {
    background: var(--bg-2);
    border: 1px solid var(--line);
    border-left: 4px solid var(--line-2);
    border-radius: var(--radius-xs);
    padding: 0.35rem 0.45rem;
  }
  .lin.lado-pc {
    border-left-color: var(--plan);
  }
  .lin.lado-aliado {
    border-left-color: var(--ok);
  }
  .lin.lado-inimigo {
    border-left-color: var(--danger);
  }
  .lin.lado-neutro {
    border-left-color: var(--fechado);
  }
  .lin.vez {
    box-shadow: 0 0 0 2px var(--accent-strong);
  }
  .lin.sel {
    background: var(--accent-soft);
  }
  .lin.fora,
  .lin.f-caido {
    opacity: 0.5;
  }
  .lin.passivo {
    padding-top: 0.2rem;
    padding-bottom: 0.2rem;
  }
  .topo {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .ini {
    width: 3.2rem;
    min-height: 28px !important;
    padding: 0.15rem 0.3rem !important;
    text-align: center;
  }
  .nome {
    font-weight: 700;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lado {
    font-size: 0.7rem;
    color: var(--muted-2);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ca {
    font-size: 0.8rem;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    padding: 0 0.3rem;
  }
  .x {
    font-size: 0.8rem;
  }
  .pvl {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.3rem;
  }
  .barra-pv {
    flex: 1;
    height: 8px;
    background: var(--bg-3);
    border-radius: 4px;
    overflow: hidden;
  }
  .barra-pv i {
    display: block;
    height: 100%;
    background: var(--ok);
  }
  .f-magoado .barra-pv i {
    background: var(--warn);
  }
  .f-ferido .barra-pv i,
  .f-caido .barra-pv i {
    background: var(--danger);
  }
  .pvn {
    font-size: 0.78rem;
    min-width: 3.4rem;
    text-align: right;
  }
  .tempn {
    color: var(--plan);
    margin-left: 0.15rem;
  }
  .fer {
    font-size: 0.72rem;
    color: var(--muted);
    min-width: 3.6rem;
  }
  .f-ferido .fer,
  .f-caido .fer {
    color: var(--danger);
    font-weight: 700;
  }
  .dl,
  .max {
    width: 3.6rem;
    min-height: 28px !important;
    padding: 0.15rem 0.3rem !important;
  }
  .max {
    width: 6rem;
  }
  .dano:hover {
    color: var(--danger);
    border-color: var(--danger);
  }
  .cura:hover {
    color: var(--ok);
    border-color: var(--ok);
  }
  .conds,
  .condsel {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.3rem;
    align-items: center;
  }
  .cond {
    font-size: 0.72rem;
    padding: 0.05rem 0.4rem;
    background: var(--warn-soft);
    border-color: var(--warn);
    color: var(--warn-ink);
  }
  .cond-op {
    font-size: 0.75rem;
    padding: 0.1rem 0.45rem;
  }
  .cond-op.on {
    background: var(--warn-soft);
    border-color: var(--warn);
    color: var(--warn-ink);
    font-weight: 700;
  }
  .ajuda {
    margin-top: auto;
  }
  .cab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .cab h2 {
    margin: 0;
  }
  .vez-tag {
    background: var(--accent-strong);
    color: #fff;
  }
  .nums {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin: 0.4rem 0;
    font-family: var(--font-cond);
    align-items: center;
  }
  .tmp input {
    width: 3.6rem;
    min-height: 26px;
    padding: 0.1rem 0.3rem;
  }
  .resumo {
    margin: 0.2rem 0 0.4rem;
  }
  .notas {
    margin: 0.3rem 0 0.6rem;
    padding-left: 1.1rem;
  }
  .acao {
    border: 1px solid var(--line);
    border-radius: var(--radius-xs);
    background: var(--bg-2);
    padding: 0.5rem 0.6rem;
    margin-top: 0.55rem;
  }
  .acab {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .comp {
    color: var(--pista-ink);
    margin-top: 0.15rem;
  }
  .vars {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    margin-top: 0.4rem;
  }
  .var {
    font-size: 0.82rem;
    padding: 0.25rem 0.6rem;
  }
  .var .n {
    font-size: 0.7rem;
    opacity: 0.6;
  }
  .var.v-critico:not(.active) {
    border-color: var(--warn);
  }
  .var.v-final:not(.active) {
    border-color: var(--danger-line);
  }
  .desc {
    margin-top: 0.45rem;
    padding: 0.5rem 0.65rem;
    border-radius: var(--radius-xs);
    background: var(--bg-1);
    border-left: 3px solid var(--accent);
    font-size: 1.02rem;
    line-height: 1.5;
  }
  .desc.v-falha {
    border-left-color: var(--fechado);
  }
  .desc.v-critico {
    border-left-color: var(--warn);
  }
  .desc.v-final,
  .desc.pergunta {
    border-left-color: var(--danger);
  }
  .outra {
    float: right;
  }
  .resumo-b {
    margin-top: 0;
  }
  .rondas {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .rondas li {
    padding: 0.35rem 0.5rem;
    border-radius: var(--radius-xs);
    border: 1px solid transparent;
    font-size: 0.88rem;
  }
  .rondas li.agora {
    background: var(--bg-2);
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .rondas li.passada {
    color: var(--muted-2);
  }
  .rn {
    display: inline-block;
    min-width: 2.8rem;
    font-weight: 700;
  }
  .zonas {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  .zonas td {
    padding: 0.25rem 0.35rem;
    vertical-align: top;
    border-bottom: 1px solid var(--line-soft);
  }
  .zonas tr.sorteada td {
    background: var(--warn-soft);
  }
  .lemb,
  .check {
    padding-left: 1.1rem;
    margin: 0.2rem 0;
    font-size: 0.86rem;
  }
  .check {
    list-style: none;
    padding-left: 0;
  }
  details summary {
    cursor: pointer;
  }
  .terreno dt {
    font-weight: 700;
    margin-top: 0.3rem;
  }
  .terreno dd {
    margin: 0 0 0 0;
    font-size: 0.86rem;
  }
  @media (max-width: 1250px) {
    .cols {
      grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    }
    .mesa {
      grid-column: 1 / -1;
      border-left: 0;
      border-top: 1px solid var(--line);
    }
  }
</style>
