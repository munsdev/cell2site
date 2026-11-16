import { SITE, esc, gate } from './layout.mjs';

const CDN = (v) => `https://cdn.jsdelivr.net/gh/munsdev/cell2site@v${v}/cell2site.js`;

// The live demo: each tab's markup is shown as code and, once external media is allowed,
// rendered by the library itself, so the code on screen is exactly what produced the demo.
const DEMOS = [
  ['cards', 'Cards', `<div data-cell2-embed="cards"
     data-cell2-id="${SITE.demoSheet}"
     data-cell2-sheet="Museums"></div>`],
  ['table', 'Table', `<div data-cell2-embed="table"
     data-cell2-id="${SITE.demoSheet}"
     data-cell2-sheet="Events"
     data-cell2-sort-col="Date" data-cell2-sort-type="date"></div>`],
  ['map', 'Map', `<div data-cell2-embed="map"
     data-cell2-id="${SITE.demoSheet}"
     data-cell2-sheet="Parks" data-cell2-map-tiles="light"></div>`],
  ['tabs', 'Tabs (your markup)', `<!-- Tabs, order, labels and colours come from the sheet's _config tab. -->
<div class="demo-tabs" data-cell2-tabs data-cell2-id="${SITE.demoSheet}">
  <nav>
    <a data-cell2-tab-link data-cell2-var="tab:Color">
      <span data-cell2-meta="tab-title"></span> (<span data-cell2-tab-count></span>)
    </a>
  </nav>
  <div>
    <div data-cell2-tab-content>
      <div data-cell2-list>
        <div class="row" data-cell2-item data-cell2-var="dot:Color">
          <b data-cell2-field="Name"></b>
          <small><span data-cell2-field="City"></span> · <span data-cell2-meta="tab-label"></span></small>
        </div>
      </div>
    </div>
  </div>
</div>`],
];

const PLATFORMS = (v) => [
  ['html', 'HTML', 'Paste anywhere in the page. The script goes in once, before </body>.',
    `<div data-cell2-embed="cards" data-cell2-id="YOUR_SHEET_URL"></div>\n<script src="${CDN(v)}"></script>`],
  ['webflow', 'Webflow', 'Site settings → Custom code → Footer: paste the script once. Then drop an Embed element where the list goes, or give your own elements data-cell2-* custom attributes.',
    `<!-- Footer code -->\n<script src="${CDN(v)}"></script>\n\n<!-- Embed element -->\n<div data-cell2-embed="cards" data-cell2-id="YOUR_SHEET_URL"></div>`],
  ['wordpress', 'WordPress', 'Add a Custom HTML block where the list goes.',
    `<div data-cell2-embed="list" data-cell2-id="YOUR_SHEET_URL"></div>\n<script src="${CDN(v)}"></script>`],
  ['builders', 'Squarespace · Wix · Framer', "Use the builder's code block or HTML embed (Squarespace: Code block, Wix: Embed code, Framer: Embed).",
    `<div data-cell2-embed="list" data-cell2-id="YOUR_SHEET_URL"></div>\n<script src="${CDN(v)}"></script>`],
  ['iframe', 'No scripts allowed', 'Some platforms only take an iframe. Set it up in the viewer and copy its iframe code, or adapt this one.',
    `<iframe src="${SITE.origin}/view/?sheet=YOUR_SHEET_URL&format=cards&embed=1"\n        width="100%" height="600" style="border:0" loading="lazy" title="Sheet content"></iframe>`],
];

const STEPS = [
  ['A1', 'Share your Google Sheet', 'Share → General access → <b>Anyone with the link</b>, Viewer. The first row holds the column names.',
    `<a class="btn btn-sm mt-4" href="${SITE.demoSheet}">Open the demo sheet</a>`],
  ['B1', 'Add the script tag', "Paste one line into your site's custom code. No build step, no API key, no account.", ''],
  ['C1', 'Mark up your HTML', 'Drop in a ready-made embed, or connect your own design to the cells with data-cell2-* attributes.',
    '<a class="btn btn-sm mt-4" href="/docs/">Read the docs</a>'],
];

const SHOWCASE = [
  ['List', 'EPICburger', '/assets/showcase-epicburger.png', 'https://epic-burger.webflow.io/',
    'The menu of a (fictional) burger restaurant. Each tab of the menu is a tab in the spreadsheet, and the opening hours in the footer come from its "Hours" tab.'],
  ['Map + list', 'The Heritage Atlas', '/assets/showcase-heritage-atlas.png', 'https://theheritageatlas.com/',
    'Over 1,000 UNESCO World Heritage sites from one spreadsheet, on a searchable, filterable map and in a categorised, tabbed list.'],
];

