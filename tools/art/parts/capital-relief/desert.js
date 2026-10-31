// Sandstone outcrops packed into a mat's impassable footprint: flat-topped buttes and rounded boulders, with sand dunes as their foothills (#82).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import {
	SANDSTONE,
	dither,
	drawRock,
	footShadow,
	rockShape,
	rowPixels,
} from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {import('./rock.js').RockSpec} RockSpec */
/** @typedef {import('./rock.js').Rock} Rock */
/** @typedef {{ bx: number, by: number, hw: number, ph: number }} DuneSpec */

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = SANDSTONE.darker;

/** The rock pieces over a corner join: a butte and a boulder at its foot, [kind, dx, dy, hw, ph], mirrored by the join's direction. */
const CORNER =
	/** @type {[RockSpec['kind'], number, number, number, number][]} */ ([
		['butte', 0, 9, 9, 17],
		['boulder', -6, 11, 4, 4],
	]);

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
	for (const [x, y] of rowPixels(d.rows)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(d.bx, d.by, 31), 2);
	footShadow(
		canvas,
		ok,
		own,
		[d.cx, d.bx + d.hw + 2, d.by - 1, d.by + 1],
		DARKER
	);
	for (const [x, y] of rowPixels(d.rows)) {
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
		for (const [x, y] of rowPixels(shape.rows)) {
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
		for (const [x, y] of rowPixels(d.rows)) {
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
		for (const [x, y] of rowPixels(s.rows)) {
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
		for (const [x, y] of rowPixels(s.rows)) {
			total++;
			banked += bank[y * W + x];
		}
		return banked <= 0.15 * total && fresh(s, plots) >= 0.35;
	};
	/** @type {(s: Rock, ok: Uint8Array) => void} */
	const add = (s, ok) => {
		rocks.push({ s, ok });
		for (const [x, y] of rowPixels(s.rows)) {
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
			for (const [x, y] of rowPixels(d.rows)) {
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
		for (const [x, y] of rowPixels(s.rows)) {
			const i = y * W + x;
			total++;
			seen += rocksInFront[i] || (butte && dunesInFront[i]) ? 0 : 1;
		}
		if (ok !== reach && seen < (butte ? 0.65 : 0.95) * total) {
			hidden.add(s);
			continue;
		}
		for (const [x, y] of rowPixels(s.rows)) {
			rocksInFront[y * W + x] = 1;
		}
	}
	for (const item of scene) {
		if (item.s && !hidden.has(item.s)) {
			drawRock(canvas, item.s, item.ok);
		} else if (item.d) {
			drawDune(canvas, fp, item.d, item.ok);
		}
	}
}
