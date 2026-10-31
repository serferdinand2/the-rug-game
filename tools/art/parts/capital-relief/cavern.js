// Grey cave rock rising out of the Cavern's dark floor, with stalagmites and glowing crystal clusters (#132).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import {
	peakRows,
	peakShape,
} from '../../../../src/lib/art/paint/relief/mountain.js';
import { drawFloor } from './floor.js';
import { drawMound, edgeMounds } from './mounds.js';
import { blockedOf, frontToBack, packer } from './pack.js';
import { dither, footShadow, rowPixels } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('../../../../src/lib/art/paint/relief/mountain.js').Peak} Peak */
/** @typedef {{ bx: number, by: number, hw: number, ph: number }} Stalagmite */

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = Object.freeze({
	[C.caveFloorLight]: C.caveFloor,
	[C.caveFloor]: C.caveFloorDark,
	[C.caveFloorDark]: C.night,
	[C.stoneShade]: C.roofShade,
	[C.stoneMid]: C.stoneShade,
});

/** A rubble mound's rim, lit, middle, shaded and deep tones. */
const RUBBLE = [
	C.stoneShade,
	C.caveFloorLight,
	C.caveFloor,
	C.caveFloorDark,
	C.night,
];

/**
 * Draws a formation of cave rock: lit on the left of its ridge, shaded on the right, its lower half darkening
 * into the floor, with an ink outline on the upper rock only.
 * @param {Canvas} canvas
 * @param {Peak} s
 * @param {Uint8Array} ok - Where it may paint
 */
function drawCaveRock(canvas, s, ok) {
	const W = canvas.w;
	const rows = peakRows(s);
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of rowPixels(rows)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	// Secondary ridges running down and out from the main ridge.
	/** @type {Set<number>} */
	const ribs = new Set();
	for (let k = 0; k < 1 + Math.floor(s.hw / 9); k++) {
		let y = s.sy + Math.round(s.ph * (0.2 + s.rand() * 0.4));
		let x = Math.round(s.ridge(y));
		const dir = s.rand() < 0.55 ? -1 : 1;
		for (let step = 0; step < s.hw * 0.6; step++) {
			ribs.add(y * W + x);
			x += dir;
			if (s.rand() < 0.6) {
				y += 1;
			}
		}
	}
	footShadow(
		canvas,
		ok,
		own,
		[s.bx, s.bx + s.hw + 3, s.by - 2, s.by + 1],
		DARKER
	);
	for (const [x, y] of rowPixels(rows)) {
		if (x < 0 || y < 0 || x >= W || y >= canvas.h) {
			continue;
		}
		const i = y * W + x;
		const lit = x < s.ridge(y);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) + dither(x, y) * 0.25;
		let col = lit
			? n > 0.66
				? C.stoneLight
				: n > 0.32
					? C.stone
					: C.stoneMid
			: n > 0.62
				? C.stoneMid
				: n > 0.3
					? C.stoneShade
					: C.roofShade;
		if (ribs.has(i)) {
			col = lit ? C.stoneMid : C.roofShade;
		} else if (ribs.has(i + W)) {
			col = lit ? C.stoneLight : C.stoneMid;
		}
		// A vein of crystal in the rock, here and there.
		if (hash(x, y, s.bx) % 97 === 0 && depth < 0.6) {
			col = C.teal;
		}
		// The lower slopes darken into the cave floor.
		const low = Math.max(0, (depth - 0.5) / 0.5);
		if (low ** 1.2 > 0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5) {
			col = lit
				? n > 0.55
					? C.caveFloorLight
					: C.caveFloor
				: n > 0.5
					? C.caveFloor
					: C.caveFloorDark;
		}
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < 0.55) {
			col = C.ink;
		} else if (edge && !own.has(i + 1) && depth < 0.85) {
			col = C.night;
		}
		put(canvas, ok, x, y, col);
	}
}

/**
 * A stalagmite's rows: a narrow cone from its tip down to its base.
 * @param {Stalagmite} m
 * @returns {number[][]}
 */
