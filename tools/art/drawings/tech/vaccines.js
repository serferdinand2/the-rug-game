// Vaccines: a glass syringe of pale pink vaccine lying across a white enamel tray, two small capped vials standing behind it, in daylight.
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

/** The pale clinic wall, lit where the window's light falls on it. */
const WALL = mix(C.ghost, C.stoneLight, 0.55);
const WALL_LIGHT = mix(WALL, C.white, 0.35);

/** The wooden counter the tray stands on, its grain and the shadows on it. */
const COUNTER = mix(C.timberLight, C.sand, 0.2);
const COUNTER_SHADE = mix(COUNTER, C.timber, 0.35);
const COUNTER_SHADOW = mix(COUNTER, C.timberShade, 0.55);

/** The white enamel tray, its navy lip and the shadows on its floor. */
const TRAY = [C.white, C.snow, C.snowShade];
const NAVY = mix(C.daySky1, C.ink, 0.35);
const TRAY_SHADOW = mix(C.snowShade, C.stoneLight, 0.3);

/** Glass: lit, base and shaded. */
const GLASS = [
	C.white,
	mix(C.white, C.daySky6, 0.55),
	mix(C.daySky6, C.stoneLight, 0.55),
];

/** The pale pink vaccine: lit, base and shaded. */
const PINK = [
	mix(C.brickRedLight, C.white, 0.75),
	mix(C.brickRedLight, C.white, 0.45),
	mix(C.brickRedLight, C.white, 0.12),
];

/** Steel for the plunger, the flange, the hub and the needle. */
const STEEL = [C.white, C.stoneLight, C.stone];

/** The rubber stopper on the plunger. */
const RUBBER = [C.stoneShade, mix(C.ink, C.stoneShade, 0.5)];

/** The graduation ticks on the barrel: plain marks, no numbers. */
const TICK = mix(C.brickRedShade, C.stoneShade, 0.5);

/** The tray's outer edge. */
const TRAY_BOX = { x: 3, y: 19, w: 58, h: 40, lip: 37 };

/** The syringe: where its thumb rest sits, and the direction it points, up and to the right. */
const SYRINGE = { x: 4, y: 55, dx: 56, dy: -29 };

/**
 * The syringe's parts along its length, from the thumb rest to the needle's tip, with their half-widths.
 * @type {readonly { part: string, from: number, to: number, half: number }[]}
 */
const PARTS = [
	{ part: 'thumb', from: 0, to: 3, half: 5 },
	{ part: 'rod', from: 3, to: 9, half: 1.5 },
	{ part: 'flange', from: 9, to: 12, half: 7.5 },
	{ part: 'barrel', from: 12, to: 44, half: 6.5 },
	{ part: 'hub', from: 44, to: 48, half: 3 },
];

/** Where the needle runs, along the syringe from its thumb rest. */
const NEEDLE = { from: 48, to: 60 };

/** Where the plunger's stopper and the vaccine sit inside the barrel. */
const STOPPER = { from: 15, to: 18.5 };

/** The two vials: their left column, their bottom row and their cap colours. */
const VIALS = [
	{ x: 9, bottom: 35, cap: [C.tealLight, C.teal, C.tealShade] },
	{ x: 21, bottom: 37, cap: [C.gold, C.amber, C.lampFrame] },
];

/**
 * Draws the Vaccines tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2296);

	drawRoom(layer, random);
	const tray = createCanvas(64, 64);
	drawTray(tray);
	outline(tray, C.ink);
	stamp(layer, tray);

	for (const vial of VIALS) {
		drawVial(scene, vial.x, vial.bottom, vial.cap);
	}
	const syringe = createCanvas(64, 64);
	drawSyringe(syringe);
	outline(syringe, C.ink);
	stamp(scene, syringe);
	castShadows(scene, layer);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 0,
		y: 0,
		radius: 46,
		colour: C.creamLight,
		strength: 0.3,
		steps: 2,
		skip: [C.ink],
	});
	drawDrop(scene);
	drawGleams(scene);
	return scene;
}

/**
 * The room: a pale wall with the window's light falling across its left side, and the wooden counter with a little grain.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoom(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = COUNTER;
			if (y < 15) {
				const shift = Math.floor(y * 0.5);
				colour = x >= 8 + shift && x < 24 + shift ? WALL_LIGHT : WALL;
			} else if (y === 15) {
				colour = COUNTER_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	// A few long streaks of grain.
	for (let i = 0; i < 10; i++) {
		const y = 17 + Math.floor(random() * 46);
		const x = Math.floor(random() * 56);
		rect(layer, x, y, 6 + Math.floor(random() * 12), 1, COUNTER_SHADE);
	}
}

/**
 * The enamel tray: a rounded white dish with a navy lip, its inner walls lit on the right and shaded on the left, and its front face below the lip.
 * @param {Canvas} tray
 */
