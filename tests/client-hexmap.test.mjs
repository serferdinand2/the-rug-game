// The World Map's geometry (#26): hex positions and corners, terrain wedges, the island, the pieces and the fit.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	HEX_SIZE,
	coastLines,
	cornerWedge,
	fitBox,
	hexCenter,
	hexCorner,
	hexName,
	hexPicture,
	islandParts,
	mapHexes,
	overlayBox,
	pieceSpots,
	svgPoints,
} from '../src/lib/hexmap.js';
import {
	askedSeats,
	createGame,
	defaultAction,
	play,
	view,
} from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { HEX_SIDES, MAPS } from '../src/lib/engine/data/maps.js';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { turned } from '../src/lib/engine/terrain.js';

const S = 40;
const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

/**
 * A dealt game with setup answered, so the start outposts stand, seen by seat 1.
 * @param {number} players
 * @param {number} [seed]
 */
function dealtView(players, seed = 3) {
	const random = seededRandom(seed);
	let state = createGame({
		players: NAMES.slice(0, players).map((name) => ({ name })),
		version: 'current',
		random,
	});
	while (state.phase === 'setup') {
		const seat = askedSeats(state)[0];
		state = play(
			state,
			seat,
			/** @type {any} */ (defaultAction(state, seat)),
			random
		);
	}
	return view(state, 1);
}

/**
 * @param {[number, number]} a
 * @param {[number, number]} b
 */
function near(a, b, epsilon = 1e-9) {
	return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon;
}

/** @param {[number, number][]} points */
function area(points) {
	let sum = 0;
	points.forEach(([x, y], i) => {
		const [nx, ny] = points[(i + 1) % points.length];
		sum += x * ny - nx * y;
	});
	return Math.abs(sum) / 2;
}

/**
 * Whether a point is inside a convex polygon (or on its edge).
 * @param {[number, number]} point
 * @param {[number, number][]} polygon
 */
function inside([px, py], polygon) {
	let sign = 0;
	for (let i = 0; i < polygon.length; i++) {
		const [ax, ay] = polygon[i];
		const [bx, by] = polygon[(i + 1) % polygon.length];
		const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
		if (Math.abs(cross) < 1e-9) {
			continue;
		}
		if (sign === 0) {
			sign = Math.sign(cross);
		} else if (Math.sign(cross) !== sign) {
			return false;
		}
	}
	return true;
}

/** @param {[number, number]} center */
function hexPolygon(center, size = S) {
	return [0, 1, 2, 3, 4, 5].map((k) => hexCorner(center, k, size));
}

test('hex a_b sits at x = 1.5·s·(b − a), y = (√3/2)·s·(a + b)', () => {
	assert.deepEqual(hexCenter('0_0', S), [0, 0]);
	const [x, y] = hexCenter('-1_2', S);
	assert.ok(Math.abs(x - 1.5 * S * 3) < 1e-9);
	assert.ok(Math.abs(y - (Math.sqrt(3) / 2) * S) < 1e-9);
});

test('corner 0 is the top-left vertex, and the corners run clockwise', () => {
	const corners = hexPolygon([0, 0]);
	assert.ok(near(corners[0], [-S / 2, (-Math.sqrt(3) / 2) * S]));
	assert.ok(near(corners[1], [S / 2, (-Math.sqrt(3) / 2) * S]));
	assert.ok(near(corners[2], [S, 0]));
	assert.ok(near(corners[5], [-S, 0]));
});

test('side e of every hex faces its neighbour at HEX_SIDES[e]', () => {
	for (const side of [MAPS.large, MAPS.small]) {
		for (const key of side.hexes) {
			const center = hexCenter(key, S);
			const [a, b] = key.split('_').map(Number);
			HEX_SIDES.forEach(([da, db], e) => {
				const other = hexCenter(`${a + da}_${b + db}`, S);
				const from = hexCorner(center, e, S);
				const to = hexCorner(center, (e + 1) % 6, S);
				const middle = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
				// The side's midpoint lies on the line between the two centres, halfway.
				assert.ok(
					near(/** @type {[number, number]} */ (middle), [
						(center[0] + other[0]) / 2,
						(center[1] + other[1]) / 2,
					]),
					`${key} side ${e}`
				);
				// And the neighbour's opposite side is the same edge.
				assert.ok(near(from, hexCorner(other, (e + 4) % 6, S)));
				assert.ok(near(to, hexCorner(other, (e + 3) % 6, S)));
			});
		}
	}
});

