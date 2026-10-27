// Urban Farm: a hand in a tan suede work glove holding a ripe tomato palm-up to twist it off the vine, fingers curled round its far side and thumb over the top, in a raised bed on a city roof one cool morning, a basket of greens and a zinc watering can on the bed's rim, a rooftop water tank, a brick chimney stack and the corner of a greenhouse behind.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, r: number }} Fruit */

/**
 * A compound tomato leaf: where its stalk leaves the stem, where its tip lies, how far its stalk bows
 * (to its left as it runs, in pixels), how big its leaflets are, and whether it sits deeper in the plant.
 * @typedef {Object} Leaf
 * @property {Point} base
 * @property {Point} tip
 * @property {number} bow
 * @property {number} size
 * @property {boolean} back
 */

/** The rows of the setting: the far roofs' line, the parapet's coping, the soil and the raised bed's rim. */
const ROWS = { roofline: 34, coping: 40, soil: 51, rim: 54 };

/** The vine's main stem and the bamboo cane it is tied to. */
const STEM_X = 19;
const CANE = { x: 21, top: 1 };

/** The ripe tomato being picked, and the two others on its truss. */
const PICKED = { x: 34, y: 31, r: 8 };
const TRUSS = [
	{ x: 25.5, y: 23, r: 5 },
	{ x: 45, y: 21.5, r: 4.4 },
];

/** The truss's stalk, bowing out from the stem over the fruit. */
const STALK = { base: { x: 20, y: 13 }, tip: { x: 45, y: 14 }, bow: 5 };

/** The green tomatoes on a lower truss to the left, still ripening. */
const GREEN_FRUIT = [
	{ x: 11, y: 22, r: 3 },
	{ x: 6.5, y: 24.5, r: 2.5 },
];

/** The leaves, from the back of the plant to the front. */
/** @type {Leaf[]} */
const LEAVES = [
	{
		base: { x: 20, y: 8 },
		tip: { x: 44, y: 3 },
		bow: 3,
		size: 0.95,
		back: true,
	},
	{
		base: { x: 21, y: 26 },
		tip: { x: 60, y: 31 },
		bow: 4,
		size: 1.1,
		back: true,
	},
	{
		base: { x: 18, y: 40 },
		tip: { x: 3, y: 41 },
		bow: -3,
		size: 0.9,
		back: true,
	},
	{
		base: { x: 18, y: 31 },
		tip: { x: 2, y: 33 },
		bow: -4,
		size: 1,
		back: false,
	},
	{
		base: { x: 20, y: 4 },
		tip: { x: 4, y: 3 },
		bow: -2,
		size: 0.8,
		back: false,
	},
];

/** The picking hand, from the bottom right: the forearm's start and wrist, and half its thickness. */
const ARM = { from: { x: 58, y: 72 }, to: { x: 48, y: 48 }, r: 5 };

/** The picking hand's four fingers, curled round the tomato's far side, from the little finger up to the forefinger: the row each lies along, and where its tip rests on the fruit. */
const FINGERS = [
	{ y: 37.5, tip: 32 },
	{ y: 35, tip: 30.5 },
	{ y: 32.5, tip: 30 },
	{ y: 30, tip: 30.5 },
];

/** The thumb, lying over the top of the tomato: from its root at the heel of the hand, round the shoulder, to its tip. */
const THUMB = [
	{ x: 45, y: 39 },
	{ x: 43.5, y: 30 },
	{ x: 39, y: 25.5 },
];

/** The palm, upturned under the tomato: the heel of the hand at the wrist, its middle and the roots of the fingers, with its half-thickness at each. */
const PALM = [
	{ x: 46, y: 42.5, r: 3.8 },
	{ x: 37, y: 41.5, r: 3.1 },
	{ x: 28.5, y: 39.5, r: 2.4 },
];

/** The rooftop water tank behind on the left: its staves' columns, and the rows of its cap, barrel and stand. */
const TANK = { left: 2, right: 14, cone: 9, barrel: 14, stand: 27 };

/** The chimney stack behind on the right, and the row its cap sits on. */
const CHIMNEY = { left: 46, right: 55, top: 20 };

/** The corner of the greenhouse at the right edge: its first column and the row of its eaves. */
const GREENHOUSE = { left: 58, eaves: 19 };

