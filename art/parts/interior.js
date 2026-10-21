// Scene part: a room seen from inside, with a back wall, a floor and an optional window onto the sky.
import { createCanvas, set, rect } from '../painter.js';
import { PALETTE } from '../palette.js';
import { drawSky } from './sky.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */

/**
 * A window in the back wall. The box includes its frame.
 * @typedef {Object} InteriorWindow
 * @property {number} x - The frame's leftmost column
 * @property {number} y - The frame's top row
 * @property {number} w - Width, frame included
 * @property {number} h - Height, frame included
 * @property {'night' | 'day' | 'dusk'} time - The sky seen through the panes
 */

/**
 * Options for drawInterior.
 * @typedef {Object} InteriorOptions
 * @property {number} floor - The floor's first row; the wall fills the rows above it
 * @property {() => number} random - The scene's seeded random stream
 * @property {'plaster' | 'stone' | 'panel'} [wall='plaster'] - Plaster over floorboards, stone blocks over flagstones, or wood panelling over floorboards
 * @property {InteriorWindow} [window] - A window in the back wall
 */

/** Each wall kind's painter, and the floor that goes with it. */
const WALLS = {
	plaster: { wall: plasterWall, floor: boardFloor },
	stone: { wall: stoneWall, floor: flagstoneFloor },
	panel: { wall: panelWall, floor: boardFloor },
};

/**
 * Draws a room filling the whole canvas: the back wall, the floor and a window.
 * @param {Canvas} canvas - The background layer
 * @param {InteriorOptions} options
 * @throws {Error} For an unknown wall or window time.
 */
export function drawInterior(
	canvas,
	{ floor, random, wall = 'plaster', window }
) {
	const kind = WALLS[wall];
	if (!kind) {
		throw new Error(`drawInterior: unknown wall "${wall}"`);
	}
	if (window && !['night', 'day', 'dusk'].includes(window.time)) {
		throw new Error(`drawInterior: unknown window time "${window.time}"`);
	}
	kind.wall(canvas, floor, random);
	kind.floor(canvas, floor, random);
	if (window) {
		drawWindow(
			canvas,
			window,
			wall === 'stone' ? 'stone' : 'timber',
			random
		);
	}
}

/**
 * Warm plaster with a darker band under the ceiling, a few stains and a skirting board.
 * @param {Canvas} canvas
 * @param {number} floor
 * @param {() => number} random
 */
function plasterWall(canvas, floor, random) {
	rect(canvas, 0, 0, canvas.w, floor, PALETTE.plaster);
	for (let x = 0; x < canvas.w; x++) {
		set(canvas, x, 0, PALETTE.plasterShade);
		set(canvas, x, 1, x % 2 ? PALETTE.plasterShade : PALETTE.plaster);
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * canvas.w);
		const y = 3 + Math.floor(random() * Math.max(1, floor - 6));
		set(
			canvas,
			x,
			y,
			random() > 0.5 ? PALETTE.plasterLight : PALETTE.plasterShade
		);
	}
	skirting(canvas, floor);
}

/**
 * Courses of stone blocks with staggered joints.
 * @param {Canvas} canvas
 * @param {number} floor
 * @param {() => number} random
 */