test('start 1 of the large map is the topmost start, and the starts run clockwise', () => {
	const starts = CAPITAL_MATS.map((mat) => hexCenter(mat.start.large, S));
	const top = Math.min(...starts.map(([, y]) => y));
	assert.equal(starts[0][1], top);
	assert.ok(Math.abs(starts[0][0]) < 1e-9, 'start 1 is in the middle');
	// Clockwise from straight up, with y pointing down.
	const angles = starts.map(([x, y]) => {
		const angle = Math.atan2(x, -y);
		return angle < -1e-9 ? angle + 2 * Math.PI : angle;
	});
	for (let i = 1; i < angles.length; i++) {
		assert.ok(angles[i] > angles[i - 1], `start ${i + 1}`);
	}
});

test('the six corner wedges tile the hex', () => {
	const center = hexCenter('2_-1', S);
	const wedges = [0, 1, 2, 3, 4, 5].map((k) => cornerWedge(center, k, S));
	for (const [k, wedge] of wedges.entries()) {
		assert.equal(wedge.length, 4);
		assert.ok(near(wedge[0], center));
		assert.ok(near(wedge[2], hexCorner(center, k, S)));
	}
	const total = wedges.reduce((sum, wedge) => sum + area(wedge), 0);
	assert.ok(Math.abs(total - area(hexPolygon(center))) < 1e-6);
});

test('the island is a small hexagon in the middle, split among its terrains', () => {
	const center = hexCenter('0_0', S);
	const parts = islandParts(
		center,
		['desert', 'forest', 'grassland', 'mountain'],
		S
	);
	assert.deepEqual(
		parts.map((part) => part.terrain),
		['desert', 'forest', 'grassland', 'mountain']
	);
	const total = parts.reduce((sum, part) => sum + area(part.points), 0);
	const small = area(hexPolygon(center, 0.42 * S));
	assert.ok(Math.abs(total - small) < 1e-6);
	assert.equal(islandParts(center, ['sea'], S).length, 1);
	assert.deepEqual(islandParts(center, [], S), []);
});

test('mapHexes on a dealt 4-player game gives 61 hexes, 25 explored, and the start outposts', () => {
	const game = dealtView(4);
	const hexes = mapHexes(game);
	assert.equal(hexes.length, 61);
	assert.equal(hexes.filter((hex) => hex.corners !== null).length, 25);
	for (const hex of hexes) {
		assert.deepEqual(hex.center, hexCenter(hex.key, HEX_SIZE));
		if (hex.corners === null) {
			assert.deepEqual(hex.island, []);
			assert.match(hex.label, /unexplored/);
		}
	}
	for (const seat of game.seats) {
		const start =
			CAPITAL_MATS[/** @type {number} */ (seat.capital?.mat) - 1].start
				.large;
		const hex = /** @type {any} */ (hexes.find((h) => h.key === start));
		assert.deepEqual(hex.outposts, [
			{ seat: seat.seat, toppled: false, piece: null },
			{ seat: seat.seat, toppled: false, piece: null },
		]);
		assert.match(hex.label, new RegExp(`${seat.name}: 2 outposts`));
	}
});

test('a printed territory is turned by its orient, and the middle island keeps its four terrains', () => {
	const hexes = mapHexes(dealtView(4));
	const turnedHex = /** @type {any} */ (hexes.find((h) => h.key === '3_0'));
	const printed = MAPS.large.printed['3_0'];
	assert.deepEqual(
		turnedHex.corners,
		turned(printed.corners, printed.orient)
	);
	const middle = /** @type {any} */ (hexes.find((h) => h.key === '0_0'));
	assert.deepEqual(middle.island, [
		'desert',
		'forest',
		'grassland',
		'mountain',
	]);
	assert.match(
		middle.label,
		/^Hex 0,0: sea, with an island of desert, forest, grassland and mountain, with clouds\.$/
	);
});

