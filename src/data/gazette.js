// Gazette rôlistique : un fichier Markdown par numéro dans `src/gazette/`.
// Déposer un nouveau .md suffit — il est repéré, trié et publié automatiquement.
//
// Chaque fichier commence par un front-matter :
//   ---
//   title: La rentrée des songes
//   numero: 1
//   date: 2026-08-01
//   excerpt: Une phrase de résumé affichée dans la liste.
//   ---
//
// `title` porte le titre seul : le numéro se lit en dessous, en plus petit, et
// n'a donc rien à faire dans le titre lui-même.
//
// Les numéros ne se consultent qu'en ligne : pas de téléchargement, le bouton
// « Partager le numéro » ne fait que donner son lien.
//
// Un résumé de session est long : il s'écrit dans un bloc replié, dont seul le
// premier paragraphe se lit d'emblée.
//
//   :::resume Chapitre 11 — La Passerelle
//   Premier paragraphe : l'aperçu, toujours visible.
//
//   Le reste du résumé, déplié au clic.
//   :::
//
// Toute date du numéro se présente en mini carte de calendrier. Une entrée
// datée — une soirée du programme — s'écrit ainsi, la carte à gauche et le
// texte à côté :
//
//   :::date 2026-09-11
//   Greg lance un scénario test à l'Annexe, à 19h30.
//   :::
//
// Deux jours d'affilée s'écrivent « 2026-09-05..2026-09-06 », et `sans-lien`
// retire le renvoi vers l'agenda, pour une date qui n'y figure pas.
//
// Une simple série de dates s'annonce en rangée centrée de ces mêmes cartes —
// plus lisible qu'une liste à puces d'une ligne par date :
//
//   :::soirees
//   2026-11-21
//   2026-12-12
//   :::
import { marked } from 'marked'
import { typo } from '../typographie.js'
import { liensExternesACote, typographier } from './prose.js'

const files = import.meta.glob('../gazette/*.md', { query: '?raw', import: 'default', eager: true })

// Blocs `:::resume Titre … :::`, mis de côté avant la conversion et remis en
// place après : laissés au convertisseur Markdown, les deux-points ne seraient
// que des paragraphes de plus.
const BLOC_RESUME = /^:::resume[ \t]+(.+)\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm
const BLOC_SOIREES = /^:::soirees[ \t]*\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm
const BLOC_DATE = /^:::date[ \t]+([^\n]+)\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm

// Une date de soirée se lit dans une mini carte de calendrier : le jour en
// grand, le mois et l'année en petit dessous. L'intitulé complet part dans
// `aria-label` — « 21 nov. 26 » suffit à l'œil, pas à la voix.
const CARTE_JOUR = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' })
const CARTE_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })
const DATE_COMPLETE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const EST_UNE_DATE = /^\d{4}-\d{2}-\d{2}$/

function enDate(iso) {
  const [annee, mois, jour] = iso.split('-').map(Number)
  return new Date(annee, mois - 1, jour)
}

// Une mini carte de calendrier : le jour en grand, le mois et l'année dessous.
// Deux jours d'affilée partagent une carte (« 05–06 »). Sans lien vers
// l'agenda, la carte reste un simple repère, pas une promesse de clic.
function carteDate(jours, { lien = true } = {}) {
  const dates = jours.map(enDate)
  const premiere = dates[0]
  const derniere = dates[dates.length - 1]

  const jour = dates.map((date) => CARTE_JOUR.format(date)).join('–')
  const intitule =
    dates.length > 1
      ? `du ${DATE_COMPLETE.format(premiere)} au ${DATE_COMPLETE.format(derniere)}`
      : DATE_COMPLETE.format(premiere)

  const dedans =
    '<span class="carte-date__anneaux" aria-hidden="true"></span>' +
    `<span class="carte-date__jour">${jour}</span>` +
    `<span class="carte-date__mois">${CARTE_MOIS.format(premiere)}</span>`

  if (!lien) {
    return `<span class="carte-date" role="img" aria-label="${intitule}">${dedans}</span>`
  }

  return (
    `<a class="carte-date carte-date--lien" href="/agenda?jour=${jours[0]}" ` +
    `aria-label="${intitule}">${dedans}</a>`
  )
}

