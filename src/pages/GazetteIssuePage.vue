<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconGlyph from '../components/IconGlyph.vue'
import EventDialog from '../components/EventDialog.vue'
import EventDetail from '../components/EventDetail.vue'
import { findIssue } from '../data/gazette.js'
import { agendaRecu, fetchAgenda } from '../data/sheet.js'
import { events as localEvents } from '../data/events.js'
import { eventKey, formatDate, kindColor } from '../data/evenement-affichage.js'

const route = useRoute()
const router = useRouter()
const issue = computed(() => findIssue(route.params.slug))

const dateFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

const publishedAt = computed(() => {
  const date = issue.value?.date
  if (!date) return ''
  const [y, m] = date.split('-').map(Number)
  return dateFormat.format(new Date(y, (m || 1) - 1, 1))
})

// Le numéro ne se consulte qu'en ligne : partager, c'est donner son lien.
// Le partage natif du système là où il existe (téléphones, Safari), sinon le
// presse-papier ; et si le navigateur le refuse, le lien est affiché en clair
// pour être copié à la main — jamais d'action qui échoue en silence.
const message = ref('')
let effacement = 0

function annoncer(texte) {
  message.value = texte
  clearTimeout(effacement)
  effacement = setTimeout(() => (message.value = ''), 6000)
}

