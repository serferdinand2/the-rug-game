// Duct Tape: a big silver roll of tape on the floor, its strip running up to a cracked red pipe it is wrapped round to stop a leak.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The roll: the centre and radius of its front face, and how far its far face sits back to the right and up. */
const ROLL = { x: 24, y: 42, r: 17, dx: 6, dy: -2 };

/** The cardboard core: its outer and inner radius. */
const CORE = { outer: 8.5, inner: 6.5 };

/** The pipe: its top and bottom rows. */
const PIPE = { top: 6, bottom: 17 };

/** The tape wrapped round the pipe: its first and last column. */
const WRAP = { left: 25, right: 36 };

/** The rows of the dado rail and the floor. */
const ROWS = { rail: 34, floor: 55 };

/** The wall: warm plaster above a darker dado, and the shadows cast on it. */
const WALL = C.plaster;
const WALL_SHADOW = mix(C.plaster, C.plasterShade, 0.6);
const DADO = mix(C.plasterShade, C.timber, 0.25);
const DADO_SHADOW = mix(DADO, C.ink, 0.25);
const DADO_SEAM = mix(DADO, C.ink, 0.12);
const WALL_SHADOW_SOFT = mix(C.plaster, C.plasterShade, 0.3);

/** The damp streak the leak has left down the wall. */
const DAMP = mix(C.plaster, C.plasterShade, 0.45);

/** Daylight from a window off to the left, falling on the upper wall. */
const WALL_LIT = mix(C.plaster, C.plasterLight, 0.7);
const WALL_SOFT = mix(C.plaster, C.plasterLight, 0.35);

/** The floorboards and the roll's shadow on them. */
const FLOOR_SHADOW = mix(C.floor, C.ink, 0.35);

/** The silver tape: highlight, body, shade and the darker lines of the wound layers. */
const TAPE_LIGHT = C.snow;
const TAPE = mix(C.stoneLight, C.snowShade, 0.4);
const TAPE_SHADE = mix(C.stone, C.snowShade, 0.15);
const TAPE_LINE = mix(C.stone, C.stoneShade, 0.5);

/** The water seeping from the crack. */
const WATER = C.daySea1;
const WATER_LIGHT = C.dayWave;

/**
 * Draws the Duct Tape tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5821);

	drawRoom(layer, random);
	drawDrips(layer);

	drawPipe(scene);
	drawCrack(scene);
	drawBracket(scene);
	drawWrap(scene);
	drawRoll(scene);
	const strip = createCanvas(64, 64);
	drawStrip(strip);
	outline(strip, C.ink);
	for (let i = 0; i < strip.p.length; i++) {
		const colour = strip.p[i];
		// Its outline is left off where it meets the wrap, so the strip runs on into it.
		if (colour && !(colour === C.ink && i < (PIPE.bottom + 2) * 64)) {
			scene.p[i] = colour;
		}
	}
	outline(scene, C.ink);
	underlay(scene, layer);

	drawGleams(scene);
	return scene;
}

/**
 * The room: the two-tone wall with its rail, the pipe's shadow, the floorboards and the roll's shadow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoom(layer, random) {
	rect(layer, 0, 0, 64, ROWS.rail, WALL);
	for (let y = 0; y < ROWS.rail; y++) {
		const reach = 26 - Math.round(y * 0.55);
		rect(layer, 0, y, reach, 1, WALL_SOFT);
		rect(layer, 0, y, reach - 8, 1, WALL_LIT);
	}
	rect(layer, 0, PIPE.bottom + 2, 64, 1, WALL_SHADOW);
	rect(layer, 0, PIPE.bottom + 3, 64, 1, WALL_SHADOW_SOFT);
	rect(layer, 0, ROWS.rail, 64, 1, C.plasterLight);
	rect(layer, 0, ROWS.rail + 1, 64, 1, C.plasterShade);
	rect(layer, 0, ROWS.rail + 2, 64, ROWS.floor - ROWS.rail - 2, DADO);
	for (let x = 5; x < 64; x += 12) {
		rect(layer, x, ROWS.rail + 2, 1, ROWS.floor - ROWS.rail - 2, DADO_SEAM);
	}
	rect(layer, 0, ROWS.floor, 64, 64 - ROWS.floor, C.floor);
	rect(layer, 0, ROWS.floor, 64, 1, C.floorLight);
	for (const y of [59, 63]) {
		rect(layer, 0, y, 64, 1, C.floorShade);
	}
	for (let i = 0; i < 3; i++) {
		const x = Math.floor(random() * 56);
		rect(layer, x, 61 - (i % 2) * 4, 5, 1, C.floorShade);
	}
	// The roll's shadow, thrown right, away from the light on the upper left.
	for (let y = ROWS.floor - 12; y < ROWS.floor; y++) {
		const start = ROLL.x + ROLL.r + 4 - Math.round((ROWS.floor - y) * 0.2);
		rect(
			layer,
			start,
			y,
			4 + Math.round((y - ROWS.floor + 12) * 0.4),
			1,
			DADO_SHADOW
		);
	}
	for (let y = ROWS.floor + 1; y < 61; y++) {
		rect(layer, ROLL.x + 8, y, 24 - (y - ROWS.floor) * 2, 1, FLOOR_SHADOW);
	}
}

/**
 * Water still seeping from the end of the crack: two falling drops and a small puddle on the floor.
 * @param {Canvas} layer
 */
