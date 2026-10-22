// Levitation: a great granite block floating above the ground at dusk, a rope trailing from its iron ring and small rocks hovering in a violet glow.
import {
	createCanvas,
	get,
	set,
	clear,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The block: its front face, and how far its top and right side recede up and to the right. */
const BLOCK = { left: 11, right: 40, top: 17, bottom: 35, depth: 8 };

/** The iron ring set into the block's front, which the rope is tied to: its centre. */
const RING = { x: 25, y: 25 };

/** The ground's first row. */
const GROUND = 48;

/** The middle of the violet light pooling on the ground under the block. */
const POOL = { x: 30, y: 54, rx: 21, ry: 4.5 };

/** The hovering rocks: each one's top-left pixel and its sprite (l lit, m mid, s shade, v violet underside). */
const ROCKS = [
	{ x: 2, y: 30, rows: ['.llm.', 'lmmms', 'mmmss', '.vvv.'] },
	{ x: 17, y: 41, rows: ['.lm', 'lms', 'vv.'] },
	{ x: 53, y: 20, rows: ['..ll.', '.lmms', 'lmmss', 'mmsv.', '.vv..'] },
];

/** The far hills against the sunset, and the near ground: a lit far band and a darker foreground. */
const HILLS = mix(C.duskSky2, C.ink, 0.25);
const GROUND_FAR = mix(C.timber, C.duskSky3, 0.45);
const GROUND_NEAR = mix(C.timberShade, C.duskSky2, 0.4);
const GROUND_EDGE = mix(C.timberLight, C.duskSky5, 0.4);

/** The granite's three faces: the top warmed by the sunset, the front, the side in shade, and the violet light from below. */
const TOP = mix(C.stoneLight, C.duskSky6, 0.2);
const FRONT = C.stone;
const SIDE = C.stoneShade;
const FRONT_LIT = mix(C.stone, C.arcaneLight, 0.4);
const SIDE_LIT = mix(C.stoneShade, C.arcane, 0.4);
const CHISEL = C.stoneShade;

/** The iron ring: its body and lit edge. */
const IRON = mix(C.stoneShade, C.ink, 0.55);
const IRON_LIGHT = C.stoneLight;

/** The rope: a lit strand and a shaded strand twisted together. */
const ROPE = C.timberLight;
const ROPE_SHADE = C.timber;

/**
 * Draws the Levitation tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4127);

	drawSky(layer);
	drawGround(layer);
	drawPool(layer);

	drawBlock(scene, random);
	drawRing(scene);
	drawRocks(scene);
	drawAura(layer, scene);
	drawRings(layer);
	drawRope(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawMotes(scene, random);
	return scene;
}

/**
 * Tells whether a point lies inside an ellipse.
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number, rx: number, ry: number }} e
 * @returns {number} How far out the point lies, 0 at the centre and 1 on the edge.
 */
function ellipse(x, y, e) {
	return Math.hypot((x - e.x) / e.rx, (y - e.y) / e.ry);
}

/**
 * The dusk sky in plain bands, violet at the top and orange at the horizon, with a low line of hills.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	const bands = [
		C.duskSky1,
		C.duskSky2,
		C.duskSky3,
		C.duskSky4,
		C.duskSky5,
		C.duskSky6,
	];
	for (let y = 0; y < GROUND; y++) {
		const band = Math.min(5, Math.floor((y / (GROUND - 2)) * 6));
		rect(layer, 0, y, 64, 1, bands[band]);
	}
	for (let x = 0; x < 64; x++) {
		const rise = Math.round(
			2 + Math.sin(x * 0.13) * 1.6 + Math.sin(x * 0.31 + 1) * 0.8
		);
		rect(layer, x, GROUND - rise, 1, rise, HILLS);
	}
}

/**
 * The bare ground: a lit far edge, a far band and a darker foreground.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	rect(layer, 0, GROUND, 64, 1, GROUND_EDGE);
	rect(layer, 0, GROUND + 1, 64, 5, GROUND_FAR);
	rect(layer, 0, GROUND + 6, 64, 64 - GROUND - 6, GROUND_NEAR);
	for (let x = 0; x < 64; x += 3) {
		set(layer, x, GROUND + 6, GROUND_FAR);
	}
}

/**
 * The violet light pooling on the ground under the block, in two bands.
 * @param {Canvas} layer
 */
function drawPool(layer) {
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = ellipse(x, y, POOL);
			const behind = get(layer, x, y);
			if (d < 0.6 && behind) {
				set(layer, x, y, mix(behind, C.arcaneLight, 0.45));
			} else if (d < 1 && behind) {
				set(layer, x, y, mix(behind, C.arcane, 0.35));
			}
		}
	}
}

