// Tests for the joined relief of a capital layout's impassable plots (#82): its footprint, ground, parts and previews.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { CAPITAL_GRIDS } from '../tools/art/parts/capital-terrain.js';
import { RELIEF_BIOMES, reliefSize } from '../src/lib/art/relief.js';
import { createCanvas, mix, overlay, toSvg } from '../tools/art/painter.js';
import { PALETTE } from '../tools/art/palette.js';
import { drawNaturalGround } from '../tools/art/parts/capital-relief/ground.js';
import { paintMountains } from '../tools/art/parts/capital-relief/mountain.js';
import { paintForest } from '../tools/art/parts/capital-relief/forest.js';
import {
	footprint,
	impassableGroups,
	isImpassable,
} from '../tools/art/parts/capital-relief/footprint.js';
import {
	RELIEF_PAINTERS,
	SPECIMEN_LAYOUT,
	drawRelief,
	drawReliefPreview,
} from '../tools/art/parts/capital-relief/index.js';

const SPECIMEN = [
	'000000000',
	'010011000',
	'000000000',
	'010000100',
	'001001000',
	'000000000',
	'011000110',
	'010000110',
	'000000000',
];

test('impassable plots that touch by a side or a corner are one group', () => {
	assert.deepEqual(
		impassableGroups(SPECIMEN).map((g) => g.length),
		[1, 2, 2, 2, 3, 4]
	);
});

test('each base mat has the groups and corner joins its layout gives', () => {
	const expected = {
		mountain: [[13, 4, 2, 1, 1, 1], 0],
		wetland: [[8, 4, 3, 2, 2, 2, 1], 1],
		tropical: [[11, 5, 3, 1, 1, 1], 4],
		desert: [[10, 3, 3, 2, 2, 1, 1], 1],
		grassland: [[15, 4, 2, 1], 1],
		forest: [[19, 3], 6],
	};
	for (const mat of CAPITAL_MATS) {
		const [sizes, corners] = expected[mat.id];
		assert.deepEqual(
			impassableGroups(mat.grid)
				.map((g) => g.length)
				.sort((a, b) => b - a),
			sizes,
			mat.id
		);
		assert.equal(footprint(mat.grid).corners.length, corners, mat.id);
	}
});

test('a corner-only join is found on both diagonals', () => {
	assert.deepEqual(footprint(SPECIMEN).corners, [
		{ row: 3, col: 1, gx: 65, gy: 131, down: true },
		{ row: 3, col: 5, gx: 197, gy: 131, down: false },
	]);
});

test('a lone plot keeps a ground margin; joined plots run across their gap', () => {
	const fp = footprint(SPECIMEN);
	const at = (x, y) => fp.mask[y * fp.w + x];
	assert.equal(at(33 + 16, 33 + 16), 1); // the lone plot's middle
	assert.equal(at(33 + 0, 33 + 16), 0); // its open side's margin
	assert.equal(at(5 * 33 - 1, 33 + 16), 1); // the gap inside the side pair
	assert.equal(at(2 * 33 - 1, 33 + 16), 0); // the gap beside the lone plot
});

test('nothing reaches a buildable plot except within a corner patch', () => {
	for (const layout of [SPECIMEN, ...CAPITAL_MATS.map((m) => m.grid)]) {
		const fp = footprint(layout);
		for (let y = 0; y < fp.h; y++) {
			for (let x = 0; x < fp.w; x++) {
				const onPlot = x % 33 < 32 && y % 33 < 32;
				const open =
					onPlot &&
					!isImpassable(
						layout,
						Math.floor(y / 33),
						Math.floor(x / 33)
					);
				if (open && (fp.mask[y * fp.w + x] || fp.reach[y * fp.w + x])) {
					assert.ok(
						fp.corners.some(
							(c) => Math.hypot(x - c.gx, y - c.gy) <= 16
						),
						`${x},${y}`
					);
				}
				if (open) {
					assert.equal(fp.plots[y * fp.w + x], 0, `${x},${y}`);
				}
			}
		}
	}
});

