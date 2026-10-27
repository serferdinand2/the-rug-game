// Tests for the civilization framework: the registry, setup and adjustments, step 1, gaining, passive hooks and losses (#20, design §4–§6, §11).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, contextFor, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { triggered } from '../src/lib/engine/abilities.js';
import { AFTER_SETUP } from '../src/lib/engine/after-setup.js';
import { INCOME_STEPS, INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { CIVS, civsOf, offer } from '../src/lib/engine/civs/index.js';
import { askSlot } from '../src/lib/engine/decisions/choose-slot.js';
import { BASE_CIVS } from '../src/lib/engine/decks.js';
import { newGame, startedGame, readyTurn, answer } from './helpers/engine.mjs';

/** The civilizations startedGame() deals by default, in seat order. */
const INERT = ['leaders', 'nomads', 'inventors', 'historians', 'craftsmen'];

const EVERY_TURN = [2, 3, 4, 5];

/**
 * Registers a test civilization until the test ends.
 * @param {import('vitest').TestContext} t
 * @param {string} id
 * @param {Record<string, any>} [rules]
 */
function testCiv(t, id, rules = {}) {
	const saved = CIVS[id];
	CIVS[id] = { id, ...rules };
	t.onTestFinished(() => {
		if (saved) {
			CIVS[id] = saved;
		} else {
			delete CIVS[id];
		}
	});
}

/**
 * A copy of a started game, to change before anything runs.
 * @param {number} count
 */
function game(count) {
	const { state: started, random } = startedGame(count);
	return { state: structuredClone(started), random };
}

/**
 * The events of one type after a sequence number, without their numbers.
 * @param {any} state
 * @param {string} type
 * @param {number} [since]
 */
const eventsOf = (state, type, since = 0) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === type && e.seq > since)
		.map(({ seq: _seq, ...e }) => e);

/**
 * The current player of a 2-player game takes an income turn after income turn `before`.
 * The opponent has started that era already, so no first-of-neighbours bonus asks.
 * @param {number} before - Income turns already taken
 * @param {(seat: any, state: any) => void} fill
 * @param {{ version?: 'original' | 'current' }} [options]
 */
function incomeTurn(before, fill, options) {
	const ready = readyTurn(
		2,
		(seat, state) => {
			seat.incomeTurns = before;
			for (const other of state.seats) {
				if (other !== seat) {
					other.incomeTurns = Math.min(before + 1, 4);
				}
			}
			fill(seat, state);
		},
		options
	);
	const since = ready.state.seq;
	const state = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'income',
		}
	);
	return { state, random: ready.random, player: ready.player, since };
}

test("civAbilities runs a civilization's income ability in step 1 of income turns 2 to 5", (t) => {
	/** @type {number[]} */
	const turns = [];
	testCiv(t, 'test', {
		incomeTurns: EVERY_TURN,
		income(
			/** @type {any} */ ctx,
			/** @type {number} */ player,
			/** @type {number} */ turn
		) {
			turns.push(turn);
			ctx.push([{ player, kind: 'effects', effects: [{ vp: 10 }] }]);
		},
	});
	for (const before of [0, 1, 2, 3, 4]) {
		const r = incomeTurn(before, (seat) => {
			seat.civs = ['test'];
		});
		const used = eventsOf(r.state, 'civAbilityUsed', r.since);
		if (before === 0) {
			assert.deepEqual(used, [], 'not on income turn 1');
			continue;
		}
		assert.deepEqual(used, [
			{ type: 'civAbilityUsed', player: r.player, civ: 'test' },
		]);
		const types = r.state.events
			.filter((/** @type {any} */ e) => e.seq > r.since)
			.map((/** @type {any} */ e) => e.type);
		// Step 1 comes before the era's tapestry card (step 2), played face down from an empty hand.
		if (before < 4) {
			assert.ok(
				types.indexOf('civAbilityUsed') <
					types.indexOf('tapestryPlayed')
			);
		}
		assert.ok(
			eventsOf(r.state, 'vpGained', r.since).some(
				(/** @type {any} */ e) => e.player === r.player && e.vp === 10
			)
		);
	}
	assert.deepEqual(turns, [2, 3, 4, 5]);
});

