// Ghost Towns: an empty frontier main street of weathered false-front buildings at dusk, pale ghost faces in the windows and a tumbleweed rolling through the dust.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row (seed 536 sets the dusk sun at column 46, in the alley), and the boardwalk's top row. */
const HORIZON = 40;
const BOARDWALK = 47;

/**
 * One building's weathered boards: the sunset rim, the face in shadow, the darker seams, and the trim.
 * @typedef {{ rim: Colour, face: Colour, seam: Colour, trim: Colour }} Boards
 */

/** @type {Boards} */
const GREY = {
	rim: mix(C.timberLight, C.duskSky6, 0.4),
	face: mix(C.stoneShade, C.timberShade, 0.5),
	seam: mix(C.stoneShade, C.ink, 0.35),
	trim: mix(C.stone, C.duskSky4, 0.3),
};
/** @type {Boards} */
const RUST = {
	rim: mix(C.brickRedLight, C.duskSky6, 0.5),
	face: mix(mix(C.brickRedShade, C.timberShade, 0.45), C.roof, 0.3),
	seam: mix(C.brickRedShade, C.ink, 0.5),
	trim: mix(C.creamShade, C.duskSky4, 0.35),
};
/** @type {Boards} */
const BLEACHED = {
	rim: mix(C.creamLight, C.duskSky6, 0.4),
	face: mix(C.creamShade, C.roof, 0.6),
	seam: mix(C.roof, C.timberShade, 0.4),
	trim: mix(C.timberLight, C.duskSky5, 0.3),
};

/** The windows' empty dark, and the window frames. */
const DARK = mix(C.ink, C.roofShade, 0.4);

/**
 * Draws the Ghost Towns scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(536);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawMesas(layer);
	drawStreet(layer, random);

	building(scene, 0, 14, 18, GREY);
	building(scene, 19, 44, 9, RUST);
	building(scene, 50, 63, 20, BLEACHED);
	drawSaloon(scene);
	drawGeneralStore(scene);
	drawBank(scene);
	drawBoardwalk(scene);
	drawBoardsMissing(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawGhosts(scene);
	drawDust(scene);
	drawTumbleweed(scene, 14, 55, random);
	return scene;
}

/**
 * Flat-topped mesas far off in the desert, dark against the sunset.
 * @param {Canvas} layer
 */
function drawMesas(layer) {
	const far = mix(C.duskSky3, C.duskSky5, 0.35);
	for (const [left, right, top] of [
		[0, 22, 33],
		[51, 64, 31],
	]) {
		for (let x = left; x < right; x++) {
			const slope = Math.min(x - left, right - 1 - x);
			const y0 = top + Math.max(0, 3 - slope);
			for (let y = y0; y <= HORIZON; y++) {
				set(layer, x, y, far);
			}
		}
	}
}

/**
 * The dusty street, warm with the last of the sun near the far end and darker towards the viewer, with wagon ruts.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStreet(layer, random) {
	const lit = mix(C.sand, C.duskSky6, 0.35);
	const dust = mix(C.sandShade, C.duskSky4, 0.35);
	const shade = mix(C.sandShade, C.duskSky2, 0.5);
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = dust;
			if (y < 52 || (y < 55 && (x + y) % 2 === 0)) {
				colour = lit;
			} else if (y > 59 || (y > 56 && (x + y) % 2 === 0)) {
				colour = shade;
			}
			set(layer, x, y, colour);
		}
	}
	// Wagon ruts running across the street.
	for (const y of [55, 60]) {
		for (let x = 0; x < 64; x++) {
			if ((x + y) % 7 !== 0) {
				set(layer, x, y, shade);
			}
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		const y = 50 + Math.floor(random() * 13);
		set(layer, x, y, lit);
	}
}

/**
 * A false-front building: a tall square front of upright boards, its top edge lit by the sunset behind it,
 * with a trim cornice along the top.
 * @param {Canvas} scene
 * @param {number} left - First column
 * @param {number} right - Last column
 * @param {number} top - The front's top row
 * @param {Boards} boards
 */
