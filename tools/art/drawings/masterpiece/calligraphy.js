// Calligraphy: one sweeping ink circle trailing off in dry streaks on white rice paper, a blank red seal below it, laid on a pale tatami mat by daylight beside a slate ink stone and a bamboo brush on its rest.
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

/** The sheet of rice paper on the mat. */
const PAPER = { x: 2, y: 3, w: 44, h: 58 };

/**
 * The ink circle: its centre, its radius where the stroke begins, the angle it begins at (in radians, clockwise from the top),
 * how far round it sweeps, and how much wider it has spiralled by the end.
 */
const ENSO = { x: 24, y: 29, r: 15, start: 4.1, sweep: 5.78, grow: 1.6 };

/** From this far along the stroke the brush runs dry and splits into streaks, and how many streaks it splits into. */
const DRY_FROM = 0.6;
const BRISTLES = 7;

/**
 * The brush lying on its rest, pointing away from us: its inked tip, the direction its handle runs (towards us, off the frame),
 * its length, and how far its shadow has slid at the tip, which the rest holds up off the mat.
 */
const BRUSH = {
	tip: { x: 51.5, y: 25 },
	direction: { x: 0.28, y: 0.96 },
	length: 44,
	lift: { x: 4, y: 3 },
};

/** The seal's box on the paper, below and left of the circle. */
const SEAL_BOX = { x: 6, y: 51, w: 6, h: 6 };

/** The slate ink stone (its centre, half-width, half-height and thickness), its pool of ink, and the brush rest, on the mat beside the paper. */
const STONE = { x: 55.5, y: 12, rx: 7.5, ry: 7, depth: 2 };
const POOL = { x: 53, y: 11, r: 3.4 };
const REST = { x: 50, y: 34 };

/** The tatami mat: woven rush, its ribs, the stitches between its rows and the shade objects throw on it. */
const MAT = mix(C.sandLight, C.grassLight, 0.22);
const MAT_RIB = mix(C.sand, C.grassLight, 0.24);
const MAT_STITCH = mix(C.sandShade, C.grass, 0.3);
const MAT_SHADE = mix(MAT_RIB, C.stoneShade, 0.45);

/** The rice paper: lit, plain, its fibres and its edge. */
const PAPER_TONE = C.creamLight;
const PAPER_FIBRE = mix(C.creamLight, C.cream, 0.6);
const PAPER_EDGE = mix(C.cream, C.creamShade, 0.3);

/** The ink: dense and wet, glossy where it pooled, its bristle lines, dry streaks, faint streaks and the grey bleed into the paper. */
const INK = C.ink;
const INK_SHEEN = mix(C.ink, C.stoneLight, 0.4);
const INK_HAIR = mix(C.ink, C.stoneShade, 0.35);
const INK_DRY = mix(C.ink, C.creamLight, 0.36);
const INK_FAINT = mix(C.ink, C.creamLight, 0.62);
const INK_BLEED = mix(C.creamLight, C.ink, 0.13);

/** The vermilion seal: its paste and the pale specks where the paste missed. */
const SEAL = mix(C.brickRed, C.amber, 0.18);
const SEAL_PALE = mix(SEAL, C.creamLight, 0.45);

/** The slate ink stone: lit rim, body, shaded side, and the damp grinding face. */
const SLATE_LIGHT = mix(C.stoneMid, C.stoneLight, 0.45);
const SLATE = mix(C.stoneShade, C.stoneMid, 0.45);
const SLATE_SHADE = mix(C.stoneShade, C.roofShade, 0.55);
const SLATE_WET = mix(C.stoneShade, C.ink, 0.3);

/** The pale celadon brush rest. */
const CELADON_LIGHT = mix(C.ghostLight, C.cream, 0.3);
const CELADON = mix(C.ghost, C.stoneLight, 0.55);
const CELADON_SHADE = mix(C.ghostShade, C.stone, 0.45);

/** The brush: bamboo handle lit, plain and shaded, its nodes, the black lacquered ferrule and the pale goat hair above the ink. */
const BAMBOO_LIGHT = mix(C.sandLight, C.lampGlow, 0.3);
const BAMBOO = mix(C.sand, C.grassLight, 0.18);
const BAMBOO_SHADE = mix(C.sandShade, C.timberLight, 0.35);
const BAMBOO_NODE = C.timberLight;
const LACQUER = C.wood;
const LACQUER_LIGHT = C.timberLight;
const HAIR = C.cream;
const HAIR_SHADE = C.creamShade;

