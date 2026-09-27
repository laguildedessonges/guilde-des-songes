// Typographie française appliquée aux textes libres (feuille Google, gazette,
// données du site) : la ponctuation haute — : ; ! ? » — ne doit jamais se
// retrouver seule en début de ligne. On remplace donc l'espace qui la précède
// par une espace insécable, que le navigateur refuse de couper.
const INSECABLE = ' '

// Espaces horizontales seulement, jamais un retour à la ligne : une description
// de la feuille peut en porter, et les changer en espace insécable souderait
// deux lignes que l'on voulait séparées.
const ESPACE = '[^\\S\\r\\n]+'

export function typo(texte) {
  return String(texte === null || texte === undefined ? '' : texte)
    .replace(new RegExp(ESPACE + '([:;!?»])', 'g'), INSECABLE + '$1')
    .replace(new RegExp('(«)' + ESPACE, 'g'), '$1' + INSECABLE)
}
