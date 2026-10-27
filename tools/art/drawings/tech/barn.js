// Barn: a newborn calf in fresh straw, its mother nuzzling it, in a shaft of sunlight through the barn's plank walls.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The open hatch high on the left wall that lets the sun in. Its box includes the frame. */
const HATCH = { x: 12, y: 1, w: 13, h: 11 };

/** The straw bed's top row. */
const STRAW = 47;

/** The barn's planks, in the shade of the barn and lit, and the bright gaps between them. */
const PLANK = mix(C.timber, C.wood, 0.45);
const PLANK_LIGHT = mix(C.timber, C.timberLight, 0.3);
const PLANK_SHADE = mix(C.timberShade, C.ink, 0.35);
const GAP = mix(C.beamLight, C.amber, 0.25);

/** The cow's chestnut coat in four tones, and the pink of a muzzle and an udder. */
const COAT_LIGHT = mix(C.timberLight, C.brickRedLight, 0.25);
const COAT = mix(C.timberLight, C.brickRed, 0.3);
const COAT_SHADE = mix(C.timber, C.brickRedShade, 0.35);
const COAT_DARK = mix(C.timberShade, C.brickRedShade, 0.3);
const PINK = mix(C.skin, C.brickRedLight, 0.3);
const PINK_SHADE = mix(C.skinShade, C.brickRed, 0.25);

/** The cow's nose pad, pinker than the calf's so it stays pink in the sunlight, and her nostrils. */
const NOSE = mix(C.skin, C.brickRedLight, 0.6);
const NOSE_SHADE = mix(C.skinShade, C.brickRed, 0.55);
const NOSTRIL = mix(C.brickRedShade, C.ink, 0.5);

/**
 * Draws the Barn tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3172);

	drawWall(layer, random);
	drawHatch(layer);
	drawLoft(layer, random);
	drawStraw(layer, random);

	drawPitchfork(scene);
	drawCow(scene);
	drawCalf(scene);
	drawPail(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawShaft(scene);
	drawStrawTufts(scene, random);
	drawDriftingHay(scene, random);
	return scene;
}

/**
 * The back wall: upright planks in the barn's shade, with sunlight showing through the gaps between some of them.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < STRAW; y++) {
		for (let x = 0; x < 64; x++) {
			const board = x % 6;
			let colour = PLANK;
			if (board === 5) {
				colour = PLANK_SHADE;
			} else if (board === 0) {
				colour = PLANK_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	// Knots in the boards.
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * STRAW);
		if (x % 6 > 1 && x % 6 < 4) {
			set(layer, x, y, PLANK_SHADE);
		}
	}
	// Sunlight through the gaps, broken where the boards touch.
	for (const [x, from, to] of [
		[29, 14, 46],
		[41, 4, 30],
		[53, 9, 46],
		[59, 2, 24],
	]) {
		for (let y = from; y <= to; y++) {
			if ((y * 7 + x) % 11 !== 0) {
				set(layer, x, y, GAP);
			}
		}
	}
	// A cross rail along the wall.
	rect(layer, 0, 40, 64, 2, C.timber);
	rect(layer, 0, 40, 64, 1, C.timberLight);
	rect(layer, 0, 42, 64, 1, PLANK_SHADE);
}

/**
 * The open hatch: a square of bright day framed in timber.
 * @param {Canvas} layer
 */
function drawHatch(layer) {
	const { x, y, w, h } = HATCH;
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			let colour = C.daySky6;
			if (j > h - 5) {
				colour = C.grassLight;
			} else if (j < 3) {
				colour = C.daySky5;
			}
			if (i + j < 4) {
				colour = C.daySky5;
			}
			set(layer, x + i, y + j, colour);
		}
	}
	// A white cloud in the opening.
	rect(layer, x + 5, y + 3, 5, 2, C.white);
	rect(layer, x + 6, y + 2, 2, 1, C.white);
	for (let i = -1; i <= w; i++) {
		set(layer, x + i, y - 1, C.timberShade);
		set(layer, x + i, y + h, C.timberLight);
		set(layer, x + i, y + h + 1, C.timberShade);
	}
	for (let j = -1; j <= h; j++) {
		set(layer, x - 1, y + j, C.timberShade);
		set(layer, x + w, y + j, C.timberShade);
	}
}

