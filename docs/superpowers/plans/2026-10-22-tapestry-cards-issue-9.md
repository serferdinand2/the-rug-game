# Tapestry card illustrations (issue #9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw 115 tapestry-card pictures, one 64×64 style C scene per card in the catalog, in four batches the owner approves one by one.

**Architecture:**
- Each picture is a drawing module at `art/drawings/tapestry/<slug>.js`, built to `static/art/tapestry/<slug>.svg` by the existing art build. The component library's Art area picks each one up by itself.
- Two new scene parts come first, because the samples need them: a tall ship and an interior. Later batches add a banner and a crowd part when two or more cards need them.
- A new test file checks every tapestry picture: full bleed, no twins, and completeness for each finished set.

**Tech Stack:** Node.js 22.12+ built-ins, the `art/` toolkit from #4, `node:test`, and svelte-check for JSDoc.

**Spec:** [docs/superpowers/specs/2026-10-22-tapestry-cards-design.md](../specs/2026-10-22-tapestry-cards-design.md), which builds on [2026-10-21-art-toolkit-design.md](../specs/2026-10-21-art-toolkit-design.md).

## Global Constraints

- **Toolkit rules** from #4 and `docs/art/README.md`:
  - JSDoc and ES modules, no runtime packages, and no `node:` imports in `art/**/*.js`;
  - a one-line comment at the top of each file;
  - braces on every `if`/`else`, and Prettier formatting (tabs, single quotes);
  - `npm run check` with 0 errors and 0 warnings.
- **Drawing rules.**
  - No `Math.random()`; each drawing uses one `seededRandom(seed)` stream, and every part in it shares that stream.
  - Colours are lowercase `#rrggbb`. Scene parts paint only `PALETTE` colours, new colours go into `PALETTE` (`art/palette.js`), and drawings may blend them with `mix()`.
- **Ids** come from `src/lib/art/catalog.js` (`tapestry/<slug>`). Never draw "Arc…" or Infrastructure Boost (R43, R44); they have no id.
- **Every picture** is 64×64, paints all 4,096 pixels, has no lettering, and shows no real flags, emblems, political or religious symbols, or real people.
- **Subjects and light** come from the spec's §6.2 tables. Each picture is our own reading of the card's name, never a copy of Stonemaier's card art.
- **Composition** follows the Lighthouse (`art/drawings/landmark/lighthouse.js`): background parts on a layer, the subject on a foreground canvas, `outline(foreground, PALETTE.ink)`, then `underlay(foreground, layer)`, then details that skip the outline.
- **Commits** say "Refs #9: …" and end with the `Co-Authored-By` line. Each commit holds drawings together with their SVGs (`npm run art`). #9 closes with "Fix #9: …" only after the owner approves the F&F batch.
- **Owner gates.** Tasks 4–7 each start only after the owner approves the previous batch in the component library (`npm run dev`, then <http://127.0.0.1:5173/components.html#art-parts>).

## Review Focus

1. **A pixel left empty** at a canvas edge or behind an outline gap, so the frame shows a hole. Task 3's full-bleed test checks every drawn tapestry picture.
2. **A copied drawing** left unchanged for a second card. Task 3's no-twins test compares every pair of tapestry pictures.
3. **A ship or interior drawn partly off the canvas** where the box it returns claims otherwise. Tasks 1 and 2 test that each part paints only inside its box (the ship) or fills exactly what it promises (the interior).
4. **A night picture too dark to read** at its shown size. No test can judge it: check every night picture at 1× in the library before each batch goes to the owner, and lift the subject with glow colours where it sinks into the sky.
5. **A batch handed over with a card missing.** Each batch task starts by adding its set to `FINISHED` in the test, so the test lists every missing card until the batch is whole.

---

### Task 1: The ship part

**Files:**
- Create: `art/parts/ship.js`
- Modify: `tests/art-parts.test.mjs` (samples and tests), `art/gallery.js` (`PART_SAMPLES`), `docs/art/README.md` (parts table row)

**Interfaces:**
- Consumes: `set`, `rect` from `art/painter.js`; `PALETTE` from `art/palette.js`.
- Produces: `drawShip(canvas, { x, y, facing = 'right', sails = PALETTE.cream, flag, masts = 3 })` → `Box`, from `art/parts/ship.js`.
  - `x`: the hull's leftmost column; `y`: the waterline row (the hull's bottom row).
  - `facing`: `'right' | 'left'`; left is the exact mirror of right inside the box.
  - `sails`: a `Colour`; `flag`: an optional `Colour` for a pennant at the mainmast top; `masts`: `1 | 2 | 3`.
  - Returns the box holding every pixel drawn. Paints the foreground only (the drawing outlines it).
  - Throws `Error` for an unknown `facing` or a `masts` value other than 1, 2 or 3.

