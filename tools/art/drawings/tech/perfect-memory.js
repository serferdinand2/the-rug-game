// Perfect Memory: a brain in a glass jar glowing gold at night, tiny picture cards of remembered things circling it.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The jar's glass body: its columns, its first and last rows, and the row the liquid comes up to. */
const JAR = { left: 19, right: 44, top: 17, bottom: 49, liquid: 21 };

/** The brain floating in the jar: the centre of its main lobe and its radii. */
const BRAIN = { x: 31.5, y: 31.5, rx: 10.5, ry: 7.5 };

/** The path the picture cards circle on: its centre, its radii and how much it tilts, rising to the right. */
const ORBIT = { x: 31.5, y: 34, rx: 28.5, ry: 9, tilt: -0.14 };

/** The table's first row. */
const TABLE = 55;

/** The night sky, three plain bands, and the table. */
const SKY = [C.nightSky1, C.nightSky2, C.nightSky3];
const TABLE_TOP = mix(C.floor, C.floorShade, 0.3);
const TABLE_EDGE = C.floorLight;
const TABLE_FRONT = C.floorShade;

/** The glass above the liquid, the glowing liquid and its brighter heart round the brain. */
const AIR = mix(C.nightSky3, C.stoneLight, 0.3);
const AIR_GLINT = mix(C.nightSky3, C.stoneLight, 0.6);
const LIQUID = mix(C.amber, C.lampFrame, 0.3);
const LIQUID_LIGHT = mix(C.amber, C.gold, 0.45);
const GLASS_LIGHT = mix(C.gold, C.lampGlow, 0.6);
const GLASS_SHADE = mix(C.lampFrame, C.amber, 0.25);

/** The brain: pink, its folds, and a gleam warmed by the gold. */
const BRAIN_LIGHT = mix(C.cream, C.lampGlow, 0.4);
const BRAIN_BODY = mix(C.brickRedLight, C.cream, 0.42);
const BRAIN_FOLD = mix(C.brickRedLight, C.brickRedShade, 0.3);

/** The trail the cards leave behind them. */
const TRAIL = mix(C.gold, C.nightSky2, 0.35);

/**
 * Draws the Perfect Memory tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5862);

	drawSky(layer, random);
	glow(layer, {
		x: 32,
		y: 31,
		radius: 36,
		colour: C.amber,
		strength: 0.5,
		steps: 4,
		skip: [C.starDim],
	});
	drawTable(layer);
	drawTrail(layer, false);

	drawJar(scene);
	drawBrain(scene);
	drawLid(scene);
	drawBase(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawBubbles(scene, random);
	drawTrail(scene, true);

	const cards = createCanvas(64, 64);
	drawCards(cards);
	outline(cards, C.ink);
	stamp(scene, cards);
	return scene;
}

/**
 * The night sky in three plain bands, with a few stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	rect(layer, 0, 0, 64, 16, SKY[0]);
	rect(layer, 0, 16, 64, 18, SKY[1]);
	rect(layer, 0, 34, 64, TABLE - 34, SKY[2]);
	for (let i = 0; i < 16; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			Math.floor(random() * 30),
			C.starDim
		);
	}
}

/**
 * The table: its top, warmed under the jar, a lit front edge and its front in shadow.
 * @param {Canvas} layer
 */
function drawTable(layer) {
	rect(layer, 0, TABLE, 64, 5, TABLE_TOP);
	rect(layer, 10, TABLE, 44, 2, mix(TABLE_TOP, C.amber, 0.3));
	rect(layer, 0, TABLE + 5, 64, 1, TABLE_EDGE);
	rect(layer, 0, TABLE + 6, 64, 64 - TABLE - 6, TABLE_FRONT);
}

/**
 * A point on the cards' path.
 * @param {number} angle - In radians; a positive sine is the front half
 * @returns {{ x: number, y: number }}
 */
function onOrbit(angle) {
	const dx = Math.cos(angle) * ORBIT.rx;
	return {
		x: Math.round(ORBIT.x + dx),
		y: Math.round(ORBIT.y + Math.sin(angle) * ORBIT.ry + dx * ORBIT.tilt),
	};
}

/**
 * The cards' path as a dashed gold trail: the back half behind the jar, or the front half over it.
 * @param {Canvas} canvas
 * @param {boolean} front
 */
