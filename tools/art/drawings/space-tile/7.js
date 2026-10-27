// Space tile 7 (food and culture): at magenta dusk on the shore of a pink lake, an alien tree hangs its glowing fruit pods from drooping fronds, and a long-necked grazer with shining spots stretches up to pluck one.
import {
	createCanvas,
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
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last row of sky, where the far hills meet the lake. */
const HORIZON = 31;

/** The near shore's first row. */
const SHORE = 48;

/** The row the tree and the grazer stand on. */
const GROUND = 55;

/** The tree trunk's centre column. */
const TRUNK_X = 21;

/** The crown, where the fronds spring from the top of the trunk. */
const CROWN = { x: 23, y: 19 };

/**
 * The fronds, arching up from the crown and drooping to their tips: each tip's column and row, and how high the frond arches.
 * @type {[number, number, number][]}
 */
const FRONDS = [
	[8, 29, 6],
	[11, 17, 7],
	[18, 10, 6],
	[32, 10, 7],
	[46, 19, 7],
	[40, 23, 6],
];

/**
 * The fruit pods hanging from the fronds: each pod's column, the row its stalk starts and the row its pod starts.
 * The one at column 29 is the one the grazer reaches for.
 * @type {[number, number, number][]}
 */
const PODS = [
	[9, 29, 31],
	[15, 24, 26],
	[19, 12, 14],
	[29, 15, 17],
	[33, 13, 15],
	[39, 17, 19],
	[45, 19, 21],
];

/** The small moon: its centre, over open water so its glitter shows beside the grazer. */
const MOON_AT = { x: 53, y: 19 };

/** The magenta dusk sky from the top down, to the pink glow where the sun has set. */
const MAGENTA = mix(C.duskSky4, C.arcane, 0.3);
const PINK = mix(C.duskSky5, C.arcaneLight, 0.45);
const PINK_LIGHT = mix(PINK, C.creamLight, 0.35);
const SKY = [C.duskSky1, C.duskSky2, C.duskSky3, MAGENTA, PINK];

/** The small moon's crescent, bright and at its rim. */
const MOON = mix(C.moon, PINK_LIGHT, 0.3);
const MOON_RIM = mix(C.moonRim, PINK, 0.5);

/** Thin clouds lit from below by the set sun. */
const CLOUD = mix(MAGENTA, PINK_LIGHT, 0.55);

/** The far shore's low hills, and their darker reflection in the lake. */
const HILL = mix(C.duskSky2, C.roofShade, 0.4);
const HILL_REFLECTION = mix(HILL, MAGENTA, 0.3);

/** The lake's water: rose under the far shore, deepening to plum at the near one, with paler ripples. */
const WATER = [
	mix(PINK, MAGENTA, 0.35),
	MAGENTA,
	mix(MAGENTA, C.duskSky3, 0.6),
];
const RIPPLE = [PINK_LIGHT, PINK, mix(PINK, MAGENTA, 0.5)];

/** The near shore: dark moss, its wet edge lit pink. */
const MOSS = mix(C.roofShade, C.tealShade, 0.35);
const MOSS_DARK = mix(C.night, C.tealShade, 0.2);
const SHORE_EDGE = mix(C.duskSky3, PINK, 0.35);

/** The bioluminescent light of the pods and spots: core, body and shade. */
const LIGHT = [C.white, C.ghostLight, C.ghost, C.ghostShade];

/** The bark: dark plum, lit magenta by the dusk on its right, with a glowing vein twisting up it. */
const BARK = mix(C.roofShade, C.duskSky3, 0.45);
const BARK_LIT = mix(C.duskSky4, C.arcaneLight, 0.2);
const BARK_DARK = mix(C.roofShade, C.night, 0.5);
const VEIN = C.ghostShade;

/** The fronds: teal, lit along their spines, darkest at the ends of their leaflets. */
const FROND = mix(C.tealShade, C.teal, 0.2);
const FROND_LIT = mix(C.teal, C.tealLight, 0.25);
const FROND_DARK = mix(C.tealShade, C.night, 0.4);

/** The grazer's hide: pink-lit along its back, dusky blue-violet, shaded and dark underneath. */
const HIDE = {
	lit: mix(C.railLight, C.arcaneLight, 0.45),
	base: mix(C.roofLight, C.teal, 0.2),
	shade: mix(C.roof, C.tealShade, 0.3),
	dark: mix(C.roofShade, C.night, 0.35),
};

/** The grazer's splayed feet. */
const FOOT = mix(C.roofShade, C.night, 0.6);

/** Colours the pods' glow leaves alone: the grazer, the trunk and the pods, lit by hand. The fronds take the glow. */
const SUBJECT = [
	...LIGHT,
	...Object.values(HIDE),
	FOOT,
	BARK,
	BARK_LIT,
	BARK_DARK,
	VEIN,
	C.ink,
];

/**
 * Draws space tile 7.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(70701);

	drawSky(layer, random);
	drawHills(layer, random);
	drawLake(layer, random);
	drawShore(layer, random);

	const fg = createCanvas(64, 64);
	drawTrunk(fg);
	drawFronds(fg);
	drawGrazer(fg);
	drawPods(fg);
	drawFallen(fg);
	outline(fg, C.ink);
	underlay(fg, layer);

	// The pods' light on the dusk around the tree, in soft bands.
	for (const [x, y] of [
		[14, 24],
		[37, 18],
	]) {
		glow(fg, {
			x,
			y,
			radius: 13,
			colour: C.ghost,
			strength: 0.3,
			steps: 3,
			skip: SUBJECT,
		});
	}
	drawSpores(fg, random);
	return fg;
}

/**
 * Fills an ellipse, choosing each pixel's colour from where it sits in it.
 * @param {Canvas} canvas
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {number} rx - Half-width
 * @param {number} ry - Half-height
 * @param {(nx: number, ny: number, x: number, y: number) => Colour | null} colour - nx and ny run from -1 to 1 across the ellipse
 */
function ellipse(canvas, cx, cy, rx, ry, colour) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const nx = (x + 0.5 - cx) / rx;
			const ny = (y + 0.5 - cy) / ry;
			if (nx * nx + ny * ny <= 1) {
				set(canvas, x, y, colour(nx, ny, x, y));
			}
		}
	}
}

