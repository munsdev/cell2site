import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Marked } from 'marked';
import { SITE, esc, gate } from './layout.mjs';

// ── Markdown ───────────────────────────────────────────────────────────────
// README.md, CHANGELOG.md and the Webflow guide are the single source for their pages: the
// site renders them at build time, so the docs are never edited in two places.

// GitHub's anchor rule, so links like README#config-sheet-optional work on both.
const slug = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\- ]+/g, '').trim().replace(/ /g, '-');

// Repo-relative links become site pages where one exists, GitHub otherwise.
const SITE_LINKS = { 'CHANGELOG.md': '/changelog/', 'README.md': '/docs/', 'site/examples/webflow.md': '/docs/webflow/' };
function rewrite(href) {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [path, hash] = href.replace(/^\.\//, '').split('#');
  const base = SITE_LINKS[path] || (path.startsWith('site/examples/') && path.endsWith('.html')
    ? '/examples/' + path.slice(14, -5) + '/'
    : SITE.repo + '/blob/main/' + path);
  return base + (hash ? '#' + hash : '');
}

function renderMarkdown(source) {
  const toc = [];
  const md = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const id = slug(html);
        if (depth === 2) toc.push([id, html.replace(/<[^>]+>/g, '')]);
        return `<h${depth} id="${id}"><a href="#${id}" class="no-underline text-inherit">${html}</a></h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        return `<a href="${esc(rewrite(href))}"${title ? ` title="${esc(title)}"` : ''}>${text}</a>`;
      },
    },
  });
  return { html: md.parse(source), toc };
}

function docPage({ path, title, description, file, lead }) {
  const { html, toc } = renderMarkdown(readFileSync(file, 'utf8'));
  return {
    path, title, description,
    body: `
<div class="wrap grid grid-cols-1 gap-10 py-14 lg:grid-cols-[15rem_minmax(0,1fr)]">
  <aside class="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
    <nav aria-label="On this page" class="text-[15px]">
      <p class="mb-2 font-mono text-sm uppercase tracking-wider text-[var(--muted)]">On this page</p>
      <ul class="grid grid-cols-1 gap-1 border-l-2 border-[var(--line)]">
        ${toc.map(([id, text]) => `<li><a href="#${id}" class="-ml-0.5 block border-l-2 border-transparent py-0.5 pl-3 text-[var(--muted)] no-underline hover:border-green hover:text-[var(--fg)]">${esc(text)}</a></li>`).join('')}
      </ul>
      <a href="${SITE.repo}/blob/main/${file.split('/cell2site/').pop()}" class="mt-6 inline-block text-sm">Edit this page on GitHub</a>
    </nav>
  </aside>
  <article class="prose min-w-0">${lead || ''}${html}</article>
</div>`,
  };
}

// ── Examples ───────────────────────────────────────────────────────────────

export const EXAMPLES = [
  ['embed', 'Drop-in embeds', 'Cards, list, table and map with no markup of your own.'],
  ['list', 'Custom list', 'Your own HTML with search, a filter, a count and empty states.'],
  ['tabs', 'Tabs', "Tabs, labels, order and colours from the sheet's _config tab."],
  ['map', 'Map', 'Popups, filters, search and "near me" on a Leaflet map.'],
  ['list-and-map', 'List and map', 'Click a card and the map flies to its marker.'],
];

function examplePage(root, [key, title, description]) {
  const code = readFileSync(join(root, 'site/examples', key + '.html'), 'utf8').trim();
  return {
    path: `/examples/${key}/`, title, description,
    body: `
<div class="wrap py-14">
  <p class="font-mono text-sm"><a href="/examples/">Examples</a> / ${esc(key)}</p>
  <h1 class="mt-3 text-5xl">${esc(title)}</h1>
  <p class="mt-3 max-w-2xl text-lg text-[var(--muted)]">${esc(description)} It reads the <a href="${SITE.demoSheet}">public demo sheet</a>; swap in your own sheet URL and column names.</p>
  <div class="card mt-8">${gate('Live example')}<div data-ext class="example">${code}</div></div>
  <div class="mt-8 flex items-center justify-between gap-4">
    <h2 class="text-2xl">The code</h2>
    <div class="flex gap-2"><button type="button" class="btn btn-sm" data-copy="#code">Copy</button>
      <a class="btn btn-sm" href="${SITE.repo}/blob/main/site/examples/${key}.html">On GitHub</a></div>
  </div>
  <p class="mt-2 text-[var(--muted)]">Paste it into your page, with the script tag once before <code>&lt;/body&gt;</code>.</p>
  <pre class="code mt-4" id="code"><code>${esc(code)}</code></pre>
</div>`,
  };
}

function examplesIndex() {
  return {
    path: '/examples/', title: 'Examples', description: 'Copy-paste cell2site examples, each running live against a public demo sheet.',
    body: `
<div class="wrap py-14">
  <span class="eyebrow"><span class="cellref">B1</span> Examples</span>
  <h1 class="mt-3 text-5xl">Examples</h1>
  <p class="mt-3 max-w-2xl text-lg text-[var(--muted)]">Each example runs live against the <a href="${SITE.demoSheet}">public demo sheet</a>, with its code underneath to copy.</p>
  <ul class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    ${EXAMPLES.map(([key, title, description], i) => `<li><a href="/examples/${key}/" class="card group block h-full text-[var(--fg)] no-underline hover:shadow-[4px_4px_0_var(--border)]">
      <span class="cellref text-green-dark">B${i + 2}</span>
      <h2 class="mt-3 text-2xl group-hover:underline">${esc(title)}</h2>
      <p class="mt-1 text-[var(--muted)]">${esc(description)}</p></a></li>`).join('')}
    <li><a href="/docs/webflow/" class="card group block h-full text-[var(--fg)] no-underline hover:shadow-[4px_4px_0_var(--border)]">
      <span class="cellref text-purple">W1</span>
      <h2 class="mt-3 text-2xl group-hover:underline">Webflow, step by step</h2>
      <p class="mt-1 text-[var(--muted)]">Where the script goes, and how to add the attributes in the Designer.</p></a></li>
  </ul>
</div>`,
  };
}

// ── Viewer ─────────────────────────────────────────────────────────────────

function viewer() {
  const field = (label, input, wide) => `<label class="field${wide ? ' sm:col-span-2' : ''}">${label}${input}</label>`;
  return {
    path: '/view/', title: 'Viewer', scripts: ['/assets/view.js'],
    description: 'Paste a Google Sheet link, see it as a list, cards, table or map, and get a share link or embed code.',
    body: `
<script>if (/[?&]embed=1(&|$)/.test(location.search)) document.documentElement.classList.add('is-embed');</script>
<div class="wrap py-14 [html.is-embed_&]:max-w-none [html.is-embed_&]:p-0">
  <div data-chrome>
    <span class="eyebrow"><span class="cellref">C1</span> Viewer</span>
    <h1 class="mt-3 text-5xl">See any sheet as a page</h1>
    <p class="mt-3 max-w-2xl text-lg text-[var(--muted)]">Paste a Google Sheet link and pick a format. Your browser reads the sheet straight from Google; nothing passes through cell2site. The sheet must be shared as "Anyone with the link".</p>
    <form id="form" novalidate class="card mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      ${field('Sheet URL or ID', '<input id="sheet" name="sheet" required autocomplete="off" spellcheck="false" placeholder="https://docs.google.com/spreadsheets/d/…">', true)}
      ${field('Tab name (optional)', '<input id="tab" name="tab" autocomplete="off" placeholder="Sheet1">')}
      ${field('Format', '<select id="format" name="format"><option value="cards">Cards</option><option value="list">List</option><option value="table">Table</option><option value="map">Map</option></select>')}
      ${field('Title (optional)', '<input id="titleInput" name="title" autocomplete="off">', true)}
      <div class="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button class="btn btn-primary" type="submit">Show sheet</button>
        <button class="btn" type="button" id="try-demo">Try the demo sheet</button>
        <p id="error" class="text-sm font-medium text-red-700" role="alert"></p>
      </div>
    </form>
    <div id="actions" hidden class="mt-6 flex flex-wrap gap-2">
      <button type="button" class="btn btn-sm" data-snippet="share">Copy share link</button>
      <button type="button" class="btn btn-sm" data-snippet="embed">Copy embed code</button>
      <button type="button" class="btn btn-sm" data-snippet="iframe">Copy iframe code</button>
    </div>
    <textarea id="snippet" readonly hidden aria-label="Code to copy" class="code mt-3 min-h-24 w-full"></textarea>
    <p id="copied" class="mt-2 text-sm text-[var(--muted)]" role="status"></p>
  </div>
  <h2 id="title" hidden class="mt-10 text-3xl"></h2>
  <div class="mt-6 [html.is-embed_&]:mt-0">${gate('Your sheet, rendered here')}<div data-ext id="result" aria-live="polite"></div></div>
</div>`,
  };
}

// ── Legal ──────────────────────────────────────────────────────────────────
// Operator details in one place; the Impressum and the privacy policy both read them.
const OPERATOR = {
  name: 'Casey Muns',
  place: 'Munich, Germany',
  email: 'casey@muns.dev',
  // Must match Voodoo's LEGAL_* values (instances/munsdev/instance.json in voodoo-v4-engine), so
  // every site Casey runs names the same operator, address and VAT ID.
  address: ['c/o Autorenglück #79979', 'Albert-Einstein-Straße 47', '02977 Hoyerswerda', 'Deutschland'],
  vatId: 'DE355846430',
};

function legal(path, title, description, html) {
  return { path, title, description,
    body: `<div class="wrap py-14"><article class="prose max-w-3xl"><h1>${title}</h1>${html}</article></div>` };
}

function impressum() {
  const o = OPERATOR;
  return legal('/impressum/', 'Impressum', 'Legal notice for cell2site.com.', `
<p>Information according to § 5 DDG (Digitale-Dienste-Gesetz).</p>
<h2 id="operator">Operator</h2>
<p>${o.name}<br>${o.address ? o.address.map(esc).join('<br>') : esc(o.place)}</p>
<h2 id="contact">Contact</h2>
<p>Email: <a href="mailto:${o.email}">${o.email}</a></p>
<h2 id="vat">VAT ID</h2>
<p>VAT identification number according to § 27a UStG: ${o.vatId}</p>
<h2 id="responsible">Responsible for content</h2>
<p>${o.name}, address as above (§ 18 (2) MStV).</p>
<h2 id="open-source">Open source</h2>
<p>cell2site is free software under the <a href="${SITE.repo}/blob/main/LICENSE">MIT licence</a>. The library is provided as is, without warranty. Content on sites that use it is the responsibility of those sites' operators.</p>
<h2 id="links">Links</h2>
<p>This site links to external websites. Their operators are responsible for their content; at the time of linking no unlawful content was apparent.</p>`);
}

function privacy() {
  const o = OPERATOR;
  return legal('/privacy/', 'Privacy policy', 'How cell2site.com handles personal data (Datenschutzerklärung).', `
<p><i>Datenschutzerklärung.</i> This page explains what happens to personal data when you visit cell2site.com. In short: no analytics, no tracking cookies, and nothing is loaded from Google or map servers unless you allow it.</p>
<h2 id="controller">Controller</h2>
<p>${o.name}, ${o.address ? o.address.map(esc).join(', ') : esc(o.place)}. Email: <a href="mailto:${o.email}">${o.email}</a>.</p>
<h2 id="hosting">Hosting</h2>
<p>The site is served by Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA). To deliver pages and protect against abuse, Cloudflare processes your IP address, the requested address, time, browser type and similar request data. Legal basis: Art. 6 (1) (f) GDPR (legitimate interest in a secure, working website). Cloudflare is certified under the EU–US Data Privacy Framework.</p>
<h2 id="consent">Your consent choice</h2>
<p>When you choose in the banner, your choice is stored in your browser's local storage (key <code>c2s-consent</code>) so you are not asked on every page. This is necessary for the site and needs no consent (§ 25 (2) TDDDG). To be able to prove consent, a record is sent to our consent log (a Cloudflare Worker): the choice, the banner version, the time, your country, and your browser's user agent. Neither your IP address nor anything derived from it is stored. Legal basis: Art. 6 (1) (c) and (f) GDPR. The record is kept as long as it is needed to demonstrate consent.</p>
<h2 id="external-media">External media (only with your consent)</h2>
<p>The live demos, the examples and the viewer read spreadsheet data and maps from third parties. They load only after you allow "External media", and you can withdraw that at any time under <button type="button" data-consent-open class="underline">Cookie settings</button>. When they load, your browser contacts these providers directly, which receive your IP address and browser details:</p>
<ul>
<li><b>Google Sheets</b>: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. Spreadsheet data for demos and the viewer. Data may be transferred to Google LLC in the USA (EU–US Data Privacy Framework). <a href="https://policies.google.com/privacy">Privacy policy</a>.</li>
<li><b>OpenStreetMap</b>: OpenStreetMap Foundation, St John's Innovation Centre, Cowley Road, Cambridge CB4 0WS, UK. Map tiles. <a href="https://osmfoundation.org/wiki/Privacy_Policy">Privacy policy</a>.</li>
<li><b>Esri</b>: Environmental Systems Research Institute, Inc., Redlands, CA, USA. Map tiles. <a href="https://www.esri.com/en-us/privacy/overview">Privacy policy</a>.</li>
<li><b>cdnjs</b>: Cloudflare, Inc. The Leaflet map library. <a href="https://www.cloudflare.com/privacypolicy/">Privacy policy</a>.</li>
</ul>
<p>Legal basis: your consent, Art. 6 (1) (a) GDPR and § 25 (1) TDDDG. Once allowed, the library also caches sheet data in your browser's local storage to load faster; adding <code>?clearcache</code> to any address clears it.</p>
<h2 id="no-tracking">What we do not do</h2>
<p>No analytics, no advertising, no tracking cookies, no fonts from Google: fonts are served from this site.</p>
<h2 id="links">Links to other sites</h2>
<p>Links to GitHub, Buy Me a Coffee and the showcase sites are plain links; nothing is sent to them until you click.</p>
<h2 id="rights">Your rights</h2>
<p>You have the right to access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and objection (Art. 21), and to withdraw consent at any time with effect for the future (Art. 7 (3)). Write to <a href="mailto:${o.email}">${o.email}</a>. You may also complain to a supervisory authority, for example the Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach, Germany.</p>
<p><small>Last updated: November 2026.</small></p>`);
}

function cookies() {
  const rows = [
    ['Consent choice', 'This site', 'Necessary', 'local storage <code>c2s-consent</code>', 'Until you clear it or the banner changes'],
    ['Consent record', 'This site (Cloudflare Worker)', 'Necessary', 'none in your browser', 'As long as needed to prove consent'],
    ['Google Sheets', 'Google Ireland Ltd.', 'External media', 'none set by this site', 'Per Google'],
    ['Map tiles', 'OpenStreetMap Foundation; Esri', 'External media', 'none', 'Per provider'],
    ['Map library', 'cdnjs (Cloudflare)', 'External media', 'none', 'Per provider'],
    ['Sheet cache', 'This site', 'External media', 'local storage <code>cell2site_cache_*</code>', 'Up to one hour per sheet'],
  ];
  return legal('/cookies/', 'Cookies and storage', 'Every cookie, storage key and outside service cell2site.com uses.', `
<p>cell2site.com sets <b>no cookies</b>. It uses your browser's local storage for the two items below marked "This site", and loads outside services only in the "External media" category, after you allow it.</p>
<p><button type="button" data-consent-open class="btn btn-sm">Change your choice</button></p>
<table><thead><tr><th>What</th><th>Provider</th><th>Category</th><th>Stored</th><th>Kept</th></tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p>Details, legal bases and your rights are in the <a href="/privacy/">privacy policy</a>.</p>`);
}

function notFound() {
  return { path: '/404.html', title: 'Page not found', description: 'This page does not exist.', noindex: true,
    body: `<div class="wrap py-24"><span class="cellref">#REF!</span><h1 class="mt-4 text-5xl">This cell is empty</h1>
<p class="mt-3 text-lg text-[var(--muted)]">The page you asked for does not exist. Try the <a href="/">home page</a>, the <a href="/docs/">docs</a> or the <a href="/examples/">examples</a>.</p></div>` };
}

export function pages(root) {
  return [
    docPage({ path: '/docs/', title: 'Documentation', file: join(root, 'README.md'),
      description: 'Everything cell2site can do: embeds, lists, tabs, maps, the config sheet, and every attribute.' }),
    docPage({ path: '/changelog/', title: 'Changelog', file: join(root, 'CHANGELOG.md'),
      description: 'What changed in each cell2site release.' }),
    docPage({ path: '/docs/webflow/', title: 'Webflow guide', file: join(root, 'site/examples/webflow.md'),
      description: 'Set up cell2site on a Webflow site, step by step.' }),
    examplesIndex(),
    ...EXAMPLES.map((e) => examplePage(root, e)),
    viewer(), impressum(), privacy(), cookies(), notFound(),
  ];
}
