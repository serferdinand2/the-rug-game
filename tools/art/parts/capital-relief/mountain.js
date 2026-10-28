// Snow-capped peaks and foothills packed into a mat's impassable footprint, ported from the approved #82 spike.
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put, shadow } from './canvas.js';
import { hash, noise } from './ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('./footprint.js').Footprint} Footprint */
/** @typedef {{ bx: number, by: number, hw: number, ph: number }} PeakSpec */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
	(v) => v / 16 - 0.5
);

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = /** @type {Record<string, string>} */ ({
	[C.alpineMeadowLight]: C.alpineMeadow,
	[C.alpineMeadow]: C.alpineMeadowShade,
	[C.alpineMeadowShade]: C.alpineMeadowDeep,
	[C.alpineMeadowDeep]: C.alpineMeadowDark,
	[C.stoneMid]: C.stoneShade,
});

/**
 * A soft floor under the group: ragged at its edge, so it fades into the ground.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {number} seed
 */
function drawFloor(canvas, fp, seed) {
	const { w, h, mask } = fp;
	const ragged = noise(seed + 3, 3);
	const rand = seededRandom(hash(seed, 77));
	const around = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
		[2, 0],
		[-2, 0],
		[0, 2],
		[0, -2],
	];
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x;
			if (!mask[i]) {
				continue;
			}
			let edge = 0;
			for (const [dx, dy] of around) {
				if (!mask[i + dy * w + dx]) {
					edge++;
				}
			}
			if (edge && ragged(x, y) < 0.5) {
				continue;
			}
			put(
				canvas,
				mask,
				x,
				y,
				rand() < 0.25
					? C.alpineMeadowDeep
					: rand() < 0.15
						? C.stoneMid
						: C.alpineMeadowShade
			);
		}
	}
}

/**
 * A jagged edge from (x0, y0) to (x1, y1), as the x on each row.
 * @param {() => number} rand
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} rough
 * @returns {(y: number) => number}
 */
function jagged(rand, x0, y0, x1, y1, rough) {
	/** @type {number[][]} */
	let pts = [
		[x0, y0],
		[x1, y1],
	];
	for (let pass = 0; pass < 4; pass++) {
		const next = [pts[0]];
		for (let i = 1; i < pts.length; i++) {
			const [ax, ay] = pts[i - 1];
			const [bx, by] = pts[i];
			next.push(
				[
					(ax + bx) / 2 +
						(rand() - 0.5) * Math.hypot(bx - ax, by - ay) * rough,
					(ay + by) / 2,
				],
				[bx, by]
			);
		}
		pts = next;
	}
	/** @type {Map<number, number>} */
	const xs = new Map();
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		for (
			let y = Math.ceil(Math.min(ay, by));
			y <= Math.floor(Math.max(ay, by));
			y++
		) {
			xs.set(y, ax + (bx - ax) * (by === ay ? 0 : (y - ay) / (by - ay)));
		}
	}
	return (y) => xs.get(y) ?? (y <= y0 ? x0 : x1);
}

/**
 * @param {PeakSpec} p
 * @param {number} seed
 */
function peakShape(p, seed) {
	const rand = seededRandom(hash(p.bx, p.by, p.hw, seed));
	const sx = p.bx + Math.round((rand() - 0.5) * p.hw * 0.4);
	const sy = p.by - p.ph;
	const left = jagged(rand, sx, sy, p.bx - p.hw, p.by, 0.35);
	const right = jagged(rand, sx, sy, p.bx + p.hw, p.by, 0.35);
	const ridge = jagged(
		rand,
		sx,
		sy,
		p.bx + Math.round((rand() - 0.3) * p.hw * 0.5),
		p.by,
		0.5
	);
	const snowDepth = Math.max(0, p.ph - 9) * (0.42 + rand() * 0.12);
	/** @type {Map<number, number>} */
	const line = new Map();
	let walk = 0;
	for (let x = p.bx - p.hw - 1; x <= p.bx + p.hw + 1; x++) {
		walk = Math.max(-3, Math.min(3, walk + (rand() < 0.5 ? -1 : 1)));
		line.set(x, sy + snowDepth + walk + Math.abs(x - sx) * 0.25);
	}
	const snow = (/** @type {number} */ x) =>
		snowDepth > 0 ? (line.get(x) ?? sy) : sy - 1;
	return { ...p, sx, sy, left, right, ridge, snow, rand };
}

