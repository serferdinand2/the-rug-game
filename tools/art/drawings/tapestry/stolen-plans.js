// Stolen Plans: a masked thief climbs out of a manor's lit upper window onto a rope, a rolled blueprint under his arm, while a guard's lantern passes below.
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
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The manor's left edge, the roof's last row, the string course between the storeys, the hedge's and the lawn's top rows. */
const CORNER = 12;
const EAVES = 2;
const STRING = 39;
const HEDGE = 49;
const LAWN = 56;

/** The lit window's opening, and the column the rope hangs down from its hook under the eaves. */
const WINDOW = { x: 26, y: 8, w: 20, h: 24 };
const ROPE = 23;

/** The guard's lantern glass. */
const LANTERN = { x: 3, y: 50 };

/** The manor's honey stone, cooled by the moon. */
const ASHLAR = mix(C.sandShade, C.nightSky5, 0.5);
const ASHLAR_LIT = mix(C.sand, C.nightSky6, 0.42);
const ASHLAR_JOINT = mix(C.timber, C.nightSky4, 0.5);

/** The thief's clothes and his moonlit edge. */
const DARK = C.night;
const MOONLIT = C.roofLight;

/**
 * The thief in profile, facing left, one hand out on the rope, one foot on the sill and the other leg swung out over it.
 * k dark clothes, K mask, e eye, S skin, s skin shade.
 */
const THIEF = [
	'........kkkk......',
	'.......kkkkkkk....',
	'......kkkkkkkkk...',
	'......kkkkkkkkkk..',
	'.....KKKKKKKKkkk..',
	'.....KeKKKKKKkkk..',
	'.....SSSskkkkkkk..',
	'......SSskkkkkk...',
	'.......kkkkkkk....',
	'.......kkkkkkkk...',
	'.....kkkkkkkkkkk..',
	'SS.kkkkkkkkkkkkkk.',
	'SSkkkkkkkkkkkkkkk.',
	'....kkkkkkkkkkkkk.',
	'.....kkkkkkkkkkkk.',
	'.....kkkkkkkkkkkkk',
	'....kkkkkk..kkkkkk',
	'...kkkkk.....kkkkk',
	'...kkkk......kkkk.',
	'...kkk.......kkk..',
	'...kkk......kkkk..',
	'...kkk.....kkkkk..',
	'...kkk............',
	'...kkk............',
	'...kkk............',
	'...kkkk...........',
	'..kkkkk...........',
];

/**
 * The rolled blueprint under his arm. L lit top, P paper, p shade, l the plan's white lines, w the roll's pale end, o its hollow.
 */
const BLUEPRINT = [
	'.wLLLLLLLLLLLLLLLLLLw.',
	'wolPPPlPPPlPPPlPPPPwow',
	'.wppppppppppppppppppw.',
];

/**
 * The guard walking his rounds, facing left with a lantern held out. t steel helmet, T helmet lit, S skin, s skin shade,
 * u tunic, U tunic shade, b belt, l legs, f boots.
 */
const GUARD = [
	'....ttt....',
	'...tTTtt...',
	'.tttttttttt',
	'....SSs....',
	'...SSSs....',
	'....SSs....',
	'....uuuU...',
	'..SuuuuuU..',
	'.S.uuuuuU..',
	'...uuuuuU..',
	'...bbbbbb..',
	'...uuuuuU..',
	'...uuuuuU..',
	'...ll..ll..',
	'...ll..ll..',
	'...ll..ll..',
	'..fff.fff..',
];

