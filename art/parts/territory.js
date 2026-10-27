// Board part: the map's terrain hexes, the cloud and volcano overlays, and the territories and boards composed from them (#6).
import { createCanvas, outline, paint, set, seededRandom } from '../painter.js';
import { PALETTE as C } from '../palette.js';
import { MAPS } from '../../src/lib/engine/data/maps.js';
import { turned } from '../../src/lib/engine/terrain.js';
import {
	CLOUD_SIZE,
	CLOUD_SPOT,
	VOLCANO_SIZE,
	volcanoCorner,
} from '../../src/lib/art/hex-overlays.js';

// The overlays' places are shared with the game, which lays them over the hexes it composes.
export { CLOUD_SPOT, VOLCANO_SIZE, volcanoCorner };

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {import('../../src/lib/engine/data/ids.js').TerrainId} TerrainId */
/** @typedef {TerrainId | 'unexplored'} HexTerrain */
/** @typedef {() => number} Random */

/**
 * Which pixels a painter fills, and the cell each one lies in: a feature (a peak, a tree, a dune) stays inside one
 * cell, so cutting the picture along the cells' edges never splits one. −1 leaves the pixel alone.
 * @typedef {(x: number, y: number) => number} CellAt
 */

/**
 * A small picture standing on the ground, as rows of keys, one character per pixel (see paint()).
 * @typedef {Object} Sprite
 * @property {readonly string[]} rows
 * @property {Readonly<Record<string, Colour>>} colours
 */

/**
 * A territory to compose: its corners already turned, as the board shows them.
 * @typedef {Object} TerritoryOptions
 * @property {readonly TerrainId[]} corners - The terrain at each corner, clockwise from the top-left
 * @property {readonly TerrainId[]} [island] - The island's terrains, split as hexmap.js's islandParts splits them
 * @property {boolean} [clouds] - The cloud overlay goes on (R77)
 * @property {boolean} [volcano] - The volcano goes on a mountain corner (R77)
 * @property {number} seed - Picks each terrain picture's variant
 */

/** A territory picture's width: a flat-topped hex from corner to corner. */
export const HEX_W = 64;

/** A territory picture's height: the hex from side to side, √3·32 rounded so the board tiles in whole pixels. */
export const HEX_H = 56;

/** The hex's radius in pixels: the distance from its centre to a corner. */
export const HEX_R = 32;

const CX = HEX_W / 2;
const CY = HEX_H / 2;

/** The island's small hexagon, as a share of the radius (hexmap.js). */
const ISLAND = 0.42;

const HALF_ROOT_3 = Math.sqrt(3) / 2;

/** The hex's corners in pixels, clockwise from the top-left: hexmap.js's corners, stretched to 64×56. */
const CORNERS = /** @type {readonly [number, number][]} */ ([
	[16, 0],
	[48, 0],
	[64, 28],
	[48, 56],
	[16, 56],
	[0, 28],
]);

/** The canonical seed: the `hex/*` pictures, which the game composes its map from. */
export const HEX_SEED = 1;

/**
 * The map's clouds: the only colours the cloud overlay uses, and nothing else on the map uses them (R77).
 * @type {readonly Colour[]}
 */
export const CLOUD_COLOURS = Object.freeze([
	C.mapCloudLight,
	C.mapCloud,
	C.mapCloudShade,
	C.mapCloudEdge,
]);

/**
 * Tells whether a pixel's centre lies inside the hex. Neighbouring hexes, 48 pixels across and 28 down, or 56 down,
 * share no pixel and leave none out.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function inHex(x, y) {
	const dx = Math.abs(x + 0.5 - CX);
	const dy = Math.abs(y + 0.5 - CY);
	return dy < CY && dx < HEX_R - (dy * HEX_R) / HEX_H;
}

/**
 * How far round the hex a pixel's centre lies, in hexmap.js's undistorted frame: 0 towards corner 0, then
 * clockwise, one per corner, so 0 ≤ turn < 6.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function turnOf(x, y) {
	const gx = (x + 0.5 - CX) / HEX_R;
	const gy = ((y + 0.5 - CY) / CY) * HALF_ROOT_3;
	const sixths = ((Math.atan2(gy, gx) * 180) / Math.PI + 120) / 60;
	return ((sixths % 6) + 6) % 6;
}

/**
 * The corner whose wedge holds a pixel: hexmap.js's cornerWedge in pixels, within 30° of the corner's direction.
 * No pixel centre lies on a wedge's edge.
 * @param {number} x
 * @param {number} y
 * @returns {number} 0–5, clockwise from the top-left corner
 */
