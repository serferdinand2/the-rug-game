// Effects: light passes over an already painted canvas, such as the glow around a lamp or a fire.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCanvas, rect, get } from '../art/painter.js';
import { glow } from '../art/effects.js';

const NIGHT = '#202040';
const LAMP = '#ffe080';

/** A 21×21 canvas painted one flat colour. */
function flat() {
	const c = createCanvas(21, 21);
	rect(c, 0, 0, 21, 21, NIGHT);
	return c;
}

/** How far a colour's red channel has moved from the night's. */
const lift = (colour) => parseInt(colour.slice(1, 3), 16) - 0x20;

test('a glow is brightest at its centre and fades towards its edge', () => {
	const c = flat();
	glow(c, { x: 10, y: 10, radius: 8, colour: LAMP });
	assert.ok(lift(get(c, 10, 10)) > lift(get(c, 14, 10)));
	assert.ok(lift(get(c, 14, 10)) > lift(get(c, 17, 10)));
	assert.equal(get(c, 19, 10), NIGHT, 'past the radius');
	assert.equal(get(c, 0, 0), NIGHT, 'a far corner');
});

test('a glow adds no more colours than its steps', () => {
	const c = flat();
	glow(c, { x: 10, y: 10, radius: 9, colour: LAMP, steps: 3 });
	const colours = new Set(c.p);
	colours.delete(NIGHT);
	assert.equal(colours.size, 3);
});

test('a glow leaves empty pixels and the colours it is told to skip alone', () => {
	const c = flat();
	c.p[10 * 21 + 10] = null;
	rect(c, 12, 10, 1, 1, '#ff0000');
	glow(c, { x: 10, y: 10, radius: 6, colour: LAMP, skip: ['#ff0000'] });
	assert.equal(get(c, 10, 10), null);
	assert.equal(get(c, 12, 10), '#ff0000');
	assert.notEqual(get(c, 11, 10), NIGHT);
});

test('a glow refuses a radius below 1 and steps below 1', () => {
	assert.throws(
		() => glow(flat(), { x: 1, y: 1, radius: 0, colour: LAMP }),
		/radius/
	);
	assert.throws(
		() => glow(flat(), { x: 1, y: 1, radius: 4, colour: LAMP, steps: 0 }),
		/steps/
	);
});
