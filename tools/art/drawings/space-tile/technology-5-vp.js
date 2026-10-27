// Space tile Technology 5 VP: a space elevator seen from an alien salt plain at violet dusk, its cable rising from a broad anchor station straight up through a climber car gripping it, still catching the sun high above where the station shines.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row, where the plain begins. */
const HORIZON = 47;

/**
 * The cable: its shaded left column (its lit right side is the next one), the row where it leaves the anchor's housing,
 * the row above which it still catches the sun, and the row below which it widens to three pixels, nearer the viewer.
 */
const CABLE = { x: 31, foot: 37, sunlit: 15, wide: 30 };

/** The station high above, a bright point on the cable, which runs on past it out of sight. */
const STATION = { x: 32, y: 7 };

/** The climber car's top-left corner, centred on the cable. */
const CLIMBER = { x: 25, y: 15 };

/** The anchor station: its centre column (between the cable's two columns), the top of its broad base and the row it stands on. */
const ANCHOR = { x: 31.5, top: 45, base: 51 };

/** The sun, just set behind the far mesas on the right. */
const SUN = { x: 50, y: 49 };

/** Long wisps of cloud low in the sky, lit from below by the afterglow: each one's middle row, the columns it spans and its thickest. */
const CLOUDS = [
	{ y: 36, from: 0, to: 25, thick: 2 },
	{ y: 34, from: 37, to: 64, thick: 3 },
	{ y: 29, from: 44, to: 60, thick: 1 },
];

/** The violet dusk sky, from the top down. */
const SKY = [
	mix(C.nightSky2, C.duskSky1, 0.5),
	C.duskSky1,
	mix(C.duskSky1, C.duskSky2, 0.5),
	C.duskSky2,
	mix(C.duskSky2, C.arcaneShade, 0.6),
	mix(C.arcaneShade, C.duskSky3, 0.5),
	mix(C.duskSky3, C.arcane, 0.35),
	mix(C.duskSky4, C.arcaneLight, 0.35),
];

/** The last light along the horizon. */
const AFTERGLOW = mix(C.duskSky5, C.arcaneLight, 0.4);

/** The cloud streak: its dark top and its underside lit pink by the set sun. */
const CLOUD_TOP = mix(C.duskSky2, C.arcaneShade, 0.5);
const CLOUD_LIT = mix(C.duskSky4, C.duskSky5, 0.6);

/** The far mesas, flat-topped and dark against the afterglow. */
const MESA = mix(C.headlandRidge, C.arcaneShade, 0.3);
const MESA_FAR = mix(C.headlandRidge, C.duskSky3, 0.45);

/** The mesas along the horizon, far row first: the columns each spans, its height and its colour. */
const MESAS = [
	{ from: 0, to: 9, h: 3, colour: MESA_FAR },
	{ from: 12, to: 21, h: 2, colour: MESA_FAR },
	{ from: 38, to: 47, h: 4, colour: MESA_FAR },
	{ from: 54, to: 64, h: 2, colour: MESA_FAR },
	{ from: 3, to: 13, h: 5, colour: MESA },
	{ from: 43, to: 52, h: 3, colour: MESA },
	{ from: 57, to: 62, h: 6, colour: MESA },
];

/** The salt plain, pale with the sky's light in the distance and darker towards the viewer, with its raised crust ridges. */
const PLAIN = [
	mix(C.duskSky3, C.roofLight, 0.55),
	mix(C.roofLight, C.roof, 0.35),
	mix(C.roofLight, C.roof, 0.7),
	mix(C.roof, C.roofShade, 0.45),
];
const RIDGE = mix(C.roofLight, C.arcaneLight, 0.45);
const RIDGE_DIM = mix(C.roofLight, C.roof, 0.15);

/** The structures in the dusk: dark metal, with the sunset's rim light on their right edges. */
const METAL = mix(C.roofShade, C.stoneShade, 0.4);
const METAL_LIGHT = mix(C.stoneShade, C.roofLight, 0.5);
const METAL_DARK = mix(C.roofShade, C.ink, 0.35);
const RIM = mix(C.duskSky5, C.gold, 0.35);
const RIM_DIM = mix(C.duskSky4, C.duskSky5, 0.5);

