// Ceramics: a potter's slip-streaked hands raising a tall pot of wet red clay on a spinning wheel, glazed pots on a shelf in the daylit workshop behind.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The pot's centre column, the row of its rim and the row it stands on. */
const POT = { x: 32, rim: 15, base: 47 };

/** The rim's rounded lip and the open mouth inside it, as ovals. */
const LIP = { x: POT.x, y: POT.rim, rx: 7.6, ry: 2.2 };
const MOUTH = { x: POT.x, y: POT.rim + 0.2, rx: 6, ry: 1.4 };

/** The pot's half-width at rows down its height: a lip, a narrowing neck and a full belly, as it is being raised. */
const PROFILE = [
	[15, 7.6],
	[17, 6.6],
	[21, 6.4],
	[28, 8],
	[35, 10.4],
	[41, 11],
	[45, 10.4],
	[47, 9.6],
];

/** The wheel head the pot spins on, and the splash pan round it: centre, half-width and half-height. */
const WHEEL = { x: 32, y: 48, rx: 19, ry: 3.5 };
const PAN = { x: 32, y: 51, rx: 30.5, ry: 6.5, bottom: 61 };

/** The shelf's top row behind the pot. */
const SHELF = 24;

/** The two forearms, each from where it enters the frame to the wrist, and its half-thickness. */
const LEFT_ARM = { from: { x: -5, y: -1 }, to: { x: 21, y: 10 }, r: 4.4 };
const RIGHT_ARM = { from: { x: 70, y: 50 }, to: { x: 47, y: 31 }, r: 4.6 };

/** Where each finger of the right hand ends across the front of the pot, from the top finger down. */
const FINGERS = [35, 33, 33, 35];

/** The wet red clay: gleam, lit, plain, shaded, the deep side away from the window and the dark inside the pot. */
const CLAY_GLEAM = mix(C.brickRedLight, C.lampGlow, 0.45);
const CLAY_LIGHT = mix(C.brickRedLight, C.amber, 0.35);
const CLAY = mix(C.brickRed, C.amber, 0.3);
const CLAY_SHADE = mix(C.brickRedShade, C.timber, 0.25);
const CLAY_DEEP = mix(C.brickRedShade, C.ink, 0.35);
const CLAY_INSIDE = mix(C.brickRedShade, C.ink, 0.6);

/** Slip: the watery clay smeared on the hands and the wheel. */
const SLIP = mix(CLAY, C.timberLight, 0.3);
const SLIP_SHADE = mix(CLAY_SHADE, C.timber, 0.3);

/** The potter's skin: lit by the window, plain and shaded. */
const SKIN_LIGHT = mix(C.skin, C.lampGlow, 0.3);
const SKIN = C.skin;
const SKIN_SHADE = C.skinShade;

/** The workshop wall: whitewash warmed by the day, lit near the window and shaded away from it, its flecks, the shelf's shadow and the window's sunlight on it. */
const WALL_LIGHT = mix(C.plasterLight, C.creamLight, 0.35);
const WALL = C.plasterLight;
const WALL_SHADE = mix(C.plaster, C.plasterLight, 0.35);
const WALL_SPECK = mix(C.plaster, C.plasterShade, 0.3);
const SUNLIT = mix(WALL_LIGHT, C.lampGlow, 0.4);
const SHELF_SHADOW = mix(C.plaster, C.plasterShade, 0.55);

/** The wheel head, coated in slip, and the streaks of its spinning. */
const WHEEL_TOP = mix(C.timberLight, CLAY, 0.4);
const WHEEL_LIGHT = mix(WHEEL_TOP, C.plasterLight, 0.35);
const WHEEL_DARK = mix(C.timber, CLAY_SHADE, 0.5);

/** The splash pan: its wet rim, the muddy water inside it and the slurry. */
const PAN_RIM_LIGHT = mix(C.timberLight, C.sand, 0.3);
const MUD = mix(CLAY_SHADE, C.wood, 0.45);
const MUD_LIGHT = mix(CLAY_SHADE, C.plaster, 0.25);

/** The glazes on the shelf: celadon, cobalt and honey, each lit, plain and shaded. */
const CELADON = [
	mix(C.ghostLight, C.grassLight, 0.35),
	mix(C.ghost, C.grassShade, 0.45),
	mix(C.ghostShade, C.forestFloorShade, 0.5),
];
const COBALT = [C.daySky3, mix(C.daySky1, C.nightSea2, 0.4), C.nightSea3];
const HONEY = [C.gold, C.amber, mix(C.amber, C.timber, 0.5)];

