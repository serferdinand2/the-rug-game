// Alliance: two crossed standards, one striped red and cream, one quartered blue and cream, above matching pavilions sharing a campfire at dusk.
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

/** The last sky row, the camp's centre column and the fire's base row. */
const HORIZON = 42;
const CX = 32;
const FIRE_Y = 55;

/**
 * An ally's colours and the invented pattern on their flag: a cloth, its shade and its light,
 * worked with cream either in stripes (paly) or in four quarters (quarterly).
 * @typedef {{ cloth: Colour, shade: Colour, light: Colour, pattern: 'paly' | 'quarterly' }} Ally
 */

/** @type {Ally} */
const RED = {
	cloth: C.brickRed,
	shade: C.brickRedShade,
	light: C.brickRedLight,
	pattern: 'paly',
};
/** @type {Ally} */
const BLUE = {
	cloth: C.daySea2,
	shade: C.daySea3,
	light: C.daySea1,
	pattern: 'quarterly',
};

/**
 * Draws the Alliance scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(103);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawHills(layer);
	drawGround(layer, random);
	drawFireGlow(layer);

	// The crossed banners stand behind the pavilions, so they get their own outline.
	const banners = createCanvas(64, 64);
	drawStandard(banners, [20, 50], [42, 5], 1, BLUE);
	drawStandard(banners, [44, 50], [22, 5], -1, RED);
	outline(banners, C.ink);

	drawPavilion(scene, 11, 1, RED);
	drawPavilion(scene, 53, -1, BLUE);
	drawLogs(scene);
	outline(scene, C.ink);
	underlay(scene, banners);
	underlay(scene, layer);
	drawFlames(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Low hills on the skyline in dusk shadow.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			41 +
				Math.sin(x * 0.13 + 0.6) * 1.5 -
				Math.min(5, Math.abs(x - CX) * 0.3)
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * The camp's ground: dusky grass darkening towards the viewer, with a few tufts.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const light = mix(C.grassShade, C.duskSky5, 0.3);
	const main = mix(C.forestFloorShade, C.duskSky2, 0.35);
	const deep = mix(C.forestFloorShade, C.ink, 0.45);
	for (let y = HORIZON + 1; y < 64; y++) {
		const t = (y - HORIZON) / (64 - HORIZON);
		for (let x = 0; x < 64; x++) {
			let colour = main;
			if (y === HORIZON + 1) {
				colour = light;
			} else if (t > 0.75 || (t > 0.55 && (x + y) % 2 === 0)) {
				colour = deep;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 3 + Math.floor(random() * 18);
		set(layer, x, y, light);
	}
}

/**
 * The firelight warming the ground around the campfire.
 * @param {Canvas} layer
 */
function drawFireGlow(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.sqrt((x - CX) ** 2 + ((y - FIRE_Y) * 2.2) ** 2);
			const behind = get(layer, x, y);
			if (behind && d < 18) {
				const t = d < 9 ? 0.45 : d < 13 ? 0.3 : 0.15;
				set(layer, x, y, mix(behind, C.amber, t));
			}
		}
	}
}

/**
 * A standard: a slanting pole with a gold finial and a flag flying from its top, away from the cross.
 * @param {Canvas} canvas
 * @param {[number, number]} foot - The pole's foot
 * @param {[number, number]} top - The pole's top
 * @param {1 | -1} side - Which way the flag flies: 1 to the right, -1 to the left
 * @param {Ally} ally
 */
function drawStandard(canvas, foot, top, side, ally) {
	const [fx, fy] = foot;
	const [tx, ty] = top;
	/**
	 * The pole's column at a row.
	 * @param {number} y
	 * @returns {number}
	 */
	const poleAt = (y) => Math.round(fx + ((tx - fx) * (y - fy)) / (ty - fy));
	// The flag: each column ripples, and folds turned away are shaded.
	// Every pixel is tested, so the cloth has no holes along the slanting hoist.
	for (let y = ty - 1; y <= ty + 14; y++) {
		for (let x = 0; x < 64; x++) {
			const i = side * (x - poleAt(y));
			if (i < 1 || i > 14) {
				continue;
			}
			const wave = Math.round(Math.sin(i * 0.6) * 1.1);
			const tail = i >= 13 ? 1 : 0;
			const j = y - (ty + 2 + wave);
			if (j < tail || j >= 10 - tail) {
				continue;
			}
			const folded = Math.sin(i * 0.6) < -0.35;
			const lit = j === tail && !folded;
			if (onPattern(ally.pattern, i, j)) {
				set(
					canvas,
					x,
					y,
					folded ? C.creamShade : lit ? C.creamLight : C.cream
				);
			} else {
				set(
					canvas,
					x,
					y,
					folded ? ally.shade : lit ? ally.light : ally.cloth
				);
			}
		}
	}
	// The pole, two pixels thick so it reads on its slant, drawn over the flag's hoist.
	for (let y = ty; y <= fy; y++) {
		const x = poleAt(y);
		set(canvas, x, y, C.timberLight);
		set(canvas, x + 1, y, C.timber);
	}
	set(canvas, tx, ty - 1, C.gold);
	set(canvas, tx + 1, ty - 1, C.amber);
	set(canvas, tx, ty - 2, C.lampGlow);
}

/**
 * Tells whether a point of a flag falls on its cream pattern. Columns are counted from the pole,
 * so the pattern follows the cloth as it hangs from the slanting pole.
 * @param {Ally['pattern']} pattern - Stripes running out from the pole, or four quarters
 * @param {number} i - Columns from the pole, 1 to 14
 * @param {number} j - Rows from the flag's top, 0 to 9
 * @returns {boolean}
 */
