# A territory's face, drawn once (#113): design

Written 2026-10-28. #113 is a refactor found by #80's review. The issue's proposed solution is the brief; every other decision is marked **(my call)**.

## 1. What and why

`TerritoryTile` and `WorldMap` draw the same territory picture (terrain wedges, coasts, the island, the cloud and the volcano) in two copies with identical CSS, `PromptArt` rebuilds what `explore.js`' `tilePreview` gives, and a tile is put into words three ways. #49 (Cloud Colonies) needs the clouds on exactly the right territories, so the face should be drawn, and worded, in one place.

**Done when** one component draws a territory's face for the map and the tiles, one function words a tile, and the map and explore browser tests pass. Nothing changes on screen.

## 2. The shapes (`src/lib/hexmap.js`)

- `territoryShapes(corners, island, { clouds, volcano }, size)` gives a face round the origin: the terrain `picture` box, one `wedge` per corner (`terrain`, `k`), the `coasts` (the end of each line from the origin), the `islands` (`terrain`, `n` parts, part `i`, outline `points`), and the `cloud` and `volcano` boxes, or null. The volcano is looked up only when there is one, since `volcanoCorner` throws without mountains.
- `territoryClips(size)` **(my call)** gives the clip polygons the shapes are cut with: the six wedges, and for an island of 1 to 6 parts each part's polygon. A part's clip depends only on how many parts the island has, which is why `WorldMap` already shares one set of clips among all its hexes.

## 3. The components (`src/lib/components/board/`)

- `TerritoryClips`: the `<defs>` of `territoryClips(size)`, ids `{prefix}-w{k}` and `{prefix}-i{n}-{i}`, as `WorldMap`'s are today.
- `TerritoryArt`: a `<g>` with `corners`, `island`, `clouds`, `volcano`, `size` and `prefix`, drawing `territoryShapes` cut by those clips; its attributes (such as `transform`) go on the `<g>`.
- `WorldMap` draws its clips once and a `TerritoryArt` per explored hex, moved there with the same `translate`.
- `TerritoryTile` draws its own clips (its `$props.id()` as the prefix, so tiles on one page don't share ids), a `TerritoryArt`, then its edge and number as before. It now carries all 27 clips instead of the 6–12 it needs **(my call)**: a few small polygons per tile, for one drawing path.
- `PromptArt` takes a territory from `tilePreview(id, orient)` instead of turning `TERRITORY_TILES` itself.

The images, lines and polygons keep their geometry, order and rendering (pixelated pictures, the coast stroke, the island and edge outlines), so the look is pixel-identical.

## 4. The words

`territoryWords({ corners, island, clouds, volcano })` in `hexmap.js`: the corner terrains once each, in the order given, joined "a, b and c"; then ", with an island of …" (its terrains once each, joined the same way), ", with clouds" and ", with a volcano". The map's wording wins **(my call)**: it is the one a player hears most and reads as a sentence. The three users:

- the map's hex labels: "Hex 0,0: sea, with an island of desert, forest, grassland and mountain, with clouds." (unchanged);
- `tileWords(tile)`: "Territory tile: forest and sea, with an island of desert" (was "…, island of desert");
- `TerritoryTile`'s label: "Territory tile 17: forest and sea, with an island of desert" (was "Territory tile 17: forest, sea, island of desert").

Only screen-reader labels change; nothing visible does.

## 5. Tests

- `tests/client-hexmap.test.mjs`: `territoryShapes` for land and sea, an island, clouds and a volcano, and none; `territoryClips` matches the wedges and island parts the shapes are drawn with; `territoryWords` for one, two and three terrains, an island named once per terrain, clouds and a volcano.
- `tests/client-area-explore.test.mjs`: `tileWords` is "Territory tile: " and `territoryWords` of the printed tile.
- The library shows both new components; the map and explore browser tests (`explore-prompt`, `player-area`, `setup-prompts`, `library`) pass unchanged.
