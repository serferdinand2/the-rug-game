// Assembly Line: a conveyor carrying a row of identical black motorcars across a sunlit factory floor, workers in caps fitting the wheels, a chain hoist overhead and tall windows behind.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * Which near-side wheels a car has on yet.
 * @typedef {{ front: boolean, rear: boolean }} Wheels
 */

/** The near line: its cars' scale, the row their tyres stand on, and each car's radiator column. */
const NEAR = { scale: 0.9, ground: 55, cars: [-25, 15, 55] };

/** The far line, smaller and higher up the floor. */
const FAR = { scale: 0.42, ground: 27, cars: [-7, 12, 31, 50] };

/** The I-beam the hoist runs on, and the hoist's column. */
const BEAM = 4;
const HOIST = 48;

/** The tall windows in the back wall: each one's left column, and the rows they span. */
const WINDOWS = { columns: [3, 24, 45], width: 17, top: 8, bottom: 30 };

/** The black paint, a deep blue-black: its base, its sheen where the window light falls, a softer sheen, a middle tone and its shade. */
const PAINT = mix(C.nightSea3, C.roof, 0.35);
const SHEEN = mix(C.daySky5, C.stoneLight, 0.5);
const SHEEN_SOFT = mix(PAINT, SHEEN, 0.5);
const PAINT_MID = mix(PAINT, C.roofLight, 0.25);
const PAINT_SHADE = mix(C.ink, C.nightSea3, 0.35);
const GLOSS = mix(PAINT, SHEEN, 0.4);

/** The far line, hazed towards the back wall, and its paler outline. */
const HAZE = mix(C.cream, C.stone, 0.35);
const FAR_INK = mix(C.ink, HAZE, 0.45);

/** The canvas top, the black leather seats, the tyres, the wooden spokes and the dark between them. */
const TOP = mix(C.ink, C.stoneShade, 0.45);
const TOP_LIGHT = C.stoneShade;
const LEATHER = mix(C.roofShade, C.ink, 0.3);
const TYRE = mix(C.ink, C.stoneShade, 0.35);
const SPOKE = C.timberLight;
const SPOKE_GAP = mix(C.timberShade, C.wood, 0.5);

/** The windscreen glass, catching the sky. */
const GLASS = mix(C.daySky6, C.white, 0.3);

/** The concrete floor, warmed by the sun. */
const FLOOR = mix(C.stoneLight, C.sand, 0.35);
const FLOOR_SHADE = mix(C.stone, C.sandShade, 0.35);

/** Sunlight falling through the windows. */
const SUN = mix(C.lampGlow, C.white, 0.4);

/** Workers' overalls and caps. */
const DENIM = mix(C.daySea3, C.roof, 0.25);
const DENIM_SHADE = mix(C.daySea3, C.ink, 0.45);
const CAP = mix(C.stoneShade, C.roofShade, 0.4);

/**
 * Draws the Assembly Line tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const middle = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1913);

	drawWall(layer);
	drawWindows(layer, random);
	drawCeiling(layer);
	drawFloor(layer, random);
	drawSunbeams(layer);

	// The far line stands back by the wall: hazed towards it, with a paler outline of its own.
	for (const ox of FAR.cars) {
		drawCar(middle, ox, FAR.ground, FAR.scale, { front: true, rear: true });
	}
	drawFarWorker(middle, 8, C.skinTan);
	drawFarWorker(middle, 27, C.skin);
	drawConveyor(middle, FAR.ground, 1);
	haze(middle);
	outline(middle, FAR_INK);
	underlay(middle, layer);

	drawBeam(scene);
	drawHoist(scene);
	NEAR.cars.forEach((ox, i) => {
		drawCar(scene, ox, NEAR.ground, NEAR.scale, {
			front: i < 2,
			rear: true,
		});
	});
	drawFitter(scene);
	drawLifter(scene);
	drawConveyor(scene, NEAR.ground, 6);
	outline(scene, C.ink);
	underlay(scene, middle);

	drawShafts(scene);
	drawGlints(scene);
	return scene;
}

/**
 * The whitewashed back wall between the windows.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, (x + y * 2) % 11 === 0 ? C.creamShade : C.cream);
		}
	}
}

/**
 * Tall factory windows of small steel-framed panes onto the day sky, one pane tilted open.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindows(layer, random) {
	const sky = createCanvas(64, 64);
	drawSky(sky, { time: 'day', horizon: 63, random });
	const { top, bottom, width } = WINDOWS;
	for (const wx of WINDOWS.columns) {
		// The shadowed reveal round the frame.
		for (let y = top - 1; y <= bottom; y++) {
			set(layer, wx - 1, y, C.creamShade);
			set(layer, wx + width, y, C.plasterShade);
		}
		for (let x = wx - 1; x <= wx + width; x++) {
			set(layer, x, top - 1, C.plasterShade);
		}
		for (let y = top; y < bottom; y++) {
			for (let x = wx; x < wx + width; x++) {
				const mullion = (x - wx) % 4 === 0 || (y - top) % 5 === 0;
				set(layer, x, y, mullion ? C.stoneShade : get(sky, x, y));
			}
		}
	}
	// A tilted pane, its glass catching the light.
	rect(layer, 29, 14, 3, 4, C.daySky6);
}

/**
 * The roof trusses along the top: a dark steel lattice under the ceiling.
 * @param {Canvas} layer
 */
