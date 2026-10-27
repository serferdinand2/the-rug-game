// Elder Ones: an ancient hooded being with a beard of tentacles and glowing eyes, its claw on a glowing hourglass, in a sunken temple at night.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 29;

/** The hourglass: its centre column, top row and bottom row. */
const GLASS = { x: 50, top: 33, bottom: 51 };

/** The water's first row across the flooded floor. */
const WATER = 56;

/** Grey-green hide: lit gold by the hourglass on its left, plain, shaded and in the hood's deep shadow. */
const HIDE = {
	glint: mix(C.ghostShade, C.gold, 0.45),
	lit: mix(mix(C.stone, C.ghostShade, 0.5), C.gold, 0.25),
	base: mix(C.stoneShade, C.ghostShade, 0.45),
	shade: mix(C.stoneShade, C.night, 0.35),
	dark: mix(C.stoneShade, C.night, 0.65),
};

/** The tentacles: mauve, lit by the hourglass, with pale suckers. */
const TENTACLE = {
	lit: mix(C.arcane, C.brickRedLight, 0.45),
	base: mix(C.arcaneShade, C.brickRed, 0.4),
	shade: mix(C.arcaneShade, C.night, 0.35),
	sucker: mix(C.arcaneLight, C.creamLight, 0.4),
};

/** The hooded robe: deep wine, lit gold along the hourglass's side. */
const ROBE = {
	lit: mix(C.brickRedShade, C.gold, 0.16),
	base: mix(C.brickRedShade, C.roofShade, 0.45),
	shade: mix(mix(C.brickRedShade, C.roofShade, 0.6), C.night, 0.35),
	dark: mix(C.roofShade, C.night, 0.55),
};

/** The glowing eyes and the glowing sand, which the glows leave alone. */
const LIGHTS = [C.ghostLight, C.ghost, C.white, C.lampGlow, C.gold, C.amber];

/** The figure is lit by hand, so the glows leave it as painted. */
const FIGURE = [
	...Object.values(HIDE),
	...Object.values(TENTACLE),
	...Object.values(ROBE),
	C.ink,
];

/**
 * Draws the Elder Ones portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8417);

	drawInterior(layer, { floor: WATER, random, wall: 'stone' });
	drownRoom(layer);
	drawColumn(layer, 3, 7, false);
	drawColumn(layer, 57, 6, true);
	drawWeed(layer, random);
	drawWater(layer, random);

	// The hooded robe and face first, then the tentacles over the chest, then the hourglass, its plinth and the claw.
	const figure = createCanvas(64, 64);
	drawRobe(figure);
	drawHead(figure);
	outline(figure, C.ink);
	// The beard in two rows, each outlined, so the front tentacles stand clear of the ones behind.
	const back = createCanvas(64, 64);
	drawTentacles(
		back,
		[
			[FACE_X - 6, 14, -1],
			[FACE_X - 1, 24, -1],
			[FACE_X + 4, 22, 1],
		],
		0
	);
	outline(back, C.ink);
	underlay(back, figure);
	const beard = createCanvas(64, 64);
	drawTentacles(
		beard,
		[
			[FACE_X - 4, 19, -1],
			[FACE_X + 1, 26, 1],
			[FACE_X + 6, 15, 1],
		],
		2
	);
	outline(beard, C.ink);
	underlay(beard, back);

	drawPlinth(scene);
	drawHourglass(scene);
	drawClaw(scene);
	outline(scene, C.ink);
	underlay(scene, beard);
	underlay(scene, layer);

	glow(scene, {
		x: GLASS.x,
		y: 42,
		radius: 26,
		colour: C.gold,
		strength: 0.35,
		steps: 4,
		skip: [...LIGHTS, ...FIGURE],
	});
	glow(scene, {
		x: FACE_X,
		y: 14,
		radius: 9,
		colour: C.ghost,
		strength: 0.3,
		steps: 2,
		skip: [...LIGHTS, ...FIGURE],
	});
	drawEyes(scene);
	drawSand(scene);
	return scene;
}

/**
 * Turns the stone room to a drowned temple at night: dark, and tinged with the green of the deep.
 * @param {Canvas} layer
 */
