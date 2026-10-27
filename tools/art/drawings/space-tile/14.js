// Space tile 14 (farm): a field of tall blue-green alien grain, each ear a nodding head of round pearl-like seeds rimmed gold, as two suns set together behind low hills in a green-gold sky.
import {
	createCanvas,
	set,
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
 * One stalk of grain: its foot's column, the row its ear starts, the ear's length, its seeds' largest radius,
 * and how far the ear nods over to the right at its tip.
 * @typedef {{ x: number, base: number, length: number, r: number, nod: number }} Stalk
 */

/** The last row of sky behind the far hills. */
const HORIZON = 37;

/** The field's first row, under the near hills. */
const FIELD = 41;

/** The two suns, the larger and its smaller twin, setting together: their bottoms already behind the hills. */
const SUNS = [
	{ x: 36, y: 32, r: 5.2 },
	{ x: 45, y: 34, r: 3.2 },
];

/** Where the light comes from, between the suns. */
const LIGHT = { x: 40, y: 33 };

/**
 * The nearest stalks, outlined in front of the field: a cluster at the left round the hero, the tallest,
 * and two at the right, leaving the suns clear.
 * @type {Stalk[]}
 */
const NEAR = [
	{ x: 58, base: 43, length: 11, r: 1.6, nod: 3 },
	{ x: 52, base: 34, length: 15, r: 1.8, nod: 4 },
	{ x: 8, base: 35, length: 14, r: 1.8, nod: 4 },
	{ x: 18, base: 40, length: 12, r: 1.6, nod: 3 },
	{ x: 24, base: 35, length: 16, r: 1.9, nod: 5 },
	{ x: 13, base: 31, length: 22, r: 2.1, nod: 6 },
];

/** How far up an ear it stands straight before it curls over under its weight. */
const BEND = 0.45;

/** Long thin clouds across the glow: each one's left column, its row and its length. */
const CLOUDS = [
	[24, 9, 22],
	[0, 20, 15],
	[40, 22, 12],
	[52, 25, 11],
];

/** The sky from the top down: deep teal-green, through green and lime, to gold above the hills. */
const SKY = [
	mix(C.tealShade, C.night, 0.45),
	mix(C.tealShade, C.pineShade, 0.4),
	mix(C.pine, C.teal, 0.35),
	mix(C.grassLight, C.teal, 0.35),
	mix(C.grassLight, C.gold, 0.5),
	C.gold,
];

/** Long thin clouds, dark against the glow, their undersides lit. */
const CLOUD = mix(C.pineShade, C.tealShade, 0.4);
const CLOUD_LIT = mix(C.grassLight, C.gold, 0.3);

/** The suns: white cores fading to gold rims. */
const SUN = [C.white, C.lampGlow, C.gold];

/** The hills: the far range hazy olive with a gold-lit crest, the near one dark green. */
const FAR_HILL = mix(C.pine, C.grassShade, 0.5);
const FAR_HILL_LIT = mix(C.grassLight, C.gold, 0.6);
const NEAR_HILL = mix(C.pineShade, C.tealShade, 0.5);

/** The field's dark ground between the stalks. */
const GROUND = mix(C.pineShade, C.tealShade, 0.55);
const GROUND_DARK = mix(C.tealShade, C.night, 0.5);
const GROUND_FAR = mix(GROUND, FAR_HILL, 0.5);

/** The grain's stems: lit gold along their sunward edges, blue-green, and dark. */
const STEM_LIT = mix(C.grassLight, C.gold, 0.45);
const STEM = mix(C.tealShade, C.grassShade, 0.5);
const STEM_DARK = mix(C.tealShade, C.night, 0.35);

/** The field's leaf blades, catching a little of the light. */
const LEAF = mix(STEM, STEM_LIT, 0.4);

/** The seeds, against the light: a gold rim where the suns shine through, glowing mint, blue-green and shaded. */
const SEED = {
	rim: C.gold,
	lit: mix(C.tealLight, C.grassLight, 0.4),
	base: mix(C.teal, C.grassShade, 0.4),
	shade: mix(C.tealShade, C.pineShade, 0.4),
	dark: mix(C.tealShade, C.night, 0.25),
};

/** The field's seeds in the shade of the ears around them. */
const FIELD_SEED = mix(SEED.shade, C.night, 0.25);

/** The far ears, hazy in the glow, and their pale tips. */
const HAZE = mix(SEED.shade, FAR_HILL, 0.55);
const HAZE_TIP = mix(STEM_LIT, FAR_HILL_LIT, 0.5);

/**
 * Draws space tile 14.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(14141);

	drawSky(layer);
	drawSuns(layer);
	glow(layer, {
		x: LIGHT.x,
		y: LIGHT.y,
		radius: 26,
		colour: C.lampGlow,
		strength: 0.45,
		steps: 4,
		skip: SUN,
	});
	drawClouds(layer);
	drawHills(layer);
	drawField(layer, random);
	drawFeet(layer, random);
	drawGlare(layer);
	for (const stalk of NEAR) {
		drawStem(layer, stalk);
	}

	const fg = createCanvas(64, 64);
	for (const stalk of NEAR) {
		drawEar(fg, stalk);
	}
	outline(fg, C.ink);
	underlay(fg, layer);

	for (const stalk of NEAR) {
		drawGlints(fg, stalk);
	}
	drawDrift(fg, random);
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
 * The direction from a point to the suns, as a unit vector.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function towardsSuns(x, y) {
	const dx = LIGHT.x - x;
	const dy = LIGHT.y - y;
	const d = Math.hypot(dx, dy) || 1;
	return { x: dx / d, y: dy / d };
}

/**
 * A point along an ear, from its base (0) to its tip (1): upright at first, then curling over
 * to the right with the breeze, its tip drooping under the weight of the seeds.
 * @param {Stalk} stalk
 * @param {number} t
 * @returns {{ x: number, y: number }}
 */
function along({ x, base, length, nod }, t) {
	const s = Math.max(0, (t - BEND) / (1 - BEND));
	return { x: x + nod * s * s, y: base - length * t + nod * 0.55 * s * s };
}

/**
 * The seeds of an ear: two rows of round seeds set alternately up its length, shrinking to the tip.
 * @param {Stalk} stalk
 * @returns {{ x: number, y: number, r: number, side: number, t: number }[]}
 */
function seedsOf(stalk) {
	const count = Math.max(3, Math.round(stalk.length / stalk.r));
	return Array.from({ length: count }, (_, k) => {
		const t = k / (count - 1);
		const point = along(stalk, t);
		const r = stalk.r * (1 - 0.4 * t);
		const side = k % 2 === 0 ? -1 : 1;
		return { x: point.x + side * r * 0.6, y: point.y, r, side, t };
	});
}

/**
 * The green-gold sky, dithered between its bands, with the first faint stars at the top.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
	for (const [x, y] of [
		[34, 3],
		[52, 6],
		[27, 8],
		[59, 13],
		[40, 1],
	]) {
		set(layer, x, y, C.starDim);
	}
}

/**
 * The twin suns, white-hot at their cores and gold at their rims.
 * @param {Canvas} layer
 */
function drawSuns(layer) {
	for (const { x: cx, y: cy, r } of SUNS) {
		ellipse(layer, cx, cy, r, r, (nx, ny) => {
			const d = Math.hypot(nx, ny);
			if (d < 0.55) {
				return SUN[0];
			}
			return d < 0.85 ? SUN[1] : SUN[2];
		});
	}
}

/**
 * Long thin cloud streaks across the glow: dark, thickest in the middle with a gold-lit underside,
 * tapering and fraying to single pixels at their ends.
 * @param {Canvas} layer
 */
function drawClouds(layer) {
	for (const [x, y, w] of CLOUDS) {
		for (let i = 0; i < w; i++) {
			const thick = Math.sin((i / (w - 1)) * Math.PI);
			if (thick < 0.25 && i % 2) {
				continue;
			}
			if (thick > 0.7) {
				set(layer, x + i, y - 1, CLOUD);
			}
			set(layer, x + i, y + (thick < 0.25 ? 1 : 0), CLOUD);
			if (thick > 0.35) {
				set(layer, x + i, y + 1, CLOUD_LIT);
			}
		}
	}
}

/**
 * The low hills the suns are setting behind: a hazy far range with a gold-lit crest, and a darker near one.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const far = Math.round(
			HORIZON - 2 + 1.6 * Math.sin(x * 0.16 + 0.4) + Math.sin(x * 0.41)
		);
		set(layer, x, far, FAR_HILL_LIT);
		for (let y = far + 1; y <= FIELD; y++) {
			set(layer, x, y, FAR_HILL);
		}
		const near = Math.round(FIELD - 1 + 1.5 * Math.sin(x * 0.1 + 2.2));
		for (let y = near; y <= FIELD; y++) {
			set(layer, x, y, NEAR_HILL);
		}
	}
}

/**
 * The field behind the nearest stalks: dark ground packed with grain, every ear nodding the same way in the breeze,
 * hazy dashes along the hills and bigger seeded ears nearer, painted from the back so the nearer stand in front.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawField(layer, random) {
	for (let y = FIELD + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y > 54 ? GROUND_DARK : GROUND;
			if (y < FIELD + 4) {
				colour = (x + y) % 3 === 0 ? FAR_HILL : GROUND_FAR;
			}
			set(layer, x, y, colour);
		}
	}
	// Each band of the field: its first row, how many rows deep, the ears' spacing, length and seed radius.
	for (const [row, depth, gap, length, r] of [
		[FIELD - 1, 2, 2, 2, 0],
		[FIELD + 1, 3, 2, 3, 0],
		[FIELD + 4, 3, 3, 4, 0.8],
		[FIELD + 8, 4, 4, 6, 1.1],
		[FIELD + 13, 5, 5, 8, 1.4],
	]) {
		for (let x = -gap; x < 64 + gap; x += gap) {
			const base = row + Math.floor(random() * depth);
			/** @type {Stalk} */
			const stalk = {
				x: x + Math.floor(random() * gap),
				base,
				length,
				r,
				nod: Math.round(length * 0.3),
			};
			for (let y = base; y < 64; y++) {
				set(layer, stalk.x, y, STEM_DARK);
			}
			if (r === 0) {
				// Far off, an ear is a hazy dash with a pale tip.
				for (let i = 0; i < length; i++) {
					const p = along(stalk, i / Math.max(1, length - 1));
					set(
						layer,
						Math.round(p.x),
						Math.round(p.y),
						i === length - 1 ? HAZE_TIP : HAZE
					);
				}
				continue;
			}
			paintSeeds(layer, stalk, false);
		}
		// Long blades of leaf arching over among the stalks of this band.
		for (let i = 0; i < 3; i++) {
			const fx = Math.floor(random() * 64);
			const fy = row + depth + Math.floor(random() * 3);
			const n = 3 + Math.floor(length / 2);
			for (let k = 0; k <= n; k++) {
				const t = k / n;
				set(
					layer,
					fx + k,
					fy - Math.round(Math.sin(t * Math.PI * 0.8) * (n / 2)),
					t < 0.5 ? LEAF : STEM
				);
			}
		}
	}
}

