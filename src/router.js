import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import PartnersPage from './pages/PartnersPage.vue'
import AgendaPage from './pages/AgendaPage.vue'
import GazettePage from './pages/GazettePage.vue'
import GazetteIssuePage from './pages/GazetteIssuePage.vue'
import ResourcesPage from './pages/ResourcesPage.vue'
import HistoryPage from './pages/HistoryPage.vue'

// Hauteur à dégager au-dessus d'une ancre : l'entête collante, plus une
// respiration. On mesure l'entête, seule mesure sûre — `--band-height` est
// exprimée en rem, et `parseInt('5.75rem')` renvoyait « 5 » : les sections
// arrivaient 21 px sous le haut de la fenêtre, c'est-à-dire cachées derrière
// une entête de 92 px. La conversion de la variable ne sert que de repli, avant
// que l'entête ne soit montée.
//
// Vue Router calcule la position lui-même et ignore le `scroll-margin-top` du
// CSS : ce décalage doit donc être donné ici, même si la feuille de style en
// porte un pour les sauts d'ancre natifs au chargement.
function decalageEntete() {
  const RESPIRATION = 16

  const entete = document.querySelector('.header')
  if (entete) return entete.getBoundingClientRect().height + RESPIRATION

  const racine = getComputedStyle(document.documentElement)
  const rem = parseFloat(racine.fontSize) || 16
  const bande = parseFloat(racine.getPropertyValue('--band-height')) || 5.75
  return bande * rem + RESPIRATION
}

// URL propres (/agenda) plutôt que /#/agenda. Le serveur doit renvoyer
// index.html pour toute route inconnue : c'est le rôle de `public/.htaccess`
// (Apache, OVH) et de `public/404.html` (GitHub Pages). En dev, Vite le fait.
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/partenaires', name: 'partners', component: PartnersPage },
    { path: '/agenda', name: 'agenda', component: AgendaPage },
    { path: '/gazette', name: 'gazette', component: GazettePage },
    { path: '/gazette/:slug', name: 'gazette-issue', component: GazetteIssuePage },
    { path: '/ressources', name: 'resources', component: ResourcesPage },
    // Ouverte depuis la pastille de l'accueil, pas depuis la barre de menus.
    { path: '/notre-histoire', name: 'history', component: HistoryPage },
    // URL inconnue : retour à l'accueil plutôt qu'une page blanche.
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    // Décalage de l'entête collante : on arrive sur le titre de la section,
    // jamais au milieu de ses vignettes (les sections commencent par leur titre).
    if (to.hash) {
      return { el: to.hash, top: decalageEntete(), behavior: 'smooth' }
    }
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})
