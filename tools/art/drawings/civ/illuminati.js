// Illuminati: a masked aristocrat in black velvet raising a goblet of wine, a purse of gold in his other hand, the eye in the pyramid glowing behind him at night.
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
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column. */
const FACE_X = 40;

/** The pyramid's apex, the eye's centre, the row the floating capstone ends on, and the pyramid's last row. */
const APEX = { x: 20, y: 0 };
const EYE = { x: 20, y: 8 };
const CAP_BASE = 12;
const BASE = 31;

/** How far each side of the pyramid spreads per row. */
const SLOPE = 0.72;

/** The pyramid's dark stone courses: the lit face, the shaded face, the joints, and the edges the eye's light catches. */
const STONE = {
	top: mix(C.stoneLight, C.night, 0.45),
	lit: mix(C.stone, C.night, 0.5),
	base: mix(C.stoneShade, C.night, 0.55),
	joint: mix(C.stoneShade, C.night, 0.68),
	edge: mix(C.gold, C.night, 0.35),
};

/** Skin: lit gold by the eye on his right, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.45),
	lit: mix(C.skin, C.gold, 0.25),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.night, 0.4),
};

/** Black velvet, lit gold along the eye's side. */
const VELVET = {
	lit: mix(C.roof, C.amber, 0.35),
	base: mix(C.roofShade, C.night, 0.15),
	shade: mix(C.night, C.ink, 0.4),
	fold: mix(C.roofShade, C.night, 0.6),
};

/** Black hair combed back, rimmed gold on the lit side. */
const HAIR = {
	lit: mix(C.wood, C.gold, 0.4),
	base: mix(C.wood, C.night, 0.35),
	dark: mix(C.night, C.ink, 0.5),
};

/** The white half-mask: lit, plain and shaded, with its gold trim. */
const MASK = {
	lit: mix(C.creamLight, C.gold, 0.15),
	base: C.cream,
	shade: C.creamShade,
	dark: mix(C.creamShade, C.roof, 0.35),
	hollow: mix(C.roofShade, C.night, 0.2),
};

/** Eye whites through the mask, on the lit and the shaded side. */
const WHITE = { lit: C.creamLight, shade: mix(C.cream, C.skinShade, 0.45) };

/** The face, mask, hair and hands are lit by hand, so the glow leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(MASK),
	...Object.values(WHITE),
	C.ink,
	C.gold,
	C.amber,
	C.brass,
	C.white,
	C.creamLight,
	C.cream,
	C.creamShade,
];

/**
 * Draws the Illuminati portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8941);

	drawInterior(layer, { floor: 64, random, wall: 'panel' });
	darkenRoom(layer);
	drawRays(layer);
	drawPyramid(layer);

	// The arms are drawn on their own and outlined, so they stand clear of the coat.
	const figure = createCanvas(64, 64);
	drawCoat(figure);
	drawHead(figure);
	drawMask(figure);
	drawPlume(figure);
	outline(figure, C.ink);
	const arms = createCanvas(64, 64);
	drawPurseArm(arms);
	drawPurse(arms);
	drawGobletArm(arms);
	drawGoblet(arms);
	outline(arms, C.ink);
	underlay(arms, figure);
	underlay(scene, arms);
	underlay(scene, layer);

	glow(scene, {
		x: EYE.x,
		y: EYE.y,
		radius: 26,
		colour: C.gold,
		strength: 0.4,
		steps: 5,
		skip: FIGURE,
	});
	drawEye(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Dims the panelled room to night, deep violet in the dark.
 * @param {Canvas} layer
 */
function darkenRoom(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(mix(colour, C.roofShade, 0.5), C.night, 0.8);
		}
	}
}

/**
 * Tells whether a pixel lies inside the pyramid's outline (capstone or body, gap included).
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inPyramid(x, y) {
	return (
		y >= APEX.y &&
		y <= BASE &&
		Math.abs(x - APEX.x) <= Math.round((y - APEX.y) * SLOPE)
	);
}

/**
 * Faint rays of light fanning out from the eye across the dark wall.
 * @param {Canvas} layer
 */
function drawRays(layer) {
	const ray = mix(C.amber, C.night, 0.4);
	for (let i = 0; i < 14; i++) {
		const a = (i / 14) * Math.PI * 2 + 0.15;
		for (let d = 6; d < 44; d++) {
			const x = Math.round(EYE.x + Math.cos(a) * d);
			const y = Math.round(EYE.y + Math.sin(a) * d);
			if (x < 0 || y < 0 || x > 63 || y > 63) {
				break;
			}
			if (!inPyramid(x, y) && d % 5 !== 0) {
				set(layer, x, y, ray);
			}
		}
	}
}

/**
 * The pyramid: a body of dark stone courses and, floating above it, a glowing gold capstone.
 * @param {Canvas} layer
 */
