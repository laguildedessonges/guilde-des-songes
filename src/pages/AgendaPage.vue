<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeading from '../components/PageHeading.vue'
import AgendaCalendar from '../components/AgendaCalendar.vue'
import EventDialog from '../components/EventDialog.vue'
import EventDetail from '../components/EventDetail.vue'
import { events as localEvents, KIND_LABELS } from '../data/events.js'
import {
  agendaPerime,
  agendaRecu,
  fetchAgenda,
  rechargerAgenda,
} from '../data/sheet.js'
import {
  eventKey,
  formatDate,
  kindColor,
  kindLabel,
  kindOf,
  libelleJeu,
  sansPrefixeMJ,
} from '../data/evenement-affichage.js'
import { typo } from '../typographie.js'

// Six vignettes par page (3 colonnes × 2 lignes) : la page reste courte quel
// que soit le nombre de parties annoncées.
const PAGE_SIZE = 6

const route = useRoute()

const today = new Date().toISOString().slice(0, 10)

// L'agenda vient de la feuille Google quand elle est configurée et joignable ;
// sinon on retombe sur les parties écrites dans events.js — jamais de page vide.
//
// Rien n'est affiché avant la réponse de la feuille : afficher les parties
// locales tout de suite les faisait apparaître puis disparaître au profit de
// celles de la feuille, comme si l'agenda annonçait des parties fantômes.
//
// La requête, elle, est partie dès l'ouverture du site (main.js) : le plus
// souvent la réponse est déjà là quand on arrive ici, et l'agenda s'affiche du
// premier coup. On part donc de ce qui est déjà en mémoire.
const dejaRecu = agendaRecu()

const events = ref(dejaRecu === undefined ? [] : dejaRecu || localEvents)
const chargement = ref(dejaRecu === undefined)
const feuilleMuette = ref(dejaRecu === null)

function afficher(depuisFeuille) {
  feuilleMuette.value = !depuisFeuille
  events.value = depuisFeuille || localEvents
  chargement.value = false
}

onMounted(async () => {
  if (chargement.value) {
    afficher(await fetchAgenda())
  } else if (agendaPerime()) {
    // Agenda déjà à l'écran : on ne redemande la feuille que si la réponse a
    // vieilli — les places restantes bougent — et le remplacement se fait en
    // arrière-plan, sans écran d'attente. Une feuille muette ne l'efface pas.
    const frais = await rechargerAgenda()
    if (frais) afficher(frais)
  }

  // Les parties sont en place : le jour demandé dans l'URL peut s'ouvrir.
  ouvrirJourDeLUrl()
})

const sorted = computed(() => [...events.value].sort((a, b) => a.date.localeCompare(b.date)))

// Les parties passées quittent la liste mais restent consultables dans le
// calendrier : leur pastille y demeure, en retrait.
const upcoming = computed(() => sorted.value.filter((event) => event.date >= today))

const marks = computed(() =>
  sorted.value.map((event) => ({
    date: event.date,
    color: kindColor(event),
    past: event.date < today,
  })),
)

// Légende complète : les quatre types sont toujours annoncés, même si l'agenda
// n'en contient aucun ce mois-ci — le code couleur reste lisible d'emblée.
// Un type inattendu réellement présent dans la feuille vient s'y ajouter.
const TYPES_LEGENDE = ['campagne', 'one-shot', 'mensuelle', 'evenement']

const legend = computed(() => {
  const presents = new Set(sorted.value.map(kindOf))
  const types = [...TYPES_LEGENDE, ...[...presents].filter((t) => !TYPES_LEGENDE.includes(t))]

  return types.map((type) => ({
    label: KIND_LABELS[type] || type,
    color: `var(--kind-${type})`,
  }))
})

// Jour choisi dans le calendrier : ses lignes s'affichent sous le calendrier,
// dans la page, comme avant.
const openDate = ref(null)

const openEvents = computed(() =>
  openDate.value ? sorted.value.filter((item) => item.date === openDate.value) : [],
)

// Plusieurs lignes le même jour : panneaux resserrés, côte à côte.
const detailsCompacts = computed(() => openEvents.value.length > 1)

// Vignette ouverte en fenêtre au premier plan : une seule à la fois, elle en
// occupe tout le cadre. Ouverte depuis « Prochaines échéances », ou depuis un
// panneau resserré dont le texte ne tient pas en entier.
const modalKey = ref(null)

const modalEvent = computed(() =>
  sorted.value.find((item) => eventKey(item) === modalKey.value),
)

const dialogTitre = computed(() =>
  modalEvent.value ? formatDate(modalEvent.value.date) : '',
)

const page = ref(0)

const pageCount = computed(() => Math.max(1, Math.ceil(upcoming.value.length / PAGE_SIZE)))

const paged = computed(() =>
  upcoming.value.slice(page.value * PAGE_SIZE, page.value * PAGE_SIZE + PAGE_SIZE),
)

