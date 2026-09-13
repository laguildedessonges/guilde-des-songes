<script setup>
import IconGlyph from './IconGlyph.vue'
import { socials, openContact } from '../socials.js'
import { soutiens } from '../data/soutiens.js'

// Année du copyright calculée : rien à retoucher au 1er janvier.
const annee = new Date().getFullYear()

// Vite ne réécrit que les chemins écrits en dur dans le template : un `:src`
// calculé lui échappe et resterait à la racine du domaine, alors que le site
// vit dans un sous-dossier sur GitHub Pages. On préfixe donc à la main.
function urlLogo(chemin) {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + chemin
}
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <!-- Bloc de gauche : le logo de la Guilde, puis ceux des collectivités qui
           la soutiennent. Le nom de l'association n'est pas répété ici — il est
           dans le copyright, deux lignes plus loin. -->
      <div class="footer__brand">
        <img class="footer__logo" src="/logo-guilde.png" alt="La Guilde des Songes" />

        <component
          :is="soutien.href ? 'a' : 'span'"
          v-for="soutien in soutiens"
          :key="soutien.alt"
          class="footer__soutien"
          :class="{ 'footer__soutien--inverser': soutien.inverser }"
          :href="soutien.href"
          :target="soutien.href ? '_blank' : undefined"
          :rel="soutien.href ? 'noopener' : undefined"
        >
          <img :src="urlLogo(soutien.src)" :alt="soutien.alt" />
        </component>
      </div>
      <!-- Groupe central : mention et copyright. Pas de plan du site — la
           navigation vit dans l'entête, présente sur toute la hauteur. -->
      <div class="footer__center">
        <p class="footer__meta">Association de jeu de rôle à Dijon</p>
        <p class="footer__copyright">© {{ annee }} La Guilde des Songes</p>
      </div>
      <div class="footer__socials">
        <component
          :is="social.mail ? 'button' : 'a'"
          v-for="social in socials"
          :key="social.icon"
          class="social-btn"
          :href="social.mail ? undefined : social.href"
          :aria-label="social.label"
          :title="social.label"
          :target="social.href?.startsWith('http') ? '_blank' : undefined"
          :rel="social.href?.startsWith('http') ? 'noopener' : undefined"
          @click="social.mail ? openContact() : null"
        >
          <IconGlyph :name="social.icon" />
        </component>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg);
  box-shadow: 0 -6px 18px var(--shadow-dark);
}

/* Même disposition et même hauteur que l'entête : groupes répartis sur toute la bande */
.footer__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--band-gap);
  min-height: var(--band-height);
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.footer__logo {
  height: 3.75rem;
  width: auto;
}

/* Le tracé du logo est rouge sombre : on l'éclaircit sur fond sombre. */
:root[data-theme='dark'] .footer__logo {
  filter: brightness(1.75) saturate(1.1);
}

.footer__center {
  display: grid;
  justify-items: center;
  gap: 0.3rem;
}

.footer__meta {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.98rem;
}

.footer__copyright {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.footer__socials {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* Soutiens institutionnels : posés à côté du logo de la Guilde, plus petits
   que lui et en retrait. Ils créditent, ils ne sollicitent pas le clic. */
.footer__soutien img {
  display: block;
  /* 36 px : en dessous, la ligne « LE DÉPARTEMENT » du logo Côte-d'Or n'est
     plus lisible. C'est l'opacité, pas la taille, qui les met en retrait. */
  height: 2.25rem;
  width: auto;
  opacity: 0.55;
  transition: opacity 0.25s ease;
}

.footer__soutien:hover img {
  opacity: 1;
}

/* Ces logos sont dessinés pour du papier blanc : sur fond sombre, on les
   remonte un peu. Un logo en couleurs garde ses teintes ; un logo monochrome
   noir (`inverser`) deviendrait invisible et passe donc en blanc. */
:root[data-theme='dark'] .footer__soutien img {
  opacity: 0.75;
}

:root[data-theme='dark'] .footer__soutien--inverser img {
  filter: invert(1) brightness(1.1);
}

:root[data-theme='dark'] .footer__soutien:hover img {
  opacity: 1;
}

/* En mobile, le pied se réduit à l'essentiel — logo, mention et copyright. Les
   réseaux sont déjà dans le menu de l'entête : empilés ici, ils faisaient
   manger un tiers de l'écran à la bande. */
@media (max-width: 760px) {
  .footer__inner {
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.9rem 0;
    min-height: 0;
  }

  .footer__brand {
    gap: 0.9rem;
  }

  .footer__logo {
    height: 2.625rem;
  }

  .footer__socials {
    display: none;
  }

  /* Encore plus petits en mobile : la bande doit rester basse. */
  .footer__soutien img {
    height: 1.625rem;
  }
}
</style>