function drownRoom(layer) {
	const deep = mix(C.tealShade, C.night, 0.55);
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, deep, 0.78);
		}
	}
}

/**
 * A fluted stone column, standing or broken off, dark and green with age.
 * @param {Canvas} layer
 * @param {number} x - The shaft's left column
 * @param {number} width
 * @param {boolean} broken - Whether its top has broken away
 */
function drawColumn(layer, x, width, broken) {
	const light = mix(C.stone, C.tealShade, 0.55);
	const main = mix(C.stoneShade, C.tealShade, 0.5);
	const dark = mix(C.stoneShade, C.night, 0.55);
	const top = broken ? 14 : 0;
	for (let y = top; y < WATER; y++) {
		for (let i = 0; i < width; i++) {
			let colour = i % 2 === 0 ? main : dark;
			if (i === 1) {
				colour = light;
			}
			if (broken && y < top + 3 && (i + y) % 3 === 0) {
				continue;
			}
			set(layer, x + i, y, mix(colour, C.night, 0.35));
		}
	}
	if (!broken) {
		rect(layer, x - 1, 8, width + 2, 2, mix(light, C.night, 0.35));
	}
	rect(layer, x - 1, WATER - 2, width + 2, 2, mix(main, C.night, 0.3));
}

/**
 * Weed hanging from the roof and clinging to the columns, swaying.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWeed(layer, random) {
	const weed = mix(C.forestFloorShade, C.night, 0.3);
	const weedLit = mix(C.forestFloor, C.tealShade, 0.4);
	for (const x0 of [2, 15, 42, 60]) {
		const length = 8 + Math.floor(random() * 10);
		for (let y = 0; y < length; y++) {
			const x = x0 + Math.round(Math.sin(y * 0.6 + x0) * 1);
			set(layer, x, y, y % 4 === 0 ? weedLit : weed);
		}
	}
}

/**
 * The black water flooding the floor, with faint ripples.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWater(layer, random) {
	for (let y = WATER; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				y === WATER
					? mix(C.tealShade, C.night, 0.4)
					: mix(C.tealShade, C.night, 0.7)
			);
		}
	}
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 60);
		const y = WATER + 1 + Math.floor(random() * 7);
		rect(layer, x, y, 3, 1, mix(C.teal, C.night, 0.55));
	}
}

/**
 * The hooded robe: a deep pointed hood shadowing the face, and heavy folds falling to the water.
 * @param {Canvas} scene
 */
