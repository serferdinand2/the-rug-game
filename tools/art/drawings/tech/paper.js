// Paper: a papermaker's mould and deckle lifted dripping from a vat of white pulp, fresh sheets drying on a line behind.
import {
	createCanvas,
	get,
	set,
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

/** The window in the back wall, on the left, where the daylight comes from. */
const WINDOW = { x: 1, y: 6, w: 13, h: 16 };

/** The mould, tilted towards us: its top edge and its bottom edge, each from left to right. */
const MOULD = { top: 14, bottom: 34, topLeft: 12, topRight: 52, bottomLeft: 7 };

/** The vat's rim, seen from a little above as an ellipse wider than the picture. */
const VAT = { x: 32, y: 47, rx: 37, ry: 6 };

/** The wet pulp: bright where the window lights it, wet-blue in the hollows. */
const PULP_WET = mix(C.creamLight, C.daySky5, 0.3);
const PULP_SHADE = mix(C.cream, C.daySky4, 0.2);

/** The sheets drying on the lines, backlit where they hang in front of the window. */
const BACKLIT = mix(C.creamLight, C.lampGlow, 0.6);

/**
 * Draws the Paper tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7307);

	drawInterior(layer, {
		floor: 50,
		random,
		wall: 'stone',
		window: { ...WINDOW, time: 'day' },
	});
	drawShaft(layer);
	drawLines(layer, random);

	drawVat(scene, random);
	drawMould(scene, random);
	drawHand(scene, 'left');
	drawHand(scene, 'right');
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 6,
		y: 12,
		radius: 44,
		colour: C.lampGlow,
		strength: 0.22,
		steps: 3,
		skip: [C.ink],
	});
	drawDrips(scene);
	return scene;
}

/**
 * The shaft of daylight falling from the window down and to the right across the wall.
 * @param {Canvas} layer
 */
function drawShaft(layer) {
	for (let y = WINDOW.y + WINDOW.h + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const back = x - (y - WINDOW.y - WINDOW.h) * 0.9;
			if (back >= WINDOW.x + 1 && back < WINDOW.x + WINDOW.w - 1) {
				const behind = /** @type {Colour} */ (get(layer, x, y));
				set(layer, x, y, mix(behind, C.lampGlow, 0.22));
			}
		}
	}
}

/**
 * A drying line strung across the room past the window, with fresh blank sheets hung over it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLines(layer, random) {
	/**
	 * The cord's row at a column, sagging between its ends.
	 * @param {number} x
	 * @returns {number}
	 */
	const cord = (x) => Math.round(2 + 2 * Math.sin((Math.PI * x) / 63));
	for (let x = 0; x < 64; x++) {
		set(layer, x, cord(x), C.timberShade);
	}
	let x = 16;
	while (x < 60) {
		const w = Math.min(6 + Math.floor(random() * 3), 63 - x);
		const h = 7 + Math.floor(random() * 3);
		drawSheet(layer, x, cord(x + Math.floor(w / 2)), w, h);
		x += w + 1 + Math.floor(random() * 2);
	}
}

/**
 * One blank sheet folded over the line: a short flap in front, lit on the window side and shaded on the other.
 * @param {Canvas} layer
 * @param {number} x - Left column
 * @param {number} y - The cord's row
 * @param {number} w - Width
 * @param {number} h - How far it hangs below the cord
 */
function drawSheet(layer, x, y, w, h) {
	for (let j = 0; j <= h; j++) {
		for (let i = 0; i < w; i++) {
			let tone = C.creamLight;
			if (i === w - 1 || j === h) {
				tone = C.creamShade;
			} else if (i >= w - 3) {
				tone = C.cream;
			}
			if (j === 0) {
				tone = C.white;
			} else if (j === 3) {
				tone = i === w - 1 ? C.creamShade : C.cream;
			}
			set(layer, x + i, y + j, tone);
		}
	}
}