export function wedgeOf(x, y) {
	return Math.round(turnOf(x, y)) % 6;
}

/**
 * Tells whether a pixel lies on the island's small hexagon in the middle.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inIsland(x, y) {
	const gx = Math.abs((x + 0.5 - CX) / HEX_R);
	const gy = Math.abs(((y + 0.5 - CY) / CY) * HALF_ROOT_3);
	return gy < ISLAND * HALF_ROOT_3 && gx < ISLAND - gy / Math.sqrt(3);
}

/**
 * The island part a pixel lies in: hexmap.js's islandParts in pixels, which gives part i the sixths of the island
 * between corners k and k + 1 for which ⌊k·count/6⌋ = i.
 * @param {number} x
 * @param {number} y
 * @param {number} count - How many terrains the island has; 0 for none
 * @returns {number} The part's index, or −1 off the island
 */
export function islandPartOf(x, y, count) {
	if (count < 1 || !inIsland(x, y)) {
		return -1;
	}
	return Math.floor((Math.floor(turnOf(x, y)) * count) / 6);
}

/** The first island cell: cells below it lie round the island, the island's own from it. */
const ISLAND_CELLS = 6;

/**
 * A hex's cells: the six wedges round the island (0–5), and the island's six sixths (6–11). A feature in a wedge is
 * never cut by a wedge's edge or the island's shore, and one on the island never by the split of a many-terrain island.
 * @type {CellAt}
 */
function hexCell(x, y) {
	if (!inHex(x, y)) {
		return -1;
	}
	if (inIsland(x, y)) {
		return ISLAND_CELLS + Math.floor(turnOf(x, y));
	}
	return wedgeOf(x, y);
}

/**
 * Narrows a cell function to the wedges round the island, or to the island itself.
 * @param {CellAt} cellAt
 * @param {boolean} island
 * @returns {CellAt}
 */
function zone(cellAt, island) {
	return (x, y) => {
		const cell = cellAt(x, y);
		return cell >= 0 && cell >= ISLAND_CELLS === island ? cell : -1;
	};
}

/**
 * Draws one terrain's hex picture: the ground and its features, transparent outside the hex.
 * @param {HexTerrain} terrain
 * @param {number} seed
 * @returns {Canvas} 64×56
 * @throws {Error} For an unknown terrain.
 */
export function drawHexTerrain(terrain, seed) {
	const canvas = createCanvas(HEX_W, HEX_H);
	paintTerrain(canvas, terrain, hexCell, seededRandom(seed));
	return canvas;
}

/** @type {Record<HexTerrain, (canvas: Canvas, cellAt: CellAt, random: Random) => void>} */
const PAINTERS = {
	sea: paintSea,
	desert: paintDesert,
	forest: paintForest,
	grassland: paintGrassland,
	mountain: paintMountain,
	unexplored: paintUnexplored,
};

/**
 * Paints a terrain over the pixels a cell function covers.
 * @param {Canvas} canvas
 * @param {HexTerrain} terrain
 * @param {CellAt} cellAt
 * @param {Random} random
 * @throws {Error} For an unknown terrain.
 */
function paintTerrain(canvas, terrain, cellAt, random) {
	const painter = Object.hasOwn(PAINTERS, terrain)
		? PAINTERS[terrain]
		: undefined;
	if (!painter) {
		throw new Error(`drawHexTerrain: unknown terrain "${terrain}"`);
	}
	painter(canvas, cellAt, random);
}

/**
 * The ground's tones: a base colour, with a darker tone where a smooth noise runs low and a lighter one where it
 * runs high, so the tones form soft, uneven drifts rather than rectangles.
 * @typedef {Object} Ground
 * @property {Colour} base
 * @property {Colour} [low] - Where the noise falls below `lowAt`
 * @property {Colour} [high] - Where it rises above `highAt`
 * @property {number} [lowAt=0.35]
 * @property {number} [highAt=0.65]
 * @property {[number, number]} [grain=[8, 8]] - The noise's grain across and down, in pixels
 */

