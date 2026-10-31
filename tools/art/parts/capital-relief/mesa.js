// The Mesa's impassable plots as one long tableland: a scrubby flat top, cliffs in painted layers, and a talus skirt (#132).
import { PALETTE as C } from '../../palette.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { distanceInside } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { clamp, fitsIn } from './pack.js';
import { RED_ROCK, dither, drawRock, rockShape } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/** The cliffs' painted layers, from the cap rock down, repeating. */
const STRATA = [
	C.plasterShade,
	C.plasterShade,
	C.mesaRockLight,
	C.mesaRockLight,
	C.mesaRockLight,
	C.creamShade,
	C.mesaRock,
	C.mesaRock,
	C.mesaRock,
	C.mesaStrata,
	C.mesaStrata,
	C.mesaRockShade,
	C.mesaRockShade,
	C.brickRedShade,
	C.mesaRock,
	C.mesaRock,
	C.creamShade,
	C.mesaRockLight,
];

/** Each layer's tone where the cliff turns to the light. */
const LIT = Object.freeze({
	[C.plasterShade]: C.strataCapLit,
	[C.mesaRockLight]: C.strataRoseLit,
	[C.creamShade]: C.strataCreamLit,
	[C.mesaRock]: C.strataRedLit,
	[C.mesaStrata]: C.strataOrangeLit,
	[C.mesaRockShade]: C.strataBrownLit,
	[C.brickRedShade]: C.strataMaroonLit,
});

/** Each layer's tone where the cliff turns away. */
const SHADE = Object.freeze({
	[C.plasterShade]: C.strataCapShade,
	[C.mesaRockLight]: C.strataRoseShade,
	[C.creamShade]: C.strataCreamShade,
	[C.mesaRock]: C.strataRedShade,
	[C.mesaStrata]: C.strataOrangeShade,
	[C.mesaRockShade]: C.strataBrownShade,
	[C.brickRedShade]: C.strataMaroonShade,
});

/**
 * One column's run through the tableland: where it starts at the back, where its top ends and its
 * cliff begins, where the cliff meets the talus, and where it ends at the front.
 * @typedef {{ x: number, y0: number, y1: number, end: number, foot: number }} Run
 */

/**
 * The tableland's plan: the footprint worn ragged, so its outline is never a rounded box.
 * @param {Footprint} fp
 * @param {number} seed
 * @returns {Uint8Array}
 */
function tableland(fp, seed) {
	const { w: W, h: H, mask } = fp;
	const wear = noise(seed + 6, 3);
	const depth = distanceInside(mask, W, H);
	const land = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		if (mask[i] && depth[i] > wear(i % W, (i / W) | 0) * 3.2) {
			land[i] = 1;
		}
	}
	return land;
}

/**
 * Each column's runs through the tableland, with its top, cliff and talus. The front edge wobbles, and
 * now and then a notch cuts deeper.
 * @param {Uint8Array} land
 * @param {number} W
 * @param {number} H
 * @param {number} seed
 * @returns {{ runs: Run[], topEnd: Int16Array }}
 */
function columns(land, W, H, seed) {
	const edge = noise(seed + 2, 7);
	const topEnd = new Int16Array(W * H).fill(-1);
	/** @type {Run[]} */
	const runs = [];
	for (let x = 0; x < W; x++) {
		let y = 0;
		while (y < H) {
			if (!land[y * W + x]) {
				y++;
				continue;
			}
			let y1 = y;
			while (y1 + 1 < H && land[(y1 + 1) * W + x]) {
				y1++;
			}
			const len = y1 - y + 1;
			const talus = clamp(Math.round(len * 0.18), 3, 7);
			const cliff = clamp(Math.round(len * 0.55), 8, 19);
			const notch =
				hash(Math.floor((x + 3) / 11), y1, seed) % 6 === 0 ? 4 : 0;
			const end = clamp(
				y1 -
					talus -
					cliff +
					Math.round((edge(x, y1) - 0.5) * 6) -
					notch,
				y + 1,
				y1 - talus - 3
			);
			const foot = y1 - talus + Math.round((edge(x + 99, y1) - 0.5) * 3);
			runs.push({ x, y0: y, y1, end, foot });
			for (let k = y; k <= y1; k++) {
				topEnd[k * W + x] = end;
			}
			y = y1 + 1;
		}
	}
	return { runs, topEnd };
}

