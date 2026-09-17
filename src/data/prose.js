// Texte long rédigé en Markdown — un numéro de la gazette, la lettre des
// fondateur·ices — converti en HTML pour le site.
//
// Partagé, et non enfermé dans la gazette : deux textes suivis méritent la même
// typographie et le même traitement des liens, sans en entretenir deux copies.
import { marked } from 'marked'
import { typo } from '../typographie.js'

// Typographie appliquée au texte seul : les balises restent intactes.
export function typographier(html) {
  return html
    .split(/(<[^>]*>)/)
    .map((morceau) => (morceau.startsWith('<') ? morceau : typo(morceau)))
    .join('')
}

// Un renvoi hors du site (la Fédération, le Discord de la Guilde…) s'ouvre à
// côté : suivi dans le même onglet, il ferait perdre au lecteur sa lecture.
export function liensExternesACote(html) {
  return html.replace(
    /<a href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener"',
  )
}

/** Markdown → HTML prêt à poser dans la page. */
export function enProse(markdown) {
  return liensExternesACote(typographier(marked.parse(markdown)))
}
