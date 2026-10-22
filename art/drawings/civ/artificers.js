// Artificers: an artificer in a dark coat and a brass eyepiece reaching her brass mechanical arm into a glowing portal ring in her vaulted laboratory at night, drawing out a device from the future.
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
/** @typedef {import('../../painter.js').Colour} Colour */

/** The portal ring: its centre and outer radius. */
const PORTAL = { x: 11, y: 17, r: 14 };

/** The device from the future, held in her brass hand: the chrome orb's centre. */
const DEVICE = { x: 6, y: 22 };

/** The face's centre column. */
const FACE_X = 39;

/** The flagstone floor's first row. */
const FLOOR = 58;

/** Deep skin: lit teal by the portal on her right, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(mix(C.skinDeep, C.skinTan, 0.7), C.tealLight, 0.25),
	lit: mix(mix(C.skinDeep, C.skinTan, 0.4), C.tealLight, 0.15),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.night, 0.4),
};

/** Black hair in a big round puff, lit teal along the portal's side. */
const HAIR = {
	lit: mix(C.wood, C.teal, 0.35),
	base: mix(C.wood, C.ink, 0.35),
	dark: mix(C.ink, C.night, 0.3),
};

/** The long indigo coat: lit by the portal, plain and in shadow, with a red lining to its collar. */
const COAT = {
	lit: mix(C.roofLight, C.tealLight, 0.25),
	base: mix(C.roof, C.nightSea3, 0.4),
	shade: mix(C.roofShade, C.night, 0.3),
	lining: C.brickRed,
	liningShade: C.brickRedShade,
};

/** The brass arm and fittings: lit teal by the portal, polished, plain and in shadow, with iron joints. */
const BRASS = {
	glint: mix(C.gold, C.tealLight, 0.4),
	lit: C.gold,
	base: C.brass,
	shade: C.lampFrame,
	iron: mix(C.stoneShade, C.night, 0.35),
	ironLit: mix(C.stone, C.teal, 0.3),
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinDeepShade, 0.5) };

/** Lips. */
const LIPS = {
	line: mix(C.brickRedShade, C.ink, 0.3),
	lower: mix(C.brickRedShade, C.skinDeep, 0.4),
};

/** The deep of the portal between the arms of its swirl. */
const DEEP = mix(C.tealShade, C.night, 0.45);

/** The swirl inside the portal and the chrome device, which the glow leaves alone. */
const SWIRL = [
	C.white,
	C.tealLight,
	C.teal,
	C.tealShade,
	C.ghostLight,
	DEEP,
	C.arcaneLight,
	C.arcane,
	C.arcaneShade,
	C.stoneLight,
	C.stone,
	C.stoneShade,
	C.brickRedLight,
];

/** The face, hair and hands are lit by hand, so the glows leave them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(EYE),
	...Object.values(LIPS),
	...Object.values(BRASS),
	C.ink,
];

/**
 * Draws the Artificers portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8411);

	drawInterior(layer, { floor: FLOOR, random, wall: 'stone' });
	darkenRoom(layer);
	drawMachine(layer);
	drawCables(layer);

	// The portal ring hung from the vault, on its own outlined layer, so her arm reaches in front of it.
	const portal = createCanvas(64, 64);
	drawMount(portal);
	drawPortal(portal);
	drawRipple(portal);
	outline(portal, C.ink);

	const figure = createCanvas(64, 64);
	drawCoat(figure);
	drawHead(figure);
	outline(figure, C.ink);

	drawArm(scene);
	drawDevice(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, portal);
	underlay(scene, layer);

	glow(scene, {
		x: PORTAL.x,
		y: PORTAL.y,
		radius: 34,
		colour: C.teal,
		strength: 0.32,
		steps: 5,
		skip: [...SWIRL, ...FIGURE],
	});
	drawLights(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Dims the stone vault to night.
 * @param {Canvas} layer
 */
function darkenRoom(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.night, 0.7);
		}
	}
}

/**
 * The machine that powers the portal, standing against the wall at the top right: an iron cabinet
 * with round gauges and a big lever.
 * @param {Canvas} layer
 */
