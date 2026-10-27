// Treasury: an open iron-bound strongbox heaped with gold coins and a gold bar, lit by a hanging lantern in a vault at night.
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

/** The strongbox: its front face, how far its top recedes to the back rim, and the raised lid behind. */
const BOX = { left: 12, right: 50, rim: 38, bottom: 58, depth: 6, lidTop: 13 };

/** The hanging lantern, top left: the centre of its flame. */
const LAMP = { x: 7, y: 12 };

/** Where the wall meets the floor. */
const FLOOR = 47;

/** The vault's stone wall and its floorboards, cool and dark until the lantern warms them. */
const WALL = mix(C.stoneShade, C.nightSky4, 0.4);
const WALL_JOINT = mix(WALL, C.ink, 0.35);
const BOARD = C.floor;
const BOARD_SEAM = C.floorShade;

/** The shadows the strongbox casts away from the lantern. */
const FLOOR_SHADOW = mix(C.floorShade, C.ink, 0.45);
const WALL_SHADOW = mix(WALL, C.ink, 0.4);

/** The iron straps: lit edge, body and shade. */
const IRON_LIGHT = C.stone;
const IRON = C.stoneShade;
const IRON_SHADE = mix(C.stoneShade, C.ink, 0.45);

/** The dark inside of the box and the lid. */
const INSIDE = mix(C.timberShade, C.ink, 0.45);

/**
 * Draws the Treasury tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1694);

	drawWall(layer);
	drawFloor(layer);
	drawWindow(layer);
	glow(layer, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 62,
		colour: C.lampGlow,
		strength: 0.5,
		steps: 4,
		skip: [C.nightSky2, C.starDim],
	});
	drawShadows(layer);

	drawLid(scene);
	const heap = createCanvas(64, 64);
	drawHeap(heap, random);
	outline(heap, C.ink);
	const bar = createCanvas(64, 64);
	drawBar(bar);
	outline(bar, C.ink);
	stamp(heap, bar);
	stamp(scene, heap);
	drawBox(scene);
	const spill = createCanvas(64, 64);
	drawSpill(spill);
	outline(spill, C.ink);
	stamp(scene, spill);
	drawLamp(scene);
	outline(scene, C.ink);
	glow(scene, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 40,
		colour: C.lampGlow,
		strength: 0.25,
		steps: 2,
		skip: [C.ink, C.white, C.lampGlow, C.gold],
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
 * The vault wall: big plain stone blocks with faint joints.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	rect(layer, 0, 0, 64, FLOOR, WALL);
	for (let course = 0; course * 10 + 9 < FLOOR; course++) {
		const y = course * 10 + 9;
		rect(layer, 0, y, 64, 1, WALL_JOINT);
		const offset = course % 2 === 0 ? 4 : 13;
		for (let x = offset; x < 64; x += 18) {
			rect(layer, x, y - 9, 1, 9, WALL_JOINT);
		}
	}
	rect(layer, 0, FLOOR - 1, 64, 1, WALL_JOINT);
}

/**
 * The floorboards: broad boards with a few seams.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	rect(layer, 0, FLOOR, 64, 64 - FLOOR, BOARD);
	for (const y of [51, 56, 61]) {
		rect(layer, 0, y, 64, 1, BOARD_SEAM);
	}
}

/**
 * A small barred window high on the right, onto the night sky and two stars.
 * @param {Canvas} layer
 */
function drawWindow(layer) {
	const cx = 58;
	for (let y = 1; y <= 9; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			const arch =
				y < 4 ? Math.hypot(x - cx, (y - 4) * 1.4) : Math.abs(x - cx);
			if (arch <= 4) {
				set(layer, x, y, arch > 3 ? WALL_JOINT : C.nightSky2);
			}
		}
	}
	set(layer, cx - 2, 3, C.starDim);
	set(layer, cx + 2, 6, C.starDim);
	for (const x of [cx - 1, cx + 1]) {
		rect(layer, x, 1, 1, 9, C.ink);
	}
	rect(layer, cx - 4, 10, 9, 1, WALL_JOINT);
}

/**
 * The shadows the strongbox throws to the right of the lantern, on the wall behind and the floor beside it.
 * @param {Canvas} layer
 */