/**
 * The hay loft's edge across the top right, with hay hanging over it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLoft(layer, random) {
	rect(layer, 30, 0, 34, 3, C.timber);
	rect(layer, 30, 2, 34, 1, C.timberShade);
	rect(layer, 30, 0, 34, 1, C.timberLight);
	for (let x = 30; x < 64; x++) {
		const hang = 1 + Math.floor(random() * 4);
		for (let k = 0; k < hang; k++) {
			set(
				layer,
				x,
				3 + k,
				k === hang - 1 ? C.sandShade : x % 2 ? C.sand : C.sandLight
			);
		}
	}
}

/**
 * The straw bed: a deep golden litter of stalks lying every which way.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStraw(layer, random) {
	rect(layer, 0, STRAW, 64, 64 - STRAW, C.sand);
	for (let i = 0; i < 150; i++) {
		const x = Math.floor(random() * 64);
		const y = STRAW + Math.floor(random() * (64 - STRAW));
		const length = 2 + Math.floor(random() * 4);
		const slope = random() > 0.5 ? 1 : -1;
		const colour = [C.sandLight, C.sandShade, C.gold, C.sandShade][
			Math.floor(random() * 4)
		];
		for (let k = 0; k < length; k++) {
			set(layer, x + k, y + (k % 2 === 0 ? 0 : slope), colour);
		}
	}
}

/**
 * Fills the pixels of an ellipse, letting a function choose each one's colour.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {(nx: number, ny: number, x: number, y: number) => Colour | null} paint - Given the point's offsets scaled to the radii
 */
function ellipse(canvas, cx, cy, rx, ry, paint) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const nx = (x - cx) / rx;
			const ny = (y - cy) / ry;
			if (nx * nx + ny * ny < 1) {
				set(canvas, x, y, paint(nx, ny, x, y));
			}
		}
	}
}

/**
 * A coat tone for a point on a rounded body lit from the upper left, where the sun comes in.
 * @param {number} nx
 * @param {number} ny
 * @param {Colour[]} tones - From lit to darkest
 * @returns {Colour}
 */
function shade(nx, ny, tones) {
	const facing = -nx * 0.6 - ny * 0.8;
	const rim = nx * nx + ny * ny;
	let index = facing > 0.45 ? 0 : facing > -0.1 ? 1 : facing > -0.55 ? 2 : 3;
	if (rim > 0.82 && index < tones.length - 1) {
		index++;
	}
	return tones[Math.min(index, tones.length - 1)];
}

/**
 * Copies every painted pixel of one canvas onto another, so a part outlined on its own canvas keeps its edge.
 * @param {Canvas} target
 * @param {Canvas} source - The same size as the target
 */
function stamp(target, source) {
	for (let i = 0; i < source.p.length; i++) {
		if (source.p[i]) {
			target.p[i] = source.p[i];
		}
	}
}

/**
 * The mother cow, standing behind her calf with her head lowered to it.
 * @param {Canvas} scene
 */
function drawCow(scene) {
	const coat = [COAT_LIGHT, COAT, COAT_SHADE, COAT_DARK];
	// The far legs, in shadow.
	rect(scene, 43, 28, 4, STRAW + 3 - 28, COAT_DARK);
	rect(scene, 61, 28, 3, STRAW + 3 - 28, COAT_DARK);
	// The udder between the hind legs.
	ellipse(scene, 52, 33, 5, 3.4, (nx, ny) =>
		nx < -0.2 && ny < 0.3 ? PINK : PINK_SHADE
	);
	for (const x of [50, 54]) {
		rect(scene, x, 36, 1, 2, PINK_SHADE);
	}
	// The barrel of her body, running off the right of the picture, and her chest.
	ellipse(scene, 53, 19, 19, 12, (nx, ny) => shade(nx * 0.7, ny, coat));
	ellipse(scene, 39, 21, 7, 11, (nx, ny) => shade(nx, ny, coat));
	// White patches on her flank and her back.
	ellipse(scene, 50, 21, 5, 4, (nx, ny) =>
		nx < 0.3 && ny < 0 ? C.cream : C.creamShade
	);
	ellipse(scene, 54, 18, 4, 4, (_nx, ny) =>
		ny < 0 ? C.cream : C.creamShade
	);
	ellipse(scene, 61, 11, 4, 3, (_nx, ny) =>
		ny < 0 ? C.creamLight : C.cream
	);
	// The near legs.
	for (const x of [37, 56]) {
		rect(scene, x, 26, 5, STRAW + 3 - 26, COAT_SHADE);
		rect(scene, x, 26, 1, STRAW + 3 - 26, COAT);
	}
	// The neck, sloping down from her shoulders to her head, darker underneath.
	for (let k = 0; k <= 10; k++) {
		ellipse(scene, 37 - k * 0.6, 14 + k * 1.3, 5, 5, (nx, ny) =>
			shade(nx, ny + 0.2, coat)
		);
	}
	const head = createCanvas(64, 64);
	drawCowHead(head);
	outline(head, C.ink);
	stamp(scene, head);
}

/** The cow's head, lowered and turned to us, one key per pixel: horn nubs, ears, a broad white face and a wide pink nose pad. */
/** Where the cow's head sprite's top-left pixel sits. */
const COW_HEAD_AT = { x: 22, y: 23 };

