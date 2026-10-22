// Alien Disclosure: a flying saucer hovering over a farm field at night, its green beam lifting a cow while farmers watch from the barn.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, and the field's vanishing point. */
const HORIZON = 39;
const VANISH = { x: 40, y: 26 };

/** The saucer's centre and the half-width and half-height of its disc. */
const SAUCER = { x: 40, y: 14, rx: 18, ry: 4 };

/** The beam: its first row, the row where it meets the field, and its half-width at each end. */
const BEAM = { top: SAUCER.y + 4, bottom: 57, from: 6, to: 15 };

/** The field's crops at night, lit and dark, and the furrows between them. */
const FIELD = {
	ridge: mix(C.grass, C.nightSky4, 0.5),
	crop: mix(C.grassShade, C.nightSky3, 0.5),
	furrow: mix(C.forestFloorShade, C.ink, 0.5),
};

/** The barn's red, darkened by the night, and its moonlit trim. */
const BARN = {
	light: mix(C.brickRed, C.nightSky5, 0.3),
	main: mix(C.brickRed, C.nightSky3, 0.45),
	shade: mix(C.brickRedShade, C.nightSky2, 0.4),
	trim: mix(C.cream, C.nightSky6, 0.3),
	roof: mix(C.stoneShade, C.nightSky3, 0.4),
	roofLight: mix(C.stone, C.nightSky5, 0.35),
};

/**
 * Draws the Alien Disclosure scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1907);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 44,
		starRows: 30,
		sparkles: [
			[6, 6],
			[60, 27],
		],
	});
	drawTreeline(layer);
	drawField(layer);
	drawBeam(layer);
	drawPool(layer);
	glow(layer, {
		x: SAUCER.x,
		y: SAUCER.y + 3,
		radius: 14,
		colour: C.ghost,
		strength: 0.3,
	});

	drawBarn(scene);
	drawSaucer(scene);
	drawPilot(scene);
	drawCow(scene);
	drawFigure(scene, { x: 3, y: 61, clothes: BARN.roof });
	drawFigure(scene, { x: 9, y: 62, clothes: C.timberShade });
	drawFigure(scene, { x: 15, y: 60, clothes: C.roof });
	// The nearest farmer points up at the saucer.
	set(scene, 20, 55, C.skin);
	set(scene, 20, 54, C.skin);
	set(scene, 21, 53, C.skin);
	drawFence(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawSaucerLights(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * A dark line of trees along the far edge of the field, its tops catching the saucer's light.
 * @param {Canvas} layer
 */
function drawTreeline(layer) {
	const dark = mix(C.pineShade, C.nightSky2, 0.55);
	const lit = mix(C.pine, C.ghostShade, 0.35);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON - 3 - Math.abs(Math.sin(x * 0.55)) * 2 - Math.sin(x * 0.17)
		);
		for (let y = top; y <= HORIZON; y++) {
			const near = Math.abs(x - SAUCER.x) < 20 && y === top;
			set(layer, x, y, near ? lit : dark);
		}
	}
}

/**
 * The ploughed field: rows of crops running towards the vanishing point, darker near the viewer.
 * @param {Canvas} layer
 */
function drawField(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const u = ((x - VANISH.x) / (y - VANISH.y)) * 3.2;
			const f = u - Math.floor(u);
			let colour = FIELD.crop;
			if (f > 0.62) {
				colour = FIELD.furrow;
			} else if (f < 0.2) {
				colour = FIELD.ridge;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The beam: a cone of pale green light from the saucer's belly to the field, brightest at its core.
 * @param {Canvas} layer
 */
function drawBeam(layer) {
	for (let y = BEAM.top; y <= BEAM.bottom; y++) {
		const t = (y - BEAM.top) / (BEAM.bottom - BEAM.top);
		const half = BEAM.from + (BEAM.to - BEAM.from) * t;
		for (let x = Math.floor(SAUCER.x - half); x <= SAUCER.x + half; x++) {
			const off = Math.abs(x - SAUCER.x) / half;
			if (off > 1) {
				continue;
			}
			const behind = /** @type {Colour} */ (get(layer, x, y));
			const strength = off > 0.85 ? 0.45 : off > 0.5 ? 0.62 : 0.78;
			set(layer, x, y, mix(behind, C.ghostLight, strength));
		}
	}
}

/**
 * The pool of light where the beam meets the field, and the light spilling across the crops around it.
 * @param {Canvas} layer
 */
function drawPool(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot((x - SAUCER.x) / 22, (y - BEAM.bottom) / 6);
			if (d >= 1) {
				continue;
			}
			const behind = /** @type {Colour} */ (get(layer, x, y));
			const strength = d < 0.55 ? 0.65 : 0.3;
			set(layer, x, y, mix(behind, C.ghostLight, strength));
		}
	}
}

/**
 * The red barn on the left: a gambrel roof, a hayloft with a lit lamp and big doors with white cross-bracing.
 * @param {Canvas} scene
 */
