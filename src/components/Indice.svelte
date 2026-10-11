<script lang="ts">
  // O Índice: listas por pasta, com filtro por texto e «só este capítulo»; clicar abre a Ficha.
  import { world, chapterShort } from '../lib/state.svelte'
  import { porPasta, type DocArvore } from '../lib/arquivo/arvore'
  import { tipoDe, TIPO_FIO } from '../lib/ficha'
  import { semAcentos } from '../lib/pesquisa'
  import { rotuloMarca } from '../lib/estado'
  import Chip from './Chip.svelte'

  type Tab = 'personagens' | 'facoes' | 'locais' | 'itens' | 'segredos' | 'beats' | 'fios' | 'jogadores' | 'sessoes'
  const p = $derived(porPasta(world.arvore))
  const estado = $derived(world.estado)
  const campanha = $derived(world.campanha)
  const indice = $derived(world.indice)
  let q = $state('')
  let tab = $state<Tab>('personagens')
  let soCapitulo = $state(false)
  const lista = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : [])
  const texto = (v: unknown): string => (typeof v === 'string' ? v : '')
  const bate = (d: DocArvore) => {
    const s = semAcentos(q.trim())
    if (!s) return true
    return semAcentos([indice.nome(String(d.meta.id)), d.body.slice(0, 2000), texto(d.meta.legenda)].join(' ')).includes(s)
  }
  const noCapitulo = (d: DocArvore) => !soCapitulo || lista(d.meta.capitulos).includes(campanha.capituloAtual) || d.meta.capitulo === campanha.capituloAtual
  const porNome = (a: DocArvore, b: DocArvore) => indice.nome(String(a.meta.id)).localeCompare(indice.nome(String(b.meta.id)))

  const personagens = $derived(p.personagens.filter((d) => bate(d) && noCapitulo(d)).sort(porNome))
  const facoes = $derived(p.facoes.filter(bate).sort(porNome))
  const locais = $derived(p.locais.filter((d) => bate(d) && noCapitulo(d)).sort((a, b) => campanha.indiceDe(texto(a.meta.capitulo)) - campanha.indiceDe(texto(b.meta.capitulo)) || porNome(a, b)))
  const itens = $derived(p.itens.filter(bate).sort(porNome))
  const segredos = $derived(p.segredos.filter(bate).sort((a, b) => texto(a.meta.lista).localeCompare(texto(b.meta.lista)) || porNome(a, b)))
  const beats = $derived(campanha.beats.filter((d) => bate(d) && noCapitulo(d)))
  const fios = $derived(p.fios.filter(bate).sort((a, b) => texto(a.meta.tipo).localeCompare(texto(b.meta.tipo)) || porNome(a, b)))
  const jogadores = $derived(p.jogadores.filter(bate).sort(porNome))
  const sessoes = $derived([...estado.mesa.sessoes].reverse().filter((s) => bate(s.doc)))
  const contas = $derived<Record<Tab, number>>({ personagens: personagens.length, facoes: facoes.length, locais: locais.length, itens: itens.length, segredos: segredos.length, beats: beats.length, fios: fios.length, jogadores: jogadores.length, sessoes: sessoes.length })
  const tabs: { id: Tab; label: string }[] = [
    { id: 'personagens', label: 'Personagens' }, { id: 'facoes', label: 'Fações' }, { id: 'locais', label: 'Locais' }, { id: 'itens', label: 'Itens' }, { id: 'segredos', label: 'Segredos' },
    { id: 'beats', label: 'Beats' }, { id: 'fios', label: 'Fios' }, { id: 'jogadores', label: 'Jogadores' }, { id: 'sessoes', label: 'Sessões' },
  ]
  const membros = (f: string) => p.personagens.filter((d) => lista(d.meta.facoes).includes(f)).length
  const estadoAgora = (id: string) => {
    const e = estado.personagens.get(id)
    const partes = []
    if (e?.estado) partes.push(`${e.estado.valor}${e.estado.onde ? ` (${e.estado.onde})` : ''} · ${rotuloMarca(e.estado.marca)}`)
    if (e?.atitude) partes.push(`${e.atitude.valor} · ${rotuloMarca(e.atitude.marca)}`)
    return partes.join(' · ')
  }
  const resumo = (d: DocArvore) => indice.corpo(d).secoes.find((s) => s.titulo === 'Resumo')?.texto ?? indice.corpo(d).intro ?? ''
  const posse = (id: string) => {
    const e = estado.itens.get(id)?.posse
    if (!e) return ''
    return `${e.com ? indice.nome(e.com) : (e.onde ?? '')} · ${rotuloMarca(e.marca)}`
  }
  const sabe = (id: string) => estado.segredos.get(id)?.sabe.map((s) => indice.nome(s.quem)).join(', ') ?? ''
  const pistas = (d: DocArvore) => {
    const ids = lista(d.meta.pistas)
    const dadas = estado.segredos.get(String(d.meta.id))?.pistasDadas.length ?? 0
    return `${dadas}/${ids.length}`
  }
  const estadoFio = (id: string) => {
    const e = estado.fios.get(id)
    return [e?.estado ? `${e.estado.valor} · ${rotuloMarca(e.estado.marca)}` : '', e?.relogio ? `relógio ${e.relogio.valor}` : ''].filter(Boolean).join(' · ')
  }
