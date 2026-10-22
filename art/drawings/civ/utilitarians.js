// Utilitarians: a sturdy railway engineer in hickory-striped overalls and cap, a big spanner over his shoulder, a forge chimney smoking and a locomotive steaming behind him by day.
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
import { drawSky } from '../../parts/sky.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The pixels a shape covers, keyed `x,y`, before it is coloured.
 * @typedef {Set<string>} Mask
 */

/**
 * A shape's colours, from its lit edge to its dark one.
 * @typedef {Object} Tone
 * @property {Colour} glint - The edge facing the sun
 * @property {Colour} lit - Next to the lit edge
 * @property {Colour} base - The body of the shape
 * @property {Colour} shade - Next to the dark edge
 * @property {Colour} dark - The edge away from the sun
 */

/** The last row of sky; the rail yard lies below it. */
const HORIZON = 44;

/** The face's centre column. */
const FACE_X = 31;

/** The spanner's jaw, and where his fist holds the handle. */
const JAW = { x: 49, y: 15 };
const GRIP = { x: 44, y: 37 };

/** Deep skin in the sun from his right. */
const SKIN = {
	glint: mix(C.skinTan, C.sandLight, 0.3),
	lit: mix(C.skinDeep, C.skinTan, 0.45),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.night, 0.35),
};

/** His short black beard. */
const BEARD = {
	lit: mix(C.wood, C.stone, 0.25),
	base: C.wood,
	dark: mix(C.wood, C.night, 0.5),
};

/** The hickory-striped cloth of his overalls, matching the cap: navy and cream stripes, lit to dark. */
const HICKORY = {
	navy: {
		lit: C.daySea2,
		base: C.daySea3,
		shade: C.nightSea2,
		dark: C.nightSea3,
	},
	cream: {
		lit: C.white,
		base: C.cream,
		shade: C.creamShade,
		dark: mix(C.creamShade, C.nightSea2, 0.45),
	},
	hem: C.nightSea3,
};

/** The mustard work shirt. */
const SHIRT = {
	glint: C.sandLight,
	lit: mix(C.sand, C.gold, 0.3),
	base: mix(C.sandShade, C.amber, 0.35),
	shade: mix(C.sandShade, C.timber, 0.45),
	dark: mix(C.timber, C.timberShade, 0.5),
};

/** Steel for the spanner. */
const STEEL = {
	glint: C.white,
	lit: C.stoneLight,
	base: C.stone,
	shade: C.stoneMid,
	dark: C.stoneShade,
};

/** The striped cap's two stripes. */
const CAP = {
	blue: C.daySea3,
	blueShade: C.nightSea2,
	white: C.cream,
	whiteShade: C.creamShade,
};

/** Eye whites and lips. */
const EYE = { lit: C.cream, shade: mix(C.cream, C.skinDeepShade, 0.4) };
const LIPS = mix(C.brickRedShade, C.skinDeepShade, 0.35);

/**
 * Draws the Utilitarians portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(82766);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawYard(layer);
	drawSmoke(layer, { x: 11, y: 11, tone: 'smoke', puffs: 3, drift: -1 });
	drawSteam(layer);

	// The forge and the engine are outlined on their own, behind him.
	const yard = createCanvas(64, 64);
	drawForge(yard);
	drawEngine(yard);
	outline(yard, C.ink);
	underlay(yard, layer);

	const body = createCanvas(64, 64);
	drawOveralls(body);
	drawFace(body);
	drawCap(body);
	outline(body, C.ink);
	const scene = createCanvas(64, 64);
	drawArms(scene);
	drawSpanner(scene);
	drawFists(scene);
	outline(scene, C.ink);
	underlay(scene, body);
	underlay(scene, yard);
	return scene;
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
 * The rail yard: cinder ground and a pair of rails running across under the engine.
 * @param {Canvas} layer
 */
function drawYard(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = (x * 5 + y * 3) % 7 === 0 ? C.stoneShade : C.stoneMid;
			if (y === HORIZON + 1) {
				colour = C.stone;
			}
			set(layer, x, y, colour);
		}
	}
	for (let x = 0; x < 64; x++) {
		set(layer, x, HORIZON + 3, C.stoneLight);
		set(layer, x, HORIZON + 4, C.stoneShade);
		if (x % 4 === 0) {
			rect(layer, x, HORIZON + 5, 2, 1, C.timberShade);
		}
	}
}

/**
 * The forge: a brick shed with the fire glowing in its doorway and a tall chimney.
 * @param {Canvas} yard
 */
