// Canned Food: an opened supply crate of picture-labelled tins in the polar snow beside an expedition tent, one tin chiselled open and steaming.
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
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {'fish' | 'peas' | 'tomato'} Label */

/** The far horizon, where the snowfield meets the sky. */
const HORIZON = 20;

/** The low polar sun, off to the upper left. */
const SUN = { x: 4, y: 4 };

/**
 * The tent: its front triangle's apex, base row and half-width at the base,
 * and how far its ridge runs back (up and to the right).
 */
const TENT = { x: 10, y: 8, base: 37, half: 11, back: { x: 12, y: -4 } };

/** The crate's front face; its open top runs back DEPTH rows, leaning half a pixel right per row. */
const CRATE = { x: 17, y: 38, w: 41, h: 19 };
const DEPTH = 10;

/** The width of each tin in the crate. */
const TIN_W = 8;

/** The tin that has been opened, standing in the snow before the tent. */
const OPEN_TIN = { x: 2, y: 45, w: 11, h: 12 };

/** Snow: lit, mid, shade and the blue of shadows cast across it. */
const SNOW = C.snow;
const SNOW_MID = mix(C.snow, C.snowShade, 0.5);
const SNOW_SHADE = C.snowShade;
const SNOW_SHADOW = mix(C.snowShade, C.daySky3, 0.3);

/** The canvas tent: weathered khaki duck. */
const CANVAS = mix(C.sand, C.creamShade, 0.45);
const CANVAS_LIGHT = mix(C.sandLight, C.cream, 0.5);
const CANVAS_SHADE = mix(C.sandShade, C.stoneShade, 0.35);
const CANVAS_SIDE = mix(C.sandShade, C.creamShade, 0.4);
const DOOR = mix(C.wood, C.ink, 0.35);

/** The crate's pale deal boards. */
const BOARD = mix(C.timberLight, C.sand, 0.3);
const BOARD_LIGHT = mix(C.sandLight, C.timberLight, 0.35);
const BOARD_SHADE = C.timber;
const BOARD_DARK = C.timberShade;

/** Tinplate: lit, mid and shade. */
const TIN_LIGHT = C.stoneLight;
const TIN = C.stone;
const TIN_SHADE = C.stoneShade;

/** The straw packed round the tins. */
const STRAW = C.gold;
const STRAW_SHADE = C.amber;

/** The labels: a band of colour round each tin, lit on the left and shaded on the right. */
const LABELS = {
	fish: { band: C.daySky2, light: C.daySky4, shade: C.daySky1 },
	peas: { band: C.cream, light: C.creamLight, shade: C.creamShade },
	tomato: { band: C.gold, light: C.lampGlow, shade: C.amber },
};

/**
 * Draws the Canned Food tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const camp = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3105);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawSun(layer);
	drawIce(layer);
	drawSnow(layer, random);

	drawTent(camp);
	outline(camp, C.ink);
	underlay(camp, layer);
	drawShadows(camp);

	drawCrate(scene);
	drawPlank(scene);
	drawOpenTin(scene);
	drawTools(scene);
	outline(scene, C.ink);
	underlay(scene, camp);

	glow(scene, {
		x: SUN.x,
		y: SUN.y,
		radius: 30,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 3,
		skip: [C.ink],
	});
	drawSteam(scene);
	drawGleams(scene);
	return scene;
}

/**
 * The pale polar sun, low in the sky, with a faint ring of halo round it.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - 9; y <= SUN.y + 9; y++) {
		for (let x = SUN.x - 9; x <= SUN.x + 9; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			const behind = get(layer, x, y);
			if (!behind || y > HORIZON) {
				continue;
			}
			if (d < 2.5) {
				set(layer, x, y, C.white);
			} else if (d < 3.5) {
				set(layer, x, y, C.lampGlow);
			} else if (d >= 7.5 && d < 8.5) {
				set(layer, x, y, mix(behind, C.white, 0.4));
			}
		}
	}
}

/**
 * The far ice: a low line of snowy ridges along the horizon, lit on their left and blue in their shade.
 * @param {Canvas} layer
 */