const COW_HEAD = [
	'...H..........H...',
	'....hccwwwwCCh....',
	'....ccwwwwwwCS....',
	'eeiicwwwwwwwqCjjEE',
	'eeeiccwwwwwwCCjEEE',
	'...cckwwwwwwkCS...',
	'...ccwwwwwwqqSS...',
	'....cwwwwwwqqS....',
	'....cWwwwwqqSS....',
	'.....WwwwwqqS.....',
	'....pppppPPPPP....',
	'...ppnpppPPPnPP...',
	'...pnnppPPPPnnP...',
	'....pppPPPPPPP....',
	'.....PPPPPPPP.....',
];

/**
 * The cow's lowered head, turned towards us with her nose pad at the calf's ear: a broad white face, ears out to the sides and two short horn nubs at the poll.
 * @param {Canvas} canvas
 */
function drawCowHead(canvas) {
	paint(canvas, COW_HEAD_AT.x, COW_HEAD_AT.y, COW_HEAD, {
		H: C.creamShade,
		h: C.creamLight,
		e: COAT,
		E: COAT_SHADE,
		i: PINK,
		j: PINK_SHADE,
		c: COAT_LIGHT,
		C: COAT,
		S: COAT_SHADE,
		w: C.white,
		W: C.creamLight,
		q: C.cream,
		k: C.ink,
		p: NOSE,
		P: NOSE_SHADE,
		n: NOSTRIL,
	});
}

/**
 * The newborn calf lying in the straw: white with chestnut patches, its legs folded, its head up and its big ears out.
 * @param {Canvas} scene
 */
function drawCalf(scene) {
	const calf = createCanvas(64, 64);
	const white = [C.white, C.creamLight, C.cream, C.creamShade];
	const coat = [COAT_LIGHT, COAT, COAT_SHADE, COAT_DARK];
	// The body and the rump.
	ellipse(calf, 33, 50, 16, 8, (nx, ny) => shade(nx, ny, white));
	ellipse(calf, 44, 49, 7.5, 7.5, (nx, ny) => shade(nx, ny, white));
	// Chestnut patches on its back and rump.
	ellipse(calf, 33, 45.5, 6, 3.2, (nx, ny) => shade(nx, ny, coat));
	ellipse(calf, 46, 45, 4, 3, (nx, ny) => shade(nx, ny, coat));
	// The folded hind leg and its little hoof.
	ellipse(calf, 42, 56, 7, 3, (nx, ny) => shade(nx, ny * 0.5 + 0.3, white));
	rect(calf, 34, 57, 3, 2, C.sandLight);
	// The folded forelegs tucked under its chest.
	ellipse(calf, 23, 56, 6, 3, (nx, ny) => shade(nx, ny * 0.5 + 0.3, white));
	rect(calf, 17, 57, 3, 2, C.sandLight);
	// The neck, raised.
	for (let k = 0; k <= 6; k++) {
		ellipse(calf, 22 - k * 1.2, 48 - k * 1.1, 4.5, 4.5, (nx, ny) =>
			shade(nx, ny, white)
		);
	}
	// The ears, sticking out sideways, behind the head.
	ellipse(calf, 5, 37, 4.4, 2, (_nx, ny) =>
		ny < 0 ? C.creamLight : C.cream
	);
	set(calf, 4, 37, PINK);
	set(calf, 5, 37, PINK);
	set(calf, 6, 37, PINK_SHADE);
	ellipse(calf, 22, 37, 4.4, 2, (nx) => (nx < 0 ? COAT : COAT_SHADE));
	set(calf, 22, 37, PINK_SHADE);
	set(calf, 21, 37, PINK_SHADE);
	// The head, turned to us: a round brow and a broad pink nose.
	ellipse(calf, 13.5, 40.5, 6.2, 5.8, (nx, ny) => shade(nx, ny, white));
	// A chestnut patch round its right eye.
	ellipse(calf, 17.5, 39, 3, 2.8, (nx, ny) => shade(nx, ny, coat));
	ellipse(calf, 13.5, 46, 4, 2.6, (nx, ny) =>
		nx < 0.1 && ny < 0.1 ? PINK : PINK_SHADE
	);
	set(calf, 12, 46, PINK_SHADE);
	set(calf, 15, 46, PINK_SHADE);
	set(calf, 12, 45, C.white);
	// Its eyes, wide open and shining.
	for (const x of [11, 16]) {
		set(calf, x, 40, C.ink);
		set(calf, x, 41, C.ink);
		set(calf, x + 1, 41, C.ink);
		set(calf, x + 1, 40, C.white);
	}
	outline(calf, C.ink);
	stamp(scene, calf);
}

/**
 * The milk pail: a tin bucket, wider at the rim, with a wire bail and milk inside.
 * @param {Canvas} scene
 */
