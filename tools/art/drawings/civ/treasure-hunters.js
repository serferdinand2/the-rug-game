// Treasure Hunters: an adventurer in a wide hat holding a blazing torch out over an open chest of gold and jewels deep in a cave, the torch on the right.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The pixels a shape covers, keyed `x,y`, before it is coloured.
 * @typedef {Set<string>} Mask
 */

/**
 * A shape's colours, from its lit edge to its dark one.
 * @typedef {Object} Tone
 * @property {Colour} glint - The edge facing the torch
 * @property {Colour} lit - Next to the lit edge
 * @property {Colour} base - The body of the shape
 * @property {Colour} shade - Next to the dark edge
 * @property {Colour} dark - The edge away from the torch
 */

/** The face's centre column. */
const FACE_X = 40;

/** The torch flame's hot core. */
const FLAME = { x: 15, y: 20 };

/** The chest: its front's top row, its left and right columns, and the heap of gold's crown. */
const CHEST = { top: 50, left: 4, right: 42, heap: 41 };

/** Skin, warm on the torch's side. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.5),
	lit: mix(C.skin, C.gold, 0.2),
	base: C.skin,
	shade: mix(C.skinShade, C.roof, 0.2),
	dark: mix(C.skinShade, C.night, 0.45),
};

/** Fair hair. */
const HAIR = {
	lit: mix(C.sandLight, C.lampGlow, 0.3),
	base: mix(C.sand, C.sandShade, 0.4),
	dark: mix(C.sandShade, C.timber, 0.55),
};

/** The brown leather hat. */
const HAT = {
	glint: mix(C.timberLight, C.gold, 0.35),
	lit: C.timberLight,
	base: C.timber,
	shade: C.timberShade,
	dark: mix(C.timberShade, C.night, 0.4),
};

/** The linen shirt. */
const SHIRT = {
	glint: mix(C.cream, C.lampGlow, 0.4),
	lit: mix(C.cream, C.gold, 0.15),
	base: C.creamShade,
	shade: mix(C.creamShade, C.roof, 0.35),
	dark: mix(C.stoneShade, C.roof, 0.4),
};

/** Eye whites on the lit and the shaded side, and the lips. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinShade, 0.45) };
const LIPS = { line: C.brickRedShade, lower: mix(C.brickRed, C.skin, 0.45) };

/** The fire's colours, which the glows leave alone. */
const FIRE = [C.white, C.lampGlow, C.gold, C.amber, C.brickRedLight];

/** The face and hair are lit by hand, so the glows leave them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(EYE),
	...Object.values(LIPS),
	C.ink,
	C.wood,
];

/**
 * Draws the Treasure Hunters portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	// Everything below is drawn with the torch on the left; the finished picture is mirrored at the
	// end, so in the portrait she holds it in her left hand, on the viewer's right.
	const layer = createCanvas(64, 64);
	const random = seededRandom(82755);

	drawCave(layer, random);
	drawBats(layer);

	// Four layers, each outlined: she kneels behind the chest's open lid, reaching over it with
	// the torch and gripping its edge, and the heap of gold sits in front of everything.
	const body = createCanvas(64, 64);
	drawShirt(body);
	drawFace(body);
	drawHat(body);
	outline(body, C.ink);
	const lid = createCanvas(64, 64);
	drawLid(lid);
	outline(lid, C.ink);
	underlay(lid, body);
	const arms = createCanvas(64, 64);
	drawArms(arms);
	drawTorch(arms);
	drawGripHand(arms);
	outline(arms, C.ink);
	underlay(arms, lid);
	const scene = createCanvas(64, 64);
	drawChest(scene);
	drawGold(scene, random);
	outline(scene, C.ink);
	underlay(scene, arms);
	underlay(scene, layer);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 40,
		colour: C.amber,
		strength: 0.4,
		steps: 5,
		skip: [...FIRE, ...FIGURE],
	});
	glow(scene, {
		x: 24,
		y: CHEST.heap + 4,
		radius: 22,
		colour: C.gold,
		strength: 0.3,
		steps: 3,
		skip: [...FIRE, ...FIGURE],
	});
	drawFlame(scene);
	drawGlints(scene, random);
	return mirror(scene);
}

/**
 * Flips a canvas left to right.
 * @param {Canvas} canvas
 * @returns {Canvas} A new canvas, the mirror image of the first.
 */
