<script lang="ts">
  // A Ficha: uma página por coisa (docs/arquitetura.md, secção 8): o texto, os campos, o estado atual,
  // a história (os acontecimentos em que entra), o plano (os beats à frente), as relações e as menções.
  import { ui, world, chapterShort, abrirEdicao, setView } from '../lib/state.svelte'
  import { camada, registar } from '../lib/grelha/store.svelte'
  import { ESTADO_BEAT, efeitoLegivel, pastaDe, tipoDe } from '../lib/ficha'
  import { rotuloMarca } from '../lib/estado'
  import { donaDe, tipoLinhaDe } from '../lib/grelha/dona'
  import { RELATION_LABELS } from '../lib/colors'
  import type { RelationType } from '../lib/types'

  const indice = $derived(world.indice)
  const estado = $derived(world.estado)
  const id = $derived(ui.fichaId ?? '')
  const doc = $derived(id ? indice.doc(id) : undefined)
  const pasta = $derived(doc ? pastaDe(doc) : 'outro')
  const meta = $derived((doc?.meta ?? {}) as Record<string, unknown>)
  const corpo = $derived(doc ? indice.corpo(doc) : { intro: '', secoes: [] })
  const nome = (x: string) => indice.nome(x)
  const lista = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : [])
  const texto = (v: unknown): string => (typeof v === 'string' ? v : '')

  const ep = $derived(estado.personagens.get(id))
  const ei = $derived(estado.itens.get(id))
  const es = $derived(estado.segredos.get(id))
  const ef = $derived(estado.fios.get(id))
  const eb = $derived(estado.beats.get(id))
  const historia = $derived(estado.historia.get(id) ?? [])
  const plano = $derived(doc && pasta !== 'beats' && pasta !== 'sessoes' ? indice.plano(id, estado) : [])
  const mencoes = $derived(indice.mencoes.get(id) ?? [])
  const chegam = $derived(indice.chegam.get(id) ?? [])
  const relacoes = $derived(Array.isArray(meta.relacoes) ? (meta.relacoes as Record<string, unknown>[]) : [])
  const sessao = $derived(pasta === 'sessoes' ? estado.mesa.sessoes.find((s) => s.id === id) : undefined)
  const tipos = $derived.by(() => {
    const m = new Map<string, string>()
    for (const d of indice.arvore.docs) {
      const p = pastaDe(d)
      if (typeof d.meta.id !== 'string') continue
      if (p === 'personagens') m.set(d.meta.id, String(d.meta.tipo ?? 'npc'))
      else if (p === 'fios') m.set(d.meta.id, String(d.meta.tipo ?? ''))
    }
    return tipoLinhaDe(m)
  })
  const dona = (tipo: string, envolve: string[]) => donaDe(tipo, envolve, tipos)
  const relLabel = (t: string) => RELATION_LABELS[t as RelationType] ?? t
  const atitudeAgora = $derived(ep?.atitude ? { valor: ep.atitude.valor, de: rotuloMarca(ep.atitude.marca) } : typeof meta.atitudeAtual === 'string' ? { valor: meta.atitudeAtual, de: 'mockup, por confirmar' } : null)
  const pistasPlaneadas = $derived(lista(meta.pistas).map((b) => ({ id: b, estado: estado.beats.get(b)?.estado ?? 'por-jogar' })))
  const titulo = $derived(doc ? indice.nome(id) : id)
  const TIPO_ESTADO: Record<string, string> = { vivo: 'vivo', morto: 'morto', desaparecido: 'desaparecido', preso: 'preso/a' }
  const escolhas = $derived(Array.isArray(meta.escolhas) ? (meta.escolhas as { opcao: string; resultado: string; levaA: string[] }[]) : [])
  const passos = $derived(Array.isArray(meta.passos) ? (meta.passos as { capitulo: string; texto: string }[]) : [])
  const naGrelha = $derived(world.grelha.linhas.some((l) => l.id === id))
  const jogadoNaMesa = $derived(camada.dm.some((e) => e.kind === 'jogado' && !e.deleted && e.beat === id))
  async function acompanhar() {
    await registar({ kind: 'acompanhar', row: id }, `grelha: acompanhar ${id}`)
  }
  async function marcarJogado() {
    await registar({ kind: 'jogado', beat: id }, `grelha: jogado à mesa ${id}`)
  }
  const historiaPorSessao = $derived.by(() => {
    const m = new Map<string, typeof historia>()
    for (const h of historia) m.set(h.sessao.id, [...(m.get(h.sessao.id) ?? []), h])
    return [...m.entries()]
  })
