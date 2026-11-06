// Tests for each Fantasies & Futures mat's overlay (#133): what the mat prints over its relief, from the veil line to the bottle's glass.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { PALETTE } from '../tools/art/palette.js';
import { OVERLAY_BIOMES, reliefSize } from '../src/lib/art/relief.js';
import { isImpassable } from '../src/lib/art/paint/relief/footprint.js';
import {
	SPECIMEN_DATA,
	SPECIMEN_LAYOUT,
	drawRelief,
	drawReliefPreview,
	matData,
	matLayout,
} from '../tools/art/parts/capital-relief/index.js';
import {
	OVERLAY_PAINTERS,
	drawOverlay,
} from '../tools/art/parts/capital-overlay/index.js';

/** Each biome's overlay on its own mat, drawn once. */
const pictures = new Map(
	OVERLAY_BIOMES.map((biome) => [
		biome,
		drawOverlay(
			/** @type {readonly string[]} */ (matLayout(biome)),
			biome,
			matData(biome)
		),
	])
);

/**
 * A biome's overlay on its own mat.
 * @param {string} biome
 * @returns {ReturnType<typeof drawOverlay>}
 */
function picture(biome) {
	return /** @type {ReturnType<typeof drawOverlay>} */ (pictures.get(biome));
}

/**
 * How many pixels of an overlay are painted inside a plot, in any of the colours given (any colour when left out).
 * @param {ReturnType<typeof drawOverlay>} canvas
 * @param {number} r
 * @param {number} c
 * @param {string[]} [names]
 */
function onPlot(canvas, r, c, names) {
	const colours = names && new Set(names.map((name) => PALETTE[name]));
	let n = 0;
	for (let y = 0; y < 32; y++) {
		for (let x = 0; x < 32; x++) {
			const colour = canvas.p[(r * 33 + y) * canvas.w + c * 33 + x];
			if (colour !== null && (!colours || colours.has(colour))) {
				n++;
			}
		}
	}
	return n;
}

test('the overlays are the five mats that print over their relief', () => {
	assert.deepEqual(
		[...OVERLAY_BIOMES],
		['city-in-a-bottle', 'veil', 'savanna', 'polar', 'netherworld']
	);
	assert.deepEqual(Object.keys(OVERLAY_PAINTERS), [...OVERLAY_BIOMES]);
	assert.ok(Object.isFrozen(OVERLAY_PAINTERS));
});

test('drawOverlay refuses a mat without an overlay', () => {
	assert.throws(
		() =>
			drawOverlay(
				/** @type {readonly string[]} */ (matLayout('quagmire')),
				'quagmire'
			),
		/No overlay for quagmire/
	);
});

for (const biome of OVERLAY_BIOMES) {
	test(`${biome}: the overlay is its mat's size, deterministic, in palette colours, translucent only as the bottle's glass`, () => {
		const layout = /** @type {readonly string[]} */ (matLayout(biome));
		const canvas = picture(biome);
		const { w, h } = reliefSize(layout.length, layout[0].length);
		assert.deepEqual([canvas.w, canvas.h], [w, h]);
		assert.deepEqual(drawOverlay(layout, biome, matData(biome)), canvas);
		const colours = new Set(Object.values(PALETTE));
		let painted = 0;
		for (let i = 0; i < canvas.p.length; i++) {
			const colour = canvas.p[i];
			if (colour === null) {
				continue;
			}
			painted++;
			assert.ok(colours.has(colour), `${colour} at ${i}`);
			if (biome !== 'city-in-a-bottle') {
				assert.equal(canvas.alpha?.[i] ?? 1, 1, `translucent at ${i}`);
			}
		}
		assert.ok(painted > 200, `${biome}: ${painted} pixels`);
	});
}

test("the bottle's glass tints only the outer 4 pixels of the mat, translucent", () => {
	const canvas = picture('city-in-a-bottle');
	assert.deepEqual([canvas.w, canvas.h], [197, 197]);
	for (let i = 0; i < canvas.p.length; i++) {
		if (canvas.p[i] === null) {
			continue;
		}
		const x = i % canvas.w;
		const y = (i / canvas.w) | 0;
		const edge = Math.min(x, y, canvas.w - 1 - x, canvas.h - 1 - y);
		assert.ok(edge < 4, `${x},${y}`);
		assert.ok((canvas.alpha?.[i] ?? 1) < 1, `${x},${y} translucent`);
	}
	// The rim runs all the way round.
	for (const [x, y] of [
		[0, 100],
		[196, 100],
		[100, 0],
		[100, 196],
	]) {
		assert.notEqual(canvas.p[y * canvas.w + x], null, `${x},${y}`);
	}
});

