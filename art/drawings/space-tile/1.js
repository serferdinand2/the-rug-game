// Space tile 1 (science): a space telescope floating in deep space, its gold honeycomb mirror of hexagonal segments raised on a five-layer silver sunshield, before a violet and pink spiral galaxy.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
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

/** The spiral galaxy: its core, its radius along the disc, the disc's tilt in radians and how flat it is seen. */
const GALAXY = { x: 50, y: 13, r: 19, tilt: -0.5, squash: 0.46 };

/** The mirror's top-left pixel: five columns of segments, five pixels apart, the middle one tallest. */
const MIRROR = { x: 18, y: 9 };

/** Each segment is a flat-topped hexagon seven pixels wide and five tall; columns step 5 across and 6 down. */
const CELL = { w: 7, h: 5, dx: 5, dy: 6 };

/** The sunshield's top sheet, as its six corners: a long kite seen from a little above. */
const SHIELD = [
	[12, 42],
	[21, 37],
	[44, 36],
	[53, 40],
	[45, 46],
	[20, 48],
];

/** How far apart the sheets lie at each corner: close where they meet the spacecraft, fanning out to the tips. */
const SPREAD = [2.4, 1.3, 1.3, 2.4, 1.7, 1.7];

/** The number of sheets in the sunshield. */
const LAYERS = 5;

/** Deep space, from the top down: violet haze high up by the galaxy, darkening to blue-black below. */
const SPACE = [
	mix(C.nightSky3, C.arcaneShade, 0.35),
	mix(C.nightSky2, C.arcaneShade, 0.2),
	C.nightSky1,
	mix(C.nightSky1, C.ink, 0.5),
];

/** The galaxy's light, from its faint outer disc to its blazing core. */
const GALAXY_RAMP = [
	mix(C.nightSky3, C.arcaneShade, 0.55),
	mix(C.arcaneShade, C.duskSky4, 0.35),
	mix(C.arcane, C.duskSky4, 0.45),
	mix(C.arcaneLight, C.duskSky5, 0.4),
	mix(C.arcaneLight, C.lampGlow, 0.55),
	C.white,
];

/** Pink knots of new stars strung along the arms. */
const KNOT = mix(C.brickRedLight, C.arcaneLight, 0.35);

/** Stars in three brightnesses. */
const STARS = [C.white, C.starDim, mix(C.starDim, C.nightSky2, 0.55)];

/** The gold mirror segments: lit, base and shaded, in three strengths, the brightest where the sheen crosses. */
const GOLD = {
	bright: { a: C.lampGlow, b: mix(C.gold, C.lampGlow, 0.35), c: C.gold },
	normal: { a: C.gold, b: mix(C.gold, C.amber, 0.35), c: C.amber },
	dim: {
		a: mix(C.gold, C.amber, 0.45),
		b: C.amber,
		c: mix(C.amber, C.lampFrame, 0.5),
	},
};

/** The galaxy's pink caught in the gold. */
const REFLECTION = mix(C.arcaneLight, C.gold, 0.35);

/** The black backplane showing between the segments. */
const BACKPLANE = mix(C.ink, C.roofShade, 0.45);

/** The silver sunshield, tinted violet by its coating: each sheet a little darker than the one above. */
const SHEET = [0, 1, 2, 3, 4].map((k) =>
	mix(mix(C.stoneLight, C.duskSky5, 0.22), C.roofLight, k * 0.16)
);
const SHEET_TOP = mix(C.stoneLight, C.arcaneLight, 0.3);
const SHEET_SHADE = mix(C.stoneLight, C.roofLight, 0.45);
const SHEET_LIT = mix(C.white, C.arcaneLight, 0.25);
const SHEET_PINK = mix(C.stoneLight, C.duskSky5, 0.3);
const SHEET_SEAM = mix(C.stone, C.arcaneShade, 0.25);
const SHEET_GAP = mix(C.roofShade, C.ink, 0.45);

