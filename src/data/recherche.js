// Recherche du site, entièrement côté navigateur : le site est statique, il n'y
// a pas de serveur à interroger. L'index tient dans le bundle — quelques pages,
// une poignée de documents et les numéros de la gazette — et les parties de
// l'agenda s'y ajoutent au moment de la recherche, puisqu'elles viennent de la
// feuille et changent sans qu'on reconstruise le site.
import { issues } from './gazette.js'
import { partners } from './partners.js'
import { ressources } from './ressources.js'
import { conventions } from './conventions.js'
import lettre from './lettre-fondateurs.md?raw'
import { formatDate, kindLabel } from './evenement-affichage.js'

// Comparaison indifférente aux accents, à la casse et aux traits d'union : on
// doit trouver « Heresia » en tapant « heresia », et « one-shot » avec « one shot ».
function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function sansBalises(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Pages et sections : ce que le menu propose, avec les mots qu'on emploierait
// pour les chercher sans connaître leur intitulé exact.
const PAGES = [
  {
    titre: 'Agenda',
    texte: 'Parties, campagnes, one-shot, soirées mensuelles, calendrier, inscriptions, places',
    to: { name: 'agenda' },
  },
  {
    titre: 'La Gazette rôlistique',
    texte: 'Journal de la Guilde, numéros, actualités, comptes rendus de session',
    to: { name: 'gazette' },
  },
  {
    titre: 'Partenaires',
    texte: 'Boutiques, bars, festivals et lieux qui accompagnent la Guilde',
    to: { name: 'partners' },
  },
  {
    titre: 'Ressources',
    texte: 'Documents de la Guilde : charte, flyer, statuts',
    to: { name: 'resources' },
  },
  {
    titre: 'Notre histoire',
    texte: 'La lettre des fondateurs, les affiches des conventions Conv’en Songes',
    to: { name: 'history' },
  },
  {
    titre: 'Qui sommes-nous',
    texte: 'Association de jeu de rôle à Dijon, tous niveaux, ambiance conviviale',
    to: { name: 'home', hash: '#qui-sommes-nous' },
  },
  {
    titre: 'Nos parties',
    texte: 'Campagnes, one-shot, soirées mensuelles ouvertes à tous',
    to: { name: 'home', hash: '#activites' },
  },
  {
    titre: 'Infos pratiques',
    texte: 'Créneaux, adresses, cotisation, adhésion, horaires, locaux',
    to: { name: 'home', hash: '#infos-pratiques' },
  },
  {
    titre: 'Nous rejoindre',
    texte: 'Adhésion, cotisation, Discord, première partie, contact',
    to: { name: 'home', hash: '#rejoindre' },
  },
]

// Index figé au build. Les parties de l'agenda n'y sont pas : elles arrivent de
// la feuille, et sont ajoutées à la recherche (voir `chercher`).
const INDEX = [
  ...PAGES.map((page) => ({ ...page, rubrique: 'Page' })),

  ...issues.map((numero) => ({
    rubrique: 'Gazette',
    titre: numero.numero ? `${numero.title} · Numéro ${numero.numero}` : numero.title,
    texte: `${numero.excerpt} ${sansBalises(numero.html)}`,
    to: { name: 'gazette-issue', params: { slug: numero.slug } },
  })),

  {
    rubrique: 'Notre histoire',
    titre: 'Une lettre des fondateurs de la Guilde',
    texte: lettre,
    to: { name: 'history' },
  },

  ...conventions.map((affiche) => ({
    rubrique: 'Notre histoire',
    titre: affiche.titre,
    texte: `Convention Conv’en Songes, affiche. ${affiche.note}`,
    to: { name: 'history' },
  })),

  ...partners.map((partenaire) => ({
    rubrique: 'Partenaire',
    titre: partenaire.name,
    texte: `${partenaire.address || ''} ${partenaire.text || ''}`,
    to: { name: 'partners' },
  })),

  ...ressources.map((document) => ({
    rubrique: 'Ressource',
    titre: document.name,
    texte: `${document.etat || ''} ${document.text || ''}`,
    to: { name: 'resources' },
  })),
].map((entree) => ({
  ...entree,
  cleTitre: normaliser(entree.titre),
  cleTexte: normaliser(entree.texte),
}))

// Une partie de l'agenda devient une entrée cherchable, qui ouvre son jour.
function depuisLAgenda(evenement) {
  const titre = evenement.title || ''
  const texte = [
    kindLabel(evenement),
    evenement.game,
    evenement.gm,
    evenement.place,
    evenement.text,
    formatDate(evenement.date),
  ]
    .filter(Boolean)
    .join(' ')

  return {
    rubrique: 'Agenda',
    titre,
    texte,
    detail: formatDate(evenement.date),
    to: { name: 'agenda', query: { jour: evenement.date } },
    cleTitre: normaliser(titre),
    cleTexte: normaliser(texte),
  }
}

/**
 * Résultats classés : le titre pèse plus que le corps, et tous les mots de la
 * requête doivent se trouver quelque part — chercher « heresia justin » ne doit
 * pas ramener tout ce qui parle de Justin.
 */
export function chercher(requete, evenements = []) {
  const mots = normaliser(requete).split(' ').filter(Boolean)
  if (!mots.length) return []

  const entrees = [...INDEX, ...evenements.map(depuisLAgenda)]

  return entrees
    .map((entree) => {
      let score = 0
      for (const mot of mots) {
        const dansLeTitre = entree.cleTitre.includes(mot)
        const dansLeTexte = entree.cleTexte.includes(mot)
        if (!dansLeTitre && !dansLeTexte) return null
        score += dansLeTitre ? 10 : 1
        if (entree.cleTitre.startsWith(mot)) score += 5
      }
      return { ...entree, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

/** Court extrait du texte autour du premier mot trouvé, pour situer le résultat. */
export function extrait(entree, requete) {
  const mot = normaliser(requete).split(' ').filter(Boolean)[0]
  const texte = entree.texte.replace(/\s+/g, ' ').trim()
  if (!mot) return texte.slice(0, 120)

  const place = normaliser(texte).indexOf(mot)
  if (place === -1) return texte.slice(0, 120)

  const debut = Math.max(0, place - 50)
  return (debut > 0 ? '…' : '') + texte.slice(debut, debut + 140).trim() + '…'
}
