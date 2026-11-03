// The Islanders' mat on screen (#165): its hexes as a small map the World Map draws, and the keys tying them to the engine's mat hex ids.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { hexNeighbours } from '../src/lib/engine/data/maps.js';
import {
	CENTRE_KEY,
	hasMat,
	matId,
	matKey,
	matMapHexes,
	matPrompt,
} from '../src/lib/island-mat.js';
import { mapView } from '../src/lib/hexmap.js';
import { tabFor } from '../src/lib/area/tabs.js';
import { civCard } from '../src/lib/cards/civ-cards.js';
import {
	HEX_H,
	HEX_W,
	inHex,
	inIsland,
	slotOf,
	turnOf,
	wedgeOf,
} from '../src/lib/art/paint/hex.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { matchingSides, turned } from '../src/lib/engine/game.js';
import { mapArt } from '../src/lib/painted-map.js';
import {
	ISLANDERS_CENTRE,
	ISLANDERS_CENTRE_SLOTS,
} from '../src/lib/engine/island.js';

const empty = () => Array(6).fill(null);
const game = (/** @type {any[]} */ hexes) => ({
	seats: [
		{ seat: 1, civData: { islanders: { hexes } } },
		{ seat: 2, civData: {} },
	],
});

test('a mat hex id and the small map key name each other, and the centre has no id', () => {
	for (let position = 0; position < 6; position++) {
		const key = matKey(`mat:1:${position}`);
		assert.equal(key, hexNeighbours(CENTRE_KEY)[position]);
		assert.equal(
			matId(1, /** @type {string} */ (key)),
			`mat:1:${position}`
		);
	}
	assert.equal(matKey('2_-1'), null);
	assert.equal(matKey('mat:1:6'), null);
	assert.equal(matId(1, CENTRE_KEY), null);
});

test('only a seat that holds the mat has one', () => {
	assert.equal(hasMat(game(empty()), 1), true);
	assert.equal(hasMat(game(empty()), 2), false);
	assert.equal(hasMat(undefined, 1), false);
});

test('the mat is 7 hexes: the printed centre, then each position empty or with its tile turned', () => {
	const hexes = matMapHexes(
		game([{ tile: 17, orient: 1 }, ...empty().slice(1)]),
		1
	);
	assert.equal(hexes.length, 7);
	assert.deepEqual(hexes[0].corners, [...ISLANDERS_CENTRE]);
	assert.equal(hexes[0].key, CENTRE_KEY);
	assert.notEqual(hexes[1].corners, null);
	assert.deepEqual(hexes[1].island.length > 0, true);
	assert.deepEqual(
		hexes.slice(2).map((hex) => hex.corners),
		Array(5).fill(null)
	);
	assert.deepEqual(
		hexes.slice(1).map((hex) => hex.key),
		hexNeighbours(CENTRE_KEY)
	);
});

test('a tile on the mat carries its number for its benefit, and the printed centre and empty hexes carry none (#170)', () => {
	const hexes = matMapHexes(
		game([{ tile: 17, orient: 1 }, ...empty().slice(1)]),
		1
	);
	assert.deepEqual(
		hexes.map((hex) => hex.tile),
		[null, 17, null, null, null, null, null]
	);
});

test('the small map is laid out as the engine scores the mat: neighbours on the map are neighbours on the mat', () => {
	const hexes = matMapHexes(game(empty()), 1);
	const near = (/** @type {string} */ a, /** @type {string} */ b) => {
		const [p, q] = [a, b].map((key) =>
			hexes.find((hex) => hex.key === key)
		);
		const distance = Math.hypot(
			/** @type {any} */ (p).center[0] - /** @type {any} */ (q).center[0],
			/** @type {any} */ (p).center[1] - /** @type {any} */ (q).center[1]
		);
		return distance < 80 * 0.9 + 1; // one hex apart at size 40
	};
	const ring = hexNeighbours(CENTRE_KEY);
	for (let position = 0; position < 6; position++) {
		assert.ok(near(ring[position], CENTRE_KEY));
		assert.ok(near(ring[position], ring[(position + 1) % 6]));
		assert.ok(!near(ring[position], ring[(position + 3) % 6]));
	}
});

test('matPrompt keeps only the mat hexes of a prompt, under the small map keys', () => {
	const preview = { hex: 'mat:1:2', corners: [], island: [] };
	const small = matPrompt({
		targets: ['0_0', 'mat:1:0', 'mat:1:2'],
		scores: { 'mat:1:2': 3, '1_1': 5 },
		selected: 'mat:1:2',
		preview: /** @type {any} */ (preview),
	});
	const ring = hexNeighbours(CENTRE_KEY);
	assert.deepEqual(small.targets, [ring[0], ring[2]]);
	assert.deepEqual(small.scores, { [ring[2]]: 3 });
	assert.equal(small.selected, ring[2]);
	assert.equal(small.preview?.hex, ring[2]);
	const none = matPrompt({
		targets: ['1_1'],
		scores: {},
		selected: '1_1',
		preview: /** @type {any} */ ({ hex: '1_1', corners: [], island: [] }),
	});
	assert.deepEqual(
		[none.targets, none.selected, none.preview],
		[[], null, null]
	);
});

