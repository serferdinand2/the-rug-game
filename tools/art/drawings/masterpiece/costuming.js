// Costuming: an empty jewelled stage gown on a dressmaker's dummy in a lamplit workroom at night, with a lace ruff, puffed sleeves, pins and a tape measure, and a feathered mask on a hook.
import {
	createCanvas,
	get,
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The dummy's centre column. */
const CX = 31;

/** The first row of the floorboards, and the gown's hem. */
const FLOOR = 54;
const HEM = 56;

/** The rows where the bodice starts at the shoulders and where it comes to its point below the waist. */
const SHOULDER = 14;
const WAIST = 34;

/** The oil lamp's flame, and the top of the shelf the lamp stands on at the left. */
const FLAME = { x: 7, y: 20 };
const SHELF = 30;

/** The feathered mask hanging from its hook on the wall: the hook. */
const HOOK = { x: 53, y: 3 };

/** The workroom's plaster, from where the lamp lights it most to the far corner, and the floorboards. */
const WALL = [
	C.plasterLight,
	C.plaster,
	mix(C.plaster, C.plasterShade, 0.5),
	C.plasterShade,
	mix(C.plasterShade, C.roof, 0.35),
];
const BOARD = [C.floorLight, C.floor, C.floorShade];
const BOARD_SEAM = mix(C.floorShade, C.wood, 0.6);

/** The sapphire velvet of the gown, lit warm by the lamp on the left and falling into shadow on the right. */
const VELVET = {
	glint: mix(C.daySky3, C.lampGlow, 0.3),
	lit: mix(C.daySky1, C.daySky2, 0.6),
	base: mix(C.daySky1, C.roof, 0.45),
	shade: mix(C.roof, C.roofShade, 0.4),
	dark: mix(C.roofShade, C.night, 0.3),
};

/** The gold braid and the ivory brocade of the forepart showing through the skirt's opening. */
const GOLD = {
	lit: C.lampGlow,
	base: C.gold,
	shade: C.amber,
	dark: C.lampFrame,
};
const BROCADE = {
	lit: C.creamLight,
	base: C.cream,
	shade: C.creamShade,
	figure: mix(C.gold, C.cream, 0.35),
};

/** The lace of the standing ruff: bright threads, plain threads and the open pattern between them. */
const LACE = {
	lit: C.white,
	base: C.creamLight,
	open: mix(C.creamShade, C.plaster, 0.4),
};

/** The linen covering the dummy's neck, and its turned wooden cap. */
const LINEN = {
	lit: C.cream,
	base: C.creamShade,
	shade: mix(C.creamShade, C.plasterShade, 0.6),
};

/** The jewels sewn on the bodice: rubies and pearls. */
const RUBY = C.brickRedLight;
const PEARL = C.creamLight;

/** The yellow cloth tape measure and its marks. */
const TAPE = mix(C.sandLight, C.gold, 0.2);
const TAPE_SHADE = mix(C.sand, C.amber, 0.25);
const TICK = mix(C.ink, C.lampFrame, 0.4);

/** The mask's gilt and the feathers of its plume. */
const PLUME = {
	red: C.brickRed,
	redLit: C.brickRedLight,
	white: C.creamLight,
	whiteShade: C.creamShade,
};

/** The lamp's chimney glass, warm with the flame behind it. */
const GLASS = mix(C.lampGlow, C.creamLight, 0.5);
const GLASS_EDGE = mix(C.creamShade, C.stone, 0.45);

/**
 * Draws the Costuming masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(6230);

	drawWall(layer, random);
	drawFloor(layer, random);
	drawShelf(layer);

	const scene = createCanvas(64, 64);
	drawStand(scene);
	drawSkirt(scene);
	drawCollar(scene);
	drawNeck(scene);
	drawBodice(scene);
	drawSleeves(scene);
	drawTape(scene);
	drawLamp(scene);
	drawMask(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 30,
		colour: C.amber,
		strength: 0.28,
		steps: 3,
		skip: [...WALL, C.ink, C.white, C.lampGlow, GLASS, GLASS_EDGE],
	});
	drawFlame(scene);
	drawPins(scene);
	drawSparkles(scene);
	return scene;
}

/**
 * How far a point lies from the lamp's flame, squeezed a little across so the light spreads wide over the wall.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function distance(x, y) {
	return Math.hypot((x - FLAME.x) * 0.9, y - FLAME.y);
}

/**
 * The plaster wall, brightest round the lamp and darkening in rings towards the far side, with a few old stains.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			const t = distance(x, y) / 14;
			const band = Math.min(WALL.length - 1, Math.floor(t));
			const dither =
				t - band > 0.7 && band + 1 < WALL.length && (x + y) % 2 === 0;
			set(layer, x, y, WALL[dither ? band + 1 : band]);
		}
	}
	for (let i = 0; i < 24; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (FLOOR - 2));
		const here = get(layer, x, y);
		const band = WALL.indexOf(/** @type {Colour} */ (here));
		if (band > 0) {
			set(layer, x, y, WALL[band - 1]);
		}
	}
	// The skirting board.
	rect(layer, 0, FLOOR - 2, 64, 1, C.timber);
	rect(layer, 0, FLOOR - 1, 64, 1, C.timberShade);
}

