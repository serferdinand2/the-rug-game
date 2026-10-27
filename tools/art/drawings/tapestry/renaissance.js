// Renaissance: a painter at his easel in a sunny piazza, painting the great green-domed cathedral before him.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The sky's last row, the piazza's first row and the dome's centre column. */
const HORIZON = 40;
const PIAZZA = 50;
const DX = 44;

/** The dome's weathered copper: lit, plain and shaded. */
const COPPER_LIGHT = mix(C.pineLight, C.foam, 0.45);
const COPPER = mix(C.pineLight, C.daySky1, 0.3);
const COPPER_SHADE = mix(C.pine, C.roofShade, 0.35);

/**
 * Draws the Renaissance scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3571);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHills(layer);
	drawPiazza(layer);

	// The dome stands behind the front, so each gets its own outline.
	const dome = createCanvas(64, 64);
	drawDome(dome);
	outline(dome, C.ink);

	drawFront(scene);
	drawEasel(scene);
	drawPainter(scene);
	outline(scene, C.ink);
	underlay(scene, dome);
	underlay(scene, layer);
	drawBrush(scene);
	return scene;
}

/**
 * Rolling green hills on the horizon, with dark cypresses and a far farmhouse.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const near = Math.round(
			HORIZON - 3 + Math.sin(x * 0.11 + 1) * 3 + Math.sin(x * 0.31) * 1
		);
		const far = Math.round(HORIZON - 7 + Math.sin(x * 0.07 + 2.5) * 3);
		for (let y = far; y < PIAZZA; y++) {
			let colour = mix(C.grassShade, C.daySky4, 0.45);
			if (y >= near) {
				colour =
					y === near
						? C.grassLight
						: y > near + 4 && (x + y) % 2 === 0
							? C.grassShade
							: C.grass;
			} else if (y === far) {
				colour = mix(C.grass, C.daySky5, 0.4);
			}
			set(layer, x, y, colour);
		}
	}
	// Cypresses: tall dark flames of green.
	for (const [cx, base, h] of [
		[3, 42, 11],
		[7, 41, 8],
		[27, 39, 9],
		[61, 40, 7],
	]) {
		for (let j = 0; j < h; j++) {
			const half = j < 2 ? 0 : j < h - 2 ? 1 : 1;
			for (let x = cx - half; x <= cx + half; x++) {
				set(
					layer,
					x,
					base - j,
					x < cx ? C.pine : x > cx ? C.pineShade : C.pine
				);
			}
		}
		set(layer, cx, base + 1, C.wood);
	}
	// A far farmhouse with a red roof.
	rect(layer, 15, 35, 5, 3, C.cream);
	rect(layer, 19, 35, 1, 3, C.creamShade);
	rect(layer, 14, 34, 7, 1, C.brickRed);
	rect(layer, 15, 33, 5, 1, C.brickRed);
}

/**
 * The piazza: warm brick paving in courses that widen towards the viewer.
 * @param {Canvas} layer
 */
