// Capital terrain for the Quagmire advanced mat (#6): murky bog ground, reeds, black pools and will-o'-the-wisps.
import {
	createCanvas,
	rect,
	set,
	line,
	mix,
	seededRandom,
} from '../../painter.js';
import { PALETTE as P } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {() => number} Random */

/** Plot size in pixels. */
const SIZE = 32;

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The 18 water plots and the 4 will-o'-the-wisps are all 'X' (wisps count as impassable terrain); `WISPS` says which.
 * Source: docs/research/03-expansions.md, FF.6 §2.4.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.....XX..',
	'.....X...',
	'....X....',
	'...XX....',
	'...X.....',
	'...X.....',
	'..XX....X',
	'..XX...XX',
	'.XXXX.XXX',
];

/**
 * The four will-o'-the-wisps, as [row, column]. Each sits on an impassable plot.
 * @type {readonly (readonly [number, number])[]}
 */
export const WISPS = [
	[0, 6],
	[3, 4],
	[7, 2],
	[7, 7],
];

/**
 * The seven printed reed plots, as [row, column]: the open plots next to a wisp.
 * @type {readonly (readonly [number, number])[]}
 */
export const REEDS = [
	[0, 7],
	[1, 6],
	[3, 5],
	[4, 4],
	[6, 7],
	[7, 1],
	[7, 6],
];

/** Colours of the bog; the pixel-art palette has none of these yet. */
const K = {
	mud: P.quagMud,
	mudLight: P.quagMudLight,
	mudShade: P.quagMudShade,
	peat: P.quagPeat,
	moss: P.quagMoss,
	mossLight: P.quagMossLight,
	puddle: P.quagPuddle,
	puddleLight: P.quagPuddleLight,
	reed: P.quagReed,
	reedLight: P.quagReedLight,
	reedShade: P.quagReedShade,
	cattail: P.quagCattail,
	water: P.quagWater,
	waterDeep: P.quagWaterDeep,
	waterLight: P.quagWaterLight,
	slime: P.quagSlime,
	weed: P.quagWeed,
};

/** What each plot of the example mat uses, row by row: `blocked` and the tile `variant`. Filled by `drawBiomeMat`. */
export const PLACEMENT = buildPlacement();

/**
 * Picks the tile for each plot of the printed layout.
 * @returns {readonly (readonly { blocked: boolean, variant: number }[])[]}
 */
function buildPlacement() {
	const isWisp = (/** @type {number} */ r, /** @type {number} */ c) =>
		WISPS.some(([wr, wc]) => wr === r && wc === c);
	let reedCount = 0;
	return LAYOUT.map((row, r) =>
		[...row].map((cell, c) => {
			const hash = (r * 7 + c * 13 + r * c * 3) >>> 0;
			if (cell === 'X') {
				return isWisp(r, c)
					? { blocked: true, variant: 5 }
					: { blocked: true, variant: hash % 5 };
			}
			if (REEDS.some(([rr, rc]) => rr === r && rc === c)) {
				return { blocked: false, variant: 6 + (reedCount++ % 2) };
			}
			return { blocked: false, variant: hash % 6 };
		})
	);
}