/**
 * Draws the Calligraphy masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5113);

	drawMat(layer);
	drawPaper(scene, random);
	drawEnso(scene, random);
	drawSeal(scene, random);
	outline(scene, C.ink);

	const props = createCanvas(64, 64);
	drawInkStone(props);
	drawRest(props);
	outline(props, C.ink);
	castShadows(layer, props);
	stamp(scene, props);
	underlay(scene, layer);

	glow(scene, {
		x: 0,
		y: 0,
		radius: 58,
		colour: C.white,
		strength: 0.35,
		steps: 3,
		skip: [C.ink, INK_HAIR, INK_DRY, SEAL],
	});

	drawBrushShadow(scene);
	const brush = createCanvas(64, 64);
	drawBrush(brush);
	outline(brush, C.ink);
	stamp(scene, brush);
	drawGleams(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * The tatami mat: rows of woven rush, a darker rib every other row and the stitch lines that bind it in long panels.
 * @param {Canvas} layer
 */
function drawMat(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y % 2 === 0 ? MAT : MAT_RIB;
			if (x % 11 === 4) {
				colour = MAT_STITCH;
			} else if (y % 2 === 1 && (x + y * 3) % 7 === 0) {
				colour = MAT;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The sheet of rice paper: soft cream with stray fibres in it and a slightly darker deckle along its right and bottom edges.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPaper(scene, random) {
	const { x: px, y: py, w, h } = PAPER;
	rect(scene, px, py, w, h, PAPER_TONE);
	for (let y = py; y < py + h; y++) {
		set(scene, px + w - 1, y, PAPER_EDGE);
	}
	for (let x = px; x < px + w; x++) {
		set(scene, x, py + h - 1, PAPER_EDGE);
	}
	// Fibres: short wavy strands caught in the sheet.
	for (let i = 0; i < 34; i++) {
		let x = px + 1 + Math.floor(random() * (w - 3));
		let y = py + 1 + Math.floor(random() * (h - 3));
		const length = 2 + Math.floor(random() * 4);
		const slope = random() < 0.5 ? 1 : -1;
		for (let k = 0; k < length; k++) {
			set(scene, x, y, PAPER_FIBRE);
			x += 1;
			if (random() < 0.4) {
				y += slope;
			}
		}
	}
}

/**
 * The stroke's centre at a point along it.
 * @param {number} u - How far along the stroke, from 0 at its start to 1 at its end
 * @returns {{ x: number, y: number }}
 */
function strokePoint(u) {
	const angle = ENSO.start + ENSO.sweep * u;
	const radius = strokeRadius(u);
	return {
		x: ENSO.x + radius * Math.sin(angle),
		y: ENSO.y - radius * Math.cos(angle),
	};
}

/**
 * The circle's radius along the stroke: it spirals slowly outwards and wavers a little, as a hand-drawn circle does.
 * @param {number} u - How far along the stroke
 * @returns {number}
 */
function strokeRadius(u) {
	return ENSO.r + ENSO.grow * u + 0.6 * Math.sin(u * 6.5 + 0.4);
}

/**
 * The stroke's width along it: pressed down wide at the start, steady through the sweep, and thinning as the brush lifts and dries.
 * @param {number} u - How far along the stroke
 * @returns {number}
 */
function strokeWidth(u) {
	if (u < 0.06) {
		return 6.4 - u * 12;
	}
	if (u < DRY_FROM) {
		return 5.7 - (u - 0.06) * 0.2;
	}
	const taper = Math.min(1, (1 - u) / 0.14 + 0.25);
	return (5.4 - (u - DRY_FROM) * 3.5) * taper;
}

/**
 * The ink circle: one sweeping stroke, pressed down heavy and glossy at its start, solid round the top,
 * then splitting into dry grey streaks that give out one by one, with grey bleed where wet ink soaked into the paper.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawEnso(scene, random) {
	// Where each hair of the dry tail runs out of ink and leaves a white streak: the outer hairs first.
	const runsOut = Array.from({ length: BRISTLES }, (_, b) => {
		const edge = Math.abs(b - (BRISTLES - 1) / 2) / ((BRISTLES - 1) / 2);
		return b % 2 === 1
			? DRY_FROM + 0.05 + random() * 0.3
			: 1.0 - edge * 0.12 - random() * 0.06;
	});
	const start = strokePoint(0);
	for (let y = PAPER.y; y < PAPER.y + PAPER.h - 1; y++) {
		for (let x = PAPER.x; x < PAPER.x + PAPER.w - 1; x++) {
			const dx = x + 0.5 - ENSO.x;
			const dy = y + 0.5 - ENSO.y;
			const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
			const turned = (angle - ENSO.start + Math.PI * 4) % (Math.PI * 2);
			// The blunt, rounded start where the brush first pressed down.
			const fromStart = Math.hypot(
				x + 0.5 - start.x - 0.6,
				y + 0.5 - start.y + 0.4
			);
			if (fromStart < 3.3) {
				set(scene, x, y, INK);
				continue;
			}
			if (turned > ENSO.sweep) {
				if (fromStart < 4.3 && random() < 0.5) {
					set(scene, x, y, INK_BLEED);
				}
				continue;
			}
			const u = turned / ENSO.sweep;
			const width = strokeWidth(u);
			const off = Math.hypot(dx, dy) - strokeRadius(u);
			if (u < DRY_FROM) {
				// Faint bristle lines along the solid stroke, where the hairs began to part.
				const hair =
					u > 0.32 &&
					Math.abs(off - width * 0.2) < 0.5 &&
					Math.sin(u * 38) > -0.2;
				if (Math.abs(off) <= width / 2) {
					set(scene, x, y, hair ? INK_HAIR : INK);
				} else if (Math.abs(off) <= width / 2 + 1 && random() < 0.45) {
					set(scene, x, y, INK_BLEED);
				}
				continue;
			}
			if (Math.abs(off) > width / 2) {
				continue;
			}
			const across = (off / width + 0.5) * BRISTLES;
			const b = Math.min(BRISTLES - 1, Math.floor(across));
			const left = runsOut[b] - u;
			if (left <= 0) {
				continue;
			}
			let colour = INK;
			if (left < 0.05) {
				colour = INK_FAINT;
			} else if (left < 0.12 || u > 0.94) {
				colour = INK_DRY;
			}
			set(scene, x, y, colour);
		}
	}
	// Where the ink pooled at the start it is still wet and catches the daylight.
	set(scene, Math.round(start.x) - 1, Math.round(start.y) - 1, INK_SHEEN);
	set(scene, Math.round(start.x), Math.round(start.y) - 2, INK_SHEEN);
	for (const u of [0.12, 0.2, 0.3]) {
		const p = strokePoint(u);
		const inward = { x: ENSO.x - p.x, y: ENSO.y - p.y };
		const n = Math.hypot(inward.x, inward.y);
		set(
			scene,
			Math.round(p.x + (inward.x / n) * 1.2),
			Math.round(p.y + (inward.y / n) * 1.2),
			INK_SHEEN
		);
	}
}

/**
 * The blank red seal pressed below the circle: a flat square of vermilion paste, its edge worn pale in places.
 * The inside stays plain, so no speck can read as a carved character.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSeal(scene, random) {
	const { x: sx, y: sy, w, h } = SEAL_BOX;
	for (let y = sy; y < sy + h; y++) {
		for (let x = sx; x < sx + w; x++) {
			const edge =
				x === sx || y === sy || x === sx + w - 1 || y === sy + h - 1;
			set(scene, x, y, edge && random() < 0.2 ? SEAL_PALE : SEAL);
		}
	}
}

/**
 * How far a pixel lies from the middle of an oval, as a share of the oval: below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @param {number} cx - The oval's centre column
 * @param {number} cy - The oval's centre row
 * @param {number} rx - Half its width
 * @param {number} ry - Half its height
 * @returns {number}
 */
function oval(x, y, cx, cy, rx, ry) {
	return Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
}

/**
 * The round slate ink stone, seen from above and a little in front: a raised rim lit on its upper left,
 * a crescent well of wet ink at its far end, the damp grinding face below it and its thickness showing underneath.
 * @param {Canvas} props
 */
function drawInkStone(props) {
	const { x: cx, y: cy, rx, ry, depth } = STONE;
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry + depth); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const top = oval(x, y, cx, cy, rx, ry);
			if (top > 1) {
				if (oval(x, y, cx, cy + depth, rx, ry) <= 1) {
					set(props, x, y, SLATE_SHADE);
				}
				continue;
			}
			const nx = (x + 0.5 - cx) / rx;
			const ny = (y + 0.5 - cy) / ry;
			const hollow = oval(x, y, cx, cy + 0.4, rx - 2, ry - 2);
			if (hollow > 1) {
				let rim = SLATE;
				if (nx + ny < -0.45) {
					rim = SLATE_LIGHT;
				} else if (nx + ny > 0.55) {
					rim = SLATE_SHADE;
				}
				set(props, x, y, rim);
				continue;
			}
			// The hollow's inner wall: in shadow on the near-the-window side, lit on the far side.
			if (oval(x, y, cx, cy + 0.4, rx - 3, ry - 3) > 1) {
				set(props, x, y, nx + ny < 0 ? SLATE_SHADE : SLATE);
				continue;
			}
			// The round pool of ink at the stone's left end, its shelving lip, and the grinding face.
			const pool = Math.hypot(x + 0.5 - POOL.x, (y + 0.5 - POOL.y) * 1.1);
			if (pool < POOL.r) {
				set(props, x, y, INK);
			} else if (pool < POOL.r + 1) {
				set(props, x, y, SLATE_WET);
			} else {
				set(props, x, y, nx + ny > 0.3 ? SLATE_WET : SLATE);
			}
		}
	}
	// Daylight on the pool, and the grinding face worn smooth and shining where the stick is rubbed.
	set(props, POOL.x - 2, POOL.y - 2, INK_SHEEN);
	set(props, POOL.x - 1, POOL.y - 2, INK_SHEEN);
	set(props, POOL.x - 2, POOL.y - 1, INK_SHEEN);
	set(props, POOL.x + 1, POOL.y + 1, INK_SHEEN);
	for (const [x, y] of [
		[57, 11],
		[58, 11],
		[58, 12],
		[59, 13],
	]) {
		set(props, x, y, SLATE_LIGHT);
	}
}

