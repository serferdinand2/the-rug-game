// Microphone: a chrome ribbon microphone of the 1930s on its stand, alone in a spotlight in a studio at night.
import {
	createCanvas,
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

/** The microphone's head: its centre and its half-width and half-height. */
const MIC = { cx: 31.5, cy: 20, a: 12, b: 15 };

/** How square the head's rounded outline is: 2 is an ellipse, higher is squarer. */
const SQUARENESS = 2.6;

/** The row where the studio wall meets the floor. */
const FLOOR = 51;

/** The spotlight, out of frame at the top left, and the pool it throws on the floor. */
const SPOT = { x: 25, y: -20 };
const POOL = { x: 33, y: 58, rx: 25, ry: 5 };

/** The red on-air lamp on the wall, top right. */
const LAMP = { x: 55, y: 9 };

/** The studio wall at night: a dusky blue wall over a darker dado, split by a rail. */
const WALL = C.nightSky5;
const DADO = C.nightSky4;
const RAIL = C.nightSky6;
const DADO_TOP = 36;

/** The stage floor, its seams, and the shadow the stand casts across it. */
const BOARD = mix(C.floorShade, C.roof, 0.3);
const BOARD_SEAM = mix(C.floorShade, C.ink, 0.35);
const POOL_OUTER = C.floorLight;
const POOL_INNER = mix(C.floorLight, C.lampGlow, 0.35);
const SHADOW = mix(C.floorShade, C.ink, 0.3);

/** The dark gaps between the grille's slats. */
const GAP = mix(C.stoneShade, C.ink, 0.55);

/** The rubber cable. */
const CABLE = C.stoneShade;
const CABLE_LIGHT = C.stone;

/**
 * Draws the Microphone tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5517);

	drawWall(layer);
	drawFloor(layer);
	glow(layer, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 8,
		colour: C.brickRedLight,
		strength: 0.3,
		steps: 2,
	});
	drawMotes(layer, random);

	drawCable(scene);
	drawBase(scene);
	drawStem(scene);
	drawYoke(scene);
	drawHead(scene);
	drawLamp(scene);
	outline(scene, C.ink);
	// The warm spotlight catching the chrome from above.
	glow(scene, {
		x: 24,
		y: 4,
		radius: 26,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 2,
		skip: [C.ink, C.white, GAP],
	});
	underlay(scene, layer);

	drawGlints(scene);
	return scene;
}

/**
 * How far a pixel lies inside the spotlight's beam: 2 in its bright core, 1 in its edge, 0 outside.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function inBeam(x, y) {
	const axis = Math.atan2(POOL.y - SPOT.y, POOL.x - SPOT.x);
	const angle = Math.atan2(y - SPOT.y, x - SPOT.x);
	const off = Math.abs(angle - axis);
	if (off < 0.17) {
		return 2;
	}
	return off < 0.33 ? 1 : 0;
}

/**
 * The studio wall: three bands of blue, with the spotlight's beam slanting through them.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < FLOOR; y++) {
		let base = y < DADO_TOP ? WALL : DADO;
		if (y === DADO_TOP) {
			base = RAIL;
		}
		for (let x = 0; x < 64; x++) {
			const beam = inBeam(x, y);
			set(layer, x, y, beam ? mix(base, C.lampGlow, beam * 0.12) : base);
		}
	}
	rect(layer, 0, FLOOR - 1, 64, 1, mix(C.nightSky4, C.ink, 0.4));
}

/**
 * The stage floor: dark boards, the spotlight's pool on them, and the stand's shadow falling to the right.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const pool = Math.hypot(
				(x - POOL.x) / POOL.rx,
				(y - POOL.y) / POOL.ry
			);
			let colour = (y - FLOOR) % 5 === 4 ? BOARD_SEAM : BOARD;
			if (pool < 0.55) {
				colour = POOL_INNER;
			} else if (pool < 1) {
				colour = POOL_OUTER;
			}
			set(layer, x, y, colour);
		}
	}
	for (let y = 56; y <= 60; y++) {
		for (let x = 40; x < 64; x++) {
			if (Math.hypot((x - 49) / 11, (y - 58) / 2.2) < 1) {
				set(layer, x, y, SHADOW);
			}
		}
	}
}

/**
 * A few specks of dust caught in the beam.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMotes(layer, random) {
	const mote = mix(WALL, C.lampGlow, 0.55);
	for (let i = 0; i < 400; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 30);
		if (inBeam(x, y) && (x < 19 || x > 44 || y < 5) && random() < 0.3) {
			set(layer, x, y, mote);
		}
	}
}

/**
 * The chrome tone of a column across a rounded part, lit from the upper left: a bright streak, then darker towards the right, with a faint rim of reflected light.
 * @param {number} n - Across the part, from -1 at its left edge to 1 at its right
 * @returns {Colour}
 */
function chrome(n) {
	if (n < -0.72) {
		return C.stoneLight;
	}
	if (n < -0.38) {
		return C.white;
	}
	if (n < 0.05) {
		return C.stoneLight;
	}
	if (n < 0.5) {
		return C.stone;
	}
	return n < 0.84 ? C.stoneShade : C.stone;
}

/**
 * One step darker than a chrome tone, for the grille's slats.
 * @param {Colour} tone
 * @returns {Colour}
 */
function darker(tone) {
	if (tone === C.white) {
		return C.stoneLight;
	}
	if (tone === C.stoneLight) {
		return C.stone;
	}
	return C.stoneShade;
}

/**
 * Whether a pixel lies inside the head's rounded outline, shrunk by an inset.
 * @param {number} x
 * @param {number} y
 * @param {number} inset
 * @returns {boolean}
 */
function inHead(x, y, inset) {
	const dx = Math.abs(x - MIC.cx) / (MIC.a - inset);
	const dy = Math.abs(y - MIC.cy) / (MIC.b - inset);
	return dx ** SQUARENESS + dy ** SQUARENESS <= 1;
}

/**
 * The head: a rounded chrome capsule, its frame and middle band solid, the rest a grille of slats over dark gaps.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = MIC.cy - MIC.b; y <= MIC.cy + MIC.b; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inHead(x, y, 0)) {
				continue;
			}
			const tone = chrome((x - MIC.cx) / MIC.a);
			const band = Math.abs(y - MIC.cy) <= 1;
			if (!inHead(x, y, 2.2) || band) {
				set(scene, x, y, tone);
			} else {
				set(scene, x, y, (y - MIC.cy) % 2 === 0 ? darker(tone) : GAP);
			}
		}
	}
	// The middle band's lower lip, a shade under its bright face.
	for (let x = 0; x < 64; x++) {
		if (inHead(x, MIC.cy + 2, 0)) {
			set(scene, x, MIC.cy + 2, C.stoneShade);
		}
	}
}

/**
 * The yoke: a chrome hoop round the lower half of the head, with a pivot knob at each side.
 * @param {Canvas} scene
 */
function drawYoke(scene) {
	const outer = { a: MIC.a + 3.5, b: MIC.b + 5 };
	const inner = { a: MIC.a + 1.5, b: MIC.b + 3 };
	for (let y = MIC.cy; y <= MIC.cy + outer.b; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - MIC.cx;
			const dy = y - MIC.cy;
			const out = Math.hypot(dx / outer.a, dy / outer.b);
			const into = Math.hypot(dx / inner.a, dy / inner.b);
			if (out <= 1 && into > 1) {
				const lower = dy > outer.b * 0.75;
				set(scene, x, y, lower ? C.stone : chrome(dx / outer.a));
			}
		}
	}
	for (const side of [-1, 1]) {
		const kx = Math.round(MIC.cx + side * (MIC.a + 2.5));
		rect(scene, kx - 1, MIC.cy - 2, 3, 5, C.stoneShade);
		rect(scene, kx - 1, MIC.cy - 2, 2, 4, C.stoneLight);
		set(scene, kx - 1, MIC.cy - 2, C.white);
		set(scene, kx, MIC.cy, C.stone);
	}
}

