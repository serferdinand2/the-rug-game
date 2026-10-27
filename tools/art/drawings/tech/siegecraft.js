// Siegecraft: a wooden trebuchet close up at dusk, its arm swinging up and a stone flying from the sling.
import {
	createCanvas,
	get,
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row; the dusky field starts below it. */
const HORIZON = 49;

/** The axle the arm turns on, at the top of the A-frame. */
const PIVOT = { x: 24, y: 22 };

/** The arm's tip, swung up past the top of its arc, and its short end, which carries the counterweight. */
const TIP = { x: 44, y: 3 };
const SHORT = { x: 18, y: 28 };

/** The counterweight box, hanging between the legs. */
const BOX = { x: 11, y: 32, w: 14, h: 11 };

/** The sling's open pouch, and the stone flying free of it. */
const POUCH = { x: 51, y: 10 };
const STONE = { x: 58, y: 6, r: 3 };

/** The setting sun's direction: low on the left, so every beam is lit on its left side. */
const LIGHT = { x: -1, y: -0.35 };

/** The field at dusk: the far strip catching the afterglow, then darker towards the viewer. */
const FIELD_FAR = mix(C.grassShade, C.duskSky5, 0.35);
const FIELD = mix(C.grassShade, C.duskSky2, 0.45);
const FIELD_NEAR = mix(C.forestFloorShade, C.duskSky1, 0.45);

/** The far castle wall, a faint flat silhouette on the horizon. */
const WALL = mix(C.duskSky3, C.duskSky4, 0.55);

/** Timber with a warm rim where the low sun catches it. */
const WOOD_RIM = mix(C.timberLight, C.duskSky6, 0.45);

/** The swing's trail and the stone's speed lines, faint against the sky. */
const TRAIL = mix(C.duskSky4, C.cream, 0.4);

/** A set of tones for one material: lit side, middle and shaded side. */
/** @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones */

/** @type {Tones} */
const TIMBER = { light: C.timberLight, base: C.timber, shade: C.timberShade };

/** @type {Tones} */
const ARM = { light: WOOD_RIM, base: C.timberLight, shade: C.timber };

/**
 * Draws the Siegecraft tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5381);

	drawDusk(layer, random);
	drawWall(layer);
	drawField(layer, random);
	drawTrail(layer);

	stamp(scene, drawCounterweight);
	stamp(scene, drawArm);
	stamp(scene, drawFrame);
	drawHub(scene);
	drawSling(scene);
	drawStone(scene, STONE.x, STONE.y, STONE.r);
	drawAmmunition(scene);
	outline(scene, C.ink);
	drawAfterglow(scene);
	underlay(scene, layer);
	return scene;
}

/**
 * Paints one part on its own canvas, outlines it, and lays it over the scene, so a part in front keeps its ink edge.
 * @param {Canvas} scene
 * @param {(canvas: Canvas) => void} paintPart
 */
function stamp(scene, paintPart) {
	const part = createCanvas(64, 64);
	paintPart(part);
	outline(part, C.ink);
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			scene.p[i] = part.p[i];
		}
	}
}

/**
 * The dusk sky: purple overhead to orange at the horizon, with a few early stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawDusk(layer, random) {
	const ramp = [
		C.duskSky1,
		C.duskSky2,
		C.duskSky3,
		C.duskSky4,
		C.duskSky5,
		C.duskSky6,
	];
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) * (ramp.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < ramp.length && t - i > 0.7 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? ramp[i + 1] : ramp[i]);
		}
	}
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 9);
		set(layer, x, y, C.starDim);
	}
}

/**
 * The far castle wall the stone is flying at: a low crenellated line and one tower, flat and faint.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let x = 44; x < 64; x++) {
		const merlon = x % 3 !== 0;
		const top = merlon ? 44 : 45;
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, WALL);
		}
	}
	for (let x = 55; x <= 59; x++) {
		const top = x % 2 === 1 ? 39 : 40;
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, WALL);
		}
	}
}

/**
 * The field below the horizon, in three bands, with a few dark tufts.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawField(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		const colour =
			y < HORIZON + 3 ? FIELD_FAR : y < 57 ? FIELD : FIELD_NEAR;
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 63);
		const y = HORIZON + 4 + Math.floor(random() * 10);
		set(layer, x, y, FIELD_NEAR);
		set(layer, x + 1, y - 1, FIELD_NEAR);
	}
}

/**
 * Two faint arcs behind the arm, the path its tip has just swept up through.
 * @param {Canvas} layer
 */
