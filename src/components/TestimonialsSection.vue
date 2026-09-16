<script setup>
import IconGlyph from './IconGlyph.vue'
import { typo } from '../typographie.js'

// Témoignages d'adhérent·es, recueillis auprès des membres de la Guilde.
const testimonials = [
  {
    name: 'Flex',
    role: 'MJ et joueur',
    quote:
      "J'ai été très présent il y a quelques années au sein de la Guilde comme MJ et PJ et on s'amusait déjà bien ! Même aujourd'hui où j'ai hélas moins de disponibilité, je retrouve de la camaraderie (surtout aux soirées mensuelles one shot) et une diversité sur les maîtrises. Le CA est investi pour ses membres, c'est devenu agréable de faire du jdr à la Guilde.",
  },
  {
    name: 'Jonathan',
    role: 'Joueur',
    quote:
      "Je me suis inscrit à la Guilde des Songes pour me permettre de rencontrer du monde et surmonter mon angoisse de la sociabilisation. Depuis 4 ans, j'ai rencontré de nombreuses personnes, ce qui m'a permis de reprendre confiance en moi, en m'éclatant autour d'une table de jeu dans une super ambiance.",
  },
  {
    name: 'Elisa',
    role: 'Conseil d’administration',
    quote:
      "J'ai connu la Guilde lorsque j'étais encore mineure. Je souhaitais découvrir le jeu de rôle et j'ai été accueillie à bras ouverts ! Une autorisation parentale est nécessaire et les membres de la Guilde instaurent un climat de confiance, à la fois pour le jeune et les parents. Aujourd'hui, majeure et vaccinée, je suis adhérente et membre du Conseil d'administration. Je m'occupe du pôle communication : réseaux sociaux, site internet, partenaires. L'ambiance autour des tables est chaleureuse, et tout est pensé pour que chaque moment soit agréable à toutes et tous.",
  },
]
</script>

<template>
  <section id="temoignages" class="section">
    <div class="container">
      <p class="section__kicker">Témoignages d'adhérents</p>
      <h2 class="section__title">Ce qu'on en dit autour de la table</h2>
      <!-- Une colonne : les témoignages sont de longueurs très inégales,
           côte à côte ils laisseraient de grands vides sous les plus courts. -->
      <div class="testimonials">
        <figure v-for="person in testimonials" :key="person.name" class="testimonial">
          <div class="testimonial__who">
            <span class="testimonial__icon"><IconGlyph name="bubble" /></span>
            <figcaption class="testimonial__caption">
              <strong class="testimonial__name">{{ person.name }}</strong>
              <span class="testimonial__role">{{ typo(person.role) }}</span>
            </figcaption>
          </div>
          <blockquote class="testimonial__quote">{{ typo(person.quote) }}</blockquote>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials {
  display: grid;
  gap: 1.5rem;
}

/* Identité à gauche, citation à droite : la colonne de gauche reste étroite
   et de largeur fixe pour que les citations s'alignent d'une carte à l'autre. */
.testimonial {
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr);
  align-items: center;
  gap: 1.5rem;
  margin: 0;
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.4rem 1.6rem;
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.testimonial:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.testimonial__who {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 0.55rem;
}

.testimonial__icon {
  color: var(--accent);
  font-size: 1.5rem;
  width: 3.25rem;
  height: 3.25rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: var(--shadow-in-sm);
}

.testimonial__caption {
  display: grid;
  gap: 0.15rem;
}

.testimonial__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.2rem;
}

.testimonial__role {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.3;
}

.testimonial__quote {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--card-text-size);
  font-style: italic;
  line-height: 1.5;
  text-align: justify;
}

/* Sous ~700px, la colonne d'identité passe au-dessus de la citation, en ligne :
   à deux colonnes, la citation n'aurait plus qu'une poignée de mots par ligne. */
@media (max-width: 700px) {
  .testimonial {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.9rem;
    padding: 1.2rem 1.25rem;
  }

  .testimonial__who {
    grid-template-columns: auto minmax(0, 1fr);
    justify-items: start;
    text-align: left;
    align-items: center;
    gap: 0.9rem;
  }

  .testimonial__icon {
    width: 2.875rem;
    height: 2.875rem;
    font-size: 1.35rem;
  }
}
</style>
