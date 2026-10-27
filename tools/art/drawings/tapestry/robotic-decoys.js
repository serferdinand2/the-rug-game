// Robotic Decoys: ranks of identical robots holding spears stand guard before a log fort at dusk, while the real soldiers peek over its wall.
import {
	createCanvas,
	get,
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
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the ground's first row, the palisade's foot, and the two ranks' feet. */
const HORIZON = 38;
const GROUND = 39;
const WALL_FOOT = 42;
const BACK_RANK = 51;
const FRONT_RANK = 62;

/** The palisade's left end and the top of its logs. */
const WALL_LEFT = 27;
const WALL_TOP = 22;

/**
 * The robot, front on, holding a spear in its right hand: a square riveted head with one glowing eye, a teal-tipped
 * antenna and ear bolts, a boxy body with a dial. T antenna tip, n neck and antenna, o rivet, k ear bolt, H head,
 * h head shade, r rim lit by the sunset, v eye socket, E eye, g mouth grille, B body, b body shade, p dial,
 * d dial light, a arm, L legs, F feet, s spear shaft, M spear head.
 */
const ROBOT = [
	'....T.....M',
	'....n.....M',
	'.oHHHHo...s',
	'.rHHHHh...s',
	'krvEEvhk..s',
	'.rHHHHh...s',
	'.oggggo...s',
	'...nn.....s',
	'.roBBBob..s',
	'arBpppBbaas',
	'arBpdpBba.s',
	'a.rBBBb...s',
	'...LL.LL..s',
	'...LL.LL..s',
	'..FFF.FFF.s',
];

/** A real soldier peeking over the wall: a round helmet with a red crest, and eyes. c crest, m helmet, M helmet lit, S skin, e eye. */
const PEEKER = ['...c..', '.mMMm.', 'mMMMMm', 'mmmmmm', 'SeSSeS', 'SSSSSS'];

/**
 * Draws the Robotic Decoys scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1187);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawTerrain(layer, { kind: 'grassland', top: GROUND, random });
	dusk(layer);

	// The fort and its hidden soldiers stand behind the robots, so they get their own outline.
	const fort = createCanvas(64, 64);
	drawPeekers(fort);
	drawPalisade(fort);
	drawTower(fort);
	outline(fort, C.ink);
	underlay(fort, layer);

	// Each rank gets its own outline, so the front rank stands clear of the one behind.
	const back = createCanvas(64, 64);
	for (let i = 0; i < 6; i++) {
		paint(
			back,
			2 + i * 11,
			BACK_RANK - ROBOT.length + 1,
			ROBOT,
			robotColours()
		);
	}
	outline(back, C.ink);
	underlay(back, fort);
	for (let i = 0; i < 6; i++) {
		paint(
			scene,
			-3 + i * 11,
			FRONT_RANK - ROBOT.length + 1,
			ROBOT,
			robotColours()
		);
	}
	outline(scene, C.ink);
	underlay(scene, back);
	return scene;
}

/**
 * The robots' colours: grey riveted steel warmed on the left by the setting sun, teal eyes and antenna tips, wooden spears.
 * @returns {Record<string, Colour>}
 */
function robotColours() {
	return {
		T: C.tealLight,
		n: C.stoneShade,
		o: C.stoneLight,
		k: C.brass,
		H: C.stone,
		h: C.stoneShade,
		v: C.night,
		E: C.tealLight,
		g: C.stoneShade,
		B: C.stone,
		b: C.stoneShade,
		r: mix(C.stoneLight, C.duskSky6, 0.45),
		p: C.brass,
		d: C.teal,
		a: C.stoneMid,
		L: C.stoneShade,
		F: C.roofShade,
		s: C.sandShade,
		M: C.stoneLight,
	};
}

/**
 * Dims the grass to the evening light, warmer near the horizon.
 * @param {Canvas} layer
 */
function dusk(layer) {
	for (let y = GROUND - 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const behind = get(layer, x, y);
			if (behind && y >= GROUND - 1 && !isSky(behind)) {
				set(layer, x, y, mix(behind, C.roof, 0.35));
			}
		}
	}
}

/**
 * Whether a colour belongs to the dusk sky, so the dimming leaves it alone.
 * @param {Colour} colour
 * @returns {boolean}
 */
function isSky(colour) {
	return [
		C.duskSky1,
		C.duskSky2,
		C.duskSky3,
		C.duskSky4,
		C.duskSky5,
		C.duskSky6,
		C.gold,
		C.lampGlow,
		C.starDim,
	].includes(colour);
}

/**
 * The palisade: sharpened logs from its left end to the scene's edge, lit on the left, with a dark gate.
 * @param {Canvas} canvas
 */
function drawPalisade(canvas) {
	for (let x = WALL_LEFT; x < 64; x++) {
		const i = x - WALL_LEFT;
		const top = WALL_TOP + (Math.floor(i / 3) % 2) + (i % 3 === 1 ? -1 : 0);
		for (let y = top; y <= WALL_FOOT; y++) {
			let colour =
				i % 3 === 0
					? C.timberLight
					: i % 3 === 1
						? C.timber
						: C.timberShade;
			if (y === 28 || y === 36) {
				colour = C.wood;
			}
			set(canvas, x, y, colour);
		}
	}
	rect(canvas, 34, 32, 8, 11, C.wood);
	line(canvas, 37, 32, 37, WALL_FOOT, C.timberShade);
}

/**
 * The watchtower at the right corner: a timber platform on posts with a pointed roof and a lit lookout.
 * @param {Canvas} canvas
 */
function drawTower(canvas) {
	for (let y = 14; y <= WALL_FOOT; y++) {
		for (let x = 46; x <= 57; x++) {
			let colour =
				x === 46 ? C.timberLight : x >= 56 ? C.timberShade : C.timber;
			if ((y - 14) % 6 === 0) {
				colour = C.wood;
			}
			set(canvas, x, y, colour);
		}
	}
	rect(canvas, 49, 17, 6, 3, C.gold);
	rect(canvas, 50, 18, 4, 1, C.amber);
	for (let r = 0; r < 7; r++) {
		for (let x = 44 + r; x <= 59 - r; x++) {
			set(
				canvas,
				x,
				13 - r,
				x <= 45 + r
					? C.brickRedLight
					: x >= 57 - r
						? C.brickRedShade
						: C.brickRed
			);
		}
	}
}

/**
 * The real army, hiding behind the wall: helmets and eyes peeping over the logs, spear tips showing between them.
 * @param {Canvas} canvas
 */
function drawPeekers(canvas) {
	/** @type {Record<string, Colour>} */
	const colours = {
		c: C.brickRed,
		m: C.stoneShade,
		M: C.stoneLight,
		S: C.skin,
		e: C.ink,
	};
	for (const x of [29, 40]) {
		paint(canvas, x, WALL_TOP - 6, PEEKER, colours);
	}
	for (const x of [36, 45]) {
		line(canvas, x, 15, x, WALL_TOP, C.timberShade);
		set(canvas, x, 14, C.stoneLight);
		set(canvas, x, 13, C.stoneLight);
	}
}
