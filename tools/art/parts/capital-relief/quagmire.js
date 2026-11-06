// The Quagmire's bog: green-scummed water with half-sunk logs, cattails, peat hummocks and the mat's will-o'-the-wisps (#133).
import { createCanvas, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { withCornerPatches } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { wisp } from '../capital-biomes/quagmire.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { deepWater, drawBackToFront } from './pieces.js';
import { dither } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./index.js').MatData} MatData */

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = Object.freeze({
	[C.quagMudLight]: C.quagMud,
	[C.quagMud]: C.quagMudShade,
	[C.quagMudShade]: C.quagPeat,
	[C.quagWater]: C.quagWaterDeep,
	[C.quagSlime]: C.quagWater,
	[C.quagMoss]: C.quagMudShade,
});

/** A peat hummock's rim, lit, middle, shaded and deep tones. */
const PEAT = Object.freeze([
	C.quagMossLight,
	C.quagMoss,
	C.quagMudShade,
	C.quagPeat,
	C.quagPeat,
]);

/**
 * Paints the bog's water: a peaty face along the far bank, a muddy lip along the near one, and between them
 * dark water with ripples and drifts of green scum.
 * @param {Canvas} canvas
 * @param {Uint8Array} water
 * @param {number} seed
 */
function paintWater(canvas, water, seed) {
	const W = canvas.w;
	const scum = noise(seed + 9, 6);
	const ripple = noise(seed + 8, 4);
	for (let i = 0; i < water.length; i++) {
		if (!water[i]) {
			continue;
		}
		const x = i % W;
		const y = (i / W) | 0;
		let col;
		if (!water[i - W]) {
			col = C.quagPeat;
		} else if (!water[i - 2 * W]) {
			col = dither(x, y) > 0 ? C.quagPeat : C.quagWaterDeep;
		} else if (!water[i + W]) {
			col = C.quagMudShade;
		} else {
			const s = scum(x, y) + dither(x, y) * 0.15;
			const n = ripple(x / 2, y) + dither(x, y) * 0.12;
			if (s > 0.78) {
				col = C.quagWeed;
			} else if (s > 0.66) {
				col = C.quagSlime;
			} else if (n > 0.68) {
				col = C.quagWaterLight;
			} else {
				col = n < 0.3 ? C.quagWaterDeep : C.quagWater;
			}
		}
		put(canvas, water, x, y, col);
	}
}

/**
 * Draws a pair of cattails standing on their base pixel, their tips leaning, most with a brown head.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} tall
 * @param {() => number} rand
 */
function drawCattails(canvas, ok, bx, by, tall, rand) {
	for (let k = 0; k < 2; k++) {
		const x = bx + k * 2;
		const h = tall + Math.floor(rand() * 4);
		const lean = rand() < 0.5 ? -1 : 1;
		for (let t = 0; t < h; t++) {
			let col = k ? C.quagReed : C.swampReed;
			if (t < 2) {
				col = C.quagReedShade;
			}
			put(canvas, ok, x + (t > h - 3 ? lean : 0), by - t, col);
		}
		if (rand() < 0.6) {
			put(canvas, ok, x + lean, by - h, C.quagCattail);
			put(canvas, ok, x + lean, by - h - 1, C.quagCattail);
		}
	}
}

/**
 * Draws a half-sunk log lying across the water, mossy in places.
 * @param {Canvas} canvas
 * @param {Uint8Array} water
 * @param {number} x
 * @param {number} y
 * @param {number} len
 */
function drawLog(canvas, water, x, y, len) {
	for (let k = 0; k < len; k++) {
		put(canvas, water, x + k, y - 1, k === 0 ? C.timberLight : C.timber);
		put(canvas, water, x + k, y, k % 4 === 1 ? C.quagMoss : C.timberShade);
	}
	put(canvas, water, x + len, y - 1, C.timberShade);
}

/**
 * Draws a wisp floating over a plot's water, with its light falling on the water below it. The wisp is drawn on a
 * plot of its own and laid on opaquely, so a shadow under it never shows through.
 * @param {Canvas} canvas
 * @param {Uint8Array} water
 * @param {Uint8Array} ok - Where the wisp may paint
 * @param {number} row
 * @param {number} col
 */
function drawWisp(canvas, water, ok, row, col) {
	const ox = col * PITCH;
	const oy = row * PITCH;
	for (let dy = 20; dy <= 24; dy++) {
		for (let dx = 10; dx <= 22; dx++) {
			if (
				((dx - 16) * (dx - 16)) / 36 + ((dy - 22) * (dy - 22)) / 4 <=
					1 &&
				(dx + dy) % 2 === 0
			) {
				put(canvas, water, ox + dx, oy + dy, C.quagWaterLight);
			}
		}
	}
	const sprite = createCanvas(PLOT, PLOT);
	wisp(sprite, PLOT / 2, PLOT / 2 - 2);
	sprite.p.forEach((colour, i) => {
		if (colour) {
			put(canvas, ok, ox + (i % PLOT), oy + ((i / PLOT) | 0), colour);
		}
	});
}

/**
 * Packs the bog into the footprint of a mat's impassable plots: water, logs, cattails, hummocks, a hummock with
 * cattails over each corner-only join, and a wisp floating over each of the mat's wisp plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 * @param {MatData} [mat] - The mat's wisps
 */
export function paintQuagmire(canvas, fp, seed, mat = {}) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => {
		if (roll < 0.3) {
			return C.quagPeat;
		}
		return roll < 0.45 ? C.quagMoss : C.quagMudShade;
	});
	const { deep: water, depth } = deepWater(fp, seed, 2.5, 4);
	paintWater(canvas, water, seed);
	const rand = seededRandom(hash(seed, 3));
	/** @type {{ by: number, draw: () => void }[]} */
	const scene = [];
	for (let i = 0; i < W * H; i += 11) {
		const x = i % W;
		const y = (i / W) | 0;
		const len = 7 + (hash(x, y) % 6);
		if (
			water[i] &&
			depth[i] >= 7 &&
			hash(x, y, 2) % 9 === 0 &&
			water[i + len] &&
			water[i + len - W]
		) {
			scene.push({
				by: y,
				draw: () => drawLog(canvas, water, x, y, len),
			});
		}
	}
	// Cattails thick on the far banks, standing up behind the water, and in tufts on the near ones.
	for (let i = W; i < W * H - 3 * W; i += 2) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!mask[i] || water[i]) {
			continue;
		}
		const far = water[i + W] && water[i + 3 * W];
		if (
			(far && hash(x, y, 9) % 2 === 0) ||
			(water[i - 2 * W] && hash(x, y, 9) % 17 === 0)
		) {
			scene.push({
				by: y,
				draw: () =>
					drawCattails(canvas, plots, x, y, far ? 8 : 5, rand),
			});
		}
	}
	for (const m of edgeMounds(fp, seed, [5, 4, 3, 2])) {
		scene.push({
			by: m.by,
			draw: () =>
				drawMound(canvas, m, PEAT, DARKER, [
					C.quagMossLight,
					C.quagMoss,
				]),
		});
	}
	// A hummock grown with cattails stands over each corner join, so the two sides read as one bog.
	for (const { gx, gy } of corners) {
		const m = { bx: gx, by: gy + 6, hw: 7, ph: 5, area: reach };
		scene.push({
			by: m.by,
			draw: () => {
				drawMound(canvas, m, PEAT, DARKER, [
					C.quagMossLight,
					C.quagMoss,
				]);
				drawCattails(canvas, reach, gx - 3, gy + 1, 7, rand);
				drawCattails(canvas, reach, gx + 2, gy + 2, 6, rand);
			},
		});
	}
	drawBackToFront(scene);
	for (const [r, c] of mat.wisps ?? []) {
		drawWisp(canvas, water, plots, r, c);
	}
}
