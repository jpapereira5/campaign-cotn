<script lang="ts">
  // A gaveta de edição da Grelha (docs/grelha.md, secções 9 e 10): a camada do DM. O sítio onde o DM edita diz que
  // tipo de edição é: uma coluna jogada dá correção ou verdade; uma coluna futura dá plano; o cabeçalho dá decisão.
  import { ui, world, fecharEdicao, abrirFicha, type Edicao } from '../lib/state.svelte'
  import { camada, registar, alterar, apagar, gravarPendentes } from '../lib/grelha/store.svelte'
  import { donaDe, TIPOS_ACONTECIMENTO } from '../lib/grelha/dona'
  import { ROTULO_TIPO, type Item, type TipoGrelha } from '../lib/grelha/modelo'
  import type { DmEntry, ReviewNote } from '../lib/grelha/dm'

  let { edicao }: { edicao: Edicao } = $props()

  const g = $derived(world.grelha)
  const indice = $derived(world.indice)
  const nome = (id: string) => indice.nome(id)
  const linha = $derived('linha' in edicao && edicao.linha ? g.linhas.find((l) => l.id === edicao.linha) : undefined)
  const coluna = $derived('col' in edicao && edicao.col ? g.colunas.find((c) => c.chave === edicao.col) : undefined)
  const jogada = $derived(!!coluna?.sessao)
  const celula = $derived(linha && coluna ? linha.celulas[coluna.chave] : undefined)
  const notas = $derived(linha ? camada.revisao.notes.filter((n) => n.status !== 'fechada' && n.kind !== 'ideia' && n.target?.row === linha.id && (!coluna || !n.target.col || n.target.col === coluna.chave)) : [])
  const respostas = $derived(new Map(camada.dm.filter((e) => e.kind === 'resposta' && !e.deleted).map((e) => [String(e.note), e])))
  const ideias = $derived(celula ? celula.itens.filter((i) => i.tipo === 'ideia') : [])
  const notaDe = (id: string | undefined): ReviewNote | undefined => camada.revisao.notes.find((n) => n.id === id)

  const TIPO_SUGERIDO: Partial<Record<TipoGrelha, string>> = { pc: 'cena', revelacao: 'pista', laco: 'relacao', promessa: 'promessa', decisao: 'escolha' }
  const ROTULO_AC: Record<string, string> = { relacao: 'relação', promessa: 'promessa', escolha: 'escolha', consequencia: 'consequência', pista: 'pista', cena: 'cena pessoal', estado: 'mudança de estado', registo: 'registo' }
  const TAGS: [string, string][] = [['so-dm', 'só DM'], ['ultima', 'última oportunidade'], ['trunfo', 'trunfo']]
  const ATITUDES = ['amigavel', 'neutro', 'desconfiado', 'hostil', 'por-conhecer', 'morto']
  const MARCAS = ['deve-nos', 'devemos-lhe', 'rancor', 'patrono']
  const TIPOS_NOVA: TipoGrelha[] = ['npc', 'facao', 'local', 'item', 'missao', 'decisao', 'promessa', 'relogio', 'gatilho', 'revelacao', 'semente', 'desfecho', 'laco', 'agenda', 'teoria', 'mesa']

  // ---- formulário de item (plano, facto em falta, verdade, correção) ----
  let aberto = $state<'novo' | 'editar' | 'corrigir' | null>(null)
  let alvo = $state<Item | null>(null)
  let texto = $state('')
  let factKind = $state('consequencia')
  let toca = $state<string[]>([])
  let origem = $state<string[]>([])
  let tags = $state<string[]>([])
  let preparado = $state(false)
  let soDm = $state(false)
  let pesquisa = $state('')
  let pesquisaOrigem = $state('')
  let fromIdea = $state<string | undefined>(undefined)

  function limpar() {
    aberto = null
    alvo = null
    texto = ''
    toca = []
    origem = []
    tags = []
    preparado = false
    soDm = false
    pesquisa = ''
    pesquisaOrigem = ''
    fromIdea = undefined
    factKind = linha ? (TIPO_SUGERIDO[linha.tipo] ?? 'consequencia') : 'consequencia'
  }
  $effect(() => {
    void edicao
    limpar()
    if (linha?.tipo === 'laco' && linha.id) {
      const d = indice.doc(linha.id)
      const par = Array.isArray(d?.meta.par) ? (d!.meta.par as string[]) : []
      toca = par.filter((p) => p !== linha.id)
    }
  })
  function novo() {
    limpar()
    aberto = 'novo'
  }
  function aceitarIdeia(it: Item) {
    const n = notaDe(it.nota)
    limpar()
    aberto = 'novo'
    texto = it.texto
    factKind = n?.factKind ?? factKind
    tags = [...(n?.tags ?? [])]
    fromIdea = it.nota
  }
  function editar(it: Item) {
    if (!it.dm) return
    limpar()
    aberto = 'editar'
    alvo = it
    texto = String(it.dm.text ?? '')
    factKind = it.dm.factKind ?? factKind
    toca = (it.dm.involves ?? []).filter((x) => x !== linha?.id)
    origem = [...(it.dm.origin ?? [])]
    tags = [...(it.dm.tags ?? [])]
    preparado = !!it.dm.prepared
    soDm = it.dm.kind === 'verdade'
  }
  function corrigir(it: Item) {
    limpar()
    aberto = 'corrigir'
    alvo = it
    texto = it.texto
    tags = [...(it.tags ?? [])]
  }
  const envolveTotal = $derived(linha ? [linha.id, ...toca.filter((t) => t !== linha.id)] : toca)
  const dona = $derived(donaDe(factKind, envolveTotal, world.tipoLinha))
  const donaNaGrelha = $derived(dona ? g.linhas.find((l) => l.id === dona) : undefined)
  const candidatos = $derived.by(() => {
    const q = pesquisa.trim().toLowerCase()
    if (q.length < 2) return [] as string[]
    return [...indice.ids].filter((id) => !toca.includes(id) && id !== linha?.id && (id.includes(q) || nome(id).toLowerCase().includes(q))).slice(0, 8)
  })
  /** Factos e planos de colunas anteriores ou iguais, para «nasce de». */
  const candidatosOrigem = $derived.by(() => {
    const q = pesquisaOrigem.trim().toLowerCase()
    const out: { id: string; label: string }[] = []
    const idxCol = coluna ? g.colunas.findIndex((c) => c.chave === coluna.chave) : g.colunas.length
    for (const l of g.linhas) {
      for (const c of g.colunas.slice(0, idxCol + 1)) {
        for (const it of l.celulas[c.chave]?.itens ?? []) {
          const id = it.ac?.id ?? (it.tipo === 'plano' ? it.dm?.id : undefined)
          if (!id || origem.includes(id)) continue
          const label = `${c.label} · ${l.nome}: ${it.texto}`
          if (!q || label.toLowerCase().includes(q) || id.includes(q)) out.push({ id, label })
        }
      }
    }
    return out.slice(0, 8)
  })
  const rotuloOrigem = (id: string): string => {
    for (const l of g.linhas) for (const c of g.colunas) for (const it of l.celulas[c.chave]?.itens ?? []) if (it.ac?.id === id || (it.tipo === 'plano' && it.dm?.id === id)) return `${c.label} · ${l.nome}: ${it.texto.slice(0, 60)}`
    return id
  }
  const podeGravar = $derived(texto.trim().length > 0 && (aberto === 'corrigir' || !!dona))
  let aGravar = $state(false)

  async function gravarItem() {
    if (!linha || !coluna || !podeGravar) return
    aGravar = true
    try {
      const comum = { text: texto.trim(), factKind, involves: envolveTotal, ...(origem.length ? { origin: origem } : {}), ...(tags.length ? { tags } : {}) }
      const msg = (k: string) => `grelha: ${k} ${linha.id} ${coluna.chave}`
      if (aberto === 'corrigir' && alvo?.ac) {
        await registar({ kind: 'correcao', fact: alvo.ac.id, row: linha.id, col: coluna.chave, patch: { text: texto.trim(), tags } }, msg('correção'))
      } else if (aberto === 'editar' && alvo?.dm) {
        await alterar(alvo.dm.id, { ...comum, ...(alvo.dm.kind === 'plano' ? { prepared: preparado } : {}) }, msg(alvo.dm.kind))
      } else if (jogada) {
        await registar({ kind: soDm ? 'verdade' : 'correcao', row: linha.id, col: coluna.chave, ...comum }, msg(soDm ? 'verdade' : 'facto em falta'))
      } else {
        await registar({ kind: 'plano', row: linha.id, col: coluna.chave, ...comum, prepared: preparado, ...(fromIdea ? { fromIdea } : {}) }, msg('plano'))
      }
      limpar()
    } finally {
      aGravar = false
    }
  }
  async function arquivar(it: Item) {
    if (!it.ac || !linha) return
    await registar({ kind: 'arquivo', fact: it.ac.id, row: linha.id }, `grelha: arquivar ${it.ac.id}`)
  }
  async function apagarItem(it: Item) {
    if (!it.dm) return
    await apagar(it.dm.id, `grelha: apagar ${it.dm.kind} ${it.dm.id}`)
  }
  async function rejeitarIdeia(it: Item) {
    if (!it.nota) return
    await registar({ kind: 'ideia-rejeitada', idea: it.nota, row: linha?.id }, `grelha: rejeitar ideia ${it.nota}`)
  }

  // ---- notas da revisão ----
  let resposta = $state<Record<string, string>>({})
  async function responder(n: ReviewNote, aceitar: boolean) {
    const text = aceitar ? (n.suggestion ?? '') : (resposta[n.id] ?? '').trim()
    if (!text) return
    await registar({ kind: 'resposta', note: n.id, row: n.target?.row, accepted: aceitar, text }, `grelha: resposta a ${n.id}`)
    resposta = { ...resposta, [n.id]: '' }
  }

  // ---- cabeçalho (decisão) ----
  let cab = $state({ legenda: '', quer: '', teme: '', atitudeAtual: '', marcas: [] as string[] })
  $effect(() => {
    if (edicao.modo === 'cabecalho' && linha) cab = { legenda: linha.legenda ?? '', quer: linha.quer ?? '', teme: linha.teme ?? '', atitudeAtual: linha.atitude ?? '', marcas: [...linha.marcas] }
  })
  async function gravarCabecalho() {
    if (!linha) return
    const patch: Record<string, unknown> = {}
    if (cab.legenda !== (linha.legenda ?? '')) patch.legenda = cab.legenda
    if (cab.quer !== (linha.quer ?? '')) patch.quer = cab.quer
    if (cab.teme !== (linha.teme ?? '')) patch.teme = cab.teme
    if (cab.atitudeAtual !== (linha.atitude ?? '')) patch.atitudeAtual = cab.atitudeAtual
    if (cab.marcas.join() !== linha.marcas.join()) patch.marcas = cab.marcas
    if (!Object.keys(patch).length) return fecharEdicao()
    await registar({ kind: 'decisao', row: linha.id, patch }, `grelha: decisão ${linha.id}`)
    fecharEdicao()
  }

  // ---- nota rápida ----
  let notaTexto = $state('')
  let notaLinha = $state('')
  let notaCol = $state('')
  let notaPesquisa = $state('')
  $effect(() => {
    if (edicao.modo === 'nota') {
      notaLinha = edicao.linha ?? ''
      notaCol = edicao.col ?? ''
    }
  })
  const candidatosNota = $derived.by(() => {
    const q = notaPesquisa.trim().toLowerCase()
    if (q.length < 2) return [] as string[]
    return g.linhas.filter((l) => !l.calculada && (l.id.includes(q) || l.nome.toLowerCase().includes(q))).map((l) => l.id).slice(0, 8)
  })
  async function gravarNota() {
    if (!notaTexto.trim()) return
    await registar({ kind: 'nota', text: notaTexto.trim(), ...(notaLinha ? { row: notaLinha } : {}), ...(notaCol ? { col: notaCol } : {}) }, 'grelha: nota rápida')
    notaTexto = ''
    fecharEdicao()
  }

  // ---- nova linha ----
  let novaTipo = $state<TipoGrelha>('npc')
  let novaNome = $state('')
  let novaId = $state('')
  let novaEnvolve = $state<string[]>([])
  let novaPesquisa = $state('')
  const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const prefixo = (t: TipoGrelha) => (t === 'npc' ? 'c-' : t === 'facao' ? 'f-' : t === 'local' ? 'l-' : t === 'item' ? 'i-' : t === 'revelacao' ? 'r-' : `t-${t}-`)
  $effect(() => {
    novaId = novaNome ? prefixo(novaTipo) + slug(novaNome) : ''
  })
  const candidatosNova = $derived.by(() => {
    const q = novaPesquisa.trim().toLowerCase()
    if (q.length < 2) return [] as string[]
    return [...indice.ids].filter((id) => !novaEnvolve.includes(id) && (id.includes(q) || nome(id).toLowerCase().includes(q))).slice(0, 8)
  })
  const novaValida = $derived(novaNome.trim().length > 0 && novaId.length > 2 && !indice.ids.has(novaId) && !g.linhas.some((l) => l.id === novaId) && (novaTipo !== 'laco' || novaEnvolve.length === 2))
  async function gravarNovaLinha() {
    if (!novaValida) return
    await registar({ kind: 'linha', row: novaId, patch: { id: novaId, type: novaTipo, name: novaNome.trim(), ...(novaEnvolve.length ? { envolve: novaEnvolve } : {}), ...(novaTipo === 'laco' ? { par: novaEnvolve } : {}) } }, `grelha: nova linha ${novaId}`)
    novaNome = ''
    novaEnvolve = []
    fecharEdicao()
  }

  // ---- acompanhar ----
  let acPesquisa = $state('')
  const candidatosAc = $derived.by(() => {
    const q = acPesquisa.trim().toLowerCase()
    if (q.length < 2) return [] as string[]
    const naGrelha = new Set(g.linhas.map((l) => l.id))
    return [...indice.ids].filter((id) => !naGrelha.has(id) && !id.startsWith('s-') && (id.includes(q) || nome(id).toLowerCase().includes(q))).slice(0, 10)
  })
  async function acompanhar(id: string) {
    await registar({ kind: 'acompanhar', row: id }, `grelha: acompanhar ${id}`)
    acPesquisa = ''
    fecharEdicao()
  }
