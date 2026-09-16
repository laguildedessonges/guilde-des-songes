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
import { marked } from 'marked'
import { typo } from '../typographie.js'

const files = import.meta.glob('../gazette/*.md', { query: '?raw', import: 'default', eager: true })

// Blocs `:::resume Titre … :::`, mis de côté avant la conversion et remis en
// place après : laissés au convertisseur Markdown, les deux-points ne seraient
// que des paragraphes de plus.
const BLOC_RESUME = /^:::resume[ \t]+(.+)\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm

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

// Typographie appliquée au texte seul : les balises restent intactes.
function typographier(html) {
  return html
    .split(/(<[^>]*>)/)
    .map((morceau) => (morceau.startsWith('<') ? morceau : typo(morceau)))
    .join('')
}

function enHtml(markdown) {
  const resumes = []
  const sansResumes = markdown.replace(BLOC_RESUME, (_, titre, contenu) => {
    const place = resumes.push({ titre: titre.trim(), contenu: contenu.trim() }) - 1
    return `\n\nJETONRESUME${place}\n\n`
  })

  let html = typographier(marked.parse(sansResumes))

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

  return avecCheminDePublication(html)
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
