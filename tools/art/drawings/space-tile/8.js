// Space tile 8: the night side of a planet, its continent scattered with the gold lights of cities, thickest round a blazing capital at the head of a gulf, along a river and down one coast, a thin blue crescent of dawn on its rim and the sun about to rise over it.
import {
	createCanvas,
	get,
	set,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A direction out of the planet's centre, as a unit vector: x to the right, y down the frame, z towards the viewer.
 * @typedef {{ x: number, y: number, z: number }} Normal
 */

/**
 * A point on screen, as [column, row].
 * @typedef {[number, number]} Point
 */

/** The planet: its centre, below the frame, and its radius. */
const PLANET = { x: 26, y: 74, r: 50 };

/** Where the sun waits behind the rim: an angle round the planet's centre, with the frame's y pointing down. */
const DAWN = (-58 * Math.PI) / 180;
const DAWN_X = Math.cos(DAWN);
const DAWN_Y = Math.sin(DAWN);

/** How much of the sunlight already reaches past the rim; the rest still comes from behind the planet. */
const SUNRISE = 0.3;

/** The sunlight's direction: towards the dawn point and mostly away from the viewer. */
const SUN = {
	x: SUNRISE * DAWN_X,
	y: SUNRISE * DAWN_Y,
	z: -Math.sqrt(1 - SUNRISE ** 2),
};

/** The sun's centre, just above the rim. */
const SUN_AT = {
	x: Math.round(PLANET.x + (PLANET.r + 0.5) * DAWN_X),
	y: Math.round(PLANET.y + (PLANET.r + 0.5) * DAWN_Y),
};

/** The capital, on the shore at the head of the continent's gulf, where the river meets the sea. */
const CAPITAL = { x: 34, y: 46 };

/** The river, winding across the western lobe down to the capital. */
const RIVER = /** @type {Point[]} */ ([
	[13, 36],
	[16, 38],
	[18, 41],
	[21, 43],
	[25, 44],
	[28, 46],
	[31, 46],
	[34, 46],
]);

/** The one lit coast: the eastern lobe's shore along the gulf. */
const COAST = { left: 35, right: 46, top: 31, bottom: 48 };

/** Small towns out in the country. */
const TOWNS = /** @type {Point[]} */ ([
	[47, 39],
	[50, 46],
	[44, 53],
	[24, 53],
	[17, 48],
	[30, 58],
]);

/** Three dim roads: round the gulf's head to the east, south from the capital, and north from the river to a port. */
const ROADS = /** @type {Point[][]} */ ([
	[
		[34, 46],
		[40, 50],
		[45, 51],
		[50, 46],
	],
	[
		[34, 46],
		[30, 51],
		[26, 56],
	],
	[
		[18, 41],
		[17, 37],
		[15, 34],
	],
]);

/** The continent's heart: the direction its land rises round. */
const HEARTLAND = unit({ x: 0.05, y: -0.52, z: 0.85 });

/** Deep space, from the top of the frame down towards the rim. */
const SPACE = [
	mix(C.ink, C.night, 0.4),
	C.night,
	mix(C.night, C.nightSky2, 0.6),
	mix(C.nightSky2, C.nightSky3, 0.4),
];

/** A faint band of the galaxy across the dark, so space is not flat: its tint and its line, as row = slope × column + offset. */
const BAND = mix(C.night, C.roof, 0.5);
const BAND_LINE = { slope: -0.45, offset: 22, half: 5 };

/** Starlight in three brightnesses. */
const STARS = [mix(C.starDim, C.nightSky2, 0.5), C.starDim, C.white];

/** The night sea, darkest at the rim. */
const SEA = {
	rim: mix(C.ink, C.nightSea3, 0.3),
	main: mix(C.ink, C.nightSea3, 0.55),
	pale: mix(C.night, C.nightSea3, 0.8),
};

/** Night clouds over the sea, faintly grey. */
const CLOUD = [
	mix(SEA.main, C.stoneShade, 0.35),
	mix(SEA.pale, C.stoneMid, 0.4),
];

/** The night land, warmer than the sea, with darker uplands and a faintly lit shore. */
const LAND = {
	rim: mix(C.ink, C.wood, 0.55),
	main: mix(C.ink, mix(C.wood, C.headland, 0.5), 0.8),
	pale: mix(C.wood, C.headlandRidge, 0.3),
	upland: mix(C.ink, C.wood, 0.65),
	shore: mix(C.timber, C.headlandRidge, 0.5),
};

/** The twilight band inside the dawn, then the crescent from the terminator out to the rim. */
const TWILIGHT = mix(C.nightSky3, C.nightSea2, 0.55);
const DAWN_EDGE = mix(C.duskSky5, C.amber, 0.4);
const DAWN_SEA = C.daySea2;
const DAWN_LAND = C.daySky3;
const DAWN_BRIGHT = C.daySky6;

/** The air on the rim: white-blue at the dawn, blue beside it, then a dim violet airglow round the night side. */
const AIR = [
	C.foam,
	C.daySky4,
	C.daySky1,
	mix(C.nightSea2, C.nightSky4, 0.5),
	mix(C.nightSky3, C.nightSea3, 0.5),
];

/** The red line of sunrise along the foot of the air nearest the sun. */
const AIR_RED = mix(C.duskSky5, C.amber, 0.5);

/** The sun's flare, from its hot centre out. */
const FLARE = [
	C.lampGlow,
	mix(C.lampGlow, C.gold, 0.6),
	mix(C.gold, C.amber, 0.7),
];

/** City lights in three brightnesses, the faint thread of a road, and the capital's white-hot heart. */
const LIGHT = {
	road: mix(C.timber, C.amber, 0.45),
	dim: mix(C.amber, C.timberLight, 0.3),
	main: C.gold,
	bright: C.lampGlow,
	core: C.white,
};

/** The colours the capital's warm glow leaves alone: the lights, the sea and its clouds. */
const UNWARMED = [...Object.values(LIGHT), ...Object.values(SEA), ...CLOUD];

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws space tile 8.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(80818);
	drawSpace(layer, random);

	// The planet has no ink outline: its rim is the air, lit blue where the dawn comes.
	const planet = createCanvas(64, 64);
	drawSurface(planet);
	drawRoads(planet);
	drawLights(planet, random);
	drawCapital(planet);
	glow(planet, {
		x: CAPITAL.x,
		y: CAPITAL.y,
		radius: 7,
		colour: C.amber,
		strength: 0.35,
		steps: 2,
		skip: UNWARMED,
	});
	underlay(planet, layer);

	drawAir(planet);
	drawSun(planet);
	return planet;
}

