// Tests for the joined relief of a capital layout's impassable plots (#82): its footprint, ground, parts and previews.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { CAPITAL_GRIDS } from '../tools/art/parts/capital-terrain.js';
import { RELIEF_BIOMES, reliefSize } from '../src/lib/art/relief.js';
import { createCanvas, mix, overlay, toSvg } from '../tools/art/painter.js';
import { PALETTE } from '../tools/art/palette.js';
import { drawNaturalGround } from '../src/lib/art/paint/relief/ground.js';
import {
	distanceInside,
	footprint,
	impassableGroups,
	isImpassable,
	withCornerPatches,
} from '../src/lib/art/paint/relief/footprint.js';
import { cast } from '../src/lib/art/paint/relief/canvas.js';
import { peakRows, peakShape } from '../src/lib/art/paint/relief/mountain.js';
import {
	RELIEF_PAINTERS,
	SPECIMEN_DATA,
	SPECIMEN_LAYOUT,
	drawRelief,
	drawReliefPreview,
	groundKey,
	matData,
	matLayout,
} from '../tools/art/parts/capital-relief/index.js';
import { drawFloor } from '../tools/art/parts/capital-relief/floor.js';
import {
	cloudRamp,
	cloudTint,
	puffPainter,
} from '../tools/art/parts/capital-relief/cloud-city.js';
import {
	RED_ROCK as RED_ROCK_STYLE,
	rockShape,
} from '../tools/art/parts/capital-relief/rock.js';

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

test('distanceInside counts the steps from each pixel to the nearest one outside its mask', () => {
	const w = 9;
	const h = 7;
	const mask = new Uint8Array(w * h);
	for (let y = 1; y < 6; y++) {
		for (let x = 1; x < 8; x++) {
			mask[y * w + x] = 1;
		}
	}
	const depth = distanceInside(mask, w, h);
	assert.equal(depth[0], 0); // outside
	assert.equal(depth[1 * w + 1], 1); // the block's corner
	assert.equal(depth[3 * w + 1], 1); // its left side
	assert.equal(depth[2 * w + 4], 2);
	assert.equal(depth[3 * w + 4], 3); // its middle
	// The canvas's edge counts as outside.
	assert.deepEqual(
		[...distanceInside(new Uint8Array(3).fill(1), 3, 1)],
		[1, 1, 1]
	);
});

test('a corner patch widens the floor round each corner join', () => {
	const fp = footprint(SPECIMEN);
	const area = withCornerPatches(fp, 7);
	for (const { gx, gy } of fp.corners) {
		assert.equal(fp.mask[(gy - 7) * fp.w + gx], 0, `${gx},${gy}`);
		assert.equal(area[(gy - 7) * fp.w + gx], 1, `${gx},${gy}`);
		assert.equal(area[(gy - 8) * fp.w + gx], 0, `${gx},${gy}`);
	}
	assert.ok(fp.mask.every((v, i) => !v || area[i]));
	assert.notEqual(area, fp.mask);
});

test('a cast shadow is translucent ink on an empty pixel and one tone darker on a painted one', () => {
	const canvas = createCanvas(3, 1);
	canvas.p[1] = PALETTE.grass;
	canvas.p[2] = PALETTE.snow;
	const darker = { [PALETTE.grass]: PALETTE.grassShade };
	for (let x = -1; x <= 3; x++) {
		cast(canvas, x, 0, 0.25, darker);
	}
	cast(canvas, 0, 0, 0.5, darker); // a shadow already cast stays as it is
	assert.deepEqual(canvas.p, [PALETTE.ink, PALETTE.grassShade, PALETTE.snow]);
	assert.deepEqual(canvas.alpha, [0.25, 1, 1]);
});

test('the toolkit reads the base layouts from the engine', () => {
	for (const mat of CAPITAL_MATS) {
		assert.deepEqual(CAPITAL_GRIDS[mat.id], mat.grid);
	}
	assert.deepEqual(reliefSize(9, 9), { w: 296, h: 296 });
	assert.deepEqual(reliefSize(11, 9), { w: 296, h: 362 });
});

test("matLayout gives a base or an advanced mat's printed layout", () => {
	assert.deepEqual(matLayout('desert'), CAPITAL_GRIDS.desert);
	assert.equal(matLayout('archipelago')?.length, 11);
	assert.equal(matLayout('tundra'), undefined);
});

