/* SIBM v2 — JS minimal (~4 Ko) : menu mobile, préremplissage du devis, validation et envoi des formulaires.
   Aucun traceur. Le point d'envoi vient de <body data-endpoint> (variable FORM_ENDPOINT au build). */
(function () {
  'use strict';
  var d = document;
  var body = d.body;

  // Menu mobile
  var nav = d.querySelector('.nav');
  var toggle = d.querySelector('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? toggle.dataset.close : toggle.dataset.open;
      d.documentElement.style.overflow = open ? 'hidden' : '';
    });
  }

  // Préremplissage du devis depuis ?produit=…&famille=…&nom=…
  var qf = d.querySelector('form[data-form="devis"]');
  if (qf) {
    var p = new URLSearchParams(location.search);
    var fam = p.get('famille');
    var nom = p.get('nom');
    var site = p.get('site');
    if (site && qf.elements.site) {
      qf.elements.site.value = site;
      if (qf.elements.description && !qf.elements.description.value) qf.elements.description.placeholder = 'Site SIBM choisi : ' + site + '. Produits, quantités, date souhaitée.';
    }
    if (fam && qf.elements.famille) qf.elements.famille.value = fam;
    if (nom) {
      var box = d.getElementById('produit-box');
      qf.elements.produit.value = nom;
      if (box) box.hidden = false;
      if (qf.elements.description && !qf.elements.description.value) {
        qf.elements.description.placeholder = nom + ' : quantité souhaitée, dimensions, date de livraison.';
      }
    }
  }

  // Bascule Entreprise / Particulier
  d.querySelectorAll('[data-toggle-type]').forEach(function (form) {
    var radios = form.querySelectorAll('input[name="type"]');
    function apply() {
      var v = form.querySelector('input[name="type"]:checked');
      var ent = !v || v.value === 'Entreprise';
      form.querySelectorAll('[data-only="entreprise"]').forEach(function (el) {
        el.hidden = !ent;
        el.querySelectorAll('input').forEach(function (i) { i.required = ent && i.dataset.req === '1'; i.disabled = !ent; });
      });
      form.querySelectorAll('[data-only="particulier"]').forEach(function (el) {
        el.hidden = ent;
        el.querySelectorAll('input').forEach(function (i) { i.required = !ent && i.dataset.req === '1'; i.disabled = ent; });
      });
    }
    radios.forEach(function (r) { r.addEventListener('change', apply); });
    apply();
  });

  // Validation + envoi
  var msg = JSON.parse((d.getElementById('i18n-form') || { textContent: '{}' }).textContent);
  var phoneRe = /^[+()\d][\d\s().-]{7,}$/;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setErr(field, text) {
    field.setAttribute('aria-invalid', text ? 'true' : 'false');
    var e = field.querySelector('.err');
    if (e) e.textContent = text || '';
  }

  function validate(form) {
    var ok = true, first = null;
    form.querySelectorAll('.field').forEach(function (f) {
      var i = f.querySelector('input:not([type=radio]):not([type=checkbox]), select, textarea');
      if (!i || i.disabled || f.closest('[hidden]')) { setErr(f, ''); return; }
      var v = (i.value || '').trim(), t = '';
      if (i.required && !v) t = msg.required;
      else if (v && i.type === 'email' && !emailRe.test(v)) t = msg.invalidEmail;
      else if (v && i.type === 'tel' && !phoneRe.test(v)) t = msg.invalidPhone;
      else if (i.type === 'file' && i.files && i.files[0] && i.files[0].size > 10 * 1024 * 1024) t = msg.fileTooBig;
      setErr(f, t);
      if (t) { ok = false; first = first || i; }
    });
    if (first) first.focus();
    return ok;
  }

  d.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.status');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      status.className = 'status';
      if (form.elements.website && form.elements.website.value) return; // piège anti-spam : on ignore
      if (!validate(form)) { status.textContent = msg.invalid; status.className = 'status is-err'; return; }
      var endpoint = body.dataset.endpoint;
      if (!endpoint) { status.textContent = msg.noEndpoint; status.className = 'status is-err'; return; }
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = msg.sending;
      var data = new FormData(form);
      data.delete('website');
      data.append('formulaire', form.dataset.form);
      data.append('page', location.pathname);
      fetch(endpoint, { method: 'POST', body: data })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          form.reset();
          status.textContent = msg.success;
          status.className = 'status is-ok';
          status.focus();
        })
        .catch(function () {
          status.textContent = msg.error + (body.dataset.tel || '');
          status.className = 'status is-err';
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();