function stalagmiteRows({ bx, by, hw, ph }) {
	/** @type {number[][]} */
	const rows = [];
	for (let y = by - ph; y <= by; y++) {
		const half = Math.round(hw * ((y - (by - ph)) / ph) ** 0.8);
		rows.push([y, bx - half, bx + half]);
	}
	return rows;
}

/**
 * Draws a stalagmite, lit on the left, ringed with drip lines, its foot fading into the floor.
 * @param {Canvas} canvas
 * @param {Stalagmite} m
 * @param {Uint8Array} ok
 */
function drawStalagmite(canvas, m, ok) {
	const W = canvas.w;
	const rows = stalagmiteRows(m);
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of rowPixels(rows)) {
		own.add(y * W + x);
	}
	footShadow(
		canvas,
		ok,
		own,
		[m.bx, m.bx + m.hw + 3, m.by - 1, m.by + 1],
		DARKER
	);
	for (const [x, y] of rowPixels(rows)) {
		const i = y * W + x;
		const depth = (y - (m.by - m.ph)) / m.ph;
		const u = (x - m.bx) / Math.max(1, m.hw);
		let col = u < -0.2 ? C.stoneLight : u < 0.3 ? C.stone : C.stoneShade;
		if ((y + m.bx) % 4 === 0) {
			col = u < 0.3 ? C.stoneMid : C.roofShade;
		}
		if (depth > 0.7 && dither(x, y) + (depth - 0.7) * 2 > 0.4) {
			col = u < 0 ? C.caveFloorLight : C.caveFloor;
		}
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < 0.7) {
			col = C.ink;
		}
		put(canvas, ok, x, y, col);
	}
}

/**
 * Draws a cluster of four crystal shards, outlined in ink, glowing on the floor round its foot.
 * @param {Canvas} canvas
 * @param {{ cx: number, by: number, h: number, violet: boolean }} c
 * @param {Uint8Array} ok
 */
function drawCrystals(canvas, { cx, by, h, violet }, ok) {
	const [light, mid, dark] = violet
		? [C.arcaneLight, C.arcane, C.arcaneShade]
		: [C.tealLight, C.teal, C.tealShade];
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -7; dx <= 7; dx++) {
			const x = cx + dx;
			const y = by + dy;
			if (
				(dx * dx) / 49 + (dy * dy) / 4 > 1 ||
				x < 0 ||
				y < 0 ||
				x >= canvas.w ||
				y >= canvas.h
			) {
				continue;
			}
			if (
				ok[y * canvas.w + x] &&
				canvas.p[y * canvas.w + x] &&
				dither(x, y) > 0.1
			) {
				put(canvas, ok, x, y, dark);
			}
		}
	}
	// Each shard as [x, base, half-width, height, lean].
	for (const [x0, b0, hw, hh, lean] of [
		[cx - 5, by, 2, Math.round(h * 0.5), -2],
		[cx - 2, by + 1, 3, Math.round(h * 0.8), -1],
		[cx + 4, by, 2, Math.round(h * 0.65), 2],
		[cx + 1, by + 2, 3, h, 0],
	]) {
		for (let t = 0; t <= hh; t++) {
			const half = Math.round(hw * (1 - t / (hh + 1)));
			const x = x0 + Math.round((lean * t) / 5);
			for (let dx = -half - 1; dx <= half + 1; dx++) {
				const edge = Math.abs(dx) === half + 1 || t === hh;
				put(
					canvas,
					ok,
					x + dx,
					b0 - t,
					edge ? C.ink : dx < 0 ? light : dx === 0 ? mid : dark
				);
			}
		}
		put(canvas, ok, x0 + Math.round((lean * hh) / 5), b0 - hh - 1, C.ink);
	}
}