function drawBarn(scene) {
	const left = 0;
	const right = 21;
	const base = 50;
	const eaves = 36;
	for (let y = eaves; y <= base; y++) {
		for (let x = left; x <= right; x++) {
			let colour = BARN.main;
			if (x >= right - 1) {
				// The side facing the saucer, lit green.
				colour = mix(BARN.light, C.ghost, 0.35);
			} else if (x % 3 === 0) {
				colour = BARN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The gable under a gambrel roof: steep lower slopes, then a shallow upper pitch, edged with dark shingles.
	const mid = (left + right) / 2;
	for (let y = 22; y < eaves; y++) {
		const down = y - 22;
		const half = down < 6 ? 4 + down * 1.2 : 11.2 + (down - 6) * 0.15;
		for (let x = Math.ceil(mid - half); x <= Math.floor(mid + half); x++) {
			const edge = y === 22 || x <= mid - half + 1 || x >= mid + half - 1;
			let colour = x % 3 === 0 ? BARN.shade : BARN.main;
			if (edge) {
				colour =
					x > mid ? mix(BARN.roofLight, C.ghost, 0.3) : BARN.roof;
			}
			set(scene, x, y, colour);
		}
	}
	// The white trim under the eaves.
	for (let x = left; x <= right; x++) {
		set(scene, x, eaves, BARN.trim);
	}
	// The hayloft door with a lamp glowing inside.
	const loft = Math.floor(mid) - 1;
	rect(scene, loft, 27, 4, 6, BARN.trim);
	rect(scene, loft + 1, 28, 2, 4, C.gold);
	set(scene, loft + 1, 28, C.lampGlow);
	// The big doors: the left one shut, the right one open on the lamplit inside.
	const door = { x: 4, y: 40, w: 14, h: 11 };
	rect(scene, door.x, door.y, door.w, door.h, BARN.trim);
	rect(scene, door.x + 1, door.y + 1, 6, door.h - 1, BARN.shade);
	for (let x = door.x + 2; x < door.x + 7; x += 2) {
		rect(scene, x, door.y + 1, 1, door.h - 1, BARN.main);
	}
	rect(scene, door.x + 8, door.y + 1, 5, door.h - 1, C.amber);
	rect(scene, door.x + 9, door.y + 2, 3, door.h - 2, C.gold);
	rect(scene, door.x + 10, door.y + 4, 1, door.h - 4, C.lampGlow);
}

/**
 * A split-rail fence across the near corner of the field, dark against the pool of light.
 * @param {Canvas} scene
 */
function drawFence(scene) {
	for (const x of [51, 57, 63]) {
		rect(scene, x, 54, 1, 8, C.timberShade);
		set(scene, x, 54, C.timber);
	}
	for (const y of [56, 59]) {
		rect(scene, 51, y, 13, 1, C.timber);
	}
}

/**
 * The saucer: a silver disc with a glass dome on top and a glowing emitter underneath.
 * @param {Canvas} scene
 */
function drawSaucer(scene) {
	const { x: cx, y: cy, rx, ry } = SAUCER;
	// The dome, glass lit from the beam's own glow.
	for (let y = cy - 9; y < cy - 1; y++) {
		for (let x = cx - 8; x <= cx + 8; x++) {
			const d = ((x - cx) / 7.5) ** 2 + ((y - cy + 2) / 7) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = C.teal;
			if (x - cx > 3) {
				colour = C.tealShade;
			} else if (d < 0.45 && x < cx) {
				colour = C.tealLight;
			}
			set(scene, x, y, colour);
		}
	}
	// The disc.
	for (let y = cy - ry; y <= cy + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const d =
				((x - cx) / (rx + 0.5)) ** 2 + ((y - cy) / (ry + 0.5)) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = C.stone;
			if (y < cy - 1) {
				colour = x - cx > rx * 0.5 ? C.stoneLight : C.white;
			} else if (y === cy - 1) {
				colour = C.stoneLight;
			} else if (y === cy) {
				colour = C.stoneMid;
			} else if (y > cy + 1) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The emitter on the belly.
	rect(scene, cx - 5, cy + ry + 1, 11, 1, C.ghost);
	rect(scene, cx - 3, cy + ry + 1, 7, 1, C.ghostLight);
}

/**
 * The pilot: a big-eyed silhouette behind the dome's glass.
 * @param {Canvas} scene
 */
function drawPilot(scene) {
	paint(
		scene,
		SAUCER.x - 2,
		SAUCER.y - 8,
		['.ggg.', 'gkgkg', '.ggg.', '..g..', 'ggggg'],
		{ g: C.ghostShade, k: C.ink }
	);
}

/**
 * The lights around the saucer's rim and its glowing belly, painted after the outline pass.
 * @param {Canvas} scene
 */
function drawSaucerLights(scene) {
	for (let x = SAUCER.x - 15; x <= SAUCER.x + 15; x += 5) {
		set(scene, x, SAUCER.y, x % 2 ? C.gold : C.lampGlow);
		set(scene, x + 1, SAUCER.y, C.amber);
	}
	rect(scene, SAUCER.x - 4, SAUCER.y + SAUCER.ry + 2, 9, 1, C.ghostLight);
}

/**
 * A spotted cow floating up the beam, legs dangling.
 * @param {Canvas} scene
 */
function drawCow(scene) {
	paint(
		scene,
		34,
		30,
		[
			'c.c.........',
			'wwww.......t',
			'wkwwwwkkwwwt',
			'wwwwwkkwwkw.',
			'nnwwwwwwkkw.',
			'..wwwwwwwww.',
			'..l.l...l.l.',
			'..l.l...l.l.',
		],
		{
			w: C.creamLight,
			k: C.wood,
			c: C.creamShade,
			n: C.skin,
			t: C.wood,
			l: C.creamShade,
		}
	);
}

/**
 * Motes of light drifting up the beam.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 12; i++) {
		const y =
			BEAM.top + 4 + Math.floor(random() * (BEAM.bottom - BEAM.top - 6));
		const t = (y - BEAM.top) / (BEAM.bottom - BEAM.top);
		const half = BEAM.from + (BEAM.to - BEAM.from) * t - 2;
		const x = Math.round(SAUCER.x - half + random() * half * 2);
		const behind = get(scene, x, y);
		if (behind !== C.ink && behind !== C.creamLight) {
			set(scene, x, y, C.white);
		}
	}
}
