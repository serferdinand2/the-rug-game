// Sandstone outcrops packed into a mat's impassable footprint: flat-topped buttes and rounded boulders, with sand dunes as their foothills (#82).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { cast, put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { BAYER, hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/**
 * A sandstone rock standing on its base pixel.
 * @typedef {Object} RockSpec
 * @property {'butte' | 'boulder'} kind - A flat-topped butte or a rounded boulder
 * @property {number} bx - The base's middle
 * @property {number} by - The base's row
 * @property {number} hw - The half-width at the base
 * @property {number} ph - The height
 */

/** @typedef {{ bx: number, by: number, hw: number, ph: number }} DuneSpec */

/**
 * A joint in the rock: a crack running down it, as its x on each row from `from` to `to`.
 * @typedef {{ from: number, to: number, xs: Map<number, number> }} Joint
 */

/** Sandstone tones, light to dark: warm tan and ochre, with the Mesa's soil only in the deepest shade. */
const ROCK = [
	C.sandLight,
	C.sand,
	C.sandShade,
	C.mesaSoilShade,
	C.mesaSoilDark,
];

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = /** @type {Record<string, string>} */ ({
	[C.sandLight]: C.sand,
	[C.sand]: C.sandShade,
	[C.sandShade]: C.mesaSoilShade,
	[C.mesaSoilShade]: C.mesaSoilDark,
});

/** The rock pieces over a corner join: a butte and a boulder at its foot, [kind, dx, dy, hw, ph], mirrored by the join's direction. */
const CORNER =
	/** @type {[RockSpec['kind'], number, number, number, number][]} */ ([
		['butte', 0, 9, 9, 17],
		['boulder', -6, 11, 4, 4],
	]);

/**
 * Which rock tone a light value gives, from 0 (lit) to 4 (deep shade).
 * @param {number} light - About -1 (turned away) to 1 (facing the sun)
 * @returns {number}
 */
function tone(light) {
	if (light > 0.55) {
		return 0;
	}
	if (light > 0.1) {
		return 1;
	}
	if (light > -0.3) {
		return 2;
	}
	return light > -0.7 ? 3 : 4;
}

/**
 * The ordered-dither offset of a pixel.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function dither(x, y) {
	return BAYER[(y % 4) * 4 + (x % 4)];
}

/**
 * One step of a rough edge: it wanders by a pixel now and then, never more than one either way.
 * @param {number} at
 * @param {() => number} rand
 * @returns {number}
 */
function wander(at, rand) {
	const step = rand() < 0.4 ? (rand() < 0.5 ? -1 : 1) : 0;
	return Math.max(-1, Math.min(1, at + step));
}

/**
 * A joint's x on a row; above or below it, the x of its end.
 * @param {Joint} j
 * @param {number} y
 * @returns {number}
 */
function jointAt(j, y) {
	return /** @type {number} */ (
		j.xs.get(Math.max(j.from, Math.min(j.to, y)))
	);
}

/**
 * A soft sand floor under the group: in the shade of the rocks, ragged at its edge so it fades into the ground.
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
			const roll = rand();
			put(
				canvas,
				mask,
				x,
				y,
				roll < 0.22
					? C.sand
					: roll < 0.27
						? C.mesaSoilShade
						: C.sandShade
			);
		}
	}
}

/**
 * Works out a rock's rows and joints: a butte's squarish flat top seen from above, its cliffs split
 * into facets by joints, and the scree that flares out at its foot; or a boulder's rounded dome with a crack.
 * @param {RockSpec} r
 * @param {number} seed
 */
