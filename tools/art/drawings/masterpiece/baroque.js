// Baroque: a gilded harpsichord on carved cabriole legs, its raised lid painted with a sky of clouds, a lit three-branch candelabra on its tail in a dark damask palace room, the night outside a tall window.
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
 * Four tones of one material, from the side facing the candles to the deepest shade.
 * @typedef {[Colour, Colour, Colour, Colour]} Tones
 */

/** The marble floor starts at this row; the gilt dado rail runs along the wall above it. */
const FLOOR = 49;
const DADO = 40;

/** The raised lid: its hinge along the far side of the case, its edge high over the keyboard end and falling to the tail. */
const LID = { left: 13, right: 61, top: 6, tail: 23, hinge: 29 };

/** The case: its gilt rim, the carved side and the moulding under it, from the keyboard end to the rounded tail. */
const CASE = { left: 2, right: 61, rim: 30, bottom: 41 };

/** The keyboard at the left end: two manuals seen over the gilt cheek. */
const KEYS = { left: 3, right: 12, top: 25 };

/** The three cabriole legs seen from this side: their centre at the knee, and which way the knee swells. */
const LEGS = [
	{ x: 7, swell: -1 },
	{ x: 32, swell: -1 },
	{ x: 56, swell: 1 },
];
const LEG_TOP = 44;

/** The candelabra on the tail of the case: its stem, the row its arms spring from, and the three flames. */
const STEM = 54;
const ARMS = 17;
const FLAMES = [
	{ x: 49, y: 9 },
	{ x: 54, y: 5 },
	{ x: 59, y: 9 },
];

/** The tall round-headed window on the left, onto the night. */
const WINDOW = { x: 1, y: 3, w: 9, h: 19 };

/** Gilt, from the edge facing the candles to the deepest recess. */
const GILT = /** @type {Tones} */ ([C.lampGlow, C.gold, C.amber, C.lampFrame]);

/** The gilt of the case's side and of its sunk fields where the candlelight has faded, and the column where it fades. */
const GILT_DIM = mix(C.gold, C.amber, 0.45);
const FIELD_DIM = mix(C.amber, C.lampFrame, 0.35);
const FADE = 30;

/** The dark green damask on the walls, its woven figure, and the panelling below the dado. */
const DAMASK = mix(C.tealShade, C.night, 0.55);
const DAMASK_FIGURE = mix(C.tealShade, C.night, 0.3);
const PANEL = mix(C.tealShade, C.night, 0.75);
const PANEL_LIGHT = mix(C.tealShade, C.night, 0.5);

/** Black and white marble. */
const MARBLE_LIGHT = mix(C.stoneLight, C.cream, 0.3);
const MARBLE_DARK = mix(C.night, C.roofShade, 0.5);

/** The painted sky inside the lid, deep at its edge and pale by the hinge, and its warm-lit clouds. */
const SKY = [C.daySky2, C.daySky3, C.daySky4, C.daySky5];
const CLOUD = [
	C.white,
	mix(C.cloudShade, C.duskSky6, 0.2),
	mix(C.cloudShade, C.daySky4, 0.5),
];

/** The lid's outer lacquer, seen along its edge. */
const LACQUER = mix(C.night, C.wood, 0.5);

/** Candle wax, lit and shaded. */
const WAX = [C.creamLight, C.creamShade];

/** The colours the candlelight leaves alone: the gilt and the wax are lit by hand, the painted sky keeps its blue, the outline stays dark. */
const KEEP = [
	...GILT,
	GILT_DIM,
	FIELD_DIM,
	...WAX,
	...SKY,
	LACQUER,
	C.ink,
	C.night,
	C.cream,
];

/** The colours the room's gloom leaves alone: the outline and the moonlit window. */
const MOONLIT = [
	C.ink,
	C.nightSky2,
	C.nightSky3,
	C.nightSky4,
	C.nightSky5,
	C.starDim,
	C.moon,
	C.moonRim,
];

/** How far from the candles the gloom begins to fall, and where it deepens. */
const GLOOM = [34, 48];