/**
 * The grain at the viewer's feet: a dark tangle of stems and leaf blades along the bottom edge.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFeet(layer, random) {
	for (let x = 0; x < 64; x += 2) {
		const top = 54 + Math.floor(random() * 5);
		for (let y = top; y < 64; y++) {
			set(
				layer,
				x + Math.floor(random() * 2),
				y,
				y === top ? STEM : STEM_DARK
			);
		}
	}
	for (let i = 0; i < 7; i++) {
		const fx = Math.floor(random() * 60);
		const fy = 57 + Math.floor(random() * 4);
		for (let k = 0; k <= 6; k++) {
			set(
				layer,
				fx + k,
				fy - Math.round(Math.sin((k / 6) * Math.PI * 0.8) * 3),
				k < 3 ? LEAF : STEM
			);
		}
	}
}

/**
 * The suns' light lying across the far field and the hills beneath them: a wide, low sheen, warmest in the middle.
 * @param {Canvas} layer
 */
function drawGlare(layer) {
	/** @type {Map<string, Colour>} */
	const tinted = new Map();
	for (let y = HORIZON - 4; y <= FIELD + 7; y++) {
		for (let x = 0; x < 64; x++) {
			const reach =
				((x - LIGHT.x) / 22) ** 2 + ((y - FIELD + 1) / 6) ** 2;
			const colour = layer.p[y * 64 + x];
			if (reach >= 1 || !colour || SUN.includes(colour)) {
				continue;
			}
			const strength = reach < 0.35 ? 0.4 : 0.22;
			const key = `${colour}${strength}`;
			if (!tinted.has(key)) {
				tinted.set(key, mix(colour, C.gold, strength));
			}
			set(layer, x, y, tinted.get(key));
		}
	}
}

