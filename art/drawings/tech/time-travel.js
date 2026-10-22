// Time Travel: a brass time machine, a padded seat on a sled with crystal-knobbed levers, inside a great spinning ring of dials crackling with violet light at night.
import {
	createCanvas,
	get,
	set,
	clear,
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

/** The ring of dials: its centre, the outer and inner edges of its rims, and the radius its dials sit on. */
const RING = {
	x: 32,
	y: 29,
	outer: 28.5,
	rim: 26.8,
	channel: 21.8,
	inner: 20,
	dials: 24.3,
};

/** The angles of the dials round the ring, in twelfths of a turn from the top; none at the bottom, where the sled stands. */
const DIALS = [0, 2, 4, 8, 10];

/** The ground's first row. */
const GROUND = 55;

/** The two lever knobs: violet crystals the traveller pulls. */
const KNOBS = [
	{ x: 25, y: 18 },
	{ x: 18, y: 16 },
];

/** The time vortex inside the ring: its deep, mid and bright violets. */
const VORTEX_DEEP = mix(C.arcaneShade, C.nightSky1, 0.55);
const VORTEX = C.arcaneShade;
const VORTEX_LIGHT = C.arcane;

/** The ground lit violet by the ring. */
const GROUND_LIT = mix(C.headland, C.arcaneShade, 0.45);

/** The sled's shadow on the lit ground. */
const SLED_SHADOW = mix(GROUND_LIT, C.ink, 0.45);

/** The ring's dark channel, deeper than its bronze rims so the brass machine stands out in front. */
const CHANNEL = mix(C.lampFrame, C.ink, 0.35);

/**
 * Draws the Time Travel tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const ring = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2895);

	drawSky(layer, random);
	// The ring's violet light spills into the night around it.
	glow(layer, {
		x: RING.x,
		y: RING.y,
		radius: 40,
		colour: C.arcaneShade,
		strength: 0.4,
		steps: 2,
		skip: [C.starDim],
	});
	drawVortex(layer);
	drawGround(layer);

	drawRing(ring);
	drawDials(ring);
	outline(ring, C.ink);
	underlay(ring, layer);

	drawSled(scene);
	drawSeat(scene);
	drawConsole(scene);
	outline(scene, C.ink);
	underlay(scene, ring);

	drawStreaks(scene);
	drawBolts(scene, random);
	for (const knob of KNOBS) {
		glow(scene, {
			x: knob.x,
			y: knob.y,
			radius: 6,
			colour: C.arcaneLight,
			strength: 0.35,
			steps: 2,
			skip: [C.ink, C.arcaneLight, C.white],
		});
	}
	return scene;
}

/**
 * The night sky: three plain bands, darkest at the top, and a few stars outside the ring.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	for (let y = 0; y < 64; y++) {
		const colour =
			y < 16 ? C.nightSky1 : y < 36 ? C.nightSky2 : C.nightSky3;
		rect(layer, 0, y, 64, 1, colour);
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (GROUND - 2));
		if (Math.hypot(x - RING.x, y - RING.y) > RING.outer + 2) {
			set(layer, x, y, C.starDim);
		}
	}
}

/**
 * The time vortex filling the ring: three broad violet arms swirling in to a bright heart.
 * @param {Canvas} layer
 */
function drawVortex(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - RING.x;
			const dy = y - RING.y;
			const r = Math.hypot(dx, dy);
			if (r >= RING.inner + 1) {
				continue;
			}
			const arm = Math.sin(3 * (Math.atan2(dy, dx) + r * 0.2));
			let colour = VORTEX_DEEP;
			if (r < 7 || arm > 0.75) {
				colour = VORTEX_LIGHT;
			} else if (r < 12 || arm > 0.1) {
				colour = VORTEX;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The bare ground the sled stands on, lit violet under the ring.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const lit = Math.abs(x - RING.x) < 30 - (y - GROUND) * 2;
			set(layer, x, y, lit ? GROUND_LIT : C.headland);
		}
	}
	rect(layer, 0, GROUND, 64, 1, C.headlandRidge);
	rect(layer, 12, GROUND, 41, 1, SLED_SHADOW);
	rect(layer, 15, GROUND + 1, 35, 1, SLED_SHADOW);
}

/**
 * Picks a bronze tone for a point on the ring by how much it faces the light at the top left.
 * @param {number} dx - Column offset from the centre
 * @param {number} dy - Row offset from the centre
 * @returns {Colour}
 */
