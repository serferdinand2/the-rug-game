// Abstract resource symbols drawn directly on a 32×32 pixel grid.
import { createCanvas, outline, set } from '../painter.js';
import { PALETTE as C } from '../palette.js';

/** Draws one of the five resource symbols at native 32×32 resolution. @param {string} id */
export function drawResource(id) {
	const canvas = createCanvas(32, 32);
	const draw = {
		'resource/coin': drawCoin,
		'resource/worker': drawWorker,
		'resource/food': drawFood,
		'resource/culture': drawCulture,
		'resource/any': drawAny,
	}[id];
	if (!draw) throw new Error(`Unknown resource icon: ${id}`);
	draw(canvas);
	outline(canvas, C.ink);
	return canvas;
}

/** @param {import('../painter.js').Canvas} canvas */
function drawCoin(canvas) {
	circle(canvas, 16, 16, 13, C.amber);
	circle(canvas, 16, 16, 11, C.gold);
	circle(canvas, 16, 16, 8, C.amber);
	circle(canvas, 16, 16, 6, C.gold);
	// Small offset glints retain the stamped, abstract token look.
	line(canvas, 12, 10, 12, 13, C.creamLight);
	line(canvas, 13, 9, 13, 11, C.cream);
	set(canvas, 21, 20, C.amber);
	set(canvas, 20, 21, C.amber);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawWorker(canvas) {
	// A clean, front-facing palm with four separated fingers and one thumb.
	polygon(
		canvas,
		[
			[7, 17],
			[3, 15],
			[1, 17],
			[2, 22],
			[9, 27],
			[12, 29],
			[21, 29],
			[26, 25],
			[29, 19],
			[30, 14],
			[28, 12],
			[26, 13],
			[25, 17],
			[25, 8],
			[23, 6],
			[21, 7],
			[20, 16],
			[20, 5],
			[18, 3],
			[16, 5],
			[16, 16],
			[16, 6],
			[14, 4],
			[12, 6],
			[12, 17],
			[12, 10],
			[10, 8],
			[8, 10],
		],
		C.ink
	);
	polygon(
		canvas,
		[
			[8, 17],
			[5, 16],
			[3, 18],
			[4, 21],
			[10, 25],
			[13, 27],
			[20, 27],
			[24, 24],
			[27, 19],
			[28, 15],
			[27, 15],
			[26, 20],
			[24, 20],
			[24, 9],
			[23, 8],
			[22, 9],
			[21, 20],
			[19, 20],
			[19, 7],
			[18, 6],
			[17, 7],
			[17, 20],
			[15, 20],
			[15, 8],
			[14, 7],
			[13, 8],
			[13, 20],
			[11, 20],
			[11, 12],
			[10, 11],
			[9, 12],
		],
		C.timberLight
	);
	// Palm creases and a simple wrist band keep the hand readable at icon scale.
	line(canvas, 12, 23, 17, 25, C.timber);
	line(canvas, 17, 25, 21, 23, C.timber);
	line(canvas, 12, 28, 21, 28, C.gold);
	line(canvas, 14, 10, 14, 17, C.creamLight);
	line(canvas, 18, 8, 18, 16, C.creamLight);
	set(canvas, 23, 11, C.creamLight);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawFood(canvas) {
	// Four identical lobes create an exact quarter-turn-symmetric abstract food mark.
	fourfoldPolygon(
		canvas,
		[
			[16, 2],
			[20, 4],
			[23, 8],
			[23, 10],
			[26, 9],
			[29, 12],
			[29, 15],
		],
		C.grass
	);
	fourfoldPolygon(
		canvas,
		[
			[16, 6],
			[19, 8],
			[21, 11],
			[21, 13],
			[24, 12],
			[26, 14],
			[26, 15],
		],
		C.grassLight
	);
	rect(canvas, 14, 14, 4, 4, C.grassShade);
	fourfoldLine(canvas, 16, 7, 16, 11, C.creamLight);
	enforceQuarterTurnSymmetry(canvas);
}

/** Copy the top-right quadrant to its three exact pixel rotations. @param {import('../painter.js').Canvas} canvas */
function enforceQuarterTurnSymmetry(canvas) {
	const source = [...canvas.p];
	for (let y = 0; y < 16; y++) {
		for (let x = 16; x < 32; x++) {
			const color = source[y * 32 + x];
			let px = x;
			let py = y;
			for (let turn = 0; turn < 4; turn++) {
				canvas.p[py * 32 + px] = color;
				[px, py] = [31 - py, px];
			}
		}
	}
}

/** Draw the same quarter-turn-symmetric contour in all four directions. @param {import('../painter.js').Canvas} canvas @param {number[][]} quarter @param {string} color */
function fourfoldPolygon(canvas, quarter, color) {
	const points = [];
	for (let turn = 0; turn < 4; turn++) {
		for (const [x, y] of quarter.slice(0, -1)) {
			let px = x;
			let py = y;
			for (let i = 0; i < turn; i++) [px, py] = [31 - py, px];
			points.push([px, py]);
		}
	}
	polygon(canvas, points, color);
}

/** Draw a short highlight on each of the four identical lobes. @param {import('../painter.js').Canvas} canvas @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {string} color */
function fourfoldLine(canvas, x0, y0, x1, y1, color) {
	for (let turn = 0; turn < 4; turn++) {
		/** @param {number} x @param {number} y */
		const rotate = (x, y) => {
			let px = x;
			let py = y;
			for (let i = 0; i < turn; i++) [px, py] = [31 - py, px];
			return [px, py];
		};
		const [ax, ay] = rotate(x0, y0);
		const [bx, by] = rotate(x1, y1);
		line(canvas, ax, ay, bx, by, color);
	}
}

/** @param {import('../painter.js').Canvas} canvas */
function drawCulture(canvas) {
	// A four-point rosette keeps the original abstract purple star/diamond silhouette.
	polygon(
		canvas,
		[
			[16, 2],
			[20, 10],
			[27, 5],
			[23, 13],
			[30, 16],
			[23, 19],
			[27, 27],
			[20, 22],
			[16, 30],
			[12, 22],
			[5, 27],
			[9, 19],
			[2, 16],
			[9, 13],
			[5, 5],
			[12, 10],
		],
		C.arcane
	);
	polygon(
		canvas,
		[
			[16, 7],
			[19, 13],
			[24, 10],
			[21, 15],
			[26, 16],
			[21, 18],
			[24, 23],
			[19, 20],
			[16, 26],
			[13, 20],
			[8, 23],
			[11, 18],
			[6, 16],
			[11, 15],
			[8, 10],
			[13, 13],
		],
		C.arcaneLight
	);
	set(canvas, 16, 15, C.creamLight);
	set(canvas, 15, 16, C.creamLight);
	set(canvas, 16, 16, C.gold);
	set(canvas, 17, 16, C.creamLight);
	set(canvas, 16, 17, C.creamLight);
}

/** @param {import('../painter.js').Canvas} canvas */
function drawAny(canvas) {
	// Open gold ring around a small cross: a neutral placeholder for any resource.
	circle(canvas, 16, 15, 13, C.amber);
	circle(canvas, 16, 15, 10, C.gold);
	circle(canvas, 16, 15, 7, C.amber);
	circle(canvas, 16, 15, 5, null);
	rect(canvas, 14, 10, 4, 13, C.gold);
	rect(canvas, 10, 14, 13, 4, C.gold);
	line(canvas, 16, 5, 16, 8, C.creamLight);
	set(canvas, 16, 27, C.gold);
}

/** @param {import('../painter.js').Canvas} canvas @param {number} cx @param {number} cy @param {number} radius @param {string|null} color */
function circle(canvas, cx, cy, radius, color) {
	for (let y = -radius; y <= radius; y++) {
		for (let x = -radius; x <= radius; x++) {
			if (x * x + y * y <= radius * radius) {
				if (color) set(canvas, cx + x, cy + y, color);
				else canvas.p[(cy + y) * canvas.w + (cx + x)] = null;
			}
		}
	}
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