</script>

<div class="toolbar">
  <div class="seg">
    {#each tabs as t (t.id)}<button class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label} <span class="muted">{contas[t.id]}</span></button>{/each}
  </div>
  <input type="search" placeholder="filtrar…" bind:value={q} />
  {#if tab === 'personagens' || tab === 'locais' || tab === 'beats'}
    <label class="toggle" class:on={soCapitulo} title="Só o que entra no capítulo em que a mesa está"><input type="checkbox" bind:checked={soCapitulo} />só {campanha.nomeCapitulo(campanha.capituloAtual)}</label>
  {/if}
</div>

<div class="page wide">
  {#if tab === 'personagens'}
    <table class="list">
      <thead><tr><th>Nome</th><th>Tipo</th><th>Fações</th><th>Capítulos</th><th>Agora</th></tr></thead>
      <tbody>
        {#each personagens as d (d.meta.id)}
          {@const id = String(d.meta.id)}
          <tr>
            <td><Chip {id} />{#if typeof d.meta.legenda === 'string'}<span class="muted tiny leg"> {d.meta.legenda}</span>{/if}</td>
            <td class="muted">{tipoDe(d)}</td>
            <td>{#each lista(d.meta.facoes).slice(0, 2) as f (f)}<Chip id={f} /> {/each}{#if lista(d.meta.facoes).length > 2}<span class="muted tiny">+{lista(d.meta.facoes).length - 2}</span>{/if}</td>
            <td class="muted chs">{lista(d.meta.capitulos).map(chapterShort).join(' · ')}</td>
            <td class="muted small st"><span class="clamp-2">{estadoAgora(id)}</span></td>
          </tr>
        {:else}
          <tr><td colspan="5" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'facoes'}
    <div class="grid">
      {#each facoes as d (d.meta.id)}
        {@const id = String(d.meta.id)}
        <div class="card">
          <div class="row"><Chip {id} /><span class="muted tiny">{membros(id)} membros{#if typeof d.meta.lema === 'string'} · {d.meta.lema}{/if}</span></div>
          <p class="muted small clamp-3">{indice.corpo(d).secoes.find((s) => s.titulo === 'Agenda')?.texto ?? resumo(d)}</p>
        </div>
      {:else}
        <p class="muted">Nada.</p>
      {/each}
    </div>
  {:else if tab === 'locais'}
    <table class="list">
      <thead><tr><th>Local</th><th>Dentro de</th><th>Capítulo</th><th>Resumo</th></tr></thead>
      <tbody>
        {#each locais as d (d.meta.id)}
          <tr>
            <td><Chip id={String(d.meta.id)} /></td>
            <td>{#if typeof d.meta.pai === 'string'}<Chip id={d.meta.pai} />{/if}</td>
            <td class="muted">{typeof d.meta.capitulo === 'string' ? chapterShort(d.meta.capitulo) : ''}</td>
            <td class="muted small clamp-2">{resumo(d)}</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'itens'}
    <table class="list">
      <thead><tr><th>Item</th><th>Tipo</th><th>Com quem</th><th>Legenda</th></tr></thead>
      <tbody>
        {#each itens as d (d.meta.id)}
          {@const id = String(d.meta.id)}
          <tr>
            <td><Chip {id} /></td>
            <td class="muted">{tipoDe(d)}{#if typeof d.meta.tipoItem === 'string'} · {d.meta.tipoItem}{/if}</td>
            <td class="muted small">{posse(id)}</td>
            <td class="muted small clamp-2">{texto(d.meta.legenda)}</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'segredos'}
    <table class="list">
      <thead><tr><th>Lista</th><th>Segredo</th><th>Pistas dadas</th><th>Quem sabe</th></tr></thead>
      <tbody>
        {#each segredos as d (d.meta.id)}
          {@const id = String(d.meta.id)}
          <tr>
            <td class="muted small">{texto(d.meta.lista)}</td>
            <td><Chip {id} /></td>
            <td class="muted">{pistas(d)}</td>
            <td class="muted small">{sabe(id)}</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'beats'}
    <table class="list">
      <thead><tr><th>Cap.</th><th>Beat</th><th>Arcos</th><th>Estado</th><th>Resumo</th></tr></thead>
      <tbody>
        {#each beats as d (d.meta.id)}
          {@const id = String(d.meta.id)}
          {@const eb = estado.beats.get(id)}
          <tr class:jogado={eb?.estado === 'jogado'}>
            <td class="muted">{chapterShort(texto(d.meta.capitulo))} <span class="tiny">· {d.meta.ordem}</span></td>
            <td><Chip {id} /></td>
            <td class="muted tiny">{lista(d.meta.arcos).map((a) => indice.nome(a)).join(', ')}</td>
            <td class="muted small">{eb ? `${eb.estado} · ${rotuloMarca(eb.marca)}` : ''}</td>
            <td class="muted small clamp-2">{resumo(d)}</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'fios'}
    <table class="list">
      <thead><tr><th>Tipo</th><th>Fio</th><th>Envolve</th><th>Agora</th></tr></thead>
      <tbody>
        {#each fios as d (d.meta.id)}
          {@const id = String(d.meta.id)}
          <tr>
            <td class="muted small">{TIPO_FIO[texto(d.meta.tipo)] ?? texto(d.meta.tipo)}</td>
            <td><Chip {id} /></td>
            <td>{#each [...lista(d.meta.envolve), ...lista(d.meta.par), ...(typeof d.meta.pc === 'string' ? [d.meta.pc] : []), ...(typeof d.meta.facao === 'string' ? [d.meta.facao] : [])].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 3) as e (e)}<Chip id={e} /> {/each}</td>
            <td class="muted small">{estadoFio(id)}</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'jogadores'}
    <table class="list">
      <thead><tr><th>Jogador</th><th>PC</th><th>Presenças</th></tr></thead>
      <tbody>
        {#each jogadores as d (d.meta.id)}
          <tr>
            <td><Chip id={String(d.meta.id)} /></td>
            <td>{#if typeof d.meta.pc === 'string'}<Chip id={d.meta.pc} />{/if}</td>
            <td class="muted">{typeof d.meta.pc === 'string' ? (estado.mesa.presencas[d.meta.pc] ?? 0) : ''}</td>
          </tr>
        {:else}
          <tr><td colspan="3" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <table class="list">
      <thead><tr><th>Sessão</th><th>Data</th><th>Título</th><th>Capítulo</th><th>Acontecimentos</th><th>Resumo</th></tr></thead>
      <tbody>
        {#each sessoes as s (s.id)}
          <tr>
            <td><Chip id={s.id} label={s.n === 0 ? 'S0' : `S${s.n}`} /></td>
            <td class="muted">{s.data ?? ''}</td>
            <td>{s.titulo}</td>
            <td class="muted">{typeof s.doc.meta.capitulo === 'string' ? chapterShort(s.doc.meta.capitulo) : ''}</td>
            <td class="muted">{s.acontecimentos.length}</td>
            <td class="muted small clamp-2">{texto(s.doc.meta.resumo)}</td>
          </tr>
        {:else}
          <tr><td colspan="6" class="muted">Nada.</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .page.wide {
    max-width: none;
  }
  .toolbar input[type='search'] {
    width: 200px;
  }
  .toolbar .seg {
    flex-wrap: wrap;
  }
  .chs {
    white-space: nowrap;
  }
  .st {
    max-width: 380px;
  }
  .leg {
    display: block;
    margin-left: 0.3rem;
  }
  tr.jogado td {
    background: var(--ok-soft);
  }
</style>
