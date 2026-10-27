// Tests for the client's turn-clock helpers (#26): time left, corrected to the server's time.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { formatClock, timeLeft } from '../src/lib/clock.js';

test('a running clock counts down from ends minus the server time, by the browser time since the answer', () => {
	const clock = { seat: 1, ends: 100_000, expired: false };
	assert.equal(timeLeft(clock, 90_000, 5_000, 5_000), 10_000);
	assert.equal(timeLeft(clock, 90_000, 5_000, 7_500), 7_500);
});

test('a paused clock shows what it has left, however long ago the answer came', () => {
	const clock = { seat: 1, left: 42_000, expired: false };
	assert.equal(timeLeft(clock, 90_000, 5_000, 65_000), 42_000);
});

test('an expired clock is 0 and the time left is never negative', () => {
	assert.equal(
		timeLeft({ seat: 1, ends: 1, left: 9, expired: true }, 0, 0, 0),
		0
	);
	assert.equal(
		timeLeft({ seat: 1, ends: 100, expired: false }, 90, 0, 60_000),
		0
	);
	assert.equal(timeLeft({ seat: 1, expired: false }, 0, 0, 0), 0);
});

test('formatClock rounds up to the next whole second as m:ss', () => {
	assert.equal(formatClock(4_200), '0:05');
	assert.equal(formatClock(102_000), '1:42');
	assert.equal(formatClock(59_001), '1:00');
	assert.equal(formatClock(0), '0:00');
	assert.equal(formatClock(-5), '0:00');
});
