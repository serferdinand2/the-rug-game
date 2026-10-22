// Relentless: a sweating builder at night, a hauling rope over her shoulder, dragging a great stone up the ramp by torchlight, a half-built tower in scaffolding behind.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 35;

/** The torch flame on its pole at the right. */
const TORCH = { x: 57, y: 17 };

/** Where the rope comes over her shoulder, where her hands grip it, and where it is tied round the stone. */
const SHOULDER = { x: 25, y: 27 };
const GRIP = { x: 29, y: 37 };
const KNOT = { x: 9, y: 43 };

/** Skin: lit warm by the torch on her left (the picture's right), plain, and cool in the night's shade. */
const SKIN = {
	glint: mix(C.skinDeep, C.gold, 0.55),
	lit: mix(C.skinDeep, C.amber, 0.3),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.nightSky3, 0.45),
};

/** Her linen tunic: torchlit, plain, shaded and in the dark. */
const TUNIC = {
	lit: mix(C.sandLight, C.gold, 0.2),
	base: C.sand,
	shade: C.sandShade,
	dark: mix(C.sandShade, C.nightSky4, 0.5),
};

/** Close-cropped black hair, its tight curls catching the torch on her left. */
const HAIR = {
	glint: mix(C.timberLight, C.gold, 0.45),
	lit: mix(C.wood, C.amber, 0.35),
	base: mix(C.ink, C.wood, 0.5),
	dark: C.ink,
};

/** The hemp rope: darker than her linen, lit and twisted. */
const ROPE = {
	lit: C.sandShade,
	base: mix(C.timber, C.sandShade, 0.5),
	shade: C.timber,
};

/** The face, arms and the flame are lit by hand, so the torch's glow leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	C.ink,
	C.white,
	C.creamLight,
	C.lampGlow,
	C.gold,
];

/**
 * Draws the Relentless portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8433);

	drawSky(layer, {
		time: 'night',
		horizon: 44,
		random,
		stars: 30,
		starRows: 30,
		sparkles: [[44, 5]],
	});
	drawHills(layer);
	drawTower(layer);
	drawTorchPole(layer);

	// Back to front: the stone and the ramp, the builder, then her arms and the rope she hauls.
	const back = createCanvas(64, 64);
	drawRamp(back);
	drawStone(back, random);
	outline(back, C.ink);
	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);
	underlay(figure, back);

	drawArms(scene);
	drawRope(scene);
	drawFists(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, layer);

	glow(scene, {
		x: TORCH.x,
		y: TORCH.y,
		radius: 34,
		colour: C.amber,
		strength: 0.4,
		steps: 5,
		skip: FIGURE,
	});
	drawFlame(scene);
	drawSweat(scene);
	return scene;
}

/**
 * Low dark hills along the horizon.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = 40 + Math.round(Math.sin(x * 0.12 + 1) * 2.5);
		for (let y = top; y < 64; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * The half-built tower behind her on the left: rough courses rising to a ragged top, wrapped in timber scaffolding.
 * @param {Canvas} layer
 */
function drawTower(layer) {
	const left = 2;
	const right = 21;
	const stoneLit = mix(C.stoneMid, C.nightSky4, 0.45);
	const stoneBase = mix(C.stoneShade, C.nightSky3, 0.5);
	const stoneDark = mix(C.stoneShade, C.night, 0.6);
	for (let x = left; x <= right; x++) {
		// The unfinished top steps down from left to right.
		const top =
			7 + Math.floor((x - left) / 4) * 2 + ((x * 7) % 3 === 0 ? 1 : 0);
		for (let y = top; y < 46; y++) {
			let colour = stoneBase;
			if (x >= right - 2) {
				colour = stoneDark;
			} else if (x <= left + 1) {
				colour = stoneLit;
			} else if (y % 4 === 3 || (x + Math.floor(y / 4) * 3) % 6 === 0) {
				colour = stoneDark;
			}
			set(layer, x, y, colour);
		}
	}
	// A dark arched window.
	rect(layer, 9, 24, 3, 5, C.night);
	set(layer, 10, 23, C.night);
	// The scaffolding: two poles, crossbars and a plank at each level, and a ladder.
	const pole = mix(C.timber, C.night, 0.5);
	const plank = mix(C.timberLight, C.night, 0.45);
	for (const x of [0, 23]) {
		line(layer, x, 3, x, 46, pole);
	}
	for (const y of [12, 22, 32]) {
		rect(layer, 0, y, 25, 1, plank);
		rect(layer, 0, y + 1, 25, 1, pole);
	}
	line(layer, 0, 12, 23, 22, pole);
	line(layer, 0, 32, 23, 22, pole);
	for (let y = 13; y < 32; y++) {
		set(layer, 16, y, pole);
		set(layer, 19, y, pole);
		if (y % 3 === 0) {
			rect(layer, 16, y, 4, 1, plank);
		}
	}
}

