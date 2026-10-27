// Marriage of State: two crowned royals joining hands under a flower arch, the wedding bells ringing in a tower behind.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The ground's first row, the row the couple stands on, and the arch's centre. */
const GROUND = 46;
const FEET = 59;
const ARCH = { x: 26, y: 33, outer: 20, inner: 15 };

/** Blossom colours on the arch. */
const PINK = mix(C.brickRedLight, C.white, 0.45);
const BLOSSOMS = [PINK, C.white, C.gold, PINK, C.railLight];

/**
 * The royal in a purple robe trimmed with ermine, facing right, one hand held out.
 * g crown, r jewel, H hair, S skin, s skin shade, e eye, W ermine, k ermine spot,
 * P robe, p robe shade, L robe lit, G gold, B shoe.
 */
const KING = [
	'...g.g.g......',
	'...ggrgg......',
	'..HHHHHHH.....',
	'..HHHSSSSS....',
	'..HHSSSSeS....',
	'..HHSSSSSS....',
	'..HHSSSSSs....',
	'...HSSSSs.....',
	'....HSSs......',
	'...WWWWWW.....',
	'..WWkWWWkW....',
	'.LWWWWWWWWP...',
	'.LPPPPPPPPPP..',
	'.LPPPPPPPPPPS.',
	'.LPPPPPPPPPSSS',
	'.LPPPPPPPPP...',
	'.LGGGGGGGGp...',
	'.LPPPPPPPPp...',
	'.LPPPPPPPPp...',
	'.LPPPPPPPPp...',
	'LPPPPPPPPPp...',
	'LPPPPPPPPPpp..',
	'LPPPPPPPPPpp..',
	'LPPPPPPPPPpp..',
	'LPPPPPPPPPPp..',
	'LPPPPPPPPPPp..',
	'LWWkWWWkWWWWW.',
	'...BB....BB...',
];

/**
 * The royal in a long cream gown with flowing hair, facing left, one hand held out and a posy at the waist.
 * g crown, b jewel, H hair, S skin, s skin shade, e eye, D gown, d gown shade, l gown lit,
 * G gold, F posy, f posy leaves.
 */
const QUEEN = [
	'......g.g.g...',
	'......ggbgg...',
	'.....HHHHHHH..',
	'....SSSSSHHHH.',
	'....SeSSSSHHH.',
	'....SSSSSSHHH.',
	'....sSSSSSHHH.',
	'.....sSSSSHHHH',
	'......sSSHHHHH',
	'.....lDDDDHHHH',
	'....lDDDDDDHHH',
	'...lDDDDDDDdHH',
	'.SSDDDDDDDDdH.',
	'SSSDDDDDDDDd..',
	'...lDGGGGGDd..',
	'...lFFfFFDDd..',
	'...lFfFfFDDd..',
	'...lDFFFDDDd..',
	'..lDDDDDDDDdd.',
	'..lDDDDDDDDDd.',
	'..lDDDDDDDDDd.',
	'.lDDDDDDDDDDd.',
	'.lDDDDDDDDDDdd',
	'.lDDDDDDDDDDdd',
	'lDDDDDDDDDDDdd',
	'lDDDDDDDDDDDdd',
	'GGGGGGGGGGGGGG',
	'..............',
];

/**
 * Draws the Marriage of State scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(94);

	drawSky(layer, { time: 'day', horizon: GROUND, random });
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: GROUND, random });
	drawPath(layer);

	// The bell tower stands behind the arch, so it gets its own outline.
	const tower = createCanvas(64, 64);
	drawBellTower(tower);
	outline(tower, C.ink);

	drawArch(scene, random);
	paint(scene, 12, FEET - KING.length + 1, KING, {
		g: C.gold,
		r: C.brickRed,
		H: C.timber,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		W: C.white,
		k: C.ink,
		P: C.roofLight,
		p: C.roof,
		L: C.railLight,
		G: C.gold,
		B: C.wood,
	});
	paint(scene, 26, FEET - QUEEN.length + 1, QUEEN, {
		g: C.gold,
		b: C.nightWave,
		H: C.amber,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		D: C.creamLight,
		d: C.cream,
		l: C.white,
		G: C.gold,
		F: PINK,
		f: C.grass,
	});
	outline(scene, C.ink);
	drawPetals(scene, random);
	underlay(scene, tower);
	underlay(scene, layer);
	return scene;
}

/**
 * Paints a sprite from rows of keys; dots and unknown keys are left alone.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 * @param {Record<string, Colour>} colours
 */
function paint(canvas, x, y, rows, colours) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * Soft green hills on the horizon behind the garden.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(GROUND - 5 - Math.sin(x * 0.11 + 0.6) * 3);
		for (let y = top; y < GROUND; y++) {
			set(layer, x, y, y === top ? C.forestFloorLight : C.forestFloor);
		}
	}
}

/**
 * A pale stone path leading up to the arch.
 * @param {Canvas} layer
 */
