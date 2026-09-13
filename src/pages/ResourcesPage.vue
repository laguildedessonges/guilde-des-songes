<script setup>
import IconGlyph from '../components/IconGlyph.vue'
import ContactLink from '../components/ContactLink.vue'
import PageHeading from '../components/PageHeading.vue'
import { ressources } from '../data/ressources.js'
import { typo } from '../typographie.js'
</script>

<template>
  <section class="section">
    <div class="container">
      <PageHeading
        kicker="Ressources"
        title="Les documents de la Guilde"
        lead="Les documents qui font la vie de l'association : ce qu'on attend autour de la table, et de quoi parler de la Guilde autour de vous."
      />

      <ul class="resources">
        <li v-for="ressource in ressources" :key="ressource.name" class="resource">
          <p class="resource__state">
            <span class="resource__icon"><IconGlyph :name="ressource.icon" /></span>
            {{ typo(ressource.etat || (ressource.fichier ? 'Document' : 'À paraître')) }}
          </p>
          <h2 class="resource__title">{{ typo(ressource.name) }}</h2>
          <p class="resource__text">{{ typo(ressource.text) }}</p>

          <div class="resource__actions">
            <a
              v-if="ressource.url"
              class="btn btn--primary resource__action"
              :href="ressource.url"
              :download="ressource.nomFichier"
            >
              <IconGlyph name="download" />
              Télécharger
            </a>
            <!-- Fichier pas encore déposé dans `src/documents/` : on le dit,
                 plutôt que de proposer un bouton qui ne mènerait nulle part. -->
            <span v-else class="resource__soon">Bientôt disponible</span>
          </div>
        </li>
      </ul>

      <p class="resources__note">
        Une question sur l'un de ces documents, ou une ressource à proposer&nbsp;?
        Écrivez-nous à <ContactLink subject="Ressources de la Guilde des Songes" />.
      </p>
    </div>
  </section>
</template>

<style scoped>
/* Deux documents seulement : côte à côte plutôt qu'en bandes pleine largeur,
   où quatre lignes de texte se perdaient sur 1060 px. */
.resources {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(18.75rem, 100%), 1fr));
  gap: 1.5rem;
}

/* Contenu centré, hauteur libre : le même gabarit bas et large que les
   vignettes des partenaires. Un carré laissait 200 px de vide sous le texte. */
.resource {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.5rem 1.75rem;
  color: var(--text);
  box-shadow: var(--shadow-out);
  transition: box-shadow 0.3s ease;
}

.resource:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

/* Même grammaire que le kicker des sections, sous la pastille en creux. */
.resource__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}

.resource__icon {
  flex: none;
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: var(--shadow-in-sm);
  font-size: 1.4rem;
  letter-spacing: normal;
}

.resource__title {
  font-size: 1.3rem;
  margin-bottom: 0.6rem;
}

.resource__text {
  color: var(--text-muted);
  font-size: var(--card-text-size);
  line-height: 1.4;
}

.resource__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.resource__action {
  font-size: 0.95rem;
  padding: 0.65rem 1.3rem;
}

/* Mention en creux plutôt qu'un bouton : rien à cliquer tant que le document
   n'est pas déposé. */
.resource__soon {
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  box-shadow: var(--shadow-in-sm);
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.resources__note {
  color: var(--text-muted);
  margin-top: 2rem;
  text-align: center;
}
</style>
