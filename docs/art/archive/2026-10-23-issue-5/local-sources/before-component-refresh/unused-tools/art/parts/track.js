// Abstract advancement-track symbols drawn directly on a 32×32 pixel grid.
import { createCanvas, outline, set } from '../painter.js';
import { PALETTE as C } from '../palette.js';

/** Draws an abstract track symbol at native 32×32 resolution. @param {string} id */
export function drawTrack(id) {
	const canvas = createCanvas(32, 32);
	const draw = {
		'track/exploration': drawExploration,
		'track/science': drawScience,
		'track/technology': drawTechnology,
		'track/military': drawMilitary,
		'track/arts': drawArts,
	}[id];
	if (!draw) throw new Error(`Unknown track symbol: ${id}`);
	draw(canvas);
	outline(canvas, C.ink);
	return canvas;
}

/** @param {import('../painter.js').Canvas} canvas */
function drawExploration(canvas) {
	// The same abstract upward arrow as before, now with a broader, clearer silhouette.
	polygon(
		canvas,
		[
			[16, 2],
			[30, 16],
			[22, 16],
			[22, 20],
			[19, 20],
			[19, 29],
			[13, 29],
			[13, 20],
			[10, 20],
			[10, 16],
			[2, 16],
		],
		C.teal
	);
	polygon(
		canvas,
		[
			[16, 6],
			[25, 15],
			[19, 15],
			[19, 18],
			[13, 18],
			[13, 15],
			[7, 15],
		],
		C.tealLight
	);
	rect(canvas, 14, 20, 4, 7, C.tealShade);
	line(canvas, 16, 21, 16, 26, C.tealLight);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawScience(canvas) {
	// A bright diamond lens suggests discovery, with a focused central spark.
	polygon(
		canvas,
		[
			[16, 2],
			[29, 16],
			[16, 30],
			[3, 16],
		],
		C.grassShade
	);
	polygon(
		canvas,
		[
			[16, 5],
			[26, 16],
			[16, 27],
			[6, 16],
		],
		C.grass
	);
	polygon(
		canvas,
		[
			[16, 9],
			[22, 16],
			[16, 23],
			[10, 16],
		],
		C.grassLight
	);
	line(canvas, 16, 5, 16, 10, C.creamLight);
	line(canvas, 6, 16, 11, 16, C.creamLight);
	line(canvas, 21, 16, 26, 16, C.creamLight);
	line(canvas, 16, 22, 16, 27, C.grassShade);
	set(canvas, 15, 15, C.gold);
	set(canvas, 16, 15, C.creamLight);
	set(canvas, 15, 16, C.creamLight);
	set(canvas, 16, 16, C.gold);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawTechnology(canvas) {
	// Circuit-board mark with a framed core and four connected terminals.
	polygon(
		canvas,
		[
			[7, 5],
			[25, 5],
			[27, 7],
			[27, 25],
			[25, 27],
			[7, 27],
			[5, 25],
			[5, 7],
		],
		C.amber
	);
	rect(canvas, 9, 9, 14, 14, C.gold);
	line(canvas, 1, 10, 5, 10, C.gold);
	line(canvas, 1, 16, 5, 16, C.gold);
	line(canvas, 1, 22, 5, 22, C.gold);
	line(canvas, 27, 10, 31, 10, C.gold);
	line(canvas, 27, 16, 31, 16, C.gold);
	line(canvas, 27, 22, 31, 22, C.gold);
	line(canvas, 10, 1, 10, 5, C.gold);
	line(canvas, 16, 1, 16, 5, C.gold);
	line(canvas, 22, 1, 22, 5, C.gold);
	line(canvas, 10, 27, 10, 31, C.gold);
	line(canvas, 16, 27, 16, 31, C.gold);
	line(canvas, 22, 27, 22, 31, C.gold);
	polygon(
		canvas,
		[
			[12, 12],
			[20, 12],
			[20, 20],
			[12, 20],
		],
		C.amber
	);
	polygon(
		canvas,
		[
			[14, 14],
			[18, 14],
			[18, 18],
			[14, 18],
		],
		C.creamLight
	);
	set(canvas, 15, 15, C.gold);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawMilitary(canvas) {
	// A sturdy shield and upright spear keep the symbol martial and unmistakable.
	polygon(
		canvas,
		[
			[16, 2],
			[28, 7],
			[27, 19],
			[23, 25],
			[16, 30],
			[9, 25],
			[5, 19],
			[4, 7],
		],
		C.brickRedShade
	);
	polygon(
		canvas,
		[
			[16, 5],
			[25, 9],
			[24, 18],
			[21, 23],
			[16, 27],
			[11, 23],
			[8, 18],
			[7, 9],
		],
		C.brickRed
	);
	polygon(
		canvas,
		[
			[16, 6],
			[19, 8],
			[18, 12],
			[18, 22],
			[16, 25],
			[14, 22],
			[14, 12],
			[13, 8],
		],
		C.gold
	);
	polygon(
		canvas,
		[
			[16, 4],
			[20, 10],
			[12, 10],
		],
		C.creamLight
	);
	line(canvas, 12, 13, 12, 20, C.brickRedLight);
	line(canvas, 20, 13, 20, 20, C.brickRedShade);
	line(canvas, 11, 22, 15, 25, C.brickRedLight);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawArts(canvas) {
	// A quill nib and sweeping feather make a compact, abstract arts emblem.
	polygon(
		canvas,
		[
			[4, 26],
			[7, 17],
			[12, 9],
			[23, 3],
			[29, 3],
			[29, 9],
			[23, 20],
			[15, 25],
			[7, 28],
		],
		C.arcaneShade
	);
	polygon(
		canvas,
		[
			[8, 23],
			[10, 17],
			[14, 11],
			[23, 6],
			[26, 6],
			[26, 9],
			[21, 18],
			[14, 23],
			[9, 25],
		],
		C.arcane
	);
	line(canvas, 7, 27, 25, 6, C.creamLight);
	line(canvas, 12, 21, 15, 21, C.arcaneLight);
	line(canvas, 15, 17, 19, 17, C.arcaneLight);
	line(canvas, 18, 13, 22, 13, C.arcaneLight);
	polygon(
		canvas,
		[
			[4, 26],
			[11, 23],
			[8, 29],
		],
		C.gold
	);
	set(canvas, 7, 26, C.creamLight);
}

/** @param {import('../painter.js').Canvas} canvas @param {number} x @param {number} y @param {number} w @param {number} h @param {string} color */
function rect(canvas, x, y, w, h, color) {
	for (let dy = 0; dy < h; dy++) {
		for (let dx = 0; dx < w; dx++) set(canvas, x + dx, y + dy, color);
	}
}

/** @param {import('../painter.js').Canvas} canvas @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {string} color */
function line(canvas, x0, y0, x1, y1, color) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		set(
			canvas,
			Math.round(x0 + (x1 - x0) * t),
			Math.round(y0 + (y1 - y0) * t),
			color
		);
	}
}

/** Fill a polygon on the integer pixel grid. @param {import('../painter.js').Canvas} canvas @param {number[][]} points @param {string} color */
function polygon(canvas, points, color) {
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
		for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
			let inside = false;
			for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
				const [xi, yi] = points[i];
				const [xj, yj] = points[j];
				if (
					yi > y !== yj > y &&
					x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
				)
					inside = !inside;
			}
			if (inside) set(canvas, x, y, color);
		}
	}
}
