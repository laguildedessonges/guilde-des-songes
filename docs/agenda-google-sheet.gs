/**
 * Agenda et inscriptions de la Guilde → Google Sheets
 * ===================================================
 *
 * LES ONGLETS
 * -----------
 * • « Événements »      : parties classiques (campagne, one-shot) et
 *                         événements hors partie (assemblée, atelier, festival…).
 * • « OS mensuelles »   : les soirées one-shot mensuelles.
 * • « Inscriptions OS » : inscriptions aux soirées mensuelles.
 * • « Inscriptions événements » : inscriptions aux lignes de l'onglet
 *                         « Événements ».
 * • « Archives »        : trace des dates passées — l'événement ou la soirée,
 *                         groupé par type puis par date. Pas les inscriptions.
 *
 * QUI INSCRIT
 * -----------
 * La Guilde, à la main. Le site n'écrit rien dans ce classeur : son formulaire
 * prépare un message vers la boîte de l'association, parce qu'on préfère
 * échanger avec la personne avant de l'inscrire. Le script n'expose donc
 * qu'une lecture (`doGet`) — une écriture publique sans appelant n'aurait servi
 * qu'à laisser une porte ouverte.
 *
 * Les inscriptions arrivent ainsi par deux chemins :
 * • saisies à la main dans l'onglet « Inscriptions » correspondant ;
 * • relevées sur l'événement Discord (colonne « Lien Discord »), pour les
 *   personnes ayant cliqué « Intéressé·e ».
 *
 * OUVRIR (ET FERMER) LES INSCRIPTIONS
 * -----------------------------------
 * Tout se joue dans la colonne « Places » des deux onglets d'agenda, où l'on
 * écrit librement — pas de menu, pas de valeur refusée :
 * • vide       : ni formulaire ni compteur sur le site, aucune ligne créée.
 * • un nombre  : inscriptions ouvertes ; le site décompte les places restantes
 *                et bascule tout seul sur « Complet » au dernier inscrit.
 * • « Complet » : inscriptions fermées à la main. Le site affiche « Complet »
 *                sans compteur, et refuse toute nouvelle inscription — utile
 *                pour une table remplie hors du site (sur place, au Discord).
 * La casse et les fioritures sont corrigées à la saisie : « complet », « COMPLET »
 * et « complet !» deviennent « Complet ».
 *
 * CE QUI SE RANGE TOUT SEUL
 * -------------------------
 * • Colonne « Statut » (K) de l'onglet « Événements » : « à venir » ou
 *   « terminé », d'après la date. Le script l'écrit lui-même — à l'ouverture du
 *   classeur, dès qu'une date change, et chaque nuit. (Pas une formule : Google
 *   attend « ; » ou « , » selon la langue du classeur, et affiche #ERROR! dans
 *   l'autre cas. Une valeur ne dépend d'aucune langue.) Jamais publiée.
 * • Chaque nuit (et par le menu « Guilde › Ranger »), le script :
 *   – reconstruit « Archives » à partir des lignes terminées des deux onglets
 *     d'agenda, groupées par type puis par date, chaque catégorie annoncée par
 *     un bandeau gris à cellules fusionnées ;
 *   – regroupe chaque registre d'inscriptions par soirée, dans l'ordre
 *     d'arrivée (premier arrivé, premier servi), avec le même bandeau entre
 *     deux soirées, et renumérote les rangs.
 * Rien n'est déplacé ni supprimé : les parties passées restent dans leur onglet
 * (le calendrier du site les affiche en pastilles grisées) et les inscriptions
 * restent dans leur registre — « Archives » n'en garde que le nombre.
 *
 * SAISIE À PLUSIEURS
 * ------------------
 * • La colonne « Type » est une liste déroulante : aucune faute possible.
 * • Chaque ligne se colore automatiquement selon son type, avec les mêmes
 *   couleurs que le site : la feuille se lit d'un coup d'œil.
 * • « Date » n'accepte qu'une vraie date ; « Places » s'écrit librement.
 * • Chaque en-tête porte une note d'aide au survol.
 * • Tout ce qui est tapé est corrigé à la validation : « 20h » → « 20h00 »,
 *   « 10/10/2026 » → « 2026-10-10 », espaces superflus retirés (voir `onEdit`).
 * • Une cellule laissée vide n'est jamais un problème : le site n'affiche tout
 *   simplement pas l'information, sans blanc ni « à préciser ».
 *
 * MISE EN PLACE (une seule fois)
 * ------------------------------
 * 1. Extensions › Apps Script. Effacez l'éditeur, collez ce fichier, Enregistrer.
 * 2. Choisissez `initialiser` dans la liste de la barre d'outils, puis Exécuter.
 *    Autorisez l'accès quand Google le demande.
 * 3. Déployer › Nouveau déploiement : Application Web, exécuter en tant que Moi,
 *    accès Tout le monde. Copiez l'URL (elle finit par /exec) et collez-la dans
 *    SHEET_ENDPOINT, en haut de src/data/sheet.js.
 *
 * Après toute modification de ce script : Déployer › Gérer les déploiements ›
 * Modifier › Nouvelle version. (`initialiser` et `onEdit` sont actifs dès
 * l'enregistrement, sans redéploiement.)
 *
 * VENANT D'UNE VERSION PRÉCÉDENTE
 * -------------------------------
 * L'ancien script déplaçait les inscriptions passées dans « Archives ». Le
 * nouvel onglet ne contient plus que les parties, et il est reconstruit à
 * chaque passage. `initialiser` met donc l'ancien de côté sous le nom
 * « Archives (inscriptions, AAAA-MM-JJ) » : rien n'est perdu, et vous pouvez le
 * supprimer une fois vérifié.
 */

const ONGLET_EVENEMENTS = 'Événements'
const ONGLET_MENSUELLES = 'OS mensuelles'
const ONGLET_INSCRIPTIONS_OS = 'Inscriptions OS'
const ONGLET_INSCRIPTIONS_EVENEMENTS = 'Inscriptions événements'
const ONGLET_ARCHIVES = 'Archives'

// Lien avec les événements Discord. Le jeton du bot ne vit pas dans ce fichier :
// il se colle dans Paramètres du projet › Propriétés du script, sous ce nom.
const CLE_JETON_DISCORD = 'DISCORD_TOKEN'
const ORIGINE_DISCORD = 'Discord'

// Types de l'onglet « Événements ». Les soirées mensuelles ont leur propre
// onglet : elles ne figurent pas dans cette liste.
const TYPES = ['campagne', 'one-shot', 'événement']

// Code couleur du site : trait de la ligne, et fond très clair pour la lisibilité.
const COULEURS = {
  campagne: { trait: '#7c1226', fond: '#f3dfe4' },
  'one-shot': { trait: '#b01e33', fond: '#f9e3e6' },
  'événement': { trait: '#6f5566', fond: '#eee7ec' },
  mensuelle: { trait: '#d4586d', fond: '#fce7eb' },
}

// Colonne « Places ». La liste déroulante propose « Complet » et les quotas
// courants, mais la validation accepte n'importe quel autre nombre : la liste
// rend le geste rapide, elle ne l'enferme pas.
// Gris des bandeaux de séparation et des lignes déjà passées.
const GRIS_FOND = '#e7e2e2'
const GRIS_TRAIT = '#6b5b5e'

