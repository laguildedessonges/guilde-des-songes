<script setup>
import IconGlyph from './IconGlyph.vue'
</script>

<template>
  <section id="infos-pratiques" class="section">
    <div class="container">
      <p class="section__kicker">Infos pratiques</p>
      <h2 class="section__title">Où et quand jouer&nbsp;?</h2>
      <div class="practical">
        <article class="practical__card">
          <span class="practical__icon"><IconGlyph name="clock" /></span>
          <h3 class="practical__title">Nos créneaux</h3>
          <ul class="practical__list">
            <li><strong>Vendredi</strong> — en soirée</li>
            <li><strong>Samedi</strong> — après-midi et soirée</li>
          </ul>
          <p class="practical__hint">
            Le programme des tables est annoncé sur le Discord de l'asso.
          </p>
        </article>
        <article class="practical__card">
          <span class="practical__icon"><IconGlyph name="house" /></span>
          <h3 class="practical__title">Annexe Maison Phare</h3>
          <p class="practical__address">
            1 allée du Roussillon<br />
            21000 Dijon
          </p>
          <p class="practical__hint">
            Notre lieu principal. La plupart des séances et des événements s'y déroulent.
          </p>
        </article>
        <article class="practical__card">
          <span class="practical__icon"><IconGlyph name="pin" /></span>
          <h3 class="practical__title">Espace Baudelaire</h3>
          <p class="practical__address">
            27 avenue Charles Baudelaire<br />
            21000 Dijon
          </p>
          <p class="practical__hint">
            Salles disponibles chaque semaine.<br />
            Accueille les OS mensuelles.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.practical {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16.25rem, 100%), 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.practical__card {
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.4rem 1.25rem;
  text-align: center;
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.practical__card:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.practical__icon {
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

.practical__title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.practical__list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.practical__address {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.practical__hint {
  color: var(--text-muted);
  font-size: var(--card-text-size);
  line-height: 1.4;
}
</style>
