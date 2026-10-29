// Tests for the client's turn-clock helpers (#26): time left, corrected to the server's time; which clock a screen shows, and one ticking time (#89).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import {
	formatClock,
	isRunning,
	shownClock,
	timeLeft,
} from '../src/lib/clock.js';
import { clockTime } from '../src/lib/now.svelte.js';
import TurnClock from '../src/lib/components/ui/TurnClock.svelte';

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

const running = (/** @type {number} */ seat) => ({
	seat,
	ends: 100_000,
	expired: false,
});
const paused = (/** @type {number} */ seat) => ({
	seat,
	left: 42_000,
	expired: false,
});

test("a screen shows the seat's own running clock first (#89)", () => {
	const clocks = [running(1), running(2), paused(3)];
	assert.equal(shownClock({ clocks }, 2), clocks[1]);
});

test("another player's running clock comes before the seat's paused one (#89)", () => {
	const clocks = [paused(1), running(2)];
	assert.equal(shownClock({ clocks }, 1), clocks[1]);
	assert.equal(shownClock({ clocks }, null), clocks[1]);
});

test("a paused clock shows only when none runs, the seat's own first (#89)", () => {
	const clocks = [paused(1), paused(2)];
	assert.equal(shownClock({ clocks }, 2), clocks[1]);
	assert.equal(shownClock({ clocks }, 3), clocks[0]);
});

test('a table without clocks shows none (#89)', () => {
	assert.equal(shownClock({ clocks: [] }, 1), null);
	assert.equal(shownClock({}, 1), null);
});

test('a clock runs while it has an end and has not run out (#89)', () => {
	assert.equal(isRunning(running(1)), true);
	assert.equal(isRunning(paused(1)), false);
	assert.equal(isRunning({ ...running(1), expired: true }), false);
});

test('TurnClock names its player and the time in its title, and marks a paused or warning clock (#89)', () => {
	const html = render(TurnClock, {
		props: { seat: 2, name: 'Vera', ms: 102_000 },
	}).body;
	assert.match(html, /title="Vera: 1:42"/);
	assert.doesNotMatch(html, /rg-turn-clock--paused|rg-turn-clock--warn/);
	const still = render(TurnClock, {
		props: { seat: 2, name: 'Vera', ms: 4_200, running: false, warn: true },
	}).body;
	assert.match(still, /rg-turn-clock--paused/);
	assert.match(still, /rg-turn-clock--warn/);
	assert.match(still, /title="Vera: 0:05"/);
});

test("the clocks' time is the browser's, read at once outside a screen (#89)", () => {
	const before = Date.now();
	const now = clockTime.now;
	assert.ok(now >= before && now <= Date.now());
});

test('no screen or component runs its own timer, chooses a clock or writes the running rule (#89)', () => {
	const src = fileURLToPath(new URL('../src/', import.meta.url));
	const files = readdirSync(src, { recursive: true })
		.map(String)
		.filter(
			(file) =>
				/\.(svelte|js)$/.test(file) &&
				!file.startsWith('library/') &&
				!file.startsWith('lib/engine/') &&
				file !== 'lib/now.svelte.js'
		);
	assert.ok(files.length > 100, 'the source files are found');
	for (const file of files) {
		const source = readFileSync(`${src}${file}`, 'utf8');
		assert.doesNotMatch(source, /setInterval/, `${file} runs a timer`);
		if (file === 'lib/clock.js') {
			continue;
		}
		assert.doesNotMatch(
			source,
			/clocks\??\.find/,
			`${file} chooses a clock`
		);
		assert.doesNotMatch(
			source,
			/ends !== undefined && !\w+\.expired/,
			`${file} writes the running rule`
		);
		assert.doesNotMatch(
			source,
			/: \{formatClock\(/,
			`${file} builds the clock's title`
		);
	}
});
