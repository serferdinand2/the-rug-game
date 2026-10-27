// The art on the library page: every scene part and every catalog asset, drawn or not, grouped as the owner reviews them.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { ASSETS, GROUPS, EXPANSIONS } from '../src/lib/art/catalog.js';
import { FOOTPRINTS, PLOT_SIZE } from '../src/lib/art/footprints.js';
import { listDrawingIds } from '../tools/art/build.mjs';
import {
	PART_SAMPLES,
	drawingCanvas,
	gallerySections,
} from '../tools/art/gallery.js';

const drawn = new Set(await listDrawingIds());
const sections = gallerySections(ASSETS, drawn);
const tiles = sections.flatMap((section) =>
	section.lists.flatMap((list) => list.tiles)
);

/**
 * A made-up landmark asset.
 * @param {string} slug
 */
const landmark = (slug) =>
	/** @type {import('../src/lib/art/catalog.js').Asset} */ ({
		id: `landmark/${slug}`,
		name: slug,
		kind: 'illustration',
		group: 'landmark',
		expansion: 'base',
		issue: 7,
	});

test('the scene parts are shown one sample each, on 64×64 canvases', () => {
	assert.deepEqual(
		PART_SAMPLES.map((sample) => sample.label),
		[
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
			'ship',
			'interior: plaster',
			'interior: stone',
			'interior: panel',
			'banner: flag',
			'banner: hanging',
			'crowd',
			'wheel',
		]
	);
	for (const sample of PART_SAMPLES) {
		const canvas = sample.draw();
		assert.equal(`${canvas.w}×${canvas.h}`, '64×64', sample.label);
	}
});

test('every catalog asset is shown exactly once', () => {
	assert.deepEqual(
		tiles.map((tile) => tile.asset.id).sort(),
		ASSETS.map((asset) => asset.id).sort()
	);
});

test('the groups come in catalog order with their total and drawn counts', () => {
	assert.deepEqual(
		sections.map((section) => section.id),
		GROUPS.map((group) => group.id)
	);
	const landmarks = sections.find((section) => section.id === 'landmark');
	assert.equal(landmarks?.label, 'Landmarks');
	assert.equal(landmarks?.total, 33);
	const territory = sections.find((s) => s.id === 'territory-tile');
	assert.equal(territory?.total, 48);
	const [small] = gallerySections(
		[landmark('drawn'), landmark('waiting')],
		new Set(['landmark/drawn'])
	).filter((section) => section.total > 0);
	assert.equal(small.total, 2);
	assert.equal(small.drawn, 1);
});

test('a tile knows whether its asset is drawn and which issue draws it', () => {
	// Its own drawn set, so the test holds as more art lands.
	const own = gallerySections(
		ASSETS,
		new Set(['landmark/lighthouse'])
	).flatMap((section) => section.lists.flatMap((list) => list.tiles));
	const lighthouse = own.find((t) => t.asset.id === 'landmark/lighthouse');
	assert.equal(lighthouse?.drawn, true);
	const ageOfSail = own.find((t) => t.asset.id === 'tapestry/age-of-sail');
	assert.equal(ageOfSail?.drawn, false);
	assert.equal(ageOfSail?.asset.issue, 9);
	assert.equal(ageOfSail?.asset.name, 'Age of Sail');
});

test('a section names every issue that draws its assets', () => {
	const issues = new Map(
		sections.map((section) => [section.id, section.issues])
	);
	assert.deepEqual(issues.get('tapestry'), [9]);
	assert.deepEqual(issues.get('board'), [6, 51]);
});

test('landmarks sit on their plot grid, 32 pixels per plot', () => {
	assert.equal(PLOT_SIZE, 32);
	for (const tile of tiles) {
		assert.equal(
			tile.plots,
			tile.asset.group === 'landmark' ? PLOT_SIZE : null,
			tile.asset.id
		);
	}
});

test('other groups are split by expansion, in the catalog order', () => {
	const tapestry = sections.find((section) => section.id === 'tapestry');
	const order = EXPANSIONS.map((expansion) => expansion.name);
	const names = tapestry?.lists.map((list) => list.expansion) ?? [];
	assert.ok(names.length > 1);
	assert.deepEqual(
		names,
		order.filter((name) => names.includes(name))
	);
	for (const list of tapestry?.lists ?? []) {
		assert.ok(list.tiles.length > 0);
		assert.ok(list.tiles.every((tile) => !tile.showExpansion));
	}
});

test('landmarks are one list from the largest footprint to the smallest', () => {
	const section = sections.find((s) => s.id === 'landmark');
	assert.equal(section?.lists.length, 1);
	assert.equal(section?.lists[0].expansion, null);
	const slugs =
		section?.lists[0].tiles.map((tile) => tile.asset.id.split('/')[1]) ??
		[];
	assert.equal(slugs.length, 33);
	const plots = slugs.map(
		(slug) => FOOTPRINTS[slug].join('').split('X').length - 1
	);
	assert.deepEqual(
		plots,
		[...plots].sort((a, b) => b - a)
	);
	assert.ok(section?.lists[0].tiles.every((tile) => tile.showExpansion));
});

test('a drawing must export draw() returning a whole canvas', () => {
	const canvas = { w: 2, h: 1, p: ['#aa0000', null] };
	assert.equal(drawingCanvas('landmark/ok', { draw: () => canvas }), canvas);
	for (const broken of [
		{},
		{ draw: () => null },
		{ draw: () => ({ w: 2, h: 2, p: [null] }) },
	]) {
		assert.throws(
			() => drawingCanvas('landmark/broken', broken),
			/landmark\/broken: a drawing must export a draw\(\) function that returns a canvas/
		);
	}
});