test('matData gives the volcanoes and the clouds, and nothing for other mats', () => {
	assert.deepEqual(matData('archipelago').volcanoes, [
		[4, 3],
		[5, 3],
		[9, 2],
	]);
	assert.deepEqual(
		matData('cloud-city').tints,
		[0, 1, 2, 3, 0, 1, 3, 2, 0, 0]
	);
	assert.equal(matData('cloud-city').clouds?.length, 9);
	assert.deepEqual(matData('mesa'), {});
	assert.deepEqual(SPECIMEN_DATA.archipelago.volcanoes, [[1, 1]]);
	assert.deepEqual(SPECIMEN_DATA['cloud-city'], matData('cloud-city'));
});

test('a flat peak has a wider summit', () => {
	const width = (/** @type {number[]} */ [, a, b]) => b - a + 1;
	const spec = { bx: 50, by: 60, hw: 10, ph: 12 };
	assert.ok(width(peakRows(peakShape(spec, 5))[0]) <= 3);
	assert.ok(width(peakRows(peakShape(spec, 5, { flat: 3 }))[0]) >= 6);
});

test('a hoodoo is a cap rock on a thin neck', () => {
	const { rows } = rockShape(
		{ kind: 'hoodoo', bx: 20, by: 30, hw: 4, ph: 12 },
		5,
		RED_ROCK_STYLE
	);
	const width = (/** @type {number[]} */ [, a, b]) => b - a + 1;
	assert.ok(width(rows[0]) >= 4, 'cap');
	assert.ok(width(rows[Math.floor(rows.length / 2)]) <= 3, 'neck');
	assert.ok(width(rows[rows.length - 1]) >= 6, 'foot');
});

/**
 * Draws one natural-ground plot on its own canvas.
 * @param {string} biome
 * @param {number} variant
 */
function plot(biome, variant) {
	const canvas = createCanvas(32, 32);
	drawNaturalGround(canvas, { biome, variant });
	return canvas;
}

/** Every natural ground: one per relief biome, the five other Arts & Architecture biomes, and Cloud City's four tints (#132). */
const GROUND_KEYS = [
	// Cloud City's ground is one per cloud tint, below.
	...RELIEF_BIOMES.filter((biome) => biome !== 'cloud-city'),
	...['archipelago', 'canyon', 'cavern', 'mesa', 'swamp'].filter(
		(biome) => !RELIEF_BIOMES.includes(biome)
	),
	'cloud-city-white',
	'cloud-city-grey',
	'cloud-city-tan',
	'cloud-city-cream',
];

for (const biome of GROUND_KEYS) {
	test(`${biome}: the natural ground fills its plot deterministically in palette colours`, () => {
		const colours = new Set(Object.values(PALETTE));
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
	});

	test(`${biome}: its eight ground variants differ`, () => {
		const svgs = new Set();
		for (let variant = 0; variant < 8; variant++) {
			svgs.add(toSvg(plot(biome, variant)));
		}
		assert.equal(svgs.size, 8, biome);
	});
}

test("groundKey picks a Cloud City plot's ground by its cloud's tint", () => {
	const mat = matData('cloud-city');
	assert.equal(groundKey('cloud-city', 0, 0, mat), 'cloud-city-grey');
	assert.equal(groundKey('cloud-city', 0, 3, mat), 'cloud-city-tan');
	assert.equal(groundKey('cloud-city', 0, 7, mat), 'cloud-city-cream');
	assert.equal(groundKey('cloud-city', 2, 2, mat), 'cloud-city-white');
	assert.equal(groundKey('canyon', 0, 0, {}), 'canyon');
});

test("the Canyon's earth is paler than the Mesa's soil", () => {
	/** The share of a ground's pixels in its pale tones, over its eight variants. */
	const pale = (/** @type {string} */ biome) => {
		let n = 0;
		for (let variant = 0; variant < 8; variant++) {
			n += plot(biome, variant).p.filter(
				(c) => c === PALETTE.mesaSoilLight || c === PALETTE.sandLight
			).length;
		}
		return n / (8 * 32 * 32);
	};
	assert.ok(
		pale('canyon') > pale('mesa'),
		`${pale('canyon')} > ${pale('mesa')}`
	);
});