function drawCeiling(layer) {
	rect(layer, 0, 0, 64, 4, C.stone);
	for (let x = 0; x < 64; x++) {
		set(layer, x, 0, C.stoneShade);
		set(layer, x, 3, C.stoneShade);
		const k = x % 6;
		set(
			layer,
			x,
			k < 3 ? 1 + Math.min(k, 1) : 2 - Math.min(k - 3, 1),
			C.stoneShade
		);
	}
}

/**
 * The factory floor: pale concrete with oil stains, between and in front of the lines.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFloor(layer, random) {
	for (let y = WINDOWS.bottom + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, y < WINDOWS.bottom + 3 ? FLOOR_SHADE : FLOOR);
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 63);
		const y = WINDOWS.bottom + 4 + Math.floor(random() * 30);
		set(layer, x, y, FLOOR_SHADE);
		set(layer, x + 1, y, FLOOR_SHADE);
	}
}

/**
 * Whether a point lies in one of the shafts of sunlight slanting down from the windows.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inShaft(x, y) {
	return y > WINDOWS.top && (x - y * 0.55 + 64) % 21 < 6;
}

/**
 * The sunlit patches the shafts throw on the wall and the floor.
 * @param {Canvas} layer
 */
function drawSunbeams(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && inShaft(x, y)) {
				set(layer, x, y, mix(colour, SUN, 0.2));
			}
		}
	}
}

/**
 * The shafts of sunlight themselves, a faint haze laid over everything they cross.
 * @param {Canvas} scene
 */
function drawShafts(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(scene, x, y);
			if (colour && colour !== C.ink && inShaft(x, y)) {
				set(scene, x, y, mix(colour, SUN, 0.1));
			}
		}
	}
}

/**
 * Blends everything painted on a canvas towards the back wall, so the far line stands back.
 * @param {Canvas} canvas
 */
function haze(canvas) {
	canvas.p = canvas.p.map((colour) =>
		colour ? mix(colour, HAZE, 0.45) : colour
	);
}

/**
 * The I-beam the hoist runs along, under the trusses.
 * @param {Canvas} canvas
 */
function drawBeam(canvas) {
	for (let x = 0; x < 64; x++) {
		set(canvas, x, BEAM, C.stoneLight);
		set(canvas, x, BEAM + 1, C.stoneMid);
		set(canvas, x, BEAM + 2, C.stoneShade);
	}
}

/**
 * The chain hoist: a trolley on the beam, the chain block, its hand chain hanging beside it,
 * and the hook carrying a wheel down to the line.
 * @param {Canvas} canvas
 */
function drawHoist(canvas) {
	const x = HOIST;
	rect(canvas, x - 3, BEAM + 3, 7, 2, C.stoneMid);
	set(canvas, x - 2, BEAM + 3, C.stoneLight);
	set(canvas, x + 2, BEAM + 3, C.stoneLight);
	for (let y = BEAM + 5; y <= BEAM + 9; y++) {
		for (let i = -2; i <= 2; i++) {
			let colour = C.brickRed;
			if (i === -2) {
				colour = C.brickRedLight;
			} else if (i === 2) {
				colour = C.brickRedShade;
			}
			set(canvas, x + i, y, colour);
		}
	}
	// The hand chain, hanging down to the worker who hauls on it.
	for (let y = BEAM + 10; y <= 36; y++) {
		set(canvas, x + 3, y, y % 2 ? C.stoneShade : C.stone);
	}
	// The load chain, the hook, and the wheel on it.
	for (let y = BEAM + 10; y <= 15; y++) {
		set(canvas, x, y, y % 2 ? C.stoneLight : C.stoneShade);
	}
	drawCar(canvas, x - 6, 25, NEAR.scale, { front: true, rear: false }, true);
}

