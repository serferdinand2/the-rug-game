// Commercial Center: inside a covered galleria, a glass-and-iron vault receding over shopfronts and shoppers on a tiled floor.
import {
	createCanvas,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The view: the vanishing point, and the focal length that sets how wide the near end looks.
 * The arcade is measured in its own units: the walls stand at X = -1 and 1, the floor lies at Y = 1,
 * the vault springs from the cornice at Y = SPRING, and Z runs away from the viewer to the far end.
 */
const VX = 31.5;
const VY = 26.5;
const FOCAL = 33;
const SPRING = -0.5;
const FAR = 5.2;

/** The bays along each side: one shop to each unit of depth. */
const BAY = 1;

/** Each shop's fascia colour, from the nearest bay back. */
const FASCIA = [
	[C.brickRed, C.pine, C.roofLight, C.amber, C.daySea2],
	[C.pine, C.brickRed, C.daySea2, C.roofLight, C.amber],
];

/** The cream stone of the arcade, the iron of its vault, its glass and its floor. */
const STONE = {
	light: C.creamLight,
	main: C.cream,
	shade: C.creamShade,
	deep: mix(C.creamShade, C.plasterShade, 0.5),
};
const IRON = {
	main: mix(C.roof, C.pineShade, 0.35),
	light: mix(C.roofLight, C.pine, 0.3),
};
const GLASS = {
	pale: mix(C.daySky6, C.white, 0.35),
	main: C.daySky5,
	deep: C.daySky4,
	shop: mix(C.daySky4, C.daySky3, 0.5),
	shopShade: mix(C.daySky2, C.daySea3, 0.35),
};
const TILE = {
	light: C.cream,
	dark: mix(C.creamShade, C.brickRed, 0.22),
	far: mix(C.cream, C.creamShade, 0.55),
};

/**
 * What a ray from one pixel hits.
 * @typedef {Object} Hit
 * @property {'floor' | 'wall' | 'vault' | 'end'} surface
 * @property {number} z - The depth of the hit
 * @property {number} X - Across the arcade, from -1 at the left wall to 1 at the right
 * @property {number} Y - Down the arcade, from the vault's apex above to the floor at 1
 */

/**
 * Draws the Commercial Center scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(853);

	drawArcade(layer);

	drawCrowd(scene, { x: 5, y: 61, count: 3, random, facing: 'right' });
	drawCrowd(scene, { x: 49, y: 58, count: 2, random, facing: 'left' });
	outline(scene, C.ink);
	underlay(scene, layer);
	drawFarShoppers(scene);
	drawBags(scene);
	return scene;
}

/**
 * Casts a ray through the centre of a pixel and finds the nearest surface it meets.
 * @param {number} px
 * @param {number} py
 * @returns {Hit}
 */
function cast(px, py) {
	const a = (px + 0.5 - VX) / FOCAL;
	const b = (py + 0.5 - VY) / FOCAL;
	/** @type {Hit[]} */
	const hits = [];
	if (b > 0) {
		const z = 1 / b;
		if (Math.abs(a * z) <= 1) {
			hits.push({ surface: 'floor', z, X: a * z, Y: 1 });
		}
	}
	if (a !== 0) {
		const z = 1 / Math.abs(a);
		const Y = b * z;
		if (Y >= SPRING && Y <= 1) {
			hits.push({ surface: 'wall', z, X: Math.sign(a), Y });
		}
	}
	// The barrel vault: a half cylinder of radius 1 around the axis at Y = SPRING.
	const qa = a * a + b * b;
	const qb = 2 * b * -SPRING;
	const qc = SPRING * SPRING - 1;
	const root = Math.sqrt(qb * qb - 4 * qa * qc);
	const zv = (-qb + root) / (2 * qa);
	if (b * zv <= SPRING) {
		hits.push({ surface: 'vault', z: zv, X: a * zv, Y: b * zv });
	}
	const nearest = hits.sort((p, q) => p.z - q.z)[0];
	if (!nearest || nearest.z > FAR) {
		return { surface: 'end', z: FAR, X: a * FAR, Y: b * FAR };
	}
	return nearest;
}

/**
 * Paints the arcade pixel by pixel from what each pixel's ray meets. Joints, ribs and bars fall where a pixel
 * and its neighbour one step nearer the vanishing point, across or down, lie in different bands.
 * @param {Canvas} layer
 */
function drawArcade(layer) {
	const hits = Array.from({ length: 64 * 64 }, (_, i) =>
		cast(i % 64, Math.floor(i / 64))
	);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const across = hits[y * 64 + clamp(x + (x < VX ? 1 : -1))];
			const down = hits[clamp(y + (y < VY ? 1 : -1)) * 64 + x];
			set(layer, x, y, shade(hits[y * 64 + x], across, down));
		}
	}
}

