# The boards (#6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The map's terrains, the 48 territory tiles, both map sides and the 12 advanced capital mats are drawn in style C, and the game composes the map from the terrain pictures.

**Architecture:** A new art part, `art/parts/territory.js`, holds:
- the hex geometry in pixels (agreeing with `src/lib/hexmap.js`);
- the six terrain hex pictures and the cloud and volcano overlays;
- `drawTerritory()`, which composes a hex from them.

Small drawing modules call it for `hex/*`, `territory-tile/1–48` and the two example boards. WorldMap and TerritoryTile compose in SVG from the same `hex/*` pictures. The engine's data gains `clouds` and `volcano` marks (R77). The advanced capital biomes extend the capital terrain toolkit, one module per biome.

**Tech Stack:** Node 22 ES modules with JSDoc, the art toolkit in `art/` (`painter.js`, `palette.js`, `toSvg`), Svelte 5, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-27-boards-design.md`

## Global Constraints

- `docs/art/README.md` rules:
  - `PALETTE` colours only in parts (add a colour rather than inline it);
  - `seededRandom`, never `Math.random()`;
  - one module per asset at `art/drawings/<id>.js` with a one-line comment;
  - `npm run art` writes `static/art/<id>.svg`;
  - commit the drawing and its SVG together.
- Territory pictures are 64×56, flat-topped hex radius 32, corner 0 top-left clockwise, transparent outside the hex.
- Capital terrain tiles are 32×32, full bleed, in the style of `art/parts/capital-terrain.js`.
- Clouds go on exactly R77's territories (the spec §3 lists them). Volcano smoke uses no cloud colour.
- CONVENTIONS.md for every `.js` and `.svelte` file: JSDoc, braces, Prettier on touched files only (never `npm run format`), `npm run check` 0/0.
- Each commit is titled `Refs #6: …`, the last one `Fix #6: …`, and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A turned territory on the map: the corners show the turned terrains (orient k puts printed corner `(i − k) mod 6` at position i), exactly as the matching-sides rule reads them.
- A hex with an island: the island's terrains split as `islandParts` splits them.
- Volcano smoke on tile 47 that a player could mistake for a cloud.
- Pixel art scaled by 1.25 on the map (radius 32 → 40): no seams between wedges, no blur.
- An advanced mat whose layout the research doesn't fully show: left out and listed, never invented.

---

### Task 1: Clouds and the volcano in the engine's data (controller, inline)

**Files:**
- Modify `src/lib/engine/data/territory-tiles.js` and `src/lib/engine/data/maps.js`;
- modify `tests/engine-data.test.mjs`.

- [ ] **Test:** the ids of `TERRITORY_TILES` with `clouds: true` equal R77's 26. Each map's printed hexes with `clouds: true` equal R77's lists. Only tile 47 and large `-1_3` have `volcano: true`.
- [ ] **Implement:** set the marks on the data, and leave everything else frozen and unchanged.
- [ ] **Commit:** `Refs #6: clouds and the volcano in the map data (R77)`.

### Task 2: The territory art

**Files:**
- Create `art/parts/territory.js`.
- Create the drawings `art/drawings/hex/{sea,desert,forest,grassland,mountain,unexplored,cloud,volcano}.js`, `art/drawings/territory-tile/{1..48}.js` and `art/drawings/board/{map-small,map-large}.js`.
- Create `tests/art-territory.test.mjs`.
- Modify `src/lib/art/catalog.js`: add `hex/cloud` and `hex/volcano`, and mark the two boards `example: true`.
- Modify `art/build.mjs` and `art/gallery.js` only where they check sizes: territory pictures are 64×56, overlays as drawn, the boards their own size.

**Produces:**
- `HEX_W = 64`, `HEX_H = 56`, `HEX_R = 32`.
- `inHex(x, y) → boolean`, `wedgeOf(x, y) → 0..5`, `islandPartOf(x, y, count) → index | -1`.
- `drawHexTerrain(terrain, seed) → Canvas`: 64×56, transparent outside the hex.
- `drawCloud() → Canvas` and `drawVolcano() → Canvas`: the overlays, with transparent backgrounds.
- `drawTerritory({ corners, island, clouds, volcano, seed }) → Canvas`: the composition, with a coast between land and sea pixels of different wedges.
- `drawBoard(side) → Canvas`: every hex of `MAPS[side]` at its pixel centre (x = 48·(b − a), y = 28·(a + b), shifted so the board starts at 0). Printed hexes are composed, the others are unexplored, and the sea lies around them.

