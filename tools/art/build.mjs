// The art build: draws every asset that has a drawing into static/art/<id>.svg (npm run art).
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toSvg } from './painter.js';
import { drawingCanvas } from './gallery.js';
import { CAPITAL_GRIDS } from './parts/capital-terrain.js';
import { BIOMES } from './parts/capital-biomes/index.js';
import { ASSETS } from '../../src/lib/art/catalog.js';
import {
	FOOTPRINTS,
	footprintMismatches,
} from '../../src/lib/art/footprints.js';
import { reliefSize } from '../../src/lib/art/relief.js';

/** @typedef {import('../../src/lib/art/catalog.js').Asset} Asset */
/** @typedef {import('./painter.js').Canvas} Canvas */

/** Where drawings live: one module per asset, at `<id>.js`. */
export const DRAWINGS_DIR = fileURLToPath(
	new URL('./drawings/', import.meta.url)
);

/** Where the finished SVGs go; Vite copies them into build/art/. */
export const OUT_DIR = fileURLToPath(
	new URL('../../static/art/', import.meta.url)
);

/** An illustration is a 64×64 scene (art style C). */
const ILLUSTRATION_SIZE = 64;

/** A territory picture is a flat-topped hex, 64×56; the cloud and volcano overlays and the boards keep their own sizes (#6). */
const TERRITORY_SIZE = { w: 64, h: 56 };

/** The hex pictures that overlay a territory rather than fill it. */
const HEX_OVERLAYS = ['hex/cloud', 'hex/volcano'];

/**
 * Tells whether an asset is a territory picture: a territory tile, or a terrain hex the map's wedges are cut from.
 * @param {Asset | undefined} asset
 * @returns {boolean}
 */
function isTerritoryPicture(asset) {
	return (
		asset?.group === 'territory-tile' ||
		(asset?.group === 'hex' && !HEX_OVERLAYS.includes(asset.id))
	);
}

/**
 * Throws unless a landmark's picture covers exactly its footprint. The same picture is
 * shown on the landmark's card and on the capital grid, so its shape is its footprint.
 * @param {string} id - e.g. 'landmark/forge'
 * @param {Canvas} canvas
 * @throws {Error} When the landmark has no footprint or the picture doesn't match it.
 */
function checkLandmarkPicture(id, canvas) {
	const rows = FOOTPRINTS[id.split('/')[1]];
	if (!rows) {
		throw new Error(`${id}: no footprint for this landmark`);
	}
	const [problem] = footprintMismatches(canvas, rows);
	if (problem) {
		throw new Error(
			`${id}: the picture doesn't match its footprint: ${problem}`
		);
	}
}

/**
 * Throws unless a capital relief is the size of its mat: 32-pixel plots with 1-pixel gaps on the mat's
 * printed layout, so the game can lay it over the mat's plots (#82).
 * @param {string} id - e.g. 'capital-relief/mountain'
 * @param {Canvas} canvas
 * @throws {Error} When no base or advanced mat has the relief's slug, or the relief isn't its mat's size.
 */
function checkCapitalRelief(id, canvas) {
	const slug = id.split('/')[1];
	const layout = Object.hasOwn(CAPITAL_GRIDS, slug)
		? CAPITAL_GRIDS[slug]
		: Object.hasOwn(BIOMES, slug)
			? BIOMES[slug].LAYOUT
			: null;
	if (!layout) {
		throw new Error(`${id}: no capital mat for this relief`);
	}
	const { w, h } = reliefSize(layout.length, layout[0].length);
	if (canvas.w !== w || canvas.h !== h) {
		throw new Error(
			`${id}: a capital relief must be ${w}×${h}, not ${canvas.w}×${canvas.h}`
		);
	}
}

/**
 * Lists the files under a folder, skipping hidden files and folders such as .DS_Store.
 * @param {string} dir
 * @returns {Promise<string[]>} Paths relative to the folder with '/' separators; empty when the folder is missing.
 */
async function listFiles(dir) {
	let entries;
	try {
		entries = await readdir(dir, { recursive: true, withFileTypes: true });
	} catch (error) {
		if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
			return [];
		}
		throw error;
	}
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) =>
			relative(dir, join(entry.parentPath, entry.name))
				.split(sep)
				.join('/')
		)
		.filter(
			(path) => !path.split('/').some((part) => part.startsWith('.'))
		);
}

/**
 * Lists every drawing.
 * @param {string} [drawingsDir]
 * @returns {Promise<string[]>} The ids of every `<group>/<slug>.js` drawing, sorted.
 * @throws {Error} When a file in the folder isn't a .js drawing, so it can't be skipped unnoticed.
 */
