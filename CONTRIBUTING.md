# Contributing to cell2site

Thanks for helping. cell2site is small and deliberately dependency-free.

## Project shape

One file, `cell2site.js`, vanilla JS, no build step, no package manager for the library itself. Leaflet and MarkerCluster are loaded from a CDN at runtime, only on pages with a map. Its header and the README document every attribute; if you change behaviour, update both in the same commit.

## Principles

- **No build step.** The file must run as is from a script tag. No transpiling, no bundling.
- **No dependencies** beyond runtime Leaflet. Don't add libraries.
- **Attributes over config objects.** Everything is `data-cell2-*` with a sensible default.
- **Backward compatible.** Renaming or removing an attribute is a breaking change; add instead. The list and map vocabularies mirror each other (`search` and `map-search`); keep it that way.
- **Cell content is untrusted.** Anything written into the DOM from a sheet goes through `setText`, `setHtml` or `textContent`, never raw `innerHTML`.
- **Comments say why**, not what.

## The website

`site/` is cell2site.com. Pages are built by `scripts/build-site.mjs` from the shared layout in `scripts/site/` (header, footer, consent banner), styled with Tailwind (`site/src/styles.css`), and deployed with `npx wrangler deploy`. The docs and changelog pages are rendered from `README.md` and `CHANGELOG.md`, so edit those, never a page. Examples live in `site/examples/` as plain snippets, shown live with their code.

## Reporting a bug

Include what you expected, what happened (console output starting `[cell2site]`), and a link to a minimal public sheet and page that reproduce it. Most issues come down to sheet structure or sharing.

## Submitting a change

1. Fork and branch; one fix or feature per pull request.
2. Update the README and the `CHANGELOG.md` "Unreleased" section.
3. Run `node --check cell2site.js`, then `npm test` (the Playwright suite in `test/`). Add a test for the behaviour you changed.
4. Say what changed, why, and what you tried it against.

## Versioning

Semantic versions, tagged `vX.Y.Z`. Maintainers cut releases and bump the version in `cell2site.js` and the CDN URLs; please don't in a pull request.
