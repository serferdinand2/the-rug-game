// Aliens: a grey alien just down the ramp of its landed saucer, raising a long-fingered hand in greeting on a night world of crystals under a ringed planet.
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
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The head's centre column. */
const HEAD_X = 23;

/** The ground's first row. */
const GROUND = 45;

/** The saucer: the disc's centre and radii, and the glass dome's radii above it. */
const SAUCER = { x: 50, y: 22, rx: 25, ry: 4, domeX: 11, domeY: 10 };

/** The open hatch under the disc: its columns and rows. */
const HATCH = { left: 44, right: 55, top: 27, bottom: 29 };

/** The ringed planet in the sky between the alien and its saucer. */
const PLANET = { x: 44, y: 7, r: 5 };

/** Grey skin: lit pale teal by the hatch on its left, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.stoneLight, C.ghostLight, 0.5),
	lit: mix(C.stoneLight, C.teal, 0.2),
	base: mix(C.stone, C.ghostShade, 0.25),
	shade: mix(C.stoneShade, C.arcaneShade, 0.35),
	dark: mix(C.stoneShade, C.night, 0.45),
};

/** The close-fitting suit: lit, plain and shaded, with a silver collar ring. */
const SUIT = {
	lit: mix(C.tealShade, C.tealLight, 0.3),
	base: C.tealShade,
	shade: mix(C.tealShade, C.night, 0.4),
	dark: mix(C.tealShade, C.night, 0.65),
	silver: C.stoneLight,
};

/** The hatch's light, from its bright core out to its teal edge. */
const LIGHT = [C.white, C.ghostLight, C.tealLight];

/** Colours the glows leave alone: the alien, lit by hand, the hatch's light and the crystals. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(SUIT),
	...LIGHT,
	C.ink,
	C.arcaneLight,
	C.arcane,
	C.arcaneShade,
	C.teal,
	C.tealShade,
];

/**
 * Draws the Aliens portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(48223);

	drawSky(layer, {
		time: 'night',
		horizon: GROUND,
		random,
		stars: 40,
		starRows: 40,
		sparkles: [[30, 4]],
	});
	drawPlanet(layer);
	drawSpires(layer);
	drawGround(layer, random);
	drawRamp(layer);
	drawSaucer(layer);

	drawBody(scene);
	drawHead(scene);
	drawArms(scene);
	drawCrystals(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 49,
		y: 34,
		radius: 22,
		colour: C.ghostLight,
		strength: 0.35,
		steps: 4,
		skip: FIGURE,
	});
	glow(scene, {
		x: 58,
		y: 56,
		radius: 14,
		colour: C.tealLight,
		strength: 0.3,
		steps: 3,
		skip: FIGURE,
	});
	glow(scene, {
		x: 4,
		y: 56,
		radius: 14,
		colour: C.arcaneLight,
		strength: 0.3,
		steps: 3,
		skip: FIGURE,
	});
	return scene;
}

/**
 * A banded orange gas giant with a tilted pale ring, the ring's back half hidden behind the globe.
 * @param {Canvas} layer
 */
function drawPlanet(layer) {
	const { x: cx, y: cy, r } = PLANET;
	/**
	 * Paints the ring's far half (behind the globe) or its near half (in front).
	 * @param {boolean} near
	 */
	const paintRing = (near) => {
		for (let x = cx - 9; x <= cx + 9; x++) {
			const dx = x - cx;
			const lift = 2.2 * Math.sqrt(Math.max(0, 1 - (dx / 9) ** 2));
			const y = Math.round(cy - dx * 0.25 + (near ? lift : -lift));
			set(
				layer,
				x,
				y,
				near
					? mix(C.cream, C.arcaneLight, 0.3)
					: mix(C.creamShade, C.roof, 0.4)
			);
		}
	};
	paintRing(false);
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.3) {
				continue;
			}
			let colour = (y - cy + 9) % 3 === 0 ? C.duskSky5 : C.duskSky6;
			if (x - cx > 1 && d > r - 2) {
				colour = C.duskSky4;
			} else if (x - cx < -2 && d > r - 1.5) {
				colour = C.sandLight;
			}
			set(layer, x, y, colour);
		}
	}
	paintRing(true);
}