/**
 * The floorboards, running across the room, lit near the lamp and dark in the far corner.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFloor(layer, random) {
	for (let y = FLOOR; y < 64; y++) {
		const plank = Math.floor((y - FLOOR) / 3);
		const joint = Math.floor(random() * 30) + plank * 11;
		for (let x = 0; x < 64; x++) {
			const band = x < 22 ? 0 : x < 46 ? 1 : 2;
			let colour = BOARD[Math.min(2, band + (y - FLOOR < 3 ? 1 : 0))];
			if ((y - FLOOR) % 3 === 2 || (x + joint) % 24 === 0) {
				colour = BOARD_SEAM;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The little wall shelf the lamp stands on, on a bracket.
 * @param {Canvas} layer
 */
function drawShelf(layer) {
	rect(layer, 0, SHELF, 14, 1, C.timberLight);
	rect(layer, 0, SHELF + 1, 14, 1, C.timber);
	rect(layer, 0, SHELF + 2, 14, 1, C.timberShade);
	line(layer, 3, SHELF + 3, 9, SHELF + 3, C.timberShade);
	line(layer, 4, SHELF + 4, 6, SHELF + 6, C.timber);
	line(layer, 5, SHELF + 4, 7, SHELF + 6, C.timberShade);
}

/**
 * The dummy's stand below the hem: a turned wooden post on three splayed feet.
 * @param {Canvas} scene
 */
function drawStand(scene) {
	rect(scene, CX - 1, HEM, 1, 4, C.timberLight);
	rect(scene, CX, HEM, 2, 4, C.timber);
	paint(
		scene,
		CX - 6,
		HEM + 3,
		['...lttts....', '.llt...tss..', 'lt.......ss.'],
		{
			l: C.timberLight,
			t: C.timber,
			s: C.timberShade,
		}
	);
}

/**
 * The tone of the velvet at a point across the gown, from -1 at its lit left edge to 1 at its shaded right edge.
 * @param {number} side
 * @returns {Colour}
 */
function velvet(side) {
	if (side < -0.75) {
		return VELVET.lit;
	}
	if (side < -0.1) {
		return VELVET.base;
	}
	if (side < 0.6) {
		return VELVET.shade;
	}
	return VELVET.dark;
}

/**
 * The full skirt belling out over its farthingale to the hem: sapphire velvet in deep folds, open at the front over an ivory brocade forepart, edged with gold braid.
 * @param {Canvas} scene
 */