function drawMachine(layer) {
	const iron = mix(C.stoneShade, C.night, 0.45);
	const ironLit = mix(C.stone, C.night, 0.45);
	const rivet = mix(C.brass, C.night, 0.45);
	rect(layer, 48, 0, 16, 44, iron);
	rect(layer, 48, 0, 1, 44, ironLit);
	rect(layer, 49, 14, 15, 1, ironLit);
	for (let y = 2; y < 44; y += 6) {
		set(layer, 50, y, rivet);
		set(layer, 62, y, rivet);
	}
	// A big gauge at the top and a small one lower down: pale faces with a needle each.
	for (const [cx, cy, nx, ny] of [
		[56, 6, 2, -1],
		[59, 29, -1, -2],
	]) {
		for (let y = cy - 3; y <= cy + 3; y++) {
			for (let x = cx - 3; x <= cx + 3; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d <= 3.2) {
					set(
						layer,
						x,
						y,
						d > 2.4 ? rivet : mix(C.cream, C.night, 0.45)
					);
				}
			}
		}
		line(layer, cx, cy, cx + nx, cy + ny, C.ink);
	}
	// The lever in its slot.
	rect(layer, 52, 17, 2, 10, mix(C.ink, C.night, 0.5));
	line(layer, 53, 21, 56, 16, mix(C.stoneLight, C.night, 0.4));
	paint(layer, 55, 14, ['rr', 'rr'], { r: mix(C.brickRed, C.night, 0.35) });
}

/**
 * Thick black cables looping from the machine down the wall and across the floor to the portal's stand.
 * @param {Canvas} layer
 */
function drawCables(layer) {
	const cable = mix(C.ink, C.roofShade, 0.4);
	const cableLit = mix(C.roofShade, C.tealShade, 0.4);
	for (let x = 0; x < 64; x++) {
		const y = FLOOR + 2 + Math.round(Math.sin(x * 0.18) * 1.5);
		set(layer, x, y, cableLit);
		set(layer, x, y + 1, cable);
		const y2 = FLOOR - 2 - Math.round(Math.sin(x * 0.12 + 1) * 2);
		if (x < 20) {
			set(layer, x, y2, cableLit);
			set(layer, x, y2 + 1, cable);
		}
	}
}

/**
 * How the portal hangs: a short chain from the vault to the ring's top, and two thick cables
 * falling from its lower rim to the floor at the far left.
 * @param {Canvas} scene
 */
function drawMount(scene) {
	for (let y = 0; y < PORTAL.y - PORTAL.r; y++) {
		set(scene, PORTAL.x, y, y % 2 ? BRASS.iron : BRASS.ironLit);
	}
	const cable = mix(C.ink, C.roofShade, 0.4);
	const cableLit = mix(C.roofShade, C.tealShade, 0.5);
	for (const [x0, x1] of [
		[4, 0],
		[7, 3],
	]) {
		for (let y = PORTAL.y + 10; y <= FLOOR; y++) {
			const t = (y - PORTAL.y - 10) / (FLOOR - PORTAL.y - 10);
			const x = Math.round(x0 + (x1 - x0) * Math.sqrt(t));
			set(scene, x, y, cableLit);
			set(scene, x + 1, y, cable);
		}
	}
}

/**
 * The portal: a riveted brass ring round a swirl of teal light, brightest at its heart.
 * @param {Canvas} scene
 */
