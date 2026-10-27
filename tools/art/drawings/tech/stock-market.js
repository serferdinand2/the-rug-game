// Stock Market: a brass ticker-tape machine under a glass dome on a desk, a curl of dotted and dashed tape spilling out of it.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A point along a path, with the unit normal there and the number of the segment it lies on.
 * @typedef {{ x: number, y: number, nx: number, ny: number, segment: number }} PathPoint
 */

/** The glass dome: a half sphere on straight sides, centred on `x`, from its top down to `bottom`. */
const DOME = { x: 28, y: 20, r: 16, bottom: 42 };

/** The type wheel that prints the tape, between the brass standards. */
const WHEEL = { x: 35, y: 27, r: 5 };

/** The roll of blank tape on top of the frame. */
const SPOOL = { x: 35, y: 12, r: 4 };

/** The office wall: a sage green plaster, lit where the window's light falls. */
const WALL = mix(C.forestFloorLight, C.stoneLight, 0.55);
const WALL_LIT = mix(WALL, C.creamLight, 0.3);
const WALL_SHADOW = mix(WALL, C.forestFloorShade, 0.45);

/** Copper wire wound on the electromagnets: lit, plain and shaded. */
const COPPER = {
	light: mix(C.amber, C.brickRedLight, 0.35),
	base: mix(C.amber, C.brickRed, 0.55),
	shade: mix(C.brickRedShade, C.amber, 0.25),
};

/** The tint the glass gives to whatever is seen through it. */
const GLASS = C.daySky6;

/** The tape outside the dome: out over the collar, down the right, once round a curl and away along the desk. */
const TAPE = /** @type {[number, number][]} */ ([
	[44, 34.5],
	[50, 35.5],
	[54.5, 38.5],
	[57, 44],
	[56, 50.5],
	[52, 54.5],
	[47, 53],
	[45.5, 47.5],
	[48.5, 43],
	[54, 42.5],
	[59.5, 45.5],
	[62, 51.5],
	[61, 58],
	[55, 61.5],
	[44, 61.5],
	[32, 60.5],
	[20, 61.5],
	[8, 60.5],
	[-6, 61],
]);

/** Where the tape comes back over itself: from this point of `TAPE` on, it lies on top. */
const TAPE_CROSSING = 8;

/**
 * Draws the Stock Market tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8813);

	drawOffice(layer);

	drawBase(scene);
	drawDeck(scene);
	drawMagnets(scene);
	drawFrame(scene);
	drawTapeInside(scene);
	// The spool and the type wheel get their own outline, so they stand clear of the frame behind them.
	const works = createCanvas(64, 64);
	drawSpool(works);
	drawWheel(works);
	outline(works, C.ink);
	overlay(scene, works);
	outline(scene, C.ink);
	drawGlass(scene, layer);
	const tape = spline(TAPE);
	paintTape(
		scene,
		tape.filter((p) => p.segment < TAPE_CROSSING),
		random,
		C.cream
	);
	paintTape(
		scene,
		tape.filter((p) => p.segment >= TAPE_CROSSING),
		random,
		C.creamLight
	);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 0,
		y: 0,
		radius: 40,
		colour: C.lampGlow,
		strength: 0.2,
		steps: 3,
		skip: [C.ink, C.white],
	});
	drawGleams(scene);
	return scene;
}

/**
 * The office behind: a sage wall with a band of window light, the dome's shadow, a wooden dado and the desk top.
 * @param {Canvas} layer
 */
function drawOffice(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = WALL;
			if (y >= 44) {
				colour = y < 46 ? C.floorShade : C.floor;
			} else if (y >= 30) {
				colour = y === 30 ? C.timberLight : C.timber;
				if (y > 31 && (x === 4 || x === 58)) {
					colour = C.timberShade;
				}
			} else if (x + y * 0.6 < 10) {
				colour = WALL_LIT;
			} else if (Math.hypot(x - DOME.x - 5, y - DOME.y - 2) < DOME.r) {
				// The dome's shadow, cast to the right, away from the window.
				colour = WALL_SHADOW;
			}
			set(layer, x, y, colour);
		}
	}
	// The desk's polished front edge, catching the light.
	for (let x = 0; x < 64; x++) {
		set(layer, x, 63, C.floorLight);
	}
}

