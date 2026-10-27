// Chimera-Citizen Rights: a friendly chimera with a citizen's sash sits in a town square, holding up its scroll among the townsfolk.
import {
	createCanvas,
	set,
	clear,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawStreet } from '../../parts/street.js';
import { drawBuilding } from '../../parts/buildings.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The square's kerb row, and the row the chimera's paws rest on. */
const KERB = 48;
const PAWS = 56;

/** The lion's face (its top-left pixel) and the scroll (the left end of its top roll). */
const FACE = { x: 32, y: 19 };
const SCROLL = { x: 47, y: 30 };

/** The lion's coat and mane. */
const COAT_LIGHT = mix(C.gold, C.sandLight, 0.45);
const COAT = mix(C.gold, C.amber, 0.3);
const COAT_SHADE = mix(C.amber, C.timberLight, 0.35);
const MANE_LIGHT = mix(C.amber, C.timberLight, 0.4);
const MANE = C.timberLight;
const MANE_SHADE = C.timber;

/** The serpent tail. */
const SCALE_LIGHT = C.grassLight;
const SCALE = C.grass;
const SCALE_SHADE = C.grassShade;

/**
 * Draws the Chimera-Citizen Rights scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(613);

	drawSky(layer, { time: 'day', horizon: KERB, random });
	drawStreet(layer, { top: KERB });

	// The houses round the square stand behind the chimera, so they get their own outline.
	const town = createCanvas(64, 64);
	drawTown(town);
	outline(town, C.ink);
	underlay(town, layer);
	drawBunting(town);

	drawTail(scene);
	drawGoat(scene);
	drawLion(scene);
	drawScroll(scene);
	drawTownsfolk(scene);
	outline(scene, C.ink);
	underlay(scene, town);
	drawFaces(scene);
	return scene;
}

/**
 * Fills an ellipse lit from the upper left: a light rim on that side, a shaded rim on the other.
 * @param {Canvas} canvas
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {number} rx - Half its width
 * @param {number} ry - Half its height
 * @param {[Colour, Colour, Colour]} colours - Light, main and shade
 */
function blob(canvas, cx, cy, rx, ry, [light, main, shade]) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const dx = (x - cx) / rx;
			const dy = (y - cy) / ry;
			if (dx * dx + dy * dy > 1) {
				continue;
			}
			const towards = -0.55 * dx - 0.83 * dy;
			const colour =
				towards > 0.62 ? light : towards < -0.4 ? shade : main;
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The square's houses: a row of gabled fronts behind the chimera.
 * @param {Canvas} town
 */
function drawTown(town) {
	drawBuilding(town, { kind: 'house', x: -4, y: KERB - 1, width: 14 });
	drawBuilding(town, { kind: 'house', x: 9, y: KERB - 1, width: 11 });
	drawBuilding(town, { kind: 'house', x: 19, y: KERB - 1, width: 9 });
	drawBuilding(town, { kind: 'house', x: 41, y: KERB - 1, width: 10 });
	drawBuilding(town, { kind: 'house', x: 50, y: KERB - 1, width: 16 });
}

/**
 * Bunting strung across the square: a sagging cord with little coloured pennants.
 * @param {Canvas} town
 */
function drawBunting(town) {
	const colours = [C.brickRed, C.gold, C.daySea2, C.grassLight];
	for (let x = 0; x < 64; x++) {
		const y = Math.round(9 + ((x - 32) / 32) ** 2 * -5 + 5);
		set(town, x, y, C.wood);
		if (x % 5 === 2) {
			const colour = colours[Math.floor(x / 5) % colours.length];
			rect(town, x - 1, y + 1, 3, 1, colour);
			set(town, x, y + 2, colour);
		}
	}
}

/**
 * The serpent tail: it leaves the lion's rump and coils up beside it, ending in a snake's head.
 * @param {Canvas} scene
 */
function drawTail(scene) {
	const path = [
		[17, 51],
		[12, 51],
		[8, 49],
		[5, 46],
		[4, 43],
		[5, 40],
		[6, 38],
	];
	for (let i = 0; i < path.length - 1; i++) {
		const [x0, y0] = path[i];
		const [x1, y1] = path[i + 1];
		const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let s = 0; s <= steps; s++) {
			const x = Math.round(x0 + ((x1 - x0) * s) / steps);
			const y = Math.round(y0 + ((y1 - y0) * s) / steps);
			const thick = i < 2 ? 2 : 1;
			for (let dy = -thick; dy <= thick; dy++) {
				for (let dx = -thick; dx <= thick; dx++) {
					if (Math.abs(dx) + Math.abs(dy) > thick) {
						continue;
					}
					const colour =
						dx < 0 || dy < 0
							? SCALE_LIGHT
							: dx > 0
								? SCALE_SHADE
								: SCALE;
					set(scene, x + dx, y + dy, colour);
				}
			}
		}
	}
	// Dark scales down the coil.
	for (const [x, y] of [
		[13, 51],
		[9, 49],
		[6, 46],
		[5, 42],
	]) {
		set(scene, x, y, SCALE_SHADE);
	}
	// The snake's head, raised and facing right.
	paint(
		scene,
		2,
		33,
		['..llll....', '.lgggggg..', 'lggegggggg', 'gggggggggG', '.GGGGGGG..'],
		{ l: SCALE_LIGHT, g: SCALE, G: SCALE_SHADE, e: C.ink }
	);
}

