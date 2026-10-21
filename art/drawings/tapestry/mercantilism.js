// Mercantilism: a merchant ship moored at a stone quay, sails furled, a crane swinging a crate aboard past stacks of crates and barrels.
import {
	createCanvas,
	get,
	set,
	rect,
	clear,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';
import { drawShip } from '../../parts/ship.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The far shore's horizon row, the ship's waterline, and the quay's edge. */
const HORIZON = 33;
const WATERLINE = 50;
const QUAY = 52;

/**
 * Draws the Mercantilism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(317);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawFarShore(layer);
	drawSea(layer, { time: 'day', top: HORIZON + 1, random, waves: 30 });
	drawQuay(layer, random);

	// The ship is moored behind everything on the quay, so it gets its own outline.
	const ship = createCanvas(64, 64);
	drawMooredShip(ship);
	outline(ship, C.ink);

	drawCrane(scene);
	drawGangplank(scene);
	drawCargo(scene);
	drawBollard(scene, 6);
	drawFigure(scene, { x: 35, y: 50, facing: 'left', clothes: C.daySea2 });
	drawSack(scene, 39, 42);
	outline(scene, C.ink);
	underlay(scene, ship);
	underlay(scene, layer);
	drawRopes(scene);
	drawGulls(scene);
	return scene;
}

/**
 * The far side of the harbour: low hills in the haze, with a few pale roofs at the water.
 * @param {Canvas} layer
 */
function drawFarShore(layer) {
	const hill = mix(C.grassShade, C.daySky5, 0.55);
	const hillLight = mix(C.grass, C.daySky5, 0.5);
	const wall = mix(C.cream, C.daySky5, 0.4);
	const roof = mix(C.brickRed, C.daySky5, 0.45);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			29 + Math.sin(x * 0.11 + 1) * 2 + Math.sin(x * 0.37)
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? hillLight : hill);
		}
	}
	for (const x of [44, 49, 55]) {
		rect(layer, x, HORIZON - 2, 4, 3, wall);
		rect(layer, x, HORIZON - 3, 4, 1, roof);
		rect(layer, x + 1, HORIZON - 4, 2, 1, roof);
	}
}

/**
 * The quay: a pale curb at the water's edge, then flagstones to the bottom of the scene.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawQuay(layer, random) {
	for (let x = 0; x < 64; x++) {
		set(layer, x, QUAY - 1, C.daySea3);
		set(layer, x, QUAY, C.stoneLight);
		set(layer, x, QUAY + 1, C.stone);
		for (let y = QUAY + 2; y < 64; y++) {
			const row = Math.floor((y - QUAY - 2) / 4);
			const joint = (y - QUAY - 2) % 4 === 3 || (x + row * 5) % 9 === 0;
			set(
				layer,
				x,
				y,
				joint ? C.stoneMid : y > 58 ? C.stone : C.stoneLight
			);
		}
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		const y = QUAY + 3 + Math.floor(random() * 9);
		set(layer, x, y, C.stone);
	}
}

/**
 * The merchant ship, facing out to sea, its sails furled on the yards while it lies at the quay.
 * @param {Canvas} canvas
 */
function drawMooredShip(canvas) {
	// Drawn with stone sails, which are then taken in: only the bare yards and the furled canvas stay.
	drawShip(canvas, {
		x: 1,
		y: WATERLINE,
		facing: 'left',
		sails: C.stone,
		flag: C.gold,
	});
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(canvas, x, y);
			if (colour === C.stone || colour === C.stoneShade) {
				clear(canvas, x, y);
			}
		}
	}
	// The sails covered the masts; put the bare masts back, from each masthead to the deck.
	for (let x = 0; x < 64; x++) {
		let top = -1;
		for (let y = 0; y < WATERLINE - 5 && top < 0; y++) {
			if (
				get(canvas, x, y) === C.wood &&
				get(canvas, x, y + 1) === C.wood
			) {
				top = y;
			}
		}
		for (let y = top; top >= 0 && y < WATERLINE - 4; y++) {
			if (get(canvas, x, y) === null) {
				set(canvas, x, y, C.wood);
			}
		}
	}
	for (let y = 0; y < WATERLINE - 5; y++) {
		for (let x = 1; x < 63; x++) {
			const yard =
				get(canvas, x, y) === C.wood &&
				(get(canvas, x - 1, y) === C.wood ||
					get(canvas, x + 1, y) === C.wood);
			if (yard && get(canvas, x, y + 1) === null) {
				const end = get(canvas, x + 1, y) !== C.wood;
				set(canvas, x, y + 1, end ? C.creamShade : C.cream);
			}
		}
	}
}

/**
 * A wooden quayside crane: a post braced on a stone footing, its jib reaching out over the ship.
 * @param {Canvas} scene
 */
