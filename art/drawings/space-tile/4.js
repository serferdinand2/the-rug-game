// Space tile 4: a canyon wall carved with a great frieze of alien pictures, stars and spirals, six-legged long-necked beasts and a procession of figures, lit by a huge low red sun.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {[number, number]} Point */

/** Where the wall's face ends, roughly: its broken end is lit by the sun for a few columns beyond. */
const WALL_END = 43;
const END_FACE = 3;

/** The canyon floor's first row, below the wall. */
const FLOOR = 56;

/** The red giant: its centre and radius, low over the far mesas beyond the wall's end. */
const SUN = { x: 60, y: 32, r: 18 };

/** The horizon behind the mesas. */
const HORIZON = 50;

/**
 * One of the frieze's three bands, a channel cut back into the rock: its right column and its top and bottom rows.
 * Each runs on off the left edge of the picture.
 * @typedef {{ right: number, top: number, bottom: number }} Band
 */

/** @type {Band[]} The sky band, the beasts' band and the procession's band, from the top down. */
const BANDS = [
	{ right: 39, top: 9, bottom: 19 },
	{ right: 39, top: 23, bottom: 36 },
	{ right: 39, top: 40, bottom: 51 },
];

/** The dusk-red sky of the red giant's world, from the top down to the glow at the horizon. */
const SKY = [
	mix(C.duskSky1, C.night, 0.45),
	mix(C.duskSky1, C.night, 0.15),
	mix(C.duskSky1, C.duskSky2, 0.5),
	C.duskSky2,
	mix(C.duskSky3, C.brickRedShade, 0.3),
	mix(C.duskSky3, C.brickRed, 0.35),
	mix(C.duskSky4, C.brickRed, 0.35),
];

/** The red giant's disc: a dim, swollen star, darker towards its rim, mottled, with dark spots. */
const SUN_HOT = mix(C.brickRedLight, C.duskSky6, 0.85);
const SUN_CORE = mix(C.brickRedLight, C.duskSky6, 0.55);
const SUN_MID = mix(C.brickRedLight, C.duskSky5, 0.4);
const SUN_RIM = mix(C.brickRed, C.duskSky4, 0.35);
const SUN_SPOT = mix(C.brickRed, C.brickRedShade, 0.45);
const SUN_SPOT_CORE = mix(C.brickRedShade, C.roofShade, 0.3);

/** The far mesas against the sun, and their sunlit rims. */
const MESA = mix(C.duskSky2, C.brickRedShade, 0.55);
const MESA_RIM = mix(C.brickRed, C.duskSky4, 0.4);
const MESA_FAR = mix(MESA, C.brickRed, 0.3);
const MESA_NEAR = mix(C.duskSky1, C.brickRedShade, 0.45);

/**
 * The canyon's rose-red rock in the red sun's raking light: the face, warmer towards the sun, its darker strata,
 * the varnish streaked down it, its shade, and the sunlit rim and end.
 */
const ROCK = mix(C.brickRed, C.duskSky4, 0.45);
const ROCK_COOL = mix(C.brickRed, C.duskSky3, 0.3);
const ROCK_WARM = mix(C.brickRedLight, C.duskSky4, 0.4);
const ROCK_STRATUM = mix(C.brickRed, C.duskSky3, 0.45);
const ROCK_DARK = mix(C.brickRedShade, C.duskSky2, 0.4);
const ROCK_PIT = mix(ROCK_STRATUM, ROCK_DARK, 0.5);
const ROCK_FLECK = mix(ROCK_WARM, C.duskSky6, 0.4);
const VARNISH = mix(C.brickRedShade, C.roofShade, 0.5);
const ROCK_LIT = mix(C.brickRedLight, C.duskSky6, 0.5);
const ROCK_GLARE = mix(C.duskSky6, C.lampGlow, 0.35);

/** A dark alien lichen in the rock's cracks, catching a little light. */
const LICHEN = mix(C.ghostShade, C.roofShade, 0.45);
const LICHEN_LIT = mix(C.ghostShade, C.duskSky5, 0.35);

/**
 * The frieze: its channels cut back into the rock, their lit lower and shaded upper steps, and the pictures raised
 * from them, rose with bright gold edges where the sun catches them from the right.
 */
const FIELD = mix(C.brickRedShade, C.roofShade, 0.3);
const FIELD_SHADOW = mix(C.roofShade, C.brickRedShade, 0.3);
const FIELD_STEP = mix(C.brickRedLight, C.duskSky5, 0.3);
const RELIEF = mix(C.brickRed, C.duskSky5, 0.65);
const RELIEF_TOP = mix(C.duskSky5, C.duskSky6, 0.55);
const RELIEF_LIT = mix(C.duskSky6, C.lampGlow, 0.4);
const RELIEF_GLINT = mix(C.lampGlow, C.white, 0.2);
const RELIEF_LOW = mix(C.brickRed, C.duskSky4, 0.6);

