// The site's shared components. Every page goes through page(), so header, footer, consent
// banner and metadata cannot drift apart between pages.
export const SITE = {
  name: 'cell2site',
  origin: 'https://cell2site.com',
  repo: 'https://github.com/munsdev/cell2site',
  demoSheet: 'https://docs.google.com/spreadsheets/d/1wlr72cfR-Z0MlFsB_MxgjGVcd2UOv6ffdFyhTLpIzlQ/edit',
  coffee: 'https://buymeacoffee.com/muns',
};

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');

const NAV = [
  ['/docs/', 'Docs'],
  ['/examples/', 'Examples'],
  ['/view/', 'Viewer'],
  ['/changelog/', 'Changelog'],
];

const ICON = {
  github: '<svg aria-hidden="true" viewBox="0 0 16 16" class="size-5" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>',
  external: '<svg aria-hidden="true" viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9"/></svg>',
};

// Casey's cell2.site wordmark and C2S icon, from the original Webflow site. The wordmark is white
// with its own grid lines, so it only sits on the black header and footer.
const LOGO = (size) => `<img src="/assets/cell2site-logo-white-500.png" srcset="/assets/cell2site-logo-white-500.png 500w, /assets/cell2site-logo-white.png 800w" sizes="200px" alt="cell2.site" width="800" height="313" class="${size} w-auto">`;

function head(p, asset) {
  const url = SITE.origin + p.path;
  const title = p.path === '/' ? p.title : p.title + ' · cell2site';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="cell2site">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/assets/og.png">
<meta name="theme-color" content="#479e6a">
<link rel="icon" href="${asset('/assets/favicon-32.png')}" type="image/png" sizes="32x32" media="(prefers-color-scheme: light)">
<link rel="icon" href="${asset('/assets/favicon-32-dark.png')}" type="image/png" sizes="32x32" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${asset('/assets/favicon-48.png')}" type="image/png" sizes="48x48">
<link rel="icon" href="${asset('/assets/icon-192.png')}" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${asset('/assets/apple-touch-icon.png')}" sizes="180x180">
<link rel="preload" href="/assets/fonts/ubuntu-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/ubuntu-mono-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset('/assets/site.css')}">
<meta name="c2-lib" content="${asset('/cell2site.js')}">
<meta name="c2-version" content="${SITE.version}">
${p.noindex ? '<meta name="robots" content="noindex">' : ''}
<script src="${asset('/assets/consent.js')}"></script>
</head>`;
}

function header(p) {
  const link = ([href, label]) => {
    const current = p.path.startsWith(href);
    return `<a href="${href}" class="rounded-md px-3 py-2 font-medium no-underline hover:text-green-light ${current ? 'text-green-light' : 'text-[var(--fg)]'}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
  };
  return `
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[var(--bg)] focus:px-3 focus:py-2">Skip to content</a>
<header data-chrome class="scheme-black sticky top-0 z-40">
  <div class="wrap flex h-16 items-center justify-between gap-4">
    <a href="/" class="block shrink-0">${LOGO('h-14')}</a>
    <nav aria-label="Main" class="hidden items-center gap-1 md:flex">
      ${NAV.map(link).join('')}
      <a href="${SITE.repo}" class="btn btn-sm ml-3">${ICON.github}<span>GitHub</span></a>
    </nav>
    <details class="relative md:hidden">
      <summary class="btn btn-sm list-none cursor-pointer" aria-label="Menu">Menu</summary>
      <nav aria-label="Main" class="card absolute right-0 mt-2 grid w-56 gap-1 p-2 shadow-[4px_4px_0_var(--border)]">
        ${NAV.map(link).join('')}
        <a href="${SITE.repo}" class="inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium text-[var(--fg)] no-underline">${ICON.github} GitHub</a>
      </nav>
    </details>
  </div>
</header>`;
}