test('with two civilizations the player chooses which ability comes next', (t) => {
	for (const id of ['test', 'test2']) {
		testCiv(t, id, {
			incomeTurns: EVERY_TURN,
			income() {},
		});
	}
	testCiv(t, 'test5', {
		incomeTurns: [5],
		income() {
			throw new Error('Only on income turn 5.');
		},
	});
	const r = incomeTurn(1, (seat) => {
		seat.civs = ['test', 'test5', 'test2'];
	});
	const [open] = openDecisions(r.state);
	assert.deepEqual(
		[open.kind, open.player, open.options],
		['chooseCivAbility', r.player, ['test', 'test2']]
	);
	assert.deepEqual(DECISIONS.chooseCivAbility.answers(r.state, open), [
		{ civ: 'test' },
		{ civ: 'test2' },
	]);
	assert.throws(
		() =>
			answer(r.state, r.random, r.player, 'chooseCivAbility', {
				civ: 'test5',
			}),
		{
			name: 'PlayerError',
			message: 'Choose which civilization to use next.',
		}
	);
	const next = answer(r.state, r.random, r.player, 'chooseCivAbility', {
		civ: 'test2',
	});
	// The other one follows without a question, and each runs once.
	assert.deepEqual(
		eventsOf(next, 'civAbilityUsed', r.since).map(
			(/** @type {any} */ e) => e.civ
		),
		['test2', 'test']
	);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseCivAbility'));
});

test('a civilization gained during step 1 still fires that turn', (t) => {
	testCiv(t, 'test', {
		incomeTurns: EVERY_TURN,
		income(/** @type {any} */ ctx, /** @type {number} */ player) {
			ctx.push([{ player, kind: 'effects', effects: [{ gainCiv: {} }] }]);
		},
	});
	testCiv(t, 'test2', { incomeTurns: EVERY_TURN, income() {} });
	const r = incomeTurn(1, (seat, state) => {
		seat.civs = ['test'];
		state.supply.civs.unshift('test2');
	});
	const steps = r.state.events
		.filter(
			(/** @type {any} */ e) =>
				e.seq > r.since &&
				(e.type === 'civAbilityUsed' || e.type === 'civGained')
		)
		.map((/** @type {any} */ e) => [e.type, e.civ]);
	assert.deepEqual(steps, [
		['civAbilityUsed', 'test'],
		['civGained', 'test2'],
		['civAbilityUsed', 'test2'],
	]);
	assert.deepEqual(r.state.seats[r.player - 1].civs, ['test', 'test2']);
});

test('gainCiv appends a civilization from the deck and runs its mid-game setup', (t) => {
	/** @type {[number, boolean][]} */
	const setups = [];
	testCiv(t, 'test', {
		setup(
			/** @type {any} */ ctx,
			/** @type {number} */ player,
			/** @type {boolean} */ midGame
		) {
			setups.push([player, midGame]);
			ctx.push([{ player, kind: 'effects', effects: [{ vp: 4 }] }]);
		},
	});
	const { state: started, random } = startedGame(2, {
		civs: ['leaders', 'nomads'],
	});
	const state = structuredClone(started);
	state.supply.civs.unshift('test');
	const deck = state.supply.civs.length;
	const next = resolveEffects(state, 2, [{ gainCiv: {} }], random);
	assert.deepEqual(next.seats[1].civs, ['nomads', 'test']);
	assert.deepEqual(eventsOf(next, 'civGained'), [
		{ type: 'civGained', player: 2, civ: 'test' },
	]);
	assert.deepEqual(setups, [[2, true]]);
	assert.equal(next.seats[1].vp, 4);
	assert.equal(next.supply.civs.length, deck - 1);
	assert.ok(!next.supply.civs.includes('test'));
	assert.deepEqual(
		civsOf(next, 2).map((civ) => civ.id),
		['nomads', 'test']
	);
});

