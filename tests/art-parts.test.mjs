// Scene parts: each fills the area it promises, repeats for the same seed and paints only palette colours.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, seededRandom } from '../art/painter.js';
import { PALETTE } from '../art/palette.js';
import { drawSky } from '../art/parts/sky.js';
import { drawSea } from '../art/parts/sea.js';
import { drawTerrain } from '../art/parts/terrain.js';
import { drawBuilding } from '../art/parts/buildings.js';
import { drawFigure } from '../art/parts/figures.js';

const PALETTE_COLOURS = new Set(Object.values(PALETTE));
const SKY_TIMES = ['night', 'day', 'dusk'];
const SEA_TIMES = ['night', 'day'];
const TERRAIN_KINDS = ['forest', 'mountain', 'desert', 'grassland'];
const BUILDING_KINDS = ['house', 'tower', 'wall'];

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

/** Every way the parts can be drawn, each on its own 64×64 canvas. `random` marks parts that take a random stream. */
const SAMPLES = [
	...SKY_TIMES.map((time) => ({
		label: `sky: ${time}`,
		random: true,
		draw: (c, random) =>
			drawSky(c, {
				time,
				horizon: 41,
				random,
				sparkles: [[8, 6]],
				moon: { x: 50, y: 10 },
			}),
	})),
	...SEA_TIMES.map((time) => ({
		label: `sea: ${time}`,
		random: true,
		draw: (c, random) => drawSea(c, { time, top: 42, random }),
	})),
	...TERRAIN_KINDS.map((kind) => ({
		label: `terrain: ${kind}`,
		random: true,
		draw: (c, random) => drawTerrain(c, { kind, top: 44, random }),
	})),
	...BUILDING_KINDS.map((kind) => ({
		label: `building: ${kind}`,
		random: false,
		draw: (c) => drawBuilding(c, { kind, x: 20, y: 50 }),
	})),
	{
		label: 'figure',
		random: false,
		draw: (c) => drawFigure(c, { x: 20, y: 50 }),
	},
];

/** Draws one sample with a seed. */
function render(sample, seed) {
	const c = createCanvas(64, 64);
	sample.draw(c, seededRandom(seed));
	return c;
}

test('every sky time fills every pixel down to its horizon', () => {
	for (const time of SKY_TIMES) {
		const c = createCanvas(64, 64);
		drawSky(c, { time, horizon: 41, random: seededRandom(1) });
		assert.deepEqual(
			rowStates(c),
			{ full: range(0, 41), empty: range(42, 63) },
			time
		);
	}
});

test('every sea time fills every pixel from its top row down', () => {
	for (const time of SEA_TIMES) {
		const c = createCanvas(64, 64);
		drawSea(c, { time, top: 42, random: seededRandom(1) });
		assert.deepEqual(
			rowStates(c),
			{ full: range(42, 63), empty: range(0, 41) },
			time
		);
	}
});

test('every terrain kind fills every pixel from its top row down', () => {
	for (const kind of TERRAIN_KINDS) {
		const c = createCanvas(64, 64);
		drawTerrain(c, { kind, top: 44, random: seededRandom(1) });
		const { full } = rowStates(c);
		for (const y of range(44, 63)) {
			assert.ok(full.includes(y), `${kind}: row ${y} is not filled`);
		}
	}
});

test('buildings and the figure draw only inside the box they return', () => {
	const pieces = [
		...BUILDING_KINDS.map((kind) => ({
			label: kind,
			draw: (c) => drawBuilding(c, { kind, x: 20, y: 50 }),
		})),
		{ label: 'figure', draw: (c) => drawFigure(c, { x: 20, y: 50 }) },
		{
			label: 'figure facing left',
			draw: (c) => drawFigure(c, { x: 20, y: 50, facing: 'left' }),
		},
	];
	for (const piece of pieces) {
		const c = createCanvas(64, 64);
		const box = piece.draw(c);
		assert.equal(box.x, 20, `${piece.label}: box.x`);
		assert.equal(box.y + box.h - 1, 50, `${piece.label}: bottom row`);
		c.p.forEach((colour, i) => {
			if (colour) {
				const x = i % c.w;
				const y = Math.floor(i / c.w);
				const within =
					x >= box.x &&
					x < box.x + box.w &&
					y >= box.y &&
					y < box.y + box.h;
				assert.ok(
					within,
					`${piece.label}: pixel (${x}, ${y}) is outside its box`
				);
			}
		});
		assert.ok(c.p.some(Boolean), `${piece.label}: drew nothing`);
	}
});

test('a wider building fills a wider box', () => {
	for (const kind of BUILDING_KINDS) {
		const narrow = drawBuilding(createCanvas(64, 64), {
			kind,
			x: 2,
			y: 50,
		});
		const wide = drawBuilding(createCanvas(64, 64), {
			kind,
			x: 2,
			y: 50,
			width: narrow.w + 6,
		});
		assert.equal(wide.w, narrow.w + 6, kind);
	}
});

test('a figure facing left is the mirror of one facing right', () => {
	const right = createCanvas(64, 64);
	const left = createCanvas(64, 64);
	const box = drawFigure(right, { x: 20, y: 50 });
	drawFigure(left, { x: 20, y: 50, facing: 'left' });
	for (let y = box.y; y < box.y + box.h; y++) {
		for (let dx = 0; dx < box.w; dx++) {
			assert.equal(
				left.p[y * 64 + box.x + dx],
				right.p[y * 64 + box.x + box.w - 1 - dx],
				`(${dx}, ${y})`
			);
		}
	}
});

test('every part draws the same pixels for the same seed', () => {
	for (const sample of SAMPLES) {
		assert.deepEqual(render(sample, 3), render(sample, 3), sample.label);
	}
});

test('parts that take a random stream use it', () => {
	for (const sample of SAMPLES.filter((s) => s.random)) {
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

test('parts refuse kinds and times they do not know', () => {
	const c = createCanvas(8, 8);
	const random = seededRandom(1);
	assert.throws(
		() => drawSky(c, { time: 'noon', horizon: 4, random }),
		/noon/
	);
	assert.throws(() => drawSea(c, { time: 'dusk', top: 4, random }), /dusk/);
	assert.throws(
		() => drawTerrain(c, { kind: 'swamp', top: 4, random }),
		/swamp/
	);
	assert.throws(
		() => drawBuilding(c, { kind: 'castle', x: 0, y: 7 }),
		/castle/
	);
});

test('every palette colour is lowercase #rrggbb', () => {
	for (const [name, colour] of Object.entries(PALETTE)) {
		assert.match(colour, /^#[0-9a-f]{6}$/, name);
	}
});