function drawTrail(canvas, front) {
	const steps = 120;
	for (let i = 0; i < steps; i++) {
		const angle = (i / steps) * Math.PI * 2;
		if (Math.sin(angle) > 0 !== front || i % 4 === 3) {
			continue;
		}
		const { x, y } = onOrbit(angle);
		if (y < TABLE) {
			set(canvas, x, y, front ? C.gold : TRAIL);
		}
	}
}

/**
 * Whether a pixel lies inside the jar's body: a tall box with rounded shoulders.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inJar(x, y) {
	if (x < JAR.left || x > JAR.right || y < JAR.top || y > JAR.bottom) {
		return false;
	}
	const corner = 4;
	const cx = Math.min(Math.max(x, JAR.left + corner), JAR.right - corner);
	const cy = Math.max(y, JAR.top + corner);
	return Math.hypot(x - cx, y - cy) <= corner + 0.3;
}

/**
 * The jar: glass over the air at the top, the glowing liquid below, lit down the left wall and shaded down the right.
 * @param {Canvas} scene
 */
function drawJar(scene) {
	for (let y = JAR.top; y <= JAR.bottom; y++) {
		for (let x = JAR.left; x <= JAR.right; x++) {
			if (!inJar(x, y)) {
				continue;
			}
			let colour = y < JAR.liquid ? AIR : LIQUID;
			if (
				y >= JAR.liquid &&
				Math.hypot((x - BRAIN.x) / 1.3, y - BRAIN.y - 2) < 11
			) {
				colour = LIQUID_LIGHT;
			}
			if (y === JAR.liquid) {
				colour = GLASS_LIGHT;
			}
			set(scene, x, y, colour);
		}
	}
	// The glass: a bright streak down the left, the right wall in shade, a glint above the liquid.
	for (let y = JAR.top + 3; y <= JAR.bottom - 2; y++) {
		if (y < JAR.liquid) {
			set(scene, 21, y, AIR_GLINT);
			continue;
		}
		set(scene, 21, y, GLASS_LIGHT);
		if (y > JAR.liquid + 2 && y < JAR.bottom - 6) {
			set(scene, 22, y, GLASS_LIGHT);
		}
		set(scene, JAR.right, y, GLASS_SHADE);
		set(scene, JAR.right - 1, y, y % 3 ? LIQUID : GLASS_SHADE);
	}
}

/**
 * Picks a tone for the brain by how much a point faces the light at the upper left.
 * @param {number} nx - Column offset, scaled to the lobe
 * @param {number} ny - Row offset, scaled to the lobe
 * @returns {Colour}
 */
function brainTone(nx, ny) {
	const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
	const lit = -nx * 0.45 - ny * 0.6 + nz * 0.66;
	if (lit > 0.9) {
		return BRAIN_LIGHT;
	}
	if (lit > 0.15) {
		return BRAIN_BODY;
	}
	return BRAIN_FOLD;
}

/**
 * The brain, seen from the side: the great rounded lobe, the temporal lobe under it, the ridged cerebellum at the back and the stem.
 * @param {Canvas} scene
 */
function drawBrain(scene) {
	// The stem, trailing down into the liquid.
	rect(scene, 35, 37, 3, 7, BRAIN_FOLD);
	rect(scene, 35, 37, 1, 7, BRAIN_BODY);
	// The cerebellum, tucked under the back, with fine ridges.
	for (let y = 34; y <= 41; y++) {
		for (let x = 33; x <= 44; x++) {
			const nx = (x - 38.5) / 4.6;
			const ny = (y - 37.5) / 3.2;
			if (nx * nx + ny * ny >= 1) {
				continue;
			}
			set(scene, x, y, y % 2 ? BRAIN_FOLD : BRAIN_BODY);
		}
	}
	// The main lobe and the temporal lobe below its front.
	for (let y = 22; y <= 40; y++) {
		for (let x = 18; x <= 44; x++) {
			const nx = (x - BRAIN.x) / BRAIN.rx;
			const ny = (y - BRAIN.y) / BRAIN.ry;
			const tx = (x - 29) / 7.5;
			const ty = (y - 35) / 4;
			const main = nx * nx + ny * ny < 1;
			const lower = tx * tx + ty * ty < 1;
			if (!main && !lower) {
				continue;
			}
			let colour = main ? brainTone(nx, ny) : brainTone(tx * 0.8, ty);
			// The winding folds.
			const fold =
				Math.sin(x * 0.95 + Math.sin(y * 0.8) * 2.2) +
				Math.sin(y * 1.15 - x * 0.35);
			if (fold > 1.25 && colour !== BRAIN_LIGHT) {
				colour = BRAIN_FOLD;
			}
			set(scene, x, y, colour);
		}
	}
	// The deep groove between the main lobe and the temporal lobe.
	for (const [x, y] of [
		[23, 34],
		[24, 34],
		[25, 33],
		[26, 33],
		[27, 33],
		[28, 32],
		[29, 32],
		[30, 32],
		[31, 31],
	]) {
		set(scene, x, y, BRAIN_FOLD);
	}
}

