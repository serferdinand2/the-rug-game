// The World Map's painted terrain in the game (#134 step 5): what the painter is given, where its picture goes and its URL.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { resolveObjectURL } from 'node:buffer';
import {
	mapArt,
	mapPictureBox,
	paintedMap,
	pictureUrl,
} from '../src/lib/painted-map.js';
import { HEX_SIZE, hexCenter, hexPicture } from '../src/lib/hexmap.js';
import { hexOrigin, paintMap } from '../src/lib/art/paint/map.js';
import { createCanvas, toSvg } from '../src/lib/art/paint/painter.js';

/**
 * A MapHex as mapHexes gives it, with only what the painter reads filled in.
 * @param {string} key
 * @param {any} [terrain]
 * @returns {any}
 */
function mapHex(key, terrain) {
	return {
		key,
		center: hexCenter(key, HEX_SIZE),
		corners: terrain?.corners ?? null,
		island: terrain?.island ?? [],
		clouds: terrain?.clouds ?? false,
		volcano: terrain?.volcano ?? false,
		outposts: [{ seat: 1, toppled: false, piece: null }],
		tokens: [],
		label: `Hex ${key}`,
	};
}

const FOREST = /** @type {const} */ ([
	'forest',
	'forest',
	'sea',
	'sea',
	'mountain',
	'desert',
]);

test('the painter is given each hex key, and the terrain of the explored ones only', () => {
	const art = mapArt([
		mapHex('0_0', {
			corners: FOREST,
			island: ['grassland'],
			clouds: true,
		}),
		mapHex('0_1'),
		mapHex('1_0', { corners: FOREST, volcano: true }),
	]);
	assert.deepEqual(art, [
		{
			key: '0_0',
			corners: [...FOREST],
			island: ['grassland'],
			clouds: true,
			volcano: false,
		},
		{ key: '0_1' },
		{
			key: '1_0',
			corners: [...FOREST],
			island: [],
			clouds: false,
			volcano: true,
		},
	]);
});

test('what the painter is given does not change with the pieces or the labels', () => {
	const before = mapHex('0_0', { corners: FOREST });
	const after = {
		...before,
		outposts: [],
		tokens: [{ seat: 2, civ: 'traders' }],
		label: 'Hex 0,0: forest.',
	};
	assert.deepEqual(mapArt([after]), mapArt([before]));
});

test('the painted picture lies over every hex exactly where that hex is drawn', () => {
	const keys = ['0_0', '-1_1', '2_-1', '1_2', '-2_-1'];
	const painted = paintMap(
		keys.map((key) => ({ key, corners: [...FOREST] }))
	);
	const box = mapPictureBox(painted, HEX_SIZE);
	const across = box.width / painted.canvas.w;
	const down = box.height / painted.canvas.h;
	for (const key of keys) {
		const [ox, oy] = hexOrigin(key);
		const expected = hexPicture(hexCenter(key, HEX_SIZE), HEX_SIZE);
		const x = box.x + (ox - painted.left) * across;
		const y = box.y + (oy - painted.top) * down;
		assert.ok(Math.abs(x - expected.x) < 1e-9, `${key} x: ${x}`);
		assert.ok(Math.abs(y - expected.y) < 1e-9, `${key} y: ${y}`);
		assert.ok(Math.abs(64 * across - expected.width) < 1e-9, key);
		assert.ok(Math.abs(56 * down - expected.height) < 1e-9, key);
	}
});

test('the picture box scales with the hex size', () => {
	const painted = { canvas: createCanvas(64, 56), left: 0, top: 0 };
	assert.deepEqual(mapPictureBox(painted, 32), hexPicture([0, 0], 32));
});

test('a map with no explored hex paints nothing', () => {
	assert.equal(paintedMap([]), null);
	assert.equal(paintedMap([{ key: '0_0' }, { key: '0_1' }]), null);
});

test('a map with an explored hex is painted as paintMap paints it', () => {
	const art = [{ key: '0_0' }, { key: '0_1', corners: [...FOREST] }];
	const painted = paintedMap(art);
	assert.ok(painted);
	assert.deepEqual(painted, paintMap(art));
});

test('a picture URL is a blob URL holding the picture as SVG', async () => {
	const canvas = createCanvas(2, 1);
	canvas.p[0] = '#123456';
	const url = pictureUrl(canvas);
	assert.match(url, /^blob:/);
	const blob = resolveObjectURL(url);
	assert.ok(blob);
	assert.equal(blob.type, 'image/svg+xml');
	assert.equal(await blob.text(), toSvg(canvas));
	URL.revokeObjectURL(url);
	assert.equal(resolveObjectURL(url), undefined);
});