function drawRobe(scene) {
	// The robe below the hood, widening to the bottom.
	for (let y = 24; y < 64; y++) {
		const half = Math.min(26, 13 + Math.round((y - 24) * 1.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = ROBE.base;
			if (u > 0.8) {
				colour = ROBE.lit;
			} else if (u < -0.6) {
				colour = ROBE.dark;
			} else if (u < -0.2) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds.
	for (let y = 34; y < 64; y++) {
		set(scene, FACE_X - 9 - Math.round((y - 34) * 0.3), y, ROBE.dark);
		set(scene, FACE_X + 10 + Math.round((y - 34) * 0.3), y, ROBE.shade);
	}
	// The hood: a tall rounded point, open at the front.
	for (let y = 0; y <= 30; y++) {
		const half = y < 4 ? 4 + y * 1.6 : Math.min(14, 10 + (y - 4) * 0.35);
		for (
			let x = Math.floor(FACE_X - half);
			x <= Math.ceil(FACE_X + half);
			x++
		) {
			const u = (x - FACE_X) / half;
			if (Math.abs(u) > 1) {
				continue;
			}
			let colour = ROBE.base;
			if (u > 0.8) {
				colour = ROBE.lit;
			} else if (u < -0.65) {
				colour = ROBE.dark;
			} else if (u < -0.25) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The opening of the hood, deep in shadow.
	for (let y = 6; y <= 27; y++) {
		const half =
			y < 10 ? 3 + (y - 6) * 1.4 : Math.min(9, 8.5 + (y - 10) * 0.1);
		for (
			let x = Math.floor(FACE_X - half);
			x <= Math.ceil(FACE_X + half);
			x++
		) {
			if (Math.abs(x - FACE_X) <= half) {
				set(scene, x, y, HIDE.dark);
			}
		}
	}
	// A tarnished gold band along the hood's edge.
	for (let y = 6; y <= 30; y++) {
		const half =
			y < 10 ? 3 + (y - 6) * 1.4 : Math.min(9, 8.5 + (y - 10) * 0.1);
		set(
			scene,
			Math.floor(FACE_X - half) - 1,
			y,
			mix(C.brass, C.night, 0.45)
		);
		set(scene, Math.ceil(FACE_X + half) + 1, y, C.brass);
	}
}

/**
 * The ancient face in the hood's shadow: a heavy, ridged brow, deep sockets for its glowing eyes,
 * and slits for a nose; lit gold from below on the hourglass's side.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -4, 4],
		[11, -5, 5],
		[12, -6, 6],
		[13, -6, 6],
		[14, -6, 6],
		[15, -6, 6],
		[16, -6, 6],
		[17, -6, 6],
		[18, -5, 6],
		[19, -5, 5],
		[20, -5, 5],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = HIDE.base;
			if (dx === to && dx >= 5) {
				colour = HIDE.glint;
			} else if (dx >= 2) {
				colour = HIDE.lit;
			} else if (dx === from) {
				colour = HIDE.dark;
			} else if (dx <= -2) {
				colour = HIDE.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Wrinkles across the brow, and the heavy ridge over the eyes.
	rect(scene, FACE_X - 3, 11, 3, 1, HIDE.shade);
	rect(scene, FACE_X + 1, 11, 3, 1, HIDE.base);
	rect(scene, FACE_X - 5, 13, 4, 1, HIDE.shade);
	rect(scene, FACE_X + 1, 13, 4, 1, HIDE.glint);
	// The sockets.
	rect(scene, FACE_X - 5, 14, 4, 2, HIDE.dark);
	rect(scene, FACE_X + 1, 14, 4, 2, HIDE.dark);
	// Nose slits.
	set(scene, FACE_X - 1, 17, C.ink);
	set(scene, FACE_X + 1, 17, C.ink);
	rect(scene, FACE_X, 16, 1, 2, HIDE.lit);
	// The cheeks folding into the beard.
	set(scene, FACE_X - 4, 18, HIDE.dark);
	set(scene, FACE_X + 4, 18, HIDE.base);
}

/**
 * A row of tentacles hanging from the face over the chest, writhing, tapering and curling at their ends,
 * with pale suckers along their lit sides.
 * @param {Canvas} scene
 * @param {[number, number, number][]} tentacles - Each one's root column, length and curl direction
 * @param {number} seed - Shifts the writhing, so the two rows move apart
 */
function drawTentacles(scene, tentacles, seed) {
	tentacles.forEach(([x0, length, curl], n) => {
		let last = { x: x0, y: 19 };
		for (let i = 0; i <= length; i++) {
			const t = i / length;
			const y = 19 + i;
			const x = Math.round(
				x0 +
					Math.sin(i * 0.38 + n * 1.7 + seed) * 2.2 * t +
					curl * t * 2
			);
			const thick = t < 0.35 ? 3 : t < 0.75 ? 2 : 1;
			for (let k = 0; k < thick; k++) {
				const lit = x + k >= FACE_X;
				let colour = TENTACLE.base;
				if (k === thick - 1 && lit) {
					colour = TENTACLE.lit;
				} else if (k === 0 && !lit) {
					colour = TENTACLE.shade;
				}
				if (thick > 1 && k === thick - 1 && i % 3 === 2) {
					colour = TENTACLE.sucker;
				}
				set(scene, x + k, y, colour);
			}
			last = { x, y };
		}
		// The tip curls up and round.
		paint(
			scene,
			curl > 0 ? last.x : last.x - 2,
			last.y - 2,
			curl > 0 ? ['.ll', '..b', 'bb.'] : ['ll.', 'b..', '.bb'],
			{
				l: TENTACLE.lit,
				b: TENTACLE.base,
			}
		);
	});
}

/**
 * A broken stone plinth at the bottom right, standing in the water, the hourglass on it.
 * @param {Canvas} scene
 */
function drawPlinth(scene) {
	const light = mix(C.stone, C.tealShade, 0.35);
	const main = mix(C.stoneShade, C.tealShade, 0.35);
	const dark = mix(C.stoneShade, C.night, 0.5);
	for (let y = GLASS.bottom + 1; y < 64; y++) {
		for (let x = 42; x <= 58; x++) {
			let colour = main;
			if (y === GLASS.bottom + 1) {
				colour = light;
			} else if (x > 55) {
				colour = dark;
			} else if (x < 44) {
				colour = light;
			}
			if ((x + y * 2) % 9 === 0) {
				colour = dark;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The hourglass: a brass frame of two discs and three posts round a glass whose waist pinches in.
 * @param {Canvas} scene
 */
function drawHourglass(scene) {
	const { x: cx, top, bottom } = GLASS;
	const glassPane = mix(C.ghostShade, C.night, 0.25);
	const middle = (top + bottom) / 2;
	for (let y = top + 2; y <= bottom - 2; y++) {
		const t = Math.abs(y - middle) / (middle - top - 2);
		const half = Math.max(1, Math.round(5 * t ** 0.9));
		for (let x = cx - half; x <= cx + half; x++) {
			set(
				scene,
				x,
				y,
				x === cx - half ? mix(C.ghost, C.night, 0.2) : glassPane
			);
		}
	}
	// The frame: discs top and bottom, and posts at both sides.
	for (const y of [top, top + 1, bottom - 1, bottom]) {
		rect(
			scene,
			cx - 7,
			y,
			15,
			1,
			y === top || y === bottom - 1 ? C.gold : C.amber
		);
	}
	for (let y = top + 2; y <= bottom - 2; y++) {
		set(scene, cx - 7, y, C.brass);
		set(scene, cx + 7, y, C.lampFrame);
	}
}

/**
 * Its right claw resting on the hourglass's top: long grey fingers ending in hooked black nails,
 * the sleeve falling back from a bony wrist.
 * @param {Canvas} scene
 */
function drawClaw(scene) {
	// The sleeve, from the shoulder down and across to the hourglass.
	for (let y = 27; y <= 36; y++) {
		const left = 39 + Math.round((y - 27) * 0.2);
		for (let x = left; x <= 48; x++) {
			set(scene, x, y, y < 29 || x > 46 ? ROBE.lit : ROBE.base);
		}
	}
	paint(
		scene,
		43,
		26,
		[
			'.....hhhh..',
			'...hhgggh..',
			'..hgggggghh',
			'.hgghhgghgh',
			'hgh.hgh.hgh',
			'gh..gh..h.h',
			'k...k...k.k',
		],
		{ h: HIDE.base, g: HIDE.glint, k: C.ink }
	);
}

/**
 * The glowing eyes, painted after the glows so they keep their light.
 * @param {Canvas} scene
 */
function drawEyes(scene) {
	for (const x of [FACE_X - 4, FACE_X + 2]) {
		set(scene, x, 14, C.ghost);
		set(scene, x + 1, 14, C.ghostLight);
		set(scene, x + 2, 14, C.ghost);
		set(scene, x + 1, 15, C.ghostShade);
	}
	set(scene, FACE_X - 3, 14, C.white);
	set(scene, FACE_X + 3, 14, C.white);
}

/**
 * The glowing sand: a heap in the lower bulb, the last of it in the upper bulb, and a thread falling between.
 * @param {Canvas} scene
 */
function drawSand(scene) {
	const { x: cx, top, bottom } = GLASS;
	paint(
		scene,
		cx - 4,
		bottom - 6,
		['....W....', '...WgW...', '..gWggg..', '.agggggaa', 'aaggggaaa'],
		{
			W: C.lampGlow,
			g: C.gold,
			a: C.amber,
		}
	);
	paint(
		scene,
		cx - 3,
		top + 5,
		['ggggggg', '.agggg.', '..aga..', '...g...'],
		{
			g: C.gold,
			a: C.amber,
		}
	);
	line(scene, cx, top + 9, cx, bottom - 7, C.lampGlow);
}
