// Cloud City's impassable plots: tall stone pillars rising out of banks of cloud, each puff in its cloud's tint (#132).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { distanceInside } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { drawFloor } from './floor.js';
import { clamp, fitsIn } from './pack.js';
import { dither, rowPixels } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./index.js').MatData} MatData */

/**
 * A puff of cloud: its middle, its radius, and where it may paint.
 * @typedef {{ cx: number, cy: number, r: number, ok: Uint8Array }} Puff
 */

/**
 * A stone pillar standing on its base pixel, leaning a little.
 * @typedef {{ bx: number, by: number, hw: number, ph: number, lean: number, ok?: Uint8Array }} Pillar
 */

/** Each cloud tint's ramp, from its sunlit top to its rim: white, light, base, dark and rim, by tint index. */
const RAMPS = Object.freeze([
	Object.freeze([
		C.white,
		C.white,
		C.cloudWhiteBase,
		C.cloudShade,
		C.cloudWhiteRim,
	]),
	Object.freeze([
		C.white,
		C.cloudGreyLight,
		C.cloudGreyBase,
		C.cloudGreyDark,
		C.cloudGreyRim,
	]),
	Object.freeze([
		C.white,
		C.creamLight,
		C.cloudTanBase,
		C.cloudTanDark,
		C.cloudTanRim,
	]),
	Object.freeze([
		C.white,
		C.creamLight,
		C.cloudCreamBase,
		C.creamShade,
		C.cloudCreamRim,
	]),
]);

/**
 * A cloud tint's ramp, from its sunlit top to its rim.
 * @param {number} tint - A tint index, 0 (white) to 3 (cream)
 * @returns {readonly string[]}
 */
export function cloudRamp(tint) {
	return RAMPS[tint];
}

/**
 * The tint of the cloud each pixel of a mat lies in; white where the mat has no clouds.
 * @param {Footprint} fp
 * @param {MatData} mat
 * @returns {(x: number, y: number) => number} A tint index
 */
export function cloudTint(fp, mat) {
	const { clouds, tints } = mat;
	return (x, y) => {
		if (!clouds || !tints) {
			return 0;
		}
		const row = Math.min(fp.rows - 1, Math.floor(y / PITCH));
		const col = Math.min(fp.cols - 1, Math.floor(x / PITCH));
		return tints[Number(clouds[row][col])];
	};
}

/**
 * A puff's rows: a disc flattened a little at its base.
 * @param {Puff} p
 * @returns {number[][]}
 */
function puffRows(p) {
	/** @type {number[][]} */
	const rows = [];
	for (
		let y = Math.round(p.cy - p.r);
		y <= Math.round(p.cy + p.r * 0.6);
		y++
	) {
		const v = (y - p.cy) / p.r;
		const half = Math.round(p.r * Math.sqrt(Math.max(0, 1 - v * v)));
		rows.push([y, p.cx - half, p.cx + half]);
	}
	return rows;
}

/**
 * Makes a painter for a bank of puffs. Each puff is lit from the upper left, its belly in shade and its base
 * melting down, all in the tint of the cloud under its middle. Only the bank's outside is outlined, so the
 * puffs inside read as one cloud, parted by soft shade.
 * @param {Canvas} canvas
 * @param {readonly Puff[]} puffs - Every puff of the bank, for its outline
 * @param {(x: number, y: number) => number} tintAt
 * @returns {(p: Puff) => void}
 */
