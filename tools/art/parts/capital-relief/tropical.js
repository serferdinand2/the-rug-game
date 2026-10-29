// Jungle packed into a mat's impassable footprint: palms among bright broadleaf crowns, with vines, red flowers and ferns (#82).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { cast, put } from '../../../../src/lib/art/paint/relief/canvas.js';
import {
	distanceInside,
	withCornerPatches,
} from '../../../../src/lib/art/paint/relief/footprint.js';
import {
	BAYER,
	hash,
	noise,
} from '../../../../src/lib/art/paint/relief/ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {[x: number, y: number, colour: string]} Pixel */

/**
 * A palm, a broadleaf crown or a fern, standing on its base pixel.
 * @typedef {Object} Plant
 * @property {'palm' | 'crown' | 'fern'} kind
 * @property {number} bx
 * @property {number} by
 * @property {number} size - A palm's trunk height, a crown's radius or a fern's frond length
 * @property {number} lean - Which way a palm's trunk curves: -1 to the left, 1 to the right
 * @property {boolean} corner - It stands over a corner join, so it may use the reach
 */

/** Broadleaf crown tones, dark to light: brighter than the Forest's. */
const CROWN = [C.grassShade, C.grass, C.grassLight, C.jungleLeafLight];

/** Palm frond tones: underside, middle and lit top. Darker than the crowns, so a fan stands out against them. */
const FROND = [C.pineShade, C.pine, C.lilyPad];

/** Palm trunk tones, [lit, shaded]: a plain row, then a ring. */
const TRUNK = [
	[C.sandShade, C.timber],
	[C.timberLight, C.timberShade],
];

/** Fern tones, dark to light: the ground's own, so the jungle's edge turns to ground. */
const FERN = [C.pineShade, C.pine, C.pineLight, C.grassLight];

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = /** @type {Record<string, string>} */ ({
	[C.pineLight]: C.pine,
	[C.pine]: C.pineShade,
	[C.forestFloorShade]: C.pineShade,
	[C.pineShade]: C.night,
});

/**
 * Each palm frond, from the back of the fan to the front: its angle in degrees (0 points right, 90 up),
 * its length as a share of the longest, and how far its tip droops.
 */
const FRONDS = [
	[104, 0.55, 0.1],
	[72, 0.55, 0.1],
	[146, 0.85, 0.3],
	[36, 0.85, 0.3],
	[172, 1, 0.5],
	[10, 1, 0.5],
	[208, 0.6, 0.25],
	[-30, 0.6, 0.25],
];

/** The leaf clumps of a broadleaf crown, from the back to the front: [dx, dy, radius] as shares of its radius. */
const LOBES = [
	[0, -0.5, 0.56],
	[-0.55, -0.1, 0.55],
	[0.55, -0.05, 0.55],
	[-0.3, 0.42, 0.55],
	[0.35, 0.45, 0.5],
];

/** Where to try a palm in a plot that has none: [dx, dy, trunk height] from the plot's corner. */
const PLOT_PALMS = [
	[17, 25, 11],
	[14, 27, 10],
	[17, 23, 8],
];

/** The plants over a corner join: [kind, dx, dy, size], mirrored by the join's direction. */
const CORNER = /** @type {[Plant['kind'], number, number, number][]} */ ([
	['crown', -3, 0, 4],
	['palm', 2, 7, 10],
	['fern', -6, 9, 2],
	['fern', 7, 10, 2],
]);

/**
 * The jungle floor: deep shade under the canopy, turning to the ground's greens at a ragged rim.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Uint8Array} area - The floor's area
 * @param {Float32Array} depth - How far each pixel lies inside the area
 * @param {number} seed
 */
function drawFloor(canvas, fp, area, depth, seed) {
	const { w: W, h: H } = fp;
	const ragged = noise(seed + 3, 3);
	const grain = noise(seed + 4, 2.5);
	for (let y = 1; y < H - 1; y++) {
		for (let x = 1; x < W - 1; x++) {
			const i = y * W + x;
			if (!area[i]) {
				continue;
			}
			const n = grain(x, y) + BAYER[(y % 4) * 4 + (x % 4)] * 0.3;
			let col;
			if (depth[i] <= 2.5) {
				// The rim frays into the ground, with no outline.
				if (ragged(x, y) < 0.5) {
					continue;
				}
				col = n > 0.55 ? C.pineLight : C.pine;
			} else {
				col =
					n > 0.72
						? C.pine
						: n > 0.3
							? C.pineShade
							: C.forestFloorShade;
			}
			put(canvas, area, x, y, col);
		}
	}
}