test('gainCiv rebuilds an empty deck from the discards, and gains nothing with neither', (t) => {
	testCiv(t, 'test');
	testCiv(t, 'test2');
	const { state: started, random } = game(2);
	started.supply.civs = [];
	started.supply.civDiscard = ['test', 'test2'];
	let state = resolveEffects(started, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(state.seats[0].civs, ['test']);
	assert.deepEqual(
		eventsOf(state, 'deckShuffled').filter(
			(/** @type {any} */ e) => e.deck === 'civs'
		),
		[
			// The setup shuffle, then the rebuilt deck.
			eventsOf(started, 'deckShuffled').find(
				(/** @type {any} */ e) => e.deck === 'civs'
			),
			{ type: 'deckShuffled', deck: 'civs', count: 1 },
		]
	);
	// The civilization discarded last stays in the discards, so nothing else is left to draw.
	assert.deepEqual(state.supply.civDiscard, ['test2']);
	assert.deepEqual(state.supply.civs, []);
	const since = state.seq;
	state = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(state.seats[0].civs, ['test']);
	assert.deepEqual(eventsOf(state, 'noCivLeft', since), [
		{ type: 'noCivLeft', player: 1 },
	]);
	state.supply.civDiscard = [];
	state = resolveEffects(state, 2, [{ gainCiv: {} }], random);
	assert.deepEqual(state.seats[1].civs, []);
	assert.deepEqual(eventsOf(state, 'noCivLeft', since), [
		{ type: 'noCivLeft', player: 1 },
		{ type: 'noCivLeft', player: 2 },
	]);
	assert.ok(!eventsOf(state, 'civGained', since).length);
});

test('gainCiv never draws the civilization it just discarded (Mystics)', (t) => {
	// Like the Mystics gained mid-game: discard itself and gain another.
	testCiv(t, 'test', {
		setup(
			/** @type {any} */ ctx,
			/** @type {number} */ player,
			/** @type {boolean} */ midGame
		) {
			if (!midGame) {
				return;
			}
			const seat = ctx.state.seats[player - 1];
			seat.civs = seat.civs.filter(
				(/** @type {string} */ c) => c !== 'test'
			);
			ctx.state.supply.civDiscard.push('test');
			ctx.push([{ player, kind: 'effects', effects: [{ gainCiv: {} }] }]);
		},
	});
	testCiv(t, 'test2');
	const { state: started, random } = game(2);
	started.supply.civs = ['test', 'test2'];
	const another = resolveEffects(started, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(another.seats[0].civs, ['test2']);
	assert.deepEqual(another.supply.civDiscard, ['test']);

	started.supply.civs = ['test'];
	const none = resolveEffects(started, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(none.seats[0].civs, []);
	assert.deepEqual(none.supply.civDiscard, ['test']);
	assert.deepEqual(none.supply.civs, []);
	assert.deepEqual(eventsOf(none, 'noCivLeft'), [
		{ type: 'noCivLeft', player: 1 },
	]);
});

test("a civilization's hook operations are passive, and a finished player keeps only their VP", (t) => {
	const benefit = [{ vp: 2 }, { gain: { coin: 1 } }];
	testCiv(t, 'test', {
		hooks: {
			invented: (
				/** @type {any} */ state,
				/** @type {number} */ owner,
				/** @type {any} */ payload
			) =>
				owner === payload.player ? [] : [offer(state, owner, benefit)],
		},
	});
	const { state, random } = game(2);
	state.seats[1].civs = ['test'];
	// The era ability's operations stay as they are; the civilization's are marked passive.
	state.seats[0].era = { card: null, ability: 'academia' };
	assert.deepEqual(triggered(state, 'invented', { player: 1, card: 'x' }), [
		{ player: 1, kind: 'effects', effects: [{ vp: 3 }] },
		{
			player: 2,
			kind: 'chooseOption',
			options: [[], benefit],
			purpose: 'civOffer',
			passive: true,
		},
	]);
	state.seats[0].era = null;

	// Still playing: the optional gain is offered, decline first.
	const inventing = resolveEffects(state, 1, [{ invent: {} }], random);
	const card = inventing.supply.tech.faceUp[0];
	const offered = answer(inventing, random, 1, 'chooseInvent', { card });
	const [open] = openDecisions(offered);
	assert.deepEqual([open.kind, open.player], ['chooseOption', 2]);
	assert.deepEqual(DECISIONS.chooseOption.answers(offered, open)[0], {
		option: 0,
	});
	const taken = answer(offered, random, 2, 'chooseOption', { option: 1 });
	assert.equal(taken.seats[1].vp, 2);
	assert.equal(taken.seats[1].resources.coin, 1);

	// Finished: a plain passive operation, which runs only its VP.
	state.seats[1].finished = true;
	assert.deepEqual(triggered(state, 'invented', { player: 1, card: 'x' }), [
		{ player: 2, kind: 'effects', effects: benefit, passive: true },
	]);
	const late = resolveEffects(state, 1, [{ invent: {} }], random);
	const done = answer(late, random, 1, 'chooseInvent', {
		card: late.supply.tech.faceUp[0],
	});
	assert.equal(done.seats[1].vp, 2);
	assert.equal(done.seats[1].resources.coin, 0);
	assert.ok(!openDecisions(done).some((d) => d.kind === 'chooseOption'));

	// With no VP in it, a finished player's passive operation does nothing at all.
	const since = state.seq;
	push(state, state.pending, [
		{
			player: 2,
			kind: 'effects',
			effects: [{ gain: { coin: 1 } }],
			passive: true,
		},
	]);
	run(state, random);
	assert.equal(state.seats[1].resources.coin, 0);
	assert.deepEqual(eventsOf(state, 'resourcesGained', since), []);
});

test("civSetup runs each civilization's setup in a group after the reveal, then the current version's adjustment for the setup civilization only (R34)", (t) => {
	assert.deepEqual(AFTER_SETUP, ['reveal', 'civDeck', 'civSetup', 'start']);

	/** @type {any[]} */
	const calls = [];
	// The real setup: after the reveal, before play starts.
	testCiv(t, 'leaders', {
		setup(
			/** @type {any} */ ctx,
			/** @type {number} */ player,
			/** @type {boolean} */ midGame
		) {
			const types = ctx.state.events.map(
				(/** @type {any} */ e) => e.type
			);
			calls.push([
				'setup',
				player,
				midGame,
				ctx.state.phase,
				types.includes('setupRevealed'),
			]);
		},
		adjustment: {
			setup: (/** @type {any} */ _ctx, /** @type {number} */ player) =>
				calls.push(['adjust', player]),
		},
	});
	startedGame(2, { civs: ['leaders', 'nomads'] });
	assert.deepEqual(calls, [
		['setup', 1, false, 'setup', true],
		['adjust', 1],
	]);

	// Two held civilizations: each one's setup in its player's lane, the lanes open at once.
	testCiv(t, 'test', {
		setup(
			/** @type {any} */ ctx,
			/** @type {number} */ player,
			/** @type {boolean} */ midGame
		) {
			calls.push(['setup', 'test', player, midGame]);
			askSlot(ctx, player, {
				options: ['a', 'b'],
				optional: false,
				purpose: 'test',
				then: { kind: 'effects', effects: [{ vp: 1 }] },
			});
		},
		adjustment: {
			setup: (/** @type {any} */ _ctx, /** @type {number} */ player) =>
				calls.push(['adjust', 'test', player]),
		},
	});
	testCiv(t, 'test2', {
		setup: (
			/** @type {any} */ _ctx,
			/** @type {number} */ player,
			/** @type {boolean} */ midGame
		) => calls.push(['setup', 'test2', player, midGame]),
		adjustment: {
			setup() {
				throw new Error(
					'Only the setup civilization is adjusted (R34).'
				);
			},
		},
	});
	const { state, random } = game(2);
	calls.length = 0;
	state.pending.length = 0;
	state.seats[0].civs = ['test', 'test2'];
	state.seats[1].civs = ['test'];
	push(state, state.pending, [
		{ player: null, kind: 'setupSteps', steps: ['civSetup'] },
	]);
	run(state, random);
	assert.equal(state.pending[0].kind, 'group');
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.purpose]),
		[
			['chooseSlot', 1, 'test'],
			['chooseSlot', 2, 'test'],
		]
	);
	let next = answer(state, random, 2, 'chooseSlot', { slot: 'b' });
	assert.equal(next.seats[1].vp, 1);
	next = answer(next, random, 1, 'chooseSlot', { slot: 'a' });
	assert.deepEqual(calls, [
		['setup', 'test', 1, false],
		['setup', 'test', 2, false],
		['adjust', 'test', 2],
		['setup', 'test2', 1, false],
		['adjust', 'test', 1],
	]);
	assert.deepEqual(next.pending, []);
});