function stoneWall(canvas, floor, random) {
	for (let y = 0; y < floor; y++) {
		const course = Math.floor(y / 4);
		const offset = (course % 2) * 4;
		for (let x = 0; x < canvas.w; x++) {
			let colour = PALETTE.stone;
			if (y % 4 === 3 || (x + offset) % 8 === 0) {
				colour = PALETTE.stoneShade;
			} else if (y % 4 === 0) {
				colour = PALETTE.stoneLight;
			}
			set(canvas, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * canvas.w);
		const y = Math.floor(random() * floor);
		if (y % 4 === 1 || y % 4 === 2) {
			set(canvas, x, y, PALETTE.stoneMid);
		}
	}
}

/**
 * Plaster above a dado rail, raised wooden panels below it.
 * @param {Canvas} canvas
 * @param {number} floor
 * @param {() => number} random
 */
function panelWall(canvas, floor, random) {
	plasterWall(canvas, floor, random);
	const rail = Math.floor(floor * 0.55);
	rect(canvas, 0, rail, canvas.w, floor - rail, PALETTE.timber);
	for (let x = 0; x < canvas.w; x++) {
		set(canvas, x, rail, PALETTE.timberLight);
		set(canvas, x, rail + 1, PALETTE.timberShade);
	}
	for (let px = 2; px < canvas.w; px += 10) {
		for (let y = rail + 4; y < floor - 3; y++) {
			set(canvas, px, y, PALETTE.timberLight);
			set(canvas, px + 7, y, PALETTE.timberShade);
		}
		for (let x = px; x <= px + 7; x++) {
			set(canvas, x, rail + 3, PALETTE.timberLight);
			set(canvas, x, floor - 3, PALETTE.timberShade);
		}
	}
	skirting(canvas, floor);
}

/**
 * A dark skirting board along the foot of the wall.
 * @param {Canvas} canvas
 * @param {number} floor
 */
function skirting(canvas, floor) {
	for (let x = 0; x < canvas.w; x++) {
		set(canvas, x, floor - 2, PALETTE.timber);
		set(canvas, x, floor - 1, PALETTE.timberShade);
	}
}

/**
 * Floorboards running across the room, darker by the wall, with staggered joints.
 * @param {Canvas} canvas
 * @param {number} floor
 * @param {() => number} random
 */
function boardFloor(canvas, floor, random) {
	let joint = 0;
	for (let y = floor; y < canvas.h; y++) {
		const plank = Math.floor((y - floor) / 3);
		// One joint per plank, so both of its rows end at the same column.
		if ((y - floor) % 3 === 0) {
			joint = Math.floor(random() * 16);
		}
		for (let x = 0; x < canvas.w; x++) {
			let colour = y - floor < 3 ? PALETTE.floorShade : PALETTE.floor;
			if ((y - floor) % 3 === 2 || (x + joint + plank * 7) % 16 === 0) {
				colour = PALETTE.floorShade;
			} else if ((y - floor) % 3 === 0 && y - floor >= 3) {
				colour = PALETTE.floorLight;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * Flagstones that grow deeper towards the viewer, darker than the walls, shaded by the wall.
 * @param {Canvas} canvas
 * @param {number} floor
 * @param {() => number} random
 */
function flagstoneFloor(canvas, floor, random) {
	let top = floor;
	for (let course = 0; top < canvas.h; course++) {
		const depth = 2 + course;
		const width = 6 + course * 3;
		const offset = (course % 2) * Math.floor(width / 2);
		for (let y = top; y < Math.min(top + depth, canvas.h); y++) {
			for (let x = 0; x < canvas.w; x++) {
				let colour =
					course === 0 ? PALETTE.roofShade : PALETTE.stoneShade;
				if (y === top + depth - 1 || (x + offset) % width === 0) {
					colour = PALETTE.roofShade;
				} else if (y === top && course > 0) {
					colour = PALETTE.stoneMid;
				}
				set(canvas, x, y, colour);
			}
		}
		top += depth;
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * canvas.w);
		const y =
			floor +
			3 +
			Math.floor(random() * Math.max(1, canvas.h - floor - 3));
		set(canvas, x, y, PALETTE.stoneMid);
	}
}

/**
 * A window: a frame with a cross of glazing bars and a lit sill, the sky behind the panes.
 * @param {Canvas} canvas
 * @param {InteriorWindow} window
 * @param {'stone' | 'timber'} frame - The frame's material
 * @param {() => number} random
 */
function drawWindow(canvas, { x, y, w, h, time }, frame, random) {
	const [light, main, shade] =
		frame === 'stone'
			? [PALETTE.stoneLight, PALETTE.stone, PALETTE.stoneShade]
			: [PALETTE.timberLight, PALETTE.timber, PALETTE.timberShade];
	const sky = createCanvas(w - 2, h - 2);
	drawSky(sky, {
		time,
		horizon: h - 3,
		random,
		stars: 8,
		starRows: h - 2,
	});
	for (let j = 0; j < sky.h; j++) {
		for (let i = 0; i < sky.w; i++) {
			set(canvas, x + 1 + i, y + 1 + j, sky.p[j * sky.w + i]);
		}
	}
	for (let i = 0; i < w; i++) {
		set(canvas, x + i, y, main);
		set(canvas, x + i, y + h - 1, light);
		set(canvas, x + i, y + h, shade);
		set(canvas, x + i, y + Math.floor(h / 2), main);
	}
	for (let j = 0; j < h; j++) {
		set(canvas, x, y + j, light);
		set(canvas, x + w - 1, y + j, shade);
		set(canvas, x + Math.floor(w / 2), y + j, main);
	}
}
