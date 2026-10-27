// Meritocracy: a lone climber halfway up a long, broad stone stair that rises to a small temple crowned with a laurel wreath.
import {
	createCanvas,
	get,
	set,
	clear,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';
import { drawClassical } from '../../parts/classical.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The far sea's horizon, and the stair: how many steps, each one's rise and shift to the right. */
const HORIZON = 44;
const STEPS = 9;
const RISE = 4;
const SHIFT = 4;

/** The summit's row (the top step's tread), and the temple's left column and width. */
const SUMMIT = 59 - RISE * (STEPS - 1);
const TEMPLE = { x: 30, width: 20 };

/** The sunlit top of each tread, paler than any stone in the palette. */
const TREAD = mix(C.stoneLight, C.white, 0.45);

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
	drawIsland(layer);

	drawHill(scene, random);
	drawStair(scene);
	drawClassical(scene, {
		x: TEMPLE.x,
		y: SUMMIT - 1,
		width: TEMPLE.width,
		columns: 4,
		height: 6,
	});
	for (const [i, h] of [
		[1, 17],
		[3, 15],
		[5, 13],
		[7, 11],
	]) {
		drawCypress(scene, stepRight(i) + 7, stepTread(i) + RISE + 3, h);
	}
	drawClimber(scene, stepLeft(3) + 7, stepTread(3) - 1);
	outline(scene, C.ink);
	underlay(scene, layer);

	// The wreath above the pediment gets its own outline, over the sky.
	const wreath = createCanvas(64, 64);
	const centre = { x: TEMPLE.x + TEMPLE.width / 2, y: 4 };
	drawWreath(wreath, centre.x, centre.y);
	outline(wreath, C.ink);
	// The outline would fill the ring's small centre; clear it so the sky shows through.
	for (let y = centre.y - 2; y <= centre.y + 2; y++) {
		for (let x = centre.x - 3; x <= centre.x + 2; x++) {
			if (Math.hypot(x - centre.x + 0.5, y - centre.y) < 1.9) {
				clear(wreath, x, y);
			}
		}
	}
	underlay(wreath, scene);
	return wreath;
}

/**
 * The tread's first row of step i, counted from the bottom.
 * @param {number} i
 * @returns {number}
 */
function stepTread(i) {
	return 59 - RISE * i;
}

/**
 * The leftmost column of step i.
 * @param {number} i
 * @returns {number}
 */
function stepLeft(i) {
	return SHIFT * i - 3;
}

/**
 * The rightmost column of step i: the steps narrow a little as they climb away from the viewer.
 * @param {number} i
 * @returns {number}
 */
function stepRight(i) {
	return stepLeft(i) + 21 - i;
}

/**
 * A low, hazy island on the far sea.
 * @param {Canvas} layer
 */
function drawIsland(layer) {
	const haze = mix(C.daySky4, C.stoneMid, 0.35);
	for (let x = 0; x < 16; x++) {
		const top = HORIZON - Math.round(2.5 - Math.abs(x - 7) * 0.35);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, haze);
		}
	}
}

/**
 * The hillside the stair climbs: grass falling away below the stair to the right, shaded towards
 * the viewer, with olive bushes and pale boulders, and a flat summit around the temple.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHill(scene, random) {
	const olive = mix(C.pineShade, C.stoneShade, 0.3);
	const oliveLight = mix(C.grassLight, C.stoneLight, 0.35);
	for (let x = 0; x < 64; x++) {
		// The hill's skyline: up along the stair's right side, then flat across the summit.
		const top = Math.max(SUMMIT, Math.round(64 - (x - 15) * 1.3));
		for (let y = top; y < 64; y++) {
			const depth = y - top;
			let colour = C.grass;
			if (depth === 0) {
				colour = C.grassLight;
			} else if (y > 54 || (y > 46 && (x + y) % 2 === 0)) {
				colour = C.grassShade;
			} else if ((x * 5 + y * 3) % 11 === 0) {
				colour = C.grassLight;
			}
			set(scene, x, y, colour);
		}
	}
	// Olive bushes: round, grey-green, lit on the upper left.
	for (const [bx, by] of [
		[52, 40],
		[60, 47],
		[45, 52],
		[56, 58],
		[38, 60],
		[62, 35],
	]) {
		for (let y = by - 2; y <= by + 1; y++) {
			for (let x = bx - 2; x <= bx + 2; x++) {
				if ((x - bx) ** 2 + ((y - by) * 1.3) ** 2 > 6) {
					continue;
				}
				set(scene, x, y, x - bx + (y - by) < -1 ? oliveLight : olive);
			}
		}
	}
	// Pale boulders in the turf.
	for (let n = 0; n < 6; n++) {
		const x = 36 + Math.floor(random() * 26);
		const y = 38 + Math.floor(random() * 24);
		if (get(scene, x, y) === C.grass || get(scene, x, y) === C.grassShade) {
			set(scene, x, y, C.stoneLight);
			set(scene, x + 1, y, C.stone);
		}
	}
}

/**
 * The stair: broad stone steps climbing from the bottom left to the summit. Each has a lit tread,
 * a shaded riser below it and a dark end face on the right; the left ends step down against the sky.
 * @param {Canvas} scene
 */
