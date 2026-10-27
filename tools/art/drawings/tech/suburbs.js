// Suburbs: a blank silver mailbox with its red flag up, on a post by a white picket fence, a sprinkler watering the striped lawn and small rooftops far behind.
import {
	createCanvas,
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

/** The last sky row, the far lawn's first row, and the near lawn's first row. */
const ROWS = { sky: 28, far: 29, lawn: 47 };

/** The picket fence: the row of its picket tips, its last row, the first picket's column and the step between pickets. */
const FENCE = { top: 30, bottom: 46, start: 1, step: 5 };

/** The mailbox: its tail column, the column where its door begins, its door's last column, and its top and bottom rows. */
const BOX = { left: 6, door: 34, right: 40, top: 12, bottom: 28 };

/** The post under the mailbox: its left column, width and last row. */
const POST = { x: 18, w: 5, bottom: 60 };

/** The sprinkler on the lawn: its head's column and the row it stands on. */
const SPRINKLER = { x: 51, y: 57 };

/** The sky's ramp from the top down to the far lawn. */
const SKY = [C.daySky1, C.daySky2, C.daySky3, C.daySky4, C.daySky5, C.daySky6];

/** Far away things fade towards the sky. */
const HAZE = C.daySky5;

/** The galvanised steel of the mailbox: lit, base, shade and dark. */
const STEEL_LIGHT = mix(C.white, C.stoneLight, 0.35);
const STEEL = C.stoneLight;
const STEEL_SHADE = C.stone;
const STEEL_DARK = C.stoneShade;

/** The water from the sprinkler: its jets, and the bright drops near the nozzle. */
const SPRAY = mix(C.dayWaveDeep, C.foam, 0.35);
const SPRAY_LIGHT = mix(C.foam, C.white, 0.3);

/**
 * Draws the Suburbs tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1950);

	drawSky(layer);
	drawRooftops(layer);
	drawFarLawn(layer);
	drawLawn(layer, random);
	glow(layer, {
		x: 0,
		y: 0,
		radius: 30,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 3,
	});

	drawFence(scene);
	outline(scene, C.ink);
	const box = createCanvas(64, 64);
	drawPost(box);
	drawMailbox(box);
	drawFlag(box);
	outline(box, C.ink);
	stamp(scene, box);
	const sprinkler = createCanvas(64, 64);
	drawSprinkler(sprinkler);
	outline(sprinkler, C.ink);
	stamp(scene, sprinkler);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawSpray(scene, random);
	drawTufts(scene, random);
	drawGleams(scene);
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
 * The clear day sky, dithered between its bands.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= ROWS.sky; y++) {
		const t = (y / ROWS.sky) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * Small houses far down the street: hazy gable roofs and pale walls, with round trees between them.
 * @param {Canvas} layer
 */
function drawRooftops(layer) {
	const tree = mix(C.pine, HAZE, 0.5);
	for (const [cx, cy, r] of [
		[51, 25, 4],
		[64, 24, 5],
		[5, 25, 4],
	]) {
		for (let y = cy - 5; y <= ROWS.far; y++) {
			for (let x = cx - 5; x <= cx + 5; x++) {
				if (Math.hypot(x - cx, Math.min(0, y - cy)) <= r) {
					set(layer, x, y, tree);
				}
			}
		}
	}
	const houses = [
		{ x: 41, w: 9, roof: mix(C.brickRedShade, HAZE, 0.45) },
		{ x: 54, w: 9, roof: mix(C.roof, HAZE, 0.45) },
		{ x: -4, w: 9, roof: mix(C.timberShade, HAZE, 0.45) },
	];
	const wall = mix(C.cream, HAZE, 0.3);
	const wallShade = mix(C.creamShade, HAZE, 0.35);
	for (const house of houses) {
		const half = Math.floor(house.w / 2);
		const eaves = ROWS.far - 4;
		rect(layer, house.x + 1, eaves, house.w - 2, ROWS.far - eaves, wall);
		rect(
			layer,
			house.x + house.w - 3,
			eaves,
			2,
			ROWS.far - eaves,
			wallShade
		);
		for (let k = 0; k <= half; k++) {
			rect(
				layer,
				house.x + half - k,
				eaves - half + k,
				k * 2 + 1,
				1,
				house.roof
			);
		}
		// A dark little window under the eaves.
		set(layer, house.x + half, eaves + 1, mix(C.roofShade, HAZE, 0.3));
	}
}

/**
 * The lawns beyond the fence, hazy and flat.
 * @param {Canvas} layer
 */
function drawFarLawn(layer) {
	const far = mix(C.grass, HAZE, 0.35);
	const farShade = mix(C.grassShade, HAZE, 0.3);
	rect(layer, 0, ROWS.far, 64, ROWS.lawn - ROWS.far, far);
	rect(layer, 0, ROWS.far, 64, 1, farShade);
	// The fence's shadow, falling back and to the right of each picket.
	for (let x = FENCE.start + 2; x < 64; x += FENCE.step) {
		rect(
			layer,
			x + 1,
			FENCE.top + 6,
			2,
			FENCE.bottom - FENCE.top - 6,
			farShade
		);
	}
}

/**
 * The near lawn: mown in stripes that widen as they come towards us, and the mailbox's shadow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLawn(layer, random) {
	let y = ROWS.lawn;
	let width = 2;
	let light = true;
	while (y < 64) {
		rect(layer, 0, y, 64, width, light ? C.grassLight : C.grass);
		y += width;
		width += 1;
		light = !light;
	}
	rect(layer, 0, ROWS.lawn, 64, 1, C.grassShade);
	const shadow = mix(C.grassShade, C.ink, 0.2);
	rect(layer, POST.x + POST.w, POST.bottom - 1, 9, 2, shadow);
	rect(layer, SPRINKLER.x - 2, SPRINKLER.y + 1, 7, 1, shadow);
	for (let i = 0; i < 10; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			ROWS.lawn + 3 + Math.floor(random() * 14),
			C.grassShade
		);
	}
}

/**
 * The white picket fence: pointed pickets, lit on the left and shaded on the right, on two rails seen between them.
 * @param {Canvas} scene
 */
function drawFence(scene) {
	const { top, bottom, start, step } = FENCE;
	for (const y of [top + 5, bottom - 4]) {
		rect(scene, 0, y, 64, 2, C.creamShade);
	}
	for (let x = start; x < 64; x += step) {
		set(scene, x + 1, top, C.white);
		rect(scene, x, top + 1, 3, 1, C.white);
		rect(scene, x, top + 2, 3, bottom - top - 1, C.creamLight);
		rect(scene, x, top + 1, 1, bottom - top, C.white);
		rect(scene, x + 2, top + 2, 1, bottom - top - 1, C.cream);
	}
}

/**
 * The square wooden post the mailbox sits on, and the board it is bolted to.
 * @param {Canvas} box
 */
function drawPost(box) {
	const { x, w, bottom } = POST;
	rect(box, x, BOX.bottom + 1, w, bottom - BOX.bottom, C.timber);
	rect(box, x, BOX.bottom + 1, 1, bottom - BOX.bottom, C.timberLight);
	rect(box, x + w - 2, BOX.bottom + 1, 2, bottom - BOX.bottom, C.timberShade);
	// The board under the mailbox, wider than the post.
	rect(
		box,
		BOX.left + 4,
		BOX.bottom + 1,
		BOX.door - BOX.left - 6,
		2,
		C.timber
	);
	rect(
		box,
		BOX.left + 4,
		BOX.bottom + 1,
		BOX.door - BOX.left - 6,
		1,
		C.timberLight
	);
	// A brace from the post up to the board.
	for (let k = 0; k < 5; k++) {
		set(box, x + w + k, BOX.bottom + 7 - k, C.timberShade);
		set(box, x + w + k, BOX.bottom + 6 - k, C.timber);
	}
}

/**
 * The mailbox: a long rounded steel box seen from the side, shaded down its curved top,
 * and its arched door at the front with a latch and a hinge. No marks on it.
 * @param {Canvas} box
 */
function drawMailbox(box) {
	const { left, door, right, top, bottom } = BOX;
	// The long side: the rounded top catches the sun, the lower part turns into shade.
	for (let y = top; y <= bottom; y++) {
		let colour = STEEL;
		if (y < top + 2) {
			colour = STEEL_LIGHT;
		} else if (y > bottom - 3) {
			colour = STEEL_SHADE;
		}
		rect(box, left, y, door - left, 1, colour);
	}
	// Two pressed ribs round the box.
	for (const x of [left + 4, door - 5]) {
		rect(box, x, top + 2, 1, bottom - top - 4, STEEL_SHADE);
		rect(box, x + 1, top + 2, 1, bottom - top - 4, STEEL_LIGHT);
	}
	// The tail end, rounded off.
	set(box, left, top, null);
	set(box, left, bottom, null);
	// The door: an arch, narrowed because it faces partly away.
	const cx = (door + right) / 2;
	const half = (right - door) / 2 + 0.5;
	for (let x = door; x <= right; x++) {
		const dx = (x - cx) / half;
		const lift = Math.round(5 * (1 - Math.sqrt(Math.max(0, 1 - dx * dx))));
		for (let y = top + lift; y <= bottom; y++) {
			let colour = STEEL_SHADE;
			if (x === door || y === top + lift) {
				colour = STEEL;
			} else if (x === right || y === bottom) {
				colour = STEEL_DARK;
			}
			set(box, x, y, colour);
		}
	}
	// The latch tab at the top of the door and the hinge at its foot.
	rect(box, Math.round(cx) - 1, top + 1, 3, 2, STEEL_LIGHT);
	rect(box, Math.round(cx) - 1, top + 3, 3, 1, STEEL_DARK);
	rect(box, door + 1, bottom - 1, right - door - 1, 1, STEEL_DARK);
}

/**
 * The red flag on the near side, raised: a tall arm on a pivot and its square tip.
 * @param {Canvas} box
 */
function drawFlag(box) {
	const x = BOX.door - 9;
	const pivot = BOX.top + 9;
	rect(box, x, BOX.top - 8, 2, pivot - BOX.top + 9, C.brickRed);
	rect(box, x, BOX.top - 8, 1, pivot - BOX.top + 9, C.brickRedLight);
	rect(box, x + 2, BOX.top - 8, 4, 5, C.brickRed);
	rect(box, x + 2, BOX.top - 8, 4, 1, C.brickRedLight);
	rect(box, x + 2, BOX.top - 4, 4, 1, C.brickRedShade);
	rect(box, x + 5, BOX.top - 7, 1, 3, C.brickRedShade);
	// The pivot bolt.
	set(box, x, pivot, STEEL_DARK);
	set(box, x + 1, pivot, STEEL_DARK);
}

/**
 * The sprinkler: a brass head on a spike, its little nozzle tipped up.
 * @param {Canvas} sprinkler
 */
function drawSprinkler(sprinkler) {
	const { x, y } = SPRINKLER;
	rect(sprinkler, x - 2, y - 1, 5, 2, C.brass);
	rect(sprinkler, x - 2, y - 1, 5, 1, C.gold);
	rect(sprinkler, x - 1, y - 4, 3, 3, C.brass);
	set(sprinkler, x - 1, y - 4, C.gold);
	rect(sprinkler, x + 1, y - 3, 1, 2, C.lampFrame);
	set(sprinkler, x, y - 5, STEEL);
	set(sprinkler, x - 1, y - 6, STEEL);
}

/**
 * The water: two arcs of drops thrown up and out from the nozzle, and a fine mist where they fall.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSpray(scene, random) {
	const sx = SPRINKLER.x - 1;
	const sy = SPRINKLER.y - 7;
	for (const [reach, rise, side] of [
		[22, 10, -1],
		[11, 6, 1],
	]) {
		/** @type {number | undefined} */
		let last;
		for (let i = 1; i <= reach; i++) {
			const t = i / reach;
			const x = Math.round(sx + side * i);
			const y = Math.round(sy - rise * 4 * t * (1 - t) + t * 6);
			// Fill down to the last step, so the jet stays unbroken where it falls steeply.
			const from = last === undefined ? y : Math.min(y, last + 1);
			const to = last === undefined ? y : Math.max(y, last - 1);
			if (i % 5 !== 4) {
				for (let k = from; k <= to; k++) {
					set(scene, x, k, i < 6 ? SPRAY_LIGHT : SPRAY);
				}
			}
			last = y;
		}
	}
	for (let i = 0; i < 14; i++) {
		const side = random() < 0.65 ? -1 : 1;
		const x = Math.round(
			sx + side * (side < 0 ? 17 + random() * 8 : 8 + random() * 5)
		);
		const y = Math.round(SPRINKLER.y - 3 + random() * 5);
		set(scene, x, y, random() < 0.5 ? SPRAY_LIGHT : SPRAY);
	}
}

/**
 * Blades of grass in front of the post and the sprinkler, over the outline.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawTufts(scene, random) {
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		const y = 56 + Math.floor(random() * 7);
		set(scene, x, y, C.grassShade);
		set(scene, x, y - 1, C.grass);
	}
	for (const x of [POST.x - 1, POST.x + 1, POST.x + 3, POST.x + 5]) {
		set(scene, x, POST.bottom, C.grass);
		set(scene, x, POST.bottom - 1, C.grassLight);
	}
}

/**
 * The sun's gleam on the mailbox's rounded top and on the flag, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	rect(scene, BOX.left + 7, BOX.top, 5, 1, C.white);
	set(scene, BOX.left + 2, BOX.top + 1, C.white);
	set(scene, BOX.door - 8, BOX.top - 7, C.white);
}
