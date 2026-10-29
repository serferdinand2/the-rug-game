// The tooltip's place (#137): above its target or below it, kept inside the window, its arrow on the target's centre.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { placeTooltip, tooltipText } from '../src/lib/tooltip.js';

const WINDOW = { width: 1920, height: 1080 };
const TIP = { width: 200, height: 60 };

test('a tooltip sits centred above its target, with its arrow on the centre', () => {
	const target = { left: 500, top: 400, width: 100, height: 40 };
	assert.deepEqual(placeTooltip(target, TIP, WINDOW), {
		left: 450,
		top: 330,
		side: 'top',
		arrow: 100,
	});
});

test('a tooltip goes below a target too near the top of the window', () => {
	const target = { left: 500, top: 20, width: 100, height: 40 };
	assert.deepEqual(placeTooltip(target, TIP, WINDOW), {
		left: 450,
		top: 70,
		side: 'bottom',
		arrow: 100,
	});
});

test('a tooltip stays inside the window, and its arrow still points at the target', () => {
	const left = placeTooltip(
		{ left: 0, top: 400, width: 40, height: 40 },
		TIP,
		WINDOW
	);
	assert.equal(left.left, 8);
	assert.equal(left.arrow, 12);

	const right = placeTooltip(
		{ left: 1880, top: 400, width: 40, height: 40 },
		TIP,
		WINDOW
	);
	assert.equal(right.left, 1712);
	assert.equal(right.arrow, 188);
});

test('with no room either way, a tooltip takes the roomier side and stays in the window', () => {
	const tall = { width: 200, height: 600 };
	const high = placeTooltip(
		{ left: 500, top: 450, width: 100, height: 40 },
		tall,
		WINDOW
	);
	assert.equal(high.side, 'bottom');
	assert.equal(high.top, 472);
	const low = placeTooltip(
		{ left: 500, top: 560, width: 100, height: 40 },
		tall,
		WINDOW
	);
	assert.equal(low.side, 'top');
	assert.equal(low.top, 8);
});

test('a tooltip shows a title trimmed, and nothing for a blank one', () => {
	assert.equal(tooltipText('  Close the seat \n'), 'Close the seat');
	assert.equal(tooltipText('Ana\n\nMilitants'), 'Ana\n\nMilitants');
	assert.equal(tooltipText('   '), '');
	assert.equal(tooltipText(null), '');
});
