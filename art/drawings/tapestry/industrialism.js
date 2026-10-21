// Industrialism: a dense row of brick mills and smokestacks under a smog-dimmed dusk, a goods train steaming past in front.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';
import { drawFactory } from '../../parts/factory.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row, the mills' feet and the rail. */
const HORIZON = 38;
const MILLS = 50;
const RAIL = 58;

/** The two mill halls, left and right, standing on the MILLS row. */
const MILL_HALLS = [
	{ x: -2, width: 28, height: 15, stacks: 2 },
	{ x: 28, width: 38, height: 20, stacks: 3 },
];

/** The smog-red sun's centre, between the two mills' stacks. */
const SUN_X = 29;
const SUN_Y = 22;

/**
 * Draws the Industrialism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(168);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawSkyline(layer, { base: HORIZON + 4, time: 'dusk', random, height: 15 });
	drawSun(layer);
	smog(layer);
	drawGround(layer);

	// The mills stand behind the train, so they get their own outline.
	const mills = createCanvas(64, 64);
	for (const mill of MILL_HALLS) {
		const box = drawFactory(mills, { ...mill, y: MILLS });
		// drawFactory puts the stacks 9 apart, the first 8 in from the hall's right end.
		for (let k = 0; k < mill.stacks; k++) {
			const sx = mill.x + mill.width - 8 - k * 9;
			drawSmoke(layer, {
				x: sx + 2,
				y: box.y - 1,
				tone: 'smoke',
				puffs: 3,
			});
		}
	}
	outline(mills, C.ink);

	drawTrain(scene);
	outline(scene, C.ink);
	underlay(scene, mills);
	underlay(scene, layer);
	drawSmoke(scene, { x: 5, y: 44, tone: 'smoke', puffs: 3 });
	return scene;
}

/**
 * The sun, high enough to show between the stacks, a full disc with a glow round it.
 * The smog pass dims it to a dull red.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN_Y - 9; y <= SUN_Y + 9; y++) {
		for (let x = SUN_X - 9; x <= SUN_X + 9; x++) {
			const d = (x - SUN_X) ** 2 + (y - SUN_Y) ** 2;
			if (d <= 20) {
				set(layer, x, y, C.lampGlow);
			} else if (d <= 30) {
				set(layer, x, y, C.gold);
			} else if (d <= 72) {
				set(layer, x, y, mix(C.duskSky5, C.duskSky6, 0.5));
			}
		}
	}
}

/**
 * The smog: the sky warmed a step and dimmed towards a sooty ochre, thickest at the top, and
 * the sun turned to a dull red disc.
 * @param {Canvas} layer
 */
function smog(layer) {
	const soot = mix(C.stoneShade, C.timber, 0.4);
	/** @type {Record<string, Colour>} */
	const warmer = {
		[C.duskSky1]: C.duskSky2,
		[C.duskSky2]: C.duskSky3,
		[C.duskSky3]: C.duskSky4,
		[C.duskSky4]: C.duskSky5,
		[C.duskSky5]: C.duskSky6,
		[C.starDim]: C.duskSky2,
	};
	for (let y = 0; y <= HORIZON + 4; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = layer.p[y * 64 + x];
			if (!colour) {
				continue;
			}
			let hazed;
			if (colour === C.lampGlow) {
				hazed = mix(C.brickRedLight, C.gold, 0.25);
			} else if (colour === C.gold) {
				hazed = C.brickRedLight;
			} else {
				hazed = mix(
					warmer[colour] ?? colour,
					soot,
					0.5 - (y / HORIZON) * 0.3
				);
			}
			if (y < 9 && (x * 3 + y * 5) % 7 < 2) {
				hazed = mix(hazed, C.stone, 0.3);
			}
			set(layer, x, y, hazed);
		}
	}
}

/**
 * The cinder bank the railway runs along, and the rail with its sleepers.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	const cinder = mix(C.wood, C.stoneShade, 0.35);
	const cinderDark = mix(C.wood, C.night, 0.4);
	for (let y = MILLS - 2; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = (x * 5 + y * 3) % 7 === 0 ? cinderDark : cinder;
			if (y === MILLS - 2) {
				colour = mix(C.timberShade, C.duskSky4, 0.3);
			}
			if (y === RAIL) {
				colour = C.stoneLight;
			} else if (y === RAIL + 1) {
				colour = x % 4 === 0 ? C.timber : C.stoneShade;
			} else if (y === RAIL + 2) {
				colour = x % 4 === 0 ? C.timberShade : cinderDark;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The goods train: a little black tank engine pulling a timber wagon, a covered van and a
 * wagon of barrels.
 * @param {Canvas} scene
 */
