// Warships: a grey steel battleship at sea by day, its forward guns firing, gun smoke and shell splashes around it.
import {
	createCanvas,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSea } from '../../parts/sea.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon: the last sky row. The sea's bright line is the row below. */
const HORIZON = 33;

/** The hull: its stern and bow columns, the deck edge at each end, and the waterline. */
const HULL = { stern: 3, bow: 61, sternDeck: 40, bowDeck: 36, water: 49 };

/** The two forward guns' muzzles, where the flashes burst. */
const MUZZLES = [
	{ x: 61, y: 29 },
	{ x: 54, y: 24 },
];

/** Battleship grey: the lit top and left faces, the plates, and the shaded underside. */
const STEEL_LIGHT = mix(C.stoneLight, C.daySky6, 0.2);
const STEEL = mix(C.stone, C.daySky1, 0.12);
const STEEL_SHADE = mix(C.stoneShade, C.daySky1, 0.12);

/** Soot on the funnel cap, the dark band at the waterline, and the windows. */
const SOOT = mix(C.stoneShade, C.ink, 0.55);

/** Gun smoke: thick, pale and warm, shaded underneath. */
const GUNSMOKE = mix(C.creamShade, C.stoneLight, 0.4);
const GUNSMOKE_SHADE = mix(C.stone, C.creamShade, 0.3);

/**
 * Draws the Warships tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4219);

	drawDaySky(layer);
	drawSea(layer, { time: 'day', top: HORIZON + 1, random, waves: 28 });
	drawSmoke(layer, { x: 19, y: 19, tone: 'smoke', puffs: 4, drift: -1 });
	drawGunSmoke(layer);

	drawHull(scene);
	drawSuperstructure(scene);
	drawTurrets(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawMast(scene);
	drawWake(scene, random);
	drawSplash(scene, random, 9, 60, 17);
	drawSplash(scene, random, 54, 61, 7);
	for (const muzzle of MUZZLES) {
		glow(scene, {
			x: muzzle.x,
			y: muzzle.y,
			radius: 6,
			colour: C.gold,
			strength: 0.3,
			steps: 2,
			skip: [C.ink],
		});
	}
	for (const muzzle of MUZZLES) {
		drawFlash(scene, muzzle.x, muzzle.y);
	}
	return scene;
}

/**
 * A clear day sky, deep blue overhead and pale at the horizon, with no clouds: the smoke is the weather.
 * @param {Canvas} layer
 */
function drawDaySky(layer) {
	const ramp = [
		C.daySky1,
		C.daySky2,
		C.daySky3,
		C.daySky4,
		C.daySky5,
		C.daySky6,
	];
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) * (ramp.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < ramp.length && t - i > 0.7 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? ramp[i + 1] : ramp[i]);
		}
	}
}

/**
 * The deck edge's row at a column: the sheer rises gently towards the bow.
 * @param {number} x
 * @returns {number}
 */
function deckAt(x) {
	const t = (x - HULL.stern) / (HULL.bow - HULL.stern);
	return Math.round(HULL.sternDeck + (HULL.bowDeck - HULL.sternDeck) * t);
}

/**
 * The hull: grey plates lit along the deck edge, a raked bow, a row of portholes and the dark band at the waterline.
 * @param {Canvas} scene
 */
function drawHull(scene) {
	for (let x = HULL.stern; x <= HULL.bow; x++) {
		const top = deckAt(x);
		for (let y = top; y <= HULL.water; y++) {
			const stem = HULL.bow - Math.floor((y - HULL.bowDeck) / 2);
			const stern = HULL.stern + Math.floor((y - top) / 4);
			if (x > stem || x < stern) {
				continue;
			}
			let colour = STEEL;
			if (y === top) {
				colour = STEEL_LIGHT;
			} else if (y >= HULL.water - 1) {
				colour = SOOT;
			} else if (y >= HULL.water - 4) {
				colour = STEEL_SHADE;
			}
			set(scene, x, y, colour);
		}
		if (x % 4 === 1 && x > HULL.stern + 3 && x < HULL.bow - 6) {
			set(scene, x, top + 3, SOOT);
		}
	}
	// The anchor in its hawse on the bow.
	rect(scene, 55, 40, 2, 2, SOOT);
}

