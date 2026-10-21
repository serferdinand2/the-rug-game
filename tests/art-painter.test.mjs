// The pixel painter: canvas drawing, outlines, colour mixing, seeded randomness and SVG output.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createCanvas,
	get,
	set,
	clear,
	rect,
	fillEmpty,
	outline,
	mix,
	seededRandom,
	underlay,
	toSvg,
	fromSvg,
} from '../art/painter.js';

const RED = '#aa0000';
const BLUE = '#0000bb';
const INK = '#111111';
const SVG_OPEN = (w, h) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">`;

/** Lists the filled pixels of a canvas as 'x,y=colour' strings. */
function filled(canvas) {
	const list = [];
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			const colour = canvas.p[y * canvas.w + x];
			if (colour) {
				list.push(`${x},${y}=${colour}`);
			}
		}
	}
	return list;
}

test('toSvg writes one path per colour and merges each run', () => {
	const c = createCanvas(3, 2);
	set(c, 0, 0, RED);
	set(c, 1, 0, RED);
	set(c, 2, 0, BLUE);
	set(c, 0, 1, RED);
	set(c, 2, 1, RED);
	assert.equal(
		toSvg(c),
		SVG_OPEN(3, 2) +
			'<path fill="#aa0000" d="M0 0h2v1h-2zM0 1h1v1h-1zM2 1h1v1h-1z"/>' +
			'<path fill="#0000bb" d="M2 0h1v1h-1z"/></svg>'
	);
});

test('toSvg writes no paths for an empty canvas', () => {
	assert.equal(toSvg(createCanvas(2, 2)), SVG_OPEN(2, 2) + '</svg>');
});

test('toSvg applies per-colour opacity', () => {
	const c = createCanvas(2, 1);
	set(c, 0, 0, RED);
	set(c, 1, 0, BLUE);
	const svg = toSvg(c, { opacity: { [RED]: 0.5 } });
	assert.match(
		svg,
		/<path fill="#aa0000" fill-opacity="0.5" d="M0 0h1v1h-1z"\/>/
	);
	assert.match(svg, /<path fill="#0000bb" d="M1 0h1v1h-1z"\/>/);
});

test('fromSvg reads back what toSvg wrote', () => {
	const c = createCanvas(4, 3);
	rect(c, 0, 0, 4, 1, RED);
	set(c, 1, 1, BLUE);
	set(c, 2, 1, BLUE);
	set(c, 3, 2, INK);
	set(c, 0, 2, RED);
	assert.deepEqual(fromSvg(toSvg(c)), c);
});

test('set ignores points outside the canvas and empty colours', () => {
	const c = createCanvas(2, 2);
	set(c, -1, 0, RED);
	set(c, 2, 0, RED);
	set(c, 0, 2, RED);
	set(c, 0, 0, null);
	set(c, 1, 1, undefined);
	assert.deepEqual(filled(c), []);
});

test('set rejects colours that are not lowercase #rrggbb', () => {
	const c = createCanvas(2, 2);
	for (const colour of ['#FFF', '#FFFFFF', '#fff', 'red']) {
		assert.throws(() => set(c, 0, 0, colour), /colour/, colour);
	}
});

test('set rejects fractional coordinates', () => {
	const c = createCanvas(4, 4);
	assert.throws(() => set(c, 1.5, 0, RED), /integer/);
	assert.throws(() => set(c, 0, 2.25, RED), /integer/);
});

test('get, clear and fillEmpty reject fractional coordinates too', () => {
	const c = createCanvas(4, 4);
	assert.throws(() => get(c, 1.5, 0), /integer/);
	assert.throws(() => clear(c, 1.5, 0), /integer/);
	assert.throws(() => fillEmpty(c, 1.5, 0, RED), /integer/);
	assert.deepEqual(Object.keys(c.p).length, 16);
});

test('rect rejects fractional sizes', () => {
	const c = createCanvas(4, 4);
	assert.throws(() => rect(c, 0, 0, 2.5, 1, RED), /integer/);
	assert.throws(() => rect(c, 0, 0, 1, 0.5, RED), /integer/);
	assert.deepEqual(filled(c), []);
});

test('get returns undefined outside the canvas and null on an empty pixel', () => {
	const c = createCanvas(2, 2);
	set(c, 1, 0, RED);
	assert.equal(get(c, 1, 0), RED);
	assert.equal(get(c, 0, 0), null);
	assert.equal(get(c, 2, 0), undefined);
	assert.equal(get(c, 0, -1), undefined);
});

test('clear empties a pixel', () => {
	const c = createCanvas(2, 1);
	set(c, 0, 0, RED);
	clear(c, 0, 0);
	assert.equal(get(c, 0, 0), null);
});

test('rect fills its box and fillEmpty keeps filled pixels', () => {
	const c = createCanvas(3, 3);
	rect(c, 1, 1, 2, 2, RED);
	fillEmpty(c, 1, 1, BLUE);
	fillEmpty(c, 0, 0, BLUE);
	assert.deepEqual(filled(c), [
		`0,0=${BLUE}`,
		`1,1=${RED}`,
		`2,1=${RED}`,
		`1,2=${RED}`,
		`2,2=${RED}`,
	]);
});

test('outline paints only empty neighbours of other colours', () => {
	const c = createCanvas(5, 5);
	set(c, 2, 2, RED);
	outline(c, INK);
	assert.deepEqual(filled(c), [
		`2,1=${INK}`,
		`1,2=${INK}`,
		`2,2=${RED}`,
		`3,2=${INK}`,
		`2,3=${INK}`,
	]);
});

test('outline does not grow from its own colour', () => {
	const c = createCanvas(3, 3);
	set(c, 1, 1, INK);
	outline(c, INK);
	assert.deepEqual(filled(c), [`1,1=${INK}`]);
});

test('seededRandom repeats its sequence for the same seed', () => {
	const a = seededRandom(7);
	const b = seededRandom(7);
	const first = a();
	assert.equal(first, ((7 * 1664525 + 1013904223) >>> 0) / 4294967296);
	b();
	for (let i = 0; i < 100; i++) {
		assert.equal(a(), b());
	}
});

test('mix blends each channel and rounds', () => {
	assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
	assert.equal(mix('#102030', '#102030', 0.3), '#102030');
	assert.equal(mix('#000000', '#ff0000', 0.25), '#400000');
});

test('underlay fills only empty pixels', () => {
	const top = createCanvas(2, 1);
	const layer = createCanvas(2, 1);
	set(top, 0, 0, RED);
	rect(layer, 0, 0, 2, 1, BLUE);
	underlay(top, layer);
	assert.deepEqual(filled(top), [`0,0=${RED}`, `1,0=${BLUE}`]);
});