/**
 * Picks the colour of one point of a car, side on and facing left, in the car's own units:
 * `dx` runs back from the radiator, `dy` up from the ground. Returns null where the car isn't.
 * @param {number} dx
 * @param {number} dy
 * @param {Wheels} wheels
 * @returns {Colour | null}
 */
function carColour(dx, dy, wheels) {
	// The round brass headlamp just ahead of the radiator.
	if (Math.hypot(dx + 2, dy - 10.4) < 1.2) {
		return dx < -2.5 ? C.lampGlow : C.brass;
	}
	// The mudguards over the wheels, and the running board between them.
	for (const hub of [6.5, 25.5]) {
		const d = Math.hypot(dx - hub, dy - 5.5);
		if (dy >= 5.4 && d >= 5.9 && d < 7.1) {
			if (dy > 11.8) {
				return SHEEN;
			}
			return d > 6.5 ? SHEEN_SOFT : PAINT;
		}
	}
	if (dx >= -0.5 && dx < 0.7 && dy >= 3.8 && dy < 5.6) {
		return PAINT;
	}
	if (dx >= 31.2 && dx < 32.4 && dy >= 4 && dy < 5.6) {
		return PAINT;
	}
	if (dx >= 12.8 && dx < 19.2 && dy >= 5 && dy < 6.2) {
		return PAINT_MID;
	}
	// The wheels.
	/** @type {[number, boolean][]} */
	const hubs = [
		[6.5, wheels.front],
		[25.5, wheels.rear],
	];
	for (const [hub, on] of hubs) {
		const colour = wheelColour(dx - hub, dy - 5.5, on);
		if (colour) {
			return colour;
		}
	}
	// The chassis frame.
	if (dx >= 11 && dx < 21 && dy >= 6.2 && dy < 7.6) {
		return PAINT_SHADE;
	}
	// The brass radiator, standing proud of the hood, with its header tank and filler cap.
	if (dx >= 0 && dx < 3.4 && dy >= 7.6 && dy < 16.4) {
		if (dy >= 15.2 || dx < 1.1) {
			return C.gold;
		}
		return dx < 2.3 ? C.brass : C.amber;
	}
	if (dx >= 1.1 && dx < 2.3 && dy >= 16.4 && dy < 17.4) {
		return C.amber;
	}
	// The hood, with its louvres.
	if (dx >= 3.4 && dx < 11.4 && dy >= 8.4 && dy < 14.6) {
		if (dy > 13.5) {
			return SHEEN;
		}
		if (dy > 12.4) {
			return SHEEN_SOFT;
		}
		if (
			dx >= 5.4 &&
			dx < 10.6 &&
			dy >= 9.4 &&
			dy < 12.4 &&
			Math.floor(dx) % 2 === 0
		) {
			return PAINT_SHADE;
		}
		return PAINT;
	}
	// The windscreen in its brass frame.
	if (dx >= 11.4 && dx < 12.6 && dy >= 16.4 && dy < 24) {
		return dx > 12.1 || dy > 23.4 ? C.brass : GLASS;
	}
	// The cowl and the body tub, rounded at the back, with its door seams.
	if (dx >= 11.2 && dx < 12.6 && dy >= 7.6 && dy < 16.4) {
		return dy > 15.6 ? SHEEN : PAINT;
	}
	if (dx >= 12.6 && dx < 32.4 && dy >= 7.6 && dy < 16) {
		if (dx > 31 && (dy > 15 || dy < 8.6)) {
			return null;
		}
		if (dy > 14.9) {
			return SHEEN;
		}
		if (dy > 13.8) {
			return SHEEN_SOFT;
		}
		if (dy < 8.4) {
			return PAINT_SHADE;
		}
		if (Math.abs(dx - 18) < 0.4 || Math.abs(dx - 24.4) < 0.4) {
			return PAINT_SHADE;
		}
		if (dy >= 10.6 && dy < 11.6 && dx < 29) {
			return GLOSS;
		}
		return PAINT;
	}
	// The canvas top: the roof, and the back quarter sweeping down to the body.
	if (dx >= 11.4 && dx < 30 && dy >= 24 && dy < 25.4) {
		return dy > 24.8 ? TOP_LIGHT : TOP;
	}
	const front = 27.6 + (25.4 - dy) * 0.09;
	const back = 30 + (25.4 - dy) * 0.33;
	if (dy >= 16 && dy < 25.4 && dx >= front && dx < back) {
		return dx < front + 0.9 ? TOP_LIGHT : TOP;
	}
	// The front seat's back and the steering column, seen through the open side.
	if (dx >= 17.6 && dx < 19.4 && dy >= 16 && dy < 18.8) {
		return dy > 18 ? PAINT_MID : LEATHER;
	}
	if (
		dy >= 16 &&
		dy < 18.8 &&
		Math.abs(dx - (13.6 + (dy - 16) * 0.5)) < 0.45
	) {
		return PAINT_SHADE;
	}
	return null;
}

