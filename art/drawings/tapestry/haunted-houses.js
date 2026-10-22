// Haunted Houses: a crooked old house with a leaning tower on a hill, its windows glowing a sickly yellow, a sheet ghost and bats before a huge full moon.
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
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The full moon's centre and radius, and the row the house stands on. */
const MOON = { x: 43, y: 19, r: 14 };
const GROUND = 46;

/** The house's weathered boards: moonlit, plain and in shadow, and its slate roof. */
const BOARD_LIT = mix(C.stoneMid, C.roofLight, 0.5);
const BOARD = mix(C.roof, C.stoneShade, 0.45);
const BOARD_SHADE = mix(C.roofShade, C.ink, 0.3);
const SLATE = mix(C.roofShade, C.night, 0.4);
const SLATE_LIT = C.roofLight;

/** The windows' sickly light: a hot core, the pane and the glow it throws. */
const LIGHT_CORE = mix(C.lampGlow, C.ghost, 0.25);
const LIGHT = mix(C.gold, C.ghost, 0.45);
const LIGHT_DIM = mix(C.amber, C.ghostShade, 0.45);

/**
 * Draws the Haunted Houses scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1313);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 26,
		starRows: 30,
	});
	drawMoon(layer);
	drawFarHills(layer);

	drawHill(scene, random);
	drawHouse(scene);
	drawTower(scene);
	drawGhost(scene, 4, 18);
	outline(scene, C.ink);
	underlay(scene, layer);
	glow(scene, {
		x: 8,
		y: 23,
		radius: 10,
		colour: C.ghost,
		strength: 0.3,
		steps: 2,
		skip: [C.ghostLight, C.ghost, C.ghostShade, C.ink],
	});
	drawWindows(scene);
	drawPath(scene);
	drawFence(scene);
	drawBats(scene);
	return scene;
}

/**
 * A huge full moon with a pale halo and darker seas on its face.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	glow(layer, {
		x: cx,
		y: cy,
		radius: r + 9,
		colour: mix(C.moon, C.ghost, 0.3),
		strength: 0.3,
		steps: 3,
	});
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r) {
				continue;
			}
			const sea =
				Math.hypot(x - cx + 5, y - cy + 3) < 3.5 ||
				Math.hypot(x - cx - 4, y - cy - 5) < 2.6 ||
				Math.hypot(x - cx - 6, y - cy + 6) < 2;
			set(layer, x, y, d > r - 1 || sea ? C.moonRim : C.moon);
		}
	}
}

/**
 * Low hills on the skyline behind the house's hill.
 * @param {Canvas} layer
 */
function drawFarHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(44 + Math.sin(x * 0.12 + 1) * 2);
		for (let y = top; y < 64; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * The first row of the hill in each column: a rounded crown under the house, falling away to both sides.
 * @param {number} x
 * @returns {number}
 */
function hillTop(x) {
	return Math.round(GROUND + ((x - 28) / 22) ** 2 * 9);
}

/**
 * The hill: dark, dead grass, lit along its right shoulder by the moon, with pale tufts.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHill(scene, random) {
	const rim = mix(C.forestFloorLight, C.starDim, 0.35);
	const grass = mix(C.forestFloorShade, C.nightSky4, 0.45);
	const deep = mix(C.pineShade, C.ink, 0.45);
	for (let x = 0; x < 64; x++) {
		const top = hillTop(x);
		for (let y = top; y < 64; y++) {
			let colour = grass;
			if (y === top) {
				colour = x > 26 ? rim : grass;
			} else if (y > 56 || (y > 52 && (x + y) % 2 === 0)) {
				colour = deep;
			}
			set(scene, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = hillTop(x) + 2 + Math.floor(random() * 10);
		set(scene, x, y, mix(grass, rim, 0.5));
	}
}

/**
 * Paints one pixel of clapboard: boards two rows deep, the lower row of each in shadow,
 * moonlit on the right edge where the moon catches it.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} right - The wall's last column
 */
function board(scene, x, y, right) {
	let colour = y % 2 === 0 ? BOARD : BOARD_SHADE;
	if (x === right) {
		colour = BOARD_LIT;
	}
	set(scene, x, y, colour);
}

/**
 * The house: two crooked storeys under a steep sagging roof, a porch, a leaning chimney and a hanging shutter.
 * @param {Canvas} scene
 */
function drawHouse(scene) {
	const left = 9;
	const right = 33;
	// The walls lean a little to the left the higher they go.
	for (let y = 26; y <= GROUND; y++) {
		const lean = Math.round((GROUND - y) * -0.08);
		for (let x = left + lean; x <= right + lean; x++) {
			board(scene, x, y, right + lean);
		}
	}
	// The roof: a steep gable whose ridge sags in the middle, shingled, lit along its right slope.
	for (let y = 9; y <= 26; y++) {
		const half = Math.round((y - 9) * 0.82);
		const cx = 19 + Math.round((26 - y) * -0.06);
		for (let x = cx - half - 1; x <= cx + half + 1; x++) {
			let colour = SLATE;
			if (x >= cx + half) {
				colour = SLATE_LIT;
			} else if ((y + (x % 3 === 0 ? 1 : 0)) % 3 === 0) {
				colour = mix(SLATE, C.roof, 0.5);
			}
			set(scene, x, y, colour);
		}
	}
	// Eaves overhanging the walls.
	for (let x = left - 3; x <= right + 2; x++) {
		set(scene, x, 26, x > right ? SLATE_LIT : SLATE);
	}
	// A crooked chimney on the left slope.
	for (let y = 10; y <= 18; y++) {
		const lean = Math.round((18 - y) * -0.25);
		set(scene, 12 + lean, y, mix(C.brickRedShade, C.roofShade, 0.5));
		set(scene, 13 + lean, y, mix(C.brickRedShade, C.roofShade, 0.7));
		set(scene, 14 + lean, y, mix(C.brickRed, C.roofLight, 0.6));
	}
	rect(scene, 9, 9, 6, 1, mix(C.brickRedShade, C.roofShade, 0.7));
	// The porch: a little roof over the door on two thin posts.
	for (let x = 13; x <= 25; x++) {
		set(scene, x, 37, x > 23 ? SLATE_LIT : SLATE);
		if (x > 13 && x < 25) {
			set(scene, x, 36, SLATE);
		}
	}
	for (let y = 38; y <= GROUND; y++) {
		set(scene, 14, y, BOARD_LIT);
		set(scene, 24, y, BOARD_LIT);
	}
	// The door, ajar, dark inside.
	rect(scene, 17, 39, 4, 8, C.wood);
	rect(scene, 17, 39, 1, 8, C.ink);
	set(scene, 20, 43, C.brass);
	// Steps.
	rect(scene, 15, GROUND, 9, 1, BOARD_LIT);
	// The gable window's frame, the windows' frames and a shutter hanging by one hinge.
	for (const [x, y, w, h] of [
		[17, 16, 4, 5],
		[11, 29, 4, 5],
		[25, 29, 5, 5],
		[27, 38, 4, 5],
	]) {
		rect(scene, x - 1, y - 1, w + 2, h + 2, BOARD_LIT);
		rect(scene, x, y, w, h, C.ink);
	}
	line(scene, 9, 29, 7, 34, BOARD_SHADE);
	line(scene, 10, 29, 8, 34, BOARD);
	// Boards fallen away, showing the dark behind.
	for (const [x, y, w] of [
		[22, 32, 3],
		[11, 41, 2],
		[30, 27, 2],
	]) {
		rect(scene, x, y, w, 1, C.ink);
	}
}

/**
 * A round tower against the moon, leaning out to the right, with a tall witch's-hat spire and a crooked finial.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	for (let y = 14; y <= GROUND; y++) {
		const lean = Math.round((GROUND - y) * 0.13);
		const left = 34 + lean;
		const right = 41 + lean;
		for (let x = left; x <= right; x++) {
			let colour = y % 2 === 0 ? BOARD : BOARD_SHADE;
			if (x >= right - 1) {
				colour = BOARD_LIT;
			} else if (x === left) {
				colour = BOARD_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// A ring of trim under the spire.
	for (let x = 37; x <= 47; x++) {
		set(scene, x, 13, x >= 45 ? SLATE_LIT : SLATE);
	}
	// The spire: a tall cone, curling over at its tip.
	for (let j = 0; j < 12; j++) {
		const y = 12 - j;
		const half = Math.round(5.5 * (1 - j / 12));
		const cx = 42 + Math.round(j * 0.15);
		for (let x = cx - half; x <= cx + half; x++) {
			set(scene, x, y, x >= cx + half - 1 ? SLATE_LIT : SLATE);
		}
	}
	line(scene, 44, 0, 44, 1, SLATE);
	set(scene, 45, 0, SLATE_LIT);
	// The tower's arched window frame.
	rect(scene, 37, 18, 5, 7, BOARD_LIT);
	rect(scene, 38, 19, 3, 5, C.ink);
}

/**
 * Lights the windows with a sickly yellow-green glow, one with a dark figure standing in it,
 * and lets their light spill onto the boards around them.
 * @param {Canvas} scene
 */
function drawWindows(scene) {
	for (const [x, y, w, h] of [
		[17, 16, 4, 5],
		[11, 29, 4, 5],
		[25, 29, 5, 5],
		[27, 38, 4, 5],
		[38, 19, 3, 5],
	]) {
		glow(scene, {
			x: x + w / 2,
			y: y + h / 2,
			radius: 6,
			colour: LIGHT,
			strength: 0.3,
			steps: 2,
			skip: [C.ink],
		});
		for (let j = 0; j < h; j++) {
			for (let i = 0; i < w; i++) {
				const core = j > 0 && j < h - 1 && i > 0 && i < w - 1;
				set(scene, x + i, y + j, core ? LIGHT_CORE : LIGHT);
			}
		}
		// The window bars.
		for (let j = 0; j < h; j++) {
			set(scene, x + Math.floor(w / 2), y + j, LIGHT_DIM);
		}
		for (let i = 0; i < w; i++) {
			set(scene, x + i, y + Math.floor(h / 2), LIGHT_DIM);
		}
	}
	// A dark figure stands in the lower right window, watching.
	paint(scene, 28, 39, ['.kk.', 'kkkk', 'kkkk', 'kkkk'], { k: C.ink });
}

/**
 * The pale path winding down the hill from the steps.
 * @param {Canvas} scene
 */
function drawPath(scene) {
	const dirt = mix(C.sandShade, C.nightSky5, 0.5);
	const dirtLit = mix(C.sand, C.starDim, 0.45);
	for (let y = GROUND + 1; y < 64; y++) {
		const t = (y - GROUND) / (64 - GROUND);
		const cx = 19 + Math.round(Math.sin(t * 3.4) * 7 + t * 6);
		const half = 1 + Math.round(t * 3);
		for (let x = cx - half; x <= cx + half; x++) {
			set(scene, x, y, x === cx + half ? dirtLit : dirt);
		}
	}
}

/**
 * A broken iron fence along the foot of the hill, its railings leaning every which way.
 * @param {Canvas} scene
 */
function drawFence(scene) {
	const iron = mix(C.ink, C.roofShade, 0.5);
	for (const [x, lean, h] of [
		[2, 0, 8],
		[5, 1, 9],
		[8, 0, 8],
		[11, -1, 9],
		[36, 1, 9],
		[39, 0, 8],
		[42, -1, 7],
		[45, 0, 9],
		[49, 2, 8],
		[53, 0, 8],
		[57, -1, 9],
		[60, 0, 8],
	]) {
		line(scene, x, 63, x + lean, 63 - h, iron);
		set(scene, x + lean, 62 - h, C.roofLight);
	}
	line(scene, 0, 57, 12, 56, iron);
	line(scene, 35, 56, 62, 57, iron);
}

/**
 * A sheet ghost drifting beside the house, glowing pale green, its tail fading into the night.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawGhost(scene, x, y) {
	paint(
		scene,
		x,
		y,
		[
			'...LLL...',
			'..LLLLL..',
			'.LLLLLLG.',
			'.LeLLeLG.',
			'.LeLLeLG.',
			'LLLLLLLGG',
			'LLLLoLLGG',
			'LLLLLLGG.',
			'.LLLLLGG.',
			'.LGLLGLG.',
			'..L..G..G',
		],
		{ L: C.ghostLight, G: C.ghost, e: C.ink, o: C.ghostShade }
	);
}

/**
 * Bats flitting across the face of the moon.
 * @param {Canvas} scene
 */
function drawBats(scene) {
	for (const [x, y, flip] of /** @type {[number, number, boolean][]} */ ([
		[48, 9, false],
		[54, 21, true],
		[28, 6, false],
	])) {
		paint(
			scene,
			x,
			y,
			['k.....k', 'kk.k.kk', '.kkkkk.', '..k.k..'],
			{ k: C.ink },
			{ mirror: flip }
		);
	}
}