function drawPiazza(layer) {
	const light = mix(C.sandLight, C.brickRedLight, 0.25);
	const main = mix(C.sand, C.brickRedLight, 0.3);
	const joint = mix(C.sandShade, C.brickRed, 0.35);
	const courses = [PIAZZA, PIAZZA + 2, PIAZZA + 5, PIAZZA + 9, PIAZZA + 14];
	for (let y = PIAZZA; y < 64; y++) {
		const course = courses.filter((c) => c <= y).length;
		for (let x = 0; x < 64; x++) {
			let colour = y === PIAZZA ? light : main;
			if (courses.includes(y) && y !== PIAZZA) {
				colour = joint;
			}
			// Joints run towards a point far behind the cathedral.
			const lean = (x - 30) / (y - PIAZZA + 6);
			if (Math.abs(lean - Math.round(lean)) < 0.08 && y > PIAZZA) {
				colour = joint;
			}
			if (course % 2 === 0 && (x + y) % 7 === 0 && colour === main) {
				colour = light;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Paints one pixel of a cream wall span, lit on the left and shaded on the right.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} left - The span's first column
 * @param {number} right - The span's last column
 */
function wall(canvas, x, y, left, right) {
	const colour =
		x === left ? C.creamLight : x >= right - 1 ? C.creamShade : C.cream;
	set(canvas, x, y, colour);
}

/**
 * The great dome on its drum: weathered copper ribbed in cream, crowned by a lantern and a gold ball.
 * @param {Canvas} canvas
 */
function drawDome(canvas) {
	// The drum, ringed with arched windows.
	for (let y = 18; y <= 30; y++) {
		for (let x = DX - 12; x <= DX + 12; x++) {
			wall(canvas, x, y, DX - 12, DX + 12);
		}
	}
	rect(canvas, DX - 13, 18, 27, 1, C.creamLight);
	rect(canvas, DX - 13, 19, 27, 1, C.creamShade);
	for (let x = DX - 10; x <= DX + 9; x += 4) {
		set(canvas, x, 22, C.roofLight);
		set(canvas, x + 1, 22, C.roofLight);
		rect(canvas, x, 23, 2, 4, C.roof);
		set(canvas, x + 1, 23, C.roofLight);
	}
	// The dome: copper, lit on the left, with four cream ribs that follow its curve.
	const profile = [2, 4, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12];
	const top = 17 - profile.length + 1;
	profile.forEach((half, j) => {
		const y = top + j;
		for (let x = DX - half; x <= DX + half; x++) {
			const u = (x - DX) / half;
			let colour = COPPER;
			if (u < -0.45) {
				colour = COPPER_LIGHT;
			} else if (u > 0.55) {
				colour = COPPER_SHADE;
			}
			for (const rib of [-0.62, -0.05, 0.55]) {
				if (Math.abs(u - rib) * half < 0.55) {
					colour = rib > 0.3 ? C.creamShade : C.cream;
				}
			}
			set(canvas, x, y, colour);
		}
	});
	// The lantern and its gold ball.
	rect(canvas, DX - 2, 2, 1, 4, C.creamLight);
	rect(canvas, DX - 1, 2, 1, 4, C.roof);
	rect(canvas, DX, 2, 1, 4, C.cream);
	rect(canvas, DX + 1, 2, 1, 4, C.roof);
	rect(canvas, DX + 2, 2, 1, 4, C.creamShade);
	rect(canvas, DX - 3, 1, 7, 1, C.creamShade);
	rect(canvas, DX - 1, 0, 3, 1, C.gold);
}

/**
 * The church front: two storeys of cream marble with pilasters, scrolls joining them,
 * a round window, a pediment and a great arched door.
 * @param {Canvas} canvas
 */
function drawFront(canvas) {
	const left = 27;
	const right = 63;
	// The lower storey.
	for (let y = 36; y < PIAZZA; y++) {
		for (let x = left; x <= right; x++) {
			wall(canvas, x, y, left, right + 2);
		}
	}
	rect(canvas, left - 1, 35, right - left + 2, 1, C.creamLight);
	rect(canvas, left - 1, 36, right - left + 2, 1, C.creamShade);
	for (const x of [left + 3, left + 9, DX + 6, DX + 12, DX + 17]) {
		rect(canvas, x, 37, 1, PIAZZA - 37, C.creamShade);
		rect(canvas, x - 1, 37, 1, PIAZZA - 37, C.creamLight);
	}
	// Two side niches with dark arches.
	for (const x of [left + 5, DX + 8]) {
		set(canvas, x, 40, C.roofLight);
		set(canvas, x + 1, 40, C.roofLight);
		rect(canvas, x, 41, 2, 4, C.roof);
	}
	// The great door: a dark wooden arch in a carved frame.
	for (let y = 39; y < PIAZZA; y++) {
		const inset = y === 39 ? 2 : y === 40 ? 1 : 0;
		for (let x = DX - 4 + inset; x <= DX + 4 - inset; x++) {
			const frame =
				x === DX - 4 + inset || x === DX + 4 - inset || y === 39;
			set(
				canvas,
				x,
				y,
				frame ? C.creamShade : x === DX ? C.wood : C.timberShade
			);
		}
	}
	set(canvas, DX - 1, 45, C.gold);
	set(canvas, DX + 1, 45, C.gold);
	// The upper storey, between two scrolls.
	for (let y = 28; y <= 34; y++) {
		for (let x = DX - 8; x <= DX + 8; x++) {
			wall(canvas, x, y, DX - 8, DX + 8);
		}
	}
	for (const [sx, dir] of [
		[DX - 9, -1],
		[DX + 9, 1],
	]) {
		for (let i = 0; i < 6; i++) {
			const y = 34 - Math.floor(i / 2);
			set(canvas, sx + dir * i, 34, dir < 0 ? C.cream : C.creamShade);
			set(canvas, sx + dir * i, y, dir < 0 ? C.creamLight : C.cream);
		}
		set(canvas, sx + dir * 5, 33, C.creamShade);
	}
	// The round window: a ring of stone around blue glass, one glint at its upper left.
	for (let y = -3; y <= 3; y++) {
		for (let x = -3; x <= 3; x++) {
			const d = x * x + y * y;
			if (d <= 10) {
				set(canvas, DX + x, 31 + y, d >= 6 ? C.creamShade : C.daySky2);
			}
		}
	}
	set(canvas, DX - 1, 30, C.daySky5);
	// The pediment.
	for (let r = 0; r <= 5; r++) {
		for (let x = DX - 9 + r * 2; x <= DX + 9 - r * 2; x++) {
			const colour =
				r === 0
					? C.creamShade
					: x <= DX - 8 + r * 2
						? C.creamLight
						: C.cream;
			set(canvas, x, 27 - r, colour);
		}
	}
	rect(canvas, DX - 10, 27, 21, 1, C.creamShade);
}

/**
 * The easel: an A-frame of timber holding a canvas that shows the dome in progress.
 * @param {Canvas} canvas
 */
function drawEasel(canvas) {
	// Legs: two spread at the front, one behind.
	for (let y = 30; y <= 62; y++) {
		const spread = Math.floor((y - 30) / 6);
		set(canvas, 19 - spread, y, C.timber);
		set(canvas, 21 + spread, y, C.timberShade);
	}
	rect(canvas, 20, 28, 1, 3, C.timber);
	// The ledge.
	rect(canvas, 12, 47, 17, 1, C.timberLight);
	rect(canvas, 12, 48, 17, 1, C.timberShade);
	// The canvas, with the painting so far: sky, hills and the green dome.
	rect(canvas, 13, 32, 15, 15, C.creamLight);
	for (let y = 33; y <= 45; y++) {
		for (let x = 14; x <= 26; x++) {
			let colour = y < 37 ? C.daySky3 : y < 41 ? C.daySky5 : C.grass;
			if (y >= 39 && y < 43 && x >= 17 && x <= 24) {
				colour = C.cream;
			}
			const dx = x - 20.5;
			if (y >= 36 && y < 39 && dx * dx + (y - 39) ** 2 * 1.5 <= 12) {
				colour = dx < 0 ? COPPER_LIGHT : COPPER;
			}
			set(canvas, x, y, colour);
		}
	}
	set(canvas, 20, 36, C.gold);
	set(canvas, 21, 36, C.gold);
	// Unpainted canvas still shows at the lower right.
	rect(canvas, 23, 43, 4, 3, C.creamLight);
}

/**
 * The painter: a man in a red cap and a purple doublet, palette in hand, reaching his brush to the canvas.
 * @param {Canvas} canvas
 */
function drawPainter(canvas) {
	const rows = [
		'...bBBBb....',
		'..bBBBBBBb..',
		'...HHSSS....',
		'..HHHSkS....',
		'..HHSSSSs...',
		'...HHSSs....',
		'....HSs.....',
		'...WWWWWW...',
		'..TTTTTTTt..',
		'.TTTTTTTttSS',
		'.TT.TTTTt...',
		'.TT.TTTTt...',
		'.Tt.TTTTt...',
		'PPPPTTTTt...',
		'PrugpTTTt...',
		'.pppcccct...',
		'...TTTTTtt..',
		'...TTTTTtt..',
		'....LL.LL...',
		'....LL.LL...',
		'....LL.LL...',
		'....LL.LL...',
		'....LL.LL...',
		'....LL.LL...',
		'....LL.LL...',
		'...KKK.KKK..',
	];
	/** @type {Record<string, string>} */
	const colours = {
		B: C.brickRed,
		b: C.brickRedShade,
		H: C.timberShade,
		S: C.skin,
		s: C.skinShade,
		k: C.wood,
		W: C.creamLight,
		T: C.roofLight,
		t: C.roof,
		P: C.creamLight,
		p: C.creamShade,
		r: C.brickRed,
		u: C.daySky2,
		g: C.gold,
		c: C.gold,
		L: C.stoneShade,
		K: C.wood,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, 1 + i, 36 + j, colours[key]);
			}
		});
	});
}

/**
 * The brush, from the painter's hand to the canvas, drawn after the outline so it stays fine.
 * @param {Canvas} canvas
 */
function drawBrush(canvas) {
	set(canvas, 13, 44, C.wood);
	set(canvas, 14, 43, C.wood);
	set(canvas, 15, 42, C.wood);
	set(canvas, 16, 41, C.brickRed);
}
