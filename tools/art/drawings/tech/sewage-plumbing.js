// Sewage & Plumbing: a brass tap on a copper pipe pouring clean water into a white pedestal basin, a red valve wheel on the pipe, against a tiled wall by daylight.
import {
	createCanvas,
	get,
	set,
	rect,
	clear,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The cream wall tiles above the dado rail, their grout and the shadow cast on them. */
const WALL = C.cream;
const GROUT = mix(C.cream, C.creamShade, 0.35);
const WALL_SHADOW = mix(C.cream, C.creamShade, 0.8);

/** The dado rail and the green tiles below it. */
const TRIM_LIGHT = mix(C.teal, C.pineLight, 0.5);
const TRIM = mix(C.tealShade, C.pine, 0.4);
const TRIM_SHADOW = mix(TRIM, C.ink, 0.35);
const DADO = mix(C.tealShade, C.pineLight, 0.45);
const DADO_GROUT = mix(DADO, C.ink, 0.25);
const DADO_SHADOW = mix(DADO, C.ink, 0.45);

/** Copper for the pipe: a highlight, a base and a shade. */
const COPPER = [
	mix(C.gold, C.brickRedLight, 0.45),
	mix(C.amber, C.brickRed, 0.45),
	mix(C.brickRedShade, C.timber, 0.35),
];

/** Brass for the tap, the valve and the union nut. */
const BRASS = [C.gold, C.brass, C.lampFrame];

/** The red-painted valve wheel. */
const RED = [C.brickRedLight, C.brickRed, C.brickRedShade];

/** The glazed basin: lit, base and shaded. */
const CERAMIC = [C.white, C.snow, C.snowShade];

/** Where the pipe runs, from the left edge into the tap. */
const PIPE = { y: 16, h: 7, end: 26 };

/** The valve wheel, face-on over its valve body. */
const WHEEL = { x: 12, y: 19, r: 8, rim: 6 };

/** The tap's round body, and the curve of its spout down to the mouth. */
const TAP = { x: 30, y: 19, r: 6.5 };
const SPOUT = { x: 34, y: 28, r: 7.5, half: 2.7 };

/** The stream of water, from under the mouth down to the water in the basin. */
const STREAM = { x: 40, w: 4, top: 31, bottom: 47 };

/** The basin: its rim, the opening inside it and the water. */
const BASIN = { x: 38, y: 46, rx: 24, ry: 7 };
const OPENING = { x: 38, y: 46.5, rx: 21, ry: 5 };
const WATER = { x: 38.5, y: 48, rx: 19, ry: 3.6 };

/**
 * Draws the Sewage & Plumbing tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7310);

	drawWall(layer);

	drawPipe(scene);
	drawValve(scene);
	drawTap(scene);
	drawSpout(scene);
	drawBasin(scene);
	castShadows(scene, layer);
	drawStream(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 0,
		y: 0,
		radius: 44,
		colour: C.creamLight,
		strength: 0.3,
		steps: 2,
		skip: [C.ink],
	});
	drawRipples(scene, random);
	drawGleams(scene);
	return scene;
}

/**
 * The wall: cream brick-bond tiles above a teal dado rail, square green tiles below.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = WALL;
			if (y < 35) {
				const row = Math.floor(y / 5);
				const joint = (x + (row % 2) * 5) % 10 === 9;
				colour = y % 5 === 4 || joint ? GROUT : WALL;
			} else if (y === 35) {
				colour = TRIM_LIGHT;
			} else if (y <= 37) {
				colour = TRIM;
			} else {
				const joint = (y - 38) % 8 === 7 || x % 8 === 7;
				colour = joint ? DADO_GROUT : DADO;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Every painted pixel of the foreground casts a flat shadow on the wall, down and to the right, away from the window.
 * @param {Canvas} scene
 * @param {Canvas} layer
 */
function castShadows(scene, layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!get(scene, x, y)) {
				continue;
			}
			const sy = y + 3;
			const shadow =
				sy < 35 ? WALL_SHADOW : sy <= 37 ? TRIM_SHADOW : DADO_SHADOW;
			set(layer, x + 2, sy, shadow);
		}
	}
}

/**
 * Picks the lit, base or shaded tone for a point on a rounded surface, by how much it faces the window at the top left.
 * @param {number} dx - Column offset from the centre, or the surface's normal
 * @param {number} dy - Row offset from the centre, or the surface's normal
 * @param {readonly Colour[]} tones - Lit, base and shaded
 * @returns {Colour}
 */
function litTone(dx, dy, tones) {
	const length = Math.hypot(dx, dy) || 1;
	const facing = -(dx + dy) / (length * Math.SQRT2);
	return facing > 0.45 ? tones[0] : facing < -0.3 ? tones[2] : tones[1];
}

/**
 * The copper pipe out of the left edge, with a brass union nut where it meets the tap.
 * @param {Canvas} scene
 */
