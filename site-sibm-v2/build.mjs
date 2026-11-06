#!/usr/bin/env node
// Générateur statique du site SIBM v2. Sans dépendance : Node 18+.
//   node build.mjs            -> dist/
// Variables d'environnement : SITE_URL, FORM_ENDPOINT, WHATSAPP_NUMBER, PHONE_NUMBER (voir README).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from './src/data/data.mjs';
import fr from './src/i18n/fr.mjs';
import * as V from './src/data/visuals.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://www.sibmci.com').replace(/\/$/, '');
const FORM_ENDPOINT = process.env.FORM_ENDPOINT || '';
const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');
const PHONE_NUMBER = process.env.PHONE_NUMBER || D.tel(D.agencies[0].phones[0]);
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);
const BUILD_ID = Date.now().toString(36);

// Langues : français à la racine ; ajouter { en: import('./src/i18n/en.mjs') } plus tard (sortie sous /en/).
const LOCALES = { fr };

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const pages = []; // { url, html, priority }
const photoSlots = new Map(); // fichier attendu -> contexte
const todoFlags = new Set();
const fillers = []; // { what, where, replace } -> FILLER_REPORT.md
const filler = (what, where, replace) => { if (!fillers.some((f) => f.what === what && f.where === where)) fillers.push({ what, where, replace }); };

// ------------------------------------------------------------------ photos
// Si /assets/photos/<nom>.avif|webp|jpg existe, on l'utilise ; sinon un emplacement repère est rendu.
function photo(name, { ratio = '4/3', alt = '', eager = false, sizes = '(min-width:1024px) 33vw, 100vw', ctx = '' } = {}) {
  const base = path.join(SRC, 'assets', 'photos', name);
  const found = ['avif', 'webp', 'jpg'].filter((e) => fs.existsSync(`${base}.${e}`));
  if (!found.length) {
    photoSlots.set(`/assets/photos/${name}.webp`, ctx);
    return `<div class="photo slot" style="--r:${ratio}" role="img" aria-label="${esc(alt || 'Photographie à fournir')}" data-photo="/assets/photos/${esc(name)}.webp"><span><b>[À FOURNIR] Photo</b><br>${esc(name)}.webp</span></div>`;
  }
  let w = 1600, h = 900;
  const [rw, rh] = ratio.split('/').map(Number);
  h = Math.round((w * rh) / rw);
  const srcs = found
    .filter((e) => e !== 'jpg')
    .map((e) => `<source type="image/${e}" srcset="/assets/photos/${name}.${e}">`)
    .join('');
  const fallback = found.includes('jpg') ? 'jpg' : found.includes('webp') ? 'webp' : 'avif';
  return `<div class="photo" style="--r:${ratio}"><picture>${srcs}<img src="/assets/photos/${name}.${fallback}" alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" sizes="${sizes}"></picture></div>`;
}

const todo = (L) => `<span class="todo">${L.todo}</span>`;
const arrow = `<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8"/><path d="M4.5 2.5 8 6l-3.5 3.5"/></svg>`;
// Boutons du système Taste Skill (.btn--primary / .btn--secondary). Le primaire est enveloppé dans .mag (effet magnétique,
// BRIEF V2 §2.6) : c'est l'enveloppe qui bouge, jamais .btn, pour laisser la couche de survol du skill intacte.
const btn = (href, label, kind = 'primary', arr = true, attrs = '') =>
  kind === 'primary'
    ? `<span class="mag"><a class="btn btn--primary" href="${href}"${attrs}>${esc(label)}${arr ? arrow : ''}</a></span>`
    : `<a class="btn btn--secondary" href="${href}"${attrs}>${esc(label)}</a>`;
const phoneLinks = (a) =>
  a.phones.map((p) => `<a class="link" href="tel:${D.tel(p)}">${D.phone(p)}</a>`).join('<br>');
const osm = (a) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(a.map)}`;

// ------------------------------------------------------------------ layout
function layout(L, lang, p) {
  const prefix = lang === 'fr' ? '' : `/${lang}`;
  const U = (u) => (u === '/' ? prefix || '/' : prefix + u);
  const canonical = SITE_URL + U(p.url);
  const here = p.nav || '';
  const cur = (k) => (here === k ? ' aria-current="page"' : '');
  const famMenu = D.families
    .map((f) => `<a href="${U('/produits/' + f.slug)}">${esc(f.name)}</a>`)
    .join('');
  const svcMenu = [
    ['/services/bureau-d-etude', L.services.studies],
    ['/services/laboratoire', L.services.lab],
    ['/services/logistique', L.services.logistics],
  ]
    .map(([u, s]) => `<a href="${U(u)}">${esc(s.name)}<span>${esc(s.line)}</span></a>`)
    .join('');
  const ogImage = `${SITE_URL}/assets/og-default.png`;
  filler('Image Open Graph (logo officiel sur fond blanc)', 'src/assets/og-default.png', 'Visuel de partage avec photo réelle d’usine ou de chantier');
  const jsonld = p.jsonld ? `<script type="application/ld+json">${JSON.stringify(p.jsonld)}</script>` : '';
  const footFam = D.families.map((f) => `<li><a href="${U('/produits/' + f.slug)}">${esc(f.name)}</a></li>`).join('');
  const footSites = D.agencies.map((a) => `<li><a href="${U('/contact#' + a.id)}">${esc(a.name)}</a></li>`).join('');
  const hq = D.agencies[0];
  const fab = `<div class="fab">${
    WHATSAPP_NUMBER
      ? `<a href="https://wa.me/${WHATSAPP_NUMBER}" aria-label="${esc(L.whatsapp)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z"/></svg></a>`
      : ''
  }<a href="tel:${PHONE_NUMBER}" aria-label="${esc(L.callHq)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg></a></div>`;

  // Bande CTA (BRIEF V2 §2.7) : une seule par page, seule section sombre, absente des pages formulaire.
  const cta = p.cta === false ? '' : `
<section class="cta-band" aria-labelledby="cta-title"><svg class="cta-band__lines" viewBox="0 0 600 400" aria-hidden="true" preserveAspectRatio="none"><path d="M0 400 L600 0 M80 400 L600 60 M160 400 L600 120 M240 400 L600 180 M0 300 H600 M0 200 H600 M0 100 H600"/></svg>
  <div class="wrap cta-band__row">
    <div><h2 class="t-h2" id="cta-title">${L.home.quoteTitle}</h2><p>${esc(L.home.quoteLead)}</p></div>
    ${btn(U('/devis'), L.mainAction)}
  </div>
</section>`;

  return `<!doctype html>
<html lang="${lang}" data-type="product" data-radius="soft" data-buttons="solid" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="page-type" content="product">
<meta name="site-kind" content="other">
<link rel="canonical" href="${canonical}">
${p.noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="SIBM">
<meta property="og:locale" content="${L.locale}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#074914">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/besley-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/albert-sans-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=${BUILD_ID}">
<link rel="stylesheet" href="/assets/vendor/taste/motion.css?v=${BUILD_ID}">
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('fx')</script>
${jsonld}
</head>
<body data-endpoint="${esc(FORM_ENDPOINT)}" data-tel="${esc(D.phone(hq.phones[0]))}">
<!-- Taste Skill deal : kind product (site-kind other) · palette brand SIBM (#074914 / #DE251F, fond blanc) · type besley (Besley / Albert Sans) · hero product, stage = composition vectorielle (BRIEF V2) · nav-mega re-tirée en nav-split (pas de photo pour son panneau) · footer-columns · close-word · brand-band = bande CTA verte · buttons solid · radius soft -->
<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip" href="#main">${L.skip}</a>
    <a class="logo" href="${U('/')}" aria-label="SIBM, Société Ivoirienne de Béton Manufacturé, accueil"><img src="/assets/brand/sibm-logo-mark.svg" alt="" width="49" height="56"></a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-open="${L.menu}" data-close="${L.close}">${L.menu}</button>
    <nav class="nav__links" id="nav-links" aria-label="Principal">
      <div class="nav__item"><a class="nav__link m-link m-link--bare" href="${U('/presentation')}"${cur('presentation')}>${L.nav.presentation}</a></div>
      <div class="nav__item"><a class="nav__link m-link m-link--bare" href="${U('/produits')}"${cur('produits')}>${L.nav.products}</a><div class="nav__menu">${famMenu}</div></div>
      <div class="nav__item"><a class="nav__link m-link m-link--bare" href="${U('/services/bureau-d-etude')}"${cur('services')}>${L.nav.services}</a><div class="nav__menu">${svcMenu}</div></div>
      <div class="nav__item"><a class="nav__link m-link m-link--bare" href="${U('/references')}"${cur('references')}>${L.nav.references}</a></div>
      <div class="nav__item"><a class="nav__link m-link m-link--bare" href="${U('/actualites')}"${cur('actualites')}>${L.nav.news}</a></div>
      <div class="nav__item"><a class="nav__link m-link m-link--bare" href="${U('/contact')}"${cur('contact')}>${L.nav.contact}</a></div>
    </nav>
    <span class="mag nav__cta"><a class="btn btn--primary" href="${U('/devis')}">${L.mainAction}${arrow}</a></span>
  </div>
</header>
<main id="main">
${p.body}
</main>
${cta}
<footer class="foot footer">
  <div class="wrap">
    <div class="foot__grid">
      <div class="foot__brand">
        <a href="${U('/')}" aria-label="SIBM, accueil"><img src="/assets/brand/sibm-logo.svg" alt="SIBM, Société Ivoirienne de Béton Manufacturé" width="168" height="158" loading="lazy"></a>
        <p class="t-small" style="margin-top:24px"><a class="link" href="mailto:${D.company.email}">${D.company.email}</a></p>
      </div>
      <div><h3>${L.footer.catalogue}</h3><ul>${footFam}</ul></div>
      <div><h3>${L.footer.company}</h3><ul>
        <li><a href="${U('/presentation')}">${L.nav.presentation}</a></li>
        <li><a href="${U('/references')}">${L.nav.references}</a></li>
        <li><a href="${U('/actualites')}">${L.nav.news}</a></li>
        <li><a href="${U('/galerie')}">${L.nav.gallery}</a></li>
        <li><a href="${U('/qualite-securite-environnement')}">${L.footer.qse}</a></li>
        <li><a href="${U('/carrieres')}">${L.nav.careers}</a></li></ul></div>
      <div><h3>${L.footer.services}</h3><ul>
        <li><a href="${U('/services/bureau-d-etude')}">${L.services.studies.name}</a></li>
        <li><a href="${U('/services/laboratoire')}">${L.services.lab.name}</a></li>
        <li><a href="${U('/services/logistique')}">${L.services.logistics.name}</a></li>
        <li><a href="${U('/devis')}">${L.mainAction}</a></li>
        <li><a href="${U('/reclamation')}">${L.footer.complaint}</a></li></ul></div>
      <div><h3>${L.footer.sites}</h3><ul>${footSites}</ul></div>
    </div>
    <div class="foot__legal"><span>© ${YEAR} SIBM. ${L.footer.rights}</span><span>${L.footer.credits}</span><a class="link" href="${U('/mentions-legales')}">${L.footer.legal}</a></div>
  </div>
</footer>
${p.noFab ? '' : fab}
<script id="i18n-form" type="application/json">${JSON.stringify(L.form)}</script>
<script src="/assets/js/site.js?v=${BUILD_ID}" defer></script>
<script src="/assets/js/fx.js?v=${BUILD_ID}" defer></script>
<script type="module" src="/assets/vendor/taste/motion.js?v=${BUILD_ID}"></script>
</body>
</html>
`;
}

