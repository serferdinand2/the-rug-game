// Mind Control: a riveted brass helmet crowned with an antenna on a wooden stand at night, green spiral waves pulsing out of it.
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

/** The helmet's dome: the middle of its bottom edge and its radius. */
const DOME = { x: 31.5, y: 30, r: 14 };

/** The brim band round the dome's foot: its first row, its height and how far it reaches past the dome on each side. */
const BAND = { y: 30, h: 4, over: 1 };

/** The green glass gauge on the front of the dome. */
const GAUGE = { x: 31.5, y: 22.5, r: 3.6 };

/** The two earpieces either side of the band. */
const EARS = [
	{ x: 16, y: 32 },
	{ x: 47, y: 32 },
];

/** The glowing ball on top of the antenna, where the waves start. */
const TIP = { x: 31.5, y: 5.5, r: 2.4 };

/** The middle of the spiral behind the helmet. */
const SPIRAL = { x: 31.5, y: 24 };

/** The floor's first row. */
const FLOOR = 56;

/** The night: a darker top and a lower band, and the floor. */
const SKY_TOP = C.nightSky1;
const SKY = C.nightSky2;
const FLOOR_TOP = C.headlandRidge;
const FLOOR_FILL = C.headland;
const FLOOR_SHADOW = mix(C.headland, C.ink, 0.45);

/** The steel control box on the floor. */
const STEEL_LIGHT = C.stoneLight;
const STEEL = C.stone;
const STEEL_SHADE = C.stoneShade;

/**
 * Draws the Mind Control tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4471);

	drawNight(layer, random);
	drawSpiral(layer);
	drawPulses(layer);
	glow(layer, {
		x: TIP.x,
		y: TIP.y,
		radius: 12,
		colour: C.ghost,
		strength: 0.35,
		steps: 2,
	});
	drawFloor(layer);

	const stand = createCanvas(64, 64);
	drawStand(stand);
	drawBox(stand);
	drawWire(stand);
	outline(stand, C.ink);
	underlay(stand, layer);

	drawDome(scene);
	drawBand(scene);
	drawEars(scene);
	drawStrap(scene);
	drawGauge(scene);
	drawAntenna(scene);
	outline(scene, C.ink);
	underlay(scene, stand);

	glow(scene, {
		x: GAUGE.x,
		y: GAUGE.y,
		radius: 7,
		colour: C.ghost,
		strength: 0.3,
		steps: 1,
		skip: [C.ink, C.ghost, C.ghostLight, C.ghostShade],
	});
	drawGleams(scene);
	return scene;
}

/**
 * The night: two plain bands of dark sky and a few stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawNight(layer, random) {
	rect(layer, 0, 0, 64, 18, SKY_TOP);
	rect(layer, 0, 18, 64, FLOOR - 18, SKY);
	for (let i = 0; i < 14; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			Math.floor(random() * (FLOOR - 4)),
			C.starDim
		);
	}
}

/**
 * The spiral waves: two green arms winding out from behind the helmet, fading as they spread.
 * @param {Canvas} layer
 */
function drawSpiral(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - SPIRAL.x;
			const dy = y - SPIRAL.y;
			const r = Math.hypot(dx, dy);
			const turn = r / 9 - Math.atan2(dy, dx) / Math.PI;
			const phase = turn - Math.floor(turn);
			if (phase > 0.34) {
				continue;
			}
			const strength = r < 20 ? 0.72 : r < 30 ? 0.52 : 0.32;
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			// Each arm has a bright leading edge, as if the wave were moving outwards.
			const tone = phase < 0.09 ? C.ghost : C.ghostShade;
			set(layer, x, y, mix(behind, tone, strength));
		}
	}
}

/**
 * Two bright rings pulsing from the antenna's ball, open at the bottom where the antenna rises.
 * @param {Canvas} layer
 */
function drawPulses(layer) {
	const rings = [
		{ r: 5, colour: C.ghost },
		{ r: 8.5, colour: mix(C.ghostShade, C.ghost, 0.5) },
	];
	for (const { r, colour } of rings) {
		for (let a = 0; a < Math.PI * 2; a += 0.02) {
			if (Math.sin(a) > 0.55) {
				continue;
			}
			set(
				layer,
				Math.round(TIP.x + Math.cos(a) * r),
				Math.round(TIP.y + Math.sin(a) * r),
				colour
			);
		}
	}
}

/**
 * The floor: a lit front edge, the dark floor, and the stand's and the box's shadows.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	rect(layer, 0, FLOOR, 64, 1, FLOOR_TOP);
	rect(layer, 0, FLOOR + 1, 64, 64 - FLOOR - 1, FLOOR_FILL);
	rect(layer, 18, FLOOR + 1, 34, 2, FLOOR_SHADOW);
	rect(layer, 22, FLOOR + 3, 26, 1, FLOOR_SHADOW);
	rect(layer, 49, FLOOR + 1, 12, 2, FLOOR_SHADOW);
}

/**
 * Picks a tone for a point on a lit ball: a gleam, a lit face, the body and the shade, with light from the upper left.
 * @param {number} dx - Column offset from the ball's centre
 * @param {number} dy - Row offset from the ball's centre
 * @param {number} r - The ball's radius
 * @param {[Colour, Colour, Colour, Colour]} tones - Gleam, light, body and shade
 * @returns {Colour}
 */