function brassTone(dx, dy) {
	const facing = (-dx - dy) / ((Math.hypot(dx, dy) || 1) * Math.SQRT2);
	if (facing > 0.35) {
		return C.gold;
	}
	if (facing < -0.55) {
		return C.lampFrame;
	}
	return C.amber;
}

/**
 * The ring: a bronze outer and inner rim round a dark channel graduated with ticks.
 * @param {Canvas} ring
 */
function drawRing(ring) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - RING.x;
			const dy = y - RING.y;
			const r = Math.hypot(dx, dy);
			if (r >= RING.outer || r < RING.inner) {
				continue;
			}
			if (r >= RING.rim || r < RING.channel) {
				set(ring, x, y, brassTone(dx, dy));
			} else {
				set(ring, x, y, CHANNEL);
			}
		}
	}
	// The ticks: thirty-six short marks round the channel.
	for (let k = 0; k < 36; k++) {
		const angle = (k / 36) * Math.PI * 2;
		for (let r = RING.channel + 1.5; r < RING.rim - 1; r += 0.5) {
			set(
				ring,
				Math.round(RING.x + Math.sin(angle) * r),
				Math.round(RING.y - Math.cos(angle) * r),
				C.lampFrame
			);
		}
	}
}

/**
 * The dials set into the ring: cream faces in brass bezels, each with faint ticks and one long hand, no numbers.
 * @param {Canvas} ring
 */
function drawDials(ring) {
	for (const twelfth of DIALS) {
		const angle = (twelfth / 12) * Math.PI * 2;
		const cx = Math.round(RING.x + Math.sin(angle) * RING.dials);
		const cy = Math.round(RING.y - Math.cos(angle) * RING.dials);
		for (let y = cy - 5; y <= cy + 5; y++) {
			for (let x = cx - 5; x <= cx + 5; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d < 3.4) {
					set(
						ring,
						x,
						y,
						x - cx + (y - cy) > 2 ? C.cream : C.creamLight
					);
				} else if (d < 4.5) {
					set(ring, x, y, brassTone(x - cx, y - cy));
				}
			}
		}
		for (const [tx, ty] of [
			[0, -3],
			[3, 0],
			[0, 3],
			[-3, 0],
		]) {
			set(ring, cx + tx, cy + ty, C.creamShade);
		}
		// Each hand points a different way, as if the dials ran at different speeds.
		const hand = twelfth * 2.1 + 0.6;
		line(
			ring,
			cx,
			cy,
			cx + Math.round(Math.sin(hand) * 2.4),
			cy - Math.round(Math.cos(hand) * 2.4),
			C.ink
		);
	}
}

/**
 * Paints a brass bar lit from above: a gold top row, brass, and a dark bottom row when it is tall enough.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function brassBar(canvas, x, y, w, h) {
	rect(canvas, x, y, w, h, C.brass);
	rect(canvas, x, y, w, 1, C.gold);
	if (h >= 3) {
		rect(canvas, x, y + h - 1, w, 1, C.lampFrame);
	}
}

/**
 * Paints a brass post lit from the left: a gold left column, brass, and a dark right column when it is wide enough.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function brassPost(canvas, x, y, w, h) {
	rect(canvas, x, y, w, h, C.brass);
	rect(canvas, x, y, 1, h, C.gold);
	if (w >= 3) {
		rect(canvas, x + w - 1, y, 1, h, C.lampFrame);
	}
}

/**
 * The sled: a long runner curled up at the front, three struts and the deck the seat stands on.
 * @param {Canvas} scene
 */
function drawSled(scene) {
	brassBar(scene, 14, 52, 36, 2);
	// The curled front of the runner, and its turned-up tail.
	for (const [x, y] of [
		[13, 52],
		[12, 51],
		[11, 50],
		[11, 49],
		[12, 48],
		[13, 48],
	]) {
		set(scene, x, y, C.brass);
	}
	set(scene, 11, 49, C.gold);
	set(scene, 12, 48, C.gold);
	set(scene, 50, 51, C.brass);
	set(scene, 51, 50, C.gold);
	for (const x of [17, 31, 44]) {
		brassPost(scene, x, 48, 2, 4);
	}
	brassBar(scene, 15, 45, 33, 3);
}

