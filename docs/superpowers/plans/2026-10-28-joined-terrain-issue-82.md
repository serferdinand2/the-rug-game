# Joined impassable terrain, batch 1 (#82) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw each group of impassable plots on the six base mats as one 2.5D relief picture over redrawn, natural ground, and show it in `CapitalGrid` everywhere a capital appears. Mountain and Forest come first (Tasks 1–8), then Wetland, Tropical, Desert and Grassland (Tasks 9–12). The owner approves all six in the library before Task 13 releases them. Scope: the owner asked on 2026-10-28 for "just the base game for now"; the expansion mats are #132 and #133.

**Architecture:** The art toolkit gains `tools/art/parts/capital-relief/`. It works out each mat's footprint from its printed layout, packs peaks or trees into it, and draws one transparent relief SVG per mat (`capital-relief/<mat id>`) at build time. `CapitalGrid` lays that picture over its per-plot ground tiles, with a proportional gap so the plots line up with the relief's pixels. Everything before Task 13 is additive and leaves the owner-approved assets' pixels and the approval manifest untouched. Task 13 runs only after the owner approves the batch in the library.

**Tech Stack:** Plain JS ES modules with JSDoc, the toolkit's painter (`tools/art/painter.js`), Svelte 5 runes, Vitest with `node:assert/strict`, and Playwright in Chromium.

**Spec:** `docs/superpowers/specs/2026-10-28-joined-terrain-design.md`. The approved look is `docs/art/issue-82/approved-spike.png`, and its algorithms are in `docs/art/issue-82/spike.mjs`: `footprint`, `reach`, `naturalGround`, `drawFloor`, `peakShape`, `drawPeak`, `hillShape`, `drawHill`, `drawMountains`, `broadleaf`, `pine` and `drawForest`. Port them; don't import the spike.

## Global Constraints

- Work in `/Users/ognjenugljenovic/Work/the_rug_game-82` on branch `issue-82-joined-terrain`. Every commit says `Refs #82: …` and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Follow `docs/conventions.md`. Each file starts with a one-line comment. Exported functions and types have JSDoc. Prettier (tabs, single quotes) and braces on every `if`/`else`. `npm run check` reports 0 errors and 0 warnings.
- `src/lib/` never imports `tools/art/`; only `src/library/` may. The toolkit may import `src/lib/art/` and `src/lib/engine/data/`.
- Randomness only through `seededRandom` from `tools/art/painter.js`, seeded from fixed numbers. Never use `Math.random()`.
- Relief parts paint only `PALETTE` colours. Shadows are `PALETTE.ink` with a per-pixel opacity in `canvas.alpha`, painted only on empty pixels.
- **Geometry:** plots are 32 px with a 1-px gap, a pitch of 33, so a layout of R rows and C columns gives a relief of `(C × 33 − 1) × (R × 33 − 1)`: 296×296 for a base mat. The ground margin on an open side is 2 px. The outer corner radius is 8. The saddle half-width is 6. The corner patch is a radius of 16 px around a corner join's gap pixel.
- **Layouts:** a base mat's layout is `CAPITAL_MATS[i].grid`, with `'1'` for impassable and `'0'` for buildable. A plot counts as impassable when its character is `'1'` or `'X'`, so the advanced `LAYOUT`s work in later batches.
- **Until Task 13:** don't change the pixels of any asset in `docs/art/approved-assets.json` or the manifest itself. That means the `capital-terrain/*` tiles and the `capital-mat/*` examples.
- The branch merges only after the owner approves the batch in the library. The README screenshots are retaken in Task 13, the batch's last commit before the merge.

## Review Focus