/**
 * Picks the colour of one point of a wooden-spoked wheel, or of the bare axle end when the wheel isn't on yet.
 * @param {number} dx - Column offset from the hub, in car units
 * @param {number} dy - Row offset from the hub, upwards, in car units
 * @param {boolean} on - Whether the wheel is fitted
 * @returns {Colour | null}
 */
function wheelColour(dx, dy, on) {
	const d = Math.hypot(dx, dy);
	if (!on) {
		return d < 1.4 ? C.stoneShade : null;
	}
	if (d >= 5.5) {
		return null;
	}
	if (d >= 4.5) {
		return TYRE;
	}
	if (d >= 3.7) {
		return C.timber;
	}
	if (d < 1.2) {
		return C.gold;
	}
	const angle = Math.atan2(dy, dx);
	for (let k = 0; k < 8; k++) {
		const off = angle - (k * Math.PI) / 4;
		if (Math.cos(off) > 0 && Math.abs(d * Math.sin(off)) < 0.55) {
			return SPOKE;
		}
	}
	return SPOKE_GAP;
}

/**
 * Draws one car by sampling its design at each pixel's centre, so every car is the same at any size.
 * @param {Canvas} canvas
 * @param {number} ox - The radiator's column
 * @param {number} ground - The row the tyres stand on
 * @param {number} scale - Pixels per car unit
 * @param {Wheels} wheels
 * @param {boolean} [wheelOnly=false] - Draw only the front wheel, as when it hangs from the hoist
 */
function drawCar(canvas, ox, ground, scale, wheels, wheelOnly = false) {
	for (let y = ground - Math.ceil(27 * scale); y <= ground; y++) {
		for (
			let x = ox - Math.ceil(3 * scale);
			x <= ox + Math.ceil(34 * scale);
			x++
		) {
			const dx = (x + 0.5 - ox) / scale;
			const dy = (ground + 0.5 - y) / scale;
			const colour = wheelOnly
				? wheelColour(dx - 6.5, dy - 5.5, true)
				: carColour(dx, dy, wheels);
			if (colour) {
				set(canvas, x, y, colour);
			}
		}
	}
}

/**
 * A conveyor running the whole width: wooden slats seen a little from above, on a steel frame
 * with a row of rollers along its side.
 * @param {Canvas} canvas
 * @param {number} ground - The row the cars stand on; the slats lie just below it
 * @param {number} depth - How many rows the steel side shows; from 4 up it shows its rollers
 */
function drawConveyor(canvas, ground, depth) {
	for (let x = 0; x < 64; x++) {
		const joint = x % 4 === 3;
		set(canvas, x, ground + 1, joint ? C.timberShade : C.timberLight);
		set(canvas, x, ground + 2, joint ? C.timberShade : C.timber);
		for (let k = 0; k < depth; k++) {
			let colour = C.stone;
			if (k === 0) {
				colour = C.stoneLight;
			} else if (k === depth - 1) {
				colour = C.stoneShade;
			}
			set(canvas, x, ground + 3 + k, colour);
		}
	}
	if (depth < 4) {
		return;
	}
	// The rollers, each a steel disc with a dark axle.
	for (let rx = 3; rx < 64; rx += 8) {
		const ry = ground + 4 + Math.floor((depth - 2) / 2);
		for (let y = ry - 1; y <= ry + 1; y++) {
			for (let x = rx - 1; x <= rx + 1; x++) {
				set(canvas, x, y, y === ry - 1 ? C.stoneLight : C.stoneMid);
			}
		}
		set(canvas, rx, ry, C.stoneShade);
	}
}