function drawIce(layer) {
	for (let x = 0; x < 64; x++) {
		const height = Math.round(
			3 + 2.2 * Math.sin(x * 0.21 + 1.3) + 1.4 * Math.sin(x * 0.53)
		);
		const slope =
			Math.cos(x * 0.21 + 1.3) * 0.46 + Math.cos(x * 0.53) * 0.74;
		for (let y = HORIZON - height; y <= HORIZON; y++) {
			set(layer, x, y, slope > 0 ? SNOW_MID : SNOW_SHADOW);
		}
		set(layer, x, HORIZON - height, slope > 0 ? SNOW : SNOW_SHADE);
	}
}

/**
 * The snowfield from the horizon to the viewer: wind-carved ridges with a shaded trough under each lit crest.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSnow(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = SNOW;
			if (y < HORIZON + 3 || (y > 59 && (x + y) % 2 === 0)) {
				colour = SNOW_MID;
			} else if (y > 61) {
				colour = SNOW_MID;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 12; i++) {
		const y0 = HORIZON + 4 + Math.floor(random() * (60 - HORIZON - 4));
		const x0 = Math.floor(random() * 56);
		const length = 6 + Math.floor(random() * 10);
		for (let k = 0; k < length; k++) {
			const y = y0 + Math.round(Math.sin(k * 0.4) * 0.8);
			set(layer, x0 + k, y, SNOW_SHADE);
			if (k > 1 && k < length - 1) {
				set(layer, x0 + k, y + 1, SNOW_MID);
			}
		}
	}
}

/**
 * Tells whether a point lies inside a four-sided shape.
 * @param {number} x
 * @param {number} y
 * @param {[number, number][]} corners - The corners, in order round the shape
 * @returns {boolean}
 */
