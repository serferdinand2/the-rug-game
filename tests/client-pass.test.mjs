// The hot-seat hand-over (#30 design §2–§6): which view the client takes or asks for, and whom the pass screen names.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { handOver, passReason } from '../src/lib/pass.js';

/**
 * A game view asking the given seats at once, one decision each in the open batch.
 * @param {number[]} asked
 * @param {'setup' | 'play' | 'over'} [phase]
 */
function gameAsking(asked, phase = 'play') {
	return {
		phase,
		pending: asked.map((player, i) => ({
			id: i + 1,
			batch: 1,
			player,
			kind: 'chooseTurn',
		})),
	};
}

/**
 * A hot-seat room view of two seats.
 * @param {number | null} viewing - The seat the view is for; null for the public view
 * @param {any} game
 */
function room(viewing, game) {
	return { mode: 'hotseat', you: [1, 2], viewing, game };
}

const TAKE = undefined;
const PUBLIC = null;

test('an online table is never handed over', () => {
	assert.deepEqual(
		handOver(
			{ mode: 'online', you: [1], viewing: 1, game: gameAsking([2]) },
			null,
			null
		),
		{ shown: null, passing: null, fetch: TAKE }
	);
});

test('a hot-seat lobby is taken as it is', () => {
	assert.deepEqual(handOver(room(null, null), null, null), {
		shown: null,
		passing: null,
		fetch: TAKE,
	});
});

test('the first view of a deal, or after a refresh, names the asked player and keeps the public view', () => {
	assert.deepEqual(handOver(room(null, gameAsking([1])), null, null), {
		shown: null,
		passing: 1,
		fetch: TAKE,
	});
	// Setup asks everyone at once: the lowest seat goes first (#26).
	assert.deepEqual(
		handOver(
			{ ...room(null, gameAsking([2, 1], 'setup')), you: [1, 2, 3] },
			null,
			null
		),
		{ shown: null, passing: 1, fetch: TAKE }
	);
});

test("when the turn passes, the last player's view is dropped for the public one and the next player is named", () => {
	assert.deepEqual(handOver(room(1, gameAsking([2])), 1, null), {
		shown: null,
		passing: 2,
		fetch: PUBLIC,
	});
});

test('the same player asked again keeps the screen, with no pass', () => {
	assert.deepEqual(handOver(room(1, gameAsking([1])), 1, null), {
		shown: 1,
		passing: null,
		fetch: TAKE,
	});
});

test('the pass screen holds its player while the game moves on, and never takes a private view', () => {
	// The server declined for a defender without a trap, or a clock ran out: the pass screen still names seat 2.
	assert.deepEqual(handOver(room(null, gameAsking([1])), null, 2), {
		shown: null,
		passing: 2,
		fetch: TAKE,
	});
	// A poll that still asked for the last seat brings its view: it is swapped for the public one.
	assert.deepEqual(handOver(room(1, gameAsking([2])), null, 2), {
		shown: null,
		passing: 2,
		fetch: PUBLIC,
	});
});

test("the named player's view is asked for only once they take the screen, and taken when it arrives", () => {
	// Taken: shown is the named seat, and the pass screen stays until its view arrives.
	assert.deepEqual(handOver(room(null, gameAsking([2])), 2, 2), {
		shown: 2,
		passing: 2,
		fetch: 2,
	});
	assert.deepEqual(handOver(room(2, gameAsking([2])), 2, 2), {
		shown: 2,
		passing: null,
		fetch: TAKE,
	});
});

test('a player who takes the screen with nothing left to do passes it on at once', () => {
	assert.deepEqual(handOver(room(2, gameAsking([1])), 2, 2), {
		shown: null,
		passing: 1,
		fetch: PUBLIC,
	});
});

test('while nobody is asked, the seat on show stays', () => {
	assert.deepEqual(handOver(room(2, gameAsking([])), 2, null), {
		shown: 2,
		passing: null,
		fetch: TAKE,
	});
	assert.deepEqual(handOver(room(null, gameAsking([])), 2, null), {
		shown: 2,
		passing: null,
		fetch: 2,
	});
});

test('a finished game shows the public view, with no pass', () => {
	assert.deepEqual(handOver(room(1, gameAsking([], 'over')), 1, null), {
		shown: null,
		passing: null,
		fetch: PUBLIC,
	});
	assert.deepEqual(handOver(room(null, gameAsking([], 'over')), null, 2), {
		shown: null,
		passing: null,
		fetch: TAKE,
	});
});

test('the reason line names a turn, setup, or any other question alike', () => {
	const seats = [{ name: 'Marko' }, { name: 'Vera' }];
	assert.equal(
		passReason({ phase: 'play', current: 2, seats }, 2),
		"It's Vera's turn."
	);
	assert.equal(
		passReason({ phase: 'setup', current: 1, seats }, 2),
		"Vera's setup choices."
	);
	// A conquest's response question reads like any other question outside the player's turn (#17).
	assert.equal(
		passReason({ phase: 'play', current: 1, seats }, 2),
		'Vera has a choice to make.'
	);
});
