// Rolling grassy hills packed into a mat's impassable footprint, with grey boulder tors on their crests (#82).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { cast, put } from './canvas.js';
import { distanceInside } from './footprint.js';
import { BAYER, hash, noise } from './ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('./footprint.js').Footprint} Footprint */

/**
 * A hill standing on its base pixel.
 * @typedef {Object} HillSpec
 * @property {number} bx - The base's middle
 * @property {number} by - The base's row
 * @property {number} hw - The half-width at the base
 * @property {number} ph - The height
 * @property {boolean} [tor] - Whether a tor stands on its crest
 */

/**
 * One boulder of a tor: a rounded slab around (cx, cy).
 * @typedef {{ cx: number, cy: number, rx: number, ry: number }} Boulder
 */

/** The hills' grass, lit to deep shade: a step greener than the golden meadow they rise from. */
const GRASS = [C.grassLight, C.grass, C.grassShade, C.forestFloor];

/** The tors' granite, lit to shade. */
const STONE = [C.stoneLight, C.stone, C.stoneMid, C.stoneShade];

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = /** @type {Record<string, string>} */ ({
	[C.grassLight]: C.grass,
	[C.grass]: C.grassShade,
	[C.grassShade]: C.forestFloor,
	[C.forestFloor]: C.forestFloorShade,
	[C.savannaGoldLight]: C.savannaGold,
	[C.savannaGold]: C.savannaGoldShade,
});

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
 * A calm floor under the group, in the valleys' green with a few golden blades: ragged at its edge, so it
 * fades into the meadow.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {number} seed
 */
function drawFloor(canvas, fp, seed) {
	const { w, h, mask } = fp;
	const ragged = noise(seed + 3, 3);
	const patches = noise(seed + 4, 4);
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
			const n = patches(x, y) + dither(x, y) * 0.3;
			put(
				canvas,
				mask,
				x,
				y,
				hash(x, y, seed) % 37 === 0
					? C.savannaGold
					: n < 0.38
						? C.grassShade
						: C.grass
			);
		}
	}
}

/**
 * Works out a hill's rows, a rounded dome, and the tor on its crest: two or three boulders side by side,
 * sunk a little into the grass, with one or two more stacked on them.
 * @param {HillSpec} h
 * @param {number} seed
 */
function hillShape(h, seed) {
	/** @type {number[][]} Each row as [y, left, right] */
	const rows = [];
	for (let y = h.by - h.ph; y <= h.by; y++) {
		const v = (h.by - y) / h.ph;
		const half = Math.round(h.hw * Math.sqrt(Math.max(0, 1 - v * v)));
		rows.push([y, h.bx - half, h.bx + half]);
	}
	/** @type {Boulder[]} From the back to the front */
	const tor = [];
	if (h.tor) {
		const rand = seededRandom(hash(h.bx, h.by, h.hw, seed));
		const tw = Math.max(3, Math.min(8, Math.round(h.hw * 0.38)));
		const cx = h.bx + Math.round((rand() - 0.55) * h.hw * 0.25);
		// The tor's foot sits two rows into the crest.
		const foot = h.by - h.ph + 2;
		const n = tw >= 5 ? 3 : 2;
		const ry = tw >= 5 ? 3 : 2;
		const span = (2 * tw + 1) / n;
		/** @type {Boulder[]} */
		const base = [];
		for (let k = 0; k < n; k++) {
			base.push({
				cx: cx - tw + span * (k + 0.5) + Math.round(rand() - 0.5),
				cy: foot - ry - (k === 1 ? 1 : 0),
				rx: span / 2 + 0.4,
				ry,
			});
		}
		// One slab, or two for a big tor, lying on the boulders below.
		const top = foot - 2 * ry - 1;
		const upper = tw >= 6 ? 2 : 1;
		for (let k = 0; k < upper; k++) {
			tor.push({
				cx:
					upper === 1
						? cx + Math.round((rand() - 0.5) * 2)
						: cx + (k === 0 ? -1 : 1) * Math.round(tw * 0.4),
				cy: top + (upper === 2 && k === 1 ? 1 : 0),
				rx: upper === 1 ? tw * 0.6 : tw * 0.42,
				ry: tw >= 7 ? 3 : 2,
			});
		}
		tor.push(...base);
	}
	return { ...h, rows, tor };
}

