// Anesthesia: a glass ether inhaler with a brass mouthpiece and a tray of surgical tools, a patient asleep on the table under a hanging lamp, the tiered benches of an old operating theatre in shadow.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The hanging lamp's dome, over the patient's head and chest. */
const LAMP = { x: 16, y: 6 };

/** The glass globe of the inhaler: its centre and radius. */
const GLOBE = { x: 37, y: 40, r: 15.5 };

/** The mouthpiece's neck leaves the globe up and to the left, towards the patient's face. */
const MOUTH_ANGLE = (220 / 180) * Math.PI;

/** The operating table's mattress row, and the instrument table's back and front edges. */
const MATTRESS = 27;
const BENCH = { back: 54, front: 61 };

/** The lamp's warm light. */
const LAMPLIGHT = mix(C.lampGlow, C.amber, 0.3);

/** The theatre in shadow: the dark, the tiers' rails and their panelled fronts. */
const DARK = mix(C.nightSky1, C.ink, 0.35);
const RAIL_LIGHT = mix(C.timberLight, C.lampGlow, 0.15);
const RAIL = mix(C.timber, C.nightSky2, 0.25);
const PANEL = mix(C.timberShade, C.nightSky2, 0.3);
const PANEL_SHADE = mix(C.wood, C.ink, 0.5);

/** Onlookers on the tiers: dark coats, white collars, and faces and hat brims caught by the lamp. */
const COAT = mix(C.nightSky1, C.ink, 0.3);
const HAT_EDGE = mix(C.roofLight, C.nightSky2, 0.55);
const FACE = mix(C.skinShade, C.nightSky3, 0.2);
const FACE_LIT = mix(C.skin, C.lampGlow, 0.15);
const COLLAR = mix(C.creamShade, C.nightSky3, 0.3);

/** Clear glass: the pale tint it lays over what shows through it, its lit band, rims and the lamplight bent inside it. */
const TINT = mix(C.foam, C.white, 0.4);
const GLASS_LIT = mix(C.foam, C.white, 0.55);
const RIM_LIGHT = C.white;
const RIM_SHADE = mix(C.foam, C.stoneShade, 0.45);
const CAUSTIC = mix(C.lampGlow, C.foam, 0.35);

/** The sea sponge, pale and soaked in ether, and its holes. */
const SPONGE_LIGHT = mix(C.sandLight, C.creamLight, 0.5);
const SPONGE = C.sandLight;
const SPONGE_SHADE = C.sand;
const SPONGE_HOLE = C.sandShade;

/** The ether vapour drifting from the face-cup. */
const VAPOUR = C.white;

/** The sheet's fold shadows where it hangs over the table's edge. */
const SHEET_SHADE = mix(C.creamShade, C.stoneShade, 0.5);

/** The instrument table's polished mahogany. */
const MAHOGANY_LIGHT = mix(C.timber, C.brickRedShade, 0.45);
const MAHOGANY = mix(C.timberShade, C.brickRedShade, 0.4);
const MAHOGANY_SHADE = mix(C.wood, C.brickRedShade, 0.25);

/** The leather face-cup on the mouthpiece. */
const LEATHER = mix(C.brickRedShade, C.wood, 0.4);
const LEATHER_LIGHT = mix(C.brickRedShade, C.timberLight, 0.4);

/** The amber ether bottle and its rubber dropper bulb. */
const BOTTLE = mix(C.amber, C.lampFrame, 0.35);
const BOTTLE_SHADE = mix(C.lampFrame, C.wood, 0.4);
const BULB = mix(C.brickRedShade, C.wood, 0.2);

/** Steel for the tools, bright against the tray's dull inside. */
const STEEL_LIGHT = mix(C.stoneLight, C.white, 0.6);
const TRAY_INSIDE = mix(C.stoneShade, C.roofShade, 0.3);

/** Blood on the scalpel and the cloths. */
const BLOOD = C.brickRed;
const BLOOD_DARK = C.brickRedShade;