/**
 * Fills the covered pixels with the ground's tones.
 * @param {Canvas} canvas
 * @param {CellAt} cellAt
 * @param {Random} random
 * @param {Ground} tones
 */
function ground(
	canvas,
	cellAt,
	random,
	{ base, low, high, lowAt = 0.35, highAt = 0.65, grain = [8, 8] }
) {
	const coarse = valueNoise(random, canvas, grain[0], grain[1]);
	const fine = valueNoise(random, canvas, grain[0] / 2, grain[1] / 2);
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			if (cellAt(x, y) < 0) {
				continue;
			}
			const n = 0.7 * coarse(x, y) + 0.3 * fine(x, y);
			let colour = base;
			if (low && n < lowAt) {
				colour = low;
			} else if (high && n > highAt) {
				colour = high;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * A smooth value noise over a canvas: random values on a grid, eased between.
 * @param {Random} random
 * @param {Canvas} canvas
 * @param {number} stepX - The grid's step across, in pixels
 * @param {number} stepY - The grid's step down, in pixels
 * @returns {(x: number, y: number) => number} From 0 to 1
 */
function valueNoise(random, canvas, stepX, stepY) {
	const cols = Math.ceil(canvas.w / stepX) + 2;
	const rows = Math.ceil(canvas.h / stepY) + 2;
	const grid = Array.from({ length: cols * rows }, () => random());
	/** @param {number} t */
	const ease = (t) => t * t * (3 - 2 * t);
	return (x, y) => {
		const gx = x / stepX;
		const gy = y / stepY;
		const ix = Math.floor(gx);
		const iy = Math.floor(gy);
		const fx = ease(gx - ix);
		const fy = ease(gy - iy);
		/** @param {number} i @param {number} j */
		const at = (i, j) => grid[(iy + j) * cols + ix + i];
		const top = at(0, 0) + (at(1, 0) - at(0, 0)) * fx;
		const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * fx;
		return top + (bottom - top) * fy;
	};
}

/**
 * The pixels a sprite paints at a top-left position.
 * @param {Sprite} sprite
 * @param {number} x
 * @param {number} y
 * @returns {[number, number][]}
 */
function spritePixels(sprite, x, y) {
	/** @type {[number, number][]} */
	const pixels = [];
	sprite.rows.forEach((row, j) => {
		[...row].forEach((key, i) => {
			if (Object.hasOwn(sprite.colours, key)) {
				pixels.push([x + i, y + j]);
			}
		});
	});
	return pixels;
}

/**
 * Options for scatter.
 * @typedef {Object} ScatterOptions
 * @property {number} spacing - The grid's step: one feature per step at most
 * @property {(random: Random) => Sprite} sprite - Picks each feature
 * @property {boolean} [overlap=false] - Features may cover each other, the lower ones in front
 * @property {number} [tries=4] - Nudges for each grid point before it is left empty
 * @property {number} [skip=0] - The share of grid points left empty on purpose
 */

/**
 * Scatters features over a jittered grid. Each stays inside one cell with a pixel to spare, so neither a cut along
 * the cells nor the coast reaches it. Lower features are drawn over higher ones.
 * @param {Canvas} canvas
 * @param {CellAt} cellAt
 * @param {Random} random
 * @param {ScatterOptions} options
 */
function scatter(
	canvas,
	cellAt,
	random,
	{ spacing, sprite, overlap = false, tries = 4, skip = 0 }
) {
	/** @type {{ x: number, y: number, sprite: Sprite }[]} */
	const placed = [];
	/** @type {Set<number>} */
	const taken = new Set();
	for (let gy = 0, row = 0; gy < canvas.h + spacing; gy += spacing, row++) {
		for (
			let gx = row % 2 ? spacing / 2 : 0;
			gx < canvas.w + spacing;
			gx += spacing
		) {
			if (random() < skip) {
				continue;
			}
			for (let t = 0; t < tries; t++) {
				const shape = sprite(random);
				const w = Math.max(...shape.rows.map((r) => r.length));
				const x = Math.round(gx + (random() - 0.5) * spacing - w / 2);
				const y = Math.round(
					gy + (random() - 0.5) * spacing - shape.rows.length / 2
				);
				const pixels = spritePixels(shape, x, y);
				if (fits(pixels, cellAt, overlap ? null : taken, canvas.w)) {
					placed.push({ x, y, sprite: shape });
					for (const [px, py] of pixels) {
						taken.add(py * canvas.w + px);
					}
					break;
				}
			}
		}
	}
	placed.sort(
		(a, b) => a.y + a.sprite.rows.length - (b.y + b.sprite.rows.length)
	);
	for (const { x, y, sprite: shape } of placed) {
		paint(canvas, x, y, shape.rows, shape.colours);
	}
}

/**
 * Tells whether a feature fits: its pixels lie in one cell, clear of the features placed, with a pixel to spare round
 * them. On the island the spare pixel may lie in the next sixth, since only the island's shore is a coast.
 * @param {readonly [number, number][]} pixels
 * @param {CellAt} cellAt
 * @param {Set<number> | null} taken - The pixels already used; null when features may overlap
 * @param {number} width - The canvas's width, for the taken set's keys
 * @returns {boolean}
 */
function fits(pixels, cellAt, taken, width) {
	if (pixels.length === 0) {
		return false;
	}
	const cell = cellAt(pixels[0][0], pixels[0][1]);
	for (const [x, y] of pixels) {
		if (taken?.has(y * width + x) || cellAt(x, y) !== cell) {
			return false;
		}
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const beside = cellAt(x + dx, y + dy);
			const spare =
				beside === cell ||
				(cell >= ISLAND_CELLS && beside >= ISLAND_CELLS);
			if (!spare) {
				return false;
			}
		}
	}
	return cell >= 0;
}

/**
 * Picks one of a list.
 * @template T
 * @param {Random} random
 * @param {readonly T[]} list
 * @returns {T}
 */
function pick(random, list) {
	return list[Math.floor(random() * list.length)];
}

/**
 * Scatters a terrain's features twice: large ones in the wedges round the island, small ones on the island.
 * @param {Canvas} canvas
 * @param {CellAt} cellAt
 * @param {Random} random
 * @param {ScatterOptions} around
 * @param {ScatterOptions} island
 */
function features(canvas, cellAt, random, around, island) {
	scatter(canvas, zone(cellAt, false), random, around);
	scatter(canvas, zone(cellAt, true), random, island);
}

// The sea: deep blue, with darker depths, wave crests and glints.
const WAVE = { l: C.dayWave, d: C.dayWaveDeep };
const WAVES = /** @type {readonly Sprite[]} */ ([
	{ rows: ['.lll.', 'd...d'], colours: WAVE },
	{ rows: ['.ll.', 'd..d'], colours: WAVE },
	{ rows: ['.ll', 'd..'], colours: WAVE },
	{ rows: ['ddd'], colours: WAVE },
]);

/** @param {Canvas} canvas @param {CellAt} cellAt @param {Random} random */
function paintSea(canvas, cellAt, random) {
	ground(canvas, cellAt, random, {
		base: C.daySea2,
		low: C.daySea3,
		high: C.daySea1,
		lowAt: 0.36,
		highAt: 0.75,
		grain: [12, 4],
	});
	features(
		canvas,
		cellAt,
		random,
		{ spacing: 9, sprite: (r) => pick(r, WAVES), skip: 0.2 },
		{ spacing: 6, sprite: (r) => pick(r, WAVES.slice(1)), tries: 6 }
	);
}

// The desert: warm sand rippled by the wind, with crescent dunes lit from the top left.
/**
 * A crescent dune: a lit crest arching over its shadowed slip face, the shadow deepest under the top of the arch.
 * @param {number} w - Its width, odd
 * @returns {Sprite}
 */
function dune(w) {
	const height = w > 7 ? 2 : 1;
	const grid = Array.from({ length: height + 3 }, () => [...'.'.repeat(w)]);
	for (let i = 0; i < w; i++) {
		const rise = Math.sin((Math.PI * i) / (w - 1));
		const crest = Math.round(height * (1 - rise));
		grid[crest][i] = 'l';
		grid[crest + 1][i] = 's';
		if (rise > 0.6 && w > 5) {
			grid[crest + 2][i] = 's';
		}
	}
	return {
		rows: grid
			.map((row) => row.join(''))
			.filter((row) => row !== '.'.repeat(w)),
		colours: { l: C.sandLight, s: C.sandShade },
	};
}

const DUNES = Object.freeze([dune(13), dune(11), dune(9), dune(7)]);
const RIPPLES = Object.freeze([dune(7), dune(5), dune(5)]);

/** @param {Canvas} canvas @param {CellAt} cellAt @param {Random} random */
function paintDesert(canvas, cellAt, random) {
	ground(canvas, cellAt, random, {
		base: C.sand,
		high: C.sandLight,
		highAt: 0.64,
		grain: [12, 6],
	});
	features(
		canvas,
		cellAt,
		random,
		{ spacing: 9, sprite: (r) => pick(r, DUNES), tries: 6 },
		{ spacing: 5, sprite: (r) => pick(r, RIPPLES), tries: 6 }
	);
}

// Grassland: bright meadow with tufts, small bushes and a scatter of flowers.
const GRASS = { l: C.grassLight, s: C.grassShade };
const MEADOW = /** @type {readonly Sprite[]} */ ([
	{ rows: ['l.l', '.s.'], colours: GRASS },
	{ rows: ['l.l', '.s.'], colours: GRASS },
	{ rows: ['.l.', 'lls', '.s.'], colours: GRASS },
	{ rows: ['.l.', 'lls', '.s.'], colours: GRASS },
	{ rows: ['f', 's'], colours: { f: C.creamLight, s: C.grassShade } },
	{ rows: ['f', 's'], colours: { f: C.arcaneLight, s: C.grassShade } },
	{ rows: ['f', 's'], colours: { f: C.brickRedLight, s: C.grassShade } },
]);

/** @param {Canvas} canvas @param {CellAt} cellAt @param {Random} random */
function paintGrassland(canvas, cellAt, random) {
	ground(canvas, cellAt, random, {
		base: C.grass,
		low: C.grassShade,
		high: C.grassLight,
		lowAt: 0.28,
		highAt: 0.64,
		grain: [9, 7],
	});
	const meadow = {
		spacing: 6,
		sprite: (/** @type {Random} */ r) => pick(r, MEADOW),
		skip: 0.15,
	};
	features(canvas, cellAt, random, meadow, { ...meadow, spacing: 5 });
}

/**
 * A round tree crown seen from above, lit on its top left and shaded on its lower right.
 * @param {number} r - Its radius, 2 or 3
 * @returns {Sprite}
 */
function crown(r) {
	const rows = [];
	for (let dy = -r; dy <= r; dy++) {
		let row = '';
		for (let dx = -r; dx <= r; dx++) {
			const inside = dx * dx + dy * dy <= r * r + r * 0.6;
			if (!inside) {
				row += '.';
			} else if (dx + dy <= -r) {
				row += 'l';
			} else if (dx + dy >= r - 1 && dx * dx + dy * dy >= r * r - r) {
				row += 's';
			} else {
				row += 'p';
			}
		}
		rows.push(row);
	}
	return {
		rows,
		colours: { l: C.pineLight, p: C.pine, s: C.pineShade },
	};
}

const CROWNS = Object.freeze([crown(2), crown(3), crown(3)]);
const SMALL_CROWNS = Object.freeze([crown(2)]);

/** @param {Canvas} canvas @param {CellAt} cellAt @param {Random} random */
function paintForest(canvas, cellAt, random) {
	ground(canvas, cellAt, random, {
		base: C.forestFloorShade,
		high: C.forestFloor,
		highAt: 0.58,
		grain: [7, 7],
	});
	features(
		canvas,
		cellAt,
		random,
		{ spacing: 4, sprite: (r) => pick(r, CROWNS), overlap: true, tries: 6 },
		{
			spacing: 3,
			sprite: (r) => pick(r, SMALL_CROWNS),
			overlap: true,
			tries: 6,
		}
	);
}

// Mountains: grey scree under a crowd of peaks, snow on their tips, lit from the top left.
const ROCK = {
	S: C.snow,
	s: C.snowShade,
	L: C.stoneLight,
	M: C.stone,
	D: C.stoneShade,
};
const PEAKS = /** @type {readonly Sprite[]} */ ([
	{
		rows: [
			'.....S.....',
			'....SSs....',
			'...SSsss...',
			'...LSMsD...',
			'..LLLMDDD..',
			'.LLLLMDDDD.',
			'LLLLLMDDDDD',
		],
		colours: ROCK,
	},
	{
		rows: ['...S...', '..SSs..', '.LSMsD.', '.LLMDD.', 'LLLMDDD'],
		colours: ROCK,
	},
]);
const SMALL_PEAKS = /** @type {readonly Sprite[]} */ ([
	{ rows: ['...S...', '..SSs..', '.LLMDD.', 'LLLMDDD'], colours: ROCK },
	{ rows: ['..S..', '.LSs.', 'LLMDD'], colours: ROCK },
]);

/** @param {Canvas} canvas @param {CellAt} cellAt @param {Random} random */
function paintMountain(canvas, cellAt, random) {
	ground(canvas, cellAt, random, {
		base: C.stoneMid,
		low: C.stoneShade,
		high: C.stone,
		lowAt: 0.3,
		highAt: 0.6,
		grain: [7, 6],
	});
	features(
		canvas,
		cellAt,
		random,
		{
			spacing: 7,
			sprite: (r) =>
				r() < 0.6 ? PEAKS[0] : pick(r, [...PEAKS, ...SMALL_PEAKS]),
			overlap: true,
			tries: 8,
		},
		{
			spacing: 4,
			sprite: (r) => pick(r, SMALL_PEAKS),
			overlap: true,
			tries: 8,
		}
	);
}

// Unexplored: dark fog with drifting wisps, inside a dashed rim.
const WISPS = /** @type {readonly Sprite[]} */ ([
	{ rows: ['.lll..', 'l...ll'], colours: { l: C.fogLight } },
	{ rows: ['ll.', '..l'], colours: { l: C.fogLight } },
]);

/** @param {Canvas} canvas @param {CellAt} cellAt @param {Random} random */
function paintUnexplored(canvas, cellAt, random) {
	ground(canvas, cellAt, random, {
		base: C.fog,
		low: C.fogShade,
		lowAt: 0.4,
		grain: [14, 7],
	});
	const wisps = {
		spacing: 10,
		sprite: (/** @type {Random} */ r) => pick(r, WISPS),
		skip: 0.3,
	};
	features(canvas, cellAt, random, wisps, { ...wisps, spacing: 7 });
	// The dashed rim: dashes of four along the hex's edge, the map's fog line.
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			if (cellAt(x, y) < 0) {
				continue;
			}
			const flat = cellAt(x, y - 1) < 0 || cellAt(x, y + 1) < 0;
			const slant = cellAt(x - 1, y) < 0 || cellAt(x + 1, y) < 0;
			if ((flat && x % 6 < 4) || (!flat && slant && y % 6 < 4)) {
				set(canvas, x, y, C.fogLine);
			}
		}
	}
}

