// Dark pools ringed by reed beds, cattails and low bushes, packed into a mat's impassable footprint (#82).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { cast, put } from '../../../../src/lib/art/paint/relief/canvas.js';
import { distanceInside, withCornerPatches } from '../../../../src/lib/art/paint/relief/footprint.js';
import { BAYER, hash, noise } from '../../../../src/lib/art/paint/relief/ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../../../src/lib/art/paint/relief/footprint.js').Footprint} Footprint */
/** @typedef {[x: number, y: number, colour: string]} Pixel */

/**
 * A reed clump, a cattail clump or a low bush, standing on its base pixel.
 * @typedef {Object} Clump
 * @property {'reed' | 'cattail' | 'bush'} kind
 * @property {number} bx
 * @property {number} by
 * @property {number} half - Half its width, without the leaves that lean out
 * @property {number} tall - Its height above the base, without the cattail heads
 * @property {number} tone - Which of REEDS it is painted in
 * @property {boolean} corner - It stands over a corner join, so it may use the reach
 * @property {boolean} islet - It stands in a pool, on a mud islet of its own
 */

/** How far into the footprint a pool starts, in pixels: the width of the reed beds round it. */
const POOL = 5;

/** How far each pool sits toward the front of its footprint, in pixels. */
const LIFT = 3;

/** The narrowest bank between a pool and the meadow, in pixels. */
const BANK = 3;

/** Reed tones, dark to light: straw, then green. */
const REEDS = [
	[C.quagReedShade, C.quagReed, C.swampReed, C.quagReedLight],
	[C.pineShade, C.lilyPadShade, C.lilyPad, C.grassLight],
];

/** Bush tones, dark to light. */
const BUSH = [C.pineShade, C.pine, C.pineLight, C.grassLight];

/** What each reed tone looks like reflected in the dark water. */
const REFLECTED = /** @type {Record<string, string>} */ ({
	[C.quagReedLight]: C.quagReedShade,
	[C.swampReed]: C.quagReedShade,
	[C.lilyPad]: C.lilyPadShade,
	[C.grassLight]: C.lilyPadShade,
	[C.quagCattail]: C.quagPeat,
	[C.timberLight]: C.quagPeat,
	[C.timberShade]: C.quagPeat,
});

/** The next tone down, for a shadow that falls on painted ground. */
const DARKER = /** @type {Record<string, string>} */ ({
	[C.forestFloorLight]: C.forestFloor,
	[C.forestFloor]: C.forestFloorShade,
	[C.forestFloorShade]: C.pineShade,
	[C.pineShade]: C.night,
	[C.swampMudLight]: C.swampMud,
	[C.swampMud]: C.swampMudShade,
	[C.swampMudShade]: C.quagPeat,
	[C.swampWaterLight]: C.swampWater,
	[C.swampWater]: C.swampWaterDeep,
	[C.swampWaterDeep]: C.quagWaterDeep,
	[C.lilyPad]: C.lilyPadShade,
	[C.lilyPadShade]: C.pineShade,
});

/** The clumps over a corner join: [dx, dy, half, tall, kind], mirrored by the join's direction. */
const CORNER =
	/** @type {[number, number, number, number, Clump['kind']][]} */ ([
		[-6, -2, 2, 6, 'reed'],
		[5, -3, 2, 5, 'reed'],
		[0, 3, 3, 8, 'cattail'],
		[-6, 7, 2, 5, 'reed'],
		[6, 9, 3, 4, 'bush'],
	]);

/**
 * A box blur of a field, across and then down, so a pool drawn from it rounds off its corners.
 * @param {Float32Array} field
 * @param {number} w
 * @param {number} h
 * @param {number} r - The blur's radius in pixels
 * @returns {Float32Array}
 */
