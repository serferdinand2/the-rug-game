// Spies: a spy in a trench coat and hat pressing headphones to his ear at a glowing radio set by night, a tiny camera and photographs on the desk.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The pixels a shape covers, keyed `x,y`, before it is coloured.
 * @typedef {Set<string>} Mask
 */

/**
 * A shape's colours, from its lit edge to its dark one.
 * @typedef {Object} Tone
 * @property {Colour} glint - The edge facing the radio
 * @property {Colour} lit - Next to the lit edge
 * @property {Colour} base - The body of the shape
 * @property {Colour} shade - Next to the dark edge
 * @property {Colour} dark - The edge away from the radio
 */

/** The desk top's first row. */
const DESK = 52;

/** The face's centre column. */
const FACE_X = 28;

/** The radio set's case, and the glowing dial in it. */
const RADIO = { x: 43, y: 27, w: 21, h: DESK - 27 };
const DIAL = { x: 46, y: 30, w: 15, h: 6 };

/** Skin: amber on the radio's side, cold blue on the dark side. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.45),
	lit: mix(C.skin, C.amber, 0.25),
	base: mix(C.skin, C.skinShade, 0.35),
	shade: mix(C.skinShade, C.nightSky5, 0.3),
	dark: mix(C.skinShade, C.night, 0.5),
};

/** The khaki trench coat. */
const COAT = {
	glint: mix(C.sand, C.amber, 0.35),
	lit: mix(C.sandShade, C.amber, 0.2),
	base: mix(C.sandShade, C.timber, 0.5),
	shade: mix(C.timberShade, C.nightSky4, 0.4),
	dark: mix(C.timberShade, C.night, 0.6),
};

/** The raised sleeve, turned away from the radio and so a step darker than the coat. */
const SLEEVE = {
	glint: COAT.lit,
	lit: COAT.base,
	base: mix(COAT.base, COAT.shade, 0.5),
	shade: COAT.shade,
	dark: COAT.dark,
};

/** The grey felt hat. */
const HAT = {
	lit: mix(C.stone, C.amber, 0.3),
	base: mix(C.stoneShade, C.wood, 0.45),
	shade: mix(C.wood, C.nightSky3, 0.3),
	band: mix(C.night, C.wood, 0.3),
};

/** The headphones: black cups with a steel rim. */
const PHONES = { cup: mix(C.night, C.stoneShade, 0.25), rim: C.stone };

/** Eye whites on the lit and the shaded side, and the lips. */
const EYE = { lit: C.cream, shade: mix(C.creamShade, C.nightSky5, 0.4) };
const LIPS = mix(C.brickRedShade, C.skinShade, 0.3);

/** The face is lit by hand, so the dial's glow leaves it as painted; the dial keeps its own colours. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(EYE),
	LIPS,
	C.ink,
	C.wood,
	C.lampGlow,
	C.gold,
];

/**
 * Draws the Spies portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(82733);

	drawInterior(layer, { floor: DESK, random, wall: 'panel' });
	darkenRoom(layer);
	drawBlindStripes(layer);

	// Three layers, each outlined, so the raised arm stands clear of the coat and the radio of both.
	const body = createCanvas(64, 64);
	drawCoat(body);
	drawFace(body);
	drawHat(body);
	drawPhones(body);
	outline(body, C.ink);
	const arms = createCanvas(64, 64);
	drawNearArm(arms);
	drawEarHand(arms);
	outline(arms, C.ink);
	underlay(arms, body);
	const scene = createCanvas(64, 64);
	drawDesk(scene);
	drawRadio(scene);
	drawFarArm(scene);
	drawKnobHand(scene);
	drawPhotos(scene);
	drawCamera(scene);
	outline(scene, C.ink);
	underlay(scene, arms);
	underlay(scene, layer);

	glow(scene, {
		x: DIAL.x + 7,
		y: DIAL.y + 3,
		radius: 26,
		colour: C.amber,
		strength: 0.3,
		steps: 5,
		skip: FIGURE,
	});
	drawCord(scene);
	drawDial(scene);
	return scene;
}

/**
 * Dims the panelled office to night.
 * @param {Canvas} layer
 */
function darkenRoom(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.nightSky1, 0.82);
		}
	}
}

/**
 * Cold streetlight falling through the slats of a blind out of sight, in slanting stripes across the wall.
 * @param {Canvas} layer
 */