/**
 * The brush rest: a little celadon ridge with two rounded humps, the brush lying in the dip between them.
 * @param {Canvas} props
 */
function drawRest(props) {
	paint(
		props,
		REST.x,
		REST.y,
		[
			'.lll.....ll.',
			'lpppl...lpps',
			'lppppllllpps',
			'pppppppppppss',
			'.sssssssssss.',
		],
		{ l: CELADON_LIGHT, p: CELADON, s: CELADON_SHADE }
	);
}

/**
 * The ink stone and the brush rest throw short shadows on the mat, down and to the right, away from the window.
 * @param {Canvas} layer
 * @param {Canvas} props
 */
function castShadows(layer, props) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (get(props, x - 2, y - 2) && !get(props, x, y)) {
				set(layer, x, y, MAT_SHADE);
			}
		}
	}
}

/**
 * Where a pixel lies against a brush whose tip is at `tip` and whose handle runs along `direction`:
 * how far along the brush, and how far to one side of its middle.
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number }} tip
 * @param {{ x: number, y: number }} direction - A unit vector from the tip towards the handle
 * @returns {{ along: number, side: number }}
 */
function brushFrame(x, y, tip, direction) {
	const dx = x + 0.5 - tip.x;
	const dy = y + 0.5 - tip.y;
	return {
		along: dx * direction.x + dy * direction.y,
		side: -dx * direction.y + dy * direction.x,
	};
}

