import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, csv } from './harness.mjs';

let h;
before(async () => { h = await launch(); });
after(() => h.close());

const ready = (page, sel) => page.waitForFunction((s) => {
  const el = document.querySelector(s);
  return el && !el.classList.contains('is-loading') && !el.querySelector('.cell2site-skeleton-item');
}, sel);

const texts = (page, sel) => page.$$eval(sel, (els) => els.map((e) => e.textContent.trim()));

const PEOPLE = csv([
  ['Name', 'Role', 'Age', 'Bio', 'URL', 'Featured'],
  ['Cara', 'Design', '41', '', 'https://cara.example', 'yes'],
  ['', '', '', '', '', ''],
  ['Abe', 'Code', '9', 'Writes [docs](https://docs.example) daily', '', 'no'],
  ['Bea', 'Code', '30', 'See https://bea.example', 'javascript:alert(1)', ''],
]);

test('list: renders rows, skips blank rows, sorts numerically, honours wrappers and show-if', async () => {
  const { page, errors } = await h.open(`
    <div id="l" data-cell2-list data-cell2-id="SHEET" data-cell2-sheet="People"
         data-cell2-sort-col="Age" data-cell2-sort-type="number">
      <div data-cell2-item>
        <h3 data-cell2-field="Name"></h3>
        <div class="bio" data-cell2-field-wrapper><p data-cell2-field="Bio"></p></div>
        <a data-cell2-field-attr="href:URL">site</a>
        <em data-cell2-show-if="Featured">★</em>
      </div>
      <span data-cell2-count></span>
    </div>`, { People: PEOPLE });
  await ready(page, '#l');
  assert.deepEqual(await texts(page, 'h3'), ['Abe', 'Bea', 'Cara']);
  assert.equal(await page.textContent('[data-cell2-count]'), '3');
  assert.equal(await page.$$eval('.bio', (e) => e.length), 2, 'blank Bio removes its wrapper');
  assert.equal(await page.$$eval('em', (e) => e.length), 1, 'show-if keeps only the featured row');
  assert.deepEqual(errors, []);
});

test('fields: markdown and bare URLs become links; unsafe URLs never reach an attribute', async () => {
  const { page } = await h.open(`
    <div id="l" data-cell2-list data-cell2-id="SHEET" data-cell2-sheet="People">
      <div data-cell2-item><p data-cell2-field="Bio"></p><a data-cell2-field-attr="href:URL">x</a></div>
    </div>`, { People: PEOPLE });
  await ready(page, '#l');
  const links = await page.$$eval('p a', (as) => as.map((a) => [a.textContent, a.href]));
  assert.deepEqual(links, [['docs', 'https://docs.example/'], ['https://bea.example', 'https://bea.example/']]);
  const hrefs = await page.$$eval('[data-cell2-field-attr]', (as) => as.map((a) => a.getAttribute('href')));
  assert.ok(!hrefs.some((h) => h && h.startsWith('javascript')), 'javascript: href was set: ' + hrefs);
});

test('fields: HTML in a cell is rendered without anything that can run', async () => {
  const evil = csv([['Name', 'Body'],
    ['x', '<b>bold</b><img src=x onerror="alert(1)"><script>alert(2)</script>' +
      '<a href="java\tscript:alert(3)">a</a><iframe srcdoc="<script>alert(4)</script>"></iframe>' +
      '<svg onload="alert(5)"></svg>']]);
  const { page, errors } = await h.open(`
    <div id="l" data-cell2-list data-cell2-id="SHEET">
      <div data-cell2-item><div class="f" data-cell2-field="Body"></div><div class="h" data-cell2-field-html="Body"></div></div>
    </div>`, { Sheet1: evil });
  await ready(page, '#l');
  await page.waitForTimeout(300);
  for (const sel of ['.f', '.h']) {
    const html = await page.$eval(sel, (e) => e.innerHTML);
    assert.match(html, /<b>bold<\/b>/);
    assert.doesNotMatch(html, /onerror|onload|<script|srcdoc|javascript|<svg/i, sel + ': ' + html);
  }
  assert.deepEqual(errors, []);
});

test('source: a pasted URL resolves to its ID and its gid picks the tab', async () => {
  const { page, requests } = await h.open(`
    <div id="l" data-cell2-list data-cell2-id="https://docs.google.com/spreadsheets/d/ABC_123-x/edit#gid=42">
      <div data-cell2-item><span data-cell2-field="Name"></span></div>
    </div>`, { 'gid:42': csv([['Name'], ['From gid']]) });
  await ready(page, '#l');
  assert.equal(await page.textContent('#l span'), 'From gid');
  assert.match(requests[0], /\/d\/ABC_123-x\/gviz\/tq\?tqx=out:csv&headers=1&gid=42$/);
});

