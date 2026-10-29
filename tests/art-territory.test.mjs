// Territory art (#6, #134): the hex geometry, the terrain hexes, the cloud and volcano overlays, the 48 territory tiles and both boards, painted in the 2.5D style.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
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
	drawCloud,
	drawVolcano,
	volcanoCorner,
	volcanoSpot,
} from '../tools/art/parts/territory.js';
import { DRAWINGS_DIR, renderAsset } from '../tools/art/build.mjs';
import { PALETTE } from '../tools/art/palette.js';
import { mix } from '../tools/art/painter.js';
import {
	hexOrigin,
	paintMap,
	paintTerritory,
} from '../src/lib/art/paint/map.js';
import { cornerWedge, islandParts } from '../src/lib/hexmap.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { turned } from '../src/lib/engine/terrain.js';
import { CLOUD_SIZE, VOLCANO_SPOTS } from '../src/lib/art/hex-overlays.js';

/** @typedef {import('../tools/art/painter.js').Canvas} Canvas */

const TERRAINS = /** @type {const} */ ([
	'sea',
	'desert',
	'forest',
	'grassland',
	'mountain',
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

/**
 * The fog and the two overlays are not redrawn (#134): their SVGs, as built before the 2.5D redraw.
 * @type {Record<string, string>}
 */
const UNCHANGED = {
	'hex/unexplored':
		'f08640b5f2ab812351537e9e27264b7a1b1fa9e51822f7b888111125076bd0a8',
	'hex/cloud':
		'7519ed68f697f5ebdefdf394cd551ae8564d9953daf000e5494f976e15a10743',
	'hex/volcano':
		'0bfca5bf868cc29e5bdd653335aa6a36cd4e833d9e149a8844aa11220a2ac460',
};

/** Ink's opacity in #82's shadows (mountain 0.3, forest 0.25) and in the map's faint rim (0.6). */
const SHADOWS = [0.25, 0.3];
const RIM = 0.6;

/** The palette, and each colour darkened by a shadow, by the rim, or by a shadow over the rim. */
const BLENDED = new Set(
	Object.values(PALETTE).flatMap((c) => {
		const rim = mix(c, PALETTE.ink, RIM);
		return [
			c,
			rim,
			...SHADOWS.flatMap((a) => [
				mix(c, PALETTE.ink, a),
				mix(rim, PALETTE.ink, a),
			]),
		];
	})
);

/**
 * Loads a drawing module by its asset id.
 * @param {string} id
 */
function load(id) {
	return import(pathToFileURL(join(DRAWINGS_DIR, `${id}.js`)).href);
}

/** Each terrain hex's picture, by terrain. @type {Map<string, Canvas>} */
const HEXES = new Map();
for (const terrain of [...TERRAINS, 'unexplored']) {
	HEXES.set(terrain, (await load(`hex/${terrain}`)).draw());
}

/** Every colour each terrain's hex picture uses. */
const TERRAIN_COLOURS = new Map(
	[...HEXES].map(([terrain, canvas]) => [
		terrain,
		new Set(canvas.p.filter(Boolean)),
	])
);

const CLOUD = new Set(CLOUD_COLOURS);

/** Every colour of the volcano overlay. */
const ASH = new Set(drawVolcano().p.filter(Boolean));

/** The volcano's lava and embers glow; the rest of it is dark rock and ash. */
const LAVA = [PALETTE.gold, PALETTE.amber, PALETTE.brickRed];

/** Every territory tile's drawing, in id order. @type {Canvas[]} */
const TILES = [];
for (let id = 1; id <= 48; id++) {
	TILES.push((await load(`territory-tile/${id}`)).draw());
}

/** Both boards' drawings. @type {Record<'large' | 'small', Canvas>} */
const BOARDS = {
	large: (await load('board/map-large')).draw(),
	small: (await load('board/map-small')).draw(),
};

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
 * A hex's pixels on a canvas, from its top-left: null outside the hex.
 * @param {Canvas} canvas
 * @param {number} [left]
 * @param {number} [top]
 * @returns {(string | null)[]} 64×56
 */
function windowOn(canvas, left = 0, top = 0) {
	/** @type {(string | null)[]} */
	const out = [];
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			out.push(
				inHex(x, y) ? canvas.p[(top + y) * canvas.w + left + x] : null
			);
		}
	}
	return out;
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

/**
 * Tells whether an overlay's every pixel shows on a hex's window at a spot.
 * @param {readonly (string | null)[]} pixels - The hex's window
 * @param {Canvas} overlay
 * @param {readonly [number, number]} spot
 */
function shows(pixels, overlay, [left, top]) {
	for (let y = 0; y < overlay.h; y++) {
		for (let x = 0; x < overlay.w; x++) {
			const colour = overlay.p[y * overlay.w + x];
			if (colour && pixels[(top + y) * HEX_W + left + x] !== colour) {
				return false;
			}
		}
	}
	return true;
}

/**
 * The pixels an overlay covers on a territory at its spot, as indexes in the hex's window.
 * @param {Canvas} overlay
 * @param {readonly [number, number]} spot
 * @returns {Set<number>}
 */
function covered(overlay, [left, top]) {
	const out = new Set();
	for (let y = 0; y < overlay.h; y++) {
		for (let x = 0; x < overlay.w; x++) {
			if (overlay.p[y * overlay.w + x]) {
				out.add((top + y) * HEX_W + left + x);
			}
		}
	}
	return out;
}

/**
 * Checks that each part of a territory's window shows its terrain: in each corner's wedge and on the island, most
 * pixels the overlays leave bare are in that terrain's hex picture's colours, more than in any other terrain's.
 * @param {readonly (string | null)[]} pixels - The hex's window
 * @param {{ corners: readonly string[], island?: readonly string[], clouds?: boolean, volcano?: boolean }} territory
 * @param {string} name - For the messages
 */
function checkTerrains(pixels, territory, name) {
	const { corners, island = [], clouds, volcano } = territory;
	const hidden = new Set([
		...(clouds ? covered(drawCloud(), CLOUD_SPOT) : []),
		...(volcano
			? covered(drawVolcano(), volcanoSpot(volcanoCorner(corners)))
			: []),
	]);
	/** @type {Map<string, (string | null)[]>} */
	const parts = new Map();
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			const i = y * HEX_W + x;
			if (!inHex(x, y) || hidden.has(i)) {
				continue;
			}
			const part = islandPartOf(x, y, island.length);
			const key =
				part >= 0 ? `island ${part}` : `corner ${wedgeOf(x, y)}`;
			parts.set(key, [...(parts.get(key) ?? []), pixels[i]]);
		}
	}
	for (const [key, colours] of parts) {
		const [kind, n] = key.split(' ');
		const terrain = kind === 'island' ? island[+n] : corners[+n];
		/** @param {string} t */
		const share = (t) =>
			colours.filter((c) =>
				TERRAIN_COLOURS.get(t)?.has(/** @type {string} */ (c))
			).length / colours.length;
		const own = share(terrain);
		assert.ok(own > 0.6, `${name}, ${key} (${terrain}): ${own} of it`);
		for (const other of TERRAINS) {
			if (other !== terrain) {
				assert.ok(
					share(other) < own,
					`${name}, ${key} (${terrain}) looks like ${other}`
				);
			}
		}
	}
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

