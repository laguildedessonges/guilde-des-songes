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

// Même pliage que `normaliser`, mais caractère pour caractère : rien n'est
// retiré ni fusionné, donc les positions correspondent à celles du texte
// d'origine. C'est ce qu'il faut pour découper un extrait autour d'un mot —
// `normaliser` raccourcit le texte (« , » devient « »), et la fenêtre se
// décalait d'autant que le passage comptait de ponctuation.
function plier(texte) {
  let plie = ''
  for (const caractere of String(texte || '')) {
    const base = caractere
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    plie +=
      base.length === caractere.length && /^[a-z0-9]+$/.test(base)
        ? base
        : ' '.repeat(caractere.length)
  }
  return plie
}

// Le convertisseur Markdown échappe apostrophes et chevrons : sans les rendre
// à leur caractère, « l'Annexe » se lit « l&#39; Annexe » dans les extraits, et
// « 39 » devient un mot cherchable.
function sansEntites(texte) {
  if (typeof document === 'undefined') return texte
  const zone = document.createElement('textarea')
  zone.innerHTML = texte
  return zone.value
}

function sansBalises(html) {
  return sansEntites(String(html || '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

// Les sources écrites en Markdown entrent telles quelles dans l'index : sans
// ce nettoyage, on cherche dans les astérisques et on les lit dans l'extrait
// (« **La Guilde des Songes** — association… »).
function sansMiseEnForme(source) {
  return String(source || '')
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^:::.*$/gm, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
    .replace(/^[ \t]{0,3}(?:[-*+]|\d+\.)[ \t]+/gm, '')
    .replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm, ' ')
    // Seules les marques appariées tombent : un astérisque isolé appartient au
    // texte (le numéro de Cerfa « 13972*02 » de la lettre des fondateurs).
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^\s*][^*]*?)\*/g, '$1')
    .replace(/_([^\s_][^_]*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
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
    texte: sansMiseEnForme(lettre),
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

  const place = plier(texte).indexOf(mot)
  if (place === -1) return texte.slice(0, 120)

  const debut = Math.max(0, place - 50)
  return (debut > 0 ? '…' : '') + texte.slice(debut, debut + 140).trim() + '…'
}
