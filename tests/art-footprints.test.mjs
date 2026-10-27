// Landmark footprints: the plots each landmark covers, and the check that a landmark's picture covers exactly those.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { ASSETS } from '../src/lib/art/catalog.js';
import {
	PLOT_SIZE,
	FOOTPRINTS,
	footprintMismatches,
	clipToFootprint,
} from '../src/lib/art/footprints.js';
import { draw as drawLighthouse } from '../art/drawings/landmark/lighthouse.js';

/** Plot counts from the landmarks design §6.1 (02 §5, 03 §1.6, 03 §2.10, R63, R65). */
const EXPECTED_PLOTS = {
	lighthouse: 4,
	'train-station': 9,
	'launch-pad': 6,
	apothecary: 4,
	academy: 8,
	laboratory: 6,
	forge: 4,
	'rubber-works': 12,
	'tech-hub': 6,
	barracks: 4,
	'tank-factory': 9,
	'fusion-reactor': 8,
	bakery: 4,
	barn: 9,
	'com-tower': 6,
	library: 8,
	'stock-market': 4,
	treasury: 4,
	'digital-studio': 6,
	'game-store': 6,
	skyscraper: 9,
	'tv-station': 8,
	'urban-farm': 8,
	stadium: 8,
	monolith: 4,
	villa: 7,
	'birdwatching-perch': 6,
	castle: 12,
	windmill: 6,
	bridge: 8,
	'clock-tower': 4,
	'opera-house': 5,
	holocenter: 10,
};

const RED = '#aa0000';

/**
 * Builds a canvas that paints exactly the occupied plots of some rows.
 * @param {string[]} rows
 */
function exactPiece(rows) {
	const w = rows[0].length * PLOT_SIZE;
	const h = rows.length * PLOT_SIZE;
	const p = new Array(w * h).fill(null);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (
				rows[Math.floor(y / PLOT_SIZE)][Math.floor(x / PLOT_SIZE)] ===
				'X'
			) {
				p[y * w + x] = RED;
			}
		}
	}
	return { w, h, p };
}

test('there is one footprint per landmark', () => {
	const slugs = ASSETS.filter((asset) => asset.group === 'landmark').map(
		(asset) => asset.id.split('/')[1]
	);
	assert.deepEqual(Object.keys(FOOTPRINTS).sort(), slugs.sort());
});

test('footprint rows are even and use only X and .', () => {
	for (const [slug, rows] of Object.entries(FOOTPRINTS)) {
		assert.ok(rows.length > 0, slug);
		for (const row of rows) {
			assert.equal(row.length, rows[0].length, slug);
			assert.match(row, /^[X.]+$/, slug);
		}
	}
});

test('no footprint has an empty edge row or column', () => {
	for (const [slug, rows] of Object.entries(FOOTPRINTS)) {
		const last = rows[0].length - 1;
		assert.ok(rows[0].includes('X'), `${slug}: top row`);
		assert.ok(rows[rows.length - 1].includes('X'), `${slug}: bottom row`);
		assert.ok(
			rows.some((row) => row[0] === 'X'),
			`${slug}: left column`
		);
		assert.ok(
			rows.some((row) => row[last] === 'X'),
			`${slug}: right column`
		);
	}
});

test('each landmark covers the agreed number of plots', () => {
	const counts = Object.fromEntries(
		Object.entries(FOOTPRINTS).map(([slug, rows]) => [
			slug,
			rows.join('').split('X').length - 1,
		])
	);
	assert.deepEqual(counts, EXPECTED_PLOTS);
});

test('the corrected A&A footprints are used, not their mirror images', () => {
	assert.deepEqual([...FOOTPRINTS.villa], ['X..', 'XXX', 'XXX']);
	assert.deepEqual([...FOOTPRINTS['birdwatching-perch']], ['.XXX', 'XXX.']);
	assert.deepEqual([...FOOTPRINTS.castle], ['.XXX', 'XXXX', '.XXX', '.XX.']);
});

test('footprintMismatches accepts an exact piece', () => {
	assert.deepEqual(
		footprintMismatches(exactPiece(['XX', 'XX']), ['XX', 'XX']),
		[]
	);
	const corner = ['.XX', 'XXX', 'XXX'];
	assert.deepEqual(footprintMismatches(exactPiece(corner), corner), []);
});

test('footprintMismatches reports a transposed canvas', () => {
	const sideways = exactPiece(['XX', 'XX', 'XX']);
	assert.deepEqual(footprintMismatches(sideways, ['XXX', 'XXX']), [
		'canvas is 64×96, expected 96×64',
	]);
});

test('footprintMismatches reports a hole in the footprint', () => {
	const piece = exactPiece(['XX', 'XX']);
	piece.p[3 * piece.w + 40] = null;
	assert.deepEqual(footprintMismatches(piece, ['XX', 'XX']), [
		'plot (1, 0) is in the footprint but pixel (40, 3) is empty',
	]);
});

test('footprintMismatches reports paint outside the footprint', () => {
	const rows = ['.X', 'XX'];
	const piece = exactPiece(rows);
	piece.p[5 * piece.w + 2] = RED;
	assert.deepEqual(footprintMismatches(piece, rows), [
		'plot (0, 0) is outside the footprint but pixel (2, 5) is filled',
	]);
});

test('footprintMismatches reports only the first bad pixel of each plot', () => {
	const piece = exactPiece(['XX', 'XX']);
	piece.p[0] = null;
	piece.p[1] = null;
	piece.p[40 * piece.w + 40] = null;
	assert.deepEqual(footprintMismatches(piece, ['XX', 'XX']), [
		'plot (0, 0) is in the footprint but pixel (0, 0) is empty',
		'plot (1, 1) is in the footprint but pixel (40, 40) is empty',
	]);
});

test('clipToFootprint empties exactly the plots outside the footprint', () => {
	const rows = ['..XX', '..XX', 'XXXX', 'XXXX'];
	const w = 4 * PLOT_SIZE;
	const piece = { w, h: w, p: new Array(w * w).fill(RED) };
	clipToFootprint(piece, rows);
	assert.deepEqual(footprintMismatches(piece, rows), []);
	assert.equal(piece.p[0], null);
	assert.equal(piece.p[2 * PLOT_SIZE], RED);
});

test('pictures use 32 pixels per plot, so the approved 2×2 Lighthouse fits its footprint exactly', () => {
	assert.deepEqual(
		footprintMismatches(drawLighthouse(), FOOTPRINTS.lighthouse),
		[]
	);
});