/**
 * The pixels of a broadleaf crown: a lumpy canopy of leaf clumps, each lit from the upper left with a
 * dark rim below, an outline on the shaded side, a short trunk, and maybe red flowers and hanging vines.
 * @param {Plant} p
 * @param {() => number} rand
 * @returns {Pixel[]}
 */
function crownPixels(p, rand) {
	const r = p.size;
	const cy = p.by - 2 - r;
	/** @type {Pixel[]} */
	const px = [
		[p.bx - 1, p.by - 1, C.timber],
		[p.bx, p.by - 1, C.timberShade],
		[p.bx - 1, p.by, C.timberShade],
		[p.bx, p.by, C.timberShade],
	];
	/** Each canopy pixel's tone, 0 to 3, and the clump it belongs to, by `${x},${y}`. @type {Map<string, [number, number]>} */
	const leaf = new Map();
	LOBES.forEach(([ox, oy, s], n) => {
		const lr = Math.max(1.6, r * s + 0.3);
		const lx = p.bx + Math.round(ox * r);
		const ly = cy + Math.round(oy * r);
		const reach = Math.ceil(lr) + 1;
		for (let y = -reach; y <= reach; y++) {
			for (let x = -reach; x <= reach; x++) {
				const q =
					(x * x) / ((lr + 0.4) * (lr + 0.4)) + (y * y) / (lr * lr);
				if (q > 1 + rand() * 0.08) {
					continue;
				}
				const shade = (-x * 0.6 - y * 0.8) / lr + (rand() - 0.5) * 0.3;
				const rim = q > 0.45 && x * 0.4 + y > 0.25 * lr;
				leaf.set(`${lx + x},${ly + y}`, [
					rim ? 0 : shade > 0.65 ? 3 : shade > 0.05 ? 2 : 1,
					n,
				]);
			}
		}
	});
	const has = (/** @type {number} */ x, /** @type {number} */ y) =>
		leaf.has(`${x},${y}`);
	/** The clump that owns a pixel: -1 off the canopy. */
	const owner = (/** @type {number} */ x, /** @type {number} */ y) =>
		leaf.get(`${x},${y}`)?.[1] ?? -1;
	/** @type {[number, number][]} */
	const lit = [];
	/** @type {Map<number, number>} */
	const bottom = new Map();
	for (const [key, [k, n]] of leaf) {
		const [x, y] = key.split(',').map(Number);
		let col = CROWN[k];
		if (!has(x + 1, y) || !has(x, y + 1)) {
			// The outline: dark on the shaded side, softened where the light falls.
			col = k >= 2 ? CROWN[1] : C.night;
		} else if (owner(x, y + 1) > n || owner(x + 1, y + 1) > n) {
			// A crease where a clump in front meets the one behind it.
			col = CROWN[0];
		} else if (k === 3) {
			lit.push([x, y]);
		}
		px.push([x, y, col]);
		bottom.set(x, Math.max(bottom.get(x) ?? -Infinity, y));
	}
	// A few red flowers on the sunlit leaves.
	const flowers = rand() < 0.25 ? (rand() < 0.3 ? 2 : 1) : 0;
	for (let n = 0; n < flowers && lit.length > 0; n++) {
		const [x, y] = lit[Math.floor(rand() * lit.length)];
		px.push([x, y, C.brickRedLight]);
		px.push([x + 1, y, C.brickRed]);
	}
	// Vines draped over the leaves from the middle of the crown and hanging below it, leafy every
	// other pixel: dark across the leaves, light against the shade beneath.
	const vines = rand() < 0.6 ? 1 + Math.floor(rand() * 2) : 0;
	for (let n = 0; n < vines; n++) {
		let x = p.bx + Math.round((rand() * 2 - 1) * (r - 1));
		const from = bottom.get(x);
		// No vine hangs down the trunk, which stands on the two middle columns.
		if (from === undefined || x === p.bx || x === p.bx - 1) {
			continue;
		}
		const out = x < p.bx ? -1 : 1;
		const long = 2 + Math.floor(rand() * 3);
		for (let y = cy + 1, k = 1; y <= from + long; y++, k++) {
			if (k % 3 === 0) {
				x += out;
			}
			const below = y > (bottom.get(x) ?? from);
			px.push([x, y, below ? C.lilyPad : C.pineShade]);
			if (k % 2 === 0) {
				px.push([x + out, y, below ? C.grassLight : C.lilyPad]);
			}
		}
	}
	return px;
}

