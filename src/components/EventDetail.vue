<script setup>
// Détail d'une partie : l'en-tête, les champs renseignés, puis la zone d'action
// (compteur, personnes annoncées, inscription). Extrait de la page Agenda, qui
// le répétait deux fois — une fois dans le panneau du jour, une fois dans la
// fenêtre — et que la gazette ouvre désormais aussi, sans quitter le numéro.
//
// Le composant rend le contenu seul, sans cadre : c'est l'appelant qui pose
// l'élément `.detail` autour, `<button>` là où le panneau s'ouvre en fenêtre,
// `<article>` ailleurs. Ses styles ne sont donc pas « scoped » — ils habillent
// aussi ce cadre, où qu'il soit écrit.
import SignupForm from './SignupForm.vue'
import { typo } from '../typographie.js'
import {
  estComplet,
  interetLabel,
  joindre,
  kindLabel,
  libelleJeu,
  placesLabel,
  sansPrefixeMJ,
} from '../data/evenement-affichage.js'

defineProps({
  event: { type: Object, required: true },
  // Date du jour en ISO : au-delà, la partie est passée et n'accueille plus.
  today: { type: String, required: true },
  // Panneau resserré (plusieurs parties le même jour) : la description est
  // bornée, le reste du texte se lit dans la fenêtre.
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <p class="detail__kind">{{ kindLabel(event) }}</p>
  <h2 class="detail__title">{{ typo(event.title) }}</h2>
  <p class="detail__when">
    {{ joindre(event.time, event.place) }}
  </p>
  <p v-if="event.game" class="detail__champ">
    <span class="detail__etiquette">{{ libelleJeu(event) }}</span>{{ typo(event.game) }}
  </p>
  <p v-if="event.gm" class="detail__champ">
    <span class="detail__etiquette">MJ</span>{{ typo(sansPrefixeMJ(event.gm)) }}
  </p>

  <p
    v-if="event.text"
    class="detail__text"
    :class="{ 'detail__text--court': compact }"
  >
    {{ typo(event.text) }}
  </p>

  <!-- Zone d'action : dans la fenêtre, elle se centre dans l'espace resté
       libre sous la description. -->
  <div class="detail__actions">
    <p v-if="event.date < today" class="detail__past">Cet événement a déjà eu lieu.</p>

    <template v-else>
      <div v-if="placesLabel(event) || interetLabel(event)" class="detail__etat">
        <p
          v-if="placesLabel(event)"
          class="detail__seats"
          :class="{ 'detail__seats--complet': estComplet(event) }"
        >
          {{ placesLabel(event) }}
        </p>

        <p v-if="interetLabel(event)" class="detail__interest">
          {{ interetLabel(event) }}
        </p>
      </div>

      <p v-if="estComplet(event)" class="detail__closed">
        C'est complet. Écrivez-nous sur le Discord pour la liste d'attente.
      </p>

      <!-- Une soirée mensuelle accueille par les deux guichets : le salon
           Discord pour qui y est déjà, le formulaire pour qui n'y est pas
           encore. Les autres tables n'en ouvrent qu'un. -->
      <template v-else>
        <a
          v-if="event.signup"
          class="btn btn--primary detail__btn"
          :href="event.signup"
          target="_blank"
          rel="noopener"
        >
          S'inscrire sur le Discord
        </a>

        <template v-if="event.form">
          <p v-if="event.signup" class="detail__ou">
            Pas de Discord, ou pas encore sur celui de la Guilde&nbsp;?
            Écrivez-nous ici.
          </p>
          <SignupForm :title="event.title" :date="event.date" :time="event.time" />
        </template>

        <p
          v-else-if="!event.signup && event.kind === 'campagne'"
          class="detail__closed"
        >
          Table fermée&nbsp;: la campagne suit son cours.
        </p>
      </template>
    </template>
  </div>
</template>

<!-- Styles volontairement non « scoped » : ils habillent aussi le cadre
     `.detail` que l'appelant pose autour du contenu. -->
<style>
.details {
  display: grid;
  gap: 1rem;
}

.details--compacts {
  grid-template-columns: repeat(auto-fit, minmax(min(18.75rem, 100%), 1fr));
  align-items: stretch;
}

.details__intro {
  margin-bottom: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: capitalize;
}

/* Panneau de détails : liseré à la couleur du type */
.detail {
  padding: 1.5rem 1.75rem;
  border: none;
  border-left: 5px solid var(--kind-color);
  border-radius: var(--radius);
  background: var(--bg-panel);
  color: var(--text);
  font-family: var(--font-body);
  text-align: left;
  box-shadow: var(--shadow-out);
}

/* Resserré : le texte est borné, et la vignette s'ouvre en fenêtre au clic. */
.details--compacts .detail {
  padding: 1.1rem 1.25rem;
}

.details--compacts .detail__title {
  font-size: 1.2rem;
}

.detail--cliquable {
  width: 100%;
  cursor: pointer;
  transition: box-shadow 0.25s ease;
}

.detail--cliquable:hover {
  box-shadow: var(--shadow-out), var(--glow);
}

.detail__text--court {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Dans la fenêtre, la vignette occupe tout le cadre, en hauteur comme en
   largeur : ni relief ni fond propres, et l'action reste en bas. */
.detail--fenetre {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 0 1.25rem;
  background: none;
  box-shadow: none;
}

/* La marge basse du texte fausserait le centrage : l'écart est porté par la
   zone d'action elle-même. */
.detail--fenetre .detail__text {
  margin-bottom: 0;
}

/* L'action occupe l'espace resté libre sous la description, et s'y centre —
   verticalement comme horizontalement. */
.detail--fenetre .detail__actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
}

.detail--fenetre .detail__seats,
.detail--fenetre .detail__closed,
.detail--fenetre .detail__past {
  text-align: center;
}

.detail__kind {
  color: var(--kind-color);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.detail__title {
  font-size: 1.5rem;
  margin-bottom: 0.4rem;
}

.detail__when {
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: 0.2rem;
}

.detail__champ {
  color: var(--text);
  font-size: 1rem;
  line-height: 1.4;
}

.detail__etiquette {
  color: var(--kind-color);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-right: 0.45rem;
}

.detail__champ + .detail__text,
.detail__when + .detail__text {
  margin-top: 0.8rem;
}

/* Corps du texte justifié, comme le reste du site. */
.detail__text {
  color: var(--text-muted);
  margin-bottom: 1rem;
  text-align: justify;
}

.detail__seats--complet {
  color: var(--text-muted);
}

.detail__actions {
  display: contents;
}

.detail--fenetre .detail__actions {
  display: flex;
}

/* Les pastilles d'état (places, personnes annoncées) forment une ligne à elles
   seules, au-dessus de l'action. Posées à même le flux, elles se retrouvaient
   collées au bouton d'inscription, sur la même ligne et mal alignées avec lui.
   Hauteur commune pour que deux pastilles côte à côte se répondent ; 2.25rem
   reste en dessous des 2.75rem des commandes, car ce sont des étiquettes et
   non des boutons — rien ne doit inviter à les toucher. */
.detail__etat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

/* Dans la fenêtre, l'action est une colonne centrée : c'est son `gap` qui
   espace, et la ligne de pastilles s'y centre comme le reste. */
.detail--fenetre .detail__etat {
  justify-content: center;
  margin-bottom: 0;
}

.detail__seats,
.detail__interest {
  display: inline-flex;
  align-items: center;
  min-height: 2.25rem;
  margin: 0;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  box-shadow: var(--shadow-in-sm);
  font-size: 0.95rem;
  line-height: 1.25;
}

.detail__seats {
  color: var(--accent);
  font-weight: 700;
}

/* Le relevé est une information, pas un quota : même pastille que le compteur
   de places, mais en retrait, pour qu'il ne se lise pas comme une jauge. */
.detail__interest {
  color: var(--text-muted);
}

/* Le second guichet d'une soirée mensuelle : la ligne qui l'annonce reste en
   retrait, le bouton Discord garde la vedette. */
.detail__ou {
  margin: 0.25rem 0 0.9rem;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.detail__past,
.detail__closed {
  color: var(--text-muted);
  font-style: italic;
}

.detail__btn {
  font-size: 1rem;
}

@media (max-width: 620px) {
.detail {
    padding: 1.25rem;
  }
}
</style>
