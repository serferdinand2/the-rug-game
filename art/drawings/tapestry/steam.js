// S.T.E.A.M.: a tinkerer's bench, a little steam engine puffing behind two brass gears, with a ruler, a paintbrush and a flask.
import {
	createCanvas,
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
import { drawInterior } from '../../parts/interior.js';
import { drawWheel } from '../../parts/wheel.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * One gear: its hub, the radius of its rim (the teeth stand two pixels proud of it), how many teeth,
 * how far round its teeth start (in teeth), and its metal.
 * @typedef {Object} Gear
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {number} teeth
 * @property {number} turn
 * @property {Metal} metal
 */

/**
 * A metal's colours, lit to shaded.
 * @typedef {{ light: Colour, main: Colour, mid: Colour, shade: Colour }} Metal
 */

/** The bench top's far edge, its near edge, and the floor line behind it. */
const BENCH_BACK = 39;
const BENCH_FRONT = 56;
const FLOOR = 41;

/** Polished brass, and copper. */
const BRASS = {
	light: mix(C.gold, C.lampGlow, 0.5),
	main: C.gold,
	mid: C.amber,
	shade: C.lampFrame,
};
const COPPER = {
	light: mix(C.brickRedLight, C.gold, 0.45),
	main: mix(C.brickRed, C.amber, 0.5),
	mid: mix(C.brickRed, C.amber, 0.3),
	shade: mix(C.brickRedShade, C.timberShade, 0.3),
};

/** The engine's flywheel, the boiler's box, and the chimney's top. */
const FLYWHEEL = { x: 22, y: 27, r: 10 };
const BOILER = { x: 31, y: 21, w: 28, h: 12 };
const CHIMNEY = { x: 53, y: 13 };

/** The two meshing gears in front: a big brass one and a small copper one behind it. */
const BIG = { x: 12, y: 49, r: 8, teeth: 9, turn: 0, metal: BRASS };
const SMALL = { x: 27, y: 52, r: 5, teeth: 6, turn: 0.5, metal: COPPER };

/**
 * Draws the S.T.E.A.M. scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5501);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'panel',
		window: { x: 24, y: 2, w: 17, h: 14, time: 'day' },
	});
	drawPainting(layer);
	drawSmoke(layer, {
		x: CHIMNEY.x,
		y: CHIMNEY.y - 2,
		tone: 'steam',
		puffs: 3,
		drift: -1,
	});

	// The bench and the engine stand behind the gears, so they get their own outline.
	const back = createCanvas(64, 64);
	drawBench(back);
	drawEngine(back);
	drawFlask(back);
	outline(back, C.ink);
	drawFire(back);
	drawGauge(back);

	// The small gear sits behind the big one, so it gets its own outline too.
	const middle = createCanvas(64, 64);
	drawGear(middle, SMALL);
	outline(middle, C.ink);

	drawGear(scene, BIG);
	drawRuler(scene);
	drawBrush(scene);
	outline(scene, C.ink);
	underlay(scene, middle);
	underlay(scene, back);
	underlay(scene, layer);
	drawHubs(scene);
	drawRulerTicks(scene);
	return scene;
}

/**
 * A little landscape in a gold frame on the panelling: the art beside the engineering.
 * @param {Canvas} layer
 */
function drawPainting(layer) {
	const x = 4;
	const y = 5;
	const w = 15;
	const h = 11;
	rect(layer, x, y, w, h, C.gold);
	rect(layer, x + w - 1, y, 1, h, C.amber);
	rect(layer, x, y + h - 1, w, 1, C.amber);
	rect(layer, x - 1, y - 1, w + 2, 1, C.lampFrame);
	rect(layer, x - 1, y + h, w + 2, 1, C.lampFrame);
	rect(layer, x - 1, y, 1, h, C.lampFrame);
	rect(layer, x + w, y, 1, h, C.lampFrame);
	for (let j = 1; j < h - 1; j++) {
		for (let i = 1; i < w - 1; i++) {
			const hill = j > 5 + Math.round(Math.sin(i * 0.5) * 1.2);
			let colour = j < 3 ? C.daySky3 : C.daySky5;
			if (hill) {
				colour = j > 7 ? C.grassShade : C.grass;
			}
			set(layer, x + i, y + j, colour);
		}
	}
	rect(layer, x + 10, y + 2, 2, 2, C.lampGlow);
}

/**
 * The bench: a broad top of pale planks seen from above, running away from the viewer, and its dark front.
 * @param {Canvas} canvas
 */
function drawBench(canvas) {
	for (let y = BENCH_BACK; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour;
			if (y < BENCH_FRONT) {
				// Plank joints run towards a point far above the bench.
				const lean = (x - 32) / (y - BENCH_BACK + 30);
				const joint = Math.abs(lean * 4 - Math.round(lean * 4)) < 0.05;
				colour = joint ? C.timber : C.timberLight;
				if (!joint && (x * 5 + y * 3) % 17 === 0) {
					colour = mix(C.timberLight, C.timber, 0.5);
				}
			} else if (y === BENCH_FRONT) {
				colour = C.timberLight;
			} else if (y < BENCH_FRONT + 3) {
				colour = C.timber;
			} else {
				colour = C.timberShade;
			}
			set(canvas, x, y, colour);
		}
	}
	// A drawer in the front, with a brass pull.
	rect(canvas, 36, 59, 22, 1, C.timber);
	rect(canvas, 45, 61, 4, 1, C.brass);
}

