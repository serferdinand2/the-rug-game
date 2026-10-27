// Capital terrain for the Archipelago advanced mat (#6): nine islands of grass and sand separated by impassable water.
import { createCanvas, rect, set, seededRandom, mix } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

const SIZE = 32;

/**
 * The mat's printed layout (research 03 "Archipelago"), one string per row, top first: '.' an open plot, 'X' an impassable one.
 * Every X is water except the three volcanoes listed in `VOLCANOES`, which are printed on island land.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'..X..XX..',
	'..X...XX.',
	'..X....X.',
	'XXXXX.XXX',
	'.X.XXXXX.',
	'.X.X..X..',
	'.X....X..',
	'.XXX..XXX',
	'XX.XXXX..',
	'.XX..X...',
	'..X..X...',
];

/**
 * The volcanoes, [row, column] from 0: impassable plots on an island's land. The other impassable plots are water.
 * @type {readonly (readonly [number, number])[]}
 */
export const VOLCANOES = [
	[4, 3],
	[5, 3],
	[9, 2],
];

/** The impassable variant that is a volcano on land; variants 0-4 are water. */
export const VOLCANO_VARIANT = 5;

/** @param {() => number} r @param {number} a @param {number} b @returns {number} */
function rngInt(r, a, b) {
	return a + Math.floor(r() * (b - a + 1));
}

/**
 * Fills a hard-edged polygon.
 * @param {Canvas} c
 * @param {number[][]} pts
 * @param {Colour} col
 */
function polygon(c, pts, col) {
	const ys = pts.map((p) => p[1]);
	const xs = pts.map((p) => p[0]);
	for (
		let y = Math.floor(Math.min(...ys));
		y < Math.ceil(Math.max(...ys));
		y++
	) {
		for (
			let x = Math.floor(Math.min(...xs));
			x < Math.ceil(Math.max(...xs));
			x++
		) {
			const px = x + 0.5;
			const py = y + 0.5;
			let inside = false;
			for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
				const a = pts[i];
				const b = pts[j];
				if (
					a[1] > py !== b[1] > py &&
					px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]
				) {
					inside = !inside;
				}
			}
			if (inside) {
				set(c, x, y, col);
			}
		}
	}
}

/**
 * Fills an ellipse, lit from the top left.
 * @param {Canvas} c
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Colour} light
 * @param {Colour} mid
 * @param {Colour} dark
 */
function blob(c, cx, cy, rx, ry, light, mid, dark) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const dx = (x + 0.5 - cx) / rx;
			const dy = (y + 0.5 - cy) / ry;
			if (dx * dx + dy * dy <= 1) {
				const t = -dx * 0.6 - dy * 0.8;
				set(c, x, y, t > 0.4 ? light : t > -0.3 ? mid : dark);
			}
		}
	}
}

const LAND = { base: C.grass, light: C.grassLight, dark: C.grassShade };
const WATER = { base: C.daySea2, light: C.daySea1, deep: C.daySea3 };
const BEACH = mix(C.sand, C.grassLight, 0.15);

/**
 * A random spot near the tile's rim, so the middle stays calm for a building icon.
 * @param {() => number} r
 * @returns {[number, number]}
 */
function rimSpot(r) {
	const side = rngInt(r, 0, 3);
	const along = rngInt(r, 2, 29);
	const depth = rngInt(r, 2, 7);
	return side === 0
		? [along, depth]
		: side === 1
			? [along, 31 - depth]
			: side === 2
				? [depth, along]
				: [31 - depth, along];
}

/**
 * Island ground: grass with soft patches and blades.
 * @param {Canvas} c
 * @param {() => number} r
 */
function drawLand(c, r) {
	rect(c, 0, 0, SIZE, SIZE, LAND.base);
	for (let i = 0; i < 11; i++) {
		rect(
			c,
			rngInt(r, 1, 27),
			rngInt(r, 1, 28),
			rngInt(r, 2, 5),
			rngInt(r, 1, 3),
			i % 3 === 0 ? LAND.dark : LAND.light
		);
	}
	for (let i = 0; i < 30; i++) {
		set(
			c,
			rngInt(r, 0, 31),
			rngInt(r, 0, 31),
			i % 3 === 0 ? LAND.dark : LAND.light
		);
	}
}

/**
 * A buildable island plot.
 * @param {number} v
 * @param {() => number} r
 * @returns {Canvas}
 */