// Colonne « Statut » de l'onglet « Événements » : calculée, jamais publiée.
// Positions dans l'onglet « Événements ». Nommées, parce qu'un numéro nu au
// milieu du code se périme au premier déplacement de colonne.
const COLONNE_STATUT = 1
const COLONNE_DATE = 2
const COLONNE_HORAIRE = 3
const COLONNE_TYPE = 4
const COLONNE_DESCRIPTION = 9
const COLONNE_PLACES = 10
const COLONNE_LIEN = 11
const STATUT_TERMINE = 'terminé'
const STATUT_A_VENIR = 'à venir'

// Colonne « Places » : on y écrit librement un nombre ou le mot « Complet ».
const PLACES_COMPLET = 'Complet'

const AIDE_PLACES =
  'À écrire à la main. Un nombre ouvre les inscriptions et le site décompte ce ' +
  'qu\'il reste ; « Complet » les ferme. Vide : pas de compteur — les soirées ' +
  'mensuelles restent ouvertes aux inscriptions, les autres lignes renvoient au ' +
  'Discord ou n\'affichent rien.'

const COLONNES_EVENEMENTS = [
  {
    nom: 'Statut',
    largeur: 90,
    aide:
      'Rempli tout seul à partir de la date : « à venir » ou « terminé ». Se met ' +
      'à jour à l’ouverture du classeur, dès qu’une date change, et chaque nuit. ' +
      'Colonne de travail, jamais publiée sur le site — inutile d’y écrire, elle ' +
      'sera réécrite.',
  },
  { nom: 'Date', largeur: 110, aide: "Date de la partie. Tapez 10/10/2026 : la colonne l'affiche en 2026-10-10." },
  { nom: 'Horaire', largeur: 130, aide: 'Ex. 20h00, ou 18h30 – 23h45. « 20h » et « 20:00 » sont corrigés tout seuls. Peut rester vide.' },
  { nom: 'Type', largeur: 120, aide: 'Liste déroulante. « événement » = hors partie (assemblée, atelier, festival…).' },
  { nom: 'Titre', largeur: 240, aide: 'Nom affiché sur la vignette du site.' },
  { nom: 'Jeu', largeur: 170, aide: 'Système ou univers. Laissez vide pour un événement hors partie.' },
  { nom: 'Lieu', largeur: 170, aide: 'Ex. « Espace Baudelaire ». Peut rester vide.' },
  { nom: 'MJ', largeur: 140, aide: 'Ex. « MJ : Marc ». Peut rester vide.' },
  { nom: 'Description', largeur: 380, aide: 'Deux ou trois phrases, affichées quand on ouvre la ligne sur le site.' },
  { nom: 'Places', largeur: 90, aide: AIDE_PLACES },
  { nom: 'Lien Discord', largeur: 240, aide: 'Salon de la partie : le bouton « S’inscrire » du site y renvoie. Utilisé seulement si « Places » est vide.' },
]

const COLONNES_MENSUELLES = [
  { nom: 'Date', largeur: 110, aide: "Date de la soirée. Tapez 10/10/2026 : la colonne l'affiche en 2026-10-10." },
  { nom: 'Horaire', largeur: 140, aide: 'Ex. 18h30 – 23h45.' },
  { nom: 'Titre', largeur: 240, aide: 'Ex. « Soirée one-shot mensuelle ».' },
  { nom: 'Jeux', largeur: 170, aide: 'Jeux proposés ce soir-là. Ex. « Jeux variés ». Peut rester vide.' },
  { nom: 'Lieu', largeur: 170, aide: 'Ex. « Espace Baudelaire ».' },
  { nom: 'MJ', largeur: 140, aide: 'Peut rester vide.' },
  { nom: 'Description', largeur: 380, aide: 'Présentation de la soirée sur le site.' },
  { nom: 'Places', largeur: 90, aide: AIDE_PLACES },
  {
    nom: 'Lien Discord',
    largeur: 240,
    aide:
      'Lien de l’événement Discord de la soirée, s’il y en a un. Sert seulement ' +
      'à relever les « Intéressé·e » : leurs pseudos rejoignent le registre. Le ' +
      'site n’en reçoit rien et garde son formulaire — la soirée mensuelle doit ' +
      'rester ouverte à qui n’a pas de compte Discord.',
  },
]

// L'onglet « Archives » garde la trace des dates passées : l'événement ou la
// soirée, jamais le détail des inscriptions — celui-ci reste dans son registre.
const COLONNES_ARCHIVES = [
  { nom: 'Type', largeur: 130, aide: 'Campagne, one-shot, événement ou soirée mensuelle.' },
  { nom: 'Date', largeur: 110, aide: 'Date à laquelle la partie a eu lieu.' },
  { nom: 'Horaire', largeur: 130, aide: 'Horaire annoncé.' },
  { nom: 'Titre', largeur: 240, aide: 'Titre de la ligne d’agenda.' },
  { nom: 'Jeu', largeur: 170, aide: 'Jeu ou univers.' },
  { nom: 'Lieu', largeur: 170, aide: 'Lieu de la partie.' },
  { nom: 'MJ', largeur: 140, aide: 'Meneur·se de jeu.' },
  { nom: 'Places', largeur: 90, aide: 'Ce qui figurait dans la colonne « Places ».' },
  {
    nom: 'Inscrit·es',
    largeur: 90,
    aide:
      'Combien de pseudos Discord se sont inscrits, et rien de plus : la liste ' +
      'des noms resterait illisible ici. Le détail est dans l’onglet ' +
      '« Inscriptions » correspondant, rangé par soirée.',
  },
  { nom: 'Description', largeur: 380, aide: 'Description telle qu’elle a été publiée.' },
]

const COLONNES_INSCRIPTIONS = [
  { nom: "Date de l'inscription", largeur: 150, aide: 'Rempli automatiquement par le site.' },
  { nom: "Heure de l'inscription", largeur: 150, aide: 'Rempli automatiquement par le site.' },
  { nom: 'Date', largeur: 140, aide: 'Date de la partie ou de l’événement concerné. Indispensable pour inscrire quelqu’un à la main.' },
  { nom: 'Intitulé', largeur: 240, aide: 'Titre exact de la ligne concernée. À remplir si deux choses ont lieu le même jour.' },
  {
    nom: 'Pseudo',
    largeur: 180,
    aide:
      'Pseudo Discord de la personne inscrite, ou son prénom : le formulaire du ' +
      'site accepte les deux, pour ne pas obliger à créer un compte Discord. Un ' +
      'pseudo identique à celui de Discord évite de compter la personne deux fois.',
  },
  { nom: 'Rang', largeur: 70, aide: 'Ordre d’arrivée, calculé par le site.' },
  {
    nom: 'Origine',
    largeur: 90,
    aide:
      '« Discord » est écrit par le script pour une personne ayant cliqué ' +
      '« Intéressé·e » sur l’événement : ces lignes lui appartiennent, il les ' +
      'ajoute et les retire tout seul. Pour une inscription que vous saisissez, ' +
      'notez ce qui vous est utile — « mail », « sur place »… : le script n’y ' +
      'touche jamais.',
  },
]

/* ------------------------------------------------------------------ */
/*  Installation                                                       */
/* ------------------------------------------------------------------ */

