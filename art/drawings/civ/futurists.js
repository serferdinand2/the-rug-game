// Futurists: a pilot in a silver flight suit at dusk, her helmet's visor raised and a gloved hand on the controls at her chest, a gleaming city of spires behind her, winged craft overhead and a rocket climbing into the sunset.
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
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The horizon the city stands on. */
const HORIZON = 47;

/** The helmet's centre and radius; the face's centre column and its first row inside it. */
const HELMET = { x: 34, y: 21, r: 11 };
const FACE_X = 34;
const FACE_TOP = 17;

/** The rocket's nose. */
const ROCKET = { x: 52, y: 2 };

/** Skin: lit by the setting sun on her left (the viewer's right), plain, and cool in the shade. */
const SKIN = {
	glint: mix(C.skinDeep, C.gold, 0.55),
	lit: mix(C.skinDeep, C.duskSky6, 0.35),
	base: C.skinDeep,
	shade: mix(C.skinDeepShade, C.duskSky2, 0.2),
	dark: mix(C.skinDeepShade, C.night, 0.4),
};

/** The silver of the suit and helmet: sunlit, lit, plain, shaded violet by the dusk, and darkest. */
const SILVER = {
	glint: mix(C.white, C.duskSky6, 0.3),
	lit: mix(C.stoneLight, C.duskSky6, 0.25),
	base: C.stoneLight,
	shade: mix(C.stone, C.duskSky2, 0.3),
	dark: mix(C.stoneShade, C.duskSky1, 0.4),
};

/** The raised visor's tinted glass, with the sunset in it. */
const VISOR = {
	glass: mix(C.nightSky2, C.tealShade, 0.35),
	sky: C.duskSky4,
	sun: C.duskSky6,
	glint: C.gold,
};

/** The colours the sun's glow leaves alone. */
const KEEP = [
	...Object.values(SKIN),
	...Object.values(SILVER),
	...Object.values(VISOR),
	C.ink,
	C.tealLight,
	C.teal,
	C.white,
	C.lampGlow,
	C.gold,
];

/**
 * Draws the Futurists portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(8005);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawSun(layer);
	drawHaze(layer);
	rect(layer, 0, HORIZON + 1, 64, 63 - HORIZON, C.roofShade);
	drawSkyline(layer, { base: 63, time: 'dusk', random, height: 18 });
	drawRocketTrail(layer);
	const city = createCanvas(64, 64);
	drawSpires(city);
	drawCraft(city);
	drawRocket(city);
	outline(city, mix(C.roofShade, C.duskSky1, 0.5));
	underlay(city, layer);

	const figure = createCanvas(64, 64);
	drawSuit(figure);
	drawHelmet(figure);
	drawFace(figure);
	outline(figure, C.ink);

	const scene = createCanvas(64, 64);
	drawArm(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, city);

	glow(scene, {
		x: 64,
		y: 30,
		radius: 34,
		colour: C.duskSky6,
		strength: 0.25,
		steps: 3,
		skip: KEEP,
	});
	drawLights(scene, random);
	return scene;
}

/**
 * The setting sun on the horizon behind the towers on the right.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = HORIZON - 9; y <= HORIZON; y++) {
		for (let x = 48; x < 64; x++) {
			const d = Math.hypot(x - 56, y - HORIZON);
			if (d <= 6) {
				set(layer, x, y, C.lampGlow);
			} else if (d <= 8) {
				set(layer, x, y, C.gold);
			}
		}
	}
}

/**
 * Far-off spires standing pale in the evening haze behind the city.
 * @param {Canvas} layer
 */
function drawHaze(layer) {
	const far = mix(C.duskSky3, C.duskSky4, 0.5);
	const edge = mix(C.duskSky5, C.duskSky4, 0.3);
	for (const [x, top, w] of [
		[8, 20, 3],
		[18, 12, 4],
		[27, 24, 5],
		[41, 18, 3],
		[61, 16, 3],
	]) {
		for (let y = top; y <= HORIZON; y++) {
			rect(layer, x, y, w, 1, far);
			set(layer, x + w - 1, y, edge);
		}
		set(layer, x + Math.floor(w / 2), top - 1, far);
		set(layer, x + Math.floor(w / 2), top - 2, far);
	}
}

/**
 * The rocket's trail of white vapour, fading as it falls away behind the rocket.
 * @param {Canvas} layer
 */