/** @typedef {ReturnType<typeof hillShape>} Hill */

/**
 * Whether a pixel lies on a boulder: a superellipse, squarer than an ellipse, like weathered granite.
 * @param {Boulder} b
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function onBoulder(b, x, y) {
	const u = Math.abs(x - b.cx) / (b.rx + 0.3);
	const v = Math.abs(y - b.cy) / (b.ry + 0.3);
	return u ** 2.6 + v ** 2.6 <= 1;
}

/**
 * @param {Hill} h
 * @returns {Generator<number[]>} Each pixel of the hill as [x, y]
 */
function* hillPixels(h) {
	for (const [y, a, b] of h.rows) {
		for (let x = a; x <= b; x++) {
			yield [x, y];
		}
	}
}

/**
 * @param {Hill} h
 * @returns {Generator<number[]>} Each pixel of the tor as [x, y, boulder], the front boulder's where they overlap
 */
function* torPixels(h) {
	if (h.tor.length === 0) {
		return;
	}
	const x0 = Math.floor(Math.min(...h.tor.map((b) => b.cx - b.rx)));
	const x1 = Math.ceil(Math.max(...h.tor.map((b) => b.cx + b.rx)));
	const y0 = Math.floor(Math.min(...h.tor.map((b) => b.cy - b.ry)));
	const y1 = Math.ceil(Math.max(...h.tor.map((b) => b.cy + b.ry)));
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			for (let k = h.tor.length - 1; k >= 0; k--) {
				if (onBoulder(h.tor[k], x, y)) {
					yield [x, y, k];
					break;
				}
			}
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
 * Draws a hill, lit on the left and shaded on the right. Near the group's edge its foot turns to the
 * meadow, with no outline; inside the range it stays green, so no pale band shows between the hills.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Hill} h
 * @param {Uint8Array} ok - Where it may paint
 * @param {Float32Array} inside - How far each pixel lies inside the group's floor
 */
function drawHill(canvas, fp, h, ok, inside) {
	const W = fp.w;
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of hillPixels(h)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(h.bx, h.by, 31), 2.5);
	footShadow(canvas, fp, ok, own, [
		h.bx,
		h.bx + h.hw + 3,
		h.by - 2,
		h.by + 1,
	]);
	for (const [x, y] of hillPixels(h)) {
		if (x < 0 || y < 0 || x >= W || y >= fp.h) {
			continue;
		}
		const i = y * W + x;
		// The dome's surface, lit from the upper left and the front.
		const nx = (x - h.bx) / (h.hw + 0.5);
		const ny = (h.by - y) / (h.ph + 0.5);
		const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.6;
		const light = -0.62 * nx + 0.5 * ny + 0.55 * nz + n * 0.35;
		let k = light > 0.78 ? 0 : light > 0.3 ? 1 : light > -0.1 ? 2 : 3;
		// Short dark blades of grass, scattered over the slope.
		if (hash(x, y, h.bx) % 29 === 0 || hash(x, y + 1, h.bx) % 29 === 0) {
			k = Math.min(3, k + 1);
		}
		let col = GRASS[k];
		// The foot turns to the meadow: more of it the nearer the ground, dithered.
		const meadow =
			Math.max(0, (0.22 - ny) / 0.22) *
			Math.min(1, Math.max(0, (8 - inside[i]) / 4));
		if (
			meadow ** 1.3 >
			0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5
		) {
			col =
				nx < 0.2
					? n > 0.2
						? C.savannaGoldLight
						: C.grassLight
					: C.grass;
		}
		// A big hill has a soft dark contour over its crest and down its shaded side, with a lit crest
		// under it on the left; a small one only a rim, lit on the left and darker where it turns away.
		const top = !own.has(i - W);
		if (h.hw < 12) {
			if (top) {
				col = nx < 0.2 ? C.grassLight : C.grassShade;
			}
		} else if (top && ny > 0.3) {
			col = nx < -0.25 ? C.grassShade : C.forestFloor;
		} else if (!own.has(i + 1) && ny > 0.4) {
			col = C.forestFloor;
		} else if (!own.has(i - 2 * W) && nx < 0.35 && ny > 0.3) {
			col = nx < -0.1 ? C.jungleLeafLight : C.grassLight;
		}
		put(canvas, ok, x, y, col);
	}
	if (h.tor.length > 0) {
		drawTor(canvas, fp, h, ok);
	}
}

