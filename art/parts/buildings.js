// Scene part: generic buildings many scenes need: a house, a tower and a wall.
import { set, rect } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Box} Box */

/**
 * Options for drawBuilding.
 * @typedef {Object} BuildingOptions
 * @property {'house' | 'tower' | 'wall'} kind - The building
 * @property {number} x - The building's leftmost column
 * @property {number} y - The building's bottom row
 * @property {number} [width] - Width in pixels; each kind has a default and a minimum
 */

/** @type {Record<string, { width: number, min: number, draw: (canvas: Canvas, x: number, y: number, width: number) => number }>} */
const BUILDINGS = {
	house: { width: 12, min: 7, draw: drawHouse },
	tower: { width: 8, min: 5, draw: drawTower },
	wall: { width: 16, min: 4, draw: drawWall },
};

/**
 * Draws a building standing on its bottom-left pixel.
 * @param {Canvas} canvas - The foreground, so the scene's outline pass outlines it
 * @param {BuildingOptions} options
 * @returns {Box} The box that holds every pixel drawn.
 * @throws {Error} For an unknown kind of building.
 */
export function drawBuilding(canvas, { kind, x, y, width }) {
	const building = BUILDINGS[kind];
	if (!building) {
		throw new Error(`drawBuilding: unknown kind "${kind}"`);
	}
	const w = Math.max(building.min, width ?? building.width);
	const h = building.draw(canvas, x, y, w);
	return { x, y: y - h + 1, w, h };
}

/**
 * Paints one row of masonry: lit on the left edge, shaded on the right, with mortar dashes.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {boolean} mortar - Whether this row carries mortar dashes
 */
function stoneRow(canvas, x, y, width, mortar) {
	for (let i = 0; i < width; i++) {
		let colour = PALETTE.stone;
		if (i === 0) {
			colour = PALETTE.stoneLight;
		} else if (i >= width - 2) {
			colour = PALETTE.stoneShade;
		} else if (mortar && (i + (y % 2) * 2) % 4 === 0) {
			colour = PALETTE.stoneMid;
		}
		set(canvas, x + i, y, colour);
	}
}

/**
 * Battlements: merlons with gaps between them.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {(i: number) => boolean} merlon - Whether column i holds a merlon
 */
function battlements(canvas, x, y, width, merlon) {
	for (let i = 0; i < width; i++) {
		if (merlon(i)) {
			set(canvas, x + i, y, i === 0 ? PALETTE.stoneLight : PALETTE.stone);
		}
	}
}

/**
 * A cream cottage with a red gable roof, a door and a lit window.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @returns {number} Its height.
 */
function drawHouse(canvas, x, y, width) {
	const right = x + width - 1;
	for (let row = y - 6; row <= y; row++) {
		for (let col = x + 1; col <= right - 1; col++) {
			const colour =
				col === x + 1
					? PALETTE.creamLight
					: col >= right - 2
						? PALETTE.creamShade
						: PALETTE.cream;
			set(canvas, col, row, colour);
		}
	}
	rect(canvas, x + 3, y - 3, 2, 4, PALETTE.wood);
	set(canvas, x + 4, y - 1, PALETTE.brass);
	rect(canvas, right - 4, y - 4, 2, 2, PALETTE.gold);
	set(canvas, right - 3, y - 3, PALETTE.amber);
	let rows = 0;
	for (let r = 0; width - 2 * r >= 2; r++) {
		const from = x + r;
		const to = right - r;
		for (let col = from; col <= to; col++) {
			const colour =
				r === 0 || col >= to - 1
					? PALETTE.brickRedShade
					: col === from
						? PALETTE.brickRedLight
						: PALETTE.brickRed;
			set(canvas, col, y - 7 - r, colour);
		}
		rows++;
	}
	return 7 + rows;
}

/**
 * A round-shouldered stone tower with battlements, a lit window slit and a door.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @returns {number} Its height.
 */
function drawTower(canvas, x, y, width) {
	for (let row = y - 16; row <= y; row++) {
		stoneRow(canvas, x, row, width, (y - row) % 4 === 2);
	}
	battlements(canvas, x, y - 17, width, (i) => i % 3 !== 2);
	const cx = x + Math.floor(width / 2) - 1;
	rect(canvas, cx, y - 11, 2, 3, PALETTE.gold);
	rect(canvas, cx, y - 3, 2, 4, PALETTE.wood);
	return 18;
}

/**
 * A stretch of stone wall with battlements.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @returns {number} Its height.
 */
function drawWall(canvas, x, y, width) {
	for (let row = y - 5; row <= y; row++) {
		stoneRow(canvas, x, row, width, (y - row) % 2 === 1);
	}
	battlements(canvas, x, y - 6, width, (i) => i % 4 < 2);
	return 7;
}