/**
 * Draws the Stolen Plans scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(487);

	drawSky(layer, {
		time: 'night',
		horizon: HEDGE,
		random,
		stars: 10,
		starRows: 34,
		sparkles: [
			[4, 6],
			[9, 19],
		],
	});
	drawTrees(layer);
	drawLawn(layer, random);

	// The manor stands behind everything else, so it gets its own outline.
	const manor = createCanvas(64, 64);
	drawFacade(manor);
	drawWindow(manor);
	drawDarkWindow(manor);
	outline(manor, C.ink);
	underlay(manor, layer);
	glow(manor, {
		x: WINDOW.x + WINDOW.w / 2,
		y: WINDOW.y + WINDOW.h / 2,
		radius: 22,
		colour: C.amber,
		strength: 0.3,
		skip: [C.ink],
	});
	drawRoom(manor);

	drawHedge(scene, random);
	drawCypress(scene);
	drawThief(scene);
	drawGuard(scene);
	outline(scene, C.ink);
	underlay(scene, manor);
	drawRims(scene);
	drawRope(scene);
	drawLanternLight(scene);
	return scene;
}

/**
 * Dark trees far off on the left, under the stars.
 * @param {Canvas} layer
 */
function drawTrees(layer) {
	const dark = mix(C.pineShade, C.nightSky2, 0.5);
	const ridge = mix(C.pine, C.nightSky4, 0.5);
	for (let x = 0; x < CORNER + 2; x++) {
		const top = 33 + Math.round(Math.abs(Math.sin(x * 0.7)) * 4);
		for (let y = top; y <= HEDGE; y++) {
			set(layer, x, y, y === top ? ridge : dark);
		}
	}
}

/**
 * The lawn in front of the hedge, with a gravel path along it, all in moonlit greens.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLawn(layer, random) {
	const grass = mix(C.grassShade, C.nightSky3, 0.45);
	const grassDark = mix(C.grassShade, C.nightSky1, 0.6);
	const gravel = mix(C.sandShade, C.nightSky4, 0.55);
	const gravelLight = mix(C.sand, C.nightSky5, 0.5);
	for (let y = HEDGE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y > 61 ? grassDark : grass;
			if (y >= LAWN + 1 && y <= LAWN + 5) {
				colour = (x * 5 + y * 3) % 7 === 0 ? gravelLight : gravel;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		set(layer, x, LAWN + 6, x % 2 ? gravel : grassDark);
	}
}

/**
 * The manor's upper storey: honey ashlar, a slate roof under the eaves, quoins at the corner and a string course below.
 * @param {Canvas} manor
 */
function drawFacade(manor) {
	const slate = mix(C.roof, C.nightSky2, 0.3);
	for (let y = 0; y < HEDGE; y++) {
		for (let x = CORNER; x < 64; x++) {
			let colour = ASHLAR;
			const row = y - EAVES - 3;
			const course = Math.floor(row / 5);
			if (y < EAVES) {
				colour = slate;
			} else if (y === EAVES) {
				colour = C.stoneLight;
			} else if (y === EAVES + 1 || y === EAVES + 2) {
				colour = y === EAVES + 1 ? ASHLAR_LIT : ASHLAR_JOINT;
			} else if (y === STRING) {
				colour = ASHLAR_LIT;
			} else if (y === STRING + 1) {
				colour = ASHLAR_JOINT;
			} else if (row % 5 === 4) {
				colour = ASHLAR_JOINT;
			} else if (x - CORNER < 3 + (course % 2) * 2) {
				colour = x === CORNER ? ASHLAR_LIT : ASHLAR;
			} else if (x - CORNER === 3 + (course % 2) * 2) {
				colour = ASHLAR_JOINT;
			} else if ((x + (course % 2) * 8) % 16 === 0) {
				colour = ASHLAR_JOINT;
			}
			set(manor, x, y, colour);
		}
	}
}

/**
 * The window: a pale stone surround with a keystone, the right casement swung open and a deep sill. The opening is left
 * empty for the lit room, painted after the outline.
 * @param {Canvas} manor
 */
