# Art production notes

These are contributor notes. Nothing in this folder is served to players.

## Art style C (approved 2026-10-20)

The owner compared three versions of the same picture and chose style C:
- a 64×64 pixel-art scene with its own sky, setting and detail;
- shown inside a card frame, like Fablewood Rummy's card illustrations;
- drawn as vector SVG, with one `crispEdges` path per colour.

`style-c/lighthouse-scene.svg` is the approved reference: the Lighthouse landmark at night. `style-c/lighthouse.mjs` is the one-off script that first drew it. Both stay unchanged: a test checks the toolkit's Lighthouse against the SVG pixel for pixel.

Two other options were rejected as the main style: a 16×16 flat icon and a 32×32 shaded sprite. The owner-reviewed small-piece set uses 32×32 resources, buildings, tokens and track symbols, and 128×128 outpost flags, scaled to their display size. Dice faces, terrain hex markers and generic game symbols use text or later artwork as explained in [issue-5.md](issue-5.md).

## The art toolkit (`art/`)

The design is in [2026-10-21-art-toolkit-design.md](../superpowers/specs/2026-10-21-art-toolkit-design.md). The owner approved the scene parts on 2026-10-21.

| File | What it holds |
|---|---|
| `art/painter.js` | The canvas, drawing helpers (`set`, `rect`, `line`, and `paint` for small sprites drawn from rows of keys), `outline`, `mix`, `seededRandom`, `underlay` and `toSvg` |
| `art/effects.js` | Light passes that blend colours over a painted canvas: `glow`, a banded glow around a lamp or fire. They live outside `art/parts/`, whose parts paint only palette colours |
| `art/palette.js` | `PALETTE`: every named style C colour |
| `art/parts/` | Scene parts: `drawSky` (night, day, dusk), `drawSea` (night, day), `drawTerrain` (forest, mountain, desert, grassland), `drawBuilding` (house, tower, wall), `drawFigure`, `drawSmoke` (smoke, steam), `drawClassical` (pediment, flat), `drawFactory`, `drawSkyline` (night, dusk, day), `drawStreet`, `drawShip` (1–3 masts, either way, sails set or furled), `drawInterior` (plaster, stone, panel; with a window onto any sky), `drawBanner` (flag, hanging), `drawCrowd` and `drawWheel`. Board parts: `capital-terrain.js` (the capital plots and example mats) and `inspiration-tile.js` (`drawInspirationTile`, the strip of six framed spaces that each inspiration tile's innovations are drawn on) |
| `src/lib/art/footprints.js` | `FOOTPRINTS` for the 33 landmarks, `PLOT_SIZE` (32), `footprintMismatches` and `clipToFootprint` |
| `src/lib/art/catalog.js` | `ASSETS`: every asset the game needs, with its stable id, plus `GROUPS` and `EXPANSIONS` |
| `art/drawings/` | One module per drawn asset, at `art/drawings/<id>.js` |
| `art/build.mjs` | Writes each drawing to `static/art/<id>.svg` |
| `art/gallery.js` | `PART_SAMPLES`, `gallerySections` (the grouping the art is reviewed in) and `drawingCanvas` (the check every drawing passes). No Node APIs, so the component library runs it in the browser |

### Asset ids

Every asset has a stable id, `<group>/<slug>`, such as `landmark/lighthouse`, `tapestry/age-of-sail` or `die/red-4-vp`. The game refers to art only by this id, and the rules engine uses the same ids for the same things. Ids never change once the game uses them, even when a display name is corrected. Content that the README's rules conventions leave out has no id.

### Adding a drawing

The owner-approved small-piece release is documented in [issue-5.md](issue-5.md). Its reviewed sprites are stored as exact vector pixel runs in the drawing modules, including their per-pixel opacity. Both the browser gallery and `npm run art` use those same sources. The complete former mockup is preserved in [archive/2026-10-23-issue-5/](archive/2026-10-23-issue-5/README.md).

1. Find the asset's id in `src/lib/art/catalog.js`.
2. Create `art/drawings/<id>.js`, with a one-line comment at the top, exporting `draw()`. It returns a canvas: 64×64 for an illustration.
3. Look at it in the **Art** part of the component library: run `npm run dev` and open <http://127.0.0.1:5173/components.html#art-parts>. Every scene part and every asset in the catalog is there, drawn or as an empty slot naming its issue, and landmarks sit under their plot grid. The page draws straight from the toolkit, so a saved change shows at once.
4. Run `npm run art`. It writes `static/art/<id>.svg`, the file the game uses.
5. Commit the drawing and its SVG together. `npm test` fails when a committed SVG doesn't match its drawing, when a drawing has no catalog entry, and when an SVG has no drawing.

`static/art/` is build output only. Never put a hand-made SVG there: `npm run art` deletes every SVG in it that has no drawing. Drawings must be `.js` files; `npm run art` refuses any other file in `art/drawings/`, an illustration that isn't 64×64, and a landmark picture that doesn't match its footprint.

### Landmark pictures

Each landmark is one picture, drawn in the shape of its footprint, and the game shows that same picture on its card and on the capital grid.
- **Size.** 32 pixels per plot: `columns × 32` by `rows × 32`, so a 2×2 landmark is 64×64 like the Lighthouse, and the Rubber Works is 128×128.
- **Footprints** are in `src/lib/art/footprints.js`, top row first, as printed. Draw that orientation and never mirror it; the board rotates pictures in 90° steps (R15).
- **Exact plots.** Every pixel of an occupied plot is filled and every pixel of an empty plot is left empty. `npm run art` and the tests refuse anything else.
- **Uneven shapes.** Keep the landmark itself inside the shape; let sky and ground fill the outer plots. Paint the scene across the whole canvas, then finish with `clipToFootprint(scene, FOOTPRINTS[slug])` to empty the plots outside the footprint (see the Rubber Works or the Castle).

### Composing a scene

The Lighthouse (`art/drawings/landmark/lighthouse.js`) is the worked example:
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

Resource symbols have two active native sizes: 24×24 and 48×48. Their owner-supplied PNGs and exact-color SVG vectors are in `art/exports/resources-24px-png/` and `art/exports/resources-48px-png/`; the rendered SVGs are in `static/art/resource-24/` and `static/art/resource-48/`. Each source pixel is either opaque or fully transparent. The former 32×32 set is deprecated and archived in `docs/art/archive/resource-32-deprecated/`.
