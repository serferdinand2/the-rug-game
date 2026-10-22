// Silk Road: two laden Bactrian camels led across the dunes at dusk towards a walled oasis town with palms.
import {
	createCanvas,
	set,
	rect,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row (seed 743 sets the dusk sun at column 32, just behind the lead camel). */
const HORIZON = 39;

/** Dune sand in the evening light: lit faces, plain faces and shadowed hollows. */
const DUNE_LIT = mix(C.sandLight, C.duskSky6, 0.35);
const DUNE = mix(C.sand, C.duskSky5, 0.3);
const DUNE_SHADE = mix(C.sandShade, C.duskSky3, 0.45);
const DUNE_DEEP = mix(C.sandShade, C.duskSky2, 0.6);

/**
 * Draws the Silk Road scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(743);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawFarDunes(layer);
	drawNearDune(layer, random);
	// The sun sets just behind the lead camel: a halo spills round its back.
	glow(layer, {
		x: 32,
		y: 38,
		radius: 15,
		colour: C.lampGlow,
		strength: 0.4,
		steps: 4,
	});

	// The oasis town stands far behind the caravan, so it gets its own outline.
	const town = createCanvas(64, 64);
	drawTown(town);
	outline(town, C.ink);
	glow(town, {
		x: 55,
		y: 37,
		radius: 4,
		colour: C.gold,
		strength: 0.3,
		skip: [C.gold, C.amber],
	});

	// The second camel walks a little behind the first, so it gets its own outline.
	const follower = createCanvas(64, 64);
	drawCamel(follower, -26, 28);
	outline(follower, C.ink);

	drawCamel(scene, 8, 31);
	drawDriver(scene, 54, 43);
	outline(scene, C.ink);
	underlay(scene, follower);
	underlay(scene, town);
	underlay(scene, layer);
	drawRopes(scene);
	return scene;
}

/**
 * Low far dunes on the skyline, their crests catching the last light.
 * @param {Canvas} layer
 */
function drawFarDunes(layer) {
	for (let x = 0; x < 64; x++) {
		const rise = Math.round(3 + 2.5 * Math.sin(x * 0.11 + 2.2));
		const lit = Math.cos(x * 0.11 + 2.2) > 0;
		for (let y = HORIZON - rise; y <= HORIZON + 6; y++) {
			let colour = lit ? DUNE : DUNE_SHADE;
			if (y === HORIZON - rise) {
				colour = lit ? DUNE_LIT : DUNE;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The near dune the caravan walks along: its crest under their feet, lit on the sunward face, ripples on the slope.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawNearDune(layer, random) {
	for (let x = 0; x < 64; x++) {
		const crest = Math.round(55 - x * 0.06 + Math.sin(x * 0.09) * 1.5);
		for (let y = HORIZON + 4; y < 64; y++) {
			let colour = DUNE_SHADE;
			if (y >= crest) {
				colour =
					y === crest ? C.sandLight : y < crest + 4 ? DUNE_LIT : DUNE;
			} else if (y > HORIZON + 7) {
				colour =
					(x + y) % 2 === 0 && y < HORIZON + 10
						? DUNE_SHADE
						: DUNE_DEEP;
			}
			set(layer, x, y, colour);
		}
	}
	for (let y = 59; y < 64; y += 2) {
		const shift = random() * Math.PI * 2;
		for (let x = 0; x < 64; x++) {
			if (Math.sin(x * 0.4 + shift) > 0.5) {
				set(layer, x, y, C.sandShade);
			}
		}
	}
}

/**
 * The oasis town on the right: mud-brick walls and flat roofs, a dome and a slender tower, lit windows and palms by a pool.
 * @param {Canvas} town
 */
function drawTown(town) {
	const wall = mix(C.sandShade, C.duskSky2, 0.45);
	const wallLit = mix(C.sand, C.duskSky6, 0.3);
	const wallShade = mix(C.sandShade, C.duskSky1, 0.6);
	const base = HORIZON - 1;
	// Houses behind the town wall, and the slender tower.
	/** @type {[number, number, number][]} */
	const blocks = [
		[48, 31, 5],
		[57, 30, 4],
	];
	for (const [x, top, w] of blocks) {
		for (let y = top; y <= base; y++) {
			for (let i = 0; i < w; i++) {
				const colour =
					y === top || i === 0
						? wallLit
						: i === w - 1
							? wallShade
							: wall;
				set(town, x + i, y, colour);
			}
		}
	}
	for (let y = 22; y <= base; y++) {
		set(town, 61, y, wallLit);
		set(town, 62, y, wallShade);
	}
	rect(town, 60, 22, 4, 1, wallLit);
	set(town, 61, 21, wallLit);
	set(town, 62, 21, wallShade);
	set(town, 61, 25, C.gold);
	// The blue dome on its drum.
	rect(town, 51, 29, 7, 4, wall);
	rect(town, 51, 29, 1, 4, wallLit);
	for (let y = 23; y <= 28; y++) {
		const half = [1, 2, 3, 3, 3, 3][y - 23];
		for (let x = 54 - half; x <= 54 + half; x++) {
			set(
				town,
				x,
				y,
				x < 54 ? C.daySea1 : x === 54 ? C.daySeaLine : C.daySea2
			);
		}
	}
	set(town, 54, 21, C.gold);
	set(town, 54, 22, C.gold);
	// The town wall, with battlements and a lit gate.
	for (let y = 34; y <= base; y++) {
		for (let x = 47; x < 64; x++) {
			const colour =
				y === 34 ? wallLit : (x + y) % 5 === 0 ? wallShade : wall;
			set(town, x, y, colour);
		}
	}
	for (let x = 47; x < 64; x += 2) {
		set(town, x, 33, wallLit);
	}
	rect(town, 54, 36, 3, 3, C.amber);
	set(town, 55, 35, C.amber);
	set(town, 55, 37, C.gold);
	set(town, 55, 38, C.gold);
	// Lit windows.
	for (const [x, y] of [
		[50, 32],
		[58, 32],
		[49, 36],
		[60, 36],
	]) {
		set(town, x, y, C.gold);
	}
	drawPalm(town, 49, base - 5, 4, -1);
	drawPalm(town, 59, base - 5, 6, 1);
}

/**
 * A date palm: a curved trunk and a spray of fronds.
 * @param {Canvas} town
 * @param {number} x - The trunk's foot
 * @param {number} y - The trunk's foot row
 * @param {number} height
 * @param {number} lean - -1 leans left, 1 leans right
 */
function drawPalm(town, x, y, height, lean) {
	let top = x;
	for (let j = 0; j < height; j++) {
		top = x + Math.round(lean * (j / height) ** 2 * 2);
		set(town, top, y - j, C.timber);
	}
	const crown = y - height;
	const frond = mix(C.pine, C.duskSky3, 0.3);
	const frondLit = mix(C.pineLight, C.duskSky5, 0.3);
	for (const [dx, dy] of [
		[-3, 1],
		[-2, 0],
		[-1, -1],
		[0, -1],
		[1, -1],
		[2, 0],
		[3, 1],
		[-4, 2],
		[4, 2],
		[-1, 0],
		[0, 0],
		[1, 0],
	]) {
		set(town, top + dx, crown + dy, dx < 0 ? frondLit : frond);
	}
}

/** The camel's size, and its colours: tan fur lit from the setting sun on the left; the far legs darker. */
const CAMEL_W = 41;
const CAMEL_H = 31;
const FUR_LIT = mix(C.sand, C.gold, 0.3);
const FUR = mix(C.timberLight, C.sand, 0.3);
const FUR_SHADE = C.timberLight;
const FUR_FAR = C.timber;

/**
 * Marks the pixels inside an ellipse.
 * @param {boolean[][]} mask
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 */
function ellipse(mask, cx, cy, rx, ry) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			if (
				((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 &&
				mask[y]?.[x] !== undefined
			) {
				mask[y][x] = true;
			}
		}
	}
}

/**
 * A camel's leg: an upper part, a knobbly knee and a thin shank down to a broad foot.
 * @param {boolean[][]} mask
 * @param {number} x - The leg's left column at the hip
 * @param {number} y - The hip's row
 * @param {number} reach - How far the foot swings: negative back, positive forward
 */
function leg(mask, x, y, reach) {
	for (let j = 0; j <= 12; j++) {
		const dx = Math.round((reach * j) / 12);
		const wide = j < 5 ? 3 : j === 5 || j === 6 ? 3 : 2;
		for (let i = 0; i < wide; i++) {
			mask[y + j][x + dx + i] = true;
		}
	}
}

/**
 * A Bactrian camel walking right: two humps with rolls of silk between them, a patterned saddle cloth,
 * and a long neck dipping low before it rises to the head.
 * @param {Canvas} canvas
 * @param {number} x0 - Left column
 * @param {number} y0 - Top row
 */
function drawCamel(canvas, x0, y0) {
	const blank = () =>
		Array.from({ length: CAMEL_H }, () => new Array(CAMEL_W).fill(false));
	// The far legs, behind the body.
	const far = blank();
	leg(far, 10, 17, 2);
	leg(far, 25, 17, -1);
	// The body, humps, neck, head and near legs.
	const body = blank();
	ellipse(body, 18, 13, 12, 5.5);
	ellipse(body, 11, 7, 4.2, 5);
	ellipse(body, 23, 7, 4.2, 5);
	ellipse(body, 17, 7, 4, 2);
	for (let t = 0; t <= 1; t += 0.05) {
		const nx = (1 - t) ** 2 * 28 + 2 * (1 - t) * t * 35 + t * t * 33;
		const ny = (1 - t) ** 2 * 12 + 2 * (1 - t) * t * 19 + t * t * 5;
		ellipse(body, nx, ny, 2.3 - t * 0.9, 2.3 - t * 0.9);
	}
	ellipse(body, 35, 4.5, 3.6, 2.2);
	ellipse(body, 38, 5.5, 2, 1.6);
	body[1][32] = true;
	body[2][32] = true;
	leg(body, 7, 17, -3);
	leg(body, 23, 17, 3);
	// The tail hangs from the rump.
	for (let j = 9; j <= 15; j++) {
		body[j][5] = true;
	}

	paintMask(canvas, far, x0, y0, () => FUR_FAR);
	paintMask(canvas, body, x0, y0, (x, y) => {
		if (!body[y - 1]?.[x]) {
			return FUR_LIT;
		}
		if (!body[y + 1]?.[x] || !body[y]?.[x + 1] || (y > 15 && y < 19)) {
			return FUR_SHADE;
		}
		return FUR;
	});

	// Broad, padded feet under each leg.
	for (const fx of [3, 11, 23, 26]) {
		rect(canvas, x0 + fx, y0 + 30, 4, 1, C.wood);
	}
	// The eye, nostril and ear.
	set(canvas, x0 + 35, y0 + 4, C.ink);
	set(canvas, x0 + 39, y0 + 5, FUR_SHADE);
	set(canvas, x0 + 32, y0 + 1, FUR_SHADE);

	drawSaddle(canvas, x0, y0);
}

/**
 * Paints the true pixels of a mask, each in the colour the picker gives it.
 * @param {Canvas} canvas
 * @param {boolean[][]} mask
 * @param {number} x0
 * @param {number} y0
 * @param {(x: number, y: number) => Colour} pick
 */
function paintMask(canvas, mask, x0, y0, pick) {
	mask.forEach((row, y) => {
		row.forEach((on, x) => {
			if (on) {
				set(canvas, x0 + x, y0 + y, pick(x, y));
			}
		});
	});
}

/**
 * The load: a red saddle cloth with a gold lattice and fringe over the flank, and rolls of silk tied between the humps.
 * @param {Canvas} canvas
 * @param {number} x0 - The camel's left column
 * @param {number} y0 - The camel's top row
 */
function drawSaddle(canvas, x0, y0) {
	for (let y = 9; y <= 17; y++) {
		const inset = y > 15 ? y - 15 : 0;
		for (let x = 12 + inset; x <= 23 - inset; x++) {
			let colour = x >= 22 - inset ? C.brickRedShade : C.brickRed;
			if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) {
				colour = C.gold;
			}
			if (y === 9) {
				colour = C.amber;
			}
			if (
				y === 17 ||
				(y > 15 && (x === 12 + inset || x === 23 - inset))
			) {
				colour = x % 2 ? C.gold : C.amber;
			}
			set(canvas, x0 + x, y0 + y, colour);
		}
	}
	// The silk rolls: purple below, green on top, bound with gold cords.
	for (let x = 14; x <= 20; x++) {
		const cord = x === 16 || x === 19;
		set(canvas, x0 + x, y0 + 7, cord ? C.gold : C.roofLight);
		set(canvas, x0 + x, y0 + 8, cord ? C.amber : C.roof);
		if (x >= 15 && x <= 19) {
			set(canvas, x0 + x, y0 + 5, cord ? C.gold : C.pineLight);
			set(canvas, x0 + x, y0 + 6, cord ? C.amber : C.pine);
		}
	}
	set(canvas, x0 + 14, y0 + 7, C.railLight);
	set(canvas, x0 + 15, y0 + 5, mix(C.pineLight, C.white, 0.3));
}

/**
 * The caravan's driver in a turban and long robe, walking ahead with the lead rope in hand.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawDriver(scene, x, y) {
	paint(
		scene,
		x,
		y,
		[
			'..WWW..',
			'.WWWWW.',
			'.WSSS..',
			'..SeS..',
			'..SSs..',
			'.RRRR..',
			'SRRRRR.',
			'.RRRRR.',
			'.RRRRR.',
			'.kkkkk.',
			'.RRRRR.',
			'.RRRRRR',
			'.RRRRRR',
			'..L..L.',
			'.HH..HH',
		],
		{
			W: C.cream,
			S: C.skin,
			s: C.skinShade,
			e: C.wood,
			R: C.daySea2,
			k: C.gold,
			L: C.wood,
			H: C.wood,
		}
	);
}

/**
 * The lead rope from the first camel's head to the driver's hand, and the line tying the second camel to the first.
 * @param {Canvas} scene
 */
function drawRopes(scene) {
	line(scene, 47, 37, 54, 49, C.timberShade);
	line(scene, 13, 35, 14, 42, C.timberShade);
}
