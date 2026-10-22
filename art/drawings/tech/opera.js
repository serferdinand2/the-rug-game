// Opera: gilt and pearl opera glasses resting on the red velvet ledge of a box at night, the lit stage small and far below.
import {
	createCanvas,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The rows of the ledge: its velvet top, its rounded front, the gilt moulding and the box front below. */
const LEDGE = { top: 43, front: 48, gilt: 53, panel: 56 };

/** The stage, far off and below, its boards hidden behind the ledge: its left column, top row, width and height. */
const STAGE = { x: 1, y: 26, w: 19, h: 17 };

/**
 * The glasses' barrels, the far one first. Each runs back from its big front lens (`x`, `y`) along `AXIS`
 * to its eyepiece, narrowing from `FRONT` to `BACK` in radius, so it flares towards the lens; `SQUASH`
 * narrows each round end into an ellipse seen at an angle. The eyepiece sticks out behind the barrel.
 */
const BARRELS = [
	{ x: 34, y: 24 },
	{ x: 28, y: 34 },
];
const AXIS = { x: 0.95, y: -0.2, length: 14 };
const FRONT = 11.5;
const BACK = 7;
const SQUASH = 0.48;
const EYEPIECE = { length: 3, radius: 4.5 };

/** The dark house: a plum shadow above, a little lighter lower down where the stage's light reaches. */
const HOUSE = mix(C.roofShade, C.brickRedShade, 0.35);
const HOUSE_LIGHT = mix(C.roof, C.brickRedShade, 0.45);

/** The far tiers of boxes: their dim red fronts, their gilt rails and a few lit sconces. */
const TIER = mix(C.brickRedShade, C.roofShade, 0.3);
const TIER_RAIL = mix(C.brass, C.roof, 0.45);
const SCONCE = mix(C.gold, C.lampGlow, 0.5);

/** The red velvet: lit, plain and shaded, and the shadow the glasses cast on it. */
const VELVET_LIGHT = C.brickRedLight;
const VELVET = C.brickRed;
const VELVET_SHADE = C.brickRedShade;
const VELVET_SHADOW = mix(C.brickRedShade, C.ink, 0.35);

/** The box front below the moulding. */
const PANEL = mix(C.brickRedShade, C.ink, 0.3);

/** Mother-of-pearl on the barrels, with a faint violet sheen. */
const PEARL_LIGHT = C.white;
const PEARL = mix(C.cream, C.arcaneLight, 0.2);
const PEARL_SHADE = mix(C.creamShade, C.arcaneShade, 0.2);

/** The lenses: deep blue glass, and the sheen across it. */
const GLASS = C.nightSea3;
const GLASS_SHEEN = C.nightSea1;

/**
 * Draws the Opera tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8823);

	drawHouse(layer);
	drawStage(layer);
	glow(layer, {
		x: STAGE.x + Math.floor(STAGE.w / 2),
		y: STAGE.y + Math.floor(STAGE.h / 2),
		radius: 26,
		colour: C.amber,
		strength: 0.36,
		steps: 3,
		skip: [C.lampGlow, C.gold, C.amber, C.brass, C.brickRed, C.ink],
	});
	drawLedge(layer, random);

	const back = createCanvas(64, 64);
	drawBarrel(back, BARRELS[0]);
	drawWheel(back);
	outline(back, C.ink);
	const front = createCanvas(64, 64);
	drawHandle(front);
	drawBarrel(front, BARRELS[1]);
	outline(front, C.ink);
	stamp(back, front);
	stamp(scene, back);
	outline(scene, C.ink);
	// The stage's warm light falls on the glasses' near side.
	glow(scene, {
		x: STAGE.x + Math.floor(STAGE.w / 2),
		y: STAGE.y + Math.floor(STAGE.h / 2),
		radius: 34,
		colour: C.amber,
		strength: 0.24,
		steps: 2,
		skip: [C.ink, GLASS, GLASS_SHEEN],
	});
	underlay(scene, layer);

	drawGlints(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * The dark house beyond the ledge: plum shadow and the far tiers of boxes, sweeping down towards the stage.
 * @param {Canvas} layer
 */
function drawHouse(layer) {
	rect(layer, 0, 0, 64, LEDGE.top, HOUSE);
	rect(layer, 0, 21, 64, LEDGE.top - 21, HOUSE_LIGHT);
	for (const top of [4, 13]) {
		for (let x = 0; x < 64; x++) {
			const y = top + Math.floor((63 - x) / 14);
			if (y + 3 >= STAGE.y && x < STAGE.x + STAGE.w + 1) {
				continue;
			}
			rect(layer, x, y, 1, 4, TIER);
			set(layer, x, y, TIER_RAIL);
			if (x % 9 === 4) {
				set(layer, x, y + 2, SCONCE);
			}
		}
	}
}

/**
 * The stage, small and far below: a gilt arched frame round a lit backdrop, red curtains drawn back, and two singers.
 * Its boards lie below the ledge, out of sight.
 * @param {Canvas} layer
 */
function drawStage(layer) {
	const { x, y, w, h } = STAGE;
	// The gilt frame, arched across its top.
	rect(layer, x, y + 2, w, h - 2, C.brass);
	rect(layer, x + 1, y + 1, w - 2, 1, C.brass);
	rect(layer, x + 3, y, w - 6, 1, C.brass);
	// The lit backdrop, warmer near the footlights.
	rect(layer, x + 2, y + 2, w - 4, h - 2, C.lampGlow);
	rect(layer, x + 2, y + h - 5, w - 4, 5, C.gold);
	// The red valance and the curtains drawn back at each side.
	rect(layer, x + 2, y + 2, w - 4, 2, C.brickRed);
	rect(layer, x + 2, y + 4, 2, h - 4, C.brickRed);
	rect(layer, x + w - 4, y + 4, 2, h - 4, C.brickRed);
	set(layer, x + 4, y + 4, C.brickRed);
	set(layer, x + w - 5, y + 4, C.brickRed);
	// Two singers in a duet, dark against the light: a cloaked tenor and a soprano in a red gown.
	const floor = y + h - 1;
	const tx = x + 7;
	set(layer, tx, floor - 7, C.ink);
	rect(layer, tx - 1, floor - 6, 3, 7, C.ink);
	set(layer, tx + 2, floor - 5, C.ink);
	const sx = x + 12;
	set(layer, sx, floor - 7, C.ink);
	rect(layer, sx, floor - 6, 1, 3, C.brickRedShade);
	set(layer, sx - 1, floor - 5, C.brickRedShade);
	rect(layer, sx - 1, floor - 3, 3, 4, C.brickRedShade);
}

/**
 * The ledge of the box: its velvet top with a few crushed marks, the rounded front, the gilt moulding and the dark box front.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLedge(layer, random) {
	rect(layer, 0, LEDGE.top, 64, LEDGE.front - LEDGE.top, VELVET);
	rect(layer, 0, LEDGE.top, 64, 1, VELVET_SHADE);
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 62);
		const y = LEDGE.top + 1 + Math.floor(random() * 4);
		rect(layer, x, y, 2, 1, random() < 0.5 ? VELVET_SHADE : VELVET_LIGHT);
	}
	// The glasses' shadow on the velvet, falling right, away from the box's lamp.
	for (let y = LEDGE.top; y < LEDGE.front; y++) {
		for (let x = 20; x < 64; x++) {
			if (Math.hypot((x - 43) / 20, (y - 45) / 2.4) < 1) {
				set(layer, x, y, VELVET_SHADOW);
			}
		}
	}
	rect(layer, 0, LEDGE.front, 64, 1, VELVET_LIGHT);
	rect(layer, 0, LEDGE.front + 1, 64, 3, VELVET);
	rect(layer, 0, LEDGE.gilt - 1, 64, 1, VELVET_SHADE);
	rect(layer, 0, LEDGE.gilt, 64, 1, C.gold);
	rect(layer, 0, LEDGE.gilt + 1, 64, 1, C.brass);
	rect(layer, 0, LEDGE.gilt + 2, 64, 1, C.lampFrame);
	for (let x = 2; x < 64; x += 6) {
		set(layer, x, LEDGE.gilt + 1, C.gold);
	}
	rect(layer, 0, LEDGE.panel, 64, 64 - LEDGE.panel, PANEL);
	rect(layer, 0, 61, 64, 1, mix(C.brass, PANEL, 0.6));
}

/**
 * Fills an upright ellipse, choosing each pixel's colour by its row.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {(y: number) => Colour} tone
 */
function fillEllipse(canvas, cx, cy, rx, ry, tone) {
	for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
		for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
			if (Math.hypot((x - cx) / rx, (y - cy) / ry) <= 1) {
				set(canvas, x, y, tone(y));
			}
		}
	}
}

