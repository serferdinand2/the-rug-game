// The World Map's terrain in the 2.5D style (#134): the explored map painted as one picture, each run of one terrain across hexes as one mass.
import { createCanvas, mix } from './painter.js';
import { PALETTE as C } from './palette.js';
import {
	HEX_W,
	HEX_H,
	inHex,
	wedgeOf,
	islandPartOf,
	drawCloud,
	drawVolcano,
	volcanoSpot,
} from './hex.js';
import { CLOUD_SPOT, volcanoCorner } from '../hex-overlays.js';
import { groundOver, regionFootprint, SIDES } from './region.js';
import { hash } from './relief/ground.js';
import { paintMountains } from './relief/mountain.js';
import { paintForest } from './relief/forest.js';
import { paintDunes } from './dunes.js';
import { paintSea } from './sea.js';

/** @typedef {import('./painter.js').Canvas} Canvas */
/** @typedef {import('../../engine/data/ids.js').TerrainId} TerrainId */

/**
 * A hex of the board for the painter: an explored hex has its corners, already turned; one without corners is
 * unexplored and left transparent.
 * @typedef {Object} MapHexArt
 * @property {string} key - Its axial key, such as '2_-1'
 * @property {readonly TerrainId[]} [corners] - The terrain at each corner, clockwise from the top-left
 * @property {readonly TerrainId[]} [island] - The island's terrains, split as hexmap.js's islandParts splits them
 * @property {boolean} [clouds] - The cloud overlay goes on (R77)
 * @property {boolean} [volcano] - The volcano goes on a mountain corner (R77)
 */

/**
 * A run of one terrain across the map: what it is, which hexes it reaches and its pixels.
 * @typedef {Object} MapRegion
 * @property {TerrainId} terrain
 * @property {Set<string>} hexes - The keys of the hexes it reaches
 * @property {number[]} pixels - Its pixels' indexes on the map's picture
 */

/**
 * The painted map: the picture of every hex's box, and where its top-left pixel lies from hex 0_0's.
 * @typedef {Object} PaintedMap
 * @property {Canvas} canvas
 * @property {number} left
 * @property {number} top
 */

/**
 * One region's painting, cached: its ground and its features, each the size of the region's box.
 * @typedef {Object} RegionArt
 * @property {number} x - The box's left on the map's picture, from hex 0_0's top-left
 * @property {number} y - The box's top, likewise
 * @property {Canvas} ground
 * @property {Canvas | null} features - Transparent round the features; null for a terrain without any
 */

/** How dark the faint rim between two explored hexes is: the share of ink mixed into the art below it. */
const RIM = 0.6;

/** How many regions' paintings are kept, so placing a tile repaints only the regions it changes. */
const CACHE_SIZE = 512;

/** The biome of #82's natural ground under each land terrain. */
const GROUND = /** @type {Readonly<Record<string, string>>} */ ({
	mountain: 'mountain',
	forest: 'forest',
	desert: 'desert',
	grassland: 'grassland',
});

/** @type {Map<string, RegionArt>} */
const cache = new Map();

/**
 * Where a hex's picture goes, as its top-left pixel from hex 0_0's top-left: the board's hexes sit 48 pixels across
 * and 28 down from each other.
 * @param {string} key - An axial key, such as '2_-1'
 * @returns {[number, number]}
 * @example hexOrigin('0_1') // [48, 28]
 */
export function hexOrigin(key) {
	const [a, b] = key.split('_').map(Number);
	return [48 * (b - a), 28 * (a + b)];
}

/**
 * The map's terrain pixel by pixel: the box round every hex, each explored hex's pixels with their terrain and the
 * hex they lie in.
 * @param {readonly MapHexArt[]} hexes
 * @returns {{ w: number, h: number, left: number, top: number, terrains: (TerrainId | null)[], hexOf: Int32Array }}
 */
function terrainMap(hexes) {
	const origins = hexes.map((hex) => hexOrigin(hex.key));
	const left = Math.min(...origins.map(([x]) => x));
	const top = Math.min(...origins.map(([, y]) => y));
	const w = Math.max(...origins.map(([x]) => x)) - left + HEX_W;
	const h = Math.max(...origins.map(([, y]) => y)) - top + HEX_H;
	/** @type {(TerrainId | null)[]} */
	const terrains = new Array(w * h).fill(null);
	const hexOf = new Int32Array(w * h).fill(-1);
	hexes.forEach((hex, i) => {
		const corners = hex.corners;
		if (!corners) {
			return;
		}
		const island = hex.island ?? [];
		const ox = origins[i][0] - left;
		const oy = origins[i][1] - top;
		for (let y = 0; y < HEX_H; y++) {
			for (let x = 0; x < HEX_W; x++) {
				if (!inHex(x, y)) {
					continue;
				}
				const k = (oy + y) * w + ox + x;
				const part = islandPartOf(x, y, island.length);
				terrains[k] = part >= 0 ? island[part] : corners[wedgeOf(x, y)];
				hexOf[k] = i;
			}
		}
	});
	return { w, h, left, top, terrains, hexOf };
}

