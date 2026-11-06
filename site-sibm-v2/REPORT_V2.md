# Rapport final : BRIEF V2 (logo, couche « wow », remplissage) et addendum produits

Branche : `claude/sibm-v2-effets-logo` (partie de `claude/install-taste-skill-ptzncv`). Site : `site-sibm-v2/`, 63 pages.

## 1. Sources et décisions de cadrage

- **BRIEF.md** n'était pas dans le dépôt. Il a été reconstitué depuis la conversation « Refonte site vitrine SIBM » (sections 1 à 4, contacts, formulaires, section 8) ; le reste était déjà codé dans `src/data/data.mjs`.
- **Images de l'ancien site** (`assets/photos/`, `assets/clients/`) : absentes du dépôt, et sibmci.com est bloqué par le proxy de l'environnement (403). La consigne « images perles » a été lue comme « Pexels » : Pexels, Unsplash et Wikimedia sont aussi injoignables, et BRIEF V2 §3 interdit les photos de banque d'images présentées comme SIBM. **Aucune photo n'a donc été intégrée** ; les 69 emplacements restent en [À FOURNIR] et les visuels sont des dessins vectoriels provisoires.
- **Arbitrages Taste Skill / BRIEF V2** (validés par Jean) : BRIEF V2 l'emporte sur les effets ; les vrais contacts SIBM sont conservés (la règle 9 du skill, pensée pour des maquettes, est écartée) ; le skill est greffé sur le générateur existant au lieu de repartir de `starter.html`.

## 2. Étapes du skill design-taste-frontend réellement exécutées

| Étape du skill | Statut | Détail |
|---|---|---|
| Installation | Faite | `npx skills add Leonxlnx/taste-skill`, fichiers commités (`.agents/`, `.claude/`, `skills-lock.json`), skill invoqué explicitement |
| 1. Lecture du brief, type de site | Faite | Type `product`, site-kind `other`, action principale « Demander un devis » |
| Lecture des références | Faite | `system.md`, `copy.md`, `layout-v4.md` en entier ; `sections.md` (plans par type) ; `motion.md` |
| 3-4. Tirage du hero | Fait | `deal.mjs --type product --has object` : hero `product` ; scène = composition vectorielle (BRIEF V2), pas de rendu 3D |
| 4. Tirage palette et typo | Fait | `start.mjs deal` : 3 palettes tirées, aucune n'est SIBM. Remplacées par `start.mjs brand` avec la charte (#074914, fond blanc). Typo tirée : Besley / Albert Sans |
| 4. Tirage nav, pied, clôture, rythme, boutons | Fait | nav-mega re-tiré en nav-split (pas de photo pour son panneau, règle du skill), footer-columns, close-word, brand-band (= bande CTA verte), boutons solid |
| 5. Construction | Partielle | Greffe sur le générateur : jetons, échelle typo, grille 12 colonnes, marges et règles du skill réécrits dans `site.css` ; `system.css`, `system.js` et `layout.css` du skill **non utilisés**. Couche de survol `motion.css` et `motion.js` copiée **sans modification** |
| 5. `photos.mjs` | Non exécuté | Aucune photo autorisée (BRIEF V2 §3) et réseau d'images bloqué |
| 5. `icons.mjs` | Non exécuté | Aucun outil tiers à afficher ; logos clients non autorisés |
| 5. Rendu produit 3D (`product-render`) | Non exécuté | BRIEF V2 impose des plans vectoriels pour les familles sans photo |
| 6. `check.mjs` (mise en page) | Fait, 3 passes | Accueil à 1440, 1024, 820, 768, 390 ; fiche produit, références, contact, présentation, produits, famille et devis à 1440, 768, 390 |
| 6. `shoot.mjs` | Fait | Captures 1440 et 390 de l'accueil, d'une fiche produit et du Béton sec |
| 6. `consistency.mjs` | Fait, 2 passes | Accueil (1440 et 390, puis 1440, 768 et 390), environ 12 min chacune |
| 6. `perf.mjs` | Fait | Accueil : 0 FAIL, 6 WARN (SVG vectoriels, sans objet) |
| 7. Rapport | Ce fichier | |

Chrome (Google Chrome for Testing 153, headless) a fonctionné : **aucune étape navigateur n'a été sautée**. Limite : `consistency.mjs` n'a tourné que sur l'accueil (12 min par passage), pas sur les 63 pages.

## 3. Résultats des vérificateurs du skill

**`check.mjs`** (après corrections) : hero d'exactement un écran aux 5 largeurs, titre sur 3 lignes, aucun débordement latéral sur les 8 gabarits contrôlés. Restent :
- défilé des clients signalé `bleed-one-side` : faux positif, il est découpé par son `overflow: hidden` ;
- familles épinglées (2,5 écrans) et références épinglées (3,5 écrans) hors règle « un ou deux écrans » : imposé par BRIEF V2 §2.3 et §2.4.