/** @param {Random} r @param {number} a @param {number} b @returns {number} */
function rngInt(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/** @param {Random} r @param {readonly Colour[]} a @returns {Colour} */
function choice(r, a) {
	return a[Math.floor(r() * a.length)];
}

/**
 * Soaks the plot in mud, with low-contrast patches, flecks and a few puddle glints.
 * @param {Canvas} c
 * @param {Random} r
 */
function ground(c, r) {
	rect(c, 0, 0, SIZE, SIZE, K.mud);
	for (let i = 0; i < 12; i++) {
		rect(
			c,
			rngInt(r, 1, 27),
			rngInt(r, 1, 28),
			rngInt(r, 2, 6),
			rngInt(r, 1, 4),
			i % 3 === 0 ? K.mudShade : K.mudLight
		);
	}
	for (let i = 0; i < 36; i++) {
		set(
			c,
			rngInt(r, 1, 30),
			rngInt(r, 1, 30),
			i % 4 === 0 ? K.peat : choice(r, [K.mudLight, K.mossLight])
		);
	}
	for (let i = 0; i < 12; i++) {
		let a = rngInt(r, 0, 31);
		let b = rngInt(r, 0, 31);
		if (r() > 0.5) {
			a = r() > 0.5 ? 0 : 31;
		} else {
			b = r() > 0.5 ? 0 : 31;
		}
		set(c, a, b, i % 2 ? K.mudLight : K.mud);
	}
}

/**
 * A blob with a wobbling edge.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Random} r
 * @param {Colour} colour
 */
function blob(c, cx, cy, rx, ry, r, colour) {
	const p1 = r() * 6.28;
	const p2 = r() * 6.28;
	for (let y = Math.floor(cy - ry - 3); y <= Math.ceil(cy + ry + 3); y++) {
		for (
			let x = Math.floor(cx - rx - 3);
			x <= Math.ceil(cx + rx + 3);
			x++
		) {
			const a = Math.atan2((y - cy) / ry, (x - cx) / rx);
			const wob =
				1.12 +
				0.14 * Math.sin(a * 3 + p1) +
				0.09 * Math.sin(a * 5 + p2);
			const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
			if (d <= wob) {
				set(c, x, y, colour);
			}
		}
	}
}

/**
 * A murky pool with a muddy bank and a lighter sheen.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {number} seed
 */
function pool(c, cx, cy, rx, ry, seed) {
	blob(c, cx, cy, rx + 2, ry + 2, seededRandom(seed), K.peat);
	blob(c, cx, cy, rx + 1, ry + 1, seededRandom(seed), K.mudShade);
	blob(c, cx, cy, rx, ry, seededRandom(seed), K.water);
	blob(
		c,
		cx + 1,
		cy + 1,
		rx - 3,
		ry - 3,
		seededRandom(seed + 1),
		K.waterDeep
	);
	// ripples and sheen
	const r = seededRandom(seed + 2);
	for (let i = 0; i < 5; i++) {
		const x = rngInt(r, cx - rx + 3, cx + rx - 6);
		const y = rngInt(r, cy - ry + 2, cy + ry - 2);
		rect(c, x, y, rngInt(r, 3, 5), 1, i % 2 ? K.waterLight : K.puddleLight);
	}
}

/**
 * A lily pad with a notch.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y
 * @param {boolean} [flower]
 */
function pad(c, x, y, flower = false) {
	rect(c, x, y, 4, 3, K.slime);
	rect(c, x + 1, y - 1, 2, 1, K.slime);
	set(c, x + 3, y + 1, K.waterDeep);
	set(c, x + 1, y + 1, K.weed);
	if (flower) {
		set(c, x + 1, y, P.creamLight);
		set(c, x + 2, y - 1, P.gold);
	}
}

/**
 * One reed with a seed head.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y - The foot
 * @param {number} h
 * @param {boolean} head
 * @param {number} lean
 */
function reed(c, x, y, h, head, lean) {
	for (let i = 0; i < h; i++) {
		set(
			c,
			x + Math.round((lean * i) / h),
			y - i,
			i % 3 === 0 ? K.reedShade : K.reed
		);
	}
	const tx = x + lean;
	set(c, tx - 1, y - h + 3, K.reedLight);
	if (head) {
		rect(c, tx, y - h - 2, 1, 3, K.cattail);
		set(c, tx, y - h - 3, K.reedShade);
	}
}

/** @param {Canvas} c @param {Random} r @param {number} n */
function mossTufts(c, r, n) {
	for (let i = 0; i < n; i++) {
		const x = rngInt(r, 3, 27);
		const y = rngInt(r, 5, 28);
		const col = choice(r, [K.moss, K.mossLight]);
		set(c, x, y, col);
		set(c, x - 1, y - 1, col);
		set(c, x + 1, y - 2, col);
		set(c, x + 1, y - 1, K.moss);
	}
}

/** @param {Canvas} c @param {number} x @param {number} y */
function mushroom(c, x, y) {
	rect(c, x, y, 3, 1, P.brickRed);
	set(c, x + 1, y - 1, P.brickRed);
	set(c, x + 1, y, P.creamLight);
	rect(c, x + 1, y + 1, 1, 2, P.cream);
}

/** A small buildable plot, calm enough to build on. @param {Canvas} c @param {number} v @param {Random} r */
function openFeature(c, v, r) {
	switch (v) {
		case 0:
			mossTufts(c, r, 8);
			break;
		case 1: {
			for (let i = 0; i < 3; i++) {
				const x = rngInt(r, 4, 24);
				const y = rngInt(r, 4, 26);
				rect(c, x, y, rngInt(r, 4, 6), 2, K.puddle);
				rect(c, x + 1, y, 2, 1, K.puddleLight);
			}
			mossTufts(c, r, 4);
			break;
		}
		case 2: {
			mushroom(c, 6, 22);
			mushroom(c, 21, 8);
			mossTufts(c, r, 5);
			break;
		}
		case 3: {
			// a few stones and a twig
			for (let i = 0; i < 4; i++) {
				const x = rngInt(r, 4, 25);
				const y = rngInt(r, 4, 26);
				rect(c, x, y, 3, 2, P.stoneMid);
				rect(c, x, y, 2, 1, P.stoneLight);
				set(c, x + 2, y + 1, P.stoneShade);
			}
			line(c, 8, 24, 18, 21, K.cattail);
			break;
		}
		case 4: {
			// peat mounds with weed
			for (let i = 0; i < 3; i++) {
				const x = rngInt(r, 4, 22);
				const y = rngInt(r, 6, 26);
				rect(c, x, y, 6, 2, K.peat);
				rect(c, x + 1, y - 1, 4, 1, K.mudShade);
				set(c, x + 2, y - 2, K.moss);
			}
			mossTufts(c, r, 3);
			break;
		}
		case 5: {
			// gleaming algae film
			for (let i = 0; i < 6; i++) {
				const x = rngInt(r, 2, 26);
				const y = rngInt(r, 3, 28);
				rect(c, x, y, rngInt(r, 3, 6), 1, K.slime);
				set(c, x + 1, y + 1, K.moss);
			}
			break;
		}
		case 6: {
			// a reed bed beside the wisp
			for (let i = 0; i < 13; i++) {
				reed(
					c,
					rngInt(r, 4, 26),
					rngInt(r, 18, 29),
					rngInt(r, 8, 13),
					i % 3 === 0,
					rngInt(r, -2, 2)
				);
			}
			break;
		}
		default: {
			for (let i = 0; i < 12; i++) {
				reed(
					c,
					rngInt(r, 4, 26),
					rngInt(r, 17, 29),
					rngInt(r, 7, 12),
					i % 2 === 0,
					rngInt(r, -2, 2)
				);
			}
			mossTufts(c, r, 3);
			break;
		}
	}
}

/**
 * A wisp: a ghostly flame with a tail and a glow.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 */
function wisp(c, cx, cy) {
	const glow = mix(K.waterDeep, P.ghost, 0.28);
	const halo = mix(K.waterDeep, P.ghost, 0.5);
	for (let y = -8; y <= 8; y++) {
		for (let x = -8; x <= 8; x++) {
			const d = Math.hypot(x, y * 1.1);
			if (d < 7.5 && (x + y) % 2 === 0) {
				set(c, cx + x, cy + y, d < 5 ? halo : glow);
			}
		}
	}
	// the flame body: a teardrop leaning right
	/** @type {[number, number, Colour][]} */
	const flame = [
		[0, -6, P.ghostShade],
		[0, -5, P.ghost],
		[1, -4, P.ghost],
		[0, -3, P.ghost],
		[-1, -2, P.ghost],
	];
	for (const [dx, dy, col] of flame) {
		set(c, cx + dx, cy + dy, col);
	}
	rect(c, cx - 2, cy - 2, 5, 5, P.ghost);
	rect(c, cx - 3, cy - 1, 7, 3, P.ghost);
	rect(c, cx - 1, cy - 1, 3, 3, P.ghostLight);
	rect(c, cx - 1, cy + 3, 3, 1, P.ghostShade);
	rect(c, cx, cy + 4, 1, 1, P.ghostShade);
	set(c, cx, cy, P.white);
	// two sparks
	set(c, cx + 6, cy - 5, P.ghostLight);
	set(c, cx - 6, cy + 4, P.ghostLight);
}

/** An impassable plot. @param {Canvas} c @param {number} v @param {Random} r */
function blockedFeature(c, v, r) {
	const seed = 900 + v * 31;
	switch (v) {
		case 0:
			pool(c, 16, 16, 13, 12, seed);
			pad(c, 11, 12, true);
			pad(c, 19, 19);
			break;
		case 1: {
			pool(c, 16, 17, 13, 11, seed);
			// a dead snag poking out of the water
			rect(c, 18, 7, 3, 14, K.cattail);
			rect(c, 18, 7, 1, 14, P.timber);
			rect(c, 16, 10, 2, 1, K.cattail);
			rect(c, 21, 12, 3, 1, K.cattail);
			rect(c, 17, 21, 5, 2, K.peat);
			break;
		}
		case 2: {
			// a winding channel
			blob(c, 8, 22, 9, 6, seededRandom(seed), K.mudShade);
			blob(c, 18, 14, 9, 6, seededRandom(seed + 1), K.mudShade);
			blob(c, 8, 22, 8, 5, seededRandom(seed), K.water);
			blob(c, 18, 14, 8, 5, seededRandom(seed + 1), K.water);
			blob(c, 13, 18, 6, 5, seededRandom(seed + 2), K.water);
			for (let i = 0; i < 6; i++) {
				rect(
					c,
					rngInt(r, 4, 22),
					rngInt(r, 10, 26),
					4,
					1,
					K.waterLight
				);
			}
			break;
		}
		case 3: {
			pool(c, 16, 16, 13, 12, seed);
			// algae and bubbles
			for (let i = 0; i < 9; i++) {
				const x = rngInt(r, 8, 24);
				const y = rngInt(r, 9, 23);
				rect(c, x, y, rngInt(r, 2, 4), 1, i % 2 ? K.slime : K.weed);
			}
			for (const [x, y] of [
				[10, 18],
				[22, 11],
				[14, 22],
			]) {
				set(c, x, y, P.ghostLight);
				set(c, x + 1, y, K.puddleLight);
			}
			break;
		}
		case 4: {
			pool(c, 12, 12, 8, 7, seed);
			pool(c, 22, 22, 7, 6, seed + 7);
			for (const [x, y] of [
				[24, 9],
				[5, 24],
			]) {
				rect(c, x, y, 4, 3, P.stoneMid);
				rect(c, x, y, 3, 1, P.stoneLight);
				rect(c, x + 1, y + 3, 3, 1, P.stoneShade);
			}
			break;
		}
		default: {
			pool(c, 16, 18, 13, 11, seed);
			wisp(c, 16, 13);
			break;
		}
	}
}

/**
 * One 32×32 plot of this biome.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one (5 holds a will-o'-the-wisp)
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	const count = blocked ? 6 : 8;
	const v = ((variant % count) + count) % count;
	const c = createCanvas(SIZE, SIZE);
	const random = seededRandom(13013 + v * 7919 + (blocked ? 40503 : 0));
	ground(c, random);
	if (blocked) {
		blockedFeature(c, v, random);
	} else {
		openFeature(c, v, random);
	}
	return c;
}

/**
 * The example mat, composed from this biome's tiles on its printed layout.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const mat = createCanvas(LAYOUT[0].length * SIZE, LAYOUT.length * SIZE);
	PLACEMENT.forEach((row, r) =>
		row.forEach(({ blocked, variant }, col) => {
			const tile = drawBiomeTile(blocked, variant);
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					set(
						mat,
						col * SIZE + x,
						r * SIZE + y,
						tile.p[y * SIZE + x]
					);
				}
			}
		})
	);
	return mat;
}

/**
 * What #36 needs to compose this mat: which variants are ordinary, which carry a printed meaning, and what only the example mat draws.
 * `pools` holds the variants that are safe to pick at random on any plot (0-based, as `drawBiomeTile` takes them).
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5]),
		blocked: Object.freeze([0, 1, 2, 3, 4]),
	}),
	special: Object.freeze([
		Object.freeze({
			blocked: false,
			variants: Object.freeze([6, 7]),
			meaning:
				'Reeds: the open plots next to a wisp (REEDS); use only there',
		}),
		Object.freeze({
			blocked: true,
			variants: Object.freeze([5]),
			meaning: "A will-o'-the-wisp: use only on the four WISPS plots",
		}),
	]),
	matOnly: Object.freeze([]),
});
