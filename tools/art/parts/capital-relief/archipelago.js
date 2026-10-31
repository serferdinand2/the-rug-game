// The Archipelago's impassable plots: a 2.5D sea with rocky islets, and its volcanoes as volcanic islands (#132).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { distanceInside } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import {
	peakRows,
	peakShape,
} from '../../../../src/lib/art/paint/relief/mountain.js';
import { paintSea } from '../../../../src/lib/art/paint/sea.js';
import { frontToBack } from './pack.js';
import { dither, rowPixels } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./index.js').MatData} MatData */
/** @typedef {import('../../../../src/lib/art/paint/relief/mountain.js').Peak} Peak */

/** The next lighter tone of the smoke and steam, for a puff's lit side. */
const LIGHTER = Object.freeze({
	[C.cloudShade]: C.white,
	[C.white]: C.white,
	[C.stoneMid]: C.stone,
	[C.stone]: C.stoneLight,
	[C.stoneLight]: C.cloudShade,
});

/**
 * The sea: the whole footprint, with a strait bent through each corner join, ringed with sand outside the plots.
 * @param {Footprint} fp
 * @param {number} seed
 * @returns {{ sea: Uint8Array, shore: Uint8Array }}
 */
function seaOf(fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const sea = mask.slice();
	const shore = new Uint8Array(W * H);
	const wear = noise(seed + 5, 3);
	for (const { gx, gy } of corners) {
		for (let dy = -12; dy <= 12; dy++) {
			for (let dx = -12; dx <= 12; dx++) {
				const i = (gy + dy) * W + gx + dx;
				const r2 = dx * dx + dy * dy;
				const lim = 8 + wear(gx + dx, gy + dy) * 2;
				if (!reach[i]) {
					continue;
				}
				if (r2 <= lim * lim) {
					sea[i] = 1;
				} else if (r2 <= (lim + 3) * (lim + 3) && !plots[i]) {
					shore[i] = 1;
				}
			}
		}
	}
	return { sea, shore };
}

/**
 * Paints the water's edges seen from the front and above: a wet sand face and surf along the far shore,
 * foam along the near shore, and broken surf along the sides.
 * @param {Canvas} canvas
 * @param {Uint8Array} sea
 */
function paintShores(canvas, sea) {
	const W = canvas.w;
	for (let i = W; i < sea.length - W; i++) {
		if (!sea[i]) {
			continue;
		}
		const x = i % W;
		const y = (i / W) | 0;
		if (!sea[i - W]) {
			put(canvas, sea, x, y, C.sandShade);
		} else if (!sea[i - 2 * W]) {
			put(canvas, sea, x, y, dither(x, y) > -0.2 ? C.foam : C.dayWave);
		} else if (!sea[i + W] && dither(x, y) > -0.1) {
			put(canvas, sea, x, y, C.foam);
		} else if ((!sea[i - 1] || !sea[i + 1]) && dither(x, y) > 0.2) {
			put(canvas, sea, x, y, C.dayWave);
		}
	}
}

/**
 * A few rocky islets out where the water is wide: grey rock with a grassy top and a ring of foam.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Uint8Array} sea
 * @param {number} seed
 */
function paintIslets(canvas, fp, sea, seed) {
	const { w: W, h: H, plots } = fp;
	const depth = distanceInside(sea, W, H);
	const rand = seededRandom(hash(seed, 41));
	const waterPlots = plots.reduce((n, v) => n + v, 0) / (32 * 32);
	/** @type {Peak[]} */
	const islets = [];
	for (const [bx, by] of frontToBack(W, H, rand)) {
		if (islets.length >= Math.max(1, Math.floor(waterPlots / 8))) {
			break;
		}
		if (depth[by * W + bx] < 11 || rand() < 0.9) {
			continue;
		}
		if (islets.some((s) => Math.hypot(s.bx - bx, s.by - by) < 70)) {
			continue;
		}
		islets.push(
			peakShape(
				{
					bx,
					by,
					hw: 6 + Math.floor(rand() * 3),
					ph: 7 + Math.floor(rand() * 4),
				},
				seed,
				{ rough: 0.4, flat: 2 }
			)
		);
	}
	islets.sort((a, b) => a.by - b.by);
	for (const s of islets) {
		for (let y = s.by - 2; y <= s.by + 2; y++) {
			for (let x = s.bx - s.hw - 3; x <= s.bx + s.hw + 3; x++) {
				if (
					((x - s.bx) / (s.hw + 2.5)) ** 2 + ((y - s.by) / 2) ** 2 <=
					1
				) {
					put(canvas, sea, x, y, C.foam);
				}
			}
		}
		const rows = peakRows(s);
		/** @type {Set<number>} */
		const own = new Set();
		for (const [x, y] of rowPixels(rows)) {
			own.add(y * W + x);
		}
		for (const [x, y] of rowPixels(rows)) {
			const i = y * W + x;
			const lit = x < s.ridge(y);
			const depthOf = (y - s.sy) / s.ph;
			let col = lit
				? dither(x, y) > 0
					? C.stoneLight
					: C.stone
				: dither(x, y) > 0.1
					? C.stoneMid
					: C.stoneShade;
			if (depthOf < 0.25 && lit) {
				col = C.grassLight;
			} else if (depthOf < 0.3) {
				col = C.grassShade;
			}
			if (depthOf > 0.85) {
				col = C.foam;
			}
			if (
				(!own.has(i - 1) || !own.has(i + 1) || !own.has(i - W)) &&
				depthOf < 0.8
			) {
				col = C.ink;
			}
			put(canvas, plots, x, y, col);
		}
	}
}