/** The cable high up, still in the sun: gold, paling towards the station, and faint beyond it. */
const THREAD = C.gold;
const THREAD_HIGH = mix(C.gold, C.lampGlow, 0.6);
const THREAD_FAINT = mix(C.gold, C.duskSky2, 0.55);

/** The cable lower down, in the dusk: lit only by the afterglow, pinker towards the ground. */
const THREAD_DUSK = mix(C.gold, C.duskSky5, 0.6);

/** The sunlit cable's shaded side. */
const THREAD_SHADE = mix(C.amber, C.duskSky3, 0.35);

/** Lamps: the climber's windows, the anchor's lights and the beacons. */
const WINDOW = C.lampGlow;
const WINDOW_DIM = C.gold;
const BEACON = C.brickRedLight;
const BEACON_GREEN = C.ghost;

/** The pale crescent of a moon in the darkening sky. */
const MOON = mix(C.moon, C.arcaneLight, 0.35);
const MOON_SHADE = mix(C.roofLight, C.duskSky2, 0.4);

/**
 * Draws space tile Technology 5 VP.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(51755);

	drawSkyRamp(layer);
	drawStars(layer, random);
	drawMoon(layer);
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 24,
		colour: AFTERGLOW,
		strength: 0.55,
		steps: 4,
	});
	drawClouds(layer);
	drawMesas(layer);
	drawPlain(layer, random);
	drawRocks(layer);

	// The cable is too thin for an outline, so it goes on the sky; the climbers and the anchor are outlined over it.
	drawCable(layer);
	const fg = createCanvas(64, 64);
	drawClimber(fg);
	drawAnchor(fg);
	outline(fg, C.ink);
	underlay(fg, layer);

	drawClamps(fg);
	drawStation(fg);
	drawLights(fg);
	return fg;
}

/**
 * The violet dusk sky, dithered where one band gives way to the next.
 * @param {Canvas} layer
 */
function drawSkyRamp(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) ** 0.9 * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * The first stars, high in the darker sky, and a few four-point sparkles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStars(layer, random) {
	const dim = mix(C.starDim, C.duskSky1, 0.45);
	for (let i = 0; i < 34; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() ** 1.5 * 28);
		set(layer, x, y, random() > 0.65 ? C.starDim : dim);
	}
	for (const [x, y] of [
		[8, 6],
		[55, 9],
		[45, 3],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, dim);
		}
	}
}

/**
 * A pale crescent moon on the right, above the set sun, lit on its lower right, the rest of its face dim.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const cx = 48;
	const cy = 17;
	for (let y = cy - 5; y <= cy + 5; y++) {
		for (let x = cx - 5; x <= cx + 5; x++) {
			const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
			if (d > 4.8) {
				continue;
			}
			const dark = Math.hypot(x + 0.5 - cx + 2, y + 0.5 - cy + 1.6) < 4.4;
			set(layer, x, y, dark ? MOON_SHADE : MOON);
		}
	}
}

/**
 * Long thin wisps of cloud, dark on top and lit pink underneath, thickest in the middle and tapering to their ends.
 * @param {Canvas} layer
 */
function drawClouds(layer) {
	for (const { y, from, to, thick } of CLOUDS) {
		const middle = (from + to) / 2;
		const half = (to - from) / 2;
		for (let x = from; x < to; x++) {
			const swell = 1 - Math.abs(x + 0.5 - middle) / half;
			const rows = Math.round(swell * thick + 0.4);
			const top = y + Math.round(Math.sin(x * 0.19) * 0.6);
			for (let i = 0; i < rows; i++) {
				set(layer, x, top + i, i === rows - 1 ? CLOUD_LIT : CLOUD_TOP);
			}
		}
	}
}

/**
 * Flat-topped mesas along the horizon: a far pale row and a nearer dark one.
 * @param {Canvas} layer
 */