/**
 * The lifting field: two thin violet rings between the block and the ground.
 * @param {Canvas} layer
 */
function drawRings(layer) {
	const rings = [
		{ x: 30, y: 40, rx: 19, ry: 2.6, colour: C.arcaneLight },
		{ x: 30, y: 46, rx: 15, ry: 2.2, colour: C.arcane },
	];
	for (const ring of rings) {
		for (let a = 0; a < Math.PI * 2; a += 0.01) {
			const x = Math.round(ring.x + Math.cos(a) * ring.rx);
			const y = Math.round(ring.y + Math.sin(a) * ring.ry);
			set(layer, x, y, ring.colour);
		}
	}
}

/**
 * The violet aura hugging everything that floats: two bands round the block and the rocks, brightest closest in.
 * @param {Canvas} layer
 * @param {Canvas} floating - The block and the rocks, before the rope is added
 */
function drawAura(layer, floating) {
	const reach = 5;
	for (let y = 0; y < GROUND; y++) {
		for (let x = 0; x < 64; x++) {
			if (get(floating, x, y)) {
				continue;
			}
			let nearest = Infinity;
			for (let dy = -reach; dy <= reach; dy++) {
				for (let dx = -reach; dx <= reach; dx++) {
					if (get(floating, x + dx, y + dy)) {
						nearest = Math.min(nearest, Math.hypot(dx, dy));
					}
				}
			}
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			if (nearest <= 2.9) {
				set(layer, x, y, mix(behind, C.arcane, 0.5));
			} else if (nearest <= reach) {
				set(layer, x, y, mix(behind, C.arcane, 0.25));
			}
		}
	}
}

/**
 * The block: a lit top, the front, the shaded right side, chisel marks, a chipped corner and violet light on its underside.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBlock(scene, random) {
	const { left, right, top, bottom, depth } = BLOCK;
	// The top, receding up and to the right.
	for (let k = 1; k <= depth; k++) {
		rect(scene, left + k, top - k, right - left + 1, 1, TOP);
	}
	// The right side.
	for (let k = 1; k <= depth; k++) {
		for (let y = top - k + 1; y <= bottom - k; y++) {
			const lit = y > bottom - k - 3;
			set(scene, right + k, y, lit ? SIDE_LIT : SIDE);
		}
	}
	// The front, its lit left edge, and the violet light from below on its last rows.
	rect(scene, left, top, right - left + 1, bottom - top + 1, FRONT);
	rect(scene, left, top, 1, bottom - top - 2, TOP);
	rect(scene, left, bottom - 2, right - left + 1, 3, FRONT_LIT);
	rect(scene, left + 1, top, right - left, 1, TOP);
	// Chisel marks across the front and the top.
	for (let i = 0; i < 8; i++) {
		const x = left + 3 + Math.floor(random() * (right - left - 6));
		const y = top + 2 + Math.floor(random() * (bottom - top - 6));
		rect(scene, x, y, 2 + Math.floor(random() * 2), 1, CHISEL);
	}
	for (let i = 0; i < 4; i++) {
		const k = 2 + Math.floor(random() * (depth - 3));
		const x = left + k + 3 + Math.floor(random() * (right - left - 8));
		rect(scene, x, top - k, 3, 1, C.stoneLight);
	}
	// A crack running down from the top edge.
	for (const [x, y] of [
		[34, 17],
		[34, 18],
		[33, 19],
		[33, 20],
		[34, 21],
		[34, 22],
		[35, 23],
	]) {
		set(scene, x, y, SIDE);
	}
	// Chips knocked out of the edges, so it reads as rough-hewn stone, not a box.
	for (const [x, y] of [
		[left, top],
		[left + 1, top - 1],
		[left + 2, top - 2],
		[left, top + 1],
		[left + 1, top],
		[left, top + 2],
		[left + 3, top - 3],
		[left + 12, top - depth],
		[left + 13, top - depth],
		[left + 14, top - depth],
		[right + depth, top - depth + 1],
		[right + depth, top - depth + 2],
		[right + depth - 1, top - depth + 1],
		[right + 4, bottom - 4],
		[right + 5, bottom - 5],
		[right + 5, bottom - 6],
		[right + 3, bottom - 3],
		[right + 4, bottom - 5],
		[left, bottom],
		[left, bottom - 1],
		[left + 1, bottom],
		[left + 20, bottom],
		[left + 21, bottom],
		[left, top + 10],
	]) {
		clear(scene, x, y);
	}
}

/**
 * The iron ring set into the block's front: a staple and the round ring hanging from it.
 * @param {Canvas} scene
 */