function rangeeDeSoirees(contenu) {
  const jours = contenu.split(/\s+/).filter((jour) => EST_UNE_DATE.test(jour))
  return `<div class="soirees">${jours.map((jour) => carteDate([jour])).join('')}</div>`
}

// Entrée datée du programme : la carte à gauche, le texte à côté.
function entreeDatee(parametres, contenu) {
  const jetons = parametres.trim().split(/\s+/)
  const jours = jetons[0].split('..').filter((jour) => EST_UNE_DATE.test(jour))
  if (!jours.length) return ''

  const lien = !jetons.includes('sans-lien')

  return (
    '<div class="programme">' +
    carteDate(jours, { lien }) +
    `<div class="programme__texte">${typographier(marked.parse(contenu))}</div>` +
    '</div>'
  )
}

// Front-matter minimal : `clé: valeur` ligne par ligne entre deux `---`.
function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }

  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(':')
    if (sep === -1) continue
    meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim()
  }
  return { meta, body: match[2] }
}

export const issues = Object.entries(files)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontMatter(raw)
    return {
      // Le nom du fichier sert d'URL : `2026-08-gazette.md` → /gazette/2026-08-gazette
      slug: path.split('/').pop().replace(/\.md$/, ''),
      title: meta.title || 'Numéro sans titre',
      numero: meta.numero || '',
      date: meta.date || '',
      excerpt: meta.excerpt || '',
      html: enHtml(body),
    }
  })
  // Plus récent en premier
  .sort((a, b) => b.date.localeCompare(a.date))

function enHtml(markdown) {
  const resumes = []
  const rangees = []
  const entrees = []

  const sansBlocs = markdown
    .replace(BLOC_RESUME, (_, titre, contenu) => {
      const place = resumes.push({ titre: titre.trim(), contenu: contenu.trim() }) - 1
      return `\n\nJETONRESUME${place}\n\n`
    })
    .replace(BLOC_SOIREES, (_, contenu) => {
      const place = rangees.push(contenu.trim()) - 1
      return `\n\nJETONSOIREES${place}\n\n`
    })
    .replace(BLOC_DATE, (_, parametres, contenu) => {
      const place = entrees.push({ parametres, contenu: contenu.trim() }) - 1
      return `\n\nJETONDATE${place}\n\n`
    })

  let html = typographier(marked.parse(sansBlocs))

  rangees.forEach((contenu, place) => {
    html = html.replace(`<p>JETONSOIREES${place}</p>`, rangeeDeSoirees(contenu))
  })

  entrees.forEach(({ parametres, contenu }, place) => {
    html = html.replace(`<p>JETONDATE${place}</p>`, entreeDatee(parametres, contenu))
  })

  resumes.forEach(({ titre, contenu }, place) => {
    const paragraphes = contenu.split(/\r?\n\s*\r?\n/)
    // Le premier paragraphe reste en vue ; le reste attend le clic.
    const apercu = paragraphes.shift() || ''
    const suite = paragraphes.join('\n\n')

    const bloc =
      '<details class="resume">' +
      '<summary class="resume__tete">' +
      `<span class="resume__titre">${typo(titre)}</span>` +
      `<span class="resume__apercu">${typographier(
        marked.parseInline(apercu.replace(/\r?\n/g, ' ')),
      )}</span>` +
      '</summary>' +
      `<div class="resume__suite">${typographier(marked.parse(suite))}</div>` +
      '</details>'

    html = html.replace(`<p>JETONRESUME${place}</p>`, bloc)
  })

  return liensExternesACote(avecCheminDePublication(html))
}

// Un numéro renvoie vers le site lui-même (l'agenda, par exemple) : le
// Markdown écrit ces liens à la racine (« /agenda?jour=… »), et le chemin de
// publication leur est ajouté ici, une fois pour toutes. Sans ça, ils
// viseraient la racine du domaine — hors du site, que GitHub Pages sert dans un
// sous-dossier. Les liens protocole-relatifs (« //hôte ») sont laissés tels
// quels : ils désignent un autre site.
function avecCheminDePublication(html) {
  const base = import.meta.env.BASE_URL // finit toujours par « / »
  return html.replace(/href="\/(?!\/)/g, `href="${base}`)
}


export function findIssue(slug) {
  return issues.find((issue) => issue.slug === slug)
}
