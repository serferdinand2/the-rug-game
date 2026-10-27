// Astrolabe: a brass astrolabe hanging from a hand by its ring against the starry night, its pierced rete and pointer catching the moonlight.
import {
	createCanvas,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The disc: its centre, its outer radius and the inner radius of its raised rim (the limb). */
const DISC = { x: 31.5, y: 37.5, r: 20, limb: 17 };

/** The rete's two rings: the outer ring's inner and outer radius, and the off-centre ecliptic ring. */
const RETE = {
	inner: 13.5,
	outer: 15.5,
	eclipticDy: -4.5,
	eclipticIn: 8.5,
	eclipticOut: 10.5,
};

/** The pointer (the rule) across the face: its angle in radians and its half length. */
const RULE = { angle: -0.6, reach: 16 };

/** The suspension ring above the throne: its centre and radii. */
const RING = { x: 31.5, y: 10.5, r: 3.4, hole: 1.8 };

/** The moon in the upper left corner, the light that catches the brass. */
const MOON = { x: 8, y: 9, r: 6 };

/** The night sky from the top down, in bands. */
const SKY = [C.nightSky2, C.nightSky3, C.nightSky4, C.nightSky5, C.nightSky6];

/** The far hills along the bottom. */
const HILL = mix(C.headland, C.nightSky3, 0.3);
const HILL_RIDGE = mix(C.headlandRidge, C.nightSky5, 0.3);

/** The plate under the rete, deep in its own shadow, and the lines engraved on it. */
const PLATE = mix(C.lampFrame, C.wood, 0.4);
const ENGRAVE = mix(C.lampFrame, C.brass, 0.35);
const PLATE_SHADOW = mix(C.wood, C.ink, 0.3);

/** The hand: skin, its shade and its lit edge, and the cuff of a dark sleeve. */
const SKIN = C.skin;
const SKIN_SHADE = C.skinShade;
const SKIN_LIGHT = mix(C.skin, C.lampGlow, 0.45);
const SLEEVE = C.roof;
const SLEEVE_LIGHT = C.roofLight;

/**
 * Draws the Astrolabe tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5280);

	drawSky(layer, random);
	drawMoon(layer);
	drawHills(layer);
	glow(layer, {
		x: DISC.x,
		y: DISC.y,
		radius: 34,
		colour: C.starDim,
		strength: 0.16,
		steps: 2,
		skip: [C.white, C.starDim, C.moon, C.moonRim],
	});

	drawThrone(scene);
	drawRing(scene);
	drawDisc(scene);
	drawRete(scene);
	const rule = createCanvas(64, 64);
	drawRule(rule);
	outline(rule, C.ink);
	stamp(scene, rule);
	const hand = createCanvas(64, 64);
	drawHand(hand);
	outline(hand, C.ink);
	stamp(scene, hand);
	outline(scene, C.ink);
	glow(scene, {
		x: 14,
		y: 18,
		radius: 30,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 2,
		skip: [
			C.ink,
			C.lampGlow,
			C.white,
			SKIN,
			SKIN_LIGHT,
			SKIN_SHADE,
			SLEEVE,
		],
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
 * How much a point on a round edge faces the moon on the upper left, from -1 (away) to 1 (towards).
 * @param {number} dx - From the round shape's centre
 * @param {number} dy
 * @returns {number}
 */
function facing(dx, dy) {
	const length = Math.hypot(dx, dy) || 1;
	return (-dx - dy) / (length * Math.SQRT2);
}

/**
 * The night sky in bands, lightest at the hills, with dim stars and a few bright ones.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	const band = 11;
	for (let y = 0; y < 64; y++) {
		const i = Math.min(SKY.length - 1, Math.floor(y / band));
		rect(layer, 0, y, 64, 1, SKY[i]);
	}
	for (let i = 0; i < 34; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 52);
		set(layer, x, y, C.starDim);
	}
	for (const [x, y] of [
		[55, 7],
		[50, 19],
		[6, 30],
		[58, 40],
		[19, 13],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, C.starDim);
		}
	}
}

/**
 * The moon in the upper left: a pale disc with a warm rim on the side away from the viewer's eye.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: mx, y: my, r } = MOON;
	for (let y = my - r - 1; y <= my + r + 1; y++) {
		for (let x = mx - r - 1; x <= mx + r + 1; x++) {
			const d = Math.hypot(x - mx, y - my);
			if (d < r) {
				const rim = d > r - 1.5 && x - mx + (y - my) > 1;
				set(layer, x, y, rim ? C.moonRim : C.moon);
			}
		}
	}
	set(layer, mx - 2, my + 1, C.moonRim);
	set(layer, mx - 1, my + 1, C.moonRim);
	set(layer, mx + 1, my - 2, C.moonRim);
}

/**
 * The low far hills along the bottom, their ridge touched by the moon.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			55 + 2 * Math.sin(x * 0.13) + 1.5 * Math.sin(x * 0.31 + 1)
		);
		rect(layer, x, top, 1, 64 - top, HILL);
		set(layer, x, top, HILL_RIDGE);
	}
}

/**
 * The suspension ring at the top, a brass loop lit on its upper left.
 * @param {Canvas} scene
 */
function drawRing(scene) {
	const { x: rx, y: ry, r, hole } = RING;
	for (let y = Math.floor(ry - r - 1); y <= ry + r + 1; y++) {
		for (let x = Math.floor(rx - r - 1); x <= rx + r + 1; x++) {
			const dx = x - rx;
			const dy = y - ry;
			const d = Math.hypot(dx, dy);
			if (d < r && d >= hole) {
				const f = facing(dx, dy);
				set(
					scene,
					x,
					y,
					f > 0.3 ? C.gold : f < -0.3 ? C.lampFrame : C.brass
				);
			}
		}
	}
}

/**
 * The throne: the lobed brass bracket that joins the ring to the disc, with one round piercing.
 * @param {Canvas} scene
 */
function drawThrone(scene) {
	const top = { x: DISC.x, y: DISC.y - DISC.r + 0.5 };
	for (let y = 9; y < DISC.y - DISC.r + 4; y++) {
		for (let x = 20; x < 44; x++) {
			const dx = x - top.x;
			const main = Math.hypot(dx, y - (top.y - 2.5)) < 4.6;
			const lobe = Math.hypot(Math.abs(dx) - 5, y - top.y) < 3.2;
			if (!main && !lobe) {
				continue;
			}
			const f = main ? facing(dx, y - (top.y - 2.5)) : facing(dx, -1);
			set(
				scene,
				x,
				y,
				f > 0.45 ? C.gold : f < -0.45 ? C.lampFrame : C.brass
			);
		}
	}
	// The piercing, dark through the bracket.
	rect(scene, 31, 16, 2, 2, C.ink);
}

/**
 * The disc: the raised limb with its tick marks, round the dark plate with its engraved lines.
 * @param {Canvas} scene
 */
function drawDisc(scene) {
	const { x: cx, y: cy, r, limb } = DISC;
	for (let y = Math.floor(cy - r); y <= cy + r; y++) {
		for (let x = Math.floor(cx - r); x <= cx + r; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d >= r) {
				continue;
			}
			const f = facing(dx, dy);
			if (d >= limb) {
				let colour = C.brass;
				if (d > r - 1.3) {
					colour =
						f > 0.35 ? C.gold : f < -0.4 ? C.lampFrame : C.brass;
				} else if (d < limb + 1) {
					// The limb's inner wall: in shade where it faces away from the moon.
					colour =
						f > 0.35 ? C.lampFrame : f < -0.35 ? C.gold : C.brass;
				}
				set(scene, x, y, colour);
				continue;
			}
			set(scene, x, y, engraved(dx, dy) ? ENGRAVE : PLATE);
		}
	}
	// The ticks round the limb: short ones, and a long one at every third.
	for (let i = 0; i < 24; i++) {
		const angle = (i / 24) * Math.PI * 2;
		const from = i % 3 === 0 ? limb + 1 : limb + 1.8;
		for (let k = from; k <= r - 1.6; k += 0.4) {
			set(
				scene,
				Math.round(cx + Math.cos(angle) * k),
				Math.round(cy + Math.sin(angle) * k),
				C.lampFrame
			);
		}
	}
}

