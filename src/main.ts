import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, { target: document.getElementById('app')! })

if (import.meta.env.DEV) {
  import('./lib/state.svelte').then((state) => ((window as unknown as { __cc: unknown }).__cc = state))
}

export default app
