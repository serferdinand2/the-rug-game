// TV Station: a big grey studio camera on its wheeled pedestal, its red tally light lit, aimed across the dark studio at an empty news desk lit bright before a blue backdrop, lamps hanging from the grid above and cables snaking over the floor.
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

/** The studio floor's first row. */
const FLOOR = 48;

/** The set: the blue backdrop's box, and the riser the desk stands on. */
const BACKDROP = { left: 37, top: 12, bottom: 44 };
const RISER = { left: 34, top: 44, bottom: 47 };

/** The news desk: its top's row and its left end, and the empty chair behind it. */
const DESK = { left: 40, top: 33, bottom: 43 };
const CHAIR = { left: 54, right: 60, top: 24 };

/** The globe on the backdrop, drawn in lines of light. */
const GLOBE = { x: 56, y: 20, r: 6 };

/** Where the lamps hang from the grid, and the point on the desk they are all aimed at. */
const LAMPS = [
	{ x: 39, y: 4 },
	{ x: 50, y: 4 },
	{ x: 60, y: 4 },
];
const AIM = { x: 51, y: 35 };

/** The camera: its body, the viewfinder on top, the lens barrel and hood, and the tally lamp. */
const BODY = { left: 9, right: 31, top: 14, bottom: 31 };
const FINDER = { left: 12, right: 24, top: 7, bottom: 13 };
const LENS = { left: 32, right: 42, y: 23, half: 5 };
const HOOD = { left: 42, right: 46, half: 7 };
const TALLY = { x: 27, y: 11 };

/** The pedestal: its column's centre, the steering ring round it, and the skirted base on its wheels. */
const COLUMN = { x: 21, top: 35, step: 42, bottom: 51 };
const RING = { x: 21, y: 42, rx: 12, ry: 2.6 };
const BASE = { top: 51, bottom: 57 };

/** The dark studio: a navy curtain behind the camera, darker towards the grid. */
const DARK = mix(C.ink, C.night, 0.5);
const CURTAIN = mix(C.night, C.nightSea3, 0.45);
const CURTAIN_LIGHT = mix(C.night, C.nightSea2, 0.7);
const CURTAIN_DARK = mix(C.ink, C.nightSea3, 0.3);

/** The floor: dark grey, glossy enough to catch the set's light. */
const FLOOR_BASE = mix(C.night, C.stoneShade, 0.3);
const FLOOR_DARK = mix(C.ink, C.stoneShade, 0.15);
const FLOOR_SHINE = mix(C.night, C.stoneShade, 0.6);

/** The lamps' light falling through the dark onto the desk. */
const BEAM = C.lampGlow;

/** The backdrop: a deep broadcast blue, brightest behind the desk. */
const SET_DARK = mix(C.daySky1, C.nightSea3, 0.55);
const SET = mix(C.daySky1, C.nightSea2, 0.2);
const SET_LIGHT = C.daySky2;
const SET_LINE = C.daySky5;

/** The camera's grey shell, cool like the station's walls, lit from the grid above and the set ahead. */
const SHELL_GLINT = C.stoneLight;
const SHELL_LIGHT = mix(C.stoneLight, C.stone, 0.5);
const SHELL = C.stone;
const SHELL_MID = C.stoneMid;
const SHELL_SHADE = C.stoneShade;
const SHELL_DARK = mix(C.stoneShade, C.night, 0.5);

/** The lens: black barrels with a lit rim, and coated glass that holds the set's blue. */
const LENS_LIGHT = mix(C.stoneShade, C.night, 0.3);
const LENS_BASE = mix(C.night, C.stoneShade, 0.2);
const LENS_DARK = mix(C.ink, C.night, 0.4);
const GLASS = mix(C.arcaneShade, C.nightSea3, 0.5);
const GLASS_LIGHT = mix(C.daySky3, C.arcane, 0.4);

/** The cables: thick black rubber with a dull sheen. */
const CABLE = mix(C.ink, C.night, 0.6);
const CABLE_LIGHT = mix(C.night, C.stoneShade, 0.55);

/** The tally lamp: a red lens with a hot centre. */
const TALLY_HOT = mix(C.brickRedLight, C.white, 0.45);

