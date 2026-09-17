<script setup>
// Recherche du site. Le site étant statique, tout se passe dans le navigateur :
// l'index est dans le bundle, et les parties de l'agenda s'y ajoutent si la
// feuille a déjà répondu.
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EventDialog from './EventDialog.vue'
import IconGlyph from './IconGlyph.vue'
import { chercher, extrait } from '../data/recherche.js'
import { agendaRecu, fetchAgenda } from '../data/sheet.js'
import { typo } from '../typographie.js'

const router = useRouter()

const ouverte = ref(false)
const requete = ref('')
const champ = ref(null)
const evenements = ref(agendaRecu() || [])

const resultats = computed(() => chercher(requete.value, evenements.value))

async function ouvrir() {
  ouverte.value = true
  await nextTick()
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

// Changer de page referme la recherche, y compris par la touche Retour.
watch(() => router.currentRoute.value.fullPath, fermer)
</script>

<template>
  <button class="social-btn" aria-label="Rechercher sur le site" title="Rechercher" @click="ouvrir">
    <IconGlyph name="search" />
  </button>

  <EventDialog v-if="ouverte" titre="Rechercher" @close="fermer">
    <div class="recherche">
      <input
        ref="champ"
        v-model="requete"
        class="recherche__champ"
        type="search"
        placeholder="Une partie, un numéro, un lieu…"
        aria-label="Votre recherche"
      />

      <p v-if="!requete.trim()" class="recherche__aide">
        Cherchez une partie de l'agenda, un numéro de la gazette, un partenaire
        ou une page du site.
      </p>

      <p v-else-if="!resultats.length" class="recherche__aide">
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
  </EventDialog>
</template>

<style scoped>
.recherche {
  display: grid;
  gap: 1rem;
}

.recherche__champ {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 999px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1.05rem;
  box-shadow: var(--shadow-in-sm);
}

.recherche__champ:focus {
  outline: none;
  box-shadow: var(--shadow-in-sm), var(--glow);
}

.recherche__aide {
  margin: 0;
  color: var(--text-muted);
}

.recherche__liste {
  display: grid;
  gap: 0.6rem;
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
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--radius);
  background: var(--bg-panel);
  box-shadow: var(--shadow-out-sm);
  color: var(--text);
  font-family: var(--font-body);
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.25s ease;
}

.resultat:hover {
  box-shadow: var(--shadow-out-sm), var(--glow);
}

.resultat__rubrique {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.resultat__titre {
  font-size: 1.05rem;
  font-weight: 700;
}

.resultat__extrait {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
