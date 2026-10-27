// Granges: farmers arriving at dusk with baskets of fruit and vegetables at a white clapboard grange hall, its windows and open doors lit.
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
import { drawSky } from '../../parts/sky.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon (seed 877 sets the dusk sun at column 9, low on the left), and the hall's corners. */
const HORIZON = 44;
/** The front gable: its left corner, peak and right corner columns, its eave row and its foot. */
const FRONT_L = 34;
const FRONT_R = 56;
const PEAK = 45;
const EAVE = 27;
const FOOT = 51;
/** How far the side wall runs back to the left, and how much it rises as it goes. */
const DEPTH = 26;
const RISE = 3;

/** White boards in the evening light: the side wall warm from the sunset, the front gable cool in shade. */
const SIDE = mix(C.creamLight, C.duskSky6, 0.18);
const SIDE_LINE = mix(C.cream, C.duskSky5, 0.3);
const FRONT = mix(C.cream, C.duskSky3, 0.22);
const FRONT_LINE = mix(C.creamShade, C.duskSky3, 0.35);

/**
 * Draws the Granges scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(877);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawTreeline(layer);
	drawGround(layer, random);

	drawHall(scene);
	drawPumpkins(scene);
	drawFarmers(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawLights(scene);
	return scene;
}

/**
 * Dark trees and a far barn along the horizon, in the dusk haze.
 * @param {Canvas} layer
 */
function drawTreeline(layer) {
	const far = mix(C.pineShade, C.duskSky3, 0.55);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON -
				3 -
				Math.abs(Math.sin(x * 0.45)) * 3 -
				Math.abs(Math.sin(x * 0.17)) * 2
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, far);
		}
	}
}

/**
 * The lawn before the hall in the evening, and the trodden path to its steps.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const lawnLit = mix(C.grass, C.duskSky5, 0.3);
	const lawn = mix(C.grass, C.duskSky3, 0.45);
	const lawnDeep = mix(C.grassShade, C.duskSky3, 0.5);
	for (let y = HORIZON + 1; y < 64; y++) {
		const t = (y - HORIZON) / (63 - HORIZON);
		for (let x = 0; x < 64; x++) {
			let colour =
				t > 0.6 || (t > 0.4 && (x + y) % 2 === 0) ? lawnDeep : lawn;
			if (y === HORIZON + 1) {
				colour = lawnLit;
			}
			set(layer, x, y, colour);
		}
	}
	const path = mix(C.sandShade, C.duskSky4, 0.35);
	const pathLit = mix(C.sand, C.duskSky6, 0.3);
	for (let y = FOOT + 1; y < 64; y++) {
		const half = 3 + (y - FOOT) * 0.6;
		const centre = 46 - (y - FOOT) * 0.4;
		for (
			let x = Math.round(centre - half);
			x <= Math.round(centre + half);
			x++
		) {
			set(layer, x, y, (x + y) % 5 === 0 ? pathLit : path);
		}
	}
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 3 + Math.floor(random() * (60 - HORIZON));
		set(layer, x, y, lawnLit);
	}
}

/**
 * The grange hall seen from the corner: a long clapboard side, a front gable with a porch over the
 * double doors, a slate roof and a brick chimney.
 * @param {Canvas} scene
 */
function drawHall(scene) {
	const back = FRONT_L - DEPTH;
	// The side wall, receding to the left: boards every other row.
	for (let x = back; x < FRONT_L; x++) {
		const lift = Math.round(((FRONT_L - x) / DEPTH) * RISE);
		for (let y = EAVE - lift; y <= FOOT - lift; y++) {
			const board = (y + lift) % 2 === 0;
			set(scene, x, y, board ? SIDE_LINE : SIDE);
		}
		// A stone footing.
		set(scene, x, FOOT - lift + 1, C.stoneShade);
	}
	// The front gable: walls, then the triangle up to the peak.
	for (let y = EAVE; y <= FOOT; y++) {
		for (let x = FRONT_L; x <= FRONT_R; x++) {
			set(scene, x, y, y % 2 === 0 ? FRONT_LINE : FRONT);
		}
	}
	rect(scene, FRONT_L, FOOT + 1, FRONT_R - FRONT_L + 1, 1, C.stoneShade);
	const half = (FRONT_R - FRONT_L) / 2;
	for (let y = EAVE - Math.ceil(half * 0.75); y < EAVE; y++) {
		const reach = Math.round((y - (EAVE - half * 0.75)) / 0.75);
		for (let x = PEAK - reach; x <= PEAK + reach; x++) {
			set(scene, x, y, y % 2 === 0 ? FRONT_LINE : FRONT);
		}
	}
	// The corner post between the two walls.
	for (let y = EAVE; y <= FOOT; y++) {
		set(scene, FRONT_L, y, C.creamLight);
	}
	drawChimney(scene);
	drawRoof(scene, back, half);
	drawPorch(scene);
	// The steps up to the doors.
	for (let i = 0; i < 3; i++) {
		rect(
			scene,
			PEAK - 5 - i,
			FOOT - 1 + i,
			11 + i * 2,
			1,
			i % 2 ? C.stone : C.stoneLight
		);
	}
}

