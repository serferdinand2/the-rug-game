// Superpower Regulators: a caped hero held frozen in a teal containment field in a lab at night, scientists with clipboards at the monitors.
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
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The window's rows, the floor's first row, and the field's centre column and edges. */
const WINDOW = { top: 2, bottom: 25 };
const FLOOR = 47;
const CX = 32;
const FIELD = { left: 21, right: 43, top: 9, bottom: 50 };

/** The lab's steel, darkened for the night. */
const STEEL = mix(C.stoneShade, C.nightSky3, 0.45);
const STEEL_LIGHT = mix(C.stoneMid, C.nightSky3, 0.35);
const STEEL_DARK = mix(C.stoneShade, C.ink, 0.5);

/** A scientist in a white coat in profile, facing right, a clipboard held up to read. */
const SCIENTIST = [
	'..HHH...',
	'.HHHHH..',
	'.HHSgg..',
	'.HSSSS..',
	'..SSs...',
	'.WWWWW..',
	'WWWWWcp.',
	'WWWWWcpp',
	'WWWWScpp',
	'WWWWWcpp',
	'WWWWWW..',
	'WWWWWW..',
	'.WWWW...',
	'.LL.LL..',
	'.LL.LL..',
	'.BB.BBB.',
];

/**
 * Draws the Superpower Regulators scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(859);

	drawWall(layer);
	drawWindow(layer, random);
	drawFloor(layer);

	// The machine and the consoles stand behind the hero and the scientists.
	const machine = createCanvas(64, 64);
	drawEmitters(machine);
	drawConsole(machine, 0, 'wave');
	drawConsole(machine, 52, 'radar');
	outline(machine, C.ink);
	underlay(machine, layer);

	drawHero(scene);
	paint(scene, 10, 46, SCIENTIST, scientistColours(C.wood));
	paint(scene, 46, 46, SCIENTIST, scientistColours(C.amber), {
		mirror: true,
	});
	outline(scene, C.ink);
	underlay(scene, machine);

	drawField(scene);
	glow(scene, {
		x: CX,
		y: 30,
		radius: 34,
		colour: C.teal,
		strength: 0.4,
		steps: 5,
		skip: [C.ink, C.tealLight, C.white],
	});
	drawScreens(scene);
	return scene;
}

/**
 * The scientist's colours, with their own hair.
 * @param {Colour} hair
 * @returns {Record<string, Colour>}
 */
function scientistColours(hair) {
	return {
		H: hair,
		S: C.skin,
		s: C.skinShade,
		g: C.stoneLight,
		W: C.creamLight,
		c: C.timberLight,
		p: C.white,
		L: C.roofShade,
		B: C.wood,
	};
}

/**
 * The lab's back wall: steel panels with seams and rivets.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			const seam = x % 16 === 0 || y === 36;
			const rivet = (x % 16 === 2 || x % 16 === 14) && y % 6 === 3;
			set(layer, x, y, seam ? STEEL_DARK : rivet ? STEEL_LIGHT : STEEL);
		}
	}
}

/**
 * The long observation window: the city at night behind three tall panes.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindow(layer, random) {
	const { top, bottom } = WINDOW;
	const view = createCanvas(64, bottom - top + 1);
	drawSky(view, {
		time: 'night',
		horizon: view.h - 1,
		random,
		stars: 22,
		starRows: 12,
		moon: { x: 12, y: 6 },
	});
	drawSkyline(view, { base: view.h - 1, time: 'night', random, height: 11 });
	for (let y = top; y <= bottom; y++) {
		for (let x = 2; x <= 61; x++) {
			set(layer, x, y, view.p[(y - top) * 64 + x]);
		}
	}
	for (const x of [1, 2, 21, 42, 61, 62]) {
		rect(layer, x, top - 1, 1, bottom - top + 3, STEEL_LIGHT);
	}
	rect(layer, 1, top - 1, 62, 1, STEEL_LIGHT);
	rect(layer, 1, bottom + 1, 62, 1, STEEL_LIGHT);
	rect(layer, 1, bottom + 2, 62, 1, STEEL_DARK);
}

/**
 * The floor: dark steel plates in a grid, catching the field's light.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const depth = y - FLOOR;
			const seam = depth === 0 || depth % 6 === 5 || (x - CX) % 12 === 0;
			set(layer, x, y, seam ? STEEL_DARK : mix(STEEL, C.nightSky1, 0.2));
		}
	}
}

/**
 * The two emitters: a hood hanging from the ceiling and a round platform on the floor.
 * @param {Canvas} machine
 */