function blur(field, w, h, r) {
	const across = new Float32Array(w * h);
	const out = new Float32Array(w * h);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let sum = 0;
			for (let k = -r; k <= r; k++) {
				const xx = x + k;
				sum += xx < 0 || xx >= w ? 0 : field[y * w + xx];
			}
			across[y * w + x] = sum / (2 * r + 1);
		}
	}
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			let sum = 0;
			for (let k = -r; k <= r; k++) {
				const yy = y + k;
				sum += yy < 0 || yy >= h ? 0 : across[yy * w + x];
			}
			out[y * w + x] = sum / (2 * r + 1);
		}
	}
	return out;
}

/**
 * The marsh floor: pools deep inside the footprint, their banks, and reed-bed ground fraying into the
 * meadow at the rim.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Uint8Array} area - The floor's area
 * @param {Float32Array} depth - How far each pixel lies inside the area
 * @param {Uint8Array} water - Where the pools are
 * @param {number} seed
 */
function drawMarsh(canvas, fp, area, depth, water, seed) {
	const { w: W, h: H } = fp;
	const ragged = noise(seed + 3, 3);
	const grain = noise(seed + 4, 2.5);
	const ripple = noise(seed + 5, 4);
	for (let y = 1; y < H - 1; y++) {
		for (let x = 1; x < W - 1; x++) {
			const i = y * W + x;
			if (!area[i]) {
				continue;
			}
			const n = grain(x, y) + BAYER[(y % 4) * 4 + (x % 4)] * 0.3;
			let col;
			if (water[i]) {
				// Dark under the far bank; level ripples catch the light further out.
				const lit = ripple(x * 0.35, y);
				if (!water[i - W] || !water[i - 2 * W]) {
					col = C.swampWaterDeep;
				} else if (y % 2 === 0 && lit > 0.68) {
					col = lit > 0.8 ? C.swampWaterLight : C.swampWater;
				} else {
					col =
						n + lit * 0.4 > 0.78 ? C.swampWater : C.swampWaterDeep;
				}
			} else if (water[i - W]) {
				// The near bank's lip, lit.
				col = n > 0.35 ? C.swampMudLight : C.swampMud;
			} else if (water[i + W] || water[i + 2 * W]) {
				// The far bank's face, above the water.
				col = n > 0.45 ? C.swampMudShade : C.quagPeat;
			} else if (depth[i] <= 2.5) {
				// A muddy rim that frays into the meadow, with no outline.
				if (ragged(x, y) < 0.5) {
					continue;
				}
				col =
					n > 0.7
						? C.swampMudLight
						: n > 0.35
							? C.swampMud
							: C.forestFloorShade;
			} else {
				col =
					n > 0.7
						? C.forestFloor
						: n > 0.3
							? C.forestFloorShade
							: n > 0.12
								? C.swampMudShade
								: C.pineShade;
			}
			put(canvas, area, x, y, col);
		}
	}
}

/**
 * A few lily pads on the open water, some in flower.
 * @param {Canvas} canvas
 * @param {Footprint} fp
 * @param {Float32Array} depth
 * @param {Uint8Array} water
 * @param {number} seed
 */
function drawLilies(canvas, fp, depth, water, seed) {
	const { w: W, h: H } = fp;
	const rand = seededRandom(hash(seed, 61));
	for (let row = 0, y = 2; y < H - 2; row++, y += 5) {
		for (let x = row % 2 ? 3 : 0; x < W - 4; x += 7) {
			if (
				rand() > 0.3 ||
				!water[y * W + x] ||
				depth[y * W + x] < POOL + 3
			) {
				continue;
			}
			const w = 3 + Math.floor(rand() * 2);
			for (let i = 0; i < w; i++) {
				if (i > 0 && i < w - 1) {
					put(canvas, water, x + i, y, C.lilyPad);
				}
				put(
					canvas,
					water,
					x + i,
					y + 1,
					i === w - 1 ? C.lilyPadShade : C.lilyPad
				);
			}
			if (rand() < 0.35) {
				put(canvas, water, x + 1, y, C.lilyFlower);
			}
		}
	}
}

