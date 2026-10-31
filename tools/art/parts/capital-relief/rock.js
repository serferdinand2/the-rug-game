// Rocks standing on a relief's floor: flat-topped buttes, hoodoos and boulders, in the Desert's sandstone or the Mesa's red rock (#82, #132).
import { seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { cast, put } from '../../../../src/lib/art/paint/relief/canvas.js';
import {
	BAYER,
	hash,
	noise,
} from '../../../../src/lib/art/paint/relief/ground.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * A rock standing on its base pixel.
 * @typedef {Object} RockSpec
 * @property {'butte' | 'hoodoo' | 'boulder'} kind - A flat-topped butte, a cap rock on a thin neck, or a rounded boulder
 * @property {number} bx - The base's middle
 * @property {number} by - The base's row
 * @property {number} hw - The half-width at the base
 * @property {number} ph - The height
 */

/**
 * How a rock is painted and proportioned.
 * @typedef {Object} RockStyle
 * @property {readonly string[]} tones - Five rock tones, from lit to deep shade
 * @property {Readonly<Record<string, string>>} darker - Each painted tone's next tone down, for a shadow on it
 * @property {readonly string[]} foot - The ground the foot turns to: lit and bright, lit, shaded, shaded and dark
 * @property {string} rim - The shaded edge of the lower rock and of a fallen block
 * @property {{ rim: string, light: string, base: string, scrub: string } | null} top - A butte's flat top in soil and
 *   scrub, or null for a top in the rock's own palest tones
 * @property {readonly number[]} width - A butte top's half-width as a share of its base's: the least, and how much more at random
 * @property {number} cap - The flat top's depth as a share of its half-width
 * @property {readonly number[]} knee - Where a butte's cliffs meet its scree, as a share of its height: the least, and how much more
 * @property {number} slope - How much a butte's cliffs widen per row
 * @property {boolean} strata - Whether the cliffs are banded in layers
 */

/**
 * A joint in the rock: a crack running down it, as its x on each row from `from` to `to`.
 * @typedef {{ from: number, to: number, xs: Map<number, number> }} Joint
 */

/**
 * The Desert's warm sandstone, with the Mesa's soil only in the deepest shade (#82).
 * @type {Readonly<RockStyle>}
 */
export const SANDSTONE = Object.freeze({
	tones: Object.freeze([
		C.sandLight,
		C.sand,
		C.sandShade,
		C.mesaSoilShade,
		C.mesaSoilDark,
	]),
	darker: Object.freeze({
		[C.sandLight]: C.sand,
		[C.sand]: C.sandShade,
		[C.sandShade]: C.mesaSoilShade,
		[C.mesaSoilShade]: C.mesaSoilDark,
	}),
	foot: Object.freeze([C.sandLight, C.sand, C.sand, C.sandShade]),
	rim: C.mesaSoilDark,
	top: null,
	width: Object.freeze([0.42, 0.13]),
	cap: 0.25,
	knee: Object.freeze([0.5, 0.15]),
	slope: 0.14,
	strata: false,
});

/**
 * The Mesa's banded red rock on red soil, its tops scrubby (#132).
 * @type {Readonly<RockStyle>}
 */
export const RED_ROCK = Object.freeze({
	tones: Object.freeze([
		C.mesaStrata,
		C.mesaRockLight,
		C.mesaRock,
		C.mesaRockShade,
		C.mesaRockDark,
	]),
	darker: Object.freeze({
		[C.mesaSoilLight]: C.mesaSoil,
		[C.mesaSoil]: C.mesaSoilShade,
		[C.mesaSoilShade]: C.mesaSoilDark,
		[C.mesaStrata]: C.mesaRockLight,
		[C.mesaRockLight]: C.mesaRock,
		[C.mesaRock]: C.mesaRockShade,
		[C.mesaRockShade]: C.mesaRockDark,
		[C.mesaSage]: C.alpineMeadowShade,
	}),
	foot: Object.freeze([
		C.mesaSoilLight,
		C.mesaSoil,
		C.mesaSoil,
		C.mesaSoilShade,
	]),
	rim: C.mesaSoilDark,
	top: Object.freeze({
		rim: C.mesaStrata,
		light: C.mesaSoilLight,
		base: C.mesaSoil,
		scrub: C.mesaSage,
	}),
	width: Object.freeze([0.55, 0.15]),
	cap: 0.2,
	knee: Object.freeze([0.58, 0.12]),
	slope: 0.12,
	strata: true,
});

/**
 * The ordered-dither offset of a pixel.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function dither(x, y) {
	return BAYER[(y % 4) * 4 + (x % 4)];
}

/**
 * Each pixel of a shape given as rows.
 * @param {readonly (readonly number[])[]} rows - Each as [y, left, right]
 * @returns {Generator<number[]>} Each pixel as [x, y]
 */
export function* rowPixels(rows) {
	for (const [y, a, b] of rows) {
		for (let x = a; x <= b; x++) {
			yield [x, y];
		}
	}
}

/**
 * A soft shadow to the right of a foot, on every other pixel so it fades. On empty ground it is
 * translucent ink; on painted ground it is the next tone down.
 * @param {Canvas} canvas
 * @param {Uint8Array} ok - Where the shadow may fall
 * @param {Set<number>} own - The pixels of the thing casting it
 * @param {number[]} box - x0, x1, y0, y1
 * @param {Readonly<Record<string, string>>} darker
 */
export function footShadow(canvas, ok, own, [x0, x1, y0, y1], darker) {
	for (let x = x0; x <= x1; x++) {
		for (let y = y0; y <= y1; y++) {
			if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) {
				continue;
			}
			const i = y * canvas.w + x;
			if (!ok[i] || own.has(i)) {
				continue;
			}
			if (dither(x, y) < 0.15) {
				cast(canvas, x, y, 0.3, darker);
			}
		}
	}
}