function openTile(v, r) {
	const c = createCanvas(SIZE, SIZE);
	drawLand(c, r);
	const tuft = (
		/** @type {number} */ x,
		/** @type {number} */ y,
		/** @type {Colour} */ col
	) => {
		set(c, x, y, col);
		set(c, x - 1, y - 1, col);
		set(c, x + 1, y - 2, col);
	};
	if (v === 0) {
		for (let i = 0; i < 6; i++) {
			const [x, y] = rimSpot(r);
			tuft(x, y, i % 2 ? LAND.dark : C.forestFloorLight);
		}
	} else if (v === 1) {
		const petals = [C.gold, C.creamLight, C.brickRedLight, C.arcaneLight];
		for (let i = 0; i < 6; i++) {
			const [x, y] = rimSpot(r);
			set(c, x, y, petals[i % 4]);
			set(c, x, y + 1, LAND.dark);
		}
	} else if (v === 2) {
		const [x, y] = rimSpot(r);
		blob(c, x, y, 5, 3, C.sandLight, BEACH, C.sand);
		for (let i = 0; i < 4; i++) {
			const [a, b] = rimSpot(r);
			set(c, a, b, C.sandLight);
		}
	} else if (v === 3) {
		for (let i = 0; i < 5; i++) {
			const [x, y] = rimSpot(r);
			rect(c, x, y, 2, 1, C.stoneLight);
			rect(c, x, y + 1, 2, 1, C.stoneShade);
		}
	} else if (v === 4) {
		for (let i = 0; i < 3; i++) {
			const [x, y] = rimSpot(r);
			blob(c, x, y, 3, 2, C.sandLight, C.sand, C.sandShade);
			set(c, x, y, i === 1 ? C.brickRedLight : C.creamLight);
			set(c, x + 1, y, C.creamShade);
		}
	} else if (v === 5) {
		for (let i = 0; i < 4; i++) {
			const [x, y] = rimSpot(r);
			rect(c, x, y, rngInt(r, 4, 7), 2, C.forestFloorLight);
			rect(c, x + 1, y + 2, 3, 1, C.forestFloor);
		}
	} else if (v === 6) {
		const [x, y] = [rngInt(r, 4, 7), rngInt(r, 22, 27)];
		blob(c, x, y, 4, 3, C.pineLight, C.pine, C.pineShade);
		set(c, x - 1, y - 1, C.grassLight);
		blob(
			c,
			27 - rngInt(r, 0, 2),
			6,
			3,
			2,
			C.pineLight,
			C.pine,
			C.pineShade
		);
	} else {
		for (let i = 0; i < 3; i++) {
			const [x, y] = rimSpot(r);
			rect(c, x, y, 6, 1, C.timberLight);
			rect(c, x, y + 1, 6, 1, C.timber);
			set(c, x + 6, y, C.timberShade);
		}
		for (let i = 0; i < 4; i++) {
			const [x, y] = rimSpot(r);
			set(c, x, y, C.sandLight);
		}
	}
	return c;
}

/**
 * Open sea: blue water with wave dashes.
 * @param {Canvas} c
 * @param {() => number} r
 */
function drawSea(c, r) {
	rect(c, 0, 0, SIZE, SIZE, WATER.base);
	for (let i = 0; i < 9; i++) {
		rect(
			c,
			rngInt(r, 0, 28),
			rngInt(r, 0, 30),
			rngInt(r, 3, 8),
			2,
			i % 2 ? WATER.light : WATER.deep
		);
	}
	for (let i = 0; i < 14; i++) {
		set(c, rngInt(r, 0, 31), rngInt(r, 0, 31), WATER.deep);
	}
}

/**
 * A wave crest: a bright dash with a darker line under it.
 * @param {Canvas} c
 * @param {number} x
 * @param {number} y
 * @param {number} len
 */
function crest(c, x, y, len) {
	rect(c, x, y, len, 1, C.dayWave);
	rect(c, x + 1, y + 1, len, 1, C.dayWaveDeep);
}

/**
 * An impassable plot: water 0-4, or the volcano 5.
 * @param {number} v
 * @param {() => number} r
 * @returns {Canvas}
 */
