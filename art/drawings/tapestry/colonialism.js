// Colonialism: a log stockade fort with a thatched blockhouse and a purple-and-gold flag on a tropical coast, a rowboat drawn up on the sand.
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
import { drawSea } from '../../parts/sea.js';
import { drawSmoke } from '../../parts/smoke.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The sea's horizon row, the stockade's foot, and the blockhouse's left column. */
const HORIZON = 34;
const FOOT = 48;
const TOWER = 18;

/**
 * The first row of sand in each column: the beach rises from the sea on the left.
 * @param {number} x
 * @returns {number}
 */
function shore(x) {
	return x < 22 ? Math.round(53 - x * 0.45 + Math.sin(x * 0.5) * 0.6) : 43;
}

/**
 * Draws the Colonialism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(211);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawSea(layer, { time: 'day', top: HORIZON + 1, random, waves: 24 });
	drawHill(layer, random);
	drawBeach(layer, random);

	drawSmoke(layer, { x: 35, y: 33, tone: 'smoke', puffs: 3, drift: 1 });
	drawPalm(scene, 59, 44, 30, -7);
	drawStockade(scene);
	drawGate(scene);
	drawBlockhouse(scene);
	drawFlag(scene);
	drawRowboat(scene, 4, 58);
	drawSentry(scene, 50, 59);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * A jungle-covered hill behind the fort, hazy with distance, rising to the right.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHill(layer, random) {
	const far = mix(C.pine, C.daySky5, 0.45);
	const farLight = mix(C.pineLight, C.daySky5, 0.4);
	const farShade = mix(C.pineShade, C.daySky4, 0.4);
	for (let x = 14; x < 64; x++) {
		const top = Math.round(
			35 - (x - 14) * 0.42 + Math.sin(x * 0.55) * 1.2 + Math.sin(x * 0.21)
		);
		for (let y = top; y <= 46; y++) {
			let colour = far;
			if (y <= top + 1) {
				colour = farLight;
			} else if ((x + y * 3) % 7 === 0 || y > top + 10) {
				colour = farShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = 20 + Math.floor(random() * 44);
		const y = 24 + Math.floor(random() * 18);
		if (get(layer, x, y) === far) {
			set(layer, x, y, farLight);
			set(layer, x + 1, y, farLight);
		}
	}
}

/**
 * Turquoise shallows, foam at the water's edge and pale sand in front of the fort.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeach(layer, random) {
	const shallow = mix(C.daySea1, C.grassLight, 0.3);
	const shallowLight = mix(C.daySeaLine, C.grassLight, 0.2);
	for (let x = 0; x < 64; x++) {
		const top = shore(x);
		if (x < 22) {
			for (let y = top - 3; y < top; y++) {
				set(layer, x, y, y === top - 1 ? shallowLight : shallow);
			}
			if (x % 4 !== 3) {
				set(layer, x, top - 1, C.foam);
			}
		}
		for (let y = top; y < 64; y++) {
			let colour = C.sandLight;
			if (y === top && x < 22) {
				colour = C.sand;
			} else if ((y - top) % 4 === 3 && (x * 3 + y) % 7 < 3) {
				colour = C.sand;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = 50 + Math.floor(random() * 14);
		set(layer, x, y, C.sand);
	}
}

/**
 * A palm inside the fort, leaning over the stockade.
 * @param {Canvas} scene
 * @param {number} x - The trunk's base column
 * @param {number} base - The trunk's bottom row
 * @param {number} height - From the base to the crown
 * @param {number} lean - How many columns the crown leans to the right (negative: to the left)
 */
function drawPalm(scene, x, base, height, lean) {
	for (let i = 0; i <= height; i++) {
		const t = i / height;
		const tx = x + Math.round(lean * t * t);
		const ring = i % 3 === 0;
		set(scene, tx, base - i, ring ? C.timber : C.timberLight);
		set(scene, tx + 1, base - i, ring ? C.timberShade : C.timber);
	}
	const cx = x + lean;
	const cy = base - height;
	for (const [angle, length] of [
		[170, 9],
		[140, 8],
		[95, 5],
		[45, 7],
		[10, 8],
		[205, 7],
		[-25, 6],
	]) {
		frond(scene, cx, cy, (angle * Math.PI) / 180, length);
	}
	set(scene, cx, cy + 1, C.wood);
	set(scene, cx + 1, cy + 1, C.wood);
}

