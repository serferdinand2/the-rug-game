// Air Conditioning: a boxy mid-century window unit in a sun-baked brick wall, cool air curling from its grille over the hot street.
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

/** The unit's front face, nearest the viewer. Its back sits DEPTH pixels up and to the right, in the window. */
const UNIT = { x: 6, y: 24, w: 37, h: 22 };

/** How far the unit and the sill stand out from the wall: each step back is one pixel right and one up. */
const DEPTH = 5;

/** The window frame's outer edge in the wall; the sill runs along its foot. */
const WINDOW = { x: 7, y: 1, w: 46 };

/** The sill: a stone slab across the wall under the window, standing out as far as the unit. */
const SILL = { x: 4, y: 41, w: 60 };

/** The pavement's first row, and the kerb where the road begins. */
const PAVEMENT = 53;
const ROAD = 58;

/** The thermometer screwed to the wall left of the window: its top row and its column. */
const THERMOMETER = { x: 1, y: 6 };

/** The sun-baked brick: four tones, bleached towards sand, and the dusty mortar between them. */
const BRICKS = [
	C.brickRed,
	mix(C.brickRed, C.brickRedLight, 0.5),
	mix(C.brickRed, C.sandShade, 0.4),
	mix(C.brickRed, C.brickRedShade, 0.4),
];
const MORTAR = mix(C.sandShade, C.creamShade, 0.45);

/** Shadow on the sunlit wall. */
const SHADOW_TINT = mix(C.brickRedShade, C.roofShade, 0.35);

/** The window's paint: a sun-faded green. */
const PAINT = mix(C.pine, C.stone, 0.3);
const PAINT_LIGHT = mix(C.pineLight, C.grassLight, 0.35);
const PAINT_SHADE = mix(C.pineShade, C.ink, 0.25);

/** The cool dark room behind the glass, and the sun-faded roller blind. */
const ROOM = mix(C.nightSky3, C.tealShade, 0.3);
const ROOM_DARK = mix(C.nightSky2, C.ink, 0.3);
const BLIND = mix(C.sand, C.cream, 0.5);
const BLIND_SHADE = mix(C.sandShade, C.cream, 0.3);

/** The unit's enamelled case, its chrome and the dark between its louvres. */
const CASE = C.cream;
const CASE_LIGHT = C.creamLight;
const CASE_SHADE = C.creamShade;
const CASE_DARK = mix(C.creamShade, C.stoneShade, 0.55);
const CHROME = C.stoneLight;
const CHROME_LIGHT = C.white;
const CHROME_SHADE = C.stone;
const GRILLE_DARK = mix(C.stoneShade, C.ink, 0.5);
const GRILLE_COLD = mix(C.tealShade, C.nightSky3, 0.35);

/** The terracotta pot and the wilting plant in it. */
const POT = mix(C.brickRedLight, C.sand, 0.45);
const POT_LIGHT = mix(C.sandLight, C.brickRedLight, 0.3);
const POT_SHADE = mix(C.brickRed, C.timber, 0.45);
const SOIL = mix(C.timber, C.sandShade, 0.25);
const LEAF = mix(C.grassShade, C.sandShade, 0.35);
const LEAF_LIGHT = mix(C.grass, C.sand, 0.4);
const LEAF_DEAD = mix(C.timberLight, C.sandShade, 0.45);

/** The pavement's bleached slabs, and the road's soft hot tar. */
const SLAB = mix(C.sandLight, C.creamShade, 0.4);
const SLAB_SHADE = mix(C.sandShade, C.creamShade, 0.55);
const SLAB_JOINT = mix(C.sandShade, C.stoneShade, 0.5);
const TAR = mix(C.stoneShade, C.roof, 0.45);
const TAR_LIGHT = mix(C.stoneMid, C.roofLight, 0.3);

/** The blazing sun's colour, and the shade it leaves furthest from it. */
const SUN = mix(C.lampGlow, C.gold, 0.4);
const FALLOFF = mix(C.brickRedShade, C.roofShade, 0.4);

/** The cool air: an icy blue body round a white core. */
const AIR = C.foam;
const AIR_CORE = C.white;

