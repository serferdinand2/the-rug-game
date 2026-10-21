// The asset gallery in art/preview/: every catalog asset, drawn or not, on one self-contained page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ASSETS } from '../art/catalog.js';
import { buildGallery } from '../art/preview/build.mjs';

const PART_LABELS = [
	'sky: night',
	'sky: day',
	'sky: dusk',
	'sea: night',
	'sea: day',
	'terrain: forest',
	'terrain: mountain',
	'terrain: desert',
	'terrain: grassland',
	'building: house',
	'building: tower',
	'building: wall',
	'figure',
	'smoke: smoke',
	'smoke: steam',
	'classical: pediment',
	'classical: flat',
	'factory',
	'skyline: night',
	'skyline: dusk',
	'skyline: day',
	'street',
];

/**
 * Returns a drawing module whose draw() fills a canvas of the given size.
 * @param {number} w
 * @param {number} h
 */
function filledDrawing(w, h) {
	return `export function draw() {
	return { w: ${w}, h: ${h}, p: new Array(${w * h}).fill('#aa0000') };
}
`;
}

/**
 * Makes a throwaway drawings folder holding the given files.
 * @param {Record<string, string>} files - Relative path → contents
 */
async function scratch(files) {
	const root = await mkdtemp(join(tmpdir(), 'rg-gallery-'));
	const drawingsDir = join(root, 'drawings');
	await mkdir(drawingsDir, { recursive: true });
	await writeFile(join(root, 'package.json'), '{ "type": "module" }');
	for (const [path, contents] of Object.entries(files)) {
		await mkdir(dirname(join(drawingsDir, path)), { recursive: true });
		await writeFile(join(drawingsDir, path), contents);
	}
	return { root, drawingsDir };
}

/**
 * Picks out one asset's figure from the page.
 * @param {string} html
 * @param {string} id
 */
function figureFor(html, id) {
	const start = html.indexOf(`data-id="${id}"`);
	assert.notEqual(start, -1, `${id} is missing`);
	const open = html.lastIndexOf('<figure', start);
	return html.slice(
		open,
		html.indexOf('</figure>', start) + '</figure>'.length
	);
}

const html = await buildGallery();

test('the gallery lists every catalog asset exactly once', () => {
	const ids = [...html.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
	assert.deepEqual([...ids].sort(), ASSETS.map((asset) => asset.id).sort());
});

test('each group heading shows its total and drawn counts', async () => {
	assert.match(html, /<h2>Landmarks · 33 · \d+ drawn<\/h2>/);
	assert.match(html, /<h2>Territory tiles · 48 · \d+ drawn<\/h2>/);
	const { root, drawingsDir } = await scratch({
		'landmark/drawn.js': filledDrawing(64, 64),
	});
	try {
		const asset = (/** @type {string} */ slug) => ({
			id: `landmark/${slug}`,
			name: slug,
			kind: 'illustration',
			group: 'landmark',
			expansion: 'base',
			issue: 7,
		});
		const page = await buildGallery({
			drawingsDir,
			assets: /** @type {any} */ ([asset('drawn'), asset('waiting')]),
		});
		assert.match(page, /<h2>Landmarks · 2 · 1 drawn<\/h2>/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('drawn assets show their SVG and the rest show a labelled slot', () => {
	const lighthouse = figureFor(html, 'landmark/lighthouse');
	assert.match(lighthouse, /data-drawn="yes"/);
	assert.match(lighthouse, /<svg/);
	const ageOfSail = figureFor(html, 'tapestry/age-of-sail');
	assert.match(ageOfSail, /data-drawn="no"/);
	assert.doesNotMatch(ageOfSail, /<svg/);
	assert.match(ageOfSail, /class="slot"/);
	for (const text of ['tapestry/age-of-sail', 'Age of Sail', '#9']) {
		assert.ok(ageOfSail.includes(text), text);
	}
});

test('drawn assets keep their own size', async () => {
	const { root, drawingsDir } = await scratch({
		'landmark/tall.js': filledDrawing(32, 48),
	});
	try {
		const assets = [
			{
				id: 'landmark/tall',
				name: 'Tall',
				kind: 'illustration',
				group: 'landmark',
				expansion: 'base',
				issue: 7,
			},
		];
		const page = await buildGallery({
			drawingsDir,
			assets: /** @type {any} */ (assets),
		});
		const tall = figureFor(page, 'landmark/tall');
		assert.match(tall, /width="64" height="96"/);
		assert.match(tall, /width="128" height="192"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('landmark pictures sit on their plot grid, 32 pixels per plot', async () => {
	const { root, drawingsDir } = await scratch({
		'landmark/forge.js': filledDrawing(64, 64),
	});
	try {
		const assets = [
			{
				id: 'landmark/forge',
				name: 'Forge',
				kind: 'illustration',
				group: 'landmark',
				expansion: 'base',
				issue: 7,
			},
		];
		const page = await buildGallery({
			drawingsDir,
			assets: /** @type {any} */ (assets),
		});
		const forge = figureFor(page, 'landmark/forge');
		assert.match(forge, /class="asset plots"/);
		// At 2× a plot is 64 pixels on screen, at 4× it is 128.
		assert.match(forge, /--plot:64px/);
		assert.match(forge, /--plot:128px/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the gallery opens from disk', () => {
	assert.doesNotMatch(html, /\s(src|href)=/);
	assert.doesNotMatch(html, /<link|<script/);
	assert.match(html, /^<!doctype html>/);
});

test('names are escaped', () => {
	assert.ok(html.includes('Sewage &amp; Plumbing'));
	assert.doesNotMatch(html, /&(?!amp;|lt;|gt;|quot;|#\d+;)/);
});

test('the scene parts are still shown', () => {
	for (const label of PART_LABELS) {
		assert.ok(html.includes(`<b>${label}</b>`), label);
	}
});