/**
 * The seat: a tall tufted backrest leaning back in a brass frame, a padded cushion, its brass base and the armrest.
 * @param {Canvas} scene
 */
function drawSeat(scene) {
	// The base the cushion sits on.
	brassPost(scene, 26, 42, 16, 3);
	// The backrest, leaning back as it rises, with a rounded top.
	const top = 13;
	for (let y = top; y <= 41; y++) {
		const lean = Math.round((41 - y) / 9);
		const left = 37 + lean;
		const right = 45 + lean;
		for (let x = left; x <= right; x++) {
			if (y === top && (x === left || x === right)) {
				continue;
			}
			let colour = C.brickRed;
			if (x === left || y === top) {
				colour = C.gold;
			} else if (x === right) {
				colour = C.lampFrame;
			} else if (y === top + 1 || (x === right - 1 && y > top)) {
				colour = x === right - 1 ? C.brickRedShade : C.brass;
			} else if (x === left + 1) {
				colour = C.brickRedLight;
			}
			set(scene, x, y, colour);
		}
		// The tufting: buttons in two staggered columns.
		if (y > top + 3 && y < 37 && (y - top) % 5 === 0) {
			set(
				scene,
				left + 3 + ((y - top) % 10 === 0 ? 0 : 2),
				y,
				C.brickRedShade
			);
		}
	}
	// The cushion, rounded at the front.
	rect(scene, 23, 37, 18, 5, C.brickRed);
	rect(scene, 24, 37, 16, 1, C.brickRedLight);
	rect(scene, 23, 41, 18, 1, C.brickRedShade);
	clear(scene, 23, 37);
	clear(scene, 23, 41);
	// The armrest, scrolled at the front, on its post.
	brassBar(scene, 24, 31, 15, 2);
	brassPost(scene, 25, 33, 2, 4);
	set(scene, 23, 31, C.gold);
	set(scene, 23, 32, C.brass);
}

/**
 * The control console before the seat: a brass column, a box, and two levers ending in violet crystal knobs.
 * @param {Canvas} scene
 */
function drawConsole(scene) {
	brassPost(scene, 17, 31, 3, 14);
	brassBar(scene, 14, 27, 9, 4);
	line(scene, 20, 26, KNOBS[0].x, KNOBS[0].y + 1, C.brass);
	line(scene, 17, 26, KNOBS[1].x, KNOBS[1].y + 1, C.brass);
	for (const { x, y } of KNOBS) {
		set(scene, x, y - 1, C.arcaneLight);
		set(scene, x - 1, y, C.arcaneLight);
		set(scene, x, y, C.white);
		set(scene, x + 1, y, C.arcane);
		set(scene, x, y + 1, C.arcane);
	}
}

/**
 * The spin: violet trails just outside the ring, following each dial round.
 * @param {Canvas} scene
 */
function drawStreaks(scene) {
	for (const twelfth of DIALS) {
		const lead = (twelfth / 12) * Math.PI * 2;
		for (let step = 1; step <= 9; step++) {
			const angle = lead - step * 0.045;
			const r = RING.outer + 0.8;
			const x = Math.round(RING.x + Math.sin(angle) * r);
			const y = Math.round(RING.y - Math.cos(angle) * r);
			if (get(scene, x, y) === C.ink || y >= GROUND) {
				continue;
			}
			set(scene, x, y, step < 5 ? C.arcaneLight : C.arcane);
		}
	}
}

/**
 * The crackle: jagged violet bolts leaping across the vortex and off the ring into the night.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBolts(scene, random) {
	const bolts = [
		[25, 9, 33, 27, 5],
		[52, 31, 47, 23, 3],
		[9, 15, 2, 8, 3],
		[57, 42, 63, 49, 3],
		[13, 24, 23, 21, 3],
	];
	for (const [x0, y0, x1, y1, steps] of bolts) {
		let px = x0;
		let py = y0;
		for (let k = 1; k <= steps; k++) {
			const jag = k === steps ? 0 : Math.round((random() - 0.5) * 5);
			const nx = Math.round(x0 + ((x1 - x0) * k) / steps) + jag;
			const ny = Math.round(y0 + ((y1 - y0) * k) / steps) - jag;
			line(scene, px, py, nx, ny, C.arcaneLight);
			px = nx;
			py = ny;
		}
		set(scene, x0, y0, C.white);
	}
}
