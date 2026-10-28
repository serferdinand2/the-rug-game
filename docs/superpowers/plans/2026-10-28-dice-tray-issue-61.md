# Rolling dice for the whole table (#61) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every die roll tumbles in a tray over the middle of every screen at the table, lands on the rolled faces under a caption, and gets out of the way.

**Architecture:** A plain module `src/lib/dice.js` turns fresh events into rolls (dice, faces, caption, spoken result). Three style C die bodies join the art catalog. `Die.svelte` draws a body with its face; `DiceTray.svelte` plays a batch of rolls one after another and fades. `App.svelte` draws the tray above whichever screen is on show, from the store's fresh events; `cueFor()` gains a `dice` cue.

**Tech Stack:** Svelte 5 (runes) with JSDoc, Vite, Vitest, Playwright (Chromium), the style C painter in `tools/art/`.

**Spec:** `docs/superpowers/specs/2026-10-28-dice-tray-design.md`

## Global Constraints

- CONVENTIONS.md throughout: JSDoc, Prettier, braces, one-line file comments, component structure, BEM `rg-` classes, tokens for colours, `npm run check` clean, a library section and README row per component.
- No `Math.random()` in game logic; the tray's tumble may vary only its CSS, never the faces.
- Only rolls in the store's fresh events play; a refresh never replays one.
- The tray never takes the focus, and passes clicks outside its own box through.
- Reduced motion: no tumble, the faces at once.
- Art: palette colours only, no lettering, 32×32, one path per colour.
- Commits reference the issue: `Refs #61: …`.

## Review Focus

