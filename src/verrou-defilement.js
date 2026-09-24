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
let hauteurRetenue = 0

// Hauteur défilable de la page, pour rapporter la position retenue à ce qu'elle
// vaut au moment de rendre la main.
function hauteurDefilable() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
}

export function verrouillerLaPage() {
  if (panneauxOuverts++ > 0) return

  positionRetenue = window.scrollY
  hauteurRetenue = hauteurDefilable()
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

  // Si la page a changé de forme pendant que le panneau la couvrait — le
  // téléphone qu'on tourne —, la position retenue ne désigne plus le même
  // passage : on la rapporte à la nouvelle hauteur plutôt que de renvoyer le
  // lecteur à un nombre de pixels qui ne veut plus rien dire.
  const hauteur = hauteurDefilable()
  const position =
    hauteur === hauteurRetenue
      ? positionRetenue
      : Math.round((positionRetenue / hauteurRetenue) * hauteur)

  // Le site défile en douceur (`scroll-behavior: smooth`) : sans cette
  // parenthèse, revenir à sa place se verrait comme un long glissement.
  const racine = document.documentElement
  const douceur = racine.style.scrollBehavior
  racine.style.scrollBehavior = 'auto'
  window.scrollTo(0, position)
  racine.style.scrollBehavior = douceur
}
