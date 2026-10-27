// Gremlins: big-eared green gremlins gleefully pulling a brass clockwork engine apart at night, sparks flying.
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
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';
import { drawStreet } from '../../parts/street.js';
import { drawWheel } from '../../parts/wheel.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The yard's kerb row, and the engine's box. */
const KERB = 46;
const ENGINE = { left: 11, right: 46, top: 25, bottom: 50 };

/** The open hatch in the engine's front, and the big gear inside it. */
const HATCH = { left: 15, right: 32, top: 30, bottom: 46 };
const GEAR = { x: 22, y: 39 };

/** Where the spanner strikes the gear and the sparks fly from. */
const STRIKE = { x: 17, y: 45 };

/** A gremlin's head, seen from the front: a ears, p inner ear, G skin, g shade, Y eyes, k pupils and mouth, w teeth. */
const HEAD = [
	'aa.........aa',
	'apa.GGGGG.apa',
	'.apGGGGGGGpa.',
	'..aGYYGYYGa..',
	'...GYkGkYG...',
	'...GGGgGGG...',
	'...GwkwkwG...',
	'....gGGGg....',
];

/** The gremlins' colours. */
const GREMLIN = {
	a: C.grassLight,
	p: mix(C.brickRedLight, C.skin, 0.4),
	G: C.grass,
	g: C.grassShade,
	Y: C.gold,
	k: C.ink,
	w: C.white,
};

/**
 * Draws the Gremlins scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1337);

	drawSky(layer, {
		time: 'night',
		horizon: KERB,
		random,
		stars: 30,
		starRows: 24,
		moon: { x: 54, y: 9 },
	});
	drawSkyline(layer, { base: KERB - 1, time: 'night', random, height: 14 });
	drawStreet(layer, { top: KERB });
	dim(layer, KERB, 0.45);

	drawEngine(scene);
	drawKey(scene);
	drawSpring(scene);
	drawGremlinWithGear(scene, 9, 13);
	drawGremlinPulling(scene, 50, 47);
	drawGremlinWithWrench(scene, 1, 50);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawInnards(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Darkens the yard under the night sky, so the brass engine stands out against it.
 * @param {Canvas} layer
 * @param {number} top - The first row darkened
 * @param {number} amount - How far each colour moves towards the night
 */
function dim(layer, top, amount) {
	for (let y = top; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour) {
				set(layer, x, y, mix(colour, C.nightSky3, amount));
			}
		}
	}
}

/**
 * The engine: a riveted brass cabinet on stubby feet, a dial on its face and its front hatch torn open,
 * its hatch cover thrown on the ground.
 * @param {Canvas} scene
 */
function drawEngine(scene) {
	const { left, right, top, bottom } = ENGINE;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const corner =
				(y === top || y === bottom) && (x === left || x === right);
			if (corner) {
				continue;
			}
			let colour = C.brass;
			if (y === top || x === left) {
				colour = C.gold;
			} else if (x >= right - 2 || y === bottom) {
				colour = C.lampFrame;
			} else if (y === top + 1) {
				colour = mix(C.gold, C.brass, 0.5);
			}
			set(scene, x, y, colour);
		}
	}
	// A band of trim round the top, studded with rivets.
	rect(scene, left, top + 3, right - left + 1, 1, C.amber);
	for (let x = left + 2; x <= right - 2; x += 4) {
		set(scene, x, top + 3, C.lampGlow);
	}
	for (let y = top + 7; y <= bottom - 2; y += 4) {
		set(scene, left + 1, y, C.lampGlow);
		set(scene, right - 1, y, C.gold);
	}
	// Stubby feet.
	for (const x of [left + 1, right - 4]) {
		rect(scene, x, bottom + 1, 4, 2, C.lampFrame);
		rect(scene, x, bottom + 1, 4, 1, C.brass);
	}
	// The torn-open hatch, dark inside.
	for (let y = HATCH.top; y <= HATCH.bottom; y++) {
		for (let x = HATCH.left; x <= HATCH.right; x++) {
			set(scene, x, y, y === HATCH.top ? C.wood : C.roofShade);
		}
	}
	// The dial: a pale face in a brass rim, its hands askew.
	const dial = { x: 40, y: 34 };
	for (let dy = -4; dy <= 4; dy++) {
		for (let dx = -4; dx <= 4; dx++) {
			const d = Math.hypot(dx, dy);
			if (d <= 4.4) {
				set(
					scene,
					dial.x + dx,
					dial.y + dy,
					d > 3.3 ? C.amber : C.creamLight
				);
			}
		}
	}
	line(scene, dial.x, dial.y, dial.x + 2, dial.y - 2, C.ink);
	line(scene, dial.x, dial.y, dial.x - 2, dial.y + 1, C.brickRed);
	// A pipe on the engine's right.
	rect(scene, 36, 41, 8, 2, C.amber);
	rect(scene, 36, 41, 8, 1, C.gold);
	// The hatch cover, thrown down on the cobbles in front, with a loose bolt beside it.
	for (let y = 55; y <= 59; y++) {
		const shift = Math.floor((y - 55) / 2);
		for (let x = 26 + shift; x <= 42 + shift; x++) {
			const colour = y === 55 ? C.gold : y === 59 ? C.lampFrame : C.brass;
			set(scene, x, y, colour);
		}
	}
	for (const x of [28, 40]) {
		set(scene, x + 1, 57, C.lampGlow);
	}
	rect(scene, 46, 60, 2, 1, C.stoneLight);
	set(scene, 48, 60, C.stone);
}

/**
 * The winding key on top of the engine: a stem in a collar and a two-lobed bow.
 * @param {Canvas} scene
 */