function drawRing(scene) {
	const { x, y } = RING;
	rect(scene, x - 2, y - 6, 5, 2, IRON);
	rect(scene, x - 1, y - 6, 3, 1, IRON_LIGHT);
	for (let dy = -4; dy <= 4; dy++) {
		for (let dx = -4; dx <= 4; dx++) {
			const d = Math.hypot(dx, dy);
			if (d > 2.2 && d < 4) {
				set(scene, x + dx, y + dy, dx + dy < -1 ? IRON_LIGHT : IRON);
			}
		}
	}
}

/**
 * Paints one twisted strand of rope along a list of points, two pixels thick, the twist alternating light and shade.
 * @param {Canvas} scene
 * @param {readonly (readonly [number, number])[]} points
 */
function strand(scene, points) {
	points.forEach(([x, y], i) => {
		set(scene, x, y, i % 2 === 0 ? ROPE : ROPE_SHADE);
		set(scene, x + 1, y, i % 2 === 0 ? ROPE_SHADE : ROPE);
	});
}

/**
 * The rope: knotted to the iron ring, its loose end falling down the front and slack to the ground.
 * @param {Canvas} scene
 */
function drawRope(scene) {
	// The knot round the bottom of the ring.
	rect(scene, RING.x - 1, RING.y + 3, 3, 2, ROPE);
	set(scene, RING.x, RING.y + 4, ROPE_SHADE);
	// The loose end: down the block's front, then a slack curve down and to the left, coming to rest on the ground.
	/** @type {[number, number][]} */
	const tail = [];
	const p0 = [RING.x, RING.y + 5];
	const p1 = [RING.x + 4, GROUND + 4];
	const p2 = [9, GROUND + 6];
	let last = '';
	for (let t = 0; t <= 1; t += 0.01) {
		const u = 1 - t;
		const x = Math.round(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]);
		const y = Math.round(u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]);
		const key = `${x},${y}`;
		if (key !== last) {
			tail.push([x, y]);
			last = key;
		}
	}
	strand(scene, tail);
	// The frayed end.
	set(scene, p2[0] - 1, p2[1] - 1, ROPE);
	set(scene, p2[0] - 1, p2[1] + 1, ROPE_SHADE);
}

/**
 * The small rocks hovering round the block: rough grey stones, lit on top, violet underneath.
 * @param {Canvas} scene
 */
function drawRocks(scene) {
	const colours = {
		l: C.stoneLight,
		m: C.stone,
		s: C.stoneShade,
		v: SIDE_LIT,
	};
	for (const { x, y, rows } of ROCKS) {
		paint(scene, x, y, rows, colours);
	}
}

/**
 * Violet motes drifting up from the pool towards the block, over the outline.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawMotes(scene, random) {
	for (let i = 0; i < 14; i++) {
		const x = 12 + Math.floor(random() * 38);
		const y = BLOCK.bottom + 3 + Math.floor(random() * 14);
		const behind = get(scene, x, y);
		if (
			behind &&
			behind !== C.ink &&
			behind !== ROPE &&
			behind !== ROPE_SHADE
		) {
			set(scene, x, y, i % 3 === 0 ? C.white : C.arcaneLight);
		}
	}
}