/**
 * The hide's colour at a point of one of the grazer's rounded parts, lit from the sky above.
 * @param {number} nx - Across the part, -1 to 1
 * @param {number} ny - Down the part, -1 to 1
 * @returns {Colour}
 */
function hideColour(nx, ny) {
	const light = -ny * 0.85 + nx * 0.2;
	if (light > 0.6) {
		return HIDE.lit;
	}
	if (light > -0.1) {
		return HIDE.base;
	}
	return light > -0.55 ? HIDE.shade : HIDE.dark;
}

/**
 * The top of the far hills at a column.
 * @param {number} x
 * @returns {number} The hills' first row there.
 */
function hillTop(x) {
	return Math.round(
		HORIZON - 2 - 2 * Math.sin(x * 0.12 + 1) - Math.sin(x * 0.31)
	);
}

/**
 * The magenta dusk, dithered between its bands: the first stars, a small crescent moon,
 * and long thin clouds lit pink from below.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 11);
		set(layer, x, y, random() > 0.6 ? C.white : C.starDim);
	}
	// The moon: a thin crescent lit from below.
	const { x: mx, y: my } = MOON_AT;
	for (let y = my - 3; y <= my + 3; y++) {
		for (let x = mx - 3; x <= mx + 3; x++) {
			const lit = Math.hypot(x - mx, y - my) <= 3.2;
			const bite = Math.hypot(x - mx - 0.6, y - my + 1.4) <= 3;
			if (lit && !bite) {
				set(layer, x, y, y > my + 1 ? MOON : MOON_RIM);
			}
		}
	}
	for (const [x, y, w] of [
		[34, 24, 14],
		[50, 27, 12],
		[1, 22, 9],
	]) {
		rect(layer, x, y, w, 1, CLOUD);
		rect(layer, x + 2, y + 1, w - 4, 1, PINK_LIGHT);
	}
}

/**
 * Low hills on the far shore, with a few dots of glowing woods on them.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHills(layer, random) {
	for (let x = 0; x < 64; x++) {
		for (let y = hillTop(x); y <= HORIZON; y++) {
			set(layer, x, y, HILL);
		}
	}
	for (let i = 0; i < 7; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			HORIZON - Math.floor(random() * 2),
			C.ghostShade
		);
	}
}

/**
 * The pink lake: a bright sheen along the far shore, the hills mirrored dark beneath it, then level water
 * deepening towards the viewer, crossed by ripples. The moon and the glowing pods shine in it as broken streaks.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLake(layer, random) {
	const depth = SHORE - HORIZON - 1;
	for (let y = HORIZON + 1; y < SHORE; y++) {
		const band = Math.min(
			WATER.length - 1,
			Math.floor(((y - HORIZON - 1) / depth) * WATER.length)
		);
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, WATER[band]);
		}
	}
	// The hills' reflection, hanging from the sheen along the far shore and frayed by ripples at its foot.
	for (let x = 0; x < 64; x++) {
		const height = HORIZON - hillTop(x);
		for (let k = 0; k <= height; k++) {
			const y = HORIZON + 2 + k;
			if (k === height && (x + k) % 3 === 0) {
				continue;
			}
			set(layer, x, y, HILL_REFLECTION);
		}
		set(layer, x, HORIZON + 1, PINK_LIGHT);
	}
	// A few long level ripples, paler under the far shore.
	for (let i = 0; i < 12; i++) {
		const y = HORIZON + 5 + Math.floor(random() * (depth - 5));
		const x = Math.floor(random() * 58);
		const band = Math.min(2, Math.floor(((y - HORIZON - 1) / depth) * 3));
		rect(layer, x, y, 4 + Math.floor(random() * 8), 1, RIPPLE[band]);
	}
	// The moon's glitter: a column of broken streaks under it, widening towards the viewer.
	for (let y = HORIZON + 4; y < SHORE - 1; y += 2) {
		const spread = 1 + Math.round((y - HORIZON) * 0.22);
		const x = MOON_AT.x - spread + ((y >> 1) % 2);
		const n = 1 + spread + ((y * 3) % spread);
		rect(layer, x, y, n, 1, y < HORIZON + 9 ? MOON : MOON_RIM);
	}
	// The light of the pods hanging over open water, mirrored under them in broken streaks.
	for (const [px] of PODS.filter(([x]) => x < TRUNK_X - 3)) {
		for (const [dy, n] of [
			[5, 3],
			[8, 2],
			[11, 4],
			[14, 2],
		]) {
			const y = HORIZON + dy;
			const x = px - 1 + ((px + dy) % 2);
			rect(layer, x, y, n, 1, LIGHT[3]);
			set(layer, x + Math.floor(n / 2), y, dy < 9 ? LIGHT[1] : LIGHT[2]);
		}
	}
}

/**
 * The near shore: a pale wet edge along the water, then dark moss with tufts, under the tree and the grazer.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawShore(layer, random) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(SHORE + Math.sin(x * 0.2) * 1.2);
		set(layer, x, top - 1, PINK_LIGHT);
		set(layer, x, top, SHORE_EDGE);
		for (let y = top + 1; y < 64; y++) {
			const dark = y > 58 || random() < 0.12 + (y - SHORE) * 0.03;
			set(layer, x, y, dark ? MOSS_DARK : MOSS);
		}
	}
	for (let i = 0; i < 16; i++) {
		const x = Math.floor(random() * 63);
		const y = SHORE + 3 + Math.floor(random() * 10);
		set(layer, x, y, FROND_LIT);
		set(layer, x + 1, y - 1, FROND_LIT);
	}
}

/**
 * The trunk: a dark plum bole leaning a little, flared into roots, with a glowing vein twisting up it.
 * @param {Canvas} fg
 */
