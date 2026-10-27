// Territory art (#6): the terrain hexes, the cloud and volcano overlays, the 48 territory tiles and both boards.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import {
	HEX_W,
	HEX_H,
	HEX_R,
	CLOUD_COLOURS,
	CLOUD_SPOT,
	VOLCANO_CRATER,
	inHex,
	wedgeOf,
	islandPartOf,
	drawHexTerrain,
	drawCloud,
	drawVolcano,
	drawTerritory,
	drawBoard,
	boardOrigin,
	volcanoCorner,
	volcanoSpot,
} from '../art/parts/territory.js';
import { DRAWINGS_DIR } from '../art/build.mjs';
import { PALETTE } from '../art/palette.js';
import { cornerWedge, islandParts } from '../src/lib/hexmap.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { turned } from '../src/lib/engine/terrain.js';
import { CLOUD_SIZE, VOLCANO_SPOTS } from '../src/lib/art/hex-overlays.js';

/** @typedef {import('../art/painter.js').Canvas} Canvas */

const TERRAINS = /** @type {const} */ ([
	'sea',
	'desert',
	'forest',
	'grassland',
	'mountain',
	'unexplored',
]);

/** R77: the territory tiles whose pictures show clouds (spec §3). */
const R77_TILES = [
	1, 7, 8, 9, 10, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 30, 33, 35, 36, 39,
	40, 42, 43, 44, 45, 48,
];

/** R77: the printed hexes whose pictures show clouds, on each side (spec §3). */
const R77_HEXES = {
	large: [
		'0_0',
		'-1_-4',
		'0_-3',
		'2_0',
		'4_1',
		'3_3',
		'3_4',
		'0_3',
		'1_4',
		'-4_-1',
		'-3_0',
		'-3_1',
		'-2_-2',
	],
	small: ['0_0', '-3_-3', '-2_-2', '3_0', '2_1', '0_2', '0_3'],
};

const SEEDS = [1, 2, 3, 17, 48];

/** Every colour each terrain's picture uses, over a few seeds. */
const TERRAIN_COLOURS = new Map(
	TERRAINS.map((terrain) => [
		terrain,
		new Set(
			SEEDS.flatMap((seed) => drawHexTerrain(terrain, seed).p).filter(
				Boolean
			)
		),
	])
);

const CLOUD = new Set(CLOUD_COLOURS);

/** Every colour of the volcano overlay. */
const ASH = new Set(drawVolcano().p.filter(Boolean));

/** The volcano's lava and embers glow; the rest of it is dark rock and ash. */
const LAVA = [PALETTE.gold, PALETTE.amber, PALETTE.brickRed];

/**
 * Loads a drawing module by its asset id.
 * @param {string} id
 */
function load(id) {
	return import(pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href);
}

/** Every territory tile's drawing, in id order. @type {Canvas[]} */
const TILES = [];
for (let id = 1; id <= 48; id++) {
	TILES.push((await load(`territory-tile/${id}`)).draw());
}

/**
 * A pixel's centre in hexmap.js's frame, for a hex of size 1 centred on the origin.
 * @param {number} x
 * @param {number} y
 * @returns {[number, number]}
 */
function toHexmap(x, y) {
	return [
		(x + 0.5 - HEX_W / 2) / HEX_R,
		((y + 0.5 - HEX_H / 2) / (HEX_H / 2)) * (Math.sqrt(3) / 2),
	];
}

/**
 * Tells whether a point lies inside a polygon (even-odd rule).
 * @param {[number, number]} point
 * @param {readonly [number, number][]} polygon
 */
function inPolygon([px, py], polygon) {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [ax, ay] = polygon[i];
		const [bx, by] = polygon[j];
		if (
			ay > py !== by > py &&
			px < ((bx - ax) * (py - ay)) / (by - ay) + ax
		) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * The colours a canvas uses inside a window.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} top
 * @param {(x: number, y: number) => boolean} [keep] - Which window pixels count, in window coordinates
 */
