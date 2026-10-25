// Tests for income step 2: the first-of-neighbours bonus and playing the era's tapestry card (#15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { view } from '../src/lib/engine/view.js';
import { neighbours } from '../src/lib/engine/income.js';
import { readyTurn, answer, stubHandoffs } from './helpers/engine.mjs';

/**
 * The current player takes an income turn after income turn `before`.
 * @param {import('node:test').TestContext} t
 * @param {number} before
 * @param {(seat: any, state: any) => void} [fill]
 * @param {number} [count] - Players
 */
function incomeAfter(t, before, fill = () => {}, count = 2) {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const ready = readyTurn(count, (seat, state) => {
		seat.incomeTurns = before;
		fill(seat, state);
	});
	const eventsBefore = ready.state.events.length;
	const state = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'income',
		}
	);
	return {
		state,
		random: ready.random,
		player: ready.player,
		seat: state.seats[ready.player - 1],
		events: state.events.slice(eventsBefore),
	};
}

/** Every seat but the current player's. */
const others = (/** @type {any} */ seat, /** @type {any} */ state) =>
	state.seats.filter((/** @type {any} */ s) => s.seat !== seat.seat);

for (const [before, count] of [
	[1, 1],
	[2, 2],
	[3, 3],
]) {
	test(`the first of their neighbours to start era ${before + 1} gains ${count} any`, (t) => {
		const r = incomeAfter(t, before, (seat) => {
			seat.hand = ['trap-1'];
		});
		const [bonus] = openDecisions(r.state);
		assert.deepEqual([bonus.kind, bonus.count], ['chooseResource', count]);
		assert.ok(
			r.events.some(
				(e) =>
					e.type === 'firstBonus' &&
					e.player === r.player &&
					e.era === before + 1
			)
		);
	});
}

test('no bonus once a neighbour has started the era; in 2 players the one opponent counts', (t) => {
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = ['trap-1'];
		others(seat, state)[0].incomeTurns = 2;
	});
	assert.equal(openDecisions(r.state)[0].kind, 'chooseTapestry');
	assert.ok(!r.events.some((e) => e.type === 'firstBonus'));
});

test('in 4 players the seat across does not count as a neighbour', (t) => {
	const r = incomeAfter(
		t,
		1,
		(seat, state) => {
			seat.hand = ['trap-1'];
			const i = state.seats.indexOf(seat);
			state.seats[(i + 2) % 4].incomeTurns = 2;
		},
		4
	);
	assert.ok(r.events.some((e) => e.type === 'firstBonus'));
	const p = r.player;
	assert.deepEqual(
		neighbours(r.state, p).sort(),
		[((p + 2) % 4) + 1, (p % 4) + 1].sort()
	);
});

test('in 4 players the seat before counts as a neighbour too', (t) => {
	const r = incomeAfter(
		t,
		1,
		(seat, state) => {
			seat.hand = ['trap-1'];
			const i = state.seats.indexOf(seat);
			state.seats[(i + 3) % 4].incomeTurns = 2;
		},
		4
	);
	assert.ok(!r.events.some((e) => e.type === 'firstBonus'));
});

test('a tapestry card must be played from the hand, and its ability runs: a trap gains 10 VP (R22)', (t) => {
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = ['trap-1', 'trap-2'];
		others(seat, state)[0].incomeTurns = 2;
	});
	const [choice] = openDecisions(r.state);
	assert.deepEqual([choice.kind, choice.era], ['chooseTapestry', 2]);
	assert.deepEqual(DECISIONS.chooseTapestry.answers(r.state, choice), [
		{ card: 'trap-1' },
		{ card: 'trap-2' },
	]);
	const next = answer(r.state, r.random, r.player, 'chooseTapestry', {
		card: 'trap-2',
	});
	const seat = next.seats[r.player - 1];
	assert.ok(!seat.hand.includes('trap-2'));
	assert.deepEqual(seat.incomeMat.tapestry[1], ['trap-2']);
	assert.equal(seat.vp - r.seat.vp, 10);
	assert.ok(
		next.events.some(
			(e) =>
				e.type === 'tapestryPlayed' &&
				e.card === 'trap-2' &&
				e.era === 2 &&
				e.faceDown === false
		)
	);
});

test('a chooseTapestry answer must be a card in the hand', (t) => {
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = ['trap-1'];
		others(seat, state)[0].incomeTurns = 2;
	});
	for (const reply of [{ card: 'trap-9' }, { card: null }, {}]) {
		assert.throws(
			() => answer(r.state, r.random, r.player, 'chooseTapestry', reply),
			{ name: 'PlayerError' },
			JSON.stringify(reply)
		);
	}
});

test("with an empty hand the top card goes on face down, hidden from every view, its owner's too", (t) => {
	// Monarchy on top of the deck: face up, it would become the active THIS ERA ability.
	const card = 'monarchy';
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = [];
		others(seat, state)[0].incomeTurns = 2;
		const { deck } = state.supply.tapestry;
		deck.splice(deck.indexOf(card), 1);
		deck.unshift(card);
	});
	assert.deepEqual(r.seat.incomeMat.tapestry[1], [card]);
	assert.deepEqual(r.seat.incomeMat.faceDown, [card]);
	assert.equal(r.seat.era, null);
	assert.ok(!r.events.some((e) => e.type === 'eraStarted'));
	assert.ok(
		r.events.some(
			(e) =>
				e.type === 'tapestryPlayed' &&
				e.card === null &&
				e.faceDown === true
		)
	);
	for (const seat of [r.player, r.player === 1 ? 2 : 1, null]) {
		const seen = view(r.state, seat);
		assert.ok(!JSON.stringify(seen).includes(`"${card}"`), String(seat));
		const mine = /** @type {any} */ (seen.seats[r.player - 1]);
		assert.deepEqual(mine.incomeMat.tapestry[1], [null]);
		assert.equal(mine.incomeMat.faceDown, undefined);
	}
});

test('a face-down card still counts as a tapestry card on the mat', (t) => {
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = [];
		others(seat, state)[0].incomeTurns = 2;
	});
	const scored = resolveEffects(
		r.state,
		r.player,
		[{ vp: { per: 'tapestryCard' } }],
		r.random
	);
	// The face-down card, and the card Ceremony's income drew into the hand.
	assert.equal(scored.seats[r.player - 1].vp - r.seat.vp, 2);
});

test('with no tapestry cards anywhere, nothing is played', (t) => {
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = [];
		others(seat, state)[0].incomeTurns = 2;
		state.supply.tapestry.deck = [];
		state.supply.tapestry.discard = [];
	});
	assert.deepEqual(r.seat.incomeMat.tapestry[1], []);
	assert.ok(!r.events.some((e) => e.type === 'tapestryPlayed'));
	assert.notEqual(r.state.current, r.player);
});

test("another seat never sees a player's chooseTapestry options", (t) => {
	const r = incomeAfter(t, 1, (seat, state) => {
		seat.hand = ['trap-1'];
		others(seat, state)[0].incomeTurns = 2;
	});
	const other = r.player === 1 ? 2 : 1;
	const find = (/** @type {any} */ v) =>
		v.pending.find((/** @type {any} */ op) => op.kind === 'chooseTapestry');
	assert.deepEqual(find(view(r.state, r.player)).options, ['trap-1']);
	assert.equal(find(view(r.state, other)).options, undefined);
	assert.equal(find(view(r.state, null)).options, undefined);
});