function drawPath(layer) {
	for (let y = GROUND + 6; y < 64; y++) {
		const half = 6 + Math.floor((y - GROUND - 6) / 2);
		for (let x = ARCH.x - half; x <= ARCH.x + half; x++) {
			const joint =
				(y - GROUND) % 4 === 0 || (x + (y >> 2) * 3) % 6 === 0;
			set(layer, x, y, joint ? C.stone : C.stoneLight);
		}
	}
}

/**
 * A stone bell tower with an open belfry and two gold bells, one swinging, under a pointed roof.
 * @param {Canvas} canvas
 */
function drawBellTower(canvas) {
	const left = 48;
	const right = 60;
	for (let y = 11; y <= GROUND + 1; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.stone;
			if (x === left) {
				colour = C.stoneLight;
			} else if (x >= right - 1) {
				colour = C.stoneShade;
			} else if (y % 4 === 0 && (x + (y >> 2) * 2) % 4 === 0) {
				colour = C.stoneMid;
			}
			set(canvas, x, y, colour);
		}
	}
	// The belfry: one wide arched opening onto the sky, two gold bells on a beam, one swinging.
	for (let y = 12; y <= 23; y++) {
		for (let x = left + 2; x <= right - 2; x++) {
			const corner =
				(y === 12 && (x <= left + 3 || x >= right - 3)) ||
				(y === 13 && (x === left + 2 || x === right - 2));
			if (!corner) {
				set(canvas, x, y, C.roofShade);
			}
		}
	}
	rect(canvas, left + 2, 14, right - left - 3, 1, C.timber);
	paint(
		canvas,
		left + 2,
		15,
		['..a..', '.gGA.', '.gGA.', '.gGA.', 'gGGGA', 'GGGGG', '..k..'],
		{ g: C.gold, G: C.amber, A: C.lampFrame, a: C.brass, k: C.wood }
	);
	paint(
		canvas,
		left + 6,
		15,
		['.a....', '..gA..', '.gGGA.', '.gGGA.', 'gGGGGA', '.GGGGG', '....k.'],
		{ g: C.gold, G: C.amber, A: C.lampFrame, a: C.brass, k: C.wood }
	);
	// The cornice and the pointed roof with a gold ball on top.
	rect(canvas, left - 1, 10, right - left + 3, 1, C.stoneLight);
	for (let r = 0; r < 9; r++) {
		const from = left + Math.floor(r * 0.75);
		const to = right - Math.floor(r * 0.75);
		for (let x = from; x <= to; x++) {
			const colour =
				x === from
					? C.brickRedLight
					: x >= to - 1
						? C.brickRedShade
						: C.brickRed;
			set(canvas, x, 9 - r, colour);
		}
	}
	set(canvas, 54, 0, C.gold);
	set(canvas, 55, 0, C.gold);
	// A small window low on the tower.
	rect(canvas, 53, 30, 2, 3, C.roofShade);
}

/**
 * The flower arch: a thick round hoop of leaves on two posts, studded with blossoms.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawArch(scene, random) {
	const { x: cx, y: cy, outer, inner } = ARCH;
	for (let y = cy - outer; y <= FEET; y++) {
		for (let x = cx - outer; x <= cx + outer; x++) {
			// The hoop above the spring line, straight posts below it.
			const d = y < cy ? Math.hypot(x - cx, y - cy) : Math.abs(x - cx);
			if (d > outer || d < inner) {
				continue;
			}
			const outerEdge = d > outer - 1.3;
			const innerEdge = d < inner + 1.2;
			let colour = C.grass;
			if (outerEdge) {
				colour = x < cx ? C.grassLight : C.grass;
			} else if (innerEdge) {
				colour = C.grassShade;
			} else if ((x * 3 + y * 5) % 7 === 0) {
				colour = C.grassLight;
			} else if ((x * 5 + y * 3) % 9 === 0) {
				colour = C.grassShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Blossoms scattered over the leaves, thicker on the hoop.
	for (let i = 0; i < 70; i++) {
		const angle = Math.PI * random();
		const r = inner + 1 + random() * (outer - inner - 2);
		const x = Math.round(cx - Math.cos(angle) * r);
		const y = Math.round(cy - Math.sin(angle) * r);
		set(scene, x, y, BLOSSOMS[i % BLOSSOMS.length]);
	}
	for (let i = 0; i < 24; i++) {
		const side = i % 2 ? 1 : -1;
		const x =
			cx +
			side * (inner + 1 + Math.floor(random() * (outer - inner - 2)));
		const y = cy + Math.floor(random() * (FEET - cy - 2));
		set(scene, x, y, BLOSSOMS[(i + 2) % BLOSSOMS.length]);
	}
}

/**
 * Petals drifting down around the arch, only into open air so none land on a face.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPetals(scene, random) {
	for (let i = 0; i < 18; i++) {
		const x = 8 + Math.floor(random() * 40);
		const y = 6 + Math.floor(random() * 30);
		if (scene.p[y * 64 + x] === null) {
			set(scene, x, y, i % 3 ? PINK : C.white);
		}
	}
}
