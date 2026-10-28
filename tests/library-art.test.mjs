// The art on the library page (#82): each picture is drawn only when a tile asks for it, once, in a slice of its own.
import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listDrawingIds } from '../tools/art/build.mjs';

/** How many canvases the art toolkit has made, so a test can tell whether anything was drawn. */
const made = vi.hoisted(() => ({ canvases: 0 }));

vi.mock(import('../tools/art/painter.js'), async (importOriginal) => {
	const painter = await importOriginal();
	return {
		...painter,
		createCanvas: (/** @type {number} */ w, /** @type {number} */ h) => {
			made.canvases += 1;
			return painter.createCanvas(w, h);
		},
	};
});

// One drawing broken on purpose: a drawing that throws must not take the page down.
vi.mock(import('../tools/art/drawings/building/farm.js'), () => ({
	draw() {
		throw new Error('the farm is broken');
	},
}));

const before = made.canvases;
const art = await import('../src/library/art.js');
const madeOnImport = made.canvases - before;
const { inSlice } = await import('../src/library/slices.js');

const drawingIds = await listDrawingIds();

/**
 * The committed SVG that npm run art drew for an asset.
 * @param {string} id
 * @returns {string}
 */
function committedSvg(id) {
	return readFileSync(
		new URL(`../static/art/${id}.svg`, import.meta.url),
		'utf8'
	);
}

/**
 * The SVG inside a picture's data URL.
 * @param {import('../src/library/art.js').Picture} picture
 * @returns {string}
 */
function svgOf(picture) {
	assert.ok('url' in picture, `not drawn: ${JSON.stringify(picture)}`);
	const prefix = 'data:image/svg+xml,';
	assert.ok(picture.url.startsWith(prefix), picture.url.slice(0, 40));
	return decodeURIComponent(picture.url.slice(prefix.length));
}

test('importing the library art draws nothing, yet it knows which assets are drawn (#82)', () => {
	assert.equal(madeOnImport, 0, `${madeOnImport} canvases made on import`);
	const drawn = new Set(drawingIds);
	for (const section of art.ART_SECTIONS) {
		const tiles = section.lists.flatMap((list) => list.tiles);
		assert.equal(
			section.drawn,
			tiles.filter((tile) => drawn.has(tile.asset.id)).length,
			section.id
		);
		for (const tile of tiles) {
			assert.equal(tile.drawn, drawn.has(tile.asset.id), tile.asset.id);
		}
	}
	assert.ok(
		art.ART_SECTIONS.some((section) => section.drawn > 0),
		'some sections have drawings'
	);
});

test('a picture is drawn when it is asked for: the Lighthouse, 64×64, as npm run art draws it (#82)', async () => {
	const picture = await art.loadPicture('landmark/lighthouse');
	assert.equal(svgOf(picture), committedSvg('landmark/lighthouse'));
	assert.deepEqual(
		{
			w: 'w' in picture && picture.w,
			h: 'h' in picture && picture.h,
		},
		{ w: 64, h: 64 }
	);
});

test('a picture asked for twice is drawn once: the same promise (#82)', async () => {
	const first = art.loadPicture('tech/vaccines');
	assert.equal(art.loadPicture('tech/vaccines'), first);
	const picture = await first;
	const drawn = made.canvases;
	assert.equal(await art.loadPicture('tech/vaccines'), picture);
	assert.equal(made.canvases, drawn, 'nothing drawn the second time');
});

test("a capital relief is shown as its preview on the mat's ground, 296×296 (#82)", async () => {
	const { CAPITAL_GRIDS } =
		await import('../tools/art/parts/capital-terrain.js');
	const { drawReliefPreview } =
		await import('../tools/art/parts/capital-relief/index.js');
	const { toSvg } = await import('../tools/art/painter.js');
	const picture = await art.loadPicture('capital-relief/mountain');
	assert.equal(
		svgOf(picture),
		toSvg(drawReliefPreview(CAPITAL_GRIDS.mountain, 'mountain'))
	);
	assert.ok('w' in picture);
	assert.deepEqual({ w: picture.w, h: picture.h }, { w: 296, h: 296 });
});

test('a drawing that throws, or an id with no drawing, gives its error and never rejects (#82)', async () => {
	assert.deepEqual(await art.loadPicture('building/farm'), {
		error: 'the farm is broken',
	});
	const missing = await art.loadPicture('landmark/no-such-landmark');
	assert.ok('error' in missing, JSON.stringify(missing));
	assert.match(missing.error, /landmark\/no-such-landmark/);
});