test('the toolkit reads the base layouts from the engine', () => {
	for (const mat of CAPITAL_MATS) {
		assert.deepEqual(CAPITAL_GRIDS[mat.id], mat.grid);
	}
	assert.deepEqual(reliefSize(9, 9), { w: 296, h: 296 });
	assert.deepEqual(reliefSize(11, 9), { w: 296, h: 362 });
});

/**
 * Draws one natural-ground plot on its own canvas.
 * @param {'mountain' | 'forest'} biome
 * @param {number} variant
 */
function plot(biome, variant) {
	const canvas = createCanvas(32, 32);
	drawNaturalGround(canvas, { biome, variant });
	return canvas;
}

test('the natural ground fills its plot deterministically in palette colours', () => {
	const colours = new Set(Object.values(PALETTE));
	for (const biome of ['mountain', 'forest']) {
		for (let variant = 0; variant < 8; variant++) {
			const a = plot(biome, variant);
			assert.ok(
				a.p.every((c) => c !== null),
				`${biome} ${variant}`
			);
			assert.ok(
				a.p.every((c) => colours.has(c)),
				`${biome} ${variant}`
			);
			assert.deepEqual(a, plot(biome, variant));
		}
	}
});

test('the natural ground paints at an offset and stays inside its plot', () => {
	const canvas = createCanvas(40, 40);
	drawNaturalGround(canvas, { biome: 'forest', variant: 3, x: 4, y: 5 });
	for (let y = 0; y < 40; y++) {
		for (let x = 0; x < 40; x++) {
			const inPlot = x >= 4 && x < 36 && y >= 5 && y < 37;
			assert.equal(canvas.p[y * 40 + x] !== null, inPlot, `${x},${y}`);
		}
	}
});

test('its eight variants differ', () => {
	for (const biome of ['mountain', 'forest']) {
		const svgs = new Set();
		for (let variant = 0; variant < 8; variant++) {
			svgs.add(toSvg(plot(biome, variant)));
		}
		assert.equal(svgs.size, 8, biome);
	}
});

/**
 * Paints the mountains of a layout.
 * @param {readonly string[]} layout
 * @returns {{ fp: ReturnType<typeof footprint>, canvas: ReturnType<typeof createCanvas>  }}
 */
function mountains(layout) {
	const fp = footprint(layout);
	const canvas = createCanvas(fp.w, fp.h);
	paintMountains(canvas, fp, 5);
	return { fp, canvas };
}

const MOUNTAIN_LAYOUT = CAPITAL_GRIDS.mountain;

test('mountains are deterministic and stay within the reach', () => {
	const a = mountains(MOUNTAIN_LAYOUT);
	const b = mountains(MOUNTAIN_LAYOUT);
	assert.deepEqual(a.canvas.p, b.canvas.p);
	for (let i = 0; i < a.canvas.p.length; i++) {
		if (!a.fp.reach[i]) {
			assert.equal(a.canvas.p[i], null, `pixel ${i}`);
		}
	}
});

test("every impassable plot's middle is mountain", () => {
	for (const layout of [MOUNTAIN_LAYOUT, SPECIMEN]) {
		const { fp, canvas } = mountains(layout);
		for (let r = 0; r < layout.length; r++) {
			for (let c = 0; c < layout[0].length; c++) {
				if (!isImpassable(layout, r, c)) {
					continue;
				}
				let set = 0;
				for (let y = 8; y < 24; y++) {
					for (let x = 8; x < 24; x++) {
						const i = (r * 33 + y) * fp.w + c * 33 + x;
						if (
							canvas.p[i] !== null &&
							(canvas.alpha?.[i] ?? 1) === 1
						) {
							set++;
						}
					}
				}
				assert.ok(set >= 0.6 * 256, `plot ${r},${c}: ${set}/256`);
			}
		}
	}
});