function drawSkirt(scene) {
	for (let y = WAIST; y <= HEM; y++) {
		const t = (y - WAIST) / (HEM - WAIST);
		const half = Math.round(6 + 17 * t ** 0.75);
		const open = Math.round(1 + 7 * t);
		for (let x = CX - half; x <= CX + half; x++) {
			const rel = (x - CX) / half;
			let colour;
			if (Math.abs(x - CX) < open) {
				// The forepart: ivory brocade with a small gold figure woven in.
				const figure = (x + y * 2) % 5 === 0 && y % 3 === 1;
				colour = figure
					? BROCADE.figure
					: rel < -0.1
						? BROCADE.lit
						: BROCADE.base;
				if (rel > 0.15) {
					colour = figure ? BROCADE.figure : BROCADE.shade;
				}
			} else if (Math.abs(x - CX) === open) {
				colour = rel < 0 ? GOLD.base : GOLD.shade;
			} else {
				// The velvet's folds fan out with the bell.
				const fold = Math.abs(((rel * 3.5 + 10) % 1) - 0.5);
				colour = velvet(rel);
				if (fold < 0.12 && rel < 0.6) {
					colour = rel < -0.2 ? VELVET.glint : VELVET.lit;
				} else if (fold > 0.42 && rel > -0.75) {
					colour = rel > 0.2 ? VELVET.dark : VELVET.shade;
				}
			}
			set(scene, x, y, colour);
		}
	}
	// The gold braid along the hem, with pearls set in it.
	const half = 23;
	for (let x = CX - half; x <= CX + half; x++) {
		set(scene, x, HEM, x < CX ? GOLD.base : GOLD.shade);
		if ((x - CX) % 4 === 0 && Math.abs(x - CX) > 8) {
			set(scene, x, HEM - 1, PEARL);
		}
	}
}

/**
 * The standing lace ruff: a wide fan of lace rising behind the neck, its threads radiating out to a scalloped edge.
 * @param {Canvas} scene
 */
