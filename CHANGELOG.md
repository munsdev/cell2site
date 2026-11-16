# Changelog

Semantic versioning. Tags: `1.2.0` (no `v`), `v1.2.1`, then `v1.3.0` onward.

## v1.3.2

### Fixed
- Map popups for places with a short name shrank to a narrow column of text. Popups now keep a minimum width relative to the map's own width (240px on wide maps, less on a phone) and never overflow the frame.

## v1.3.1

### Fixed
- `carto-light` and `carto-dark` tiles: CARTO now requires an API key and drew "API KEY REQUIRED" over every map. They now map to the new keyless `light` and `dark` styles (Esri Canvas).
- `data-cell2-sheet` on a map (and so on a map embed) was ignored whenever the sheet had a `_config` tab, which plotted every tab. Named tabs now win; the config still colours the markers.
- A map without `data-cell2-map-center` opened at world zoom; it now frames its markers.

## v1.3.0

### Added
- **Embeds:** `data-cell2-embed="list|cards|table|map"` builds a widget from the sheet alone. Columns are guessed by header name (title/name, description/summary, image/photo, url/link, latitude/lat, longitude/lng); `data-cell2-col-<role>` overrides a guess; other columns show as labelled lines. Search appears above 10 rows (`data-cell2-embed-search="true|false"` forces it). Sort, item-limit and map-ref attributes pass through. Themed with `--c2-gap`, `--c2-radius`, `--c2-accent`, `--c2-line`, `--c2-soft`, `--c2-map-height`; inherits the host font and colour.
- `data-cell2-id` accepts a bare ID or any pasted Sheets URL, including `#gid=` (tab chosen by gid) and "Publish to web" `/d/e/…` links.
- **List search, filter and reset:** `data-cell2-search`, `-search-cols`, `-search-btn`, `-filter`, `-filter-multi`, `-filter-logic`, `-reset`: the map's vocabulary without the `map-` infix.
- `data-cell2-wrapper` (count, empty, error, search and filters may sit outside the list element) and `data-cell2-hide-if`.
- `cell2:ready` CustomEvent from each list, tabs and map.
- `window.cell2site = { version, init(root), clearCache(), maps }`. `init()` can be called again after injecting markup. `window.__cell2siteMaps` remains as an alias.
- [cell2site.com](https://cell2site.com) now lives in this repo (`site/`), deployed with `wrangler deploy`; examples run against a public demo sheet.
- Browser-only [viewer](site/view/index.html) with share link, embed code and iframe code; [examples](site/examples/).

### Changed
- Cell HTML is sanitised and `[label](https://…)` and bare URLs are auto-linked.
- Sheets need only be shared as "Anyone with the link, Viewer". The v1.2 README wrongly said "Publish to web".
- Popups are built when first opened.
- Keyboard support (Enter/Space) for tabs and accordions, with `aria-expanded`.
- Documentation rewritten; the CDN URL pins `v1.3.0` (the old README pinned `@v1.2.0`, which was never tagged) and the domain is cell2site.com.

### Fixed
- Map markers were keyed by Name, so duplicate and blank names collided.
- An accordion could spring back open after a quick close.
- Double initialisation on Webflow pages.
- A private sheet now gives a readable error pointing to the sharing setting.
- Comma-decimal coordinates (`48,137`) are accepted.
- Concurrent fetches of the same tab are de-duplicated.

### Security
- Cell content can no longer run script: scripts, event handlers and `javascript:` (or any non-http/https/mailto/tel) URLs are stripped from cell HTML, `field-attr` URLs and marker icons.

## v1.2.1 and 1.2.0

`cell2-cms.js` and `cell2-map.js` merged into one file, `cell2site.js`, with the tab-field attributes (`data-cell2-tab-field`, `-tab-field-html`, `-tab-field-attr`) from cell2 v1.0.3. See the [cell2 changelog](https://github.com/munsdev/cell2/blob/main/CHANGELOG.md).

## Before 1.2

Cell2 v1.0.0 to v1.0.3 (separate CMS and map scripts) are in the [cell2 history](https://github.com/munsdev/cell2/blob/main/CHANGELOG.md). That repo is archived.