function drawPyramid(layer) {
	for (let y = APEX.y; y <= BASE; y++) {
		const half = Math.round((y - APEX.y) * SLOPE);
		for (let x = APEX.x - half; x <= APEX.x + half; x++) {
			const edge = Math.abs(x - APEX.x) === half;
			if (y <= CAP_BASE) {
				// The capstone: gold, brightest at its heart, its right face darker.
				let colour = x <= APEX.x ? C.gold : C.amber;
				if (edge) {
					colour = x <= APEX.x ? C.lampGlow : C.lampFrame;
				} else if (y === CAP_BASE) {
					colour = C.lampFrame;
				}
				set(layer, x, y, colour);
			} else if (y === CAP_BASE + 1) {
				// The gap of light between the capstone and the body.
				set(layer, x, y, mix(C.gold, C.night, 0.35));
			} else {
				const course = Math.floor((y - CAP_BASE - 2) / 3);
				const row = (y - CAP_BASE - 2) % 3;
				const joint = (x + (course % 2) * 3) % 6 === 0;
				const left = x <= APEX.x;
				let colour = left ? STONE.lit : STONE.base;
				if (row === 2 || joint) {
					colour = STONE.joint;
				} else if (row === 0) {
					colour = left ? STONE.top : STONE.lit;
				}
				if (edge) {
					colour = left ? STONE.edge : STONE.joint;
				} else if (y === BASE) {
					colour = STONE.joint;
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * The eye in the capstone: a white almond with a violet iris, painted after the glow so it keeps its colours.
 * @param {Canvas} scene
 */
function drawEye(scene) {
	paint(
		scene,
		EYE.x - 4,
		EYE.y - 2,
		['...kkk...', '.kkWWWkk.', 'kWWiIiWWk', '.kkWWWkk.', '...kkk...'],
		{ k: C.lampFrame, W: C.white, i: C.arcane, I: C.ink }
	);
	set(scene, EYE.x - 1, EYE.y - 1, C.lampGlow);
}

/**
 * The black velvet coat over his shoulders and chest: a lace jabot at the throat, a green waistcoat
 * with gold buttons in the opening, and gold-embroidered lapels; lit gold along the eye's side.
 * @param {Canvas} scene
 */
function drawCoat(scene) {
	// The neck, in the chin's shadow except on the lit side.
	for (let y = 24; y <= 26; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 3; x++) {
			let colour = SKIN.shade;
			if (x === FACE_X - 2) {
				colour = SKIN.lit;
			} else if (y === 25 && x > FACE_X - 1) {
				colour = SKIN.dark;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 27; y < 64; y++) {
		const half = Math.min(23, 7 + Math.round((y - 27) * 2.5));
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = VELVET.base;
			if (u < -0.82) {
				colour = VELVET.lit;
			} else if (u > 0.75) {
				colour = VELVET.shade;
			} else if (u > 0.3) {
				colour = VELVET.fold;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds falling from the shoulders.
	for (let y = 34; y < 64; y++) {
		set(scene, FACE_X - 12 + Math.round((y - 34) * 0.15), y, VELVET.fold);
		set(scene, FACE_X + 12 + Math.round((y - 34) * 0.2), y, VELVET.shade);
	}
	// The opening: a green waistcoat between gold-edged lapels.
	for (let y = 27; y < 64; y++) {
		const half = 3 + Math.floor((y - 27) / 5);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			set(scene, x, y, x <= FACE_X ? C.pine : C.pineShade);
		}
		set(scene, FACE_X - half - 1, y, C.gold);
		set(scene, FACE_X + half + 2, y, C.amber);
		set(scene, FACE_X + 1 + half, y, mix(C.pineShade, C.night, 0.4));
		// Embroidery along the lapels.
		if (y % 3 === 0) {
			set(scene, FACE_X - half - 2, y, C.amber);
			set(scene, FACE_X + half + 3, y, C.lampFrame);
		}
	}
	for (let y = 40; y < 64; y += 5) {
		set(scene, FACE_X, y, C.gold);
		set(scene, FACE_X + 1, y, C.amber);
	}
	// The lace jabot spilling from the throat over the waistcoat, its frills lit on the eye's side.
	for (let y = 25; y <= 38; y++) {
		const half = 1 + Math.min(3, Math.floor((y - 25) / 3));
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			let colour = x <= FACE_X ? C.creamLight : C.cream;
			if ((y + (x <= FACE_X ? 0 : 1)) % 3 === 0) {
				colour = C.creamShade;
			} else if (x === FACE_X + 1 + half) {
				colour = C.creamShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A gold pin with a violet stone in the lace.
	paint(scene, FACE_X - 1, 28, ['.g.', 'gVg', '.a.'], {
		g: C.gold,
		V: C.arcane,
		a: C.amber,
	});
}

/**
 * His head: black hair combed back, the face turned to the viewer and lit gold by the eye on his right,
 * with a sly smile.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = 3; y <= 23; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
			const head = ((x - FACE_X - 0.5) / 8) ** 2 + ((y - 13) / 9.5) ** 2;
			if (head > 1) {
				continue;
			}
			const rim =
				((x - 1 - FACE_X - 0.5) / 8) ** 2 + ((y - 13) / 9.5) ** 2 > 1;
			let colour = HAIR.base;
			if (x < FACE_X - 2 && rim) {
				colour = HAIR.lit;
			} else if (x >= FACE_X + 6) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// Combing lines swept back from the brow.
	for (const [x, y] of [
		[36, 6],
		[37, 5],
		[39, 5],
		[40, 4],
		[43, 5],
		[44, 6],
	]) {
		set(scene, x, y, HAIR.lit);
	}
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -2, 3],
		[11, -3, 4],
		[12, -4, 5],
		[13, -4, 5],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -5, 6],
		[18, -4, 5],
		[19, -4, 5],
		[20, -4, 5],
		[21, -3, 4],
		[22, -3, 4],
		[23, -2, 3],
		[24, -1, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -3) {
				colour = SKIN.glint;
			} else if (dx <= -1) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Ears: the near one lit, with a pearl drop, the far one in shadow.
	rect(scene, FACE_X - 6, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X - 6, 18, C.white);
	rect(scene, FACE_X + 7, 15, 1, 3, SKIN.shade);
	// The nose below the mask: a shade line on its dark side and a lit tip.
	rect(scene, FACE_X + 1, 18, 1, 2, SKIN.shade);
	set(scene, FACE_X, 18, SKIN.glint);
	set(scene, FACE_X + 1, 19, SKIN.dark);
	// A sly smile, one corner turned up.
	rect(scene, FACE_X - 1, 21, 3, 1, C.brickRedShade);
	set(scene, FACE_X + 2, 20, C.brickRedShade);
	set(scene, FACE_X - 2, 21, SKIN.base);
	set(scene, FACE_X, 22, mix(C.brickRed, C.skin, 0.55));
	// The lit chin and the shadow under the far cheekbone.
	set(scene, FACE_X - 1, 23, SKIN.glint);
	set(scene, FACE_X + 4, 18, SKIN.dark);
}

/**
 * The white half-mask over his eyes: its top edge trimmed in gold with a violet jewel, its wings swept up,
 * the bridge over his nose, and his eyes dark in its holes.
 * @param {Canvas} scene
 */
function drawMask(scene) {
	/** @type {[number, number, number][]} Each column's offset, top row and bottom row. */
	const columns = [
		[-7, 10, 13],
		[-6, 11, 15],
		[-5, 12, 16],
		[-4, 13, 17],
		[-3, 13, 17],
		[-2, 13, 17],
		[-1, 13, 16],
		[0, 13, 17],
		[1, 13, 17],
		[2, 13, 16],
		[3, 13, 17],
		[4, 13, 17],
		[5, 13, 17],
		[6, 12, 16],
		[7, 11, 15],
		[8, 10, 13],
	];
	for (const [dx, top, bottom] of columns) {
		for (let y = top; y <= bottom; y++) {
			let colour = MASK.base;
			if (y === top) {
				colour = dx <= 0 ? C.gold : C.amber;
			} else if (dx <= -3) {
				colour = MASK.lit;
			} else if (dx >= 6) {
				colour = MASK.dark;
			} else if (dx >= 2) {
				colour = MASK.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// A violet jewel at the centre of the brow.
	set(scene, FACE_X, 13, C.arcaneLight);
	set(scene, FACE_X + 1, 13, C.arcane);
	// The cut-out round each eye: a dark hollow over the white of the eye and its pupil, looking at the viewer.
	rect(scene, FACE_X - 3, 14, 3, 1, MASK.hollow);
	rect(scene, FACE_X + 2, 14, 3, 1, MASK.hollow);
	set(scene, FACE_X - 3, 15, WHITE.lit);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X - 1, 15, MASK.hollow);
	set(scene, FACE_X + 2, 15, MASK.hollow);
	set(scene, FACE_X + 3, 15, C.ink);
	set(scene, FACE_X + 4, 15, WHITE.shade);
	// The bridge over the nose catches the light.
	set(scene, FACE_X, 15, MASK.lit);
	set(scene, FACE_X, 16, MASK.lit);
}

/**
 * A violet plume rising from the mask's far wing and curling over his hair.
 * @param {Canvas} scene
 */
function drawPlume(scene) {
	for (let i = 0; i <= 10; i++) {
		const x = FACE_X + 8 + Math.round(Math.sin(i * 0.28) * 4);
		const y = 11 - i;
		set(scene, x, y, i % 3 === 0 ? C.arcaneShade : C.arcane);
		set(scene, x + 1, y, i < 9 ? C.arcaneShade : C.arcane);
		if (i > 2 && i < 10) {
			set(scene, x - 1, y, C.arcaneLight);
		}
	}
}

/**
 * His right arm held out from the elbow: a velvet sleeve lit along its top and a lace cuff at the wrist.
 * @param {Canvas} scene
 */
function drawPurseArm(scene) {
	for (let x = 12; x <= 25; x++) {
		const top = 41 + Math.round((x - 12) * 0.25);
		for (let y = top; y <= top + 7; y++) {
			let colour = VELVET.base;
			if (y === top) {
				colour = VELVET.lit;
			} else if (y >= top + 6) {
				colour = VELVET.fold;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 41; y <= 49; y++) {
		set(scene, 10, y, y % 2 ? C.creamLight : C.cream);
		set(scene, 11, y, y % 2 ? C.cream : C.creamShade);
	}
}

/**
 * A fat leather purse held out on his open palm, its mouth open on a heap of gold coins.
 * @param {Canvas} scene
 */
function drawPurse(scene) {
	paint(
		scene,
		0,
		33,
		[
			'....gGg.....',
			'..gGgWgGg...',
			'.gGgGgGgGg..',
			'.tbbbbbbbt..',
			'LtttttttttT.',
			'LtttttttttTs',
			'LLttttttttTs',
			'LLttttttttss',
			'.LtttttttTs.',
			'..LtttttTs..',
			'...LttTTs...',
		],
		{
			g: C.amber,
			G: C.gold,
			W: C.lampGlow,
			t: C.timber,
			T: C.timberShade,
			L: C.timberLight,
			s: C.wood,
			b: C.lampFrame,
		}
	);
	// His open hand under it, the fingers reaching out and the thumb against its side.
	paint(
		scene,
		1,
		43,
		[
			'.H.......hh',
			'HhhhhhhhhhH',
			'shhhhhhhhhh',
			'.sshhhhhhh.',
			'....sssss..',
		],
		{ h: SKIN.lit, H: SKIN.glint, s: SKIN.base }
	);
}

/**
 * His left arm raised to the chest: the sleeve rising from the elbow, a lace cuff and his fist round the goblet's stem.
 * @param {Canvas} scene
 */
function drawGobletArm(scene) {
	for (let y = 38; y <= 63; y++) {
		const left = 51 + Math.round((y - 38) * 0.25);
		const right = Math.min(63, 57 + Math.round((y - 38) * 0.3));
		for (let x = left; x <= right; x++) {
			let colour = VELVET.base;
			if (x <= left) {
				colour = VELVET.lit;
			} else if (x >= right - 1) {
				colour = VELVET.shade;
			}
			set(scene, x, y, colour);
		}
	}
	for (let x = 50; x <= 58; x++) {
		set(scene, x, 37, x % 2 ? C.creamLight : C.cream);
		set(scene, x, 38, x % 2 ? C.cream : C.creamShade);
	}
	// The fist wrapped round the stem.
	paint(
		scene,
		51,
		31,
		['.hhhhh.', 'hHhhhss', 'hHhhhss', 'hHhhsss', '.hhsss.', '..sss..'],
		{ h: SKIN.base, H: SKIN.lit, s: SKIN.shade }
	);
}

/**
 * The gold goblet, brimming with dark red wine, its stem in his fist.
 * @param {Canvas} scene
 */
function drawGoblet(scene) {
	paint(
		scene,
		48,
		22,
		[
			'.gGGGGGGGGa.',
			'gRrrrrrrrrRa',
			'WGGGGGGGGGaa',
			'WGgGGGGGGaal',
			'.WGGGGGGGal.',
			'..WGGGGGal..',
			'...WGGGal...',
			'....GGal....',
			'.....Ga.....',
		],
		{
			W: C.lampGlow,
			G: C.gold,
			g: C.lampGlow,
			a: C.amber,
			l: C.lampFrame,
			R: C.brickRedShade,
			r: mix(C.brickRedShade, C.night, 0.3),
		}
	);
	// A drop of wine running down the bowl.
	set(scene, 50, 24, C.brickRed);
	set(scene, 50, 25, C.brickRedShade);
}

/**
 * A few gold motes drifting in the eye's light, painted last so they stay bright.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 6; i++) {
		const x = 2 + Math.floor(random() * 30);
		const y = 15 + Math.floor(random() * 22);
		if (!inPyramid(x, y) && get(scene, x, y) !== C.ink) {
			set(scene, x, y, C.lampGlow);
		}
	}
	// A coin dropping from the purse, flat and catching the light.
	paint(scene, 4, 54, ['gWg', 'aaa'], {
		g: C.gold,
		W: C.lampGlow,
		a: C.amber,
	});
}