/**
 * Draws the TV Station landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1936);

	drawStudio(layer, random);
	drawFloor(layer, random);
	drawBackdrop(layer);
	drawBeams(layer);
	drawGrid(layer);

	for (const lamp of LAMPS) {
		drawLamp(scene, lamp);
	}
	drawRiser(scene);
	drawChair(scene);
	drawDesk(scene);
	drawCables(scene);
	drawRingHalf(scene, 'back');
	drawColumn(scene);
	drawRingHalf(scene, 'front');
	drawBase(scene);
	drawPanBars(scene);
	drawBody(scene);
	drawFinder(scene);
	drawLens(scene);
	drawTally(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	// The lamps flood the desk, and the tally lamp throws a little red round itself.
	glow(scene, {
		x: AIM.x,
		y: AIM.y,
		radius: 17,
		colour: C.lampGlow,
		strength: 0.24,
		steps: 2,
		skip: [C.ink, C.white, C.creamLight],
	});
	glow(scene, {
		x: TALLY.x + 1,
		y: TALLY.y,
		radius: 5,
		colour: C.brickRedLight,
		strength: 0.35,
		steps: 2,
		skip: [C.ink, C.brickRedLight, C.brickRed, TALLY_HOT],
	});
	drawGlints(scene);
	return scene;
}

/**
 * The studio's dark back wall: a curtain in deep folds, fading to black under the grid.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStudio(layer, random) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			const fold = Math.sin(x * 0.85 + Math.sin(y * 0.15) * 0.6);
			let colour = CURTAIN;
			if (fold > 0.45) {
				colour = CURTAIN_LIGHT;
			} else if (fold < -0.55) {
				colour = CURTAIN_DARK;
			}
			// The top of the room fades into the dark above the lights.
			if (y < 9 || (y < 14 && (x + y) % 2 === 0)) {
				colour = DARK;
			}
			set(layer, x, y, colour);
		}
	}
	// A few specks of dust caught in the gloom.
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 34);
		const y = 14 + Math.floor(random() * 30);
		set(layer, x, y, CURTAIN_LIGHT);
	}
}

/**
 * The dark floor, with seams between its sheets and the set's light shining in it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFloor(layer, random) {
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const seam = y === FLOOR || y === FLOOR + 5 || y === FLOOR + 12;
			set(layer, x, y, seam ? FLOOR_DARK : FLOOR_BASE);
		}
	}
	// The set's reflection: broken streaks under the riser that fade towards us.
	for (let y = FLOOR + 1; y < 60; y++) {
		for (let x = RISER.left + 2; x < 64; x++) {
			const fade = (y - FLOOR) / 12;
			if (random() > fade && (x + y * 3) % 4 !== 0) {
				set(layer, x, y, FLOOR_SHINE);
			}
		}
	}
}

/**
 * The set's blue backdrop: banded brighter behind the desk, a lit edge, a strip of light and a globe drawn in lines of light.
 * @param {Canvas} layer
 */
function drawBackdrop(layer) {
	const { left, top, bottom } = BACKDROP;
	for (let y = top; y < bottom; y++) {
		for (let x = left; x < 64; x++) {
			const d = Math.hypot((x - AIM.x) / 1.4, y - AIM.y);
			let colour = SET_DARK;
			if (d < 10) {
				colour = SET_LIGHT;
			} else if (d < 18) {
				colour = SET;
			}
			set(layer, x, y, colour);
		}
	}
	// The flat's lit edge and top.
	rect(layer, left, top, 1, bottom - top, C.daySky4);
	rect(layer, left, top, 64 - left, 1, C.daySky3);
	// A strip of light along the backdrop at desk height.
	rect(layer, left + 1, DESK.top - 4, 64 - left - 1, 1, SET_LINE);
	drawGlobe(layer);
}

/**
 * The globe on the backdrop: a ring, its equator, two parallels and two meridians, all in light.
 * @param {Canvas} layer
 */
