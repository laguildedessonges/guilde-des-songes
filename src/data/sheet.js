import { typo } from '../typographie.js'

// Lien avec la feuille Google qui pilote l'agenda et reçoit les inscriptions.
//
// Coller ici l'URL du déploiement Apps Script (elle finit par /exec) — la marche
// à suivre complète est dans docs/agenda-google-sheet.gs. Tant que cette
// constante est vide, le site fonctionne sur les parties écrites en dur dans
// src/data/events.js : rien ne casse, mais les places ne se décomptent pas.
export const SHEET_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwlwLChRf3RMtjSH23hC22chzlmPUiXu17E4J5iAK8vvTACFUQQqsvrc1dC5g54DEheBA/exec'

// L'agenda part en même temps que le reste du site : `prechargerAgenda()` est
// appelée au démarrage (main.js), bien avant qu'on ouvre la page Agenda. La
// feuille Google met une à deux secondes à répondre ; pendant ce temps le
// visiteur lit l'accueil, et la page Agenda s'affiche d'un coup quand il y
// arrive, sans passer par « Chargement de l'agenda… ».
let promesse = null
// Réponse en mémoire : un tableau, `null` si la feuille est muette, et
// `undefined` tant qu'elle n'a pas répondu — les trois cas sont distincts.
let recu
let recuLe = 0

// Au-delà de ce délai, revenir sur la page redemande la feuille en arrière-plan :
// les places restantes bougent au fil des inscriptions.
const FRAICHEUR_MS = 5 * 60 * 1000

/** Lance la requête si elle n'est pas déjà partie, et renvoie sa promesse. */
export function prechargerAgenda() {
  if (!promesse) {
    promesse = demanderAgenda().then((evenements) => {
      recu = evenements
      recuLe = Date.now()
      return evenements
    })
  }
  return promesse
}

/**
 * Agenda publié dans la feuille.
 * Renvoie `null` si la feuille n'est pas configurée ou ne répond pas : l'appelant
 * garde alors les parties locales plutôt que d'afficher un agenda vide.
 */
export function fetchAgenda() {
  return prechargerAgenda()
}

/** Réponse déjà reçue, ou `undefined` tant que la feuille n'a pas répondu. */
export function agendaRecu() {
  return recu
}

/** Vrai quand la réponse en mémoire a vieilli et mérite d'être redemandée. */
export function agendaPerime() {
  return recu !== undefined && Date.now() - recuLe > FRAICHEUR_MS
}

/** Redemande la feuille. Une réponse muette ne remplace pas ce qu'on a déjà. */
export function rechargerAgenda() {
  return demanderAgenda().then((evenements) => {
    if (evenements) {
      recu = evenements
      recuLe = Date.now()
      promesse = Promise.resolve(evenements)
    }
    return evenements
  })
}

// Google est parfois lent à réveiller le script, et renvoie même une erreur
// passagère sous charge. Sans limite de temps, la page restait indéfiniment sur
// « Chargement de l'agenda… » : mieux vaut renoncer et afficher le repli, quitte
// à retenter une fois.
// Dix secondes : Google met parfois trois à cinq secondes à réveiller le
// script, il faut lui laisser cette marge — mais au-delà, le visiteur mérite
// une réponse plutôt qu'un sablier.
const DELAI_MAX_MS = 10000
const ESSAIS = 2

async function demanderAgenda() {
  if (!SHEET_ENDPOINT) return null

  for (let essai = 0; essai < ESSAIS; essai++) {
    const evenements = await demanderUneFois()
    if (evenements) return evenements
  }

  return null
}

async function demanderUneFois() {
  // `AbortController` coupe la requête au bout du délai : sans lui, `fetch`
  // attend le bon vouloir du serveur, sans fin.
  const abandon = new AbortController()
  const minuterie = setTimeout(() => abandon.abort(), DELAI_MAX_MS)

  try {
    const response = await fetch(SHEET_ENDPOINT, { method: 'GET', signal: abandon.signal })
    if (!response.ok) return null

    const resultat = await response.json()
    if (!resultat.ok || !Array.isArray(resultat.evenements)) return null
    return resultat.evenements.map(versEvenement)
  } catch {
    // Délai dépassé, réseau coupé, réponse illisible : l'appelant retombera sur
    // les parties locales et le dira à l'écran.
    return null
  } finally {
    clearTimeout(minuterie)
  }
}

