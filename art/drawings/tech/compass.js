// Compass: a ship's brass binnacle close up on a sunlit deck, its compass rose under glass, red and green side lamps, the ship's wheel and the blue sea behind.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The binnacle's centre column, and the rows where its hood's dome meets its drum and the drum meets the collar. */
const BIN = { x: 33, top: 10, dome: 26, collar: 40, halfWidth: 17 };

/** The glass window in the hood, and the compass card seen through it. */
const WINDOW = { x: 33, y: 29, rx: 13, ry: 10 };
const CARD = { x: 33, y: 30, rx: 11.5, ry: 8.5 };

/** The ship's wheel behind, off to the right. */
const HELM = { x: 55, y: 17, r: 12 };

/** The deck starts at this row; the rail runs across the sea above it. */
const DECK = 48;
const RAIL = 37;

/** The deck's teak boards, the caulking between them and the binnacle's shadow on them. */
const PLANK = mix(C.timberLight, C.sand, 0.35);
const PLANK_SHADE = mix(C.timberLight, C.timber, 0.4);
const CAULK = mix(C.timber, C.wood, 0.5);
const DECK_SHADOW = mix(C.timber, C.timberShade, 0.5);

/** The dark bowl inside the hood, between the glass rim and the card. */
const BOWL = mix(C.lampFrame, C.wood, 0.5);

/**
 * Draws the Compass tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const helm = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2417);

	drawSky(layer, { time: 'day', horizon: 26, random });
	drawSea(layer, { time: 'day', top: 27, random, waves: 40 });
	drawRail(layer);
	drawDeck(layer, random);

	// The wheel stands between the sea and the binnacle, outlined on its own so the hood still parts from it.
	drawHelm(helm);
	outline(helm, C.ink);
	underlay(helm, layer);

	drawLamp(scene, 8, C.brickRed, C.brickRedLight, C.brickRedShade);
	drawLamp(scene, 59, C.grass, C.grassLight, C.grassShade);
	drawPedestal(scene);
	drawHood(scene);
	drawCollar(scene);
	drawWindow(scene);
	drawRose(scene);
	outline(scene, C.ink);
	underlay(scene, helm);

	glow(scene, {
		x: 0,
		y: 0,
		radius: 44,
		colour: C.lampGlow,
		strength: 0.22,
		steps: 3,
		skip: [C.ink],
	});
	drawGlints(scene);
	return scene;
}

/**
 * The ship's rail across the sea: a capped top rail on posts down to the deck.
 * @param {Canvas} layer
 */
function drawRail(layer) {
	rect(layer, 0, RAIL, 64, 1, C.timberLight);
	rect(layer, 0, RAIL + 1, 64, 2, C.timber);
	rect(layer, 0, RAIL + 3, 64, 1, C.timberShade);
	for (let x = 3; x < 64; x += 9) {
		rect(layer, x, RAIL + 4, 2, DECK - RAIL - 4, C.timber);
		set(layer, x, RAIL + 4, C.timberShade);
		rect(layer, x + 2, RAIL + 4, 1, DECK - RAIL - 4, C.timberShade);
	}
	// The waterway along the deck's edge.
	rect(layer, 0, DECK - 2, 64, 2, C.timberShade);
}

/**
 * The deck: teak boards running along the ship, wider as they come closer, with staggered butt joints and the binnacle's shadow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawDeck(layer, random) {
	const seams = [DECK, DECK + 2, DECK + 5, DECK + 9, DECK + 14];
	for (let y = DECK; y < 64; y++) {
		const seam = seams.includes(y);
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, seam ? CAULK : PLANK);
		}
	}
	// Each board's lit upper edge and a joint or two where one board ends and the next begins.
	for (let i = 0; i < seams.length; i++) {
		const top = seams[i] + 1;
		const bottom = i + 1 < seams.length ? seams[i + 1] : 64;
		if (bottom - top > 2) {
			rect(layer, 0, bottom - 1, 64, 1, PLANK_SHADE);
		}
		const joint = 4 + Math.floor(random() * 20) + i * 7;
		for (let x = joint % 64; x < 64; x += 26) {
			for (let y = top; y < bottom; y++) {
				set(layer, x, y, CAULK);
			}
		}
	}
	// The binnacle's shadow, thrown down and to the right, away from the sun.
	for (let y = 55; y < 64; y++) {
		for (let x = 30; x < 64; x++) {
			const e = ((x - 46) / 16) ** 2 + ((y - 62) / 6) ** 2;
			if (e < 1) {
				set(
					layer,
					x,
					y,
					get(layer, x, y) === CAULK ? C.wood : DECK_SHADOW
				);
			}
		}
	}
}

/**
 * The ship's wheel: a timber rim on eight spokes that run out past it into turned handles, round a brass hub.
 * @param {Canvas} helm
 */