function drawGlobe(layer) {
	const { x: cx, y: cy, r } = GLOBE;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d > r + 0.5) {
				continue;
			}
			const rim = d > r - 0.6;
			const equator = dy === 0;
			const parallel = Math.abs(Math.abs(dy) - 4) < 0.5;
			const meridian =
				dx === 0 ||
				Math.abs(
					Math.abs(dx) - Math.round(0.5 * Math.sqrt(r * r - dy * dy))
				) < 0.5;
			if (rim || equator || meridian || parallel) {
				set(layer, x, y, rim ? SET_LINE : C.daySky4);
			}
		}
	}
}

/**
 * The lamps' beams: soft cones from each lamp down to the desk, lightening the dark they pass through.
 * @param {Canvas} layer
 */
function drawBeams(layer) {
	for (let y = 6; y < AIM.y; y++) {
		for (let x = 28; x < 64; x++) {
			const lit = LAMPS.some((lamp) => {
				const axis = Math.atan2(AIM.y - lamp.y, AIM.x - lamp.x);
				const angle = Math.atan2(y - lamp.y, x - lamp.x);
				return Math.abs(angle - axis) < 0.16;
			});
			const behind = get(layer, x, y);
			if (lit && behind) {
				set(layer, x, y, mix(behind, BEAM, 0.16));
			}
		}
	}
}

/**
 * The lighting grid under the ceiling: two pipes across the studio and the clamps that hold them.
 * @param {Canvas} layer
 */
function drawGrid(layer) {
	rect(layer, 0, 2, 64, 1, SHELL_SHADE);
	rect(layer, 0, 3, 64, 1, SHELL_DARK);
	rect(layer, 0, 6, 64, 1, SHELL_DARK);
	for (let x = 4; x < 64; x += 15) {
		rect(layer, x, 0, 1, 7, SHELL_DARK);
	}
}

/**
 * One fresnel lamp on its yoke, hanging from the grid and tilted down at the desk, its lens lit.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} lamp
 */
function drawLamp(scene, lamp) {
	paint(
		scene,
		lamp.x - 2,
		lamp.y - 1,
		['..m..', '.mmm.', 'dsssm', 'dsssmm', '.dssgw', '..dwl'],
		{
			m: SHELL_MID,
			d: SHELL_DARK,
			s: SHELL_SHADE,
			g: C.lampGlow,
			w: C.white,
			l: C.beamLight,
		}
	);
}

/**
 * The riser under the desk: a low platform with a lit top edge.
 * @param {Canvas} scene
 */
function drawRiser(scene) {
	const { left, top, bottom } = RISER;
	rect(scene, left, top, 64 - left, 1, SHELL_LIGHT);
	rect(scene, left, top + 1, 64 - left, bottom - top, SHELL_MID);
	rect(scene, left, bottom, 64 - left, 1, SHELL_SHADE);
}

/**
 * The anchor's empty chair behind the desk: a tall dark back with a lit rim.
 * @param {Canvas} scene
 */
function drawChair(scene) {
	const { left, right, top } = CHAIR;
	for (let y = top; y < DESK.top; y++) {
		for (let x = left; x <= right; x++) {
			const corner = y === top && (x === left || x === right);
			if (corner) {
				continue;
			}
			let colour = LENS_BASE;
			if (y === top || x === right) {
				colour = SHELL_SHADE;
			} else if (x === left) {
				colour = LENS_DARK;
			}
			set(scene, x, y, colour);
		}
	}
	// The seam stitched down the back.
	rect(scene, left + 2, top + 2, 1, DESK.top - top - 2, LENS_LIGHT);
}

/**
 * The news desk: a white top, a curved front lit by the lamps with a blue band across it, and papers left on it.
 * @param {Canvas} scene
 */
function drawDesk(scene) {
	const { left, top, bottom } = DESK;
	// The top, seen a little from above.
	rect(scene, left + 1, top, 63 - left, 1, C.white);
	rect(scene, left, top + 1, 64 - left, 1, C.creamLight);
	for (let y = top + 2; y <= bottom; y++) {
		// The front curves back at the left end.
		const inset = Math.max(0, Math.round((y - top - 6) * 0.7));
		for (let x = left + inset; x < 64; x++) {
			let colour = C.cream;
			if (x === left + inset) {
				colour = C.creamShade;
			} else if (y === top + 5 || y === top + 6) {
				colour = x < left + 6 ? SET : SET_LIGHT;
			} else if (y >= bottom - 1) {
				colour = C.creamShade;
			} else if (x > left + 3 && y < top + 5) {
				colour = C.creamLight;
			}
			set(scene, x, y, colour);
		}
	}
	// The papers left on the desk.
	rect(scene, 57, top - 1, 4, 1, C.white);
	set(scene, 56, top, C.creamShade);
}

