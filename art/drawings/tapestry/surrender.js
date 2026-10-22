// Surrender: a white flag raised over a broken, battered rampart at dusk, swords laid down in a row before it.
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

/** The wall walk's row, the ground's first row and the flagpole's column. */
const WALK = 30;
const GROUND = 50;
const POLE = 16;

/** Stone warmed by the low sun behind the viewer. */
const STONE_LIT = mix(C.stoneLight, C.duskSky6, 0.25);
const STONE = mix(C.stone, C.duskSky5, 0.2);
const STONE_MID = mix(C.stoneMid, C.duskSky4, 0.2);
const STONE_SHADE = mix(C.stoneShade, C.duskSky2, 0.3);

/** The flag's cloth: lit, plain and in the folds. */
const CLOTH_LIT = C.white;
const CLOTH = C.creamLight;
const CLOTH_FOLD = mix(C.creamShade, C.duskSky5, 0.25);

/**
 * Draws the Surrender scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(143);

	// The sky faces away from the sunset, so only its purple upper bands show above the wall.
	drawSky(layer, { time: 'dusk', horizon: 70, random });
	drawSmoke(layer);
	drawGround(layer, random);

	drawRampart(scene, random);
	drawGate(scene);
	drawFlag(scene);
	drawSwords(scene);
	drawHelmet(scene);
	drawShield(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawArrows(scene);
	return scene;
}

/**
 * A thin column of smoke rising from behind the breach, the air too still to scatter it.
 * @param {Canvas} layer
 */
function drawSmoke(layer) {
	for (let y = WALK + 10; y >= 3; y--) {
		const x = 47 + Math.round(Math.sin(y * 0.18) * 2 - (WALK - y) * 0.08);
		const width = y < 12 ? 4 : y < 24 ? 3 : 2;
		for (let i = 0; i < width; i++) {
			const behind = get(layer, x + i, y);
			if (behind) {
				set(
					layer,
					x + i,
					y,
					mix(behind, C.stoneLight, i === 0 ? 0.3 : 0.18)
				);
			}
		}
	}
}

/**
 * Trampled earth in front of the wall, lit by the low sun, with tufts of grass.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const earth = mix(C.timberLight, C.duskSky5, 0.2);
	const earthShade = mix(C.timber, C.duskSky2, 0.25);
	const grass = mix(C.grassShade, C.duskSky4, 0.25);
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const t = (y - GROUND) / (64 - GROUND);
			let colour = earth;
			if (y === GROUND || y === GROUND + 1) {
				colour = earthShade;
			} else if (t > 0.6 && (x + y) % 2 === 0) {
				colour = earthShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = GROUND + 2 + Math.floor(random() * 12);
		set(layer, x, y, grass);
		set(layer, x + 1, y - 1, grass);
	}
}

/**
 * Paints one pixel of the wall face: courses of blocks with staggered joints, each block a little lighter or darker than the next.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 */
function masonry(canvas, x, y) {
	const course = Math.floor((y - WALK) / 4);
	const offset = (course % 2) * 4;
	const block = Math.floor((x + offset) / 8);
	const joint = (x + offset) % 8 === 0;
	const tone = (block * 7 + course * 3) % 5;
	let colour = tone === 0 ? STONE_MID : tone === 3 ? STONE_LIT : STONE;
	if ((y - WALK) % 4 === 3 || joint) {
		colour = STONE_SHADE;
	} else if ((y - WALK) % 4 === 0 && tone !== 0) {
		colour = STONE_LIT;
	}
	set(canvas, x, y, colour);
}

/**
 * The rampart: a curtain wall across the scene, its merlons chipped and a breach torn through it on the right, with cracks and scorch marks.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawRampart(scene, random) {
	// The breach's floor at each column: the wall stands full height outside it.
	/**
	 * @param {number} x
	 * @returns {number} The wall's top row at this column.
	 */
	const top = (x) => {
		if (x >= 39 && x <= 55) {
			const depth = 11 - Math.abs(x - 47) * 1.3;
			return WALK + Math.max(0, Math.round(depth)) + ((x * 5) % 3);
		}
		return WALK;
	};
	for (let x = 0; x < 64; x++) {
		for (let y = top(x); y < GROUND + 1; y++) {
			masonry(scene, x, y);
		}
		// The broken edge of the breach shows raw, lit stone.
		if (top(x) > WALK) {
			set(scene, x, top(x), STONE_LIT);
		}
	}
	// The coping along the wall walk.
	for (let x = 0; x < 64; x++) {
		if (top(x) === WALK) {
			set(scene, x, WALK, STONE_LIT);
			set(scene, x, WALK + 1, STONE_SHADE);
		}
	}
	// Merlons: some whole, some chipped, the ones over the breach gone.
	for (const [x, height] of [
		[0, 5],
		[8, 5],
		[16, 3],
		[24, 5],
		[32, 4],
		[58, 2],
	]) {
		for (let i = 0; i < 5; i++) {
			const chip = height < 5 && i >= 3 ? 1 : 0;
			for (let j = 1; j <= height - chip; j++) {
				const colour =
					i === 0 ? STONE_LIT : i === 4 ? STONE_SHADE : STONE;
				set(scene, x + i, WALK - j, colour);
			}
		}
	}
	// Cracks running down from the breach and under the merlons.
	for (const [x0, y0, length] of [
		[37, 33, 9],
		[14, 32, 7],
		[57, 34, 8],
	]) {
		let x = x0;
		for (let y = y0; y < y0 + length; y++) {
			set(scene, x, y, STONE_SHADE);
			x += random() > 0.5 ? 1 : -1;
		}
	}
	// Scorch marks around the breach.
	for (let y = WALK + 4; y < GROUND; y++) {
		for (let x = 34; x < 60; x++) {
			const d = Math.hypot((x - 47) / 1.6, y - (WALK + 10));
			const behind = get(scene, x, y);
			if (behind && d < 9) {
				set(scene, x, y, mix(behind, C.wood, d < 5 ? 0.4 : 0.2));
			}
		}
	}
	// Fallen blocks at the foot of the breach.
	for (const [x, y, w] of [
		[40, 49, 3],
		[45, 50, 4],
		[51, 49, 2],
		[34, 50, 2],
		[54, 50, 3],
	]) {
		rect(scene, x, y, w, 1, STONE_LIT);
		rect(scene, x, y + 1, w, 1, STONE_SHADE);
	}
}