/** The morning sky: high blue, paler down to a hazy band over the roofs. */
const SKY = [C.daySky2, C.daySky3, C.daySky4, C.daySky5, C.daySky6];
const HAZE = mix(C.daySky6, C.creamLight, 0.45);

/** The far roofs in the haze, the nearer roofs and their windows. */
const CITY_FAR = mix(C.daySky5, C.stoneLight, 0.45);
const CITY = mix(C.daySky4, C.stoneMid, 0.45);
const CITY_WINDOW = mix(C.daySky3, C.stoneMid, 0.55);

/** The tank's weathered staves and the dark steel of its hoops, cap and stand. */
const STAVE_LIGHT = mix(C.timberLight, C.sand, 0.25);
const STEEL = mix(C.stoneShade, C.roofShade, 0.35);
const STEEL_LIGHT = C.stoneMid;

/** The greenhouse's glass, the sky caught in it and its white glazing bars. */
const GLASS = mix(C.daySky5, C.daySky6, 0.5);
const GLASS_GLARE = mix(C.daySky6, C.white, 0.5);

/** The terracotta chimney pots. */
const POT_LIGHT = mix(C.brickRedLight, C.amber, 0.45);
const POT = mix(C.brickRed, C.amber, 0.35);

/** The mortar between bricks. */
const MORTAR = mix(C.brickRedShade, C.stoneMid, 0.45);

/** The ripe tomatoes: the sky's shine on them, then lit, plain, shaded and deep. */
const TOMATO_SHINE = mix(C.brickRedLight, C.white, 0.65);
const TOMATO_DEEP = mix(C.brickRedShade, C.ink, 0.3);
/** @type {[Colour, Colour, Colour, Colour, Colour]} */
const RIPE = [
	TOMATO_SHINE,
	C.brickRedLight,
	C.brickRed,
	C.brickRedShade,
	TOMATO_DEEP,
];

/** The green tomatoes. */
/** @type {[Colour, Colour, Colour, Colour, Colour]} */
const GREEN = [
	C.lampGlow,
	mix(C.grassLight, C.gold, 0.35),
	mix(C.grass, C.grassLight, 0.4),
	C.grassShade,
	C.grassShade,
];

/** The leaves: lit by the low sun, plain and shaded, then the same for the leaves deeper in the plant. */
const LEAF_LIGHT = C.grassLight;
const LEAF = C.grass;
const LEAF_SHADE = C.grassShade;
const LEAF_BACK = C.forestFloor;
const LEAF_BACK_SHADE = C.forestFloorShade;
const STEM = mix(C.grassShade, C.pine, 0.5);
const STEM_LIGHT = C.forestFloorLight;

/** The tan suede work glove: lit, plain, shaded, and the deep shade of the palm under the fruit; then the green knitted cuff and the faded denim sleeve. */
const GLOVE_LIGHT = mix(C.sandLight, C.amber, 0.3);
const GLOVE = mix(C.sand, C.amber, 0.45);
const GLOVE_SHADE = mix(C.sandShade, C.timber, 0.45);
const GLOVE_DEEP = mix(C.timber, C.timberShade, 0.4);
const DENIM_LIGHT = mix(C.daySky2, C.daySky4, 0.3);
const DENIM = C.daySky1;
const DENIM_SHADE = mix(C.daySky1, C.nightSea3, 0.55);

/** The soil in the bed. */
const SOIL = C.floor;
const SOIL_DARK = C.floorShade;
const SOIL_LIGHT = C.floorLight;

/** The zinc watering can. */
const ZINC_LIGHT = mix(C.stoneLight, C.white, 0.4);
const ZINC = C.stoneLight;
const ZINC_SHADE = C.stone;
const ZINC_DARK = C.stoneShade;

/** The wicker basket. */
const WICKER_LIGHT = C.sandLight;
const WICKER = C.sand;
const WICKER_SHADE = C.sandShade;

/** The colours the morning light leaves alone: the hero is lit by hand. */
const KEEP = [
	C.ink,
	C.white,
	...RIPE,
	GLOVE_LIGHT,
	GLOVE,
	GLOVE_SHADE,
	GLOVE_DEEP,
];

