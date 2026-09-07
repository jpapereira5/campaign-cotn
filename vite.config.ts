import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// BASE_PATH is set by the GitHub Pages workflow to "/<repo>/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte()],
})
