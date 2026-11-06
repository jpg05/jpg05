// Données du site SIBM. Tout ce qui est factuel vient du brief.
// Ce qui est inconnu est laissé vide ou marqué TODO ; il apparaît alors « [À FOURNIR] » côté page
// et dans CONTENT_TODO.md.

export const TODO = '[À FOURNIR]';

export const company = {
  name: 'Société Ivoirienne de Béton Manufacturé',
  short: 'SIBM',
  formerName: 'SABM (Société Africaine de Béton Manufacturé)',
  founded: 1952,
  renamed: 1979,
  email: 'sibm@sibmci.com',
};

// Numéros affichés au format international +225.
export const phone = (n) => '+225 ' + n;
export const tel = (n) => '+225' + n.replace(/\s/g, '');

export const agencies = [
  {
    id: 'abidjan',
    name: 'Abidjan',
    role: 'Siège et usine',
    lines: ['Siège : Zone 4A, Abidjan', 'Usine : PK24, Autoroute du Nord'],
    phones: ['27 21 35 52 71', '27 21 35 82 27'],
    map: 'Zone 4A Abidjan Côte d’Ivoire',
  },
  {
    id: 'yamoussoukro',
    name: 'Yamoussoukro',
    role: 'Agence et usine',
    lines: ['Route de Kpangbassou (ex-SONITRA)'],
    phones: ['05 44 67 99 54'],
    map: 'route de Kpangbassou Yamoussoukro Côte d’Ivoire',
  },
  {
    id: 'san-pedro',
    name: 'San Pedro',
    role: 'Agence et usine',
    lines: ['Zone industrielle, San Pedro'],
    phones: ['27 34 71 22 93', '05 56 13 36 08'],
    map: 'zone industrielle San Pedro Côte d’Ivoire',
  },
  {
    id: 'bouake',
    name: 'Bouaké',
    role: 'Deux usines',
    lines: [
      'Usine 1 : zone industrielle, route de Béoumi',
      'Usine 2 : quartier Air France',
    ],
    phones: ['27 31 65 83 79', '05 75 15 40 49'],
    map: 'zone industrielle route de Béoumi Bouaké Côte d’Ivoire',
  },
  {
    id: 'korhogo',
    name: 'Korhogo',
    role: 'Agence et usine',
    lines: ['Carrefour Tioro, Korhogo'],
    phones: ['05 55 53 71 53'],
    map: 'carrefour Tioro Korhogo Côte d’Ivoire',
  },
];

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ---------------------------------------------------------------- Produits
export const families = [
  {
    slug: 'voirie-pavage',
    name: 'Voirie et pavage',
    intro:
      'Bordures, dalles, pavés et séparateurs de chaussée pour les voiries urbaines, les places et les aménagements extérieurs.',
    products: [
      'Bordure T2',
      'Dalle carrée 49x49',
      'Pavé rectangulaire',
      'Dalles béton gazon',
      'Pavé hexagonal',
      'Pavé Trief',
      'Pavé Trief Quartz',
      'Pavé en béton',
      'Revêtement de sol',
      'Séparateurs de chaussée',
      'Bornes obus',
    ],
  },
  {
    slug: 'maconnerie-murs',
    name: 'Maçonnerie et murs',
    intro:
      'Agglomérés, murs de soutènement, murs anti-bruit, panneaux et claustras pour le bâtiment et les clôtures.',
    products: [
      'Agglos (15 creux, plein)',
      'Mur de soutènement',
      'Mur anti-bruit',
      'Panneaux muraux',
      'Claustras',
      'Claustras lame Z',
      'Atalus 18/50/120',
    ],
  },
  {
    slug: 'structure-planchers',
    name: 'Structure et planchers',
    intro:
      'Planchers précontraints, hourdis et nervures, écailles de pont et marches d’escalier pour le bâtiment et les ouvrages.',
    products: [
      'Plancher alvéolaire précontraint',
      'Hourdis et nervures',
      'Plancher Alphilaire',
      'Écaille de pont',
      'Marches d’escalier',
    ],
  },
  {
    slug: 'hydraulique-assainissement',
    name: 'Hydraulique et assainissement',
    intro:
      'Dalots, caniveaux, tuyaux vibrés armés et chambres de tirage pour l’évacuation des eaux et les réseaux.',
    products: [
      'Dalot cadre fermé',
      'Caniveaux',
      'Tuyaux vibrés armés',
      'Tuyaux Rocla',
      'Chambre de tirage',
    ],
  },
  {
    slug: 'energie-rail',
    name: 'Énergie et rail',
    intro:
      'Poteaux électriques, traverses de chemin de fer et tétrapodes pour les réseaux d’énergie, le rail et les ouvrages portuaires.',
    products: ['Poteaux électriques', 'Traverse Bibloc type SLAD', 'Tétrapodes'],
  },
  {
    slug: 'beton-sec',
    name: 'Béton sec SIBM',
    intro: 'Notre béton sec, lancé le 1er décembre 2022.',
    products: [],
    special: true,
  },
];