test('errors: a private sheet shows how to fix it', async () => {
  const { page } = await h.open(`
    <div id="l" data-cell2-list data-cell2-id="SHEET">
      <div data-cell2-item></div>
      <p data-cell2-error style="display:none"><span data-cell2-field="message"></span></p>
    </div>`, { Sheet1: '<!DOCTYPE html><html>Sign in</html>' });
  await page.waitForSelector('[data-cell2-error]', { state: 'visible' });
  assert.match(await page.textContent('[data-cell2-error]'), /Anyone with the link/);
});

test('list: search, filter and reset narrow the rows and update the count', async () => {
  const { page } = await h.open(`
    <div data-cell2-wrapper>
      <input data-cell2-search>
      <select data-cell2-filter="Role"><option value="">All</option></select>
      <button data-cell2-reset>reset</button>
      <span data-cell2-count></span>
      <p data-cell2-empty style="display:none">none</p>
      <div id="l" data-cell2-list data-cell2-id="SHEET" data-cell2-sheet="People" data-cell2-item-limit="2">
        <div data-cell2-item><h3 data-cell2-field="Name"></h3></div>
      </div>
    </div>`, { People: PEOPLE });
  await ready(page, '#l');
  assert.deepEqual(await texts(page, '[data-cell2-filter] option'), ['All', 'Code', 'Design']);
  await page.selectOption('[data-cell2-filter]', 'Design');
  assert.deepEqual(await texts(page, 'h3'), ['Cara'], 'limit applies after filtering');
  await page.selectOption('[data-cell2-filter]', '');
  await page.fill('[data-cell2-search]', 'zzz');
  await page.waitForSelector('[data-cell2-empty]', { state: 'visible' });
  assert.equal(await page.textContent('[data-cell2-count]'), '0');
  await page.click('[data-cell2-reset]');
  assert.equal(await page.$$eval('h3', (e) => e.length), 2);
});

test('tabs: config order, merged tab de-duplicates, active tab, counts, keyboard', async () => {
  const config = csv([['Tab', 'Label', 'Active', 'Accent'],
    ['Fruit', 'Fruit', '', '#f00'], ['Veg', 'Veg', 'yes', ''], ['Fruit, Veg', 'Everything', '', ''], ['*', '', '', '#00f']]);
  const fruit = csv([['Name'], ['Apple'], ['Fig']]);
  const veg = csv([['Name'], ['Kale'], ['Fig']]);
  const { page } = await h.open(`
    <div id="t" data-cell2-tabs data-cell2-id="SHEET">
      <nav><a data-cell2-tab-link data-cell2-var="accent:Accent"><span data-cell2-meta="tab-title"></span>
        (<b data-cell2-tab-count></b>)</a></nav>
      <div><div data-cell2-tab-content><ul data-cell2-list><li data-cell2-item data-cell2-field="Name"></li></ul></div></div>
    </div>`, { _config: config, Fruit: fruit, Veg: veg });
  await page.waitForSelector('[role=tab]');
  assert.deepEqual(await texts(page, '[role=tab] span'), ['Fruit', 'Veg', 'Everything']);
  assert.deepEqual(await texts(page, '[role=tab] b'), ['2', '2', '3']);
  assert.deepEqual(await texts(page, '[role=tabpanel]:not([style*="none"]) li'), ['Kale', 'Fig']);
  const accents = await page.$$eval('[role=tab]', (els) => els.map((e) => e.style.getPropertyValue('--accent')));
  assert.deepEqual(accents, ['#f00', '#00f', '#00f'], 'tab row first, then the * row');
  await page.focus('[role=tab]:nth-child(3)');
  await page.keyboard.press('Enter');
  assert.deepEqual(await texts(page, '[role=tabpanel]:not([style*="none"]) li'), ['Apple', 'Fig', 'Kale']);
});

