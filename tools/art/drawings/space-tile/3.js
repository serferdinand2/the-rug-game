// Space tile 3 (house): an explorer in a white suit stands on a blue ice field, helmet lamp lit and one glove on the marker pole just planted beside them, looking up at a banded amber gas giant that fills half the sky and glows on the ice.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last row of sky; the ice field starts below it. */
const HORIZON = 38;

/** The gas giant: its centre and radius. */
const PLANET = { x: 41, y: 16, r: 17 };

/** The row the explorer's boots stand on. */
const FEET = 53;

/** The marker pole: its two columns' left edge, its top and the row it is planted in. */
const POLE = { x: 31, top: FEET - 26, bottom: FEET };

/** The explorer's helmet: its centre and radius. */
const HELMET = { x: 21, y: FEET - 28, r: 5.5 };

/** Where the explorer looks: up and to the right, at the gas giant. */
const GAZE = { x: 0.7, y: -0.71 };

/** The helmet lamp's bright pixel, on the crown. */
const LAMP = { x: 18, y: FEET - 31 };

/**
 * The glare's streaks across the ice: each one's row and half-length. They shorten and dim away from the horizon.
 * @type {[number, number][]}
 */
const STREAKS = [
	[HORIZON + 2, 16],
	[HORIZON + 3, 9],
	[HORIZON + 5, 13],
	[HORIZON + 7, 6],
	[HORIZON + 9, 11],
	[HORIZON + 12, 5],
	[HORIZON + 15, 8],
	[HORIZON + 19, 3],
];

/** The sky from the top down: black space thinning to a cold blue haze over the ice. */
const SKY = [
	C.nightSky1,
	C.nightSky2,
	C.nightSky3,
	mix(C.nightSky4, C.nightSea2, 0.5),
];

/** The planet's thin haze against the sky. */
const HALO = mix(C.nightSky4, C.sandShade, 0.3);

/** A brown-amber haze over the planet's poles. */
const POLAR = mix(C.timber, C.amber, 0.45);

/** A rust-red belt. */
const RUST = mix(C.amber, C.brickRed, 0.45);

/**
 * The planet's bands from the north pole down, each up to its lower edge (-1 is the top of the disc, 1 the bottom).
 * @type {{ to: number, colour: Colour }[]}
 */
const BANDS = [
	{ to: -0.8, colour: POLAR },
	{ to: -0.56, colour: C.sandShade },
	{ to: -0.36, colour: C.sandLight },
	{ to: -0.16, colour: C.amber },
	{ to: 0.04, colour: C.gold },
	{ to: 0.2, colour: RUST },
	{ to: 0.4, colour: C.sandLight },
	{ to: 0.58, colour: C.amber },
	{ to: 0.8, colour: C.sandShade },
	{ to: 2, colour: POLAR },
];

/** The light on the planet, from the far sun at the viewer's left. */
const SUNWARD = { x: -0.5, y: -0.3, z: 0.81 };

/** The ice from the horizon down: pale far off, deepening to blue near the viewer. */
const ICE = [C.snowShade, C.daySky5, C.daySky4, C.daySky3];

/** The gas giant's glare mirrored in the ice: gold at a streak's heart, amber, then fading pale into the ice. */
const GLARE = C.gold;
const GLARE_DIM = mix(C.amber, C.sandShade, 0.4);
const GLARE_FADE = mix(GLARE_DIM, C.daySky5, 0.45);

/** Cracks in the ice, with the bright lip on their near side. */
const CRACK = mix(C.daySea3, C.nightSky3, 0.35);

/** The explorer's shadow and footprints, thrown away from the planet. */
const SHADOW = mix(C.daySky3, C.daySea3, 0.6);

/** The white suit: lit amber by the planet on its right, plain, in cool shade and darkest away from the light. */
const SUIT = {
	lit: mix(C.snow, C.gold, 0.45),
	base: C.snow,
	shade: C.snowShade,
	dark: mix(C.snowShade, C.nightSky5, 0.45),
};

/** The visor: dark gold glass with the planet mirrored across it and a glint. */
const VISOR = {
	dark: mix(C.amber, C.timberShade, 0.55),
	base: C.amber,
	band: C.gold,
	glint: C.lampGlow,
};

/** The helmet lamp's cold white light. */
const LAMP_LIGHT = mix(C.white, C.foam, 0.4);

/** The pole's stripes. */
const STRIPES = [C.brickRed, C.creamLight];

