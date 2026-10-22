// Moon Landing: a gold-foil lander on the grey moon, an astronaut by a planted flag, the Earth rising over the horizon.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, the lander's centre column and the footpads' row. */
const HORIZON = 37;
const CX = 41;
const FEET = 50;

/** The Earth's centre and radius. */
const EARTH = { x: 17, y: 30, r: 9 };

/** The moon's grey dust, lit from the left. */
const DUST = {
	light: mix(C.stoneLight, C.cream, 0.25),
	main: C.stoneLight,
	mid: C.stone,
	shade: C.stoneMid,
	deep: C.stoneShade,
	shadow: mix(C.stoneShade, C.ink, 0.55),
};

/**
 * Draws the Moon Landing scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(827);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON + 4,
		random,
		stars: 60,
		starRows: HORIZON,
	});
	blacken(layer);
	drawEarth(layer);
	drawGround(layer, random);
	drawShadow(layer);
	drawFootprints(layer);

	drawLegs(scene);
	drawDescentStage(scene);
	drawAscentStage(scene);
	drawFlag(scene);
	drawAstronaut(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawStars(scene);
	return scene;
}

/**
 * Turns the purple night sky into the black of space, keeping the stars.
 * @param {Canvas} layer
 */
function blacken(layer) {
	for (let y = 0; y <= HORIZON + 4; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = /** @type {Colour} */ (get(layer, x, y));
			if (colour !== C.white && colour !== C.starDim) {
				set(layer, x, y, mix(colour, C.ink, 0.55));
			}
		}
	}
}

/**
 * The Earth rising: blue seas, green and tan land and white cloud bands, lit from the left,
 * with a thin bright limb and its night side in shadow.
 * @param {Canvas} layer
 */
function drawEarth(layer) {
	const { x: ex, y: ey, r } = EARTH;
	for (let y = ey - r; y <= HORIZON; y++) {
		for (let x = ex - r; x <= ex + r; x++) {
			const dx = x - ex;
			const dy = y - ey;
			const d = Math.hypot(dx, dy);
			if (d > r + 0.3) {
				continue;
			}
			const land =
				Math.hypot((dx + 2) * 0.8, dy + 2) < 3.2 ||
				Math.hypot(dx + 1, (dy - 3) * 0.7) < 2.6 ||
				Math.hypot(dx - 4, dy + 5) < 1.8;
			const desert = land && dy < 0 && dx < -1;
			const cloud =
				Math.abs(dy + 5 - Math.round(Math.sin(dx * 0.6) * 1.2)) < 0.6 ||
				Math.abs(dy - 6 - Math.round(Math.sin(dx * 0.5 + 1))) < 0.6 ||
				Math.hypot(dx - 2, dy - 1) < 1.2;
			let colour = C.daySea1;
			if (land) {
				colour = desert ? C.sand : C.grass;
			}
			if (cloud) {
				colour = C.white;
			}
			const shade = dx - dy * 0.25;
			if (shade > 4) {
				colour = mix(colour, C.nightSky2, 0.78);
			} else if (shade > 2) {
				colour = mix(colour, C.nightSea3, 0.45);
			} else if (d > r - 1 && dx < 1) {
				colour = mix(colour, C.foam, 0.6);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The moon's surface: a softly rolling horizon and dust that darkens towards the viewer, scattered with craters and pebbles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	for (let x = 0; x < 64; x++) {
		const top =
			HORIZON +
			1 +
			Math.round(Math.sin(x * 0.15 + 1) * 1.2 + Math.sin(x * 0.4) * 0.5);
		for (let y = top; y < 64; y++) {
			const depth = (y - top) / (64 - top);
			let colour =
				depth < 0.15 ? DUST.light : depth < 0.5 ? DUST.main : DUST.mid;
			if (y === top) {
				colour = C.white;
			} else if (depth >= 0.42 && depth < 0.5 && (x + y) % 2 === 0) {
				colour = DUST.mid;
			}
			set(layer, x, y, colour);
		}
	}
	for (const [x, y, rx, ry] of [
		[52, 42, 5, 1.5],
		[9, 60, 8, 2.5],
		[30, 57, 4, 1.4],
		[58, 59, 6, 2],
		[24, 42, 3, 1],
	]) {
		drawCrater(layer, x, y, rx, ry);
	}
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 4 + Math.floor(random() * (63 - HORIZON - 4));
		set(layer, x, y, random() > 0.5 ? DUST.deep : DUST.light);
	}
}

/**
 * A crater seen low across the ground: a lit outer rim, the near wall in shadow and the far wall lit.
 * @param {Canvas} layer
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {number} rx - Half its width
 * @param {number} ry - Half its depth
 */
function drawCrater(layer, cx, cy, rx, ry) {
	for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
		for (
			let x = Math.floor(cx - rx - 1);
			x <= Math.ceil(cx + rx + 1);
			x++
		) {
			const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
			const rim = ((x - cx) / (rx + 1)) ** 2 + ((y - cy) / (ry + 1)) ** 2;
			if (d <= 1) {
				set(layer, x, y, x - cx < rx * 0.25 ? DUST.deep : DUST.shade);
			} else if (rim <= 1 && y >= cy) {
				set(layer, x, y, DUST.light);
			}
		}
	}
}

