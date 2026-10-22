// World's Fair: an exhibition palace of glass and iron under the flags of many nations, a great wheel turning behind it.
import {
	createCanvas,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawWheel } from '../../parts/wheel.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row, and the plaza's first row. */
const HORIZON = 46;
const PLAZA = 55;

/** The great wheel's hub and radius. */
const HUB_X = 47;
const HUB_Y = 23;
const RADIUS = 18;

/** The palace: the long hall's roof row, and the transept's centre, springing row and radius. */
const HALL_TOP = 39;
const NAVE_X = 21;
const SPRING = 35;
const VAULT = 13;

/** Glass and iron: the panes, a lighter pane catching the sun, and the white-painted ironwork. */
const GLASS = mix(C.daySky3, C.daySea1, 0.3);
const GLASS_DEEP = mix(C.daySky2, C.daySea2, 0.45);
const GLINT = C.daySky6;
const IRON = C.white;
const IRON_SHADE = C.cloudShade;

/**
 * The flags, each a few pixels across: rows of keys, top row first.
 * Plain tricolours, crosses and a disc, so none can read as a letter.
 * @type {readonly { rows: string[], colours: Record<string, Colour> }[]}
 */
const FLAGS = [
	{
		rows: ['bwr', 'bwr', 'bwr'],
		colours: { b: C.daySea2, w: C.white, r: C.brickRed },
	},
	{
		rows: ['kkkk', 'rrrr', 'gggg'],
		colours: { k: C.ink, r: C.brickRed, g: C.gold },
	},
	{
		rows: ['gwr', 'gwr', 'gwr'],
		colours: { g: C.pine, w: C.white, r: C.brickRed },
	},
	{ rows: ['bgbb', 'gggg', 'bgbb'], colours: { b: C.daySea2, g: C.gold } },
	{ rows: ['wwww', 'wrrw', 'wwww'], colours: { w: C.white, r: C.brickRed } },
	{
		rows: ['rrrr', 'wwww', 'bbbb'],
		colours: { r: C.brickRed, w: C.white, b: C.daySea2 },
	},
	{ rows: ['rwrr', 'wwww', 'rwrr'], colours: { r: C.brickRed, w: C.white } },
	{
		rows: ['kyr', 'kyr', 'kyr'],
		colours: { k: C.ink, y: C.gold, r: C.brickRed },
	},
];

/**
 * Draws the World's Fair scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7303);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawPlaza(layer);
	drawGreatWheel(layer);

	const cabins = createCanvas(64, 64);
	drawCabins(cabins);
	outline(cabins, C.ink);

	drawHall(scene);
	drawTransept(scene);
	drawCrowd(scene, { x: 1, y: 63, count: 3, random });
	drawCrowd(scene, { x: 34, y: 62, count: 4, random });
	drawCrowd(scene, { x: 54, y: 63, count: 3, random });
	outline(scene, C.ink);
	underlay(scene, cabins);
	underlay(scene, layer);
	drawFlags(scene);
	return scene;
}

/**
 * The fairground's pale paving, with a darker path up the middle to the palace doors.
 * @param {Canvas} layer
 */