/** The colours the daylight glow leaves alone: the potter and the pot are lit by hand. */
const KEEP = [
	C.ink,
	CLAY_GLEAM,
	CLAY_LIGHT,
	CLAY,
	CLAY_SHADE,
	CLAY_DEEP,
	CLAY_INSIDE,
	SKIN_LIGHT,
	SKIN,
	SKIN_SHADE,
	SLIP,
	SLIP_SHADE,
];

/**
 * Draws the Ceramics masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6271);

	drawWall(layer, random);
	drawFloor(layer);
	const shelf = createCanvas(64, 64);
	drawShelf(shelf);
	drawGlazedPots(shelf);
	outline(shelf, C.ink);
	underlay(shelf, layer);

	drawPan(scene, random);
	drawWheel(scene, random);
	drawPot(scene);
	drawLeftHand(scene, random);
	drawFrontLip(scene);
	drawRightHand(scene, random);
	outline(scene, C.ink);
	underlay(scene, shelf);

	glow(scene, {
		x: 66,
		y: 4,
		radius: 52,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 3,
		skip: KEEP,
	});
	drawDroplets(scene);
	return scene;
}

/**
 * The half-width of the pot at a row, read between the points of its profile.
 * @param {number} y
 * @returns {number} 0 above the rim and below the base
 */
function potHalfWidth(y) {
	for (let i = 0; i < PROFILE.length - 1; i++) {
		const [y0, w0] = PROFILE[i];
		const [y1, w1] = PROFILE[i + 1];
		if (y >= y0 && y <= y1) {
			return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0);
		}
	}
	return 0;
}

/**
 * How far a pixel lies from the middle of an oval, as a share of the oval: below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number, rx: number, ry: number }} o
 * @returns {number}
 */
function oval(x, y, o) {
	return Math.hypot((x + 0.5 - o.x) / o.rx, (y + 0.5 - o.y) / o.ry);
}

/**
 * The workshop wall: whitewash lit from the window on the right, fading towards the left, with flecks in the plaster.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < 46; y++) {
		for (let x = 0; x < 64; x++) {
			// The light falls off to the left in dithered bands.
			const reach = x + (y % 2) * 2 + (x % 2);
			let colour = WALL;
			if (reach > 46) {
				colour = WALL_LIGHT;
			} else if (reach < 20) {
				colour = WALL_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	// The window's light thrown onto the wall, split by its mullion and transom.
	for (let y = 1; y < 22; y++) {
		for (let x = 30; x < 64; x++) {
			const u = x - y * 0.45;
			const mullion = Math.abs(u - 49.5) < 0.8 || y === 11;
			if (u > 42 && u < 57 && !mullion) {
				set(layer, x, y, SUNLIT);
			}
		}
	}
	for (let i = 0; i < 30; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			Math.floor(random() * 44),
			WALL_SPECK
		);
	}
	// The shelf's shadow on the wall, just under its plank.
	rect(layer, 0, SHELF + 4, 64, 2, SHELF_SHADOW);
}

/**
 * The floorboards under the wheel, seen at the picture's foot.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	for (let y = 46; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const seam = y % 4 === 1 || (x + y * 7) % 23 === 0;
			set(layer, x, y, seam ? C.floorShade : C.floor);
		}
	}
}

/**
 * The shelf across the wall: a plank lit along its front edge, and its brackets.
 * @param {Canvas} shelf
 */
function drawShelf(shelf) {
	rect(shelf, 0, SHELF, 64, 1, C.timberLight);
	rect(shelf, 0, SHELF + 1, 64, 2, C.timber);
	for (const x of [8, 56]) {
		rect(shelf, x, SHELF + 3, 2, 4, C.timberShade);
		set(shelf, x + 1, SHELF + 3, C.timber);
	}
}

/**
 * Three glazed pieces on the shelf: a round celadon jar on the left, a tall cobalt vase and a honey bowl on the right.
 * Each is lit on its right, towards the window, with one white gleam.
 * @param {Canvas} shelf
 */
