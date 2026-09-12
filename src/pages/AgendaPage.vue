<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import PageHeading from '../components/PageHeading.vue'
import AgendaCalendar from '../components/AgendaCalendar.vue'
import SignupForm from '../components/SignupForm.vue'
import EventDialog from '../components/EventDialog.vue'
import { events as localEvents, KIND_LABELS } from '../data/events.js'
import {
  agendaPerime,
  agendaRecu,
  fetchAgenda,
  placesRestantes,
  rechargerAgenda,
} from '../data/sheet.js'
import { typo } from '../typographie.js'

// Six vignettes par page (3 colonnes × 2 lignes) : la page reste courte quel
// que soit le nombre de parties annoncées.
const PAGE_SIZE = 6

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
    return
  }

  // Agenda déjà à l'écran : on ne redemande la feuille que si la réponse a
  // vieilli — les places restantes bougent — et le remplacement se fait en
  // arrière-plan, sans écran d'attente. Une feuille muette ne l'efface pas.
  if (agendaPerime()) {
    const frais = await rechargerAgenda()
    if (frais) afficher(frais)
  }
})

const sorted = computed(() => [...events.value].sort((a, b) => a.date.localeCompare(b.date)))

// Les parties passées quittent la liste mais restent consultables dans le
// calendrier : leur pastille y demeure, en retrait.
const upcoming = computed(() => sorted.value.filter((event) => event.date >= today))

function eventKey(event) {
  return event.date + event.title
}

// Le type vient de la feuille et pilote couleur et libellé ; la présence d'un
// formulaire d'inscription, elle, ne dépend que du nombre de places.
function kindOf(event) {
  return event.kind || 'one-shot'
}

function kindLabel(event) {
  return KIND_LABELS[kindOf(event)] || kindOf(event)
}