/** À exécuter une fois : crée les trois onglets, les formats et les couleurs. */
function initialiser() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet()

  // Reprises d'abord, en tout premier : `onglet()` réécrit les en-têtes, et une
  // fois réécrits plus rien ne dit à quoi ressemblait la feuille d'avant.
  migrerColonneStatut(classeur)
  mettreDeCoteAnciennesArchives(classeur)

  const evenements = onglet(classeur, ONGLET_EVENEMENTS, COLONNES_EVENEMENTS)
  const mensuelles = onglet(classeur, ONGLET_MENSUELLES, COLONNES_MENSUELLES)
  const inscriptionsOS = onglet(classeur, ONGLET_INSCRIPTIONS_OS, COLONNES_INSCRIPTIONS)
  const inscriptionsEv = onglet(classeur, ONGLET_INSCRIPTIONS_EVENEMENTS, COLONNES_INSCRIPTIONS)
  const archives = onglet(classeur, ONGLET_ARCHIVES, COLONNES_ARCHIVES)

  reglerEvenements(evenements)
  reglerMensuelles(mensuelles)
  colonneDate(inscriptionsOS, 3)
  colonneDate(inscriptionsEv, 3)
  colonneDate(archives, 2)

  rafraichirStatuts()
  installerArchivageQuotidien()
  installerSynchroDiscord()

  if (evenements.getLastRow() < 2) {
    evenements.appendRow([
      '',
      '2026-09-19',
      '20h00',
      'one-shot',
      'One-shot Warhammer',
      'Warhammer Fantasy',
      'Espace Baudelaire',
      '',
      "Une histoire complète en une soirée dans le Vieux Monde. Aucune connaissance de l'univers requise.",
      '',
      '',
    ])
  }

  if (mensuelles.getLastRow() < 2) {
    mensuelles.appendRow([
      '2026-10-10',
      '18h30 – 23h45',
      'Soirée one-shot mensuelle',
      'Jeux variés',
      'Espace Baudelaire',
      '',
      'Une histoire complète en une soirée, ouverte à tout le monde : aucune expérience requise, tout le matériel est fourni.',
      12,
    ])
  }

  // Ranger dans la foulée : sans cela « Archives » resterait vide jusqu'au
  // passage de la nuit, et l'on croirait l'installation ratée.
  archiver()
}

/**
 * Range les lignes d'un onglet d'agenda par date croissante. Les lignes sans
 * date restent en bas : Google place les cellules vides en fin de tri.
 */
function trierParDate(feuille, colonneDate) {
  if (feuille.getLastRow() < 3) return

  feuille
    .getRange(2, 1, feuille.getLastRow() - 1, feuille.getLastColumn())
    .sort({ column: colonneDate, ascending: true })
}

/**
 * Trie après la saisie d'une date, et ramène le curseur sur la ligne qui vient
 * de bouger.
 *
 * Sans ce rattrapage, le tri serait une gêne plutôt qu'un service : Google
 * garde le curseur sur l'adresse de la cellule, pas sur la ligne. La ligne
 * qu'on remplit filerait à sa place chronologique et la suite de la saisie
 * atterrirait dans la ligne d'à côté. On la retrouve donc à son contenu, et on
 * pose le curseur sur sa case suivante — prêt à continuer.
 */
function classerLigne(feuille, ligne, colonneDate) {
  const largeur = feuille.getLastColumn()
  const empreinte = feuille.getRange(ligne, 1, 1, largeur).getValues()[0].join('\u0000')

  trierParDate(feuille, colonneDate)

  const donnees = feuille.getRange(2, 1, feuille.getLastRow() - 1, largeur).getValues()
  for (let i = 0; i < donnees.length; i++) {
    if (donnees[i].join('\u0000') === empreinte) {
      feuille.setActiveRange(feuille.getRange(i + 2, Math.min(colonneDate + 1, largeur)))
      return
    }
  }
}

/**
 * Reprise des feuilles installées avant que « Statut » ne passe en tête.
 *
 * L'en-tête serait réécrit par `onglet()` sans que les données bougent : les
 * colonnes se retrouveraient décalées d'un cran sous des intitulés faux. On
 * insère donc une vraie colonne en tête, et on supprime l'ancienne colonne
 * « Statut » restée à droite. Une feuille déjà à jour, ou dont l'en-tête ne
 * ressemble à rien de connu, n'est pas touchée.
 */
function migrerColonneStatut(classeur) {
  const feuille = classeur.getSheetByName(ONGLET_EVENEMENTS)
  if (!feuille) return

  const premiere = cleEntete(texte(feuille.getRange(1, 1).getValue()))
  if (premiere === cleEntete('Statut')) return
  if (premiere !== cleEntete('Date')) return

  feuille.insertColumnBefore(1)

  const entetes = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0]
  for (let i = entetes.length - 1; i >= 1; i--) {
    if (cleEntete(texte(entetes[i])) === cleEntete('Statut')) {
      feuille.deleteColumn(i + 1)
      break
    }
  }
}

/**
 * L'ancien script déplaçait les inscriptions passées dans « Archives ». Le
 * nouvel onglet, lui, est reconstruit à chaque passage : il écraserait ces
 * lignes, qui ne se trouvent alors plus nulle part. On renomme donc l'ancien
 * onglet au lieu de le vider — rien n'est perdu, et la feuille repart propre.
 */
function mettreDeCoteAnciennesArchives(classeur) {
  const feuille = classeur.getSheetByName(ONGLET_ARCHIVES)
  if (!feuille || feuille.getLastRow() < 2) return

  const premiere = texte(feuille.getRange(1, 1, 1, 1).getValues()[0][0])
  if (cleEntete(premiere) !== cleEntete(COLONNES_INSCRIPTIONS[0].nom)) return

  const horodatage = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  feuille.setName(`Archives (inscriptions, ${horodatage})`)
}

function onglet(classeur, nom, colonnes) {
  let feuille = classeur.getSheetByName(nom)
  if (!feuille) {
    feuille = classeur.insertSheet(nom)
    feuille.appendRow(colonnes.map((c) => c.nom))
  }

  const entete = feuille.getRange(1, 1, 1, colonnes.length)
  entete.setValues([colonnes.map((c) => c.nom)])
  entete.setFontWeight('bold').setBackground('#f4eeee').setNotes([colonnes.map((c) => c.aide)])
  feuille.setFrozenRows(1)
  colonnes.forEach((c, i) => feuille.setColumnWidth(i + 1, c.largeur))

  return feuille
}

/**
 * Nombre de lignes réglables sous l'en-tête. Jamais plus que ce que la feuille
 * contient : une plage plus grande est refusée par Google (« coordonnées ou
 * dimensions non valides »).
 */
function nbLignes(feuille) {
  garantirLignes(feuille, 501)
  return feuille.getMaxRows() - 1
}

function colonneDate(feuille, colonne) {
  feuille
    .getRange(2, colonne, nbLignes(feuille), 1)
    .setNumberFormat('yyyy-mm-dd')
    .setHorizontalAlignment('left')
}

/**
 * Colonne « Places » : cellule libre, sans liste déroulante. On y tape un
 * nombre, ou « Complet » — rien d'autre à choisir dans un menu, rien qui
 * refuse une valeur. `setDataValidation(null)` retire la liste posée par une
 * version précédente du script.
 *
 * La saisie reste corrigée à la volée par `onEdit` : « complet », « COMPLET »
 * ou « complet !» deviennent « Complet ».
 */
