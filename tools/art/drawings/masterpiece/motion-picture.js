// Motion Picture: a hand-cranked film projector on its tripod in a dark hall at night, its two reels turning, a long cone of dusty light streaming from its lens to a far bright screen.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
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

/** The two reels on their arms: the take-up reel at the back and the full feed reel at the front, with the radius of film wound on each. */
const REELS = [
	{ x: 11, y: 12, r: 9, coil: 4.5, turn: 0.4 },
	{ x: 29, y: 13, r: 9, coil: 7.2, turn: 1.3 },
];

/** The body: the lamp house at the back and the mechanism in front of it, by their columns and rows. */
const LAMP_HOUSE = { left: 3, right: 13, top: 23, bottom: 43 };
const WORKS = { left: 13, right: 32, top: 26, bottom: 43 };

/** The lens barrel, from the body to its glass, and the crank on the mechanism's side. */
const LENS = { left: 33, right: 39, y: 32, half: 3 };
const CRANK = { x: 22, y: 34 };

/** The beam: where it leaves the glass, the angle of its middle and its half-width, in radians. */
const BEAM = { x: 41, y: 32, axis: -0.12, half: 0.44 };

/** The column from which the beam pales towards the far screen beyond the right edge. */
const SCREEN = { from: 56 };

/** The tripod's three legs: the column each foot stands on, and the tones of its two edges. */
const LEGS = [
	{ foot: 5, lit: C.timberLight, shade: C.timberShade },
	{ foot: 19, lit: C.timber, shade: C.timberShade },
	{ foot: 33, lit: C.timberShade, shade: C.wood },
];

/** The floor the tripod stands on. */
const FLOOR = 56;

/** The dark hall: a warm black, deeper towards the ceiling. */
const HALL = mix(C.night, C.wood, 0.35);
const HALL_DARK = mix(C.ink, C.night, 0.5);
const HALL_FLOOR = mix(C.wood, C.night, 0.4);
const HALL_FLOOR_DARK = mix(C.wood, C.ink, 0.55);

/** The light: a cool white from the arc lamp, and the specks of dust drifting in it. */
const LIGHT = mix(C.white, C.daySky6, 0.35);
const DUST = C.white;

/** The rows of seats below the beam, their backs caught by the screen's light. */
const SEAT = mix(C.brickRedShade, C.night, 0.72);
const SEAT_LIGHT = mix(C.brickRedShade, C.stoneShade, 0.55);
const SEAT_DARK = mix(C.brickRedShade, C.ink, 0.85);

/** The projector's dark enamel: a rim of light on the screen side, the body and its shadowed side. */
const ENAMEL_RIM = C.stone;
const ENAMEL_LIGHT = C.stoneShade;
const ENAMEL = mix(C.stoneShade, C.night, 0.45);
const ENAMEL_DARK = mix(C.night, C.ink, 0.35);

/** The film: wound on the reels and running in a strip, with its sprocket holes. */
const FILM = mix(C.amber, C.wood, 0.6);
const FILM_LIGHT = mix(C.amber, C.wood, 0.3);

/** The reels' plates while they spin: the blurred edge of each window. */
const BLUR = mix(C.stoneMid, HALL, 0.5);

/** The arc lamp's glow leaking through the lamp house's vents. */
const ARC = C.amber;
const ARC_HOT = C.gold;

/**
 * Draws the Motion Picture masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1895);

	drawHall(layer);
	drawSeats(layer);
	drawBeam(layer, random);
	drawScreen(layer);

	drawTripod(scene);
	drawFilm(scene);
	for (const reel of REELS) {
		drawReelArm(scene, reel);
	}
	drawLampHouse(scene);
	drawWorks(scene);
	drawLens(scene);
	for (const reel of REELS) {
		drawReel(scene, reel);
	}
	drawCrank(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	// The screen lights the far end of the hall, and the arc lamp warms the vents.
	glow(scene, {
		x: 66,
		y: 29,
		radius: 18,
		colour: LIGHT,
		strength: 0.22,
		steps: 3,
		skip: [C.ink, C.white, LIGHT],
	});
	glow(scene, {
		x: 8,
		y: 33,
		radius: 9,
		colour: C.gold,
		strength: 0.25,
		steps: 2,
		skip: [C.ink, ARC, ARC_HOT],
	});
	drawGlints(scene);
	return scene;
}

/**
 * The hall: a dark wall that fades to black at the ceiling, and a dark floor below.
 * @param {Canvas} layer
 */
