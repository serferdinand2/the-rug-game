// The reviewed artwork must keep its pixel colors, transparency and player masks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fromSvg, toSvg } from '../art/painter.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ASSETS } from '../src/lib/art/catalog.js';
import { listDrawingIds, renderAsset } from '../art/build.mjs';

test('the six full base mats are explicitly marked as example compositions', () => {
	assert.deepEqual(
		ASSETS.filter((asset) => asset.example)
			.map((asset) => asset.id)
			.sort(),
		[
			'desert',
			'forest',
			'grassland',
			'mountain',
			'tropical',
			'wetland',
		].map((biome) => `capital-mat/${biome}`)
	);
});

test('SVG round trips retain different alpha values for the same color', () => {
	const svg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 1" shape-rendering="crispEdges"><path fill="#000000" d="M0 0h1v1h-1z"/><path fill="#000000" fill-opacity="0.5" d="M1 0h1v1h-1z"/></svg>';
	assert.equal(toSvg(fromSvg(svg)), svg);
});

test('all 127 released SVGs match the reviewed artwork and have stable catalog ids', async () => {
	const manifest = JSON.parse(
		await readFile(
			new URL('../docs/art/approved-assets.json', import.meta.url),
			'utf8'
		)
	);
	assert.equal(manifest.length, 127);
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

test('the five colored pieces change only the neutral interior channel', async () => {
	const colors = {
		blue: '#4ea1d3',
		red: '#e06a55',
		green: '#64ae67',
		yellow: '#e1b84d',
		purple: '#b07fd0',
	};
	for (const piece of ['token', 'outpost', 'outpost-toppled']) {
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

test('placeholder dice, terrain hex markers and game symbols are not released as drawings', async () => {
	const ids = await listDrawingIds();
	assert.ok(!ids.some((id) => /^(die|terrain|symbol)\//.test(id)));
});

test('each biome has six distinct impassable capital terrain variants', async () => {
	for (const biome of [
		'mountain',
		'wetland',
		'tropical',
		'desert',
		'grassland',
		'forest',
	]) {
		const variants = await Promise.all(
			Array.from({ length: 6 }, (_, index) =>
				renderAsset(
					`capital-terrain/${biome}-blocked-${String(index + 1).padStart(2, '0')}`
				)
			)
		);
		assert.equal(new Set(variants).size, 6, biome);
	}
});
