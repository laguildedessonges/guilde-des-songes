<script setup>
// Fenêtre de détails, au premier plan. Sa taille ne dépend pas du contenu :
// une description courte ou longue occupe le même cadre, et c'est l'intérieur
// qui défile — avec le même curseur rouge que le reste du site.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { deverrouillerLaPage, verrouillerLaPage } from '../verrou-defilement.js'

const props = defineProps({
  // Une ou plusieurs lignes d'agenda (un même jour peut en porter plusieurs).
  events: { type: Array, default: () => [] },
  titre: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const panneau = ref(null)

function surEchap(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', surEchap)
  verrouillerLaPage()
  panneau.value?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', surEchap)
  deverrouillerLaPage()
})

// Changer de jour sans fermer : on revient en haut de la fenêtre.
watch(
  () => props.events,
  () => {
    const corps = panneau.value?.querySelector('.dialog__corps')
    if (corps) corps.scrollTop = 0
  },
)
</script>

<template>
  <div class="dialog" @click.self="emit('close')">
    <div
      ref="panneau"
      class="dialog__panneau"
      role="dialog"
      aria-modal="true"
      :aria-label="titre"
      tabindex="-1"
    >
      <header class="dialog__entete">
        <p class="dialog__titre">{{ titre }}</p>
        <button class="dialog__fermer" aria-label="Fermer" @click="emit('close')">×</button>
      </header>

      <div class="dialog__corps">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Le fond de page est simplement flouté : on garde le décor du site. */
.dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Cadre de taille fixe : identique quelle que soit la longueur du texte. */
.dialog__panneau {
  width: min(38.75rem, 100%);
  height: min(70vh, 38.75rem);
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  background: var(--bg-panel);
  box-shadow: var(--shadow-out-lg);
  outline: none;
}

.dialog__entete {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem 0.9rem 1.5rem;
}

.dialog__titre {
  color: var(--text-muted);
  font-weight: 600;
  text-transform: capitalize;
}

.dialog__fermer {
  width: 2.375rem;
  height: 2.375rem;
  flex: none;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--bg);
  color: var(--accent);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: var(--shadow-out-sm);
  transition: box-shadow 0.25s ease;
}

.dialog__fermer:hover {
  box-shadow: var(--shadow-out-sm), var(--glow);
}

.dialog__fermer:active {
  box-shadow: var(--shadow-in-sm);
}

/* Seul l'intérieur défile ; le curseur rouge du site s'y applique déjà via les
   règles globales ::-webkit-scrollbar. */
.dialog__corps {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
  display: grid;
  gap: 1rem;
  /* Le contenu occupe toute la hauteur du cadre, pas seulement le haut. */
  align-content: stretch;
}

@media (max-width: 620px) {
  .dialog {
    padding: 1rem;
  }

  .dialog__panneau {
    height: min(80vh, 38.75rem);
  }

  .dialog__entete {
    padding: 1rem 1rem 0.75rem 1.25rem;
  }

  .dialog__corps {
    padding: 0 1.25rem 1.25rem;
  }
}
</style>