/**
 * Draws the Anesthesia tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const middle = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1846);

	drawTheatre(layer, random);
	drawPit(layer);
	drawLightCone(layer);

	// The lamp, the table and the patient stand behind the inhaler, so they get their own outline.
	drawLamp(middle);
	drawTable(middle);
	drawPatient(middle);
	outline(middle, C.ink);
	underlay(middle, layer);

	drawInstrumentTable(scene);
	drawTray(scene);
	drawTowel(scene);
	drawBottle(scene);
	drawGlobe(scene, middle, random);
	drawStand(scene);
	drawMouthpiece(scene);
	drawAirCap(scene);
	outline(scene, C.ink);
	underlay(scene, middle);

	glow(scene, {
		x: LAMP.x,
		y: LAMP.y + 2,
		radius: 40,
		colour: LAMPLIGHT,
		strength: 0.3,
		steps: 3,
		skip: [C.ink],
	});
	drawLampLight(scene);
	drawGleams(scene);
	drawVapour(scene);
	return scene;
}

/**
 * How far a tier's rail climbs at a column, because the tiers curve round the pit.
 * @param {number} x
 * @returns {number}
 */
function rise(x) {
	return Math.round(0.012 * (x - 30) ** 2);
}

/**
 * The theatre behind: tiers of standing rails curving round the pit, panelled below,
 * with onlookers in top hats leaning on them in the dark.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTheatre(layer, random) {
	rect(layer, 0, 0, 64, 64, DARK);
	// The highest tier first, so each lower tier's panel hides the coats of the onlookers behind it.
	for (let tier = 3; tier >= 0; tier--) {
		const base = 21 - tier * 10;
		for (
			let x = 1 + Math.floor(random() * 3);
			x < 63;
			x += 5 + Math.floor(random() * 3)
		) {
			if (random() < 0.3) {
				continue;
			}
			const top = base - Math.max(rise(x), rise(x + 1));
			const face = random() < 0.75;
			// The coat and collar behind the rail, the face lit on the lamp's side, and the top hat with its brim.
			rect(layer, x - 1, top - 1, 4, 1, COAT);
			set(layer, x, top - 1, face ? COLLAR : COAT);
			rect(layer, x, top - 3, 2, 2, face ? FACE : COAT);
			if (face) {
				set(layer, x < LAMP.x ? x + 1 : x, top - 3, FACE_LIT);
			}
			rect(layer, x - 1, top - 4, 4, 1, HAT_EDGE);
			rect(layer, x, top - 6, 2, 2, COAT);
			set(layer, x < LAMP.x ? x + 1 : x, top - 6, HAT_EDGE);
		}
		for (let x = 0; x < 64; x++) {
			const top = base - rise(x);
			set(layer, x, top, RAIL_LIGHT);
			set(layer, x, top + 1, RAIL);
			for (let k = 2; k <= 5; k++) {
				const post = (x + tier * 3) % 6 === 0;
				set(layer, x, top + k, post ? PANEL_SHADE : PANEL);
			}
			set(layer, x, top + 6, PANEL_SHADE);
			for (let k = 7; k <= 9; k++) {
				set(layer, x, top + k, DARK);
			}
		}
	}
}

/**
 * The floor of the pit, dark boards under the table.
 * @param {Canvas} layer
 */
function drawPit(layer) {
	for (let y = 38; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.floorShade, C.nightSky2, 0.45);
			if ((y - 38) % 3 === 2) {
				colour = mix(C.floorShade, C.ink, 0.45);
			} else if (y === 38) {
				colour = PANEL_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * A soft cone of lamplight falling from the dome onto the patient.
 * @param {Canvas} layer
 */
function drawLightCone(layer) {
	for (let y = LAMP.y + 3; y < 38; y++) {
		const half = 4 + (y - LAMP.y) * 0.5;
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && Math.abs(x - LAMP.x) < half) {
				set(layer, x, y, mix(colour, C.lampGlow, 0.12));
			}
		}
	}
}

/**
 * The hanging lamp: a chain, a brass smoke bell and a glowing opal dome over the brass font.
 * @param {Canvas} canvas
 */
function drawLamp(canvas) {
	const { x, y } = LAMP;
	for (let j = 0; j < y - 5; j++) {
		set(canvas, x, j, j % 2 ? C.brass : C.lampFrame);
	}
	rect(canvas, x - 1, y - 5, 3, 1, C.brass);
	// The opal dome, rounded, brightest round the chimney and on its lamp-lit crown.
	const widths = [2, 4, 5, 6, 7];
	widths.forEach((half, j) => {
		for (let i = -half; i <= half; i++) {
			let colour = C.lampGlow;
			if (Math.abs(i) < 2 && j < 3) {
				colour = C.white;
			} else if (Math.abs(i) === half) {
				colour = i < 0 ? C.gold : C.amber;
			}
			set(canvas, x + i, y - 4 + j, colour);
		}
	});
	// The brass rim and the font hanging below it.
	rect(canvas, x - 8, y + 1, 17, 1, C.brass);
	rect(canvas, x - 8, y + 1, 6, 1, C.gold);
	rect(canvas, x - 3, y + 2, 7, 1, C.amber);
	rect(canvas, x - 2, y + 3, 5, 1, C.lampFrame);
}

