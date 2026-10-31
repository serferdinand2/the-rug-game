// Low mounds along a relief's open sides and below its corner joins, so a group grows out of the ground (#82's foothills, for #132).
import { seededRandom } from '../../painter.js';
import { PITCH } from '../../../../src/lib/art/relief.js';
import { put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';
import { blockedOf, fitsIn } from './pack.js';
import { dither, footShadow, rowPixels } from './rock.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */

/**
 * A mound standing on its base pixel, and where it may paint.
 * @typedef {{ bx: number, by: number, hw: number, ph: number, area: Uint8Array }} Mound
 */

/**
 * A mound's rows: a half-ellipse on its base.
 * @param {{ bx: number, by: number, hw: number, ph: number }} m
 * @returns {number[][]} Each row as [y, left, right]
 */
export function moundRows({ bx, by, hw, ph }) {
	/** @type {number[][]} */
	const rows = [];
	for (let y = by - ph; y <= by; y++) {
		const v = (by - y) / ph;
		const half = Math.round(hw * Math.sqrt(Math.max(0, 1 - v * v)));
		rows.push([y, bx - half, bx + half]);
	}
	return rows;
}

/**
 * Draws a mound lit on the left, with a pale rim along its top and a few stones on it.
 * @param {Canvas} canvas
 * @param {Mound} m
 * @param {readonly string[]} tones - Its rim, lit, middle, shaded and deep tones
 * @param {Readonly<Record<string, string>>} darker - The shadow it casts on painted ground
 * @param {readonly string[]} [stones] - A stone's lit and shaded pixels, if it has stones
 */
export function drawMound(canvas, m, tones, darker, stones) {
	const W = canvas.w;
	const rows = moundRows(m);
	/** @type {Set<number>} */
	const own = new Set();
	for (const [x, y] of rowPixels(rows)) {
		own.add(y * W + x);
	}
	const grain = noise(hash(m.bx, m.by, 31), 2);
	footShadow(
		canvas,
		m.area,
		own,
		[m.bx, m.bx + m.hw + 2, m.by - 1, m.by + 1],
		darker
	);
	for (const [x, y] of rowPixels(rows)) {
		const u = (x - m.bx) / m.hw;
		const v = (m.by - y) / m.ph;
		const light =
			-u * 0.8 + v * 0.6 + (grain(x, y) - 0.5) * 0.6 + dither(x, y) * 0.3;
		let col =
			light > 0.35
				? tones[1]
				: light > -0.15
					? tones[2]
					: light > -0.55
						? tones[3]
						: tones[4];
		if (!own.has(y * W + x - W)) {
			col = u < 0.2 ? tones[0] : tones[3];
		}
		put(canvas, m.area, x, y, col);
	}
	if (!stones) {
		return;
	}
	const rand = seededRandom(hash(m.bx, m.by, 5));
	for (let k = 0; k < Math.floor(m.hw / 4); k++) {
		const x = m.bx + Math.round((rand() - 0.5) * m.hw);
		const y = m.by - Math.round(rand() * m.ph * 0.6);
		if (own.has(y * W + x) && own.has(y * W + x + 1)) {
			put(canvas, m.area, x, y, stones[0]);
			put(canvas, m.area, x + 1, y, stones[1]);
		}
	}
}

/**
 * The mounds along every open side of each impassable plot, and two below each corner join, that fit.
 * @param {Footprint} fp
 * @param {number} seed
 * @param {readonly number[]} size - A front mound's least half-width, its spread, its least height and its spread
 * @returns {Mound[]}
 */
export function edgeMounds(fp, seed, [hw0, hwr, ph0, phr]) {
	const blocked = blockedOf(fp);
	/** @type {Mound[]} */
	const out = [];
	for (let r = 0; r < fp.rows; r++) {
		for (let c = 0; c < fp.cols; c++) {
			if (!blocked(r, c)) {
				continue;
			}
			const x0 = c * PITCH;
			const y0 = r * PITCH;
			const hr = seededRandom(hash(r, c, seed, 17));
			const size = () => ({
				hw: hw0 + Math.floor(hr() * hwr),
				ph: ph0 + Math.floor(hr() * phr),
			});
			if (!blocked(r + 1, c)) {
				for (const dx of [8, 22]) {
					out.push({
						bx: x0 + dx + Math.floor(hr() * 3),
						by: y0 + 31 - Math.floor(hr() * 2),
						...size(),
						area: fp.plots,
					});
				}
			}
			if (!blocked(r, c - 1)) {
				out.push({
					bx: x0 + 6,
					by: y0 + 20 + Math.floor(hr() * 8),
					hw: 6,
					ph: ph0 + Math.floor(hr() * 2),
					area: fp.plots,
				});
			}
			if (!blocked(r, c + 1)) {
				out.push({
					bx: x0 + 25,
					by: y0 + 20 + Math.floor(hr() * 8),
					hw: 6,
					ph: ph0 + Math.floor(hr() * 2),
					area: fp.plots,
				});
			}
		}
	}
	for (const { gx, gy, down } of fp.corners) {
		const f = down ? 1 : -1;
		out.push({ bx: gx - 5 * f, by: gy + 13, hw: 5, ph: 4, area: fp.reach });
		out.push({ bx: gx + 4 * f, by: gy + 11, hw: 5, ph: 5, area: fp.reach });
	}
	return out.filter((m) => fitsIn(moundRows(m), m.area, fp.w, fp.h));
}