/**
 * The lid: a ridged brass screw cap on the jar's neck, with a knob on top.
 * @param {Canvas} scene
 */
function drawLid(scene) {
	rect(scene, 22, 15, 20, 2, AIR);
	rect(scene, 20, 10, 24, 5, C.brass);
	rect(scene, 20, 10, 24, 1, C.gold);
	rect(scene, 20, 14, 24, 1, C.lampFrame);
	for (let x = 22; x < 43; x += 3) {
		rect(scene, x, 11, 1, 3, C.lampFrame);
	}
	rect(scene, 20, 11, 1, 3, C.gold);
	// The knob.
	rect(scene, 28, 7, 8, 3, C.brass);
	rect(scene, 28, 7, 8, 1, C.gold);
	rect(scene, 34, 8, 2, 2, C.lampFrame);
}

/**
 * The base: a brass plinth the jar stands in, lit along its top.
 * @param {Canvas} scene
 */
function drawBase(scene) {
	rect(scene, 16, 50, 32, 5, C.brass);
	rect(scene, 16, 50, 32, 1, C.gold);
	rect(scene, 16, 54, 32, 1, C.lampFrame);
	rect(scene, 44, 51, 4, 3, C.lampFrame);
	for (const x of [19, 26, 37]) {
		set(scene, x, 52, C.lampGlow);
	}
}

/**
 * Bubbles rising through the liquid, round the brain.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBubbles(scene, random) {
	for (let i = 0; i < 7; i++) {
		const x = 24 + Math.floor(random() * 18);
		const y = JAR.liquid + 2 + Math.floor(random() * 26);
		const behind = get(scene, x, y);
		if (behind === LIQUID || behind === LIQUID_LIGHT) {
			set(scene, x, y, GLASS_LIGHT);
		}
	}
}

/** The tiny pictures, five columns by four rows: S sky, G gold, A amber, L lamp light, P pine, T trunk, R roof, W wall, D door and g grass. */
const PICTURES = [
	['SAGAS', 'SGLGS', 'SAGAS', 'ggggg'],
	['SPPPS', 'PPPPP', 'SSTSS', 'ggggg'],
	['SSRSS', 'SRRRS', 'SWDWS', 'gWDWg'],
];

/** The colour for each key in the pictures. */
const PICTURE_COLOURS = {
	S: C.daySky4,
	G: C.gold,
	A: C.amber,
	L: C.lampGlow,
	P: C.pine,
	T: C.timber,
	R: C.brickRed,
	W: C.sand,
	D: C.wood,
	g: C.grass,
};

/** Where each card sits on the path, as an angle: the sun at the back left, the tree at the right, the house in front. */
const CARD_ANGLES = [Math.PI * 1.08, -Math.PI * 0.06, Math.PI * 0.68];

/**
 * The picture cards: little cream frames, each holding one remembered thing.
 * @param {Canvas} cards
 */
function drawCards(cards) {
	CARD_ANGLES.forEach((angle, i) => {
		const centre = onOrbit(angle);
		const x = centre.x - 3;
		const y = centre.y - 4;
		rect(cards, x, y, 7, 7, C.creamLight);
		rect(cards, x, y + 6, 7, 1, C.creamShade);
		rect(cards, x + 6, y, 1, 7, C.creamShade);
		PICTURES[i].forEach((row, dy) => {
			[...row].forEach((key, dx) => {
				set(
					cards,
					x + 1 + dx,
					y + 1 + dy,
					PICTURE_COLOURS[
						/** @type {keyof typeof PICTURE_COLOURS} */ (key)
					]
				);
			});
		});
	});
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} over
 */
function stamp(canvas, over) {
	for (let i = 0; i < canvas.p.length; i++) {
		if (over.p[i]) {
			canvas.p[i] = over.p[i];
		}
	}
}