function drawEmitters(machine) {
	// The ceiling hood: a column down to a wide dish.
	rect(machine, CX - 4, 0, 9, 4, C.stoneShade);
	rect(machine, CX - 4, 0, 2, 4, C.stone);
	rect(machine, FIELD.left - 1, 4, FIELD.right - FIELD.left + 3, 2, C.stone);
	rect(
		machine,
		FIELD.left - 1,
		4,
		FIELD.right - FIELD.left + 3,
		1,
		C.stoneLight
	);
	rect(
		machine,
		FIELD.left + 1,
		6,
		FIELD.right - FIELD.left - 1,
		2,
		C.stoneShade
	);
	// The floor platform: a disc on a low drum.
	for (let y = FIELD.bottom - 3; y <= FIELD.bottom + 6; y++) {
		for (let x = FIELD.left - 3; x <= FIELD.right + 3; x++) {
			const d = ((x - CX) / 14) ** 2 + ((y - FIELD.bottom) / 3.5) ** 2;
			const drum =
				y > FIELD.bottom &&
				Math.abs(x - CX) <= 14 &&
				y <= FIELD.bottom + 5;
			if (d <= 1) {
				set(machine, x, y, d > 0.55 ? C.stone : C.stoneLight);
			} else if (drum) {
				set(machine, x, y, x > CX + 9 ? C.stoneShade : C.stoneMid);
			}
		}
	}
}

/**
 * A console at the side of the lab: a desk with a tilted monitor on an arm.
 * @param {Canvas} machine
 * @param {number} x - The console's leftmost column
 * @param {'wave' | 'radar'} kind - What its screen shows
 */
function drawConsole(machine, x, kind) {
	rect(machine, x, 40, 12, 3, C.stoneLight);
	rect(machine, x, 43, 12, 12, C.stoneShade);
	rect(machine, x + 1, 45, 10, 1, C.stone);
	for (const i of [2, 5, 8]) {
		set(machine, x + i, 41, kind === 'wave' ? C.brickRedLight : C.gold);
	}
	rect(machine, x + 5, 37, 2, 3, C.stoneShade);
	rect(machine, x, 27, 12, 10, C.stoneShade);
}

/**
 * The monitors' screens, lit after the glow so they stay crisp: a pulse trace and a radar sweep.
 * @param {Canvas} scene
 */
function drawScreens(scene) {
	for (const x of [1, 53]) {
		rect(scene, x, 28, 10, 8, C.tealShade);
	}
	// The left screen: a heartbeat trace across a dim grid.
	for (let i = 0; i < 10; i++) {
		set(scene, 1 + i, 31, mix(C.tealShade, C.teal, 0.4));
	}
	for (const [px, py] of [
		[1, 32],
		[2, 32],
		[3, 32],
		[4, 31],
		[4, 30],
		[5, 29],
		[5, 34],
		[6, 33],
		[6, 32],
		[7, 32],
		[8, 32],
		[9, 31],
		[10, 32],
	]) {
		set(scene, px, py, C.tealLight);
	}
	// The right screen: a radar ring with a filled sweep fading behind it, and two blips.
	for (let y = 28; y <= 35; y++) {
		for (let x = 53; x <= 62; x++) {
			const dx = (x - 57.5) / 4;
			const dy = (y - 31.5) / 3.6;
			const d = Math.hypot(dx, dy);
			const angle = Math.atan2(dy, dx);
			if (d > 0.8 && d <= 1.1) {
				set(scene, x, y, C.teal);
			} else if (d <= 0.8 && angle > -Math.PI / 2 && angle < 0) {
				set(
					scene,
					x,
					y,
					angle > -0.7 ? C.teal : mix(C.tealShade, C.teal, 0.5)
				);
			}
		}
	}
	set(scene, 55, 33, C.tealLight);
	set(scene, 59, 30, C.white);
}

/**
 * The hero, floating stiffly: a red cape spread behind, a blue suit with a gold diamond and belt,
 * a dark mask, red gloves and boots, arms held out from the sides.
 * @param {Canvas} scene
 */
