// Black water in the Swamp's mud, with bleached dead trees hung with moss, cypress knees, reed beds and hummocks (#132).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { cast, put } from '../../../../src/lib/art/paint/relief/canvas.js';
import {
	distanceInside,
	withCornerPatches,
} from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { dither } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {{ bx: number, by: number, h: number, ok: Uint8Array }} Tree */

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = Object.freeze({
	[C.swampMudLight]: C.swampMud,
	[C.swampMud]: C.swampMudShade,
	[C.swampMudShade]: C.quagPeat,
	[C.quagWater]: C.quagWaterDeep,
	[C.swampWaterDeep]: C.quagWater,
	[C.quagMoss]: C.quagMudShade,
	[C.swampMoss]: C.quagMoss,
});

/** A hummock's rim, lit, middle, shaded and deep tones. */
const HUMMOCK = [
	C.swampMudLight,
	C.swampMudLight,
	C.swampMud,
	C.swampMudShade,
	C.quagPeat,
];

/**
 * The black water: the footprint deeper than a wobbling shore, so the mud shows round it.
 * @param {Footprint} fp
 * @param {number} seed
 * @returns {Uint8Array}
 */
function pool(fp, seed) {
	const { w: W, h: H, mask } = fp;
	const depth = distanceInside(mask, W, H);
	const wobble = noise(seed + 6, 4);
	const water = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && depth[i] > 2.5 + wobble(i % W, (i / W) | 0) * 5) {
			water[i] = 1;
		}
	}
	return water;
}

/**
 * Paints the water: a peaty face along the far bank, a muddy lip along the near one, and dark bands between
 * with rare light streaks and duckweed by the shore.
 * @param {Canvas} canvas
 * @param {Uint8Array} water
 * @param {Float32Array} depth - The footprint's distance from its edge
 * @param {number} seed
 */
function paintWater(canvas, water, depth, seed) {
	const W = canvas.w;
	const ripple = noise(seed + 8, 5);
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
			col = C.swampMudShade;
		} else {
			const n = ripple(x / 2.5, y) + dither(x, y) * 0.12;
			col =
				n > 0.7
					? C.swampWaterDeep
					: n < 0.3
						? C.quagWaterDeep
						: C.quagWater;
			if (hash(x >> 2, y) % 41 === 0) {
				col = C.swampWater;
			}
			if (depth[i] < 6 && hash(x, y, 4) % 13 === 0) {
				col = C.quagSlime;
			}
		}
		put(canvas, water, x, y, col);
	}
}

/**
 * Draws a bleached dead tree: flared roots, a trunk that narrows upward, crooked branches hung with moss,
 * a short reflection where it stands in the water, and a soft shadow at its foot.
 * @param {Canvas} canvas
 * @param {Tree} t
 * @param {Uint8Array} water
 */
function drawDeadTree(canvas, t, water) {
	const W = canvas.w;
	const rand = seededRandom(hash(t.bx, t.by, 13));
	// Bleached dead wood, warm grey, lit from the left.
	const lit = C.creamShade;
	const mid = C.plasterShade;
	const dark = C.timberShade;
	/** @type {[number, number, string][]} */
	const px = [];
	const add = (
		/** @type {number} */ x,
		/** @type {number} */ y,
		/** @type {string} */ col
	) => {
		px.push([x, y, col]);
	};
	for (let dx = -3; dx <= 3; dx++) {
		add(t.bx + dx, t.by, Math.abs(dx) === 3 ? C.wood : dx < 0 ? mid : dark);
	}
	for (let dx = -2; dx <= 2; dx++) {
		add(t.bx + dx, t.by - 1, dx < 0 ? lit : dx === 0 ? mid : dark);
	}
	let x = t.bx;
	/** @type {number[][]} */
	const branches = [];
	for (let y = t.by - 2; y >= t.by - t.h; y--) {
		const up = t.by - y;
		const width = up < t.h * 0.3 ? 4 : up < t.h * 0.65 ? 3 : 2;
		add(x - 1, y, lit);
		for (let k = 0; k < width - 2; k++) {
			add(x + k, y, (y + k) % 5 === 0 ? dark : mid);
		}
		add(x + width - 2, y, dark);
		if (up > t.h * 0.4 && rand() < 0.14) {
			branches.push([x, y]);
		}
		if (rand() < 0.14) {
			x += rand() < 0.5 ? -1 : 1;
		}
	}
	// A split top.
	add(x - 2, t.by - t.h - 1, mid);
	add(x + 1, t.by - t.h - 1, dark);
	add(x - 3, t.by - t.h - 2, mid);
	add(x + 2, t.by - t.h - 3, dark);
	/** @type {number[][]} */
	const moss = [];
	for (const [bx0, by0] of branches) {
		const dir = rand() < 0.5 ? -1 : 1;
		let bx = bx0 + dir;
		let by = by0;
		const len = 3 + Math.floor(rand() * 4);
		for (let s = 0; s < len; s++) {
			add(bx, by, s === 0 ? mid : dark);
			if (s < len - 1 && rand() < 0.4) {
				add(bx, by - 1, lit);
			}
			if (rand() < 0.5) {
				moss.push([bx, by + 1]);
			}
			bx += dir;
			if (rand() < 0.55) {
				by -= 1;
			}
		}
		add(bx, by - 1, dark);
	}
	for (const [mx, my] of moss) {
		const n = 2 + Math.floor(rand() * 3);
		for (let k = 0; k < n; k++) {
			add(mx, my + k, k % 2 ? C.quagMoss : C.swampMoss);
		}
	}
	// Its reflection: the trunk just below the waterline, broken by ripples.
	if (water[t.by * W + t.bx]) {
		for (const [rx, ry] of px) {
			const y = 2 * t.by - ry + 1;
			if (
				ry > t.by - 1 ||
				y >= canvas.h ||
				y - t.by > 6 ||
				!water[y * W + rx] ||
				dither(rx, y) < 0
			) {
				continue;
			}
			put(canvas, t.ok, rx, y, C.quagPeat);
		}
	}
	for (let dx = 1; dx <= 5; dx++) {
		for (let dy = 0; dy <= 1; dy++) {
			if (dither(t.bx + dx, t.by + dy) < 0.15) {
				cast(canvas, t.bx + dx, t.by + dy, 0.3, DARKER);
			}
		}
	}
	for (const [px0, py0, col] of px) {
		put(canvas, t.ok, px0, py0, col);
	}
}