/**
 * Which rock tone a light value gives, from 0 (lit) to 4 (deep shade).
 * @param {number} light - About -1 (turned away) to 1 (facing the sun)
 * @returns {number}
 */
function tone(light) {
	if (light > 0.55) {
		return 0;
	}
	if (light > 0.1) {
		return 1;
	}
	if (light > -0.3) {
		return 2;
	}
	return light > -0.7 ? 3 : 4;
}

/**
 * One step of a rough edge: it wanders by a pixel now and then, never more than one either way.
 * @param {number} at
 * @param {() => number} rand
 * @returns {number}
 */
function wander(at, rand) {
	const step = rand() < 0.4 ? (rand() < 0.5 ? -1 : 1) : 0;
	return Math.max(-1, Math.min(1, at + step));
}

/**
 * A joint's x on a row; above or below it, the x of its end.
 * @param {Joint} j
 * @param {number} y
 * @returns {number}
 */
function jointAt(j, y) {
	return /** @type {number} */ (
		j.xs.get(Math.max(j.from, Math.min(j.to, y)))
	);
}

/**
 * The half-width of a hoodoo's row: a cap rock two rows deep, a neck without wander, and a foot that widens to the base.
 * @param {RockSpec} r
 * @param {number} t - The row, counted from the top
 * @param {number} tw - The cap's half-width
 * @param {number} knee - Where the neck meets the foot
 * @returns {number}
 */
function hoodooHalf(r, t, tw, knee) {
	const y = r.by - r.ph + t;
	if (t <= 2) {
		return tw - (t === 0 ? 1 : 0);
	}
	if (y < knee) {
		return Math.max(1, tw * 0.35);
	}
	const s = (y - knee) / Math.max(1, r.by - knee);
	return tw * 0.5 + (r.hw - tw * 0.5) * s ** 1.3;
}

/**
 * Works out a rock's rows and joints: a butte's squarish flat top seen from above, its cliffs split
 * into facets by joints, and the scree that flares out at its foot; a hoodoo's cap rock on its neck;
 * or a boulder's rounded dome with a crack.
 * @param {RockSpec} r
 * @param {number} seed
 * @param {Readonly<RockStyle>} [style]
 */