function drawPlaza(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = (x + (y % 2) * 2) % 4 === 0 ? C.creamShade : C.cream;
			if (y === PLAZA) {
				colour = C.creamLight;
			} else if (Math.abs(x - NAVE_X) < 4 + (y - PLAZA) / 2) {
				colour = (x + y) % 3 === 0 ? C.sandShade : C.sand;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The great wheel behind the palace, painted red, on its two raking legs: drawn on the background,
 * with an ink rim outside its tyre.
 * @param {Canvas} layer
 */
function drawGreatWheel(layer) {
	for (const dx of [-10, 10]) {
		line(layer, HUB_X, HUB_Y, HUB_X + dx, PLAZA, C.ink);
		line(layer, HUB_X + 1, HUB_Y, HUB_X + dx + 1, PLAZA, C.stoneShade);
	}
	drawWheel(layer, {
		x: HUB_X,
		y: HUB_Y,
		r: RADIUS + 1,
		spokes: 0,
		tyre: C.ink,
	});
	drawWheel(layer, {
		x: HUB_X,
		y: HUB_Y,
		r: RADIUS,
		spokes: 16,
		tyre: C.brickRed,
		spoke: C.stoneLight,
		hub: C.gold,
	});
}

/**
 * The wheel's cabins, hanging from its rim in bright colours.
 * @param {Canvas} canvas
 */
function drawCabins(canvas) {
	const colours = [C.gold, C.daySea2, C.brickRedLight, C.pineLight];
	for (let i = 0; i < 12; i++) {
		const angle = (i / 12) * Math.PI * 2 + 0.13;
		const x = HUB_X + Math.round(Math.cos(angle) * RADIUS);
		const y = HUB_Y + Math.round(Math.sin(angle) * RADIUS);
		rect(canvas, x - 1, y + 1, 3, 2, colours[i % colours.length]);
		set(canvas, x, y + 1, C.lampGlow);
	}
}

/**
 * The long hall: two storeys of glass between white iron columns, a stone plinth and a roof walk.
 * @param {Canvas} scene
 */
function drawHall(scene) {
	for (let y = HALL_TOP; y < PLAZA; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = (x - y + 64) % 9 === 0 ? GLINT : GLASS;
			if (y === HALL_TOP) {
				colour = IRON;
			} else if (y === HALL_TOP + 1) {
				colour = IRON_SHADE;
			} else if (y === HALL_TOP + 7) {
				colour = IRON;
			} else if (y >= PLAZA - 2) {
				colour = y === PLAZA - 2 ? C.stoneLight : C.stone;
			} else if (x % 4 === 0) {
				colour = IRON;
			} else if (y > HALL_TOP + 7) {
				colour = (x - y + 64) % 9 === 0 ? GLINT : GLASS_DEEP;
			}
			set(scene, x, y, colour);
		}
	}
	// The doors under the transept.
	rect(scene, NAVE_X - 2, PLAZA - 7, 5, 5, C.roofShade);
	rect(scene, NAVE_X - 2, PLAZA - 7, 5, 1, C.gold);
}

/**
 * The transept rising from the hall's middle: a tall glass front under a great arched fan of
 * glass, its iron ribs radiating from the springing.
 * @param {Canvas} scene
 */
function drawTransept(scene) {
	const left = NAVE_X - VAULT;
	const right = NAVE_X + VAULT;
	for (let y = SPRING - VAULT - 1; y < HALL_TOP + 7; y++) {
		for (let x = left; x <= right; x++) {
			const dx = x - NAVE_X;
			const dy = SPRING - y;
			const d = Math.hypot(dx, dy);
			if (y <= SPRING && d > VAULT + 0.5) {
				continue;
			}
			let colour = (x - y + 64) % 9 === 0 ? GLINT : GLASS;
			if (y <= SPRING) {
				const sector = (Math.atan2(dy, dx) / Math.PI) * 6;
				const spoke =
					Math.abs((((sector + 0.5) % 1) - 0.5) * (Math.PI / 6) * d) <
					0.5;
				colour = Math.floor(sector) % 2 ? GLASS : GLASS_DEEP;
				if (d < 3.5) {
					colour = d < 2.5 ? C.gold : C.amber;
				} else if (d > VAULT - 1.2 || spoke || Math.abs(d - 8) < 0.5) {
					colour = IRON;
				} else if (Math.abs(d - 10) < 0.5) {
					colour = GLINT;
				}
			} else if (x === left || x === right) {
				colour = IRON;
			} else if ((x - left) % 4 === 0) {
				colour = IRON;
			} else if (y === SPRING + 1) {
				colour = IRON_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Flagpoles along the roof walk and on the transept's crown, each flying a different nation's flag.
 * Drawn after the outline, so the small flags stay crisp.
 * @param {Canvas} scene
 */
function drawFlags(scene) {
	const poles = [
		{ x: 2, y: HALL_TOP - 1 },
		{ x: 38, y: HALL_TOP - 1 },
		{ x: 46, y: HALL_TOP - 1 },
		{ x: 54, y: HALL_TOP - 1 },
		{ x: 61, y: HALL_TOP - 1 },
		{ x: NAVE_X - 9, y: SPRING - 9 },
		{ x: NAVE_X, y: SPRING - VAULT - 2 },
		{ x: NAVE_X + 9, y: SPRING - 9 },
	];
	poles.forEach(({ x, y }, i) => {
		const tall = i === 6 ? 7 : 5;
		rect(scene, x, y - tall + 1, 1, tall, C.ink);
		set(scene, x, y - tall, C.gold);
		const flag = FLAGS[i % FLAGS.length];
		paint(scene, x + 1, y - tall + 1, flag.rows, flag.colours);
	});
}
