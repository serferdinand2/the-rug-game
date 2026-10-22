// Spymaster: a spymaster at a candlelit desk in a vaulted room, pinning a new string to a wall map webbed with red strings, a raven on the sill.
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
import { drawInterior } from '../../parts/interior.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The map's box on the back wall, the desk's top row, and the candle's flame. */
const MAP = { x: 17, y: 9, w: 38, h: 23 };
const DESK = 45;
const FLAME = { x: 29, y: 37 };
/** The arched window's panes, frame not included, and the round head's radius. */
const WINDOW = { x: 4, y: 11, w: 9, h: 19 };
const ARCH = 4;
/** The spymaster's top-left corner, his shoulder, and the hand pressing a pin into the map. */
const SEAT = { x: 45, y: 26 };
const SHOULDER = { x: 47, y: 39 };
const HAND = { x: 36, y: 27 };

/** The map's colours: parchment, sea, land and inked borders. */
const PARCHMENT = C.sandLight;
const PARCHMENT_EDGE = C.sandShade;
const SEA = mix(C.daySky3, C.sand, 0.35);
const SEA_DEEP = mix(C.daySky1, C.sand, 0.35);
const LAND = mix(C.grass, C.sand, 0.45);
const LAND_HIGH = mix(C.timberLight, C.sand, 0.4);
const BORDER = mix(C.timberShade, C.sand, 0.3);

/**
 * The spymaster, seated at the desk in profile, turned to the map: a dark cap, grey hair, a pointed beard,
 * a white ruff and a dark doublet. His reaching arm is drawn separately.
 * k cap, K cap lit by the candle, w grey hair, S skin, s skin shade, e eye, b beard, W ruff, C doublet, c doublet shade.
 */
const SPYMASTER = [
	'...KKKKk......',
	'..KkkkkkK.....',
	'..kkkkkkkk....',
	'.SSSSSkwww....',
	'.SeSSSwwww....',
	'SSSSSSswww....',
	'.SSSSSsww.....',
	'.bbbSSs.......',
	'bbbbSs........',
	'.bbWWWWWW.....',
	'..WWWWWWWWW...',
	'..cCCCCCCCCc..',
	'.cCCCCCCCCCCc.',
	'.cCCCCCCCCCCCc',
	'.cCCCCCCCCCCCc',
	'.cCCCCCCCCCCCc',
	'.cCCCCCCCCCCCc',
	'.cCCCCCCCCCCCc',
	'.cCCCCCCCCCCCc',
	'.cCCCCCCCCCCCc',
];

/**
 * Draws the Spymaster scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1573);

	drawInterior(layer, { floor: DESK + 2, random, wall: 'stone' });
	darken(layer);
	drawVault(layer);
	drawWindow(layer, random);

	// The map hangs on the wall behind the spymaster, so it gets its own outline.
	const map = createCanvas(64, 64);
	drawMap(map, random);
	outline(map, C.ink);
	underlay(map, layer);
	drawStrings(map);

	drawChair(scene);
	paint(scene, SEAT.x, SEAT.y, SPYMASTER, {
		k: C.roofShade,
		K: C.roof,
		w: C.stoneLight,
		S: C.skin,
		s: C.skinShade,
		e: C.wood,
		b: C.stoneMid,
		W: C.creamLight,
		C: C.roofShade,
		c: C.night,
	});
	drawArm(scene);
	drawDesk(scene);
	outline(scene, C.ink);
	underlay(scene, map);
	// The candle lights the room but not the night outside, so the panes are kept as they were.
	const night = scene.p.map((colour, i) =>
		inPane(i % 64, Math.floor(i / 64)) ? colour : null
	);
	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 30,
		colour: C.amber,
		strength: 0.4,
		steps: 4,
		skip: [C.ink],
	});
	night.forEach((colour, i) => {
		if (colour) {
			scene.p[i] = colour;
		}
	});
	drawCandle(scene);
	drawPin(scene);
	drawRaven(scene);
	return scene;
}

/**
 * Darkens the room to a cold night blue, so only the candle lights it.
 * @param {Canvas} layer
 */
function darken(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.nightSky2, 0.55);
		}
	}
}