/**
 * Splits a terrain map into its regions: the runs of one terrain whose pixels touch along an edge, inside a tile or
 * across two hexes.
 * @param {ReturnType<typeof terrainMap>} map
 * @param {readonly MapHexArt[]} hexes
 * @returns {MapRegion[]} In the order of their first pixel
 */
function regionsOf({ w, h, terrains, hexOf }, hexes) {
	const seen = new Uint8Array(w * h);
	/** @type {MapRegion[]} */
	const regions = [];
	for (let start = 0; start < w * h; start++) {
		const terrain = terrains[start];
		if (!terrain || seen[start]) {
			continue;
		}
		/** @type {number[]} */
		const pixels = [];
		/** @type {Set<string>} */
		const keys = new Set();
		const stack = [start];
		seen[start] = 1;
		while (stack.length > 0) {
			const i = /** @type {number} */ (stack.pop());
			pixels.push(i);
			keys.add(hexes[hexOf[i]].key);
			const x = i % w;
			const y = (i - x) / w;
			for (const [dx, dy] of SIDES) {
				const nx = x + dx;
				const ny = y + dy;
				const k = ny * w + nx;
				if (
					nx >= 0 &&
					ny >= 0 &&
					nx < w &&
					ny < h &&
					!seen[k] &&
					terrains[k] === terrain
				) {
					seen[k] = 1;
					stack.push(k);
				}
			}
		}
		pixels.sort((a, b) => a - b);
		regions.push({ terrain, hexes: keys, pixels });
	}
	return regions;
}

/**
 * The regions of a map: each run of one terrain, inside a tile and across hexes. Unexplored hexes join nothing.
 * @param {readonly MapHexArt[]} hexes
 * @returns {MapRegion[]}
 */
export function mapRegions(hexes) {
	return regionsOf(terrainMap(hexes), hexes);
}

/**
 * Paints one region on its own box: its ground, then its features. The painting depends only on the region's
 * pixels, its place and, for the sea, the land beside it, so a region that a new tile doesn't touch looks the same.
 * @param {MapRegion} region
 * @param {ReturnType<typeof terrainMap>} map
 * @returns {RegionArt}
 */
function paintRegion(region, { w, left, top, terrains }) {
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	for (const i of region.pixels) {
		const x = i % w;
		const y = (i - x) / w;
		x0 = Math.min(x0, x);
		y0 = Math.min(y0, y);
		x1 = Math.max(x1, x);
		y1 = Math.max(y1, y);
	}
	const bw = x1 - x0 + 1;
	const bh = y1 - y0 + 1;
	const mask = new Uint8Array(bw * bh);
	for (const i of region.pixels) {
		const x = i % w;
		mask[((i - x) / w - y0) * bw + x - x0] = 1;
	}
	// The land round the sea, for its shallows: it changes the sea's painting, so it is part of the cache's key.
	const land = new Uint8Array(bw * bh);
	if (region.terrain === 'sea') {
		for (let y = 0; y < bh; y++) {
			for (let x = 0; x < bw; x++) {
				const t = terrains[(y0 + y) * w + x0 + x];
				if (t && t !== 'sea') {
					land[y * bw + x] = 1;
				}
			}
		}
	}
	const ax = x0 + left;
	const ay = y0 + top;
	const seed = hash(ax, ay, region.pixels.length);
	const key = `${region.terrain}:${ax}:${ay}:${bw}:${bh}:${hashBytes(mask)}:${hashBytes(land)}`;
	const cached = cache.get(key);
	if (cached) {
		return cached;
	}
	const ground = createCanvas(bw, bh);
	/** @type {Canvas | null} */
	let features = null;
	if (region.terrain === 'sea') {
		paintSea(ground, mask, land, seed);
	} else {
		groundOver(ground, GROUND[region.terrain], mask, seed);
		if (region.terrain === 'mountain') {
			features = createCanvas(bw, bh);
			paintMountains(features, regionFootprint(bw, bh, mask), seed);
		} else if (region.terrain === 'forest') {
			features = createCanvas(bw, bh);
			paintForest(features, regionFootprint(bw, bh, mask), seed);
		} else if (region.terrain === 'desert') {
			features = createCanvas(bw, bh);
			paintDunes(features, mask, seed);
		}
	}
	/** @type {RegionArt} */
	const art = { x: ax, y: ay, ground, features };
	if (cache.size >= CACHE_SIZE) {
		cache.delete(/** @type {string} */ (cache.keys().next().value));
	}
	cache.set(key, art);
	return art;
}