// Familles : les produits deviennent des objets { slug, name, family }.
for (const f of families) {
  f.products = f.products.map((name) => ({
    name,
    slug: slugify(name),
    family: f.slug,
  }));
}
export const allProducts = families.flatMap((f) => f.products);
export const familyBySlug = Object.fromEntries(families.map((f) => [f.slug, f]));
export const productBySlug = (fam, slug) =>
  familyBySlug[fam]?.products.find((p) => p.slug === slug);

// ---------------------------------------------------------------- Références
// products : texte affiché ; link : slug de produit du catalogue quand il existe.
const P = (fam, name) => ({ fam, slug: slugify(name), name });
export const references = [
  {
    slug: 'pont-de-serebou-bassawa',
    name: 'Pont de Serebou/Bassawa',
    place: 'Serebou / Bassawa',
    products: [
      P('hydraulique-assainissement', 'Dalot cadre fermé'),
      P('hydraulique-assainissement', 'Caniveaux'),
      P('voirie-pavage', 'Bordure T2'),
    ],
    labels: ['Dalots', 'Caniveaux', 'Bordures'],
  },
  {
    slug: 'pont-de-jacqueville',
    name: 'Pont de Jacqueville',
    place: 'Jacqueville',
    labels: ['Dalots', 'Caniveaux', 'Bordures', 'Tuyaux vibrés armés'],
    products: [
      P('hydraulique-assainissement', 'Dalot cadre fermé'),
      P('hydraulique-assainissement', 'Caniveaux'),
      P('voirie-pavage', 'Bordure T2'),
      P('hydraulique-assainissement', 'Tuyaux vibrés armés'),
    ],
  },
  {
    slug: 'pont-de-bouafle',
    name: 'Pont de Bouaflé',
    place: 'Bouaflé',
    labels: ['Dalots', 'Caniveaux', 'Bordures', 'Pavés', 'Agglomérés'],
    products: [
      P('hydraulique-assainissement', 'Dalot cadre fermé'),
      P('hydraulique-assainissement', 'Caniveaux'),
      P('voirie-pavage', 'Bordure T2'),
      P('voirie-pavage', 'Pavé en béton'),
      P('maconnerie-murs', 'Agglos (15 creux, plein)'),
    ],
  },
  {
    slug: 'pont-henri-konan-bedie',
    name: 'Pont Henri Konan Bédié',
    place: 'Abidjan',
    labels: ['Panneaux préfabriqués', 'Dalots', 'Caniveaux', 'Bordures', 'Tuyaux'],
    products: [
      P('maconnerie-murs', 'Panneaux muraux'),
      P('hydraulique-assainissement', 'Dalot cadre fermé'),
      P('hydraulique-assainissement', 'Caniveaux'),
      P('voirie-pavage', 'Bordure T2'),
      P('hydraulique-assainissement', 'Tuyaux vibrés armés'),
    ],
  },
  {
    slug: 'troncon-singrobo-yamoussoukro',
    name: 'Tronçon Singrobo-Yamoussoukro',
    place: 'Singrobo – Yamoussoukro',
    labels: [],
    products: [],
  },
  {
    slug: 'voirie-urbaine-de-korhogo',
    name: 'Voirie urbaine de Korhogo',
    place: 'Korhogo',
    labels: [],
    products: [],
  },
  {
    slug: 'basilique-notre-dame-de-la-paix',
    name: 'Basilique Notre-Dame de la Paix de Yamoussoukro',
    place: 'Yamoussoukro',
    labels: ['Regards', 'Caniveaux', 'Caillebotis', 'Bordures'],
    products: [
      P('hydraulique-assainissement', 'Caniveaux'),
      P('voirie-pavage', 'Bordure T2'),
    ],
  },
  {
    slug: 'tours-administratives-abidjan-plateau',
    name: 'Tours administratives d’Abidjan-Plateau',
    place: 'Abidjan-Plateau',
    labels: ['Séridalles', 'Poutrelles précontraintes'],
    products: [],
  },
  {
    slug: 'stade-felix-houphouet-boigny',
    name: 'Stade Félix Houphouët-Boigny',
    place: 'Abidjan',
    labels: ['Séridalles', 'Planchers poutrelles-hourdis', 'Tuyaux', 'Regards'],
    products: [
      P('structure-planchers', 'Hourdis et nervures'),
      P('hydraulique-assainissement', 'Tuyaux vibrés armés'),
    ],
  },
];