function rockShape(r, seed) {
	const rand = seededRandom(hash(r.bx, r.by, r.hw, r.ph, seed));
	const sy = r.by - r.ph;
	const butte = r.kind === 'butte';
	const tw = butte
		? Math.max(3, Math.round(r.hw * (0.42 + rand() * 0.13)))
		: 0;
	const cap = butte ? Math.max(1, Math.round(tw * 0.25)) : 0;
	// Where a butte's cliffs end and its scree begins, or where a boulder is widest.
	const knee = butte
		? sy + 2 * cap + Math.round((r.ph - 2 * cap) * (0.5 + rand() * 0.15))
		: sy + Math.round(r.ph * 0.55);
	const cliff = tw + (knee - sy - cap) * 0.14;
	/** @type {number[][]} Each row as [y, left, right] */
	const rows = [];
	let left = 0;
	let right = 0;
	for (let y = sy; y <= r.by; y++) {
		let half;
		if (butte && y < sy + cap) {
			// The far half of the flat top: a squarish ellipse.
			const v = (sy + cap - y) / (cap + 0.5);
			half = tw * (1 - v * v) ** 0.25;
		} else if (butte && y < knee) {
			half = tw + (y - sy - cap) * 0.14;
		} else if (butte) {
			const s = (y - knee) / Math.max(1, r.by - knee);
			half = cliff + (r.hw - cliff) * s ** 1.4;
		} else if (y < knee) {
			const v = (knee - y) / (knee - sy + 0.5);
			half = r.hw * Math.sqrt(1 - v * v);
		} else {
			half = r.hw * (1 + ((y - knee) / Math.max(1, r.by - knee)) * 0.15);
		}
		// The rock's sides are rough; a butte's flat top is not.
		if (!butte || y >= sy + cap) {
			left = wander(left, rand);
			right = wander(right, rand);
		}
		rows.push([
			y,
			Math.round(r.bx - half) - left,
			Math.round(r.bx + half) + right,
		]);
	}
	/** @type {Joint[]} */
	const joints = [];
	const count = butte ? 1 + Math.floor(tw / 6) : r.hw >= 5 ? 1 : 0;
	for (let k = 0; k < count; k++) {
		// A butte's joints spread across its cliffs; a boulder's crack runs down from near its top.
		let x = butte
			? Math.round(
					r.bx -
						tw +
						((k + 1) / (count + 1)) * 2 * tw +
						rand() * 2 -
						1
				)
			: r.bx + Math.round((rand() - 0.6) * r.hw * 0.6);
		const from = butte ? sy + 2 * cap + 1 : sy + 1;
		const to = butte ? knee + 2 : sy + Math.round(r.ph * 0.6);
		const drift = butte ? 0 : rand() < 0.5 ? -1 : 1;
		/** @type {Map<number, number>} */
		const xs = new Map();
		for (let y = from; y <= to; y++) {
			xs.set(y, x);
			if (rand() < (butte ? 0.2 : 0.45)) {
				x += drift || (rand() < 0.5 ? -1 : 1);
			}
		}
		joints.push({ from, to, xs });
	}
	// Blocks fallen from a butte's cliffs lie on its scree, to either side: [x, y, radius].
	/** @type {number[][]} */
	const blocks = [];
	for (let k = 0; butte && k < 1 + Math.floor(r.hw / 8); k++) {
		const side = k % 2 === 0 ? -1 : 1;
		const out = tw + 1 + Math.floor(rand() * Math.max(1, r.hw - tw - 3));
		blocks.push([
			r.bx + side * out,
			knee + 2 + Math.floor(rand() * Math.max(1, r.by - knee - 4)),
			1.5 + rand(),
		]);
	}
	// How far down the rock is bare, outlined and lit: below it the foot turns to sand.
	const bare = butte ? (knee - sy) / r.ph : 0.8;
	return { ...r, sy, tw, cap, knee, bare, rows, joints, blocks };
}

/** @typedef {ReturnType<typeof rockShape>} Rock */

/**
 * @param {{ rows: number[][] }} shape
 * @returns {Generator<number[]>} Each pixel as [x, y]
 */