function colonnePlaces(feuille, colonne, lignes) {
  feuille
    .getRange(2, colonne, lignes, 1)
    .setDataValidation(null)
    .setHorizontalAlignment('left')
}

/**
 * Colonne « Statut » : « à venir » ou « terminé », d'après la date de la ligne.
 *
 * C'est le script qui écrit la valeur, et non une formule. Une formule aurait
 * semblé plus naturelle, mais Google la refuse dès que la langue du classeur
 * change le séparateur d'arguments (« ; » en français, « , » en anglais) : la
 * cellule affiche alors #ERROR!. Une valeur ne dépend d'aucune langue.
 *
 * Elle est remise à jour à trois moments, ce qui suffit à la garder juste :
 * à l'ouverture du classeur, à chaque changement de date (`onEdit`), et pendant
 * le rangement de la nuit.
 */
function rafraichirStatuts() {
  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET_EVENEMENTS)
  if (!feuille || feuille.getLastRow() < 2) return

  const hauteur = feuille.getLastRow() - 1
  const dates = feuille.getRange(2, COLONNE_DATE, hauteur, 1).getValues()
  const actuels = feuille.getRange(2, COLONNE_STATUT, hauteur, 1).getValues()
  const aujourdhui = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')

  const voulus = dates.map(function (cellule) {
    return [statutPour(cellule[0], aujourdhui)]
  })

  // On n'écrit que si quelque chose a bougé : ouvrir le classeur ne doit pas
  // marquer le fichier comme modifié pour rien.
  const change = voulus.some((v, i) => v[0] !== texte(actuels[i][0]))
  if (change) feuille.getRange(2, COLONNE_STATUT, hauteur, 1).setValues(voulus)
}

/** Statut d'une date : vide si la cellule n'en contient pas. */
function statutPour(valeurDate, aujourdhui) {
  const iso = versDateIso(valeurDate)
  if (!iso) return ''
  return iso < aujourdhui ? STATUT_TERMINE : STATUT_A_VENIR
}

/** Statut d'une seule ligne, après modification de sa date. */
function majStatutLigne(feuille, ligne) {
  const aujourdhui = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const date = feuille.getRange(ligne, COLONNE_DATE).getValue()
  feuille.getRange(ligne, COLONNE_STATUT).setValue(statutPour(date, aujourdhui))
}

function reglerEvenements(feuille) {
  const lignes = nbLignes(feuille)
  colonneDate(feuille, COLONNE_DATE)

  feuille
    .getRange(2, COLONNE_TYPE, lignes, 1)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(TYPES, true)
        .setAllowInvalid(false)
        .setHelpText('campagne, one-shot ou événement.')
        .build(),
    )

  colonnePlaces(feuille, COLONNE_PLACES, lignes)

  feuille.getRange(2, COLONNE_DESCRIPTION, lignes, 1).setWrap(true)

  // Chaque ligne prend la couleur de son type — même code que sur le site.
  const zone = feuille.getRange(2, 1, lignes, COLONNES_EVENEMENTS.length)
  const regles = TYPES.map((type) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$D2="${type}"`)
      .setBackground(COULEURS[type].fond)
      .setFontColor(COULEURS[type].trait)
      .setRanges([zone])
      .build(),
  )

  // Une ligne passée s'efface visuellement : elle reste lisible, mais ne tire
  // plus l'œil au milieu des dates à venir. Grisée seulement — pas d'italique,
  // qui rendrait la lecture pénible sur des lignes entières.
  regles.unshift(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$A2="${STATUT_TERMINE}"`)
      .setBackground(GRIS_FOND)
      .setFontColor(GRIS_TRAIT)
      .setRanges([zone])
      .build(),
  )

  feuille.setConditionalFormatRules(regles)
}

function reglerMensuelles(feuille) {
  const lignes = nbLignes(feuille)
  colonneDate(feuille, 1)

  colonnePlaces(feuille, 8, lignes)

  feuille.getRange(2, 7, lignes, 1).setWrap(true)

  // Onglet entier à la couleur des soirées mensuelles, dès qu'une date est là.
  const zone = feuille.getRange(2, 1, lignes, COLONNES_MENSUELLES.length)
  feuille.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$A2<>""')
      .setBackground(COULEURS.mensuelle.fond)
      .setFontColor(COULEURS.mensuelle.trait)
      .setRanges([zone])
      .build(),
  ])
}

/* ------------------------------------------------------------------ */
/*  Archivage des soirées passées                                      */
/* ------------------------------------------------------------------ */

/**
 * Remet à jour ce qui découle des dates passées. Rien n'est déplacé ni
 * supprimé : les deux onglets d'agenda gardent leur historique (le calendrier
 * du site y puise ses pastilles grisées), et les inscriptions restent dans leur
 * registre. Le travail consiste à ranger.
 *
 * 1. « Archives » est reconstruit de zéro à partir des lignes terminées des
 *    onglets « Événements » et « OS mensuelles », regroupées par type puis par
 *    date. Reconstruire plutôt qu'ajouter évite tout doublon : relancer
 *    l'archivage deux fois de suite donne exactement le même onglet.
 * 2. Chaque registre d'inscriptions est regroupé par soirée, dans l'ordre
 *    d'arrivée des inscriptions.
 *
 * Tourne chaque nuit, et à la demande par le menu « Guilde ».
 */
function archiver() {
  synchroniserDiscord()

  const classeur = SpreadsheetApp.getActiveSpreadsheet()
  const evenements = classeur.getSheetByName(ONGLET_EVENEMENTS)
  const mensuelles = classeur.getSheetByName(ONGLET_MENSUELLES)
  if (evenements) trierParDate(evenements, COLONNE_DATE)
  if (mensuelles) trierParDate(mensuelles, 1)

  rafraichirStatuts()
  reconstruireArchives()
  regrouperRegistre(ONGLET_INSCRIPTIONS_OS)
  regrouperRegistre(ONGLET_INSCRIPTIONS_EVENEMENTS)
}

// Ordre des catégories dans « Archives », et intitulé de leur bandeau.
const CATEGORIES_ARCHIVES = [
  { type: 'campagne', titre: 'Campagnes' },
  { type: 'one-shot', titre: 'Soirées one-shot' },
  { type: 'événement', titre: 'Événements' },
  { type: 'mensuelle', titre: 'Soirées mensuelles' },
]

/**
 * Reconstruit l'onglet « Archives » : une ligne par date passée, groupée par
 * catégorie. Le détail des inscriptions n'y figure pas — seulement leur
 * nombre ; les noms restent dans l'onglet « Inscriptions » correspondant.
 */