/**
 * The vaulted ceiling: one broad arch across the back wall, its rib picked out in pale stone,
 * the vault above it in deep shadow.
 * @param {Canvas} layer
 */
function drawVault(layer) {
	const shadow = mix(C.roofShade, C.nightSky1, 0.4);
	const rib = mix(C.stoneLight, C.nightSky3, 0.45);
	const ribShade = mix(C.stoneShade, C.nightSky2, 0.45);
	for (let x = 0; x < 64; x++) {
		const curve = archAt(x);
		for (let y = 0; y < curve; y++) {
			// Courses of stone in the vault, curving with it.
			const course = (curve - y) % 4 === 0;
			set(layer, x, y, course ? mix(shadow, C.nightSky3, 0.5) : shadow);
		}
		set(layer, x, curve, rib);
		set(layer, x, curve + 1, ribShade);
	}
}

/**
 * The vault's rib row at a column: low at the walls, high in the middle.
 * @param {number} x
 * @returns {number}
 */
function archAt(x) {
	return Math.round(12 - 11 * Math.sin((Math.PI * (x + 0.5)) / 64));
}

/**
 * Tells whether a pixel is one of the window's panes, under its round head.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inPane(x, y) {
	const cx = WINDOW.x + (WINDOW.w - 1) / 2;
	if (x < WINDOW.x || x >= WINDOW.x + WINDOW.w || y >= WINDOW.y + WINDOW.h) {
		return false;
	}
	if (y >= WINDOW.y + ARCH) {
		return true;
	}
	return Math.hypot(x - cx, y - WINDOW.y - ARCH) <= ARCH + 0.4;
}

/**
 * The arched window in the right of the back wall: the night sky with a full moon low in it,
 * a stone frame round it and a deep sill for the raven.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindow(layer, random) {
	const sky = createCanvas(WINDOW.w, WINDOW.h);
	drawSky(sky, {
		time: 'night',
		horizon: WINDOW.h - 1,
		random,
		stars: 7,
		starRows: WINDOW.h - 6,
	});
	const frame = mix(C.stoneLight, C.nightSky3, 0.35);
	const frameShade = mix(C.stoneShade, C.nightSky2, 0.35);
	for (let y = WINDOW.y - 1; y <= WINDOW.y + WINDOW.h; y++) {
		for (let x = WINDOW.x - 1; x <= WINDOW.x + WINDOW.w; x++) {
			if (inPane(x, y)) {
				set(layer, x, y, sky.p[(y - WINDOW.y) * sky.w + x - WINDOW.x]);
			} else if (
				inPane(x + 1, y) ||
				inPane(x - 1, y) ||
				inPane(x, y + 1) ||
				inPane(x, y - 1)
			) {
				set(
					layer,
					x,
					y,
					x > WINDOW.x + WINDOW.w / 2 ? frameShade : frame
				);
			}
		}
	}
	// The moon, low enough for the raven's head to cross it.
	const moon = { x: WINDOW.x + 4, y: WINDOW.y + 7, r: 3.5 };
	glow(layer, {
		x: moon.x,
		y: moon.y,
		radius: 7,
		colour: C.starDim,
		strength: 0.4,
		skip: [frame, frameShade],
	});
	for (let y = moon.y - 4; y <= moon.y + 4; y++) {
		for (let x = moon.x - 4; x <= moon.x + 4; x++) {
			const d = Math.hypot(x - moon.x, y - moon.y);
			if (d <= moon.r && inPane(x, y)) {
				set(layer, x, y, d > moon.r - 1 ? C.moonRim : C.moon);
			}
		}
	}
	// The sill.
	const sill = WINDOW.y + WINDOW.h;
	rect(layer, WINDOW.x - 2, sill, WINDOW.w + 4, 1, frame);
	rect(layer, WINDOW.x - 2, sill + 1, WINDOW.w + 4, 1, frameShade);
}

/**
 * The wall map: a parchment sheet with a sea, coastlines, islands and inked borders, its corners curling.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawMap(canvas, random) {
	const { x: mx, y: my, w, h } = MAP;
	for (let y = my; y < my + h; y++) {
		for (let x = mx; x < mx + w; x++) {
			const u = (x - mx) / w;
			const v = (y - my) / h;
			// A continent on the left, a long coast on the right, sea between.
			const coast =
				u < 0.42 + Math.sin(v * 7) * 0.06 ||
				(u > 0.72 + Math.sin(v * 5 + 1) * 0.05 && v > 0.15);
			const island =
				Math.hypot(u - 0.57, v - 0.32) < 0.07 ||
				Math.hypot(u - 0.6, v - 0.72) < 0.05;
			let colour =
				coast || island ? LAND : (x + y) % 7 === 0 ? SEA_DEEP : SEA;
			if ((coast || island) && Math.hypot(u - 0.2, v - 0.45) < 0.12) {
				colour = LAND_HIGH;
			}
			if (x === mx || y === my) {
				colour = PARCHMENT;
			} else if (x === mx + w - 1 || y === my + h - 1) {
				colour = PARCHMENT_EDGE;
			}
			set(canvas, x, y, colour);
		}
	}
	// Inked borders between the realms.
	for (let y = my + 2; y < my + h - 2; y++) {
		if (y % 2 === 0) {
			set(canvas, mx + 9 + Math.round(Math.sin(y * 0.8)), y, BORDER);
			set(canvas, mx + 33 + Math.round(Math.sin(y * 0.6)), y, BORDER);
		}
	}
	for (let x = mx + 2; x < mx + 16; x += 2) {
		set(canvas, x, my + 8 + Math.round(Math.sin(x * 0.7)), BORDER);
	}
	// Curling corners.
	for (const [x, y] of [
		[mx, my],
		[mx + w - 1, my],
		[mx, my + h - 1],
		[mx + w - 1, my + h - 1],
	]) {
		set(canvas, x, y, PARCHMENT_EDGE);
	}
	// A few small towns.
	for (let i = 0; i < 6; i++) {
		const x = mx + 3 + Math.floor(random() * (w - 6));
		const y = my + 3 + Math.floor(random() * (h - 6));
		if (get(canvas, x, y) === LAND) {
			set(canvas, x, y, BORDER);
		}
	}
}

/**
 * The pins and the red strings that tie them together, drawn after the map's outline.
 * The web spreads from one gold pin; one string runs loose to the pin in the spymaster's hand.
 * @param {Canvas} canvas
 */
