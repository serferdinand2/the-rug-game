// Seer Sight: a hooded seer cupping a glowing crystal ball, her face lit from below, a vision of moonlit peaks inside the glass.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The table's first row, and the crystal ball's centre and radius. */
const TABLE = 53;
const BALL = { x: 32, y: 40, r: 12 };

/** The window's box, frame included. */
const WINDOW = { x: 47, y: 3, w: 13, h: 15 };

/** Skin lit by the ball from below, and skin left in the hood's shadow. */
const SKIN_LIT = mix(C.skin, C.arcaneLight, 0.35);
const SKIN_DARK = mix(C.skinShade, C.roof, 0.45);

/** A small crescent moon, tilted so its horns point up and to the right: m lit edge, r inner edge. */
const MOON = ['.r..', 'mr..', 'mmr.', 'mmmr', '.mm.'];

/** The colours inside the glass, which the ball's glow leaves alone. */
const GLASS = [
	C.arcaneShade,
	C.arcane,
	C.arcaneLight,
	C.white,
	C.tealShade,
	C.teal,
	C.ghostLight,
	C.gold,
	C.lampGlow,
];

/**
 * Draws the Seer Sight scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9101);

	drawInterior(layer, {
		floor: TABLE,
		random,
		wall: 'stone',
		window: { ...WINDOW, time: 'night' },
	});
	darkenRoom(layer);
	drawCurtain(layer);

	drawSeer(scene);
	drawFace(scene);
	drawHands(scene);
	drawStand(scene);
	drawBall(scene);
	outline(scene, C.ink);
	drawCloth(layer);
	underlay(scene, layer);
	glow(scene, {
		x: BALL.x,
		y: BALL.y,
		radius: 26,
		colour: C.arcane,
		strength: 0.3,
		steps: 4,
		skip: [...GLASS, C.ink],
	});
	drawVision(scene, random);
	return scene;
}

/**
 * Dims the room to night, leaving the sky in the window panes as it is, and puts a small moon in it.
 * @param {Canvas} layer
 */
function darkenRoom(layer) {
	const { x, y, w, h } = WINDOW;
	for (let py = 0; py < 64; py++) {
		for (let px = 0; px < 64; px++) {
			const pane =
				px > x &&
				px < x + w - 1 &&
				py > y &&
				py < y + h - 1 &&
				px !== x + Math.floor(w / 2) &&
				py !== y + Math.floor(h / 2);
			const colour = get(layer, px, py);
			if (colour && !pane) {
				set(layer, px, py, mix(colour, C.night, 0.78));
			}
		}
	}
	paint(layer, 48, 4, MOON, { m: C.moon, r: C.moonRim });
}

/**
 * A heavy velvet curtain hanging down the left of the room, with deep folds and a gold tie.
 * @param {Canvas} layer
 */
function drawCurtain(layer) {
	for (let y = 0; y < TABLE; y++) {
		// The curtain is gathered in by the tie, then falls wider.
		const edge =
			y < 30 ? 12 - Math.round(y / 10) : 9 + Math.round((y - 30) / 4);
		for (let x = 0; x <= edge; x++) {
			const fold = (x + Math.round(Math.sin(y * 0.2) * 0.6)) % 4;
			const colour =
				x === edge
					? C.brickRedShade
					: fold === 0
						? mix(C.brickRedShade, C.night, 0.5)
						: fold === 1
							? mix(C.brickRed, C.night, 0.45)
							: mix(C.brickRedShade, C.night, 0.25);
			set(layer, x, y, colour);
		}
	}
	rect(layer, 0, 29, 10, 2, mix(C.amber, C.night, 0.3));
	set(layer, 9, 31, mix(C.gold, C.night, 0.3));
	set(layer, 9, 32, mix(C.amber, C.night, 0.3));
}

/**
 * The seer's hooded robe: a deep violet hood and broad shoulders, lit violet along the edges nearest the ball.
 * @param {Canvas} scene
 */