function drawHelm(helm) {
	const { x: cx, y: cy, r } = HELM;
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		line(
			helm,
			cx,
			cy,
			cx + Math.round(cos * (r + 3)),
			cy + Math.round(sin * (r + 3)),
			C.timber
		);
		// The handle: a thicker knob at the spoke's end.
		for (let t = r + 2.5; t <= r + 5.5; t += 0.5) {
			const hx = Math.round(cx + cos * t);
			const hy = Math.round(cy + sin * t);
			set(helm, hx, hy, C.timberLight);
			set(helm, hx + 1, hy, C.timber);
		}
	}
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d <= r + 0.5 && d > r - 2) {
				const lit = x - cx - (y - cy) < -4;
				set(helm, x, y, lit ? C.timberLight : C.timber);
			}
		}
	}
	for (let y = cy - 2; y <= cy + 2; y++) {
		for (let x = cx - 2; x <= cx + 2; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d < 2.6) {
				set(helm, x, y, d < 1.2 ? C.gold : C.brass);
			}
		}
	}
}

/**
 * Picks a brass tone for a point on the hood by how much it faces the sun, which stands to the left.
 * @param {number} facing - From -1 (turned away) to 1 (facing the sun)
 * @returns {Colour}
 */
function brassTone(facing) {
	if (facing > 0.72) {
		return C.lampGlow;
	}
	if (facing > 0.3) {
		return C.gold;
	}
	if (facing > -0.25) {
		return C.brass;
	}
	if (facing > -0.7) {
		return C.amber;
	}
	return C.lampFrame;
}

/**
 * The brass hood: a dome on a drum, shaded as a round body lit from the left, with a vent on top.
 * @param {Canvas} scene
 */
function drawHood(scene) {
	const { x: cx, top, dome, collar, halfWidth } = BIN;
	for (let y = top; y < collar; y++) {
		const rise = y < dome ? (dome - y) / (dome - top) : 0;
		const half = halfWidth * Math.sqrt(1 - rise * rise);
		for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
			const across = (x - cx) / (half || 1);
			// Facing the sun: the left of the body, and a little more on the dome's upper slope.
			const facing = -across * 0.95 + 0.08 + (rise > 0.45 ? 0.2 : 0);
			set(scene, x, y, brassTone(facing));
		}
	}
	// A seam where the dome meets the drum, and a beaded band near the drum's foot.
	for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
		const across = (x - cx) / halfWidth;
		set(scene, x, dome, across > 0.35 ? C.lampFrame : C.amber);
		if ((x - cx) % 3 === 0) {
			set(scene, x, collar - 2, across < -0.2 ? C.lampGlow : C.gold);
		}
	}
	// The vent on top: a short neck and a round cap.
	rect(scene, cx - 2, top - 3, 5, 3, C.brass);
	set(scene, cx - 1, top - 3, C.gold);
	set(scene, cx - 1, top - 2, C.gold);
	set(scene, cx + 2, top - 2, C.amber);
	for (let y = top - 7; y <= top - 3; y++) {
		for (let x = cx - 3; x <= cx + 3; x++) {
			const d = Math.hypot(x - cx, (y - (top - 5)) * 1.3);
			if (d < 3.4) {
				const facing = -(x - cx) / 3 - (y - (top - 5)) / 3;
				set(scene, x, y, brassTone(facing * 0.8 + 0.1));
			}
		}
	}
}

