// Tests for playing tapestry cards: their abilities, THIS ERA cards that last, and tapestryOnTop (#19, design §5, §7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, contextFor, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS, AUTOMATIC } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { view } from '../src/lib/engine/view.js';
import { playTapestry } from '../src/lib/engine/tapestry.js';
import {
	startedGame,
	readyTurn,
	answer,
	stubHandoffs,
	resolveTapestry,
} from './helpers/engine.mjs';

/**
 * A started 2-player game in which seat 1 has taken `turns` income turns and holds `hand`.
 * @param {number} turns
 * @param {string[]} hand
 * @param {{ version?: 'original' | 'current' }} [options]
 */
function holding(turns, hand, options) {
	const { state: started, random } = startedGame(2, options);
	const state = structuredClone(started);
	state.seats[0].incomeTurns = turns;
	state.seats[0].hand = [...hand];
	return { state, random };
}

/**
 * The events of one type, leaving out the first `from` events of the log, without their numbers.
 * @param {any} state
 * @param {string} type
 * @param {number} [from]
 */
const eventsOf = (state, type, from = 0) =>
	state.events
		.slice(from)
		.filter((/** @type {any} */ e) => e.type === type)
		.map(({ seq: _seq, ...e }) => e);

/**
 * Records every tapestryAbility operation that runs, until the test ends.
 * @param {import('node:test').TestContext} t
 * @returns {any[]}
 */
function watchAbilities(t) {
	/** @type {any[]} */
	const ran = [];
	const real = AUTOMATIC.tapestryAbility;
	AUTOMATIC.tapestryAbility = (ctx, op) => {
		ran.push(op);
		real(ctx, op);
	};
	t.after(() => {
		AUTOMATIC.tapestryAbility = real;
	});
	return ran;
}

/**
 * Moves a card to the top of the tapestry deck.
 * @param {any} state
 * @param {string} card
 */
function onTopOfDeck(state, card) {
	const { deck } = state.supply.tapestry;
	deck.splice(deck.indexOf(card), 1);
	deck.unshift(card);
}

test('a trap played as a tapestry card gains 10 VP (R22)', () => {
	const { state, random } = startedGame(2);
	const next = resolveTapestry(state, random, 1, 'trap-2');
	assert.equal(next.seats[0].vp - state.seats[0].vp, 10);
	assert.equal(next.seats[0].era, null);
	assert.deepEqual(next.seats[0].incomeMat.tapestry[1], ['trap-2']);
});

test('a WHEN PLAYED card runs its effects once, with the card as their source', () => {
	const { state: started, random } = startedGame(2);
	const state = resolveTapestry(started, random, 1, 'meritocracy');
	// Meritocracy invents first; the 2 VP per tech card wait under the question.
	const [invent] = openDecisions(state);
	assert.deepEqual([invent.kind, invent.player], ['chooseInvent', 1]);
	const rest = state.pending.find((op) => op.kind === 'effects');
	assert.deepEqual(rest?.source, { tapestry: 'meritocracy' });
	assert.deepEqual(rest?.effects, [{ vp: { per: 'techCard', each: 2 } }]);
	const next = answer(state, random, 1, 'chooseInvent', {
		card: state.supply.tech.faceUp[0],
	});
	assert.equal(next.seats[0].vp, 2);
	assert.equal(eventsOf(next, 'vpGained').length, 1);
	assert.equal(next.seats[0].era, null);
});

test('a THIS ERA card becomes the active ability when played', () => {
	const { state, random } = startedGame(2);
	const next = resolveTapestry(state, random, 1, 'monarchy');
	assert.deepEqual(next.seats[0].era, {
		card: 'monarchy',
		ability: 'monarchy',
	});
	assert.deepEqual(eventsOf(next, 'eraStarted'), [
		{
			type: 'eraStarted',
			player: 1,
			card: 'monarchy',
			ability: 'monarchy',
		},
	]);
});