/**
 * Draws the Baroque masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(1685);

	drawWall(layer);
	drawWindow(layer, random);
	drawFloor(layer);
	dim(layer);

	const lid = createCanvas(64, 64);
	drawLid(lid);
	outline(lid, C.ink);
	underlay(lid, layer);

	const scene = createCanvas(64, 64);
	drawLegs(scene);
	drawCase(scene);
	drawKeys(scene);
	drawStick(scene);
	outline(scene, C.ink);
	underlay(scene, lid);

	// The candelabra stands in front of the lid, outlined on its own so its arms part from the painted sky.
	const candelabra = createCanvas(64, 64);
	drawCandelabra(candelabra);
	outline(candelabra, C.ink);
	underlay(candelabra, scene);

	drawReflections(candelabra);
	glow(candelabra, {
		x: FLAMES[1].x,
		y: FLAMES[1].y + 4,
		radius: 30,
		colour: C.gold,
		strength: 0.4,
		steps: 3,
		skip: KEEP,
	});
	drawFlames(candelabra);
	drawGlints(candelabra);
	return candelabra;
}

/**
 * The room's gloom: the walls and the floor darken in two steps away from the candles, except the window's moonlit sky.
 * @param {Canvas} canvas
 */
function dim(canvas) {
	const { x: fx, y: fy } = FLAMES[1];
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			const colour = canvas.p[y * canvas.w + x];
			const d = Math.hypot(x - fx, y - fy);
			if (!colour || MOONLIT.includes(colour) || d < GLOOM[0]) {
				continue;
			}
			canvas.p[y * canvas.w + x] = mix(
				colour,
				C.night,
				d < GLOOM[1] ? 0.16 : 0.32
			);
		}
	}
}

/**
 * The gilt legs mirrored faintly in the polished marble under their feet.
 * @param {Canvas} canvas
 */
function drawReflections(canvas) {
	const foot = LEG_TOP + 12;
	for (const { x: cx, swell } of LEGS) {
		for (let j = 1; j <= 4; j++) {
			for (const dx of [0, 1]) {
				const x = cx + swell + dx;
				const y = foot + 1 + j;
				const colour = get(canvas, x, y);
				if (colour && colour !== C.ink) {
					set(canvas, x, y, mix(colour, C.gold, j < 3 ? 0.35 : 0.18));
				}
			}
		}
	}
}

/**
 * The wall: green damask with its figure, a gilt cornice at the top, and dark panelling under a gilt dado rail.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = DAMASK;
			if (y < DADO) {
				// The figure: a lattice of small diamonds with a bud in each.
				const u = (x + (Math.floor(y / 10) % 2) * 4) % 8;
				const v = y % 10;
				const ring = Math.abs(u - 4) + Math.abs(v - 5) * 0.8;
				if (Math.abs(ring - 3.4) < 0.5 || (u === 4 && v === 5)) {
					colour = DAMASK_FIGURE;
				}
			} else {
				// Panelling: sunk fields between stiles.
				const field = x % 12 > 1 && y > DADO + 2 && y < FLOOR - 2;
				colour = field ? PANEL : PANEL_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	for (let x = 0; x < 64; x++) {
		set(layer, x, 0, GILT[2]);
		set(layer, x, DADO, GILT[1]);
		set(layer, x, DADO + 1, GILT[3]);
		set(layer, x, FLOOR - 1, C.night);
	}
}

/**
 * The tall round-headed window: the night sky with a few stars and a full moon, in a gilt frame with glazing bars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindow(layer, random) {
	const { x, y, w, h } = WINDOW;
	const ramp = [C.nightSky2, C.nightSky3, C.nightSky4, C.nightSky5];
	const cx = x + (w - 1) / 2;
	const r = (w - 1) / 2;
	for (let j = -1; j <= h; j++) {
		for (let i = -1; i <= w; i++) {
			const px = x + i;
			const py = y + j;
			const arch =
				py < y + r
					? Math.hypot(px - cx, py - (y + r))
					: Math.abs(px - cx);
			if (arch > r + 1 || j > h) {
				continue;
			}
			if (arch > r - 0.2 || j === h) {
				set(layer, px, py, px > cx ? GILT[2] : GILT[3]);
				continue;
			}
			set(layer, px, py, ramp[Math.min(3, Math.floor((j / h) * 4))]);
		}
	}
	for (let i = 0; i < 5; i++) {
		const sx = x + 1 + Math.floor(random() * (w - 2));
		const sy = y + 6 + Math.floor(random() * (h - 8));
		set(layer, sx, sy, C.starDim);
	}
	// A round moon in the arch, its rim on the side away from the room.
	paint(layer, x + 1, y + 2, ['.mm', 'mmr', 'rr.'], {
		m: C.moon,
		r: C.moonRim,
	});
	// The glazing bars.
	for (let j = 1; j < h; j++) {
		set(layer, Math.round(cx), y + j, GILT[3]);
	}
	for (let i = 0; i < w; i++) {
		set(layer, x + i, y + 11, GILT[3]);
	}
}

/**
 * The floor: squares of black and white marble, deeper towards us.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	const rows = [
		{ top: FLOOR, h: 2, w: 6 },
		{ top: FLOOR + 2, h: 3, w: 8 },
		{ top: FLOOR + 5, h: 4, w: 10 },
		{ top: FLOOR + 9, h: 6, w: 13 },
	];
	rows.forEach(({ top, h, w }, n) => {
		const offset = n % 2 ? Math.floor(w / 2) : 0;
		for (let y = top; y < Math.min(64, top + h); y++) {
			for (let x = 0; x < 64; x++) {
				const light = Math.floor((x + offset) / w) % 2 === 0;
				set(layer, x, y, light ? MARBLE_LIGHT : MARBLE_DARK);
			}
		}
	});
}

/**
 * Where the lid's edge runs at a column: high and level over the keyboard end, sweeping down along the bentside to the tail.
 * @param {number} x
 * @returns {number}
 */
