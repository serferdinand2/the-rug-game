// Bridge: from under the stone bridge on a bright day, the ribbed vault of the arch frames the sunlit river and green banks beyond, a rower in a white boat glides out over the arch's reflection and swallows dart under it.
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
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** Where the vault's courses meet, at the centre of the far arch, and the far arch's half-width; its rise is lower. */
const VAULT = { x: 32, y: 34, r: 26, rise: 22 };

/** The rows the far arch springs from and where the water meets the far piers. */
const SPRING = VAULT.y;
const WATERLINE = 40;

/** The sky's last row, where the far land begins. */
const HORIZON = 24;

/** The ribs across the vault, as radii from its centre: the far arch ring, the middle rib and the near rib. */
const RIBS = [
	{ from: 26, to: 30 },
	{ from: 34, to: 37.5 },
	{ from: 43, to: 47 },
];

/** The boat: its centre column, the bow's row and the transom's bottom row. */
const BOAT = { x: 33, bow: 44, stern: 58 };

/** The vault's stone in the bridge's shade: lit by daylight on the far ring, darker towards the viewer. */
const RING = mix(C.stone, C.stoneLight, 0.35);
const RING_ALT = C.stone;
const RING_JOINT = C.stoneMid;
const RIB = C.stoneMid;
const RIB_LIT = C.stone;
const SLAB = mix(C.stoneShade, C.night, 0.15);
const SLAB_DARK = mix(C.stoneShade, C.night, 0.35);
const JOINT = mix(C.stoneShade, C.night, 0.6);

/** Light thrown up from the sunlit water onto the stone, in rippling lines. */
const CAUSTIC = mix(C.stoneLight, C.tealLight, 0.5);
const CAUSTIC_DIM = mix(C.stoneMid, C.teal, 0.35);

/** Green slime at the piers' waterline. */
const ALGAE = mix(C.stoneShade, C.forestFloor, 0.55);
const ALGAE_DARK = mix(C.forestFloorShade, C.night, 0.3);

/** The river in the bridge's shadow, and the ripples that break the arch's reflection. */
const WATER = mix(C.tealShade, C.nightSea3, 0.45);
const WATER_DEEP = mix(C.tealShade, C.night, 0.45);
const RIPPLE_DARK = mix(C.tealShade, C.night, 0.6);

/** The rower: a straw boater with a red band, a red-and-cream striped jersey and dark skin. */
const STRAW = C.sandLight;
const SHIRT = C.brickRed;
const SHIRT_LIT = C.creamLight;
const SKIN = C.skinDeep;
const SKIN_SHADE = C.skinDeepShade;

/** The boat's white hull with a blue stripe, and its varnished planks inside. */
const HULL = C.creamLight;
const HULL_SHADE = C.cream;
const STRIPE = C.daySky1;
const INSIDE = C.timberLight;
const INSIDE_SHADE = C.timber;
const OAR = mix(C.timberLight, C.sand, 0.4);

/** The swallows: blue-black, with pale bellies. */
const SWALLOW = mix(C.roofShade, C.night, 0.4);