**`consistency.mjs`** (dernier passage, avant les dernières corrections) : 204 FAIL, 38 WARN sur 3 largeurs. Répartition :
- **Conflits voulus avec BRIEF V2** (environ 90) : `scroll-reveal` 53, `pinned` 3, `scroll-linked` 2, `effect-kind` 2, `count-text` 2 (1952 compte, demandé par BRIEF V2), `section-height` et `one-section` liés aux sections épinglées, `overlap-text` (panneaux empilés des références), `phone-number` (vrais numéros conservés), `product-shown` (aucune photo).
- **Faux positifs** : `copy-headings`, `copy-buttons` (heuristique anglaise sur des titres français), `links` (URL sans extension, servies par `try_files` en production).
- **Corrigés après ce passage** : `hero-screen` (parallaxe confinée, hero de 900/900 px vérifié), `cut-text` du titre, `one-heading` du pied de page, `text-contrast` du chapô des références.
- **Acceptés** : bouton d'appel flottant sur mobile (`nav-covers`), calques décoratifs pleine largeur (`right-edge`), bande verte à bouton blanc comptée comme 3e style de bouton (`button-styles`).

## 4. Effets livrés et effets abandonnés

| Effet (BRIEF V2 §2) | Statut |
|---|---|
| 1. Hero cinématique | Livré : plein écran, composition architecturale vectorielle en parallaxe lente, titre révélé ligne par ligne, grain animé, indicateur de défilement. Emplacement vidéo prêt (`src/assets/video/hero.mp4`, jamais chargé en économie de données), inactif faute de fichier |
| 2. Chiffres animés | Livré : 1952, 5 villes, 7 implantations (compteur de `motion.js`) ; ISO 9001 en texte fixe |
| 3. Familles en défilement horizontal épinglé | Livré (bureau, 1024 px et plus) : plans tracés au `stroke-dashoffset`, liste des produits au survol, barre de progression. Grille simple en tablette et mobile |
| 4. Références en storytelling épinglé | Livré : 4 ouvrages (pont HKB, basilique, stade, tours) en panneaux empilés, tracés animés, étiquettes produits qui apparaissent |
| 5. Carte interactive de Côte d'Ivoire | Livré : SVG, 5 repères animés, fiche agence au clic et au clavier, « Demander un devis à ce site » (pré-remplit `site` dans le devis). Contour schématique |
| 6. Micro-interactions | Livré : boutons magnétiques, curseur personnalisé (bureau), tilt 3D sur les cartes familles de `/produits`, révélation au masque, défilé des clients avec bouton pause, soulignés animés (couche du skill), transitions de page (View Transitions : Chrome et Edge, sans effet ailleurs) |
| 7. Bande CTA verte | Livré : une par page, seule section sombre, absente de la page devis |
| GSAP, ScrollTrigger, Lenis | **Abandonnés** : tout est en JS natif (10,5 Ko compressés au total). Lenis est aussi interdit par le skill (pas de bibliothèque de défilement doux) |

Tout est désactivé sous `prefers-reduced-motion` (vérifié : 0 animation, aucun contenu masqué, pas de curseur). Sans JavaScript ou sans IntersectionObserver, tout le contenu reste visible (états masqués conditionnés à `.fx-io`).

## 5. Performance et accessibilité

Lighthouse 12, mobile, throttling simulé « Slow 4G » (RTT 150 ms, 1,6 Mb/s) et CPU ralenti ×4 :

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Accueil | 98 | 100 | 100 | 100 | 2,3 s | 10 ms | 0 |
| Fiche produit (Caniveaux) | 99 | 100 | 100 | 100 | 2,2 s | 0 ms | 0 |
| Devis | 99 | 100 | 100 | 100 | 2,0 s | 0 ms | 0 |

Budget BRIEF V2 tenu : LCP sous 2,5 s, JS **10,5 Ko** compressés pour 150 Ko autorisés, CSS 13,8 Ko compressés. Le serveur local ne compresse pas : en production, activer gzip ou brotli dans nginx (Lighthouse estime 70 à 88 Ko d'économie).

Clavier testé : lien d'évitement en premier, focus visible partout (anneau de 2 px), carte utilisable à la touche Entrée, bouton « Demander la fiche technique » qui ouvre le formulaire et y place le focus.

## 6. Addendum produits appliqué

- Fiches produit : nom, famille, emplacement photo, texte d'usage (remplissage `data-filler`), ouvrages de référence, bouton « Demander la fiche technique » qui ouvre un formulaire (nom, société, e-mail, téléphone, produit pré-rempli) envoyé à `FORM_ENDPOINT` avec `formulaire=fiche-technique`. **Plus de tableaux de cotes, de normes, de poids ni d'emplacement PDF.**
- Béton sec : « Caractéristiques » et « Avantages » en texte marketing [À FOURNIR].
- Logos clients : niveaux de gris, opacité 0,6, couleur au survol et au focus (300 ms), couleur à l'entrée dans l'écran sur tactile, `mix-blend-mode: multiply`, hauteur uniforme. Aucun logo fourni : les noms s'affichent en texte (opacité 0,68 pour garder le contraste AA). Le logo SIBM n'est jamais filtré.
- Retirés (BRIEF V2 §3) : résumés de témoignages clients, « un millier de collaborateurs ».

## 7. Remplissage et contenu à fournir

- `FILLER_REPORT.md` (généré à chaque build) : chaque élément provisoire, son emplacement et ce qui le remplace, plus le contrôle des images en basse résolution (moins de 1200 px) et des logos de moins de 300 px.
- `CONTENT_TODO.md` : contenu à fournir par SIBM.
- `PHOTOS_MANIFEST.md` : 69 photos attendues.
- À confirmer par SIBM : la mention « Premier fabricant de béton manufacturé certifié ISO 9001 (2015) en Côte d'Ivoire », reprise de l'ancien site (BRIEF V2 interdit tout superlatif non publié par SIBM).