/**
 * The steam engine: an iron firebox under a riveted copper boiler, a tall brass chimney, a cylinder whose
 * piston rod turns the flywheel by its crank.
 * @param {Canvas} canvas
 */
function drawEngine(canvas) {
	const { x, y, w, h } = BOILER;
	// The firebox: an iron box on four stubby feet, lit along its top edge.
	for (let fy = y + h; fy <= BENCH_BACK + 6; fy++) {
		for (let fx = x + 1; fx <= x + w - 2; fx++) {
			let colour = C.stoneShade;
			if (fy === y + h) {
				colour = C.stone;
			} else if (fx === x + 1) {
				colour = C.stone;
			} else if (fx >= x + w - 3) {
				colour = C.roofShade;
			}
			set(canvas, fx, fy, colour);
		}
	}
	for (const fx of [x + 1, x + w - 4]) {
		rect(canvas, fx, BENCH_BACK + 7, 3, 1, C.roofShade);
	}
	// The boiler: a copper drum lying on its side, lit along the top, with two brass bands.
	for (let by = y; by < y + h; by++) {
		const t = (by - y) / (h - 1);
		for (let bx = x; bx < x + w; bx++) {
			const corner =
				(bx === x || bx === x + w - 1) &&
				(by === y || by === y + h - 1);
			if (corner) {
				continue;
			}
			const band = bx === x + 4 || bx === x + w - 6;
			const metal = band ? BRASS : COPPER;
			let colour = metal.main;
			if (t < 0.2) {
				colour = metal.light;
			} else if (t > 0.75) {
				colour = metal.shade;
			} else if (t > 0.55) {
				colour = metal.mid;
			}
			set(canvas, bx, by, colour);
		}
	}
	// The chimney: a tall brass pipe with a flared cap.
	for (let cy = CHIMNEY.y + 1; cy < y; cy++) {
		set(canvas, CHIMNEY.x - 1, cy, BRASS.light);
		set(canvas, CHIMNEY.x, cy, BRASS.main);
		set(canvas, CHIMNEY.x + 1, cy, BRASS.shade);
	}
	rect(canvas, CHIMNEY.x - 2, CHIMNEY.y, 5, 1, BRASS.main);
	set(canvas, CHIMNEY.x - 2, CHIMNEY.y, BRASS.light);
	set(canvas, CHIMNEY.x + 2, CHIMNEY.y, BRASS.shade);
	// The cylinder lying on the boiler, its piston rod reaching back to the flywheel's crank pin.
	rect(canvas, x + 6, y - 5, 9, 5, BRASS.main);
	rect(canvas, x + 6, y - 5, 9, 1, BRASS.light);
	rect(canvas, x + 6, y - 1, 9, 1, BRASS.shade);
	rect(canvas, x + 5, y - 6, 1, 7, BRASS.mid);
	rect(canvas, x + 15, y - 6, 1, 7, BRASS.mid);
	// The flywheel, standing on an iron bracket.
	rect(
		canvas,
		FLYWHEEL.x - 1,
		FLYWHEEL.y,
		3,
		BENCH_BACK + 5 - FLYWHEEL.y,
		C.stoneShade
	);
	rect(canvas, FLYWHEEL.x - 4, BENCH_BACK + 4, 9, 2, C.stoneShade);
	drawWheel(canvas, {
		...FLYWHEEL,
		spokes: 6,
		tyre: C.roofShade,
		spoke: C.stone,
		hub: BRASS.main,
	});
	// The crank pin and the piston rod.
	const pin = { x: FLYWHEEL.x + 5, y: FLYWHEEL.y - 6 };
	line(canvas, pin.x, pin.y, x + 5, y - 3, C.stoneLight);
	line(canvas, pin.x, pin.y + 1, x + 5, y - 2, C.stone);
	rect(canvas, pin.x - 1, pin.y - 1, 2, 2, BRASS.main);
}

/**
 * The fire glowing through the firebox's open door.
 * @param {Canvas} canvas
 */