function onPattern(pattern, i, j) {
	if (pattern === 'paly') {
		return Math.floor((i - 1) / 3) % 2 === 1;
	}
	return i <= 7 !== j <= 4;
}

/**
 * A round pavilion in its ally's stripes: a striped cone roof, a scalloped valance
 * and a striped wall with an open, lamplit door. The side facing the fire is lit.
 * @param {Canvas} scene
 * @param {number} cx - The pavilion's centre column
 * @param {1 | -1} fireSide - Which side the fire is on: 1 to the right, -1 to the left
 * @param {Ally} ally
 */
function drawPavilion(scene, cx, fireSide, ally) {
	const peak = 28;
	const eaves = 41;
	const base = 57;
	/**
	 * A cream or striped pixel, lit towards the fire and shaded away from it.
	 * @param {number} u - Across the pavilion, from -1 (left) to 1 (right)
	 * @param {boolean} striped
	 * @returns {Colour}
	 */
	const tone = (u, striped) => {
		const lit = u * fireSide;
		if (striped) {
			return lit > 0.45
				? ally.light
				: lit < -0.35
					? ally.shade
					: ally.cloth;
		}
		return lit > 0.45 ? C.creamLight : lit < -0.35 ? C.creamShade : C.cream;
	};
	// The gold finial on the peak.
	set(scene, cx, peak - 1, C.gold);
	set(scene, cx, peak - 2, C.gold);
	set(scene, cx, peak - 3, C.lampGlow);
	// The roof: stripes fan out from the peak.
	for (let y = peak; y < eaves; y++) {
		const half = Math.round((y - peak) * 0.85) + 1;
		for (let x = cx - half; x <= cx + half; x++) {
			const u = (x - cx) / half;
			const striped = Math.floor((u + 1) * 3.5) % 2 === 1;
			set(scene, x, y, tone(u, striped));
		}
	}
	// The valance, scalloped along its lower edge.
	const roofHalf = Math.round((eaves - 1 - peak) * 0.85) + 1;
	for (let x = cx - roofHalf; x <= cx + roofHalf; x++) {
		const u = (x - cx) / roofHalf;
		set(scene, x, eaves, tone(u, true));
		if ((x - cx + 100) % 3 !== 0) {
			set(scene, x, eaves + 1, tone(u, true));
		}
	}
	// The wall, in upright stripes.
	const wallHalf = roofHalf - 2;
	for (let y = eaves + 1; y <= base; y++) {
		for (let x = cx - wallHalf; x <= cx + wallHalf; x++) {
			if (y === eaves + 1 && (x - cx + 100) % 3 !== 0) {
				continue;
			}
			const u = (x - cx) / wallHalf;
			const striped = Math.floor((x - cx + 100) / 2) % 2 === 0;
			set(scene, x, y, tone(u, striped));
		}
	}
	// The open door, turned towards the fire, glowing inside.
	const door = cx + fireSide * 3;
	for (let y = eaves + 4; y <= base; y++) {
		const half = Math.floor((y - eaves - 4) / 3);
		for (let x = door - half; x <= door + half; x++) {
			const inner = Math.abs(x - door) < half && y > eaves + 8;
			set(scene, x, y, inner ? C.gold : C.amber);
		}
		set(scene, door - half - 1, y, C.wood);
		set(scene, door + half + 1, y, C.wood);
	}
}

/**
 * The campfire's crossed logs and a ring of stones.
 * @param {Canvas} scene
 */
function drawLogs(scene) {
	for (let i = -6; i <= 6; i++) {
		const dy = Math.round(i * 0.25);
		set(scene, CX + i, FIRE_Y - dy, i < 0 ? C.timber : C.timberShade);
		set(scene, CX + i, FIRE_Y + 1 - dy, C.wood);
		set(scene, CX + i, FIRE_Y + dy, i > 0 ? C.timber : C.timberLight);
		set(scene, CX + i, FIRE_Y + 1 + dy, C.wood);
	}
	for (const x of [CX - 8, CX - 5, CX + 4, CX + 7]) {
		set(scene, x, FIRE_Y + 3, C.stone);
		set(scene, x + 1, FIRE_Y + 3, C.stoneShade);
		set(scene, x, FIRE_Y + 2, C.stoneLight);
	}
}

/**
 * The flames: a tall tongue of fire with a white-hot core, drawn over the logs without an outline.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	const rows = [
		'.....r.....',
		'....ra.....',
		'....rar....',
		'...raar.r..',
		'...rago.ar.',
		'..ragogar..',
		'..agoyoga..',
		'.raoyyyoar.',
		'.rgoyyyogr.',
		'rago yyogar',
		'.agoyyyoga.',
		'..ggoyogg..',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		r: C.brickRedLight,
		a: C.amber,
		g: C.gold,
		o: C.beamLight,
		y: C.lampGlow,
		' ': C.lampGlow,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, CX - 5 + i, FIRE_Y - 11 + j, colours[key]);
			}
		});
	});
}

/**
 * Sparks rising from the fire towards the crossed banners.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 7; i++) {
		const y = FIRE_Y - 14 - Math.floor(random() * 12);
		const x = CX - 4 + Math.floor(random() * 9);
		set(scene, x, y, i % 2 ? C.gold : C.beamLight);
	}
}
