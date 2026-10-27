// Doppelgangers: two identical women in red gowns reach towards each other through an empty gilded mirror frame in a moonlit garden.
import {
	createCanvas,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the hedge's top row, the terrace's first row and the women's feet. */
const HORIZON = 34;
const HEDGE = 27;
const TERRACE = 46;
const FEET = 60;

/** The frame's centre line (between two columns), and its arch's centre row. */
const CX = 31.5;
const ARCH_Y = 18;

/**
 * The woman facing right, one arm raised to the frame. H hair, h hair lit by the moon, S skin, s skin shade, e eye,
 * w lace collar, G gown, g gown fold, l gown lit by the moon, t gold trim.
 */
const WOMAN = [
	'...HHh.......',
	'..HHHHh......',
	'..HHHSSS.....',
	'.HHHSSeS.....',
	'.HHHSSSSS....',
	'.HHHSSSS.....',
	'..HHsSS......',
	'....ss.......',
	'...wwwww.....',
	'..GGGGGlllSSS',
	'..GGGGGGGGSSS',
	'..GGgGGl.....',
	'..GGgGGl.....',
	'...GgGl......',
	'...ttttt.....',
	'...GgGGl.....',
	'...GgGGGl....',
	'..GGgGGGl....',
	'..GGgGGGGl...',
	'..GGgGGGGl...',
	'.GGgGGGgGl...',
	'.GGgGGGgGGl..',
	'.GGgGGGgGGl..',
	'.GgGGGGgGGGl.',
	'GGgGGGGGgGGl.',
	'GGgGGGGGgGGGl',
	'GgGGGGGGgGGGl',
	'ttttttttttttt',
];

/**
 * Draws the Doppelgangers scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(817);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 30,
		starRows: 24,
		moon: { x: 32, y: 21 },
	});
	drawHedge(layer, random);
	drawTerrace(layer);
	// The empty frame shimmers faintly, as if the glass had only just gone.
	glow(layer, {
		x: 32,
		y: 30,
		radius: 13,
		colour: C.arcaneLight,
		strength: 0.3,
	});

	// The frame stands behind the women's hands, so it gets its own outline.
	const frame = createCanvas(64, 64);
	drawFrame(frame);
	outline(frame, C.ink);
	underlay(frame, layer);

	const top = FEET - WOMAN.length + 1;
	paint(scene, 8, top, WOMAN, womanColours());
	paint(scene, 43, top, WOMAN, womanColours(), { mirror: true });
	outline(scene, C.ink);
	underlay(scene, frame);
	return scene;
}

/**
 * The women's colours: auburn hair, a deep red gown with gold trim, rimmed by the moon on its outer edge.
 * @returns {Record<string, Colour>}
 */
function womanColours() {
	return {
		H: C.timber,
		h: C.timberLight,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		w: C.creamLight,
		G: C.brickRed,
		g: C.brickRedShade,
		l: C.brickRedLight,
		t: C.gold,
	};
}

/**
 * A clipped garden hedge across the back, with two topiary cones rising above it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHedge(layer, random) {
	for (let x = 0; x < 64; x++) {
		const cone = Math.max(
			0,
			9 - Math.abs(x - 6) * 1.6,
			9 - Math.abs(x - 57) * 1.6
		);
		const top = HEDGE - Math.round(cone) + (x % 4 === 0 ? 1 : 0);
		for (let y = top; y < TERRACE; y++) {
			let colour = C.pineShade;
			if (y === top) {
				colour = C.pine;
			} else if (y > TERRACE - 4) {
				colour = mix(C.pineShade, C.ink, 0.4);
			} else if (random() > 0.85) {
				colour = C.pine;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * A terrace of dark flagstones laid in a chequer, the near rows deeper.
 * @param {Canvas} layer
 */
function drawTerrace(layer) {
	let top = TERRACE;
	for (let course = 0; top < 64; course++) {
		const depth = 2 + course;
		const width = 5 + course * 2;
		for (let y = top; y < Math.min(top + depth, 64); y++) {
			for (let x = 0; x < 64; x++) {
				const tile = Math.floor((x - 32 + width * 20) / width) + course;
				let colour = tile % 2 ? C.stoneShade : C.roof;
				if (y === top) {
					colour = tile % 2 ? C.stoneMid : C.roofLight;
				}
				set(layer, x, y, colour);
			}
		}
		top += depth;
	}
}

/**
 * Whether a pixel lies inside the frame's arched opening.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inOpening(x, y) {
	return (
		x >= 25 &&
		x <= 38 &&
		y <= 48 &&
		(y >= ARCH_Y || Math.hypot(x - CX, y - ARCH_Y) <= 7.2)
	);
}

/**
 * Whether a pixel lies inside the frame's outer edge.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inOuter(x, y) {
	return (
		x >= 21 &&
		x <= 42 &&
		y <= 52 &&
		(y >= ARCH_Y || Math.hypot(x - CX, y - ARCH_Y) <= 11.2)
	);
}

/**
 * The empty mirror frame: a thick gilded arch with a beaded moulding, a crest and splayed feet.
 * @param {Canvas} canvas
 */
function drawFrame(canvas) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inOuter(x, y) || inOpening(x, y)) {
				continue;
			}
			const outerEdge = [-1, 1].some(
				(d) => !inOuter(x + d, y) || !inOuter(x, y + d)
			);
			const innerEdge = [-1, 1].some(
				(d) => inOpening(x + d, y) || inOpening(x, y + d)
			);
			let colour = x > CX + 3 ? C.amber : C.gold;
			if (outerEdge) {
				colour = x > CX ? C.lampFrame : C.brass;
			} else if (innerEdge) {
				colour = x > CX ? C.lampFrame : C.amber;
			} else if ((y + (x > CX ? 2 : 0)) % 4 === 0) {
				colour = x < CX ? C.lampGlow : C.gold;
			}
			set(canvas, x, y, colour);
		}
	}
	// The crest: a shell of gold with a red jewel.
	paint(canvas, 28, 3, ['..ggg..', '.gLgLg.', 'gLgjgLg', '.ggggg.'], {
		g: C.gold,
		L: C.lampGlow,
		j: C.brickRedLight,
	});
	// Splayed feet on the terrace.
	paint(
		canvas,
		20,
		53,
		[
			'.aggggggggggggggggggga.',
			'agg..................gga',
			'aa....................aa',
		],
		{ g: C.gold, a: C.amber }
	);
}
