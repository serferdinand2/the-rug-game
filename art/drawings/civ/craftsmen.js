// Craftsmen: a bearded stonemason in a leather apron and a red kerchief, mallet on his shoulder, setting his chisel to a half-carved stone lion in a sunlit workshop, chips flying, tools on the wall.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The workshop floor's first row. */
const FLOOR = 58;

/** The window in the back wall, frame included. */
const WINDOW = { x: 48, y: 1, w: 15, h: 17 };

/** The face's centre column and its first row. */
const FACE_X = 39;
const FACE_TOP = 12;

/** Where the chisel's edge meets the stone. */
const BITE = { x: 12, y: 41 };

/** Skin: lit by the window on his left (the viewer's right), plain, and shaded on the far side. */
const SKIN = {
	glint: mix(C.skinDeep, C.skin, 0.62),
	lit: mix(C.skinDeep, C.skin, 0.35),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.night, 0.35),
};

/** A short beard going grey. */
const BEARD = {
	lit: mix(C.stoneShade, C.stone, 0.4),
	base: mix(C.wood, C.stoneShade, 0.4),
	dark: mix(C.wood, C.night, 0.3),
	fleck: C.stoneLight,
};

/** The faded blue work shirt. */
const SHIRT = {
	lit: mix(C.daySea1, C.stoneLight, 0.45),
	base: mix(C.daySea3, C.stone, 0.4),
	shade: mix(C.nightSea2, C.stoneShade, 0.4),
};

/** The leather apron. */
const APRON = {
	lit: C.timberLight,
	base: C.timber,
	shade: C.timberShade,
	worn: mix(C.timber, C.creamShade, 0.3),
};

/** The red kerchief tied round his head. */
const KERCHIEF = {
	lit: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
};

/** Pale limestone: lit by the window, plain, shaded, and the rough unworked face of the block. */
const STONE = {
	lit: C.creamLight,
	base: C.cream,
	shade: C.creamShade,
	deep: mix(C.creamShade, C.stoneShade, 0.5),
	rough: mix(C.cream, C.stone, 0.35),
	pit: mix(C.creamShade, C.stoneShade, 0.25),
	mane: mix(C.creamShade, C.stoneShade, 0.5),
	cut: mix(C.stoneShade, C.timberShade, 0.3),
};

/**
 * Draws the Craftsmen portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(8003);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'plaster',
		window: { ...WINDOW, time: 'day' },
	});
	drawSunbeam(layer);
	const wall = createCanvas(64, 64);
	drawTools(wall);
	outline(wall, C.ink);
	underlay(wall, layer);

	const statue = createCanvas(64, 64);
	drawBlock(statue, random);
	drawLion(statue);
	outline(statue, C.ink);
	underlay(statue, wall);

	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);

	const scene = createCanvas(64, 64);
	drawChiselArm(scene);
	drawMalletArm(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, statue);
	drawChips(scene, random);
	return scene;
}

/**
 * Sunlight falling from the window down across the plaster wall in a slanting band, the wall dimming
 * away from it towards the left.
 * @param {Canvas} layer
 */
function drawSunbeam(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < WINDOW.x; x++) {
			const behind = layer.p[y * 64 + x];
			if (behind) {
				const band = Math.floor((1 - x / WINDOW.x) * 4) / 4;
				layer.p[y * 64 + x] = mix(behind, C.wood, 0.32 * band);
			}
		}
	}
	for (let y = WINDOW.y + WINDOW.h + 1; y < FLOOR; y++) {
		const from = WINDOW.x - Math.round((y - WINDOW.y - WINDOW.h) * 0.9);
		for (let x = from; x < from + WINDOW.w - 1; x++) {
			const behind = layer.p[y * 64 + x];
			if (x >= 0 && x < 64 && behind) {
				layer.p[y * 64 + x] = mix(behind, C.lampGlow, 0.4);
			}
		}
	}
}

/**
 * The mason's tools hanging from pegs on a rack between the statue and his head: a hand saw and a hammer.
 * @param {Canvas} wall
 */