function within(x, y, corners) {
	let inside = false;
	for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
		const [xi, yi] = corners[i];
		const [xj, yj] = corners[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * The expedition tent: a canvas ridge tent seen from its front corner, its door flap tied back on the dark inside,
 * its poles and pennant above, a guy rope pegged into the snow and snow banked round its skirt.
 * @param {Canvas} camp
 */
function drawTent(camp) {
	const { x: ax, y: ay, base, half, back } = TENT;
	/** @type {[number, number][]} */
	const roof = [
		[ax, ay],
		[ax + back.x, ay + back.y],
		[ax + half + back.x + 0.5, base + back.y + 0.5],
		[ax + half + 0.5, base + 0.5],
	];
	// The roof's far side, half turned from the sun, with seams running down it and the ridge lit along its top.
	for (let y = ay + back.y; y <= base; y++) {
		for (let x = ax; x <= ax + half + back.x + 1; x++) {
			if (within(x + 0.5, y + 0.5, roof)) {
				set(camp, x, y, CANVAS_SIDE);
			}
		}
	}
	for (const k of [4, 8]) {
		const dy = Math.round((back.y * k) / back.x);
		line(camp, ax + k, ay + dy + 1, ax + half + k, base + dy, CANVAS_SHADE);
	}
	line(camp, ax, ay, ax + back.x, ay + back.y, CANVAS_LIGHT);
	// The front: a triangle of canvas facing the sun, lit along its left side.
	for (let y = ay; y <= base; y++) {
		const t = (y - ay) / (base - ay);
		const w = Math.round(half * t);
		for (let x = ax - w; x <= ax + w; x++) {
			set(camp, x, y, x <= ax - w + 1 ? C.creamLight : CANVAS_LIGHT);
		}
	}
	// The doorway: the dark inside, widening to the ground, with the left flap folded back and tied.
	const top = ay + 8;
	for (let y = top; y <= base; y++) {
		const w = Math.round(((y - top) / (base - top)) * 6);
		for (let x = ax - w; x <= ax + Math.round(w / 2); x++) {
			set(camp, x, y, DOOR);
		}
		if (y > top + 4) {
			const flap = Math.round(((y - top - 4) / (base - top - 4)) * 4);
			for (let x = ax - w - flap; x < ax - w; x++) {
				set(camp, x, y, CANVAS);
			}
			set(camp, ax - w - flap, y, CANVAS_SHADE);
		}
	}
	set(camp, ax - 6, top + 15, C.timberShade);
	set(camp, ax - 7, top + 15, C.timberShade);
	// The poles' tips and the pennant streaming from the front one.
	rect(camp, ax, ay - 4, 1, 4, C.timber);
	rect(camp, ax + back.x, ay + back.y - 2, 1, 2, C.timber);
	paint(camp, ax + 1, ay - 4, ['rrrrr', 'rRRR.', 'rR...'], {
		r: C.brickRed,
		R: C.brickRedShade,
	});
	// A guy rope from the front pole, pegged into the snow.
	line(camp, ax - 1, ay + 1, 0, ay + 14, C.stoneShade);
	// Snow banked round the skirt.
	for (let x = ax - half - 1; x <= ax + half + back.x; x++) {
		const drift = Math.round(1.5 + Math.sin(x * 0.7) * 1.2);
		const edge =
			x > ax + half
				? base + Math.round(((x - ax - half) * back.y) / back.x)
				: base;
		for (let y = edge - drift; y <= edge; y++) {
			if (get(camp, x, y)) {
				set(camp, x, y, y === edge - drift ? SNOW : SNOW_MID);
			}
		}
	}
}

/**
 * Blue shadows cast across the snow, away from the low sun: the tent's, the crate's and the open tin's, to their right.
 * @param {Canvas} camp
 */
function drawShadows(camp) {
	/**
	 * Shades one pixel of lit snow.
	 * @param {number} x
	 * @param {number} y
	 */
	const shade = (x, y) => {
		const colour = get(camp, x, y);
		if (colour === SNOW || colour === SNOW_MID || colour === SNOW_SHADE) {
			set(camp, x, y, SNOW_SHADOW);
		}
	};
	for (let y = TENT.base - 3; y <= TENT.base + 1; y++) {
		for (let x = TENT.x + TENT.half; x < 34; x++) {
			shade(x, y);
		}
	}
	const right = CRATE.x + CRATE.w + DEPTH / 2;
	for (let y = CRATE.y + CRATE.h - DEPTH; y <= CRATE.y + CRATE.h + 1; y++) {
		for (let x = right; x < 64; x++) {
			shade(x, y);
		}
	}
	for (let x = CRATE.x - 1; x < 64; x++) {
		shade(x, CRATE.y + CRATE.h);
		shade(x, CRATE.y + CRATE.h + 1);
	}
	for (let x = OPEN_TIN.x + 2; x < OPEN_TIN.x + OPEN_TIN.w + 3; x++) {
		shade(x, OPEN_TIN.y + OPEN_TIN.h);
	}
}

/**
 * The crate: deal boards nailed to corner battens, its lid off and its top front board prised away
 * so the tins show inside it, two rows deep, packed in straw.
 * @param {Canvas} scene
 */
function drawCrate(scene) {
	const { x: cx, y: cy, w, h } = CRATE;
	const right = cx + w - 1;
	const bottom = cy + h - 1;
	// The open top: the straw-packed inside, and the far rim.
	for (let k = 1; k <= DEPTH; k++) {
		const y = cy - k;
		const shift = Math.floor(k / 2);
		for (let x = cx + shift; x <= right + shift; x++) {
			set(
				scene,
				x,
				y,
				k >= DEPTH - 1
					? BOARD_LIGHT
					: (x + k) % 3 === 0
						? STRAW_SHADE
						: STRAW
			);
		}
	}
	// The right side, in shade, with the batten on its far corner and that batten's nails.
	for (let k = 1; k <= DEPTH / 2; k++) {
		const x = right + k;
		for (let y = cy - k * 2 + 1; y <= bottom - k * 2 + 1; y++) {
			let colour = mix(BOARD_SHADE, BOARD_DARK, 0.5);
			if (k === 1 || k === DEPTH / 2) {
				colour = BOARD_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	for (const ny of [cy - 3, cy + 5, cy + 11]) {
		set(scene, right + DEPTH / 2, ny, TIN_SHADE);
	}
	// The tins: a back row showing their lids and a little of their labels, then the front row.
	/** @type {Label[]} */
	const front = ['fish', 'peas', 'tomato', 'fish'];
	/** @type {Label[]} */
	const backRow = ['tomato', 'fish', 'peas', 'tomato'];
	backRow.forEach((kind, i) => {
		const x = cx + 6 + i * (TIN_W + 1);
		drawTin(scene, x, cy - 9, kind, 3);
	});
	front.forEach((kind, i) => {
		const x = cx + 3 + i * (TIN_W + 1);
		drawTin(scene, x, cy - 4, kind, 9);
	});
	// The front: two boards below the gap, the battens at the corners and their nails.
	for (const top of [cy + 7, cy + 13]) {
		rect(scene, cx, top, w, 6, BOARD);
		rect(scene, cx, top, w, 1, BOARD_LIGHT);
		rect(scene, cx, top + 5, w, 1, BOARD_SHADE);
		for (let x = cx + 5; x < right - 4; x += 9) {
			rect(scene, x + (top % 3), top + 2, 3 + (x % 3), 1, BOARD_SHADE);
		}
	}
	for (const bx of [cx, right - 2]) {
		rect(scene, bx, cy - 1, 3, h + 1, BOARD);
		rect(scene, bx, cy - 1, 1, h + 1, BOARD_LIGHT);
		rect(scene, bx + 2, cy - 1, 1, h + 1, BOARD_SHADE);
		for (const ny of [cy + 1, cy + 9, cy + 15]) {
			set(scene, bx + 1, ny, TIN_SHADE);
		}
	}
	// Wisps of straw hanging over the boards.
	line(scene, cx + 12, cy + 6, cx + 14, cy + 9, STRAW);
	line(scene, cx + 30, cy + 6, cx + 29, cy + 8, STRAW_SHADE);
}

/**
 * One tin standing upright: a tinplate lid seen from above, a rolled rim and a label band with its picture.
 * @param {Canvas} scene
 * @param {number} x - The tin's left column
 * @param {number} y - The lid's top row
 * @param {Label} kind - The picture on its label
 * @param {number} band - How many rows of the label show
 */
function drawTin(scene, x, y, kind, band) {
	paint(scene, x, y, ['.tttttt.', 'tLLllltT', '.TTTTTT.'], {
		t: TIN,
		T: TIN_SHADE,
		L: C.white,
		l: TIN_LIGHT,
	});
	rect(scene, x, y + 2, TIN_W, 1, TIN_LIGHT);
	rect(scene, x + TIN_W - 2, y + 2, 2, 1, TIN);
	drawLabel(scene, x, y + 3, TIN_W, band, kind);
}

/**
 * A tin's label band with its picture: a fish on blue, a pea pod on cream or a tomato on gold.
 * A band too short for its picture shows only its colour.
 * @param {Canvas} scene
 * @param {number} x - The tin's left column
 * @param {number} y - The band's top row
 * @param {number} w - The tin's width
 * @param {number} h - The band's height
 * @param {Label} kind
 */
function drawLabel(scene, x, y, w, h, kind) {
	const { band, light, shade } = LABELS[kind];
	rect(scene, x, y, w, h, band);
	rect(scene, x, y, 1, h, light);
	rect(scene, x + w - 2, y, 2, h, shade);
	if (h < 5) {
		return;
	}
	const px = x + Math.floor((w - 5) / 2);
	const py = y + Math.floor((h - 4) / 2);
	if (kind === 'fish') {
		paint(scene, px, py, ['.ww..', 'wkwww', '.wwww', '..w..'], {
			w: C.white,
			k: C.ink,
		});
		set(scene, px + 4, py, C.white);
		set(scene, px + 4, py + 3, C.white);
	} else if (kind === 'peas') {
		paint(scene, px, py, ['...gg', '.gpgp', 'gpgp.', 'gg...'], {
			g: C.grassShade,
			p: C.grassLight,
		});
	} else {
		paint(scene, px, py, ['.ggg.', 'rrgrr', 'rRrrr', '.rrr.'], {
			g: C.grassShade,
			r: C.brickRed,
			R: C.brickRedLight,
		});
	}
}

/**
 * The crate's top front board, prised off and dropped in the snow with its nails still in it.
 * @param {Canvas} scene
 */
function drawPlank(scene) {
	const y = 60;
	rect(scene, 27, y, 30, 2, BOARD);
	rect(scene, 27, y, 30, 1, BOARD_LIGHT);
	rect(scene, 57, y, 1, 2, BOARD_SHADE);
	for (const x of [29, 54]) {
		set(scene, x, y - 1, TIN_LIGHT);
		set(scene, x + 1, y - 2, TIN);
	}
}

/**
 * The opened tin in the snow: its lid chiselled round and bent back, hot stew inside and a tomato on its label.
 * @param {Canvas} scene
 */
function drawOpenTin(scene) {
	const { x: tx, y: ty, w, h } = OPEN_TIN;
	const right = tx + w - 1;
	const bottom = ty + h - 1;
	// The body: tinplate, lit on the left, with its rolled rims.
	for (let x = tx; x <= right; x++) {
		const colour =
			x <= tx + 1 ? TIN_LIGHT : x >= right - 1 ? TIN_SHADE : TIN;
		rect(scene, x, ty + 2, 1, h - 2, colour);
	}
	rect(scene, tx, ty + 3, w, 1, TIN_SHADE);
	drawLabel(scene, tx, ty + 4, w, 6, 'tomato');
	rect(scene, tx, bottom - 1, w, 1, TIN_LIGHT);
	rect(scene, tx, bottom, w, 1, TIN_SHADE);
	// The top: a rim round the hot stew.
	paint(scene, tx, ty, ['.lllllllll.', 'lmmMmmmMmml', '.sssssssss.'], {
		l: TIN_LIGHT,
		m: mix(C.brickRedShade, C.wood, 0.4),
		M: mix(C.brickRed, C.timberLight, 0.4),
		s: TIN_SHADE,
	});
	// The lid, prised up on its last uncut stretch of rim, its edge jagged from the chisel.
	paint(
		scene,
		tx,
		ty - 6,
		['.l.l.', 'lLlLt', 'lLltt', '.lltt', '..lt.', '...t.'],
		{
			l: TIN_LIGHT,
			L: C.white,
			t: TIN,
		}
	);
}

/**
 * The hammer and chisel that opened the tin, dropped in the snow beside it.
 * @param {Canvas} scene
 */
function drawTools(scene) {
	// The hammer: a wooden haft and an iron head.
	line(scene, 1, 62, 11, 59, C.timberLight);
	line(scene, 2, 63, 11, 60, C.timber);
	rect(scene, 12, 57, 3, 6, C.stoneShade);
	rect(scene, 12, 57, 3, 1, C.stoneLight);
	rect(scene, 12, 58, 1, 4, C.stone);
	// The chisel: a wooden grip and a steel blade, lying in the snow.
	rect(scene, 17, 59, 4, 2, C.timberLight);
	rect(scene, 17, 60, 4, 1, C.timber);
	rect(scene, 21, 59, 5, 1, TIN_LIGHT);
	rect(scene, 21, 60, 4, 1, TIN);
}

/**
 * Steam curling up from the hot tin, see-through against the tent's dark doorway behind it.
 * @param {Canvas} scene
 */
function drawSteam(scene) {
	for (const [x0, phase, height] of [
		[OPEN_TIN.x + 4, 0, 18],
		[OPEN_TIN.x + 8, 2.6, 13],
	]) {
		for (let k = 0; k < height; k++) {
			const y = OPEN_TIN.y - 1 - k;
			const x = Math.round(x0 + Math.sin(k * 0.42 + phase) * 1.5);
			const t = 1 - k / height;
			for (const [dx, strength] of [
				[0, 0.6 + t * 0.35],
				[1, 0.2 + t * 0.25],
			]) {
				const colour = get(scene, x + dx, y);
				if (colour) {
					set(scene, x + dx, y, mix(colour, C.white, strength));
				}
			}
		}
	}
}

/**
 * The sun's gleams on the tinplate, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[OPEN_TIN.x, OPEN_TIN.y + 2],
		[OPEN_TIN.x + 1, OPEN_TIN.y + 11],
	]) {
		set(scene, x, y, C.white);
	}
}