/**
 * Draws a hill's tor: grey boulders lit from the upper left, outlined in ink like the Mountain's rock,
 * with grass growing over its foot and a shadow on the crest to its right.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Hill} h
 * @param {Uint8Array} ok - Where it may paint
 */
function drawTor(canvas, fp, h, ok) {
	const W = fp.w;
	/** @type {Map<number, number>} Each pixel's boulder */
	const owner = new Map();
	for (const [x, y, k] of torPixels(h)) {
		owner.set(y * W + x, k);
	}
	const grain = noise(hash(h.bx, h.by, 13), 1.5);
	const foot = Math.max(...h.tor.map((b) => Math.ceil(b.cy + b.ry)));
	const right = Math.max(...h.tor.map((b) => Math.ceil(b.cx + b.rx)));
	// The tor's shadow on the crest, to its right.
	for (let y = foot - 2; y <= foot; y++) {
		for (let x = right - 1; x <= right + 3; x++) {
			const i = y * W + x;
			if (!owner.has(i) && ok[i] && dither(x, y) < 0.25) {
				cast(canvas, x, y, 0.3, DARKER);
			}
		}
	}
	for (const [x, y, k] of torPixels(h)) {
		const i = y * W + x;
		const b = h.tor[k];
		const u = (x - b.cx) / b.rx;
		const v = (y - b.cy) / b.ry;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.5;
		const light = -0.6 * u - 0.75 * v + n * 0.6;
		let col =
			STONE[light > 0.55 ? 0 : light > 0 ? 1 : light > -0.5 ? 2 : 3];
		// Outline the silhouette, and each boulder where it stands in front of one behind it; not the foot.
		/** @type {(j: number) => boolean} */
		const behind = (j) =>
			!owner.has(j) || /** @type {number} */ (owner.get(j)) < k;
		if (behind(i - 1) || behind(i + 1) || behind(i - W)) {
			col = C.ink;
		} else if (
			y >= foot - 1 &&
			!owner.has(i + W) &&
			hash(x, y, 3) % 3 !== 0
		) {
			// Grass grows over the foot.
			col = u < 0 ? C.grass : C.grassShade;
		}
		put(canvas, ok, x, y, col);
	}
}