/**
 * Draws a clump of reeds standing on its base pixel, their tips leaning.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} n - How many reeds
 * @param {number} tall
 * @param {() => number} rand
 */
function drawReeds(canvas, ok, bx, by, n, tall, rand) {
	for (let k = 0; k < n; k++) {
		const x = bx + k * 2 - n + Math.floor(rand() * 2);
		const h = tall - 1 + Math.floor(rand() * 3);
		const lean = rand() < 0.5 ? -1 : 1;
		for (let t = 0; t < h; t++) {
			put(
				canvas,
				ok,
				x + (t > h - 3 ? lean : 0),
				by - t,
				t === h - 1
					? C.quagReedLight
					: t < 2
						? C.quagReedShade
						: k % 2
							? C.swampReed
							: C.quagReed
			);
		}
	}
}

/**
 * Packs black water, dead trees, cypress knees, reeds and hummocks into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintSwamp(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	// Mud round the water, reaching into each corner join's patch.
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) =>
		roll < 0.25 ? C.swampMud : roll < 0.33 ? C.quagPeat : C.swampMudShade
	);
	const water = pool(fp, seed);
	paintWater(canvas, water, distanceInside(mask, W, H), seed);
	const rand = seededRandom(hash(seed, 3));
	// A few big dead trees standing in the water, about one to every two plots, and one over each corner join.
	/** @type {Tree[]} */
	const trees = [];
	for (let y = 14; y < H; y += 21) {
		for (let x = Math.floor(y / 21) % 2 ? 14 : 3; x < W; x += 23) {
			const bx = x + Math.floor(rand() * 7) - 3;
			const by = y + Math.floor(rand() * 7) - 3;
			if (
				bx < 4 ||
				by < 0 ||
				bx >= W - 4 ||
				by >= H ||
				!water[by * W + bx] ||
				rand() < 0.35
			) {
				continue;
			}
			trees.push({ bx, by, h: 16 + Math.floor(rand() * 9), ok: plots });
		}
	}
	for (const { gx, gy } of corners) {
		trees.push({ bx: gx, by: gy + 9, h: 14, ok: reach });
	}
	/** Whether a tree's box, with room for its branches, lies inside its area. */
	const fits = (/** @type {Tree} */ t) => {
		for (let y = t.by - t.h - 4; y <= t.by; y++) {
			for (let x = t.bx - 4; x <= t.bx + 4; x++) {
				if (x < 0 || y < 0 || x >= W || y >= H || !t.ok[y * W + x]) {
					return false;
				}
			}
		}
		return true;
	};
	const placed = trees.filter((t) => {
		if (fits(t)) {
			return true;
		}
		t.h = 9;
		return fits(t);
	});
	/** @type {number[][]} */
	const knees = [];
	for (let i = 0; i < W * H; i += 7) {
		if (
			water[i] &&
			water[i - 2 * W] &&
			water[i + W] &&
			hash(i, 5) % 14 === 0
		) {
			knees.push([i % W, (i / W) | 0]);
		}
	}
	// A bed of tall reeds on the far bank, standing up behind the water, and a few on the near bank.
	/** @type {number[][]} */
	const reeds = [];
	for (let i = W; i < W * H - 3 * W; i += 2) {
		const x = i % W;
		const y = (i / W) | 0;
		if (!mask[i] || water[i]) {
			continue;
		}
		if (water[i + W] && water[i + 3 * W] && hash(x, y, 9) % 3 === 0) {
			reeds.push([x, y, 7]);
		} else if (water[i - 2 * W] && hash(x, y, 9) % 23 === 0) {
			reeds.push([x, y, 4]);
		}
	}
	const scene = [
		...placed.map((t) => ({
			by: t.by,
			draw: () => drawDeadTree(canvas, t, water),
		})),
		...knees.map(([x, y]) => ({
			by: y,
			draw: () => {
				put(canvas, water, x, y - 2, C.timberLight);
				put(canvas, water, x, y - 1, C.timberShade);
				put(canvas, water, x + 1, y - 1, C.wood);
				put(canvas, water, x, y, C.wood);
				put(canvas, water, x + 1, y, C.quagPeat);
			},
		})),
		...reeds.map(([x, y, tall]) => ({
			by: y,
			draw: () =>
				drawReeds(canvas, plots, x, y, tall > 5 ? 2 : 3, tall, rand),
		})),
		...edgeMounds(fp, seed, [5, 4, 3, 2]).map((m) => ({
			by: m.by,
			draw: () => {
				drawMound(canvas, m, HUMMOCK, DARKER, [
					C.swampMoss,
					C.quagMoss,
				]);
				drawReeds(canvas, m.area, m.bx, m.by - m.ph + 1, 2, 4, rand);
			},
		})),
	].sort((a, b) => a.by - b.by);
	for (const item of scene) {
		item.draw();
	}
}
