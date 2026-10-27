// Political Posturing: a speaker on a balcony hung with star banners and bunting, fist raised to a crowd at dusk.
import {
	createCanvas,
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
import { drawSky } from '../../parts/sky.js';
import { drawBanner } from '../../parts/banner.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The hall's walls and centre column, the cornice's row, and the balcony's rail and floor. */
const LEFT = 14;
const RIGHT = 63;
const CX = 39;
const CORNICE = 10;
const RAIL = 28;
const FLOOR = 34;
/** The row the hall stands on, where the crowd begins, and the dusk sky's horizon behind the roofs. */
const STREET = 49;
const HORIZON = 35;

/** The hall's stone, warm in the last of the sun. */
const STONE_LIT = mix(C.cream, C.duskSky6, 0.25);
const STONE = mix(C.creamShade, C.duskSky5, 0.2);
const STONE_SHADE = mix(C.creamShade, C.duskSky3, 0.45);

/**
 * The speaker, facing the crowd, one fist thrust high: a dark suit, a white collar and a red sash.
 * S skin, s skin shade, H hair, e eye, m open mouth, C suit, c suit shade, W collar, R sash, r sash shade.
 */
const SPEAKER = [
	'.SS...........',
	'SSS...........',
	'sSS...........',
	'CC............',
	'CC....HHH.....',
	'CC...HHHHH....',
	'CC...HSSSH....',
	'CC...SeSeS....',
	'Cc...SSSSs....',
	'CC....SmS.....',
	'CCc...SSs.....',
	'.CCCCCWWWCCC..',
	'..CCCRWWWcCCC.',
	'...CCCRWcCCCC.',
	'...CCCCRrCCCCc',
	'...CCCCCRrCCCc',
	'...CCCCCCRrCSS',
	'...CCCCCCCRrSS',
];

/** A five-pointed gold star for the banners. */
const STAR = [
	'...g...',
	'..ggg..',
	'ggggggg',
	'.ggggg.',
	'..ggg..',
	'.gg.gg.',
	'.g...g.',
];

/**
 * Draws the Political Posturing scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	// Seed 1889 sets the dusk sky's sun low on the left, over the roofs.
	const random = seededRandom(1889);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawRoofs(layer);
	drawSquare(layer);

	// The hall stands behind the speaker and the crowd, so it gets its own outline.
	const hall = createCanvas(64, 64);
	drawHall(hall);
	drawDoorway(hall);
	drawDrape(hall, CX - 20);
	drawDrape(hall, CX + 13);
	outline(hall, C.ink);
	underlay(hall, layer);
	glow(hall, { x: CX, y: 22, radius: 14, colour: C.gold, strength: 0.35 });

	paint(scene, CX - 5, RAIL - SPEAKER.length + 2, SPEAKER, {
		S: C.skin,
		s: C.skinShade,
		H: C.timberShade,
		e: C.wood,
		m: C.brickRedShade,
		C: C.roofShade,
		c: C.night,
		W: C.creamLight,
		R: C.brickRed,
		r: C.brickRedShade,
	});
	drawBalcony(scene);
	drawLampPosts(scene);
	drawCrowd(scene, { x: 0, y: 59, count: 16, random });
	drawCrowd(scene, { x: 2, y: 63, count: 16, random });
	drawFlags(scene);
	outline(scene, C.ink);
	underlay(scene, hall);
	drawLamps(scene);
	drawRaisedHands(scene);
	return scene;
}

/**
 * Townhouses to the left of the hall, flat-roofed and dark against the setting sun, with lit windows.
 * @param {Canvas} layer
 */
function drawRoofs(layer) {
	// Far roofs in the haze below the sun.
	rect(
		layer,
		0,
		HORIZON + 1,
		LEFT,
		STREET - HORIZON - 1,
		mix(C.duskSky4, C.roof, 0.5)
	);
	for (const [x0, x1, top] of [
		[0, 6, 39],
		[7, LEFT - 1, 37],
	]) {
		rect(layer, x0, top, x1 - x0 + 1, STREET - top, C.roof);
		rect(layer, x0, top, x1 - x0 + 1, 1, C.roofLight);
		rect(layer, x1, top + 1, 1, STREET - top - 1, C.roofShade);
		for (let y = top + 3; y < STREET - 2; y += 4) {
			for (let x = x0 + 1; x < x1 - 1; x += 3) {
				rect(layer, x, y, 1, 2, (x + y) % 2 ? C.gold : C.amber);
			}
		}
	}
	rect(layer, 9, 34, 2, 3, C.roofShade);
}

/**
 * The square in front of the hall, its cobbles in the shadow of dusk.
 * @param {Canvas} layer
 */
function drawSquare(layer) {
	for (let y = STREET; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				(x + (y % 2) * 2) % 4 === 0 ? C.stoneShade : C.stoneMid
			);
		}
	}
}

