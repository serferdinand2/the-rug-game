// High Council: robed elders on tall thrones in a semicircle, seen from low in front, their faces lit by a glowing violet orb.
import {
	createCanvas,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The floor's first row, and the orb's centre and radius. */
const FLOOR = 36;
const ORB = { x: 32, y: 38, r: 5 };

/** Violet light on skin, hair and beard, where the orb shines up on them. */
const LIT_SKIN = mix(C.skin, C.arcaneLight, 0.45);
const LIT_HAIR = mix(C.snow, C.arcaneLight, 0.5);

/**
 * An elder's head, facing the viewer, 7 wide. W white hair, S skin, s skin shade, e eye,
 * L skin lit by the orb, B beard, b beard lit by the orb.
 */
const HEAD_FRONT = [
	'..WWW..',
	'.WWWWW.',
	'.WSSSW.',
	'.WeSeW.',
	'.WSsSW.',
	'.WLLLW.',
	'..BbB..',
	'..BbB..',
	'...b...',
];

/** An elder's head turned three-quarters to the right. Keys as for HEAD_FRONT. */
const HEAD_TURNED = [
	'.WWW...',
	'WWWWW..',
	'WWSSSS.',
	'WWSSeS.',
	'WWSSSs.',
	'.WSLLL.',
	'..BBbb.',
	'..BBbb.',
	'...Bb..',
];

/**
 * One seat in the semicircle: the throne's back, seat row and feet, and the elder on it.
 * @typedef {Object} Seat
 * @property {number} x - The back's leftmost column
 * @property {number} top - The back's top row, below its crest
 * @property {number} w - The back's width
 * @property {number} seat - The seat's row
 * @property {number} base - The row the legs stand on
 * @property {Colour} robe - The elder's robe
 * @property {-1 | 0 | 1} facing - The elder looks left, ahead or right
 */

/** The five seats, nearest last: the far centre, the two in between, the two nearest at the ends. */
/** @type {Seat[]} */
const SEATS = [
	{ x: 26, top: 6, w: 13, seat: 29, base: 39, robe: C.cream, facing: 0 },
	{ x: 13, top: 9, w: 11, seat: 34, base: 46, robe: C.brickRed, facing: 1 },
	{ x: 41, top: 9, w: 11, seat: 34, base: 46, robe: C.daySea2, facing: -1 },
	{ x: 0, top: 6, w: 11, seat: 42, base: 54, robe: C.pine, facing: 1 },
	{ x: 53, top: 6, w: 11, seat: 42, base: 54, robe: C.roofLight, facing: -1 },
];

/**
 * Draws the High Council scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(311);

	drawInterior(layer, { floor: FLOOR, random, wall: 'stone' });
	dim(layer);
	drawFloorRing(layer);

	// The thrones stand behind the orb, so they get their own outline.
	const thrones = createCanvas(64, 64);
	for (const seat of SEATS) {
		drawThrone(thrones, seat);
		drawElder(thrones, seat);
	}
	outline(thrones, C.ink);
	underlay(thrones, layer);

	drawPedestal(scene);
	outline(scene, C.ink);
	underlay(scene, thrones);
	glow(scene, {
		x: ORB.x,
		y: ORB.y,
		radius: 36,
		colour: C.arcane,
		strength: 0.5,
		steps: 5,
		skip: [C.ink, LIT_SKIN, LIT_HAIR],
	});
	drawOrb(scene);
	return scene;
}

/**
 * Darkens the room for the night: the walls fall back into shadow, deepest under the vault.
 * @param {Canvas} layer
 */
function dim(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = layer.p[y * 64 + x];
			if (colour) {
				set(layer, x, y, mix(colour, C.nightSky1, y < 14 ? 0.72 : 0.6));
			}
		}
	}
}

/**
 * A ring of violet inlay on the floor round the orb's pedestal, brighter on its near side.
 * @param {Canvas} layer
 */
function drawFloorRing(layer) {
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = ((x - ORB.x) / 22) ** 2 + ((y - 57) / 5) ** 2;
			if (d <= 1 && d > 0.7) {
				set(layer, x, y, y > 57 ? C.arcane : C.arcaneShade);
			}
		}
	}
}

/**
 * A high-backed throne: a gilded frame round a dark velvet back with a pointed crest,
 * armrests, a cushioned seat and gilded legs.
 * @param {Canvas} canvas
 * @param {Seat} seat
 */
function drawThrone(canvas, { x, top, w, seat, base }) {
	const right = x + w - 1;
	const mid = x + (w - 1) / 2;
	// The crest: a pointed arch rising above the back, with a finial.
	for (let j = 1; j <= 4; j++) {
		const half = (w - 1) / 2 - j * 1.4;
		for (let i = Math.ceil(mid - half); i <= Math.floor(mid + half); i++) {
			set(canvas, i, top - j, i > mid ? C.lampFrame : C.brass);
		}
	}
	rect(canvas, Math.floor(mid), top - 6, w % 2 ? 1 : 2, 2, C.gold);
	// The back, down to the seat.
	for (let y = top; y < seat; y++) {
		for (let i = x; i <= right; i++) {
			const frame = i <= x + 1 || i >= right - 1 || y === top;
			const colour = frame
				? i >= right - 1
					? C.lampFrame
					: C.brass
				: i >= right - 3
					? C.roofShade
					: C.roof;
			set(canvas, i, y, colour);
		}
	}
	// Armrests on posts, the seat's cushion and the legs.
	rect(canvas, x - 1, seat - 6, 3, 1, C.gold);
	rect(canvas, right - 1, seat - 6, 3, 1, C.brass);
	rect(canvas, x - 1, seat - 5, 2, 5, C.brass);
	rect(canvas, right, seat - 5, 2, 5, C.lampFrame);
	rect(canvas, x - 1, seat, w + 2, 2, C.brickRedShade);
	rect(canvas, x - 1, seat + 2, w + 2, 1, C.lampFrame);
	rect(canvas, x - 1, seat + 3, 2, base - seat - 3, C.brass);
	rect(canvas, right, seat + 3, 2, base - seat - 3, C.lampFrame);
}

