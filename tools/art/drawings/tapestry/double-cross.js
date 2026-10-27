// Double Cross: two hooded schemers shake hands on a moonlit bridge, each hiding a dagger behind their back.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The far bank's row, the parapet's top row and the full moon. */
const BANK = 40;
const PARAPET = 43;
const MOON = { x: 32, y: 13, r: 8 };

/** The figures' top row, and the left figure's left column; the right one mirrors it. */
const TOP = 15;
const LEFT = 5;

/** A deep green-teal the night sky is tinted towards, so this night differs from the purple ones. */
const TEAL = mix(C.pine, C.nightSky1, 0.5);

/**
 * A hooded figure facing right, offering a hand and hiding a dagger behind its back.
 * h cloak, d cloak in shadow, m cloak lit by the moon, r moonlit rim, k shadow in the hood, e eye,
 * S skin, s skin shade, c cuff, g the dagger's gold guard, b blade, B blade shade.
 */
const SCHEMER = [
	'............hhh............',
	'..........hhhhhm...........',
	'.........hhhhhhhm..........',
	'........dhhhhhhhhm.........',
	'.......ddhhhhhkkkmr........',
	'.......ddhhhhkkkkkr........',
	'........dhhhhkkekSr........',
	'........dhhhhkkkSSS........',
	'........ddhhhhkkSs.........',
	'........ddhhhhhhkmr........',
	'.......dddhhhhhhhhmr.......',
	'.......ddhhhhhhhhhhmm......',
	'.......ddhhhhhhhhhhhmmm....',
	'.......ddhhhhhhhhhhdmmmmc..',
	'.......ddhhhhhhhhhhmr.mmcSS',
	'.....g.ddhhhhhhhhhhmr...sSS',
	'.bbbbgSSdddhhhhhhhhmr......',
	'bBBBBgSSddddddhhhhhmr......',
	'.....g.ddhhhdddddddmr......',
	'.......ddhhhdhhhhhhhmr.....',
	'.......ddhhhdhhhhhhhmr.....',
	'......dddhhhdhhhhhhhmr.....',
	'......ddhhhhdhhhhdhhmr.....',
	'......ddhhhhdhhhhdhhhmr....',
	'.....dddhhhhdhhhhdhhhmr....',
	'.....ddhhhhhdhhhhdhhhmr....',
	'....dddhhhhhdhhhhdhhhhmr...',
	'....ddhhhhhhdhhhhdhhhhmr...',
	'....ddhhhhhhdhhhhdhhhhmr...',
];

/**
 * Draws the Double Cross scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(373);

	drawSky(layer, {
		time: 'night',
		horizon: BANK,
		random,
		stars: 26,
		starRows: 30,
	});
	tintSky(layer);
	drawMoon(layer);
	drawFarBank(layer);
	drawRiver(layer, random);

	// The bridge stands in front of the figures' feet, so it gets its own outline and goes on top.
	const people = createCanvas(64, 64);
	drawSchemers(people);
	outline(people, C.ink);

	drawBridge(scene);
	outline(scene, C.ink);
	underlay(scene, people);
	underlay(scene, layer);
	drawGlints(scene);
	return scene;
}

/**
 * Tints the night sky towards a deep green-teal.
 * @param {Canvas} layer
 */
function tintSky(layer) {
	for (let y = 0; y <= BANK; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && colour !== C.white && colour !== C.starDim) {
				set(layer, x, y, mix(colour, TEAL, 0.62));
			}
		}
	}
}

/**
 * A large full moon between the two figures, with a pale halo and darker seas.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	glow(layer, {
		x: MOON.x,
		y: MOON.y,
		radius: MOON.r + 9,
		colour: C.moonRim,
		strength: 0.3,
	});
	for (let y = MOON.y - MOON.r; y <= MOON.y + MOON.r; y++) {
		for (let x = MOON.x - MOON.r; x <= MOON.x + MOON.r; x++) {
			const d = Math.hypot(x - MOON.x, y - MOON.y);
			if (d > MOON.r + 0.3) {
				continue;
			}
			const sea =
				Math.hypot(x - MOON.x + 3, y - MOON.y + 2) < 2.5 ||
				Math.hypot(x - MOON.x - 2, y - MOON.y - 3) < 2;
			set(layer, x, y, d > MOON.r - 1.2 || sea ? C.moonRim : C.moon);
		}
	}
}

/**
 * The far bank: a low line of roofs, with red windows lit on the left and gold ones on the right.
 * @param {Canvas} layer
 */