// Une suppression de partie ne doit pas laisser la pagination dans le vide.
watch(pageCount, (count) => {
  if (page.value > count - 1) page.value = count - 1
})

function fermerFenetre() {
  modalKey.value = null
}

// Depuis « Prochaines échéances » : la vignette s'ouvre en fenêtre.
function ouvrirFenetre(event) {
  modalKey.value = eventKey(event)
}

// Clic sur une pastille du calendrier : tout ce qui a lieu ce jour-là s'affiche
// sous le calendrier, et la page de vignettes correspondante est amenée.
function selectDate(iso) {
  openDate.value = openDate.value === iso ? null : iso
  if (!openDate.value) return

  const index = upcoming.value.findIndex((item) => item.date === openDate.value)
  if (index !== -1) page.value = Math.floor(index / PAGE_SIZE)
}

// Lien profond, tel que la gazette en pose : /agenda?jour=2026-09-19 ouvre ce
// jour-là. Le calendrier suit la sélection et se place de lui-même sur le bon
// mois ; on amène en plus le panneau à l'écran, sans quoi le lien déposerait le
// lecteur en haut de la page, au-dessus de ce qu'il venait voir.
const panneauJour = ref(null)

// Le jour réclamé par l'URL, gardé à part : c'est lui qui décide du mois sur
// lequel le calendrier s'ouvre. Le lui faire suivre par la sélection ne
// marchait pas — le calendrier se pose aussi sur le mois de la prochaine
// partie, et selon l'ordre des deux réglages le jour demandé restait invisible
// dans la grille. Une fois posé, il ne s'effacera pas si l'on referme le jour :
// le calendrier ne bougerait alors plus sous les pieds du lecteur.
const jourDemande = ref('')

const focusCalendrier = computed(
  () => jourDemande.value || (upcoming.value.length ? upcoming.value[0].date : ''),
)

