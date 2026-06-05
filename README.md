# cell2site

**Turn a Google Sheet into live website content — no build step, no API keys, one script tag.**

cell2site reads rows from a published Google Sheet and renders them into your HTML as CMS lists, Webflow-style tabs, or an interactive Leaflet map. Markdown links, bare URLs, and raw HTML in cells are all rendered automatically.

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.2.0/cell2site.js"></script>
```

---

## Contents

- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [CMS — Lists](#cms--lists)
- [CMS — Tabs](#cms--tabs)
- [Map](#map)
- [Config sheet](#config-sheet-optional)
- [Link rendering](#link-rendering)
- [Full attribute reference](#full-attribute-reference)
- [Notes](#notes)

---

## How it works

1. Publish your Google Sheet to the web as CSV (File → Share → Publish to web → Entire document → CSV)
2. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/`**`SHEET_ID`**`/edit`
3. Add `data-cell2-*` attributes to your HTML — cell2site does the rest

No server, no API keys, no build pipeline.

---

## Quick start

### Publish your sheet

File → Share → Publish to web → Entire document → CSV → Publish

### Add the script

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.2.0/cell2site.js"></script>
```

Place it before `</body>`.

---

## CMS — Lists

Render rows from a sheet tab as a repeating list of HTML elements.

### Markup

```html
<div data-cell2-list data-cell2-id="SHEET_ID" data-cell2-sheet="Projects">

  <!-- Loading skeleton appears here automatically -->

  <!-- Template — cloned once per row, then removed -->
  <div data-cell2-item>
    <h3 data-cell2-field="Title"></h3>
    <p  data-cell2-field="Description"></p>
    <a  data-cell2-field-attr="href:URL">Visit</a>
  </div>

  <!-- Optional state elements -->
  <p data-cell2-empty>No results found.</p>
  <p data-cell2-error>
    Failed to load — <span data-cell2-field="message"></span>
  </p>
  <span data-cell2-count></span> results

</div>
```

### List wrapper attributes

| Attribute | Description |
|---|---|
| `data-cell2-list` | Required. Marks this element as a list. |
| `data-cell2-id` | Required. Google Sheet ID. |
| `data-cell2-sheet` | Tab name (default: `Sheet1`). |
| `data-cell2-sort-col` | Column name to sort by. |
| `data-cell2-sort-dir` | `asc` or `desc` (default: `asc`). |
| `data-cell2-sort-type` | `text`, `number`, or `date` (default: `text`). |
| `data-cell2-item-limit` | Show only the first N records after sorting. |
| `data-cell2-map-ref` | ID of a map wrapper to link item clicks to. |
| `data-cell2-cache-ttl` | Cache duration in seconds (default: `60`). |

### Item template attributes

Place these on elements inside `[data-cell2-item]`:

| Attribute | Description |
|---|---|
| `data-cell2-field="Column"` | Sets `textContent`. Auto-renders links (see [Link rendering](#link-rendering)). |
| `data-cell2-field-html="Column"` | Sets `innerHTML`. Use for cells containing HTML markup. |
| `data-cell2-field-attr="attr:Column"` | Sets an attribute. E.g. `href:URL`, `src:Image`. |
| `data-cell2-field-wrapper` | Wraps a field — the whole wrapper is removed if the field is blank. |
| `data-cell2-show-if="Column"` | Removes the element if the column value is falsy (`false`, `0`, blank, `no`). |
| `data-cell2-var="name:Column; ..."` | Sets a CSS custom property (`--name`) from the column value. |
| `data-cell2-map-trigger` | Scoped click target for map linking (falls back to the whole item). |

### Skeleton loader

A shimmer skeleton appears automatically while data loads. To use your own loader:

```html
<div data-cell2-loading style="display:none">Loading…</div>
```

Control skeleton row count with `data-cell2-loading-count="4"` on the list wrapper.

---

## CMS — Tabs

Render multiple sheet tabs as a tab interface, including aggregate tabs that merge and deduplicate rows from multiple tabs.

### Markup

```html
<div data-cell2-tabs data-cell2-id="SHEET_ID">

  <!-- Tab nav — cloned once per tab -->
  <div class="w-tab-menu">
    <a data-cell2-tab-link>
      <span data-cell2-meta="tab-title"></span>
      (<span data-cell2-tab-count></span>)
    </a>
  </div>

  <!-- Tab content — cloned once per tab -->
  <div class="w-tab-content">
    <div data-cell2-tab-content>
      <div data-cell2-list>
        <div data-cell2-item>
          <h3 data-cell2-field="Title"></h3>
        </div>
      </div>
    </div>
  </div>

