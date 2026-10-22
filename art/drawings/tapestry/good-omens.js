// Good Omens: a white stag with pale gold antlers standing on a green knoll under a double rainbow, watching the hills.
import {
	createCanvas,
	get,
	set,
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

/** The last sky row, the rainbows' centre, and the row the stag's hooves stand on. */
const HORIZON = 44;
const ARC = { x: 32, y: 52 };
const HOOVES = 57;

/** The antlers' pale gold. */
const PALE_GOLD = mix(C.gold, C.creamLight, 0.45);

/** The rainbow's bands from the outside in. */
const BANDS = [
	C.brickRedLight,
	C.amber,
	C.gold,
	C.grassLight,
	C.daySea1,
	C.arcane,
];

/**
 * Draws the Good Omens scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9521);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawRainbows(layer);
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: 53, random });
	drawKnoll(layer);

	drawStag(scene);
	outline(scene, C.ink);
	drawFace(scene);
	drawAntlers(scene);
	underlay(scene, layer);
	drawFlowers(scene, random);
	return scene;
}

/**
 * The double rainbow: a bright inner bow and a fainter outer bow with its colours reversed, the sky brighter inside.
 * @param {Canvas} layer
 */
function drawRainbows(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			const r = Math.hypot(x - ARC.x, (y - ARC.y) * 1.05);
			const inner = Math.floor(31 - r);
			const outer = Math.floor(r - 37);
			if (r < 25) {
				set(layer, x, y, mix(behind, C.white, 0.18));
			} else if (inner >= 0 && inner < BANDS.length) {
				set(layer, x, y, mix(behind, BANDS[inner], 0.78));
			} else if (outer >= 0 && outer < BANDS.length) {
				set(layer, x, y, mix(behind, BANDS[outer], 0.42));
			}
		}
	}
}

/**
 * Rolling hills under the bows: a pale far row and a greener near row.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	const far = mix(C.forestFloorLight, C.daySky5, 0.45);
	const farTop = mix(C.grassLight, C.daySky6, 0.4);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			41 - Math.sin(x * 0.1 + 0.8) * 3 - Math.sin(x * 0.27) * 1
		);
		const nearTop = Math.round(48 - Math.sin(x * 0.15 + 2.6) * 3);
		for (let y = top; y < 64; y++) {
			let colour = y === top ? farTop : far;
			if (y >= nearTop) {
				colour =
					y === nearTop
						? C.grassLight
						: y - nearTop < 3
							? C.grass
							: C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The knoll the stag stands on, catching the sun on its crown.
 * @param {Canvas} layer
 */
function drawKnoll(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(HOOVES - 1 + ((x - 32) / 18) ** 2 * 3);
		for (let y = Math.max(top, 0); y < 64; y++) {
			let colour = C.grass;
			if (y === top) {
				colour = C.grassLight;
			} else if (y > top + 4 && (x + y) % 2 === 0) {
				colour = C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Paints the pixels of an ellipse.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {(x: number, y: number) => Colour} colour - The colour for each pixel
 */
function ellipse(canvas, cx, cy, rx, ry, colour) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) {
				set(canvas, x, y, colour(x, y));
			}
		}
	}
}

/**
 * The stag's coat: white, shaded along the belly.
 * @param {number} x
 * @param {number} y
 * @returns {Colour}
 */
function coat(x, y) {
	return y >= 47 ? C.cloudShade : C.white;
}

/**
 * One leg: two pixels wide down to the knee or hock, one pixel wide below it, ending in a dark hoof.
 * @param {Canvas} scene
 * @param {[number, number][]} points - The leg's left column at the top, at the knee or hock, and at the hoof row
 * @param {boolean} far - The far legs are drawn in shade
 */
function drawLeg(scene, points, far) {
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		for (let y = y0; y <= y1; y++) {
			const x = Math.round(
				x0 + ((x1 - x0) * (y - y0)) / Math.max(1, y1 - y0)
			);
			const thin = i === points.length - 1 && y > y0;
			set(scene, x, y, far ? C.cloudShade : C.white);
			if (!thin) {
				set(scene, x + 1, y, far ? C.stoneLight : C.cloudShade);
			}
		}
	}
	const [hx, hy] = points[points.length - 1];
	set(scene, hx, hy + 1, C.timberShade);
}

/**
 * The white stag standing side on, facing right: a deep chest, a tucked belly, slender legs,
 * a neck reaching forward and a small head with a pointed muzzle and broad ears.
 * @param {Canvas} scene
 */
