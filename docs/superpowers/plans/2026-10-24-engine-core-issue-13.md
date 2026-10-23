# Rules engine core (issue #13) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DOM-independent engine core: `createGame()` with simultaneous setup choices, the operation stack and run loop, `play()`, the `gain` and `vp` effects, events and `view()`. Then close #13.

**Architecture:**
- Effects and turns push **operations** onto `state.pending`. A run loop runs the automatic ones and stops at **decisions**, which players answer with `play()`.
- A **group** operation holds one lane per player, so several players can decide at once. The setup picks are the first group.
- Every decision kind and automatic kind is a small module, registered in `kinds.js`. Handlers get a `Context` instead of importing the stack, so the modules form no import cycles.

**Tech Stack:** Node.js 22.12+ ES modules with no packages, JSDoc checked by svelte-check (`checkJs`, `strict`), and `node:test`.

**Spec:** [docs/superpowers/specs/2026-10-24-engine-core-design.md](../specs/2026-10-24-engine-core-design.md)

## Global Constraints

- **Engine modules** (`src/lib/engine/**/*.js`):
  - import only relative paths, and never the DOM, Svelte or Node. `tests/engine-data.test.mjs` already scans every file under `src/lib/engine/`;
  - never call `Math.random()`. Randomness is a `random(n)` argument returning a whole number from 0 to n − 1;
  - keep the state JSON-safe: plain objects, arrays, strings, numbers, booleans and `null`, never `undefined` values.
- **Style:**
  - JSDoc, no TypeScript;
  - a one-line comment at the top of every file, and JSDoc on every export;
  - braces on every `if`/`else`, and Prettier (tabs, single quotes), so run `npm run format`;
  - `npm run check` reports 0 errors and 0 warnings.