</div>
```

Tabs require a [config sheet](#config-sheet-optional) to define which tabs appear and in what order. Without one, use `data-cell2-sheets="Tab A, Tab B"` on the wrapper as a fallback.

### Tabs wrapper attributes

| Attribute | Description |
|---|---|
| `data-cell2-tabs` | Required. Marks this element as a tabs wrapper. |
| `data-cell2-id` | Required. Google Sheet ID. |
| `data-cell2-config` | Config tab name (default: `_config`). |
| `data-cell2-sheets` | Fallback comma-separated tab list (ignored if config sheet exists). |
| `data-cell2-cache-ttl` | Cache duration in seconds (default: `60`). |
| `data-cell2-accordion-trigger` | Accordion trigger selector (default: `.accordion2_top`). |
| `data-cell2-accordion-panel` | Accordion panel selector (default: `.accordion2_bottom`). |
| `data-cell2-accordion-icon` | Accordion icon selector (default: `.accordion2_icon`). |

### Meta elements

| Attribute | Description |
|---|---|
| `data-cell2-meta="tab-title"` | Active tab label. |
| `data-cell2-meta="tab-label"` | Source tab label (differs in aggregate tabs). |
| `data-cell2-meta="tab-description"` | Tab description from the config sheet. |
| `data-cell2-tab-count` | Record count for that tab. |

---

## Map

Render rows as markers on an interactive Leaflet map. Latitude and longitude columns are required. All other map features (popups, clustering, filtering, search) are optional.

### Markup

```html
<div data-cell2-map-wrapper
     data-cell2-id="SHEET_ID"
     data-cell2-sheet="Locations"
     data-cell2-map-id="my-map">

  <!-- The map renders here — must have a CSS height -->
  <div data-cell2-map style="height: 480px"
       data-cell2-map-tiles="carto-light"
       data-cell2-map-center="48.1,11.6"
       data-cell2-map-zoom="5">
  </div>

  <!-- Popup card template — hidden, cloned per popup -->
  <div data-cell2-map-card style="display:none">
    <strong data-cell2-field="Name"></strong>
    <p data-cell2-field="Description"></p>
    <a data-cell2-field-attr="href:URL" target="_blank">More info</a>
  </div>

  <!-- Filters -->
  <input data-cell2-map-search placeholder="Search…">
  <select data-cell2-map-filter="Category">
    <option value="">All categories</option>
  </select>
  <button data-cell2-map-reset>Reset</button>
  <button data-cell2-map-locate>Near me</button>

  <!-- State -->
  <span data-cell2-count></span> markers
  <p data-cell2-empty>No results.</p>