function drawTools(wall) {
	rect(wall, 17, 3, 15, 2, C.timber);
	rect(wall, 17, 3, 15, 1, C.timberLight);
	// The saw, hung by its handle: a long blade tapering to the tip, its teeth along the lower edge.
	paint(
		wall,
		17,
		6,
		[
			'hhhh.........',
			'hHHhBBBBBBBBB',
			'h..hBBBBBBBBb',
			'hhhhBBBBBBBb.',
			'.hh.tbtbtbtb.',
		],
		{
			h: C.timberShade,
			H: C.timberLight,
			B: C.stoneLight,
			b: C.stone,
			t: C.stoneShade,
		}
	);
	// The hammer, hung head down.
	rect(wall, 30, 5, 1, 7, C.timberLight);
	rect(wall, 28, 12, 5, 3, C.stone);
	rect(wall, 28, 12, 5, 1, C.stoneLight);
}

/**
 * The rough block the lion is being cut from, still showing the quarry's pitted face, lit along its right edge.
 * @param {Canvas} statue
 * @param {() => number} random
 */
function drawBlock(statue, random) {
	for (let y = 24; y < 64; y++) {
		const right = y < 28 ? 16 + (y - 24) : 20;
		for (let x = 0; x <= right; x++) {
			let colour = STONE.rough;
			if (x >= right - 1) {
				colour = STONE.lit;
			} else if (x <= 1) {
				colour = STONE.pit;
			} else if (random() < 0.08) {
				colour = STONE.pit;
			}
			set(statue, x, y, colour);
		}
	}
	// The first cuts below the mane: a smooth ledge with a lit top.
	rect(statue, 2, 27, 16, 1, STONE.lit);
	rect(statue, 2, 28, 16, 1, STONE.base);
	rect(statue, 2, 29, 16, 1, STONE.shade);
	rect(statue, 0, FLOOR, 21, 1, STONE.deep);
}

/** The lion's head in profile, facing the mason: M mane, F face, L lit front, e ear, b brow, k eye, n nose, o mouth, W fang, s shade. */
const LION = [
	'....MMMMM...........',
	'..MMMMMMMMMee.......',
	'.MMMMMMMMMMeEe......',
	'MMMMMMMMMMFFFF......',
	'MMMMMMMMMFFFFFFL....',
	'MMMMMMMMFFFbbbFLL...',
	'MMMMMMMFFFFFkkFFLL..',
	'.MMMMMMFFFFFFFFFFLLL',
	'MMMMMMMFFFFFFFFFFFLn',
	'MMMMMMMMFFFFFFFFFFnn',
	'MMMMMMMMFFFFFsoooooo',
	'.MMMMMMMMFFFsWoooWo.',
	'MMMMMMMMMMFFsoooooo.',
	'MMMMMMMMMMMFFFFFFs..',
	'.MMMMMMMMMMMssss....',
	'..MMMMMMMMMMM.......',
	'....MMMMMMMM........',
	'......MMMM..........',
];

/**
 * The finished lion's head on top of the block, in profile and roaring at the mason: a mane of carved curls,
 * a smooth face lit by the window, a deep-set eye and an open mouth with fangs.
 * @param {Canvas} statue
 */
function drawLion(statue) {
	const top = 7;
	LION.forEach((row, j) => {
		[...row].forEach((key, x) => {
			const y = top + j;
			/** @type {Record<string, string>} */
			const plain = {
				F: STONE.base,
				L: STONE.lit,
				e: STONE.shade,
				E: STONE.lit,
				b: STONE.deep,
				k: STONE.cut,
				n: STONE.deep,
				o: STONE.cut,
				W: STONE.lit,
				s: STONE.shade,
			};
			if (key === 'M') {
				// A few broad carved locks fanning out from the face, darker than it, each cut deep along one edge.
				const angle = Math.atan2(y - 15, x - 12);
				const lock = (((angle + Math.PI) / (2 * Math.PI)) * 11) % 1;
				let colour = STONE.mane;
				if (lock < 0.3) {
					colour = STONE.cut;
				} else if (lock > 0.75 && x > 4) {
					colour = STONE.shade;
				}
				set(statue, x, y, colour);
			} else if (plain[key]) {
				set(statue, x, y, plain[key]);
			}
		});
	});
}