function add(lang, L, p) {
  const prefix = lang === 'fr' ? '' : `/${lang}`;
  pages.push({
    url: prefix + p.url,
    file: p.file || (p.url === '/' ? 'index.html' : p.url.replace(/^\//, '') + '.html'),
    html: layout(L, lang, { ...p, body: p.body }),
    noindex: p.noindex,
    priority: p.priority ?? 0.6,
    lang,
    prefix,
  });
}

// ------------------------------------------------------------------ fragments
const pageHead = (L, U, crumbs, h1, lead) => `
<section class="page-head"><div class="wrap">
  <nav aria-label="Fil d’Ariane"><ol class="crumbs"><li><a href="${U('/')}">${L.breadcrumb.home}</a></li>${crumbs
    .map(([u, n]) => `<li>${u ? `<a href="${U(u)}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}</li>`)
    .join('')}</ol></nav>
  <h1 class="t-h1" style="max-width:20ch">${esc(h1)}</h1>
  ${lead ? `<p class="t-lead">${esc(lead)}</p>` : ''}
</div></section>`;

const secHead = (kicker, h2, lead) =>
  `<div class="sec__head"><p class="eyebrow t-label">${esc(kicker)}</p><h2 class="t-h2" style="max-width:22ch">${esc(h2)}</h2>${lead ? `<p class="t-lead">${esc(lead)}</p>` : ''}</div>`;

const familyCard = (L, U, f) => {
  const names = f.special ? L.home.featuredLead : f.products.slice(0, 3).map((x) => x.name).join(', ');
  const hasPhoto = ['avif', 'webp', 'jpg'].some((e) => fs.existsSync(path.join(SRC, 'assets', 'photos', 'familles', `${f.slug}.${e}`)));
  return `<a class="card tilt" href="${U('/produits/' + f.slug)}"><span class="tilt__in">
    ${hasPhoto ? photo('familles/' + f.slug, { ratio: '4/3', ctx: 'Famille : ' + f.name, alt: f.name }) : `<div class="bp-frame">${V.blueprints[f.slug]}</div>`}</span>
    <h3 class="card__title">${esc(f.name)}</h3>
    <p class="card__list">${esc(names)}</p>
    <span class="card__meta">${f.special ? L.home.featuredCta : L.products.count(f.products.length)}</span>
  </a>`;
};

const newsCard = (L, U, n) => `<a class="card" href="${U('/actualites/' + n.slug)}">
    ${photo('actualites/' + n.slug, { ratio: '3/2', ctx: 'Actualité : ' + n.title, alt: n.title })}
    <p class="t-label muted">${fmtDate(n.date)} · ${esc(n.category)}</p>
    <h3 class="card__title">${esc(n.title)}</h3>
  </a>`;

const agencyBlock = (L, a, h = 'h3') => `<li id="${a.id}" class="rows--item"><div class="split" style="gap:16px">
    <div class="l"><${h} class="t-h3">${esc(a.name)}</${h}><p class="muted t-small">${esc(a.role)}</p></div>
    <div class="r"><p>${a.lines.map(esc).join('<br>')}</p><p style="margin-top:12px">${phoneLinks(a)}</p>
    <p style="margin-top:12px"><a class="link" href="${osm(a)}" rel="noopener" target="_blank">${L.directions}</a></p></div>
  </div></li>`;


// ------------------------------------------------------------------ accueil
const famBlueprint = (f) => `<div class="bp-frame">${V.blueprints[f.slug]}</div>`;

function homeBody(L, U) {
  filler('Composition architecturale vectorielle du hero (trames, éléments préfabriqués)', 'Accueil, hero', 'Vidéo src/assets/video/hero.mp4 (muette, en boucle) ou photo réelle src/assets/photos/accueil/hero.webp');
  const heroVideo = fs.existsSync(path.join(SRC, 'assets', 'video', 'hero.mp4'));
  const heroPhoto = ['avif', 'webp', 'jpg'].find((e) => fs.existsSync(path.join(SRC, 'assets', 'photos', 'accueil', `hero.${e}`)));
  const media = heroVideo
    ? `<div class="hero__media" aria-hidden="true"><video muted loop playsinline preload="none" data-src="/assets/video/hero.mp4" poster="${heroPhoto ? `/assets/photos/accueil/hero.${heroPhoto}` : ''}"></video></div>`
    : heroPhoto
      ? `<div class="hero__media" aria-hidden="true"><div class="hero__layer" data-parallax><img class="hero__poster" src="/assets/photos/accueil/hero.${heroPhoto}" alt="" fetchpriority="high"></div></div>`
      : `<div class="hero__comp"><div class="hero__layer" data-parallax>${V.heroComposition}</div><div class="grain" aria-hidden="true"></div></div>`;

  const figures = L.home.figures
    .map((f) => `<div class="fig"><dt${f.count ? ' data-m-count' : ''}>${esc(f.v)}</dt><dd>${esc(f.l)}</dd></div>`)
    .join('');

  const fams = D.families
    .map((f, i) => {
      const list = f.special ? [L.home.featuredLead] : f.products.slice(0, 6).map((x) => x.name);
      const more = !f.special && f.products.length > 6 ? `<li>+ ${f.products.length - 6}</li>` : '';
      return `<a class="card fam" href="${U('/produits/' + f.slug)}">
        ${famBlueprint(f)}
        <ul class="fam__list" aria-hidden="true">${list.map((x) => `<li>${esc(x)}</li>`).join('')}${more}</ul>
        <div class="fam__body"><span class="fam__n">${String(i + 1).padStart(2, '0')}</span><h3 class="fam__name">${esc(f.name)}</h3><p class="fam__use" data-filler="true">${esc(D.familyUse[f.slug])}</p><span class="card__meta">${f.special ? L.home.featuredCta : L.products.count(f.products.length)}</span></div>
      </a>`;
    })
    .join('');
  filler('Plans techniques vectoriels par famille (sans cote chiffrée)', 'Accueil, familles ; index et pages familles', 'Photographies réelles des produits, src/assets/photos/familles/<famille>.webp');
  filler('Phrases d’usage par famille (data-filler)', 'Accueil, cartes familles', 'Texte validé par SIBM');

  const storyRefs = [
    ['pont-henri-konan-bedie', 'bridge'],
    ['basilique-notre-dame-de-la-paix', 'basilica'],
    ['stade-felix-houphouet-boigny', 'stadium'],
    ['tours-administratives-abidjan-plateau', 'towers'],
  ];
  const story = storyRefs
    .map(([slug, art], i) => {
      const r = D.references.find((x) => x.slug === slug);
      const ph = ['avif', 'webp', 'jpg'].find((e) => fs.existsSync(path.join(SRC, 'assets', 'photos', 'references', `${slug}.${e}`)));
      if (!ph) filler(`Tracé vectoriel de l’ouvrage : ${r.name}`, 'Accueil, références', `Photo de chantier ou de l’ouvrage, src/assets/photos/references/${slug}.webp (droits à vérifier)`);
      return `<section class="story__panel" id="story-${slug}" aria-labelledby="story-${slug}-t">
        <div class="story__art" aria-hidden="true">${ph ? `<div class="photo"><img src="/assets/photos/references/${slug}.${ph}" alt="" loading="lazy"></div>` : V.landmarks[art]}</div>
        <div class="wrap"><div class="story__text">
          ${i === 0 ? `<p class="eyebrow">03 · ${L.home.storyTitle}</p><p class="t-lead story__intro">${esc(L.home.refsLead)}</p>` : ''}
          <p class="story__n">${String(i + 1).padStart(2, '0')} / ${String(storyRefs.length).padStart(2, '0')}</p>
          <h2 class="t-h2" id="story-${slug}-t">${esc(r.name)}</h2>
          <p class="story__place">${esc(r.place)}</p>
          <div class="story__tags"><p class="t-label muted" style="margin-bottom:10px">${L.references.supplied}</p>${r.labels.map((x, k) => `<span class="tag" style="--i:${k}">${esc(x)}</span>`).join('')}</div>
          ${i === storyRefs.length - 1 ? `<p style="margin-top:24px"><a class="link" href="${U('/references')}">${L.home.refsCta}</a></p>` : ''}
        </div></div>
      </section>`;
    })
    .join('');

  // carte des sites
  const mapSites = Object.fromEntries(
    D.agencies.map((a) => [a.id, { name: a.name, role: a.role, lines: a.lines, phones: a.phones.map((x) => ({ tel: D.tel(x), label: D.phone(x) })), quote: U('/devis') + '?site=' + encodeURIComponent(a.name), map: osm(a) }])
  );
  filler('Contour schématique de la Côte d’Ivoire (tracé simplifié)', 'Accueil, carte des sites', 'Contour officiel (SVG IGN / CNTIG) si une précision cartographique est souhaitée');
  const pins = D.agencies
    .map((a, i) => {
      const [x, y] = V.project(V.sitePos[a.id]);
      const right = a.id === 'san-pedro' || a.id === 'korhogo' ? false : true;
      return `<g class="pin" data-site="${a.id}" role="button" tabindex="0" aria-pressed="${i === 0}" aria-label="${esc(a.name)} : ${esc(a.role)}" style="--i:${i}">
        <circle class="halo" cx="${x}" cy="${y}" r="10"/><circle class="c" cx="${x}" cy="${y}" r="8"/>
        <text x="${right ? x + 14 : x - 14}" y="${y + 5}" text-anchor="${right ? 'start' : 'end'}">${esc(a.name)}</text></g>`;
    })
    .join('');
  const a0 = D.agencies[0];
  const mapBlock = `<div class="map">
    <svg class="map__svg" viewBox="${V.mapViewBox}" role="group" aria-label="${esc(L.home.mapTitle)}" data-filler="true">
      <path class="map__grid" d="${Array.from({ length: 8 }, (_, i) => `M${i * 60 + 10} 0V400`).join('')}${Array.from({ length: 7 }, (_, i) => `M0 ${i * 60 + 10}H380`).join('')}"/>
      <path class="map__land" d="${V.mapOutline}"/>
      ${pins}
    </svg>
    <div class="card m-nolift agency-card" id="agency-card" tabindex="-1" aria-live="polite">
      <p class="role" data-k="role">${esc(a0.role)}</p>
      <h3 data-k="name">${esc(a0.name)}</h3>
      <p data-k="lines">${a0.lines.map(esc).join('<br>')}</p>
      <p data-k="phones">${phoneLinks(a0)}</p>
      <p><a class="link" data-k="map" href="${osm(a0)}" rel="noopener" target="_blank">${L.directions}</a></p>
      <div class="btn-row"><a class="btn btn--secondary" data-k="quote" href="${U('/devis')}?site=${encodeURIComponent(a0.name)}">${L.home.mapQuote}</a></div>
    </div>
  </div>
  <script type="application/json" id="map-data">${JSON.stringify(mapSites)}</script>`;

  const clientsList = (hidden) => `<ul class="clients"${hidden ? ' aria-hidden="true"' : ''}>${D.clients.map((c) => `<li class="client">${logo(c, hidden)}</li>`).join('')}</ul>`;

  return `
<section class="hero" aria-labelledby="hero-title">
  ${media}
  <div class="wrap hero__text">
    <p class="hero__kicker eyebrow">${esc(L.home.iso)}</p>
    <h1 class="t-h1" id="hero-title" aria-label="${esc(L.home.h1)}">${L.home.h1Lines.map((l, i) => `<span class="ln" aria-hidden="true"><span style="--i:${i}">${l}</span></span>`).join('')}</h1>
    <p class="t-lead">${esc(L.home.lead)}</p>
    <div class="btn-row">${btn(U('/devis'), L.mainAction)}${btn(U('/produits'), L.home.ctaProducts, 'secondary')}</div>
    <a class="scroll-cue m-link" href="#familles">${L.home.scroll}<i aria-hidden="true"></i></a>
  </div>
  <div class="wrap hero__foot">
    <h2 class="sr">${L.home.figuresTitle}</h2>
    <dl class="figures figures--dock">${figures}</dl>
  </div>
</section>

<section class="hscroll" id="familles" aria-labelledby="fam-title"><div class="hscroll__pin">
  <div class="wrap">${secHead('01', L.home.familiesTitle, L.home.familiesLead).replace('<h2 class="t-h2"', '<h2 class="t-h2" id="fam-title"')}</div>
  <div class="hscroll__track">${fams}</div>
  <div class="wrap"><div class="hscroll__progress" aria-hidden="true"><i></i></div></div>
</div></section>

<section class="sec sec--screens" style="--h:1"><div class="wrap">
  <div class="split">
    <div class="l">
      <p class="eyebrow">02</p>
      <h2 class="t-h2">${L.home.featuredTitle}</h2>
      <p class="t-lead" style="margin-top:24px">${esc(L.home.featuredLead)}</p>
      <div class="btn-row" style="margin-top:32px">${btn(U('/produits/beton-sec'), L.home.featuredCta, 'secondary')}</div>
    </div>
    <div class="r reveal-mask">${photo('beton-sec/accueil', { ratio: '3/2', alt: 'Béton sec SIBM', ctx: 'Béton sec SIBM (accueil)' })}</div>
  </div>
</div></section>

<div class="story">
  ${story}
</div>

<section class="sec sec--screens" style="--h:2;--hm:2" aria-labelledby="map-title"><div class="wrap">
  ${secHead('04', L.home.mapTitle, L.home.mapLead).replace('<h2 class="t-h2"', '<h2 class="t-h2" id="map-title"')}
  ${mapBlock}
  <div class="clients-block">
  <h3 class="card__title" id="clients-title" style="margin-bottom:16px">${L.home.clientsTitle}</h3>
  <div class="marquee" id="clients-marquee"><div class="marquee__track">${clientsList(false)}${clientsList(true)}</div></div>
  <button class="marquee__pause" type="button" data-marquee-pause aria-controls="clients-marquee" aria-pressed="false" data-pause="${L.home.marqueePause}" data-play="${L.home.marqueePlay}">${L.home.marqueePause}</button>
</div>

</div></section>

<section class="sec sec--screens" style="--h:1;--hm:2" aria-labelledby="news-title"><div class="wrap">
  ${secHead('05', L.home.newsTitle).replace('<h2 class="t-h2"', '<h2 class="t-h2" id="news-title"')}
  <div class="cards cards--3">${D.news.slice(0, 3).map((n) => newsCard(L, U, n)).join('')}</div>
  <div class="btn-row" style="margin-top:48px">${btn(U('/actualites'), L.home.newsCta, 'secondary')}</div>
</div></section>`;
}

// ------------------------------------------------------------------ formulaires
const field = ({ id, name, label, type = 'text', required = false, autocomplete = '', attrs = '', req1 = false }) =>
  `<div class="field"><label for="${id}">${esc(label)}${required ? '' : ''}</label>
  <input id="${id}" name="${name}" type="${type}" ${required ? 'required' : ''} ${req1 ? 'data-req="1"' : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${attrs}>
  <div class="err" role="alert"></div></div>`;
const area = ({ id, name, label, required = true, placeholder = '' }) =>
  `<div class="field"><label for="${id}">${esc(label)}</label><textarea id="${id}" name="${name}" ${required ? 'required' : ''} placeholder="${esc(placeholder)}"></textarea><div class="err" role="alert"></div></div>`;
const select = ({ id, name, label, options, required = false, first }) =>
  `<div class="field"><label for="${id}">${esc(label)}</label><select id="${id}" name="${name}" ${required ? 'required' : ''}>${
    first !== undefined ? `<option value="">${esc(first)}</option>` : ''
  }${options.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select><div class="err" role="alert"></div></div>`;
const typeRadios = (L, id) => `<div class="field"><fieldset><legend>${L.form.type}</legend><div class="radios">
  <label><input type="radio" name="type" value="Entreprise" checked> ${L.form.entreprise}</label>
  <label><input type="radio" name="type" value="Particulier"> ${L.form.particulier}</label></div></fieldset></div>`;
const honeypot = `<div class="hp" aria-hidden="true"><label>Ne pas remplir<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>`;
const formEnd = (L, label) => `${honeypot}<p class="t-small muted">${L.form.privacy}</p>
  <div><button class="btn" type="submit">${esc(label)}${arrow}</button></div>
  <div class="status" role="status" tabindex="-1"></div>`;

function quoteForm(L) {
  const f = L.form;
  return `<form class="form" data-form="devis" data-toggle-type novalidate>
  ${typeRadios(L)}
  <div data-only="entreprise">${field({ id: 'q-company', name: 'societe', label: f.company, required: true, req1: true, autocomplete: 'organization' })}</div>
  ${field({ id: 'q-name', name: 'nom', label: f.fullName, required: true, autocomplete: 'name' })}
  <div class="row row--2">
    ${field({ id: 'q-phone', name: 'telephone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel' })}
    ${field({ id: 'q-email', name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
  </div>
  <div class="row row--2">
    ${select({ id: 'q-family', name: 'famille', label: f.family, first: f.choose, options: [...D.families.map((x) => [x.slug, x.name]), ['autre', f.familyOther]] })}
    ${select({ id: 'q-project', name: 'projet', label: f.project, first: f.choose, options: f.projects.map((x) => [x, x]) })}
  </div>
  ${field({ id: 'q-city', name: 'ville', label: f.city, required: true, autocomplete: 'address-level2' })}
  <input type="hidden" name="site" id="q-site">
  <div id="produit-box" hidden>${field({ id: 'q-product', name: 'produit', label: L.quote.product, attrs: 'readonly' })}</div>
  ${area({ id: 'q-desc', name: 'description', label: f.description })}
  <div class="field"><label for="q-file">${f.attachment}</label><input id="q-file" name="piece_jointe" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"><div class="err" role="alert"></div></div>
  ${formEnd(L, L.quote.submit)}
</form>`;
}

function sheetForm(L, productName) {
  const f = L.form;
  return `<section class="sec sec--tight" aria-labelledby="sheet-title"><div class="wrap">
  <div class="sheet-form" id="fiche-technique">
    <h2 class="t-h2" id="sheet-title">${L.products.sheetTitle}</h2>
    <p class="t-lead" style="margin:16px 0 32px">${L.products.sheetLead}</p>
    <form class="form" data-form="fiche-technique" novalidate>
      <div class="row row--2">
        ${field({ id: 's-name', name: 'nom', label: f.fullName, required: true, autocomplete: 'name' })}
        ${field({ id: 's-company', name: 'societe', label: f.company, required: true, autocomplete: 'organization' })}
      </div>
      <div class="row row--2">
        ${field({ id: 's-email', name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
        ${field({ id: 's-phone', name: 'telephone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel' })}
      </div>
      ${field({ id: 's-product', name: 'produit', label: f.product, attrs: `readonly value="${esc(productName)}"` })}
      ${formEnd(L, L.products.sheetSubmit)}
    </form>
  </div>
</div></section>`;
}

function complaintForm(L) {
  const f = L.form;
  return `<form class="form" data-form="reclamation" data-toggle-type novalidate>
  ${typeRadios(L)}
  <div data-only="entreprise">
    ${field({ id: 'r-company', name: 'societe', label: f.company, required: true, req1: true, autocomplete: 'organization' })}
    ${field({ id: 'r-contact', name: 'contact', label: f.contactName, required: true, req1: true, autocomplete: 'name' })}
  </div>
  <div data-only="particulier" hidden>
    ${field({ id: 'r-name', name: 'nom', label: f.fullName, required: true, req1: true, autocomplete: 'name' })}
  </div>
  <div class="row row--2">
    ${field({ id: 'r-phone', name: 'telephone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel' })}
    ${field({ id: 'r-email', name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
  </div>
  ${area({ id: 'r-reason', name: 'motif', label: f.reason })}
  ${formEnd(L, L.complaint.submit)}
</form>`;
}

function contactForm(L) {
  const f = L.form;
  return `<form class="form" data-form="contact" novalidate>
  ${field({ id: 'c-name', name: 'nom', label: f.fullName, required: true, autocomplete: 'name' })}
  <div class="row row--2">
    ${field({ id: 'c-phone', name: 'telephone', label: f.phone, type: 'tel', autocomplete: 'tel' })}
    ${field({ id: 'c-email', name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
  </div>
  ${select({ id: 'c-agency', name: 'site', label: f.agency, first: f.agencyAny, options: D.agencies.map((a) => [a.name, a.name]) })}
  ${area({ id: 'c-msg', name: 'message', label: f.message })}
  ${formEnd(L, L.contact.submit)}
</form>`;
}

function careersForm(L) {
  const f = L.form;
  return `<form class="form" data-form="candidature" novalidate>
  ${field({ id: 'k-name', name: 'nom', label: f.fullName, required: true, autocomplete: 'name' })}
  <div class="row row--2">
    ${field({ id: 'k-email', name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
    ${field({ id: 'k-phone', name: 'telephone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel' })}
  </div>
  ${select({ id: 'k-domain', name: 'domaine', label: f.domain, required: true, first: f.choose, options: L.careers.domains.map((x) => [x, x]) })}
  <div class="field"><label for="k-cv">${f.cv}</label><input id="k-cv" name="cv" type="file" required accept=".pdf,.doc,.docx"><div class="err" role="alert"></div></div>
  ${formEnd(L, L.careers.submit)}
</form>`;
}

// ------------------------------------------------------------------ pages
function buildLang(lang, L) {
  const prefix = lang === 'fr' ? '' : `/${lang}`;
  const U = (u) => (u === '/' ? prefix || '/' : prefix + u);

  // ---------- Accueil
  const featured = D.references.slice(0, 4);
  const orgLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': SITE_URL + '/#organization',
        name: D.company.name,
        alternateName: ['SIBM', 'SABM'],
        url: SITE_URL + '/',
        foundingDate: String(D.company.founded),
        logo: { '@type': 'ImageObject', url: SITE_URL + '/assets/brand/sibm-logo.png', width: 600, height: 564 },
        image: SITE_URL + '/assets/og-default.png',
        email: D.company.email,
        areaServed: { '@type': 'Country', name: 'Côte d’Ivoire' },
        address: { '@type': 'PostalAddress', streetAddress: 'Zone 4A', addressLocality: 'Abidjan', addressCountry: 'CI' },
        telephone: D.phone(D.agencies[0].phones[0]),
        location: D.agencies.map((a) => ({ '@type': 'Place', name: `SIBM ${a.name}`, address: { '@type': 'PostalAddress', streetAddress: a.lines.join(', '), addressLocality: a.name, addressCountry: 'CI' } })),
      },
      {
        '@type': 'LocalBusiness',
        '@id': SITE_URL + '/#siege',
        name: 'SIBM Abidjan (siège)',
        parentOrganization: { '@id': SITE_URL + '/#organization' },
        url: SITE_URL + '/',
        telephone: D.phone(D.agencies[0].phones[0]),
        email: D.company.email,
        address: { '@type': 'PostalAddress', streetAddress: 'Zone 4A', addressLocality: 'Abidjan', addressCountry: 'CI' },
        areaServed: { '@type': 'Country', name: 'Côte d’Ivoire' },
      },
    ],
  };
  add(lang, L, {
    url: '/',
    nav: '',
    priority: 1,
    title: L.home.title,
    description: L.home.description,
    jsonld: orgLd,
    body: homeBody(L, U),
  });

  // ---------- Présentation
  const sitesList = D.agencies
    .map(
      (a) =>
        `<li><div class="split" style="gap:8px"><div class="l"><h3 class="t-h3">${esc(a.name)}</h3></div><div class="r"><p>${a.lines.map(esc).join('<br>')}</p></div></div></li>`
    )
    .join('');
  const leaders = D.SHOW_LEADERSHIP
    ? `<section class="sec"><div class="wrap">${secHead('04', L.presentation.leadershipTitle)}<ul class="rows">${D.leadership
        .map((m) => `<li><strong>${esc(m.name)}</strong><br><span class="muted">${esc(m.role)}</span></li>`)
        .join('')}</ul></div></section>`
    : '';
  add(lang, L, {
    url: '/presentation',
    nav: 'presentation',
    title: L.presentation.title,
    description: L.presentation.description,
    body: `${pageHead(L, U, [[null, L.nav.presentation]], L.presentation.h1, L.presentation.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">
  ${photo('presentation/usine', { ratio: '16/7', eager: true, sizes: '100vw', alt: 'Usine SIBM', ctx: 'Présentation : vue d’usine' })}
</div></section>
<section class="sec"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.presentation.historyTitle}</h2></div>
  <div class="r prose">${L.presentation.history.map((t) => `<p class="t-lead">${esc(t)}</p>`).join('')}</div></div>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <ol class="rows">${L.presentation.timeline
    .map((t) => `<li><div class="split" style="gap:8px"><div class="l"><p class="t-h3">${t.y}</p></div><div class="r"><p>${esc(t.t)}</p></div></div></li>`)
    .join('')}</ol>
</div></section>
<section class="sec"><div class="wrap">
  ${secHead('02', L.presentation.sitesTitle, L.presentation.sitesLead)}
  <ul class="rows">${sitesList}</ul>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.presentation.qseTitle}</h2><p class="t-lead" style="margin-top:20px">${L.presentation.qseText}</p></div>
  <div class="r"><p>${btn(U('/qualite-securite-environnement'), L.presentation.qseCta, 'secondary')}</p></div></div>
</div></section>
${leaders}`,
  });

  // ---------- Produits : index
  add(lang, L, {
    url: '/produits',
    nav: 'produits',
    title: L.products.title,
    description: L.products.description,
    body: `${pageHead(L, U, [[null, L.nav.products]], L.products.h1, L.products.lead)}
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="sr">${L.products.h1}</h2><div class="cards cards--3">${D.families.map((f) => familyCard(L, U, f)).join('')}</div></div></section>`,
  });

  // ---------- Produits : familles et fiches
  for (const f of D.families) {
    if (f.special) {
      // Addendum : « Caractéristiques » et « Avantages » restent en texte marketing, signalés [À FOURNIR].
      const block = (title, n) => `<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="l"><h2 class="t-h2">${title}</h2></div><div class="r">
        <ul class="rows">${Array.from({ length: n }, () => `<li>${todo(L)} <span class="muted t-small">${L.products.dryMarketing}</span></li>`).join('')}</ul></div></div></div></section>`;
      add(lang, L, {
        url: '/produits/' + f.slug,
        nav: 'produits',
        title: 'Béton sec SIBM : caractéristiques et avantages',
        description: 'Le Béton sec SIBM, lancé le 1er décembre 2022. Caractéristiques, avantages, fiche technique et demande de devis.',
        jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: 'Béton sec SIBM', category: 'Béton sec', brand: { '@type': 'Brand', name: 'SIBM' }, manufacturer: { '@id': SITE_URL + '/#organization' } },
        body: `${pageHead(L, U, [['/produits', L.nav.products], [null, f.name]], L.products.dryTitle, L.products.dryLead)}
<section class="sec" style="padding-top:0"><div class="wrap"><div class="product">
  <div class="l reveal-mask">${photo('beton-sec/produit', { ratio: '4/3', eager: true, sizes: '(min-width:900px) 60vw, 100vw', alt: 'Béton sec SIBM', ctx: 'Béton sec SIBM : produit' })}</div>
  <div class="r"><div class="aside-box"><p class="t-label muted">${L.products.family}</p><p class="t-h3">${f.name}</p>
    <p class="usage" data-filler="true">${esc(D.familyUse[f.slug])}</p>
    ${btn('#fiche-technique', L.products.sheetAsk, 'primary', true, ' data-open-sheet')}
    ${btn(U('/devis') + '?famille=' + f.slug + '&nom=' + encodeURIComponent(f.name), L.products.quoteProduct, 'secondary')}</div></div>
</div></div></section>
${block(L.products.dryFeatures, 4)}
${block(L.products.dryAdvantages, 4)}
${sheetForm(L, f.name)}`,
      });
      filler('Phrase d’usage du Béton sec (data-filler)', '/produits/beton-sec', 'Texte marketing validé par SIBM');
      continue;
    }

    add(lang, L, {
      url: '/produits/' + f.slug,
      nav: 'produits',
      title: `${f.name} : produits en béton préfabriqué`,
      description: f.intro,
      body: `${pageHead(L, U, [['/produits', L.nav.products], [null, f.name]], f.name, f.intro)}
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="sr">${f.name}</h2><div class="cards cards--3">${f.products
        .map(
          (p) => `<a class="card" href="${U(`/produits/${f.slug}/${p.slug}`)}">${photo(`produits/${p.slug}`, { ratio: '4/3', alt: p.name, ctx: `Produit : ${p.name}` })}<h3 class="card__title">${esc(p.name)}</h3><span class="card__meta">${L.products.sheet}</span></a>`
        )
        .join('')}</div></div></section>`,
    });

    for (const p of f.products) {
      const usedOn = D.references.filter((r) => r.products.some((x) => x.slug === p.slug));
      const sibling = f.products.filter((x) => x.slug !== p.slug).slice(0, 3);
      add(lang, L, {
        url: `/produits/${f.slug}/${p.slug}`,
        nav: 'produits',
        title: `${p.name} : ${f.name} | SIBM`,
        description: `${p.name}, produit en béton préfabriqué SIBM (${f.name}) : usages, ouvrages de référence, fiche technique sur demande.`,
        jsonld: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          category: f.name,
          brand: { '@type': 'Brand', name: 'SIBM' },
          manufacturer: { '@id': SITE_URL + '/#organization' },
        },
        // Addendum : nom, famille, photo, usage, ouvrages de référence, bouton fiche technique. Aucune donnée technique.
        body: `${pageHead(L, U, [['/produits', L.nav.products], [`/produits/${f.slug}`, f.name], [null, p.name]], p.name, null)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="product">
    <div class="l reveal-mask">${photo(`produits/${p.slug}`, { ratio: '4/3', eager: true, sizes: '(min-width:900px) 60vw, 100vw', alt: p.name, ctx: `Produit : ${p.name}` })}</div>
    <div class="r"><div class="aside-box">
      <p class="t-label muted">${L.products.family}</p><p class="t-h3"><a class="link" href="${U('/produits/' + f.slug)}">${esc(f.name)}</a></p>
      <p class="usage" data-filler="true">${esc(D.usage[p.slug])}</p>
      ${btn('#fiche-technique', L.products.sheetAsk, 'primary', true, ' data-open-sheet')}
      ${btn(U('/devis') + `?famille=${f.slug}&nom=${encodeURIComponent(p.name)}`, L.products.quoteProduct, 'secondary')}
    </div></div>
  </div>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${usedOn.length ? L.products.usedOn : L.products.noRefs}</h2></div>
  <div class="r">${usedOn.length ? `<ul class="rows rows--tight ref-links">${usedOn.map((r) => `<li><a class="link" href="${U('/references#' + r.slug)}">${esc(r.name)}</a><span class="muted t-small">${esc(r.place)}</span></li>`).join('')}</ul>` : `<p>${todo(L)} <span class="muted t-small">${L.products.refsTodo}</span></p>`}</div></div>
</div></section>
${sheetForm(L, p.name)}
<section class="sec"><div class="wrap">
  <h2 class="t-h3" style="margin-bottom:32px">${L.products.sameFamily}</h2>
  <div class="cards cards--3">${sibling
    .map((s) => `<a class="card" href="${U(`/produits/${f.slug}/${s.slug}`)}">${photo(`produits/${s.slug}`, { ratio: '4/3', alt: s.name, ctx: `Produit : ${s.name}` })}<h3 class="card__title">${esc(s.name)}</h3><p class="card__list" data-filler="true">${esc(D.usage[s.slug])}</p></a>`)
    .join('')}</div>
</div></section>`,
      });
      if (!usedOn.length) todoFlags.add(`Ouvrages de référence où « ${p.name} » a été livré`);
    }
  }
  filler('Phrases d’usage par produit (31 fiches, data-filler)', 'Pages produit, cartes « même famille »', 'Texte d’usage validé par SIBM, sans donnée technique');

  // ---------- Services
  const servicePage = (slug, key, svcKey, withPoints, extra = '') => {
    const S = L[key];
    add(lang, L, {
      url: '/services/' + slug,
      nav: 'services',
      title: S.title,
      description: S.description,
      body: `${pageHead(L, U, [[null, L.nav.services], [null, L.services[svcKey].name]], S.h1, S.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">${photo(`services/${slug}`, { ratio: '16/7', eager: true, sizes: '100vw', alt: S.h1, ctx: 'Service : ' + S.h1 })}</div></section>
<section class="sec"><div class="wrap"><ul class="rows">${withPoints(S)
        .map((x) => `<li><div class="split" style="gap:8px"><div class="l"><h2 class="t-h3">${esc(x.t)}</h2></div><div class="r"><p class="t-lead">${esc(x.d)}</p></div></div></li>`)
        .join('')}</ul>
  ${extra}
  <p style="margin-top:48px">${btn(U(key === 'lab' ? '/contact' : '/devis'), S.cta)}</p></div></section>`,
    });
  };
  servicePage('bureau-d-etude', 'studies', 'studies', (S) => S.points);
  servicePage('laboratoire', 'lab', 'lab', (S) => S.tests);
  servicePage('logistique', 'logistics', 'logistics', (S) => S.points, `<div class="split" style="margin-top:64px"><div class="l"><h2 class="t-h2">${L.logistics.orderTitle}</h2></div><div class="r"><p class="t-lead">${L.logistics.orderText}</p><p style="margin-top:24px">${btn(U('/contact'), L.logistics.contactCta, 'secondary')}</p></div></div>`);

  // ---------- Références
  add(lang, L, {
    url: '/references',
    nav: 'references',
    title: L.references.title,
    description: L.references.description,
    body: `${pageHead(L, U, [[null, L.nav.references]], L.references.h1, L.references.lead)}
<section class="sec" style="padding-top:0"><div class="wrap"><ul class="rows">${D.references
      .map(
        (r) => `<li id="${r.slug}"><div class="split">
        <div class="l">${photo('references/' + r.slug, { ratio: '3/2', alt: r.name, ctx: 'Référence : ' + r.name })}</div>
        <div class="r ref"><h2 class="t-h3">${esc(r.name)}</h2>
          <dl><dt>${L.references.fields.place}</dt><dd>${esc(r.place)}</dd><dt>${L.references.fields.year}</dt><dd>${todo(L)}</dd><dt>${L.references.fields.client}</dt><dd>${todo(L)}</dd></dl>
          ${r.labels.length ? `<div><p class="t-label muted" style="margin-bottom:8px">${L.references.supplied}</p><p>${r.labels.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</p></div>` : `<p>${L.references.supplied} : ${todo(L)}</p>`}
        </div></div></li>`
      )
      .join('')}</ul></div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.references.feedbackTitle}</h2></div><div class="r"><p>${todo(L)} <span class="muted t-small">${L.references.feedbackTodo}</span></p></div></div>
</div></section>
<section class="sec sec--tight"><div class="wrap"><h2 class="t-h3" style="margin-bottom:32px">${L.references.clientsTitle}</h2><ul class="clients">${D.clients.map((c) => `<li class="client">${logo(c)}</li>`).join('')}</ul></div></section>`,
  });

  // ---------- Actualités
  add(lang, L, {
    url: '/actualites',
    nav: 'actualites',
    title: L.news.title,
    description: L.news.description,
    body: `${pageHead(L, U, [[null, L.nav.news]], L.news.h1, L.news.lead)}
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="sr">${L.news.h1}</h2><div class="cards cards--3">${D.news.map((n) => newsCard(L, U, n)).join('')}</div></div></section>`,
  });
  for (const n of D.news) {
    add(lang, L, {
      url: '/actualites/' + n.slug,
      nav: 'actualites',
      title: `${n.title} | SIBM`,
      description: `${n.title}. Actualité SIBM du ${fmtDate(n.date)}.`,
      body: `${pageHead(L, U, [['/actualites', L.nav.news], [null, n.title]], n.title, null)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <p class="t-label muted" style="margin-bottom:24px"><time datetime="${n.date}">${fmtDate(n.date)}</time> · ${L.news.category} : ${esc(n.category)}</p>
  ${photo('actualites/' + n.slug, { ratio: '16/7', eager: true, sizes: '100vw', alt: n.title, ctx: 'Actualité : ' + n.title })}
  <div class="split" style="margin-top:48px"><div class="l"></div><div class="r prose"><p>${todo(L)} ${L.news.bodyTodo}</p></div></div>
  <p style="margin-top:48px"><a class="link" href="${U('/actualites')}">${L.news.back}</a></p>
</div></section>`,
    });
  }

  // ---------- Galerie
  add(lang, L, {
    url: '/galerie',
    nav: '',
    title: L.gallery.title,
    description: L.gallery.description,
    body: `${pageHead(L, U, [[null, L.nav.gallery]], L.gallery.h1, L.gallery.lead)}
${L.gallery.groups
  .map(
    (g, i) => `<section class="sec sec--tight" style="padding-top:0"><div class="wrap"><h2 class="t-h3" style="margin-bottom:24px">${g}</h2>
    <div class="cards cards--3">${[1, 2, 3].map((k) => photo(`galerie/${D.slugify(g)}-${k}`, { ratio: '4/3', alt: `${g}, photographie ${k}`, ctx: `Galerie : ${g} ${k}` })).join('')}</div></div></section>`
  )
  .join('')}`,
  });

  // ---------- Contact
  add(lang, L, {
    url: '/contact',
    nav: 'contact',
    title: L.contact.title,
    description: L.contact.description,
    body: `${pageHead(L, U, [[null, L.nav.contact]], L.contact.h1, L.contact.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <p class="t-lead" style="margin-bottom:32px">${L.contact.emailLabel} : <a class="link" href="mailto:${D.company.email}">${D.company.email}</a></p>
  <ul class="rows">${D.agencies.map((a) => agencyBlock(L, a, 'h2')).join('')}</ul>
</div></section>
<section class="sec"><div class="wrap"><h2 class="t-h2" style="margin-bottom:48px">${L.contact.formTitle}</h2>${contactForm(L)}</div></section>`,
  });

  // ---------- Réclamation
  add(lang, L, {
    url: '/reclamation',
    nav: '',
    title: L.complaint.title,
    description: L.complaint.description,
    body: `${pageHead(L, U, [[null, L.complaint.title]], L.complaint.h1, L.complaint.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">${complaintForm(L)}</div></section>`,
  });

  // ---------- Devis
  add(lang, L, {
    url: '/devis',
    nav: '',
    cta: false,
    priority: 0.9,
    title: L.quote.title + ' | SIBM',
    description: L.quote.description,
    body: `${pageHead(L, U, [[null, L.quote.title]], L.quote.h1, L.quote.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">${quoteForm(L)}</div></section>`,
  });

  // ---------- QSE
  add(lang, L, {
    url: '/qualite-securite-environnement',
    nav: '',
    title: L.qse.title + ' | SIBM',
    description: L.qse.description,
    body: `${pageHead(L, U, [[null, L.qse.h1]], L.qse.h1, L.qse.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.qse.isoTitle}</h2><p class="t-lead" style="margin-top:24px">${esc(L.qse.isoText)}</p></div>
  <div class="r">${photo('qse/certificat-iso-9001', { ratio: '4/3', alt: 'Certificat ISO 9001 version 2015', ctx: 'Certificat ISO 9001 (2015)' })}</div></div>
</div></section>
${L.qse.sections
  .map(
    (s) => `<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="l"><h2 class="t-h2">${s.t}</h2></div><div class="r"><p>${todo(L)}</p></div></div></div></section>`
  )
  .join('')}`,
  });

  // ---------- Carrières
  add(lang, L, {
    url: '/carrieres',
    nav: '',
    title: L.careers.title,
    description: L.careers.description,
    body: `${pageHead(L, U, [[null, L.nav.careers]], L.careers.h1, L.careers.lead)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <h2 class="t-h2" style="margin-bottom:32px">${L.careers.positionsTitle}</h2>
  ${D.positions.length ? `<ul class="rows">${D.positions.map((j) => `<li><h3 class="t-h3">${esc(j.title)}</h3><p class="muted">${esc(j.site)} · ${esc(j.contract)}</p></li>`).join('')}</ul>` : `<p class="t-lead">${L.careers.positionsEmpty}</p>`}
</div></section>
<section class="sec"><div class="wrap"><h2 class="t-h2" style="margin-bottom:48px">${L.careers.formTitle}</h2>${careersForm(L)}</div></section>`,
  });

  // ---------- Mentions légales
  add(lang, L, {
    url: '/mentions-legales',
    nav: '',
    title: L.legal.title + ' | SIBM',
    description: L.legal.description,
    noindex: true,
    body: `${pageHead(L, U, [[null, L.legal.h1]], L.legal.h1, null)}
<section class="sec" style="padding-top:0"><div class="wrap"><table class="spec"><tbody>${L.legal.rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v.includes('[À FOURNIR]') || v.includes('[Politique') ? v.replace(/\[[^\]]+\]/g, (m) => `<span class="todo">${m}</span>`) : esc(v)}</td></tr>`).join('')}</tbody></table></div></section>`,
  });

  // ---------- 404
  pages.push({
    url: '/404',
    file: '404.html',
    lang,
    prefix,
    noindex: true,
    skipSitemap: true,
    html: layout(L, lang, {
      url: '/404',
      title: L.notFound.title + ' | SIBM',
      description: L.notFound.lead,
      noindex: true,
      body: `${pageHead(L, U, [[null, L.notFound.h1]], L.notFound.h1, L.notFound.lead)}<section class="sec" style="padding-top:0"><div class="wrap"><div class="btn-row">${btn(U('/'), L.breadcrumb.home)}${btn(U('/produits'), L.nav.products, 'secondary')}</div></div></section>`,
    }),
  });
}

// Logo client (addendum) : fichier /assets/logos/<slug>.svg|png|webp|jpg si présent, sinon le nom en texte.
// Niveaux de gris + opacité .6, couleur au survol/focus (300 ms) et à l'entrée dans l'écran sur tactile (fx.js).
// mix-blend-mode: multiply retire le fond blanc des JPG. Le logo SIBM n'est jamais filtré.
const logoInfo = new Map();
function logo(name, decorative = false) {
  const s = D.slugify(name);
  for (const e of ['svg', 'png', 'webp', 'jpg']) {
    const f = path.join(SRC, 'assets', 'logos', `${s}.${e}`);
    if (fs.existsSync(f)) {
      if (e !== 'svg') {
        const w = imgWidth(f);
        logoInfo.set(name, { file: `${s}.${e}`, width: w });
      }
      return `<img src="/assets/logos/${s}.${e}" alt="${decorative ? '' : esc(name)}" height="40" loading="lazy">`;
    }
  }
  todoFlags.add(`Logo client autorisé : ${name} (src/assets/logos/${s}.svg ou .png)`);
  logoInfo.set(name, { file: null });
  return `<span class="client__name">${esc(name)}</span>`;
}
// largeur d'un PNG/JPG/WebP lue dans l'en-tête (sans dépendance)
function imgWidth(f) {
  const b = fs.readFileSync(f);
  if (b.readUInt32BE(0) === 0x89504e47) return b.readUInt32BE(16);
  if (b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return 1 + b.readUIntLE(24, 3);
    if (t === 'VP8L') return 1 + (b.readUInt16LE(21) & 0x3fff);
    return b.readUInt16LE(26) & 0x3fff;
  }
  for (let i = 2; i < b.length; ) { // JPEG : marqueur SOF
    if (b[i] !== 0xff) return 0;
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return b.readUInt16BE(i + 7);
    i += 2 + len;
  }
  return 0;
}

// ------------------------------------------------------------------ build
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const [lang, L] of Object.entries(LOCALES)) buildLang(lang, L);

for (const p of pages) {
  const f = path.join(OUT, p.lang === 'fr' ? '' : p.lang, p.file);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, p.html);
}
fs.cpSync(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });
for (const junk of ['.gitkeep']) for (const d of ['photos', 'logos', 'docs']) fs.rmSync(path.join(OUT, 'assets', d, junk), { force: true });

// sitemap + robots
const sm = pages.filter((p) => !p.noindex && !p.skipSitemap);
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sm
    .map((p) => `  <url><loc>${SITE_URL}${p.url === '/' ? '/' : p.url}</loc><lastmod>${TODAY}</lastmod><priority>${p.priority}</priority></url>`)
    .join('\n')}\n</urlset>\n`
);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// redirections 301
const nginx = `# Redirections 301 de l'ancien site SIBM vers le nouveau.\n# À inclure dans le bloc server { } : include /chemin/redirects.nginx.conf;\n${D.redirectMap
  .flatMap(([from, to]) => {
    const variants = [from, from.replace(/\/fr$/, '')].filter((v, i, a) => a.indexOf(v) === i);
    return variants.map((v) => `location = ${v} { return 301 ${to}; }`);
  })
  .join('\n')}\n`;
const netlify = D.redirectMap
  .flatMap(([from, to]) => {
    const variants = [from, from.replace(/\/fr$/, '')].filter((v, i, a) => a.indexOf(v) === i);
    return variants.map((v) => `${v}  ${to}  301!`);
  })
  .join('\n') + '\n';
fs.writeFileSync(path.join(OUT, 'redirects.nginx.conf'), nginx);
fs.writeFileSync(path.join(OUT, '_redirects'), netlify);
fs.writeFileSync(
  path.join(OUT, '_headers'),
  `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`
);
fs.copyFileSync(path.join(OUT, 'redirects.nginx.conf'), path.join(ROOT, 'redirects.nginx.conf'));
fs.copyFileSync(path.join(OUT, '_redirects'), path.join(ROOT, '_redirects'));

// manifeste des photos à fournir
const slots = [...photoSlots.entries()].sort();
fs.writeFileSync(
  path.join(ROOT, 'PHOTOS_MANIFEST.md'),
  `# Photos à fournir\n\nGénéré par \`node build.mjs\` (${TODAY}). Déposer chaque fichier dans \`src/assets/photos/\` (AVIF, WebP ou JPG) puis relancer le build : l'emplacement est remplacé automatiquement.\n\n| Fichier attendu | Usage |\n|---|---|\n${slots.map(([f, c]) => `| \`${f.replace('/assets/photos/', '')}\` | ${c} |`).join('\n')}\n\n${slots.length} emplacements.\n`
);
// rapport de remplissage (BRIEF V2 §3 et addendum)
const lowLogos = [...logoInfo.entries()].filter(([, v]) => v.file && v.width && v.width < 300);
const photosDir = path.join(SRC, 'assets', 'photos');
const lowPhotos = [];
const walk = (d) => fs.existsSync(d) && fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const f = path.join(d, e.name);
  if (e.isDirectory()) return walk(f);
  if (/\.(jpe?g|png|webp)$/i.test(e.name)) { const w = imgWidth(f); if (w && w < 1200) lowPhotos.push([path.relative(photosDir, f), w]); }
});
walk(photosDir);
fs.writeFileSync(
  path.join(ROOT, 'FILLER_REPORT.md'),
  `# Rapport de remplissage\n\nGénéré par \`node build.mjs\` (${TODAY}). Tout élément listé ici est provisoire : il est visuellement remplaçable et ne se présente jamais comme une photo, un chiffre ou une citation SIBM. Dans le code, le remplissage textuel et vectoriel porte \`data-filler="true"\`.\n\n## Éléments de remplissage\n\n| Élément | Où | Contenu réel qui le remplace |\n|---|---|---|\n${fillers.map((f) => `| ${f.what} | ${f.where} | ${f.replace} |`).join('\n')}\n\n## Emplacements photo [À FOURNIR]\n\n${slots.length} emplacements, détaillés dans \`PHOTOS_MANIFEST.md\`. Images de l’ancien site (\`assets/photos/\`, \`assets/clients/\`) : **non fournies dans le dépôt** et sibmci.com inaccessible depuis l’environnement de génération ; à déposer dans \`src/assets/photos/\` puis relancer le build.\n\n## Photos en basse résolution (moins de 1200 px de large)\n\n${lowPhotos.length ? lowPhotos.map(([f, w]) => `- \`${f}\` : ${w} px`).join('\n') : 'Aucune photo présente pour l’instant.'}\n\n## Logos clients\n\nAffichés en niveaux de gris (opacité .6), couleur au survol, au focus et, sur écran tactile, à l’entrée dans l’écran. ${[...logoInfo.values()].filter((v) => !v.file).length} logos sur ${D.clients.length} sont absents et remplacés par le nom en texte : ${[...logoInfo.entries()].filter(([, v]) => !v.file).map(([n]) => n).join(', ')}. Ne publier que les logos autorisés par chaque client.\n\nLogos de moins de 300 px de large : ${lowLogos.length ? lowLogos.map(([n, v]) => `${n} (${v.width} px)`).join(', ') : 'aucun fichier présent pour l’instant'}.\n\n## Contenus interdits en remplissage, laissés [À FOURNIR]\n\nDimensions, poids, classes de charge, normes, formulations, conditionnement, prix ; numéro de certificat, organisme certificateur, RCCM, forme juridique, capital, directeur de la publication, effectif ; témoignages, logos clients non autorisés, distinctions, années et maîtres d’ouvrage des références, personnes nommées. Liste détaillée : \`CONTENT_TODO.md\` et marques [À FOURNIR] sur les pages.\n\n## À vérifier par SIBM\n\n- « Premier fabricant de béton manufacturé certifié ISO 9001 (2015) en Côte d’Ivoire » : repris de l’ancien site. À confirmer qu’il est bien publié par SIBM, sinon le retirer (BRIEF V2 §3).\n- « Plus de 30 ans d’expérience » (bureau d’étude) : repris de l’ancien site.\n`
);
console.log(`OK : ${pages.length} pages, ${slots.length} emplacements photo vides -> ${path.relative(process.cwd(), OUT) || OUT}`);