/**
 * The operating table: a sheet hanging well down over its front edge, its wooden apron and its legs.
 * @param {Canvas} canvas
 */
function drawTable(canvas) {
	for (let x = 0; x <= 62; x++) {
		set(canvas, x, MATTRESS, C.cream);
		for (let k = 1; k <= 5; k++) {
			const fold = (x + k) % 6 === 0;
			let colour = fold ? C.cream : C.creamShade;
			if (k === 5) {
				colour = x % 3 === 0 ? SHEET_SHADE : C.creamShade;
			}
			set(canvas, x, MATTRESS + k, colour);
		}
		set(canvas, x, MATTRESS + 6, C.timber);
		set(canvas, x, MATTRESS + 7, C.timberShade);
	}
	for (const lx of [3, 59]) {
		rect(canvas, lx, MATTRESS + 8, 2, 9, C.timberShade);
		set(canvas, lx, MATTRESS + 8, C.timber);
	}
}

/**
 * The patient asleep on their back: the head thrown back on a pillow with the eyes shut and the mouth slack,
 * the body under the sheet, and one bare arm hanging limp over the edge.
 * @param {Canvas} canvas
 */
function drawPatient(canvas) {
	const left = 4;
	// The pillow.
	rect(canvas, left, MATTRESS - 3, 12, 3, C.creamLight);
	rect(canvas, left, MATTRESS - 1, 12, 1, C.cream);
	// The bare shoulder and chest above the sheet.
	for (let x = left + 11; x <= left + 16; x++) {
		const h = x < left + 13 ? 3 : 4;
		for (let k = 1; k <= h; k++) {
			set(canvas, x, MATTRESS - k, k === h ? C.skin : C.skinShade);
		}
	}
	// The body under the sheet: the chest, the belly, the legs and the feet raising it at the end.
	for (let x = left + 17; x <= 61; x++) {
		let h = 2;
		if (x < left + 26) {
			h = 6 - Math.round(Math.abs(x - left - 20) / 2.5);
		} else if (x < left + 36) {
			h = 3;
		} else if (x >= 55 && x <= 58) {
			h = x === 55 || x === 58 ? 4 : 5;
		}
		const far = x > 42;
		for (let k = 1; k <= h; k++) {
			let colour = far ? C.creamShade : C.cream;
			if (k === h) {
				colour = far ? C.cream : C.creamLight;
			} else if (k === 1) {
				colour = far ? SHEET_SHADE : C.creamShade;
			}
			set(canvas, x, MATTRESS - k, colour);
		}
	}
	// The sheet's turned-down edge across the chest.
	for (let k = 1; k <= 5; k++) {
		set(canvas, left + 17, MATTRESS - k, C.creamLight);
	}
	// The head, thrown back with the face turned up and the eyes shut: H hair, h its shade, B the sideburns,
	// S skin, s shade, E the ear, e the closed eyelid, n the nostril, m the slack open mouth.
	paint(
		canvas,
		left,
		MATTRESS - 11,
		[
			'........S....',
			'..HHSS.SS....',
			'.HHHSeeSnSm..',
			'.HHHSSSSSSSS.',
			'HHHHSESSSSSsS',
			'hHHHhhSBBsssS',
			'hhhhhhhBBB..s',
			'.hhhhhh......',
		],
		{
			H: C.timber,
			h: C.timberShade,
			B: C.timberShade,
			S: C.skin,
			s: C.skinShade,
			E: C.skinShade,
			e: C.wood,
			n: C.skinShade,
			m: C.ink,
		}
	);
	// The arm hanging limp from the shoulder over the table's edge, the hand curled.
	for (let y = MATTRESS - 1; y <= MATTRESS + 6; y++) {
		set(canvas, left + 15, y, C.skin);
		set(canvas, left + 16, y, C.skinShade);
	}
	paint(canvas, left + 14, MATTRESS + 7, ['SSs', 'Sss', '.s.'], {
		S: C.skin,
		s: C.skinShade,
	});
}

