// Calculus: a brass calculating machine of meshing gears and a crank on a wooden case, a paper strip of plain dashes curling out of it, in a sunlit study.
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

/**
 * One gear: its centre, the radius of its tooth tips and of its rim's root, its number of teeth and spokes, and how far its teeth are turned.
 * @typedef {Object} Gear
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {number} root
 * @property {number} teeth
 * @property {number} spokes
 * @property {number} turn
 */

/** @type {Gear} The big gear on the left. */
const BIG = {
	x: 24.5,
	y: 20,
	r: 13,
	root: 11.3,
	teeth: 16,
	spokes: 5,
	turn: 0.1,
};

/** @type {Gear} The smaller gear it drives, on the right. */
const SMALL = {
	x: 44,
	y: 25,
	r: 8.5,
	root: 7,
	teeth: 10,
	spokes: 4,
	turn: 0.55,
};

/** The wooden case: its front face, the row of its brass deck's front edge, and how far the deck recedes up and to the right. */
const CASE = { left: 9, right: 52, deck: 36, bottom: 49, depth: 5 };

/** The crank: the handle's knob at the end of the arm from the small gear's hub. */
const HANDLE = { x: 57, y: 11 };

/** Where the wall's wainscot starts, and the table top's back edge and front edge. */
const ROWS = { wainscot: 34, table: 43, front: 59 };

/** The study: plaster above, dark wainscot below, the sunbeam from a window off to the left, and the table. */
const SUNBEAM = mix(C.plaster, C.plasterLight, 0.7);
const WAINSCOT = C.timberShade;
const WAINSCOT_LIGHT = C.timber;
const TABLE = C.floorLight;
const TABLE_EDGE = mix(C.floorLight, C.plasterLight, 0.35);
const TABLE_FRONT = C.floor;
const SHADOW = mix(C.floor, C.floorShade, 0.7);

/** The paper strip: its face, its edge and its shaded underside, and the dashes along it. */
const PAPER = C.creamLight;
const PAPER_EDGE = C.cream;
const PAPER_SHADE = C.creamShade;
const DASH = C.timberShade;

/**
 * Draws the Calculus tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9137);

	drawRoom(layer, random);

	drawUprights(scene);
	drawGear(scene, BIG);
	drawGear(scene, SMALL);
	drawCase(scene);
	const crank = createCanvas(64, 64);
	drawCrank(crank);
	outline(crank, C.ink);
	stamp(scene, crank);
	const strip = createCanvas(64, 64);
	drawStrip(strip);
	outline(strip, C.ink);
	stamp(scene, strip);
	outline(scene, C.ink);
	glow(scene, {
		x: 4,
		y: 8,
		radius: 34,
		colour: C.lampGlow,
		strength: 0.2,
		steps: 2,
		skip: [
			C.ink,
			C.lampGlow,
			PAPER,
			DASH,
			C.timber,
			C.timberLight,
			C.timberShade,
			C.wood,
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
 * The study behind the machine: a plaster wall with a slanting sunbeam, the dark wainscot, and the table it stands on.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoom(layer, random) {
	rect(layer, 0, 0, 64, ROWS.wainscot, C.plaster);
	// The sunbeam from a window off to the left, slanting down to the right.
	for (let y = 0; y < ROWS.wainscot; y++) {
		const from = Math.round(2 + y * 0.6);
		rect(layer, from, y, 22, 1, SUNBEAM);
	}
	rect(layer, 0, ROWS.wainscot, 64, ROWS.table - ROWS.wainscot, WAINSCOT);
	rect(layer, 0, ROWS.wainscot, 64, 1, WAINSCOT_LIGHT);
	for (let x = 9; x < 64; x += 16) {
		rect(
			layer,
			x,
			ROWS.wainscot + 2,
			1,
			ROWS.table - ROWS.wainscot - 2,
			C.wood
		);
	}
	rect(layer, 0, ROWS.table, 64, ROWS.front - ROWS.table, TABLE);
	// A little grain on the table top.
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 56);
		const y =
			ROWS.table +
			1 +
			Math.floor(random() * (ROWS.front - ROWS.table - 2));
		rect(layer, x, y, 4 + Math.floor(random() * 5), 1, C.floor);
	}
	rect(layer, 0, ROWS.front, 64, 1, TABLE_EDGE);
	rect(layer, 0, ROWS.front + 1, 64, 64 - ROWS.front - 1, TABLE_FRONT);
	// The case's shadow, thrown to the right, away from the window.
	for (let y = ROWS.table; y < CASE.bottom + 1; y++) {
		rect(
			layer,
			CASE.right + CASE.depth + 1,
			y,
			8 - (y - ROWS.table),
			1,
			SHADOW
		);
	}
}

/**
 * The brass uprights that carry the two gears' axles down to the deck.
 * @param {Canvas} scene
 */
