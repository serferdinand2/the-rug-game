// Uploaded Consciousness: a head in profile whose back dissolves into glowing pixels that stream into a server tower at night.
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
import { drawSky } from '../../parts/sky.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A piece of the bust that has broken off.
 * @typedef {Object} Mote
 * @property {number} x - The column it broke off at
 * @property {number} y - The row it broke off at
 * @property {Colour} [colour] - The bust's colour there; the free motes in the stream have none
 * @property {number} [t] - How far past the breaking line it was, from 0
 */

/** The horizon (the floor's far edge) and the server tower's feet. */
const HORIZON = 47;
const TOWER_FOOT = 56;

/** The tower's sides and top, and the glowing port the stream pours into. */
const TOWER = { left: 45, right: 59, top: 9 };
const PORT = { x: 46, y: 27 };

/** The head's first row, and the face's front edge row by row from there: brow, nose, lips and chin. */
const HEAD_TOP = 8;

/** The row the shoulders start on. */
const SHOULDER = 40;
const FACE = [
	15, 12, 10, 9, 8, 7, 7, 6, 6, 6, 6, 7, 7, 6, 5, 4, 4, 6, 7, 6, 7, 6, 7, 7,
	8, 10, 13,
];

/**
 * Draws the Uploaded Consciousness scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1049);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 34,
		starRows: 30,
	});
	drawGrid(layer);
	glow(layer, {
		x: PORT.x,
		y: PORT.y,
		radius: 20,
		colour: C.teal,
		strength: 0.35,
		steps: 4,
	});

	const head = createCanvas(64, 64);
	drawHead(head);
	const { solid, motes } = dissolve(head, random);
	drawTower(solid);
	outline(solid, C.ink);
	underlay(solid, layer);
	drawStream(solid, motes, random);
	drawLights(solid);
	underlay(scene, solid);
	return scene;
}

/**
 * The floor of a data hall at night: dark, ruled with teal lines that run towards the horizon.
 * @param {Canvas} layer
 */
