// National Parks: a deep granite canyon of tall pines, a ribbon waterfall between the far cliffs and a ranger's wooden lookout tower on the rim.
import {
	createCanvas,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The waterfall's column, the rim it leaps from and the pool it falls into. */
const FALL_X = 27;
const FALL_TOP = 15;
const POOL = 43;

/** The tower's left leg, its right leg, the cabin's floor and the rim it stands on. */
const TOWER_L = 40;
const TOWER_R = 52;
const CABIN = 16;
const RIM = 35;

/** Granite in the haze of distance, and granite close by. */
const FAR_LIT = mix(C.stoneLight, C.daySky5, 0.35);
const FAR = mix(C.stone, C.daySky5, 0.35);
const FAR_SHADE = mix(C.stoneMid, C.daySky4, 0.3);

/**
 * Draws the National Parks scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(751);

	drawSky(layer, { time: 'day', horizon: 40, random });
	drawFarCliff(layer);
	drawWaterfall(layer, random);
	drawRiver(layer, random);
	drawLeftWall(layer);
	drawRightRim(layer, random);

	// The far pines along the canyon floor sit behind the tower and the near pines.
	const middle = createCanvas(64, 64);
	for (const [x, base, h] of [
		[17, 47, 10],
		[21, 50, 9],
		[36, 47, 9],
		[40, 50, 11],
		[45, 52, 12],
		[57, RIM + 1, 15],
		[62, RIM + 2, 19],
	]) {
		drawPine(middle, x, base, h);
	}
	outline(middle, C.ink);

	drawTower(scene);
	drawPine(scene, 5, 63, 44);
	drawPine(scene, 13, 63, 30);
	drawPine(scene, 59, 66, 30);
	outline(scene, C.ink);
	underlay(scene, middle);
	underlay(scene, layer);
	drawFrame(scene);
	drawWindows(scene);
	return scene;
}

/**
 * The cliff at the canyon's head, pale with distance, with a notch the waterfall pours from.
 * @param {Canvas} layer
 */
function drawFarCliff(layer) {
	for (let x = 8; x <= 48; x++) {
		let top =
			FALL_TOP +
			Math.round(Math.abs(x - FALL_X) * 0.12 + Math.sin(x * 0.7) * 0.8);
		if (x > 38) {
			top += Math.round((x - 38) * 1.4);
		}
		if (Math.abs(x - FALL_X) <= 1) {
			top += 1;
		}
		for (let y = top; y <= POOL + 2; y++) {
			let colour =
				(x * 3 + Math.floor(y / 3)) % 7 === 0 ? FAR_SHADE : FAR;
			if (y === top) {
				colour = FAR_LIT;
			} else if (x % 5 === 0 && y > top + 2) {
				colour = FAR_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	// Pines in silhouette along the far rim.
	for (const x of [12, 15, 34, 37, 41]) {
		const top = FALL_TOP + Math.round(Math.abs(x - FALL_X) * 0.12) - 1;
		for (let j = 0; j < 4; j++) {
			for (let i = -Math.floor(j / 2); i <= Math.floor(j / 2); i++) {
				set(layer, x + i, top - 3 + j, mix(C.pine, C.daySky4, 0.4));
			}
		}
	}
}

/**
 * The ribbon waterfall: a white streak from the notch to the pool, with mist billowing at its foot.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWaterfall(layer, random) {
	for (let y = FALL_TOP + 1; y <= POOL; y++) {
		const spread = y > POOL - 6 ? 1 : 0;
		for (let x = FALL_X - 1 - spread; x <= FALL_X + 1 + spread; x++) {
			const edge = x === FALL_X - 1 - spread || x === FALL_X + 1 + spread;
			let colour = edge ? C.foam : C.white;
			if (!edge && random() > 0.8) {
				colour = C.dayWave;
			}
			set(layer, x, y, colour);
		}
	}
	// The mist at the foot.
	for (const [cx, cy, r] of [
		[FALL_X - 4, POOL, 2.5],
		[FALL_X, POOL - 1, 3.2],
		[FALL_X + 4, POOL, 2.5],
	]) {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
					set(layer, x, y, y > cy ? C.cloudShade : C.white);
				}
			}
		}
	}
}

/**
 * The river winding from the pool down the canyon floor towards the viewer, the floor green on each bank.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRiver(layer, random) {
	for (let y = POOL + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				(x + y) % 2 === 0 && y < POOL + 4
					? C.forestFloor
					: C.forestFloorLight
			);
		}
		const t = (y - POOL) / (63 - POOL);
		const centre = FALL_X + Math.sin(t * 3.2) * 6 + t * 4;
		const half = 2.5 + t * 6;
		for (
			let x = Math.round(centre - half);
			x <= Math.round(centre + half);
			x++
		) {
			const edge =
				x === Math.round(centre - half) ||
				x === Math.round(centre + half);
			set(layer, x, y, edge ? C.foam : t < 0.4 ? C.daySea1 : C.daySea2);
		}
		if (random() > 0.35) {
			const x = Math.round(centre - half + 1 + random() * (half * 2 - 3));
			rect(layer, x, y, 2, 1, C.dayWave);
		}
	}
}

/**
 * The near canyon wall on the left: sheer granite in shade, cracked and streaked, rising high into the sky.
 * @param {Canvas} layer
 */
function drawLeftWall(layer) {
	for (let x = 0; x <= 20; x++) {
		const top = Math.round(1 + x * 0.55 + Math.sin(x * 0.8) * 0.8);
		const foot = Math.round(48 + x * 0.3);
		for (let y = top; y <= foot; y++) {
			let colour = C.stoneShade;
			if (x >= 18 - Math.floor((y - top) / 12)) {
				colour = C.stoneMid;
			} else if ((x * 5 + Math.floor(y / 4)) % 9 === 0) {
				colour = C.stoneMid;
			} else if ((x + y * 2) % 13 === 0) {
				colour = mix(C.stoneShade, C.ink, 0.35);
			}
			if (y === top) {
				colour = C.stone;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The near rim on the right, where the tower stands: a sunlit granite ledge dropping to the river.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRightRim(layer, random) {
	for (let x = 34; x < 64; x++) {
		const top = Math.round(
			RIM -
				Math.max(0, x - 50) * 0.15 +
				Math.sin(x * 0.5) * 0.7 +
				Math.max(0, 40 - x) * 0.8
		);
		const foot = 63;
		for (let y = top; y <= foot; y++) {
			let colour = C.stone;
			if (y === top) {
				colour = C.forestFloorLight;
			} else if (y === top + 1) {
				colour = C.forestFloor;
			} else if (x < 40 + (y - top) * 0.2) {
				colour = C.stoneLight;
			} else if ((x * 3 + Math.floor(y / 3)) % 8 === 0) {
				colour = C.stoneMid;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 10; i++) {
		const x = 42 + Math.floor(random() * 20);
		const y = RIM + 6 + Math.floor(random() * 20);
		set(layer, x, y, C.stoneShade);
		set(layer, x + 1, y, C.stoneShade);
	}
}

/**
 * A pine: a short trunk under a tall stepped cone, lit on the left and shaded on the right.
 * @param {Canvas} canvas
 * @param {number} cx - The trunk's column
 * @param {number} base - The row the trunk stands on
 * @param {number} height - From the base to the tip
 */
function drawPine(canvas, cx, base, height) {
	const tip = base - height + 1;
	const widest = Math.max(2, Math.round(height / 5));
	for (let y = base - 2; y <= base; y++) {
		set(canvas, cx, y, C.wood);
	}
	for (let y = tip; y <= base - 3; y++) {
		const along = (y - tip) / Math.max(1, base - 3 - tip);
		const tier = (y - tip) % 4;
		const half = Math.max(0, Math.round(along * widest + tier * 0.5 - 0.5));
		for (let x = cx - half; x <= cx + half; x++) {
			const colour =
				x === cx - half ? C.pineLight : x > cx ? C.pineShade : C.pine;
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The ranger's lookout: a braced timber tower on the rim with a railed cabin, a band of windows and a red hipped roof.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	// The cabin.
	for (let y = CABIN - 6; y <= CABIN; y++) {
		for (let x = TOWER_L; x <= TOWER_R; x++) {
			const colour =
				x === TOWER_L
					? C.timberLight
					: x >= TOWER_R - 1
						? C.timber
						: C.timberLight;
			set(scene, x, y, y === CABIN - 1 ? C.timber : colour);
		}
	}
	// The railed walkway round the cabin.
	rect(scene, TOWER_L - 2, CABIN, TOWER_R - TOWER_L + 5, 1, C.timberShade);
	rect(scene, TOWER_L - 2, CABIN - 2, TOWER_R - TOWER_L + 5, 1, C.timber);
	set(scene, TOWER_L - 2, CABIN - 1, C.timber);
	set(scene, TOWER_R + 2, CABIN - 1, C.timber);
	// The hipped roof.
	for (let r = 0; r < 4; r++) {
		for (let x = TOWER_L - 2 + r * 2; x <= TOWER_R + 2 - r * 2; x++) {
			const colour =
				r === 0
					? C.brickRedShade
					: x === TOWER_L - 2 + r * 2
						? C.brickRedLight
						: x > TOWER_R - r * 2 - 1
							? C.brickRedShade
							: C.brickRed;
			set(scene, x, CABIN - 7 - r, colour);
		}
	}
	set(scene, (TOWER_L + TOWER_R) / 2, CABIN - 11, C.timberShade);
	set(scene, (TOWER_L + TOWER_R) / 2, CABIN - 12, C.timberShade);
}

/**
 * The tower's open timber frame under the cabin, painted after the outline so the sky shows through it:
 * splayed legs, cross beams and crossed braces.
 * @param {Canvas} scene
 */
function drawFrame(scene) {
	const at = (/** @type {number} */ y) => (y - CABIN) / (RIM - CABIN);
	const left = (/** @type {number} */ y) =>
		Math.round(TOWER_L + 1 - at(y) * 3);
	const right = (/** @type {number} */ y) =>
		Math.round(TOWER_R - 1 + at(y) * 3);
	for (const [top, bottom] of [
		[CABIN + 1, CABIN + 6],
		[CABIN + 6, CABIN + 12],
		[CABIN + 12, RIM],
	]) {
		line(
			scene,
			left(top) + 1,
			top,
			right(bottom) - 1,
			bottom,
			C.timberShade
		);
		line(
			scene,
			right(top) - 1,
			top,
			left(bottom) + 1,
			bottom,
			C.timberShade
		);
	}
	for (const y of [CABIN + 6, CABIN + 12]) {
		rect(scene, left(y), y, right(y) - left(y) + 1, 1, C.timber);
	}
	for (let y = CABIN + 1; y <= RIM; y++) {
		set(scene, left(y), y, C.wood);
		set(scene, left(y) + 1, y, C.timber);
		set(scene, right(y) - 1, y, C.timber);
		set(scene, right(y), y, C.wood);
	}
}

/**
 * The cabin's band of windows, painted after the outline so the panes stay bright, with the ranger looking out.
 * @param {Canvas} scene
 */
function drawWindows(scene) {
	for (let x = TOWER_L + 1; x <= TOWER_R - 1; x++) {
		const mullion = (x - TOWER_L) % 4 === 0;
		set(scene, x, CABIN - 5, mullion ? C.timberShade : C.daySky6);
		set(scene, x, CABIN - 4, mullion ? C.timberShade : C.daySky5);
		set(scene, x, CABIN - 3, mullion ? C.timberShade : C.daySky4);
	}
	set(scene, TOWER_L + 1, CABIN - 5, C.white);
	set(scene, TOWER_L + 2, CABIN - 5, C.white);
	set(scene, TOWER_L + 1, CABIN - 4, C.white);
	// The ranger looking out: a brimmed hat and a face.
	set(scene, TOWER_L + 5, CABIN - 5, C.timberShade);
	set(scene, TOWER_L + 6, CABIN - 5, C.timberShade);
	set(scene, TOWER_L + 7, CABIN - 5, C.timberShade);
	set(scene, TOWER_L + 6, CABIN - 4, C.skin);
	set(scene, TOWER_L + 7, CABIN - 4, C.skinShade);
	set(scene, TOWER_L + 6, CABIN - 3, C.pine);
	set(scene, TOWER_L + 7, CABIN - 3, C.pine);
}
