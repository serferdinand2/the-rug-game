// Dark Ages: a ruined tower and broken wall on a bleak hill, a bare tree and a crow under a stormy night sky.
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

/** The ground's top row. */
const GROUND = 46;

/**
 * Draws the Dark Ages scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(19);

	drawSky(layer, {
		time: 'night',
		horizon: GROUND,
		random,
		stars: 24,
		starRows: 20,
		moon: { x: 46, y: 10 },
	});
	drawStormClouds(layer);
	drawLightning(layer);
	drawGround(layer, random);

	drawTower(scene);
	drawWall(scene);
	drawRubble(scene);
	drawTree(scene, random);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawCrows(scene);
	return scene;
}

/**
 * Long banks of storm cloud, one drifting across the moon, their upper edges lit by it.
 * @param {Canvas} layer
 */
function drawStormClouds(layer) {
	for (const [cx, cy, rx, ry] of [
		[12, 9, 18, 5],
		[50, 15, 16, 3],
		[30, 24, 20, 4],
		[60, 31, 12, 3],
	]) {
		for (let y = cy - ry; y <= cy + ry; y++) {
			for (let x = cx - rx; x <= cx + rx; x++) {
				const bump = Math.sin(x * 0.6) * 1.2;
				const d =
					((x - cx) / rx) ** 2 + ((y - cy + bump * 0.4) / ry) ** 2;
				if (d > 1 || y >= GROUND) {
					continue;
				}
				const nearMoon = Math.abs(x - 46) + Math.abs(y - 10) < 16;
				const rim = y - cy < -ry * 0.45;
				const colour = rim
					? nearMoon
						? C.railLight
						: C.roofLight
					: y > cy + ry * 0.4
						? C.roofShade
						: C.roof;
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * A distant fork of lightning striking down behind the broken wall.
 * @param {Canvas} layer
 */
function drawLightning(layer) {
	const bolt = [
		[38, 27],
		[38, 28],
		[37, 29],
		[37, 30],
		[37, 31],
		[38, 32],
		[39, 33],
		[39, 34],
		[38, 35],
		[38, 36],
		[38, 37],
		[39, 38],
		[39, 39],
		[39, 40],
		[40, 41],
		[40, 42],
		// The fork.
		[38, 33],
		[37, 34],
		[36, 35],
		[36, 36],
	];
	for (const [x, y] of bolt) {
		set(layer, x, y, C.lampGlow);
		for (const dx of [-1, 1]) {
			const behind = get(layer, x + dx, y);
			if (behind && behind !== C.lampGlow) {
				set(layer, x + dx, y, mix(behind, C.starDim, 0.35));
			}
		}
	}
}

/**
 * A dark, bleak hill under the ruin, falling away to the right, with pale tufts of dead grass.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const grass = mix(C.forestFloorShade, C.nightSky4, 0.35);
	const earth = mix(C.pineShade, C.nightSky2, 0.45);
	const deep = mix(C.pineShade, C.ink, 0.55);
	for (let x = 0; x < 64; x++) {
		const top =
			GROUND -
			2 +
			Math.round(Math.max(0, x - 24) / 12 + Math.sin(x * 0.3));
		for (let y = top; y < 64; y++) {
			const t = (y - top) / (64 - top);
			let colour = t > 0.55 ? deep : earth;
			if (t > 0.45 && t <= 0.55 && (x + y) % 2 === 0) {
				colour = deep;
			}
			set(layer, x, y, y === top ? grass : colour);
		}
		if (random() > 0.65) {
			set(layer, x, top - 1, grass);
		}
	}
	for (let i = 0; i < 16; i++) {
		const x = Math.floor(random() * 64);
		const y = GROUND + 2 + Math.floor(random() * 10);
		set(layer, x, y, grass);
	}
}

/**
 * Paints one stone pixel, lit on the left and shaded on the right of a span.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} left - The span's first column
 * @param {number} right - The span's last column
 */
function stone(scene, x, y, left, right) {
	let colour = C.stone;
	if (x === left) {
		colour = C.stoneLight;
	} else if (x >= right - 1) {
		colour = C.stoneShade;
	} else if (y % 3 === 0 && (x + Math.floor(y / 3) * 2) % 4 === 0) {
		colour = C.stoneMid;
	}
	set(scene, x, y, colour);
}

/**
 * The ruined tower: a broken, jagged top, an empty arched window and a long crack.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	const left = 9;
	const right = 21;
	const tops = [21, 18, 15, 14, 16, 19, 18, 22, 25, 24, 27, 29, 30];
	for (let x = left; x <= right; x++) {
		for (let y = tops[x - left]; y < GROUND + 1; y++) {
			stone(scene, x, y, left, right);
		}
	}
	// The empty window: an arch open to the sky behind.
	for (let y = 23; y <= 31; y++) {
		for (let x = 13; x <= 16; x++) {
			const arch = y === 23 && (x === 13 || x === 16);
			if (!arch) {
				scene.p[y * 64 + x] = null;
			}
		}
	}
	// A crack running down from the broken top.
	for (const [x, y] of [
		[18, 26],
		[18, 27],
		[19, 28],
		[19, 29],
		[18, 30],
		[18, 31],
		[17, 32],
		[17, 33],
		[18, 34],
	]) {
		set(scene, x, y, C.stoneShade);
	}
	// An arrow slit lower down.
	for (let y = 36; y <= 40; y++) {
		set(scene, 14, y, C.ink);
	}
}

/**
 * A curtain wall running from the tower, crumbling lower and lower, with a breach.
 * @param {Canvas} scene
 */
function drawWall(scene) {
	const left = 22;
	const right = 41;
	for (let x = left; x <= right; x++) {
		const base = 31 + Math.floor((x - left) * 0.55);
		const breach = x >= 31 && x <= 34;
		const top = breach
			? 43 - (x === 31 || x === 34 ? 1 : 0)
			: base + ((x * 7) % 3);
		for (let y = top; y < GROUND + 1; y++) {
			stone(scene, x, y, left, right);
		}
	}
}

/**
 * Fallen blocks at the foot of the wall.
 * @param {Canvas} scene
 */
function drawRubble(scene) {
	for (const [x, y, w] of [
		[29, 45, 3],
		[34, 46, 2],
		[42, 46, 3],
		[25, 46, 2],
		[37, 45, 2],
	]) {
		for (let i = 0; i < w; i++) {
			set(scene, x + i, y, i === 0 ? C.stoneLight : C.stoneMid);
			set(scene, x + i, y + 1, C.stoneShade);
		}
	}
}

/**
 * A bare, twisted tree on the right, its branches clawing across the sky.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawTree(scene, random) {
	for (let y = 22; y <= GROUND + 1; y++) {
		const lean = Math.round(Math.sin(y * 0.22) * 1.2);
		const wide = y > GROUND - 6 ? 1 : 0;
		for (let x = 52 + lean - wide; x <= 54 + lean + wide; x++) {
			set(scene, x, y, x === 52 + lean - wide ? C.timber : C.wood);
		}
	}
	branch(scene, 52, 30, -1, -1, 14, random);
	branch(scene, 54, 27, 1, -1, 9, random);
	branch(scene, 53, 23, -1, -1, 10, random);
	branch(scene, 54, 23, 1, -1, 10, random);
	branch(scene, 52, 36, -1, -1, 8, random);
}

/**
 * One branch, growing in steps and forking into thinner twigs.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} dx - Sideways step: -1, 0 or 1
 * @param {number} dy - Upward step, always -1
 * @param {number} length
 * @param {() => number} random
 */
function branch(scene, x, y, dx, dy, length, random) {
	let px = x;
	let py = y;
	for (let i = 0; i < length; i++) {
		const sideways = dx === 0 ? (random() > 0.5 ? 1 : -1) : dx;
		px += random() > 0.35 ? sideways : 0;
		py += random() > 0.25 ? dy : 0;
		set(scene, px, py, C.wood);
		if (i < length / 2) {
			set(scene, px, py + 1, C.wood);
		}
		if (i === Math.floor(length / 2) && length > 4) {
			branch(
				scene,
				px,
				py,
				-sideways,
				dy,
				Math.floor(length / 2),
				random
			);
		}
	}
}

/**
 * A crow on its own low limb, its back caught by the moon.
 * @param {Canvas} scene
 */
function drawCrows(scene) {
	// The limb, reaching left from the trunk.
	for (let x = 40; x <= 51; x++) {
		const y = 23 + Math.round((x - 40) * 0.35);
		set(scene, x, y, C.wood);
		set(scene, x, y - 1, x < 50 ? C.timber : C.wood);
	}
	set(scene, 39, 22, C.wood);
	sprite(scene, 41, 15, [
		'..hhh..',
		'.ekkkh.',
		'bkkkkkh',
		'.kkkkkk',
		'..kkkkk',
		'..k.k..',
	]);
}

/**
 * Paints a small sprite: k ink, h moonlit sheen, e eye, b beak; dots are left alone.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 */
function sprite(scene, x, y, rows) {
	/** @type {Record<string, string>} */
	const colours = { k: C.ink, h: C.railLight, e: C.amber, b: C.stoneShade };
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, x + i, y + j, colours[key]);
			}
		});
	});
}