/**
 * The pixels of a reed or cattail clump: a spiky crown of stems lit from the upper left, an outline
 * only on the shaded side, a foot that turns to the bank's colours, and leaves leaning out.
 * @param {Clump} c
 * @param {() => number} rand
 * @returns {Pixel[]}
 */
function reedPixels(c, rand) {
	const t = REEDS[c.tone];
	/** @type {Pixel[]} */
	const px = [];
	if (c.islet) {
		for (let dx = -c.half - 2; dx <= c.half + 2; dx++) {
			px.push([c.bx + dx, c.by + 1, C.swampMudShade]);
			if (Math.abs(dx) <= c.half + 1) {
				px.push([
					c.bx + dx,
					c.by,
					dx < 0 ? C.swampMudLight : C.swampMud,
				]);
			}
		}
	}
	/** @type {number[]} */
	const tops = [];
	for (let dx = -c.half; dx <= c.half; dx++) {
		const u = dx / (c.half + 1);
		const dip = (dx + c.bx) % 2 ? 0 : 1 + Math.floor(rand() * 2);
		tops.push(Math.max(2, Math.round(c.tall * (1 - u * u * 0.6)) - dip));
	}
	const topOf = (/** @type {number} */ dx) =>
		dx < -c.half || dx > c.half ? -1 : tops[dx + c.half];
	for (let dx = -c.half; dx <= c.half; dx++) {
		const u = dx / (c.half + 1);
		const top = topOf(dx);
		for (let k = 0; k <= top; k++) {
			const x = c.bx + dx;
			const y = c.by - k;
			const v = k / top;
			const lit =
				-u * 1.1 +
				v * 0.6 +
				((x % 2) * 0.9 - 0.45) +
				(rand() - 0.5) * 0.4;
			let col =
				lit > 0.6 ? t[3] : lit > 0.1 ? t[2] : lit > -0.4 ? t[1] : t[0];
			const edge = k === top || topOf(dx + 1) < k;
			if (k <= 1) {
				// The foot turns to the bank's colours.
				col =
					k === 0 || BAYER[(y % 4) * 4 + (x % 4)] < 0
						? C.forestFloorShade
						: t[0];
			} else if (edge && u > 0 && v > 0.3) {
				col = C.night;
			}
			px.push([x, y, col]);
		}
	}
	// A leaf or two leaning out from each side.
	for (const side of [-1, 1]) {
		if (rand() < 0.65) {
			const k0 = Math.round(c.tall * (0.35 + rand() * 0.25));
			for (let j = 1; j <= 2; j++) {
				px.push([
					c.bx + side * (c.half + j),
					c.by - k0 - j,
					side < 0 ? t[2] : t[0],
				]);
			}
		}
	}
	if (c.kind === 'cattail') {
		// Brown heads on stems above the leaves, lit on the left.
		const heads = c.half > 2 ? 2 : 1;
		for (let n = 0; n < heads; n++) {
			const dx = heads === 1 ? 0 : n === 0 ? -1 - (c.bx % 2) : 1;
			const x = c.bx + dx;
			const stem = 1 + Math.floor(rand() * 2);
			const base = c.by - topOf(dx) - 1;
			for (let k = 0; k < stem; k++) {
				px.push([x, base - k, t[1]]);
			}
			const hy = base - stem;
			for (let k = 0; k < 3; k++) {
				px.push([x, hy - k, k === 2 ? C.timberLight : C.quagCattail]);
				px.push([x + 1, hy - k, C.timberShade]);
			}
			px.push([x, hy - 3, t[2]]);
		}
	}
	return px;
}

/**
 * The pixels of a low bush: a wide dome lit from the upper left, an outline on its shaded side, and
 * a foot in the bank's colours.
 * @param {Clump} c
 * @param {() => number} rand
 * @returns {Pixel[]}
 */
