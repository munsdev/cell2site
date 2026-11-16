/*!
 * cell2site v1.3.0 — Google Sheets → lists, tabs, maps and drop-in embeds.
 * No build step, no API keys, no server. MIT © muns.dev — https://cell2site.com
 *
 *   <script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.3.0/cell2site.js"></script>
 *
 * Share the sheet as "Anyone with the link → Viewer", then either drop in a ready-made embed:
 *
 *   <div data-cell2-embed="cards" data-cell2-id="SHEET_URL_OR_ID"></div>
 *
 * or mark up your own HTML:
 *
 *   <div data-cell2-list data-cell2-id="SHEET_URL_OR_ID" data-cell2-sheet="Tab name">
 *     <div data-cell2-item><h3 data-cell2-field="Title"></h3></div>
 *   </div>
 *
 * Every attribute is documented in README.md. This file reads top to bottom:
 *   source → cache → CSV → safe rendering → fields → config → filters
 *   → list → accordion → tabs → map → embeds → init
 */
(function () {
  'use strict';

  const VERSION = '1.3.0';
  const LOG = '[cell2site]';
  const A = 'data-cell2-';

  // ── DOM helpers ────────────────────────────────────────────────────────────

  const attr = (el, name) => ((el && el.getAttribute(A + name)) || '').trim();
  const find = (el, name) => el.querySelector('[' + A + name + ']');
  const findAll = (el, name) => Array.from(el.querySelectorAll('[' + A + name + ']'));
  // Same, plus `el` itself: a template's root may carry a field (<li data-cell2-item data-cell2-field="Name">).
  const findIn = (el, name) => (el.hasAttribute(A + name) ? [el] : []).concat(findAll(el, name));
  const parseList = (text) => (text || '').split(',').map((s) => s.trim()).filter(Boolean);
  const isTruthy = (v) => ['true', 'yes', '1', '✓', 'x'].includes((v || '').trim().toLowerCase());
  const uid = () => 'c2-' + Math.random().toString(36).slice(2, 9);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');

  function setVisible(el, visible) { if (el) el.style.display = visible ? '' : 'none'; }

  // "name:Column" → ['name', 'Column']. Split on the first colon only: column names may contain one.
  function splitPair(spec) {
    const i = spec.indexOf(':');
    return i === -1 ? ['', ''] : [spec.slice(0, i).trim(), spec.slice(i + 1).trim()];
  }

  function debounce(fn, wait) {
    let timer;
    return () => { clearTimeout(timer); timer = setTimeout(fn, wait); };
  }

  // Click plus Enter/Space, so templates built from divs stay keyboard-operable.
  function onActivate(el, fn) {
    el.style.cursor = 'pointer';
    // Not el.tabIndex: Chromium reports 0 for an <a> without href, which still cannot take focus.
    if (!el.hasAttribute('tabindex') && !el.matches('a[href],button,input,select,textarea')) el.tabIndex = 0;
    if (!el.getAttribute('role') && el.tagName !== 'BUTTON') el.setAttribute('role', 'button');
    el.addEventListener('click', fn);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
    });
  }

  function showError(scope, message) {
    const el = find(scope, 'error');
    if (!el) return;
    const text = el.querySelector('[' + A + 'field="message"]');
    if (text) text.textContent = message;
    setVisible(el, true);
  }

  function fail(scope, err) {
    console.error(LOG, err);
    showError(scope, String((err && err.message) || err));
  }

  // ── Sheet source ───────────────────────────────────────────────────────────
  // data-cell2-id takes a bare sheet ID or any Google Sheets URL pasted from the address bar.

  function parseSource(value) {
    const v = (value || '').trim();
    const published = v.match(/\/spreadsheets\/d\/e\/([\w-]+)/);
    const doc = v.match(/\/spreadsheets\/d\/([\w-]+)/);
    const gid = v.match(/[?&#]gid=(\d+)/);
    return {
      id: published ? published[1] : doc ? doc[1] : v,
      published: !!published,
      gid: gid ? gid[1] : '',
    };
  }

  function sourceOf(el) {
    const source = parseSource(attr(el, 'id'));
    if (!source.id) console.warn(LOG, 'Missing data-cell2-id on', el);
    return source.id ? source : null;
  }

  // Tab choice: a named tab wins, then the gid from a pasted URL, then "Sheet1".
  // Google answers an unknown tab name with the first tab rather than an error.
  // headers=1 pins the header to row 1; without it Google guesses, and guesses wrong on all-text tabs.
  // "Publish to web" links (/d/e/…) can only address a tab by gid.
  function csvUrl(source, tabName) {
    const base = 'https://docs.google.com/spreadsheets/d/';
    const gid = source.gid ? '&gid=' + source.gid : '';
    if (source.published) return base + 'e/' + source.id + '/pub?output=csv' + gid;
    const tab = tabName ? '&sheet=' + encodeURIComponent(tabName) : gid || '&sheet=Sheet1';
    return base + source.id + '/gviz/tq?tqx=out:csv&headers=1' + tab;
  }

  // ── Cache ──────────────────────────────────────────────────────────────────
  // Memory serves repeat reads within a page view; localStorage keeps a copy 60× longer so
  // return visits render instantly. ?clearcache on any page URL wipes both.

  const MEMORY_TTL = 60 * 1000;
  const STORAGE_FACTOR = 60;
  const STORAGE_PREFIX = 'cell2site_cache_';
  const SHARE_HINT = 'Could not load the sheet. Check that it is shared as "Anyone with the link" ' +
    'and that the sheet ID and tab name are right.';

  const memory = {};
  const inFlight = {};

  function clearCache() {
    Object.keys(memory).forEach((k) => delete memory[k]);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* storage blocked — nothing to clear */ }
  }

  if (/clearcache/.test(location.search + location.hash)) {
    clearCache();
    console.log(LOG, 'caches cleared');
  }

  const ttlOf = (el) => (parseInt(attr(el, 'cache-ttl'), 10) || 0) * 1000 || MEMORY_TTL;

  async function fetchRows(url, ttl) {
    const now = Date.now();
    const hit = memory[url];
    if (hit && now - hit.ts < ttl) return hit.rows;

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PREFIX + url));
      if (stored && now - stored.ts < ttl * STORAGE_FACTOR) {
        memory[url] = { ts: now, rows: stored.rows };
        return stored.rows;
      }
    } catch (e) { /* storage blocked or corrupt — fall through to the network */ }

    // A list and a map on the same tab would otherwise fetch it twice.
    inFlight[url] = inFlight[url] || download(url).finally(() => delete inFlight[url]);
    const rows = await inFlight[url];
    memory[url] = { ts: now, rows: rows };
    try { localStorage.setItem(STORAGE_PREFIX + url, JSON.stringify(memory[url])); } catch (e) { /* full */ }
    return rows;
  }

  // A private sheet answers with a login redirect (a CORS failure) or an HTML page, never CSV.
  async function download(url) {
    let text = '';
    try {
      const res = await fetch(url);
      if (res.ok) text = await res.text();
    } catch (e) { /* reported below */ }
    if (!text || /^\s*<(!doctype|html)/i.test(text)) throw new Error(SHARE_HINT);
    return toRecords(parseCSV(text));
  }

  // Rows are copied because each caller tags them with the tab they came from.
  async function fetchTab(source, tabName, ttl) {
    const rows = await fetchRows(csvUrl(source, tabName), ttl);
    return rows.map((row) => Object.assign({}, row, { _tab: tabName }));
  }

  // ── CSV ────────────────────────────────────────────────────────────────────

  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    const endRow = () => { row.push(field); rows.push(row); row = []; field = ''; };
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], next = text[i + 1];
      if (quoted) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      }
      else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\r' && next === '\n') { endRow(); i++; }
      else if (ch === '\n' || ch === '\r') endRow();
      else field += ch;
    }
    if (field || row.length) endRow();
    return rows;
  }

  // First row is the header. Blank rows and unnamed columns are dropped.
  function toRecords(rows) {
    const headers = (rows[0] || []).map((h) => h.trim());
    return rows.slice(1)
      .map((cells) => {
        const record = {};
        headers.forEach((h, i) => { if (h) record[h] = (cells[i] || '').trim(); });
        return record;
      })
      .filter((record) => Object.values(record).some(Boolean));
  }

  // Sheets in comma-decimal locales export "48,137".
  const toNumber = (v) => parseFloat(String(v || '').replace(',', '.'));

  // ── Safe rendering ─────────────────────────────────────────────────────────
  // Cells are untrusted: a sheet may be fed by a form, or belong to whoever crafted the link.
  // Markup is allowed, anything that can run script is not.

  const BLOCKED_TAGS = 'script,style,link,meta,base,object,embed,form,svg,math,template';
  const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'poster', 'data', 'xlink:href'];
  const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

  // The URL parser, not a regex, decides the scheme — it sees through "java\tscript:" tricks.
  function isSafeUrl(value) {
    try { return SAFE_PROTOCOLS.includes(new URL(value, location.href).protocol); }
    catch (e) { return false; }
  }

  function sanitize(html) {
    const tpl = document.createElement('template');   // inert: nothing loads or runs while parsing
    tpl.innerHTML = html;
    tpl.content.querySelectorAll(BLOCKED_TAGS).forEach((el) => el.remove());
    tpl.content.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((a) => {
        const name = a.name.toLowerCase();
        const unsafe = name.startsWith('on') || name === 'srcdoc' ||
          (URL_ATTRS.includes(name) && !isSafeUrl(a.value));
        if (unsafe) el.removeAttribute(a.name);
      });
    });
    return tpl.content;
  }

  function setHtml(el, html) { el.replaceChildren(sanitize(html)); }

  const HTML_TAG = /<[a-z][\s\S]*?>/i;
  const LINKS = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s,;)"'<>\]]+)/g;

  // Plain cells stay text. [label](url) and bare URLs become links; cells holding HTML render as HTML.
  function setText(el, value) {
    if (HTML_TAG.test(value)) return setHtml(el, value);
    el.textContent = '';
    let last = 0;
    if (el.tagName !== 'A') {   // no links inside a link
      for (const m of value.matchAll(LINKS)) {
        const a = document.createElement('a');
        a.href = m[2] || m[3];
        a.textContent = m[1] || m[3];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        el.append(value.slice(last, m.index), a);
        last = m.index + m[0].length;
      }
    }
    el.append(value.slice(last));
  }

  // ── Fields ─────────────────────────────────────────────────────────────────

  // A blank value removes the nearest [data-cell2-field-wrapper] ancestor; without one, just clears.
  function blank(el, root, clear) {
    for (let up = el.parentElement; up && up !== root; up = up.parentElement) {
      if (up.hasAttribute(A + 'field-wrapper')) return up.remove();
    }
    clear();
  }

  // Fills a cloned template from one record. `prefix` lets tab templates read their _config row
  // with the same grammar (data-cell2-tab-field, -tab-field-html, -tab-field-attr).
  function fillFields(root, record, prefix) {
    prefix = prefix || 'field';
    const value = (key) => (key && record[key]) || '';

    findIn(root, prefix).forEach((el) => {
      const key = attr(el, prefix);
      if (key === 'message') return;   // reserved for [data-cell2-error]
      const v = value(key);
      if (v) setText(el, v); else blank(el, root, () => { el.textContent = ''; });
    });

    findIn(root, prefix + '-html').forEach((el) => {
      const v = value(attr(el, prefix + '-html'));
      if (v) setHtml(el, v); else blank(el, root, () => { el.textContent = ''; });
    });

    findIn(root, prefix + '-attr').forEach((el) => {
      const [name, key] = splitPair(attr(el, prefix + '-attr'));
      if (!name) return;
      let v = value(key);
      if (URL_ATTRS.includes(name.toLowerCase()) && !isSafeUrl(v)) v = '';
      if (v) el.setAttribute(name, v); else blank(el, root, () => el.removeAttribute(name));
    });

    findIn(root, 'show-if').forEach((el) => { if (!isTruthy(record[attr(el, 'show-if')])) el.remove(); });
    findIn(root, 'hide-if').forEach((el) => { if (isTruthy(record[attr(el, 'hide-if')])) el.remove(); });
  }

  // data-cell2-meta="tab-title" etc. Keys missing from `values` are left untouched.
  function fillMeta(root, values) {
    findIn(root, 'meta').forEach((el) => {
      const key = attr(el, 'meta');
      if (key in values) el.textContent = values[key];
    });
  }

  // data-cell2-var="name:Column; …" sets --name. The first source holding the column wins.
  function applyVars(root, sources, skip) {
    findIn(root, 'var').forEach((el) => {
      if (skip && el.closest(skip)) return;
      attr(el, 'var').split(';').forEach((pair) => {
        const [name, col] = splitPair(pair);
        const source = sources.find((s) => s && s[col]);
        if (name && source) el.style.setProperty('--' + name, source[col]);
      });
    });
  }

  // Columns a template displays — the basis for de-duplicating merged tabs.
  function fieldNames(template) {
    if (!template) return [];
    const names = findAll(template, 'field').map((el) => attr(el, 'field'))
      .concat(findAll(template, 'field-html').map((el) => attr(el, 'field-html')));
    return Array.from(new Set(names)).filter((n) => n && n !== 'message');
  }

  function dedupe(records, columns) {
    if (!columns.length) return records;
    const seen = new Set();
    return records.filter((r) => {
      const print = columns.map((c) => (r[c] || '').toLowerCase()).join('||');
      return !seen.has(print) && seen.add(print);
    });
  }

  // ── Config sheet ───────────────────────────────────────────────────────────
  // Optional `_config` tab: one row per tab (order, label, sort, marker colour…), a comma-separated
  // Tab cell for a merged tab, and a `*` row of global values for data-cell2-var.

  const CONFIG_ONLY = ['Tab', 'Label', 'Description', 'Sort By', 'Sort Dir', 'Sort Type', 'Active'];

  function tabDef(tab, row) {
    row = row || {};
    const sources = parseList(tab);
    return {
      tab: tab,
      sourceTabs: sources,
      isAggregate: sources.length > 1,
      label: row.Label || tab,
      description: row.Description || '',
      color: row.Color || '',
      icon: row.Icon || '',
      sortCol: row['Sort By'] || '',
      sortDir: (row['Sort Dir'] || 'asc').toLowerCase(),
      sortType: (row['Sort Type'] || 'text').toLowerCase(),
      active: isTruthy(row.Active),
      row: row,
    };
  }

  // Never throws: a sheet without a config tab simply yields no tabs.
  async function fetchConfig(source, el, ttl) {
    const config = { tabs: [], globals: {} };
    let rows = [];
    try { rows = await fetchRows(csvUrl(source, attr(el, 'config') || '_config'), ttl); }
    catch (e) { return config; }
    rows.forEach((row) => {
      if (row.Tab === '*') {
        Object.keys(row).forEach((k) => { if (!CONFIG_ONLY.includes(k)) config.globals[k] = row[k]; });
      } else if (row.Tab) {
        config.tabs.push(tabDef(row.Tab, row));
      }
    });
    return config;
  }

  // Source tab name → its own (non-merged) config row.
  function indexTabs(tabs) {
    const byName = {};
    tabs.forEach((t) => { if (!t.isAggregate) byName[t.sourceTabs[0]] = t; });
    return byName;
  }

  const sourceTabsOf = (tabs) => Array.from(new Set(tabs.flatMap((t) => t.sourceTabs)));

  // ── Sorting ────────────────────────────────────────────────────────────────

  function sortRecords(records, listEl, tab) {
    const col = (tab && tab.sortCol) || attr(listEl, 'sort-col');
    if (!col) return records;
    const desc = ((tab && tab.sortCol && tab.sortDir) || attr(listEl, 'sort-dir')).toLowerCase() === 'desc';
    const type = ((tab && tab.sortCol && tab.sortType) || attr(listEl, 'sort-type') || 'text').toLowerCase();

    const keyOf = (record) => {
      const raw = record[col] || '';
      if (!raw) return null;
      if (type === 'number') { const n = parseFloat(raw.replace(/,/g, '')); return isNaN(n) ? null : n; }
      if (type === 'date') { const d = Date.parse(raw); return isNaN(d) ? null : d; }
      return raw.toLowerCase();
    };

    return records.slice().sort((a, b) => {
      const x = keyOf(a), y = keyOf(b);
      if (x === y) return 0;
      if (x === null) return 1;    // blanks last, whichever direction
      if (y === null) return -1;
      return (x < y ? -1 : 1) * (desc ? -1 : 1);
    });
  }

  // ── Search & filters ───────────────────────────────────────────────────────
  // One implementation, two vocabularies: lists use data-cell2-search / -filter / -reset,
  // maps the same names with a `map-` infix (data-cell2-map-search, …).

  const SEARCH_DEBOUNCE_MS = 250;

  function wireFilters(scope, p, records, tabOptions, onChange) {
    const searchEl = find(scope, p + 'search');
    const searchCols = parseList(attr(searchEl, p + 'search-cols'));
    const useOr = attr(scope, p + 'filter-logic').toLowerCase() === 'or';

    const filters = Array.from(scope.querySelectorAll('[' + A + p + 'filter],[' + A + p + 'filter-tabs]'))
      .map((select) => {
        const byTab = select.hasAttribute(A + p + 'filter-tabs');
        const col = attr(select, p + 'filter');
        const options = byTab ? tabOptions
          : Array.from(new Set(records.map((r) => r[col]).filter(Boolean))).sort()
              .map((v) => ({ value: v, label: v }));
        Array.from(select.options).slice(1).forEach((o) => o.remove());   // option 0 is the author's "All"
        options.forEach((o) => select.add(new Option(o.label, o.value)));
        if (select.hasAttribute(A + p + 'filter-multi')) select.multiple = true;
        select.addEventListener('change', () => onChange());
        return { select: select, col: col, byTab: byTab };
      });

    if (searchEl) {
      searchEl.addEventListener('input', debounce(onChange, SEARCH_DEBOUNCE_MS));
      const button = find(scope, p + 'search-btn');
      if (button) button.addEventListener('click', () => onChange());
    }

    function reset() {
      if (searchEl) searchEl.value = '';
      filters.forEach((f) => {
        Array.from(f.select.options).forEach((o) => { o.selected = false; });
        if (!f.select.multiple) f.select.selectedIndex = 0;
      });
    }

    const resetEl = find(scope, p + 'reset');
    if (resetEl) resetEl.addEventListener('click', () => { reset(); onChange({ reset: true }); });

    // Several values in one dropdown are OR-ed; dropdowns combine per data-cell2-[map-]filter-logic.
    function apply() {
      const query = searchEl ? searchEl.value.trim().toLowerCase() : '';
      const active = filters
        .map((f) => Object.assign({ values: Array.from(f.select.selectedOptions).map((o) => o.value.toLowerCase()).filter(Boolean) }, f))
        .filter((f) => f.values.length);

      const matches = (record) => (f) => f.byTab
        ? f.values.some((v) => parseList(v).includes((record._tab || '').toLowerCase()))   // a merged tab's value lists its sources
        : f.values.includes((record[f.col] || '').toLowerCase());

      return records.filter((record) => {
        if (query) {
          const cols = searchCols.length ? searchCols : Object.keys(record);
          if (!cols.some((c) => (record[c] || '').toLowerCase().includes(query))) return false;
        }
        if (!active.length) return true;
        return useOr ? active.some(matches(record)) : active.every(matches(record));
      });
    }

    return { apply: apply, reset: reset };
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  // Injected once. Everything inherits the host page's font and colour; borders are mixed from
  // currentColor so embeds sit on light and dark pages alike. Theme with the --c2-* variables.

  const CSS = [
    '@keyframes cell2site-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}',
    '.cell2site-skeleton-item{width:100%;height:56px;border-radius:8px;margin-bottom:8px;',
    'background:linear-gradient(90deg,var(--cell2site-sk-base,#e8e8e8) 25%,var(--cell2site-sk-shine,#d0d0d0) 50%,var(--cell2site-sk-base,#e8e8e8) 75%);',
    'background-size:600px 100%;animation:cell2site-shimmer 1.4s ease-in-out infinite}',
    '.cell2site-map-marker div{width:100%;height:100%;display:flex;align-items:center;justify-content:center;',
    'border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.25);font-size:18px;cursor:pointer}',
    '.c2{--c2-gap:16px;--c2-radius:10px;--c2-accent:currentColor;',
    '--c2-line:color-mix(in srgb,currentColor 15%,transparent);--c2-soft:color-mix(in srgb,currentColor 5%,transparent)}',
    '.c2 *{box-sizing:border-box}',
    '.c2-search{width:100%;margin-bottom:var(--c2-gap);padding:9px 12px;border:1px solid var(--c2-line);',
    'border-radius:var(--c2-radius);background:transparent;color:inherit;font:inherit}',
    '.c2-items{display:grid;gap:var(--c2-gap)}',
    '.c2-cards .c2-items{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}',
    '.c2-item{padding:16px;border:1px solid var(--c2-line);border-radius:var(--c2-radius);overflow:hidden}',
    '.c2-list .c2-item{display:flex;gap:16px;align-items:flex-start}',
    '.c2-body{flex:1;min-width:0}',
    '.c2-img img{display:block;object-fit:cover}',
    '.c2-list .c2-img img{width:72px;height:72px;border-radius:calc(var(--c2-radius) - 4px)}',
    '.c2-cards .c2-img{margin:-16px -16px 14px}.c2-cards .c2-img img{width:100%;aspect-ratio:16/10}',
    '.c2-title{display:block;font-weight:600;font-size:1.05em;color:inherit;text-decoration:none}',
    'a.c2-title[href]{color:var(--c2-accent)}a.c2-title[href]:hover{text-decoration:underline}',
    '.c2-text{margin:.35em 0 0;opacity:.8;white-space:pre-line}',
    '.c2-meta{display:grid;gap:2px;margin-top:.7em;font-size:.85em}.c2-meta b{margin-right:.4em;opacity:.6}',
    '.c2-table-wrap{overflow-x:auto;border:1px solid var(--c2-line);border-radius:var(--c2-radius)}',
    '.c2 table{width:100%;border-collapse:collapse}',
    '.c2 th,.c2 td{padding:10px 14px;text-align:left;vertical-align:top;border-bottom:1px solid var(--c2-line)}',
    '.c2 th{background:var(--c2-soft);font-weight:600;white-space:nowrap}.c2 tr:last-child td{border-bottom:0}',
    '.c2-map{height:var(--c2-map-height,480px);border-radius:var(--c2-radius);overflow:hidden}',
    '.c2 .leaflet-popup .c2-item{padding:0;border:0;color:#222}',
    '.c2-note{margin:0;padding:16px;border:1px dashed var(--c2-line);border-radius:var(--c2-radius);opacity:.8}',
  ].join('');

  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.prepend(style);   // first in <head>, so the host page's own CSS wins
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  // A [data-cell2-loading] element is the author's own loader; otherwise shimmer rows are shown.

  function showLoader(el) {
    const custom = find(el, 'loading');
    if (custom) return setVisible(custom, true);
    injectStyles();
    const count = parseInt(attr(el, 'loading-count'), 10) || 6;
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'cell2site-skeleton-item';
      el.appendChild(row);
    }
  }

  function hideLoader(el) {
    setVisible(find(el, 'loading'), false);
    el.querySelectorAll('.cell2site-skeleton-item').forEach((row) => row.remove());
  }

  // ── List ───────────────────────────────────────────────────────────────────

  const mounted = new WeakSet();   // elements already initialised — init() may be called again
  const maps = {};                 // data-cell2-map-id → { nameCol, flyToName }

  // Count, empty, error, search and filter elements may sit inside the list itself or anywhere
  // in an enclosing [data-cell2-wrapper] — useful when the list element is a grid.
  const scopeOf = (listEl) => listEl.closest('[' + A + 'wrapper]') || listEl;

  // ctx: { tab, tabsByName, globals, accordion } — all optional, supplied by tabs.
  function mountList(listEl, records, ctx) {
    ctx = ctx || {};
    const template = find(listEl, 'item');
    if (!template) return console.warn(LOG, 'No [data-cell2-item] inside', listEl);
    mounted.add(listEl);

    const scope = scopeOf(listEl);
    const anchor = document.createComment('cell2site');   // marks where items go
    template.replaceWith(anchor);
    template.removeAttribute(A + 'item');
    template.style.display = '';

    const limit = parseInt(attr(listEl, 'item-limit'), 10) || 0;
    const sorted = sortRecords(records, listEl, ctx.tab);
    const tabOptions = Array.from(new Set(sorted.map((r) => r._tab).filter(Boolean))).map((name) => {
      const tab = ctx.tabsByName && ctx.tabsByName[name];
      return { value: name, label: (tab && tab.label) || name };
    });
    const filters = wireFilters(scope, '', sorted, tabOptions, draw);
    const tabLabel = ctx.tab ? ctx.tab.label : '';
    let items = [];

    function build(record) {
      const item = template.cloneNode(true);
      const sourceTab = ctx.tabsByName && ctx.tabsByName[record._tab];
      fillMeta(item, { 'tab-title': tabLabel, 'tab-label': (sourceTab && sourceTab.label) || tabLabel });
      fillFields(item, record);
      applyVars(item, [record, ctx.tab && ctx.tab.row, sourceTab && sourceTab.row, ctx.globals]);
      wireAccordion(item, ctx.accordion || accordionOf(listEl));
      wireMapLink(item, record, listEl);
      item.classList.add('is-ready');
      return item;
    }

    // The limit applies after filtering, so a search still reaches every row.
    function draw() {
      const rows = limit ? filters.apply().slice(0, limit) : filters.apply();
      items.forEach((item) => item.remove());
      items = rows.map(build);
      anchor.before.apply(anchor, items);
      findAll(scope, 'count').forEach((el) => { el.textContent = rows.length; });
      setVisible(find(scope, 'empty'), rows.length === 0);
    }

    setVisible(find(scope, 'loading'), false);
    draw();
    listEl.dispatchEvent(new CustomEvent('cell2:ready', { bubbles: true, detail: { records: sorted } }));
  }

  async function loadList(listEl) {
    const source = sourceOf(listEl);
    if (!source) return;
    const scope = scopeOf(listEl);
    setVisible(find(scope, 'empty'), false);
    setVisible(find(scope, 'error'), false);
    listEl.classList.add('is-loading');
    showLoader(listEl);
    try {
      const rows = await fetchTab(source, attr(listEl, 'sheet'), ttlOf(listEl));
      hideLoader(listEl);
      mountList(listEl, rows);
    } catch (err) {
      hideLoader(listEl);
      fail(scope, err);
    }
    listEl.classList.remove('is-loading');
  }

  // Clicking an item of a list with data-cell2-map-ref flies that map to the matching marker.
  // The map is looked up on click, so it does not matter which of the two loads first.
  function wireMapLink(item, record, listEl) {
    const ref = attr(listEl, 'map-ref');
    if (!ref) return;
    const trigger = find(item, 'map-trigger') || item;
    trigger.style.cursor = 'pointer';
    trigger.addEventListener('click', (e) => {
      if (trigger === item && e.target.closest('[aria-expanded]')) return;   // that click toggled the accordion
      const map = maps[ref];
      if (map) map.flyToName(record[map.nameCol]);
    });
  }

  // ── Accordion ──────────────────────────────────────────────────────────────
  // Items whose template contains a trigger and a panel open and close. The default selectors
  // are Relume's Webflow class names; override them on the list or tabs wrapper.

  function accordionOf(el) {
    return {
      trigger: attr(el, 'accordion-trigger') || '.accordion2_top',
      panel: attr(el, 'accordion-panel') || '.accordion2_bottom',
      icon: attr(el, 'accordion-icon') || '.accordion2_icon',
    };
  }

  function wireAccordion(item, sel) {
    const trigger = item.querySelector(sel.trigger);
    const panel = item.querySelector(sel.panel);
    if (!trigger || !panel) return;

    // Webflow interactions bound to the template do not survive cloning; drop their dead hooks.
    item.querySelectorAll('[data-w-id]').forEach((el) => el.removeAttribute('data-w-id'));

    panel.style.cssText = 'overflow:hidden;height:0px;transition:height .3s ease';
    trigger.setAttribute('aria-expanded', 'false');
    let open = false;

    // Release to auto once open so content can reflow — but only if still open: a quick
    // open-then-close used to end with the panel springing back open.
    panel.addEventListener('transitionend', () => { if (open) panel.style.height = 'auto'; });

    onActivate(trigger, () => {
      open = !open;
      panel.style.height = panel.scrollHeight + 'px';   // a pixel start value; auto does not animate
      if (!open) { panel.getBoundingClientRect(); panel.style.height = '0px'; }   // reflow, then collapse
      trigger.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
      const icon = trigger.querySelector(sel.icon);
      if (icon) {
        icon.style.transition = 'transform .3s ease';
        icon.style.transform = open ? 'rotate(45deg)' : '';
      }
    });
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  // One link and one pane are cloned per tab. Class names follow Webflow's Tabs element
  // (w--current, w--tab-active) so its styling applies; any HTML works.

  async function loadTabs(wrapper) {
    const source = sourceOf(wrapper);
    if (!source) return;
    const linkTpl = find(wrapper, 'tab-link');
    const paneTpl = find(wrapper, 'tab-content');
    if (!linkTpl || !paneTpl) {
      return console.warn(LOG, 'Tabs need [data-cell2-tab-link] and [data-cell2-tab-content]', wrapper);
    }
    linkTpl.style.display = paneTpl.style.display = 'none';

    const ttl = ttlOf(wrapper);
    const config = await fetchConfig(source, wrapper, ttl);
    const tabs = config.tabs.length ? config.tabs : parseList(attr(wrapper, 'sheets')).map((name) => tabDef(name));
    if (!tabs.length) {
      console.warn(LOG, 'No tabs — add a _config tab or data-cell2-sheets', wrapper);
      return showError(wrapper, 'No tabs configured');
    }

    applyVars(wrapper, [config.globals], '[' + A + 'tab-link],[' + A + 'tab-content]');

    // One failed tab should not take the others down with it.
    const rowsByTab = {};
    await Promise.all(sourceTabsOf(tabs).map(async (name) => {
      try { rowsByTab[name] = await fetchTab(source, name, ttl); }
      catch (err) { console.error(LOG, 'Failed to load tab "' + name + '"', err); rowsByTab[name] = []; }
    }));

    const ctx = { tabsByName: indexTabs(tabs), globals: config.globals, accordion: accordionOf(wrapper) };
    const shownColumns = fieldNames(paneTpl);
    const links = [], panes = [];
    let activeIndex = 0;

    tabs.forEach((tab) => {
      let rows = tab.sourceTabs.flatMap((name) => rowsByTab[name] || []);
      if (tab.isAggregate) rows = dedupe(rows, shownColumns);
      if (tab.active) activeIndex = links.length;

      const id = uid();
      const meta = { 'tab-title': tab.label, 'tab-label': tab.label, 'tab-description': tab.description };
      const clone = (tpl, marker, role) => {
        const el = tpl.cloneNode(true);
        el.removeAttribute(A + marker);
        el.style.display = '';
        el.setAttribute('data-w-tab', id);
        el.setAttribute('role', role);
        fillMeta(el, meta);
        fillFields(el, tab.row, 'tab-field');
        applyVars(el, [tab.row, config.globals]);
        tpl.before(el);
        return el;
      };

      const link = clone(linkTpl, 'tab-link', 'tab');
      link.setAttribute('aria-controls', id);
      findAll(link, 'tab-count').forEach((el) => { el.textContent = rows.length; });

      const pane = clone(paneTpl, 'tab-content', 'tabpanel');
      pane.id = id;
      const listEl = find(pane, 'list');
      if (listEl) mountList(listEl, rows, Object.assign({ tab: tab }, ctx));

      links.push(link);
      panes.push(pane);
    });

    linkTpl.remove();
    paneTpl.remove();

    const activate = (index) => {
      links.forEach((link, i) => {
        link.classList.toggle('w--current', i === index);
        link.setAttribute('aria-selected', String(i === index));
      });
      panes.forEach((pane, i) => {
        pane.classList.toggle('w--tab-active', i === index);
        pane.setAttribute('aria-hidden', String(i !== index));
        setVisible(pane, i === index);
      });
    };
    links.forEach((link, i) => onActivate(link, () => activate(i)));
    activate(activeIndex);
    wrapper.dispatchEvent(new CustomEvent('cell2:ready', { bubbles: true, detail: { tabs: tabs } }));
  }

  // ── Map ────────────────────────────────────────────────────────────────────

  const MARKER = { color: '#6b7280', icon: '📍', size: 36 };
  const IS_MOBILE = window.innerWidth <= 767;
  const ZOOM = { start: IS_MOBILE ? 2 : 3, flyTo: IS_MOBILE ? 8 : 12, locate: 6 };
  const CENTER = [20, 0];

  const TILES = {
    'osm': ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors', maxZoom: 19 }],
    'carto-light': ['https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 }],
    'carto-dark': ['https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 }],
    'esri-street': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri', maxZoom: 19 }],
    'esri-topo': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri', maxZoom: 19 }],
  };

  // Leaflet and MarkerCluster are fetched only when a page actually contains a map.
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
  let leaflet = null;

  function loadLeaflet() {
    const load = (tag, urlProp, url) => new Promise((resolve, reject) => {
      if (document.querySelector(tag + '[' + urlProp + '="' + url + '"]')) return resolve();
      const el = document.createElement(tag);
      if (tag === 'link') el.rel = 'stylesheet';
      el[urlProp] = url;
      el.onload = resolve;
      el.onerror = () => reject(new Error('Map library failed to load'));
      document.head.appendChild(el);
    });
    leaflet = leaflet || Promise.all([
      load('link', 'href', CDN + 'leaflet/1.9.4/leaflet.min.css'),
      load('link', 'href', CDN + 'leaflet.markercluster/1.5.3/MarkerCluster.min.css'),
      load('link', 'href', CDN + 'leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css'),
    ])
      .then(() => load('script', 'src', CDN + 'leaflet/1.9.4/leaflet.min.js'))
      .then(() => load('script', 'src', CDN + 'leaflet.markercluster/1.5.3/leaflet.markercluster.min.js'));
    return leaflet;
  }

  // Colour and icon: the row's own Color / Icon column, then its tab's config row, then the default.
  function markerIcon(record, tab) {
    const dot = document.createElement('div');
    dot.style.background = record.Color || (tab && tab.color) || MARKER.color;
    dot.append(sanitize(record.Icon || (tab && tab.icon) || MARKER.icon));
    const s = MARKER.size;
    return L.divIcon({
      html: dot, className: 'cell2site-map-marker',
      iconSize: [s, s], iconAnchor: [s / 2, s], popupAnchor: [0, -s],
    });
  }

  async function mountMap(wrapper) {
    const source = sourceOf(wrapper);
    if (!source) return;
    const mapEl = find(wrapper, 'map');
    if (!mapEl) return console.warn(LOG, 'No [data-cell2-map] inside', wrapper);
    const card = find(wrapper, 'map-card');
    if (card) card.remove();   // kept as a detached template for popups

    const col = {
      lat: attr(wrapper, 'col-lat') || 'Latitude',
      lng: attr(wrapper, 'col-lng') || 'Longitude',
      name: attr(wrapper, 'col-name') || 'Name',
    };
    const ttl = ttlOf(wrapper);
    setVisible(find(wrapper, 'empty'), false);
    setVisible(find(wrapper, 'error'), false);
    injectStyles();

    let config, records;
    try {
      await loadLeaflet();
      config = await fetchConfig(source, wrapper, ttl);
      // With a config sheet the map shows every tab it lists; otherwise the tab(s) named on the wrapper.
      const names = config.tabs.length ? sourceTabsOf(config.tabs) : parseList(attr(wrapper, 'sheet'));
      records = (await Promise.all((names.length ? names : ['']).map((n) => fetchTab(source, n, ttl)))).flat();
    } catch (err) {
      return fail(wrapper, err);
    }

    const center = parseList(attr(mapEl, 'map-center')).map(parseFloat);
    const start = center.length === 2 && !center.some(isNaN) ? center : CENTER;
    const zoom = parseFloat(attr(mapEl, 'map-zoom')) || ZOOM.start;
    const refit = attr(mapEl, 'map-refit').toLowerCase() !== 'false';
    const tiles = TILES[attr(mapEl, 'map-tiles').toLowerCase()] || TILES.osm;

    const map = L.map(mapEl, { center: start, zoom: zoom });
    L.tileLayer(tiles[0], tiles[1]).addTo(map);
    const cluster = L.markerClusterGroup({ maxClusterRadius: parseInt(attr(mapEl, 'map-cluster-radius'), 10) || 80 });
    map.addLayer(cluster);
    // The container often gets its final size (tab reveal, late CSS) only after this tick.
    setTimeout(() => map.invalidateSize({ animate: false }), 0);

    applyVars(wrapper, [config.globals]);
    const tabsByName = indexTabs(config.tabs);
    const located = dedupe(
      records.filter((r) => !isNaN(toNumber(r[col.lat])) && !isNaN(toNumber(r[col.lng]))),
      fieldNames(card)
    );
    if (!located.length) {
      console.warn(LOG, 'No rows with valid "' + col.lat + '" / "' + col.lng + '" values', wrapper);
      return setVisible(find(wrapper, 'empty'), true);
    }

    function popup(record) {
      if (!card) {
        const name = document.createElement('strong');
        name.textContent = record[col.name] || '';
        return name;
      }
      const tab = tabsByName[record._tab];
      const el = card.cloneNode(true);
      el.removeAttribute(A + 'map-card');
      el.style.display = '';
      fillFields(el, record);
      fillMeta(el, { 'tab-label': (tab && tab.label) || record._tab, 'tab-name': record._tab });
      applyVars(el, [record, tab && tab.row, config.globals]);
      return el;
    }

    // Popups are built on first open, not up front — a thousand rows would mean a thousand clones.
    const markers = new Map(located.map((record) => {
      const marker = L.marker([toNumber(record[col.lat]), toNumber(record[col.lng])],
        { icon: markerIcon(record, tabsByName[record._tab]) });
      marker.bindPopup(() => popup(record), { maxWidth: 360 });
      return [record, marker];
    }));

    function draw(change) {
      const visible = filters.apply().map((record) => markers.get(record));
      cluster.clearLayers();
      cluster.addLayers(visible);
      findAll(wrapper, 'count').forEach((el) => { el.textContent = visible.length; });
      setVisible(find(wrapper, 'empty'), visible.length === 0);
      if (change && change.reset) return map.setView(start, zoom);
      if (change !== 'initial' && refit && visible.length) {
        map.fitBounds(L.featureGroup(visible).getBounds(), { padding: [32, 32], maxZoom: 10 });
      }
    }

    const tabOptions = config.tabs.length
      ? config.tabs.map((t) => ({ value: t.sourceTabs.join(','), label: t.label }))
      : Array.from(new Set(located.map((r) => r._tab))).map((t) => ({ value: t, label: t }));
    const filters = wireFilters(wrapper, 'map-', located, tabOptions, draw);
    draw('initial');   // keep the author's centre and zoom until someone filters

    const locate = find(wrapper, 'map-locate');
    if (locate && navigator.geolocation) {
      locate.addEventListener('click', () => navigator.geolocation.getCurrentPosition(
        (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], ZOOM.locate, { duration: 1.5 }),
        () => {}   // permission denied — nothing useful to show
      ));
    }

    const mapId = attr(wrapper, 'map-id');
    if (mapId) {
      maps[mapId] = {
        nameCol: col.name,
        flyToName: function (name, toZoom) {
          const record = located.find((r) => r[col.name] === name);
          if (!record) return;
          const marker = markers.get(record);
          filters.reset();
          draw('initial');
          map.flyTo(marker.getLatLng(), toZoom || ZOOM.flyTo, { duration: 1 });
          // A marker still inside a cluster cannot open its popup; zoomToShowLayer splits it out first.
          map.once('moveend', () => cluster.zoomToShowLayer(marker, () => marker.openPopup()));
        },
      };
    }
    wrapper.dispatchEvent(new CustomEvent('cell2:ready', { bubbles: true, detail: { records: located, map: map } }));
  }

  // ── Embeds ─────────────────────────────────────────────────────────────────
  // <div data-cell2-embed="list|cards|table|map" data-cell2-id="…"> needs no markup of its own:
  // columns are guessed from their names, a template is generated, and it is then mounted
  // through the same list and map code as hand-written markup.

  const ROLES = {
    title: ['title', 'name', 'question', 'headline'],
    text: ['description', 'summary', 'answer', 'details', 'text', 'notes', 'about', 'bio'],
    image: ['image', 'photo', 'picture', 'logo', 'thumbnail', 'img'],
    link: ['url', 'link', 'website', 'web'],
    lat: ['latitude', 'lat'],
    lng: ['longitude', 'lng', 'lon', 'long'],
  };

  // data-cell2-col-<role> overrides the guess; the title falls back to the first unclaimed column.
  function guessColumns(el, headers) {
    const cols = {};
    Object.keys(ROLES).forEach((role) => {
      cols[role] = attr(el, 'col-' + role) || headers.find((h) => ROLES[role].includes(h.toLowerCase())) || '';
    });
    const claimed = Object.values(cols);
    cols.title = cols.title || headers.find((h) => !claimed.includes(h)) || '';
    return cols;
  }

  // The title doubles as the link: with no URL in the row the href is dropped and it reads as text.
  function itemTemplate(marker, cols, extras) {
    const f = (col) => A + 'field="' + esc(col) + '"';
    return '<div class="c2-item" ' + A + marker + '>' +
      (cols.image ? '<div class="c2-img" ' + A + 'field-wrapper><img alt="" loading="lazy" ' +
        A + 'field-attr="src:' + esc(cols.image) + '"></div>' : '') +
      '<div class="c2-body">' +
      '<a class="c2-title" target="_blank" rel="noopener" ' + f(cols.title) +
        (cols.link ? ' ' + A + 'field-attr="href:' + esc(cols.link) + '"' : '') + '></a>' +
      (cols.text ? '<p class="c2-text" ' + f(cols.text) + '></p>' : '') +
      '<div class="c2-meta">' + extras.map((col) =>
        '<div ' + A + 'field-wrapper><b>' + esc(col) + '</b><span ' + f(col) + '></span></div>').join('') +
      '</div></div></div>';
  }

  const note = (text) => '<p class="c2-note">' + esc(text) + '</p>';

  async function mountEmbed(el) {
    const kind = attr(el, 'embed').toLowerCase() || 'list';
    const source = sourceOf(el);
    if (!source) return;
    injectStyles();
    el.classList.add('c2', 'c2-' + kind);

    let rows;
    showLoader(el);
    try { rows = await fetchTab(source, attr(el, 'sheet'), ttlOf(el)); }
    catch (err) { console.error(LOG, err); el.innerHTML = note(err.message); return; }
    if (!rows.length) { el.innerHTML = note('This sheet has no rows yet.'); return; }

    const headers = Object.keys(rows[0]).filter((h) => h[0] !== '_');
    const cols = guessColumns(el, headers);
    const claimed = Object.values(cols).concat('Color', 'Icon');
    const extras = headers.filter((h) => !claimed.includes(h));
    const states = '<p class="c2-note" ' + A + 'empty style="display:none">No matches.</p>' +
      '<p class="c2-note" ' + A + 'error style="display:none"><span ' + A + 'field="message"></span></p>';

    if (kind === 'map') {
      if (!cols.lat || !cols.lng) { el.innerHTML = note('A map needs Latitude and Longitude columns.'); return; }
      ['lat', 'lng'].forEach((role) => el.setAttribute(A + 'col-' + role, cols[role]));
      if (!attr(el, 'col-name')) el.setAttribute(A + 'col-name', cols.title);
      el.innerHTML = '<div class="c2-map" ' + A + 'map></div>' + itemTemplate('map-card', cols, extras) + states;
      const mapEl = find(el, 'map');
      ['map-tiles', 'map-center', 'map-zoom', 'map-cluster-radius', 'map-refit'].forEach((name) => {
        if (attr(el, name)) mapEl.setAttribute(A + name, attr(el, name));
      });
      return mountMap(el);
    }

    // Search appears once a list is long enough to need it; data-cell2-embed-search forces it on or off.
    const wantSearch = attr(el, 'embed-search') || String(rows.length > 10);
    const search = wantSearch === 'false' ? '' :
      '<input class="c2-search" type="search" placeholder="Search…" aria-label="Search" ' + A + 'search>';
    const body = kind === 'table'
      ? '<div class="c2-table-wrap"><table><thead><tr>' +
          headers.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody ' + A + 'list><tr ' + A + 'item>' +
          headers.map((h) => '<td ' + A + 'field="' + esc(h) + '"></td>').join('') + '</tr></tbody></table></div>'
      : '<div class="c2-items" ' + A + 'list>' + itemTemplate('item', cols, extras) + '</div>';

    el.setAttribute(A + 'wrapper', '');
    el.innerHTML = search + body + states;
    const listEl = find(el, 'list');
    ['sort-col', 'sort-dir', 'sort-type', 'item-limit', 'map-ref'].forEach((name) => {
      if (attr(el, name)) listEl.setAttribute(A + name, attr(el, name));
    });
    mountList(listEl, rows);
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  // Safe to call again after adding markup; elements already mounted are skipped.
  function init(root) {
    root = root || document;
    const each = (name, mount, inside) => findAll(root, name).forEach((el) => {
      if (mounted.has(el) || (inside && el.closest(inside))) return;
      mounted.add(el);
      mount(el);
    });
    each('tabs', loadTabs);
    each('list', loadList, '[' + A + 'tabs],[' + A + 'embed]');   // those lists are mounted by their parent
    each('map-wrapper', mountMap);
    each('embed', mountEmbed);
  }

  window.cell2site = { version: VERSION, init: init, clearCache: clearCache, maps: maps };
  window.__cell2siteMaps = maps;   // pre-1.3 name, kept for pages that call flyToName themselves

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
