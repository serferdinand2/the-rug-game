# A&A advanced capital mats, part 2 (the screen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (the owner's standing rule: no subagent per task). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The game screen shows the six Arts & Architecture mats with #132's art, and asks the joint mat-and-civilization pick and Cloud City's moves.

**Architecture:** The client reads every mat through the engine's `capitalMat` and `matShape`; `CapitalGrid` takes a `shape` prop (rows, columns, districts) and lays its plots, gaps, relief, a new features layer, district lines and completed-district highlights from it; the joint pick is two `CardShelf` rows over one prompt state; Cloud City's moves light capital plots as placements do.

**Tech Stack:** Svelte 5 (runes), JavaScript with JSDoc, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-aa-capital-mats-design.md` §4; part 1's plan and ledger for the engine names.

## Global Constraints

- Read `docs/conventions.md`; never edit it. Components keep `{...attr}`, BEM `rg-` classes, token colours, `on{Component}{Action}` callbacks with `ComponentEvent`. No screen-reader work (owner).
- The looks are built from the existing patterns and checked by the owner afterwards (owner, 2026-11-06): no mockup round.
- The basic mats look and behave exactly as before: their default shape is `BASIC_SHAPE`, and the 3×3 district lines stay the CSS ones.
- Commits on `m8-arts-and-architecture`, `Refs #36: …`, ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `npm run check` clean at each task's end.
- Browser tests run with `PORT=3022` (the owner's server holds 3020); a test that creates a table ends and leaves it.

## Review Focus

1. An 11-row Archipelago in the Capital tab: the relief lines up with the plots top to bottom, and a landmark can hang off the bottom edge. Task 2 checks it in the library screenshot and with `pieceArea` tests.
2. A Canyon cactus surrounded and turned `blocked` must not show an Architects cube. Task 1 tests `plotTerrain`.
3. A building on a Swamp lily pad hides the pad. Task 1 tests `cleared` for it.
4. The joint pick under current rules: choosing Cloud City greys out the Riverfolk, and choosing the Riverfolk greys out Cloud City. Task 3 tests it.
5. Cloud City's "Don't move" stays a panel button while the plots light. Task 4 tests the options' places.

---

### Task 1: The client reads any mat

**Files:** `src/lib/ui.js` (`CapitalBiome` gains the six slugs; `capitalTileUrl` takes a ground key string), `src/lib/art/relief.js` (gains `CLOUD_TINTS` and `CLOUD_TINT_NAMES`, moved from `tools/art/parts/capital-biomes/cloud-city.js`, which re-exports them), `src/lib/capital-terrain.js`, `src/lib/area/capital.js`; tests `tests/client-capital-terrain.test.mjs`, `tests/client-area-capital.test.mjs`.

**Produces:**
- `capitalView(seat, code)` for any mat: `biome` is `mat.id`, plus `shape: Shape`; counts use the shape.
- `matPlots(number)`: `'1'` → `'blocked'`, `'L'` → `'lily'`, else `'empty'`, for 1–12.
- `featureUrl(biome): string | null` (`capital-feature/<slug>` for `FEATURE_BIOMES`).
- `plotTerrain(plots, biome, seed)`: the mat by id among all mats; Cloud City's ground key `cloud-city-<tint>` per plot; `cube` only on a plot printed `'0'`; `cleared` also for a printed lily pad or cactus a piece now covers.

- [ ] Tests first: Archipelago view has 99 plots and `shape.rows === 11`; `matPlots(12)` has 6 `'lily'`; Cloud City plot (0,0) ground is `capital-terrain/cloud-city-grey-open-0N`; a surrounded cactus (`blocked` on a `'C'` plot) has `cube: false`; a farm on a Swamp pad has `cleared: true`; `featureUrl('canyon')` and `featureUrl('cavern') === null`; the art test `art-approved` still passes (the move changes no picture).
- [ ] Implement; run `npx vitest run tests/client-capital-terrain.test.mjs tests/client-area-capital.test.mjs tests/art-approved.test.mjs`, then the unit suite. Commit `Refs #36: the client reads any capital mat`.

### Task 2: CapitalGrid of any shape

**Files:** `src/lib/capital.js` (`districtEdges(shape)`), `src/lib/placement.js` (every `GRID_SIZE` use takes a trailing `shape = BASIC_SHAPE`), `src/lib/components/player/CapitalGrid.svelte`, `CapitalCity.svelte`, `CapitalMatFace.svelte`, `src/screens/game/CapitalTab.svelte`, `PlayerTabs.svelte`, `PlayersOverview.svelte`, `src/lib/results.js` callers as needed, `src/library/sections/player/CapitalGrid.svelte` (an Archipelago, a Cloud City and a Swamp example), `src/lib/components/README.md`; tests `tests/capital.test.mjs`, `tests/client-area-placement.test.mjs`.

**Produces:**
- `districtEdges(shape): { row: number, col: number, side: 'right' | 'bottom' }[]`: every plot side between two plots of different districts (a plot in no district counts as its own); empty for `BASIC_SHAPE` callers that keep the CSS lines.
- `CapitalGrid` prop `shape` (default `BASIC_SHAPE`): grid rows and columns, `aspect-ratio` from the relief size, `column-gap` and `row-gap` of one relief pixel, the features picture under the relief, SVG district lines for a non-basic shape, and a completed district that isn't a rectangle highlighted plot by plot. `CapitalCity` and `CapitalMatFace` pass `shape` on.

- [ ] Tests first: `districtEdges` on Cloud City gives the cloud borders (an edge between (0,2) and (0,3), none between (0,0) and (0,1)); on the Archipelago none between two water plots; `pieceArea` with an 11-row shape keeps a piece hanging off row 10's bottom.
- [ ] Implement; run the unit suite and `npm run check`; screenshot the library's CapitalGrid section (scratchpad script) and look at the three new examples. Commit `Refs #36: CapitalGrid draws a mat of any shape`.

### Task 3: The joint pick on two shelves

**Files:** `src/lib/decision-kinds.js` (`chooseMatAndCiv: { shelf: 'mat', confirm: 'Keep these' }`), `src/lib/prompts.js` (`jointPick`, `shelfFace` for any mat with its `shape`, `shelfCards` empty for the joint pick), `src/lib/prompt-state.svelte.js` (`joint`, `jointMat`, `jointCiv`, `pickJointMat`, `pickJointCiv`), `src/screens/game/DecisionPrompt.svelte` (a `jointShelf` snippet: the mats' `CardShelf`, then the civilizations'); tests `tests/client-prompts.test.mjs`, `tests/client-prompt-state.test.mjs`.

**Produces:** `jointPick(decision): { mats: ShelfCard[], civs: ShelfCard[] } | null` (mats' `index` is the mat number, civilizations' their place 0–1); `jointAnswer(decision, mat, civ): number | null`; `jointBlocked(decision, { mat?, civ? }): { mats: number[], civs: number[] }` from the answers the engine offers (R120).

- [ ] Tests first: a 3-mat, 2-civ decision gives 3 mat cards and 2 civ cards; picking a mat then a civ sets `picked` to the matching answer; with Cloud City and the Riverfolk dealt under current rules, picking Cloud City blocks the Riverfolk card and the other way round; Confirm reads "Keep these" once both are picked.
- [ ] Implement; unit suite and check. Commit `Refs #36: keep a mat and a civilization on one shelf`.

### Task 4: Cloud City's moves on the capital

**Files:** `src/lib/engine/decisions/choose-cloud-move.js` (`chooseCloudPlot` carries `building`), `src/lib/prompts.js` (`placeOf`: the two kinds' plot answers are on the capital), `src/lib/prompt-state.svelte.js` (`placement.piece`: `{ move: true }` for `chooseCloudMove`, `{ building }` for `chooseCloudPlot`), `src/lib/area/placement-targets.js` (a `move` piece lights its targets with no preview), `src/screens/game/CapitalTab.svelte` (its click handler takes a move); tests `tests/client-prompts.test.mjs`, `tests/client-area-placement.test.mjs`, `tests/engine-aa-mats.test.mjs`.

- [ ] Tests first: the engine's `chooseCloudPlot` names the building; `chooseCloudMove`'s plot answers are `place: 'capital'` and its stop answer `'panel'`; a move piece lights its targets and previews nothing; a plot pick previews the building.
- [ ] Implement; unit suite and check. Commit `Refs #36: Cloud City's moves on the Capital tab`.

### Task 5: Words and How to play

**Files:** `src/lib/log.js` (`capitalDealt` names the advanced mat), `src/lib/rules-help.js` (an Arts & Architecture part: the mats and their rules, R120–R123 in our words); tests `tests/client-log.test.mjs` and the rules-help test.

- [ ] Tests first: the log line for an A&A deal names both mats; How to play lists the six mats.
- [ ] Implement; unit suite. Commit `Refs #36: the advanced mats in the log and How to play`.

### Task 6: Browser test, screenshots and records

**Files:** `tests/browser/aa-mats.test.mjs` (new), `docs/ui/screens/` (the joint pick and an advanced capital, 1920×1080 from the running game), `README.md` ("Current interface"), `docs/ui/README.md`, `docs/status.md` (part 2's entry), `src/lib/components/README.md`.

- [ ] Browser test: a hot-seat A&A table; each seat keeps its advanced mat and a civilization on the shelves; the Capital tab shows that mat's grid (its rows) after setup; the table ends and is left.
- [ ] Run `PORT=3022 npx playwright test` (all browser tests), the unit suite and `npm run check`.
- [ ] Screenshots from the running game into `docs/ui/screens/`; README and `docs/ui/README.md` updated; status entry. Commit `Refs #36: the advanced mats in a browser test, the README's screenshots`.
