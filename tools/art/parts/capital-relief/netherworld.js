// The Netherworld's crags: black basalt round a pool of glowing lava, with ash mounds and skulls on its banks (#133).
import { PALETTE as C } from '../../palette.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { withCornerPatches } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { deepWater, drawBackToFront, packRocks } from './pieces.js';
import { dither, drawRock } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/**
 * Black basalt, in steep narrow crags, on scorched rock; a shadow on lava falls on cooler lava.
 * @type {Readonly<import('./rock.js').RockStyle>}
 */
export const BASALT = Object.freeze({
	tones: Object.freeze([
		C.hellRockLight,
		C.hellRock,
		C.hellRockShade,
		C.hellRockDeep,
		C.ink,
	]),
	darker: Object.freeze({
		[C.hellRockLight]: C.hellRock,
		[C.hellRock]: C.hellRockShade,
		[C.hellRockShade]: C.hellRockDeep,
		[C.hellRockDeep]: C.ink,
		[C.lava]: C.lavaDeep,
		[C.ember]: C.lava,
		[C.amber]: C.ember,
	}),
	foot: Object.freeze([
		C.hellRockLight,
		C.hellRock,
		C.hellRockShade,
		C.hellRockDeep,
	]),
	rim: C.ink,
	top: null,
	width: Object.freeze([0.25, 0.15]),
	cap: 0.2,
	knee: Object.freeze([0.4, 0.15]),
	slope: 0.2,
	strata: false,
});

/** An ash mound's rim, lit, middle, shaded and deep tones. */
const ASH = Object.freeze([
	C.hellRockLight,
	C.hellRockLight,
	C.hellRock,
	C.hellRockShade,
	C.hellRockDeep,
]);

/**
 * Paints the lava: a crust along its far and near banks, and between them lava with brighter currents and dark
 * floes of crust.
 * @param {Canvas} canvas
 * @param {Uint8Array} lava
 * @param {number} seed
 */
function paintLava(canvas, lava, seed) {
	const W = canvas.w;
	const flow = noise(seed + 12, 5);
	for (let i = 0; i < lava.length; i++) {
		if (!lava[i]) {
			continue;
		}
		const x = i % W;
		const y = (i / W) | 0;
		const n = flow(x / 1.5, y) + dither(x, y) * 0.15;
		let col = C.lava;
		if (!lava[i - W]) {
			col = C.hellRockDeep;
		} else if (!lava[i + W]) {
			col = C.lavaDeep;
		} else if (n > 0.75) {
			col = C.amber;
		} else if (n > 0.5) {
			col = C.ember;
		} else if (n < 0.2) {
			col = C.hellRockDeep;
		}
		put(canvas, lava, x, y, col);
	}
}

/**
 * Draws a small skull lying on its base pixel.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} x
 * @param {number} y
 */
function drawSkull(canvas, ok, x, y) {
	for (const [dx, dy, col] of /** @type {[number, number, string][]} */ ([
		[0, -2, C.creamLight],
		[1, -2, C.cream],
		[2, -2, C.creamShade],
		[-1, -1, C.creamLight],
		[0, -1, C.ink],
		[1, -1, C.cream],
		[2, -1, C.ink],
		[3, -1, C.creamShade],
		[0, 0, C.cream],
		[1, 0, C.creamShade],
		[2, 0, C.cream],
	])) {
		put(canvas, ok, x + dx, y + dy, col);
	}
}

/**
 * Packs the crags into the footprint of a mat's impassable plots: a lava pool in each group's deep middle, crags
 * standing on its banks with one over each corner join, ash mounds at their feet and the odd skull.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintNetherworld(canvas, fp, seed) {
	const { w: W, h: H, plots } = fp;
	drawFloor(canvas, withCornerPatches(fp, 8), seed, (roll) => {
		if (roll < 0.3) {
			return C.hellRockDeep;
		}
		return roll < 0.4 ? C.lavaDeep : C.hellRockShade;
	});
	const { deep: lava } = deepWater(fp, seed, 5, 6);
	paintLava(canvas, lava, seed);
	const rocks = packRocks(fp, seed, BASALT, {
		sizes: [14, 11, 9, 7, 5, 4],
		butteFrom: 8,
		tall: [1.3, 0.8],
		fresh: 0.6,
		base: (i) => !lava[i],
		corner: [
			['butte', 0, 9, 7, 18],
			['boulder', -6, 11, 4, 4],
		],
	});
	/** @type {{ by: number, draw: () => void }[]} */
	const scene = rocks.map(({ s, ok }) => ({
		by: s.by,
		draw: () => drawRock(canvas, s, ok, BASALT),
	}));
	for (const m of edgeMounds(fp, seed, [5, 4, 3, 2])) {
		scene.push({
			by: m.by,
			draw: () =>
				drawMound(canvas, m, ASH, BASALT.darker, [C.ember, C.lavaDeep]),
		});
	}
	for (let i = 0; i < W * H; i += 13) {
		const x = i % W;
		const y = (i / W) | 0;
		if (plots[i] && !lava[i] && hash(x, y, 3) % 29 === 0) {
			scene.push({ by: y, draw: () => drawSkull(canvas, plots, x, y) });
		}
	}
	drawBackToFront(scene);
}