test('the World Map takes the mat as its hexes: a lit empty hex is outlined and the others dim', () => {
	const hexes = matMapHexes(game(empty()), 1);
	const ring = hexNeighbours(CENTRE_KEY);
	const drawn = mapView(hexes, {
		targets: [ring[1]],
		scores: { [ring[1]]: 2 },
		selected: null,
		preview: null,
		fresh: [],
	});
	assert.equal(drawn.length, 7);
	assert.ok(drawn.find((hex) => hex.key === ring[1])?.outlined);
});

test('an explore onto the Islanders mat opens the Civ tab; an ordinary explore opens nothing by itself', () => {
	assert.equal(tabFor({ kind: 'chooseExplore', mat: true }), 'civ');
	assert.equal(
		tabFor({ kind: 'chooseExplore' }),
		tabFor({ kind: 'chooseExplore', mat: false })
	);
	assert.notEqual(tabFor({ kind: 'chooseExplore' }), 'civ');
});

test('the Islanders card is the wide stage with its mat over the portrait; no other card is', () => {
	assert.equal(civCard('islanders').stage, 'island');
	assert.equal(civCard('aliens').stage, undefined);
	assert.equal(civCard('islanders').art.endsWith('civ/islanders.svg'), true);
});

test('the centre is painted as it scores: four equal quarters, three slots of each terrain, in order', () => {
	const centre = matMapHexes(game(empty()), 1)[0];
	const slots = /** @type {string[]} */ (centre.slots);
	assert.equal(slots.length, 12);
	assert.deepEqual(mapArt([centre])[0].slots, slots);
	/** @type {Record<string, number>} */
	const area = {};
	for (let y = 0; y < HEX_H; y++) {
		for (let x = 0; x < HEX_W; x++) {
			if (inHex(x, y)) {
				const terrain = slots[slotOf(x, y)];
				area[terrain] = (area[terrain] ?? 0) + 1;
			}
		}
	}
	const sizes = Object.values(area);
	assert.deepEqual(Object.keys(area).sort(), [
		'desert',
		'forest',
		'grassland',
		'mountain',
	]);
	assert.ok(
		Math.max(...sizes) - Math.min(...sizes) <= 0.03 * Math.max(...sizes),
		JSON.stringify(area)
	);
});

/** Every pixel of a hex's picture, off its island. */
const HEX_PIXELS = Array.from({ length: HEX_W * HEX_H }, (_, i) => ({
	x: i % HEX_W,
	y: Math.floor(i / HEX_W),
})).filter(({ x, y }) => inHex(x, y) && !inIsland(x, y));

test('half-sides are how every territory is drawn: an ordinary tile painted by its 12 halves is the same picture as by its 6 corner wedges', () => {
	for (const tile of TERRITORY_TILES) {
		// Side e's first half shows corner e, its second half corner e + 1.
		const halves = Array.from(
			{ length: 12 },
			(_, s) => tile.corners[Math.ceil(s / 2) % 6]
		);
		for (const { x, y } of HEX_PIXELS) {
			assert.equal(
				halves[slotOf(x, y)],
				tile.corners[wedgeOf(x, y)],
				`tile ${tile.id} at ${x},${y}`
			);
		}
	}
});

test('the centre scores what it shows: a tile matches a side of it exactly when the terrain it puts there is drawn along that side', () => {
	const state = {
		seats: [
			{
				seat: 1,
				kind: 'player',
				civData: { islanders: { hexes: empty() } },
			},
		],
	};
	// The pixels on the centre's rim, by the side they lie along, kept clear of the corners.
	const rim = HEX_PIXELS.filter(
		({ x, y }) =>
			!inHex(x + 1, y) ||
			!inHex(x - 1, y) ||
			!inHex(x, y + 1) ||
			!inHex(x, y - 1)
	);
	for (let side = 0; side < 6; side++) {
		const drawn = new Set(
			rim
				.filter(({ x, y }) => {
					const along = turnOf(x, y) - side;
					return along > 0.1 && along < 0.9;
				})
				.map(({ x, y }) => ISLANDERS_CENTRE_SLOTS[slotOf(x, y)])
		);
		// The ring hex across this side faces it with its corners side + 3 and side + 4.
		for (const terrain of ['mountain', 'grassland', 'forest', 'desert']) {
			const facing = TERRITORY_TILES.flatMap((tile) =>
				[0, 1, 2, 3, 4, 5]
					.filter((orient) => {
						const corners = turned(tile.corners, orient);
						return (
							corners[(side + 3) % 6] === terrain &&
							corners[(side + 4) % 6] === terrain
						);
					})
					.map((orient) => ({ tile: tile.id, orient }))
			)[0];
			assert.ok(facing, `a tile with ${terrain} on both facing corners`);
			assert.equal(
				matchingSides(
					/** @type {any} */ (state),
					`mat:1:${side}`,
					facing.tile,
					facing.orient
				),
				drawn.has(terrain) ? 1 : 0,
				`side ${side} (drawn: ${[...drawn]}), ${terrain}`
			);
		}
	}
});

test('the centre is the four quarters: mountain top-left, grassland top-right, forest bottom-right, desert bottom-left', () => {
	// Pixels well inside each quarter of the 64×56 picture.
	const at = (/** @type {number} */ x, /** @type {number} */ y) =>
		ISLANDERS_CENTRE_SLOTS[slotOf(x, y)];
	assert.equal(at(20, 14), 'mountain');
	assert.equal(at(44, 14), 'grassland');
	assert.equal(at(44, 42), 'forest');
	assert.equal(at(20, 42), 'desert');
});
