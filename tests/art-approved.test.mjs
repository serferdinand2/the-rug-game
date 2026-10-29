// The reviewed artwork must keep its pixel colors, transparency and player masks.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fromSvg, toSvg } from '../tools/art/painter.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ASSETS } from '../src/lib/art/catalog.js';
import { listDrawingIds, renderAsset } from '../tools/art/build.mjs';

test('the 12 advanced capital mats and the two map boards are explicitly marked as example compositions', () => {
	assert.deepEqual(
		ASSETS.filter((asset) => asset.example)
			.map((asset) => asset.id)
			.sort(),
		[
			...ASSETS.filter((asset) => asset.group === 'capital-mat').map(
				(asset) => asset.id
			),
			'board/map-large',
			'board/map-small',
		].sort()
	);
	assert.equal(
		ASSETS.filter((asset) => asset.group === 'capital-mat').length,
		12
	);
});

test('SVG round trips retain different alpha values for the same color', () => {
	const svg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 1" shape-rendering="crispEdges"><path fill="#000000" d="M0 0h1v1h-1z"/><path fill="#000000" fill-opacity="0.5" d="M1 0h1v1h-1z"/></svg>';
	assert.equal(toSvg(fromSvg(svg)), svg);
});

test('all 150 released SVGs match the reviewed artwork and have stable catalog ids', async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL('../docs/art/approved-assets.json', import.meta.url),
			'utf8'
		)
	);
	assert.equal(manifest.length, 150);
	for (const { id, width, height, sha256 } of manifest) {
		assert.ok(
			ASSETS.some((asset) => asset.id === id),
			id
		);
		const svg = await renderAsset(id);
		const canvas = fromSvg(svg);
		assert.deepEqual([canvas.w, canvas.h], [width, height], id);
		assert.equal(
			createHash('sha256').update(svg).digest('hex'),
			sha256,
			id
		);
		assert.doesNotMatch(
			svg,
			/<image|data:image|<script|https?:\/\/(?!www.w3.org)/,
			id
		);
	}
});

test("the owner approved the map's 2.5D terrain (#134): its hexes, the 48 territory tiles and both boards are pinned", async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL('../docs/art/approved-assets.json', import.meta.url),
			'utf8'
		)
	);
	const ids = new Set(
		manifest.map((/** @type {{ id: string }} */ e) => e.id)
	);
	const map = [
		...['sea', 'desert', 'forest', 'grassland', 'mountain'].map(
			(t) => `hex/${t}`
		),
		...Array.from({ length: 48 }, (_, i) => `territory-tile/${i + 1}`),
		'board/map-large',
		'board/map-small',
	];
	for (const id of map) {
		assert.ok(ids.has(id), id);
	}
});

test('the five colored pieces change only the neutral interior channel', async () => {
	const colors = {
		blue: '#4ea1d3',
		red: '#e06a55',
		green: '#64ae67',
		yellow: '#e1b84d',
		purple: '#b07fd0',
	};
	for (const piece of ['outpost', 'outpost-toppled']) {
		const base = fromSvg(await renderAsset(`piece/${piece}`));
		assert.ok(base.p.includes('#b3afc2'));
		assert.ok(base.p.includes(null));
		for (const [name, color] of Object.entries(colors)) {
			const variant = fromSvg(
				await renderAsset(`piece/${piece}-${name}`)
			);
			assert.deepEqual(
				variant.p,
				base.p.map((pixel) => (pixel === '#b3afc2' ? color : pixel)),
				`${piece}/${name}`
			);
			assert.deepEqual(variant.alpha, base.alpha);
		}
	}
	const token = fromSvg(await renderAsset('piece/token'));
	assert.equal(
		token.p[0],
		null,
		'the outside of the token stays transparent'
	);
	assert.equal(
		token.p[16 * 32 + 16],
		'#b3afc2',
		'the enclosed interior is gray'
	);
});

test('dice faces remain placeholders, while approved track symbols and tray bodies have drawings (#85)', async () => {
	const ids = await listDrawingIds();
	const bodies = ['die/science-body', 'die/red-body', 'die/black-body'];
	assert.ok(!ids.some((id) => id.startsWith('die/') && !bodies.includes(id)));
	assert.ok(ids.includes('symbol/territory-tile'));
	for (const body of bodies) {
		assert.ok(ids.includes(body), body);
	}
});

test('each base biome has eight distinct buildable capital terrain variants', async () => {
	for (const biome of [
		'mountain',
		'wetland',
		'tropical',
		'desert',
		'grassland',
		'forest',
	]) {
		const variants = await Promise.all(
			Array.from({ length: 8 }, (_, index) =>
				renderAsset(
					`capital-terrain/${biome}-open-${String(index + 1).padStart(2, '0')}`
				)
			)
		);
		assert.equal(new Set(variants).size, 8, biome);
	}
});