/**
 * His body: the faded blue shirt, its sleeves rolled, under the leather apron hung from his neck and
 * tied at the waist; the light from the window along his left side.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, under the beard.
	rect(scene, FACE_X - 2, 26, 6, 4, SKIN.shade);
	rect(scene, FACE_X + 2, 26, 2, 4, SKIN.lit);
	for (let y = 30; y < 64; y++) {
		const half = Math.min(17, 7 + Math.round((y - 30) * 2.5));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHIRT.base;
			if (u > 0.78) {
				colour = SHIRT.lit;
			} else if (u < -0.4) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The open neck of the shirt.
	for (let y = 30; y < 34; y++) {
		const half = 2 - Math.floor((y - 30) / 2);
		rect(scene, FACE_X - half, y, half * 2 + 1, 1, SKIN.shade);
		set(scene, FACE_X + half, y, SKIN.base);
	}
	// The apron's bib and skirt, its strap round his neck.
	for (let y = 36; y < 64; y++) {
		const half = y < 50 ? 7 : 7 + Math.round((y - 50) * 0.6);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			let colour = APRON.base;
			if (x >= FACE_X + half - 1) {
				colour = APRON.lit;
			} else if (x <= FACE_X - half + 1) {
				colour = APRON.shade;
			} else if ((x * 7 + y * 3) % 17 === 0) {
				colour = APRON.worn;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, FACE_X - 7, 36, 15, 1, APRON.lit);
	line(scene, FACE_X - 6, 35, FACE_X - 4, 30, APRON.shade);
	line(scene, FACE_X + 6, 35, FACE_X + 4, 30, APRON.base);
	// The waist tie and a pocket holding a pencil of charcoal.
	rect(scene, FACE_X - 16, 50, 33, 1, APRON.shade);
	rect(scene, FACE_X + 1, 54, 5, 4, APRON.shade);
	rect(scene, FACE_X + 1, 54, 5, 1, APRON.lit);
	rect(scene, FACE_X + 2, 52, 1, 2, C.wood);
	set(scene, FACE_X, 50, C.brass);
}

/**
 * His head, turned three-quarters to the stone on the viewer's left: cropped dark hair under a red kerchief
 * knotted behind, a short greying beard, the window lighting the side of his face nearest the viewer's right.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The cropped hair and the back of the head.
	for (let y = 7; y <= 23; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 10; x++) {
			const d = ((x - FACE_X - 1.5) / 8.5) ** 2 + ((y - 15) / 8.5) ** 2;
			if (d > 1) {
				continue;
			}
			set(scene, x, y, x >= FACE_X + 8 ? BEARD.base : BEARD.dark);
		}
	}
	// The face: each row's first and last column, from the centre; the far cheek is the narrower.
	/** @type {[number, number, number][]} */
	const rows = [
		[0, -5, 6],
		[1, -5, 6],
		[2, -5, 6],
		[3, -6, 6],
		[4, -6, 6],
		[5, -6, 6],
		[6, -5, 6],
		[7, -5, 6],
		[8, -5, 6],
		[9, -5, 5],
		[10, -4, 5],
		[11, -3, 4],
	];
	for (const [row, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 5) {
				colour = SKIN.glint;
			} else if (dx >= 3) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -4) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, FACE_TOP + row, colour);
		}
	}
	const eyes = FACE_TOP + 4;
	// The near ear, lit.
	rect(scene, FACE_X + 7, eyes, 1, 3, SKIN.lit);
	set(scene, FACE_X + 7, eyes + 1, SKIN.shade);
	// Heavy brows and eyes on the stone, the whites showing behind the pupils.
	rect(scene, FACE_X - 5, eyes - 2, 3, 1, BEARD.dark);
	rect(scene, FACE_X, eyes - 2, 4, 1, BEARD.dark);
	set(scene, FACE_X - 4, eyes, C.ink);
	set(scene, FACE_X - 3, eyes, mix(C.cream, C.skinDeep, 0.35));
	set(scene, FACE_X, eyes, C.ink);
	set(scene, FACE_X + 1, eyes, C.creamLight);
	set(scene, FACE_X + 2, eyes, C.cream);
	rect(scene, FACE_X, eyes - 1, 3, 1, SKIN.shade);
	// The nose, pointing to the stone: its lit ridge, a lit tip and the nostril's shadow.
	rect(scene, FACE_X - 1, eyes, 1, 3, SKIN.lit);
	set(scene, FACE_X - 2, eyes + 1, SKIN.shade);
	set(scene, FACE_X - 2, eyes + 2, SKIN.shade);
	set(scene, FACE_X - 2, eyes + 3, SKIN.glint);
	rect(scene, FACE_X - 1, eyes + 3, 2, 1, SKIN.dark);
	set(scene, FACE_X + 3, eyes + 2, SKIN.glint);
	// The beard and moustache round the jaw, lit along the near side, a few grey hairs in it.
	for (let y = eyes + 4; y <= FACE_TOP + 14; y++) {
		const depth = y - eyes - 4;
		const from = FACE_X - 6 + Math.max(0, depth - 4);
		const to = FACE_X + 6 - Math.max(0, depth - 3);
		for (let x = from; x <= to; x++) {
			let colour = BEARD.base;
			if (x >= to - 1) {
				colour = BEARD.lit;
			} else if (x <= from + 1) {
				colour = BEARD.dark;
			}
			set(scene, x, y, colour);
		}
	}
	for (const [dx, dy] of [
		[-3, 5],
		[1, 6],
		[3, 7],
		[-1, 8],
		[2, 9],
		[-2, 10],
	]) {
		set(scene, FACE_X + dx, eyes + dy, BEARD.fleck);
	}
	// The mouth set in the beard, the lower lip catching the light.
	rect(scene, FACE_X - 3, eyes + 6, 4, 1, mix(C.brickRedShade, C.night, 0.3));
	rect(scene, FACE_X - 2, eyes + 7, 3, 1, mix(C.skinDeep, C.brickRed, 0.35));
	// The kerchief round his brow, knotted behind his head with its ends hanging.
	for (let x = FACE_X - 7; x <= FACE_X + 9; x++) {
		const y = FACE_TOP - 3 + Math.round((x - FACE_X) / 8);
		set(scene, x, y, x >= FACE_X + 4 ? KERCHIEF.lit : KERCHIEF.base);
		set(scene, x, y + 1, x >= FACE_X + 4 ? KERCHIEF.base : KERCHIEF.shade);
		set(scene, x, y + 2, KERCHIEF.shade);
	}
	paint(
		scene,
		FACE_X + 8,
		FACE_TOP - 2,
		['.kK.', 'kKKk', '.kKk', '..kK', '..kK', '...k'],
		{ k: KERCHIEF.shade, K: KERCHIEF.base }
	);
}

