// Space tile Science 5 VP: a six-wheeled science rover on a sulphur-yellow moon, its arm drilling into a blue crystal rock, a volcano's plume rising into the dark sky behind.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row; the ground begins below it. */
const HORIZON = 35;

/** The near wheels' hubs, rear to front, and the far wheels' offset behind them. */
const WHEELS = [15, 25, 35];
const HUB_Y = 47;
const FAR = { dx: 3, dy: -2 };

/** The wheels' radius. */
const WHEEL_R = 4.4;

/** The volcano's vent, high on its cone on the far horizon. */
const VENT = { x: 53, y: 25 };

/** The plume's umbrella: its middle column and the row its dome reaches. */
const CANOPY = { x: 53, top: 4 };

/**
 * The plume's puffs, painted in order, each its offset from the umbrella's middle and top, and its radius:
 * the column from the vent up, then the drooping rim, the shoulders and the crown.
 * @type {[number, number, number][]}
 */
const PUFFS = [
	[0, 19.5, 1.8],
	[0.5, 17, 2],
	[-0.5, 14.5, 2.3],
	[0.5, 12, 2.6],
	[-9.5, 9.5, 2.4],
	[9.5, 9.5, 2.4],
	[-7, 7.5, 3.1],
	[7, 7.5, 3.1],
	[-3, 7, 3.6],
	[3, 7, 3.6],
	[-4, 4.5, 3.4],
	[4, 4.5, 3.4],
	[0, 3.8, 3.8],
];

/** The squat crystal the rover drills: its top face's centre, its radius and the height of its sides. */
const BLOCK = { x: 47, y: 42, r: 5.6, h: 6 };

/** Where the drill bites into the crystal's top. */
const DRILL = { x: 47, y: 41 };

/** The small far sun, high on the left. */
const SUN = { x: 14, y: 10 };

/** The black sky, faintly warmed by the sulphur glow along the horizon. */
const SKY = [
	mix(C.ink, C.night, 0.4),
	C.night,
	mix(C.nightSky1, C.night, 0.3),
	C.nightSky2,
	mix(C.nightSky2, C.duskSky3, 0.3),
];

/** Stars in three brightnesses. */
const STARS = [C.white, C.starDim, mix(C.starDim, C.night, 0.55)];

/** The moon's sulphur ground: hazy and pale far off, deep yellow near, with orange, rust, frost and black lava. */
const SULPHUR = mix(C.gold, C.grassLight, 0.2);
const GROUND = {
	far: mix(SULPHUR, C.creamLight, 0.45),
	mid: mix(SULPHUR, C.lampGlow, 0.25),
	main: SULPHUR,
	near: mix(SULPHUR, C.amber, 0.25),
	grain: mix(SULPHUR, C.amber, 0.5),
	orange: mix(C.amber, C.brickRedLight, 0.3),
	rust: mix(C.brickRed, C.timber, 0.4),
	frost: mix(C.creamLight, C.foam, 0.3),
	lava: mix(C.wood, C.ink, 0.4),
	shadow: mix(C.amber, C.timberShade, 0.55),
	track: mix(SULPHUR, C.timber, 0.4),
};

/**
 * Stains on the ground, flattened by the low view: orange and rust, white frost and black lava pits. Each is
 * its centre, its half-width, its half-depth and its colour.
 * @type {[number, number, number, number, Colour][]}
 */
const PATCHES = [
	[6, 41, 5, 1, GROUND.orange],
	[28, 38, 6, 0.8, GROUND.orange],
	[58, 46, 6, 1.4, GROUND.orange],
	[6, 58, 7, 2, GROUND.rust],
	[60, 60, 5, 1.6, GROUND.orange],
	[44, 56, 6, 1.5, GROUND.frost],
	[20, 40, 4, 0.7, GROUND.frost],
	[30, 59, 4, 1.4, GROUND.lava],
	[2, 48, 3, 1, GROUND.lava],
];