/**
 * Draws the Urban Farm landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const vine = createCanvas(64, 64);
	const back = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5309);

	drawSky(layer);
	drawCity(layer, random);

	// The tank, the greenhouse, the chimney, the parapet and the bed stand behind the vine, outlined on their own so the vine still parts from them.
	drawTank(back);
	drawGreenhouse(back);
	drawChimney(back);
	drawParapet(back, random);
	drawBed(back, random);
	outline(back, C.ink);
	underlay(back, layer);

	// The vine is outlined on its own too, so the fruit and the hand stand clear of the leaves.
	drawVine(vine);
	outline(vine, C.ink);
	underlay(vine, back);

	drawTomatoes(scene);
	drawBasket(scene, random);
	drawCan(scene);
	drawHand(scene);
	outline(scene, C.ink);
	underlay(scene, vine);

	// The low morning sun, just risen beyond the roofs on the left, warms that side a little.
	glow(scene, {
		x: -2,
		y: 30,
		radius: 38,
		colour: C.lampGlow,
		strength: 0.2,
		steps: 1,
		skip: KEEP,
	});
	drawDew(scene);
	return scene;
}

/**
 * How far a pixel lies from the middle of an oval, as a share of it: below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @returns {number}
 */
function oval(x, y, cx, cy, rx, ry) {
	return Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
}

/**
 * A point along a bowed stalk from `base` to `tip`: a curve pushed sideways by `bow` at its middle.
 * @param {{ base: Point, tip: Point, bow: number }} stalk
 * @param {number} t - 0 at the base, 1 at the tip
 * @returns {Point}
 */
function along({ base, tip, bow }, t) {
	const dx = tip.x - base.x;
	const dy = tip.y - base.y;
	const length = Math.hypot(dx, dy);
	const push = 4 * t * (1 - t) * bow;
	return {
		x: base.x + dx * t + (dy / length) * push,
		y: base.y + dy * t - (dx / length) * push,
	};
}

/**
 * The morning sky, blue overhead and paling into a pale haze over the roofs, dithered between bands, with one thin cloud.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	const ramp = [...SKY, HAZE];
	for (let y = 0; y <= ROWS.roofline; y++) {
		const t = (y / ROWS.roofline) * (ramp.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < ramp.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? ramp[i + 1] : ramp[i]);
		}
	}
	rect(layer, 27, 7, 10, 1, C.white);
	rect(layer, 30, 6, 5, 1, C.white);
	rect(layer, 25, 8, 14, 1, C.cloudShade);
}

/**
 * The far roofs fading into the haze: a paler row behind and a nearer row of blocks with dim windows.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCity(layer, random) {
	for (let x = 0; x < 64;) {
		const w = 5 + Math.floor(random() * 6);
		const top = 20 + Math.floor(random() * 7);
		rect(layer, x, top, w, ROWS.roofline - top + 1, CITY_FAR);
		x += w;
	}
	for (let x = -2; x < 64;) {
		const w = 6 + Math.floor(random() * 7);
		const top = 26 + Math.floor(random() * 5);
		rect(layer, x, top, w, ROWS.roofline - top + 1, CITY);
		for (let row = top + 2; row < ROWS.roofline; row += 3) {
			for (let cx = x + 1; cx < x + w - 1; cx += 2) {
				if (random() < 0.5) {
					set(layer, cx, row, CITY_WINDOW);
				}
			}
		}
		x += w + 1 + Math.floor(random() * 3);
	}
	rect(layer, 0, ROWS.roofline, 64, 64 - ROWS.roofline, CITY);
}

/**
 * The rooftop water tank: a barrel of timber staves bound with steel hoops under a conical cap, on a steel stand.
 * @param {Canvas} back
 */
function drawTank(back) {
	const { left, right, cone, barrel, stand } = TANK;
	const mid = (left + right) / 2;
	for (let y = cone; y < barrel; y++) {
		const half =
			((y - cone + 1) / (barrel - cone)) * ((right - left) / 2 + 1);
		for (let x = Math.round(mid - half); x <= Math.round(mid + half); x++) {
			set(back, x, y, x < mid - half / 3 ? STEEL_LIGHT : STEEL);
		}
	}
	rect(back, Math.round(mid), cone - 2, 1, 2, STEEL);
	for (let y = barrel; y < stand; y++) {
		for (let x = left; x <= right; x++) {
			const across = (x - left) / (right - left);
			let colour = C.timber;
			if (across < 0.25) {
				colour = STAVE_LIGHT;
			} else if (across < 0.5) {
				colour = C.timberLight;
			} else if (across > 0.8) {
				colour = C.timberShade;
			}
			if ((x - left) % 3 === 2 && across > 0.15) {
				colour = C.timberShade;
			}
			set(back, x, y, colour);
		}
	}
	for (const y of [barrel + 3, stand - 4]) {
		rect(back, left, y, right - left + 1, 1, STEEL);
	}
	rect(back, left - 1, stand, right - left + 3, 1, STEEL);
	for (const x of [left, right]) {
		rect(back, x, stand + 1, 1, ROWS.coping - stand, STEEL);
	}
	line(back, left, stand + 1, right, ROWS.coping - 1, STEEL);
	line(back, right, stand + 1, left, ROWS.coping - 1, STEEL);
}

