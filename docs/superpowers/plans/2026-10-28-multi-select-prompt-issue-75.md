# Picking several things one by one (#75) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every choice of several resources, cards or tiles is made item by item (BGA's one-box-per-resource method, drawn as stacked rows), and Confirm only ever sends one of the decision's own answers.

**Architecture:** A plain module, `src/lib/picks.js`, turns a decision (or an advance's payments) into a pick model (fixed and free resource rows, an item picker, candidate answers) and answers every question about a selection: what can be picked, what it matches, what to say. A new `ResourceRows` component and multi-choice modes of `TilePicker`, `CardShelf` and the Terrain tab draw it; `DecisionPanel` gains a centred placement; `Game.svelte` keeps the selection and sends the matched answer. The engine doesn't change.

**Tech Stack:** Svelte 5 (runes) with JSDoc, Vite, Vitest with `node:assert/strict`, Playwright (Chromium).

**Spec:** `docs/superpowers/specs/2026-10-28-multi-select-prompt-design.md`

## Global Constraints

- Follow CONVENTIONS.md: JavaScript with JSDoc, no TypeScript; Prettier (tabs, single quotes); braces on every `if`; each file starts with a one-line comment; `npm run check` reports 0 errors and 0 warnings.
- Components: `<script module>` with `@typedef`, `@property`, `@example`; `$props()` typed `/** @type {Props} */`; `{...attr}` on the root with `class` merged; BEM classes `rg-{component}--{element|modifier}`; colours from tokens; handlers `{action}Handler`; callbacks `on{ComponentName}{Action}` receiving a `ComponentEvent`; a library section and a row in `src/lib/components/README.md` for every new component.
- Resource order everywhere is `RESOURCES` from `src/lib/ui.js`: coin, food, worker, culture.
- The cap is `RESOURCE_CAP` (8) from `src/lib/engine/effects/gain.js`; never hard-code 8.
- Rows are interchangeable: only how many of each resource is chosen counts.
- The answer rule: an item (resource in a free row, card or tile) is enabled only if some candidate answer contains everything chosen so far plus it.
- A decision with at most one answer that picks anything (besides declining) keeps today's prompt (`pickModel` returns null).
- Every centred panel's centre is the screen's centre; a card payment (tapestry or tech) keeps today's bottom panel with the shelf above.
- Commits reference the issue: `Refs #75: …`. Tests first: watch each fail before the code.

## Review Focus

1. **The decision changes mid-selection** (a timeout, an undo, another seat's move opens a new decision): the selection must reset, and a selection built for the old model must never match the new one. Pinned in Task 1 (`matchIndex` returns -1 for a selection of the wrong shape) and Task 6 (reset on `decisionKey`).
2. **A gain that overflows several resources** (7 food and 8 coin, take food, food, coin): the warning names each loss. Pinned in Task 1.
3. **Keyboard only**: Tab reaches each enabled resource and Space picks it; a disabled one is skipped. Pinned in Task 8.
4. **Pressing Confirm twice, or picking while the move is being sent**: nothing changes and one move is sent. Pinned in Task 6 (`sending` disables the rows) and Task 8.
5. **A VP trade's second send fails**: the `chooseResource` it opened must still be answerable by rows. Pinned in Task 2 (`pickModel` builds rows for that `chooseResource`, `count` from the trade).

---

### Task 1: The pick model for resource rows

**Files:**
- Create: `src/lib/picks.js`
- Test: `tests/client-picks.test.mjs`

**Interfaces:**
- Consumes: `advanceCost`, `TRACK_RESOURCE` (`src/lib/engine/data/tracks.js`); `RESOURCE_CAP` (`src/lib/engine/effects/gain.js`); `RESOURCES` (`src/lib/ui.js`); `describeAnswer`, `describePayment` (`src/lib/describe.js`); `AdvanceOption` (`src/lib/turn.js`).
- Produces (all exported from `src/lib/picks.js`):
  - `@typedef {'coin'|'food'|'worker'|'culture'} ResourceId`
  - `@typedef {{ fixed: ResourceId | null, offers: ResourceId[] }} PickRow` — `offers` is `[]` for a fixed row
  - `@typedef {{ kind: 'territory'|'tapestry'|'tech', ids: (number|string)[], count: number }} PickItems`
  - `@typedef {{ index: number, resources: Partial<Record<ResourceId, number>>, items: (number|string)[], label: string }} Candidate` — `index` into the decision's answers (or the advance's payments); for `convert`, `resources` is what food becomes
  - `@typedef {{ mode: 'gain'|'pay'|'convert', rows: PickRow[], items: PickItems | null, candidates: Candidate[], decline: number | null, lead: string, then: 'chooseResource' | null }} PickModel`
  - `@typedef {{ rows: (ResourceId | null)[], items: (number|string)[] }} Selection`
  - `pickModel(decision, game, seat): PickModel | null` — this task: `chooseResource`, `chooseConversion`, `chooseBonus` paying resources; null for every other kind
  - `advanceModel(option, game): PickModel | null` — null when `option.payments.length <= 1`
  - `emptySelection(model): Selection` — fixed rows hold their resource
  - `togglePick(model, selection, row, resource): Selection` — the chosen one again clears the row; a fixed row never changes
  - `canPick(model, selection, row, resource): boolean`
  - `matchIndex(model, selection): number` — the candidate's `index`, or -1 when incomplete, unmatched or shaped for another model
  - `pendingCounts(model, selection, held): Record<ResourceId, number>` — uncapped
  - `pickStatus(model, selection, held): { text: string, warn: boolean }`

- [ ] **Step 1: Write the failing tests** in `tests/client-picks.test.mjs`. Build decisions by hand with `answers` from the engine (`DECISIONS.chooseResource.answers(state, decision)` on a `startedGame()` from `tests/helpers/engine.mjs`, with the seat's resources set), so the answers are the engine's own. Tests (names are the sentences):
  - `'choose 3 resources is three free rows offering every resource'` — `model.mode === 'gain'`, `model.rows` deep-equals three `{ fixed: null, offers: ['coin','food','worker','culture'] }`, `model.lead === 'Pick one resource in each row.'`, `model.candidates.length === 20`.
  - `'a gain from a short list offers only those resources'` — a hand-built `chooseResource` with `from: ['coin','worker']`, count 2: each row's `offers` deep-equals `['coin','worker']`.
  - `'a single resource is one row'` — count 1: one row; lead `'Pick a resource.'`.
  - `'picking food twice and a coin matches the answer with 2 food and 1 coin'` — `togglePick` three times, then `matchIndex` equals the index of the answer whose `resources` deep-equals `{ coin: 1, food: 2 }`.
  - `'picking the chosen resource again clears its row'` — after two `togglePick(…, 0, 'food')`, `selection.rows[0] === null` and `matchIndex === -1`.
  - `'a tier III advance has its track resource fixed first and two free rows'` — `advanceModel` for military 6 → 7 with resources `{ coin: 2, food: 1, worker: 0, culture: 3 }`: rows deep-equal `[{ fixed: 'culture', offers: [] }, free, free]`; lead `'Tier III costs 1 culture and 2 resources of your choice. Pick one in each empty row.'`.
  - `'a payment row offers only what is still held'` — same advance: `canPick(model, sel, 1, 'worker') === false`; after picking food in row 1, `canPick(model, sel, 2, 'food') === false` and `canPick(model, sel, 2, 'culture') === true`.
  - `'an advance with one legal payment needs no rows'` — resources exactly `{ culture: 1, coin: 2 }` at tier III → `advanceModel` returns null.
  - `'a bonus paying 1 resource of your choice is one row with Decline'` — `chooseBonus` with `cost: { any: 1 }`: one free row; `model.decline` is the index of `{ pay: null }`; lead `'Pay 1 resource of your choice. Pick one in each empty row.'`.
  - `'Mercantilism gives one row per food it may convert, food keeping it'` — `chooseConversion` `max: 2`, food held 1: one row (`min(max, food)`); offers all four; picking `food` matches the answer `{ resources: {} }`; picking `coin` matches `{ resources: { coin: 1 } }`; `model.decline` is the `{ resources: {} }` answer's index; lead `'Pick what each food becomes; food keeps it.'`.
  - `'the counts follow the choices'` — gain: `pendingCounts` after food, food from `{ food: 7 }` gives `food: 9`; pay: tier III after culture, coin gives `culture: 2, coin: 1`; convert: one food to coin gives `food: 0, coin: +1`.
  - `'the status counts down, then says what happens, and warns at the cap'` — empty gain of 3: `{ text: 'Pick a resource in each row.', warn: false }`; one picked: `'Choose 2 more.'`; complete coin, food, food holding `{ coin: 2, food: 7 }`: `{ text: 'You gain 1 coin and 2 food. You can hold 8 of each: 1 food would be lost.', warn: true }`; holding 8 coin and 7 food, picking coin, food, food: the text ends `'1 coin and 1 food would be lost.'`; a complete payment: the matched candidate's `label` (`describePayment`), warn false.
  - `'a selection shaped for another model never matches'` — a complete 2-row selection against a 3-row model returns -1.
- [ ] **Step 2: Run** `npx vitest run tests/client-picks.test.mjs` — expect FAIL: `src/lib/picks.js` doesn't exist.
- [ ] **Step 3: Implement** `src/lib/picks.js`. One private `rowsOfCost(cost, track)` turns any Cost into rows: each named resource unit (and `track` → `TRACK_RESOURCE[track]`) a fixed row first, in `RESOURCES` order, then `any` free rows; `vp` makes no row. A candidate's `resources` come from the answer (`resources` for gains and conversions, the resource keys of `pay` for payments); its `label` is `describeAnswer(decision, answer, game)`, or `describePayment(payment)` for an advance. `canPick` and `matchIndex` follow the Global Constraints' answer rule, counting the selection across all rows (a `convert` row's `food` counts as nothing): covered means every count ≤ the candidate's; matched means every count equal. The cost words in the leads read `'1 culture and 2 resources of your choice'`, `'1 resource of your choice'`; the tier is a Roman numeral. Resource words read like `describe.js`' (`'1 coin and 2 food'`, `'1 coin, 1 food and 1 worker'`).
- [ ] **Step 4: Run** `npx vitest run tests/client-picks.test.mjs` — expect PASS; then `npm run check` — 0 errors, 0 warnings.
- [ ] **Step 5: Commit** — `git add src/lib/picks.js tests/client-picks.test.mjs` and `git commit -m "Refs #75: a pick model for resource rows"`.

### Task 2: Cards, tiles and trades in the pick model

**Files:**
- Modify: `src/lib/picks.js`
- Test: `tests/client-picks.test.mjs`

**Interfaces:**
- Consumes: Task 1's types and functions.
- Produces:
  - `pickModel` also handles `chooseBonus` paying `territory`, `tapestry` or `tech` (`model.items` set, `count` from the cost, `ids` = every id some answer pays, in the order the answers first name them) and the `chooseResource` a VP trade opens (no special case needed: it is a plain `chooseResource`).
  - `pickModel` returns null when at most one answer picks anything (besides the decline).
  - `toggleItem(model, selection, id): Selection`; `canPickItem(model, selection, id): boolean`.
  - `@typedef {{ offer: number, pay: Record<string, number>, gain: Record<string, number>, enabled: boolean, label: string }} TradeOffer` — `gain` holds `vp` or `any` (from the offer's `gain` effects).
  - `tradeOffers(decision, game, seat): TradeOffer[] | null` — null when the trade has at most one answer that pays anything; `enabled` when some answer names the offer.
  - `offerModel(decision, offer, game, seat): PickModel | null` — an offer paying resources: `mode 'pay'`, rows from its `pay`, candidates its answers; an offer paying VP: `mode 'gain'`, rows for the resources it gains, every candidate pointing at the trade answer's index, `then: 'chooseResource'`; null when the offer has one answer and nothing to pick.

- [ ] **Step 1: Write the failing tests:**
  - `'a bonus paying 3 territory tiles picks 3 of the tiles held'` — `chooseBonus` with `cost: { territory: 3 }` and 6 tiles: `model.rows` is `[]`, `model.items` deep-equals `{ kind: 'territory', ids: <the 6 ids>, count: 3 }`, lead `'Pay 3 territory tiles. Pick them here or on your Terrain tab.'`.
  - `'once 3 tiles are chosen the others wait'` — after three `toggleItem`, `canPickItem` is false for the other three and true for a chosen one; `matchIndex` is the index of the answer with those three tiles (any order); `pickStatus` incomplete reads `'Choose 1 more tile.'`.
  - `'tapestry cards to pay are picked the same way'` — `cost: { tapestry: 2 }`: `items.kind === 'tapestry'`, lead `'Pay 2 tapestry cards. Pick them above.'`, status `'Choose 2 more cards.'`.
  - `'a free bonus keeps today’s prompt'` and `'a trade with one legal payment keeps today’s prompt'` — Olympic Host's optional trade (one offer, `pay: { worker: 1 }`, plus the decline): `pickModel` and `tradeOffers` return null.
  - `'Guilds offers six trades, the unaffordable ones disabled'` — the engine's `chooseTrade` answers for a seat with 12 VP and `{ food: 2, culture: 1 }`: six offers; `offer 2` (15 VP) `enabled === false`; labels read `'Pay 5 VP for 1 resource of your choice'` … `'Pay 3 resources of your choice for 15 VP'`.
  - `'a trade paying resources picks them in rows'` — `offerModel(…, 4)`: two free rows; lead `'Gain 10 VP. Pick the 2 resources you pay, one in each row.'`; food then culture matches the answer `{ offer: 4, pay: { food: 1, culture: 1 } }`.
  - `'a trade paying VP picks what it gains, then answers the chooseResource it opens'` — `offerModel(…, 1)`: `mode 'gain'`, two rows, `then === 'chooseResource'`, lead `'Pay 10 VP. Pick the 2 resources you gain, one in each row.'`, every complete selection matches the index of `{ offer: 1, pay: { vp: 10 } }`; and after playing that answer in the engine, `pickModel` of the `chooseResource` it opens matches the same selection to the right answer.
- [ ] **Step 2: Run** `npx vitest run tests/client-picks.test.mjs` — expect the new tests to FAIL.
- [ ] **Step 3: Implement** the items (from the `territory`, `tapestry` and `tech` arrays of `pay`; `canPickItem` uses the same answer rule over items, together with any rows), the single-answer rule, `tradeOffers` (labels from the offer, through `describe.js` words where they exist) and `offerModel`.
- [ ] **Step 4: Run** `npx vitest run tests/client-picks.test.mjs` and `npm run check` — PASS, clean.
- [ ] **Step 5: Commit** — `Refs #75: cards, tiles and trades in the pick model`.

### Task 3: The prompt carries its picks, checked over random games

**Files:**
- Modify: `src/lib/prompts.js` (the `Prompt` typedef and `promptFor`)
- Modify: `tests/client-prompts.test.mjs`

**Interfaces:**
- Consumes: `pickModel`, `tradeOffers`, `offerModel`, `advanceModel`, `emptySelection`, `togglePick`, `toggleItem`, `canPick`, `canPickItem`, `matchIndex` (Tasks 1–2); `advanceOptions` (`src/lib/turn.js`).
- Produces: `Prompt.picks: PickModel | null` and `Prompt.trade: TradeOffer[] | null`; `layout`, `options` and the rest unchanged.

- [ ] **Step 1: Write the failing test** `'every answer of a pick prompt can be built by allowed picks and matches back to itself, over random games'` in `tests/client-prompts.test.mjs`, playing 60 seeds the way the existing random-games test does. For each open decision with `prompt.picks` (and each `offerModel` of `prompt.trade`, and each `advanceModel` of `advanceOptions(game, seat)` while a turn choice or advance is open): for every candidate, build its selection pick by pick from `emptySelection` — fixed rows first, free rows in `RESOURCES` order, then the items — asserting `canPick`/`canPickItem` before each pick, then `matchIndex` equals `candidate.index`. Then make 5 random walks per model (pick any enabled resource or item until complete) and assert `matchIndex !== -1`. Assert `prompt.picks` is set for at least one `chooseResource`, one `chooseBonus` and one advance model, and that the counts of checked models exceed 100.
- [ ] **Step 2: Run** `npx vitest run tests/client-prompts.test.mjs` — expect FAIL (`prompt.picks` undefined).
- [ ] **Step 3: Implement** `picks: pickModel(decision, game, seat)` and `trade: decision.kind === 'chooseTrade' ? tradeOffers(decision, game, seat) : null` in `promptFor`, with the typedef lines.
- [ ] **Step 4: Run** `npx vitest run tests/client-prompts.test.mjs tests/client-picks.test.mjs` — PASS.
- [ ] **Step 5: Commit** — `Refs #75: the prompt carries its picks, checked over random games`.

### Task 4: ResourceRows

**Files:**
- Create: `src/lib/components/prompts/ResourceRows.svelte`
- Create: `src/library/sections/prompts/ResourceRows.svelte`
- Modify: `src/lib/components/README.md` (one row)

**Interfaces:**
- Produces:
  - Props: `rows: { fixed: ResourceId | null, picked: ResourceId | null, choices: { id: ResourceId, count: number, disabled: boolean, reason?: string }[] }[]`, `disabled = false` (everything, while a move is sent), `onResourceRowsPick` — fired with `{ row, resource }`.
  - Markup: each row a `role="group"` named `'Resource 2 of 3'`; its number; a box of toggle buttons (`aria-pressed`, `aria-label` `'Food, 7 held'`, `title` the `reason` when disabled); then the picked name (`'Food'`, `'Culture · set by the cost'`, or `'—'`). A fixed row draws its one resource, chosen, not a button. The other choices of a picked row fade to 30%; a disabled one is 30% and not clickable. Art: `/art/resource-48/<id>.svg` at 38px in 52px buttons; the count in the corner, capped at `RESOURCE_CAP`.

- [ ] **Step 1: Write the library section** with examples: three empty free rows; one picked; complete; a fixed row and two free rows with `worker` disabled (`reason: 'You hold no worker'`); `disabled`. Interactive: the section keeps its own picks through `togglePick` on a hand-built model, and reports the last pick in a line.
- [ ] **Step 2: Run** `npx vitest run tests/library.test.mjs` — expect FAIL until the component exists (the section imports it).
- [ ] **Step 3: Implement** `ResourceRows.svelte` following the Global Constraints, with a `pickHandler`.
- [ ] **Step 4: Run** `npx vitest run tests/library.test.mjs` and `npm run check` — PASS, clean. Look at `/components.html#ResourceRows` at 1920×1080: it matches the approved mockup's rows.
- [ ] **Step 5: Commit** — `Refs #75: ResourceRows draws one row per resource to choose`.

### Task 5: Multiple choice in TilePicker, CardShelf and the Terrain tab; SelfSummary's pending counts; a centred DecisionPanel

**Files:**
- Modify: `src/lib/components/prompts/TilePicker.svelte`, `src/lib/components/prompts/CardShelf.svelte`, `src/lib/components/player/SelfSummary.svelte`, `src/lib/components/prompts/DecisionPanel.svelte`, `src/screens/game/PlayerTabs.svelte`, `src/styles/tokens.css`
- Modify: their library sections in `src/library/sections/` and rows in `src/lib/components/README.md`

**Interfaces:**
- Produces:
  - `TilePicker`: `selected: number | number[] | null`; new `disabled: number[] = []` (tiles that can't be picked now).
  - `CardShelf`: `selected: number | number[] | null` (card indexes); new `disabled: number[] = []`.
  - `PlayerTabs.tilePick: { tiles: number[], selected: number | number[] | null, disabled?: number[] } | null`.
  - `SelfSummary`: new `changed: string[] = []` — resource ids drawn gold.
  - `DecisionPanel`: new `centred = false` — the panel's centre at the screen's centre, `width: var(--centred-panel-width)`, the scrim as today; never with `docked` or `shelf`.
  - `tokens.css`: `--centred-panel-width: 440px`.

- [ ] **Step 1: Write the library examples first:** TilePicker with three of six chosen and the rest disabled; CardShelf (tapestry) with two chosen; SelfSummary with `changed={['food']}`; DecisionPanel `centred` holding `ResourceRows` (the four scenes of the design's §3, the tiles scene with TilePicker).
- [ ] **Step 2: Run** `npm run check` — expect errors for the props that don't exist yet.
- [ ] **Step 3: Implement** the props; existing single-choice uses keep working unchanged (`selected` a number).
- [ ] **Step 4: Run** `npx vitest run tests/library.test.mjs`, `npm run check`, and `npm run test:e2e -- tests/browser/library.test.mjs tests/browser/explore-prompt.test.mjs` — PASS (the explore prompt still picks one tile).
- [ ] **Step 5: Commit** — `Refs #75: multiple choice for tiles and cards, pending counts and a centred panel`.

### Task 6: The game's pick prompts

**Files:**
- Modify: `src/screens/Game.svelte`

**Interfaces:**
- Consumes: `prompt.picks`, `prompt.trade`, `offerModel` and the selection functions (Tasks 1–3); the component props of Tasks 4–5.

- [ ] **Step 1: Write the failing browser test** `tests/browser/pick-prompts.test.mjs`, test `'a bonus is paid with the 2 tiles the player picks'`: drive a two-seat hot-seat table through the API (as `explore-prompt.test.mjs` does, preferring exploration and advancing) until a seat's open decision is a `chooseBonus` with `cost.territory === 2`; take that seat's screen; expect a centred panel (its box's centre within 2px of 960,540) titled `'Take the bonus: gain 5 VP?'` with `'Your tiles · 0 of 2 chosen'`; click two tiles (one in the panel, one on the Terrain tab), expect `'2 of 2 chosen'` and the third tile disabled; press `'Pay 2 tiles'`; expect the seat's territory count to drop by 2 and VP to rise by 5. End and leave the table.
- [ ] **Step 2: Run** `npm run test:e2e -- tests/browser/pick-prompts.test.mjs` — expect FAIL.
- [ ] **Step 3: Implement** in `Game.svelte`: `let selection = $state(…)` reset with `picked` on `decisionKey`; `let tradeOffer = $state(null)` reset there too; `let pickView = $derived(prompt?.trade && tradeOffer !== null ? offerModel(…) : prompt?.picks)`; the panel is `centred` when `pickView` has no tapestry or tech items; its content is the lead, `ResourceRows` (rows built from `pickView`, `canPick` and `pendingCounts`), and for items either `TilePicker` (multi, plus `tilePick` on `PlayerTabs`) or the multi `CardShelf`; its status is `pickStatus` (the warn style for the cap); Confirm (`'Pay 2 tiles'` for items, `'Confirm'` otherwise) is disabled until `matchIndex !== -1`; `cancelLabel` is `'Decline'` when `pickView.decline !== null` (sending that answer), `'Back'` inside a trade offer; `SelfSummary` gets `pendingCounts` (capped for display) and `changed`; the rows and tiles are disabled while `sending`. A trade without `tradeOffer` shows its offers as `DecisionOption`s in two columns (art: VP badge, `any` with its count); picking one sets `tradeOffer`. Confirm on a model with `then === 'chooseResource'` sends the trade answer, then, if `myDecision` is that `chooseResource`, sends its matched answer from `pickModel` with the same selection.
- [ ] **Step 4: Run** the browser test and `npm test` — PASS.
- [ ] **Step 5: Commit** — `Refs #75: the game's prompts pick resources, tiles and cards one by one`.

### Task 7: The advance's payment panel

**Files:**
- Modify: `src/screens/Game.svelte`

**Interfaces:**
- Consumes: `advanceModel` (Task 1); `ResourceRows`, `DecisionPanel centred` (Tasks 4–5).

- [ ] **Step 1: Write the failing browser test** in `tests/browser/pick-prompts.test.mjs`, `'picking a space with a choice of payment opens the centred panel, and Advance pays what was picked'`: a fresh hot-seat table to the first player's first turn (their starting resources give a tier I space several payments); click Scouting; expect the centred panel `'Advance to Scouting'` at once, one free row; Cancel closes it and clears the space; click Scouting again, pick a resource the player holds with the keyboard (Tab to it, Space), press Advance; expect that resource's counter to drop by 1 and the token on space 1. End and leave the table.
- [ ] **Step 2: Run** it — expect FAIL.
- [ ] **Step 3: Implement:** `trackSelectHandler` opens the panel (`paying = true`) when `advanceModel(chosen, game)` isn't null; the panel replaces the "How do you pay for …?" list (delete `payIndex`, `validPay`, `paySymbols` and the list markup); it is `centred`, tinted with the track, titled `'Advance to <space name>'`, with Cancel (closes and clears `selected`) and Advance; `advanceHandler` sends `option.payments[matchIndex(…)]`, or `payments[0]` when there is no model.
- [ ] **Step 4: Run** the browser tests and `npm test` — PASS.
- [ ] **Step 5: Commit** — `Refs #75: an advance's payment is picked in rows in a centred panel`.

### Task 8: The gain and keyboard browser checks

**Files:**
- Modify: `tests/browser/pick-prompts.test.mjs`, `tests/browser/library.test.mjs`

- [ ] **Step 1: Write the tests:** in the library, `'two chosen resources are gained, and a resource can be picked with the keyboard'` on the ResourceRows interactive example: Tab to row 1's food, Space, Tab to row 2's coin, Space; the example's line reports both; a disabled resource is never focused. In `pick-prompts.test.mjs`, `'Confirm sends once'`: double-click Advance in the advance test's panel and expect one `tokenMoved` in the table log.
- [ ] **Step 2: Run** `npm run test:e2e` — the new tests PASS against Tasks 4–7 (fix anything they find).
- [ ] **Step 3: Commit** — `Refs #75: browser checks for gains, the keyboard and a single send`.

### Task 9: Documentation and screenshots

**Files:**
- Modify: `README.md` ("Current interface"), `docs/ui/README.md`, `docs/ui/screens/` (new `game-prompt-resources.png` from the running game: the advance panel; replace any screenshot showing the old payment list), `docs/architecture.md` (`picks.js`), `docs/status.md`, `CLAUDE.md` ("Where the work stands"), the design's §8 if anything changed.

- [ ] **Step 1:** Capture the screenshot at 1920×1080 from the running game (the Task 7 table state); update the README and `docs/ui/README.md` (drop the footer's payment list, describe the rows, the centred panel and the card exception).
- [ ] **Step 2:** Run `npm test` and `npm run check` — PASS, clean.
- [ ] **Step 3: Commit** — `Refs #75: the README and docs show the pick prompts`.
