<script setup>
import IconGlyph from './IconGlyph.vue'
</script>

<template>
  <section id="qui-sommes-nous" class="section">
    <div class="container about">
      <div class="about__text">
        <p class="section__kicker">Qui sommes-nous</p>
        <h2 class="section__title">Une guilde ouverte à toutes les tables</h2>
        <!-- Paragraphes centrés en regard des trois vignettes ; le titre, lui,
             reste en haut pour rester la cible des liens du menu. -->
        <div class="about__bodies">
          <p class="about__body">
            La Guilde des Songes est une association dijonnaise dédiée au jeu de
            rôle. Que vous soyez débutant·e ou expérimenté·e, meneur·se de jeu ou
            joueur·se, c'est avec plaisir que nous vous accueillons autour de nos
            tables.
          </p>
          <p class="about__body">
            La Guilde s'engage également auprès du jeune public à travers l'organisation
            d'après-midis de découverte et d'initiation. Des moments de partage entre
            maîtres du jeu sont également organisés pour favoriser les échanges de
            conseils. Pour les débutant·es qui souhaitent se lancer dans la maîtrise, des
            soirées sont pensées avec des joueur·ses et MJ expérimenté·es afin de les
            encourager et les soutenir dans cette nouvelle étape.
          </p>
          <p class="about__body">
            Envie d'en savoir plus&nbsp;? Nous vous invitons à nous contacter, ou à
            nous rejoindre durant l'un de nos créneaux. Nous répondrons à vos questions
            et nous vous accompagnerons dans votre démarche d'inscription.
          </p>
        </div>

        <!-- L'entrée vers l'histoire de la Guilde, dans la foulée du texte. Elle
             mène à sa page plutôt que de se déplier ici : près de deux mille
             mots repousseraient tout le reste de l'accueil hors de vue. -->
        <RouterLink class="btn btn--primary about__lettre" :to="{ name: 'history' }">
          Une lettre des fondateurs de la Guilde
        </RouterLink>
      </div>
      <ul class="about__values">
        <li class="about__value">
          <span class="about__value-icon"><IconGlyph name="dice" /></span>
          <strong>Tous niveaux</strong>
          <span>
            Les débutant·es sont guidé·es pour découvrir le jeu de rôle, et les plus
            expérimenté·es s'y retrouvent.
          </span>
        </li>
        <li class="about__value">
          <span class="about__value-icon"><IconGlyph name="handshake" /></span>
          <strong>Ambiance conviviale</strong>
          <span>On joue pour rêver ensemble, jamais pour se prendre au sérieux.</span>
        </li>
        <li class="about__value">
          <span class="about__value-icon"><IconGlyph name="book" /></span>
          <strong>Univers variés</strong>
          <span>
            Des classiques du médiéval fantastique à la science-fiction, de l'horreur
            au comique, jusqu'aux jeux de rôle maison.
          </span>
        </li>
      </ul>

    </div>
  </section>
</template>

<style scoped>
/* L'entrée vers l'histoire suit le dernier paragraphe, sans s'en éloigner. */
.about__lettre {
  align-self: start;
  margin-top: 1.5rem;
}

.about {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 3rem;
}

/* La colonne de texte occupe la hauteur des vignettes : titre en haut,
   paragraphes centrés en regard des trois cartes. */
.about__text {
  display: flex;
  flex-direction: column;
}

/* Centrage borné : les paragraphes descendent en regard des vignettes, mais
   d'au plus ~24px — au-delà, l'espace libre part sous le texte plutôt que de
   creuser un trou entre le titre et le premier paragraphe. */
.about__bodies {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.about__bodies::before {
  content: '';
  flex: 1;
  max-height: 1.3rem;
}

.about__bodies::after {
  content: '';
  flex: 1;
}

/* Texte au fil : justifié pour occuper toute la largeur de sa colonne */
.about__body {
  color: var(--text-muted);
  margin-bottom: 1rem;
  text-align: justify;
}

/* Vignettes compactes : leur colonne reste proche de la hauteur du texte, pour
   que le centrage des paragraphes ne creuse pas de vide sous le titre. */
.about__values {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.8rem;
}

.about__value {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 0.25rem;
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.about__value:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.about__value-icon {
  color: var(--accent);
  font-size: 1.25rem;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: var(--shadow-in-sm);
  margin-bottom: 0.2rem;
}

.about__value strong {
  font-size: 1.12rem;
}

.about__value span:last-child {
  color: var(--text-muted);
  font-size: var(--card-text-size);
  line-height: 1.4;
}

@media (max-width: 820px) {
  .about {
    grid-template-columns: minmax(0, 1fr);
  }

  /* En colonne unique, l'entrée vers l'histoire se centre : calée à gauche,
     elle pendait au bord d'un bloc dont tout le reste — les vignettes, leurs
     pastilles, leurs légendes — est centré. */
  .about__lettre {
    align-self: center;
  }
}
</style>
