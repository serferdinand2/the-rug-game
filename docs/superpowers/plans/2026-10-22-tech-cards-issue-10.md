# Tech card illustrations, the first 10 (issue #10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw the first 10 base tech cards, one 64×64 style C picture each, and hand them to the owner for review. #10 stays open.

**Architecture:**
- Each picture is a drawing module at `art/drawings/tech/<slug>.js`, built to `static/art/tech/<slug>.svg` by the existing art build. The component library's Art area picks each one up by itself.
- The three landmark cards (Bakery, Barn, Com Tower) return their landmark's picture, cropped to 64×64 by a new `crop` helper in `art/painter.js`.
- A new test file checks every tech picture: full bleed, no twins, the landmark crops, and that all 10 are drawn.
- Clocks comes first as the reference; subagents then draw the other six side by side, each writing only its own drawing files.

**Tech Stack:** Node.js 22.12+ built-ins, the `art/` toolkit from #4, `node:test`, and svelte-check for JSDoc.

**Spec:** [docs/superpowers/specs/2026-10-22-tech-cards-design.md](../specs/2026-10-22-tech-cards-design.md)

## Global Constraints

- **Toolkit rules** from #4 and `docs/art/README.md`: JSDoc and ES modules, no `node:` imports in `art/**/*.js`, a one-line comment at the top of each file, braces on every `if`/`else`, Prettier (tabs, single quotes), and `npm run check` with 0 errors and 0 warnings.
- **Drawing rules.** No `Math.random()`; one `seededRandom(seed)` stream per drawing, shared by every part in it. Colours are lowercase `#rrggbb` from `PALETTE` or blended from it with `mix()`.
- **Side-by-side drawings never edit shared files** (`art/palette.js`, `art/parts/`, `art/painter.js`, tests, docs). A colour a drawing needs that the palette lacks is a `mix()` of palette colours inside the drawing.
- **Every picture** is 64×64, paints all 4,096 pixels, has no lettering (dials and gauges show tick marks only; labels show pictures), and shows no likeness of a real person. Real religious and political signs, blood, weapons and the like are allowed where the subject calls for them (owner, 2026-10-22).
- **The invention is the hero**: it fills roughly half the frame or more, close to the viewer, outlined, with its setting behind it.
- **Subjects and light** come from the spec's §6.3 table; §6.4 keeps them off earlier pictures and later cards. Dawn uses the dusk sky.
- **Composition** follows the Lighthouse and the earlier sets (Cartography, `art/drawings/tapestry/cartography.js`, is the closest model of an object close up): background on a layer, the invention on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows and details.
- **Commits** say "Refs #10: …" and end with the `Co-Authored-By` line; each holds drawings together with their SVGs (`npm run art`). #10 does not close.

## Review Focus

1. **Lettering on a prop**: a dial, gauge, label or tin whose marks read as numbers or letters (Clocks, Ammonia, Canned Food, Air Conditioning). The reviewer checks every marked prop at 4×.
2. **An invention lost at 1×**: too small, or sinking into a dark night or interior (Clocks, Anesthesia, Com Tower). The reviewer checks all 10 at 1× and asks for a rim light or glow where one sinks.
3. **A repeat of an earlier picture**: the reviewer puts each new picture beside the ones §6.4 names (civ/tinkerers, landmark/clock-tower, tapestry/empiricism, tapestry/wartime-economy, tapestry/industrialism, tapestry/theocracy) on one contact sheet.
4. **A pixel left empty** behind an outline gap or at an edge. The full-bleed test checks every tech picture.
5. **A landmark card drifting from its landmark**: a crop moved in the drawing but not the test, or a picture redrawn by hand. Task 1's landmark test compares each card with its landmark.

---

### Task 1: The crop helper, the checks and the three landmark cards

**Files:**
- Modify: `art/painter.js`, `tests/art-painter.test.mjs`, `docs/art/README.md`
- Create: `tests/art-tech.test.mjs`, `art/drawings/tech/bakery.js`, `art/drawings/tech/barn.js`, `art/drawings/tech/com-tower.js`, and their SVGs in `static/art/tech/`

**Interfaces:**
- Consumes: `DRAWINGS_DIR`, `listDrawingIds` from `art/build.mjs`; `ASSETS`, `EXPANSIONS` from the catalog; `draw()` from `art/drawings/landmark/{bakery,barn,com-tower}.js`.
- Produces:
  - `crop(canvas, x, y, w, h)` → `Canvas` in `art/painter.js`: a new `w`×`h` canvas whose pixel (i, j) is the source's pixel (x + i, y + j), or `null` where that lies off the source. Throws `Error` when any argument isn't an integer.
  - `CROP` (`{ x: number, y: number }`) exported from `tech/barn.js` (`{ x: 8, y: 22 }`) and `tech/com-tower.js` (`{ x: 10, y: 0 }`), the crop's top-left in the landmark picture.
  - `FINISHED` in `tests/art-tech.test.mjs`, the expansion codes whose tech cards must all be drawn; it stays `[]` in this plan.