function drawKey(scene) {
	rect(scene, 33, 19, 3, 6, C.brass);
	set(scene, 33, 19, C.gold);
	rect(scene, 31, 23, 7, 2, C.amber);
	rect(scene, 31, 23, 7, 1, C.gold);
	for (const cx of [29, 39]) {
		for (let dy = -5; dy <= 5; dy++) {
			for (let dx = -5; dx <= 5; dx++) {
				const d = Math.hypot(dx * 0.9, dy);
				if (d <= 4.8 && d > 2) {
					const lit = dx + dy < -1;
					set(scene, cx + dx, 12 + dy, lit ? C.gold : C.brass);
				}
			}
		}
	}
	rect(scene, 32, 14, 5, 5, C.brass);
	rect(scene, 32, 14, 1, 5, C.gold);
}

/**
 * A long coil spring dragged out of the engine's side, its loops lit on the near side.
 * @param {Canvas} scene
 */
function drawSpring(scene) {
	const from = { x: 45, y: 45 };
	const to = { x: 52, y: 56 };
	const steps = 40;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = from.x + (to.x - from.x) * t;
		const y = from.y + (to.y - from.y) * t;
		const turn = t * Math.PI * 9;
		const near = Math.cos(turn) > 0;
		set(
			scene,
			Math.round(x + Math.sin(turn) * 2.5),
			Math.round(y - Math.sin(turn) * 1.2),
			near ? C.white : C.stoneLight
		);
	}
}

/**
 * Paints a gremlin's head with its top-left corner at the given pixel.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 */
function head(scene, x, y) {
	paint(scene, x, y, HEAD, GREMLIN);
}

/**
 * A gremlin standing on the engine's top, holding up a gear it has wrenched out.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawGremlinWithGear(scene, x, y) {
	head(scene, x, y);
	paint(
		scene,
		x,
		y + 8,
		[
			'....gGGGg.GG.',
			'..GGGGGGGG...',
			'....gGGGg....',
			'....GG.GG....',
			'....g...g....',
		],
		GREMLIN
	);
}

/**
 * A gremlin on the ground, leaning back as it hauls on the spring.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawGremlinPulling(scene, x, y) {
	head(scene, x + 1, y);
	paint(
		scene,
		x,
		y + 8,
		[
			'.....gGGGg...',
			'GGGGGGGGGG...',
			'.....GGGGGg..',
			'......GG.GG..',
			'.....GG...GG.',
		],
		GREMLIN
	);
}

/**
 * A gremlin at the front swinging a big spanner up into the engine's insides.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawGremlinWithWrench(scene, x, y) {
	head(scene, x, y);
	paint(
		scene,
		x,
		y + 8,
		['....gGGGgGG..', '...GGGGGG.GG.', '....gGGGg....', '....GG.GG....'],
		GREMLIN
	);
	// The spanner: a long handle up to an open jaw that bites the gear's rim.
	for (let i = 0; i <= 8; i++) {
		const hx = x + 12 + Math.round(i * 0.45);
		const hy = y + 9 - i;
		set(scene, hx, hy, C.stoneLight);
		set(scene, hx + 1, hy, C.stone);
	}
	paint(scene, STRIKE.x - 2, STRIKE.y - 1, ['s...s', 'ss.ss', '.sSs.'], {
		s: C.stoneLight,
		S: C.stone,
	});
}

/**
 * The gears, drawn after the outline so their teeth stay clear: a big wheel and a small one in the hatch,
 * and the one the first gremlin holds up.
 * @param {Canvas} scene
 */
function drawInnards(scene) {
	gear(scene, GEAR.x, GEAR.y, 6);
	gear(scene, HATCH.right - 4, HATCH.top + 5, 3);
	gear(scene, 24, 18, 3);
}

/**
 * A brass gear: a spoked wheel with square teeth round its rim.
 * @param {Canvas} scene
 * @param {number} x - The hub's column
 * @param {number} y - The hub's row
 * @param {number} r - The rim's radius
 */
function gear(scene, x, y, r) {
	const teeth = r * 2;
	for (let i = 0; i < teeth; i++) {
		const angle = (i / teeth) * Math.PI * 2;
		set(
			scene,
			x + Math.round(Math.cos(angle) * (r + 1)),
			y + Math.round(Math.sin(angle) * (r + 1)),
			C.amber
		);
	}
	drawWheel(scene, {
		x,
		y,
		r,
		spokes: r > 4 ? 6 : 4,
		tyre: C.gold,
		spoke: C.brass,
		hub: C.lampGlow,
	});
}

/**
 * A shower of sparks bursting from the spanner's blow: bright streaks flying up and out over the dark yard,
 * with a warm glow round the blow.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	glow(scene, {
		x: STRIKE.x,
		y: STRIKE.y,
		radius: 7,
		colour: C.gold,
		strength: 0.35,
	});
	for (let i = 0; i < 22; i++) {
		const angle = -Math.PI * (0.4 + random() * 0.65);
		const reach = 4 + random() * 12;
		const dx = Math.cos(angle);
		const dy = Math.sin(angle);
		const x = STRIKE.x + dx * reach;
		const y = STRIKE.y + dy * reach;
		set(scene, Math.round(x - dx * 2), Math.round(y - dy * 2), C.amber);
		set(scene, Math.round(x - dx), Math.round(y - dy), C.gold);
		set(scene, Math.round(x), Math.round(y), C.lampGlow);
	}
	set(scene, STRIKE.x, STRIKE.y - 1, C.white);
	for (const [dx, dy] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		set(scene, STRIKE.x + dx, STRIKE.y - 1 + dy, C.lampGlow);
	}
}
