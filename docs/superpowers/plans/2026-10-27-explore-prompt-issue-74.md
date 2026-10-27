# Choosing the tile to explore (#74) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The explore prompt shows the player's tiles from the start and lets them pick a tile and a hex in either order, turn the tile on the hex while watching its VP, and confirm.

**Architecture:** The engine doesn't change: `chooseExplore` still offers every (tile, hex, turn) and Confirm sends one of those answers. A plain module (`src/lib/area/explore.js`) scores tiles on hexes from the view and maps a (tile, hex, turn) to its answer; two new presentational components (`TilePicker`, `TurnControl`) and a `scores` prop on `WorldMap` draw it; `Game.svelte` holds the tile and turn beside `mapPick`.

**Tech Stack:** Svelte 5 (runes), JavaScript with JSDoc, Vitest with `node:assert/strict`, Playwright in Chromium.

**Spec:** `docs/superpowers/specs/2026-10-27-explore-prompt-design.md`

## Global Constraints

- CONVENTIONS.md applies: a one-line comment opens every file; JSDoc on exports; `rg-` BEM classes; colours from tokens; handlers `{action}Handler`; callbacks `on{Component}{Action}` receiving a `ComponentEvent`; `{...attr}` spread with `class` merged; Prettier; `npm run check` reports 0 errors and 0 warnings.
- Every new component has `src/library/sections/prompts/<Name>.svelte` showing all its states and a row in `src/lib/components/README.md` (`tests/library.test.mjs` enforces both).
- Scores come only from the engine's `matchingSides()` on the viewer's view.
- Copy, exactly: title "Choose where to explore"; lead "Pick one of your tiles and a lit hex, then turn the tile until you like it."; tiles label "Your tiles · n"; chosen line "Pick a tile, or a lit hex on the map." / "Now pick a lit hex: each shows the best this tile scores there." / "Hex −1,−1, turned once"; turn control "No hex yet" when disabled, "+3 VP" otherwise, hint "R turns it"; confirm "Explore".
- The best turn is the highest VP for that tile on that hex; on a tie, the lowest turn.
- Desktop only; reduced motion and the keyboard work.
- Commits reference the issue: "Refs #74: …"; the last one "Fix #74: …" only after the owner's look (design §8), otherwise "Refs #74".

## Review Focus

- A second explore in the same turn (Trains: "Tile ×2, Explore"; Exploitation) opens a new `chooseExplore`: the tile, hex and turn must reset with the new decision, not carry over a tile the player no longer holds.
- Under Coal Baron the hand holds tiles the decision does not offer: only offered tiles may be picked, in the panel and on the Terrain tab.
- R and Shift+R must not turn anything while no tile and hex are chosen, while another decision is open, or while the player types in a text field or holds Ctrl, Alt or Meta (browser shortcuts).
- A tile that scores 0 everywhere still shows "+0 VP" tags, never an empty tag or "+null".
- The hex the player chose carries the VP of the current turn, while the other lit hexes keep the tile's best; turning must update both the map tag and the panel tag together.
- A hand of 11 tiles (the most random games offered) wraps the row to several lines: Explore must stay visible in the docked panel, scrolling the tiles rather than pushing the buttons off screen.

---

### Task 1: The explore module

**Files:**
- Modify: `src/lib/area/explore.js` (keep `exploreChoices` until Task 4 removes it)
- Modify: `src/lib/describe.js` (export the private `turned(turns)` as `describeTurn`)
- Test: `tests/client-area-explore.test.mjs` (add tests; the existing `exploring()` fixture holds tiles 2, 5 and 17)
- Test: `tests/client-prompts.test.mjs` (the random-games loop)

