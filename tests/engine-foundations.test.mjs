// Tests for the engine's errors, randomness, events and state helpers (#13, task 1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PlayerError } from '../src/lib/engine/errors.js';
import { shuffle, seededRandom } from '../src/lib/engine/random.js';
import { emit, EVENT_WINDOW } from '../src/lib/engine/events.js';
import { playerSeat, seatOf } from '../src/lib/engine/state.js';

test('PlayerError is an Error named PlayerError', () => {
	const error = new PlayerError('Wait for your turn.');
	assert.ok(error instanceof Error);
	assert.equal(error.name, 'PlayerError');
	assert.equal(error.message, 'Wait for your turn.');
});

test('shuffle returns a new list with the same items and leaves its input alone', () => {
	const list = [1, 2, 3, 4, 5, 6, 7, 8];
	const shuffled = shuffle(list, seededRandom(7));
	assert.notEqual(shuffled, list);
	assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7, 8]);
	assert.deepEqual(
		[...shuffled].sort((a, b) => a - b),
		list
	);
});

test('seededRandom gives whole numbers from 0 to n - 1, the same for the same seed', () => {
	const a = seededRandom(42);
	const b = seededRandom(42);
	for (let i = 0; i < 1000; i++) {
		const n = 1 + (i % 12);
		const value = a(n);
		assert.ok(Number.isInteger(value) && value >= 0 && value < n);
		assert.equal(value, b(n));
	}
});

test('two seeds give different shuffles', () => {
	const list = Array.from({ length: 20 }, (_, i) => i + 1);
	assert.notDeepEqual(
		shuffle(list, seededRandom(1)),
		shuffle(list, seededRandom(2))
	);
});

test('emit numbers events from 1, each one more than the last', () => {
	const state = { seq: 0, events: [] };
	const first = emit(state, { type: 'a' });
	emit(state, { type: 'b' });
	assert.equal(first.seq, 1);
	assert.deepEqual(
		state.events.map((e) => e.seq),
		[1, 2]
	);
	assert.equal(state.seq, 2);
});

test('the state keeps only the newest 500 events', () => {
	assert.equal(EVENT_WINDOW, 500);
	const state = { seq: 0, events: [] };
	for (let i = 0; i < 501; i++) {
		emit(state, { type: 'x' });
	}
	assert.equal(state.events.length, 500);
	assert.equal(state.events[0].seq, 2);
	assert.equal(state.seq, 501);
});

test('playerSeat refuses a seat that is not a player', () => {
	const state = /** @type {any} */ ({ seats: [{ seat: 1, kind: 'automa' }] });
	assert.throws(
		() => playerSeat(state, 1),
		(error) => error instanceof Error && !(error instanceof PlayerError)
	);
	assert.throws(
		() => seatOf(state, 2),
		(error) => error instanceof Error && !(error instanceof PlayerError)
	);
	assert.equal(seatOf(state, 1).kind, 'automa');
});
