// The art build: drawings become committed SVGs in static/art, kept in step with the catalog and the code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ASSETS } from '../src/lib/art/catalog.js';
import {
	OUT_DIR,
	listDrawingIds,
	listSvgIds,
	renderAsset,
	buildArt,
} from '../art/build.mjs';

const TWO_BY_TWO = `export function draw() {
	return { w: 2, h: 2, p: ['#aa0000', null, null, '#0000bb'] };
}
`;

/**
 * Makes a throwaway drawings folder holding the given files.
 * @param {Record<string, string>} files - Relative path → contents
 */
async function scratch(files) {
	const root = await mkdtemp(join(tmpdir(), 'rg-art-'));
	const drawingsDir = join(root, 'drawings');
	const outDir = join(root, 'out');
	await mkdir(drawingsDir, { recursive: true });
	// Without a package.json, Node might read the drawings as CommonJS.
	await writeFile(join(root, 'package.json'), '{ "type": "module" }');
	for (const [path, contents] of Object.entries(files)) {
		await mkdir(dirname(join(drawingsDir, path)), { recursive: true });
		await writeFile(join(drawingsDir, path), contents);
	}
	return { root, drawingsDir, outDir };
}

test('every drawing has a catalog entry', async () => {
	const known = new Set(ASSETS.map((asset) => asset.id));
	for (const id of await listDrawingIds()) {
		assert.ok(known.has(id), `art/drawings/${id}.js has no catalog entry`);
	}
});

test('every committed SVG is up to date with its drawing', async () => {
	const ids = await listDrawingIds();
	assert.ok(ids.includes('landmark/lighthouse'));
	for (const id of ids) {
		const file = join(OUT_DIR, `${id}.svg`);
		assert.ok(existsSync(file), `${id}.svg is missing: run npm run art`);
		assert.equal(
			await readFile(file, 'utf8'),
			await renderAsset(id),
			`${id}.svg is out of date: run npm run art`
		);
	}
});

test('every SVG in static/art belongs to a drawing', async () => {
	const drawings = new Set(await listDrawingIds());
	for (const id of await listSvgIds()) {
		assert.ok(
			drawings.has(id),
			`${id}.svg has no drawing: run npm run art`
		);
	}
});

