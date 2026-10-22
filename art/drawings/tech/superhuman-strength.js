// Superhuman Strength: a figure in a wide stance heaving a huge mossy boulder over their head on a sunny day, pebbles falling and dust bursting from the cracked ground.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A material's three tones: lit, base and shaded.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/** A test for whether a pixel lies inside a shape. */
/** @typedef {(x: number, y: number) => boolean} Shape */

/** The first row of the ground. */
const GROUND = 57;

/** The boulder: its centre and its half-width and half-height before its lumps. */
const BOULDER = { x: 32, y: 14, rx: 25, ry: 11 };

/** The boulder's grey stone. */
const STONE = { light: C.stoneLight, base: C.stone, shade: C.stoneShade };

/** The moss on the boulder's crown. */
const MOSS = { light: C.grassLight, base: C.grass, shade: C.grassShade };

/** Skin, lit by the sun. */
const SKIN = { light: C.skin, base: C.skinTan, shade: C.skinTanShade };

/** The sleeveless red tunic. */
const TUNIC = {
	light: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
};

/** The blue trousers. */
const TROUSERS = { light: C.dayWaveDeep, base: C.daySea2, shade: C.daySea3 };

/** The dark leather boots and belt. */
const LEATHER = { light: C.timber, base: C.timberShade, shade: C.wood };

/** The short dark hair. */
const HAIR = { light: C.timberShade, base: C.wood, shade: C.wood };

/** The packed earth, its crack lines and the dust thrown up from it. */
const EARTH = { light: C.sandLight, base: C.sand, shade: C.sandShade };
const EARTH_CRACK = mix(C.sandShade, C.timber, 0.5);
const DUST = C.cloudShade;

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws the Superhuman Strength tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4417);

	drawSky(layer);
	drawGround(layer);

	drawFigure(scene);
	drawBoulder(scene);
	drawHands(scene);
	drawPebbles(scene, random);
	drawDust(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawFace(scene);
	return scene;
}

/**
 * Whether a point lies inside a polygon, testing the pixel's centre.
 * @param {number} x
 * @param {number} y
 * @param {readonly (readonly [number, number])[]} points
 * @returns {boolean}
 */
function inPolygon(x, y, points) {
	const px = x + 0.5;
	const py = y + 0.5;
	let inside = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const [xi, yi] = points[i];
		const [xj, yj] = points[j];
		if (
			yi > py !== yj > py &&
			px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
		) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * Whether a pixel lies within a distance of a line segment: a limb with rounded ends.
 * @param {number} x
 * @param {number} y
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r - The limb's half-width
 * @returns {boolean}
 */
function inCapsule(x, y, x0, y0, x1, y1, r) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const t = Math.max(
		0,
		Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))
	);
	return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)) < r;
}

/**
 * Whether a pixel lies inside an ellipse.
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @returns {boolean}
 */
function inEllipse(x, y, cx, cy, rx, ry) {
	return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
}

/**
 * Paints a part lit from the upper left: lit along its upper-left edge, shaded along its lower-right edge,
 * with an ink line where it overlaps parts already painted behind it.
 * @param {Canvas} canvas
 * @param {Shape} shape
 * @param {Tones} tones
 * @param {number} [depth=2] - How deep the shade reaches in from the lower-right edge
 */
function part(canvas, shape, tones, depth = 2) {
	/** @type {[number, number][]} */
	const seams = [];
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!shape(x, y)) {
				if (
					get(canvas, x, y) &&
					NEIGHBOURS.some(([dx, dy]) => shape(x + dx, y + dy))
				) {
					seams.push([x, y]);
				}
				continue;
			}
			let colour = tones.base;
			if (!shape(x + depth, y + depth) || !shape(x + depth + 1, y)) {
				colour = tones.shade;
			}
			if (!shape(x - 1, y - 1)) {
				colour = tones.light;
			}
			set(canvas, x, y, colour);
		}
	}
	for (const [x, y] of seams) {
		set(canvas, x, y, C.ink);
	}
}

/**
 * The day sky: six plain bands from deep blue at the top to pale blue at the ground.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	const bands = [
		C.daySky1,
		C.daySky2,
		C.daySky3,
		C.daySky4,
		C.daySky5,
		C.daySky6,
	];
	for (let y = 0; y < GROUND; y++) {
		rect(layer, 0, y, 64, 1, bands[Math.min(5, Math.floor(y / 10))]);
	}
}

/**
 * The packed earth: a lit top edge, the ground, the figure's shadow and cracks spreading from its feet.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	rect(layer, 0, GROUND, 64, 1, EARTH.light);
	rect(layer, 0, GROUND + 1, 64, 64 - GROUND - 1, EARTH.base);
	for (let y = GROUND + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (inEllipse(x, y, 34, 61, 17, 2.6)) {
				set(layer, x, y, EARTH.shade);
			}
		}
	}
	for (const [x0, y0, x1, y1] of [
		[16, 61, 9, 59],
		[9, 59, 4, 62],
		[48, 61, 54, 59],
		[54, 59, 60, 63],
		[32, 61, 29, 63],
		[12, 60, 10, 63],
	]) {
		line(layer, x0, y0, x1, y1, EARTH_CRACK);
	}
}

/**
 * Whether a pixel lies inside the boulder: an ellipse made lumpy by two waves round its edge.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inBoulder(x, y) {
	const dx = (x + 0.5 - BOULDER.x) / BOULDER.rx;
	const dy = (y + 0.5 - BOULDER.y) / BOULDER.ry;
	const angle = Math.atan2(dy, dx);
	const lumps =
		1 + 0.06 * Math.sin(3 * angle + 1) + 0.04 * Math.sin(7 * angle);
	return Math.hypot(dx, dy) < lumps;
}

/**
 * The boulder: grey stone lit on its upper left, with a few cracks, two facets and a cap of moss.
 * @param {Canvas} scene
 */
