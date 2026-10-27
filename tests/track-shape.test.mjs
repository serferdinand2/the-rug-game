// Track-space geometry for the interface: the pointed tile silhouette, its selected outline and the progress lines.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	SPACE_COUNT,
	TRACK_TIP,
	OUTLINE_INSET,
	spacePoints,
	insetPolygon,
	outlinePath,
	tierOf,
	progressSpan,
} from '../src/lib/track-shape.js';

/**
 * Rounds every coordinate, so float noise does not fail a comparison.
 * @param {{ x: number, y: number }[]} points
 */
const rounded = (points) =>
	points.map(({ x, y }) => ({
		x: Math.round(x * 1000) / 1000,
		y: Math.round(y * 1000) / 1000,
	}));

test('a track has twelve spaces and the tip matches --track-tip in tokens.css', () => {
	assert.equal(SPACE_COUNT, 12);
	const tokens = readFileSync(
		fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
		'utf8'
	);
	assert.equal(
		tokens.match(/--track-tip:\s*([\d.]+)px;/)?.[1],
		`${TRACK_TIP}`
	);
	assert.equal(OUTLINE_INSET, 1.5);
});

test('the first space has a flat left edge and an arrow tip on the right', () => {
	assert.deepEqual(spacePoints(100, 80, { first: true }), [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 116, y: 40 },
		{ x: 100, y: 80 },
		{ x: 0, y: 80 },
	]);
});

test('a middle space has the tip on the right and a matching inlet on the left', () => {
	assert.deepEqual(spacePoints(100, 80), [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 116, y: 40 },
		{ x: 100, y: 80 },
		{ x: 0, y: 80 },
		{ x: 16, y: 40 },
	]);
});

test('the last space is square on the right and keeps its inlet', () => {
	assert.deepEqual(spacePoints(100, 80, { last: true }), [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 100, y: 80 },
		{ x: 0, y: 80 },
		{ x: 16, y: 40 },
	]);
});

test('a space can take another tip size', () => {
	assert.deepEqual(spacePoints(50, 50, { tip: 10 })[2], { x: 60, y: 25 });
	assert.deepEqual(spacePoints(50, 50, { tip: 10 })[5], { x: 10, y: 25 });
});

test('insetting a square moves every edge inwards by the distance', () => {
	const square = [
		{ x: 0, y: 0 },
		{ x: 10, y: 0 },
		{ x: 10, y: 10 },
		{ x: 0, y: 10 },
	];
	assert.deepEqual(rounded(insetPolygon(square, 1)), [
		{ x: 1, y: 1 },
		{ x: 9, y: 1 },
		{ x: 9, y: 9 },
		{ x: 1, y: 9 },
	]);
});

test('insetting a pointed space keeps the tip and the inlet on the middle line', () => {
	const inset = insetPolygon(spacePoints(100, 80), 1.5);
	const [, , tip, , , inlet] = inset;
	assert.equal(Math.round(tip.y * 1000) / 1000, 40);
	assert.equal(Math.round(inlet.y * 1000) / 1000, 40);
	// A slanted edge moved 1.5 pixels square to itself moves sideways by 1.5 · length / rise.
	const shift = (1.5 * Math.hypot(TRACK_TIP, 40)) / 40;
	assert.ok(Math.abs(tip.x - (116 - shift)) < 1e-9);
	assert.ok(Math.abs(inlet.x - (16 + shift)) < 1e-9);
});

test('insetting leaves the original points alone', () => {
	const points = spacePoints(100, 80);
	const copy = structuredClone(points);
	insetPolygon(points, 3);
	assert.deepEqual(points, copy);
});

test('the selected outline is a closed path 1.5 pixels inside the silhouette', () => {
	const shift = (1.5 * Math.hypot(16, 40)) / 40;
	const round = (/** @type {number} */ value) =>
		Math.round(value * 1000) / 1000;
	// Where the top edge meets the slanted tip edge, 1.5 pixels down that edge leans 0.6 pixels right.
	const corner = round(100 + 0.4 * 1.5 - shift);
	assert.equal(
		outlinePath(100, 80, { first: true }),
		`M 1.5 1.5 L ${corner} 1.5 L ${round(116 - shift)} 40 L ${corner} 78.5 L 1.5 78.5 Z`
	);
	assert.equal(
		outlinePath(100, 80, { last: true }).split(' L ').length,
		5,
		'five corners'
	);
	// After the first space, the top-left corner meets the leaning inlet edge instead of a flat side.
	assert.equal(
		outlinePath(100, 80),
		`M ${round(0.4 * 1.5 + shift)} 1.5 L ${corner} 1.5 L ${round(116 - shift)} 40 L ${corner} 78.5 L ${round(0.4 * 1.5 + shift)} 78.5 L ${round(16 + shift)} 40 Z`
	);
});

test('an unmeasured space has no outline yet', () => {
	assert.equal(outlinePath(0, 0), '');
	assert.equal(outlinePath(100, 0), '');
});

test('every three spaces share one tier, I to IV', () => {
	assert.deepEqual(
		Array.from({ length: 12 }, (_, index) => tierOf(index + 1)),
		[1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]
	);
});

test('a progress line stops beneath the middle of the reached space', () => {
	assert.deepEqual(progressSpan(4), {
		end: 3.5 / 12,
		next: { start: 3.5 / 12, end: 4.5 / 12 },
	});
	assert.deepEqual(progressSpan(1), {
		end: 0.5 / 12,
		next: { start: 0.5 / 12, end: 1.5 / 12 },
	});
});

test('a player still at the start has no line, and the preview runs from the start', () => {
	assert.deepEqual(progressSpan(0), {
		end: 0,
		next: { start: 0, end: 0.5 / 12 },
	});
});

test('a player on the last space has no next space to preview', () => {
	assert.deepEqual(progressSpan(12), { end: 11.5 / 12, next: null });
	assert.deepEqual(progressSpan(15), progressSpan(12));
	assert.deepEqual(progressSpan(-2), progressSpan(0));
});

test('a progress line can be measured on a track of another length', () => {
	assert.deepEqual(progressSpan(2, 4), {
		end: 1.5 / 4,
		next: { start: 1.5 / 4, end: 2.5 / 4 },
	});
});