function drawPortal(scene) {
	const { x: cx, y: cy, r } = PORTAL;
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.4) {
				continue;
			}
			const angle = Math.atan2(y - cy, x - cx);
			if (d > r - 2.2) {
				// The ring: lit on its upper rim, shaded below.
				const upper = Math.sin(angle) < -0.2;
				let colour = upper ? C.brass : C.lampFrame;
				if (d < r - 1.2) {
					colour = upper ? C.gold : C.brass;
				}
				if (Math.cos(angle * 8) > 0.96) {
					colour = C.amber;
				}
				set(scene, x, y, colour);
				continue;
			}
			const u = d / (r - 2.2);
			const band = Math.sin(angle * 2 - u * 8);
			let colour = DEEP;
			if (u < 0.2) {
				colour = C.white;
			} else if (u < 0.36) {
				colour = C.tealLight;
			} else if (band > 0.55) {
				colour = u < 0.7 ? C.tealLight : C.teal;
			} else if (band > 0.05) {
				colour = C.teal;
			} else if (band > -0.5) {
				colour = C.tealShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Rings of light rippling out across the swirl where her arm plunges through it.
 * @param {Canvas} scene
 */
function drawRipple(scene) {
	const entry = { x: 14, y: 28 };
	for (let y = entry.y - 7; y <= entry.y + 7; y++) {
		for (let x = entry.x - 7; x <= entry.x + 7; x++) {
			const inside =
				Math.hypot(x - PORTAL.x, y - PORTAL.y) < PORTAL.r - 2.4;
			const d = Math.hypot((x - entry.x) * 0.8, y - entry.y);
			if (!inside) {
				continue;
			}
			if (Math.abs(d - 3.5) < 0.5) {
				set(scene, x, y, C.white);
			} else if (Math.abs(d - 6) < 0.5) {
				set(scene, x, y, C.tealLight);
			}
		}
	}
}

/**
 * Her long indigo coat, turned a little towards the portal: a high collar lined in red, a white shirt
 * at the throat, brass buttons down the front, and her right arm hanging at her side, a button at the cuff.
 * @param {Canvas} scene
 */
function drawCoat(scene) {
	// The neck, in the chin's shadow except on the portal's side.
	for (let y = 24; y <= 28; y++) {
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
	// The coat over the shoulders: the near shoulder runs out under the brass plate, the far one drops away.
	for (let y = 27; y < 64; y++) {
		const left = Math.max(
			24 - Math.floor((y - 34) / 7),
			FACE_X - 6 - Math.round((y - 27) * 2.2)
		);
		const right = Math.min(
			57 + Math.floor((y - 34) / 9),
			FACE_X + 6 + Math.round((y - 27) * 1.8)
		);
		for (let x = left; x <= right; x++) {
			let colour = COAT.base;
			if (x < left + 2) {
				colour = COAT.lit;
			} else if (x > FACE_X + 7) {
				colour = COAT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The shirt at the throat, and the coat's front edges below it.
	for (let y = 28; y < 64; y++) {
		const half = y < 34 ? 3 - Math.floor((y - 28) / 2) : 0;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x < FACE_X ? C.creamLight : C.creamShade);
		}
		if (y >= 34) {
			set(scene, FACE_X, y, COAT.shade);
			set(scene, FACE_X - 1, y, COAT.lit);
		}
	}
	// The high collar, standing up round her neck, red inside.
	for (let y = 24; y <= 30; y++) {
		const spread = Math.round((y - 24) * 0.6);
		set(scene, FACE_X - 4 - spread, y, COAT.lit);
		set(scene, FACE_X - 3 - spread, y, COAT.lining);
		set(scene, FACE_X + 3 + spread, y, COAT.liningShade);
		set(scene, FACE_X + 4 + spread, y, COAT.shade);
	}
	// Two rows of brass buttons.
	for (let y = 36; y < 64; y += 5) {
		set(scene, FACE_X - 4, y, BRASS.glint);
		set(scene, FACE_X + 3, y, BRASS.shade);
	}
	// Her right arm hangs at her side in its sleeve, a brass-buttoned cuff at the wrist.
	for (let y = 38; y < 64; y++) {
		const left = 51 + Math.floor((y - 38) / 9);
		for (let x = left; x <= left + 5; x++) {
			let colour = y < 58 ? COAT.shade : SKIN.shade;
			if (x === left) {
				colour = y < 58 ? COAT.base : SKIN.base;
			} else if (x === left + 5) {
				colour = y < 58 ? mix(COAT.shade, C.night, 0.4) : SKIN.dark;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 53, 56, 6, 2, COAT.base);
	set(scene, 54, 56, BRASS.base);
}

/**
 * Her head: black hair in a big round puff, a brass eyepiece over her far eye,
 * and her face turned a little towards the portal, lit teal on that side.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The puff of hair, wider than her head, and the hair framing the face, lit teal along the portal's side.
	for (let y = 0; y <= 22; y++) {
		for (let x = FACE_X - 13; x <= FACE_X + 13; x++) {
			const head = ((x - FACE_X) / 8.5) ** 2 + ((y - 13) / 9) ** 2;
			const puff = ((x - FACE_X) / 12) ** 2 + ((y - 5) / 7) ** 2;
			if (head > 1 && puff > 1) {
				continue;
			}
			const rim =
				((x - 1 - FACE_X) / 8.5) ** 2 + ((y - 13) / 9) ** 2 > 1 &&
				((x - 1 - FACE_X) / 12) ** 2 + ((y - 5) / 7) ** 2 > 1;
			const curl = (x * 3 + y * 5) % 7 === 0 || (x * 5 + y * 2) % 9 === 0;
			let colour = HAIR.base;
			if (x < FACE_X - 3 && (rim || curl)) {
				colour = HAIR.lit;
			} else if (x > FACE_X + 5) {
				colour = curl ? HAIR.base : HAIR.dark;
			} else if (curl) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[11, -4, 4],
		[12, -5, 5],
		[13, -5, 5],
		[14, -6, 5],
		[15, -6, 5],
		[16, -6, 5],
		[17, -6, 5],
		[18, -5, 5],
		[19, -5, 4],
		[20, -5, 4],
		[21, -4, 3],
		[22, -3, 3],
		[23, -2, 2],
		[24, -1, 1],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -5) {
				colour = SKIN.glint;
			} else if (dx <= -2) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The near ear, lit, with a brass stud; the far one hidden by her hair.
	rect(scene, FACE_X - 7, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X - 7, 18, BRASS.lit);
	// The lit cheekbone and the shade under the far one.
	set(scene, FACE_X - 4, 18, SKIN.glint);
	set(scene, FACE_X + 3, 19, SKIN.dark);
	// Brows, lids and eyes turned to her right, towards the portal.
	rect(scene, FACE_X - 4, 13, 3, 1, C.ink);
	rect(scene, FACE_X + 1, 12, 3, 1, C.ink);
	set(scene, FACE_X - 4, 15, C.ink);
	set(scene, FACE_X - 3, 15, EYE.lit);
	set(scene, FACE_X + 1, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.shade);
	// The eyepiece: a brass ring round the far eye, its strap running back into her hair.
	paint(scene, FACE_X, 13, ['.bbb.', 'b...s', 'b...s', '.sss.'], {
		b: BRASS.base,
		s: BRASS.shade,
	});
	line(scene, FACE_X + 5, 14, FACE_X + 8, 13, mix(C.ink, C.wood, 0.4));
	// The nose: a shade line down its far side and a lit tip.
	rect(scene, FACE_X, 17, 1, 2, SKIN.shade);
	set(scene, FACE_X - 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A set, determined mouth.
	rect(scene, FACE_X - 2, 21, 4, 1, LIPS.line);
	rect(scene, FACE_X - 1, 22, 2, 1, LIPS.lower);
}

/**
 * Paints a straight, round limb between two points, its colours banded across it from one edge to the other.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} half - Half the limb's thickness
 * @param {Colour[]} ramp - The bands, from the edge on the left of the direction of travel to the right
 */
function drawLimb(scene, [x0, y0], [x1, y1], half, ramp) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	const ux = (x1 - x0) / length;
	const uy = (y1 - y0) / length;
	const reach = Math.ceil(half) + 1;
	for (let y = Math.min(y0, y1) - reach; y <= Math.max(y0, y1) + reach; y++) {
		for (
			let x = Math.min(x0, x1) - reach;
			x <= Math.max(x0, x1) + reach;
			x++
		) {
			const along = (x - x0) * ux + (y - y0) * uy;
			const across = (x - x0) * uy - (y - y0) * ux;
			if (
				along < -0.5 ||
				along > length + 0.5 ||
				Math.abs(across) > half
			) {
				continue;
			}
			const band = Math.min(
				ramp.length - 1,
				Math.floor(((across + half) / (2 * half)) * ramp.length)
			);
			set(scene, x, y, ramp[band]);
		}
	}
}

/**
 * Her left arm, all brass: a riveted shoulder plate, then an upper arm and a forearm joined at an iron elbow,
 * reaching up into the portal.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	const ramp = [BRASS.glint, BRASS.lit, BRASS.base, BRASS.base, BRASS.shade];
	// The upper arm, down from the shoulder to the elbow.
	drawLimb(scene, [28, 35], [21, 41], 2.6, [
		BRASS.shade,
		BRASS.base,
		BRASS.base,
		BRASS.lit,
		BRASS.glint,
	]);
	// The forearm, from the elbow up across the ring's rim and into the swirl.
	drawLimb(scene, [21, 41], [12, 26], 2.1, ramp);
	// A piston beside the upper arm, a band of rivets round it, and a rod along the forearm.
	line(scene, 30, 38, 23, 44, BRASS.iron);
	line(scene, 29, 38, 23, 43, BRASS.ironLit);
	for (const [x, y] of [
		[25, 37],
		[24, 38],
		[23, 39],
	]) {
		set(scene, x, y, BRASS.shade);
	}
	line(scene, 18, 35, 14, 28, BRASS.ironLit);
	// The elbow: an iron joint with a brass bolt.
	paint(scene, 19, 39, ['.iIi.', 'iIgIi', 'iggsi', 'iisii', '.iii.'], {
		i: BRASS.iron,
		I: BRASS.ironLit,
		g: BRASS.lit,
		s: BRASS.shade,
	});
	// The shoulder plate, capping her shoulder.
	for (let y = 26; y <= 37; y++) {
		for (let x = 23; x <= 35; x++) {
			const d = ((x - 29.5) / 5.5) ** 2 + ((y - 32) / 5) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = BRASS.base;
			if (d > 0.6 && (x < 29 || y < 30)) {
				colour = BRASS.glint;
			} else if (x > 32 || y > 34) {
				colour = BRASS.shade;
			} else if (x < 28 && y < 32) {
				colour = BRASS.lit;
			}
			set(scene, x, y, colour);
		}
	}
	for (const [x, y] of [
		[26, 32],
		[29, 29],
		[32, 32],
	]) {
		set(scene, x, y, BRASS.shade);
	}
}

/**
 * The device from the future, half drawn out of the swirl: a chrome orb with a glowing violet lens
 * and a short antenna tipped with a red light, clasped by three jointed brass fingers and a thumb.
 * @param {Canvas} scene
 */
function drawDevice(scene) {
	const { x: cx, y: cy } = DEVICE;
	for (let y = cy - 4; y <= cy + 4; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > 4.1) {
				continue;
			}
			// Polished chrome: a bright rim at the top left, darkening to the lower right.
			const light = x - cx + (y - cy);
			let colour = C.stone;
			if (light < -4) {
				colour = C.stoneLight;
			} else if (light > 2) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, cx - 2, cy - 2, C.white);
	set(scene, cx - 1, cy - 3, C.white);
	// The glowing lens.
	paint(scene, cx - 2, cy, ['LA', 'AA'], {
		L: C.arcaneLight,
		A: C.arcane,
	});
	// The antenna.
	rect(scene, cx + 1, cy - 7, 1, 3, C.stoneLight);
	set(scene, cx + 1, cy - 8, C.brickRedLight);
	// The brass hand: a palm at the wrist, three fingers curled over the orb's side
	// with dark gaps between them, and the thumb under it.
	paint(
		scene,
		cx + 1,
		cy - 3,
		[
			'.gbbbb',
			'..kkbs',
			'.gbbbs',
			'..kkbs',
			'.gbbbs',
			'..kkbs',
			'gbbbbs',
			'.sss..',
		],
		{ g: BRASS.glint, b: BRASS.base, s: BRASS.shade, k: C.ink }
	);
}

/**
 * The machine's small signal lights, painted after the glow so they keep their colours.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	set(scene, 59, 17, C.brickRedLight);
	set(scene, 61, 17, C.tealLight);
	set(scene, 59, 20, C.gold);
	set(scene, 61, 20, C.tealLight);
}

/**
 * Sparks and motes of teal light spilling out of the portal round the device.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 9; i++) {
		const angle = random() * Math.PI * 2;
		const d = 13 + random() * 6;
		const x = Math.round(PORTAL.x + Math.cos(angle) * d);
		const y = Math.round(PORTAL.y + Math.sin(angle) * d);
		if (x > 24 || y < 4) {
			continue;
		}
		set(scene, x, y, random() > 0.5 ? C.tealLight : C.ghostLight);
	}
}