/**
 * Paints a bare forearm five pixels wide, row by row, its edge towards the window lit and the other shaded.
 * @param {Canvas} scene
 * @param {number} top - Its first row
 * @param {number} bottom - Its last row
 * @param {(y: number) => number} from - Its first column on a row
 */
function drawForearm(scene, top, bottom, from) {
	for (let y = top; y <= bottom; y++) {
		const left = from(y);
		for (let x = left; x <= left + 4; x++) {
			let colour = SKIN.base;
			if (x === left + 4) {
				colour = SKIN.lit;
			} else if (x === left) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * His left arm, reaching to the stone on the viewer's left: the rolled sleeve, the bare forearm and the fist
 * round the chisel, its edge set to the stone.
 * @param {Canvas} scene
 */
function drawChiselArm(scene) {
	for (let y = 32; y <= 46; y++) {
		const left = 21 - Math.round((y - 32) * 0.1);
		const right = 28 - Math.round((y - 32) * 0.15);
		for (let x = left; x <= right; x++) {
			let colour = SHIRT.base;
			if (x <= left + 1) {
				colour = SHIRT.shade;
			} else if (x >= right) {
				colour = SHIRT.lit;
			}
			set(scene, x, y, colour);
		}
	}
	// The rolled cuff at the elbow.
	rect(scene, 19, 44, 8, 2, SHIRT.lit);
	rect(scene, 19, 46, 8, 1, SHIRT.shade);
	// The forearm rising from the elbow to the fist at the stone.
	drawForearm(scene, 39, 47, (y) => 15 + Math.round((y - 39) * 0.5));
	// The chisel, its steel shank through the fist, the struck end above it and the edge in the stone.
	rect(scene, BITE.x - 4, BITE.y - 4, 7, 2, C.stone);
	rect(scene, BITE.x - 4, BITE.y - 4, 7, 1, C.stoneLight);
	set(scene, BITE.x - 5, BITE.y - 3, C.stoneShade);
	rect(scene, 19, BITE.y - 6, 3, 2, C.stoneLight);
	set(scene, 21, BITE.y - 5, C.stone);
	paint(
		scene,
		14,
		BITE.y - 5,
		['..LLL.', '.SSSSL', 'sSsSSL', 'sSsSSL', '.sSSL.'],
		{ s: SKIN.shade, S: SKIN.base, L: SKIN.lit }
	);
}

/**
 * His right arm bent up, the fist round a wooden mallet's handle, its barrel-shaped oak head resting on his shoulder.
 * @param {Canvas} scene
 */
function drawMalletArm(scene) {
	// The upper arm down his side to the elbow.
	for (let y = 32; y <= 50; y++) {
		const left = 51 + Math.round((y - 32) * 0.2);
		const right = 57 + Math.round((y - 32) * 0.1);
		for (let x = left; x <= right; x++) {
			let colour = SHIRT.base;
			if (x >= right - 1) {
				colour = SHIRT.lit;
			} else if (x === left) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The rolled cuff above the elbow, and the forearm bent up across his body to the fist.
	rect(scene, 53, 44, 7, 2, SHIRT.lit);
	rect(scene, 53, 46, 7, 1, SHIRT.shade);
	drawForearm(scene, 40, 50, (y) => 46 + Math.round((y - 40) * 0.8));
	// The mallet's handle from the fist up to the head.
	rect(scene, 49, 30, 2, 10, C.timberLight);
	rect(scene, 50, 30, 1, 10, C.timber);
	// The head: a barrel of oak bound with iron hoops, lit along its top, the pale end grain on its right end.
	for (let y = 22; y <= 30; y++) {
		for (let x = 43; x <= 57; x++) {
			const u = (x - 50) / 7.5;
			const v = (y - 26) / 4.5;
			if (u * u * u * u + v * v > 1) {
				continue;
			}
			let colour = C.timber;
			if (v < -0.55) {
				colour = C.timberLight;
			} else if (v > 0.6) {
				colour = C.timberShade;
			}
			if (x === 45 || x === 52) {
				colour = v < -0.55 ? C.stoneLight : C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	paint(scene, 55, 23, ['.e.', 'eEe', 'eWe', 'eEe', '.e.'], {
		e: mix(C.sand, C.timberLight, 0.4),
		E: C.sand,
		W: C.timber,
	});
	// The fist on the handle.
	paint(scene, 46, 38, ['.sSSL.', 'sSSSLL', 'sSSSSL', 'sSSSSL', '.ssSL.'], {
		s: SKIN.shade,
		S: SKIN.base,
		L: SKIN.lit,
	});
}

/**
 * Stone chips and dust flying from the chisel's edge, bright where they catch the sunbeam.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawChips(scene, random) {
	for (const [dx, dy] of [
		[-3, -6],
		[-5, -8],
		[-2, -9],
		[-7, -5],
		[-6, -11],
		[-3, -12],
		[-8, -2],
	]) {
		set(
			scene,
			BITE.x - 4 + dx,
			BITE.y - 3 + dy,
			random() > 0.4 ? C.white : C.creamLight
		);
	}
	set(scene, BITE.x - 10, BITE.y - 8, C.creamShade);
	set(scene, BITE.x - 4, BITE.y - 15, C.creamShade);
}
