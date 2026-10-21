// The art build: draws every asset that has a drawing into client/static/art/<id>.svg (npm run art).
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toSvg } from './painter.js';
import { ASSETS } from './catalog.js';

/** @typedef {import('./catalog.js').Asset} Asset */

/** Where drawings live: one module per asset, at `<id>.js`. */
export const DRAWINGS_DIR = fileURLToPath(
	new URL('./drawings/', import.meta.url)
);

/** Where the finished SVGs go; Vite copies them into public/art/. */
export const OUT_DIR = fileURLToPath(
	new URL('../client/static/art/', import.meta.url)
);

/**
 * Lists the files under a folder with one extension, as ids relative to it.
 * @param {string} dir
 * @param {string} extension - e.g. '.js'
 * @returns {Promise<string[]>} Sorted ids with '/' separators; empty when the folder is missing.
 */
async function listIds(dir, extension) {
	let files;
	try {
		files = await readdir(dir, { recursive: true });
	} catch (error) {
		if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') {
			return [];
		}
		throw error;
	}
	return files
		.filter((file) => file.endsWith(extension))
		.map((file) => file.slice(0, -extension.length).split(sep).join('/'))
		.sort();
}

/**
 * Lists every drawing.
 * @param {string} [drawingsDir]
 * @returns {Promise<string[]>} The ids of every `<group>/<slug>.js` drawing, sorted.
 */
export function listDrawingIds(drawingsDir = DRAWINGS_DIR) {
	return listIds(drawingsDir, '.js');
}

/**
 * Lists every built SVG.
 * @param {string} [outDir]
 * @returns {Promise<string[]>} The ids of every `.svg` file, sorted.
 */
export function listSvgIds(outDir = OUT_DIR) {
	return listIds(outDir, '.svg');
}

/**
 * Draws one asset and returns its SVG.
 * @param {string} id - e.g. 'landmark/lighthouse'
 * @param {string} [drawingsDir]
 * @returns {Promise<string>}
 * @throws {Error} When the drawing doesn't export a draw() that returns a canvas.
 */
export async function renderAsset(id, drawingsDir = DRAWINGS_DIR) {
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
	return toSvg(canvas);
}

/**
 * Writes every drawing to `<outDir>/<id>.svg` and removes SVGs whose drawing is gone.
 * Nothing is written when any drawing lacks a catalog entry.
 * @param {{ drawingsDir?: string, outDir?: string, assets?: readonly Asset[] }} [options]
 * @returns {Promise<{ written: string[], removed: string[] }>}
 * @throws {Error} When a drawing has no catalog entry.
 */
export async function buildArt({
	drawingsDir = DRAWINGS_DIR,
	outDir = OUT_DIR,
	assets = ASSETS,
} = {}) {
	const ids = await listDrawingIds(drawingsDir);
	const known = new Set(assets.map((asset) => asset.id));
	for (const id of ids) {
		if (!known.has(id)) {
			throw new Error(`${id}: this drawing has no catalog entry`);
		}
	}
	const written = [];
	for (const id of ids) {
		const svg = await renderAsset(id, drawingsDir);
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