function drawStrings(canvas) {
	const { x: mx, y: my } = MAP;
	const pins = [
		[mx + 6, my + 4],
		[mx + 4, my + 14],
		[mx + 13, my + 9],
		[mx + 22, my + 5],
		[mx + 19, my + 16],
		[mx + 32, my + 4],
		[mx + 33, my + 12],
	];
	const hub = pins[2];
	for (const [a, b] of [
		[0, 2],
		[1, 2],
		[2, 3],
		[2, 4],
		[3, 5],
		[4, 6],
		[3, 6],
	]) {
		line(
			canvas,
			pins[a][0],
			pins[a][1],
			pins[b][0],
			pins[b][1],
			C.brickRed
		);
	}
	line(canvas, pins[4][0], pins[4][1], HAND.x - 1, HAND.y - 1, C.brickRed);
	for (const [x, y] of pins) {
		set(
			canvas,
			x,
			y,
			x === hub[0] && y === hub[1] ? C.gold : C.brickRedLight
		);
		set(canvas, x + 1, y + 1, C.ink);
	}
	set(canvas, hub[0], hub[1] - 1, C.lampGlow);
}

/**
 * A high-backed chair behind the spymaster, dark oak with a gold finial.
 * @param {Canvas} scene
 */
function drawChair(scene) {
	rect(scene, 55, 20, 6, DESK - 20, C.timberShade);
	rect(scene, 55, 20, 1, DESK - 20, C.timber);
	rect(scene, 57, 23, 2, DESK - 26, C.wood);
	rect(scene, 57, 18, 2, 2, C.gold);
	set(scene, 57, 17, C.gold);
}