function drawTrunk(fg) {
	// The roots, spreading over the moss.
	for (const [x0, y0, x1, y1] of [
		[TRUNK_X - 2, GROUND - 3, TRUNK_X - 3, GROUND + 1],
		[TRUNK_X + 2, GROUND - 3, TRUNK_X + 6, GROUND + 1],
		[TRUNK_X, GROUND - 1, TRUNK_X + 1, GROUND + 2],
	]) {
		line(fg, x0, y0, x1, y1, BARK);
		line(fg, x0 + 1, y0, x1 + 1, y1, x1 > x0 ? BARK_LIT : BARK_DARK);
	}
	for (let y = CROWN.y; y <= GROUND; y++) {
		const flare = y > GROUND - 4 ? Math.round((y - GROUND + 4) * 0.6) : 0;
		const half = (y < CROWN.y + 13 ? 1.5 : 2.5) + flare;
		const middle = TRUNK_X + Math.sin((y - CROWN.y) * 0.13) * 1.6;
		const left = Math.round(middle - half);
		const right = Math.round(middle + half);
		for (let x = left; x <= right; x++) {
			let colour = BARK;
			if (x === right) {
				colour = BARK_LIT;
			} else if (x === left) {
				colour = BARK_DARK;
			}
			const vein = Math.round(middle + Math.sin(y * 0.55) * (half - 0.6));
			if (x === vein && x !== left && x !== right) {
				colour = VEIN;
			}
			set(fg, x, y, colour);
		}
	}
	// The crown's knot.
	rect(fg, CROWN.x - 2, CROWN.y - 1, 4, 2, BARK);
}

