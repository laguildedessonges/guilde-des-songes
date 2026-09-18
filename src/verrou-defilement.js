// Verrou de défilement de la page, pour tout ce qui recouvre l'écran : le menu
// du téléphone, la fenêtre de l'agenda.
//
// `overflow: hidden` sur le corps de page ne suffit pas partout — sur iOS, la
// page continue de glisser sous le panneau au moindre réflexe de défilement.
// On la fige donc en `position: fixed`, en retenant où elle en était pour l'y
// ramener à la réouverture : figée telle quelle, elle remonterait en haut.
//
// Un compteur, et non un booléen : si deux panneaux se recouvrent, la
// fermeture du premier ne doit pas rendre la page au second.
let panneauxOuverts = 0
let positionRetenue = 0

export function verrouillerLaPage() {
  if (panneauxOuverts++ > 0) return

  positionRetenue = window.scrollY
  const corps = document.body
  corps.style.position = 'fixed'
  corps.style.top = `-${positionRetenue}px`
  corps.style.left = '0'
  corps.style.right = '0'
  corps.style.overflow = 'hidden'
}

export function deverrouillerLaPage() {
  if (panneauxOuverts === 0 || --panneauxOuverts > 0) return

  const corps = document.body
  corps.style.position = ''
  corps.style.top = ''
  corps.style.left = ''
  corps.style.right = ''
  corps.style.overflow = ''

  // Le site défile en douceur (`scroll-behavior: smooth`) : sans cette
  // parenthèse, revenir à sa place se verrait comme un long glissement.
  const racine = document.documentElement
  const douceur = racine.style.scrollBehavior
  racine.style.scrollBehavior = 'auto'
  window.scrollTo(0, positionRetenue)
  racine.style.scrollBehavior = douceur
}
