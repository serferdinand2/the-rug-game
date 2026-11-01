# Plans & Ploys content, part 1: the tapestry and response cards (#33) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A table with Plans & Ploys on deals its 13 tapestry cards with the base 50, every one playable, and the five response cards answer conquests and traps.

**Architecture:** The 13 cards join `TAPESTRY_CARDS` with an `expansion` field; rules that are not plain effects get their own effect kinds (`effects/pp-cards.js`) or THIS ERA hooks (`eras.js`). Response rules move into a new `responses.js`; the response question now carries the conquest's dice and pushes them once answered, so a counter step (`chooseCounter`) can sit between a Trap and its effect. Parts 2 (the civilizations) and 3 (the variant, How to play, docs) get their own plans after this lands.

**Tech Stack:** plain JavaScript with JSDoc (no TypeScript), Svelte 5 client, Vitest with `node:assert/strict`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-plans-ploys-content-design.md` (§4–§6, §10–§11).

## Global Constraints

- docs/conventions.md throughout: a one-line comment at the top of each file, JSDoc on exports, braces on every `if`, Prettier (tabs, single quotes), `npm run check` 0 errors and 0 warnings.
- Engine functions stay pure; a player's mistake throws `PlayerError`; no `Math.random()` (use `ctx.random`).
- A base game is unchanged: without `'pp'` no new card is dealt and no random draw is added or reordered.
- Cite rule ids in comments and test names (R21, R45, R108, and #17's privacy ruling).
- Card names and numbers are 03 §1.4's exactly: Astronomy 2 space tiles; Cartography at least 3 VP; Public Works 3 VP; Status Quo up to 4 tiers; Double Cross 5 VP (as a tapestry 9 VP and 1 territory tile); Retreat 1 worker (R45; as a tapestry 9 VP and 1 tapestry card); Stolen Plans as a tapestry 8 VP and invent 1; Surprise Party 15 VP (as a tapestry 10 VP or 1 armory); Surrender as a tapestry 7 VP and any 1 resource; World's Fair 1 culture.
- Commits reference the issue: `Refs #33: …`, with the Co-Authored-By line.

## Review Focus

