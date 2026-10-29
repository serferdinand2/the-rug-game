// The joined footprint of a layout's impassable plots, ported from the approved #82 spike.
import { PLOT, PITCH, reliefSize } from '../../relief.js';

const MARGIN = 2; // the ground margin on an open side
const RADIUS = 8; // the outer corner radius
const SADDLE = 6; // the half-width of the saddle across a corner join
const CORNER = 16; // how far a corner join may reach into the buildable plots beside it

/**
 * A corner join: two impassable plots that touch only at a corner.
 * @typedef {Object} CornerJoin
 * @property {number} row - The 2×2 block's top-left plot row
 * @property {number} col - The 2×2 block's top-left plot column
 * @property {number} gx - The gap pixel's x
 * @property {number} gy - The gap pixel's y
 * @property {boolean} down - True when the top-left and bottom-right plots are the impassable pair
 */

/**
 * @typedef {Object} Footprint
 * @property {number} rows
 * @property {number} cols
 * @property {number} w
 * @property {number} h
 * @property {Uint8Array} mask - Where a group's floor lies
 * @property {Uint8Array} plots - Every pixel of an impassable plot, plus the gaps between joined plots
 * @property {Uint8Array} reach - `plots` plus each corner patch
 * @property {CornerJoin[]} corners
 */

/**
 * Whether a plot is impassable; false off the layout.
 * @param {readonly string[]} layout
 * @param {number} row
 * @param {number} col
 * @returns {boolean}
 */
export function isImpassable(layout, row, col) {
	if (row < 0 || col < 0 || row >= layout.length || col >= layout[0].length) {
		return false;
	}
	const ch = layout[row][col];
	return ch === '1' || ch === 'X';
}

/**
 * The 8-connected groups of impassable plots, as `row * cols + col` indexes.
 * @param {readonly string[]} layout
 * @returns {number[][]} Each group sorted, the groups in order of their first index
 */
export function impassableGroups(layout) {
	const rows = layout.length;
	const cols = layout[0].length;
	const seen = new Set();
	/** @type {number[][]} */
	const groups = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (!isImpassable(layout, r, c) || seen.has(r * cols + c)) {
				continue;
			}
			/** @type {number[]} */
			const group = [];
			const stack = [[r, c]];
			seen.add(r * cols + c);
			while (stack.length > 0) {
				const [y, x] = /** @type {number[]} */ (stack.pop());
				group.push(y * cols + x);
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const ny = y + dy;
						const nx = x + dx;
						if (
							isImpassable(layout, ny, nx) &&
							!seen.has(ny * cols + nx)
						) {
							seen.add(ny * cols + nx);
							stack.push([ny, nx]);
						}
					}
				}
			}
			groups.push(group.sort((a, b) => a - b));
		}
	}
	return groups;
}

/**
 * What a plot's quadrant looks like from its neighbours.
 * @param {readonly string[]} layout
 * @param {number} r
 * @param {number} c
 * @param {number} qy
 * @param {number} qx
 * @returns {'bridge' | 'outer' | 'edgeH' | 'edgeV' | 'full' | 'inner'}
 */
function shape(layout, r, c, qy, qx) {
	const v = isImpassable(layout, r + qy, c);
	const h = isImpassable(layout, r, c + qx);
	const d = isImpassable(layout, r + qy, c + qx);
	if (!v && !h) {
		return d ? 'bridge' : 'outer';
	}
	if (h && !v) {
		return 'edgeH';
	}
	if (v && !h) {
		return 'edgeV';
	}
	return d ? 'full' : 'inner';
}

/**
 * Whether the quadrant pixel (u, v), counted from the plot's corner, is floor.
 * @param {string} s
 * @param {number} u
 * @param {number} v
 * @returns {boolean}
 */
function inShape(s, u, v) {
	const outer = () => {
		if (u < MARGIN || v < MARGIN) {
			return false;
		}
		const du = u - MARGIN;
		const dv = v - MARGIN;
		if (du < RADIUS && dv < RADIUS) {
			const a = RADIUS - du - 0.5;
			const b = RADIUS - dv - 0.5;
			return a * a + b * b <= RADIUS * RADIUS + 0.5;
		}
		return true;
	};
	switch (s) {
		case 'outer':
			return outer();
		case 'bridge':
			return outer() || (u + v < 18 && Math.abs(u - v) <= SADDLE);
		case 'edgeH':
			return v >= MARGIN;
		case 'edgeV':
			return u >= MARGIN;
		case 'inner':
			return !(u < MARGIN && v < MARGIN);
		default:
			return true;
	}
}

/**
 * Works out the joined footprint of a layout's impassable plots.
 * @param {readonly string[]} layout
 * @returns {Footprint}
 */