**Steps:**
- [ ] **Tests:**
  - every territory tile fills its hex and leaves the outside transparent;
  - a pixel's `wedgeOf` agrees with `cornerWedge`'s polygon (sample centres);
  - each tile's corner pixels near the rim carry colours of that corner's terrain;
  - cloud colours (a palette set used only by `drawCloud`) appear in exactly R77's tiles, and on each board in exactly R77's printed hexes;
  - the volcano uses no cloud colour;
  - no two territory tiles are identical.
- [ ] Implement the part, then the drawings (each tile module reads `TERRITORY_TILES[id - 1]`), then `npm run art`.
- [ ] Look at every picture in the component library's Art part (`npm run dev`, `/components.html#art-parts`). The terrains must read at 64×56 and at 80×69. Save screenshots in the report.
- [ ] **Commit:** `Refs #6: the territory art`.

### Task 3: The map composed in the game

**Files:**
- Modify `src/lib/components/board/WorldMap.svelte` and `src/lib/components/player/TerritoryTile.svelte`, and their library sections;
- modify `src/lib/hexmap.js` (`clouds` and `volcano` on `MapHex`), with tests in `tests/client-hexmap.test.mjs`.

**Steps:**
- [ ] `mapHexes(view)` gives each hex `clouds` and `volcano` from the tile's or printed hex's data. Tested on a printed R77 hex and a placed tile 47.
- [ ] **Each wedge and island part:** fill it with `artUrl('hex/<terrain>')` as an SVG `<image>`, clipped to its polygon. Use one `<clipPath>` per wedge, with ids unique per component instance, from `$props.id()`.
- [ ] **The coast:** stroke the side between two wedges of land and sea with a coast token colour.
- [ ] **Overlays:** the cloud or volcano overlay goes over the terrain and under the pieces. Unexplored hexes use `hex/unexplored`.
- [ ] **TerritoryTile** composes the same way, at any orient.
- [ ] Tokens only; `npm run check` 0/0; library sections updated.
- [ ] **Commit:** `Refs #6: the map composed from the terrain art`.

### Tasks 4–9: The advanced capital biomes (two per task)

**The pairs:**
- 4: Archipelago and Canyon;
- 5: Cavern and Cloud City;
- 6: Mesa and Swamp;
- 7: Quagmire and City in a Bottle;
- 8: Veil and Savanna;
- 9: Polar and Netherworld.

**Before the dispatch (controller):**
- add the 168 `capital-terrain/<biome>-{open-01..08,blocked-01..06}` entries to the catalog's `aa` and `ff` lists;
- create `art/parts/capital-biomes/index.js`, which registers one module per biome;
- create a stub per biome that throws "not drawn yet".

**Files per task:**
- `art/parts/capital-biomes/<biome>.js`, exporting `drawBiomeTile(blocked, variant, random) → Canvas` (32×32) and `drawBiomeMat() → Canvas`, the example mat;
- `art/drawings/capital-terrain/<biome>-*.js` (14);
- `art/drawings/capital-mat/<biome>.js`;
- `tests/art-capital-<biome>.test.mjs`.

**Steps:**
- [ ] Read the biome's section of `docs/research/03-expansions.md`:
  - A&A: §"Advanced capital city mats", lines 322–525;
  - F&F: FF.6, lines 1491–1755.

  Take its layout, impassable plots and special features. Draw what is shown; list what isn't.
- [ ] **Tests:**
  - 14 distinct 32×32 full-bleed tiles;
  - the example mat's impassable plots are exactly the layout's `X`s (read the drawing's layout constant);
  - the mat's size is its grid × 32.
- [ ] **Draw:** the biome's ground, and 8 buildable and 6 impassable variants, in the base biomes' style (`art/parts/capital-terrain.js`). The example mat is composed from them, with the special features the layout prints: water strips, cloud districts, cacti, lily pads, paths.
- [ ] `npm run art`; look in the library; commit `Refs #6: the <biome> and <biome> capital terrain`.

### Task 10: Review, documents and the owner's gallery

- [ ] A fresh review of all the art against the spec and R77, then fixes.
- [ ] **Screenshots:** the map in the game; the Art part's territory tiles and boards; an advanced mat. Update the README "Current interface", `docs/ui/README.md`, `docs/art/README.md` (the new parts) and the CLAUDE.md #6 entry.
- [ ] **Commit:** `Fix #6: …`. Leave the "owner has approved the set" checkbox for the owner.