export function rockShape(r, seed, style = SANDSTONE) {
	const rand = seededRandom(hash(r.bx, r.by, r.hw, r.ph, seed));
	const sy = r.by - r.ph;
	const butte = r.kind === 'butte';
	const hoodoo = r.kind === 'hoodoo';
	const tw = butte
		? Math.max(
				3,
				Math.round(r.hw * (style.width[0] + rand() * style.width[1]))
			)
		: hoodoo
			? Math.max(2, Math.round(r.hw * 0.7))
			: 0;
	const cap = butte
		? Math.max(1, Math.round(tw * style.cap))
		: hoodoo
			? 1
			: 0;
	// Where a butte's cliffs end and its scree begins, a hoodoo's neck meets its foot, or a boulder is widest.
	const knee = butte
		? sy +
			2 * cap +
			Math.round(
				(r.ph - 2 * cap) * (style.knee[0] + rand() * style.knee[1])
			)
		: hoodoo
			? r.by - Math.round(r.ph * 0.28)
			: sy + Math.round(r.ph * 0.55);
	const cliff = tw + (knee - sy - cap) * style.slope;
	/** @type {number[][]} Each row as [y, left, right] */
	const rows = [];
	let left = 0;
	let right = 0;
	for (let y = sy; y <= r.by; y++) {
		let half;
		if (hoodoo) {
			half = hoodooHalf(r, y - sy, tw, knee);
		} else if (butte && y < sy + cap) {
			// The far half of the flat top: a squarish ellipse.
			const v = (sy + cap - y) / (cap + 0.5);
			half = tw * (1 - v * v) ** 0.25;
		} else if (butte && y < knee) {
			half = tw + (y - sy - cap) * style.slope;
		} else if (butte) {
			const s = (y - knee) / Math.max(1, r.by - knee);
			half = cliff + (r.hw - cliff) * s ** 1.4;
		} else if (y < knee) {
			const v = (knee - y) / (knee - sy + 0.5);
			half = r.hw * Math.sqrt(1 - v * v);
		} else {
			half = r.hw * (1 + ((y - knee) / Math.max(1, r.by - knee)) * 0.15);
		}
		// The rock's sides are rough; a butte's flat top and a hoodoo's cap and neck are not.
		if (hoodoo ? y >= knee : !butte || y >= sy + cap) {
			left = wander(left, rand);
			right = wander(right, rand);
		}
		rows.push([
			y,
			Math.round(r.bx - half) - left,
			Math.round(r.bx + half) + right,
		]);
	}
	/** @type {Joint[]} */
	const joints = [];
	const count = butte ? 1 + Math.floor(tw / 6) : !hoodoo && r.hw >= 5 ? 1 : 0;
	for (let k = 0; k < count; k++) {
		// A butte's joints spread across its cliffs; a boulder's crack runs down from near its top.
		let x = butte
			? Math.round(
					r.bx -
						tw +
						((k + 1) / (count + 1)) * 2 * tw +
						rand() * 2 -
						1
				)
			: r.bx + Math.round((rand() - 0.6) * r.hw * 0.6);
		const from = butte ? sy + 2 * cap + 1 : sy + 1;
		const to = butte ? knee + 2 : sy + Math.round(r.ph * 0.6);
		const drift = butte ? 0 : rand() < 0.5 ? -1 : 1;
		/** @type {Map<number, number>} */
		const xs = new Map();
		for (let y = from; y <= to; y++) {
			xs.set(y, x);
			if (rand() < (butte ? 0.2 : 0.45)) {
				x += drift || (rand() < 0.5 ? -1 : 1);
			}
		}
		joints.push({ from, to, xs });
	}
	// Blocks fallen from a butte's cliffs lie on its scree, to either side: [x, y, radius].
	/** @type {number[][]} */
	const blocks = [];
	for (let k = 0; butte && k < 1 + Math.floor(r.hw / 8); k++) {
		const side = k % 2 === 0 ? -1 : 1;
		const out = tw + 1 + Math.floor(rand() * Math.max(1, r.hw - tw - 3));
		blocks.push([
			r.bx + side * out,
			knee + 2 + Math.floor(rand() * Math.max(1, r.by - knee - 4)),
			1.5 + rand(),
		]);
	}
	// How far down the rock is bare, outlined and lit: below it the foot turns to the ground.
	const bare = butte || hoodoo ? (knee - sy) / r.ph : 0.8;
	return { ...r, sy, tw, cap, knee, bare, rows, joints, blocks };
}

/** @typedef {ReturnType<typeof rockShape>} Rock */

/**
 * The tone of a pixel on a rock's cliffs or dome: a butte's cliffs in flat facets from lit on the left to
 * shaded on the right, banded in layers if the style has them, or a boulder's dome lit from the upper left.
 * @param {Rock} s
 * @param {Readonly<RockStyle>} style
 * @param {number} x
 * @param {number} y
 * @param {number} u - Across the row, -1 on the left to 1 on the right
 * @param {number} n - The grain, about -0.5 to 0.5
 * @param {(x: number, y: number) => boolean} onTop
 * @returns {number} 0 (lit) to 4 (deep shade)
 */
function rockTone(s, style, x, y, u, n, onTop) {
	if (s.kind === 'boulder') {
		const depth = (y - s.sy) / s.ph;
		const crack = s.joints.some(
			(j) => y >= j.from && y <= j.to && j.xs.get(y) === x
		);
		const k = tone(-u * 0.75 + (0.3 - depth) * 1.2 + n * 0.4);
		return crack ? Math.min(4, k + 2) : k;
	}
	if (onTop(x, y)) {
		// The flat top faces the sun, palest of all; its front rim catches the light.
		return onTop(x, y + 1) && u > 0.3 && n < -0.05 ? 1 : 0;
	}
	const facet = s.joints.filter((j) => jointAt(j, y) < x).length;
	const at = (facet + 0.5) / (s.joints.length + 1);
	let k = tone(0.6 - at * 1.3 - u * 0.25 + n * 0.5);
	if (hash(x, y, s.bx, s.by) % 100 < 4) {
		// A weathering pit.
		k = Math.min(4, k + 1);
	}
	if (s.kind === 'hoodoo' && y - s.sy <= 2) {
		// A hoodoo's cap rock is harder, darker stone.
		k = u < -0.2 ? 2 : 3;
	} else if (style.strata) {
		// The same layers run through every rock: a pale band every five rows, a dark seam now and then.
		const band = (y + 400) % 5;
		if (band === 0) {
			k = Math.max(0, k - 1);
		} else if (band === 2 && hash(x >> 3, y) % 3 === 0) {
			k = Math.min(4, k + 1);
		}
	}
	if (s.joints.some((j) => jointAt(j, y) === x && y >= j.from)) {
		// A joint: a dark crack between two facets.
		k = Math.min(4, k + 2);
	} else if (s.joints.some((j) => jointAt(j, y) === x + 1 && y >= j.from)) {
		// The lit edge of the facet beside it.
		k = Math.max(0, k - 1);
	}
	// A ledge of shade under the rim.
	return onTop(x, y - 1) ? Math.min(4, k + 1) : k;
}