/**
 * Draws the Air Conditioning tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const wall = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2417);

	drawBricks(layer, random);
	drawStreet(layer, random);

	drawWindow(wall);
	drawSill(wall);
	drawThermometer(wall);
	outline(wall, C.ink);
	underlay(wall, layer);
	drawShadows(wall);

	drawUnit(scene);
	drawPlant(scene);
	outline(scene, C.ink);
	underlay(scene, wall);

	drawFalloff(scene);
	glow(scene, {
		x: 0,
		y: 0,
		radius: 64,
		colour: SUN,
		strength: 0.28,
		steps: 3,
		skip: [C.ink],
	});
	drawHeat(scene, random);
	drawAir(scene);
	drawGleams(scene);
	return scene;
}

/**
 * The brick wall: courses of eight-pixel bricks in a running bond, each lit along its top by the high sun.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBricks(layer, random) {
	/** @type {number[]} */
	const tones = [];
	for (let i = 0; i < 160; i++) {
		tones.push(Math.floor(random() * BRICKS.length));
	}
	for (let y = 0; y < PAVEMENT; y++) {
		const course = Math.floor(y / 4);
		for (let x = 0; x < 64; x++) {
			const shifted = x + (course % 2) * 4;
			if (y % 4 === 3 || shifted % 8 === 7) {
				set(layer, x, y, MORTAR);
				continue;
			}
			const brick = BRICKS[tones[course * 9 + Math.floor(shifted / 8)]];
			set(
				layer,
				x,
				y,
				y % 4 === 0 ? mix(brick, C.sandLight, 0.25) : brick
			);
		}
	}
}

/**
 * The street below the wall: a pavement of bleached slabs, a kerb, and the road's tar.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStreet(layer, random) {
	for (let y = PAVEMENT; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = SLAB;
			if (y === PAVEMENT) {
				colour = SLAB_JOINT;
			} else if (y === ROAD - 1) {
				colour = C.stoneShade;
			} else if (y >= ROAD) {
				colour = TAR;
			} else if ((x + (y - PAVEMENT) * 3) % 16 === 0) {
				colour = SLAB_JOINT;
			} else if (y === ROAD - 2) {
				colour = SLAB_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		const y = ROAD + 1 + Math.floor(random() * (63 - ROAD));
		set(layer, x, y, TAR_LIGHT);
	}
}

/**
 * The sash window the unit sits in: the frame, the glass onto a cool dark room with a half-drawn blind,
 * the lower sash brought down onto the unit and the folding panel that fills the gap beside it.
 * @param {Canvas} wall
 */
function drawWindow(wall) {
	const { x: wx, y: wy, w: ww } = WINDOW;
	const right = wx + ww - 1;
	// The frame.
	rect(wall, wx, wy, ww, SILL.y - wy, PAINT);
	rect(wall, wx, wy, ww, 1, PAINT_LIGHT);
	rect(wall, wx, wy, 1, SILL.y - wy, PAINT_LIGHT);
	rect(wall, right, wy + 1, 1, SILL.y - wy - 1, PAINT_SHADE);
	// The glass and the room behind it.
	const glass = { x: wx + 2, y: wy + 2, w: ww - 4, h: 13 };
	for (let y = glass.y; y < glass.y + glass.h; y++) {
		for (let x = glass.x; x < glass.x + glass.w; x++) {
			set(wall, x, y, (x + y) % 2 === 0 ? ROOM : ROOM_DARK);
		}
	}
	// The blind, pulled half down against the sun, with its pull cord.
	rect(wall, glass.x, glass.y, glass.w, 6, BLIND);
	for (let x = glass.x + 1; x < glass.x + glass.w; x += 4) {
		rect(wall, x, glass.y, 1, 6, BLIND_SHADE);
	}
	rect(wall, glass.x, glass.y + 6, glass.w, 1, C.timberLight);
	const cord = glass.x + Math.floor(glass.w / 4);
	set(wall, cord, glass.y + 7, C.creamShade);
	set(wall, cord, glass.y + 8, C.brass);
	// The glazing bars and the meeting rail of the two sashes.
	const mid = glass.x + Math.floor(glass.w / 2) - 1;
	rect(wall, mid, glass.y, 2, glass.h, PAINT);
	rect(wall, mid, glass.y, 1, glass.h, PAINT_LIGHT);
	rect(wall, glass.x, glass.y + 9, glass.w, 2, PAINT);
	rect(wall, glass.x, glass.y + 9, glass.w, 1, PAINT_LIGHT);
	// The lower sash's bottom rail, brought down onto the unit.
	const rail = glass.y + glass.h;
	rect(wall, wx + 1, rail, ww - 2, 2, PAINT);
	rect(wall, wx + 1, rail, ww - 2, 1, PAINT_LIGHT);
	// The folding panel that closes the gap beside the unit.
	const back = UNIT.x + UNIT.w + DEPTH;
	for (let x = back; x < right - 1; x++) {
		for (let y = rail + 2; y < SILL.y; y++) {
			set(wall, x, y, (x - back) % 2 === 0 ? CASE_LIGHT : CASE_SHADE);
		}
	}
}