/**
 * The torch's pole standing at the right edge, and its iron basket.
 * @param {Canvas} layer
 */
function drawTorchPole(layer) {
	const pole = mix(C.timber, C.night, 0.3);
	rect(layer, TORCH.x, TORCH.y + 4, 2, 64 - TORCH.y - 4, pole);
	set(layer, TORCH.x + 1, TORCH.y + 6, mix(C.timberLight, C.amber, 0.3));
	paint(layer, TORCH.x - 2, TORCH.y + 1, ['k.k.k.', 'kkkkkk', '.kkkk.'], {
		k: C.wood,
	});
}

/**
 * The timber ramp she climbs, rising from the lower left to the right, its planks catching the torch.
 * @param {Canvas} scene
 */
function drawRamp(scene) {
	for (let x = 0; x < 64; x++) {
		const top = 58 - Math.round(x * 0.12);
		for (let y = top; y < 64; y++) {
			let colour = mix(C.timber, C.night, 0.45);
			if (y === top) {
				colour = mix(C.timberLight, C.night, 0.1);
			} else if (y === top + 1) {
				colour = mix(C.timber, C.night, 0.2);
			} else if ((x + Math.round(x * 0.12)) % 6 === 0) {
				colour = mix(C.wood, C.night, 0.4);
			} else if ((y - top) % 3 === 0) {
				colour = mix(C.timberShade, C.night, 0.35);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The great squared stone she drags, roped round, sitting on log rollers on the ramp behind her:
 * its top lit by the moon, its front face rough with chisel marks, its far end warmed by the torch.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawStone(scene, random) {
	const x0 = 0;
	const y0 = 41;
	const w = 15;
	const h = 14;
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			// The top face, slanting back.
			if (y < y0 + 4 && x > x0 + w - 1 - (y - y0)) {
				continue;
			}
			let colour = mix(C.stone, C.nightSky4, 0.25);
			if (y < y0 + 4) {
				colour = mix(C.stoneLight, C.nightSky6, 0.2);
			} else if (x >= x0 + w - 4) {
				colour = mix(C.stoneMid, C.amber, 0.2);
			} else if (y >= y0 + h - 2) {
				colour = mix(C.stoneShade, C.night, 0.3);
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, x0, y0 + 4, w - 4, 1, mix(C.stoneShade, C.nightSky3, 0.3));
	// Chisel marks.
	for (let i = 0; i < 14; i++) {
		const x = x0 + 1 + Math.floor(random() * (w - 6));
		const y = y0 + 6 + Math.floor(random() * (h - 9));
		set(scene, x, y, mix(C.stoneShade, C.nightSky3, 0.3));
		set(scene, x + 1, y, mix(C.stoneLight, C.nightSky5, 0.3));
	}
	// The rope bound round it.
	for (let y = y0; y < y0 + h; y++) {
		set(scene, KNOT.x - 1, y, y % 2 ? ROPE.base : ROPE.shade);
		set(scene, KNOT.x, y, y % 2 ? ROPE.shade : ROPE.lit);
	}
	// The log rollers under it.
	for (const x of [1, 9]) {
		paint(scene, x, y0 + h, ['.ttt.', 'tTotT', '.ttt.'], {
			t: mix(C.timber, C.night, 0.3),
			T: mix(C.timberLight, C.night, 0.15),
			o: mix(C.sand, C.night, 0.3),
		});
	}
}

/**
 * The tunic's first and last column on a row: it narrows a little below the chest.
 * @param {number} y
 * @returns {[number, number]}
 */
function tunicSpan(y) {
	const below = Math.max(0, y - 34);
	return [22 + Math.round(below * 0.12), 49 - Math.round(below * 0.15)];
}

/**
 * Her body turned to the climb: bare shoulders over a sleeveless linen tunic belted at the waist, torchlit on her left.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, straining.
	for (let y = 23; y <= 28; y++) {
		for (let x = FACE_X - 3; x <= FACE_X + 3; x++) {
			let colour = SKIN.base;
			if (x >= FACE_X + 2) {
				colour = SKIN.lit;
			} else if (x <= FACE_X - 2 || y === 23) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	line(scene, FACE_X + 1, 24, FACE_X - 1, 28, SKIN.lit);
	// The tunic, from the shoulders down past the belt, its front turned a little to the right.
	for (let y = 29; y < 64; y++) {
		const [left, right] = tunicSpan(y);
		for (let x = left; x <= right; x++) {
			const u = (x - left) / (right - left);
			let colour = TUNIC.base;
			if (u > 0.82) {
				colour = TUNIC.lit;
			} else if (u < 0.15) {
				colour = TUNIC.dark;
			} else if (u < 0.45) {
				colour = TUNIC.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Bare shoulders: the one on the torch's side lit, the one under the rope in shade.
	/** @type {[number, Colour[]][]} */
	const shoulders = [
		[25, [SKIN.dark, SKIN.shade, SKIN.base]],
		[47, [SKIN.base, SKIN.lit, SKIN.glint]],
	];
	for (const [cx, colours] of shoulders) {
		for (let y = 26; y <= 35; y++) {
			for (let x = cx - 5; x <= cx + 5; x++) {
				if (Math.hypot((x - cx) / 5, (y - 31) / 5) > 1) {
					continue;
				}
				const u = (x - cx) / 5;
				set(
					scene,
					x,
					y,
					u < -0.4 ? colours[0] : u > 0.4 ? colours[2] : colours[1]
				);
			}
		}
	}
	// The tunic's straps and its neckline.
	for (let y = 28; y <= 34; y++) {
		const step = Math.round((y - 28) * 0.3);
		set(scene, 29 + step, y, TUNIC.shade);
		set(scene, 30 + step, y, TUNIC.base);
		set(scene, 43 - step, y, TUNIC.lit);
		set(scene, 44 - step, y, TUNIC.base);
	}
	for (let x = 31; x <= 42; x++) {
		const dip = Math.round(Math.sin(((x - 31) / 11) * Math.PI) * 2);
		for (let y = 28; y < 31 + dip; y++) {
			set(scene, x, y, x > FACE_X ? SKIN.lit : SKIN.shade);
		}
	}
	// A leather belt, kept within the tunic on each of its rows.
	for (let x = 20; x < 52; x++) {
		const y = 56 - Math.round((x - 20) * 0.06);
		const [left, right] = tunicSpan(y);
		if (x >= left && x <= right) {
			set(scene, x, y, C.timberShade);
		}
		const [lower, upper] = tunicSpan(y + 1);
		if (x >= lower && x <= upper) {
			set(scene, x, y + 1, C.wood);
		}
	}
	// Folds pulled across the tunic by the strain.
	line(scene, 33, 42, 44, 50, TUNIC.shade);
	line(scene, 31, 47, 40, 54, TUNIC.shade);
}

/**
 * Her head leaning into the effort: close-cropped black hair, a furrowed, sweating brow, eyes set on the climb,
 * teeth gritted, and a gold hoop in her ear; lit by the torch on her left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[9, -4, 5],
		[10, -5, 6],
		[11, -6, 7],
		[12, -6, 7],
		[13, -6, 7],
		[14, -6, 7],
		[15, -6, 7],
		[16, -6, 7],
		[17, -6, 7],
		[18, -5, 7],
		[19, -5, 7],
		[20, -5, 6],
		[21, -4, 6],
		[22, -3, 5],
		[23, -2, 4],
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
	// Close-cropped hair hugging her skull, down to the temples, its curls lit on the torch's side.
	for (let y = 3; y <= 14; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 8; x++) {
			const dx = x - FACE_X - 0.5;
			if ((dx / 8) ** 2 + ((y - 11) / 8) ** 2 > 1) {
				continue;
			}
			// The hairline: across the brow, and down past the temples.
			const hairline = Math.abs(dx) >= 6 ? 14 : 9;
			if (y > hairline) {
				continue;
			}
			let colour = HAIR.base;
			const curl = (x * 3 + y * 5) % 4 === 0;
			if (dx > 3 && curl) {
				colour = HAIR.lit;
			} else if (dx < -4 || (!curl && (x + y) % 3 === 0)) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The torch's shine along the crown on her left.
	for (const [x, y] of [
		[FACE_X + 3, 4],
		[FACE_X + 5, 5],
		[FACE_X + 6, 7],
		[FACE_X + 7, 9],
	]) {
		set(scene, x, y, HAIR.glint);
	}
	// The ears: the far one in shade, the near one lit, with a gold hoop.
	rect(scene, FACE_X - 7, 14, 1, 3, SKIN.dark);
	rect(scene, FACE_X + 8, 14, 1, 3, SKIN.lit);
	paint(scene, FACE_X + 8, 17, ['g.', 'gg'], { g: C.gold });
	// Furrowed brows angled down to the nose, eyes fixed ahead and up the ramp.
	paint(scene, FACE_X - 4, 12, ['kk.....kk', '.kk...kk.'], { k: C.ink });
	set(scene, FACE_X - 3, 14, C.creamShade);
	set(scene, FACE_X - 2, 14, C.ink);
	set(scene, FACE_X + 3, 14, C.creamLight);
	set(scene, FACE_X + 4, 14, C.ink);
	rect(scene, FACE_X - 3, 15, 2, 1, SKIN.dark);
	rect(scene, FACE_X + 3, 15, 2, 1, SKIN.base);
	// The nose: a shade line down its far side, a lit ridge, flared nostrils.
	rect(scene, FACE_X, 15, 1, 3, SKIN.shade);
	rect(scene, FACE_X + 1, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X - 1, 18, SKIN.dark);
	set(scene, FACE_X + 2, 18, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	// Gritted teeth between drawn-back lips.
	paint(scene, FACE_X - 2, 19, ['.llll.', 'kwwwwk', '.llll.'], {
		l: C.brickRedShade,
		k: C.ink,
		w: C.cream,
	});
	set(scene, FACE_X + 2, 20, C.white);
	// The jaw clenched hard: a lit line along it.
	set(scene, FACE_X + 5, 21, SKIN.glint);
	set(scene, FACE_X + 4, 22, SKIN.glint);
}

/**
 * A thick bare arm from shoulder or elbow to wrist, rounded at both ends, lit on the side facing the torch.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} r - Its half-thickness
 */
function drawLimb(scene, [x0, y0], [x1, y1], r) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = Math.hypot(dx, dy);
	// The normal that faces the torch, to the right and up.
	let nx = -dy / length;
	let ny = dx / length;
	if (nx * 2 - ny < 0) {
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
			let colour = SKIN.base;
			if (side > 0.7) {
				colour = SKIN.glint;
			} else if (side > 0.25) {
				colour = SKIN.lit;
			} else if (side < -0.6) {
				colour = SKIN.dark;
			} else if (side < -0.15) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Her arms bent hard, both hands pulling the rope down in front of her shoulder.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	// Her right arm (the picture's left): the upper arm down from the shoulder, the forearm up to the lower grip.
	drawLimb(scene, [22, 33], [21, 46], 3.8);
	drawLimb(scene, [21, 47], [GRIP.x - 3, GRIP.y + 4], 3.2);
	// Her left arm (the picture's right): down from the shoulder, then across her body to the upper grip.
	drawLimb(scene, [48, 34], [47, 47], 4);
	drawLimb(scene, [46, 48], [GRIP.x + 3, GRIP.y - 1], 3.4);
}

/**
 * Paints a thick twisted rope along a line, three pixels wide, its strands catching the light in turn.
 * @param {Canvas} scene
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
function drawRopeLine(scene, x0, y0, x1, y1) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
	for (let i = 0; i <= steps; i++) {
		const x = Math.round(x0 + ((x1 - x0) * i) / steps);
		const y = Math.round(y0 + ((y1 - y0) * i) / steps);
		for (let k = -1; k <= 1; k++) {
			const twist = (i + k + 3) % 3;
			const colour =
				twist === 0 ? ROPE.lit : twist === 1 ? ROPE.base : ROPE.shade;
			set(scene, steep ? x + k : x, steep ? y : y + k, colour);
		}
	}
}

/**
 * The rope she hauls: tied round the stone, taut up to her shoulder, over it to her hands, and its end hanging below them.
 * @param {Canvas} scene
 */
function drawRope(scene) {
	drawRopeLine(scene, KNOT.x, KNOT.y, SHOULDER.x - 2, SHOULDER.y + 1);
	drawRopeLine(
		scene,
		SHOULDER.x - 2,
		SHOULDER.y + 1,
		SHOULDER.x + 1,
		SHOULDER.y
	);
	drawRopeLine(scene, SHOULDER.x + 1, SHOULDER.y, GRIP.x, GRIP.y);
	drawRopeLine(scene, GRIP.x, GRIP.y + 3, GRIP.x + 2, 62);
}

/**
 * Her two fists clenched on the rope, one above the other, knuckles lit by the torch.
 * @param {Canvas} scene
 */
function drawFists(scene) {
	const fist = ['.bLL.', 'bLLLg', 'bLLLg', 'bbLLg', '.bbb.'];
	const colours = { L: SKIN.lit, g: SKIN.glint, b: SKIN.base };
	paint(scene, GRIP.x - 3, GRIP.y + 2, fist, colours);
	paint(scene, GRIP.x - 1, GRIP.y - 4, fist, colours);
	// Knuckle lines.
	set(scene, GRIP.x - 1, GRIP.y + 4, SKIN.shade);
	set(scene, GRIP.x + 1, GRIP.y - 2, SKIN.shade);
}

/**
 * The torch's flame, painted after the glow so it keeps its colours.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		TORCH.x - 3,
		TORCH.y - 7,
		[
			'....r...',
			'...rg...',
			'...rgr..',
			'..rgwgr.',
			'..rgWgr.',
			'.rgwWwgr',
			'.rgWWWgr',
			'..rgwgr.',
		],
		{ r: C.brickRed, g: C.amber, w: C.gold, W: C.lampGlow }
	);
	// Sparks rising from the flame.
	set(scene, TORCH.x - 2, TORCH.y - 10, C.gold);
	set(scene, TORCH.x + 2, TORCH.y - 12, C.amber);
	set(scene, TORCH.x, TORCH.y - 14, C.gold);
}

/**
 * Beads of sweat on her brow and temple, and one flying from her cheek, glinting in the torchlight.
 * @param {Canvas} scene
 */
function drawSweat(scene) {
	for (const [x, y] of [
		[FACE_X - 3, 10],
		[FACE_X + 3, 10],
		[FACE_X + 5, 11],
		[FACE_X + 6, 13],
		[FACE_X - 5, 16],
	]) {
		set(scene, x, y, C.lampGlow);
	}
	set(scene, FACE_X + 6, 15, C.white);
	set(scene, FACE_X + 11, 12, C.lampGlow);
	set(scene, FACE_X + 12, 11, C.white);
}