function drawBlindStripes(layer) {
	for (let y = 0; y < DESK; y++) {
		for (let x = 0; x < 64; x++) {
			const across = x + y * 0.6;
			if (across < 6 || across > 54) {
				continue;
			}
			const stripe = Math.floor(y - x * 0.45 + 40) % 5;
			const behind = get(layer, x, y);
			if (stripe < 2 && behind) {
				set(
					layer,
					x,
					y,
					mix(behind, C.starDim, stripe === 0 ? 0.3 : 0.2)
				);
			}
		}
	}
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
 * Paints a mask lit from the right: a glint and a lit band on its right edge, shade on its left.
 * @param {Canvas} canvas
 * @param {Mask} mask
 * @param {Tone} tone
 */
function fill(canvas, mask, tone) {
	for (const key of mask) {
		const [x, y] = key.split(',').map(Number);
		let colour = tone.base;
		if (!mask.has(`${x + 1},${y}`)) {
			colour = tone.glint;
		} else if (!mask.has(`${x + 2},${y}`)) {
			colour = tone.lit;
		} else if (!mask.has(`${x - 1},${y}`)) {
			colour = tone.dark;
		} else if (!mask.has(`${x - 2},${y}`) || !mask.has(`${x},${y + 1}`)) {
			colour = tone.shade;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * The trench coat: broad shoulders, its collar turned up round his neck, wide lapels over a
 * pale shirt and a dark tie.
 * @param {Canvas} scene
 */
function drawCoat(scene) {
	for (let y = 24; y < 64; y++) {
		const half = Math.min(20, 9 + Math.round((y - 24) * 2.2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = COAT.base;
			if (u > 0.9) {
				colour = COAT.glint;
			} else if (u > 0.65) {
				colour = COAT.lit;
			} else if (u < -0.8) {
				colour = COAT.dark;
			} else if (u < -0.35) {
				colour = COAT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The neck in the collar's shadow.
	rect(scene, FACE_X - 2, 23, 5, 3, SKIN.dark);
	set(scene, FACE_X + 2, 23, SKIN.shade);
	// The shirt and the tie in the V of the lapels.
	for (let y = 25; y < 42; y++) {
		const half = Math.max(0, 4 - Math.floor((y - 25) / 4));
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			set(scene, x, y, x > FACE_X ? EYE.lit : EYE.shade);
		}
		if (y > 25) {
			set(scene, FACE_X, y, mix(C.brickRedShade, C.night, 0.5));
			set(scene, FACE_X + 1, y, mix(C.brickRedShade, C.night, 0.2));
		}
	}
	paint(scene, FACE_X - 1, 25, ['.kk.', '.kk.'], {
		k: mix(C.brickRedShade, C.night, 0.3),
	});
	// The turned-up collar, standing on both sides of his jaw.
	for (let y = 19; y <= 27; y++) {
		const reach = Math.min(4, y - 19);
		for (let i = 0; i <= reach; i++) {
			set(scene, FACE_X - 4 - i, y, i === reach ? COAT.dark : COAT.shade);
			set(scene, FACE_X + 5 + i, y, i === reach ? COAT.glint : COAT.lit);
		}
	}
	// The lapels' edges running down to the coat's front.
	for (let y = 26; y < 44; y++) {
		const half = Math.max(1, 5 - Math.floor((y - 25) / 4));
		set(scene, FACE_X - half - 1, y, COAT.dark);
		set(scene, FACE_X - half - 2, y, COAT.base);
		set(scene, FACE_X + half + 2, y, COAT.shade);
		set(scene, FACE_X + half + 3, y, COAT.glint);
	}
	// Buttons.
	for (const y of [47, 54, 61]) {
		set(scene, FACE_X - 3, y, COAT.dark);
		set(scene, FACE_X + 4, y, COAT.dark);
	}
}

/**
 * His face, turned a little towards the radio: brows drawn down as he listens, lit amber by the dial
 * on his left, cold in the shadow of the hat brim.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -4, 5],
		[11, -5, 6],
		[12, -5, 6],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -5, 6],
		[18, -5, 6],
		[19, -5, 6],
		[20, -4, 5],
		[21, -4, 5],
		[22, -3, 4],
		[23, -2, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 4) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			// The brim's shadow over the brow.
			if (y <= 11) {
				colour = dx >= 4 ? SKIN.base : SKIN.dark;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Stubble along the jaw.
	for (const [x, y] of [
		[FACE_X - 3, 21],
		[FACE_X - 2, 22],
		[FACE_X + 3, 22],
		[FACE_X + 4, 21],
		[FACE_X - 4, 20],
	]) {
		set(scene, x, y, SKIN.shade);
	}
	// Brows drawn down to the nose, and eyes turned to the dial.
	set(scene, FACE_X - 4, 13, C.wood);
	set(scene, FACE_X - 3, 13, C.wood);
	set(scene, FACE_X - 2, 14, C.wood);
	set(scene, FACE_X + 2, 14, C.wood);
	set(scene, FACE_X + 3, 13, C.wood);
	set(scene, FACE_X + 4, 13, C.wood);
	set(scene, FACE_X - 3, 15, EYE.shade);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.lit);
	set(scene, FACE_X + 3, 15, C.ink);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A tight mouth.
	rect(scene, FACE_X - 1, 21, 4, 1, LIPS);
	set(scene, FACE_X + 2, 20, SKIN.glint);
}

/**
 * The fedora: a pinched crown with a dark band, its brim snapped down at the front.
 * @param {Canvas} scene
 */
function drawHat(scene) {
	for (let y = 0; y <= 8; y++) {
		const half = y === 0 ? 5 : 7;
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			const dx = x - FACE_X;
			// The pinch in the top of the crown.
			if (y === 0 && dx >= 0 && dx <= 1) {
				continue;
			}
			let colour = HAT.base;
			if (dx >= half - 1) {
				colour = HAT.lit;
			} else if (dx <= -half + 1) {
				colour = HAT.shade;
			} else if (y === 1 && Math.abs(dx - 0.5) < 2) {
				colour = HAT.shade;
			}
			if (y >= 6) {
				colour =
					y === 6
						? mix(HAT.band, C.amber, dx > 4 ? 0.3 : 0)
						: HAT.band;
			}
			set(scene, x, y, colour);
		}
	}
	// The brim: its top lit on the right, its underside in shadow, dipping at the front.
	for (let x = FACE_X - 11; x <= FACE_X + 12; x++) {
		const dx = x - FACE_X;
		const lift = Math.abs(dx - 0.5) > 9 ? -1 : 0;
		set(scene, x, 9 + lift, dx > 6 ? HAT.lit : HAT.base);
		set(scene, x, 10 + lift, HAT.shade);
		if (Math.abs(dx - 0.5) < 6) {
			set(scene, x, 11, HAT.shade);
		}
	}
}

/**
 * Headphone cups over both ears, their band running up under the hat.
 * @param {Canvas} scene
 */
function drawPhones(scene) {
	for (const x of [FACE_X - 8, FACE_X + 7]) {
		paint(scene, x, 13, ['.rr.', 'rccr', 'rccr', 'rccr', '.rr.'], {
			r: x > FACE_X ? mix(PHONES.rim, C.amber, 0.3) : PHONES.rim,
			c: PHONES.cup,
		});
		rect(scene, x + (x > FACE_X ? 2 : 1), 11, 1, 2, PHONES.cup);
	}
}

/**
 * His near sleeve, the arm raised with the elbow out to press the headphones on.
 * @param {Canvas} scene
 */
function drawNearArm(scene) {
	/** @type {Mask} */
	const near = new Set();
	stroke(
		near,
		[
			[FACE_X - 13, 30],
			[FACE_X - 19, 38],
			[FACE_X - 12, 21],
		],
		3
	);
	fill(scene, near, SLEEVE);
}

/**
 * His far sleeve, reaching down in front of the radio to its tuning knob.
 * @param {Canvas} scene
 */
function drawFarArm(scene) {
	/** @type {Mask} */
	const far = new Set();
	stroke(
		far,
		[
			[FACE_X + 14, 30],
			[FACE_X + 15, 40],
			[FACE_X + 17, 44],
		],
		3
	);
	fill(scene, far, COAT);
}

/**
 * His hand flat over the near headphone cup, pressing it to his ear.
 * @param {Canvas} scene
 */
function drawEarHand(scene) {
	paint(
		scene,
		FACE_X - 11,
		13,
		['.ss..', 'sbbs.', 'sbbbl', 'sbbbl', 'sbbl.', '.sbl.', '.ss..'],
		{ s: SKIN.dark, b: SKIN.shade, l: SKIN.base }
	);
}

/**
 * His other hand on the big tuning knob.
 * @param {Canvas} scene
 */
function drawKnobHand(scene) {
	paint(
		scene,
		RADIO.x + 1,
		RADIO.y + 17,
		['.lll.', 'lbbgl', 'sbbbg', 'sbbl.', '.ss..'],
		{ s: SKIN.shade, b: SKIN.base, l: SKIN.lit, g: SKIN.glint }
	);
}

/**
 * The desk across the bottom, its top lit by the dial.
 * @param {Canvas} scene
 */
function drawDesk(scene) {
	for (let y = DESK; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.timberShade, C.night, 0.55);
			if (y === DESK) {
				colour = mix(C.timberLight, C.night, 0.3);
			} else if (y < DESK + 6) {
				colour =
					(x + y * 5) % 13 === 0
						? mix(C.timberShade, C.night, 0.3)
						: mix(C.timber, C.night, 0.4);
			} else if (y === DESK + 6) {
				colour = mix(C.timberShade, C.night, 0.2);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The radio set: a bakelite case with a speaker grille and two big knobs; its dial is lit last.
 * @param {Canvas} scene
 */
function drawRadio(scene) {
	const { x, y, w, h } = RADIO;
	const caseBase = mix(C.timber, C.night, 0.25);
	for (let py = y; py < y + h; py++) {
		for (let px = x; px < x + w; px++) {
			// Rounded top corners.
			if (py === y && (px === x || px === x + w - 1)) {
				continue;
			}
			let colour = caseBase;
			if (px === x) {
				colour = mix(C.timberLight, C.amber, 0.3);
			} else if (py === y) {
				colour = mix(C.timberLight, C.night, 0.1);
			} else if (px >= x + w - 2) {
				colour = mix(C.timberShade, C.night, 0.3);
			}
			set(scene, px, py, colour);
		}
	}
	// The dial's bezel, filled later.
	rect(scene, DIAL.x - 1, DIAL.y - 1, DIAL.w + 2, DIAL.h + 2, C.brass);
	rect(scene, DIAL.x, DIAL.y, DIAL.w, DIAL.h, C.gold);
	// The speaker grille.
	for (let py = y + 11; py <= y + 16; py++) {
		for (let px = x + 8; px <= x + w - 4; px++) {
			set(
				scene,
				px,
				py,
				py % 2
					? mix(C.wood, C.night, 0.4)
					: mix(C.timberLight, C.night, 0.35)
			);
		}
	}
	// Two knobs below it; the left one is under his hand.
	paint(scene, x + w - 8, y + 18, ['.bb.', 'bLbs', 'bbss', '.ss.'], {
		b: C.brass,
		L: C.gold,
		s: C.lampFrame,
	});
}

/**
 * The glowing dial, painted after the glow: tick marks and a red needle.
 * @param {Canvas} scene
 */
function drawDial(scene) {
	const { x, y, w, h } = DIAL;
	for (let py = y; py < y + h; py++) {
		for (let px = x; px < x + w; px++) {
			const middle = Math.abs(px - x - w / 2) < w / 3 && py > y;
			set(scene, px, py, middle ? C.lampGlow : C.gold);
		}
	}
	for (let px = x + 1; px < x + w - 1; px += 2) {
		set(scene, px, y, C.amber);
	}
	rect(scene, x + 9, y, 1, h, C.brickRed);
	rect(scene, x, y + h - 1, w, 1, C.amber);
}

/**
 * Photographs spread on the desk: pale prints of a building and a figure, no writing.
 * @param {Canvas} scene
 */
function drawPhotos(scene) {
	const paper = mix(C.cream, C.nightSky4, 0.25);
	const print = mix(C.stone, C.nightSky4, 0.3);
	const dark = mix(C.stoneShade, C.night, 0.4);
	paint(
		scene,
		3,
		DESK + 1,
		[
			'wwwwwwwwww',
			'wpppppppdw',
			'wppkkppppw',
			'wpkkkkpppw',
			'wpkkkkpddw',
			'wwwwwwwwww',
		],
		{ w: paper, p: print, k: dark, d: mix(C.stone, C.nightSky5, 0.2) }
	);
	paint(
		scene,
		11,
		DESK + 4,
		[
			'wwwwwwwww',
			'wpppppppw',
			'wppppkppw',
			'wpppkkkpw',
			'wpppkkkpw',
			'wwwwwwwww',
		],
		{ w: mix(C.cream, C.amber, 0.15), p: print, k: dark }
	);
}

/**
 * A tiny camera on the desk: a steel body with a black lens.
 * @param {Canvas} scene
 */
function drawCamera(scene) {
	paint(
		scene,
		24,
		DESK + 2,
		[
			'.ll......',
			'lsssssssd',
			'skkssksdd',
			'skWksssdd',
			'skkssssdd',
			'ddddddddd',
		],
		{
			l: C.stoneLight,
			s: C.stone,
			d: C.stoneShade,
			k: C.ink,
			W: C.white,
		}
	);
}

/**
 * The headphone cord hanging from the far cup and looping down to the radio.
 * @param {Canvas} scene
 */
function drawCord(scene) {
	const cord = mix(C.night, C.stoneShade, 0.4);
	for (let y = 18; y <= RADIO.y + 8; y++) {
		const t = (y - 18) / (RADIO.y + 8 - 18);
		const x = Math.round(FACE_X + 9 + t * 5 + Math.sin(t * Math.PI) * 4);
		set(scene, x, y, cord);
	}
}
