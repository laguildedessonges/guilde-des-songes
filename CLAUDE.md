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
  chargement ; les inscriptions s'y ajoutent, qu'elles viennent du site ou soient
  saisies à la main. Un nombre dans la colonne « Places » allume le compteur
  « 2/4 places restantes », intéressés Discord déduits ; sans nombre, pas de
  compteur. Les soirées mensuelles annoncent en plus les personnes déjà
  annoncées (« 15 intéressé·es sur Discord », ou « 9 inscrit·es » quand c'est le
  formulaire du site qui accueille) — elles seules : ailleurs, un décompte sans
  total ne se met en regard de rien.
  Mise en place dans `docs/agenda-google-sheet.gs`, puis coller l'URL du
  déploiement dans `SHEET_ENDPOINT` (`src/data/sheet.js`).
  Tant que la feuille n'est pas configurée — ou si elle ne répond pas — le site
  retombe sur les parties écrites dans `src/data/events.js`.
  Les parties passées disparaissent automatiquement. Une soirée `mensuelle`
  accueille par les deux guichets : le bouton Discord quand la ligne a un lien,
  et le formulaire du site pour qui n'est pas encore sur le serveur. Les autres
  tables n'en ouvrent qu'un — le formulaire à défaut de lien Discord, et
  seulement si des places sont annoncées.
  `/agenda?jour=2026-09-19` ouvre directement ce jour-là : c'est ainsi que la
  gazette renvoie à une date.
- **Intéressés Discord** : la feuille ne peut pas interroger Discord (bloqué depuis
  les serveurs de Google, code 40333). Le workflow `.github/workflows/releve-discord.yml`
  lance `scripts/releve-discord.mjs` toutes les 15 min et publie `interesses.json` sur
  la branche `donnees`, que la feuille lit. Le jeton du bot est le secret GitHub
  `DISCORD_TOKEN`, l'identifiant du serveur est dans le workflow.
- **Gazette** : un fichier Markdown par numéro dans `src/gazette/` (front-matter
  `title` / `numero` / `date` / `excerpt`). Déposer le fichier suffit : il est
  listé et publié. Les numéros se consultent en ligne : rien à télécharger, le
  bouton « Partager le numéro » ne fait que donner son lien.

  Consignes de mise en forme, à tenir d'un numéro à l'autre :
  - `title` porte le **titre seul** et `numero` le numéro. Dans la **liste**, où
    il faut distinguer les numéros entre eux, ils se lisent sur une ligne :
    « Titre&nbsp;· Numéro 1 », séparés d'un **point médian**, le numéro à la
    taille du titre mais en romain. En **lecture**, le numéro passe sous le
    titre, en plus petit et en retrait.
  - **Fidélité au document d'origine** : le gras du PDF est conservé (ce sont
    généralement les **lieux** : l'Annexe de la Maison Phare, l'Espace
    Baudelaire, le Dionysos…) et l'italique aussi (titres de jeux et d'œuvres,
    et le nom de la *Gazette* elle-même).
  - Chaque **date du programme** est en gras et cliquable, vers le jour de
    l'agenda : `[Le 19/09](/agenda?jour=2026-09-19)`. Un renvoi interne s'écrit
    à la racine ; le chemin de publication lui est ajouté au passage. Le clic
    ouvre la fenêtre des parties de ce jour **sans quitter le numéro** ; le lien
    lui-même mène à l'agenda (nouvel onglet, lien copié, agenda muet).
  - Le programme se termine par l'avertissement d'usage, en citation : il n'est
    pas exhaustif et peut changer, le Discord et l'agenda font foi.
  - **Résumé de session** : partout où le document porte la phrase « Un résumé de
    la dernière session est disponible ! », le résumé qui suit s'écrit dans un
    bloc replié — seul son premier paragraphe se lit d'emblée, le reste s'ouvre
    au clic :

    ```
    :::resume Chapitre 11 — La Passerelle
    Premier paragraphe : l'aperçu, toujours visible.

    Le reste du résumé, déplié au clic.
    :::
    ```

    Ces résumés font plusieurs dizaines de paragraphes : dépliés d'office, ils
    noieraient tout le reste du numéro.
  - **Toute date se présente en mini carte de calendrier** — jour en grand, mois
    et année dessous. Une entrée datée (une soirée du programme) s'écrit avec sa
    carte à gauche et son texte à côté, sans répéter la date dans le texte :

    ```
    :::date 2026-09-11
    Greg lance un scénario test à l'Annexe, à 19h30.
    :::
    ```

    Deux jours d'affilée s'écrivent `2026-09-05..2026-09-06` (la carte affiche
    « 5–6 »), et `sans-lien` retire le renvoi vers l'agenda — pour une date qui
    n'y figure pas, comme un festival extérieur.

  - **Série de dates sans texte** (les prochaines soirées mensuelles) : les
    mêmes cartes, rangées en une ligne centrée, plutôt qu'une liste à puces
    d'une ligne par date :

    ```
    :::soirees
    2026-11-21
    2026-12-12
    :::
    ```
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
par le routeur. Le workflow le fixe à `/`, le site étant servi à la racine du domaine
**laguildedessonges.net** (domaine déclaré dans *Settings → Pages* et dans
`public/CNAME`, qui doit porter la même valeur). Pour revenir à l'adresse GitHub en
sous-dossier, remettre `/guilde-des-songes/`. Les deux ne peuvent pas cohabiter :
avec des URL propres, les liens et les fichiers doivent connaître leur dossier.

## Règles

- Tout le contenu est en français ; pas d'i18n.
- Vérifier la lisibilité à chaque modif : rien ne déborde ni ne se fait rogner, y compris en mobile (~375px).
- **Les cartes d'une même liste ont toutes la même taille** : hauteur de rangée
  commune, vignettes au même format (`aspect-ratio` + `object-fit`), et l'action
  calée en bas quelle que soit la longueur du texte. Des cartes qui se décalent
  parce que leurs images ou leurs légendes diffèrent donnent une grille bancale.
- Commit/push uniquement quand l'utilisateur le demande ; travailler sur une branche dédiée puis merger sur main.
