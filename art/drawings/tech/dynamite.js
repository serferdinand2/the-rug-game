// Dynamite: a bundle of red sticks tied with twine on a rocky ledge at dusk, its fuse fizzing, a plunger detonator beside it.
import {
	createCanvas,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The bundle: the front sticks' centres, the back sticks' centres, their tops, and the row they all stand on. */
const BUNDLE = {
	front: [12, 28, 20],
	back: [16, 24],
	frontTop: 19,
	backTop: 15,
	bottom: 56,
};

/** Where the fuse ends and the spark fizzes. */
const SPARK = { x: 38, y: 8 };

/** The detonator box: its front face, and how far its top and side recede. */
const BOX = { x: 40, y: 41, w: 16, h: 15, depth: 4 };

/** The ledge's far edge, where the canyon drops away. */
const LEDGE_TOP = 45;

/** A stick's darkest red, on the side away from the sun. */
const STICK_DARK = mix(C.brickRedShade, C.ink, 0.3);

/** The rock of the ledge, warmed by the setting sun. */
const ROCK_LIGHT = mix(C.stoneLight, C.duskSky6, 0.5);
const ROCK = mix(C.stone, C.duskSky5, 0.3);
const ROCK_SHADE = mix(C.stoneShade, C.duskSky4, 0.3);
const ROCK_CRACK = mix(C.stoneShade, C.roofShade, 0.6);

/** The far mesas across the canyon, and their sunlit rims. */
const MESA_FAR = mix(C.roofLight, C.duskSky4, 0.45);
const MESA = mix(C.roof, C.duskSky3, 0.35);
const MESA_STREAK = mix(C.roof, C.roofShade, 0.4);
const MESA_RIM = mix(C.duskSky5, C.duskSky6, 0.5);

/** The box's far side, in the shade. */
const BOX_SIDE = mix(C.timberShade, C.wood, 0.5);

/** Smoke curling off the burning fuse. */
const SMOKE = mix(C.stoneLight, C.duskSky3, 0.45);

/**
 * Draws the Dynamite tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4471);

	drawSky(layer, { time: 'dusk', horizon: 40, random });
	drawMesas(layer);
	drawLedge(layer, random);
	drawWire(layer);

	drawBundle(scene);
	drawDetonator(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawFuse(scene);
	glow(scene, {
		x: SPARK.x,
		y: SPARK.y,
		radius: 24,
		colour: C.lampGlow,
		strength: 0.4,
		steps: 4,
		skip: [C.ink],
	});
	drawSmoke(scene);
	drawSpark(scene, random);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} target
 * @param {Canvas} source
 */
function stamp(target, source) {
	for (let i = 0; i < source.p.length; i++) {
		if (source.p[i]) {
			target.p[i] = source.p[i];
		}
	}
}

/**
 * Flat-topped mesas across the canyon, a nearer row in front of a hazier one, with a notch where the sun sets.
 * @param {Canvas} layer
 */
function drawMesas(layer) {
	/**
	 * The top row of each mesa band at a column.
	 * @param {number} x
	 * @param {boolean} near
	 * @returns {number}
	 */
	const top = (x, near) => {
		if (near) {
			if (x < 6) {
				return 44;
			}
			if (x < 17) {
				return 38;
			}
			if (x < 34) {
				return 36;
			}
			if (x < 47) {
				return 39;
			}
			return 34;
		}
		if (x < 6) {
			return 43;
		}
		if (x < 13) {
			return 34;
		}
		if (x < 26) {
			return 30;
		}
		if (x < 52) {
			return 33;
		}
		return 29;
	};
	for (let x = 0; x < 64; x++) {
		for (let y = top(x, false); y < LEDGE_TOP; y++) {
			set(layer, x, y, y === top(x, false) ? MESA_RIM : MESA_FAR);
		}
	}
	// The sun sinking into the gap at the left, behind the near mesas.
	for (let y = 34; y <= 44; y++) {
		for (let x = 0; x <= 8; x++) {
			const d = Math.hypot(x - 1, y - 42);
			if (d < 5.5) {
				set(layer, x, y, d < 3.8 ? C.lampGlow : C.gold);
			}
		}
	}
	for (let x = 0; x < 64; x++) {
		const t = top(x, true);
		// A cliff face catches the sun where the mesa steps up from its left neighbour.
		const face = x > 0 && top(x - 1, true) > t;
		for (let y = t; y < LEDGE_TOP; y++) {
			let colour = MESA;
			if (y === t || (face && y < t + 6)) {
				colour = MESA_RIM;
			} else if ((x * 3 + Math.floor(y / 3)) % 7 === 0) {
				colour = MESA_STREAK;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The rocky ledge in front: a sunlit rim, warm stone with cracks and pebbles, and the shadows the bundle and the box cast.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLedge(layer, random) {
	for (let y = LEDGE_TOP; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = ROCK;
			if (y <= LEDGE_TOP + 1) {
				colour = ROCK_LIGHT;
			} else if (y > 59 || (y > 55 && (x + y) % 2 === 0)) {
				colour = ROCK_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	for (const [x0, y0, x1, y1] of [
		[2, 49, 7, 52],
		[7, 52, 6, 58],
		[34, 48, 38, 50],
		[50, 58, 58, 61],
		[58, 61, 63, 60],
	]) {
		line(layer, x0, y0, x1, y1, ROCK_CRACK);
	}
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = LEDGE_TOP + 3 + Math.floor(random() * 16);
		set(layer, x, y, random() > 0.5 ? ROCK_LIGHT : ROCK_CRACK);
	}
	// The shadows, thrown to the right away from the low sun.
	for (let y = 52; y < 61; y++) {
		for (let x = 18; x < 64; x++) {
			const bundle = ((x - 30) / 9) ** 2 + ((y - 57) / 2.6) ** 2 < 1;
			const box = x > 52 && x < 64 && y > 52 && y < 59;
			if (bundle || box) {
				set(layer, x, y, ROCK_CRACK);
			}
		}
	}
}

/**
 * The firing wire, red and sagging, from the detonator's terminal across the rock to the bundle.
 * @param {Canvas} layer
 */
function drawWire(layer) {
	const points = [
		[41, 54],
		[38, 57],
		[34, 59],
		[30, 58],
	];
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		line(layer, x0, y0, x1, y1, C.brickRedLight);
		line(layer, x0, y0 + 1, x1, y1 + 1, C.brickRedShade);
	}
}

/**
 * One stick of dynamite standing on end: a red paper cylinder lit from the left, its crimped cream end on top.
 * @param {Canvas} canvas
 * @param {number} cx - The stick's centre column
 * @param {number} top - The row of its top end's centre
 * @param {number} bottom - The row of its bottom end's centre
 */
function drawStick(canvas, cx, top, bottom) {
	const mid = cx - 0.5;
	for (let y = top - 2; y <= bottom + 2; y++) {
		for (let x = cx - 4; x <= cx + 3; x++) {
			const dx = x - mid;
			const cap = (dx / 4) ** 2 + ((y - top) / 1.9) ** 2;
			const foot = (dx / 4) ** 2 + ((y - bottom) / 1.9) ** 2;
			if (cap < 1) {
				let colour = dx < 0 ? C.creamLight : C.cream;
				if (cap > 0.62) {
					colour = dx < -1 ? C.cream : C.creamShade;
				} else if (Math.abs(dx) < 1.2 && y === top) {
					colour = C.creamShade;
				}
				set(canvas, x, y, colour);
				continue;
			}
			if ((y < top || y > bottom) && foot >= 1) {
				continue;
			}
			let colour = C.brickRed;
			if (dx < -2.6) {
				colour = C.brickRed;
			} else if (dx < -0.6) {
				colour = C.brickRedLight;
			} else if (dx < 1.4) {
				colour = C.brickRed;
			} else if (dx < 2.6) {
				colour = C.brickRedShade;
			} else {
				colour = STICK_DARK;
			}
			// The wrapper's seam just below the end, and the foot in shadow on the rock.
			if (y === top + 3 || y >= bottom + 1) {
				colour = dx < 1.4 ? C.brickRedShade : STICK_DARK;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The bundle: two sticks behind, three in front, each outlined so they part cleanly, bound by two bands of twine with a knot.
 * @param {Canvas} scene
 */
function drawBundle(scene) {
	for (const cx of BUNDLE.back) {
		const stick = createCanvas(64, 64);
		drawStick(stick, cx, BUNDLE.backTop, BUNDLE.bottom - 2);
		outline(stick, C.ink);
		stamp(scene, stick);
	}
	for (const cx of BUNDLE.front) {
		const stick = createCanvas(64, 64);
		drawStick(stick, cx, BUNDLE.frontTop, BUNDLE.bottom);
		outline(stick, C.ink);
		stamp(scene, stick);
	}
	// The twine: two wrapped bands, lit on top.
	for (const y of [28, 47]) {
		for (let x = 8; x <= 31; x++) {
			set(scene, x, y, x < 12 ? C.sandLight : C.sand);
			set(scene, x, y + 1, C.sandShade);
		}
	}
	// The knot on the upper band, and its two loose ends.
	rect(scene, 18, 27, 4, 3, C.sand);
	set(scene, 18, 27, C.sandLight);
	set(scene, 19, 27, C.sandLight);
	set(scene, 21, 29, C.sandShade);
	line(scene, 18, 30, 17, 34, C.sandShade);
	line(scene, 21, 30, 22, 33, C.sandShade);
	set(scene, 18, 30, C.sand);
	set(scene, 21, 30, C.sand);
}

/**
 * The plunger detonator: a wooden box with iron corners and two brass terminals, its T-handle drawn up ready to fire.
 * @param {Canvas} scene
 */
function drawDetonator(scene) {
	const { x: bx, y: by, w, h, depth } = BOX;
	// The front face: planks lit from the left, an iron band at top and foot.
	for (let y = by; y < by + h; y++) {
		for (let x = bx; x < bx + w; x++) {
			let colour = x < bx + 3 ? C.timberLight : C.timber;
			if ((y - by) % 5 === 4) {
				colour = C.timberShade;
			}
			if (y === by || y === by + h - 1) {
				colour = C.stoneShade;
			}
			if (
				(x === bx || x === bx + w - 1) &&
				y !== by &&
				y !== by + h - 1
			) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	// Rivets on the iron corners.
	for (const [x, y] of [
		[bx, by + 2],
		[bx, by + h - 3],
		[bx + w - 1, by + 2],
		[bx + w - 1, by + h - 3],
	]) {
		set(scene, x, y, C.stoneLight);
	}
	// The top, receding up and to the right, and the shaded side.
	for (let k = 1; k <= depth; k++) {
		rect(
			scene,
			bx + k,
			by - k,
			w,
			1,
			k === depth ? C.timber : C.timberLight
		);
		for (let y = by - k + 1; y < by + h - k; y++) {
			set(
				scene,
				bx + w - 1 + k,
				y,
				k === depth ? BOX_SIDE : C.timberShade
			);
		}
	}
	rect(scene, bx + w, by - depth + 1, depth, 1, C.stoneShade);
	// The two brass terminals near the front corner.
	for (const x of [bx + 3, bx + 6]) {
		set(scene, x, by - 2, C.gold);
		set(scene, x + 1, by - 2, C.brass);
		set(scene, x, by - 3, C.brass);
	}
	// The plunger: a steel shaft rising from the top, and the wooden T-handle.
	const shaft = bx + 10;
	for (let y = 24; y <= by - 2; y++) {
		set(scene, shaft, y, C.stoneLight);
		set(scene, shaft + 1, y, C.stone);
	}
	rect(scene, shaft - 1, by - 3, 4, 1, C.stoneMid);
	rect(scene, bx + 3, 21, 16, 1, C.timberLight);
	rect(scene, bx + 3, 22, 16, 1, C.timber);
	rect(scene, bx + 3, 23, 16, 1, C.timberShade);
	for (const x of [bx + 3, bx + 18]) {
		set(scene, x, 21, C.timber);
		set(scene, x, 22, C.wood);
		set(scene, x, 23, C.wood);
	}
	rect(scene, shaft - 1, 20, 4, 1, C.stoneMid);
}

/**
 * The fuse: a twisted cord rising from the middle stick and curling over to the spark, scorched near its burning end.
 * @param {Canvas} scene
 */
function drawFuse(scene) {
	const points = [
		[20, 18],
		[20, 13],
		[22, 9],
		[26, 6],
		[31, 5],
		[35, 6],
		[SPARK.x, SPARK.y],
	];
	let step = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const length = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let k = 0; k < length; k++) {
			const x = Math.round(x0 + ((x1 - x0) * k) / length);
			const y = Math.round(y0 + ((y1 - y0) * k) / length);
			const burnt = i === points.length - 2;
			let colour = step % 2 === 0 ? C.sand : C.timberLight;
			if (burnt) {
				colour = k === length - 1 ? C.amber : C.wood;
			}
			set(scene, x, y, colour);
			set(scene, x + 1, y, burnt ? C.wood : C.timber);
			step++;
		}
	}
}

/**
 * A thin curl of smoke drifting up and to the left from the burning end.
 * @param {Canvas} scene
 */
function drawSmoke(scene) {
	for (const [x, y] of [
		[37, 5],
		[36, 4],
		[36, 3],
		[37, 2],
		[38, 1],
		[38, 0],
		[35, 3],
		[39, 2],
	]) {
		set(scene, x, y, SMOKE);
	}
}

/**
 * The fizzing spark: a white-hot core, a star of rays and a spray of embers.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSpark(scene, random) {
	const { x: sx, y: sy } = SPARK;
	// Embers flung out around it.
	for (let i = 0; i < 22; i++) {
		const angle = random() * Math.PI * 2;
		const distance = 3 + random() * 6;
		const x = Math.round(sx + Math.cos(angle) * distance);
		const y = Math.round(sy + Math.sin(angle) * distance * 0.9);
		if (x < 0 || y < 0 || x > 63 || y > 63) {
			continue;
		}
		const pick = random();
		set(
			scene,
			x,
			y,
			pick > 0.6 ? C.lampGlow : pick > 0.25 ? C.gold : C.amber
		);
	}
	// Eight rays, the straight ones longer.
	for (const [dx, dy, reach] of [
		[1, 0, 4],
		[-1, 0, 4],
		[0, 1, 4],
		[0, -1, 4],
		[1, 1, 2],
		[-1, 1, 2],
		[1, -1, 2],
		[-1, -1, 2],
	]) {
		for (let k = 1; k <= reach; k++) {
			set(
				scene,
				sx + dx * k,
				sy + dy * k,
				k === 1 ? C.lampGlow : k < 3 ? C.gold : C.amber
			);
		}
	}
	set(scene, sx, sy, C.white);
	set(scene, sx + 1, sy, C.white);
	set(scene, sx, sy - 1, C.white);
	set(scene, sx + 1, sy - 1, C.lampGlow);
}