/**
 * The flange under the hood, wider than the drum, with its rivets.
 * @param {Canvas} scene
 */
function drawCollar(scene) {
	const { x: cx, collar } = BIN;
	const half = 20;
	for (let x = cx - half; x <= cx + half; x++) {
		const facing = -(x - cx) / half;
		set(scene, x, collar, brassTone(facing * 0.9 + 0.5));
		set(scene, x, collar + 1, brassTone(facing * 0.9 + 0.1));
		set(scene, x, collar + 2, brassTone(facing * 0.9 - 0.4));
		set(scene, x, collar + 3, C.lampFrame);
	}
	for (let x = cx - half + 2; x <= cx + half - 2; x += 4) {
		set(scene, x, collar + 1, x < cx ? C.amber : C.lampFrame);
	}
}

/**
 * The teak pedestal under the binnacle: a column with a brass band, flaring into its foot on the deck.
 * @param {Canvas} scene
 */
function drawPedestal(scene) {
	const { x: cx, collar } = BIN;
	for (let y = collar + 4; y < 64; y++) {
		const flare = y > 56 ? (y - 56) * 1.2 : 0;
		const half = 7 - (y - collar - 4) * 0.08 + flare;
		for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
			const across = (x - cx) / half;
			let colour = C.timber;
			if (across < -0.55) {
				colour = C.timberLight;
			} else if (across > 0.45) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Grooves along the column and a brass band round it.
	for (let y = collar + 4; y < 57; y++) {
		set(scene, cx - 2, y, C.timberShade);
		set(scene, cx + 3, y, C.wood);
	}
	for (let x = cx - 7; x <= cx + 7; x++) {
		const facing = -(x - cx) / 7;
		set(scene, x, 51, brassTone(facing + 0.4));
		set(scene, x, 52, brassTone(facing - 0.2));
	}
	// The foot's brass rim on the deck.
	for (let x = cx - 10; x <= cx + 10; x++) {
		set(scene, x, 60, brassTone(-(x - cx) / 10 + 0.3));
	}
}

/**
 * One side lamp on a bracket from the hood: a brass cap, a coloured glass and a brass foot.
 * @param {Canvas} scene
 * @param {number} cx - The lamp's centre column
 * @param {Colour} glass - The glass's colour
 * @param {Colour} glassLight - Its lit side
 * @param {Colour} glassShade - Its shaded side
 */
function drawLamp(scene, cx, glass, glassLight, glassShade) {
	// The bracket from the hood's drum.
	const inner = cx < BIN.x ? BIN.x - BIN.halfWidth : BIN.x + BIN.halfWidth;
	const step = cx < BIN.x ? 1 : -1;
	for (let x = cx; x !== inner; x += step) {
		set(scene, x, 33, C.brass);
		set(scene, x, 34, C.amber);
	}
	// The cap: a little brass roof with a ring on top.
	for (let row = 0; row < 4; row++) {
		for (let x = cx - row - 1; x <= cx + row + 1; x++) {
			set(
				scene,
				x,
				20 + row,
				brassTone(-(x - cx) / 4 + 0.4 - row * 0.15)
			);
		}
	}
	set(scene, cx, 18, C.brass);
	set(scene, cx, 19, C.gold);
	// The glass, with corner posts.
	for (let y = 24; y <= 32; y++) {
		for (let x = cx - 3; x <= cx + 3; x++) {
			let colour = glass;
			if (x === cx - 3 || x === cx + 3) {
				colour = x < cx ? C.gold : C.amber;
			} else if (x === cx - 1 && y < 30) {
				colour = glassLight;
			} else if (x >= cx + 1) {
				colour = glassShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The foot.
	for (let x = cx - 4; x <= cx + 4; x++) {
		set(scene, x, 33, brassTone(-(x - cx) / 4 + 0.3));
		set(scene, x, 34, brassTone(-(x - cx) / 4 - 0.3));
	}
	rect(scene, cx - 1, 35, 3, 1, C.amber);
}

/**
 * The window in the hood: a polished rim round the dark bowl the card floats in.
 * @param {Canvas} scene
 */
function drawWindow(scene) {
	const { x: cx, y: cy, rx, ry } = WINDOW;
	for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
		for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const e = (dx / rx) ** 2 + (dy / ry) ** 2;
			if (e >= 1) {
				continue;
			}
			const inner = (dx / (rx - 1.6)) ** 2 + (dy / (ry - 1.6)) ** 2;
			if (inner >= 1) {
				// The rim: lit on its lower left, where it faces the sun and the sky.
				const facing = (-dx / rx) * 0.7 + (dy / ry) * 0.6;
				set(scene, x, y, brassTone(facing));
			} else {
				set(scene, x, y, BOWL);
			}
		}
	}
}

/**
 * The compass card: a cream disc with a ring of tick marks and an eight-point rose, its north point red. No letters.
 * @param {Canvas} scene
 */
function drawRose(scene) {
	const { x: cx, y: cy, rx, ry } = CARD;
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const u = (x - cx) / rx;
			const v = (y - cy) / ry;
			const d = Math.hypot(u, v);
			if (d >= 1) {
				continue;
			}
			// The hood shades the card's far edge.
			let colour = v < -0.55 ? C.cream : C.creamLight;
			if (d > 0.84) {
				colour = v < -0.3 ? C.creamShade : C.cream;
			}
			const point = rosePoint(u, v);
			if (point) {
				colour = point;
			}
			set(scene, x, y, colour);
		}
	}
	// Tick marks round the card's edge, every sixteenth of a turn.
	for (let i = 0; i < 16; i++) {
		const angle = (i / 16) * Math.PI * 2;
		const x = Math.round(cx + Math.cos(angle) * (rx - 0.9));
		const y = Math.round(cy + Math.sin(angle) * (ry - 0.9));
		if (get(scene, x, y) === C.creamLight || get(scene, x, y) === C.cream) {
			set(scene, x, y, C.stoneShade);
		}
	}
	set(scene, Math.round(cx), Math.round(cy), C.gold);
}