/**
 * Draws the cloud overlay: three puffs, lit on top and shaded underneath, in the map clouds' own colours.
 * It goes at CLOUD_SPOT, wholly inside the hex.
 * @returns {Canvas} 22×12, transparent round the cloud
 */
export function drawCloud() {
	const canvas = createCanvas(CLOUD_SIZE[0], CLOUD_SIZE[1]);
	const puffs = [
		[6, 7, 4],
		[11, 5, 5],
		[16, 7, 4],
	];
	const bottom = 10;
	for (let y = 1; y <= bottom; y++) {
		for (let x = 1; x < canvas.w - 1; x++) {
			const puff = puffs.find(
				([px, py, r]) =>
					(x - px) ** 2 + (y - py) ** 2 <= r * r + r * 0.5
			);
			if (!puff) {
				continue;
			}
			const [px, py, r] = puff;
			let colour = C.mapCloud;
			if (y >= bottom - 1) {
				colour = C.mapCloudShade;
			} else if (x - px + (y - py) <= -r + 1) {
				colour = C.mapCloudLight;
			}
			set(canvas, x, y, colour);
		}
	}
	outline(canvas, C.mapCloudEdge);
	return canvas;
}

/** The volcano's crater in its overlay: the pixel set on its corner's line from the hex's centre. */
export const VOLCANO_CRATER = /** @type {readonly [number, number]} */ (
	Object.freeze([8, 9])
);