/** The canyon floor in the wall's shadow, its stones lit on their sunward sides, their long shadows. */
const FLOOR_DARK = mix(C.brickRedShade, C.roofShade, 0.45);
const FLOOR_MID = mix(C.brickRedShade, C.duskSky3, 0.35);
const FLOOR_LIT = mix(C.brickRed, C.duskSky5, 0.4);
const FLOOR_SHADOW = mix(C.roofShade, C.night, 0.4);
const FLOOR_WARM = mix(FLOOR_MID, FLOOR_LIT, 0.5);

/** Red sand blown into a drift along the wall's foot, its crest catching the light reflected off the wall. */
const DRIFT = mix(C.brickRedShade, C.duskSky4, 0.45);
const DRIFT_CREST = mix(C.brickRed, C.duskSky5, 0.55);

/** The pictures, one key per raised pixel. The beasts walk towards the sun; so does the procession. */
const COMET = [
	'#.........',
	'.##.......',
	'...####.##',
	'....#######',
	'.....####.',
	'........#.',
];
const GALAXY = [
	'...######....',
	'..#......#...',
	'.#...###.#...',
	'....#####....',
	'...#.###...#.',
	'...#......#..',
	'....######...',
];
const CRESCENT = ['#......', '##.....', '###...#', '.######', '..####.'];

/** Single stars scattered between the pictures, at no even spacing. */
const STARS = /** @type {Point[]} */ ([
	[15, 11],
	[16, 17],
	[31, 17],
	[34, 16],
	[38, 17],
	[12, 18],
]);
const BEAST = [
	'.............###',
	'............####',
	'............##..',
	'...........##...',
	'...........##...',
	'..........##....',
	'...#######......',
	'.##########.....',
	'############....',
	'#.##########....',
	'..##.##.##.##...',
	'..##.##.##.##...',
	'..#..#...#..#...',
];
const CALF = [
	'.........##',
	'........###',
	'........#..',
	'.......##..',
	'...#####...',
	'.#######...',
	'########...',
	'.#.#.#.#...',
	'.#.#.#.#...',
];

/**
 * The procession, seen side on: a bent figure under a load, a bearer steadying a basin on its head, a child
 * reaching for the hand of a figure with its arms raised to the sun, and the leader with a ring on its staff.
 */
const BURDENED = [
	'..##....',
	'.####...',
	'.#####..',
	'..######',
	'...###.#',
	'...###..',
	'...####.',
	'..#..#..',
	'.#...#..',
];
const BASIN_BEARER = [
	'.####.',
	'..##..',
	'..##.#',
	'..####',
	'.####.',
	'.###..',
	'..###.',
	'.####.',
	'.#..#.',
	'#...#.',
];
const CHILD = ['.##.', '###.', '.#..', '####', '.##.', '.##.', '#..#'];
const RAISED = [
	'.....#',
	'....#.',
	'..###.',
	'.###..',
	'..##..',
	'..###.',
	'.####.',
	'.###..',
	'.###..',
	'.#.#..',
	'#...#.',
];
const LEADER = [
	'.....###',
	'.....#.#',
	'..##.###',
	'.####.#.',
	'..###.#.',
	'...#.##.',
	'..####..',
	'.###..#.',
	'.###..#.',
	'.#..#.#.',
	'#....##.',
];

/** The crack running down the wall from its rim, between the pictures. */
const CRACK = /** @type {Point[]} */ ([
	[31, 2],
	[30, 8],
	[31, 13],
	[30, 20],
	[26, 25],
	[18, 31],
	[15, 38],
]);

/**
 * Draws space tile 4.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(40413);

	drawRedSky(layer);
	drawSun(layer, random);
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: SUN.r + 12,
		colour: C.brickRedLight,
		strength: 0.35,
		steps: 3,
		skip: [SUN_HOT, SUN_CORE, SUN_MID, SUN_RIM, SUN_SPOT, SUN_SPOT_CORE],
	});
	drawMesas(layer);

	const wall = createCanvas(64, 64);
	drawWall(wall, random);
	drawFrieze(wall);
	drawCrack(wall);
	drawSpall(wall, random);
	drawLichen(wall, random);
	outline(wall, C.ink);
	underlay(wall, layer);

	const floor = createCanvas(64, 64);
	drawFloor(floor);
	underlay(floor, wall);
	return floor;
}

/**
 * The dusk-red sky, banded down to the glow round the horizon, with a few faint stars.
 * @param {Canvas} layer
 */