function drawPail(scene) {
	const cx = 57;
	const top = 49;
	const bottom = 62;
	for (let y = top; y <= bottom; y++) {
		const half = Math.round(6 - ((y - top) / (bottom - top)) * 1.5);
		for (let x = cx - half; x <= cx + half; x++) {
			let colour = C.stone;
			if (x <= cx - half + 1) {
				colour = C.stoneLight;
			} else if (x >= cx + half - 1) {
				colour = C.stoneShade;
			} else if (x === cx - half + 3) {
				colour = C.white;
			}
			if (y === top + 2 || y === bottom - 2) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The rim and the milk inside it.
	ellipse(scene, cx, top, 6.5, 2.2, () => C.stoneLight);
	ellipse(scene, cx, top, 5, 1.4, () => C.white);
	// Gleams on the rim.
	set(scene, cx - 5, top + 1, C.white);
	set(scene, cx - 4, top + 1, C.white);
	// The wire bail, standing up.
	for (let k = 0; k <= 12; k++) {
		const angle = (k / 12) * Math.PI;
		const x = Math.round(cx - Math.cos(angle) * 6);
		const y = Math.round(top - Math.sin(angle) * 6);
		set(scene, x, y, k < 6 ? C.stoneLight : C.stoneShade);
	}
}

/**
 * A pitchfork leaning against the wall on the left, tines up.
 * @param {Canvas} scene
 */
function drawPitchfork(scene) {
	line(scene, 3, 63, 9, 14, C.timberLight);
	line(scene, 4, 63, 10, 14, C.timber);
	// The tines' crossbar and three iron prongs.
	rect(scene, 6, 12, 7, 2, C.stoneShade);
	rect(scene, 6, 12, 7, 1, C.stone);
	for (const x of [6, 9, 12]) {
		line(scene, x, 11, x + 1, 3, C.stoneLight);
	}
}

/**
 * The shaft of sunlight from the hatch, falling across the calf, its edges softer than its core.
 * @param {Canvas} scene
 */
function drawShaft(scene) {
	for (let y = HATCH.y + HATCH.h + 1; y < 64; y++) {
		const t = (y - HATCH.y - HATCH.h) / (64 - HATCH.y - HATCH.h);
		const left = HATCH.x + 1 + t * 14;
		const right = HATCH.x + HATCH.w - 1 + t * 30;
		for (let x = Math.floor(left); x <= right; x++) {
			const here = get(scene, x, y);
			if (!here || here === C.ink) {
				continue;
			}
			const edge = Math.min(x - left, right - x);
			const strength = edge < 2 ? 0.2 : 0.38;
			set(scene, x, y, mix(here, C.beamLight, strength));
		}
	}
}

/**
 * Loose straw tufted up round the hooves and the calf, painted over the outline.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawStrawTufts(scene, random) {
	for (let x = 0; x < 64; x++) {
		const height = Math.floor(random() * 3);
		for (let k = 0; k < height; k++) {
			const y = STRAW + 3 - k;
			const here = get(scene, x, y);
			if (
				here === C.ink ||
				here === COAT_DARK ||
				here === COAT_SHADE ||
				here === COAT
			) {
				set(scene, x, y, k === 0 ? C.sandShade : C.sand);
			}
		}
	}
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 64);
		const y = 58 + Math.floor(random() * 6);
		set(scene, x, y, random() > 0.5 ? C.sandLight : C.gold);
	}
}

/**
 * Wisps of hay drifting down from the loft through the shaft of light, catching the sun. None lands on the cow's face.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawDriftingHay(scene, random) {
	/**
	 * Paints one speck of hay unless it falls on the cow's head.
	 * @param {number} x
	 * @param {number} y
	 * @param {Colour} colour
	 */
	const speck = (x, y, colour) => {
		const dx = x - COW_HEAD_AT.x;
		const dy = y - COW_HEAD_AT.y;
		if (
			dx >= -1 &&
			dx <= COW_HEAD[0].length &&
			dy >= -1 &&
			dy <= COW_HEAD.length
		) {
			return;
		}
		set(scene, x, y, colour);
	};
	for (let i = 0; i < 18; i++) {
		const y = 14 + Math.floor(random() * 30);
		const t = (y - HATCH.y - HATCH.h) / (64 - HATCH.y - HATCH.h);
		const x = Math.round(
			HATCH.x + 2 + t * 14 + random() * (HATCH.w - 4 + t * 16)
		);
		if (i % 3 === 0) {
			const slope = i % 2 ? 1 : -1;
			speck(x, y, C.gold);
			speck(x + 1, y + slope, C.sandLight);
			speck(x + 2, y + slope, C.gold);
		} else {
			speck(x, y, i % 2 ? C.lampGlow : C.beamLight);
		}
	}
}
