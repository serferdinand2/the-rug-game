// Temporal Nomadism: a traveller in a red cloak, with a staff, strides through a giant glowing hourglass between a castle of the past and a city of the future.
import {
	createCanvas,
	get,
	set,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';
import { drawBuilding } from '../../parts/buildings.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row and the ground's first row. */
const HORIZON = 48;
const GROUND = 49;

/** The hourglass: its centre line (between two columns), the waist's two rows, and its caps' rows. */
const CX = 31.5;
const WAIST = 27;
const TOP_CAP = 3;
const BOTTOM_CAP = 51;

/** The glass's widest half-width, at each bulb's shoulder. */
const BULB = 11;

/**
 * The traveller striding right in a red hooded cloak, with a pack and bedroll and a staff. o cloak, d cloak shade,
 * h cloak lit by the sunset, O cloak rimmed by the portal, S skin, e eye, P pack, p strap, r bedroll, R bedroll strap,
 * a sleeve, L legs, B boots, f staff.
 */
const TRAVELLER = [
	'......hho......f',
	'.....hoooo.....f',
	'....hooooOO....f',
	'....oooSSSO...ff',
	'.rrroooSeSO...f.',
	'.rRrPoooSSO...f.',
	'..PPPPoooddO.SSf',
	'..PPPPooodaaaSf.',
	'..PPPPoooddO..f.',
	'..PPpPoooddO..f.',
	'..PPPPoooddO..f.',
	'...PPhooooddO.f.',
	'...hoooooooddOf.',
	'...hoooooooddO.f',
	'...hooooooooddOf',
	'....hooooooddO.f',
	'.....LL...LL...f',
	'....LL.....LL..f',
	'...LL.......LL.f',
	'..LL.........LL.',
	'.BB..........BBB',
];

/**
 * Draws the Temporal Nomadism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(921);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawTerrain(layer, { kind: 'grassland', top: GROUND, random });
	dimPast(layer);
	coolFuture(layer);

	// The past and the future stand behind the hourglass, so they get their own outline.
	const worlds = createCanvas(64, 64);
	drawPast(worlds);
	drawFuture(worlds);
	outline(worlds, C.ink);
	underlay(worlds, layer);
	drawPlaza(worlds);
	drawPortal(worlds);

	drawFrame(scene);
	drawSand(scene);
	paint(scene, 23, BOTTOM_CAP - TRAVELLER.length, TRAVELLER, {
		o: C.brickRed,
		d: C.brickRedShade,
		h: C.brickRedLight,
		O: C.arcaneLight,
		S: C.skin,
		e: C.ink,
		P: C.timber,
		p: C.timberShade,
		r: C.cream,
		R: C.creamShade,
		a: C.brickRedShade,
		L: C.timberShade,
		B: C.wood,
		f: C.sandLight,
	});
	outline(scene, C.ink);
	underlay(scene, worlds);
	drawGlass(scene);
	drawStream(scene);
	return scene;
}

/**
 * The lower bulb is the portal: a violet whirl glowing brighter towards its heart, over the worlds seen through it.
 * @param {Canvas} canvas
 */
function drawPortal(canvas) {
	const cy = 40;
	for (let y = WAIST + 1; y < BOTTOM_CAP; y++) {
		const half = bulbHalf(y);
		for (let x = Math.ceil(CX - half); x <= Math.floor(CX + half); x++) {
			const dx = x - CX;
			const dy = y - cy;
			const r = Math.hypot(dx, dy * 1.2);
			const turn = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1;
			const arm = (turn * 2 + r / 4) % 1 < 0.4;
			const heat = Math.round(Math.max(0, 1 - r / 13) * 3) / 3;
			const behind = /** @type {Colour} */ (get(canvas, x, y));
			let colour = mix(behind, C.arcane, 0.45 + heat * 0.3);
			if (arm) {
				colour = mix(behind, C.arcaneLight, 0.55 + heat * 0.4);
			}
			if (r < 5) {
				colour = mix(C.arcaneLight, C.white, 0.5);
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * Dims the past's grass to the evening light.
 * @param {Canvas} layer
 */
function dimPast(layer) {
	for (let y = GROUND - 1; y < 64; y++) {
		for (let x = 0; x < 32; x++) {
			const behind = get(layer, x, y);
			if (behind && y >= GROUND) {
				set(layer, x, y, mix(behind, C.roof, 0.3));
			}
		}
	}
}

/**
 * Turns the right half's sky and grass to the cooler, teal-tinged air of the future.
 * @param {Canvas} layer
 */
function coolFuture(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 32; x < 64; x++) {
			const behind = /** @type {Colour} */ (get(layer, x, y));
			set(layer, x, y, mix(behind, C.tealShade, 0.4));
		}
	}
}

/**
 * The future's ground on the right: a glassy floor that mirrors the towers, ruled by a strip of teal light.
 * @param {Canvas} canvas - The worlds, already over the sky, so there is something to mirror
 */
function drawPlaza(canvas) {
	for (let y = GROUND; y < 64; y++) {
		for (let x = 32; x < 64; x++) {
			const above = /** @type {Colour} */ (
				get(canvas, x, 2 * GROUND - y - 1)
			);
			let colour = mix(above, C.nightSky2, 0.5);
			if (y === GROUND) {
				colour = C.tealLight;
			} else if (y === GROUND + 5) {
				colour = C.teal;
			} else if ((y - GROUND) % 3 === 0) {
				colour = C.nightSky2;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The past on the left: a castle tower with a pennant beside a cottage.
 * @param {Canvas} canvas
 */
function drawPast(canvas) {
	drawBuilding(canvas, { kind: 'tower', x: 2, y: GROUND, width: 8 });
	line(canvas, 5, 26, 5, 30, C.wood);
	paint(canvas, 6, 26, ['bbbb', 'bbb.'], { b: C.brickRed });
	drawBuilding(canvas, { kind: 'house', x: 9, y: GROUND, width: 9 });
}

/**
 * The future on the right: slim glass towers with teal-lit windows and a needle spire.
 * @param {Canvas} canvas
 */
function drawFuture(canvas) {
	for (const [left, right, top] of [
		[46, 51, 22],
		[52, 57, 14],
		[58, 63, 27],
	]) {
		for (let y = top; y <= GROUND; y++) {
			for (let x = left; x <= right; x++) {
				let colour = C.tealShade;
				if (x === left) {
					colour = C.tealLight;
				} else if (x === right) {
					colour = mix(C.tealShade, C.night, 0.4);
				} else if (y % 3 === 0 && x % 2 === 0) {
					colour = y % 6 === 0 ? C.tealLight : C.teal;
				}
				set(canvas, x, y, colour);
			}
		}
	}
	// A needle on the tallest tower, tipped with a light.
	line(canvas, 54, 8, 54, 13, C.stoneLight);
	set(canvas, 54, 7, C.tealLight);
}

/**
 * Half the glass's width at a row: two rounded bulbs meeting at a narrow waist.
 * @param {number} y
 * @returns {number} 0 outside the glass.
 */
function bulbHalf(y) {
	if (y <= TOP_CAP + 3 || y >= BOTTOM_CAP) {
		return 0;
	}
	const reach = y <= WAIST ? WAIST - TOP_CAP - 3 : BOTTOM_CAP - WAIST - 2;
	const u = y <= WAIST ? (WAIST - y) / reach : (y - WAIST - 1) / reach;
	return (
		1 +
		(BULB - 1) *
			(Math.sin(u * Math.PI * 0.62) / Math.sin(Math.PI * 0.62)) ** 0.8
	);
}

/**
 * The hourglass's wooden caps and its two turned brass posts.
 * @param {Canvas} canvas
 */
function drawFrame(canvas) {
	for (const top of [TOP_CAP, BOTTOM_CAP]) {
		for (let y = top; y < top + 4; y++) {
			const inset = (top === TOP_CAP ? y === top : y === top + 3) ? 1 : 0;
			for (let x = 15 + inset; x <= 48 - inset; x++) {
				let colour = C.timber;
				if (y === top || (top === BOTTOM_CAP && y === top)) {
					colour = C.timberLight;
				} else if (y === top + 3 || x >= 46) {
					colour = C.timberShade;
				} else if (y === top + 2 && x % 3 === 0) {
					colour = C.brass;
				}
				set(canvas, x, y, colour);
			}
		}
	}
	for (const x of [17, 45]) {
		for (let y = TOP_CAP + 4; y < BOTTOM_CAP; y++) {
			const knob = (y - TOP_CAP) % 8 === 0;
			set(canvas, x, y, knob ? C.gold : C.brass);
			set(canvas, x + 1, y, knob ? C.amber : C.lampFrame);
			if (knob) {
				set(canvas, x - 1, y, C.gold);
				set(canvas, x + 2, y, C.lampFrame);
			}
		}
	}
}

/**
 * The sand left in the upper bulb: a heap sloping down to the waist.
 * @param {Canvas} canvas
 */
function drawSand(canvas) {
	for (let y = 16; y <= WAIST; y++) {
		const half = Math.floor(bulbHalf(y)) - 1;
		const surface = Math.min(half, Math.max(0, (y - 16) * 2));
		for (
			let x = Math.ceil(CX - surface);
			x <= Math.floor(CX + surface);
			x++
		) {
			const colour =
				x > CX + surface - 3
					? C.sandShade
					: x < CX - surface + 2
						? C.sandLight
						: C.sand;
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The glass of both bulbs: thin pale edges with a glint, drawn over everything so they stay one pixel wide.
 * @param {Canvas} scene
 */
function drawGlass(scene) {
	for (let y = TOP_CAP + 4; y < BOTTOM_CAP; y++) {
		const half = bulbHalf(y);
		const left = Math.round(CX - half);
		const right = Math.round(CX + half);
		set(scene, left, y, C.white);
		set(scene, right, y, mix(C.tealLight, C.white, 0.4));
	}
	// A glint on each bulb's left shoulder.
	for (const [x, y] of [
		[25, 11],
		[24, 13],
		[24, 14],
		[24, 33],
		[23, 35],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * The thin stream of sand running through the waist into the portal below.
 * @param {Canvas} scene
 */
function drawStream(scene) {
	for (let y = WAIST; y <= 33; y++) {
		set(scene, 31, y, y % 2 ? C.sandLight : C.gold);
	}
}
