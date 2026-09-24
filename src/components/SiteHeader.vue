<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconGlyph from './IconGlyph.vue'
import ThemeToggle from './ThemeToggle.vue'
import SiteSearch from './SiteSearch.vue'
import { socials, openContact } from '../socials.js'
import { deverrouillerLaPage, verrouillerLaPage } from '../verrou-defilement.js'

// Les sections de l'accueil sont regroupées dans le déroulant « Accueil »
// pour garder une barre courte ; les autres pages restent au premier niveau.
const homeSections = [
  { label: 'Qui sommes-nous', to: { name: 'home', hash: '#qui-sommes-nous' } },
  { label: 'Nos parties', to: { name: 'home', hash: '#activites' } },
  { label: 'Infos pratiques', to: { name: 'home', hash: '#infos-pratiques' } },
  { label: 'Témoignages', to: { name: 'home', hash: '#temoignages' } },
  { label: 'Nous rejoindre', to: { name: 'home', hash: '#rejoindre' } },
]

const pages = [
  { label: 'Agenda', to: { name: 'agenda' } },
  { label: 'Gazette', to: { name: 'gazette' } },
  { label: 'Partenaires', to: { name: 'partners' } },
  { label: 'Ressources', to: { name: 'resources' } },
]

const menuOpen = ref(false)
const homeOpen = ref(false)

// Ouverte, la recherche recouvre les pastilles des réseaux : elles s'effacent
// pendant ce temps plutôt que de se deviner sous le champ.
const rechercheOuverte = ref(false)

// La barre étroite n'a pas de place où déplier un champ : en dessous de la
// largeur du menu complet, la recherche passe en tête de la colonne du menu.
// Une seule instance à la fois, montée d'un côté ou de l'autre — deux champs
// tiendraient deux recherches.
const largeurMenu = window.matchMedia('(max-width: 1040px)')
const rechercheAuMenu = ref(largeurMenu.matches)

// On écoute aussi `resize` : le seul `change` du media query ne se déclenche
// pas partout (émulation d'écran, certains zooms), et la recherche resterait
// alors dans le menu déplié en travers de la barre large.
function surLargeur() {
  if (rechercheAuMenu.value === largeurMenu.matches) return
  rechercheAuMenu.value = largeurMenu.matches
  rechercheOuverte.value = false
  // Le burger disparaît en s'élargissant : un menu resté ouvert n'aurait plus
  // de quoi se refermer, et la page derrière resterait figée.
  closeAll()
}

function closeAll() {
  menuOpen.value = false
  homeOpen.value = false
}

// Le déroulant ouvert au clic (tactile, clavier) doit se refermer sur un clic
// ailleurs et à chaque changement de page — le mouseleave ne suffit pas.
const headerEl = ref(null)

function onDocumentClick(event) {
  if (headerEl.value && !headerEl.value.contains(event.target)) closeAll()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  largeurMenu.addEventListener('change', surLargeur)
  window.addEventListener('resize', surLargeur)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  largeurMenu.removeEventListener('change', surLargeur)
  window.removeEventListener('resize', surLargeur)
})

// Déplié, le menu occupe l'écran : la page derrière ne doit pas répondre au
// défilement, sinon elle glisse sous le panneau au premier réflexe du pouce.
// Elle se remet à défiler quand on quitte le menu.
watch(menuOpen, (ouvert) => (ouvert ? verrouillerLaPage() : deverrouillerLaPage()))
onBeforeUnmount(() => {
  if (menuOpen.value) deverrouillerLaPage()
})

const route = useRoute()
watch(() => [route.path, route.hash], closeAll)
</script>