const USES = ['A community garden listing plot availability', "A band's tour dates", "A nonprofit's volunteer opportunities map",
  "A restaurant's daily specials", "A school's staff directory", 'A conference schedule in tabs', "A small shop's stockists map",
  'A job board fed by a form', "A food bank's pickup locations and hours", 'A little free library map', 'A product changelog',
  'An FAQ as accordions', "An estate agent's open houses", "A gym's timetable, one tab per day", "A museum's exhibitions by gallery",
  "A farmers market's vendors", "A club's meeting minutes", "A makerspace's equipment list", 'A podcast episode index',
  "A city's public art walking map", "A team's on-call table", 'A local events calendar', 'A course reading list by week',
  'A directory of local tradespeople'];

const chips = (id, items) => `<div class="flex flex-wrap gap-2" role="tablist" data-chips id="${id}">
  ${items.map(([key, label], i) => `<button type="button" class="chip cursor-pointer" role="tab" id="${id}-${key}" aria-controls="${id}-${key}-panel" aria-selected="${i === 0}">${esc(label)}</button>`).join('')}
</div>`;

export function home(version) {
  return {
    path: '/',
    title: 'cell2site: turn Google Sheets into live websites',
    description: 'Turn a Google Sheet into lists, cards, tables and maps on any website. One script tag, no server, no API key. Free and open source.',
    scripts: ['/assets/home.js'],
    body: `
<section class="bg-cells relative overflow-hidden border-b-2 border-[var(--border)] bg-gradient-to-br from-green-lightest/40 to-green/25 dark:from-green-darker/40 dark:to-green-darker/80">
  <div class="wrap grid grid-cols-1 gap-12 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
    <div>
      <span class="eyebrow"><span class="cellref">A1</span> Open source · MIT</span>
      <h1 class="mt-5 text-5xl sm:text-6xl">Turn Google Sheets into live websites</h1>
      <p class="mt-6 max-w-xl text-lg text-[var(--muted)]">Share a sheet, add a script tag, mark up your HTML. No build step, no API keys, no backend. Anyone who can edit a spreadsheet can update the site.</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a class="btn btn-primary" href="/view/">Try it with your sheet</a>
        <a class="btn" href="${SITE.repo}">View on GitHub</a>
      </div>
    </div>
    <div class="self-center">
      <div class="card p-0 shadow-[6px_6px_0_var(--border)]">
        <div class="flex items-center gap-2 border-b-2 border-[var(--border)] px-4 py-2 font-mono text-sm"><span class="cellref">fx</span><span class="text-[var(--muted)]">One line, then attributes</span></div>
        <pre class="overflow-x-auto p-4 font-mono text-[15px] leading-relaxed" id="install"><code>&lt;script src="${CDN(version)}"&gt;&lt;/script&gt;

&lt;div data-cell2-embed="cards"
     data-cell2-id="YOUR_SHEET_URL"&gt;&lt;/div&gt;</code></pre>
        <div class="flex justify-end border-t-2 border-[var(--border)] px-3 py-2"><button type="button" class="btn btn-sm" data-copy="#install">Copy</button></div>
      </div>
    </div>
  </div>
</section>

<section class="wrap py-20" aria-labelledby="demo-h">
  <span class="eyebrow"><span class="cellref">A2</span> Live demo</span>
  <h2 id="demo-h" class="mt-3 text-4xl">Live from a spreadsheet</h2>
  <p class="mt-3 max-w-2xl text-[var(--muted)]">Everything below is read from <a href="${SITE.demoSheet}">this public sheet</a>, by your browser, as the page loads. Copy the sheet, edit it, and the page follows.</p>
  <div class="mt-8">${chips('demo', DEMOS)}</div>
  ${DEMOS.map(([key, , code], i) => `
  <div id="demo-${key}-panel" role="tabpanel" aria-labelledby="demo-${key}" ${i ? 'hidden' : ''} class="mt-5 grid grid-cols-1 gap-4">
    <div class="card min-h-72 p-4 sm:p-6">${gate('Live ' + key + ' demo')}<div data-ext data-demo="${key}"></div></div>
    <div class="flex items-center justify-between"><span class="text-sm text-[var(--muted)]">The code for this view</span><button type="button" class="btn btn-sm" data-copy="#demo-${key}-code">Copy</button></div>
    <pre class="code" id="demo-${key}-code"><code>${esc(code)}</code></pre>
  </div>`).join('')}
</section>

<section class="border-y-2 border-[var(--border)] bg-[var(--surface)] py-20" aria-labelledby="steps-h">
  <div class="wrap">
    <span class="eyebrow"><span class="cellref">A3</span> Setup</span>
    <h2 id="steps-h" class="mt-3 text-4xl">It's as easy as 1, 2, 3</h2>
    <p class="mt-3 max-w-2xl text-[var(--muted)]">Basic setup takes a few minutes and very little code.</p>
    <ol class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
      ${STEPS.map(([ref, title, text, extra]) => `<li class="card">
        <span class="cellref text-green-dark dark:text-green-light">${ref}</span>
        <h3 class="mt-4 text-2xl">${title}</h3>
        <p class="mt-2 text-[var(--muted)]">${text}</p>${extra}
      </li>`).join('')}
    </ol>
  </div>
</section>

<section class="wrap py-20" aria-labelledby="where-h">
  <span class="eyebrow"><span class="cellref">A4</span> Platforms</span>
  <h2 id="where-h" class="mt-3 text-4xl">Works where you build</h2>
  <p class="mt-3 max-w-2xl text-[var(--muted)]">Pick your platform for copy-paste code. Replace YOUR_SHEET_URL with your sheet's address-bar URL.</p>
  <div class="mt-8">${chips('platform', PLATFORMS(version))}</div>
  ${PLATFORMS(version).map(([key, , text, code], i) => `
  <div id="platform-${key}-panel" role="tabpanel" aria-labelledby="platform-${key}" ${i ? 'hidden' : ''} class="mt-5 grid grid-cols-1 gap-4">
    <p class="text-[var(--muted)]">${esc(text)}</p>
    <div class="relative"><pre class="code pr-24" id="platform-${key}-code"><code>${esc(code)}</code></pre>
      <button type="button" class="btn btn-sm absolute right-3 top-3" data-copy="#platform-${key}-code">Copy</button></div>
  </div>`).join('')}
</section>

<section class="border-y-2 border-[var(--border)] bg-[var(--surface)] py-20" aria-labelledby="showcase-h">
  <div class="wrap">
    <span class="eyebrow"><span class="cellref">A5</span> Examples</span>
    <h2 id="showcase-h" class="mt-3 text-4xl">See it working</h2>
    <p class="mt-3 max-w-2xl text-[var(--muted)]">Two real sites run on cell2site, with no styling tricks. More copy-paste examples are on the <a href="/examples/">examples page</a>.</p>
    <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
      ${SHOWCASE.map(([tag, name, img, url, text]) => `<article class="card flex flex-col p-0 overflow-hidden">
        <img src="${img}" alt="Screenshot of ${esc(name)}" width="500" height="280" loading="lazy" class="aspect-[16/9] w-full border-b-2 border-[var(--border)] object-cover object-top">
        <div class="flex flex-1 flex-col p-6">
          <span class="font-mono text-sm text-[var(--muted)]">${tag}</span>
          <h3 class="mt-1 text-2xl">${name}</h3>
          <p class="mt-2 flex-1 text-[var(--muted)]">${text}</p>
          <a class="btn btn-sm mt-5 self-start" href="${url}">Visit the site</a>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="wrap py-20" aria-labelledby="facts-h">
  <span class="eyebrow"><span class="cellref">A6</span> Principles</span>
  <h2 id="facts-h" class="mt-3 text-4xl">Small on purpose</h2>
  <div class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    ${[['Private by design', "Visitors' browsers read the sheet straight from Google. Nothing passes through a cell2site server."],
       ['Your design, or ours', 'Ready-made embeds take on your fonts and colours, or bind any HTML you already have, Webflow included.'],
       ['Safe with untrusted cells', 'Cell HTML is sanitised, so a sheet fed by a public form cannot inject script into your site.'],
       ['One file, MIT', 'Plain JavaScript and no dependencies. Leaflet loads only on pages with a map.']]
      .map(([t, d]) => `<div class="border-l-4 border-green pl-4"><h3 class="font-sans text-lg font-bold">${t}</h3><p class="mt-1 text-[var(--muted)]">${d}</p></div>`).join('')}
  </div>
</section>

<section class="border-t-2 border-[var(--border)] bg-[var(--surface)] py-20" aria-labelledby="uses-h">
  <div class="wrap">
    <span class="eyebrow"><span class="cellref">A7</span> Use cases</span>
    <h2 id="uses-h" class="mt-3 text-4xl">Who runs a website from a sheet?</h2>
    <p class="mt-3 max-w-2xl text-[var(--muted)]">Anyone whose content changes more often than their site does.</p>
    <ul class="mt-10 grid border-l-2 border-t-2 border-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
      ${USES.map((u, i) => `<li class="flex gap-3 border-b-2 border-r-2 border-[var(--border)] bg-[var(--bg)] px-4 py-3"><span class="w-7 shrink-0 font-mono text-sm text-[var(--muted)]">${i + 1}</span>${esc(u)}</li>`).join('')}
    </ul>
  </div>
</section>

<section class="bg-cells bg-cells-light border-t-2 border-[var(--border)] bg-purple text-white" aria-labelledby="coffee-h">
  <div class="wrap flex flex-wrap items-center justify-between gap-8 py-16">
    <div class="max-w-xl">
      <h2 id="coffee-h" class="text-4xl">Did you find this useful?</h2>
      <p class="mt-3 text-white/85">Consider buying me a cup of coffee, so I can stay awake long enough to build more cool stuff.</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <a class="btn btn-on-color" href="${SITE.coffee}">Buy me a coffee</a>
      <a class="btn btn-on-color" href="${SITE.repo}">Star on GitHub</a>
    </div>
  </div>
</section>`,
    demos: Object.fromEntries(DEMOS.map(([key, , code]) => [key, code])),
  };
}