function drawRedSky(layer) {
	for (let y = 0; y < 64; y++) {
		const t = Math.min(1, y / HORIZON) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.7 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
	for (const [x, y] of [
		[50, 3],
		[57, 8],
		[62, 2],
		[47, 10],
	]) {
		set(layer, x, y, C.starDim);
	}
}

/**
 * The red giant, huge and low: its disc darkening towards the rim, mottled with great cells, with dark spots.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSun(layer, random) {
	for (let y = SUN.y - SUN.r; y <= SUN.y + SUN.r; y++) {
		for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y) / SUN.r;
			if (d > 1) {
				continue;
			}
			const dither = (x + y) % 2 === 0;
			const cell =
				Math.sin(x * 0.9 + Math.sin(y * 0.7) * 2) +
					Math.sin(y * 1.1 - x * 0.4) >
				1.3;
			let colour = cell ? SUN_MID : d < 0.32 ? SUN_HOT : SUN_CORE;
			if (d > 0.9 || (d > 0.84 && dither)) {
				colour = SUN_RIM;
			} else if (d > 0.64 || (d > 0.56 && dither)) {
				colour = SUN_MID;
			}
			set(layer, x, y, colour);
		}
	}
	// One great straggling group of dark spots, drawn out along the disc, and a scatter of small ones.
	paint(
		layer,
		50,
		25,
		[
			'.ss.......',
			'sccs......',
			'sccss.....',
			'.ssss.s...',
			'...sssss..',
			'....scss..',
			'.....sss.s',
			'.......ss.',
		],
		{ s: SUN_SPOT, c: SUN_SPOT_CORE }
	);
	for (let i = 0; i < 4; i++) {
		const x = SUN.x - 13 + Math.floor(random() * 12);
		const y = SUN.y - 12 + Math.floor(random() * 22);
		set(layer, x, y, SUN_SPOT);
	}
}

/**
 * Flat-topped mesas far off on the horizon, dark against the lower part of the sun, their tops rimmed with its light,
 * and a nearer, darker ridge below them.
 * @param {Canvas} layer
 */
function drawMesas(layer) {
	/** @type {[number, number, number, Colour][]} Each mesa's left column, right column, top row and colour. */
	const mesas = [
		[44, 50, 46, MESA_FAR],
		[40, 52, 44, MESA],
		[51, 57, 47, MESA],
		[56, 64, 42, MESA],
	];
	for (const [left, right, top, colour] of mesas) {
		for (let x = left; x < right; x++) {
			const slope = Math.min(x - left, right - 1 - x);
			const y0 = top + Math.max(0, 2 - slope);
			for (let y = y0; y < 64; y++) {
				set(layer, x, y, y === y0 ? MESA_RIM : colour);
			}
		}
	}
	// A farther mesa, paler in the sun's haze, between the near ones.
	for (let x = 52; x < 58; x++) {
		for (let y = 44; y < 47; y++) {
			set(layer, x, y, y === 44 ? MESA_RIM : MESA_FAR);
		}
	}
	for (let x = 0; x < 64; x++) {
		const ridge = HORIZON + Math.round(Math.sin(x * 0.4) * 0.8);
		for (let y = ridge; y < 64; y++) {
			set(layer, x, y, MESA_NEAR);
		}
	}
}

/** How far the wall's broken end juts out or falls back on each row, from the top down: a ragged edge. */
const END_JAGS = [
	0, 0, 0, 1, 1, 1, 1, 2, 2, 1, 1, 1, 0, 0, -1, -1, -1, 0, 0, 0, 1, 1, 1, 1,
	1, 0, 0, 0, -1, -2, -2, -1, -1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, -1, 0, 0,
	0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
];

/**
 * Where the wall's broken end lies on a row.
 * @param {number} y
 * @returns {number}
 */
function endAt(y) {
	return WALL_END + (END_JAGS[y] ?? 0);
}

/**
 * The canyon wall: rose-red rock in horizontal strata, warming towards the sun, streaked with dark varnish
 * from its broken rim, and its ragged end face blazing in the sunlight.
 * @param {Canvas} wall
 * @param {() => number} random
 */
function drawWall(wall, random) {
	/** @type {number[]} The rim's row at each column. */
	const rim = [];
	let top = 3;
	for (let x = 0; x < 64; x++) {
		top = Math.max(1, Math.min(6, top + Math.floor(random() * 3) - 1));
		rim.push(
			x >= WALL_END - 4 ? Math.max(top, 3 + (x - WALL_END + 4) * 2) : top
		);
	}
	for (let y = 0; y < FLOOR + 2; y++) {
		const end = endAt(y);
		for (let x = 0; x < end + END_FACE; x++) {
			if (y < rim[x]) {
				continue;
			}
			const stratum =
				Math.floor((y + Math.sin(x * 0.3) * 0.8) / 4) % 3 === 0;
			// The face warms towards the sun at the wall's end.
			const warm = x > 31 + (y % 3) * 2 || (x > 27 && (x + y) % 2 === 0);
			const cool = x < 6 + (y % 3) || (x < 10 && (x + y) % 2 === 0);
			let colour = stratum
				? ROCK_STRATUM
				: warm
					? ROCK_WARM
					: cool
						? ROCK_COOL
						: ROCK;
			if (y === rim[x]) {
				colour = ROCK_LIT;
			}
			if (x >= end) {
				colour =
					x === end + END_FACE - 1
						? C.lampGlow
						: stratum
							? ROCK_LIT
							: ROCK_GLARE;
			}
			set(wall, x, y, colour);
		}
	}
	// Desert varnish: dark streaks running down from the rim where water once seeped over it.
	for (let i = 0; i < 9; i++) {
		const x = Math.floor(random() * (WALL_END - 4));
		const length = 4 + Math.floor(random() * 12);
		for (let y = rim[x] + 1; y < rim[x] + length; y++) {
			if (!inBand(x, y)) {
				set(wall, x, y, (y + x) % 3 === 0 ? ROCK_DARK : VARNISH);
			}
		}
	}
	// Pits and pale flecks in the sandstone.
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * (WALL_END - 1));
		const y = 2 + Math.floor(random() * (FLOOR - 3));
		const behind = get(wall, x, y);
		if (behind === ROCK || behind === ROCK_WARM || behind === ROCK_COOL) {
			set(wall, x, y, i % 3 === 0 ? ROCK_FLECK : ROCK_PIT);
		} else if (behind === ROCK_STRATUM) {
			set(wall, x, y, ROCK_PIT);
		}
	}
	// The shade along the wall's foot.
	for (let x = 0; x < endAt(FLOOR); x++) {
		set(wall, x, FLOOR - 1, ROCK_DARK);
		set(wall, x, FLOOR, VARNISH);
		set(wall, x, FLOOR + 1, VARNISH);
	}
}