/**
 * Whether a point on the plate lies on an engraved line: the meridian and three arcs of altitude.
 * @param {number} dx - From the disc's centre
 * @param {number} dy
 * @returns {boolean}
 */
function engraved(dx, dy) {
	if (Math.abs(dx) < 0.6 && dy > 0) {
		return true;
	}
	for (const [down, radius] of [
		[3, 12.5],
		[5, 8.5],
		[6.5, 5],
	]) {
		if (Math.abs(Math.hypot(dx, dy - down) - radius) < 0.5) {
			return true;
		}
	}
	return false;
}

/**
 * Whether a point lies on the rete: its outer ring, the off-centre ecliptic ring, the cross bars and the star pointers.
 * @param {number} dx - From the disc's centre
 * @param {number} dy
 * @returns {boolean}
 */
function onRete(dx, dy) {
	const d = Math.hypot(dx, dy);
	if (d >= RETE.outer) {
		return false;
	}
	if (d >= RETE.inner) {
		return true;
	}
	const e = Math.hypot(dx, dy - RETE.eclipticDy);
	if (e >= RETE.eclipticIn && e < RETE.eclipticOut) {
		return true;
	}
	if (Math.abs(dy) < 0.6 || (Math.abs(dx) < 0.6 && dy > 0)) {
		return true;
	}
	return POINTERS.some(([bx, by, tx, ty]) =>
		onPointer(dx, dy, bx, by, tx, ty)
	);
}