test('a THIS ERA card ends at the start of the next income turn', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	/** @type {any} */
	let eraAtCivStep = 'not run';
	const civStandIn = AUTOMATIC.civAbilities;
	AUTOMATIC.civAbilities = (ctx, op) => {
		eraAtCivStep = ctx.state.seats[op.player - 1].era;
		civStandIn(ctx, op);
	};
	const ready = readyTurn(2, (seat, state) => {
		seat.incomeTurns = 2;
		seat.hand = ['trap-1'];
		for (const other of state.seats) {
			if (other !== seat) {
				other.incomeTurns = 3;
			}
		}
	});
	const { random, player } = ready;
	const played = resolveTapestry(ready.state, random, player, 'monarchy');
	const before = played.events.length;
	const next = answer(played, random, player, 'chooseTurn', {
		turn: 'income',
	});
	const types = next.events.slice(before).map((e) => e.type);
	assert.ok(types.includes('eraEnded'));
	assert.ok(types.indexOf('incomeTurnStarted') < types.indexOf('eraEnded'));
	// The civilization step (#20) finds the era already over.
	assert.equal(eraAtCivStep, null);
	assert.equal(next.seats[player - 1].era, null);
	assert.deepEqual(eventsOf(next, 'eraEnded', before), [
		{ type: 'eraEnded', player, card: 'monarchy', ability: 'monarchy' },
	]);
});

test('a THIS ERA card ends when a card covers it', () => {
	const { state: started, random } = startedGame(2);
	let state = resolveTapestry(started, random, 1, 'monarchy', 2);
	// A card on another slot covers nothing.
	state = resolveTapestry(state, random, 1, 'trap-1', 3);
	assert.equal(state.seats[0].era?.card, 'monarchy');
	const before = state.events.length;
	playTapestry(contextFor(state, random, state.pending), 1, 'trap-2', 2);
	run(state, random);
	assert.equal(state.seats[0].era, null);
	assert.deepEqual(state.seats[0].incomeMat.tapestry[1], [
		'monarchy',
		'trap-2',
	]);
	assert.deepEqual(eventsOf(state, 'eraEnded', before), [
		{ type: 'eraEnded', player: 1, card: 'monarchy', ability: 'monarchy' },
	]);

	// A face-down card covers it just the same.
	const down = resolveTapestry(started, random, 1, 'monarchy', 2);
	playTapestry(contextFor(down, random, down.pending), 1, 'trap-3', 2, true);
	run(down, random);
	assert.equal(down.seats[0].era, null);
	assert.equal(eventsOf(down, 'eraEnded').length, 1);
});

test('a THIS ERA card ends when its player finishes', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	// Under current rules, a card played during income turn 5 goes onto the era-4 stack (R25) and works until the finish.
	const ready = readyTurn(2, (seat, state) => {
		seat.incomeTurns = 4;
		seat.tech.middle = ['printing-press'];
		seat.tracks.technology = [6];
		seat.hand = ['monarchy', 'trap-1'];
		for (const other of state.seats) {
			if (other !== seat) {
				other.incomeTurns = 4;
			}
		}
	});
	const { random, player } = ready;
	let state = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'income',
	});
	state = answer(state, random, player, 'chooseUpgrade', {
		card: 'printing-press',
	});
	state = answer(state, random, player, 'chooseTapestry', {
		card: 'monarchy',
	});
	const seat = state.seats[player - 1];
	assert.deepEqual(seat.incomeMat.tapestry[3], ['monarchy']);
	assert.equal(seat.finished, true);
	assert.equal(seat.era, null);
	const types = state.events.map((e) => e.type);
	assert.ok(types.lastIndexOf('eraStarted') < types.lastIndexOf('eraEnded'));
	assert.ok(
		types.lastIndexOf('eraEnded') < types.lastIndexOf('playerFinished')
	);
});