/**
 * The corner of the rooftop greenhouse at the right edge: glass panes in white glazing bars under a sloping roof, plants green behind the lower panes.
 * @param {Canvas} back
 */
function drawGreenhouse(back) {
	const { left, eaves } = GREENHOUSE;
	for (let y = eaves - 6; y < ROWS.coping; y++) {
		for (let x = left; x < 64; x++) {
			// The roof slopes up to the right from the eaves.
			if (y < eaves && eaves - y > (x - left) * 1.2) {
				continue;
			}
			let colour = GLASS;
			if (
				(x - left) % 4 === 0 ||
				y === eaves ||
				(y > eaves && (y - eaves) % 7 === 0)
			) {
				colour = C.white;
			} else if (y > ROWS.coping - 8) {
				colour = (x + y) % 3 === 0 ? C.grassLight : C.grass;
			} else if (Math.abs(x - left - (y - eaves) * 0.5 - 1) < 1) {
				colour = GLASS_GLARE;
			}
			set(back, x, y, colour);
		}
	}
}

/**
 * The brick chimney stack with two terracotta pots on its cap.
 * @param {Canvas} back
 */
function drawChimney(back) {
	const { left, right, top } = CHIMNEY;
	for (let y = top; y < ROWS.coping; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.brickRed;
			if (x === left) {
				colour = C.brickRedLight;
			} else if (x >= right - 1) {
				colour = C.brickRedShade;
			}
			if (y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) {
				colour = x === left ? C.brickRed : MORTAR;
			}
			set(back, x, y, colour);
		}
	}
	rect(back, left - 1, top - 2, right - left + 3, 2, C.stoneLight);
	rect(back, left - 1, top - 1, right - left + 3, 1, C.stone);
	for (const px of [left + 1, left + 6]) {
		for (let y = top - 8; y < top - 2; y++) {
			const narrow = y < top - 5 ? 1 : 0;
			for (let x = px + narrow; x < px + 4 - narrow; x++) {
				set(back, x, y, x === px + narrow ? POT_LIGHT : POT);
			}
		}
		rect(back, px, top - 9, 4, 1, POT_LIGHT);
	}
}

/**
 * The parapet round the roof: a brick wall under a stone coping, behind the bed.
 * @param {Canvas} back
 * @param {() => number} random
 */
function drawParapet(back, random) {
	rect(back, 0, ROWS.coping, 64, 1, C.stoneLight);
	rect(back, 0, ROWS.coping + 1, 64, 1, C.stone);
	for (let y = ROWS.coping + 2; y < ROWS.soil; y++) {
		const course = Math.floor((y - ROWS.coping - 2) / 3);
		for (let x = 0; x < 64; x++) {
			let colour = random() < 0.15 ? C.brickRedLight : C.brickRed;
			if ((y - ROWS.coping - 2) % 3 === 2 || (x + course * 3) % 7 === 0) {
				colour = MORTAR;
			}
			set(back, x, y, colour);
		}
	}
	rect(back, 0, ROWS.coping + 2, 64, 1, C.brickRedShade);
}

/**
 * The raised bed: dark soil in a box of timber planks across the foreground.
 * @param {Canvas} back
 * @param {() => number} random
 */
