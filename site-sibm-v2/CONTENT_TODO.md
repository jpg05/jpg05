# Contenus à fournir et points à valider

Tout ce qui est inconnu apparaît sur le site sous la forme **[À FOURNIR]** (en pointillés). Rien n'a été inventé.
La liste des fichiers photo attendus est dans `PHOTOS_MANIFEST.md` (générée par le build).

## A. À fournir par SIBM

### Identité et photos
- [x] Logo officiel (SVG) intégré : en-tête, pied de page, favicon, Open Graph, JSON-LD.
- [ ] Photographies réelles : 69 emplacements listés dans `PHOTOS_MANIFEST.md` (hero, 6 familles, 31 produits, 9 références, 10 actualités, usines, QSE, galerie).
- [ ] Logos clients autorisés : Bouygues, ST, SAPH, EHDS, Franzetti, SITARAIL, SOGB, ABRI, Colas, CIE (affichés en texte en attendant). SVG ou PNG de préférence, 300 px de large minimum, dans `src/assets/logos/<nom>.svg|png`.
- [ ] Photos de l'ancien site (`assets/photos/`, `assets/clients/`) : non présentes dans le dépôt, à déposer dans `src/assets/photos/` et `src/assets/logos/`.
- [ ] Vidéo du hero (optionnelle) : `src/assets/video/hero.mp4`, muette, en boucle, avec une photo `accueil/hero.webp` comme affiche.
- [ ] Certificat ISO 9001 (2015) : image et numéro de certificat, organisme certificateur.

### Fiches produit (31 produits)
Décision de la direction : aucune donnée technique publiée (ni dimensions, ni poids, ni normes, ni PDF). Les fiches montrent le nom, la famille, une photo, un texte d'usage, les ouvrages de référence et un bouton « Demander la fiche technique » (formulaire envoyé au webhook, champ `formulaire=fiche-technique`).
- [ ] Texte d'usage validé pour chaque produit (le texte actuel est un remplissage générique balisé `data-filler`, voir `FILLER_REPORT.md`).
- [ ] Ouvrages de référence pour les produits qui n'en ont pas encore.
- [ ] Précision sur « Agglos (15 creux, plein) » : un seul produit ou deux fiches ?

### Béton sec SIBM
- [ ] Section « Caractéristiques » : texte marketing, sans chiffre (4 lignes prévues).
- [ ] Section « Avantages » : texte marketing, sans chiffre (4 lignes prévues).
- [ ] Photo.

### Références (9)
- [ ] Année, maître d'ouvrage / client et photo de chaque ouvrage.
- [ ] Produits livrés pour Tronçon Singrobo-Yamoussoukro et Voirie urbaine de Korhogo (non précisés dans le brief).
- [ ] Orthographe exacte de « Serebou/Bassawa ».
- [ ] Citations **textuelles** validées et autorisées par SITARAIL, Bouygues Energies & Services et la CIE. Les résumés ont été retirés (BRIEF V2 : pas de témoignage sans validation) ; la section affiche [À FOURNIR].

### Actualités (10)
- [ ] Texte, photo de couverture et catégorie validée de chaque article (catégories actuelles : classement provisoire).

### QSE
- [ ] Politique qualité.
- [ ] Santé et sécurité.
- [ ] Environnement.

### Carrières
- [ ] Offres ouvertes (liste vide actuellement : `positions` dans `src/data/data.mjs`).
- [ ] Liste des domaines du formulaire de candidature (liste provisoire).

### Mentions légales
- [ ] Directeur de la publication, forme juridique et capital, numéro RCCM, hébergeur.
- [ ] Politique de conservation des données personnelles.

### Technique
- [ ] URL du webhook n8n (`FORM_ENDPOINT`).
- [ ] Numéro WhatsApp (`WHATSAPP_NUMBER`) si utilisé ; confirmer que le numéro est bien actif sur WhatsApp.
- [ ] Nom de domaine final (`SITE_URL`) et hébergeur.
- [ ] Adresses exactes (rue) de San Pedro, Bouaké, Korhogo si disponibles ; coordonnées du standard pour l'agence de Yamoussoukro.

## B. À faire valider par SIBM avant publication
- [ ] « Premier fabricant de béton manufacturé certifié ISO 9001 (2015) de Côte d'Ivoire » : revendication reprise du brief, à confirmer (formulation, preuve).
- [ ] « Plus de 30 ans » (bureau d'étude) : chiffre du brief. « Un millier de collaborateurs » a été retiré (BRIEF V2 : pas d'effectif publié).
- [ ] Les chiffres clés animés de l'accueil : 1952, 5 villes, 7 implantations (siège et usine d'Abidjan, Yamoussoukro, San Pedro, deux usines à Bouaké, Korhogo), ISO 9001 (2015).
- [ ] Direction (masquée) : Noël Goué, Franck Effi, Marius Abbé (le brief écrit « Maruis »), Francis Priout, Judicaël Yapo ; la Direction générale manque.
- [ ] Format des numéros : `+225` suivi des numéros d'origine (ex. `+225 27 21 35 52 71`) ; vérifier chaque numéro.
- [ ] « Votre chantier, chiffré par le site le plus proche » (bande d'appel) et les textes de services : reformulés à partir du brief, à relire.
- [ ] Lien « Voir sur la carte » : recherche OpenStreetMap par adresse (aucune carte intégrée, aucune coordonnée).

## C. Images
Aucune photographie de banque d'images ni sous licence libre. Tous les visuels actuels sont des dessins vectoriels provisoires (plans, ouvrages, carte schématique), listés dans `FILLER_REPORT.md`.