/** How far the crater stands from the hex's centre towards its corner, as a share of the way. */
const VOLCANO_REACH = 0.55;

/**
 * Draws the volcano overlay: a dark cone outlined in ink, lava glowing in its crater and running down its front,
 * under a column of ash that billows to the right with embers in it. Nothing in it is as light as a cloud.
 * It goes at volcanoSpot(volcanoCorner(corners)).
 * @returns {Canvas} 17×17, transparent round the volcano
 */
export function drawVolcano() {
	const canvas = createCanvas(VOLCANO_SIZE, VOLCANO_SIZE);
	const [cx, crater] = VOLCANO_CRATER;
	// The lava's column on each row of the cone, the crater first, wandering a little.
	const lava = [0, 0, 1, 1, 0, 0, -1];
	lava.forEach((run, r) => {
		const half = 2 + Math.round((r * 5) / 6);
		for (let dx = -half; dx <= half; dx++) {
			let colour = C.basalt;
			if (dx < -half / 3) {
				colour = C.basaltLight;
			} else if (dx > half / 3) {
				colour = C.basaltShade;
			}
			if (r === 0 && Math.abs(dx) < half) {
				colour = dx === 0 ? C.gold : C.amber;
			} else if (r > 0 && dx === run) {
				colour = r < 3 ? C.amber : C.brickRed;
			}
			set(canvas, cx + dx, crater + r, colour);
		}
	});
	outline(canvas, C.ink);
	const puffs = [
		[8, 7, 1],
		[9, 5, 2],
		[6, 3, 2],
		[11, 3, 3],
	];
	for (const [px, py, r] of puffs) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (dx * dx + dy * dy > r * r + r) {
					continue;
				}
				let colour = C.ash;
				if (dy > 0 && dy >= r - 1) {
					colour = C.ashShade;
				} else if (dx + dy <= -r) {
					colour = C.ashLight;
				}
				set(canvas, px + dx, py + dy, colour);
			}
		}
	}
	set(canvas, 9, 6, C.amber);
	set(canvas, 12, 2, C.amber);
	set(canvas, 7, 3, C.brickRed);
	return canvas;
}