test('accordion: a quick open-then-close stays closed', async () => {
  const { page } = await h.open(`
    <div id="l" data-cell2-list data-cell2-id="SHEET">
      <div data-cell2-item>
        <div class="accordion2_top" data-cell2-field="Name"></div>
        <div class="accordion2_bottom"><p>Body<br>text</p></div>
      </div>
    </div>`, { Sheet1: csv([['Name'], ['Q']]) });
  await ready(page, '#l');
  await page.click('.accordion2_top');
  await page.waitForTimeout(80);
  await page.click('.accordion2_top');
  await page.waitForTimeout(600);
  assert.equal(await page.$eval('.accordion2_bottom', (e) => e.getBoundingClientRect().height), 0);
  assert.equal(await page.getAttribute('.accordion2_top', 'aria-expanded'), 'false');
});

const PLACES = csv([['Name', 'Latitude', 'Longitude', 'Kind'],
  ['Twin', '48.1', '11.5', 'Cafe'], ['Twin', '52.5', '13.4', 'Cafe'],
  ['', '40,4', '-3,7', 'Park'], ['Nowhere', '', '', 'Park']]);

test('map: duplicate and blank names each get a marker; filters recount; comma decimals parse', async () => {
  const { page, errors } = await h.open(`
    <div id="m" data-cell2-map-wrapper data-cell2-id="SHEET" data-cell2-sheet="Places">
      <select data-cell2-map-filter="Kind"><option value="">All</option></select>
      <span data-cell2-count></span>
      <div data-cell2-map style="height:300px"></div>
    </div>`, { Places: PLACES });
  await page.waitForFunction(() => document.querySelector('[data-cell2-count]').textContent === '3');
  await page.selectOption('[data-cell2-map-filter]', 'Park');
  assert.equal(await page.textContent('[data-cell2-count]'), '1');
  await page.selectOption('[data-cell2-map-filter]', '');
  assert.equal(await page.textContent('[data-cell2-count]'), '3');
  assert.deepEqual(errors, []);
});

test('list → map: clicking an item opens that marker’s popup', async () => {
  const { page } = await h.open(`
    <div data-cell2-map-wrapper data-cell2-map-id="m" data-cell2-id="SHEET" data-cell2-sheet="Places">
      <div data-cell2-map style="height:300px"></div>
      <div data-cell2-map-card><b class="pop" data-cell2-field="Kind"></b></div>
    </div>
    <ul id="l" data-cell2-list data-cell2-map-ref="m" data-cell2-id="SHEET" data-cell2-sheet="Places">
      <li data-cell2-item data-cell2-field="Name"></li>
    </ul>`, { Places: PLACES });
  await ready(page, '#l');
  await page.waitForFunction(() => window.cell2site.maps.m);
  await page.click('#l li:first-child');
  await page.waitForSelector('.leaflet-popup .pop', { timeout: 5000 });
  assert.equal(await page.textContent('.leaflet-popup .pop'), 'Cafe');
});

test('embed: cards guess title, link, image and text; extra columns become meta lines', async () => {
  const sheet = csv([['Title', 'Description', 'Image', 'Website', 'City'],
    ['Alpha', 'First', 'https://img.example/a.jpg', 'https://a.example', 'Oslo'],
    ['Beta', '', '', '', '']]);
  const { page } = await h.open(`<div id="e" data-cell2-embed="cards" data-cell2-id="SHEET"></div>`, { Sheet1: sheet });
  await page.waitForSelector('#e .c2-item');
  assert.deepEqual(await texts(page, '.c2-title'), ['Alpha', 'Beta']);
  assert.equal(await page.getAttribute('.c2-title >> nth=0', 'href'), 'https://a.example');
  assert.equal(await page.getAttribute('.c2-title >> nth=1', 'href'), null);
  assert.equal(await page.textContent('.c2-meta'), 'CityOslo');
  assert.equal(await page.$$eval('.c2-img', (e) => e.length), 1);
  assert.equal(await page.$('.c2-search'), null, 'no search for a short list');
});

test('embed: table shows every column, adds search past 10 rows', async () => {
  const rows = [['Name', 'Score']].concat(Array.from({ length: 12 }, (_, i) => ['P' + i, String(i)]));
  const { page } = await h.open(`<div id="e" data-cell2-embed="table" data-cell2-id="SHEET"
      data-cell2-sort-col="Score" data-cell2-sort-type="number" data-cell2-sort-dir="desc"></div>`, { Sheet1: csv(rows) });
  await page.waitForSelector('#e tbody tr');
  assert.deepEqual(await texts(page, 'th'), ['Name', 'Score']);
  assert.equal((await texts(page, 'tbody td'))[0], 'P11');
  await page.fill('.c2-search', 'P1');
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 3);
});