function coloursIn(canvas, left = 0, top = 0, keep = () => true) {
	const colours = new Set();
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (keep(x, y)) {
				colours.add(canvas.p[(top + y) * canvas.w + left + x]);
			}
		}
	}
	return colours;
}

/**
 * The terrain a tile shows at a pixel, from its corners and island.
 * @param {readonly string[]} corners
 * @param {readonly string[]} island
 * @param {number} x
 * @param {number} y
 */
function terrainAt(corners, island, x, y) {
	const part = islandPartOf(x, y, island.length);
	return part >= 0 ? island[part] : corners[wedgeOf(x, y)];
}

test('a territory picture is a 64×56 flat-topped hex of radius 32', () => {
	assert.deepEqual([HEX_W, HEX_H, HEX_R], [64, 56, 32]);
	// Corner 0 top-left, then clockwise: (16, 0), (48, 0), (64, 28), (48, 56), (16, 56), (0, 28).
	assert.ok(inHex(16, 0) && inHex(47, 0) && inHex(16, 55) && inHex(47, 55));
	assert.ok(!inHex(15, 0) && !inHex(48, 0) && !inHex(15, 55));
	assert.ok(inHex(0, 27) && inHex(0, 28) && inHex(63, 27) && inHex(63, 28));
	assert.ok(!inHex(0, 0) && !inHex(63, 55));
});

test('neighbouring hexes tile the board with no gap and no overlap', () => {
	// A hex a_b sits at x = 48·(b − a), y = 28·(a + b): its six neighbours at these offsets.
	const offsets = [
		[0, 0],
		[0, -56],
		[48, -28],
		[48, 28],
		[0, 56],
		[-48, 28],
		[-48, -28],
	];
	for (let y = -10; y < HEX_H + 10; y++) {
		for (let x = -10; x < HEX_W + 10; x++) {
			const covering = offsets.filter(([dx, dy]) =>
				inHex(x - dx, y - dy)
			).length;
			assert.equal(covering, 1, `pixel (${x}, ${y})`);
		}
	}
});

test("a pixel's wedge agrees with hexmap.js's cornerWedge", () => {
	const wedges = [0, 1, 2, 3, 4, 5].map((k) => cornerWedge([0, 0], k, 1));
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (!inHex(x, y)) {
				continue;
			}
			const point = toHexmap(x, y);
			const holding = wedges
				.map((wedge, k) => (inPolygon(point, wedge) ? k : -1))
				.filter((k) => k >= 0);
			assert.deepEqual(holding, [wedgeOf(x, y)], `pixel (${x}, ${y})`);
		}
	}
});

test("a pixel's island part agrees with hexmap.js's islandParts", () => {
	for (const count of [1, 2, 3, 4]) {
		const island = /** @type {any[]} */ (
			['desert', 'forest', 'grassland', 'mountain'].slice(0, count)
		);
		const parts = islandParts([0, 0], island, 1);
		let inside = 0;
		for (let y = 0; y < HEX_H; y++) {
			for (let x = 0; x < HEX_W; x++) {
				const point = toHexmap(x, y);
				const holding = parts
					.map((part, i) => (inPolygon(point, part.points) ? i : -1))
					.filter((i) => i >= 0);
				const part = islandPartOf(x, y, count);
				assert.deepEqual(
					holding,
					part >= 0 ? [part] : [],
					`${count} parts, pixel (${x}, ${y})`
				);
				inside += part >= 0 ? 1 : 0;
			}
		}
		assert.ok(
			inside > 400,
			`${count} parts: the island has ${inside} pixels`
		);
	}
	assert.equal(islandPartOf(32, 28, 0), -1);
});