// La feuille corrige déjà la saisie (liste déroulante, `onEdit`), mais le site
// reste tolérant : une ligne collée en masse ou saisie avant l'installation du
// script s'affiche quand même correctement.
const TYPES = ['campagne', 'one-shot', 'mensuelle', 'evenement']

function sansAccent(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** « One Shot », « oneshot », « OS », « Soirée mensuelle »… → un type connu. */
function normaliserType(valeur) {
  const t = sansAccent(valeur).replace(/[\s_]+/g, '-')
  if (t.startsWith('mensuel') || t.includes('mensuelle')) return 'mensuelle'
  if (t.startsWith('campagne')) return 'campagne'
  // La Guilde ne propose plus de partie solo : une ligne restée sur ce type
  // retombe sur « one-shot » (défaut ci-dessous) plutôt que d'afficher un type
  // que le site ne sait plus nommer ni colorer.
  if (t.startsWith('evenement') || t.startsWith('event')) return 'evenement'
  if (['one-shot', 'oneshot', 'os'].includes(t)) return 'one-shot'
  return TYPES.includes(t) ? t : 'one-shot'
}

/** Dates en 10/10/2026 → 2026-10-10, seul format que le site sait trier. */
function normaliserDate(valeur) {
  const texte = String(valeur || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(texte)) return texte

  const m = texte.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (!m) return texte

  const annee = m[3].length === 2 ? `20${m[3]}` : m[3]
  return `${annee}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

// Une ligne de la feuille → la forme attendue par l'agenda du site.
function versEvenement(ligne) {
  const places = Number(ligne.places) || 0
  // La colonne « Places » de la feuille accepte « Complet » à la place d'un
  // nombre : la table est fermée sans qu'on sache — ni qu'on ait à saisir — le
  // nombre d'inscrits. Le script envoie alors `complet`; une feuille plus
  // ancienne, ou une saisie à la main, peut aussi laisser passer le mot.
  const complet =
    ligne.complet === true || /^complet\b/i.test(String(ligne.places || '').trim())

  const kind = normaliserType(ligne.type)

  return {
    date: normaliserDate(ligne.date),
    time: typo(ligne.horaire),
    kind: kind,
    title: typo(ligne.titre),
    game: typo(ligne.jeu),
    place: typo(ligne.lieu),
    gm: typo(ligne.mj),
    text: typo(ligne.description),
    places: places,
    inscrits: Number(ligne.inscrits) || 0,
    complet: complet,
    // Compter et inscrire sont deux choses distinctes.
    //
    // Le compteur ne dépend que des places : une table peut annoncer « 2 places
    // restantes » tout en confiant l'inscription à son salon Discord — c'est le
    // cas des tables d'un MJ, dont les places sont recopiées de son annonce et
    // les inscrits relevés sur l'événement Discord.
    //
    // Le formulaire du site s'ouvre dans deux cas.
    //
    // Une soirée mensuelle l'ouvre toujours, même quand elle renvoie aussi à son
    // salon Discord : c'est le créneau par lequel on entre à la Guilde, et on ne
    // peut pas demander d'être déjà sur le serveur pour s'y inscrire. Les deux
    // guichets cohabitent donc là, et là seulement — le bouton Discord pour qui
    // y est déjà, le formulaire pour qui n'y est pas encore ou n'a pas de compte.
    //
    // Les autres tables gardent un guichet unique : le formulaire à défaut de
    // lien Discord, et seulement si des places sont annoncées. Proposer deux
    // portes d'entrée pour la table d'un MJ ne ferait que disperser ses inscrits.
    form: !complet && (kind === 'mensuelle' || (!ligne.lien && places > 0)),
    signup: ligne.lien || undefined,
  }
}

/**
 * Places restantes, ou `null` quand la partie n'en déclare pas.
 * Une table déclarée complète dans la feuille renvoie 0, sans quoi le site
 * n'aurait rien à afficher : c'est ce 0 qui devient l'étiquette « Complet ».
 */
export function placesRestantes(event) {
  if (!event) return null
  if (event.complet) return 0
  if (!event.places) return null
  return Math.max(0, event.places - (event.inscrits || 0))
}