function drawFire(canvas) {
	paint(canvas, 41, 36, ['aaaaaaa', 'agyyyga', 'ayrrrya', 'arrgrra'], {
		a: C.roofShade,
		g: C.amber,
		y: C.lampGlow,
		r: C.gold,
	});
}

/**
 * A pressure gauge on the boiler's end: a round cream dial in a dark rim, its red needle pointing up and to the right.
 * @param {Canvas} canvas
 */
function drawGauge(canvas) {
	paint(canvas, 53, 23, ['.kkk.', 'kwwrk', 'kwrwk', 'kwwwk', '.kkk.'], {
		k: C.ink,
		w: C.creamLight,
		r: C.brickRed,
	});
}

/**
 * A gear standing on its edge: square teeth round a rim, a groove inside it and an axle hole, lit from the upper left.
 * @param {Canvas} canvas
 * @param {Gear} gear
 */
function drawGear(canvas, { x, y, r, teeth, turn, metal }) {
	const reach = r + 3;
	for (let dy = -reach; dy <= reach; dy++) {
		for (let dx = -reach; dx <= reach; dx++) {
			const d = Math.hypot(dx, dy);
			let tooth = false;
			for (let k = 0; k < teeth; k++) {
				const a = ((k + turn) / teeth) * Math.PI * 2;
				const along = dx * Math.cos(a) + dy * Math.sin(a);
				const across = -dx * Math.sin(a) + dy * Math.cos(a);
				if (
					along > r - 1 &&
					along <= r + 2.4 &&
					Math.abs(across) <= 1.5
				) {
					tooth = true;
				}
			}
			if (!tooth && d > r + 0.4) {
				continue;
			}
			if (d < 1.5) {
				continue;
			}
			// Which way this part faces: towards the light on the upper left, or away from it.
			const facing = (-dx - dy) / (d * Math.SQRT2);
			let colour = metal.main;
			if (d > r - 2.6 && d <= r - 1.6) {
				colour = metal.mid;
			} else if (d > r - 1.6 && facing > 0.25) {
				colour = metal.light;
			} else if (d > r - 1.6 && facing < -0.25) {
				colour = metal.shade;
			} else if (d < 3 && facing < 0) {
				colour = metal.mid;
			}
			set(canvas, x + dx, y + dy, colour);
		}
	}
}

/**
 * The axles at the gears' centres, drawn after the outline so they stay small.
 * @param {Canvas} scene
 */
function drawHubs(scene) {
	for (const { x, y } of [BIG, SMALL]) {
		set(scene, x, y, C.roofShade);
	}
}

/**
 * A small conical flask of green liquid at the back of the bench, under the window.
 * @param {Canvas} canvas
 */
function drawFlask(canvas) {
	const cx = 6;
	for (let y = 30; y <= 41; y++) {
		const half = y < 33 ? 1 : Math.min(4, 1 + Math.floor((y - 32) / 2));
		for (let x = cx - half; x <= cx + half; x++) {
			const liquid = y >= 37;
			let colour = liquid ? C.grass : C.daySky6;
			if (x === cx + half) {
				colour = liquid ? C.grassShade : C.daySky5;
			} else if (x === cx - half + 1) {
				colour = liquid ? C.grassLight : C.white;
			}
			if (y === 37) {
				colour = C.grassLight;
			}
			set(canvas, x, y, colour);
		}
	}
	rect(canvas, cx - 1, 28, 3, 2, C.timber);
	set(canvas, cx - 1, 28, C.timberLight);
}

/**
 * A paintbrush lying across the bench, its bristles loaded with red paint.
 * @param {Canvas} scene
 */
function drawBrush(scene) {
	line(scene, 35, 51, 47, 47, C.daySea2);
	line(scene, 35, 52, 47, 48, C.daySea3);
	rect(scene, 48, 46, 2, 2, C.stoneLight);
	set(scene, 49, 47, C.stone);
	paint(scene, 50, 45, ['ttt.', 'tttr', '.rrr'], {
		t: C.wood,
		r: C.brickRedLight,
	});
}

/**
 * A wooden rule laid along the bench's front edge.
 * @param {Canvas} scene
 */
function drawRuler(scene) {
	rect(scene, 33, BENCH_FRONT - 3, 31, 1, C.sandLight);
	rect(scene, 33, BENCH_FRONT - 2, 31, 1, C.sand);
	rect(scene, 33, BENCH_FRONT - 1, 31, 1, C.sandShade);
}

/**
 * The rule's marks, short and long by turns, drawn after the outline so they stay fine.
 * @param {Canvas} scene
 */
function drawRulerTicks(scene) {
	for (let x = 35; x < 64; x += 2) {
		set(scene, x, BENCH_FRONT - 3, C.timber);
		if ((x - 35) % 8 === 0) {
			set(scene, x, BENCH_FRONT - 2, C.timber);
		}
	}
}