function drawPipe(scene) {
	const rows = [1, 0, 1, 1, 1, 2, 2];
	for (let k = 0; k < PIPE.h; k++) {
		rect(scene, 0, PIPE.y + k, PIPE.end, 1, COPPER[rows[k]]);
	}
	for (let y = PIPE.y - 2; y <= PIPE.y + PIPE.h + 1; y++) {
		for (let x = 20; x <= 23; x++) {
			const tone = x === 20 ? 0 : x === 23 ? 2 : 1;
			set(scene, x, y, BRASS[tone]);
		}
	}
}

/**
 * The valve: a brass body on the pipe behind a red handwheel seen face-on, with four spokes and a brass hub.
 * The wheel is outlined on its own canvas so its ink edge shows against the pipe.
 * @param {Canvas} scene
 */
function drawValve(scene) {
	for (let y = WHEEL.y - 8; y <= WHEEL.y + 8; y++) {
		for (let x = WHEEL.x - 7; x <= WHEEL.x + 7; x++) {
			const e = ((x - WHEEL.x) / 6.5) ** 2 + ((y - WHEEL.y) / 7.5) ** 2;
			if (e < 1) {
				set(scene, x, y, litTone(x - WHEEL.x, y - WHEEL.y, BRASS));
			}
		}
	}
	const wheel = createCanvas(64, 64);
	for (let y = WHEEL.y - WHEEL.r; y <= WHEEL.y + WHEEL.r; y++) {
		for (let x = WHEEL.x - WHEEL.r; x <= WHEEL.x + WHEEL.r; x++) {
			const dx = x - WHEEL.x;
			const dy = y - WHEEL.y;
			const d = Math.hypot(dx, dy);
			if (d >= WHEEL.r + 0.4) {
				continue;
			}
			if (d >= WHEEL.rim) {
				set(wheel, x, y, litTone(dx, dy, RED));
			} else if (d < 2.6) {
				set(
					wheel,
					x,
					y,
					d < 1.2 ? C.lampFrame : litTone(dx, dy, BRASS)
				);
			} else if (Math.abs(dx - dy) <= 1 || Math.abs(dx + dy) <= 1) {
				set(wheel, x, y, dx + dy < 0 ? RED[0] : RED[1]);
			}
		}
	}
	outline(wheel, C.ink);
	stamp(scene, wheel);
}

/**
 * The tap: a round brass body on the pipe, its bonnet and crosshead handle on top with a white cap.
 * @param {Canvas} scene
 */
function drawTap(scene) {
	const reach = Math.ceil(TAP.r);
	for (let y = TAP.y - reach; y <= TAP.y + reach; y++) {
		for (let x = TAP.x - reach; x <= TAP.x + reach; x++) {
			if (Math.hypot(x - TAP.x, y - TAP.y) < TAP.r) {
				set(scene, x, y, litTone(x - TAP.x, y - TAP.y, BRASS));
			}
		}
	}
	// The bonnet: a hexagonal nut seen side-on, lit on its left faces.
	for (let y = 9; y <= 13; y++) {
		for (let x = 27; x <= 33; x++) {
			set(scene, x, y, BRASS[x < 29 ? 0 : x > 31 ? 2 : 1]);
		}
	}
	rect(scene, 29, 7, 3, 2, C.brass);
	set(scene, 29, 7, C.gold);
	// The crosshead: a bar with a knob at each end.
	rect(scene, 23, 5, 15, 1, C.gold);
	rect(scene, 23, 6, 15, 1, C.brass);
	for (const knob of [22, 36]) {
		rect(scene, knob, 4, 3, 4, C.brass);
		rect(scene, knob, 4, 2, 2, C.gold);
		rect(scene, knob, 7, 3, 1, C.lampFrame);
	}
	// The white cap on top of the handle, with a blue dot for cold.
	rect(scene, 28, 2, 5, 3, C.snow);
	rect(scene, 28, 2, 2, 1, C.white);
	set(scene, 30, 3, C.daySky2);
}

/**
 * The spout: a brass tube curving out of the tap body and down to a flared mouth over the basin.
 * @param {Canvas} scene
 */
function drawSpout(scene) {
	for (let y = Math.floor(SPOUT.y - SPOUT.r - 3); y <= SPOUT.y; y++) {
		for (let x = SPOUT.x; x <= SPOUT.x + SPOUT.r + 3; x++) {
			const dx = x - SPOUT.x;
			const dy = y - SPOUT.y;
			const d = Math.hypot(dx, dy);
			const off = d - SPOUT.r;
			if (Math.abs(off) > SPOUT.half) {
				continue;
			}
			// The surface faces outwards on the outer side of the bend, inwards on the inner side.
			const tone =
				Math.abs(off) < 1
					? C.brass
					: litTone(Math.sign(off) * dx, Math.sign(off) * dy, BRASS);
			set(scene, x, y, tone);
		}
	}
	// The flared mouth.
	rect(scene, 38, 29, 8, 1, C.brass);
	set(scene, 38, 29, C.gold);
	rect(scene, 38, 30, 8, 1, C.lampFrame);
}