test('the veil runs along every edge between the two sides, and the pocket icons stand where the mat prints them', () => {
	const canvas = picture('veil');
	const sides = /** @type {readonly string[]} */ (matData('veil').sides);
	const W = canvas.w;
	/** Whether a pixel lies within 2 pixels, either way, of an edge between two plots on different sides; at a bend, of either edge. */
	const nearVeil = (/** @type {number} */ x, /** @type {number} */ y) => {
		for (let dy = -2; dy <= 2; dy++) {
			for (let dx = -2; dx <= 2; dx++) {
				const px = x + dx;
				const py = y + dy;
				const r = Math.floor(py / 33);
				const c = Math.floor(px / 33);
				const side = sides[r]?.[c];
				if (side === undefined) {
					continue;
				}
				if (
					(px % 33 === 32 &&
						sides[r][c + 1] !== undefined &&
						sides[r][c + 1] !== side) ||
					(py % 33 === 32 &&
						sides[r + 1]?.[c] !== undefined &&
						sides[r + 1][c] !== side)
				) {
					return true;
				}
			}
		}
		return false;
	};
	const pockets = matData('veil').pockets ?? [];
	assert.equal(pockets.length, 3);
	/** Whether a pixel lies on a pocket icon's disc. */
	const onPocket = (/** @type {number} */ x, /** @type {number} */ y) =>
		pockets.some((p) => Math.hypot(x - p.x, y - p.y) <= 11);
	for (let i = 0; i < canvas.p.length; i++) {
		if (canvas.p[i] !== null) {
			const x = i % W;
			const y = (i / W) | 0;
			assert.ok(nearVeil(x, y) || onPocket(x, y), `${x},${y}`);
		}
	}
	// The veil's own colours along its whole run: down the column 5|6 edge, along the row 5|6 edge, down the 2|3 edge.
	for (const [x, y] of [
		[197, 10],
		[197, 150],
		[150, 197],
		[98, 260],
	]) {
		assert.ok(
			[PALETTE.ghostLight, PALETTE.arcaneLight].includes(
				/** @type {string} */ (canvas.p[y * W + x])
			),
			`${x},${y}: ${canvas.p[y * W + x]}`
		);
	}
	for (const p of pockets) {
		assert.notEqual(canvas.p[p.y * W + p.x], null, p.kind);
	}
});

test('a unicorn herd stands on each herd plot, and brass borders run round each district', () => {
	const canvas = picture('savanna');
	const { herds = [], districts = [] } = matData('savanna');
	for (const [r, c] of herds) {
		assert.ok(onPlot(canvas, r, c, ['cream']) > 30, `herd ${r},${c}`);
	}
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			const herd = herds.some(([hr, hc]) => hr === r && hc === c);
			if (!herd) {
				assert.equal(onPlot(canvas, r, c, ['cream']), 0, `${r},${c}`);
			}
			const W = canvas.w;
			const brass = (/** @type {number} */ x, /** @type {number} */ y) =>
				canvas.p[(r * 33 + y) * W + c * 33 + x] === PALETTE.brass;
			const d = districts[r][c];
			if (d === '.') {
				assert.equal(
					onPlot(canvas, r, c, ['brass']),
					0,
					`grey ${r},${c}`
				);
				continue;
			}
			// A border on each side that a plot of another district, or the grey ground, lies beyond.
			assert.equal(
				brass(31, 16),
				districts[r][c + 1] !== d,
				`${r},${c} right`
			);
			assert.equal(
				brass(0, 16),
				districts[r][c - 1] !== d,
				`${r},${c} left`
			);
			assert.equal(
				brass(16, 31),
				districts[r + 1]?.[c] !== d,
				`${r},${c} below`
			);
			assert.equal(
				brass(16, 0),
				districts[r - 1]?.[c] !== d,
				`${r},${c} above`
			);
		}
	}
});

test("Polar's rings stand on its ringed plots, and its dashed field lines run through the impassable plots between them", () => {
	const canvas = picture('polar');
	const layout = /** @type {readonly string[]} */ (matLayout('polar'));
	let crossing = 0;
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			const ringed = /[A-F]/.test(layout[r][c]);
			// A point on the ring but off every line's axis through the plot: a line runs straight or at 45°.
			const onRing = canvas.p[(r * 33 + 9) * canvas.w + c * 33 + 14];
			assert.equal(onRing !== null, ringed, `${r},${c}`);
			if (isImpassable(layout, r, c)) {
				crossing += onPlot(canvas, r, c, ['tealLight', 'tealShade']);
			}
		}
	}
	assert.ok(crossing > 100, `${crossing} dash pixels over impassable plots`);
});

test("the Netherworld's imps stand on its I plots and its centre's gold ring on the C plot, and nothing else", () => {
	const canvas = picture('netherworld');
	const layout = /** @type {readonly string[]} */ (matLayout('netherworld'));
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			const ch = layout[r][c];
			assert.equal(
				onPlot(canvas, r, c, ['brickRed']) > 20,
				ch === 'I',
				`imp ${r},${c}`
			);
			assert.equal(
				onPlot(canvas, r, c, ['gold']) > 40,
				ch === 'C',
				`centre ${r},${c}`
			);
			if (ch !== 'I' && ch !== 'C') {
				assert.equal(onPlot(canvas, r, c), 0, `${r},${c}`);
			}
		}
	}
});

test('a preview lays the overlay over the relief, so the field lines cross the ice', () => {
	const layout = /** @type {readonly string[]} */ (matLayout('polar'));
	const preview = drawReliefPreview(layout, 'polar', 0, matData('polar'));
	const relief = drawRelief(layout, 'polar', matData('polar'));
	const overlay = picture('polar');
	let shown = 0;
	for (let i = 0; i < overlay.p.length; i++) {
		if (overlay.p[i] !== null && relief.p[i] !== null) {
			assert.equal(preview.p[i], overlay.p[i], `pixel ${i}`);
			shown++;
		}
	}
	assert.ok(shown > 50, `${shown} overlay pixels over the relief`);
});

test('a specimen sheet prints no overlay of its mat: no lines, rings, imps or icons', () => {
	for (const biome of ['veil', 'polar', 'netherworld']) {
		const canvas = drawOverlay(
			SPECIMEN_LAYOUT,
			biome,
			SPECIMEN_DATA[biome] ?? {}
		);
		const painted = canvas.p.filter((c) => c !== null).length;
		if (biome === 'veil') {
			// Its veil runs down the specimen's column 4|5 edge.
			assert.ok(painted > 200, `${biome}: ${painted}`);
		} else {
			assert.equal(painted, 0, biome);
		}
	}
});