/**
 * The instrument table in front: a polished mahogany top and its front edge.
 * @param {Canvas} canvas
 */
function drawInstrumentTable(canvas) {
	for (let y = BENCH.back; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = MAHOGANY;
			if (y === BENCH.back || y === BENCH.front) {
				colour = MAHOGANY_LIGHT;
			} else if (y > BENCH.front) {
				colour = MAHOGANY_SHADE;
			} else if ((x * 5 + y * 3) % 17 === 0) {
				colour = MAHOGANY_SHADE;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The steel tray of tools on the left: a long scalpel bloody at the tip, and a pair of forceps lying open.
 * @param {Canvas} canvas
 */
function drawTray(canvas) {
	const top = 55;
	const bottom = 60;
	for (let y = top; y <= bottom; y++) {
		const inset = Math.round((bottom - y) * 0.4);
		const left = 1 + inset;
		const right = 24 - inset;
		for (let x = left; x <= right; x++) {
			let colour = TRAY_INSIDE;
			if (y === top || x === left) {
				colour = C.stoneLight;
			} else if (y === bottom || x === right) {
				colour = C.stone;
			}
			set(canvas, x, y, colour);
		}
	}
	// The scalpel: a dark handle and a long bright blade, bloody at the tip.
	line(canvas, 4, 59, 6, 58, C.wood);
	line(canvas, 7, 58, 13, 56, STEEL_LIGHT);
	set(canvas, 14, 56, BLOOD);
	set(canvas, 13, 57, BLOOD_DARK);
	// The forceps, lying open in a wide V from their hinge.
	line(canvas, 15, 59, 21, 56, STEEL_LIGHT);
	line(canvas, 15, 59, 22, 59, STEEL_LIGHT);
	set(canvas, 15, 59, C.stoneLight);
}

/**
 * A small amber bottle of ether with a dropper, standing beside the globe.
 * @param {Canvas} canvas
 */
function drawBottle(canvas) {
	paint(
		canvas,
		55,
		45,
		[
			'..rr..',
			'..rr..',
			'..dd..',
			'.bbbb.',
			'BbbbbS',
			'BbbbbS',
			'BbbbbS',
			'BbbbbS',
			'BbbbbS',
			'.SSSS.',
		],
		{
			r: BULB,
			d: C.stoneShade,
			b: BOTTLE,
			B: C.gold,
			S: BOTTLE_SHADE,
		}
	);
}

/**
 * A towel hanging over the instrument table's front edge on the right, stained with blood.
 * @param {Canvas} canvas
 */
function drawTowel(canvas) {
	paint(
		canvas,
		50,
		57,
		[
			'.cccccccc.',
			'cccCcccrcc',
			'cCcccrRccc',
			'CCCCCCCCCC',
			'cccCcccRcc',
			'cccCccccrc',
			'ccCcccc.cC',
		],
		{
			c: C.cream,
			C: C.creamShade,
			r: BLOOD,
			R: BLOOD_DARK,
		}
	);
}

/**
 * The turned wooden ring the globe rests in, on the instrument table.
 * @param {Canvas} canvas
 */
function drawStand(canvas) {
	const { x: cx, y: cy, r } = GLOBE;
	const bottom = cy + Math.ceil(r);
	for (let i = -9; i <= 9; i++) {
		const lift = Math.abs(i) > 6 ? 1 : 0;
		set(canvas, cx + i, bottom - 2 + lift, C.timberLight);
		set(canvas, cx + i, bottom - 1 + lift, C.timber);
		set(canvas, cx + i, bottom + lift, C.timber);
		set(canvas, cx + i, bottom + 1, C.timberShade);
	}
	rect(canvas, cx - 7, bottom + 2, 15, 1, C.timberShade);
}

/**
 * The clear glass globe: the room seen through it, a pale sea sponge soaked in ether held in its middle,
 * a rim of light on the lamp side and the lamp's reflection.
 * @param {Canvas} scene
 * @param {Canvas} behind - The finished middle layer, seen through the glass
 * @param {() => number} random
 */
function drawGlobe(scene, behind, random) {
	const { x: cx, y: cy, r } = GLOBE;
	const reach = Math.ceil(r);
	for (let y = cy - reach; y <= cy + reach; y++) {
		for (let x = cx - reach; x <= cx + reach; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d >= r) {
				continue;
			}
			const facing = (-dx - dy) / (d || 1);
			// The room shows through the clear glass under a pale tint.
			let colour = mix(get(behind, x, y) ?? DARK, TINT, 0.4);
			if (d >= r - 1.1) {
				colour = facing > 0 ? RIM_LIGHT : RIM_SHADE;
			} else if (d >= r - 2.2 && facing > 0.3) {
				colour = GLASS_LIT;
			} else if (d >= r - 3.4 && facing < -0.45) {
				// Lamplight bent round the far wall of the glass.
				colour = CAUSTIC;
			}
			set(scene, x, y, colour);
		}
	}
	drawSponge(scene, random);
	// The lamp's reflection, and a long curved gleam on the lamp side.
	rect(scene, cx - 9, cy - 9, 3, 2, C.white);
	set(scene, cx - 8, cy - 10, C.white);
	set(scene, cx - 10, cy - 7, C.white);
	for (let a = 0; a < 12; a++) {
		const angle = Math.PI * 1.02 + a * 0.075;
		set(
			scene,
			Math.round(cx + Math.cos(angle) * (r - 3)),
			Math.round(cy + Math.sin(angle) * (r - 3)),
			mix(RIM_LIGHT, TINT, 0.25)
		);
	}
}

/**
 * The sea sponge held in the middle of the globe: a pale lumpy mass full of holes, wet and glistening,
 * with a little pool of ether under it.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSponge(scene, random) {
	const { x: cx, y: cy, r } = GLOBE;
	const lumps = [
		[cx - 5, cy + 4, 4.4],
		[cx + 1, cy + 2.5, 5],
		[cx + 6, cy + 4.5, 4],
		[cx - 1, cy + 7, 4.4],
		[cx + 4, cy + 7.5, 3.8],
	];
	for (let y = cy - 4; y <= cy + Math.ceil(r); y++) {
		for (let x = cx - 12; x <= cx + 12; x++) {
			if (Math.hypot(x - cx, y - cy) >= r - 1.1) {
				continue;
			}
			const inside = lumps.find(
				([lx, ly, lr]) => Math.hypot(x - lx, y - ly) < lr
			);
			if (!inside) {
				continue;
			}
			const [lx, ly, lr] = inside;
			const facing = (lx - x + (ly - y)) / lr;
			let colour = SPONGE;
			if (facing > 0.9) {
				colour = SPONGE_LIGHT;
			} else if (facing < -0.6) {
				colour = SPONGE_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The holes, scattered through it.
	for (let i = 0; i < 18; i++) {
		const x = cx - 9 + Math.floor(random() * 18);
		const y = cy - 1 + Math.floor(random() * 11);
		const colour = get(scene, x, y);
		if (colour === SPONGE || colour === SPONGE_SHADE) {
			set(scene, x, y, SPONGE_HOLE);
		}
	}
	// Wet gleams on its top, and drops of ether gathered under it.
	for (const [x, y] of [
		[cx - 6, cy + 1],
		[cx - 5, cy + 1],
		[cx, cy - 2],
		[cx + 1, cy - 2],
		[cx + 5, cy + 2],
	]) {
		set(scene, x, y, C.white);
	}
	for (const [x, y] of [
		[cx - 2, cy + 13],
		[cx + 3, cy + 13],
		[cx - 1, cy + 14],
		[cx, cy + 14],
		[cx + 1, cy + 14],
		[cx + 2, cy + 14],
	]) {
		set(scene, x, y, GLASS_LIT);
	}
}

/**
 * The mouthpiece, reaching up and to the left towards the patient's face: a glass neck, a brass collar,
 * a brass tube flaring into a cone, and a dark leather face-cup on its end.
 * @param {Canvas} canvas
 */
function drawMouthpiece(canvas) {
	const { x: cx, y: cy, r } = GLOBE;
	const along = [Math.cos(MOUTH_ANGLE), Math.sin(MOUTH_ANGLE)];
	const across = [-along[1], along[0]];
	const start = [cx + along[0] * (r - 1.5), cy + along[1] * (r - 1.5)];
	for (let y = 10; y < 40; y++) {
		for (let x = 4; x < 30; x++) {
			const px = x + 0.5 - start[0];
			const py = y + 0.5 - start[1];
			const u = px * along[0] + py * along[1];
			const v = px * across[0] + py * across[1];
			const colour = mouthpieceColour(u, v);
			if (colour) {
				set(canvas, x, y, colour);
			}
		}
	}
}

/**
 * Picks the colour of one point of the mouthpiece, measured along it from the globe (`u`)
 * and across it (`v`, positive on the side facing the lamp).
 * @param {number} u
 * @param {number} v
 * @returns {Colour | null}
 */
function mouthpieceColour(u, v) {
	const lit = v > 0.8 ? 0 : v > -0.8 ? 1 : 2;
	const brass = [C.gold, C.brass, C.amber][lit];
	if (u >= 0 && u < 3 && Math.abs(v) < 2.6) {
		return [RIM_LIGHT, TINT, RIM_SHADE][lit];
	}
	if (u >= 3 && u < 5 && Math.abs(v) < 3.6) {
		return v > 1.6 ? C.lampGlow : brass;
	}
	if (u >= 5 && u < 8.5 && Math.abs(v) < 2.1) {
		return brass;
	}
	const flare = 2.1 + (u - 8.5) * 0.85;
	if (u >= 8.5 && u < 12 && Math.abs(v) < flare) {
		return Math.abs(v) > flare - 1 && v > 0 ? C.lampGlow : brass;
	}
	if (u >= 12 && u < 14.2 && Math.abs(v) < 5.4) {
		return v > 3 ? LEATHER_LIGHT : LEATHER;
	}
	return null;
}

/**
 * The brass cap on the globe's other neck, where the air comes in.
 * @param {Canvas} canvas
 */
function drawAirCap(canvas) {
	const { x: cx, y: cy, r } = GLOBE;
	const neck = cx + Math.ceil(r);
	for (let y = cy - 2; y <= cy + 2; y++) {
		for (let x = neck; x <= neck + 1; x++) {
			let colour = TINT;
			if (y === cy - 2) {
				colour = RIM_LIGHT;
			} else if (y === cy + 2) {
				colour = RIM_SHADE;
			}
			set(canvas, x, y, colour);
		}
	}
	for (let y = cy - 3; y <= cy + 3; y++) {
		set(canvas, neck + 2, y, C.gold);
		set(canvas, neck + 3, y, C.brass);
		set(canvas, neck + 4, y, C.amber);
	}
	rect(canvas, neck + 5, cy - 1, 2, 3, C.lampFrame);
	set(canvas, neck + 5, cy - 1, C.brass);
}

/**
 * The heart of the lamp's dome, kept at full brightness over the glow.
 * @param {Canvas} scene
 */
function drawLampLight(scene) {
	const { x, y } = LAMP;
	rect(scene, x - 1, y - 4, 3, 3, C.white);
}

/**
 * The last gleams of lamplight on the brass, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	const { x: cx, y: cy, r } = GLOBE;
	const along = [Math.cos(MOUTH_ANGLE), Math.sin(MOUTH_ANGLE)];
	const across = [-along[1], along[0]];
	for (const [u, v] of [
		[r + 2.5, 2.6],
		[r + 8.5, 2.3],
	]) {
		set(
			scene,
			Math.floor(cx + along[0] * u + across[0] * v),
			Math.floor(cy + along[1] * u + across[1] * v),
			C.white
		);
	}
}

/**
 * Wisps of ether vapour from the face-cup: a breath drawn towards the patient's mouth, and two curling up past the face
 * into the dark, painted over the outline.
 * @param {Canvas} scene
 */
function drawVapour(scene) {
	for (const [wisp, strength] of [
		[
			[
				[17, 21],
				[16, 20],
				[15, 19],
			],
			0.55,
		],
		[
			[
				[19, 19],
				[19, 18],
				[18, 17],
				[18, 16],
				[18, 15],
				[17, 14],
				[17, 13],
				[16, 12],
				[16, 11],
			],
			0.8,
		],
		[
			[
				[21, 20],
				[22, 19],
				[22, 18],
				[23, 17],
				[23, 16],
				[23, 15],
				[24, 14],
			],
			0.7,
		],
	]) {
		const points = /** @type {[number, number][]} */ (wisp);
		points.forEach(([x, y], i) => {
			const colour = get(scene, x, y);
			if (colour) {
				const fade =
					/** @type {number} */ (strength) *
					(1 - i / (points.length + 2));
				set(scene, x, y, mix(colour, VAPOUR, fade));
			}
		});
	}
}