/**
 * Draws space tile 3.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(30317);

	drawSpace(layer, random);
	drawPlanet(layer);
	drawIce(layer, random);
	drawRidges(layer, random);
	drawShadow(layer);

	const fg = createCanvas(64, 64);
	drawPole(fg);
	drawExplorer(fg);
	outline(fg, C.ink);
	underlay(fg, layer);

	drawBeacon(fg);
	glow(fg, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 4.5,
		colour: LAMP_LIGHT,
		strength: 0.5,
		steps: 2,
		skip: [
			LAMP_LIGHT,
			C.white,
			C.stone,
			C.stoneLight,
			...Object.values(SUIT),
			...Object.values(VISOR),
		],
	});
	set(fg, LAMP.x, LAMP.y, C.white);
	set(fg, LAMP.x - 1, LAMP.y, LAMP_LIGHT);
	return fg;
}

/**
 * Fills an ellipse, choosing each pixel's colour from where it sits in it.
 * @param {Canvas} canvas
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {number} rx - Half-width
 * @param {number} ry - Half-height
 * @param {(nx: number, ny: number, x: number, y: number) => Colour | null} colour - nx and ny run from -1 to 1 across the ellipse
 */
function ellipse(canvas, cx, cy, rx, ry, colour) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const nx = (x + 0.5 - cx) / rx;
			const ny = (y + 0.5 - cy) / ry;
			if (nx * nx + ny * ny <= 1) {
				set(canvas, x, y, colour(nx, ny, x, y));
			}
		}
	}
}

/**
 * The suit's colour at a point of one of its rounded parts, lit from the planet at the upper right.
 * @param {number} nx - Across the part, -1 to 1
 * @param {number} ny - Down the part, -1 to 1
 * @returns {Colour}
 */
function suitColour(nx, ny) {
	const light = nx * 0.75 - ny * 0.45;
	if (light > 0.62) {
		return SUIT.lit;
	}
	if (light > -0.15) {
		return SUIT.base;
	}
	return light > -0.6 ? SUIT.shade : SUIT.dark;
}

/**
 * Black space thinning to a blue haze at the horizon, with stars in two brightnesses and two sparkles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
	for (let i = 0; i < 44; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (HORIZON - 4));
		set(layer, x, y, random() > 0.65 ? C.white : C.starDim);
	}
	for (const [x, y] of [
		[9, 8],
		[13, 33],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, C.starDim);
		}
	}
}

/**
 * The colour of the planet's band at a point of its disc, the bands' edges rippling.
 * @param {number} x
 * @param {number} ny - Down the disc, -1 to 1
 * @returns {Colour}
 */
function bandColour(x, ny) {
	const v = ny + 0.045 * Math.sin(x * 0.55 + ny * 9);
	return (BANDS.find((band) => v < band.to) ?? BANDS[BANDS.length - 1])
		.colour;
}

/**
 * The banded amber gas giant, no rings: a faint halo, bands with rippling edges, a pale storm,
 * lit from the left with its shaded limb on the right.
 * @param {Canvas} layer
 */
function drawPlanet(layer) {
	const { x: cx, y: cy, r } = PLANET;
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
			if (d > r + 1 || d <= r) {
				continue;
			}
			set(layer, x, y, HALO);
		}
	}
	ellipse(layer, cx, cy, r, r, (nx, ny, x) => {
		const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
		const light = nx * SUNWARD.x + ny * SUNWARD.y + nz * SUNWARD.z;
		const band = bandColour(x, ny);
		if (light > 0.86) {
			return mix(band, C.creamLight, 0.3);
		}
		if (light > 0.38) {
			return band;
		}
		return mix(band, C.roofShade, 0.45);
	});
	// A pale oval storm riding the rust belt, its swirl trailing to the right.
	ellipse(layer, cx - 6, cy + 2.5, 3.6, 1.8, (nx) =>
		Math.abs(nx) > 0.6 ? C.sandLight : C.creamLight
	);
	set(layer, cx - 7, cy + 2, C.sandLight);
	set(layer, cx - 6, cy + 2, C.sandLight);
	set(layer, cx - 5, cy + 3, C.sandLight);
	line(layer, cx - 2, cy + 3, cx + 4, cy + 2, C.sandLight);
	// Small eddies along the belts' edges.
	/** @type {[number, number, Colour][]} */
	const eddies = [
		[cx - 11, cy - 3, RUST],
		[cx - 10, cy - 3, RUST],
		[cx + 4, cy - 6, C.sandLight],
		[cx + 5, cy - 6, C.sandLight],
		[cx - 3, cy + 7, C.amber],
		[cx - 2, cy + 7, C.amber],
		[cx + 8, cy + 6, C.sandLight],
	];
	for (const [x, y, colour] of eddies) {
		set(layer, x, y, colour);
	}
}