function reconstruireArchives() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet()
  const archives = onglet(classeur, ONGLET_ARCHIVES, COLONNES_ARCHIVES)
  const aujourdhui = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')

  const inscriptionsEv = lignes(ONGLET_INSCRIPTIONS_EVENEMENTS)
  const inscriptionsOS = lignes(ONGLET_INSCRIPTIONS_OS)

  const passees = []

  lignes(ONGLET_EVENEMENTS).forEach(function (l) {
    const date = versDateIso(champ(l, 'Date'))
    const titre = texte(champ(l, 'Titre'))
    if (!date || !titre || !estTerminee(l, date, aujourdhui)) return

    passees.push([
      normaliserType(champ(l, 'Type') || ''),
      date,
      normaliserHoraire(champ(l, 'Horaire') || ''),
      titre,
      texte(champ(l, 'Jeu')),
      texte(champ(l, 'Lieu')),
      texte(champ(l, 'MJ')),
      texte(champ(l, 'Places')),
      compterInscrits(inscriptionsEv, date, titre),
      texte(champ(l, 'Description')),
    ])
  })

  lignes(ONGLET_MENSUELLES).forEach(function (l) {
    const date = versDateIso(champ(l, 'Date'))
    const titre = texte(champ(l, 'Titre'))
    if (!date || !titre || date >= aujourdhui) return

    passees.push([
      'mensuelle',
      date,
      normaliserHoraire(champ(l, 'Horaire') || ''),
      titre,
      texte(champ(l, 'Jeux')),
      texte(champ(l, 'Lieu')),
      texte(champ(l, 'MJ')),
      texte(champ(l, 'Places')),
      compterInscrits(inscriptionsOS, date, titre),
      texte(champ(l, 'Description')),
    ])
  })

  viderSous(archives, COLONNES_ARCHIVES.length)

  CATEGORIES_ARCHIVES.forEach(function (categorie) {
    // Plus récent en premier : on cherche presque toujours la dernière fois.
    const bloc = passees
      .filter((ligne) => ligne[0] === categorie.type)
      .sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0))

    if (!bloc.length) return

    bandeau(archives, `${categorie.titre} — ${bloc.length}`, COLONNES_ARCHIVES.length)
    garantirLignes(archives, archives.getLastRow() + bloc.length)
    archives.getRange(archives.getLastRow() + 1, 1, bloc.length, COLONNES_ARCHIVES.length).setValues(bloc)
  })

  colonneDate(archives, 2)
  archives.getRange(2, 10, nbLignes(archives), 1).setWrap(true)
}

/**
 * Range un registre d'inscriptions : un bloc par soirée (même date, même
 * intitulé), les blocs du plus ancien au plus récent, et à l'intérieur les
 * inscriptions dans leur ordre d'arrivée — premier arrivé, premier servi.
 * Le rang est renuméroté pour coller à cet ordre.
 *
 * Les bandeaux d'une exécution précédente sont relus comme tels et refaits :
 * la fonction peut tourner autant de fois qu'on veut.
 */
function regrouperRegistre(nomOnglet) {
  const classeur = SpreadsheetApp.getActiveSpreadsheet()
  const feuille = classeur.getSheetByName(nomOnglet)
  if (!feuille || feuille.getLastRow() < 2) return

  const inscriptions = lignes(nomOnglet).filter(function (i) {
    if (estBandeau(champ(i, "Date de l'inscription"))) return false
    return versDateIso(champ(i, 'Date')) || pseudoDe(i)
  })

  if (!inscriptions.length) return

  // Une soirée = une date + un intitulé. Les deux registres peuvent contenir
  // deux lignes le même jour : l'intitulé les distingue.
  const blocs = {}
  const ordre = []

  inscriptions.forEach(function (i) {
    const date = versDateIso(champ(i, 'Date'))
    const intitule = texte(champ(i, 'Intitulé'))
    const cle = `${date}\u0000${intitule.toLowerCase()}`

    if (!blocs[cle]) {
      blocs[cle] = { date: date, intitule: intitule, lignes: [] }
      ordre.push(cle)
    }
    blocs[cle].lignes.push(i)
  })

  ordre.sort(function (a, b) {
    return blocs[a].date < blocs[b].date ? -1 : blocs[a].date > blocs[b].date ? 1 : 0
  })

  viderSous(feuille, COLONNES_INSCRIPTIONS.length)

  ordre.forEach(function (cle) {
    const bloc = blocs[cle]
    const rangees = bloc.lignes
      .slice()
      .sort((a, b) => (horodatage(a) < horodatage(b) ? -1 : horodatage(a) > horodatage(b) ? 1 : 0))
      .map((i, index) => [
        texte(champ(i, "Date de l'inscription")),
        texte(champ(i, "Heure de l'inscription")),
        bloc.date,
        bloc.intitule,
        pseudoDe(i),
        index + 1,
        texte(champ(i, 'Origine')),
      ])

    const nom = bloc.intitule || 'Sans intitulé'
    bandeau(
      feuille,
      `${nom} — ${bloc.date} — ${rangees.length} inscrit·e${rangees.length > 1 ? 's' : ''}`,
      COLONNES_INSCRIPTIONS.length,
    )
    garantirLignes(feuille, feuille.getLastRow() + rangees.length)
    feuille.getRange(feuille.getLastRow() + 1, 1, rangees.length, COLONNES_INSCRIPTIONS.length).setValues(rangees)
  })

  colonneDate(feuille, 3)
}

/** Date + heure d'inscription, en une clé triable. Une ligne saisie à la main
 *  sans horodatage passe en fin de bloc plutôt qu'en tête. */
function horodatage(inscription) {
  const jour = versDateIso(champ(inscription, "Date de l'inscription")) || '9999-12-31'
  const heure = texte(champ(inscription, "Heure de l'inscription")) || '99:99:99'
  return `${jour} ${heure}`
}

/** Ligne de séparation : cellules fusionnées, fond gris, texte en gras. */
function bandeau(feuille, intitule, nbColonnes) {
  feuille.appendRow([intitule])

  feuille
    .getRange(feuille.getLastRow(), 1, 1, nbColonnes)
    .merge()
    .setBackground(GRIS_FOND)
    .setFontColor(GRIS_TRAIT)
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
}

/**
 * Reconnaît une ligne de séparation — bandeau d'un passage précédent, ou
 * ancienne ligne « — complet — ». Le tiret cadratin ne se tape pas par accident
 * dans une colonne de date ou de pseudo : il suffit à les distinguer.
 */
function estBandeau(valeur) {
  return texte(valeur).indexOf('—') !== -1
}

/** Ajoute des lignes à la feuille si le bloc à écrire dépasse sa hauteur. */
function garantirLignes(feuille, jusqua) {
  const manquantes = jusqua - feuille.getMaxRows()
  if (manquantes > 0) feuille.insertRowsAfter(feuille.getMaxRows(), manquantes)
}

/** Vide tout ce qui suit l'en-tête, fusions comprises. */
function viderSous(feuille, nbColonnes) {
  const hauteur = feuille.getMaxRows() - 1
  if (hauteur < 1) return

  const zone = feuille.getRange(2, 1, hauteur, nbColonnes)
  zone.breakApart()
  zone.clearContent().clearFormat()
}

/**
 * Ligne d'agenda déjà passée ? On lit d'abord la colonne « Statut », remplie
 * par formule ; si elle manque (feuille ancienne, colonne effacée), la date
 * tranche seule.
 */
function estTerminee(ligne, date, aujourdhui) {
  const statut = simplifier(champ(ligne, 'Statut'))

  if (statut === simplifier(STATUT_TERMINE)) return true
  if (statut === simplifier(STATUT_A_VENIR)) return false

  // Colonne absente, effacée, ou cellule en erreur : la date tranche seule.
  // Sans ce repli, une formule cassée arrêterait l'archivage sans rien dire.
  return date < aujourdhui
}

