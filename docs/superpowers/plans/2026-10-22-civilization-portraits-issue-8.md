# Civilization portraits (issue #8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw 41 civilization portraits, one 64×64 style C picture per civilization in the catalog, straight through to closing #8.

**Architecture:**
- Each portrait is a drawing module at `art/drawings/civ/<slug>.js`, built to `static/art/civ/<slug>.svg` by the existing art build. The component library's Art area picks each one up by itself.
- A new test file checks every portrait: full bleed, no twins, and completeness for each finished set.
- The Alchemists come first as the reference; subagents then draw the other 40 in parallel, each writing only its own drawing files.

**Tech Stack:** Node.js 22.12+ built-ins, the `art/` toolkit from #4, `node:test`, and svelte-check for JSDoc.

**Spec:** [docs/superpowers/specs/2026-10-22-civilization-portraits-design.md](../specs/2026-10-22-civilization-portraits-design.md)

## Global Constraints

- **Toolkit rules** from #4 and `docs/art/README.md`: JSDoc and ES modules, no `node:` imports in `art/**/*.js`, a one-line comment at the top of each file, braces on every `if`/`else`, Prettier (tabs, single quotes), and `npm run check` with 0 errors and 0 warnings.
- **Drawing rules.** No `Math.random()`; one `seededRandom(seed)` stream per drawing, shared by every part in it. Colours are lowercase `#rrggbb` from `PALETTE` or blended from it with `mix()`.
- **Parallel drawings never edit shared files** (`art/palette.js`, `art/parts/`, tests, docs). A colour a drawing needs that the palette lacks is a `mix()` of palette colours inside the drawing.
- **Every portrait** is 64×64, paints all 4,096 pixels, has no lettering, and shows no likeness of a real person. Real religious and political signs and emblems, blood, weapons, skulls, drink, smoke, gambling and the occult are allowed (owner, 2026-10-22).
- **Subjects and light** come from the spec's §6.2 tables, and §6.3 keeps them off the tapestry subjects.
- **Composition** follows the Lighthouse and the tapestry pictures (Seer Sight, `art/drawings/tapestry/seer-sight.js`, is the closest model of a large figure): background on a layer, the figure on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows and details.
- **Commits** say "Refs #8: …" and end with the `Co-Authored-By` line; each holds drawings together with their SVGs (`npm run art`). #8 closes with "Fix #8: …", pushed to main.

## Review Focus

1. **A face that doesn't read at 1×**: eyes lost in shadow, or a head too small. Each set's reviewer checks every portrait at 1× and 4× and names any face it can't read.
2. **A pixel left empty** behind an outline gap or at an edge. The full-bleed test checks every portrait.
3. **Twins**: two portraits with the same pose and palette, or a portrait repeating a tapestry picture. The no-twins test catches identical canvases; the reviewer checks look-alikes against the spec's §6.3 and a contact sheet of the set.
4. **Stray lettering**: a sign, book, poster or screen whose marks read as letters or numbers. The reviewer checks every prop with marks on it.
5. **A night portrait too dark**: the figure sinking into the sky. The reviewer checks every night portrait at 1× and asks for a rim light or glow where it sinks.

---

### Task 1: The checks, the skin colours and the reference portrait

**Files:**
- Create: `tests/art-civ.test.mjs`, `art/drawings/civ/alchemists.js`, `static/art/civ/alchemists.svg`
- Modify: `art/palette.js` (four skin colours), `docs/art/README.md`

**Interfaces:**
- Consumes: `DRAWINGS_DIR`, `listDrawingIds` from `art/build.mjs`; `ASSETS`, `EXPANSIONS` from the catalog.
- Produces: `FINISHED` in `tests/art-civ.test.mjs`, the expansion codes whose civilizations must all be drawn; `PALETTE.skinTan`, `PALETTE.skinTanShade`, `PALETTE.skinDeep`, `PALETTE.skinDeepShade`.

- [ ] **Step 1: Write the tests** in `tests/art-civ.test.mjs` (header: "Civilization portraits (#8): one full 64×64 portrait per civilization, no two alike."), mirroring `tests/art-tapestry.test.mjs` for the `civ/` group: `every civilization portrait paints all 4,096 pixels`, `no two civilization portraits are the same`, `every finished set is a known expansion`, `every civilization of each finished set is drawn`. `FINISHED` starts as `[]`, plus `test('the reference portrait is drawn')` asserting `civ/alchemists` is drawn.
- [ ] **Step 2: Run** `node --test tests/art-civ.test.mjs`. Expected: FAIL on `the reference portrait is drawn` only.
- [ ] **Step 3: Add the skin colours** to `PALETTE` under "People": `skinTan`, `skinTanShade`, `skinDeep`, `skinDeepShade`.
- [ ] **Step 4: Draw the Alchemists** per the spec's table, framed per §6.2.
- [ ] **Step 5: Build and check**: `npm run art`, `node --test tests/art-civ.test.mjs tests/art-build.test.mjs`, `npm run check`. Expected: PASS, clean. Look at it at 1× and 4×.
- [ ] **Step 6: Docs**: in `docs/art/README.md`, note the skin colours and the explicit-material rule beside the political one.
- [ ] **Step 7: Commit** "Refs #8: add the civilization portrait checks and the Alchemists".

### Task 2: The base set (15 more)

**Files:** Create `art/drawings/civ/<slug>.js` and its SVG for each base civilization; modify `tests/art-civ.test.mjs`.

- [ ] **Step 1: Make the test red**: add `'base'` to `FINISHED` and delete `the reference portrait is drawn`. Run `node --test tests/art-civ.test.mjs`. Expected: FAIL listing the 15 missing ids.
- [ ] **Step 2: Draw** in parallel, a handful per subagent, each matching the Alchemists' face scale and treatment.
- [ ] **Step 3: Build and verify**: `npm run art`, `node --test tests/art-civ.test.mjs tests/art-build.test.mjs`, `npm run check`. Expected: PASS, clean.
- [ ] **Step 4: Review** by a fresh reviewer against the spec and the Review Focus; fix its findings.
- [ ] **Step 5: Commit** "Refs #8: draw the base civilization portraits".

### Task 3: Plans & Ploys (10)

Same steps as Task 2 with `'pp'` and the spec's Plans & Ploys table. Commit "Refs #8: draw the Plans & Ploys civilization portraits".

### Task 4: Arts & Architecture (5)

Same steps with `'aa'`. Commit "Refs #8: draw the Arts & Architecture civilization portraits".

### Task 5: Fantasies & Futures (10) and closing #8

Same steps with `'ff'`. Then:
- [ ] `npm test` PASS and `npm run check` clean.
- [ ] Move #8 to done in CLAUDE.md's "Where the work stands"; commit "Fix #8: record that all 41 civilization portraits are drawn"; push to main; tick #8's boxes and close it.

Tasks 2–5 draw at the same time; their reviews and commits run in set order as each set finishes.
