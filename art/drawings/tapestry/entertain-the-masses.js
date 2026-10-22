// Entertain the Masses: a juggler in motley tossing balls high above a stage in a crowded square strung with bunting at dusk.
import {
	createCanvas,
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
import { drawSkyline } from '../../parts/skyline.js';
import { drawStreet } from '../../parts/street.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The square's far side, and the stage: its boards' row and its first and last columns. */
const SQUARE = 46;
const STAGE = 46;
const STAGE_LEFT = 11;
const STAGE_RIGHT = 52;

/** The backdrop's posts and its top row. */
const POST_LEFT = 16;
const POST_RIGHT = 47;
const DROP_TOP = 10;

/** The juggler's top-left pixel: the sprite stands with its feet on the boards. */
const JUGGLER_X = 25;
const JUGGLER_Y = STAGE - 22;

/** The bunting's two ends and how far it sags in the middle. */
const BUNTING = { x0: 5, y0: 2, x1: 57, y1: 6, sag: 2 };

/**
 * The juggler, facing us with both arms flung up: a jester's two-pointed cap with bells, a white
 * ruff, and motley split down the middle, red on one side and gold on the other.
 */
const JUGGLER = [
	'..y.........y..',
	'..rr.......dd..',
	'...rr.....dd...',
	'....rr...dd....',
	'.....rrrddd....',
	'.....SSSSS.....',
	'S....SSSSS....S',
	'a....sSSSs....b',
	'.a....sSs....b.',
	'..a.wwwwwww.b..',
	'...arrrrdddb...',
	'....rrrrddd....',
	'....rrryddd....',
	'....rrrrddd....',
	'....rrryddd....',
	'....kkkkkkk....',
	'....rrr.ddd....',
	'....rrr.ddd....',
	'....rr...dd....',
	'...rr.....dd...',
	'...rr.....dd...',
	'..kkk.....kkk..',
];

/**
 * Draws the Entertain the Masses scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7505);

	drawSky(layer, { time: 'dusk', horizon: SQUARE, random });
	drawSkyline(layer, { base: SQUARE, time: 'dusk', random, height: 14 });
	drawStreet(layer, { top: SQUARE + 1 });

	const houses = createCanvas(64, 64);
	drawTimberHouse(houses);
	drawGableHouse(houses);
	outline(houses, C.ink);

	drawBackdrop(scene);
	drawStage(scene);
	paint(scene, JUGGLER_X, JUGGLER_Y, JUGGLER, {
		y: C.gold,
		r: C.brickRedLight,
		d: C.gold,
		S: C.skin,
		s: C.skinShade,
		a: C.brickRedLight,
		b: C.gold,
		w: C.white,
		k: C.ink,
	});
	drawBalls(scene);
	drawCrowd(scene, { x: -2, y: 64, count: 17, random });
	outline(scene, C.ink);
	underlay(scene, houses);
	underlay(scene, layer);
	drawBunting(scene);
	drawLights(scene);
	return scene;
}

/**
 * A tall timber-framed house on the left: cream panels between dark beams, a lit window on each floor.
 * @param {Canvas} canvas
 */
function drawTimberHouse(canvas) {
	const wall = mix(C.cream, C.duskSky4, 0.25);
	const wallShade = mix(C.creamShade, C.duskSky3, 0.35);
	for (let y = 10; y <= SQUARE; y++) {
		for (let x = 0; x <= 10; x++) {
			let colour = x >= 9 ? wallShade : wall;
			if (y % 9 === 0 || x === 0 || x === 5 || x === 10) {
				colour = C.timberShade;
			} else if ((y % 9) - 1 === x % 5 || (y % 9) - 1 === 5 - (x % 5)) {
				colour = C.timber;
			}
			set(canvas, x, y, colour);
		}
	}
	// The gable roof, its peak off the scene's left edge.
	for (let y = 0; y < 10; y++) {
		for (let x = 0; x <= Math.min(12, 3 + y); x++) {
			set(canvas, x, y, x >= 2 + y ? C.roofShade : C.roof);
		}
	}
	for (const wy of [13, 22, 31]) {
		rect(canvas, 2, wy, 2, 3, C.gold);
		rect(canvas, 7, wy, 2, 3, C.gold);
		set(canvas, 2, wy, C.lampGlow);
		set(canvas, 7, wy, C.lampGlow);
	}
	rect(canvas, 6, SQUARE - 5, 3, 5, C.wood);
}

/**
 * A brick house with a stepped gable on the right, its windows lit.
 * @param {Canvas} canvas
 */
function drawGableHouse(canvas) {
	const left = 53;
	for (let y = 4; y <= SQUARE; y++) {
		const step = Math.max(0, Math.floor((14 - y) / 3) * 2);
		for (let x = left + Math.min(step, 8); x < 64; x++) {
			let colour = x === left ? C.brickRedLight : C.brickRed;
			if (y % 3 === 0 || (x + Math.floor(y / 3) * 2) % 5 === 0) {
				colour = C.brickRedShade;
			}
			set(canvas, x, y, mix(colour, C.duskSky2, 0.3));
		}
	}
	for (const wy of [16, 26, 36]) {
		for (const wx of [56, 60]) {
			rect(canvas, wx, wy, 2, 4, C.gold);
			set(canvas, wx, wy, C.lampGlow);
		}
	}
}

/**
 * The backdrop: two posts, a deep purple curtain hanging in folds, and a gold-fringed valance.
 * @param {Canvas} scene
 */
function drawBackdrop(scene) {
	for (let y = DROP_TOP + 3; y < STAGE; y++) {
		for (let x = POST_LEFT + 1; x < POST_RIGHT; x++) {
			const fold = (x - POST_LEFT) % 4;
			const colour =
				fold === 0 ? C.roofShade : fold === 1 ? C.roofLight : C.roof;
			set(scene, x, y, colour);
		}
	}
	for (let x = POST_LEFT; x <= POST_RIGHT; x++) {
		set(scene, x, DROP_TOP, C.gold);
		set(scene, x, DROP_TOP + 1, C.brickRed);
		set(
			scene,
			x,
			DROP_TOP + 2,
			(x - POST_LEFT) % 4 < 2 ? C.brickRed : C.brickRedShade
		);
		if ((x - POST_LEFT) % 4 === 1 || (x - POST_LEFT) % 4 === 2) {
			set(scene, x, DROP_TOP + 3, C.brickRed);
			set(scene, x, DROP_TOP + 4, C.gold);
		}
	}
	for (const px of [POST_LEFT, POST_RIGHT]) {
		rect(scene, px, DROP_TOP - 2, 1, STAGE - DROP_TOP + 2, C.timber);
		set(scene, px, DROP_TOP - 3, C.gold);
	}
}

/**
 * The stage: lit boards on trestles, its front hung with a striped skirt.
 * @param {Canvas} scene
 */
function drawStage(scene) {
	rect(
		scene,
		STAGE_LEFT,
		STAGE,
		STAGE_RIGHT - STAGE_LEFT + 1,
		1,
		C.timberLight
	);
	rect(
		scene,
		STAGE_LEFT,
		STAGE + 1,
		STAGE_RIGHT - STAGE_LEFT + 1,
		1,
		C.timberShade
	);
	for (let y = STAGE + 2; y <= STAGE + 7; y++) {
		for (let x = STAGE_LEFT; x <= STAGE_RIGHT; x++) {
			const stripe = Math.floor((x - STAGE_LEFT) / 3) % 2;
			let colour = stripe ? C.cream : C.brickRed;
			if (y === STAGE + 7 && (x - STAGE_LEFT) % 3 === 1) {
				colour = C.gold;
			} else if (y === STAGE + 7) {
				continue;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The juggled balls, high in a fountain over the juggler's head, from one raised hand to the other.
 * @param {Canvas} scene
 */
function drawBalls(scene) {
	const colours = [C.daySea1, C.pineLight, C.white, C.brickRedLight, C.gold];
	const left = JUGGLER_X;
	const right = JUGGLER_X + 14;
	const hands = JUGGLER_Y + 6;
	[0.08, 0.3, 0.52, 0.74, 0.94].forEach((t, i) => {
		const x = Math.round(left - 3 + (right - left + 6) * t);
		const y = Math.round(hands - 3 - Math.sin(Math.PI * t) * 11);
		rect(scene, x - 1, y - 1, 2, 2, colours[i]);
	});
}

/**
 * The bunting across the square: a sagging cord hung with small pennants in turn. Drawn after
 * the outline, so the cord and flags stay fine.
 * @param {Canvas} scene
 */
function drawBunting(scene) {
	const { x0, y0, x1, y1, sag } = BUNTING;
	const colours = [C.brickRedLight, C.gold, C.daySea1, C.cream, C.pineLight];
	/**
	 * The cord's row at a column.
	 * @param {number} x
	 * @returns {number}
	 */
	const cord = (x) => {
		const t = (x - x0) / (x1 - x0);
		return Math.round(y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag);
	};
	for (let x = x0; x <= x1; x++) {
		set(scene, x, cord(x), C.ink);
	}
	for (let x = x0 + 2, i = 0; x < x1 - 1; x += 4, i++) {
		const y = cord(x) + 1;
		const colour = colours[i % colours.length];
		rect(scene, x - 1, y, 3, 1, colour);
		rect(scene, x - 1, y + 1, 3, 1, colour);
		set(scene, x, y + 2, colour);
		set(scene, x + 1, y + 1, mix(colour, C.ink, 0.25));
	}
}

/**
 * The lamps on the two houses and the stage's footlights, warming everything near them.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	for (const [lx, ly] of [
		[10, 27],
		[53, 27],
	]) {
		rect(scene, lx - 1, ly - 1, 3, 1, C.ink);
		rect(scene, lx, ly, 1, 2, C.lampGlow);
		set(scene, lx, ly + 2, C.ink);
		glow(scene, {
			x: lx,
			y: ly,
			radius: 7,
			colour: C.gold,
			strength: 0.4,
			steps: 2,
			skip: [C.lampGlow, C.ink],
		});
	}
	for (let x = STAGE_LEFT + 3; x < STAGE_RIGHT; x += 8) {
		set(scene, x, STAGE - 1, C.lampGlow);
	}
	glow(scene, {
		x: 32,
		y: STAGE,
		radius: 16,
		colour: C.gold,
		strength: 0.25,
		steps: 3,
		skip: [C.lampGlow, C.ink, C.white, C.gold],
	});
}
