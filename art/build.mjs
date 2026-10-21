// The art build: draws every asset that has a drawing into client/static/art/<id>.svg (npm run art).
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toSvg } from './painter.js';
import { ASSETS } from './catalog.js';
import { FOOTPRINTS, footprintMismatches } from './footprints.js';

/** @typedef {import('./catalog.js').Asset} Asset */
/** @typedef {import('./painter.js').Canvas} Canvas */

/** Where drawings live: one module per asset, at `<id>.js`. */
export const DRAWINGS_DIR = fileURLToPath(
	new URL('./drawings/', import.meta.url)
);

/** Where the finished SVGs go; Vite copies them into public/art/. */
export const OUT_DIR = fileURLToPath(
	new URL('../client/static/art/', import.meta.url)
);

/** An illustration is a 64×64 scene (art style C). */
const ILLUSTRATION_SIZE = 64;

/**
 * Throws unless a landmark's board piece covers exactly its footprint.
 * @param {string} id - e.g. 'landmark-marker/forge'
 * @param {Canvas} canvas
 * @throws {Error} When the landmark has no footprint or the piece doesn't match it.
 */
function checkBoardPiece(id, canvas) {
	const rows = FOOTPRINTS[id.split('/')[1]];
	if (!rows) {
		throw new Error(`${id}: no footprint for this landmark`);
	}
	const [problem] = footprintMismatches(canvas, rows);
	if (problem) {
		throw new Error(
			`${id}: the board piece doesn't match its footprint: ${problem}`
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

/**
 * Writes every drawing to `<outDir>/<id>.svg` and removes SVGs whose drawing is gone.
 * Every drawing is checked and drawn before anything is written, so a failure leaves the folder as it was.
 * @param {{ drawingsDir?: string, outDir?: string, assets?: readonly Asset[] }} [options]
 * @returns {Promise<{ written: string[], removed: string[] }>}
 * @throws {Error} When a drawing has no catalog entry, or an illustration isn't 64×64.
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
		const wrongSize =
			canvas.w !== ILLUSTRATION_SIZE || canvas.h !== ILLUSTRATION_SIZE;
		if (byId.get(id)?.kind === 'illustration' && wrongSize) {
			throw new Error(
				`${id}: an illustration must be ${ILLUSTRATION_SIZE}×${ILLUSTRATION_SIZE}, not ${canvas.w}×${canvas.h}`
			);
		}
		if (byId.get(id)?.group === 'landmark-marker') {
			checkBoardPiece(id, canvas);
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
		`art: wrote ${written.length} SVG file(s) to client/static/art, removed ${removed.length}`
	);
}
