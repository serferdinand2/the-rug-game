// Militarism: a column of helmeted spearmen marching in step under green banners past a grey fortress on a hill.
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
import { drawBanner } from '../../parts/banner.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the fortress hill's foot, and the marching column's feet. */
const HORIZON = 36;
const HILL = 40;
const FEET = 61;

/** The soldier facing right, in profile. h helmet, H lit helmet, n nasal guard, S skin, s skin shade, t tunic, T tunic shade, b belt. */
const SOLDIER = [
	'..hhh...',
	'.hHHHh..',
	'.hHHHHh.',
	'hhhhhhhh',
	'.hhSSnS.',
	'.hhSSSSS',
	'..hsSSs.',
	'...ss...',
	'..tttT..',
	'.ttttTT.',
	'.ttttTT.',
	'.ttttTT.',
	'.bbbbbb.',
	'.ttttTT.',
	'.tt..TT.',
];

/**
 * Draws the Militarism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(137);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawLand(layer, random);

	// The fortress stands behind the column, so it gets its own outline.
	const fortress = createCanvas(64, 64);
	drawFortress(fortress);
	outline(fortress, C.ink);

	const banners = [12, 42];
	for (let i = 0; i < 6; i++) {
		const x = 1 + i * 10;
		drawSoldier(scene, x, FEET, !banners.includes(x));
	}
	for (const x of banners) {
		drawBanner(scene, {
			kind: 'hanging',
			x: x + 7,
			y: FEET - 8,
			cloth: C.pine,
			device: C.gold,
			height: 29,
		});
	}
	outline(scene, C.ink);
	underlay(scene, fortress);
	underlay(scene, layer);
	return scene;
}

/**
 * The land: hazy hills on the skyline, green fields, and the dusty road the column marches on.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLand(layer, random) {
	const far = mix(C.grass, C.daySky5, 0.5);
	const farLight = mix(C.grassLight, C.daySky6, 0.5);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(31 + Math.sin(x * 0.12 + 2) * 2.5);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? farLight : far);
		}
	}
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y === HORIZON + 1 ? C.grassLight : C.grass;
			if (y > 46 && (y > 49 || (x + y) % 2 === 0)) {
				colour = C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 2 + Math.floor(random() * 10);
		set(layer, x, y, C.grassLight);
	}
	// The road: a track from the gate that joins the broad road along the bottom.
	for (let y = HILL; y < 54; y++) {
		const cx = Math.round(46 - (y - HILL) * 0.9);
		const half = 1 + Math.floor((y - HILL) / 4);
		for (let x = cx - half; x <= cx + half; x++) {
			set(layer, x, y, x === cx - half ? C.sandLight : C.sand);
		}
	}
	for (let y = 54; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y === 54 ? C.sandLight : C.sand;
			if (y > 60 || (y > 57 && (x + y) % 2 === 0)) {
				colour = C.sandShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = 56 + Math.floor(random() * 7);
		set(layer, x, y, C.sandShade);
		set(layer, x + 1, y, C.sandLight);
	}
}

/**
 * Paints one row of grey masonry: lit on the left, shaded on the right, with mortar dashes.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} right
 * @param {number} y
 */