/**
 * Scales a vector to unit length.
 * @param {Normal} v
 * @returns {Normal}
 */
function unit({ x, y, z }) {
	const n = Math.hypot(x, y, z);
	return { x: x / n, y: y / n, z: z / n };
}

/**
 * The planet's surface direction under a pixel, or null off the disc.
 * @param {number} x
 * @param {number} y
 * @returns {Normal | null}
 */
function normalAt(x, y) {
	const nx = (x + 0.5 - PLANET.x) / PLANET.r;
	const ny = (y + 0.5 - PLANET.y) / PLANET.r;
	const flat = nx * nx + ny * ny;
	if (flat >= 1) {
		return null;
	}
	return { x: nx, y: ny, z: Math.sqrt(1 - flat) };
}

/**
 * How squarely a direction round the planet faces the dawn point: 1 straight at it.
 * @param {number} dx
 * @param {number} dy
 * @returns {number}
 */
function facing(dx, dy) {
	return (dx * DAWN_X + dy * DAWN_Y) / Math.hypot(dx, dy);
}

/**
 * How brightly the sun lights a point: above 0 is day, below it night. The crescent is drawn
 * thinning faster than sunlight would, so it fades out along the rim instead of running round it.
 * @param {Normal} n
 * @returns {number}
 */
function sunlight(n) {
	const light = n.x * SUN.x + n.y * SUN.y + n.z * SUN.z;
	return light - 1.2 * (1 - facing(n.x, n.y));
}

/**
 * How far a point rises above the sea: land above 0. An invented continent, two lobes round a deep gulf,
 * made of a few rolling waves over the heartland's dome.
 * @param {Normal} n
 * @returns {number}
 */