/**
 * The stone sill: a slab standing out from the wall, its top lit and its front in shade.
 * @param {Canvas} wall
 */
function drawSill(wall) {
	for (let k = 0; k < DEPTH; k++) {
		const y = SILL.y + k;
		for (let x = SILL.x - k; x < SILL.x + SILL.w - k; x++) {
			set(wall, x, y, k === DEPTH - 1 ? C.stoneLight : C.stone);
		}
	}
	rect(wall, SILL.x - DEPTH, SILL.y + DEPTH, SILL.w, 2, C.stoneMid);
	rect(wall, SILL.x - DEPTH, SILL.y + DEPTH + 1, SILL.w, 1, C.stoneShade);
}

/**
 * The thermometer on the wall: an enamel plate with tick marks and a red column run almost to the top.
 * @param {Canvas} wall
 */
function drawThermometer(wall) {
	const { x: tx, y: ty } = THERMOMETER;
	rect(wall, tx, ty, 5, 18, C.creamLight);
	rect(wall, tx + 4, ty + 1, 1, 17, C.creamShade);
	rect(wall, tx + 1, ty + 17, 4, 1, C.creamShade);
	// The glass tube and its red column, with tick marks down the side.
	rect(wall, tx + 2, ty + 1, 1, 14, C.stoneLight);
	rect(wall, tx + 2, ty + 3, 1, 12, C.brickRed);
	rect(wall, tx + 1, ty + 14, 3, 3, C.brickRed);
	set(wall, tx + 1, ty + 14, C.brickRedLight);
	for (let y = ty + 2; y < ty + 14; y += 2) {
		set(wall, tx + 3, y, C.stoneShade);
	}
	// The screws holding it to the wall.
	set(wall, tx + 2, ty, C.stoneShade);
}

/**
 * Hard midday shadows, cast down and to the right: the unit's on the folding panel and the frame,
 * the sill's on the bricks below it, the frame's on the glass and the thermometer's on the wall.
 * @param {Canvas} wall
 */
function drawShadows(wall) {
	/**
	 * Darkens one wall pixel.
	 * @param {number} x
	 * @param {number} y
	 */
	const darken = (x, y) => {
		const colour = get(wall, x, y);
		if (colour && colour !== C.ink) {
			set(wall, x, y, mix(colour, SHADOW_TINT, 0.5));
		}
	};
	// The unit's shadow beside its side and on the sill.
	const back = UNIT.x + UNIT.w + DEPTH;
	for (let y = UNIT.y - DEPTH + 3; y < SILL.y + DEPTH; y++) {
		const reach = y < SILL.y ? 5 : SILL.y + DEPTH - y;
		for (
			let x = back - (y >= SILL.y ? y - SILL.y + 1 : 0);
			x < back + reach;
			x++
		) {
			darken(x, y);
		}
	}
	// The sill's shadow on the bricks below it.
	for (let y = SILL.y + DEPTH + 2; y < SILL.y + DEPTH + 4; y++) {
		for (let x = 0; x < SILL.x + SILL.w - DEPTH + 2; x++) {
			darken(x, y);
		}
	}
	// The frame's shadow along the top and left of the glass.
	for (let x = WINDOW.x + 2; x < WINDOW.x + WINDOW.w - 2; x++) {
		darken(x, WINDOW.y + 2);
	}
	for (let y = WINDOW.y + 3; y < WINDOW.y + 15; y++) {
		darken(WINDOW.x + 2, y);
	}
	// The thermometer's shadow on the bricks.
	for (let y = THERMOMETER.y + 2; y <= THERMOMETER.y + 19; y++) {
		darken(THERMOMETER.x + 6, y);
	}
	for (let x = THERMOMETER.x + 1; x <= THERMOMETER.x + 6; x++) {
		darken(x, THERMOMETER.y + 19);
	}
}

/**
 * The air conditioner: a boxy enamelled case standing out of the window, its top lit by the sun and its side in shade,
 * a chrome-framed front of angled louvres, a control strip with two knobs and a chrome strip along its foot.
 * @param {Canvas} scene
 */