/**
 * Copies every painted pixel of a part onto the scene.
 * @param {Canvas} scene
 * @param {Canvas} part - The same size as the scene
 */
function overlay(scene, part) {
	part.p.forEach((colour, i) => {
		if (colour) {
			scene.p[i] = colour;
		}
	});
}

/**
 * Whether a point lies inside the dome's glass.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inDome(x, y) {
	if (y > DOME.bottom) {
		return false;
	}
	if (y >= DOME.y) {
		return Math.abs(x + 0.5 - DOME.x) < DOME.r;
	}
	return Math.hypot(x + 0.5 - DOME.x, y + 0.5 - DOME.y) < DOME.r;
}

/**
 * The round wooden plinth and the brass collar the dome sits in.
 * @param {Canvas} scene
 */
function drawBase(scene) {
	const left = DOME.x - DOME.r - 4;
	const right = DOME.x + DOME.r + 4;
	for (let y = 45; y <= 53; y++) {
		const inset = y === 45 ? 2 : y >= 52 ? -2 : 1;
		const x0 = left + inset;
		const x1 = right - inset;
		for (let x = x0; x < x1; x++) {
			let colour = C.timber;
			if (y >= 52) {
				colour = y === 52 ? C.timberLight : C.timberShade;
			} else if (x < x0 + 3 || y === 45) {
				colour = C.timberLight;
			} else if (x >= x1 - 4) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The brass collar.
	for (let x = DOME.x - DOME.r - 2; x < DOME.x + DOME.r + 2; x++) {
		set(scene, x, 42, C.gold);
		set(scene, x, 43, x < DOME.x - 8 ? C.gold : C.brass);
		set(scene, x, 44, C.amber);
	}
	set(scene, DOME.x - DOME.r - 1, 42, C.lampGlow);
	set(scene, DOME.x - DOME.r, 42, C.lampGlow);
}

/**
 * The brass deck the works are screwed to.
 * @param {Canvas} scene
 */
function drawDeck(scene) {
	const x = DOME.x - DOME.r + 2;
	const w = DOME.r * 2 - 4;
	rect(scene, x, 38, w, 1, C.gold);
	rect(scene, x, 39, w, 2, C.brass);
	rect(scene, x, 41, w, 1, C.amber);
}

/**
 * The two electromagnets: copper coils with iron caps, under the iron armature that the telegraph pulses rock.
 * @param {Canvas} scene
 */
function drawMagnets(scene) {
	for (const x0 of [16, 22]) {
		for (let y = 27; y < 38; y++) {
			for (let x = x0; x < x0 + 5; x++) {
				let colour = y % 2 === 0 ? COPPER.base : COPPER.shade;
				if (x === x0 && y % 2 === 0) {
					colour = COPPER.light;
				}
				if (x === x0 + 4) {
					colour = COPPER.shade;
				}
				set(scene, x, y, colour);
			}
		}
		rect(scene, x0, 25, 5, 2, C.stone);
		rect(scene, x0, 25, 5, 1, C.stoneLight);
	}
	// The armature across both, pivoted on the left.
	rect(scene, 15, 22, 13, 2, C.stone);
	rect(scene, 15, 22, 13, 1, C.stoneLight);
	rect(scene, 15, 22, 1, 2, C.stoneShade);
	// The rod from the armature to the type wheel's escapement.
	rect(scene, 28, 23, 2, 1, C.brass);
}

/**
 * The brass frame: two standards and a crossbar carrying the spool.
 * @param {Canvas} scene
 */
function drawFrame(scene) {
	for (const x of [29, 40]) {
		rect(scene, x, 17, 2, 21, C.brass);
		rect(scene, x, 17, 1, 21, C.gold);
	}
	rect(scene, 29, 17, 13, 2, C.brass);
	rect(scene, 29, 17, 13, 1, C.gold);
}

/**
 * The roll of blank tape: a cream disc with its wound rings and a brass hub.
 * @param {Canvas} scene
 */
function drawSpool(scene) {
	const { x: cx, y: cy, r } = SPOOL;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.3) {
				continue;
			}
			let colour = C.creamLight;
			if (d < 1.5) {
				colour = C.brass;
			} else if (Math.abs(d - 3) < 0.4 || x - cx + (y - cy) > 2) {
				colour = C.cream;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, cx - 1, cy - 1, C.gold);
	// The bracket holding it on the crossbar.
	rect(scene, cx - 1, cy + r, 2, 1, C.amber);
}

/**
 * The type wheel: a brass disc with a toothed rim and a dark hub.
 * @param {Canvas} scene
 */
function drawWheel(scene) {
	const { x: cx, y: cy, r } = WHEEL;
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			const tooth = Math.cos(Math.atan2(dy, dx) * 8) > 0.3;
			if (d > r + 0.5 && !(d < r + 1.3 && tooth)) {
				continue;
			}
			let colour = dx + dy < 0 ? C.gold : C.brass;
			if (d > r - 0.5) {
				colour = dx + dy < 0 ? C.brass : C.amber;
			}
			if (d < 1.5) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, cx - 2, cy - 2, C.lampGlow);
}