/**
 * The ice field: pale at the horizon and blue near the viewer, the gas giant's glare
 * mirrored in it in broken streaks, crossed by cracks and dusted with drifts.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawIce(layer, random) {
	const rows = 63 - HORIZON;
	for (let y = HORIZON + 1; y < 64; y++) {
		const t = ((y - HORIZON - 1) / rows) * (ICE.length - 0.2);
		const i = Math.min(ICE.length - 1, Math.floor(t));
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < ICE.length && t - i > 0.65 && (x + y) % 2 === 1;
			set(layer, x, y, dither ? ICE[i + 1] : ICE[i]);
		}
	}
	// The glare: the planet mirrored in the ice as a few long level streaks, gold at the heart and fading outwards,
	// each one wavering a little off the planet's centre, frayed at its ends and broken by the cracks below.
	for (const [y, half] of STREAKS) {
		const centre = PLANET.x + Math.round(Math.sin(y * 1.7) * 2);
		const deep = y > HORIZON + 10;
		for (let x = centre - half; x <= centre + half; x++) {
			const out = Math.abs(x - centre) / half;
			if (out > 0.75 && random() < 0.15) {
				continue;
			}
			let colour = GLARE_FADE;
			if (out < 0.35) {
				colour = deep ? GLARE_DIM : GLARE;
			} else if (out < 0.7) {
				colour = deep ? GLARE_FADE : GLARE_DIM;
			}
			set(layer, x, y, colour);
		}
	}
	// Long cracks running across the ice in perspective, breaking the streaks, each with a bright lip below it.
	for (const [x0, y0, x1, y1] of [
		[0, 47, 20, 44],
		[33, 45, 47, 41],
		[40, 52, 58, 48],
		[2, 55, 13, 53],
		[50, 44, 63, 46],
		[30, 60, 44, 58],
	]) {
		line(layer, x0, y0, x1, y1, CRACK);
		line(layer, x0, y0 + 1, x1, y1 + 1, C.snow);
	}
	// Drifts of snow on the ice: small white humps with a shaded foot.
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 58);
		const y = HORIZON + 3 + Math.floor(random() * (rows - 5));
		const w = 2 + Math.floor(random() * 3);
		rect(layer, x, y, w, 1, C.snow);
		rect(layer, x - 1, y + 1, w + 2, 1, C.snowShade);
	}
}

/**
 * Low pressure ridges of broken ice along the horizon, their tops lit amber by the planet.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRidges(layer, random) {
	let x = 0;
	while (x < 64) {
		const w = 3 + Math.floor(random() * 5);
		const h = 1 + Math.floor(random() * 3);
		for (let i = 0; i < w; i++) {
			const peak = h - Math.round(Math.abs(i - w / 2) * 0.6);
			for (let k = 0; k <= Math.max(0, peak); k++) {
				const y = HORIZON - k + 1;
				const top = k === Math.max(0, peak);
				const facing = Math.abs(x + i - PLANET.x) < PLANET.r;
				let colour = i < w / 2 ? C.snow : C.snowShade;
				if (top) {
					colour = facing ? C.gold : C.snow;
				}
				set(layer, x + i, y, colour);
			}
		}
		x += w + Math.floor(random() * 3);
	}
}

/**
 * The explorer's shadow, thrown down and to the left by the planet's light, and the footprints behind them.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	ellipse(layer, 15, FEET + 1.5, 8, 1.6, () => SHADOW);
	for (const [x, y] of [
		[24, FEET + 4],
		[21, FEET + 6],
		[26, FEET + 8],
		[22, FEET + 10],
	]) {
		rect(layer, x, y, 2, 1, SHADOW);
	}
}

/**
 * The marker pole planted in the ice: a plain striped survey pole with a beacon on top.
 * @param {Canvas} fg
 */
function drawPole(fg) {
	for (let y = POLE.top; y <= POLE.bottom; y++) {
		const stripe = STRIPES[Math.floor((y - POLE.top) / 3) % 2];
		set(fg, POLE.x, y, stripe);
		set(
			fg,
			POLE.x + 1,
			y,
			stripe === C.creamLight ? C.creamShade : C.brickRedShade
		);
	}
	// The drill collar where it went into the ice, and the beacon's housing.
	rect(fg, POLE.x - 1, POLE.bottom - 1, 4, 2, C.stone);
	rect(fg, POLE.x - 1, POLE.top - 2, 4, 2, C.stoneShade);
}

/**
 * The beacon on the pole's top, blinking teal.
 * @param {Canvas} canvas
 */