/** The struts and the secondary mirror they hold out in front. */
const STRUT = mix(C.stoneShade, C.ink, 0.25);
const STRUT_LIT = C.stone;

/** The spacecraft under the shield: a dark box and its solar panel. */
const BUS = mix(C.stoneShade, C.roofShade, 0.4);
const PANEL = mix(C.nightSea2, C.roofShade, 0.3);
const PANEL_LINE = mix(C.nightSea1, C.arcaneShade, 0.3);

/**
 * Draws space tile 1.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(1609);

	drawSpace(layer);
	drawStars(layer, random);
	drawGalaxy(layer, random);
	drawFarGalaxy(layer, 8, 22);

	// The shield is outlined on its own, so the gold mirror stands sharp in front of it.
	const shield = createCanvas(64, 64);
	drawBus(shield);
	drawShield(shield);
	outline(shield, C.ink);
	underlay(shield, layer);

	const mirror = createCanvas(64, 64);
	drawMirror(mirror);
	drawStruts(mirror);
	outline(mirror, C.ink);
	underlay(mirror, shield);

	glow(mirror, {
		x: GALAXY.x,
		y: GALAXY.y,
		radius: 7,
		colour: C.lampGlow,
		strength: 0.4,
		skip: [C.white],
	});
	drawGlint(mirror, 36, 14);
	drawSparkles(mirror);
	return mirror;
}

/**
 * Deep space: violet haze at the top, where the galaxy hangs, darkening to blue-black at the foot, dithered where
 * one band gives way to the next.
 * @param {Canvas} layer
 */
function drawSpace(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const t = ((y + (64 - x) * 0.35) / 86) * SPACE.length;
			const i = Math.min(SPACE.length - 1, Math.floor(t));
			// A sparse dither first, then a checkerboard, so each band fades into the next.
			const step = t - i;
			const dither =
				i + 1 < SPACE.length &&
				((step > 0.85 && (x + y) % 2 === 0) ||
					(step > 0.7 && x % 2 === 0 && y % 2 === 0));
			set(layer, x, y, dither ? SPACE[i + 1] : SPACE[i]);
		}
	}
}

/**
 * Stars in three brightnesses, scattered over the dark sky.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStars(layer, random) {
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const pick = random();
		set(layer, x, y, STARS[pick > 0.8 ? 0 : pick > 0.45 ? 1 : 2]);
	}
}

/**
 * How bright the galaxy is at a pixel: a blazing core and two arms winding out of it across a faint disc.
 * @param {number} x
 * @param {number} y
 * @returns {number} About 0 off the galaxy, rising past 1 at the core.
 */
function galaxyLight(x, y) {
	const dx = x + 0.5 - GALAXY.x;
	const dy = y + 0.5 - GALAXY.y;
	const cos = Math.cos(GALAXY.tilt);
	const sin = Math.sin(GALAXY.tilt);
	const u = dx * cos + dy * sin;
	const v = (-dx * sin + dy * cos) / GALAXY.squash;
	const r = Math.hypot(u, v) / GALAXY.r;
	if (r > 1.1) {
		return 0;
	}
	const theta = Math.atan2(v, u);
	const arm = Math.cos(2 * (theta - 2.5 * Math.log(r + 0.08)));
	const fade = Math.max(0, 1 - r);
	return (
		Math.exp(-r * 7) * 1.4 +
		Math.max(0, arm) ** 3 * fade * 1.1 +
		fade * 0.22
	);
}