/**
 * The volcanoes' island: an oval in each volcano plot, joined between plots that touch above and below.
 * @param {Footprint} fp
 * @param {readonly (readonly [number, number])[]} volcanoes
 * @returns {Uint8Array}
 */
function islandOf(fp, volcanoes) {
	const { w: W, h: H, plots } = fp;
	const island = new Uint8Array(W * H);
	const isVolcano = (/** @type {number} */ r, /** @type {number} */ c) =>
		volcanoes.some(([vr, vc]) => vr === r && vc === c);
	for (const [r, c] of volcanoes) {
		const cx = c * PITCH + 16;
		const cy = r * PITCH + 16;
		for (let y = Math.max(0, cy - 16); y <= Math.min(H - 1, cy + 16); y++) {
			for (
				let x = Math.max(0, cx - 16);
				x <= Math.min(W - 1, cx + 16);
				x++
			) {
				const wob = (hash(x >> 1, y >> 1, 3) % 100) / 100;
				if (
					((x - cx) / (14.5 + wob)) ** 2 +
						((y - cy) / (13.5 + wob)) ** 2 <=
						1 &&
					plots[y * W + x]
				) {
					island[y * W + x] = 1;
				}
			}
		}
		if (isVolcano(r + 1, c)) {
			for (let y = cy; y <= Math.min(H - 1, cy + PITCH); y++) {
				for (let x = cx - 13; x <= cx + 13; x++) {
					if (plots[y * W + x]) {
						island[y * W + x] = 1;
					}
				}
			}
		}
	}
	return island;
}

/**
 * Draws a volcano: a dark basalt cone with a glowing crater, a lava flow down its shaded flank to the
 * shore, green lower slopes, a plume of smoke, and steam where the lava meets the sea.
 * @param {Canvas} canvas
 * @param {Peak} s
 * @param {Uint8Array} island
 * @param {Uint8Array} plots
 */
function drawVolcano(canvas, s, island, plots) {
	const W = canvas.w;
	const rows = peakRows(s);
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of rowPixels(rows)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(s.bx, s.by, 7), 2.5);
	/** @type {Map<number, number>} */
	const lava = new Map();
	let lx = s.sx + 2;
	for (let y = s.sy + 1; y <= s.by + 3; y++) {
		lava.set(y, lx);
		if (s.rand() < 0.4) {
			lx += 1;
		}
	}
	for (const [x, y] of rowPixels(rows)) {
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + dither(x, y) * 0.25;
		let col = lit
			? n > 0.62
				? C.basaltLight
				: n > 0.3
					? C.basalt
					: C.basaltShade
			: n > 0.66
				? C.basalt
				: n > 0.3
					? C.basaltShade
					: C.hellRockDeep;
		// Old flows streak the slopes.
		if (hash(x >> 1, y, 9) % 13 === 0) {
			col = lit ? C.ashLight : C.ash;
		}
		if (y - s.sy <= 1) {
			col = y === s.sy ? C.lavaDeep : n > 0.5 ? C.ember : C.lava;
		}
		if (lava.get(y) === x) {
			col = y - s.sy < 6 ? C.ember : C.lava;
		} else if (lava.get(y) === x - 1 && y - s.sy > 2) {
			col = C.lavaDeep;
		}
		const green = Math.max(0, (depth - 0.62) / 0.38);
		if (
			lava.get(y) !== x &&
			green ** 1.3 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5
		) {
			col = lit
				? n > 0.5
					? C.forestFloorLight
					: C.forestFloor
				: C.forestFloorShade;
		}
		if (
			(!own.has(i - 1) || !own.has(i + 1) || !own.has(i - W)) &&
			depth < 0.62
		) {
			col = C.ink;
		}
		put(canvas, island, x, y, col);
	}
	// Steam where the lava meets the sea; a plume of smoke leaning off the crater.
	const shoreY = Math.max(
		...[...lava.keys()].filter(
			(y) => island[y * W + /** @type {number} */ (lava.get(y))]
		)
	);
	const shoreX = /** @type {number} */ (lava.get(shoreY));
	for (const [cx, cy, r, col] of [
		[shoreX, shoreY - 1, 2.5, C.cloudShade],
		[shoreX + 2, shoreY - 3, 2, C.white],
		[s.sx + 1, s.sy - 3, 2.5, C.stoneMid],
		[s.sx + 4, s.sy - 6, 3.2, C.stone],
		[s.sx + 8, s.sy - 8, 2.8, C.stoneLight],
	]) {
		const c = /** @type {number} */ (cx);
		const cy0 = /** @type {number} */ (cy);
		const r0 = /** @type {number} */ (r);
		for (let y = Math.floor(cy0 - r0); y <= Math.ceil(cy0 + r0); y++) {
			for (let x = Math.floor(c - r0); x <= Math.ceil(c + r0); x++) {
				if ((x - c) ** 2 + (y - cy0) ** 2 > r0 * r0) {
					continue;
				}
				const tone = /** @type {string} */ (col);
				put(
					canvas,
					plots,
					x,
					y,
					x - c + (y - cy0) < -0.5 ? LIGHTER[tone] : tone
				);
			}
		}
	}
}