</div>
```

### Map wrapper attributes

| Attribute | Description |
|---|---|
| `data-cell2-map-wrapper` | Required. |
| `data-cell2-id` | Required. Google Sheet ID. |
| `data-cell2-sheet` | Tab name or comma-separated list (default: `Sheet1`). |
| `data-cell2-map-id` | ID used for list→map linking. |
| `data-cell2-config` | Config tab name (default: `_config`). |
| `data-cell2-col-lat` | Latitude column name (default: `Latitude`). |
| `data-cell2-col-lng` | Longitude column name (default: `Longitude`). |
| `data-cell2-col-name` | Name column — used for list linking (default: `Name`). |
| `data-cell2-map-filter-logic` | `and` or `or` across filter dropdowns (default: `and`). |
| `data-cell2-cache-ttl` | Cache duration in seconds (default: `60`). |

### Map element attributes (`data-cell2-map`)

| Attribute | Description |
|---|---|
| `data-cell2-map-zoom` | Initial zoom level (default: `3` desktop / `2` mobile). |
| `data-cell2-map-center` | Initial center as `"lat,lng"` (default: `"20,0"`). |
| `data-cell2-map-tiles` | Tile style (see below). |
| `data-cell2-map-cluster-radius` | Cluster radius in px (default: `80`). |
| `data-cell2-map-refit` | Refit bounds after filtering (default: `true`). |

### Tile styles

| Value | Map |
|---|---|
| `osm` | OpenStreetMap (default) |
| `carto-light` | Carto Positron — light/minimal |
| `carto-dark` | Carto Dark Matter |
| `esri-street` | Esri World Street Map |
| `esri-topo` | Esri World Topographic |

### Filter controls

| Attribute | Description |
|---|---|
| `data-cell2-map-search` | Text search input (debounced 250ms). |
| `data-cell2-map-search-cols="A, B"` | Limit search to specific columns. |
| `data-cell2-map-search-btn` | Triggers search immediately on click. |
| `data-cell2-map-filter="Column"` | Dropdown, auto-populated from unique values. |
| `data-cell2-map-filter-tabs` | Dropdown populated from config tab labels. |
| `data-cell2-map-filter-multi` | Makes the dropdown a multi-select. |
| `data-cell2-map-reset` | Clears all filters and resets the view. |
| `data-cell2-map-locate` | Geolocates the user and flies to their position. |

### Marker colors and icons

Set `Color` (hex) and `Icon` (emoji) columns in your sheet, or define them per tab in the [config sheet](#config-sheet-optional). Resolution order — first hit wins:

1. `Color` / `Icon` column in the row itself  
2. Source tab's config row  
3. Default (`#6b7280` / 📍)

### List → map linking

Click an item in a CMS list to fly the map to that marker and open its popup.

```html
<!-- On the map wrapper -->
<div data-cell2-map-wrapper data-cell2-map-id="my-map" …>

<!-- On the list -->
<div data-cell2-list data-cell2-map-ref="my-map" …>
```

---

## Config sheet (optional)

Add a tab named `_config` to your sheet (or specify another name with `data-cell2-config`). One row per tab, controlling display order, labels, sorting, colors, and CSS variables.

| Column | Description |
|---|---|
| `Tab` | Sheet tab name. Comma-separated = aggregate tab. `*` = global CSS vars row. |
| `Label` | Display name shown in tab links and meta elements. |
| `Description` | Exposed via `data-cell2-meta="tab-description"`. |
| `Color` | Hex color for map markers from this tab. |
| `Icon` | Emoji or text for map markers from this tab. |
| `Sort By` | Column name to sort this tab's list by. |
| `Sort Dir` | `asc` or `desc`. |
| `Sort Type` | `text`, `number`, or `date`. |
| `Active` | `TRUE` / `✓` / `yes` / `1` — marks the default-open tab. |
| Any other column | Available as a CSS variable source via `data-cell2-var`. |

### Aggregate tabs

List multiple tab names in the `Tab` column, comma-separated, to merge their rows into one tab. Duplicates are removed based on the visible fields in the item template.

```
Tab: North America, South America, Europe
Label: All Regions
```

### CSS variables

```html
<div data-cell2-var="marker-color:Color; region-icon:Icon"></div>
```

Sets `--marker-color` and `--region-icon` from the row or config. Resolution order:

1. Item record column  
2. Aggregate config row  
3. Individual tab config row  
4. Global `*` row

---

## Link rendering

`data-cell2-field` detects and renders links automatically — no attribute changes needed.

| Cell content | Result |
|---|---|
| Plain text | Rendered as text, unchanged |
| `https://example.com` anywhere in the text | Auto-linked, opens in new tab |
| `<a href="…">text</a>` or any HTML | Rendered as `innerHTML` |

For full HTML control without auto-detection, use `data-cell2-field-html` explicitly.

> **Google Sheets note:** Native hyperlinks (Insert → Link) are stripped during CSV export — only the display text survives. To pass a URL through, either store it in a separate column and use `data-cell2-field-attr="href:URL"`, or type the full HTML directly in the cell: `<a href="https://…">text</a>`.

---

## Full attribute reference

### Shared (CMS + Map)