/**
 * The goat's head and neck rising from the lion's back, looking back over its shoulder, with swept-back horns and a beard.
 * @param {Canvas} scene
 */
function drawGoat(scene) {
	// The neck, short and thick, leaning back.
	for (let y = 27; y <= 40; y++) {
		const lean = Math.round((40 - y) * 0.2);
		for (let x = 20 - lean; x <= 27 - lean; x++) {
			const colour =
				x === 20 - lean
					? C.creamLight
					: x >= 26 - lean
						? C.creamShade
						: C.cream;
			set(scene, x, y, colour);
		}
	}
	paint(
		scene,
		9,
		20,
		[
			'.......WWWWW....',
			'.....WWWWWWWW...',
			'...WWWWeWWWWWww.',
			'..WWWWWWWWWWWcww',
			'.WWWWWWWWWWWWc..',
			'nWWWWWWWWWWWWc..',
			'nwWWWWWWWWWWc...',
			'.wwwwWWWWWWWc...',
			'...bbwWWWWWc....',
			'...bb..WWWW.....',
			'...bb...........',
			'....b...........',
		],
		{
			W: C.creamLight,
			w: C.cream,
			c: C.creamShade,
			e: C.ink,
			n: C.skinShade,
			b: C.white,
		}
	);
	// The horns: two ridged horns sweeping up and back from the brow, the far one darker.
	/** @type {[number, Colour, Colour][]} */
	const horns = [
		[2, C.stone, C.stoneShade],
		[0, C.stoneLight, C.stone],
	];
	for (const [shift, lit, dark] of horns) {
		const horn = [
			[17, 20],
			[18, 18],
			[19, 16],
			[21, 15],
			[23, 14],
			[25, 14],
			[27, 15],
			[28, 16],
		];
		horn.forEach(([x, y], i) => {
			const ridge = i % 2 ? lit : dark;
			set(scene, x + shift, y, ridge);
			if (i < 6) {
				set(scene, x + shift + 1, y + 1, dark);
				set(scene, x + shift, y + 1, ridge);
			}
		});
	}
}

/**
 * The seated lion: rump, body, chest, forelegs, a raised paw and a great maned head turned to the viewer, with a citizen's sash.
 * @param {Canvas} scene
 */
