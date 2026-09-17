import { copyFileSync, readdirSync, writeFileSync } from 'node:fs'
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

// Plan du site, écrit au build : les moteurs de recherche ne peuvent pas
// deviner les URL d'une application à routeur, faute de liens à suivre depuis
// un fichier statique. Les numéros de la gazette y entrent d'eux-mêmes, un
// fichier déposé dans src/gazette/ suffisant à les publier.
const DOMAINE = 'https://laguildedessonges.net'

const planDuSite = {
  name: 'plan-du-site',
  closeBundle() {
    const racine = import.meta.dirname
    const numeros = readdirSync(resolve(racine, 'src/gazette'))
      .filter((nom) => nom.endsWith('.md'))
      .map((nom) => `/gazette/${nom.replace(/\.md$/, '')}`)

    const pages = [
      '/',
      '/agenda',
      '/gazette',
      '/partenaires',
      '/ressources',
      '/notre-histoire',
      ...numeros,
    ]

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...pages.map((page) => `  <url><loc>${DOMAINE}${page}</loc></url>`),
      '</urlset>',
      '',
    ].join('\n')

    writeFileSync(resolve(racine, 'dist/sitemap.xml'), xml)
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), fallback404, planDuSite],
})