/**
 * Picks a tone for a rounded surface by how high on it a row lies: lit on top, shaded underneath.
 * @param {number} v - From -1 at the top to 1 at the bottom
 * @param {[Colour, Colour, Colour]} tones - Lit, plain and shaded
 * @returns {Colour}
 */
function shade(v, [lit, plain, shaded]) {
	if (v < -0.5) {
		return lit;
	}
	return v > 0.4 ? shaded : plain;
}

/**
 * One barrel: its gilt eyepiece, a pearl tube flaring out from it, ringed with gilt bands, then its big front lens in a gilt rim.
 * @param {Canvas} canvas
 * @param {{ x: number, y: number }} at - The centre of the front lens
 */
function drawBarrel(canvas, at) {
	/** @type {[Colour, Colour, Colour]} */
	const gilt = [C.lampGlow, C.gold, C.amber];
	/** @type {[Colour, Colour, Colour]} */
	const pearl = [PEARL_LIGHT, PEARL, PEARL_SHADE];
	/** @type {[Colour, Colour, Colour]} */
	const dark = [C.gold, C.brass, C.lampFrame];
	const steps = (AXIS.length + EYEPIECE.length) * 2;
	for (let i = steps; i >= 0; i--) {
		const along = i / 2;
		const cx = at.x + AXIS.x * along;
		const cy = at.y + AXIS.y * along;
		const t = along / AXIS.length;
		const eyepiece = t > 1;
		const r = eyepiece ? EYEPIECE.radius : FRONT + (BACK - FRONT) * t;
		let tones = pearl;
		if (eyepiece) {
			tones = dark;
		} else if (t < 0.14 || Math.abs(t - 0.6) < 0.05 || t > 0.93) {
			tones = gilt;
		}
		fillEllipse(canvas, cx, cy, r * SQUASH, r, (y) =>
			shade((y - cy) / r, tones)
		);
	}
	// The front lens: a gilt rim round deep glass, the glass catching a sheen on its upper left.
	const rx = FRONT * SQUASH;
	for (let y = Math.floor(at.y - FRONT); y <= at.y + FRONT; y++) {
		for (let x = Math.floor(at.x - rx); x <= at.x + rx; x++) {
			const dx = (x - at.x) / rx;
			const dy = (y - at.y) / FRONT;
			const d = Math.hypot(dx, dy);
			if (d > 1) {
				continue;
			}
			if (d > 0.74) {
				set(canvas, x, y, shade(dy, gilt));
			} else {
				set(canvas, x, y, dx + dy < -0.45 ? GLASS_SHEEN : GLASS);
			}
		}
	}
}