/**
 * Lays a region's layer on the map's picture at its place. A translucent pixel, such as a shadow, is blended into
 * the colour below it.
 * @param {Canvas} canvas - The map's picture
 * @param {Canvas} layer
 * @param {number} x - The layer's left on the picture
 * @param {number} y - The layer's top on the picture
 */
function layOn(canvas, layer, x, y) {
	for (let ly = 0; ly < layer.h; ly++) {
		for (let lx = 0; lx < layer.w; lx++) {
			const colour = layer.p[ly * layer.w + lx];
			if (!colour) {
				continue;
			}
			const i = (y + ly) * canvas.w + x + lx;
			const alpha = layer.alpha?.[ly * layer.w + lx] ?? 1;
			const below = canvas.p[i];
			canvas.p[i] =
				alpha < 1 && below ? mix(below, colour, alpha) : colour;
		}
	}
}

/**
 * Hashes a run of bytes into one 32-bit number, for the cache's keys.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function hashBytes(bytes) {
	let h = 0x811c9dc5;
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i]) {
			h = Math.imul(h ^ i, 0x01000193) >>> 0;
		}
	}
	return h;
}

/**
 * Lays an overlay's painted pixels over the map's picture.
 * @param {Canvas} canvas
 * @param {Canvas} top
 * @param {number} x
 * @param {number} y
 */
function stamp(canvas, top, x, y) {
	for (let ly = 0; ly < top.h; ly++) {
		for (let lx = 0; lx < top.w; lx++) {
			const colour = top.p[ly * top.w + lx];
			if (colour) {
				canvas.p[(y + ly) * canvas.w + x + lx] = colour;
			}
		}
	}
}

/**
 * Paints the explored map as one picture: every region's ground, the faint rims between explored hexes, every
 * region's features over the rims, the coast where land meets sea, then each hex's volcano and cloud.
 * @param {readonly MapHexArt[]} hexes - Every hex of the board; at least one
 * @returns {PaintedMap}
 */
export function paintMap(hexes) {
	const map = terrainMap(hexes);
	const { w, h, left, top, terrains, hexOf } = map;
	const canvas = createCanvas(w, h);
	const arts = regionsOf(map, hexes).map((region) =>
		paintRegion(region, map)
	);
	for (const art of arts) {
		layOn(canvas, art.ground, art.x - left, art.y - top);
	}
	// The faint rim: the pixels along each explored hex's lower and right edges where another explored hex begins.
	for (let i = 0; i < w * h; i++) {
		const x = i % w;
		const here = hexOf[i];
		if (here < 0) {
			continue;
		}
		const right = x + 1 < w ? hexOf[i + 1] : -1;
		const below = i + w < w * h ? hexOf[i + w] : -1;
		if ((right >= 0 && right !== here) || (below >= 0 && below !== here)) {
			canvas.p[i] = mix(/** @type {string} */ (canvas.p[i]), C.ink, RIM);
		}
	}
	for (const art of arts) {
		if (art.features) {
			layOn(canvas, art.features, art.x - left, art.y - top);
		}
	}
	paintCoast(canvas, terrains);
	hexes.forEach((hex) => {
		if (!hex.corners) {
			return;
		}
		const [ox, oy] = hexOrigin(hex.key);
		if (hex.volcano) {
			const [vx, vy] = volcanoSpot(volcanoCorner(hex.corners));
			stamp(canvas, drawVolcano(), ox - left + vx, oy - top + vy);
		}
		if (hex.clouds) {
			stamp(
				canvas,
				drawCloud(),
				ox - left + CLOUD_SPOT[0],
				oy - top + CLOUD_SPOT[1]
			);
		}
	});
	return { canvas, left, top };
}

/**
 * Paints one territory on its own, as the map would paint it alone: for a tile in hand, at the turn it is shown.
 * @param {Omit<MapHexArt, 'key'>} territory
 * @returns {Canvas} 64×56, transparent outside the hex
 */
export function paintTerritory(territory) {
	return paintMap([{ ...territory, key: '0_0' }]).canvas;
}

/**
 * Draws the coast where land meets sea, inside a tile and across hexes: a line of beach on the land and surf on the
 * sea beside it.
 * @param {Canvas} canvas
 * @param {readonly (TerrainId | null)[]} terrains
 */
function paintCoast(canvas, terrains) {
	const { w, h } = canvas;
	/** @type {[number, string][]} */
	const coast = [];
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const here = terrains[y * w + x];
			if (!here) {
				continue;
			}
			const sea = here === 'sea';
			const meets = SIDES.some(([dx, dy]) => {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
					return false;
				}
				const there = terrains[ny * w + nx];
				return there !== null && (there === 'sea') !== sea;
			});
			if (meets) {
				const surf = (x + 2 * y) % 7 === 0 ? C.dayWave : C.foam;
				coast.push([y * w + x, sea ? surf : C.sandLight]);
			}
		}
	}
	for (const [i, colour] of coast) {
		canvas.p[i] = colour;
	}
}