/** @typedef {ReturnType<typeof peakShape>} Peak */

/**
 * @param {Peak} s
 * @returns {Generator<number[]>} Each pixel as [x, y]
 */
function* pixels(s) {
	for (let y = s.sy; y <= s.by; y++) {
		const a = Math.round(Math.min(s.left(y), s.right(y)));
		const b = Math.round(Math.max(s.left(y), s.right(y)));
		for (let x = a; x <= b; x++) {
			yield [x, y];
		}
	}
}

/**
 * A soft shadow to the right of a foot, on every other pixel so it fades. On empty ground it is
 * translucent ink; on painted ground it is the next tone down.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Set<number>} own
 * @param {number[]} box - x0, x1, y0, y1
 */
function footShadow(canvas, fp, own, [x0, x1, y0, y1]) {
	for (let x = x0; x <= x1; x++) {
		for (let y = y0; y <= y1; y++) {
			if (x < 0 || y < 0 || x >= fp.w || y >= fp.h) {
				continue;
			}
			const i = y * fp.w + x;
			if (!fp.reach[i] || own.has(i)) {
				continue;
			}
			if (BAYER[(y % 4) * 4 + (x % 4)] >= 0.15) {
				continue;
			}
			const under = canvas.p[i];
			if (under === null) {
				shadow(canvas, x, y, 0.3);
			} else if (!canvas.alpha || canvas.alpha[i] === 1) {
				const darker = DARKER[under];
				if (darker) {
					canvas.p[i] = darker;
				}
			}
		}
	}
}

/**
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Peak} s
 */
function drawPeak(canvas, fp, s) {
	const W = fp.w;
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of pixels(s)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	// Secondary ridges: lines running down and out from the main ridge, darker below, lit above.
	/** @type {Map<number, number>} */
	const ribs = new Map();
	for (let k = 0; k < 1 + Math.floor(s.hw / 10); k++) {
		let y = s.sy + Math.round(s.ph * (0.2 + s.rand() * 0.4));
		let x = Math.round(s.ridge(y));
		const dir = s.rand() < 0.55 ? -1 : 1;
		for (let step = 0; step < s.hw * 0.6; step++) {
			ribs.set(y * W + x, dir);
			x += dir;
			if (s.rand() < 0.6) {
				y += 1;
			}
		}
	}
	footShadow(canvas, fp, own, [s.bx, s.bx + s.hw + 3, s.by - 2, s.by + 1]);
	for (const [x, y] of pixels(s)) {
		if (x < 0 || y < 0 || x >= W || y >= fp.h) {
			continue;
		}
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + BAYER[(y % 4) * 4 + (x % 4)] * 0.25;
		let col;
		if (y < s.snow(x)) {
			col = lit
				? n > 0.3
					? C.snow
					: C.snowShade
				: n > 0.75
					? C.snow
					: C.snowShade;
		} else if (lit) {
			col = n > 0.66 ? C.stoneLight : n > 0.32 ? C.stone : C.stoneMid;
		} else {
			col = n > 0.62 ? C.stoneMid : n > 0.3 ? C.stoneShade : C.roofShade;
		}
		if (ribs.has(i)) {
			col = y < s.snow(x) ? C.snowShade : lit ? C.stoneMid : C.roofShade;
		} else if (ribs.has(i + W) && y >= s.snow(x)) {
			col = lit ? C.stoneLight : C.stoneMid;
		}
		// The lower slopes turn to meadow: more of it the nearer the foot, dithered.
		const green = Math.max(0, (depth - 0.5) / 0.5);
		if (
			green ** 1.2 >
			0.5 - BAYER[(y % 4) * 4 + (x % 4)] + (grain(x + 50, y) - 0.5) * 0.5
		) {
			col = lit
				? n > 0.55
					? C.alpineMeadowLight
					: C.alpineMeadow
				: n > 0.5
					? C.alpineMeadowShade
					: C.alpineMeadowDeep;
		}
		// Outline only the rock; the foot has none, so it sinks into the ground.
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < 0.55) {
			col = C.ink;
		} else if (edge && !own.has(i + 1) && depth < 0.85) {
			col = C.alpineMeadowDark;
		}
		put(canvas, fp.reach, x, y, col);
	}
}