test('the small map has 34 hexes, 13 explored', () => {
	const hexes = mapHexes(dealtView(3));
	assert.equal(hexes.length, 34);
	assert.equal(hexes.filter((hex) => hex.corners !== null).length, 13);
});

test('a toppled outpost keeps toppled, and pieces and tokens are named', () => {
	const game = dealtView(2);
	const hex = game.hexes['0_0'];
	hex.outposts.push(
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 2, toppled: false, piece: { building: 'farm' } },
		{ seat: 2, toppled: true, piece: { landmark: 'lighthouse' } },
		{ seat: 2, toppled: false, piece: { landmark: 'tv-station' } }
	);
	hex.tokens.push({ seat: 1, civ: 'traders' });
	const middle = /** @type {any} */ (
		mapHexes(game).find((h) => h.key === '0_0')
	);
	assert.deepEqual(middle.outposts, [
		{ seat: 1, toppled: true, piece: null },
		{ seat: 2, toppled: false, piece: { kind: 'building', id: 'farm' } },
		{
			seat: 2,
			toppled: true,
			piece: { kind: 'landmark', id: 'lighthouse' },
		},
		{
			seat: 2,
			toppled: false,
			piece: { kind: 'landmark', id: 'tv-station' },
		},
	]);
	assert.deepEqual(middle.tokens, [{ seat: 1, civ: 'traders' }]);
	assert.equal(
		middle.label,
		'Hex 0,0: sea, with an island of desert, forest, grassland and mountain, with clouds. ' +
			'Ana: 1 toppled outpost, a Traders token. ' +
			'Bo: a Farm, a toppled Lighthouse, a TV Station.'
	);
});

test('hexes are named by their axial key, with true minus signs', () => {
	assert.equal(hexName('2_-1'), '2,−1');
	assert.equal(hexName('0_0'), '0,0');
});

test('points become an SVG points attribute, rounded to hundredths', () => {
	assert.equal(
		svgPoints([
			[0, -34.64101615],
			[20.007, 1 / 3],
		]),
		'0,-34.64 20.01,0.33'
	);
});

test('pieces sit side by side inside their hex, below an island', () => {
	for (const count of [1, 2, 3, 4, 5, 6]) {
		for (const island of [false, true]) {
			const center = hexCenter('1_2', S);
			const spots = pieceSpots(center, count, island, S);
			assert.equal(spots.length, count);
			const hex = hexPolygon(center);
			for (const spot of spots) {
				const half = spot.size / 2;
				for (const point of [
					[spot.x - half, spot.y - half],
					[spot.x + half, spot.y - half],
					[spot.x + half, spot.y + half],
					[spot.x - half, spot.y + half],
				]) {
					assert.ok(
						inside(/** @type {[number, number]} */ (point), hex),
						`${count} pieces, island ${island}`
					);
				}
				if (island) {
					// Below the island's small hexagon.
					assert.ok(
						spot.y - half >=
							center[1] + 0.42 * S * (Math.sqrt(3) / 2)
					);
				}
			}
			// Side by side, without overlapping.
			for (let i = 1; i < spots.length; i++) {
				assert.equal(spots[i].y, spots[0].y);
				assert.ok(spots[i].x - spots[i - 1].x >= spots[i].size);
			}
		}
	}
});

test('fitBox holds every hex with a small margin', () => {
	const hexes = mapHexes(dealtView(5));
	const box = fitBox(hexes, HEX_SIZE);
	const corners = hexes.flatMap((hex) => hexPolygon(hex.center, HEX_SIZE));
	const xs = corners.map(([x]) => x);
	const ys = corners.map(([, y]) => y);
	const margin = HEX_SIZE / 4;
	assert.ok(box.x <= Math.min(...xs) && box.x >= Math.min(...xs) - margin);
	assert.ok(box.y <= Math.min(...ys) && box.y >= Math.min(...ys) - margin);
	assert.ok(box.x + box.width >= Math.max(...xs));
	assert.ok(box.x + box.width <= Math.max(...xs) + margin);
	assert.ok(box.y + box.height >= Math.max(...ys));
	assert.ok(box.y + box.height <= Math.max(...ys) + margin);
	assert.deepEqual(fitBox([], HEX_SIZE), { x: 0, y: 0, width: 0, height: 0 });
});