/**
 * The pixels of a palm: a ringed trunk curving up from the ground, under a fan of arching fronds lit
 * from above, outlined under the shaded side, with coconuts at its heart.
 * @param {Plant} p
 * @param {() => number} rand
 * @returns {Pixel[]}
 */
function palmPixels(p, rand) {
	const th = p.size;
	const bend = p.lean * (1 + Math.floor(rand() * 2));
	/** @type {Pixel[]} */
	const px = [];
	let top = p.bx;
	for (let k = 0; k <= th; k++) {
		const x = p.bx + Math.round(bend * (k / th) * (k / th));
		const y = p.by - k;
		if (k === 0) {
			// The foot turns to the floor's colours.
			px.push([x, y, C.pineShade], [x + 1, y, C.pineShade]);
			continue;
		}
		const [light, dark] = TRUNK[(p.by - y) % 3 === 0 ? 1 : 0];
		px.push([x, y, light], [x + 1, y, dark]);
		top = x;
	}
	const cx = top + (bend > 0 ? 1 : 0);
	const cy = p.by - th - 1;
	const longest = th >= 10 ? 8 : 6;
	/** @type {Map<string, string>} */
	const fan = new Map();
	for (const [deg, share, droop] of FRONDS) {
		const a = ((deg + (rand() - 0.5) * 12) * Math.PI) / 180;
		const len = Math.max(3, Math.round(longest * share));
		const shaded = Math.cos(a) > 0.1;
		/** @type {[number, number][]} */
		const spine = [];
		for (let t = 1; t <= len; t++) {
			const x = cx + Math.round(Math.cos(a) * t);
			const y = cy - Math.round(Math.sin(a) * t - (droop * t * t) / len);
			spine.push([x, y]);
		}
		// A blade two pixels deep, lit along its top, thinning to a single pixel at the tip.
		spine.forEach(([x, y], t) => {
			if (t < len - 1) {
				fan.set(`${x},${y + 1}`, shaded ? FROND[0] : FROND[1]);
			}
		});
		for (const [x, y] of spine) {
			fan.set(`${x},${y}`, shaded ? FROND[1] : FROND[2]);
		}
	}
	fan.set(`${cx},${cy + 1}`, C.timberShade);
	fan.set(`${cx - 1},${cy + 1}`, C.timber);
	for (const [key, col] of fan) {
		const [x, y] = key.split(',').map(Number);
		// An outline under the fronds on the shaded side.
		const edge = x > cx && !fan.has(`${x},${y + 1}`) && col === FROND[0];
		px.push([x, y, edge ? C.night : col]);
	}
	return px;
}

/**
 * The pixels of a fern: a low fan of fronds in the ground's greens, lit on the left.
 * @param {Plant} p
 * @returns {Pixel[]}
 */
function fernPixels(p) {
	/** @type {Pixel[]} */
	const px = [[p.bx, p.by, FERN[0]]];
	for (const deg of [168, 128, 90, 52, 12]) {
		const a = (deg * Math.PI) / 180;
		const len = p.size + (deg === 90 ? 0 : 1);
		for (let t = 1; t <= len; t++) {
			const x = p.bx + Math.round(Math.cos(a) * t);
			const y =
				p.by -
				Math.round(Math.sin(a) * t) +
				(t === len && deg !== 90 ? 1 : 0);
			const col =
				x < p.bx ? FERN[t === 1 ? 2 : 3] : x > p.bx ? FERN[1] : FERN[2];
			px.push([x, y, col]);
		}
	}
	return px;
}

/**
 * The pixels of any plant.
 * @param {Plant} p
 * @param {number} seed
 * @returns {Pixel[]}
 */
function plantPixels(p, seed) {
	const own = seededRandom(hash(p.bx, p.by, seed));
	if (p.kind === 'palm') {
		return palmPixels(p, own);
	}
	return p.kind === 'crown' ? crownPixels(p, own) : fernPixels(p);
}