/**
 * One palm frond: a curved, drooping leaf, lit along its top, with leaflets hanging below.
 * @param {Canvas} scene
 * @param {number} cx - The crown's column
 * @param {number} cy - The crown's row
 * @param {number} angle - The leaf's starting direction, in radians from the right, upwards positive
 * @param {number} length
 */
function frond(scene, cx, cy, angle, length) {
	for (let k = 1; k <= length; k++) {
		const px = cx + Math.round(Math.cos(angle) * k);
		const py = cy - Math.round(Math.sin(angle) * k - 0.09 * k * k);
		set(scene, px, py, k < length - 1 ? C.grassLight : C.grass);
		if (k < length - 1) {
			set(scene, px, py + 1, C.grass);
		}
		if (k > 2 && k % 2 === 0 && k < length) {
			set(scene, px, py + 2, C.grassShade);
		}
	}
}

/**
 * The stockade: a wall of sharpened logs, each lit on its left, bound by a rail and running off to the right.
 * @param {Canvas} scene
 */
function drawStockade(scene) {
	for (let x = TOWER + 12, k = 0; x < 64; x += 3, k++) {
		const top = 36 + (k % 3 === 1 ? -1 : k % 3 === 2 ? 1 : 0);
		set(scene, x + 1, top - 2, C.timberLight);
		for (let y = top - 1; y <= FOOT; y++) {
			const low = y > FOOT - 2;
			set(scene, x, y, low ? C.timber : C.timberLight);
			set(scene, x + 1, y, low ? C.timberShade : C.timber);
			set(scene, x + 2, y, C.timberShade);
		}
		if (k % 2) {
			set(scene, x + 1, top + 6, C.timberShade);
		}
	}
	// A rail binding the logs, high on the wall.
	for (let x = TOWER + 12; x < 64; x++) {
		set(scene, x, 40, C.wood);
	}
}

/**
 * The gate: two tall pointed posts, a lintel and a pair of plank doors bound with iron.
 * @param {Canvas} scene
 */