function drawHero(scene) {
	const suit = C.daySea2;
	const suitLit = C.daySea1;
	const suitShade = C.daySea3;
	// The cape, flaring out behind the body.
	for (let y = 20; y <= 45; y++) {
		const half = 4 + Math.floor((y - 20) * 0.32);
		for (let x = CX - half; x <= CX + half; x++) {
			set(
				scene,
				x,
				y,
				x >= CX + half - 1 || (x - CX) % 4 === 2
					? C.brickRedShade
					: C.brickRed
			);
		}
	}
	// The arms, two pixels thick, held out and down.
	line(scene, CX - 4, 21, CX - 9, 30, suit);
	line(scene, CX - 5, 21, CX - 10, 30, suitLit);
	line(scene, CX + 4, 21, CX + 9, 30, suit);
	line(scene, CX + 5, 21, CX + 10, 30, suitShade);
	rect(scene, CX - 11, 30, 3, 3, C.brickRed);
	rect(scene, CX + 9, 30, 3, 3, C.brickRedShade);
	// The torso, waist, belt and legs.
	for (let y = 20; y <= 30; y++) {
		const half = y < 22 ? 4 : y < 27 ? 3 : 3;
		for (let x = CX - half; x <= CX + half; x++) {
			set(
				scene,
				x,
				y,
				x === CX - half
					? suitLit
					: x >= CX + half - 1
						? suitShade
						: suit
			);
		}
	}
	rect(scene, CX - 3, 30, 7, 1, C.gold);
	for (let y = 31; y <= 42; y++) {
		const boot = y >= 38;
		rect(scene, CX - 3, y, 3, 1, boot ? C.brickRed : suit);
		rect(scene, CX + 1, y, 3, 1, boot ? C.brickRedShade : suitShade);
	}
	set(scene, CX - 3, 31, suitLit);
	// The diamond on the chest.
	paint(scene, CX - 2, 22, ['..g..', '.ggg.', 'ggrgg', '.ggg.', '..g..'], {
		g: C.gold,
		r: C.brickRed,
	});
	// The head: dark hair, a dark mask with white eyes.
	paint(
		scene,
		CX - 3,
		12,
		[
			'..HHH..',
			'.HHHHH.',
			'.HSSSH.',
			'.kwkwk.',
			'.SSSSS.',
			'..SsS..',
			'...S...',
			'..SSS..',
		],
		{ H: C.wood, S: C.skin, s: C.skinShade, k: C.night, w: C.white }
	);
}

/**
 * The containment field: everything inside it turns faintly teal, with bright edges,
 * a glowing rim on each emitter and streaks of light running up through it.
 * @param {Canvas} scene
 */
function drawField(scene) {
	for (let y = FIELD.top; y <= FIELD.bottom - 2; y++) {
		for (let x = FIELD.left; x <= FIELD.right; x++) {
			const colour = scene.p[y * 64 + x];
			if (colour) {
				set(scene, x, y, mix(colour, C.tealLight, 0.22));
			}
		}
		for (const x of [FIELD.left, FIELD.right]) {
			set(scene, x, y, y % 3 === 0 ? C.white : C.tealLight);
		}
	}
	for (const [x, from, to] of [
		[FIELD.left + 3, 12, 22],
		[FIELD.left + 3, 34, 44],
		[FIELD.right - 3, 18, 28],
		[FIELD.right - 3, 38, 46],
	]) {
		for (let y = from; y <= to; y++) {
			set(
				scene,
				x,
				y,
				mix(scene.p[y * 64 + x] ?? C.teal, C.tealLight, 0.5)
			);
		}
	}
	// The emitters' glowing rims.
	rect(
		scene,
		FIELD.left + 1,
		8,
		FIELD.right - FIELD.left - 1,
		1,
		C.tealLight
	);
	for (let x = FIELD.left - 2; x <= FIELD.right + 2; x++) {
		const d = (x - CX) / 13;
		if (Math.abs(d) <= 1) {
			const y = Math.round(FIELD.bottom - Math.sqrt(1 - d * d) * 2.2);
			set(scene, x, y, C.tealLight);
			set(scene, x, 2 * FIELD.bottom - y, C.teal);
		}
	}
}
