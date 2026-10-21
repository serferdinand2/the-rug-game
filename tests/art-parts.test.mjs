// Scene parts: each fills the area it promises, repeats for the same seed and paints only palette colours.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, seededRandom } from '../art/painter.js';
import { PALETTE } from '../art/palette.js';
import { drawSky } from '../art/parts/sky.js';
import { drawSea } from '../art/parts/sea.js';

const PALETTE_COLOURS = new Set(Object.values(PALETTE));

/**
 * Lists the rows that are completely filled and the rows that are completely empty.
 * @param {import('../art/painter.js').Canvas} canvas
 */
function rowStates(canvas) {
	const full = [];
	const empty = [];
	for (let y = 0; y < canvas.h; y++) {
		const row = canvas.p.slice(y * canvas.w, (y + 1) * canvas.w);
		if (row.every(Boolean)) {
			full.push(y);
		} else if (row.every((c) => c === null)) {
			empty.push(y);
		}
	}
	return { full, empty };
}

/** Builds [from, …, to]. */
function range(from, to) {
	return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Every way the parts can be drawn, each on its own 64×64 canvas. */
const SAMPLES = [
	{
		label: 'sky: night',
		draw: (c, random) =>
			drawSky(c, {
				time: 'night',
				horizon: 41,
				random,
				sparkles: [[8, 6]],
				moon: { x: 50, y: 10 },
			}),
	},
	{
		label: 'sea: night',
		draw: (c, random) => drawSea(c, { time: 'night', top: 42, random }),
	},
];

/** Draws one sample with a seed. */
function render(sample, seed) {
	const c = createCanvas(64, 64);
	sample.draw(c, seededRandom(seed));
	return c;
}

test('the night sky fills every pixel down to its horizon', () => {
	const c = createCanvas(64, 64);
	drawSky(c, { time: 'night', horizon: 41, random: seededRandom(1) });
	assert.deepEqual(rowStates(c), {
		full: range(0, 41),
		empty: range(42, 63),
	});
});

test('the night sea fills every pixel from its top row down', () => {
	const c = createCanvas(64, 64);
	drawSea(c, { time: 'night', top: 42, random: seededRandom(1) });
	assert.deepEqual(rowStates(c), {
		full: range(42, 63),
		empty: range(0, 41),
	});
});

test('every part draws the same pixels for the same seed', () => {
	for (const sample of SAMPLES) {
		assert.deepEqual(render(sample, 3), render(sample, 3), sample.label);
	}
});

test('the night sky and sea use their random stream', () => {
	for (const sample of SAMPLES) {
		assert.notDeepEqual(render(sample, 3), render(sample, 4), sample.label);
	}
});

test('parts draw only palette colours', () => {
	for (const sample of SAMPLES) {
		const strays = new Set(
			render(sample, 5).p.filter((c) => c && !PALETTE_COLOURS.has(c))
		);
		assert.deepEqual([...strays], [], sample.label);
	}
});

test('every palette colour is lowercase #rrggbb', () => {
	for (const [name, colour] of Object.entries(PALETTE)) {
		assert.match(colour, /^#[0-9a-f]{6}$/, name);
	}
});