// Places affichées : décompte réel venu de la feuille, sinon le texte de events.js.
function placesLabel(event) {
  const restantes = placesRestantes(event)
  if (restantes === null) return event.seats || ''
  if (restantes === 0) return 'Complet'
  return `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
}

function estComplet(event) {
  return placesRestantes(event) === 0
}

// Les cellules laissées vides dans la feuille ne doivent laisser aucune trace :
// on assemble les lignes d'information à partir des seuls champs remplis.
function joindre(...parties) {
  return typo(parties.filter((p) => p && String(p).trim()).join(' · '))
}

// Une soirée mensuelle propose plusieurs tables : son étiquette se met au pluriel.
function libelleJeu(event) {
  return kindOf(event) === 'mensuelle' ? 'Jeux' : 'Jeu'
}

// La colonne MJ de la feuille contient souvent « MJ : Marc » : l'étiquette de la
// vignette le dit déjà, on ne répète donc pas le préfixe.
function sansPrefixeMJ(valeur) {
  return String(valeur || '').replace(/^\s*MJ\s*:\s*/i, '')
}

function kindColor(event) {
  return `var(--kind-${kindOf(event)})`
}

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

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const shortDateFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFormat.format(new Date(y, m - 1, d))
}

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
          nécessaire&nbsp;: écrivez-nous depuis la soirée qui vous intéresse. Nous
          aimons échanger avant de vous inscrire — pour répondre à vos questions, et
          vous accueillir comme il faut si c'est votre première partie.
        </p>
      </PageHeading>

      <AgendaCalendar
        :marks="marks"
        :selected="openDate"
        :focus="upcoming.length ? upcoming[0].date : ''"
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
      <div v-if="openEvents.length" class="jour">
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
          <p class="detail__kind">{{ kindLabel(item) }}</p>
          <h2 class="detail__title">{{ typo(item.title) }}</h2>
          <p class="detail__when">
            {{ joindre(item.time, item.place) }}
          </p>
          <p v-if="item.game" class="detail__champ">
            <span class="detail__etiquette">{{ libelleJeu(item) }}</span>{{ typo(item.game) }}
          </p>
          <p v-if="item.gm" class="detail__champ">
            <span class="detail__etiquette">MJ</span>{{ typo(sansPrefixeMJ(item.gm)) }}
          </p>

          <p v-if="item.text" class="detail__text detail__text--court">{{ typo(item.text) }}</p>

          <!-- Zone d'action : dans la fenêtre, elle se centre dans l'espace resté
               libre sous la description. -->
          <div class="detail__actions">
          <p v-if="item.date < today" class="detail__past">Cette partie a déjà eu lieu.</p>

          <template v-else>
            <p
              v-if="placesLabel(item)"
              class="detail__seats"
              :class="{ 'detail__seats--complet': estComplet(item) }"
            >
              {{ placesLabel(item) }}
            </p>

            <p v-if="estComplet(item)" class="detail__closed">
              C'est complet. Écrivez-nous sur le Discord pour la liste d'attente.
            </p>

            <SignupForm
              v-else-if="item.form"
              :title="item.title"
              :date="item.date"
              :time="item.time"
            />
            <a
              v-else-if="item.signup"
              class="btn btn--primary detail__btn"
              :href="item.signup"
              target="_blank"
              rel="noopener"
            >
              S'inscrire sur le Discord
            </a>
            <p v-else-if="item.kind === 'campagne'" class="detail__closed">
              Table fermée&nbsp;: la campagne suit son cours.
            </p>
          </template>
          </div>
        </component>
        </div>
      </div>

      <!-- Vignette sélectionnée : au premier plan, cadre de taille fixe. -->
      <EventDialog v-if="modalEvent" :titre="dialogTitre" @close="fermerFenetre">
        <article class="detail detail--fenetre" :style="{ '--kind-color': kindColor(modalEvent) }">
          <p class="detail__kind">{{ kindLabel(modalEvent) }}</p>
          <h2 class="detail__title">{{ typo(modalEvent.title) }}</h2>
          <p class="detail__when">
            {{ joindre(modalEvent.time, modalEvent.place) }}
          </p>
          <p v-if="modalEvent.game" class="detail__champ">
            <span class="detail__etiquette">{{ libelleJeu(modalEvent) }}</span>{{ typo(modalEvent.game) }}
          </p>
          <p v-if="modalEvent.gm" class="detail__champ">
            <span class="detail__etiquette">MJ</span>{{ typo(sansPrefixeMJ(modalEvent.gm)) }}
          </p>

          <p v-if="modalEvent.text" class="detail__text">{{ typo(modalEvent.text) }}</p>

          <!-- Zone d'action : dans la fenêtre, elle se centre dans l'espace resté
               libre sous la description. -->
          <div class="detail__actions">
          <p v-if="modalEvent.date < today" class="detail__past">Cette partie a déjà eu lieu.</p>

          <template v-else>
            <p
              v-if="placesLabel(modalEvent)"
              class="detail__seats"
              :class="{ 'detail__seats--complet': estComplet(modalEvent) }"
            >
              {{ placesLabel(modalEvent) }}
            </p>

            <p v-if="estComplet(modalEvent)" class="detail__closed">
              C'est complet. Écrivez-nous sur le Discord pour la liste d'attente.
            </p>

            <SignupForm
              v-else-if="modalEvent.form"
              :title="modalEvent.title"
              :date="modalEvent.date"
              :time="modalEvent.time"
            />
            <a
              v-else-if="modalEvent.signup"
              class="btn btn--primary detail__btn"
              :href="modalEvent.signup"
              target="_blank"
              rel="noopener"
            >
              S'inscrire sur le Discord
            </a>
            <p v-else-if="modalEvent.kind === 'campagne'" class="detail__closed">
              Table fermée&nbsp;: la campagne suit son cours.
            </p>
          </template>
          </div>
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
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* Panneaux du jour choisi : dans la page, sur toute sa largeur. L'intitulé du
   jour reste hors de la grille — un élément qui la traverse empêcherait les
   colonnes vides de s'effacer, et les panneaux ne s'étireraient pas. */
.jour {
  margin-top: 1.75rem;
}

.details {
  display: grid;
  gap: 1rem;
}

.details--compacts {
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  align-items: stretch;
}

.details__intro {
  margin-bottom: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: capitalize;
}

/* Panneau de détails : liseré à la couleur du type */
.detail {
  padding: 1.5rem 1.75rem;
  border: none;
  border-left: 5px solid var(--kind-color);
  border-radius: var(--radius);
  background: var(--bg-panel);
  color: var(--text);
  font-family: var(--font-body);
  text-align: left;
  box-shadow: var(--shadow-out);
}

/* Resserré : le texte est borné, et la vignette s'ouvre en fenêtre au clic. */
.details--compacts .detail {
  padding: 1.1rem 1.25rem;
}

.details--compacts .detail__title {
  font-size: 1.2rem;
}

.detail--cliquable {
  width: 100%;
  cursor: pointer;
  transition: box-shadow 0.25s ease;
}

.detail--cliquable:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.detail__text--court {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Dans la fenêtre, la vignette occupe tout le cadre, en hauteur comme en
   largeur : ni relief ni fond propres, et l'action reste en bas. */
.detail--fenetre {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 0 1.25rem;
  background: none;
  box-shadow: none;
}

/* La marge basse du texte fausserait le centrage : l'écart est porté par la
   zone d'action elle-même. */
.detail--fenetre .detail__text {
  margin-bottom: 0;
}

/* L'action occupe l'espace resté libre sous la description, et s'y centre —
   verticalement comme horizontalement. */
.detail--fenetre .detail__actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
}

.detail--fenetre .detail__seats,
.detail--fenetre .detail__closed,
.detail--fenetre .detail__past {
  text-align: center;
}

/* Le formulaire garde une largeur confortable sans s'étirer sur tout le cadre. */
.detail--fenetre :deep(.signup),
.detail--fenetre :deep(.signup__done) {
  width: min(440px, 100%);
}

.detail__kind {
  color: var(--kind-color);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.detail__title {
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
}

.detail__when {
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: 0.2rem;
}

.detail__champ {
  color: var(--text);
  font-size: 1rem;
  line-height: 1.4;
}

.detail__etiquette {
  color: var(--kind-color);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-right: 0.45rem;
}

.detail__champ + .detail__text,
.detail__when + .detail__text {
  margin-top: 0.8rem;
}

/* Corps du texte justifié, comme le reste du site. */
.detail__text {
  color: var(--text-muted);
  margin-bottom: 1rem;
  text-align: justify;
}

.detail__seats--complet {
  color: var(--text-muted);
}

.detail__actions {
  display: contents;
}

.detail--fenetre .detail__actions {
  display: flex;
}

.detail__seats {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  box-shadow: var(--shadow-in-sm);
  color: var(--accent);
  font-weight: 700;
  font-size: 0.95rem;
}

.detail__past,
.detail__closed {
  color: var(--text-muted);
  font-style: italic;
}

.detail__btn {
  font-size: 1rem;
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
  width: 40px;
  height: 40px;
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
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
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

@media (max-width: 620px) {
.detail {
    padding: 1.25rem;
  }
}
</style>