function drawStag(scene) {
	// The far legs first, in shade, then the body, then the near legs.
	drawLeg(
		scene,
		[
			[27, 44],
			[25, 50],
			[26, 56],
		],
		true
	);
	drawLeg(
		scene,
		[
			[39, 46],
			[40, 51],
			[40, 56],
		],
		true
	);
	ellipse(scene, 30, 42.5, 8.5, 3.8, coat);
	ellipse(scene, 23, 42, 5, 4.5, coat);
	ellipse(scene, 37, 43, 5, 4.8, coat);
	// The belly tucks up from the deep chest towards the haunch.
	for (let x = 27; x <= 33; x++) {
		const underline = Math.round(45 + ((x - 27) * 2) / 6);
		for (let y = underline + 1; y <= 50; y++) {
			scene.p[y * 64 + x] = null;
		}
	}
	// The neck, reaching forward and up and narrowing to the head.
	for (let y = 31; y <= 41; y++) {
		const t = (y - 31) / 10;
		const cx = 44.5 - 7 * t;
		const half = 1.4 + 1.9 * t;
		for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
			const throat = x >= Math.round(cx + half) - 1 && y > 34;
			set(scene, x, y, throat ? C.cloudShade : C.white);
		}
	}
	// The head: a small wedge tapering to the muzzle.
	for (const [y, a, b] of [
		[28, 43, 45],
		[29, 42, 46],
		[30, 42, 48],
		[31, 42, 50],
		[32, 43, 51],
		[33, 45, 50],
	]) {
		for (let x = a; x <= b; x++) {
			set(scene, x, y, y === 33 ? C.cloudShade : C.white);
		}
	}
	// Broad ears: the near one swept back, the far one showing behind the brow.
	for (const [x, y, colour] of /** @type {[number, number, Colour][]} */ ([
		[41, 29, C.white],
		[40, 29, C.cream],
		[39, 28, C.cream],
		[40, 28, C.white],
		[38, 28, C.white],
		[39, 27, C.white],
		[47, 28, C.cloudShade],
		[48, 27, C.cloudShade],
	])) {
		set(scene, x, y, colour);
	}
	drawLeg(
		scene,
		[
			[22, 44],
			[20, 50],
			[21, 56],
		],
		false
	);
	drawLeg(
		scene,
		[
			[35, 46],
			[35, 51],
			[35, 56],
		],
		false
	);
	// The short tail.
	set(scene, 17, 40, C.white);
	set(scene, 17, 41, C.cloudShade);
}

/**
 * The antlers: two pale gold beams sweeping up from the brow, one back and one forward, each branching into tines.
 * They are drawn on their own canvas with their own outline, the tines spaced so the ink between them never merges,
 * and laid over the stag.
 * @param {Canvas} scene
 */
function drawAntlers(scene) {
	const antlers = createCanvas(64, 64);
	/** @type {[number, number, number, number][]} */
	const segments = [
		// The near antler: a beam sweeping back and curling forward, a brow tine and two more.
		[43, 27, 39, 23],
		[39, 23, 36, 18],
		[36, 18, 35, 13],
		[35, 13, 37, 9],
		[41, 25, 44, 23],
		[39, 23, 42, 19],
		[36, 18, 39, 14],
		// The far antler: a beam sweeping forward and curling back, with two tines.
		[46, 27, 49, 23],
		[49, 23, 52, 19],
		[52, 19, 53, 14],
		[53, 14, 51, 10],
		[49, 23, 47, 19],
		[52, 19, 49, 15],
	];
	for (const [x0, y0, x1, y1] of segments) {
		line(antlers, x0, y0, x1, y1, PALE_GOLD);
	}
	for (const [x, y] of [
		[43, 27],
		[42, 26],
		[46, 27],
		[47, 26],
	]) {
		set(antlers, x, y, C.amber);
	}
	outline(antlers, C.ink);
	underlay(antlers, scene);
	scene.p = antlers.p;
}

/**
 * The stag's dark eye and nose, painted after the outline.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	set(scene, 45, 30, C.ink);
	set(scene, 51, 32, C.ink);
}

/**
 * White and gold flowers scattered over the knoll, painted last.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawFlowers(scene, random) {
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		const y = HOOVES + 1 + Math.floor(random() * 6);
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, i % 3 === 0 ? C.gold : C.creamLight);
		}
	}
}