/** The volcano: dark rock lit from the left, its ridge catching the sun, streaked with glowing lava. */
const ROCK = mix(C.timberShade, C.brickRedShade, 0.35);
const ROCK_LIT = mix(C.timber, C.brickRedShade, 0.3);
const RIDGE = mix(C.timberLight, C.amber, 0.35);
const LAVA = mix(C.brickRedLight, C.amber, 0.4);

/** The plume: sulphur ash, lit yellow by the sun at its top left, greying to dark ash underneath, glowing at the vent. */
const PLUME_GLOW = mix(C.lampGlow, SULPHUR, 0.6);
const PLUME_LIT = mix(SULPHUR, C.stoneLight, 0.2);
const ASH_LIT = mix(C.stoneLight, C.sandShade, 0.4);
const ASH = mix(C.stoneMid, C.sandShade, 0.3);
const ASH_DARK = mix(C.stoneShade, C.ink, 0.35);
const ASH_HOT = mix(C.brickRedLight, C.stoneMid, 0.45);
const FALLOUT = mix(C.sandShade, C.nightSky2, 0.45);

/** The blue crystal: lit, base, mid and shaded faces, and its deepest cracks. */
const CRYSTAL = {
	edge: mix(C.tealLight, C.white, 0.6),
	top: mix(C.foam, C.tealLight, 0.4),
	lit: mix(C.daySky4, C.tealLight, 0.45),
	base: mix(C.daySky2, C.teal, 0.2),
	mid: C.daySky1,
	shade: C.nightSea1,
	deep: C.nightSea3,
};

/** The rover: a white body, grey machinery, dark treads and a teal camera eye. */
const BODY = C.white;
const BODY_SIDE = C.cream;
const BODY_SHADE = C.creamShade;
const METAL = C.stoneLight;
const METAL_MID = C.stone;
const METAL_DARK = C.stoneShade;
const TREAD = mix(C.stoneShade, C.ink, 0.45);
const LENS = C.teal;

/**
 * Draws the Science 5 VP space tile.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(5124);

	drawSky(layer, random);
	drawPlume(layer, random);
	drawVolcano(layer);
	drawGround(layer, random);
	drawTracks(layer);
	drawShadow(layer);

	const rover = createCanvas(64, 64);
	drawFarWheels(rover);
	drawRtg(rover);
	drawBody(rover);
	drawSuspension(rover);
	for (const x of WHEELS) {
		drawWheel(rover, x, HUB_Y, false);
	}
	drawMast(rover);
	drawCrystal(rover);
	drawArm(rover);
	outline(rover, C.ink);
	underlay(rover, layer);

	glow(rover, {
		x: SUN.x,
		y: SUN.y,
		radius: 6,
		colour: C.gold,
		strength: 0.3,
		steps: 2,
		skip: [C.white, C.lampGlow],
	});
	glow(rover, {
		x: DRILL.x,
		y: DRILL.y,
		radius: 5,
		colour: C.tealLight,
		strength: 0.5,
		steps: 2,
		skip: [C.ink, METAL, METAL_MID, METAL_DARK, TREAD],
	});
	drawChips(rover);
	drawSparkles(rover);
	return rover;
}

/**
 * The black sky, a little lighter towards the horizon, with stars in three brightnesses and the small far sun.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / (HORIZON + 1)) * SKY.length;
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
	for (let i = 0; i < 46; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (HORIZON - 6));
		const pick = random();
		set(layer, x, y, STARS[pick > 0.75 ? 0 : pick > 0.4 ? 1 : 2]);
	}
	paint(
		layer,
		SUN.x - 2,
		SUN.y - 2,
		['.yyy.', 'ywwwy', 'ywwwy', 'ywwwy', '.yyy.'],
		{
			w: C.white,
			y: C.lampGlow,
		}
	);
}

/**
 * The volcano's plume: puffs of sulphur ash piled into a column over the vent and spread into a billowing
 * umbrella whose rim droops at the edges, curtains of sulphur falling back from under the rim and specks of
 * dark ash in the cloud.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPlume(layer, random) {
	const { x: cx, top } = CANOPY;
	// Curtains of fallout under the drooping rim, thinning as they fall.
	for (const side of [-1, 1]) {
		for (let x = cx + side * 7; Math.abs(x - cx) <= 11; x += side) {
			for (let y = top + 11; y < top + 23; y++) {
				const fall = (y - top - 11) / 12;
				if ((x + y) % 2 === 0 && random() > fall * 0.9) {
					set(layer, x, y, FALLOUT);
				}
			}
		}
	}
	for (const [dx, dy, r] of PUFFS) {
		drawPuff(layer, cx + dx, top + dy, r);
	}
	// The vent's heat reddening the foot of the column.
	for (let y = VENT.y - 2; y <= VENT.y; y++) {
		for (let x = VENT.x - 2; x <= VENT.x + 2; x++) {
			if (get(layer, x, y) === ASH || get(layer, x, y) === ASH_DARK) {
				set(layer, x, y, ASH_HOT);
			}
		}
	}
	// Specks of dark ash in the cloud.
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(cx - 11 + random() * 22);
		const y = top + 1 + Math.floor(random() * 18);
		const behind = get(layer, x, y);
		if (behind === ASH || behind === ASH_LIT || behind === FALLOUT) {
			set(layer, x, y, ASH_DARK);
		}
	}
}

/**
 * One puff of ash, shaded as a ball lit from the upper left: sulphur yellow on its lit side, grey across its
 * middle and dark ash on its shaded side. Later puffs are painted over earlier ones, so their rims overlap.
 * @param {Canvas} layer
 * @param {number} cx - Its centre column
 * @param {number} cy - Its centre row
 * @param {number} r - Its radius
 */