/**
 * The hall's front: a parapet, a deep cornice, pilasters and a rusticated ground floor.
 * @param {Canvas} canvas
 */
function drawHall(canvas) {
	// Wall.
	for (let y = CORNICE + 3; y < STREET; y++) {
		for (let x = LEFT; x <= RIGHT; x++) {
			set(canvas, x, y, x >= RIGHT - 1 ? STONE_SHADE : STONE);
		}
	}
	// Parapet with balusters, and the cornice under it.
	for (let x = LEFT - 1; x <= RIGHT + 1; x++) {
		set(canvas, x, 6, STONE_LIT);
		set(canvas, x, 9, STONE_SHADE);
		for (let y = 7; y <= 8; y++) {
			set(canvas, x, y, x % 3 === 0 ? STONE : STONE_SHADE);
		}
		set(canvas, x, CORNICE, STONE_LIT);
		set(canvas, x, CORNICE + 1, STONE);
		set(canvas, x, CORNICE + 2, x % 2 ? STONE_SHADE : STONE);
	}
	rect(canvas, LEFT - 2, 6, 2, 4, STONE_LIT);
	// Pilasters.
	for (const x of [LEFT + 1, CX - 10, CX + 8, RIGHT - 1]) {
		rect(canvas, x, CORNICE + 3, 3, STREET - CORNICE - 9, STONE_LIT);
		rect(canvas, x + 2, CORNICE + 3, 1, STREET - CORNICE - 9, STONE);
	}
	// The rusticated ground floor.
	for (let y = STREET - 8; y < STREET; y++) {
		for (let x = LEFT; x <= RIGHT; x++) {
			const joint =
				y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0;
			set(canvas, x, y, joint ? STONE_SHADE : STONE);
		}
	}
	rect(canvas, LEFT, STREET - 9, RIGHT - LEFT + 1, 1, STONE_LIT);
}

/**
 * The tall arched doorway onto the balcony, open and full of warm light from the hall inside.
 * @param {Canvas} canvas
 */
function drawDoorway(canvas) {
	const left = CX - 7;
	const right = CX + 6;
	for (let y = 14; y < FLOOR; y++) {
		for (let x = left - 1; x <= right + 1; x++) {
			const arch =
				Math.hypot(x - CX + 0.5, (y - 21) * 1.1) > 8.4 && y < 21;
			if (arch) {
				continue;
			}
			const frame = x === left - 1 || x === right + 1;
			set(canvas, x, y, frame ? STONE_LIT : y < 19 ? C.gold : C.lampGlow);
		}
	}
	// The doors folded back against the jambs.
	rect(canvas, left, 20, 2, FLOOR - 20, C.timber);
	rect(canvas, right - 1, 20, 2, FLOOR - 20, C.timberShade);
	set(canvas, CX, 13, STONE_LIT);
	set(canvas, CX - 1, 13, STONE_LIT);
}

/**
 * A long blue drape hung from the cornice, gold-fringed, with a gold star and a pointed foot.
 * @param {Canvas} canvas
 * @param {number} x - The drape's leftmost column
 */
