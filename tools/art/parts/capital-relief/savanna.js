// The Savanna's kopjes: piled granite boulders and flat-topped acacias in dry grass, with a grassy clearing for each herd (#133).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { cast, put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { withCornerPatches } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash } from '../../../../src/lib/art/paint/relief/ground.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { drawBackToFront, packRocks } from './pieces.js';
import { dither, drawRock } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./index.js').MatData} MatData */

/**
 * The kopjes' pale granite, in rounded boulders, on dry grass.
 * @type {Readonly<import('./rock.js').RockStyle>}
 */
export const GRANITE = Object.freeze({
	tones: Object.freeze([
		C.creamLight,
		C.stoneLight,
		C.stone,
		C.stoneMid,
		C.stoneShade,
	]),
	darker: Object.freeze({
		[C.savannaGoldLight]: C.savannaGold,
		[C.savannaGold]: C.savannaGoldShade,
		[C.savannaDustLight]: C.savannaDust,
		[C.savannaDust]: C.savannaDustShade,
		[C.stoneLight]: C.stone,
		[C.stone]: C.stoneMid,
		[C.stoneMid]: C.stoneShade,
		[C.creamLight]: C.stoneLight,
	}),
	foot: Object.freeze([
		C.savannaGoldLight,
		C.savannaGold,
		C.savannaGold,
		C.savannaGoldShade,
	]),
	rim: C.stoneShade,
	top: null,
	width: Object.freeze([0.45, 0.2]),
	cap: 0.3,
	knee: Object.freeze([0.5, 0.15]),
	slope: 0.18,
	strata: false,
});

/** A grassy mound's rim, lit, middle, shaded and deep tones. */
const GRASS = Object.freeze([
	C.savannaGoldLight,
	C.savannaGoldLight,
	C.savannaGold,
	C.savannaGoldShade,
	C.savannaDustShade,
]);

/**
 * Draws a flat-topped acacia standing on its base pixel: a thin trunk that forks under a wide, flat crown, and its
 * shadow on the grass.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} h - The trunk's height
 * @param {number} hw - The crown's half-width
 */
function drawAcacia(canvas, ok, bx, by, h, hw) {
	for (let dx = -hw; dx <= hw; dx++) {
		const x = bx + dx + 3;
		if (dither(x, by + 1) < 0.2 && ok[(by + 1) * canvas.w + x]) {
			cast(canvas, x, by + 1, 0.3, GRANITE.darker);
		}
	}
	for (let t = 0; t < h; t++) {
		const x = bx + (t > h * 0.5 ? 1 : 0);
		put(canvas, ok, x, by - t, C.timberShade);
		if (t < h * 0.4) {
			put(canvas, ok, x + 1, by - t, C.timber);
		}
	}
	put(canvas, ok, bx - 2, by - h + 2, C.timberShade);
	put(canvas, ok, bx - 3, by - h + 1, C.timberShade);
	put(canvas, ok, bx + 3, by - h + 1, C.timberShade);
	const top = by - h;
	for (let y = -4; y <= 1; y++) {
		let share = 1;
		if (y === -4) {
			share = 0.55;
		} else if (y === -3) {
			share = 0.85;
		} else if (y === 1) {
			share = 0.75;
		}
		const half = Math.round(hw * share);
		for (let x = -half; x <= half; x++) {
			let col = dither(bx + x, top + y) > 0.25 ? C.pineLight : C.pine;
			if (y === 1) {
				col = C.pineShade;
			} else if (y <= -3) {
				col = C.pineLight;
			} else if (x > half * 0.4) {
				col = C.pineShade;
			}
			put(canvas, ok, bx + x + 1, top + y, col);
		}
	}
}

/**
 * Packs the kopjes into the footprint of a mat's impassable plots: boulders with a pair over each corner join, an
 * acacia on about half the plots, grassy mounds at their feet, and on each herd's plot a clearing of tall dry grass,
 * where the herd's own picture stands.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 * @param {MatData} [mat] - The mat's herds
 */
export function paintSavanna(canvas, fp, seed, mat = {}) {
	const { w: W, h: H, mask, plots } = fp;
	const herd = new Uint8Array(W * H);
	for (const [r, c] of mat.herds ?? []) {
		for (let y = r * PITCH - 2; y < r * PITCH + PLOT + 2; y++) {
			for (let x = c * PITCH - 2; x < c * PITCH + PLOT + 2; x++) {
				if (x >= 0 && y >= 0 && x < W && y < H) {
					herd[y * W + x] = 1;
				}
			}
		}
	}
	const ok = plots.map((v, i) => (v && !herd[i] ? 1 : 0));
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) =>
		roll < 0.3 ? C.savannaGoldShade : C.savannaGold
	);
	const rocks = packRocks(fp, seed, GRANITE, {
		sizes: [13, 10, 8, 6, 4],
		butteFrom: 99,
		fresh: 0.5,
		ok,
		base: (i) => !herd[i],
	});
	/** @type {{ by: number, draw: () => void }[]} */
	const scene = rocks.map(({ s, ok: area }) => ({
		by: s.by,
		draw: () => drawRock(canvas, s, area, GRANITE),
	}));
	const rand = seededRandom(hash(seed, 51));
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			const i = (r * PITCH + 16) * W + c * PITCH + 16;
			if (!plots[i] || herd[i] || hash(r, c, seed) % 2) {
				continue;
			}
			const bx = c * PITCH + 10 + Math.floor(rand() * 12);
			const by = r * PITCH + 29;
			const h = 16 + Math.floor(rand() * 5);
			const hw = 10 + Math.floor(rand() * 3);
			// In front of the boulders of its own plot.
			scene.push({
				by: by + 4,
				draw: () => drawAcacia(canvas, ok, bx, by, h, hw),
			});
		}
	}
	for (const m of edgeMounds(fp, seed, [6, 4, 3, 3])) {
		scene.push({
			by: m.by,
			draw: () =>
				drawMound(canvas, m, GRASS, GRANITE.darker, [
					C.savannaDryBlade,
					C.savannaGoldShade,
				]),
		});
	}
	drawBackToFront(scene);
	for (let i = 0; i < W * H; i += 3) {
		if (herd[i] && mask[i] && hash(i, 7) % 3 === 0) {
			const x = i % W;
			const y = (i / W) | 0;
			put(canvas, plots, x, y, C.savannaDryBlade);
			put(canvas, plots, x, y - 1, C.savannaGoldLight);
		}
	}
}