function drawTray(tray) {
	const { x: left, y: top, w, h, lip } = TRAY_BOX;
	const right = left + w - 1;
	const bottom = top + h - 1;
	const lipBottom = top + lip - 1;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			if (!inRounded(x, y, left, top, right, bottom, 4)) {
				continue;
			}
			let colour = TRAY[1];
			if (y > lipBottom) {
				colour = y === bottom ? TRAY[2] : TRAY[1];
			} else if (
				!inRounded(x, y, left + 1, top + 1, right - 1, lipBottom - 1, 3)
			) {
				colour = NAVY;
			} else if (y <= top + 3) {
				colour = TRAY[0];
			} else if (x <= left + 3) {
				colour = TRAY[2];
			} else if (x >= right - 3) {
				colour = TRAY[0];
			}
			set(tray, x, y, colour);
		}
	}
	// The navy line where the lip turns down into the front face.
	rect(tray, left + 2, lipBottom, w - 4, 1, NAVY);
}

/**
 * Tells whether a point lies inside a rectangle with rounded corners.
 * @param {number} x
 * @param {number} y
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @param {number} r - The corner radius
 * @returns {boolean}
 */
function inRounded(x, y, left, top, right, bottom, r) {
	if (x < left || x > right || y < top || y > bottom) {
		return false;
	}
	const cx = Math.min(Math.max(x, left + r), right - r);
	const cy = Math.min(Math.max(y, top + r), bottom - r);
	return Math.hypot(x - cx, y - cy) <= r + 0.3;
}

/**
 * One small vial standing on the tray: a metal crimp cap, a glass neck and shoulder, and a body two-thirds full of vaccine. No label.
 * @param {Canvas} scene
 * @param {number} left - The vial's left column
 * @param {number} bottom - Its bottom row
 * @param {readonly Colour[]} cap - The cap's lit, base and shaded tones
 */
function drawVial(scene, left, bottom, cap) {
	const top = bottom - 19;
	// The crimp cap.
	for (let y = top; y < top + 3; y++) {
		for (let x = left + 1; x <= left + 8; x++) {
			const tone = x <= left + 2 ? 0 : x >= left + 7 ? 2 : 1;
			set(scene, x, y, y === top && tone === 1 ? cap[0] : cap[tone]);
		}
	}
	// The crimped ring and the neck.
	for (let x = left + 2; x <= left + 7; x++) {
		set(scene, x, top + 3, x >= left + 6 ? STEEL[2] : STEEL[1]);
		set(
			scene,
			x,
			top + 4,
			x === left + 3 ? GLASS[0] : x >= left + 6 ? GLASS[2] : GLASS[1]
		);
	}
	// The shoulder.
	for (let x = left + 1; x <= left + 8; x++) {
		set(
			scene,
			x,
			top + 5,
			x === left + 2 ? GLASS[0] : x >= left + 7 ? GLASS[2] : GLASS[1]
		);
	}
	// The body: empty glass above the vaccine, the vaccine below, a highlight down the left.
	const surface = top + 9;
	for (let y = top + 6; y < bottom; y++) {
		for (let x = left; x <= left + 9; x++) {
			const set3 = y >= surface ? PINK : GLASS;
			let colour = set3[1];
			if (x === left + 1) {
				colour = GLASS[0];
			} else if (x >= left + 8) {
				colour = set3[2];
			} else if (y === surface) {
				colour = PINK[0];
			}
			set(scene, x, y, colour);
		}
	}
	// The thick glass base.
	rect(scene, left + 1, bottom, 8, 1, GLASS[2]);
}

/**
 * The syringe, lying at a slant: thumb rest, plunger rod, finger flange, a glass barrel of vaccine with tick marks, the hub and the needle.
 * @param {Canvas} canvas
 */