function drawRocketTrail(layer) {
	for (let y = ROCKET.y + 11; y <= 34; y++) {
		const fade =
			Math.floor(((y - ROCKET.y - 11) / (34 - ROCKET.y - 11)) * 3) / 3;
		const x = ROCKET.x + Math.round(fade * 2);
		set(layer, x, y, mix(C.white, C.duskSky4, 0.2 + fade * 0.5));
		set(layer, x + 1, y, mix(C.cloudShade, C.duskSky4, 0.4 + fade * 0.4));
	}
}

/**
 * The gleaming towers of the city: a needle with a saucer deck on the left, a domed tower, and on the right
 * a tall spire wearing a ring; violet in the dusk, lit gold along their sunward edges.
 * @param {Canvas} city
 */
function drawSpires(city) {
	const body = C.roof;
	const lit = mix(C.duskSky6, C.gold, 0.3);
	const shade = C.roofShade;
	/**
	 * A slender tower from its top down to the horizon.
	 * @param {number} x - Its left column
	 * @param {number} top - Its first row
	 * @param {number} w - Its width
	 */
	const tower = (x, top, w) => {
		for (let y = top; y <= HORIZON; y++) {
			for (let i = 0; i < w; i++) {
				let colour = body;
				if (i === w - 1) {
					colour = lit;
				} else if (i === 0) {
					colour = shade;
				} else if ((y - top) % 4 === 2 && i % 2 === 1) {
					colour = C.tealLight;
				}
				set(city, x + i, y, colour);
			}
		}
	};
	// The needle and its saucer deck.
	tower(4, 8, 3);
	line(city, 5, 2, 5, 7, C.stoneLight);
	rect(city, 1, 16, 9, 1, lit);
	rect(city, 0, 17, 11, 2, body);
	rect(city, 2, 19, 7, 1, shade);
	for (let x = 1; x < 11; x += 2) {
		set(city, x, 17, C.tealLight);
	}
	// The domed tower.
	tower(10, 28, 6);
	for (let y = 23; y < 28; y++) {
		const half = Math.round(
			Math.sqrt(Math.max(0, 9 - (y - 27.5) ** 2 * 1.4))
		);
		for (let x = 13 - half; x <= 12 + half; x++) {
			set(city, x, y, x >= 13 ? lit : C.roofLight);
		}
	}
	// The ringed spire on the right, standing against the sun, and a lower tower beside it.
	tower(60, 10, 3);
	line(city, 61, 4, 61, 9, C.stoneLight);
	for (let x = 56; x <= 63; x++) {
		const y = 18 + Math.round(Math.abs(x - 61) / 3);
		set(city, x, y, x > 61 ? lit : C.roofLight);
	}
}

/**
 * Three small winged craft crossing the sky, arrow-shaped with swept wings, a teal engine light at the tail.
 * @param {Canvas} city
 */
function drawCraft(city) {
	for (const { x, y, mirror } of [
		{ x: 12, y: 5, mirror: false },
		{ x: 38, y: 2, mirror: true },
		{ x: 21, y: 12, mirror: false },
	]) {
		paint(
			city,
			x,
			y,
			['.s.....', 'tssLL..', 'TSSSSLW', '.ss....'],
			{
				s: SILVER.shade,
				S: SILVER.base,
				L: SILVER.glint,
				W: C.white,
				t: C.teal,
				T: C.tealLight,
			},
			{ mirror }
		);
	}
}

/**
 * The rocket climbing on its trail, its nose catching the sun.
 * @param {Canvas} city
 */
function drawRocket(city) {
	paint(
		city,
		ROCKET.x - 2,
		ROCKET.y,
		[
			'..W..',
			'.WLs.',
			'.WLs.',
			'.LLs.',
			'.LTs.',
			'.LLs.',
			'sLLss',
			's.f.s',
			'..f..',
		],
		{ W: C.white, L: SILVER.lit, s: SILVER.shade, T: C.teal, f: C.gold }
	);
}

/**
 * The silver flight suit over her shoulders and chest: a padded collar ring, teal piping, a harness and a
 * ringed-planet patch on the chest; sunlit along her left.
 * @param {Canvas} scene
 */
