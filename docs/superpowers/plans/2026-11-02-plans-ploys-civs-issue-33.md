# Plans & Ploys content, parts 2 and 3: the civilizations and the wrap-up (#33) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Plans & Ploys table deals and plays its civilizations (all but the Islanders, R115), with the variant "All civilizations from Plans & Ploys", their words and cards; everything in the expansion works except the Automa.

**Architecture:** Each civilization is a module in `src/lib/engine/civs/` on the `Civ` shape (`civ.js`), registered in `CIVS` (`civs/index.js`) and dealt through `civsFor(expansions)` (`decks.js`) once built. A civilization keeps its state in `seat.civData[id]`, acts through `setup`, `income`, `hooks` and `adjustment`, and asks with the existing decisions where they fit. Shared rules it needs (control, a conquest-dice hook, the turn's kind) change in the module that owns them. Each task also gives its civilization its words (`civ-rules.js`), its card's live marks (`civ-card.js`) and its log lines.

**Tech Stack:** plain JavaScript with JSDoc, Svelte 5 client, Vitest with `node:assert/strict`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-plans-ploys-content-design.md` (§7–§10; R113, R114, R115). Rules source: `docs/research/03-expansions.md` §1.3 (the civilizations), §6 (setup adjustments). Part 1's plan, for the patterns it set: `docs/superpowers/plans/2026-11-01-plans-ploys-cards-issue-33.md`.

## Global Constraints

- docs/conventions.md throughout: a one-line comment at the top of each file, JSDoc on exports, braces on every `if`, Prettier (tabs, single quotes), `npm run check` 0 errors and 0 warnings.
- Engine pure; a player's mistake throws `PlayerError`; randomness only through `ctx.random`.
- A base game is unchanged: without `'pp'`, the civilization deck, its shuffle and every base civilization behave exactly as before (a seeded test pins the deal, as part 1 pinned the tapestry deck).
- Import the engine through `game.js`, `kinds.js` or `play.js` in tests (CLAUDE.md: 37 modules throw when imported first). A civilization module that needs `abilities.js` helpers may keep a private copy, as `traders.js` does with `rivals`.
- R113: a civilization's printed start (tokens, resources, cards, tiles, VP) applies whenever it is gained, except what the mat marks "if you start with them" (Tinkerers' opponents' gain, Utilitarians' tier II landmark). R34: the setup adjustments are the current version's, for the civilization chosen at setup only; a loss is applied at the end of income turn 1 (`adjustment.firstTurnEnd`).
- Every number is 03 §1.3's. Every new event is worded in `src/lib/log.js` with a sample in `tests/client-log.test.mjs`; every new decision kind has client facts in `src/lib/decision-kinds.js` and words in `src/lib/decision-words.js` (their tests enforce this). Hidden information leaves through a `secret` event or a decision's `hidden` fields only.
- Commits reference the issue: `Refs #33: …`, with the Co-Authored-By line. Each civilization lands in its own commit with every suite green.

## Review Focus

- A civilization gained mid-game (R113), and two Plans & Ploys civilizations held by one player, with their income abilities in either order: Task 1's `engine-civs-all` loop plays each one paired.
- A finished player's civilization: VP still comes (passive operations), questions never do (`offer`).
- Hidden hands: the Advisors' gift and the Spies' look reveal a hand only to the right seat, and close undo: Tasks 7 and 10.
- The map after the Treasure Hunters' and Infiltrators' changes: a base game's control, conquests and achievements are unchanged (the existing conquer and achievement tests, and the base simulation).
- The 200-game simulation deals the new civilizations in its Plans & Ploys games under the invariants and the view checks: Task 1 makes it so, every later task inherits it.

---

### Task 1: The deck, the registry and the rules R113–R115

**Files:** `src/lib/engine/decks.js`, `src/lib/engine/setup.js` (`dealCivs`), `src/lib/engine/civs/civ.js` (typedef: `solo?: boolean`), `tests/helpers/invariants.mjs`, `tests/engine-setup.test.mjs`, `tests/engine-civ-framework.test.mjs`, `tests/engine-civs-all.test.mjs`, `README.md` (Rules conventions: R113, R114, R115), a new GitHub issue for the Islanders.

**Interfaces:**
- Produces: `PP_CIVS: readonly string[]` in `decks.js`, the Plans & Ploys civilizations built so far, in catalog order; each later task appends its id. The Islanders are never in it (R115). `civsFor(expansions): string[]` = `BASE_CIVS`, then `PP_CIVS` with `'pp'`.
- Produces: `Civ.solo?: boolean` (false for Advisors and Spies, read by #31).
- Produces: in `tests/engine-civs-all.test.mjs`, a second loop over `PP_CIVS` with `expansions: ['pp']`, each civilization paired with the next (with `treasure-hunters` wrapping to a base one when alone).

- [ ] **Step 1: Tests**: `a Plans & Ploys deck deals the base 16 and the built Plans & Ploys civilizations; a seeded base game deals as before` (pin the first 4 of `supply.civs` for seed 7 from `main`: `merrymakers, isolationists, nomads, inventors`); invariants count civilizations against `civsFor(state.expansions)`; `engine-civ-framework`'s registry test compares `CIVS` with `[...BASE_CIVS, ...PP_CIVS]`.
- [ ] **Step 2: Run** them; expect FAIL (`civsFor` missing).
- [ ] **Step 3: Implement** `PP_CIVS = []` (filled by later tasks), `civsFor`, setup dealing it (one `shuffle` call, so a base deal is unchanged), the invariants, the second `engine-civs-all` loop (empty until Task 2), `Civ.solo`. README: R113, R114 and R115 exactly as the design's §7–§8 word them (R115: the Islanders are left out; no source shows the mat's printed centre hex; 25 civilizations with Plans & Ploys). File the Islanders issue with the project's layout (Issue with Example; Current problem; Proposed solution with a checkbox list; Related issues), labels `enhancement` and `M7 · Plans & Ploys`, milestone M7: "Add the Islanders once a source shows their mat's printed centre hex (R115)".
- [ ] **Step 4: Run** `npm run test:unit`; expect PASS.
- [ ] **Step 5: Commit** `Refs #33: the civilization deck deals Plans & Ploys' built civilizations; R113–R115`.

### Task 2: Riverfolk

**Rules (03 §1.3, R113):** setup (also mid-game) 4 VP per district holding at least 2 impassable plots (`cityPlots` 'blocked', the Architects' cubes included). Gained mid-game: first `offer` to discard it and gain another (Mystics' self-discard: out of `seat.civs`, into `supply.civDiscard`, `civDiscarded`, then `gainCiv`); kept, the start follows. Buildings may go on impassable plots: the Terraforming flag in `city.js` becomes `buildsOverImpassable(state, player)` = Terraforming active or Riverfolk held, at the four call sites (`placing.js` `placements`/`placeBuilding`/`placeLandmark`, `choose-placement.js`); Terraforming's own VP stays Terraforming's. Hook `piecePlaced` with `impassable > 0`: each district that had impassable plots and now shows none, not rewarded before (`civData.riverfolk.cleared`), gives any 1 resource. Income turn 5 (`incomeTurns: [5]`): lose 1 VP per impassable plot still showing, never below 0 VP (my call).
**Words:** `civ-rules.js`; log lines for its events.

- [ ] Tests (`tests/engine-pp-civs.test.mjs`, new): the setup VP on a mat with known impassable districts; a building on an impassable plot is a legal spot only with Riverfolk; clearing a district's last impassable plot gives 1 resource once; the final income turn's loss; the mid-game discard offer; a base game's Terraforming unchanged.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'riverfolk'`; run the suite, PASS; commit `Refs #33: the Riverfolk`.

### Task 3: Recyclers

**Rules:** setup (also mid-game, R113): draw 3 tech cards from the deck, keep 1 in the bottom row, discard 2 to `supply.tech.discard` (a decision on the 3 with `hidden: ['options']`). Current adjustment (setup): upgrade a tech card. Income 2–5: an optional upgrade (`upgrade: { optional: true }`). Any upgrade the Recyclers take (not an Inventors token's upgrade of their card) may instead move a top-row card back to the bottom row for 5 VP: `chooseUpgrade`'s answers gain the top-row cards for a Recyclers seat, and choosing one recycles (`techRecycled` event); nothing else counts as that upgrade. Gaining a tech card (`invent`) may take any card from `supply.tech.discard` (answers `{ card, from: 'discard' }`, unless the effect is `deckOnly` or `faceUpOnly`). "May not upgrade it during your first income turn": income turn 1 has no upgrade step, so nothing is built (ruling).

- [ ] Tests: the setup keep-1-of-3; the adjustment's upgrade in the current version only; recycling a top-row card for 5 VP in an income upgrade and in a track's upgrade; an Inventors token's upgrade never recycles; inventing from the discard pile, and not with `deckOnly`.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'recyclers'`; suite PASS; commit `Refs #33: the Recyclers`.

### Task 4: Aliens

**Rules:** setup (also mid-game): gain 4 space tiles into the supply. `civData.aliens = { tile: number | null }`. Income 2–5: discard the tile on the mat (to a new public `supply.spaceDiscard`, out of the game, as `territoryDiscard` is), then choose (`chooseOption`): explore a space tile from the supply onto the mat (paying any 1 resource first if one was just discarded; the option is offered only when the player has a space tile, and, after a discard, a resource) or gain any 1 resource. A tile on the mat gives its benefit as when explored but stays out of `exploredSpace`; an ongoing tile on the mat answers `advanced` (`activeHooks` reads `civData.aliens.tile` beside `exploredSpace`) until discarded.

- [ ] Tests: setup's 4 tiles; the discard and the pay-first rule; an ongoing tile on the mat gives 5 VP on its track, and stops once discarded; the invariants count `supply.spaceDiscard` and the mat's tile.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'aliens'`; suite PASS; commit `Refs #33: the Aliens`.

### Task 5: Treasure Hunters

**Rules (03 §1.3, R114):** setup (also mid-game): `civData = { tokens: 4, used: [] }`, gain 2 territory tiles. Income 2–5, optional: choose an empty (no items) explored territory next to one the player controls that shows an unused treasure's terrain anywhere (`terrainsOf` corners and island, as R32); when several unused terrains match, choose which. Place a token there (`placeToken`, civ `'treasure-hunters'`), mark the terrain used, and gain: Desert 1 coin, then roll the black die twice and take one result; Grassland 1 culture, then roll the science die twice, choose one, and advance on that track with its benefit (the bonus may be paid); Mountain 1 worker, then roll both conquer dice and gain both (black first); Forest 1 food, then roll the red die twice and gain both. Rolls emit `treasureRolled { player, die, faces }`, which the dice tray shows (`src/lib/dice.js`, `sound.js`). Control (R114): a hex with no upright outpost and a Treasure Hunters token is controlled by the token's seat (`controlledTerritories`); `loneOpponent` names that seat for a hex holding only such a token; `conquerHex` topples nothing then (no outpost to topple). The defender may answer with a trap, Surprise Party or Surrender, never Retreat (part 1's `responseCards` already needs a toppled outpost). After a conquest the token stays and the attacker controls; after a trap the token's seat controls again.
**Card:** the reviewed layout already shows the terrains; `civCardMarks` marks used terrains; `CARD_CIVS` gains it.

- [ ] Tests: each treasure's reward with seeded dice; a terrain once only; a printed territory showing the terrain qualifies; control by token; a conquest of a token hex asks the Treasure Hunters for a response and both dice come under Tanks (`bothDice: 'ifOpponent'`); a trap restores their control; a base game's control and conquests unchanged.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'treasure-hunters'`; suite PASS; commit `Refs #33: the Treasure Hunters`.

### Task 6: Tinkerers

**Rules:** setup, only when started with (R113's exception): each opponent invents 1 tech card from the deck into their bottom row; under the current rules (R48) each also gains 1 tapestry card. Their "no upgrade in income turn 1" needs nothing built (ruling, as Task 3). `civData = { used: [] }`. Income 2–5, optional: place a token on an unused option (each once a game): (1) choose a track with a token past the start: gain the resources `advanceCost(track, space)` gives (`any` stays the player's choice); (2) choose a track where an opponent is ahead: advance to the closest opponent's space ahead, with its benefit, no bonus, landmarks as any move (R9); (3) choose a track with at least 3 spaces behind: go back exactly 3, gain that space's benefit, and the bonus may be paid; (4) choose a track with a bonus space ahead: move to the next space with a bonus, gain that bonus free, no benefit, no landmarks for tiers passed (R9's exception), not an advance for `advanced`.
**Card:** used options marked (`civCardMarks`, `CARD_CIVS`), the card's boxes labelled 1–4.

- [ ] Tests: the setup by version; each option, and each once; option 4 gains no landmark crossing a tier.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'tinkerers'`; suite PASS; commit `Refs #33: the Tinkerers`.

### Task 7: Spies

**Rules:** `solo: false`. Current adjustment: lose any 1 resource at the end of income turn 1. `civData = { used: [], watching: [] }`. Income 2–5, optional: an unused option (each once a game) and a neighbour (`neighbours`, player seats): (1) a face-up WHEN PLAYED tapestry card on their income mat: its ability, as the Heralds copy one (`copyAbility(ctx, player, null, card)`); (2) a territory or space tile in their supply: its benefit; an ongoing space tile is also watched (`watching: [{ tile, from }]`), and the Spies' `advanced` hook gives its 5 VP while that tile stays in the neighbour's `spaceTiles`; (3) their current space on any track: its benefit, no bonus (`benefitOps`); (4) one of their tech cards in the middle or top row: that row's benefit (`useTechBenefit`; a landmark's square gives nothing). Then they may look at that neighbour's hand: `handSeen { player, from, secret: { cards } }`, which closes undo.
**Card:** used options marked.

- [ ] Tests: each option, each once; the watched ongoing tile gives 5 VP on its track and stops when the neighbour explores it; the look is the Spies' secret only (`view`), and `revealed()` is true; the adjustment by version.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'spies'`; suite PASS; commit `Refs #33: the Spies`.

### Task 8: Utilitarians

**Rules:** the eight listed landmarks: Forge, Barracks, Lighthouse, Apothecary (the tier II landmarks) and Rubber Works, Tank Factory, Train Station, Academy (tier III). `civData = { active: string[] }`, 2 tokens. Setup, only when started with: choose a tier II track landmark still in the supply, gain it (`landmarkGained`, not from a track) and place it; a token goes beside it. Gained mid-game: place up to 2 tokens beside listed landmarks they own. After gaining a listed landmark: they may place a free token, or move one, beside it (at most 2 active). Current adjustment: lose any 1 at the end of income turn 1. Active abilities, as hooks: Forge `upgraded` to the top row (`icon: 'square'`, their own upgrade) gives any 1; Barracks: whenever they conquer they also gain the red die's result, through a new trigger `conquerRolled { player, hex, red, black }` fired in `conquerDice` (base games: nothing answers it); Lighthouse: once on each of their advance turns, as the turn starts, they may discard 2 territory tiles for any 1 resource (a `trade` offer; my call: offered before the advance); Apothecary `landmarkGained` (another landmark) gives any 1; Rubber Works, Tank Factory, Train Station, Academy: `advanced` on technology, military, exploration, science to a space in tier III or IV gives 4 VP.
**Card:** active tokens marked beside their boxes.

- [ ] Tests: the setup choice and token; placing and moving a token, at most 2; each ability on and off; Barracks with Tanks gains the red result twice; a base game's conquest unchanged by `conquerRolled`.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'utilitarians'`; suite PASS; commit `Refs #33: the Utilitarians`.

### Task 9: Infiltrators

**Rules:** setup: gain 1 culture, also mid-game; under the current rules, the civilization chosen at setup gains none. Gaining a civilization while holding the Infiltrators draws 3 and keeps 1 (`gainCiv`'s count; with the civ-draft variant still 3). Income 2–5, optional, one of: (A) a territory holding exactly 1 upright opponent outpost (not a Nomads piece) and nothing else: place an outpost there from the supply; both stand, the hex is `shared: true`, control is shared (`controlledTerritories` gives a shared hex to each seat with an upright outpost on it), gain the territory tile's benefit; the hex can't be conquered (2 items) and the middle-island achievement doesn't come; (B) an opponent's capital-city territory (`seat.start`): a player token there (`hex.tokens`, civ `'infiltrators'`), 1 VP per outpost that opponent still has in supply; their third token on the same territory gains a civilization.

- [ ] Tests: the culture by version and mid-game; option A's shared control (both seats count it for scoring and the red die's VP per territory) and its blocks; option B's VP and the third token's civilization; the draw of 3.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'infiltrators'`; suite PASS; commit `Refs #33: the Infiltrators`.

### Task 10: Advisors

**Rules:** `solo: false`. Setup (also mid-game): draw 3 tapestry cards; gained mid-game, they may give any of those 3 to neighbours, 5 VP per card given. Income 2–5: gain 1 VP per card in hand; then discard down to 4 (choosing which); if any were discarded, gain any 1 resource. On a neighbour's advance turn (a new `state.turnKind: 'advance' | 'income' | null`, set when a turn starts), each tapestry card that neighbour would draw first asks the Advisors' owner, while they hold a card and aren't finished (`chooseGive`, answers `{ card: null | string }`, asked whenever they hold any card, #17's privacy, and declined by `declineOnly` when nothing can be given): given, the card moves to the neighbour's hand (`tapestryGiven`, the card a secret of both) and the Advisors draw 1; declined, the neighbour draws.

- [ ] Tests: setup by start and mid-game; the income VP and the discard to 4 with its resource; the gift on a neighbour's advance turn and never on an income turn; privacy (`view`, `revealed()`); `declineOnly`.
- [ ] Run, FAIL; implement; `PP_CIVS` gains `'advisors'`; suite PASS; commit `Refs #33: the Advisors`.

### Task 11: The variant "All civilizations from Plans & Ploys"

**Rules (design §9):** `VARIANTS` gains `{ id: 'civs-from-pp', name: 'All civilizations from Plans & Ploys' }`; `checkOptions` refuses it without `'pp'`; every civilization drawn, at setup and later, comes from `PP_CIVS` (the deck is `PP_CIVS` only). The lobby offers it only while Plans & Ploys is switched on.

- [ ] Tests: the deck holds only Plans & Ploys civilizations; refused without `'pp'`; the lobby component hides it without the expansion (client test).
- [ ] Run, FAIL; implement; suite PASS; commit `Refs #33: the variant All civilizations from Plans & Ploys`.

### Task 12: The wrap-up

- [ ] How to play's Plans & Ploys tab: one line that its civilizations' full text shows when you point at a player (no more words: #42's limit).
- [ ] README: the Plans & Ploys paragraph (civilizations dealt, the variant); a "Current interface" screenshot of a Plans & Ploys civilization's card in a running game; `docs/ui/README.md`; `docs/architecture.md` (the new modules, `PP_CIVS`, `civsFor`, `turnKind`, `conquerRolled`, shared hexes); `docs/status.md` (#33's entry: parts 2 and 3; the summary line).
- [ ] The whole suite: `npm run check`, `npm run test:unit`, `npx vitest run tests/simulation.test.mjs` with `SIM_GAMES=600`, `PORT=3021 npx playwright test --workers=1`.
- [ ] Commit `Fix #33: Plans & Ploys' civilizations, cards and responses`. (Pushing and closing wait for the owner.)
