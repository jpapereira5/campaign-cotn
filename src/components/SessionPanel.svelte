<script lang="ts">
  // Vista Sessão: só leitura. O registo (data/registo) escreve-se no fecho; aqui consulta-se o que dele deriva.
  import { ui, world, isPlayed, chapterName, select } from '../lib/state.svelte'
  import { REPO } from '../lib/github'
  import { orderArcs } from '../lib/timeline'
  import type { Momento, Sessao } from '../lib/registo'
  import EntityChip from './EntityChip.svelte'
  import PcCoverage from './PcCoverage.svelte'

  const c = $derived(world.canon)
  const estado = $derived(world.estado)
  const registo = $derived(world.registo)
  const sessoes = $derived([...estado.sessoes].reverse())
  const played = $derived(new Set(estado.playedBeats))
  const tableChapter = $derived(estado.capituloAtual ?? ui.chapter)

  /** Próximo beat por arco: primeiro não jogado cujos requires estão jogados. */
  const next = $derived.by(() =>
    orderArcs(c.arcs).map((arc) => {
      const beats = world.beatsSorted.filter((b) => b.arcs.includes(arc.id))
      const ready = beats.find((b) => !played.has(b.id) && b.requires.every((r) => played.has(r)))
      const blocked = beats.find((b) => !played.has(b.id) && !b.requires.every((r) => played.has(r)))
      return { arc, ready, blocked, done: beats.filter((b) => played.has(b.id)).length, total: beats.length }
    }),
  )
  /** Beats do capítulo da mesa ainda por jogar, por ordem. */
  const chapterPending = $derived(world.beatsSorted.filter((b) => b.chapter === tableChapter && !played.has(b.id)))
  const fiosAbertos = $derived(registo.fios.filter((f) => estado.fios[f.id]?.estado === 'aberto'))
  const fiosFechados = $derived(registo.fios.filter((f) => estado.fios[f.id]?.estado !== 'aberto'))
  const donos = $derived(Object.entries(estado.inventario).sort(([a], [b]) => nome(a).localeCompare(nome(b))))

  function nome(id: string): string {
    return c.characters.find((x) => x.id === id)?.name ?? registo.itens.find((i) => i.id === id)?.nome ?? registo.relogios.find((r) => r.id === id)?.nome ?? id
  }
  const momento = (m?: Momento) => (m ? `dia ${m.dia}${m.terco ? `, ${m.terco}` : ''}` : '')
  const tempo = (s: Sessao) => (s.tempo ? `${momento(s.tempo.de)} → ${momento(s.tempo.a)}${s.tempo.estimado ? ' (estimado)' : ''}` : '')
  const github = (path: string) => `https://github.com/${REPO.owner}/${REPO.repo}/blob/${REPO.branch}/${path}`
  const isChar = (id: string) => c.characters.some((x) => x.id === id)

  let tab = $state<'proximo' | 'sessoes' | 'fios' | 'inventario'>('proximo')
</script>