function drawForge(yard) {
	// The chimney, lit on the sun's side, with a cap.
	for (let y = 14; y <= 32; y++) {
		for (let x = 8; x <= 14; x++) {
			let colour = C.brickRed;
			if (x === 8) {
				colour = C.brickRedLight;
			} else if (x >= 13 || y % 3 === 0) {
				colour = C.brickRedShade;
			}
			set(yard, x, y, colour);
		}
	}
	rect(yard, 7, 12, 9, 2, C.stoneMid);
	rect(yard, 7, 12, 9, 1, C.stoneLight);
	// The shed, its roof and the forge fire through the open door.
	for (let y = 32; y <= HORIZON + 2; y++) {
		for (let x = 0; x <= 18; x++) {
			let colour = C.brickRed;
			if (
				(y - 32) % 3 === 2 ||
				(x + (Math.floor((y - 32) / 3) % 2) * 2) % 4 === 0
			) {
				colour = C.brickRedShade;
			}
			set(yard, x, y, colour);
		}
	}
	rect(yard, 0, 31, 20, 2, C.stoneShade);
	rect(yard, 0, 31, 20, 1, C.stone);
	rect(yard, 1, 36, 5, HORIZON - 33, C.amber);
	rect(yard, 2, 38, 3, HORIZON - 35, C.gold);
	set(yard, 3, 40, C.lampGlow);
}

/**
 * The locomotive standing on the rails, facing left: a black boiler with brass bands, a tall
 * funnel, a brass dome, a red buffer beam and big red wheels.
 * @param {Canvas} yard
 */
function drawEngine(yard) {
	const front = 52;
	const black = {
		lit: mix(C.night, C.stone, 0.45),
		base: mix(C.night, C.stoneShade, 0.3),
		dark: C.night,
	};
	// The boiler.
	for (let y = 28; y <= 38; y++) {
		for (let x = front; x < 64; x++) {
			let colour = black.base;
			if (y <= 29) {
				colour = black.lit;
			} else if (y >= 37) {
				colour = black.dark;
			}
			if ((x - front) % 7 === 5) {
				colour = y <= 29 ? C.gold : C.brass;
			}
			set(yard, x, y, colour);
		}
	}
	// The smokebox door on the front.
	rect(yard, front, 29, 2, 9, C.stoneShade);
	set(yard, front, 33, C.stoneLight);
	// The funnel, the dome and the cab front.
	for (let y = 19; y <= 27; y++) {
		const half = y < 21 ? 2 : 1;
		for (let x = 55 - half; x <= 56 + half; x++) {
			set(yard, x, y, x === 55 - half ? black.lit : black.base);
		}
	}
	paint(yard, 61, 24, ['.gg', 'gbb', 'bbb'], { g: C.gold, b: C.brass });
	// The running board and the red buffer beam.
	rect(yard, front - 3, 39, 64 - front + 3, 2, C.brickRed);
	rect(yard, front - 3, 39, 64 - front + 3, 1, C.brickRedLight);
	rect(yard, front - 4, 38, 1, 4, C.stoneMid);
	// Two big red wheels with their spokes and a coupling rod.
	for (const cx of [56, 66]) {
		for (let y = 39; y <= HORIZON + 3; y++) {
			for (let x = cx - 4; x <= cx + 4; x++) {
				const d = Math.hypot(x - cx, y - (HORIZON - 1));
				if (d > 4.4) {
					continue;
				}
				let colour = d > 3.3 ? C.brickRedShade : C.brickRed;
				if (d < 1) {
					colour = C.brass;
				} else if (x === cx || y === HORIZON - 1) {
					colour = C.brickRedShade;
				}
				set(yard, x, y, colour);
			}
		}
	}
	line(yard, 54, HORIZON, 63, HORIZON, C.stoneLight);
}

/**
 * The engine's steam: billows rising from the funnel's mouth and drifting off to the right,
 * shaded on their lower side.
 * @param {Canvas} layer
 */
function drawSteam(layer) {
	for (const [cx, cy, r] of [
		[56, 16, 2],
		[57, 13, 2.5],
		[59, 9, 3],
		[61, 5, 3.5],
		[64, 0, 4],
	]) {
		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d > r) {
					continue;
				}
				const shaded = y - cy + (x - cx) * 0.5 > r * 0.3;
				set(layer, x, y, shaded ? C.cloudShade : C.white);
			}
		}
	}
}

/**
 * Picks the hickory stripe's colour at a column, lit on the sun's side and dark on the other.
 * @param {number} x
 * @param {number} u - Where the column sits across the garment, from -1 (lit edge) to 1 (dark edge)
 * @param {boolean} [inset] - A step darker, as inside the pocket
 * @returns {Colour}
 */
function hickory(x, u, inset = false) {
	const stripe = (x - FACE_X + 21) % 3 === 0 ? HICKORY.cream : HICKORY.navy;
	if (u > 0.85) {
		return stripe.dark;
	}
	if (u > 0.45 || inset) {
		return stripe.shade;
	}
	if (u < -0.85) {
		return stripe.lit;
	}
	return stripe.base;
}