async function partager() {
  const url = window.location.href

  if (navigator.share) {
    try {
      await navigator.share({ title: issue.value?.title || 'La Gazette rôlistique', url })
      return
    } catch {
      // Partage refermé sans choisir : on retombe sur le presse-papier.
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    annoncer('Lien copié : il est prêt à être collé.')
  } catch {
    annoncer(url)
  }
}

// Les dates du numéro ouvrent la partie sur place, dans une fenêtre : aller à
// l'agenda puis revenir au numéro pour la date suivante ferait faire des
// allers-retours pour rien. Le lien continue de pointer vers l'agenda — c'est
// ce qu'on copie ou ce qu'on ouvre dans un autre onglet, et ce qui reste
// sensible si l'agenda n'a pas répondu.
const today = new Date().toISOString().slice(0, 10)

const agenda = ref(agendaRecu() || [])
const jourOuvert = ref('')

const evenementsDuJour = computed(() =>
  agenda.value
    .filter((item) => item.date === jourOuvert.value)
    .sort((a, b) => String(a.time).localeCompare(String(b.time))),
)

const titreFenetre = computed(() => (jourOuvert.value ? formatDate(jourOuvert.value) : ''))

function fermerFenetre() {
  jourOuvert.value = ''
}

async function ouvrirJour(jour) {
  if (!agenda.value.length) {
    agenda.value = (await fetchAgenda()) || localEvents
  }

  // Aucune partie ce jour-là (feuille muette, ou date sans ligne) : plutôt
  // qu'une fenêtre vide, on emmène le lecteur à l'agenda, comme le lien le dit.
  if (!agenda.value.some((item) => item.date === jour)) return false

  jourOuvert.value = jour
  return true
}

// Les liens du numéro qui pointent vers le site restent dans l'application :
// sans ça, un renvoi vers l'agenda rechargerait toute la page. Les clics
// modifiés (nouvel onglet, milieu) et les liens externes suivent leur cours.
function suivreLien(evenement) {
  const lien = evenement.target.closest('a')
  if (!lien || !lien.href) return
  if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return

  const url = new URL(lien.href, window.location.href)
  if (url.origin !== window.location.origin) return

  const base = import.meta.env.BASE_URL
  const chemin = url.pathname.startsWith(base)
    ? `/${url.pathname.slice(base.length)}`
    : url.pathname

  evenement.preventDefault()

  const jour = url.searchParams.get('jour') || ''
  if (chemin === '/agenda' && /^\d{4}-\d{2}-\d{2}$/.test(jour)) {
    ouvrirJour(jour).then((ouvert) => {
      if (!ouvert) router.push(chemin + url.search)
    })
    return
  }

  router.push(chemin + url.search + url.hash)
}

onBeforeUnmount(() => clearTimeout(effacement))
</script>

<template>
  <section class="section">
    <div class="container">
      <RouterLink class="back" :to="{ name: 'gazette' }">← Tous les numéros</RouterLink>

      <template v-if="issue">
        <header class="issue-head">
          <p class="section__kicker">{{ publishedAt }}</p>
          <h1 class="issue-head__title">{{ issue.title }}</h1>
          <p v-if="issue.numero" class="issue-head__numero">Numéro {{ issue.numero }}</p>

          <button class="btn btn--primary issue-head__share" @click="partager">
            <IconGlyph name="link" />
            Partager le numéro
          </button>

          <p v-if="message" class="issue-head__retour" role="status">{{ message }}</p>
        </header>

        <!-- Contenu Markdown du numéro, converti au build (source : src/gazette/*.md).
             Ses liens internes sont interceptés pour rester dans l'application. -->
        <article class="prose" v-html="issue.html" @click="suivreLien" />

        <!-- Une date du numéro ouvre ici la ou les parties de ce jour-là,
             telles que l'agenda les montre — inscription comprise. -->
        <EventDialog
          v-if="jourOuvert"
          :titre="titreFenetre"
          :events="evenementsDuJour"
          @close="fermerFenetre"
        >
          <article
            v-for="item in evenementsDuJour"
            :key="eventKey(item)"
            class="detail jour__detail"
            :style="{ '--kind-color': kindColor(item) }"
          >
            <EventDetail :event="item" :today="today" />
          </article>
        </EventDialog>
      </template>

      <p v-else class="missing">
        Ce numéro n'existe pas (ou plus).
        <RouterLink :to="{ name: 'gazette' }">Retour à la gazette</RouterLink>.
      </p>
    </div>
  </section>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

.issue-head {
  margin-bottom: 2rem;
}

.issue-head__title {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

/* En lecture, le numéro se place sous le titre, en plus petit : la page est
   déjà celle de ce numéro, il situe la parution sans rien disputer au titre.
   (Dans la liste, où il faut distinguer les numéros entre eux, il suit le titre
   sur la même ligne, séparé d'un point médian.) */
.issue-head__numero {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 1.05rem;
}

.issue-head__share {
  margin-top: 1.5rem;
  font-size: 1rem;
}

/* Retour du partage : le lien affiché en clair peut être long, il doit pouvoir
   se couper plutôt que déborder de la colonne. */
.issue-head__retour {
  margin-top: 0.75rem;
  color: var(--text-muted);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

/* Mise en forme du Markdown rendu : v-html échappe au scoping, d'où :deep. */
.prose {
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 2rem 2.25rem;
  box-shadow: var(--shadow-out);
}

.prose :deep(h2) {
  font-size: 1.35rem;
  margin: 2rem 0 0.75rem;
}

.prose :deep(h3) {
  font-size: 1.15rem;
  margin: 1.5rem 0 0.6rem;
}

.prose :deep(h2:first-child),
.prose :deep(h3:first-child) {
  margin-top: 0;
}

.prose :deep(p) {
  color: var(--text-muted);
  text-align: justify;
  margin-bottom: 1rem;
}

/* Renvois du numéro (vers l'agenda, par exemple) : aux couleurs du site. */
.prose :deep(a) {
  color: var(--accent);
  font-weight: 600;
  text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent);
  text-underline-offset: 0.2em;
}

.prose :deep(ul),
.prose :deep(ol) {
  color: var(--text-muted);
  margin: 0 0 1rem;
  padding-left: 1.4rem;
}

.prose :deep(li) {
  margin-bottom: 0.4rem;
}

/* Encadré d'avertissement : centré, il se détache du corps justifié autour et
   se lit d'un coup d'œil, même quand il tient sur deux lignes. */
.prose :deep(blockquote) {
  margin: 0 0 1rem;
  padding: 1rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-in-sm);
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
}

.prose :deep(blockquote p) {
  margin-bottom: 0;
  text-align: center;
}

/* Deux phrases dans l'encadré : la seconde passe à la ligne, quelle que soit la
   largeur — un simple retour forcé se serait fondu dans le repli du texte. */
.prose :deep(blockquote p + p) {
  margin-top: 0.4rem;
}

.prose :deep(img) {
  border-radius: var(--radius);
  box-shadow: var(--shadow-out-sm);
}

.prose :deep(hr) {
  border: none;
  height: 1px;
  background: var(--border);
  margin: 2rem 0;
}

/* Plusieurs parties le même jour : les panneaux s'empilent dans la fenêtre, qui
   fait défiler son contenu. */
.jour__detail + .jour__detail {
  margin-top: 1rem;
}

.missing {
  color: var(--text-muted);
}

@media (max-width: 620px) {
  .prose {
    padding: 1.5rem 1.25rem;
  }

  /* Justifier une colonne aussi étroite creuse de larges blancs entre les mots :
     au téléphone, le texte du numéro reste au fer à gauche. */
  .prose :deep(p) {
    text-align: left;
  }
}

/* Impression / « Enregistrer au format PDF » : on ne garde que le numéro,
   sans relief ni navigation. */
@media print {
  .back,
  .issue-head__share,
  .issue-head__retour {
    display: none;
  }

  .prose {
    padding: 0;
    box-shadow: none;
    background: none;
  }

  .prose :deep(blockquote) {
    box-shadow: none;
    border-left: 2px solid var(--accent);
  }
}
</style>
