<script setup>
// Inscription aux soirées one-shot mensuelles : le site n'inscrit personne.
//
// La Guilde veut d'abord échanger avec la personne — répondre à ses questions,
// la rassurer si c'est sa première partie, la guider vers le Discord. Ce
// formulaire prépare donc un message vers la boîte de l'association ; c'est
// ensuite la Guilde qui inscrit la personne dans la feuille, à la main.
//
// Rien ne part vers la feuille Google depuis cette page : le décompte des
// places vient des inscriptions saisies par la Guilde et des « Intéressé·e »
// relevés sur l'événement Discord (voir docs/agenda-google-sheet.gs).
import { computed, ref } from 'vue'
import { contactHref } from '../socials.js'

const props = defineProps({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, default: '' },
})

const pseudo = ref('')
const envoye = ref(false)

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const readableDate = computed(() => {
  const [y, m, d] = props.date.split('-').map(Number)
  return dateFormat.format(new Date(y, m - 1, d))
})

function ecrire() {
  const nom = pseudo.value.trim()
  if (!nom) return

  const quand = `${readableDate.value}${props.time ? ` à ${props.time}` : ''}`
  const objet = `Inscription — ${props.title} (${readableDate.value})`
  const corps =
    `Bonjour,\n\nJe souhaite m'inscrire à « ${props.title} » du ${quand}.\n\n` +
    `Mon pseudo ou prénom : ${nom}\n\n` +
    `(Dites-nous si c'est votre première partie, si vous avez des questions,\n` +
    `ou tout ce qui vous semble utile — nous vous répondrons.)\n\nMerci !`

  window.location.href = `${contactHref(objet)}&body=${encodeURIComponent(corps)}`
  envoye.value = true
}
</script>

<template>
  <form v-if="!envoye" class="signup" @submit.prevent="ecrire">
    <label class="signup__label" :for="`pseudo-${date}`">
      Pseudo Discord, ou prénom
    </label>
    <div class="signup__row">
      <!-- Texte de substitution court : l'étiquette dit déjà les deux cas, et
           un texte long se fait rogner dans le champ en mobile. -->
      <input
        :id="`pseudo-${date}`"
        v-model="pseudo"
        class="signup__input"
        type="text"
        placeholder="pseudo ou prénom"
        required
      />
      <button class="btn btn--primary signup__btn" type="submit">Nous écrire</button>
    </div>

    <!-- Dire ce qui va se passer : sans cela, on croit s'être inscrit en
         envoyant le message, et l'on ne comprend pas d'attendre une réponse. -->
    <p class="signup__mention">
      Nous préférons échanger avant de vous inscrire. Votre message ouvre la
      discussion&nbsp;; nous vous répondons et nous vous inscrivons ensuite.
    </p>
  </form>

  <p v-else class="signup__done">
    <span class="signup__badge">Message prêt</span>
    Votre demande pour <strong>{{ title }}</strong> est prête&nbsp;: il ne reste qu'à
    envoyer le message qui vient de s'ouvrir. Nous vous répondrons pour finaliser
    l'inscription.
  </p>
</template>

<style scoped>
.signup {
  display: grid;
  gap: 0.5rem;
  max-width: 30rem;
  margin: 0 auto;
  padding: 1rem 1.1rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-in-sm);
  text-align: left;
}

.signup__label {
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.signup__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.signup__input {
  flex: 1 1 180px;
  min-width: 0;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 999px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  box-shadow: var(--shadow-in-sm);
}

.signup__input:focus {
  outline: none;
  box-shadow: var(--shadow-in-sm), var(--glow);
}

.signup__btn {
  flex: none;
  font-size: 0.95rem;
  padding: 0.6rem 1.3rem;
}

/* Mention discrète : elle informe sans peser sur le geste. */
.signup__mention {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.35;
}

.signup__done {
  max-width: 30rem;
  margin: 0 auto;
  padding: 1rem 1.1rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-in-sm);
  color: var(--text-muted);
  font-size: 1rem;
  text-align: left;
}

.signup__badge {
  display: inline-block;
  margin-right: 0.5rem;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  background: linear-gradient(145deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