<template>
  <header ref="headerEl" class="header">
    <div class="container header__inner">
      <RouterLink to="/" class="header__brand">
        <img class="header__logo" src="/logo-guilde.png" alt="" />
        La Guilde des Songes
      </RouterLink>

      <nav class="header__nav" :class="{ 'header__nav--open': menuOpen }" aria-label="Navigation principale">
        <!-- En mobile, la recherche ouvre le menu : le champ tient la colonne,
             et ses résultats se posent par-dessus les liens. La clé la remonte
             à chaque ouverture du menu, pour un champ toujours vierge. -->
        <SiteSearch v-if="rechercheAuMenu" :key="String(menuOpen)" class="header__nav-recherche" en-ligne />

        <!-- « Accueil » : lien vers la page + déroulant de ses sections -->
        <div
          class="header__group"
          @mouseenter="homeOpen = true"
          @mouseleave="homeOpen = false"
        >
          <RouterLink to="/" class="header__link" @click="closeAll">Accueil</RouterLink>
          <button
            class="header__caret"
            :aria-expanded="homeOpen"
            aria-label="Afficher les sections de l'accueil"
            @click="homeOpen = !homeOpen"
          >
            ▾
          </button>

          <div class="header__dropdown" :class="{ 'header__dropdown--open': homeOpen }">
            <RouterLink
              v-for="section in homeSections"
              :key="section.label"
              :to="section.to"
              class="header__dropdown-link"
              @click="closeAll"
            >
              {{ section.label }}
            </RouterLink>
          </div>
        </div>

        <RouterLink
          v-for="page in pages"
          :key="page.label"
          :to="page.to"
          class="header__link"
          @click="closeAll"
        >
          {{ page.label }}
        </RouterLink>

        <!-- Les réseaux ferment la liste, sous « Ressources », et se calent au
             bas du panneau — donc au-dessus de la barre du navigateur, qui
             mange le bas de l'écran au téléphone. -->
        <div class="header__nav-socials">
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
            @click="social.mail ? openContact() : null; closeAll()"
          >
            <IconGlyph :name="social.icon" />
          </component>
          <ThemeToggle class="header__nav-theme" />
        </div>
      </nav>

      <div class="header__actions" :class="{ 'header__actions--recherche': rechercheOuverte }">
        <!-- Sur grand écran, la loupe vit dans la barre : le champ s'y déplie
             dans la place libre. En mobile, elle est passée dans le menu. -->
        <SiteSearch v-if="!rechercheAuMenu" @bascule="rechercheOuverte = $event" />
        <!-- En mobile, le thème reste dans la barre, à gauche du menu : c'est un
             réglage d'affichage, pas une entrée de navigation. -->
        <ThemeToggle class="header__theme" />
        <div class="header__socials">
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
          <ThemeToggle />
        </div>

        <button
          class="header__burger"
          :aria-expanded="menuOpen"
          aria-label="Ouvrir le menu"
          @click="menuOpen = !menuOpen"
        >
          ☰
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  box-shadow: 0 6px 18px var(--shadow-dark);
}

/* Les groupes occupent toute la bande : l'espace libre aère logo, menus et pastilles */
.header__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--band-gap);
  min-height: var(--band-height);
}

/* Tout se règle sur la largeur de la fenêtre plutôt que sur des paliers : le
   logo et le titre se réduisent à mesure qu'elle se resserre, et le titre passe
   sur deux lignes s'il le faut encore. Sur grand écran, les bornes hautes des
   `clamp` redonnent exactement les tailles d'avant. */
.header__brand {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: clamp(0.4rem, 2vw, 0.7rem);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(0.9rem, 3.2vw, 1.1rem);
  line-height: 1.15;
  color: var(--text);
  text-decoration: none;
}

.header__logo {
  height: clamp(2.4rem, 10vw, 3.75rem);
  /* Il ne dépasse jamais de la bande, si basse soit-elle. */
  max-height: calc(var(--band-height) - 0.75rem);
  width: auto;
  flex: none;
}

/* Le tracé du logo est rouge sombre : on l'éclaircit sur fond sombre. */
:root[data-theme='dark'] .header__logo {
  filter: brightness(1.75) saturate(1.1);
}

.header__nav {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  min-width: 0;
}

