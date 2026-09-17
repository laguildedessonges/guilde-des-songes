<script setup>
// L'histoire de la Guilde, racontée par ses fondateur·ices, et les affiches de
// ses conventions. Une page à part, sur le modèle d'un numéro de la gazette :
// la lettre fait près de deux mille mots, dépliée sur l'accueil elle
// repousserait tout le reste hors de vue.
import lettre from '../data/lettre-fondateurs.md?raw'
import { enProse } from '../data/prose.js'
import { conventions } from '../data/conventions.js'

const lettreEnHtml = enProse(lettre)
</script>

<template>
  <section class="section">
    <div class="container">
      <RouterLink class="back" :to="{ name: 'home', hash: '#qui-sommes-nous' }">
        ← Retour à l'accueil
      </RouterLink>

      <header class="lettre-tete">
        <p class="section__kicker">Notre histoire</p>
        <h1 class="lettre-tete__titre">Une lettre des fondateurs de la Guilde</h1>
      </header>

      <article class="prose" v-html="lettreEnHtml" />

      <!-- Les affiches des conventions, repliées : la liste est courte, elle
           s'ouvre sur place sans changer de page. -->
      <details v-if="conventions.length" class="affiches">
        <summary class="btn btn--primary affiches__pastille">
          Découvrez les flyers des Conv'en Songes
        </summary>

        <p class="affiches__mention">
          Les conventions de la Guilde sont suspendues depuis le confinement.
          Chaque affiche se télécharge d'un clic.
        </p>

        <ul class="affiches__liste">
          <li v-for="affiche in conventions" :key="affiche.url" class="affiche">
            <a class="affiche__lien" :href="affiche.url" :download="affiche.nomFichier">
              <img class="affiche__image" :src="affiche.url" :alt="affiche.titre" loading="lazy" />
              <span class="affiche__titre">{{ affiche.titre }}</span>
              <span class="affiche__note">{{ affiche.note }}</span>
              <span class="affiche__action">Télécharger l'affiche</span>
            </a>
          </li>
        </ul>
      </details>
    </div>
  </section>
</template>

<style scoped>
.lettre-tete {
  margin-bottom: 2rem;
}

.lettre-tete__titre {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.affiches {
  margin-top: 2.5rem;
}

/* Le même bouton que celui qui mène ici depuis l'accueil : c'est la porte de la
   page, elle se voit. Pas de chevron : le site n'emploie de flèche nulle part
   ailleurs, et l'intitulé invite déjà à l'ouvrir. */
.affiches__pastille {
  list-style: none;
}

.affiches__pastille::-webkit-details-marker {
  display: none;
}

.affiches__mention {
  margin: 1.25rem 0 1rem;
  color: var(--text-muted);
}

.affiches__liste {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  /* Rangées de hauteur égale : sans cela, la dernière rangée — souvent moins
     remplie — se dimensionnait sur sa seule carte, et les cartes n'avaient plus
     toutes la même taille d'une rangée à l'autre. */
  grid-auto-rows: 1fr;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Toutes les cartes d'une même liste ont la même taille : la vignette occupe
   la hauteur de la rangée, et l'invitation à télécharger se cale en bas quelle
   que soit la longueur de la légende. Sans cela, les affiches — qui n'ont pas
   toutes exactement le même format — décalaient chaque carte de sa voisine. */
.affiche {
  display: flex;
}

.affiche__lien {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  padding: 1rem;
  border-radius: var(--radius);
  background: var(--bg-panel);
  box-shadow: var(--shadow-out-sm);
  color: var(--text);
  text-decoration: none;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.affiche__lien:hover {
  box-shadow: var(--shadow-out-sm), var(--glow);
  transform: translateY(-2px);
}

/* Toutes les affiches sont au format A4 à quelques pixels près : les cadrer
   ainsi les aligne sans rien rogner de visible. */
.affiche__image {
  width: 100%;
  aspect-ratio: 210 / 297;
  object-fit: cover;
  border-radius: calc(var(--radius) - 0.35rem);
  box-shadow: var(--shadow-out-sm);
}

.affiche__titre {
  margin-top: 0.6rem;
  font-weight: 700;
}

.affiche__note {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.affiche__action {
  margin-top: auto;
  padding-top: 0.5rem;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