function drawTrail(layer) {
	const reach = Math.hypot(TIP.x - PIVOT.x, TIP.y - PIVOT.y);
	const end = Math.atan2(TIP.y - PIVOT.y, TIP.x - PIVOT.x);
	for (const [radius, start] of [
		[reach - 1, end - 1.25],
		[reach - 5, end - 1.0],
	]) {
		for (let a = start; a < end - 0.14; a += 0.02) {
			const x = Math.round(PIVOT.x + Math.cos(a) * radius);
			const y = Math.round(PIVOT.y + Math.sin(a) * radius);
			set(layer, x, y, TRAIL);
		}
	}
	// Speed lines trailing the stone.
	line(layer, 49, 5, 53, 5, TRAIL);
	line(layer, 50, 8, 53, 7, TRAIL);
}

/**
 * Paints a straight beam of timber, lit on the side facing the sun.
 * @param {Canvas} canvas
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {number} startWidth - Width at `from`
 * @param {number} endWidth - Width at `to`
 * @param {Tones} tones
 */
function beam(canvas, from, to, startWidth, endWidth, tones) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const length = Math.hypot(dx, dy);
	let nx = -dy / length;
	let ny = dx / length;
	if (nx * LIGHT.x + ny * LIGHT.y < 0) {
		nx = -nx;
		ny = -ny;
	}
	const pad = Math.ceil(Math.max(startWidth, endWidth));
	for (
		let y = Math.min(from.y, to.y) - pad;
		y <= Math.max(from.y, to.y) + pad;
		y++
	) {
		for (
			let x = Math.min(from.x, to.x) - pad;
			x <= Math.max(from.x, to.x) + pad;
			x++
		) {
			const t =
				((x - from.x) * dx + (y - from.y) * dy) / (length * length);
			if (t < 0 || t > 1) {
				continue;
			}
			const half = (startWidth + (endWidth - startWidth) * t) / 2;
			const across = (x - from.x) * nx + (y - from.y) * ny;
			if (Math.abs(across) > half) {
				continue;
			}
			let colour = tones.base;
			if (across > half - 1) {
				colour = tones.light;
			} else if (across < 1 - half) {
				colour = tones.shade;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The A-frame: a ground beam, two splayed legs meeting at the axle, and a cross brace.
 * @param {Canvas} scene
 */
function drawFrame(scene) {
	// The ground beam, its sawn end facing us on the right.
	rect(scene, 0, 51, 48, 4, C.timber);
	rect(scene, 0, 51, 48, 1, C.timberLight);
	rect(scene, 0, 54, 48, 1, C.timberShade);
	rect(scene, 48, 51, 3, 4, C.timberLight);
	set(scene, 49, 52, C.timber);
	// The legs and the brace.
	beam(scene, { x: 3, y: 51 }, PIVOT, 4.4, 3.4, TIMBER);
	beam(scene, { x: 45, y: 51 }, PIVOT, 4.4, 3.4, TIMBER);
	rect(scene, 9, 45, 30, 3, C.timber);
	rect(scene, 9, 45, 30, 1, C.timberLight);
	// Iron pegs where the brace meets the legs.
	set(scene, 9, 46, C.stoneLight);
	set(scene, 38, 46, C.stoneLight);
}

/**
 * The counterweight: a plank box bound in iron and heaped with rocks, hanging from the arm's short end.
 * @param {Canvas} scene
 */
function drawCounterweight(scene) {
	const { x, y, w, h } = BOX;
	// The iron straps from the arm to the box.
	line(scene, SHORT.x, SHORT.y, x + 1, y, C.stoneShade);
	line(scene, SHORT.x, SHORT.y, x + w - 2, y, C.stoneShade);
	// The rocks heaped above the rim.
	for (const [cx, cy, r] of [
		[x + 3, y - 1, 2],
		[x + 7, y - 2, 2.5],
		[x + 10, y - 1, 1.5],
	]) {
		ball(scene, cx, cy, r);
	}
	rect(scene, x, y, w, h, C.timberShade);
	rect(scene, x, y, 1, h, C.timber);
	for (let px = x + 3; px < x + w; px += 3) {
		rect(scene, px, y + 1, 1, h - 1, C.wood);
	}
	// Two iron bands with rivets.
	for (const by of [y + 2, y + h - 3]) {
		rect(scene, x, by, w, 1, C.stoneShade);
		for (let px = x + 1; px < x + w; px += 4) {
			set(scene, px, by, C.stone);
		}
	}
}

/**
 * The throwing arm: a long tapering beam through the axle, bound with iron, and the axle's iron hub.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	beam(scene, SHORT, TIP, 5.5, 3, ARM);
	// Iron bindings across the arm, where it is painted.
	const dx = TIP.x - SHORT.x;
	const dy = TIP.y - SHORT.y;
	const square = dx * dx + dy * dy;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const t = ((x - SHORT.x) * dx + (y - SHORT.y) * dy) / square;
			const band = (t > 0.4 && t < 0.45) || (t > 0.72 && t < 0.76);
			if (band && get(scene, x, y)) {
				set(scene, x, y, C.stoneShade);
			}
		}
	}
}

/**
 * The axle's iron hub, in front of everything at the top of the frame.
 * @param {Canvas} scene
 */
function drawHub(scene) {
	for (let y = PIVOT.y - 2; y <= PIVOT.y + 2; y++) {
		for (let x = PIVOT.x - 2; x <= PIVOT.x + 2; x++) {
			const d = Math.hypot(x - PIVOT.x, y - PIVOT.y);
			if (d < 2.4) {
				set(
					scene,
					x,
					y,
					d < 1 ? C.stoneShade : x < PIVOT.x ? C.stoneLight : C.stone
				);
			}
		}
	}
}

/**
 * The sling: two ropes whipping from the arm's tip to the empty leather pouch.
 * @param {Canvas} scene
 */
function drawSling(scene) {
	line(scene, TIP.x + 1, TIP.y, POUCH.x - 1, POUCH.y - 1, C.sand);
	line(scene, TIP.x + 1, TIP.y + 1, POUCH.x - 2, POUCH.y + 1, C.sandShade);
	rect(scene, POUCH.x - 1, POUCH.y - 1, 2, 3, C.timberShade);
	set(scene, POUCH.x - 1, POUCH.y - 1, C.timber);
}

/**
 * A round stone, lit on its upper left.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 */
function ball(canvas, cx, cy, r) {
	const reach = Math.ceil(r);
	for (let y = Math.floor(cy) - reach; y <= cy + reach; y++) {
		for (let x = Math.floor(cx) - reach; x <= cx + reach; x++) {
			const dx = x - cx;
			const dy = y - cy;
			if (dx * dx + dy * dy > r * r + 0.5) {
				continue;
			}
			const facing = -(dx + dy) / (r || 1);
			set(
				canvas,
				x,
				y,
				facing > 0.6
					? C.stoneLight
					: facing < -0.5
						? C.stoneShade
						: C.stone
			);
		}
	}
}

/**
 * The flying stone.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} r
 */
function drawStone(scene, x, y, r) {
	ball(scene, x, y, r);
}

/**
 * A small pyramid of stones waiting by the frame for the next throw.
 * @param {Canvas} scene
 */
function drawAmmunition(scene) {
	ball(scene, 54, 59, 3);
	ball(scene, 61, 59, 3);
	ball(scene, 57.5, 54, 3);
}

/**
 * The afterglow of the sun, just set on the left, warming the timber nearest it. It runs before the sky is laid under, so only the trebuchet takes it.
 * @param {Canvas} scene
 */
function drawAfterglow(scene) {
	glow(scene, {
		x: 0,
		y: HORIZON,
		radius: 40,
		colour: C.duskSky6,
		strength: 0.3,
		steps: 2,
		skip: [C.ink],
	});
}