- [ ] **Step 1: Write the crop tests** in `tests/art-painter.test.mjs`, importing `crop`:
  - `test('crop copies a window of a canvas into a new canvas')`: on a 4×3 canvas with `RED` at (1, 1) and `BLUE` at (2, 2), `crop(c, 1, 1, 2, 2)` has `w === 2`, `h === 2` and `filled()` equal to `['0,0=#aa0000', '1,1=#0000bb']`; the source is unchanged.
  - `test('crop leaves pixels off the source empty and rejects fractional numbers')`: `crop(c, 3, 2, 2, 2)` on the same canvas has `p` of four entries, all `null`; `crop(c, 0.5, 0, 2, 2)` and `crop(c, 0, 0, 2.5, 2)` throw.
- [ ] **Step 2: Run** `node --test tests/art-painter.test.mjs`. Expected: FAIL, `crop` is not exported.
- [ ] **Step 3: Implement `crop`** in `art/painter.js` beside `underlay`, using `assertIntegers` for both pairs.
- [ ] **Step 4: Run** `node --test tests/art-painter.test.mjs`. Expected: PASS.
- [ ] **Step 5: Write the tech tests** in `tests/art-tech.test.mjs` (header: "Tech cards (#10): one full 64×64 picture per card, no two alike."), mirroring `tests/art-civ.test.mjs` for the `tech/` group with `FINISHED = []`: `every tech picture paints all 4,096 pixels`, `no two tech pictures are the same`, `every finished set is a known expansion`, `every tech card of each finished set is drawn`. Add `test('the landmark cards show their landmark pictures')`: `tech/bakery`'s `p` deep-equals `landmark/bakery`'s; `tech/barn` and `tech/com-tower` deep-equal `crop(landmark, CROP.x, CROP.y, 64, 64)` of their landmark, using each drawing's exported `CROP`.
- [ ] **Step 6: Run** `node --test tests/art-tech.test.mjs`. Expected: FAIL on the landmark test only (the tech drawings don't exist).
- [ ] **Step 7: Write the three drawings.** Each imports its landmark's `draw` and returns it (Bakery) or `crop(draw(), CROP.x, CROP.y, 64, 64)`.
- [ ] **Step 8: Build and check**: `npm run art`, then `node --test tests/art-tech.test.mjs tests/art-build.test.mjs tests/art-painter.test.mjs` and `npm run check`. Expected: PASS, clean. Look at the two crops at 4×; if one cuts what the spec says it shows, move its `CROP` by a pixel or two.
- [ ] **Step 9: Docs**: in `docs/art/README.md`, add `crop` to the painter's row, and name `tests/art-tech.test.mjs` beside the other full-bleed checks.
- [ ] **Step 10: Commit** "Refs #10: add the crop helper, the tech card checks and the landmark cards".

### Task 2: The reference picture, Clocks

**Files:** Create `art/drawings/tech/clocks.js` and `static/art/tech/clocks.svg`.

- [ ] **Step 1: Draw Clocks** per the spec: an open gold pocket watch close up on dark velvet, lid raised over a dial with tick marks only, the back opened on its gears and balance wheel, the chain coiled beside it, lit by a lamp at night. The watch fills at least half the frame.
- [ ] **Step 2: Build and check**: `npm run art`, `node --test tests/art-tech.test.mjs tests/art-build.test.mjs`, `npm run check`. Expected: PASS, clean. Look at it at 1× and 4×, and beside civ/tinkerers and landmark/clock-tower.
- [ ] **Step 3: Commit** "Refs #10: draw the Clocks reference tech card".

### Task 3: The other six, the review and the hand-over

**Files:** Create `art/drawings/tech/<slug>.js` and its SVG for `air-conditioning`, `ammonia`, `anesthesia`, `assembly-line`, `calendar` and `canned-food`; modify `tests/art-tech.test.mjs`, `CLAUDE.md`.

- [ ] **Step 1: Make the test red**: add `test('the first 10 base tech cards are drawn')`, asserting that the first 10 `tech` assets with `expansion === 'base'`, in catalog order, are all drawn. Run `node --test tests/art-tech.test.mjs`. Expected: FAIL listing the six missing ids.
- [ ] **Step 2: Draw** side by side, three subagents with two cards each, matching the Clocks' scale and finish: Air Conditioning and Canned Food (outdoor day); Ammonia and Calendar (dusk and dawn); Anesthesia and Assembly Line (interiors).
- [ ] **Step 3: Build and verify**: `npm run art`, `node --test tests/art-tech.test.mjs tests/art-build.test.mjs`, `npm run check`. Expected: PASS, clean.
- [ ] **Step 4: Review** by a fresh reviewer against the spec and the Review Focus, at 1× and 4× and on a contact sheet with the earlier pictures it names; fix its findings.
- [ ] **Step 5: Verify the whole suite**: `npm test` PASS, `npm run check` clean.
- [ ] **Step 6: Record it**: in CLAUDE.md's "Where the work stands", note that #10's first 10 pictures are drawn and waiting for the owner.
- [ ] **Step 7: Commit** "Refs #10: draw the first 10 tech cards" and push to main.
- [ ] **Step 8: Hand the 10 to the owner** for review in the component library (`npm run dev`, then <http://127.0.0.1:5173/components.html#art-parts>).