test('hexes know their clouds and volcano from the tile or printed territory (R77)', () => {
	const game = dealtView(2);
	const hexes = mapHexes(game);
	const byKey = Object.fromEntries(hexes.map((hex) => [hex.key, hex]));
	// A printed R77 hex on the small map.
	assert.equal(byKey['-3_-3'].clouds, true);
	assert.equal(byKey['-3_-3'].volcano, false);
	// An unexplored hex has neither.
	const fog = hexes.find((hex) => hex.corners === null);
	assert.ok(fog);
	assert.equal(fog.clouds, false);
	assert.equal(fog.volcano, false);
	// A placed tile 47 has the volcano; tile 1 has clouds.
	game.hexes[fog.key].tile = 47;
	game.hexes[fog.key].orient = 0;
	const placed = mapHexes(game).find((hex) => hex.key === fog.key);
	assert.equal(placed?.volcano, true);
	assert.equal(placed?.clouds, false);
	game.hexes[fog.key].tile = 1;
	assert.equal(
		mapHexes(game).find((hex) => hex.key === fog.key)?.clouds,
		true
	);
});

test('the coast runs along the radius between a sea wedge and a land wedge', () => {
	const c = /** @type {[number, number]} */ ([10, 20]);
	// Sea in corners 2 and 3 only: coasts after corner 1 (side 1) and after corner 3 (side 3).
	const lines = coastLines(
		c,
		['desert', 'desert', 'sea', 'sea', 'forest', 'forest'],
		S
	);
	assert.equal(lines.length, 2);
	assert.ok(near(lines[0].from, c));
	const side1 = [hexCorner(c, 1, S), hexCorner(c, 2, S)];
	assert.ok(
		near(lines[0].to, [
			(side1[0][0] + side1[1][0]) / 2,
			(side1[0][1] + side1[1][1]) / 2,
		])
	);
	assert.equal(
		coastLines(c, ['sea', 'sea', 'sea', 'sea', 'sea', 'sea'], S).length,
		0
	);
	assert.equal(
		coastLines(
			c,
			['sea', 'forest', 'forest', 'forest', 'forest', 'forest'],
			S
		).length,
		2
	);
});

test('a hex picture covers the hex, centred on it', () => {
	const box = hexPicture([5, 7], S);
	assert.equal(box.width, 2 * S);
	assert.ok(Math.abs(box.height - Math.sqrt(3) * S) < 1e-9);
	assert.ok(Math.abs(box.x + box.width / 2 - 5) < 1e-9);
	assert.ok(Math.abs(box.y + box.height / 2 - 7) < 1e-9);
});

test("an overlay's box on a hex: its spot in the 64×56 picture, scaled to the hex", () => {
	/** @param {number} a @param {number} b */
	const near = (a, b) => Math.abs(a - b) < 1e-9;
	// The picture's 56 rows span the hex's √3·size height, as hexPicture lays it.
	for (const size of [32, 40]) {
		const across = (2 * size) / 64;
		const down = (Math.sqrt(3) * size) / 56;
		const box = overlayBox([21, 2], [22, 12], size);
		assert.ok(near(box.x, -size + 21 * across), `x at ${size}`);
		assert.ok(
			near(box.y, (-Math.sqrt(3) / 2) * size + 2 * down),
			`y at ${size}`
		);
		assert.ok(near(box.width, 22 * across), `width at ${size}`);
		assert.ok(near(box.height, 12 * down), `height at ${size}`);
	}
});

test('a hex with clouds or the volcano says so to a screen reader (R77)', () => {
	const hexes = mapHexes(dealtView(3));
	const cloudy = hexes.find((h) => h.key === '-3_-3');
	assert.match(cloudy?.label ?? '', /with clouds/);
	const plain = hexes.find((h) => h.key === '1_-1');
	assert.doesNotMatch(plain?.label ?? '', /clouds|volcano/);
	const large = mapHexes(dealtView(4));
	assert.match(
		large.find((h) => h.key === '-1_3')?.label ?? '',
		/with a volcano/
	);
});