/**
 * The spiral galaxy, its light quantised into a few bands with a dithered edge, knots of pink stars along its arms.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGalaxy(layer, random) {
	const steps = [0.08, 0.2, 0.36, 0.56, 0.85, 1.2];
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const light = galaxyLight(x, y);
			let band = -1;
			steps.forEach((step, i) => {
				if (light >= step) {
					band = i;
				}
			});
			const next = band + 1;
			if (
				next < steps.length &&
				light > steps[next] * 0.88 &&
				(x + y) % 2 === 0
			) {
				band = next;
			}
			if (band >= 0) {
				set(layer, x, y, GALAXY_RAMP[band]);
			}
		}
	}
	for (let i = 0; i < 40; i++) {
		const x = 34 + Math.floor(random() * 30);
		const y = Math.floor(random() * 28);
		const light = galaxyLight(x, y);
		if (light > 0.3 && light < 0.7) {
			set(layer, x, y, KNOT);
		}
	}
}

/**
 * A far galaxy seen edge on: a small tilted spindle, brightest at its middle.
 * @param {Canvas} layer
 * @param {number} x - Its middle column
 * @param {number} y - Its middle row
 */
function drawFarGalaxy(layer, x, y) {
	paint(layer, x - 3, y - 1, ['....dd.', '.dmLmd.', 'dd....'], {
		d: GALAXY_RAMP[1],
		m: GALAXY_RAMP[2],
		L: GALAXY_RAMP[4],
	});
}

/**
 * Tells whether a pixel's centre lies inside a polygon.
 * @param {readonly (readonly number[])[]} points - The corners, in order
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function insidePolygon(points, x, y) {
	const px = x + 0.5;
	const py = y + 0.5;
	let inside = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const [xi, yi] = points[i];
		const [xj, yj] = points[j];
		if (
			yi > py !== yj > py &&
			px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
		) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * The spacecraft hanging under the shield: a dark box and its solar panel, its cells in a grid.
 * @param {Canvas} shield
 */
function drawBus(shield) {
	rect(shield, 28, 50, 10, 6, BUS);
	rect(shield, 28, 50, 10, 1, C.stoneShade);
	rect(shield, 39, 52, 7, 4, PANEL);
	for (let x = 41; x < 46; x += 3) {
		rect(shield, x, 52, 1, 4, PANEL_LINE);
	}
	rect(shield, 39, 53, 7, 1, PANEL_LINE);
	rect(shield, 38, 54, 1, 1, C.stoneShade);
}

/**
 * The sunshield: five thin sheets stacked under each other, close at the middle and fanning out to the tips,
 * so their edges show as silver lines with dark gaps between; the top sheet catches the galaxy's light.
 * @param {Canvas} shield
 */
function drawShield(shield) {
	for (let k = LAYERS - 1; k >= 0; k--) {
		const sheet = SHIELD.map(([x, y], i) => [x, y + k * SPREAD[i]]);
		for (let y = 0; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				if (insidePolygon(sheet, x, y)) {
					set(shield, x, y, SHEET_GAP);
				}
				if (insidePolygon(sheet, x, y + 1)) {
					set(shield, x, y, SHEET[k]);
				}
			}
		}
	}
	// The top sheet: pink where the galaxy lights it at the back, shaded at the front, a crease down its length.
	for (let y = 30; y < 52; y++) {
		for (let x = 0; x < 64; x++) {
			if (!insidePolygon(SHIELD, x, y + 1)) {
				continue;
			}
			const lit = x * 0.5 - y * 1.6;
			let colour = SHEET_TOP;
			if (lit > -42 || (lit > -45 && (x + y) % 2 === 0)) {
				colour = SHEET_PINK;
			} else if (lit < -58 || (lit < -55 && (x + y) % 2 === 0)) {
				colour = SHEET_SHADE;
			}
			const crease = 42 - ((x - 12) * 2) / 41;
			if (Math.round(crease) === y && x > 15 && x < 51) {
				colour = SHEET_SEAM;
			}
			if (!insidePolygon(SHIELD, x, y)) {
				colour = SHEET_LIT;
			}
			set(shield, x, y, colour);
		}
	}
}

/**
 * The segments' positions: five columns, the outer ones three tall, the next four, the middle five, with its
 * centre left open for the light to pass back through.
 * @returns {{ x: number, y: number, centre: boolean }[]}
 */