function drawHall(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = HALL;
			if (y < 10 || (y < 18 && (x + y) % 2 === 0)) {
				colour = HALL_DARK;
			}
			if (y >= FLOOR) {
				colour =
					y === FLOOR || (x + y) % 3 === 0
						? HALL_FLOOR_DARK
						: HALL_FLOOR;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Two rows of seat backs under the beam: rounded humps with a gap between them, their tops caught by the light.
 * @param {Canvas} layer
 */
function drawSeats(layer) {
	for (const [top, offset] of [
		[53, 0],
		[58, 4],
	]) {
		for (let x = 42; x < 64; x++) {
			const across = (x - 42 + offset) % 8;
			if (across === 7) {
				continue;
			}
			// Each back is seven pixels wide, its top rounded off at the corners.
			const rise = across === 0 || across === 6 ? 1 : 0;
			for (let y = top + rise; y < 64; y++) {
				let colour = SEAT;
				if (y === top + rise && across < 5) {
					colour = SEAT_LIGHT;
				} else if (across >= 5) {
					colour = SEAT_DARK;
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * How brightly the beam lights a point, from 0 (outside it) to 3 (its core near the lens).
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function beamLevel(x, y) {
	const dx = x - BEAM.x;
	if (dx < 0) {
		return 0;
	}
	const angle = Math.atan2(y - BEAM.y, dx);
	const off = Math.abs(angle - BEAM.axis) / BEAM.half;
	if (off >= 1) {
		return 0;
	}
	// Streaks along the beam, where the flickering frame is brighter.
	const streak = Math.sin(angle * 30 + 1.2) > 0.5 ? 1 : 0;
	const near = dx < 7 ? 1 : 0;
	let level = off < 0.55 ? 2 : 1;
	level = Math.min(3, level + streak + near);
	return off > 0.85 ? Math.min(level, 1) : level;
}

/**
 * The cone of light from the lens across the hall, brightest at its core and near the lens, with dust drifting in it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeam(layer, random) {
	const strengths = [0, 0.24, 0.4, 0.58];
	for (let y = 0; y < 64; y++) {
		for (let x = BEAM.x; x < 64; x++) {
			const level = beamLevel(x, y);
			if (level > 0) {
				const behind = get(layer, x, y) ?? HALL;
				set(layer, x, y, mix(behind, LIGHT, strengths[level]));
			}
		}
	}
	for (let i = 0; i < 70; i++) {
		const x = BEAM.x + 2 + Math.floor(random() * (63 - BEAM.x));
		const y = Math.floor(random() * 64);
		if (beamLevel(x, y) > 0) {
			set(layer, x, y, random() < 0.5 ? DUST : LIGHT);
		}
	}
}

/**
 * The far screen, just past the right edge: where the beam leaves the picture, its light pales almost to white.
 * @param {Canvas} layer
 */
function drawScreen(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = SCREEN.from; x < 64; x++) {
			const level = beamLevel(x, y);
			if (level > 0) {
				const t = (x - SCREEN.from) / (63 - SCREEN.from);
				set(
					layer,
					x,
					y,
					mix(get(layer, x, y) ?? HALL, C.white, 0.2 + t * 0.35)
				);
			}
		}
	}
}

/**
 * The wooden tripod: three splayed legs from a head under the body, braced by a ring.
 * @param {Canvas} scene
 */
function drawTripod(scene) {
	const head = { x: 19, y: 44 };
	for (const { foot, lit, shade } of LEGS) {
		line(scene, head.x, head.y, foot, 63, lit);
		line(scene, head.x + 1, head.y, foot + 1, 63, shade);
	}
	// The head the body sits on.
	rect(scene, 14, 44, 12, 2, ENAMEL);
	rect(scene, 14, 44, 12, 1, ENAMEL_LIGHT);
	// The brace ring across the legs.
	rect(scene, 11, 54, 17, 1, C.brass);
	set(scene, 11, 54, C.gold);
}

/**
 * The film running from the feed reel down into the works, and from the works up to the take-up reel.
 * @param {Canvas} scene
 */
function drawFilm(scene) {
	const [back, front] = REELS;
	for (const [x0, y0, x1, y1] of [
		[front.x + 6, front.y + 6, 31, WORKS.top],
		[back.x - 6, back.y + 6, 5, LAMP_HOUSE.top],
	]) {
		line(scene, x0, y0, x1, y1, FILM);
		line(scene, x0 + 1, y0, x1 + 1, y1, FILM_LIGHT);
		// The sprocket holes, a pale dot every other pixel down the strip.
		const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let i = 1; i < steps; i += 2) {
			const x = Math.round(x0 + ((x1 - x0) * i) / steps);
			const y = Math.round(y0 + ((y1 - y0) * i) / steps);
			set(scene, x, y, C.creamShade);
		}
	}
}

/**
 * One reel's arm: a strut from the top of the body up to the reel's hub.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} reel
 */
function drawReelArm(scene, reel) {
	const foot = reel.x < 20 ? 16 : 26;
	line(scene, reel.x, reel.y, foot, WORKS.top, ENAMEL);
	line(scene, reel.x + 1, reel.y, foot + 1, WORKS.top, ENAMEL_LIGHT);
}

/**
 * The lamp house at the back: a tall box with a rounded top, its side pierced by vents that glow with the arc lamp inside.
 * @param {Canvas} scene
 */
function drawLampHouse(scene) {
	const { left, right, top, bottom } = LAMP_HOUSE;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			// Round off the top corners.
			if (y === top && (x === left || x === right)) {
				continue;
			}
			let colour = ENAMEL;
			if (y <= top + 1) {
				colour = ENAMEL_LIGHT;
			} else if (x === left) {
				colour = ENAMEL_DARK;
			}
			set(scene, x, y, colour);
		}
	}
	// A seam round the house, and its vents: short slots glowing with the arc lamp.
	rect(scene, left, top + 4, right - left + 1, 1, ENAMEL_DARK);
	for (let y = top + 7; y <= top + 15; y += 2) {
		rect(scene, left + 2, y, 7, 1, y === top + 11 ? ARC_HOT : ARC);
	}
	// The chimney cap on top.
	rect(scene, left + 3, top - 2, 5, 2, ENAMEL);
	rect(scene, left + 2, top - 3, 7, 1, ENAMEL_LIGHT);
}

/**
 * The mechanism: a box with rounded corners and a nickel side plate held by four screws.
 * @param {Canvas} scene
 */
function drawWorks(scene) {
	const { left, right, top, bottom } = WORKS;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const corner =
				(y === top || y === bottom) && (x === left || x === right);
			if (corner) {
				continue;
			}
			let colour = ENAMEL;
			if (x === right || y === top) {
				colour = ENAMEL_RIM;
			} else if (x === right - 1 || y === top + 1) {
				colour = ENAMEL_LIGHT;
			} else if (y === bottom) {
				colour = ENAMEL_DARK;
			}
			set(scene, x, y, colour);
		}
	}
	// The side plate, a shade lighter, with a screw in each corner.
	const plate = {
		left: left + 3,
		right: right - 3,
		top: top + 3,
		bottom: bottom - 3,
	};
	for (let y = plate.top; y <= plate.bottom; y++) {
		for (let x = plate.left; x <= plate.right; x++) {
			let colour = ENAMEL_LIGHT;
			if (y === plate.top || x === plate.right) {
				colour = C.stoneMid;
			} else if (y === plate.bottom || x === plate.left) {
				colour = ENAMEL;
			}
			set(scene, x, y, colour);
		}
	}
	for (const [x, y] of [
		[plate.left + 1, plate.top + 1],
		[plate.right - 1, plate.top + 1],
		[plate.left + 1, plate.bottom - 1],
		[plate.right - 1, plate.bottom - 1],
	]) {
		set(scene, x, y, C.stoneLight);
	}
}