function drawUprights(scene) {
	for (const gear of [BIG, SMALL]) {
		const x = Math.floor(gear.x);
		rect(
			scene,
			x - 1,
			Math.floor(gear.y),
			3,
			CASE.deck - 2 - Math.floor(gear.y),
			C.lampFrame
		);
	}
}

/**
 * One brass gear standing on edge: square teeth round a rim, spokes out to it from a round hub, open between the spokes.
 * Lit on its upper left by the window.
 * @param {Canvas} scene
 * @param {Gear} gear
 */
function drawGear(scene, gear) {
	const { x: cx, y: cy, r, root, teeth, spokes, turn } = gear;
	const rim = root - 2.5;
	const hub = 2.6;
	for (let y = Math.floor(cy - r) - 1; y <= cy + r + 1; y++) {
		for (let x = Math.floor(cx - r) - 1; x <= cx + r + 1; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			const angle = Math.atan2(dy, dx);
			const tooth = Math.cos(teeth * angle + turn * Math.PI * 2) > -0.1;
			if (d >= r || (d >= root && !tooth)) {
				continue;
			}
			const sector = (Math.PI * 2) / spokes;
			const off = (((angle - 0.3) % sector) + sector) % sector;
			const spoke = Math.min(off, sector - off) * d < 1.3;
			if (d >= hub && d < rim && !spoke) {
				continue;
			}
			// Lit on the upper left, shaded on the lower right: on the outside of the rim and round the hub.
			const facing = (-dx - dy) / ((d || 1) * Math.SQRT2);
			let colour = C.brass;
			if (d >= root - 1 || d < hub) {
				colour =
					facing > 0.3
						? C.gold
						: facing < -0.3
							? C.lampFrame
							: C.brass;
			} else if (d < rim + 1 && d >= rim) {
				// The rim's inner edge: in shade where it faces away from the light.
				colour = facing > 0.3 ? C.lampFrame : C.brass;
			}
			set(scene, x, y, colour);
		}
	}
	// The axle's end in the hub.
	set(scene, Math.round(cx), Math.round(cy), C.wood);
}

/**
 * The wooden case: its brass deck, its lit front face with brass trim and the slot the paper comes out of, and its side in shade.
 * @param {Canvas} scene
 */
function drawCase(scene) {
	const { left, right, deck, bottom, depth } = CASE;
	// The brass deck, receding up and to the right.
	for (let k = 0; k < depth; k++) {
		const y = deck - 1 - k;
		rect(
			scene,
			left + k + 1,
			y,
			right - left + 1,
			1,
			k === depth - 1 ? C.gold : C.brass
		);
	}
	rect(scene, left, deck - 1, right - left + 1, 1, C.gold);
	// The side face, turned away from the window.
	for (let k = 1; k <= depth; k++) {
		const x = right + k;
		for (let y = deck - k; y <= bottom - k; y++) {
			set(scene, x, y, C.timberShade);
		}
		set(scene, x, deck - k, C.lampFrame);
	}
	// The front face.
	rect(scene, left, deck, right - left + 1, bottom - deck + 1, C.timber);
	rect(scene, left, deck, right - left + 1, 2, C.brass);
	rect(scene, left, deck, right - left + 1, 1, C.gold);
	rect(scene, left, bottom - 1, right - left + 1, 2, C.brass);
	rect(scene, left, bottom, right - left + 1, 1, C.lampFrame);
	rect(scene, left, deck + 2, 1, bottom - deck - 3, C.timberLight);
	// A panel moulding on the front.
	rect(scene, left + 20, deck + 4, right - left - 21, 1, C.timberShade);
	rect(scene, left + 20, deck + 10, right - left - 21, 1, C.timberLight);
	rect(scene, left + 20, deck + 4, 1, 7, C.timberShade);
	rect(scene, right - 2, deck + 4, 1, 7, C.timberLight);
	// The slot the paper comes out of.
	rect(scene, left + 4, deck + 5, 11, 2, C.wood);
	rect(scene, left + 4, deck + 7, 11, 1, C.timberLight);
}