**Interfaces:**
- Produces, in `src/lib/area/explore.js`:
  - `exploreTiles(decision) → number[]`: the distinct tiles in `decision.answers`, ascending.
  - `tileScores(game, decision, hex) → Record<number, { vp: number, orient: number }>`: each offered tile's best VP and best turn on `hex`.
  - `hexScores(game, decision, tile) → Record<string, { vp: number, orient: number }>`: that tile's best VP and best turn on every hex in `decision.answers`.
  - `exploreIndex(decision, { tile, hex, orient }) → number`: the index in `decision.answers`, or −1.
  - `tilePreview(tile, orient) → { corners: Terrain[], island: Terrain[], clouds: boolean, volcano: boolean }`.
  - `tileWords(tile) → string`: "Territory tile: forest, mountain and sea", then ", island of desert", ", with clouds", ", with a volcano" when they apply; terrains in the order of first appearance in the printed corners, the last two joined by "and".
  - `exploreLine(hex, orient) → string`: `Hex ${hexName(hex)}`, then `, ${describeTurn(orient)}` when orient > 0, using `hexName` from `src/lib/hexmap.js`.
- Produces, in `src/lib/describe.js`: `describeTurn(turns) → string` ('' for 0, 'turned once', 'turned twice', 'turned n times').

- [ ] **Step 1: Write the failing tests** in `tests/client-area-explore.test.mjs`:
  - `'exploreTiles lists each offered tile once, lowest first'`: `assert.deepEqual(exploreTiles(decision), [2, 5, 17])`.
  - `'a Coal Baron explore offers only its tile'`: the fixture with effects `[{ explore: { tile: 5 } }]`; `assert.deepEqual(exploreTiles(decision), [5])`.
  - `'tileScores gives each tile its best VP on a hex and the lowest turn that scores it'`: for each tile and the first answer's hex, `vp` equals the maximum of `matchingSides(state, hex, tile, o)` over o = 0..5, and `orient` is the lowest o reaching it.
  - `'hexScores gives a tile its best VP and turn on every lit hex'`: its keys equal the set of `decision.answers` hexes; each value checked as above.
  - `'exploreIndex finds the one answer for a tile, hex and turn, and -1 for anything else'`: for every i, `exploreIndex(decision, decision.answers[i]) === i`; a tile not held, a hex not lit and orient 6 give −1.
  - `'tilePreview turns the printed corners and keeps the island, clouds and volcano'`: tile 17 at orient 1 equals `turned(TERRITORY_TILES[16].corners, 1)` and its island.
  - `'tileWords names the terrains, not the number'`: the result for a tile with an island contains "island of" and does not contain the tile number; a cloud tile's ends ", with clouds".
  - `'exploreLine names the hex and the turn'`: `exploreLine('-1_-1', 0) === 'Hex −1,−1'`, `(…, 1) === 'Hex −1,−1, turned once'`, `(…, 2)` ends "turned twice", `(…, 4)` ends "turned 4 times".
- [ ] **Step 2: Add to the random-games loop** in `tests/client-prompts.test.mjs`, for `decision.kind === 'chooseExplore'`: the set `exploreTiles(mine)` × the keys of `hexScores(game, mine, exploreTiles(mine)[0])` × orients 0–5, mapped through `exploreIndex`, hits every index of `mine.answers` exactly once and never −1. Count the explores checked and assert the count is above 0 after the loop.
- [ ] **Step 3: Run** `npx vitest run tests/client-area-explore.test.mjs tests/client-prompts.test.mjs`; expect the new tests to fail with "is not a function" (not exported).
- [ ] **Step 4: Implement** the functions and `describeTurn`; make `describeTile` use `describeTurn`. Scores use `matchingSides(game, hex, tile, orient)` from `../engine/game.js`.
- [ ] **Step 5: Run** the same command; expect all to pass. Run `npm run check`; expect 0 errors.
- [ ] **Step 6: Commit** `Refs #74: score tiles and hexes for the explore prompt`.

### Task 2: TilePicker and TurnControl

**Files:**
- Create: `src/lib/components/prompts/TilePicker.svelte`, `src/lib/components/prompts/TurnControl.svelte`
- Create: `src/library/sections/prompts/TilePicker.svelte`, `src/library/sections/prompts/TurnControl.svelte`
- Modify: `src/lib/components/README.md` (two rows)