/**
 * The white pedestal basin: the bowl, its pedestal, the rim, the inner wall and the water.
 * @param {Canvas} scene
 */
function drawBasin(scene) {
	// The pedestal.
	for (let y = 56; y < 64; y++) {
		const left = y >= 61 ? 32 : 34;
		const right = y >= 61 ? 44 : 42;
		for (let x = left; x <= right; x++) {
			const tone = x <= left + 1 ? 0 : x >= right - 2 ? 2 : 1;
			set(scene, x, y, CERAMIC[tone]);
		}
	}
	// The bowl, rounding in below the rim.
	for (let y = BASIN.y; y <= BASIN.y + 14; y++) {
		const t = (y - BASIN.y) / 14;
		const w = BASIN.rx * Math.sqrt(Math.max(0, 1 - t * t));
		for (
			let x = Math.ceil(BASIN.x - w);
			x <= Math.floor(BASIN.x + w);
			x++
		) {
			const rel = (x - BASIN.x) / (w || 1);
			let tone = rel < -0.55 ? 0 : rel > 0.4 ? 2 : 1;
			if (t > 0.8 && rel > -0.3) {
				tone = 2;
			}
			set(scene, x, y, CERAMIC[tone]);
		}
	}
	// The rim, the inner wall and the water.
	for (let y = BASIN.y - BASIN.ry; y <= BASIN.y + BASIN.ry; y++) {
		for (let x = BASIN.x - BASIN.rx; x <= BASIN.x + BASIN.rx; x++) {
			if (ellipse(x, y, BASIN) >= 1) {
				continue;
			}
			let colour = CERAMIC[1];
			if (ellipse(x, y, WATER) < 1) {
				colour = y > WATER.y + 1.5 ? C.daySky4 : C.daySky5;
				if (y < WATER.y - 2.5) {
					colour = C.daySky6;
				}
			} else if (ellipse(x, y, OPENING) < 1) {
				colour = CERAMIC[2];
			} else if (x < BASIN.x - 9 && y < BASIN.y + 3) {
				colour = CERAMIC[0];
			} else if (x > BASIN.x + 14) {
				colour = CERAMIC[2];
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The stream: clean water falling from the mouth into the basin, lit on its left edge.
 * It is outlined on its own canvas so its edges show against the basin; its top and bottom stay open.
 * @param {Canvas} scene
 */
function drawStream(scene) {
	const stream = createCanvas(64, 64);
	const tones = [C.white, C.foam, C.foam, C.daySky4];
	for (let y = STREAM.top; y <= STREAM.bottom; y++) {
		for (let k = 0; k < STREAM.w; k++) {
			set(stream, STREAM.x + k, y, tones[k]);
		}
		// Ripples running down the stream.
		if ((y - STREAM.top) % 5 === 2) {
			set(stream, STREAM.x + 2, y, C.daySky5);
		}
	}
	outline(stream, C.ink);
	for (let x = 0; x < 64; x++) {
		clear(stream, x, STREAM.top - 1);
		clear(stream, x, STREAM.bottom + 1);
	}
	stamp(scene, stream);
}

/**
 * Broken rings spreading on the water where the stream lands, and a low crown of splash at its foot.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawRipples(scene, random) {
	const cx = STREAM.x + 1.5;
	const cy = STREAM.bottom + 0.5;
	for (const [rx, ry, colour] of /** @type {const} */ ([
		[7, 1.8, C.white],
		[12, 2.8, C.daySky6],
	])) {
		for (let a = 0; a < 48; a++) {
			const angle = (a / 48) * Math.PI * 2;
			const x = Math.round(cx + Math.cos(angle) * rx);
			const y = Math.round(cy + Math.sin(angle) * ry);
			if (ellipse(x, y, WATER) < 0.85 && random() > 0.25) {
				set(scene, x, y, colour);
			}
		}
	}
	// The crown: foam spreading either side of the stream's foot.
	rect(scene, STREAM.x - 2, STREAM.bottom, STREAM.w + 4, 1, C.foam);
	rect(scene, STREAM.x - 1, STREAM.bottom + 1, STREAM.w + 2, 1, C.white);
	set(scene, STREAM.x - 2, STREAM.bottom - 1, C.white);
	set(scene, STREAM.x + STREAM.w + 1, STREAM.bottom - 1, C.white);
}

/**
 * The last gleams of daylight on the copper, the brass and the glaze.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[3, 17],
		[4, 17],
		[26, 15],
		[27, 15],
		[8, 13],
		[24, 42],
		[25, 42],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * Tells how far a point lies inside an ellipse: below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number, rx: number, ry: number }} shape
 * @returns {number}
 */
function ellipse(x, y, shape) {
	return ((x - shape.x) / shape.rx) ** 2 + ((y - shape.y) / shape.ry) ** 2;
}

/**
 * Copies every painted pixel of a part, outline and all, onto the scene.
 * @param {Canvas} scene
 * @param {Canvas} part
 */
function stamp(scene, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			scene.p[i] = part.p[i];
		}
	}
}
