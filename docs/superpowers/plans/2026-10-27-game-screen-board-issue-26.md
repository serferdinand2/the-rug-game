# The game screen and the shared board (#26) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A started game shows the play screen: header, the Advancement Tracks and the real World Map, the footer turn (income or advance with its payment), a plain prompt for every other decision, and Your overview.

**Architecture:** Plain, tested modules turn the room view into what the components draw (`board.js`, `hexmap.js`, `turn.js`, `describe.js`, `clock.js`). Legal advances and payments come from the engine run on the viewer's own view. `Game.svelte` composes the existing components with three new ones (`AchievementStrip`, `TurnClock`, a rebuilt `WorldMap`) and the screen parts in `src/screens/game/`.

**Tech Stack:** Svelte 5 (runes), Vite 8, Node 22 ES modules with JSDoc, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-27-game-screen-board-design.md`

## Global Constraints

- CONVENTIONS.md and the #25 constraints: JSDoc, braces, Prettier on touched files only, `npm run check` 0/0, tokens only, BEM `rg-` classes, `on{Component}{Action}` with `ComponentEvent`, a library section and README row for every new or changed component.
- The client decides no rule: legal choices are the engine's `answers` or the engine's own functions run on the viewer's view.
- Hex `a_b` sits at x = 1.5·s·(b − a), y = (√3/2)·s·(a + b); corner 0 is the top-left vertex, clockwise; side e runs from corner e to corner e + 1 and faces `HEX_SIDES[e]`.
- Commits `Refs #26: …`, the last `Fix #26: …`, each with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A player with several ways to pay for an advance: the panel lists each, and the one confirmed is the one paid.
- A decision for the viewer on someone else's turn (a trap response): the footer and panel ask the viewer, not the current player.
- A map decision (explore): the map opens, only the legal hexes are buttons, and the answer sent matches the hex chosen.
- A timed table: the clock counts down from the server's time, not the browser's, and warns the asked player in the last 5 seconds.
- A finished game: the footer says the game is over and no prompt opens.

---

### Task 1: Words for effects, costs and answers (`describe.js`)

**Files:** Create `src/lib/describe.js`, `tests/client-describe.test.mjs`.

**Produces:** `describeEffects(effects, { state? }) → string`, `describeCost(cost) → string`, `describeAnswer(decision, answer, view) → string`, `decisionTitle(decision) → string`.

- [ ] Tests:
  - `describeCost({ food: 1, any: 1 })` is "1 food and 1 resource of your choice";
  - `describeEffects([{ gain: { coin: 1, culture: 1 } }])` is "Gain 1 coin and 1 culture";
  - every benefit and bonus of every track space describes to a non-empty sentence without "undefined" or "[object";
  - over 20 random games, every open decision's title and every one of its answers describe the same way;
  - payments read "Pay 1 food and 1 worker"; a landmark plot "Row 3, column 5, turned once".
- [ ] Implement over the effect vocabulary in `data/effects.js` and the decision kinds in `kinds.js`. Unknown shapes fall back to a readable generic sentence, never JSON.
- [ ] Commit.

### Task 2: The hex map (`hexmap.js`, `WorldMap`)

**Files:** Create `src/lib/hexmap.js`, `tests/client-hexmap.test.mjs`. Rewrite `src/lib/components/board/WorldMap.svelte` and its library section. Update `BoardSwitcher` only if needed.

**Produces:** `hexCenter(key, size) → [x, y]`, `hexCorner(center, k, size) → [x, y]`, `cornerWedge(center, k, size) → [x, y][]`, `mapHexes(view) → MapHex[]` (`{ key, center, corners: Terrain[] | null, island: Terrain[], outposts, tokens, label }`), `fitBox(hexes, size) → { x, y, width, height }`. `WorldMap` props: `hexes: MapHex[]`, `targets?: string[]`, `selected?: string | null`, `label`; callback `onWorldMapSelect({ hex })`.