export function puffPainter(canvas, puffs, tintAt) {
	const { w: W, h: H } = canvas;
	const bank = new Uint8Array(W * H);
	for (const p of puffs) {
		for (const [x, y] of rowPixels(puffRows(p))) {
			if (x >= 0 && y >= 0 && x < W && y < H && p.ok[y * W + x]) {
				bank[y * W + x] = 1;
			}
		}
	}
	return (p) => {
		const rows = puffRows(p);
		/** @type {Set<number>} */
		const own = new Set();
		for (const [x, y] of rowPixels(rows)) {
			own.add(y * W + x);
		}
		const grain = noise(hash(p.cx, p.cy, 3), 2);
		const ramp = RAMPS[tintAt(p.cx, p.cy)];
		for (const [x, y] of rowPixels(rows)) {
			if (x < 0 || y < 0 || x >= W || y >= H) {
				continue;
			}
			const i = y * W + x;
			const u = (x - p.cx) / p.r;
			const v = (y - p.cy) / p.r;
			const light =
				-u * 0.45 -
				v * 1.0 +
				(grain(x, y) - 0.5) * 0.35 +
				dither(x, y) * 0.2;
			let k =
				light > 0.55
					? 0
					: light > 0.05
						? 1
						: light > -0.4
							? 2
							: light > -0.8
								? 3
								: 4;
			if (v > 0.25 && dither(x, y) + (v - 0.25) * 2.4 > 0.45) {
				k = Math.max(k, 3);
			}
			let col = ramp[k];
			if ((!bank[i - 1] || !bank[i + 1] || !bank[i - W]) && v < 0.35) {
				col = ramp[4];
			} else if (!own.has(i - W) && v < 0) {
				col = ramp[3];
			}
			put(canvas, p.ok, x, y, col);
		}
	};
}

/**
 * A pillar's rows: a flat top a little narrower, near-vertical sides that widen slightly toward the base,
 * and a lean that grows toward the top.
 * @param {Pillar} s
 * @returns {number[][]}
 */
function pillarRows(s) {
	/** @type {number[][]} */
	const rows = [];
	for (let y = s.by - s.ph; y <= s.by; y++) {
		const t = (y - (s.by - s.ph)) / s.ph;
		const half =
			t < 0.06
				? s.hw - 2
				: t < 0.12
					? s.hw - 1
					: Math.round(
							s.hw * (0.85 + 0.3 * t ** 1.5) +
								((hash(y >> 2, s.bx) % 3) - 1) * 0.6
						);
		const shift = Math.round(s.lean * (1 - t));
		rows.push([
			y,
			s.bx - half + (s.lean * t > 0 ? shift : 0),
			s.bx + half + shift,
		]);
	}
	return rows;
}

/**
 * Draws a stone pillar lit on the left, cracked down its height, with a grassy summit and a pine or two.
 * @param {Canvas} canvas
 * @param {Pillar} s
 * @param {Uint8Array} ok
 */
function drawPillar(canvas, s, ok) {
	const W = canvas.w;
	const rows = pillarRows(s);
	/** @type {Set<number>} */
	const own = new Set();
	/** @type {Map<number, number[]>} */
	const span = new Map();
	for (const [y, a, b] of rows) {
		span.set(y, [a, b]);
		for (let x = a; x <= b; x++) {
			own.add(y * W + x);
		}
	}
	const grain = noise(hash(s.bx, s.by, 5), 2);
	for (const [x, y] of rowPixels(rows)) {
		const i = y * W + x;
		const [a, b] = /** @type {number[]} */ (span.get(y));
		const u = (x - (a + b) / 2) / Math.max(1, (b - a) / 2);
		const t = (y - (s.by - s.ph)) / s.ph;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.4;
		let col =
			u < -0.35
				? n > 0
					? C.stoneLight
					: C.stone
				: u < 0.35
					? n > 0.1
						? C.stone
						: C.stoneMid
					: n > 0.2
						? C.stoneShade
						: C.roofShade;
		if (hash(x, s.bx, 2) % 6 === 0 && t > 0.15) {
			col = C.stoneShade; // a crack down its height
		}
		if (t < 0.1) {
			col = n > 0 ? C.alpineMeadowLight : C.alpineMeadow; // the grassy summit
		}
		if (
			(!own.has(i - 1) || !own.has(i + 1) || !own.has(i - W)) &&
			t < 0.8
		) {
			col = C.ink;
		}
		put(canvas, ok, x, y, col);
	}
	const top = s.by - s.ph;
	for (const dx of s.hw >= 6 ? [-2, 2] : [0]) {
		const px = s.bx + dx + Math.round(s.lean);
		for (let k = 0; k < 6; k++) {
			const half = Math.floor((k + 1) / 2.5);
			for (let x = -half; x <= half; x++) {
				put(
					canvas,
					ok,
					px + x,
					top - 5 + k,
					x === -half || x === half
						? C.pineShade
						: x < 0
							? C.pineLight
							: C.pine
				);
			}
		}
		put(canvas, ok, px, top - 6, C.pineShade);
	}
}