/**
 * Draws the Bridge landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(58303);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawFarLand(layer, random);
	drawRiver(layer, random);
	drawWillow(layer);
	drawReflection(layer, random);

	// The vault is outlined on its own so the arch stands sharp against the bright day beyond.
	const vault = createCanvas(64, 64);
	drawSoffit(vault);
	drawPiers(vault);
	drawCaustics(vault, random);
	outline(vault, C.ink);
	underlay(vault, layer);

	const boat = createCanvas(64, 64);
	drawOars(boat);
	drawHull(boat);
	drawRower(boat);
	outline(boat, C.ink);
	underlay(boat, vault);

	drawSplashes(boat);
	drawSwallows(boat);
	return boat;
}

/**
 * Tells whether a pixel looks out through the far arch, past the bridge.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inOpening(x, y) {
	if (y > WATERLINE) {
		return false;
	}
	if (y > SPRING) {
		return x >= VAULT.x - VAULT.r && x < VAULT.x + VAULT.r;
	}
	return reach(x, y) < VAULT.r;
}

/**
 * How far a pixel lies from the vault's centre, measured so the far arch's rim is VAULT.r all round:
 * the further out, the nearer the viewer.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function reach(x, y) {
	return Math.hypot(
		x + 0.5 - VAULT.x,
		((y + 0.5 - VAULT.y) * VAULT.r) / VAULT.rise
	);
}

/**
 * The land beyond: a far line of wooded hills and the two green banks running away beside the river.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFarLand(layer, random) {
	let top = HORIZON - 2;
	for (let x = 0; x < 64; x++) {
		top = Math.max(
			HORIZON - 4,
			Math.min(HORIZON, top + Math.floor(random() * 3) - 1)
		);
		for (let y = top; y <= WATERLINE; y++) {
			set(
				layer,
				x,
				y,
				y < HORIZON + 2 ? mix(C.pineLight, C.daySky5, 0.45) : C.grass
			);
		}
	}
	// The banks: meadow in the sun, paler in the distance.
	for (let y = HORIZON + 2; y <= WATERLINE; y++) {
		for (let x = 0; x < 64; x++) {
			const lit = (x * 3 + y * 5) % 11 === 0;
			set(
				layer,
				x,
				y,
				lit
					? C.grassLight
					: y > HORIZON + 8
						? C.grass
						: mix(C.grass, C.grassLight, 0.4)
			);
		}
	}
	// A row of trees along the left bank, shrinking into the distance.
	for (const [cx, base, r] of [
		[10, HORIZON + 6, 4],
		[17, HORIZON + 4, 3],
		[22, HORIZON + 3, 2],
	]) {
		for (let y = base - r * 2; y <= base; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				if (Math.hypot(x - cx, (y - base + r) * 0.9) <= r + 0.3) {
					set(layer, x, y, x < cx ? C.pineLight : C.pine);
				}
			}
		}
		rect(layer, cx, base, 1, 2, C.timberShade);
	}
}

/**
 * Half the river's width on a row of the sunlit reach beyond the bridge, narrowing into the distance.
 * @param {number} y
 * @returns {number}
 */
function riverHalf(y) {
	return 3 + Math.round((y - HORIZON - 1) * 1.6);
}

/**
 * The sunlit river running away between its banks, glinting.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRiver(layer, random) {
	const centre = 34;
	for (let y = HORIZON + 1; y <= WATERLINE; y++) {
		const half = riverHalf(y);
		for (let x = centre - half; x <= centre + half; x++) {
			let colour =
				y < HORIZON + 6
					? C.daySeaLine
					: y < HORIZON + 11
						? C.daySea1
						: C.dayWaveDeep;
			if (x === centre - half || x === centre + half) {
				colour = C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 14; i++) {
		const y =
			HORIZON + 3 + Math.floor(random() * (WATERLINE - HORIZON - 3));
		const half = riverHalf(y) - 2;
		const x =
			centre - half + Math.floor(random() * Math.max(1, half * 2 - 2));
		rect(layer, x, y, 2 + Math.floor(random() * 3), 1, C.dayWave);
	}
}

/**
 * A weeping willow on the right bank, trailing its branches to the water.
 * @param {Canvas} layer
 */