function blockedTile(v, r) {
	const c = createCanvas(SIZE, SIZE);
	if (v === VOLCANO_VARIANT) {
		drawLand(c, r);
		drawVolcano(c);
		return c;
	}
	drawSea(c, r);
	if (v === 0) {
		for (let i = 0; i < 6; i++) {
			crest(c, rngInt(r, 1, 24), 2 + i * 5, rngInt(r, 4, 7));
		}
	} else if (v === 1) {
		for (let k = 0; k < 4; k++) {
			for (let x = 0; x < 30; x++) {
				const y =
					4 + k * 7 + Math.round(1.6 * Math.sin(x * 0.5 + k * 1.7));
				if (x % 9 < 6) {
					set(c, x, y, C.dayWave);
					set(c, x, y + 1, C.dayWaveDeep);
				}
			}
		}
	} else if (v === 2) {
		// A reef of rocks breaking the surface, ringed with foam.
		blob(c, 16, 17, 11, 7, C.foam, C.foam, C.daySeaLine);
		blob(c, 11, 16, 5, 4, C.stoneLight, C.stone, C.stoneShade);
		blob(c, 20, 18, 6, 4, C.stoneLight, C.stone, C.stoneShade);
		blob(c, 16, 21, 3, 2, C.stone, C.stoneMid, C.stoneShade);
		crest(c, 3, 4, 6);
		crest(c, 21, 27, 6);
	} else if (v === 3) {
		// A whirlpool: arcs darkening towards the centre.
		const rings = [
			[13, WATER.light],
			[10, C.dayWaveDeep],
			[7, WATER.deep],
			[4, C.nightSea1],
		];
		for (const [rad, col] of rings) {
			for (let a = 0; a < 6.28; a += 0.04) {
				if (Math.sin(a * 2.5) > -0.6) {
					set(
						c,
						Math.round(16 + Math.cos(a) * Number(rad)),
						Math.round(16 + Math.sin(a) * Number(rad) * 0.8),
						String(col)
					);
				}
			}
		}
		blob(c, 16, 16, 3, 2, C.nightSea2, C.nightSea2, C.nightSea3);
	} else {
		// A sea stack: a tall rock with a shadow on the water and foam at its foot.
		blob(c, 19, 24, 10, 3, C.nightSea1, C.nightSea1, C.nightSea1);
		blob(c, 16, 24, 9, 4, C.foam, C.foam, C.daySeaLine);
		polygon(
			c,
			[
				[10, 24],
				[13, 10],
				[15, 5],
				[18, 9],
				[21, 14],
				[23, 24],
			],
			C.stone
		);
		polygon(
			c,
			[
				[10, 24],
				[13, 10],
				[15, 5],
				[16, 11],
				[15, 24],
			],
			C.stoneLight
		);
		polygon(
			c,
			[
				[19, 11],
				[21, 14],
				[23, 24],
				[18, 24],
			],
			C.stoneShade
		);
		set(c, 15, 6, C.snowShade);
		crest(c, 2, 5, 6);
		crest(c, 22, 29, 6);
	}
	return c;
}

/**
 * A volcano cone on the island's grass, with a glowing crater.
 * @param {Canvas} c
 */
function drawVolcano(c) {
	blob(c, 17, 27, 13, 3, LAND.dark, LAND.dark, LAND.dark);
	polygon(
		c,
		[
			[4, 26],
			[12, 9],
			[20, 9],
			[28, 26],
		],
		C.stoneMid
	);
	polygon(
		c,
		[
			[4, 26],
			[12, 9],
			[15, 9],
			[14, 26],
		],
		C.stone
	);
	polygon(
		c,
		[
			[22, 26],
			[20, 9],
			[28, 26],
		],
		C.stoneShade
	);
	for (let y = 12; y < 26; y += 4) {
		rect(c, 8 + Math.floor((y - 12) / 3), y, 3, 1, C.stoneShade);
	}
	blob(c, 16, 9, 6, 2.5, C.stoneLight, C.stone, C.stoneShade);
	blob(c, 16, 9, 4, 1.7, C.amber, C.brickRed, C.brickRedShade);
	rect(c, 14, 8, 3, 1, C.gold);
	// A lava stream running down the cone.
	for (let y = 10; y < 22; y++) {
		set(c, 17 + (y % 5 === 0 ? 1 : 0), y, y < 16 ? C.amber : C.brickRed);
	}
	set(c, 18, 21, C.brickRedShade);
	// Smoke over the crater.
	blob(c, 17, 4, 3, 2, C.cream, C.cloudShade, C.creamShade);
	set(c, 21, 2, C.cloudShade);
	set(c, 13, 3, C.cloudShade);
}

/**
 * One 32×32 plot of this biome.
 * @param {boolean} blocked - An impassable plot
 * @param {number} variant - 0-7 for a buildable plot, 0-5 for an impassable one
 * @returns {Canvas}
 */
export function drawBiomeTile(blocked, variant) {
	const seed = 7001 + variant * 7919 + (blocked ? 50021 : 0);
	const random = seededRandom(seed);
	return blocked ? blockedTile(variant, random) : openTile(variant, random);
}

/**
 * Which tile the example mat uses at each plot: `{ blocked, variant }`, rows top first. The mat is composed from exactly these tiles.
 * @returns {{ blocked: boolean, variant: number }[][]}
 */
export function placement() {
	return LAYOUT.map((line, row) =>
		[...line].map((ch, col) => {
			const blocked = ch === 'X';
			const volcano = VOLCANOES.some(([a, b]) => a === row && b === col);
			const hash =
				(row + 1) * 193 +
				(col + 1) * 389 +
				(row + 1) * (col + 3) * 71 +
				(row * row + col * col) * 43;
			const variant = volcano
				? VOLCANO_VARIANT
				: hash % (blocked ? 5 : 8);
			return { blocked, variant };
		})
	);
}