function* pixels(shape) {
	for (const [y, a, b] of shape.rows) {
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
 * @param {Uint8Array} ok - Where the shadow may fall
 * @param {Set<number>} own
 * @param {number[]} box - x0, x1, y0, y1
 */
function footShadow(canvas, fp, ok, own, [x0, x1, y0, y1]) {
	for (let x = x0; x <= x1; x++) {
		for (let y = y0; y <= y1; y++) {
			if (x < 0 || y < 0 || x >= fp.w || y >= fp.h) {
				continue;
			}
			const i = y * fp.w + x;
			if (!ok[i] || own.has(i)) {
				continue;
			}
			if (dither(x, y) < 0.15) {
				cast(canvas, x, y, 0.3, DARKER);
			}
		}
	}
}

/**
 * The tone of a pixel on a rock: a butte's pale flat top, its cliffs in flat facets from tan on the left
 * to ochre on the right, or a boulder's dome lit from the upper left.
 * @param {Rock} s
 * @param {number} x
 * @param {number} y
 * @param {number} u - Across the row, -1 on the left to 1 on the right
 * @param {number} n - The grain, about -0.5 to 0.5
 * @param {(x: number, y: number) => boolean} onTop
 * @returns {number} 0 (lit) to 4 (deep shade)
 */
function rockTone(s, x, y, u, n, onTop) {
	if (s.kind === 'boulder') {
		const depth = (y - s.sy) / s.ph;
		const crack = s.joints.some(
			(j) => y >= j.from && y <= j.to && j.xs.get(y) === x
		);
		const k = tone(-u * 0.75 + (0.3 - depth) * 1.2 + n * 0.4);
		return crack ? Math.min(4, k + 2) : k;
	}
	if (onTop(x, y)) {
		// The flat top faces the sun, palest of all; its front rim catches the light.
		return onTop(x, y + 1) && u > 0.3 && n < -0.05 ? 1 : 0;
	}
	const facet = s.joints.filter((j) => jointAt(j, y) < x).length;
	const at = (facet + 0.5) / (s.joints.length + 1);
	let k = tone(0.6 - at * 1.3 - u * 0.25 + n * 0.5);
	if (hash(x, y, s.bx, s.by) % 100 < 4) {
		// A weathering pit.
		k = Math.min(4, k + 1);
	}
	if (s.joints.some((j) => jointAt(j, y) === x && y >= j.from)) {
		// A joint: a dark crack between two facets.
		k = Math.min(4, k + 2);
	} else if (s.joints.some((j) => jointAt(j, y) === x + 1 && y >= j.from)) {
		// The lit edge of the facet beside it.
		k = Math.max(0, k - 1);
	}
	// A ledge of shade under the rim.
	return onTop(x, y - 1) ? Math.min(4, k + 1) : k;
}

/**
 * Draws a rock lit from the left, with an ink outline on the upper rock only and a foot that turns to sand.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Rock} s
 * @param {Uint8Array} ok - Where it may paint
 */
function drawRock(canvas, fp, s, ok) {
	const W = fp.w;
	/** @type {Set<number>} */
	const own = new Set();
	/** @type {Map<number, number[]>} */
	const span = new Map();
	for (const [y, a, b] of s.rows) {
		span.set(y, [a, b]);
		for (let x = a; x <= b; x++) {
			own.add(y * W + x);
		}
	}
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	const capY = s.sy + s.cap;
	/** Whether a pixel lies on a butte's flat top: a squarish ellipse. */
	const onTop = (/** @type {number} */ x, /** @type {number} */ y) => {
		if (s.kind !== 'butte') {
			return false;
		}
		const u = (x - s.bx) / (s.tw + 0.5);
		const v = (y - capY) / (s.cap + 0.5);
		return u * u * u * u + v * v <= 1;
	};
	footShadow(canvas, fp, ok, own, [
		s.bx,
		s.bx + s.hw + 3,
		s.by - 2,
		s.by + 1,
	]);
	for (const [x, y] of pixels(s)) {
		if (x < 0 || y < 0 || x >= W || y >= fp.h) {
			continue;
		}
		const i = y * W + x;
		const [a, b] = /** @type {number[]} */ (span.get(y));
		const u = (x - (a + b) / 2) / Math.max(1, (b - a) / 2);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.5;
		let col = ROCK[rockTone(s, x, y, u, n, onTop)];
		// The foot turns to sand: more of it the nearer the ground, dithered.
		const sand = Math.max(0, (depth - s.bare) / (1 - s.bare));
		if (sand ** 1.2 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5) {
			col =
				u < 0
					? n > 0.1
						? C.sandLight
						: C.sand
					: n > 0
						? C.sand
						: C.sandShade;
		}
		// Outline only the upper rock; the foot has none, so it sinks into the sand.
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < s.bare) {
			col = C.ink;
		} else if (edge && !own.has(i + 1) && sand < 0.6) {
			col = C.mesaSoilDark;
		}
		put(canvas, ok, x, y, col);
	}
	// The fallen blocks: small rounded rocks, lit on the upper left and dark on the lower right.
	for (const [bx, by, r] of s.blocks) {
		const reach = Math.ceil(r);
		for (let dy = -reach; dy <= reach; dy++) {
			for (let dx = -reach; dx <= reach; dx++) {
				const q = (dx * dx) / (r * r) + (dy * dy) / (r * r * 0.55);
				const x = bx + dx;
				const y = by + dy;
				if (q > 1 || !own.has(y * W + x)) {
					continue;
				}
				const rim = q > 0.5 && dx + dy > 0;
				const lit = -dx - dy * 1.5;
				put(
					canvas,
					ok,
					x,
					y,
					rim
						? C.mesaSoilDark
						: ROCK[lit > 1 ? 0 : lit > -0.5 ? 1 : 3]
				);
			}
		}
	}
}

/**
 * A sand dune: a gentle windward slope on the left, a steep slip face on the right and a sharp crest between.
 * @param {DuneSpec} d
 */
function duneShape(d) {
	const sy = d.by - d.ph;
	const cx = d.bx + Math.round(d.hw * 0.3);
	const lw = cx - (d.bx - d.hw);
	const rw = d.bx + d.hw - cx;
	/** @type {number[][]} */
	const rows = [];
	for (let y = sy; y <= d.by; y++) {
		const s = Math.sqrt((y - sy + 0.5) / (d.ph + 0.5));
		rows.push([y, cx - Math.round(lw * s), cx + Math.round(rw * s)]);
	}
	return { ...d, sy, cx, rows };
}

/** @typedef {ReturnType<typeof duneShape>} Dune */

/**
 * Draws a dune: its windward side lit, its slip face in shade, with no outline.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Dune} d
 * @param {Uint8Array} ok - Where it may paint
 */
function drawDune(canvas, fp, d, ok) {
	const W = fp.w;
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of pixels(d)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(d.bx, d.by, 31), 2);
	footShadow(canvas, fp, ok, own, [
		d.cx,
		d.bx + d.hw + 2,
		d.by - 1,
		d.by + 1,
	]);
	for (const [x, y] of pixels(d)) {
		const v = (d.by - y) / d.ph;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.6;
		let col;
		if (x === d.cx && v > 0.25) {
			col = C.sandLight;
		} else if (x < d.cx) {
			col = n + v * 0.5 > 0.3 ? C.sandLight : C.sand;
		} else {
			col = n - v * 0.3 > 0.4 ? C.sand : C.sandShade;
		}
		// A lit rim on the windward side, darker where it turns away.
		if (!own.has(y * W + x - W)) {
			col = x <= d.cx ? C.sandLight : C.sandShade;
		}
		put(canvas, ok, x, y, col);
	}
}