/* ------------------------------------------------------------------ */
/*  Événements Discord                                                  */
/* ------------------------------------------------------------------ */

/**
 * Reporte dans le registre les personnes qui ont cliqué « Intéressé·e » sur
 * l'événement Discord d'une ligne d'agenda. Elles y deviennent des inscriptions
 * comme les autres, marquées « Discord » : le site décompte donc les places et
 * bascule sur « Complet » sans rien savoir de Discord.
 *
 * Sans jeton de bot enregistré, la fonction ne fait rien — le reste du script
 * continue de tourner normalement.
 *
 * Mise en place, une fois :
 * 1. discord.com/developers › New Application › Bot › Reset Token, copier.
 * 2. Inviter le bot sur le serveur de la Guilde (il n'a besoin que de lire).
 * 3. Apps Script › Paramètres du projet › Propriétés du script › Ajouter :
 *    nom `DISCORD_TOKEN`, valeur le jeton. Il ne doit jamais être écrit ici.
 *
 * À la Guilde, cliquer « Intéressé·e » vaut inscription : c'est la convention
 * de l'association, et c'est ce qui rend ce décompte fiable. Ailleurs, ce
 * bouton dit souvent la simple curiosité — un décompte fondé dessus y serait
 * trompeur. À vérifier avant de reprendre ce script pour un autre serveur.
 */
function synchroniserDiscord() {
  const jeton = PropertiesService.getScriptProperties().getProperty(CLE_JETON_DISCORD)
  if (!jeton) return

  const aujourdhui = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')

  // Les deux agendas : une soirée mensuelle peut elle aussi avoir son événement
  // Discord, et ses intéressés doivent figurer au registre comme les autres.
  const agendas = [
    { onglet: ONGLET_EVENEMENTS, registre: ONGLET_INSCRIPTIONS_EVENEMENTS },
    { onglet: ONGLET_MENSUELLES, registre: ONGLET_INSCRIPTIONS_OS },
  ]

  agendas.forEach(function (agenda) {
    lignes(agenda.onglet).forEach(function (l) {
      const date = versDateIso(champ(l, 'Date'))
      const titre = texte(champ(l, 'Titre'))
      const ids = identifiantsEvenementDiscord(champ(l, 'Lien Discord'))

      // Rien à suivre sur une date passée : le registre garde son dernier état.
      if (!date || !titre || !ids || date < aujourdhui) return

      const pseudos = interessesDiscord(ids, jeton)
      if (pseudos === null) return // appel en échec : on ne touche à rien

      reporterInteresses(agenda.registre, date, titre, pseudos)
    })
  })
}

/** « https://discord.com/events/123/456 » → { serveur: '123', evenement: '456' }. */
function identifiantsEvenementDiscord(lien) {
  const m = texte(lien).match(/events\/(\d+)\/(\d+)/)
  return m ? { serveur: m[1], evenement: m[2] } : null
}

/**
 * Pseudos des personnes intéressées, ou `null` si Discord n'a pas répondu.
 * `null` et « personne » ne veulent pas dire la même chose : sur un appel
 * raté, il ne faut surtout pas conclure que tout le monde s'est désinscrit.
 */
function interessesDiscord(ids, jeton) {
  const pseudos = []
  let apres = ''

  // L'API renvoie 100 personnes au plus par appel : on déroule.
  for (let page = 0; page < 10; page++) {
    const url =
      `https://discord.com/api/v10/guilds/${ids.serveur}/scheduled-events/${ids.evenement}` +
      `/users?limit=100&with_member=true${apres ? `&after=${apres}` : ''}`

    const reponse = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: `Bot ${jeton}` },
      muteHttpExceptions: true,
    })

    if (reponse.getResponseCode() !== 200) return null

    const lot = JSON.parse(reponse.getContentText())
    if (!lot.length) break

    lot.forEach(function (entree) {
      const utilisateur = entree.user || {}
      const membre = entree.member || {}
      // Le surnom sur le serveur d'abord : c'est sous ce nom qu'on se connaît.
      pseudos.push(texte(membre.nick || utilisateur.global_name || utilisateur.username))
    })

    apres = lot[lot.length - 1].user ? lot[lot.length - 1].user.id : ''
    if (lot.length < 100 || !apres) break
  }

  return pseudos.filter(function (p) { return p })
}

/**
 * Met le registre au diapason de Discord pour une ligne d'agenda : ajoute les
 * pseudos apparus, retire les lignes « Discord » de ceux qui se sont rétractés.
 * Une inscription venue du site n'est jamais touchée, et un pseudo déjà présent
 * n'est pas ajouté deux fois — c'est ce qui évite le double comptage quand
 * quelqu'un s'inscrit des deux côtés.
 */
function reporterInteresses(registre, date, titre, pseudos) {
  const classeur = SpreadsheetApp.getActiveSpreadsheet()
  const feuille = onglet(classeur, registre, COLONNES_INSCRIPTIONS)
  const valeurs = feuille.getDataRange().getValues()
  const entetes = valeurs[0].map((e) => cleEntete(texte(e)))

  const colonne = (nom) => entetes.indexOf(cleEntete(nom))
  const iDate = colonne('Date')
  const iTitre = colonne('Intitulé')
  const iPseudo = colonne('Pseudo') !== -1 ? colonne('Pseudo') : colonne('Pseudo Discord')
  const iOrigine = colonne('Origine')
  if (iDate === -1 || iPseudo === -1 || iOrigine === -1) return

  const memeSoiree = function (ligne) {
    if (estBandeau(ligne[0])) return false
    if (versDateIso(ligne[iDate]) !== date) return false
    const intitule = texte(ligne[iTitre])
    return !intitule || intitule.toLowerCase() === titre.toLowerCase()
  }

  const presents = []
  const aRetirer = []

  valeurs.slice(1).forEach(function (ligne, index) {
    if (!memeSoiree(ligne)) return
    const pseudo = texte(ligne[iPseudo])
    presents.push(pseudo.toLowerCase())

    const venuDeDiscord = texte(ligne[iOrigine]) === ORIGINE_DISCORD
    if (venuDeDiscord && pseudos.map((p) => p.toLowerCase()).indexOf(pseudo.toLowerCase()) === -1) {
      aRetirer.push(index + 2)
    }
  })

  // De bas en haut : supprimer une ligne décale toutes celles d'en dessous.
  aRetirer.reverse().forEach(function (ligne) { feuille.deleteRow(ligne) })

  const maintenant = new Date()
  const fuseau = Session.getScriptTimeZone()
  let rang = presents.length - aRetirer.length

  pseudos.forEach(function (pseudo) {
    if (presents.indexOf(pseudo.toLowerCase()) !== -1) return
    rang++
    feuille.appendRow([
      Utilities.formatDate(maintenant, fuseau, 'dd/MM/yyyy'),
      Utilities.formatDate(maintenant, fuseau, 'HH:mm:ss'),
      date,
      titre,
      pseudo,
      rang,
      ORIGINE_DISCORD,
    ])
  })
}

/**
 * Contrôle de l'installation Discord, à lancer depuis le menu « Guilde ».
 * Affiche ce qui va et ce qui manque, plutôt que de laisser deviner pourquoi
 * aucun pseudo ne remonte.
 */