function bushPixels(c, rand) {
	/** @type {Pixel[]} */
	const px = [];
	const rx = c.half + 0.6;
	const ry = c.tall / 2;
	const cy = c.by - ry;
	for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
		for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
			const q = (x * x) / (rx * rx) + (y * y) / (ry * ry);
			const py = Math.round(cy + y);
			if (q > 1 + rand() * 0.1 || py > c.by) {
				continue;
			}
			const shade =
				(-x / rx) * 0.6 - (y / ry) * 0.8 + (rand() - 0.5) * 0.6;
			const k = shade > 0.45 ? 3 : shade > 0 ? 2 : shade > -0.5 ? 1 : 0;
			let col = q > 0.8 ? (k >= 2 ? BUSH[1] : C.night) : BUSH[k];
			if (py >= c.by - 1) {
				col = py === c.by ? C.forestFloorShade : BUSH[0];
			}
			px.push([c.bx + x, py, col]);
		}
	}
	return px;
}

/**
 * The box a clump may fill, leaves and heads included: [x0, x1, y0, y1].
 * @param {Clump} c
 * @returns {number[]}
 */
function box(c) {
	if (c.kind === 'bush') {
		return [c.bx - c.half - 1, c.bx + c.half + 1, c.by - c.tall - 1, c.by];
	}
	const heads = c.kind === 'cattail' ? 6 : 0;
	const islet = c.islet ? 2 : 0;
	return [
		c.bx - c.half - 2 - islet,
		c.bx + c.half + 2 + islet,
		c.by - c.tall - heads,
		c.by + (c.islet ? 1 : 0),
	];
}

/**
 * Packs pools, reed beds, cattails and low bushes into the footprint of a mat's impassable plots.
 * @param {Canvas} canvas - Empty, `fp.w` × `fp.h`
 * @param {Footprint} fp
 * @param {number} seed
 */