/**
 * Packs cave rock, stalagmites, crystals and rubble into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintCavern(canvas, fp, seed) {
	const { w: W, h: H, mask, plots, reach, corners } = fp;
	drawFloor(canvas, mask, seed, (roll) =>
		roll < 0.15 ? C.night : roll < 0.25 ? C.caveFloor : C.caveFloorDark
	);
	const rand = seededRandom(hash(seed, 21));
	const pack = packer(fp);
	/** @type {{ s: Peak, ok: Uint8Array }[]} */
	const rocks = [];
	for (const { gx, gy } of corners) {
		const s = peakShape({ bx: gx, by: gy + 10, hw: 11, ph: 15 }, seed, {
			rough: 0.3,
			flat: 2,
		});
		if (pack.fresh(peakRows(s), reach) >= 0) {
			rocks.push({ s, ok: reach });
			pack.cover(peakRows(s));
		}
	}
	// One formation to each plot, of its own size and place, with a smaller one behind it now and then,
	// so a run of plots never repeats one shape.
	const blocked = blockedOf(fp);
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) {
				continue;
			}
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			const pr = seededRandom(hash(r, c, seed, 29));
			const tries = [
				{
					bx: x0 + 16 + Math.round((pr() - 0.5) * 8),
					by: y0 + 27 + Math.floor(pr() * 4),
					hw: 10 + Math.floor(pr() * 6),
					ph: 12 + Math.floor(pr() * 8),
				},
				{
					bx: x0 + 10 + Math.floor(pr() * 12),
					by: y0 + 14 + Math.floor(pr() * 5),
					hw: 6 + Math.floor(pr() * 5),
					ph: 9 + Math.floor(pr() * 6),
				},
			];
			for (const [k, t] of tries.entries()) {
				if (k === 1 && pr() < 0.4) {
					continue;
				}
				for (let shrink = 0; shrink < 4; shrink++) {
					const s = peakShape(
						{ ...t, hw: t.hw - shrink * 2, ph: t.ph - shrink * 2 },
						seed,
						{ rough: 0.3, flat: Math.round(t.hw * 0.2) }
					);
					if (pack.fresh(peakRows(s), plots) < 0) {
						continue;
					}
					rocks.push({ s, ok: plots });
					pack.cover(peakRows(s));
					break;
				}
			}
		}
	}
	// A few stalagmites stand in front of the rock, where they would show.
	/** @type {Stalagmite[]} */
	const spikes = [];
	for (const hw of [5, 4, 3]) {
		for (const [bx, by] of frontToBack(W, H, rand)) {
			if (!mask[by * W + bx] || rand() < 0.75) {
				continue;
			}
			const m = {
				bx,
				by,
				hw,
				ph: 8 + Math.round(hw * 2.5) + Math.floor(rand() * 6),
			};
			const rows = stalagmiteRows(m);
			if (
				!pack.clearInFront(bx, by, hw + 2) ||
				pack.fresh(rows, plots) < 0.5
			) {
				continue;
			}
			spikes.push(m);
			pack.cover(rows);
		}
	}
	// A crystal cluster on two plots in three, violet one time in three.
	/** @type {{ cx: number, by: number, h: number, violet: boolean }[]} */
	const crystals = [];
	let k = 0;
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c) || k++ % 3 === 2) {
				continue;
			}
			const cx = c * PITCH + 9 + Math.floor(rand() * 14);
			const by = r * PITCH + 25 + Math.floor(rand() * 4);
			if (by < H && mask[by * W + cx] && plots[(by - 16) * W + cx]) {
				crystals.push({
					cx,
					by,
					h: 11 + Math.floor(rand() * 5),
					violet: rand() < 0.3,
				});
			}
		}
	}
	const scene = [
		...rocks.map(({ s, ok }) => ({
			by: s.by,
			draw: () => drawCaveRock(canvas, s, ok),
		})),
		...spikes.map((m) => ({
			by: m.by,
			draw: () => drawStalagmite(canvas, m, plots),
		})),
		...edgeMounds(fp, seed, [6, 4, 3, 3]).map((m) => ({
			by: m.by,
			draw: () =>
				drawMound(canvas, m, RUBBLE, DARKER, [C.stoneMid, C.roofShade]),
		})),
		...crystals.map((x) => ({
			by: x.by + 0.5,
			draw: () => drawCrystals(canvas, x, plots),
		})),
	].sort((a, b) => a.by - b.by);
	for (const item of scene) {
		item.draw();
	}
}