</script>

<div class="page ficha">
  {#if !doc}
    <p class="muted">Não há ficha para <code>{id}</code>.</p>
  {:else}
    <header class="cabeca">
      <div class="row nowrap">
        <button class="icon ghost" onclick={() => history.back()} title="Voltar">←</button>
        <span class="kind muted">{tipoDe(doc)}</span>
        {#if typeof meta.legenda === 'string'}<span class="muted small">· {meta.legenda}</span>{/if}
        <span class="spacer"></span>
        {#if pasta !== 'sessoes' && pasta !== 'jogadores'}
          {#if naGrelha}<button class="ghost small" onclick={() => { setView('grelha'); abrirEdicao({ modo: 'cabecalho', linha: id }) }} title="Está na Grelha: editar o cabeçalho">Na Grelha ✎</button>{:else}<button class="ghost small" onclick={acompanhar} title="Pôr esta coisa na Grelha">+ Acompanhar na Grelha</button>{/if}
        {/if}
        {#if pasta === 'beats' && eb?.estado !== 'jogado'}<button class="ghost small" onclick={marcarJogado} disabled={jogadoNaMesa} title="Marcar como jogado à mesa; o fecho passa-o para o registo">{jogadoNaMesa ? '✓ jogado à mesa (por absorver)' : 'Marcar jogado à mesa'}</button>{/if}
        <span class="muted small mono">{doc.caminho}</span>
      </div>
      <h2>{titulo}</h2>
      <div class="row pills">
        {#if ep?.estado}<span class="tag estado">{TIPO_ESTADO[ep.estado.valor] ?? ep.estado.valor}{ep.estado.onde ? ` · ${ep.estado.onde}` : ''} <small>{rotuloMarca(ep.estado.marca)}</small></span>{/if}
        {#if atitudeAgora}<span class="tag att {atitudeAgora.valor}">{atitudeAgora.valor} <small>{atitudeAgora.de}</small></span>{/if}
        {#each lista(meta.marcas) as m, i_ (i_)}<span class="tag">{m}</span>{/each}
        {#each lista(meta.etiquetas) as m, i_ (i_)}<span class="tag warnb">{m}</span>{/each}
        {#if ei?.posse}<span class="tag estado">{ei.posse.com ? `com ${nome(ei.posse.com)}` : ei.posse.onde} <small>{rotuloMarca(ei.posse.marca)}</small></span>{/if}
        {#if ef?.estado}<span class="tag estado">{ef.estado.valor} <small>{rotuloMarca(ef.estado.marca)}</small></span>{/if}
        {#if ef?.relogio}<span class="tag estado">relógio {ef.relogio.valor}{meta.passos && typeof meta.passos === 'number' ? ` / ${meta.passos}` : ''} <small>{rotuloMarca(ef.relogio.marca)}</small></span>{/if}
        {#if eb}<span class="tag estado">{ESTADO_BEAT[eb.estado] ?? eb.estado} <small>{rotuloMarca(eb.marca)}</small></span>{:else if pasta === 'beats'}<span class="tag">por jogar</span>{/if}
        {#each lista(meta.origem) as o, i_ (i_)}<span class="tag book" title="de onde veio">{o}</span>{/each}
      </div>
    </header>

    <div class="colunas">
      <div class="principal">
        <section class="card">
          <h4>Agora</h4>
          <dl>
            {#if pasta === 'personagens'}
              {#if typeof meta.quer === 'string'}<dt>Quer</dt><dd>{meta.quer}</dd>{/if}
              {#if typeof meta.teme === 'string'}<dt>Teme</dt><dd>{meta.teme}</dd>{/if}
              {#if lista(meta.facoes).length}<dt>Fações</dt><dd>{#each lista(meta.facoes) as f, i_ (i_)}<a href="#/ficha/{f}">{nome(f)}</a>{i_ < lista(meta.facoes).length - 1 ? ', ' : ''}{/each}</dd>{/if}
              {#if typeof meta.casa === 'string'}<dt>Casa</dt><dd><a href="#/ficha/{meta.casa}">{nome(meta.casa)}</a></dd>{/if}
              {#if lista(meta.capitulos).length}<dt>Capítulos</dt><dd>{lista(meta.capitulos).map(chapterShort).join(', ')}</dd>{/if}
              {#if ep && Object.keys(ep.contadores).length}<dt>Contadores</dt><dd>{#each Object.entries(ep.contadores) as [k, v] (k)}{k}: {v.valor} <small class="muted">({rotuloMarca(v.marca)})</small> {/each}</dd>{/if}
              {#if ep?.cenas.length}<dt>Cenas pessoais</dt><dd>{ep.cenas.map((c) => rotuloMarca(c)).join(', ')}</dd>{/if}
              {#if meta.tipo === 'pc' && estado.mesa.presencas[id]}<dt>Presenças</dt><dd>{estado.mesa.presencas[id]} sessões</dd>{/if}
              {#if ep?.relacoes.length}<dt>Relações do registo</dt><dd>{#each ep.relacoes as r, i_ (i_)}<div>{r.ativa ? '' : 'já não: '}{relLabel(r.tipo)} <a href="#/ficha/{r.com}">{nome(r.com)}</a> <small class="muted">({rotuloMarca(r.marca)})</small></div>{/each}</dd>{/if}
              {#if Array.isArray(meta.estados)}<dt>Estados do plano</dt><dd>{#each meta.estados as e, i_ (i_)}<div><small class="muted">a partir de</small> <a href="#/ficha/{e.desde}">{nome(e.desde)}</a>: {e.estado}</div>{/each}</dd>{/if}
            {:else if pasta === 'facoes'}
              {#if typeof meta.lema === 'string' && meta.lema}<dt>Lema</dt><dd>{meta.lema}</dd>{/if}
              {#each [['Líderes', 'lideres'], ['Aliados', 'aliados'], ['Inimigos', 'inimigos']] as [rotulo, campo] (campo)}
                {#if lista(meta[campo]).length}<dt>{rotulo}</dt><dd>{#each lista(meta[campo]) as x, i_ (i_)}<a href="#/ficha/{x}">{nome(x)}</a>{i_ < lista(meta[campo]).length - 1 ? ', ' : ''}{/each}</dd>{/if}
              {/each}
            {:else if pasta === 'locais'}
              {#if typeof meta.pai === 'string'}<dt>Dentro de</dt><dd><a href="#/ficha/{meta.pai}">{nome(meta.pai)}</a></dd>{/if}
              {#if typeof meta.capitulo === 'string'}<dt>Capítulo</dt><dd>{chapterShort(meta.capitulo)}</dd>{/if}
            {:else if pasta === 'itens'}
              {#if typeof meta.tipoItem === 'string'}<dt>Tipo</dt><dd>{meta.tipoItem}</dd>{/if}
              {#if typeof meta.segredo === 'string'}<dt>Segredo</dt><dd><a href="#/ficha/{meta.segredo}">{nome(meta.segredo)}</a></dd>{/if}
              {#if lista(meta.para).length}<dt>Para</dt><dd>{lista(meta.para).map(nome).join(', ')}</dd>{/if}
              {#if typeof meta.estado === 'string'}<dt>Estado</dt><dd>{meta.estado}</dd>{/if}
              {#if !ei?.posse}<dt>Quem o tem</dt><dd class="muted">sem registo</dd>{/if}
            {:else if pasta === 'segredos'}
              {#if typeof meta.lista === 'string'}<dt>Lista</dt><dd>{meta.lista}</dd>{/if}
              <dt>Quem sabe</dt>
              <dd>
                {#if es?.sabe.length}{#each es.sabe as s, i_ (i_)}<div><a href="#/ficha/{s.quem}">{nome(s.quem)}</a> ({s.nivel}, {rotuloMarca(s.marca)})</div>{/each}{/if}
                {#if es?.mesaSabe}<div>a mesa, fora de jogo ({rotuloMarca(es.mesaSabe)})</div>{/if}
                {#if typeof meta.sabe === 'string'}<div class="muted">{meta.sabe} <small>(mockup)</small></div>{/if}
                {#if !es?.sabe.length && !es?.mesaSabe && typeof meta.sabe !== 'string'}<span class="muted">ninguém, pelo registo</span>{/if}
              </dd>
              <dt>Pistas dadas</dt><dd>{es?.pistasDadas.length ?? 0}{#if es?.pistasDadas.length} <small class="muted">({es.pistasDadas.map(rotuloMarca).join(', ')})</small>{/if}</dd>
              <dt>Pistas planeadas</dt><dd>{#if pistasPlaneadas.length}{#each pistasPlaneadas as p, i_ (i_)}<div><a href="#/ficha/{p.id}">{nome(p.id)}</a> <small class="muted">({ESTADO_BEAT[p.estado]})</small></div>{/each}{:else}<span class="muted">nenhuma</span>{/if}</dd>
            {:else if pasta === 'fios'}
              {#if lista(meta.envolve).length}<dt>Envolve</dt><dd>{#each lista(meta.envolve) as x, i_ (i_)}<a href="#/ficha/{x}">{nome(x)}</a>{i_ < lista(meta.envolve).length - 1 ? ', ' : ''}{/each}</dd>{/if}
              {#if lista(meta.par).length}<dt>Par</dt><dd>{#each lista(meta.par) as x, i_ (i_)}<a href="#/ficha/{x}">{nome(x)}</a>{i_ === 0 ? ' ↔ ' : ''}{/each}</dd>{/if}
              {#if typeof meta.pc === 'string'}<dt>PC</dt><dd><a href="#/ficha/{meta.pc}">{nome(meta.pc)}</a></dd>{/if}
              {#if typeof meta.facao === 'string'}<dt>Fação</dt><dd><a href="#/ficha/{meta.facao}">{nome(meta.facao)}</a></dd>{/if}
              {#if typeof meta.texto === 'string'}<dt>Ambição</dt><dd>{meta.texto}</dd>{/if}
              {#if typeof meta.subtipo === 'string'}<dt>Tipo de arco</dt><dd>{meta.subtipo}</dd>{/if}
              {#if passos.length}<dt>Passos</dt><dd>{#each passos as p, i_ (i_)}<div><b>{p.capitulo}</b> · {p.texto}</div>{/each}</dd>{/if}
              {#if !ef?.estado && !ef?.relogio}<dt>Estado</dt><dd class="muted">sem efeitos no registo{historia.length ? `, ${historia.length} acontecimento(s)` : ''}</dd>{/if}
            {:else if pasta === 'beats'}
              {#if typeof meta.capitulo === 'string'}<dt>Capítulo</dt><dd>{chapterShort(meta.capitulo)} · ordem {meta.ordem}</dd>{/if}
              {#if lista(meta.arcos).length}<dt>Arcos</dt><dd>{#each lista(meta.arcos) as x, i_ (i_)}<a href="#/ficha/{x}">{nome(x)}</a>{i_ < lista(meta.arcos).length - 1 ? ', ' : ''}{/each}</dd>{/if}
              {#if typeof meta.local === 'string'}<dt>Local</dt><dd><a href="#/ficha/{meta.local}">{nome(meta.local)}</a></dd>{/if}
              {#if lista(meta.participantes).length}<dt>Participantes</dt><dd>{#each lista(meta.participantes) as x, i_ (i_)}<a href="#/ficha/{x}">{nome(x)}</a>{i_ < lista(meta.participantes).length - 1 ? ', ' : ''}{/each}</dd>{/if}
              {#if lista(meta.revela).length}<dt>Revela</dt><dd>{#each lista(meta.revela) as x, i_ (i_)}<div><a href="#/ficha/{x}">{nome(x)}</a></div>{/each}</dd>{/if}
              {#if lista(meta.requer).length}<dt>Requer</dt><dd>{#each lista(meta.requer) as x, i_ (i_)}<div><a href="#/ficha/{x}">{nome(x)}</a></div>{/each}</dd>{/if}
              {#if typeof meta.relogio === 'string'}<dt>Relógio</dt><dd>{meta.relogio}</dd>{/if}
              {#if escolhas.length}<dt>Escolhas</dt><dd>{#each escolhas as e, i_ (i_)}<div><b>{e.opcao}</b>: {e.resultado}{#if e.levaA?.length} → {#each e.levaA as l, j_ (j_)}<a href="#/ficha/{l}">{nome(l)}</a>{j_ < e.levaA.length - 1 ? ', ' : ''}{/each}{/if}</div>{/each}</dd>{/if}
            {:else if pasta === 'jogadores'}
              {#if typeof meta.pc === 'string'}<dt>Joga com</dt><dd><a href="#/ficha/{meta.pc}">{nome(meta.pc)}</a></dd>{/if}
            {:else if pasta === 'sessoes' && sessao}
              <dt>Data</dt><dd>{sessao.data ?? '—'}{sessao.jogada ? '' : ' · por jogar'}</dd>
              {#if typeof meta.mundo === 'string'}<dt>No mundo</dt><dd>{meta.mundo}</dd>{/if}
              {#if typeof meta.nivel === 'number'}<dt>Nível</dt><dd>{meta.nivel}</dd>{/if}
              <dt>Mesa</dt><dd>{#each Object.entries(sessao.mesa) as [pc, j] (pc)}<div><a href="#/ficha/{pc}">{nome(pc)}</a> <small class="muted">({nome(j)})</small></div>{/each}</dd>
              {#if Object.keys(sessao.beats).length}<dt>Beats</dt><dd>{#each Object.entries(sessao.beats) as [b, e] (b)}<div><a href="#/ficha/{b}">{nome(b)}</a> <small class="muted">({ESTADO_BEAT[e] ?? e})</small></div>{/each}</dd>{/if}
              {#if typeof meta.resumo === 'string'}<dt>Resumo</dt><dd>{meta.resumo}</dd>{/if}
              {#if typeof meta.ondeParou === 'string'}<dt>Onde parou</dt><dd>{meta.ondeParou}</dd>{/if}
            {/if}
          </dl>
        </section>

        {#if corpo.intro || corpo.secoes.length}
          <section class="card texto">
            {#if corpo.intro}<div class="md">{@html indice.html(corpo.intro)}</div>{/if}
            {#each corpo.secoes as s, i_ (i_)}
              <h4>{s.titulo}</h4>
              <div class="md">{@html indice.html(s.texto)}</div>
            {/each}
          </section>
        {/if}
      </div>

      <div class="lateral">
        {#if pasta === 'sessoes' && sessao}
          <section class="card">
            <h4>Acontecimentos ({sessao.acontecimentos.length})</h4>
            {#each sessao.acontecimentos as ac (ac.id)}
              {@const d = dona(ac.tipo, ac.envolve)}
              <div class="ac">
                <div class="row nowrap small"><span class="mono muted">{ac.id}</span><span class="tag">{ac.tipo}</span>{#if d}<a href="#/ficha/{d}">{nome(d)}</a>{/if}{#each ac.tags ?? [] as t, i_ (i_)}<span class="tag warnb">{t}</span>{/each}</div>
                <div>{ac.texto}</div>
                {#if ac.efeitos?.length}<div class="small muted">{ac.efeitos.map((e) => efeitoLegivel(e, nome)).join(' · ')}</div>{/if}
                {#if ac.origem?.length}<div class="small muted">← {ac.origem.join(', ')}</div>{/if}
              </div>
            {/each}
          </section>
        {:else}
          <section class="card">
            <h4>História ({historia.length})</h4>
            {#if !historia.length}<p class="muted small">Ainda não entra em nenhum acontecimento.</p>{/if}
            {#each historiaPorSessao as [sid, lista_] (sid)}
              <div class="sess"><a href="#/ficha/{sid}">{nome(sid)}</a></div>
              {#each lista_ as h (h.ac.id)}
                {@const d = dona(h.ac.tipo, h.ac.envolve)}
                <div class="ac">
                  <div class="row nowrap small"><span class="tag">{h.ac.tipo}</span>{#if d && d !== id}<span class="muted">↳ <a href="#/ficha/{d}">{nome(d)}</a></span>{/if}{#each h.ac.tags ?? [] as t, i_ (i_)}<span class="tag warnb">{t}</span>{/each}{#if h.ac.fechado}<span class="tag">fecha</span>{/if}</div>
                  <div>{h.ac.texto}</div>
                  {#if h.ac.efeitos?.length}<div class="small muted">{h.ac.efeitos.map((e) => efeitoLegivel(e, nome)).join(' · ')}</div>{/if}
                </div>
              {/each}
            {/each}
          </section>
        {/if}

        {#if plano.length}
          <section class="card">
            <h4>Plano</h4>
            {#each plano as cap (cap.capitulo)}
              <div class="sess">{chapterShort(cap.capitulo)}</div>
              {#each cap.beats as b (b.doc.meta.id)}
                <div class="small"><a href="#/ficha/{b.doc.meta.id}">{nome(String(b.doc.meta.id))}</a> <span class="muted">· {ESTADO_BEAT[b.estado]}</span></div>
              {/each}
            {/each}
          </section>
        {/if}

        {#if relacoes.length || chegam.length}
          <section class="card">
            <h4>Relações</h4>
            {#each relacoes as r, i_ (i_)}
              <div class="small">{relLabel(String(r.tipo))} <a href="#/ficha/{r.com}">{nome(String(r.com))}</a>{#if r.nota} <span class="muted">· {r.nota}</span>{/if}{#if r.desde} <span class="muted">(desde {nome(String(r.desde))})</span>{/if}{#if r.se} <span class="muted">(se {r.se})</span>{/if}</div>
            {/each}
            {#each chegam as c, i_ (i_)}
              <div class="small"><a href="#/ficha/{c.de}">{nome(c.de)}</a> {relLabel(String(c.rel.tipo))} <span class="muted">este</span>{#if c.rel.nota} <span class="muted">· {c.rel.nota}</span>{/if}</div>
            {/each}
          </section>
        {/if}

        {#if mencoes.length}
          <section class="card">
            <h4>Menções ({mencoes.length})</h4>
            {#each mencoes as m (m.caminho)}
              <div class="small"><span class="muted">{tipoDe(m)}</span> <a href="#/ficha/{m.meta.id}">{nome(String(m.meta.id))}</a></div>
            {/each}
          </section>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .ficha {
    max-width: 1280px;
  }
  .cabeca h2 {
    margin: 0.2rem 0 0.4rem;
  }
  .cabeca .kind {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.78rem;
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.78rem;
  }
  .pills {
    margin-bottom: 0.8rem;
  }
  .tag small {
    opacity: 0.7;
    margin-left: 0.3em;
  }
  .tag.estado {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .tag.att.hostil {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .tag.att.amigavel {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .colunas {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr);
    gap: 1rem;
    align-items: start;
  }
  .card {
    margin-bottom: 1rem;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.35rem 0.9rem;
    margin: 0;
  }
  dt {
    color: var(--muted);
    font-size: 0.85rem;
  }
  dd {
    margin: 0;
    min-width: 0;
  }
  .texto h4 {
    margin-top: 1.1rem;
  }
  .texto h4:first-child {
    margin-top: 0;
  }
  .md :global(p) {
    margin: 0 0 0.6rem;
  }
  .md :global(table) {
    border-collapse: collapse;
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }
  .md :global(th),
  .md :global(td) {
    border: 1px solid var(--line);
    padding: 0.3rem 0.5rem;
    vertical-align: top;
  }
  .md :global(ul),
  .md :global(ol) {
    padding-left: 1.3rem;
  }
  .md :global(h3) {
    font-size: 1rem;
    margin: 0.9rem 0 0.3rem;
  }
  .sess {
    color: var(--accent);
    font-size: 0.85rem;
    margin: 0.6rem 0 0.2rem;
  }
  .ac {
    padding: 0.35rem 0 0.35rem 0.6rem;
    border-left: 2px solid var(--line-2);
    margin-bottom: 0.3rem;
  }
  a {
    color: var(--text);
    text-decoration: underline dotted var(--muted-2);
  }
  a:hover {
    color: var(--accent);
  }
  @media (max-width: 900px) {
    .colunas {
      grid-template-columns: 1fr;
    }
    dl {
      grid-template-columns: 1fr;
      gap: 0.1rem;
    }
    dt {
      margin-top: 0.4rem;
    }
  }
</style>