1. **A building, preview or cube on a buildable plot inside a corner patch must draw above the relief,** and the district dashes must stay visible over it. Task 8's browser test checks the computed z-indices.
2. **A landmark hanging over the edge (R106) must still line up with the plots** once the gap is proportional. Task 8's browser test measures the library's overhanging Lighthouse.
3. **A mat on offer at setup (#56) must show its relief at the shelf's smaller size.** Task 8's browser test checks the CardShelf `kind="mat"` example's Mountain mat.
4. **Clicks must reach target plots through the relief.** Task 8's browser test checks that the relief has `pointer-events: none` and that a target under a corner patch is still the element at its centre.
5. **A cube or a terraformed plot on a biome without a relief** (Wetland, Tropical, Desert or Grassland, until Tasks 9–12 add theirs) must still draw: a cube piece on open ground, and a terraformed plot as an ordinary built plot. Task 7's unit tests cover it.

---

### Task 1: The footprint of a layout

**Files:**
- Create: `src/lib/art/relief.js`
- Create: `tools/art/parts/capital-relief/footprint.js`
- Modify: `tools/art/parts/capital-terrain.js` (`CAPITAL_GRIDS` comes from the engine)
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Produces, in `src/lib/art/relief.js`:
  - `RELIEF_BIOMES`: frozen `['mountain', 'forest']`. Tasks 9–12 add the other four base biomes.
  - `PLOT = 32`, `GAP = 1`, `PITCH = 33`.
  - `reliefSize(rows: number, cols: number) → { w: number, h: number }`.
- Produces, in `footprint.js`:
  - `isImpassable(layout: readonly string[], row: number, col: number) → boolean`. False off the layout.
  - `impassableGroups(layout) → number[][]`: 8-connected groups of `row * cols + col` indexes, each sorted, in order of each group's first index.
  - `footprint(layout) → Footprint`, where `Footprint = { rows, cols, w, h, mask: Uint8Array, plots: Uint8Array, reach: Uint8Array, corners: CornerJoin[] }`, and `CornerJoin = { row, col, gx, gy, down: boolean }`:
    - `(row, col)` is the 2×2 block's top-left plot, and `gx = (col + 1) * 33 − 1`, `gy = (row + 1) * 33 − 1` is its gap pixel. `down` is true when the top-left and bottom-right plots are the impassable pair.
    - `mask` is where a group's floor lies: the spike's `footprint().mask`.
    - `plots` is every pixel of an impassable plot, plus the gap pixels between joined plots: the spike's `reach(…, false)`.
    - `reach` is `plots` plus each corner patch.
- `CAPITAL_GRIDS` keeps its name and shape, but is built from `CAPITAL_MATS` (`id → grid`).

- [ ] **Step 1: Write the failing tests**

```js
const SPECIMEN = ['000000000', '010011000', '000000000', '010000100', '001001000', '000000000', '011000110', '010000110', '000000000'];

test('impassable plots that touch by a side or a corner are one group', () => {
	assert.deepEqual(
		impassableGroups(SPECIMEN).map((g) => g.length),
		[1, 2, 2, 2, 3, 4]
	);
});

test('each base mat has the groups and corner joins its layout gives', () => {
	const expected = {
		mountain: [[13, 4, 2, 1, 1, 1], 0],
		wetland: [[8, 4, 3, 2, 2, 2, 1], 1],
		tropical: [[11, 5, 3, 1, 1, 1], 4],
		desert: [[10, 3, 3, 2, 2, 1, 1], 1],
		grassland: [[15, 4, 2, 1], 1],
		forest: [[19, 3], 6],
	};
	for (const mat of CAPITAL_MATS) {
		const [sizes, corners] = expected[mat.id];
		assert.deepEqual(impassableGroups(mat.grid).map((g) => g.length).sort((a, b) => b - a), sizes, mat.id);
		assert.equal(footprint(mat.grid).corners.length, corners, mat.id);
	}
});

test('a corner-only join is found on both diagonals', () => {
	assert.deepEqual(footprint(SPECIMEN).corners, [
		{ row: 3, col: 1, gx: 65, gy: 131, down: true },
		{ row: 3, col: 5, gx: 197, gy: 131, down: false },
	]);
});

test('a lone plot keeps a ground margin; joined plots run across their gap', () => {
	const fp = footprint(SPECIMEN);
	const at = (x, y) => fp.mask[y * fp.w + x];
	assert.equal(at(33 + 16, 33 + 16), 1); // the lone plot's middle
	assert.equal(at(33 + 0, 33 + 16), 0); // its open side's margin
	assert.equal(at(5 * 33 - 1, 33 + 16), 1); // the gap inside the side pair
	assert.equal(at(2 * 33 - 1, 33 + 16), 0); // the gap beside the lone plot
});

test('nothing reaches a buildable plot except within a corner patch', () => {
	for (const layout of [SPECIMEN, ...CAPITAL_MATS.map((m) => m.grid)]) {
		const fp = footprint(layout);
		for (let y = 0; y < fp.h; y++) {
			for (let x = 0; x < fp.w; x++) {
				const onPlot = x % 33 < 32 && y % 33 < 32;
				const open = onPlot && !isImpassable(layout, Math.floor(y / 33), Math.floor(x / 33));
				if (open && (fp.mask[y * fp.w + x] || fp.reach[y * fp.w + x])) {
					assert.ok(fp.corners.some((c) => Math.hypot(x - c.gx, y - c.gy) <= 16), `${x},${y}`);
				}
				if (open) {
					assert.equal(fp.plots[y * fp.w + x], 0, `${x},${y}`);
				}
			}
		}
	}
});

test('the toolkit reads the base layouts from the engine', () => {
	for (const mat of CAPITAL_MATS) {
		assert.deepEqual(CAPITAL_GRIDS[mat.id], mat.grid);
	}
	assert.deepEqual(reliefSize(9, 9), { w: 296, h: 296 });
	assert.deepEqual(reliefSize(11, 9), { w: 296, h: 362 });
});
```

- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: FAIL, because the modules don't exist.
- [ ] **Step 3: Implement** `relief.js`, `footprint.js` and the `CAPITAL_GRIDS` change, porting the spike's `shape`, `inShape`, `footprint` and `reach`. Make the layout's size the layout's own rather than a constant 9.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run tests/art-capital-relief.test.mjs tests/art-capital-terrain.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** with `Refs #82: work out the joined footprint of a mat's impassable plots`.

### Task 2: Natural ground and the alpine palette

**Files:**
- Modify: `tools/art/palette.js`. Add an "Alpine meadow (#82)" block: `alpineMeadow '#8e9c63'`, `alpineMeadowLight '#a7b69a'`, `alpineMeadowPale '#cbd2b0'`, `alpineMeadowShade '#707046'`, `alpineMeadowDeep '#5a5a3a'`, `alpineMeadowDark '#434330'` and `alpineMoss '#86a03f'`.
- Create: `tools/art/parts/capital-relief/ground.js`
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Produces `drawNaturalGround(canvas, { biome: 'mountain' | 'forest', variant: number, x?: number, y?: number }) → void`. It paints one 32×32 plot at `(x, y)`, following the spike's `naturalGround`:
  - **Mountain:** the base is `alpineMeadow`, the light tone `alpineMeadowLight` and the dark tone `alpineMeadowShade`, plus grey pebbles, tufts of `alpineMeadowDeep` and `alpineMoss`, and a few `cream` or `alpineMeadowDark` dots.
  - **Forest:** the base is `grass`, the light tone `grassLight` and the dark tone `grassShade`, plus tufts, `cream` and `gold` flowers, and `forestFloor` specks.
  - The noise is seeded from the biome and the variant. Variants 0–7.
  - It doesn't change `drawCapitalTile` yet. Task 13 switches the game's tiles over.

- [ ] **Step 1: Write the failing tests.**
  - `the natural ground fills its plot deterministically in palette colours`: for each biome and each variant 0–7, the plot's pixels are all set, two draws are deep-equal, and every colour is in `PALETTE`.
  - `its eight variants differ`: there are 8 distinct `toSvg` strings per biome.
  - `the approved buildable tiles are unchanged`: `drawTile('mountain', false, 0)` still hashes to its manifest entry. The existing `tests/art-approved.test.mjs` covers this, so just run it.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: FAIL, because `drawNaturalGround` is missing.
- [ ] **Step 3: Implement** `ground.js` and the palette block.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run tests/art-capital-relief.test.mjs tests/art-approved.test.mjs tests/art-parts.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** with `Refs #82: draw natural buildable ground for the mountain and forest mats`.

### Task 3: Mountains

**Files:**
- Create: `tools/art/parts/capital-relief/canvas.js`
- Create: `tools/art/parts/capital-relief/mountain.js`
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Consumes `Footprint` from Task 1.
- Produces, in `canvas.js`:
  - `put(canvas, allowed: Uint8Array, x, y, colour) → void`: paints only where `allowed` is set.
  - `shadow(canvas, x, y, alpha: number) → void`: paints `PALETTE.ink` with `canvas.alpha[i] = alpha` on an empty pixel. It creates `canvas.alpha`, filled with 1, the first time.
- Produces, in `mountain.js`, `paintMountains(canvas, fp: Footprint, seed: number) → void`. It ports the spike's `drawMountains` with its `peakShape`, `drawPeak`, `hillShape`, `drawHill` and `drawFloor`:
  - the floor uses `alpineMeadowShade` and `alpineMeadowDeep`, with a few `stoneMid`;
  - the lower slopes and the foothills use the alpine colours;
  - foot shadows use `shadow(…, 0.3)` instead of `mix`.
  - The ground is not drawn: the canvas starts empty.
  - Corner peaks (`hw 11, ph 18`, base at `gy + 10`) and corner foothills may use `fp.reach`. Every other peak and foothill uses `fp.plots`.

- [ ] **Step 1: Write the failing tests.** Paint on `createCanvas(fp.w, fp.h)`.
  - `mountains are deterministic and stay within the reach`: two paints of the Mountain mat are equal, and no pixel is set where `fp.reach` is 0.
  - `every impassable plot's middle is mountain`: for each impassable plot of the Mountain mat and of `SPECIMEN`, at least 60% of its middle 16×16 pixels are set and opaque.
  - `mountains use palette colours, and ink only for shadows below full opacity`: every set pixel's colour is in `PALETTE`, and every pixel with `alpha < 1` is `PALETTE.ink`.
  - `a corner-only join stands a peak over the corner`: on `SPECIMEN`, the pixel at each corner's `(gx, gy − 4)` is set and opaque.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `canvas.js` and `mountain.js`.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** with `Refs #82: pack 2.5D peaks and foothills into a mountain footprint`.

### Task 4: Forests

**Files:**
- Create: `tools/art/parts/capital-relief/forest.js`
- Test: `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Consumes `Footprint`, `put` and `shadow`.
- Produces `paintForest(canvas, fp: Footprint, seed: number) → void`, porting the spike's `drawForest`, `broadleaf`, `pine` and `drawFloor`:
  - the floor is `forestFloor` and `forestFloorShade`;
  - tree shadows use `shadow(…, 0.25)`;
  - each corner gets the spike's clump of eight trees, which may use `fp.reach`;
  - every other tree must fit `fp.plots`.

- [ ] **Step 1: Write the failing tests:** the same four as Task 3, on the Forest mat and `SPECIMEN`. The corner test checks that `(gx, gy)` is set and opaque.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `forest.js`.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** with `Refs #82: pack trees into a forest footprint`.

### Task 5: Relief assets, previews and the library

**Files:**
- Create: `tools/art/parts/capital-relief/index.js`
- Modify: `tools/art/painter.js` (add `overlay`)
- Create: `tools/art/drawings/capital-relief/mountain.js` and `forest.js`
- Modify: `src/lib/art/catalog.js`:
  - add the group `{ id: 'capital-relief', label: 'Capital relief', kind: 'board', issue: 82 }` right after `capital-terrain`;
  - add its list: base, the six base mats, named such as `'Mountain relief'`; `aa: ADVANCED_MATS.aa` and `ff: ADVANCED_MATS.ff`, renamed the same way.
- Modify: `tools/art/build.mjs`: a `capital-relief` drawing must be `reliefSize` of its mat's layout.
- Modify: `src/library/art.js` and `src/library/Library.svelte`
- Test: `tests/art-capital-relief.test.mjs`, `tests/art-catalog.test.mjs`, `tests/art-build.test.mjs`

**Interfaces:**
- Produces, in `painter.js`, `overlay(base: Canvas, top: Canvas) → void`. It paints `top` onto `base`: an opaque pixel replaces, and a pixel with `alpha < 1` becomes `mix(base, top, alpha)`. Same size only, or it throws.
- Produces, in `index.js`:
  - `RELIEF_PAINTERS: Readonly<Record<string, (canvas, fp, seed) => void>>`, holding `{ mountain: paintMountains, forest: paintForest }`.
  - `SPECIMEN_LAYOUT`: the `SPECIMEN` above, frozen.
  - `drawRelief(layout, biome) → Canvas`: a transparent canvas of `reliefSize`, painted with seed 5. It throws `Error('No relief for <biome>')` for a biome without a painter.
  - `drawReliefPreview(layout, biome, seed = 0) → Canvas`: the composed picture. Ink gaps, `drawNaturalGround` on every plot (variant `hash(row, col, seed) % 8`, with the spike's `hash` kept local to `index.js`), the ground copied across the gaps inside groups as the spike's `naturalGround` does, then `overlay` of `drawRelief`.
- Drawing `capital-relief/<mat>.js`: `draw()` returns `drawRelief(CAPITAL_GRIDS[mat], mat)`.
- Library:
  - In `art.js`, `PICTURES` shows each drawn `capital-relief/*` id as `drawReliefPreview` of its mat, so the owner sees it on its ground.
  - New export `RELIEF_SPECIMENS: { label: string, picture: Picture }[]`: one `drawReliefPreview(SPECIMEN_LAYOUT, biome)` per `RELIEF_BIOMES`, labelled such as `'Mountain: a lone plot, side and corner joins, an L, a 2×2'`.
  - `Library.svelte` shows the specimens under the `capital-relief` section's tiles.
  - `artDescription('capital-relief')` says each mat's impassable plots are one relief drawn from its layout over per-plot ground, and that the owner approves each batch here.
  - `artDescription('capital-mat')` drops "generated from reusable terrain tiles" and says the examples compose ground tiles and the relief.

- [ ] **Step 1: Write the failing tests.**
  - `the relief of a mat is its size and stays within its reach`: for mountain and forest, `drawRelief(grid, id)` is 296×296, and every set pixel has `footprint(grid).reach` set.
  - `a biome without a painter has no relief`: `assert.throws(() => drawRelief(CAPITAL_GRIDS.wetland, 'wetland'), /No relief for wetland/)`.
  - `a preview is opaque everywhere`: every pixel of `drawReliefPreview(SPECIMEN_LAYOUT, 'forest')` is set.
  - `overlay blends a shadow and replaces an opaque pixel`: a 2×1 base of `PALETTE.grass`, a top with ink at alpha 0.5 and `PALETTE.snow` at alpha 1. The result is `[mix(grass, ink, 0.5), snow]`.
  - In `art-catalog.test.mjs`, `EXPECTED_COUNTS` gains `'capital-relief': { base: 6, aa: 6, ff: 6 }`, and `there are … boards` rises by 18 to 102.
  - The build check: a `capital-relief` drawing of the wrong size makes `buildArt` throw a message containing `must be 296×296`. Write a fixture drawing in a temporary `drawingsDir`, as the existing `buildArt` tests do.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art-capital-relief.test.mjs tests/art-catalog.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** the code, then run `npm run art`, which writes `static/art/capital-relief/mountain.svg` and `forest.svg`.
- [ ] **Step 4: Run the tests and see them pass.** Run `npm run test:unit` and `npm run check`. Expected: all pass, with 0 errors and 0 warnings. `tests/art-approved.test.mjs` still passes, because no approved pixel changed.
- [ ] **Step 5: Commit** the drawings, the SVGs and the code, with `Refs #82: draw the mountain and forest reliefs and show them in the library`.

### Task 6: The Architects' cube piece

**Files:**
- Create: `tools/art/drawings/piece/architects-cube.js`
- Modify: `src/lib/art/catalog.js` (`piece` base gains `['architects-cube', "Architects' cube"]`)
- Test: `tests/art-catalog.test.mjs` (`piece: { base: 19 }`, and icons rise by 1 to 318), `tests/art-capital-relief.test.mjs`

**Interfaces:**
- Produces asset `piece/architects-cube`: a 32×32 neutral stone block in the same 2.5D view as the relief. It has a lit top in `stoneLight` and `snowShade`, a lit left face in `stone`, a shaded right face in `stoneShade` and `roofShade`, an ink outline, and an ink shadow at alpha 0.3 to its right. It sits in the plot's middle, about 18 px across, with a transparent background and palette colours only.

- [ ] **Step 1: Write the failing test.** `the Architects' cube is a 32×32 piece in palette colours with a transparent edge`: its border pixels are empty, its middle is set, and its colours are all in `PALETTE`.
- [ ] **Step 2: Run it and see it fail.** Run `npx vitest run tests/art-capital-relief.test.mjs tests/art-catalog.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Draw it,** then run `npm run art`.
- [ ] **Step 4: Run the tests and see them pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `Refs #82: draw the Architects' cube piece`.

### Task 7: What each plot shows

**Files:**
- Create: `src/lib/capital-terrain.js`
- Test: `tests/client-capital-terrain.test.mjs`

**Interfaces:**
- Consumes `RELIEF_BIOMES` from `src/lib/art/relief.js`, `CAPITAL_MATS`, and `artUrl` and `capitalTileUrl` from `src/lib/ui.js`.
- Produces:
  - `reliefUrl(biome: string) → string | null`: `artUrl('capital-relief/<biome>')` when the biome is in `RELIEF_BIOMES`, otherwise null.
  - `plotTerrain(plots: PlotKind[], biome: string, seed: number) → PlotTerrain[]`, where `PlotTerrain = { ground: string, cleared: boolean, cube: boolean }`:
    - `printed(i)` is true when the biome's mat has `'1'` at plot `i`. With no mat, it is true when `plots[i] === 'blocked'`.
    - `cube` is `plots[i] === 'blocked' && !printed(i)`.
    - `cleared` is `printed(i) && plots[i] !== 'blocked' && reliefUrl(biome) !== null`.
    - `ground` is `capitalTileUrl(biome, plots[i] === 'blocked' && printed(i) && !reliefUrl(biome), i, seed)`.

- [ ] **Step 1: Write the failing tests.**
  - `a relief mat draws every plot on open ground`: on `matPlots(1)` with biome `'mountain'`, every `ground` matches `/mountain-open-0[1-8]\.svg$/`, and no plot is cleared or a cube.
  - `a terraformed plot is cleared`: on the Mountain plots with plot 9 (row 1, column 0, impassable on mat 1) set to `'farm'`, plot 9 has `cleared: true`.
  - `an Architects' cube is a cube on open ground`: on the Mountain plots with plot 0 set to `'blocked'`, plot 0 has `cube: true` and open ground.
  - `a mat without a relief keeps its impassable tiles, and its cubes are cubes`: on `matPlots(2)` with biome `'wetland'`, the printed plots match `/wetland-blocked-0[1-6]\.svg$/`. A cube on plot 0 is `cube: true` with open ground. `reliefUrl('wetland')` is null.
  - `reliefUrl names the relief`: `reliefUrl('forest') === '/art/capital-relief/forest.svg'`.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/client-capital-terrain.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `src/lib/capital-terrain.js`.
- [ ] **Step 4: Run the tests and see them pass.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** with `Refs #82: decide each capital plot's ground, clearing and cube`.

### Task 8: CapitalGrid draws the relief

**Files:**
- Modify: `src/lib/components/player/CapitalGrid.svelte`
- Modify: `src/library/sections/player/CapitalGrid.svelte`
- Modify: `src/lib/components/README.md` (the CapitalGrid row)
- Test: `tests/browser/library.test.mjs`

**Interfaces:**
- Consumes `reliefUrl` and `plotTerrain` from Task 7, and `artUrl('piece/architects-cube')`.
- No prop changes.

Changes in `CapitalGrid.svelte`:
- `let terrain = $derived(plotTerrain(plots, biome, terrainSeed))` and `let relief = $derived(reliefUrl(biome))`.
- **Relief image:** `{#if relief}<img class="rg-capital-grid--relief" src={relief} alt="" aria-hidden="true" draggable="false" />{/if}` goes before the plots loop. It is `position: absolute`, covers the grid's content box exactly (inset by the padding `var(--space-3)` on every side), and has `z-index: 1`, `pointer-events: none` and `image-rendering: pixelated`.
- **The plot snippet:**
  - the ground `img` takes `src={terrain[index].ground}` and `class:rg-capital-grid--cleared={terrain[index].cleared}`;
  - a cube draws `<img class="rg-capital-grid--building" src={artUrl('piece/architects-cube')}>`.
- **Stacking:**
  - `.rg-capital-grid--cleared`, `.rg-capital-grid--building` and `.rg-capital-grid--preview` get `z-index: 1`. They come after the relief in the DOM, so they draw above it.
  - The grid's `::before` (the district dashes) gets `z-index: 2`.
  - `.rg-capital-grid--fresh` and `.rg-capital-grid--piece` get `z-index: 3`.
  - `.rg-capital-grid--overlay` gets `z-index: 4`.
- **Gap:** `gap: calc(100% / 296)`. Remove `--rg-capital-grid-gap`. `overhang(plots, span)` returns `calc(-${plots} * ${3300 / (33 * span - 1)}%)`, because one plot and its gap are 33 of the area's `33 × span − 1` units.
- **Remove** the `.rg-capital-grid--blocked` background and the `::after` red X.

Library section:
- The fixtures use real mats: build `YOURS`, `NEARLY` and `ANA` on `matPlots(1)` (Mountain), with every building and landmark moved onto open plots.
- Add examples:
  - `biome="forest"` on `matPlots(6)`, with a farm on a buildable plot inside a corner patch: plot 26 (row 2, column 8) sits beside the corner join at (2, 7).
  - `biome="mountain"` with an Architects' cube on plot 0 and a terraformed farm on plot 9.
- Update the file's first-line comment.

- [ ] **Step 1: Write the failing browser tests** in `tests/browser/library.test.mjs`. Find each example by its `<Example label>` text.
  - `a capital draws its relief over the ground, under the buildings and the district dashes (#82)`:
    - the Mountain example has `img[src$="/art/capital-relief/mountain.svg"]` visible, with computed `pointer-events` of `none` and `z-index` of `1`;
    - in the Forest example, the farm's `img` has computed `z-index` of `1` and comes after the relief in document order;
    - `getComputedStyle(grid, '::before').zIndex` is `'2'`;
    - no `.rg-capital-grid--blocked` element has an `::after` with `content` other than `none`.
  - `the plots line up with the relief: a proportional gap (#82)`: the gap between plot 0's and plot 1's boxes is within 0.5 px of `grid content width / 296`.
  - `a landmark over the edge still lines up with the plots (#82)`: in the `row 6, col -1` Lighthouse example, the piece's left edge is within 1 px of `plot 9 left − 1 × (plot width + gap)`.
  - `a mat on offer shows its relief (#82)`: the CardShelf `kind="mat"` example contains `img[src$="/art/capital-relief/mountain.svg"]`.
  - `a target under a corner patch still takes the click (#82)`: in an example where the Forest grid has targets, including plot 26, `document.elementFromPoint` at plot 26's centre is the target button or inside it.
- [ ] **Step 2: Run them and see them fail.** Run `npx playwright test tests/browser/library.test.mjs`. Expected: the new tests FAIL. Port 5173 must be free: stop any other dev server first, and say so if another session holds the port.
- [ ] **Step 3: Implement** the component and library changes.
- [ ] **Step 4: Run the tests and see them pass.** Run `npx playwright test tests/browser/library.test.mjs tests/browser/player-area.test.mjs tests/browser/setup-prompts.test.mjs`, then `npm run test:unit` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** with `Refs #82: CapitalGrid lays each mat's relief over its ground`.

### Tasks 9–12: Wetland, Tropical, Desert and Grassland

One task per biome, in this order: Task 9 Wetland, Task 10 Tropical, Task 11 Desert, Task 12 Grassland. Each follows the pattern of Tasks 2–5 and adds no new interface. There is no owner-approved sketch for these four biomes, so each implementer designs the look from the rules below. The controller renders it before the review, and the owner judges it at the checkpoint.

**Files (per biome `<b>`):**
- Modify: `tools/art/palette.js`. Add the biome's new colours in a commented block, only where `PALETTE` lacks a tone it needs.
- Modify: `tools/art/parts/capital-relief/ground.js`. Add `GROUNDS[<b>]`.
- Create: `tools/art/parts/capital-relief/<b>.js`, exporting `paint<B>(canvas, fp, seed)`.
- Modify: `tools/art/parts/capital-relief/index.js` (`RELIEF_PAINTERS`) and `src/lib/art/relief.js` (`RELIEF_BIOMES` gains `<b>`).
- Create: `tools/art/drawings/capital-relief/<b>.js`, then run `npm run art`.
- Test: `tests/art-capital-relief.test.mjs`. The ground tests and the relief tests loop over every biome in `RELIEF_BIOMES` (refactor the Task 2–5 tests to do so in Task 9), so each new biome is checked for:
  - deterministic output inside the reach;
  - every impassable plot's middle covered;
  - palette colours, with ink only below full opacity;
  - a piece over every corner-only join;
  - a 296×296 relief.

**The look (the owner's rules from #82):**
- 2.5D, seen from the front and above, with features packed back to front by the y of their base.
- A lone plot is one mass, and touching plots are one bigger mass.
- The mass grows out of the ground: the lower parts turn to ground colours, there is no ink outline at the foot, and there are low hills or banks on the sides.
- Every corner-only join gets its own piece, which may use `fp.reach`. Everything else fits `fp.plots`.
- Shadows follow Task 3's ruling: ink at partial opacity on empty pixels, one tone darker on painted ones.
- No stamped icons.

**The biomes:**

| Task | Biome | Its mass | Its ground (`GROUNDS`) |
|---|---|---|---|
| 9 | Wetland | Dark pools, with reflections, ringed by reed beds: clumps of reeds and cattails with brown heads, a few low bushes, and a muddy bank where it meets the meadow. A reed clump stands over each corner join. | A wet meadow: dark greens (`forestFloor` and `forestFloorShade`), with a few small puddles. |
| 10 | Tropical | Jungle: palms (a curved trunk under a fan of fronds) among big broadleaf crowns brighter than the Forest's, with vines and a few red flowers. A palm and a crown stand over each corner join. | Lush green (`pine` and `grass`), with ferns. |
| 11 | Desert | Sandstone outcrops: rounded boulders and small flat-topped buttes in `sand*`, `mesaRock*` and `mesaSoil*` tones, lit on the left, with sand dunes as the foothills. An outcrop stands over each corner join. | Sand (`sand`, `sandLight` and `sandShade`), with ripples. |
| 12 | Grassland | Rolling grassy hills topped with grey boulder tors: Task 3's hill shapes, scaled up, with `stone*` boulders on their crests. A tor stands over each corner join. | A warm meadow (`grass` and `grassLight`), with golden grass. |

- [ ] **Step 1: Write the failing tests:** add `<b>` to the looped lists, so the tests fail on the missing painter and ground.
- [ ] **Step 2: Run them and see them fail.** Run `npx vitest run tests/art-capital-relief.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** the ground, the painter, the registry and the drawing, then run `npm run art`. Only `static/art/capital-relief/<b>.svg` may be new.
- [ ] **Step 4: Run the tests and see them pass.** Run `npm run test:unit` and `npm run check`. Expected: all pass, with 0 errors and 0 warnings.
- [ ] **Step 5: Commit** with `Refs #82: draw the <Biome> relief and ground`.

### Checkpoint: the owner approves the six base mats

- [ ] Run `npm run dev` and screenshot the library at 1920×1080. Take the Art area's **Capital relief** section (the six previews and specimen sheets) and the CapitalGrid section's examples. Send them to the owner and ask them to review `/components.html#art-capital-relief`.
- [ ] **Stop.** Apply any changes the owner asks for and repeat. Go on to Task 13 only with the owner's approval.

### Task 13: Release the approved base mats

**Files:**
- Modify: `tools/art/parts/capital-terrain.js`:
  - `drawCapitalTile` draws open plots of a `RELIEF_BIOMES` biome with `drawNaturalGround`;
  - `drawCapitalMat` returns `drawReliefPreview(CAPITAL_GRIDS[biome], biome)`;
  - delete the obstacle code that nothing uses any more (`grep` first).
- Delete: `tools/art/drawings/capital-terrain/<biome>-blocked-0{1..6}.js` for all six base biomes (36 files).
- Modify: `src/lib/art/catalog.js` (remove those 36 entries), `tests/art-catalog.test.mjs` (`capital-terrain: { base: 48, … }`, icons down by 36 to 282), `tests/art-capital-terrain.test.mjs` (no blocked variants for the base biomes; the base example mats are 296×296), `tests/ui.test.mjs` (no `blocked` tiles for the base biomes)
- Modify: `docs/art/approved-assets.json`:
  - remove the 36 retired ids;
  - update `sha256` for the 48 base `*-open-*` tiles and the six `capital-mat/*` examples (with their new 296×296 size);
  - add the six `capital-relief/*` ids and `piece/architects-cube`.

  That makes 101 entries, and the test's count and name change to 101.
- Docs:
  - `README.md`: line 17's restatement of the old ruling, the "Current interface" text, and the screenshots `game-player-area.png`, `game-overview.png`, `game-prompt-capital-mat.png` and `opponent-capital.png`, retaken from the running game at 1920×1080.
  - `docs/ui/README.md`: the capital descriptions at lines 367 and 397 lose the red X and gain the relief.
  - `docs/art/README.md`: a `capital-relief/` row in the toolkit table, and the approval rule "the manifest is updated with the art on the issue branch, which merges only after the owner approves the batch".
  - `docs/architecture.md`: `src/lib/capital-terrain.js` and `tools/art/parts/capital-relief/`.
  - `docs/status.md`: a #82 entry, the summary, and #132, #133 and #134 as what follows.

- [ ] **Step 1: Update the tests first** (counts, the manifest, `ui.test.mjs`). Run `npm run test:unit`. Expected: FAIL, because the drawings haven't changed yet.
- [ ] **Step 2: Implement,** then run `npm run art`, which writes the new tiles and example mats and removes the 36 blocked SVGs.
- [ ] **Step 3: Run everything.** Run `npm test` and `npm run check`. Expected: all pass.
- [ ] **Step 4: Retake the screenshots and update the docs.**
- [ ] **Step 5: Commit** with `Fix #82: release the joined 2.5D terrain of the six base mats`, then ask the owner before merging into `main`.

### Task 14: The library draws its art only when it is needed

The owner asked on 2026-10-28: "let's optimize the library not to load everything up at once".

**What's wrong now**
- `src/library/art.js` imports every drawing module eagerly (`import.meta.glob('../../tools/art/drawings/**/*.js', { eager: true })`).
- It builds `PICTURES` by drawing every asset as the module loads: about 700, including every card, landmark and board. It also builds every scene-part sample (`PARTS`) and every relief preview and specimen (`RELIEF_SPECIMENS`).
- Together that is several seconds of synchronous work before the page can show anything. The Mountain relief alone takes about 0.6 s per draw. Under load, `page.goto` in the library's browser tests passes the 10 s limit.

**What to build**
- **Lazy modules:** `import.meta.glob(…)` without `eager`, so a drawing module is fetched only when its picture is wanted. The set of drawn ids comes from the glob's keys. `ART_SECTIONS` still knows which assets are drawn without loading any module.
- **Lazy pictures, drawn once:** export `loadPicture(id: string) → Promise<Picture>` from art.js. It loads the module and draws it, or for a `capital-relief/<slug>` id draws `drawReliefPreview(CAPITAL_GRIDS[slug], slug)`, as `PICTURES` does now. Memoize per id, so a second call returns the same promise. A failing drawing resolves to `{ error }`, as `safely` does now, and never rejects.
- **Parts and specimens:** `PARTS` and `RELIEF_SPECIMENS` become lists of `{ label, load: () => Promise<Picture> }`, each `load` memoized the same way.
- **Pictures in slices:** the drawing work runs through a small queue that draws one picture per slice and yields to the browser between slices (`requestIdleCallback` when it exists, else `setTimeout(…, 0)`). Scrolling into many tiles at once never freezes the page.
- **ArtTile:**
  - takes `load` (a `() => Promise<Picture>`) instead of `picture`, plus an optional `picture` for tests and callers that already have one;
  - starts loading only when it comes near the viewport (`IntersectionObserver` with a `rootMargin` of about one screen);
  - until the picture arrives, shows a placeholder of the right size where the size is known, and a plain placeholder otherwise. The slot doesn't jump when the picture lands, as far as possible.
  - An undrawn asset (no drawing) still shows its empty slot naming the issue, as now, with nothing loaded.
  - `data-drawn` means the asset has a drawing, which is known up front from the glob keys. Add `data-loaded="yes"` once the picture is in, so tests can wait for it.
- **Library.svelte** passes `load={() => loadPicture(tile.asset.id)}` and the parts' and specimens' `load`.
- **Everything else stays as it is:** the sections, their order, the anchors (`#art-…` links still jump to their section), the descriptions and the component examples. `npm run art` and the Node toolkit are untouched; this is the library page only.

**Tests (write them first)**
- **Vitest,** a new `tests/library-art.test.mjs`. Vitest runs Vite's `import.meta.glob`; if `art.js` can't be imported under Vitest, put the logic in a plain helper module in `src/library/` and test that instead.
  - `loadPicture('landmark/lighthouse')` resolves to a `{ url, w: 64, h: 64 }` picture.
  - Two calls for one id return the same promise.
  - `loadPicture('capital-relief/mountain')` resolves to a 296×296 preview.
  - A drawing that throws resolves to `{ error }`, and an unknown id resolves to `{ error }`.
  - Importing art.js draws nothing: count calls with a spy, or check that the module import finishes fast, under 300 ms, while drawing the Mountain alone takes about 600 ms.
- **Browser,** in `tests/browser/library.test.mjs`. Run it only with `PLAYWRIGHT_WORKERS=1 npx playwright test --config /private/tmp/claude-501/pw-82/playwright.config.mjs tests/browser/library.test.mjs`. It starts this worktree's own server on 5182; never use 5173.
  - `the library opens without drawing the art below the fold (#82)`: right after `page.goto`, the `capital-relief/mountain` tile has no `<img>`. After `scrollIntoViewIfNeeded()` it gets one, with `data-loaded="yes"`.
  - The existing "every section, with no console errors" test still passes.
  - Measure `page.goto` to the `load` event before and after the change, and report both times in the report. They are not an assertion.

**Commit** with `Refs #82: the library draws its art only when a tile comes into view`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