/**
 * Far crystal spires on the horizon, dark violet against the night.
 * @param {Canvas} layer
 */
function drawSpires(layer) {
	const spire = mix(C.arcaneShade, C.night, 0.45);
	const lit = mix(C.arcane, C.night, 0.5);
	for (const [x, h] of [
		[2, 7],
		[5, 11],
		[8, 5],
		[37, 6],
		[40, 10],
		[60, 8],
	]) {
		for (let y = GROUND - h; y < GROUND; y++) {
			const w = Math.floor((y - GROUND + h) / 3);
			for (let dx = -w; dx <= w; dx++) {
				set(layer, x + dx, y, dx < 0 ? lit : spire);
			}
		}
	}
}

/**
 * The alien world: dark violet rock with pale stones, deepening towards the viewer.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	for (let y = GROUND; y < 64; y++) {
		const near = (y - GROUND) / (64 - GROUND);
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.arcaneShade, C.night, 0.35 + near * 0.3);
			if (y === GROUND) {
				colour = mix(C.arcane, C.night, 0.45);
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 63);
		const y = GROUND + 2 + Math.floor(random() * (62 - GROUND));
		set(layer, x, y, mix(C.arcane, C.night, 0.4));
		set(layer, x + 1, y, mix(C.arcaneShade, C.night, 0.2));
	}
}

/**
 * The ramp let down from the hatch to the ground, its treads lit by the light pouring out.
 * @param {Canvas} layer
 */
