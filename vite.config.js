import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
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

const DOMAINE = 'https://laguildedessonges.net'

// Les pages du site, numéros de la gazette compris : ils y entrent d'eux-mêmes,
// un fichier déposé dans src/gazette/ suffisant à les publier.
function pagesDuSite() {
  const numeros = readdirSync(resolve(import.meta.dirname, 'src/gazette'))
    .filter((nom) => nom.endsWith('.md'))
    .map((nom) => `/gazette/${nom.replace(/\.md$/, '')}`)

  return [
    '/',
    '/agenda',
    '/gazette',
    '/partenaires',
    '/ressources',
    '/notre-histoire',
    ...numeros,
  ]
}

// Plan du site, écrit au build : les moteurs de recherche ne peuvent pas
// deviner les URL d'une application à routeur, faute de liens à suivre depuis
// un fichier statique.
const planDuSite = {
  name: 'plan-du-site',
  closeBundle() {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...pagesDuSite().map((page) => `  <url><loc>${DOMAINE}${page}</loc></url>`),
      '</urlset>',
      '',
    ].join('\n')

    writeFileSync(resolve(import.meta.dirname, 'dist/sitemap.xml'), xml)
  },
}

// Une copie d'index.html par page. Sans elle, GitHub Pages répond par son
// 404.html : le visiteur voit bien la page, mais Google lit « introuvable » et
// refuse de l'indexer. Chaque copie porte sa propre adresse de référence, sans
// quoi toutes se déclareraient doublons de l'accueil.
// /agenda est servi par agenda.html ; /gazette/ (et toute adresse qui est aussi
// un dossier) par son index.html, d'où les deux fichiers.
const pagesIndexables = {
  name: 'pages-indexables',
  closeBundle() {
    const dist = resolve(import.meta.dirname, 'dist')
    const accueil = readFileSync(resolve(dist, 'index.html'), 'utf8')

    for (const page of pagesDuSite().filter((page) => page !== '/')) {
      const html = accueil
        .replace('<link rel="canonical" href="https://laguildedessonges.net/" />',
          `<link rel="canonical" href="${DOMAINE}${page}" />`)
        .replace('<meta property="og:url" content="https://laguildedessonges.net/" />',
          `<meta property="og:url" content="${DOMAINE}${page}" />`)

      for (const fichier of [`${page}.html`, `${page}/index.html`]) {
        const chemin = resolve(dist, fichier.slice(1))
        mkdirSync(dirname(chemin), { recursive: true })
        writeFileSync(chemin, html)
      }
    }
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), fallback404, planDuSite, pagesIndexables],
})