test('the original version applies no adjustment (R34)', (t) => {
	/** @type {any[]} */
	const calls = [];
	testCiv(t, 'leaders', {
		setup: (
			/** @type {any} */ _ctx,
			/** @type {number} */ player,
			/** @type {boolean} */ midGame
		) => calls.push(['setup', player, midGame]),
		firstTurnEnd: (/** @type {any} */ _ctx, /** @type {number} */ player) =>
			calls.push(['firstTurnEnd', player]),
		adjustment: {
			setup: () => calls.push(['adjust setup']),
			firstTurnEnd: () => calls.push(['adjust firstTurnEnd']),
		},
	});
	let { state, random } = startedGame(2, {
		version: 'original',
		civs: ['leaders', 'nomads'],
	});
	assert.deepEqual(calls, [['setup', 1, false]]);
	// Both players take income turn 1.
	for (const _ of [1, 2]) {
		const player = /** @type {number} */ (state.current);
		state = answer(state, random, player, 'chooseTurn', { turn: 'income' });
	}
	assert.deepEqual(
		state.seats.map((s) => s.incomeTurns),
		[1, 1]
	);
	assert.deepEqual(calls, [
		['setup', 1, false],
		['firstTurnEnd', 1],
	]);
});

test('civFirstTurnEnd runs at the end of income turn 1', (t) => {
	assert.deepEqual(INCOME_STEPS.slice(-3), [
		'income',
		'civFirstTurnEnd',
		'finish',
	]);
	assert.deepEqual(INCOME_STEP_KINDS.civFirstTurnEnd.turns, [1]);
	/** @type {any[]} */
	const calls = [];
	testCiv(t, 'test', {
		firstTurnEnd: (/** @type {any} */ ctx, /** @type {number} */ player) =>
			calls.push([
				'test',
				player,
				{ ...ctx.state.seats[player - 1].resources },
			]),
		adjustment: {
			firstTurnEnd: (
				/** @type {any} */ _ctx,
				/** @type {number} */ player
			) => calls.push(['adjust', player]),
		},
	});
	testCiv(t, 'test2', {
		firstTurnEnd: (/** @type {any} */ _ctx, /** @type {number} */ player) =>
			calls.push(['test2', player]),
		adjustment: {
			firstTurnEnd() {
				throw new Error(
					'Only the setup civilization is adjusted (R34).'
				);
			},
		},
	});
	const r = incomeTurn(0, (seat) => {
		seat.civs = ['test', 'test2'];
	});
	// After the income: each held civilization in turn, then the setup civilization's adjustment.
	assert.deepEqual(calls, [
		['test', r.player, { coin: 1, worker: 1, food: 1, culture: 1 }],
		['test2', r.player],
		['adjust', r.player],
	]);
	calls.length = 0;
	incomeTurn(1, (seat) => {
		seat.civs = ['test', 'test2'];
	});
	assert.deepEqual(calls, [], 'not on income turn 2');
});

