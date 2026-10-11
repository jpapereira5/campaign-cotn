<script lang="ts">
  // Ícones de traço, em linha (o mockup não usa emoji). 20×20, traço 1.8, cor herdada.
  let { nome, tamanho = 18 }: { nome: 'grelha' | 'grafo' | 'sessao' | 'indice' | 'definicoes' | 'pesquisa' | 'ficha'; tamanho?: number } = $props()
</script>

<svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if nome === 'grelha'}
    <rect x="2.5" y="3" width="15" height="14" rx="2" /><path d="M2.5 8h15M2.5 12.5h15M8 3v14" />
  {:else if nome === 'grafo'}
    <circle cx="5" cy="6" r="2.2" /><circle cx="15" cy="5" r="2.2" /><circle cx="10" cy="15" r="2.2" /><path d="M7 7l1.5 6M13 6.5l-1.5 6.5M7.2 6.2l5.6-.9" />
  {:else if nome === 'sessao'}
    <rect x="3" y="3" width="14" height="14" rx="3" /><circle cx="7" cy="7" r="1.1" fill="currentColor" stroke="none" /><circle cx="13" cy="13" r="1.1" fill="currentColor" stroke="none" /><circle cx="13" cy="7" r="1.1" fill="currentColor" stroke="none" /><circle cx="7" cy="13" r="1.1" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none" />
  {:else if nome === 'indice'}
    <path d="M4 4h12v12H4z" /><path d="M7 7.5h6M7 10.5h6M7 13.5h3" />
  {:else if nome === 'definicoes'}
    <circle cx="10" cy="10" r="2.6" /><path d="M10 2.8v2.2M10 15v2.2M2.8 10H5M15 10h2.2M4.9 4.9l1.6 1.6M13.5 13.5l1.6 1.6M4.9 15.1l1.6-1.6M13.5 6.5l1.6-1.6" />
  {:else if nome === 'pesquisa'}
    <circle cx="8.8" cy="8.8" r="5.2" /><path d="M12.8 12.8L17 17" />
  {:else}
    <path d="M5 3h7l3 3v11H5z" /><path d="M12 3v3h3M7.5 10h5M7.5 13h5" />
  {/if}
</svg>