function drawWillow(layer) {
	const cx = 50;
	const top = HORIZON - 9;
	for (let y = top; y <= WATERLINE - 3; y++) {
		const half = Math.min(8, 2 + (y - top));
		for (let x = cx - half; x <= cx + half; x++) {
			const strand = (x + Math.floor(y / 3)) % 3;
			const lower = y > top + 9;
			if (lower && strand === 0) {
				continue;
			}
			let colour = strand === 1 ? C.grassLight : C.grass;
			if (x > cx + half - 3) {
				colour = C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, cx - 1, WATERLINE - 7, 2, 5, C.timberShade);
}

/**
 * The river under the bridge, in its shade: dark, but mirroring the bright arch, broken into ripples.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawReflection(layer, random) {
	/** @type {Map<Colour, Colour>} */
	const mirrored = new Map();
	for (let y = WATERLINE + 1; y < 64; y++) {
		const sway = Math.round(Math.sin(y * 1.3) * 0.8);
		const dim = y > 54 ? 0.55 : 0.42;
		for (let x = 0; x < 64; x++) {
			const sx = x + sway;
			const sy = WATERLINE * 2 - y;
			let colour = y > 54 ? WATER_DEEP : WATER;
			if (inOpening(sx, sy)) {
				const source = get(layer, sx, sy) ?? C.daySky5;
				const key = `${source}${dim}`;
				if (!mirrored.has(source + dim)) {
					mirrored.set(key, mix(source, WATER, dim));
				}
				colour = mirrored.get(key) ?? WATER;
			}
			set(layer, x, y, colour);
		}
	}
	// Dark ripple lines breaking up the reflection, longer near the viewer.
	for (let i = 0; i < 34; i++) {
		const y = WATERLINE + 2 + Math.floor(random() * (63 - WATERLINE - 2));
		const x = Math.floor(random() * 60);
		const n = 2 + Math.floor(random() * (2 + (y - WATERLINE) / 5));
		rect(layer, x, y, n, 1, RIPPLE_DARK);
	}
	// The bridge's shadow edge across the sunlit water just beyond the arch.
	for (let x = 0; x < 64; x++) {
		if (get(layer, x, WATERLINE) !== C.grassShade) {
			set(layer, x, WATERLINE, C.daySea2);
		}
	}
}

/**
 * The vault's underside: the far arch ring of voussoirs lit by the day, a middle rib and a near rib,
 * with recessed courses of darker stone between them, all meeting at the vault's centre in perspective.
 * @param {Canvas} vault
 */
function drawSoffit(vault) {
	for (let y = 0; y <= SPRING; y++) {
		for (let x = 0; x < 64; x++) {
			if (inOpening(x, y)) {
				continue;
			}
			const r = reach(x, y);
			const angle = Math.atan2(
				((VAULT.y - y - 0.5) * VAULT.r) / VAULT.rise,
				x + 0.5 - VAULT.x
			);
			set(vault, x, y, soffitColour(r, angle));
		}
	}
}

/**
 * The colour of one point of the vault's underside.
 * @param {number} r - Its distance from the vault's centre: the further, the nearer the viewer
 * @param {number} angle - Its angle round the arch, 0 on the right and π on the left
 * @returns {Colour}
 */
function soffitColour(r, angle) {
	const rib = RIBS.findIndex(({ from, to }) => r >= from && r < to);
	if (rib === 0) {
		// The far ring: wedge-shaped voussoirs, the keystone at the crown.
		const stones = 17;
		const k = (angle / Math.PI) * stones;
		if (Math.abs(k - Math.floor(k) - 0.5) > 0.42) {
			return RING_JOINT;
		}
		const keystone = Math.floor(k) === Math.floor(stones / 2);
		if (keystone) {
			return C.stoneLight;
		}
		return Math.floor(k) % 2 ? RING : RING_ALT;
	}
	if (rib > 0) {
		const { from, to } = RIBS[rib];
		if (r < from + 1) {
			return RIB_LIT;
		}
		if (r >= to - 1) {
			return JOINT;
		}
		const k = (angle / Math.PI) * 22;
		return Math.abs(k - Math.floor(k) - 0.5) > 0.4 ? SLAB : RIB;
	}
	// Recessed courses between the ribs, in staggered rows.
	const course = Math.floor(r / 3);
	const k = (angle / Math.PI) * 12 + (course % 2) * 0.5;
	if (r % 3 < 0.8 || Math.abs(k - Math.floor(k) - 0.5) > 0.44) {
		return JOINT;
	}
	return r > RIBS[1].to ? SLAB_DARK : SLAB;
}

/**
 * The piers' inner faces below the springing, their courses running towards the far arch, green with slime at the water.
 * @param {Canvas} vault
 */
function drawPiers(vault) {
	for (let y = SPRING + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (x >= VAULT.x - VAULT.r && x < VAULT.x + VAULT.r) {
				continue;
			}
			// How far the pier's face reaches towards the viewer at this column.
			const depth = Math.abs(x + 0.5 - VAULT.x) / VAULT.r;
			const water = SPRING + (WATERLINE - SPRING) * depth;
			if (y > water + 0.5) {
				continue;
			}
			const height = (y - SPRING) / depth;
			let colour = Math.round(height * 2) % 3 === 0 ? JOINT : SLAB;
			if (y > water - 1.5) {
				colour = ALGAE_DARK;
			} else if (y > water - 3) {
				colour = ALGAE;
			}
			set(vault, x, y, colour);
		}
	}
}

/**
 * Wavering light thrown up from the river onto the vault's lower courses: short rippling squiggles,
 * brightest near the far arch.
 * @param {Canvas} vault
 * @param {() => number} random
 */