test('every terrain picture fills its hex and leaves the outside transparent', () => {
	for (const terrain of TERRAINS) {
		for (const seed of SEEDS) {
			const canvas = drawHexTerrain(terrain, seed);
			assert.deepEqual([canvas.w, canvas.h], [HEX_W, HEX_H], terrain);
			for (let y = 0; y < HEX_H; y++) {
				for (let x = 0; x < HEX_W; x++) {
					const painted = canvas.p[y * HEX_W + x] !== null;
					assert.equal(
						painted,
						inHex(x, y),
						`${terrain} ${seed}: pixel (${x}, ${y})`
					);
				}
			}
		}
	}
});

test('each terrain has colours of its own, and none is a cloud colour', () => {
	for (const a of TERRAINS) {
		for (const colour of TERRAIN_COLOURS.get(a) ?? []) {
			assert.ok(
				!CLOUD.has(colour),
				`${a} uses the cloud colour ${colour}`
			);
			for (const b of TERRAINS) {
				if (a !== b) {
					assert.ok(
						!TERRAIN_COLOURS.get(b)?.has(colour),
						`${a} and ${b} share ${colour}`
					);
				}
			}
		}
	}
});

test('the terrain pictures repeat for the same seed and vary with it', () => {
	for (const terrain of TERRAINS) {
		assert.deepEqual(
			drawHexTerrain(terrain, 5),
			drawHexTerrain(terrain, 5)
		);
		assert.notDeepEqual(
			drawHexTerrain(terrain, 5).p,
			drawHexTerrain(terrain, 6).p,
			terrain
		);
	}
});

test('the cloud colours are palette colours that only the cloud uses', () => {
	const palette = new Set(Object.values(PALETTE));
	assert.ok(CLOUD_COLOURS.length >= 3);
	for (const colour of CLOUD_COLOURS) {
		assert.ok(palette.has(colour), colour);
	}
	const cloud = new Set(drawCloud().p.filter(Boolean));
	assert.deepEqual([...cloud].sort(), [...CLOUD].sort());
});

test('the cloud stays wholly inside the hex', () => {
	const cloud = drawCloud();
	const [left, top] = CLOUD_SPOT;
	let pixels = 0;
	for (let y = 0; y < cloud.h; y++) {
		for (let x = 0; x < cloud.w; x++) {
			if (cloud.p[y * cloud.w + x]) {
				pixels++;
				assert.ok(inHex(left + x, top + y), `cloud pixel (${x}, ${y})`);
			}
		}
	}
	assert.ok(pixels > 100, `the cloud has ${pixels} pixels`);
});

test('the volcano uses no cloud colour and is drawn in dark ash, not white', () => {
	assert.ok(ASH.size >= 6);
	for (const colour of ASH) {
		assert.ok(!CLOUD.has(colour), `the volcano uses ${colour}`);
		for (const terrain of TERRAINS) {
			assert.ok(
				!TERRAIN_COLOURS.get(terrain)?.has(colour),
				`the volcano shares ${colour} with ${terrain}`
			);
		}
	}
	// Ash, not cloud: but for the lava's glow, the volcano is darker than the cloud's darkest colour.
	const light = (/** @type {string} */ c) =>
		[1, 3, 5].reduce((sum, i) => sum + parseInt(c.slice(i, i + 2), 16), 0);
	const darkestCloud = Math.min(...CLOUD_COLOURS.map(light));
	for (const colour of ASH) {
		if (!LAVA.includes(colour)) {
			assert.ok(
				light(colour) < darkestCloud / 1.5,
				`${colour} is too light`
			);
		}
	}
	// Most of the ash column is ash, not glow.
	const volcano = drawVolcano();
	const plume = volcano.p
		.slice(0, VOLCANO_CRATER[1] * volcano.w)
		.filter(Boolean);
	assert.ok(
		plume.filter((c) => !LAVA.includes(c)).length > 0.9 * plume.length
	);
});