function drawPuff(layer, cx, cy, r) {
	for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
		for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
			const dx = (x + 0.5 - cx) / r;
			const dy = (y + 0.5 - cy) / r;
			if (dx * dx + dy * dy > 1) {
				continue;
			}
			const light = -(dx * 0.6 + dy * 0.8);
			let colour = ASH_DARK;
			if (light > 0.65) {
				colour = PLUME_GLOW;
			} else if (light > 0.3) {
				colour = PLUME_LIT;
			} else if (light > -0.1) {
				colour = ASH_LIT;
			} else if (light > -0.55) {
				colour = ASH;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The volcano on the far horizon: a broad dark cone rising off the right of the frame, its sunlit ridge,
 * a glowing vent and lava streaks down its flanks.
 * @param {Canvas} layer
 */
function drawVolcano(layer) {
	for (let x = 30; x < 64; x++) {
		const off = x + 0.5 - VENT.x;
		const rise = Math.round(
			HORIZON - VENT.y - Math.abs(off) * (off < 0 ? 0.55 : 0.45)
		);
		const crater = Math.abs(off) < 1.5;
		for (let y = HORIZON - rise + (crater ? 1 : 0); y <= HORIZON; y++) {
			let colour = off < -2 ? ROCK_LIT : ROCK;
			if (y === HORIZON - rise && off < 0) {
				colour = RIDGE;
			}
			set(layer, x, y, colour);
		}
	}
	for (const [x0, slope] of [
		[VENT.x - 2, -1.1],
		[VENT.x + 1, 0.7],
		[VENT.x + 2, 1.5],
	]) {
		for (let y = VENT.y + 2; y <= HORIZON - 1; y++) {
			const x = Math.round(x0 + (y - VENT.y) * slope);
			const behind = get(layer, x, y);
			if (behind === ROCK || behind === ROCK_LIT) {
				set(layer, x, y, LAVA);
			}
		}
	}
	rect(layer, VENT.x - 1, VENT.y + 1, 2, 1, C.lampGlow);
}

/**
 * The sulphur plain: pale and hazy at the horizon, deep yellow in front, spotted with orange and rust,
 * streaked with white frost, pitted with black lava and strewn with grains.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = GROUND.main;
			if (y < HORIZON + 3) {
				colour = GROUND.far;
			} else if (y < HORIZON + 8) {
				colour =
					(x + y) % 2 === 0 && y > HORIZON + 5
						? GROUND.main
						: GROUND.mid;
			} else if (y > 56 || (y > 54 && (x + y) % 2 === 0)) {
				colour = GROUND.near;
			}
			set(layer, x, y, colour);
		}
	}
	for (const [x, y, rx, ry, colour] of PATCHES) {
		for (let py = Math.floor(y - ry); py <= Math.ceil(y + ry); py++) {
			for (let px = x - rx; px <= x + rx; px++) {
				const d = ((px - x) / rx) ** 2 + ((py - y) / (ry + 0.5)) ** 2;
				if (d <= 1 && py > HORIZON) {
					set(layer, px, py, colour);
				}
			}
		}
	}
	for (let i = 0; i < 50; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 4 + Math.floor(random() * (60 - HORIZON));
		set(layer, x, y, random() > 0.35 ? GROUND.grain : GROUND.frost);
	}
}

/**
 * The tread marks the rover has left behind it, running off to the left.
 * @param {Canvas} layer
 */
function drawTracks(layer) {
	for (let x = 0; x < 12; x++) {
		if (x % 3 !== 2) {
			set(layer, x, 52, GROUND.track);
			set(layer, x + 1, 49, GROUND.track);
		}
	}
}

/**
 * The rover's shadow on the ground under it.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	for (let y = 49; y <= 54; y++) {
		for (let x = 8; x < 48; x++) {
			if (((x - 28) / 20) ** 2 + ((y - 51.5) / 2.6) ** 2 <= 1) {
				set(layer, x, y, GROUND.shadow);
			}
		}
	}
}

/**
 * One wheel seen from the side: a dark tread round its rim, a grey face with curved spokes and a bright hub.
 * @param {Canvas} canvas
 * @param {number} cx - The hub's column
 * @param {number} cy - The hub's row
 * @param {boolean} far - Whether it is on the far side, in the body's shade
 */
function drawWheel(canvas, cx, cy, far) {
	const dim = (/** @type {Colour} */ colour) =>
		far ? mix(colour, C.night, 0.45) : colour;
	for (let y = Math.floor(cy - WHEEL_R); y <= Math.ceil(cy + WHEEL_R); y++) {
		for (
			let x = Math.floor(cx - WHEEL_R);
			x <= Math.ceil(cx + WHEEL_R);
			x++
		) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > WHEEL_R) {
				continue;
			}
			const angle = Math.atan2(y - cy, x - cx);
			let colour = METAL_MID;
			if (d > WHEEL_R - 1) {
				colour = Math.round(angle * 4) % 2 === 0 ? TREAD : METAL_DARK;
			} else if (d < 1.2) {
				colour = METAL;
			} else if (Math.round(angle * 0.955 + d * 0.5) % 2 === 0) {
				colour = METAL_DARK;
			} else if (y < cy) {
				colour = METAL;
			}
			set(canvas, x, y, dim(colour));
		}
	}
}