/**
 * Tells whether a pixel lies inside one of the frieze's bands.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inBand(x, y) {
	return BANDS.some(
		({ right, top, bottom }) =>
			x >= 0 && x <= right && y >= top && y <= bottom
	);
}

/**
 * The frieze: each band cut back into the rock, its pictures standing out in low relief.
 * The sun rakes in from the right, so each picture's right edge is bright and its top edge catches the light.
 * @param {Canvas} wall
 */
function drawFrieze(wall) {
	const relief = createCanvas(64, 64);
	const keys = { '#': RELIEF };
	const [sky, beasts, people] = BANDS;

	// The sky, scattered as on a real rock face rather than set out in a row: a comet streaming away
	// from the sun, a two-armed spiral of stars, a crescent, and single stars between them.
	paint(relief, 5, sky.top + 1, COMET, keys);
	paint(relief, 17, sky.top + 2, GALAXY, keys);
	paint(relief, 32, sky.top + 1, CRESCENT, keys);
	for (const [x, y] of STARS) {
		set(relief, x, y, RELIEF);
	}

	// The beasts, walking towards the sun: the neck of one coming in from the left, a calf, and a great six-legged beast.
	paint(relief, -12, beasts.top, BEAST, keys);
	paint(relief, 6, beasts.top + 2, CALF, keys);
	paint(relief, 20, beasts.top, BEAST, keys);

	// The procession, towards the sun, each figure standing on the band's floor: a bent figure under its load,
	// half lost where the rock has broken away, a bearer with a basin on its head, a child holding the hand
	// of a figure with its arms raised, and the leader with the ring on its staff.
	const feet = people.bottom - 1;
	for (const [sprite, x] of /** @type {[string[], number][]} */ ([
		[BURDENED, 1],
		[BASIN_BEARER, 10],
		[CHILD, 18],
		[RAISED, 22],
		[LEADER, 31],
	])) {
		paint(relief, x, feet - sprite.length + 1, sprite, keys);
	}

	for (const band of BANDS) {
		for (let y = band.top; y <= band.bottom; y++) {
			for (let x = 0; x <= band.right; x++) {
				let colour = FIELD;
				if (y === band.bottom) {
					colour = FIELD_STEP;
				} else if (x >= band.right - 1 || y === band.top) {
					colour = FIELD_SHADOW;
				}
				set(wall, x, y, colour);
			}
		}
	}
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!get(relief, x, y) || !inBand(x, y)) {
				continue;
			}
			let colour = RELIEF;
			if (!get(relief, x + 1, y) && !get(relief, x, y - 1)) {
				colour = RELIEF_GLINT;
			} else if (!get(relief, x + 1, y)) {
				colour = RELIEF_LIT;
			} else if (!get(relief, x, y - 1)) {
				colour = RELIEF_TOP;
			} else if (!get(relief, x - 1, y)) {
				colour = RELIEF_LOW;
			}
			set(wall, x, y, colour);
		}
	}
}