function mirror(canvas) {
	const flipped = createCanvas(canvas.w, canvas.h);
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			set(flipped, canvas.w - 1 - x, y, get(canvas, x, y));
		}
	}
	return flipped;
}

/**
 * Adds a round-ended stroke along a line of points to a mask.
 * @param {Mask} mask
 * @param {[number, number][]} points
 * @param {number} radius
 */
function stroke(mask, points, radius) {
	for (let i = 0; i + 1 < points.length; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
		for (let s = 0; s <= steps; s++) {
			const cx = x0 + ((x1 - x0) * s) / steps;
			const cy = y0 + ((y1 - y0) * s) / steps;
			for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
				for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
					if (Math.hypot(x - cx, y - cy) <= radius) {
						mask.add(`${x},${y}`);
					}
				}
			}
		}
	}
}

/**
 * Paints a mask lit from the left: a glint and a lit band on its left edge, shade on its right.
 * @param {Canvas} canvas
 * @param {Mask} mask
 * @param {Tone} tone
 */
function fill(canvas, mask, tone) {
	for (const key of mask) {
		const [x, y] = key.split(',').map(Number);
		let colour = tone.base;
		if (!mask.has(`${x - 1},${y}`)) {
			colour = tone.glint;
		} else if (!mask.has(`${x - 2},${y}`) || !mask.has(`${x},${y - 1}`)) {
			colour = tone.lit;
		} else if (!mask.has(`${x + 1},${y}`)) {
			colour = tone.dark;
		} else if (!mask.has(`${x + 2},${y}`) || !mask.has(`${x},${y + 1}`)) {
			colour = tone.shade;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * The cave: dark rock heaped in boulders, each lit on its upper left, with stalactites hanging
 * from the roof.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCave(layer, random) {
	const rock = {
		lit: mix(C.stone, C.night, 0.5),
		base: mix(C.stoneShade, C.night, 0.55),
		dark: mix(C.roofShade, C.night, 0.5),
	};
	rect(layer, 0, 0, 64, 64, rock.dark);
	for (let i = 0; i < 34; i++) {
		const cx = Math.floor(random() * 70) - 3;
		const cy = Math.floor(random() * 70) - 3;
		const rx = 4 + Math.floor(random() * 5);
		const ry = 3 + Math.floor(random() * 4);
		for (let y = cy - ry; y <= cy + ry; y++) {
			for (let x = cx - rx; x <= cx + rx; x++) {
				const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
				if (d > 1) {
					continue;
				}
				const edge =
					((x - cx - 1) / rx) ** 2 + ((y - cy - 1) / ry) ** 2 > 1;
				const far =
					((x - cx + 1) / rx) ** 2 + ((y - cy + 1) / ry) ** 2 > 1;
				set(layer, x, y, edge ? rock.lit : far ? rock.dark : rock.base);
			}
		}
	}
	// Stalactites from the roof.
	for (const [x, length] of [
		[20, 7],
		[27, 4],
		[45, 10],
		[52, 6],
		[58, 9],
		[3, 5],
	]) {
		for (let y = 0; y < length; y++) {
			const half = Math.max(0, Math.round((1 - y / length) * 2));
			for (let px = x - half; px <= x + half; px++) {
				set(layer, px, y, px < x ? rock.lit : rock.base);
			}
		}
		set(layer, x, length, mix(C.ghostShade, C.night, 0.4));
	}
}

/**
 * Two bats roosting under the roof on the right.
 * @param {Canvas} layer
 */
function drawBats(layer) {
	const bat = ['k.....k', 'kk.k.kk', '.kkkkk.', '..k.k..'];
	paint(layer, 55, 14, bat, { k: C.ink });
	paint(layer, 52, 24, bat, { k: C.ink });
}

/**
 * Her linen shirt, open at the neck over a teal neckerchief, a satchel strap across her chest.
 * @param {Canvas} scene
 */
function drawShirt(scene) {
	// The neck, in the chin's shadow except on the torch's side.
	for (let y = 24; y <= 27; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 2; x++) {
			let colour = SKIN.shade;
			if (x === FACE_X - 2) {
				colour = SKIN.lit;
			} else if (y === 25) {
				colour = SKIN.dark;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 27; y < 50; y++) {
		const half = Math.min(15, 6 + Math.round((y - 27) * 2.5));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHIRT.base;
			if (u < -0.85) {
				colour = SHIRT.glint;
			} else if (u < -0.4) {
				colour = SHIRT.lit;
			} else if (u > 0.85) {
				colour = SHIRT.dark;
			} else if (u > 0.35) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The open collar and the neckerchief knotted at her throat.
	for (let y = 27; y <= 31; y++) {
		const half = 31 - y;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x < FACE_X ? SKIN.lit : SKIN.shade);
		}
	}
	paint(
		scene,
		FACE_X - 4,
		26,
		['rr.....rr', '.Rrr.rrr.', '...rRr...', '...rrr...', '....r....'],
		{ r: C.teal, R: C.tealLight }
	);
	// Folds and the satchel strap from her shoulder to her hip.
	for (let y = 33; y < 50; y++) {
		set(scene, FACE_X - 6 - Math.round((y - 33) * 0.2), y, SHIRT.shade);
		set(scene, FACE_X + 8 + Math.round((y - 33) * 0.2), y, SHIRT.dark);
	}
	line(scene, FACE_X + 10, 28, FACE_X - 8, 49, C.timberShade);
	line(scene, FACE_X + 11, 28, FACE_X - 7, 49, C.timber);
	set(scene, FACE_X + 2, 38, C.brass);
}

/**
 * Her face, turned to the viewer, lit on the torch's side and in shadow on the other,
 * fair hair falling from under the hat.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	// Locks of hair at her temples, and a ponytail over her far shoulder.
	for (let y = 10; y <= 20; y++) {
		set(scene, FACE_X - 6, y, y < 17 ? HAIR.lit : HAIR.base);
		set(scene, FACE_X - 5, y, HAIR.base);
		rect(scene, FACE_X + 6, y, 2, 1, HAIR.dark);
	}
	for (let y = 18; y <= 36; y++) {
		const x =
			FACE_X + 7 + Math.round(Math.sin(((y - 18) / 18) * Math.PI) * 2);
		const half = y > 32 ? 0 : 1;
		for (let px = x - half; px <= x + half; px++) {
			set(
				scene,
				px,
				y,
				px === x - half
					? HAIR.lit
					: (px + y) % 3
						? HAIR.base
						: HAIR.dark
			);
		}
	}
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -4, 5],
		[11, -4, 5],
		[12, -5, 6],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -5, 6],
		[18, -4, 5],
		[19, -4, 5],
		[20, -4, 5],
		[21, -3, 4],
		[22, -3, 4],
		[23, -2, 3],
		[24, -1, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -4) {
				colour = SKIN.glint;
			} else if (dx <= -2) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// A wisp of hair across the brow, under the brim's shadow.
	rect(scene, FACE_X - 4, 10, 4, 1, HAIR.base);
	rect(scene, FACE_X - 2, 11, 3, 1, HAIR.dark);
	rect(scene, FACE_X + 1, 10, 5, 1, HAIR.dark);
	// The lit cheekbone, the shade under the far one, and a smudge of dirt.
	set(scene, FACE_X - 3, 17, SKIN.glint);
	set(scene, FACE_X + 4, 18, SKIN.dark);
	set(scene, FACE_X + 3, 19, SKIN.shade);
	// Brows, and eyes wide on the gold below.
	rect(scene, FACE_X - 4, 13, 3, 1, C.timber);
	rect(scene, FACE_X + 2, 13, 3, 1, C.timberShade);
	set(scene, FACE_X - 3, 15, EYE.lit);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.shade);
	set(scene, FACE_X + 3, 15, C.ink);
	set(scene, FACE_X - 2, 16, SKIN.base);
	// The nose: lit on the torch's side, a shade line down the other.
	rect(scene, FACE_X + 1, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X, 18, SKIN.glint);
	set(scene, FACE_X + 1, 19, SKIN.dark);
	// A grin.
	set(scene, FACE_X - 2, 20, LIPS.line);
	rect(scene, FACE_X - 1, 21, 4, 1, LIPS.line);
	set(scene, FACE_X + 3, 20, LIPS.line);
	rect(scene, FACE_X, 22, 2, 1, LIPS.lower);
}

/**
 * The wide-brimmed leather hat, its crown dented and banded, the brim dipping away from the torch.
 * @param {Canvas} scene
 */
function drawHat(scene) {
	for (let y = 0; y <= 7; y++) {
		const half = y === 0 ? 4 : 6;
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			const dx = x - FACE_X;
			if (y === 0 && dx === 0) {
				continue;
			}
			let colour = HAT.base;
			if (dx <= -half + 1) {
				colour = HAT.lit;
			} else if (dx >= half) {
				colour = HAT.shade;
			}
			if (y >= 5) {
				colour =
					y === 5 ? mix(C.wood, C.amber, dx < 0 ? 0.25 : 0) : C.wood;
			}
			set(scene, x, y, colour);
		}
	}
	// The brim: tilted down away from the torch, its top lit by it, its underside dark.
	for (let x = FACE_X - 14; x <= FACE_X + 14; x++) {
		const dx = x - FACE_X;
		const y = 8 + Math.round(dx / 9);
		set(scene, x, y, dx < -4 ? HAT.glint : dx < 6 ? HAT.lit : HAT.base);
		set(scene, x, y + 1, dx < 0 ? HAT.base : HAT.shade);
		if (Math.abs(dx) < 11) {
			set(scene, x, y + 2, HAT.dark);
		}
	}
}

/**
 * Her near arm stretched out over the chest with the torch, the sleeve rolled to the elbow,
 * and her far arm reaching down to the lid's edge.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	/** @type {Mask} */
	const sleeve = new Set();
	stroke(
		sleeve,
		[
			[FACE_X - 12, 31],
			[FACE_X - 17, 34],
		],
		3
	);
	fill(scene, sleeve, SHIRT);
	/** @type {Mask} */
	const forearm = new Set();
	stroke(
		forearm,
		[
			[FACE_X - 19, 35],
			[FLAME.x + 3, 34],
		],
		2.1
	);
	fill(scene, forearm, SKIN);
	/** @type {Mask} */
	const far = new Set();
	stroke(
		far,
		[
			[FACE_X + 12, 31],
			[FACE_X + 13, 36],
		],
		3
	);
	fill(scene, far, SHIRT);
	/** @type {Mask} */
	const farForearm = new Set();
	stroke(
		farForearm,
		[
			[FACE_X + 12, 39],
			[CHEST.right - 1, 41],
		],
		2.1
	);
	fill(scene, farForearm, SKIN);
}

/**
 * The torch held upright in her fist: a wooden haft, its head wrapped in pitch-soaked rags.
 * @param {Canvas} scene
 */
function drawTorch(scene) {
	rect(scene, FLAME.x, FLAME.y + 8, 1, 11, C.timber);
	rect(scene, FLAME.x + 1, FLAME.y + 8, 1, 11, C.timberLight);
	paint(
		scene,
		FLAME.x - 3,
		FLAME.y + 4,
		['.kkkkk.', 'kkskkks', 'ksksksk', '.kkkkk.'],
		{
			k: C.wood,
			s: C.timberShade,
		}
	);
	paint(
		scene,
		FLAME.x - 2,
		FLAME.y + 11,
		['.gll.', 'glllb', 'gllbs', '.lbs.'],
		{
			g: SKIN.glint,
			l: SKIN.lit,
			b: SKIN.base,
			s: SKIN.shade,
		}
	);
}

/**
 * The flame, painted after the glows so it keeps its colours: a white core in gold, licked with red.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		FLAME.x - 5,
		FLAME.y - 9,
		[
			'.....r.....',
			'....ra...r.',
			'...rar..ra.',
			'...agr.raa.',
			'..ragga.ag.',
			'..agwgaagr.',
			'.raggwwgga.',
			'.agwwWwwgar',
			'ragwWWWwga.',
			'ragwWWWwgar',
			'.agwwWwwga.',
			'..aggwggar.',
			'...aagga...',
		],
		{
			r: C.brickRedLight,
			a: C.amber,
			g: C.gold,
			w: C.lampGlow,
			W: C.white,
		}
	);
	// Smoke curling up off the flame.
	for (const [x, y] of [
		[FLAME.x, FLAME.y - 10],
		[FLAME.x + 1, FLAME.y - 11],
		[FLAME.x + 1, FLAME.y - 12],
		[FLAME.x, FLAME.y - 13],
	]) {
		const behind = get(scene, x, y);
		if (behind) {
			set(scene, x, y, mix(behind, C.stoneLight, 0.4));
		}
	}
}

/**
 * The chest's lid, thrown open and leaning back: its dark inside shows above the heap.
 * @param {Canvas} scene
 */
function drawLid(scene) {
	const { top, left, right } = CHEST;
	for (let y = 33; y < top; y++) {
		const inset = Math.round((top - y) * 0.2);
		for (let x = left + inset; x <= right - inset; x++) {
			let colour = mix(C.timberShade, C.night, 0.35);
			if (y === 33) {
				colour = C.timber;
			} else if ((x - left) % 12 === 2 || (x - left) % 12 === 3) {
				colour = mix(C.stoneShade, C.night, 0.3);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The chest's front: an iron-bound wooden box with a brass lock.
 * @param {Canvas} scene
 */
function drawChest(scene) {
	const { top, left, right } = CHEST;
	// The front: planks, iron bands and a rim.
	for (let y = top; y < 64; y++) {
		for (let x = left; x <= right; x++) {
			let colour = (y - top) % 4 === 3 ? C.timberShade : C.timber;
			if (y === top) {
				colour = C.timberLight;
			} else if ((x - left) % 12 === 2 || (x - left) % 12 === 3) {
				colour = (x - left) % 12 === 2 ? C.stone : C.stoneShade;
			} else if (x === left) {
				colour = C.timberLight;
			} else if (x >= right - 1) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The lock plate.
	const cx = Math.round((left + right) / 2);
	paint(scene, cx - 2, top + 2, ['bbbbb', 'bgkgb', 'bbkbb', '.bbb.'], {
		b: C.brass,
		g: C.gold,
		k: C.ink,
	});
}

/**
 * The heap of gold in the chest: coins piled high, a jewelled goblet, gems and a string of pearls
 * spilling over the rim.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawGold(scene, random) {
	const { top, left, right, heap } = CHEST;
	const mid = (left + right) / 2;
	for (let x = left + 1; x < right; x++) {
		const rise = Math.round(
			(1 - ((x - mid) / ((right - left) / 2)) ** 2) * (top - heap)
		);
		for (let y = top - rise; y < top; y++) {
			let colour = (x + y * 2) % 5 === 0 ? C.amber : C.gold;
			if (y === top - rise) {
				colour = C.lampGlow;
			} else if ((x * 7 + y * 3) % 11 === 0) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
	// A golden goblet set with a ruby.
	paint(
		scene,
		left + 25,
		heap - 4,
		['gggggg', 'gwggag', '.gRga.', '..ga..', '..ga..', '.ggaa.'],
		{ g: C.gold, w: C.lampGlow, a: C.amber, R: C.brickRedLight }
	);
	// Gems scattered on the heap.
	for (let i = 0; i < 6; i++) {
		const x = left + 6 + Math.floor(random() * (right - left - 12));
		const y = top - 2 - Math.floor(random() * 3);
		set(scene, x, y, i % 2 ? C.teal : C.brickRedLight);
		set(scene, x + 1, y, i % 2 ? C.tealShade : C.brickRed);
	}
	// Pearls draped over the front rim.
	for (let i = 0; i < 9; i++) {
		const x = left + 6 + i;
		const y = top + Math.round(Math.sin((i / 8) * Math.PI) * 3);
		set(scene, x, y, i % 2 ? C.creamLight : C.white);
	}
}

/**
 * Her far hand gripping the edge of the open lid.
 * @param {Canvas} scene
 */
function drawGripHand(scene) {
	paint(scene, CHEST.right - 4, 39, ['.lbb.', 'lbbbs', 'lbbss', '.bss.'], {
		l: SKIN.lit,
		b: SKIN.base,
		s: SKIN.shade,
	});
}

/**
 * Sparkles of torchlight on the gold, painted last so they stay bright.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawGlints(scene, random) {
	for (let i = 0; i < 5; i++) {
		const x = CHEST.left + 4 + Math.floor(random() * 30);
		const y = CHEST.heap + 3 + Math.floor(random() * 5);
		set(scene, x, y, C.white);
	}
}
