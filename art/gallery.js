// The art shown on the component library page: one sample per scene part, and every catalog asset grouped for review.
// Plain JS with no Node APIs, so the library page runs it in the browser and the art build shares its checks.
import { createCanvas, outline, seededRandom, underlay } from './painter.js';
import { PALETTE } from './palette.js';
import { drawSky } from './parts/sky.js';
import { drawSea } from './parts/sea.js';
import { drawTerrain } from './parts/terrain.js';
import { drawBuilding } from './parts/buildings.js';
import { drawFigure } from './parts/figures.js';
import { drawSmoke } from './parts/smoke.js';
import { drawClassical } from './parts/classical.js';
import { drawFactory } from './parts/factory.js';
import { drawSkyline } from './parts/skyline.js';
import { drawStreet } from './parts/street.js';
import { drawShip } from './parts/ship.js';
import { drawInterior } from './parts/interior.js';
import { drawBanner } from './parts/banner.js';
import { drawCrowd } from './parts/crowd.js';
import { drawWheel } from './parts/wheel.js';
import { GROUPS, EXPANSIONS } from '../src/lib/art/catalog.js';
import { PLOT_SIZE, FOOTPRINTS } from '../src/lib/art/footprints.js';

/** @typedef {import('./painter.js').Canvas} Canvas */
/** @typedef {import('../src/lib/art/catalog.js').Asset} Asset */

/**
 * One asset on the page.
 * @typedef {Object} GalleryTile
 * @property {Asset} asset
 * @property {boolean} drawn - Its drawing exists
 * @property {number | null} plots - Pixels per capital plot, for laying the plot grid over a landmark; null otherwise
 * @property {boolean} showExpansion - Name the expansion in the caption, for lists that mix them
 */

/**
 * The tiles under one heading: an expansion, or every expansion at once.
 * @typedef {Object} GalleryList
 * @property {string | null} expansion - The expansion's name, or null when the list mixes expansions
 * @property {GalleryTile[]} tiles
 */

/**
 * One asset group.
 * @typedef {Object} GallerySection
 * @property {string} id - The group id, such as 'landmark'
 * @property {string} label - Its heading, such as 'Landmarks'
 * @property {number[]} issues - The art issues that draw its assets, lowest first
 * @property {number} total - How many assets it has
 * @property {number} drawn - How many of them are drawn
 * @property {GalleryList[]} lists
 */

/**
 * One sample per scene part, each alone on a 64×64 canvas.
 * Foreground parts get the outline pass, as they would in a scene.
 * @type {readonly { label: string, draw: () => Canvas }[]}
 */
export const PART_SAMPLES = Object.freeze([
	...['night', 'day', 'dusk'].map((time) => ({
		label: `sky: ${time}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSky(c, {
				time: /** @type {'night' | 'day' | 'dusk'} */ (time),
				horizon: 63,
				random: seededRandom(7),
				sparkles: [[12, 8]],
				moon: { x: 46, y: 14 },
			});
			return c;
		},
	})),
	...['night', 'day'].map((time) => ({
		label: `sea: ${time}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSea(c, {
				time: /** @type {'night' | 'day'} */ (time),
				top: 0,
				random: seededRandom(7),
			});
			return c;
		},
	})),
	...['forest', 'mountain', 'desert', 'grassland'].map((kind) => ({
		label: `terrain: ${kind}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawTerrain(c, {
				kind: /** @type {'forest' | 'mountain' | 'desert' | 'grassland'} */ (
					kind
				),
				top: 40,
				random: seededRandom(7),
			});
			return c;
		},
	})),
	...['house', 'tower', 'wall'].map((kind) => ({
		label: `building: ${kind}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawBuilding(c, {
				kind: /** @type {'house' | 'tower' | 'wall'} */ (kind),
				x: 22,
				y: 58,
			});
			outline(c, PALETTE.ink);
			return c;
		},
	})),
	{
		label: 'figure',
		draw: () => {
			const c = createCanvas(64, 64);
			drawFigure(c, { x: 25, y: 58 });
			drawFigure(c, {
				x: 33,
				y: 58,
				facing: 'left',
				clothes: PALETTE.roofLight,
			});
			outline(c, PALETTE.ink);
			return c;
		},
	},
	...['smoke', 'steam'].map((tone) => ({
		label: `smoke: ${tone}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSmoke(c, {
				x: 24,
				y: 58,
				tone: /** @type {'smoke' | 'steam'} */ (tone),
				puffs: 4,
			});
			return c;
		},
	})),
	...['pediment', 'flat'].map((roof) => ({
		label: `classical: ${roof}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawClassical(c, {
				x: 6,
				y: 58,
				width: 52,
				columns: 6,
				roof: /** @type {'pediment' | 'flat'} */ (roof),
			});
			outline(c, PALETTE.ink);
			return c;
		},
	})),
	{
		label: 'factory',
		draw: () => {
			const c = createCanvas(64, 64);
			drawFactory(c, { x: 6, y: 58, width: 52 });
			outline(c, PALETTE.ink);
			return c;
		},
	},
	...['night', 'dusk', 'day'].map((time) => ({
		label: `skyline: ${time}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawSkyline(c, {
				base: 63,
				time: /** @type {'night' | 'dusk' | 'day'} */ (time),
				random: seededRandom(7),
				height: 40,
			});
			return c;
		},
	})),
	{
		label: 'street',
		draw: () => {
			const c = createCanvas(64, 64);
			drawStreet(c, { top: 40 });
			return c;
		},
	},
	{
		label: 'ship',
		draw: () => {
			const c = createCanvas(64, 64);
			const sea = createCanvas(64, 64);
			drawSea(sea, { time: 'day', top: 44, random: seededRandom(7) });
			drawShip(c, { x: 12, y: 50, flag: PALETTE.brickRed });
			outline(c, PALETTE.ink);
			underlay(c, sea);
			return c;
		},
	},
	.../** @type {const} */ (['plaster', 'stone', 'panel']).map((wall) => ({
		label: `interior: ${wall}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawInterior(c, {
				floor: 44,
				random: seededRandom(7),
				wall,
				window: { x: 24, y: 6, w: 16, h: 16, time: 'night' },
			});
			return c;
		},
	})),
	.../** @type {const} */ (['flag', 'hanging']).map((kind) => ({
		label: `banner: ${kind}`,
		draw: () => {
			const c = createCanvas(64, 64);
			drawBanner(c, {
				kind,
				x: 8,
				y: 50,
				cloth: PALETTE.brickRed,
				device: PALETTE.gold,
			});
			drawBanner(c, {
				kind,
				x: 42,
				y: 50,
				cloth: PALETTE.roof,
				facing: 'left',
			});
			outline(c, PALETTE.ink);
			return c;
		},
	})),
	{
		label: 'crowd',
		draw: () => {
			const c = createCanvas(64, 64);
			drawCrowd(c, { x: 4, y: 58, count: 13, random: seededRandom(4) });
			outline(c, PALETTE.ink);
			return c;
		},
	},
	{
		label: 'wheel',
		draw: () => {
			const c = createCanvas(64, 64);
			drawWheel(c, { x: 22, y: 30, r: 14 });
			drawWheel(c, {
				x: 50,
				y: 46,
				r: 9,
				spokes: 6,
				spoke: PALETTE.brickRed,
			});
			outline(c, PALETTE.ink);
			return c;
		},
	},
]);

