import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages en sous-dossier (laguildedessonges.github.io/guilde-des-songes/)
// exige BASE_PATH=/guilde-des-songes/ ; sur un domaine propre, la racine suffit.
const base = process.env.BASE_PATH || '/'

// Les URL sont propres (/agenda) : un hébergeur statique doit renvoyer
// index.html pour ces routes. GitHub Pages sert 404.html dans ce cas — on en
// fait donc une copie d'index.html. (Apache/OVH est couvert par .htaccess.)
const fallback404 = {
  name: 'fallback-404',
  closeBundle() {
    const dist = resolve(import.meta.dirname, 'dist')
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), fallback404],
})