- **`play()` is pure.** It works on a `structuredClone`. A rejected action throws `PlayerError` and leaves its input deep-equal to before.
- **Errors.**
  - `PlayerError` messages are sentences a player understands.
  - Bugs and not-yet-built rules are ordinary `Error`s that name the issue that builds them (#14–#20).
- **Seats** are numbered 1 to n in `players` order. That order is clockwise and is turn order.
- **The top of every deck and stack is index 0.**
- **Tests** use `node:test` and `node:assert/strict`, in `tests/engine-*.test.mjs`.
  - Test names are sentences that cite the rule, for example `'R40: …'` or `'(01 §2.2)'`.
  - Randomized tests print their seed when they fail.
- **Commits** say `Refs #13: …`; the last one says `Fix #13: …`. Each ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **The state survives a JSON round trip unchanged.** A stray `undefined`, such as a `picks` field set to `undefined`, breaks the server's storage and the deep-equal tests. The test is in Task 6.
2. **`view()` for a seat that isn't in the game** (0, 9, or a string) must give the public view, never a crash or a leak. The test is in Task 6.
3. **The discarded capital mat must not be public before the reveal.** If it went to `supply.capitals` at pick time, it would show which mat was kept. The tests are in Task 4 and in Task 6's random games.
4. **Malformed actions** (`null`, `{}`, `{ decision: '7' }`, or a seat number not in the game) give a `PlayerError`, never a `TypeError`. The test is in Task 4.
5. **`players` that isn't an array**, or that has 0 or 6 entries, gives a `PlayerError`. The test is in Task 3.

## The shared types (`src/lib/engine/state.js`, Task 1)

Every later task uses these names. They are JSDoc typedefs, plus two helpers.

```js
/** @typedef {import('./random.js').Random} Random */
/** @typedef {{ seat: number, toppled: boolean }} Outpost */
/** @typedef {{ tile: number | null, orient: number, outposts: Outpost[] }} Hex */
/**
 * @typedef {Object} Seat — common to every kind
 * @property {number} seat
 * @property {'player' | 'automa' | 'shadow'} kind
 * @property {string} name
 * @property {number} vp
 * @property {Record<TrackId, number[]>} tracks - Token spaces per track, [0] at the start
 * @property {number} outposts - In supply
 * @property {number} incomeTurns
 * @property {boolean} finished
 */
/**
 * @typedef {Object} PlayerFields — only on kind 'player'
 * @property {Record<ResourceId, number>} resources
 * @property {{ buildings: Record<BuildingId, number>, tapestry: string[][] }} incomeMat - Buildings left in each row; 4 era slots, each a stack
 * @property {{ mat: number | null }} capital
 * @property {string[]} besideMat - Landmarks that didn't fit
 * @property {string[]} hand
 * @property {{ bottom: string[], middle: string[], top: string[] }} tech
 * @property {number[]} territoryTiles
 * @property {number[]} spaceTiles
 * @property {number[]} exploredSpace
 * @property {string[]} civs
 * @property {{ capital?: number, civ?: string }} picks - Setup picks until the reveal
 */
/** @typedef {Seat & PlayerFields} PlayerSeat */
/**
 * @typedef {Object} Supply
 * @property {{ deck: string[], faceUp: string[], discard: string[] }} tech
 * @property {{ deck: string[], discard: string[] }} tapestry
 * @property {number[]} territory
 * @property {number[]} space
 * @property {string[]} civs
 * @property {number[]} capitals - Mats nobody holds, face up
 */
/** @typedef {{ id: number, batch: number, player: number | null, kind: string } & Record<string, any>} Operation */
/** @typedef {{ player: number | null, kind: string } & Record<string, any>} NewOperation */
/** @typedef {{ player: number, stack: Operation[] }} Lane */
/** @typedef {{ player: number, ops: NewOperation[] }} NewLane */
/** @typedef {{ id: number, batch: number, player: null, kind: 'group', lanes: Lane[] }} Group */
/** @typedef {{ seq: number, type: string, player?: number, secret?: Record<string, any> } & Record<string, any>} GameEvent */
/**
 * @typedef {Object} State
 * @property {VersionId} version
 * @property {string[]} expansions
 * @property {'small' | 'large'} map
 * @property {'setup' | 'play' | 'over'} phase
 * @property {number} first
 * @property {number | null} current
 * @property {(Seat | PlayerSeat)[]} seats - Index = seat − 1
 * @property {Supply} supply
 * @property {Record<string, Hex>} hexes
 * @property {string[]} landmarks - Ids nobody owns yet
 * @property {Record<string, number[]>} achievements - Seats in box order
 * @property {(Operation | Group)[]} pending - Index 0 is the top
 * @property {number} nextId
 * @property {number} seq
 * @property {GameEvent[]} events
 */
/**
 * @typedef {Object} Context — what a handler may use
 * @property {State} state
 * @property {Random} random
 * @property {(ops: NewOperation[]) => Operation[]} push - Onto the stack the handler runs in (the main stack or a lane)
 * @property {(lanes: NewLane[]) => Group} pushGroup - Main stack only; throws Error inside a lane
 */
/** @typedef {Record<string, any>} Answer - An action without its `decision` id */
/**
 * @typedef {Object} DecisionKind
 * @property {readonly string[]} hidden - Fields only the decision's player sees
 * @property {(state: State, decision: Operation) => Answer[]} answers - Every legal answer, default first
 * @property {(state: State, decision: Operation, answer: Answer) => void} check - Throws PlayerError
 * @property {(ctx: Context, decision: Operation, answer: Answer) => void} resolve
 */
/** @typedef {(ctx: Context, op: Operation) => void} AutomaticKind */
/** @typedef {(ctx: Context, player: number, value: any) => void} EffectHandler */
```

- `seatOf(state, seat): Seat | PlayerSeat` throws `Error` for an unknown seat.
- `playerSeat(state, seat): PlayerSeat` also throws `Error` when the seat's kind isn't `'player'`.

---

### Task 1: Foundations

**Files:**
- Create: `src/lib/engine/errors.js`, `src/lib/engine/random.js`, `src/lib/engine/events.js`, `src/lib/engine/state.js`
- Modify: `CONVENTIONS.md` ("Rules engine", the **Randomness** bullet)
- Test: `tests/engine-foundations.test.mjs`

**Interfaces:**
- Produces:
  - `class PlayerError extends Error`, with `name` set to `'PlayerError'`;
  - `/** @typedef {(n: number) => number} Random */`;
  - `shuffle(list, random)`, which returns a new array: Fisher–Yates with `j = random(i + 1)`;
  - `seededRandom(seed: number): Random` (the builder picks the algorithm, such as mulberry32);
  - `EVENT_WINDOW = 500`;
  - `emit(state, event): GameEvent`, which adds `seq` and trims the oldest events beyond `EVENT_WINDOW`;
  - everything in "The shared types".

- [ ] **Step 1: Write the failing tests**

```js
test('PlayerError is an Error named PlayerError', () => {
	const error = new PlayerError('Wait for your turn.');
	assert.ok(error instanceof Error);
	assert.equal(error.name, 'PlayerError');
});
test('shuffle returns a new list with the same items and leaves its input alone', () => {
	const list = [1, 2, 3, 4, 5, 6, 7, 8];
	const shuffled = shuffle(list, seededRandom(7));
	assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7, 8]);
	assert.deepEqual([...shuffled].sort((a, b) => a - b), list);
});
test('seededRandom gives whole numbers from 0 to n − 1, the same for the same seed', () => {
	const a = seededRandom(42), b = seededRandom(42);
	for (let i = 0; i < 1000; i++) {
		const n = 1 + (i % 12), value = a(n);
		assert.ok(Number.isInteger(value) && value >= 0 && value < n);
		assert.equal(value, b(n));
	}
});
test('two seeds give different shuffles', () => { /* 1..20 under seeds 1 and 2 differ */ });
test('emit numbers events from 1, each one more than the last', () => {
	const state = { seq: 0, events: [] };
	emit(state, { type: 'a' }); emit(state, { type: 'b' });
	assert.deepEqual(state.events.map((e) => e.seq), [1, 2]);
	assert.equal(state.seq, 2);
});
test('the state keeps only the newest 500 events', () => {
	// 501 emits → 500 events, the first has seq 2, state.seq is 501
});
test('playerSeat refuses a seat that is not a player', () => {
	const state = { seats: [{ seat: 1, kind: 'automa' }] };
	assert.throws(() => playerSeat(state, 1), (error) => !(error instanceof PlayerError));
	assert.throws(() => seatOf(state, 2));
});
```

- [ ] **Step 2:** Run `node --test tests/engine-foundations.test.mjs`. Expected: FAIL, because the modules don't exist.
- [ ] **Step 3:** Implement the four modules as listed under **Interfaces**.
- [ ] **Step 4:** In CONVENTIONS.md, change the Randomness bullet to read: "comes in as a `random(n)` function returning a whole number from 0 to n − 1: `crypto.randomInt` on the server, `seededRandom(seed)` from `src/lib/engine/random.js` in tests. The state never holds a seed."
- [ ] **Step 5:** Run `node --test tests/engine-foundations.test.mjs tests/engine-data.test.mjs` and `npm run check`. Expected: PASS, 0 errors, 0 warnings.
- [ ] **Step 6:** Run `npm run format`, then commit with `Refs #13: add the engine's errors, randomness, events and state types`.

### Task 2: The operation stack and the run loop

**Files:**
- Create: `src/lib/engine/stack.js`, `src/lib/engine/loop.js`, `src/lib/engine/kinds.js`, `src/lib/engine/effects/index.js`, `src/lib/engine/effects/vp.js`, `src/lib/engine/decisions/choose-turn.js`
- Modify: `CONVENTIONS.md` ("Rules engine", the **Pending decisions** bullet)
- Test: `tests/engine-stack.test.mjs`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - **`stack.js`:**
    - `push(state, stack, ops: NewOperation[]): Operation[]`. Each op gets `id = state.nextId++`, and all of them get `batch` = the first new id. They go on top in the given order, so `ops[0]` ends up at index 0.
    - `pushGroup(state, lanes: NewLane[]): Group` pushes onto `state.pending`.
    - `isDecision(op)` is true when `op.kind` is in `DECISIONS`.
    - `openDecisions(state): Operation[]` gives the top batch of decisions on the main stack, or on every lane when a group is on top.
    - `locate(state, id): { op, stack, open } | null` searches the main stack and every lane.
  - **`loop.js`:**
    - `contextFor(state, random, stack): Context`;
    - `run(state, random): void`, which changes `state`;
    - `resolveEffects(state, player, effects, random): State`, which clones, pushes `{ player, kind: 'effects', effects }` onto the main stack, runs the loop and returns the clone.
  - **`kinds.js`:** `DECISIONS: Record<string, DecisionKind>` starts as `{ chooseTurn }`. `AUTOMATIC: Record<string, AutomaticKind>` starts as `{ effects: runEffects }`.
  - **`effects/index.js`:** `EFFECTS: Record<string, EffectHandler>` starts as `{ vp }`. It also exports `runEffects`.
  - **`effects/vp.js`:** `vp(ctx, player, value)`. For a number it adds that much to the seat's VP and emits `vpGained { player, vp, total }`. For `{ per }` it throws `Error('VP counters arrive with #14.')`.
  - **`decisions/choose-turn.js`:** `chooseTurn: DecisionKind`, plus `turnOptions(seat)`, which gives `['income']` when `seat.incomeTurns === 0` and `['income', 'advance']` otherwise.
    - The decision's fields are `{ options }`; `hidden: []`.
    - `answers` gives `options.map((turn) => ({ turn }))`.
    - `check` refuses advancing on a first turn with "Your first turn must be an income turn." It refuses anything else that isn't offered with "Choose an income turn or an advance turn."
    - `resolve` throws `Error('Advance turns arrive with #14 and income turns with #15.')`.

The run loop is the one algorithm the tests don't fully pin down:

```js
// Run automatic operations until the top is a decision, or a group whose lanes all wait on decisions.
while (state.pending.length) {
	const top = state.pending[0];
	if (top.kind === 'group') {
		for (const lane of top.lanes) settle(state, random, lane.stack);
		if (top.lanes.some((lane) => lane.stack.length)) return;
		state.pending.shift();
		continue;
	}
	if (isDecision(top)) return;
	state.pending.shift();
	runAutomatic(contextFor(state, random, state.pending), top); // Error for an unknown kind
}
// settle(stack): the same for one lane, without groups. A group inside a lane is an Error.
```

`runEffects(ctx, op)` takes `op.effects[0]`. If more effects remain, it first pushes `{ player: op.player, kind: 'effects', effects: rest }`, so the rest waits under anything the handler pushes. Then it calls `EFFECTS[kind](ctx, op.player, value)`. An unknown kind throws `Error(`The ${kind} effect isn't built yet.`)`. In #13, effects run in list order; choosing the order of an unordered benefit is #14.

- [ ] **Step 1: Write the failing tests.** They use a hand-built fixture: `{ seats: [{ seat: 1, kind: 'player', vp: 0, incomeTurns: 0 }, { seat: 2, … }], pending: [], nextId: 1, seq: 0, events: [] }`.

```js
test('pushed operations get increasing ids and the first goes on top', () => {
	const state = fixture();
	push(state, state.pending, [turn(1), turn(2)]);
	assert.deepEqual(state.pending.map((op) => [op.id, op.batch, op.player]), [[1, 1, 1], [2, 1, 2]]);
});
test('only the top batch of decisions is open', () => {
	const state = fixture();
	push(state, state.pending, [turn(1), turn(2)]);
	push(state, state.pending, [turn(1)]);
	assert.deepEqual(openDecisions(state).map((op) => op.id), [3]);
	state.pending.shift();
	assert.deepEqual(openDecisions(state).map((op) => op.id), [1, 2]);
});
test('the run loop runs automatic operations until a decision', () => {
	const state = fixture();
	push(state, state.pending, [turn(1)]);
	push(state, state.pending, [{ player: 1, kind: 'effects', effects: [{ vp: 2 }, { vp: 3 }] }]);
	run(state, seededRandom(1));
	assert.equal(state.seats[0].vp, 5);
	assert.equal(state.pending[0].kind, 'chooseTurn');
	assert.deepEqual(state.events.map((e) => e.type), ['vpGained', 'vpGained']);
});
test('an effect that is not built yet is a bug, not a PlayerError', () => {
	// effects [{ explore: {} }] → run throws an Error that is not a PlayerError and mentions explore
});
test('VP counters arrive with #14', () => { /* [{ vp: { per: 'territory' } }] throws Error /#14/ */ });
test('a group opens every lane at once', () => {
	const state = fixture();
	pushGroup(state, [{ player: 1, ops: [turn(1)] }, { player: 2, ops: [turn(2)] }]);
	run(state, seededRandom(1));
	assert.deepEqual(openDecisions(state).map((op) => op.player), [1, 2]);
});
test('automatic operations in a lane run straight away, and an empty group comes off the stack', () => {
	const state = fixture();
	push(state, state.pending, [turn(1)]);
	pushGroup(state, [{ player: 1, ops: [{ player: 1, kind: 'effects', effects: [{ vp: 1 }] }] }, { player: 2, ops: [{ player: 2, kind: 'effects', effects: [{ vp: 4 }] }] }]);
	run(state, seededRandom(1));
	assert.deepEqual(state.seats.map((s) => s.vp), [1, 4]);
	assert.equal(state.pending[0].kind, 'chooseTurn');
});
test('locate finds a decision in a lane and says whether it is open', () => { /* open true at the lane top, false below */ });
test('resolveEffects returns a new state and leaves its input alone', () => { /* input deep-equal to its snapshot */ });
test('chooseTurn offers only income on a first turn (01 §4.1)', () => {
	assert.deepEqual(turnOptions({ incomeTurns: 0 }), ['income']);
	assert.deepEqual(turnOptions({ incomeTurns: 2 }), ['income', 'advance']);
	const decision = { id: 1, batch: 1, player: 1, kind: 'chooseTurn', options: ['income'] };
	assert.deepEqual(chooseTurn.answers(fixture(), decision), [{ turn: 'income' }]);
	assert.throws(() => chooseTurn.check(fixture(), decision, { turn: 'advance' }), { name: 'PlayerError', message: /first turn must be an income turn/ });
	assert.throws(() => chooseTurn.check(fixture(), decision, { turn: 'nap' }), { name: 'PlayerError' });
});
test('a legal turn choice is not built until #14 and #15', () => { /* resolve throws an Error, not a PlayerError, matching /#14/ */ });
```

Here `turn(p)` is `{ player: p, kind: 'chooseTurn', options: ['income'] }`.

- [ ] **Step 2:** Run `node --test tests/engine-stack.test.mjs`. Expected: FAIL, because the modules don't exist.
- [ ] **Step 3:** Implement the six modules as listed under **Interfaces**.
- [ ] **Step 4:** In CONVENTIONS.md, rewrite the **Pending decisions** bullet. The new text says that effects push operations onto `state.pending`, and that the run loop runs the automatic ones and stops at decisions. It says that a group holds one lane per player, so players decide at the same time. And it says that each decision kind is a module in `src/lib/engine/decisions/` with `answers`, `check`, `resolve` and `hidden`, registered in `kinds.js`; handlers get a `Context` and never import the stack.
- [ ] **Step 5:** Run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, clean.
- [ ] **Step 6:** Run `npm run format`, then commit with `Refs #13: add the operation stack and the run loop`.

### Task 3: Setup

**Files:**
- Create: `src/lib/engine/decks.js`, `src/lib/engine/setup.js`, `src/lib/engine/after-setup.js`, `src/lib/engine/decisions/choose-capital.js`, `src/lib/engine/decisions/choose-civ.js`, `tests/helpers/engine.mjs`
- Modify: `src/lib/engine/kinds.js`, which registers `chooseCapital`, `chooseCiv` and `setupSteps: runSetupSteps`
- Test: `tests/engine-setup.test.mjs`

**Interfaces:**
- Consumes:
  - Tasks 1–2;
  - `MAPS`, `CAPITAL_MATS`, `SMALL_MAP_PAIRS`, `LANDMARKS`, `ACHIEVEMENTS`, `TERRITORY_TILES`, `SPACE_TILES`, `VERSIONS`, `TRACK_IDS`, `RESOURCE_IDS` and `BUILDING_IDS` from `data/`;
  - `ASSETS` and `EXPANSIONS` from `../art/catalog.js`.
- Produces:
  - **`decks.js`:** `BASE_CIVS` (16 slugs), `BASE_TECH` (33 slugs) and `BASE_TAPESTRY` (50 cards: the 43 base slugs other than `trap`, then `'trap-1'` to `'trap-7'`). All three are frozen and read from the catalog's base entries.
  - **`setup.js`:** `createGame({ players, version, expansions = [], random }): State`. It validates, runs the setup steps in the order of spec §5, pushes the `setupSteps` operation, then the setup group on top of it, then runs the loop.
  - **`after-setup.js`:**
    - `AFTER_SETUP = ['reveal', 'civDeck', 'start']`, the order later issues insert their steps into;
    - `AFTER_SETUP_STEPS: Record<string, (ctx: Context) => void>`;
    - `runSetupSteps: AutomaticKind`, which follows `runEffects`'s continue-then-run pattern over `op.steps`.

    The steps are written here and tested in Task 4:
    - `reveal` moves each seat's `picks` into `civs: [civ]` and `capital.mat` (on the small map), then sets `picks = {}`. It puts the other mat of each small-map pair into `supply.capitals`, and emits `setupRevealed { picks: [{ seat, capital, civ }] }`.
    - `civDeck` shuffles `supply.civs` and emits `deckShuffled { deck: 'civs', count }`.
    - `start` sets `phase = 'play'` and `current = first`, emits `setupDone` and `turnStarted { player }`, and pushes `chooseTurn { player: first, options: turnOptions(seat) }`.
  - **`chooseCapital`:** the fields are `{ options: [a, b] }`; `hidden: []`. `answers` gives `options.map((capital) => ({ capital }))`. `check` refuses anything else with "Choose one of your two capital city mats." `resolve` sets `picks.capital` and emits `capitalChosen { player, secret: { capital } }`. The other mat stays out of `supply.capitals` until the reveal.
  - **`chooseCiv`:** the fields are `{ options: [a, b] }`; `hidden: ['options']`. `check` refuses anything else with "Choose one of the two civilizations you were dealt." `resolve` sets `picks.civ`, puts the other civilization into `supply.civs`, and emits `civChosen { player, secret: { civ } }`.
  - **`tests/helpers/engine.mjs`:** `newGame(count, { version = 'current', seed = 1 } = {})` returns `{ state, random }`. The players are named `'Ana'`, `'Bo'`, `'Cy'`, `'Dee'` and `'Eli'`.

`createGame` checks its options in this order and throws `PlayerError` for each problem:
1. `players` must be an array of 1–5: "A game needs 1 to 5 players."
2. `version` must be in `VERSIONS`: "Unknown rules version: {version}."
3. Every expansion code must be known: "Unknown expansion: {code}." A known one is not built yet: "{name} isn't available yet.", using the catalog name, such as "Plans & Ploys".

A `random` that isn't a function is a `TypeError`. The events, in order:
- `gameCreated { version, expansions, map, seats: [{ seat, name }] }`;
- then, per seat:
  - `capitalDealt`, carrying `{ player, capital }` on the large map or `{ player, options }` on the small map;
  - `outpostsPlaced { player, hex, count: 2 }`;
  - `civsDealt { player, secret: { civs } }`;
- `firstPlayerChosen { player }`.

- [ ] **Step 1: Write the failing tests**, looping over `[1, 2, 3, 4, 5]` and both versions where it says so:

```js
test('4–5 players use the large map and 1–3 the small map (01 §2.1)', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count);
		assert.equal(state.map, count >= 4 ? 'large' : 'small');
		assert.equal(Object.keys(state.hexes).length, count >= 4 ? 61 : 34);
		assert.equal(state.hexes['0_0'].tile, MAPS[state.map].printed['0_0'].tile);
	}
});
test('the decks start full and shuffled (01 §2.1)', () => {
	const { supply } = newGame(3).state;
	assert.equal(supply.tech.deck.length, 30);
	assert.equal(supply.tech.faceUp.length, 3);
	assert.deepEqual(new Set([...supply.tech.deck, ...supply.tech.faceUp]), new Set(BASE_TECH));
	assert.equal(supply.tapestry.deck.length, 50);
	assert.equal(supply.tapestry.deck.filter((card) => card.startsWith('trap-')).length, 7);
	// range(a, b) is a local helper: the whole numbers a to b
	assert.deepEqual([...supply.territory].sort((a, b) => a - b), range(1, 48));
	assert.deepEqual([...supply.space].sort((a, b) => a - b), range(1, 15));
	assert.equal(newGame(3).state.landmarks.length, 18);
	assert.deepEqual(newGame(3).state.achievements, { 'complete-track': [], 'topple-two': [], 'middle-island': [] });
});
test('every player starts empty, with tokens on every track start (01 §2.2)', () => {
	// for each seat: kind 'player', seat i + 1, name, vp 0, resources all 0,
	// tracks { exploration: [0], science: [0], technology: [0], military: [0] }, outposts 8,
	// incomeMat { buildings: { market: 5, house: 5, farm: 5, armory: 5 }, tapestry: [[], [], [], []] },
	// hand [], tech { bottom: [], middle: [], top: [] }, territoryTiles [], spaceTiles [], exploredSpace [],
	// civs [], picks {}, besideMat [], incomeTurns 0, finished false
});
test('on the large map each player is dealt a different mat and starts on its territory (01 §2.2–2.3)', () => {
	// count 4 and 5, seeds 1–10: the mats are distinct and in 1–6, supply.capitals holds the rest,
	// and hexes[CAPITAL_MATS[mat − 1].start.large].outposts deep-equals two { seat, toppled: false }
});
test('on the small map each player is dealt a different pair and starts on its territory', () => {
	// count 2 and 3: the chooseCapital options are distinct SMALL_MAP_PAIRS entries;
	// the outposts are on CAPITAL_MATS[options[0] − 1].start.small; supply.capitals holds the undealt pairs' mats
});
test('R40: a solo player starts on 2/4 whichever pair they are dealt', () => {
	for (let seed = 1; seed <= 20; seed++) {
		const { state } = newGame(1, { seed });
		assert.equal(state.hexes['0_2'].outposts.length, 2);
	}
});
test('each player is dealt 2 different civilizations (01 §2.2 step 3)', () => {
	// every chooseCiv has 2 options; all 2n are distinct and in BASE_CIVS; supply.civs.length === 16 − 2n
});
test('the setup picks are one group with a lane per player, above the after-setup steps', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count);
		assert.equal(state.pending[0].kind, 'group');
		assert.deepEqual(state.pending[0].lanes.map((lane) => lane.stack.map((op) => op.kind)),
			Array(count).fill(count >= 4 ? ['chooseCiv'] : ['chooseCapital', 'chooseCiv']));
		assert.equal(openDecisions(state).length, count >= 4 ? count : 2 * count);
		assert.deepEqual(state.pending[1].steps, ['reveal', 'civDeck', 'start']);
		assert.equal(state.phase, 'setup');
		assert.equal(state.current, null);
		assert.ok(state.first >= 1 && state.first <= count);
	}
});
test('both versions set up the same way from the same seed', () => {
	// newGame(n, { version: 'original', seed }) vs 'current': deep-equal once version and the gameCreated event's version are set equal
});
test('the setup events come in order and number from 1', () => {
	// types: gameCreated, then per seat capitalDealt, outpostsPlaced, civsDealt, then firstPlayerChosen;
	// civsDealt carries secret.civs equal to that seat's chooseCiv options
});
test('createGame refuses a bad player count, an unknown version and any expansion', () => {
	const base = { players: [{ name: 'Ana' }], version: 'current', random: seededRandom(1) };
	for (const players of [undefined, 'Ana', [], Array(6).fill({ name: 'X' })]) {
		assert.throws(() => createGame({ ...base, players }), { name: 'PlayerError', message: /1 to 5 players/ });
	}
	assert.throws(() => createGame({ ...base, version: '2024' }), { name: 'PlayerError' });
	assert.throws(() => createGame({ ...base, expansions: ['pp'] }), { name: 'PlayerError', message: /Plans & Ploys isn't available yet/ });
	assert.throws(() => createGame({ ...base, expansions: ['xx'] }), { name: 'PlayerError', message: /Unknown expansion/ });
	assert.throws(() => createGame({ ...base, random: undefined }), TypeError);
});
test('the setup decisions list answers that pass their own check', () => {
	// for every open decision of newGame(2) and newGame(4): every DECISIONS[kind].answers(state, d) entry passes check
	// chooseCiv refuses a civilization that wasn't dealt; chooseCapital refuses a mat outside the pair
});
```

- [ ] **Step 2:** Run `node --test tests/engine-setup.test.mjs`. Expected: FAIL, because the modules don't exist.
- [ ] **Step 3:** Implement `decks.js`, the two decision kinds, `after-setup.js` and `setup.js`, then register them in `kinds.js`.
- [ ] **Step 4:** Run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, clean.
- [ ] **Step 5:** Run `npm run format`, then commit with `Refs #13: set up a new game with simultaneous picks`.

### Task 4: Answering decisions with `play()`

**Files:**
- Create: `src/lib/engine/play.js`, `src/lib/engine/game.js`
- Modify: `tests/helpers/engine.mjs`, adding `answerSetup` and `startedGame`
- Test: `tests/engine-play.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
  - **`play(state, seat, action, random): State`:**
    1. A finished game refuses everything: "This game is finished."
    2. `action` must be an object whose `decision` is an integer: "Choose one of the open choices."
    3. The decision must exist ("That choice is no longer open."), be open ("That choice isn't open yet.") and belong to `seat` ("That choice belongs to another player.").
    4. Then: `structuredClone`; locate the decision in the clone; `kind.check(clone, decision, answer)`, where `answer` is the action without `decision`; remove the decision from its stack; `kind.resolve(contextFor(clone, random, thatStack), decision, answer)`; `run(clone, random)`; return the clone.
  - **`game.js`** re-exports `createGame`, `play` and `PlayerError`. Task 6 adds `view`.
  - **`tests/helpers/engine.mjs`:**
    - `answerSetup(state, random)` keeps playing `answers()[0]` for the first open decision while the phase is `'setup'`, and returns the state;
    - `startedGame(count, options)` returns `{ state, random }` after `answerSetup`.

- [ ] **Step 1: Write the failing tests**

```js
test('players may answer their setup picks in any order', () => {
	const { state: start, random } = newGame(3, { seed: 5 });
	let state = start;
	for (const seat of [3, 1, 2]) {
		const mine = openDecisions(state).filter((d) => d.player === seat).reverse(); // civ first, then capital
		for (const decision of mine) {
			state = play(state, seat, { decision: decision.id, ...DECISIONS[decision.kind].answers(state, decision)[0] }, random);
		}
	}
	assert.equal(state.phase, 'play');
});
test('every pick stays hidden until the last one, then setupRevealed shows them all', () => {
	// after all but one pick: the answered seats have picks set, civs [] and (small map) capital.mat null;
	// after the last: civs [kept], capital.mat set, picks {}, and setupRevealed.picks lists every seat
});
test('the other mat of each pair goes face up only at the reveal', () => {
	// newGame(2): supply.capitals is unchanged by every capitalChosen; after the reveal it holds the two discarded mats as well
});
test('after setup the unkept civilizations form the civilization deck (01 §2.2 step 3)', () => {
	// startedGame(n): supply.civs.length === 16 − n, no kept civ in it; a deckShuffled event with deck 'civs'
});
test('the first player starts by choosing a turn, and only income is legal (01 §4.1)', () => {
	const { state } = startedGame(4);
	assert.equal(state.current, state.first);
	assert.deepEqual(openDecisions(state).map((d) => [d.kind, d.player, d.options]), [['chooseTurn', state.first, ['income']]]);
	assert.deepEqual(state.events.slice(-2).map((e) => e.type), ['setupDone', 'turnStarted']);
});
test('advancing on a first turn is refused', () => {
	// play(state, first, { decision: id, turn: 'advance' }) throws PlayerError /first turn must be an income turn/
});
test('a legal turn choice is not built until #15', () => {
	// play(..., { turn: 'income' }) throws an Error that is not a PlayerError
});
test('answering another player's choice is refused', () => { /* PlayerError /another player/ */ });
test('an unknown, answered or not-yet-open choice is refused', () => {
	// id 999 → /no longer open/; an id answered a moment ago → /no longer open/;
	// a decision below the top batch → /isn't open yet/ (push a chooseTurn under a new batch on a clone)
});
test('a malformed action or a seat not in the game is refused', () => {
	// state and random from newGame(2); validAction answers seat 1's first open decision with answers()[0]
	for (const action of [null, {}, { decision: '7' }, { decision: 1.5 }, 'civ']) {
		assert.throws(() => play(state, 1, action, random), { name: 'PlayerError' });
	}
	assert.throws(() => play(state, 9, validAction, random), { name: 'PlayerError' });
});
test('an option that was not offered is refused', () => {
	// chooseCiv with a civ not dealt, chooseCapital with 4 when the pair is {1, 6}: PlayerError
});
test('play never changes the state it was given, even when it throws', () => {
	const { state, random } = newGame(2);
	const before = structuredClone(state);
	const decision = openDecisions(state)[0];
	play(state, decision.player, { decision: decision.id, ...DECISIONS[decision.kind].answers(state, decision)[0] }, random);
	assert.throws(() => play(state, decision.player, { decision: decision.id, civ: 'nobody' }, random));
	assert.deepEqual(state, before);
});
test('a finished game refuses every action', () => { /* clone with phase 'over' → PlayerError /finished/ */ });
```

- [ ] **Step 2:** Run `node --test tests/engine-play.test.mjs`. Expected: FAIL, because `play` doesn't exist.
- [ ] **Step 3:** Implement `play.js` and `game.js`, then extend the helper.
- [ ] **Step 4:** Run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, clean.
- [ ] **Step 5:** Run `npm run format`, then commit with `Refs #13: answer decisions with play()`.

### Task 5: Gaining resources, tiles and cards

**Files:**
- Create: `src/lib/engine/effects/gain.js`, `src/lib/engine/decisions/choose-resource.js`
- Modify: `src/lib/engine/effects/index.js`, adding `gain`; `src/lib/engine/kinds.js`, adding `chooseResource`
- Test: `tests/engine-effects.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–4. It uses `startedGame` and `resolveEffects`.
- Produces:
  - **`gainResources(ctx, player, resources)`** adds each resource up to 8. Anything above 8 is lost. It emits `resourcesGained { player, gained, lost }`, listing in each only the resources with a non-zero amount.
  - **`gain(ctx, player, value: Gain)`** works in spec §8's order:
    1. the named resources, through `gainResources`;
    2. `territory`: up to n tiles from the top of `supply.territory`, emitting `tilesGained { player, stack: 'territory', tiles }`;
    3. `space`: the same with `supply.space`;
    4. `tapestry`: n draws. An empty deck first takes the shuffled discards, emitting `deckShuffled { deck: 'tapestry', count }`. With nothing left, the draws stop. It emits `cardsDrawn { player, count, secret: { cards } }`;
    5. `any`: pushes `{ player, kind: 'chooseResource', count: n, from: 'any' }`.

    An unknown key throws `Error`.
  - **`chooseResource`:**
    - The fields are `{ count, from: 'any' | ResourceId[] }`; `hidden: []`.
    - The answer is `{ resources: { coin: 1, food: 1 } }`.
    - `check` wants whole numbers above 0, only from `from`, adding up to `count`. Its messages are "Choose exactly 2 resources." and "You can't choose worker here."
    - `answers` lists every combination. Those that lose the fewest resources to the cap come first; ties follow `RESOURCE_IDS` order.
    - `resolve` calls `gainResources`.

- [ ] **Step 1: Write the failing tests**

```js
test('resources stop at 8 and the event reports the loss (01 §1.2)', () => {
	const { state: start, random } = startedGame(2);
	const state = structuredClone(start);
	state.seats[0].resources.coin = 7;
	const after = resolveEffects(state, 1, [{ gain: { coin: 3, food: 1 } }], random);
	assert.equal(after.seats[0].resources.coin, 8);
	assert.deepEqual(after.events.at(-1), { seq: after.seq, type: 'resourcesGained', player: 1, gained: { coin: 1, food: 1 }, lost: { coin: 2 } });
});
test('any resources become a choice, after the named ones are gained', () => {
	const { state, random } = startedGame(2);
	const after = resolveEffects(state, 2, [{ gain: { food: 1, any: 2 } }], random);
	assert.equal(after.seats[1].resources.food, 1);
	assert.deepEqual(openDecisions(after).map((d) => [d.kind, d.player, d.count, d.from]), [['chooseResource', 2, 2, 'any']]);
});
test('answering chooseResource gains those resources, then the turn choice is open again', () => {
	// play(after, 2, { decision, resources: { coin: 1, culture: 1 } }) → coin 1, culture 1; the top decision is chooseTurn again
});
test('a resource answer that does not add up is refused', () => {
	// after, id and random: the chooseResource for count 2 from the previous test's setup
	for (const resources of [{ coin: 1 }, { coin: 3 }, { gold: 2 }, { coin: -1, food: 3 }, { coin: 1.5, food: 0.5 }, undefined]) {
		assert.throws(() => play(after, 2, { decision: id, resources }, random), { name: 'PlayerError' });
	}
});
test('chooseResource lists every combination, the ones losing least to the cap first', () => {
	// count 2 from 'any': 10 answers, each passing check; with coin at 8, answers[0] has no coin
});
test('territory tiles come face up from the top of the stack', () => {
	// the first two of supply.territory move into the seat's territoryTiles; tilesGained lists them, with no secret
});
test('an empty territory stack gives nothing (01 §7.2)', () => { /* supply.territory = [] → no tiles, no error */ });
test('space tiles come from the space stack', () => { /* gain { space: 3 } */ });
test('a tapestry draw reshuffles the discards when the deck is empty (01 §9.1)', () => {
	// deck [], discard ['academia', 'trap-1'] → gain { tapestry: 1 }: one of them in hand, deck length 1, discard [];
	// deckShuffled { deck: 'tapestry', count: 2 } comes before cardsDrawn, which keeps the card in secret.cards
});
test('with no deck and no discards nothing is drawn', () => { /* hand unchanged, no error */ });
test('a choice in one lane keeps the other lanes open', () => {
	const { state: start, random } = startedGame(3);
	const state = structuredClone(start);
	pushGroup(state, [1, 2, 3].map((player) => ({ player, ops: [{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] }] })));
	run(state, random);
	assert.equal(openDecisions(state).length, 3);
	const mine = openDecisions(state).find((d) => d.player === 1);
	const next = play(state, 1, { decision: mine.id, resources: { food: 1 } }, random);
	assert.deepEqual(openDecisions(next).map((d) => d.player), [2, 3]);
	// after 2 and 3 answer: the group is gone and chooseTurn is open again
});
```

- [ ] **Step 2:** Run `node --test tests/engine-effects.test.mjs`. Expected: FAIL, with "The gain effect isn't built yet."
- [ ] **Step 3:** Implement `gain.js` and `choose-resource.js`, then register them.
- [ ] **Step 4:** Run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, clean.
- [ ] **Step 5:** Run `npm run format`, then commit with `Refs #13: gain resources, tiles and cards, capped at 8`.

### Task 6: `view()`, the randomized privacy check, and closing #13

**Files:**
- Create: `src/lib/engine/view.js`
- Modify: `src/lib/engine/game.js`, exporting `view`; `CLAUDE.md` (Architecture: the engine modules; "Where the work stands": #13 done, next #14)
- Test: `tests/engine-view.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces `view(state, seat): View`. A `seat` that isn't a seat of the game (`null`, 0, 9, a string) gets the public view. `View` is a JSDoc typedef for the state with these changes:
  - `supply.tech.deck`, `supply.tapestry.deck`, `supply.territory`, `supply.space` and `supply.civs` become counts. `tech.faceUp`, `tech.discard`, `tapestry.discard` and `capitals` stay as they are.
  - Every player seat gets `handCount`. Only the viewer's own seat keeps `hand` and `picks`.
  - Every decision, on the main stack and in lanes, loses its kind's `hidden` fields unless it is the viewer's own. Each of the viewer's own **open** decisions gets `answers: DECISIONS[kind].answers(state, decision)`.
  - Every event loses `secret` unless `event.player` is the viewer.

- [ ] **Step 1: Write the failing tests**

```js
test('view never shows another player their opponents' hands, dealt civilizations or unrevealed picks', () => {
	for (let seed = 1; seed <= 40; seed++) {
		for (const count of [1, 2, 3, 4, 5]) {
			try {
				checkGame(seed, count); // see below
			} catch (error) {
				error.message = `seed ${seed}, ${count} players: ${error.message}`;
				throw error;
			}
		}
	}
});
// checkGame(seed, count): newGame, then play random open decisions with random answers (seededRandom(seed)) until
// the phase is 'play'. Then resolveEffects with { gain: { tapestry: 2 } } for every seat. After every step, for each
// viewer in [null, 1..count]:
// - JSON.stringify(view) contains no other seat's hand card ids, and no other seat's dealt civilization
//   unless it was revealed as that seat's kept civilization;
// - before the reveal, no other seat has picks, and supply.capitals equals its value right after createGame;
// - each supply deck is a number;
// - an op whose player isn't the viewer has no answers, and a chooseCiv of another player has no options;
// - every event with player ≠ viewer has no secret.
test('a player sees their own hand, dealt civilizations and the answers to their open choices', () => {
	// newGame(2): view(state, 1) keeps seat 1's chooseCiv options, and its open decisions carry answers equal to answers()
});
test('a seat that is not in the game gets the public view', () => {
	const { state } = startedGame(3);
	for (const seat of [0, 9, '1', undefined]) {
		assert.deepEqual(view(state, seat), view(state, null));
	}
});
test('the state survives a JSON round trip unchanged', () => {
	// after newGame, partway through setup, after startedGame, and after resolveEffects with a gain { any: 1 }:
	// assert.deepEqual(JSON.parse(JSON.stringify(state)), state)
});
test('the same seed and the same answers give the same game', () => {
	// two runs of checkGame's play-through with the same seed give deep-equal states
});
test('seq goes up by exactly 1 per event across a whole setup', () => {
	// startedGame(5): every consecutive pair of events differs by 1 in seq, and the last seq is state.seq
});
test('view does not change the state', () => { /* snapshot before view, deep-equal after */ });
```

- [ ] **Step 2:** Run `node --test tests/engine-view.test.mjs`. Expected: FAIL, because `view` doesn't exist.
- [ ] **Step 3:** Implement `view.js` and export it from `game.js`.
- [ ] **Step 4:** Run `npm test` (it builds first) and `npm run check`. Expected: every test passes, 0 errors, 0 warnings.
- [ ] **Step 5:** Update CLAUDE.md:
  - **Architecture:** add the engine modules (`game.js` is the entry point; the operation stack, decision kinds, effect handlers and setup steps) and the spec link.
  - **"Where the work stands":** #13 is done (2026-10-24), and Next is #14.
- [ ] **Step 6:** Check off the three items in #13's checklist with `gh issue edit 13`. Run `npm run format`, then commit with `Fix #13: hide private state in view() and check it with random games`. Push only when the owner asks.