/**
 * Packs palms, broadleaf crowns and ferns into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintTropical(canvas, fp, seed) {
	const { w: W, h: H, plots, reach, corners } = fp;
	// Corner joins carry plants too, so their floor reaches into a round patch.
	const area = withCornerPatches(fp, 7);
	const depth = distanceInside(area, W, H);
	drawFloor(canvas, fp, area, depth, seed);
	const rand = seededRandom(hash(seed, 13));
	/** @type {Plant[]} */
	const plants = [];
	// Palms and crowns inside the floor.
	for (let row = 0, y = 0; y < H; row++, y += 6) {
		for (let x = row % 2 ? 4 : 0; x < W; x += 7) {
			const bx = x + Math.floor(rand() * 3) - 1;
			const by = y + Math.floor(rand() * 3) - 1;
			const palm = rand() < 0.4;
			const grow = rand();
			const lean = rand() < 0.5 ? -1 : 1;
			if (bx < 0 || by < 0 || bx >= W || by >= H) {
				continue;
			}
			const i = by * W + bx;
			if (!plots[i] || depth[i] < 2) {
				continue;
			}
			plants.push({
				kind: palm ? 'palm' : 'crown',
				bx,
				by,
				size: palm
					? 11 + Math.floor(grow * 4)
					: 4 + Math.floor(grow * 2.4),
				lean,
				corner: false,
			});
		}
	}
	// Ferns along the rim, where the jungle meets the ground.
	for (let row = 0, y = 0; y < H; row++, y += 3) {
		for (let x = row % 2 ? 2 : 0; x < W; x += 4) {
			const bx = x + Math.floor(rand() * 3) - 1;
			const by = y + Math.floor(rand() * 3) - 1;
			const roll = rand();
			const grow = rand();
			if (bx < 0 || by < 0 || bx >= W || by >= H) {
				continue;
			}
			const i = by * W + bx;
			if (!plots[i] || depth[i] < 1.5 || depth[i] > 3.5 || roll > 0.5) {
				continue;
			}
			plants.push({
				kind: 'fern',
				bx,
				by,
				size: 2 + Math.floor(grow * 1.6),
				lean: 0,
				corner: false,
			});
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [kind, dx, dy, size] of CORNER) {
			plants.push({
				kind,
				bx: gx + dx * f,
				by: gy + dy,
				size,
				lean: f,
				corner: true,
			});
		}
	}
	/** @type {(p: Plant) => Pixel[] | null} */
	const fit = (p) => {
		const ok = p.corner ? reach : plots;
		const px = plantPixels(p, seed);
		for (const [x, y] of px) {
			if (x < 0 || y < 0 || x >= W || y >= H || !ok[y * W + x]) {
				return null;
			}
		}
		return px;
	};
	/** @type {{ p: Plant, px: Pixel[] }[]} */
	const placed = [];
	for (const p of plants) {
		let px = fit(p);
		if (!px && p.kind !== 'fern') {
			// Too big for its room: a smaller plant of its kind, or nothing.
			p.size = p.kind === 'palm' ? 8 : 3;
			px = fit(p);
		}
		if (px) {
			placed.push({ p, px });
		}
	}
	// Every impassable plot shows at least one palm, so even a lone plot reads as jungle.
	for (let row = 0; row < fp.rows; row++) {
		for (let col = 0; col < fp.cols; col++) {
			const x0 = col * PITCH;
			const y0 = row * PITCH;
			const mid = (y0 + PLOT / 2) * W + x0 + PLOT / 2;
			const inPlot = (/** @type {Plant} */ p) =>
				p.bx >= x0 &&
				p.bx < x0 + PLOT &&
				p.by >= y0 &&
				p.by < y0 + PLOT;
			if (
				!plots[mid] ||
				placed.some(({ p }) => p.kind === 'palm' && inPlot(p))
			) {
				continue;
			}
			for (const [dx, dy, size] of PLOT_PALMS) {
				/** @type {Plant} */
				const p = {
					kind: 'palm',
					bx: x0 + dx,
					by: y0 + dy,
					size,
					lean: (row + col) % 2 ? 1 : -1,
					corner: false,
				};
				const px = fit(p);
				if (px) {
					placed.push({ p, px });
					break;
				}
			}
		}
	}
	placed.sort((a, b) => a.p.by - b.p.by);
	// Each plant's shadow first: translucent ink on empty ground, a darker tone on painted ground.
	for (const { p } of placed) {
		const ok = p.corner ? reach : plots;
		const wide =
			p.kind === 'crown' ? p.size + 2 : p.kind === 'palm' ? 4 : 2;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = 0; dx <= wide; dx++) {
				const x = p.bx + dx;
				const y = p.by + dy;
				if (x >= 0 && y >= 0 && x < W && y < H && ok[y * W + x]) {
					cast(canvas, x, y, 0.25, DARKER);
				}
			}
		}
	}
	// Then the plants, from the back to the front.
	for (const { p, px } of placed) {
		const ok = p.corner ? reach : plots;
		for (const [x, y, col] of px) {
			put(canvas, ok, x, y, col);
		}
	}
}