/**
 * The three far wheels, peeking out behind the near ones.
 * @param {Canvas} rover
 */
function drawFarWheels(rover) {
	for (const x of WHEELS) {
		drawWheel(rover, x + FAR.dx, HUB_Y + FAR.dy, true);
	}
}

/**
 * The power unit at the rover's tail: a dark finned drum angled up and back.
 * @param {Canvas} rover
 */
function drawRtg(rover) {
	for (let i = 0; i < 7; i++) {
		const x = 11 - i;
		const y = 37 - i;
		rect(rover, x - 1, y - 1, 3, 3, METAL_DARK);
		set(rover, x - 1, y, i % 2 === 0 ? METAL_MID : TREAD);
		set(rover, x, y - 1, METAL_MID);
	}
}

/**
 * The body: a white box with its top deck catching the sun, its side in cream with panel seams and shaded towards
 * the front, a dark band of equipment along its foot, hazard cameras at its nose, and on the deck the instrument
 * boxes, the dish antenna and the thin whip antenna.
 * @param {Canvas} rover
 */
function drawBody(rover) {
	rect(rover, 11, 32, 28, 2, BODY);
	rect(rover, 10, 34, 29, 6, BODY_SIDE);
	rect(rover, 33, 35, 6, 4, mix(BODY_SIDE, BODY_SHADE, 0.5));
	rect(rover, 10, 39, 29, 1, BODY_SHADE);
	for (const x of [17, 24, 31]) {
		rect(rover, x, 34, 1, 5, BODY_SHADE);
	}
	rect(rover, 10, 34, 29, 1, BODY);
	rect(rover, 12, 40, 25, 1, METAL_DARK);
	// The hazard cameras looking ahead from the nose.
	rect(rover, 37, 37, 2, 1, TREAD);
	set(rover, 38, 37, LENS);
	// Instrument boxes on the deck.
	rect(rover, 26, 30, 5, 2, METAL_MID);
	rect(rover, 26, 30, 5, 1, METAL);
	rect(rover, 11, 30, 3, 2, METAL_DARK);
	// The dish antenna, a flat disc on a stub, and the thin whip antenna behind it.
	rect(rover, 21, 31, 1, 1, METAL_MID);
	paint(rover, 18, 28, ['.LLLLL.', 'LLLLLLm', '.mmmmm.'], {
		L: METAL,
		m: METAL_MID,
	});
	rect(rover, 15, 25, 1, 7, METAL_MID);
}

