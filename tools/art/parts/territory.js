// Board part: the map's terrain hexes, the 48 territory tiles and the example boards, painted in the 2.5D style by the map's painter (#6, #134).
import { createCanvas, paint, set, seededRandom } from '../painter.js';
import { PALETTE as C } from '../palette.js';
import { MAPS } from '../../../src/lib/engine/data/maps.js';
import { turned } from '../../../src/lib/engine/terrain.js';
import {
	CLOUD_SPOT,
	VOLCANO_SIZE,
	volcanoCorner,
} from '../../../src/lib/art/hex-overlays.js';
import {
	HEX_W,
	HEX_H,
	HEX_R,
	inHex,
	inIsland,
	turnOf,
	wedgeOf,
	islandPartOf,
	drawCloud,
	drawVolcano,
	VOLCANO_CRATER,
	volcanoSpot,
} from '../../../src/lib/art/paint/hex.js';
import {
	hexOrigin,
	paintMap,
	paintTerritory,
} from '../../../src/lib/art/paint/map.js';
import { paintSea } from '../../../src/lib/art/paint/sea.js';

// The overlays' places are shared with the game, whose map painter lays them over the hexes.
export { CLOUD_SPOT, VOLCANO_SIZE, volcanoCorner };

// The hex's geometry and the overlays moved to src/lib/art/paint/hex.js, so the game's map painter shares them (#134).
export {
	HEX_W,
	HEX_H,
	HEX_R,
	inHex,
	wedgeOf,
	islandPartOf,
	drawCloud,
	drawVolcano,
	VOLCANO_CRATER,
	volcanoSpot,
};

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */
/** @typedef {import('../../../src/lib/engine/data/ids.js').TerrainId} TerrainId */
/** @typedef {TerrainId | 'unexplored'} HexTerrain */
/** @typedef {() => number} Random */

/**
 * Which pixels the fog's painter fills, and the cell each one lies in: a wisp stays inside one cell, so no cell's
 * edge cuts it. −1 leaves the pixel alone.
 * @typedef {(x: number, y: number) => number} CellAt
 */

/**
 * A small picture standing on the ground, as rows of keys, one character per pixel (see paint()).
 * @typedef {Object} Sprite
 * @property {readonly string[]} rows
 * @property {Readonly<Record<string, Colour>>} colours
 */

/** The fog's seed: the `hex/unexplored` picture, which the game lays on every unexplored hex. */
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

/** The terrains a territory shows. @type {readonly string[]} */
const TERRAINS = Object.freeze([
	'sea',
	'desert',
	'forest',
	'grassland',
	'mountain',
]);

/**
 * Draws one terrain's hex picture, transparent outside the hex: a land or sea terrain painted alone all round, as the
 * map paints it, or the unexplored fog, which #134 kept as it was.
 * @param {HexTerrain} terrain
 * @returns {Canvas} 64×56
 * @throws {Error} For an unknown terrain.
 */
export function drawHexTerrain(terrain) {
	if (terrain === 'unexplored') {
		const canvas = createCanvas(HEX_W, HEX_H);
		paintUnexplored(canvas, hexCell, seededRandom(HEX_SEED));
		return canvas;
	}
	if (!TERRAINS.includes(terrain)) {
		throw new Error(`drawHexTerrain: unknown terrain "${terrain}"`);
	}
	return paintTerritory({ corners: Array(6).fill(terrain) });
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
 * Draws one side of the map board as an example: the printed territories turned as printed and painted as one
 * picture, as the game paints its map, every other hex unexplored under the fog, and open sea round them.
 * @param {'large' | 'small'} side
 * @returns {Canvas} The box round every hex of the board
 */
export function drawBoard(side) {
	const map = MAPS[side];
	const hexes = map.hexes.map((key) => {
		const printed = map.printed[key];
		return printed
			? {
					key,
					corners: turned(printed.corners, printed.orient),
					island: printed.island,
					clouds: printed.clouds,
					volcano: printed.volcano,
				}
			: { key };
	});
	const { canvas: explored, left, top } = paintMap(hexes);
	const { w, h } = explored;
	const canvas = createCanvas(w, h);
	paintSea(
		canvas,
		new Uint8Array(w * h).fill(1),
		new Uint8Array(w * h),
		side === 'large' ? 61 : 34
	);
	explored.p.forEach((colour, i) => {
		if (colour) {
			canvas.p[i] = colour;
		}
	});
	const fog = drawHexTerrain('unexplored');
	for (const hex of hexes) {
		if (!hex.corners) {
			const [x, y] = hexOrigin(hex.key);
			lay(canvas, fog, [x - left, y - top]);
		}
	}
	return canvas;
}