test('buildArt refuses a drawing with no catalog entry', async () => {
	const { root, drawingsDir, outDir } = await scratch({
		'landmark/nowhere.js': TWO_BY_TWO,
	});
	try {
		await assert.rejects(
			buildArt({ drawingsDir, outDir }),
			/landmark\/nowhere: this drawing has no catalog entry/
		);
		assert.equal(existsSync(outDir), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('buildArt writes drawings and removes SVGs whose drawing is gone', async () => {
	const { root, drawingsDir, outDir } = await scratch({
		'landmark/tiny.js': TWO_BY_TWO,
	});
	try {
		await mkdir(join(outDir, 'tech'), { recursive: true });
		await writeFile(join(outDir, 'tech/stale.svg'), '<svg/>');
		const assets = [{ id: 'landmark/tiny', kind: 'icon' }];
		const result = await buildArt({
			drawingsDir,
			outDir,
			assets: /** @type {any} */ (assets),
		});
		assert.deepEqual(result, {
			written: ['landmark/tiny'],
			removed: ['tech/stale'],
		});
		assert.equal(
			await readFile(join(outDir, 'landmark/tiny.svg'), 'utf8'),
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2" shape-rendering="crispEdges"><path fill="#aa0000" d="M0 0h1v1h-1z"/><path fill="#0000bb" d="M1 1h1v1h-1z"/></svg>'
		);
		assert.equal(existsSync(join(outDir, 'tech/stale.svg')), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('buildArt refuses an illustration that is not 64×64', async () => {
	const { root, drawingsDir, outDir } = await scratch({
		'tapestry/tiny.js': TWO_BY_TWO,
	});
	try {
		const assets = [{ id: 'tapestry/tiny', kind: 'illustration' }];
		await assert.rejects(
			buildArt({
				drawingsDir,
				outDir,
				assets: /** @type {any} */ (assets),
			}),
			/tapestry\/tiny: an illustration must be 64×64, not 2×2/
		);
		assert.equal(existsSync(outDir), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('buildArt refuses a territory picture that is not a 64×56 hex', async () => {
	for (const id of ['territory-tile/9', 'hex/forest']) {
		const { root, drawingsDir, outDir } = await scratch({
			[`${id}.js`]: filledDrawing(64, 64),
		});
		try {
			const [group] = id.split('/');
			const assets = [{ id, kind: 'board', group }];
			await assert.rejects(
				buildArt({
					drawingsDir,
					outDir,
					assets: /** @type {any} */ (assets),
				}),
				new RegExp(
					`${id}: a territory picture must be 64×56, not 64×64`
				)
			);
			assert.equal(existsSync(outDir), false);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	}
});

test('buildArt takes the hex overlays and the boards at their own sizes', async () => {
	const { root, drawingsDir, outDir } = await scratch({
		'hex/cloud.js': filledDrawing(22, 12),
		'board/map-small.js': filledDrawing(352, 392),
		'hex/sea.js': filledDrawing(64, 56),
	});
	try {
		const assets = [
			{ id: 'hex/cloud', kind: 'board', group: 'hex' },
			{ id: 'board/map-small', kind: 'board', group: 'board' },
			{ id: 'hex/sea', kind: 'board', group: 'hex' },
		];
		const { written } = await buildArt({
			drawingsDir,
			outDir,
			assets: /** @type {any} */ (assets),
		});
		assert.deepEqual(written.sort(), [
			'board/map-small',
			'hex/cloud',
			'hex/sea',
		]);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

/**
 * Returns a drawing module whose draw() fills a w×h canvas, leaving the listed pixel indexes empty.
 * @param {number} w
 * @param {number} h
 * @param {number[]} [holes]
 */
function filledDrawing(w, h, holes = []) {
	return `export function draw() {
	const p = new Array(${w * h}).fill('#aa0000');
	for (const i of ${JSON.stringify(holes)}) { p[i] = null; }
	return { w: ${w}, h: ${h}, p };
}
`;
}

/** A landmark asset for a synthetic catalog. */
const landmark = (/** @type {string} */ slug) => ({
	id: `landmark/${slug}`,
	kind: 'illustration',
	group: 'landmark',
});

test('buildArt refuses a landmark picture that does not match its footprint', async () => {
	// A 64×64 Forge picture (2×2 plots at 32 pixels) with one empty pixel in its top-left plot.
	const { root, drawingsDir, outDir } = await scratch({
		'landmark/forge.js': filledDrawing(64, 64, [0]),
	});
	try {
		await assert.rejects(
			buildArt({
				drawingsDir,
				outDir,
				assets: /** @type {any} */ ([landmark('forge')]),
			}),
			/landmark\/forge: the picture doesn't match its footprint: plot \(0, 0\) is in the footprint but pixel \(0, 0\) is empty/
		);
		assert.equal(existsSync(outDir), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('buildArt takes a landmark picture in its footprint shape, whatever its size', async () => {
	// The Launch Pad is 3×2 plots, so its picture is 96×64, not the 64×64 of other illustrations.
	const { root, drawingsDir, outDir } = await scratch({
		'landmark/launch-pad.js': filledDrawing(96, 64),
	});
	try {
		const result = await buildArt({
			drawingsDir,
			outDir,
			assets: /** @type {any} */ ([landmark('launch-pad')]),
		});
		assert.deepEqual(result.written, ['landmark/launch-pad']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('buildArt refuses a landmark picture with no footprint', async () => {
	const { root, drawingsDir, outDir } = await scratch({
		'landmark/nowhere.js': filledDrawing(64, 64),
	});
	try {
		await assert.rejects(
			buildArt({
				drawingsDir,
				outDir,
				assets: /** @type {any} */ ([landmark('nowhere')]),
			}),
			/landmark\/nowhere: no footprint for this landmark/
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('a drawing saved with another extension is refused, not skipped', async () => {
	const { root, drawingsDir } = await scratch({
		'landmark/tiny.js': TWO_BY_TWO,
		'tech/bakery.mjs': TWO_BY_TWO,
		'.DS_Store': '',
	});
	try {
		await assert.rejects(
			listDrawingIds(drawingsDir),
			/tech\/bakery\.mjs: drawings must be \.js files/
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('listDrawingIds ignores hidden files and folders', async () => {
	const { root, drawingsDir } = await scratch({
		'landmark/tiny.js': TWO_BY_TWO,
		'.DS_Store': '',
		'landmark/.DS_Store': '',
	});
	try {
		assert.deepEqual(await listDrawingIds(drawingsDir), ['landmark/tiny']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('renderAsset explains a drawing without draw()', async () => {
	const { root, drawingsDir } = await scratch({
		'landmark/empty.js': 'export const nope = 1;\n',
		'landmark/broken.js': 'export function draw() { return 42; }\n',
	});
	try {
		await assert.rejects(
			renderAsset('landmark/empty', drawingsDir),
			/landmark\/empty: a drawing must export a draw\(\) function/
		);
		await assert.rejects(
			renderAsset('landmark/broken', drawingsDir),
			/landmark\/broken: a drawing must export a draw\(\) function that returns a canvas/
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the build copies the Lighthouse into public/art', async () => {
	const built = new URL(
		'../public/art/landmark/lighthouse.svg',
		import.meta.url
	);
	assert.equal(
		await readFile(built, 'utf8'),
		await readFile(join(OUT_DIR, 'landmark/lighthouse.svg'), 'utf8')
	);
});