1. **A batch with a roll and a decision** (a conquest's dice, then `chooseDie`): the tray must not cover the decision panel's buttons or take its focus. Pinned in Task 6 (the panel's Confirm stays clickable while the tray shows).
2. **Several rolls in one batch** (Empiricism's two science dice): they play in event order, one at a time. Pinned in Task 2 and Task 4.
3. **A refresh mid-roll**: the roll doesn't play again. Pinned in Task 6.
4. **The public view and other seats**: a roll by another player shows with their name. Pinned in Task 2 ("Vera rolls…") and Task 6 (both screens).
5. **An Alchemists bust**: the rolled face shows and the caption says it busts. Pinned in Tasks 1 and 2.

---

### Task 1: The bust names its track

**Files:** Modify `src/lib/engine/civs/alchemists.js`; test in the Alchemists engine test file (`tests/engine-civ*.test.mjs`, the one testing `alchemistsBust`).

- [ ] Write the failing assertion: the `alchemistsBust` event carries `track`, one of the four tracks, equal to the rolled face.
- [ ] Run it — FAIL. Add `track` to the event. Run — PASS; the views test (`tests/helpers/views.mjs` via the simulation) still passes.
- [ ] Commit `Refs #61: an Alchemists bust names the track it rolled`.

### Task 2: Rolls from events

**Files:** Create `src/lib/dice.js`, `tests/client-dice.test.mjs`.

**Produces:**
- `@typedef {{ die: 'science' | 'red' | 'black', face: number }} RolledDie`
- `@typedef {{ id: string, player: number, dice: RolledDie[], caption: string, spoken: string, bust: boolean }} Roll` — `id` is the event's `seq`
- `rollsOf(events, game, viewer): Roll[]` — in event order; `scienceDieRolled` → one science die, `conquerDiceRolled` → red then black, `alchemistsRolled` and `alchemistsBust` → one science die (`bust` true for the bust). The science face is the first index of `SCIENCE_DIE` with the event's track.
- `faceOf(die, face): { kind: 'track', id } | { kind: 'vp', words } | { kind: 'resource', id } | { kind: 'tile' }` — science: the track; red: `'4 VP'`…`'7 VP'` or `'1 VP / territory'`; black: the resource or the tile benefit.

- [ ] Tests: each event becomes its roll; the captions read "Vera rolls the science die", "Vera rolls the conquer dice", "Vera rolls for the Alchemists", "Vera rolls for the Alchemists and busts", and "You roll …" for the viewer; `spoken` reads like the log ("Vera rolled the conquer dice: red 5 VP, black food."); two science rolls in one batch stay in order; every face of each die (12 + 6 + 6) gives what `SCIENCE_DIE`, `RED_DIE` and `BLACK_DIE` say; other events give no roll.
- [ ] Run — FAIL (no module). Implement. Run — PASS; `npm run check` clean.
- [ ] Commit `Refs #61: rolls from the dice events`.

### Task 3: The die bodies

**Files:** Create `tools/art/drawings/die/science-body.js`, `red-body.js`, `black-body.js`; modify `src/lib/art/catalog.js` (the `die` list), `tests/art-catalog.test.mjs` (counts), `tests/art-approved.test.mjs` (the placeholder test); run `npm run art` → `static/art/die/*-body.svg`.

- [ ] Update the two tests first: the `die` group's base count grows by 3 and the icon total by 3; the placeholder test refuses `die/` drawings other than `die/science-body`, `die/red-body`, `die/black-body`. Run — FAIL.
- [ ] Add the three ids (`['science-body', 'Science die']`, `['red-body', 'Red die']`, `['black-body', 'Black die']`) and the drawings: `createCanvas(32, 32)`, palette colours (`ink` outline; `creamLight`/`cream`/`creamShade`; `brickRedLight`/`brickRed`/`brickRedShade`; `roof`/`roofShade`/`night`), a light top-left and a shaded bottom-right edge; the science die a pentagon face (point up) inside a ring of darker facets. Run `npm run art`, then the art tests — PASS.
- [ ] Commit `Refs #61: style C die bodies for the science and conquer dice`.

### Task 4: Die and DiceTray

**Files:** Create `src/lib/components/board/Die.svelte`, `src/lib/components/board/DiceTray.svelte`, their library sections in `src/library/sections/board/`, README rows.

**Produces:**
- `Die`: props `die`, `face`, `size = 72`, `rolling = false`; draws the body (`/art/die/<die>-body.svg`) with the face on top (track symbol art, a VP label, a resource icon, or "?"), `aria-hidden`.
- `DiceTray`: props `rolls: Roll[]`, `batch: number` (a new value starts playing `rolls`), `onDiceTrayDone`; plays each roll for `TUMBLE_MS = 1000` (rolling) then `HOLD_MS = 1500` (landed), in order, then fades; a click on the tray or Escape ends the batch; a live region (`role="status"`) reads each roll's `spoken` once; reduced motion skips the tumble; fixed over the screen's centre, `pointer-events` only on its box, nothing focusable.

- [ ] Library sections first (every face of each die; a tray playing a two-roll batch on a button press; reduced motion described), then `npx vitest run tests/library.test.mjs` — FAIL until the components exist. Implement. Library and style tests PASS; `npm run check` clean. Look at the sections at 1920×1080.
- [ ] Commit `Refs #61: Die and DiceTray`.

### Task 5: The tray on every screen, with its cue

**Files:** Modify `src/App.svelte`, `src/lib/sound.js`, the sound test (`tests/client-sound*.test.mjs`).

- [ ] Sound test first: a batch with `conquerDiceRolled` earns `dice` (after `reward`, before `turn`); `CUES.dice === 'drop_001'`. Run — FAIL. Implement. PASS.
- [ ] `App.svelte` draws `<DiceTray rolls={rollsOf(store.fresh, game, seat)} batch={store.freshCount} />` over every screen while a game is on (the game, the pass screen, the results' review), keyed so a refresh (fresh empty) plays nothing.
- [ ] Commit `Refs #61: the dice tray rolls on every screen, with a dice cue`.

### Task 6: Both screens see the roll

**Files:** Create `tests/browser/dice-tray.test.mjs`.

- [ ] Test: an online table of two players (two logins, the second joins); through the API, play on until a seat's open decision is `chooseConquer`; open both players' screens (two browser contexts); answer the conquest through the API; on both screens the tray shows the red and black dice with the caption "<name> rolls the conquer dice" ("You roll…" on the roller's), and the faces' accessible text matches the event; the roller's decision panel Confirm stays clickable while the tray shows; reloading the page doesn't show the tray again. End and leave the table (both players).
- [ ] Run — PASS against Tasks 1–5 (fix what it finds).
- [ ] Commit `Refs #61: a browser test sees a conquest's dice on both screens`.

### Task 7: Documentation and screenshots

- [ ] README "Current interface" and `docs/ui/screens/game-dice-tray.png` (the running game, the tray landed on a conquest), `docs/ui/README.md`, components README, `docs/architecture.md` (`dice.js`), `docs/status.md`, CLAUDE.md.
- [ ] `npm test`-equivalent (unit + e2e) and `npm run check` — PASS.
- [ ] Commit `Refs #61: the README and docs show the dice tray`.