/**
 * His mustard shirt with the sleeves rolled, under hickory-striped overalls: a bib with a closed
 * pocket and a pencil, straps buttoned with steel over his shoulders.
 * @param {Canvas} scene
 */
function drawOveralls(scene) {
	// A thick neck.
	for (let y = 23; y <= 27; y++) {
		for (let x = FACE_X - 3; x <= FACE_X + 3; x++) {
			set(
				scene,
				x,
				y,
				x === FACE_X - 3 ? SKIN.lit : y === 24 ? SKIN.dark : SKIN.shade
			);
		}
	}
	for (let y = 26; y < 64; y++) {
		const half = Math.min(19, 9 + Math.round((y - 26) * 2.6));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHIRT.base;
			if (u < -0.88) {
				colour = SHIRT.glint;
			} else if (u < -0.55) {
				colour = SHIRT.lit;
			} else if (u > 0.85) {
				colour = SHIRT.dark;
			} else if (u > 0.4) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Creases in the shirt where it bunches at the shoulders.
	line(scene, FACE_X - 13, 30, FACE_X - 10, 33, SHIRT.shade);
	line(scene, FACE_X + 13, 30, FACE_X + 10, 33, SHIRT.dark);
	// The open collar.
	paint(scene, FACE_X - 4, 26, ['ll.....ss', '.lls.sss.', '...sss...'], {
		l: SHIRT.lit,
		s: SHIRT.shade,
	});
	set(scene, FACE_X, 28, SKIN.shade);
	// The bib, and the trousers below it across his whole width.
	for (let y = 34; y < 64; y++) {
		const half = y < 50 ? 9 : 16;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			set(scene, x, y, y === 34 ? HICKORY.hem : hickory(x, u));
		}
	}
	// The waistband with a steel button at each side, and the fly seam below it.
	for (let x = FACE_X - 16; x <= FACE_X + 16; x++) {
		set(scene, x, 50, HICKORY.hem);
	}
	set(scene, FACE_X - 12, 50, C.stoneLight);
	set(scene, FACE_X + 12, 50, C.stone);
	for (let y = 51; y < 64; y++) {
		set(scene, FACE_X + 1, y, HICKORY.hem);
	}
	// The straps over his shoulders, with steel buttons at the bib.
	line(scene, FACE_X - 8, 34, FACE_X - 12, 26, HICKORY.navy.base);
	line(scene, FACE_X - 7, 34, FACE_X - 11, 26, HICKORY.navy.lit);
	line(scene, FACE_X + 8, 34, FACE_X + 12, 26, HICKORY.navy.dark);
	line(scene, FACE_X + 7, 34, FACE_X + 11, 26, HICKORY.navy.shade);
	set(scene, FACE_X - 8, 35, C.stoneLight);
	set(scene, FACE_X + 8, 35, C.stone);
	// The bib pocket, closed all round and a step darker, with a pencil in it.
	for (let y = 39; y <= 45; y++) {
		for (let x = FACE_X - 4; x <= FACE_X + 2; x++) {
			const edge =
				y === 39 || y === 45 || x === FACE_X - 4 || x === FACE_X + 2;
			set(scene, x, y, edge ? HICKORY.hem : hickory(x, 0, true));
		}
	}
	rect(scene, FACE_X - 2, 36, 1, 3, C.gold);
	set(scene, FACE_X - 2, 35, C.brickRed);
}

/**
 * His face turned to the viewer, glancing towards the forge: broad and steady, lit by the sun on his right,
 * a short black beard and moustache.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[9, -5, 5],
		[10, -6, 6],
		[11, -6, 6],
		[12, -6, 6],
		[13, -6, 6],
		[14, -6, 6],
		[15, -6, 6],
		[16, -6, 6],
		[17, -6, 6],
		[18, -6, 6],
		[19, -6, 6],
		[20, -5, 5],
		[21, -5, 5],
		[22, -4, 4],
		[23, -3, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -5) {
				colour = SKIN.glint;
			} else if (dx <= -3) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 2) {
				colour = SKIN.shade;
			}
			// The beard along the jaw and round the chin.
			if (y >= 19 && (Math.abs(dx) >= y - 15 || y >= 22)) {
				colour =
					dx <= -4 ? BEARD.lit : dx >= 3 ? BEARD.dark : BEARD.base;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Ears.
	rect(scene, FACE_X - 7, 14, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 7, 14, 1, 3, SKIN.shade);
	// The lit cheekbone, and heavy brows.
	set(scene, FACE_X - 4, 17, SKIN.glint);
	rect(scene, FACE_X - 4, 12, 4, 1, BEARD.base);
	rect(scene, FACE_X + 1, 12, 4, 1, BEARD.dark);
	// Eyes looking straight out.
	set(scene, FACE_X - 3, 14, C.ink);
	set(scene, FACE_X - 2, 14, EYE.lit);
	set(scene, FACE_X + 2, 14, C.ink);
	set(scene, FACE_X + 3, 14, EYE.shade);
	// A broad nose: lit on the sun's side, shaded on the other.
	rect(scene, FACE_X - 1, 15, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 1, 16, 1, 2, SKIN.shade);
	rect(scene, FACE_X - 1, 18, 3, 1, SKIN.dark);
	set(scene, FACE_X - 1, 17, SKIN.glint);
	// The moustache and a firm mouth in the beard.
	rect(scene, FACE_X - 3, 19, 7, 1, BEARD.base);
	set(scene, FACE_X - 3, 19, BEARD.lit);
	rect(scene, FACE_X - 2, 20, 5, 1, LIPS);
	rect(scene, FACE_X - 1, 21, 3, 1, SKIN.shade);
}

/**
 * The hickory-striped railway cap with a short peak.
 * @param {Canvas} scene
 */
