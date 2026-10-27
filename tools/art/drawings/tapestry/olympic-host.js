// Olympic Host: a torch runner on the rim of a marble stadium, racing towards a great bronze cauldron as it bursts alight.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon, the stadium bowl's centre and radii, and the walkway along its near rim. */
const HORIZON = 22;
const BOWL_X = 30;
const BOWL_Y = 52;
const BOWL_RX = 46;
const BOWL_RY = 29;
const WALK = 54;

/** The cauldron's centre column and the top of its bowl. */
const CAULDRON_X = 50;
const CAULDRON_Y = 25;

/** The runner's left column and feet. */
const RUNNER_X = 12;
const RUNNER_Y = 61;

/** The crowd's clothes, as dots in the stands. */
const SPECTATORS = [C.brickRed, C.daySea2, C.pine, C.amber, C.roofLight];

/**
 * Draws the Olympic Host scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(73);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHills(layer);
	drawStadium(layer, random);
	drawPennants(layer);
	drawWalkway(layer);

	drawCauldron(scene);
	drawRunner(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawGlow(scene, CAULDRON_X, CAULDRON_Y - 9, 15, 0.22);
	drawGlow(scene, RUNNER_X + 9, RUNNER_Y - 19, 5, 0.25);
	for (const [dx, h, r, lean] of [
		[-5, 11, 3.5, -1],
		[5, 13, 3.5, 1],
		[0, 20, 5.5, 0],
		[-2, 16, 2.5, -1],
	]) {
		drawTongue(scene, CAULDRON_X + dx, CAULDRON_Y, h, r, lean);
	}
	drawTongue(scene, RUNNER_X + 9, RUNNER_Y - 17, 7, 2, -2);
	return scene;
}

/**
 * Low olive hills along the horizon behind the stadium.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON - 3 + Math.sin(x * 0.11 + 1) * 2 + Math.sin(x * 0.31) * 0.8
		);
		for (let y = top; y < 40; y++) {
			set(layer, x, y, y === top ? C.forestFloorLight : C.forestFloor);
		}
	}
}

/**
 * The stadium bowl: rings of marble tiers dotted with spectators, a clay running track and a green field.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStadium(layer, random) {
	for (let y = HORIZON - 4; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.sqrt(
				((x - BOWL_X) / BOWL_RX) ** 2 + ((y - BOWL_Y) / BOWL_RY) ** 2
			);
			if (d > 1) {
				continue;
			}
			let colour;
			if (d > 0.97) {
				colour = C.creamLight;
			} else if (d > 0.5) {
				const tier = Math.floor((1 - d) / 0.06);
				const step = ((1 - d) / 0.06) % 1;
				colour =
					step < 0.3
						? C.creamShade
						: tier % 2
							? C.cream
							: C.creamLight;
				if (step >= 0.3 && random() < 0.3) {
					colour =
						SPECTATORS[Math.floor(random() * SPECTATORS.length)];
				}
			} else if (d > 0.47) {
				colour = C.stone;
			} else if (d > 0.33) {
				const lane = Math.floor((d - 0.33) / 0.035) % 2;
				colour = lane
					? C.brickRedLight
					: mix(C.brickRedLight, C.sand, 0.4);
			} else {
				colour = (x + y) % 5 === 0 ? C.grassLight : C.grass;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Coloured pennants on poles along the stadium's far rim.
 * @param {Canvas} layer
 */
function drawPennants(layer) {
	const colours = [C.brickRed, C.gold, C.daySea2, C.pine, C.roofLight];
	for (let i = 0; i < 7; i++) {
		const x = 4 + i * 6;
		const rim = Math.round(
			BOWL_Y -
				BOWL_RY *
					Math.sqrt(Math.max(0, 1 - ((x - BOWL_X) / BOWL_RX) ** 2))
		);
		for (let y = rim - 5; y < rim; y++) {
			set(layer, x, y, C.timber);
		}
		const cloth = colours[i % colours.length];
		rect(layer, x + 1, rim - 5, 3, 1, cloth);
		rect(layer, x + 1, rim - 4, 2, 1, cloth);
		set(layer, x + 1, rim - 3, cloth);
	}
}

/**
 * The marble walkway along the stadium's near rim, in big slabs.
 * @param {Canvas} layer
 */