/**
 * An elder sitting on a throne: a white-haired, white-bearded head, a robe with a gold stole,
 * forearms along the armrests, the lap lit from below, and short shins down to the slippers.
 * @param {Canvas} canvas
 * @param {Seat} seat
 */
function drawElder(canvas, { x, w, seat, base, robe, facing }) {
	const cx = x + Math.floor(w / 2);
	const lit = mix(robe, C.white, 0.3);
	const shade = mix(robe, C.ink, 0.35);
	const headTop = seat - 19;
	const neck = headTop + 6;
	// The torso, narrower than the back so the frame shows round it.
	for (let y = neck; y < seat - 2; y++) {
		const half = y === neck ? 2 : 3;
		for (let i = cx - half; i <= cx + half; i++) {
			const far = facing >= 0 ? i === cx + half : i === cx - half;
			set(canvas, i, y, far ? shade : robe);
		}
	}
	// Sleeves along the armrests, hands at their ends.
	for (const side of [-1, 1]) {
		for (let i = 4; i <= 5; i++) {
			set(canvas, cx + side * i, seat - 7, robe);
			set(canvas, cx + side * i, seat - 6, shade);
		}
		set(canvas, cx + side * 6, seat - 7, C.skin);
	}
	// The lap: wider, its top lit by the orb below and in front.
	for (let y = seat - 2; y <= seat; y++) {
		for (let i = cx - 4; i <= cx + 4; i++) {
			set(canvas, i, y, y === seat - 2 ? lit : robe);
		}
	}
	// The shins, split by a fold, and the slippers.
	for (let y = seat + 1; y < base - 1; y++) {
		for (let i = cx - 3; i <= cx + 3; i++) {
			set(canvas, i, y, i === cx ? shade : robe);
		}
	}
	rect(canvas, cx - 3, base - 1, 2, 1, C.brickRedShade);
	rect(canvas, cx + 2, base - 1, 2, 1, C.brickRedShade);
	// The stole: two gold bands down the front.
	for (let y = neck + 2; y < seat - 2; y++) {
		set(canvas, cx - 1 + facing, y, C.gold);
		set(canvas, cx + 1 + facing, y, C.gold);
	}
	paint(
		canvas,
		cx - 3,
		headTop,
		facing === 0 ? HEAD_FRONT : HEAD_TURNED,
		{
			W: C.snow,
			S: C.skin,
			s: C.skinShade,
			e: C.wood,
			L: LIT_SKIN,
			B: C.creamLight,
			b: LIT_HAIR,
		},
		{ mirror: facing < 0 }
	);
}

/**
 * The pedestal the orb rests on: a gold cradle on a stone column, on a stepped base.
 * @param {Canvas} scene
 */
function drawPedestal(scene) {
	rect(scene, ORB.x - 4, ORB.y + 4, 9, 2, C.gold);
	rect(scene, ORB.x - 3, ORB.y + 6, 7, 1, C.amber);
	for (let y = ORB.y + 7; y <= 56; y++) {
		for (let x = ORB.x - 2; x <= ORB.x + 2; x++) {
			set(
				scene,
				x,
				y,
				x === ORB.x - 2
					? C.stoneLight
					: x === ORB.x + 2
						? C.stoneShade
						: C.stone
			);
		}
	}
	for (const [y, half] of [
		[57, 5],
		[58, 5],
		[59, 7],
		[60, 7],
	]) {
		for (let x = ORB.x - half; x <= ORB.x + half; x++) {
			set(
				scene,
				x,
				y,
				x >= ORB.x + half - 1 ? C.stoneShade : C.stoneLight
			);
		}
	}
}

/**
 * The orb: a violet sphere, white-hot at its heart, with a shaded rim and a glint.
 * Drawn last, over the cradle's outline, so it shines out of the scene.
 * @param {Canvas} scene
 */
function drawOrb(scene) {
	for (let y = ORB.y - ORB.r - 1; y <= ORB.y + ORB.r + 1; y++) {
		for (let x = ORB.x - ORB.r - 1; x <= ORB.x + ORB.r + 1; x++) {
			const d = Math.hypot(x - ORB.x, y - ORB.y);
			if (d > ORB.r + 1.3) {
				continue;
			}
			const colour =
				d > ORB.r + 0.3
					? C.ink
					: d < 1.6
						? C.white
						: d < 3
							? C.arcaneLight
							: d < 4.3
								? C.arcane
								: C.arcaneShade;
			if (colour !== C.ink || y < ORB.y + 4) {
				set(scene, x, y, colour);
			}
		}
	}
	set(scene, ORB.x - 2, ORB.y - 3, C.white);
	// Sparks rising from the orb.
	for (const [x, y] of [
		[28, 29],
		[36, 30],
		[33, 27],
	]) {
		set(scene, x, y, C.arcaneLight);
	}
}
