# #134 · The World Map's terrain in the 2.5D style: plan

The design is [2026-10-29-map-terrain-design.md](../specs/2026-10-29-map-terrain-design.md). Each step is built test-first and leaves `npm run check` and `npm test` green.

## Step 1 · Move the painting code into `src/lib/art/paint/`

- Move `tools/art/painter.js` and `palette.js` to `src/lib/art/paint/`; the old files become one-line re-exports.
- Move `capital-relief/canvas.js`, `ground.js`, `mountain.js` and `forest.js` (and the parts of `footprint.js` they use) to `src/lib/art/paint/relief/`, and point the capital-relief modules at them.
- Test: every approved asset's hash is unchanged (`tests/art-approved.test.mjs`); a new test checks that nothing under `src/lib/art/paint/` imports `tools/art/`, the DOM or Svelte.

## Step 2 · The map's painters

- `src/lib/art/paint/region.js`: a free-form region as #82's footprint (no plots, no corner joins), and natural ground laid over any region.
- `src/lib/art/paint/dunes.js` and `sea.js`: the approved desert and sea from round 2.
- Tests first: deterministic, palette colours only, transparent outside the region, every terrain's dominant colour distinct.

## Step 3 · `paintMap` and `paintTerritory`

- `src/lib/art/paint/map.js`: terrain per pixel, regions across hexes, ground, features, faint rims, coast, then the volcano and the cloud at their fixed spots; each region cropped and seeded from its own pixels; a cache by shape.
- Tests first: regions inside a tile and across hexes, fog joins nothing, the stability check, overlay positions, and the speed budget for a 61-hex board.

## Step 4 · The toolkit's pictures

- Redraw `hex/*` (except `unexplored`, `cloud` and `volcano`), the 48 `territory-tile/*` and `board/map-*` with the new painters, keeping their ids and sizes.
- Tests: `tests/art-territory.test.mjs` and `tests/art-build.test.mjs` updated for the new look; the approval manifest is left alone until the owner approves.

## Step 5 · The game

- `WorldMap.svelte`: one painted picture under the interactive layers; the faint edge; fog unchanged.
- `TerritoryTile` and the explore prompt: `paintTerritory` at the tile's turn.
- The library: the WorldMap, TerritoryArt and TerritoryTile sections, and the Art area's map pictures.
- Tests: the browser tests that open the World Map; a unit test for the blob-URL helper.

## Step 6 · Approval and documents

- The owner approves the Art area's map pictures and the game's map; then the approval manifest, the README's map screenshot and `docs/ui/README.md`.
- `docs/art/README.md`, `docs/architecture.md` and `docs/status.md`.
