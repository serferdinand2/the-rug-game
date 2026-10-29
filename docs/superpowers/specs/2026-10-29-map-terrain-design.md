# The World Map's terrain in the 2.5D style (#134): design

Written 2026-10-29. The owner set the look over two rounds of throwaway sketches. What the owner said or chose is marked **(owner)**; every other decision is **(my call)**. The sketches are kept as a reference: [round-1.png](../../art/issue-134/round-1.png) with its source [spike.mjs](../../art/issue-134/spike.mjs), and [round-2.png](../../art/issue-134/round-2.png) with its source [spike-2.mjs](../../art/issue-134/spike-2.mjs). The approved picture is round 2's **D**. Neither script is run by the build or the tests; the build reuses their ideas, not their code as is.

## 1. Why

The map's terrain is drawn top-down and symbolic: rows of small peak icons and flat tree crowns, cut into wedges. #82 gave the capital mats a 2.5D look the owner chose because it is "more realistic and less symbolic", and the issue asks the map to follow.

### Goals

- Mountains are snow-capped peaks, forests are trees, the desert is rolling dunes, the grassland a meadow, the sea has depth and wave crests, all in #82's 2.5D view: seen from the front and above, masses growing out of the ground, no stamped icons.
- Same-terrain wedges inside a tile are one picture **(owner, round 1: B)**.
- Terrain joins across neighbouring hexes too: a mountain range or a wood that runs over several placed tiles is drawn as one mass **(owner, rounds 1 and 2: D)**.
- The five terrains and the fog stay easy to tell apart at the map's size, because they are game information (from the issue).
- The cloud (R77) and volcano overlays stay exactly where `src/lib/art/hex-overlays.js` puts them (from the issue).

### Non-goals

- The rules don't change.
- The unexplored fog is not redrawn **(owner, round 1: "Redraw the sea" only)**.
- The cloud and volcano overlays are not redrawn (my call): they are game information whose places are fixed.

### Anti-goals: it fails if

- a terrain looks stamped or symbolic, or two terrains can be confused at the map's size;
- a joined range shows a seam where two tiles meet, apart from the faint hex rim;
- a tile's picture changes when an unrelated tile is placed elsewhere on the map;
- the map takes long enough to paint that placing a tile stutters.

## 2. The look

### 2.1 The terrains (approved, owner)

- **Mountain:** #82's peaks and foothills on its alpine meadow (`tools/art/parts/capital-relief/mountain.js`).
- **Forest:** #82's broadleaf trees and pines on its meadow (`forest.js`).
- **Desert:** rolling dunes on #82's desert sand: a lit windward slope up to the crest, a shaded slip face, easing into the sand with no outline, and a few low rocks. Not the capital's sandstone buttes **(owner, round 1: "Mostly dunes, few rocks"; round 2 approved)**.
- **Grassland:** #82's golden meadow, with no relief, as it is open land on the map (round 1, not objected to).
- **Sea:** long bands of depth, short wave crests lit on top with a trough below, and paler shallows along the shore **(owner, round 2 approved)**.
- **Unexplored:** today's fog, unchanged **(owner)**.
- **Coast:** today's line of beach and surf where land meets sea.

### 2.2 Joins (owner)

- A **region** is a connected run of one terrain across the whole explored map: inside a tile, and across hexes where the half edges on both sides show it. Each region is painted as one mass, as #82 paints one group of impassable plots.
- **The hex rim** stays, faint, under the art: peaks and trees grow over it, so a join reads as one mass while each territory still shows its outline **(owner, round 2)**.
- Fog hexes never join anything.

## 3. How it is built

### 3.1 The game paints the map (owner ruling, 2026-10-29)

The owner chose D, where the game paints the explored map while it is played, knowing it collides with docs/conventions.md: "`src/lib/` never imports from `tools/art/`" and "Reference art by its stable asset id". The conventions file is not edited (CLAUDE.md); this design records the exception, and it covers only the map terrain's painting:

- The painting code the map needs moves into `src/lib/art/paint/`, so the game imports it from `src/lib/` and the toolkit imports it from there too. The toolkit's direction of import (it reads `src/lib/art/`) is kept, and `src/lib/` still never imports `tools/art/` **(my call)**.
- What moves: the pixel painter and the palette (`tools/art/painter.js` and `palette.js` become one-line re-exports, because about 700 drawing modules import them), and #82's mountain, forest, ground and canvas helpers, which the capital reliefs then import from their new home **(my call)**.
- Everything else stays a static asset referenced by its id: the fog, the overlays, the `hex/*` pictures, the `territory-tile/*` pictures and the example boards.

### 3.2 `paintMap` (my call)

`src/lib/art/paint/map.js` exports `paintMap(hexes)`, pure and deterministic:

- **Input:** every hex of the board in pixel space: its axial key, and for an explored hex its turned corners, island, clouds and volcano.
- **Output:** a canvas of the board at 64×56 pixels per hex, the same frame as `boardOrigin()`, transparent outside the explored hexes.
- **Steps:** each pixel's terrain → the regions (4-connected runs of one terrain across hexes) → each region's ground, then its features → the faint rims → the coast → the volcano and the cloud at their fixed spots.
- **Stable regions:** each region is painted on its own canvas, cropped to its bounding box, from a seed hashed from its pixels. A region's picture depends only on its own shape, so placing a tile repaints only the regions it touches, and nothing else on the map moves. A test checks this.
- **Speed:** regions are cached by their shape's hash, so placing a tile repaints only what changed. A test holds a budget for a whole 61-hex board; if the browser misses it, painting moves to a worker.

### 3.3 WorldMap

- `WorldMap.svelte` draws one `<image>` of the painted map, from `toSvg()` as a blob URL, under its interactive layers: the targets, the outlines, the pieces and the tags. Its pixels stay hard (`image-rendering: pixelated`).
- The fog hexes keep `hex/unexplored` and their dashed rim.
- The explored hexes' `--edge` outline goes faint, since the rim is now in the picture; the choice outlines are unchanged.
- `TerritoryArt` and `TerritoryClips` stay for the places that show a tile on its own.

### 3.4 A tile on its own

- `TerritoryTile` (a tile in hand) and the explore prompt show a tile turned as the player turns it. A 2.5D picture can't be rotated, so each turn is painted: `paintTerritory(options)` is `paintMap` for one hex **(my call)**.
- The static `territory-tile/<n>` (unturned) and `hex/<terrain>` (one terrain alone) pictures keep their ids and are redrawn by the toolkit from the same painters, for the library and anything that shows a tile unturned.
- The example boards `board/map-large` and `board/map-small` are redrawn with `paintMap`.

## 4. Approval

- The library's Art area shows the redrawn `hex/*`, `territory-tile/*` and `board/map-*` pictures. The owner approves them there before they replace the current art (from the issue).
- `docs/art/approved-assets.json` is updated only after that approval.
- Then the README's map screenshot (`docs/ui/screens/game-map.png`) is retaken from the running game, and `docs/ui/README.md` is updated.

## 5. Tests

- **Painters:** deterministic; palette colours only; each terrain's dominant colour differs from every other's.
- **Regions:** same-terrain wedges in a tile form one region; two hexes that share a half edge of one terrain form one region; fog joins nothing.
- **Stability:** placing a tile leaves every pixel outside the regions it touches unchanged.
- **Overlays:** the cloud and the volcano sit where `hex-overlays.js` puts them.
- **Speed:** a full 61-hex board paints within its budget in Node.
- **Toolkit:** the redrawn `hex/*`, `territory-tile/*` and `board/map-*` still build with the same ids and sizes; the capital reliefs are unchanged pixel for pixel after the move (their approved hashes still match).
- **WorldMap:** the browser tests that open the World Map keep passing.

## 6. Documentation

- `docs/art/README.md` (the toolkit table: what moved to `src/lib/art/paint/`), `docs/architecture.md`, `docs/ui/README.md`, `docs/status.md`.
- The conventions exception is recorded here and in docs/status.md, and the owner is told that docs/conventions.md still says otherwise, since no agent edits it.

## 7. Left to the builder

The exact sizes, counts, thresholds and colours: the sketches' numbers are a starting point. How `src/lib/art/paint/` splits into modules. The paint budget's number.