test("lose takes culture first, then asks for the rest, and takes nothing it can't", () => {
	const { state, random } = game(2);
	const lost = (/** @type {any} */ s) =>
		eventsOf(s, 'resourcesLost').map((/** @type {any} */ e) => e.lost);

	state.seats[0].resources = { coin: 1, worker: 0, food: 0, culture: 2 };
	const asked = resolveEffects(
		state,
		1,
		[{ lose: { culture: 1, any: 1 } }],
		random
	);
	assert.deepEqual(asked.seats[0].resources, {
		coin: 1,
		worker: 0,
		food: 0,
		culture: 1,
	});
	const [open] = openDecisions(asked);
	assert.deepEqual(
		[open.kind, open.player, open.purpose, open.options, open.optional],
		['chooseSlot', 1, 'loseResource', ['coin', 'culture'], false]
	);
	const paid = answer(asked, random, 1, 'chooseSlot', { slot: 'coin' });
	assert.deepEqual(paid.seats[0].resources, {
		coin: 0,
		worker: 0,
		food: 0,
		culture: 1,
	});
	assert.deepEqual(lost(paid), [{ culture: 1 }, { coin: 1 }]);
	assert.deepEqual(eventsOf(paid, 'resourcesLost')[0].player, 1);

	// Without culture, none is lost; a lone kind of resource is taken without asking.
	state.seats[0].resources = { coin: 0, worker: 2, food: 0, culture: 0 };
	const alone = resolveEffects(
		state,
		1,
		[{ lose: { culture: 1, any: 1 } }],
		random
	);
	assert.deepEqual(openDecisions(alone)[0].kind, 'chooseTurn');
	assert.equal(alone.seats[0].resources.worker, 1);
	assert.deepEqual(lost(alone), [{ worker: 1 }]);

	// Each point asks again among what is left.
	state.seats[0].resources = { coin: 1, worker: 0, food: 1, culture: 0 };
	const twice = resolveEffects(state, 1, [{ lose: { any: 2 } }], random);
	assert.deepEqual(openDecisions(twice)[0].options, ['coin', 'food']);
	const rest = answer(twice, random, 1, 'chooseSlot', { slot: 'food' });
	assert.deepEqual(rest.seats[0].resources, {
		coin: 0,
		worker: 0,
		food: 0,
		culture: 0,
	});
	assert.deepEqual(lost(rest), [{ food: 1 }, { coin: 1 }]);

	// With nothing to take, nothing happens.
	state.seats[0].resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	const none = resolveEffects(
		state,
		1,
		[{ lose: { culture: 1, any: 1 } }],
		random
	);
	assert.deepEqual(lost(none), []);
	assert.deepEqual(openDecisions(none)[0].kind, 'chooseTurn');
});

