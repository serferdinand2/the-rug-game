// Tests for the advance turn: when it is offered, what it costs, and how the turn ends (#14).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { advances } from '../src/lib/engine/decisions/choose-advance.js';
import { startedGame, readyTurn, answer } from './helpers/engine.mjs';

/**
 * The current player's open turn choice.
 * @param {any} state
 */
const turnChoice = (state) =>
	openDecisions(state).find((d) => d.kind === 'chooseTurn');

/**
 * Chooses an advance turn, then answers chooseAdvance.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {Record<string, any>} move
 */
function advance(state, random, player, move) {
	const next = answer(state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	return answer(next, random, player, 'chooseAdvance', move);
}

test('advance is offered only after income turn 1 and when some advance is payable (01 §4.1)', () => {
	const { state: first } = startedGame(2);
	assert.deepEqual(turnChoice(first).options, ['income']);

	const poor = readyTurn(2);
	assert.deepEqual(turnChoice(poor.state).options, ['income']);
	assert.throws(
		() =>
			answer(poor.state, poor.random, poor.player, 'chooseTurn', {
				turn: 'advance',
			}),
		{ name: 'PlayerError', message: /can't pay for any advance/ }
	);

	const { state } = readyTurn(2, (seat) => {
		seat.resources.coin = 1;
	});
	assert.deepEqual(turnChoice(state).options, ['income', 'advance']);
});

test('each tier costs its price: 1 any; the track resource and 1 or 2 any; 2 of the track resource (01 §3.1)', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.tracks = {
			exploration: [0],
			science: [3],
			technology: [6],
			military: [9],
		};
		seat.resources = { coin: 3, worker: 3, food: 3, culture: 3 };
	});
	assert.deepEqual(advances(state, player), [
		{ track: 'exploration', from: 0, cost: { any: 1 } },
		{ track: 'science', from: 3, cost: { worker: 1, any: 1 } },
		{ track: 'technology', from: 6, cost: { coin: 1, any: 2 } },
		{ track: 'military', from: 9, cost: { culture: 2 } },
	]);
});

test('any may be paid in the track resource itself', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.tracks.exploration = [3];
		seat.resources.food = 2;
	});
	const decision = openDecisions(
		answer(state, () => 0, player, 'chooseTurn', { turn: 'advance' })
	)[0];
	assert.deepEqual(
		DECISIONS.chooseAdvance
			.answers(state, decision)
			.filter((a) => a.track === 'exploration'),
		[{ track: 'exploration', from: 3, pay: { food: 2 } }]
	);
});

test('no track is offered past space 12', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.tracks.exploration = [12];
		seat.resources.coin = 2;
	});
	assert.ok(!advances(state, player).some((a) => a.track === 'exploration'));
});

test('two tokens on a track are offered separately, and an answer must say which', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.tracks.technology = [2, 5];
		seat.resources.coin = 3;
	});
	assert.deepEqual(
		advances(state, player).filter((a) => a.track === 'technology'),
		[
			{ track: 'technology', from: 2, cost: { any: 1 } },
			{ track: 'technology', from: 5, cost: { coin: 1, any: 1 } },
		]
	);
	assert.throws(
		() =>
			advance(state, random, player, {
				track: 'technology',
				pay: { coin: 1 },
			}),
		{ name: 'PlayerError', message: /which of your tokens/ }
	);
	const same = readyTurn(2, (seat) => {
		seat.tracks.technology = [1, 1];
		seat.resources.coin = 3;
	});
	const next = advance(same.state, same.random, same.player, {
		track: 'technology',
		pay: { coin: 1 },
	});
	assert.deepEqual(next.seats[same.player - 1].tracks.technology, [2, 1]);
});

test('an advance pays, moves one space, and the turn passes to the next seat', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.resources.coin = 1;
	});
	const before = state.events.length;
	const next = advance(state, random, player, {
		track: 'exploration',
		from: 0,
		pay: { coin: 1 },
	});
	const seat = next.seats[player - 1];
	const other = player === 1 ? 2 : 1;
	assert.equal(seat.resources.coin, 0);
	assert.deepEqual(seat.tracks.exploration, [1]);
	assert.equal(seat.territoryTiles.length, 2);
	assert.equal(next.current, other);
	assert.deepEqual(next.activated, []);
	assert.deepEqual(
		openDecisions(next).map((d) => [d.kind, d.player]),
		[['chooseTurn', other]]
	);
	assert.deepEqual(
		next.events.slice(before).map((e) => e.type),
		[
			'turnChosen',
			'resourcesPaid',
			'tokenMoved',
			'spaceActivated',
			'tilesGained',
			'turnStarted',
		]
	);
});

test('the turn passes over a seat that has finished', () => {
	const { state, random, player } = readyTurn(3, (seat, s) => {
		seat.resources.coin = 1;
		// Seat indexes run 0 to 2, so the seat after `current` is at index `current % 3`.
		s.seats[/** @type {number} */ (s.current) % 3].finished = true;
	});
	// Seat numbers run 1 to 3, so the one after the next is two places on.
	const skipped = (player % 3) + 1;
	const expected = (skipped % 3) + 1;
	assert.ok(state.seats[skipped - 1].finished);
	const next = advance(state, random, player, {
		track: 'exploration',
		from: 0,
		pay: { coin: 1 },
	});
	assert.equal(next.current, expected);
});

test('a bad advance answer is refused with a PlayerError', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.resources.coin = 1;
		seat.tracks.military = [12];
	});
	for (const move of [
		{ track: 'arts', from: 0, pay: { coin: 1 } },
		{ track: 'exploration', from: 4, pay: { coin: 1 } },
		{ track: 'exploration', from: '0', pay: { coin: 1 } },
		{ track: 'exploration', from: 0 },
		{ track: 'exploration', from: 0, pay: { coin: 2 } },
		{ track: 'exploration', from: 0, pay: { food: 1 } },
		{ track: 'military', from: 12, pay: { coin: 1 } },
	]) {
		assert.throws(
			() => advance(state, random, player, move),
			{ name: 'PlayerError' },
			JSON.stringify(move)
		);
	}
});