test('the volcano sits on a mountain corner, wholly inside the hex', () => {
	assert.equal(volcanoCorner(TERRITORY_TILES[46].corners), 3);
	assert.equal(
		volcanoCorner(turned(TERRITORY_TILES[46].corners, 2)),
		5,
		'a turned tile 47 keeps the volcano on its mountains'
	);
	assert.equal(
		volcanoCorner(MAPS.large.printed['-1_3'].corners),
		5,
		'the middle of three mountain corners'
	);
	const volcano = drawVolcano();
	for (let k = 0; k < 6; k++) {
		const [left, top] = volcanoSpot(k);
		for (let y = 0; y < volcano.h; y++) {
			for (let x = 0; x < volcano.w; x++) {
				if (volcano.p[y * volcano.w + x]) {
					assert.ok(
						inHex(left + x, top + y),
						`corner ${k}: volcano pixel (${x}, ${y})`
					);
				}
			}
		}
		// The crater stands in its corner's wedge, more than half way out.
		const [x, y] = [left + VOLCANO_CRATER[0], top + VOLCANO_CRATER[1]];
		assert.equal(wedgeOf(x, y), k, `corner ${k}`);
		assert.equal(islandPartOf(x, y, 1), -1, `corner ${k}`);
	}
});

test('every territory tile fills its hex and leaves the outside transparent', () => {
	TILES.forEach((canvas, i) => {
		assert.deepEqual([canvas.w, canvas.h], [HEX_W, HEX_H], `tile ${i + 1}`);
		for (let y = 0; y < HEX_H; y++) {
			for (let x = 0; x < HEX_W; x++) {
				assert.equal(
					canvas.p[y * HEX_W + x] !== null,
					inHex(x, y),
					`tile ${i + 1}: pixel (${x}, ${y})`
				);
			}
		}
	});
});

test('each corner of a territory tile shows its terrain near the rim', () => {
	TILES.forEach((canvas, i) => {
		const { corners, volcano } = TERRITORY_TILES[i];
		for (let k = 0; k < 6; k++) {
			// The volcano stands on its corner's line, so it may cover these pixels.
			const colours = new Set([
				...(TERRAIN_COLOURS.get(corners[k]) ?? []),
				...(volcano && k === volcanoCorner(corners) ? ASH : []),
			]);
			// Three pixels on the way out to corner k, the last near the rim.
			for (const t of [0.7, 0.78, 0.86]) {
				const [cx, cy] = [
					[16, 0],
					[48, 0],
					[64, 28],
					[48, 56],
					[16, 56],
					[0, 28],
				][k];
				const x = Math.floor(32 + (cx - 32) * t);
				const y = Math.floor(28 + (cy - 28) * t);
				assert.equal(wedgeOf(x, y), k);
				const colour = canvas.p[y * HEX_W + x];
				assert.ok(
					colours?.has(colour),
					`tile ${i + 1}, corner ${k} (${corners[k]}): ${colour} at (${x}, ${y})`
				);
			}
		}
	});
});

test('an island shows its terrain in its middle', () => {
	TILES.forEach((canvas, i) => {
		const { island } = TERRITORY_TILES[i];
		if (island.length === 0) {
			return;
		}
		const land = TERRAIN_COLOURS.get(island[0]);
		const middle = [];
		for (let y = 22; y < 34; y++) {
			for (let x = 26; x < 38; x++) {
				middle.push(canvas.p[y * HEX_W + x]);
			}
		}
		const share = middle.filter((c) => land?.has(c)).length / middle.length;
		assert.ok(
			share > 0.9,
			`tile ${i + 1}: ${share} of the middle is ${island[0]}`
		);
	});
});

