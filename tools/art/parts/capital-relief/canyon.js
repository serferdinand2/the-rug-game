// A gorge cut into the Canyon's plain: banded terraces down to a shaded floor with a river, and red boulders on its rims (#132).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import {
	distanceInside,
	withCornerPatches,
} from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { drawFloor } from './floor.js';
import { EIGHT, blockedOf, clamp, fitsIn } from './pack.js';
import { RED_ROCK, dither, drawRock, rockShape } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/** The cliffs' tones, from the lit ledges down to the deep shade. */
const WALL = [
	C.mesaStrata,
	C.mesaRockLight,
	C.mesaRock,
	C.mesaRockShade,
	C.mesaRockDark,
];

/** The four steps to a pixel's side neighbours. */
const SIDES = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * The gorge: the footprint worn ragged at its rim, and bent through each corner join as a round patch.
 * @param {Footprint} fp
 * @param {(x: number, y: number) => number} wear
 * @returns {Uint8Array}
 */
function gorge(fp, wear) {
	const { w: W, h: H, mask, reach, corners } = fp;
	const depth = distanceInside(mask, W, H);
	const hole = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && depth[i] > 1.5 + wear(i % W, (i / W) | 0) * 2.5) {
			hole[i] = 1;
		}
	}
	for (const { gx, gy } of corners) {
		for (let dy = -9; dy <= 9; dy++) {
			for (let dx = -9; dx <= 9; dx++) {
				const i = (gy + dy) * W + gx + dx;
				if (
					dx * dx + dy * dy <=
						8.5 * 8.5 + wear(gx + dx, gy + dy) * 10 &&
					reach[i]
				) {
					hole[i] = 1;
				}
			}
		}
	}
	return hole;
}

/**
 * How far each pixel of the gorge lies from the middle of its floor: the ridge of its distance to the rim.
 * @param {Uint8Array} hole
 * @param {Float32Array} dep - Each pixel's distance to the rim
 * @param {number} W
 * @param {number} H
 * @returns {Float32Array} 0 on the middle line, counted in side steps away from it
 */
function fromMiddle(hole, dep, W, H) {
	const at = (/** @type {number} */ x, /** @type {number} */ y) =>
		x < 0 || y < 0 || x >= W || y >= H ? 0 : dep[y * W + x];
	const mid = new Float32Array(W * H).fill(Infinity);
	/** @type {number[]} */
	const queue = [];
	for (let i = 0; i < W * H; i++) {
		const x = i % W;
		const y = (i / W) | 0;
		if (
			hole[i] &&
			dep[i] >= 2 &&
			!EIGHT.some(([dx, dy]) => at(x + dx, y + dy) > dep[i] + 0.01)
		) {
			mid[i] = 0;
			queue.push(i);
		}
	}
	for (let q = 0; q < queue.length; q++) {
		const i = queue[q];
		const x = i % W;
		const y = (i / W) | 0;
		for (const [dx, dy] of SIDES) {
			const j = (y + dy) * W + x + dx;
			if (
				x + dx < 0 ||
				y + dy < 0 ||
				x + dx >= W ||
				y + dy >= H ||
				!hole[j] ||
				mid[j] <= mid[i] + 1
			) {
				continue;
			}
			mid[j] = mid[i] + 1;
			queue.push(j);
		}
	}
	return mid;
}