/**
 * Paints an ear's seeds, each a small round seed lit from behind: a gold rim on the side towards the suns,
 * then glowing mint, blue-green, and shade on the side away.
 * @param {Canvas} canvas
 * @param {Stalk} stalk
 * @param {boolean} near - Whether the ear stands in front, with the full shading
 */
function paintSeeds(canvas, stalk, near) {
	for (const seed of seedsOf(stalk)) {
		const sun = towardsSuns(seed.x, seed.y);
		const r = Math.max(0.7, seed.r);
		// Out in the field, the nearer the ears the deeper they stand in each other's shade.
		const shaded = !near && seed.y > FIELD + 9;
		ellipse(canvas, seed.x + 0.5, seed.y + 0.5, r, r, (nx, ny) => {
			const facing = nx * sun.x + ny * sun.y;
			if (
				facing > (near ? 0.45 : 0.75) &&
				(near || !shaded || ny < -0.6)
			) {
				return shaded ? STEM_LIT : SEED.rim;
			}
			if (!near) {
				return facing > 0.2 && !shaded ? SEED.shade : FIELD_SEED;
			}
			// A seam under each seed, so it stands round against the one below it.
			if (ny > 0.55 && facing < 0.2) {
				return SEED.shade;
			}
			return facing > -0.2 ? SEED.lit : SEED.base;
		});
	}
}