function drawStair(scene) {
	for (let i = 0; i < STEPS; i++) {
		const tread = stepTread(i);
		const left = stepLeft(i);
		const right = stepRight(i);
		const bottom = i === 0 ? 63 : tread + RISE - 1;
		for (let y = tread; y <= bottom; y++) {
			for (let x = left; x <= right; x++) {
				const row = y - tread;
				let colour;
				if (row === 0) {
					colour = x === left ? C.white : TREAD;
				} else if (row === 1) {
					colour = C.stoneLight;
				} else if (row === 2) {
					colour = C.stoneShade;
				} else {
					colour = (x + i * 3) % 7 === 0 ? C.stoneShade : C.stoneMid;
				}
				if (x >= right - 1) {
					colour = row < 2 ? C.stone : mix(C.stoneShade, C.ink, 0.3);
				}
				set(scene, x, y, colour);
			}
		}
	}
	// The landing at the top, running under the temple.
	for (let x = stepLeft(STEPS - 1); x <= TEMPLE.x + TEMPLE.width + 2; x++) {
		set(scene, x, SUMMIT, C.stoneLight);
		set(scene, x, SUMMIT + 1, C.stone);
	}
}

/**
 * A slim dark cypress, one of the avenue lining the stair.
 * @param {Canvas} scene
 * @param {number} cx - The trunk's column
 * @param {number} base - The row it stands on
 * @param {number} height - From the base to the tip
 */
function drawCypress(scene, cx, base, height) {
	set(scene, cx, base, C.wood);
	const top = base - height;
	for (let y = top; y < base; y++) {
		const k = y - top;
		// A pointed tip, a slim body swelling a little in the middle, and a narrower foot.
		const left = k < 2 ? 0 : 1;
		const right = k < 2 ? 0 : k > 3 && k < height - 3 ? 2 : 1;
		for (let x = cx - left; x <= cx + right; x++) {
			const colour =
				x === cx - left ? C.pineLight : x > cx ? C.pineShade : C.pine;
			set(scene, x, y, colour);
		}
	}
}

/**
 * The climber, caught mid-step: back foot on one step, front foot on the next, leaning into the climb
 * with a staff. H hair, S skin, s skin shade, C red tunic, c its shade, l its light, B belt, W staff.
 * @param {Canvas} scene
 * @param {number} x - The back foot's column
 * @param {number} bottom - The back foot's row
 */
function drawClimber(scene, x, bottom) {
	const rows = [
		'.....HHH..',
		'....HHHHS.',
		'....HHSSS.',
		'.....SSSs.',
		'......sS.W',
		'....lCCcSW',
		'...lCCCcS.',
		'...lCCCc.W',
		'...lCCCc.W',
		'....BBBB.W',
		'....CCCcssW',
		'....Cc..sW',
		'...ss...sW',
		'..ss....sW',
		'..s.....ss',
		'.s........',
		'.s........',
		'ss........',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		H: C.wood,
		S: C.skin,
		s: C.skinShade,
		C: C.brickRed,
		c: C.brickRedShade,
		l: C.brickRedLight,
		B: C.wood,
		W: C.timberLight,
	};
	const top = bottom - rows.length + 1;
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, x + i, top + j, colours[key]);
			}
		});
	});
}

/**
 * The laurel wreath crowning the temple: a closed ring of leaves, packed in clusters that ruffle its
 * edges, around a sky-blue centre, with a red bow whose ends rest on the pediment. Draw it on its own
 * canvas so the outline pass rings it in ink.
 * @param {Canvas} canvas
 * @param {number} cx - The wreath's centre column
 * @param {number} cy - The wreath's centre row
 */
function drawWreath(canvas, cx, cy) {
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
	// The body of the ring, darker on its lower right, away from the sun.
	for (let step = 0; step < 64; step++) {
		const a = (step / 64) * Math.PI * 2;
		const away = Math.cos(a) + Math.sin(a) > 0.4;
		at(a, 2.6, away ? C.pineShade : C.pine);
		at(a, 3.6, away ? C.pine : C.grass);
	}
	// Leaf clusters pushing out of the ring, ruffling its edge.
	for (let n = 0; n < 12; n++) {
		const a = (n / 12) * Math.PI * 2 + 0.2;
		const away = Math.cos(a) + Math.sin(a) > 0.4;
		at(a, 4.7, away ? C.grass : C.grassLight);
		at(a + 0.22, 4.4, away ? C.grassShade : C.grassLight);
	}
	// The red bow at the bottom and its two tails.
	const x = Math.floor(cx);
	const bow = Math.round(cy + 3.8);
	set(canvas, x - 1, bow, C.brickRed);
	set(canvas, x, bow, C.brickRedLight);
	set(canvas, x - 2, bow + 1, C.brickRed);
	set(canvas, x + 1, bow + 1, C.brickRed);
	set(canvas, x - 3, bow + 2, C.brickRedShade);
	set(canvas, x + 2, bow + 2, C.brickRedShade);
}
