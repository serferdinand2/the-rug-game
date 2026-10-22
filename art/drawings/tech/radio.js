// Radio: a wooden arched cabinet radio on a table at night, its dial glowing and sound rippling out from its cloth grille.
import {
	createCanvas,
	get,
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

/** The cabinet: its centre column, the radius of its arched top, the row the arch springs from and its last row. */
const CAB = { cx: 31.5, r: 19, archY: 24, bottom: 47 };

/** The speaker grille, an arch inside the cabinet's arch: its radius and last row. */
const GRILLE = { r: 12, bottom: 33 };

/** The half-moon dial: the middle of its straight bottom edge and its radius. */
const DIAL = { x: 31.5, y: 45, r: 7.5 };

/** The two knobs either side of the dial. */
const KNOBS = [
	{ x: 19, y: 42 },
	{ x: 44, y: 42 },
];

/** The rows of the dado rail, the table's far edge and its front edge. */
const ROWS = { rail: 36, table: 50, front: 58 };

/** The night room: a dusky violet wall above the rail, a darker panel below it. */
const WALL = mix(C.roof, C.roofLight, 0.35);
const WAINSCOT = mix(C.roof, C.roofShade, 0.35);
const RAIL = mix(C.roofLight, C.railLight, 0.3);

/** The table: its top, its lit front edge and its front in shadow, and the radio's shadow on it. */
const TABLE = mix(C.floor, C.floorShade, 0.3);
const TABLE_EDGE = C.floorLight;
const TABLE_FRONT = C.floorShade;
const SHADOW = mix(C.floorShade, C.ink, 0.45);

/** The speaker cloth: a warm tan weave and its shade. */
const CLOTH = mix(C.sand, C.sandShade, 0.6);
const CLOTH_SHADE = mix(C.sandShade, C.timber, 0.55);

/** The glowing dial face and its rim. */
const DIAL_FACE = mix(C.lampGlow, C.gold, 0.3);
const DIAL_RIM = C.gold;

/**
 * Draws the Radio tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7310);

	drawRoom(layer);
	drawWaves(layer);

	drawCabinet(scene, random);
	drawGrille(scene);
	drawDial(scene);
	drawKnobs(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 31,
		y: 42,
		radius: 10,
		colour: C.lampGlow,
		strength: 0.2,
		steps: 1,
		skip: [C.ink, DIAL_FACE, DIAL_RIM, C.lampFrame, C.brickRed],
	});
	drawGleams(scene);
	return scene;
}

/**
 * The room: the two-tone wall with its rail, the table top and its front, and the radio's shadow.
 * @param {Canvas} layer
 */
function drawRoom(layer) {
	rect(layer, 0, 0, 64, ROWS.rail, WALL);
	rect(layer, 0, ROWS.rail, 64, 1, RAIL);
	rect(layer, 0, ROWS.rail + 1, 64, ROWS.table - ROWS.rail - 1, WAINSCOT);
	rect(layer, 0, ROWS.table, 64, ROWS.front - ROWS.table, TABLE);
	rect(layer, 0, ROWS.front, 64, 1, TABLE_EDGE);
	rect(layer, 0, ROWS.front + 1, 64, 64 - ROWS.front - 1, TABLE_FRONT);
	// The shadow falls to the right, away from the lamp on the left.
	rect(layer, 50, ROWS.table, 8, 3, SHADOW);
	rect(layer, 50, ROWS.table + 3, 5, 1, SHADOW);
}

/**
 * Sound rippling out of the grille: three arcs on each side, fading as they spread.
 * @param {Canvas} layer
 */
function drawWaves(layer) {
	const centre = { x: CAB.cx, y: 22 };
	const rings = [
		{ r: 22, t: 0.75 },
		{ r: 26.5, t: 0.5 },
		{ r: 31, t: 0.3 },
	];
	for (const { r, t } of rings) {
		for (let a = -0.75; a <= 0.75; a += 0.01) {
			for (const side of [-1, 1]) {
				const x = Math.round(centre.x + side * Math.cos(a) * r);
				const y = Math.round(centre.y + Math.sin(a) * r);
				const behind = get(layer, x, y);
				if (behind && y < ROWS.table) {
					set(layer, x, y, mix(behind, C.gold, t));
				}
			}
		}
	}
}

/**
 * How far a pixel lies inside the cabinet, from its nearest edge; negative outside.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function depth(x, y) {
	const dx = x - CAB.cx;
	const dy = y - CAB.archY;
	const side =
		y < CAB.archY ? CAB.r - Math.hypot(dx, dy) : CAB.r - Math.abs(dx);
	return Math.min(side, CAB.bottom + 1 - y);
}

/**
 * Picks a wood tone for the cabinet's rounded rim by how much it faces the lamp on the upper left.
 * @param {number} x
 * @param {number} y
 * @returns {Colour}
 */
function rimTone(x, y) {
	const dx = x - CAB.cx;
	const dy = y - CAB.archY;
	let nx = Math.sign(dx);
	let ny = 0;
	if (y < CAB.archY) {
		const length = Math.hypot(dx, dy) || 1;
		nx = dx / length;
		ny = dy / length;
	}
	if (CAB.bottom + 1 - y < CAB.r - Math.abs(dx)) {
		nx = 0;
		ny = 1;
	}
	const facing = (-nx - ny) / Math.SQRT2;
	if (facing > 0.35) {
		return C.timberLight;
	}
	if (facing < -0.35) {
		return C.timberShade;
	}
	return C.timber;
}

/**
 * The cabinet: the rounded rim, the flat front frame, the bevel into the front panel, and the plinth it stands on.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawCabinet(scene, random) {
	for (let y = 0; y <= CAB.bottom; y++) {
		for (let x = 0; x < 64; x++) {
			const d = depth(x, y);
			if (d <= 0) {
				continue;
			}
			let colour = C.timber;
			if (d < 2) {
				colour = rimTone(x, y);
			} else if (d >= 4 && d < 5) {
				// The bevel: shadowed under the frame at the top and left, lit at the bottom and right.
				const dx = x - CAB.cx;
				colour =
					dx > CAB.r - 6 || y > CAB.bottom - 5
						? C.timberLight
						: C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The plinth: a wider step under the cabinet, lit along its top.
	const left = Math.floor(CAB.cx - CAB.r) - 2;
	const width = CAB.r * 2 + 5;
	rect(scene, left, CAB.bottom + 1, width, 1, C.timberLight);
	rect(scene, left, CAB.bottom + 2, width, 2, C.timber);
	rect(scene, left, CAB.bottom + 4, width, 1, C.timberShade);
	set(scene, left + width - 1, CAB.bottom + 2, C.timberShade);
	set(scene, left + width - 1, CAB.bottom + 3, C.timberShade);
	// A little grain along the plinth's front.
	for (let i = 0; i < 4; i++) {
		const x = left + 3 + Math.floor(random() * (width - 10));
		const y = CAB.bottom + 2 + Math.floor(random() * 2);
		rect(scene, x, y, 3 + Math.floor(random() * 3), 1, C.timberShade);
	}
}

/**
 * Whether a pixel lies inside an arch centred on the cabinet's arch.
 * @param {number} x
 * @param {number} y
 * @param {number} r - The arch's radius
 * @param {number} bottom - Its last row
 * @returns {boolean}
 */
function inArch(x, y, r, bottom) {
	if (y > bottom) {
		return false;
	}
	const dx = x - CAB.cx;
	const dy = y - CAB.archY;
	return y >= CAB.archY ? Math.abs(dx) < r : Math.hypot(dx, dy) < r;
}

/**
 * The speaker grille: a dark recess, the cloth shaded under its top and left, and three wooden fret bars.
 * @param {Canvas} scene
 */
function drawGrille(scene) {
	for (let y = 0; y <= GRILLE.bottom + 1; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inArch(x, y, GRILLE.r + 1, GRILLE.bottom + 1)) {
				continue;
			}
			if (!inArch(x, y, GRILLE.r, GRILLE.bottom)) {
				set(scene, x, y, C.wood);
				continue;
			}
			const shaded =
				!inArch(x - 1, y - 1, GRILLE.r, GRILLE.bottom) ||
				!inArch(x - 2, y - 2, GRILLE.r, GRILLE.bottom);
			set(scene, x, y, shaded ? CLOTH_SHADE : CLOTH);
		}
	}
	// The fret bars, lit on their left edge, with a fine weave between them.
	for (let y = 0; y <= GRILLE.bottom; y += 2) {
		for (let x = 0; x < 64; x += 2) {
			if (
				inArch(x - 2, y - 2, GRILLE.r, GRILLE.bottom) &&
				inArch(x, y, GRILLE.r, GRILLE.bottom) &&
				(x + y) % 4 === 0
			) {
				set(scene, x, y, CLOTH_SHADE);
			}
		}
	}
	for (const bx of [24, 31, 38]) {
		for (let y = 0; y <= GRILLE.bottom; y++) {
			if (inArch(bx, y, GRILLE.r, GRILLE.bottom)) {
				set(scene, bx, y, C.timber);
				set(scene, bx + 1, y, C.timberShade);
				set(scene, bx + 2, y, CLOTH_SHADE);
			}
		}
	}
}

