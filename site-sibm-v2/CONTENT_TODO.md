# Contenus à fournir et points à valider

Tout ce qui est inconnu apparaît sur le site sous la forme **[À FOURNIR]** (en pointillés). Rien n'a été inventé.
La liste des fichiers photo attendus est dans `PHOTOS_MANIFEST.md` (générée par le build).

## A. À fournir par SIBM

### Identité et photos
- [ ] Logo officiel (SVG). Le logo actuel est un monogramme provisoire (carré vert + « SIBM »).
- [ ] Photographies réelles : 76 emplacements listés dans `PHOTOS_MANIFEST.md` (hero, 6 familles, 31 produits, 9 références, 10 actualités, usines, QSE, galerie).
- [ ] Logos clients autorisés : Bouygues, ST, SAPH, EHDS, Franzetti, SITARAIL, SOGB, ABRI, Colas, CIE (affichés en texte en attendant).
- [ ] Certificat ISO 9001 (2015) : image et numéro de certificat, organisme certificateur.

### Fiches produit (31 produits)
- [ ] Description technique de chaque produit.
- [ ] Dimensions (longueur, largeur, épaisseur ou hauteur) ; unité de « Dalle carrée 49x49 » (cm ?).
- [ ] Normes applicables.
- [ ] Poids unitaire, conditionnement, quantité par palette.
- [ ] Fiche technique PDF (`src/assets/docs/<slug>.pdf`).
- [ ] Précision sur « Agglos (15 creux, plein) » : un seul produit ou deux fiches ?

### Béton sec SIBM
- [ ] Section « Caractéristiques » (4 lignes prévues).
- [ ] Section « Avantages » (4 lignes prévues).
- [ ] Photo, fiche technique PDF.

### Références (9)
- [ ] Année, maître d'ouvrage / client et photo de chaque ouvrage.
- [ ] Produits livrés pour Tronçon Singrobo-Yamoussoukro et Voirie urbaine de Korhogo (non précisés dans le brief).
- [ ] Orthographe exacte de « Serebou/Bassawa ».
- [ ] Citations **textuelles** validées par SITARAIL, Bouygues Energies & Services et la CIE (le site publie pour l'instant des résumés non guillemetés).

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
- [ ] « Plus de 30 ans » (bureau d'étude) et « un millier de collaborateurs » (carrières) : chiffres du brief.
- [ ] Les chiffres clés de l'accueil : « 5 villes » (Abidjan, Yamoussoukro, San Pedro, Bouaké, Korhogo) et « 7 implantations » dans la présentation.
- [ ] Direction (masquée) : Noël Goué, Franck Effi, Marius Abbé (le brief écrit « Maruis »), Francis Priout, Judicaël Yapo ; la Direction générale manque.
- [ ] Format des numéros : `+225` suivi des numéros d'origine (ex. `+225 27 21 35 52 71`) ; vérifier chaque numéro.
- [ ] « Un chantier à chiffrer ? » et les textes de services : reformulés à partir du brief, à relire.
- [ ] Lien « Voir sur la carte » : recherche OpenStreetMap par adresse (aucune carte intégrée, aucune coordonnée).

## C. Images sous licence libre
Aucune. Le site n'utilise aucune image Openverse ou Wikimedia pour l'instant.
