// Broadleaf trees and pines packed into a mat's impassable footprint, ported from the approved #82 spike.
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { cast, put } from './canvas.js';
import { withCornerPatches } from './footprint.js';
import { hash, noise } from './ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('./footprint.js').Footprint} Footprint */
/** @typedef {{ corner: boolean, bx: number, by: number, r: number, tone: number, kind: 'pine' | 'leaf' }} Tree */

const LEAF = [
	[C.pineShade, C.pine, C.pineLight, C.grassLight],
	[C.forestFloorShade, C.forestFloor, C.forestFloorLight, C.grassLight],
];

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = /** @type {Record<string, string>} */ ({
	[C.forestFloorLight]: C.forestFloor,
	[C.forestFloor]: C.forestFloorShade,
	[C.forestFloorShade]: C.pineShade,
	[C.pineShade]: C.night,
});

/** The trees of a corner join: [dx, dy, radius, tone], mirrored by the join's direction. */
const CLUMP = [
	[-8, -1, 3, 1],
	[5, -3, 3, 0],
	[-3, 1, 3, 0],
	[3, 3, 3, 1],
	[-9, 6, 3, 1],
	[-5, 7, 4, 0],
	[2, 8, 4, 0],
	[7, 10, 3, 1],
];

/**
 * A soft floor under the group: ragged at its edge, so it fades into the ground.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Uint8Array} mask - The floor's area
 * @param {number} seed
 */
function drawFloor(canvas, fp, mask, seed) {
	const { w, h } = fp;
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
			put(
				canvas,
				mask,
				x,
				y,
				rand() < 0.3 ? C.forestFloor : C.forestFloorShade
			);
		}
	}
}

/**
 * A round broadleaf tree with a trunk, lit from the upper left.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} r
 * @param {number} tone
 * @param {() => number} rand
 */
function broadleaf(canvas, ok, bx, by, r, tone, rand) {
	const cy = by - 3 - r;
	for (let y = by - 3; y <= by; y++) {
		for (let x = bx - 1; x <= bx; x++) {
			put(canvas, ok, x, y, x === bx ? C.timberShade : C.timber);
		}
	}
	for (let y = -r - 1; y <= r + 1; y++) {
		for (let x = -r - 1; x <= r + 1; x++) {
			const q =
				(x * x) / ((r + 0.4) * (r + 0.4)) +
				(y * y) / ((r - 0.2) * (r - 0.2));
			if (q > 1 + rand() * 0.1) {
				continue;
			}
			const shade = -x * 0.55 - y * 0.75 + (rand() - 0.5) * 2.2;
			const k =
				shade > r * 0.55 ? 3 : shade > 0 ? 2 : shade > -r * 0.6 ? 1 : 0;
			put(
				canvas,
				ok,
				bx + x,
				cy + y,
				q > 0.82 ? (k >= 2 ? LEAF[tone][1] : C.night) : LEAF[tone][k]
			);
		}
	}
}

/**
 * A pine: a stack of widening tiers on a short trunk.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok
 * @param {number} bx
 * @param {number} by
 * @param {number} hgt
 */
function pine(canvas, ok, bx, by, hgt) {
	put(canvas, ok, bx, by, C.timberShade);
	put(canvas, ok, bx, by - 1, C.timberShade);
	for (let y = 0; y < hgt; y++) {
		const half = Math.floor(((hgt - y) / hgt) * 4 + ((y % 4) / 4) * 1.2);
		for (let x = -half; x <= half; x++) {
			const col =
				x === -half || x === half
					? C.night
					: x < 0
						? C.pine
						: C.pineShade;
			put(
				canvas,
				ok,
				bx + x,
				by - 2 - y,
				y === hgt - 1
					? C.night
					: x < 0 && y % 4 === 1
						? C.pineLight
						: col
			);
		}
	}
}

/**
 * Packs broadleaf trees and pines into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintForest(canvas, fp, seed) {
	const { w: W, h: H, plots, reach, corners } = fp;
	// Corner joins carry trees too, so their floor reaches into a round patch.
	const mask = withCornerPatches(fp, 7);
	drawFloor(canvas, fp, mask, seed);
	const rand = seededRandom(hash(seed, 3));
	/** @type {Tree[]} */
	const trees = [];
	for (let y = 0; y < H; y += 5) {
		for (let x = (y / 5) % 2 ? 3 : 0; x < W; x += 6) {
			const bx = x + Math.floor(rand() * 3) - 1;
			const by = y + Math.floor(rand() * 3) - 1;
			if (
				bx < 0 ||
				by < 0 ||
				bx >= W ||
				by >= H ||
				!mask[by * W + bx] ||
				!plots[by * W + bx]
			) {
				continue;
			}
			trees.push({
				corner: false,
				bx,
				by,
				r: 3 + Math.floor(rand() * 2.4),
				tone: rand() < 0.6 ? 0 : 1,
				kind: rand() < 0.22 ? 'pine' : 'leaf',
			});
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [dx, dy, r, tone] of CLUMP) {
			trees.push({
				corner: true,
				bx: gx + dx * f,
				by: gy + dy,
				r,
				tone,
				kind: 'leaf',
			});
		}
	}
	/** @type {(t: Tree) => boolean} */
	const fits = (t) => {
		const top = t.kind === 'pine' ? t.by - 11 - t.r : t.by - 4 - 2 * t.r;
		const half = t.kind === 'pine' ? 5 : t.r + 1;
		const area = t.corner ? reach : plots;
		for (let y = top; y <= t.by; y++) {
			for (let x = t.bx - half; x <= t.bx + half; x++) {
				if (x < 0 || y < 0 || x >= W || y >= H || !area[y * W + x]) {
					return false;
				}
			}
		}
		return true;
	};
	const placed = trees.filter((t) => {
		if (fits(t)) {
			return true;
		}
		t.r = 2;
		t.kind = 'leaf';
		return fits(t);
	});
	placed.sort((a, b) => a.by - b.by);
	// Each tree's shadow first: translucent ink on empty ground, a darker tone on painted ground.
	for (const t of placed) {
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = 0; dx <= t.r + 2; dx++) {
				const x = t.bx + dx;
				const y = t.by + dy;
				if (x >= 0 && y >= 0 && x < W && y < H && reach[y * W + x]) {
					cast(canvas, x, y, 0.25, DARKER);
				}
			}
		}
	}
	// Then the trees, from the back to the front.
	for (const t of placed) {
		if (t.kind === 'pine') {
			pine(canvas, reach, t.bx, t.by, 9 + t.r);
		} else {
			broadleaf(canvas, reach, t.bx, t.by, t.r, t.tone, rand);
		}
	}
}
