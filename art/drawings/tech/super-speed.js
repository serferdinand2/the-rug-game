// Super Speed: a runner sprinting along a sandy road on a clear day, speed lines trailing behind and a puff of dust at the back foot.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The rows where the sky meets the far fields, the fields meet the road, and the runner's back toe meets the road. */
const ROWS = { horizon: 38, road: 43, ground: 55 };

/** The runner sprite's top-left corner on the card. */
const RUNNER = { x: 22, y: 13 };

/**
 * The runner, side on and facing right, mid-stride: head up, body leaning into the run,
 * the front arm bent with the fist at the chin and the back arm swung behind the hip,
 * the front thigh raised level with the foot flexed and the back leg driving off its toes.
 * Upper case is lit, lower case is the base, and the third key of each material is its shade.
 */
const SPRITE = [
	'...............................',
	'..................kkkkk........',
	'................kkkkkkkk.......',
	'............kkkkkkkkkkSSS......',
	'.........KKkkkkkkkkkSsoss......',
	'.............kkkkkkzssssss.....',
	'.................kssssssz......',
	'..................sssssz.......',
	'...................zssz....FFF.',
	'..................szz.....Ffffx',
	'................SSSsz.....Ffffx',
	'..............RSSSSsRR.....xxx.',
	'.............SSsssszrrq....Fx..',
	'...........SSssssszrrrq...Ffx..',
	'.........SSssssszrrrrrqF..Ffx..',
	'........SsssszrrrrrrrqFf.Ffx...',
	'.......SssszRrrrrrrrrqfffFfx...',
	'.......Sssz.Rrrrrrrrrq.fffx....',
	'......Sssz..Rrrrrrrrq...xx.....',
	'......Sssz.Rrrrrrrrrq..........',
	'.....Ssssz.qqqqqqqqq...........',
	'.....Sssz..BbbbbbbbbnSSSS......',
	'......zz..BbbbbbbbbbnsssssS....',
	'..........Bbbbbbbbbbnsssssz....',
	'..........Bbbbbbbbbnnsssssz....',
	'...........nnnnnnn....zzzsz....',
	'..........Fffffx.......Sssz....',
	'..........Ffffx........Sssz....',
	'..........Ffffx........Sssz....',
	'.........Ffffx........Sssz.....',
	'.........Ffffx........Sssz.....',
	'........Ffffx.........Sssz.....',
	'........Ffffx.........WWWW.WW..',
	'......FFfffx..........WwwwwwW..',
	'....FFfffx............ggggggg..',
	'...Ffffxx......................',
	'..Ffffx........................',
	'.Fffx..........................',
	'.Wwwg..........................',
	'..Wwg..........................',
	'..Wwwg.........................',
	'...Wwwg........................',
	'...ggggg.......................',
];

/** The runner's colours: deep skin, nearer limbs lit and farther limbs in shade, a red vest, dark shorts, white shoes. */
const RUNNER_COLOURS = {
	o: C.ink,
	K: C.timberShade,
	k: C.wood,
	S: mix(C.skinDeep, C.skinTan, 0.45),
	s: C.skinDeep,
	z: C.skinDeepShade,
	F: C.skinDeep,
	f: mix(C.skinDeep, C.skinDeepShade, 0.55),
	x: C.skinDeepShade,
	R: C.brickRedLight,
	r: C.brickRed,
	q: C.brickRedShade,
	B: C.roofLight,
	b: C.roof,
	n: C.roofShade,
	W: C.white,
	w: C.cloudShade,
	g: C.stoneLight,
};

/** The sky, from the top down. */
const SKY = [C.daySky2, C.daySky3, C.daySky4, C.daySky5, C.daySky6];

/** The far fields, hazy with distance. */
const FIELD = mix(C.grass, C.daySky5, 0.4);
const FIELD_FAR = mix(C.grassLight, C.daySky6, 0.55);