test('the scene parts and the relief specimens draw only when asked, once each (#82)', async () => {
	const { PART_SAMPLES } = await import('../tools/art/gallery.js');
	const { RELIEF_BIOMES } = await import('../src/lib/art/relief.js');
	assert.deepEqual(
		art.PARTS.map((part) => part.label),
		PART_SAMPLES.map((sample) => sample.label)
	);
	assert.equal(art.RELIEF_SPECIMENS.length, RELIEF_BIOMES.length);

	const [part] = art.PARTS;
	assert.equal(part.load(), part.load());
	const sky = await part.load();
	assert.ok('w' in sky);
	assert.deepEqual({ w: sky.w, h: sky.h }, part.size);
	assert.deepEqual(part.size, { w: 64, h: 64 });

	const [specimen] = art.RELIEF_SPECIMENS;
	assert.equal(specimen.load(), specimen.load());
	const relief = await specimen.load();
	assert.ok('w' in relief, JSON.stringify(relief));
	assert.deepEqual({ w: relief.w, h: relief.h }, specimen.size);
	assert.deepEqual(specimen.size, { w: 296, h: 296 });
});

test('every picture has a placeholder its size before it is drawn, as npm run art draws it (#82)', () => {
	assert.deepEqual(art.pictureSize('landmark/lighthouse'), { w: 64, h: 64 });
	assert.deepEqual(art.pictureSize('landmark/academy'), { w: 128, h: 64 });
	assert.deepEqual(art.pictureSize('capital-relief/mountain'), {
		w: 296,
		h: 296,
	});
	assert.deepEqual(art.pictureSize('tapestry/academia'), { w: 64, h: 64 });
	// The capital art is sized by its plots, so the sections above the reliefs keep their room too.
	assert.deepEqual(art.pictureSize('capital-terrain/mountain-open-01'), {
		w: 32,
		h: 32,
	});
	assert.deepEqual(art.pictureSize('capital-mat/mountain'), {
		w: 296,
		h: 296,
	});
	assert.deepEqual(art.pictureSize('capital-mat/archipelago'), {
		w: 288,
		h: 352,
	});
	// An advanced mat's relief, still to be drawn, will be its mat's size, as npm run art requires.
	assert.deepEqual(art.pictureSize('capital-relief/mesa'), {
		w: 296,
		h: 296,
	});
	// The map boards and the hex overlays are sized from the map and the overlays' data.
	assert.deepEqual(art.pictureSize('board/map-large'), { w: 448, h: 504 });
	assert.deepEqual(art.pictureSize('board/map-small'), { w: 352, h: 364 });
	assert.deepEqual(art.pictureSize('hex/cloud'), { w: 22, h: 12 });
	assert.deepEqual(art.pictureSize('hex/volcano'), { w: 17, h: 17 });
	// The icons keep their native sizes.
	for (const [id, w, h] of [
		['resource-24/coin', 24, 24],
		['resource-48/coin', 48, 48],
		['terrain/sea', 24, 24],
		['building/farm', 32, 32],
		['die/red-body', 32, 32],
		['track/arts', 32, 32],
		['piece/token', 32, 32],
		['piece/architects-cube', 32, 32],
		['piece/outpost-red', 128, 128],
		['inspiration-tile/farms', 192, 32],
	]) {
		assert.deepEqual(art.pictureSize(id), { w, h }, id);
	}
	assert.equal(art.pictureSize('nothing/at-all'), null);

	// Every drawing has its room before it is drawn, so no section moves when the art above it lands.
	for (const id of drawingIds) {
		const size = art.pictureSize(id);
		assert.ok(
			size,
			`${id}: give it a size in pictureSize (src/library/art.js), so its placeholder takes its room`
		);
		const viewBox = committedSvg(id).match(/viewBox="0 0 (\d+) (\d+)"/);
		assert.ok(viewBox, id);
		assert.deepEqual(
			size,
			{ w: Number(viewBox[1]), h: Number(viewBox[2]) },
			id
		);
	}
});

test('the drawing runs one task per slice, in order, yielding to the browser between them (#82)', async () => {
	/** @type {string[]} */
	const ran = [];
	const first = inSlice(() => ran.push('first'));
	const second = inSlice(() => ran.push('second'));
	assert.deepEqual(ran, [], 'nothing runs at once');
	await first;
	assert.deepEqual(ran, ['first'], 'the second waits for its own slice');
	await second;
	assert.deepEqual(ran, ['first', 'second']);
});

test('a task that throws in its slice rejects only its own promise (#82)', async () => {
	const broken = inSlice(() => {
		throw new Error('broken');
	});
	const next = inSlice(() => 'drawn');
	await assert.rejects(broken, /broken/);
	assert.equal(await next, 'drawn');
});