.header__link {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.header__link:hover,
.header__link.router-link-active {
  color: var(--accent);
}

/* Groupe « Accueil » : le déroulant se positionne sous lui */
.header__group {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.header__caret {
  background: none;
  border: none;
  padding: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
}

.header__group:hover .header__caret {
  color: var(--accent);
}

/* Aligné sur « Accueil », son déclencheur, et non centré dessous : centré, son
   bord gauche tombait à 6 px du début du titre du hero et n'en laissait
   dépasser qu'un bout de lettre, lu comme une tache. */
.header__dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  transform: translateY(-6px);
  display: grid;
  gap: 0.2rem;
  min-width: 13.125rem;
  padding: 0.6rem;
  border-radius: var(--radius);
  background: var(--bg);
  box-shadow: var(--shadow-out);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
}

.header__dropdown--open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.header__dropdown-link {
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  color: var(--text-muted);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease, box-shadow 0.2s ease;
}

.header__dropdown-link:hover {
  color: var(--accent);
  box-shadow: var(--shadow-in-sm);
}

.header__nav-socials {
  display: none;
}

/* Une ligne à part, au-dessus des liens, séparée d'eux par un filet léger. */
.header__nav-recherche {
  margin-bottom: clamp(0.15rem, 0.6vh, 0.35rem);
  padding-bottom: clamp(0.25rem, 1vh, 0.6rem);
  border-bottom: 1px solid var(--shadow-dark);
}

.header__actions {
  display: flex;
  align-items: center;
  flex: none;
  gap: 0.6rem;
}

.header__socials {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: opacity 0.28s ease, visibility 0.28s;
}

/* `visibility`, et non `display` : la barre ne doit pas se réorganiser sous le
   champ qui s'ouvre. */
.header__actions--recherche .header__socials {
  opacity: 0;
  visibility: hidden;
}

/* Doublon du sélecteur de thème réservé à la barre mobile : sur grand écran,
   celui du groupe des réseaux suffit. */
.header__theme {
  display: none;
}

.header__burger {
  display: none;
  background: var(--bg);
  border: none;
  border-radius: 10px;
  color: var(--accent);
  font-size: 1.2rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  box-shadow: var(--shadow-out-sm);
}

.header__burger[aria-expanded='true'] {
  box-shadow: var(--shadow-in-sm);
}

@media (max-width: 1040px) {
  .header__inner {
    justify-content: space-between;
  }

  /* Le menu prend l'écran, de la barre jusqu'en bas : c'est un panneau, pas
     un volet posé sur la page. Ancré à la fenêtre (`fixed`) et non à la page,
     il ne bouge pas d'un pixel pendant qu'il est ouvert ; la hauteur de la
     barre est exactement `--band-height`. S'il déborde — petit écran, gros
     doigts — c'est lui qui défile, et le geste ne se propage pas derrière. */
  .header__nav {
    display: none;
    position: fixed;
    top: var(--band-height);
    left: 0;
    right: 0;
    bottom: 0;
    /* Les barres du navigateur mangent le bas de l'écran au téléphone. `dvh`
       suit cette zone réellement visible : sans lui, la dernière ligne du
       menu — les réseaux — passe dessous. */
    max-height: calc(100dvh - var(--band-height));
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--bg);
    box-shadow: 0 10px 22px var(--shadow-dark);
    padding: 0.5rem 1.5rem calc(1.25rem + env(safe-area-inset-bottom));
  }

  /* Le panneau commence sous la barre, mais il est positionné quand le reste
     de la barre ne l'est pas : au moindre écart il passerait devant. On pose
     donc le contenu de la barre au-dessus — le burger doit rester saisissable,
     c'est le seul chemin hors du menu une fois l'écran couvert. */
  .header__brand,
  .header__actions {
    position: relative;
    z-index: 1;
  }

  .header__nav--open {
    display: flex;
  }

  .header__link {
    padding: clamp(0.25rem, 1.15vh, 0.7rem) 0;
  }

  /* En mobile, les sections de l'accueil sont déjà dépliées : pas de survol possible */
  .header__group {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .header__caret {
    display: none;
  }

  .header__dropdown {
    position: static;
    transform: none;
    opacity: 1;
    visibility: visible;
    min-width: 0;
    gap: 0;
    padding: 0 0 clamp(0.2rem, 0.8vh, 0.5rem) 0.9rem;
    background: none;
    box-shadow: none;
  }

  .header__dropdown-link {
    padding: clamp(0.18rem, 0.85vh, 0.5rem) 0;
    font-weight: 400;
  }

  .header__dropdown-link:hover {
    box-shadow: none;
  }

  /* Dernière ligne du menu, sous « Ressources ». `margin-top: auto` la pose au
     bas du panneau : les liens tiennent le haut de l'écran, les pastilles le
     bas, et le vide se répartit entre les deux au lieu de s'accumuler sous
     elles. Sur un écran trop court pour tout montrer, `auto` ne pousse rien —
     elles suivent simplement « Ressources ». */
  .header__nav-socials {
    display: flex;
    justify-content: center;
    gap: 0.9rem;
    margin-top: auto;
    padding-top: clamp(0.6rem, 2vh, 1.4rem);
  }

  /* Le thème a sa pastille dans la barre : pas de doublon dans le menu. */
  .header__nav-theme {
    display: none;
  }

  .header__socials {
    display: none;
  }

  /* `grid` et non `inline-flex` : c'est la grille de .social-btn qui centre
     l'icône dans la pastille (place-items), le flex la collait à gauche. */
  .header__theme {
    display: grid;
  }

  /* Même gabarit que la pastille du thème, sa voisine immédiate. */
  .header__burger {
    display: grid;
    place-items: center;
    width: 2.375rem;
    height: 2.375rem;
    padding: 0;
    border-radius: 50%;
  }
}
</style>