**Interfaces:**
- Consumes: `tilePreview`, `tileWords` (Task 1) — in the library sections only; the components take plain data.
- Produces:
  - `TilePicker` props: `tiles: { id: number, label: string, corners: Terrain[], island: Terrain[], clouds?: boolean, volcano?: boolean, vp?: number | null }[]`, `selected: number | null = null`, `onTilePickerSelect` → `ComponentEvent` with `{ tile: number }`. Root: `<div role="group" aria-label="Your tiles">`. Each tile is a `<button type="button" aria-pressed data-id="tile-{id}">` whose `aria-label` is the tile's `label` (the parent passes `tileWords(id)`), plus ", up to N VP on this hex" when `vp` is a number; the `TerritoryTile` inside (size about 34, so a tile button is about 88×80px) is `aria-hidden`. A number `vp` shows as a corner tag "+N" (gold; "+0" in the line colour). Picked: 2px gold outline and a gold tint.
  - `TurnControl` props: `vp: number | null = null`, `onTurnControlTurn` → `ComponentEvent` with `{ step: -1 | 1 }`. Renders ↺ (`aria-label="Turn the tile back"`, title "Turn back (Shift+R)"), the tag ("No hex yet" muted when `vp` is null, else "+N VP" in gold), ↻ (`aria-label="Turn the tile"`, title "Turn (R)"), and the hint "R turns it". Both buttons are disabled while `vp` is null.

- [ ] **Step 1: Write the failing check.** `tests/library.test.mjs` fails a component without a library section, so create the two components first as shells with their `<script module>` typedefs and run `npx vitest run tests/library.test.mjs`; expect it to fail naming the two missing sections.
- [ ] **Step 2: Build the components** and their library sections. TilePicker's section shows: nothing picked (3 tiles); one picked; with VP tags including a 0; one tile alone and picked; 11 tiles in a 296px-wide box (the docked panel's content width), wrapping; and an interactive example reporting `onTilePickerSelect`. TurnControl's section shows `vp={null}`, `vp={3}`, `vp={0}`, and an interactive example that turns a counter.
- [ ] **Step 3: Run** `npx vitest run tests/library.test.mjs tests/styles.test.mjs` and `npm run check`; expect them to pass. Open `/components.html#tile-picker` and `#turn-control` with `npm run dev` running, Tab through the buttons, and check focus is visible and Space and Enter press them.
- [ ] **Step 4: Commit** `Refs #74: add TilePicker and TurnControl`.

### Task 3: Scores on the World Map

**Files:**
- Modify: `src/lib/components/board/WorldMap.svelte`
- Modify: `src/library/sections/board/WorldMap.svelte`

**Interfaces:**
- Produces: `WorldMap` prop `scores: Record<string, number> = {}`. For each key that is also in `targets`, a tag "+N VP" (gold fill, ink text, bold, about 15px at the reference map size) sits centred near the top of the hex, above the outlines, `pointer-events: none`, `aria-hidden`; the target's `aria-label` gains `, up to N VP`.

- [ ] **Step 1: Add a library example first**: the existing "Choose a hex to explore" example's targets with `scores` of 3, 2 and 0, labelled `scores={{ … }}  (each lit hex shows the best VP the picked tile scores there)`. Run `npm run check`; expect an error: `scores` is not a prop of `WorldMap`.
- [ ] **Step 2: Implement** the prop and the tags (SVG `<g>` with a `<rect>` and `<text>`, after the outline overlays so nothing covers them).
- [ ] **Step 3: Run** `npm run check` and `npx vitest run tests/library.test.mjs tests/styles.test.mjs tests/client-hexmap.test.mjs`; expect pass. Look at the example at 1920×1080: the tags sit inside their hexes and read clearly over the unexplored picture.
- [ ] **Step 4: Commit** `Refs #74: show each lit hex's VP on the World Map`.