/**
 * Draws a rock lit from the left, with an ink outline on the upper rock only and a foot that turns to the ground.
 * @param {Canvas} canvas
 * @param {Rock} s
 * @param {Uint8Array} ok - Where it may paint
 * @param {Readonly<RockStyle>} [style]
 */
export function drawRock(canvas, s, ok, style = SANDSTONE) {
	const W = canvas.w;
	/** @type {Set<number>} */
	const own = new Set();
	/** @type {Map<number, number[]>} */
	const span = new Map();
	for (const [y, a, b] of s.rows) {
		span.set(y, [a, b]);
		for (let x = a; x <= b; x++) {
			own.add(y * W + x);
		}
	}
	const grain = noise(hash(s.bx, s.by, 9), 2.5);
	const capY = s.sy + s.cap;
	/** Whether a pixel lies on a butte's flat top: a squarish ellipse. */
	const onTop = (/** @type {number} */ x, /** @type {number} */ y) => {
		if (s.kind !== 'butte') {
			return false;
		}
		const u = (x - s.bx) / (s.tw + 0.5);
		const v = (y - capY) / (s.cap + 0.5);
		return u * u * u * u + v * v <= 1;
	};
	footShadow(
		canvas,
		ok,
		own,
		[s.bx, s.bx + s.hw + 3, s.by - 2, s.by + 1],
		style.darker
	);
	const [footBright, footLit, footShade, footDark] = style.foot;
	for (const [x, y] of rowPixels(s.rows)) {
		if (x < 0 || y < 0 || x >= W || y >= canvas.h) {
			continue;
		}
		const i = y * W + x;
		const [a, b] = /** @type {number[]} */ (span.get(y));
		const u = (x - (a + b) / 2) / Math.max(1, (b - a) / 2);
		const depth = (y - s.sy) / s.ph;
		const n = grain(x, y) - 0.5 + dither(x, y) * 0.5;
		let col;
		if (style.top && onTop(x, y)) {
			// The flat top: soil and scrub, its front rim catching the light.
			col = !onTop(x, y + 1)
				? style.top.rim
				: hash(x, y, 3) % 19 === 0
					? style.top.scrub
					: n > 0.12
						? style.top.light
						: style.top.base;
		} else {
			col = style.tones[rockTone(s, style, x, y, u, n, onTop)];
		}
		// The foot turns to the ground: more of it the nearer the ground, dithered.
		const ground = Math.max(0, (depth - s.bare) / (1 - s.bare));
		if (
			ground ** 1.2 >
			0.5 - dither(x, y) + (grain(x + 50, y) - 0.5) * 0.5
		) {
			col =
				u < 0
					? n > 0.1
						? footBright
						: footLit
					: n > 0
						? footShade
						: footDark;
		}
		// Outline only the upper rock; the foot has none, so it sinks into the ground.
		const edge = !own.has(i - 1) || !own.has(i + 1) || !own.has(i - W);
		if (edge && depth < s.bare) {
			col = C.ink;
		} else if (edge && !own.has(i + 1) && ground < 0.6) {
			col = style.rim;
		}
		put(canvas, ok, x, y, col);
	}
	// The fallen blocks: small rounded rocks, lit on the upper left and dark on the lower right.
	for (const [bx, by, r] of s.blocks) {
		const reach = Math.ceil(r);
		for (let dy = -reach; dy <= reach; dy++) {
			for (let dx = -reach; dx <= reach; dx++) {
				const q = (dx * dx) / (r * r) + (dy * dy) / (r * r * 0.55);
				const x = bx + dx;
				const y = by + dy;
				if (q > 1 || !own.has(y * W + x)) {
					continue;
				}
				const rim = q > 0.5 && dx + dy > 0;
				const lit = -dx - dy * 1.5;
				put(
					canvas,
					ok,
					x,
					y,
					rim
						? style.rim
						: style.tones[lit > 1 ? 0 : lit > -0.5 ? 1 : 3]
				);
			}
		}
	}
}