/**
 * The slate roof: the long slope over the side wall, and the gable's own eaves.
 * @param {Canvas} scene
 * @param {number} back - The side wall's far column
 * @param {number} half - Half the gable's width
 */
function drawRoof(scene, back, half) {
	const rows = Math.ceil(half * 0.75);
	// The long slope: each row steps right as it climbs towards the ridge.
	for (let j = 0; j <= rows + 1; j++) {
		const y = EAVE - 1 - j;
		const from = back - 1 + Math.round(j / 0.75);
		const to = FRONT_L + Math.round(j / 0.75);
		for (let x = from; x <= to; x++) {
			const lift = Math.round(
				((FRONT_L - Math.min(x, FRONT_L)) / DEPTH) * RISE
			);
			const colour =
				j === 0
					? C.roofShade
					: (x + j) % 4 === 0
						? C.roofShade
						: j > rows - 1
							? C.roofLight
							: C.roof;
			set(scene, x, y - lift, colour);
		}
	}
	// The gable's eaves: a dark trim along both slopes.
	for (let i = 0; i <= half + 1; i++) {
		const y = EAVE - 1 - Math.round(i * 0.75);
		set(scene, FRONT_L - 1 + i, y, C.roofShade);
		set(scene, FRONT_R + 1 - i, y, C.roofShade);
	}
}

/**
 * A brick chimney rising through the roof near the back.
 * @param {Canvas} scene
 */
function drawChimney(scene) {
	const x = FRONT_L - 17;
	const top = EAVE - 18;
	for (let y = top; y <= top + 7; y++) {
		for (let i = 0; i < 4; i++) {
			const colour =
				i === 0
					? C.brickRedLight
					: i === 3
						? C.brickRedShade
						: (y + i) % 3 === 0
							? C.brickRedShade
							: C.brickRed;
			set(scene, x + i, y, colour);
		}
	}
	rect(scene, x - 1, top, 6, 1, C.stoneShade);
}

/**
 * The porch roof over the double doors, on two posts.
 * @param {Canvas} scene
 */
function drawPorch(scene) {
	for (let i = 0; i < 2; i++) {
		rect(
			scene,
			PEAK - 7 + i,
			FOOT - 15 + i,
			15 - i * 2,
			1,
			i === 0 ? C.roofLight : C.roof
		);
	}
	rect(scene, PEAK - 7, FOOT - 13, 15, 1, C.roofShade);
	for (const x of [PEAK - 6, PEAK + 6]) {
		rect(scene, x, FOOT - 12, 1, 11, C.creamLight);
	}
}

/**
 * Pumpkins and squashes heaped beside the steps.
 * @param {Canvas} scene
 */
function drawPumpkins(scene) {
	const pumpkin = ['.g..', 'aOOa', 'OOOa', '.aa.'];
	const colours = { g: C.pine, O: C.amber, a: mix(C.amber, C.brickRed, 0.4) };
	for (const [x, y] of [
		[32, 51],
		[35, 52],
		[33, 48],
	]) {
		paint(scene, x, y, pumpkin, colours);
	}
}

/**
 * A basket of the harvest, held in front: a woven basket heaped with produce.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {Colour[]} produce - The colours heaped on top
 */
function drawBasket(scene, x, y, produce) {
	produce.forEach((colour, i) => {
		set(scene, x + 1 + i, y, colour);
		set(scene, x + i, y + 1, colour);
	});
	set(scene, x + produce.length, y + 1, produce[0]);
	for (let i = 0; i <= produce.length; i++) {
		set(scene, x + i, y + 2, i % 2 ? C.amber : C.timberLight);
		set(scene, x + i, y + 3, C.timber);
	}
}

