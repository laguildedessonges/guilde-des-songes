<script setup>
// Recherche du site. Le site étant statique, tout se passe dans le navigateur :
// l'index est dans le bundle, et les parties de l'agenda s'y ajoutent si la
// feuille a répondu.
//
// La loupe s'étire vers la gauche en champ de saisie, plutôt que d'ouvrir une
// fenêtre : la barre reste la barre, et les résultats tombent dessous. Le
// composant annonce son ouverture à l'entête, qui efface pendant ce temps les
// pastilles que le champ recouvre.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IconGlyph from './IconGlyph.vue'
import { chercher, extrait } from '../data/recherche.js'
import { agendaRecu, fetchAgenda } from '../data/sheet.js'
import { typo } from '../typographie.js'

const router = useRouter()
const emit = defineEmits(['bascule'])

const ouverte = ref(false)
const requete = ref('')
const champ = ref(null)
const racine = ref(null)
const evenements = ref(agendaRecu() || [])
const styleBoite = ref(null)

const resultats = computed(() => chercher(requete.value, evenements.value))

// Le champ s'arrête juste avant le dernier lien du menu : il s'étire dans la
// place libre de la barre, sans passer par-dessus « Ressources ». Cette place,
// seule la fenêtre la connaît — d'où une mesure, faute de pouvoir l'écrire en
// CSS. Il déborde à droite jusqu'au bord de la colonne du site, par-dessus les
// pastilles voisines : ouvert, c'est lui qu'on regarde. Quand le menu est
// replié dans le burger, rien de tout cela n'a lieu d'être : le champ reprend
// son ancrage sur la loupe.
function mesurer() {
  const bouton = racine.value?.querySelector('.social-btn')
  const entete = racine.value?.closest('.header')
  const colonne = entete?.querySelector('.container')
  if (!bouton || !entete || !colonne) return
  const nav = entete.querySelector('.header__nav')
  const menu = nav?.getBoundingClientRect()
  const barre = entete.getBoundingClientRect()
  const dansLaBarre = menu && menu.width > 0 && menu.bottom <= barre.bottom + 1
  if (!dansLaBarre) {
    styleBoite.value = null
    return
  }
  // Le bord droit des liens, et non celui du menu : le menu peut se rétrécir
  // sous son contenu (`min-width: 0`), ses liens dépassent alors de sa boîte.
  const finDuMenu = Math.max(...[...nav.children].map((e) => e.getBoundingClientRect().right))
  const bordDroit = colonne.getBoundingClientRect().right
  styleBoite.value = {
    right: `${Math.round(bouton.getBoundingClientRect().right - bordDroit)}px`,
    // Un plafond, pas une largeur : le champ garde sa taille habituelle et ne
    // fait que se raccourcir quand le menu arrive à sa hauteur. Il passe par
    // une variable, et non par `max-width` : le style en ligne l'emporterait
    // sur les classes de transition, et le champ s'ouvrirait d'un coup.
    '--recherche-place': `${Math.max(0, Math.round(bordDroit - finDuMenu - 12))}px`,
  }
}

async function ouvrir() {
  ouverte.value = true
  await nextTick()
  mesurer()
  champ.value?.focus()

  // L'agenda n'a pas toujours répondu quand on ouvre la recherche : on le
  // demande alors, pour que les parties soient cherchables elles aussi.
  if (!evenements.value.length) {
    evenements.value = (await fetchAgenda()) || []
  }
}

function fermer() {
  ouverte.value = false
  requete.value = ''
}

function allerA(resultat) {
  router.push(resultat.to)
  fermer()
}

// Un clic ailleurs referme la recherche, comme n'importe quel déroulant.
function surClicAilleurs(evenement) {
  if (ouverte.value && racine.value && !racine.value.contains(evenement.target)) fermer()
}

onMounted(() => {
  document.addEventListener('click', surClicAilleurs)
  window.addEventListener('resize', mesurer)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', surClicAilleurs)
  window.removeEventListener('resize', mesurer)
})

// Changer de page referme la recherche, y compris par la touche Retour.
watch(() => router.currentRoute.value.fullPath, fermer)

watch(ouverte, (valeur) => emit('bascule', valeur))
</script>