- [ ] Tests: side e of each hex points at the neighbour `HEX_SIDES[e]` (the midpoint of corners e and e + 1 lies on the line to that neighbour's centre); start 1 of the large map is the topmost start and starts run clockwise; `mapHexes` on a dealt 4-player view gives 61 hexes, 25 explored, and the start outposts in their seats; a toppled outpost keeps `toppled`.
- [ ] `WorldMap`: one `<polygon>` wedge per corner, the island, the dashed unexplored hexes, pieces (squares, toppled lying, tokens as circles), targets as buttons (`role="button"`, `tabindex="0"`, Enter/Space), others dimmed while targets are set.
- [ ] Library: the small map and the large map from dealt games, and one with targets.
- [ ] Commit.

### Task 3: The tracks and the achievements (`board.js`, `TrackSpace`, `AchievementStrip`)

**Files:** Create `src/lib/board.js`, `tests/client-board.test.mjs`, `src/lib/components/board/AchievementStrip.svelte` and its section. Modify `TrackSpace`, `Track`, `TrackBoard` (an `available` set) and their sections.

**Produces:** `trackBoard(view, available) → TrackBoardTrack[]` (names, tier symbols from `TIER_COSTS`, landmarks while in `state.landmarks`, lanes at each player's furthest token); `achievements(view) → { id, name, vp, claimed: Seat[] }[]`; `TrackBoard` prop `available: { track, space }[]`; `TrackSpace` prop `available` (green outline, named in its label).

- [ ] Tests: four tracks of 12 spaces; tier II of exploration is `['food', 'any']`; a taken landmark is gone from its space; a player's lane is their furthest token; achievements list claimants in order and the next VP from the map size.
- [ ] Implement, with the library sections showing available spaces and the strip with claimants.
- [ ] Commit.

### Task 4: The turn (`turn.js`)

**Files:** Create `src/lib/turn.js`, `tests/client-turn.test.mjs`. Modify `src/lib/engine/game.js` (export `advances`).

**Produces:** `myDecision(view, seat) → Decision | null` (first open with `player === seat` and `answers`); `advanceOptions(view, seat) → { track, from, to, payments: Payment[] }[]` (from `advances` and `DECISIONS.chooseAdvance.answers` on the view, while chooseTurn or chooseAdvance is open); `askedSeats(view) → number[]`.

- [ ] Tests: over 40 random games, whenever chooseAdvance opens, the preview taken just before (at chooseTurn) equals its answers; `myDecision` picks the defender's chooseResponse on the attacker's turn; setup gives each seat its own lane decision.
- [ ] Implement.
- [ ] Commit.

### Task 5: The clock (`clock.js`, `TurnClock`)

**Files:** Create `src/lib/clock.js`, `tests/client-clock.test.mjs`, `src/lib/components/ui/TurnClock.svelte` and its section.

**Produces:** `timeLeft(clock, serverNow, receivedAt, now) → ms`, `formatClock(ms) → '1:42'`; `TurnClock` props `seat`, `ms`, `running`, `warn` (red and "5 s left").

- [ ] Tests: a running clock counts down from `ends − serverNow` by the browser time since the answer arrived; a paused one shows `left`; `formatClock(4_200)` is "0:05"; never negative.
- [ ] Implement, with the section showing running, paused and warning.
- [ ] Commit.

### Task 6: Moves in the store

**Files:** Modify `src/lib/game.svelte.js`, `src/lib/changes.js` if needed. Test: `tests/client-api.test.mjs`.

**Produces:** store `move(action) → Promise<boolean>` (POST move with the version and, at a hot-seat table, the seat; a 409 fetches the newer table and says "The table changed. Try again."); `undo()`; `seatShown` (hot-seat: the lowest asked seat; the poll asks `state?seat=`); `receivedAt` for the clock.

- [ ] Test (api level, through `createApi`): two guests start a game and answer setup and a first income turn with `move` bodies built from `myDecision` answers.
- [ ] Implement in the store; the poll passes `seat` at a hot-seat table.
- [ ] Commit.

### Task 7: The play screen

**Files:** Create `src/screens/Game.svelte`, `src/screens/game/GameHeader.svelte`, `SharedBoard.svelte`, `DecisionPanel.svelte`, `PlainPrompt.svelte`, `YourOverview.svelte`. Modify `src/App.svelte`. Delete `src/screens/Holding.svelte`.

- [ ] Header with chips, clock, Undo, sound and menu (How to play, Leave table); middle 3/4 + 1/4; shared head with the switcher and the achievements; the TrackBoard with available spaces from `advanceOptions`; the WorldMap from `mapHexes`; the footer tones of spec §6; the decision panel with the payment list and the plain prompt; Your overview.
- [ ] Map decisions (`chooseExplore`, `chooseConquer`, `chooseHex`, and `choosePlacement` with `hex`) light up their hexes and switch to the map.
- [ ] `npm run check` 0/0; `npm test` green.
- [ ] Commit.

### Task 8: Walkthrough, screenshots and documents

- [ ] Two tabs: setup picks through the plain prompt; income turn 1; an advance with a payment choice; a map decision; Undo; a timed table's clock; leave and return.
- [ ] Screenshots of the tracks and the map from the running game into `docs/ui/screens/`; README "Current interface" and `docs/ui/README.md` updated; CLAUDE.md #26 entry, Architecture and Next.
- [ ] Commit `Fix #26: …`.