function drawShadows(layer) {
	const backRight = BOX.right + BOX.depth;
	for (let y = BOX.lidTop + 3; y < FLOOR; y++) {
		for (let x = backRight + 2; x < 64; x++) {
			if (x - (backRight + 2) < (y - BOX.lidTop) * 0.4 + 2) {
				set(layer, x, y, WALL_SHADOW);
			}
		}
	}
	for (let y = BOX.bottom - BOX.depth; y <= BOX.bottom; y++) {
		const start = BOX.right + (BOX.bottom - y) + 1;
		for (let x = start; x < Math.min(64, start + 9); x++) {
			set(layer, x, y, FLOOR_SHADOW);
		}
	}
}

/**
 * The lid, thrown back on its hinges: its dark plank lining facing us, bound at the edges with iron.
 * @param {Canvas} scene
 */
function drawLid(scene) {
	const left = BOX.left + BOX.depth;
	const right = BOX.right + BOX.depth;
	const top = BOX.lidTop;
	const bottom = BOX.rim - BOX.depth;
	for (let y = top; y < bottom; y++) {
		for (let x = left; x <= right; x++) {
			const seam = (x - left) % 6 === 5;
			set(scene, x, y, seam ? INSIDE : C.timberShade);
		}
	}
	// The lid's thickness, seen along its right edge.
	rect(scene, right + 1, top + 1, 2, bottom - top - 1, C.timber);
	// The iron that wraps its edges, with rivets.
	rect(scene, left, top, right - left + 1, 2, IRON);
	rect(scene, left, top, right - left + 1, 1, IRON_LIGHT);
	rect(scene, left, top, 2, bottom - top, IRON);
	rect(scene, right - 1, top, 2, bottom - top, IRON_SHADE);
	for (let x = left + 4; x < right - 1; x += 6) {
		set(scene, x, top + 1, C.stoneLight);
	}
}

/**
 * The heap of coins: an amber mound filling the open box and rising above its rim, covered in overlapping coins.
 * @param {Canvas} heap
 * @param {() => number} random
 */
function drawHeap(heap, random) {
	const { left, right, rim, depth } = BOX;
	/**
	 * The heap's top row at a column.
	 * @param {number} x
	 * @returns {number}
	 */
	const crest = (x) => {
		const t = (x - 33) / 23;
		return Math.round(rim - 1 - 15 * Math.max(0, 1 - t * t));
	};
	for (let x = left + 1; x <= right + depth - 1; x++) {
		for (let y = crest(x); y < rim; y++) {
			set(heap, x, y, C.amber);
		}
	}
	/** @type {[number, number][]} */
	const coins = [];
	for (let i = 0; i < 110; i++) {
		const x = left + 1 + Math.floor(random() * (right + depth - left - 2));
		const y = crest(x) + Math.floor(random() * (rim - crest(x)));
		coins.push([x, y]);
	}
	coins.sort((a, b) => a[1] - b[1]);
	for (const [x, y] of coins) {
		drawCoin(heap, x - 2, y - 1);
	}
}

/**
 * One gold coin lying flat: a bright lit edge on the lamp side and a shaded rim below. No marks on its face.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawCoin(canvas, x, y) {
	rect(canvas, x + 1, y, 3, 1, C.gold);
	set(canvas, x + 1, y, C.lampGlow);
	rect(canvas, x, y + 1, 5, 1, C.gold);
	set(canvas, x, y + 1, C.lampGlow);
	set(canvas, x + 4, y + 1, C.brass);
	rect(canvas, x + 1, y + 2, 3, 1, C.lampFrame);
}

/**
 * The gold bar lying across the top of the heap: a bright top face, a gold front and a shaded end.
 * @param {Canvas} bar
 */
function drawBar(bar) {
	const x = 30;
	const y = 18;
	rect(bar, x + 2, y, 12, 2, C.lampGlow);
	rect(bar, x + 1, y + 2, 14, 1, C.gold);
	rect(bar, x, y + 3, 16, 3, C.gold);
	rect(bar, x, y + 5, 16, 1, C.amber);
	for (let k = 0; k < 4; k++) {
		set(
			bar,
			x + 15 - (k < 2 ? 0 : 1) + (k === 0 ? 1 : 0),
			y + 2 + k,
			C.amber
		);
	}
	rect(bar, x + 14, y, 1, 2, C.gold);
	set(bar, x + 3, y, C.white);
	set(bar, x + 4, y, C.white);
}

/**
 * The strongbox: oak boards bound with iron straps, a lock plate at the front, and its side in shadow.
 * @param {Canvas} scene
 */
