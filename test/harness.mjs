// Runs pages in real Chromium with the network stubbed: Google Sheets answers from the fixtures
// below, cdnjs from node_modules, map tiles with nothing. Nothing leaves the machine.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Playwright comes from the environment (CI image or a global install), not devDependencies:
// its browser build must match the installed Chromium.
const { chromium } = require('playwright');
const root = new URL('..', import.meta.url).pathname;
const script = readFileSync(root + 'cell2site.js', 'utf8');
const vendor = (path) => readFileSync(require.resolve(path), 'utf8');

const CDN = {
  'leaflet/1.9.4/leaflet.min.js': vendor('leaflet/dist/leaflet.js'),
  'leaflet/1.9.4/leaflet.min.css': vendor('leaflet/dist/leaflet.css'),
  'leaflet.markercluster/1.5.3/leaflet.markercluster.min.js': vendor('leaflet.markercluster/dist/leaflet.markercluster.js'),
  'leaflet.markercluster/1.5.3/MarkerCluster.min.css': vendor('leaflet.markercluster/dist/MarkerCluster.css'),
  'leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css': vendor('leaflet.markercluster/dist/MarkerCluster.Default.css'),
};

// Tab name (or "gid:N") → CSV. A string starting with "<" is served as HTML, which is what
// Google sends for a sheet that is not shared.
export const csv = (rows) => rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');

export async function launch() {
  const browser = await chromium.launch();
  return {
    browser,
    async open(body, sheets) {
      const page = await browser.newPage();
      const requests = [];
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('dialog', (d) => { errors.push('dialog: ' + d.message()); d.dismiss(); });

      await page.route('https://docs.google.com/**', (route) => {
        const url = new URL(route.request().url());
        requests.push(url.href);
        const key = url.searchParams.get('sheet') || (url.searchParams.get('gid') ? 'gid:' + url.searchParams.get('gid') : '');
        const data = sheets[key];
        if (data === undefined) return route.fulfill({ status: 404, body: 'no such tab' });
        const html = data.startsWith('<');
        return route.fulfill({ status: 200, contentType: html ? 'text/html' : 'text/csv',
          headers: { 'access-control-allow-origin': '*' }, body: data });
      });
      await page.route('https://cdnjs.cloudflare.com/**', (route) => {
        const path = route.request().url().split('/ajax/libs/')[1];
        return CDN[path] ? route.fulfill({ status: 200, body: CDN[path],
          contentType: path.endsWith('.css') ? 'text/css' : 'text/javascript' }) : route.abort();
      });
      await page.route(/tile|basemaps|arcgisonline/, (route) => route.abort());
      // Loaded by src, as on a real page: inlined, the "</script>" in its header comment would end the tag.
      await page.route('http://test.local/cell2site.js', (route) =>
        route.fulfill({ status: 200, contentType: 'text/javascript', body: script }));
      await page.route('http://test.local/', (route) => route.fulfill({
        status: 200, contentType: 'text/html',
        body: '<!doctype html><meta charset="utf-8"><body>' + body + '<script src="/cell2site.js"></script></body>',
      }));
      await page.goto('http://test.local/');
      return { page, requests, errors };
    },
    close: () => browser.close(),
  };
}