/**
 * The rocker-bogie legs: on each side a rocker from the body to the front wheel and back to a bogie,
 * which carries the middle and rear wheels.
 * @param {Canvas} rover
 */
function drawSuspension(rover) {
	const [rear, middle, front] = WHEELS;
	const pivot = { x: 25, y: 41 };
	const bogie = { x: 19, y: 43 };
	line(rover, pivot.x, pivot.y, front, HUB_Y, METAL_MID);
	line(rover, pivot.x + 1, pivot.y, front + 1, HUB_Y, METAL);
	line(rover, pivot.x, pivot.y, bogie.x, bogie.y, METAL_MID);
	line(rover, bogie.x, bogie.y, rear, HUB_Y, METAL_MID);
	line(rover, bogie.x, bogie.y, middle, HUB_Y, METAL_MID);
	rect(rover, pivot.x - 1, pivot.y - 1, 2, 2, METAL_DARK);
	rect(rover, bogie.x - 1, bogie.y - 1, 2, 2, METAL_DARK);
}

/**
 * The mast at the front of the deck and its camera head, looking ahead with its teal lenses.
 * @param {Canvas} rover
 */
function drawMast(rover) {
	rect(rover, 34, 18, 2, 14, METAL);
	rect(rover, 35, 18, 1, 14, METAL_MID);
	paint(
		rover,
		29,
		12,
		[
			'..wwwwwwww',
			'.wwwwwwwwd',
			'wwwwwwwkkd',
			'sssssskttk',
			'sssssskttk',
			'.ssssssddd',
		],
		{
			w: BODY,
			s: BODY_SIDE,
			d: METAL_DARK,
			k: TREAD,
			t: LENS,
		}
	);
}

/**
 * The blue crystal rock in front of the rover: a squat six-sided crystal with a flat top, the drill biting into it,
 * and a tall pointed prism growing up behind it, both lit from the upper left with bright edges where faces meet.
 * @param {Canvas} rover
 */
function drawCrystal(rover) {
	drawPrism(rover, { x: 52, y: 36, r: 2.6, h: 12, tip: 5 });
	drawPrism(rover, { ...BLOCK, tip: 0 });
	for (const [x, y] of [
		[41, 50],
		[51, 52],
		[44, 52],
	]) {
		set(rover, x, y, CRYSTAL.lit);
		set(rover, x + 1, y, CRYSTAL.shade);
	}
}