/**
 * The half-moon dial: a glowing face with tick marks and no numbers, a red needle, and a brass bezel.
 * @param {Canvas} scene
 */
function drawDial(scene) {
	const { x: cx, y: cy, r } = DIAL;
	const reach = Math.ceil(r) + 2;
	for (let y = cy - reach; y <= cy + 1; y++) {
		for (let x = Math.floor(cx - reach); x <= cx + reach; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (y > cy) {
				if (Math.abs(dx) < r + 1.5) {
					set(scene, x, y, C.brass);
				}
				continue;
			}
			if (d < r) {
				set(scene, x, y, d > r - 1.5 ? DIAL_RIM : DIAL_FACE);
			} else if (d < r + 1.5) {
				set(scene, x, y, dx - dy < 0 && dx < 2 ? C.gold : C.brass);
			}
		}
	}
	// The ticks round the arc: long at the ends and the middle, short between.
	for (let i = 0; i <= 8; i++) {
		const angle = Math.PI * (i / 8);
		const inner = i % 4 === 0 ? r - 3 : r - 2;
		for (let k = inner; k <= r - 1; k += 0.5) {
			set(
				scene,
				Math.round(cx - Math.cos(angle) * k),
				Math.round(cy - Math.sin(angle) * k),
				C.lampFrame
			);
		}
	}
	// The needle, swung a little left of centre.
	line(scene, Math.round(cx), cy, Math.round(cx - 2), cy - 5, C.brickRed);
	set(scene, Math.round(cx), cy, C.lampFrame);
}

/**
 * The two round knobs: dark wood, lit on the upper left, with a brass cap.
 * @param {Canvas} scene
 */
function drawKnobs(scene) {
	for (const knob of KNOBS) {
		for (let y = knob.y - 3; y <= knob.y + 3; y++) {
			for (let x = knob.x - 3; x <= knob.x + 3; x++) {
				const dx = x - knob.x;
				const dy = y - knob.y;
				const d = Math.hypot(dx, dy);
				if (d >= 3.3) {
					continue;
				}
				let colour = C.timberShade;
				if (dx + dy > 2) {
					colour = C.wood;
				} else if (dx + dy < -2.5) {
					colour = C.timber;
				}
				set(scene, x, y, colour);
			}
		}
		set(scene, knob.x, knob.y, C.brass);
		set(scene, knob.x - 1, knob.y - 1, C.timberLight);
	}
}

/**
 * The last gleams of light on the arch and the dial's bezel, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[24, 8],
		[23, 9],
		[14, 22],
		[14, 23],
		[26, 39],
	]) {
		set(scene, x, y, C.lampGlow);
	}
}