test('land and sea of different wedges meet at a coast of beach and surf', () => {
	TILES.forEach((canvas, i) => {
		const { corners, island, clouds } = TERRITORY_TILES[i];
		let coast = 0;
		for (let y = 0; y < HEX_H; y++) {
			for (let x = 0; x + 1 < HEX_W; x++) {
				for (const [nx, ny] of [
					[x + 1, y],
					[x, y + 1],
				]) {
					if (!inHex(x, y) || !inHex(nx, ny)) {
						continue;
					}
					const a = terrainAt(corners, island, x, y);
					const b = terrainAt(corners, island, nx, ny);
					if ((a === 'sea') === (b === 'sea')) {
						continue;
					}
					const [landPixel, seaPixel] =
						a === 'sea'
							? [
									canvas.p[ny * HEX_W + nx],
									canvas.p[y * HEX_W + x],
								]
							: [
									canvas.p[y * HEX_W + x],
									canvas.p[ny * HEX_W + nx],
								];
					if (
						clouds &&
						(CLOUD.has(landPixel) || CLOUD.has(seaPixel))
					) {
						continue;
					}
					assert.equal(
						landPixel,
						PALETTE.sandLight,
						`tile ${i + 1}: beach at (${x}, ${y})`
					);
					assert.ok(
						[PALETTE.foam, PALETTE.dayWave].includes(
							/** @type {string} */ (seaPixel)
						),
						`tile ${i + 1}: surf at (${x}, ${y}) is ${seaPixel}`
					);
					coast++;
				}
			}
		}
		assert.ok(coast > 10, `tile ${i + 1} has ${coast} coast pixels`);
	});
});

test('clouds show on exactly the territory tiles R77 lists', () => {
	assert.deepEqual(
		TERRITORY_TILES.filter((tile) => tile.clouds).map((tile) => tile.id),
		R77_TILES
	);
	TILES.forEach((canvas, i) => {
		const cloudy = canvas.p.some((colour) => CLOUD.has(colour));
		assert.equal(cloudy, R77_TILES.includes(i + 1), `tile ${i + 1}`);
	});
});

test('the volcano shows on tile 47 only', () => {
	TILES.forEach((canvas, i) => {
		const volcanic = canvas.p.filter((colour) => ASH.has(colour)).length;
		if (i + 1 === 47) {
			assert.ok(
				volcanic > 60,
				`tile 47 shows ${volcanic} volcano pixels`
			);
		} else {
			assert.equal(volcanic, 0, `tile ${i + 1}`);
		}
	});
});

test('no two territory tiles are the same picture', () => {
	/** @type {Map<string, number>} */
	const seen = new Map();
	TILES.forEach((canvas, i) => {
		const key = canvas.p.join();
		assert.ok(
			!seen.has(key),
			`tile ${i + 1} is the same as tile ${seen.get(key)}`
		);
		seen.set(key, i + 1);
	});
});

test('the territory art paints only palette colours', () => {
	const palette = new Set(Object.values(PALETTE));
	const canvases = [
		...TERRAINS.map((terrain) => drawHexTerrain(terrain, 1)),
		drawCloud(),
		drawVolcano(),
		...TILES,
		drawBoard('small'),
		drawBoard('large'),
	];
	for (const canvas of canvases) {
		for (const colour of new Set(canvas.p)) {
			assert.ok(colour === null || palette.has(colour), `${colour}`);
		}
	}
});

test('drawTerritory repeats for the same seed', () => {
	const tile = { ...TERRITORY_TILES[1], seed: 9 };
	assert.deepEqual(drawTerritory(tile), drawTerritory(tile));
});

test('a territory in any turn fills its hex, its corners showing the turned terrains', () => {
	for (const id of [2, 12, 23, 47]) {
		const tile = TERRITORY_TILES[id - 1];
		for (let orient = 0; orient < 6; orient++) {
			const corners = turned(tile.corners, orient);
			const canvas = drawTerritory({ ...tile, corners, seed: id });
			for (let y = 0; y < HEX_H; y++) {
				for (let x = 0; x < HEX_W; x++) {
					assert.equal(
						canvas.p[y * HEX_W + x] !== null,
						inHex(x, y),
						`tile ${id} turned ${orient}: pixel (${x}, ${y})`
					);
				}
			}
			for (let k = 0; k < 6; k++) {
				if (tile.volcano && k === volcanoCorner(corners)) {
					continue;
				}
				const [cx, cy] = [
					[16, 0],
					[48, 0],
					[64, 28],
					[48, 56],
					[16, 56],
					[0, 28],
				][k];
				const x = Math.floor(32 + (cx - 32) * 0.84);
				const y = Math.floor(28 + (cy - 28) * 0.84);
				assert.ok(
					TERRAIN_COLOURS.get(corners[k])?.has(
						canvas.p[y * HEX_W + x]
					),
					`tile ${id} turned ${orient}, corner ${k} should be ${corners[k]}`
				);
			}
		}
	}
});