function drawDrape(canvas, x) {
	const w = 8;
	const bottom = 42;
	rect(canvas, x - 1, CORNICE + 2, w + 2, 1, C.gold);
	for (let y = CORNICE + 3; y <= bottom; y++) {
		for (let i = 0; i < w; i++) {
			const point = y > bottom - 4 && Math.abs(i - 3.5) > bottom - y;
			if (point) {
				continue;
			}
			let colour =
				i === 0 ? C.daySea2 : i >= w - 2 ? C.nightSea3 : C.nightSea1;
			if (y === CORNICE + 6 || y === bottom - 6) {
				colour = C.gold;
			}
			set(canvas, x + i, y, colour);
		}
	}
	paint(canvas, x, CORNICE + 10, STAR, { g: C.gold });
	set(canvas, x + 3, bottom + 1, C.gold);
	set(canvas, x + 4, bottom + 1, C.gold);
}

/**
 * The balcony: a stone balustrade, a slab on brackets, and red, white and blue bunting swagged along its front.
 * @param {Canvas} scene
 */
function drawBalcony(scene) {
	const left = CX - 14;
	const right = CX + 14;
	rect(scene, left, RAIL, right - left + 1, 1, STONE_LIT);
	rect(scene, left, RAIL + 1, right - left + 1, 1, STONE);
	for (let x = left; x <= right; x++) {
		for (let y = RAIL + 2; y < FLOOR; y++) {
			const baluster = (x - left) % 3 !== 2;
			if (baluster || x === left || x === right) {
				set(scene, x, y, x % 3 === 1 ? STONE_LIT : STONE);
			}
		}
	}
	rect(scene, left - 1, FLOOR, right - left + 3, 1, STONE_LIT);
	rect(scene, left - 1, FLOOR + 1, right - left + 3, 1, STONE_SHADE);
	// The bunting: three swags, each sagging in blue, white and red bands.
	const swag = (right - left + 1) / 3;
	for (let x = left; x <= right; x++) {
		const sag = Math.round(
			Math.sin((((x - left) % swag) / swag) * Math.PI) * 3
		);
		const top = FLOOR + 2;
		set(scene, x, top + sag, C.nightSea1);
		set(scene, x, top + sag + 1, C.white);
		set(scene, x, top + sag + 2, C.brickRed);
		for (let y = top; y < top + sag; y++) {
			set(scene, x, y, C.nightSea1);
		}
	}
	// Brackets under the slab at the ends.
	for (const x of [left, right - 1]) {
		rect(scene, x, FLOOR + 2, 2, 5, STONE);
	}
}

/**
 * Iron lamp posts at the balcony's corners, their globes painted after the outline.
 * @param {Canvas} scene
 */
function drawLampPosts(scene) {
	for (const x of [CX - 14, CX + 14]) {
		line(scene, x, RAIL - 1, x, RAIL - 5, C.wood);
	}
}

/**
 * The lamp globes, glowing in the dusk.
 * @param {Canvas} scene
 */
function drawLamps(scene) {
	for (const x of [CX - 14, CX + 14]) {
		glow(scene, {
			x,
			y: RAIL - 7,
			radius: 6,
			colour: C.gold,
			strength: 0.4,
			skip: [C.ink],
		});
		paint(scene, x - 1, RAIL - 8, ['.k.', 'kwk', 'kwk', '.k.'], {
			k: C.lampFrame,
			w: C.lampGlow,
		});
	}
}

/**
 * Flags carried in the crowd.
 * @param {Canvas} scene
 */
function drawFlags(scene) {
	drawBanner(scene, {
		kind: 'flag',
		x: 4,
		y: 56,
		cloth: C.brickRed,
		device: C.white,
		height: 16,
	});
	drawBanner(scene, {
		kind: 'flag',
		x: 50,
		y: 56,
		cloth: C.daySea1,
		device: C.gold,
		facing: 'left',
		height: 15,
	});
}

/**
 * Hands thrown up in the crowd, drawn after the outline so they stay small.
 * @param {Canvas} scene
 */
function drawRaisedHands(scene) {
	for (const [x, y] of [
		[3, 50],
		[16, 51],
		[24, 50],
		[39, 51],
		[44, 50],
		[60, 51],
	]) {
		set(scene, x, y, C.skin);
		set(scene, x, y + 1, C.skinShade);
		set(scene, x, y + 2, C.ink);
	}
}