function lidTop(x) {
	const t = Math.max(0, Math.min(1, (x - 26) / (LID.right - 26)));
	const s = t * t * (3 - 2 * t);
	return Math.round(LID.top + (LID.tail - LID.top) * s);
}

/**
 * The raised lid seen from beneath: a sky of clouds painted inside a gilt moulding, its dark lacquered edge along the top.
 * @param {Canvas} lid
 */
function drawLid(lid) {
	for (let x = LID.left; x <= LID.right; x++) {
		const top = lidTop(x);
		for (let y = top; y < LID.hinge; y++) {
			const depth = (y - top) / Math.max(1, LID.hinge - top);
			let colour =
				SKY[Math.min(SKY.length - 1, Math.floor(depth * SKY.length))];
			if (y === top || x === LID.left) {
				colour = LACQUER;
			} else if (y === top + 1 || x === LID.left + 1) {
				colour = x > 40 ? GILT[0] : GILT[1];
			} else if (y === LID.hinge - 1) {
				colour = GILT[2];
			}
			set(lid, x, y, colour);
		}
	}
	// Clouds billowing across the painted sky, lit from above.
	const puffs = [
		[20, 15, 3.5],
		[25, 13, 4],
		[30, 15, 3],
		[18, 22, 3],
		[23, 24, 2.5],
		[38, 20, 3],
		[42, 18, 3.5],
		[47, 21, 2.5],
		[54, 25, 2],
		[32, 26, 2],
	];
	for (const [cx, cy, r] of puffs) {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.2);
				const here = /** @type {Colour} */ (get(lid, x, y));
				if (d > r || !SKY.includes(here)) {
					continue;
				}
				const up = (cy - (y + 0.5)) / r;
				let colour = CLOUD[1];
				if (up > 0.25) {
					colour = CLOUD[0];
				} else if (up < -0.35) {
					colour = CLOUD[2];
				}
				set(lid, x, y, colour);
			}
		}
	}
}

/**
 * The case: a gilt rim, a carved side of three panels of running scrollwork between pilasters, and a moulding under it,
 * its tail end rounded.
 * @param {Canvas} scene
 */
function drawCase(scene) {
	for (let x = CASE.left; x <= CASE.right; x++) {
		// The tail end rounds off over its last few columns.
		const fromEnd = CASE.right - x;
		const clip = fromEnd < 3 ? 3 - fromEnd : 0;
		for (let y = CASE.rim + clip; y <= CASE.bottom - clip; y++) {
			let colour = candlelit(x, y) ? GILT[1] : GILT_DIM;
			if (y === CASE.rim) {
				colour = GILT[0];
			} else if (y === CASE.rim + 1) {
				colour = GILT[2];
			} else if (y === CASE.bottom - 1) {
				colour = GILT[0];
			} else if (y === CASE.bottom) {
				colour = GILT[3];
			}
			set(scene, x, y, colour);
		}
	}
	// The panels: sunk fields, lit on their left and lower walls, which face the candles, each with a running scroll.
	const pilasters = [CASE.left + 9, 29, 45, CASE.right - 3];
	for (let p = 0; p < pilasters.length - 1; p++) {
		const left = pilasters[p] + 2;
		const right = pilasters[p + 1] - 1;
		for (let x = left; x <= right; x++) {
			for (let y = CASE.rim + 3; y <= CASE.bottom - 3; y++) {
				let colour = candlelit(x, y) ? GILT[2] : FIELD_DIM;
				if (y === CASE.rim + 3 || x === right) {
					colour = GILT[3];
				} else if (y === CASE.bottom - 3 || x === left) {
					colour = GILT[0];
				}
				set(scene, x, y, colour);
			}
		}
		const mid = (CASE.rim + CASE.bottom) / 2;
		for (let x = left + 2; x <= right - 2; x++) {
			const wave = Math.sin((x - left) * 0.78);
			const y = Math.round(mid + wave * 1.4);
			set(scene, x, y, GILT[1]);
			set(scene, x, y - 1, wave > 0.6 ? GILT[0] : GILT[2]);
			if (Math.abs(wave) > 0.92) {
				set(scene, x, y + (wave > 0 ? -2 : 2), GILT[1]);
			}
		}
	}
	for (const x of pilasters.slice(1, -1)) {
		for (let y = CASE.rim + 2; y <= CASE.bottom - 2; y++) {
			set(scene, x, y, GILT[3]);
			set(scene, x + 1, y, GILT[0]);
		}
	}
	drawApron(scene);
}