test('chooseSlot answers one of its options by deep equality, or null when optional, and askSlot asks only when it must', () => {
	const { state, random } = game(2);
	state.pending.length = 0;
	const then = { kind: 'effects', effects: [{ vp: 1 }] };
	const ctx = contextFor(state, random, state.pending);
	const options = [
		{ player: 2, card: 'irrigation' },
		{ player: 2, card: 'calendar' },
	];

	// A required pick with one option is made at once; with none, nothing happens.
	askSlot(ctx, 1, {
		options: [options[0]],
		optional: false,
		purpose: 'test',
		then,
	});
	assert.deepEqual(
		state.pending.map((op) => [op.kind, op.slot]),
		[['effects', options[0]]]
	);
	state.pending.length = 0;
	askSlot(ctx, 1, { options: [], optional: true, purpose: 'test', then });
	assert.deepEqual(state.pending, []);

	// An optional pick asks even with one option, and offers the decline first.
	askSlot(ctx, 1, {
		options: [options[0]],
		optional: true,
		purpose: 'test',
		then,
	});
	const [single] = state.pending;
	assert.equal(single.kind, 'chooseSlot');
	assert.deepEqual(DECISIONS.chooseSlot.answers(state, single), [
		{ slot: null },
		{ slot: options[0] },
	]);
	state.pending.length = 0;

	askSlot(ctx, 1, { options, optional: false, purpose: 'test', then });
	const [decision] = state.pending;
	assert.deepEqual(DECISIONS.chooseSlot.answers(state, decision), [
		{ slot: options[0] },
		{ slot: options[1] },
	]);
	for (const slot of [
		null,
		{ player: 2 },
		{ player: 2, card: 'calendar', x: 1 },
		'calendar',
	]) {
		assert.throws(
			() => DECISIONS.chooseSlot.check(state, decision, { slot }),
			{
				name: 'PlayerError',
				message: 'Choose one of the options offered.',
			},
			JSON.stringify(slot)
		);
	}
	run(state, random);
	// The same option written in another key order is the same option.
	const next = answer(state, random, 1, 'chooseSlot', {
		slot: { card: 'calendar', player: 2 },
	});
	assert.equal(next.seats[0].vp, 1);
	const declined = structuredClone(state);
	declined.pending[0].optional = true;
	const after = answer(declined, random, 1, 'chooseSlot', { slot: null });
	assert.equal(after.seats[0].vp, 0);
});