test('the fog and the two overlays are exactly as they were before the 2.5D redraw', async () => {
	for (const [id, sha256] of Object.entries(UNCHANGED)) {
		const svg = await renderAsset(id);
		assert.equal(
			createHash('sha256').update(svg).digest('hex'),
			sha256,
			id
		);
	}
});

test('each terrain hex is that terrain painted alone, as the map paints a hex of it all round', () => {
	for (const terrain of TERRAINS) {
		const canvas = /** @type {Canvas} */ (HEXES.get(terrain));
		const alone = paintTerritory({ corners: Array(6).fill(terrain) });
		assert.deepEqual(canvas.p, alone.p, terrain);
	}
});

test('every terrain picture fills its hex and leaves the outside transparent', () => {
	for (const [terrain, canvas] of HEXES) {
		assert.deepEqual([canvas.w, canvas.h], [HEX_W, HEX_H], terrain);
		for (let y = 0; y < HEX_H; y++) {
			for (let x = 0; x < HEX_W; x++) {
				const painted = canvas.p[y * HEX_W + x] !== null;
				assert.equal(
					painted,
					inHex(x, y),
					`${terrain}: pixel (${x}, ${y})`
				);
			}
		}
	}
});

test('the fog and the clouds share no colour with any terrain', () => {
	const fog = TERRAIN_COLOURS.get('unexplored') ?? new Set();
	for (const terrain of TERRAINS) {
		for (const colour of TERRAIN_COLOURS.get(terrain) ?? []) {
			assert.ok(!fog.has(colour), `${terrain} uses the fog's ${colour}`);
			assert.ok(
				!CLOUD.has(colour),
				`${terrain} uses the cloud colour ${colour}`
			);
		}
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

test('every territory tile is its data painted unturned, as the map paints a tile alone', () => {
	TILES.forEach((canvas, i) => {
		assert.deepEqual(
			canvas.p,
			paintTerritory(TERRITORY_TILES[i]).p,
			`tile ${i + 1}`
		);
	});
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

test('each wedge and island part of a territory tile shows its terrain', () => {
	TILES.forEach((canvas, i) => {
		checkTerrains(canvas.p, TERRITORY_TILES[i], `tile ${i + 1}`);
	});
});

test('land and sea of different wedges meet at a coast of beach and surf', () => {
	TILES.forEach((canvas, i) => {
		const { corners, island, clouds, volcano } = TERRITORY_TILES[i];
		const hidden = new Set([
			...(clouds ? covered(drawCloud(), CLOUD_SPOT) : []),
			...(volcano
				? covered(drawVolcano(), volcanoSpot(volcanoCorner(corners)))
				: []),
		]);
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
					if (
						hidden.has(y * HEX_W + x) ||
						hidden.has(ny * HEX_W + nx)
					) {
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
		assert.equal(
			shows(canvas.p, drawCloud(), CLOUD_SPOT),
			cloudy,
			`tile ${i + 1}: the cloud at its spot`
		);
	});
});

test('the volcano shows on tile 47 only, on its mountain corner', () => {
	const volcano = drawVolcano();
	TILES.forEach((canvas, i) => {
		const spots = [0, 1, 2, 3, 4, 5].filter((k) =>
			shows(canvas.p, volcano, volcanoSpot(k))
		);
		assert.deepEqual(
			spots,
			i + 1 === 47 ? [volcanoCorner(TERRITORY_TILES[i].corners)] : [],
			`tile ${i + 1}`
		);
	});
});

test('two territory tiles are the same picture only when their data is the same', () => {
	/** @type {Map<string, number>} */
	const seen = new Map();
	TILES.forEach((canvas, i) => {
		const { corners, island, clouds, volcano } = TERRITORY_TILES[i];
		const data = JSON.stringify([corners, island, clouds, volcano]);
		const key = canvas.p.join();
		const twin = seen.get(key);
		if (twin !== undefined) {
			const other = TERRITORY_TILES[twin - 1];
			assert.equal(
				JSON.stringify([
					other.corners,
					other.island,
					other.clouds,
					other.volcano,
				]),
				data,
				`tile ${i + 1} is the same picture as tile ${twin}`
			);
		}
		seen.set(key, i + 1);
	});
});

test('the territory art paints only palette colours, or their ink shadows', () => {
	const canvases = [
		...HEXES.values(),
		drawCloud(),
		drawVolcano(),
		...TILES,
		BOARDS.small,
		BOARDS.large,
	];
	for (const canvas of canvases) {
		for (const colour of new Set(canvas.p)) {
			assert.ok(colour === null || BLENDED.has(colour), `${colour}`);
		}
	}
});

for (const side of /** @type {const} */ (['large', 'small'])) {
	const map = MAPS[side];
	const board = BOARDS[side];
	const origins = map.hexes.map(hexOrigin);
	const left = Math.min(...origins.map(([x]) => x));
	const top = Math.min(...origins.map(([, y]) => y));

	/**
	 * Hex a_b's window on the board: its top-left pixel.
	 * @param {string} key
	 * @returns {[number, number]}
	 */
	const windowOf = (key) => {
		const [x, y] = hexOrigin(key);
		return [x - left, y - top];
	};

	/** The board's hexes for the map painter: the printed ones turned as printed, the others unexplored. */
	const hexes = map.hexes.map((key) => {
		const printed = map.printed[key];
		return printed
			? {
					key,
					corners: turned(printed.corners, printed.orient),
					island: printed.island,
					clouds: printed.clouds,
					volcano: printed.volcano,
				}
			: { key };
	});

	test(`the ${side} board fits its hexes and is painted everywhere`, () => {
		assert.equal(
			board.w,
			Math.max(...origins.map(([x]) => x)) - left + HEX_W
		);
		assert.equal(
			board.h,
			Math.max(...origins.map(([, y]) => y)) - top + HEX_H
		);
		assert.equal(board.p.indexOf(null), -1);
	});

	test(`the ${side} board's printed hexes are the map painted as one picture, the others its fog`, () => {
		const painted = paintMap(hexes);
		assert.deepEqual([painted.left, painted.top], [left, top]);
		const fog = /** @type {Canvas} */ (HEXES.get('unexplored'));
		for (const hex of hexes) {
			const [x, y] = windowOf(hex.key);
			const pixels = windowOn(board, x, y);
			if (!hex.corners) {
				assert.deepEqual(pixels, windowOn(fog), `${side} ${hex.key}`);
				continue;
			}
			assert.deepEqual(
				pixels,
				windowOn(painted.canvas, x, y),
				`${side} ${hex.key}`
			);
			checkTerrains(pixels, hex, `${side} ${hex.key}`);
		}
	});

	test(`the ${side} board lies in open sea`, () => {
		const sea = TERRAIN_COLOURS.get('sea');
		/** @type {Set<number>} */
		const inside = new Set();
		for (const key of map.hexes) {
			const [hx, hy] = windowOf(key);
			for (let y = 0; y < HEX_H; y++) {
				for (let x = 0; x < HEX_W; x++) {
					if (inHex(x, y)) {
						inside.add((hy + y) * board.w + hx + x);
					}
				}
			}
		}
		let open = 0;
		board.p.forEach((colour, i) => {
			if (!inside.has(i)) {
				open++;
				assert.ok(
					sea?.has(/** @type {string} */ (colour)),
					`${colour}`
				);
			}
		});
		assert.ok(open > 1000, `${side}: ${open} pixels of open sea`);
	});

	test(`clouds show on exactly R77's printed hexes of the ${side} board`, () => {
		assert.deepEqual(
			Object.keys(map.printed)
				.filter((key) => map.printed[key].clouds)
				.sort(),
			[...R77_HEXES[side]].sort()
		);
		for (const key of map.hexes) {
			const [x, y] = windowOf(key);
			const pixels = windowOn(board, x, y);
			assert.equal(
				pixels.some((c) => CLOUD.has(/** @type {string} */ (c))),
				R77_HEXES[side].includes(key),
				`${side} ${key}`
			);
		}
	});

	test(`the volcano shows on large-map −1_3 only, on the ${side} board`, () => {
		const volcano = drawVolcano();
		for (const key of map.hexes) {
			const [x, y] = windowOf(key);
			const pixels = windowOn(board, x, y);
			const volcanic = [0, 1, 2, 3, 4, 5].some((k) =>
				shows(pixels, volcano, volcanoSpot(k))
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