function ballTone(dx, dy, r, tones) {
	const nx = dx / r;
	const ny = dy / r;
	const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
	const lit = -nx * 0.5 - ny * 0.55 + nz * 0.67;
	if (lit > 0.93) {
		return tones[0];
	}
	if (lit > 0.66) {
		return tones[1];
	}
	if (lit > 0.2) {
		return tones[2];
	}
	return tones[3];
}

/** @type {[Colour, Colour, Colour, Colour]} */
const BRASS_TONES = [C.lampGlow, C.gold, C.brass, C.lampFrame];

/**
 * The dome: a brass bowl lit from the upper left, with a riveted strap running over its crown.
 * @param {Canvas} scene
 */
function drawDome(scene) {
	for (let y = DOME.y - DOME.r - 1; y < DOME.y + 2; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - DOME.x;
			const dy = y + 0.5 - DOME.y;
			if (Math.hypot(dx, dy) >= DOME.r || y >= BAND.y + sag(x)) {
				continue;
			}
			set(scene, x, y, ballTone(dx, dy, DOME.r, BRASS_TONES));
		}
	}
	// The two seams of the strap over the crown.
	for (let y = DOME.y - DOME.r; y < DOME.y; y++) {
		for (const x of [28, 35]) {
			if (
				Math.hypot(x - DOME.x, y + 0.5 - DOME.y) < DOME.r - 1 &&
				y < BAND.y + sag(x)
			) {
				set(scene, x, y, C.lampFrame);
			}
		}
	}
}

/**
 * How far the band dips at a column: it curves down towards the front, as seen from a little above.
 * @param {number} x
 * @returns {number}
 */
function sag(x) {
	const reach = DOME.r + BAND.over + 0.5;
	return Math.round(2 * Math.max(0, 1 - ((x - DOME.x) / reach) ** 2));
}

/**
 * The brim band: a brass ring round the dome's foot, curving towards the front, lit along its top, with a row of rivets.
 * @param {Canvas} scene
 */
function drawBand(scene) {
	const left = Math.ceil(DOME.x - DOME.r - BAND.over);
	const right = Math.floor(DOME.x + DOME.r + BAND.over);
	for (let x = left; x <= right; x++) {
		const top = BAND.y + sag(x);
		rect(scene, x, top, 1, BAND.h, C.brass);
		set(scene, x, top, C.gold);
		set(scene, x, top + BAND.h - 1, C.lampFrame);
		if ((x - left) % 4 === 3 && x < right - 1) {
			set(scene, x, top + 1, C.lampGlow);
			set(scene, x, top + 2, C.lampFrame);
		}
	}
}

/** @type {[Colour, Colour, Colour, Colour]} */
const COPPER_TONES = [
	C.gold,
	C.amber,
	mix(C.amber, C.lampFrame, 0.5),
	C.lampFrame,
];

/**
 * The earpieces: copper discs with a dark grille in the middle.
 * @param {Canvas} scene
 */
function drawEars(scene) {
	for (const ear of EARS) {
		for (let y = ear.y - 5; y <= ear.y + 5; y++) {
			for (let x = ear.x - 5; x <= ear.x + 5; x++) {
				const dx = x - ear.x;
				const dy = y - ear.y;
				if (Math.hypot(dx, dy) >= 4.3) {
					continue;
				}
				set(scene, x, y, ballTone(dx, dy, 4.3, COPPER_TONES));
			}
		}
		rect(scene, ear.x - 1, ear.y - 1, 2, 2, C.lampFrame);
		set(scene, ear.x, ear.y, C.ghostShade);
	}
}

/**
 * The gauge: a round green glass lens in a brass bezel on the front of the dome, lit from within.
 * @param {Canvas} scene
 */
function drawGauge(scene) {
	for (let y = 17; y <= 28; y++) {
		for (let x = 25; x <= 38; x++) {
			const dx = x - GAUGE.x;
			const dy = y - GAUGE.y;
			const d = Math.hypot(dx, dy);
			if (d < GAUGE.r - 0.6) {
				let colour = C.ghost;
				if (dx + dy < -2.6) {
					colour = C.ghostLight;
				} else if (dx + dy > 2) {
					colour = C.ghostShade;
				}
				set(scene, x, y, colour);
			} else if (d < GAUGE.r + 1) {
				set(scene, x, y, dx + dy < 0 ? C.gold : C.lampFrame);
			}
		}
	}
}

