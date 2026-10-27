// Urban Planners: a planner bent over a model city on her table, setting a compass to its streets, the real city's towers in the bright window behind her.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawInterior } from '../../parts/interior.js';
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The table top's first row. */
const TABLE = 43;

/** The face's centre column. */
const FACE_X = 23;

/** The window in the back wall, frame included. */
const WINDOW = { x: 34, y: 2, w: 29, h: 31 };

/** Where the compass's hinge sits, and where its two points touch the model. */
const HINGE = { x: 17, y: 41 };
const POINTS = [
	{ x: 12, y: 54 },
	{ x: 23, y: 54 },
];

/** Skin: lit by the window on her left (the picture's right), plain, and shaded. */
const SKIN = {
	glint: mix(C.skin, C.white, 0.4),
	lit: mix(C.skin, C.creamLight, 0.2),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.timberShade, 0.35),
};

/** Dark brown hair, cut in a bob. */
const HAIR = {
	lit: C.timber,
	base: C.timberShade,
	dark: C.wood,
};

/** The mustard jacket: lit by the window, plain, shaded and in shadow. */
const JACKET = {
	lit: mix(C.gold, C.amber, 0.35),
	base: C.amber,
	shade: mix(C.amber, C.lampFrame, 0.5),
	dark: C.lampFrame,
};

/** The model's pale card buildings: top, lit side, shaded side. */
const CARD = { top: C.white, lit: C.cream, shade: C.creamShade };

/** The face and hands are lit by hand, so the window's glow leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	C.ink,
	C.white,
	C.creamLight,
];

/**
 * Draws the Urban Planners portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8435);

	drawInterior(layer, {
		floor: TABLE,
		random,
		wall: 'plaster',
		window: { ...WINDOW, time: 'day' },
	});
	drawCityView(layer, random);
	drawBlueprint(layer);

	// Back to front: the planner, the table and the model on it, then her arms, hands and compass.
	const figure = createCanvas(64, 64);
	drawJacket(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const table = createCanvas(64, 64);
	drawTable(table);
	drawModel(table, random);
	underlay(table, figure);

	drawArms(scene);
	drawCompass(scene);
	drawHands(scene);
	outline(scene, C.ink);
	underlay(scene, table);
	underlay(scene, layer);

	glow(scene, {
		x: WINDOW.x + 14,
		y: WINDOW.y + 16,
		radius: 40,
		colour: C.white,
		strength: 0.2,
		steps: 4,
		skip: FIGURE,
	});
	return scene;
}

/**
 * The real city seen through the window: day towers rising behind the panes, with a few taller glass ones.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCityView(layer, random) {
	const city = createCanvas(64, 64);
	const base = WINDOW.y + WINDOW.h - 2;
	drawSkyline(city, { base, time: 'day', random, height: 20 });
	// Two glass towers standing above the rest.
	for (const [x, w, top] of [
		[40, 5, WINDOW.y + 6],
		[53, 4, WINDOW.y + 9],
	]) {
		for (let y = top; y <= base; y++) {
			for (let i = 0; i < w; i++) {
				let colour = C.daySky2;
				if (i === 0) {
					colour = C.daySky5;
				} else if (i === w - 1) {
					colour = C.daySea3;
				} else if (y % 3 === 0) {
					colour = C.daySky4;
				}
				set(city, x + i, y, colour);
			}
		}
	}
	const midX = WINDOW.x + Math.floor(WINDOW.w / 2);
	const midY = WINDOW.y + Math.floor(WINDOW.h / 2);
	for (let y = WINDOW.y + 1; y < WINDOW.y + WINDOW.h - 1; y++) {
		for (let x = WINDOW.x + 1; x < WINDOW.x + WINDOW.w - 1; x++) {
			const colour = get(city, x, y);
			if (colour && x !== midX && y !== midY) {
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * A blueprint pinned to the wall at the left: a district plan of solid pale blocks of different sizes
 * between dark streets that don't line up, and no lettering.
 * @param {Canvas} layer
 */