function drawCollar(scene) {
	const cy = SHOULDER;
	for (let y = cy - 11; y <= cy; y++) {
		for (let x = CX - 13; x <= CX + 13; x++) {
			const dx = x - CX + 0.5;
			const dy = y - cy;
			const r = Math.hypot(dx / 12.5, dy / 10.5);
			// The scalloped edge: a small bite between each pair of ribs.
			const angle = Math.atan2(dy, dx);
			const scallop = Math.abs(Math.sin(angle * 7)) * 0.07;
			if (r > 1 - scallop + 0.04) {
				continue;
			}
			let colour = LACE.base;
			const rib = Math.abs(Math.sin(angle * 7)) < 0.2;
			if (r > 0.86 - scallop) {
				colour = dx < 0 ? LACE.lit : LACE.base;
			} else if (rib) {
				colour = dx < 0 ? LACE.lit : LACE.base;
			} else if ((x + y) % 2 === 0) {
				colour = LACE.open;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The dummy's neck above the gown: a short linen-covered post with a turned wooden cap.
 * @param {Canvas} scene
 */
function drawNeck(scene) {
	for (let y = 5; y < SHOULDER; y++) {
		set(scene, CX - 3, y, LINEN.lit);
		rect(scene, CX - 2, y, 3, 1, LINEN.base);
		set(scene, CX + 1, y, LINEN.shade);
		set(scene, CX + 2, y, LINEN.shade);
	}
	// The rounded top of the neck.
	rect(scene, CX - 2, 4, 4, 1, LINEN.base);
	set(scene, CX - 2, 4, LINEN.lit);
	paint(scene, CX - 2, 0, ['.lt.', 'lttt', '.ts.', 'ltts'], {
		l: C.timberLight,
		t: C.timber,
		s: C.timberShade,
	});
}

/**
 * The fitted bodice: velvet on the dummy's shoulders, narrowing to a long point, with a stomacher of gold lattice set with rubies and pearls.
 * @param {Canvas} scene
 */
function drawBodice(scene) {
	for (let y = SHOULDER; y <= WAIST + 3; y++) {
		let half = 9 - Math.round(Math.max(0, y - SHOULDER - 2) * 0.22);
		if (y === SHOULDER) {
			half = 7;
		}
		if (y > WAIST) {
			half = Math.min(half, 4 - (y - WAIST));
		}
		const stomacher = 4 - Math.round((y - SHOULDER) * 0.12);
		for (let x = CX - half; x <= CX + half; x++) {
			const rel = (x - CX) / Math.max(1, half);
			let colour = velvet(rel);
			if (Math.abs(x - CX) < stomacher && y > SHOULDER) {
				// The stomacher: a panel of gold lattice over the velvet, a jewel at each crossing.
				const a = (x - CX + y + 60) % 6 === 0;
				const b = (x - CX - y + 60) % 6 === 0;
				colour = rel < 0 ? VELVET.lit : VELVET.base;
				if (a || b) {
					colour = rel < 0 ? GOLD.base : GOLD.shade;
				}
				if (a && b) {
					colour = y % 12 < 6 ? RUBY : PEARL;
				}
			} else if (Math.abs(x - CX) === stomacher && y > SHOULDER) {
				colour = x < CX ? GOLD.lit : GOLD.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The square neckline's gold edge, across the top of the bodice.
	for (let x = CX - 6; x <= CX + 6; x++) {
		set(scene, x, SHOULDER, x < CX ? GOLD.lit : GOLD.base);
	}
}

/**
 * The great puffed sleeves, padded so they keep their shape on the armless dummy: velvet paned over gold silk, gathered into lace frills.
 * @param {Canvas} scene
 */
function drawSleeves(scene) {
	for (const dir of [-1, 1]) {
		const cx = CX + dir * 11;
		const cy = SHOULDER + 5;
		for (let y = cy - 6; y <= cy + 6; y++) {
			for (let x = cx - 6; x <= cx + 6; x++) {
				const r = Math.hypot((x - cx) / 6, (y - cy) / 6.5);
				if (r > 1) {
					continue;
				}
				const rel = (x - cx) / 6;
				// Gold silk puffing out between the velvet panes.
				const slash = (x - cx + 20) % 3 === 0 && r < 0.85;
				let colour;
				if (slash) {
					colour =
						rel < -0.2
							? GOLD.lit
							: rel > 0.4
								? GOLD.shade
								: GOLD.base;
				} else if (rel + (y - cy) / 12 < -0.55) {
					colour = VELVET.glint;
				} else {
					colour = velvet(rel * 0.8 + (dir > 0 ? 0.4 : -0.1));
				}
				set(scene, x, y, colour);
			}
		}
		// The lace frill where the puff is gathered in.
		for (let x = cx - 4; x <= cx + 4; x++) {
			set(scene, x, cy + 7, x % 2 ? LACE.base : LACE.lit);
			if (x % 2 === 0) {
				set(scene, x, cy + 8, LACE.open);
			}
		}
	}
}

/**
 * The yellow tape measure slung round the dummy's neck: one end down the front of the bodice, the other over the far shoulder and hanging free beside the skirt.
 * @param {Canvas} scene
 */
function drawTape(scene) {
	// Round the neck.
	for (let x = CX - 3; x <= CX + 2; x++) {
		set(scene, x, 11, x < CX ? TAPE : TAPE_SHADE);
		set(scene, x, 12, x % 2 ? TICK : TAPE_SHADE);
	}
	/** @type {[number, number][][]} */
	const ends = [
		[
			[CX - 3, 12],
			[CX - 5, 17],
			[CX - 6, 30],
		],
		[
			[CX + 2, 12],
			[CX + 9, 14],
			[CX + 17, 18],
			[CX + 19, 24],
			[CX + 19, 36],
		],
	];
	for (const points of ends) {
		let step = 0;
		for (let i = 0; i < points.length - 1; i++) {
			const [x0, y0] = points[i];
			const [x1, y1] = points[i + 1];
			const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
			for (let k = 0; k <= n; k++) {
				const x = Math.round(x0 + ((x1 - x0) * k) / n);
				const y = Math.round(y0 + ((y1 - y0) * k) / n);
				const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
				set(scene, x, y, TAPE);
				// The tape is two pixels wide: its ticked edge below or beside it.
				set(
					scene,
					x + (steep ? 1 : 0),
					y + (steep ? 0 : 1),
					step % 2 ? TICK : TAPE_SHADE
				);
				step++;
			}
		}
		// The brass tab on the end.
		const [ex, ey] = points[points.length - 1];
		rect(scene, ex, ey + 1, 2, 2, C.brass);
		set(scene, ex, ey + 1, C.gold);
	}
}

/**
 * The oil lamp on its shelf: a brass font and a glass chimney, the flame painted last.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	// The brass font on its foot, and the burner's collar above it.
	paint(
		scene,
		FLAME.x - 3,
		SHELF - 6,
		['.ccccc.', '.bBBBs.', 'bBBBBBs', 'bBBBBBs', '.sbbbs.', '..bBs..'],
		{ c: C.lampFrame, B: C.gold, b: C.brass, s: C.lampFrame }
	);
	// The glass chimney: a bulge round the flame narrowing to a tall neck.
	paint(
		scene,
		FLAME.x - 2,
		SHELF - 16,
		[
			'.eee.',
			'.eGe.',
			'.eGe.',
			'eHGGe',
			'eHGGe',
			'eHGGe',
			'eGGGe',
			'.eGe.',
			'.eee.',
		],
		{ e: GLASS_EDGE, G: GLASS, H: C.white }
	);
}

/**
 * The flame inside the chimney, painted over the glow so it keeps its colours.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(scene, FLAME.x - 1, FLAME.y - 1, ['.w', 'wW', 'ag'], {
		w: C.lampGlow,
		W: C.white,
		g: C.gold,
		a: C.amber,
	});
}

/**
 * The feathered half mask hanging from a brass hook: gilt with dark eyeholes, a red and a white feather sweeping up from one side and its ribbon's tails hanging below.
 * @param {Canvas} scene
 */
function drawMask(scene) {
	const { x, y } = HOOK;
	// The plume: two broad feathers curving up and out from the mask's right side, each lit along one edge.
	/** @type {[number, number, Colour, Colour, Colour][]} */
	const feathers = [
		[0, 12, PLUME.white, PLUME.white, PLUME.whiteShade],
		[3, 10, PLUME.redLit, PLUME.red, C.brickRedShade],
	];
	for (const [lean, length, lit, base, shade] of feathers) {
		for (let i = 0; i < length; i++) {
			const fx = x + 3 + lean + Math.round((i * i) / 30);
			const fy = y + 6 - i + Math.round(lean / 2);
			const wide = i > 1 && i < length - 2;
			set(scene, fx, fy, lit);
			set(scene, fx + 1, fy, base);
			if (wide) {
				set(scene, fx + 2, fy, shade);
			}
		}
	}
	// The hook.
	rect(scene, x - 1, y + 3, 2, 3, C.brass);
	set(scene, x - 1, y + 3, C.gold);
	// The mask itself.
	paint(
		scene,
		x - 7,
		y + 6,
		[
			'.lLLLLLLLLLb.',
			'lLLLLLLLLLLbs',
			'lLeeeLbLeeebs',
			'.lLeeLbbLeebs',
			'..lLLb.bLLs..',
			'...lb...bs...',
		],
		{
			L: GOLD.base,
			l: GOLD.lit,
			b: GOLD.shade,
			s: GOLD.dark,
			e: C.ink,
		}
	);
	// A ruby on the mask's brow.
	set(scene, x - 1, y + 7, RUBY);
	// The ribbon's tails hanging below each side.
	line(scene, x - 7, y + 8, x - 8, y + 15, PLUME.red);
	line(scene, x - 6, y + 10, x - 6, y + 13, C.brickRedShade);
	line(scene, x + 5, y + 9, x + 6, y + 14, C.brickRedShade);
}

/**
 * The dressmaker's pins stuck into the gown, each a bright head on a fine steel shaft.
 * @param {Canvas} scene
 */
function drawPins(scene) {
	/** @type {[number, number, Colour][]} */
	const pins = [
		[CX - 15, 16, RUBY],
		[CX + 13, 15, C.tealLight],
		[CX - 12, 47, C.white],
		[CX - 9, 51, RUBY],
		[CX + 15, 49, C.tealLight],
	];
	for (const [x, y, head] of pins) {
		set(scene, x, y, head);
		set(scene, x + 1, y + 1, C.stoneLight);
	}
}

/**
 * Glints of lamplight on the gold and the jewels.
 * @param {Canvas} scene
 */
function drawSparkles(scene) {
	for (const [x, y] of [
		[CX - 2, 20],
		[CX - 13, 15],
		[CX - 17, 55],
	]) {
		set(scene, x, y, C.white);
	}
	set(scene, CX - 1, 0, C.lampGlow);
}