/**
 * Where the volcano overlay's top-left pixel goes in a territory picture: its crater on the line from the hex's
 * centre to the corner, a little over half way, so the whole volcano stays inside the hex.
 * @param {number} corner - 0–5
 * @returns {[number, number]}
 */
export function volcanoSpot(corner) {
	const [x, y] = CORNERS[corner];
	return [
		Math.round(CX + (x - CX) * VOLCANO_REACH - 0.5) - VOLCANO_CRATER[0],
		Math.round(CY + (y - CY) * VOLCANO_REACH - 0.5) - VOLCANO_CRATER[1],
	];
}

/**
 * Composes a territory: each pixel from its wedge's or island part's terrain picture, a coast of beach and surf where
 * land meets sea, then the volcano and the cloud.
 * @param {TerritoryOptions} options
 * @returns {Canvas} 64×56, transparent outside the hex
 */
export function drawTerritory({
	corners,
	island = [],
	clouds = false,
	volcano = false,
	seed,
}) {
	/** @type {Map<TerrainId, Canvas>} */
	const pictures = new Map();
	/** @param {TerrainId} terrain */
	const pictureOf = (terrain) => {
		let picture = pictures.get(terrain);
		if (!picture) {
			picture = drawHexTerrain(terrain, seed);
			pictures.set(terrain, picture);
		}
		return picture;
	};
	const canvas = createCanvas(HEX_W, HEX_H);
	/** @type {(TerrainId | null)[]} */
	const terrains = new Array(HEX_W * HEX_H).fill(null);
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (!inHex(x, y)) {
				continue;
			}
			const part = islandPartOf(x, y, island.length);
			const terrain = part >= 0 ? island[part] : corners[wedgeOf(x, y)];
			const i = y * HEX_W + x;
			terrains[i] = terrain;
			canvas.p[i] = pictureOf(terrain).p[i];
		}
	}
	drawCoast(canvas, terrains);
	if (volcano) {
		lay(canvas, drawVolcano(), volcanoSpot(volcanoCorner(corners)));
	}
	if (clouds) {
		lay(canvas, drawCloud(), CLOUD_SPOT);
	}
	return canvas;
}