/**
 * The rose's colour at a point on the card, or null off the rose. Each point is split along its length
 * into a light and a dark half; the cardinal points are long and dark, the half-cardinal points short and gold.
 * @param {number} u - Across the card, -1 to 1
 * @param {number} v - Down the card, -1 to 1
 * @returns {Colour | null}
 */
function rosePoint(u, v) {
	// The cardinal points: two long thin diamonds.
	const upright = Math.abs(v) / 0.96 + Math.abs(u) / 0.2 <= 1;
	const level = Math.abs(u) / 0.96 + Math.abs(v) / 0.24 <= 1;
	if (upright) {
		const north = v < 0;
		const lit = u <= 0;
		if (north) {
			return lit ? C.brickRedLight : C.brickRedShade;
		}
		return lit ? C.stoneShade : C.night;
	}
	if (level) {
		const lit = u < 0 ? v >= 0 : v < 0;
		return lit ? C.stoneShade : C.night;
	}
	// The half-cardinal points: two shorter diamonds turned an eighth of a turn.
	const p = (u + v) / Math.SQRT2;
	const q = (u - v) / Math.SQRT2;
	const diagonal =
		Math.abs(p) / 0.68 + Math.abs(q) / 0.24 <= 1 ||
		Math.abs(q) / 0.68 + Math.abs(p) / 0.24 <= 1;
	if (diagonal) {
		return u < 0 ? C.gold : C.amber;
	}
	return null;
}

/**
 * The sun on the glass: a soft glare across the window's upper left, and the brightest sparks on the brass.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	const { x: cx, y: cy, rx, ry } = CARD;
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const u = (x - cx) / rx;
			const v = (y - cy) / ry;
			const band = u + v;
			if (Math.hypot(u, v) < 0.95 && band > -1.08 && band < -0.86) {
				const colour = get(scene, x, y);
				if (colour) {
					set(scene, x, y, mix(colour, C.white, 0.45));
				}
			}
		}
	}
	for (const [x, y] of [
		[24, 14],
		[23, 15],
		[22, 17],
		[18, 31],
		[6, 25],
		[6, 26],
		[57, 25],
		[30, 4],
	]) {
		set(scene, x, y, C.white);
	}
}