/**
 * A low foothill: a rounded mound in the meadow's colours.
 * @param {{ bx: number, by: number, hw: number, ph: number }} h
 */
function hillShape(h) {
	/** @type {number[][]} */
	const rows = [];
	for (let y = h.by - h.ph; y <= h.by; y++) {
		const v = (h.by - y) / h.ph;
		const half = Math.round(h.hw * Math.sqrt(Math.max(0, 1 - v * v)));
		rows.push([y, h.bx - half, h.bx + half]);
	}
	return { ...h, rows };
}

/** @typedef {ReturnType<typeof hillShape>} Hill */

/**
 * @param {Hill} h
 * @returns {Generator<number[]>} Each pixel as [x, y]
 */
function* hillPixels(h) {
	for (const [y, a, b] of h.rows) {
		for (let x = a; x <= b; x++) {
			yield [x, y];
		}
	}
}

/**
 * Draws a foothill, lit on the left, with a few stones.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Hill} h
 */
function drawHill(canvas, fp, h) {
	const W = fp.w;
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of hillPixels(h)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(h.bx, h.by, 31), 2);
	const rand = seededRandom(hash(h.bx, h.by, 5));
	footShadow(canvas, fp, own, [h.bx, h.bx + h.hw + 2, h.by - 1, h.by + 1]);
	for (const [x, y] of hillPixels(h)) {
		const u = (x - h.bx) / h.hw;
		const v = (h.by - y) / h.ph;
		const light =
			-u * 0.8 +
			v * 0.6 +
			(grain(x, y) - 0.5) * 0.6 +
			BAYER[(y % 4) * 4 + (x % 4)] * 0.3;
		let col =
			light > 0.35
				? C.alpineMeadowLight
				: light > -0.15
					? C.alpineMeadow
					: light > -0.55
						? C.alpineMeadowShade
						: C.alpineMeadowDeep;
		// A lit rim along the top, darker where it turns away.
		if (!own.has(y * W + x - W)) {
			col = u < 0.2 ? C.alpineMeadowPale : C.alpineMeadowShade;
		}
		put(canvas, fp.reach, x, y, col);
	}
	for (let k = 0; k < Math.floor(h.hw / 4); k++) {
		const x = h.bx + Math.round((rand() - 0.5) * h.hw);
		const y = h.by - Math.round(rand() * h.ph * 0.6);
		if (own.has(y * W + x) && own.has(y * W + x + 1)) {
			put(canvas, fp.reach, x, y, C.stoneLight);
			put(canvas, fp.reach, x + 1, y, C.stoneShade);
		}
	}
}