/**
 * The cables: one hanging from the camera's back down to the floor, one trailing behind the base,
 * and one snaking across the floor in front towards the set.
 * @param {Canvas} scene
 */
function drawCables(scene) {
	/** @param {(t: number) => [number, number]} path */
	function cable(path) {
		for (let t = 0; t <= 1; t += 0.005) {
			const [x, y] = path(t).map(Math.round);
			set(scene, x, y + 1, CABLE);
			set(scene, x, y, CABLE_LIGHT);
		}
	}
	// From the camera's back, down in a loose loop to the floor and off to the left.
	cable((t) => [
		BODY.left - 1 - Math.sin(t * Math.PI) * 6,
		BODY.bottom - 4 + t * (FLOOR + 6 - BODY.bottom + 4),
	]);
	cable((t) => [6 - t * 6, FLOOR + 6 + t * 4]);
	// Across the floor in front, towards the set.
	cable((t) => [30 + t * 34, 61 - t * 7 + Math.sin(t * Math.PI * 2.2) * 2.5]);
}

/**
 * The near or far half of the steering ring round the column, so the column can pass between them.
 * @param {Canvas} scene
 * @param {'back' | 'front'} half
 */
function drawRingHalf(scene, half) {
	const { x: cx, y: cy, rx, ry } = RING;
	for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
		for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
			const e = Math.hypot((x - cx) / rx, (y - cy) / ry);
			const inner = Math.hypot(
				(x - cx) / (rx - 1.2),
				(y - cy) / (ry - 1)
			);
			if (e > 1.04 || inner < 1) {
				continue;
			}
			const front = y >= cy;
			if ((half === 'front') !== front) {
				continue;
			}
			let colour = front ? SHELL : SHELL_MID;
			if (y < cy - ry + 0.8) {
				colour = SHELL_LIGHT;
			} else if (front && y > cy + ry - 0.8) {
				colour = SHELL_SHADE;
			} else if (front && x > cx + rx - 3) {
				colour = SHELL_GLINT;
			}
			set(scene, x, y, colour);
		}
	}
	if (half === 'back') {
		// The spokes from the ring to the column.
		rect(scene, cx - rx + 1, cy, rx - 3, 1, SHELL_SHADE);
		rect(scene, cx + 3, cy, rx - 3, 1, SHELL_SHADE);
	}
}

/**
 * The pedestal's column: a chrome tube in two telescoping sections, lit from the set on its right.
 * @param {Canvas} scene
 */
function drawColumn(scene) {
	const { x: cx, top, step, bottom } = COLUMN;
	for (let y = top; y < bottom; y++) {
		const half = y < step ? 2 : 3;
		for (let x = cx - half; x <= cx + half; x++) {
			const across = x - cx;
			let colour = SHELL;
			if (across === -half) {
				colour = SHELL_SHADE;
			} else if (across === -half + 1) {
				colour = SHELL_MID;
			} else if (across === half - 1) {
				colour = SHELL_GLINT;
			}
			set(scene, x, y, colour);
		}
	}
	// The collar where the upper section slides into the lower.
	rect(scene, cx - 4, step - 1, 9, 1, SHELL_LIGHT);
	rect(scene, cx - 4, step, 9, 1, SHELL_MID);
}

/**
 * The skirted base: a heavy dark drum widening to the floor, on three wheels.
 * @param {Canvas} scene
 */