/**
 * Paints the Archipelago's impassable plots: the sea, with its shores and islets, and each volcano as a
 * volcanic island. Two touching volcano plots are one massif, a tall cone behind and a smaller one in front.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 * @param {MatData} [mat] - The volcano plots
 */
export function paintArchipelago(canvas, fp, seed, mat = {}) {
	const { w: W, plots } = fp;
	const volcanoes = mat.volcanoes ?? [];
	const { sea, shore } = seaOf(fp, seed);
	// Wet sand round the water: the water plots' margins, and a ring round each strait.
	const sand = new Uint8Array(sea.length);
	for (let i = 0; i < sea.length; i++) {
		if ((plots[i] || shore[i]) && !sea[i]) {
			sand[i] = 1;
			put(
				canvas,
				sand,
				i % W,
				(i / W) | 0,
				dither(i % W, (i / W) | 0) > 0.2 ? C.sandShade : C.sand
			);
		}
	}
	const land = new Uint8Array(sea.length);
	for (let i = 0; i < sea.length; i++) {
		land[i] = sea[i] ? 0 : 1;
	}
	paintSea(canvas, sea, land, seed);
	paintShores(canvas, sea);
	paintIslets(canvas, fp, sea, seed);
	// Each volcanic island: foam, then a black-sand shore, then green jungle inland, and its cones.
	const island = islandOf(fp, volcanoes);
	const edge = distanceInside(island, W, fp.h);
	for (let i = 0; i < island.length; i++) {
		if (!island[i]) {
			continue;
		}
		const x = i % W;
		const y = (i / W) | 0;
		const e = edge[i];
		put(
			canvas,
			island,
			x,
			y,
			e <= 1
				? C.foam
				: e <= 3.5
					? dither(x, y) > 0.1
						? C.ash
						: C.ashShade
					: dither(x, y) > 0.25
						? C.forestFloorLight
						: dither(x, y) > -0.2
							? C.forestFloor
							: C.forestFloorShade
		);
	}
	const isVolcano = (/** @type {number} */ r, /** @type {number} */ c) =>
		volcanoes.some(([vr, vc]) => vr === r && vc === c);
	/** @type {Peak[]} */
	const cones = [];
	for (const [r, c] of volcanoes) {
		const x = c * PITCH + 16;
		if (isVolcano(r + 1, c)) {
			cones.push(
				peakShape(
					{ bx: x - 1, by: r * PITCH + 38, hw: 12, ph: 34 },
					seed,
					{ rough: 0.14, flat: 2 }
				)
			);
		} else if (isVolcano(r - 1, c)) {
			cones.push(
				peakShape(
					{ bx: x + 2, by: r * PITCH + 27, hw: 10, ph: 14 },
					seed + 1,
					{ rough: 0.16, flat: 2 }
				)
			);
		} else {
			cones.push(
				peakShape({ bx: x, by: r * PITCH + 26, hw: 12, ph: 22 }, seed, {
					rough: 0.14,
					flat: 2,
				})
			);
		}
	}
	cones.sort((a, b) => a.by - b.by);
	for (const s of cones) {
		drawVolcano(canvas, s, island, plots);
	}
}