/**
 * A crack running down the wall from its rim, dark, its right lip catching the sun.
 * @param {Canvas} wall
 */
function drawCrack(wall) {
	for (let i = 1; i < CRACK.length; i++) {
		const [x0, y0] = CRACK[i - 1];
		const [x1, y1] = CRACK[i];
		const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let k = 0; k <= steps; k++) {
			const x = Math.round(x0 + ((x1 - x0) * k) / steps);
			const y = Math.round(y0 + ((y1 - y0) * k) / steps);
			set(wall, x, y, VARNISH);
			if (get(wall, x + 1, y) !== VARNISH) {
				set(wall, x + 1, y, inBand(x + 1, y) ? FIELD_STEP : ROCK_LIT);
			}
		}
	}
}

/**
 * A slab spalled away from the lower left of the frieze, leaving raw rock where part of the procession once was.
 * @param {Canvas} wall
 * @param {() => number} random
 */
function drawSpall(wall, random) {
	for (let y = 45; y <= 55; y++) {
		const reach = 2 + Math.round((y - 45) * 0.5 + random() * 1.5);
		for (let x = 0; x < reach; x++) {
			const edge = x === reach - 1;
			set(
				wall,
				x,
				y,
				edge ? ROCK_LIT : (x + y) % 3 === 0 ? VARNISH : ROCK_DARK
			);
		}
	}
}

/**
 * Patches of dark lichen along the crack and the wall's foot.
 * @param {Canvas} wall
 * @param {() => number} random
 */
function drawLichen(wall, random) {
	for (const [cx, cy] of [
		[31, 5],
		[16, 38],
		[34, 54],
	]) {
		for (let i = 0; i < 4; i++) {
			const x = cx + Math.floor(random() * 4) - 1;
			const y = cy + Math.floor(random() * 3) - 1;
			if (get(wall, x, y) && !inBand(x, y)) {
				set(wall, x, y, i % 3 === 0 ? LICHEN_LIT : LICHEN);
			}
		}
	}
}

/**
 * The canyon floor in the wall's shadow: dark red grit, stones fallen from the wall lit on their sunward sides,
 * their long shadows reaching left, and the sunlit ground beyond the wall's end.
 * @param {Canvas} floor
 */
function drawFloor(floor) {
	for (let y = FLOOR + 2; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				floor,
				x,
				y,
				(x * 7 + y * 3) % 13 === 0 ? FLOOR_MID : FLOOR_DARK
			);
		}
		const light = endAt(FLOOR) + END_FACE + (y - FLOOR);
		for (let x = light; x < 64; x++) {
			set(
				floor,
				x,
				y,
				(x + y) % 3 === 0
					? FLOOR_LIT
					: x === light
						? FLOOR_MID
						: FLOOR_WARM
			);
		}
	}
	// The drift along the wall's foot, highest at the middle of the wall.
	for (let x = 0; x < endAt(FLOOR) + 1; x++) {
		const height = Math.round(
			2 + Math.sin((x / endAt(FLOOR)) * Math.PI) * 1.6
		);
		for (let y = FLOOR + 2 - height; y <= FLOOR + 2; y++) {
			set(floor, x, y, y === FLOOR + 2 - height ? DRIFT_CREST : DRIFT);
		}
	}
	for (const [x, y, w] of [
		[4, 59, 4],
		[11, 61, 2],
		[30, 60, 3],
		[37, 58, 2],
	]) {
		rect(floor, x - 6, y + 1, 6, 1, FLOOR_SHADOW);
		rect(floor, x, y, w, 2, FLOOR_MID);
		set(floor, x + w - 1, y, FLOOR_LIT);
		set(floor, x + w - 1, y + 1, FLOOR_LIT);
	}
}
