# Arts & Architecture reliefs (#132) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw each group of impassable plots on the six Arts & Architecture mats as one 2.5D relief, with natural ground and a picture of each mat's printed features, as the owner approved them. Retire the old tiles and examples only after the owner approves the result in the library.

**Architecture:**
- **Pipeline.** #82's relief pipeline (`footprint` → a painter per biome → one transparent SVG per mat) gains six painters. They take the mat's extra printed data: the volcanoes, and the clouds and their tints.
- **Features pictures.** A second per-mat picture, `capital-feature/<slug>`, holds the features that sit on buildable plots. `drawReliefPreview` stacks ground, features and relief, the way the game will.
- **Additive until the release.** Tasks 1–10 only add. Task 11 retires the #6 impassable tiles and the six example mats, after the owner's approval.

**Tech Stack:** Plain JS ES modules with JSDoc, the art toolkit's painter, Svelte 5 (the library only), and Vitest with `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-31-aa-reliefs-design.md`. The approved look is in `docs/art/issue-132/`: `approved-mats.png`, `approved-specimens.png` and `approved-close-up.png`. Its algorithms are in `docs/art/issue-132/approved-spike.mjs`; port them, don't import the spike:

| Biome | Painter in the spike | Helpers in the spike |
|---|---|---|
| Mesa | `paintMesaTable` | `STRATA` |
| Canyon | `paintCanyon` | — |
| Cavern | `paintCavern` | `drawCaveRock`, `drawStalagmite`, `drawCrystals` |
| Swamp | `paintSwamp` | `drawDeadTree`, `drawReeds` |
| Archipelago | `paintArchipelago2` | `paintArchipelago`, `drawVolcano2` |
| Cloud City | `paintCloudPeaks` | `drawPillar`, `drawPuffs` |

The spike's grounds are `GROUNDS` and `MIST_GROUNDS`, and its features are `drawCactus`, `drawLilyPond`, `drawBeaches` and `drawCloudRims`.

## Global Constraints

- Work in a worktree at `/Users/ognjenugljenovic/Work/the_rug_game-wt/reliefs` on a new branch `issue-132-aa-reliefs` from `main`. Every commit says `Refs #132: …` and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Follow `docs/conventions.md`:
  - each file starts with a one-line comment, and exported functions and types have JSDoc;
  - Prettier (tabs, single quotes), with braces on every `if`/`else`;
  - `npm run check` reports 0 errors and 0 warnings.
- **Imports.** `src/lib/` never imports `tools/art/`; only `src/library/` may. The toolkit may import `src/lib/art/` and `src/lib/engine/data/`.
- **Randomness** comes only from `seededRandom`, seeded from fixed numbers. Never use `Math.random()`.
- **Colours.** Reliefs and features pictures paint only `PALETTE` colours. Shadows are `PALETTE.ink` with a per-pixel opacity in `canvas.alpha`, painted only on empty pixels (`shadow`, `cast` in `src/lib/art/paint/relief/canvas.js`).
- **Geometry.**
  - Plots are 32 px with a 1-px gap (a pitch of 33), so a mat is `reliefSize(rows, cols)`: 296×296 for 9×9 and 296×362 for the Archipelago's 11×9.
  - A relief paints only inside `footprint(layout).reach`.
  - A features picture paints only on its own feature plots: inside their 32×32 squares, never in a gap or on an impassable plot.
- **Layouts:**
  - the advanced mats' `LAYOUT` is in `tools/art/parts/capital-biomes/<slug>.js`;
  - the volcanoes are `VOLCANOES` (row, col): `[[4, 3], [5, 3], [9, 2]]`;
  - the clouds are `CLOUDS`, and each cloud's tint index is `CLOUD_TINTS` (`[0, 1, 2, 3, 0, 1, 3, 2, 0, 0]`), where 0 is white, 1 grey, 2 tan and 3 cream.
- **The specimen data:** the Archipelago's specimen has a volcano on its lone plot, `[[1, 1]]`. Cloud City's uses the real `CLOUDS` and `CLOUD_TINTS`.
- **Until Task 11:**
  - don't change the pixels of any asset in `docs/art/approved-assets.json`, nor the manifest itself;
  - don't remove or redraw any `capital-terrain/<aa biome>-*` tile or `capital-mat/<aa biome>` example.