<template>
  <div ref="racine" class="recherche">
    <button
      class="social-btn recherche__bouton"
      :class="{ 'recherche__bouton--efface': ouverte }"
      aria-label="Rechercher sur le site"
      title="Rechercher"
      :aria-expanded="ouverte"
      @click="ouverte ? fermer() : ouvrir()"
    >
      <IconGlyph name="search" />
    </button>

    <Transition name="boite">
      <div v-if="ouverte" class="recherche__boite" :style="styleBoite">
        <IconGlyph class="recherche__loupe" name="search" />
        <input
          ref="champ"
          v-model="requete"
          class="recherche__champ"
          type="search"
          placeholder="Une partie, un numéro, un lieu…"
          aria-label="Votre recherche"
          @keydown.esc="fermer"
        />
        <button class="recherche__fermer" aria-label="Fermer la recherche" @click="fermer">×</button>
      </div>
    </Transition>

    <Transition name="resultats">
      <div v-if="ouverte && requete.trim()" class="recherche__resultats">
        <p v-if="!resultats.length" class="recherche__vide">
          Rien ne correspond à «&nbsp;{{ requete.trim() }}&nbsp;».
        </p>

        <ul v-else class="recherche__liste">
          <li v-for="resultat in resultats" :key="resultat.rubrique + resultat.titre">
            <button class="resultat" @click="allerA(resultat)">
              <span class="resultat__rubrique">
                {{ resultat.rubrique }}<template v-if="resultat.detail"> · {{ resultat.detail }}</template>
              </span>
              <span class="resultat__titre">{{ typo(resultat.titre) }}</span>
              <span class="resultat__extrait">{{ typo(extrait(resultat, requete)) }}</span>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Le bouton reste en place, même ouvert : c'est le champ qui vient par-dessus,
   sinon la barre se réorganiserait à chaque ouverture. */
.recherche {
  position: relative;
  display: flex;
}

/* La loupe s'efface pendant que le champ prend sa place : elle est dessous, et
   deux loupes l'une sur l'autre se verraient au passage. */
.recherche__bouton {
  transition: opacity 0.2s ease;
}

.recherche__bouton--efface {
  opacity: 0;
  visibility: hidden;
}

/* Le champ s'étire vers la gauche, ancré sur la loupe. */
.recherche__boite {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(20rem, 68vw);
  max-width: var(--recherche-place, none);
  min-height: 2.75rem;
  overflow: hidden;
  padding: 0 0.6rem 0 1rem;
  border-radius: 999px;
  background: var(--bg);
  box-shadow: var(--shadow-in-sm);
}

/* Le champ sort de la pastille et s'étire vers la gauche — d'où une largeur
   animée, et non un fondu : c'est le geste qu'annonce la loupe. Le plafond
   mesuré passe par `--recherche-place`, que ces classes peuvent donc écraser
   le temps de l'ouverture. */
.boite-enter-active,
.boite-leave-active {
  transition: max-width 0.28s ease, opacity 0.28s ease;
}

.boite-enter-from,
.boite-leave-to {
  max-width: 2.375rem;
  opacity: 0;
}

/* Les résultats, eux, ne s'étirent pas : ils se posent sous la barre. */
.resultats-enter-active,
.resultats-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.resultats-enter-from,
.resultats-leave-to {
  opacity: 0;
  transform: translateY(-0.4rem);
}

.recherche__loupe {
  flex: none;
  color: var(--accent);
  font-size: 1.05rem;
}

.recherche__champ {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
}

.recherche__champ:focus {
  outline: none;
}

/* La croix native du champ « search » varie d'un navigateur à l'autre : on
   pose la nôtre, et on masque la sienne. */
.recherche__champ::-webkit-search-cancel-button {
  display: none;
}

.recherche__fermer {
  flex: none;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 999px;
  background: none;
  color: var(--text-muted);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
}

.recherche__fermer:hover {
  color: var(--accent);
}

/* Les résultats tombent sous l'entête, alignés sur le bord droit de la colonne
   du site — et non sur le bouton, qui n'est pas le dernier de la barre : ancré
   sur lui, le panneau sortait de l'écran par la gauche au téléphone. D'où un
   ancrage à la fenêtre, l'entête étant collante de toute façon. */
.recherche__resultats {
  position: fixed;
  top: calc(var(--band-height) + 0.5rem);
  right: 6.5vw;
  z-index: 40;
  width: min(26rem, 87vw);
  max-height: min(60vh, 32rem);
  overflow-y: auto;
  padding: 0.75rem;
  border-radius: var(--radius);
  background: var(--bg-panel);
  box-shadow: var(--shadow-out);
}

.recherche__vide {
  margin: 0.25rem 0.25rem 0.5rem;
  color: var(--text-muted);
}

.recherche__liste {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Un résultat se lit en trois temps : d'où il vient, ce que c'est, et un
   extrait qui montre pourquoi il ressort. */
.resultat {
  display: grid;
  gap: 0.15rem;
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: none;
  border-radius: var(--radius);
  background: var(--bg-panel-soft);
  color: var(--text);
  font-family: var(--font-body);
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.25s ease;
}

.resultat:hover {
  box-shadow: var(--shadow-in-sm);
}

.resultat__rubrique {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.resultat__titre {
  font-weight: 700;
}

.resultat__extrait {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}
</style>
