// Tyranny: a black spired fortress on a moonlit crag, one window burning red and its gate bound in chains.
import {
	createCanvas,
	get,
	set,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the crag's top row, and the full moon's centre and radius. */
const HORIZON = 52;
const CRAG = 44;
const MOON = { x: 17, y: 15, r: 9 };

/** The fortress's dark stone: its face, its moonlit edge and its shaded side. */
const WALL = mix(C.roofShade, C.night, 0.3);
const WALL_LIT = C.roof;
const WALL_RIM = C.railLight;
const WALL_SHADE = mix(C.night, C.ink, 0.4);

/**
 * Draws the Tyranny scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(149);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 30,
		starRows: 30,
	});
	drawRedHorizon(layer);
	drawMoon(layer);
	drawFarPeaks(layer);

	// The crag stands below and in front of the fortress, so each gets its own outline.
	const fortress = createCanvas(64, 64);
	drawFortress(fortress);
	outline(fortress, C.ink);

	drawCrag(scene, random);
	outline(scene, C.ink);
	underlay(scene, fortress);
	underlay(scene, layer);
	drawWindowGlow(scene);
	drawGate(scene);
	drawBats(scene);
	return scene;
}

/**
 * A sullen red glow low in the sky, as if the land below were burning.
 * @param {Canvas} layer
 */
function drawRedHorizon(layer) {
	for (let y = 30; y <= HORIZON; y++) {
		const t = ((y - 30) / (HORIZON - 30)) * 0.45;
		for (let x = 0; x < 64; x++) {
			const behind = get(layer, x, y);
			if (behind) {
				set(layer, x, y, mix(behind, C.brickRedShade, t));
			}
		}
	}
}

/**
 * A large full moon behind the left tower, with a faint halo and darker seas on its face.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	for (let y = cy - r - 2; y <= cy + r + 2; y++) {
		for (let x = cx - r - 2; x <= cx + r + 2; x++) {
			const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
			const behind = get(layer, x, y);
			if (d <= r) {
				const sea =
					(x - cx + 3) ** 2 + (y - cy + 2) ** 2 <= 6 ||
					(x - cx - 3) ** 2 + (y - cy - 3) ** 2 <= 4;
				set(
					layer,
					x,
					y,
					d > r - 1.2 ? C.moonRim : sea ? C.moonRim : C.moon
				);
			} else if (d <= r + 2 && behind) {
				set(layer, x, y, mix(behind, C.starDim, 0.25));
			}
		}
	}
}

/**
 * Far mountains on the skyline, dark against the red glow.
 * @param {Canvas} layer
 */
function drawFarPeaks(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON -
				4 -
				Math.abs(((x * 7) % 22) - 11) * 0.5 +
				Math.sin(x * 0.2) * 1.5
		);
		for (let y = top; y < 64; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * Paints one fortress pixel: moonlit on its left edge, dark across its face and darker on its right.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} left - The block's first column
 * @param {number} right - The block's last column
 */
function wall(canvas, x, y, left, right) {
	let colour = WALL;
	if (x === left) {
		colour = WALL_RIM;
	} else if (x === left + 1) {
		colour = WALL_LIT;
	} else if (x >= right - 1) {
		colour = WALL_SHADE;
	} else if (y % 4 === 0 && (x + Math.floor(y / 4) * 3) % 5 === 0) {
		colour = WALL_LIT;
	}
	set(canvas, x, y, colour);
}

/**
 * A square tower with battlements and a tall, thin spire.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} right
 * @param {number} top - The battlements' row
 * @param {number} spire - How tall the spire rises above the battlements
 */
function tower(canvas, left, right, top, spire) {
	for (let y = top; y <= CRAG + 1; y++) {
		for (let x = left; x <= right; x++) {
			wall(canvas, x, y, left, right);
		}
	}
	// Battlements jutting out on corbels.
	for (let x = left - 1; x <= right + 1; x++) {
		set(canvas, x, top, x === left - 1 ? WALL_RIM : WALL);
		if ((x - left + 1) % 3 !== 2) {
			set(canvas, x, top - 1, x === left - 1 ? WALL_RIM : WALL);
		}
	}
	// The spire narrows to a point, with a moonlit left edge.
	const cx = Math.floor((left + right) / 2);
	const base = Math.floor((right - left) / 2);
	for (let j = 0; j < spire; j++) {
		const half = Math.round(base * (1 - j / spire));
		const y = top - 2 - j;
		for (let x = cx - half; x <= cx + half + 1; x++) {
			set(
				canvas,
				x,
				y,
				x === cx - half ? WALL_RIM : x > cx ? WALL_SHADE : WALL
			);
		}
	}
	set(canvas, cx, top - 2 - spire, WALL_RIM);
}

/**
 * The fortress: a tall central keep between two spired towers, joined by curtain walls.
 * @param {Canvas} canvas
 */
function drawFortress(canvas) {
	// Curtain walls.
	for (let y = 30; y <= CRAG + 1; y++) {
		for (let x = 17; x <= 47; x++) {
			wall(canvas, x, y, 17, 47);
		}
	}
	for (let x = 17; x <= 47; x++) {
		if ((x - 17) % 3 !== 2) {
			set(canvas, x, 29, x === 17 ? WALL_RIM : WALL);
		}
	}
	tower(canvas, 12, 19, 22, 10);
	tower(canvas, 45, 52, 20, 12);
	tower(canvas, 25, 39, 12, 9);
	// Arrow slits, dark.
	for (const [x, y] of [
		[15, 28],
		[48, 26],
		[48, 35],
		[15, 36],
	]) {
		set(canvas, x, y, C.ink);
		set(canvas, x, y + 1, C.ink);
		set(canvas, x, y + 2, C.ink);
	}
}

/**
 * The window high in the keep, burning red, its light bleeding onto the dark stone around it.
 * @param {Canvas} scene
 */
function drawWindowGlow(scene) {
	const cx = 32;
	const cy = 20;
	for (let y = cy - 6; y <= cy + 7; y++) {
		for (let x = cx - 6; x <= cx + 6; x++) {
			const d = Math.sqrt((x - cx) ** 2 + ((y - cy) * 0.8) ** 2);
			const behind = get(scene, x, y);
			if (!behind || behind === C.ink) {
				continue;
			}
			if (d < 4.5) {
				set(scene, x, y, mix(behind, C.brickRed, 0.4));
			} else if (d < 6 && (x + y) % 2 === 0) {
				set(scene, x, y, mix(behind, C.brickRed, 0.25));
			}
		}
	}
	// The arched window: dark frame, red fire, a hot gold core.
	const rows = [
		'.kkk.',
		'krrrk',
		'krgrk',
		'kryrk',
		'krgrk',
		'krrrk',
		'kkkkk',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		k: C.ink,
		r: C.brickRedLight,
		g: C.amber,
		y: C.gold,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, cx - 2 + i, cy - 3 + j, colours[key]);
			}
		});
	});
}

