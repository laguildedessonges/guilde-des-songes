// Affiches des conventions de la Guilde, dans l'ordre chronologique — la
// première en tête, comme on remonte le fil d'une histoire.
// Les fichiers vivent dans `src/documents/conventions/` : en déposer un et
// ajouter sa ligne ici suffit à l'afficher et à le rendre téléchargeable.
//
// Ce dossier est volontairement à part de `src/documents/` : la page Ressources
// y liste ses documents par un glob qui ne descend pas dans les sous-dossiers,
// et ces affiches n'ont rien à y faire.
const fichiers = import.meta.glob('../documents/conventions/*', {
  query: '?url',
  import: 'default',
  eager: true,
})

const entrees = [
  {
    fichier: '1995-affiche',
    titre: 'L’affiche des débuts',
    note: 'Espace Jeunes, rue de Moirey, à Saint-Apollinaire — les premières années.',
  },
  {
    fichier: '2014-conv-en-songes',
    titre: 'Conv’en Songes 2014',
    note: 'Les 29 et 30 mars, au centre social de la Fontaine d’Ouche.',
  },
  {
    fichier: '2018-conv-en-songes',
    titre: 'Conv’en Songes 2018',
    note: 'Les 7 et 8 avril, salle Devosges — la plus grande de toutes.',
  },
  {
    fichier: '2020-conv-en-songes',
    titre: 'Conv’en Songes 2020',
    note: 'Annoncée les 11 et 12 avril, salle Devosge — l’édition que le Covid a emportée.',
  },
]

function trouver(nom) {
  const entree = Object.entries(fichiers).find(([chemin]) => {
    const base = chemin.split('/').pop()
    return base.replace(/\.[^.]+$/, '') === nom
  })
  if (!entree) return {}
  return { url: entree[1], nomFichier: entree[0].split('/').pop() }
}

export const conventions = entrees
  .map((entree) => ({ ...entree, ...trouver(entree.fichier) }))
  // Une entrée dont le fichier n'a pas été déposé ne s'affiche pas.
  .filter((entree) => entree.url)
