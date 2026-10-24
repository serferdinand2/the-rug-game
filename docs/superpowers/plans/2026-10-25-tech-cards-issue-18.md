# Tech cards (#18) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The 33 base tech cards exist as data, and `invent`, `upgrade` and `techBenefit` work for real, including the optional income-turn upgrade and the six landmark cards.

**Architecture:**
- `data/tech-cards.js` holds the cards.
- `tech.js` holds the pure helpers: drawing, the display, prerequisites, upgradable cards.
- `effects/tech.js` holds the effect handlers.
- Three decision kinds ask the player.
- Small changes to `move.js` (`noBenefit`) and `repeat.js` (`oncePerTurn`) let the cards reuse the track machinery.

**Tech Stack:** Plain Node ES modules with JSDoc, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-25-tech-cards-design.md`

## Global Constraints

- Engine modules import only relative paths: no DOM, Svelte or Node, and never `Math.random` (`tests/engine-data.test.mjs` checks). Shuffling uses `shuffle()` from `random.js` with `ctx.random`.
- Prettier (tabs, single quotes), braces on every `if`/`else`, a one-line comment at the top of every file, JSDoc on every export. `npm run check` reports 0 errors and 0 warnings.
- `play()` stays pure. Player mistakes throw `PlayerError` with the exact sentences below; anything else is a plain `Error`.
- One event per thing that happened. No decision in this plan has hidden fields: tech cards are public (01 §9.1).
- Handlers never replace `state.pending` or a lane's stack array; they use `ctx.push`. Data from `data/` is `structuredClone`d before it goes into state or an operation.
- A pick with exactly one legal option is made automatically, without a decision; an optional pick (with a decline answer) always asks while there is something to pick.
- Cite rule ids in comments and test names (R18, R19, FAQ #6, #8, #11, #24).
- `tests/helpers/engine.mjs`'s `stubHandoffs()` throws once a stood-in kind is built, so the task that registers a kind removes it from `HANDOFF_EFFECTS` and migrates every test that relied on it, in the same commit. Migrated tests assert real behaviour; they aren't deleted.
- Every new decision kind gets a fixture in the shape test in `tests/engine-final-fixes.test.mjs` in the task that adds it.
- Work on the branch `issue-18`. Commits reference the issue: `Refs #18: …`, and the last one `Fix #18: …`. End every commit message with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**PlayerError sentences (exact):**

| Decision | When | Sentence |
|---|---|---|
| `chooseInvent` | the answer isn't one of `answers()` | `You can't invent that card.` |
| `chooseUpgrade` | the answer isn't one of `answers()` | `You can't upgrade that card.` |
| `chooseTechBenefit` | the answer isn't one of `answers()` | `Choose one of the cards offered.` |

## Review Focus