/**
 * The crank: a brass arm from the small gear's hub up to a turned wooden handle.
 * @param {Canvas} crank
 */
function drawCrank(crank) {
	const x0 = Math.round(SMALL.x);
	const y0 = Math.round(SMALL.y);
	line(crank, x0, y0, HANDLE.x, HANDLE.y + 4, C.gold);
	line(crank, x0 + 1, y0, HANDLE.x + 1, HANDLE.y + 4, C.brass);
	line(crank, x0 + 1, y0 + 1, HANDLE.x + 1, HANDLE.y + 5, C.lampFrame);
	// The boss on the hub.
	rect(crank, x0 - 1, y0 - 1, 3, 3, C.brass);
	set(crank, x0 - 1, y0 - 1, C.gold);
	set(crank, x0 + 1, y0 + 1, C.lampFrame);
	// The handle, standing out towards us.
	rect(crank, HANDLE.x - 1, HANDLE.y - 4, 4, 8, C.timber);
	rect(crank, HANDLE.x - 1, HANDLE.y - 4, 1, 8, C.timberLight);
	rect(crank, HANDLE.x + 2, HANDLE.y - 3, 1, 7, C.timberShade);
	rect(crank, HANDLE.x, HANDLE.y - 5, 2, 1, C.timber);
}

/** The strip's middle line: out of the slot, down the case front, then curling left across the table and back over its front edge. */
const STRIP = [
	[18.5, 42],
	[18.5, 46],
	[16, 51],
	[9, 53],
	[4, 55],
	[2, 59],
	[6, 62],
	[12, 64],
];

/**
 * A point on the strip's middle line, a smooth curve through its points.
 * @param {number} t - From 0 at the slot to 1 at the end of the curl
 * @returns {[number, number]}
 */
function stripPoint(t) {
	const last = STRIP.length - 1;
	const at = Math.min(t * last, last - 1e-9);
	const i = Math.floor(at);
	const u = at - i;
	const p0 = STRIP[Math.max(0, i - 1)];
	const p1 = STRIP[i];
	const p2 = STRIP[i + 1];
	const p3 = STRIP[Math.min(last, i + 2)];
	/**
	 * One coordinate of the curve through four points.
	 * @param {number} k - 0 for x, 1 for y
	 * @returns {number}
	 */
	const curve = (k) =>
		0.5 *
		(2 * p1[k] +
			(p2[k] - p0[k]) * u +
			(2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u +
			(3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * u * u * u);
	return [curve(0), curve(1)];
}

/**
 * The paper strip: a cream ribbon with a row of plain dashes along its middle, its lower edge in shade.
 * @param {Canvas} strip
 */
function drawStrip(strip) {
	const half = 2.5;
	// Painted in three passes, so the edges sit over the face and the dashes over both.
	for (const pass of ['face', 'edge', 'dash']) {
		let along = 0;
		let [px, py] = stripPoint(0);
		for (let t = 0; t <= 1; t += 0.002) {
			const [x, y] = stripPoint(t);
			const step = Math.hypot(x - px, y - py);
			along += step;
			px = x;
			py = y;
			if (!step) {
				continue;
			}
			const nx = -(y - stripPoint(t - 0.002)[1]) / step;
			const ny = (x - stripPoint(t - 0.002)[0]) / step;
			for (let k = -half; k <= half; k += 0.5) {
				const sx = Math.round(x + nx * k);
				const sy = Math.round(y + ny * k);
				if (sx < 0 || sy < 0 || sx > 63 || sy > 63) {
					continue;
				}
				const edge = Math.abs(k) >= half - 0.25;
				if (pass === 'face') {
					set(strip, sx, sy, PAPER);
				} else if (pass === 'edge' && edge) {
					set(strip, sx, sy, k * ny > 0 ? PAPER_SHADE : PAPER_EDGE);
				} else if (pass === 'dash' && k === 0 && along % 5 < 3) {
					set(strip, sx, sy, DASH);
				}
			}
		}
	}
}

/**
 * Glints of sunlight on the gears' teeth and the crank, over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[13, 14],
		[12, 16],
		[35, 23],
	]) {
		set(scene, x, y, C.lampGlow);
	}
}