function stoneRow(canvas, left, right, y) {
	for (let x = left; x <= right; x++) {
		let colour = C.stone;
		if (x === left) {
			colour = C.stoneLight;
		} else if (x >= right - 1) {
			colour = C.stoneShade;
		} else if (y % 3 === 0 && (x + (y % 2) * 2) % 5 === 0) {
			colour = C.stoneMid;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * A block of masonry with battlements along its top.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} right
 * @param {number} top - The battlements' row
 * @param {number} bottom
 */
function masonry(canvas, left, right, top, bottom) {
	for (let y = top + 1; y <= bottom; y++) {
		stoneRow(canvas, left, right, y);
	}
	for (let x = left; x <= right; x++) {
		if ((x - left) % 3 !== 2) {
			set(canvas, x, top, x === left ? C.stoneLight : C.stone);
		}
	}
}

/**
 * A small green pennant on a short pole.
 * @param {Canvas} canvas
 * @param {number} x - The pole's column
 * @param {number} y - The pole's foot
 */
function pennant(canvas, x, y) {
	for (let j = 1; j <= 6; j++) {
		set(canvas, x, y - j, C.timber);
	}
	set(canvas, x, y - 7, C.gold);
	for (const [dx, dy, colour] of /** @type {[number, number, Colour][]} */ ([
		[1, -6, C.pineLight],
		[2, -6, C.pine],
		[3, -6, C.pine],
		[4, -5, C.pine],
		[1, -5, C.pine],
		[2, -5, C.pine],
		[3, -5, C.pineShade],
		[1, -4, C.pineShade],
		[2, -4, C.pineShade],
	])) {
		set(canvas, x + dx, y + dy, colour);
	}
}

/**
 * The fortress on its hill: a battlemented curtain wall and gate between two towers, a tall keep behind.
 * @param {Canvas} canvas
 */
function drawFortress(canvas) {
	// The hill.
	for (let x = 22; x < 64; x++) {
		const top = Math.round(
			HILL - 5 + Math.max(0, 30 - x) * 0.6 + Math.sin(x * 0.4) * 0.6
		);
		for (let y = top; y <= HILL; y++) {
			set(canvas, x, y, y === top ? C.grassLight : C.grass);
		}
	}
	masonry(canvas, 41, 53, 8, 26);
	rect(canvas, 44, 13, 2, 3, C.wood);
	rect(canvas, 49, 13, 2, 3, C.wood);
	pennant(canvas, 47, 8);
	masonry(canvas, 30, 63, 22, 36);
	masonry(canvas, 30, 37, 14, 36);
	masonry(canvas, 56, 63, 14, 36);
	rect(canvas, 33, 19, 2, 3, C.wood);
	rect(canvas, 59, 19, 2, 3, C.wood);
	pennant(canvas, 33, 14);
	pennant(canvas, 59, 14);
	// The open gate under its arch.
	for (let y = 28; y <= 36; y++) {
		for (let x = 44; x <= 49; x++) {
			const arch = y === 28 && (x === 44 || x === 49);
			if (!arch) {
				set(canvas, x, y, y === 28 ? C.wood : C.night);
			}
		}
	}
}

/**
 * A soldier marching right: a brimmed helmet with a nasal guard, a leather tunic,
 * a round green shield on the near arm and, unless he carries a banner, a spear held upright.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} feet - The feet row
 * @param {boolean} spear - Whether he carries a spear
 */
function drawSoldier(canvas, x, feet, spear) {
	/** @type {Record<string, Colour>} */
	const colours = {
		h: C.stone,
		H: C.stoneLight,
		n: C.stoneShade,
		S: C.skin,
		s: C.skinShade,
		t: C.timberLight,
		T: C.timber,
		b: C.wood,
	};
	const top = feet - SOLDIER.length - 3;
	if (spear) {
		for (let y = top - 10; y <= feet - 1; y++) {
			set(canvas, x + 7, y, C.timberLight);
		}
		set(canvas, x + 7, top - 11, C.stoneLight);
		set(canvas, x + 7, top - 12, C.white);
	}
	SOLDIER.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, top + j, colours[key]);
			}
		});
	});
	set(canvas, x + 7, top + 10, C.skin);
	// Legs mid-stride, every soldier in step, with dark boots.
	for (const [dx, dy] of [
		[2, -2],
		[5, -2],
		[1, -1],
		[6, -1],
		[0, 0],
		[1, 0],
		[6, 0],
		[7, 0],
	]) {
		set(canvas, x + dx, feet + dy, dy === 0 ? C.wood : C.roofShade);
	}
	// The round shield on the near arm, with a brass rim and a gold boss.
	for (let j = 0; j < 6; j++) {
		for (let i = 0; i < 6; i++) {
			const corner = (i === 0 || i === 5) && (j === 0 || j === 5);
			if (!corner) {
				const rim = i === 0 || i === 5 || j === 0 || j === 5;
				set(
					canvas,
					x + i,
					top + 8 + j,
					rim ? C.brass : i + j < 5 ? C.pineLight : C.pine
				);
			}
		}
	}
	set(canvas, x + 2, top + 10, C.gold);
	set(canvas, x + 3, top + 10, C.gold);
	set(canvas, x + 2, top + 11, C.gold);
	set(canvas, x + 3, top + 11, C.amber);
}