/**
 * The farmers gathering at the hall, each carrying a basket of the harvest.
 * @param {Canvas} scene
 */
function drawFarmers(scene) {
	/** @type {[number, number, 'left' | 'right', Colour, Colour[]][]} */
	const farmers = [
		[13, 57, 'right', C.daySea1, [C.brickRed, C.brickRedLight, C.brickRed]],
		[22, 60, 'right', C.railLight, [C.grassLight, C.grass, C.grassLight]],
		[39, 62, 'right', C.creamLight, [C.amber, C.gold, C.amber]],
		[52, 59, 'left', C.pineLight, [C.roofLight, C.railLight, C.roofLight]],
		[59, 56, 'left', C.brickRedLight, [C.gold, C.grassLight, C.gold]],
	];
	for (const [x, y, facing, clothes, produce] of farmers) {
		drawFigure(scene, { x, y, facing, clothes });
		const front = facing === 'right' ? x + 3 : x - 3;
		drawBasket(scene, front, y - 6, produce);
	}
	// Two more already climbing the steps, seen from behind.
	drawFigure(scene, {
		x: PEAK - 4,
		y: FOOT - 1,
		facing: 'right',
		clothes: C.timberLight,
	});
	drawFigure(scene, {
		x: PEAK + 1,
		y: FOOT - 1,
		facing: 'left',
		clothes: C.duskSky4,
	});
}

/**
 * A lit sash window: four warm panes split by a dark cross of glazing bars.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {number} h - Height
 */
function drawWindow(scene, x, y, h) {
	const bar = y + Math.floor(h / 2);
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < 4; i++) {
			const colour =
				j === y + h - 1 - y
					? C.amber
					: i === 0 && j < 2
						? C.lampGlow
						: C.gold;
			set(scene, x + i, y + j, colour);
		}
	}
	rect(scene, x, bar, 4, 1, C.lampFrame);
	rect(scene, x + 2, y, 1, h, C.lampFrame);
}

/**
 * The lights, painted after the outline: the open doors, two storeys of windows and the fanlight in the gable
 * glowing gold, and warm light spilling onto the steps and the crowd.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	// The open double doors, behind the people on the steps.
	for (let y = FOOT - 11; y <= FOOT - 2; y++) {
		for (let x = PEAK - 3; x <= PEAK + 3; x++) {
			const behind = scene.p[y * 64 + x];
			if (behind === FRONT || behind === FRONT_LINE || behind === C.ink) {
				set(scene, x, y, y < FOOT - 9 ? C.gold : C.lampGlow);
			}
		}
	}
	// Two storeys of windows down the side wall, rising as the wall recedes.
	for (const x of [FRONT_L - 23, FRONT_L - 17, FRONT_L - 11, FRONT_L - 5]) {
		const lift = Math.round(((FRONT_L - x) / DEPTH) * RISE);
		drawWindow(scene, x, EAVE + 3 - lift, 4);
		drawWindow(scene, x, EAVE + 13 - lift, 5);
	}
	// The front: an upper window either side, a lower one either side of the porch.
	for (const x of [FRONT_L + 3, FRONT_R - 6]) {
		drawWindow(scene, x, EAVE + 3, 4);
		drawWindow(scene, x, EAVE + 13, 5);
	}
	// A half-round fanlight in the gable, lit from inside, its glazing bars fanning out from the sill.
	const sill = EAVE - 2;
	for (let y = sill - 5; y <= sill; y++) {
		for (let x = PEAK - 5; x <= PEAK + 5; x++) {
			const distance = Math.hypot(x - PEAK, y - sill);
			if (distance > 5.2) {
				continue;
			}
			const bar = x === PEAK || Math.abs(x - PEAK) === sill - y;
			let colour = y === sill ? C.amber : bar ? C.lampFrame : C.gold;
			if (distance > 4.2) {
				colour = C.lampFrame;
			} else if (!bar && distance < 2.5 && y < sill) {
				colour = C.lampGlow;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, PEAK - 6, sill + 1, 13, 1, C.creamLight);
	glow(scene, {
		x: PEAK,
		y: FOOT + 2,
		radius: 12,
		colour: C.gold,
		strength: 0.25,
		skip: [C.gold, C.lampGlow, C.amber, C.lampFrame],
	});
}