/**
 * Packs rolling hills, tors on the bigger ones, into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintGrassland(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, fp, seed);
	const rand = seededRandom(hash(seed, 29));
	const covered = new Uint8Array(W * H);
	/** @type {{ h: Hill, ok: Uint8Array }[]} */
	const hills = [];
	/** Whether a hill and its tor lie wholly within `ok`. @type {(h: Hill, ok: Uint8Array) => boolean} */
	const fits = (h, ok) => {
		for (const [x, y] of [...hillPixels(h), ...torPixels(h)]) {
			if (x < 0 || y < 0 || x >= W || y >= H || !ok[y * W + x]) {
				return false;
			}
		}
		return true;
	};
	/** The share of a hill's pixels on floor nothing covers yet. @type {(h: Hill) => number} */
	const fresh = (h) => {
		let n = 0;
		let total = 0;
		for (const [x, y] of hillPixels(h)) {
			total++;
			if (mask[y * W + x] && !covered[y * W + x]) {
				n++;
			}
		}
		return n / total;
	};
	/** Where each tor stands so far, as [x, y], so no two crowd together. @type {number[][]} */
	const tors = [];
	/** @type {(h: Hill, ok: Uint8Array) => void} */
	const add = (h, ok) => {
		hills.push({ h, ok });
		for (const [x, y] of hillPixels(h)) {
			covered[y * W + x] = 1;
		}
		if (h.tor.length > 0) {
			tors.push([h.bx, h.by]);
		}
	};
	// A hill with a tor stands over each corner join, so the two sides read as one range.
	for (const { gx, gy } of corners) {
		const h = hillShape(
			{ bx: gx, by: gy + 9, hw: 11, ph: 9, tor: true },
			seed
		);
		if (fits(h, reach)) {
			add(h, reach);
		}
	}
	for (const hw of [28, 23, 19, 15, 12, 10, 8]) {
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
			const ph = Math.round(hw * (0.72 + rand() * 0.2));
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
			// A hill straight behind one that overlaps it would show only a band, like a terrace: hills
			// behind stand off to one side, so the range rolls.
			if (
				hills.some(
					({ h: q }) =>
						q.by > by &&
						q.by - q.ph - 6 <= by &&
						Math.abs(q.bx - bx) < 0.3 * (q.hw + hw)
				)
			) {
				continue;
			}
			const tor =
				hw >= 15 &&
				tors.every(([tx, ty]) => Math.hypot(tx - bx, ty - by) > 26);
			let h = hillShape({ bx, by, hw, ph, tor }, seed);
			if (fresh(h) < 0.55) {
				continue;
			}
			// A tor that would stand past the plots' top goes on a lower hill, or the hill goes without one.
			const tries = [
				{ bx, by, hw, ph: Math.max(6, ph - 7), tor },
				{ bx, by, hw, ph, tor: false },
			];
			while (!fits(h, plots) && tries.length > 0) {
				h = hillShape(/** @type {HillSpec} */ (tries.shift()), seed);
			}
			if (!fits(h, plots)) {
				continue;
			}
			add(h, plots);
		}
	}
	// Small hills along every open side, in front of the big ones' feet, and below each corner join.
	/** @type {(spec: HillSpec, ok: Uint8Array) => void} */
	const tryHill = (spec, ok) => {
		const h = hillShape(spec, seed);
		if (fits(h, ok)) {
			hills.push({ h, ok });
		}
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
				hw: 5 + Math.floor(hr() * 2),
				ph: 4 + Math.floor(hr() * 2),
			});
			// The ones along the foot stand at the flanks, so they don't ring the hill behind like terraces.
			if (!blocked(r + 1, c)) {
				tryHill(
					{
						bx: x0 + 6 + Math.floor(hr() * 2),
						by: y0 + 31 - Math.floor(hr() * 2),
						...size(),
					},
					plots
				);
				tryHill(
					{
						bx: x0 + 25 + Math.floor(hr() * 2),
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
		tryHill({ bx: gx - 5 * f, by: gy + 14, hw: 5, ph: 4 }, reach);
		tryHill({ bx: gx + 5 * f, by: gy + 12, hw: 5, ph: 5 }, reach);
	}
	hills.sort((a, b) => a.h.by - b.h.by);
	// A hill that the hills in front of it would mostly hide shows only a thin band, like a ring of an
	// onion: leave it out. A tor they would partly hide shows only stray bits of outline: leave it off.
	// The corner's pieces always stay.
	const inFront = new Uint8Array(W * H);
	/** The share of some pixels that nothing in front hides; all of none. @type {(pixels: Iterable<number[]>) => number} */
	const seen = (pixels) => {
		let n = 0;
		let total = 0;
		for (const [x, y] of pixels) {
			total++;
			n += inFront[y * W + x] ? 0 : 1;
		}
		return total ? n / total : 1;
	};
	/** @type {{ h: Hill, ok: Uint8Array }[]} From the front to the back */
	const shown = [];
	for (let k = hills.length - 1; k >= 0; k--) {
		const { ok } = hills[k];
		let { h } = hills[k];
		if (ok !== reach && seen(hillPixels(h)) < 0.5) {
			continue;
		}
		if (ok !== reach && seen(torPixels(h)) < 0.6) {
			h = { ...h, tor: [] };
		}
		for (const [x, y] of [...hillPixels(h), ...torPixels(h)]) {
			inFront[y * W + x] = 1;
		}
		shown.push({ h, ok });
	}
	shown.reverse();
	const inside = distanceInside(mask, W, H);
	for (const { h, ok } of shown) {
		drawHill(canvas, fp, h, ok, inside);
	}
}