- [ ] **Step 1: Write the failing tests** in `tests/art-parts.test.mjs`:
  - Add samples `ship: 3 masts` (`drawShip(c, { x: 8, y: 50 })`) and `ship: 1 mast` (`masts: 1`) to `SAMPLES`, both `random: false`, so the palette and repeat tests cover them.
  - Add `ship` and `ship facing left` to the pieces in `'buildings and the figure draw only inside the box they return'` (both `{ x: 20, y: 50 }`); the test asserts `box.x === 20` and bottom row `50`.
  - `test('a ship facing left is the mirror of one facing right')`: same shape as the figure mirror test.
  - `test('a ship has the sail colour it is given and one mast per mast asked for')`: with `sails: PALETTE.brickRed`, the canvas contains `PALETTE.brickRed`; the 1-mast box is narrower than the 3-mast box (`one.w < three.w`).
  - Extend `'parts refuse kinds and times they do not know'`: `drawShip(c, { x: 0, y: 7, facing: 'up' })` and `drawShip(c, { x: 0, y: 7, masts: 4 })` throw.

- [ ] **Step 2: Run** `node --test tests/art-parts.test.mjs`. Expected: FAIL, cannot find `art/parts/ship.js`.

- [ ] **Step 3: Implement `drawShip`** in `art/parts/ship.js`: a wooden hull (timber shades, a lighter rail), masts spaced across the hull, square sails shaded on the side away from the light, and an optional pennant. Draw it facing right, then mirror the columns within the box for `'left'`, as `drawFigure` does.

- [ ] **Step 4: Run** `node --test tests/art-parts.test.mjs`. Expected: PASS.

- [ ] **Step 5: Show it in the library.** Add a `ship` entry to `PART_SAMPLES` in `art/gallery.js` (a ship on a day sea, outlined), and a row for `drawShip` in the parts table of `docs/art/README.md`. Run `node --test tests/art-gallery.test.mjs` and `npm run check`. Expected: PASS, 0 errors and 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add art/parts/ship.js art/gallery.js tests/art-parts.test.mjs docs/art/README.md
git commit -m "Refs #9: add the ship scene part"
```

### Task 2: The interior part

**Files:**
- Create: `art/parts/interior.js`
- Modify: `art/palette.js` (wall and floor tones), `tests/art-parts.test.mjs`, `art/gallery.js`, `docs/art/README.md`

**Interfaces:**
- Consumes: `set`, `rect`, `seededRandom` streams; `drawSky` from `art/parts/sky.js` for the window's view.
- Produces: `drawInterior(canvas, { floor, random, window, wall = 'plaster' })` → `void`, from `art/parts/interior.js`.
  - Fills every pixel of the canvas: the back wall in rows `0` to `floor - 1`, the floor from row `floor` down.
  - `wall`: `'plaster' | 'stone' | 'panel'`; `floor` boards or flagstones match it.
  - `window`: optional `{ x, y, w, h, time }`, where `time` is `'night' | 'day' | 'dusk'`; the window frame is drawn and its panes show `drawSky` for that time.
  - Throws `Error` for an unknown `wall` or `time`.
- New `PALETTE` keys (exact values are the builder's choice, lowercase `#rrggbb`): `plasterLight`, `plaster`, `plasterShade`, `floorLight`, `floor`, `floorShade`.