/**
 * One six-sided crystal standing upright, seen from a little above: its top face (or a pointed tip) and its three
 * front faces, lit, plain and shaded from left to right.
 * @param {Canvas} canvas
 * @param {{ x: number, y: number, r: number, h: number, tip: number }} prism - The top face's centre, the radius,
 *   the height of the sides and, for a pointed prism, how tall its tip rises above the sides
 */
function drawPrism(canvas, { x: cx, y: cy, r, h, tip }) {
	const squash = 0.45;
	const left = cx - r;
	const right = cx + r;
	for (
		let y = Math.floor(cy - r - tip);
		y <= Math.ceil(cy + r * squash + h);
		y++
	) {
		for (let x = Math.floor(left); x <= Math.ceil(right); x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			const off = (px - cx) / r;
			if (Math.abs(off) > 1) {
				continue;
			}
			// The hexagon's lower and upper edges at this column, measured from the top face's centre.
			const lower =
				(Math.abs(off) > 0.5 ? 2 - 2 * Math.abs(off) : 1) *
				r *
				squash *
				0.87;
			const upper = tip > 0 ? tip * (1 - Math.abs(off)) : lower;
			if (py < cy - upper || py > cy + lower + h) {
				continue;
			}
			const face = off < -0.5 ? 'lit' : off < 0.5 ? 'base' : 'shade';
			let colour = CRYSTAL[face];
			if (py <= cy + lower) {
				colour =
					tip > 0
						? off < 0
							? CRYSTAL.lit
							: CRYSTAL.shade
						: CRYSTAL.top;
				if (py > cy + lower - 1 || (tip === 0 && py < cy - lower + 1)) {
					colour = CRYSTAL.edge;
				}
			} else if (Math.abs(Math.abs(off) - 0.5) < 0.5 / r) {
				colour = off < 0 ? CRYSTAL.edge : CRYSTAL.mid;
			} else if (py > cy + lower + h - 1.5) {
				colour = face === 'shade' ? CRYSTAL.deep : CRYSTAL.mid;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The robotic arm reaching out from the front of the body: up to its elbow, down to the turret, the drill
 * bit biting into the top of the crystal.
 * @param {Canvas} rover
 */
function drawArm(rover) {
	line(rover, 38, 37, 43, 31, METAL);
	line(rover, 38, 38, 44, 32, METAL_MID);
	line(rover, 44, 31, 47, 34, METAL);
	line(rover, 45, 31, 48, 34, METAL_MID);
	rect(rover, 43, 30, 2, 2, METAL_DARK);
	paint(
		rover,
		45,
		34,
		['.kkk.', 'kmmmk', 'kmmmk', '.kkk.', '..s..', '..s..', '..s..'],
		{
			k: METAL_DARK,
			m: METAL_MID,
			s: METAL,
		}
	);
}

/**
 * Chips of crystal flying from the drill, catching the light.
 * @param {Canvas} canvas
 */
function drawChips(canvas) {
	/** @type {[number, number, Colour][]} */
	const chips = [
		[DRILL.x - 3, DRILL.y - 2, CRYSTAL.lit],
		[DRILL.x - 5, DRILL.y - 4, C.white],
		[DRILL.x + 3, DRILL.y - 3, CRYSTAL.lit],
		[DRILL.x - 2, DRILL.y - 5, CRYSTAL.base],
	];
	for (const [x, y, colour] of chips) {
		set(canvas, x, y, colour);
	}
}

/**
 * A few four-point sparkles in the black sky.
 * @param {Canvas} canvas
 */
function drawSparkles(canvas) {
	for (const [x, y] of [
		[27, 6],
		[5, 24],
		[40, 18],
	]) {
		set(canvas, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(canvas, x + dx, y + dy, C.starDim);
		}
	}
}