function drawUnit(scene) {
	const { x: ux, y: uy, w, h } = UNIT;
	const right = ux + w - 1;
	const bottom = uy + h - 1;
	// The top, lit by the sun, with a row of vent slots along its back.
	for (let k = 1; k <= DEPTH; k++) {
		const y = uy - k;
		for (let x = ux + k; x <= right + k; x++) {
			set(scene, x, y, k === 1 ? CASE_LIGHT : C.white);
		}
	}
	for (let x = ux + DEPTH + 5; x <= right; x += 3) {
		set(scene, x, uy - DEPTH + 1, CASE_SHADE);
		set(scene, x + 1, uy - DEPTH + 1, CASE_SHADE);
	}
	// The side, in shade, with its slanting vent slots.
	for (let k = 1; k <= DEPTH; k++) {
		const x = right + k;
		for (let y = uy - k; y <= bottom - k; y++) {
			set(scene, x, y, k === 1 ? CASE_SHADE : CASE_DARK);
		}
	}
	for (let y = uy + 3; y < bottom - 3; y += 3) {
		line(scene, right + 2, y, right + 4, y - 2, GRILLE_DARK);
	}
	// The front: enamel, lit along its top and left, shaded along its foot and right.
	rect(scene, ux, uy, w, h, CASE);
	rect(scene, ux, uy, 6, h, CASE_LIGHT);
	rect(scene, ux + 6, uy, 1, h, mix(CASE, CASE_LIGHT, 0.5));
	rect(scene, ux, uy, w, 1, CASE_LIGHT);
	rect(scene, right - 4, uy + 1, 4, h - 1, mix(CASE, CASE_SHADE, 0.5));
	rect(scene, right, uy, 1, h, CASE_SHADE);
	rect(scene, ux, bottom, w, 1, CASE_SHADE);
	// The control strip along the top: a chrome badge and two knobs.
	rect(scene, ux + 3, uy + 2, 14, 2, CHROME);
	rect(scene, ux + 3, uy + 2, 14, 1, CHROME_LIGHT);
	rect(scene, ux + 3, uy + 4, 14, 1, CASE_SHADE);
	drawKnob(scene, right - 10, uy + 3);
	drawKnob(scene, right - 4, uy + 3);
	// The grille: a chrome bezel round angled louvres, each lit along its top.
	const grille = { x: ux + 3, y: uy + 7, w: w - 6, h: 10 };
	rect(
		scene,
		grille.x - 1,
		grille.y - 1,
		grille.w + 2,
		grille.h + 2,
		CHROME_SHADE
	);
	rect(scene, grille.x - 1, grille.y - 1, grille.w + 2, 1, CHROME_LIGHT);
	rect(scene, grille.x - 1, grille.y - 1, 1, grille.h + 2, CHROME);
	for (let y = grille.y; y < grille.y + grille.h; y++) {
		const band = (y - grille.y) % 3;
		const colour =
			band === 0 ? CHROME_LIGHT : band === 1 ? CHROME : GRILLE_COLD;
		rect(scene, grille.x, y, grille.w, 1, colour);
	}
	// The braces that hold the louvres.
	for (const bx of [grille.x + 10, grille.x + grille.w - 11]) {
		for (let y = grille.y; y < grille.y + grille.h; y++) {
			set(scene, bx, y, (y - grille.y) % 3 === 2 ? C.ink : CHROME_SHADE);
		}
	}
	// The chrome strip along the foot.
	rect(scene, ux + 1, bottom - 3, w - 2, 2, CHROME);
	rect(scene, ux + 1, bottom - 3, w - 2, 1, CHROME_LIGHT);
	rect(scene, ux + 1, bottom - 1, w - 2, 1, CASE_SHADE);
}

/**
 * One small chrome control knob, lit on its top-left, with a dark pointer mark.
 * @param {Canvas} scene
 * @param {number} cx - The knob's centre column
 * @param {number} cy - The knob's centre row
 */
