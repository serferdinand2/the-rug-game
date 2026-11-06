// Pieces the Fantasies & Futures reliefs share: rocks packed into a footprint, clusters of shards and deep water (#133).
import { seededRandom } from '../../painter.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { distanceInside } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { frontToBack } from './pack.js';
import { dither, rockShape, rowPixels } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./rock.js').RockStyle} RockStyle */
/** @typedef {import('./rock.js').RockSpec} RockSpec */
/** @typedef {ReturnType<typeof rockShape>} Rock */

/**
 * How rocks are packed into a footprint.
 * @typedef {Object} PackOptions
 * @property {readonly number[]} [sizes] - The half-widths tried, biggest first
 * @property {number} [butteFrom] - The least half-width of a flat-topped butte; smaller rocks are boulders
 * @property {readonly number[]} [tall] - A butte's height as a share of its half-width: the least, and how much more
 * @property {readonly [RockSpec['kind'], number, number, number, number][]} [corner] - The rocks stood over each
 *   corner-only join, as [kind, dx, dy, half-width, height] from its gap pixel; dx turns with the join's diagonal
 * @property {Uint8Array} [ok] - Where a rock may paint; the footprint's plots by default
 * @property {Uint8Array} [reach] - Where a corner rock may paint; the footprint's reach by default
 * @property {(i: number) => boolean} [base] - Whether a rock may stand on a pixel
 * @property {number} [fresh] - The least share of a new rock on floor no rock covers yet
 */

/** A butte and a boulder over each corner-only join. */
const CORNER =
	/** @type {[RockSpec['kind'], number, number, number, number][]} */ ([
		['butte', 0, 9, 9, 15],
		['boulder', -6, 11, 4, 4],
	]);

/**
 * Rocks packed into a footprint from the front back, biggest first, each on fresh floor, and a pair over each corner join.
 * @param {Footprint} fp
 * @param {number} seed
 * @param {Readonly<RockStyle>} style
 * @param {PackOptions} [options]
 * @returns {{ s: Rock, ok: Uint8Array }[]} Each rock and where it may paint, in the order placed
 */
export function packRocks(fp, seed, style, options = {}) {
	const { w: W, h: H, mask, corners } = fp;
	const ok = options.ok ?? fp.plots;
	const reach = options.reach ?? fp.reach;
	const [tall0, tallR] = options.tall ?? [0.95, 0.6];
	const butteFrom = options.butteFrom ?? 9;
	const least = options.fresh ?? 0.65;
	const rand = seededRandom(hash(seed, 23));
	const covered = new Uint8Array(W * H);
	/** @type {{ s: Rock, ok: Uint8Array }[]} */
	const rocks = [];
	/** The share of a rock on uncovered floor, or -1 if any of it lies outside its area. */
	const fresh = (/** @type {Rock} */ s, /** @type {Uint8Array} */ area) => {
		let n = 0;
		let total = 0;
		for (const [x, y] of rowPixels(s.rows)) {
			if (x < 0 || y < 0 || x >= W || y >= H || !area[y * W + x]) {
				return -1;
			}
			total++;
			if (mask[y * W + x] && !covered[y * W + x]) {
				n++;
			}
		}
		return n / total;
	};
	const add = (/** @type {Rock} */ s, /** @type {Uint8Array} */ area) => {
		rocks.push({ s, ok: area });
		for (const [x, y] of rowPixels(s.rows)) {
			covered[y * W + x] = 1;
		}
	};
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [kind, dx, dy, hw, ph] of options.corner ?? CORNER) {
			const s = rockShape(
				{ kind, bx: gx + dx * f, by: gy + dy, hw, ph },
				seed,
				style
			);
			if (fresh(s, reach) >= 0) {
				add(s, reach);
			}
		}
	}
	for (const hw of options.sizes ?? [18, 14, 11, 8, 6, 4]) {
		const butte = hw >= butteFrom;
		for (const [bx, by] of frontToBack(W, H, rand)) {
			const i = by * W + bx;
			if (!mask[i] || (options.base && !options.base(i))) {
				continue;
			}
			const t = rand();
			const ph = butte
				? Math.round(Math.min(hw * (tall0 + t * tallR), 10 + hw * 0.8))
				: Math.round(hw * (0.8 + t * 0.2));
			if (
				bx - hw < 0 ||
				bx + hw >= W ||
				by - ph < 0 ||
				!ok[i - hw] ||
				!ok[i + hw] ||
				!ok[(by - ph) * W + bx]
			) {
				continue;
			}
			const s = rockShape(
				{ kind: butte ? 'butte' : 'boulder', bx, by, hw, ph },
				seed,
				style
			);
			if (fresh(s, ok) >= least) {
				add(s, ok);
			}
		}
	}
	return rocks;
}

/**
 * Draws a cluster of four shards standing on a dark foot, each lit on the left and outlined: crystals, sea glass or ice.
 * @param {Canvas} canvas
 * @param {{ cx: number, by: number, h: number }} cluster - Its middle, its base row and its tallest shard's height
 * @param {Uint8Array} ok - Where it may paint
 * @param {readonly string[]} tones - The shards' lit, middle and shaded tones
 * @param {string} outline
 */
export function drawShards(
	canvas,
	{ cx, by, h },
	ok,
	[light, mid, dark],
	outline
) {
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -6; dx <= 6; dx++) {
			if (
				(dx * dx) / 36 + (dy * dy) / 4 <= 1 &&
				dither(cx + dx, by + dy) > 0.1
			) {
				put(canvas, ok, cx + dx, by + dy, dark);
			}
		}
	}
	// Each shard as [x, base, half-width, height, lean].
	for (const [x0, b0, hw, hh, lean] of [
		[cx - 4, by, 2, Math.round(h * 0.55), -2],
		[cx - 1, by + 1, 2, Math.round(h * 0.85), -1],
		[cx + 4, by, 2, Math.round(h * 0.6), 2],
		[cx + 1, by + 2, 3, h, 0],
	]) {
		for (let t = 0; t <= hh; t++) {
			const half = Math.round(hw * (1 - t / (hh + 1)));
			const x = x0 + Math.round((lean * t) / 5);
			for (let dx = -half - 1; dx <= half + 1; dx++) {
				const edge = Math.abs(dx) === half + 1 || t === hh;
				put(
					canvas,
					ok,
					x + dx,
					b0 - t,
					edge ? outline : dx < 0 ? light : dx === 0 ? mid : dark
				);
			}
		}
		put(canvas, ok, x0 + Math.round((lean * hh) / 5), b0 - hh - 1, outline);
	}
}

/**
 * The footprint's deep middle: farther from its edge than a wobbling shore, as a pool of water or lava.
 * @param {Footprint} fp
 * @param {number} seed
 * @param {number} least - The shore's least distance from the footprint's edge
 * @param {number} wobble - How far the shore wanders inward
 * @returns {{ deep: Uint8Array, depth: Float32Array }} The deep pixels, and each pixel's distance from the edge
 */
export function deepWater(fp, seed, least, wobble) {
	const { w: W, h: H, mask } = fp;
	const depth = distanceInside(mask, W, H);
	const shore = noise(seed + 6, 4);
	const deep = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && depth[i] > least + shore(i % W, (i / W) | 0) * wobble) {
			deep[i] = 1;
		}
	}
	return { deep, depth };
}

/**
 * Draws a scene's pieces from the back row to the front, so each stands before the ones behind it.
 * @param {{ by: number, draw: () => void }[]} scene
 */
export function drawBackToFront(scene) {
	for (const item of [...scene].sort((a, b) => a.by - b.by)) {
		item.draw();
	}
}