function drawGlazedPots(shelf) {
	const [cl, cp, cs] = CELADON;
	paint(
		shelf,
		3,
		SHELF - 10,
		[
			'...pppp...',
			'...spps...',
			'..spppll..',
			'.sppppplp.',
			'sspppppllp',
			'sspppppllp',
			'ssppppppp.',
			'.ssppppps.',
			'..ssssss..',
			'...ssss...',
		],
		{ l: cl, p: cp, s: cs }
	);
	const [bl, bp, bs] = COBALT;
	paint(
		shelf,
		50,
		SHELF - 12,
		[
			'.pppp.',
			'..sp..',
			'..sp..',
			'.sppl.',
			'.sppl.',
			'sspplp',
			'sspplp',
			'sspplp',
			'sspppp',
			'.sspp.',
			'.sspp.',
			'..ss..',
		],
		{ l: bl, p: bp, s: bs }
	);
	const [hl, hp, hs] = HONEY;
	paint(shelf, 57, SHELF - 4, ['plllllp', 'spppppl', '.spppp.', '..sss..'], {
		l: hl,
		p: hp,
		s: hs,
	});
	set(shelf, 10, SHELF - 6, C.white);
	set(shelf, 54, SHELF - 7, C.white);
	set(shelf, 61, SHELF - 3, C.white);
}

/**
 * The splash pan round the wheel: a wooden tub, its wet rim, the muddy water inside it and its staves and hoop in front.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPan(scene, random) {
	const inner = { x: PAN.x, y: PAN.y, rx: PAN.rx - 2, ry: PAN.ry - 1.5 };
	for (let y = Math.floor(PAN.y - PAN.ry); y < PAN.bottom; y++) {
		for (let x = 0; x < 64; x++) {
			const across = (x + 0.5 - PAN.x) / PAN.rx;
			if (Math.abs(across) > 1) {
				continue;
			}
			const lit = across > 0.35;
			const shaded = across < -0.55;
			const top = oval(x, y, PAN);
			if (top <= 1) {
				if (oval(x, y, inner) <= 1) {
					set(scene, x, y, random() < 0.08 ? MUD_LIGHT : MUD);
				} else {
					set(
						scene,
						x,
						y,
						lit || y < PAN.y ? PAN_RIM_LIGHT : C.timberLight
					);
				}
				continue;
			}
			if (y < PAN.y) {
				continue;
			}
			// The tub's front: staves and an iron hoop.
			let colour = shaded
				? C.timberShade
				: lit
					? C.timberLight
					: C.timber;
			if (
				Math.round(across * 9) !==
				Math.round(((x + 1.5 - PAN.x) / PAN.rx) * 9)
			) {
				colour = C.timberShade;
			}
			if (y === PAN.bottom - 3) {
				colour = lit ? C.stone : C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The wheel head: a disc coated in slip, streaked in rings by its spinning, with its rim's thickness below.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawWheel(scene, random) {
	const below = { ...WHEEL, y: WHEEL.y + 2 };
	for (
		let y = Math.floor(WHEEL.y - WHEEL.ry);
		y <= Math.ceil(below.y + WHEEL.ry);
		y++
	) {
		for (
			let x = Math.floor(WHEEL.x - WHEEL.rx);
			x <= Math.ceil(WHEEL.x + WHEEL.rx);
			x++
		) {
			const d = oval(x, y, WHEEL);
			if (d <= 1) {
				// Rings of slip spun round the head, broken where the light catches them.
				const ring = Math.round(d * 5);
				let colour = WHEEL_TOP;
				if (ring === 3) {
					colour = random() < 0.7 ? WHEEL_LIGHT : WHEEL_TOP;
				} else if (ring === 5) {
					colour = WHEEL_DARK;
				}
				set(scene, x, y, colour);
			} else if (oval(x, y, below) <= 1 && y > WHEEL.y) {
				set(
					scene,
					x,
					y,
					(x - WHEEL.x) / WHEEL.rx > 0.4 ? C.timber : C.timberShade
				);
			}
		}
	}
}

/**
 * The pot: a tall wet cylinder with a full belly, lit from the window on the right, with a wet gleam down it
 * and throwing rings round it, standing in a collar of slip on the wheel.
 * @param {Canvas} scene
 */