function drawKnob(scene, cx, cy) {
	for (let y = cy - 2; y <= cy + 2; y++) {
		for (let x = cx - 2; x <= cx + 2; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d >= 2.5) {
				continue;
			}
			let colour = CHROME;
			if (d > 1.8) {
				colour = x - cx + (y - cy) < 0 ? CHROME_LIGHT : CHROME_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, cx, cy - 1, GRILLE_DARK);
	set(scene, cx, cy, GRILLE_DARK);
}

/**
 * The wilting plant on the sill: a terracotta pot of dry soil, its leaves hanging limp and a flower nodding to the sill.
 * @param {Canvas} scene
 */
function drawPlant(scene) {
	const px = 50;
	const py = SILL.y + 3;
	// The pot: a rim over a tapering body, lit on the left.
	for (let row = 0; row < 9; row++) {
		const y = py - row;
		const rim = row >= 7;
		const inset = rim ? 0 : Math.floor((7 - row) / 4) + 1;
		const left = px + inset;
		const right = px + 9 - inset;
		for (let x = left; x <= right; x++) {
			let colour = POT;
			if (rim) {
				colour =
					row === 8 ? POT_LIGHT : x >= right - 1 ? POT_SHADE : POT;
			} else if (x <= left + 1) {
				colour = POT_LIGHT;
			} else if (x >= right - 1) {
				colour = POT_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, px + 1, py - 9, 8, 1, SOIL);
	set(scene, px + 3, py - 9, LEAF_DEAD);
	// The stem, rising and then bowed over by the heat, the flower hanging head down.
	line(scene, px + 5, py - 10, px + 5, py - 18, LEAF);
	line(scene, px + 6, py - 19, px + 8, py - 20, LEAF);
	line(scene, px + 9, py - 19, px + 10, py - 17, LEAF);
	// The flower: gold petals round an amber heart, pointing down at the sill.
	rect(scene, px + 9, py - 16, 3, 1, LEAF);
	rect(scene, px + 8, py - 15, 5, 2, C.gold);
	rect(scene, px + 9, py - 15, 3, 1, C.amber);
	set(scene, px + 8, py - 13, C.gold);
	set(scene, px + 10, py - 13, C.amber);
	set(scene, px + 12, py - 13, C.gold);
	// The leaves, hanging limp over the rim.
	for (const [x, y, colour] of /** @type {[number, number, Colour][]} */ ([
		[px + 4, py - 11, LEAF],
		[px + 3, py - 12, LEAF_LIGHT],
		[px + 2, py - 12, LEAF_LIGHT],
		[px + 1, py - 11, LEAF],
		[px, py - 10, LEAF],
		[px - 1, py - 9, LEAF],
		[px - 1, py - 8, LEAF_DEAD],
		[px - 1, py - 7, LEAF_DEAD],
		[px + 6, py - 14, LEAF],
		[px + 7, py - 13, LEAF_LIGHT],
		[px + 7, py - 12, LEAF],
		[px + 7, py - 11, LEAF_DEAD],
	])) {
		set(scene, x, y, colour);
	}
	// A dead leaf fallen on the sill.
	rect(scene, px - 5, py, 3, 1, LEAF_DEAD);
	set(scene, px - 4, py - 1, LEAF_DEAD);
}

/**
 * The light falling off away from the sun: the lower right of the scene, furthest from it, a shade deeper.
 * @param {Canvas} scene
 */
function drawFalloff(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x, y) / 90;
			const colour = get(scene, x, y);
			if (!colour || colour === C.ink || d < 0.6) {
				continue;
			}
			set(scene, x, y, mix(colour, FALLOFF, d < 0.8 ? 0.12 : 0.24));
		}
	}
}

/**
 * Heat shimmering off the street: glinting streaks on the soft tar, and wavering bands of paler air over the pavement.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHeat(scene, random) {
	for (let y = ROAD + 1; y < 64; y += 2) {
		const phase = random() * Math.PI * 2;
		for (let x = 0; x < 64; x++) {
			if (Math.sin(x * 0.3 + phase) > 0.5) {
				set(scene, x, y, mix(TAR, C.sandLight, 0.35));
			}
		}
	}
	for (let y = PAVEMENT - 2; y < ROAD - 2; y += 3) {
		const phase = random() * Math.PI * 2;
		for (let x = 0; x < 64; x++) {
			const yy = y + (Math.sin(x * 0.5 + phase) > 0 ? -1 : 0);
			const colour = get(scene, x, yy);
			if (
				!colour ||
				colour === C.ink ||
				Math.sin(x * 0.17 + phase * 2) < 0
			) {
				continue;
			}
			set(scene, x, yy, mix(colour, C.lampGlow, 0.4));
		}
	}
}

/**
 * The cool air: ribbons pouring out of the louvres and sinking over the hot wall, with flakes of frost in them.
 * @param {Canvas} scene
 */