/**
 * The gate at the keep's foot: barred doors under an arch, two heavy chains crossed over them and a padlock.
 * @param {Canvas} scene
 */
function drawGate(scene) {
	const left = 28;
	const right = 36;
	const top = 31;
	// The arched doorway: two plank doors split down the middle, studded with iron.
	for (let y = top; y <= CRAG + 1; y++) {
		const inset = y === top ? 3 : y === top + 1 ? 1 : 0;
		for (let x = left + inset; x <= right - inset; x++) {
			let colour = x % 2 ? C.timberShade : C.timber;
			if (x > 32) {
				colour = x % 2 ? C.wood : C.timberShade;
			}
			if (x === 32) {
				colour = C.ink;
			} else if ((y - top) % 5 === 4 && x % 2 === 0) {
				colour = C.stone;
			}
			set(scene, x, y, colour);
		}
	}
	// The arch's stones, moonlit.
	for (const [x, y] of [
		[left + 2, top - 1],
		[left + 1, top],
		[left, top + 1],
		[left - 1, top + 2],
		[right - 2, top - 1],
		[right - 1, top],
		[right, top + 1],
		[right + 1, top + 2],
		[left + 3, top - 1],
		[left + 4, top - 1],
		[left + 5, top - 1],
		[left + 6, top - 1],
	]) {
		set(scene, x, y, x < 32 ? WALL_RIM : WALL_LIT);
	}
	// Two heavy chains crossing in an X, from rings in the wall, their links alternating.
	for (let i = -1; i <= 11; i++) {
		const y = top + 2 + i;
		for (const x of [left + i, right - i]) {
			set(scene, x, y, i % 2 ? C.stoneMid : C.stoneLight);
		}
	}
	for (const x of [left - 2, right + 2]) {
		set(scene, x, top, C.stone);
		set(scene, x, top + 1, C.stoneLight);
	}
	// The padlock where the chains cross.
	for (const [dx, dy, colour] of /** @type {[number, number, Colour][]} */ ([
		[-1, -1, C.stoneLight],
		[0, -2, C.stoneLight],
		[1, -1, C.stoneLight],
		[-1, 0, C.brass],
		[0, 0, C.gold],
		[1, 0, C.brass],
		[-1, 1, C.lampFrame],
		[0, 1, C.brass],
		[1, 1, C.lampFrame],
	])) {
		set(scene, 32 + dx, top + 8 + dy, colour);
	}
}

