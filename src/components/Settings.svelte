<script lang="ts">
  // Definições: o token do GitHub (a única coisa que a app precisa para gravar a tua camada), o estado da camada e os atalhos.
  import { world } from '../lib/state.svelte'
  import { getToken, setToken, checkToken, REPO } from '../lib/github'
  import { iniciarSonda, gravarPendentes, lerGrelhaRemota, camada } from '../lib/grelha/store.svelte'

  let token = $state(getToken())
  let check = $state<{ ok: boolean; login?: string; canPush?: boolean; message?: string } | null>(null)

  async function save() {
    setToken(token.trim())
    check = token.trim() ? await checkToken() : null
    if (check?.ok) {
      iniciarSonda()
      await gravarPendentes()
    }
  }
  const geradoEm = $derived(world.arvore.geradoEm ? new Date(world.arvore.geradoEm).toLocaleString('pt-PT') : '')
  const vivas = $derived(camada.dm.filter((e) => !e.deleted).length)
</script>

<div class="page">
  <div class="grid settings">
    <div class="card">
      <h4>O repositório</h4>
      <p class="small"><b>Como a app lê e escreve</b> (<code>docs/arquitetura.md</code>): o cânone e o registo vêm da estrutura nova (<code>mundo/</code>, <code>plano/</code>, <code>registo/</code>, <code>mesa/</code>), montada no build{#if geradoEm} ({geradoEm}){/if}; as alterações chegam com o deploy seguinte, em um ou dois minutos. A tua camada (<code>grelha/dm.json</code>) é a única coisa que a app grava: cada «Guardar» na Grelha, cada nota rápida e cada marca «jogado à mesa» faz logo um commit. Com o token, a app lê também <code>grelha/revisao.json</code> e <code>grelha/linhas.json</code> ao vivo e verifica de 30 em 30 segundos se o Claude deixou notas.</p>
      <p class="muted small">Para gravar é preciso o token: um <i>fine-grained personal access token</i> em GitHub → Settings → Developer settings → Personal access tokens, com acesso só a <code>{REPO.owner}/{REPO.repo}</code> (branch <code>{REPO.branch}</code>) e permissão <b>Contents: Read and write</b>. O token fica apenas neste browser. Sem token, o que editares fica só aqui e perde-se ao recarregar.</p>
      <div class="row">
        <input type="password" placeholder="github_pat_…" bind:value={token} style:flex="1" style:min-width="220px" />
        <button class="primary" onclick={save}>Ligar</button>
        <button onclick={() => { token = ''; setToken(''); check = null }}>Remover</button>
      </div>
      {#if check}
        <p class={check.ok ? 'ok' : 'err'}>{check.ok ? `Ligado como ${check.login ?? '?'} · ${check.canPush ? 'pode escrever' : 'só leitura'}` : `Falhou: ${check.message}`}</p>
      {/if}
      <div class="row" style:margin-top="0.6rem">
        <button onclick={() => lerGrelhaRemota()} disabled={!getToken() || camada.estado === 'a-ler'}>↻ Reler a camada do repositório</button>
        {#if camada.porGravar}<button class="primary" onclick={() => gravarPendentes()} disabled={camada.estado === 'a-gravar'}>💾 Gravar o que ficou por gravar</button>{/if}
      </div>
      <p class="muted small">A tua camada: {vivas} entradas vivas · fonte: {camada.fonte === 'repositorio' ? `repositório (lida às ${camada.ultimaLeitura})` : 'build'}{camada.porGravar ? ' · há edições por gravar' : ''}.</p>
      {#if camada.mensagem}<p class="small" class:err={camada.estado === 'erro'}>{camada.mensagem}</p>{/if}
    </div>

    <div class="card">
      <h4>Atalhos</h4>
      <ul class="small plain keys">
        <li><kbd>Ctrl</kbd>+<kbd>K</kbd> ou <kbd>/</kbd> pesquisar</li>
        <li><kbd>Esc</kbd> fechar a gaveta de edição ou a pesquisa</li>
        <li>Grelha: clique numa célula edita; clique numa linha abre a ficha; «Plano» mostra os arcos por capítulo</li>
        <li>Relações: um clique escolhe o nó, o segundo abre a ficha; arrastar move, <kbd>Shift</kbd> fixa o nó, roda faz zoom</li>
        <li>Sessão: ✓ marca um beat «jogado à mesa»; <kbd>Ctrl</kbd>+<kbd>Enter</kbd> regista a nota rápida</li>
      </ul>
      <p class="muted small">Os problemas nos dados aparecem no build (<code>npm run validate</code>), não aqui: o deploy só passa com zero erros.</p>
    </div>
  </div>
</div>

<style>
  .settings {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
  .keys li {
    margin: 0.3rem 0;
  }
</style>