function drawCrane(scene) {
	const post = 57;
	for (let y = 18; y <= QUAY + 4; y++) {
		set(scene, post, y, C.timberLight);
		set(scene, post + 1, y, C.timber);
		set(scene, post + 2, y, C.timberShade);
	}
	// The stone footing and a brace.
	rect(scene, post - 2, QUAY + 3, 7, 3, C.stone);
	rect(scene, post - 2, QUAY + 3, 7, 1, C.stoneLight);
	for (let i = 0; i < 7; i++) {
		set(scene, post + 3 + Math.floor(i / 2), 40 + i, C.timber);
	}
	// The jib, rising from the post's head out over the ship's stern.
	for (let i = 0; i <= 20; i++) {
		const x = post + 1 - i;
		const y = 21 - Math.round(i * 0.45);
		set(scene, x, y, C.timberLight);
		set(scene, x, y + 1, C.timberShade);
	}
	// A stay from the post's top to the jib.
	for (let i = 0; i <= 6; i++) {
		set(scene, post - i, 17 - Math.floor(i / 3), C.timber);
	}
	// The winch drum on the post.
	rect(scene, post - 2, 44, 2, 3, C.timberShade);
	set(scene, post - 3, 45, C.wood);
}

/**
 * The gangplank from the quay up to the ship's stern deck.
 * @param {Canvas} scene
 */
function drawGangplank(scene) {
	for (let i = 0; i <= 10; i++) {
		const x = 32 + i;
		const y = 45 + Math.round(i * 0.7);
		set(scene, x, y, C.timberLight);
		set(scene, x, y + 1, C.timberShade);
	}
}

/**
 * The goods waiting on the quay: stacked crates and a row of barrels.
 * @param {Canvas} scene
 */
function drawCargo(scene) {
	crate(scene, 44, 50, 8, 7);
	crate(scene, 46, 43, 7, 7);
	barrel(scene, 52, 51);
	barrel(scene, 58, 52);
	barrel(scene, 12, 50);
}

/**
 * A wooden crate with plank lines and a diagonal brace.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {number} w - Width
 * @param {number} h - Height
 */
function crate(scene, x, y, w, h) {
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			let colour = C.sand;
			if (i === 0 || i === w - 1 || j === 0 || j === h - 1) {
				colour = j === 0 ? C.sandLight : C.sandShade;
			} else if (
				i === j * (w / h) ||
				Math.round(j * ((w - 1) / (h - 1))) === i
			) {
				colour = C.sandShade;
			} else if (i >= w - 2) {
				colour = C.sandShade;
			}
			set(scene, x + i, y + j, colour);
		}
	}
}

/**
 * A barrel standing on end, with dark hoops, lit on its left.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function barrel(scene, x, y) {
	const rows = [
		'.tTTTt.',
		'tLLTTTs',
		'kkkkkkk',
		'LLTTTts',
		'LLTTTts',
		'kkkkkkk',
		'tLLTTTs',
		'.tTTTs.',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		L: C.timberLight,
		T: C.timber,
		t: C.timber,
		s: C.timberShade,
		k: C.wood,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * A stone bollard on the quay's edge.
 * @param {Canvas} scene
 * @param {number} x - Left column
 */
function drawBollard(scene, x) {
	rect(scene, x, QUAY - 1, 4, 4, C.stoneMid);
	rect(scene, x, QUAY - 1, 1, 4, C.stoneLight);
	rect(scene, x - 1, QUAY - 2, 6, 1, C.stoneLight);
}

/**
 * A sack of goods on the porter's back.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawSack(scene, x, y) {
	rect(scene, x, y + 1, 6, 3, C.cream);
	rect(scene, x + 1, y, 4, 1, C.cream);
	rect(scene, x + 4, y + 1, 2, 3, C.creamShade);
	set(scene, x + 2, y, C.creamShade);
}

/**
 * The hoist rope with the crate on its hook, and the mooring line from the bollard to the bow.
 * Drawn after the outline so the ropes stay thin.
 * @param {Canvas} scene
 */
function drawRopes(scene) {
	const tip = 37;
	for (let y = 14; y <= 26; y++) {
		set(scene, tip, y, C.wood);
	}
	// The hoisted crate, with its own ink edge.
	rect(scene, tip - 4, 27, 9, 7, C.ink);
	for (let j = 0; j < 5; j++) {
		for (let i = 0; i < 7; i++) {
			const edge = i === 0 || i === 6 || j === 0 || j === 4;
			set(
				scene,
				tip - 3 + i,
				28 + j,
				edge
					? j === 0
						? C.sandLight
						: C.sandShade
					: i === j + 1
						? C.sandShade
						: C.sand
			);
		}
	}
	for (const [x, y] of [
		[tip - 1, 26],
		[tip + 1, 26],
	]) {
		set(scene, x, y, C.wood);
	}
	// The mooring line, sagging from the bollard to the bow.
	for (let x = 2; x <= 7; x++) {
		set(scene, x, 46 + Math.round((x - 2) * 0.6), C.wood);
	}
}

/**
 * Two gulls over the harbour.
 * @param {Canvas} scene
 */
function drawGulls(scene) {
	for (const [gx, gy] of [
		[48, 8],
		[54, 12],
	]) {
		for (const [dx, dy] of [
			[-2, 0],
			[-1, -1],
			[0, 0],
			[1, -1],
			[2, 0],
		]) {
			set(scene, gx + dx, gy + dy, C.white);
		}
	}
}
