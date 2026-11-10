# F&F content part 1: the 6 advanced mats (#40) Implementation Plan

> **For agentic workers:** the owner's standing rule: implement inline (superpowers:executing-plans), no subagents, no per-task reviews. Steps use checkbox (`- [ ]`) syntax.

**Goal:** a table with F&F deals its 6 advanced mats in the joint mat-and-civilization pick, each placing, scoring and paying as 03 FF.6 prints it, and drawn in the game with #133's approved art.

**Architecture:** data in `engine/data/capitals.js` (`expansion: 'ff'`, new grid symbols, per-district rewards and mat rules as fields), read by `city.js` (completion, Netherworld's paths), `placing.js` (rewards, City in a Bottle's set-aside), `income.js` (Savanna's income, Quagmire's scoring). The client's `capital-terrain.js` and `CapitalGrid` draw the four layers.

**Spec:** `docs/superpowers/specs/2026-11-10-ff-content-design.md` §4.

## Global Constraints

- As #39's: engine-only rules, pure, JSDoc, rule ids cited, Prettier on changed files only, `Refs #40: …` commits with the Co-Authored-By line; a game without F&F unchanged, seed for seed.
- Grid symbols: `'1'` impassable dot, `'U'` unicorn and `'W'` wisp (impassable), `'0'` open, `'R'` reed, `'I'` imp, `'M'` the Netherworld's centre (all open). Mat numbers 13–18.

## Review Focus

- A Netherworld imp pays only once, only through income buildings and landmarks, never through an impassable plot, a token or a diagonal.
- City in a Bottle never offers a grid placement for a landmark; setting one aside pays 6 VP, but not a landmark placed on a tech or tapestry card.
- Savanna pays nothing on completion and 1 resource per filled district in the income of turns 2–4 only.
- Polar's impassable plots on a line count as filled, and its six lines pay 2, 2, 1, 2, 1, 1 (R91).
- Quagmire's scoring runs once, at the end of income turn 5, for landmarks covering a grid plot (R89), −5 on reeds (R88), +3 otherwise.

---

### Task 1: The data and the deal

**Files:** `src/lib/engine/data/capitals.js` (6 mats; `impassablePlots` reads `U` and `W`; typedef), setup's advanced deck with F&F; test `tests/engine-ff-mats.test.mjs`.

- [ ] Failing tests: each mat's grid and districts as 03 FF.6 (impassable 22 each, City in a Bottle 17 of 36); the engine's impassable plots equal the art's `LAYOUT` impassable plots for each mat (`tools/art/parts/capital-biomes/<slug>.js`); `advancedMatsFor(['ff'])` deals 13–18, with A&A 7–18; a game without F&F unchanged.
- [ ] Implement; run; commit `Refs #40: the six F&F mats as engine data`.

### Task 2: Each mat's rules

**Files:** `city.js` (`completeDistricts` with Netherworld's paths), `placing.js` (`payDistricts` per-district rewards; City in a Bottle's landmark set aside for 6 VP), `income.js` (Savanna income on turns 2–4; Quagmire's step at the end of income turn 5), `data/capitals.js` fields `districtRewards`, `districtIncome`, `paths`, `noLandmarks`, `asideVp`, `reeds`.

- [ ] Failing tests for each Review Focus line and each mat's reward; implement; run the capital, placement and income suites; commit `Refs #40: the F&F mats' rules`.

### Task 3: The mats on the screen

**Files:** `src/lib/capital-terrain.js` (biomes and layouts; Veil's sides and Savanna's districts for the ground), `CapitalGrid.svelte` (feature and overlay layers), words for the new events, a browser test that deals an F&F mat and sees its relief.

- [ ] Failing client tests; implement; screenshot a mat in a game for the README; commit `Refs #40: the F&F mats on the screen`.

### Task 4: Simulation and record

- [ ] The simulation deals F&F's mats; `npm run test:unit`, `npm run check`, the browser suite on private ports; docs/status.md entry; commit `Refs #40: part 1, the F&F mats: record`.