/**
 * Tells whether a point on the case's side is in the candles' full light, which fades to the left,
 * the edge between the two dithered over a few columns.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function candlelit(x, y) {
	if (x >= FADE + 2) {
		return true;
	}
	if (x < FADE - 2) {
		return false;
	}
	return (x + y) % 2 === 0;
}

/**
 * The apron under the case: a gilt band with a carved shell fanning down between each pair of legs.
 * @param {Canvas} scene
 */
function drawApron(scene) {
	for (let x = CASE.left + 1; x <= CASE.right - 3; x++) {
		set(scene, x, CASE.bottom + 1, GILT[2]);
		set(scene, x, CASE.bottom + 2, GILT[3]);
	}
	for (let n = 0; n < LEGS.length - 1; n++) {
		const cx = Math.round((LEGS[n].x + LEGS[n + 1].x) / 2);
		// A scallop shell: ribs fanning out and down from a hinge, its lower edge scalloped.
		for (let j = 0; j < 4; j++) {
			const half = j + 1;
			for (let i = -half; i <= half; i++) {
				if (j === 3 && Math.abs(i) % 2 === 1) {
					continue;
				}
				const rib = Math.abs(i) % 2 === 0;
				set(
					scene,
					cx + i,
					CASE.bottom + 1 + j,
					rib ? GILT[0] : GILT[2]
				);
			}
		}
	}
}

/**
 * The three cabriole legs: a swelling knee, a slim ankle and a scrolled foot, all gilt and lit from the candles' side.
 * @param {Canvas} scene
 */
function drawLegs(scene) {
	// The leg's centre line (for a knee that swells to the left) and half-width, row by row from the knee down.
	const shape = [
		[0, 2.2],
		[-1, 2.4],
		[-1.3, 2.2],
		[-1, 1.8],
		[-0.4, 1.3],
		[0.2, 1.1],
		[0.7, 1],
		[1, 1],
		[1, 1],
		[0.8, 1],
		[0.3, 1.1],
		[-0.4, 1.5],
		[-1, 2],
	];
	for (const { x: cx, swell } of LEGS) {
		shape.forEach(([dx, half], j) => {
			const mid = cx - dx * swell;
			for (
				let x = Math.round(mid - half);
				x <= Math.round(mid + half);
				x++
			) {
				const across = (x + 0.5 - mid) / half;
				let colour = GILT[1];
				if (across > 0.35) {
					colour = GILT[0];
				} else if (across < -0.45) {
					colour = GILT[3];
				} else if (across < -0.05) {
					colour = GILT[2];
				}
				set(scene, x, LEG_TOP + j, colour);
			}
		});
		// The carved leaf on the knee.
		set(scene, cx + swell, LEG_TOP + 1, GILT[2]);
		set(scene, cx + swell, LEG_TOP + 2, GILT[3]);
	}
}

/**
 * The keyboard end: a gilt cheek ending in a scroll, and over it two manuals of ivory naturals with ebony sharps
 * in their twos and threes.
 * @param {Canvas} scene
 */