// Retour client : résumé factuel donné par le brief, PAS une citation. À remplacer par la citation
// validée par chaque client (voir CONTENT_TODO.md).
export const testimonials = [
  {
    client: 'SITARAIL',
    text: 'Qualité et efficacité des traverses de chemin de fer SIBM.',
    product: P('energie-rail', 'Traverse Bibloc type SLAD'),
  },
  {
    client: 'Bouygues Energies & Services',
    text: 'Un accès facile à un béton de qualité.',
  },
  {
    client: 'CIE',
    text: 'Entièrement satisfaite, en particulier de la gamme de poteaux électriques.',
    product: P('energie-rail', 'Poteaux électriques'),
  },
];

export const clients = [
  'Bouygues',
  'ST',
  'SAPH',
  'EHDS',
  'Franzetti',
  'SITARAIL',
  'SOGB',
  'ABRI',
  'Colas',
  'CIE',
];

// ---------------------------------------------------------------- Actualités
const N = (date, title, category) => ({ date, title, category, slug: slugify(title) });
export const news = [
  N('2022-12-01', 'Lancement du Béton sec SIBM', 'Produit'),
  N('2020-11-27', 'SIBM, acteur incontournable de l’assainissement urbain', 'Entreprise'),
  N('2020-10-22', 'Assemblée générale du GIBTP', 'Événement'),
  N('2020-06-24', 'Visite de RAZEL CI', 'Visite'),
  N('2018-07-30', 'Visite d’une délégation de la Banque mondiale et de la SFI', 'Visite'),
  N('2018-07-30', 'Séminaire à Yamoussoukro', 'Événement'),
  N('2018-07-23', 'Archibat 2017', 'Événement'),
  N('2018-07-19', 'Visite d’inspection Bouygues-Colas (QSHE, site PK23)', 'Visite'),
  N('2015-03-15', 'Archibat 2013', 'Événement'),
  N('2015-03-15', 'Cérémonie de décoration du personnel', 'Entreprise'),
].sort((a, b) => b.date.localeCompare(a.date));

// Direction : composant masqué derrière un drapeau (noms non validés).
export const SHOW_LEADERSHIP = false;
export const leadership = [
  { name: 'Noël Goué', role: 'Directeur du développement technique et de l’innovation' },
  { name: 'Franck Effi', role: 'Secrétaire général' },
  { name: 'Marius Abbé', role: 'Directeur industriel' },
  { name: 'Francis Priout', role: 'Directeur du patrimoine' },
  { name: 'Judicaël Yapo', role: 'Directeur QSHE' },
];

// Offres d’emploi : liste vide tant que SIBM n’en fournit pas.
export const positions = [];

// Redirections 301 : ancienne URL -> nouvelle URL.
export const redirectMap = [
  ['/index.php/pages/index/0/fr', '/'],
  ['/index.php/pages/index/1/fr', '/presentation'],
  ['/index.php/pages/index/2/fr', '/produits'],
  ['/index.php/pages/index/3/fr', '/services/bureau-d-etude'],
  ['/index.php/pages/index/4/fr', '/services/laboratoire'],
  ['/index.php/pages/index/5/fr', '/services/logistique'],
  ['/index.php/pages/index/6/fr', '/references'],
  ['/index.php/pages/index/9', '/actualites'],
  ['/index.php/pages/index/10/fr', '/galerie'],
  ['/index.php/pages/index/11/fr', '/contact'],
  ['/index.php/pages/index/12/fr', '/reclamation'],
];
