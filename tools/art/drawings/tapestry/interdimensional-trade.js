// Interdimensional Trade: a night-market stall beside a swirling violet portal, a strange many-fingered hand reaching through to pass the trader a glowing crystal.
import {
	createCanvas,
	set,
	rect,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawStreet } from '../../parts/street.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The street's kerb row, the portal's centre and radii, the counter's top row and the lantern. */
const STREET = 50;
const PORTAL = { x: 17, y: 29, rx: 14, ry: 17 };
const COUNTER = 42;
const LAMP = { x: 41, y: 24 };

/** The open palm's centre; the crystal floats just above it. */
const PALM = { x: 28, y: 39 };

/** The trader, turned left towards the portal: a turban, a dark beard and a green coat. */
const TRADER = [
	'...tttt...',
	'..tTtttt..',
	'..tttttt..',
	'..SSSSS...',
	'..eSSSS...',
	'.sSSSSS...',
	'..bbbSS...',
	'..bbbb....',
	'.gggggggg.',
	'ggggggggggg',
	'gggggGggggg',
	'gggggGggggg',
	'gggggGggggg',
	'gggggGggggg',
];

/**
 * Draws the Interdimensional Trade scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(977);

	drawSky(layer, {
		time: 'night',
		horizon: STREET,
		random,
		stars: 34,
		starRows: 24,
	});
	drawStreet(layer, { top: STREET });
	dimStreet(layer);
	drawPortal(layer);
	glow(layer, {
		x: PORTAL.x,
		y: PORTAL.y,
		radius: 26,
		colour: C.arcane,
		strength: 0.45,
		steps: 4,
		skip: [C.white, C.arcaneLight, C.arcane, C.arcaneShade],
	});

	drawStall(scene);
	paint(scene, 45, 26, TRADER, {
		t: C.amber,
		T: C.gold,
		S: C.skin,
		s: C.skinShade,
		e: C.wood,
		b: C.wood,
		g: C.pine,
		G: C.pineShade,
	});
	drawTraderArm(scene);
	drawGoods(scene);
	drawArm(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	glow(scene, {
		x: LAMP.x,
		y: LAMP.y + 2,
		radius: 18,
		colour: C.amber,
		strength: 0.45,
		steps: 4,
		skip: [C.ink, C.lampGlow, C.gold, C.tealLight, C.teal, C.white],
	});
	drawLantern(scene);
	drawCrystalLight(scene);
	drawCrystal(scene);
	return scene;
}

/**
 * Sinks the cobbles into the night.
 * @param {Canvas} layer
 */
function dimStreet(layer) {
	for (let y = STREET; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = layer.p[y * 64 + x];
			if (colour) {
				set(layer, x, y, mix(colour, C.nightSky2, 0.5));
			}
		}
	}
}

/**
 * The portal: an oval of violet light whose arms spiral in to a bright heart, with a white rim
 * and sparks of another world's teal.
 * @param {Canvas} layer
 */