function segments() {
	/** @type {{ x: number, y: number, centre: boolean }[]} */
	const cells = [];
	[3, 4, 5, 4, 3].forEach((count, column) => {
		const x = MIRROR.x + column * CELL.dx;
		const top = MIRROR.y + ((5 - count) * CELL.dy) / 2;
		for (let k = 0; k < count; k++) {
			cells.push({
				x,
				y: top + k * CELL.dy,
				centre: column === 2 && k === 2,
			});
		}
	});
	return cells;
}

/** One segment: a flat-topped hexagon, lit along its top and shaded along its foot. */
const SEGMENT = ['..aaa..', '.abbbb.', 'abbbbbc', '.bbbcc.', '..ccc..'];

/** The segment's shape grown by a pixel, painted first in black so the gaps show the backplane. */
const SEGMENT_BACK = [
	'.aaaaa.',
	'aaaaaaa',
	'aaaaaaa',
	'aaaaaaa',
	'aaaaaaa',
	'.aaaaa.',
];

/**
 * The primary mirror: eighteen gold hexagons on their black backplane, a sheen of brighter gold running across
 * them from the upper right and the galaxy's pink caught in two of them.
 * @param {Canvas} mirror
 */
function drawMirror(mirror) {
	const cells = segments();
	for (const { x, y } of cells) {
		paint(mirror, x, y - 1, SEGMENT_BACK, { a: BACKPLANE });
	}
	// The tower under the mirror, holding it up off the shield.
	rect(mirror, 31, 39, 5, 3, BACKPLANE);
	rect(mirror, 32, 39, 1, 3, C.stoneShade);
	for (const { x, y, centre } of cells) {
		if (centre) {
			rect(mirror, x + 2, y + 1, 3, 3, mix(C.stoneShade, C.ink, 0.3));
			set(mirror, x + 3, y + 2, C.stone);
			continue;
		}
		// The sheen: a band across the mirror from upper right to lower left.
		const band = x + 6 - (y - MIRROR.y) * 0.9 - (MIRROR.x + 12);
		const strength =
			band > 2 && band < 12 ? 'bright' : band < -9 ? 'dim' : 'normal';
		paint(mirror, x, y, SEGMENT, GOLD[strength]);
	}
	for (const [x, y] of [
		[37, 13],
		[38, 14],
		[43, 20],
	]) {
		set(mirror, x, y, REFLECTION);
	}
}

/**
 * The secondary mirror held out in front of the primary on three thin struts, seen a little from the side.
 * @param {Canvas} mirror
 */
function drawStruts(mirror) {
	const tip = { x: 27, y: 19 };
	line(mirror, 21, 33, tip.x, tip.y + 1, STRUT);
	line(mirror, 41, 34, tip.x + 1, tip.y + 1, STRUT);
	line(mirror, 33, 9, tip.x + 1, tip.y, STRUT_LIT);
	paint(mirror, tip.x - 1, tip.y - 1, ['.ss.', 'sSSs', '.ss.'], {
		s: STRUT,
		S: C.stoneLight,
	});
}

/**
 * A four-point glint where the light strikes the gold.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 */
function drawGlint(canvas, x, y) {
	set(canvas, x, y, C.white);
	for (const [dx, dy] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		set(canvas, x + dx, y + dy, C.lampGlow);
	}
}

/**
 * A few four-point sparkles on the dark sky, kept clear of the telescope.
 * @param {Canvas} canvas
 */
function drawSparkles(canvas) {
	for (const [x, y] of [
		[6, 8],
		[11, 30],
		[58, 52],
		[24, 59],
	]) {
		set(canvas, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const behind = get(canvas, x + dx, y + dy);
			if (behind && !STARS.includes(behind)) {
				set(canvas, x + dx, y + dy, C.starDim);
			}
		}
	}
}