function drawAir(scene) {
	drawGust(
		scene,
		[
			[13, 38],
			[10, 45],
			[5, 46],
			[3, 42],
		],
		1
	);
	drawGust(
		scene,
		[
			[22, 39],
			[21, 50],
			[12, 54],
			[8, 51],
		],
		1
	);
	drawGust(
		scene,
		[
			[31, 39],
			[33, 55],
			[22, 61],
			[17, 58],
		],
		1
	);
	for (const [x, y] of [
		[2, 54],
		[28, 50],
		[11, 61],
	]) {
		drawFlake(scene, x, y);
	}
}

/**
 * One gust: a see-through ribbon of cool air leaving the grille along a curve, thinning as it goes,
 * with a white streak down its middle and a curl at its end.
 * @param {Canvas} scene
 * @param {[number, number][]} curve - The four points of its Bézier curve, starting at the grille
 * @param {1 | -1} spin - Which way the end curls: 1 clockwise, -1 anticlockwise
 */
function drawGust(scene, curve, spin) {
	const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = curve;
	/** @type {[number, number][]} */
	const path = [];
	for (let i = 0; i <= 60; i++) {
		const t = i / 60;
		const u = 1 - t;
		path.push([
			u * u * u * x0 +
				3 * u * u * t * x1 +
				3 * u * t * t * x2 +
				t * t * t * x3,
			u * u * u * y0 +
				3 * u * u * t * y1 +
				3 * u * t * t * y2 +
				t * t * t * y3,
		]);
	}
	// The curl: an arc turning on from the curve's last direction and tightening.
	const heading = Math.atan2(y3 - y2, x3 - x2);
	const r = 2;
	const cx = x3 + Math.cos(heading + (spin * Math.PI) / 2) * r;
	const cy = y3 + Math.sin(heading + (spin * Math.PI) / 2) * r;
	const start = Math.atan2(y3 - cy, x3 - cx);
	for (let a = 0; a <= Math.PI * 1.3; a += 0.08) {
		const rr = r * (1 - a / (Math.PI * 3));
		path.push([
			cx + Math.cos(start + a * spin) * rr,
			cy + Math.sin(start + a * spin) * rr,
		]);
	}
	/** @type {Map<number, number>} */
	const body = new Map();
	path.forEach(([x, y], i) => {
		const t = i / path.length;
		const width = 1.9 - t * 1.3;
		for (let py = Math.floor(y - width); py <= Math.ceil(y + width); py++) {
			for (
				let px = Math.floor(x - width);
				px <= Math.ceil(x + width);
				px++
			) {
				const d = Math.hypot(px - x, py - y);
				if (d <= width && px >= 0 && py >= 0 && px < 64 && py < 64) {
					const key = py * 64 + px;
					const strength = d <= width - 0.8 ? 2 : 1;
					body.set(key, Math.max(body.get(key) ?? 0, strength));
				}
			}
		}
	});
	for (const [key, strength] of body) {
		const x = key % 64;
		const y = Math.floor(key / 64);
		const colour = get(scene, x, y);
		if (colour) {
			set(scene, x, y, mix(colour, AIR, strength === 2 ? 0.75 : 0.45));
		}
	}
	/** @type {Set<number>} */
	const core = new Set();
	path.forEach(([x, y], i) => {
		const px = Math.round(x);
		const py = Math.round(y);
		const t = i / path.length;
		if (core.has(py * 64 + px) || t > 0.8) {
			return;
		}
		core.add(py * 64 + px);
		const colour = get(scene, px, py);
		if (colour) {
			set(scene, px, py, mix(colour, AIR_CORE, 0.8));
		}
	});
}

/**
 * A tiny flake of frost: a white centre with four pale arms.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 */
function drawFlake(scene, x, y) {
	set(scene, x, y, C.white);
	for (const [dx, dy] of [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		const colour = get(scene, x + dx, y + dy);
		if (colour) {
			set(scene, x + dx, y + dy, mix(colour, AIR, 0.8));
		}
	}
}

/**
 * The sun's last gleams on the chrome, the case and the glass, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[UNIT.x + 1, UNIT.y + 1],
		[UNIT.x + 2, UNIT.y + 1],
		[UNIT.x + 1, UNIT.y + 2],
		[UNIT.x + 4, UNIT.y + 2],
	]) {
		set(scene, x, y, C.white);
	}
	// Glare streaks across the glass.
	for (let k = 0; k < 4; k++) {
		set(scene, 38 + k, 13 - k, mix(ROOM, C.white, 0.5));
		set(scene, 40 + k, 13 - k, mix(ROOM, C.white, 0.3));
	}
}