/**
 * The printed tape inside the dome: from under the type wheel out through the glass on the right.
 * @param {Canvas} scene
 */
function drawTapeInside(scene) {
	rect(
		scene,
		SPOOL.x - 3,
		34,
		DOME.x + DOME.r - SPOOL.x + 3,
		1,
		C.creamLight
	);
	rect(scene, SPOOL.x - 3, 35, DOME.x + DOME.r - SPOOL.x + 3, 1, C.cream);
}

/**
 * Samples a smooth path through points (a Catmull-Rom spline), about three samples a pixel.
 * @param {readonly [number, number][]} points
 * @returns {PathPoint[]}
 */
function spline(points) {
	/** @type {PathPoint[]} */
	const out = [];
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[Math.max(0, i - 1)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(points.length - 1, i + 2)];
		const steps = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 3);
		for (let s = 0; s < steps; s++) {
			const t = s / steps;
			/**
			 * One coordinate of the spline at t, and its slope.
			 * @param {number} k - 0 for x, 1 for y
			 * @returns {[number, number]}
			 */
			const at = (k) => {
				const a = 2 * p1[k];
				const b = p2[k] - p0[k];
				const c = 2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k];
				const d = -p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k];
				return [
					0.5 * (a + b * t + c * t * t + d * t * t * t),
					0.5 * (b + 2 * c * t + 3 * d * t * t),
				];
			};
			const [x, dx] = at(0);
			const [y, dy] = at(1);
			const norm = Math.hypot(dx, dy) || 1;
			out.push({ x, y, nx: -dy / norm, ny: dx / norm, segment: i });
		}
	}
	return out;
}

/**
 * Whether a point is on the canvas.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function onCanvas(x, y) {
	return x >= 0 && x < 64 && y >= 0 && y < 64;
}

/**
 * Paints one run of tape three pixels wide along a path, then prints its dots and dashes down the middle.
 * Where it lies over something already painted, it gets an ink edge so it reads as on top.
 * @param {Canvas} scene
 * @param {PathPoint[]} path
 * @param {() => number} random
 * @param {Colour} paper - The tape's colour on this run
 */
