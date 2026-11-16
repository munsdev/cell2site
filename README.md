# cell2site

**Turn a Google Sheet into lists, tabs, maps and drop-in embeds on any web page. One script tag, no server, no API key, no build step.**

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.3.0/cell2site.js"></script>
```

[cell2site.com](https://cell2site.com) · [Viewer](https://cell2site.com/view) · [Examples](examples/) · [Changelog](CHANGELOG.md)

## Quick start

1. **Share the sheet.** Google Sheets, Share, General access: **Anyone with the link**, role **Viewer**.
2. **Add the script** (above) once, before `</body>`.
3. **Add an embed** where the content should appear. Paste the sheet's address-bar URL, or just its ID:

```html
<div data-cell2-embed="cards" data-cell2-id="https://docs.google.com/spreadsheets/d/…/edit"></div>
```

Columns named like `Title`, `Description`, `Image`, `URL` are picked up automatically. Try it without writing code in the [viewer](https://cell2site.com/view).

## Choose your setup

| Setup | Use it when | You write |
|---|---|---|
| **Embed** (`data-cell2-embed`) | You want a good-looking result fast and don't need custom design. | One `<div>` |
| **Custom markup** (`data-cell2-list`, `-tabs`, `-map-wrapper`) | You design the layout yourself, e.g. in Webflow. | Your HTML plus attributes |
| **Viewer link** | You just need to share a sheet as a page. | Nothing; copy the link |
| **iframe** | The platform forbids scripts. | One `<iframe>` from the viewer |

## Platforms

**Plain HTML.** Put the script tag before `</body>` and the markup anywhere. See [examples/](examples/).

**Webflow.** Script in Site settings, Custom code, Footer; attributes via Element settings, Custom attributes. Step by step in [examples/webflow.md](examples/webflow.md).

**WordPress.** Add a **Custom HTML** block containing the embed div and the script tag. Needs a role allowed to post unfiltered HTML (Administrator on single sites).

**Squarespace, Wix, Framer, Carrd.** Use the platform's code block or HTML embed element (Squarespace: Code Block, Wix: Embed Code, Framer: Embed, Carrd: Embed widget; some need a paid plan). Paste the same two lines:

```html
<div data-cell2-embed="list" data-cell2-id="YOUR_SHEET_URL"></div>
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.3.0/cell2site.js"></script>
```

**No scripts allowed.** Open the [viewer](https://cell2site.com/view), configure the sheet, click **Copy iframe code**, and paste it into any embed or HTML field. The iframe loads the viewer with `&embed=1`, which hides its form and shows only the widget.

## Embeds

```html
<div data-cell2-embed="cards" data-cell2-id="YOUR_SHEET_URL" data-cell2-sheet="Events"></div>
```

`data-cell2-embed` is `list`, `cards`, `table` or `map`. The first row of the tab is the header.

**Columns are guessed by header name** (case-insensitive):

| Role | Matches |
|---|---|
| title | `title`, `name`, `question`, `headline` (else the first unclaimed column) |
| text | `description`, `summary`, `answer`, `details`, `text`, `notes`, `about`, `bio` |
| image | `image`, `photo`, `picture`, `logo`, `thumbnail`, `img` |
| link | `url`, `link`, `website`, `web` (the title links here) |
| lat / lng | `latitude`, `lat` / `longitude`, `lng`, `lon`, `long` |

Override a guess with `data-cell2-col-title`, `-col-text`, `-col-image`, `-col-link`, `-col-lat`, `-col-lng` (value: the column's exact header). Every other column appears as a labelled line (a table shows all columns). `Color` and `Icon` columns are reserved for map markers.

**Search** appears above 10 rows. Force it with `data-cell2-embed-search="true"` or `"false"`. Map embeds have none; use custom markup for a searchable map.

**Passed through to the list:** `data-cell2-sort-col`, `-sort-dir`, `-sort-type`, `-item-limit`, `-map-ref`. A map embed also takes `data-cell2-map-id`, `-col-name`, `-map-tiles`, `-map-center`, `-map-zoom`, `-map-cluster-radius` and `-map-refit`.

**Theming** with CSS variables on the embed or any ancestor:

```css
[data-cell2-embed] { --c2-accent: #e11d48; --c2-radius: 4px; --c2-gap: 24px; --c2-map-height: 420px; }
```

`--c2-line` (borders) and `--c2-soft` (table header tint) default to mixes of the text colour. Embeds inherit the host font and colour, so they work on dark backgrounds.

## Lists

```html
<div data-cell2-list data-cell2-id="YOUR_SHEET_URL" data-cell2-sheet="Projects">
  <div data-cell2-item>                       <!-- template, cloned per row -->
    <h3 data-cell2-field="Title"></h3>
    <a data-cell2-field-attr="href:URL">Visit</a>
  </div>
  <p data-cell2-empty style="display:none">No results.</p>
  <p data-cell2-error style="display:none"><span data-cell2-field="message"></span></p>
</div>
```

- Tab: `data-cell2-sheet` (default `Sheet1`), or the tab from a pasted `#gid=` URL.
- Sort: `data-cell2-sort-col`, `-sort-dir` (`asc`/`desc`), `-sort-type` (`text`/`number`/`date`). Blank values sort last.
- `data-cell2-item-limit="N"` shows the first N rows, after search and filters.
- Loading: shimmer rows by default (`data-cell2-loading-count`, default 6), or your own element with `data-cell2-loading`.
- `data-cell2-count` shows the visible row count; `data-cell2-empty` and `data-cell2-error` show on zero rows and on failure.
- `data-cell2-wrapper` on an ancestor lets count, empty, error, search and filters sit outside the list element (needed when the list is a grid).
- Clicking an item can fly a map to its marker: [List and map](#list-and-map).

## Search and filters

On a list, inside the list or its `data-cell2-wrapper`:

```html
<input data-cell2-search data-cell2-search-cols="Title, Notes" placeholder="Search…">
<button data-cell2-search-btn>Go</button>        <!-- optional: search at once -->
<select data-cell2-filter="Category"><option value="">All</option></select>
<button data-cell2-reset>Reset</button>
```

- Search is debounced 250 ms and matches any column unless `-search-cols` limits it.
- A filter select is filled with the column's unique values. The first `<option>` is yours (the "All" choice). Add `data-cell2-filter-multi` for multi-select; values within one select are OR-ed.
- In a list inside tabs, `data-cell2-filter-tabs` fills a select with the source tabs, which is useful on a merged tab.
- Several selects combine with AND; `data-cell2-filter-logic="or"` on the wrapper switches to OR.
- The map uses the same names with a `map-` infix: `data-cell2-map-search`, `-map-filter`, and so on.

## Tabs and the config sheet

```html
<div data-cell2-tabs data-cell2-id="YOUR_SHEET_URL">
  <div><a data-cell2-tab-link><span data-cell2-meta="tab-title"></span> (<span data-cell2-tab-count></span>)</a></div>
  <div data-cell2-tab-content>
    <div data-cell2-list><div data-cell2-item><h3 data-cell2-field="Title"></h3></div></div>
  </div>
</div>
```

One link and one pane are cloned per tab. Classes follow Webflow's Tabs (`w--current`, `w--tab-active`). Tabs are keyboard operable and set `aria-selected`.

Tabs come from an optional **`_config`** tab, one row per tab (`data-cell2-config` renames it). Without it, name them with `data-cell2-sheets="Tab A, Tab B"`.

| `_config` column | Meaning |
|---|---|
| `Tab` | Sheet tab name. Comma-separated names merge tabs into one (duplicates removed by the columns the template shows). `*` is a row of global values. |
| `Label` | Text for `data-cell2-meta="tab-title"` / `"tab-label"`. |
| `Description` | `data-cell2-meta="tab-description"`. |
| `Color`, `Icon` | Map marker colour (CSS colour) and icon (emoji or short HTML) for the tab's rows. |
| `Sort By`, `Sort Dir`, `Sort Type` | Per-tab sorting (override the list's attributes). |
| `Active` | `TRUE`, `yes`, `1`, `x` or a tick on the tab to open first. |
| any other column | Available to `data-cell2-tab-field="Column"` on a link or pane, and to `data-cell2-var`. |

`data-cell2-tab-field`, `-tab-field-html` and `-tab-field-attr="attr:Column"` work like their `field` cousins but read the tab's `_config` row (a per-tab image or tagline).

`data-cell2-var="name:Column; other:Column"` sets CSS variables `--name` from the first source holding the column: the row, the tab's config row, then the `*` row.

**Accordions.** An item that contains a trigger and a panel opens and closes (keyboard operable, `aria-expanded`). Defaults are Relume's classes `.accordion2_top`, `.accordion2_bottom`, `.accordion2_icon`; override with `data-cell2-accordion-trigger`, `-panel`, `-icon` on the list or tabs wrapper.

## Map

```html
<div data-cell2-map-wrapper data-cell2-id="YOUR_SHEET_URL" data-cell2-sheet="Locations">
  <input data-cell2-map-search placeholder="Search…">
  <select data-cell2-map-filter="Category"><option value="">All</option></select>
  <button data-cell2-map-locate>Near me</button>
  <button data-cell2-map-reset>Reset</button>
  <div data-cell2-map style="height:480px" data-cell2-map-tiles="carto-light"></div>
  <div data-cell2-map-card style="display:none">   <!-- popup template -->
    <strong data-cell2-field="Name"></strong>
  </div>
</div>
```

- Needs `Latitude` and `Longitude` columns (`data-cell2-col-lat`, `-col-lng` rename them). Comma decimals (`48,137`) are accepted; rows without valid coordinates are skipped.
- `data-cell2-sheet` may list several tabs. With a `_config` tab, the map shows every tab it lists and `data-cell2-map-filter-tabs` builds a tab dropdown.
- Marker colour and icon: the row's `Color` / `Icon`, then its tab's config row, then grey and a pin.
- Popups are built on first open. Without a card, the popup shows the `Name` column.
- Tiles: `osm` (default), `carto-light`, `carto-dark`, `esri-street`, `esri-topo`. Leaflet and MarkerCluster load from cdnjs only on pages with a map.
- The map element needs a CSS height. Filtering refits the view unless `data-cell2-map-refit="false"`; Reset returns to the starting view.

### List and map

```html
<div data-cell2-list data-cell2-map-ref="places" …>…</div>
<div data-cell2-map-wrapper data-cell2-map-id="places" …>…</div>
```

Clicking a list item flies to the marker with the same `Name` and opens its popup. Put `data-cell2-map-trigger` on a child to make only that child clickable. Names must be unique to link reliably. See [examples/list-and-map.html](examples/list-and-map.html).

## Fields and safe HTML

| Attribute | Effect |
|---|---|
| `data-cell2-field="Col"` | Text. `[label](https://…)` and bare URLs become links. A cell containing HTML renders as HTML. |
| `data-cell2-field-html="Col"` | Always rendered as HTML. |
| `data-cell2-field-attr="attr:Col"` | Sets an attribute (`href:URL`, `src:Image`). |
| `data-cell2-field-wrapper` | On an ancestor: removed when a field inside is blank. |
| `data-cell2-show-if="Col"` / `-hide-if="Col"` | Element removed unless / if the cell is truthy (`true`, `yes`, `1`, `x`, tick). |

Cell HTML is sanitised: `script`, `style`, `link`, `meta`, `base`, `object`, `embed`, `form`, `svg`, `math` and `template` tags are removed, as are `on*` handlers and any URL attribute that is not `http`, `https`, `mailto` or `tel`. Cells can be fed by a form or a stranger, so treat them as untrusted anyway.

Google's CSV export drops native hyperlinks (Insert, Link); only the visible text survives. Put the URL in its own column, or write `[label](https://…)` in the cell.

## Events and JS API

`cell2:ready` bubbles from each list, tabs wrapper and map once rendered.

```js
document.addEventListener('cell2:ready', (e) => console.log(e.target, e.detail));
// list: { records }   tabs: { tabs }   map: { records, map }  (map is the Leaflet instance)
```

```js
cell2site.version;            // "1.3.0"
cell2site.init(element);      // render markup you injected later; mounted elements are skipped
cell2site.clearCache();       // wipe memory and localStorage caches
cell2site.maps;               // { [data-cell2-map-id]: { flyToName(name, zoom) } }
```

## Caching

Reads are cached in memory for 60 seconds and in `localStorage` for 60 times that (one hour), so return visits render instantly. Change the base with `data-cell2-cache-ttl="seconds"` on a wrapper. `?clearcache` on the page URL, or `cell2site.clearCache()`, wipes both. Concurrent requests for the same tab share one fetch.

## Privacy

The visitor's browser fetches the sheet directly from Google. cell2site has no server in the path, no analytics and no proxy. The only thing stored is the sheet's rows, in the visitor's `localStorage`, under keys starting `cell2site_cache_`. Anyone who can see your page can see the sheet's data, so share only what is public.

## Gotchas

- **Sharing:** "Anyone with the link, Viewer". Publish to web is not required (those links work too). A private sheet shows an error telling you to share it.
- **Column names are case-sensitive** and must match the header row. Row 1 is always the header.
- **Do not put `_config` first** in the workbook; Google can mangle the header of the first tab.
- **Unknown tab names:** Google silently returns the first tab. Check spelling.
- **Published `/d/e/…` links** can only select a tab by `#gid=`, not by name.
- **Webflow's Designer** does not run scripts; preview or publish.
- **A map needs a height**, and lat/lng must be decimals.
- Add `data-cell2-wrapper` when your list is a CSS grid so search and count are not grid cells.

## Attribute reference

All attributes are `data-cell2-…`. Details are in the sections above.

**Source and shared** (on any wrapper)

| Attribute | Value |
|---|---|
| `id` | Sheet ID or any Sheets URL, including `#gid=` and `/d/e/…` |
| `sheet` | Tab name (map: comma list) |
| `config` | Config tab name, default `_config` (tabs, map) |
| `cache-ttl` | Seconds, default 60 |
| `count`, `empty`, `error` | Row count, zero-result message, error message (`field="message"` inside) |
| `loading`, `loading-count` | Custom loader; skeleton rows (default 6) |
| `wrapper` | Scope for count, empty, error, search and filters |

**Embed:** `embed` (`list`/`cards`/`table`/`map`), `embed-search` (`true`/`false`), `col-title`, `col-text`, `col-image`, `col-link`, `col-lat`, `col-lng`, `col-name` (map), plus `sort-*`, `item-limit`, `map-ref`, `map-id`, and on a map embed `map-tiles`, `map-center`, `map-zoom`, `map-cluster-radius`, `map-refit`.

**List**

| Attribute | Value |
|---|---|
| `list`, `item` | List container; row template |
| `sort-col`, `sort-dir`, `sort-type` | Column; `asc`/`desc`; `text`/`number`/`date` |
| `item-limit` | Max rows after filtering |
| `map-ref`, `map-trigger` | Map to fly to; click target inside the item |
| `search`, `search-cols`, `search-btn` | Input; comma columns (on the input); button |
| `filter`, `filter-multi`, `filter-logic` | Select per column; multi-select; `and`/`or` |
| `reset` | Clears search and filters |
| `accordion-trigger`, `accordion-panel`, `accordion-icon` | Selectors |

**Fields** (inside a template): `field`, `field-html`, `field-attr`, `field-wrapper`, `show-if`, `hide-if`, `var`, `meta`.

**Tabs:** `tabs`, `sheets`, `tab-link`, `tab-content`, `tab-count`, `tab-field`, `tab-field-html`, `tab-field-attr`, `meta` = `tab-title` / `tab-label` / `tab-description`, and the accordion selectors.

**Map**

| Attribute | On | Value |
|---|---|---|
| `map-wrapper`, `map`, `map-card` | | Container; render target (needs height); popup template |
| `map-id` | wrapper | Name for list linking |
| `col-lat`, `col-lng`, `col-name` | wrapper | Defaults `Latitude`, `Longitude`, `Name` |
| `map-tiles` | map | See [Map](#map) |
| `map-center`, `map-zoom` | map | `"lat,lng"` (default `20,0`); zoom (3 desktop, 2 mobile) |
| `map-cluster-radius`, `map-refit` | map | Pixels (80); `false` to keep the view |
| `map-search`, `map-search-cols`, `map-search-btn` | | As list search |
| `map-filter`, `map-filter-tabs`, `map-filter-multi`, `map-filter-logic` | | As list filters; `-tabs` fills from tab labels |
| `map-reset`, `map-locate` | | Reset view and filters; fly to the visitor |
| `meta` = `tab-label` / `tab-name` | card | Source tab of the marker |

## Use cases

- A community garden listing plot availability
- A band's tour dates
- A nonprofit's volunteer opportunities map
- A restaurant's daily specials
- A school's staff directory
- A conference schedule in tabs
- A small shop's stockists map
- A job board fed by a form
- A food bank's pickup locations and hours
- A neighbourhood's little free library map
- A product changelog or release notes list
- An FAQ as accordions
- A real estate agent's open houses
- A gym's class timetable, one tab per day
- A museum's exhibitions, filtered by gallery
- A farmers market's vendors, searchable by produce
- A club's meeting minutes archive
- A makerspace's equipment list with who is certified
- A podcast episode index with show notes
- A city's public art walking map
- A team's "who is on call" table
- A local events calendar, one tab per month
- A course reading list sorted by week
- A directory of local tradespeople, filtered by service

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Ideas are in [ROADMAP.md](ROADMAP.md).

## License

[MIT](LICENSE) © 2025-2026 [muns.dev](https://muns.dev)