test('embed: map finds coordinate columns and plots rows', async () => {
  const { page } = await h.open(`<div id="e" data-cell2-embed="map" data-cell2-id="SHEET" data-cell2-sheet="Places"></div>`,
    { Places: PLACES });
  await page.waitForSelector('#e .leaflet-container');
  await page.waitForFunction(() => document.querySelectorAll('#e .cell2site-map-marker, #e .marker-cluster').length > 0);
});

test('init: one request per tab however many elements use it; calling init again adds nothing', async () => {
  const { page, requests } = await h.open(`
    <ul id="a" data-cell2-list data-cell2-id="SHEET" data-cell2-sheet="People"><li data-cell2-item data-cell2-field="Name"></li></ul>
    <ul id="b" data-cell2-list data-cell2-id="SHEET" data-cell2-sheet="People"><li data-cell2-item data-cell2-field="Name"></li></ul>`,
    { People: PEOPLE });
  await ready(page, '#a');
  await ready(page, '#b');
  await page.evaluate(() => window.cell2site.init());
  await page.waitForTimeout(200);
  assert.equal(requests.length, 1);
  assert.equal(await page.$$eval('#a li', (e) => e.length), 3);
});

test('map: data-cell2-sheet wins over _config; config still colours markers; view frames the markers', async () => {
  const config = csv([['Tab', 'Color', 'Icon'], ['Parks', '#16a34a', 'P'], ['Libraries', '#2563eb', 'L']]);
  const parks = csv([['Name', 'Latitude', 'Longitude'], ['North', '60', '10'], ['South', '58', '12']]);
  const libraries = csv([['Name', 'Latitude', 'Longitude'], ['Far', '-40', '170']]);
  const { page } = await h.open(`
    <div id="m" data-cell2-map-wrapper data-cell2-id="SHEET" data-cell2-sheet="Parks">
      <span data-cell2-count></span>
      <div data-cell2-map data-cell2-map-cluster-radius="1" style="height:300px;width:400px"></div>
    </div>`, { _config: config, Parks: parks, Libraries: libraries });
  await page.waitForFunction(() => document.querySelector('[data-cell2-count]').textContent === '2');
  assert.deepEqual(await page.$$eval('.cell2site-map-marker div', (els) => els.map((e) => e.textContent)), ['P', 'P']);
  await page.waitForTimeout(300);   // marker positions settle a frame after layout
  // Both markers inside the map's box means the initial view was fitted to them, not left at world zoom.
  const inside = await page.$$eval('.cell2site-map-marker', (els) => {
    const box = document.querySelector('[data-cell2-map]').getBoundingClientRect();
    return els.every((e) => { const r = e.getBoundingClientRect(); return r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom; });
  });
  assert.ok(inside, 'markers outside the initial view');
});

test('map: carto tile names fall back to keyless tiles', async () => {
  const { page } = await h.open(`
    <div data-cell2-map-wrapper data-cell2-id="SHEET" data-cell2-sheet="Places">
      <div data-cell2-map data-cell2-map-tiles="carto-light" style="height:200px"></div>
    </div>`, { Places: PLACES });
  const tile = await page.waitForSelector('img.leaflet-tile', { state: 'attached' });
  const src = await tile.getAttribute('src');
  assert.match(src, /arcgisonline\.com\/.*World_Light_Gray_Base/);
  assert.doesNotMatch(src, /cartocdn/);
});

test('map: popups keep a readable width and stay inside the map, phone or desktop', async () => {
  const sheet = csv([['Name', 'Description', 'Latitude', 'Longitude'],
    ['Oodi', 'Helsinki\'s central library: books, 3D printers and recording studios.', '60.17', '24.94']]);
  for (const width of [340, 900]) {
    const { page } = await h.open(`<div style="width:${width}px" data-cell2-embed="map" data-cell2-id="SHEET"></div>`, { Sheet1: sheet });
    await page.waitForSelector('.cell2site-map-marker');
    await page.click('.cell2site-map-marker');
    const content = await page.waitForSelector('.leaflet-popup-content');
    await page.waitForTimeout(300);   // the popup auto-pans into view
    const [popup, map] = await page.evaluate(() => [
      document.querySelector('.leaflet-popup-content-wrapper').getBoundingClientRect().toJSON(),
      document.querySelector('[data-cell2-map]').getBoundingClientRect().toJSON()]);
    assert.ok(popup.width >= Math.min(240, width - 90), `popup ${popup.width}px wide in a ${width}px map`);
    assert.ok(popup.left >= map.left && popup.right <= map.right, `popup overflows a ${width}px map`);
    assert.ok(await content.isVisible());
  }
});