/**
 * Packs snow-capped peaks and foothills into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintMountains(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, fp, seed);
	const rand = seededRandom(hash(seed, 21));
	const covered = new Uint8Array(W * H);
	/** @type {Peak[]} */
	const peaks = [];
	/** @type {(s: Peak, ok: Uint8Array) => number} */
	const fresh = (s, ok) => {
		let n = 0;
		let total = 0;
		for (const [x, y] of pixels(s)) {
			if (x < 0 || y < 0 || x >= W || y >= H || !ok[y * W + x]) {
				return -1;
			}
			total++;
			if (mask[y * W + x] && !covered[y * W + x]) {
				n++;
			}
		}
		return n / total;
	};
	/** @type {(s: Peak) => void} */
	const add = (s) => {
		peaks.push(s);
		for (const [x, y] of pixels(s)) {
			covered[y * W + x] = 1;
		}
	};
	// A peak stands over each corner join, so the two sides read as one range.
	for (const { gx, gy } of corners) {
		const s = peakShape({ bx: gx, by: gy + 10, hw: 11, ph: 18 }, seed);
		if (fresh(s, reach) >= 0) {
			add(s);
		}
	}
	for (const hw of [30, 25, 21, 17, 14, 11, 9, 7]) {
		/** @type {number[][]} */
		const spots = [];
		for (let by = H - 1; by >= 4; by -= 2) {
			/** @type {number[][]} */
			const row = [];
			for (let bx = 0; bx < W; bx += 2) {
				row.push([bx, by]);
			}
			for (let i = row.length - 1; i > 0; i--) {
				const j = Math.floor(rand() * (i + 1));
				[row[i], row[j]] = [row[j], row[i]];
			}
			spots.push(...row);
		}
		for (const [bx, by] of spots) {
			if (!mask[by * W + bx]) {
				continue;
			}
			const s = peakShape(
				{ bx, by, hw, ph: Math.round(hw * (1.05 + rand() * 0.25)) },
				seed
			);
			if (fresh(s, plots) < 0.45) {
				continue;
			}
			add(s);
		}
	}
	// Foothills along every open side, in front of the peaks' feet, and below each corner join.
	/** @type {Hill[]} */
	const hills = [];
	/** @type {(h: PeakSpec, where: Uint8Array) => void} */
	const tryHill = (h, where) => {
		const shape = hillShape(h);
		for (const [x, y] of hillPixels(shape)) {
			if (x < 0 || y < 0 || x >= W || y >= H || !where[y * W + x]) {
				return;
			}
		}
		hills.push(shape);
	};
	/** @type {(r: number, c: number) => boolean} */
	const blocked = (r, c) =>
		r >= 0 &&
		c >= 0 &&
		r < fp.rows &&
		c < fp.cols &&
		plots[(r * PITCH + 16) * W + c * PITCH + 16] === 1;
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) {
				continue;
			}
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			const hr = seededRandom(hash(r, c, seed, 17));
			const size = () => ({
				hw: 7 + Math.floor(hr() * 4),
				ph: 5 + Math.floor(hr() * 3),
			});
			if (!blocked(r + 1, c)) {
				tryHill(
					{
						bx: x0 + 8 + Math.floor(hr() * 3),
						by: y0 + 31 - Math.floor(hr() * 2),
						...size(),
					},
					plots
				);
				tryHill(
					{
						bx: x0 + 22 + Math.floor(hr() * 3),
						by: y0 + 31 - Math.floor(hr() * 2),
						...size(),
					},
					plots
				);
			}
			if (!blocked(r, c - 1)) {
				tryHill(
					{
						bx: x0 + 6,
						by: y0 + 20 + Math.floor(hr() * 8),
						hw: 6,
						ph: 5 + Math.floor(hr() * 2),
					},
					plots
				);
			}
			if (!blocked(r, c + 1)) {
				tryHill(
					{
						bx: x0 + 25,
						by: y0 + 20 + Math.floor(hr() * 8),
						hw: 6,
						ph: 5 + Math.floor(hr() * 2),
					},
					plots
				);
			}
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		tryHill({ bx: gx - 5 * f, by: gy + 13, hw: 5, ph: 4 }, reach);
		tryHill({ bx: gx + 4 * f, by: gy + 11, hw: 5, ph: 5 }, reach);
	}
	const scene = [
		...peaks.map((p) => ({ p, h: null, by: p.by, order: 0 })),
		...hills.map((h) => ({ p: null, h, by: h.by, order: 1 })),
	];
	scene.sort((a, b) => a.by - b.by || a.order - b.order);
	for (const item of scene) {
		if (item.p) {
			drawPeak(canvas, fp, item.p);
		} else if (item.h) {
			drawHill(canvas, fp, item.h);
		}
	}
}
