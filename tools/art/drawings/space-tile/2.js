// Space tile 2: a fallen colossus, the huge helmeted head of an alien warrior statue toppled and half sunk in orange dunes under a teal sky, its broken spear beside it and two small moons overhead.
import {
	createCanvas,
	get,
	set,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {[number, number]} Point */

/** The sky's last row, behind the far dunes. */
const HORIZON = 33;

/**
 * The head: its centre (between the eyes), its scale and how far it has toppled onto its right side, in radians.
 * It is drawn upright in its own coordinates, u across and v down, then turned and scaled into the scene.
 */
const HEAD = { x: 31, y: 26, scale: 1.38, tilt: 0.38 };
const COS = Math.cos(HEAD.tilt);
const SIN = Math.sin(HEAD.tilt);

/** Where the sunlight comes from: high on the left and in front. */
const LIGHT = normalise([-0.62, -0.55, 0.56]);

/** The teal alien day, from the top of the sky down to the haze over the dunes. */
const SKY = [
	mix(C.tealShade, C.teal, 0.3),
	mix(C.tealShade, C.teal, 0.65),
	C.teal,
	mix(C.teal, C.tealLight, 0.45),
	mix(C.tealLight, C.ghostLight, 0.4),
	mix(C.ghostLight, C.sandLight, 0.5),
];

/** The orange sand, from the sunlit crests to the deep shade of the lee slopes. */
const SAND_HI = mix(C.sandLight, C.gold, 0.45);
const SAND_LIT = mix(C.amber, C.gold, 0.45);
const SAND = C.amber;
const SAND_MID = mix(C.amber, C.brickRed, 0.35);
const SAND_SHADE = mix(C.amber, C.brickRedShade, 0.55);
const SAND_CONTACT = mix(C.brickRedShade, C.roofShade, 0.3);
const SAND_CAST = mix(SAND_LIT, SAND_SHADE, 0.6);
const SAND_GLINT = mix(SAND_HI, C.white, 0.45);

/**
 * A band of dunes: its valley row, how high its crests rise, how far apart they are and where they start,
 * and its lit, plain and shaded sand.
 * @typedef {{ base: number, amp: number, period: number, offset: number, ramp: [Colour, Colour, Colour] }} DuneBand
 */

/** @type {DuneBand[]} The farthest, far and middle dunes, faded towards the sky by the haze. */
const DUNES = [
	{
		base: 33,
		amp: 1,
		period: 17,
		offset: 9,
		ramp: [
			mix(SAND_HI, SKY[5], 0.72),
			mix(SAND_LIT, SKY[5], 0.72),
			mix(SAND_MID, SKY[4], 0.68),
		],
	},
	{
		base: 35,
		amp: 2,
		period: 29,
		offset: 4,
		ramp: [
			mix(SAND_HI, SKY[5], 0.5),
			mix(SAND_LIT, SKY[5], 0.5),
			mix(SAND_MID, SKY[4], 0.45),
		],
	},
	{
		base: 43,
		amp: 4,
		period: 41,
		offset: 7,
		ramp: [
			mix(SAND_HI, SKY[5], 0.2),
			mix(SAND_LIT, SKY[5], 0.2),
			mix(SAND_SHADE, SKY[4], 0.2),
		],
	},
];

/** The statue's pale grey stone, from highlight to shade, the dark of its hollows and the orange the sand throws up onto it. */
const STONE = [
	mix(C.stoneLight, C.creamLight, 0.55),
	C.stoneLight,
	mix(C.stone, C.stoneLight, 0.45),
	C.stone,
	mix(C.stoneMid, C.stoneShade, 0.5),
	C.stoneShade,
];
const HOLLOW = mix(C.stoneShade, C.roofShade, 0.6);
const BOUNCE = mix(C.stoneMid, C.amber, 0.35);
const SKY_FILL = mix(C.stoneShade, C.teal, 0.3);

/** Rust-orange stains run down the stone from the brow, where the sand's iron has wept into it. */
const STAIN = mix(STONE[2], C.amber, 0.28);
const STAIN_DARK = mix(STONE[3], C.amber, 0.28);

/** Thin high cirrus drawn out across the teal sky. */
const CIRRUS = mix(SKY[2], C.ghostLight, 0.35);
const CIRRUS_FAINT = mix(SKY[1], C.ghostLight, 0.22);

/** The violet glass gem set in the helmet's brow, faded but still catching the light. */
const GEM = C.arcane;
const GEM_SHADE = C.arcaneShade;
const GEM_GLINT = C.arcaneLight;

/** The spear's shaft, dark bronze lit along its top. */
const SHAFT_LIT = mix(C.brass, C.lampFrame, 0.45);
const SHAFT = C.lampFrame;
const SHAFT_SHADE = mix(C.lampFrame, C.wood, 0.55);
const SHAFT_DARK = C.wood;

/** The spearhead, of a paler metal: its lit and shaded halves and the bright midrib, also showing where the shaft snapped. */
const BLADE = mix(C.stoneLight, C.sandLight, 0.45);
const BLADE_SHADE = mix(C.stone, C.lampFrame, 0.3);
const BLADE_HI = mix(C.creamLight, C.lampGlow, 0.35);

/** The two moons: their centre, radius and lit and unlit colours. */
const MOONS = [
	{
		x: 12,
		y: 11,
		r: 3.7,
		lit: mix(C.creamLight, C.sandLight, 0.3),
		dark: mix(SKY[1], C.roofLight, 0.35),
	},
	{
		x: 53,
		y: 11,
		r: 2.3,
		lit: mix(C.arcaneLight, C.white, 0.35),
		dark: mix(SKY[0], C.arcaneShade, 0.35),
	},
];

/** The near dune's crest line, by column: it buries the head's chin and heaps up against its fallen right side. */
const NEAR_TOP = /** @type {Point[]} */ ([
	[0, 49],
	[10, 49],
	[18, 49],
	[24, 48],
	[30, 45],
	[36, 41],
	[44, 38],
	[48, 38],
	[52, 40],
	[58, 43],
	[63, 45],
]);

/** The heap's crest, where the near dune turns from the sun into its own shade. */
const HEAP_CREST = 48;

/** The spear's lying piece: the blade's tip, where the blade meets the socket, and the shaft's broken end. */
const BLADE_TIP = /** @type {Point} */ ([18, 52]);
const SOCKET = /** @type {Point} */ ([31, 50]);
const BREAK = /** @type {Point} */ ([45, 47]);

/** The stump of the shaft still standing in the dune: its foot and its broken top. */
const STUMP_FOOT = /** @type {Point} */ ([52, 47]);
const STUMP_TOP = /** @type {Point} */ ([57, 30]);

/**
 * Draws space tile 2.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(20417);

	drawTealSky(layer);
	drawCirrus(layer);
	drawMoons(layer);
	for (const band of DUNES) {
		drawDuneBand(layer, band);
	}
	drawNearDune(layer);
	drawRipples(layer, random);
	drawGlints(layer, random);

	const back = createCanvas(64, 64);
	drawStump(back);
	drawHead(back, crestPart);
	outline(back, C.ink);
	underlay(back, layer);

	const head = createCanvas(64, 64);
	drawHead(head, headPart);
	drawCracks(head);
	drawPits(head, random);
	drawStains(head);
	castShadow(layer, head);
	outline(head, C.ink);
	underlay(head, back);
	bury(head);
	drawDrifts(head);
	drawGemGlint(head);

	const spear = createCanvas(64, 64);
	drawLyingSpear(spear);
	outline(spear, C.ink);
	underlay(spear, head);
	drawSpearShadow(spear);
	return spear;
}

/**
 * Makes a vector one long.
 * @param {[number, number, number]} v
 * @returns {[number, number, number]}
 */
function normalise([x, y, z]) {
	const length = Math.hypot(x, y, z);
	return [x / length, y / length, z / length];
}

/**
 * The near dune's top row at a column, read off its crest line.
 * @param {number} x
 * @returns {number}
 */
function nearTop(x) {
	for (let i = 1; i < NEAR_TOP.length; i++) {
		const [x0, y0] = NEAR_TOP[i - 1];
		const [x1, y1] = NEAR_TOP[i];
		if (x <= x1) {
			return Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
		}
	}
	return NEAR_TOP[NEAR_TOP.length - 1][1];
}

/**
 * The teal day sky, banded from deep teal overhead to a warm haze over the dunes.
 * @param {Canvas} layer
 */
function drawTealSky(layer) {
	for (let y = 0; y < 64; y++) {
		const t = Math.min(1, y / HORIZON) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.72 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * Two thin streaks of cirrus high in the sky, drawn out by the wind.
 * @param {Canvas} layer
 */
function drawCirrus(layer) {
	for (const [x0, y, n] of [
		[2, 20, 14],
		[6, 21, 9],
		[44, 17, 16],
		[50, 18, 10],
		[36, 4, 9],
	]) {
		for (let k = 0; k < n; k++) {
			const edge = k < 2 || k > n - 3;
			set(layer, x0 + k, y, edge ? CIRRUS_FAINT : CIRRUS);
		}
	}
}

/**
 * Two small moons in the day sky, nearly full, each shaded on the side away from the sun.
 * @param {Canvas} layer
 */
function drawMoons(layer) {
	for (const moon of MOONS) {
		const reach = Math.ceil(moon.r);
		for (let y = moon.y - reach; y <= moon.y + reach; y++) {
			for (let x = moon.x - reach; x <= moon.x + reach; x++) {
				const dx = x - moon.x;
				const dy = y - moon.y;
				if (Math.hypot(dx, dy) > moon.r) {
					continue;
				}
				const lit =
					Math.hypot(dx + moon.r * 0.35, dy + moon.r * 0.35) < moon.r;
				set(layer, x, y, lit ? moon.lit : moon.dark);
			}
		}
	}
	// A dark sea on the big moon.
	set(layer, MOONS[0].x - 1, MOONS[0].y, MOONS[0].dark);
	set(layer, MOONS[0].x, MOONS[0].y + 1, MOONS[0].dark);
}

/**
 * Where a column falls along a band's dunes, from 0 at a valley to 1 at the next valley.
 * @param {number} x
 * @param {DuneBand} band
 * @returns {number}
 */
function dunePhase(x, { period, offset }) {
	return ((((x + offset) % period) + period) % period) / period;
}

/**
 * A band's crest line: each dune rises gently from its valley on the left to a sharp crest,
 * then drops down a steep slip face on the right.
 * @param {number} x
 * @param {DuneBand} band
 * @returns {number}
 */
function duneTop(x, band) {
	const p = dunePhase(x, band);
	const rise =
		p < 0.78 ? Math.sin(((p / 0.78) * Math.PI) / 2) : 1 - (p - 0.78) / 0.22;
	return Math.round(band.base - band.amp * rise);
}

/**
 * One band of dunes, from its crest line down: the long windward slopes lit by the sun on the left,
 * the slip faces in shade, a bright rim along each crest.
 * @param {Canvas} layer
 * @param {DuneBand} band
 */
function drawDuneBand(layer, band) {
	const [lit, plain, shade] = band.ramp;
	for (let x = 0; x < 64; x++) {
		const top = duneTop(x, band);
		for (let y = top; y < 64; y++) {
			// The slip face's shadow curves back under the crest as it runs down.
			const p = dunePhase(x + Math.round(Math.sqrt(y - top) * 2), band);
			let colour = p >= 0.78 ? shade : y - top < 3 ? plain : lit;
			if (y === top && p < 0.78) {
				colour = SAND_HI === lit ? SAND_HI : mix(lit, C.white, 0.15);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The near dune the head lies in: lit where it heaps up towards the sun, shaded past the heap's crest on the right,
 * deepening towards the viewer.
 * @param {Canvas} layer
 */
function drawNearDune(layer) {
	for (let x = 0; x < 64; x++) {
		const top = nearTop(x);
		for (let y = top; y < 64; y++) {
			let colour = y === top ? SAND_HI : y - top < 6 ? SAND_LIT : SAND;
			if (x > HEAP_CREST + (y - top) * 0.8) {
				colour = y === top ? SAND : SAND_MID;
			}
			if (y > 58 && (x + y) % 2 === 0) {
				colour = colour === SAND ? SAND_MID : colour;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Wind ripples combed across the near sand: darker lines on its lit faces, bright ones in its shade.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRipples(layer, random) {
	for (let i = 0; i < 24; i++) {
		const x0 = Math.floor(random() * 60);
		const y0 = 49 + Math.floor(random() * 14);
		const n = 3 + Math.floor(random() * 5);
		for (let k = 0; k < n; k++) {
			const x = x0 + k;
			const y = y0 + Math.round(Math.sin((x + y0) * 0.5) * 0.6);
			const behind = get(layer, x, y);
			if (!behind || y <= nearTop(x) + 1) {
				continue;
			}
			set(
				layer,
				x,
				y,
				behind === SAND_MID
					? SAND
					: behind === SAND_LIT
						? SAND
						: SAND_MID
			);
		}
	}
}

/**
 * Grains glinting on the sunlit sand of the near dune.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGlints(layer, random) {
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = 46 + Math.floor(random() * 18);
		if (get(layer, x, y) === SAND_LIT) {
			set(layer, x, y, SAND_GLINT);
		}
	}
}

/**
 * The head's shadow on the near dune, thrown down and to the right of it by the high sun on the left.
 * @param {Canvas} layer
 * @param {Canvas} head
 */
function castShadow(layer, head) {
	for (let y = 30; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (y <= nearTop(x) || get(head, x, y)) {
				continue;
			}
			for (let k = 1; k <= 5; k++) {
				if (get(head, x - k, y - k)) {
					const behind = get(layer, x, y);
					set(
						layer,
						x,
						y,
						behind === SAND_HI ||
							behind === SAND_LIT ||
							behind === SAND_GLINT
							? SAND_CAST
							: SAND_SHADE
					);
					break;
				}
			}
		}
	}
}

/**
 * Pits worn into the stone by the blowing sand, each a shade darker than the stone round it.
 * @param {Canvas} head
 * @param {() => number} random
 */
function drawPits(head, random) {
	for (let i = 0; i < 60; i++) {
		const x = 8 + Math.floor(random() * 44);
		const y = 6 + Math.floor(random() * 42);
		const tone = STONE.indexOf(/** @type {Colour} */ (get(head, x, y)));
		if (tone >= 0 && tone < STONE.length - 1) {
			set(head, x, y, STONE[tone + 1]);
		}
	}
}

/**
 * Turns a point of the upright head into the scene.
 * @param {number} u - Across the head, from its left
 * @param {number} v - Down the head, from the eyes
 * @returns {Point}
 */
function toScene(u, v) {
	return [
		Math.round(HEAD.x + HEAD.scale * (u * COS - v * SIN)),
		Math.round(HEAD.y + HEAD.scale * (u * SIN + v * COS)),
	];
}

/**
 * Which part of the upright head a point is on, or null when it is off the head.
 * @param {number} u
 * @param {number} v
 * @returns {string | null}
 */
function headPart(u, v) {
	const au = Math.abs(u);
	// The dome, fluted with grooves that follow its curve.
	const dome = 1 - (v / 7.5) ** 2;
	if (v <= -1.2 && (u / 12.6) ** 2 <= dome) {
		const span = Math.sqrt(Math.max(0, dome));
		for (const k of [-8.4, -4.2, 4.2, 8.4]) {
			if (Math.abs(u - k * span) < 0.48) {
				return 'groove';
			}
		}
		return 'dome';
	}
	// The brow band, with the gem in its middle and a chip knocked out of its left end.
	if (v > -1.2 && v <= 1.3 && au <= 13.2) {
		if (au / 2 + Math.abs(v) / 1.4 <= 1) {
			return 'gem';
		}
		if (u < -10.5 && v > 0.3) {
			return null;
		}
		return v > 0.6 ? 'browUnder' : 'brow';
	}
	// The cheek guards, riveted plates hanging either side of the upper face.
	const guardOuter = 12.8 - (v - 1.3) * 0.45;
	const guardInner = 9.1 - (v - 1.3) * 0.1;
	if (v > 1.3 && v <= 9 && au <= guardOuter && au >= guardInner) {
		if (au < guardInner + 0.7) {
			return 'groove';
		}
		const rivetU = (guardOuter + guardInner) / 2 + 0.2;
		if (
			Math.abs(au - rivetU) < 0.55 &&
			(Math.abs(v - 3.6) < 0.55 || Math.abs(v - 6.8) < 0.55)
		) {
			return 'rivet';
		}
		return 'guard';
	}
	// The long alien face, narrowing to a pointed chin.
	const faceHalf = 9 - Math.max(0, v - 7) * 0.78;
	if (v > 1.3 && v <= 17 && au <= faceHalf) {
		if (v < 2.2) {
			return 'browShadow';
		}
		// Great slanted almond eyes, hollow and dark, their lower lids catching the light.
		const side = u < 0 ? -1 : 1;
		const du = u - side * 4.9;
		const dv = v - 5.1 + side * du * 0.4;
		if ((du / 3.4) ** 2 + (dv / 1.85) ** 2 <= 1) {
			return dv > 1.1 ? 'lid' : 'socket';
		}
		// A narrow ridge of a nose, two nostril slits, and a thin, wide, downturned mouth.
		if (v > 4 && v < 10 && u > -0.8 && u <= 0.2) {
			return 'nose';
		}
		if (v > 4.5 && v < 10.4 && u > 0.2 && u <= 1.1) {
			return 'noseShade';
		}
		if (au > 0.3 && au < 1.6 && Math.abs(v - 10.7) < 0.45) {
			return 'socket';
		}
		if (au <= 3.8 && Math.abs(v - (13.2 + 0.07 * u * u)) < 0.55) {
			return 'mouth';
		}
		if (au <= 3 && Math.abs(v - (14.1 + 0.07 * u * u)) < 0.45) {
			return 'lip';
		}
		return 'face';
	}
	return null;
}

/**
 * Which part of the helmet's crest a point is on, or null when it is off the crest: a fan of stone plumes standing
 * across the helmet behind its dome, ribbed, with a chunk broken out of its right side.
 * @param {number} u
 * @param {number} v
 * @returns {string | null}
 */
function crestPart(u, v) {
	const fan = Math.hypot(u, (v + 4.5) * 1.1);
	if (v >= -4.5 || fan > 11) {
		return null;
	}
	const angle = Math.atan2(-(v + 4.5), u);
	if (angle < 0.7 && fan > 8.8 - angle * 3) {
		return null;
	}
	if (fan > 10) {
		return 'crestRim';
	}
	const rib = (angle / Math.PI) * 10;
	return Math.abs(rib - Math.round(rib)) < 0.16 ? 'crestRib' : 'crest';
}

/**
 * How brightly the sun lights a point of the head, from -1 to 1, treating the head as a rounded block.
 * @param {number} u
 * @param {number} v
 * @param {string} part
 * @returns {number}
 */
function lightAt(u, v, part) {
	let nx = u / 16;
	let ny = (v + 2) / 18;
	if (part.startsWith('crest')) {
		nx = u / 16;
		ny = -0.25;
	} else if (
		[
			'face',
			'lid',
			'lip',
			'nose',
			'noseShade',
			'mouth',
			'socket',
			'browShadow',
		].includes(part)
	) {
		nx = u / 24;
		ny = (v - 6) / 34;
	}
	const flat = Math.min(0.98, nx * nx + ny * ny);
	const nz = Math.sqrt(1 - flat);
	const wx = nx * COS - ny * SIN;
	const wy = nx * SIN + ny * COS;
	return wx * LIGHT[0] + wy * LIGHT[1] + nz * LIGHT[2];
}

/**
 * Picks the stone's tone for a brightness, one band darker for each step of shade.
 * @param {number} b - The brightness
 * @param {number} darker - Extra bands of shade
 * @returns {Colour}
 */
function stoneTone(b, darker) {
	const band =
		b > 0.9
			? 0
			: b > 0.74
				? 1
				: b > 0.52
					? 2
					: b > 0.28
						? 3
						: b > 0.05
							? 4
							: 5;
	return STONE[Math.max(0, Math.min(STONE.length - 1, band + darker))];
}

/**
 * The fallen head, or its crest: every pixel of the scene is turned back into the upright head's coordinates,
 * given its part's colour and shaded by the sun. Pixels below the near dune's crest stay buried.
 * @param {Canvas} head
 * @param {(u: number, v: number) => string | null} partAt - Which part a point is on: headPart or crestPart
 */
function drawHead(head, partAt) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (y > nearTop(x)) {
				continue;
			}
			const dx = (x + 0.5 - HEAD.x) / HEAD.scale;
			const dy = (y + 0.5 - HEAD.y) / HEAD.scale;
			const u = dx * COS + dy * SIN;
			const v = -dx * SIN + dy * COS;
			const part = partAt(u, v);
			if (part) {
				set(head, x, y, partColour(part, lightAt(u, v, part), y));
			}
		}
	}
}

/**
 * The colour of one point of the head.
 * @param {string} part
 * @param {number} b - The sunlight on it
 * @param {number} y - Its row, for the orange light thrown up from the sand
 * @returns {Colour}
 */
function partColour(part, b, y) {
	switch (part) {
		case 'gem':
			return b > 0.75 ? GEM_GLINT : b > 0.4 ? GEM : GEM_SHADE;
		case 'socket':
		case 'mouth':
			return HOLLOW;
		case 'lid':
		case 'lip':
			return stoneTone(b, -2);
		case 'groove':
			return stoneTone(b, 3);
		case 'crest':
			return stoneTone(b, 2);
		case 'crestRib':
		case 'crestRim':
			return stoneTone(b, 0);
		case 'browShadow':
		case 'noseShade':
			return stoneTone(b, 2);
		case 'browUnder':
			return stoneTone(b, 2);
		case 'rivet':
			return stoneTone(b, -1);
		case 'nose':
			return stoneTone(b, -2);
		case 'face':
			return stoneTone(b, -1);
		default: {
			// The helmet is weathered a shade darker than the smooth face it frames,
			// and the sky's teal light fills its shade.
			const tone = stoneTone(b, 1);
			if (tone === STONE[5] && y < 34) {
				return SKY_FILL;
			}
			// The sand's glow lights the head's shaded underside.
			if ((tone === STONE[5] || tone === STONE[4]) && y > 38) {
				return BOUNCE;
			}
			return tone;
		}
	}
}

/**
 * Cracks running through the weathered stone: down the dome, across the left cheek guard and over the right brow.
 * @param {Canvas} head
 */
function drawCracks(head) {
	/** @type {[number, number][][]} */
	const cracks = [
		[
			[-2.5, -8.5],
			[-3.2, -5.5],
			[-1.8, -3.5],
			[-2.4, -1.4],
		],
		[
			[-7.2, 8.5],
			[-5.6, 10.5],
			[-6.2, 13],
		],
		[
			[6, -6],
			[7.6, -3.6],
			[7, -1.4],
		],
	];
	const scratch = createCanvas(64, 64);
	for (const crack of cracks) {
		for (let i = 1; i < crack.length; i++) {
			const [x0, y0] = toScene(...crack[i - 1]);
			const [x1, y1] = toScene(...crack[i]);
			line(scratch, x0, y0, x1, y1, HOLLOW);
		}
	}
	for (let k = 0; k < scratch.p.length; k++) {
		if (scratch.p[k] && head.p[k]) {
			head.p[k] = HOLLOW;
		}
	}
}

/**
 * Rust stains weeping down the stone below the brow band, following the head's fall.
 * @param {Canvas} head
 */
function drawStains(head) {
	for (const [u, v0, n] of [
		[-7.4, 1.6, 4],
		[6.8, 1.6, 3],
		[11, 1.6, 5],
		[-3, -3, 3],
	]) {
		for (let k = 0; k < n; k++) {
			const [x, y] = toScene(u, v0 + k);
			const tone = STONE.indexOf(/** @type {Colour} */ (get(head, x, y)));
			if (tone >= 0) {
				set(head, x, y, tone <= 2 ? STAIN : STAIN_DARK);
			}
		}
	}
}

/**
 * The glint of sunlight on the brow gem's upper left facet.
 * @param {Canvas} scene
 */
function drawGemGlint(scene) {
	const [x, y] = toScene(-0.6, -0.4);
	if (
		[GEM, GEM_GLINT, GEM_SHADE].includes(
			/** @type {Colour} */ (get(scene, x, y))
		)
	) {
		set(scene, x, y, C.white);
	}
}

/**
 * Buries the head: the outline below the near dune's crest turns into the shadowed sand the head rests in.
 * @param {Canvas} scene
 */
function bury(scene) {
	for (let x = 0; x < 64; x++) {
		const top = nearTop(x);
		for (let y = top + 1; y < Math.min(64, top + 3); y++) {
			if (get(scene, x, y) === C.ink) {
				set(scene, x, y, SAND_CONTACT);
				if (get(scene, x, y + 1) !== C.ink) {
					set(scene, x, y + 1, SAND_SHADE);
				}
			}
		}
	}
}

/**
 * Sand blown into the head's hollows: along the brow's ledge, in the right eye's lower lid and on the left cheek guard.
 * @param {Canvas} scene
 */
function drawDrifts(scene) {
	for (const [u, v, n] of [
		[2.6, 1.1, 4],
		[3.2, 6.6, 3],
		[-11.2, 8.6, 2],
	]) {
		for (let k = 0; k < n; k++) {
			const [x, y] = toScene(u + k * 0.8, v);
			const behind = get(scene, x, y);
			if (behind && [...STONE, HOLLOW, BOUNCE].includes(behind)) {
				set(scene, x, y, k === 0 ? SAND_LIT : SAND);
			}
		}
	}
}

/**
 * A length of the spear's shaft, three pixels thick: lit along its top, shaded below, with a ring of wear here and there.
 * @param {Canvas} canvas
 * @param {Point} from
 * @param {Point} to
 */
function drawShaft(canvas, [x0, y0], [x1, y1]) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
	for (let i = 0; i <= steps; i++) {
		const x = Math.round(x0 + ((x1 - x0) * i) / steps);
		const y = Math.round(y0 + ((y1 - y0) * i) / steps);
		const ring = i % 6 === 3;
		const across = steep
			? [
					[-1, 0],
					[0, 0],
					[1, 0],
				]
			: [
					[0, -1],
					[0, 0],
					[0, 1],
				];
		const tones = ring
			? [SHAFT, SHAFT_SHADE, SHAFT_DARK]
			: [SHAFT_LIT, SHAFT, SHAFT_SHADE];
		across.forEach(([dx, dy], k) => set(canvas, x + dx, y + dy, tones[k]));
	}
}

/**
 * The stump of the spear's shaft, still standing at a slant in the dune behind the head's right side,
 * its top splintered where it snapped.
 * @param {Canvas} back
 */
function drawStump(back) {
	drawShaft(back, STUMP_FOOT, STUMP_TOP);
	// The jagged break, bright metal showing where it tore.
	const [x, y] = STUMP_TOP;
	set(back, x - 1, y - 1, SHAFT_LIT);
	set(back, x - 1, y - 2, SHAFT);
	set(back, x, y - 1, BLADE_HI);
	set(back, x + 1, y - 1, SHAFT_SHADE);
	set(back, x, y, BLADE_HI);
}

/**
 * The spear's snapped-off upper part lying in the sand in front of the colossus: a pale metal leaf-shaped head
 * with a bright midrib, a narrow socket collar, and the dark bronze shaft up to its jagged break.
 * @param {Canvas} spear
 */
function drawLyingSpear(spear) {
	const [tx, ty] = BLADE_TIP;
	const [sx, sy] = SOCKET;
	const length = sx - tx;
	for (let i = 0; i <= length; i++) {
		const t = i / length;
		// A leaf: from the point it swells to its widest well back along the blade, then tapers to the socket.
		const half = Math.round(
			t < 0.62
				? Math.sin(((t / 0.62) * Math.PI) / 2) * 2.8
				: 2.8 - ((t - 0.62) / 0.38) * 1.8
		);
		const x = tx + i;
		const cy = Math.round(ty + (sy - ty) * t);
		for (let dy = -half; dy <= half; dy++) {
			set(
				spear,
				x,
				cy + dy,
				dy === 0 && i > 0 ? BLADE_HI : dy < 0 ? BLADE : BLADE_SHADE
			);
		}
	}
	// The socket's collar, a narrow ring of the shaft's bronze.
	for (let dy = -1; dy <= 1; dy++) {
		set(spear, sx + 1, sy + dy, dy < 0 ? SHAFT_LIT : SHAFT_DARK);
		set(spear, sx + 2, sy + dy, dy < 0 ? SHAFT : SHAFT_DARK);
	}
	drawShaft(spear, [sx + 3, sy], BREAK);
	// The jagged break: the top of the shaft torn further than its foot, bright metal showing in the tear.
	const [bx, by] = BREAK;
	set(spear, bx + 1, by - 1, SHAFT_LIT);
	set(spear, bx + 2, by - 1, SHAFT_LIT);
	set(spear, bx + 3, by - 2, SHAFT);
	set(spear, bx + 1, by, BLADE_HI);
	set(spear, bx, by + 1, BLADE_HI);
}

/**
 * The lying spear's shadow on the sand, thrown down and to the right.
 * @param {Canvas} scene
 */
function drawSpearShadow(scene) {
	const [tx, ty] = BLADE_TIP;
	const [bx, by] = BREAK;
	for (let x = tx + 3; x <= bx + 2; x++) {
		const t = (x - tx) / (bx - tx);
		const y = Math.round(ty + (by - ty) * t) + (x < SOCKET[0] ? 4 : 3);
		for (const dy of [0, 1]) {
			if (
				get(scene, x, y + dy) !== C.ink &&
				get(scene, x, y + dy - 1) !== SAND_SHADE
			) {
				set(scene, x, y + dy, dy === 0 ? SAND_SHADE : SAND_MID);
			}
		}
	}
}
