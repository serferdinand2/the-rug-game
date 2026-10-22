// Object Cloning: a brass and steel machine with two glass chambers in a laboratory at night, a red apple in one and its glowing pink copy in the other.
import {
	createCanvas,
	get,
	set,
	clear,
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

/**
 * A glass chamber: its left column, its width, and the rows its glass starts and ends on.
 * @typedef {{ left: number, w: number, top: number, bottom: number }} Chamber
 */

/** The two chambers: the original on the left, the copy on the right. */
const ORIGINAL = { left: 7, w: 19, top: 15, bottom: 40 };
const COPY = { left: 38, w: 19, top: 15, bottom: 40 };

/** The console the chambers stand on: its first and last rows. */
const CONSOLE = { left: 3, right: 60, top: 43, bottom: 57 };

/** The rows of the wall's rail and the floor's first row. */
const ROWS = { rail: 33, floor: 57 };

/** The pipe that joins the two caps: its row. */
const PIPE_Y = 5;

/** The night laboratory: a dusky violet wall above the rail, a darker panel below it, dark floorboards. */
const WALL = mix(C.roof, C.roofLight, 0.4);
const WAINSCOT = mix(C.roof, C.roofShade, 0.4);
const RAIL = mix(C.roofLight, C.railLight, 0.3);

/** The glass: cool and clear round the original, flushed pink round the copy. */
const GLASS = mix(WALL, C.stoneLight, 0.3);
const GLASS_PINK = mix(WALL, C.arcaneLight, 0.4);
const GLASS_GLEAM = mix(C.stoneLight, C.white, 0.5);

/** The copy's glowing pinks, mixed from the apple's red and cream, shaded towards violet. */
const PINK_LIGHT = mix(C.brickRedLight, C.creamLight, 0.75);
const PINK = mix(C.brickRedLight, C.creamLight, 0.4);
const PINK_SHADE = mix(C.brickRedLight, C.arcane, 0.5);
const PINK_LEAF = mix(C.arcaneLight, C.arcane, 0.3);

/**
 * Draws the Object Cloning tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3361);

	drawRoom(layer);
	glow(layer, {
		x: 47,
		y: 30,
		radius: 34,
		colour: C.arcaneLight,
		strength: 0.3,
		steps: 2,
	});

	drawConsole(scene);
	drawPipe(scene);
	drawChamber(scene, ORIGINAL, GLASS);
	drawChamber(scene, COPY, GLASS_PINK);
	outline(scene, C.ink);

	const apples = createCanvas(64, 64);
	drawApple(apples, 16, 33, {
		light: C.brickRedLight,
		base: C.brickRed,
		shade: C.brickRedShade,
		leaf: C.grass,
		stem: C.timber,
	});
	drawApple(apples, 47, 33, {
		light: PINK_LIGHT,
		base: PINK,
		shade: PINK_SHADE,
		leaf: PINK_LEAF,
		stem: PINK_SHADE,
	});
	outline(apples, C.ink);
	stamp(scene, apples);
	underlay(scene, layer);

	glow(scene, {
		x: 47,
		y: 32,
		radius: 9,
		colour: C.arcaneLight,
		strength: 0.4,
		steps: 2,
		skip: [C.ink, PINK_LIGHT, PINK, PINK_SHADE, PINK_LEAF],
	});
	drawGleams(scene);
	drawSparks(scene, random);
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
 * The room: the two-tone wall with its rail, and the floorboards.
 * @param {Canvas} layer
 */
function drawRoom(layer) {
	rect(layer, 0, 0, 64, ROWS.rail, WALL);
	rect(layer, 0, ROWS.rail, 64, 1, RAIL);
	rect(layer, 0, ROWS.rail + 1, 64, ROWS.floor - ROWS.rail - 1, WAINSCOT);
	rect(layer, 0, ROWS.floor, 64, 64 - ROWS.floor, C.floorShade);
	rect(layer, 0, ROWS.floor, 64, 1, C.floor);
	for (const x of [9, 26, 44, 59]) {
		rect(layer, x, ROWS.floor + 1, 1, 64 - ROWS.floor - 1, C.floor);
	}
}

/**
 * The console: a steel cabinet with a lit top, a brass trim, a recessed panel with three lamps, and a shaded foot.
 * @param {Canvas} scene
 */
function drawConsole(scene) {
	const { left, right, top, bottom } = CONSOLE;
	const w = right - left + 1;
	rect(scene, left, top, w, bottom - top + 1, C.stone);
	rect(scene, left, top, w, 2, C.stoneLight);
	rect(scene, left, top + 3, w, 1, C.brass);
	rect(scene, left, top + 4, w, 1, C.lampFrame);
	rect(scene, left, bottom - 1, w, 2, C.stoneShade);
	rect(scene, left, top + 2, 1, bottom - top - 3, C.stoneLight);
	rect(scene, right, top + 2, 1, bottom - top - 3, C.stoneShade);
	// The recessed panel between the chambers, its lamps lit.
	rect(scene, 25, 48, 14, 6, C.stoneShade);
	rect(scene, 26, 49, 12, 4, C.stoneMid);
	rect(scene, 26, 52, 12, 1, C.stone);
	for (const { x, colour } of [
		{ x: 27, colour: C.brickRedLight },
		{ x: 31, colour: C.gold },
		{ x: 35, colour: PINK_LIGHT },
	]) {
		rect(scene, x, 50, 2, 2, colour);
	}
	// Two rows of rivets along the front.
	for (let x = left + 3; x < right - 1; x += 6) {
		if (x < 24 || x > 39) {
			set(scene, x, top + 7, C.stoneShade);
			set(scene, x, bottom - 3, C.stoneShade);
		}
	}
}

/**
 * The brass pipe that joins the two caps, arching over the gap, with a coil box in the middle.
 * @param {Canvas} scene
 */
function drawPipe(scene) {
	const a = ORIGINAL.left + Math.floor(ORIGINAL.w / 2);
	const b = COPY.left + Math.floor(COPY.w / 2);
	rect(scene, a - 1, PIPE_Y, b - a + 3, 3, C.brass);
	rect(scene, a - 1, PIPE_Y, b - a + 3, 1, C.gold);
	rect(scene, a - 1, PIPE_Y + 2, b - a + 3, 1, C.lampFrame);
	for (const x of [a, b]) {
		rect(scene, x - 1, PIPE_Y, 3, 7, C.brass);
		rect(scene, x - 1, PIPE_Y, 1, 7, C.gold);
		rect(scene, x + 1, PIPE_Y + 1, 1, 6, C.lampFrame);
	}
	// The coil box on the pipe, its window glowing.
	const cx = Math.round((a + b) / 2);
	rect(scene, cx - 4, PIPE_Y - 3, 9, 8, C.stone);
	rect(scene, cx - 4, PIPE_Y - 3, 9, 1, C.stoneLight);
	rect(scene, cx - 4, PIPE_Y + 4, 9, 1, C.stoneShade);
	rect(scene, cx - 2, PIPE_Y - 1, 5, 4, C.arcaneLight);
	rect(scene, cx - 1, PIPE_Y, 3, 2, C.white);
	for (const x of [cx - 2, cx + 2]) {
		set(scene, x, PIPE_Y - 1, C.arcane);
		set(scene, x, PIPE_Y + 2, C.arcane);
	}
}

/**
 * A glass chamber: a domed brass cap, the glass cylinder and a brass collar round its foot, with a small steel dish inside.
 * @param {Canvas} scene
 * @param {Chamber} chamber
 * @param {Colour} glass
 */
function drawChamber(scene, chamber, glass) {
	const { left, w, top, bottom } = chamber;
	const right = left + w - 1;
	// The glass, its shaded right edge.
	rect(scene, left, top, w, bottom - top + 1, glass);
	rect(scene, right - 1, top, 2, bottom - top + 1, mix(glass, C.ink, 0.2));
	// The dish the apple sits on.
	const cx = left + Math.floor(w / 2);
	rect(scene, cx - 5, bottom - 2, 11, 1, C.stoneLight);
	rect(scene, cx - 4, bottom - 1, 9, 1, C.stone);
	rect(scene, cx - 1, bottom, 3, 1, C.stoneShade);
	// The cap: a band wider than the glass, then a dome.
	rect(scene, left - 1, top - 3, w + 2, 3, C.brass);
	rect(scene, left - 1, top - 3, w + 2, 1, C.gold);
	rect(scene, left - 1, top - 1, w + 2, 1, C.lampFrame);
	rect(scene, left + 2, top - 5, w - 4, 2, C.brass);
	rect(scene, left + 2, top - 5, w - 4, 1, C.gold);
	rect(scene, right - 3, top - 4, 2, 1, C.lampFrame);
	// The collar at the foot.
	rect(scene, left - 1, bottom + 1, w + 2, 2, C.brass);
	rect(scene, left - 1, bottom + 1, w + 2, 1, C.gold);
	rect(scene, left - 1, bottom + 2, 1, 1, C.gold);
	rect(scene, right + 1, bottom + 2, 1, 1, C.lampFrame);
	clear(scene, left - 1, top - 3);
	clear(scene, right + 1, top - 3);
}

/**
 * An apple: round with a dip at the top, lit on the upper left, a short stem and one leaf.
 * @param {Canvas} canvas
 * @param {number} cx - Its centre column
 * @param {number} cy - Its centre row
 * @param {{ light: Colour, base: Colour, shade: Colour, leaf: Colour, stem: Colour }} colours
 */
function drawApple(canvas, cx, cy, colours) {
	for (let y = cy - 6; y <= cy + 6; y++) {
		for (let x = cx - 6; x <= cx + 6; x++) {
			const dx = x - cx;
			const dy = y - cy;
			// A little wider than tall, and pinched in at the top.
			const pinch = dy < -3 && Math.abs(dx) < 2 ? 1 : 0;
			if (Math.hypot(dx / 1.1, dy) >= 5.6 || (pinch && dy < -4)) {
				continue;
			}
			let colour = colours.base;
			if (dx + dy > 4 || (dy > 3 && dx > -2)) {
				colour = colours.shade;
			}
			set(canvas, x, y, colour);
		}
	}
	// The highlight on the upper left.
	rect(canvas, cx - 4, cy - 3, 2, 2, colours.light);
	set(canvas, cx - 3, cy - 1, colours.light);
	set(canvas, cx - 2, cy - 4, colours.light);
	// The stem and the leaf.
	set(canvas, cx, cy - 5, colours.stem);
	set(canvas, cx, cy - 6, colours.stem);
	set(canvas, cx + 1, cy - 7, colours.stem);
	rect(canvas, cx + 2, cy - 7, 2, 1, colours.leaf);
	rect(canvas, cx + 2, cy - 6, 3, 1, colours.leaf);
	set(canvas, cx + 5, cy - 7, colours.leaf);
}

/**
 * The gleams on the glass, painted over the apples as the front of the cylinders: a long streak and a short one in each.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const { left, top, bottom } of [ORIGINAL, COPY]) {
		rect(scene, left + 2, top + 2, 1, bottom - top - 6, GLASS_GLEAM);
		rect(scene, left + 4, top + 3, 1, 6, GLASS_GLEAM);
	}
}

/**
 * Pink sparks drifting in the copy's chamber, as if it were still settling into being.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	const { left, w, top, bottom } = COPY;
	for (let i = 0; i < 12; i++) {
		const x = left + 2 + Math.floor(random() * (w - 4));
		const y = top + 1 + Math.floor(random() * (bottom - top - 4));
		const behind = get(scene, x, y);
		if (behind && behind !== C.ink && Math.hypot(x - 47, y - 33) > 7) {
			set(scene, x, y, i % 3 === 0 ? C.white : PINK_LIGHT);
		}
	}
}