<div class="toolbar">
  <span class="muted small">A mesa está em <b>{chapterName(tableChapter)}</b>{#if estado.momentoAtual}, {momento(estado.momentoAtual)}{/if}</span>
  <span class="spacer"></span>
  <div class="stats muted small">
    <span><b>{estado.playedBeats.length}</b> beats jogados</span>
    <span><b>{estado.revelados.size}</b> revelações</span>
    <span><b>{estado.sessoes.length}</b> sessões</span>
  </div>
</div>

<div class="page">
  <div class="seg tabs">
    <button class:active={tab === 'proximo'} onclick={() => (tab = 'proximo')}>O que vem a seguir</button>
    <button class:active={tab === 'sessoes'} onclick={() => (tab = 'sessoes')}>Sessões ({estado.sessoes.length})</button>
    <button class:active={tab === 'fios'} onclick={() => (tab = 'fios')}>Fios ({fiosAbertos.length})</button>
    <button class:active={tab === 'inventario'} onclick={() => (tab = 'inventario')}>Quem tem o quê</button>
  </div>

  {#if tab === 'proximo'}
    {#if estado.planeada}
      {@const p = estado.planeada}
      <div class="card planeada">
        <div class="row nowrap"><span class="tag">planeada</span><b>{p.id}</b> <span class="muted small">{p.data || 'data por marcar'} · {chapterName(p.capitulo)}</span>{#if p.preparacao}<span class="muted small">· preparação: {p.preparacao}</span>{/if}</div>
        {#if p.titulo}<p class="muted small">{p.titulo}</p>{/if}
        {#if p.beats.length}<div class="row">{#each p.beats as b, i_ (i_)}<EntityChip kind="beat" id={b.id} />{/each}</div>{:else}<p class="muted small">Sem beats previstos.</p>{/if}
      </div>
    {:else}
      <p class="muted small">Sem sessão planeada: o fecho cria a próxima em <code>data/registo/sessoes/</code>.</p>
    {/if}

    <PcCoverage compact onlyChapter={tableChapter} />
    <h3 class="section-title">Por jogar em {chapterName(tableChapter)} <span class="muted">· {chapterPending.length}</span></h3>
    {#if chapterPending.length}
      <div class="pending">
        {#each chapterPending.slice(0, 24) as b (b.id)}<EntityChip kind="beat" id={b.id} />{/each}
        {#if chapterPending.length > 24}<span class="muted small">… e mais {chapterPending.length - 24}</span>{/if}
      </div>
    {:else}
      <p class="muted">Tudo jogado neste capítulo.</p>
    {/if}

    <h3 class="section-title">Próximo beat pronto, por pista</h3>
    <div class="grid lanes">
      {#each next as n (n.arc.id)}
        <div class="card lane" style:border-left-color={n.arc.color}>
          <div class="row nowrap top">
            <EntityChip kind="arc" id={n.arc.id} />
            <span class="spacer"></span>
            <span class="muted tiny">{n.done}/{n.total}</span>
          </div>
          <div class="meter" class:ok={n.done === n.total && n.total > 0}><i style:width="{n.total ? (n.done / n.total) * 100 : 0}%"></i></div>
          <div class="nextb">
            {#if n.ready}
              <span class="muted tiny">pronto</span>
              <div class="row nowrap"><EntityChip kind="beat" id={n.ready.id} /></div>
            {:else if n.done === n.total}
              <span class="ok tiny">pista concluída</span>
            {:else}
              <span class="muted tiny">nada pronto</span>
            {/if}
            {#if n.blocked}
              <details>
                <summary class="tiny">bloqueado: {n.blocked.title.slice(0, 40)}{n.blocked.title.length > 40 ? '…' : ''}</summary>
                <div class="row" style:margin-top="0.3rem"><span class="muted tiny">requer</span>{#each n.blocked.requires.filter((r) => !played.has(r)) as r, i_ (i_)}<EntityChip kind="beat" id={r} />{/each}</div>
              </details>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if estado.decisoes.planos.length || registo.relogios.length}
      <h3 class="section-title">Planos por cumprir e relógios</h3>
      <ul class="plain">
        {#each estado.decisoes.planos as d (d.id)}
          <li><span class="muted tiny">{d.id}</span> {d.texto} {#each d.gatilho as g, i_ (i_)}<EntityChip kind="beat" id={g} />{/each}{#if d.prazo}<span class="muted small"> · prazo {d.prazo}</span>{/if}{#if d.quando}<span class="muted small"> · {d.quando}</span>{/if}</li>
        {/each}
        {#each registo.relogios as r (r.id)}
          {@const p = estado.relogios[r.id]}
          <li>⏱ <b>{r.nome}</b> {p ? p.posicao : 0}/{r.passos}{#if r.unidade} {r.unidade}{/if}{#if r.prazo}<span class="muted small"> · prazo: {r.prazo}</span>{/if}{#if p && p.posicao >= r.passos}<span class="tag warnb">terminado</span>{/if}</li>
        {/each}
      </ul>
    {/if}
    {#if Object.keys(estado.flags).length}
      <h3 class="section-title">Flags ativas <span class="muted">· {Object.keys(estado.flags).length}</span></h3>
      <div class="row">{#each Object.keys(estado.flags).sort() as f (f)}<span class="chip static">{f}</span>{/each}</div>
    {/if}
  {:else if tab === 'sessoes'}
    <div class="sessions">
      {#each sessoes as s (s.id)}
        <div class="card sess">
          <div class="row nowrap">
            <span class="muted small date">{s.data}</span>
            <b class="ttl">{s.id}{#if s.global} (#{s.global}){/if} — {s.titulo}</b>
            <span class="spacer"></span>
            <span class="muted tiny">{chapterName(s.capitulo)}{#if s.tempo} · {tempo(s)}{/if}</span>
          </div>
          <div class="row small">
            {#if s.mesa.presentes.length}<span class="muted">Mesa:</span>{#each s.mesa.presentes as pc, i_ (i_)}<EntityChip kind="character" id={pc} />{/each}{/if}
            {#if s.mesa.ausentes.length}<span class="muted">ausentes:</span>{#each s.mesa.ausentes as pc, i_ (i_)}<EntityChip kind="character" id={pc} />{/each}{/if}
            {#if s.mesa.notas}<span class="muted">· {s.mesa.notas}</span>{/if}
          </div>
          {#if s.beats.length}
            <div class="row">
              {#each s.beats as b, i_ (i_)}
                <span class="beatref"><EntityChip kind="beat" id={b.id} />{#if b.continua}<span class="muted tiny">em curso</span>{:else if b.escolha}<span class="muted tiny" title="escolha tomada">⑂ {b.escolha}</span>{/if}</span>
              {/each}
            </div>
          {/if}
          {#if s.npcs.length}
            <ul class="plain small">{#each s.npcs as n, i_ (i_)}<li><EntityChip kind="character" id={n.id} /> {#if n.atitude}<span class="tag">{n.atitude}</span>{/if} {n.estado ?? ''}</li>{/each}</ul>
          {/if}
          {#if s.loot.length}
            <ul class="plain small">{#each s.loot as l, i_ (i_)}<li>🎒 <b>{nome(l.item)}</b>{#if l.quantidade} ×{l.quantidade}{/if} → {#if isChar(l.para)}<EntityChip kind="character" id={l.para} />{:else}{l.para}{/if}{#if l.de} <span class="muted">(de {nome(l.de)})</span>{/if}{#if l.nota} <span class="muted">· {l.nota}</span>{/if}</li>{/each}</ul>
          {/if}
          {#if s.fios.length}
            <ul class="plain small">{#each s.fios as m, i_ (i_)}<li>🧵 <b>{registo.fios.find((f) => f.id === m.id)?.titulo ?? m.id}</b> <span class="muted">{m.tipo === 'fecha' ? 'fechado' : m.tipo === 'descarta' ? 'descartado' : 'avança'}{m.texto ? `: ${m.texto}` : ''}</span></li>{/each}</ul>
          {/if}
          <div class="row small">
            {#if Object.keys(s.flags).length}<span class="muted">flags:</span>{#each Object.entries(s.flags) as [k, v] (k)}<span class="chip static" class:off={!v}>{k}</span>{/each}{/if}
            {#if s.revelacoes.length}<span class="muted">revelou:</span>{#each s.revelacoes as r, i_ (i_)}<EntityChip kind="revelation" id={r} />{/each}{/if}
            {#if s.cumpre.length}<span class="muted">cumpriu:</span>{#each s.cumpre as d, i_ (i_)}<span class="chip static">{d}</span>{/each}{/if}
          </div>
          {#if s.notas}<p class="muted small notes">{s.notas}</p>{/if}
          <div class="row tiny muted">
            {#if s.resumo}<a href={github(s.resumo)} target="_blank" rel="noreferrer">resumo</a>{/if}
            <a href={github(`data/registo/sessoes/${s.id}.json`)} target="_blank" rel="noreferrer">registo</a>
            {#if s.gravacao}<span>gravação: {s.gravacao}</span>{/if}
            {#if s.preparacao}<span>preparação: {s.preparacao}</span>{/if}
          </div>
        </div>
      {:else}
        <p class="empty">Ainda sem sessões no registo (<code>data/registo/sessoes/</code>).</p>
      {/each}
    </div>
  {:else if tab === 'fios'}
    {#each ['fio', 'pergunta'] as tipo (tipo)}
      {@const lista = fiosAbertos.filter((f) => f.tipo === tipo)}
      {#if lista.length}
        <h3 class="section-title">{tipo === 'fio' ? 'Fios abertos' : 'Perguntas ao DM'} <span class="muted">· {lista.length}</span></h3>
        <ul class="plain">
          {#each lista as f (f.id)}
            {@const d = estado.fios[f.id]}
            {@const ultimo = d?.movimentos[d.movimentos.length - 1]}
            <li><b>{f.titulo}</b> <span class="muted tiny">{f.id} · aberto em {f.aberto}</span>
              {#if f.sobre.length}<span class="row inline">{#each f.sobre as id, i_ (i_)}{#if isChar(id)}<EntityChip kind="character" id={id} />{:else if c.beats.some((b) => b.id === id)}<EntityChip kind="beat" id={id} />{:else}<span class="chip static">{id}</span>{/if}{/each}</span>{/if}
              {#if ultimo && ultimo.tipo !== 'abre'}<div class="muted small">último: {ultimo.onde} — {ultimo.texto}</div>{/if}
              {#if f.prazo}<div class="muted small">prazo: {f.prazo}</div>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/each}
    {#if !fiosAbertos.length}<p class="empty">Sem fios abertos (<code>data/registo/fios.json</code>).</p>{/if}
    {#if fiosFechados.length}
      <details><summary class="muted small">fechados e descartados ({fiosFechados.length})</summary>
        <ul class="plain small">{#each fiosFechados as f (f.id)}<li><span class="tag">{estado.fios[f.id]?.estado}</span> {f.titulo} <span class="muted tiny">{f.id}</span></li>{/each}</ul>
      </details>
    {/if}
  {:else}
    {#if donos.length}
      <div class="grid lanes">
        {#each donos as [dono, inv] (dono)}
          <div class="card">
            <div class="row nowrap top">{#if isChar(dono)}<button class="linkish" onclick={() => select('character', dono)}><b>{nome(dono)}</b></button>{:else}<b>{dono}</b>{/if}{#if inv.ouro}<span class="spacer"></span><span class="muted small">{inv.ouro} po</span>{/if}</div>
            <ul class="plain small">{#each inv.itens as it (it)}<li>{nome(it)}</li>{/each}</ul>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty">Sem loot registado (<code>data/registo/itens.json</code> e <code>loot[]</code> nas sessões).</p>
    {/if}
  {/if}
</div>

<style>
  .stats {
    display: flex;
    gap: 1rem;
  }
  .tabs {
    margin-bottom: 0.5rem;
  }
  .pending {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.5rem;
  }
  .lanes {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  .lane {
    border-left: 4px solid;
    padding: 0.65rem 0.85rem;
  }
  .lane .top,
  .card .top {
    margin-bottom: 0.4rem;
  }
  .nextb {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .planeada {
    margin-bottom: 0.75rem;
  }
  .sessions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .sess .row {
    margin-top: 0.3rem;
  }
  .date {
    font-variant-numeric: tabular-nums;
  }
  .ttl {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .notes {
    white-space: pre-wrap;
  }
  .beatref {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .chip.off {
    text-decoration: line-through;
    opacity: 0.6;
  }
  .row.inline {
    display: inline-flex;
    margin-left: 0.4rem;
  }
</style>