function drawPortal(layer) {
	const { x: cx, y: cy, rx, ry } = PORTAL;
	for (let y = cy - ry; y <= cy + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const dx = (x - cx) / rx;
			const dy = (y - cy) / ry;
			const r = Math.hypot(dx, dy);
			if (r > 1) {
				continue;
			}
			const turn =
				(Math.atan2(dy, dx) + r * 7 + Math.PI * 4) %
				((Math.PI * 2) / 3);
			let colour;
			if (r > 0.9) {
				colour = C.arcaneLight;
			} else if (r < 0.16) {
				colour = C.white;
			} else if (r < 0.3) {
				colour = C.arcaneLight;
			} else if (turn < 0.55) {
				colour = C.arcaneLight;
			} else if (turn < 1.25) {
				colour = C.arcane;
			} else {
				colour = C.arcaneShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (const [x, y] of [
		[3, 18],
		[31, 15],
		[2, 41],
		[29, 45],
		[17, 10],
	]) {
		set(layer, x, y, C.tealLight);
	}
}

/**
 * The stall: a striped awning on two posts, a wooden counter with a lit front edge.
 * @param {Canvas} scene
 */
function drawStall(scene) {
	// A dark cloth hung across the back of the stall.
	for (let y = 21; y < COUNTER; y++) {
		for (let x = 37; x < 62; x++) {
			set(scene, x, y, (x - 37) % 5 === 4 ? C.night : C.roofShade);
		}
	}
	// The posts.
	rect(scene, 35, 18, 2, COUNTER - 18, C.timber);
	rect(scene, 62, 18, 2, COUNTER - 18, C.timberShade);
	// The awning: green and cream stripes, sloping down to the front, with a scalloped edge.
	for (let y = 13; y <= 20; y++) {
		for (let x = 33 + (20 - y) / 2; x < 64; x++) {
			const stripe = Math.floor((x - 33) / 4) % 2 === 0;
			const colour = y === 13 ? C.pineShade : stripe ? C.pine : C.cream;
			set(scene, Math.floor(x), y, colour);
		}
	}
	for (let x = 33; x < 64; x++) {
		const stripe = Math.floor((x - 33) / 4) % 2 === 0;
		if ((x - 33) % 4 !== 3) {
			set(scene, x, 21, stripe ? C.pineShade : C.creamShade);
		}
	}
	// The counter.
	rect(scene, 33, COUNTER, 31, 2, C.timberLight);
	rect(scene, 33, COUNTER + 2, 31, 11, C.timber);
	for (let x = 33; x < 64; x += 6) {
		rect(scene, x, COUNTER + 2, 1, 11, C.timberShade);
	}
	rect(scene, 33, COUNTER + 12, 31, 1, C.timberShade);
}

/**
 * The trader's arm reaching out over the counter, palm up, to take the crystal.
 * @param {Canvas} scene
 */
function drawTraderArm(scene) {
	line(scene, 47, 35, 42, 38, C.pine);
	line(scene, 47, 36, 42, 39, C.pineShade);
	rect(scene, 39, 38, 3, 2, C.skin);
	set(scene, 39, 37, C.skin);
}

/**
 * Goods on the counter: a tall jar, a squat pot and a basket of fruit.
 * @param {Canvas} scene
 */
function drawGoods(scene) {
	paint(
		scene,
		52,
		34,
		[
			'.......rr.r',
			'.ww...rrrrr',
			'.ww..yyyyyy',
			'wjjw.yyyyyy',
			'wjjw..yyyy.',
			'wjjwpppp...',
			'wjjwpppp...',
			'wjjwpppp...',
		],
		{
			w: C.creamShade,
			j: C.daySea2,
			p: C.brickRed,
			r: C.brickRedLight,
			y: C.brass,
		}
	);
}

/**
 * The arm from beyond, reaching out of the portal's heart: long, pale green and jointless,
 * ending in an open palm turned up to the viewer, its six long fingers spread like a fan.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	for (let i = 0; i < 4; i++) {
		line(
			scene,
			14,
			34 + i,
			PALM.x - 3,
			PALM.y + 1 + i,
			i === 3 ? C.ghostShade : C.ghost
		);
	}
	// The palm.
	for (let y = PALM.y - 3; y <= PALM.y + 4; y++) {
		for (let x = PALM.x - 4; x <= PALM.x + 4; x++) {
			if (((x - PALM.x) / 4.6) ** 2 + ((y - PALM.y) / 4.4) ** 2 <= 1) {
				set(
					scene,
					x,
					y,
					x >= PALM.x + 3 || y >= PALM.y + 3 ? C.ghostShade : C.ghost
				);
			}
		}
	}
	// Six fingers, two pixels thick, spreading from the top of the palm.
	for (const [base, lean] of [
		[-4, -5],
		[-2, -3],
		[0, -1],
		[2, 1],
		[4, 3],
		[6, 5],
	]) {
		const x0 = PALM.x + base - 1;
		const y0 = PALM.y - 2;
		const tip = y0 - 9 + Math.round(Math.abs(lean) / 2.5);
		line(scene, x0, y0, x0 + lean, tip, C.ghost);
		line(scene, x0 + 1, y0, x0 + lean + 1, tip, C.ghostShade);
	}
}

/**
 * The crystal the hand offers, standing on the palm: a tall teal gem, lit after the outline.
 * @param {Canvas} scene
 */
function drawCrystal(scene) {
	paint(
		scene,
		PALM.x - 3,
		PALM.y - 13,
		[
			'...k...',
			'..kwk..',
			'.kCwck.',
			'kCCwcck',
			'kCCCcck',
			'kCCCcck',
			'.kCCck.',
			'..kck..',
			'...k...',
		],
		{ k: C.ink, C: C.tealLight, c: C.teal, w: C.white }
	);
}

/**
 * The lantern hanging under the awning, drawn after the outline with its own ink frame.
 * @param {Canvas} scene
 */
function drawLantern(scene) {
	set(scene, LAMP.x, LAMP.y - 2, C.ink);
	paint(
		scene,
		LAMP.x - 2,
		LAMP.y - 1,
		['.kkk.', 'kgllk', 'kglgk', 'kgggk', '.kkk.'],
		{
			k: C.ink,
			g: C.gold,
			l: C.lampGlow,
		}
	);
}

/**
 * The crystal's teal light falling on the fingers and the counter beneath it.
 * @param {Canvas} scene
 */
function drawCrystalLight(scene) {
	glow(scene, {
		x: PALM.x,
		y: PALM.y - 9,
		radius: 12,
		colour: C.tealLight,
		strength: 0.4,
		steps: 3,
		skip: [C.ink, C.tealLight, C.teal, C.white],
	});
}