function drawBlueprint(layer) {
	for (let y = 4; y <= 17; y++) {
		for (let x = 1; x <= 12; x++) {
			const edge = x === 1 || y === 4 || x === 12 || y === 17;
			set(layer, x, y, edge ? C.daySea3 : C.daySea2);
		}
	}
	// The blocks: [left, top, width, height], each lit along its top.
	for (const [x, y, w, h] of [
		[3, 6, 4, 3],
		[8, 6, 3, 2],
		[8, 9, 3, 3],
		[3, 10, 4, 3],
		[3, 14, 2, 2],
		[6, 14, 5, 2],
	]) {
		rect(layer, x, y, w, h, C.daySky5);
		rect(layer, x, y, w, 1, C.daySky6);
	}
	set(layer, 6, 4, C.brickRed);
	set(layer, 11, 4, C.brickRed);
}

/**
 * Her mustard jacket over a white shirt, leaning forward over the table, lit by the window on her left.
 * @param {Canvas} scene
 */
function drawJacket(scene) {
	// The neck.
	rect(scene, FACE_X - 2, 24, 5, 4, SKIN.shade);
	rect(scene, FACE_X + 1, 24, 2, 4, SKIN.base);
	for (let y = 28; y < TABLE + 2; y++) {
		const half = Math.min(19, 8 + Math.round((y - 28) * 2.6));
		for (let x = FACE_X - half; x <= FACE_X + half + 2; x++) {
			const u = (x - FACE_X) / half;
			let colour = JACKET.base;
			if (u > 0.75) {
				colour = JACKET.lit;
			} else if (u < -0.7) {
				colour = JACKET.dark;
			} else if (u < -0.2) {
				colour = JACKET.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The white shirt in a V, and the lapels either side of it.
	for (let y = 28; y < TABLE + 2; y++) {
		const half = Math.max(0, 3 - Math.floor((y - 28) / 4));
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			set(scene, x, y, x > FACE_X ? C.white : C.cream);
		}
		set(scene, FACE_X - half - 1, y, JACKET.dark);
		set(scene, FACE_X + half + 2, y, JACKET.lit);
	}
	// A pen clipped in her breast pocket.
	rect(scene, FACE_X + 8, 33, 1, 4, C.brickRed);
	rect(scene, FACE_X + 7, 37, 4, 1, JACKET.shade);
}

/**
 * Her head bowed a little over the model: a dark bob with a fringe swept aside, a pencil behind her ear,
 * eyes lowered to the compass, and a small pearl earring; lit by the window on her left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// A chin-length bob, parted on the far side, lit along the window's side.
	for (let y = 4; y <= 25; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
			const crown =
				((x - FACE_X - 0.5) / 9) ** 2 + ((y - 13) / 9) ** 2 <= 1;
			const sides =
				y >= 13 &&
				x >= FACE_X - 9 + Math.max(0, y - 22) &&
				x <= FACE_X + 10 - Math.max(0, y - 22);
			if (!crown && !sides) {
				continue;
			}
			let colour = HAIR.base;
			if (x > FACE_X + 6) {
				colour = HAIR.lit;
			} else if (x < FACE_X - 6) {
				colour = HAIR.dark;
			} else if (
				y === 5 + (Math.abs(x - FACE_X + 3) % 2) &&
				x > FACE_X - 3
			) {
				colour = HAIR.lit;
			}
			set(scene, x, y, colour);
		}
	}
	// The ends of the bob curling under at the jaw.
	rect(scene, FACE_X - 9, 24, 3, 1, HAIR.dark);
	rect(scene, FACE_X + 8, 24, 3, 1, HAIR.base);
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -3, 4],
		[11, -5, 6],
		[12, -6, 6],
		[13, -6, 7],
		[14, -6, 7],
		[15, -6, 7],
		[16, -6, 7],
		[17, -6, 7],
		[18, -5, 6],
		[19, -5, 6],
		[20, -4, 6],
		[21, -4, 5],
		[22, -3, 4],
		[23, -2, 3],
		[24, -1, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 5) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// A fringe swept across her brow to the far side.
	paint(
		scene,
		FACE_X - 6,
		9,
		['.dbbbbbbLL.', 'dbbbbbb....', 'dbbb.......', 'db.........'],
		{
			d: HAIR.dark,
			b: HAIR.base,
			L: HAIR.lit,
		}
	);
	// A pencil tucked behind the near ear, and a pearl earring below it.
	line(scene, FACE_X + 7, 15, FACE_X + 11, 11, C.gold);
	set(scene, FACE_X + 11, 11, C.brickRedLight);
	set(scene, FACE_X + 7, 15, C.wood);
	set(scene, FACE_X + 8, 18, C.white);
	// Brows, and eyes lowered to the model: dark lashes over the pupils.
	rect(scene, FACE_X - 4, 13, 3, 1, HAIR.base);
	rect(scene, FACE_X + 2, 13, 3, 1, HAIR.base);
	rect(scene, FACE_X - 4, 15, 3, 1, C.ink);
	rect(scene, FACE_X + 2, 15, 3, 1, C.ink);
	set(scene, FACE_X - 3, 16, C.wood);
	set(scene, FACE_X + 3, 16, C.wood);
	set(scene, FACE_X - 4, 16, mix(C.cream, C.skinShade, 0.4));
	set(scene, FACE_X + 4, 16, C.creamLight);
	// The nose: a shade line down its far side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// Lips pressed together in thought.
	rect(scene, FACE_X - 1, 21, 3, 1, C.brickRedShade);
	rect(scene, FACE_X, 22, 2, 1, mix(C.brickRed, C.skin, 0.5));
	// A touch of colour on the lit cheek.
	set(scene, FACE_X + 4, 19, mix(C.skin, C.brickRedLight, 0.3));
}

/**
 * The table's edge and the board under the model: a pale wooden top lit along its front, and a grey baseboard.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.timberLight;
			if (y === TABLE) {
				colour = mix(C.timberLight, C.sandLight, 0.5);
			} else if (y >= 61) {
				colour = y === 61 ? C.timber : C.timberShade;
			} else if ((x + y * 5) % 17 === 0) {
				colour = C.timber;
			}
			set(scene, x, y, colour);
		}
	}
	// The baseboard, its edge lit, laid with pale streets every few blocks.
	for (let y = TABLE + 2; y <= 59; y++) {
		for (let x = 2; x <= 61; x++) {
			let colour = C.stone;
			if (y === TABLE + 2 || x === 2) {
				colour = C.stoneShade;
			} else if (y === 59 || x === 61) {
				colour = C.stoneMid;
			} else if ((x - 2) % 9 === 0 || (y - TABLE - 2) % 6 === 0) {
				colour = C.stoneLight;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The model city on its board: blocks of white card buildings between the streets, a green park with trees,
 * a blue river crossed by a bridge, and two tall teal towers; each block shows its roof, its front and its shaded side.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawModel(scene, random) {
	// The river winding across the board's right side, and a bridge over it.
	for (let y = TABLE + 3; y <= 58; y++) {
		const cx = 48 + Math.round(Math.sin((y - TABLE) * 0.35) * 2);
		for (let x = cx - 2; x <= cx + 2; x++) {
			set(scene, x, y, Math.abs(x - cx) === 2 ? C.daySea1 : C.daySky4);
		}
	}
	rect(scene, 44, 51, 9, 1, C.stoneLight);
	rect(scene, 44, 52, 9, 1, C.stoneShade);
	// A green park with round trees.
	rect(scene, 54, 53, 7, 6, C.grass);
	rect(scene, 54, 53, 7, 1, C.grassLight);
	for (const [x, y] of [
		[56, 55],
		[59, 56],
		[56, 58],
	]) {
		paint(scene, x - 1, y - 1, ['.g.', 'gGg', '.p.'], {
			g: C.pine,
			G: C.pineLight,
			p: C.wood,
		});
	}
	// The blocks: [left, bottom, width, height], set inside the street grid.
	/** @type {[number, number, number, number][]} */
	const blocks = [
		[4, 50, 6, 3],
		[4, 56, 3, 4],
		[8, 57, 2, 2],
		[13, 50, 6, 4],
		[13, 57, 6, 3],
		[22, 50, 6, 3],
		[22, 57, 6, 3],
		[40, 57, 4, 3],
		[54, 50, 6, 3],
	];
	for (const [x, bottom, w, h] of blocks) {
		drawBlock(scene, x, bottom, w, h, CARD);
		// Rows of tiny windows on the front.
		for (let y = bottom - h + 2; y <= bottom; y += 2) {
			for (let i = 1; i < w - 1; i += 2) {
				if (random() < 0.6) {
					set(scene, x + i, y, C.stoneLight);
				}
			}
		}
	}
	// Two tall teal towers, the new heart of the plan.
	drawBlock(scene, 31, 57, 3, 11, {
		top: C.tealLight,
		lit: C.teal,
		shade: C.tealShade,
	});
	drawBlock(scene, 36, 56, 3, 8, {
		top: C.tealLight,
		lit: C.teal,
		shade: C.tealShade,
	});
}

/**
 * One model building: a block seen from above and in front, its roof on top, its front face below,
 * its right side in shade and its shadow on the board.
 * @param {Canvas} scene
 * @param {number} x - Its front face's left column
 * @param {number} bottom - Its front face's bottom row
 * @param {number} w - Its front face's width
 * @param {number} h - Its front face's height
 * @param {{ top: Colour, lit: Colour, shade: Colour }} colours
 */
function drawBlock(scene, x, bottom, w, h, { top, lit, shade }) {
	rect(scene, x, bottom - h + 1, w, h, lit);
	rect(scene, x, bottom - h - 1, w, 2, top);
	rect(scene, x + w, bottom - h, 1, h + 1, shade);
	rect(scene, x + 1, bottom + 1, w, 1, C.stoneShade);
}

/**
 * A thick sleeve from one point to another, rounded at both ends, lit on the side facing the window.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} r - Its half-thickness
 */
function drawSleeve(scene, [x0, y0], [x1, y1], r) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = Math.hypot(dx, dy);
	// The normal that faces the window, up and to the right.
	let nx = -dy / length;
	let ny = dx / length;
	if (nx - ny < 0) {
		nx = -nx;
		ny = -ny;
	}
	const reach = Math.ceil(r) + 1;
	for (let y = Math.min(y0, y1) - reach; y <= Math.max(y0, y1) + reach; y++) {
		for (
			let x = Math.min(x0, x1) - reach;
			x <= Math.max(x0, x1) + reach;
			x++
		) {
			const t = Math.max(
				0,
				Math.min(1, ((x - x0) * dx + (y - y0) * dy) / length ** 2)
			);
			const px = x - (x0 + t * dx);
			const py = y - (y0 + t * dy);
			if (Math.hypot(px, py) > r) {
				continue;
			}
			const side = (px * nx + py * ny) / r;
			let colour = JACKET.base;
			if (side > 0.45) {
				colour = JACKET.lit;
			} else if (side < -0.4) {
				colour = JACKET.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Her arms on the table: the near one reaching down to the compass, the far one leaning on the table's edge.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	drawSleeve(scene, [9, 32], [14, 37], 4.4);
	drawSleeve(scene, [37, 33], [42, 44], 4.6);
	// White shirt cuffs.
	paint(scene, 14, 36, ['.cc', 'ccC', 'cC.'], {
		c: C.cream,
		C: C.creamShade,
	});
	rect(scene, 40, 46, 4, 2, C.white);
}

/**
 * The brass compass, its legs opened across a street, one point on the model, the other in pencil.
 * @param {Canvas} scene
 */
function drawCompass(scene) {
	const [a, b] = POINTS;
	line(scene, HINGE.x, HINGE.y, a.x, a.y, C.stoneLight);
	line(scene, HINGE.x + 1, HINGE.y, a.x + 1, a.y - 1, C.stone);
	line(scene, HINGE.x + 1, HINGE.y, b.x, b.y, C.brass);
	line(scene, HINGE.x + 2, HINGE.y, b.x + 1, b.y - 1, C.lampFrame);
	paint(scene, HINGE.x - 1, HINGE.y - 3, ['.gg.', 'gGGg', '.ga.'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
	});
	set(scene, a.x, a.y + 1, C.ink);
	set(scene, b.x, b.y + 1, C.night);
}

/**
 * Her hands: the near one pinching the compass's head, the far one laid flat on the table's edge.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	paint(scene, 15, 38, ['.SSL.', 'sSSSL', 'sS.SL', '.s..L'], {
		s: SKIN.shade,
		S: SKIN.base,
		L: SKIN.lit,
	});
	paint(scene, 41, 44, ['..SSLL.', '.SSSSLL', 'sSSSSSL', 'ss.s.s.'], {
		s: SKIN.shade,
		S: SKIN.base,
		L: SKIN.lit,
	});
}
