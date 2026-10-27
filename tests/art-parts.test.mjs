// Scene parts: each fills the area it promises, repeats for the same seed and paints only palette colours.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCanvas, seededRandom } from '../tools/art/painter.js';
import { PALETTE } from '../tools/art/palette.js';
import { drawSky } from '../tools/art/parts/sky.js';
import { drawSea } from '../tools/art/parts/sea.js';
import { drawTerrain } from '../tools/art/parts/terrain.js';
import { drawBuilding } from '../tools/art/parts/buildings.js';
import { drawFigure } from '../tools/art/parts/figures.js';
import { drawSmoke } from '../tools/art/parts/smoke.js';
import { drawClassical } from '../tools/art/parts/classical.js';
import { drawFactory } from '../tools/art/parts/factory.js';
import { drawSkyline } from '../tools/art/parts/skyline.js';
import { drawStreet } from '../tools/art/parts/street.js';
import { drawShip } from '../tools/art/parts/ship.js';
import { drawInterior } from '../tools/art/parts/interior.js';
import { drawBanner } from '../tools/art/parts/banner.js';
import { drawCrowd } from '../tools/art/parts/crowd.js';
import { drawWheel } from '../tools/art/parts/wheel.js';

const PALETTE_COLOURS = new Set(Object.values(PALETTE));
const SMOKE_TONES = ['smoke', 'steam'];
const CLASSICAL_ROOFS = ['pediment', 'flat'];
const SKYLINE_TIMES = ['night', 'dusk', 'day'];
const SKY_TIMES = ['night', 'day', 'dusk'];
const SEA_TIMES = ['night', 'day'];
const TERRAIN_KINDS = ['forest', 'mountain', 'desert', 'grassland'];
const BUILDING_KINDS = ['house', 'tower', 'wall'];
const INTERIOR_WALLS = ['plaster', 'stone', 'panel'];
const WINDOW = { x: 24, y: 10, w: 16, h: 20 };
const BANNER_KINDS = ['flag', 'hanging'];

/**
 * Lists the rows that are completely filled and the rows that are completely empty.
 * @param {import('../tools/art/painter.js').Canvas} canvas
 */
function rowStates(canvas) {
	const full = [];
	const empty = [];
	for (let y = 0; y < canvas.h; y++) {
		const row = canvas.p.slice(y * canvas.w, (y + 1) * canvas.w);
		if (row.every(Boolean)) {
			full.push(y);
		} else if (row.every((c) => c === null)) {
			empty.push(y);
		}
	}
	return { full, empty };
}