function drawDrips(layer) {
	const x = 51;
	for (let y = PIPE.bottom + 2; y < ROWS.rail; y++) {
		rect(layer, x - 1, y, y > PIPE.bottom + 8 ? 3 : 2, 1, DAMP);
	}
	rect(layer, x, PIPE.bottom + 3, 1, 2, WATER);
	rect(layer, x, PIPE.bottom + 11, 2, 2, WATER);
	set(layer, x, PIPE.bottom + 11, WATER_LIGHT);
	rect(layer, x, PIPE.bottom + 13, 2, 1, WATER);
	rect(layer, x - 1, PIPE.bottom + 12, 1, 1, WATER);
	for (let y = 0; y < 3; y++) {
		const half = [3, 6, 4][y];
		rect(
			layer,
			x - half + 1,
			57 + y,
			half * 2,
			1,
			y === 0 ? WATER_LIGHT : WATER
		);
	}
}

/**
 * The red iron pipe running across the wall: lit along its top, shaded underneath.
 * @param {Canvas} scene
 */
function drawPipe(scene) {
	for (let y = PIPE.top; y <= PIPE.bottom; y++) {
		const v = (y - PIPE.top) / (PIPE.bottom - PIPE.top);
		let colour = C.brickRed;
		if (v < 0.25) {
			colour = C.brickRedLight;
		} else if (v > 0.68) {
			colour = C.brickRedShade;
		}
		rect(scene, 0, y, 64, 1, colour);
	}
}

/**
 * The crack: a jagged dark split running along the pipe, its end showing past the tape.
 * @param {Canvas} scene
 */
function drawCrack(scene) {
	const points = [
		[21, 11],
		[24, 12],
		[28, 10],
		[32, 12],
		[37, 11],
		[41, 13],
		[45, 11],
		[48, 13],
		[51, 14],
	];
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		line(scene, x0, y0, x1, y1, C.ink);
	}
	// A dark wet stain round the crack's open end.
	for (const [x, y] of [
		[49, 14],
		[50, 15],
		[51, 15],
		[52, 15],
		[50, 16],
		[51, 16],
	]) {
		set(scene, x, y, mix(C.brickRedShade, C.ink, 0.35));
	}
}

/**
 * A steel bracket clamping the pipe to the wall on the left.
 * @param {Canvas} scene
 */
function drawBracket(scene) {
	const x = 7;
	rect(scene, x, PIPE.top - 1, 4, PIPE.bottom - PIPE.top + 3, C.stone);
	rect(scene, x, PIPE.top - 1, 1, PIPE.bottom - PIPE.top + 3, C.stoneLight);
	rect(
		scene,
		x + 3,
		PIPE.top - 1,
		1,
		PIPE.bottom - PIPE.top + 3,
		C.stoneShade
	);
	set(scene, x + 1, PIPE.top + 1, C.stoneMid);
	set(scene, x + 1, PIPE.bottom - 1, C.stoneMid);
}

/**
 * The tape wound round the pipe: a silver band a pixel proud of it, with the slanting edges of each turn.
 * @param {Canvas} scene
 */