function drawRamp(layer) {
	for (let y = HATCH.bottom; y <= GROUND + 2; y++) {
		const t = (y - HATCH.bottom) / (GROUND + 2 - HATCH.bottom);
		const left = Math.round(HATCH.left - t * 12);
		const right = Math.round(HATCH.right - t * 8);
		for (let x = left; x <= right; x++) {
			// Dark steel treads, their front edges lit by the hatch, between two solid side rails.
			let colour = mix(C.stoneShade, C.night, 0.2 + t * 0.25);
			if (x === left) {
				colour = C.stone;
			} else if (x === left + 1) {
				colour = C.stoneLight;
			} else if (x === right) {
				colour = mix(C.stoneShade, C.night, 0.3);
			} else if (x === right - 1) {
				colour = C.stoneShade;
			} else if ((y - HATCH.bottom) % 3 === 0) {
				colour = mix(C.stone, C.ghostLight, 0.35 - t * 0.25);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The landed saucer: a silver disc running off the right edge with a ring of running lights, a lit
 * glass dome on top, legs down to the ground and the open hatch underneath pouring out light.
 * @param {Canvas} layer
 */
function drawSaucer(layer) {
	const { x: cx, y: cy, rx, ry, domeX, domeY } = SAUCER;
	// The legs.
	for (const x of [31, 62]) {
		line(layer, x + (x < cx ? 3 : -3), cy + 3, x, GROUND, C.stoneShade);
		rect(layer, x - 1, GROUND, 3, 1, C.stone);
	}
	// The glass dome, a light glowing inside it.
	for (let y = cy - domeY; y <= cy; y++) {
		for (let x = cx - domeX; x <= cx + domeX; x++) {
			const d = ((x - cx) / domeX) ** 2 + ((y - cy) / domeY) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = mix(C.tealShade, C.night, 0.2);
			if (d < 0.35) {
				colour = mix(C.teal, C.ghost, 0.3);
			} else if (d < 0.65) {
				colour = C.teal;
			} else if (x < cx - 4 && d > 0.8) {
				colour = C.tealLight;
			}
			set(layer, x, y, colour);
		}
	}
	set(layer, cx - 6, cy - 6, C.white);
	set(layer, cx - 5, cy - 7, C.white);
	// The disc: lit on its top face, a band of running lights round the rim, dark underneath.
	for (let y = cy - ry; y <= cy + ry + 1; y++) {
		for (let x = cx - rx; x < 64; x++) {
			const d = ((x - cx) / rx) ** 2 + ((y - cy) / (ry + 0.5)) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = C.stone;
			if (y < cy - 1) {
				colour =
					d > 0.7 ? C.stoneLight : mix(C.stoneLight, C.white, 0.3);
			} else if (y === cy - 1) {
				colour = C.stoneLight;
			} else if (y > cy + 1) {
				colour = C.stoneShade;
			} else if (y === cy + 1) {
				colour = C.stoneMid;
			}
			set(layer, x, y, colour);
		}
	}
	for (let x = cx - rx + 3; x < 64; x += 4) {
		set(layer, x, cy, x % 8 === 1 ? C.gold : C.tealLight);
	}
	// The open hatch.
	for (let y = HATCH.top; y <= HATCH.bottom; y++) {
		for (let x = HATCH.left; x <= HATCH.right; x++) {
			const edge = Math.min(x - HATCH.left, HATCH.right - x);
			set(layer, x, y, LIGHT[edge < 1 ? 2 : edge < 3 ? 1 : 0]);
		}
	}
}

/**
 * Its thin neck and narrow sloping shoulders in the close-fitting suit, with a silver collar ring and a
 * glowing badge on the chest.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	rect(scene, HEAD_X - 2, 28, 4, 5, SKIN.shade);
	rect(scene, HEAD_X + 2, 28, 1, 5, SKIN.lit);
	for (let y = 32; y < 64; y++) {
		const half = Math.min(12, 4 + Math.round((y - 32) * 1.3));
		for (let x = HEAD_X - half; x <= HEAD_X + half; x++) {
			const u = (x - HEAD_X) / half;
			let colour = SUIT.base;
			if (u > 0.7) {
				colour = SUIT.lit;
			} else if (u < -0.7) {
				colour = SUIT.dark;
			} else if (u < -0.15) {
				colour = SUIT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The collar ring, and a seam down the chest.
	rect(scene, HEAD_X - 4, 32, 9, 1, SUIT.silver);
	rect(scene, HEAD_X - 3, 33, 7, 1, C.stone);
	for (let y = 40; y < 64; y++) {
		set(scene, HEAD_X - 1, y, SUIT.dark);
	}
	// A round badge glowing on its chest.
	paint(scene, HEAD_X + 3, 38, ['.t.', 'tTt', '.t.'], {
		t: C.teal,
		T: C.tealLight,
	});
}

/**
 * The great grey head: a domed cranium narrowing to a small chin, huge slanted black eyes with
 * a glint of the hatch's light, two nostrils and a thin mouth; lit on its left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = 4; y <= 29; y++) {
		const jawHalf = 9.4 - (y - 14) * 0.55;
		for (let x = HEAD_X - 10; x <= HEAD_X + 10; x++) {
			const dx = x - HEAD_X;
			const cranium = (dx / 9.6) ** 2 + ((y - 14) / 10) ** 2 <= 1;
			const jaw = y >= 14 && Math.abs(dx) <= jawHalf;
			if (!cranium && !jaw) {
				continue;
			}
			// Where the pixel sits across the head, from -1 (its right) to 1 (its left, the lit side).
			const across =
				y < 14 || cranium
					? (dx + 0.5) / 9.6
					: dx / Math.max(1, jawHalf);
			let colour = SKIN.base;
			if (across > 0.82 && y < 22) {
				colour = SKIN.glint;
			} else if (across > 0.35) {
				colour = SKIN.lit;
			} else if (across < -0.75) {
				colour = SKIN.dark;
			} else if (across < -0.2) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The brow ridges: lit over its left eye, plain over its right.
	rect(scene, HEAD_X + 2, 14, 5, 1, SKIN.glint);
	rect(scene, HEAD_X - 7, 14, 5, 1, SKIN.base);
	// The huge black eyes, slanting up and out, each with a glint.
	const eye = ['kkk...', 'kkkkk.', 'kkkkkk', '.kkkkk', '..kkk.'];
	paint(scene, HEAD_X - 8, 15, eye, { k: C.ink });
	paint(scene, HEAD_X + 3, 15, eye, { k: C.ink }, { mirror: true });
	set(scene, HEAD_X - 6, 16, mix(C.ghostLight, C.ink, 0.45));
	set(scene, HEAD_X + 6, 16, C.ghostLight);
	set(scene, HEAD_X + 5, 17, mix(C.tealLight, C.ink, 0.5));
	// The cheekbone on the lit side, under the eye.
	rect(scene, HEAD_X + 4, 21, 3, 1, SKIN.glint);
	// Two nostrils and a thin, straight mouth.
	set(scene, HEAD_X - 1, 22, SKIN.dark);
	set(scene, HEAD_X + 1, 22, SKIN.shade);
	rect(scene, HEAD_X - 2, 25, 4, 1, SKIN.dark);
	set(scene, HEAD_X + 2, 25, SKIN.shade);
}

/**
 * Its arms, thin as sticks: the right one raised in greeting, three long fingers spread, the left
 * one hanging at its side.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	// The raised arm: the sleeve out from the shoulder to the elbow, the bare forearm up to the hand.
	for (let x = 6; x <= 16; x++) {
		const top = 33 + Math.round((16 - x) * 0.2);
		set(scene, x, top, SUIT.lit);
		rect(scene, x, top + 1, 1, 2, SUIT.base);
		set(scene, x, top + 3, SUIT.shade);
	}
	rect(scene, 5, 34, 3, 4, SUIT.silver);
	for (let y = 24; y <= 33; y++) {
		const x = HEAD_X - 16 - Math.round((33 - y) * 0.1);
		set(scene, x - 1, y, SKIN.dark);
		set(scene, x, y, SKIN.shade);
		set(scene, x + 1, y, SKIN.base);
	}
	// The open palm and three long splayed fingers with round tips, the thumb out towards the head.
	paint(
		scene,
		0,
		13,
		[
			'.....bb....',
			'ss...b...bb',
			'.s...b...b.',
			'..s..b..b..',
			'..s..b..b..',
			'...s.b.b..L',
			'...ssbbb.L.',
			'...ssbbbL..',
			'...ssbbL...',
			'....sbbL...',
			'....sbL....',
		],
		{ s: SKIN.shade, b: SKIN.base, L: SKIN.lit }
	);
	// The hanging arm down its left side, lit by the hatch.
	for (let y = 34; y < 64; y++) {
		const x = HEAD_X + 13 + Math.round(Math.min(y - 34, 10) * 0.2);
		set(scene, x, y, y < 52 ? SUIT.base : SKIN.base);
		rect(scene, x + 1, y, 2, 1, y < 52 ? SUIT.lit : SKIN.lit);
	}
	rect(scene, HEAD_X + 15, 51, 4, 1, SUIT.silver);
}

/**
 * Crystal clusters glowing on the ground at the corners: violet on the left, teal on the right.
 * @param {Canvas} scene
 */
function drawCrystals(scene) {
	/** @type {[number, number, number, 'arcane' | 'teal'][]} */
	const crystals = [
		[2, 3, 16, 'arcane'],
		[7, 2, 10, 'arcane'],
		[58, 3, 18, 'teal'],
		[52, 2, 11, 'teal'],
		[63, 2, 12, 'teal'],
		[47, 1, 6, 'teal'],
	];
	for (const [cx, half, height, kind] of crystals) {
		const [light, main, shade] =
			kind === 'arcane'
				? [C.arcaneLight, C.arcane, C.arcaneShade]
				: [C.tealLight, C.teal, C.tealShade];
		for (let y = 64 - height; y < 64; y++) {
			const w = Math.min(half, Math.floor((y - 64 + height) / 1.5));
			for (let x = cx - w; x <= cx + w; x++) {
				set(scene, x, y, x < cx ? light : x > cx ? shade : main);
			}
		}
	}
}