/** Builds [from, …, to]. */
function range(from, to) {
	return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** Every way the parts can be drawn, each on its own 64×64 canvas. `random` marks parts that take a random stream. */
const SAMPLES = [
	...SKY_TIMES.map((time) => ({
		label: `sky: ${time}`,
		random: true,
		draw: (c, random) =>
			drawSky(c, {
				time,
				horizon: 41,
				random,
				sparkles: [[8, 6]],
				moon: { x: 50, y: 10 },
			}),
	})),
	...SEA_TIMES.map((time) => ({
		label: `sea: ${time}`,
		random: true,
		draw: (c, random) => drawSea(c, { time, top: 42, random }),
	})),
	...TERRAIN_KINDS.map((kind) => ({
		label: `terrain: ${kind}`,
		random: true,
		draw: (c, random) => drawTerrain(c, { kind, top: 44, random }),
	})),
	...BUILDING_KINDS.map((kind) => ({
		label: `building: ${kind}`,
		random: false,
		draw: (c) => drawBuilding(c, { kind, x: 20, y: 50 }),
	})),
	{
		label: 'figure',
		random: false,
		draw: (c) => drawFigure(c, { x: 20, y: 50 }),
	},
	...SMOKE_TONES.map((tone) => ({
		label: `smoke: ${tone}`,
		random: false,
		draw: (c) => drawSmoke(c, { x: 20, y: 50, tone }),
	})),
	...CLASSICAL_ROOFS.map((roof) => ({
		label: `classical: ${roof}`,
		random: false,
		draw: (c) => drawClassical(c, { x: 8, y: 50, width: 40, roof }),
	})),
	{
		label: 'factory',
		random: false,
		draw: (c) => drawFactory(c, { x: 8, y: 50, width: 44 }),
	},
	{
		label: 'street',
		random: false,
		draw: (c) => drawStreet(c, { top: 44 }),
	},
	...SKYLINE_TIMES.map((time) => ({
		label: `skyline: ${time}`,
		random: true,
		draw: (c, random) => drawSkyline(c, { base: 50, time, random }),
	})),
	{
		label: 'ship: 3 masts',
		random: false,
		draw: (c) => drawShip(c, { x: 8, y: 50, flag: PALETTE.brickRed }),
	},
	{
		label: 'ship: 1 mast',
		random: false,
		draw: (c) => drawShip(c, { x: 8, y: 50, masts: 1 }),
	},
	...BANNER_KINDS.map((kind) => ({
		label: `banner: ${kind}`,
		random: false,
		draw: (c) =>
			drawBanner(c, {
				kind,
				x: 20,
				y: 50,
				cloth: PALETTE.brickRed,
				device: PALETTE.gold,
			}),
	})),
	{
		label: 'crowd',
		random: true,
		draw: (c, random) => drawCrowd(c, { x: 4, y: 50, count: 9, random }),
	},
	{
		label: 'wheel',
		random: false,
		draw: (c) => drawWheel(c, { x: 32, y: 32, r: 10 }),
	},
	...INTERIOR_WALLS.map((wall) => ({
		label: `interior: ${wall}`,
		random: true,
		draw: (c, random) =>
			drawInterior(c, {
				floor: 44,
				random,
				wall,
				window: { ...WINDOW, time: 'night' },
			}),
	})),
];

/** Draws one sample with a seed. */
function render(sample, seed) {
	const c = createCanvas(64, 64);
	sample.draw(c, seededRandom(seed));
	return c;
}

test('every sky time fills every pixel down to its horizon', () => {
	for (const time of SKY_TIMES) {
		const c = createCanvas(64, 64);
		drawSky(c, { time, horizon: 41, random: seededRandom(1) });
		assert.deepEqual(
			rowStates(c),
			{ full: range(0, 41), empty: range(42, 63) },
			time
		);
	}
});

test('every sea time fills every pixel from its top row down', () => {
	for (const time of SEA_TIMES) {
		const c = createCanvas(64, 64);
		drawSea(c, { time, top: 42, random: seededRandom(1) });
		assert.deepEqual(
			rowStates(c),
			{ full: range(42, 63), empty: range(0, 41) },
			time
		);
	}
});

test('a street fills every pixel from its top row down and nothing above', () => {
	const c = createCanvas(64, 64);
	drawStreet(c, { top: 44 });
	assert.deepEqual(rowStates(c), {
		full: range(44, 63),
		empty: range(0, 43),
	});
});

test('every terrain kind fills every pixel from its top row down', () => {
	for (const kind of TERRAIN_KINDS) {
		const c = createCanvas(64, 64);
		drawTerrain(c, { kind, top: 44, random: seededRandom(1) });
		const { full } = rowStates(c);
		for (const y of range(44, 63)) {
			assert.ok(full.includes(y), `${kind}: row ${y} is not filled`);
		}
	}
});

test('buildings and the figure draw only inside the box they return', () => {
	const pieces = [
		...BUILDING_KINDS.map((kind) => ({
			label: kind,
			draw: (c) => drawBuilding(c, { kind, x: 20, y: 50 }),
		})),
		{ label: 'figure', draw: (c) => drawFigure(c, { x: 20, y: 50 }) },
		{
			label: 'figure facing left',
			draw: (c) => drawFigure(c, { x: 20, y: 50, facing: 'left' }),
		},
		...CLASSICAL_ROOFS.map((roof) => ({
			label: `classical: ${roof}`,
			draw: (c) => drawClassical(c, { x: 20, y: 50, width: 36, roof }),
		})),
		{
			label: 'factory',
			draw: (c) => drawFactory(c, { x: 20, y: 50, width: 40 }),
		},
		{
			label: 'ship',
			draw: (c) => drawShip(c, { x: 20, y: 50, flag: PALETTE.gold }),
		},
		{
			label: 'ship facing left',
			draw: (c) => drawShip(c, { x: 20, y: 50, facing: 'left' }),
		},
		...BANNER_KINDS.flatMap((kind) => [
			{
				label: `banner: ${kind}`,
				draw: (c) =>
					drawBanner(c, { kind, x: 20, y: 50, cloth: PALETTE.pine }),
			},
			{
				label: `banner: ${kind} flying left`,
				draw: (c) =>
					drawBanner(c, {
						kind,
						x: 20,
						y: 50,
						cloth: PALETTE.pine,
						facing: 'left',
					}),
			},
		]),
		{
			label: 'crowd',
			draw: (c) =>
				drawCrowd(c, {
					x: 20,
					y: 50,
					count: 6,
					random: seededRandom(1),
				}),
		},
		{
			label: 'wheel',
			draw: (c) => drawWheel(c, { x: 27, y: 43, r: 7 }),
		},
	];
	for (const piece of pieces) {
		const c = createCanvas(64, 64);
		const box = piece.draw(c);
		assert.equal(box.x, 20, `${piece.label}: box.x`);
		assert.equal(box.y + box.h - 1, 50, `${piece.label}: bottom row`);
		c.p.forEach((colour, i) => {
			if (colour) {
				const x = i % c.w;
				const y = Math.floor(i / c.w);
				const within =
					x >= box.x &&
					x < box.x + box.w &&
					y >= box.y &&
					y < box.y + box.h;
				assert.ok(
					within,
					`${piece.label}: pixel (${x}, ${y}) is outside its box`
				);
			}
		});
		assert.ok(c.p.some(Boolean), `${piece.label}: drew nothing`);
	}
});

test('a wider building fills a wider box', () => {
	for (const kind of BUILDING_KINDS) {
		const narrow = drawBuilding(createCanvas(64, 64), {
			kind,
			x: 2,
			y: 50,
		});
		const wide = drawBuilding(createCanvas(64, 64), {
			kind,
			x: 2,
			y: 50,
			width: narrow.w + 6,
		});
		assert.equal(wide.w, narrow.w + 6, kind);
	}
});

test('a figure facing left is the mirror of one facing right', () => {
	const right = createCanvas(64, 64);
	const left = createCanvas(64, 64);
	const box = drawFigure(right, { x: 20, y: 50 });
	drawFigure(left, { x: 20, y: 50, facing: 'left' });
	for (let y = box.y; y < box.y + box.h; y++) {
		for (let dx = 0; dx < box.w; dx++) {
			assert.equal(
				left.p[y * 64 + box.x + dx],
				right.p[y * 64 + box.x + box.w - 1 - dx],
				`(${dx}, ${y})`
			);
		}
	}
});

test('a ship facing left is the mirror of one facing right', () => {
	const right = createCanvas(64, 64);
	const left = createCanvas(64, 64);
	const box = drawShip(right, { x: 20, y: 50, flag: PALETTE.gold });
	drawShip(left, { x: 20, y: 50, facing: 'left', flag: PALETTE.gold });
	for (let y = box.y; y < box.y + box.h; y++) {
		for (let dx = 0; dx < box.w; dx++) {
			assert.equal(
				left.p[y * 64 + box.x + dx],
				right.p[y * 64 + box.x + box.w - 1 - dx],
				`(${dx}, ${y})`
			);
		}
	}
});

test('a furled ship keeps its box but rolls its sails up under the yards', () => {
	const set = createCanvas(64, 64);
	const furled = createCanvas(64, 64);
	const options = { x: 8, y: 50, sails: PALETTE.brickRed };
	const setBox = drawShip(set, options);
	const furledBox = drawShip(furled, { ...options, furled: true });
	assert.deepEqual(furledBox, setBox);
	const count = (c) =>
		c.p.filter(
			(colour) =>
				colour === PALETTE.brickRed || colour === PALETTE.brickRedShade
		).length;
	assert.ok(count(furled) > 0, 'no furled canvas');
	assert.ok(
		count(furled) * 3 < count(set),
		`furled ${count(furled)} vs set ${count(set)} sail pixels`
	);
});

test('a ship has the sail colour it is given and one mast per mast asked for', () => {
	const red = createCanvas(64, 64);
	drawShip(red, { x: 8, y: 50, sails: PALETTE.brickRed });
	assert.ok(red.p.includes(PALETTE.brickRed), 'no red sails');
	const one = drawShip(createCanvas(64, 64), { x: 8, y: 50, masts: 1 });
	const three = drawShip(createCanvas(64, 64), { x: 8, y: 50, masts: 3 });
	assert.ok(one.w < three.w, `1 mast: ${one.w} wide, 3 masts: ${three.w}`);
});

test('an interior fills every pixel', () => {
	for (const wall of INTERIOR_WALLS) {
		const c = createCanvas(64, 64);
		drawInterior(c, { floor: 44, random: seededRandom(2), wall });
		assert.ok(c.p.every(Boolean), wall);
	}
});

test('floorboards keep their joints in line along each plank', () => {
	const floor = 44;
	const c = createCanvas(64, 64);
	drawInterior(c, { floor, random: seededRandom(2), wall: 'plaster' });
	const joints = (y) =>
		range(0, 63).filter((x) => c.p[y * 64 + x] === PALETTE.floorShade);
	// Each plank after the shaded first one is two board rows and a seam row.
	for (let top = floor + 3; top + 1 < 64; top += 3) {
		assert.deepEqual(joints(top + 1), joints(top), `plank at row ${top}`);
	}
});

test('an interior window shows the sky of its time', () => {
	const ramps = {
		day: ['daySky1', 'daySky2', 'daySky3', 'daySky4', 'daySky5', 'daySky6'],
		night: [
			'nightSky1',
			'nightSky2',
			'nightSky3',
			'nightSky4',
			'nightSky5',
			'nightSky6',
		],
	};
	for (const [time, other] of [
		['day', 'night'],
		['night', 'day'],
	]) {
		const c = createCanvas(64, 64);
		drawInterior(c, {
			floor: 44,
			random: seededRandom(2),
			window: { ...WINDOW, time },
		});
		const pane = [];
		for (let y = WINDOW.y; y < WINDOW.y + WINDOW.h; y++) {
			for (let x = WINDOW.x; x < WINDOW.x + WINDOW.w; x++) {
				pane.push(c.p[y * 64 + x]);
			}
		}
		const has = (name) => pane.includes(PALETTE[name]);
		assert.ok(
			ramps[time].some(has),
			`${time}: no ${time} sky in the window`
		);
		assert.ok(
			!ramps[other].some(has),
			`${time}: ${other} sky in the window`
		);
	}
});

test('a banner flies its cloth colour, and its device only when given one', () => {
	for (const kind of BANNER_KINDS) {
		const plain = createCanvas(64, 64);
		const marked = createCanvas(64, 64);
		const options = { kind, x: 20, y: 50, cloth: PALETTE.pine };
		drawBanner(plain, options);
		drawBanner(marked, { ...options, device: PALETTE.cream });
		assert.ok(plain.p.includes(PALETTE.pine), `${kind}: no cloth`);
		assert.ok(
			!plain.p.includes(PALETTE.cream),
			`${kind}: a device unasked`
		);
		assert.ok(marked.p.includes(PALETTE.cream), `${kind}: no device`);
	}
});

test('a banner flying left is the mirror of one flying right', () => {
	for (const kind of BANNER_KINDS) {
		const right = createCanvas(64, 64);
		const left = createCanvas(64, 64);
		const options = { kind, x: 20, y: 50, cloth: PALETTE.pine };
		const box = drawBanner(right, options);
		drawBanner(left, { ...options, facing: 'left' });
		for (let y = box.y; y < box.y + box.h; y++) {
			for (let dx = 0; dx < box.w; dx++) {
				assert.equal(
					left.p[y * 64 + box.x + dx],
					right.p[y * 64 + box.x + box.w - 1 - dx],
					`${kind} (${dx}, ${y})`
				);
			}
		}
	}
});

test('a crowd widens with each person in it', () => {
	const random = seededRandom(1);
	const three = drawCrowd(createCanvas(64, 64), {
		x: 2,
		y: 50,
		count: 3,
		random,
	});
	const six = drawCrowd(createCanvas(64, 64), {
		x: 2,
		y: 50,
		count: 6,
		random,
	});
	assert.ok(six.w > three.w, `3: ${three.w} wide, 6: ${six.w}`);
});

test('a wheel has a rim all round and as many spokes as it is given', () => {
	const count = (spokes) => {
		const c = createCanvas(64, 64);
		drawWheel(c, { x: 32, y: 32, r: 12, spokes, spoke: PALETTE.timber });
		return c.p.filter((colour) => colour === PALETTE.timber).length;
	};
	assert.ok(count(8) > count(4), `8 spokes: ${count(8)}, 4: ${count(4)}`);
	assert.ok(count(4) > 0, 'no spokes');
	const c = createCanvas(64, 64);
	drawWheel(c, { x: 32, y: 32, r: 12 });
	for (const [x, y] of [
		[32, 20],
		[32, 44],
		[20, 32],
		[44, 32],
	]) {
		assert.ok(c.p[y * 64 + x], `no rim at (${x}, ${y})`);
	}
});

test('every part draws the same pixels for the same seed', () => {
	for (const sample of SAMPLES) {
		assert.deepEqual(render(sample, 3), render(sample, 3), sample.label);
	}
});

test('parts that take a random stream use it', () => {
	for (const sample of SAMPLES.filter((s) => s.random)) {
		assert.notDeepEqual(render(sample, 3), render(sample, 4), sample.label);
	}
});

test('parts draw only palette colours', () => {
	for (const sample of SAMPLES) {
		const strays = new Set(
			render(sample, 5).p.filter((c) => c && !PALETTE_COLOURS.has(c))
		);
		assert.deepEqual([...strays], [], sample.label);
	}
});

test('parts refuse kinds and times they do not know', () => {
	const c = createCanvas(8, 8);
	const random = seededRandom(1);
	assert.throws(
		() => drawSky(c, { time: 'noon', horizon: 4, random }),
		/noon/
	);
	assert.throws(() => drawSea(c, { time: 'dusk', top: 4, random }), /dusk/);
	assert.throws(
		() => drawTerrain(c, { kind: 'swamp', top: 4, random }),
		/swamp/
	);
	assert.throws(
		() => drawBuilding(c, { kind: 'castle', x: 0, y: 7 }),
		/castle/
	);
	assert.throws(() => drawSmoke(c, { x: 4, y: 7, tone: 'fog' }), /fog/);
	assert.throws(
		() => drawClassical(c, { x: 0, y: 7, width: 8, roof: 'dome' }),
		/dome/
	);
	assert.throws(
		() => drawSkyline(c, { base: 7, time: 'noon', random }),
		/noon/
	);
	assert.throws(() => drawShip(c, { x: 0, y: 7, facing: 'up' }), /up/);
	assert.throws(() => drawShip(c, { x: 0, y: 7, masts: 4 }), /4/);
	assert.throws(
		() => drawInterior(c, { floor: 6, random, wall: 'glass' }),
		/glass/
	);
	assert.throws(
		() => drawBanner(c, { kind: 'kite', x: 0, y: 7, cloth: PALETTE.pine }),
		/kite/
	);
	assert.throws(
		() =>
			drawBanner(c, {
				kind: 'flag',
				x: 0,
				y: 7,
				cloth: PALETTE.pine,
				facing: 'up',
			}),
		/up/
	);
	assert.throws(() => drawCrowd(c, { x: 0, y: 7, count: 0, random }), /0/);
	assert.throws(() => drawWheel(c, { x: 4, y: 4, r: 1 }), /radius/);
	assert.throws(
		() =>
			drawInterior(c, {
				floor: 6,
				random,
				window: { x: 1, y: 1, w: 3, h: 3, time: 'noon' },
			}),
		/noon/
	);
});

test('a skyline stands on its base row and stays below its height', () => {
	for (const time of SKYLINE_TIMES) {
		const c = createCanvas(64, 64);
		drawSkyline(c, { base: 50, time, random: seededRandom(2), height: 20 });
		const { full } = rowStates(c);
		assert.ok(full.includes(50), `${time}: the base row is not continuous`);
		c.p.forEach((colour, i) => {
			const y = Math.floor(i / 64);
			if (colour) {
				assert.ok(y >= 30 && y <= 50, `${time}: pixel on row ${y}`);
			}
		});
	}
});

test('a classical front has a column per requested column', () => {
	const c = createCanvas(64, 64);
	drawClassical(c, { x: 4, y: 60, width: 50, columns: 6 });
	// Count the lit left edges of the columns along one row of the colonnade.
	const row = 50;
	let columns = 0;
	for (let x = 4; x < 54; x++) {
		if (c.p[row * 64 + x] === PALETTE.creamLight) {
			columns++;
		}
	}
	assert.equal(columns, 6);
});

test('smoke rises from its source and drifts the way it is told', () => {
	for (const drift of [1, -1]) {
		const c = createCanvas(64, 64);
		drawSmoke(c, { x: 32, y: 50, tone: 'smoke', puffs: 3, drift });
		const filled = c.p
			.map((colour, i) => (colour ? i : -1))
			.filter((i) => i >= 0);
		assert.ok(filled.length > 0, `drift ${drift}: drew nothing`);
		for (const i of filled) {
			assert.ok(
				Math.floor(i / 64) <= 50,
				`drift ${drift}: smoke below its source`
			);
		}
		const meanX =
			filled.reduce((sum, i) => sum + (i % 64), 0) / filled.length;
		assert.ok(
			drift > 0 ? meanX > 32 : meanX < 32,
			`drift ${drift}: smoke leans the wrong way (mean x ${meanX})`
		);
	}
});

test('every palette colour is lowercase #rrggbb', () => {
	for (const [name, colour] of Object.entries(PALETTE)) {
		assert.match(colour, /^#[0-9a-f]{6}$/, name);
	}
});
