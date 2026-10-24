// Issue #5 icons: compact symbols are 24px; income buildings are detailed 32px sprites.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ASSETS } from '../src/lib/art/catalog.js';
import { drawingCanvas } from '../art/gallery.js';

const ICONS = ASSETS.filter(
	(asset) => asset.issue === 5 && asset.kind === 'icon'
);

test('issue #5 catalogs all 42 icons', () => {
	assert.equal(ICONS.length, 42);
	assert.deepEqual(
		Object.fromEntries(
			[
				'resource',
				'building',
				'piece',
				'die',
				'terrain',
				'track',
				'symbol',
			].map((group) => [
				group,
				ICONS.filter((asset) => asset.group === group).length,
			])
		),
		{
			resource: 5,
			building: 4,
			piece: 3,
			die: 15,
			terrain: 5,
			track: 5,
			symbol: 5,
		}
	);
});

test('every issue #5 icon has a non-empty drawing at its intended size', async () => {
	for (const asset of ICONS) {
		const url = new URL(`../art/drawings/${asset.id}.js`, import.meta.url);
		const source = await readFile(url, 'utf8');
		const drawing = await import(url.href);
		const canvas = drawingCanvas(asset.id, drawing);
		const size =
			asset.group === 'building' ||
			asset.group === 'resource' ||
			asset.group === 'track'
				? 32
				: asset.id === 'piece/outpost' ||
					  asset.id === 'piece/outpost-toppled'
					? 128
					: 24;
		assert.deepEqual([canvas.w, canvas.h], [size, size], asset.id);
		assert.ok(
			canvas.p.some((pixel) => pixel !== null),
			`${asset.id} is blank`
		);
		assert.match(source, /export function draw\(\)/, asset.id);
	}
});

test('outpost flags use a player color channel and distinct upright/fallen poses', async () => {
	const { PLAYER_OUTPOST_CHANNEL } = await import('../art/parts/outpost.js');
	const upright = await import('../art/drawings/piece/outpost.js');
	const fallen = await import('../art/drawings/piece/outpost-toppled.js');
	const uprightCanvas = drawingCanvas('piece/outpost', upright);
	const fallenCanvas = drawingCanvas('piece/outpost-toppled', fallen);
	assert.ok(uprightCanvas.p.includes(PLAYER_OUTPOST_CHANNEL));
	assert.ok(fallenCanvas.p.includes(PLAYER_OUTPOST_CHANNEL));
	assert.notDeepEqual(uprightCanvas.p, fallenCanvas.p);
	const rotated = new Array(128 * 128).fill(null);
	for (let y = 0; y < 128; y++) {
		for (let x = 0; x < 128; x++) {
			rotated[x * 128 + (127 - y)] = uprightCanvas.p[y * 128 + x];
		}
	}
	assert.deepEqual(
		fallenCanvas.p,
		rotated,
		'toppled pose is the same flag turned onto its side'
	);
});

test('resource symbols are 32×32 and food is four-way symmetric', async () => {
	for (const id of ['coin', 'worker', 'food', 'culture', 'any']) {
		const drawing = await import(`../art/drawings/resource/${id}.js`);
		const canvas = drawingCanvas(`resource/${id}`, drawing);
		assert.deepEqual([canvas.w, canvas.h], [32, 32], id);
		if (id === 'food') {
			for (let y = 0; y < 32; y++) {
				for (let x = 0; x < 32; x++) {
					assert.equal(
						canvas.p[y * 32 + x],
						canvas.p[x * 32 + (31 - y)],
						`food differs under quarter-turn at ${x},${y}`
					);
				}
			}
		}
	}
});

test('track symbols are distinct 32×32 drawings in their track colors', async () => {
	const { PALETTE } = await import('../art/palette.js');
	const colors = {
		exploration: PALETTE.teal,
		science: PALETTE.grass,
		technology: PALETTE.gold,
		military: PALETTE.brickRed,
		arts: PALETTE.arcane,
	};
	const signatures = new Set();
	for (const [name, color] of Object.entries(colors)) {
		const drawing = await import(`../art/drawings/track/${name}.js`);
		const canvas = drawingCanvas(`track/${name}`, drawing);
		assert.deepEqual([canvas.w, canvas.h], [32, 32], name);
		assert.ok(
			canvas.p.includes(color),
			`${name} is missing its reserved color`
		);
		const signature = canvas.p.join(',');
		assert.ok(
			!signatures.has(signature),
			`${name} duplicates another track symbol`
		);
		signatures.add(signature);
	}
});

test('income buildings are four distinct 32×32 palette drawings', async () => {
	const buildings = ICONS.filter((asset) => asset.group === 'building');
	assert.equal(buildings.length, 4);
	const { PALETTE } = await import('../art/palette.js');
	const { INCOME_BUILDING_PALETTES } =
		await import('../art/parts/income-building.js');
	const palette = new Set([
		...Object.values(PALETTE),
		...Object.values(INCOME_BUILDING_PALETTES).flat(),
	]);
	const signatures = new Set();
	for (const asset of buildings) {
		const drawing = await import(`../art/drawings/${asset.id}.js`);
		const canvas = drawingCanvas(asset.id, drawing);
		assert.deepEqual([canvas.w, canvas.h], [32, 32], asset.id);
		assert.ok(
			canvas.p.every((pixel) => pixel === null || palette.has(pixel))
		);
		const signature = canvas.p.join(',');
		assert.ok(
			!signatures.has(signature),
			`${asset.id} duplicates another income building`
		);
		signatures.add(signature);
	}
});