function building(scene, left, right, top, boards) {
	for (let y = top; y < BOARDWALK; y++) {
		for (let x = left; x <= right; x++) {
			let colour = (x - left) % 3 === 2 ? boards.seam : boards.face;
			if (y === top) {
				colour = boards.rim;
			} else if (y === top + 1 || y === top + 2) {
				colour = boards.trim;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Cuts a dark window with a light frame into a front.
 * @param {Canvas} scene
 * @param {number} x - The pane's first column
 * @param {number} y - The pane's top row
 * @param {number} w
 * @param {number} h
 * @param {Colour} frame
 */
function pane(scene, x, y, w, h, frame) {
	rect(scene, x - 1, y - 1, w + 2, h + 2, frame);
	rect(scene, x, y, w, h, DARK);
}

/**
 * A porch roof on thin posts across a building's front.
 * @param {Canvas} scene
 * @param {number} left
 * @param {number} right
 * @param {number} y - The roof's row
 * @param {Boards} boards
 */
function porch(scene, left, right, y, boards) {
	for (let x = left; x <= right; x++) {
		set(scene, x, y, boards.rim);
		set(scene, x, y + 1, boards.seam);
	}
	for (const x of [left + 1, right - 1]) {
		for (let row = y + 2; row < BOARDWALK; row++) {
			set(scene, x, row, boards.trim);
		}
	}
}

/**
 * The saloon in the middle: a stepped false front, a balcony with railings, two upper windows,
 * and swinging half doors under the porch.
 * @param {Canvas} scene
 */
function drawSaloon(scene) {
	// The raised centre of the front.
	building(scene, 27, 36, 5, RUST);
	rect(scene, 27, 9, 10, 1, RUST.face);
	pane(scene, 22, 15, 5, 7, RUST.trim);
	pane(scene, 37, 15, 5, 7, RUST.trim);
	pane(scene, 30, 14, 4, 8, RUST.trim);
	// The balcony and its railings.
	for (let x = 19; x <= 44; x++) {
		set(scene, x, 24, RUST.rim);
		set(scene, x, 25, RUST.seam);
		if (x % 2 === 1) {
			set(scene, x, 23, RUST.trim);
			set(scene, x, 22, RUST.trim);
		}
	}
	for (let x = 19; x <= 44; x++) {
		set(scene, x, 21, RUST.trim);
	}
	porch(scene, 19, 44, 31, RUST);
	// The swinging half doors in a dark doorway.
	rect(scene, 28, 34, 8, 13, DARK);
	for (const [x, colour] of /** @type {[number, Colour][]} */ ([
		[28, RUST.trim],
		[29, RUST.face],
		[30, RUST.face],
		[31, RUST.trim],
		[32, RUST.trim],
		[33, RUST.face],
		[34, RUST.face],
		[35, RUST.trim],
	])) {
		for (let y = 38; y <= 43; y++) {
			set(scene, x, y, y === 38 || y === 43 ? RUST.trim : colour);
		}
	}
	pane(scene, 22, 36, 4, 6, RUST.trim);
	pane(scene, 38, 36, 4, 6, RUST.trim);
}

/**
 * The general store on the left: a high window, a door and a shutter hanging loose.
 * @param {Canvas} scene
 */
function drawGeneralStore(scene) {
	pane(scene, 4, 23, 6, 7, GREY.trim);
	porch(scene, 0, 15, 33, GREY);
	rect(scene, 4, 37, 5, 10, DARK);
	set(scene, 8, 42, GREY.trim);
	pane(scene, 11, 38, 3, 5, GREY.trim);
	// A shutter hanging by one hinge, swung down at a slant.
	line(scene, 11, 22, 13, 29, GREY.trim);
	line(scene, 12, 22, 14, 29, GREY.rim);
}

/**
 * The bank on the right: a rounded false front, an upper window and a broken shop window below.
 * @param {Canvas} scene
 */
function drawBank(scene) {
	for (let x = 52; x <= 61; x++) {
		const rise = Math.round(3 - Math.abs(x - 56.5) * 0.6);
		for (let y = 20 - rise; y < 20; y++) {
			set(scene, x, y, y === 20 - rise ? BLEACHED.rim : BLEACHED.trim);
		}
	}
	pane(scene, 54, 25, 6, 7, BLEACHED.trim);
	porch(scene, 50, 63, 34, BLEACHED);
	pane(scene, 53, 38, 8, 6, BLEACHED.trim);
	// Shards left in the broken pane.
	for (const [x, y] of [
		[53, 38],
		[54, 38],
		[53, 39],
		[60, 43],
		[59, 43],
		[60, 42],
		[57, 38],
	]) {
		set(scene, x, y, mix(C.cloudShade, C.duskSky4, 0.4));
	}
}

/**
 * The boardwalk along the fronts, and a barrel left on it.
 * @param {Canvas} scene
 */
function drawBoardwalk(scene) {
	for (let x = 0; x < 64; x++) {
		if (x >= 45 && x <= 49) {
			continue;
		}
		set(scene, x, BOARDWALK, mix(C.timberLight, C.duskSky5, 0.4));
		set(scene, x, BOARDWALK + 1, x % 4 === 0 ? C.wood : C.timberShade);
	}
	paint(
		scene,
		15,
		41,
		['.lll.', 'ttttt', 'lssss', 'ttttt', 'lssss', 'ttttt'],
		{
			l: mix(C.timberLight, C.duskSky6, 0.3),
			s: C.timber,
			t: C.lampFrame,
		}
	);
}

/**
 * A tumbleweed bowling down the street: loops of dry twigs tangled into a see-through ball, drawn after the
 * outline so the street shows between the twigs, with its shadow on the dust below.
 * @param {Canvas} scene
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {() => number} random
 */
function drawTumbleweed(scene, cx, cy, random) {
	const twig = C.wood;
	const twigMid = C.timberShade;
	const twigLit = C.timberLight;
	// The shadow, a flat smudge on the ground.
	for (let x = cx - 5; x <= cx + 5; x++) {
		const behind = get(scene, x, cy + 7);
		if (behind) {
			set(scene, x, cy + 7, mix(behind, C.duskSky1, 0.35));
		}
	}
	// A broken rim of twigs round a loose tangle, the street showing through the gaps.
	const r = 5.2;
	for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
		for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r) {
				continue;
			}
			const lit = x - cx + (y - cy) < -2;
			if (d > r - 1.2 ? random() < 0.85 : random() < 0.4) {
				set(scene, x, y, lit ? twigMid : twig);
			}
		}
	}
	// Sunlit twigs curling across the top of the ball.
	for (const [x0, y0, x1, y1] of [
		[cx - 4, cy - 1, cx - 1, cy - 4],
		[cx - 2, cy + 1, cx + 2, cy - 3],
		[cx - 3, cy + 3, cx, cy + 1],
		[cx + 1, cy + 2, cx + 3, cy],
	]) {
		line(scene, x0, y0, x1, y1, twigLit);
	}
	// A few twigs poking out.
	for (const [x0, y0, x1, y1] of [
		[cx - 6, cy - 2, cx - 4, cy - 1],
		[cx + 5, cy - 4, cx + 7, cy - 6],
		[cx + 2, cy + 6, cx + 3, cy + 7],
	]) {
		line(scene, x0, y0, x1, y1, twig);
	}
}

/**
 * Boards fallen out of the fronts, showing the dark behind.
 * @param {Canvas} scene
 */
function drawBoardsMissing(scene) {
	for (const [x, y, h] of [
		[24, 27, 3],
		[42, 12, 4],
		[2, 20, 3],
		[61, 23, 4],
		[20, 33, 2],
	]) {
		rect(scene, x, y, 1, h, DARK);
	}
}

/**
 * Pale ghost faces staring out of the dark windows, one peering over the saloon doors, each with a faint glow.
 * @param {Canvas} scene
 */
function drawGhosts(scene) {
	/** @type {Record<string, Colour>} */
	const keys = { L: C.ghostLight, G: C.ghost, e: C.ink, o: C.ghostShade };
	const face = ['.LLG.', 'LLLLG', 'LeLeG', 'LLLLG', 'LLoLG', 'L.L.G'];
	for (const [x, y] of [
		[22, 16],
		[4, 24],
		[55, 26],
	]) {
		glow(scene, {
			x: x + 2,
			y: y + 2,
			radius: 5,
			colour: C.ghost,
			strength: 0.35,
			steps: 2,
			skip: [C.ink],
		});
		paint(scene, x, y, face, keys);
	}
	// A ghost peering over the swinging doors, its hands on top of them.
	paint(
		scene,
		29,
		34,
		['..LLLG..', '.LLLLLG.', '.LeLLeG.', '.LLLLLG.', 'LG.oo.LG'],
		keys
	);
}

/**
 * Dust kicked up behind the tumbleweed and drifting along the street, with no outline.
 * @param {Canvas} scene
 */
function drawDust(scene) {
	for (const [x, y, n, t] of [
		[0, 59, 6, 0.35],
		[1, 57, 4, 0.3],
		[2, 61, 5, 0.3],
		[22, 50, 9, 0.2],
		[40, 52, 7, 0.2],
	]) {
		for (let k = 0; k < n; k++) {
			const behind = get(scene, x + k, y);
			if (behind) {
				set(scene, x + k, y, mix(behind, C.sandLight, t));
			}
		}
	}
}