/** The star pointers: each a tapering flame from its base on the rete to its tip, the star's place, all from the disc's centre. */
const POINTERS = [
	[-13.5, 5, -7.5, 9],
	[13.5, 5, 8, 9.5],
	[-5, 14, -3, 7.5],
	[6, 14, 3.5, 7],
	[-7.5, -5, -3.5, -3],
];

/**
 * Whether a point lies on one star pointer, which narrows from two pixels at its base to one at its tip.
 * @param {number} dx
 * @param {number} dy
 * @param {number} bx - The base
 * @param {number} by
 * @param {number} tx - The tip
 * @param {number} ty
 * @returns {boolean}
 */
function onPointer(dx, dy, bx, by, tx, ty) {
	const lx = tx - bx;
	const ly = ty - by;
	const length = Math.hypot(lx, ly);
	const along = ((dx - bx) * lx + (dy - by) * ly) / length;
	if (along < 0 || along > length) {
		return false;
	}
	const across = Math.abs(((dx - bx) * ly - (dy - by) * lx) / length);
	return across < 1.2 * (1 - along / length) + 0.35;
}

/**
 * The rete: bright pierced brass over the plate, lit on its upper-left edges and casting a thin shadow down and right.
 * @param {Canvas} scene
 */
function drawRete(scene) {
	const { x: cx, y: cy } = DISC;
	for (let y = Math.floor(cy - RETE.outer); y <= cy + RETE.outer; y++) {
		for (let x = Math.floor(cx - RETE.outer); x <= cx + RETE.outer; x++) {
			const dx = x - cx;
			const dy = y - cy;
			if (onRete(dx, dy)) {
				const lit = !onRete(dx - 1, dy - 1);
				const shaded = !onRete(dx + 1, dy + 1);
				set(scene, x, y, lit ? C.lampGlow : shaded ? C.brass : C.gold);
			} else if (
				Math.hypot(dx, dy) < DISC.limb &&
				onRete(dx - 1, dy - 1)
			) {
				set(scene, x, y, PLATE_SHADOW);
			}
		}
	}
	// The star tips glint.
	for (const [, , tx, ty] of POINTERS) {
		set(scene, Math.round(cx + tx), Math.round(cy + ty), C.white);
	}
}

/**
 * The rule: the long pointer pivoting on the centre pin, tapering to a point at each end, and the round pin itself.
 * @param {Canvas} rule
 */
function drawRule(rule) {
	const { x: cx, y: cy } = DISC;
	const ax = Math.cos(RULE.angle);
	const ay = Math.sin(RULE.angle);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const along = dx * ax + dy * ay;
			const across = -dx * ay + dy * ax;
			const half = 1.5 * Math.min(1, (RULE.reach - Math.abs(along)) / 6);
			if (Math.abs(along) > RULE.reach || Math.abs(across) >= half) {
				continue;
			}
			let colour = C.gold;
			if (across < -half + 0.9) {
				colour = C.lampGlow;
			} else if (across > half - 0.9) {
				colour = C.brass;
			}
			set(rule, x, y, colour);
		}
	}
	// The centre pin: a round boss lit on its upper left.
	for (let y = Math.floor(cy) - 3; y <= cy + 3; y++) {
		for (let x = Math.floor(cx) - 3; x <= cx + 3; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d < 2.3) {
				const f = facing(dx, dy);
				set(
					rule,
					x,
					y,
					f > 0.3 ? C.lampGlow : f < -0.3 ? C.lampFrame : C.brass
				);
			}
		}
	}
}

/**
 * The hand at the top: a dark sleeve cuff and a fist lit on its left, its four curled fingers closed round the ring.
 * @param {Canvas} hand
 */
function drawHand(hand) {
	paint(
		hand,
		23,
		0,
		[
			' lssssssssssssss ',
			' lssssssssssssss ',
			'  bkkkkkkkkkkkd  ',
			' bkkkkkkkkkkkkkd ',
			' bkkdbkkdbkkdbkd ',
			' bkkdbkkdbkkdbkd ',
			' bkkdbkkdbkkdbkd ',
			'  dd  dd  dd  d  ',
		],
		{
			s: SLEEVE,
			l: SLEEVE_LIGHT,
			k: SKIN,
			b: SKIN_LIGHT,
			d: SKIN_SHADE,
		}
	);
}

/**
 * Glints of moonlight on the limb and the rule's tip, over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[17, 21],
		[19, 19],
	]) {
		set(scene, x, y, C.lampGlow);
	}
	const tipX = Math.round(DISC.x + Math.cos(RULE.angle) * (RULE.reach - 2));
	const tipY = Math.round(DISC.y + Math.sin(RULE.angle) * (RULE.reach - 2));
	set(scene, tipX, tipY, C.white);
}