/**
 * The lander's long shadow thrown across the dust to the right.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	for (let y = FEET - 2; y <= FEET + 2; y++) {
		for (let x = CX; x < 64; x++) {
			const d = ((x - CX - 12) / 16) ** 2 + ((y - FEET) / 2.6) ** 2;
			if (d <= 1) {
				set(layer, x, y, DUST.shadow);
			}
		}
	}
}

/**
 * A trail of boot prints from the ladder to the flag.
 * @param {Canvas} layer
 */
function drawFootprints(layer) {
	for (let i = 0; i < 8; i++) {
		const x = CX - 6 - i * 3;
		const y = FEET + 3 + Math.round(Math.sin(i * 0.9) + i * 0.5);
		set(layer, x, y, DUST.deep);
		set(layer, x + 1, y + (i % 2), DUST.deep);
	}
}

/**
 * The four landing legs: two splayed to the sides, the front one with its ladder, each on a round footpad.
 * @param {Canvas} scene
 */
function drawLegs(scene) {
	for (const [x0, x1, foot] of [
		[CX - 9, CX - 17, CX - 19],
		[CX + 9, CX + 17, CX + 15],
	]) {
		line(scene, x0, 34, x1, FEET - 1, C.stoneLight);
		line(
			scene,
			x0 + Math.sign(x1 - x0),
			34,
			x1 + Math.sign(x1 - x0) * -1,
			FEET - 1,
			C.stone
		);
		line(
			scene,
			x0 - Math.sign(x1 - x0) * 2,
			37,
			x1,
			FEET - 4,
			C.stoneShade
		);
		rect(scene, foot, FEET, 5, 1, C.stoneLight);
		rect(scene, foot + 1, FEET + 1, 3, 1, C.stone);
	}
	// The front leg and its ladder.
	rect(scene, CX - 1, 38, 2, FEET - 38, C.stoneLight);
	for (let y = 40; y < FEET - 1; y += 2) {
		set(scene, CX - 2, y, C.stone);
		set(scene, CX + 1, y, C.stone);
	}
	rect(scene, CX - 3, FEET, 6, 1, C.stoneLight);
	rect(scene, CX - 2, FEET + 1, 4, 1, C.stone);
}

/**
 * The descent stage: an eight-sided box wrapped in crinkled gold foil, the engine bell under it.
 * @param {Canvas} scene
 */
function drawDescentStage(scene) {
	const left = CX - 10;
	const right = CX + 9;
	for (let y = 29; y <= 37; y++) {
		const inset = y === 29 || y === 37 ? 2 : y === 30 || y === 36 ? 1 : 0;
		for (let x = left + inset; x <= right - inset; x++) {
			let colour = C.gold;
			if (x <= left + inset + 1) {
				colour = C.lampGlow;
			} else if (x >= right - 4) {
				colour = C.amber;
			} else if ((x * 7 + Math.floor(y / 3) * 5) % 11 === 0) {
				colour = C.lampGlow;
			} else if ((x * 5 + Math.floor(y / 2) * 3) % 13 === 0) {
				colour = C.amber;
			}
			// The panel seams.
			if (x === CX - 4 || x === CX + 4) {
				colour = x > CX ? C.lampFrame : C.amber;
			}
			set(scene, x, y, colour);
		}
	}
	// The engine bell.
	paint(scene, CX - 3, 38, ['.ssss.', 'sSSSSs'], {
		s: C.stone,
		S: C.stoneShade,
	});
}

