// Espionage: a hooded spy in a dark alley, reading a stolen letter under the one lamp on the wall.
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
import { drawStreet } from '../../parts/street.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The wall's top row, the street's kerb row, and the lantern's glass centre. */
const ROOF = 13;
const STREET = 54;
const LAMP = { x: 42, y: 20 };

/**
 * The spy, facing right towards the lamp, the letter held up to its light. h hood and cloak,
 * d cloak shade and folds, m folds lit by the lamp, r lamp-lit rim, k shadow in the hood, S skin, s skin shade, P letter,
 * p letter fold, w seal, W seal lit, B boot.
 */
const SPY = [
	'......hhhh..........',
	'.....hhhhmm.........',
	'....hhhhhhmm........',
	'....hhhhhhhmr.......',
	'...dhhhhhkkkr.......',
	'...dhhhhkkSSSr......',
	'...dhhhhkSSSSS......',
	'...dhhhhkkSsSr......',
	'...dhhhhhkkssr......',
	'..ddhhhhhhhhmr......',
	'..ddhhhhhhhhhmr.....',
	'.dddhhhhhhhhhhmr....',
	'.ddhhhdhhhhhhmSPPPPP',
	'.ddhhhdhhhhhhmmPPwWP',
	'.ddhhhdhhhhhhmmPPwwP',
	'.ddhhhdhhhhhhmmPpppP',
	'.ddhhhdhhhhhhmSPPPPP',
	'.ddhhhdhhhdhhhmr....',
	'.ddhhhdhhhdhhhmr....',
	'.ddhhhdhhhdhhhmr....',
	'ddhhhhdhhhdhhhmr....',
	'ddhhhhdhhhdhhhmmr...',
	'ddhhhhdhhhdhhhhmr...',
	'ddhhhhdhhhdhhhhmr...',
	'ddhhhhdhhhhdhhhmmr..',
	'ddhhhhdhhhhdhhhhmr..',
	'ddhhhhdhhhhdhhhhmr..',
	'dhhhhhdhhhhdhhhhhmr.',
	'dhhh.hdhhh.dhhh.hmr.',
	'......BBB....BBBB...',
];

/**
 * Draws the Espionage scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(105);

	drawSky(layer, {
		time: 'night',
		horizon: ROOF,
		random,
		stars: 14,
		starRows: ROOF - 2,
		moon: { x: 10, y: 6 },
	});
	drawWall(layer);
	drawStreet(layer, { top: STREET });

	// The door and the chimneys stand behind the spy, so they get their own outline.
	const behind = createCanvas(64, 64);
	drawChimneys(behind);
	drawDoor(behind);
	drawLantern(behind);
	outline(behind, C.ink);
	const sky = behind.p.map((colour, i) => !colour && i < ROOF * 64);
	underlay(behind, layer);
	drawLamplight(behind, sky);

	paint(scene, 14, STREET + 1 - SPY.length, SPY, {
		h: C.roof,
		d: C.roofShade,
		m: C.roofLight,
		r: C.railLight,
		k: C.night,
		S: C.skin,
		s: C.skinShade,
		P: C.creamLight,
		p: C.cream,
		w: C.brickRed,
		W: C.brickRedLight,
		B: C.wood,
	});
	outline(scene, C.ink);
	underlay(scene, behind);
	drawGlass(scene);
	return scene;
}

/**
 * Paints a sprite from rows of keys; dots and unknown keys are left alone.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 * @param {Record<string, Colour>} colours
 */
function paint(canvas, x, y, rows, colours) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * The alley's brick wall, from the roofline down to the street, with a stone coping.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = ROOF; y < STREET; y++) {
		const course = Math.floor((y - ROOF) / 3);
		for (let x = 0; x < 64; x++) {
			let colour = C.brickRed;
			if ((y - ROOF) % 3 === 2 || (x + (course % 2) * 3) % 6 === 0) {
				colour = C.brickRedShade;
			} else if ((x * 7 + y * 3) % 11 === 0) {
				colour = C.brickRedLight;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, 0, ROOF, 64, 1, C.stoneLight);
	rect(layer, 0, ROOF + 1, 64, 1, C.stoneShade);
}