function paintTape(scene, path, random, paper) {
	/** @type {Set<string>} */
	const mine = new Set();
	for (const p of path) {
		for (let k = -1; k <= 1; k++) {
			mine.add(
				`${Math.round(p.x + p.nx * k)},${Math.round(p.y + p.ny * k)}`
			);
		}
	}
	for (const p of path) {
		for (const k of [-2, 2]) {
			const x = Math.round(p.x + p.nx * k);
			const y = Math.round(p.y + p.ny * k);
			if (onCanvas(x, y) && !mine.has(`${x},${y}`) && get(scene, x, y)) {
				set(scene, x, y, C.ink);
			}
		}
	}
	for (const key of mine) {
		const [x, y] = key.split(',').map(Number);
		if (onCanvas(x, y)) {
			set(scene, x, y, paper);
		}
	}
	// The shaded edge, on whichever side faces down.
	for (const p of path) {
		const side = p.ny > 0 ? 1 : -1;
		const x = Math.round(p.x + p.nx * side);
		const y = Math.round(p.y + p.ny * side);
		if (onCanvas(x, y) && Math.abs(p.ny) > 0.3) {
			set(scene, x, y, paper === C.cream ? C.creamShade : C.cream);
		}
	}
	// The dots and dashes, printed along the middle with gaps between.
	let travelled = 0;
	let next = 1 + random() * 2;
	for (let i = 1; i < path.length; i++) {
		travelled += Math.hypot(
			path[i].x - path[i - 1].x,
			path[i].y - path[i - 1].y
		);
		if (travelled < next) {
			continue;
		}
		const length = random() < 0.45 ? 3 : 1;
		printMark(scene, path, i, length);
		next = travelled + length + 3 + Math.floor(random() * 2);
	}
}

/**
 * Prints one mark on the tape: a dot, or a dash running a few pixels along it.
 * @param {Canvas} scene
 * @param {PathPoint[]} path
 * @param {number} start - The index on the path where the mark begins
 * @param {number} length - In pixels along the tape
 */
function printMark(scene, path, start, length) {
	let travelled = 0;
	for (let i = start; i < path.length; i++) {
		if (i > start) {
			travelled += Math.hypot(
				path[i].x - path[i - 1].x,
				path[i].y - path[i - 1].y
			);
		}
		if (travelled > length - 0.6) {
			return;
		}
		const x = Math.round(path[i].x);
		const y = Math.round(path[i].y);
		if (onCanvas(x, y)) {
			set(scene, x, y, C.night);
		}
	}
}

/**
 * The glass: every empty pixel inside the dome gets the background tinted pale blue, brighter at the rim, and a glass knob on top.
 * @param {Canvas} scene
 * @param {Canvas} layer
 */
function drawGlass(scene, layer) {
	for (let y = 0; y <= DOME.bottom; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inDome(x, y) || get(scene, x, y)) {
				continue;
			}
			const rim =
				!inDome(x - 1, y) || !inDome(x + 1, y) || !inDome(x, y - 1);
			const behind = /** @type {Colour} */ (get(layer, x, y));
			set(scene, x, y, mix(behind, GLASS, rim ? 0.55 : 0.2));
		}
	}
	// The knob on top of the dome.
	rect(scene, DOME.x - 2, 2, 4, 2, mix(WALL, GLASS, 0.55));
}

/**
 * Light on the glass from the window on the left: a long streak down the side and an arc round the top.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	const left = DOME.x - DOME.r + 3;
	for (let y = 20; y <= 38; y++) {
		set(scene, left, y, C.white);
	}
	for (let a = 0; a <= 12; a++) {
		const angle = Math.PI * (1.1 + (a / 12) * 0.3);
		const x = Math.round(DOME.x + Math.cos(angle) * (DOME.r - 3));
		const y = Math.round(DOME.y + Math.sin(angle) * (DOME.r - 3));
		set(scene, x, y, C.white);
	}
	set(scene, DOME.x - 2, 2, C.white);
	// A fainter streak on the far side.
	const right = DOME.x + DOME.r - 2;
	for (let y = 24; y <= 33; y++) {
		set(
			scene,
			right,
			y,
			mix(get(scene, right, y) ?? C.white, C.white, 0.5)
		);
	}
}