### Task 4: The explore prompt in the game

**Files:**
- Modify: `src/screens/Game.svelte`
- Modify: `src/lib/area/explore.js` (remove `exploreChoices`)
- Modify: `tests/client-area-explore.test.mjs` (remove the `exploreChoices` tests)
- Modify: `src/library/sections/prompts/DecisionPanel.svelte` (an explore example)

**Interfaces:**
- Consumes: Task 1's functions, `TilePicker`, `TurnControl`, `WorldMap`'s `scores`.
- Produces: nothing other tasks import; Task 5 reuses the `exploreTile` state and the tile pick handler named here.

- [ ] **Step 1: State.** Beside `mapPick` add `exploreTile = $state(null)` (a tile number) and `exploreOrient = $state(0)`. In the effect that resets on `decisionKey`, also reset both, then, for a `chooseExplore` whose `exploreTiles()` has one tile, set `exploreTile` to it.
- [ ] **Step 2: Derived values** for a `chooseExplore` (`prompt?.kind === 'chooseExplore'`): `exploreRow` (each offered tile: `tilePreview(id, 0)`, `label: tileWords(id)`, `vp` from `tileScores(game, decision, mapPick)` when `mapPick` is set, else null); `mapScores` (when `exploreTile` is set: `hexScores(…)` best VP per hex, with `mapPick`'s value replaced by `matchingSides` at the current turn); `preview` (when both are set: `{ hex: mapPick, ...tilePreview(exploreTile, exploreOrient) }`); `exploreCurrent` (that VP, or null).
- [ ] **Step 3: Handlers.** One function `pickExplore()` sets `picked = exploreIndex(…)` (null when −1) after any change. `mapSelectHandler` for an explore: set `mapPick`; if `exploreTile` is null set it to `exploreTiles()[0]`; set `exploreOrient` to that tile's best turn there. `tilePickHandler(event)`: set `exploreTile` to `event.value.tile`; if `mapPick` is set, move `exploreOrient` to its best turn there. `turnHandler(event)`: `exploreOrient = (exploreOrient + event.value.step + 6) % 6`. `keyHandler`: on R (Shift+R steps −1) while an explore has a tile and a hex, the event's target is not an `input`, `textarea`, `select` or content-editable element, and no Ctrl, Alt or Meta is held; `preventDefault()`.
- [ ] **Step 4: The panel.** For an explore, `promptContent` renders the lead line, "Your tiles · n", `TilePicker` (`tiles={exploreRow}`, `selected={exploreTile}`), the chosen line (copy in Global Constraints; the third form is `exploreLine(mapPick, exploreOrient)`), and `TurnControl vp={exploreCurrent}`; `children` is passed for an explore even though `panelOptions` is empty. `status` is `exploreLine(…)` once both are chosen, else the instruction. No `cancelLabel` for an explore. `WorldMap` gets `scores={mapScores}`. Delete the `explore` derived value, its branch in `panelOptions`, and `exploreChoices` with its tests.
- [ ] **Step 5: Library.** `DecisionPanel`'s section gains `docked  (an explore: the player's tiles, the chosen hex and the turn)` with a static `TilePicker` (one tile picked, VP tags) and `TurnControl vp={3}` inside, and a second docked example with 11 tiles in a box 700px tall: Explore stays visible, the content scrolls.
- [ ] **Step 6: Run** `npm run check`, `npx vitest run tests/client-area-explore.test.mjs tests/client-prompts.test.mjs tests/library.test.mjs`, and `npx playwright test tests/browser/setup-prompts.test.mjs tests/browser/library.test.mjs`; expect pass. Drive a game to an explore with the API (as Task 6's helper does) and click through: tile first, hex first, R, Shift+R, a second hex, Explore.
- [ ] **Step 7: Commit** `Refs #74: choose the tile, the hex and the turn to explore`.

### Task 5: Tiles on the Terrain tab