test('a new seat holds no civilization data, and the civilization discards start empty', () => {
	const { state } = newGame(3);
	for (const seat of state.seats) {
		assert.deepEqual(seat.civData, {});
	}
	assert.deepEqual(state.supply.civDiscard, []);
	assert.deepEqual(civsOf(state, 9), []);
	assert.deepEqual(Object.keys(CIVS).sort(), [...BASE_CIVS].sort());
	for (const [id, civ] of Object.entries(CIVS)) {
		assert.equal(civ.id, id);
	}
});

test('startedGame deals inert civilizations and clears them, keeping every civilization in one place', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = startedGame(count);
		const reveal = state.events.find(
			(/** @type {any} */ e) => e.type === 'setupRevealed'
		);
		assert.deepEqual(
			reveal.picks.map((/** @type {any} */ p) => p.civ),
			INERT.slice(0, count)
		);
		for (const seat of state.seats) {
			assert.deepEqual(seat.civs, []);
			assert.deepEqual(seat.civData, {});
		}
		assert.deepEqual([...state.supply.civs].sort(), [...BASE_CIVS].sort());
		assert.deepEqual(state.supply.civDiscard, []);
	}
});

test('startedGame with civs deals and keeps those civilizations', () => {
	const { state: fresh } = newGame(3);
	const dealt = openDecisions(fresh)
		.filter((d) => d.kind === 'chooseCiv')
		.map((d) => d.options);
	// Seat 1 wants one dealt to seat 2, seat 2 one from the deck, seat 3 one dealt to seat 1.
	const civs = [dealt[1][1], fresh.supply.civs[0], dealt[0][0]];
	for (const version of /** @type {const} */ (['current', 'original'])) {
		const { state } = startedGame(3, { civs, version });
		assert.equal(state.phase, 'play');
		state.seats.forEach((seat, i) => {
			assert.deepEqual(seat.civs, [civs[i]]);
		});
		assert.deepEqual(
			[...state.supply.civs, ...civs].sort(),
			[...BASE_CIVS].sort()
		);
	}
	const ready = readyTurn(2, () => {}, { civs: ['alchemists', 'traders'] });
	assert.deepEqual(
		ready.state.seats.map((s) => s.civs),
		[['alchemists'], ['traders']]
	);
});
