# Rapport de remplissage

Généré par `node build.mjs` (2026-11-06). Tout élément listé ici est provisoire : il est visuellement remplaçable et ne se présente jamais comme une photo, un chiffre ou une citation SIBM. Dans le code, le remplissage textuel et vectoriel porte `data-filler="true"`.

## Éléments de remplissage

| Élément | Où | Contenu réel qui le remplace |
|---|---|---|
| Composition architecturale vectorielle du hero (trames, éléments préfabriqués) | Accueil, hero | Vidéo src/assets/video/hero.mp4 (muette, en boucle) ou photo réelle src/assets/photos/accueil/hero.webp |
| Plans techniques vectoriels par famille (sans cote chiffrée) | Accueil, familles ; index et pages familles | Photographies réelles des produits, src/assets/photos/familles/<famille>.webp |
| Phrases d’usage par famille (data-filler) | Accueil, cartes familles | Texte validé par SIBM |
| Tracé vectoriel de l’ouvrage : Pont Henri Konan Bédié | Accueil, références | Photo de chantier ou de l’ouvrage, src/assets/photos/references/pont-henri-konan-bedie.webp (droits à vérifier) |
| Tracé vectoriel de l’ouvrage : Basilique Notre-Dame de la Paix de Yamoussoukro | Accueil, références | Photo de chantier ou de l’ouvrage, src/assets/photos/references/basilique-notre-dame-de-la-paix.webp (droits à vérifier) |
| Tracé vectoriel de l’ouvrage : Stade Félix Houphouët-Boigny | Accueil, références | Photo de chantier ou de l’ouvrage, src/assets/photos/references/stade-felix-houphouet-boigny.webp (droits à vérifier) |
| Tracé vectoriel de l’ouvrage : Tours administratives d’Abidjan-Plateau | Accueil, références | Photo de chantier ou de l’ouvrage, src/assets/photos/references/tours-administratives-abidjan-plateau.webp (droits à vérifier) |
| Contour schématique de la Côte d’Ivoire (tracé simplifié) | Accueil, carte des sites | Contour officiel (SVG IGN / CNTIG) si une précision cartographique est souhaitée |
| Image Open Graph (logo officiel sur fond blanc) | src/assets/og-default.png | Visuel de partage avec photo réelle d’usine ou de chantier |
| Phrase d’usage du Béton sec (data-filler) | /produits/beton-sec | Texte marketing validé par SIBM |
| Phrases d’usage par produit (31 fiches, data-filler) | Pages produit, cartes « même famille » | Texte d’usage validé par SIBM, sans donnée technique |

## Emplacements photo [À FOURNIR]

69 emplacements, détaillés dans `PHOTOS_MANIFEST.md`. Images de l’ancien site (`assets/photos/`, `assets/clients/`) : **non fournies dans le dépôt** et sibmci.com inaccessible depuis l’environnement de génération ; à déposer dans `src/assets/photos/` puis relancer le build.

## Photos en basse résolution (moins de 1200 px de large)

Aucune photo présente pour l’instant.

## Logos clients

Affichés en niveaux de gris (opacité .6), couleur au survol, au focus et, sur écran tactile, à l’entrée dans l’écran. 10 logos sur 10 sont absents et remplacés par le nom en texte : Bouygues, ST, SAPH, EHDS, Franzetti, SITARAIL, SOGB, ABRI, Colas, CIE. Ne publier que les logos autorisés par chaque client.

Logos de moins de 300 px de large : aucun fichier présent pour l’instant.

## Contenus interdits en remplissage, laissés [À FOURNIR]

Dimensions, poids, classes de charge, normes, formulations, conditionnement, prix ; numéro de certificat, organisme certificateur, RCCM, forme juridique, capital, directeur de la publication, effectif ; témoignages, logos clients non autorisés, distinctions, années et maîtres d’ouvrage des références, personnes nommées. Liste détaillée : `CONTENT_TODO.md` et marques [À FOURNIR] sur les pages.

## À vérifier par SIBM

- « Premier fabricant de béton manufacturé certifié ISO 9001 (2015) en Côte d’Ivoire » : repris de l’ancien site. À confirmer qu’il est bien publié par SIBM, sinon le retirer (BRIEF V2 §3).
- « Plus de 30 ans d’expérience » (bureau d’étude) : repris de l’ancien site.