function drawPot(scene) {
	for (let y = POT.rim; y <= POT.base; y++) {
		const half = potHalfWidth(y);
		for (
			let x = Math.round(POT.x - half);
			x < Math.round(POT.x + half);
			x++
		) {
			const across = (x + 0.5 - POT.x) / half;
			// The throwing rings: seen a little from above, each one sags into a shallow smile round the pot.
			const sag = Math.round(
				2 * Math.sqrt(Math.max(0, 1 - across * across))
			);
			const groove =
				(y - sag + 60) % 6 === 0 && y > POT.rim + 2 && y < POT.base - 1;
			set(scene, x, y, clayTone(across * 0.9 + 0.12, groove ? -1 : 0));
		}
	}
	// The rim: a rounded lip round the dark inside, its far wall catching a little light.
	for (let y = POT.rim - 3; y <= POT.rim + 2; y++) {
		for (let x = POT.x - 9; x <= POT.x + 9; x++) {
			if (oval(x, y, MOUTH) <= 1) {
				set(scene, x, y, y < POT.rim ? CLAY_DEEP : CLAY_INSIDE);
			} else if (oval(x, y, LIP) <= 1 && y <= POT.rim) {
				set(scene, x, y, lipTone(x));
			}
		}
	}
	// The collar of slip where the pot meets the wheel.
	for (let x = POT.x - 10; x < POT.x + 10; x++) {
		set(scene, x, POT.base, x > POT.x + 2 ? SLIP : SLIP_SHADE);
		if (x % 3 === 0) {
			set(scene, x, POT.base - 1, SLIP_SHADE);
		}
	}
}

/**
 * The near half of the rim, drawn again over the left hand so its fingers go down inside the pot.
 * @param {Canvas} scene
 */
function drawFrontLip(scene) {
	for (let y = POT.rim + 1; y <= POT.rim + 2; y++) {
		for (let x = POT.x - 9; x <= POT.x + 9; x++) {
			if (oval(x, y, LIP) <= 1 && oval(x, y, MOUTH) > 1) {
				set(scene, x, y, lipTone(x));
			}
		}
	}
}

/**
 * The rim's lip at a column: lit towards the window on the right, shaded on the far left.
 * @param {number} x
 * @returns {Colour}
 */
function lipTone(x) {
	const across = (x + 0.5 - POT.x) / LIP.rx;
	if (across > 0.2) {
		return CLAY_LIGHT;
	}
	return across < -0.6 ? CLAY_SHADE : CLAY;
}

/**
 * Picks a clay tone for a point on the pot by how much it faces the window, a step darker in a throwing ring's groove.
 * @param {number} facing - From about -1 (away from the window) to 1 (towards it)
 * @param {number} step - -1 in a ring's groove, 0 elsewhere
 * @returns {Colour}
 */
function clayTone(facing, step) {
	const tones = [CLAY_DEEP, CLAY_SHADE, CLAY, CLAY_LIGHT];
	if (facing > 0.62 && facing <= 0.84) {
		return step === -1 ? CLAY_LIGHT : CLAY_GLEAM;
	}
	let index = 0;
	if (facing > 0.28) {
		index = 3;
	} else if (facing > -0.35) {
		index = 2;
	} else if (facing > -0.75) {
		index = 1;
	}
	return tones[Math.max(0, Math.min(3, index + step))];
}

/**
 * Where a pixel lies against a limb running from `a` to `b`: how far along it (0 to 1), and how far to one side of its middle.
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {{ t: number, side: number }}
 */
function limbFrame(x, y, a, b) {
	const vx = b.x - a.x;
	const vy = b.y - a.y;
	const length = Math.hypot(vx, vy);
	const px = x + 0.5 - a.x;
	const py = y + 0.5 - a.y;
	return {
		t: (px * vx + py * vy) / (length * length),
		side: (px * -vy + py * vx) / length,
	};
}

/**
 * Paints a rounded limb from `a` to `b`: lit along the side that faces the window, shaded along the other.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @param {number} r - Half its thickness
 * @param {number} litSide - 1 or -1: which side of the limb faces the window
 */