function drawBoulder(scene) {
	part(scene, inBoulder, STONE, 3);
	// The moss on its crown, following the boulder's own edge.
	part(
		scene,
		(x, y) =>
			inBoulder(x, y) &&
			!inBoulder(x, y - 3) &&
			x > 14 &&
			x < 42 &&
			!(x > 26 && x < 31 && !inBoulder(x, y - 2)),
		MOSS
	);
	// The facets: two lit planes on the stone's face.
	for (const [x0, y0, x1, y1] of [
		[13, 10, 20, 7],
		[38, 6, 44, 9],
	]) {
		line(scene, x0, y0, x1, y1, C.stoneLight);
	}
	// The cracks.
	for (const [x0, y0, x1, y1] of [
		[24, 12, 28, 16],
		[28, 16, 27, 20],
		[44, 14, 48, 17],
		[48, 17, 51, 16],
		[15, 16, 18, 19],
	]) {
		line(scene, x0, y0, x1, y1, C.stoneShade);
	}
}

/**
 * The figure, back to front: legs, boots, the body in its tunic, the arms raised, then the head.
 * @param {Canvas} scene
 */
function drawFigure(scene) {
	// The legs, bent at the knee in a wide braced stance.
	part(
		scene,
		(x, y) =>
			inCapsule(x, y, 29, 47, 23, 52, 3.2) ||
			inCapsule(x, y, 23, 52, 21, 58, 2.8) ||
			inCapsule(x, y, 35, 47, 41, 52, 3.2) ||
			inCapsule(x, y, 41, 52, 43, 58, 2.8) ||
			inPolygon(x, y, [
				[27, 45],
				[37, 45],
				[37, 49],
				[27, 49],
			]),
		TROUSERS
	);
	// The boots.
	part(scene, (x, y) => inEllipse(x, y, 19.5, 59.5, 4.2, 2.3), LEATHER);
	part(scene, (x, y) => inEllipse(x, y, 44.5, 59.5, 4.2, 2.3), LEATHER);
	// The arms, raised overhead with the elbows thrown wide.
	part(
		scene,
		(x, y) =>
			inCapsule(x, y, 26, 37, 20, 31, 3) ||
			inCapsule(x, y, 20, 31, 21, 25, 2.4) ||
			inCapsule(x, y, 38, 37, 44, 31, 3) ||
			inCapsule(x, y, 44, 31, 43, 25, 2.4),
		SKIN
	);
	// The neck and the shoulders.
	part(
		scene,
		(x, y) =>
			inEllipse(x, y, 25.5, 37.5, 3.4, 3) ||
			inEllipse(x, y, 38.5, 37.5, 3.4, 3) ||
			(x >= 30 && x <= 34 && y >= 33 && y <= 37),
		SKIN
	);
	// The sleeveless tunic, broad at the chest and narrow at the waist.
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[26, 36],
				[30, 36],
				[32, 38],
				[34, 36],
				[38, 36],
				[37, 46],
				[27, 46],
			]),
		TUNIC
	);
	// The belt and its brass buckle.
	part(scene, (x, y) => x >= 27 && x <= 36 && y >= 45 && y <= 46, LEATHER);
	set(scene, 31, 45, C.brass);
	set(scene, 32, 45, C.gold);
	set(scene, 31, 46, C.lampFrame);
	set(scene, 32, 46, C.brass);
	// The head, set between the raised arms.
	part(scene, (x, y) => inEllipse(x, y, 32, 30.5, 3.9, 4.3), SKIN);
	// The short hair.
	part(
		scene,
		(x, y) =>
			inEllipse(x, y, 32, 30.5, 4.1, 4.5) &&
			(y < 28 || (y < 30 && (x < 30 || x > 34))),
		HAIR
	);
}

/**
 * The hands gripping the boulder's underside, painted over the stone.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	part(scene, (x, y) => inEllipse(x, y, 21.5, 23.5, 3.2, 2.6), SKIN);
	part(scene, (x, y) => inEllipse(x, y, 42.5, 23.5, 3.2, 2.6), SKIN);
	// The fingers, curled over the stone.
	for (const x of [20, 22, 41, 43]) {
		set(scene, x, 22, C.skinTanShade);
	}
}

/**
 * Pebbles shaken loose, tumbling off the boulder's sides.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPebbles(scene, random) {
	for (const [x, y] of [
		[7, 31],
		[11, 40],
		[55, 33],
	]) {
		const w = 2 + Math.floor(random() * 2);
		rect(scene, x, y, w, 2, C.stone);
		set(scene, x, y, C.stoneLight);
		set(scene, x + w - 1, y + 1, C.stoneShade);
	}
}

/**
 * Dust bursting out from under the boots as the figure braces.
 * @param {Canvas} scene
 */
function drawDust(scene) {
	for (const [cx, cy, r] of [
		[12, 58, 2.6],
		[9, 59, 2],
		[52, 58, 2.6],
		[55, 59, 2],
	]) {
		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				if (Math.hypot(x - cx, y - cy) < r && y < 61) {
					set(scene, x, y, y < cy - r / 2 ? C.white : DUST);
				}
			}
		}
	}
}

/**
 * The face: eyes squeezed shut, brows knotted and teeth gritted with the effort.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	set(scene, 30, 30, C.ink);
	set(scene, 34, 30, C.ink);
	set(scene, 29, 29, C.wood);
	set(scene, 35, 29, C.wood);
	rect(scene, 31, 33, 3, 1, C.creamLight);
	set(scene, 30, 33, C.skinTanShade);
	set(scene, 34, 33, C.skinTanShade);
}