/**
 * The brass lens barrel: rings along its length and the bright glass at its end.
 * @param {Canvas} scene
 */
function drawLens(scene) {
	const { left, right, y, half } = LENS;
	for (let x = left; x <= right; x++) {
		const ring = x === left + 2 || x === right - 1;
		for (let dy = -half; dy <= half; dy++) {
			let colour = C.brass;
			if (dy === -half) {
				colour = ring ? C.lampGlow : C.gold;
			} else if (dy === half) {
				colour = C.lampFrame;
			} else if (dy > 0) {
				colour = ring ? C.brass : C.amber;
			} else if (ring) {
				colour = C.gold;
			}
			set(scene, x, y + dy, colour);
		}
	}
	// The hood at the front, a little wider.
	rect(scene, right + 1, y - half - 1, 1, half * 2 + 3, C.amber);
	set(scene, right + 1, y - half - 1, C.gold);
	// The glass.
	rect(scene, right + 2, y - half + 1, 1, half * 2 - 1, LIGHT);
	set(scene, right + 2, y, C.white);
}

/**
 * One reel: a nickel plate with three windows blurred by the spin, the film wound round its hub, and a rim.
 * @param {Canvas} scene
 * @param {{ x: number, y: number, r: number, coil: number, turn: number }} reel
 */