- **Merging.** The branch merges only after the owner approves all six in the library. The README screenshots don't change, as the game doesn't show these mats (#36).

## Review Focus

1. **The approved base reliefs must stay pixel-identical** after Task 1 shares the Desert's rock code and the Mountain's peak code. Task 1 runs `npm run art` and requires no change under `static/art/`, and `tests/art-approved.test.mjs` pins the hashes.
2. **The Archipelago's 11 rows.** Everything that assumes 9×9 must take 296×362: the build's size check, the library's picture size, and the test helper's `[296, 296]`. Task 7 tests all three.
3. **The real mats' own corner-only joins** need a piece over them, not just the specimen's: the Archipelago at 8,2, Cloud City at 5,6, and the Swamp at 1,6, 3,2 and 6,4 (row, col of each 2×2 block's top-left plot). Task 3 widens the corner test to the mat.
4. **A features picture must stay inside its own plots:** a saguaro's shadow or a pond's rim never reaches a gap or a neighbour. Task 9 checks each feature plot's 32×32 square.
5. **A Cloud City puff that straddles two clouds keeps one tint**, the one under its centre. Each buildable plot's ground takes its own cloud's tint, so the rims still part the clouds. Tasks 2 and 8 test both.

---

### Task 1: Share the rock and peak code, and carry each mat's printed data

**Files:**
- Create: `tools/art/parts/capital-relief/rock.js`
- Modify: `tools/art/parts/capital-relief/desert.js` (use `rock.js`)
- Modify: `src/lib/art/paint/relief/mountain.js` (export the peak outline)
- Modify: `tools/art/parts/capital-relief/index.js`
- Modify: `tools/art/build.mjs` (`checkCapitalRelief` reads `matLayout`)
- Modify: `src/library/art.js` (`reliefLayout` becomes `matLayout`)
- Test: `tests/art-capital-relief.test.mjs`
- Also commit: the spec, this plan, and `docs/art/issue-132/approved-*`. Leave `docs/art/issue-132/sketches.html` and `spike.mjs` (ChatGPT's) untracked.

**Interfaces:**
- **Produces, in `mountain.js`:**
  - `jagged(rand, x0, y0, x1, y1, rough) → (y: number) => number`, exported as is.
  - `peakShape(p: PeakSpec, seed: number, options?: { rough?: number, flat?: number }) → Peak`. With the defaults `rough = 0.35` and `flat = 0`, the result is today's peak exactly. `flat` moves the two flanks' summit points to `sx ∓ flat`.
  - `peakRows(peak: Peak) → [y: number, left: number, right: number][]`: the rows today's `pixels` walks.
- **Produces, in `rock.js`:**
  - `RockSpec = { kind: 'butte' | 'hoodoo' | 'boulder', bx, by, hw, ph }`.
  - `rockShape(spec, seed, style = SANDSTONE) → Rock` and `drawRock(canvas, rock, ok: Uint8Array, style = SANDSTONE)`.
  - `SANDSTONE` and `RED_ROCK`, frozen style objects. A style carries:
    - its five rock tones, light to dark;
    - its shadow map (`darker`);
    - its foot tones and its butte proportions (top width fraction and spread, knee fraction and spread, cliff slope);
    - whether its cliffs are banded (`strata`).

    `SANDSTONE` holds the Desert's present numbers. `RED_ROCK` holds the spike's: rock tones `mesaStrata, mesaRockLight, mesaRock, mesaRockShade, mesaRockDark`, a top of 0.55 + up to 0.15 of `hw`, a knee of 0.58 + up to 0.12, a slope of 0.12, foot tones from `mesaSoil*`, and strata on.
  - A `'hoodoo'` is a cap rock about 0.7 `hw` wide, two rows deep, on a neck about 0.45 of that, widening over its lowest 28% to `hw` (the spike's `rockShape`).
- **Produces, in `capital-relief/index.js`:**
  - `MatData = { volcanoes?: readonly (readonly [number, number])[], clouds?: readonly string[], tints?: readonly number[] }`.
  - `ReliefPainter = (canvas, fp, seed, mat?: MatData) => void`.
  - `drawRelief(layout, biome, mat = {})` and `drawReliefPreview(layout, biome, seed = 0, mat = {})` pass `mat` on to the painter.
  - `matLayout(slug) → readonly string[] | undefined`: `CAPITAL_GRIDS[slug]` for a base mat, `BIOMES[slug].LAYOUT` for an advanced one.
  - `matData(slug) → MatData`: `{ volcanoes: VOLCANOES }` for `'archipelago'`, `{ clouds: CLOUDS, tints: CLOUD_TINTS }` for `'cloud-city'`, and `{}` otherwise.
  - `SPECIMEN_DATA: Readonly<Record<string, MatData>>`: `archipelago: { volcanoes: [[1, 1]] }` and `'cloud-city': { clouds: CLOUDS, tints: CLOUD_TINTS }`.

- [ ] **Step 1: Write the failing tests**
  - `matLayout gives a base or an advanced mat's printed layout`:
    - `matLayout('desert')` deep-equals `CAPITAL_GRIDS.desert`;
    - `matLayout('archipelago').length === 11`;
    - `matLayout('tundra') === undefined`.
  - `matData gives the volcanoes and the clouds, and nothing for other mats`:
    - `matData('archipelago').volcanoes` deep-equals `[[4, 3], [5, 3], [9, 2]]`;
    - `matData('cloud-city').tints` deep-equals `[0, 1, 2, 3, 0, 1, 3, 2, 0, 0]`;
    - `matData('mesa')` deep-equals `{}`;
    - `SPECIMEN_DATA.archipelago.volcanoes` deep-equals `[[1, 1]]`.
  - `a flat peak has a wider summit`: for `peakShape({ bx: 50, by: 60, hw: 10, ph: 12 }, 5)`, the first row of `peakRows` is at most 3 px wide; with `{ flat: 3 }`, at least 6.
  - `a hoodoo is a cap rock on a thin neck`, for `rockShape({ kind: 'hoodoo', bx: 20, by: 30, hw: 4, ph: 12 }, 5, RED_ROCK)`:
    - its first row's width is at least 4;
    - a row in its middle third is at most 3 wide;
    - its last row is at least 6 wide.
  - In `layoutOf`, replace `CAPITAL_GRIDS[biome]` with `matLayout(biome)`. In the mat-size test, replace `[296, 296]` with `reliefSize` of that layout.
- [ ] **Step 2: Run them to see them fail**
  - Run: `npx vitest run tests/art-capital-relief.test.mjs`.
  - Expected: FAIL, as `matLayout`, `matData`, `SPECIMEN_DATA`, `peakRows` and `rock.js` don't exist.
- [ ] **Step 3: Implement the interfaces above**
  - Move `desert.js`'s rock code into `rock.js` behind `SANDSTONE`. Call `seededRandom` in exactly today's order for a butte and a boulder, so the Desert's pixels don't move.
  - In `build.mjs`, `checkCapitalRelief` uses `matLayout`, and its error text stays.
  - In `src/library/art.js`, `reliefLayout` is replaced by `matLayout`, and `drawPicture` passes `matData(slug)` to `drawReliefPreview`.
- [ ] **Step 4: Run the tests, then check that the approved art didn't move**
  - Run: `npx vitest run tests/art-capital-relief.test.mjs tests/art-approved.test.mjs tests/art-build.test.mjs && npm run art && git status --porcelain static/art`.
  - Expected: PASS, and `git status` prints nothing.
- [ ] **Step 5:** `npm run check` reports 0 errors and 0 warnings.
- [ ] **Step 6: Commit**
  - `git add` the files above, the spec, this plan and `docs/art/issue-132/approved-*`.
  - Message: `git commit -m "Refs #132: share the rock and peak code and carry each mat's printed data"`.

### Task 2: The palette and the six biomes' natural ground

**Files:**
- Modify: `src/lib/art/paint/palette.js`
- Modify: `src/lib/art/paint/relief/ground.js` (`GROUNDS`)
- Modify: `tools/art/parts/capital-biomes/cloud-city.js` (export the tint names)
- Modify: `tools/art/parts/capital-relief/index.js` (`groundKey`; the preview uses it)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- **Palette entries** (hex values computed once with `mix` and written as literals):
  - cave floor: `caveFloor` = `mix(stoneShade, night, 0.42)`, `caveFloorDark` = `mix(stoneShade, night, 0.68)`, `caveFloorLight` = `mix(stoneShade, stone, 0.12)` and `caveGrit` = `mix(stone, stoneShade, 0.55)`;
  - Cloud City's tints, as `cloud-city.js`'s `TINTS` mixes them, named `cloud<Tint><Role>`, such as `cloudGreyBase` and `cloudTanRim`. A role that already is a palette colour, such as white's light (`white`), uses that colour;
  - the terraces: `terrace<Tint>`, `terrace<Tint>Light` and `terrace<Tint>Dark` = `mix(alpineMeadowLight, base, 0.55)`, `mix(alpineMeadowPale, light, 0.6)` and `mix(alpineMeadowShade, dark, 0.5)`;
  - the Mesa's lit and shaded strata, for each colour in the spike's `STRATA`: `mix(c, white, 0.18)` and `mix(c, ink, 0.25)`. Near-identical tones may be merged.
- **`GROUNDS` gains**, with each `{ seed, base, light, dark, scatter }` taken from the spike's `GROUNDS` and `MIST_GROUNDS`, recoloured to the palette names:
  - `archipelago`, `canyon`, `cavern`, `mesa` and `swamp`;
  - `cloud-city-white`, `cloud-city-grey`, `cloud-city-tan` and `cloud-city-cream`.
- `CLOUD_TINT_NAMES = Object.freeze(['white', 'grey', 'tan', 'cream'])` in `cloud-city.js`.
- `groundKey(biome, row, col, mat: MatData) → string`:
  - for `'cloud-city'`, `` `cloud-city-${CLOUD_TINT_NAMES[mat.tints[Number(mat.clouds[row][col])]]}` ``;
  - otherwise, `biome`.
- `drawReliefPreview` draws each plot's ground with `groundKey`.

- [ ] **Step 1: Write the failing tests**
  - Extend the two natural-ground loops ("fills its plot deterministically in palette colours" and "its eight ground variants differ") from `RELIEF_BIOMES` to `[...RELIEF_BIOMES, 'archipelago', 'canyon', 'cavern', 'mesa', 'swamp', 'cloud-city-white', 'cloud-city-grey', 'cloud-city-tan', 'cloud-city-cream']`.
  - `groundKey picks a Cloud City plot's ground by its cloud's tint`, with `mat = matData('cloud-city')`:
    - `groundKey('cloud-city', 0, 0, mat) === 'cloud-city-grey'`;
    - `(0, 3)` gives `'cloud-city-tan'`;
    - `(0, 7)` gives `'cloud-city-cream'`;
    - `(2, 2)` gives `'cloud-city-white'`;
    - `groundKey('canyon', 0, 0, {}) === 'canyon'`.
  - `the Canyon's earth is paler than the Mesa's soil`: the share of `mesaSoilLight` and `sandLight` pixels over the eight Canyon variants is greater than over the eight Mesa variants.
- [ ] **Step 2:** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: FAIL, with no natural ground for archipelago.
- [ ] **Step 3:** Implement the palette entries, the grounds, `CLOUD_TINT_NAMES` and `groundKey`.
- [ ] **Step 4:** Run the tests, and `npm run art && git status --porcelain static/art`. Expected: PASS, with nothing printed.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: the palette and natural ground of the six Arts & Architecture biomes"`.

### Task 3: The Canyon relief

**Files:**
- Create: `tools/art/parts/capital-relief/canyon.js`
- Create: `tools/art/drawings/capital-relief/canyon.js`
- Modify: `tools/art/parts/capital-relief/index.js` (`RELIEF_PAINTERS.canyon`)
- Modify: `src/lib/art/relief.js` (`RELIEF_BIOMES` gains `'canyon'`)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Consumes `RED_ROCK`, `rockShape` and `drawRock` (Task 1), and `distanceInside` and `withCornerPatches`.
- Produces `paintCanyon(canvas, fp, seed)`.
- The drawing's `draw()` returns `drawRelief(matLayout('canyon'), 'canyon')`.

- [ ] **Step 1: Write the failing tests**
  - In `paint` and `relief`, pass `matData(biome)` for `'mat'` and `SPECIMEN_DATA[biome] ?? {}` for `'specimen'`.
  - Widen "a piece stands over every corner-only join" to the mat's own corners as well as the specimen's (Review Focus 3).
  - `the Canyon gorge carries a river along its middle`: in the mat relief, at least 60 pixels are `daySea2`, `daySea3` or `dayWaveDeep`, and every one of them has `distanceInside(fp.mask)` ≥ 3.
  - `the Canyon is cut into the plain, not raised on it`: fewer than 2% of the mat relief's opaque pixels are `ink`. Only the boulders and hoodoos are outlined; the gorge has no outline.
- [ ] **Step 2:** Run the relief tests. Expected: the new tests FAIL, and the per-biome loop doesn't yet include `canyon`.
- [ ] **Step 3: Port `paintCanyon` from the spike**
  - the rim is the mask worn by 1.5 + 2.5 × noise;
  - a corner patch of radius 8.5 + noise lies inside `reach`;
  - the rim soil is `withCornerPatches(fp, 12)`;
  - the terraces follow `distanceInside(hole)` and its gradient: a step every 3.2, one tone darker every 6;
  - the floor is within 1.5 of the ridge, which carries the river;
  - boulders stand on the rims, and a hoodoo and a boulder by each corner join.
  - Register it, add `'canyon'` to `RELIEF_BIOMES`, and add the drawing.
- [ ] **Step 4:** Run `npx vitest run tests/art-capital-relief.test.mjs tests/art-build.test.mjs && npm run art`. Expected: PASS, and `static/art/capital-relief/canyon.svg` is written. Nothing else under `static/art/` changes.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: draw the Canyon's gorge"`.

### Task 4: The Cavern relief

**Files:**
- Create: `tools/art/parts/capital-relief/cavern.js`
- Create: `tools/art/drawings/capital-relief/cavern.js`
- Modify: `index.js` (`RELIEF_PAINTERS.cavern`) and `relief.js` (`'cavern'`)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Consumes `peakShape` with `{ rough: 0.3, flat }` and `peakRows` (Task 1), and the `caveFloor*` tones (Task 2).
- Produces `paintCavern(canvas, fp, seed)`.

- [ ] **Step 1: Write the failing test** `the Cavern is cave rock with stalagmites and glowing crystals, not the Mountain's peaks`, on the mat relief:
  - it has `teal` or `tealLight` pixels;
  - it has `stoneLight` pixels;
  - it has no `snow` or `snowShade` pixels;
  - it has no `alpineMeadow*` pixels.
- [ ] **Step 2:** Run the relief tests. Expected: FAIL.
- [ ] **Step 3: Port `paintCavern` from the spike**
  - one formation per plot, of half-width 10 to 15 and height 12 to 19, with a smaller one behind it in about 60% of plots;
  - stalagmites of half-width 3 to 5, three in four skipped;
  - a crystal cluster on two plots in three, violet one time in three;
  - rubble mounds along the open sides;
  - a formation over each corner join.
  - Register it and add the drawing.
- [ ] **Step 4:** Run the relief and build tests, then `npm run art`. Expected: PASS, and only `capital-relief/cavern.svg` is new.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: draw the Cavern's rock, stalagmites and crystals"`.

### Task 5: The Swamp relief

**Files:**
- Create: `tools/art/parts/capital-relief/swamp.js`
- Create: `tools/art/drawings/capital-relief/swamp.js`
- Modify: `index.js` and `relief.js` (`'swamp'`)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Produces `paintSwamp(canvas, fp, seed)`.

- [ ] **Step 1: Write the failing test** `the Swamp is black water with bleached dead trees`, on the mat relief:
  - at least 30% of its opaque pixels are `quagWater`, `quagWaterDeep` or `swampWaterDeep`;
  - it has `creamShade` pixels, the lit dead wood;
  - it has at least one of `quagReed` or `swampReed`.
- [ ] **Step 2:** Run the relief tests. Expected: FAIL.
- [ ] **Step 3: Port `paintSwamp` from the spike**
  - the pool is the mask deeper than 2.5 + 5 × noise;
  - a peat face on the far bank and a mud lip on the near bank;
  - dead trees on a 23 × 21 jittered grid, standing in the pool, 16 to 24 tall, with a short reflection;
  - cypress knees;
  - tall reeds on the far bank and a few on the near bank;
  - hummocks with sedge;
  - a dead tree over each corner join.
  - Register it and add the drawing.
- [ ] **Step 4:** Run the relief and build tests, then `npm run art`. Expected: PASS, and only `capital-relief/swamp.svg` is new.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: draw the Swamp's black water and dead trees"`.

### Task 6: The Mesa relief

**Files:**
- Create: `tools/art/parts/capital-relief/mesa.js`
- Create: `tools/art/drawings/capital-relief/mesa.js`
- Modify: `index.js` and `relief.js` (`'mesa'`)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Consumes `RED_ROCK`, `rockShape` and `drawRock` (for the corner butte), and the strata tones (Task 2).
- Produces `paintMesa(canvas, fp, seed)`.

- [ ] **Step 1: Write the failing tests**
  - `the Mesa is red rock and red soil, not the Desert's sandstone`: the mat relief has no `sand`, `sandLight` or `sandShade` pixel, and it does have `mesaRock` and `mesaSoil` pixels.
  - `the Mesa's cliffs show its painted layers`: the mat relief uses at least five of the spike's `STRATA` colours, or their lit and shaded tones.
  - `the Mesa is one tableland per group`: in the mat relief, the top row's eight plots (row 0, columns 1 to 8) all have opaque pixels at their middles. Every column of x from 40 to 280 has an opaque relief pixel somewhere in y 0 to 31.
- [ ] **Step 2:** Run the relief tests. Expected: FAIL.
- [ ] **Step 3: Port `paintMesaTable` from the spike, as `paintMesa`**
  - the plan is the mask worn by up to 3.2 × noise;
  - each column's run, from back to front:
    - the top: ink at its back and sides, and a `mesaStrata` rim at its front;
    - the cliff: 0.55 of the run, between 8 and 19, banded with `STRATA` parallel to the rim, lit where the rim steps back and in shade where it steps forward;
    - the talus: 0.18 of the run, between 3 and 7, with gullies, dithered away at its foot;
  - a 4-px notch about one column in six;
  - a `RED_ROCK` butte over each corner join.
  - Register it and add the drawing.
- [ ] **Step 4:** Run the relief and build tests, then `npm run art`. Expected: PASS, and only `capital-relief/mesa.svg` is new.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: draw the Mesa as one tableland"`.

### Task 7: The Archipelago relief

**Files:**
- Create: `tools/art/parts/capital-relief/archipelago.js`
- Create: `tools/art/drawings/capital-relief/archipelago.js`
- Modify: `index.js` and `relief.js` (`'archipelago'`)
- Test: `tests/art-capital-relief.test.mjs`, `tests/art-build.test.mjs`, `tests/library-art.test.mjs`

**Interfaces:**
- Consumes `paintSea(canvas, sea, land, seed)`, `peakShape` and `peakRows`, and `mat.volcanoes`.
- Produces `paintArchipelago(canvas, fp, seed, mat)`.
- The drawing returns `drawRelief(matLayout('archipelago'), 'archipelago', matData('archipelago'))`.

- [ ] **Step 1: Write the failing tests**
  - `the Archipelago's volcano plots are land and its other impassable plots are sea`. Call the colours `daySea1`, `daySea2` and `daySea3` the sea's. In the mat relief:
    - no pixel in the middle 8×8 of a volcano plot is one of the sea's colours;
    - more than half of the middle 8×8 of every other impassable plot is.
  - `the Archipelago's relief is 296×362`: `drawRelief(matLayout('archipelago'), 'archipelago', matData('archipelago'))` has `w === 296` and `h === 362` (Review Focus 2).
  - In `art-build.test.mjs`, `buildArt takes a capital relief the size of its mat` gains a 296×362 `capital-relief/archipelago` that passes, and a 296×296 one that throws `/must be 296×362/`.
  - In `library-art.test.mjs`, `pictureSize('capital-relief/archipelago')` deep-equals `{ w: 296, h: 362 }`.
- [ ] **Step 2:** Run those three files. Expected: FAIL.
- [ ] **Step 3: Port `paintArchipelago2` from the spike**
  - the islands are an oval per volcano plot, joined between touching ones;
  - the sea is the mask minus the islands, plus a strait of 8 + 2 × noise at each corner join, ringed with sand;
  - wet sand fills the water plots' margins;
  - `paintSea` draws the water, followed by the far shore's face and surf and the near shore's foam;
  - islets stand where `distanceInside` ≥ 11, at most one to every eight water plots and at least 70 px apart;
  - each island has foam, black sand and jungle;
  - the cones:
    - for touching volcano plots, a cone of half-width 12 and height 34 behind, its foot 38 px below the upper plot's top, and one of half-width 10 and height 14 in front;
    - for a lone volcano, half-width 12 and height 22;
    - each has a lava flow down to the shore, steam and a smoke plume.
  - Register it and add the drawing.
- [ ] **Step 4:** Run the three files, then `npm run art`. Expected: PASS, and only `capital-relief/archipelago.svg` is new.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: draw the Archipelago's sea and volcanic islands"`.

### Task 8: The Cloud City relief

**Files:**
- Create: `tools/art/parts/capital-relief/cloud-city.js`
- Create: `tools/art/drawings/capital-relief/cloud-city.js`
- Modify: `index.js` and `relief.js` (`'cloud-city'`)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Consumes `mat.clouds`, `mat.tints` and the `cloud*` tones (Task 2).
- Produces `paintCloudCity(canvas, fp, seed, mat)`.
- The drawing passes `matData('cloud-city')`.

- [ ] **Step 1: Write the failing tests**
  - `each Cloud City puff takes the tint of one cloud`:
    - in the mat relief, every pixel in a tint's cloud ramp (white, light, base, dark, rim) belongs to a tint that some impassable plot's cloud has;
    - every such tint appears.
    - A test-only helper paints one puff of radius 6 centred on the 5,6 corner join's gap pixel, where two clouds meet. Every pixel it paints is in the ramp of the tint at its centre (Review Focus 5).
  - `Cloud City's pillars are stone with pines on top`: the mat relief has `stoneLight` and `pine` pixels.
- [ ] **Step 2:** Run the relief tests. Expected: FAIL.
- [ ] **Step 3: Port `paintCloudPeaks` from the spike, as `paintCloudCity`**
  - pillars on a 17 × 17 jittered grid, one in five skipped, of half-width 5 to 9 and 24 to 42 tall, with a lean of up to ±1.5;
  - each has a grassy summit with one or two pines, and an outline on its upper 80%;
  - puffs on a 7 × 6 jittered grid, each of radius `min(room − 1, 3 + 6 × rand)`, clamped to 3 to 9;
  - only the bank's outside is outlined;
  - puffs in front of a pillar's foot are drawn after it;
  - a pillar and puffs over each corner join.
  - Export the puff painter so the test can call it.
  - Register it and add the drawing.
- [ ] **Step 4:** Run the relief and build tests, then `npm run art`. Expected: PASS, and only `capital-relief/cloud-city.svg` is new.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: draw Cloud City's stone pillars rising out of cloud"`.

### Task 9: The features pictures

**Files:**
- Create: `tools/art/parts/capital-feature/index.js`, `canyon.js`, `swamp.js`, `archipelago.js` and `cloud-city.js`
- Create: `tools/art/drawings/capital-feature/archipelago.js`, `canyon.js`, `cloud-city.js` and `swamp.js`
- Modify: `src/lib/art/relief.js` (`FEATURE_BIOMES`)
- Modify: `src/lib/art/catalog.js` (the `capital-feature` group)
- Modify: `tools/art/build.mjs` (its size check)
- Modify: `tools/art/parts/capital-relief/index.js` (the preview stacks features)
- Test: create `tests/art-capital-feature.test.mjs`; modify `tests/art-catalog.test.mjs`, `tests/art-build.test.mjs` and `tests/art-capital-relief.test.mjs`

**Interfaces:**
- **In `src/lib/art/relief.js`:** `FEATURE_BIOMES = Object.freeze(['archipelago', 'canyon', 'cloud-city', 'swamp'])`.
- **In `capital-feature/index.js`:**
  - `FeaturePainter = (canvas, layout: readonly string[], mat: MatData) => void`;
  - `FEATURE_PAINTERS`, frozen, keyed in `FEATURE_BIOMES` order;
  - `drawFeatures(layout, biome, mat = {}) → Canvas`: transparent and `reliefSize` of the layout. It throws `No features for <biome>` for any other biome.
- **The painters:**
  - Canyon: one saguaro on each `'C'` plot, its shadow as `shadow()` ink;
  - Swamp: one lily pond on each `'L'` plot;
  - Archipelago: the beaches on island plots, from the spike's `drawBeaches`, with `mat.volcanoes` counted as land;
  - Cloud City: the scalloped rims from the spike's `drawCloudRims`, with the PITCH offsets.
- **The catalog:**
  - the group `{ id: 'capital-feature', label: 'Capital features', kind: 'board', issue: 132 }`, after `capital-relief`;
  - its list `aa: [['archipelago', 'Archipelago features'], ['canyon', 'Canyon features'], ['cloud-city', 'Cloud City features'], ['swamp', 'Swamp features']]`.
- **The build:** `checkCapitalRelief` also checks `capital-feature/*` against `matLayout`, with the error text `a capital feature picture must be W×H`.
- **The preview:** `drawReliefPreview` stacks ground, then `drawFeatures` (for a biome in `FEATURE_BIOMES`), then the relief. Each layer is laid with `overlay`.

- [ ] **Step 1: Write the failing tests** in `art-capital-feature.test.mjs`. For each of the four, on its mat:
  - `<biome>: the features picture is its mat's size, deterministic, in palette colours with ink only below full opacity`.
  - `canyon: a saguaro stands on each C plot and nowhere else`. Every painted pixel lies inside the 32×32 square of a `'C'` plot, and each of the six squares has at least 40 painted pixels (Review Focus 4).
  - `swamp: a lily pond lies on each L plot and nowhere else`, the same way, with at least 150 pixels per square.
  - `archipelago: beaches lie only on island plots, along the sides and corners that face water`. Every painted pixel is on a `'.'` plot and within 5 px of an edge or corner shared with a water plot, a volcano not counting as water. Every island side that faces water has at least 20 painted pixels.
  - `cloud-city: rims lie only along the edges between two clouds`. Every painted pixel is within 3 px of a plot edge whose two plots have different `CLOUDS` digits.
- [ ] **Step 2: Write the failing tests** for the other files:
  - `drawFeatures refuses a biome without features`: `/No features for mesa/`.
  - In `art-catalog.test.mjs`:
    - `EXPECTED_COUNTS` gains `'capital-feature': { aa: 4 }`, inserted after `capital-relief`;
    - the totals test becomes `294 illustrations, 290 icons and 100 boards`;
    - `the expansion reliefs belong to #132 and #133` gains `capital-feature/* belong to #132`.
  - In `art-build.test.mjs`, a 296×296 `capital-feature/archipelago` throws `/must be 296×362/`.
  - In `art-capital-relief.test.mjs`, `a preview stacks the features under the relief`: on `drawReliefPreview(matLayout('canyon'), 'canyon', 0, matData('canyon'))`, the middle pixel of plot 1,1 (a cactus plot) is a `pine*` colour.
- [ ] **Step 3:** Run the four files. Expected: FAIL.
- [ ] **Step 4:** Implement the interfaces, port the four painters and add the four drawings.
- [ ] **Step 5:** Run the four files and `npm run art`. Expected: PASS. Four `static/art/capital-feature/*.svg` are new, and nothing else changes.
- [ ] **Step 6:** Commit: `git commit -m "Refs #132: draw the cacti, lily ponds, beaches and cloud rims as features pictures"`.

### Task 10: Show the six in the library, then ask the owner

**Files:**
- Modify: `src/library/art.js` (`RELIEF_SPECIMENS` and the section notes)
- Test: `tests/library-art.test.mjs`

**Interfaces:**
- `RELIEF_SPECIMENS` covers all 12 `RELIEF_BIOMES`. Each is drawn with `drawReliefPreview(SPECIMEN_LAYOUT, biome, 0, SPECIMEN_DATA[biome] ?? {})`.
- Its label uses the base mat's name, or else the catalog name of `capital-relief/<biome>` without ` relief`. An example is `Cloud City: a lone plot, side and corner joins, an L, a 2×2`.

- [ ] **Step 1: Write the failing tests**
  - `RELIEF_SPECIMENS has one specimen per relief biome`:
    - there are 12 labels;
    - the Cloud City label starts with `Cloud City:`;
    - each `size` is `{ w: 296, h: 296 }`.
  - `a relief picture is its preview on the mat's ground`: `await loadPicture('capital-relief/swamp')` gives a picture with no transparent pixel.
- [ ] **Step 2:** Run `npx vitest run tests/library-art.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Implement the specimens. The Capital mats note still says the expansion examples stay until #132 and #133.
- [ ] **Step 4:** Run `npm test` (the full suite, with Playwright). Expected: PASS.
- [ ] **Step 5:** Commit: `git commit -m "Refs #132: show the six reliefs and their specimens in the library"`.
- [ ] **Step 6: Stop for the owner**
  - Run `npm run dev` and give the owner `http://127.0.0.1:5173/components.html`, Art → Capital relief and Capital features.
  - Ask them to approve each of the six biomes, and record their answer in the spec.
  - If they ask for changes, make them in the task that owns the biome, re-run its tests and `npm run art`, and ask again. Don't start Task 11 until all six are approved.

### Task 11: Release the approved six

**Files:**
- Modify: `src/lib/art/catalog.js`:
  - the `aa` terrain tiles become `<slug>-open-01`…`-08` for the five biomes, and `cloud-city-<tint>-open-01`…`-08` for the four tints;
  - `capital-mat` loses its `aa` list.
- Modify: `tools/art/drawings/capital-terrain/`:
  - redraw the five biomes' `-open-0N.js` with `drawNaturalGround`;
  - delete `cloud-city-open-0N.js` and every `<aa biome>-blocked-0N.js`;
  - add the 32 `cloud-city-<tint>-open-0N.js`, each `drawNaturalGround(canvas, { biome: 'cloud-city-<tint>', variant: N − 1 })`.
- Delete: `tools/art/drawings/capital-mat/{archipelago,canyon,cavern,cloud-city,mesa,swamp}.js`.
- Modify: `tools/art/parts/capital-biomes/{archipelago,canyon,cavern,cloud-city,mesa,swamp}.js`:
  - keep `LAYOUT`, `FEATURES`, `VOLCANOES`, `CLOUDS`, `CLOUD_TINTS` and `CLOUD_TINT_NAMES`;
  - delete the tile and example-mat code;
  - `FEATURES.pools.blocked` and `special` become `[]`;
  - each `matOnly.where` names the picture that now draws it (`capital-feature/<slug>`, or for the tints, the `cloud-city-<tint>-open-*` tiles picked by `CLOUD_TINTS[CLOUDS[row][col]]`).
- Modify: `tools/art/parts/capital-biomes/index.js` (`BiomeModule`'s `drawBiomeTile` and `drawBiomeMat` become optional, as only the Fantasies & Futures six keep them until #133).
- Modify: `src/library/art.js` (the Capital mats note: the Arts & Architecture examples retired in #132).
- Modify: `docs/art/approved-assets.json`: the six reliefs, the four features pictures and the 72 ground tiles, each recomputed from `renderAsset(id)` (`docs/art/README.md`, "Approved assets").
- Test:
  - `tests/art-catalog.test.mjs`;
  - `tests/art-approved.test.mjs`;
  - `tests/art-capital-features.test.mjs`;
  - the six `tests/art-capital-<aa biome>.test.mjs`;
  - `tests/art-capital-terrain.test.mjs`.
- Docs:
  - `docs/status.md`: the summary, and #132's entry with the hand-off to #36;
  - `docs/architecture.md`;
  - `docs/art/README.md`: the toolkit table, `RELIEF_BIOMES`, `FEATURE_BIOMES`, and the retired examples.

- [ ] **Step 1: Write the failing tests**
  - `EXPECTED_COUNTS`:
    - `'capital-mat': { ff: 6 }`;
    - `'capital-terrain': { base: 48, aa: 72, ff: 84 }`;
    - the totals become `294 illustrations, 278 icons and 94 boards`.
  - `art-approved.test.mjs`: the example test expects six `capital-mat` assets, and the released count grows by 82 (6 + 4 + 72).
  - `art-capital-terrain.test.mjs`: `every Arts & Architecture biome has a relief, so none keeps impassable tiles of its own`, the same way as the base biomes. Also `Cloud City's 32 buildable plots are natural ground in its four tints`.
  - The six `art-capital-<biome>.test.mjs` keep only their layout tests: `the layout equals the research grid`, and for Cloud City, its 22 impassable plots and 9 clouds.
- [ ] **Step 2:** Run those files. Expected: FAIL.
- [ ] **Step 3:** Make the catalog, drawing, module and note changes above, then run `npm run art`. It removes the SVGs whose drawing is gone.
- [ ] **Step 4:** Recompute the 82 manifest entries from `renderAsset`.
- [ ] **Step 5:** Run `npm run check && npm test`. Expected: 0 errors and 0 warnings, and every test passes.
- [ ] **Step 6:** Write the docs. Post a comment on #36 listing what it now does, from the spec's §4.5:
  - the advanced biomes in `CapitalBiome`;
  - their layouts in `plotTerrain`;
  - `featureUrl(biome)` between the ground and the relief, `null` for Cavern and Mesa;
  - Cloud City's ground picked by tint;
  - the Archipelago's 11 rows.

  Tick #132's checklist on GitHub.
- [ ] **Step 7:** Commit: `git commit -m "Fix #132: release the joined 2.5D terrain of the Arts & Architecture mats"`.