/**
 * Two chimney pots on the roofline against the sky.
 * @param {Canvas} canvas
 */
function drawChimneys(canvas) {
	for (const [x, h] of [
		[24, 6],
		[54, 4],
	]) {
		rect(canvas, x, ROOF - h, 5, h, C.brickRedShade);
		rect(canvas, x, ROOF - h, 1, h, C.brickRed);
		rect(canvas, x - 1, ROOF - h - 1, 7, 1, C.stone);
	}
}

/**
 * A heavy plank door with iron straps and a stone step, at the alley's far right.
 * @param {Canvas} canvas
 */
function drawDoor(canvas) {
	const left = 49;
	const right = 60;
	for (let y = 30; y < STREET - 1; y++) {
		for (let x = left; x <= right; x++) {
			const top = y < 33 && Math.hypot(x - 54.5, y - 33) > 6;
			if (top) {
				continue;
			}
			let colour = (x - left) % 3 === 2 ? C.timberShade : C.timber;
			if (y === 36 || y === 47) {
				colour = C.stoneShade;
			}
			set(canvas, x, y, colour);
		}
	}
	set(canvas, 51, 42, C.brass);
	rect(canvas, left - 2, STREET - 1, right - left + 5, 1, C.stone);
}

/**
 * The wall lantern: an iron bracket and a four-sided lantern with a little roof.
 * @param {Canvas} canvas
 */
function drawLantern(canvas) {
	const { x, y } = LAMP;
	// The bracket, out from the wall on the right.
	rect(canvas, x + 3, y - 6, 4, 1, C.stoneShade);
	rect(canvas, x + 6, y - 6, 1, 6, C.stoneShade);
	paint(
		canvas,
		x - 3,
		y - 6,
		[
			'...f...',
			'..fff..',
			'.fffff.',
			'f.....f',
			'f.....f',
			'f.....f',
			'f.....f',
			'fffffff',
			'..fff..',
		],
		{ f: C.lampFrame }
	);
}

/**
 * Lamplight: a warm glow around the lantern that spills down onto the street, the rest of the alley in deep night.
 * The sky keeps its own colours.
 * @param {Canvas} canvas
 * @param {boolean[]} sky - Which pixels are open sky
 */
function drawLamplight(canvas, sky) {
	const dark = C.nightSky1;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(canvas, x, y);
			if (!colour || colour === C.ink || sky[y * 64 + x]) {
				continue;
			}
			const dx = x - LAMP.x;
			const dy = y - LAMP.y;
			// The light spreads wider as it falls.
			const d =
				(dy < 0
					? Math.hypot(dx, dy * 1.6)
					: Math.hypot(dx * 1.1, dy * 0.6)) +
				((x + y) % 2) * 1.5;
			// A pool of light on the cobbles below the lantern.
			const pool =
				y >= STREET &&
				Math.hypot((x - LAMP.x + 5) / 15, (y - 58) / 5) < 1;
			if (pool) {
				set(canvas, x, y, mix(mix(colour, C.gold, 0.2), dark, 0.3));
			} else if (d < 7) {
				set(canvas, x, y, mix(colour, C.lampGlow, 0.35));
			} else if (d < 13) {
				set(canvas, x, y, mix(colour, C.gold, 0.12));
			} else if (d < 20) {
				set(canvas, x, y, mix(colour, dark, 0.45));
			} else if (d < 28) {
				set(canvas, x, y, mix(colour, dark, 0.62));
			} else {
				set(canvas, x, y, mix(colour, dark, 0.78));
			}
		}
	}
}

/**
 * The lantern's glowing glass, painted last so the night never dims it.
 * @param {Canvas} scene
 */
function drawGlass(scene) {
	const { x, y } = LAMP;
	rect(scene, x - 2, y - 3, 5, 4, C.gold);
	rect(scene, x - 1, y - 3, 3, 3, C.lampGlow);
	set(scene, x, y - 2, C.white);
}