/**
 * One near stalk's stem, rising from the bottom edge to its ear, lit gold on its sunward edge,
 * with a long leaf curling out from it. Painted on the layer, so it stays fine without an outline.
 * @param {Canvas} layer
 * @param {Stalk} stalk
 */
function drawStem(layer, stalk) {
	const { x: foot, base, r } = stalk;
	const side = towardsSuns(foot, base).x > 0 ? 1 : -1;
	for (let y = base; y < 64; y++) {
		set(layer, foot, y, STEM);
		set(layer, foot + side, y, r > 2.4 || y > 50 ? STEM_LIT : STEM);
		if (r > 2.4) {
			set(layer, foot - side, y, STEM_DARK);
		}
	}
	// The leaf: a long blade rising from the stem and curling over with the breeze.
	const length = Math.round(5 + r * 2);
	const ly = Math.round(base + (63 - base) * 0.45);
	for (let k = 1; k <= length; k++) {
		const t = k / length;
		const x = foot + k;
		const y =
			ly -
			Math.round(Math.sin(t * Math.PI * 0.8) * (r * 2)) +
			(t > 0.85 ? 1 : 0);
		set(layer, x, y, t < 0.5 ? STEM_LIT : STEM);
		set(layer, x, y + 1, STEM_DARK);
	}
}

/**
 * One near ear: its stalk running up through it and its two rows of round seeds.
 * @param {Canvas} fg
 * @param {Stalk} stalk
 */
function drawEar(fg, stalk) {
	for (let i = 0; i <= stalk.length; i++) {
		const p = along(stalk, i / stalk.length);
		set(fg, Math.round(p.x), Math.round(p.y), STEM);
	}
	paintSeeds(fg, stalk, true);
}

/**
 * The awns: fine whiskers running on up from the ear's upper seeds along its curve, splayed a little,
 * glowing gold at their ends where the light shines through them.
 * @param {Canvas} canvas
 * @param {Stalk} stalk
 */
function drawGlints(canvas, stalk) {
	for (const seed of seedsOf(stalk)) {
		if (seed.t < 0.4) {
			continue;
		}
		// The ear's direction here, so each awn follows it, leaning out on its seed's side.
		const ahead = along(stalk, Math.min(1, seed.t + 0.05));
		const behind = along(stalk, Math.max(0, seed.t - 0.05));
		const d = Math.hypot(ahead.x - behind.x, ahead.y - behind.y) || 1;
		const dx = (ahead.x - behind.x) / d;
		const dy = (ahead.y - behind.y) / d;
		const out = 0.22 * seed.side;
		const ax = dx - dy * out;
		const ay = dy + dx * out;
		const n = Math.round(2 + seed.t * 3);
		for (let k = 1; k <= n; k++) {
			set(
				canvas,
				Math.round(seed.x + ax * (seed.r + k)),
				Math.round(seed.y + ay * (seed.r + k)),
				k === n ? C.lampGlow : STEM_LIT
			);
		}
	}
}

/**
 * Loose seeds drifting on the evening air, glinting in the light.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawDrift(canvas, random) {
	for (let i = 0; i < 9; i++) {
		const x = 22 + Math.floor(random() * 28);
		const y = 12 + Math.floor(random() * 16);
		set(canvas, x, y, random() > 0.5 ? C.lampGlow : STEM_LIT);
	}
}