/**
 * Lights a block: its top row and left column lit, its bottom row shaded.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function block(scene, x, y, w, h) {
	rect(scene, x, y, w, h, STEEL);
	rect(scene, x, y, w, 1, STEEL_LIGHT);
	rect(scene, x, y, 1, h, STEEL_LIGHT);
	rect(scene, x, y + h - 1, w, 1, STEEL_SHADE);
}

/**
 * The deckhouse, the funnel with its sooty cap, the bridge tower with its windows, and the mast with its lookout top.
 * @param {Canvas} scene
 */
function drawSuperstructure(scene) {
	block(scene, 17, 33, 20, 6);
	// The funnel, raked back a little.
	for (let y = 20; y <= 33; y++) {
		const x = 17 - Math.floor((33 - y) / 7);
		rect(scene, x, y, 5, 1, STEEL);
		set(scene, x, y, STEEL_LIGHT);
		set(scene, x + 4, y, STEEL_SHADE);
		if (y <= 21) {
			rect(scene, x, y, 5, 1, SOOT);
		}
	}
	// The bridge tower, stepped.
	block(scene, 25, 27, 10, 6);
	block(scene, 27, 22, 7, 5);
	rect(scene, 28, 24, 5, 1, SOOT);
	rect(scene, 26, 29, 8, 1, SOOT);
	// The lookout top; drawMast adds the tripod under it.
	block(scene, 28, 9, 5, 4);
}

/**
 * The tripod mast, thin against the sky, painted over the outline: a pole and two raked legs under the lookout top.
 * @param {Canvas} scene
 */
function drawMast(scene) {
	rect(scene, 30, 3, 1, 6, STEEL_SHADE);
	rect(scene, 30, 13, 1, 9, STEEL_SHADE);
	line(scene, 27, 21, 29, 13, STEEL_SHADE);
	line(scene, 33, 21, 31, 13, STEEL_SHADE);
}

/**
 * The three turrets: two forward, one raised over the other and both firing, and one aft trained astern.
 * @param {Canvas} scene
 */
function drawTurrets(scene) {
	// Turret A on the foredeck.
	rect(scene, 45, 35, 7, 2, STEEL_SHADE);
	block(scene, 44, 32, 9, 3);
	rect(scene, 45, 31, 6, 1, STEEL_LIGHT);
	line(scene, 53, 32, 60, 29, STEEL);
	line(scene, 53, 33, 60, 30, STEEL_SHADE);
	// Turret B, raised on its barbette behind and above A.
	block(scene, 38, 31, 6, 6);
	block(scene, 37, 27, 9, 4);
	rect(scene, 38, 26, 6, 1, STEEL_LIGHT);
	line(scene, 46, 27, 53, 24, STEEL);
	line(scene, 46, 28, 53, 25, STEEL_SHADE);
	// Turret C on the quarterdeck, trained astern.
	rect(scene, 9, 37, 7, 2, STEEL_SHADE);
	block(scene, 8, 33, 9, 4);
	rect(scene, 10, 32, 6, 1, STEEL_LIGHT);
	line(scene, 7, 34, 1, 31, STEEL);
	line(scene, 7, 35, 1, 32, STEEL_SHADE);
}

/**
 * A round puff of smoke, lit on its upper left.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {{ light: Colour, base: Colour, shade: Colour }} tones
 */
function puff(canvas, cx, cy, r, tones) {
	const reach = Math.ceil(r);
	for (let y = cy - reach; y <= cy + reach; y++) {
		for (let x = cx - reach; x <= cx + reach; x++) {
			const dx = x - cx;
			const dy = y - cy;
			if (dx * dx + dy * dy > r * r + 0.5) {
				continue;
			}
			const facing = -(dx + dy) / r;
			set(
				canvas,
				x,
				y,
				facing > 0.5
					? tones.light
					: facing < -0.6
						? tones.shade
						: tones.base
			);
		}
	}
}