- **Every tech card is always accounted for.** After invents, refreshes, reshuffles and Nanotechnology's bonus (paying 3 tech cards, FAQ #11), each of the 33 ids is in exactly one place: the deck, the display, the discards, or one player's rows. The display never holds a duplicate. Test in Task 2.
- **Running dry mid-effect.** Rubber's second card, with nothing left anywhere, does nothing and leaves no decision open. A refresh with fewer than 3 cards to deal shows only what it could deal. Test in Task 2.
- **Prerequisites through anyone's eyes.** A neighbour who has finished still counts. In a 2-player game the one opponent counts. The player who isn't a neighbour in a 4-player game doesn't count. Test in Task 3.
- **Answers that aren't in the list.** A top-row card, an opponent's card, `'deck'` with nothing to draw, `{ refresh: true }` after the first card, and a missing field are each refused with the table's sentence. Test in Tasks 2–4.
- **Lithium-Ion Battery twice in one turn** (its upgrade, then Nanotechnology's square on it) gives the repeat only once (FAQ #6). Test in Task 4.

---

### Task 1: The tech card data

**Files:**
- Create: `src/lib/engine/data/tech-cards.js`
- Modify: `src/lib/engine/data/effects.js` (the `landmark` kind in the Effect typedef and in `EFFECT_KINDS`; `noBenefit?: boolean` on `advance` and `regress`; `oncePerTurn?: boolean` on `repeat`), `docs/superpowers/specs/2026-10-24-base-game-data-design.md` (its effect table gets the same three additions)
- Test: `tests/engine-tech-data.test.mjs`

**Interfaces:**
- Produces:
  - `@typedef {{ track: TrackId, tier: 2 | 3 | 4 } | { innovation: string }} TechRequirement`
  - `@typedef {{ id: string, name: string, circle: Effect[], square: Effect[], requires: TechRequirement, landmark?: string }} TechCard`
  - `TECH_CARDS: readonly TechCard[]`, deep-frozen, in `BASE_TECH` order (`decks.js`).
  - `techCard(id) → TechCard`: throws a plain `Error` for an unknown id.

- [ ] **Step 1: Write the failing tests:**
  - `'the 33 base tech cards are in BASE_TECH order'`.
  - `'every benefit is a list of one-key effects of a known kind'` (`EFFECT_KINDS`).
  - `'27 cards need a track tier and 6 need an income-mat innovation (R18)'`: the innovations are Treasury `'currency'`, Stock Market `'banking'`, Bakery `'farming'`, Barn `'breeding'`, Library `'writing'` and Com Tower `'telephone'`, and each names an `INCOME_MAT` space id.
  - `'the cards match 02 §4'`, with spot checks deep-equal to:
    - Irrigation: circle `[{ gain: { food: 1 } }]`, square `[{ building: 'farm' }]`, requires science tier 2.
    - Clocks: circle `[{ advance: { tracks: ['technology'], noBenefit: true } }]`, square `[{ vp: { per: 'trackSpace', track: 'technology' } }]`, requires technology tier 2.
    - The Nail: circle `[{ gain: { tapestry: 1 } }]`, square `[{ choice: [[{ building: 'market' }], [{ building: 'house' }], [{ building: 'farm' }]] }]`.
    - Time Travel: circle `[{ gain: { coin: 1 } }]`, square `[{ regress: { tracks: ['exploration', 'military'], noBenefit: true } }]`, requires technology tier 4.
    - Lithium-Ion Battery: circle `[{ vp: 4 }]`, square `[{ repeat: { oncePerTurn: true } }]`, requires exploration tier 4.
    - Assembly Line: circle `[{ techBenefit: { icon: 'square' } }]`, square `[{ techBenefit: { icon: 'circle' } }]`, requires exploration tier 3.
    - Transistors: square `[{ gain: { culture: 1 } }, { vp: 4 }]`.
    - Telescope: circle `[{ gain: { culture: 1, territory: 1 } }]`, square `[{ vp: { per: 'territoryTile' } }]`.
    - Each landmark card: Bakery circle `[{ vp: 4 }]`, Barn `[{ vp: 3 }]`, Com Tower `[{ vp: 5 }]`, Library `[{ vp: 3 }]`, Stock Market `[{ vp: 5 }]`, Treasury `[{ vp: 4 }]`. Each square is `[{ landmark: <its id> }]`, and `landmark` is set to the same id.
  - `'the data is frozen'`.
- [ ] **Step 2: Run** `node --test tests/engine-tech-data.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `tech-cards.js` from the 02 §4 table, number for number. The VP counters are `{ vp: { per: 'farm' } }` and the like. "1 VP per tech card" is `per: 'techCard'`, "per territory you control" is `per: 'territory'`, and "per track space advanced" is `per: 'trackSpace'` with its `track`. Dynamite's circle and Warships' square are `[{ conquer: {} }]`. Compass is circle `[{ gain: { territory: 2 } }]`, square `[{ explore: {} }]`. Eyeglasses' circle is `[{ invent: {} }]`. Penicillin's circle is `[{ research: { noBenefit: true } }]`. Radio's square is `[{ gainCiv: {} }]`, and Printing Press's square `[{ tapestryOnTop: {} }]`. Add the effects.js changes.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, including the existing data tests.
- [ ] **Step 5: Commit** `Refs #18: add the 33 base tech cards as data`.

### Task 2: The deck, the display and inventing

**Files:**
- Create: `src/lib/engine/tech.js`, `src/lib/engine/effects/tech.js`, `src/lib/engine/decisions/choose-invent.js`
- Modify: `src/lib/engine/effects/index.js` (register `invent`), `src/lib/engine/kinds.js` (`chooseInvent`), `tests/helpers/engine.mjs` (drop `'invent'`), `tests/engine-final-fixes.test.mjs` (fixture `{ player: 1, kind: 'chooseInvent', left: 1, refresh: true }`)
- Migrate: technology 1, 3, 4, 6 (bonus) and 7 in `engine-track-spaces`, `engine-stack`'s "an unbuilt effect throws" example (switch it to `gainCiv`), and everything else the suite finds.
- Test: `tests/engine-tech.test.mjs`

**Interfaces:**
- Produces, in `tech.js`:
  - `drawTech(ctx) → string | null`: the top of `supply.tech.deck`. If the deck is empty, it shuffles `supply.tech.discard` into the deck first and emits `techDeckShuffled { count }`. It returns `null` with neither.
  - `refillDisplay(ctx)`: draws until `faceUp` has 3 cards or nothing is left.
  - `refreshDisplay(ctx)`: moves the face-up cards to the discards, then refills. It emits `techDisplayRefreshed { discarded, faceUp }`. **(plan ruling:** discard first, then deal, so a reshuffle may deal a just-discarded card back. That is the physical order.)
  - `canDraw(state) → boolean`.
- Produces, in `effects/tech.js`:
  - `inventAnswers(state, decision) → Answer[]`: `{ card }` per face-up card, then `{ card: 'deck' }` if `canDraw`, then `{ refresh: true }` if `decision.refresh`.
  - The `invent` effect: it pushes, or resolves automatically, `chooseInvent { player, left: count ?? 1, refresh: !!refresh }`. With no answer, it emits `noInvent { player }`.
  - `inventCard(ctx, player, answer, left)`: moves the card to the end of `seat.tech.bottom`, emits `techInvented { player, card, from }`, and refills. With `left > 1`, it asks again with `left − 1` and `refresh: false`. A `{ refresh: true }` answer refreshes and asks again with the same `left` and `refresh: false`.
- `chooseInvent`: `answers` = `inventAnswers`, `check` = membership (exact sentence), `resolve` = `inventCard`.

- [ ] **Step 1: Write the failing tests:**
  - `'inventing a face-up card puts it in the bottom row and refills the display'`.
  - `'inventing from the deck takes the top card'`: the deck shrinks by 1, and `from: 'deck'`.
  - `'an empty deck is reshuffled from the discards (FAQ #24)'`.
  - `'with nothing to invent, nothing happens'`: `noInvent`, and no decision is left open.
  - `'a single option is invented automatically'`: an empty display and one card in the deck.
  - `'Rubber may refresh first, then invents 2'` (technology 7 through an advance turn): the answers include `{ refresh: true }` only before the first card. After the refresh, the display holds 3 new cards and the old ones are discarded.
  - `'Rubber with nothing left for the second card stops quietly'` (Review Focus).
  - `'every tech card stays accounted for'` (Review Focus): after several invents, a refresh, a reshuffle and paying Nanotechnology's bonus (3 tech cards, FAQ #11), the 33 ids are each in exactly one of the deck, display, discards or rows, and the display has no duplicate.
  - `'an answer not offered is refused'`: `{ card: 'deck' }` with nothing to draw, `{ refresh: true }` after the first card, an id not in the display, and `{}` each throw `You can't invent that card.` (Review Focus).
- [ ] **Step 2: Run** `node --test tests/engine-tech.test.mjs`. Expected: FAIL, `The invent effect isn't built yet.`
- [ ] **Step 3: Implement** it all, with the registrations, the helper change and the fixture.
- [ ] **Step 4: Migrate**, then run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #18: invent tech cards from the display or the deck`.

### Task 3: Upgrading

**Files:**
- Create: `src/lib/engine/decisions/choose-upgrade.js`
- Modify: `src/lib/engine/tech.js`, `src/lib/engine/effects/tech.js`, `src/lib/engine/effects/index.js` (register `upgrade`), `src/lib/engine/kinds.js` (`chooseUpgrade`), `tests/helpers/engine.mjs` (drop `'upgrade'`), `tests/engine-final-fixes.test.mjs` (fixture `{ player: 1, kind: 'chooseUpgrade', optional: true }`, with a card in seat 1's bottom row)
- Migrate: income step 3 in `engine-income` (and `engine-game-end` if it relies on it), the Glass and Plastic bonuses (technology 5 and 8), the upgrade half of Electronics and Nanotechnology (`techBenefit` stays a stand-in until Task 4), `engine-order`, the territory tile with an upgrade, and everything else the suite finds.
- Test: `tests/engine-tech.test.mjs`

**Interfaces:**
- Produces, in `tech.js`:
  - `meetsRequirement(state, player, card) → boolean`: §7 step 2, for `player` and each of `neighbours(state, player)`.
  - `upgradable(state, player) → string[]`: the bottom row, then the middle-row cards that meet their requirement, each in row order.
- Produces, in `effects/tech.js`:
  - The `upgrade` effect: §7 steps 3–4. With nothing mandatory to upgrade, it emits `noUpgrade { player }`. One mandatory card is upgraded automatically. Otherwise it pushes `chooseUpgrade { player, optional: !!optional }`. An optional upgrade with nothing upgradable does nothing.
  - `upgradeCard(ctx, player, card)`: moves the card to the end of the next row, emits `techUpgraded { player, card, from, to }`, and pushes `{ player, kind: 'effects', effects: <circle or square, cloned>, source: { tech: card, icon } }`.
- `chooseUpgrade`: `answers` = `[{ card: null }]` first when `optional`, then `{ card }` per `upgradable` card. `resolve` with `null` emits nothing and does nothing.

- [ ] **Step 1: Write the failing tests:**
  - `'upgrading a bottom card moves it to the middle and gives its circle'`: Irrigation gives 1 food.
  - `'upgrading a middle card needs its prerequisite and gives its square'`: Irrigation with a science token on 4 gives a farm (then its placement), but not with the token on 3.
  - `'a neighbour's track meets the prerequisite, and a non-neighbour's doesn't'` (Review Focus): a 4-player game; a neighbour that has finished still counts.
  - `'R18: a landmark card needs its innovation uncovered, by the player or a neighbour'`: Bakery needs Farming (farm space 2), so `incomeMat.buildings.farm ≤ 4`.
  - `'top-row cards are never offered'`.
  - `'income step 3's upgrade may be declined'`: the answers start with `{ card: null }`, and declining changes nothing.
  - `'a mandatory upgrade with one card is automatic, and with none does nothing'`.
  - `'an answer not offered is refused'`: a top-row card, an opponent's card, and a middle card without its prerequisite each throw `You can't upgrade that card.` (Review Focus).
- [ ] **Step 2: Run** `node --test tests/engine-tech.test.mjs`. Expected: FAIL, `The upgrade effect isn't built yet.`
- [ ] **Step 3: Implement** it, with the registrations, the helper change and the fixture.
- [ ] **Step 4: Migrate**, then run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #18: upgrade tech cards, with prerequisites from you or a neighbour`.

### Task 4: Card benefits without moving, landmarks, and every card

**Files:**
- Create: `src/lib/engine/decisions/choose-tech-benefit.js`
- Modify: `src/lib/engine/effects/tech.js` (`techBenefit`, `landmark`), `src/lib/engine/effects/move.js` (`noBenefit`), `src/lib/engine/effects/repeat.js` (`oncePerTurn`), `src/lib/engine/effects/index.js` (register `techBenefit` and `landmark`), `src/lib/engine/kinds.js` (`chooseTechBenefit`), `src/lib/engine/state.js`, `src/lib/engine/setup.js` and `src/lib/engine/turn.js` (`usedThisTurn: { player: number, card: string }[]`, started empty and cleared in `startTurn` beside `activated`), `tests/helpers/engine.mjs` (drop `'techBenefit'`), `tests/engine-final-fixes.test.mjs` (fixture `{ player: 1, kind: 'chooseTechBenefit', icon: 'circle', options: ['irrigation', 'calendar'] }`)
- Migrate: Electronics and Nanotechnology (technology 9 and 11), `engine-order`, and everything else the suite finds.
- Test: `tests/engine-tech.test.mjs`, `tests/engine-tech-cards.test.mjs`

**Interfaces:**
- Produces:
  - The `techBenefit` effect: §8. The options are the middle row for `circle` and the top row for `square`. With none, it emits `noTechBenefit { player }`. One option is taken automatically. Otherwise it pushes `chooseTechBenefit { player, icon, options }`. The chosen benefit is pushed with `source: { tech, icon }`.
  - The `landmark` effect: §8. It emits `landmarkGained { player, landmark, tech: true }` and pushes `placeLandmark`, or emits `noLandmarkLeft { player, landmark }`.
  - `advance` and `regress` with `noBenefit` call `moveToken(..., benefit: false)`. Any choice of track or token works as before.
  - `repeat` with `oncePerTurn`: the key is `op.source.tech`. If `state.usedThisTurn` already has `{ player, card }`, it emits `oncePerTurnUsed { player, card }` and does nothing. Otherwise it records the key, then repeats as before.

- [ ] **Step 1: Write the failing tests:**
  - `'Electronics may take the circle of the card it just upgraded (FAQ #8)'`.
  - `'Nanotechnology gives the square of a top-row card without moving it'`.
  - `'an Assembly Line chain ends by itself (R19)'`: Assembly Line in the middle row, with Lithium-Ion Battery in the top row.
  - `'a landmark card's square places its landmark (#16)'`: upgrading Bakery to the top takes `'bakery'` out of `state.landmarks` and opens `choosePlacement { landmark: 'bakery' }`.
  - `'a landmark already placed gives nothing when its square is reused'`: Nanotechnology picks Bakery again, and `noLandmarkLeft` is emitted.
  - `'Lithium-Ion Battery's square works once per turn (FAQ #6)'` (Review Focus): its upgrade repeats; then Nanotechnology picks it, and `oncePerTurnUsed` is emitted. Next turn it works again.
  - `'Clocks advances on technology without the space's benefit, but still takes a landmark'`.
  - `'Time Travel goes back on exploration or military without a benefit'`.
  - In `tests/engine-tech-cards.test.mjs`: `'every base tech card's circle and square run to the end'`.
    - For each of the 33 cards: put it in the bottom row of a player with every track on 10 and every income-mat row empty (`buildings` all 0, so every innovation is uncovered), upgrade it twice through `upgradeCard`, and answer every opened decision with its first answer until none is open.
    - Assert `techUpgraded` twice, the card in the top row, and no thrown error. `stubHandoffs()` stands in for `tapestryOnTop` and `gainCiv`, and records them for Printing Press and Radio.
- [ ] **Step 2: Run** `node --test tests/engine-tech.test.mjs tests/engine-tech-cards.test.mjs`. Expected: FAIL, `The techBenefit effect isn't built yet.`
- [ ] **Step 3: Implement** it, with the registrations, `usedThisTurn`, the helper change and the fixture.
- [ ] **Step 4: Migrate**, then run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #18: card benefits without moving, landmark cards and once-per-turn`.

### Task 5: The documents

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md** in the style of the #16 and #17 entries:
  - add #18 to the done list, and a "**#18 (tech cards: inventing and upgrading)** is done (2026-10-25)." bullet with the design and plan paths;
  - short sub-bullets:
    - the data (33 cards, R18's innovations, the new `noBenefit`, `landmark` and `oncePerTurn`);
    - inventing (display, deck, reshuffle, refresh as an answer);
    - upgrading (prerequisites from you or a neighbour, optional only in income step 3);
    - `techBenefit`, landmark cards and Lithium-Ion Battery once per turn;
    - the owner's "implement and we will see later", so every call is marked in the design for review;
    - the handoffs (#19, #20, #27, #28, #31, #53);
    - the new test files;
  - an Architecture sentence naming `data/tech-cards.js`, `tech.js` and `effects/tech.js`, with the design path;
  - drop the #18 items (`invent`, `upgrade`, `techBenefit`) from the #14 bullet's hand-off list;
  - in "Next", #18 leaves "Ready now", and #19 and #20 become ready (check their blockers with `gh api repos/serferdinand2/the-rug-game/issues/<n>/dependencies/blocked_by`).
- [ ] **Step 2: Run** `npm test` and `npm run check`. Expected: every test passes, and 0 errors and 0 warnings.
- [ ] **Step 3: Commit** `Refs #18: record #18 in CLAUDE.md`.

The GitHub checklists (the design's §10 lines on #19, #20, #27, #28, #31 and #53, and ticking #18) and the final `Fix #18: …` commit happen after the whole-branch review, not in a task.