test('a face-down card has no ability', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const ran = watchAbilities(t);
	const ready = readyTurn(2, (seat, state) => {
		seat.hand = [];
		for (const other of state.seats) {
			if (other !== seat) {
				other.incomeTurns = 2;
			}
		}
		// Played face up, Monarchy would become the active ability.
		onTopOfDeck(state, 'monarchy');
	});
	const { random, player } = ready;
	const state = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'income',
	});
	const seat = state.seats[player - 1];
	assert.deepEqual(seat.incomeMat.tapestry[1], ['monarchy']);
	assert.deepEqual(seat.incomeMat.faceDown, ['monarchy']);
	assert.deepEqual(ran, []);
	assert.equal(seat.era, null);
});

test('tapestryOnTop plays nothing in era 1 (R25)', () => {
	const { state, random } = holding(1, ['trap-1', 'monarchy']);
	const next = resolveEffects(state, 1, [{ tapestryOnTop: {} }], random);
	assert.deepEqual(eventsOf(next, 'noTapestryOnTop'), [
		{ type: 'noTapestryOnTop', player: 1 },
	]);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseTapestry'));
	assert.deepEqual(next.seats[0].hand, ['trap-1', 'monarchy']);
	assert.deepEqual(next.seats[0].incomeMat.tapestry, [[], [], [], []]);
});

test('tapestryOnTop plays onto the current era in eras 2 to 4', () => {
	for (const turns of [2, 3, 4]) {
		const { state, random } = holding(turns, ['trap-1', 'monarchy']);
		const next = resolveEffects(state, 1, [{ tapestryOnTop: {} }], random);
		const [open] = openDecisions(next);
		assert.deepEqual(
			[open.kind, open.player, open.era, open.options],
			['chooseTapestry', 1, turns, ['trap-1', 'monarchy']],
			`era ${turns}`
		);
		const played = answer(next, random, 1, 'chooseTapestry', {
			card: 'monarchy',
		});
		const seat = played.seats[0];
		assert.deepEqual(seat.incomeMat.tapestry[turns - 1], ['monarchy']);
		assert.deepEqual(seat.hand, ['trap-1']);
		assert.equal(seat.era?.card, 'monarchy');
	}
});

test('tapestryOnTop plays the only card in hand without asking', () => {
	const { state, random } = holding(3, ['trap-1']);
	const next = resolveEffects(state, 1, [{ tapestryOnTop: {} }], random);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseTapestry'));
	assert.deepEqual(next.seats[0].incomeMat.tapestry[2], ['trap-1']);
	assert.deepEqual(next.seats[0].hand, []);
	assert.equal(next.seats[0].vp, 10);
});

test('a card played in step 1 goes into the empty new slot and the era card covers it (R25)', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	// Stands in for a civilization ability (#20) that plays a card on top in step 1.
	AUTOMATIC.civAbilities = (ctx, op) => {
		ctx.push([
			{
				player: op.player,
				kind: 'effects',
				effects: [{ tapestryOnTop: {} }],
			},
		]);
	};
	const ready = readyTurn(2, (seat, state) => {
		seat.incomeTurns = 2;
		seat.hand = ['monarchy', 'trap-1'];
		for (const other of state.seats) {
			if (other !== seat) {
				other.incomeTurns = 3;
			}
		}
	});
	const { random, player } = ready;
	let state = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'income',
	});
	const [step1] = openDecisions(state);
	assert.deepEqual([step1.kind, step1.era], ['chooseTapestry', 3]);
	state = answer(state, random, player, 'chooseTapestry', {
		card: 'monarchy',
	});
	assert.deepEqual(state.seats[player - 1].incomeMat.tapestry[2], [
		'monarchy',
	]);
	assert.equal(state.seats[player - 1].era?.card, 'monarchy');
	const [step2] = openDecisions(state);
	assert.deepEqual(
		[step2.kind, step2.era, step2.options],
		['chooseTapestry', 3, ['trap-1']]
	);
	state = answer(state, random, player, 'chooseTapestry', {
		card: 'trap-1',
	});
	const seat = state.seats[player - 1];
	assert.deepEqual(seat.incomeMat.tapestry[2], ['monarchy', 'trap-1']);
	assert.equal(seat.era, null);
	assert.equal(eventsOf(state, 'eraEnded').length, 1);
});