async function ouvrirJourDeLUrl() {
  const jour = String(route.query.jour || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return

  jourDemande.value = jour
  openDate.value = jour

  const index = upcoming.value.findIndex((item) => item.date === jour)
  if (index !== -1) page.value = Math.floor(index / PAGE_SIZE)

  await nextTick()
  panneauJour.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// Un autre jour demandé sans quitter la page (deux renvois d'un même numéro).
watch(() => route.query.jour, ouvrirJourDeLUrl)

const shortDateFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

function formatShortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return shortDateFormat.format(new Date(y, m - 1, d))
}
</script>

<template>
  <section class="section">
    <div class="container">
      <PageHeading
        kicker="Agenda"
        title="L'agenda des parties et des événements"
        lead="Les salons Discord permettent aux maîtres du jeu d'annoncer leurs parties. Les joueuses et joueurs peuvent s'y inscrire."
      >
        <p>
          Les soirées mensuelles sont ouvertes à toutes et tous, sans compte Discord
          nécessaire&nbsp;: écrivez-nous depuis la soirée qui vous intéresse.
        </p>
      </PageHeading>

      <AgendaCalendar
        :marks="marks"
        :selected="openDate"
        :focus="focusCalendrier"
        @select="selectDate"
      />

      <ul class="legend">
        <li v-for="item in legend" :key="item.label" class="legend__item">
          <span class="legend__dot" :style="{ background: item.color }" aria-hidden="true" />
          {{ item.label }}
        </li>
      </ul>

      <!-- Jour choisi dans le calendrier : ses lignes s'affichent ici, dans la
           page. À plusieurs, elles se resserrent côte à côte ; un clic ouvre
           alors la vignette en fenêtre, où elle tient en entier. -->
      <div v-if="openEvents.length" ref="panneauJour" class="jour">
        <p v-if="detailsCompacts" class="details__intro">
          {{ openEvents.length }} rendez-vous le {{ formatDate(openDate) }}
        </p>

        <div class="details" :class="{ 'details--compacts': detailsCompacts }">
        <component
          :is="detailsCompacts ? 'button' : 'article'"
          v-for="item in openEvents"
          :key="eventKey(item)"
          class="detail"
          :class="{ 'detail--cliquable': detailsCompacts }"
          :style="{ '--kind-color': kindColor(item) }"
          :title="detailsCompacts ? 'Voir le détail' : undefined"
          @click="detailsCompacts ? ouvrirFenetre(item) : null"
        >
          <EventDetail :event="item" :today="today" :compact="detailsCompacts" />
        </component>
        </div>
      </div>

      <!-- Vignette sélectionnée : au premier plan, cadre de taille fixe. -->
      <EventDialog v-if="modalEvent" :titre="dialogTitre" @close="fermerFenetre">
        <article class="detail detail--fenetre" :style="{ '--kind-color': kindColor(modalEvent) }">
          <EventDetail :event="modalEvent" :today="today" />
        </article>
      </EventDialog>

      <!-- Vignettes minimalistes : le détail s'ouvre au clic. -->
      <div v-if="upcoming.length" class="upcoming">
        <div class="upcoming__head">
          <h2 class="upcoming__title">Prochaines échéances</h2>
          <div v-if="pageCount > 1" class="upcoming__nav">
            <button
              class="upcoming__arrow"
              aria-label="Parties précédentes"
              :disabled="page === 0"
              @click="page--"
            >
              ‹
            </button>
            <span class="upcoming__count">{{ page + 1 }} / {{ pageCount }}</span>
            <button
              class="upcoming__arrow"
              aria-label="Parties suivantes"
              :disabled="page >= pageCount - 1"
              @click="page++"
            >
              ›
            </button>
          </div>
        </div>

        <ul class="cards">
          <li v-for="event in paged" :key="eventKey(event)">
            <button
              class="card"
              :class="{ 'card--open': modalKey === eventKey(event) }"
              :style="{ '--kind-color': kindColor(event) }"
              :aria-haspopup="'dialog'"
              @click="ouvrirFenetre(event)"
            >
              <span class="card__kind">{{ kindLabel(event) }}</span>
              <span class="card__date">{{ formatShortDate(event.date) }}</span>
              <span v-if="event.title" class="card__title">{{ typo(event.title) }}</span>
              <span v-if="event.game" class="card__champ">
                <span class="card__etiquette">{{ libelleJeu(event) }}</span>{{ typo(event.game) }}
              </span>
              <span v-if="event.gm" class="card__champ">
                <span class="card__etiquette">MJ</span>{{ typo(sansPrefixeMJ(event.gm)) }}
              </span>
              <span v-if="event.text" class="card__text">{{ typo(event.text) }}</span>
            </button>
          </li>
        </ul>
      </div>

      <p v-else-if="chargement" class="agenda__empty">Chargement de l'agenda…</p>

      <!-- Feuille injoignable : le dire, plutôt que laisser croire qu'aucune
           partie n'est prévue. -->
      <p v-else-if="feuilleMuette" class="agenda__empty">
        L'agenda n'a pas pu être chargé. Les prochaines tables sont annoncées sur le
        Discord de la Guilde.
      </p>

      <p v-else class="agenda__empty">
        Aucune partie n'est annoncée pour le moment. Les prochaines tables sont publiées
        ici dès qu'elles sont ouvertes.
      </p>
    </div>
  </section>
</template>

<style scoped>
/* Légende du code couleur, sous le calendrier */
.legend {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.legend__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.legend__dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

/* Panneaux du jour choisi : dans la page, sur toute sa largeur. L'intitulé du
   jour reste hors de la grille — un élément qui la traverse empêcherait les
   colonnes vides de s'effacer, et les panneaux ne s'étireraient pas. */
.jour {
  margin-top: 1.75rem;
}

/* Liste paginée */
.upcoming {
  margin-top: 2.5rem;
}

.upcoming__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.upcoming__title {
  font-size: 1.5rem;
}

.upcoming__nav {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.upcoming__arrow {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--bg);
  color: var(--accent);
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: var(--shadow-out-sm);
  transition: box-shadow 0.2s ease;
}

.upcoming__arrow:hover:not(:disabled) {
  box-shadow: var(--shadow-out-sm), var(--glow);
}

.upcoming__arrow:active:not(:disabled) {
  box-shadow: var(--shadow-in-sm);
}

.upcoming__arrow:disabled {
  opacity: 0.4;
  cursor: default;
}

.upcoming__count {
  color: var(--text-muted);
  font-size: 1rem;
  white-space: nowrap;
}

/* Trois colonnes de deux vignettes, sans défilement interne */
/* Le nombre de vignettes par ligne suit la largeur de la page : trois sur un
   grand écran, deux sur une tablette, une sur un téléphone — sans point de
   rupture à maintenir. */
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16.25rem, 100%), 1fr));
  gap: 1.25rem;
}

/* Vignette minimaliste : type, date, titre — le reste au clic. */
.card {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 0.3rem;
  padding: 1.1rem 1.25rem;
  border: none;
  border-left: 5px solid var(--kind-color);
  border-radius: var(--radius);
  background: var(--bg-panel);
  color: var(--text);
  font-family: var(--font-body);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.25s ease;
}

.card:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.card--open {
  box-shadow: var(--shadow-in-sm);
}

.card__kind {
  color: var(--kind-color);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.card__date {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  text-transform: capitalize;
}

.card__title {
  font-size: 1.05rem;
  line-height: 1.35;
}

/* Jeu et MJ, précédés de leur intitulé : lisibles d'un coup d'œil. */
.card__champ {
  color: var(--text);
  font-size: 0.98rem;
  line-height: 1.35;
}

.card__etiquette {
  color: var(--kind-color);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-right: 0.45rem;
}

/* Extrait borné à deux lignes : la description complète s'ouvre au clic. */
.card__text {
  color: var(--text-muted);
  font-size: 0.98rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.agenda__empty {
  margin-top: 2rem;
  color: var(--text-muted);
}
</style>
