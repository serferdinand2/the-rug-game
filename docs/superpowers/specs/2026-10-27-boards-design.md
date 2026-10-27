# The boards: map, territory tiles and capital mats (#6): design

Written 2026-10-27. #6 draws what the game's boards are made of: the map's terrains, the 48 territory tiles, both map sides, and the 12 advanced capital mats. The cosmetic boards (the tracks backdrop, the income mat, the table) moved to #51.

The owner asked for #25–#28 and then #6 to be built without stopping ("build all", "When you are done just finish up #6", 2026-10-27). What the owner said is marked **(owner)**, every other decision **(my call)**. The owner approves the set in the component library's Art part afterwards, as for #9, #10 and #11; the issue's last checkbox stays theirs.

## 1. Composed, not painted whole

The capital mats set the pattern **(owner, #5)**: "Actual capital mats must be generated from the reusable terrain tiles for each game." The map follows it **(my call)**:
- **Terrain hexes:** each terrain gets one hex picture, `hex/<terrain>`. A territory on the map is composed from them: each corner's wedge shows its terrain's picture, the island its own, and a coast line runs where land meets sea.
- **Why compose:** a territory tile lies in any of 6 turns. Turning pixel art by 60° breaks its pixels, and a picture per turn would be 288 pictures. Composing from wedges shows every turn crisply, and the terrains always match the engine's data, so matching sides read true.
- **Static tiles:** `territory-tile/<n>` and `board/map-small` and `board/map-large` are drawn by the same composition in pixel space. They are what the gallery reviews; the tiles also serve the Terrain tab, and the boards are examples, like the base capital mats.

## 2. Geometry

- **The hex:** a territory picture is a flat-topped hex of radius 32 px on a 64×56 canvas, corner 0 at the top left, clockwise, as on the board (#26 **(owner)**). Outside the hex is transparent.
- **Wedges and islands:** a pixel belongs to corner k's wedge when its centre lies within 30° of corner k's direction, which is `cornerWedge` in `src/lib/hexmap.js` in pixel form. The island is the small hexagon of `islandParts` (0.42 of the radius), split the same way.
- **One source:** a test checks that the pixel wedges agree with `hexmap.js`'s polygons, so the static tiles and the in-game composition show the same thing.

## 3. The pictures

The pictures are style C pixel art, top-down, in the palette:
- **Terrains:** sea (deep blue with glints and wave lines); desert (sand with dune ripples); forest (dense crowns); grassland (green with tufts and flowers); mountain (grey ridges and peaks with snow); and unexplored (the dark, dashed hex the map shows today).
- **Coasts:** where land meets sea, a sand-and-foam line; it is drawn by the composition, not by any one terrain.
- **Clouds (R77):** a white cloud with a shaded underside is overlaid, whole inside the hex, on exactly:
  - territory tiles 1, 7, 8, 9, 10, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 30, 33, 35, 36, 39, 40, 42, 43, 44, 45 and 48;
  - large-map hexes `0_0`, `-1_-4`, `0_-3`, `2_0`, `4_1`, `3_3`, `3_4`, `0_3`, `1_4`, `-4_-1`, `-3_0`, `-3_1` and `-2_-2`;
  - small-map hexes `0_0`, `-3_-3`, `-2_-2`, `3_0`, `2_1`, `0_2` and `0_3`.
- **The volcano:** tile 47 and large-map `-1_3` get a volcano on a mountain corner, with dark ash smoke and an ember glow. The smoke must never read as a cloud.
- **Game data:** clouds are game data that Cloud Colonies (#49) will score. So they go into the engine's data now, as `clouds: true` on the territory tiles and printed hexes that show them. A test checks the lists against R77. `volcano: true` marks the volcano the same way **(my call)**.

## 4. In the game

- **WorldMap and TerritoryTile** fill each wedge and island part with its terrain picture, clipped to the polygon they already draw. They add the coast line between land and sea wedges, and the cloud or volcano overlay where the data says. Pieces stay on top.
- **Unexplored hexes** use `hex/unexplored`.
- **The Terrain tab and the explore prompt** use the same TerritoryTile, in any turn.

## 5. The advanced capital mats

**What gets drawn.** Following #5's capital pattern **(owner)**, each of the 12 advanced biomes gets its capital terrain tiles: 8 buildable and 6 impassable variants, 32×32. Each also gets an example mat composed from them on its printed layout:
- A&A: Archipelago, Canyon, Cavern, Cloud City, Mesa and Swamp;
- F&F: Quagmire, City in a Bottle, Veil, Savanna, Polar and Netherworld.

**Layouts.** The layouts and special features come from 03-expansions §2 (A&A) and FF §2. The engine's own data for these mats belongs to #36, so the example mats carry their layouts in the drawing, marked examples **(my call)**. Their special features:
- Archipelago's 9×11 grid with water strips;
- Cloud City's cloud-shaped districts;
- Canyon's cacti;
- Swamp's lily pads;
- Netherworld's imps and city centre (its paths are the player's own, so nothing is printed).

**Gaps.** Where the research doesn't show a layout or feature, it is left out and listed, never invented **(CLAUDE.md)**.

## 6. Not in #6

- The tracks backdrop, the income mat, its F&F overlay and the table background (#51).
- Cloud Colonies' scoring (#49); the advanced mats in the engine (#36); dice faces and game symbols (text, #5).

## 7. Tests

- **Territory pictures:**
  - every pixel inside the hex is painted and every pixel outside is transparent;
  - each wedge's pixels carry its terrain's colours;
  - no two tiles are identical.
- **Clouds:**
  - cloud colours appear on exactly R77's tiles and printed hexes;
  - the volcano's smoke uses no cloud colour.
- **Data:** the engine's `clouds` and `volcano` marks equal R77.
- **The client:** WorldMap composes a hex from the right pictures (`client-hexmap`).
- **Capital terrain:** each biome's tiles are distinct; the example mats match their layouts' impassable plots.
- **The usual art checks:** each SVG matches its drawing, and every catalog entry is drawn.

## 8. After the review

**Rulings.** The fresh review's findings were ruled on and fixed **(my call)**:
- **Features for #36.** The printed features of the advanced mats were not cut into separate assets. Each biome module exports `FEATURES` instead: its ordinary tile pools, its special variants and its mat-only features, as the contract for #36, which composes advanced mats in the game. #36 cuts the overlays it needs from the drawing code. `capitalTileUrl` stays for the base biomes only, so no special tile can land on a random plot.
- **Art.** Cloud City's sixth impassable tile is redrawn as an anvil cloud, and several obstacles that read as something else are redrawn. Each layout is pinned in its test against the research grid.
- **The map.** The explore preview carries its tile's clouds and volcano, screen readers hear them, and the tile number moves clear of the volcano.

**Accepted.**
- The gallery's territory tiles vary their details per tile (seed = id), while the game composes from `hex/*` at one seed. The terrains and the clouds are the same.
- The cloud sits at one spot on every hex.