function drawLimb(scene, a, b, r, litSide) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { t, side } = limbFrame(x, y, a, b);
			const end = t < 0 ? -t : t > 1 ? t - 1 : 0;
			const length = Math.hypot(b.x - a.x, b.y - a.y);
			if (Math.hypot(end * length, side) > r) {
				continue;
			}
			const towards = side * litSide;
			let colour = SKIN;
			if (towards > r * 0.4) {
				colour = SKIN_LIGHT;
			} else if (towards < -r * 0.45) {
				colour = SKIN_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The left hand, reaching in from the upper left and over the rim: its forearm, the back of the hand,
 * the fingers going down into the pot wet with slip, and slip running down the wrist.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLeftHand(scene, random) {
	const { from, to, r } = LEFT_ARM;
	drawLimb(scene, from, to, r, -1);
	// The back of the hand, turned down over the rim.
	drawLimb(scene, to, { x: 27, y: 12 }, 3.8, -1);
	// Four fingers bending down inside the pot.
	for (let i = 0; i < 4; i++) {
		drawLimb(
			scene,
			{ x: 25 + i * 1.8, y: 12 + i * 0.4 },
			{ x: 26 + i * 1.9, y: 16 },
			1,
			-1
		);
	}
	// The fingers, wet with slip where they went into the pot.
	for (let y = 12; y < 17; y++) {
		for (let x = 23; x < 33; x++) {
			if (y > 13 || (x + y) % 3 === 0) {
				coat(scene, x, y);
			}
		}
	}
	drawSlip(scene, from, to, r, random);
}

/**
 * The right hand, reaching in from the lower right: its forearm, the back of the hand against the pot's side,
 * four fingers wrapped round the front pressing the wall up, the thumb above, and slip coating the fingertips.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawRightHand(scene, random) {
	const { from, to, r } = RIGHT_ARM;
	drawLimb(scene, from, to, r, -1);
	// The back of the hand, lit along its top towards the window.
	for (let y = 22; y < 38; y++) {
		for (let x = 39; x < 51; x++) {
			const d = Math.hypot((x + 0.5 - 45) / 4.6, (y + 0.5 - 29.5) / 6.6);
			if (d > 1) {
				continue;
			}
			let colour = SKIN;
			if (y < 26 || x > 47) {
				colour = SKIN_LIGHT;
			} else if (y > 34) {
				colour = SKIN_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The thumb, up along the pot's side.
	drawLimb(scene, { x: 43, y: 24 }, { x: 40, y: 19 }, 1.3, -1);
	// Four fingers wrapped round the front of the pot, a crease of shadow between each.
	FINGERS.forEach((tip, i) => {
		const top = 24 + i * 3;
		rect(scene, tip + 1, top, 42 - tip, 1, SKIN_LIGHT);
		rect(scene, tip, top + 1, 43 - tip, 1, SKIN);
		if (i < FINGERS.length - 1) {
			rect(scene, tip + 1, top + 2, 42 - tip, 1, SKIN_SHADE);
		}
		// Slip on the fingertip, where it presses the clay.
		set(scene, tip + 1, top, SLIP);
		set(scene, tip, top + 1, SLIP_SHADE);
		set(scene, tip + 1, top + 1, SLIP);
		if (i % 2 === 0) {
			set(scene, tip + 2, top + 1, SLIP);
		}
	});
	drawSlip(scene, from, to, r, random);
}

/**
 * Two drips of slip running back down a forearm from the wrist.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} from - Where the forearm enters the frame
 * @param {{ x: number, y: number }} to - The wrist
 * @param {number} r - Half the forearm's thickness
 * @param {() => number} random
 */
function drawSlip(scene, from, to, r, random) {
	const length = Math.hypot(to.x - from.x, to.y - from.y);
	const ux = (to.x - from.x) / length;
	const uy = (to.y - from.y) / length;
	for (let i = 0; i < 2; i++) {
		const side = (i - 0.5) * r * 0.9 + (random() - 0.5);
		const run = 4 + Math.floor(random() * 4);
		for (let k = 0; k < run; k++) {
			const x = Math.round(to.x - ux * (k + i * 2) - uy * side);
			const y = Math.round(to.y - uy * (k + i * 2) + ux * side);
			coat(scene, x, y);
		}
	}
}

/**
 * Smears slip over one pixel of skin, leaving anything else alone.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 */
function coat(scene, x, y) {
	const under = get(scene, x, y);
	if (under === SKIN_SHADE) {
		set(scene, x, y, SLIP_SHADE);
	} else if (under === SKIN || under === SKIN_LIGHT) {
		set(scene, x, y, SLIP);
	}
}

/**
 * Drops of slip flung off the spinning pot, and the wet gleams on the clay, over the outline.
 * @param {Canvas} scene
 */
function drawDroplets(scene) {
	for (const [x, y] of [
		[17, 39],
		[14, 42],
		[11, 37],
		[19, 33],
	]) {
		set(scene, x, y, SLIP);
	}
	set(scene, 38, 41, C.lampGlow);
	set(scene, 38, 37, C.lampGlow);
}