/** Expansion names by code. */
const EXPANSION_NAMES = new Map(
	EXPANSIONS.map(({ code, name }) => [code, name])
);

/**
 * Orders landmarks by footprint size: most plots first, then the larger bounding box,
 * then the catalog's order. A landmark without a footprint goes last.
 * @param {readonly Asset[]} landmarks
 * @returns {Asset[]}
 */
export function bySize(landmarks) {
	const size = (/** @type {Asset} */ asset) => {
		const slug = asset.id.split('/')[1];
		const rows = Object.hasOwn(FOOTPRINTS, slug) ? FOOTPRINTS[slug] : [];
		const plots = rows.join('').split('X').length - 1;
		const box = rows.length * (rows[0]?.length ?? 0);
		return { plots, box };
	};
	return landmarks
		.map((asset, index) => ({ asset, index, ...size(asset) }))
		.sort((a, b) => b.plots - a.plots || b.box - a.box || a.index - b.index)
		.map(({ asset }) => asset);
}

/**
 * Groups the assets for review: one section per catalog group, in catalog order. Landmarks are one list,
 * largest footprint first, across all expansions; every other group is split by expansion.
 * @param {readonly Asset[]} assets
 * @param {ReadonlySet<string>} drawn - The ids that have a drawing
 * @returns {GallerySection[]}
 */
export function gallerySections(assets, drawn) {
	/**
	 * @param {Asset} asset
	 * @param {boolean} showExpansion
	 * @returns {GalleryTile}
	 */
	const tile = (asset, showExpansion) => ({
		asset,
		drawn: drawn.has(asset.id),
		plots: asset.group === 'landmark' ? PLOT_SIZE : null,
		showExpansion,
	});
	return GROUPS.map((group) => {
		const members = assets.filter((asset) => asset.group === group.id);
		const lists =
			group.id === 'landmark'
				? [
						{
							expansion: null,
							tiles: bySize(members).map((asset) =>
								tile(asset, true)
							),
						},
					]
				: EXPANSIONS.map(({ code }) => ({
						expansion: EXPANSION_NAMES.get(code) ?? code,
						tiles: members
							.filter((asset) => asset.expansion === code)
							.map((asset) => tile(asset, false)),
					})).filter((list) => list.tiles.length > 0);
		return {
			id: group.id,
			label: group.label,
			issues: [
				...new Set(
					members.length > 0
						? members.map((asset) => asset.issue)
						: [group.issue]
				),
			].sort((a, b) => a - b),
			total: members.length,
			drawn: members.filter((asset) => drawn.has(asset.id)).length,
			lists,
		};
	});
}

/**
 * Runs a drawing module and checks what it returns.
 * @param {string} id - The asset id, for the error message
 * @param {{ draw?: unknown }} drawing - The drawing module
 * @returns {Canvas}
 * @throws {Error} When the module doesn't export a draw() that returns a whole canvas.
 */
export function drawingCanvas(id, drawing) {
	const canvas = typeof drawing.draw === 'function' ? drawing.draw() : null;
	const isCanvas =
		canvas &&
		Number.isInteger(canvas.w) &&
		Number.isInteger(canvas.h) &&
		Array.isArray(canvas.p) &&
		canvas.p.length === canvas.w * canvas.h;
	if (!isCanvas) {
		throw new Error(
			`${id}: a drawing must export a draw() function that returns a canvas`
		);
	}
	return canvas;
}