test('in income turn 5 tapestryOnTop plays onto era 4 under current rules and nothing under the original (R25)', () => {
	const current = holding(5, ['trap-1', 'monarchy'], { version: 'current' });
	const onTop = resolveEffects(
		current.state,
		1,
		[{ tapestryOnTop: {} }],
		current.random
	);
	const [open] = openDecisions(onTop);
	assert.deepEqual([open.kind, open.era], ['chooseTapestry', 4]);

	const original = holding(5, ['trap-1', 'monarchy'], {
		version: 'original',
	});
	const none = resolveEffects(
		original.state,
		1,
		[{ tapestryOnTop: {} }],
		original.random
	);
	assert.ok(!openDecisions(none).some((d) => d.kind === 'chooseTapestry'));
	assert.equal(eventsOf(none, 'noTapestryOnTop').length, 1);
	assert.deepEqual(none.seats[0].hand, ['trap-1', 'monarchy']);
});

test('tapestryOnTop with an empty hand plays nothing (FAQ #10)', () => {
	const { state, random } = holding(2, []);
	const next = resolveEffects(state, 1, [{ tapestryOnTop: {} }], random);
	assert.deepEqual(eventsOf(next, 'noTapestryOnTop'), [
		{ type: 'noTapestryOnTop', player: 1 },
	]);
	assert.deepEqual(next.seats[0].incomeMat.tapestry, [[], [], [], []]);
	assert.equal(eventsOf(next, 'tapestryPlayed').length, 0);
});

test('an optional chooseTapestry may be declined, and afterPlay runs only after a play', () => {
	const { state, random } = holding(2, ['trap-1', 'trap-2']);
	push(state, state.pending, [
		{
			player: 1,
			kind: 'chooseTapestry',
			options: ['trap-1'],
			era: 2,
			optional: true,
			afterPlay: [{ vp: 5 }],
		},
	]);
	run(state, random);
	const [open] = openDecisions(state);
	assert.deepEqual(DECISIONS.chooseTapestry.answers(state, open), [
		{ card: null },
		{ card: 'trap-1' },
	]);

	const declined = play(state, 1, { decision: open.id, card: null }, random);
	assert.deepEqual(declined.seats[0].hand, ['trap-1', 'trap-2']);
	assert.deepEqual(declined.seats[0].incomeMat.tapestry[1], []);
	assert.equal(declined.seats[0].vp, 0);
	assert.equal(eventsOf(declined, 'tapestryPlayed').length, 0);

	const played = play(
		state,
		1,
		{ decision: open.id, card: 'trap-1' },
		random
	);
	assert.deepEqual(played.seats[0].hand, ['trap-2']);
	assert.deepEqual(played.seats[0].incomeMat.tapestry[1], ['trap-1']);
	// The trap's ability first (R22), then afterPlay.
	assert.deepEqual(
		eventsOf(played, 'vpGained').map((e) => e.vp),
		[10, 5]
	);
	// The card must still be one offered.
	assert.throws(
		() => play(state, 1, { decision: open.id, card: 'trap-2' }, random),
		{
			name: 'PlayerError',
			message: 'Play one of the tapestry cards in your hand.',
		}
	);
});

test('chooseTapestry keeps its options hidden from other seats', () => {
	const { state, random } = holding(2, ['trap-1', 'monarchy']);
	const next = resolveEffects(state, 1, [{ tapestryOnTop: {} }], random);
	const find = (/** @type {any} */ v) =>
		v.pending.find((/** @type {any} */ op) => op.kind === 'chooseTapestry');
	assert.deepEqual(find(view(next, 1)).options, ['trap-1', 'monarchy']);
	for (const seat of [2, null]) {
		const seen = view(next, seat);
		assert.equal(find(seen).options, undefined, String(seat));
		assert.equal(find(seen).answers, undefined, String(seat));
		assert.ok(!JSON.stringify(seen).includes('"monarchy"'), String(seat));
	}
});