function drawReel(scene, reel) {
	const { x: cx, y: cy, r, coil, turn } = reel;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d > r + 0.4) {
				continue;
			}
			// The rim: lit on its upper right, towards the screen.
			const facing = (dx - dy) / (d || 1);
			if (d > r - 1.1) {
				set(
					scene,
					x,
					y,
					facing > 0.3
						? C.stoneLight
						: facing > -0.5
							? C.stone
							: C.stoneMid
				);
				continue;
			}
			if (d < 1.6) {
				set(scene, x, y, d < 0.8 ? C.stoneLight : C.stone);
				continue;
			}
			// Three windows round the hub; the spin smears each one's edges.
			const angle =
				(Math.atan2(dy, dx) + turn + Math.PI * 2) % ((Math.PI * 2) / 3);
			const span = (Math.PI * 2) / 3;
			const inWindow = d > 2.6 && d < r - 2 && angle > span * 0.28;
			const edge =
				d > 2.6 && d < r - 2 && angle > span * 0.16 && !inWindow;
			let colour = facing > 0.2 ? C.stone : C.stoneMid;
			if (inWindow) {
				colour = d < coil ? (d > coil - 1 ? FILM_LIGHT : FILM) : HALL;
			} else if (edge) {
				colour = d < coil ? FILM_LIGHT : BLUR;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The crank on the mechanism's side: a round brass boss, an arm and a round wooden knob.
 * @param {Canvas} scene
 */
function drawCrank(scene) {
	const { x: cx, y: cy } = CRANK;
	// The arm, from the boss down and back to the handle.
	line(scene, cx - 1, cy + 2, cx - 5, cy + 6, C.gold);
	line(scene, cx, cy + 2, cx - 4, cy + 6, C.amber);
	// The boss: a round brass disc, lit on its upper left.
	paint(
		scene,
		cx - 2,
		cy - 2,
		['.lgb.', 'lggba', 'ggbba', 'gbbaf', '.aaf.'],
		{
			l: C.lampGlow,
			g: C.gold,
			b: C.brass,
			a: C.amber,
			f: C.lampFrame,
		}
	);
	// The handle: a round wooden knob turned towards us.
	paint(scene, cx - 8, cy + 5, ['.lt.', 'lttd', 'ttdd', '.dd.'], {
		l: C.timberLight,
		t: C.timber,
		d: C.timberShade,
	});
}

/**
 * The brightest glints: the lens glass, the reels' rims and the crank, painted over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[LENS.right + 2, LENS.y - 1],
		[REELS[0].x + 5, REELS[0].y - 7],
		[REELS[1].x + 5, REELS[1].y - 7],
		[WORKS.right, WORKS.top + 1],
	]) {
		set(scene, x, y, C.white);
	}
}