/**
 * The antenna: a brass rod rising from the crown, wound with a coil, and a glowing green ball on top.
 * @param {Canvas} scene
 */
function drawAntenna(scene) {
	rect(scene, 31, 9, 1, DOME.y - DOME.r - 9, C.gold);
	rect(scene, 32, 9, 1, DOME.y - DOME.r - 9, C.brass);
	// The collar it stands in.
	rect(scene, 29, DOME.y - DOME.r - 1, 6, 1, C.gold);
	rect(scene, 29, DOME.y - DOME.r, 6, 1, C.lampFrame);
	// The coil round the rod.
	for (let y = 10; y <= 13; y += 1) {
		set(scene, 30, y, y % 2 ? C.amber : C.gold);
		set(scene, 33, y, y % 2 ? C.lampFrame : C.amber);
	}
	for (let y = 1; y <= 10; y++) {
		for (let x = 27; x <= 36; x++) {
			const dx = x - TIP.x;
			const dy = y - TIP.y;
			const d = Math.hypot(dx, dy);
			if (d >= TIP.r + 0.3) {
				continue;
			}
			set(
				scene,
				x,
				y,
				dx + dy < -1
					? C.ghostLight
					: dx + dy > 1.2
						? C.ghostShade
						: C.ghost
			);
		}
	}
}

/**
 * The stand: a turned wooden pole the helmet rests on, and a round foot on the floor.
 * @param {Canvas} stand
 */
function drawStand(stand) {
	// The pole, lit on its left.
	rect(stand, 30, 34, 4, 17, C.timber);
	rect(stand, 30, 34, 1, 17, C.timberLight);
	rect(stand, 33, 34, 1, 17, C.timberShade);
	// A ring turned halfway down.
	rect(stand, 28, 42, 8, 2, C.timber);
	rect(stand, 28, 42, 8, 1, C.timberLight);
	rect(stand, 34, 42, 2, 2, C.timberShade);
	// The round foot.
	rect(stand, 19, 51, 26, 5, C.timber);
	rect(stand, 21, 50, 22, 1, C.timberLight);
	rect(stand, 19, 51, 26, 1, C.timberLight);
	rect(stand, 19, 55, 26, 1, C.timberShade);
	rect(stand, 40, 52, 5, 3, C.timberShade);
}

/** The leather chin strap: its body and its shaded underside. */
const STRAP = mix(C.timber, C.brickRedShade, 0.45);
const STRAP_SHADE = mix(C.timberShade, C.brickRedShade, 0.35);

/**
 * The chin strap: a leather loop hanging from one earpiece to the other, with a brass buckle at the bottom.
 * @param {Canvas} scene
 */
function drawStrap(scene) {
	const [left, right] = EARS;
	for (let x = left.x + 1; x <= right.x - 1; x++) {
		const t = (x - left.x) / (right.x - left.x);
		const y = Math.round(left.y + 4 + 9 * (1 - (2 * t - 1) ** 2));
		set(scene, x, y, STRAP);
		set(scene, x, y + 1, STRAP_SHADE);
	}
	// The buckle.
	const y = left.y + 12;
	rect(scene, 30, y, 4, 4, C.brass);
	rect(scene, 30, y, 4, 1, C.gold);
	set(scene, 31, y + 1, STRAP_SHADE);
	set(scene, 32, y + 1, STRAP_SHADE);
	set(scene, 31, y + 2, STRAP);
	set(scene, 32, y + 2, STRAP);
	rect(scene, 30, y + 3, 4, 1, C.lampFrame);
}

/**
 * The control box on the floor: a steel case with a brass knob and a green lamp.
 * @param {Canvas} scene
 */
function drawBox(scene) {
	rect(scene, 49, 47, 11, 9, STEEL);
	rect(scene, 49, 47, 11, 1, STEEL_LIGHT);
	rect(scene, 49, 47, 1, 9, STEEL_LIGHT);
	rect(scene, 58, 48, 2, 8, STEEL_SHADE);
	rect(scene, 50, 55, 10, 1, STEEL_SHADE);
	// The knob.
	rect(scene, 51, 50, 3, 3, C.brass);
	set(scene, 51, 50, C.gold);
	set(scene, 53, 52, C.lampFrame);
	// The lamp.
	rect(scene, 55, 50, 2, 2, C.ghost);
	set(scene, 55, 50, C.ghostLight);
}

/**
 * The cable from the right earpiece down to the control box.
 * @param {Canvas} scene
 */
function drawWire(scene) {
	const points = [
		[48, 37],
		[51, 40],
		[53, 41],
		[55, 42],
		[56, 44],
		[56, 46],
	];
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		line(scene, x0, y0, x1, y1, C.brickRed);
	}
}

/**
 * The last gleams over the outline: on the dome's shoulder and the band.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[22, 20],
		[21, 21],
		[19, 30],
		[20, 30],
	]) {
		set(scene, x, y, C.lampGlow);
	}
}
