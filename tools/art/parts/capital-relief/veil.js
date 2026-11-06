// The Veil's two sides: grey boulders and bramble on the worldly side, violet crystals and glowing toadstools on the charmed side (#133).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { withCornerPatches } from '../../../../src/lib/art/paint/relief/footprint.js';
import { hash } from '../../../../src/lib/art/paint/relief/ground.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { frontToBack } from './pack.js';
import { drawBackToFront, drawShards, packRocks } from './pieces.js';
import { drawRock, rockShape } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./index.js').MatData} MatData */

/**
 * The worldly side's grey stone, its top grassed over.
 * @type {Readonly<import('./rock.js').RockStyle>}
 */
export const WORLDLY_STONE = Object.freeze({
	tones: Object.freeze([
		C.stoneLight,
		C.stoneLight,
		C.stone,
		C.stoneMid,
		C.stoneShade,
	]),
	darker: Object.freeze({
		[C.veilMeadowLight]: C.veilMeadow,
		[C.veilMeadow]: C.veilMeadowShade,
		[C.stoneLight]: C.stone,
		[C.stone]: C.stoneMid,
		[C.stoneMid]: C.stoneShade,
		[C.pine]: C.pineShade,
	}),
	foot: Object.freeze([
		C.veilMeadowLight,
		C.veilMeadow,
		C.veilMeadow,
		C.veilMeadowShade,
	]),
	rim: C.stoneShade,
	top: Object.freeze({
		rim: C.veilMeadowLight,
		light: C.veilMeadowLight,
		base: C.veilMeadow,
		scrub: C.pine,
	}),
	width: Object.freeze([0.5, 0.2]),
	cap: 0.25,
	knee: Object.freeze([0.55, 0.15]),
	slope: 0.14,
	strata: false,
});

/** The next tone down on the charmed side. */
const NIGHT_DARKER = Object.freeze({
	[C.veilNightLight]: C.veilNight,
	[C.veilNight]: C.veilNightShade,
	[C.arcaneLight]: C.arcane,
	[C.arcane]: C.arcaneShade,
});

/** A bramble mound's rim, lit, middle, shaded and deep tones, berries on it. */
const BRAMBLE = Object.freeze([
	C.veilMeadowLight,
	C.pineLight,
	C.pine,
	C.pineShade,
	C.veilMeadowShade,
]);

/** A mossy mound on the charmed side. */
const NIGHT_MOSS = Object.freeze([
	C.veilNightLight,
	C.veilNightLight,
	C.veilNight,
	C.veilNightShade,
	C.veilNightShade,
]);

/** The violet crystals' lit, middle and shaded tones. */
const AMETHYST = Object.freeze([C.arcaneLight, C.arcane, C.arcaneShade]);

/**
 * Draws a giant toadstool standing on its base pixel: a pale stem under a violet cap with glowing spots.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} h - The stem's height
 * @param {number} r - The cap's half-width
 */
function drawToadstool(canvas, ok, bx, by, h, r) {
	for (let t = 0; t < h; t++) {
		put(canvas, ok, bx - 1, by - t, C.creamLight);
		put(canvas, ok, bx, by - t, C.cream);
		put(canvas, ok, bx + 1, by - t, C.creamShade);
	}
	const top = by - h;
	for (let y = -Math.round(r * 0.7); y <= 1; y++) {
		const half = Math.round(
			r * Math.sqrt(Math.max(0, 1 - (y * y) / (r * r * 0.49)))
		);
		for (let x = -half; x <= half; x++) {
			let col = C.arcane;
			if (y === 1 || Math.abs(x) === half) {
				col = C.arcaneShade;
			} else if (x < -half / 3 && y < 0) {
				col = C.arcaneLight;
			}
			put(canvas, ok, bx + x, top + y, col);
		}
	}
	for (const [dx, dy] of [
		[-2, -2],
		[2, -1],
		[0, -3],
		[-4, 0],
		[4, 0],
	]) {
		put(canvas, ok, bx + dx, top + dy, C.ghostLight);
	}
}

/**
 * Where each side lies: a byte per pixel, from the mat's sides by the plot each pixel's row and column fall in.
 * @param {Footprint} fp
 * @param {MatData} mat
 * @returns {{ charmed: Uint8Array, worldly: Uint8Array }}
 */
function sidesOf(fp, mat) {
	const { w: W, h: H } = fp;
	const charmed = new Uint8Array(W * H);
	const worldly = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		const r = Math.floor(((i / W) | 0) / PITCH);
		const c = Math.floor((i % W) / PITCH);
		if (mat.sides?.[r]?.[c] === '1') {
			charmed[i] = 1;
		} else {
			worldly[i] = 1;
		}
	}
	return { charmed, worldly };
}

/**
 * The pixels in both areas.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {Uint8Array}
 */
function both(a, b) {
	return a.map((v, i) => v & b[i]);
}