/**
 * Packs sandstone buttes, boulders and dunes into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintDesert(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, fp, seed);
	// Dunes along every open side, in front of the rocks' feet, and below each corner join. They come
	// first, so the boulders can keep off them.
	/** @type {{ d: Dune, ok: Uint8Array }[]} */
	const dunes = [];
	/** @type {(d: DuneSpec, ok: Uint8Array) => void} */
	const tryDune = (d, ok) => {
		const shape = duneShape(d);
		for (const [x, y] of pixels(shape)) {
			if (x < 0 || y < 0 || x >= W || y >= H || !ok[y * W + x]) {
				return;
			}
		}
		dunes.push({ d: shape, ok });
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
			const dr = seededRandom(hash(r, c, seed, 19));
			const size = () => ({
				hw: 7 + Math.floor(dr() * 4),
				ph: 4 + Math.floor(dr() * 3),
			});
			if (!blocked(r + 1, c)) {
				tryDune(
					{
						bx: x0 + 8 + Math.floor(dr() * 3),
						by: y0 + 31 - Math.floor(dr() * 2),
						...size(),
					},
					plots
				);
				tryDune(
					{
						bx: x0 + 22 + Math.floor(dr() * 3),
						by: y0 + 31 - Math.floor(dr() * 2),
						...size(),
					},
					plots
				);
			}
			if (!blocked(r, c - 1)) {
				tryDune(
					{
						bx: x0 + 6,
						by: y0 + 20 + Math.floor(dr() * 8),
						hw: 6,
						ph: 4 + Math.floor(dr() * 2),
					},
					plots
				);
			}
			if (!blocked(r, c + 1)) {
				tryDune(
					{
						bx: x0 + 25,
						by: y0 + 20 + Math.floor(dr() * 8),
						hw: 6,
						ph: 4 + Math.floor(dr() * 2),
					},
					plots
				);
			}
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		tryDune({ bx: gx - 5 * f, by: gy + 14, hw: 5, ph: 3 }, reach);
		tryDune({ bx: gx + 5 * f, by: gy + 12, hw: 5, ph: 4 }, reach);
	}
	const bank = new Uint8Array(W * H);
	for (const { d } of dunes) {
		for (const [x, y] of pixels(d)) {
			bank[y * W + x] = 1;
		}
	}
	const rand = seededRandom(hash(seed, 23));
	const covered = new Uint8Array(W * H);
	/** @type {{ s: Rock, ok: Uint8Array }[]} */
	const rocks = [];
	/** @type {(s: Rock, ok: Uint8Array) => number} */
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
	/**
	 * Whether a boulder may stand here: in front of every rock so far, though it may hide the foot of
	 * one, behind the dunes, and on ground that is still a third open.
	 * @type {(s: Rock) => boolean}
	 */
	const inFront = (s) => {
		for (let y = s.by + 1; y <= Math.min(H - 1, s.by + 3); y++) {
			for (let x = s.bx - s.hw; x <= s.bx + s.hw; x++) {
				if (covered[y * W + x]) {
					return false;
				}
			}
		}
		let banked = 0;
		let total = 0;
		for (const [x, y] of pixels(s)) {
			total++;
			banked += bank[y * W + x];
		}
		return banked <= 0.15 * total && fresh(s, plots) >= 0.35;
	};
	/** @type {(s: Rock, ok: Uint8Array) => void} */
	const add = (s, ok) => {
		rocks.push({ s, ok });
		for (const [x, y] of pixels(s)) {
			covered[y * W + x] = 1;
		}
	};
	// An outcrop stands over each corner join, so the two sides read as one.
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [kind, dx, dy, hw, ph] of CORNER) {
			const s = rockShape(
				{ kind, bx: gx + dx * f, by: gy + dy, hw, ph },
				seed
			);
			if (fresh(s, reach) >= 0) {
				add(s, reach);
			}
		}
	}
	for (const hw of [24, 19, 15, 12, 9, 7, 5]) {
		// The big rocks are buttes, the small ones boulders, which stand only where they would show.
		const butte = hw >= 9;
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
			const tall = rand();
			const ph = butte
				? Math.round(Math.min(hw * (0.95 + tall * 0.6), 10 + hw * 0.8))
				: Math.round(hw * (0.8 + tall * 0.2));
			// Test the base's ends and the top before the whole shape.
			if (
				bx - hw < 0 ||
				bx + hw >= W ||
				by - ph < 0 ||
				!plots[by * W + bx - hw] ||
				!plots[by * W + bx + hw] ||
				!plots[(by - ph) * W + bx]
			) {
				continue;
			}
			const s = rockShape(
				{ kind: butte ? 'butte' : 'boulder', bx, by, hw, ph },
				seed
			);
			if (butte ? fresh(s, plots) < 0.65 : !inFront(s)) {
				continue;
			}
			add(s, plots);
		}
	}
	const scene = [
		...rocks.map(({ s, ok }) => ({ s, d: null, ok, by: s.by, order: 0 })),
		...dunes.map(({ d, ok }) => ({ s: null, d, ok, by: d.by, order: 1 })),
	];
	scene.sort((a, b) => a.by - b.by || a.order - b.order);
	// A rock that the rocks in front of it would mostly hide shows only stray bits of outline: leave it
	// out. A butte must show two thirds of itself past the rocks and dunes in front, and a boulder,
	// which keeps off the dunes, nearly all of itself past the rocks. A corner's rocks always stay.
	const rocksInFront = new Uint8Array(W * H);
	const dunesInFront = new Uint8Array(W * H);
	/** @type {Set<Rock>} */
	const hidden = new Set();
	for (const { s, d, ok } of [...scene].reverse()) {
		if (d) {
			for (const [x, y] of pixels(d)) {
				dunesInFront[y * W + x] = 1;
			}
			continue;
		}
		if (!s) {
			continue;
		}
		const butte = s.kind === 'butte';
		let seen = 0;
		let total = 0;
		for (const [x, y] of pixels(s)) {
			const i = y * W + x;
			total++;
			seen += rocksInFront[i] || (butte && dunesInFront[i]) ? 0 : 1;
		}
		if (ok !== reach && seen < (butte ? 0.65 : 0.95) * total) {
			hidden.add(s);
			continue;
		}
		for (const [x, y] of pixels(s)) {
			rocksInFront[y * W + x] = 1;
		}
	}
	for (const item of scene) {
		if (item.s && !hidden.has(item.s)) {
			drawRock(canvas, fp, item.s, item.ok);
		} else if (item.d) {
			drawDune(canvas, fp, item.d, item.ok);
		}
	}
}