function drawBase(scene) {
	const { top, bottom } = BASE;
	for (let y = top; y <= bottom; y++) {
		const half = 7 + (y - top) * 1.6;
		for (
			let x = Math.round(COLUMN.x - half);
			x <= Math.round(COLUMN.x + half);
			x++
		) {
			const across = (x - COLUMN.x) / half;
			let colour = SHELL_SHADE;
			if (y === top) {
				colour = SHELL_LIGHT;
			} else if (y === top + 1) {
				colour = SHELL_MID;
			} else if (y === bottom) {
				colour = LENS_DARK;
			} else if (across > 0.65) {
				colour = SHELL_MID;
			} else if (across < -0.6) {
				colour = SHELL_DARK;
			}
			set(scene, x, y, colour);
		}
	}
	// The bumper band round the skirt.
	for (let x = COLUMN.x - 14; x <= COLUMN.x + 14; x++) {
		set(scene, x, bottom - 2, x > COLUMN.x + 6 ? SHELL : SHELL_DARK);
	}
	// The wheels, each a dark tyre with a lit hub.
	for (const wx of [COLUMN.x - 13, COLUMN.x, COLUMN.x + 13]) {
		paint(scene, wx - 1, bottom + 1, ['.dd.', 'dhsd', 'dssd', '.dd.'], {
			d: LENS_DARK,
			s: LENS_BASE,
			h: SHELL,
		});
	}
}

/**
 * The two pan bars, reaching back from the pan head to rubber grips; the far one is half in shadow.
 * @param {Canvas} scene
 */
function drawPanBars(scene) {
	line(scene, 15, BODY.bottom, 4, 36, SHELL_SHADE);
	line(scene, 15, BODY.bottom + 1, 4, 37, SHELL_DARK);
	line(scene, 17, BODY.bottom + 2, 2, 40, SHELL);
	line(scene, 17, BODY.bottom + 3, 2, 41, SHELL_SHADE);
	// The grips at their ends.
	rect(scene, 0, 39, 4, 3, LENS_BASE);
	rect(scene, 0, 39, 4, 1, LENS_LIGHT);
	rect(scene, 2, 35, 3, 2, LENS_DARK);
	// The pan head the camera sits on.
	rect(scene, 14, BODY.bottom + 1, 13, 3, SHELL_DARK);
	rect(scene, 14, BODY.bottom + 1, 13, 1, SHELL_MID);
	rect(scene, 24, BODY.bottom + 2, 2, 1, SHELL_SHADE);
}

/**
 * The camera body: a big rounded grey box, lit on its top, with a side door, vents and a carry handle.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	const { left, right, top, bottom } = BODY;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const corner =
				(y === top || y === bottom) && (x === left || x === right);
			if (corner) {
				continue;
			}
			let colour = SHELL;
			if (y === top) {
				colour = SHELL_GLINT;
			} else if (y === top + 1) {
				colour = SHELL_LIGHT;
			} else if (y >= bottom - 1) {
				colour = SHELL_SHADE;
			} else if (x === left) {
				colour = SHELL_SHADE;
			} else if (x === right) {
				colour = SHELL_LIGHT;
			} else if (x === left + 1) {
				colour = SHELL_MID;
			}
			set(scene, x, y, colour);
		}
	}
	// The side door: a slightly raised panel with its seams.
	const door = {
		left: left + 3,
		right: right - 6,
		top: top + 4,
		bottom: bottom - 4,
	};
	for (let y = door.top; y <= door.bottom; y++) {
		for (let x = door.left; x <= door.right; x++) {
			let colour = SHELL;
			if (y === door.top || x === door.right) {
				colour = SHELL_LIGHT;
			} else if (y === door.bottom || x === door.left) {
				colour = SHELL_MID;
			}
			set(scene, x, y, colour);
		}
	}
	// A grille of vent holes in the door, and its round latch.
	for (let y = door.top + 2; y <= door.bottom - 2; y += 2) {
		for (
			let x = door.left + 2 + (y % 4 === 0 ? 1 : 0);
			x <= door.right - 5;
			x += 2
		) {
			set(scene, x, y, SHELL_SHADE);
		}
	}
	set(scene, door.right - 2, door.top + 5, SHELL_DARK);
	set(scene, door.right - 2, door.top + 4, SHELL_GLINT);
	// The station's blue stripe along the body.
	rect(scene, left + 1, bottom - 3, right - left - 1, 1, SET_LIGHT);
	rect(scene, left + 1, bottom - 2, right - left - 1, 1, SET);
	// A row of knobs between the door and the lens.
	for (const y of [top + 5, top + 9, top + 13]) {
		set(scene, right - 3, y, SHELL_DARK);
		set(scene, right - 2, y, SHELL_GLINT);
	}
}

/**
 * The viewfinder on top of the body: a smaller box with a deep hood at the back for the operator's eyes.
 * @param {Canvas} scene
 */
