# cell2site in Webflow

Everything here works in the Designer's canvas only as markup. cell2site runs on the **published or preview site**, so build first, then preview.

## 1. Share the sheet

In Google Sheets: Share, General access, **Anyone with the link**, role **Viewer**. Copy the URL from the address bar; it can be pasted as is.

## 2. Add the script once

Custom code needs a paid Site plan.

- Whole site: **Site settings, Custom code, Footer code** (before `</body>`).
- One page only: **Page settings, Custom code, Before `</body>` tag**.

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2site@v1.3.0/cell2site.js"></script>
```

Publish after saving.

## 3a. Quickest: the Embed element

Add an **Embed** element (Add panel, Advanced, Embed) where the content should appear and paste:

```html
<div data-cell2-embed="cards" data-cell2-id="https://docs.google.com/spreadsheets/d/1wlr72cfR-Z0MlFsB_MxgjGVcd2UOv6ffdFyhTLpIzlQ/edit"></div>
```

`data-cell2-embed` is `list`, `cards`, `table` or `map`. It takes the host page's font and colour; theme it with `--c2-accent`, `--c2-radius` and friends (see the README).

## 3b. Your own design: attributes in the Designer

Select an element, open **Element settings** (the gear), scroll to **Custom attributes**, and add name/value pairs. No `<script>` or markup is needed; you style the real elements.

A list:

1. Add a **Div Block** (the list). Attributes: `data-cell2-list` (empty value) and `data-cell2-id` = your sheet URL. Add `data-cell2-sheet` = the tab name if it is not the first tab.
2. Inside it, add a **Div Block** for one row. Attribute: `data-cell2-item`. Design it like any card.
3. Inside the row, add a Heading, Text Block, Image or Link and give each an attribute:
   - Heading/Text: `data-cell2-field` = `Title` (the column name, case-sensitive).
   - Image: `data-cell2-field-attr` = `src:Image`.
   - Link: `data-cell2-field-attr` = `href:URL`.
4. Optional states, anywhere inside the list or inside a parent Div with `data-cell2-wrapper`: a Text Block with `data-cell2-empty`, one with `data-cell2-error` containing a span with `data-cell2-field` = `message`, and a span with `data-cell2-count`. Hide empty and error with `display: none` in the Designer; cell2site shows them when needed.
5. Search and filter: an **Input** with `data-cell2-search` and a **Select** with `data-cell2-filter` = `Category` (keep its first option as "All"). Put them in a Div with `data-cell2-wrapper` together with the list.

Keep the item visible in the Designer so you can style it; the script removes the template and clones it per row.

## 4. Tabs on Webflow's Tabs element

1. Add a **Tabs** element. Delete all but one tab link and one tab pane.
2. Wrapper (the Tabs element): `data-cell2-tabs` and `data-cell2-id`.
3. The remaining Tab Link: `data-cell2-tab-link`. Inside it, a text element with `data-cell2-meta` = `tab-title`, and optionally a span with `data-cell2-tab-count`.
4. The remaining Tab Pane: `data-cell2-tab-content`. Inside, build a list as in 3b (`data-cell2-list` and an item). Leave off `data-cell2-id`; the tabs wrapper supplies it.
5. Add a `_config` tab to the sheet (one row per tab; columns `Tab`, `Label`, `Sort By`, `Sort Dir`, `Active`...). Do not make `_config` the first tab in the workbook.

cell2site clones the link and pane once per tab and uses Webflow's own `w--current` and `w--tab-active` classes, so the Tabs element's styling applies.

## 5. Accordions (Relume)

If an item contains the Relume Accordion 2 classes, it opens and closes with no extra setup. Defaults:

| Part | Class |
|---|---|
| Trigger | `.accordion2_top` |
| Panel | `.accordion2_bottom` |
| Icon (rotates 45 degrees) | `.accordion2_icon` |

Different class names? Set `data-cell2-accordion-trigger`, `-panel` and `-icon` to CSS selectors on the list or tabs wrapper.

## 6. Map

Add a Div Block with `data-cell2-map-wrapper` and `data-cell2-id`. Inside: a Div Block with `data-cell2-map` and a **height** (the map has none by default), and optionally a popup card Div with `data-cell2-map-card` plus `data-cell2-field` elements. Sheet columns: `Latitude`, `Longitude`, `Name`.

## Troubleshooting

- Nothing appears in the Designer: expected. Open Preview or the published site.
- "Could not load the sheet": the sheet is not shared as "Anyone with the link", or the tab name is wrong.
- Old data after an edit: caches last about a minute in memory and an hour in the browser. Add `?clearcache` to the page URL once.
