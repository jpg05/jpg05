/* SIBM v2.1 : couche « wow » (BRIEF V2 §2), JS natif, sans dépendance.
   Tout est initialisé à la visibilité ou à l'interaction. Sous prefers-reduced-motion, <html> n'a pas la classe .fx :
   le contenu est statique et entièrement visible. Les compteurs viennent de vendor/taste/motion.js ([data-m-count]). */
(function () {
  'use strict';
  var d = document, html = d.documentElement, w = window;
  var reduced = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hoverNone = w.matchMedia('(hover: none)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

  function io(sel, cb, opts) {
    var els = d.querySelectorAll(sel);
    if (!els.length) return;
    if (!('IntersectionObserver' in w)) { els.forEach(function (el) { cb(el); }); return; }
    var ob = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { cb(e.target); ob.unobserve(e.target); } });
    }, opts || { rootMargin: '0px 0px -15% 0px', threshold: 0.15 });
    els.forEach(function (el) { ob.observe(el); });
  }

  // ------------------------------------------------ logos clients : couleur à l'entrée dans l'écran (écrans tactiles)
  if (hoverNone) {
    io('.client', function (el) { el.classList.add('is-colour'); }, { threshold: 0.6 });
  }

  // ------------------------------------------------ défilé des noms clients : bouton pause (WCAG 2.2.2)
  d.querySelectorAll('[data-marquee-pause]').forEach(function (b) {
    var m = d.getElementById(b.getAttribute('aria-controls'));
    b.addEventListener('click', function () {
      var p = m.classList.toggle('is-paused');
      b.setAttribute('aria-pressed', p ? 'true' : 'false');
      b.textContent = p ? b.dataset.play : b.dataset.pause;
    });
  });

  // ------------------------------------------------ carte des sites (fonctionne aussi sans .fx)
  var mapData = d.getElementById('map-data');
  if (mapData) {
    var sites = JSON.parse(mapData.textContent);
    var card = d.getElementById('agency-card');
    var pins = d.querySelectorAll('[data-site]');
    var show = function (id, focus) {
      var s = sites[id]; if (!s || !card) return;
      pins.forEach(function (p) { p.setAttribute('aria-pressed', p.dataset.site === id ? 'true' : 'false'); });
      card.querySelector('[data-k=name]').textContent = s.name;
      card.querySelector('[data-k=role]').textContent = s.role;
      card.querySelector('[data-k=lines]').innerHTML = s.lines.map(esc).join('<br>');
      card.querySelector('[data-k=phones]').innerHTML = s.phones.map(function (p) { return '<a class="link" href="tel:' + p.tel + '">' + esc(p.label) + '</a>'; }).join('<br>');
      card.querySelector('[data-k=quote]').setAttribute('href', s.quote);
      card.querySelector('[data-k=map]').setAttribute('href', s.map);
      if (focus) card.focus({ preventScroll: true });
    };
    pins.forEach(function (p) {
      p.addEventListener('click', function () { show(p.dataset.site, false); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p.dataset.site, false); } });
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ------------------------------------------------ fiche technique : le bouton ouvre le formulaire et le pré-remplit
  d.querySelectorAll('[data-open-sheet]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var f = d.getElementById('fiche-technique'); if (!f) return;
      e.preventDefault();
      f.classList.add('is-open');
      f.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      var first = f.querySelector('input:not([type=hidden]):not([readonly])');
      setTimeout(function () { first && first.focus({ preventScroll: true }); }, reduced ? 0 : 450);
      history.replaceState(null, '', '#fiche-technique');
    });
  });

  if (reduced) return; // ------------- au-delà : effets uniquement

  // ------------------------------------------------ hero : vidéo (jamais en économie de données), parallaxe
  var vid = d.querySelector('.hero video[data-src]');
  if (vid && !saveData) { vid.src = vid.dataset.src; vid.play && vid.play().catch(function () {}); }
  var comp = d.querySelector('[data-parallax]');
  if (comp) {
    var heroOn = true, ticking = false;
    if ('IntersectionObserver' in w) new IntersectionObserver(function (e) { heroOn = e[0].isIntersecting; }).observe(comp.parentNode);
    w.addEventListener('scroll', function () {
      if (!heroOn || ticking) return; ticking = true;
      requestAnimationFrame(function () { comp.style.transform = 'translate3d(0,' + (w.scrollY * 0.28).toFixed(1) + 'px,0)'; ticking = false; });
    }, { passive: true });
  }

  // ------------------------------------------------ révélations au masque, tracés de plans, panneaux de références
  // les états masqués ne s'appliquent qu'une fois les observateurs armés (.fx-io) : sans eux, tout reste visible
  if ('IntersectionObserver' in w) html.classList.add('fx-io');
  io('.reveal-mask', function (el) { el.classList.add('is-in'); }, { threshold: 0 });
  d.querySelectorAll('.bp').forEach(function (svg) {
    svg.querySelectorAll('.s, .a').forEach(function (p) {
      try { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2)); } catch (e) { /* forme sans longueur */ }
    });
  });
  io('.bp', function (el) { el.classList.add('is-drawn'); }, { threshold: 0.35 });
  io('.story__panel', function (el) { el.classList.add('is-in'); }, { threshold: 0.35 });

  // ------------------------------------------------ familles : défilement horizontal épinglé (bureau)
  var hs = d.querySelector('.hscroll');
  if (hs) {
    var track = hs.querySelector('.hscroll__track'), bar = hs.querySelector('.hscroll__progress');
    var desk = w.matchMedia('(min-width: 1024px)');
    var dist = 0, hsTick = false;
    var size = function () {
      if (!desk.matches) { hs.style.removeProperty('--hs-h'); track.style.transform = ''; return; }
      dist = Math.max(0, track.scrollWidth - w.innerWidth);
      hs.style.setProperty('--hs-h', (w.innerHeight + dist) + 'px');
      move();
    };
    var move = function () {
      if (!desk.matches) return;
      var r = hs.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, dist)));
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      if (bar) bar.style.setProperty('--p', p.toFixed(3));
    };
    w.addEventListener('scroll', function () { if (hsTick) return; hsTick = true; requestAnimationFrame(function () { move(); hsTick = false; }); }, { passive: true });
    w.addEventListener('resize', size);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(size);
    size();
    // clavier : un focus sur une carte hors écran ramène le défilement vertical à sa position
    track.addEventListener('focusin', function (e) {
      if (!desk.matches || !dist) return;
      var card = e.target.closest('.fam'); if (!card) return;
      var x = card.offsetLeft - (w.innerWidth - card.offsetWidth) / 2;
      var p = Math.min(1, Math.max(0, x / dist));
      w.scrollTo({ top: hs.offsetTop + p * dist, behavior: 'auto' });
    });
  }

  if (!fine) return; // ------------- au-delà : pointeur fin uniquement

  // ------------------------------------------------ boutons magnétiques (le wrapper bouge, jamais .btn : couche du skill intacte)
  d.querySelectorAll('.mag').forEach(function (m) {
    m.addEventListener('pointermove', function (e) {
      var r = m.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
      m.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
    m.addEventListener('pointerleave', function () { m.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)'; m.style.transform = ''; setTimeout(function () { m.style.transition = ''; }, 400); });
  });

  // ------------------------------------------------ tilt 3D des cartes produit (enfant interne)
  d.querySelectorAll('.tilt').forEach(function (t) {
    var inner = t.querySelector('.tilt__in'); if (!inner) return;
    t.addEventListener('pointermove', function (e) {
      var r = t.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      inner.style.transform = 'perspective(900px) rotateX(' + (-py * 6).toFixed(2) + 'deg) rotateY(' + (px * 8).toFixed(2) + 'deg)';
    });
    t.addEventListener('pointerleave', function () { inner.style.transform = ''; });
  });

  // ------------------------------------------------ curseur personnalisé (bureau)
  var c = d.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); d.body.appendChild(c);
  var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
  var loop = function () { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3) ? requestAnimationFrame(loop) : 0; };
  d.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY; c.classList.add('is-on');
    c.classList.toggle('is-link', !!e.target.closest('a, button, [role=button], .pin, label, select'));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  d.addEventListener('pointerleave', function () { c.classList.remove('is-on'); });
})();
