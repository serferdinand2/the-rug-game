// Tests for each Arts & Architecture mat's features picture (#132): its cacti, lily ponds, beaches and cloud rims, on its buildable plots.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { PALETTE } from '../tools/art/palette.js';
import { FEATURE_BIOMES, reliefSize } from '../src/lib/art/relief.js';
import { isImpassable } from '../src/lib/art/paint/relief/footprint.js';
import { matData, matLayout } from '../tools/art/parts/capital-relief/index.js';
import {
	FEATURE_PAINTERS,
	drawFeatures,
} from '../tools/art/parts/capital-feature/index.js';

/** Each biome's features picture on its own mat, drawn once. */
const pictures = new Map(
	FEATURE_BIOMES.map((biome) => [
		biome,
		drawFeatures(
			/** @type {readonly string[]} */ (matLayout(biome)),
			biome,
			matData(biome)
		),
	])
);

/**
 * Each painted pixel of a picture, with the plot it lies on and its place inside that plot; null for a gap pixel.
 * @param {ReturnType<typeof drawFeatures>} canvas
 * @returns {Generator<{ x: number, y: number, r: number, c: number, px: number, py: number } | null>}
 */
function* painted(canvas) {
	for (let i = 0; i < canvas.p.length; i++) {
		if (canvas.p[i] === null) {
			continue;
		}
		const x = i % canvas.w;
		const y = (i / canvas.w) | 0;
		const px = x % 33;
		const py = y % 33;
		yield px > 31 || py > 31
			? null
			: { x, y, r: Math.floor(y / 33), c: Math.floor(x / 33), px, py };
	}
}

test('the features pictures are the four mats that print features', () => {
	assert.deepEqual(
		[...FEATURE_BIOMES],
		['archipelago', 'canyon', 'cloud-city', 'swamp']
	);
	assert.deepEqual(Object.keys(FEATURE_PAINTERS), [...FEATURE_BIOMES]);
	assert.ok(Object.isFrozen(FEATURE_PAINTERS));
});

test('drawFeatures refuses a biome without features', () => {
	assert.throws(
		() =>
			drawFeatures(
				/** @type {readonly string[]} */ (matLayout('mesa')),
				'mesa'
			),
		/No features for mesa/
	);
});

for (const biome of FEATURE_BIOMES) {
	test(`${biome}: the features picture is its mat's size, deterministic, in palette colours with ink only below full opacity`, () => {
		const layout = /** @type {readonly string[]} */ (matLayout(biome));
		const canvas = /** @type {ReturnType<typeof drawFeatures>} */ (
			pictures.get(biome)
		);
		const { w, h } = reliefSize(layout.length, layout[0].length);
		assert.deepEqual([canvas.w, canvas.h], [w, h]);
		assert.deepEqual(drawFeatures(layout, biome, matData(biome)), canvas);
		const colours = new Set(Object.values(PALETTE));
		for (let i = 0; i < canvas.p.length; i++) {
			const colour = canvas.p[i];
			if (colour === null) {
				continue;
			}
			assert.ok(colours.has(colour), `${colour} at ${i}`);
			if ((canvas.alpha?.[i] ?? 1) < 1) {
				assert.equal(colour, PALETTE.ink, `shadow at ${i}`);
			}
		}
	});
}

/**
 * Checks that a picture paints only inside the squares of the plots marked with a letter, and enough on each.
 * @param {string} biome
 * @param {string} mark - Such as 'C'
 * @param {number} least - The fewest pixels on each marked plot
 */
function onlyOnMarkedPlots(biome, mark, least) {
	const layout = /** @type {readonly string[]} */ (matLayout(biome));
	const canvas = /** @type {ReturnType<typeof drawFeatures>} */ (
		pictures.get(biome)
	);
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const p of painted(canvas)) {
		assert.ok(p, 'nothing in a gap');
		assert.equal(layout[p.r][p.c], mark, `pixel ${p.x},${p.y}`);
		counts.set(`${p.r},${p.c}`, (counts.get(`${p.r},${p.c}`) ?? 0) + 1);
	}
	const marked = layout.flatMap((row, r) =>
		[...row].flatMap((k, c) => (k === mark ? [`${r},${c}`] : []))
	);
	assert.equal(marked.length, 6);
	for (const key of marked) {
		assert.ok(
			(counts.get(key) ?? 0) >= least,
			`plot ${key}: ${counts.get(key)}`
		);
	}
}