/**
 * The crag: a broken rock spire, its faces moonlit on the left and falling into shadow on the right.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawCrag(scene, random) {
	const light = mix(C.stoneLight, C.nightSky5, 0.2);
	const main = mix(C.stone, C.nightSky4, 0.3);
	const mid = mix(C.stoneMid, C.nightSky3, 0.45);
	const shade = mix(C.stoneShade, C.nightSky2, 0.5);
	const leftEdge = edge([
		[12, CRAG - 1],
		[9, 46],
		[10, 48],
		[7, 51],
		[5, 55],
		[6, 57],
		[2, 60],
		[0, 63],
	]);
	const rightEdge = edge([
		[52, CRAG - 1],
		[55, 46],
		[54, 49],
		[57, 52],
		[59, 54],
		[58, 57],
		[62, 60],
		[64, 62],
	]);
	// Broken boulders: each pixel belongs to its nearest block; cracks run where two blocks meet,
	// and each block is lit on its upper left, towards the moon.
	/** @type {[number, number][]} */
	const blocks = [];
	for (let i = 0; i < 22; i++) {
		const y = CRAG + Math.floor(random() * (64 - CRAG));
		const x =
			leftEdge(y) + Math.floor(random() * (rightEdge(y) - leftEdge(y)));
		blocks.push([x, y]);
	}
	for (let y = CRAG - 1; y < 64; y++) {
		const left = leftEdge(y);
		const right = rightEdge(y);
		for (let x = left; x <= right; x++) {
			const near = blocks
				.map(([bx, by]) => ({
					d: Math.sqrt((x - bx) ** 2 + ((y - by) * 1.4) ** 2),
					bx,
					by,
				}))
				.sort((p, q) => p.d - q.d);
			const [first, second] = near;
			const lean = x - first.bx + (y - first.by) * 1.2;
			let colour = lean < -3 ? light : lean > 3 ? mid : main;
			if (second.d - first.d < 1.1) {
				colour = shade;
			}
			if (x <= left + 1 && colour !== shade) {
				colour = light;
			} else if (x > right - 8) {
				colour = colour === light ? main : shade;
			}
			if (y === CRAG - 1 && x > left + 1 && x < right - 7) {
				colour = light;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Turns a jagged edge, given as corners from the top down, into a function from row to column.
 * @param {[number, number][]} points - The corners, top first
 * @returns {(y: number) => number}
 */
function edge(points) {
	return (y) => {
		for (let i = 1; i < points.length; i++) {
			const [x0, y0] = points[i - 1];
			const [x1, y1] = points[i];
			if (y <= y1) {
				return Math.round(
					x0 + ((x1 - x0) * (y - y0)) / Math.max(1, y1 - y0)
				);
			}
		}
		return points[points.length - 1][0];
	};
}

/**
 * Bats flitting across the moon.
 * @param {Canvas} scene
 */
function drawBats(scene) {
	for (const [bx, by] of [
		[14, 12],
		[23, 19],
		[54, 8],
	]) {
		for (const [dx, dy] of [
			[-2, -1],
			[-1, 0],
			[0, 0],
			[1, 0],
			[2, -1],
			[0, 1],
		]) {
			set(scene, bx + dx, by + dy, C.ink);
		}
	}
}