test('mountains use palette colours, and ink only for shadows below full opacity', () => {
	const colours = new Set(Object.values(PALETTE));
	const { canvas } = mountains(MOUNTAIN_LAYOUT);
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

test('a corner-only join stands a peak over the corner', () => {
	const { fp, canvas } = mountains(SPECIMEN);
	assert.ok(fp.corners.length > 0);
	for (const { gx, gy } of fp.corners) {
		const i = (gy - 4) * fp.w + gx;
		assert.notEqual(canvas.p[i], null, `corner ${gx},${gy}`);
		assert.equal(canvas.alpha?.[i] ?? 1, 1, `corner ${gx},${gy} opaque`);
	}
});

/**
 * Paints the forest of a layout.
 * @param {readonly string[]} layout
 * @returns {{ fp: ReturnType<typeof footprint>, canvas: ReturnType<typeof createCanvas> }}
 */
function forest(layout) {
	const fp = footprint(layout);
	const canvas = createCanvas(fp.w, fp.h);
	paintForest(canvas, fp, 5);
	return { fp, canvas };
}

const FOREST_LAYOUT = CAPITAL_GRIDS.forest;

test('forests are deterministic and stay within the reach', () => {
	const a = forest(FOREST_LAYOUT);
	const b = forest(FOREST_LAYOUT);
	assert.deepEqual(a.canvas.p, b.canvas.p);
	for (let i = 0; i < a.canvas.p.length; i++) {
		if (!a.fp.reach[i]) {
			assert.equal(a.canvas.p[i], null, `pixel ${i}`);
		}
	}
});

test("every impassable plot's middle is forest", () => {
	for (const layout of [FOREST_LAYOUT, SPECIMEN]) {
		const { fp, canvas } = forest(layout);
		for (let r = 0; r < layout.length; r++) {
			for (let c = 0; c < layout[0].length; c++) {
				if (!isImpassable(layout, r, c)) {
					continue;
				}
				let set = 0;
				for (let y = 8; y < 24; y++) {
					for (let x = 8; x < 24; x++) {
						const i = (r * 33 + y) * fp.w + c * 33 + x;
						if (
							canvas.p[i] !== null &&
							(canvas.alpha?.[i] ?? 1) === 1
						) {
							set++;
						}
					}
				}
				assert.ok(set >= 0.6 * 256, `plot ${r},${c}: ${set}/256`);
			}
		}
	}
});

test('forests use palette colours, and ink only for shadows below full opacity', () => {
	const colours = new Set(Object.values(PALETTE));
	const { canvas } = forest(FOREST_LAYOUT);
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

test('a corner-only join carries a clump of trees over the corner', () => {
	const { fp, canvas } = forest(SPECIMEN);
	assert.ok(fp.corners.length > 0);
	for (const { gx, gy } of fp.corners) {
		const i = gy * fp.w + gx;
		assert.notEqual(canvas.p[i], null, `corner ${gx},${gy}`);
		assert.equal(canvas.alpha?.[i] ?? 1, 1, `corner ${gx},${gy} opaque`);
	}
});

test('every relief biome has a painter', () => {
	assert.deepEqual(Object.keys(RELIEF_PAINTERS), [...RELIEF_BIOMES]);
	assert.ok(Object.isFrozen(RELIEF_PAINTERS));
});

test('the relief of a mat is its size and stays within its reach', () => {
	for (const id of ['mountain', 'forest']) {
		const grid = CAPITAL_GRIDS[id];
		const relief = drawRelief(grid, id);
		assert.deepEqual([relief.w, relief.h], [296, 296], id);
		const { reach } = footprint(grid);
		for (let i = 0; i < relief.p.length; i++) {
			if (relief.p[i] !== null) {
				assert.equal(reach[i], 1, `${id}: pixel ${i}`);
			}
		}
	}
});

test('a biome without a painter has no relief', () => {
	assert.throws(
		() => drawRelief(CAPITAL_GRIDS.wetland, 'wetland'),
		/No relief for wetland/
	);
});

test('a preview is opaque everywhere, with ink in the gaps between buildable plots', () => {
	assert.deepEqual(SPECIMEN_LAYOUT, SPECIMEN);
	assert.ok(Object.isFrozen(SPECIMEN_LAYOUT));
	const preview = drawReliefPreview(SPECIMEN_LAYOUT, 'forest');
	assert.deepEqual([preview.w, preview.h], [296, 296]);
	for (let i = 0; i < preview.p.length; i++) {
		assert.notEqual(preview.p[i], null, `pixel ${i}`);
		assert.equal(preview.alpha?.[i] ?? 1, 1, `pixel ${i} opaque`);
	}
	// The gap between the top-left plot and the one to its right, both buildable.
	assert.equal(preview.p[16 * preview.w + 32], PALETTE.ink);
});

/**
 * Whether a gap pixel lies between two impassable plots joined by a side: inside a group, where the ground runs on.
 * @param {readonly string[]} layout
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inSideGap(layout, x, y) {
	const r = Math.floor(y / 33);
	const c = Math.floor(x / 33);
	const across = x % 33 === 32;
	const down = y % 33 === 32;
	if (across === down) {
		return false;
	}
	return (
		isImpassable(layout, r, c) &&
		isImpassable(layout, across ? r : r + 1, across ? c + 1 : c)
	);
}

test("a preview runs its ground across a group's gaps where the relief leaves them bare", () => {
	for (const biome of ['mountain', 'forest']) {
		const relief = drawRelief(SPECIMEN_LAYOUT, biome);
		const preview = drawReliefPreview(SPECIMEN_LAYOUT, biome);
		let bare = 0;
		for (let y = 0; y < preview.h; y++) {
			for (let x = 0; x < preview.w; x++) {
				const i = y * preview.w + x;
				if (relief.p[i] === null && inSideGap(SPECIMEN_LAYOUT, x, y)) {
					bare++;
					assert.notEqual(
						preview.p[i],
						PALETTE.ink,
						`${biome} ${x},${y}`
					);
				}
			}
		}
		assert.ok(bare > 0, `${biome}: the relief covers every gap`);
	}
});

test('overlay blends a shadow and replaces an opaque pixel', () => {
	const base = createCanvas(2, 1);
	base.p.fill(PALETTE.grass);
	const top = createCanvas(2, 1);
	top.p = [PALETTE.ink, PALETTE.snow];
	top.alpha = [0.5, 1];
	overlay(base, top);
	assert.deepEqual(base.p, [
		mix(PALETTE.grass, PALETTE.ink, 0.5),
		PALETTE.snow,
	]);
	assert.equal(base.alpha, undefined);
});

test('overlay leaves a pixel under an empty one, keeps a shadow over nothing, and refuses another size', () => {
	const base = createCanvas(2, 1);
	base.p[0] = PALETTE.grass;
	const top = createCanvas(2, 1);
	top.p[1] = PALETTE.ink;
	top.alpha = [1, 0.25];
	overlay(base, top);
	assert.deepEqual(base.p, [PALETTE.grass, PALETTE.ink]);
	assert.deepEqual(base.alpha, [1, 0.25]);
	assert.throws(() => overlay(base, createCanvas(1, 2)), /same size/);
});

test("the Architects' cube is a 32×32 piece in palette colours with a transparent edge", async () => {
	const { draw } =
		await import('../tools/art/drawings/piece/architects-cube.js');
	const canvas = draw();
	assert.equal(canvas.w, 32);
	assert.equal(canvas.h, 32);
	const colours = new Set(Object.values(PALETTE));
	for (let y = 0; y < 32; y++) {
		for (let x = 0; x < 32; x++) {
			const colour = canvas.p[y * 32 + x];
			if (x === 0 || y === 0 || x === 31 || y === 31) {
				assert.equal(colour, null, `border ${x},${y}`);
			} else if (colour !== null) {
				assert.ok(colours.has(colour), `${x},${y} ${colour}`);
			}
		}
	}
	assert.notEqual(canvas.p[16 * 32 + 16], null);
});
