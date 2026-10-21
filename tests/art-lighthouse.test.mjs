// The Lighthouse rebuilt with the toolkit matches the approved style C prototype exactly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fromSvg, toSvg } from '../art/painter.js';
import { draw } from '../art/drawings/landmark/lighthouse.js';

const prototype = await readFile(
	new URL('../docs/art/style-c/lighthouse-scene.svg', import.meta.url),
	'utf8'
);

test('the toolkit Lighthouse has exactly the prototype pixels', () => {
	const expected = fromSvg(prototype);
	const actual = draw();
	assert.equal(actual.w, expected.w);
	assert.equal(actual.h, expected.h);
	const first = actual.p.findIndex((colour, i) => colour !== expected.p[i]);
	if (first !== -1) {
		const x = first % actual.w;
		const y = Math.floor(first / actual.w);
		const count = actual.p.filter((c, i) => c !== expected.p[i]).length;
		assert.fail(
			`${count} pixels differ; the first is (${x}, ${y}): drew ${actual.p[first]}, prototype has ${expected.p[first]}`
		);
	}
});

test('the toolkit Lighthouse writes the same SVG as the prototype', () => {
	assert.equal(toSvg(draw()), prototype);
});
