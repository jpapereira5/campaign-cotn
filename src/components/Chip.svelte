<script lang="ts">
  // Uma pílula com o nome de uma coisa; clicar abre a Ficha.
  import { world, abrirFicha } from '../lib/state.svelte'
  import { pastaDe, tipoDe } from '../lib/ficha'
  import { KIND_COLORS, FACTION_NODE_COLOR } from '../lib/colors'
  import type { TipoPersonagem } from '../lib/grafo'

  let { id, label }: { id: string; label?: string } = $props()

  const doc = $derived(world.indice.doc(id))
  const cor = $derived.by(() => {
    if (!doc) return '#888'
    const p = pastaDe(doc)
    if (p === 'personagens') return KIND_COLORS[(doc.meta.tipo as TipoPersonagem) ?? 'npc'] ?? '#888'
    if (p === 'facoes') return FACTION_NODE_COLOR
    if (p === 'beats') return world.campanha.corBeat(doc)
    if (p === 'fios') return typeof doc.meta.cor === 'string' ? doc.meta.cor : '#c7b7e0'
    if (p === 'locais') return '#7aa2a8'
    if (p === 'itens') return '#d9a441'
    if (p === 'segredos') return '#7B4DC2'
    return '#888'
  })
  const jogado = $derived(doc && pastaDe(doc) === 'beats' ? world.estado.beats.get(id)?.estado === 'jogado' : false)
  const texto = $derived(label ?? world.indice.nome(id))
</script>

<button class="ent" class:jogado onclick={(e) => { e.stopPropagation(); abrirFicha(id) }} title="{doc ? tipoDe(doc) : id}: {texto}{jogado ? ' · jogado' : ''}">
  <span class="dot" style:background={cor}></span><span class="t">{texto}</span>
</button>

<style>
  .t {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ent.jogado {
    opacity: 0.7;
    text-decoration: line-through;
  }
</style>