function drawGrid(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		const depth = (y - HORIZON) / (64 - HORIZON);
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.nightSky1, C.tealShade, 0.25 + depth * 0.2);
			const run = Math.abs(((x - 32) / (0.2 + depth)) % 10);
			const across = [1, 3, 6, 10, 15].includes(y - HORIZON);
			if (y === HORIZON + 1 || across || run < 0.9 + depth) {
				colour = mix(C.tealShade, C.teal, depth * 0.6);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The bust in profile facing left: a cropped head of hair, the face with brow, nose, lips and chin, an ear, a neck
 * and dark shoulders running out of the bottom of the scene. Painted whole; dissolve() then breaks up its back.
 * @param {Canvas} canvas
 */
function drawHead(canvas) {
	for (let y = HEAD_TOP; y < 64; y++) {
		const row = y - HEAD_TOP;
		let front;
		let back;
		if (row < FACE.length) {
			front = FACE[row];
			const t = (y - 21) / 14;
			back = Math.round(19 + 12 * Math.sqrt(Math.max(0, 1 - t * t)));
			if (y > 29) {
				back = Math.max(back, 23);
			}
		} else if (y < SHOULDER) {
			front = 13;
			back = 23;
		} else {
			front = Math.max(0, 12 - (y - SHOULDER) * 3);
			back = Math.min(44, 25 + (y - SHOULDER) * 3);
		}
		for (let x = front; x <= back; x++) {
			set(canvas, x, y, headColour(x, y, front, back));
		}
	}
	// The ear, the eye and the brow.
	for (const [x, y] of [
		[19, 21],
		[20, 21],
		[21, 22],
		[21, 23],
		[21, 24],
		[20, 25],
		[19, 25],
	]) {
		set(canvas, x, y, C.skinShade);
	}
	set(canvas, 9, 20, C.ink);
	set(canvas, 8, 20, C.white);
	set(canvas, 8, 18, C.timberShade);
	set(canvas, 9, 18, C.timberShade);
	set(canvas, 10, 18, C.timberShade);
	set(canvas, 7, 28, C.skinShade);
	set(canvas, 8, 28, C.skinShade);
}

/**
 * One pixel of the bust: hair over the crown and the back, skin shaded under the jaw, a dark shirt below.
 * @param {number} x
 * @param {number} y
 * @param {number} front - The row's front edge
 * @param {number} back - The row's back edge
 * @returns {Colour}
 */
function headColour(x, y, front, back) {
	if (y >= SHOULDER) {
		const collar = y <= SHOULDER + 1 && x >= 11 && x <= 25;
		return collar ? C.stoneLight : x <= front + 1 ? C.roofLight : C.roof;
	}
	const hair = y < 13 + Math.max(0, x - 14) * 0.6 && !(y >= 15 && x < 16);
	if (hair && y < 30) {
		return y === HEAD_TOP || x === front ? C.timberLight : C.timber;
	}
	if (y >= 35 && x > 19) {
		return C.skinShade;
	}
	if (x === front && y > 12) {
		return mix(C.skin, C.moon, 0.4);
	}
	return y >= 34 || x >= back - 1 ? C.skinShade : C.skin;
}

/**
 * Breaks up the back of the head: past a slanting line, the bust turns to square motes that drift apart and turn teal.
 * @param {Canvas} head
 * @param {() => number} random
 * @returns {{ solid: Canvas, motes: Mote[] }} The unbroken bust, and each mote's
 * starting point and size.
 */
function dissolve(head, random) {
	const solid = createCanvas(64, 64);
	/** @type {Mote[]} */
	const motes = [];
	for (let by = HEAD_TOP; by < 64; by += 2) {
		for (let bx = 0; bx < 46; bx += 2) {
			const edge =
				(by < SHOULDER ? 16 + (by - HEAD_TOP) * 0.3 : 30) +
				random() * 3;
			for (let j = 0; j < 2; j++) {
				for (let i = 0; i < 2; i++) {
					const colour = get(head, bx + i, by + j);
					if (colour && bx + i < edge) {
						set(solid, bx + i, by + j, colour);
					}
				}
			}
			const colour = get(head, bx, by);
			if (colour && bx >= edge && by < SHOULDER + 2) {
				motes.push({ x: bx, y: by, colour, t: (bx - edge) / 28 });
			}
		}
	}
	return { solid, motes };
}

/**
 * The stream: each mote drifts from where it broke off towards the port, shrinking and brightening as it goes,
 * and more motes fill the gap between the head and the tower.
 * @param {Canvas} scene
 * @param {Mote[]} motes
 * @param {() => number} random
 */
function drawStream(scene, motes, random) {
	for (const mote of motes) {
		const t = Math.min(0.95, (mote.t ?? 0) + random() * 0.08);
		place(scene, mote, t, random);
	}
	for (let i = 0; i < 40; i++) {
		const t = 0.35 + random() * 0.65;
		const x = 22 + Math.floor(random() * 14);
		const y = 10 + Math.floor(random() * 34);
		place(scene, { x, y }, t, random);
	}
}

/**
 * Places one mote part of the way from its origin to the port: two pixels wide near the head, one near the port.
 * It keeps a little of the bust's colour just after breaking off, then turns to light.
 * @param {Canvas} scene
 * @param {Mote} mote
 * @param {number} t - How far along, from 0 to 1
 * @param {() => number} random
 */
function place(scene, { x, y, colour: from }, t, random) {
	const px = Math.round(x + (PORT.x - 1 - x) * t);
	const py = Math.round(
		y + (PORT.y - y) * t * t + (random() - 0.5) * 2 * (1 - t)
	);
	let colour = t < 0.6 ? C.teal : random() > 0.5 ? C.tealLight : C.ghost;
	if (t < 0.3) {
		colour = C.tealLight;
	}
	if (from && t < 0.12) {
		colour = mix(from, C.tealLight, 0.5);
	}
	const size = t < 0.45 ? 2 : 1;
	if (px >= PORT.x) {
		return;
	}
	rect(scene, px, py, size, size, colour);
}

/**
 * The server tower: a tall dark cabinet of stacked units with vents, standing on the floor.
 * @param {Canvas} canvas
 */
function drawTower(canvas) {
	const { left, right, top } = TOWER;
	for (let y = top; y <= TOWER_FOOT; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.roofShade;
			if (x === left || y === top) {
				colour = C.stoneMid;
			} else if (x >= right - 1) {
				colour = C.night;
			} else if ((y - top) % 5 === 0) {
				colour = C.night;
			} else if (
				(y - top) % 5 === 3 &&
				x > left + 6 &&
				x < right - 2 &&
				x % 2 === 0
			) {
				colour = C.night;
			}
			set(canvas, x, y, colour);
		}
	}
	// The port: a lit slot where the stream pours in.
	rect(canvas, left, PORT.y - 2, 4, 5, C.tealShade);
	rect(canvas, left, PORT.y - 1, 3, 3, C.tealLight);
	set(canvas, left, PORT.y, C.white);
}

/**
 * Status lights on the tower's units, blinking in teal, green and gold.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	const { left, right, top } = TOWER;
	let n = 0;
	for (let y = top + 2; y < TOWER_FOOT - 1; y += 5) {
		if (Math.abs(y - PORT.y) < 4) {
			continue;
		}
		for (let x = left + 2; x <= left + 5; x += 1) {
			n++;
			const colour =
				n % 5 === 0 ? C.gold : n % 3 === 0 ? C.ghost : C.tealLight;
			if (n % 4 !== 1) {
				set(scene, x, y, colour);
			}
		}
		set(scene, right - 3, y + 1, C.teal);
	}
}