/**
 * The ridged focus wheel on the hinge between the barrels, just behind their eyepieces.
 * @param {Canvas} canvas
 */
function drawWheel(canvas) {
	const [far] = BARRELS;
	const wx = Math.round(far.x + AXIS.x * AXIS.length) + 2;
	const wy = Math.round(far.y + AXIS.y * AXIS.length) + 6;
	rect(canvas, wx, wy, 4, 6, C.brass);
	for (let y = wy + 1; y < wy + 6; y += 2) {
		rect(canvas, wx, y, 4, 1, C.lampFrame);
	}
	rect(canvas, wx, wy, 4, 1, C.gold);
}

/**
 * The lorgnette handle: a gilt rod running from the near barrel down onto the ledge, ending in a pearl knob.
 * @param {Canvas} canvas
 */
function drawHandle(canvas) {
	const near = BARRELS[1];
	const start = { x: near.x + 12, y: near.y + 3 };
	const end = { x: 59, y: 45 };
	line(canvas, start.x, start.y, end.x, end.y, C.gold);
	line(canvas, start.x, start.y + 1, end.x, end.y + 1, C.amber);
	rect(canvas, end.x, end.y - 1, 3, 3, PEARL);
	set(canvas, end.x, end.y - 1, PEARL_LIGHT);
	set(canvas, end.x + 2, end.y + 1, PEARL_SHADE);
}

/**
 * The stage's light caught in each lens, and a glint on the near rim, over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const { x, y } of BARRELS) {
		set(scene, x - 2, y - 4, C.white);
		set(scene, x - 1, y - 5, C.foam);
		set(scene, x + 1, y + 3, C.amber);
		set(scene, x + 1, y + 2, C.gold);
	}
	set(scene, BARRELS[1].x - 3, BARRELS[1].y - 9, C.white);
}