export async function listDrawingIds(drawingsDir = DRAWINGS_DIR) {
	const files = await listFiles(drawingsDir);
	for (const file of files) {
		if (!file.endsWith('.js')) {
			throw new Error(`${file}: drawings must be .js files`);
		}
	}
	return files.map((file) => file.slice(0, -'.js'.length)).sort();
}

/**
 * Lists every built SVG.
 * @param {string} [outDir]
 * @returns {Promise<string[]>} The ids of every `.svg` file, sorted.
 */
export async function listSvgIds(outDir = OUT_DIR) {
	return (await listFiles(outDir))
		.filter((file) => file.endsWith('.svg'))
		.map((file) => file.slice(0, -'.svg'.length))
		.sort();
}

/**
 * Draws one asset and returns its SVG.
 * @param {string} id - e.g. 'landmark/lighthouse'
 * @param {string} [drawingsDir]
 * @returns {Promise<string>}
 * @throws {Error} When the drawing doesn't export a draw() that returns a canvas.
 */
export async function renderAsset(id, drawingsDir = DRAWINGS_DIR) {
	return toSvg(await drawAsset(id, drawingsDir));
}

/**
 * Runs one asset's drawing.
 * @param {string} id
 * @param {string} drawingsDir
 * @returns {Promise<Canvas>}
 * @throws {Error} When the drawing doesn't export a draw() that returns a canvas.
 */
async function drawAsset(id, drawingsDir) {
	const drawing = await import(
		pathToFileURL(join(drawingsDir, `${id}.js`)).href
	);
	return drawingCanvas(id, drawing);
}

/**
 * Writes every drawing to `<outDir>/<id>.svg` and removes SVGs whose drawing is gone.
 * Every drawing is checked and drawn before anything is written, so a failure leaves the folder as it was.
 * @param {{ drawingsDir?: string, outDir?: string, assets?: readonly Asset[] }} [options]
 * @returns {Promise<{ written: string[], removed: string[] }>}
 * @throws {Error} When a drawing has no catalog entry, an illustration other than a landmark isn't 64×64,
 * a landmark's picture has no footprint or doesn't cover exactly its footprint, a territory picture isn't 64×56,
 * or a capital relief has no mat or isn't its mat's size.
 */
export async function buildArt({
	drawingsDir = DRAWINGS_DIR,
	outDir = OUT_DIR,
	assets = ASSETS,
} = {}) {
	const ids = await listDrawingIds(drawingsDir);
	const byId = new Map(assets.map((asset) => [asset.id, asset]));
	for (const id of ids) {
		if (!byId.has(id)) {
			throw new Error(`${id}: this drawing has no catalog entry`);
		}
	}
	/** @type {[string, string][]} */
	const drawn = [];
	for (const id of ids) {
		const canvas = await drawAsset(id, drawingsDir);
		const asset = byId.get(id);
		const wrongSize =
			canvas.w !== ILLUSTRATION_SIZE || canvas.h !== ILLUSTRATION_SIZE;
		if (asset?.group === 'landmark') {
			checkLandmarkPicture(id, canvas);
		} else if (asset?.group === 'capital-relief') {
			checkCapitalRelief(id, canvas);
		} else if (asset?.kind === 'illustration' && wrongSize) {
			throw new Error(
				`${id}: an illustration must be ${ILLUSTRATION_SIZE}×${ILLUSTRATION_SIZE}, not ${canvas.w}×${canvas.h}`
			);
		} else if (
			isTerritoryPicture(asset) &&
			(canvas.w !== TERRITORY_SIZE.w || canvas.h !== TERRITORY_SIZE.h)
		) {
			throw new Error(
				`${id}: a territory picture must be ${TERRITORY_SIZE.w}×${TERRITORY_SIZE.h}, not ${canvas.w}×${canvas.h}`
			);
		}
		drawn.push([id, toSvg(canvas)]);
	}
	const written = [];
	for (const [id, svg] of drawn) {
		const file = join(outDir, `${id}.svg`);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, svg);
		written.push(id);
	}
	const removed = [];
	for (const id of await listSvgIds(outDir)) {
		if (!ids.includes(id)) {
			await rm(join(outDir, `${id}.svg`));
			removed.push(id);
		}
	}
	return { written, removed };
}

// Run the build only when this file is the entry point, not when tests import it.
if (
	process.argv[1] &&
	realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const { written, removed } = await buildArt();
	console.log(
		`art: wrote ${written.length} SVG file(s) to static/art, removed ${removed.length}`
	);
}
