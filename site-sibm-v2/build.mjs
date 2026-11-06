#!/usr/bin/env node
// Générateur statique du site SIBM v2. Sans dépendance : Node 18+.
//   node build.mjs            -> dist/
// Variables d'environnement : SITE_URL, FORM_ENDPOINT, WHATSAPP_NUMBER, PHONE_NUMBER (voir README).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from './src/data/data.mjs';
import fr from './src/i18n/fr.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://www.sibmci.com').replace(/\/$/, '');
const FORM_ENDPOINT = process.env.FORM_ENDPOINT || '';
const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER || '').replace(/[^\d]/g, '');
const PHONE_NUMBER = process.env.PHONE_NUMBER || D.tel(D.agencies[0].phones[0]);
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);

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

// ------------------------------------------------------------------ photos
// Si /assets/photos/<nom>.avif|webp|jpg existe, on l'utilise ; sinon un emplacement repère est rendu.
function photo(name, { ratio = '4/3', alt = '', eager = false, sizes = '(min-width:1024px) 33vw, 100vw', ctx = '' } = {}) {
  const base = path.join(SRC, 'assets', 'photos', name);
  const found = ['avif', 'webp', 'jpg'].filter((e) => fs.existsSync(`${base}.${e}`));
  if (!found.length) {
    photoSlots.set(`/assets/photos/${name}.webp`, ctx);
    return `<div class="photo slot" style="--r:${ratio}" role="img" aria-label="${esc(alt || 'Photographie à fournir')}" data-photo="/assets/photos/${esc(name)}.webp"><span><b>Photo à fournir</b><br>${esc(name)}.webp</span></div>`;
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
const arrow = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8"/><path d="M4.5 2.5 8 6l-3.5 3.5"/></svg>`;
const btn = (href, label, kind = 'primary', arr = true) =>
  `<a class="btn${kind === 'secondary' ? ' btn--secondary' : ''}" href="${href}">${esc(label)}${arr && kind === 'primary' ? arrow : ''}</a>`;
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
  const jsonld = p.jsonld ? `<script type="application/ld+json">${JSON.stringify(p.jsonld)}</script>` : '';
  const footFam = D.families.map((f) => `<li><a href="${U('/produits/' + f.slug)}">${esc(f.name)}</a></li>`).join('');
  const footSites = D.agencies.map((a) => `<li><a href="${U('/contact#' + a.id)}">${esc(a.name)}</a></li>`).join('');
  const hq = D.agencies[0];
  const fab = `<div class="fab">${
    WHATSAPP_NUMBER
      ? `<a href="https://wa.me/${WHATSAPP_NUMBER}" aria-label="${esc(L.whatsapp)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z"/></svg></a>`
      : ''
  }<a href="tel:${PHONE_NUMBER}" aria-label="${esc(L.callHq)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg></a></div>`;

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${canonical}">
${p.noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="SIBM">
<meta property="og:locale" content="${L.locale}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1f6b3f">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/archivo-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/hanken-grotesk-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=${TODAY}">
${jsonld}
</head>
<body data-endpoint="${esc(FORM_ENDPOINT)}" data-tel="${esc(D.phone(hq.phones[0]))}">
<a class="sr" href="#main">${L.skip}</a>
<header class="nav">
  <div class="wrap nav__bar">
    <a class="logo" href="${U('/')}" aria-label="SIBM, accueil"><span class="logo__mark" aria-hidden="true"></span>SIBM</a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links" data-open="${L.menu}" data-close="${L.close}">${L.menu}</button>
    <nav class="nav__links" id="nav-links" aria-label="Principal">
      <div class="nav__item"><a class="nav__link" href="${U('/presentation')}"${cur('presentation')}>${L.nav.presentation}</a></div>
      <div class="nav__item"><a class="nav__link" href="${U('/produits')}"${cur('produits')}>${L.nav.products}</a><div class="nav__menu">${famMenu}</div></div>
      <div class="nav__item"><a class="nav__link" href="${U('/services/bureau-d-etude')}"${cur('services')}>${L.nav.services}</a><div class="nav__menu">${svcMenu}</div></div>
      <div class="nav__item"><a class="nav__link" href="${U('/references')}"${cur('references')}>${L.nav.references}</a></div>
      <div class="nav__item"><a class="nav__link" href="${U('/actualites')}"${cur('actualites')}>${L.nav.news}</a></div>
      <div class="nav__item"><a class="nav__link" href="${U('/contact')}"${cur('contact')}>${L.nav.contact}</a></div>
    </nav>
    <a class="btn nav__cta" href="${U('/devis')}">${L.mainAction}${arrow}</a>
  </div>
</header>
<main id="main">
${p.body}
</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot__grid">
      <div>
        <a class="logo" href="${U('/')}" aria-label="SIBM, accueil"><span class="logo__mark" aria-hidden="true"></span>SIBM</a>
        <p class="t-small muted" style="margin-top:16px">${D.company.name}. Béton préfabriqué depuis ${D.company.founded}.</p>
        <p class="t-small" style="margin-top:16px"><a class="link" href="mailto:${D.company.email}">${D.company.email}</a></p>
      </div>
      <div><h2>${L.footer.catalogue}</h2><ul>${footFam}</ul></div>
      <div><h2>${L.footer.company}</h2><ul>
        <li><a href="${U('/presentation')}">${L.nav.presentation}</a></li>
        <li><a href="${U('/references')}">${L.nav.references}</a></li>
        <li><a href="${U('/actualites')}">${L.nav.news}</a></li>
        <li><a href="${U('/galerie')}">${L.nav.gallery}</a></li>
        <li><a href="${U('/qualite-securite-environnement')}">${L.footer.qse}</a></li>
        <li><a href="${U('/carrieres')}">${L.nav.careers}</a></li></ul></div>
      <div><h2>${L.footer.services}</h2><ul>
        <li><a href="${U('/services/bureau-d-etude')}">${L.services.studies.name}</a></li>
        <li><a href="${U('/services/laboratoire')}">${L.services.lab.name}</a></li>
        <li><a href="${U('/services/logistique')}">${L.services.logistics.name}</a></li>
        <li><a href="${U('/devis')}">${L.mainAction}</a></li>
        <li><a href="${U('/reclamation')}">${L.footer.complaint}</a></li></ul></div>
      <div><h2>${L.footer.sites}</h2><ul>${footSites}</ul></div>
    </div>
    <div class="foot__legal"><span>© ${YEAR} SIBM. ${L.footer.rights}</span><a class="link" href="${U('/mentions-legales')}">${L.footer.legal}</a></div>
  </div>
</footer>
${p.noFab ? '' : fab}
<script id="i18n-form" type="application/json">${JSON.stringify(L.form)}</script>
<script src="/assets/js/site.js?v=${TODAY}" defer></script>
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
  return `<a class="card" href="${U('/produits/' + f.slug)}">
    ${photo('familles/' + f.slug, { ratio: '4/3', ctx: 'Famille : ' + f.name, alt: f.name })}
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
  <div id="produit-box" hidden>${field({ id: 'q-product', name: 'produit', label: L.quote.product, attrs: 'readonly' })}</div>
  ${area({ id: 'q-desc', name: 'description', label: f.description })}
  <div class="field"><label for="q-file">${f.attachment}</label><input id="q-file" name="piece_jointe" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"><div class="err" role="alert"></div></div>
  ${formEnd(L, L.quote.submit)}
</form>`;
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
    body: `
<section class="hero"><div class="wrap">
  <div class="hero__head">
    <div class="h">
      <p class="hero__kicker t-label">${L.home.kicker}</p>
      <h1 class="t-h1">${esc(L.home.h1)}</h1>
    </div>
    <div class="a">
      <p class="t-lead">${esc(L.home.lead)}</p>
      <div class="btn-row">${btn(U('/devis'), L.mainAction)}${btn(U('/produits'), L.home.ctaProducts, 'secondary')}</div>
    </div>
  </div>
  <div class="hero__stage">${photo('accueil/hero', { ratio: '16/7', eager: true, sizes: '100vw', alt: 'Usine SIBM, produits en béton préfabriqué', ctx: 'Hero accueil : usine ou parc produits' })}</div>
</div></section>

<section class="sec sec--tight"><div class="wrap">
  <h2 class="sr">${L.home.figuresTitle}</h2>
  <dl class="figures">${L.home.figures.map((f) => `<div class="fig"><dt>${esc(f.v)}</dt><dd>${esc(f.l)}</dd></div>`).join('')}</dl>
</div></section>

<section class="sec"><div class="wrap">
  ${secHead('01', L.home.familiesTitle, L.home.familiesLead)}
  <div class="cards cards--3">${D.families.map((f) => familyCard(L, U, f)).join('')}</div>
  <p style="margin-top:48px">${btn(U('/produits'), L.home.familyAll, 'secondary')}</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="split">
    <div class="l">
      <p class="eyebrow t-label">02</p>
      <h2 class="t-h2">${L.home.featuredTitle}</h2>
      <p class="t-lead" style="margin-top:24px">${esc(L.home.featuredLead)}</p>
      <p style="margin-top:32px">${btn(U('/produits/beton-sec'), L.home.featuredCta)}</p>
    </div>
    <div class="r">${photo('beton-sec/accueil', { ratio: '4/3', alt: 'Béton sec SIBM', ctx: 'Béton sec SIBM (accueil)' })}</div>
  </div>
</div></section>

<section class="sec"><div class="wrap">
  ${secHead('03', L.home.refsTitle, L.home.refsLead)}
  <div class="cards cards--4">${featured
    .map(
      (r) => `<a class="card" href="${U('/references#' + r.slug)}">${photo('references/' + r.slug, { ratio: '4/5', alt: r.name, ctx: 'Référence : ' + r.name })}<h3 class="card__title">${esc(r.name)}</h3><p class="card__list">${esc(r.place)}</p></a>`
    )
    .join('')}</div>
  <p style="margin-top:48px">${btn(U('/references'), L.home.refsCta, 'secondary')}</p>
</div></section>

<section class="sec sec--tight"><div class="wrap">
  <h2 class="t-h3" style="margin-bottom:32px">${L.home.clientsTitle}</h2>
  <ul class="clients">${D.clients.map((c) => `<li>${logo(c)}</li>`).join('')}</ul>
</div></section>

<section class="sec"><div class="wrap">
  ${secHead('04', L.home.newsTitle)}
  <div class="cards cards--3">${D.news.slice(0, 3).map((n) => newsCard(L, U, n)).join('')}</div>
  <p style="margin-top:48px">${btn(U('/actualites'), L.home.newsCta, 'secondary')}</p>
</div></section>

<section class="sec sec--tight"><div class="wrap">
  <div class="quote-strip">
    <div class="l"><h2 class="t-h2" style="max-width:18ch">${L.home.quoteTitle}</h2><p class="t-lead" style="margin-top:20px">${esc(L.home.quoteLead)}</p></div>
    <div class="r">${btn(U('/devis'), L.mainAction)}</div>
  </div>
</div></section>

<section class="sec"><div class="wrap">
  ${secHead('05', L.home.sitesTitle, L.home.sitesLead)}
  <ul class="rows">${D.agencies.map((a) => agencyBlock(L, a)).join('')}</ul>
  <p style="margin-top:48px">${btn(U('/contact'), L.home.sitesCta, 'secondary')}</p>
</div></section>`,
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
      const block = (title, n) => `<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="l"><h2 class="t-h2">${title}</h2></div><div class="r">
        <ul class="rows">${Array.from({ length: n }, () => `<li>${todo(L)}</li>`).join('')}</ul></div></div></div></section>`;
      add(lang, L, {
        url: '/produits/' + f.slug,
        nav: 'produits',
        title: 'Béton sec SIBM : caractéristiques et avantages',
        description: 'Le Béton sec SIBM, lancé le 1er décembre 2022. Caractéristiques, avantages et demande de devis.',
        body: `${pageHead(L, U, [['/produits', L.nav.products], [null, f.name]], L.products.dryTitle, L.products.dryLead)}
<section class="sec" style="padding-top:0"><div class="wrap"><div class="product">
  <div class="l">${photo('beton-sec/produit', { ratio: '4/3', eager: true, sizes: '(min-width:900px) 60vw, 100vw', alt: 'Béton sec SIBM', ctx: 'Béton sec SIBM : produit' })}</div>
  <div class="r"><div class="aside-box"><p class="t-label muted">${L.products.family}</p><p class="t-h3">${f.name}</p>
    ${btn(U('/devis') + '?famille=' + f.slug + '&nom=' + encodeURIComponent(f.name), L.products.quoteProduct)}
    <p class="t-small">${L.products.datasheetTodo}</p></div></div>
</div></div></section>
${block(L.products.dryFeatures, 4)}
${block(L.products.dryAdvantages, 4)}`,
      });
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
      const pdf = fs.existsSync(path.join(SRC, 'assets', 'docs', `${p.slug}.pdf`));
      todoFlags.add(`Fiche technique PDF : ${p.name} (src/assets/docs/${p.slug}.pdf)`);
      add(lang, L, {
        url: `/produits/${f.slug}/${p.slug}`,
        nav: 'produits',
        title: `${p.name} : ${f.name} | SIBM`,
        description: `${p.name}, produit en béton préfabriqué SIBM (${f.name}). Fiche technique, dimensions et demande de devis.`,
        jsonld: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          category: f.name,
          brand: { '@type': 'Brand', name: 'SIBM' },
          manufacturer: { '@id': SITE_URL + '/#organization' },
        },
        body: `${pageHead(L, U, [['/produits', L.nav.products], [`/produits/${f.slug}`, f.name], [null, p.name]], p.name, null)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="product">
    <div class="l">${photo(`produits/${p.slug}`, { ratio: '4/3', eager: true, sizes: '(min-width:900px) 60vw, 100vw', alt: p.name, ctx: `Produit : ${p.name}` })}</div>
    <div class="r"><div class="aside-box">
      <p class="t-label muted">${L.products.family}</p><p class="t-h3">${esc(f.name)}</p>
      ${btn(U('/devis') + `?famille=${f.slug}&nom=${encodeURIComponent(p.name)}`, L.products.quoteProduct)}
      ${pdf ? `<a class="link" href="/assets/docs/${p.slug}.pdf" download>${L.products.datasheet}</a>` : `<p class="t-small">${L.products.datasheetTodo}</p>`}
    </div></div>
  </div>
</div></section>
<section class="sec sec--tight"><div class="wrap prose">
  <div class="split"><div class="l"><h2 class="t-h2">${L.products.description_}</h2></div>
  <div class="r"><p class="t-lead">${esc(L.products.descriptionFamily(f.name, p.name))}</p><p>${todo(L)} ${L.products.descriptionTodo}</p></div></div>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.products.dimensions}</h2></div>
  <div class="r"><table class="spec"><tbody>
    <tr><th scope="row">${L.products.dimensionRows[0]}</th><td>${esc(p.name)}</td></tr>
    ${L.products.dimensionRows.slice(1).map((r) => `<tr><th scope="row">${r}</th><td>${todo(L)}</td></tr>`).join('')}
  </tbody></table></div></div>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.products.standards}</h2></div><div class="r"><p>${todo(L)}</p></div></div>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.products.applications}</h2></div><div class="r"><p>${esc(L.products.applicationsFamily(f.name))}</p></div></div>
</div></section>
<section class="sec sec--tight"><div class="wrap">
  <div class="split"><div class="l"><h2 class="t-h2">${L.products.weight}</h2></div>
  <div class="r"><table class="spec"><tbody>${L.products.weightRows.map((r) => `<tr><th scope="row">${r}</th><td>${todo(L)}</td></tr>`).join('')}</tbody></table></div></div>
</div></section>
${usedOn.length ? `<section class="sec sec--tight"><div class="wrap"><div class="split"><div class="l"><h2 class="t-h2">${L.products.usedOn}</h2></div><div class="r"><ul class="rows rows--tight">${usedOn.map((r) => `<li><a class="link" href="${U('/references#' + r.slug)}">${esc(r.name)}</a></li>`).join('')}</ul></div></div></div></section>` : ''}
<section class="sec"><div class="wrap">
  <h2 class="t-h3" style="margin-bottom:32px">${L.products.sameFamily}</h2>
  <div class="cards cards--3">${sibling
    .map((s) => `<a class="card" href="${U(`/produits/${f.slug}/${s.slug}`)}">${photo(`produits/${s.slug}`, { ratio: '4/3', alt: s.name, ctx: `Produit : ${s.name}` })}<h3 class="card__title">${esc(s.name)}</h3></a>`)
    .join('')}</div>
</div></section>`,
      });
    }
  }

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
<section class="sec"><div class="wrap">
  ${secHead('02', L.references.feedbackTitle)}
  <ul class="rows">${D.testimonials
    .map((t) => `<li><div class="split" style="gap:8px"><div class="l"><p class="t-h3">${esc(t.client)}</p></div><div class="r"><p class="t-lead">${esc(t.text)}</p>${t.product ? `<p style="margin-top:8px"><a class="link" href="${U(`/produits/${t.product.fam}/${t.product.slug}`)}">${esc(t.product.name)}</a></p>` : ''}</div></div></li>`)
    .join('')}</ul>
</div></section>
<section class="sec sec--tight"><div class="wrap"><h2 class="t-h3" style="margin-bottom:32px">${L.references.clientsTitle}</h2><ul class="clients">${D.clients.map((c) => `<li>${logo(c)}</li>`).join('')}</ul></div></section>`,
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

// Logo client : fichier /assets/logos/<slug>.svg|png|webp si présent, sinon nom en texte.
function logo(name) {
  const s = D.slugify(name);
  for (const e of ['svg', 'webp', 'png']) {
    if (fs.existsSync(path.join(SRC, 'assets', 'logos', `${s}.${e}`)))
      return `<img src="/assets/logos/${s}.${e}" alt="${esc(name)}" height="40" loading="lazy">`;
  }
  todoFlags.add(`Logo client : ${name} (src/assets/logos/${s}.svg)`);
  return esc(name);
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

// favicon
fs.writeFileSync(
  path.join(OUT, 'assets', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#1f6b3f"/><rect x="8" y="8" width="16" height="16" fill="none" stroke="#fff" stroke-width="3"/></svg>`
);

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
console.log(`OK : ${pages.length} pages, ${slots.length} emplacements photo vides -> ${path.relative(process.cwd(), OUT) || OUT}`);