/**
 * An arched gateway under the flag, its doors swung open into the dark passage.
 * @param {Canvas} scene
 */
function drawGate(scene) {
	const left = 9;
	const right = 23;
	const spring = 41;
	const cx = (left + right) / 2;
	const radius = (right - left) / 2;
	for (let y = spring - radius; y <= GROUND; y++) {
		for (let x = left; x <= right; x++) {
			const inArch =
				y >= spring || Math.hypot(x - cx, y - spring) <= radius + 0.3;
			if (!inArch) {
				continue;
			}
			const rim =
				y >= spring
					? x === left || x === right
					: Math.hypot(x - cx, y - spring) > radius - 0.8;
			let colour = mix(C.roofShade, C.ink, 0.3);
			if (rim) {
				colour = STONE_LIT;
			} else if (x <= left + 2 || x >= right - 2) {
				// The open doors, folded back against the passage walls.
				colour = (y + x) % 3 === 0 ? C.timberShade : C.wood;
			} else if (y >= GROUND - 2) {
				colour = mix(C.roof, C.duskSky5, 0.3);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The flagpole planted on the wall walk and the white flag lifting on a faint breeze, rippling in soft folds.
 * @param {Canvas} scene
 */
function drawFlag(scene) {
	// The pole stands on the wall walk, behind the merlon.
	for (let y = 3; y < WALK - 3; y++) {
		set(scene, POLE, y, y % 5 === 0 ? C.timber : C.timberLight);
		set(scene, POLE + 1, y, C.timber);
	}
	set(scene, POLE, 2, C.gold);
	set(scene, POLE + 1, 2, C.amber);
	set(scene, POLE, 1, C.lampGlow);
	const reach = 21;
	const length = 13;
	for (let i = 2; i < reach + 2; i++) {
		const wave = Math.round(Math.sin(i * 0.45) * 1.1 + i * 0.12);
		const fold = Math.sin(i * 0.45 + 1.2);
		for (let j = 0; j < length; j++) {
			// The fly end is ragged where the cloth was torn.
			const ragged = i >= reach && (j * 3 + i) % 4 === 0;
			if (ragged) {
				continue;
			}
			let colour = CLOTH;
			if (fold < -0.45) {
				colour = CLOTH_FOLD;
			} else if (fold > 0.55 || j === 0) {
				colour = CLOTH_LIT;
			}
			set(scene, POLE + i, 4 + j + wave, colour);
		}
	}
	// The cloth's ties at the pole.
	set(scene, POLE + 2, 4, C.creamShade);
	set(scene, POLE + 2, 16, C.creamShade);
}

/**
 * Three swords laid side by side on the ground, points to the left, hilts to the right.
 * @param {Canvas} scene
 */
function drawSwords(scene) {
	const rows = [
		'...................ga......',
		'..LLWLLLLLLLLLLLLLLgarrrrgg',
		'LLsssssssssssssssssgaRRRRga',
		'...................ga......',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		L: C.stoneLight,
		W: C.white,
		s: C.stone,
		g: C.gold,
		a: C.amber,
		r: C.brickRed,
		R: C.brickRedShade,
	};
	paint(scene, 17, 52, rows, colours);
	paint(scene, 20, 56, rows, colours);
	paint(scene, 15, 60, rows, colours);
}

/**
 * A broad-brimmed kettle helmet set down on the left.
 * @param {Canvas} scene
 */
function drawHelmet(scene) {
	paint(
		scene,
		2,
		53,
		['...LLLL...', '..LWssss..', '..LssssS..', 'LLLLLLLLSS', '.ggggggga.'],
		{
			L: C.stoneLight,
			W: C.white,
			s: C.stone,
			S: C.stoneShade,
			g: C.brass,
			a: C.lampFrame,
		}
	);
}

/**
 * A round shield set down leaning against the wall on the right: a red field, a gold rim and a boss.
 * @param {Canvas} scene
 */
function drawShield(scene) {
	paint(
		scene,
		49,
		41,
		[
			'...gggg...',
			'.ggrrrRgg.',
			'.grrrrrRg.',
			'grrrGgrRRa',
			'grrrgaRRRa',
			'grrrrRRRRa',
			'.grrRRRRa.',
			'.gaRRRRaa.',
			'...aaaa...',
		],
		{
			g: C.gold,
			a: C.amber,
			r: C.brickRed,
			R: C.brickRedShade,
			G: C.lampGlow,
		}
	);
}

/**
 * A few spent arrows stuck in the wall face, their white fletching catching the light.
 * @param {Canvas} scene
 */
function drawArrows(scene) {
	for (const [x, y] of [
		[6, 39],
		[29, 43],
		[60, 40],
	]) {
		line(scene, x, y, x - 3, y + 2, C.timberShade);
		set(scene, x - 3, y + 2, C.white);
		set(scene, x - 4, y + 2, C.white);
		set(scene, x - 3, y + 3, C.cream);
	}
}