function footer() {
  const col = (title, links) => `<div><h2 class="mb-3 font-mono text-sm uppercase tracking-wider text-green-light">${title}</h2>
    <ul class="grid gap-2">${links.map((l) => `<li>${l}</li>`).join('')}</ul></div>`;
  const a = (href, label, ext) => `<a href="${href}" class="text-white/80 no-underline hover:text-white hover:underline">${label}${ext ? ' ' + ICON.external.replace('class="', 'class="inline ') : ''}</a>`;
  return `
<footer data-chrome class="scheme-black">
  <div class="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
    <div class="max-w-xs">
      <a href="/" class="block w-fit">${LOGO('h-16')}</a>
      <p class="mt-3 text-white/70">Google Sheets on any website. Free and open source under the MIT licence.</p>
    </div>
    ${col('Product', [a('/docs/', 'Docs'), a('/examples/', 'Examples'), a('/view/', 'Viewer'), a('/changelog/', 'Changelog')])}
    ${col('Project', [a(SITE.repo, 'GitHub', true), a(SITE.repo + '/issues', 'Report a bug', true), a(SITE.coffee, 'Buy me a coffee', true)])}
    ${col('Legal', [a('/impressum/', 'Impressum'), a('/privacy/', 'Privacy'), a('/cookies/', 'Cookies'),
      '<button type="button" data-consent-open class="cursor-pointer text-white/80 hover:text-white hover:underline">Cookie settings</button>'])}
  </div>
  <div class="border-t border-white/15"><div class="wrap flex flex-wrap justify-between gap-2 py-5 text-sm text-white/60">
    <span>© 2025–2026 Casey Muns · <a href="https://muns.dev" class="text-white/60">muns.dev</a></span>
    <span>No analytics. No tracking cookies.</span>
  </div></div>
</footer>`;
}

// The banner follows the Voodoo consent rules: Accept and Reject equally prominent on the first
// layer, nothing preselected, a settings layer per category, and reachable again from the footer.
function consentBanner() {
  return `
<div id="consent" hidden class="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md" role="dialog" aria-modal="false" aria-labelledby="consent-title">
  <div class="card shadow-[5px_5px_0_var(--border)]">
    <h2 id="consent-title" class="text-xl">Your choice</h2>
    <p class="mt-2 text-[15px] text-[var(--muted)]">This site sets no tracking cookies. Its live demos load data from <b>Google Sheets</b> and map tiles from <b>OpenStreetMap</b> and <b>Esri</b>, which shares your IP address with them. <a href="/cookies/">Details</a></p>
    <fieldset id="consent-settings" hidden class="mt-4 grid gap-3 border-t-2 border-[var(--line)] pt-4 text-[15px]">
      <legend class="sr-only">Categories</legend>
      <label class="flex gap-3"><input type="checkbox" checked disabled class="mt-1 size-4 accent-green"><span><b>Necessary</b><br><span class="text-[var(--muted)]">Remembers this choice. Always on.</span></span></label>
      <label class="flex gap-3"><input type="checkbox" data-category="external" class="mt-1 size-4 accent-green"><span><b>External media</b><br><span class="text-[var(--muted)]">Google Sheets, map tiles, and the map library from cdnjs.</span></span></label>
    </fieldset>
    <div class="mt-4 grid grid-cols-2 gap-2">
      <button type="button" class="btn btn-sm" data-consent="reject">Reject</button>
      <button type="button" class="btn btn-sm" data-consent="accept">Accept</button>
      <button type="button" class="col-span-2 text-sm text-[var(--muted)] underline" data-consent="settings">Settings</button>
      <button type="button" hidden class="btn btn-sm col-span-2" data-consent="save">Save choice</button>
    </div>
  </div>
</div>`;
}

// Stands in for anything that loads from Google or a map server until external media is allowed.
export function gate(what) {
  return `<div data-ext-placeholder class="bg-cells grid min-h-64 place-items-center rounded-[var(--radius-cell)] border-2 border-dashed border-[var(--border)] p-6 text-center">
  <div class="max-w-sm">
    <p class="font-mono text-lg">${what}</p>
    <p class="mt-1 text-sm text-[var(--muted)]">This loads data from Google Sheets (and maps from OpenStreetMap / Esri). <a href="/cookies/">What that means</a></p>
    <button type="button" class="btn btn-primary btn-sm mt-4" data-consent="accept-external">Load external content</button>
  </div>
</div>`;
}

// page: { path, title, description, body, bodyClass?, scripts?: [asset paths], noindex? }
export function page(p, asset) {
  return `${head(p, asset)}
<body class="${p.bodyClass || ''} flex min-h-screen flex-col">
${header(p)}
<main id="main" class="flex-1">
${p.body}
</main>
${footer()}
${consentBanner()}
<script src="${asset('/assets/site.js')}"></script>
${(p.scripts || []).map((s) => `<script src="${asset(s)}"></script>`).join('\n')}
</body>
</html>`;
}

export const ICONS = ICON;
