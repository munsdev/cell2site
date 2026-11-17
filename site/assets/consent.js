// Consent for cell2site.com, following the Voodoo rules: nothing external loads before a choice,
// Accept and Reject weigh the same, and the choice can be changed from the footer at any time.
// Runs in <head> so the page's first paint already knows whether external content may show.
(function () {
  'use strict';
  var KEY = 'c2s-consent';
  var VERSION = '1';   // bump when the banner text or categories change: everyone is asked again
  var LOG = 'https://cc-worker.casey-945.workers.dev/log';

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      return c && c.version === VERSION ? c : null;
    } catch (e) { return null; }
  }

  var choice = read();
  var html = document.documentElement;
  if (choice && choice.categories.external) html.classList.add('ext-ok');

  // The library is only requested once external media is allowed: it fetches from Google itself.
  var libLoading = null;
  function loadLibrary() {
    if (libLoading) return libLoading;
    libLoading = new Promise(function (resolve, reject) {
      var src = document.querySelector('meta[name=c2-lib]').content;
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(window.cell2site); document.dispatchEvent(new Event('c2:library')); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return libLoading;
  }

  // The record proves consent (version, time, categories); the logger stores nothing derived from the IP.
  function save(categories, action) {
    choice = { version: VERSION, timestamp: Date.now(), categories: categories };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) { /* private mode: asked again next visit */ }
    html.classList.toggle('ext-ok', !!categories.external);
    try {
      fetch(LOG, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: 'cell2site', version: VERSION, action: action, categories: categories, timestamp: choice.timestamp }) });
    } catch (e) { /* the record is best-effort; the choice itself is already applied */ }
    if (categories.external) loadLibrary();
    else if (libLoading) location.reload();   // withdrawn: drop the loaded library and its data
    hide();
  }

  var banner;
  function show(withSettings) {
    banner.hidden = false;
    banner.querySelector('#consent-settings').hidden = !withSettings;
    banner.querySelector('[data-consent=save]').hidden = !withSettings;
    banner.querySelector('[data-consent=settings]').hidden = withSettings;
    banner.querySelector('[data-category=external]').checked = !!(choice && choice.categories.external);
    // No button is focused on first show: a focus ring would make Accept look heavier than Reject.
    if (withSettings) banner.querySelector('[data-category=external]').focus();
  }
  function hide() { if (banner) banner.hidden = true; }

  window.c2consent = {
    allowed: function () { return !!(choice && choice.categories.external); },
    // Runs fn(cell2site) once the library is available, which may be never.
    whenLibrary: function (fn) {
      if (window.c2consent.allowed()) loadLibrary().then(fn);
      else document.addEventListener('c2:library', function () { fn(window.cell2site); }, { once: true });
    },
    open: function () { show(true); },
  };

  document.addEventListener('DOMContentLoaded', function () {
    banner = document.getElementById('consent');
    if (choice && choice.categories.external) loadLibrary();
    if (!choice) show(false);

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-consent],[data-consent-open]');
      if (!t) return;
      if (t.hasAttribute('data-consent-open')) return show(true);
      var action = t.getAttribute('data-consent');
      if (action === 'accept' || action === 'accept-external') save({ necessary: true, external: true }, 'accept_all');
      else if (action === 'reject') save({ necessary: true, external: false }, 'reject_all');
      else if (action === 'settings') show(true);
      else if (action === 'save') save({ necessary: true, external: banner.querySelector('[data-category=external]').checked }, 'custom');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && choice) hide(); });
  });
})();