/**
 * The colour of a pixel of the gorge, seen from the front and above: its far and side walls step down in
 * terraces that follow the rim, the near wall faces away out of sight, and the floor carries a river.
 * @param {number} d - Its distance to the rim
 * @param {number} gx - How the distance grows to the right
 * @param {number} gy - How the distance grows downward
 * @param {number} mid - Its distance from the floor's middle
 * @param {number} n - The grain, about -0.5 to 0.5
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
function gorgeColour(d, gx, gy, mid, n, x, y) {
	if (mid <= 1.5) {
		// The floor, in deep shade, with the river along its middle.
		if (mid === 0) {
			return dither(x, y) > 0.3 ? C.dayWaveDeep : C.daySea3;
		}
		return n > 0.2 ? C.mesaRockShade : C.mesaRockDark;
	}
	if (gy < -0.5 && Math.abs(gy) >= Math.abs(gx)) {
		// Below the near rim: the near wall faces away, so this is floor in its shadow.
		if (d <= 1) {
			return C.mesaSoilDark;
		}
		return d <= 2.5 ? C.night : n > 0.15 ? C.mesaRockShade : C.mesaRockDark;
	}
	if (d <= 1) {
		return C.mesaSoilLight; // the rim's lit lip
	}
	// The far and side walls in terraces: each step's ledge catches the light, and deeper is darker.
	// The west wall, where the distance grows to the right, is in shade; the east wall is lit.
	const facing = Math.abs(gx) > Math.abs(gy) ? (gx > 0 ? 1 : -1) : 0;
	let k = 1 + facing + Math.floor(d / 6);
	const step = d % 3.2;
	if (step < 1) {
		k -= 1;
	} else if (step > 2.4) {
		k += 1;
	}
	if (hash(x >> 1, y >> 2, 7) % 9 === 0) {
		k += 1;
	}
	if (n > 0.3) {
		k -= 1;
	}
	return WALL[clamp(k, 0, 4)];
}

/**
 * Cuts the Canyon's gorge into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintCanyon(canvas, fp, seed) {
	const { w: W, h: H, plots, reach, corners } = fp;
	const hole = gorge(fp, noise(seed + 5, 2.5));
	// The rim: dusty soil round the drop, ragged where it meets the plain.
	drawFloor(canvas, withCornerPatches(fp, 12), seed, (roll) =>
		roll < 0.35
			? C.mesaSoil
			: roll < 0.42
				? C.mesaSoilShade
				: C.mesaSoilLight
	);
	const dep = distanceInside(hole, W, H);
	const at = (/** @type {number} */ x, /** @type {number} */ y) =>
		x < 0 || y < 0 || x >= W || y >= H ? 0 : dep[y * W + x];
	const mid = fromMiddle(hole, dep, W, H);
	const grain = noise(seed + 9, 2);
	for (let i = 0; i < W * H; i++) {
		if (!hole[i]) {
			continue;
		}
		const x = i % W;
		const y = (i / W) | 0;
		const gx = at(x + 1, y) - at(x - 1, y);
		const gy = at(x, y + 1) - at(x, y - 1);
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.5;
		put(canvas, hole, x, y, gorgeColour(dep[i], gx, gy, mid[i], n, x, y));
	}
	// Boulders on the near and far rims, and a hoodoo and a boulder beside each corner join.
	const rand = seededRandom(hash(seed, 31));
	const blocked = blockedOf(fp);
	/** @type {{ s: import('./rock.js').Rock, ok: Uint8Array }[]} */
	const rocks = [];
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) {
				continue;
			}
			for (let k = 0; k < 2; k++) {
				if (rand() < 0.45) {
					continue;
				}
				const x = c * PITCH + 5 + Math.floor(rand() * 22);
				const far = rand() < 0.4;
				let y = far ? r * PITCH : r * PITCH + PLOT - 1;
				if (far) {
					while (y < r * PITCH + PLOT && !hole[y * W + x]) {
						y++;
					}
					y -= 1;
				} else {
					while (y > r * PITCH && !hole[y * W + x]) {
						y--;
					}
					y += 3;
				}
				const hw = 2 + Math.floor(rand() * 3);
				const s = rockShape(
					{ kind: 'boulder', bx: x, by: y, hw, ph: hw + 1 },
					seed,
					RED_ROCK
				);
				if (fitsIn(s.rows, plots, W, H)) {
					rocks.push({ s, ok: plots });
				}
			}
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const spec of [
			{ kind: 'hoodoo', bx: gx + 8 * f, by: gy - 1, hw: 4, ph: 13 },
			{ kind: 'boulder', bx: gx - 8 * f, by: gy + 9, hw: 3, ph: 4 },
		]) {
			const s = rockShape(
				/** @type {import('./rock.js').RockSpec} */ (spec),
				seed,
				RED_ROCK
			);
			if (fitsIn(s.rows, reach, W, H)) {
				rocks.push({ s, ok: reach });
			}
		}
	}
	rocks.sort((a, b) => a.s.by - b.s.by);
	for (const { s, ok } of rocks) {
		drawRock(canvas, s, ok, { ...RED_ROCK, strata: false });
	}
}
