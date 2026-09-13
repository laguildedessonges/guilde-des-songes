<script setup>
import IconGlyph from './IconGlyph.vue'
import { typo } from '../typographie.js'

// Dans `text`, un `\n` part à la ligne : les vignettes se lisent en deux blocs
// plutôt qu'en un pavé (`white-space: pre-line` sur .activity__text).
const activities = [
  {
    icon: 'map',
    title: 'Campagnes',
    text: 'Des histoires au long cours, séance après séance, où vos personnages évoluent et tracent leurs destins.\nCoopération et entraide sont de mise !',
  },
  {
    icon: 'swords',
    title: 'Soirées one-shot',
    text: 'Une histoire complète en une soirée.\nParfait pour essayer un nouveau jeu ou une nouvelle table.\nÉmotions garanties !',
  },
  {
    icon: 'pawn',
    title: 'Jeux de plateau',
    text: 'Les boîtes sont nombreuses dans les placards de la Guilde. Profitez-en !\nDes tables sont aussi proposées pendant les permanences, les samedis après-midi.',
  },
]
</script>

<template>
  <section id="activites" class="section section--alt">
    <div class="container">
      <p class="section__kicker">Nos parties</p>
      <h2 class="section__title">Trois façons de rêver</h2>
      <div class="activities">
        <article v-for="activity in activities" :key="activity.title" class="activity">
          <span class="activity__icon"><IconGlyph :name="activity.icon" /></span>
          <h3 class="activity__title">{{ activity.title }}</h3>
          <p class="activity__text">{{ typo(activity.text) }}</p>
        </article>
      </div>
      <p class="activities__note">
        Les prochaines parties sont dans notre
        <RouterLink :to="{ name: 'agenda' }">agenda</RouterLink>, annoncées aussi sur le
        <a href="https://discord.gg/F8aghJ2Mpv" target="_blank" rel="noopener">Discord</a>.
        Nos meneur·ses racontent leurs campagnes dans la
        <RouterLink :to="{ name: 'gazette' }">gazette</RouterLink>.
      </p>
    </div>
  </section>
</template>

<style scoped>
/* Séparation douce entre sections : un voile aux couleurs du fond atténue la
   brume sur cette bande — elle y paraît plus claire, plus dissipée — avec des
   bords en dégradé pour qu'aucune ligne ne se voie. */
.section--alt {
  background: linear-gradient(
    180deg,
    transparent,
    color-mix(in srgb, var(--bg) 78%, transparent) 18%,
    color-mix(in srgb, var(--bg) 78%, transparent) 82%,
    transparent
  );
}

.activities {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16.25rem, 100%), 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.activity {
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.4rem 1.25rem;
  text-align: center;
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.activity:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.activity__icon {
  color: var(--accent);
  font-size: 1.7rem;
  width: 3.75rem;
  height: 3.75rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: var(--shadow-in-sm);
  margin: 0 auto 1rem;
}

.activity__title {
  font-size: 1.28rem;
  margin-bottom: 0.6rem;
}

/* `pre-line` : les `\n` de la description passent à la ligne, le reste du
   texte continue de se replier selon la largeur de la vignette. */
.activity__text {
  color: var(--text-muted);
  font-size: var(--card-text-size);
  line-height: 1.4;
  white-space: pre-line;
}

.activities__note {
  margin-top: 2rem;
  color: var(--text-muted);
  text-align: justify;
}
</style>
