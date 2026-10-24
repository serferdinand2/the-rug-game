# Issue #5: Small pixel icons and game pieces

## Scope

Draw all issue #5 icons as 24×24 style C sprites with the existing toolkit, register the five interface symbols named in the issue body but missing from the current catalog, generate their served SVGs, and provide a standalone local review page grouped by category. The owner reviews the complete set in that page; this work does not mark the approval checklist complete.

## Inventory

- Catalog icons: 37 across resources (5), income buildings (4), pieces (3), dice (15), terrain (5), and tracks (5).
- Add five generic interface symbols requested by the issue: VP, territory tile, tapestry card, tech card, and space tile.
- The player token remains one catalog asset. The review page shows that token in all five player colors from the UI palette.
- Landmarks use their footprint-shaped pictures from #7; no separate landmark markers.

## Steps

1. Add tests for the catalog inventory, complete drawings, 24×24 canvas size, non-empty output, and the local review gallery's grouped coverage.
2. Implement icon drawing primitives and one draw module per stable catalog ID.
3. Add the five missing interface-symbol IDs to the catalog and the art build.
4. Add `art/preview/index.html`, a local review copy that shows every issue #5 icon grouped by category, including five player-token color swatches and 1×/4× previews.
5. Run `npm run art`, the art-specific tests, `npm run check`, and `npm test`; review the page in the browser at native and enlarged icon sizes.
6. Leave issue #5's owner-approval checklist open until the owner checks the gallery.

## Design decisions

Use the approved style C palette and crisp pixel edges. Keep gameplay icon drawings simple enough to read at 24px and use the existing stable IDs. Treat the issue's five UI symbols as a separate `symbol` icon group so the original resource, building, piece, die, terrain, and track grouping remains clear.