function verifierDiscord() {
  const messages = []
  const jeton = PropertiesService.getScriptProperties().getProperty(CLE_JETON_DISCORD)

  if (!jeton) {
    messages.push(
      `✗ Aucun jeton enregistré.\n` +
        `  Paramètres du projet › Propriétés du script › Ajouter,\n` +
        `  nom : ${CLE_JETON_DISCORD}`,
    )
    return afficher(messages)
  }
  messages.push('✓ Jeton enregistré.')

  // Les lignes à venir qui portent un lien d'événement Discord.
  const aujourdhui = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  const cibles = []

  ;[ONGLET_EVENEMENTS, ONGLET_MENSUELLES].forEach(function (nom) {
    lignes(nom).forEach(function (l) {
      const date = versDateIso(champ(l, 'Date'))
      const ids = identifiantsEvenementDiscord(champ(l, 'Lien Discord'))
      if (date && date >= aujourdhui && ids) cibles.push({ titre: texte(champ(l, 'Titre')), ids: ids })
    })
  })

  if (!cibles.length) {
    messages.push(
      '✗ Aucune ligne à venir avec un lien d’événement Discord.\n' +
        '  Collez le lien (discord.com/events/…) dans la colonne « Lien Discord ».',
    )
    return afficher(messages)
  }
  messages.push(`✓ ${cibles.length} ligne(s) à venir avec un lien d’événement.`)

  // Un seul appel réel : de quoi distinguer un jeton refusé d'un bot absent.
  const essai = cibles[0]
  const pseudos = interessesDiscord(essai.ids, jeton)

  if (pseudos === null) {
    messages.push(
      `✗ Discord refuse la lecture de « ${essai.titre} ».\n` +
        '  Causes habituelles : le bot n’a pas été invité sur le serveur,\n' +
        '  le jeton a été régénéré depuis, ou le lien ne pointe pas vers un\n' +
        '  événement de ce serveur.',
    )
    return afficher(messages)
  }

  messages.push(`✓ Lecture réussie : ${pseudos.length} intéressé·e(s) sur « ${essai.titre} ».`)
  messages.push('\nTout est en place. La relève tourne toutes les 15 minutes.')
  return afficher(messages)
}

/** Affiche un compte rendu, dans la feuille ou dans le journal d'exécution. */
function afficher(messages) {
  const texte = messages.join('\n')
  try {
    SpreadsheetApp.getUi().alert('Vérification Discord', texte, SpreadsheetApp.getUi().ButtonSet.OK)
  } catch (erreur) {
    // Lancée depuis l'éditeur, sans feuille ouverte : le journal fera l'affaire.
    Logger.log(texte)
  }
  return texte
}

/** Programme la relève des événements Discord, sans doublonner le déclencheur. */
function installerSynchroDiscord() {
  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() === 'synchroniserDiscord') ScriptApp.deleteTrigger(declencheur)
  })
  ScriptApp.newTrigger('synchroniserDiscord').timeBased().everyMinutes(15).create()
}

/** Programme l'archivage chaque nuit, sans doublonner le déclencheur. */
function installerArchivageQuotidien() {
  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() === 'archiver') ScriptApp.deleteTrigger(declencheur)
  })
  ScriptApp.newTrigger('archiver').timeBased().everyDays(1).atHour(4).create()
}

/** Menu « Guilde » dans la feuille, pour archiver à la demande. */
function onOpen() {
  rafraichirStatuts()

  SpreadsheetApp.getUi()
    .createMenu('Guilde')
    .addItem('Ranger : archives et inscriptions', 'archiver')
    .addItem('Relever les inscrits Discord', 'synchroniserDiscord')
    .addItem('Vérifier le lien avec Discord', 'verifierDiscord')
    .addToUi()
}

/* ------------------------------------------------------------------ */
/*  Correction automatique à la saisie                                 */
/* ------------------------------------------------------------------ */

/** Déclencheur simple : rien à installer, actif dès l'enregistrement. */
function onEdit(e) {
  const feuille = e.range.getSheet()
  const nom = feuille.getName()
  if (e.range.getRow() === 1) return

  const colonne = e.range.getColumn()
  const valeur = e.range.getValue()
  if (valeur === '' || valeur === null) return

  if (nom === ONGLET_EVENEMENTS) {
    // Colonne « Statut » : elle appartient au script. Ce qu'on y tape est
    // remplacé par la valeur qu'appelle la date, plutôt que laissé à côté.
    if (colonne === COLONNE_STATUT) return majStatutLigne(feuille, e.range.getRow())
    if (colonne === COLONNE_DATE) {
      const ligne = e.range.getRow()
      ecrire(e.range, versDateIso(valeur))
      majStatutLigne(feuille, ligne)
      return classerLigne(feuille, ligne, COLONNE_DATE)
    }
    if (colonne === COLONNE_HORAIRE) return ecrire(e.range, normaliserHoraire(valeur))
    if (colonne === COLONNE_TYPE) return ecrire(e.range, normaliserType(valeur))
    if (colonne === COLONNE_PLACES) return ecrire(e.range, normaliserPlaces(valeur))
    if ([5, 6, 7, 8, COLONNE_DESCRIPTION, COLONNE_LIEN].includes(colonne)) {
      return ecrire(e.range, String(valeur).trim())
    }
  }

  if (nom === ONGLET_MENSUELLES) {
    if (colonne === 1) {
      const ligne = e.range.getRow()
      ecrire(e.range, versDateIso(valeur))
      return classerLigne(feuille, ligne, 1)
    }
    if (colonne === 2) return ecrire(e.range, normaliserHoraire(valeur))
    if (colonne === 8) return ecrire(e.range, normaliserPlaces(valeur))
    if ([3, 4, 5, 6, 7].includes(colonne)) return ecrire(e.range, String(valeur).trim())
  }

  if (nom === ONGLET_INSCRIPTIONS_OS || nom === ONGLET_INSCRIPTIONS_EVENEMENTS) {
    if (colonne === 3) return ecrire(e.range, versDateIso(valeur))
    if ([4, 5].includes(colonne)) return ecrire(e.range, String(valeur).trim())
  }
}

function ecrire(cellule, valeur) {
  if (String(cellule.getValue()) !== String(valeur)) cellule.setValue(valeur)
}