</script>

<div class="panel">
  <div class="head">
    <span class="kind muted">
      {#if edicao.modo === 'celula'}Célula{:else if edicao.modo === 'cabecalho'}Cabeçalho{:else if edicao.modo === 'nota'}Nota rápida{:else if edicao.modo === 'nova-linha'}Nova linha{:else}Acompanhar{/if}
    </span>
    <span class="spacer"></span>
    <button class="icon ghost" onclick={fecharEdicao} title="Fechar (Esc)">✕</button>
  </div>
  <div class="body">
    {#if edicao.modo === 'celula' && linha && coluna}
      <h2><button class="lk" onclick={() => abrirFicha(linha.id)}>{linha.nome}</button> <span class="muted">· {coluna.label}</span></h2>
      <p class="muted small">{jogada ? 'Coluna jogada: o que escreveres aqui é uma correção do registo ou, com «só DM», uma verdade escondida.' : 'Coluna futura: o que escreveres aqui é um plano, e nunca é cânone antes de se jogar.'}</p>

      {#if celula?.itens.length}
        <h3>Nesta célula</h3>
        {#each celula.itens as it, i_ (i_)}
          {#if it.tipo === 'ideia'}
            <div class="it ideia">
              <div><span class="tag">ideia</span> {it.texto}</div>
              <div class="row"><button class="small" onclick={() => aceitarIdeia(it)}>Aceitar</button><button class="small ghost" onclick={() => rejeitarIdeia(it)}>Rejeitar</button></div>
            </div>
          {:else if it.tipo === 'facto' || it.tipo === 'plano' || it.tipo === 'nota'}
            <div class="it" class:dm={!!it.dm}>
              <div><span class="tag">{it.tipo === 'plano' ? 'plano' : it.tipo === 'nota' ? 'nota' : (ROTULO_AC[it.ac?.tipo ?? it.dm?.factKind ?? ''] ?? it.tipo)}</span>{#if it.estatuto && it.estatuto !== 'registo'} <span class="tag">{it.estatuto}</span>{/if}{#if it.dm} <span class="tag dmtag">✎ {it.dm.kind}</span>{/if}{#if it.porRever} <span class="tag rever">por rever</span>{/if} {it.texto}</div>
              {#if it.original}<div class="muted small">original: {it.original}</div>{/if}
              <div class="row">
                {#if it.ac && !it.dm}<button class="small" onclick={() => corrigir(it)}>Corrigir</button>{/if}
                {#if it.ac && (it.estatuto === 'aberto' || it.estatuto === 'esquecido')}<button class="small" onclick={() => arquivar(it)}>Arquivar</button>{/if}
                {#if it.dm && (it.dm.kind === 'plano' || it.dm.kind === 'correcao' || it.dm.kind === 'verdade')}<button class="small" onclick={() => editar(it)}>Editar</button>{/if}
                {#if it.dm}<button class="small ghost" onclick={() => apagarItem(it)}>Apagar</button>{/if}
              </div>
            </div>
          {/if}
        {/each}
      {/if}

      {#if !aberto}<div class="row"><button class="primary" onclick={novo}>{jogada ? 'Facto em falta' : 'Novo plano'}</button></div>{/if}

      {#if aberto}
        <h3>{aberto === 'corrigir' ? 'Corrigir o facto' : aberto === 'editar' ? 'Editar' : jogada ? 'Facto em falta' : 'Plano'}</h3>
        <label class="field"><span>Texto</span><textarea rows="3" bind:value={texto}></textarea></label>
        {#if aberto !== 'corrigir'}
          <label class="field"><span>Tipo</span>
            <select bind:value={factKind}>{#each TIPOS_ACONTECIMENTO as t (t)}<option value={t}>{ROTULO_AC[t]}</option>{/each}</select>
          </label>
          <div class="field"><span>Toca em</span>
            <div class="chips">{#each toca as t (t)}<button class="chip" onclick={() => (toca = toca.filter((x) => x !== t))} title="tirar">{nome(t)} ✕</button>{/each}</div>
            <input type="text" placeholder="procurar uma coisa…" bind:value={pesquisa} />
            {#if candidatos.length}<div class="lista">{#each candidatos as c (c)}<button class="opt" onclick={() => { toca = [...toca, c]; pesquisa = '' }}>{nome(c)} <small class="muted">{c}</small></button>{/each}</div>{/if}
          </div>
          <div class="field"><span>Nasce de</span>
            <div class="chips">{#each origem as o (o)}<button class="chip" onclick={() => (origem = origem.filter((x) => x !== o))} title="tirar">{rotuloOrigem(o)} ✕</button>{/each}</div>
            <input type="text" placeholder="procurar um facto ou plano anterior…" bind:value={pesquisaOrigem} />
            {#if pesquisaOrigem.trim().length >= 2 && candidatosOrigem.length}<div class="lista">{#each candidatosOrigem as c (c.id)}<button class="opt" onclick={() => { origem = [...origem, c.id]; pesquisaOrigem = '' }}>{c.label}</button>{/each}</div>{/if}
          </div>
        {/if}
        <div class="field"><span>Etiquetas</span>
          <div class="row">{#each TAGS as [t, r] (t)}<label class="chk"><input type="checkbox" checked={tags.includes(t)} onchange={() => (tags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} /> {r}</label>{/each}</div>
        </div>
        {#if aberto !== 'corrigir'}
          {#if jogada && aberto === 'novo'}<label class="chk"><input type="checkbox" bind:checked={soDm} /> Só DM: é uma verdade escondida, os jogadores não a viram</label>{/if}
          {#if !jogada}<label class="chk"><input type="checkbox" bind:checked={preparado} /> Preparado</label>{/if}
          <p class="small" class:err={!dona}>
            {#if dona}Fica na linha <b>{nome(dona)}</b>{#if !donaNaGrelha} <span class="muted">(ainda não está na Grelha: acrescenta-a com «Acompanhar»)</span>{/if}{:else}Dona ambígua: para «{ROTULO_AC[factKind]}» é precisa exatamente uma linha {factKind === 'relacao' ? 'de laço' : factKind === 'promessa' ? 'de promessa' : factKind === 'escolha' ? 'de decisão' : factKind === 'pista' ? 'de segredo' : factKind === 'cena' ? 'de PC' : ''} em «toca em». Se não existir, cria-a com «Nova linha».{/if}
          </p>
        {/if}
        <div class="row"><button class="primary" disabled={!podeGravar || aGravar} onclick={gravarItem}>Guardar</button><button onclick={limpar}>Cancelar</button></div>
      {/if}

      {#if notas.length}
        <h3>Notas da revisão</h3>
        {#each notas as n (n.id)}
          {@const r = respostas.get(n.id)}
          <div class="it nota">
            <div><span class="tag">{n.kind}</span> {n.text}</div>
            {#if n.suggestion}<div class="small"><b>Sugestão:</b> {n.suggestion}</div>{/if}
            {#if r}<div class="small ok">Respondido{r.accepted ? ' (aceitaste a sugestão)' : ''}: {r.text}</div>{:else}
              <div class="row">{#if n.suggestion}<button class="small" onclick={() => responder(n, true)}>Aceitar sugestão</button>{/if}</div>
              <div class="row"><input type="text" placeholder="a tua resposta…" bind:value={resposta[n.id]} style:flex="1" /><button class="small" onclick={() => responder(n, false)}>Responder</button></div>
            {/if}
          </div>
        {/each}
      {/if}
    {:else if edicao.modo === 'cabecalho' && linha}
      <h2>{linha.nome}</h2>
      <p class="muted small">Uma decisão tua sobre o mundo: entra no cânone depois da revisão.</p>
      <label class="field"><span>Legenda</span><input type="text" bind:value={cab.legenda} /></label>
      <label class="field"><span>Quer</span><input type="text" bind:value={cab.quer} /></label>
      <label class="field"><span>Teme</span><input type="text" bind:value={cab.teme} /></label>
      {#if ['npc', 'rival', 'facao', 'grupo'].includes(linha.tipo)}
        <label class="field"><span>Atitude para com o grupo</span>
          <select bind:value={cab.atitudeAtual}><option value="">—</option>{#each ATITUDES as a (a)}<option value={a}>{a}</option>{/each}</select>
        </label>
        <div class="field"><span>Marcas</span><div class="row">{#each MARCAS as m (m)}<label class="chk"><input type="checkbox" checked={cab.marcas.includes(m)} onchange={() => (cab.marcas = cab.marcas.includes(m) ? cab.marcas.filter((x) => x !== m) : [...cab.marcas, m])} /> {m}</label>{/each}</div></div>
      {/if}
      <div class="row"><button class="primary" onclick={gravarCabecalho}>Guardar</button><button onclick={fecharEdicao}>Cancelar</button></div>
    {:else if edicao.modo === 'nota'}
      <h2>Nota rápida</h2>
      <p class="muted small">Para registar já alguma coisa sem saber onde vai. O fecho seguinte transforma-a num facto ou numa ideia.</p>
      <label class="field"><span>Texto</span><textarea rows="4" bind:value={notaTexto}></textarea></label>
      <div class="field"><span>Linha (opcional)</span>
        {#if notaLinha}<div class="chips"><button class="chip" onclick={() => (notaLinha = '')}>{nome(notaLinha)} ✕</button></div>{:else}
          <input type="text" placeholder="procurar uma linha…" bind:value={notaPesquisa} />
          {#if candidatosNota.length}<div class="lista">{#each candidatosNota as c (c)}<button class="opt" onclick={() => { notaLinha = c; notaPesquisa = '' }}>{nome(c)}</button>{/each}</div>{/if}
        {/if}
      </div>
      <label class="field"><span>Coluna (opcional)</span><select bind:value={notaCol}><option value="">—</option>{#each g.colunas as c (c.chave)}<option value={c.chave}>{c.label} · {c.sub}</option>{/each}</select></label>
      <div class="row"><button class="primary" disabled={!notaTexto.trim()} onclick={gravarNota}>Guardar</button><button onclick={fecharEdicao}>Cancelar</button></div>
    {:else if edicao.modo === 'nova-linha'}
      <h2>Nova linha</h2>
      <p class="muted small">Cria uma coisa nova para acompanhar: um NPC improvisado, uma promessa, um laço. Entra no cânone depois da revisão.</p>
      <label class="field"><span>Tipo</span><select bind:value={novaTipo}>{#each TIPOS_NOVA as t (t)}<option value={t}>{ROTULO_TIPO[t]}</option>{/each}</select></label>
      <label class="field"><span>Nome</span><input type="text" bind:value={novaNome} placeholder={novaTipo === 'laco' ? 'ex.: Lucan ↔ Corvelo' : ''} /></label>
      <div class="field"><span>{novaTipo === 'laco' ? 'As duas linhas do laço' : 'Envolve'}</span>
        <div class="chips">{#each novaEnvolve as t (t)}<button class="chip" onclick={() => (novaEnvolve = novaEnvolve.filter((x) => x !== t))}>{nome(t)} ✕</button>{/each}</div>
        <input type="text" placeholder="procurar uma coisa…" bind:value={novaPesquisa} />
        {#if candidatosNova.length}<div class="lista">{#each candidatosNova as c (c)}<button class="opt" onclick={() => { novaEnvolve = [...novaEnvolve, c]; novaPesquisa = '' }}>{nome(c)} <small class="muted">{c}</small></button>{/each}</div>{/if}
      </div>
      <p class="small muted">id: <code>{novaId || '…'}</code>{#if novaId && (indice.ids.has(novaId) || g.linhas.some((l) => l.id === novaId))} <span class="err">já existe</span>{/if}</p>
      <div class="row"><button class="primary" disabled={!novaValida} onclick={gravarNovaLinha}>Criar</button><button onclick={fecharEdicao}>Cancelar</button></div>
    {:else if edicao.modo === 'acompanhar'}
      <h2>Acompanhar na Grelha</h2>
      <p class="muted small">Põe na Grelha uma coisa que já existe no cânone (um NPC, um local, um segredo, um fio).</p>
      <input type="text" placeholder="procurar…" bind:value={acPesquisa} />
      {#if candidatosAc.length}<div class="lista">{#each candidatosAc as c (c)}<button class="opt" onclick={() => acompanhar(c)}>{nome(c)} <small class="muted">{c}</small></button>{/each}</div>{/if}
    {/if}

    <div class="estado small muted">
      {#if camada.porGravar}<span class="err">Por gravar.</span> <button class="small" onclick={() => gravarPendentes()}>Tentar de novo</button>{/if}
      {#if camada.mensagem}<div>{camada.mensagem}</div>{/if}
    </div>
  </div>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    background: var(--bg-2);
    z-index: 1;
  }
  .kind {
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.75rem;
  }
  .spacer {
    flex: 1;
  }
  .body {
    padding: 0.8rem 0.9rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  h2 {
    margin: 0;
    font-size: 1.05rem;
  }
  h3 {
    margin: 0.6rem 0 0.2rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  .it {
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    padding: 0.4rem 0.5rem;
    font-size: 0.86rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .it.dm {
    border-color: var(--line-2);
  }
  .it.ideia {
    border-style: dashed;
  }
  .it.nota {
    border-color: #5a3f8a;
  }
  .tag {
    font-size: 0.66rem;
    padding: 0 0.35rem;
    border-radius: 4px;
    background: var(--bg-4);
    color: var(--muted);
  }
  .tag.dmtag {
    color: var(--accent);
  }
  .tag.rever {
    color: #c9a5ff;
  }
  .lk {
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }
  .lk:hover {
    color: var(--accent);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .field > span {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .chips .chip {
    cursor: pointer;
  }
  .lista {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line-2);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .opt {
    background: var(--bg-3);
    border: 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    padding: 0.35rem 0.5rem;
    color: var(--text);
    font: inherit;
    font-size: 0.84rem;
    cursor: pointer;
  }
  .opt:hover {
    background: var(--bg-4);
  }
  .chk {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    font-size: 0.84rem;
  }
  .err {
    color: var(--danger);
  }
  .ok {
    color: var(--ok);
  }
  .estado {
    margin-top: 0.6rem;
    border-top: 1px solid var(--line);
    padding-top: 0.5rem;
  }
  button.small {
    font-size: 0.78rem;
    padding: 0.2rem 0.5rem;
  }
</style>