function drawFarBank(layer) {
	const dark = mix(TEAL, C.ink, 0.25);
	const ridge = mix(C.pineShade, C.nightSky5, 0.45);
	for (let x = 0; x < 64; x++) {
		const roof = Math.abs(((x + 2) % 9) - 4);
		const top = BANK - 3 + Math.floor(roof / 2);
		for (let y = top; y <= BANK + 4; y++) {
			set(layer, x, y, y === top ? ridge : dark);
		}
	}
	/** @type {[number, Colour][]} */
	const windows = [
		[2, C.brickRedLight],
		[9, C.brickRed],
		[54, C.amber],
		[60, C.gold],
	];
	for (const [x, colour] of windows) {
		set(layer, x, BANK, colour);
	}
}

/**
 * The river under the bridge: dark green water with the moon's broken reflection.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRiver(layer, random) {
	const deep = mix(C.nightSea3, TEAL, 0.5);
	const mid = mix(C.nightSea2, TEAL, 0.4);
	const ripple = mix(C.nightWaveDeep, TEAL, 0.3);
	for (let y = BANK + 5; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, y < 54 ? mid : deep);
		}
	}
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 62);
		const y = BANK + 6 + Math.floor(random() * 18);
		rect(layer, x, y, 2 + Math.floor(random() * 2), 1, ripple);
	}
	for (let y = BANK + 6; y < 64; y += 2) {
		const half = 2 + Math.floor(random() * 3);
		rect(layer, MOON.x - half, y, half * 2, 1, y % 4 ? C.moonRim : C.moon);
	}
}

/**
 * The two schemers, the left in crimson and the right in ochre, their hands clasped under the moon.
 * @param {Canvas} canvas
 */
function drawSchemers(canvas) {
	const blade = { b: C.white, B: C.stoneLight, g: C.gold };
	paint(canvas, LEFT, TOP, SCHEMER, {
		h: C.brickRedShade,
		d: mix(C.brickRedShade, C.ink, 0.45),
		m: C.brickRed,
		r: C.brickRedLight,
		k: C.night,
		e: C.creamLight,
		S: C.skin,
		s: C.skinShade,
		c: C.brickRedLight,
		...blade,
	});
	paint(
		canvas,
		64 - LEFT - SCHEMER[0].length,
		TOP,
		SCHEMER,
		{
			h: mix(C.brass, C.timber, 0.55),
			d: C.timberShade,
			m: C.brass,
			r: mix(C.gold, C.moon, 0.4),
			k: C.night,
			e: C.creamLight,
			S: C.skinShade,
			s: C.timber,
			c: C.gold,
			...blade,
		},
		{ mirror: true }
	);
}

/**
 * The bridge in front of the figures, in the moon's shadow: a parapet with a moonlit coping over a stone arch.
 * @param {Canvas} scene
 */
function drawBridge(scene) {
	const face = mix(C.stoneShade, TEAL, 0.3);
	const joint = mix(C.stoneShade, C.ink, 0.35);
	const lit = mix(C.stoneMid, TEAL, 0.15);
	for (let y = PARAPET; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const arch = (x - 32) ** 2 / 25 ** 2 + (y - 64) ** 2 / 11 ** 2 < 1;
			if (arch) {
				continue;
			}
			const row = y - PARAPET;
			let colour = face;
			if (row === 0) {
				colour = C.stoneLight;
			} else if (row === 1) {
				colour = C.stoneMid;
			} else if (row === 2 || row === 6) {
				colour = joint;
			} else {
				const course = Math.floor((row - 3) / 3);
				const stone = (x + (course % 2) * 4) % 8;
				if ((row - 3) % 3 === 2 || stone === 0) {
					colour = joint;
				} else if (stone === 1 && (row - 3) % 3 === 0) {
					colour = lit;
				}
			}
			set(scene, x, y, colour);
		}
	}
	// The arch's voussoirs: a ring of lighter stones round the opening.
	for (let y = 50; y < 64; y++) {
		for (let x = 4; x < 60; x++) {
			const ring = (x - 32) ** 2 / 27 ** 2 + (y - 64) ** 2 / 13 ** 2;
			if (ring >= 1 && ring < 1.18 && get(scene, x, y)) {
				set(scene, x, y, (x + y) % 4 === 0 ? joint : lit);
			}
		}
	}
}

/**
 * A glint of moonlight on each blade, painted last.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	set(scene, LEFT + 2, TOP + 16, C.moon);
	set(scene, 64 - LEFT - 3, TOP + 16, C.moon);
}
