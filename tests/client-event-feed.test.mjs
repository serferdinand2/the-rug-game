// The events new since the last view, never replayed (#29 design §4), and the log's live events after an undo.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { freshEvents, liveEvents } from '../src/lib/event-feed.js';

/**
 * A room view with a game holding events numbered `from` to `to`.
 * @param {number} from
 * @param {number} to
 * @param {{ code?: string, deal?: number }} [options]
 */
function roomWith(from, to, { code = 'ABCD1234', deal = 1 } = {}) {
	const events = [];
	for (let seq = from; seq <= to; seq++) {
		events.push({ seq, type: 'tokenMoved', player: 1 });
	}
	return { code, deal, game: { seq: to, events } };
}

test('the events after the last view of the same deal are fresh, in order', () => {
	const fresh = freshEvents(roomWith(1, 10), roomWith(1, 13));
	assert.deepEqual(
		fresh.map((e) => e.seq),
		[11, 12, 13]
	);
});

test('nothing is fresh on the first view, a refresh, another table or a new deal', () => {
	assert.deepEqual(freshEvents(null, roomWith(1, 13)), []);
	assert.deepEqual(
		freshEvents(roomWith(1, 10), roomWith(1, 13, { code: 'OTHER123' })),
		[]
	);
	assert.deepEqual(
		freshEvents(roomWith(1, 40), roomWith(1, 3, { deal: 2 })),
		[]
	);
	assert.deepEqual(
		freshEvents(roomWith(1, 10), { code: 'ABCD1234', deal: 1, game: null }),
		[]
	);
});

test('nothing is fresh after a gap: missed events are never replayed out of order', () => {
	// The state keeps only its newest events; a view that skipped some starts after a hole.
	assert.deepEqual(freshEvents(roomWith(1, 10), roomWith(15, 20)), []);
});

test('the same view again has nothing fresh', () => {
	assert.deepEqual(freshEvents(roomWith(1, 10), roomWith(1, 10)), []);
});

test('an undone event takes back the events from its from up to it, and stays itself', () => {
	const events = [
		{ seq: 1, type: 'turnStarted', player: 1 },
		{ seq: 2, type: 'tokenMoved', player: 1 },
		{ seq: 3, type: 'resourcesPaid', player: 1 },
		{ seq: 4, type: 'undone', player: 1, from: 2 },
		{ seq: 5, type: 'tokenMoved', player: 1 },
	];
	assert.deepEqual(
		liveEvents(events).map((e) => e.seq),
		[1, 4, 5]
	);
	assert.deepEqual(liveEvents([]), []);
});