/**
 * The vat: a broad wooden tub of staves and iron hoops, brimming with white pulp, its rim lit from the left.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawVat(scene, random) {
	const { x: cx, y: cy, rx, ry } = VAT;
	for (let y = cy - ry - 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const across = (x - cx) / rx;
			const half = ry * Math.sqrt(Math.max(0, 1 - across * across));
			const inner =
				(ry - 1.6) * Math.sqrt(Math.max(0, 1 - across * across));
			const front = cy + half;
			if (y < cy - half) {
				continue;
			}
			let tone;
			if (y > front + 1) {
				// The staves and the hoops.
				const depth = y - front;
				const stave = Math.floor((x + 2) / 5);
				tone = (x + 2) % 5 === 0 ? C.timberShade : C.timber;
				if (x < 18 && (x + 2) % 5 !== 0) {
					tone = stave % 2 ? C.timberLight : C.timber;
				}
				if (depth >= 6 && depth < 8) {
					tone = depth === 6 ? C.stoneLight : C.stoneShade;
					if (x > 40) {
						tone = depth === 6 ? C.stone : C.roofShade;
					}
				}
			} else if (y >= front) {
				tone = x < 40 ? C.timberLight : C.timber;
				if (y === Math.ceil(front)) {
					tone = x < 40 ? C.sandShade : C.timberLight;
				}
			} else if (y < cy - inner) {
				// The inside of the far wall, above the pulp.
				tone = y < cy - inner - 1 ? C.timber : C.timberShade;
			} else {
				tone = pulpTone(x, y, cx, cy, inner);
			}
			set(scene, x, y, tone);
		}
	}
	// Flecks of fibre in the pulp.
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = cy - 3 + Math.floor(random() * 8);
		if (get(scene, x, y) === C.creamLight) {
			set(scene, x, y, C.cream);
		}
	}
}

/**
 * The pulp's tone at a point: bright on the window side, wet and blue in the shade of the mould above it.
 * @param {number} x
 * @param {number} y
 * @param {number} cx - The vat's centre column
 * @param {number} cy - The vat's centre row
 * @param {number} inner - The pulp's half height at this column
 * @returns {Colour}
 */
function pulpTone(x, y, cx, cy, inner) {
	const fromTop = y - (cy - inner);
	if (fromTop < 2 && x > 8 && x < 58) {
		return PULP_SHADE;
	}
	if (x > 44) {
		return (x + y) % 7 === 0 ? PULP_SHADE : PULP_WET;
	}
	if (x < 14) {
		return C.white;
	}
	return C.creamLight;
}

/**
 * The mould and deckle: a wooden frame tilted towards us, its fine wire screen carrying a fresh layer of wet pulp.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawMould(scene, random) {
	const { top, bottom, topLeft, topRight, bottomLeft } = MOULD;
	const spread = topLeft - bottomLeft;
	for (let y = top; y <= bottom + 2; y++) {
		const t = (Math.min(y, bottom) - top) / (bottom - top);
		const left = Math.round(topLeft - spread * t);
		const right = Math.round(topRight + spread * t);
		for (let x = left; x <= right; x++) {
			let tone;
			if (y > bottom) {
				// The frame's front face, below its top.
				tone = y === bottom + 1 ? C.timber : C.timberShade;
				if (x < left + 2) {
					tone = C.timberLight;
				}
			} else if (y <= top + 1 || y >= bottom - 1) {
				tone = y === top || y === bottom - 1 ? C.timberLight : C.timber;
				if (x > 40 && y === top) {
					tone = C.timber;
				}
			} else if (x <= left + 1) {
				tone = x === left ? C.timberLight : C.timber;
			} else if (x >= right - 1) {
				tone = x === right ? C.timberShade : C.timber;
			} else {
				tone = sheetTone(x, y, left, right, t);
			}
			set(scene, x, y, tone);
		}
	}
	// The deckle's corner joints.
	for (const [x, y] of [
		[topLeft, top],
		[topRight, top],
		[bottomLeft, bottom],
		[topRight + spread, bottom],
	]) {
		set(scene, x, y, C.lampFrame);
	}
	// Clumps of fibre in the wet sheet.
	for (let i = 0; i < 18; i++) {
		const x = 14 + Math.floor(random() * 36);
		const y = top + 3 + Math.floor(random() * 16);
		if (get(scene, x, y) === C.creamLight) {
			set(scene, x, y, C.cream);
		}
	}
}

/**
 * The wet sheet's tone on the screen: white towards the window, cooler and wetter away from it, crossed by the
 * faint chain lines of the wire screen beneath and a gleam of wet light.
 * @param {number} x
 * @param {number} y
 * @param {number} left - The frame's left column on this row
 * @param {number} right - The frame's right column on this row
 * @param {number} t - How far down the mould this row is, from 0 to 1
 * @returns {Colour}
 */
