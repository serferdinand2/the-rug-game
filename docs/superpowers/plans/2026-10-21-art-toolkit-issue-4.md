# Art toolkit and asset catalog (issue #4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the one-off Lighthouse prototype into a reusable pixel-art toolkit, list every asset the game needs in a catalog with stable ids, and redraw the Lighthouse with the toolkit, pixel for pixel.

**Architecture:**
- A new top-level `art/` folder holds:
  - the painter;
  - the palette;
  - the scene parts;
  - the catalog;
  - one drawing module per drawn asset, at `art/drawings/<id>.js`.
- `art/build.mjs` writes each drawing to `client/static/art/<id>.svg`, and those files are committed. `art/preview.mjs` writes a review sheet to `docs/art/preview.html`, which is git-ignored.
- The `.js` files in `art/` import nothing from Node or the DOM, so `svelte-check` covers them and the client can import the catalog later (#47).

**Tech Stack:** Node.js 22.12+ built-ins only (`node:fs`, `node:path`, `node:url`, `node:test`). JSDoc types are checked by `svelte-check`, and Prettier formats the code.

**Spec:** [docs/superpowers/specs/2026-10-21-art-toolkit-design.md](../specs/2026-10-21-art-toolkit-design.md). Its §7.4 table and Appendix A are the catalog's data.

## Global Constraints

- **Modules and packages.** ES modules with JSDoc, and no TypeScript. There are no runtime packages.
  - `art/**/*.js` imports nothing from `node:` or the DOM.
  - Only `art/build.mjs` and `art/preview.mjs` use Node built-ins.
- **Conventions** from CONVENTIONS.md:
  - a one-line comment at the top of every file;
  - JSDoc on every export;
  - braces on every `if`/`else`;
  - Prettier formatting (tabs, single quotes);
  - `UPPER_SNAKE_CASE` for fixed data.
- **Type check.** Add `"art/**/*.js"` to `jsconfig.json`'s `include`. `npm run check` must report 0 errors and 0 warnings.
- **Randomness.** No `Math.random()`. Random choices come from `seededRandom(seed)`.
- **Colours** are lowercase `#rrggbb` strings.
- **SVG output format.** It is exactly the prototype's:
  - the root is `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" shape-rendering="crispEdges">`;
  - then one `<path fill="#rrggbb"[ fill-opacity="O"] d="…"/>` per colour, in order of each colour's first pixel, scanning rows top to bottom and left to right;
  - each horizontal run of one colour is written as `M{x} {y}h{n}v1h-{n}z`.
- **Ids and paths.**
  - An id is `<group>/<slug>`.
  - Its drawing is `art/drawings/<id>.js`, exporting `draw()`.
  - Its file is `client/static/art/<id>.svg`.
- **Left-out content** never gets a catalog entry. That covers Infrastructure Boost, the "Arc…" card and Cloud Colonies (R43, R44, R77), and the left-out Automa content.
- **Don't change the prototype.** `docs/art/style-c/` stays unchanged: it is the reference the Lighthouse test compares against.
- **Tests and commits.**
  - Tests are written first, as `tests/art-*.test.mjs` with `node:test` and `node:assert/strict`.
  - Every commit says "Refs #4: …" and ends with the `Co-Authored-By` line. #4 is closed only after the owner has reviewed the scene parts.

## Review Focus

1. **A drawing changes but `npm run art` isn't run.** The committed SVG goes stale and the game shows old art. Task 5 has a test that compares every committed SVG with its drawing's current output and names the file and the fix.
2. **A drawing file sits at a path that is no catalog id**, for example a typo or the wrong group folder. Then nothing in the game can find it. Task 5 has two checks: `buildArt` refuses it, naming the file, and a test checks that every drawing is in the catalog.
3. **The same colour is spelt two ways**, such as `#FFF`, `#FFFFFF` or a named colour. That would split one colour into two paths, and `mix` would fail. In Task 1, `set` throws on anything that isn't lowercase `#rrggbb`.
4. **Computed geometry gives a fractional coordinate**, such as `x * 0.45`. Today that writes to a fractional array index and the pixel silently disappears. In Task 1, `set` throws on coordinates that aren't integers.
5. **The client imports the catalog later (#47).** If `art/catalog.js` ever imports anything, the browser build breaks. Task 4 has a test that the file has no `import` statements and that every asset is a plain object.

---

### Task 1: The pixel painter

**Files:**
- Create: `art/painter.js`, `tests/art-painter.test.mjs`
- Modify: `jsconfig.json` (`include` gets `"art/**/*.js"`)

**Interfaces:**
- Produces (all exported from `art/painter.js`):
  - **Types:**
    - `@typedef {string} Colour` (lowercase `#rrggbb`);
    - `@typedef {{ w: number, h: number, p: (Colour | null)[] }} Canvas`, where `p` is row-major and `null` is empty;
    - `@typedef {{ x: number, y: number, w: number, h: number }} Box`, measured from the top-left corner.
  - **Canvas basics:**
    - `createCanvas(w: number, h: number): Canvas`;
    - `inside(canvas: Canvas, x: number, y: number): boolean`;
    - `get(canvas: Canvas, x: number, y: number): Colour | null | undefined`. It returns `undefined` outside the canvas.
  - **Drawing:**
    - `set(canvas: Canvas, x: number, y: number, colour: Colour | null | undefined): void`.
      - It does nothing when the point is outside the canvas or `colour` is falsy, exactly like the prototype.
      - It throws an `Error` when `x` or `y` isn't an integer, or when `colour` is truthy but isn't lowercase `#rrggbb`.
    - `clear(canvas: Canvas, x: number, y: number): void` sets the pixel to `null`.
    - `rect(canvas, x, y, w, h, colour): void`.
    - `fillEmpty(canvas, x, y, colour): void` sets the pixel only when it is `null`.
    - `outline(canvas: Canvas, colour: Colour): void`. It paints `colour` on every empty pixel that has a 4-neighbour filled with a colour other than `colour`. It decides every pixel first, then paints, as the prototype does.
  - **Helpers:**
    - `mix(a: Colour, b: Colour, t: number): Colour` blends each channel and rounds it.
    - `seededRandom(seed: number): () => number` is the prototype's generator: `seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296`.
    - `underlay(canvas: Canvas, layer: Canvas): void` fills each empty pixel of `canvas` from `layer`.
  - **SVG:**
    - `toSvg(canvas: Canvas, options?: { opacity?: Record<Colour, number> }): string`, in the format in Global Constraints;
    - `fromSvg(svg: string): Canvas` reads back the format `toSvg` writes. It ignores `fill-opacity`. The Lighthouse test uses it.

- [ ] **Step 1: Write the failing tests** in `tests/art-painter.test.mjs`:
  - `'toSvg writes one path per colour and merges each run'`. Use a 3×2 canvas: row 0 is `#aa0000`, `#aa0000`, `#0000bb`; row 1 is `#aa0000`, empty, `#aa0000`. The output must equal `'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" shape-rendering="crispEdges"><path fill="#aa0000" d="M0 0h2v1h-2zM0 1h1v1h-1zM2 1h1v1h-1z"/><path fill="#0000bb" d="M2 0h1v1h-1z"/></svg>'`.
  - `'toSvg writes no paths for an empty canvas'`: `toSvg(createCanvas(2, 2))` equals the root element with nothing inside.
  - `'toSvg applies per-colour opacity'`: the path for `#aa0000` with `{ opacity: { '#aa0000': 0.5 } }` contains `fill="#aa0000" fill-opacity="0.5"`.
  - `'fromSvg reads back what toSvg wrote'`: a 4×3 canvas with three colours and gaps round-trips with `deepEqual`.
  - `'set ignores points outside the canvas and empty colours'`:
    - `set(c, -1, 0, '#aa0000')` and `set(c, 0, 0, null)` leave `c` unchanged;
    - `set` at the canvas's own `w` also does nothing.
  - `'set rejects colours that are not lowercase #rrggbb'`: `'#FFF'`, `'#FFFFFF'` and `'red'` each throw.
  - `'set rejects fractional coordinates'`: `set(c, 1.5, 0, '#aa0000')` throws.
  - `'get returns undefined outside the canvas and null on an empty pixel'`.
  - `'outline paints only empty neighbours of other colours'`: on a 5×5 canvas with one `#aa0000` pixel at (2, 2), `outline(c, '#111111')` paints exactly (2, 1), (1, 2), (3, 2) and (2, 3).
  - `'outline does not grow from its own colour'`: a lone `#111111` pixel stays alone after `outline(c, '#111111')`.
  - `'seededRandom repeats its sequence for the same seed'`. The first value for seed 7 equals `((7 * 1664525 + 1013904223) >>> 0) / 4294967296`, and two generators built from seed 7 give the same 100 values.
  - `'mix blends each channel and rounds'`: `mix('#000000', '#ffffff', 0.5)` is `'#808080'`, and `mix('#102030', '#102030', 0.3)` is `'#102030'`.
  - `'underlay fills only empty pixels'`.
- [ ] **Step 2: Run the tests.** `node --test tests/art-painter.test.mjs` fails because `art/painter.js` is missing.
- [ ] **Step 3: Implement `art/painter.js`** with the signatures above. Port the helpers from `docs/art/style-c/lighthouse.mjs`, with the validation added to `set`. Add `"art/**/*.js"` to `jsconfig.json`'s `include`.
- [ ] **Step 4: Run the checks.**
  - `node --test tests/art-painter.test.mjs` passes.
  - `npm run check` reports 0 errors and 0 warnings.
- [ ] **Step 5: Commit.** `git add art/painter.js tests/art-painter.test.mjs jsconfig.json && git commit` with the message "Refs #4: add the pixel painter".

### Task 2: Palette, night sky and sea, and the Lighthouse rebuilt

**Files:**
- Create:
  - `art/palette.js`;
  - `art/parts/sky.js` and `art/parts/sea.js`;
  - `art/drawings/landmark/lighthouse.js`;
  - `tests/art-lighthouse.test.mjs` and `tests/art-parts.test.mjs`.

**Interfaces:**
- Consumes: Task 1's painter.
- Produces:
  - **The palette.** `art/palette.js` exports `PALETTE`: a frozen `Record<string, Colour>` with descriptive names you choose, such as `outline`, `cream`, `brickRed` and `nightSky1`.
    - It holds every colour literal in `lighthouse.mjs`. Colours that `mix()` produces are not included.
    - Parts use only `PALETTE` values. Task 3 adds more.
  - **The sky.** `art/parts/sky.js` exports `drawSky(canvas: Canvas, options: SkyOptions): void`.
    - `SkyOptions` is `{ time: 'night' | 'day' | 'dusk', horizon: number, random: () => number, stars?: number, starRows?: number, sparkles?: [number, number][], moon?: { x: number, y: number } }`.
    - It fills rows 0 to `horizon`, inclusive.
    - The night defaults are `stars` 46 and `starRows` 32. There are no sparkles and no moon unless they are given.
    - In this task, only `'night'` exists. Any other `time` throws until Task 3.
  - **The sea.** `art/parts/sea.js` exports `drawSea(canvas: Canvas, options: SeaOptions): void`.
    - `SeaOptions` is `{ time: 'night' | 'day', top: number, random: () => number, waves?: number }`.
    - It fills rows `top` to the bottom. `top` is the bright horizon line.
    - The night default is `waves` 60. In this task, only `'night'` exists.
  - **The Lighthouse.** `art/drawings/landmark/lighthouse.js` exports `draw(): Canvas`, a 64×64 canvas.
    - This drawing pattern applies to every future drawing.

The night sky and sea must reproduce the prototype exactly, including the order in which it uses `random()`. Port these blocks from `lighthouse.mjs`, replacing its fixed numbers with the options:
- **Sky:**
  - the dithered gradient, from `yy / horizon` over the six night colours;
  - then each star, taking `random()` three times in this order: x (`× canvas.w`), y (`× starRows`), then colour (`> 0.6` is white);
  - then the sparkles;
  - then the moon. The prototype's moon is centred at (50, 10) and its bite at (+3, −2), over a ±7 box.
- **Sea:**
  - the four row bands: `top`, before `top + 6`, before `top + 14`, then the rest;
  - then each wave, taking `random()` three times in this order: `wy = top + 1 + floor(r × (h − top − 1))`, `wx = floor(r × (w − 4))`, and `n = 2 + floor(r × 4)`. A wave is light when `wy < top + 8`.

The Lighthouse drawing keeps everything specific to this picture in its own module:
- the headland, the lamp's reflection, the tower, the rocks, the beams, the foam and the gulls;
- the order: sky with `horizon: 41`, `sparkles: [[8, 6], [58, 22], [37, 4], [3, 24]]` and `moon: { x: 50, y: 10 }`; then the headland; then the sea with `top: 42`; then the reflection.

All of it uses one `seededRandom(7)` stream. The prototype's `set(c, 22, 41, null)` and `set(c, 25, 41, null)` do nothing, so leave them out.

- [ ] **Step 1: Write the failing tests.**
  - `tests/art-lighthouse.test.mjs`:
    - `'the toolkit Lighthouse has exactly the prototype pixels'`. Compare `draw().p` with `fromSvg(<docs/art/style-c/lighthouse-scene.svg>).p`. On a mismatch, the failure message names the first differing (x, y) and both colours.
    - `'the toolkit Lighthouse writes the same SVG as the prototype'`: `toSvg(draw())` equals the file's contents.
  - `tests/art-parts.test.mjs`:
    - `'the night sky fills every pixel down to its horizon'`;
    - `'the night sea fills every pixel from its top row down'`;
    - `'the night sky and sea draw the same pixels for the same seed'`;
    - `'parts draw only palette colours'`: every non-null pixel the night sky and sea draw is one of `Object.values(PALETTE)`;
    - `'every palette colour is lowercase #rrggbb'`.
- [ ] **Step 2: Run the tests.** `node --test tests/art-lighthouse.test.mjs tests/art-parts.test.mjs` fails because the modules are missing.
- [ ] **Step 3: Implement** `art/palette.js`, `art/parts/sky.js`, `art/parts/sea.js` and `art/drawings/landmark/lighthouse.js` as described above.
- [ ] **Step 4: Run the checks.** Both test files pass, and `npm run check` is clean.
- [ ] **Step 5: Commit** these files with the message "Refs #4: rebuild the Lighthouse with the toolkit".

### Task 3: The remaining scene parts

**Files:**
- Create: `art/parts/terrain.js`, `art/parts/buildings.js`, `art/parts/figures.js`
- Modify: `art/parts/sky.js`, `art/parts/sea.js`, `art/palette.js`, `tests/art-parts.test.mjs`

**Interfaces:**
- Consumes: Task 1's painter, and Task 2's `PALETTE`, `drawSky` and `drawSea`.
- Produces:
  - **New times.** `drawSky` adds `time: 'day'` and `'dusk'`, and `drawSea` adds `time: 'day'`. Each fills the same rows as at night.
  - **Terrain.** `art/parts/terrain.js` exports `drawTerrain(canvas: Canvas, options: { kind: 'forest' | 'mountain' | 'desert' | 'grassland', top: number, random: () => number }): void`.
    - It fills every pixel from row `top` to the bottom.
    - Features such as trees and peaks may rise above `top`.
  - **Buildings.** `art/parts/buildings.js` exports `drawBuilding(canvas: Canvas, options: { kind: 'house' | 'tower' | 'wall', x: number, y: number, width?: number }): Box`.
    - `(x, y)` is the building's bottom-left pixel.
    - It returns the box that holds every pixel it drew.
  - **Figures.** `art/parts/figures.js` exports `drawFigure(canvas: Canvas, options: { x: number, y: number, facing?: 'left' | 'right', clothes?: Colour }): Box`.
    - `(x, y)` is the bottom-left pixel.
    - The default is `facing: 'right'`.
    - `clothes` must be a `PALETTE` colour.
- **How they look is your call**, within style C: the same palette family as the Lighthouse, and an outline-friendly silhouette. The owner reviews them on the preview sheet in Task 5.
- **Composition.** These parts follow the prototype's pattern:
  - background parts (sky, sea and terrain) draw on a background layer;
  - buildings, figures and subjects draw on the foreground;
  - then `outline(foreground, PALETTE.<outline colour>)`, then `underlay(foreground, background)`.

- [ ] **Step 1: Write the failing tests** in `tests/art-parts.test.mjs`. Loop over every kind, so that a missing one fails by name.
  - `'every sky time fills every pixel down to its horizon'`, for night, day and dusk.
  - `'every sea time fills every pixel from its top row down'`, for night and day.
  - `'every terrain kind fills every pixel from its top row down'`. Use each of the 4 kinds on a 64×64 canvas with `top: 44`.
  - `'buildings and the figure draw only inside the box they return'`. Place each building kind and the figure at x 20, y 50. Then check:
    - every non-null pixel lies inside the returned box;
    - `box.x === 20`;
    - `box.y + box.h - 1 === 50`.
  - `'every part draws the same pixels for the same seed'`.
  - Extend `'parts draw only palette colours'` to every part and kind.
- [ ] **Step 2: Run the tests.** `node --test tests/art-parts.test.mjs` fails, because the new modules are missing and the new times throw.
- [ ] **Step 3: Implement** the parts, adding their colours to `PALETTE`.
- [ ] **Step 4: Run the checks.**
  - `node --test tests/art-parts.test.mjs tests/art-lighthouse.test.mjs` passes. The Lighthouse must still match.
  - `npm run check` is clean.
- [ ] **Step 5: Commit** with the message "Refs #4: add sky, sea, terrain, building and figure parts".

### Task 4: The asset catalog

**Files:**
- Create: `art/catalog.js`, `tests/art-catalog.test.mjs`

**Interfaces:**
- Produces (from `art/catalog.js`):
  - **Types:**
    - `@typedef {'base' | 'pp' | 'aa' | 'ff'} ExpansionCode`;
    - `@typedef {'illustration' | 'icon' | 'board'} AssetKind`;
    - `@typedef {{ id: string, name: string, kind: AssetKind, group: string, expansion: ExpansionCode, issue: number }} Asset`;
    - `@typedef {{ id: string, label: string, kind: AssetKind, issue: number }} AssetGroup`.
  - **`EXPANSIONS`:** a frozen `{ code: ExpansionCode, name: string }[]`. In order: base "Base game", pp "Plans & Ploys", aa "Arts & Architecture", ff "Fantasies & Futures".
  - **`GROUPS`:** a frozen `AssetGroup[]` in the order of the spec's §7.4 table. The labels are:
    - civ "Civilizations"; tapestry "Tapestry cards"; tech "Tech cards"; landmark "Landmarks"; landmark-card "Landmark cards"; space-tile "Space tiles"; masterpiece "Masterpieces";
    - resource "Resources"; building "Income buildings"; piece "Player pieces"; die "Dice faces"; terrain "Terrain"; track "Track symbols"; landmark-marker "Landmark grid markers";
    - board "Boards"; hex "Map hexes"; territory-tile "Territory tiles"; capital-mat "Capital mats"; inspiration-tile "Inspiration tiles".
  - **`ASSETS`:** a frozen `Asset[]`, sorted by `GROUPS` order, then `EXPANSIONS` order, then the order in the spec's Appendix A.

Write the data as one list per group and expansion, of `[slug, name]` pairs. The id is `` `${group}/${slug}` ``, and kind and issue come from the group. Each slug is written out by hand, never computed from the name.

**Card groups.** The names, spellings and slugs follow Appendix A and the spec's slug rules. Landmark-marker uses the landmark list.

**Other groups.** Their names aren't in Appendix A, so use these:

| Group | Names (slug in brackets) |
|---|---|
| space-tile | "Space tile 1" … "Space tile 15" (`1`…`15`); "Technology 5 VP", "Science 5 VP", "Military 5 VP", "Monolith" |
| resource | Coin, Worker, Food, Culture, "Any resource" (`any`) |
| building | Market, House, Farm, Armory |
| piece | Outpost, "Toppled outpost" (`outpost-toppled`), "Player token" (`token`) |
| die | "Science die: exploration" (`science-exploration`) … "Science die: arts" (aa); "Red die: 4 VP" (`red-4-vp`) … "Red die: 1 VP per territory" (`red-vp-per-territory`); "Black die: coin" (`black-coin`) … "Black die: tile benefit (?)" (`black-tile-benefit`) |
| terrain | Sea, Desert, Forest, Grassland, Mountain |
| track | Exploration, Science, Technology, Military; Arts (aa) |
| board | "Large map (4–5 players)" (`map-large`), "Small map (1–3 players)" (`map-small`), "Tracks backdrop" (`tracks`), "Income mat" (`income-mat`), "Table background" (`table`); "Income-mat overlay [5]" (`income-overlay`, ff) |
| hex | "Sea hex", "Desert hex", "Forest hex", "Grassland hex", "Mountain hex", "Unexplored hex" (slugs `sea` … `unexplored`) |
| territory-tile | "Territory tile 1" … "Territory tile 48" (`1`…`48`) |
| capital-mat | the mat names (`mountain` … `city-in-a-bottle`) |
| inspiration-tile | Markets, Houses, Farms, Armories |

- [ ] **Step 1: Write the failing tests** in `tests/art-catalog.test.mjs`:
  - `'every id is a group and a lowercase slug'`. Each id matches `/^[a-z0-9-]+\/[a-z0-9]+(-[a-z0-9]+)*$/`.
  - `'ids are unique'`.
  - `'every asset takes its kind and issue from its group, and its id starts with its group'`.
  - `'each group has the agreed count per expansion'`.
    - The expected counts are an object copied from the spec's §7.4 table. For example, `tapestry: { base: 44, pp: 13, aa: 20, ff: 37 }` and `die: { base: 14, aa: 1 }`.
    - Expansions missing from a group must have zero assets.
  - `'there are 293 illustrations, 70 icons and 82 boards'`.
  - `'card slugs follow the slug rules'`. This covers the civ, tapestry, tech, landmark, landmark-card, masterpiece, capital-mat, inspiration-tile and landmark-marker groups.
    - Each slug must equal a test-local `slugify(name)`. It normalises with NFD, drops combining marks, lowercases, drops `'` and `.`, turns each run of other characters into `-`, then trims any `-` from the ends.
    - It is checked against `'Déjà Vu'` → `deja-vu`, `'S.T.E.A.M.'` → `steam`, `"Wizards' Guild"` → `wizards-guild` and `'Sewage & Plumbing'` → `sewage-plumbing`.
  - `'left-out cards have no entry'`. No asset is named "Infrastructure Boost" or "Cloud Colonies".
  - `'every landmark has a grid marker with the same slug and expansion'`.
  - `'spot checks match the agreed spellings'`. Each of these exists with exactly these fields:
    - `landmark/lighthouse` (Lighthouse, base, issue 7);
    - `tapestry/deja-vu` (Déjà Vu, ff);
    - `tapestry/commercial-center` (aa);
    - `tapestry/trap` (base);
    - `tech/siegecraft`;
    - `tech/lithium-ion-battery`;
    - `tapestry/pillage-and-plunder`;
    - `die/black-tile-benefit`;
    - `resource/any`;
    - `territory-tile/48`;
    - `capital-mat/city-in-a-bottle` (ff);
    - `space-tile/technology-5-vp` (pp).
  - `'the catalog imports nothing, so the client can load it'`. The source of `art/catalog.js` has no line matching `/^\s*import\s/m`. `JSON.parse(JSON.stringify(ASSETS))` deep-equals `ASSETS`.
- [ ] **Step 2: Run the tests.** `node --test tests/art-catalog.test.mjs` fails because the module is missing.
- [ ] **Step 3: Implement `art/catalog.js`** from the spec's Appendix A and the table above.
- [ ] **Step 4: Run the checks.** The tests pass, and `npm run check` is clean.
- [ ] **Step 5: Commit** with the message "Refs #4: add the asset catalog with stable ids".

### Task 5: Build, preview sheet and documentation

**Files:**
- Create:
  - `art/build.mjs` and `art/preview.mjs`;
  - `tests/art-build.test.mjs`;
  - `client/static/art/landmark/lighthouse.svg`, which is generated.
- Modify:
  - `package.json` (the `art` script);
  - `.gitignore` and `.prettierignore` (`docs/art/preview.html`);
  - `docs/art/README.md`, `CONVENTIONS.md` (project layout), `CLAUDE.md` (Commands, Architecture, Where the work stands).

**Interfaces:**
- Consumes: Task 1's `toSvg`, `fromSvg` and `createCanvas`, Task 2–3's parts, and Task 4's `ASSETS`.
- Produces (from `art/build.mjs`):
  - **Constants:** `DRAWINGS_DIR` (`art/drawings/`) and `OUT_DIR` (`client/static/art/`), both absolute paths.
  - **`listDrawingIds(drawingsDir = DRAWINGS_DIR): Promise<string[]>`** returns the sorted ids of every `<group>/<slug>.js` file.
  - **`renderAsset(id: string, drawingsDir = DRAWINGS_DIR): Promise<string>`** imports the drawing and returns `toSvg(draw())`.
    - It throws `Error('<id>: a drawing must export a draw() function that returns a canvas')` when `draw` is missing or returns something that isn't a canvas.
  - **`buildArt({ drawingsDir = DRAWINGS_DIR, outDir = OUT_DIR, assets = ASSETS } = {}): Promise<{ written: string[], removed: string[] }>`**:
    - it first throws `Error('<id>: this drawing has no catalog entry')` for any drawing whose id isn't in the catalog;
    - then it writes `<outDir>/<id>.svg` for every drawing;
    - then it deletes any `.svg` under `outDir` with no drawing.
  - **Running it directly** builds and prints the counts. Use the `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` check from `server.mjs`.
- Produces (from `art/preview.mjs`):
  - **`buildPreview(): Promise<string>`** returns a self-contained HTML page:
    - one sample of each scene part, alone on a 64×64 canvas, labelled `sky: night`, `sky: day`, `sky: dusk`, `sea: night`, `sea: day`, `terrain: forest`, `terrain: mountain`, `terrain: desert`, `terrain: grassland`, `building: house`, `building: tower`, `building: wall` and `figure`;
    - then every drawn asset, labelled with its id and name.
    - Each picture appears at 1× and 4×, as inline SVG with `image-rendering: pixelated` sizing.
  - **Running it directly** writes `docs/art/preview.html`.
- Produces (from `package.json`): `"art": "node art/build.mjs && node art/preview.mjs"`.

- [ ] **Step 1: Write the failing tests** in `tests/art-build.test.mjs`:
  - `'every drawing has a catalog entry'`.
  - `'every committed SVG is up to date with its drawing'`. For each drawing id, `client/static/art/<id>.svg` must equal `await renderAsset(id)`. The failure message says "run npm run art".
  - `'every SVG in client/static/art belongs to a drawing'`.
  - `'buildArt refuses a drawing with no catalog entry'`. Write `landmark/nowhere.js` in a temp `drawingsDir` and expect a rejection matching `/landmark\/nowhere: this drawing has no catalog entry/`.
  - `'buildArt writes drawings and removes SVGs whose drawing is gone'`. Use temp dirs, with a drawing whose `draw()` returns a 2×2 canvas. Pass `assets` holding its id. Pre-create a stray `.svg` in `outDir`. Check `written` and `removed`, and the files on disk.
  - `'renderAsset explains a drawing without draw()'`. A temp drawing that only exports `const nope = 1` rejects with `/must export a draw\(\) function/`.
  - `'the preview shows every part sample and every drawing'`. The HTML from `buildPreview()` contains each of the 13 labels and `landmark/lighthouse`.
  - `'the build copies the Lighthouse into public/art'`. `public/art/landmark/lighthouse.svg`, from the `pretest` build, equals the committed file.
- [ ] **Step 2: Run the tests.** Run `node --test tests/art-build.test.mjs`. It fails because the modules are missing.
- [ ] **Step 3: Implement** `art/build.mjs`, `art/preview.mjs` and the `art` script. Add `docs/art/preview.html` to `.gitignore` and `.prettierignore`.
- [ ] **Step 4: Build the art.** Run `npm run art`. It writes `client/static/art/landmark/lighthouse.svg` and `docs/art/preview.html`.
- [ ] **Step 5: Run every check.** `npm test` passes in full, `npm run check` is clean, and `npm run format` leaves `git status` without unexpected changes.
- [ ] **Step 6: Update the documentation.**
  - `docs/art/README.md`: how to add a drawing (catalog id → `art/drawings/<id>.js` exporting `draw()` → `npm run art` → commit the SVG), the composition pattern from Task 3, the palette-only rule for parts, seeded randomness, and the preview sheet.
  - CONVENTIONS.md: add `art/` to the project layout.
  - CLAUDE.md:
    - add `npm run art` to Commands, and an `art/` bullet to Architecture;
    - in "Where the work stands", say that #4 is built and waiting for the owner's review of the parts, that #47 and #48 wait for #3, and that #3's new interface base is in progress.
- [ ] **Step 7: Commit** with the message "Refs #4: build the art into client/static and add the preview sheet".
- [ ] **Step 8: Ask the owner to review the parts.**
  - Serve `docs/art/` over HTTP, for example `python3 -m http.server 52990 --bind 127.0.0.1` from `docs/art/`.
  - Screenshot the preview sheet and show it to the owner.
  - Close #4 with "Fix #4: …" only after they approve the parts. Rework requested parts in a follow-up commit first.