function drawBox(scene) {
	const { left, right, rim, bottom, depth } = BOX;
	// The front face: boards lit by the lantern, with dark seams.
	rect(scene, left, rim, right - left + 1, bottom - rim + 1, C.timber);
	for (const y of [rim + 6, rim + 12]) {
		rect(scene, left, y, right - left + 1, 1, C.timberShade);
	}
	rect(scene, left, rim, right - left + 1, 1, C.timberLight);
	// The side face, receding to the back and turned away from the lantern.
	for (let k = 1; k <= depth; k++) {
		const x = right + k;
		for (let y = rim - k; y <= bottom - k; y++) {
			set(scene, x, y, C.timberShade);
		}
		set(scene, x, rim - k, C.timber);
	}
	// The iron straps on the front: top and bottom bands, the corners and two uprights.
	const band = (/** @type {number} */ y) => {
		rect(scene, left, y, right - left + 1, 2, IRON);
		rect(scene, left, y, right - left + 1, 1, IRON_LIGHT);
	};
	band(rim + 1);
	band(bottom - 2);
	for (const x of [left, left + 11, right - 13, right - 2]) {
		rect(scene, x, rim + 1, 3, bottom - rim, IRON);
		rect(scene, x, rim + 1, 1, bottom - rim, IRON_LIGHT);
		rect(scene, x + 2, rim + 3, 1, bottom - rim - 4, IRON_SHADE);
		for (let y = rim + 5; y < bottom - 2; y += 4) {
			set(scene, x + 1, y, C.stoneLight);
		}
	}
	// The straps carry round onto the shaded side.
	for (let k = 1; k <= depth; k++) {
		set(scene, right + k, rim + 1 - k, IRON_SHADE);
		set(scene, right + k, rim + 2 - k, IRON_SHADE);
		set(scene, right + k, bottom - 2 - k, IRON_SHADE);
		set(scene, right + k, bottom - 1 - k, IRON_SHADE);
	}
	// The lock plate and its keyhole, between the two uprights.
	const lx = Math.round((left + right) / 2) - 3;
	rect(scene, lx, rim + 4, 7, 8, IRON);
	rect(scene, lx, rim + 4, 7, 1, IRON_LIGHT);
	rect(scene, lx, rim + 4, 1, 8, IRON_LIGHT);
	rect(scene, lx + 6, rim + 5, 1, 7, IRON_SHADE);
	rect(scene, lx + 3, rim + 6, 1, 2, C.ink);
	line(scene, lx + 3, rim + 8, lx + 3, rim + 9, C.ink);
	set(scene, lx + 1, rim + 5, C.stoneLight);
	set(scene, lx + 5, rim + 10, C.stoneLight);
}

/**
 * A few coins spilled on the floor in front of the box, each outlined on its own.
 * @param {Canvas} spill
 */
function drawSpill(spill) {
	drawCoin(spill, 4, 60);
	drawCoin(spill, 53, 61);
	drawCoin(spill, 58, 59);
	// One coin standing on its edge, rolling away.
	rect(spill, 9, 56, 2, 4, C.gold);
	set(spill, 9, 56, C.lampGlow);
	rect(spill, 10, 58, 1, 2, C.brass);
}

/**
 * The hanging lantern: a chain from the ceiling, a brass cap and base, and a glass chamber round a bright flame.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	const { x, y } = LAMP;
	for (let k = 0; k < y - 6; k++) {
		set(scene, x, k, k % 2 === 0 ? C.brass : C.lampFrame);
	}
	rect(scene, x - 2, y - 6, 5, 1, C.brass);
	rect(scene, x - 3, y - 5, 7, 1, C.gold);
	rect(scene, x - 3, y - 4, 7, 8, C.gold);
	rect(scene, x - 3, y - 4, 1, 8, C.brass);
	rect(scene, x + 3, y - 4, 1, 8, C.lampFrame);
	rect(scene, x - 1, y - 2, 3, 4, C.lampGlow);
	rect(scene, x, y - 3, 1, 6, C.lampGlow);
	rect(scene, x, y - 1, 1, 2, C.white);
	rect(scene, x - 1, y + 2, 3, 1, C.amber);
	rect(scene, x - 3, y + 4, 7, 1, C.brass);
	rect(scene, x - 2, y + 5, 5, 1, C.lampFrame);
}

/**
 * Twinkles of lantern light on the coins and the bar, painted over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[24, 27],
		[44, 29],
		[19, 34],
		[38, 33],
	]) {
		set(scene, x, y, C.white);
		set(scene, x - 1, y, C.lampGlow);
		set(scene, x + 1, y, C.lampGlow);
		set(scene, x, y - 1, C.lampGlow);
		set(scene, x, y + 1, C.lampGlow);
	}
}