function drawLion(scene) {
	const coat = /** @type {[Colour, Colour, Colour]} */ ([
		COAT_LIGHT,
		COAT,
		COAT_SHADE,
	]);
	// The far foreleg, in shadow.
	rect(scene, 30, 44, 4, 11, COAT_SHADE);
	rect(scene, 29, 54, 6, 2, COAT_SHADE);
	blob(scene, 26, 46, 11, 7, coat);
	blob(scene, 19, 48, 7, 7, coat);
	blob(scene, 34, 38, 7, 9, coat);
	// The haunch's crease and the back foot.
	line(scene, 24, 43, 25, 50, COAT_SHADE);
	rect(scene, 15, 54, 9, 2, COAT);
	rect(scene, 15, 54, 9, 1, COAT_LIGHT);
	// The near foreleg and its paw.
	for (let y = 42; y < PAWS; y++) {
		rect(scene, 36, y, 4, 1, COAT);
		set(scene, 36, y, COAT_LIGHT);
		set(scene, 39, y, COAT_SHADE);
	}
	rect(scene, 35, 54, 7, 2, COAT);
	rect(scene, 35, 54, 7, 1, COAT_LIGHT);
	set(scene, 38, 55, COAT_SHADE);
	set(scene, 40, 55, COAT_SHADE);
	// The raised foreleg reaching forward to hold the scroll.
	for (let x = 38; x <= SCROLL.x; x++) {
		const y = 40 - Math.floor((x - 38) / 4);
		rect(scene, x, y, 1, 4, COAT);
		set(scene, x, y, COAT_LIGHT);
		set(scene, x, y + 3, COAT_SHADE);
	}
	// The sash, across the chest from shoulder to belly, with a gold badge.
	for (let i = 0; i < 13; i++) {
		const x = 37 - Math.round(i * 0.7);
		const y = 32 + i;
		rect(scene, x - 1, y, 3, 1, C.daySea2);
		set(scene, x - 1, y, C.daySea1);
		set(scene, x + 1, y, C.daySea3);
	}
	rect(scene, 31, 41, 3, 3, C.gold);
	set(scene, 33, 43, C.amber);
	// The mane, ragged at its edge, and two round ears on top.
	blob(scene, 38, 25, 9, 10, [MANE_LIGHT, MANE, MANE_SHADE]);
	for (const [x, y] of [
		[29, 21],
		[29, 27],
		[30, 31],
		[33, 34],
		[42, 34],
		[46, 30],
		[46, 20],
	]) {
		set(scene, x, y, MANE);
		set(scene, x + (x < 38 ? -1 : 1), y, MANE);
	}
	for (const x of [31, 43]) {
		rect(scene, x, 16, 3, 2, COAT);
		set(scene, x + 1, 17, COAT_SHADE);
		set(scene, x, 16, COAT_LIGHT);
	}
	// The face, turned to the viewer: bright eyes, a broad nose and a smile.
	paint(
		scene,
		FACE.x,
		FACE.y,
		[
			'...LLLLLLL...',
			'.LLLLLLLLLLL.',
			'LLLLLLLLLLLLL',
			'LLkkLLLLLkkLL',
			'LLkkLLLLLkkLs',
			'LLLLLLLLLLLLs',
			'sLLLMMMMMLLLs',
			'sLLMMnnnMMLss',
			'.sLMMMnMMMLs.',
			'.sMMkMMMkMMs.',
			'..MMMkkkMMM..',
			'...MMMMMMM...',
			'....sMMMs....',
		],
		{
			L: COAT,
			M: COAT_LIGHT,
			s: COAT_SHADE,
			n: C.brickRedShade,
			k: C.ink,
		}
	);
}

/**
 * The scroll the lion holds up: plain parchment between two rolled ends, with a red seal on a ribbon.
 * @param {Canvas} scene
 */
function drawScroll(scene) {
	const left = SCROLL.x;
	const right = SCROLL.x + 6;
	for (let y = SCROLL.y + 2; y <= SCROLL.y + 15; y++) {
		for (let x = left; x <= right; x++) {
			const colour =
				x === left ? C.white : x >= right ? C.cream : C.creamLight;
			set(scene, x, y, colour);
		}
	}
	for (const y of [SCROLL.y, SCROLL.y + 16]) {
		for (let x = left - 1; x <= right + 1; x++) {
			set(scene, x, y, C.creamLight);
			set(scene, x, y + 1, C.cream);
			set(scene, x, y + 2, C.creamShade);
		}
		set(scene, right + 2, y + 1, C.creamShade);
		set(scene, left - 2, y + 1, C.cream);
	}
	// The ribbon and seal hanging from the bottom roll.
	set(scene, left + 3, SCROLL.y + 19, C.brickRed);
	rect(scene, left + 2, SCROLL.y + 20, 3, 2, C.brickRed);
	set(scene, left + 2, SCROLL.y + 20, C.brickRedLight);
	// The paw over the scroll's middle.
	rect(scene, left - 1, SCROLL.y + 7, 3, 4, COAT);
	set(scene, left - 1, SCROLL.y + 7, COAT_LIGHT);
	set(scene, left + 1, SCROLL.y + 7, COAT_LIGHT);
	set(scene, left + 1, SCROLL.y + 10, COAT_SHADE);
}

/**
 * Townsfolk round the chimera: two on the right turned towards it, one waving, and one on the left.
 * @param {Canvas} scene
 */
function drawTownsfolk(scene) {
	drawFigure(scene, { x: 58, y: 58, facing: 'left', clothes: C.pine });
	const waver = drawFigure(scene, {
		x: 53,
		y: 62,
		facing: 'left',
		clothes: C.roofLight,
	});
	// The waving arm, raised high.
	clear(scene, waver.x, waver.y + 5);
	set(scene, waver.x - 1, waver.y + 4, C.roofLight);
	set(scene, waver.x - 1, waver.y + 3, C.skin);
	set(scene, waver.x - 1, waver.y + 2, C.skin);
	drawFigure(scene, { x: 2, y: 62, facing: 'right', clothes: C.daySea2 });
}

/**
 * The faces' last details, drawn over the outline: the lion's bright eyes.
 * @param {Canvas} scene
 */
function drawFaces(scene) {
	for (const x of [FACE.x + 2, FACE.x + 9]) {
		set(scene, x + 1, FACE.y + 3, C.white);
	}
	// The snake's forked tongue.
	set(scene, 12, 36, C.brickRed);
	set(scene, 13, 35, C.brickRed);
	set(scene, 13, 37, C.brickRed);
}
