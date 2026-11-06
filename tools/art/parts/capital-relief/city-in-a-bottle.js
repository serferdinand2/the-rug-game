// City in a Bottle's reefs: rounded seabed rocks with coral and sea-glass crystals among them, rising from the sand (#133).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { withCornerPatches } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash } from '../../../../src/lib/art/paint/relief/ground.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { drawBackToFront, drawShards, packRocks } from './pieces.js';
import { drawRock } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/**
 * The bottle's seabed rock, mossy on top, on the seabed sand.
 * @type {Readonly<import('./rock.js').RockStyle>}
 */
export const SEABED_ROCK = Object.freeze({
	tones: Object.freeze([
		C.bottleRockLight,
		C.bottleRockLight,
		C.bottleRock,
		C.bottleRockShade,
		C.bottleOutline,
	]),
	darker: Object.freeze({
		[C.bottleSandLight]: C.bottleSand,
		[C.bottleSand]: C.bottleSandShade,
		[C.bottleSandShade]: C.bottleSandDark,
		[C.bottleRockLight]: C.bottleRock,
		[C.bottleRock]: C.bottleRockShade,
		[C.bottleRockShade]: C.bottleOutline,
		[C.bottleMoss]: C.bottleMossDark,
	}),
	foot: Object.freeze([
		C.bottleSandLight,
		C.bottleSand,
		C.bottleSand,
		C.bottleSandShade,
	]),
	rim: C.bottleOutline,
	top: Object.freeze({
		rim: C.bottleRockLight,
		light: C.bottleMoss,
		base: C.bottleMossDark,
		scrub: C.bottleMoss,
	}),
	width: Object.freeze([0.5, 0.2]),
	cap: 0.25,
	knee: Object.freeze([0.55, 0.15]),
	slope: 0.16,
	strata: false,
});

/** A sand mound's rim, lit, middle, shaded and deep tones. */
const SAND = Object.freeze([
	C.bottleSandLight,
	C.bottleSandLight,
	C.bottleSand,
	C.bottleSandShade,
	C.bottleSandDark,
]);

/** The sea glass's lit, middle and shaded tones. */
const SEA_GLASS = Object.freeze([
	C.bottleGlassLight,
	C.bottleGlass,
	C.bottleGlassDeep,
]);

/**
 * Draws a branching coral standing on its base pixel: two stems that fork, with pale tips.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} h - The tallest stem's height
 * @param {() => number} rand
 */
function drawCoral(canvas, ok, bx, by, h, rand) {
	/** @type {number[][]} */
	const tips = [];
	/** Grows one stem upward, sometimes forking a shorter one to its side. */
	const grow = (
		/** @type {number} */ x0,
		/** @type {number} */ y0,
		/** @type {number} */ len,
		/** @type {number} */ dir
	) => {
		let x = x0;
		let y = y0;
		for (let t = 0; t < len; t++) {
			put(canvas, ok, x, y, t < 1 ? C.bottleCoralShade : C.bottleCoral);
			put(canvas, ok, x + 1, y, C.bottleCoralShade);
			if (t > 1 && len > 3 && rand() < 0.3) {
				grow(x + dir * 2, y - 1, Math.floor(len * 0.6), dir);
			}
			y--;
			if (rand() < 0.35) {
				x += dir;
			}
		}
		tips.push([x, y]);
	};
	grow(bx, by, h, -1);
	grow(bx + 2, by, h - 1, 1);
	for (const [x, y] of tips) {
		put(canvas, ok, x, y, C.bottleCoralLight);
	}
}

/**
 * Packs the reefs into the footprint of a mat's impassable plots: a sand floor, rounded rocks with a pair over each
 * corner-only join, coral and sea glass in turn among them, and sand mounds with shells at their feet.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintCityInABottle(canvas, fp, seed) {
	const { w: W, h: H, plots, mask } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => {
		if (roll < 0.35) {
			return C.bottleSandShade;
		}
		return roll < 0.45 ? C.bottleMossDark : C.bottleSand;
	});
	const rocks = packRocks(fp, seed, SEABED_ROCK, {
		sizes: [12, 9, 7, 5, 4],
		butteFrom: 99,
		fresh: 0.5,
		corner: [
			['boulder', 0, 10, 8, 8],
			['boulder', -6, 12, 4, 4],
		],
	});
	/** @type {{ by: number, draw: () => void }[]} */
	const scene = rocks.map(({ s, ok }) => ({
		by: s.by,
		draw: () => drawRock(canvas, s, ok, SEABED_ROCK),
	}));
	const rand = seededRandom(hash(seed, 31));
	let pieces = 0;
	for (let i = 0; i < W * H; i += 5) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!mask[i] || y < 16 || hash(x, y, 4) % 26 !== 0) {
			continue;
		}
		const glass = pieces++ % 3 === 0;
		const h = glass ? 11 + (hash(x, y) % 5) : 9 + (hash(x, y) % 5);
		scene.push({
			by: y + 1,
			draw: () =>
				glass
					? drawShards(
							canvas,
							{ cx: x, by: y, h },
							plots,
							SEA_GLASS,
							C.bottleOutline
						)
					: drawCoral(canvas, plots, x, y, h, rand),
		});
	}
	for (const m of edgeMounds(fp, seed, [5, 3, 3, 2])) {
		scene.push({
			by: m.by,
			draw: () =>
				drawMound(canvas, m, SAND, SEABED_ROCK.darker, [
					C.cream,
					C.creamShade,
				]),
		});
	}
	drawBackToFront(scene);
}
