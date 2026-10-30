// The hot-seat hand-over (#30 design §2–§6): which view the client takes or asks for, and whom the pass screen names.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	acceptStep,
	handOver,
	handedEvents,
	passReason,
} from '../src/lib/pass.js';

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

/**
 * A game view of the given events, numbered 1 to `count`, asking the given seats.
 * @param {number} count
 * @param {number[]} asked
 * @param {'setup' | 'play' | 'over'} [phase]
 */
function gameAt(count, asked, phase = 'play') {
	return {
		...gameAsking(asked, phase),
		events: Array.from({ length: count }, (_, i) => ({
			seq: i + 1,
			type: 'turnStarted',
			player: 1,
		})),
	};
}

/**
 * A hot-seat room view of a table's version, as acceptStep reads it.
 * @param {number} version
 * @param {number | null} viewing
 * @param {any} game
 * @param {Record<string, unknown>} [extra] - Fields to change, such as the code or the mode
 */
function roomAt(version, viewing, game, extra = {}) {
	return {
		...room(viewing, game),
		code: 'ABCD2345',
		deal: 0,
		version,
		...extra,
	};
}

/**
 * The events numbered from `from` to `to`, as gameAt makes them.
 * @param {number} from
 * @param {number} to
 */
function eventsFrom(from, to) {
	return gameAt(to, []).events.slice(from - 1);
}

test('an older version of the table on show is dropped, and the screen stays as it is', () => {
	const current = roomAt(5, 1, gameAt(3, [1]));
	assert.deepEqual(
		acceptStep(current, roomAt(4, 2, gameAt(2, [2])), 1, null),
		{
			take: false,
			fetch: TAKE,
			shown: 1,
			passing: null,
			fresh: [],
		}
	);
	assert.deepEqual(
		acceptStep(current, roomAt(4, null, gameAt(2, [2])), null, 2),
		{ take: false, fetch: TAKE, shown: null, passing: 2, fresh: [] }
	);
});

test('an older version of another table is taken', () => {
	const current = roomAt(5, 1, gameAt(3, [1]), { mode: 'online', you: [1] });
	const other = roomAt(1, 1, null, {
		code: 'WXYZ6789',
		mode: 'online',
		you: [1],
	});
	assert.deepEqual(acceptStep(current, other, null, null), {
		take: true,
		fetch: TAKE,
		shown: null,
		passing: null,
		fresh: [],
	});
});

test('an online table is taken with the events that arrived since the last view', () => {
	const online = { mode: 'online', you: [1] };
	assert.deepEqual(
		acceptStep(
			roomAt(3, 1, gameAt(2, [2]), online),
			roomAt(4, 1, gameAt(4, [1]), online),
			null,
			null
		),
		{
			take: true,
			fetch: TAKE,
			shown: null,
			passing: null,
			fresh: eventsFrom(3, 4),
		}
	);
});

test('the first view is taken, even when the hand-over asks for another, and nothing in it is fresh', () => {
	assert.deepEqual(
		acceptStep(null, roomAt(1, 1, gameAt(3, [2])), null, null),
		{
			take: true,
			fetch: PUBLIC,
			shown: null,
			passing: 2,
			fresh: [],
		}
	);
});

test('the same player asked again keeps the screen, and the new events are fresh', () => {
	assert.deepEqual(
		acceptStep(
			roomAt(3, 1, gameAt(2, [1])),
			roomAt(4, 1, gameAt(3, [1])),
			1,
			null
		),
		{
			take: true,
			fetch: TAKE,
			shown: 1,
			passing: null,
			fresh: eventsFrom(3, 3),
		}
	);
});

test("the public view, or another seat's, while a seat is on show asks for that seat's view and is not shown", () => {
	const current = roomAt(3, 2, gameAt(2, []));
	// A poll that still asked for seat 1 brings its view.
	assert.deepEqual(
		acceptStep(current, roomAt(4, 1, gameAt(3, [])), 2, null),
		{
			take: false,
			fetch: 2,
			shown: 2,
			passing: null,
			fresh: [],
		}
	);
	assert.deepEqual(
		acceptStep(current, roomAt(4, null, gameAt(3, [])), 2, null),
		{
			take: false,
			fetch: 2,
			shown: 2,
			passing: null,
			fresh: [],
		}
	);
});

test("when the turn passes, the holder's own view shows at once and sounds, and the public view is asked for", () => {
	assert.deepEqual(
		acceptStep(
			roomAt(3, 1, gameAt(2, [1])),
			roomAt(4, 1, gameAt(3, [2])),
			1,
			null
		),
		{
			take: true,
			fetch: PUBLIC,
			shown: null,
			passing: 2,
			fresh: eventsFrom(3, 3),
		}
	);
	// The move that ends the game shows the same way, under the results.
	assert.deepEqual(
		acceptStep(
			roomAt(3, 1, gameAt(2, [1])),
			roomAt(4, 1, gameAt(3, [], 'over')),
			1,
			null
		),
		{
			take: true,
			fetch: PUBLIC,
			shown: null,
			passing: null,
			fresh: eventsFrom(3, 3),
		}
	);
});

test('under a pass screen the public view is taken, and its events stay silent', () => {
	// The server declined for a defender without a trap, or a clock ran out: the pass screen still names seat 2.
	assert.deepEqual(
		acceptStep(
			roomAt(4, null, gameAt(3, [2])),
			roomAt(5, null, gameAt(4, [1])),
			null,
			2
		),
		{ take: true, fetch: TAKE, shown: null, passing: 2, fresh: [] }
	);
});

test('once the named player takes the screen, only their own view is shown, and it arrives silent', () => {
	const current = roomAt(5, null, gameAt(4, [2]));
	// The public view that arrives in the meantime is not shown: the pass screen stays.
	assert.deepEqual(
		acceptStep(current, roomAt(6, null, gameAt(5, [2])), 2, 2),
		{
			take: false,
			fetch: 2,
			shown: 2,
			passing: 2,
			fresh: [],
		}
	);
	// Their own view of the same version is taken, and the pass screen goes.
	assert.deepEqual(acceptStep(current, roomAt(5, 2, gameAt(4, [2])), 2, 2), {
		take: true,
		fetch: TAKE,
		shown: 2,
		passing: null,
		fresh: [],
	});
});

test('a player taking the screen is handed the events since they last held it, without what an undo took back (#153)', () => {
	const events = [
		{ seq: 1, type: 'turnStarted', player: 1 },
		{
			seq: 2,
			type: 'tokenMoved',
			player: 1,
			track: 'science',
			from: 0,
			to: 1,
		},
		{
			seq: 3,
			type: 'tokenMoved',
			player: 1,
			track: 'military',
			from: 0,
			to: 1,
		},
		{ seq: 4, type: 'undone', player: 1, from: 3 },
		{
			seq: 5,
			type: 'techInvented',
			player: 1,
			card: 'compass',
			from: 'face',
		},
	];
	assert.deepEqual(
		handedEvents(events, 1).map((event) => event.seq),
		[2, 4, 5]
	);
	assert.deepEqual(handedEvents(events, 5), []);
	assert.deepEqual(handedEvents(/** @type {any} */ (null), 0), []);
});
