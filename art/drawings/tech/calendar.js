// Calendar: a round stone calendar disc in a temple wall, carved with a gilded sun face, a ring of moon phases and a ring of tally notches, caught by the sun rising beyond the wall's end.
import {
	createCanvas,
	get,
	set,
	rect,
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

/**
 * A material's colours, from the edge facing the sun to the deepest shadow.
 * @typedef {[Colour, Colour, Colour, Colour, Colour]} Ramp
 */

/** The horizon beyond the wall's end, where the sun is rising. */
const HORIZON = 44;

/** The top of the temple wall's cornice, with sky above it. */
const WALL_TOP = 5;

/** The wall's sunlit end; beyond it, to the left, lies the view to the sunrise. */
const WALL_X = 15;

/** The disc's centre and radius, and the radii where its rings begin, from the rim inwards. It runs off the right edge. */
const DISC = {
	x: 43,
	y: 37,
	r: 24.5,
	rim: 21.4,
	tally: 16.8,
	moons: 10,
	sun: 9,
	face: 5.2,
};

/** Where the moons sit: their distance from the centre and their own radius. */
const MOON = { ring: 13.4, r: 3 };

/** The way the light comes: from the sun just above the horizon, almost level from the left. */
const LIGHT = normalise(-1, -0.08);

/** The sandstone of the disc, warmed by the dawn on its lit side and purple in its shadows. */
const SANDSTONE = /** @type {Ramp} */ ([
	mix(C.sandLight, C.lampGlow, 0.5),
	mix(C.sandLight, C.duskSky6, 0.3),
	mix(C.sand, C.duskSky6, 0.22),
	mix(C.sandShade, C.duskSky4, 0.35),
	mix(C.sandShade, C.duskSky2, 0.62),
]);

/** The gilding on the sun. */
const GILT = /** @type {Ramp} */ ([
	C.white,
	C.lampGlow,
	C.gold,
	C.amber,
	C.lampFrame,
]);

/** The pale inlay of the moons' lit parts. */
const SILVER = /** @type {Ramp} */ ([
	C.white,
	C.moon,
	mix(C.moon, C.stoneLight, 0.4),
	mix(C.stoneLight, C.duskSky4, 0.25),
	C.stone,
]);

/** The lapis inlay of the moons' band: a night blue the pale moons stand out against. */
const LAPIS = /** @type {Ramp} */ ([
	mix(C.roofLight, C.daySky3, 0.35),
	mix(C.roofLight, C.nightSea1, 0.55),
	mix(C.nightSea2, C.roof, 0.35),
	mix(C.nightSea3, C.roofShade, 0.45),
	mix(C.nightSky1, C.roofShade, 0.3),
]);

/** The temple wall's stone, from lit to shaded. */
const WALL = {
	glint: mix(C.stoneLight, C.duskSky6, 0.45),
	lit: mix(C.stoneLight, C.duskSky5, 0.25),
	base: mix(C.stone, C.duskSky4, 0.2),
	shade: mix(C.stoneShade, C.duskSky3, 0.3),
	joint: mix(C.stoneShade, C.roofShade, 0.6),
};

/**
 * Draws the Calendar tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(335);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	const sun = { x: findSun(layer), y: HORIZON };
	drawView(layer);
	drawWall(layer, random);
	drawCornice(layer);
	drawVine(layer);
	drawDiscShadow(layer);

	drawDisc(scene, random);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: sun.x,
		y: sun.y,
		radius: 48,
		colour: C.gold,
		strength: 0.34,
		steps: 4,
		skip: [C.ink, ...SANDSTONE, ...GILT, ...SILVER, ...LAPIS],
	});
	drawGleams(scene);
	return scene;
}

/**
 * Makes a vector one pixel long.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function normalise(x, y) {
	const length = Math.hypot(x, y);
	return { x: x / length, y: y / length };
}

/**
 * Finds the column of the sun the sky part set on the horizon, beyond the wall's end.
 * @param {Canvas} layer
 * @returns {number}
 */
function findSun(layer) {
	for (let x = 0; x < 64; x++) {
		if (get(layer, x, HORIZON) === C.lampGlow) {
			return x + 3;
		}
	}
	return 10;
}

/**
 * The view past the wall's end: a plain below the sunrise, and the parapet of the temple's terrace in front.
 * @param {Canvas} layer
 */
function drawView(layer) {
	const plain = [
		mix(C.duskSky6, C.gold, 0.35),
		mix(C.grassShade, C.duskSky4, 0.45),
		mix(C.forestFloorShade, C.duskSky3, 0.4),
		mix(C.forestFloorShade, C.duskSky2, 0.55),
	];
	for (let y = HORIZON + 1; y < 64; y++) {
		const band =
			y === HORIZON + 1
				? 0
				: y < HORIZON + 4
					? 1
					: y < HORIZON + 8
						? 2
						: 3;
		for (let x = 0; x < WALL_X; x++) {
			set(layer, x, y, plain[band]);
		}
	}
	// Far trees dotted along the plain.
	for (const [x, y] of [
		[1, 46],
		[2, 46],
		[2, 45],
		[12, 46],
		[13, 46],
		[13, 45],
	]) {
		set(layer, x, y, plain[3]);
	}
	// The terrace parapet: a coping lit by the sun, and the stones under it.
	for (let y = 56; y < 64; y++) {
		for (let x = 0; x < WALL_X; x++) {
			let colour = WALL.base;
			if (y === 56) {
				colour = WALL.glint;
			} else if (y === 57) {
				colour = WALL.shade;
			} else if (y === 58 || (x + (y > 60 ? 4 : 0)) % 8 === 7) {
				colour = WALL.joint;
			} else if (x % 8 === 0) {
				colour = WALL.lit;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The temple wall: courses of squared stone blocks, each lit along its left and top edges, with its end catching the sun.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	const course = 7;
	const block = 13;
	const first = WALL_TOP + 7;
	for (let y = first; y < 64; y++) {
		const row = Math.floor((y - first) / course);
		const yIn = (y - first) % course;
		const offset = row % 2 ? 6 : 0;
		for (let x = WALL_X; x < 64; x++) {
			const xIn = (x - WALL_X + offset) % block;
			let colour = WALL.base;
			if (yIn === course - 1 || xIn === block - 1) {
				colour = WALL.joint;
			} else if (xIn === 0 || yIn === 0) {
				colour = WALL.lit;
			} else if (yIn === course - 2 || xIn === block - 2) {
				colour = WALL.shade;
			}
			set(layer, x, y, colour);
		}
	}
	// The wall's end, square to the sun.
	for (let y = first; y < 64; y++) {
		set(layer, WALL_X, y, WALL.glint);
		set(
			layer,
			WALL_X + 1,
			y,
			(y - first) % course === course - 1 ? WALL.joint : WALL.lit
		);
	}
	// Chips and weathering on the blocks.
	for (let i = 0; i < 50; i++) {
		const x = WALL_X + 2 + Math.floor(random() * (62 - WALL_X));
		const y = first + Math.floor(random() * (64 - first));
		if (get(layer, x, y) === WALL.base) {
			set(layer, x, y, random() < 0.5 ? WALL.shade : WALL.lit);
		}
	}
}

/**
 * The cornice along the top of the wall: a lit ledge, its shadowed underside and a row of dentils, its end standing proud of the wall.
 * @param {Canvas} layer
 */
function drawCornice(layer) {
	const x0 = WALL_X - 2;
	const w = 64 - x0;
	rect(layer, x0, WALL_TOP, w, 1, WALL.glint);
	rect(layer, x0, WALL_TOP + 1, w, 1, WALL.lit);
	rect(layer, x0, WALL_TOP + 2, w, 1, WALL.joint);
	for (let x = WALL_X; x < 64; x++) {
		const dentil = (x - WALL_X) % 4;
		set(
			layer,
			x,
			WALL_TOP + 3,
			dentil === 3 ? WALL.joint : dentil === 0 ? WALL.lit : WALL.base
		);
		set(layer, x, WALL_TOP + 4, dentil === 3 ? WALL.joint : WALL.shade);
	}
	rect(layer, WALL_X, WALL_TOP + 5, 64 - WALL_X, 1, WALL.joint);
	rect(layer, WALL_X, WALL_TOP + 6, 64 - WALL_X, 1, WALL.shade);
	// The ledge's end, lit full on by the sun.
	set(layer, x0, WALL_TOP, C.lampGlow);
	set(layer, x0, WALL_TOP + 1, WALL.glint);
	set(layer, x0 + 1, WALL_TOP + 2, WALL.shade);
}

/**
 * A vine trailing down the wall from the cornice near its end, its leaves catching the dawn.
 * @param {Canvas} layer
 */
function drawVine(layer) {
	const stem = mix(C.timberShade, C.duskSky2, 0.2);
	for (let y = WALL_TOP + 3; y <= 30; y++) {
		const x = 20 + Math.round(Math.sin(y * 0.45) * 1.6);
		set(layer, x, y, stem);
		if (y % 3 !== 0) {
			continue;
		}
		const side = y % 6 === 0 ? 1 : -1;
		set(
			layer,
			x + side,
			y,
			side < 0 ? mix(C.grassLight, C.gold, 0.3) : C.grass
		);
		set(layer, x + side * 2, y, side < 0 ? C.grass : C.grassShade);
		set(
			layer,
			x + side,
			y - 1,
			side < 0 ? mix(C.grassLight, C.gold, 0.45) : C.grass
		);
		set(layer, x + side * 2, y + 1, C.pineShade);
	}
}

/**
 * The shadow the disc throws on the wall, to the right of it, away from the low sun.
 * @param {Canvas} layer
 */
function drawDiscShadow(layer) {
	for (let y = WALL_TOP + 7; y < 64; y++) {
		for (let x = WALL_X + 2; x < 64; x++) {
			if (Math.hypot(x - DISC.x - 3, y - DISC.y) < DISC.r + 0.5) {
				set(layer, x, y, mix(WALL.joint, C.ink, 0.35));
			}
		}
	}
}

/**
 * How much a surface whose outward direction is (nx, ny) faces the sun, from 1 (straight at it) to -1.
 * @param {number} nx
 * @param {number} ny
 * @returns {number}
 */
function facing(nx, ny) {
	const length = Math.hypot(nx, ny) || 1;
	return (nx * LIGHT.x + ny * LIGHT.y) / length;
}

/**
 * Picks a colour from a ramp: 0 is the brightest, 4 the darkest.
 * @param {Ramp} ramp
 * @param {number} index
 * @returns {Colour}
 */
function pick(ramp, index) {
	return ramp[Math.max(0, Math.min(4, Math.round(index)))];
}

/**
 * The tone of a flat part of the disc: lit towards the sun, falling into shade across it, dithered where one gives way to the next.
 * @param {number} x
 * @param {number} y
 * @returns {number} An index into a ramp
 */
function flatTone(x, y) {
	const across =
		(facing(x - DISC.x, y - DISC.y) * Math.hypot(x - DISC.x, y - DISC.y)) /
		DISC.r;
	const t = 2.1 - across * 1.7;
	const index = Math.floor(t);
	return t - index > 0.6 && (x + y) % 2 === 0 ? index + 1 : index;
}

/**
 * Paints the disc: the rim, the bands for the tallies and the moons with a groove inside each, and the sun at the centre.
 * Each groove lies in shadow where the ring outside it stands between it and the sun, and its far wall catches the light.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawDisc(scene, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - DISC.x;
			const dy = y - DISC.y;
			const d = Math.hypot(dx, dy);
			if (d >= DISC.r) {
				continue;
			}
			const out = facing(dx, dy);
			const flat = flatTone(x, y);
			let index = flat;
			if (d >= DISC.r - 1.1) {
				// The rim's outer edge, rounded towards the sun.
				index = 2 - out * 2.2;
			} else if (d >= DISC.rim + 1) {
				index = flat - 1;
			} else if (d >= DISC.rim && d < DISC.rim + 1) {
				// The groove inside the rim, in the rim's shadow on the sun's side.
				index = flat + 1.5 + out * 0.9;
			} else if (d >= DISC.rim - 1 && d < DISC.rim) {
				// The groove's far wall, catching the light.
				index = flat - out * 1.2;
			} else if (d >= DISC.moons && d < DISC.tally) {
				// The lapis band, set a little below the stone round it, its edges shadowed on the sun's side.
				let lapis = flat + 0.5;
				if (d >= DISC.tally - 1) {
					lapis = 3 + out * 1.2;
				} else if (d < DISC.moons + 1) {
					lapis = 2 - out * 1.2;
				}
				set(scene, x, y, pick(LAPIS, lapis));
				continue;
			} else if (d < DISC.moons) {
				// The sunken field the sun's rays stand out from.
				index = flat + 1.6;
			}
			set(scene, x, y, pick(SANDSTONE, index));
		}
	}
	drawWear(scene, random);
	drawTallies(scene);
	drawMoons(scene);
	drawSun(scene);
}

/**
 * Age on the stone, kept to the rim so the tally notches stay clear: shallow pits, a chip and a hairline crack.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawWear(scene, random) {
	for (let i = 0; i < 30; i++) {
		const angle = random() * Math.PI * 2;
		const reach = DISC.rim + 1.2 + random() * 1.6;
		const x = Math.round(DISC.x + Math.cos(angle) * reach);
		const y = Math.round(DISC.y + Math.sin(angle) * reach);
		const here = get(scene, x, y);
		const index = here ? SANDSTONE.indexOf(here) : -1;
		if (index >= 0 && index <= 2) {
			set(scene, x, y, SANDSTONE[index + 1]);
		}
	}
	// The crack, running in from the rim's edge at the top.
	for (const [dx, dy] of [
		[-6, -24],
		[-6, -23],
		[-5, -22],
	]) {
		set(scene, DISC.x + dx, DISC.y + dy, SANDSTONE[4]);
		set(scene, DISC.x + dx - 1, DISC.y + dy, SANDSTONE[0]);
	}
	// A chip out of the rim at the lower left.
	for (const [dx, dy] of [
		[-17, 17],
		[-16, 17],
		[-17, 16],
	]) {
		set(scene, DISC.x + dx, DISC.y + dy, SANDSTONE[4]);
	}
	set(scene, DISC.x - 18, DISC.y + 16, SANDSTONE[0]);
}

/**
 * The tally notches round the outer band: plain radial cuts in shadow, every fifth one longer.
 * @param {Canvas} scene
 */
function drawTallies(scene) {
	const count = 30;
	for (let k = 0; k < count; k++) {
		const angle = ((k + 0.5) / count) * Math.PI * 2;
		const long = k % 5 === 0;
		const inner = long ? DISC.tally + 1.4 : DISC.tally + 2.2;
		const outer = long ? DISC.rim - 0.6 : DISC.rim - 1.4;
		const cx = Math.cos(angle);
		const cy = Math.sin(angle);
		for (let r = inner; r <= outer; r += 0.4) {
			set(
				scene,
				Math.round(DISC.x + cx * r),
				Math.round(DISC.y + cy * r),
				SANDSTONE[4]
			);
		}
	}
}

/**
 * The ring of moons on the lapis band: eight phases, full at the top, waning round the right to new at the bottom
 * and waxing back up the left. The lit part of each is a pale inlay; the rest is a faint ring in the lapis.
 * @param {Canvas} scene
 */
function drawMoons(scene) {
	for (let k = 0; k < 8; k++) {
		const at = -Math.PI / 2 + (k * Math.PI) / 4;
		const mx = DISC.x + Math.cos(at) * MOON.ring;
		const my = DISC.y + Math.sin(at) * MOON.ring;
		// How full this phase is: 1 at the top, 0 at the bottom.
		const fullness = 1 - Math.min(k, 8 - k) / 4;
		const reach = Math.ceil(MOON.r) + 1;
		for (let y = Math.floor(my) - reach; y <= Math.ceil(my) + reach; y++) {
			for (
				let x = Math.floor(mx) - reach;
				x <= Math.ceil(mx) + reach;
				x++
			) {
				const u = (x - mx) / MOON.r;
				const v = (y - my) / MOON.r;
				const e = u * u + v * v;
				if (e >= 1) {
					continue;
				}
				const edge =
					Math.cos(fullness * Math.PI) * Math.sqrt(1 - v * v);
				// Waning moons keep their left side lit, waxing ones their right.
				const side = k <= 4 ? -u : u;
				if (side > edge) {
					set(scene, x, y, pick(SILVER, 1.4 - facing(u, v) * 1.4));
				} else {
					set(scene, x, y, pick(LAPIS, e > 0.55 ? 1 : 4));
				}
			}
		}
	}
}

/**
 * The sun at the centre: a gilded face with carved eyes, nose and smile inside a dark groove,
 * and eight gilded rays, long at the quarters and short between, standing out from the dark sunken field.
 * @param {Canvas} scene
 */
function drawSun(scene) {
	const { x: cx, y: cy } = DISC;
	for (let k = 0; k < 8; k++) {
		const angle = (k * Math.PI) / 4;
		const ax = Math.cos(angle);
		const ay = Math.sin(angle);
		const tip = k % 2 === 0 ? DISC.sun + 0.6 : DISC.sun - 1;
		const base = DISC.face - 0.5;
		for (let y = cy - 10; y <= cy + 10; y++) {
			for (let x = cx - 10; x <= cx + 10; x++) {
				const dx = x - cx;
				const dy = y - cy;
				const along = dx * ax + dy * ay;
				const across = -dx * ay + dy * ax;
				const half = 1.7 * ((tip - along) / (tip - base)) + 0.25;
				if (along < base || along > tip || Math.abs(across) > half) {
					continue;
				}
				// Each ray is a ridge: its side towards the sun lit, the other in the gilding's own tone.
				const side = across < 0 ? -1 : 1;
				const lit = facing(-ay * side, ax * side) > 0;
				set(scene, x, y, pick(GILT, lit ? 1 : 2.6));
			}
		}
	}
	for (let y = cy - 6; y <= cy + 6; y++) {
		for (let x = cx - 6; x <= cx + 6; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d >= DISC.face) {
				continue;
			}
			if (d >= DISC.face - 0.9) {
				// The groove round the face.
				set(scene, x, y, pick(GILT, 4));
				continue;
			}
			// The face, rounded like a dome towards the sun.
			const dome = facing(dx, dy) * (d / DISC.face);
			set(scene, x, y, pick(GILT, 2 - dome * 2.4));
		}
	}
	for (const [dx, dy, tone] of [
		[-2, -1, 4],
		[2, -1, 4],
		[0, 0, 3],
		[0, 1, 3],
		[-2, 2, 3],
		[2, 2, 3],
		[-1, 3, 4],
		[0, 3, 4],
		[1, 3, 4],
	]) {
		set(scene, cx + dx, cy + dy, pick(GILT, tone));
	}
}

/**
 * The brightest glints of the rising sun on the rim and the gilding, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [dx, dy] of [
		[-24, -2],
		[-24, -1],
		[-24, 0],
		[-4, 1],
	]) {
		set(scene, DISC.x + dx, DISC.y + dy, C.white);
	}
}