- A response or counter answered by the timer or by `declineOnly` (no human answer) must still roll the conquest's dice: tested in Task 6 and Task 7.
- A defender holding only cards they can't play now (Retreat with no adjacent territory, Surprise Party while behind on military) is still asked, and is the one `declineOnly` declines (#17's privacy): Task 6.
- Undo after Stolen Plans must be refused, since a hidden card was shown: Task 7.
- A card whose action finds nothing to do (Manifest Destiny with no target, Cartography whose tile can't be placed, Status Quo with no bonus) ends without a stuck decision: Task 3.
- A seeded base game deals and plays exactly as before: Task 5.

---

### Task 1: Each seat's starting territory

**Files:**
- Modify: `src/lib/engine/setup.js` (`newSeat`, `placeOutposts`)
- Modify: `src/lib/engine/state.js` (the seat typedef)
- Test: `tests/engine-setup.test.mjs`

**Interfaces:**
- Produces: `seat.start: string | null`, the hex key where the seat's two outposts began (null before setup places them). Manifest Destiny (Task 3) and the Infiltrators (part 2) read it.

- [ ] **Step 1: Write the failing test** `each seat records the territory its two outposts started on (#33)`: for `startedGame(3)` and for `startedGame(2, { variants: ['closest-island'] })`, every player seat's `start` is a hex whose `outposts` include two of that seat's outposts at setup (read from the `outpostsPlaced` event with `count: 2`).
- [ ] **Step 2: Run** `npx vitest run tests/engine-setup.test.mjs -t "started on"`. Expected: FAIL (`start` undefined).
- [ ] **Step 3: Implement**: `newSeat` sets `start: null`; `placeOutposts` sets `playerSeat(state, player).start = hex`. Document the field in the seat typedef.
- [ ] **Step 4: Run** `npx vitest run tests/engine-setup.test.mjs tests/engine-views.test.mjs`. Expected: PASS (fix any seat-shape snapshot the field changes).
- [ ] **Step 5: Commit** `Refs #33: each seat records its starting territory`.

### Task 2: The card model, the response cards as tapestry cards, and Entertain the Masses

**Files:**
- Modify: `src/lib/engine/data/tapestry-cards.js` (typedef, `when`/`era` helpers, 6 cards, the trap's `response`)
- Modify: `src/lib/engine/data/landmarks.js` (the Stadium in `EXPANSION_LANDMARKS`)
- Modify: `src/lib/art/footprints.js` only if `stadium` is missing (`XXXX/XXXX`)
- Modify: `src/lib/engine/effects/tech.js` (`landmark`: a card source)
- Modify: `src/lib/cards/tapestry-text.js` (`TAPESTRY_RULES` and the note for every response card)
- Modify: `tests/engine-tapestry-data.test.mjs` (counts by expansion)
- Test: `tests/engine-pp-cards.test.mjs` (new), `tests/client-tapestry-text.test.mjs`

**Interfaces:**
- Produces: `TapestryCard.expansion: 'base' | 'pp'`; `TapestryCard.response?: 'conquest' | 'trap'` (`'conquest'`: a defender plays it against a conquest; `'trap'`: an attacker plays it against a Trap). The trap gets `response: 'conquest'`. `TapestryCard.name` may be given explicitly (World's Fair, Task 3).
- Produces: the cards `double-cross` (`[{ vp: 9 }, { gain: { territory: 1 } }]`, `'trap'`), `retreat` (`[{ vp: 9 }, { gain: { tapestry: 1 } }]`, `'conquest'`), `stolen-plans` (`[{ vp: 8 }, { invent: {} }]`, `'trap'`), `surprise-party` (`[{ choice: [[{ vp: 10 }], [{ building: 'armory' }]] }]`, `'conquest'`), `surrender` (`[{ vp: 7 }, { gain: { any: 1 } }]`, `'conquest'`), `entertain-the-masses` (`[{ landmark: 'stadium' }]`), all `expansion: 'pp'`, WHEN PLAYED, appended after the trap.
- Produces: `landmarksFor(['pp'])` includes `'stadium'` (source `{ card: 'entertain-the-masses' }`), so a P&P game has 25 landmarks.

- [ ] **Step 1: Write the failing tests** in `tests/engine-pp-cards.test.mjs`:
  - `the five response cards played as tapestry cards gain their printed reward (R45)`: `resolveTapestry` each on a `startedGame(2, { expansions: ['pp'] })` seat and `answerDefaults`; Double Cross +9 VP and +1 territory tile, Retreat +9 VP and +1 hand card, Stolen Plans +8 VP and +1 tech card, Surrender +7 VP and +1 resource; Surprise Party's first option +10 VP, its second gains an armory.
  - `Entertain the Masses gains the Stadium and places it; a copy finds none left`: the Stadium leaves `state.landmarks` and is in the capital or beside the mat; a second play emits `noLandmarkLeft`.
  - `a Plans & Ploys game has 25 landmarks, a base game 18 (#32 + Stadium)`.
  In `tests/client-tapestry-text.test.mjs`: `a response card reads as its response, and its note says what it gains as a tapestry card`: `describeTapestryCard('surrender').note` starts with `Played as a tapestry card on an income turn:`.
- [ ] **Step 2: Run** `npx vitest run tests/engine-pp-cards.test.mjs tests/client-tapestry-text.test.mjs`. Expected: FAIL (no such cards).
- [ ] **Step 3: Implement** the typedef fields, the six cards, the Stadium (also in the invariants' landmark count via `landmarksFor`), and the `landmark` effect's event: a card source (`op.source.card`) emits `{ card }` instead of `{ tech: true }`. `TAPESTRY_RULES` gains each response card's response text (03 §1.4, R45, in this file's voice); `describeTapestryCard` gives every card with `response` the trap's shape: `{ ability: TAPESTRY_RULES[id], note: 'Played as a tapestry card on an income turn: …' }`. Update `engine-tapestry-data.test.mjs`: the base cards (`expansion === 'base'`) still match `BASE_TAPESTRY`.
- [ ] **Step 4: Run** `npm run test:unit`. Expected: PASS, including the generic per-card tests (`engine-tapestry-all`, `client-game-cards`, `client-describe`, `client-game-names`), which now cover the six cards.
- [ ] **Step 5: Commit** `Refs #33: the response cards as tapestry cards, and Entertain the Masses with the Stadium`.

### Task 3: Astronomy, Cartography, Manifest Destiny, Status Quo and World's Fair

**Files:**
- Create: `src/lib/engine/effects/pp-cards.js`
- Modify: `src/lib/engine/effects/index.js` (register), `src/lib/engine/data/effects.js` (typedef, `EFFECT_KINDS`), `src/lib/engine/kinds.js` (new automatic kinds)
- Modify: `src/lib/engine/effects/conquer.js` and `src/lib/engine/map.js` (`conquer`'s `only` limit)
- Modify: `src/lib/engine/data/tapestry-cards.js` (5 cards), `src/lib/describe.js` (`CARD_RULES`), `src/lib/cards/tapestry-text.js`, `src/lib/decision-words.js` (purposes `manifestDestiny`, `cartography`, `statusQuo`)
- Test: `tests/engine-pp-cards.test.mjs`

**Interfaces:**
- Consumes: `seat.start` (Task 1); `gainTiles(ctx, player, 'territory', 1)` (`effects/gain.js`); `controlledTerritories` (`control.js`); `hexNeighbours` (`data/maps.js`); `tierOf(space)` (`data/tracks.js`); `spacesAdvanced(seat, track)` (`movement.js`); `askHex`, `askTrack`; `completeLines`, `completeDistricts`, `cityPlots` (`city.js`).
- Produces: effect kinds `astronomy`, `cartography`, `manifestDestiny`, `statusQuo`, `worldsFair` (each `{}`), each kebab-casing to its card id so `describe.js` names it; the conquer value gains `only?: string[]` (targets limited to these hexes); automatic kinds `cartographyCheck` (`{ tile }`), `statusQuoBonus` (`{ track }`).
- Produces: the cards `astronomy`, `cartography`, `manifest-destiny`, `status-quo`, `worlds-fair` (name `World's Fair`), WHEN PLAYED, `expansion: 'pp'`, each `[{ <kind>: {} }]` except World's Fair, `[{ gain: { culture: 1 } }, { worldsFair: {} }]`.

Rules (design §5):
- `astronomy`: gain 1 territory tile and explore with only it (`explore: { tile }`, as `coalBaron` does), then `gain: { space: 2 }`.
- `cartography`: gain 1 territory tile, explore with it, then `cartographyCheck`: read the player's last `explored` event for that tile; if its `vp` is at least 3, push `chooseOption` (purpose `cartography`) between `[]` and `[{ conquer: { only: [hex], anywhere: true } }]`. A tile that couldn't be placed asks nothing.
- `manifestDestiny`: conquer with `only` = the explored, conquerable neighbours of `seat.start` (`anywhere: true`); then an optional `askHex` (purpose `manifestDestiny`) among controlled territories holding a territory tile (id ≤ 48, as Colonialism) whose answer gains that tile's benefit (`tileBenefit`-like, with `source: { hex }`).
- `statusQuo`: for each tier I to IV in turn, the player's tracks whose current space (`spacesAdvanced`) is in that tier and has a bonus; one is taken at once, several ask `askTrack` (purpose `statusQuo`); `statusQuoBonus` gains that space's bonus `gain` effects without paying. Every possible tier is taken, since a free bonus never hurts **(my call, recorded in the design)**.
- `worldsFair`: `gain: { any: 1 }` if `completeLines(plots)` has a row or column, then 1 VP per `completeDistricts(plots)`; a seat with no mat yet counts nothing.

- [ ] **Step 1: Write the failing tests**, one per card, on `startedGame(2, { expansions: ['pp'] })` states built as `tests/engine-tapestry-all.test.mjs`'s `busyGame` does:
  - `Astronomy explores the territory tile it gains and keeps 2 space tiles unexplored`: `spaceTiles.length` +2, `exploredSpace` unchanged, the `explored` event's tile is the one gained.
  - `Cartography offers the conquest of the explored hex only when it scored at least 3 VP`: a forced 3-VP placement offers `chooseOption` with purpose `cartography`; choosing the conquest puts the player's outpost on that hex and rolls the dice; a 2-VP placement offers nothing.
  - `Manifest Destiny conquers only next to the starting territory, then may gain a controlled tile's benefit`: the conquer targets equal the conquerable neighbours of `seat.start`; with none, `noConquer` and then the tile question still comes.
  - `Status Quo takes one free bonus per tier, asking only between tracks in the same tier`: tokens at spaces 5 and 6 (tier II) and 8 (tier III) ask once (`statusQuo`) and gain 2 bonuses without paying; a seat on spaces without bonuses gains nothing and is asked nothing.
  - `World's Fair gains 1 culture, any 1 resource with a complete row or column, and 1 VP per complete district`.
  - `the conquer effect's only limits its targets` (`tests/engine-conquer.test.mjs`).
- [ ] **Step 2: Run** `npx vitest run tests/engine-pp-cards.test.mjs tests/engine-conquer.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `effects/pp-cards.js` with `astronomy`, `cartography`, `cartographyCheck`, `manifestDestiny`, `statusQuo`, `statusQuoBonus`, `worldsFair` (each `EffectHandler` or `AutomaticKind`, JSDoc'd); register them; add `only` to `conquerTargets`/`conquer`; the five cards; `CARD_RULES` gains the five kinds; `TAPESTRY_RULES` gains their words (03 §1.4); `decision-words.js` titles: `cartography` "Conquer the territory you just explored?", `manifestDestiny` "Gain the benefit of a territory tile you control?", `statusQuo` "Which track's bonus for this tier?".
- [ ] **Step 4: Run** `npm run test:unit`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #33: Astronomy, Cartography, Manifest Destiny, Status Quo and World's Fair`.

### Task 4: Engineering and Public Works

**Files:**
- Modify: `src/lib/engine/eras.js` (`ERA_HOOKS`), `src/lib/engine/data/tapestry-cards.js` (2 cards), `src/lib/cards/tapestry-text.js`
- Test: `tests/engine-pp-cards.test.mjs`

**Interfaces:**
- Consumes: the `invented` trigger (`{ player, card }`), the `advanced` trigger (`{ player, track, from, to }`), `spacesAdvanced`, `TRACK_IDS`.
- Produces: THIS ERA cards `engineering` and `public-works` (`expansion: 'pp'`).

- [ ] **Step 1: Write the failing tests**:
  - `Engineering upgrades each invented card to the middle row at once, gaining its circle benefit once`: with Engineering active, inventing puts the card in `tech.middle` with exactly one upgrade event for it (its circle benefit gained once); without it, the card stays in `tech.bottom`.
  - `Public Works gains 3 VP after an advance that leaves that track the least advanced, ties included`: tracks at 3/5/5/5, advancing the 3 to 4 gains 3 VP; at 4/5/5/5, advancing the 4 to 5 makes a four-way tie and gains 3 VP (ties count); at 4/4/6/6, advancing one 4 to 5 gains nothing (the other is now lower); at 4/5/5/5, advancing a 5 to 6 gains nothing.
- [ ] **Step 2: Run** `npx vitest run tests/engine-pp-cards.test.mjs -t "Engineering|Public Works"`. Expected: FAIL.
- [ ] **Step 3: Implement**: `engineering.invented` returns `[{ player: owner, kind: 'upgradeTech', card }]` for the owner's own invention; `'public-works'.advanced` returns `vp(owner, 3)` when `spacesAdvanced(seat, track)` is at most every other track's. The two cards (`era('engineering')`, `era('public-works')`), and their words in `TAPESTRY_RULES`: "Whenever you invent a tech card, upgrade it to your middle row at once and gain its circle benefit" and "After you advance on a track, if it is now your least advanced track (ties count), gain 3 VP".
- [ ] **Step 4: Run** `npm run test:unit`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #33: Engineering and Public Works`.

### Task 5: The tapestry deck with the expansion

**Files:**
- Modify: `src/lib/engine/decks.js` (`tapestryFor`), `src/lib/engine/setup.js` (deal it)
- Modify: `tests/helpers/invariants.mjs` (count against `tapestryFor(state.expansions)`)
- Test: `tests/engine-setup.test.mjs`, `tests/engine-pp-cards.test.mjs`

**Interfaces:**
- Produces: `tapestryFor(expansions: readonly string[]): string[]`: `BASE_TAPESTRY`, then with `'pp'` the 13 Plans & Ploys card ids in catalog order.

- [ ] **Step 1: Write the failing tests**: `a Plans & Ploys deck holds 63 tapestry cards, a base deck the same 50 as before`; `a seeded base game deals the same hands and decks as before #33` (compare `createGame` with seed 7 against a stored list of the first 10 deck cards, captured from `main` before this task); `the invariants account for every Plans & Ploys card` (a P&P game played by `answerDefaults` passes `checkState`).
- [ ] **Step 2: Run** `npx vitest run tests/engine-setup.test.mjs tests/engine-pp-cards.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `tapestryFor`; setup shuffles `tapestryFor(expansions)` (same single `shuffle` call, so a base game draws identically); invariants use it.
- [ ] **Step 4: Run** `npm run test:unit`, then `npx vitest run tests/simulation.test.mjs`. Expected: PASS; the simulation's P&P games now play the 13 cards.
- [ ] **Step 5: Commit** `Refs #33: the tapestry deck deals Plans & Ploys' 13 cards`.

### Task 6: The defender's responses

**Files:**
- Create: `src/lib/engine/responses.js`
- Modify: `src/lib/engine/effects/conquer.js` (`conquerHex` hands the dice to the question; `responseCards` moves out), `src/lib/engine/decisions/choose-response.js`, `src/lib/engine/table.js` (`declineOnly` unchanged in shape), `src/lib/engine/kinds.js`
- Modify: `src/lib/log.js`, `src/lib/decision-words.js` (purpose `retreat`: "Where does your outpost retreat to?")
- Test: `tests/engine-pp-responses.test.mjs` (new), `tests/engine-conquer.test.mjs`

**Interfaces:**
- Produces in `responses.js`:
  - `responseCards(state, defender: number, attacker: number, hex: string): string[]`: the defender's hand cards with `response === 'conquest'` they may play now (a Trap; Retreat if they control a territory next to `hex`; Surprise Party if `spacesAdvanced(defender, 'military') > spacesAdvanced(attacker, 'military')`; Surrender), in hand order.
  - `retreatHexes(state, defender: number, hex: string): string[]`.
  - `diceOp(attacker: number, hex: string, both: boolean, surrender?: number): NewOperation`, the `conquerDice` operation.
- Produces: `chooseResponse` operations carry `both: boolean` and push the dice themselves; `conquerDice` takes an optional `surrender: number` and, after the attacker's own dice operations, rolls both dice for that defender and gives them both results (black then red, as `both`).
- Produces events: `retreated` (`{ player, hex, to }`), `surprisePartyThrown` (`{ player, attacker, hex }`), `surrenderRolled` (`{ player, red, black }`); `log.js` words each.

Rules (design §6.1): one response per conquest; Retreat moves the defender's toppled outpost (upright again) to the chosen hex (asked with `askHex`, purpose `retreat`, when there are several) and gains 1 worker (R45), the conquest stands; Surprise Party raises the defender's outpost, topples the attacker's, gives 15 VP, and stops the middle-island achievement as a trap does; Surrender leaves the conquest and adds the defender's roll after the attacker's. R108 governs a finished defender for every card.

- [ ] **Step 1: Write the failing tests** on `conquestGame(hand, { expansions: ['pp'] })`:
  - `a defender may play Retreat only with a territory of theirs next to the conquered one, moving their outpost there and gaining 1 worker (R45)`.
  - `Surprise Party needs the defender further along military; it topples the attacker's outpost and gains 15 VP`, and `a Surprise Party on the middle island stops the achievement`.
  - `Surrender lets the conquest stand and rolls both dice for the defender after the attacker's`: event order `conquerDiceRolled` (attacker) before the defender's roll.
  - `a defender holding only cards they can't play now is still asked, and declineOnly declines them (#17)`; `a declined or timed-out response still rolls the attacker's dice`.
  - `R108: a finished defender may respond with any response card under the original rules, not under the current rules`.
  - The existing trap tests in `tests/engine-conquer.test.mjs` pass unchanged.
- [ ] **Step 2: Run** `npx vitest run tests/engine-pp-responses.test.mjs tests/engine-conquer.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `responses.js`, the question carrying the dice, the three cards, the events and their log words.
- [ ] **Step 4: Run** `npm run test:unit`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #33: Retreat, Surprise Party and Surrender answer a conquest`.

### Task 7: The attacker's counter to a Trap

**Files:**
- Create: `src/lib/engine/decisions/choose-counter.js`
- Modify: `src/lib/engine/responses.js` (`counterCards`, the trap's effect as `springTrap`), `src/lib/engine/decisions/choose-response.js`, `src/lib/engine/kinds.js`, `src/lib/engine/table.js` (`declineOnly` covers `chooseCounter`), `src/lib/engine/view.js` and `table.js`'s `revealed` only if the stolen card needs it beyond a secret event
- Modify: `src/lib/decision-kinds.js` (`chooseCounter: { shelf: 'tapestry' }`), `src/lib/decision-words.js`, `src/lib/log.js`, `src/lib/prompts.js` if the shelf needs the kind
- Test: `tests/engine-pp-responses.test.mjs`, `tests/engine-table.test.mjs`, `tests/rooms-undo.test.mjs`, `tests/client-decision-kinds.test.mjs`

**Interfaces:**
- Consumes: Task 6's `diceOp`, `chooseResponse`.
- Produces: `counterCards(state, attacker: number): string[]` (hand cards with `response === 'trap'`); `springTrap(ctx, defender, attacker, hex): void` (today's trap effect, R21); the decision `chooseCounter` (`{ player: attacker, defender, hex, trap, both }`, answers `{ card: null | string }`); a Trap played by the defender pushes `chooseCounter` when the attacker holds any card (else `springTrap` and the dice).
- Produces events: `counterPlayed` (`{ player, card, defender, hex }`), `tapestryStolen` (`{ player, from, secret: { card } }`).

Rules (design §6.2): Double Cross cancels the trap (no effect at all, still discarded) and gains 5 VP; Stolen Plans cancels it and moves a random card (`ctx.random`) from the defender's hand to the attacker's; declined, the trap takes effect; nothing answers a counter.

- [ ] **Step 1: Write the failing tests**:
  - `a Trap asks the attacker to counter whenever they hold any card (#17), before the trap takes effect`.
  - `Double Cross cancels the trap: the conquest stands, the trapper gains no resource, the attacker gains 5 VP`.
  - `Stolen Plans cancels the trap and takes a random card from the trapper's hand`; the stolen card is in no other seat's view (`checkViews`).
  - `Surprise Party, Retreat and Surrender can't be countered`; `a declined or timed-out counter springs the trap and rolls the dice`.
  - `rooms-undo`: `undo is refused after Stolen Plans`.
  - `client-decision-kinds`: `chooseCounter` is a known kind on the tapestry shelf; its title names the defender ("Counter Ana's trap?") and its answers read "Play Double Cross" / "Don't counter".
- [ ] **Step 2: Run** `npx vitest run tests/engine-pp-responses.test.mjs tests/engine-table.test.mjs tests/rooms-undo.test.mjs tests/client-decision-kinds.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `choose-counter.js`, `counterCards`, `springTrap`, the stolen card's secret event, the client entries and log words.
- [ ] **Step 4: Run** `npm run test:unit` and `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `Refs #33: Double Cross and Stolen Plans counter a trap`.

### Task 8: How to play, the docs and a browser test

**Files:**
- Modify: `src/lib/rules-help.js` (the Plans & Ploys tab: response cards and counters, in our own words), `tests/client-rules-help.test.mjs`
- Create: `tests/browser/pp-responses.test.mjs`
- Modify: `README.md` (the Plans & Ploys paragraph; a screenshot of the counter question from a running game in "Current interface"), `docs/ui/README.md`, `docs/ui/screens/`, `docs/architecture.md` (`responses.js`, `effects/pp-cards.js`), `docs/status.md` (#33's entry: part 1 built)

- [ ] **Step 1: Write the failing tests**: `How to play's Plans & Ploys tab explains the response cards and the counter` (client-rules-help); the browser test `a hot-seat Plans & Ploys conquest is answered with a Trap and countered with Double Cross`: play through the API to a `chooseConquer` (as `tests/browser/dice-tray.test.mjs` does), give the defender a trap and the attacker Double Cross by playing to it, answer on screen, and assert the counter question's heading and the log line; end and leave the table.
- [ ] **Step 2: Run** `npx vitest run tests/client-rules-help.test.mjs` and `PORT=3021 npx playwright test tests/browser/pp-responses.test.mjs --workers=1`. Expected: FAIL.
- [ ] **Step 3: Implement** the How to play text; take the screenshot from the running game at 1920×1080 into `docs/ui/screens/game-pp-counter.png`; update the docs.
- [ ] **Step 4: Run** the whole suite: `npm run check`, `npm run test:unit`, `PORT=3021 npx playwright test --workers=1`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #33: How to play's response cards, the docs, and a browser test of a counter`.
