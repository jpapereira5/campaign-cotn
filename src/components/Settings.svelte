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
</script>

<div class="page">
  <h2>Definições</h2>

  <h3>Sincronização com o GitHub</h3>
  <p class="muted">A app lê e escreve <code>data/*.json</code> em <code>{REPO.owner}/{REPO.repo}</code> (branch <code>{REPO.branch}</code>), para funcionar igual em qualquer PC. Cria um <i>fine-grained personal access token</i> em GitHub → Settings → Developer settings → Personal access tokens → Fine-grained, com acesso só a este repositório e permissão <b>Contents: Read and write</b>. O token fica apenas no <code>localStorage</code> deste browser.</p>
  <div class="row">
    <input type="password" placeholder="github_pat_…" bind:value={token} style:width="360px" />
    <button class="primary" onclick={save}>Guardar token e ligar</button>
    <button onclick={() => { token = ''; setToken(''); check = null }}>Remover</button>
  </div>
  {#if check}
    <p class={check.ok ? 'ok' : 'err'}>{check.ok ? `Ligado como ${check.login ?? '?'} · ${check.canPush ? 'pode escrever' : 'só leitura'}` : `Falhou: ${check.message}`}</p>
  {/if}
  <div class="row">
    <button onclick={() => loadRemote()} disabled={!getToken() || store.sync.status === 'loading'}>↻ Recarregar do repositório</button>
    <button class="primary" onclick={() => saveRemote()} disabled={!world.dirtyFiles.length || store.sync.status === 'saving'}>💾 Gravar alterações ({world.dirtyFiles.length})</button>
    <button class="danger" onclick={() => confirm('Descartar todas as alterações locais por gravar?') && discardLocalChanges()} disabled={!world.dirtyFiles.length}>Descartar alterações locais</button>
  </div>
  <p class="muted">{store.sync.message}</p>
  {#if world.dirtyFiles.length}
    <ul>{#each world.dirtyFiles as f (f.path)}<li><code>{f.path}</code></li>{/each}</ul>
  {/if}

  <h3>Sem token: exportar / importar</h3>
  <p class="muted">Sem token, as alterações ficam neste browser. Exporta os ficheiros alterados e faz commit à mão em <code>data/</code>, ou exporta tudo para levar para outro PC.</p>
  <div class="row">
    <button onclick={exportDirty} disabled={!world.dirtyFiles.length}>Exportar ficheiros alterados</button>
    <button onclick={exportAll}>Exportar tudo (um JSON)</button>
    <button onclick={() => fileInput.click()}>Importar…</button>
    <input type="file" accept="application/json" hidden bind:this={fileInput} onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importAll(f); (e.target as HTMLInputElement).value = '' }} />
  </div>

  <h3>Problemas nos dados <span class="muted">({errors.length} erros, {warns.length} avisos)</span></h3>
  <p class="muted">Os erros são referências a ids inexistentes ou ids duplicados; os avisos são sugestões (revelações com menos de 3 pistas, personagens sem cenas, etc.). Corrigem-se nos JSON em <code>data/</code> ou na app.</p>
  <ul class="problems">
    {#each errors as p (p.where + p.message)}<li class="err">✖ <code>{p.where}</code> {p.message}</li>{/each}
    {#each warns as p (p.where + p.message)}<li class="warn">⚠ <code>{p.where}</code> {p.message}</li>{/each}
  </ul>
</div>

<style>
  .problems {
    max-height: 50vh;
    overflow: auto;
    font-size: 0.85em;
    padding-left: 1rem;
  }
</style>