- [ ] **Step 1: Write the failing tests** in `tests/art-parts.test.mjs`:
  - Add samples `interior: <wall>` for each of `['plaster', 'stone', 'panel']` (`floor: 44`, `window: { x: 24, y: 10, w: 16, h: 20, time: 'night' }`), `random: true`.
  - `test('an interior fills every pixel')`: for each wall kind, every pixel of the 64×64 canvas is set.
  - `test('an interior window shows the sky of its time')`: with `time: 'day'` the window's pixels include at least one of `PALETTE.daySky1`–`daySky6` and none of `nightSky1`–`nightSky6`; with `time: 'night'`, the reverse.
  - Extend the refusal test: `wall: 'glass'` and `window.time: 'noon'` throw.

- [ ] **Step 2: Run** `node --test tests/art-parts.test.mjs`. Expected: FAIL, cannot find `art/parts/interior.js`.

- [ ] **Step 3: Implement `drawInterior`**, adding the six palette colours. Draw the window's sky on a scratch canvas the size of the window and copy it in, so the sky part's horizon and stars fit the pane.

- [ ] **Step 4: Run** `node --test tests/art-parts.test.mjs`. Expected: PASS.

- [ ] **Step 5: Show it in the library** (`PART_SAMPLES` entry per wall kind, README parts row). Run `node --test tests/art-gallery.test.mjs` and `npm run check`. Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add art/parts/interior.js art/palette.js art/gallery.js tests/art-parts.test.mjs docs/art/README.md
git commit -m "Refs #9: add the interior scene part"
```

### Task 3: The tapestry checks and three samples

**Files:**
- Create: `tests/art-tapestry.test.mjs`, `art/drawings/tapestry/age-of-sail.js`, `art/drawings/tapestry/monarchy.js`, `art/drawings/tapestry/dark-ages.js`, and their SVGs in `static/art/tapestry/`
- Modify: `docs/art/README.md` (the full-bleed rule)

**Interfaces:**
- Consumes: `drawShip` (Task 1), `drawInterior` (Task 2), the existing parts; `DRAWINGS_DIR`, `listDrawingIds` from `art/build.mjs`; `ASSETS` from the catalog.
- Produces: `FINISHED` in `tests/art-tapestry.test.mjs`, an array of expansion codes (`'base' | 'pp' | 'aa' | 'ff'`) whose cards must all be drawn. It starts empty; Tasks 4–7 each add one code.

- [ ] **Step 1: Write the tests** in `tests/art-tapestry.test.mjs` (header comment: "Tapestry cards (#9): one full 64×64 scene per card, no two alike."). Load each drawn `tapestry/` module as `art-landmarks.test.mjs` does.
  - `test('every tapestry picture paints all 4,096 pixels')`: for each drawn tapestry id, `canvas.w === 64`, `canvas.h === 64`, and `canvas.p.every(Boolean)`, with the id in the message.
  - `test('no two tapestry pictures are the same')`: join each canvas's `p` into a string and assert the set of strings has as many entries as there are drawings; name the clashing ids on failure.
  - `test('every card of each finished set is drawn')`: for each code in `FINISHED`, the catalog's `tapestry` assets with that `expansion` minus the drawn ids is `[]`.
  - `test('the samples are drawn')`: `tapestry/age-of-sail`, `tapestry/monarchy` and `tapestry/dark-ages` are among the drawn ids. Task 4 removes this test once `base` is finished.

- [ ] **Step 2: Run** `node --test tests/art-tapestry.test.mjs`. Expected: FAIL on `the samples are drawn` only.

- [ ] **Step 3: Draw Age of Sail**: a three-masted tall ship (`drawShip`, cream sails) under full sail leaving a harbour at sunrise: dusk sky, a stone harbour wall and a small lighthouse or quay buildings on one side, the day sea gilded near the sun. Seed and composition are the builder's.

- [ ] **Step 4: Draw Monarchy**: a throne room (`drawInterior`, `wall: 'stone'`, a day window): a red throne on a dais with a gold crown resting on its seat, banners of an invented device hanging either side, a carpet running to the viewer.

- [ ] **Step 5: Draw Dark Ages**: a ruined stone tower and broken wall, bare trees, a crow, under a stormy night sky (night sky with clouds over the stars, a faint moon behind cloud). Keep the ruin readable against the sky (Review Focus 4).

- [ ] **Step 6: Build and check**: run `npm run art`, then `node --test tests/art-tapestry.test.mjs tests/art-build.test.mjs` and `npm run check`. Expected: PASS, clean. Look at all three in the library at 1×, 2× and 4×.

- [ ] **Step 7: Note the rule**: in `docs/art/README.md`, under Rules, add that an illustration other than a landmark paints every pixel (full bleed) and carries no lettering.

- [ ] **Step 8: Run the full suite**: `npm test`. Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add tests/art-tapestry.test.mjs art/drawings/tapestry static/art/tapestry docs/art/README.md
git commit -m "Refs #9: draw the Age of Sail, Monarchy and Dark Ages samples"
```