/**
 * Packs each side's pieces into its part of the footprint, so a group that crosses the veil changes look at the
 * line: worldly boulders and bramble, charmed crystals and toadstools, each side with its own piece over its corner
 * joins.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 * @param {MatData} [mat] - The mat's sides; without them, the whole mat is worldly
 */
export function paintVeil(canvas, fp, seed, mat = {}) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	const { charmed, worldly } = sidesOf(fp, mat);
	const patches = withCornerPatches(fp, 8);
	drawFloor(canvas, both(patches, worldly), seed, (roll) =>
		roll < 0.35 ? C.veilMeadowShade : C.veilMeadow
	);
	drawFloor(canvas, both(patches, charmed), seed, (roll) => {
		if (roll < 0.35) {
			return C.veilNightShade;
		}
		return roll < 0.45 ? C.arcaneShade : C.veilNight;
	});
	const plotsW = both(plots, worldly);
	const plotsC = both(plots, charmed);
	const reachC = both(reach, charmed);
	const rocks = packRocks(
		{
			...fp,
			mask: both(mask, worldly),
			plots: plotsW,
			reach: both(reach, worldly),
		},
		seed,
		WORLDLY_STONE,
		{
			sizes: [16, 12, 9, 7, 5],
			butteFrom: 11,
			tall: [0.7, 0.4],
			fresh: 0.6,
		}
	);
	/** @type {{ by: number, draw: () => void }[]} */
	const scene = rocks.map(({ s, ok }) => ({
		by: s.by,
		draw: () => drawRock(canvas, s, ok, WORLDLY_STONE),
	}));
	for (const m of edgeMounds(fp, seed, [6, 4, 4, 3])) {
		const night = charmed[m.by * W + m.bx] === 1;
		const area = both(m.area, night ? charmed : worldly);
		scene.push({
			by: m.by,
			draw: () =>
				drawMound(
					canvas,
					{ ...m, area },
					night ? NIGHT_MOSS : BRAMBLE,
					night ? NIGHT_DARKER : WORLDLY_STONE.darker,
					night
						? [C.ghostLight, C.arcaneLight]
						: [C.brickRedLight, C.brickRed]
				),
		});
	}
	// The charmed side: crystal clusters and toadstools, the biggest in front, each on floor no other piece holds.
	const rand = seededRandom(hash(seed, 37));
	const taken = new Uint8Array(W * H);
	for (const [bx, by] of frontToBack(W, H, rand)) {
		const i = by * W + bx;
		if (!plotsC[i] || taken[i] || by < 16) {
			continue;
		}
		const toadstool = rand() < 0.45;
		const r = toadstool ? 5 + Math.floor(rand() * 4) : 6;
		let room = true;
		for (let y = by - 18; y <= by + 1 && room; y += 2) {
			for (let x = bx - r - 1; x <= bx + r + 1 && room; x += 2) {
				room =
					x >= 0 &&
					y >= 0 &&
					x < W &&
					plotsC[y * W + x] === 1 &&
					!taken[y * W + x];
			}
		}
		if (!room) {
			continue;
		}
		for (let y = by - 6; y <= Math.min(H - 1, by + 2); y++) {
			for (
				let x = Math.max(0, bx - r);
				x <= Math.min(W - 1, bx + r);
				x++
			) {
				taken[y * W + x] = 1;
			}
		}
		const h = toadstool
			? 6 + Math.floor(rand() * 6)
			: 11 + Math.floor(rand() * 6);
		scene.push({
			by,
			draw: () =>
				toadstool
					? drawToadstool(canvas, plotsC, bx, by, h, r)
					: drawShards(
							canvas,
							{ cx: bx, by, h },
							plotsC,
							AMETHYST,
							C.ink
						),
		});
	}
	// A crystal cluster over each charmed corner join; the worldly ones get the packed boulders. A join on the veil
	// itself fits neither side's whole piece, so it gets one of each, each kept to its own side of the line.
	const reachW = both(reach, worldly);
	for (const { gx, gy } of corners) {
		const around = [
			[-3, -3],
			[3, -3],
			[-3, 3],
			[3, 3],
		].map(([dx, dy]) => charmed[(gy + dy) * W + gx + dx] === 1);
		const onCharmed = around.some(Boolean);
		const onVeil = onCharmed && around.some((c) => !c);
		if (onCharmed) {
			const cx = onVeil ? gx + 4 : gx;
			scene.push({
				by: gy + 9,
				draw: () =>
					drawShards(
						canvas,
						{ cx, by: gy + 9, h: 15 },
						reachC,
						AMETHYST,
						C.ink
					),
			});
		}
		if (onVeil) {
			const s = rockShape(
				{ kind: 'boulder', bx: gx - 4, by: gy + 9, hw: 6, ph: 7 },
				seed,
				WORLDLY_STONE
			);
			scene.push({
				by: gy + 9,
				draw: () => drawRock(canvas, s, reachW, WORLDLY_STONE),
			});
		}
	}
	drawBackToFront(scene);
}