/**
 * The colour of a pixel on the tableland's top: red soil and scrub with juniper, an ink outline at its
 * back and sides, and a lit rim along its front.
 * @param {Run} run
 * @param {number} x
 * @param {number} y
 * @param {boolean} side - It lies on the tableland's left or right edge
 * @param {number} n - The grain
 * @param {number} seed
 * @returns {string}
 */
function topColour({ y0, end }, x, y, side, n, seed) {
	if (y === y0 || side) {
		return C.ink;
	}
	if (y === end) {
		return C.mesaStrata;
	}
	if (y === y0 + 1) {
		return C.mesaSoilLight;
	}
	if (hash(x >> 1, y >> 1, seed) % 23 === 0) {
		return (x + y) % 2 ? C.pine : C.pineShade;
	}
	if (hash(x, y, 5) % 29 === 0) {
		return C.mesaSage;
	}
	return n > 0.1 ? C.mesaSoilLight : C.mesaSoil;
}

/**
 * The colour of a pixel on the cliff: its layer, lit where the rim steps back and in shade where it steps
 * forward, fluted by rain, with lit and shaded faces at the tableland's ends.
 * @param {Run} run
 * @param {number} x
 * @param {number} y
 * @param {number} slope - How far the rim steps back from the left column to the right one
 * @param {boolean} left - The tableland's left edge
 * @param {boolean} right - Its right edge
 * @param {number} seed
 * @returns {string}
 */
function cliffColour({ end, foot }, x, y, slope, left, right, seed) {
	if (y === end + 1) {
		return C.strataCapShade; // the shade under the cap rock
	}
	const band = STRATA[(y - end - 1) % STRATA.length];
	if ((left || right) && y - end < (foot - end) * 0.7) {
		return C.ink;
	}
	if (right) {
		return SHADE[band];
	}
	if (left || slope > 1) {
		return LIT[band];
	}
	if (slope < -1 || hash(x, seed, 3) % 5 === 0) {
		return SHADE[band];
	}
	return band;
}

/**
 * The colour of a pixel on the talus: soil and rubble cut by gullies, or nothing where it fades into the plain.
 * @param {Run} run
 * @param {number} x
 * @param {number} y
 * @param {number} n - The grain
 * @param {number} seed
 * @returns {string | null}
 */
function talusColour({ y1, foot }, x, y, n, seed) {
	const t = (y - foot) / Math.max(1, y1 - foot);
	if (t > 0.6 && dither(x, y) + (t - 0.6) * 2 > 0.45) {
		return null;
	}
	if (hash(Math.floor(x / 4), seed, 11) % 3 === 0 && x % 4 === 1) {
		return C.mesaSoilDark; // a gully
	}
	if (hash(x, y, 13) % 17 === 0) {
		return C.mesaRock;
	}
	return n > 0.15
		? C.mesaSoilLight
		: n > -0.15
			? C.mesaSoil
			: C.mesaSoilShade;
}

/**
 * Draws the Mesa's impassable plots as one tableland per group, with a butte over each corner join.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintMesa(canvas, fp, seed) {
	const { w: W, h: H, plots, reach, corners } = fp;
	const land = tableland(fp, seed);
	const { runs, topEnd } = columns(land, W, H, seed);
	const endAt = (/** @type {number} */ x, /** @type {number} */ y) =>
		x < 0 || x >= W ? -1 : topEnd[y * W + x];
	const grain = noise(seed + 4, 2);
	for (const run of runs) {
		const { x, y0, y1, end, foot } = run;
		for (let y = y0; y <= y1; y++) {
			const i = y * W + x;
			const n = grain(x, y) - 0.5 + dither(x, y) * 0.4;
			const left = !land[i - 1];
			const right = !land[i + 1];
			const col =
				y <= end
					? topColour(run, x, y, left || right, n, seed)
					: y <= foot
						? cliffColour(
								run,
								x,
								y,
								endAt(x - 1, y) - endAt(x + 1, y),
								left,
								right,
								seed
							)
						: talusColour(run, x, y, n, seed);
			if (col) {
				put(canvas, plots, x, y, col);
			}
		}
	}
	// A butte stands over each corner join, as a remnant of the same tableland.
	for (const { gx, gy, down } of corners) {
		const s = rockShape(
			{
				kind: 'butte',
				bx: gx + (down ? 1 : -1),
				by: gy + 10,
				hw: 10,
				ph: 17,
			},
			seed,
			RED_ROCK
		);
		if (fitsIn(s.rows, reach, W, H)) {
			drawRock(canvas, s, reach, RED_ROCK);
		}
	}
}
