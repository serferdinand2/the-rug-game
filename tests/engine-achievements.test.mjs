// Tests for the three achievements: complete any track, topple two outposts and conquer the middle island (#19; R23, R24).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push } from '../src/lib/engine/stack.js';
import { run, contextFor } from '../src/lib/engine/loop.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { startedGame, readyTurn } from './helpers/engine.mjs';

const face = (/** @type {number} */ n) => () => n;

/** Runs a conquer-dice operation for seat 1 on a hex. */
function dice(/** @type {any} */ state, /** @type {string} */ hex) {
	push(state, state.pending, [
		{ player: 1, kind: 'conquerDice', hex, both: false },
	]);
	run(state, face(0));
}

/** Pushes forced advances for the seats, in order, as Age of Discovery does. */
function forceAdvances(
	/** @type {any} */ state,
	/** @type {number[]} */ seats,
	track = 'science'
) {
	push(
		state,
		state.pending,
		seats.map((player) => ({
			player,
			kind: 'effects',
			effects: [{ advance: { tracks: [track], noBenefit: true } }],
		}))
	);
	run(state, face(0));
}

const claims = (/** @type {any} */ state) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === 'achievementClaimed')
		.map((/** @type {any} */ e) => [e.player, e.achievement, e.vp]);

test('reaching space 12 claims "complete any track" with the first box (R23, R24)', () => {
	for (const [count, box] of [
		[2, 10],
		[4, 15],
	]) {
		const { state, player } = readyTurn(count, (seat) => {
			seat.tracks.science = [11];
		});
		const before = state.seats[player - 1].vp;
		forceAdvances(state, [player]);
		assert.deepEqual(state.achievements['complete-track'], [player]);
		assert.equal(state.seats[player - 1].vp, before + box);
		assert.deepEqual(claims(state), [[player, 'complete-track', box]]);
	}
});

test('the second player to complete a track gets the next box, and a third on the small map gets nothing', () => {
	const { state } = readyTurn(3, (seat, s) => {
		for (const other of s.seats) {
			other.tracks.science = [11];
		}
	});
	state.map = 'small';
	forceAdvances(state, [1, 2, 3]);
	assert.deepEqual(state.achievements['complete-track'], [1, 2]);
	assert.deepEqual(claims(state), [
		[1, 'complete-track', 10],
		[2, 'complete-track', 5],
	]);
});

test('a player claims each achievement once', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.tracks.science = [11];
		seat.tracks.technology = [11];
	});
	forceAdvances(state, [player], 'science');
	forceAdvances(state, [player], 'technology');
	assert.deepEqual(claims(state), [[player, 'complete-track', 10]]);
});

test('a token jumping to 12 claims the achievement', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.tracks.science = [10];
	});
	moveToken(contextFor(state, random, state.pending), player, {
		track: 'science',
		from: 10,
		to: 12,
		benefit: false,
	});
	assert.deepEqual(state.achievements['complete-track'], [player]);
});

/** A small-map game where seat 1 has toppled one outpost elsewhere, ready to topple a second on '-2_-1'. */
function toppleGame() {
	const { state: started } = startedGame(2);
	const state = structuredClone(started);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	];
	return state;
}

test('toppling two opponent outposts claims "topple two" when the second conquest ends', () => {
	const state = toppleGame();
	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	];
	dice(state, '-2_-1');
	assert.deepEqual(state.achievements['topple-two'], [1]);
	assert.deepEqual(claims(state), [[1, 'topple-two', 10]]);
});

test('one topple is not enough', () => {
	const state = toppleGame();
	state.hexes['-2_-1'].outposts = [{ seat: 1, toppled: false }];
	dice(state, '-2_-1');
	assert.deepEqual(state.achievements['topple-two'], []);
});

test('a topple undone by a trap does not count, and the defender is credited for theirs', () => {
	const state = toppleGame();
	// Seat 2's trap stood their outpost up and toppled seat 1's; seat 2 had already toppled one elsewhere.
	state.hexes['-2_-2'].outposts = [
		{ seat: 1, toppled: false },
		{ seat: 2, toppled: true, toppledBy: 1 },
	];
	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	];
	state.hexes['-1_-2'].outposts = [{ seat: 1, toppled: true, toppledBy: 2 }];
	dice(state, '-2_-1');
	assert.deepEqual(state.achievements['topple-two'], [2]);
	assert.deepEqual(claims(state), [[2, 'topple-two', 10]]);
});

test('conquering the middle island claims it, but not when trapped', () => {
	for (const map of ['small', 'large']) {
		const state = toppleGame();
		state.map = /** @type {any} */ (map);
		state.hexes['0_0'].outposts = [{ seat: 1, toppled: false }];
		dice(state, '0_0');
		assert.deepEqual(claims(state), [[1, 'middle-island', 10]]);

		const trapped = toppleGame();
		trapped.map = /** @type {any} */ (map);
		trapped.hexes['0_0'].outposts = [
			{ seat: 2, toppled: false },
			{ seat: 1, toppled: true, toppledBy: 2 },
		];
		dice(trapped, '0_0');
		assert.deepEqual(trapped.achievements['middle-island'], []);
	}
});

test('a finished player claims nothing', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.tracks.science = [11];
	});
	state.seats[player - 1].finished = true;
	// A finished player's effects are skipped, so claim through a passive operation.
	push(state, state.pending, [
		{
			player,
			kind: 'effects',
			passive: true,
			effects: [{ advance: { tracks: ['science'], noBenefit: true } }],
		},
	]);
	run(state, face(0));
	assert.deepEqual(state.achievements['complete-track'], []);
});

test('claiming order follows when each player met the condition', () => {
	const { state } = readyTurn(3, (seat, s) => {
		for (const other of s.seats) {
			other.tracks.science = [11];
		}
	});
	state.map = 'large';
	forceAdvances(state, [3, 1]);
	assert.deepEqual(state.achievements['complete-track'], [3, 1]);
	assert.deepEqual(claims(state), [
		[3, 'complete-track', 15],
		[1, 'complete-track', 10],
	]);
});