function drawBeacon(canvas) {
	rect(canvas, POLE.x, POLE.top - 3, 2, 1, C.tealLight);
	set(canvas, POLE.x, POLE.top - 4, C.white);
}

/**
 * The explorer, side on and facing the planet: a backpack, the white suit lit amber down its right side,
 * one arm out to the pole, and the head tipped back so the gold visor looks up at the giant.
 * @param {Canvas} fg
 */
function drawExplorer(fg) {
	// The backpack behind the shoulders, with a vent.
	rect(fg, 11, FEET - 24, 5, 12, C.stone);
	rect(fg, 11, FEET - 24, 5, 1, C.stoneLight);
	rect(fg, 11, FEET - 24, 1, 12, C.stoneShade);
	rect(fg, 13, FEET - 21, 2, 4, C.stoneShade);

	// The legs: the far one in shade, the near one stepping forward, with knee joints.
	for (let y = FEET - 11; y <= FEET - 1; y++) {
		const knee = y === FEET - 6;
		rect(fg, 16, y, 3, 1, knee ? C.stoneLight : SUIT.dark);
		set(fg, 19, y, SUIT.shade);
		rect(fg, 21, y, 2, 1, knee ? C.stoneLight : SUIT.base);
		set(fg, 20, y, SUIT.shade);
		set(fg, 23, y, knee ? C.stoneLight : SUIT.lit);
	}
	// The boots, toes to the right.
	rect(fg, 15, FEET - 1, 5, 2, C.stoneShade);
	rect(fg, 21, FEET - 1, 5, 2, C.stone);
	rect(fg, 21, FEET - 1, 5, 1, C.stoneLight);

	// The body and hips.
	ellipse(fg, 20, FEET - 10, 4.6, 2.2, suitColour);
	ellipse(fg, 20, FEET - 16.5, 5.2, 6.2, suitColour);

	// The chest pack, with two lights.
	rect(fg, 21, FEET - 19, 3, 4, C.stoneLight);
	rect(fg, 21, FEET - 16, 3, 1, C.stone);
	set(fg, 22, FEET - 18, C.teal);
	set(fg, 23, FEET - 18, C.brickRedLight);

	// The near arm, out to the pole, with a teal band round the upper arm.
	for (let k = 0; k < 3; k++) {
		const y = FEET - 20 + k;
		line(fg, 22, y, 27, y + 4, k === 0 ? SUIT.lit : SUIT.base);
		line(fg, 27, y + 4, 30, y + 4, k === 0 ? SUIT.lit : SUIT.shade);
	}
	set(fg, 24, FEET - 18, C.teal);
	set(fg, 24, FEET - 17, C.tealShade);
	set(fg, 25, FEET - 17, C.teal);
	// The glove round the pole.
	rect(fg, 30, FEET - 17, 2, 4, C.stone);
	set(fg, 31, FEET - 17, C.stoneLight);

	// The collar ring between helmet and suit.
	rect(fg, 17, FEET - 23, 7, 1, C.stone);
	rect(fg, 18, FEET - 23, 4, 1, C.stoneLight);

	drawHelmet(fg);
}

/**
 * The helmet, tipped back: its gold visor is the front of the bubble, turned up towards the giant,
 * with the planet's bands mirrored across it and a glint at its top. The lamp sits on the crown.
 * @param {Canvas} fg
 */
function drawHelmet(fg) {
	const { x: hx, y: hy, r } = HELMET;
	ellipse(fg, hx, hy, r, r, suitColour);
	const cx = hx + 0.5;
	const cy = hy + 0.5;
	for (let y = hy - 6; y <= hy + 6; y++) {
		for (let x = hx - 6; x <= hx + 6; x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			// Along the gaze, and across it towards the chin.
			const u = dx * GAZE.x + dy * GAZE.y;
			const v = dx * -GAZE.y + dy * GAZE.x;
			if (Math.hypot(dx, dy) > r - 0.9 || u < 0.4) {
				continue;
			}
			let colour = VISOR.base;
			if (v > 2.2 || u < 1.2) {
				colour = VISOR.dark;
			} else if (v < -2.4 && u > 2.4) {
				colour = VISOR.glint;
			} else if (Math.abs(v + 0.6) < 0.7 || Math.abs(v - 1.3) < 0.4) {
				colour = VISOR.band;
			}
			set(fg, x, y, colour);
		}
	}
	// The lamp on the crown, in its housing.
	rect(fg, LAMP.x - 1, LAMP.y - 1, 3, 3, C.stone);
	set(fg, LAMP.x - 1, LAMP.y - 1, C.stoneLight);
	set(fg, LAMP.x, LAMP.y, LAMP_LIGHT);
}