/**
 * The stand's chrome stem, from the yoke down to the base, with a clamp collar part way down.
 * @param {Canvas} scene
 */
function drawStem(scene) {
	const top = MIC.cy + MIC.b + 4;
	const tones = [C.stoneLight, C.white, C.stone, C.stoneShade];
	tones.forEach((tone, i) => {
		rect(scene, 30 + i, top, 1, 56 - top, tone);
	});
	const collar = [C.stoneLight, C.stoneLight, C.white, C.stoneLight];
	collar.push(C.stone, C.stone, C.stoneShade, C.stoneShade);
	collar.forEach((tone, i) => {
		rect(scene, 28 + i, 44, 1, 3, tone);
	});
	rect(scene, 28, 47, 8, 1, C.stoneShade);
}

/**
 * The heavy round base: a dished top lit from the left, and its dark rim.
 * @param {Canvas} scene
 */
function drawBase(scene) {
	const cx = 31.5;
	const cy = 56;
	for (let y = cy - 3; y <= cy + 5; y++) {
		for (let x = 18; x < 46; x++) {
			const dx = (x - cx) / 12;
			const top = Math.hypot(dx, (y - cy) / 3);
			const side = Math.hypot(dx, (y - cy - 2) / 3);
			if (top <= 1) {
				let tone = C.stone;
				if (dx < -0.4 && y <= cy) {
					tone = C.stoneLight;
				} else if (dx > 0.45) {
					tone = C.stoneShade;
				}
				set(scene, x, y, tone);
			} else if (side <= 1) {
				set(scene, x, y, dx < -0.5 ? C.stoneShade : GAP);
			}
		}
	}
}

/**
 * The braided cloth cable, running from the base across the floor and out of the frame.
 * @param {Canvas} scene
 */
function drawCable(scene) {
	const points = [
		[42, 59],
		[47, 61],
		[53, 61],
		[57, 59],
		[60, 57],
		[64, 58],
	];
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		line(scene, x0, y0 + 1, x1, y1 + 1, CABLE);
		line(scene, x0, y0, x1, y1, CABLE_LIGHT);
	}
}

/**
 * The on-air lamp: a small dark housing with a round red glass, lit. No lettering.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	const { x, y } = LAMP;
	rect(scene, x - 4, y - 3, 9, 7, C.wood);
	rect(scene, x - 4, y - 3, 9, 1, C.timber);
	rect(scene, x - 1, y - 2, 3, 5, C.brickRed);
	rect(scene, x - 2, y - 1, 5, 3, C.brickRed);
	rect(scene, x - 1, y - 2, 2, 1, C.brickRedLight);
	rect(scene, x - 2, y - 1, 2, 2, C.brickRedLight);
	rect(scene, x, y + 2, 2, 1, C.brickRedShade);
	set(scene, x + 2, y + 1, C.brickRedShade);
	set(scene, x - 1, y - 1, C.white);
}

/**
 * The spotlight catching the chrome: a star of light on the head and a gleam on the knob and base, over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	const gx = 25;
	const gy = 10;
	set(scene, gx, gy, C.white);
	for (const [dx, dy] of [
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	]) {
		set(scene, gx + dx, gy + dy, C.lampGlow);
	}
	set(scene, gx, gy - 2, mix(C.lampGlow, C.stoneLight, 0.5));
	set(scene, gx, gy + 2, mix(C.lampGlow, C.stoneLight, 0.5));
	set(scene, 23, 55, C.white);
}