function drawMesas(layer) {
	for (const { from, to, h, colour } of MESAS) {
		for (let x = from; x < to; x++) {
			// Sloped shoulders below each flat top.
			const shoulder = Math.min(x - from, to - 1 - x);
			const top = HORIZON - h + (shoulder < 1 ? 1 : 0);
			for (let y = top; y <= HORIZON; y++) {
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * The salt plain in perspective: bands from pale in the distance to dark nearby, crazed with raised crust ridges
 * that close up into the distance.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPlain(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		const near = y - HORIZON;
		// Ground coordinates under this row: depth shrinks towards the viewer.
		const depth = 60 / (near + 1.5);
		const t = Math.min(PLAIN.length - 1, (near / 16) * PLAIN.length);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < PLAIN.length && t - i > 0.6 && (x + y) % 2 === 0;
			let colour = dither ? PLAIN[i + 1] : PLAIN[i];
			const gx = ((x + 0.5 - 32) * depth) / 30;
			if (near > 5 && crust(gx, depth)) {
				colour = near > 9 ? RIDGE_DIM : RIDGE;
			}
			set(layer, x, y, colour);
		}
	}
	// Salt crystals glinting in the afterglow.
	for (let n = 0; n < 8; n++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 3 + Math.floor(random() * 14);
		set(layer, x, y, RIDGE);
	}
}

/**
 * Tells whether a point on the plain lies on a ridge of the salt crust: the edges between cells
 * of a jittered grid, so the crust breaks into rough polygons.
 * @param {number} gx - Across the plain
 * @param {number} gz - Into the distance
 * @returns {boolean}
 */
function crust(gx, gz) {
	const size = 2.2;
	/** @type {number[]} */
	const ds = [];
	const ci = Math.floor(gx / size);
	const cj = Math.floor(gz / size);
	for (let j = cj - 1; j <= cj + 1; j++) {
		for (let i = ci - 1; i <= ci + 1; i++) {
			const jx = (Math.sin(i * 12.9 + j * 78.2) * 43758.5) % 1;
			const jz = (Math.sin(i * 39.3 + j * 11.1) * 24634.6) % 1;
			const px = (i + 0.5 + Math.abs(jx) * 0.8 - 0.4) * size;
			const pz = (j + 0.5 + Math.abs(jz) * 0.8 - 0.4) * size;
			ds.push(Math.hypot(gx - px, gz - pz));
		}
	}
	ds.sort((a, b) => a - b);
	return ds[1] - ds[0] < 0.2;
}

/**
 * Two dark rocks in the foreground, rimmed by the afterglow on their right.
 * @param {Canvas} layer
 */
function drawRocks(layer) {
	const keys = { k: METAL_DARK, m: C.roofShade, r: RIM_DIM };
	paint(
		layer,
		5,
		56,
		['...mmm...', '..mmmmr..', '.kmmmmmr.', 'kkkmmmmmr', 'kkkkkmmmm'],
		keys
	);
	paint(layer, 51, 58, ['..mmr.', '.kmmmr', 'kkkmmm'], keys);
}

/**
 * The cable, drawn on the sky without an outline: two pixels wide, a shaded left side and a lit right side,
 * widening to three near the ground. Low down it is dark in the dusk with the afterglow down its right side;
 * higher up it still catches the sun, gold paling to the station, and beyond the station a faint thread runs on out of sight.
 * @param {Canvas} layer
 */
function drawCable(layer) {
	const { x, foot, sunlit, wide } = CABLE;
	for (let y = 0; y <= foot; y++) {
		if (y < STATION.y) {
			set(layer, x + 1, y, THREAD_FAINT);
		} else if (y < sunlit) {
			set(layer, x, y, y < STATION.y + 5 ? THREAD : THREAD_SHADE);
			set(layer, x + 1, y, y < STATION.y + 5 ? THREAD_HIGH : THREAD);
		} else {
			const lit = y < sunlit + 6 ? THREAD_DUSK : RIM_DIM;
			set(layer, x, y, METAL);
			set(layer, x + 1, y, lit);
			if (y >= wide) {
				set(layer, x - 1, y, METAL_DARK);
			}
		}
	}
}

/**
 * The climber car halfway up, centred on the cable: a broad cabin with chamfered ends and one wide band of lit windows,
 * its roof and right side catching the afterglow, and a clamp frame above and below it gripping the cable.
 * @param {Canvas} fg
 */
function drawClimber(fg) {
	paint(
		fg,
		CLIMBER.x,
		CLIMBER.y,
		[
			'....kkkkkk....',
			'....k....k....',
			'.rrrrrrrrrrrr.',
			'lmmmmmmmmmmmmr',
			'lwwwwwwwwwwwwr',
			'lggggggggggggr',
			'.mmmmmmmmmmmm.',
			'....k....k....',
			'....kkkkkk....',
		],
		{
			r: RIM,
			m: METAL,
			l: METAL_LIGHT,
			w: WINDOW,
			g: WINDOW_DIM,
			k: METAL_LIGHT,
		}
	);
}

/**
 * The cable running on through the climber's clamp frames, over their outline, and the grip on it at each.
 * @param {Canvas} canvas
 */
function drawClamps(canvas) {
	for (const y of [CLIMBER.y, CLIMBER.y + 1, CLIMBER.y + 7, CLIMBER.y + 8]) {
		set(canvas, CABLE.x, y, METAL);
		set(canvas, CABLE.x + 1, y, y < CLIMBER.y + 2 ? THREAD : RIM);
	}
	// The grips: dark jaws closing on the cable at the frames' outer bars.
	for (const y of [CLIMBER.y, CLIMBER.y + 8]) {
		set(canvas, CABLE.x - 1, y, METAL_DARK);
		set(canvas, CABLE.x + 2, y, METAL_DARK);
	}
}

/**
 * The anchor station seen from the plain: a broad straight-walled base with a row of lit windows, a tier stepped back
 * on top of it, and the raised housing that grips the cable's foot, lit at its mouth, with the afterglow along each
 * block's right-hand edge.
 * @param {Canvas} fg
 */
function drawAnchor(fg) {
	const { top, base } = ANCHOR;
	const left = CABLE.x;
	for (const block of [
		{ half: 18, from: top, to: base, windows: top + 3 },
		{ half: 11, from: top - 3, to: top - 1, windows: -1 },
		{ half: 4, from: CABLE.foot + 1, to: top - 4, windows: -1 },
	]) {
		for (let y = block.from; y <= block.to; y++) {
			for (let x = left - block.half + 1; x <= left + block.half; x++) {
				let colour = y === block.from ? METAL_LIGHT : METAL_DARK;
				if (x >= left + block.half - 1 && y > block.from) {
					colour = x === left + block.half ? RIM_DIM : METAL;
				} else if (
					y === block.windows &&
					(x - left + 1) % 4 === 0 &&
					Math.abs(x - left) > 4
				) {
					colour = WINDOW_DIM;
				}
				set(fg, x, y, colour);
			}
		}
	}
	// The housing's lit mouth round the cable, and its doors at the foot of the base.
	rect(fg, left - 1, CABLE.foot + 2, 4, 1, WINDOW);
	rect(fg, left, base - 2, 2, 2, WINDOW_DIM);
}

/**
 * The station, far above: a bright point with four-point rays and a soft glow.
 * @param {Canvas} canvas
 */
function drawStation(canvas) {
	glow(canvas, {
		x: STATION.x,
		y: STATION.y,
		radius: 5,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 2,
	});
	set(canvas, STATION.x, STATION.y, C.white);
	for (const [dx, dy] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		set(canvas, STATION.x + dx, STATION.y + dy, C.lampGlow);
		const behind = /** @type {Colour} */ (
			get(canvas, STATION.x + dx * 2, STATION.y + dy * 2)
		);
		set(
			canvas,
			STATION.x + dx * 2,
			STATION.y + dy * 2,
			mix(behind, C.lampGlow, 0.5)
		);
	}
}

/**
 * The beacons: red at the anchor's corners and on the housing, red and green at the climber's ends.
 * @param {Canvas} canvas
 */
function drawLights(canvas) {
	glow(canvas, {
		x: CABLE.x + 1,
		y: CABLE.foot,
		radius: 5,
		colour: RIM,
		strength: 0.35,
		steps: 2,
		skip: [C.ink],
	});
	set(canvas, CABLE.x - 17, ANCHOR.top - 1, BEACON);
	set(canvas, CABLE.x + 18, ANCHOR.top - 1, BEACON);
	set(canvas, CABLE.x - 3, CABLE.foot, BEACON);
	set(canvas, CLIMBER.x - 1, CLIMBER.y + 4, BEACON);
	set(canvas, CLIMBER.x + 14, CLIMBER.y + 4, BEACON_GREEN);
}
