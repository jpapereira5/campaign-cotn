<script lang="ts">
  // Desbloquear um browser novo com a palavra-passe da mesa. É um formulário de login a sério (utilizador +
  // palavra-passe), para o gestor de palavras-passe do browser o guardar e preencher noutros browsers e dispositivos.
  import { camada, iniciarSonda, gravarPendentes, lerGrelhaRemota, marcarLigado } from '../lib/grelha/store.svelte'
  import { desbloquear } from '../lib/acesso'

  let { compacto = false }: { compacto?: boolean } = $props()
  let pass = $state('')
  let erro = $state('')
  let aDecifrar = $state(false)

  async function entrar(e: SubmitEvent) {
    e.preventDefault()
    if (!camada.acesso || !pass) return
    aDecifrar = true
    erro = ''
    try {
      await desbloquear(camada.acesso, pass)
      pass = ''
      marcarLigado()
      iniciarSonda()
      await lerGrelhaRemota()
      await gravarPendentes()
    } catch (x) {
      erro = (x as Error).message
    } finally {
      aDecifrar = false
    }
  }
</script>

{#if camada.acesso}
  <form class="desb" class:compacto onsubmit={entrar} action="#" method="post">
    <input type="text" name="username" autocomplete="username" value="campaign-cotn" readonly hidden />
    <label class="row nowrap">
      <span class="flabel">Palavra-passe da mesa</span>
      <input type="password" name="password" autocomplete="current-password" bind:value={pass} required placeholder="desbloquear este browser" />
    </label>
    <button class="primary" type="submit" disabled={aDecifrar || !pass}>{aDecifrar ? 'A abrir…' : 'Desbloquear'}</button>
    {#if erro}<span class="err small">{erro}</span>{/if}
  </form>
{/if}

<style>
  .desb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .desb input[type='password'] {
    min-width: 220px;
  }
  .compacto input[type='password'] {
    min-height: 32px;
    padding: 0.2rem 0.6rem;
  }
  .compacto button {
    padding: 0.25rem 0.8rem;
  }
</style>