function drawSuit(scene) {
	for (let y = 31; y < 64; y++) {
		const half = Math.min(17, 9 + Math.round((y - 31) * 2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SILVER.base;
			if (u > 0.85) {
				colour = SILVER.glint;
			} else if (u > 0.5) {
				colour = SILVER.lit;
			} else if (u < -0.75) {
				colour = SILVER.dark;
			} else if (u < -0.25) {
				colour = SILVER.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The padded collar ring the helmet locks into.
	for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
		const dip = Math.round(Math.abs(x - FACE_X - 0.5) / 6);
		set(scene, x, 31 + dip, SILVER.dark);
		set(scene, x, 32 + dip, x > FACE_X + 3 ? C.tealLight : C.teal);
		set(scene, x, 33 + dip, SILVER.shade);
	}
	// Teal piping down the front and along the shoulders.
	for (let y = 34; y < 64; y++) {
		set(scene, FACE_X + 1, y, C.teal);
	}
	line(scene, FACE_X + 10, 33, FACE_X + 16, 37, C.tealLight);
	line(scene, FACE_X - 10, 33, FACE_X - 16, 37, C.teal);
	// The harness: two dark straps over the shoulders to a buckle.
	line(scene, FACE_X - 6, 35, FACE_X - 2, 50, SILVER.dark);
	line(scene, FACE_X + 8, 35, FACE_X + 4, 50, SILVER.dark);
	rect(scene, FACE_X - 2, 50, 7, 3, SILVER.dark);
	rect(scene, FACE_X, 51, 3, 1, C.gold);
	// A small panel of lights on her right breast, and a dark belt.
	rect(scene, FACE_X - 6, 41, 6, 5, SILVER.dark);
	set(scene, FACE_X - 3, 42, C.tealLight);
	set(scene, FACE_X - 2, 44, C.gold);
	set(scene, FACE_X - 4, 44, C.brickRedLight);
	set(scene, FACE_X - 2, 42, C.tealLight);
	rect(scene, FACE_X - 17, 57, 35, 2, SILVER.dark);
	// A patch on her left breast: a gold ringed planet on teal.
	paint(
		scene,
		FACE_X + 9,
		43,
		['.ttttt.', 'tttGttt', 'gGGGGGg', 'ttGGGtt', '.ttttt.'],
		{ t: C.tealShade, G: C.gold, g: C.amber }
	);
}

/**
 * The silver helmet round her face, its tinted visor raised on top with the sunset in it, an earpiece with
 * a teal light and a padded rim round the face.
 * @param {Canvas} scene
 */
function drawHelmet(scene) {
	const { x: cx, y: cy, r } = HELMET;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r + 1; x++) {
			const d = Math.hypot(x - cx - 0.5, y - cy) / r;
			if (d > 1) {
				continue;
			}
			const u = (x - cx - 0.5) / r;
			let colour = SILVER.base;
			if (u > 0.7 && d > 0.75) {
				colour = SILVER.glint;
			} else if (u > 0.3) {
				colour = SILVER.lit;
			} else if (u < -0.7) {
				colour = SILVER.dark;
			} else if (u < -0.2) {
				colour = SILVER.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The raised visor: a band of tinted glass over the crown, the sunset reflected across it.
	for (let x = cx - r + 2; x <= cx + r - 1; x++) {
		const dx = (x - cx - 0.5) / r;
		const top =
			Math.round(cy - r * Math.sqrt(Math.max(0, 1 - dx * dx))) + 1;
		for (let y = top; y <= top + 4; y++) {
			let colour = VISOR.glass;
			if (y === top + 2 && x > cx - 4) {
				colour = VISOR.sky;
			} else if (y === top + 3 && x > cx + 1) {
				colour = VISOR.sun;
			} else if (y === top + 4) {
				colour = SILVER.dark;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, cx + 5, cy - r + 3, VISOR.glint);
	set(scene, cx + 6, cy - r + 3, VISOR.glint);
	// The padded rim round the face opening.
	for (let y = FACE_TOP - 2; y <= cy + r - 1; y++) {
		for (let x = cx - 9; x <= cx + 10; x++) {
			const d =
				((x - cx - 0.5) / 8.5) ** 2 + ((y - FACE_TOP - 6) / 9) ** 2;
			if (d <= 1 && d > 0.62) {
				set(scene, x, y, x > cx + 4 ? SILVER.shade : SILVER.dark);
			}
		}
	}
	// The earpiece on the sunlit side, a teal light in it.
	paint(
		scene,
		cx + 9,
		cy - 1,
		['.sss.', 'sLLLs', 'sLtLs', 'sLLLs', '.sss.'],
		{
			s: SILVER.shade,
			L: SILVER.glint,
			t: C.tealLight,
		}
	);
}

/**
 * Her face in the helmet's opening, turned to the viewer: dark curls at the brow, the setting sun lighting
 * her left cheek and the dusk cooling the other.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[0, -4, 5],
		[1, -5, 6],
		[2, -5, 6],
		[3, -5, 6],
		[4, -5, 6],
		[5, -5, 6],
		[6, -5, 6],
		[7, -4, 5],
		[8, -4, 5],
		[9, -3, 4],
		[10, -3, 4],
		[11, -2, 3],
		[12, -1, 2],
	];
	for (const [row, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 4) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, FACE_TOP + row, colour);
		}
	}
	// Dark curls escaping at the brow.
	paint(scene, FACE_X - 4, FACE_TOP - 1, ['hHhhHHhHh.', '.h..hh..h.'], {
		h: C.wood,
		H: mix(C.wood, C.duskSky4, 0.3),
	});
	const eyes = FACE_TOP + 4;
	// Brows, lashes and eyes.
	rect(scene, FACE_X - 3, eyes - 2, 3, 1, C.wood);
	rect(scene, FACE_X + 2, eyes - 2, 3, 1, C.wood);
	set(scene, FACE_X - 3, eyes, mix(C.cream, C.duskSky3, 0.3));
	set(scene, FACE_X - 2, eyes, C.ink);
	set(scene, FACE_X + 2, eyes, C.creamLight);
	set(scene, FACE_X + 3, eyes, C.ink);
	rect(scene, FACE_X - 3, eyes - 1, 2, 1, C.night);
	rect(scene, FACE_X + 2, eyes - 1, 2, 1, C.night);
	// The nose: a shade line and a lit tip.
	rect(scene, FACE_X, eyes + 1, 1, 2, SKIN.shade);
	set(scene, FACE_X + 1, eyes + 3, SKIN.glint);
	set(scene, FACE_X, eyes + 3, SKIN.dark);
	// A calm, closed smile.
	rect(
		scene,
		FACE_X - 1,
		eyes + 5,
		3,
		1,
		mix(C.brickRedShade, C.skinDeepShade, 0.3)
	);
	set(
		scene,
		FACE_X + 2,
		eyes + 4,
		mix(C.brickRedShade, C.skinDeepShade, 0.3)
	);
	rect(scene, FACE_X - 1, eyes + 6, 3, 1, mix(C.brickRed, C.skinDeep, 0.45));
	// The lit cheekbone.
	set(scene, FACE_X + 4, eyes + 2, SKIN.glint);
}

/**
 * Her right arm down at her side, the forearm bent up across her body and the gloved fingers on the panel of lights at her chest.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	// The upper arm down her side to the elbow.
	for (let y = 33; y <= 51; y++) {
		const mid = 15 - Math.round(Math.max(0, y - 42) * 0.2);
		for (let x = mid - 3; x <= mid + 2; x++) {
			let colour = SILVER.shade;
			if (x === mid - 3) {
				colour = SILVER.dark;
			} else if (x === mid + 2) {
				colour = SILVER.base;
			}
			set(scene, x, y, colour);
		}
	}
	// The forearm, bent up across her body, its top edge catching the sun.
	for (let i = 0; i <= 10; i++) {
		const x = 13 + i;
		const y = 50 - Math.round(i * 0.5);
		for (let t = -2; t <= 1; t++) {
			let colour = SILVER.base;
			if (t === -2) {
				colour = SILVER.lit;
			} else if (t === 1) {
				colour = SILVER.dark;
			}
			set(scene, x, y + t, colour);
		}
	}
	// A teal cuff at the wrist and the white glove, two fingers on the panel.
	rect(scene, 23, 42, 1, 5, C.tealLight);
	rect(scene, 24, 42, 1, 5, C.teal);
	paint(scene, 25, 41, ['.LLL..', 'LLLLGG', 'LBBBB.', 'LBBBGG', '.BBB..'], {
		L: SILVER.glint,
		B: SILVER.base,
		G: SILVER.lit,
	});
}

/**
 * Lit windows and beacon lights twinkling on the towers, and the rocket's flame, painted last.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLights(scene, random) {
	for (const [x, y] of [
		[5, 1],
		[61, 3],
	]) {
		set(scene, x, y, C.brickRedLight);
	}
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 3 + Math.floor(random() * 4);
		if (x < 12 || x > 56) {
			set(scene, x, y, C.lampGlow);
		}
	}
	paint(scene, ROCKET.x - 1, ROCKET.y + 9, ['gwg', '.w.', '.a.'], {
		g: C.gold,
		w: C.lampGlow,
		a: C.amber,
	});
}