function drawKeys(scene) {
	const { left, right, top } = KEYS;
	for (let manual = 0; manual < 2; manual++) {
		const y = top + manual * 2;
		for (let x = left + 1 - manual; x <= right; x++) {
			// Sharps fall in a pattern of two and three, as on any keyboard.
			const step = (x - left + manual * 3) % 7;
			const sharp =
				step === 1 ||
				step === 2 ||
				step === 4 ||
				step === 5 ||
				step === 6;
			set(scene, x, y, sharp && step !== 4 ? C.night : C.creamLight);
			set(scene, x, y + 1, C.cream);
		}
		// The thin dark line between one manual's key fronts and the next.
		for (let x = left; x <= right; x++) {
			if (x % 2 === 0) {
				set(scene, x, y + 1, C.creamShade);
			}
		}
	}
	// The key slip under the lower manual.
	for (let x = left; x <= right; x++) {
		set(scene, x, top + 4, GILT[2]);
	}
	// The cheek beside the keys, rising into a curled scroll.
	for (let y = top; y < CASE.rim; y++) {
		set(scene, left - 1, y, GILT[1]);
		set(scene, left, y, GILT[3]);
	}
	set(scene, left - 1, top - 1, GILT[0]);
	set(scene, left, top - 2, GILT[1]);
	set(scene, left + 1, top - 2, GILT[0]);
	set(scene, left + 1, top - 1, GILT[2]);
}

/**
 * The lid stick: a slim gilt prop from the rim up to the lid's edge.
 * @param {Canvas} scene
 */
function drawStick(scene) {
	line(scene, 41, CASE.rim - 1, 38, lidTop(38) + 2, GILT[1]);
}

/**
 * The candelabra on the tail: a round foot, a turned stem with a knop, and two curving arms,
 * each holding a candle in a cup like the one on top.
 * @param {Canvas} canvas
 */
function drawCandelabra(canvas) {
	const base = CASE.rim - 1;
	// The foot.
	for (let x = STEM - 3; x <= STEM + 3; x++) {
		set(canvas, x, base, x > STEM ? GILT[1] : GILT[2]);
	}
	for (let x = STEM - 2; x <= STEM + 2; x++) {
		set(canvas, x, base - 1, x > STEM ? GILT[0] : GILT[1]);
	}
	// The stem, with a knop halfway up.
	for (let y = ARMS - 2; y < base - 1; y++) {
		set(canvas, STEM, y, GILT[2]);
		set(canvas, STEM + 1, y, GILT[0]);
	}
	rect(canvas, STEM - 1, 22, 4, 2, GILT[1]);
	set(canvas, STEM + 2, 22, GILT[0]);
	set(canvas, STEM - 1, 23, GILT[2]);
	// The arms: out from the stem, dipping, then curling up into the outer cups.
	for (const flame of [FLAMES[0], FLAMES[2]]) {
		const dir = Math.sign(flame.x - STEM);
		const points = [
			[STEM + (dir > 0 ? 2 : -1), ARMS],
			[STEM + (dir > 0 ? 3 : -2), ARMS + 1],
			[STEM + (dir > 0 ? 4 : -3), ARMS + 1],
			[flame.x, ARMS],
			[flame.x, ARMS - 1],
		];
		for (const [x, y] of points) {
			set(canvas, x, y, dir > 0 ? GILT[0] : GILT[1]);
		}
	}
	// The cups and the candles standing in them.
	for (const flame of FLAMES) {
		const cup = flame.y + 6;
		rect(canvas, flame.x - 1, cup, 3, 1, GILT[1]);
		set(canvas, flame.x + 1, cup, GILT[0]);
		for (let y = flame.y + 2; y < cup; y++) {
			set(canvas, flame.x, y, WAX[0]);
			set(canvas, flame.x + 1, y, y === flame.y + 2 ? WAX[0] : WAX[1]);
		}
	}
}

/**
 * The three flames: a white heart, a pale gold body and an amber tip.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	for (const { x, y } of FLAMES) {
		set(scene, x, y - 2, C.amber);
		set(scene, x, y - 1, C.gold);
		set(scene, x + 1, y - 1, C.amber);
		set(scene, x, y, C.lampGlow);
		set(scene, x + 1, y, C.gold);
		set(scene, x, y + 1, C.white);
		set(scene, x + 1, y + 1, C.lampGlow);
	}
}

/**
 * The candlelight's brightest catches on the gilt: the rim under the candelabra, the near knee and the cheek's scroll.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[46, CASE.rim],
		[57, CASE.rim + 2],
		[LEGS[2].x + 1, LEG_TOP + 1],
		[STEM + 2, 22],
	]) {
		set(scene, x, y, C.white);
	}
}
