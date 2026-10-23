// Art Deco: a polished gold statuette of a leaping gazelle on a stepped black marble plinth, before a black lacquer screen inlaid with a gold sunburst fan and chevrons, at night.
import {
	createCanvas,
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** A point on the gazelle, before it is moved into place. */
/** @typedef {[number, number]} Point */

/** The picture's middle: everything but the gazelle is mirrored about it. */
const MID = 31.5;

/** The screen's gold hinge strips, two pixels wide, between its three panels. */
const HINGES = [13, 49];

/** The gold frieze of chevrons along the top of the screen: its first row and its height. */
const FRIEZE = { top: 1, height: 5 };

/** The plinth's three steps, from the top down: half their width and their first and last rows. */
const STEPS = [
	{ half: 11, top: 42, bottom: 45 },
	{ half: 15, top: 46, bottom: 50 },
	{ half: 20, top: 51, bottom: 57 },
];

/** The floor's first row. */
const FLOOR = 58;

/** The sunburst's centre, rising from behind the plinth, the sun's radius, how many gaps part its rays, and where the rays begin. */
const SUN = { x: MID, y: 42, r: 8, rays: 14, start: 13 };

/** The lamp off the top-left corner, and the middle of the statuette's warm halo. */
const LAMP = { x: -4, y: -4 };
const HALO = { x: 28, y: 26 };

/** The black lacquer: its deep black, a soft sheen, and the gloss streaks where the lamp catches it. */
const LACQUER = mix(C.ink, C.night, 0.45);
const LACQUER_SHEEN = mix(C.night, C.roofShade, 0.55);
const LACQUER_GLOSS = mix(C.roofShade, C.roof, 0.6);

/** The inlaid gold, dimmer than the statuette so the gazelle stands out against it. */
const INLAY = mix(C.amber, C.lampFrame, 0.25);
const INLAY_LIGHT = mix(C.brass, C.amber, 0.35);
const INLAY_DARK = mix(C.lampFrame, C.night, 0.35);

/** The black marble: its lit top faces, its body, its shaded end and its pale veins. */
const MARBLE_TOP = mix(C.stoneShade, C.night, 0.35);
const MARBLE = mix(C.night, C.roofShade, 0.3);
const MARBLE_DARK = mix(C.ink, C.night, 0.3);
const MARBLE_VEIN = mix(C.stoneShade, C.night, 0.05);
const MARBLE_VEIN_LIGHT = C.stoneMid;
const MARBLE_LIGHT = mix(C.stoneShade, C.roofShade, 0.4);

/** The polished floor, and the plinth and its gold mirrored in it. */
const FLOOR_BLACK = mix(C.ink, C.night, 0.2);
const FLOOR_SHINE = mix(C.night, C.roofShade, 0.45);
const FLOOR_GOLD = mix(C.amber, C.night, 0.55);

/** The statuette's polished gold, from its brightest rim to its shaded underside, and its far limbs. */
const GOLD = {
	gleam: C.white,
	lit: C.lampGlow,
	base: C.gold,
	half: C.brass,
	shade: C.amber,
	deep: C.lampFrame,
};

/** Mask values: an empty pixel, a far limb or horn, and the near body. */
const EMPTY = 0;
const FAR = 1;
const NEAR = 2;

/** Where the gazelle's own drawing is moved to on the canvas. */
const GAZELLE = { x: 0, y: 3 };

/**
 * Draws the Art Deco masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1925);

	drawLacquer(layer);
	drawSunburst(layer);
	drawChevrons(layer);
	drawFrieze(layer);
	drawHinges(layer);
	drawFloor(layer);

	drawPlinth(scene, random);
	drawGazelle(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	// The gold throws a warm halo on the lacquer behind it, and the lamp catches the screen's upper left.
	glow(scene, {
		x: HALO.x,
		y: HALO.y,
		radius: 30,
		colour: C.gold,
		strength: 0.14,
		steps: 2,
		skip: [C.ink, ...Object.values(GOLD)],
	});
	glow(scene, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 46,
		colour: C.lampGlow,
		strength: 0.16,
		steps: 4,
		skip: [C.ink, ...Object.values(GOLD)],
	});
	drawGleams(scene);
	return scene;
}

/**
 * How far a column lies from the picture's middle, so the setting can be mirrored.
 * @param {number} x
 * @returns {number}
 */
function fromMid(x) {
	return Math.abs(x - MID);
}

/**
 * The lacquer: deep black with a sheen towards the lamp, and long diagonal gloss streaks on each panel.
 * @param {Canvas} layer
 */
function drawLacquer(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = LACQUER;
			const band = (x + y) % 23;
			if (band === 4 && x + y < 70) {
				colour = LACQUER_GLOSS;
			} else if (
				(band >= 3 && band <= 6) ||
				(x + y < 22 && (x + y) % 2 === 0)
			) {
				colour = LACQUER_SHEEN;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The sunburst on the middle panel: a gold half sun of rings rising from behind the plinth, a dark gap and a gold ring,
 * then rays fanning out to the frieze, each widening as it goes.
 * @param {Canvas} layer
 */
function drawSunburst(layer) {
	const [left, right] = HINGES;
	const step = Math.PI / SUN.rays;
	for (let y = FRIEZE.top + FRIEZE.height + 1; y < SUN.y; y++) {
		for (let x = left + 2; x < right; x++) {
			const dx = x - SUN.x;
			const dy = y - SUN.y;
			const d = Math.hypot(dx, dy);
			const lit = dx < 0;
			if (d <= SUN.r) {
				const ring = Math.round(d) % 3 === 2;
				set(layer, x, y, ring ? INLAY_DARK : lit ? INLAY_LIGHT : INLAY);
				continue;
			}
			if (d <= SUN.r + 1.6) {
				continue;
			}
			if (d <= SUN.r + 2.6) {
				set(layer, x, y, lit ? INLAY_LIGHT : INLAY);
				continue;
			}
			// The angle from the horizon, measured the same way on both sides so the fan is mirrored.
			const angle = Math.atan2(-dy, Math.abs(dx));
			const index = Math.round(angle / step);
			const across = Math.abs(angle - index * step) * d;
			const width = 0.5 + d * 0.022;
			if (across < width && d > SUN.start) {
				set(layer, x, y, lit ? INLAY_LIGHT : INLAY);
			}
		}
	}
}

/**
 * The side panels' inlay: a column of nested gold chevrons pointing down each panel, mirrored.
 * @param {Canvas} layer
 */
function drawChevrons(layer) {
	const centre = 6.5;
	for (let y = FRIEZE.top + FRIEZE.height + 3; y < FLOOR - 3; y++) {
		for (let x = 0; x < HINGES[0]; x++) {
			const across = Math.abs(x - centre);
			const phase = (y - Math.floor(across) + 64) % 7;
			let colour = null;
			if (across < 5.5) {
				if (phase === 0) {
					colour = INLAY_LIGHT;
				} else if (phase === 1) {
					colour = INLAY_DARK;
				}
			}
			if (colour) {
				set(layer, x, y, colour);
				set(
					layer,
					63 - x,
					y,
					colour === INLAY_LIGHT ? INLAY : INLAY_DARK
				);
			}
		}
	}
	// A gold border line down each side panel.
	for (let y = FRIEZE.top + FRIEZE.height + 1; y < FLOOR - 1; y++) {
		set(layer, 0, y, INLAY_DARK);
		set(layer, 63, y, INLAY_DARK);
	}
}

/**
 * The frieze along the top: a band of gold zigzag between two gold rules.
 * @param {Canvas} layer
 */
function drawFrieze(layer) {
	const { top, height } = FRIEZE;
	for (let x = 0; x < 64; x++) {
		set(layer, x, top - 1, LACQUER);
		set(layer, x, top, INLAY_LIGHT);
		set(layer, x, top + height, INLAY);
		const zig = Math.abs(((Math.round(fromMid(x)) + 2) % 6) - 3);
		set(layer, x, top + 1 + zig, x < MID ? INLAY_LIGHT : INLAY);
		if (zig < 3) {
			set(layer, x, top + 2 + zig, INLAY_DARK);
		}
	}
}

/**
 * The hinge strips between the panels: a gold edge lit on its left, shaded on its right.
 * @param {Canvas} layer
 */
function drawHinges(layer) {
	for (const x of HINGES) {
		for (let y = FRIEZE.top + FRIEZE.height + 1; y < FLOOR; y++) {
			set(layer, x, y, x < MID ? INLAY_LIGHT : INLAY);
			set(layer, x + 1, y, INLAY_DARK);
		}
	}
}

/**
 * The polished black floor, with the plinth's base and its gold edge mirrored in it.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = FLOOR_BLACK;
			const under = fromMid(x) < STEPS[2].half;
			if (under) {
				colour = y === FLOOR + 1 ? FLOOR_GOLD : FLOOR_SHINE;
				if (y > FLOOR + 3 && (x + y) % 2 === 0) {
					colour = FLOOR_BLACK;
				}
			} else if (y === FLOOR) {
				colour = FLOOR_SHINE;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The plinth: three steps of black marble, each with a lit top face, a gold rule under it, pale veins, and a shaded right end.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPlinth(scene, random) {
	for (const { half, top, bottom } of STEPS) {
		const left = Math.round(MID - half + 0.5);
		const right = Math.round(MID + half - 0.5);
		for (let y = top; y <= bottom; y++) {
			for (let x = left; x <= right; x++) {
				let colour = MARBLE;
				if (y === top) {
					colour = MARBLE_TOP;
				} else if (y === top + 1) {
					colour = x < MID ? C.gold : C.brass;
				} else if (x >= right - 1 || y === bottom) {
					colour = MARBLE_DARK;
				}
				set(scene, x, y, colour);
			}
		}
		// The veins: faint runs slanting down across the step's face, and a few pale flecks.
		const count = Math.round(half / 5);
		for (let i = 0; i < count; i++) {
			let x = left + 2 + Math.floor(random() * (right - left - 4));
			for (let y = top + 2; y < bottom; y++) {
				set(scene, x, y, MARBLE_VEIN);
				set(scene, x + 1, y, MARBLE_VEIN);
				x += 2;
				if (x >= right - 2) {
					break;
				}
			}
		}
		for (let i = 0; i < count; i++) {
			const x = left + 2 + Math.floor(random() * (right - left - 4));
			const y =
				top + 2 + Math.floor(random() * Math.max(1, bottom - top - 2));
			set(scene, x, y, MARBLE_VEIN_LIGHT);
		}
		// The face's lit left end, towards the lamp.
		for (let y = top + 2; y < bottom; y++) {
			set(scene, left, y, MARBLE_LIGHT);
		}
	}
}

/**
 * Marks a filled ellipse on the gazelle's mask.
 * @param {Uint8Array} mask
 * @param {number} value - FAR or NEAR
 * @param {Point} centre
 * @param {number} a - Half its length along its axis
 * @param {number} b - Half its width across it
 * @param {number} [angle=0] - How far its axis is turned, in radians
 */
function fillEllipse(mask, value, [cx, cy], a, b, angle = 0) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const reach = Math.ceil(Math.max(a, b)) + 1;
	for (let y = Math.floor(cy) - reach; y <= Math.ceil(cy) + reach; y++) {
		for (let x = Math.floor(cx) - reach; x <= Math.ceil(cx) + reach; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const u = dx * cos + dy * sin;
			const v = -dx * sin + dy * cos;
			if ((u / a) ** 2 + (v / b) ** 2 <= 1) {
				mark(mask, value, x, y);
			}
		}
	}
}

/**
 * Marks a stroke along a line of points on the gazelle's mask, tapering from one width to another.
 * @param {Uint8Array} mask
 * @param {number} value - FAR or NEAR
 * @param {readonly Point[]} points
 * @param {number} from - Its width at the first point
 * @param {number} to - Its width at the last point
 */
function fillStroke(mask, value, points, from, to) {
	const lengths = points
		.slice(1)
		.map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
	const total = lengths.reduce((sum, length) => sum + length, 0);
	let done = 0;
	for (let i = 0; i < lengths.length; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		for (let s = 0; s <= lengths[i]; s += 0.25) {
			const t = s / lengths[i];
			const width = from + (to - from) * ((done + s) / total);
			fillEllipse(
				mask,
				value,
				[x0 + (x1 - x0) * t, y0 + (y1 - y0) * t],
				width / 2,
				width / 2
			);
		}
		done += lengths[i];
	}
}

/**
 * Sets one pixel of the mask, moved into place; the near body always wins over a far limb.
 * @param {Uint8Array} mask
 * @param {number} value
 * @param {number} x
 * @param {number} y
 */
function mark(mask, value, x, y) {
	const px = Math.round(x + GAZELLE.x);
	const py = Math.round(y + GAZELLE.y);
	if (px < 0 || py < 0 || px >= 64 || py >= 64) {
		return;
	}
	mask[py * 64 + px] = Math.max(mask[py * 64 + px], value);
}

/**
 * Builds the gazelle's silhouette: body, chest and haunch, neck and head, lyre horns, ear, tail,
 * the near legs over the far ones, front legs reaching forward and hind legs pushing off the plinth.
 * @returns {Uint8Array} One value per pixel: EMPTY, FAR or NEAR.
 */
function gazelleMask() {
	const mask = new Uint8Array(64 * 64);
	// The far legs and horn, behind the body.
	fillStroke(
		mask,
		FAR,
		[
			[21, 26],
			[15, 31],
			[10, 34],
		],
		2.4,
		1.2
	);
	fillStroke(
		mask,
		FAR,
		[
			[34, 29],
			[37, 34],
			[34, 38],
		],
		2.6,
		1.4
	);
	fillStroke(
		mask,
		FAR,
		[
			[14, 6],
			[15, 2],
			[18, -1],
			[22, -2],
			[25, -1],
		],
		2,
		1
	);
	// The body.
	fillEllipse(mask, NEAR, [28, 24], 11, 4.2, 0.29);
	fillEllipse(mask, NEAR, [19.5, 21], 4.2, 4.2);
	fillEllipse(mask, NEAR, [36, 25], 5, 4.6, 0.3);
	fillStroke(
		mask,
		NEAR,
		[
			[19, 19],
			[15, 13],
			[13, 9],
		],
		5,
		3.2
	);
	fillEllipse(mask, NEAR, [11, 8], 3.4, 2.1, -0.5);
	fillStroke(
		mask,
		NEAR,
		[
			[12, 6],
			[12, 2],
			[15, -1],
			[19, -2],
			[22, -1],
		],
		2.2,
		1
	);
	fillStroke(
		mask,
		NEAR,
		[
			[14, 7],
			[17, 5],
		],
		1.6,
		1
	);
	fillStroke(
		mask,
		NEAR,
		[
			[40, 22],
			[43, 20],
		],
		2.2,
		1
	);
	// The near legs.
	fillStroke(
		mask,
		NEAR,
		[
			[19, 24],
			[12, 26],
			[6, 25],
		],
		2.4,
		1.2
	);
	fillStroke(
		mask,
		NEAR,
		[
			[38, 28],
			[43, 33],
			[42, 38],
		],
		3,
		1.6
	);
	return mask;
}

/**
 * Reads the mask, treating anything off the canvas as empty.
 * @param {Uint8Array} mask
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function maskAt(mask, x, y) {
	if (x < 0 || y < 0 || x >= 64 || y >= 64) {
		return EMPTY;
	}
	return mask[y * 64 + x];
}

/**
 * The gazelle in polished gold: each part bevelled bright on its upper left, towards the lamp, and dark on its lower right.
 * The far limbs are a tone darker, so the near ones stand out against them.
 * @param {Canvas} scene
 */
function drawGazelle(scene) {
	const mask = gazelleMask();
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const value = maskAt(mask, x, y);
			if (value === EMPTY) {
				continue;
			}
			/**
			 * Tells whether a neighbour lies off this pixel's own part.
			 * @param {number} dx
			 * @param {number} dy
			 */
			const off = (dx, dy) => maskAt(mask, x + dx, y + dy) < value;
			const litEdge = off(-1, 0) || off(0, -1);
			const darkEdge = off(1, 0) || off(0, 1);
			const nearDark = off(2, 0) || off(0, 2) || off(1, 1);
			let colour;
			if (value === NEAR) {
				colour = GOLD.base;
				if (litEdge) {
					colour = GOLD.lit;
				} else if (darkEdge) {
					colour = GOLD.shade;
				} else if (nearDark) {
					colour = GOLD.half;
				}
			} else {
				colour = litEdge
					? GOLD.half
					: darkEdge
						? GOLD.deep
						: GOLD.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The lamp's brightest gleams on the gold: the back, the haunch, the shoulder and a horn tip.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[24, 21],
		[25, 21],
		[33, 23],
		[34, 23],
		[18, 18],
		[12, 3],
		[9, 7],
		[MID - 9.5, STEPS[0].top + 1],
	]) {
		set(
			scene,
			Math.round(x + (y < STEPS[0].top ? GAZELLE.x : 0)),
			Math.round(y + (y < STEPS[0].top ? GAZELLE.y : 0)),
			GOLD.gleam
		);
	}
	line(scene, 2, FRIEZE.top, 6, FRIEZE.top, C.lampGlow);
}
