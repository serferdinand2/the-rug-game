// Meritocracy: a lone climber halfway up a long stone stair to a hilltop temple crowned with a laurel wreath.
import {
	createCanvas,
	set,
	rect,
	mix,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';
import { drawClassical } from '../../parts/classical.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, the hilltop's row, and how many steps the stair has. */
const HORIZON = 45;
const SUMMIT = 34;
const STEPS = 9;

/**
 * Draws the Meritocracy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(859);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawSea(layer, { time: 'day', top: HORIZON + 1, random });

	drawHill(scene, random);
	drawStair(scene);
	const temple = drawClassical(scene, {
		x: 36,
		y: SUMMIT - 1,
		width: 26,
		columns: 4,
		height: 10,
	});
	drawCypress(scene, 33, SUMMIT - 1);
	drawFigure(scene, { x: 15, y: stepRow(5) - 1, clothes: C.brickRed });
	outline(scene, C.ink);
	underlay(scene, layer);

	// The wreath on the pediment's peak gets its own outline, over the sky.
	const wreath = createCanvas(64, 64);
	drawWreath(wreath, temple.x + Math.floor(temple.w / 2), temple.y - 1);
	outline(wreath, C.ink);
	underlay(wreath, scene);
	return wreath;
}

/**
 * The tread row of step i, counted from the bottom.
 * @param {number} i
 * @returns {number}
 */
function stepRow(i) {
	return 61 - 3 * i;
}

/**
 * The hill: a grassy slope rising from the bottom left to a flat summit, the summit's flank
 * a rugged sandstone bluff with grass spilling over its edge.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHill(scene, random) {
	for (let x = 0; x < 64; x++) {
		const i = Math.min(STEPS, Math.floor(x / 3));
		const top = x >= STEPS * 3 + 3 ? SUMMIT : stepRow(i) + 4;
		for (let y = top; y < 64; y++) {
			const depth = y - top;
			// The bluff's ragged left edge leans out as it falls.
			const edge =
				36 -
				Math.floor((y - SUMMIT) * 0.25) +
				Math.round(Math.sin(y * 0.9) * 1.5);
			let colour = C.grass;
			if (depth === 0) {
				colour = C.grassLight;
			} else if (y >= SUMMIT + 3 && x >= edge) {
				colour = x === edge ? C.sandLight : rock(x, y);
			} else if (depth > 14 || (depth > 8 && (x + y) % 2 === 0)) {
				colour = C.grassShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Grass hanging over the bluff's top edge, and tufts in its ledges.
	for (let x = 34; x < 64; x++) {
		if ((x * 7) % 5 < 2) {
			set(scene, x, SUMMIT + 3, C.grass);
		}
	}
	for (let n = 0; n < 8; n++) {
		const x = 40 + Math.floor(random() * 23);
		const y = SUMMIT + 6 + Math.floor(random() * 22);
		set(scene, x, y, C.grassLight);
		set(scene, x + 1, y, C.grass);
	}
}

/**
 * One pixel of the sandstone bluff: wavy strata with shaded undersides and a few cracks.
 * @param {number} x
 * @param {number} y
 * @returns {Colour}
 */
function rock(x, y) {
	const wave = Math.round(
		Math.sin(x * 0.35) * 1.2 + Math.sin(x * 0.13 + 1) * 1.5
	);
	const band = (y + wave - SUMMIT) % 6;
	if (band === 5) {
		return C.sandShade;
	}
	if (band === 0) {
		return C.sandLight;
	}
	if ((x * 3 + Math.floor((y + wave) / 6) * 7) % 13 === 0 && band > 1) {
		return C.sandShade;
	}
	return x > 58 ? mix(C.sand, C.sandShade, 0.5) : C.sand;
}

/**
 * The long stone stair, seen from the side: each step a lit tread over a shaded riser, on a stone footing.
 * @param {Canvas} scene
 */
function drawStair(scene) {
	for (let i = 0; i <= STEPS; i++) {
		const tread = stepRow(i);
		for (let x = 3 * i; x < 3 * i + 3 && x < 64; x++) {
			const last = x === 3 * i + 2;
			for (let y = tread; y < tread + 4; y++) {
				let colour = C.stone;
				if (y === tread) {
					colour = C.stoneLight;
				} else if (last || y === tread + 3) {
					colour = C.stoneShade;
				} else if ((x + y) % 4 === 0) {
					colour = C.stoneMid;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// The landing at the top, leading to the temple's steps.
	rect(scene, 3 * (STEPS + 1), SUMMIT, 4, 1, C.stoneLight);
	rect(scene, 3 * (STEPS + 1), SUMMIT + 1, 4, 2, C.stone);
}

/**
 * A slim dark cypress beside the temple.
 * @param {Canvas} scene
 * @param {number} cx - The trunk's column
 * @param {number} base - The row it stands on
 */
function drawCypress(scene, cx, base) {
	set(scene, cx, base, C.wood);
	for (let y = base - 14; y < base; y++) {
		const k = y - (base - 14);
		// A pointed tip, then a slim body that swells a little in the middle.
		const half = k < 2 ? 0 : 1;
		const swell = k > 3 && k < 11 ? 1 : 0;
		for (let x = cx - half; x <= cx + half + swell; x++) {
			const colour =
				x === cx - half ? C.pineLight : x > cx ? C.pineShade : C.pine;
			set(scene, x, y, colour);
		}
	}
}

/**
 * The gilded laurel wreath crowning the temple: a branch curving round from each side of a red tie,
 * leaves sprouting along both edges, open at the top. Draw it on its own canvas so the outline
 * pass rings it in ink.
 * @param {Canvas} canvas
 * @param {number} cx - The wreath's centre column
 * @param {number} bottom - The row of its tie
 */
function drawWreath(canvas, cx, bottom) {
	const cy = bottom - 5;
	/**
	 * Paints the wreath's pixel at an angle and a distance from its centre.
	 * @param {number} a - The angle in radians
	 * @param {number} r - The distance in pixels
	 * @param {Colour} colour
	 */
	const at = (a, r, colour) =>
		set(
			canvas,
			Math.round(cx - 0.5 + Math.cos(a) * r),
			Math.round(cy + Math.sin(a) * r),
			colour
		);
	for (let step = 0; step <= 24; step++) {
		// From the bottom (90°) round each side to the top, leaving a gap there.
		const sweep = (step / 24) * 145;
		for (const side of [-1, 1]) {
			const a = ((90 + side * sweep) * Math.PI) / 180;
			at(a, 4.5, C.amber);
			if (step % 3 === 1) {
				// A leaf on the outside and one on the inside of the branch.
				at(a, 5.8, C.gold);
				at(a + side * 0.12, 6.2, step < 18 ? C.gold : C.lampGlow);
				at(a, 3.3, C.gold);
			}
		}
	}
	// The red tie and its two ribbon ends.
	rect(canvas, cx - 1, cy + 4, 2, 2, C.brickRed);
	set(canvas, cx - 2, cy + 6, C.brickRedLight);
	set(canvas, cx + 1, cy + 6, C.brickRedLight);
}