function drawBed(back, random) {
	for (let y = ROWS.soil; y < ROWS.rim; y++) {
		for (let x = 0; x < 64; x++) {
			const roll = random();
			let colour = SOIL;
			if (roll < 0.2) {
				colour = SOIL_LIGHT;
			} else if (roll < 0.45) {
				colour = SOIL_DARK;
			}
			set(back, x, y, colour);
		}
	}
	rect(back, 0, ROWS.rim, 64, 1, C.timberLight);
	rect(back, 0, ROWS.rim + 1, 64, 1, C.timber);
	rect(back, 0, ROWS.rim + 2, 64, 1, C.timberShade);
	for (let y = ROWS.rim + 3; y < 64; y++) {
		const row = (y - ROWS.rim - 3) % 5;
		let colour = C.timber;
		if (row === 0) {
			colour = C.timberLight;
		} else if (row === 4) {
			colour = C.timberShade;
		}
		rect(back, 0, y, 64, 1, colour);
	}
	for (let y = ROWS.rim + 5; y < 64; y += 5) {
		const from = Math.floor(random() * 40);
		rect(back, from, y, 6 + Math.floor(random() * 8), 1, C.timberShade);
	}
}

/**
 * One leaflet: a pointed oval along a direction, lit on its upper half, with a vein down its middle.
 * @param {Canvas} vine
 * @param {Point} centre
 * @param {number} angle - The way it points, in radians
 * @param {number} length - Half its length
 * @param {number} width - Half its width
 * @param {[Colour, Colour, Colour]} tones - Lit, plain and shaded
 */
function drawLeaflet(vine, centre, angle, length, width, [lit, plain, shade]) {
	const ux = Math.cos(angle);
	const uy = Math.sin(angle);
	const reach = Math.ceil(length) + 1;
	for (let y = Math.floor(centre.y - reach); y <= centre.y + reach; y++) {
		for (let x = Math.floor(centre.x - reach); x <= centre.x + reach; x++) {
			const px = x + 0.5 - centre.x;
			const py = y + 0.5 - centre.y;
			const a = px * ux + py * uy;
			const side = -px * uy + py * ux;
			const t = a / length;
			// Rounder at the base, drawn to a point at the tip.
			const shape = t > 0 ? 1 - t * t : 1 - t * t * t * t;
			const half = width * Math.sqrt(Math.max(0, shape));
			if (shape <= 0 || Math.abs(side) > half) {
				continue;
			}
			// Light comes from above, so the half facing up is lit and the half facing down is shaded at its edge.
			const up = side * (ux >= 0 ? 1 : -1) < 0;
			let colour = up ? lit : plain;
			if (!up && Math.abs(side) > half * 0.5) {
				colour = shade;
			}
			if (Math.abs(side) < 0.45 && t > -0.75 && t < 0.6 && length > 3) {
				colour = shade;
			}
			set(vine, x, y, colour);
		}
	}
}

/**
 * One compound tomato leaf: a bowed stalk with two pairs of leaflets along it and a bigger leaflet at its tip.
 * @param {Canvas} vine
 * @param {Leaf} leaf
 */
function drawLeaf(vine, leaf) {
	/** @type {[Colour, Colour, Colour]} */
	const tones = leaf.back
		? [LEAF, LEAF_BACK, LEAF_BACK_SHADE]
		: [LEAF_LIGHT, LEAF, LEAF_SHADE];
	drawStalk(vine, leaf, leaf.back ? LEAF_BACK_SHADE : STEM, null);
	for (const t of [0.42, 0.72]) {
		const p = along(leaf, t);
		const q = along(leaf, t + 0.05);
		const heading = Math.atan2(q.y - p.y, q.x - p.x);
		const scale = leaf.size * (t < 0.5 ? 0.85 : 1);
		for (const turn of [-1, 1]) {
			const angle = heading + turn * 0.95;
			const reach = 3.4 * scale;
			drawLeaflet(
				vine,
				{
					x: p.x + Math.cos(angle) * reach,
					y: p.y + Math.sin(angle) * reach,
				},
				angle,
				3.6 * scale,
				1.9 * scale,
				tones
			);
		}
	}
	const end = along(leaf, 1);
	const before = along(leaf, 0.9);
	const heading = Math.atan2(end.y - before.y, end.x - before.x);
	drawLeaflet(
		vine,
		{
			x: end.x - Math.cos(heading) * 1.5,
			y: end.y - Math.sin(heading) * 1.5,
		},
		heading,
		4.8 * leaf.size,
		2.6 * leaf.size,
		tones
	);
}