function elevation(n) {
	const dome =
		n.x * HEARTLAND.x + n.y * HEARTLAND.y + n.z * HEARTLAND.z - 0.9;
	return (
		dome * 4.5 +
		0.34 * Math.sin(8.1 * n.x - 5.3 * n.y + 0.3) +
		0.26 * Math.sin(6.3 * n.y + 10.1 * n.x + 1.7) +
		0.2 * Math.sin(13.7 * n.y - 9.4 * n.x + 2.4) +
		0.14 * Math.sin(21.1 * n.x + 15.3 * n.y + 0.9)
	);
}

/**
 * How thick the night's cloud is over a point: long streaks drawn out east to west.
 * @param {Normal} n
 * @returns {number}
 */
function cloudiness(n) {
	return (
		Math.sin(5.1 * n.x + 23.3 * n.y + 0.6) +
		0.7 * Math.sin(3.7 * n.x - 17.9 * n.y + 2.1) +
		0.5 * Math.sin(11.3 * n.x + 7.1 * n.y + 4.4)
	);
}

/**
 * Tells whether a pixel lies on land, on the night side, away from the rim.
 * @param {number} x
 * @param {number} y
 * @param {number} [rim=0.3] - How far from the rim, as the surface's tilt towards the viewer
 * @returns {boolean}
 */
function nightLand(x, y, rim = 0.3) {
	const n = normalAt(x, y);
	return Boolean(n && n.z > rim && sunlight(n) < -0.08 && elevation(n) > 0);
}

/**
 * Deep space: a dark gradient crossed by a faint band of the galaxy, stars in three brightnesses crowding along it, a few sparkles and the sun's glare.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y < 64; y++) {
		const t = Math.min(1, y / 36) * (SPACE.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SPACE.length && t - i > 0.55 && (x + y) % 2 === 0;
			const band = inBand(x, y);
			const tinted = band < 0.6 || (band < 1 && (x + y) % 2 === 0);
			set(layer, x, y, tinted ? BAND : dither ? SPACE[i + 1] : SPACE[i]);
		}
	}
	// Stars, crowded thickest along the band.
	for (let i = 0; i < 150; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 42);
		const bright = random();
		const keep = random() < (inBand(x, y) < 1 ? 0.75 : 0.28);
		if (keep) {
			set(layer, x, y, STARS[bright > 0.88 ? 2 : bright > 0.5 ? 1 : 0]);
		}
	}
	for (const [x, y] of [
		[12, 10],
		[29, 5],
		[44, 11],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of NEIGHBOURS) {
			set(layer, x + dx, y + dy, C.starDim);
		}
	}
	// The sun's glare, warm and wide, then hot and tight.
	glow(layer, {
		x: SUN_AT.x,
		y: SUN_AT.y,
		radius: 17,
		colour: C.amber,
		strength: 0.55,
		steps: 4,
	});
	glow(layer, {
		x: SUN_AT.x,
		y: SUN_AT.y,
		radius: 6,
		colour: C.lampGlow,
		strength: 0.7,
		steps: 2,
	});
}

/**
 * How far a pixel lies from the middle of the galaxy's band, in half-widths: below 1 is inside it.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function inBand(x, y) {
	const { slope, offset, half } = BAND_LINE;
	const wave = Math.sin(x * 0.3) * 1.2;
	return Math.abs(y - (slope * x + offset) - wave) / half;
}

/**
 * The disc: the night side's sea, clouds and land, the twilight band and the thin crescent of dawn.
 * @param {Canvas} planet
 */
function drawSurface(planet) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const n = normalAt(x, y);
			if (!n) {
				continue;
			}
			const light = sunlight(n);
			let colour;
			if (light > 0.07) {
				colour = DAWN_BRIGHT;
			} else if (light > 0.025) {
				colour = elevation(n) > 0 ? DAWN_LAND : DAWN_SEA;
			} else if (light > 0) {
				colour = DAWN_EDGE;
			} else if (light > -0.04) {
				colour = TWILIGHT;
			} else {
				colour = nightColour(x, y, n);
			}
			set(planet, x, y, colour);
		}
	}
}