function drawSyringe(canvas) {
	const length = Math.hypot(SYRINGE.dx, SYRINGE.dy);
	const ux = SYRINGE.dx / length;
	const uy = SYRINGE.dy / length;
	// Across the syringe, towards its lower (shaded) side.
	const vx = -uy;
	const vy = ux;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const px = x - SYRINGE.x;
			const py = y - SYRINGE.y;
			const u = px * ux + py * uy;
			const v = px * vx + py * vy;
			const colour = syringeColour(u, v);
			if (colour) {
				set(canvas, x, y, colour);
			}
		}
	}
	// The needle, a one-pixel steel line from the hub to the tip.
	const from = NEEDLE.from;
	const to = NEEDLE.to;
	line(
		canvas,
		Math.round(SYRINGE.x + ux * from),
		Math.round(SYRINGE.y + uy * from),
		Math.round(SYRINGE.x + ux * to),
		Math.round(SYRINGE.y + uy * to),
		STEEL[1]
	);
}

/**
 * The syringe's colour at a point, measured along it from the thumb rest (u) and across it from its axis (v, positive on the shaded side).
 * @param {number} u
 * @param {number} v
 * @returns {Colour | null}
 */
function syringeColour(u, v) {
	const part = PARTS.find((p) => u >= p.from && u < p.to);
	if (!part) {
		return null;
	}
	let half = part.half;
	if (part.part === 'hub') {
		half -= ((u - part.from) / (part.to - part.from)) * 1.4;
	}
	if (Math.abs(v) > half) {
		return null;
	}
	const edge = v / half;
	if (part.part === 'rod') {
		return edge < 0 ? STEEL[1] : STEEL[2];
	}
	if (part.part !== 'barrel') {
		return STEEL[edge < -0.4 ? 0 : edge > 0.4 ? 2 : 1];
	}
	// The glass barrel: the stopper, then the vaccine, then the barrel's open end by the flange.
	const inner = Math.abs(v) < half - 1;
	if (inner && u >= STOPPER.from && u < STOPPER.to) {
		return edge < -0.2 ? RUBBER[0] : RUBBER[1];
	}
	const filled = inner && u >= STOPPER.to && u < part.to - 1;
	const tones = filled ? PINK : GLASS;
	// Tick marks across the upper half of the barrel, every three pixels.
	const tick = Math.round(u - STOPPER.to);
	if (filled && tick % 3 === 0 && tick > 0 && v > -3.5 && v < -0.5) {
		return TICK;
	}
	if (edge < -0.55 && edge > -0.85) {
		return GLASS[0];
	}
	return tones[edge > 0.5 ? 2 : 1];
}

/**
 * Every painted pixel of the vials and the syringe casts a flat shadow, down and to the right, away from the window.
 * @param {Canvas} scene
 * @param {Canvas} layer
 */
function castShadows(scene, layer) {
	/** @type {Map<Colour, Colour>} */
	const shadows = new Map([
		[TRAY[0], TRAY_SHADOW],
		[TRAY[1], TRAY_SHADOW],
		[TRAY[2], mix(TRAY_SHADOW, C.stone, 0.4)],
		[COUNTER, COUNTER_SHADOW],
		[COUNTER_SHADE, COUNTER_SHADOW],
	]);
	/** @type {[number, number, Colour][]} */
	const marks = [];
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!get(scene, x, y)) {
				continue;
			}
			const below = get(layer, x + 3, y + 2);
			const shadow = below ? shadows.get(below) : undefined;
			if (shadow) {
				marks.push([x + 3, y + 2, shadow]);
			}
		}
	}
	for (const [x, y, colour] of marks) {
		set(layer, x, y, colour);
	}
}

/**
 * A bead of vaccine at the needle's tip.
 * @param {Canvas} scene
 */
function drawDrop(scene) {
	const length = Math.hypot(SYRINGE.dx, SYRINGE.dy);
	const x = Math.round(SYRINGE.x + (SYRINGE.dx / length) * NEEDLE.to);
	const y = Math.round(SYRINGE.y + (SYRINGE.dy / length) * NEEDLE.to);
	set(scene, x + 1, y + 1, PINK[1]);
	set(scene, x + 1, y + 2, PINK[2]);
	set(scene, x + 2, y + 1, C.white);
}

/**
 * The last gleams of daylight on the barrel, the caps and the tray's lip.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[11, 16],
		[12, 16],
		[23, 18],
		[24, 18],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * Copies every painted pixel of a part, outline and all, onto a canvas.
 * @param {Canvas} canvas
 * @param {Canvas} part
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}