function sheetTone(x, y, left, right, t) {
	const u = (x - left) / (right - left);
	let tone = u < 0.35 ? C.white : u < 0.75 ? C.creamLight : PULP_WET;
	// The chain lines, converging slightly towards the far edge.
	const chain = Math.round(u * 8 * 4) % 4 === 0 && u > 0.05 && u < 0.95;
	if (chain) {
		tone = u < 0.35 ? C.creamLight : u < 0.75 ? C.cream : PULP_SHADE;
	}
	// The pulp gathers in a soft rim along the deckle's inner edge.
	if (y === MOULD.top + 2 || x === left + 2) {
		tone = C.cream;
	}
	if (x === right - 2 || y === MOULD.bottom - 2) {
		tone = PULP_SHADE;
	}
	// A gleam of wet light running down from the top left.
	const gleam = x - left - (y - MOULD.top) * 0.4;
	if (gleam > 8 && gleam < 10 && t < 0.7) {
		tone = C.white;
	}
	return tone;
}

/** The left hand, top row first: c cuff, L lit skin, S skin, D shaded skin, d crease, N nail. */
const HAND = [
	'cLL...........',
	'cLSSL.........',
	'CLSSSSL.......',
	'CSSSSSLLLLLN..',
	'CSSSSSSSSSDDN.',
	'CDSSSSdSSD....',
	'.DSSSSSSSD....',
	'..DSSdSSSD....',
	'...DSSSSD.....',
	'....DddD......',
];

/**
 * One of the papermaker's hands gripping the mould's side, the thumb laid over the frame onto the pulp, the bare
 * forearm reaching out of the picture to a rolled linen cuff. The right hand mirrors the left, in the shade.
 * @param {Canvas} scene
 * @param {'left' | 'right'} side
 */
function drawHand(scene, side) {
	const near = side === 'left';
	const lit = mix(C.skinTan, C.skin, 0.6);
	/** @type {Record<string, Colour>} */
	const colours = {
		c: C.creamLight,
		C: C.creamShade,
		L: near ? lit : C.skinTan,
		S: near ? C.skinTan : mix(C.skinTan, C.skinTanShade, 0.4),
		D: C.skinTanShade,
		d: mix(C.skinTanShade, C.skinDeepShade, 0.5),
		N: mix(C.skin, C.creamLight, 0.5),
	};
	HAND.forEach((row, j) => {
		[...row].forEach((key, i) => {
			if (key !== '.') {
				set(scene, near ? i : 63 - i, 18 + j, colours[key]);
			}
		});
	});
	// The thumb's top catches the light on both hands.
	set(scene, near ? 8 : 55, 21, lit);
}

/**
 * Water running off the mould's front edge in broken streams and splashing in rings on the pulp, painted over the
 * outline.
 * @param {Canvas} scene
 */
function drawDrips(scene) {
	const water = mix(C.daySky6, C.white, 0.4);
	const streams = [10, 15, 21, 27, 33, 39, 45, 50, 55];
	streams.forEach((x, i) => {
		const top = MOULD.bottom + 3;
		const across = (x - VAT.x) / VAT.rx;
		const surface = Math.round(
			VAT.y -
				(VAT.ry - 1.6) * Math.sqrt(1 - across * across) +
				2 +
				(i % 3)
		);
		for (let y = top; y < surface; y++) {
			if ((y + i) % 3 !== 0) {
				set(scene, x, y, y === top ? C.white : water);
			}
		}
		// The splash ring where the stream lands.
		set(scene, x - 2, surface, C.white);
		set(scene, x + 2, surface, C.white);
		set(scene, x - 1, surface - 1, water);
		set(scene, x + 1, surface - 1, water);
		set(scene, x, surface, PULP_SHADE);
	});
}
