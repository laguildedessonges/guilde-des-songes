<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconGlyph from './IconGlyph.vue'
import ThemeToggle from './ThemeToggle.vue'
import { socials, openContact } from '../socials.js'

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

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

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

      <div class="header__actions">
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

.header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
}

.header__logo {
  height: 3.75rem;
  width: auto;
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

.header__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header__socials {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

  .header__nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    background: var(--bg);
    box-shadow: 0 10px 22px var(--shadow-dark);
    padding: 0.5rem 1.5rem 1.25rem;
  }

  .header__nav--open {
    display: flex;
  }

  .header__link {
    padding: 0.7rem 0;
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
    padding: 0 0 0.5rem 0.9rem;
    background: none;
    box-shadow: none;
  }

  .header__dropdown-link {
    padding: 0.5rem 0;
    font-weight: 400;
  }

  .header__dropdown-link:hover {
    box-shadow: none;
  }

  /* En mobile, les réseaux vivent dans le menu déroulant, centrés sous les liens */
  .header__nav-socials {
    display: flex;
    justify-content: center;
    gap: 0.9rem;
    padding-top: 0.9rem;
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