/**
 * Keeps a coordinate on the canvas.
 * @param {number} n
 * @returns {number}
 */
function clamp(n) {
	return Math.max(0, Math.min(63, n));
}

/**
 * The colour of one surface point.
 * @param {Hit} hit
 * @param {Hit} across - The hit one pixel nearer the vanishing point, across
 * @param {Hit} down - The hit one pixel nearer the vanishing point, up or down
 * @returns {Colour}
 */
function shade(hit, across, down) {
	if (hit.surface === 'floor') {
		return floor(hit, down);
	}
	if (hit.surface === 'wall') {
		return wall(hit, across);
	}
	if (hit.surface === 'vault') {
		return vault(hit, across, down);
	}
	return end(hit);
}

/**
 * The floor: a checkerboard of cream and terracotta tiles, melting into one tone in the distance,
 * with the light from the far end gleaming down its middle.
 * @param {Hit} hit
 * @param {Hit} next
 * @returns {Colour}
 */
function floor({ z, X }, next) {
	const size = 0.25;
	const checker = (Math.floor(X / size + 8) + Math.floor(z / size)) % 2 === 0;
	let colour = checker ? TILE.light : TILE.dark;
	if (z > 3.2) {
		colour = TILE.far;
	}
	if (Math.abs(X) < 0.12 && z > 1.6) {
		colour = mix(colour, C.white, 0.45);
	}
	// The skirting where the floor meets the shopfronts.
	if (Math.abs(X) > 0.96 || next.surface !== 'floor') {
		colour = mix(colour, C.creamShade, 0.6);
	}
	return colour;
}

/**
 * A side wall: shopfronts below, each a coloured fascia over a window of wares and a door,
 * then a cornice and an arched window above each bay. The right wall stands in a little shade.
 * @param {Hit} hit
 * @param {Hit} next - The hit one pixel nearer the vanishing point
 * @returns {Colour}
 */
function wall({ z, X, Y }, next) {
	const side = X < 0 ? 0 : 1;
	const bay = Math.floor(z / BAY);
	const along = z / BAY - bay;
	const joint = next.surface !== 'wall' || Math.floor(next.z / BAY) !== bay;
	const dim = (/** @type {Colour} */ colour) =>
		side ? mix(colour, C.plasterShade, 0.2) : colour;
	// The pilasters between the bays.
	if (joint || along < 0.08) {
		return dim(joint ? STONE.light : STONE.main);
	}
	// The cornice under the vault.
	if (Y < SPRING + 0.06) {
		return dim(STONE.light);
	}
	if (Y < SPRING + 0.11) {
		return dim(STONE.deep);
	}
	// The upper storey: an arched window in each bay over a balcony rail.
	if (Y < 0.03) {
		const centre = Math.abs(along - 0.5);
		const archTop = -0.34 + centre * centre * 4;
		if (centre < 0.22 && Y > archTop && Y < -0.07) {
			return Y < archTop + 0.07
				? GLASS.main
				: dim(mix(C.roof, C.daySea3, 0.4));
		}
		if (Y > -0.03) {
			return IRON.main;
		}
		return dim(STONE.main);
	}
	// The fascia carrying the shop's colour, edged in shadow.
	if (Y < 0.2) {
		if (Y < 0.07 || Y > 0.17) {
			return dim(STONE.deep);
		}
		return dim(FASCIA[side][Math.min(bay, 4)]);
	}
	// The plinth.
	if (Y > 0.9) {
		return dim(STONE.deep);
	}
	// The door, in the far part of the bay: dark wood with a glazed top.
	if (along > 0.7) {
		if (along < 0.74 || along > 0.95 || Y < 0.27) {
			return dim(STONE.shade);
		}
		return Y < 0.5 ? GLASS.shopShade : C.timberShade;
	}
	// The window's dark wooden frame, with a mullion down the middle.
	if (
		Y < 0.26 ||
		along < 0.13 ||
		along > 0.66 ||
		Math.abs(along - 0.4) < 0.015
	) {
		return dim(Y < 0.26 || along > 0.66 ? STONE.shade : C.timber);
	}
	// A glint across the glass.
	if (Math.abs(along * 1.6 - (Y - 0.26) - 0.32) < 0.05 && Y < 0.62) {
		return C.white;
	}
	// A shelf of wares at the foot of the window, in alternating colours.
	if (Y > 0.66 && Y < 0.82) {
		const item = Math.floor((along - 0.13) / 0.11);
		const wares = [
			C.brickRedLight,
			C.gold,
			C.grassLight,
			C.roofLight,
			C.daySea1,
		];
		return (along - 0.13) % 0.11 < 0.08
			? wares[(item + bay * 2 + side) % wares.length]
			: GLASS.shopShade;
	}
	return dim(Y < 0.4 ? GLASS.shop : GLASS.shopShade);
}