| Attribute | Used on | Description |
|---|---|---|
| `data-cell2-id` | Wrapper | Google Sheet ID |
| `data-cell2-config` | Wrapper | Config tab name (default: `_config`) |
| `data-cell2-cache-ttl` | Wrapper | Cache in seconds (default: `60`) |
| `data-cell2-field="Column"` | Any | Text / auto-linked / HTML output |
| `data-cell2-field-html="Column"` | Any | Raw HTML output |
| `data-cell2-field-attr="attr:Col"` | Any | Attribute output |
| `data-cell2-field-wrapper` | Any | Ancestor removed if child field is blank |
| `data-cell2-show-if="Column"` | Any | Removed if value is falsy |
| `data-cell2-var="name:Col; …"` | Any | CSS custom property |
| `data-cell2-count` | Any | Populated with visible record count |
| `data-cell2-empty` | Any | Shown when zero records |
| `data-cell2-error` | Any | Shown on fetch failure |

### CMS only

| Attribute | Description |
|---|---|
| `data-cell2-tabs` | Tabs wrapper |
| `data-cell2-list` | List wrapper |
| `data-cell2-item` | Item template (cloned per row) |
| `data-cell2-tab-link` | Tab link template |
| `data-cell2-tab-content` | Tab pane template |
| `data-cell2-tab-count` | Record count for that tab |
| `data-cell2-meta="…"` | `tab-title`, `tab-label`, `tab-description` |
| `data-cell2-sheets` | Fallback tab list (no config sheet) |
| `data-cell2-sheet` | Tab name (standalone list) |
| `data-cell2-sort-col` | Sort column |
| `data-cell2-sort-dir` | `asc` / `desc` |
| `data-cell2-sort-type` | `text` / `number` / `date` |
| `data-cell2-item-limit` | Max records to show |
| `data-cell2-map-ref` | Map ID to link to |
| `data-cell2-map-trigger` | Scoped click target for map linking |
| `data-cell2-loading` | Custom loader element |
| `data-cell2-loading-count` | Skeleton row count (default: `6`) |
| `data-cell2-accordion-trigger` | Accordion trigger selector |
| `data-cell2-accordion-panel` | Accordion panel selector |
| `data-cell2-accordion-icon` | Accordion icon selector |

### Map only

| Attribute | Description |
|---|---|
| `data-cell2-map-wrapper` | Map wrapper |
| `data-cell2-map` | Map render target (needs a CSS height) |
| `data-cell2-map-id` | ID for list→map linking |
| `data-cell2-map-card` | Popup card template |
| `data-cell2-col-lat` | Latitude column (default: `Latitude`) |
| `data-cell2-col-lng` | Longitude column (default: `Longitude`) |
| `data-cell2-col-name` | Name column (default: `Name`) |
| `data-cell2-map-tiles` | Tile style |
| `data-cell2-map-zoom` | Initial zoom |
| `data-cell2-map-center` | Initial center `"lat,lng"` |
| `data-cell2-map-cluster-radius` | Cluster radius px (default: `80`) |
| `data-cell2-map-refit` | Refit on filter (default: `true`) |
| `data-cell2-map-search` | Search input |
| `data-cell2-map-search-cols` | Columns to search |
| `data-cell2-map-search-btn` | Immediate search trigger |
| `data-cell2-map-filter="Column"` | Filter dropdown |
| `data-cell2-map-filter-tabs` | Filter dropdown from tab labels |
| `data-cell2-map-filter-multi` | Multi-select filter |
| `data-cell2-map-filter-logic` | `and` / `or` across dropdowns (default: `and`) |
| `data-cell2-map-reset` | Reset button |
| `data-cell2-map-locate` | Geolocate button |
| `data-cell2-meta="tab-label"` | Source tab label (popup card) |
| `data-cell2-meta="tab-name"` | Source tab name (popup card) |

---

## Notes

- Sheet must be **published to the web as CSV** (File → Share → Publish to web)
- Column names are **case-sensitive** and must match the header row exactly
- All-blank rows are skipped automatically
- Lat/lng values must be decimals — rows with invalid coordinates are skipped by the map
- Multiple map wrappers per page are supported
- Append `?clearcache` to any URL to wipe in-memory and localStorage cache
- Cache is two-layered: in-memory (default 60s) + localStorage (default 1h)
- Leaflet and MarkerCluster are loaded automatically from cdnjs — no separate script tags needed
- Works with Webflow, plain HTML, or any no-code platform that allows custom code

---

## License

[MIT](LICENSE) © 2025–2026 [muns.dev](https://muns.dev)
