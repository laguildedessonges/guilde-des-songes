<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import ContactLink from '../components/ContactLink.vue'
import PageHeading from '../components/PageHeading.vue'
import { partners } from '../data/partners.js'
import { typo } from '../typographie.js'

// `perk` accepte un avantage ou plusieurs : le pied de vignette aligne autant
// de pastilles qu'il en reçoit, plutôt qu'une seule trop longue à lire.
function avantages(partner) {
  if (!partner.perk) return []
  return Array.isArray(partner.perk) ? partner.perk : [partner.perk]
}
</script>

<template>
  <section class="section">
    <div class="container">
      <PageHeading
        kicker="Nos partenaires"
        title="Celles et ceux qui nous accompagnent"
        lead="Pour que la Guilde puisse fonctionner, des espaces en tout genre nous accueillent. Des boutiques, des bars et des festivals font vivre le jeu avec nous autour de Dijon."
      />

      <div class="partners">
        <component
          :is="partner.href ? 'a' : 'article'"
          v-for="partner in partners"
          :key="partner.name"
          class="partner"
          :href="partner.href"
          :target="partner.href ? '_blank' : undefined"
          :rel="partner.href ? 'noopener' : undefined"
        >
          <header class="partner__head">
            <span class="partner__icon"><IconGlyph :name="partner.icon" /></span>
            <h2 class="partner__name">{{ typo(partner.name) }}</h2>
            <p v-if="partner.address" class="partner__address">{{ typo(partner.address) }}</p>
          </header>

          <div class="partner__body">
            <p class="partner__text">{{ typo(partner.text) }}</p>
          </div>

          <!-- Zone basse toujours présente : les descriptions restent alignées
               d'une vignette à l'autre, avec ou sans avantage adhérent. -->
          <div class="partner__foot">
            <span
              v-for="avantage in avantages(partner)"
              :key="avantage"
              class="partner__perk"
            >
              {{ typo(avantage) }}
            </span>
          </div>
        </component>
      </div>

      <p class="partners__note">
        Vous tenez un lieu, une boutique ou un festival et souhaitez collaborer avec la
        Guilde&nbsp;? Écrivez-nous à
        <ContactLink subject="Partenariat avec la Guilde des Songes" />.
      </p>
    </div>
  </section>
</template>

<style scoped>
.partners {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16.25rem, 100%), 1fr));
  gap: 1.5rem;
}

/* Deux par ligne : sur trois colonnes, le dernier partenaire restait souvent
   seul sur sa ligne, et des vignettes plus étroites deviennent bien plus hautes
   (247 px de large pour 403 px de haut, mesuré). Deux colonnes donnent des
   vignettes larges et basses (518 px de large), quel que soit leur nombre. */
@media (min-width: 900px) {
  .partners {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Vignettes larges : on resserre le vertical, l'air est déjà dans la largeur. */
  .partners .partner {
    padding: 1.2rem 1.6rem;
  }

  .partners .partner__icon {
    width: 3.25rem;
    height: 3.25rem;
    margin-bottom: 0.7rem;
  }

  .partners .partner__foot {
    min-height: 2.375rem;
    margin-top: 0.5rem;
  }
}

/* Entête (icône, nom, adresse) calé en haut, description centrée dans l'espace
   restant : les cartes gardent la même hauteur et se lisent en ligne. */
.partner {
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.4rem 1.25rem;
  text-align: center;
  text-decoration: none;
  color: var(--text);
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.partner:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.partner__icon {
  color: var(--accent);
  font-size: 1.7rem;
  width: 3.75rem;
  height: 3.75rem;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: var(--shadow-in-sm);
  margin: 0 auto 1rem;
}

.partner__name {
  font-size: 1.3rem;
  margin-bottom: 0.3rem;
}

/* L'adresse ne se coupe pas au milieu : elle passe à la ligne d'un bloc. */
.partner__address {
  color: var(--accent);
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.7rem;
  text-wrap: balance;
}

.partner__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0;
}

/* `pre-line` : les `\n` de la description passent à la ligne, le reste du
   texte continue de se replier normalement selon la largeur. */
.partner__text {
  color: var(--text-muted);
  font-size: var(--card-text-size);
  line-height: 1.4;
  white-space: pre-line;
}

/* Hauteur réservée dans chaque vignette, badge ou non : les descriptions
   restent alignées d'une carte à l'autre. */
.partner__foot {
  flex: none;
  min-height: 2.625rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin-top: 0.75rem;
}

/* Avantage adhérent : pastille compacte en creux */
.partner__perk {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  box-shadow: var(--shadow-in-sm);
  color: var(--accent);
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
}

.partners__note {
  margin-top: 2.5rem;
  color: var(--text-muted);
  text-align: justify;
}
</style>
