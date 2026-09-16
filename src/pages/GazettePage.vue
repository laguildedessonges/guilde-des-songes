<script setup>
import PageHeading from '../components/PageHeading.vue'
import { issues } from '../data/gazette.js'
import { typo } from '../typographie.js'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

function formatMonth(iso) {
  if (!iso) return ''
  const [y, m] = iso.split('-').map(Number)
  return dateFormat.format(new Date(y, (m || 1) - 1, 1))
}
</script>

<template>
  <section class="section">
    <div class="container">
      <PageHeading
        kicker="La gazette"
        title="Bienvenue sur La Gazette rôlistique !"
        lead="C'est ici que la Guilde raconte ses parties, expose la vie associative et annonce les futurs événements. Bonne lecture !"
      />

      <ul v-if="issues.length" class="issues">
        <li v-for="issue in issues" :key="issue.slug" class="issue">
          <p class="issue__date">{{ formatMonth(issue.date) }}</p>
          <h2 class="issue__title">
            {{ typo(issue.title)
            }}<template v-if="issue.numero"
              ><span class="issue__sep"> · </span
              ><span class="issue__numero">Numéro {{ issue.numero }}</span></template
            >
          </h2>
          <p v-if="issue.excerpt" class="issue__excerpt">{{ typo(issue.excerpt) }}</p>

          <!-- Les numéros se consultent en ligne : rien à télécharger, et c'est
               depuis le numéro lui-même qu'on en partage le lien. -->
          <div class="issue__actions">
            <RouterLink
              class="btn btn--primary issue__action"
              :to="{ name: 'gazette-issue', params: { slug: issue.slug } }"
            >
              Lire le numéro
            </RouterLink>
          </div>
        </li>
      </ul>

      <!-- Aucun numéro déposé dans `src/gazette/` : on annonce celui qui vient. -->
      <div v-else class="issue issue--soon">
        <p class="issue__date">Été 2026</p>
        <h2 class="issue__title">À paraître</h2>
        <p class="issue__excerpt">
          Le premier numéro de la gazette est en préparation. Il sera publié ici, et
          annoncé sur le Discord de la Guilde.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.issues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1.5rem;
}

.issue {
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.75rem;
  color: var(--text);
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.issue:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.issue__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.issue__action {
  font-size: 0.95rem;
  padding: 0.65rem 1.3rem;
}

.issue__date {
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.issue__title {
  font-size: 1.3rem;
  margin-bottom: 0.6rem;
}

/* Même grammaire que sur la page du numéro : à la taille du titre, seule la
   graisse le distingue. */
.issue__numero {
  font-weight: 400;
  white-space: nowrap;
}

/* Point médian séparateur, à la taille et à l'encre du titre (voir la page du
   numéro pour le détail). */
.issue__sep {
  color: var(--text);
}

.issue__excerpt {
  color: var(--text-muted);
  text-align: justify;
}

/* Le numéro annoncé n'est pas cliquable : pas de halo au survol. */
.issue--soon:hover {
  box-shadow: var(--shadow-out);
}

.issue--soon .issue__excerpt {
  margin: 0;
}
</style>
