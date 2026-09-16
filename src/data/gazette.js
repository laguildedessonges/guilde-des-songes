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
import { marked } from 'marked'
import { typo } from '../typographie.js'

const files = import.meta.glob('../gazette/*.md', { query: '?raw', import: 'default', eager: true })

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
      // Typographie appliquée au texte seul : les balises restent intactes.
      html: avecCheminDePublication(
        marked
          .parse(body)
          .split(/(<[^>]*>)/)
          .map((morceau) => (morceau.startsWith('<') ? morceau : typo(morceau)))
          .join(''),
      ),
    }
  })
  // Plus récent en premier
  .sort((a, b) => b.date.localeCompare(a.date))

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