/**
 * The night side under one point: sea with streaks of cloud, or land, darker towards the rim, the shore faintly lit.
 * @param {number} x
 * @param {number} y
 * @param {Normal} n
 * @returns {Colour}
 */
function nightColour(x, y, n) {
	const height = elevation(n);
	// The tones meet in a checkered seam, so the disc shades round without hard rings.
	const seam = (x + y) % 2 === 0 ? 0.025 : -0.025;
	const tone = n.z + seam < 0.32 ? 'rim' : n.z + seam > 0.8 ? 'pale' : 'main';
	if (height <= 0) {
		const cloud = cloudiness(n);
		if (cloud > 1.5 && tone !== 'rim') {
			return CLOUD[cloud > 1.85 ? 1 : 0];
		}
		return SEA[tone];
	}
	if (tone !== 'rim') {
		const shore = NEIGHBOURS.some(([dx, dy]) => {
			const m = normalAt(x + dx, y + dy);
			return m && elevation(m) <= 0;
		});
		if (shore) {
			return LAND.shore;
		}
	}
	if (height > 0.9 && tone !== 'rim') {
		return LAND.upland;
	}
	return LAND[tone];
}

/**
 * Tells whether a pixel may carry a light: well inside both a flat-topped and a pointy-topped hexagonal frame,
 * and between columns 10 and 54.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inFrame(x, y) {
	const dx = Math.min(x + 0.5, 63.5 - x);
	const dy = Math.min(y + 0.5, 63.5 - y);
	const flatTop = dx / 16 + dy / 32 >= 1.08;
	const pointyTop = dx / 32 + dy / 16 >= 1.08;
	return x >= 10 && x <= 54 && flatTop && pointyTop;
}

/**
 * How far a land pixel lies from the sea, up to 3 pixels.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function inland(x, y) {
	for (let r = 1; r <= 2; r++) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				const n = normalAt(x + dx, y + dy);
				if (n && elevation(n) <= 0) {
					return r;
				}
			}
		}
	}
	return 3;
}

/**
 * How far a pixel lies from a line of points.
 * @param {number} x
 * @param {number} y
 * @param {Point[]} points
 * @returns {number}
 */
function distanceTo(x, y, points) {
	let best = Infinity;
	for (let i = 1; i < points.length; i++) {
		const [ax, ay] = points[i - 1];
		const [bx, by] = points[i];
		const length = (bx - ax) ** 2 + (by - ay) ** 2;
		const t = Math.max(
			0,
			Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length)
		);
		best = Math.min(
			best,
			Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay))
		);
	}
	return best;
}

/**
 * How likely a land pixel is to be lit, from 0 to below 1: thickest round the capital, along the river and the gulf coast,
 * in knots round the towns, and a sprinkle of farms everywhere else.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function density(x, y) {
	const capital = (x - CAPITAL.x) ** 2 + (y - CAPITAL.y) ** 2;
	let lit = 0.95 * Math.exp(-capital / 6) + 0.35 * Math.exp(-capital / 40);
	lit += 0.6 * Math.exp(-(distanceTo(x, y, RIVER) ** 2) / 1.2);
	const { left, right, top, bottom } = COAST;
	if (x >= left && x <= right && y >= top && y <= bottom) {
		const shore = inland(x, y);
		lit += shore === 1 ? 0.38 : shore === 2 ? 0.22 : 0;
	}
	for (const [tx, ty] of TOWNS) {
		lit += 0.6 * Math.exp(-((x - tx) ** 2 + (y - ty) ** 2) / 2.2);
	}
	return Math.min(0.9, lit + 0.035);
}

/**
 * The city lights: single pixels scattered over the land by how built-up it is, the busiest places brightest.
 * @param {Canvas} planet
 * @param {() => number} random
 */
function drawLights(planet, random) {
	for (let y = 26; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const roll = random();
			const tone = random();
			if (!nightLand(x, y, 0.4) || !inFrame(x, y)) {
				continue;
			}
			const lit = density(x, y);
			if (roll >= lit) {
				continue;
			}
			let colour = LIGHT.dim;
			if (tone < lit * 0.4) {
				colour = LIGHT.bright;
			} else if (tone < 0.2 + lit * 0.45) {
				colour = LIGHT.main;
			}
			set(planet, x, y, colour);
		}
	}
}