/**
 * Draws the coast where land meets sea: a line of beach on the land, surf on the sea beside it and a band of
 * shallows beyond.
 * @param {Canvas} canvas
 * @param {readonly (TerrainId | null)[]} terrains - Each pixel's terrain, null outside the hex
 */
function drawCoast(canvas, terrains) {
	/** @param {number} x @param {number} y */
	const at = (x, y) =>
		x < 0 || y < 0 || x >= HEX_W || y >= HEX_H
			? null
			: terrains[y * HEX_W + x];
	const sides = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	];
	/** @type {[number, number, Colour][]} */
	const coast = [];
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			const here = at(x, y);
			if (!here) {
				continue;
			}
			const sea = here === 'sea';
			/** @param {number} dx @param {number} dy */
			const other = (dx, dy) => {
				const there = at(x + dx, y + dy);
				return there !== null && (there === 'sea') !== sea;
			};
			if (sides.some(([dx, dy]) => other(dx, dy))) {
				const surf = (x + 2 * y) % 7 === 0 ? C.dayWave : C.foam;
				coast.push([x, y, sea ? surf : C.sandLight]);
			} else if (
				sea &&
				sides.some(([dx, dy]) => other(2 * dx, 2 * dy)) &&
				(x + y) % 2 === 0
			) {
				coast.push([x, y, C.daySea1]);
			}
		}
	}
	for (const [x, y, colour] of coast) {
		set(canvas, x, y, colour);
	}
}