/**
 * Paints a bowed stalk, one pixel wide, with an optional lit line along its upper edge.
 * @param {Canvas} vine
 * @param {{ base: Point, tip: Point, bow: number }} stalk
 * @param {Colour} colour
 * @param {Colour | null} light
 */
function drawStalk(vine, stalk, colour, light) {
	const steps = Math.ceil(
		Math.hypot(stalk.tip.x - stalk.base.x, stalk.tip.y - stalk.base.y) * 1.5
	);
	for (let i = 0; i <= steps; i++) {
		const p = along(stalk, i / steps);
		const x = Math.round(p.x);
		const y = Math.round(p.y);
		set(vine, x, y, colour);
		if (light) {
			set(vine, x, y - 1, light);
		}
	}
}

/**
 * The tomato vine: the leaves at the back, the main stem tied up the cane, the leaves in front and the trusses' stalks.
 * @param {Canvas} vine
 */
function drawVine(vine) {
	for (const leaf of LEAVES.filter((l) => l.back)) {
		drawLeaf(vine, leaf);
	}
	// The cane, with its nodes, and the stem beside it, a little crooked, tied on with twine.
	for (let y = CANE.top; y <= ROWS.soil; y++) {
		set(vine, CANE.x, y, y % 8 === 0 ? C.sandShade : C.sand);
		set(vine, CANE.x + 1, y, C.sandShade);
	}
	for (let y = 2; y <= ROWS.soil; y++) {
		const x = STEM_X - (Math.floor(y / 11) % 2);
		set(vine, x, y, STEM_LIGHT);
		set(vine, x + 1, y, STEM);
	}
	for (const y of [10, 29, 45]) {
		rect(vine, STEM_X - 1, y, 4, 1, C.creamLight);
	}
	for (const leaf of LEAVES.filter((l) => !l.back)) {
		drawLeaf(vine, leaf);
	}
	// The ripe truss's stalk, and a short stalk with a knuckle down to each tomato's top.
	drawStalk(vine, STALK, STEM, STEM_LIGHT);
	for (const fruit of [PICKED, ...TRUSS]) {
		const t = Math.min(
			1,
			Math.max(0, (fruit.x - STALK.base.x) / (STALK.tip.x - STALK.base.x))
		);
		const from = along(STALK, t);
		const knuckle = { x: fruit.x - 1, y: (from.y + fruit.y - fruit.r) / 2 };
		line(
			vine,
			Math.round(from.x),
			Math.round(from.y),
			Math.round(knuckle.x),
			Math.round(knuckle.y),
			STEM
		);
		line(
			vine,
			Math.round(knuckle.x),
			Math.round(knuckle.y),
			Math.round(fruit.x),
			Math.round(fruit.y - fruit.r),
			STEM
		);
	}
	// The green truss's stalk, out to the left.
	line(vine, STEM_X, 17, 9, 19, STEM);
	line(vine, 9, 19, 7, 22, STEM);
}

/**
 * One tomato: a glossy sphere, a little wider than tall, lit from the upper left, with its green calyx on top.
 * @param {Canvas} canvas
 * @param {Fruit} t
 * @param {[Colour, Colour, Colour, Colour, Colour]} tones - Shine, lit, plain, shaded and deep
 */
function drawTomato(canvas, t, [shine, lit, plain, shade, deep]) {
	for (let y = Math.floor(t.y - t.r); y <= t.y + t.r; y++) {
		for (let x = Math.floor(t.x - t.r - 1); x <= t.x + t.r + 1; x++) {
			const d = oval(x, y, t.x, t.y, t.r * 1.08, t.r);
			if (d >= 1) {
				continue;
			}
			const u = (x + 0.5 - t.x) / t.r;
			const v = (y + 0.5 - t.y) / t.r;
			const facing = -u * 0.6 - v * 0.8;
			let colour = plain;
			if (facing > 0.42) {
				colour = lit;
			} else if (facing < -0.62 && d > 0.6) {
				colour = deep;
			} else if (facing < -0.2) {
				colour = shade;
			}
			set(canvas, x, y, colour);
		}
	}
	// The shine: a small window of morning sky caught on the skin.
	const sx = Math.round(t.x - t.r * 0.45);
	const sy = Math.round(t.y - t.r * 0.5);
	set(canvas, sx, sy, shine);
	if (t.r > 5) {
		set(canvas, sx + 1, sy, shine);
		set(canvas, sx - 1, sy + 1, shine);
	}
	// The calyx: a star of thin sepals splayed over the shoulder round the stalk.
	const cx = Math.round(t.x);
	const cy = Math.round(t.y - t.r + 0.5);
	const spread = Math.max(1, Math.round(t.r / 3));
	set(canvas, cx, cy, STEM);
	for (let i = 1; i <= spread; i++) {
		set(canvas, cx - i, cy + Math.ceil(i / 2), LEAF);
		set(canvas, cx + i, cy + Math.ceil(i / 2), LEAF_SHADE);
	}
	set(canvas, cx, cy + 1, LEAF_SHADE);
	if (t.r > 5) {
		set(canvas, cx - 1, cy - 1, LEAF);
		set(canvas, cx + 1, cy - 1, LEAF);
	}
}