/**
 * Paints a beach onto an island plot on the sides that face water.
 * @param {Canvas} mat
 * @param {number} x0 - The plot's left pixel
 * @param {number} y0 - The plot's top pixel
 * @param {{ n: boolean, e: boolean, s: boolean, w: boolean }} water - Which neighbours are water
 * @param {boolean[]} corners - Water at the diagonals: nw, ne, se, sw
 * @param {number} seed
 */
function addBeach(mat, x0, y0, water, corners, seed) {
	const r = seededRandom(seed);
	/** @type {number[]} */
	const wobble = [];
	for (let i = 0; i < SIZE * 4; i++) {
		wobble.push(rngInt(r, 0, 1));
	}
	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			let depth = 99;
			let at = 0;
			if (water.n && y < depth) {
				depth = y;
				at = x;
			}
			if (water.s && 31 - y < depth) {
				depth = 31 - y;
				at = 32 + x;
			}
			if (water.w && x < depth) {
				depth = x;
				at = 64 + y;
			}
			if (water.e && 31 - x < depth) {
				depth = 31 - x;
				at = 96 + y;
			}
			const cornerHits = [
				corners[0] && !water.n && !water.w ? Math.hypot(x, y) : 99,
				corners[1] && !water.n && !water.e ? Math.hypot(31 - x, y) : 99,
				corners[2] && !water.s && !water.e
					? Math.hypot(31 - x, 31 - y)
					: 99,
				corners[3] && !water.s && !water.w ? Math.hypot(x, 31 - y) : 99,
			];
			const cd = Math.min(...cornerHits);
			if (cd < depth) {
				depth = cd;
				at = x + y;
			}
			if (depth === 99) {
				continue;
			}
			const width = 3 + wobble[at % wobble.length];
			if (depth < 1) {
				set(mat, x0 + x, y0 + y, C.sandLight);
			} else if (depth < width) {
				set(mat, x0 + x, y0 + y, depth < width - 1 ? BEACH : C.sand);
			} else if (depth < width + 1) {
				set(mat, x0 + x, y0 + y, C.grassLight);
			}
		}
	}
}

/**
 * The example mat, composed from this biome's tiles on its printed layout, with beaches where islands meet water.
 * @returns {Canvas}
 */
export function drawBiomeMat() {
	const rows = LAYOUT.length;
	const cols = LAYOUT[0].length;
	const mat = createCanvas(cols * SIZE, rows * SIZE);
	const plan = placement();
	/** @type {(row: number, col: number) => boolean} */
	const isWater = (row, col) =>
		row >= 0 &&
		row < rows &&
		col >= 0 &&
		col < cols &&
		LAYOUT[row][col] === 'X' &&
		plan[row][col].variant !== VOLCANO_VARIANT;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const { blocked, variant } = plan[row][col];
			const tile = drawBiomeTile(blocked, variant);
			for (let y = 0; y < SIZE; y++) {
				for (let x = 0; x < SIZE; x++) {
					set(
						mat,
						col * SIZE + x,
						row * SIZE + y,
						tile.p[y * SIZE + x]
					);
				}
			}
		}
	}
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			// A volcano is land too: its sides on the water get a beach like any island plot.
			if (isWater(row, col)) {
				continue;
			}
			addBeach(
				mat,
				col * SIZE,
				row * SIZE,
				{
					n: isWater(row - 1, col),
					e: isWater(row, col + 1),
					s: isWater(row + 1, col),
					w: isWater(row, col - 1),
				},
				[
					isWater(row - 1, col - 1),
					isWater(row - 1, col + 1),
					isWater(row + 1, col + 1),
					isWater(row + 1, col - 1),
				],
				9100 + row * 31 + col
			);
		}
	}
	return mat;
}

/**
 * What #36 needs to compose this mat: which variants are ordinary, which carry a printed meaning, and what only the example mat draws.
 * `pools` holds the variants that are safe to pick at random on any plot (0-based, as `drawBiomeTile` takes them).
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([0, 1, 2, 3, 4]),
	}),
	special: Object.freeze([
		Object.freeze({
			blocked: true,
			variants: Object.freeze([5]),
			meaning:
				'A volcano on island land: impassable, but land, so it needs a beach where it meets water (VOLCANO_VARIANT)',
		}),
	]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'beaches',
			where: 'Sand edges drawn on island plots, volcano plots included, on every side that faces water; the mat applies them from LAYOUT, so a composed mat must too',
		}),
	]),
});