**Files:**
- Modify: `src/screens/game/PlayerTabs.svelte`
- Modify: `src/screens/Game.svelte`

**Interfaces:**
- Consumes: Task 4's `exploreTile` and `tilePickHandler`.
- Produces: `PlayerTabs` props `tilePick: { tiles: number[], selected: number | null } | null = null` and `onPlayerTabsTile` → `ComponentEvent` with `{ tile }`.

- [ ] **Step 1: Implement.** While `tilePick` is set, each In hand territory tile whose id is in `tilePick.tiles` is wrapped in `<button type="button" aria-pressed data-id="terrain-tile-{id}" aria-label={tileWords(id)}>`, outlined in gold when pressed; the others stay plain. `Game.svelte` passes `tilePick` for the viewer's explore (`{ tiles: exploreTiles(decision), selected: exploreTile }`) and routes `onPlayerTabsTile` to `tilePickHandler`.
- [ ] **Step 2: Run** `npm run check` and `npx playwright test tests/browser/player-area.test.mjs`; expect pass. In the same API-driven game, open the Terrain tab during the explore, pick a tile there, and see the panel's pick follow.
- [ ] **Step 3: Commit** `Refs #74: pick the tile to explore on the Terrain tab too`.

### Task 6: The browser test

**Files:**
- Create: `tests/browser/explore-prompt.test.mjs`

**Interfaces:**
- Consumes: `data-id="tile-{id}"` on `TilePicker` buttons; the map's `.rg-world-map--target` elements and their `aria-label` ("Hex −1,−1: …"); `exploreTiles`, `matchingSides`, `openDecisions` and `hexName` from the source tree.

- [ ] **Step 1: Write the test** `'an explore offers every tile, and places the one the player picks in the turn they choose'`:
  - Log in, create a hot-seat table, add Ben, start, as `tests/browser/setup-prompts.test.mjs` does.
  - Through the API, answer every open decision with this policy until a seat's open `chooseExplore` offers at least two tiles: an answer mentioning `"exploration"`, else one mentioning `"advance"`, else the first (it reaches one within about 15 moves; fail after 400).
  - Open the page, take the screen for that seat, and expect the tiles group to show one button per offered tile, none pressed, and the Explore button disabled.
  - Click the first lit hex. Expect the first tile pressed and Explore enabled.
  - From the seat's view, pick the tile whose best VP on that hex is lowest (ties: the highest number, so it differs from the first tile); click its `tile-{id}` button. Press `r` once.
  - Click Explore; then, through the API, expect `game.hexes[hex].tile` to be that tile and `orient` its best turn plus one, mod 6.
  - In `finally`, end and leave the table.
- [ ] **Step 2: Run** `npx playwright test tests/browser/explore-prompt.test.mjs`; expect pass (it fails on `main` before Task 4: no tile buttons).
- [ ] **Step 3: Commit** `Refs #74: a browser test explores with the tile the player picks`.

### Task 7: Documentation and screenshots

**Files:**
- Modify: `README.md` (the explore screenshot's alt text), `docs/ui/screens/game-prompt-explore.png`, `docs/ui/README.md` (the line "**The map:** choosing a territory lists its answers…" and the screenshot's place), `CLAUDE.md` (#74 under "Where the work stands", and `explore-prompt.test.mjs` in the browser tests line)

- [ ] **Step 1: Retake** `docs/ui/screens/game-prompt-explore.png` at 1920×1080 from the running game: a tile picked, a hex chosen, the tags on the lit hexes. Update the alt text to describe it ("An explore: the player's tiles in the panel, each lit hex with the picked tile's best VP, and the chosen hex previewing it turned once").
- [ ] **Step 2: Update** `docs/ui/README.md` and `CLAUDE.md` as listed.
- [ ] **Step 3: Run** `npm test`; expect every unit and browser test to pass.
- [ ] **Step 4: Commit** `Refs #74: the README shows the new explore prompt` (or `Fix #74: …` once the owner has looked at the library sections).