/**
 * Lays an overlay's painted pixels over a canvas.
 * @param {Canvas} canvas
 * @param {Canvas} overlay
 * @param {readonly [number, number]} spot - The overlay's top-left pixel
 */
function lay(canvas, overlay, [left, top]) {
	for (let y = 0; y < overlay.h; y++) {
		for (let x = 0; x < overlay.w; x++) {
			const colour = overlay.p[y * overlay.w + x];
			if (colour) {
				set(canvas, left + x, top + y, colour);
			}
		}
	}
}

/**
 * Where hex 0_0's centre lies on a board's picture: the hexes sit at x = 48·(b − a), y = 28·(a + b) from it,
 * and the board starts at the left and top hexes' edges.
 * @param {'large' | 'small'} side
 * @returns {[number, number]}
 */
export function boardOrigin(side) {
	const centres = MAPS[side].hexes.map(centreOf);
	return [
		CX - Math.min(...centres.map(([x]) => x)),
		CY - Math.min(...centres.map(([, y]) => y)),
	];
}

/**
 * A hex's centre in pixels from hex 0_0's.
 * @param {string} key - An axial key, such as '2_-1'
 * @returns {[number, number]}
 */
function centreOf(key) {
	const [a, b] = key.split('_').map(Number);
	return [48 * (b - a), 28 * (a + b)];
}

/**
 * Draws one side of the map board as an example: the printed territories composed and turned as printed, every
 * other hex unexplored, and open sea round them. The game composes its own map from the `hex/*` pictures.
 * @param {'large' | 'small'} side
 * @returns {Canvas}
 */
export function drawBoard(side) {
	const map = MAPS[side];
	const [ox, oy] = boardOrigin(side);
	const centres = map.hexes.map(centreOf);
	const canvas = createCanvas(
		ox + Math.max(...centres.map(([x]) => x)) + CX,
		oy + Math.max(...centres.map(([, y]) => y)) + CY
	);
	paintTerrain(
		canvas,
		'sea',
		() => 0,
		seededRandom(side === 'large' ? 61 : 34)
	);
	const fog = drawHexTerrain('unexplored', HEX_SEED);
	map.hexes.forEach((key, i) => {
		const printed = map.printed[key];
		const picture = printed
			? drawTerritory({
					corners: turned(printed.corners, printed.orient),
					island: printed.island,
					clouds: printed.clouds,
					volcano: printed.volcano,
					seed: printed.tile,
				})
			: fog;
		const [x, y] = centres[i];
		lay(canvas, picture, [ox + x - CX, oy + y - CY]);
	});
	return canvas;
}