export function paintWetland(canvas, fp, seed) {
	const { w: W, h: H, plots, reach, corners } = fp;
	// Corner joins carry reeds too, so their floor reaches into a round patch.
	const area = withCornerPatches(fp, 7);
	const depth = distanceInside(area, W, H);
	// The pools lie deep inside the footprint, so joined plots share one. Each shore wobbles, and each
	// pool sits a little toward the front, so the reeds behind it have room to stand tall.
	const shore = noise(seed + 11, 4);
	const round = blur(depth, W, H, 4);
	const poolAt = (/** @type {number} */ x, /** @type {number} */ y) =>
		Math.max(BANK + 1, POOL + (shore(x, y) - 0.5) * 7);
	const water = new Uint8Array(W * H);
	for (let y = LIFT; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			if (
				plots[i] &&
				depth[i] > BANK &&
				round[i - LIFT * W] > poolAt(x, y)
			) {
				water[i] = 1;
			}
		}
	}
	drawMarsh(canvas, fp, area, depth, water, seed);
	drawLilies(canvas, fp, depth, water, seed);
	const rand = seededRandom(hash(seed, 9));
	/** Whether any of the pixels from `from` to `to` rows below (x, y) is water. */
	const wetBelow = (
		/** @type {number} */ x,
		/** @type {number} */ y,
		/** @type {number} */ from,
		/** @type {number} */ to
	) => {
		for (let dy = from; dy <= to; dy++) {
			if (y + dy >= 0 && y + dy < H && water[(y + dy) * W + x]) {
				return true;
			}
		}
		return false;
	};
	/** @type {Clump[]} */
	const clumps = [];
	for (let y = 0; y < H; y += 3) {
		for (let x = (y / 3) % 2 ? 2 : 0; x < W; x += 4) {
			const bx = x + Math.floor(rand() * 3) - 1;
			const by = y + Math.floor(rand() * 3) - 1;
			const roll = rand();
			const pick = rand();
			const grow = rand();
			const half = 2 + Math.floor(rand() * 2);
			const tone = rand() < 0.4 ? 0 : 1;
			if (bx < 0 || by < LIFT || bx >= W || by >= H) {
				continue;
			}
			const i = by * W + bx;
			if (!plots[i] || !area[i]) {
				continue;
			}
			const wet = water[i] === 1;
			const islet = wet && depth[i] > POOL + 8;
			const shallow = wet && round[i - LIFT * W] - poolAt(bx, by) < 1.5;
			const behind = !wet && wetBelow(bx, by, 1, 5);
			const before = !wet && wetBelow(bx, by, -7, -1);
			// A dense bed of tall reeds behind each pool, low ones in front of it so the water shows,
			// sparser clumps on its sides and in its shallows, and a few islets far out in a wide pool.
			const [chance, low, high] = islet
				? [0.08, 4, 6]
				: shallow
					? [0.3, 4, 6]
					: wet
						? [0, 0, 0]
						: behind
							? [0.95, 7, 11]
							: before
								? [0.55, 3, 5]
								: [0.55, 6, 9];
			if (roll >= chance) {
				continue;
			}
			const bush = !wet && !behind && depth[i] <= 3.5 && pick > 0.86;
			clumps.push({
				kind: bush ? 'bush' : pick > 0.62 ? 'cattail' : 'reed',
				bx,
				by,
				half: bush ? half + 1 : half,
				tall: bush
					? 5 + Math.floor(grow * 2)
					: low + Math.floor(grow * (high - low + 1)),
				tone: islet ? 1 : tone,
				corner: false,
				islet,
			});
		}
	}
	for (const { gx, gy, down } of corners) {
		const f = down ? 1 : -1;
		for (const [dx, dy, half, tall, kind] of CORNER) {
			clumps.push({
				kind,
				bx: gx + dx * f,
				by: gy + dy,
				half,
				tall,
				tone: kind === 'reed' ? 0 : 1,
				corner: true,
				islet: false,
			});
		}
	}
	/** @type {(c: Clump) => boolean} */
	const fits = (c) => {
		const ok = c.corner ? reach : plots;
		const [x0, x1, y0, y1] = box(c);
		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				if (x < 0 || y < 0 || x >= W || y >= H || !ok[y * W + x]) {
					return false;
				}
			}
		}
		return true;
	};
	const placed = clumps.filter((c) => {
		if (fits(c)) {
			return true;
		}
		// Too big for its room: a smaller reed clump, or nothing.
		c.kind = c.kind === 'bush' ? 'bush' : 'reed';
		c.half = Math.max(1, c.half - 1);
		c.tall = Math.max(3, c.tall - 2);
		return fits(c);
	});
	placed.sort((a, b) => a.by - b.by);
	const drawn = placed.map((c) => {
		const own = seededRandom(hash(c.bx, c.by, seed));
		return c.kind === 'bush' ? bushPixels(c, own) : reedPixels(c, own);
	});
	// Reflections first: what stands on a pool's far bank shows upside down in the water, broken by ripples.
	placed.forEach((c, n) => {
		if (!water[(c.by + 1) * W + c.bx] && !water[(c.by + 2) * W + c.bx]) {
			return;
		}
		for (const [x, y, col] of drawn[n]) {
			const ry = 2 * c.by - y + 1;
			if (y < c.by && ry - c.by <= 8 && ry % 2 === 0 && ry < H) {
				put(canvas, water, x, ry, REFLECTED[col] ?? C.quagWater);
			}
		}
	});
	// Then each clump's shadow: translucent ink on empty ground, a darker tone on painted ground.
	for (const c of placed) {
		const ok = c.corner ? reach : plots;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = 0; dx <= c.half + 2; dx++) {
				const x = c.bx + dx;
				const y = c.by + dy;
				if (x >= 0 && y >= 0 && x < W && y < H && ok[y * W + x]) {
					cast(canvas, x, y, 0.25, DARKER);
				}
			}
		}
	}
	// Then the clumps, from the back to the front.
	placed.forEach((c, n) => {
		const ok = c.corner ? reach : plots;
		for (const [x, y, col] of drawn[n]) {
			put(canvas, ok, x, y, col);
		}
	});
}
