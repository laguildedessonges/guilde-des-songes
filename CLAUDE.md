# CLAUDE.md — Site vitrine La Guilde des Songes

Site vitrine statique de l'association de jeu de rôle « La Guilde des Songes » (Dijon).
Refonte de https://www.laguildedessonges.net/ — le contenu factuel (créneaux, adresses,
réseaux) vient de l'ancien site.

## Stack

- Vite + Vue 3 (`<script setup>`) + vue-router en **historique HTML** : URL propres
  (`/agenda`, pas `#/agenda`). Le site reste 100 % statique ; c'est le repli vers
  `index.html` qui rend les liens profonds rechargeables — `public/.htaccess` (Apache,
  OVH) et le `404.html` copié dans `dist/` au build (GitHub Pages).
- `src/pages/` = une page par route (Home, Partners, Agenda, Gazette, GazetteIssue) ;
  `src/components/` = sections de l'accueil et briques partagées.
- Design tokens CSS dans `src/style.css` (`--bg`, `--accent`, `--band-height`…) — jamais
  de couleur en dur dans les composants.
- Police : Garamond partout (EB Garamond via Google Fonts dans `index.html`), titres en gras.
- Icônes : `IconGlyph.vue` (SVG au trait, y compris les logos Discord/Instagram/Facebook),
  toujours posées dans une pastille en creux (`--shadow-in-sm`).

## Contenu à mettre à jour

- **Agenda** : piloté par une feuille Google (onglet « Événements » : date, horaire,
  type, titre, jeu, lieu, MJ, description, places, lien Discord). Le site la lit au
  chargement et affiche les places restantes ; les inscriptions s'y ajoutent, qu'elles
  viennent du site ou soient saisies à la main. Mise en place dans
  `docs/agenda-google-sheet.gs`, puis coller l'URL du déploiement dans
  `SHEET_ENDPOINT` (`src/data/sheet.js`).
  Tant que la feuille n'est pas configurée — ou si elle ne répond pas — le site
  retombe sur les parties écrites dans `src/data/events.js`.
  Les parties passées disparaissent automatiquement. Le type `mensuelle` ouvre le
  formulaire d'inscription du site ; les autres renvoient au salon Discord.
- **Intéressés Discord** : la feuille ne peut pas interroger Discord (bloqué depuis
  les serveurs de Google, code 40333). Le workflow `.github/workflows/releve-discord.yml`
  lance `scripts/releve-discord.mjs` toutes les 15 min et publie `interesses.json` sur
  la branche `donnees`, que la feuille lit. Le jeton du bot est le secret GitHub
  `DISCORD_TOKEN`, l'identifiant du serveur est dans le workflow.
- **Gazette** : un fichier Markdown par numéro dans `src/gazette/` (front-matter
  `title` / `date` / `excerpt`). Déposer le fichier suffit : il est listé et publié.
- **Partenaires** : `src/data/partners.js`.
- **Réseaux et contact** : `src/socials.js` (partagé entête + pied de page).

## Commandes

- `npm run dev` — serveur de dev.
- `npm run build` — build statique dans `dist/` (déployable sur n'importe quel hébergeur statique).

## Publication

Hébergé sur GitHub Pages. Le workflow `.github/workflows/deploy.yml` reconstruit et
met en ligne le site à **chaque push sur `main`** — y compris les modifications faites
directement depuis l'interface web de GitHub (bouton crayon puis « Commit changes »).
Compter une à deux minutes ; l'avancement est visible dans l'onglet **Actions**.

Côté GitHub, **Settings → Pages → Source doit être « GitHub Actions »**. Réglé sur
« Deploy from a branch », Pages publie les fichiers source au lieu du build : la page
reste blanche (elle demande `/src/main.js`, que seul le serveur de dev sait servir).

**Chemin de publication** : `BASE_PATH` au moment du build (`vite.config.js`), repris
par le routeur. Le workflow le fixe à `/guilde-des-songes/`, le sous-dossier de l'URL
GitHub Pages. Sur un domaine servi à la racine (laguildedessonges.net), mettre `/`
dans le workflow. Les deux ne peuvent pas cohabiter : avec des URL propres, les liens
et les fichiers doivent connaître le sous-dossier.

## Règles

- Tout le contenu est en français ; pas d'i18n.
- Vérifier la lisibilité à chaque modif : rien ne déborde ni ne se fait rogner, y compris en mobile (~375px).
- Commit/push uniquement quand l'utilisateur le demande ; travailler sur une branche dédiée puis merger sur main.