/**
 * The fronds: long leaves arching up from the crown and drooping to their tips, lit along the spine,
 * their leaflets hanging in a ragged fringe beneath.
 * @param {Canvas} fg
 */
function drawFronds(fg) {
	for (const [tx, ty, arch] of FRONDS) {
		const length = Math.hypot(tx - CROWN.x, ty - CROWN.y);
		const steps = Math.ceil(length * 1.6);
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = Math.round(CROWN.x + (tx - CROWN.x) * t);
			const y = Math.round(
				CROWN.y + (ty - CROWN.y) * t - arch * 4 * t * (1 - t)
			);
			// Leaflets: longest midway along the frond, every other one short, so the sky shows between them.
			const long = (x + y) % 2 === 0;
			const n = Math.round(
				(long ? 1.5 : 0.6) + (long ? 3.4 : 1.2) * Math.sin(t * Math.PI)
			);
			for (let k = 1; k <= n; k++) {
				set(fg, x, y + k, k >= n - 1 ? FROND_DARK : FROND);
			}
			set(fg, x, y, FROND_LIT);
		}
	}
	// Bright tips where each frond's spine catches the sky.
	for (const [tx, ty] of FRONDS) {
		set(fg, tx, ty, C.teal);
	}
}

/**
 * The fruit pods: glowing teardrops hanging on thin stalks.
 * @param {Canvas} fg
 */
function drawPods(fg) {
	for (const [x, stalk, top] of PODS) {
		line(fg, x, stalk, x, top - 1, FROND_DARK);
		rect(fg, x - 1, top + 1, 3, 3, LIGHT[2]);
		set(fg, x, top, LIGHT[1]);
		set(fg, x, top + 1, LIGHT[0]);
		set(fg, x - 1, top + 1, LIGHT[1]);
		set(fg, x, top + 2, LIGHT[1]);
		rect(fg, x - 1, top + 3, 3, 1, LIGHT[3]);
		set(fg, x, top + 4, LIGHT[3]);
	}
}

/**
 * One of the grazer's legs: a thigh down to a knobbly knee, a shank down to the ankle, and a splayed three-toed foot.
 * The front legs' knees bend forward, the hind legs' hocks bend back.
 * @param {Canvas} fg
 * @param {number} x - The hip's column
 * @param {{ near: boolean, hind: boolean }} leg
 */
