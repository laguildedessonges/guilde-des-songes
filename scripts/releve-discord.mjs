// Relevé des « Intéressé·e » des événements Discord de la Guilde.
//
// Pourquoi ce script existe : la feuille Google qui pilote l'agenda ne peut pas
// interroger Discord elle-même. Discord bloque à l'entrée (code 40333) tout
// appel de bot venu des serveurs de Google, d'où s'exécute Apps Script. Ce
// script tourne donc chez GitHub (workflow « Relever les intéressés Discord »),
// toutes les quinze minutes, et publie le résultat dans un fichier JSON sur la
// branche `donnees`. La feuille n'a plus qu'à lire ce fichier.
//
// Entrées (variables d'environnement) :
//   DISCORD_TOKEN    jeton du bot — secret du dépôt, jamais écrit dans le code ;
//   DISCORD_SERVEUR  identifiant du serveur Discord de la Guilde.
// Sortie : le chemin passé en argument (défaut : interesses.json) :
//   { releveLe, serveur, evenements: { <id>: { nom, debut, interesses: [...] } } }
//
// À la Guilde, cliquer « Intéressé·e » vaut inscription : c'est la convention
// de l'association. Le pseudo retenu est le surnom sur le serveur, à défaut le
// nom d'affichage, à défaut le nom de compte — c'est sous ce nom qu'on se connaît.

import { writeFileSync } from 'node:fs'

const jeton = process.env.DISCORD_TOKEN
const serveur = process.env.DISCORD_SERVEUR
const sortie = process.argv[2] || 'interesses.json'

if (!jeton || !serveur) {
  console.error('DISCORD_TOKEN et DISCORD_SERVEUR doivent être définis.')
  process.exit(1)
}

// Discord exige que les bots se présentent ainsi ; sans cet en-tête, sa
// protection rejette la requête avant même de la lire.
const USER_AGENT = 'DiscordBot (https://github.com/laguildedessonges/guilde-des-songes, 1.0)'

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

async function discord(chemin) {
  for (let essai = 0; essai < 4; essai++) {
    const reponse = await fetch(`https://discord.com/api/v10${chemin}`, {
      headers: { Authorization: `Bot ${jeton}`, 'User-Agent': USER_AGENT },
    })
    if (reponse.status === 429) {
      // Trop d'appels d'un coup : Discord dit combien attendre.
      const attente = Number(reponse.headers.get('retry-after') || 2)
      await pause(attente * 1000 + 250)
      continue
    }
    if (!reponse.ok) {
      throw new Error(`Discord répond ${reponse.status} sur ${chemin} : ${await reponse.text()}`)
    }
    return reponse.json()
  }
  throw new Error(`Discord limite toujours les appels sur ${chemin} après quatre essais.`)
}

/** Pseudos des intéressés d'un événement, toutes pages confondues (100 par appel). */
async function interesses(evenementId) {
  const pseudos = []
  let apres = ''
  for (let page = 0; page < 10; page++) {
    const lot = await discord(
      `/guilds/${serveur}/scheduled-events/${evenementId}/users` +
        `?limit=100&with_member=true${apres ? `&after=${apres}` : ''}`,
    )
    for (const entree of lot) {
      const utilisateur = entree.user || {}
      const membre = entree.member || {}
      const pseudo = String(membre.nick || utilisateur.global_name || utilisateur.username || '').trim()
      if (pseudo) pseudos.push(pseudo)
    }
    apres = lot.length ? (lot[lot.length - 1].user || {}).id : ''
    if (lot.length < 100 || !apres) break
  }
  return pseudos
}

// Discord ne garde que les événements à venir ou en cours : un événement
// terminé ou annulé disparaît de cette liste de lui-même.
const evenements = await discord(`/guilds/${serveur}/scheduled-events`)

const releve = { releveLe: new Date().toISOString(), serveur, evenements: {} }
for (const evenement of evenements) {
  releve.evenements[evenement.id] = {
    nom: evenement.name,
    debut: evenement.scheduled_start_time,
    interesses: await interesses(evenement.id),
  }
}

writeFileSync(sortie, `${JSON.stringify(releve, null, 2)}\n`)

const total = Object.values(releve.evenements).reduce((n, e) => n + e.interesses.length, 0)
console.log(`${evenements.length} événement(s), ${total} intéressé·e(s) → ${sortie}`)
