/**
 * cell2site.js  v1.2.1
 * Cell2 — Google Sheets → Webflow CMS Lists, Tabs & Leaflet Map
 * https://cell2.site
 *
 * Single-file combination of cell2-cms.js + cell2-map.js.
 * No build step, no API keys. One tag replaces both:
 *
 *   <script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.2.0/cell2site.js"></script>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS — QUICK START
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Share your sheet:  click Share → set access to "Anyone with the link" → Viewer
 * 2. Mark up a list:
 *      <div data-cell2-list data-cell2-id="SHEET_ID" data-cell2-sheet="Tab Name">
 *        <div data-cell2-item>
 *          <h3 data-cell2-field="Title"></h3>
 *          <p  data-cell2-field="Description"></p>
 *        </div>
 *      </div>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP — QUICK START
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   <div data-cell2-map-wrapper data-cell2-id="SHEET_ID" data-cell2-sheet="Places">
 *     <div data-cell2-map style="height:480px"></div>
 *   </div>
 *
 * Rows need latitude + longitude columns (default names: Latitude, Longitude).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIG SHEET  (optional — shared by CMS + Map)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tab name: _config  (or data-cell2-config="YourTab")
 *
 *   Tab          Single name → one tab / comma list → aggregate / * → global vars
 *   Label        Display name
 *   Description  Exposed via data-cell2-meta="tab-description"
 *   Color        Hex (#ef4444) — used by map for markers
 *   Icon         Emoji / text — used by map for markers
 *   Sort By      Column name to sort that tab's list by
 *   Sort Dir     asc | desc
 *   Sort Type    text | number | date
 *   Active       TRUE / ✓ / yes / 1 — marks the default-open tab
 *   [any col]    Usable as a CSS var source via data-cell2-var
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS WRAPPER ATTRIBUTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tabs wrapper (Webflow Tabs root):
 *   data-cell2-tabs
 *   data-cell2-id
 *   data-cell2-config              config tab name (default: _config)
 *   data-cell2-sheets              fallback tab list (ignored if config present)
 *   data-cell2-cache-ttl           cache seconds (default: 60)
 *   data-cell2-accordion-trigger   accordion trigger selector (default: .accordion2_top)
 *   data-cell2-accordion-panel     accordion panel selector  (default: .accordion2_bottom)
 *   data-cell2-accordion-icon      accordion icon selector   (default: .accordion2_icon)
 *
 * Standalone list:
 *   data-cell2-list
 *   data-cell2-id
 *   data-cell2-sheet               tab name (default: Sheet1)
 *   data-cell2-sort-col
 *   data-cell2-sort-dir            asc | desc
 *   data-cell2-sort-type           text | number | date
 *   data-cell2-item-limit          show only first N records after sort
 *   data-cell2-map-ref             map id to link clicks to
 *   data-cell2-cache-ttl
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS TEMPLATES & ELEMENTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tab link template (inside .w-tab-menu):
 *   data-cell2-tab-link
 *   data-cell2-meta="tab-title|tab-label|tab-description"
 *   data-cell2-tab-count
 *
 * Tab content template (inside .w-tab-content):
 *   data-cell2-tab-content
 *   data-cell2-meta="tab-title|tab-label|tab-description"
 *   (contains a data-cell2-list with a data-cell2-item)
 *
 * List item template:
 *   data-cell2-item
 *   data-cell2-meta="tab-label"      per-record source tab label
 *
 * Inside any item / template:
 *   data-cell2-field="Column"            → textContent
 *   data-cell2-field-html="Column"       → innerHTML
 *   data-cell2-field-attr="attr:Column"  → sets attribute (e.g. href:URL, src:Image)
 *   data-cell2-field-wrapper             nearest ancestor removed if field blank
 *   data-cell2-show-if="Column"          element removed if value falsy
 *   data-cell2-var="name:Column; ..."    CSS custom property (-- auto-prefixed)
 *   data-cell2-map-trigger               specific click target for map linking
 *
 * List-level helpers (siblings of data-cell2-item):
 *   data-cell2-count
 *   data-cell2-empty
 *   data-cell2-error  (data-cell2-field="message" inside gets the error text)
 *   data-cell2-loading
 *   data-cell2-loading-count="6"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP WRAPPER ATTRIBUTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-wrapper
 *   data-cell2-map-id="my-map"         id for list→map linking
 *   data-cell2-id="SHEET_ID"
 *   data-cell2-sheet="Tab Name"
 *   data-cell2-config="_config"
 *   data-cell2-col-lat="Latitude"
 *   data-cell2-col-lng="Longitude"
 *   data-cell2-col-name="Name"
 *   data-cell2-map-filter-logic="and"  and | or across filter dropdowns
 *   data-cell2-cache-ttl
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP ELEMENT  (data-cell2-map — must have a CSS height)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-zoom="3"
 *   data-cell2-map-center="20,0"
 *   data-cell2-map-tiles="osm"         osm | carto-light | carto-dark | esri-street | esri-topo
 *   data-cell2-map-cluster-radius="80"
 *   data-cell2-map-refit="true"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP POPUP CARD  (data-cell2-map-card)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-field="Column"
 *   data-cell2-field-html="Column"
 *   data-cell2-field-attr="src:Column"
 *   data-cell2-field-wrapper
 *   data-cell2-show-if="Column"
 *   data-cell2-meta="tab-label|tab-name"
 *   data-cell2-var="name:Column"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP FILTER CONTROLS  (inside the map wrapper)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-search              search input (debounced 250ms)
 *   data-cell2-map-search-cols="A, B"  limit search to these columns
 *   data-cell2-map-search-btn          trigger search immediately on click
 *   data-cell2-map-reset               clear all filters + reset view
 *   data-cell2-map-filter="Column"     dropdown — auto-populated
 *   data-cell2-map-filter-tabs         populate dropdown from tab labels
 *   data-cell2-map-filter-multi        multi-select dropdown
 *   data-cell2-map-locate              click → geolocate → fly to user
 *   data-cell2-count
 *   data-cell2-empty
 *   data-cell2-error
 *
 * AND/OR across dropdowns: data-cell2-map-filter-logic on wrapper (default: and).
 * Within one multi-select: always OR.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LIST → MAP LINKING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-id="id"   on [data-cell2-map-wrapper]
 *   data-cell2-map-ref="id"  on [data-cell2-list]
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CSS VARIABLES  (data-cell2-var)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-var="my-color:Color; my-icon:Icon"   sets --my-color, --my-icon
 *
 * Resolution per variable (first hit wins):
 *   1. item record column
 *   2. aggregate / active config row column  (CMS tabs)
 *   3. individual tab config row column
 *   4. global * row
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 *  • Sheet must be shared: "Anyone with the link" → Viewer (no publishing required)
 *  • Column names are case-sensitive, must match the header row exactly
 *  • All-blank rows are skipped
 *  • Lat/lng must be decimals; invalid rows are skipped by the map
 *  • Multiple map wrappers per page are supported
 *  • Append ?clearcache to any URL to wipe cached data
 *  • No external libraries or API keys required
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED — FETCH CACHE
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Shared via window.__cell2siteCache.
  // Two layers: in-memory (fast, per page session) + localStorage (cross-reload).

  var _cache    = window.__cell2siteCache = window.__cell2siteCache || {};
  var TTL_MS    = 60 * 1000;        // in-memory default — 60s
  var LS_TTL_MS = 60 * 60 * 1000;   // localStorage default — 1h
  var LS_PREFIX = 'cell2site_cache_';

  // ?clearcache / #clearcache → wipe everything
  (function () {
    var hit = location.search.indexOf('clearcache') !== -1 ||
              location.hash.indexOf('clearcache') !== -1;
    if (!hit) return;
    Object.keys(_cache).forEach(function (k) { delete _cache[k]; });
    try {
      Object.keys(localStorage)
        .filter(function (k) { return k.indexOf(LS_PREFIX) === 0; })
        .forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    console.log('[cell2site] caches cleared');
  })();

  async function cachedFetch(url, ttlMs) {
    var memTtl = ttlMs || TTL_MS;
    var lsTtl  = ttlMs ? ttlMs * 60 : LS_TTL_MS;   // localStorage holds 60× longer
    var now    = Date.now();

    var entry = _cache[url];
    if (entry && (now - entry.ts) < memTtl) return entry.data;

    try {
      var stored = localStorage.getItem(LS_PREFIX + url);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && (now - parsed.ts) < lsTtl) {
          _cache[url] = { ts: now, data: parsed.data };
          return parsed.data;
        }
      }
    } catch (e) {}

    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
    var data = rowsToObjects(parseCSV(await res.text()));

    _cache[url] = { ts: now, data: data };
    try { localStorage.setItem(LS_PREFIX + url, JSON.stringify({ ts: now, data: data })); } catch (e) {}
    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED — UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function uid() { return 'c2-' + Math.random().toString(36).slice(2, 9); }

  function csvUrl(sheetId, sheetName) {
    return 'https://docs.google.com/spreadsheets/d/' + sheetId +
      '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(sheetName);
  }

  function parseList(attr) {
    if (!attr) return [];
    return attr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function isTruthy(val) {
    if (!val) return false;
    var v = val.trim().toLowerCase();
    return v === 'true' || v === 'yes' || v === '1' || v === '✓' || v === 'x';
  }

  function ttlFromAttr(el) {
    var raw = el && el.getAttribute('data-cell2-cache-ttl');
    var n = raw ? parseInt(raw, 10) : 0;
    return (n && !isNaN(n)) ? n * 1000 : 0;   // 0 = use default
  }

  function parseCSV(text) {
    var rows = [], row = [], field = '', inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\r' && next === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; }
        else if (ch === '\n' || ch === '\r') { row.push(field); field = ''; rows.push(row); row = []; }
        else { field += ch; }
      }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToObjects(rows) {
    if (rows.length < 2) return [];
    var headers = rows[0].map(function (h) { return h.trim(); });
    var records = [];
    for (var i = 1; i < rows.length; i++) {
      var obj = {}, hasValue = false;
      headers.forEach(function (h, idx) {
        var val = (rows[i][idx] || '').trim();
        obj[h] = val;
        if (val) hasValue = true;
      });
      if (hasValue) records.push(obj);
    }
    return records;
  }

  function setVisible(el, visible) { if (el) el.style.display = visible ? '' : 'none'; }

  function showError(scopeEl, message) {
    var errEl = scopeEl.querySelector('[data-cell2-error]');
    if (!errEl) return;
    var msgEl = errEl.querySelector('[data-cell2-field="message"]');
    if (msgEl && message) msgEl.textContent = message;
    setVisible(errEl, true);
  }

  function getVisibleFields(templateEl) {
    if (!templateEl) return [];
    var fields = [];
    templateEl.querySelectorAll('[data-cell2-field], [data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field') || el.getAttribute('data-cell2-field-html');
      if (key && key !== 'message' && fields.indexOf(key) === -1) fields.push(key);
    });
    return fields;
  }

  function deduplicateRecords(records, visibleFields) {
    if (!visibleFields.length) return records;
    var seen = {};
    return records.filter(function (record) {
      var fp = visibleFields.map(function (f) { return (record[f] || '').toLowerCase(); }).join('||');
      if (seen[fp]) return false;
      seen[fp] = true;
      return true;
    });
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var a = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, a); }, wait);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED — CSS VAR RESOLUTION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Unified 5-param signature:
  //   resolveVars(el, itemRecord, configRow, globalVars, individualConfigRow)
  //
  // Resolution order (first hit wins):
  //   1. itemRecord column
  //   2. configRow._row column     (aggregate/active tab config — CMS tabs)
  //   3. individualConfigRow._row column   (per-record source tab config)
  //   4. globalVars column         (* row)
  //
  // Map callers pass null for configRow (no aggregate concept on the map side).

  function resolveVars(el, itemRecord, configRow, globalVars, individualConfigRow) {
    var attr = el.getAttribute('data-cell2-var');
    if (!attr) return;

    var aggregateRaw  = configRow && configRow._row ? configRow._row : (configRow || {});
    var individualRaw = individualConfigRow && individualConfigRow._row
      ? individualConfigRow._row : (individualConfigRow || {});

    attr.split(';').forEach(function (pair) {
      var idx = pair.indexOf(':');
      if (idx === -1) return;
      var varName = pair.slice(0, idx).trim();
      var col     = pair.slice(idx + 1).trim();
      if (!varName || !col) return;

      var val = '';
      if (itemRecord && itemRecord[col])      val = itemRecord[col];
      else if (aggregateRaw[col])             val = aggregateRaw[col];
      else if (individualRaw[col])            val = individualRaw[col];
      else if (globalVars && globalVars[col]) val = globalVars[col];

      if (val) el.style.setProperty('--' + varName, val);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED — CONFIG SHEET
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Returns { tabDefs, globalVars } or null if the tab doesn't exist.
  // tabDefs includes all fields used by both CMS (sort, active, description)
  // and Map (color, icon). The * row populates globalVars, skipping
  // internal config keys so they don't bleed into CSS vars.

  var GLOBAL_VAR_SKIP = {
    'Tab': true, 'Label': true, 'Description': true,
    'Sort By': true, 'Sort Dir': true, 'Sort Type': true, 'Active': true,
  };

  async function fetchConfig(sheetId, configTabName, ttlMs) {
    var rows;
    try { rows = await cachedFetch(csvUrl(sheetId, configTabName), ttlMs); }
    catch (e) { return null; }
    if (!rows.length) return null;

    var tabDefs = [], globalVars = {};
    rows.forEach(function (row) {
      var tab = (row['Tab'] || '').trim();
      if (!tab) return;
      if (tab === '*') {
        Object.keys(row).forEach(function (k) { if (!GLOBAL_VAR_SKIP[k]) globalVars[k] = row[k]; });
        return;
      }
      var sources = tab.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      tabDefs.push({
        tab         : tab,
        sourceTabs  : sources,
        isAggregate : sources.length > 1,
        label       : (row['Label'] || '').trim() || tab,
        description : (row['Description'] || '').trim(),
        color       : (row['Color'] || '').trim(),
        icon        : (row['Icon'] || '').trim(),
        sortCol     : (row['Sort By'] || '').trim(),
        sortDir     : (row['Sort Dir'] || 'asc').trim().toLowerCase(),
        sortType    : (row['Sort Type'] || 'text').trim().toLowerCase(),
        active      : isTruthy(row['Active'] || ''),
        _row        : row,
      });
    });
    return { tabDefs: tabDefs, globalVars: globalVars };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — ACCORDION
  // ═══════════════════════════════════════════════════════════════════════════

  var ACCORDION_TRIGGER_DEFAULT = '.accordion2_top';
  var ACCORDION_PANEL_DEFAULT   = '.accordion2_bottom';
  var ACCORDION_ICON_DEFAULT    = '.accordion2_icon';
  var ACCORDION_TRANSITION      = 'height 0.3s ease';

  function wireAccordion(itemEl, sel) {
    var trigger = itemEl.querySelector(sel.trigger);
    var panel   = itemEl.querySelector(sel.panel);
    if (!trigger || !panel) return;

    itemEl.querySelectorAll('[data-w-id]').forEach(function (el) { el.removeAttribute('data-w-id'); });

    panel.style.cssText    = '';
    panel.style.overflow   = 'hidden';
    panel.style.height     = '0px';
    panel.style.transition = ACCORDION_TRANSITION;
    trigger.style.cursor   = 'pointer';
    var isOpen = false;

    trigger.addEventListener('click', function () {
      isOpen = !isOpen;
      if (isOpen) {
        panel.style.height = panel.scrollHeight + 'px';
        panel.addEventListener('transitionend', function release() {
          panel.style.height = 'auto';
          panel.removeEventListener('transitionend', release);
        });
      } else {
        panel.style.height = panel.scrollHeight + 'px';
        panel.getBoundingClientRect();
        panel.style.height = '0px';
      }
      if (sel.icon) {
        var icon = trigger.querySelector(sel.icon);
        if (icon) { icon.style.transition = 'transform 0.3s ease'; icon.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)'; }
      }
      itemEl.classList.toggle('is-open', isOpen);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — SKELETON LOADER
  // ═══════════════════════════════════════════════════════════════════════════

  var SKELETON_INJECTED = false;

  function injectSkeletonStyles() {
    if (SKELETON_INJECTED) return;
    SKELETON_INJECTED = true;
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes cell2site-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}',
      '.cell2site-skeleton-item{width:100%;height:56px;border-radius:8px;margin-bottom:8px;',
      'background:linear-gradient(90deg,var(--cell2site-sk-base,#e8e8e8) 25%,',
      'var(--cell2site-sk-shine,#d0d0d0) 50%,var(--cell2site-sk-base,#e8e8e8) 75%);',
      'background-size:600px 100%;animation:cell2site-shimmer 1.4s ease-in-out infinite;}',
    ].join('');
    document.head.appendChild(style);
  }

  function showLoader(listEl) {
    var custom = listEl.querySelector('[data-cell2-loading]');
    if (custom) { custom.style.display = ''; return; }
    injectSkeletonStyles();
    var count = parseInt(listEl.getAttribute('data-cell2-loading-count') || '6', 10);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      el.className = 'cell2site-skeleton-item';
      el.setAttribute('data-cell2site-skeleton', '');
      frag.appendChild(el);
    }
    listEl.appendChild(frag);
  }

  function hideLoader(listEl) {
    var custom = listEl.querySelector('[data-cell2-loading]');
    if (custom) { custom.style.display = 'none'; return; }
    listEl.querySelectorAll('[data-cell2site-skeleton]').forEach(function (el) { el.remove(); });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — STATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function updateCount(scopeEl, n) {
    scopeEl.querySelectorAll('[data-cell2-count]').forEach(function (el) { el.textContent = n; });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — SORTING
  // ═══════════════════════════════════════════════════════════════════════════

  function sortRecords(records, listEl, configRow) {
    var col = (configRow && configRow.sortCol) || listEl.getAttribute('data-cell2-sort-col');
    if (!col) return records;
    var dir  = ((configRow && configRow.sortDir) || listEl.getAttribute('data-cell2-sort-dir') || 'asc').toLowerCase();
    var type = ((configRow && configRow.sortType) || listEl.getAttribute('data-cell2-sort-type') || 'text').toLowerCase();
    var desc = dir === 'desc';

    function valueOf(record) {
      var raw = (record[col] || '').trim();
      if (!raw) return null;
      if (type === 'number') { var n = parseFloat(raw.replace(/,/g, '')); return isNaN(n) ? null : n; }
      if (type === 'date')   { var d = Date.parse(raw); return isNaN(d) ? null : d; }
      return raw.toLowerCase();
    }

    return records.slice().sort(function (a, b) {
      var av = valueOf(a), bv = valueOf(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — MAP LINK
  // ═══════════════════════════════════════════════════════════════════════════

  function wireMapLink(clone, record, listEl, accordionTriggerSel) {
    var mapRef = listEl.getAttribute('data-cell2-map-ref');
    if (!mapRef) return;
    (function attempt() {
      var mapInstance = window.__cell2siteMaps && window.__cell2siteMaps[mapRef];
      if (!mapInstance) { setTimeout(attempt, 200); return; }
      var nameVal = record[mapInstance.nameCol] || '';
      if (!nameVal) return;
      var trigger = clone.querySelector('[data-cell2-map-trigger]') || clone;
      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', function (e) {
        if (trigger === clone && e.target.closest && accordionTriggerSel && e.target.closest(accordionTriggerSel)) return;
        mapInstance.flyToName(nameVal);
      });
    })();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — FIELD POPULATION
  // ═══════════════════════════════════════════════════════════════════════════

  function removeWrapperOrClear(el, rootEl, clearFn) {
    var ancestor = el.parentElement;
    while (ancestor && ancestor !== rootEl) {
      if (ancestor.hasAttribute('data-cell2-field-wrapper')) { ancestor.remove(); return true; }
      ancestor = ancestor.parentElement;
    }
    clearFn();
    return false;
  }

  // ─── LINK RENDERING ──────────────────────────────────────────────────────────
  //
  // data-cell2-field renders links automatically:
  //   • Cell contains HTML tags  → rendered as innerHTML (e.g. <a href="…">text</a>)
  //   • Cell contains bare URLs  → auto-linked (opens in new tab)
  //   • Plain text               → textContent (safe, unchanged)
  //
  // If you want full HTML control without auto-detection, use data-cell2-field-html.

  var URL_PATTERN = /(https?:\/\/[^\s,;)"'<>\]]+)/g;
  var HTML_TAG    = /<[a-z][\s\S]*?>/i;

  function renderFieldValue(el, val) {
    if (HTML_TAG.test(val)) {
      el.innerHTML = val;
      return;
    }
    var linked = val.replace(URL_PATTERN, function (url) {
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
    if (linked !== val) {
      el.innerHTML = linked;
    } else {
      el.textContent = val;
    }
  }

  function populateFields(rootEl, record) {
    // text / auto-link / HTML — detected automatically (see renderFieldValue above)
    rootEl.querySelectorAll('[data-cell2-field]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field');
      if (key === 'message') return;   // reserved for error elements
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) renderFieldValue(el, val);
      else removeWrapperOrClear(el, rootEl, function () { el.textContent = ''; });
    });

    // innerHTML
    rootEl.querySelectorAll('[data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field-html');
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) el.innerHTML = val;
      else removeWrapperOrClear(el, rootEl, function () { el.innerHTML = ''; });
    });

    // attribute injection — "attr:Column"
    rootEl.querySelectorAll('[data-cell2-field-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-cell2-field-attr');
      var idx  = spec.indexOf(':');
      if (idx === -1) return;
      var attr = spec.slice(0, idx).trim();
      var key  = spec.slice(idx + 1).trim();
      var val  = key && record[key] !== undefined ? record[key] : '';
      if (val) el.setAttribute(attr, val);
      else removeWrapperOrClear(el, rootEl, function () { el.removeAttribute(attr); });
    });

    // conditional removal
    rootEl.querySelectorAll('[data-cell2-show-if]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-show-if');
      if (!isTruthy(record[key])) el.remove();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — LIST POPULATION
  // ═══════════════════════════════════════════════════════════════════════════

  function populateList(listEl, records, configRow, globalVars, configByTab, accordionSel) {
    var template = listEl.querySelector('[data-cell2-item]');
    if (!template) { console.warn('[cell2site] No [data-cell2-item] inside', listEl); return; }

    var sorted = sortRecords(records, listEl, configRow || null);

    var limitRaw = listEl.getAttribute('data-cell2-item-limit');
    var limit = limitRaw ? parseInt(limitRaw, 10) : 0;
    if (limit && !isNaN(limit)) sorted = sorted.slice(0, limit);

    var emptyEl = listEl.querySelector('[data-cell2-empty]');
    setVisible(emptyEl, sorted.length === 0);
    updateCount(listEl, sorted.length);

    template.style.display = 'none';
    var fragment = document.createDocumentFragment();

    sorted.forEach(function (record) {
      var clone = template.cloneNode(true);
      clone.removeAttribute('data-cell2-item');
      clone.style.display = '';

      var individualConfigRow = (configByTab && record._tab) ? (configByTab[record._tab] || null) : null;
      var individualLabel = (individualConfigRow && individualConfigRow.label)
        ? individualConfigRow.label
        : (configRow && (configRow.label || configRow.tab)) || '';
      var activeLabel = (configRow && (configRow.label || configRow.tab)) || '';

      clone.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
        var meta = el.getAttribute('data-cell2-meta');
        if (meta === 'tab-title') el.textContent = activeLabel;
        if (meta === 'tab-label') el.textContent = individualLabel;
      });

      populateFields(clone, record);

      clone.querySelectorAll('[data-cell2-var]').forEach(function (el) {
        resolveVars(el, record, configRow, globalVars, individualConfigRow);
      });
      if (clone.hasAttribute('data-cell2-var')) {
        resolveVars(clone, record, configRow, globalVars, individualConfigRow);
      }

      wireAccordion(clone, accordionSel);
      wireMapLink(clone, record, listEl, accordionSel.trigger);
      clone.classList.add('is-ready');
      fragment.appendChild(clone);
    });

    listEl.insertBefore(fragment, template);
    template.remove();
  }

  async function processListElement(listEl, accordionSel) {
    var sheetId   = listEl.getAttribute('data-cell2-id');
    var sheetName = listEl.getAttribute('data-cell2-sheet') || 'Sheet1';
    var ttl       = ttlFromAttr(listEl);
    if (!sheetId) { console.warn('[cell2site] Missing data-cell2-id on', listEl); return; }

    setVisible(listEl.querySelector('[data-cell2-empty]'), false);
    setVisible(listEl.querySelector('[data-cell2-error]'), false);

    listEl.classList.add('is-loading');
    showLoader(listEl);
    try {
      var data = await cachedFetch(csvUrl(sheetId, sheetName), ttl);
      populateList(listEl, data, null, {}, null, accordionSel);
    } catch (err) {
      console.error('[cell2site]', err);
      showError(listEl, String(err && err.message || err));
    } finally {
      hideLoader(listEl);
      listEl.classList.remove('is-loading');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CMS — TABS
  // ═══════════════════════════════════════════════════════════════════════════

  function wireTabs(linkEls, paneEls, activeIndex) {
    function activate(i) {
      linkEls.forEach(function (link, idx) {
        link.classList.toggle('w--current', idx === i);
        link.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      });
      paneEls.forEach(function (pane, idx) {
        var active = idx === i;
        pane.classList.toggle('w--tab-active', active);
        pane.style.display = active ? '' : 'none';
        pane.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    }
    linkEls.forEach(function (link, i) {
      link.style.cursor = 'pointer';
      link.addEventListener('click', function () { activate(i); });
    });
    activate(activeIndex);
  }

  // ─── TAB FIELD POPULATION ────────────────────────────────────────────────────
  // Fills elements in tab link/pane templates from the tab's _config row.
  //   data-cell2-tab-field="Col"           → textContent from config column
  //   data-cell2-tab-field-html="Col"      → innerHTML from config column
  //   data-cell2-tab-field-attr="attr:Col" → attribute from config column (e.g. src:Image)

  function populateTabFields(rootEl, tabDef) {
    var row = (tabDef && tabDef._row) ? tabDef._row : {};

    rootEl.querySelectorAll('[data-cell2-tab-field]').forEach(function (el) {
      var col = el.getAttribute('data-cell2-tab-field');
      var val = col && row[col] !== undefined ? row[col] : '';
      if (val) el.textContent = val;
      else removeWrapperOrClear(el, rootEl, function () { el.textContent = ''; });
    });

    rootEl.querySelectorAll('[data-cell2-tab-field-html]').forEach(function (el) {
      var col = el.getAttribute('data-cell2-tab-field-html');
      var val = col && row[col] !== undefined ? row[col] : '';
      if (val) el.innerHTML = val;
      else removeWrapperOrClear(el, rootEl, function () { el.innerHTML = ''; });
    });

    rootEl.querySelectorAll('[data-cell2-tab-field-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-cell2-tab-field-attr');
      var idx  = spec.indexOf(':');
      if (idx === -1) return;
      var attr = spec.slice(0, idx).trim();
      var col  = spec.slice(idx + 1).trim();
      var val  = col && row[col] !== undefined ? row[col] : '';
      if (val) el.setAttribute(attr, val);
      else removeWrapperOrClear(el, rootEl, function () { el.removeAttribute(attr); });
    });
  }

  function insertTab(tabDef, records, ctx) {
    var tabId = uid();
    var label = tabDef.label || tabDef.tab;

    var link = ctx.linkTemplate.cloneNode(true);
    link.removeAttribute('data-cell2-tab-link');
    link.style.display = '';
    link.setAttribute('data-w-tab', tabId);
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-selected', 'false');
    link.setAttribute('aria-controls', tabId);

    link.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
      var meta = el.getAttribute('data-cell2-meta');
      if (meta === 'tab-title')       el.textContent = label;
      if (meta === 'tab-label')       el.textContent = label;
      if (meta === 'tab-description') el.textContent = tabDef.description || '';
    });
    link.querySelectorAll('[data-cell2-tab-count]').forEach(function (el) { el.textContent = records.length; });
    populateTabFields(link, tabDef);

    if (link.hasAttribute('data-cell2-var')) resolveVars(link, null, tabDef, ctx.globalVars);
    link.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      resolveVars(el, null, tabDef, ctx.globalVars);
    });

    ctx.linkContainer.insertBefore(link, ctx.linkTemplate);
    ctx.linkEls.push(link);

    var pane = ctx.contentTemplate.cloneNode(true);
    pane.removeAttribute('data-cell2-tab-content');
    pane.style.display = '';
    pane.setAttribute('data-w-tab', tabId);
    pane.setAttribute('id', tabId);
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-hidden', 'true');

    pane.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
      var meta = el.getAttribute('data-cell2-meta');
      if (meta === 'tab-title')       el.textContent = label;
      if (meta === 'tab-label')       el.textContent = label;
      if (meta === 'tab-description') el.textContent = tabDef.description || '';
    });
    populateTabFields(pane, tabDef);

    if (pane.hasAttribute('data-cell2-var')) resolveVars(pane, null, tabDef, ctx.globalVars);
    pane.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      resolveVars(el, null, tabDef, ctx.globalVars);
    });

    var listEl = pane.querySelector('[data-cell2-list]');
    if (listEl) {
      showLoader(listEl);
      populateList(listEl, records, tabDef, ctx.globalVars, ctx.configByTab, ctx.accordionSel);
      hideLoader(listEl);
    }

    ctx.contentContainer.insertBefore(pane, ctx.contentTemplate);
    ctx.paneEls.push(pane);
  }

  async function processTabsElement(wrapperEl, accordionSel) {
    var sheetId    = wrapperEl.getAttribute('data-cell2-id');
    var configName = wrapperEl.getAttribute('data-cell2-config') || '_config';
    var ttl        = ttlFromAttr(wrapperEl);
    if (!sheetId) { console.warn('[cell2site] Missing data-cell2-id on tabs wrapper', wrapperEl); return; }

    var linkTemplate    = wrapperEl.querySelector('[data-cell2-tab-link]');
    var contentTemplate = wrapperEl.querySelector('[data-cell2-tab-content]');
    if (!linkTemplate || !contentTemplate) {
      console.warn('[cell2site] Needs [data-cell2-tab-link] and [data-cell2-tab-content]', wrapperEl);
      return;
    }

    var linkContainer    = linkTemplate.parentElement;
    var contentContainer = contentTemplate.parentElement;
    linkTemplate.style.display    = 'none';
    contentTemplate.style.display = 'none';

    var config     = await fetchConfig(sheetId, configName, ttl);
    var tabDefs    = [];
    var globalVars = {};

    if (config && config.tabDefs.length) {
      tabDefs    = config.tabDefs;
      globalVars = config.globalVars;
    } else {
      parseList(wrapperEl.getAttribute('data-cell2-sheets')).forEach(function (name) {
        tabDefs.push({ tab: name, sourceTabs: [name], isAggregate: false, label: name,
          description: '', color: '', icon: '', sortCol: '', sortDir: 'asc',
          sortType: 'text', active: false, _row: {} });
      });
      if (!tabDefs.length) {
        console.warn('[cell2site] No tabs — add a _config sheet or data-cell2-sheets', wrapperEl);
        showError(wrapperEl, 'No tabs configured');
        return;
      }
    }

    if (wrapperEl.hasAttribute('data-cell2-var')) resolveVars(wrapperEl, null, null, globalVars);
    wrapperEl.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      if (!el.closest('[data-cell2-tab-link]') && !el.closest('[data-cell2-tab-content]')) {
        resolveVars(el, null, null, globalVars);
      }
    });

    var configByTab = {};
    tabDefs.forEach(function (def) {
      if (!def.isAggregate) def.sourceTabs.forEach(function (t) { configByTab[t] = def; });
    });

    var uniqueTabs = {};
    tabDefs.forEach(function (def) { def.sourceTabs.forEach(function (t) { uniqueTabs[t] = true; }); });

    var fetchMap = {};
    await Promise.all(Object.keys(uniqueTabs).map(async function (tabName) {
      try {
        var rows = await cachedFetch(csvUrl(sheetId, tabName), ttl);
        fetchMap[tabName] = rows.map(function (r) { var copy = Object.assign({}, r); copy._tab = tabName; return copy; });
      } catch (err) {
        console.error('[cell2site] Failed to fetch "' + tabName + '"', err);
        fetchMap[tabName] = [];
      }
    }));

    var visibleFields = getVisibleFields(contentTemplate);

    var ctx = {
      linkTemplate: linkTemplate, contentTemplate: contentTemplate,
      linkContainer: linkContainer, contentContainer: contentContainer,
      linkEls: [], paneEls: [], globalVars: globalVars,
      configByTab: configByTab, accordionSel: accordionSel,
    };

    var activeIndex = 0;
    tabDefs.forEach(function (def) {
      var records;
      if (def.isAggregate) {
        var merged = [];
        def.sourceTabs.forEach(function (t) { merged = merged.concat(fetchMap[t] || []); });
        records = deduplicateRecords(merged, visibleFields);
      } else {
        records = fetchMap[def.sourceTabs[0]] || [];
      }
      if (def.active) activeIndex = ctx.linkEls.length;
      insertTab(def, records, ctx);
    });

    linkTemplate.remove();
    contentTemplate.remove();
    wireTabs(ctx.linkEls, ctx.paneEls, Math.min(activeIndex, ctx.linkEls.length - 1));
  }

  function readAccordionSel(el) {
    return {
      trigger: el.getAttribute('data-cell2-accordion-trigger') || ACCORDION_TRIGGER_DEFAULT,
      panel:   el.getAttribute('data-cell2-accordion-panel')   || ACCORDION_PANEL_DEFAULT,
      icon:    el.getAttribute('data-cell2-accordion-icon')    || ACCORDION_ICON_DEFAULT,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — DEFAULTS
  // ═══════════════════════════════════════════════════════════════════════════

  var MARKER_DEFAULT     = { color: '#6b7280', icon: '📍', size: 36 };
  var SEARCH_DEBOUNCE_MS = 250;

  var ZOOM_DEFAULT_DESKTOP = 3;
  var ZOOM_DEFAULT_MOBILE  = 2;
  var ZOOM_FLYTO_DESKTOP   = 12;
  var ZOOM_FLYTO_MOBILE    = 8;
  var ZOOM_LOCATE          = 6;

  var IS_MOBILE   = window.innerWidth <= 767;
  var DEFAULT_LAT = 20;
  var DEFAULT_LNG = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — TILE LAYERS
  // ═══════════════════════════════════════════════════════════════════════════

  var TILE_LAYERS = {
    'osm': {
      url:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      opts: { attribution: '© OpenStreetMap contributors', maxZoom: 19 },
    },
    'carto-light': {
      url:  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      opts: { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 },
    },
    'carto-dark': {
      url:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      opts: { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 },
    },
    'esri-street': {
      url:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      opts: { attribution: '© Esri', maxZoom: 19 },
    },
    'esri-topo': {
      url:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      opts: { attribution: '© Esri', maxZoom: 19 },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — LEAFLET LOADER
  // ═══════════════════════════════════════════════════════════════════════════

  var leafletReady = null;

  function loadLeaflet() {
    if (leafletReady) return leafletReady;
    function loadAsset(tag, attrs) {
      return new Promise(function (resolve, reject) {
        var sel = tag === 'link' ? 'link[href="' + attrs.href + '"]' : 'script[src="' + attrs.src + '"]';
        if (document.querySelector(sel)) { resolve(); return; }
        var el = document.createElement(tag);
        Object.keys(attrs).forEach(function (k) { el[k] = attrs[k]; });
        el.onload = resolve;
        el.onerror = function () { reject(new Error('Failed: ' + (attrs.src || attrs.href))); };
        document.head.appendChild(el);
      });
    }
    leafletReady = Promise.all([
      loadAsset('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css' }),
      loadAsset('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css' }),
      loadAsset('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css' }),
    ]).then(function () {
      return loadAsset('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js' });
    }).then(function () {
      return loadAsset('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js' });
    });
    return leafletReady;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — MARKER STYLE
  // ═══════════════════════════════════════════════════════════════════════════

  function getMarkerStyle(record, individualConfigRow) {
    var color = (record && record['Color'])
      || (individualConfigRow && individualConfigRow.color) || MARKER_DEFAULT.color;
    var icon  = (record && record['Icon'])
      || (individualConfigRow && individualConfigRow.icon)  || MARKER_DEFAULT.icon;
    return { color: color, icon: icon, size: MARKER_DEFAULT.size };
  }

  function createMarkerIcon(style) {
    var size = style.size;
    var html = '<div style="background-color:' + style.color + ';border:2px solid white;border-radius:50%;width:' + size +
      'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;font-size:' +
      Math.round(size * 0.5) + 'px;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;">' + style.icon + '</div>';
    return L.divIcon({ html: html, iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -size], className: 'cell2site-map-marker' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — FILTERING
  // ═══════════════════════════════════════════════════════════════════════════

  function getUniqueValues(records, col) {
    var seen = {}, vals = [];
    records.forEach(function (r) {
      var v = (r[col] || '').trim();
      if (v && !seen[v]) { seen[v] = true; vals.push(v); }
    });
    return vals.sort();
  }

  function populateFilterDropdown(selectEl, records, col, isMulti) {
    Array.from(selectEl.options).forEach(function (opt, idx) { if (idx > 0) opt.remove(); });
    getUniqueValues(records, col).forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v; opt.textContent = v; selectEl.appendChild(opt);
    });
    if (isMulti) selectEl.setAttribute('multiple', '');
  }

  function applyFilters(records, filterState) {
    var query  = (filterState.search || '').toLowerCase().trim();
    var logic  = filterState.logic || 'and';
    var active = (filterState.filters || []).filter(function (f) { return f.values && f.values.length; });

    return records.filter(function (record) {
      if (query) {
        var cols = filterState.searchCols && filterState.searchCols.length ? filterState.searchCols : Object.keys(record);
        if (!cols.some(function (c) { return (record[c] || '').toLowerCase().indexOf(query) !== -1; })) return false;
      }
      if (!active.length) return true;

      function matchesFilter(f) {
        if (f.col === '_tab') {
          var recordTab = (record._tab || '').toLowerCase();
          return f.values.some(function (v) {
            return v.split(',').map(function (s) { return s.trim().toLowerCase(); })
              .some(function (t) { return t === recordTab; });
          });
        }
        var val = (record[f.col] || '').trim();
        return f.values.some(function (v) { return v.toLowerCase() === val.toLowerCase(); });
      }

      return logic === 'or' ? active.some(matchesFilter) : active.every(matchesFilter);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — POPUP CARD
  // ═══════════════════════════════════════════════════════════════════════════

  function populateCard(cardEl, record, globalVars, individualConfigRow) {
    function removeWrapperOrClearCard(el, clearFn) {
      var ancestor = el.parentElement;
      while (ancestor && ancestor !== cardEl) {
        if (ancestor.hasAttribute('data-cell2-field-wrapper')) { ancestor.remove(); return; }
        ancestor = ancestor.parentElement;
      }
      clearFn();
    }

    cardEl.querySelectorAll('[data-cell2-field]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field');
      if (key === 'message') return;
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) renderFieldValue(el, val);
      else removeWrapperOrClearCard(el, function () { el.textContent = ''; });
    });

    cardEl.querySelectorAll('[data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field-html');
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) el.innerHTML = val;
      else removeWrapperOrClearCard(el, function () { el.innerHTML = ''; });
    });

    cardEl.querySelectorAll('[data-cell2-field-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-cell2-field-attr');
      var idx  = spec.indexOf(':');
      if (idx === -1) return;
      var attr = spec.slice(0, idx).trim();
      var key  = spec.slice(idx + 1).trim();
      var val  = key && record[key] !== undefined ? record[key] : '';
      if (val) el.setAttribute(attr, val);
      else removeWrapperOrClearCard(el, function () { el.removeAttribute(attr); });
    });

    cardEl.querySelectorAll('[data-cell2-show-if]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-show-if');
      if (!isTruthy(record[key])) el.remove();
    });

    var tabName  = record._tab || '';
    var tabLabel = (individualConfigRow && individualConfigRow.label) || tabName;
    cardEl.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
      var meta = el.getAttribute('data-cell2-meta');
      if (meta === 'tab-label') el.textContent = tabLabel;
      else if (meta === 'tab-name')  el.textContent = tabName;
    });

    // null for configRow — map has no aggregate-tab concept
    cardEl.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      resolveVars(el, record, null, globalVars, individualConfigRow);
    });
    if (cardEl.hasAttribute('data-cell2-var')) resolveVars(cardEl, record, null, globalVars, individualConfigRow);

    return cardEl;
  }

  function buildPopupContent(cardTemplate, record, globalVars, individualConfigRow) {
    var clone = cardTemplate.cloneNode(true);
    clone.style.display = '';
    clone.removeAttribute('data-cell2-map-card');
    populateCard(clone, record, globalVars, individualConfigRow);
    return clone.outerHTML;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP — INSTANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async function initMapInstance(wrapperEl) {
    var sheetId    = wrapperEl.getAttribute('data-cell2-id');
    var sheetName  = wrapperEl.getAttribute('data-cell2-sheet') || 'Sheet1';
    var configName = wrapperEl.getAttribute('data-cell2-config') || '_config';
    var mapId      = wrapperEl.getAttribute('data-cell2-map-id') || '';
    var colLat     = wrapperEl.getAttribute('data-cell2-col-lat') || 'Latitude';
    var colLng     = wrapperEl.getAttribute('data-cell2-col-lng') || 'Longitude';
    var colName    = wrapperEl.getAttribute('data-cell2-col-name') || 'Name';
    var logic      = (wrapperEl.getAttribute('data-cell2-map-filter-logic') || 'and').toLowerCase();
    var ttl        = ttlFromAttr(wrapperEl);

    if (!sheetId) { console.warn('[cell2site] Missing data-cell2-id', wrapperEl); return; }

    var mapEl        = wrapperEl.querySelector('[data-cell2-map]');
    var cardTemplate = wrapperEl.querySelector('[data-cell2-map-card]');
    if (cardTemplate) cardTemplate.style.display = 'none';
    if (!mapEl) { console.warn('[cell2site] No [data-cell2-map] found', wrapperEl); return; }

    setVisible(wrapperEl.querySelector('[data-cell2-empty]'), false);
    setVisible(wrapperEl.querySelector('[data-cell2-error]'), false);

    try { await loadLeaflet(); }
    catch (err) { console.error('[cell2site] Leaflet load failed', err); showError(wrapperEl, 'Map library failed to load'); return; }

    // center / zoom
    var centerAttr = mapEl.getAttribute('data-cell2-map-center');
    var center = [DEFAULT_LAT, DEFAULT_LNG];
    if (centerAttr) {
      var parts = centerAttr.split(',').map(function (s) { return parseFloat(s.trim()); });
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) center = parts;
    }

    var attrZoom = mapEl.getAttribute('data-cell2-map-zoom');
    var initZoom = attrZoom ? parseFloat(attrZoom) : (IS_MOBILE ? ZOOM_DEFAULT_MOBILE : ZOOM_DEFAULT_DESKTOP);
    var clusterR = parseInt(mapEl.getAttribute('data-cell2-map-cluster-radius') || '80', 10);
    var refit    = (mapEl.getAttribute('data-cell2-map-refit') || 'true').toLowerCase() !== 'false';
    var tileKey  = (mapEl.getAttribute('data-cell2-map-tiles') || 'osm').toLowerCase();
    var tile     = TILE_LAYERS[tileKey] || TILE_LAYERS['osm'];

    var map = L.map(mapEl, { center: center, zoom: initZoom });

    setTimeout(function () {
      map.invalidateSize({ animate: false, pan: false });
      map.setView(center, initZoom, { animate: false });
    }, 0);

    L.tileLayer(tile.url, tile.opts).addTo(map);

    var clusterGroup = L.markerClusterGroup({ maxClusterRadius: clusterR });
    map.addLayer(clusterGroup);

    var config     = await fetchConfig(sheetId, configName, ttl);
    var tabDefs    = config ? config.tabDefs : [];
    var globalVars = config ? config.globalVars : {};

    if (wrapperEl.hasAttribute('data-cell2-var')) resolveVars(wrapperEl, null, null, globalVars);
    wrapperEl.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      if (!el.closest('[data-cell2-map-card]')) resolveVars(el, null, null, globalVars);
    });

    var configByTab = {};
    tabDefs.forEach(function (def) {
      if (!def.isAggregate) def.sourceTabs.forEach(function (t) { configByTab[t] = def; });
    });

    var tabNames;
    if (tabDefs.length) {
      var seen = {};
      tabNames = [];
      tabDefs.forEach(function (def) {
        def.sourceTabs.forEach(function (t) { if (!seen[t]) { seen[t] = true; tabNames.push(t); } });
      });
    } else {
      tabNames = parseList(wrapperEl.getAttribute('data-cell2-sheet'));
      if (!tabNames.length) tabNames = [sheetName];
    }

    var allFetches;
    try {
      allFetches = await Promise.all(tabNames.map(async function (tabName) {
        var rows = await cachedFetch(csvUrl(sheetId, tabName), ttl);
        return rows.map(function (r) { var copy = Object.assign({}, r); copy._tab = tabName; return copy; });
      }));
    } catch (err) {
      console.error('[cell2site]', err);
      showError(wrapperEl, String(err && err.message || err));
      return;
    }

    var records = [];
    allFetches.forEach(function (rows) { records = records.concat(rows); });

    var validRecords = records.filter(function (r) {
      return !isNaN(parseFloat(r[colLat])) && !isNaN(parseFloat(r[colLng]));
    });

    if (!validRecords.length) {
      console.warn('[cell2site] No valid lat/lng records');
      setVisible(wrapperEl.querySelector('[data-cell2-empty]'), true);
      return;
    }

    var visibleFields = getVisibleFields(cardTemplate);
    validRecords = deduplicateRecords(validRecords, visibleFields);

    var markerMap = {};
    validRecords.forEach(function (record) {
      var lat  = parseFloat(record[colLat]);
      var lng  = parseFloat(record[colLng]);
      var name = record[colName] || '';
      var individualConfig = configByTab[record._tab] || null;
      var style  = getMarkerStyle(record, individualConfig);
      var marker = L.marker([lat, lng], { icon: createMarkerIcon(style) });

      if (cardTemplate) marker.bindPopup(buildPopupContent(cardTemplate, record, globalVars, individualConfig), { maxWidth: 360 });
      else marker.bindPopup('<strong>' + name + '</strong>');

      clusterGroup.addLayer(marker);
      markerMap[name] = { marker: marker, record: record, individualConfig: individualConfig };
    });

    // ── Filters ──────────────────────────────────────────────────────────────
    var filterEls   = wrapperEl.querySelectorAll('[data-cell2-map-filter], [data-cell2-map-filter-tabs]:not([data-cell2-map-filter])');
    var filterState = { search: '', searchCols: null, filters: [], logic: logic };

    filterEls.forEach(function (selectEl, idx) {
      var col         = selectEl.getAttribute('data-cell2-map-filter') || '';
      var isMulti     = selectEl.hasAttribute('data-cell2-map-filter-multi');
      var isTabFilter = selectEl.hasAttribute('data-cell2-map-filter-tabs');

      if (isTabFilter) {
        var labels = tabDefs.length
          ? tabDefs.map(function (d) { return { value: d.sourceTabs.join(','), label: d.label }; })
          : tabNames.map(function (t) { return { value: t, label: t }; });
        labels.forEach(function (item) {
          var opt = document.createElement('option');
          opt.value = item.value; opt.textContent = item.label; selectEl.appendChild(opt);
        });
        if (isMulti) selectEl.setAttribute('multiple', '');
        filterState.filters.push({ col: '_tab', values: [], multi: isMulti });
      } else {
        populateFilterDropdown(selectEl, validRecords, col, isMulti);
        filterState.filters.push({ col: col, values: [], multi: isMulti });
      }

      selectEl.addEventListener('change', function () {
        filterState.filters[idx].values = Array.from(selectEl.selectedOptions)
          .map(function (o) { return o.value; }).filter(Boolean);
        applyAndRender();
      });
    });

    var searchEl    = wrapperEl.querySelector('[data-cell2-map-search]');
    var searchBtnEl = wrapperEl.querySelector('[data-cell2-map-search-btn]');
    var resetEl     = wrapperEl.querySelector('[data-cell2-map-reset]');

    if (searchEl) {
      var searchColsAttr = searchEl.getAttribute('data-cell2-map-search-cols');
      filterState.searchCols = searchColsAttr ? parseList(searchColsAttr) : null;
      var doSearch = debounce(function () { filterState.search = searchEl.value; applyAndRender(); }, SEARCH_DEBOUNCE_MS);
      searchEl.addEventListener('input', doSearch);
      if (searchBtnEl) searchBtnEl.addEventListener('click', function () { filterState.search = searchEl.value; applyAndRender(); });
    }

    function resetFilters() {
      if (searchEl) { searchEl.value = ''; filterState.search = ''; }
      filterEls.forEach(function (selectEl, idx) {
        Array.from(selectEl.options).forEach(function (o) { o.selected = false; });
        if (!filterState.filters[idx].multi && selectEl.options[0]) selectEl.options[0].selected = true;
        filterState.filters[idx].values = [];
      });
      applyAndRender();
    }

    if (resetEl) {
      resetEl.addEventListener('click', function () {
        resetFilters();
        map.setView(center, initZoom, { animate: true });
      });
    }

    var locateEl = wrapperEl.querySelector('[data-cell2-map-locate]');
    if (locateEl && navigator.geolocation) {
      locateEl.addEventListener('click', function () {
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var zoom = Math.min(IS_MOBILE ? ZOOM_FLYTO_MOBILE : ZOOM_FLYTO_DESKTOP, ZOOM_LOCATE);
            map.flyTo([pos.coords.latitude, pos.coords.longitude], zoom, { duration: 1.5 });
          },
          function () {}
        );
      });
    }

    // ── Render ───────────────────────────────────────────────────────────────
    function applyAndRender() {
      var passing = applyFilters(validRecords, filterState);
      var passingNames = {};
      passing.forEach(function (r) { passingNames[r[colName]] = true; });

      clusterGroup.clearLayers();
      var visibleMarkers = [];
      Object.keys(markerMap).forEach(function (name) {
        if (passingNames[name]) {
          clusterGroup.addLayer(markerMap[name].marker);
          visibleMarkers.push(markerMap[name].marker);
        }
      });

      wrapperEl.querySelectorAll('[data-cell2-count]').forEach(function (el) { el.textContent = visibleMarkers.length; });
      setVisible(wrapperEl.querySelector('[data-cell2-empty]'), visibleMarkers.length === 0);

      if (refit && visibleMarkers.length) {
        var group = L.featureGroup(visibleMarkers);
        map.fitBounds(group.getBounds(), { padding: [32, 32], animate: true, maxZoom: 10 });
      }
    }

    // initial count
    wrapperEl.querySelectorAll('[data-cell2-count]').forEach(function (el) { el.textContent = validRecords.length; });

    if (mapId) {
      window.__cell2siteMaps = window.__cell2siteMaps || {};
      window.__cell2siteMaps[mapId] = {
        flyToName: function (name, zoom) {
          var entry = markerMap[name];
          if (!entry) return;
          resetFilters();
          var targetZoom = zoom || (IS_MOBILE ? ZOOM_FLYTO_MOBILE : ZOOM_FLYTO_DESKTOP);
          map.flyTo(entry.marker.getLatLng(), targetZoom, { duration: 1 });
          setTimeout(function () { entry.marker.openPopup(); }, 1100);
        },
        nameCol: colName,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    document.querySelectorAll('[data-cell2-tabs]').forEach(function (el) {
      processTabsElement(el, readAccordionSel(el));
    });
    document.querySelectorAll('[data-cell2-list]').forEach(function (listEl) {
      if (listEl.closest('[data-cell2-tabs]')) return;
      processListElement(listEl, readAccordionSel(listEl));
    });
    document.querySelectorAll('[data-cell2-map-wrapper]').forEach(function (el) {
      initMapInstance(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (window.Webflow) {
    window.Webflow.push(function () { if (!window.__cell2siteMaps) init(); });
  }

})();