function drawTrain(scene) {
	drawEngine(scene);
	drawTimberWagon(scene, 18);
	drawVan(scene, 32);
	drawBarrelWagon(scene, 47);
	// The couplings.
	for (const x of [16, 17, 30, 31, 45, 46, 61, 62]) {
		set(scene, x, RAIL - 4, C.stoneShade);
	}
}

/**
 * A small black tank engine facing left, with a red buffer beam, a brass dome and a lit cab.
 * @param {Canvas} scene
 */
function drawEngine(scene) {
	const black = mix(C.ink, C.stoneShade, 0.45);
	const blackLight = mix(C.ink, C.stoneShade, 0.85);
	// The tank and boiler.
	for (let y = 49; y <= 55; y++) {
		for (let x = 3; x <= 11; x++) {
			set(scene, x, y, y === 49 ? blackLight : black);
		}
	}
	// The funnel and the dome.
	rect(scene, 4, 45, 2, 4, black);
	rect(scene, 3, 45, 4, 1, blackLight);
	rect(scene, 8, 47, 2, 2, C.brass);
	// The cab, its window lit.
	rect(scene, 11, 46, 5, 10, black);
	rect(scene, 10, 45, 7, 1, blackLight);
	rect(scene, 12, 47, 3, 3, C.gold);
	// The buffer beam and the running plate.
	rect(scene, 1, 54, 3, 2, C.brickRed);
	rect(scene, 3, 55, 13, 1, C.brickRed);
	for (const x of [5, 9, 13]) {
		smallWheel(scene, x);
	}
}

/**
 * A small wheel on the rail, two pixels square.
 * @param {Canvas} scene
 * @param {number} x - Its left column
 */
function smallWheel(scene, x) {
	rect(scene, x, RAIL - 2, 2, 2, C.stone);
	set(scene, x, RAIL - 2, C.stoneLight);
	set(scene, x + 1, RAIL - 1, C.stoneShade);
}

/**
 * An open wagon stacked with sawn timber.
 * @param {Canvas} scene
 * @param {number} x - The wagon's leftmost column
 */
function drawTimberWagon(scene, x) {
	rect(scene, x, 52, 12, 4, C.timberShade);
	rect(scene, x, 52, 12, 1, C.timber);
	for (let y = 48; y <= 51; y++) {
		for (let i = 1; i < 11; i++) {
			const end = i === 1 || i === 10;
			set(
				scene,
				x + i,
				y,
				end ? C.creamShade : y % 2 === 0 ? C.timberLight : C.timber
			);
		}
	}
	smallWheel(scene, x + 2);
	smallWheel(scene, x + 8);
}

/**
 * A covered goods van with a curved roof and a sliding door.
 * @param {Canvas} scene
 * @param {number} x - The van's leftmost column
 */
function drawVan(scene, x) {
	for (let y = 47; y <= 55; y++) {
		for (let i = 0; i < 13; i++) {
			// The roof's top row is rounded off at both ends.
			if (y === 47 && (i === 0 || i === 12)) {
				continue;
			}
			let colour = i === 0 ? C.brickRed : C.brickRedShade;
			if (y === 47) {
				colour = C.stoneLight;
			} else if (y === 48) {
				colour = C.stone;
			}
			set(scene, x + i, y, colour);
		}
	}
	rect(scene, x + 4, 50, 5, 5, C.roof);
	rect(scene, x + 4, 50, 1, 5, C.roofLight);
	smallWheel(scene, x + 2);
	smallWheel(scene, x + 9);
}

/**
 * An open wagon loaded with barrels, running off the right edge.
 * @param {Canvas} scene
 * @param {number} x - The wagon's leftmost column
 */
function drawBarrelWagon(scene, x) {
	rect(scene, x, 52, 14, 4, C.stoneShade);
	rect(scene, x, 52, 14, 1, C.stone);
	for (const bx of [x + 1, x + 5, x + 9]) {
		rect(scene, bx, 48, 3, 4, C.timber);
		rect(scene, bx, 48, 1, 4, C.timberLight);
		rect(scene, bx, 49, 3, 1, C.wood);
		rect(scene, bx, 51, 3, 1, C.wood);
	}
	smallWheel(scene, x + 2);
	smallWheel(scene, x + 10);
}