/**
 * How wide the brush is at a point along it: a pointed tip swelling into the hair, the ferrule, then the slim handle.
 * @param {number} along - Pixels from the tip
 * @returns {number} Half the width
 */
function brushHalfWidth(along) {
	if (along < 9) {
		return 0.4 + along * 0.21;
	}
	if (along < 12) {
		return 2.1;
	}
	return 1.6;
}

/**
 * The brush's shadow on the mat: it meets the brush at the handle's end, which lies on the mat,
 * and slides further from it towards the tip, which the rest holds up.
 * @param {Canvas} scene
 */
function drawBrushShadow(scene) {
	const { tip, direction, length, lift } = BRUSH;
	const from = { x: tip.x + lift.x, y: tip.y + lift.y };
	const end = {
		x: tip.x + direction.x * length,
		y: tip.y + direction.y * length,
	};
	const span = Math.hypot(end.x - from.x, end.y - from.y);
	const along = { x: (end.x - from.x) / span, y: (end.y - from.y) / span };
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const at = brushFrame(x, y, from, along);
			if (
				at.along < 0 ||
				Math.abs(at.side) > brushHalfWidth(at.along) + 0.3
			) {
				continue;
			}
			const under = get(scene, x, y);
			if (under) {
				set(scene, x, y, mix(under, C.roofShade, 0.22));
			}
		}
	}
}

/**
 * The brush, its tip pointing away from us: black inked hair fading to pale goat hair,
 * a lacquered ferrule and a bamboo handle with its nodes, running out of the frame towards us. Its left side faces the window.
 * @param {Canvas} brush
 */
function drawBrush(brush) {
	const { tip, direction, length } = BRUSH;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { along, side } = brushFrame(x, y, tip, direction);
			const half = brushHalfWidth(along);
			if (along < 0 || along > length || Math.abs(side) > half) {
				continue;
			}
			const lit = side > half - 1;
			const shaded = side < -half + 0.9;
			let colour;
			if (along < 6.5 + Math.sin(side * 2.5)) {
				colour = lit ? INK_SHEEN : INK;
			} else if (along < 9) {
				colour = shaded ? HAIR_SHADE : HAIR;
			} else if (along < 12) {
				colour = lit ? LACQUER_LIGHT : LACQUER;
			} else {
				colour = lit ? BAMBOO_LIGHT : shaded ? BAMBOO_SHADE : BAMBOO;
				const node = (along - 12) % 13;
				if (node < 1) {
					colour = BAMBOO_NODE;
				} else if (node < 2) {
					colour = BAMBOO_LIGHT;
				}
			}
			set(brush, x, y, colour);
		}
	}
}

/**
 * Daylight glinting on the wet ink in the brush's hair.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	const { tip, direction } = BRUSH;
	set(
		scene,
		Math.round(tip.x + direction.x * 3 - 0.6),
		Math.round(tip.y + direction.y * 3),
		C.stoneLight
	);
}