/**
 * The three roads: dim amber threads, broken every few pixels, and gone where they cross water.
 * @param {Canvas} planet
 */
function drawRoads(planet) {
	for (const road of ROADS) {
		let step = 0;
		for (let i = 1; i < road.length; i++) {
			const [ax, ay] = road[i - 1];
			const [bx, by] = road[i];
			const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
			for (let j = 0; j < steps; j++) {
				const x = Math.round(ax + ((bx - ax) * j) / steps);
				const y = Math.round(ay + ((by - ay) * j) / steps);
				step++;
				if (step % 3 !== 0 && nightLand(x, y) && inFrame(x, y)) {
					set(planet, x, y, LIGHT.road);
				}
			}
		}
	}
}

/**
 * The capital's heart: a white-hot point in a small cross of the brightest light.
 * @param {Canvas} planet
 */
function drawCapital(planet) {
	for (const [dx, dy] of NEIGHBOURS) {
		set(planet, CAPITAL.x + dx, CAPITAL.y + dy, LIGHT.bright);
	}
	set(planet, CAPITAL.x, CAPITAL.y, LIGHT.core);
}

/**
 * The air on the rim: two pixels deep at the dawn, white-blue there and fading round to a faint
 * one-pixel airglow on the night side, with a red line of sunrise at its foot beside the sun.
 * @param {Canvas} canvas
 */
function drawAir(canvas) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x + 0.5 - PLANET.x;
			const dy = y + 0.5 - PLANET.y;
			const above = Math.hypot(dx, dy) - PLANET.r;
			if (above < 0 || above >= 2.2) {
				continue;
			}
			const face = facing(dx, dy);
			const band =
				face > 0.985
					? 0
					: face > 0.955
						? 1
						: face > 0.9
							? 2
							: face > 0.75
								? 3
								: 4;
			if (above < 0.6 && face > 0.95 && face < 0.993) {
				set(canvas, x, y, AIR_RED);
			} else if (above < 1.2) {
				set(canvas, x, y, AIR[band]);
			} else if (band < 3) {
				set(canvas, x, y, AIR[band + 1]);
			}
		}
	}
}

/**
 * The sun peeking over the rim: a white sliver and a gold flare, long along the rim and shorter out into space.
 * @param {Canvas} canvas
 */
function drawSun(canvas) {
	for (const [dx, dy, length] of [
		[-DAWN_Y, DAWN_X, 16],
		[DAWN_Y, -DAWN_X, 16],
		[DAWN_X, DAWN_Y, 9],
		[(DAWN_X - DAWN_Y) * 0.7, (DAWN_Y + DAWN_X) * 0.7, 5],
		[(DAWN_X + DAWN_Y) * 0.7, (DAWN_Y - DAWN_X) * 0.7, 5],
	]) {
		for (let i = 2; i <= length; i++) {
			const x = Math.round(SUN_AT.x + dx * i);
			const y = Math.round(SUN_AT.y + dy * i);
			const depth =
				PLANET.r - Math.hypot(x + 0.5 - PLANET.x, y + 0.5 - PLANET.y);
			// Along the rim the streak may graze the disc's outer pixel, but never cross the night side.
			if (depth > 0.9 || !get(canvas, x, y)) {
				continue;
			}
			const t = i / (length + 1);
			set(canvas, x, y, FLARE[t < 0.3 ? 0 : t < 0.6 ? 1 : 2]);
		}
	}
	for (let y = -3; y <= 3; y++) {
		for (let x = -3; x <= 3; x++) {
			const px = SUN_AT.x + x;
			const py = SUN_AT.y + y;
			const d = Math.hypot(x, y);
			const rim = Math.hypot(px + 0.5 - PLANET.x, py + 0.5 - PLANET.y);
			if (d < 2.6 && rim > PLANET.r - 0.8) {
				set(canvas, px, py, d < 1.6 ? C.white : C.lampGlow);
			}
		}
	}
}