function drawWalkway(layer) {
	for (let y = WALK; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.cream;
			if (y === WALK) {
				colour = C.creamLight;
			} else if (y === WALK + 1 || (x + (y > 58 ? 6 : 0)) % 12 === 0) {
				colour = C.creamShade;
			} else if (y > 59) {
				colour = mix(C.cream, C.creamShade, 0.5);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The cauldron: a wide bronze bowl on a fluted column, rising from the walkway.
 * @param {Canvas} scene
 */
function drawCauldron(scene) {
	// The fluted column and its base.
	for (let y = CAULDRON_Y + 9; y < WALK; y++) {
		for (let x = CAULDRON_X - 3; x <= CAULDRON_X + 2; x++) {
			const i = x - CAULDRON_X + 3;
			const colour =
				i === 0
					? C.creamLight
					: i >= 4
						? C.creamShade
						: i % 2
							? C.cream
							: C.creamLight;
			set(scene, x, y, colour);
		}
	}
	rect(scene, CAULDRON_X - 5, WALK - 3, 10, 3, C.cream);
	rect(scene, CAULDRON_X - 5, WALK - 3, 10, 1, C.creamLight);
	rect(scene, CAULDRON_X + 3, WALK - 2, 2, 2, C.creamShade);
	rect(scene, CAULDRON_X - 4, CAULDRON_Y + 8, 8, 2, C.creamLight);
	// The bowl: a rim, then rounding to a narrow foot.
	const rows = [9, 9, 9, 8, 8, 7, 6, 4, 3];
	rows.forEach((half, j) => {
		for (let x = CAULDRON_X - half; x < CAULDRON_X + half; x++) {
			let colour = C.lampFrame;
			if (j === 0) {
				colour = C.gold;
			} else if (j === 1) {
				colour = C.timberShade;
			} else if (x <= CAULDRON_X - half + 1) {
				colour = C.brass;
			} else if (x >= CAULDRON_X + half - 3) {
				colour = C.timberShade;
			} else if (j === 4) {
				colour = C.brass;
			}
			set(scene, x, CAULDRON_Y + j, colour);
		}
	});
}

/**
 * The runner, in mid-stride towards the cauldron, the torch held high.
 * @param {Canvas} scene
 */
function drawRunner(scene) {
	const rows = [
		'...HHH.....',
		'..HHHSS....',
		'..HSSSS..S.',
		'...SSs..S..',
		'....s..S...',
		'...CCCS....',
		'..CCCCC....',
		'.SCCCCC....',
		'S..cccc....',
		'...CCCC....',
		'...LL.LL...',
		'..LL...LL..',
		'.LL.....L..',
		'LL......LL.',
		'L..........',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		H: C.wood,
		S: C.skin,
		s: C.skinShade,
		C: C.white,
		c: C.brickRed,
		L: C.skinShade,
	};
	const top = RUNNER_Y - rows.length + 1;
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, RUNNER_X + i, top + j, colours[key]);
			}
		});
	});
	// The torch: a gold grip in the raised hand.
	for (let j = -2; j <= 1; j++) {
		set(scene, RUNNER_X + 9, top + j, j < 0 ? C.brass : C.lampFrame);
	}
}

/**
 * Warms everything round a flame, drawn before the flame itself.
 * @param {Canvas} scene
 * @param {number} cx - The glow's centre column
 * @param {number} cy - The glow's centre row
 * @param {number} r - Its radius
 * @param {number} strength - How far the colours turn towards gold at the centre
 */
function drawGlow(scene, cx, cy, r, strength) {
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = ((x - cx) ** 2 + (y - cy) ** 2) / (r * r);
			const behind = get(scene, x, y);
			if (behind && behind !== C.ink && d <= 1) {
				const level = d < 0.35 ? 1 : d < 0.7 ? 0.55 : 0.25;
				set(scene, x, y, mix(behind, C.gold, strength * level));
			}
		}
	}
}

/**
 * One tongue of flame, widest near its base and licking up to a point, red at its tip and white-hot inside.
 * Drawn last and without an outline.
 * @param {Canvas} scene
 * @param {number} cx - The base's centre column
 * @param {number} base - The base row
 * @param {number} h - Height
 * @param {number} r - Half-width at its widest
 * @param {number} lean - How far the tip leans sideways
 */
function drawTongue(scene, cx, base, h, r, lean) {
	for (let dy = 0; dy < h; dy++) {
		const t = dy / h;
		const half = r * Math.sqrt(1 - t) * (t < 0.2 ? 0.75 + t * 1.25 : 1);
		const mid = cx + lean * t * t * 2 + Math.sin(t * 6) * 0.6;
		for (let x = Math.round(mid - half); x <= Math.round(mid + half); x++) {
			const edge = Math.abs(x - mid) / Math.max(0.5, half);
			let colour = C.lampGlow;
			if (edge > 0.7 || t > 0.85) {
				colour = t > 0.5 ? C.brickRedLight : C.amber;
			} else if (edge > 0.35 || t > 0.6) {
				colour = C.gold;
			}
			set(scene, x, base - dy, colour);
		}
	}
}