test('a biome without a natural ground has none', () => {
	assert.throws(
		() =>
			drawNaturalGround(createCanvas(32, 32), {
				biome: 'tundra',
				variant: 0,
			}),
		/No natural ground for tundra/
	);
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

/**
 * Paints a biome's relief into a layout's footprint with its painter.
 * @param {readonly string[]} layout
 * @param {string} biome
 * @returns {{ fp: ReturnType<typeof footprint>, canvas: ReturnType<typeof createCanvas> }}
 */
function paint(layout, biome, mat = {}) {
	const fp = footprint(layout);
	const canvas = createCanvas(fp.w, fp.h);
	RELIEF_PAINTERS[biome](canvas, fp, 5, mat);
	return { fp, canvas };
}

/**
 * What a relief's mat prints beyond its plots: its own mat's data, or the specimen's.
 * @param {string} biome
 * @param {'mat' | 'specimen'} which
 */
function dataOf(biome, which) {
	return which === 'mat' ? matData(biome) : (SPECIMEN_DATA[biome] ?? {});
}

/**
 * The layout a relief is painted from: its own mat's, or the specimen.
 * @param {string} biome
 * @param {'mat' | 'specimen'} which
 * @returns {readonly string[]}
 */
function layoutOf(biome, which) {
	return which === 'mat'
		? /** @type {readonly string[]} */ (matLayout(biome))
		: SPECIMEN;
}

/** Paintings already made, so each relief is painted once per layout: a Mountain takes over half a second. */
const painted = new Map();

/**
 * The relief of a biome on its own mat's layout or on the specimen, painted once.
 * @param {string} biome
 * @param {'mat' | 'specimen'} which
 */
function relief(biome, which) {
	const key = `${biome} ${which}`;
	if (!painted.has(key)) {
		painted.set(
			key,
			paint(layoutOf(biome, which), biome, dataOf(biome, which))
		);
	}
	return painted.get(key);
}

/**
 * Whether a relief pixel is painted at full opacity.
 * @param {ReturnType<typeof createCanvas>} canvas
 * @param {number} i
 */
function opaque(canvas, i) {
	return canvas.p[i] !== null && (canvas.alpha?.[i] ?? 1) === 1;
}

for (const biome of RELIEF_BIOMES) {
	test(`${biome}: the relief is deterministic and stays within the reach`, () => {
		for (const which of /** @type {const} */ (['mat', 'specimen'])) {
			const a = relief(biome, which);
			const b = paint(
				layoutOf(biome, which),
				biome,
				dataOf(biome, which)
			);
			assert.deepEqual(a.canvas.p, b.canvas.p, which);
			assert.deepEqual(a.canvas.alpha, b.canvas.alpha, which);
			for (let i = 0; i < a.canvas.p.length; i++) {
				if (!a.fp.reach[i]) {
					assert.equal(a.canvas.p[i], null, `${which}: pixel ${i}`);
				}
			}
		}
	});

	test(`${biome}: every impassable plot's middle is covered`, () => {
		for (const which of /** @type {const} */ (['mat', 'specimen'])) {
			const layout = layoutOf(biome, which);
			const { fp, canvas } = relief(biome, which);
			for (let r = 0; r < layout.length; r++) {
				for (let c = 0; c < layout[0].length; c++) {
					if (!isImpassable(layout, r, c)) {
						continue;
					}
					let set = 0;
					for (let y = 8; y < 24; y++) {
						for (let x = 8; x < 24; x++) {
							if (
								opaque(canvas, (r * 33 + y) * fp.w + c * 33 + x)
							) {
								set++;
							}
						}
					}
					assert.ok(
						set >= 0.6 * 256,
						`${which} plot ${r},${c}: ${set}/256`
					);
				}
			}
		}
	});

	test(`${biome}: the relief uses palette colours, and ink only for shadows below full opacity`, () => {
		const colours = new Set(Object.values(PALETTE));
		for (const which of /** @type {const} */ (['mat', 'specimen'])) {
			const { canvas } = relief(biome, which);
			for (let i = 0; i < canvas.p.length; i++) {
				const colour = canvas.p[i];
				if (colour === null) {
					continue;
				}
				assert.ok(colours.has(colour), `${which}: ${colour} at ${i}`);
				if ((canvas.alpha?.[i] ?? 1) < 1) {
					assert.equal(
						colour,
						PALETTE.ink,
						`${which}: shadow at ${i}`
					);
				}
			}
		}
	});

	test(`${biome}: a piece stands over every corner-only join, on the specimen and on its own mat`, () => {
		assert.ok(relief(biome, 'specimen').fp.corners.length > 0);
		for (const which of /** @type {const} */ (['specimen', 'mat'])) {
			const { fp, canvas } = relief(biome, which);
			for (const { gx, gy } of fp.corners) {
				let near = false;
				for (let dy = -4; dy <= 4 && !near; dy++) {
					for (let dx = -4; dx <= 4 && !near; dx++) {
						near = opaque(canvas, (gy + dy) * fp.w + gx + dx);
					}
				}
				assert.ok(near, `${which}: corner ${gx},${gy}`);
			}
		}
	});

	test(`${biome}: the relief of its mat is the mat's size and stays within its reach`, () => {
		const grid = layoutOf(biome, 'mat');
		const drawn = drawRelief(grid, biome, matData(biome));
		const { w, h } = reliefSize(grid.length, grid[0].length);
		assert.deepEqual([drawn.w, drawn.h], [w, h]);
		assert.deepEqual(drawn.p, relief(biome, 'mat').canvas.p);
		const { reach } = footprint(grid);
		for (let i = 0; i < drawn.p.length; i++) {
			if (drawn.p[i] !== null) {
				assert.equal(reach[i], 1, `pixel ${i}`);
			}
		}
	});
}

test('the Canyon gorge carries a river along its middle', () => {
	const { fp, canvas } = relief('canyon', 'mat');
	const water = new Set([
		PALETTE.daySea2,
		PALETTE.daySea3,
		PALETTE.dayWaveDeep,
	]);
	const depth = distanceInside(fp.mask, fp.w, fp.h);
	let river = 0;
	for (let i = 0; i < canvas.p.length; i++) {
		if (water.has(canvas.p[i])) {
			river++;
			assert.ok(
				depth[i] >= 3,
				`river at ${i} lies ${depth[i]} from the rim`
			);
		}
	}
	assert.ok(river >= 60, `${river} river pixels`);
});

test('the Canyon is cut into the plain, not raised on it', () => {
	const { canvas } = relief('canyon', 'mat');
	let ink = 0;
	let painted = 0;
	for (let i = 0; i < canvas.p.length; i++) {
		if (opaque(canvas, i)) {
			painted++;
			ink += canvas.p[i] === PALETTE.ink ? 1 : 0;
		}
	}
	assert.ok(ink < 0.02 * painted, `${ink} of ${painted} pixels are outline`);
});

test("the Cavern is cave rock with stalagmites and glowing crystals, not the Mountain's peaks", () => {
	const colours = new Set(relief('cavern', 'mat').canvas.p);
	assert.ok(
		colours.has(PALETTE.teal) || colours.has(PALETTE.tealLight),
		'crystals'
	);
	assert.ok(colours.has(PALETTE.stoneLight), 'lit rock');
	for (const name of ['snow', 'snowShade']) {
		assert.ok(!colours.has(PALETTE[name]), name);
	}
	for (const [name, colour] of Object.entries(PALETTE)) {
		if (name.startsWith('alpineMeadow')) {
			assert.ok(!colours.has(colour), name);
		}
	}
});

test('the Swamp is black water with bleached dead trees', () => {
	const { canvas } = relief('swamp', 'mat');
	const water = new Set([
		PALETTE.quagWater,
		PALETTE.quagWaterDeep,
		PALETTE.swampWaterDeep,
	]);
	let wet = 0;
	let painted = 0;
	for (let i = 0; i < canvas.p.length; i++) {
		if (opaque(canvas, i)) {
			painted++;
			wet += water.has(canvas.p[i]) ? 1 : 0;
		}
	}
	assert.ok(wet >= 0.3 * painted, `${wet} of ${painted} pixels are water`);
	const colours = new Set(canvas.p);
	assert.ok(colours.has(PALETTE.creamShade), 'lit dead wood');
	assert.ok(
		colours.has(PALETTE.quagReed) || colours.has(PALETTE.swampReed),
		'reeds'
	);
});

test("the Mesa is red rock and red soil, not the Desert's sandstone", () => {
	const colours = new Set(relief('mesa', 'mat').canvas.p);
	for (const name of ['sand', 'sandLight', 'sandShade']) {
		assert.ok(!colours.has(PALETTE[name]), name);
	}
	assert.ok(colours.has(PALETTE.mesaRock), 'red rock');
	assert.ok(colours.has(PALETTE.mesaSoil), 'red soil');
});

test("the Mesa's cliffs show its painted layers", () => {
	const layers = [
		'plasterShade',
		'mesaRockLight',
		'creamShade',
		'mesaRock',
		'mesaStrata',
		'mesaRockShade',
		'brickRedShade',
	].map((name) => PALETTE[name]);
	for (const [name, colour] of Object.entries(PALETTE)) {
		if (name.startsWith('strata')) {
			layers.push(colour);
		}
	}
	const colours = new Set(relief('mesa', 'mat').canvas.p);
	const used = layers.filter((c) => colours.has(c)).length;
	assert.ok(used >= 5, `${used} layer tones`);
});

test('the Mesa is one tableland per group', () => {
	const { fp, canvas } = relief('mesa', 'mat');
	for (let c = 1; c <= 8; c++) {
		assert.ok(opaque(canvas, 16 * fp.w + c * 33 + 16), `plot 0,${c}`);
	}
	for (let x = 40; x <= 280; x++) {
		let any = false;
		for (let y = 0; y < 32 && !any; y++) {
			any = opaque(canvas, y * fp.w + x);
		}
		assert.ok(any, `column ${x}`);
	}
});

test("the Archipelago's volcano plots are land and its other impassable plots are sea", () => {
	const layout = layoutOf('archipelago', 'mat');
	const { fp, canvas } = relief('archipelago', 'mat');
	const sea = new Set([PALETTE.daySea1, PALETTE.daySea2, PALETTE.daySea3]);
	const water = new Set([
		...sea,
		PALETTE.dayWave,
		PALETTE.dayWaveDeep,
		PALETTE.foam,
	]);
	const volcanoes = matData('archipelago').volcanoes ?? [];
	/** How many pixels of a plot's square, from `from` to `to` on each side, have one of the colours. */
	const count = (
		/** @type {number} */ r,
		/** @type {number} */ c,
		/** @type {Set<string | null>} */ colours,
		/** @type {number} */ from,
		/** @type {number} */ to
	) => {
		let n = 0;
		for (let y = from; y < to; y++) {
			for (let x = from; x < to; x++) {
				n += colours.has(canvas.p[(r * 33 + y) * fp.w + c * 33 + x])
					? 1
					: 0;
			}
		}
		return n;
	};
	for (let r = 0; r < layout.length; r++) {
		for (let c = 0; c < layout[0].length; c++) {
			if (!isImpassable(layout, r, c)) {
				continue;
			}
			if (volcanoes.some(([vr, vc]) => vr === r && vc === c)) {
				assert.equal(count(r, c, sea, 12, 20), 0, `volcano ${r},${c}`);
			} else {
				// Over the whole plot, as an islet may stand in its middle.
				const wet = count(r, c, water, 0, 32);
				assert.ok(wet > 512, `sea ${r},${c}: ${wet}/1024`);
			}
		}
	}
});

test("the Archipelago's relief is 296×362", () => {
	const drawn = drawRelief(
		layoutOf('archipelago', 'mat'),
		'archipelago',
		matData('archipelago')
	);
	assert.deepEqual([drawn.w, drawn.h], [296, 362]);
});

/** Each cloud tint's own colours, the ones no other tint shares, by tint index (#132). */
const TINT_OWN = [
	[PALETTE.cloudWhiteBase, PALETTE.cloudShade, PALETTE.cloudWhiteRim],
	[
		PALETTE.cloudGreyLight,
		PALETTE.cloudGreyBase,
		PALETTE.cloudGreyDark,
		PALETTE.cloudGreyRim,
	],
	[PALETTE.cloudTanBase, PALETTE.cloudTanDark, PALETTE.cloudTanRim],
	[PALETTE.cloudCreamBase, PALETTE.creamShade, PALETTE.cloudCreamRim],
];

test('each Cloud City puff takes the tint of one cloud', () => {
	const layout = layoutOf('cloud-city', 'mat');
	const { clouds = [], tints = [] } = matData('cloud-city');
	const used = new Set();
	for (let r = 0; r < layout.length; r++) {
		for (let c = 0; c < layout[0].length; c++) {
			if (isImpassable(layout, r, c)) {
				used.add(tints[Number(clouds[r][c])]);
			}
		}
	}
	const colours = new Set(relief('cloud-city', 'mat').canvas.p);
	TINT_OWN.forEach((own, tint) => {
		const shown = own.some((c) => colours.has(c));
		assert.equal(shown, used.has(tint), `tint ${tint}`);
	});
	// One puff where two clouds meet, at the 5,6 corner join's gap pixel: a tan cloud and a white one.
	const fp = footprint(layout);
	const corner = fp.corners.find((j) => j.row === 5 && j.col === 6);
	assert.ok(corner);
	const tintAt = cloudTint(fp, matData('cloud-city'));
	const canvas = createCanvas(fp.w, fp.h);
	const everywhere = new Uint8Array(fp.w * fp.h).fill(1);
	const puff = { cx: corner.gx, cy: corner.gy, r: 6, ok: everywhere };
	puffPainter(canvas, [puff], tintAt)(puff);
	const ramp = new Set(cloudRamp(tintAt(corner.gx, corner.gy)));
	let painted = 0;
	for (const c of canvas.p) {
		if (c !== null) {
			painted++;
			assert.ok(ramp.has(c), `${c} is not in the puff's own tint`);
		}
	}
	assert.ok(painted > 60, `${painted} pixels`);
});

test("Cloud City's pillars are stone with pines on top", () => {
	const colours = new Set(relief('cloud-city', 'mat').canvas.p);
	assert.ok(colours.has(PALETTE.stoneLight), 'lit stone');
	assert.ok(colours.has(PALETTE.pine), 'pines');
});

/**
 * Each Arts & Architecture biome's corner-piece colours: the colours its corner pieces paint and its floor never
 * does (#132). A corner join's gorge, strait, rock, tree or puffs must show them in the corner patch.
 */
const CORNER_PIECES = {
	canyon: [
		'mesaStrata',
		'mesaRockLight',
		'mesaRock',
		'mesaRockShade',
		'mesaRockDark',
		'night',
		'daySea3',
		'dayWaveDeep',
	],
	cavern: [
		'stoneLight',
		'stone',
		'stoneMid',
		'stoneShade',
		'roofShade',
		'ink',
	],
	swamp: ['creamShade', 'plasterShade', 'timberShade', 'wood'],
	mesa: [
		'mesaStrata',
		'mesaRockLight',
		'mesaRock',
		'mesaRockShade',
		'mesaRockDark',
		'ink',
	],
	archipelago: [
		'daySea1',
		'daySea2',
		'daySea3',
		'dayWave',
		'dayWaveDeep',
		'foam',
	],
	'cloud-city': [
		'white',
		'creamLight',
		'cloudGreyLight',
		'cloudWhiteRim',
		'cloudGreyRim',
		'cloudTanRim',
		'cloudCreamRim',
		'stoneLight',
		'stone',
		'pine',
	],
};

/**
 * How many opaque pixels of the given colours each corner join shows outside the floor's footprint, within 12 px
 * of its gap pixel: there, only a corner piece paints.
 * @param {ReturnType<typeof footprint>} fp
 * @param {ReturnType<typeof createCanvas>} canvas
 * @param {Set<string | null>} colours
 * @returns {number[]} One count per corner join
 */
function cornerPieces(fp, canvas, colours) {
	return fp.corners.map(({ gx, gy }) => {
		let n = 0;
		for (let dy = -12; dy <= 12; dy++) {
			for (let dx = -12; dx <= 12; dx++) {
				const x = gx + dx;
				const y = gy + dy;
				const i = y * fp.w + x;
				if (
					dx * dx + dy * dy <= 144 &&
					x >= 0 &&
					y >= 0 &&
					x < fp.w &&
					y < fp.h &&
					fp.reach[i] &&
					!fp.mask[i] &&
					opaque(canvas, i) &&
					colours.has(canvas.p[i])
				) {
					n++;
				}
			}
		}
		return n;
	});
}

test('the corner-piece check finds nothing on a relief that is only its floor (#132)', () => {
	const fp = footprint(SPECIMEN);
	const canvas = createCanvas(fp.w, fp.h);
	drawFloor(canvas, withCornerPatches(fp, 12), 5, () => PALETTE.mesaRock);
	const colours = new Set(CORNER_PIECES.mesa.map((name) => PALETTE[name]));
	// The floor reaches the corner patches, but a floor is not a piece: here it is painted in rock colours, and
	// still the check counts only what lies outside the footprint's floor area.
	assert.ok(cornerPieces(fp, canvas, colours).some((n) => n > 0));
	const floorOnly = createCanvas(fp.w, fp.h);
	drawFloor(floorOnly, fp.mask, 5, () => PALETTE.mesaRock);
	assert.deepEqual(
		cornerPieces(fp, floorOnly, colours),
		fp.corners.map(() => 0)
	);
});

for (const [biome, names] of Object.entries(CORNER_PIECES)) {
	test(`${biome}: its own piece stands over every corner-only join, on the specimen and on its mat (#132)`, () => {
		const colours = new Set(names.map((name) => PALETTE[name]));
		for (const which of /** @type {const} */ (['specimen', 'mat'])) {
			const { fp, canvas } = relief(biome, which);
			cornerPieces(fp, canvas, colours).forEach((n, k) => {
				const { row, col } = fp.corners[k];
				assert.ok(
					n >= 6,
					`${which} corner ${row},${col}: ${n} piece pixels`
				);
			});
		}
	});
}

test('a corner-only join stands a peak over the corner', () => {
	const { fp, canvas } = relief('mountain', 'specimen');
	for (const { gx, gy } of fp.corners) {
		const i = (gy - 4) * fp.w + gx;
		assert.notEqual(canvas.p[i], null, `corner ${gx},${gy}`);
		assert.equal(canvas.alpha?.[i] ?? 1, 1, `corner ${gx},${gy} opaque`);
	}
});

test('a corner-only join carries a clump of trees over the corner', () => {
	const { fp, canvas } = relief('forest', 'specimen');
	for (const { gx, gy } of fp.corners) {
		const i = gy * fp.w + gx;
		assert.notEqual(canvas.p[i], null, `corner ${gx},${gy}`);
		assert.equal(canvas.alpha?.[i] ?? 1, 1, `corner ${gx},${gy} opaque`);
	}
});

test('a corner-only join carries a palm and a broadleaf crown over the corner', () => {
	// Only a corner piece may paint outside the impassable plots, so look there: within the corner patch.
	const trunk = new Set([PALETTE.sandShade, PALETTE.timberLight]);
	const crown = new Set([
		PALETTE.grassShade,
		PALETTE.grass,
		PALETTE.jungleLeafLight,
	]);
	for (const which of /** @type {const} */ (['mat', 'specimen'])) {
		const { fp, canvas } = relief('tropical', which);
		assert.ok(fp.corners.length > 0, which);
		for (const { gx, gy } of fp.corners) {
			const near = new Set();
			for (let dy = -16; dy <= 16; dy++) {
				for (let dx = -16; dx <= 16; dx++) {
					const i = (gy + dy) * fp.w + gx + dx;
					if (!fp.plots[i] && opaque(canvas, i)) {
						near.add(canvas.p[i]);
					}
				}
			}
			const at = `${which} corner ${gx},${gy}`;
			assert.ok(opaque(canvas, gy * fp.w + gx), at);
			assert.ok(
				[...trunk].some((c) => near.has(c)),
				`${at}: no palm`
			);
			assert.ok(
				[...crown].some((c) => near.has(c)),
				`${at}: no crown`
			);
		}
	}
});

test('a corner-only join stands a sandstone outcrop over the corner', () => {
	// Only a corner piece may paint outside the impassable plots, and only the rock is outlined in ink.
	for (const which of /** @type {const} */ (['mat', 'specimen'])) {
		const { fp, canvas } = relief('desert', which);
		assert.ok(fp.corners.length > 0, which);
		for (const { gx, gy } of fp.corners) {
			let outline = 0;
			for (let dy = -16; dy <= 16; dy++) {
				for (let dx = -16; dx <= 16; dx++) {
					const i = (gy + dy) * fp.w + gx + dx;
					if (
						!fp.plots[i] &&
						opaque(canvas, i) &&
						canvas.p[i] === PALETTE.ink
					) {
						outline++;
					}
				}
			}
			const at = `${which} corner ${gx},${gy}`;
			assert.ok(opaque(canvas, gy * fp.w + gx), at);
			assert.ok(outline > 0, `${at}: no outcrop`);
		}
	}
});

/** Desert's pale sand tones, and the Mesa's red rock that the Desert keeps clear of (#132). */
const SAND = new Set([PALETTE.sandLight, PALETTE.sand, PALETTE.sandShade]);
const RED_ROCK = new Set([
	PALETTE.mesaRockLight,
	PALETTE.mesaRock,
	PALETTE.mesaStrata,
]);

test('the Desert relief is warm sandstone and sand, apart from the red rock of the Mesa', () => {
	for (const which of /** @type {const} */ (['mat', 'specimen'])) {
		const { canvas } = relief('desert', which);
		let painted = 0;
		let sandy = 0;
		for (let i = 0; i < canvas.p.length; i++) {
			if (!opaque(canvas, i)) {
				continue;
			}
			painted++;
			if (SAND.has(canvas.p[i])) {
				sandy++;
			}
			assert.ok(!RED_ROCK.has(canvas.p[i]), `${which}: red rock at ${i}`);
		}
		assert.ok(sandy >= 0.6 * painted, `${which}: ${sandy}/${painted}`);
	}
});

test('the Desert ground is pale sand, not the red soil of the Mesa', () => {
	const mesa = new Set(
		Object.entries(PALETTE)
			.filter(([name]) => name.startsWith('mesa'))
			.map(([, colour]) => colour)
	);
	for (let variant = 0; variant < 8; variant++) {
		const { p } = plot('desert', variant);
		assert.ok(
			p.filter((c) => SAND.has(c)).length >= 0.85 * p.length,
			`variant ${variant}`
		);
		assert.ok(
			p.every((c) => !mesa.has(c)),
			`variant ${variant}`
		);
	}
});

/** Grey stone, for the Grassland's tors, and the greens of its hills. */
const STONE = new Set([
	PALETTE.stoneLight,
	PALETTE.stone,
	PALETTE.stoneMid,
	PALETTE.stoneShade,
]);
const GREEN = new Set([
	PALETTE.grassLight,
	PALETTE.grass,
	PALETTE.grassShade,
	PALETTE.forestFloorLight,
	PALETTE.forestFloor,
	PALETTE.forestFloorShade,
]);

test('a corner-only join stands a tor on a hill over the corner', () => {
	// Only a corner piece may paint outside the impassable plots, so look there: within the corner patch.
	for (const which of /** @type {const} */ (['mat', 'specimen'])) {
		const { fp, canvas } = relief('grassland', which);
		assert.ok(fp.corners.length > 0, which);
		for (const { gx, gy } of fp.corners) {
			const near = new Set();
			for (let dy = -16; dy <= 16; dy++) {
				for (let dx = -16; dx <= 16; dx++) {
					const i = (gy + dy) * fp.w + gx + dx;
					if (!fp.plots[i] && opaque(canvas, i)) {
						near.add(canvas.p[i]);
					}
				}
			}
			const at = `${which} corner ${gx},${gy}`;
			assert.ok(opaque(canvas, gy * fp.w + gx), at);
			assert.ok(
				[...STONE].some((c) => near.has(c)),
				`${at}: no tor`
			);
			assert.ok(
				[...GREEN].some((c) => near.has(c)),
				`${at}: no hill`
			);
		}
	}
});

test('the Grassland relief is green hills topped with grey stone tors', () => {
	for (const which of /** @type {const} */ (['mat', 'specimen'])) {
		const { canvas } = relief('grassland', which);
		let painted = 0;
		let green = 0;
		let stone = 0;
		for (let i = 0; i < canvas.p.length; i++) {
			if (!opaque(canvas, i)) {
				continue;
			}
			painted++;
			green += GREEN.has(canvas.p[i]) ? 1 : 0;
			stone += STONE.has(canvas.p[i]) ? 1 : 0;
		}
		assert.ok(
			green >= 0.5 * painted,
			`${which}: ${green}/${painted} green`
		);
		assert.ok(
			stone >= 0.04 * painted,
			`${which}: ${stone}/${painted} stone`
		);
	}
});

/**
 * The mean red channel of a picture's pixels: higher is warmer, for greens.
 * @param {(string | null)[]} p
 */
function meanRed(p) {
	return (
		p.reduce((sum, c) => sum + parseInt(String(c).slice(1, 3), 16), 0) /
		p.length
	);
}

test('the Grassland ground is a warm golden meadow, warmer than the Forest meadow and without its white flowers', () => {
	const golden = new Set([
		PALETTE.gold,
		PALETTE.sand,
		PALETTE.sandLight,
		PALETTE.savannaGold,
		PALETTE.savannaGoldLight,
		PALETTE.savannaGoldShade,
		PALETTE.savannaDryBlade,
	]);
	const white = new Set([PALETTE.white, PALETTE.creamLight, PALETTE.cream]);
	let forest = 0;
	for (let variant = 0; variant < 8; variant++) {
		forest = Math.max(forest, meanRed(plot('forest', variant).p));
	}
	for (let variant = 0; variant < 8; variant++) {
		const { p } = plot('grassland', variant);
		assert.ok(
			p.filter((c) => golden.has(c)).length >= 8,
			`variant ${variant}: golden grass`
		);
		assert.ok(
			p.every((c) => !white.has(c)),
			`variant ${variant}: a white flower`
		);
		assert.ok(meanRed(p) > forest, `variant ${variant}: not warmer`);
	}
});

test('every relief biome has a painter', () => {
	assert.deepEqual(Object.keys(RELIEF_PAINTERS), [...RELIEF_BIOMES]);
	assert.ok(Object.isFrozen(RELIEF_PAINTERS));
});

test('a biome without a painter has no relief', () => {
	assert.throws(
		() => drawRelief(CAPITAL_GRIDS.mountain, 'tundra'),
		/No relief for tundra/
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

for (const biome of RELIEF_BIOMES) {
	test(`${biome}: a preview runs its ground across a group's gaps where the relief leaves them bare`, () => {
		const { canvas } = relief(biome, 'specimen');
		const preview = drawReliefPreview(SPECIMEN_LAYOUT, biome);
		let bare = 0;
		for (let y = 0; y < preview.h; y++) {
			for (let x = 0; x < preview.w; x++) {
				const i = y * preview.w + x;
				if (canvas.p[i] === null && inSideGap(SPECIMEN_LAYOUT, x, y)) {
					bare++;
					assert.notEqual(
						preview.p[i],
						PALETTE.ink,
						`${biome} ${x},${y}`
					);
				}
			}
		}
		// The Archipelago's sea and wet sand cover every gap inside a group, so none is left bare.
		if (biome !== 'archipelago') {
			assert.ok(bare > 0, `${biome}: the relief covers every gap`);
		}
	});
}

test('a preview stacks the features under the relief', () => {
	const preview = drawReliefPreview(
		layoutOf('canyon', 'mat'),
		'canyon',
		0,
		matData('canyon')
	);
	// Plot 1,1 is a cactus plot: its saguaro stands in the middle.
	const middle = preview.p[(33 + 16) * preview.w + 33 + 16];
	assert.ok(
		[PALETTE.pine, PALETTE.pineLight, PALETTE.pineShade].includes(
			/** @type {string} */ (middle)
		),
		`${middle}`
	);
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
