// Tests for moving a token: landmarks, activating a space, and the optional bonus (#14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { moveToken, isActivated } from '../src/lib/engine/movement.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { startedGame, stubHandoffs } from './helpers/engine.mjs';

/**
 * A started 2-player game, changed by `fill` (given seat 1 and the state).
 * @param {(seat: any, state: any) => void} [fill]
 */
function game(fill = () => {}) {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	fill(next.seats[0], next);
	return { state: next, random };
}

/**
 * Moves a seat's token and runs until the next decision.
 * @param {any} state - Changed
 * @param {any} random
 * @param {number} player
 * @param {{ track: any, from: number, to: number, benefit: boolean }} move
 */
function move(state, random, player, move) {
	moveToken(contextFor(state, random, state.pending), player, move);
	run(state, random);
	return state;
}

/** The event types after index `from`. */
const typesSince = (/** @type {any} */ state, /** @type {number} */ from) =>
	state.events.slice(from).map((/** @type {any} */ e) => e.type);

test('the first player into tier II gains its landmark, and it is placed before the benefit (FAQ #1)', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [3];
	});
	const before = state.events.length;
	move(state, random, 1, {
		track: 'exploration',
		from: 3,
		to: 4,
		benefit: true,
	});
	assert.deepEqual(state.seats[0].tracks.exploration, [4]);
	assert.ok(!state.landmarks.includes('lighthouse'));
	assert.deepEqual(handoffs.calls, [
		{ kind: 'placeLandmark', player: 1, value: { landmark: 'lighthouse' } },
		{ kind: 'explore', player: 1, value: {} },
	]);
	assert.deepEqual(typesSince(state, before), [
		'tokenMoved',
		'landmarkGained',
		'spaceActivated',
		'tilesGained',
	]);
	assert.deepEqual(
		state.events.find(
			(/** @type {any} */ e) => e.type === 'landmarkGained'
		),
		{
			seq: state.events[before + 1].seq,
			type: 'landmarkGained',
			player: 1,
			landmark: 'lighthouse',
			track: 'exploration',
		}
	);
});

test('a landmark someone already gained is not gained again', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat, s) => {
		seat.tracks.exploration = [3];
		s.seats[1].tracks.exploration = [3];
	});
	const step = { track: 'exploration', from: 3, to: 4, benefit: false };
	move(state, random, 1, step);
	move(state, random, 2, step);
	assert.deepEqual(
		handoffs.calls.map((c) => [c.kind, c.player]),
		[['placeLandmark', 1]]
	);
});

test('R9: a move past several first spaces gains each landmark still there, lowest tier first', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat, s) => {
		seat.tracks.military = [3];
		s.landmarks = s.landmarks.filter(
			(/** @type {string} */ id) => id !== 'tank-factory'
		);
	});
	move(state, random, 1, {
		track: 'military',
		from: 3,
		to: 10,
		benefit: false,
	});
	assert.deepEqual(
		handoffs.calls.map((c) => c.value.landmark),
		['barracks', 'fusion-reactor']
	);
});

test('R9: regressing never gains a landmark', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [5];
	});
	move(state, random, 1, {
		track: 'exploration',
		from: 5,
		to: 4,
		benefit: false,
	});
	assert.ok(state.landmarks.includes('lighthouse'));
	assert.deepEqual(handoffs.calls, []);
});

test('a move without the benefit still gains the landmark', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat) => {
		seat.tracks.science = [3];
	});
	const before = state.events.length;
	move(state, random, 1, {
		track: 'science',
		from: 3,
		to: 4,
		benefit: false,
	});
	assert.deepEqual(typesSince(state, before), [
		'tokenMoved',
		'landmarkGained',
	]);
	assert.equal(isActivated(state, 1, 'science', 4), false);
});

test('R19: a space activated this turn gives nothing the second time, but the token still moves', () => {
	const { state, random } = game();
	const step = { track: 'exploration', from: 0, to: 1, benefit: true };
	move(state, random, 1, step);
	assert.equal(isActivated(state, 1, 'exploration', 1), true);
	assert.equal(isActivated(state, 2, 'exploration', 1), false);
	state.seats[0].tracks.exploration = [0];
	const before = state.events.length;
	move(state, random, 1, step);
	assert.deepEqual(state.seats[0].tracks.exploration, [1]);
	assert.equal(state.seats[0].territoryTiles.length, 2);
	assert.deepEqual(typesSince(state, before), ['tokenMoved']);
});

test('the bonus is offered after the benefit, declined by default, and only when payable', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const rafts = { track: 'exploration', from: 1, to: 2, benefit: true };
	const poor = game((seat) => {
		seat.tracks.exploration = [1];
	});
	move(poor.state, poor.random, 1, rafts);
	assert.ok(!openDecisions(poor.state).some((d) => d.kind === 'chooseBonus'));

	const { state, random } = game((seat) => {
		seat.tracks.exploration = [1];
		seat.resources.coin = 1;
	});
	move(state, random, 1, rafts);
	const [bonus] = openDecisions(state);
	assert.equal(bonus.kind, 'chooseBonus');
	assert.deepEqual(
		[bonus.track, bonus.space, bonus.cost, bonus.gain],
		['exploration', 2, { any: 1 }, [{ gain: { tapestry: 1 } }]]
	);
	assert.deepEqual(DECISIONS.chooseBonus.answers(state, bonus), [
		{ pay: null },
		{ pay: { coin: 1 } },
	]);
	assert.deepEqual(
		handoffs.calls.map((c) => c.kind),
		['explore', 'explore'],
		'the benefit came first, in both games'
	);
});

test('paying a bonus discards and gains its effects once', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [7];
		seat.territoryTiles = [1, 2, 3];
	});
	move(state, random, 1, {
		track: 'exploration',
		from: 7,
		to: 8,
		benefit: true,
	});
	const [bonus] = openDecisions(state);
	assert.equal(bonus.kind, 'chooseBonus');
	const next = play(
		state,
		1,
		{ decision: bonus.id, pay: { territory: [1, 3] } },
		random
	);
	// Cars: 1 farm, then 1 VP per farm; the bonus adds 5 VP.
	assert.equal(next.seats[0].vp, 6);
	assert.deepEqual(next.seats[0].territoryTiles, [2]);
	assert.deepEqual(next.supply.territoryDiscard, [1, 3]);
	assert.ok(!openDecisions(next).some((d) => d.kind === 'chooseBonus'));
	assert.deepEqual(
		next.events
			.filter((e) => e.type === 'bonusPaid')
			.map(({ seq: _seq, ...e }) => e),
		[{ type: 'bonusPaid', player: 1, track: 'exploration', space: 8 }]
	);
});

test('declining the bonus gains nothing, and a bonus answer must pay or decline', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const { state, random } = game((seat) => {
		seat.tracks.exploration = [1];
		seat.resources.coin = 1;
	});
	move(state, random, 1, {
		track: 'exploration',
		from: 1,
		to: 2,
		benefit: true,
	});
	const [bonus] = openDecisions(state);
	for (const answer of [{}, { pay: { coin: 2 } }, { pay: { food: 1 } }]) {
		assert.throws(
			() => play(state, 1, { decision: bonus.id, ...answer }, random),
			{ name: 'PlayerError' },
			JSON.stringify(answer)
		);
	}
	const next = play(state, 1, { decision: bonus.id, pay: null }, random);
	assert.equal(next.seats[0].resources.coin, 1);
	assert.equal(next.seats[0].hand.length, 0);
});

test('a new game has activated nothing', () => {
	const { state } = startedGame(2);
	assert.deepEqual(state.activated, []);
});
