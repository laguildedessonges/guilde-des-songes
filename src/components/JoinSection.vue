<script setup>
import IconGlyph from './IconGlyph.vue'
import { typo } from '../typographie.js'

// Tarifs d'adhésion annuelle de l'association.
const memberships = [
  {
    icon: 'user',
    name: 'Mineur·es',
    price: 'Gratuit',
    detail:
      "L'adhésion est offerte aux moins de 18 ans. Autorisation parentale requise. " +
      'Les parents peuvent être accompagnateurs.',
  },
  {
    icon: 'coin',
    name: 'Adultes',
    price: '10 € par an',
    detail: 'Accès à tous les événements et aux locaux de la Guilde.',
  },
]
</script>

<template>
  <section id="rejoindre" class="section join">
    <div class="container">
      <p class="section__kicker">Nous rejoindre</p>
      <h2 class="section__title">Prêt·e à lancer les dés&nbsp;?</h2>
      <p class="join__lead">
        Vous pouvez participer gratuitement aux soirées one-shot mensuelles de la Guilde.
        Pour une meilleure immersion rôlistique, la Guilde vous propose une adhésion
        annuelle afin de profiter de tous les événements et de l'accès aux locaux. Il est
        possible de venir découvrir la Guilde et ses membres avant de vous engager,
        trois séances de découverte sont proposées gratuitement&nbsp;! Les
        inscriptions et adhésions se font dans
        <RouterLink :to="{ name: 'agenda' }">l'agenda</RouterLink> ou sur notre
        <a href="https://discord.gg/F8aghJ2Mpv" target="_blank" rel="noopener">Discord</a>.
      </p>
      <div class="join__channels">
        <article v-for="membership in memberships" :key="membership.name" class="join__channel">
          <span class="join__icon"><IconGlyph :name="membership.icon" /></span>
          <h3 class="join__name">{{ membership.name }}</h3>
          <p class="join__price">{{ membership.price }}</p>
          <p class="join__detail">{{ typo(membership.detail) }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Dernière section : aération supplémentaire avant le pied de page,
   équivalente à l'espace entre deux sections (2 × 3rem). */
.section.join {
  padding-bottom: 6rem;
  /* Même voile de séparation que « Nos parties » : la brume s'y dissipe. */
  background: linear-gradient(
    180deg,
    transparent,
    color-mix(in srgb, var(--bg) 78%, transparent) 18%,
    color-mix(in srgb, var(--bg) 78%, transparent) 88%,
    transparent
  );
}

/* Pleine largeur, justifié : pas de coupure précoce des phrases */
.join__lead {
  color: var(--text-muted);
  font-size: var(--lead-size);
  margin-bottom: 2rem;
  text-align: justify;
}

/* Deux formules d'adhésion, côte à côte. `grid-auto-rows: 1fr` égalise aussi
   leur hauteur quand elles s'empilent en mobile. */
.join__channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(17.5rem, 100%), 1fr));
  grid-auto-rows: 1fr;
  gap: 1.5rem;
}

.join__channel {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  justify-items: center;
  text-align: center;
  gap: 0.25rem;
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.4rem 1.25rem;
  color: var(--text);
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.join__channel:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.join__icon {
  color: var(--accent);
  font-size: 1.6rem;
  width: 3.5rem;
  height: 3.5rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: var(--shadow-in-sm);
  margin-bottom: 0.6rem;
}

.join__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
}

/* Tarif mis en avant dans un creux : c'est l'information clé de la vignette. */
.join__price {
  margin: 0.35rem 0 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  box-shadow: var(--shadow-in-sm);
  color: var(--accent);
  font-weight: 700;
  font-size: 1.05rem;
  white-space: nowrap;
}

.join__detail {
  color: var(--text-muted);
  font-size: var(--card-text-size);
  line-height: 1.4;
}
</style>