/** Sans accents ni majuscules : sert à reconnaître les variantes de saisie. */
function simplifier(texte) {
  return String(texte)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Cellule « Places » → ce que le site attend : un nombre de places, et le
 * drapeau « complet ». Trois cas seulement :
 *   vide (ou 0)  → { places: 0, complet: false }  : ni formulaire ni compteur
 *   un nombre    → { places: n, complet: false }  : inscriptions ouvertes
 *   « Complet »  → { places: 0, complet: true }   : fermées, et le site le dit
 * « COMPLET », « complet !» sont reconnus de la même façon ; « complètement »,
 * non — ce n'est pas le mot.
 */
function placesDe(valeur) {
  // `\b` : « complet », « complet !», mais pas « complètement » ni un mot
  // qui commencerait par ces lettres.
  if (/^complet\b/.test(simplifier(valeur))) {
    return { places: 0, complet: true }
  }
  return { places: Number(valeur) || 0, complet: false }
}

/** « complet », « COMPLET !», « Complet » → « Complet ». Le reste est inchangé. */
function normaliserPlaces(valeur) {
  return placesDe(valeur).complet ? PLACES_COMPLET : valeur
}

/** « One Shot », « oneshot », « OS », « evenement » → un type de la liste. */
function normaliserType(valeur) {
  const t = simplifier(valeur).replace(/[\s_]+/g, '-')

  if (/^campagne/.test(t)) return 'campagne'
  // La Guilde ne propose plus de partie solo : une ligne restée sur ce type
  // retombe sur « one-shot » (défaut ci-dessous), que le site sait nommer.
  if (/^(evenement|event)/.test(t)) return 'événement'
  if (/^(one-shot|oneshot|os)$/.test(t)) return 'one-shot'
  return TYPES.indexOf(t) !== -1 ? t : 'one-shot'
}

/**
 * « 20h », « 20:00 », « 20 h 00 » → « 20h00 ».
 * « 18h30-23h45 », « 18:30 à 23:45 » → « 18h30 – 23h45 ».
 */
function normaliserHoraire(valeur) {
  if (valeur instanceof Date) {
    const fuseau = Session.getScriptTimeZone()
    return Utilities.formatDate(valeur, fuseau, 'HH') + 'h' + Utilities.formatDate(valeur, fuseau, 'mm')
  }

  const texte = String(valeur).trim()
  const heures = texte.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/g)
  if (!heures) return texte

  const formatees = heures.map((h) => {
    const m = h.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/)
    return `${String(Number(m[1])).padStart(2, '0')}h${m[2] || '00'}`
  })

  return formatees.length > 1 ? `${formatees[0]} – ${formatees[1]}` : formatees[0]
}

/** Dates saisies en texte (10/10/2026) ou en date Google → AAAA-MM-JJ. */
function versDateIso(valeur) {
  if (valeur instanceof Date) {
    return Utilities.formatDate(valeur, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  }

  const texte = String(valeur || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(texte)) return texte

  const m = texte.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (m) {
    const annee = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${annee}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }

  return texte
}

/* ------------------------------------------------------------------ */
/*  Service lu par le site                                             */
/* ------------------------------------------------------------------ */

/**
 * Clé d'en-tête tolérante : sans accents, sans majuscules, sans pluriel.
 * « Jeux », « Jeu », « JEU » donnent tous « jeu » ; « Places » donne « place ».
 * Une colonne renommée au pluriel continue donc d'être lue.
 */
function cleEntete(nom) {
  // Pluriel retiré, en « s » comme en « x » : « jeux » → « jeu ».
  return simplifier(nom).replace(/[sx]$/, '')
}

/**
 * Lignes d'un onglet sous forme d'objets. Chaque valeur est accessible par
 * l'intitulé exact de la colonne ET par sa clé tolérante.
 */
function lignes(nomOnglet) {
  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomOnglet)
  if (!feuille || feuille.getLastRow() < 2) return []

  const valeurs = feuille.getDataRange().getValues()
  const entetes = valeurs[0].map((e) => String(e).trim())

  return valeurs.slice(1).map((ligne) => {
    const objet = {}
    entetes.forEach((entete, i) => {
      objet[entete] = ligne[i]
      objet[cleEntete(entete)] = ligne[i]
    })
    return objet
  })
}

/**
 * Pseudo d'une inscription. La colonne s'appelait « Pseudo Discord » : une
 * feuille pas encore réinitialisée porte encore ce nom, on lit donc les deux.
 */
function pseudoDe(ligne) {
  const valeur = champ(ligne, 'Pseudo')
  return texte(valeur === undefined || valeur === '' ? champ(ligne, 'Pseudo Discord') : valeur)
}

/** Valeur d'une colonne, quel que soit l'accent, la casse ou le pluriel. */
function champ(ligne, nom) {
  const valeur = ligne[nom]
  return valeur === undefined ? ligne[cleEntete(nom)] : valeur
}

function texte(valeur) {
  return String(valeur === null || valeur === undefined ? '' : valeur).trim()
}

/**
 * Inscriptions correspondant à une ligne d'agenda : même date, et même intitulé
 * dès que celui-ci est renseigné — utile si deux choses ont lieu le même jour.
 */
function compterInscrits(inscriptions, date, titre) {
  return inscriptions.filter(function (i) {
    // Les bandeaux de séparation ne sont pas des inscriptions.
    if (estBandeau(champ(i, "Date de l'inscription"))) return false
    // On compte des pseudos Discord : une ligne sans pseudo ne compte pas.
    if (!pseudoDe(i)) return false
    if (versDateIso(champ(i, 'Date')) !== date) return false
    const intitule = texte(champ(i, 'Intitulé'))
    return !intitule || intitule.toLowerCase() === String(titre).toLowerCase()
  }).length
}

/** Agenda complet (parties, événements, soirées mensuelles) + inscriptions. */
function doGet() {
  try {
    const inscriptionsEv = lignes(ONGLET_INSCRIPTIONS_EVENEMENTS)
    const inscriptionsOS = lignes(ONGLET_INSCRIPTIONS_OS)

    const parties = lignes(ONGLET_EVENEMENTS)
      .filter((l) => versDateIso(champ(l, 'Date')) && texte(champ(l, 'Titre')))
      .map((l) => {
        const date = versDateIso(champ(l, 'Date'))
        const titre = texte(champ(l, 'Titre'))
        const places = placesDe(champ(l, 'Places'))
        return {
          date: date,
          horaire: normaliserHoraire(champ(l, 'Horaire') || ''),
          type: normaliserType(champ(l, 'Type') || ''),
          titre: titre,
          jeu: texte(champ(l, 'Jeu')),
          lieu: texte(champ(l, 'Lieu')),
          mj: texte(champ(l, 'MJ')),
          description: texte(champ(l, 'Description')),
          places: places.places,
          complet: places.complet,
          lien: texte(champ(l, 'Lien Discord')),
          inscrits: compterInscrits(inscriptionsEv, date, titre),
        }
      })

    const mensuelles = lignes(ONGLET_MENSUELLES)
      .filter((l) => versDateIso(champ(l, 'Date')) && texte(champ(l, 'Titre')))
      .map((l) => {
        const date = versDateIso(champ(l, 'Date'))
        const places = placesDe(champ(l, 'Places'))
        return {
          date: date,
          horaire: normaliserHoraire(champ(l, 'Horaire') || ''),
          type: 'mensuelle',
          titre: texte(champ(l, 'Titre')),
          // « Jeux » pour les soirées mensuelles, « Jeu » si la feuille garde
          // l'ancien intitulé : les deux sont acceptés.
          jeu: texte(champ(l, 'Jeu')),
          lieu: texte(champ(l, 'Lieu')),
          mj: texte(champ(l, 'MJ')),
          description: texte(champ(l, 'Description')),
          places: places.places,
          complet: places.complet,
          // Le lien Discord d'une soirée mensuelle sert à relever les
          // intéressés, pas à détourner l'inscription : le site n'en reçoit
          // rien, et garde donc son formulaire — c'est le créneau ouvert à qui
          // n'a pas de compte Discord.
          lien: '',
          inscrits: compterInscrits(inscriptionsOS, date, texte(champ(l, 'Titre'))),
        }
      })

    return reponse({ ok: true, evenements: parties.concat(mensuelles) })
  } catch (erreur) {
    return reponse({ ok: false, erreur: String(erreur) })
  }
}

function reponse(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