/** A worker's sprite keys: C cap, S skin, s skin shade, W shirt, O overalls, o their shade. */
const WORKER_KEYS = ['C', 'S', 's', 'W', 'O', 'o'];

/**
 * The colours for a worker's sprite.
 * @param {Colour} skin
 * @param {Colour} skinShade
 * @returns {Record<string, Colour>}
 */
function workerColours(skin, skinShade) {
	const colours = [CAP, skin, skinShade, C.cream, DENIM, DENIM_SHADE];
	return Object.fromEntries(WORKER_KEYS.map((key, i) => [key, colours[i]]));
}

/**
 * The worker fitting the middle car's front wheel: cap, shirt and overalls, crouched at the wheel
 * with both hands on the tyre.
 * @param {Canvas} canvas
 */
function drawFitter(canvas) {
	const x = 6;
	const y = NEAR.ground - 12;
	paint(
		canvas,
		x,
		y,
		[
			'..CCC..',
			'..CCCC.',
			'..SSS..',
			'..sSS..',
			'.WWWW..',
			'WOOOOW.',
			'.OOOOO.',
			'.OOOOO.',
			'..OOOo.',
			'.OOOOo.',
			'.OO..o.',
			'.OO..o.',
			'oOO..oo',
		],
		workerColours(C.skinTan, C.skinTanShade)
	);
	// Both arms reaching forward onto the tyre.
	line(canvas, x + 5, y + 5, x + 10, y + 6, C.cream);
	line(canvas, x + 5, y + 7, x + 10, y + 8, C.creamShade);
	rect(canvas, x + 11, y + 6, 1, 1, C.skinTan);
	rect(canvas, x + 11, y + 8, 1, 1, C.skinTanShade);
}

/**
 * The worker under the hoist, hauling on its hand chain to let the wheel down.
 * @param {Canvas} canvas
 */
function drawLifter(canvas) {
	const x = HOIST - 3;
	const y = NEAR.ground - 17;
	paint(
		canvas,
		x,
		y,
		[
			'.CCC..',
			'CCCC..',
			'.SSS..',
			'.SSs..',
			'.WWWW.',
			'WWOOW.',
			'W.OOO.',
			'..OOO.',
			'.oOOO.',
			'.o.OO.',
			'.o.OO.',
			'.o.OO.',
			'.o.OO.',
			'.o.OO.',
			'.o.OO.',
		],
		workerColours(C.skinDeep, C.skinDeepShade)
	);
	// One arm raised to the hand chain, two pixels wide, with the hand gripping the chain.
	rect(canvas, x + 4, y - 2, 1, 7, C.cream);
	rect(canvas, x + 5, y - 2, 1, 7, C.creamShade);
	rect(canvas, x + 4, y - 4, 2, 2, C.skinDeep);
	set(canvas, x + 5, y - 3, C.skinDeepShade);
}

/**
 * A small worker in a cap on the far line, standing between two cars.
 * @param {Canvas} canvas
 * @param {number} x - The worker's left column
 * @param {Colour} skin
 */
function drawFarWorker(canvas, x, skin) {
	paint(
		canvas,
		x,
		FAR.ground - 8,
		['CCC', '.S.', 'WOW', '.O.', '.O.', 'O.O', 'O.O', 'O.O', 'O.O', 'O.O'],
		{ C: CAP, S: skin, W: C.cream, O: DENIM }
	);
}

/**
 * Sun glinting on the near cars' brass and glass, painted over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	const s = NEAR.scale;
	for (const ox of NEAR.cars) {
		for (const [dx, dy] of [
			[0.4, 15.8],
			[-2.4, 10.9],
			[11.8, 22.8],
		]) {
			set(
				scene,
				Math.floor(ox + dx * s),
				Math.floor(NEAR.ground + 0.5 - dy * s),
				C.white
			);
		}
	}
}