function drawLeg(fg, x, { near, hind }) {
	const hip = GROUND - 11;
	const knee = { x: x + (hind ? 1 : -1), y: GROUND - 6 };
	const ankle = GROUND - 2;
	const back = near ? HIDE.shade : HIDE.dark;
	const front = near ? HIDE.base : HIDE.shade;
	for (const [x0, y0, x1, y1] of [
		[x, hip, knee.x, knee.y],
		[knee.x, knee.y, x, ankle],
	]) {
		line(fg, x0, y0, x1, y1, back);
		line(fg, x0 + 1, y0, x1 + 1, y1, front);
	}
	// The knee's knob, catching the light.
	rect(fg, knee.x, knee.y - 1, 2, 2, front);
	set(fg, knee.x + (hind ? 1 : 0), knee.y - 1, near ? HIDE.lit : HIDE.base);
	// The foot, its three toes spread on the moss.
	paint(fg, x - 1, ankle + 1, ['.fff.', 'f.f.f'], { f: FOOT });
}

/**
 * The grazer: a long-necked beast on four jointed legs, its neck stretched up to the pod at column 29,
 * a fan crest on its small head and glowing spots down its back.
 * @param {Canvas} fg
 */
function drawGrazer(fg) {
	// The far legs, behind the body.
	drawLeg(fg, 37, { near: false, hind: false });
	drawLeg(fg, 46, { near: false, hind: true });

	// The tail, hanging short.
	line(fg, 51, 40, 52, 45, HIDE.shade);
	line(fg, 52, 40, 53, 45, HIDE.dark);

	// The body, with the rounded haunch and shoulder shaded over it.
	ellipse(fg, 42, 41, 9.5, 5, hideColour);
	ellipse(fg, 47.5, 42, 3.6, 3.4, hideColour);
	ellipse(fg, 36, 42.5, 3, 3, hideColour);
	// The pale belly under the body.
	line(fg, 37, 45, 46, 45, HIDE.base);

	// The near legs, in front of the body.
	drawLeg(fg, 34, { near: true, hind: false });
	drawLeg(fg, 43, { near: true, hind: true });

	// The neck, rising from the chest and leaning a little left up to the head.
	for (let i = 0; i <= 20; i++) {
		const t = i / 20;
		const x = 36 - 1.5 * t - 2 * Math.sin(t * Math.PI);
		const y = 40 - 16 * t;
		const r = 2.6 - 1 * t;
		ellipse(fg, x, y, r, r, (nx) => {
			if (nx > 0.35) {
				return HIDE.lit;
			}
			return nx < -0.4 ? HIDE.shade : HIDE.base;
		});
	}

	// The head, its snout up against the pod, with a fan crest lit at its tips.
	ellipse(fg, 33, 22.5, 3.2, 2.2, hideColour);
	rect(fg, 29, 21, 2, 2, HIDE.base);
	set(fg, 29, 21, HIDE.lit);
	set(fg, 31, 23, HIDE.shade);
	set(fg, 33, 22, C.ink);
	for (const [x0, y0, x1, y1] of [
		[34, 20, 35, 16],
		[35, 21, 38, 18],
		[35, 22, 39, 21],
	]) {
		line(fg, x0, y0, x1, y1, HIDE.lit);
		set(fg, x1, y1, LIGHT[1]);
	}

	// The glowing spots along the back and neck.
	for (const [x, y] of [
		[37, 37],
		[41, 36],
		[45, 37],
		[49, 38],
		[34, 31],
		[33, 26],
	]) {
		set(fg, x, y, LIGHT[1]);
		set(fg, x + 1, y, LIGHT[2]);
	}
}

/**
 * Two ripe pods fallen into the moss under the tree.
 * @param {Canvas} fg
 */
function drawFallen(fg) {
	for (const [x, y] of [
		[26, GROUND],
		[29, GROUND + 3],
	]) {
		rect(fg, x, y, 3, 2, LIGHT[2]);
		set(fg, x, y, LIGHT[1]);
		rect(fg, x, y + 2, 3, 1, LIGHT[3]);
	}
}

/**
 * Glowing spores drifting in the dusk air and lights in the moss.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawSpores(canvas, random) {
	for (let i = 0; i < 9; i++) {
		const x = 10 + Math.floor(random() * 44);
		const y = 24 + Math.floor(random() * 32);
		set(canvas, x, y, random() > 0.5 ? LIGHT[1] : LIGHT[2]);
	}
}
