// Présentation d'une partie : les libellés, couleurs et décomptes que le site
// affiche à partir d'une ligne de la feuille. Fonctions pures, partagées entre
// l'agenda et la gazette — qui ouvre les mêmes fenêtres d'événement — pour que
// les deux endroits disent exactement la même chose.
import { KIND_LABELS } from './events.js'
import { placesRestantes } from './sheet.js'
import { typo } from '../typographie.js'

// Le type vient de la feuille et pilote couleur et libellé ; la présence d'un
// formulaire d'inscription, elle, ne dépend que du nombre de places.
export function kindOf(event) {
  return event.kind || 'one-shot'
}

export function kindLabel(event) {
  return KIND_LABELS[kindOf(event)] || kindOf(event)
}

export function kindColor(event) {
  return `var(--kind-${kindOf(event)})`
}

// Places affichées : décompte réel venu de la feuille, sinon le texte de events.js.
//
// « 2/4 places restantes » plutôt que « 2 places restantes » : le total annoncé
// par le MJ reste sous les yeux, et l'écart entre les deux nombres montre ce que
// les intéressés relevés sur Discord ont déjà pris.
export function placesLabel(event) {
  const restantes = placesRestantes(event)
  if (restantes === null) return event.seats || ''
  if (restantes === 0) return 'Complet'

  const s = restantes > 1 ? 's' : ''
  return `${restantes}/${event.places} place${s} restante${s}`
}

// Le décompte des personnes annoncées ne se montre que sur les soirées
// mensuelles : c'est le créneau ouvert à tous, sans quota le plus souvent, où
// savoir combien de monde vient renseigne vraiment. Ailleurs, une table parle
// par son compteur de places, et seulement si le MJ en a annoncé un — afficher
// des inscrits sans total donnerait un chiffre que rien ne met en regard.
//
// Le libellé suit l'origine du décompte : les intéressés viennent de
// l'événement Discord, les inscrits du formulaire du site.
export function interetLabel(event) {
  if (kindOf(event) !== 'mensuelle') return ''

  const n = event.inscrits || 0
  if (!n) return ''

  if (event.signup) return `${n} intéressé·e${n > 1 ? 's' : ''} sur Discord`
  return `${n} inscrit·e${n > 1 ? 's' : ''}`
}

export function estComplet(event) {
  return placesRestantes(event) === 0
}

// Les cellules laissées vides dans la feuille ne doivent laisser aucune trace :
// on assemble les lignes d'information à partir des seuls champs remplis.
export function joindre(...parties) {
  return typo(parties.filter((p) => p && String(p).trim()).join(' · '))
}

// Une soirée mensuelle propose plusieurs tables : son étiquette se met au pluriel.
export function libelleJeu(event) {
  return kindOf(event) === 'mensuelle' ? 'Jeux' : 'Jeu'
}

// La colonne MJ de la feuille contient souvent « MJ : Marc » : l'étiquette de la
// vignette le dit déjà, on ne répète donc pas le préfixe.
export function sansPrefixeMJ(valeur) {
  return String(valeur || '').replace(/^\s*MJ\s*:\s*/i, '')
}

// Clé stable d'une ligne : la feuille n'a pas d'identifiant.
export function eventKey(event) {
  return event.date + event.title
}

// Date longue à la française, telle que l'agenda et la gazette l'annoncent en
// tête d'une fenêtre : « samedi 19 septembre ».
const dateLongue = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return dateLongue.format(new Date(y, m - 1, d))
}