export function footprint(layout) {
	const rows = layout.length;
	const cols = layout[0].length;
	const { w, h } = reliefSize(rows, cols);
	const half = PLOT / 2;
	const mask = new Uint8Array(w * h);
	/** @type {CornerJoin[]} */
	const corners = [];
	const imp = (/** @type {number} */ r, /** @type {number} */ c) =>
		isImpassable(layout, r, c);
	const inPlot = (
		/** @type {number} */ r,
		/** @type {number} */ c,
		/** @type {number} */ x,
		/** @type {number} */ y
	) => {
		if (!imp(r, c)) {
			return false;
		}
		const qx = x < half ? -1 : 1;
		const qy = y < half ? -1 : 1;
		return inShape(
			shape(layout, r, c, qy, qx),
			x < half ? x : PLOT - 1 - x,
			y < half ? y : PLOT - 1 - y
		);
	};
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			for (let y = 0; y < PLOT; y++) {
				for (let x = 0; x < PLOT; x++) {
					if (inPlot(r, c, x, y)) {
						mask[(r * PITCH + y) * w + c * PITCH + x] = 1;
					}
				}
			}
		}
	}
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const gx = (c + 1) * PITCH - 1;
			const gy = (r + 1) * PITCH - 1;
			for (let i = 0; i < PLOT; i++) {
				if (
					c < cols - 1 &&
					inPlot(r, c, PLOT - 1, i) &&
					inPlot(r, c + 1, 0, i)
				) {
					mask[(r * PITCH + i) * w + gx] = 1;
				}
				if (
					r < rows - 1 &&
					inPlot(r, c, i, PLOT - 1) &&
					inPlot(r + 1, c, i, 0)
				) {
					mask[gy * w + c * PITCH + i] = 1;
				}
			}
			if (r >= rows - 1 || c >= cols - 1) {
				continue;
			}
			const tl = imp(r, c);
			const tr = imp(r, c + 1);
			const bl = imp(r + 1, c);
			const br = imp(r + 1, c + 1);
			if (tl && tr && bl && br) {
				mask[gy * w + gx] = 1;
			}
			const down = tl && br && !tr && !bl;
			const up = tr && bl && !tl && !br;
			if (down || up) {
				corners.push({ row: r, col: c, gx, gy, down });
				for (let dy = -8; dy <= 8; dy++) {
					for (let dx = -8; dx <= 8; dx++) {
						if (Math.abs(down ? dx - dy : dx + dy) <= SADDLE) {
							mask[(gy + dy) * w + gx + dx] = 1;
						}
					}
				}
			}
		}
	}
	const plots = new Uint8Array(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const c = Math.floor(x / PITCH);
			const r = Math.floor(y / PITCH);
			const vGap = x - c * PITCH >= PLOT;
			const hGap = y - r * PITCH >= PLOT;
			let joined;
			if (vGap && hGap) {
				joined =
					imp(r, c) &&
					imp(r, c + 1) &&
					imp(r + 1, c) &&
					imp(r + 1, c + 1);
			} else if (vGap) {
				joined = imp(r, c) && imp(r, c + 1);
			} else if (hGap) {
				joined = imp(r, c) && imp(r + 1, c);
			} else {
				joined = imp(r, c);
			}
			if (joined) {
				plots[y * w + x] = 1;
			}
		}
	}
	const reach = plots.slice();
	for (const { gx, gy } of corners) {
		for (let dy = -CORNER; dy <= CORNER; dy++) {
			for (let dx = -CORNER; dx <= CORNER; dx++) {
				const x = gx + dx;
				const y = gy + dy;
				if (
					dx * dx + dy * dy <= CORNER * CORNER &&
					x >= 0 &&
					y >= 0 &&
					x < w &&
					y < h
				) {
					reach[y * w + x] = 1;
				}
			}
		}
	}
	return { rows, cols, w, h, mask, plots, reach, corners };
}

/**
 * The footprint's floor, widened by a round patch of the given radius around each corner join's gap
 * pixel, for a relief whose corner pieces stand on a floor of their own.
 * @param {Footprint} fp
 * @param {number} radius - Up to the corner patch's 16
 * @returns {Uint8Array} A new mask
 */
export function withCornerPatches(fp, radius) {
	const { w, h } = fp;
	const area = fp.mask.slice();
	for (const { gx, gy } of fp.corners) {
		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				const x = gx + dx;
				const y = gy + dy;
				if (
					dx * dx + dy * dy <= radius * radius &&
					x >= 0 &&
					y >= 0 &&
					x < w &&
					y < h
				) {
					area[y * w + x] = 1;
				}
			}
		}
	}
	return area;
}

/** A diagonal step of the distance transform: close to √2, and exact in thirds. */
const DIAGONAL = 4 / 3;

/**
 * How far each pixel of a mask lies inside it: the steps to the nearest pixel outside, counting a
 * diagonal step as 4/3 and the canvas's edge as outside. Two passes, so it is quick on a whole mat.
 * @param {Uint8Array} mask - One byte per pixel
 * @param {number} w
 * @param {number} h
 * @returns {Float32Array} 0 outside the mask, 1 on its edge, more further in
 */
export function distanceInside(mask, w, h) {
	const depth = new Float32Array(w * h);
	for (let i = 0; i < depth.length; i++) {
		depth[i] = mask[i] ? Infinity : 0;
	}
	/** @type {(x: number, y: number) => number} */
	const at = (x, y) =>
		x < 0 || y < 0 || x >= w || y >= h ? 0 : depth[y * w + x];
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (depth[i] > 0) {
				depth[i] = Math.min(
					depth[i],
					at(x - 1, y) + 1,
					at(x, y - 1) + 1,
					at(x - 1, y - 1) + DIAGONAL,
					at(x + 1, y - 1) + DIAGONAL
				);
			}
		}
	}
	for (let y = h - 1; y >= 0; y--) {
		for (let x = w - 1; x >= 0; x--) {
			const i = y * w + x;
			if (depth[i] > 0) {
				depth[i] = Math.min(
					depth[i],
					at(x + 1, y) + 1,
					at(x, y + 1) + 1,
					at(x + 1, y + 1) + DIAGONAL,
					at(x - 1, y + 1) + DIAGONAL
				);
			}
		}
	}
	return depth;
}
