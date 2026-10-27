// Entertainers: a grinning jester in a harlequin half mask and violet-and-gold motley juggling three flaming torches on a night stage, red curtains behind and footlights below.
import {
	createCanvas,
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column and its first row. */
const FACE_X = 32;
const FACE_TOP = 15;

/** The stage boards' first row and the footlight rail's first row. */
const STAGE = 54;
const RAIL = 59;

/** The three flames: the torch in each hand and the one turning in the air between them. */
const FLAMES = [
	{ x: 7, y: 9 },
	{ x: 21, y: 3 },
	{ x: 57, y: 9 },
];

/** Skin: lit warm by the torch on his left (the viewer's right), plain, and shaded on the other side. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.55),
	lit: mix(C.skin, C.gold, 0.2),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.brickRedShade, 0.35),
};

/** The two colours of the motley. */
const VIOLET = {
	lit: C.arcaneLight,
	base: C.arcane,
	shade: C.arcaneShade,
};
const GOLD = {
	lit: C.lampGlow,
	base: C.gold,
	shade: C.amber,
};

/** The colours the glows leave alone: the jester is lit by hand, and the flames keep their own colours. */
const KEEP = [
	...Object.values(SKIN),
	...Object.values(VIOLET),
	...Object.values(GOLD),
	C.ink,
	C.white,
	C.creamLight,
	C.cream,
	C.creamShade,
	C.brass,
	C.timberLight,
	C.timber,
	C.wood,
];

/**
 * Draws the Entertainers portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(8004);

	drawInterior(layer, { floor: STAGE, random, wall: 'panel' });
	dimStage(layer);
	drawCurtains(layer);
	drawValance(layer);

	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawRuff(figure);
	drawHead(figure);
	drawCap(figure);
	outline(figure, C.ink);
	// The mask on its own layer, so its outline sets it off from the face and the cap.
	const mask = createCanvas(64, 64);
	drawMask(mask);
	outline(mask, C.ink);
	underlay(mask, figure);

	const scene = createCanvas(64, 64);
	drawArms(scene);
	drawTorches(scene);
	drawRail(scene);
	outline(scene, C.ink);
	underlay(scene, mask);
	underlay(scene, layer);

	for (const flame of FLAMES) {
		glow(scene, {
			x: flame.x,
			y: flame.y,
			radius: 18,
			colour: C.amber,
			strength: 0.35,
			steps: 3,
			skip: KEEP,
		});
	}
	glow(scene, {
		x: 32,
		y: 70,
		radius: 24,
		colour: C.gold,
		strength: 0.25,
		steps: 3,
		skip: KEEP,
	});
	drawFlames(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Heavy red velvet curtains hanging in deep folds behind the stage, over the whole back wall.
 * @param {Canvas} layer
 */
function drawCurtains(layer) {
	for (let y = 0; y < STAGE; y++) {
		for (let x = 0; x < 64; x++) {
			const fold =
				(x + Math.round(Math.sin(y * 0.12 + x * 0.5) * 0.7)) % 7;
			let colour = mix(C.brickRedShade, C.night, 0.45);
			if (fold === 2 || fold === 3) {
				colour = mix(C.brickRed, C.night, 0.4);
			} else if (fold === 4) {
				colour = mix(C.brickRed, C.night, 0.25);
			} else if (fold === 0) {
				colour = mix(C.brickRedShade, C.night, 0.7);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The gold-fringed valance swagged across the top of the stage.
 * @param {Canvas} layer
 */
function drawValance(layer) {
	for (let x = 0; x < 64; x++) {
		const sag = Math.round(Math.sin(((x % 32) / 32) * Math.PI) * 2);
		for (let y = 0; y <= 1 + sag; y++) {
			set(layer, x, y, mix(C.brickRedShade, C.night, 0.3));
		}
		set(layer, x, 2 + sag, x % 2 ? C.amber : C.brass);
	}
}

/**
 * Dims the room to night: the back wall will be hidden by the curtains, and the floorboards become the stage.
 * @param {Canvas} layer
 */
function dimStage(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.night, 0.3);
		}
	}
}

/**
 * The motley tunic, violet on his right and gold on his left, with a big diamond of each colour set into the
 * other half; lit from the torch on his left and cut off at the waist by the footlights.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, in the ruff's shadow.
	rect(scene, FACE_X - 2, 29, 5, 3, SKIN.shade);
	for (let y = 33; y < RAIL; y++) {
		const half = Math.min(15, 9 + Math.round((y - 33) * 1.5));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const right = x > FACE_X;
			// A diamond of the other colour in each half.
			const dx = Math.abs(x - (FACE_X + (right ? 8 : -7)));
			const diamond = dx / 4 + Math.abs(y - 45) / 6 <= 1;
			const side = right !== diamond ? GOLD : VIOLET;
			let colour = side.base;
			if (x >= FACE_X + half - 1 || (right && dx === 0 && diamond)) {
				colour = side.lit;
			} else if (x <= FACE_X - half + 2) {
				colour = side.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Brass bells down the seam.
	for (const y of [38, 44, 50]) {
		set(scene, FACE_X, y, C.brass);
		set(scene, FACE_X + 1, y, C.gold);
	}
}

/**
 * A white pleated ruff round his neck, wider than his shoulders' top, scalloped along both edges.
 * @param {Canvas} scene
 */
function drawRuff(scene) {
	/** Each row's reach either side of the centre, top row first. */
	const reach = [6, 9, 10, 10, 10, 9, 6];
	reach.forEach((half, j) => {
		const y = 29 + j;
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			// The pleats: round folds, each lit on its left, scalloped where they meet the edges.
			const edge = x === FACE_X - half || x === FACE_X + 1 + half;
			if (edge && (j === 0 || j === reach.length - 1) && x % 2) {
				continue;
			}
			let colour =
				x % 3 === 0
					? C.creamShade
					: x % 3 === 1
						? C.creamLight
						: C.cream;
			if (x > FACE_X + 6 && x % 3 !== 0) {
				colour = C.white;
			}
			set(scene, x, y, colour);
		}
	});
}

/**
 * His face, turned to the viewer with a wide grin under his half mask, lit warm by the torch on his left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[0, -5, 6],
		[1, -6, 7],
		[2, -6, 7],
		[3, -6, 7],
		[4, -6, 7],
		[5, -6, 7],
		[6, -6, 7],
		[7, -5, 6],
		[8, -5, 6],
		[9, -5, 6],
		[10, -4, 5],
		[11, -3, 4],
		[12, -2, 3],
		[13, -1, 2],
	];
	for (const [row, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 6) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, FACE_TOP + row, colour);
		}
	}
	const eyes = FACE_TOP + 4;
	// The nose below the mask, its lit side to the torch.
	set(scene, FACE_X, eyes + 3, SKIN.shade);
	set(scene, FACE_X + 1, eyes + 3, SKIN.glint);
	rect(scene, FACE_X, eyes + 4, 2, 1, SKIN.dark);
	// A wide grin turned up at the corners, the teeth showing.
	paint(
		scene,
		FACE_X - 3,
		eyes + 6,
		['r......r', 'rWWWWWWr', '.rrrrrr.', '..LLLL..'],
		{ r: C.brickRedShade, W: C.creamLight, L: SKIN.glint }
	);
	// Rouged cheeks.
	set(scene, FACE_X - 5, eyes + 4, mix(C.skinShade, C.brickRed, 0.3));
	set(scene, FACE_X + 5, eyes + 4, mix(C.skin, C.brickRedLight, 0.35));
}

/**
 * The harlequin half mask over his eyes: a band across the face in gold and violet, counterchanged against the cap,
 * its wings swept up past the temples, with his eyes glancing up at the torches through the holes.
 * @param {Canvas} scene
 */
function drawMask(scene) {
	const eyes = FACE_TOP + 4;
	for (let dx = -9; dx <= 10; dx++) {
		const x = FACE_X + dx;
		const wing = dx <= -6 || dx >= 7;
		// The wings flare up and out to points past the temples.
		const reach = Math.max(0, Math.abs(dx - 0.5) - 5.5) * 1.5;
		const top = eyes - 1 - Math.round(reach);
		const tip = dx === -9 || dx === 10;
		let bottom = eyes + 1 + (dx === 0 || dx === 1 ? -1 : 0);
		if (tip) {
			bottom = top + 1;
		} else if (wing) {
			bottom = eyes;
		}
		// Counterchanged against the cap: gold on his right, violet on his left.
		const side = dx <= 0 ? GOLD : VIOLET;
		for (let y = top; y <= bottom; y++) {
			let colour = side.base;
			if (y === top) {
				colour = side.lit;
			} else if (y === bottom) {
				colour = side.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The eyeholes, each showing a white and a dark pupil glancing to his left, under a dark lid.
	for (const ex of [FACE_X - 3, FACE_X + 3]) {
		rect(scene, ex - 1, eyes - 1, 3, 1, C.ink);
		set(scene, ex - 1, eyes, C.ink);
		set(scene, ex, eyes, C.creamLight);
		set(scene, ex + 1, eyes, C.ink);
	}
}

/**
 * The jester's cap: violet on his right, gold on his left, fitted over the crown with flaps down over the ears,
 * its two points flopping out and down to a bell on each tip.
 * @param {Canvas} scene
 */
function drawCap(scene) {
	for (let y = 5; y <= 26; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
			const d = ((x - FACE_X - 0.5) / 9.5) ** 2 + ((y - 16) / 11) ** 2;
			if (d > 1) {
				continue;
			}
			const face = y >= FACE_TOP && x >= FACE_X - 6 && x <= FACE_X + 7;
			if (face) {
				continue;
			}
			const side = x > FACE_X ? GOLD : VIOLET;
			let colour = side.base;
			if (y >= FACE_TOP && (x === FACE_X + 8 || x === FACE_X - 7)) {
				colour = side.shade;
			} else if (x >= FACE_X + 8 || (x > FACE_X && y < 8)) {
				colour = side.lit;
			} else if (x <= FACE_X - 7 || (x <= FACE_X && y < 8)) {
				colour = side.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The two points, thick at the crown and tapering as they flop out over his shoulders.
	for (const dir of [-1, 1]) {
		const side = dir > 0 ? GOLD : VIOLET;
		for (let i = 0; i <= 13; i++) {
			const x = FACE_X + (dir > 0 ? 1 : 0) + dir * (5 + i);
			const y =
				8 -
				Math.round(Math.sin((i / 13) * Math.PI) * 4) +
				Math.round(i * 0.9);
			const thick = Math.max(2, 5 - Math.floor(i / 3));
			for (let t = 0; t < thick; t++) {
				let colour = side.base;
				if (t === 0) {
					colour = side.lit;
				} else if (t === thick - 1) {
					colour = side.shade;
				}
				set(scene, x, y + t, colour);
			}
		}
		const tip = FACE_X + (dir > 0 ? 1 : 0) + dir * 19;
		paint(scene, tip - 1, 21, ['.b.', 'bBb', '.b.'], {
			b: C.brass,
			B: C.lampGlow,
		});
	}
}

/**
 * Both arms up to catch the torches, the elbows out and the forearms raised, in puffed sleeves: the gold one on
 * his right and the violet one on his left (the motley's colours swapped), with dagged cuffs and bare hands round
 * the handles.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	for (const dir of [-1, 1]) {
		const side = dir > 0 ? VIOLET : GOLD;
		const lit = (/** @type {number} */ outer) =>
			dir > 0 ? outer > 0 : outer < 0;
		// The puffed upper arm, out from the shoulder to the elbow.
		for (let i = 0; i <= 9; i++) {
			const x = FACE_X + (dir > 0 ? 1 : 0) + dir * (13 + i);
			const centre = 38 + Math.round(i * 0.3);
			const half = 3 + (i > 1 && i < 8 ? 1 : 0);
			for (let y = centre - half; y <= centre + half; y++) {
				let colour = side.base;
				if (y === centre - half) {
					colour = side.lit;
				} else if (y === centre + half) {
					colour = side.shade;
				}
				set(scene, x, y, colour);
			}
		}
		// The forearm, up from the elbow to the wrist.
		const fx = FACE_X + (dir > 0 ? 1 : 0) + dir * 23;
		for (let y = 20; y <= 40; y++) {
			const mid = fx + dir * Math.round((40 - y) * 0.05);
			for (let t = -2; t <= 2; t++) {
				let colour = side.base;
				if (t === 2 * dir || t === -2 * dir) {
					colour = lit(t) ? side.lit : side.shade;
				}
				set(scene, mid + t, y, colour);
			}
		}
		// A dagged cuff at the wrist, in the other colour.
		const other = dir > 0 ? GOLD : VIOLET;
		for (let t = -3; t <= 3; t++) {
			set(scene, fx + dir + t, 18, other.lit);
			set(scene, fx + dir + t, 19, other.base);
			if ((t + 3) % 2 === 0) {
				set(scene, fx + dir + t, 20, other.shade);
			}
		}
	}
	// The hands round the handles.
	const hand = ['.sSL.', 'sSSSL', 'sSSSL', '.sSL.'];
	paint(scene, 6, 14, hand, { s: SKIN.shade, S: SKIN.base, L: SKIN.lit });
	paint(
		scene,
		54,
		14,
		hand,
		{ s: SKIN.base, S: SKIN.lit, L: SKIN.glint },
		{ mirror: true }
	);
}

/**
 * Three torches: one in each hand, leaning out, and one turning end over end in the air between them.
 * @param {Canvas} scene
 */
function drawTorches(scene) {
	// The torches in his hands: wooden handles, a pitch-dark binding under each flame.
	rect(scene, 7, 10, 2, 9, C.timberLight);
	rect(scene, 8, 10, 1, 9, C.timber);
	rect(scene, 56, 10, 2, 9, C.timberLight);
	rect(scene, 57, 10, 1, 9, C.timber);
	rect(scene, 6, 9, 4, 2, C.wood);
	rect(scene, 55, 9, 4, 2, C.wood);
	// The one in the air above his cap's point, tilted as it turns, its flame at the top.
	line(scene, 15, 10, 19, 6, C.timberLight);
	line(scene, 16, 10, 20, 6, C.timber);
	rect(scene, 19, 4, 3, 2, C.wood);
}

/**
 * The footlight rail across the front of the stage: a dark wooden lip set with brass oil lamps.
 * @param {Canvas} scene
 */
function drawRail(scene) {
	for (let y = RAIL; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.wood;
			if (y === RAIL) {
				colour = C.timberShade;
			} else if (y === 63) {
				colour = mix(C.wood, C.night, 0.4);
			}
			set(scene, x, y, colour);
		}
	}
	for (let x = 5; x < 64; x += 9) {
		rect(scene, x - 2, RAIL - 2, 5, 2, C.brass);
		rect(scene, x - 1, RAIL - 2, 3, 1, C.gold);
	}
}

/**
 * The flames on the three torches and the footlights, painted after the glows so they keep their colours.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	const big = [
		'..g..w.',
		'..gw.g.',
		'.gwg.gw',
		'.gwwgwg',
		'gwWWwwg',
		'gwWWWwa',
		'.awWwa.',
		'..aaa..',
	];
	const colours = { w: C.lampGlow, W: C.white, g: C.gold, a: C.amber };
	paint(scene, FLAMES[0].x - 3, FLAMES[0].y - 8, big, colours);
	paint(scene, FLAMES[2].x - 3, FLAMES[2].y - 8, big, colours, {
		mirror: true,
	});
	// The flying torch's flame, streaming back as it turns.
	paint(
		scene,
		FLAMES[1].x - 2,
		FLAMES[1].y - 3,
		['..gw.', '.gwWg', 'gwWwa', '.awa.'],
		colours
	);
	for (let x = 5; x < 64; x += 9) {
		paint(scene, x - 1, RAIL - 5, ['.w.', 'gWg', '.a.'], colours);
	}
}

/**
 * Sparks thrown off the torches as they wheel through the air.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 9; i++) {
		const t = random();
		const x = Math.round(12 + t * 40);
		const y = Math.round(10 - Math.sin(t * Math.PI) * 7 + random() * 3);
		set(scene, x, y, random() > 0.5 ? C.gold : C.lampGlow);
	}
}
