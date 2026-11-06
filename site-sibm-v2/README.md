# Site SIBM v2

Nouveau site vitrine de la Société Ivoirienne de Béton Manufacturé. Statique, en français, sans traceur, sans dépendance
d'exécution. **Ce dossier est indépendant du site de production (`sibmci.com`) : rien ici ne le modifie ni ne le déploie.**

- 63 pages générées (accueil, présentation, 6 familles, 31 fiches produit, 3 services, références, 10 actualités, galerie,
  contact, réclamation, devis, QSE, carrières, mentions légales, 404).
- Polices auto-hébergées (Archivo, Hanken Grotesk, licence OFL), CSS ~12 Ko, JS ~4 Ko.
- Direction artistique : fond blanc, vert de marque `#1F6B3F` en seul accent, grille éditoriale et repères techniques.

## Lancer en local

Prérequis : Node 18 ou plus. Aucun `npm install` nécessaire.

```bash
cd site-sibm-v2
npm run dev        # construit dist/ puis sert sur http://localhost:4173
```

## Construire

```bash
npm run build      # écrit dist/ (pages, assets, sitemap.xml, robots.txt, redirections)
```

Variables d'environnement (toutes optionnelles) :

| Variable | Rôle | Défaut |
|---|---|---|
| `SITE_URL` | URL de base (canonical, Open Graph, sitemap, JSON-LD) | `https://www.sibmci.com` |
| `FORM_ENDPOINT` | URL du webhook n8n qui reçoit les 4 formulaires (POST `multipart/form-data`) | vide : les formulaires affichent « envoi non activé » |
| `WHATSAPP_NUMBER` | Numéro WhatsApp, chiffres seuls avec indicatif (ex. `2250700000000`) | vide : seul le bouton téléphone s'affiche |
| `PHONE_NUMBER` | Numéro du bouton d'appel mobile (format `+225…`) | standard du siège |

Exemple : `FORM_ENDPOINT=https://n8n.exemple.ci/webhook/sibm SITE_URL=https://nouveau.sibmci.com npm run build`

Champs reçus par le webhook : `formulaire` (`devis`, `reclamation`, `contact`, `candidature`), `page`, puis les champs du
formulaire (`type`, `societe`, `nom`, `contact`, `telephone`, `email`, `famille`, `projet`, `ville`, `produit`,
`description`, `motif`, `site`, `message`, `domaine`) et les fichiers `piece_jointe` ou `cv`. Le champ piège `website`
n'est jamais envoyé : s'il est rempli, la requête est abandonnée côté navigateur. **Le webhook doit aussi filtrer le spam
côté serveur** (limite de débit, taille des fichiers) : une protection côté client ne suffit pas.

## Déployer

Le dossier `dist/` est le site. Les pages sont des fichiers `nom.html` servis sans extension (`/presentation`).

**Nginx**

```nginx
server {
  root /var/www/sibm-v2/dist;
  include /etc/nginx/snippets/sibm-redirects.conf;   # contenu de redirects.nginx.conf
  location / { try_files $uri $uri.html $uri/ =404; }
  error_page 404 /404.html;
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
}
```

**Netlify / Cloudflare Pages** : publier `dist/` ; `_redirects` et `_headers` sont déjà dedans.

Avant la mise en production : activer HTTPS, compression (gzip ou brotli) et vérifier `FORM_ENDPOINT`.

## Redirections 301

Générées depuis `redirectMap` dans `src/data/data.mjs` : `redirects.nginx.conf` (Nginx) et `_redirects` (format Netlify),
copiés à la racine du projet et dans `dist/`. Chaque ancienne URL est couverte avec et sans le suffixe `/fr`.

## Photos : où déposer les vraies images

Chaque emplacement vide affiche un repère avec son nom de fichier. Déposer le fichier dans `src/assets/photos/` (AVIF, WebP
ou JPG ; sous-dossiers `familles/`, `produits/`, `references/`, `actualites/`, etc.) puis relancer `npm run build` : le
repère est remplacé par l'image, avec `loading="lazy"` et un format AVIF/WebP prioritaire. La liste complète est dans
`PHOTOS_MANIFEST.md` (régénérée à chaque build). Recommandations : 1600 px de large maximum, WebP ou AVIF, moins de 200 Ko.
Autres dépôts : logos clients dans `src/assets/logos/<nom>.svg` (ex. `sitarail.svg`), fiches techniques dans
`src/assets/docs/<slug-produit>.pdf` : le lien de téléchargement apparaît tout seul.

## Direction : composant masqué

La section Direction de `/presentation` est construite mais masquée : passer `SHOW_LEADERSHIP` à `true` dans
`src/data/data.mjs` après validation des noms.

## Ajouter l'anglais

Copier `src/i18n/fr.mjs` en `en.mjs`, traduire, puis enregistrer la langue dans `LOCALES` de `build.mjs` : les pages sortent
sous `/en/`. Les noms de produits et les données de `src/data/data.mjs` restent à traduire.

## Structure

```
build.mjs            générateur (pages, sitemap, redirections, manifeste photos)
serve.mjs            serveur de prévisualisation
src/data/data.mjs    agences, produits, références, actualités, redirections
src/i18n/fr.mjs      tous les textes
src/assets/          css, js, polices, photos, logos, docs, og-default.png
dist/                site généré
CONTENT_TODO.md      contenus manquants et points à valider
```