- [ ] **Step 10: Hand the samples to the owner** for review in the component library, and note on #9 (a comment) that each batch is reviewed there until #47 exists. Stop here until they approve the direction; fold any change they ask for into the three drawings or the parts before Task 4.

### Task 4: The base batch (41 more)

Starts after the owner approves the samples.

**Files:**
- Create: `art/drawings/tapestry/<slug>.js` and SVGs for the other 41 base cards (spec §6.2, Base game table)
- Create if two or more cards need them: `art/parts/banner.js` (`drawBanner(canvas, { x, y, height, cloth, device }) → Box`), `art/parts/crowd.js` (`drawCrowd(canvas, { x, y, count, random }) → Box`, built on `drawFigure` with varied clothes), each tested in `tests/art-parts.test.mjs` like the ship (inside its box, palette only, repeatable, refusals)
- Modify: `tests/art-tapestry.test.mjs`, `CLAUDE.md` ("Where the work stands")

- [ ] **Step 1: Make the test red**: add `'base'` to `FINISHED` and delete `the samples are drawn`. Run `node --test tests/art-tapestry.test.mjs`. Expected: FAIL listing the 41 missing base ids.
- [ ] **Step 2: Add the banner and crowd parts** test-first, if used, and commit them on their own ("Refs #9: add the banner and crowd scene parts").
- [ ] **Step 3: Draw the cards** in two or three commits of roughly equal size, in table order, each followed by `npm run art`, `node --test tests/art-tapestry.test.mjs tests/art-build.test.mjs` and a commit ("Refs #9: draw the base tapestry cards, Academia to Feudalism", and so on).
- [ ] **Step 4: Verify**: `node --test tests/art-tapestry.test.mjs` PASS, `npm test` PASS, `npm run check` clean. Look at every new picture at 1× next to its neighbours for twins and dark scenes.
- [ ] **Step 5: Hand the batch to the owner.** On approval, tick "Base batch approved" on #9, update CLAUDE.md, and commit "Refs #9: record the owner's approval of the base batch".

### Task 5: The Plans & Ploys batch (13)

Same steps as Task 4 with `'pp'` in `FINISHED` and the spec's Plans & Ploys table; one drawing commit. Tick "Plans & Ploys batch approved" on approval.

### Task 6: The Arts & Architecture batch (20)

Same steps with `'aa'` and the Arts & Architecture table; two drawing commits. The building-plot cards (Commercial Center, Monuments, Star Chamber) get scenes only, with no plot squares. Tick "Arts & Architecture batch approved" on approval.

### Task 7: The Fantasies & Futures batch (38) and closing #9

Same steps with `'ff'` and the Fantasies & Futures table; three drawing commits. Add glow colours to `PALETTE` (ghostly, arcane and alien) as the drawings need them.

- [ ] **Final step:** on the owner's approval, tick the last box, move #9 to done in CLAUDE.md, and commit "Fix #9: record the owner's approval of the tapestry cards".