function drawGate(scene) {
	const left = 40;
	const right = 50;
	for (const x of [left, right]) {
		for (let y = 32; y <= FOOT; y++) {
			set(scene, x, y, C.timberLight);
			set(scene, x + 1, y, C.timber);
			set(scene, x + 2, y, C.timberShade);
		}
		set(scene, x + 1, 31, C.timberLight);
	}
	rect(scene, left, 35, right - left + 3, 2, C.timberShade);
	rect(scene, left, 35, right - left + 3, 1, C.timberLight);
	for (let y = 37; y <= FOOT; y++) {
		for (let x = left + 3; x < right; x++) {
			let colour = (x - left) % 2 ? C.timberShade : C.timber;
			if (x === 46) {
				colour = C.wood;
			} else if (y === 40 || y === 45) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, 45, 42, C.brass);
	set(scene, 47, 42, C.brass);
}

/**
 * The blockhouse at the corner: a log lower storey, an overhanging upper storey with loopholes, and a palm-thatch roof.
 * @param {Canvas} scene
 */
function drawBlockhouse(scene) {
	const x0 = TOWER;
	// The lower storey: horizontal logs, lit at the left end.
	for (let y = 31; y <= FOOT; y++) {
		const seam = (y - 31) % 3 === 2;
		for (let x = x0 + 1; x <= x0 + 11; x++) {
			let colour = seam ? C.timberShade : C.timber;
			if (x === x0 + 1 && !seam) {
				colour = C.timberLight;
			} else if (x >= x0 + 10) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The upper storey overhangs the lower by a log on each side, its underside in shadow.
	for (let y = 21; y <= 30; y++) {
		const seam = (y - 21) % 3 === 2;
		for (let x = x0 - 1; x <= x0 + 13; x++) {
			let colour = seam ? C.timber : C.timberLight;
			if (x >= x0 + 11 && !seam) {
				colour = C.timber;
			} else if (x >= x0 + 11) {
				colour = C.timberShade;
			}
			if (y === 30) {
				colour = C.wood;
			}
			set(scene, x, y, colour);
		}
	}
	// Loopholes: a cannon's mouth in the upper storey, musket slits below.
	rect(scene, x0 + 4, 24, 4, 3, C.ink);
	rect(scene, x0 + 5, 25, 3, 1, C.stoneShade);
	for (const [x, y] of [
		[x0 + 3, 34],
		[x0 + 8, 34],
	]) {
		rect(scene, x, y, 1, 3, C.ink);
	}
	// A door at the foot.
	rect(scene, x0 + 4, 42, 4, 7, C.wood);
	rect(scene, x0 + 4, 42, 1, 7, C.timberShade);
	set(scene, x0 + 6, 45, C.brass);
	// The roof: a steep palm-thatch pyramid with ragged eaves.
	const cx = x0 + 6;
	for (let r = 0; r <= 7; r++) {
		const y = 13 + r;
		const half = r + 1;
		for (let x = cx - half; x <= cx + half; x++) {
			const colour =
				x <= cx - half + 1
					? C.sandLight
					: x > cx + half - 3 || (x + y) % 4 === 0
						? C.sandShade
						: C.sand;
			set(scene, x, y, colour);
		}
	}
	for (let x = x0 - 3; x <= x0 + 15; x++) {
		set(scene, x, 21, x % 2 ? C.sandShade : C.sand);
		if (x % 3 === 0) {
			set(scene, x, 22, C.sandShade);
		}
	}
}

/**
 * The flag over the blockhouse: purple, with a gold band and a cream star at the hoist.
 * @param {Canvas} scene
 */
function drawFlag(scene) {
	const pole = TOWER + 6;
	const top = 4;
	for (let y = top - 1; y <= 12; y++) {
		set(scene, pole, y, y === top - 1 ? C.gold : C.wood);
	}
	const width = 14;
	const height = 8;
	for (let i = 0; i < width; i++) {
		const phase = Math.sin(i * 0.5 + 0.6);
		const wave = Math.round(phase * (i / width) * 1.6);
		for (let j = 0; j < height; j++) {
			const band = j === 3 || j === 4;
			const shaded = phase < -0.4;
			let colour = band
				? shaded
					? C.amber
					: C.gold
				: shaded
					? C.roof
					: C.roofLight;
			if (j === 0 && !band && !shaded) {
				colour = C.railLight;
			}
			set(scene, pole + 1 + i, top + j + wave, colour);
		}
	}
	// The star sits on the band at the hoist.
	for (const [dx, dy] of [
		[2, 2],
		[1, 3],
		[2, 3],
		[3, 3],
		[1, 4],
		[2, 4],
		[3, 4],
		[2, 5],
	]) {
		set(scene, pole + 1 + dx, top + dy, C.creamLight);
	}
}

/**
 * A rowboat drawn up on the sand, with a red strake and one oar laid across it.
 * @param {Canvas} scene
 * @param {number} x - The bow's column (the boat faces left, towards the sea)
 * @param {number} y - The keel's row
 */
function drawRowboat(scene, x, y) {
	for (const [dy, from, to] of [
		[-4, 0, 21],
		[-3, 1, 21],
		[-2, 2, 21],
		[-1, 3, 20],
		[0, 5, 18],
	]) {
		for (let i = from; i <= to; i++) {
			let colour = C.timber;
			if (dy === -4) {
				colour = C.timberLight;
			} else if (dy === -3) {
				colour = i >= to - 1 ? C.brickRedShade : C.brickRed;
			} else if (dy === 0 || i >= to - 1) {
				colour = C.timberShade;
			}
			set(scene, x + i, y + dy, colour);
		}
	}
	// The raised bow and the stern's transom.
	set(scene, x - 1, y - 5, C.timberLight);
	set(scene, x, y - 5, C.timberLight);
	rect(scene, x + 21, y - 5, 2, 5, C.timberShade);
	// The oar: a shaft from inside the boat, its blade resting out on the sand.
	for (let i = 0; i < 20; i++) {
		set(scene, x + 4 + i, y - 5 - Math.floor(i / 5), C.timberLight);
	}
	rect(scene, x + 23, y - 10, 4, 2, C.timberLight);
	rect(scene, x + 24, y - 9, 3, 1, C.timber);
}

/**
 * A sentry on the beach before the gate, a musket on his shoulder.
 * @param {Canvas} scene
 * @param {number} x - The figure's leftmost column
 * @param {number} feet - The row the figure stands on
 */
function drawSentry(scene, x, feet) {
	drawFigure(scene, { x, y: feet, facing: 'left', clothes: C.roofLight });
	for (let y = feet - 15; y <= feet - 5; y++) {
		set(scene, x + 4, y, y === feet - 15 ? C.stoneLight : C.wood);
	}
}