function drawSeer(scene) {
	for (let y = 4; y < TABLE; y++) {
		const head = 1 - ((y - 18) / 14) ** 2;
		const headHalf = head > 0 ? Math.round(12 * Math.sqrt(head)) : 0;
		const shoulders =
			y >= 25 ? Math.min(25, 11 + Math.round((y - 25) * 1.3)) : 0;
		const half = Math.max(headHalf, shoulders);
		for (let x = 32 - half; x <= 32 + half; x++) {
			const u = (x - 32) / Math.max(1, half);
			let colour = C.roof;
			if (Math.abs(u) > 0.82) {
				colour = y > 30 ? C.roofLight : C.roofShade;
			} else if (u > 0.45 && y < 30) {
				colour = C.roofShade;
			}
			// Folds falling from the hood over the shoulders.
			if (y > 30 && (x === 32 - half + 5 || x === 32 + half - 6)) {
				colour = C.roofShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The dark opening of the hood around the face.
	for (let y = 9; y <= 31; y++) {
		for (let x = 23; x <= 41; x++) {
			if (((x - 32) / 8.5) ** 2 + ((y - 20) / 11) ** 2 <= 1) {
				set(scene, x, y, C.night);
			}
		}
	}
	// Gold stars embroidered on the shoulders.
	for (const [x, y] of [
		[12, 33],
		[52, 34],
		[9, 48],
		[55, 49],
	]) {
		paint(scene, x - 1, y - 1, ['.g.', 'ggg', '.g.'], { g: C.amber });
		set(scene, x, y, C.gold);
	}
	// A gold hem round the hood's opening.
	for (let y = 9; y <= 31; y++) {
		for (let x = 22; x <= 42; x++) {
			const d = ((x - 32) / 9.5) ** 2 + ((y - 20) / 12) ** 2;
			if (d > 1 && d <= 1.2 && get(scene, x, y) !== C.night) {
				set(scene, x, y, y > 24 ? C.gold : C.amber);
			}
		}
	}
}

/**
 * The seer's face in the hood, lit from below by the ball: bright chin and cheeks, eyes lowered to the glass.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	// Long dark hair framing the face.
	for (let y = 12; y <= 30; y++) {
		for (const x of [25, 26, 38, 39]) {
			if (((x - 32) / 7.5) ** 2 + ((y - 20) / 11) ** 2 <= 1) {
				set(scene, x, y, y > 26 ? C.timberShade : C.wood);
			}
		}
	}
	for (let y = 13; y <= 28; y++) {
		for (let x = 27; x <= 37; x++) {
			if (((x - 32) / 5.6) ** 2 + ((y - 20) / 8.4) ** 2 > 1) {
				continue;
			}
			let colour = C.skin;
			if (y <= 15) {
				colour = SKIN_DARK;
			} else if (y <= 17) {
				colour = C.skinShade;
			} else if (y >= 24) {
				colour = SKIN_LIT;
			}
			set(scene, x, y, colour);
		}
	}
	// Lowered eyes with lit lower lids, the nose's lit underside and the mouth.
	for (const ex of [29, 34]) {
		rect(scene, ex, 19, 3, 1, C.wood);
		rect(scene, ex, 20, 3, 1, SKIN_LIT);
		set(scene, ex + 1, 18, C.skinShade);
		rect(scene, ex, 17, 3, 1, C.timberShade);
	}
	set(scene, 32, 20, C.skinShade);
	set(scene, 32, 21, C.skinShade);
	rect(scene, 31, 22, 3, 1, SKIN_LIT);
	rect(scene, 31, 24, 3, 1, C.brickRedShade);
	rect(scene, 30, 27, 5, 1, mix(SKIN_LIT, C.white, 0.3));
}

/**
 * The seer's hands held up either side of the ball, palms to the glass, in wide gold-cuffed sleeves.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	const hand = [
		'..s.s....',
		'.sSsSs...',
		'.sSsSsS..',
		'.sSSSSSl.',
		'.sSSSSSl.',
		'.sSSSSll.',
		'..sSSSl..',
		'..sSSSl..',
		'...sSl...',
	];
	const sleeve = [
		'..GGGGGG.',
		'.GRRRRRRG',
		'.RRRRRRRr',
		'RRRRRRRRr',
		'RRRRRRRRr',
		'RRRRRRRrr',
		'RRRRRRRrr',
		'RRRRRRrr.',
	];
	const colours = {
		S: C.skin,
		s: C.skinShade,
		l: SKIN_LIT,
		G: C.gold,
		R: C.roofLight,
		r: C.roof,
	};
	paint(scene, 13, 30, hand, colours);
	paint(scene, 12, 39, sleeve, colours);
	paint(scene, 42, 30, hand, colours, { mirror: true });
	paint(scene, 43, 39, sleeve, colours, { mirror: true });
}

/**
 * The brass stand the ball sits in: a ring on three curled feet.
 * @param {Canvas} scene
 */
function drawStand(scene) {
	paint(
		scene,
		BALL.x - 9,
		48,
		[
			'..GGGGGGGGGGGGGG..',
			'.GAAAAAAAAAAAAAAG.',
			'..AAAAAAAAAAAAAA..',
			'...GA...GA...GA...',
			'..GGA..GGAA..GGA..',
			'.GGAA.GGAAA.GGAAA.',
		],
		{ G: C.gold, A: C.brass }
	);
}

/**
 * The crystal ball: a glowing violet sphere, its night sky brightest towards the horizon of the vision, with a lit rim.
 * @param {Canvas} scene
 */
function drawBall(scene) {
	const { x: cx, y: cy, r } = BALL;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy) / r;
			if (d > 1.04) {
				continue;
			}
			const t = (y - cy + r) / (2 * r);
			let colour = C.arcaneLight;
			if (d > 0.9) {
				colour = C.arcane;
			} else if (t < 0.4) {
				colour = C.arcaneShade;
			} else if (t < 0.62) {
				colour = C.arcane;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Tells whether a pixel lies well inside the glass, clear of its rim.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inBall(x, y) {
	return Math.hypot(x - BALL.x, y - BALL.y) / BALL.r <= 0.9;
}

/**
 * The vision inside the glass: two teal peaks, the taller one snow-capped, under a crescent moon and stars,
 * with a curl of mist and the glint.
 * Painted after the glow so it keeps its colours.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawVision(scene, random) {
	const { x: cx, y: cy, r } = BALL;
	// The peaks: lit on the left, dark on the right, snow on the taller one.
	for (const [px, top] of [
		[cx - 3, cy - 3],
		[cx + 5, cy + 1],
	]) {
		for (let y = top; y <= cy + r; y++) {
			const half = Math.round((y - top) * 0.9);
			for (let x = px - half; x <= px + half; x++) {
				if (!inBall(x, y)) {
					continue;
				}
				let colour = x <= px ? C.teal : C.tealShade;
				if (y - top < 3 && px < cx) {
					colour = x <= px ? C.ghostLight : C.ghost;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// A tilted crescent moon, lit on its outer edge, and a few stars.
	paint(scene, cx + 2, cy - 9, MOON, {
		m: C.moon,
		r: C.moonRim,
	});
	for (let i = 0; i < 5; i++) {
		const x = cx - 8 + Math.floor(random() * 10);
		const y = cy - 9 + Math.floor(random() * 5);
		if (inBall(x, y) && get(scene, x, y) === C.arcaneShade) {
			set(scene, x, y, C.white);
		}
	}
	// A curl of mist spiralling in from the rim towards the heart of the vision.
	for (let a = 0; a < 4.2; a += 0.05) {
		const rr = r - 2.5 - a * 1.1;
		const x = Math.round(cx + Math.cos(a + 0.4) * rr);
		const y = Math.round(cy + Math.sin(a + 0.4) * rr * 0.8);
		if (
			get(scene, x, y) === C.arcane ||
			get(scene, x, y) === C.arcaneShade
		) {
			set(scene, x, y, a < 2 ? C.arcaneLight : C.ghostLight);
		}
	}
	// The glint.
	for (const [x, y] of [
		[24, 33],
		[25, 32],
		[26, 31],
		[24, 34],
		[23, 35],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * The table's dark teal cloth, its gold fringe hanging over the front.
 * @param {Canvas} layer
 */
function drawCloth(layer) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.tealShade, C.night, 0.45);
			if (y === TABLE) {
				colour = mix(C.tealShade, C.night, 0.1);
			} else if (y >= 60) {
				colour = x % 2 ? C.amber : mix(C.amber, C.night, 0.5);
			} else if ((x + y) % 7 === 0) {
				colour = mix(C.tealShade, C.night, 0.6);
			}
			set(layer, x, y, colour);
		}
	}
}