for (const side of /** @type {const} */ (['large', 'small'])) {
	const map = MAPS[side];
	const board = drawBoard(side);
	const [ox, oy] = boardOrigin(side);

	/**
	 * Hex a_b's window on the board: its top-left pixel.
	 * @param {string} key
	 * @returns {[number, number]}
	 */
	const windowOf = (key) => {
		const [a, b] = key.split('_').map(Number);
		return [ox + 48 * (b - a) - 32, oy + 28 * (a + b) - 28];
	};

	test(`the ${side} board fits its hexes and is painted everywhere`, () => {
		const xs = map.hexes.map((key) => windowOf(key)[0]);
		const ys = map.hexes.map((key) => windowOf(key)[1]);
		assert.equal(Math.min(...xs), 0);
		assert.equal(Math.min(...ys), 0);
		assert.equal(board.w, Math.max(...xs) + HEX_W);
		assert.equal(board.h, Math.max(...ys) + HEX_H);
		assert.equal(board.p.indexOf(null), -1);
	});

	test(`the ${side} board shows each printed hex turned, and the others unexplored`, () => {
		const fog = TERRAIN_COLOURS.get('unexplored');
		for (const key of map.hexes) {
			const [left, top] = windowOf(key);
			const printed = map.printed[key];
			if (!printed) {
				const colours = coloursIn(board, left, top, inHex);
				assert.ok(
					[...colours].every((c) => fog?.has(c)),
					`${side} ${key} is not unexplored`
				);
				continue;
			}
			const corners = turned(printed.corners, printed.orient);
			for (let k = 0; k < 6; k++) {
				const [cx, cy] = [
					[16, 0],
					[48, 0],
					[64, 28],
					[48, 56],
					[16, 56],
					[0, 28],
				][k];
				const x = Math.floor(32 + (cx - 32) * 0.8);
				const y = Math.floor(28 + (cy - 28) * 0.8);
				const colour = board.p[(top + y) * board.w + left + x];
				assert.ok(
					TERRAIN_COLOURS.get(corners[k])?.has(colour),
					`${side} ${key}, corner ${k} should be ${corners[k]}: ${colour}`
				);
			}
		}
	});

	test(`clouds show on exactly R77's printed hexes of the ${side} board`, () => {
		assert.deepEqual(
			Object.keys(map.printed)
				.filter((key) => map.printed[key].clouds)
				.sort(),
			[...R77_HEXES[side]].sort()
		);
		for (const key of map.hexes) {
			const [left, top] = windowOf(key);
			const cloudy = [...coloursIn(board, left, top, inHex)].some((c) =>
				CLOUD.has(c)
			);
			assert.equal(
				cloudy,
				R77_HEXES[side].includes(key),
				`${side} ${key}`
			);
		}
	});

	test(`the volcano shows on large-map −1_3 only, on the ${side} board`, () => {
		for (const key of map.hexes) {
			const [left, top] = windowOf(key);
			const volcanic = [...coloursIn(board, left, top, inHex)].some((c) =>
				ASH.has(c)
			);
			assert.equal(
				volcanic,
				side === 'large' && key === '-1_3',
				`${side} ${key}`
			);
		}
	});
}

test("the overlays' shared places agree with the art: the cloud's size and each corner's volcano spot", () => {
	const cloud = drawCloud();
	assert.deepEqual([cloud.w, cloud.h], [...CLOUD_SIZE]);
	for (let k = 0; k < 6; k++) {
		assert.deepEqual(volcanoSpot(k), [...VOLCANO_SPOTS[k]], `corner ${k}`);
	}
});