/**
 * The ascent stage, turned a little: a faceted grey cabin with one triangular window on its lit facet,
 * the docking hatch on top, thruster pods and a dish antenna.
 * @param {Canvas} scene
 */
function drawAscentStage(scene) {
	paint(
		scene,
		CX - 8,
		16,
		[
			'.....LLLmm......',
			'.....LLmmd......',
			'...LLLLLLhmmm...',
			'..LLLLLLLhmmmm..',
			'.LkkkkLLLhmmmmd.',
			'LLLkkkLLLhmmmmmd',
			'LLLLkkLLLhmmmmmd',
			'LLLLLkLLLhmmmmdd',
			'LLLLLLLLLhmmmmdd',
			'mLLLLLLLLhmmmmdd',
			'mmmmmmmmmhmmmddd',
			'.mmmmmmmmmmmddd.',
			'..dddddddddddd..',
		],
		{
			L: C.stoneLight,
			m: C.stone,
			d: C.stoneShade,
			k: mix(C.nightSea3, C.ink, 0.3),
			h: C.stoneMid,
		}
	);
	// Thruster pods on either side.
	for (const x of [CX - 11, CX + 9]) {
		paint(scene, x, 22, ['.s.', 'sss', '.s.'], { s: C.stoneMid });
	}
	// The dish antenna on its mast.
	line(scene, CX + 6, 18, CX + 9, 15, C.stone);
	paint(scene, CX + 8, 10, ['.LLL.', 'LLLLm', '.Lmm.', '..s..'], {
		L: C.white,
		m: C.stoneLight,
		s: C.stone,
	});
}

/**
 * The flag, held out stiff by its crossbar in the airless sky: thirteen stripes squeezed into seven and a blue canton.
 * @param {Canvas} scene
 */
function drawFlag(scene) {
	const pole = 6;
	const top = 39;
	rect(scene, pole, top, 1, 59 - top, C.stoneLight);
	rect(scene, pole, top, 12, 1, C.stoneLight);
	for (let j = 0; j < 7; j++) {
		for (let i = 1; i <= 11; i++) {
			const ripple = i >= 4 && i <= 6 ? 1 : 0;
			const stripe = j % 2 === 0 ? C.brickRed : C.white;
			set(scene, pole + i, top + 1 + j + ripple, stripe);
		}
	}
	for (let j = 0; j < 4; j++) {
		for (let i = 1; i <= 4; i++) {
			const ripple = i >= 4 ? 1 : 0;
			set(scene, pole + i, top + 1 + j + ripple, C.nightSea2);
		}
	}
	set(scene, pole + 2, top + 2, C.white);
	set(scene, pole + 3, top + 4, C.white);
	set(scene, pole + 1, top + 4, C.white);
}

/**
 * The astronaut, facing the flag: a white suit and helmet with a gold visor, a big life-support pack on the back,
 * standing by the flag it has just planted.
 * @param {Canvas} scene
 */
function drawAstronaut(scene) {
	paint(
		scene,
		20,
		46,
		[
			'..wwww...',
			'.wwwwwwp.',
			'wyggGwwpp',
			'wgGGGwwpp',
			'.wwwwwwpp',
			'..wwwwppp',
			'.wwcwwppp',
			'.wwwwwpp.',
			'..wwwww..',
			'..ww.ww..',
			'..ww.ww..',
			'.sss.sss.',
		],
		{
			w: C.white,
			c: C.brickRed,
			p: C.cloudShade,
			y: C.lampGlow,
			g: C.gold,
			G: C.amber,
			s: C.stoneShade,
		}
	);
}

/**
 * A few bright stars painted over everything else, so they stay sharp against the black.
 * @param {Canvas} scene
 */
function drawStars(scene) {
	for (const [x, y] of [
		[30, 4],
		[58, 10],
		[4, 8],
	]) {
		set(scene, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(scene, x + dx, y + dy, C.starDim);
		}
	}
}