/** The speed lines: pale wind, and streaks of the vest's red. */
const STREAK = C.white;
const STREAK_FADE = mix(C.white, C.daySky4, 0.5);
const STREAK_RED = mix(C.brickRedLight, C.white, 0.25);
const STREAK_RED_FADE = mix(C.brickRedLight, C.daySky5, 0.55);

/**
 * Draws the Super Speed tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5281);

	drawSky(layer);
	drawFields(layer);
	drawRoad(layer, random);

	paint(scene, RUNNER.x, RUNNER.y, SPRITE, RUNNER_COLOURS);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawSpeedLines(scene);
	drawDust(scene);
	return scene;
}

/**
 * The clear day sky in plain bands, palest at the horizon.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= ROWS.horizon; y++) {
		const band = Math.min(
			SKY.length - 1,
			Math.floor((y / (ROWS.horizon + 1)) * SKY.length)
		);
		rect(layer, 0, y, 64, 1, SKY[band]);
	}
}

/**
 * A low strip of far fields between the sky and the road.
 * @param {Canvas} layer
 */
function drawFields(layer) {
	rect(layer, 0, ROWS.horizon + 1, 64, ROWS.road - ROWS.horizon - 1, FIELD);
	rect(layer, 0, ROWS.horizon + 1, 64, 1, FIELD_FAR);
}

/**
 * The sandy road: a shaded far edge, a lit band, plain sand, a few pebbles and the runner's shadow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoad(layer, random) {
	rect(layer, 0, ROWS.road, 64, 64 - ROWS.road, C.sand);
	rect(layer, 0, ROWS.road, 64, 1, C.sandShade);
	rect(layer, 0, ROWS.road + 1, 64, 1, C.sandLight);
	for (let i = 0; i < 8; i++) {
		const x = Math.floor(random() * 64);
		const y = ROWS.road + 3 + Math.floor(random() * (64 - ROWS.road - 3));
		set(layer, x, y, C.sandShade);
	}
	// The runner's shadow, short under the high sun.
	rect(layer, 26, ROWS.ground + 1, 26, 1, C.sandShade);
	rect(layer, 30, ROWS.ground + 2, 18, 1, C.sandShade);
}

/**
 * Finds the runner's trailing edge on a row: the first painted column from the left, outline included.
 * @param {Canvas} scene
 * @param {number} y
 * @returns {number} The column, or 64 when the row holds none of the runner.
 */
function trailingEdge(scene, y) {
	for (let x = 0; x < 64; x++) {
		const colour = get(scene, x, y);
		if (
			colour === C.ink ||
			Object.values(RUNNER_COLOURS).includes(colour ?? '')
		) {
			return x;
		}
	}
	return 64;
}

/**
 * Horizontal speed lines trailing behind the runner, each stopping short of the runner's back,
 * bright near the runner and fading at the tail.
 * @param {Canvas} scene
 */
function drawSpeedLines(scene) {
	/** @type {[number, number, boolean][]} The row, the length and whether the line is red. */
	const lines = [
		[17, 12, false],
		[23, 16, true],
		[28, 14, false],
		[33, 18, true],
		[38, 13, false],
		[46, 11, true],
	];
	for (const [y, length, red] of lines) {
		const end = trailingEdge(scene, y) - 3;
		const start = Math.max(0, end - length);
		const fade = Math.max(start, start + Math.floor(length * 0.35));
		rect(
			scene,
			start,
			y,
			fade - start,
			1,
			red ? STREAK_RED_FADE : STREAK_FADE
		);
		rect(scene, fade, y, end - fade, 1, red ? STREAK_RED : STREAK);
	}
}

/**
 * A small puff of dust kicked up behind the back foot.
 * @param {Canvas} scene
 */
function drawDust(scene) {
	paint(
		scene,
		RUNNER.x - 8,
		ROWS.ground - 4,
		['.....LL..', '..LL.Ldd.', '.LddLdddD', 'LdddddDD.', '.DDDDD...'],
		{ L: C.creamLight, d: C.cream, D: C.sandLight }
	);
}