function drawWindow(manor) {
	const { x, y, w, h } = WINDOW;
	const surround = mix(C.creamLight, C.nightSky6, 0.25);
	rect(manor, x - 2, y - 2, w + 4, h + 2, surround);
	rect(manor, x - 1, y - 1, w + 2, h + 1, ASHLAR_LIT);
	// The keystone over the middle.
	rect(manor, x + w / 2 - 2, y - 4, 4, 4, surround);
	// The sill.
	rect(manor, x - 3, y + h, w + 6, 1, C.creamLight);
	rect(manor, x - 3, y + h + 1, w + 6, 1, surround);
	rect(manor, x - 2, y + h + 2, w + 4, 1, ASHLAR_JOINT);
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			manor.p[(y + j) * 64 + x + i] = null;
		}
	}
	// The right casement, swung open against the wall.
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < 4; i++) {
			const pane = j % 6 !== 0 && (i === 1 || i === 2);
			set(
				manor,
				x + w + 3 + i,
				y + j,
				pane ? mix(C.nightSea2, C.moonRim, 0.25) : C.timber
			);
		}
	}
}

/**
 * A second, unlit window at the right edge, its shutters closed.
 * @param {Canvas} manor
 */
function drawDarkWindow(manor) {
	const x = 58;
	const surround = mix(C.creamLight, C.nightSky6, 0.25);
	rect(manor, x - 2, WINDOW.y - 2, 10, WINDOW.h + 2, surround);
	for (let j = 0; j < WINDOW.h; j++) {
		for (let i = 0; i < 8; i++) {
			const slat = j % 2 === 0;
			set(manor, x + i, WINDOW.y + j, slat ? C.timberShade : C.timber);
		}
	}
	rect(manor, x - 3, WINDOW.y + WINDOW.h, 10, 1, C.creamLight);
}

/**
 * The lit room behind the window: warm lamplight with a bookcase in the corner.
 * @param {Canvas} manor
 */
function drawRoom(manor) {
	const { x, y, w, h } = WINDOW;
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			const d = Math.hypot(i - w * 0.62, j - h * 0.3);
			const colour = d < 5 ? C.lampGlow : d < 10 ? C.gold : C.amber;
			set(manor, x + i, y + j, colour);
		}
	}
	// A bookcase against the far wall on the right, its shelves catching the light.
	for (let j = 1; j < h; j++) {
		for (let i = w - 4; i < w; i++) {
			const shelf = j % 5 === 0;
			const book = (i * 3 + Math.floor(j / 5)) % 4;
			const colour = shelf
				? C.timberShade
				: [C.brickRedShade, C.timber, C.pineShade, C.lampFrame][book];
			set(manor, x + i, y + j, colour);
		}
	}
}

/**
 * The garden hedge along the foot of the wall, its top lit by the moon.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHedge(scene, random) {
	const leaf = mix(C.pineShade, C.nightSky2, 0.25);
	const leafLit = mix(C.pine, C.nightSky5, 0.3);
	const leafTop = mix(C.pineLight, C.nightSky6, 0.3);
	for (let x = 0; x < 64; x++) {
		const top = HEDGE + (Math.floor(x / 3) % 2);
		for (let y = top; y < LAWN + 1; y++) {
			let colour = leaf;
			if (y === top) {
				colour = leafTop;
			} else if (y < top + 3 && random() > 0.4) {
				colour = leafLit;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * A clipped cypress in front of the wall on the right, dark, with a moonlit left flank.
 * @param {Canvas} scene
 */
function drawCypress(scene) {
	const leaf = mix(C.pineShade, C.nightSky1, 0.3);
	const lit = mix(C.pine, C.nightSky5, 0.35);
	const cx = 57;
	for (let y = 22; y < HEDGE + 2; y++) {
		const half = Math.round(Math.min(6, (y - 22) * 0.45 + 1));
		for (let x = cx - half; x <= cx + half; x++) {
			const edge = x <= cx - half + 1 && (x + y) % 3 !== 0;
			set(scene, x, y, edge ? lit : leaf);
		}
	}
}