/**
 * The spymaster's arm, reaching from his shoulder up to the map, the hand pressing in a pin.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	const lit = mix(C.roof, C.amber, 0.35);
	for (let i = 0; i < 4; i++) {
		line(
			scene,
			SHOULDER.x - 1 + i,
			SHOULDER.y,
			HAND.x + 1 + i,
			HAND.y + 2,
			i === 0 ? lit : i === 3 ? C.roofShade : C.roof
		);
	}
	// The ruffled cuff and the hand.
	rect(scene, HAND.x + 1, HAND.y + 2, 3, 1, C.creamLight);
	rect(scene, HAND.x, HAND.y, 3, 2, C.skin);
	set(scene, HAND.x + 2, HAND.y + 1, C.skinShade);
}

/**
 * The new pin's red head between the spymaster's fingers, drawn last.
 * @param {Canvas} scene
 */
function drawPin(scene) {
	set(scene, HAND.x - 1, HAND.y - 1, C.brickRedLight);
	set(scene, HAND.x - 1, HAND.y - 2, C.lampGlow);
}

/**
 * The desk: a dark top with sealed letters, a dagger and a candle, and a front of drawers.
 * @param {Canvas} scene
 */
function drawDesk(scene) {
	for (let y = DESK; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.timberShade;
			if (y === DESK) {
				colour = C.timber;
			} else if (y > DESK + 3) {
				const panel = (x + 4) % 16;
				colour =
					y === DESK + 4
						? C.wood
						: panel === 0
							? C.timber
							: panel === 15
								? C.wood
								: C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Brass pulls on the drawers.
	for (const x of [3, 19, 35, 51]) {
		rect(scene, x + 2, DESK + 9, 3, 1, C.brass);
	}
	// A stack of intercepted letters under red seals, and a dagger laid beside them.
	for (const [x, y, w] of [
		[3, DESK - 1, 11],
		[4, DESK - 3, 10],
		[3, DESK - 5, 11],
	]) {
		rect(scene, x, y, w, 2, C.creamLight);
		rect(scene, x, y + 1, w, 1, C.cream);
		set(scene, x + Math.floor(w / 2), y, C.brickRed);
		set(scene, x + Math.floor(w / 2), y + 1, C.brickRedShade);
	}
	rect(scene, 34, DESK + 1, 9, 2, C.cream);
	set(scene, 38, DESK + 1, C.brickRed);
	line(scene, 16, DESK + 2, 22, DESK, C.stoneLight);
	line(scene, 17, DESK + 2, 22, DESK + 1, C.stone);
	rect(scene, 23, DESK - 1, 1, 3, C.gold);
	line(scene, 24, DESK, 26, DESK - 1, C.timber);
	// The candlestick.
	rect(scene, FLAME.x - 2, DESK - 1, 5, 2, C.brass);
	rect(scene, FLAME.x - 1, FLAME.y + 2, 3, DESK - FLAME.y - 3, C.creamLight);
	rect(scene, FLAME.x + 1, FLAME.y + 2, 1, DESK - FLAME.y - 3, C.cream);
}

/**
 * The candle's flame, drawn after the glow so it stays the brightest thing in the room.
 * @param {Canvas} scene
 */
function drawCandle(scene) {
	set(scene, FLAME.x, FLAME.y - 2, C.gold);
	set(scene, FLAME.x, FLAME.y - 1, C.lampGlow);
	set(scene, FLAME.x, FLAME.y, C.white);
	set(scene, FLAME.x - 1, FLAME.y, C.gold);
	set(scene, FLAME.x + 1, FLAME.y, C.gold);
	set(scene, FLAME.x, FLAME.y + 1, C.amber);
}

/**
 * The raven on the window sill, dark against the moonlit sky, its eye and back catching the light.
 * @param {Canvas} scene
 */
function drawRaven(scene) {
	const sill = WINDOW.y + WINDOW.h;
	paint(
		scene,
		WINDOW.x - 1,
		sill - 10,
		[
			'....kkk...',
			'...kkekh..',
			'.bbkkkkh..',
			'bb.kkkkkh.',
			'...kkkkkkh',
			'...kkkkkkk',
			'....kkkkkk',
			'....kkkkkk',
			'.....kk.kk',
			'.....t..t.',
		],
		{
			k: C.night,
			h: C.railLight,
			e: C.gold,
			b: C.stoneShade,
			t: C.stoneShade,
		},
		{ mirror: true }
	);
}