function drawWrap(scene) {
	for (let y = PIPE.top - 1; y <= PIPE.bottom + 1; y++) {
		const v = (y - PIPE.top + 1) / (PIPE.bottom - PIPE.top + 2);
		for (let x = WRAP.left; x <= WRAP.right; x++) {
			let colour = TAPE;
			if (v < 0.22) {
				colour = TAPE_LIGHT;
			} else if (v > 0.7) {
				colour = TAPE_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The edges of the overlapping turns, slanting across the band.
	for (const start of [WRAP.left + 3, WRAP.left + 7]) {
		for (let y = PIPE.top - 1; y <= PIPE.bottom + 1; y++) {
			const x = start + Math.round((y - PIPE.top) * 0.3);
			if (x < WRAP.right) {
				set(scene, x, y, TAPE_LINE);
			}
		}
	}
	// A crease where the tape bunched.
	line(
		scene,
		WRAP.right - 2,
		PIPE.top + 3,
		WRAP.right - 4,
		PIPE.top + 8,
		TAPE_SHADE
	);
}

/**
 * The strip of tape running taut from the top of the roll up to the wrap.
 * @param {Canvas} scene
 */
function drawStrip(scene) {
	const bottom = { l: [21, 27], r: [30, 25] };
	const top = { l: [26, PIPE.bottom + 1], r: [35, PIPE.bottom + 1] };
	for (let t = 0; t <= 1; t += 0.02) {
		for (let s = 0; s <= 1; s += 0.04) {
			const lx = bottom.l[0] + (top.l[0] - bottom.l[0]) * t;
			const ly = bottom.l[1] + (top.l[1] - bottom.l[1]) * t;
			const rx = bottom.r[0] + (top.r[0] - bottom.r[0]) * t;
			const ry = bottom.r[1] + (top.r[1] - bottom.r[1]) * t;
			const x = Math.round(lx + (rx - lx) * s);
			const y = Math.round(ly + (ry - ly) * s);
			let colour = TAPE;
			if (s < 0.2) {
				colour = TAPE_LIGHT;
			} else if (s > 0.8) {
				colour = TAPE_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The roll: its silver outer side turning away to the right, the front face with the rings of wound tape,
 * and the cardboard core with its hole.
 * @param {Canvas} scene
 */
function drawRoll(scene) {
	const { x: cx, y: cy, r, dx, dy } = ROLL;
	const back = { x: cx + dx, y: cy + dy };
	// The outer side: the sweep between the front face and the far one.
	for (let y = cy - r + dy - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + dx + 1; x++) {
			let covered = false;
			for (let k = 0; k <= 1; k += 0.1) {
				if (Math.hypot(x - cx - dx * k, y - cy - dy * k) <= r) {
					covered = true;
					break;
				}
			}
			if (!covered) {
				continue;
			}
			const angle = Math.atan2(y - back.y, x - back.x);
			// Lit where the side turns up, shaded where it turns down and right.
			let colour = TAPE;
			if (angle < -Math.PI * 0.45) {
				colour = TAPE_LIGHT;
			} else if (angle > Math.PI * 0.05) {
				colour = TAPE_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The front face: wound layers as faint rings, lit towards the upper left.
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const ux = x - cx;
			const uy = y - cy;
			const d = Math.hypot(ux, uy);
			if (d > r) {
				continue;
			}
			let colour = TAPE;
			if (d > CORE.outer && Math.round(d) % 3 === 0 && d < r - 1) {
				colour = TAPE_LINE;
			} else if (d > r - 1.5 && ux + uy < -4) {
				colour = TAPE_LIGHT;
			} else if (ux + uy > r * 0.55) {
				colour = TAPE_SHADE;
			}
			if (d <= CORE.outer) {
				colour = ux + uy < 0 ? C.sand : C.sandShade;
				if (d > CORE.outer - 1 && ux + uy < -3) {
					colour = C.sandLight;
				}
			}
			if (d <= CORE.inner) {
				// The hole: the inside of the core where the far opening doesn't show.
				const far = Math.hypot(x - back.x, y - back.y) <= CORE.inner;
				if (far) {
					scene.p[y * scene.w + x] = null;
					continue;
				}
				colour = mix(C.sandShade, C.timber, 0.45);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Bright glints on the silver tape, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[13, 31],
		[14, 30],
		[11, 34],
		[28, 6],
		[29, 6],
		[3, 7],
		[4, 7],
		[15, 7],
		[16, 7],
		[17, 7],
		[45, 7],
		[46, 7],
	]) {
		set(scene, x, y, C.white);
	}
}