/**
 * The thief crouched on the sill, with the roll of plans tucked under his arm.
 * @param {Canvas} scene
 */
function drawThief(scene) {
	// The back foot rests on the sill; the front leg hangs below it.
	const top = WINDOW.y + WINDOW.h - THIEF.length + 5;
	paint(scene, ROPE, top, THIEF, {
		k: DARK,
		K: C.ink,
		e: C.white,
		S: C.skin,
		s: C.skinShade,
	});
	paint(scene, ROPE + 1, top + 13, BLUEPRINT, {
		L: C.daySky4,
		P: C.daySea1,
		p: C.daySea3,
		l: C.daySky6,
		w: C.creamLight,
		o: C.daySea3,
	});
}

/**
 * The guard on the path, facing away from the manor, with his halberd and lantern.
 * @param {Canvas} scene
 */
function drawGuard(scene) {
	paint(scene, 2, LAWN + 4 - GUARD.length, GUARD, {
		t: C.stone,
		T: C.stoneLight,
		S: C.skin,
		s: C.skinShade,
		u: C.brickRed,
		U: C.brickRedShade,
		b: C.wood,
		l: C.roofShade,
		f: C.wood,
	});
	// The halberd, its haft against his shoulder.
	line(scene, 11, LAWN - 16, 11, LAWN + 3, C.timberLight);
	rect(scene, 10, LAWN - 17, 3, 1, C.stone);
	rect(scene, 12, LAWN - 16, 2, 3, C.stoneLight);
	set(scene, 11, LAWN - 18, C.stoneLight);
	// The lantern's frame, held out in front.
	rect(scene, LANTERN.x - 1, LANTERN.y - 1, 3, 4, C.lampFrame);
}

/**
 * Lights the thief's edges with moonlight: the left of each dark run and the tops.
 * @param {Canvas} scene
 */
function drawRims(scene) {
	/** @type {[number, number][]} */
	const lit = [];
	for (let y = WINDOW.y - 2; y <= WINDOW.y + WINDOW.h; y++) {
		for (let x = ROPE; x < ROPE + 19; x++) {
			if (y > WINDOW.y + WINDOW.h - 2 && x < ROPE + 3) {
				continue;
			}
			if (get(scene, x, y) !== DARK) {
				continue;
			}
			const left = get(scene, x - 1, y) === C.ink;
			const above = get(scene, x, y - 1) === C.ink;
			if (left || above) {
				lit.push([x, y]);
			}
		}
	}
	for (const [x, y] of lit) {
		set(scene, x, y, MOONLIT);
	}
}

/**
 * The rope from its hook under the eaves down past the thief's hand to the hedge, painted over the outline so it stays thin.
 * @param {Canvas} scene
 */
function drawRope(scene) {
	rect(scene, ROPE - 1, EAVES + 1, 3, 1, C.stoneShade);
	for (let y = EAVES + 2; y < HEDGE + 1; y++) {
		const behind = get(scene, ROPE, y);
		if (behind !== C.skin && behind !== DARK && behind !== MOONLIT) {
			set(scene, ROPE, y, y % 2 ? C.timberLight : C.sandShade);
		}
	}
}

/**
 * The guard's lantern: a warm glow over the hedge and the path, and the bright glass. The guard himself keeps his
 * colours, so he stays crisp inside the light.
 * @param {Canvas} scene
 */
function drawLanternLight(scene) {
	glow(scene, {
		x: LANTERN.x,
		y: LANTERN.y + 1,
		radius: 16,
		colour: C.gold,
		strength: 0.55,
		skip: [
			C.ink,
			C.stone,
			C.stoneLight,
			C.skin,
			C.skinShade,
			C.brickRed,
			C.brickRedShade,
			C.wood,
			C.roofShade,
			C.timberLight,
			C.lampFrame,
		],
	});
	rect(scene, LANTERN.x, LANTERN.y, 1, 2, C.lampGlow);
}