test('canyon: a saguaro stands on each C plot and nowhere else', () => {
	onlyOnMarkedPlots('canyon', 'C', 40);
});

test('swamp: a lily pond lies on each L plot and nowhere else', () => {
	onlyOnMarkedPlots('swamp', 'L', 150);
});

test('archipelago: beaches lie only on island plots, along the sides and corners that face water', () => {
	const layout = /** @type {readonly string[]} */ (matLayout('archipelago'));
	const volcanoes = matData('archipelago').volcanoes ?? [];
	const water = (/** @type {number} */ r, /** @type {number} */ c) =>
		r >= 0 &&
		c >= 0 &&
		r < layout.length &&
		c < layout[0].length &&
		isImpassable(layout, r, c) &&
		!volcanoes.some(([vr, vc]) => vr === r && vc === c);
	const canvas = /** @type {ReturnType<typeof drawFeatures>} */ (
		pictures.get('archipelago')
	);
	/** @type {Map<string, number>} */
	const sides = new Map();
	for (const p of painted(canvas)) {
		assert.ok(p, 'nothing in a gap');
		assert.ok(
			!isImpassable(layout, p.r, p.c),
			`pixel ${p.x},${p.y} on land`
		);
		/** Each side facing water, by its distance from this pixel. */
		const near = [
			[water(p.r - 1, p.c), p.py, 'top'],
			[water(p.r + 1, p.c), 31 - p.py, 'bottom'],
			[water(p.r, p.c - 1), p.px, 'left'],
			[water(p.r, p.c + 1), 31 - p.px, 'right'],
		].filter(([wet]) => wet);
		let nearest = Math.min(Infinity, ...near.map(([, d]) => Number(d)));
		for (const [dr, dc, cx, cy] of [
			[-1, -1, 0, 0],
			[-1, 1, 31, 0],
			[1, -1, 0, 31],
			[1, 1, 31, 31],
		]) {
			if (water(p.r + dr, p.c + dc)) {
				// A corner's beach is measured from one pixel in, as the beach is drawn.
				nearest = Math.min(
					nearest,
					Math.hypot(p.px - cx, p.py - cy) - 1
				);
			}
		}
		assert.ok(
			nearest <= 5,
			`pixel ${p.x},${p.y} lies ${nearest} from the water`
		);
		for (const [, d, side] of near) {
			if (Number(d) <= 4) {
				const key = `${p.r},${p.c} ${side}`;
				sides.set(key, (sides.get(key) ?? 0) + 1);
			}
		}
	}
	for (let r = 0; r < layout.length; r++) {
		for (let c = 0; c < layout[0].length; c++) {
			if (isImpassable(layout, r, c)) {
				continue;
			}
			for (const [dr, dc, side] of [
				[-1, 0, 'top'],
				[1, 0, 'bottom'],
				[0, -1, 'left'],
				[0, 1, 'right'],
			]) {
				if (water(r + Number(dr), c + Number(dc))) {
					const n = sides.get(`${r},${c} ${side}`) ?? 0;
					assert.ok(n >= 20, `${r},${c} ${side}: ${n}`);
				}
			}
		}
	}
});

test('cloud-city: rims lie only along the edges between two clouds', () => {
	const layout = /** @type {readonly string[]} */ (matLayout('cloud-city'));
	const clouds = matData('cloud-city').clouds ?? [];
	const differs = (
		/** @type {number} */ r,
		/** @type {number} */ c,
		/** @type {number} */ r2,
		/** @type {number} */ c2
	) =>
		r2 >= 0 &&
		c2 >= 0 &&
		r2 < layout.length &&
		c2 < layout[0].length &&
		clouds[r][c] !== clouds[r2][c2];
	const canvas = /** @type {ReturnType<typeof drawFeatures>} */ (
		pictures.get('cloud-city')
	);
	let n = 0;
	for (const p of painted(canvas)) {
		assert.ok(p, 'nothing in a gap');
		n++;
		const onRim =
			(differs(p.r, p.c, p.r - 1, p.c) && p.py <= 3) ||
			(differs(p.r, p.c, p.r + 1, p.c) && 31 - p.py <= 3) ||
			(differs(p.r, p.c, p.r, p.c - 1) && p.px <= 3) ||
			(differs(p.r, p.c, p.r, p.c + 1) && 31 - p.px <= 3);
		assert.ok(onRim, `pixel ${p.x},${p.y}`);
	}
	assert.ok(n > 500, `${n} rim pixels`);
});