/**
 * The tomatoes: the ripe truss being picked, and the green ones lower on the left.
 * @param {Canvas} scene
 */
function drawTomatoes(scene) {
	for (const t of TRUSS) {
		drawTomato(scene, t, RIPE);
	}
	drawTomato(scene, PICKED, RIPE);
	for (const t of GREEN_FRUIT) {
		drawTomato(scene, t, GREEN);
	}
}

/**
 * Paints a rounded limb from `a` to `b` in three tones, lit along one side.
 * @param {Canvas} canvas
 * @param {Point} a
 * @param {Point} b
 * @param {number} r - Half its thickness
 * @param {[Colour, Colour, Colour]} tones - Lit, plain and shaded
 * @param {number} litSide - 1 or -1: which side of the limb faces the light
 */
function drawLimb(canvas, a, b, r, [lit, plain, shade], litSide) {
	const vx = b.x - a.x;
	const vy = b.y - a.y;
	const length = Math.hypot(vx, vy);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const px = x + 0.5 - a.x;
			const py = y + 0.5 - a.y;
			const t = (px * vx + py * vy) / (length * length);
			const side = (px * -vy + py * vx) / length;
			const end = t < 0 ? -t : t > 1 ? t - 1 : 0;
			if (Math.hypot(end * length, side) > r) {
				continue;
			}
			const towards = side * litSide;
			let colour = plain;
			if (towards > r * 0.35) {
				colour = lit;
			} else if (towards < -r * 0.4) {
				colour = shade;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The column where the ripe tomato's edge lies on its left side at a row.
 * @param {number} y
 * @returns {number}
 */
function leftEdge(y) {
	const v = Math.min(1, Math.abs(y - PICKED.y) / PICKED.r);
	return PICKED.x - PICKED.r * 1.08 * Math.sqrt(1 - v * v);
}

/**
 * The picking hand, upturned under the ripe tomato: a denim sleeve and the glove's green cuff from the bottom right,
 * the palm cradling the fruit in its shade, the fingers curled round its far side and the thumb over the top, about to twist it off the truss.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	const { from, to, r } = ARM;
	drawLimb(scene, from, to, r, [DENIM_LIGHT, DENIM, DENIM_SHADE], -1);
	drawLimb(
		scene,
		{ x: 49, y: 50 },
		{ x: 47, y: 45.5 },
		4.6,
		[C.pineLight, C.pine, C.pineShade],
		-1
	);
	// The palm, tapering from the heel of the hand to the roots of the fingers: its upturned face in the tomato's shade, darker underneath.
	for (let i = 0; i < PALM.length - 1; i++) {
		const p = PALM[i];
		const q = PALM[i + 1];
		drawLimb(
			scene,
			p,
			q,
			(p.r + q.r) / 2,
			[GLOVE_SHADE, GLOVE, GLOVE_SHADE],
			1
		);
	}
	// Where the fruit sits in the palm, its weight presses a shadow.
	for (let x = 29; x < 41; x++) {
		const y =
			Math.round(
				PICKED.y +
					PICKED.r *
						Math.sqrt(
							Math.max(
								0,
								1 -
									((x + 0.5 - PICKED.x) /
										(PICKED.r * 1.08)) **
										2
							)
						)
			) + 1;
		if (get(scene, x, y) === GLOVE || get(scene, x, y) === GLOVE_SHADE) {
			set(scene, x, y, GLOVE_DEEP);
		}
	}
	// The fingers, wrapping in round the fruit's left side, tips resting on its face, each lit along its top with a crease beneath.
	for (const { y, tip } of FINGERS) {
		drawLimb(
			scene,
			{ x: leftEdge(y) - 2.2, y: y + 0.6 },
			{ x: tip, y: y - 0.4 },
			1.3,
			[GLOVE_LIGHT, GLOVE, GLOVE_SHADE],
			-1
		);
	}
	for (const { y, tip } of FINGERS.slice(1)) {
		line(
			scene,
			Math.round(leftEdge(y) - 1),
			Math.round(y + 1.6),
			Math.round(tip - 1),
			Math.round(y + 1.2),
			GLOVE_DEEP
		);
	}
	// The thumb over the top, thick at its root and tapering to its tip, lit along its back and shaded where it lies on the fruit.
	const [root, bend, tip] = THUMB;
	/** @type {[Colour, Colour, Colour]} */
	const thumb = [GLOVE_LIGHT, GLOVE, GLOVE_SHADE];
	drawLimb(scene, root, bend, 2.3, thumb, -1);
	drawLimb(scene, bend, tip, 1.7, thumb, -1);
	set(scene, Math.round(tip.x) - 1, Math.round(tip.y), GLOVE_LIGHT);
}

/**
 * The wicker basket on the bed's rim, heaped with the morning's greens and a picked tomato.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBasket(scene, random) {
	const left = 1;
	const right = 18;
	const top = 50;
	const bottom = 61;
	for (const [cx, cy, rx, ry] of [
		[4, 48, 4, 3],
		[10, 46, 5, 4],
		[16, 48, 3.5, 3],
	]) {
		for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
			for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
				const d = oval(x, y, cx, cy, rx, ry);
				if (d >= 1) {
					continue;
				}
				let colour = LEAF;
				if (x + 0.5 - cx < 0 && y + 0.5 - cy < 0) {
					colour = LEAF_LIGHT;
				} else if (d > 0.7 && x + 0.5 > cx) {
					colour = LEAF_SHADE;
				}
				if ((x * 2 + y) % 5 === 0 && d < 0.8) {
					colour = GREEN[1];
				}
				set(scene, x, y, colour);
			}
		}
	}
	drawTomato(scene, { x: 8, y: 49, r: 2.6 }, RIPE);
	for (let y = top; y <= bottom; y++) {
		const inset = Math.floor((y - top) / 6);
		for (let x = left + inset; x <= right - inset; x++) {
			let colour =
				(x + Math.floor((y - top) / 2)) % 2 === 0
					? WICKER
					: WICKER_LIGHT;
			if ((y - top) % 2 === 1) {
				colour = random() < 0.3 ? WICKER : WICKER_SHADE;
			}
			if (x >= right - inset - 1) {
				colour = WICKER_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, left - 1, top, right - left + 3, 1, C.timberLight);
	rect(scene, left - 1, top + 1, right - left + 3, 1, C.timber);
}

/**
 * The zinc watering can on the rim to the right: a round-shouldered body, a handle over the top and a spout with a rose.
 * @param {Canvas} scene
 */
function drawCan(scene) {
	const left = 55;
	const right = 64;
	const top = 49;
	const bottom = 60;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const across = (x - left) / (right - left);
			let colour = ZINC;
			if (across < 0.2) {
				colour = ZINC_LIGHT;
			} else if (across > 0.7) {
				colour = ZINC_SHADE;
			}
			if (y === top + 2 || y === bottom - 1) {
				colour = ZINC_DARK;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, left + 2, top - 4, right - left, 1, ZINC_SHADE);
	rect(scene, left + 2, top - 4, 3, 1, ZINC_LIGHT);
	rect(scene, left + 2, top - 3, 1, 3, ZINC_LIGHT);
	line(scene, left - 1, bottom - 4, left - 5, top - 2, ZINC);
	line(scene, left - 1, bottom - 3, left - 5, top - 1, ZINC_SHADE);
	rect(scene, left - 7, top - 4, 3, 3, ZINC_LIGHT);
	set(scene, left - 6, top - 3, ZINC_DARK);
}

/**
 * Dew on the leaves in the morning sun, over the outline.
 * @param {Canvas} scene
 */
function drawDew(scene) {
	for (const [x, y] of [
		[52, 9],
		[8, 31],
		[55, 30],
		[11, 2],
	]) {
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, C.white);
		}
	}
}