/**
 * The vault: glass panes between iron ribs, its transverse arches every half bay and its glazing bars running to the far end.
 * @param {Hit} hit
 * @param {Hit} across
 * @param {Hit} down
 * @returns {Colour}
 */
function vault(hit, across, down) {
	const rib = (/** @type {Hit} */ h) => Math.floor(h.z / 0.55);
	const bar = (/** @type {Hit} */ h) =>
		Math.floor(Math.atan2(h.X, -(h.Y - SPRING)) / 0.3 + 0.5);
	const others = [across, down].filter((h) => h.surface === 'vault');
	if (others.some((h) => rib(h) !== rib(hit)) && hit.z < 4.2) {
		return IRON.main;
	}
	if (others.some((h) => bar(h) !== bar(hit))) {
		return IRON.light;
	}
	const angle = Math.abs(Math.atan2(hit.X, -(hit.Y - SPRING)));
	return angle < 0.5 ? GLASS.pale : angle < 1.1 ? GLASS.main : GLASS.deep;
}

/**
 * The far end: a stone front with a tall arched opening onto bright daylight, and a glazed lunette above it.
 * @param {Hit} hit
 * @returns {Colour}
 */
function end({ X, Y }) {
	const top = -0.05;
	const half = 0.55;
	const inArch =
		Math.abs(X) < half && (Y > top || Math.hypot(X, Y - top) < half);
	if (inArch) {
		return Y > 0.8
			? mix(C.sandLight, C.white, 0.3)
			: Y > 0.45
				? mix(C.daySky6, C.white, 0.5)
				: C.white;
	}
	if (Y < SPRING) {
		return GLASS.pale;
	}
	return Math.abs(X) < half + 0.12 && Y > top - half - 0.1
		? STONE.light
		: STONE.shade;
}

/**
 * Shoppers further down the arcade, smaller with distance and painted without an outline so they stay light.
 * @param {Canvas} scene
 */
function drawFarShoppers(scene) {
	for (const [
		x,
		y,
		clothes,
		rows,
	] of /** @type {[number, number, Colour, string[]][]} */ ([
		[20, 41, C.daySea2, ['h.', 'ss', 'cc', 'cc', 'cc', 'll']],
		[41, 40, C.brickRed, ['.h', 'ss', 'cc', 'cc', 'cc', 'll']],
		[26, 34, C.pine, ['h', 'c', 'c', 'l']],
		[37, 34, C.amber, ['h', 'c', 'c', 'l']],
		[30, 32, C.roofLight, ['h', 'c', 'l']],
	])) {
		paint(scene, x, y, rows, {
			h: C.wood,
			s: C.skin,
			c: clothes,
			l: C.roofShade,
		});
	}
}

/**
 * Shopping bags in the near shoppers' hands, painted after the outline with their own ink edge.
 * @param {Canvas} scene
 */
function drawBags(scene) {
	for (const [x, y, colour] of /** @type {[number, number, Colour][]} */ ([
		[2, 56, C.gold],
		[54, 53, C.brickRedLight],
	])) {
		paint(scene, x, y, ['.k.', 'kbk', 'kbk', 'kkk'], {
			k: C.ink,
			b: colour,
		});
	}
}
