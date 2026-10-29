# Art production notes

These are contributor notes. Nothing in this folder is served to players.

## Art style C (approved 2026-10-20)

The owner compared three versions of the same picture and chose style C:
- a 64×64 pixel-art scene with its own sky, setting and detail;
- shown inside a card frame, like Fablewood Rummy's card illustrations;
- drawn as vector SVG, with one `crispEdges` path per colour.

`style-c/lighthouse-scene.svg` is the approved reference: the Lighthouse landmark at night. `style-c/lighthouse.mjs` is the one-off script that first drew it. Both stay unchanged: a test checks the toolkit's Lighthouse against the SVG pixel for pixel.

Two other options were rejected as the main style: a 16×16 flat icon and a 32×32 shaded sprite. The owner-reviewed small-piece set uses 32×32 resources, buildings, tokens and track symbols, and 128×128 outpost flags, scaled to their display size. Dice faces, terrain hex markers and generic game symbols use text or later artwork as explained in [issue-5.md](issue-5.md).

## The art toolkit (`tools/art/`)

The design is in [2026-10-21-art-toolkit-design.md](../superpowers/specs/2026-10-21-art-toolkit-design.md). The owner approved the scene parts on 2026-10-21.

| File | What it holds |
|---|---|
| `tools/art/painter.js` | Re-exports `src/lib/art/paint/painter.js` (moved in #134 so the game can paint the map): the canvas, drawing helpers (`set`, `rect`, `line`, and `paint` for small sprites drawn from rows of keys), `outline`, `mix`, `seededRandom`, `underlay` and `toSvg` |
| `tools/art/effects.js` | Light passes that blend colours over a painted canvas: `glow`, a banded glow around a lamp or fire. They live outside `tools/art/parts/`, whose parts paint only palette colours |
| `tools/art/palette.js` | Re-exports `src/lib/art/paint/palette.js`: `PALETTE`, every named style C colour |
| `tools/art/parts/` | Scene parts: `drawSky` (night, day, dusk), `drawSea` (night, day), `drawTerrain` (forest, mountain, desert, grassland), `drawBuilding` (house, tower, wall), `drawFigure`, `drawSmoke` (smoke, steam), `drawClassical` (pediment, flat), `drawFactory`, `drawSkyline` (night, dusk, day), `drawStreet`, `drawShip` (1–3 masts, either way, sails set or furled), `drawInterior` (plaster, stone, panel; with a window onto any sky), `drawBanner` (flag, hanging), `drawCrowd` and `drawWheel`. Board parts: `capital-terrain.js` (the base mats' buildable ground tiles and example mats), `capital-relief/` (below), `capital-biomes/` (one module per advanced biome, #6: its 32×32 plots, its printed `LAYOUT` and its example mat), `territory.js` (#6, redrawn in #134: the terrain hex pictures and the example boards, from `src/lib/art/paint/map.js`) and `inspiration-tile.js` (`drawInspirationTile`, the strip of six framed spaces that each inspiration tile's innovations are drawn on) |
| `src/lib/art/paint/` | The painting code the game shares with the toolkit (#134, owner ruling): the painter and palette, `relief/` (#82's footprint, ground, canvas, mountain and forest), `hex.js` (the hex's geometry, the cloud and the volcano), `region.js`, `dunes.js`, `sea.js`, and `map.js` (`paintMap`, `paintTerritory`): the World Map's 2.5D terrain, painted by the game while it is played |
| `tools/art/parts/capital-relief/` | The joined 2.5D terrain of a capital mat's impassable plots (#82). `footprint.js`, `ground.js`, `canvas.js`, `mountain.js` and `forest.js` moved to `src/lib/art/paint/relief/` in #134, as the game's map painter shares them; the rest stays here: one painter per base biome (`mountain.js`, `forest.js` from there, `wetland.js`, `tropical.js`, `desert.js`, `grassland.js`), and `index.js` (`drawRelief`, the relief alone on a transparent canvas, and `drawReliefPreview`, the relief over its ground as the game shows it, plus the specimen layout the library reviews each biome on) |
| `src/lib/art/relief.js` | `RELIEF_BIOMES` (the biomes with a relief: the six base ones), `PLOT`, `GAP`, `PITCH` and `reliefSize`, shared by the art and the game's `CapitalGrid` |
| `src/lib/art/footprints.js` | `FOOTPRINTS` for the 33 landmarks, `PLOT_SIZE` (32), `footprintMismatches` and `clipToFootprint` |
| `src/lib/art/catalog.js` | `ASSETS`: every asset the game needs, with its stable id, plus `GROUPS` and `EXPANSIONS` |
| `src/lib/art/hex-overlays.js` | Where the cloud and the volcano sit in a territory's 64×56 picture, shared by the art and the game's map (#6) |
| `tools/art/drawings/` | One module per drawn asset, at `tools/art/drawings/<id>.js` |
| `tools/art/build.mjs` | Writes each drawing to `static/art/<id>.svg` |
| `tools/art/gallery.js` | `PART_SAMPLES`, `gallerySections` (the grouping the art is reviewed in) and `drawingCanvas` (the check every drawing passes). No Node APIs, so the component library runs it in the browser |

### Asset ids

Every asset has a stable id, `<group>/<slug>`, such as `landmark/lighthouse`, `tapestry/age-of-sail` or `die/red-4-vp`. The game refers to art only by this id, and the rules engine uses the same ids for the same things. Ids never change once the game uses them, even when a display name is corrected. Content that the README's rules conventions leave out has no id.

### Adding a drawing

The owner-approved small-piece release is documented in [issue-5.md](issue-5.md). Its reviewed sprites are stored as exact vector pixel runs in the drawing modules, including their per-pixel opacity. Both the browser gallery and `npm run art` use those same sources. The complete former mockup is preserved in [archive/2026-10-23-issue-5/](archive/2026-10-23-issue-5/README.md).

1. Find the asset's id in `src/lib/art/catalog.js`.
2. Create `tools/art/drawings/<id>.js`, with a one-line comment at the top, exporting `draw()`. It returns a canvas: 64×64 for an illustration.
3. Look at it in the **Art** part of the component library: run `npm run dev` and open <http://127.0.0.1:5173/components.html#art-parts>. Every scene part and every asset in the catalog is there, drawn or as an empty slot naming its issue, and landmarks sit under their plot grid. The page draws straight from the toolkit, so a saved change shows at once.
4. Run `npm run art`. It writes `static/art/<id>.svg`, the file the game uses.
5. Commit the drawing and its SVG together. `npm test` fails when a committed SVG doesn't match its drawing, when a drawing has no catalog entry, and when an SVG has no drawing.

`static/art/` is build output only. Never put a hand-made SVG there: `npm run art` deletes every SVG in it that has no drawing. Drawings must be `.js` files; `npm run art` refuses any other file in `tools/art/drawings/`, an illustration that isn't 64×64, and a landmark picture that doesn't match its footprint.

### Landmark pictures

Each landmark is one picture, drawn in the shape of its footprint, and the game shows that same picture on its card and on the capital grid.
- **Size.** 32 pixels per plot: `columns × 32` by `rows × 32`, so a 2×2 landmark is 64×64 like the Lighthouse, and the Rubber Works is 128×128.
- **Footprints** are in `src/lib/art/footprints.js`, top row first, as printed. Draw that orientation and never mirror it; the board rotates pictures in 90° steps (R15).
- **Exact plots.** Every pixel of an occupied plot is filled and every pixel of an empty plot is left empty. `npm run art` and the tests refuse anything else.
- **Uneven shapes.** Keep the landmark itself inside the shape; let sky and ground fill the outer plots. Paint the scene across the whole canvas, then finish with `clipToFootprint(scene, FOOTPRINTS[slug])` to empty the plots outside the footprint (see the Rubber Works or the Castle).

### Composing a scene

The Lighthouse (`tools/art/drawings/landmark/lighthouse.js`) is the worked example:
- **Background layer.** Draw the sky, sea and terrain parts on a background canvas.
- **Foreground.** Draw the subject, buildings and figures on a second canvas.
- **Outline.** Run `outline(foreground, PALETTE.ink)` so the foreground gets its dark edge.
- **Merge.** Run `underlay(foreground, background)` to fill the gaps from the background.
- **Last details.** Add anything that must sit on top without an outline, such as the gulls.

### Rules

- **Colours.**
  - Scene parts paint only `PALETTE` colours. A test checks this. Add a new colour to the palette instead of writing it inline.
  - Drawings may also blend palette colours with `mix()`, for glows and highlights.
  - People come in three skin tones, each with a shade: `skin` and `skinShade`, `skinTan` and `skinTanShade`, and `skinDeep` and `skinDeepShade`. Creatures such as aliens, genies and merfolk blend their skin from palette colours with `mix()`.
  - Colours are lowercase `#rrggbb`. `set()` throws on anything else, and on coordinates that aren't whole numbers.
- **Illustrations other than landmarks.**
  - They paint every pixel of their 64×64 canvas (full bleed), because the card frame needs a picture with no holes. `tests/art-tapestry.test.mjs` checks the tapestry cards, `tests/art-civ.test.mjs` the civilization portraits, `tests/art-tech.test.mjs` the tech cards, `tests/art-masterpiece.test.mjs` the masterpieces, `tests/art-landmark-card.test.mjs` the landmark cards, and `tests/art-space-tile.test.mjs` the space tiles.
  - The inspiration tiles are boards, not illustrations: each is a 192×32 strip of six 32×32 spaces, drawn with `drawInspirationTile` so their frames, violet ground and sparkles match. `tests/art-inspiration-tile.test.mjs` checks the strip.
  - They carry no lettering: the frame carries the card's name. They show no likeness of a real person. Real religious and political signs, flags and emblems are allowed (owner, 2026-10-22).
  - Explicit material is allowed where the subject calls for it: blood, wounds, drawn weapons, skulls, drink, smoke, gambling and the occult. So is bare skin where the subject has it, such as a merman or a werewolf in torn clothes (owner, 2026-10-22).
- **Randomness.**
  - Use `seededRandom(seed)`, never `Math.random()`, so a drawing comes out the same every time.
  - Give every part in one scene the same random stream.
- **Review.** The owner approves art in the Art part of the component library (`/components.html`), until the players' card gallery (#47) exists. It replaced the standalone `art/preview/index.html` gallery on 2026-10-21.
- **Approved assets.** [approved-assets.json](approved-assets.json) pins each approved asset's id, size and SVG hash, and `tests/art-approved.test.mjs` fails when one of them changes. The manifest is updated with the art on the issue branch, which merges only after the owner approves the batch (#82). Recompute an entry from `renderAsset(id)` in `tools/art/build.mjs`, as the test does; never type a hash by hand.

Resource symbols have two active native sizes: 24×24 and 48×48. Their owner-supplied PNGs and exact-color SVG vectors are in `tools/art/exports/resources-24px-png/` and `tools/art/exports/resources-48px-png/`; the rendered SVGs are in `static/art/resource-24/` and `static/art/resource-48/`. Each source pixel is either opaque or fully transparent. The former 32×32 set is deprecated and archived in `docs/art/archive/resource-32-deprecated/`.

## 2026-10-24 owner asset revisions

The shaded 32×32 player tokens replace the old flat five-colour variants at the existing `piece/token-{colour}` URLs. Their original PNGs are retained in `tools/art/imported-pngs/player-tokens/`, and the flat predecessors are deprecated under `docs/art/archive/player-tokens-v1/`. Tests compare every visible pixel and alpha against the PNGs. No partial transparency or colour substitution is introduced.

The owner's five native 24 px terrain hex markers are now active `terrain/{sea,desert,forest,grassland,mountain}` drawings and production SVGs; earlier deferral text applies only to the old placeholder drawings. These markers are distinct from capital biome terrain tiles. Civilization cards consume their production URLs.

## The map and the advanced capitals (#6, 2026-10-27)

The map is composed, as the capital is (#5): the game never shows a painted board.
- **Terrain hexes.** Each terrain has one 64×56 hex picture, `hex/<terrain>`: a flat-topped hex of radius 32, transparent outside it. The game fills each corner's wedge, and each island part, with its terrain's picture, clipped to the wedge. It strokes a coast where land meets sea, and lays the cloud and the volcano at their spots from `src/lib/art/hex-overlays.js`. A turned tile therefore stays crisp in all six turns, and always shows the terrains the engine scores.
- **Territory tiles.** `territory-tile/1–48` are the same composition in pixels. The game uses them nowhere that it composes: they are for the gallery's review.
- **Example boards.** `board/map-small` and `board/map-large` are examples too, like the advanced capital mats.
- **Clouds are game data (R77).** The engine's `TERRITORY_TILES` and printed hexes carry `clouds` and `volcano`. The art draws a cloud only where they say, in colours nothing else on the map uses, and `tests/art-territory.test.mjs` checks every tile and board against R77.
- **Advanced capitals.** Each of the 12 advanced biomes has 8 buildable and 6 impassable 32×32 plots, and an example mat on its printed layout from 03-expansions. What the research doesn't show (rule text, icons, frames) is left out; each module says what. #132 and #133 replace their impassable plots with reliefs, as #82 did for the base mats. A mat's example then duplicates its relief preview and goes too, once whatever it alone draws (`FEATURES.matOnly`: Canyon's cacti, Netherworld's imps, the Veil and so on) is drawn somewhere else (my call, from the owner's 2026-10-29 ruling).

## The joined terrain of the base mats (#82, 2026-10-28)

The owner approved all six base mats on 2026-10-28. The design is [2026-10-28-joined-terrain-design.md](../superpowers/specs/2026-10-28-joined-terrain-design.md), and the approved sketch is kept in [issue-82/](issue-82/).
- **One relief per mat.** `capital-relief/<mat>` is the mat's impassable plots drawn as one transparent picture from its printed layout: 32-pixel plots with 1-pixel gaps, so 296×296 for a 9×9 mat. Plots that touch by a side or a corner are one mass. The game lays it over the grid.
- **The ground stays per plot.** `capital-terrain/<biome>-open-01` to `-08` are each base biome's natural ground, and the game still picks one per plot from the table's seed.
- **The base impassable tiles are retired.** `capital-terrain/<biome>-blocked-*` no longer exist for the six base biomes; the expansion biomes keep theirs until #132 and #133.
- **No base example mats.** A base mat's only picture is its relief, shown on its ground in the library's Capital relief group. Its example `capital-mat/<biome>` was the same picture, so it is gone (owner, 2026-10-29: "let's not duplicate the art").