function drawFinder(scene) {
	const { left, right, top, bottom } = FINDER;
	rect(scene, left, top, right - left + 1, bottom - top + 1, SHELL_MID);
	rect(scene, left, top, right - left + 1, 1, SHELL_LIGHT);
	rect(scene, right, top + 1, 1, bottom - top, SHELL);
	rect(scene, left, bottom, right - left + 1, 1, SHELL_SHADE);
	// The hood flares back towards the operator.
	for (let y = top - 1; y <= bottom + 1; y++) {
		for (let x = left - 5; x < left; x++) {
			const flare = Math.round((left - x) * 0.25);
			if (y < top - flare + 1 || y > bottom + flare - 1) {
				continue;
			}
			set(scene, x, y, x === left - 5 ? LENS_LIGHT : LENS_BASE);
		}
	}
	// The bracket that holds it on the body.
	rect(scene, left + 3, bottom + 1, 7, 1, SHELL_DARK);
}

/**
 * The lens: a black barrel with a knurled focus ring, ending in a flared hood whose glass catches the blue set.
 * @param {Canvas} scene
 */
function drawLens(scene) {
	const { left, right, y: cy, half } = LENS;
	for (let x = left; x < right; x++) {
		const ring = x >= left + 3 && x <= left + 6;
		for (let dy = -half; dy <= half; dy++) {
			let colour = LENS_BASE;
			if (dy === -half) {
				colour = LENS_LIGHT;
			} else if (dy >= half - 1) {
				colour = LENS_DARK;
			} else if (ring && (x + dy) % 2 === 0) {
				colour = LENS_DARK;
			} else if (dy === -half + 1) {
				colour = ring ? LENS_LIGHT : LENS_BASE;
			}
			set(scene, x, cy + dy, colour);
		}
	}
	// The hood, flaring out towards the set.
	const { left: hl, right: hr, half: hh } = HOOD;
	for (let x = hl; x <= hr; x++) {
		const h = Math.round(half + ((x - hl) / (hr - hl)) * (hh - half));
		for (let dy = -h; dy <= h; dy++) {
			let colour = LENS_BASE;
			if (dy === -h) {
				colour = SHELL_SHADE;
			} else if (dy === h) {
				colour = LENS_DARK;
			}
			set(scene, x, cy + dy, colour);
		}
	}
	// The hood's mouth, turned a little towards us, and the glass inside.
	for (let dy = -hh + 1; dy <= hh - 1; dy++) {
		set(scene, hr + 1, cy + dy, dy < -2 ? LENS_LIGHT : LENS_BASE);
		set(scene, hr, cy + dy, Math.abs(dy) < 4 ? GLASS : LENS_DARK);
	}
	for (const dy of [-3, -2, 1]) {
		set(scene, hr, cy + dy, GLASS_LIGHT);
	}
}

/**
 * The tally lamp on the body's front corner: a small housing round a red lens, lit because the camera is on air.
 * @param {Canvas} scene
 */
function drawTally(scene) {
	const { x, y } = TALLY;
	paint(scene, x - 1, y - 1, ['.sss.', 'srhrs', 'srrrs'], {
		s: SHELL_DARK,
		r: C.brickRedLight,
		h: TALLY_HOT,
	});
	set(scene, x, y + 2, SHELL_SHADE);
	set(scene, x + 2, y + 2, SHELL_SHADE);
}

/**
 * The brightest points: the tally's hot centre, the chrome glints and the lamp lenses.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[TALLY.x + 1, TALLY.y],
		[COLUMN.x + 1, COLUMN.top + 1],
		[COLUMN.x + 2, COLUMN.step + 2],
		[RING.x + RING.rx - 2, RING.y + 1],
		[BODY.right - 1, BODY.top + 1],
		[HOOD.right, LENS.y - 3],
	]) {
		set(scene, x, y, C.white);
	}
}