function drawCap(scene) {
	for (let y = 2; y <= 9; y++) {
		const half = y === 2 ? 4 : y === 3 ? 6 : 7;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const dx = x - FACE_X;
			const blue = (dx + 20) % 3 !== 0;
			const shaded = dx >= 3;
			let colour = blue
				? shaded
					? CAP.blueShade
					: CAP.blue
				: shaded
					? CAP.whiteShade
					: CAP.white;
			if (dx <= -half + 1 && !blue) {
				colour = C.white;
			}
			set(scene, x, y, colour);
		}
	}
	// The peak, its underside in shadow over the brow.
	for (let x = FACE_X - 8; x <= FACE_X + 8; x++) {
		set(scene, x, 10, x < FACE_X ? CAP.blue : CAP.blueShade);
		if (Math.abs(x - FACE_X) <= 6) {
			set(scene, x, 11, SKIN.dark);
		}
	}
	set(scene, FACE_X, 2, CAP.blue);
}

/**
 * His arms: the near one akimbo with its fist on his hip, the far one bent up to the spanner on
 * his shoulder, both sleeves rolled to the elbow.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	/** @type {Mask} */
	const nearSleeve = new Set();
	stroke(
		nearSleeve,
		[
			[FACE_X - 16, 30],
			[FACE_X - 24, 39],
		],
		3.4
	);
	fill(scene, nearSleeve, SHIRT);
	/** @type {Mask} */
	const nearArm = new Set();
	stroke(
		nearArm,
		[
			[FACE_X - 25, 42],
			[FACE_X - 18, 47],
		],
		2.5
	);
	fill(scene, nearArm, SKIN);
	/** @type {Mask} */
	const farSleeve = new Set();
	stroke(
		farSleeve,
		[
			[FACE_X + 16, 30],
			[FACE_X + 19, 41],
		],
		3.4
	);
	fill(scene, farSleeve, SHIRT);
	/** @type {Mask} */
	const farArm = new Set();
	stroke(
		farArm,
		[
			[FACE_X + 18, 44],
			[GRIP.x + 1, GRIP.y + 1],
		],
		2.5
	);
	fill(scene, farArm, SKIN);
}

/**
 * The big open-ended spanner resting on his shoulder, its jaw up behind him.
 * @param {Canvas} scene
 */
function drawSpanner(scene) {
	/** @type {Mask} */
	const spanner = new Set();
	stroke(
		spanner,
		[
			[GRIP.x, GRIP.y],
			[JAW.x - 2, JAW.y + 5],
		],
		1.6
	);
	stroke(
		spanner,
		[
			[JAW.x, JAW.y],
			[JAW.x, JAW.y],
		],
		5.2
	);
	// The jaw's opening, facing up and away.
	for (const key of [...spanner]) {
		const [x, y] = key.split(',').map(Number);
		if (Math.hypot(x - JAW.x - 2.5, y - JAW.y + 3) < 3) {
			spanner.delete(key);
		}
	}
	fill(scene, spanner, STEEL);
}

/**
 * His two fists: one on his hip, one round the spanner's handle.
 * @param {Canvas} scene
 */
function drawFists(scene) {
	const keys = { g: SKIN.glint, l: SKIN.lit, b: SKIN.base, s: SKIN.shade };
	paint(scene, FACE_X - 18, 45, ['.lbb.', 'glbbs', 'glbss', '.bss.'], keys);
	paint(
		scene,
		GRIP.x - 2,
		GRIP.y - 2,
		['.lbb.', 'glbbs', 'glbbs', 'lbbss', '.bss.'],
		keys
	);
}