/**
 * The gun smoke billowing ahead of the forward turrets, on the background so it stays soft.
 * @param {Canvas} layer
 */
function drawGunSmoke(layer) {
	const tones = {
		light: C.cloudShade,
		base: GUNSMOKE,
		shade: GUNSMOKE_SHADE,
	};
	for (const [x, y, r] of [
		[60, 18, 3.5],
		[56, 20, 4],
		[62, 24, 4],
		[59, 26, 3],
		[63, 31, 3],
	]) {
		puff(layer, x, y, r, tones);
	}
}

/**
 * A muzzle flash: a white-hot core in a gold burst, flaring forward along the barrel, painted over everything.
 * @param {Canvas} scene
 * @param {number} mx
 * @param {number} my
 */
function drawFlash(scene, mx, my) {
	for (let y = my - 3; y <= my + 3; y++) {
		for (let x = mx - 1; x <= mx + 6; x++) {
			// Tilted with the barrels, which rise about one row in every two columns.
			const along = x - mx - 1.5;
			const across = y - my + along * 0.4;
			const e = (along / 3.6) ** 2 + (across / 1.8) ** 2;
			if (e < 0.25) {
				set(scene, x, y, C.white);
			} else if (e < 0.6) {
				set(scene, x, y, C.lampGlow);
			} else if (e < 1) {
				set(scene, x, y, C.gold);
			}
		}
	}
	for (const [dx, dy] of [
		[0, -2],
		[1, 2],
		[6, -4],
		[5, 1],
	]) {
		set(scene, mx + dx, my + dy, C.amber);
	}
}

/**
 * A shell splash: a column of white water widening as it rises, a ragged crown of spray and foam at its foot.
 * Painted over the outline, so the water stays soft.
 * @param {Canvas} scene
 * @param {() => number} random
 * @param {number} cx - The column's centre
 * @param {number} base - The row its foot stands on
 * @param {number} height - How tall it rises
 */
function drawSplash(scene, random, cx, base, height) {
	for (let h = 0; h <= height; h++) {
		const y = base - h;
		const half = 1 + Math.round((h / height) * (height / 6));
		const left = cx - half - (random() > 0.6 ? 1 : 0);
		const right = cx + half + (random() > 0.6 ? 1 : 0);
		for (let x = left; x <= right; x++) {
			set(scene, x, y, x > cx + half - 1 ? C.foam : C.white);
		}
	}
	// The crown: spray thrown up and out.
	const top = base - height;
	const reach = Math.round(height / 4) + 1;
	for (let i = 0; i < reach + 2; i++) {
		const dx = Math.round((random() * 2 - 1) * (reach + 1));
		const dy = 1 + Math.floor(random() * 3);
		set(scene, cx + dx, top - dy, random() > 0.4 ? C.white : C.foam);
	}
	// The foam ring at its foot.
	for (let x = cx - reach - 3; x <= cx + reach + 3; x++) {
		set(scene, x, base + 1, (x + base) % 3 === 0 ? C.dayWave : C.white);
		if (Math.abs(x - cx) < reach + 2) {
			set(scene, x, base, C.white);
		}
	}
}

/**
 * The bow wave and the wake along the waterline, painted over the outline.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawWake(scene, random) {
	for (let y = 44; y <= 50; y++) {
		const x = HULL.bow - Math.floor((y - HULL.bowDeck) / 2) + 1;
		set(scene, x, y, C.white);
		if (y > 46) {
			set(scene, x + 1, y, C.foam);
		}
	}
	for (let x = 14; x < 60; x++) {
		if (random() > 0.35) {
			set(scene, x, HULL.water + 1, x > 50 ? C.white : C.foam);
		}
	}
}
