<script lang="ts">
  import { world, store, loadRemote, saveRemote, discardLocalChanges, exportDirty, exportAll, importAll } from '../lib/state.svelte'
  import { getToken, setToken, checkToken, REPO } from '../lib/github'

  let token = $state(getToken())
  let check = $state<{ ok: boolean; login?: string; canPush?: boolean; message?: string } | null>(null)
  let fileInput: HTMLInputElement

  async function save() {
    setToken(token.trim())
    check = token.trim() ? await checkToken() : null
    if (check?.ok) await loadRemote()
  }
  const errors = $derived(world.problems.filter((p) => p.level === 'error'))
  const warns = $derived(world.problems.filter((p) => p.level === 'warn'))
  let showWarns = $state(false)
</script>

<div class="page">
  <div class="grid settings">
    <div class="card">
      <h4>Sincronização com o GitHub</h4>
      <p class="muted small">A app lê e escreve <code>data/*.json</code> em <code>{REPO.owner}/{REPO.repo}</code> (branch <code>{REPO.branch}</code>), para funcionar igual em qualquer PC. Cria um <i>fine-grained personal access token</i> em GitHub → Settings → Developer settings → Personal access tokens, com acesso só a este repositório e permissão <b>Contents: Read and write</b>. O token fica apenas neste browser.</p>
      <div class="row">
        <input type="password" placeholder="github_pat_…" bind:value={token} style:flex="1" style:min-width="220px" />
        <button class="primary" onclick={save}>Ligar</button>
        <button onclick={() => { token = ''; setToken(''); check = null }}>Remover</button>
      </div>
      {#if check}
        <p class={check.ok ? 'ok' : 'err'}>{check.ok ? `Ligado como ${check.login ?? '?'} · ${check.canPush ? 'pode escrever' : 'só leitura'}` : `Falhou: ${check.message}`}</p>
      {/if}
      <div class="row" style:margin-top="0.6rem">
        <button onclick={() => loadRemote()} disabled={!getToken() || store.sync.status === 'loading'}>↻ Recarregar do repositório</button>
        <button class="primary" onclick={() => saveRemote()} disabled={!world.dirtyFiles.length || store.sync.status === 'saving'}>💾 Gravar ({world.dirtyFiles.length})</button>
        <button class="danger" onclick={() => confirm('Descartar todas as alterações locais por gravar?') && discardLocalChanges()} disabled={!world.dirtyFiles.length}>Descartar locais</button>
      </div>
      {#if store.sync.message}<p class="muted small">{store.sync.message}</p>{/if}
      {#if world.dirtyFiles.length}
        <div class="muted small">Por gravar:</div>
        <ul class="small">{#each world.dirtyFiles as f (f.path)}<li><code>{f.path}</code></li>{/each}</ul>
      {/if}
    </div>

    <div class="card">
      <h4>Sem token: exportar / importar</h4>
      <p class="muted small">Sem token, as alterações ficam neste browser. Exporta os ficheiros alterados e faz commit à mão em <code>data/</code>, ou exporta tudo para levar para outro PC.</p>
      <div class="row">
        <button onclick={exportDirty} disabled={!world.dirtyFiles.length}>Exportar alterados</button>
        <button onclick={exportAll}>Exportar tudo</button>
        <button onclick={() => fileInput.click()}>Importar…</button>
        <input type="file" accept="application/json" hidden bind:this={fileInput} onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importAll(f); (e.target as HTMLInputElement).value = '' }} />
      </div>
    </div>

    <div class="card">
      <h4>Atalhos</h4>
      <ul class="small plain keys">
        <li><kbd>Ctrl</kbd>+<kbd>K</kbd> ou <kbd>/</kbd> pesquisar</li>
        <li><kbd>Esc</kbd> fechar o painel de detalhe</li>
        <li>Duplo clique num beat da linha temporal: marcar jogado</li>
        <li>Grafo: arrastar move, <kbd>Shift</kbd> fixa o nó, roda faz zoom</li>
      </ul>
    </div>
  </div>

  <h3 class="section-title">Problemas nos dados <span class="muted">· {errors.length} erros, {warns.length} avisos</span></h3>
  <p class="muted small">Os erros são referências a ids inexistentes ou ids duplicados; os avisos são sugestões (revelações com menos de 3 pistas, personagens sem cenas, etc.). Corrigem-se nos JSON em <code>data/</code> ou na app.</p>
  {#if errors.length}
    <ul class="problems">{#each errors as p, i (i)}<li class="err">✖ <code>{p.where}</code> {p.message}</li>{/each}</ul>
  {:else}
    <p class="ok small">✓ Sem erros.</p>
  {/if}
  {#if warns.length}
    <button class="small" onclick={() => (showWarns = !showWarns)}>{showWarns ? 'Esconder' : 'Mostrar'} {warns.length} avisos</button>
    {#if showWarns}<ul class="problems">{#each warns as p, i (i)}<li class="warn">⚠ <code>{p.where}</code> {p.message}</li>{/each}</ul>{/if}
  {/if}
</div>

<style>
  .settings {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
  .problems {
    max-height: 50vh;
    overflow: auto;
    font-size: 0.85em;
    padding-left: 1rem;
    margin-top: 0.5rem;
  }
  .keys li {
    margin: 0.3rem 0;
  }
  button.small {
    font-size: 0.86em;
    padding: 0.25rem 0.6rem;
  }
</style>