function drawCaustics(vault, random) {
	/** @type {[number, number, number][]} */
	const squiggles = [];
	for (let i = 0; i < 30; i++) {
		// Most of the light falls low on the vault, nearest the water.
		const y = SPRING - Math.floor(random() ** 1.6 * 26);
		const side = random() < 0.5 ? -1 : 1;
		const x =
			VAULT.x +
			side * (VAULT.r + 1 + Math.floor(random() * 12)) -
			(side > 0 ? 0 : 4);
		squiggles.push([x, y, 3 + Math.floor(random() * 3)]);
	}
	for (const [x0, y0, length] of squiggles) {
		for (let i = 0; i < length; i++) {
			const x = x0 + i;
			const y = y0 + Math.round(Math.sin(i * 1.4) * 0.7);
			const colour = get(vault, x, y);
			if (!colour) {
				continue;
			}
			const r = reach(x, y);
			set(vault, x, y, r < RIBS[1].from ? CAUSTIC : CAUSTIC_DIM);
		}
	}
}

/**
 * The two oars, reaching out from the rowlocks to their blades in the water.
 * @param {Canvas} boat
 */
function drawOars(boat) {
	const { x } = BOAT;
	line(boat, x - 5, 47, x - 19, 52, OAR);
	line(boat, x + 5, 47, x + 19, 52, OAR);
	rect(boat, x - 22, 52, 4, 2, OAR);
	rect(boat, x + 19, 52, 4, 2, OAR);
}

/**
 * The rowing boat from astern: white planking with a blue stripe round the transom, varnished inside,
 * pointing away towards the light.
 * @param {Canvas} boat
 */
function drawHull(boat) {
	const { x: cx, bow, stern } = BOAT;
	const transom = stern - 3;
	for (let y = bow; y <= transom; y++) {
		const half = Math.min(7, Math.round((y - bow) * 0.75));
		for (let x = cx - half; x <= cx + half; x++) {
			const edge = Math.abs(x - cx) === half;
			let colour =
				(y + (x > cx ? 1 : 0)) % 3 === 0 ? INSIDE_SHADE : INSIDE;
			if (edge) {
				colour = x < cx ? HULL : HULL_SHADE;
			}
			set(boat, x, y, colour);
		}
	}
	// The rower's thwart across the middle and the stern seat.
	rect(boat, cx - 5, 50, 11, 1, C.timberShade);
	rect(boat, cx - 6, transom - 1, 13, 1, INSIDE_SHADE);
	// The transom's flat stern, curving under.
	for (let y = transom + 1; y <= stern; y++) {
		const half = 7 - (y - transom - 1);
		for (let x = cx - half; x <= cx + half; x++) {
			let colour = x < cx ? HULL : HULL_SHADE;
			if (y === transom + 2) {
				colour = STRIPE;
			}
			set(boat, x, y, colour);
		}
	}
}

/**
 * The rower on the thwart, facing astern towards the viewer, elbows out as he pulls the oars in.
 * @param {Canvas} boat
 */
function drawRower(boat) {
	paint(
		boat,
		BOAT.x - 5,
		37,
		[
			'...lllll...',
			'...rrrrr...',
			'.yyyyyyyyy.',
			'...kkkkk...',
			'...keske...',
			'...kkkkk...',
			'....sss....',
			'..wwwwwww..',
			'.krrrrrrrk.',
			'.kwwwwwwwk.',
			'k.rrrrrrr.k',
			'k.wwwwwww.k',
		],
		{
			l: C.lampGlow,
			y: STRAW,
			r: SHIRT,
			k: SKIN,
			s: SKIN_SHADE,
			e: C.ink,
			w: SHIRT_LIT,
		}
	);
}

/**
 * Splashes where the blades bite the water.
 * @param {Canvas} canvas
 */
function drawSplashes(canvas) {
	for (const x of [BOAT.x - 21, BOAT.x + 21]) {
		set(canvas, x - 3, 54, C.foam);
		set(canvas, x + 3, 54, C.foam);
		rect(canvas, x - 2, 55, 5, 1, C.dayWave);
	}
}

/**
 * Swallows darting through the arch: dark against the sky and the stone, one showing its pale belly.
 * @param {Canvas} canvas
 */
function drawSwallows(canvas) {
	const keys = { k: SWALLOW, w: C.creamLight };
	// One banking across the far ring, pale belly turned to the water; two further out against the sky.
	paint(
		canvas,
		41,
		8,
		[
			'.........k',
			'k.......kk',
			'kk.....kk.',
			'.kkk.kkk..',
			'...kwwk...',
			'...k..k...',
			'..k....k..',
		],
		keys
	);
	paint(
		canvas,
		15,
		14,
		[
			'k......k',
			'kk....kk',
			'.kk..kk.',
			'..kkkk..',
			'...kk...',
			'..k..k..',
		],
		keys
	);
	paint(canvas, 27, 17, ['k.....k', '.kk.kk.', '...k...', '..k.k..'], keys);
}