/**
 * Stands stone pillars in the footprint of a mat's impassable plots, wrapped at their feet in banks of cloud
 * in the tint of the cloud they stand in.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 * @param {MatData} [mat] - The mat's clouds and their tints
 */
export function paintCloudCity(canvas, fp, seed, mat = {}) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const tintAt = cloudTint(fp, mat);
	drawFloor(
		canvas,
		mask,
		seed,
		(roll, x, y) => RAMPS[tintAt(x, y)][roll < 0.4 ? 2 : 3]
	);
	const rand = seededRandom(hash(seed, 17));
	const room = distanceInside(plots, W, H);
	/** @type {Pillar[]} */
	const pillars = [];
	for (let y = 22; y < H; y += 17) {
		for (let x = Math.floor(y / 17) % 2 ? 11 : 3; x < W; x += 17) {
			const bx = x + Math.floor(rand() * 7) - 3;
			const by = y + Math.floor(rand() * 7) - 3;
			if (
				bx < 0 ||
				by < 0 ||
				bx >= W ||
				by >= H ||
				!mask[by * W + bx] ||
				rand() < 0.2
			) {
				continue;
			}
			const s = {
				bx,
				by,
				hw: clamp(
					Math.floor(5 + rand() * 5),
					3,
					Math.floor(room[by * W + bx]) - 1
				),
				ph: 24 + Math.floor(rand() * 18),
				lean: (rand() - 0.5) * 3,
			};
			while (s.ph > 10 && !fitsIn(pillarRows(s), plots, W, H)) {
				s.ph -= 3;
			}
			if (
				s.hw >= 3 &&
				fitsIn(pillarRows({ ...s, ph: s.ph + 7 }), plots, W, H)
			) {
				pillars.push(s);
			}
		}
	}
	for (const { gx, gy } of corners) {
		const s = { bx: gx, by: gy + 6, hw: 5, ph: 18, lean: 0, ok: reach };
		if (fitsIn(pillarRows({ ...s, ph: s.ph + 7 }), reach, W, H)) {
			pillars.push(s);
		}
	}
	// Puffs of every size fill the footprint round the pillars' feet.
	/** @type {Puff[]} */
	const puffs = [];
	for (let y = 4; y < H; y += 6) {
		for (let x = (y / 6) % 2 ? 3 : 0; x < W; x += 7) {
			const cx = x + Math.floor(rand() * 5) - 2;
			const cy = y + Math.floor(rand() * 5) - 2;
			if (cx < 0 || cy < 0 || cx >= W || cy >= H || !mask[cy * W + cx]) {
				continue;
			}
			const r = Math.round(
				clamp(Math.min(room[cy * W + cx] - 1, 3 + rand() * 6), 3, 9)
			);
			puffs.push({ cx, cy, r, ok: plots });
		}
	}
	for (const { gx, gy } of corners) {
		puffs.push(
			{ cx: gx, cy: gy + 5, r: 6, ok: reach },
			{ cx: gx - 4, cy: gy + 8, r: 4, ok: reach }
		);
	}
	const drawPuff = puffPainter(canvas, puffs, tintAt);
	// Back to front, so the puffs in front of a pillar's foot wrap round it.
	const scene = [
		...pillars.map((s) => ({
			by: s.by - 6,
			draw: () => drawPillar(canvas, s, s.ok ?? plots),
		})),
		...puffs.map((p) => ({
			by: p.cy + p.r * 0.6,
			draw: () => drawPuff(p),
		})),
	].sort((a, b) => a.by - b.by);
	for (const item of scene) {
		item.draw();
	}
}
